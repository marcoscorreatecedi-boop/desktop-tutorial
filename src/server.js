require('dotenv').config();
const path = require('path');
const express = require('express');
const { handleIncomingMessage } = require('./funnel');
const store = require('./store');
const { STAGES, STAGE_LABELS } = require('./stages');

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// Verificação do webhook exigida pela Meta ao configurar a integração.
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Recebimento de mensagens do WhatsApp Cloud API.
app.post('/webhook', (req, res) => {
  res.sendStatus(200); // a Meta exige resposta rápida; processamos de forma assíncrona

  const entry = req.body.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const messages = value?.messages;
  if (!messages) return;

  const contactName = value.contacts?.[0]?.profile?.name;

  for (const message of messages) {
    const text = message.text?.body;
    if (!text) continue;
    handleIncomingMessage({ from: message.from, name: contactName, text }).catch((err) => {
      console.error('Erro ao processar mensagem do WhatsApp:', err);
    });
  }
});

app.get('/api/contacts', (req, res) => {
  res.json({ stages: STAGES, stageLabels: STAGE_LABELS, contacts: store.listContacts() });
});

app.use('/dashboard', express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Dashboard do funil em http://localhost:${PORT}/dashboard`);
});
