const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, '..', 'data', 'atendimento.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wa_id TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL REFERENCES contacts(id),
    status TEXT NOT NULL DEFAULT 'aberta', -- aberta | pendente | resolvida
    category TEXT DEFAULT 'sem_classificacao', -- suporte | vendas | financeiro | sem_classificacao | etc
    agent_id INTEGER REFERENCES agents(id),
    last_message_at TEXT,
    last_inbound_at TEXT,
    first_response_at TEXT,
    resolved_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
    direction TEXT NOT NULL, -- inbound | outbound
    body TEXT,
    wa_message_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quick_replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shortcut TEXT UNIQUE NOT NULL,
    body TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
`);

const defaultReplies = [
  ['ola', 'Olá! Obrigado por entrar em contato. Em que posso ajudar?'],
  ['aguarde', 'Só um momento, vou verificar isso para você.'],
  ['encerrar', 'Obrigado pelo contato! Se precisar de algo mais, estamos à disposição.'],
];
const insertReply = db.prepare('INSERT OR IGNORE INTO quick_replies (shortcut, body) VALUES (?, ?)');
for (const [shortcut, body] of defaultReplies) insertReply.run(shortcut, body);

module.exports = db;
