const db = require('./db');
const { sendTextMessage, sendListMessage } = require('./whatsapp');

const MAX_RETRIES = 2;

function listaEmpreendimentosAtivos() {
  return db.prepare('SELECT * FROM empreendimentos WHERE ativo = 1 ORDER BY nome').all();
}

async function enviarMenuEmpreendimentos(waId) {
  const empreendimentos = listaEmpreendimentosAtivos();
  if (empreendimentos.length === 0) {
    await sendTextMessage(waId, 'Olá! Obrigado por entrar em contato. Em breve um consultor vai falar com você.');
    return false;
  }
  await sendListMessage(waId, {
    header: 'Bem-vindo(a)!',
    body: 'Sobre qual empreendimento você gostaria de saber mais?',
    buttonText: 'Escolher empreendimento',
    rows: empreendimentos.map((e) => ({ id: `emp_${e.id}`, title: e.nome })),
  });
  return true;
}

// Extrai o id do empreendimento escolhido a partir de uma resposta de lista interativa,
// ou tenta casar por texto livre com o nome do empreendimento.
function resolverEmpreendimento(msg, textoLivre) {
  if (msg.type === 'interactive' && msg.interactive?.list_reply?.id?.startsWith('emp_')) {
    const id = Number(msg.interactive.list_reply.id.replace('emp_', ''));
    return db.prepare('SELECT * FROM empreendimentos WHERE id = ?').get(id) || null;
  }
  const texto = (textoLivre || '').toLowerCase();
  const candidatos = listaEmpreendimentosAtivos();
  return candidatos.find((e) => texto.includes(e.nome.toLowerCase())) || null;
}

function mapSourceFromReferral(referral) {
  if (!referral) return null;
  if (referral.source_type === 'ad') return 'facebook_ads';
  if (referral.source_type === 'post' || referral.source_type === 'organic') return 'instagram';
  return 'outro';
}

/**
 * Roda o fluxo de triagem do bot para uma conversa nova/aguardando.
 * Retorna true se o bot tratou a mensagem (não precisa de humano ainda).
 */
async function processarMensagem({ conversation, contact, msg, text, referral }) {
  if (referral) {
    const source = mapSourceFromReferral(referral);
    if (source) db.prepare('UPDATE conversations SET source = ? WHERE id = ?').run(source, conversation.id);
  }

  if (conversation.bot_state === 'novo') {
    await enviarMenuEmpreendimentos(contact.wa_id);
    db.prepare("UPDATE conversations SET bot_state = 'aguardando_empreendimento' WHERE id = ?").run(conversation.id);
    return true;
  }

  if (conversation.bot_state === 'aguardando_empreendimento') {
    const empreendimento = resolverEmpreendimento(msg, text);
    if (empreendimento) {
      db.prepare(
        "UPDATE conversations SET empreendimento_id = ?, bot_state = 'concluido', funnel_stage = 'novo_lead' WHERE id = ?"
      ).run(empreendimento.id, conversation.id);
      await sendTextMessage(
        contact.wa_id,
        `Perfeito! Em breve um de nossos consultores vai falar com você sobre o ${empreendimento.nome}. 🙂`
      );
      return true;
    }

    const retries = conversation.bot_retries + 1;
    if (retries > MAX_RETRIES) {
      db.prepare("UPDATE conversations SET bot_state = 'concluido' WHERE id = ?").run(conversation.id);
      await sendTextMessage(contact.wa_id, 'Sem problemas, já vou te conectar com um de nossos consultores.');
      return true;
    }

    db.prepare('UPDATE conversations SET bot_retries = ? WHERE id = ?').run(retries, conversation.id);
    await sendTextMessage(contact.wa_id, 'Não consegui identificar a opção. Por favor escolha uma da lista abaixo:');
    await enviarMenuEmpreendimentos(contact.wa_id);
    return true;
  }

  return false; // bot já concluído, segue para atendimento humano
}

module.exports = { processarMensagem, enviarMenuEmpreendimentos };
