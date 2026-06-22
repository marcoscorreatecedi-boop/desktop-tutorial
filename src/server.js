require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');
const { sendTextMessage } = require('./whatsapp');
const { classifyMessage } = require('./classify');
const bot = require('./bot');
const { FUNNEL_STAGES, SOURCES } = require('./constants');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const SLA_MINUTOS = Number(process.env.SLA_MINUTOS || 15);

function getOrCreateContact(waId, name) {
  const existing = db.prepare('SELECT * FROM contacts WHERE wa_id = ?').get(waId);
  if (existing) return existing;
  const { lastInsertRowid } = db
    .prepare('INSERT INTO contacts (wa_id, name) VALUES (?, ?)')
    .run(waId, name || waId);
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(lastInsertRowid);
}

function getOpenConversation(contactId) {
  return db
    .prepare("SELECT * FROM conversations WHERE contact_id = ? AND status != 'resolvida' ORDER BY id DESC LIMIT 1")
    .get(contactId);
}

function nextAgentRoundRobin() {
  const agents = db.prepare('SELECT * FROM agents WHERE active = 1 ORDER BY id').all();
  if (agents.length === 0) return null;
  const row = db
    .prepare(
      `SELECT agent_id, COUNT(*) as total FROM conversations
       WHERE status != 'resolvida' AND agent_id IS NOT NULL
       GROUP BY agent_id ORDER BY total ASC LIMIT 1`
    )
    .get();
  if (!row) return agents[0].id;
  const leastBusyId = row.agent_id;
  const assignedIds = new Set(
    db.prepare("SELECT DISTINCT agent_id FROM conversations WHERE status != 'resolvida' AND agent_id IS NOT NULL").all().map((r) => r.agent_id)
  );
  const idle = agents.find((a) => !assignedIds.has(a.id));
  return idle ? idle.id : leastBusyId;
}

function extractText(msg) {
  if (msg.type === 'text') return msg.text?.body || '';
  if (msg.type === 'interactive') return msg.interactive?.list_reply?.title || msg.interactive?.button_reply?.title || '';
  if (msg.type === 'button') return msg.button?.text || '';
  return '';
}

// --- Webhook verification (Meta) ---
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// --- Webhook: incoming messages ---
app.post('/webhook', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const messages = change?.messages;
    if (!messages) return res.sendStatus(200);

    for (const msg of messages) {
      const waId = msg.from;
      const text = extractText(msg);
      const contactName = change.contacts?.[0]?.profile?.name;

      const contact = getOrCreateContact(waId, contactName);
      let conversation = getOpenConversation(contact.id);
      let isNewConversation = false;

      if (!conversation) {
        isNewConversation = true;
        const category = classifyMessage(text) || 'sem_classificacao';
        const agentId = nextAgentRoundRobin();
        const { lastInsertRowid } = db
          .prepare(
            `INSERT INTO conversations (contact_id, status, category, agent_id, last_message_at, last_inbound_at, bot_state)
             VALUES (?, 'aberta', ?, ?, datetime('now'), datetime('now'), 'novo')`
          )
          .run(contact.id, category, agentId);
        conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(lastInsertRowid);
      } else {
        db.prepare(
          "UPDATE conversations SET last_message_at = datetime('now'), last_inbound_at = datetime('now'), status = 'aberta' WHERE id = ?"
        ).run(conversation.id);
        if (conversation.category === 'sem_classificacao') {
          const category = classifyMessage(text);
          if (category) db.prepare('UPDATE conversations SET category = ? WHERE id = ?').run(category, conversation.id);
        }
      }

      db.prepare(
        "INSERT INTO messages (conversation_id, direction, body, wa_message_id) VALUES (?, 'inbound', ?, ?)"
      ).run(conversation.id, text, msg.id);

      if (conversation.bot_state !== 'concluido') {
        try {
          await bot.processarMensagem({ conversation, contact, msg, text, referral: msg.referral });
        } catch (err) {
          console.error('Erro no bot:', err.response?.data || err.message);
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Erro no webhook:', err);
    res.sendStatus(200);
  }
});

// --- API: listar conversas/leads (com filtros) ---
app.get('/api/conversations', (req, res) => {
  const { status, category, agent_id, funnel_stage, empreendimento_id, source } = req.query;
  let query = `
    SELECT c.*, ct.name as contact_name, ct.wa_id, a.name as agent_name, e.nome as empreendimento_nome
    FROM conversations c
    JOIN contacts ct ON ct.id = c.contact_id
    LEFT JOIN agents a ON a.id = c.agent_id
    LEFT JOIN empreendimentos e ON e.id = c.empreendimento_id
    WHERE 1=1
  `;
  const params = [];
  if (status) { query += ' AND c.status = ?'; params.push(status); }
  if (category) { query += ' AND c.category = ?'; params.push(category); }
  if (agent_id) { query += ' AND c.agent_id = ?'; params.push(agent_id); }
  if (funnel_stage) { query += ' AND c.funnel_stage = ?'; params.push(funnel_stage); }
  if (empreendimento_id) { query += ' AND c.empreendimento_id = ?'; params.push(empreendimento_id); }
  if (source) { query += ' AND c.source = ?'; params.push(source); }
  query += ' ORDER BY c.last_message_at DESC';
  res.json(db.prepare(query).all(...params));
});

app.get('/api/conversations/:id/messages', (req, res) => {
  res.json(db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC').all(req.params.id));
});

app.post('/api/conversations/:id/reply', async (req, res) => {
  const { body } = req.body;
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conversation) return res.status(404).json({ error: 'Conversa não encontrada' });
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(conversation.contact_id);

  try {
    await sendTextMessage(contact.wa_id, body);
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err.response?.data || err.message);
    return res.status(502).json({ error: 'Falha ao enviar via WhatsApp Cloud API' });
  }

  db.prepare("INSERT INTO messages (conversation_id, direction, body) VALUES (?, 'outbound', ?)").run(conversation.id, body);
  db.prepare(
    `UPDATE conversations SET last_message_at = datetime('now'), status = 'pendente',
     first_response_at = COALESCE(first_response_at, datetime('now')) WHERE id = ?`
  ).run(conversation.id);

  res.json({ ok: true });
});

