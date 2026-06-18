const store = require('./store');
const { generateReply } = require('./claude');
const { sendWhatsAppMessage } = require('./whatsapp');
const { STAGES } = require('./stages');

async function handleIncomingMessage({ from, name, text }) {
  let contact = store.getContact(from);
  if (!contact) {
    contact = store.upsertContact(from, { name: name || null, stage: 'novo', history: [] });
  } else if (name && contact.name !== name) {
    contact = store.upsertContact(from, { name });
  }

  store.appendHistory(from, { role: 'user', content: text, timestamp: new Date().toISOString() });

  const current = store.getContact(from);
  const { reply, newStage } = await generateReply({
    history: current.history,
    stage: current.stage,
    contactName: current.name,
  });

  if (newStage && STAGES.includes(newStage) && newStage !== current.stage) {
    store.upsertContact(from, { stage: newStage });
  }

  store.appendHistory(from, { role: 'assistant', content: reply, timestamp: new Date().toISOString() });

  await sendWhatsAppMessage(from, reply);
}

module.exports = { handleIncomingMessage };
