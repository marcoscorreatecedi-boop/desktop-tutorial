const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'store.json');
const MAX_HISTORY = 40;

function load() {
  if (!fs.existsSync(DATA_FILE)) return { contacts: {} };
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getContact(waId) {
  const data = load();
  return data.contacts[waId] || null;
}

function upsertContact(waId, updates) {
  const data = load();
  const existing = data.contacts[waId] || {
    waId,
    name: null,
    stage: 'novo',
    history: [],
    createdAt: new Date().toISOString(),
  };
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  data.contacts[waId] = updated;
  save(data);
  return updated;
}

function appendHistory(waId, entry) {
  const data = load();
  const contact = data.contacts[waId];
  if (!contact) return;
  contact.history.push(entry);
  if (contact.history.length > MAX_HISTORY) {
    contact.history = contact.history.slice(-MAX_HISTORY);
  }
  contact.updatedAt = new Date().toISOString();
  data.contacts[waId] = contact;
  save(data);
}

function listContacts() {
  const data = load();
  return Object.values(data.contacts).sort((a, b) =>
    (b.updatedAt || '').localeCompare(a.updatedAt || '')
  );
}

module.exports = { getContact, upsertContact, appendHistory, listContacts };