app.post('/api/conversations/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['aberta', 'pendente', 'resolvida'].includes(status)) return res.status(400).json({ error: 'Status inválido' });
  const resolvedAt = status === 'resolvida' ? "datetime('now')" : 'resolved_at';
  db.prepare(`UPDATE conversations SET status = ?, resolved_at = ${resolvedAt} WHERE id = ?`).run(status, req.params.id);
  res.json({ ok: true });
});

app.post('/api/conversations/:id/category', (req, res) => {
  const { category } = req.body;
  db.prepare('UPDATE conversations SET category = ? WHERE id = ?').run(category, req.params.id);
  res.json({ ok: true });
});

app.post('/api/conversations/:id/assign', (req, res) => {
  const { agent_id } = req.body;
  db.prepare('UPDATE conversations SET agent_id = ? WHERE id = ?').run(agent_id, req.params.id);
  res.json({ ok: true });
});

app.post('/api/conversations/:id/funnel', (req, res) => {
  const { funnel_stage } = req.body;
  if (!FUNNEL_STAGES.some((s) => s.id === funnel_stage)) return res.status(400).json({ error: 'Etapa inválida' });
  const resolvedAt = ['ganho', 'perdido'].includes(funnel_stage) ? "datetime('now')" : 'resolved_at';
  db.prepare(`UPDATE conversations SET funnel_stage = ?, resolved_at = ${resolvedAt} WHERE id = ?`).run(funnel_stage, req.params.id);
  res.json({ ok: true });
});

app.post('/api/conversations/:id/empreendimento', (req, res) => {
  const { empreendimento_id } = req.body;
  db.prepare('UPDATE conversations SET empreendimento_id = ? WHERE id = ?').run(empreendimento_id || null, req.params.id);
  res.json({ ok: true });
});

app.post('/api/conversations/:id/source', (req, res) => {
  const { source } = req.body;
  if (!SOURCES.some((s) => s.id === source)) return res.status(400).json({ error: 'Origem inválida' });
  db.prepare('UPDATE conversations SET source = ? WHERE id = ?').run(source, req.params.id);
  res.json({ ok: true });
});

// --- API: agentes ---
app.get('/api/agents', (req, res) => res.json(db.prepare('SELECT * FROM agents').all()));
app.post('/api/agents', (req, res) => {
  const { name } = req.body;
  const { lastInsertRowid } = db.prepare('INSERT INTO agents (name) VALUES (?)').run(name);
  res.json(db.prepare('SELECT * FROM agents WHERE id = ?').get(lastInsertRowid));
});

