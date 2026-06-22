const axios = require('axios');

const GRAPH_URL = 'https://graph.facebook.com/v20.0';

function client() {
  return axios.create({
    baseURL: `${GRAPH_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
  });
}

async function sendTextMessage(toWaId, text) {
  const api = client();
  return api.post('/messages', {
    messaging_product: 'whatsapp',
    to: toWaId,
    type: 'text',
    text: { body: text },
  });
}

// rows: [{ id, title, description? }] - max 10 itens por section
async function sendListMessage(toWaId, { header, body, buttonText, rows }) {
  const api = client();
  return api.post('/messages', {
    messaging_product: 'whatsapp',
    to: toWaId,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: header ? { type: 'text', text: header } : undefined,
      body: { text: body },
      action: {
        button: buttonText || 'Ver opções',
        sections: [{ title: 'Opções', rows }],
      },
    },
  });
}

module.exports = { sendTextMessage, sendListMessage };
