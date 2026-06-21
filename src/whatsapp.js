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

module.exports = { sendTextMessage };