// --- API: empreendimentos ---
app.get('/api/empreendimentos', (req, res) => res.json(db.prepare('SELECT * FROM empreendimentos ORDER BY nome').all()));
app.post('/api/empreendimentos', (req, res) => {
  const { nome } = req.body;
  const { lastInsertRowid } = db.prepare('INSERT INTO empreendimentos (nome) VALUES (?)').run(nome);
  res.json(db.prepare('SELECT * FROM empreendimentos WHERE id = ?').get(lastInsertRowid));
});
app.post('/api/empreendimentos/:id/ativo', (req, res) => {
  const { ativo } = req.body;
  db.prepare('UPDATE empreendimentos SET ativo = ? WHERE id = ?').run(ativo ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

// --- API: respostas rápidas ---
app.get('/api/quick-replies', (req, res) => res.json(db.prepare('SELECT * FROM quick_replies').all()));
app.post('/api/quick-replies', (req, res) => {
  const { shortcut, body } = req.body;
  db.prepare('INSERT OR REPLACE INTO quick_replies (shortcut, body) VALUES (?, ?)').run(shortcut, body);
  res.json({ ok: true });
});

// --- API: constantes (funil / origens) ---
app.get('/api/constants', (req, res) => res.json({ FUNNEL_STAGES, SOURCES }));

// --- API: métricas ---
app.get('/api/metrics', (req, res) => {
  const totalAbertas = db.prepare("SELECT COUNT(*) as n FROM conversations WHERE status = 'aberta'").get().n;
  const totalPendentes = db.prepare("SELECT COUNT(*) as n FROM conversations WHERE status = 'pendente'").get().n;
  const totalResolvidas = db.prepare("SELECT COUNT(*) as n FROM conversations WHERE status = 'resolvida'").get().n;
  const total = totalAbertas + totalPendentes + totalResolvidas;

  const tempoMedioRespostaMin = db
    .prepare(
      `SELECT AVG((julianday(first_response_at) - julianday(created_at)) * 24 * 60) as media
       FROM conversations WHERE first_response_at IS NOT NULL`
    )
    .get().media;

  const tempoMedioResolucaoMin = db
    .prepare(
      `SELECT AVG((julianday(resolved_at) - julianday(created_at)) * 24 * 60) as media
       FROM conversations WHERE resolved_at IS NOT NULL`
    )
    .get().media;

  const porCategoria = db.prepare('SELECT category, COUNT(*) as total FROM conversations GROUP BY category').all();

  const volumePorDia = db
    .prepare(
      `SELECT date(created_at) as dia, COUNT(*) as total FROM conversations
       GROUP BY date(created_at) ORDER BY dia DESC LIMIT 14`
    )
    .all();

  const atrasadas = db
    .prepare(
      `SELECT COUNT(*) as n FROM conversations
       WHERE status != 'resolvida' AND last_inbound_at IS NOT NULL
       AND (julianday('now') - julianday(last_inbound_at)) * 24 * 60 > ?
       AND (first_response_at IS NULL OR last_message_at = last_inbound_at)`
    )
    .get(SLA_MINUTOS).n;

  const porFunil = db.prepare('SELECT funnel_stage, COUNT(*) as total FROM conversations GROUP BY funnel_stage').all();

  const porFonte = db.prepare('SELECT source, COUNT(*) as total FROM conversations GROUP BY source').all();

  const porEmpreendimento = db
    .prepare(
      `SELECT e.nome as empreendimento, COUNT(*) as total,
        SUM(CASE WHEN c.funnel_stage = 'ganho' THEN 1 ELSE 0 END) as ganhos
       FROM conversations c JOIN empreendimentos e ON e.id = c.empreendimento_id
       GROUP BY e.id ORDER BY total DESC`
    )
    .all();

  const totalLeads = porFunil.reduce((acc, f) => acc + f.total, 0);
  const totalGanhos = porFunil.find((f) => f.funnel_stage === 'ganho')?.total || 0;

  res.json({
    total,
    totalAbertas,
    totalPendentes,
    totalResolvidas,
    taxaResolucao: total ? Math.round((totalResolvidas / total) * 100) : 0,
    tempoMedioRespostaMin: tempoMedioRespostaMin ? Math.round(tempoMedioRespostaMin) : null,
    tempoMedioResolucaoMin: tempoMedioResolucaoMin ? Math.round(tempoMedioResolucaoMin) : null,
    porCategoria,
    volumePorDia,
    atrasadas,
    slaMinutos: SLA_MINUTOS,
    porFunil,
    porFonte,
    porEmpreendimento,
    taxaConversaoFunil: totalLeads ? Math.round((totalGanhos / totalLeads) * 100) : 0,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Painel de atendimento rodando em http://localhost:${PORT}`));
