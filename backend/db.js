const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const db = new DatabaseSync(path.join(DATA_DIR, 'gymmer.db'));

// --- Schema ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gym_name TEXT NOT NULL,
    area TEXT DEFAULT '',
    owner_contact TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Not Contacted',
    last_contacted_date TEXT DEFAULT NULL,
    visited_by TEXT DEFAULT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// --- Seed users (only if table is empty) ---
const userCountRow = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
if (userCountRow.cnt === 0) {
  const SALT_ROUNDS = 10;
  const users = [
    { username: 'shaurya',  display_name: 'Shaurya',  password: 'shaurya123' },
    { username: 'shashwat', display_name: 'Shashwat', password: 'shashwat123' },
    { username: 'tanish',   display_name: 'Tanish',   password: 'tanish123' },
    { username: 'daksh',    display_name: 'Daksh',    password: 'daksh123' },
  ];

  const insert = db.prepare(
    'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)'
  );
  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, SALT_ROUNDS);
    insert.run(u.username, hash, u.display_name);
  }
  console.log('✅ Seeded 4 users into DB');
}

module.exports = db;
