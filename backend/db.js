const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const os = require('os');
const path = require('path');
const fs = require('fs');

// In serverless environments (Vercel/Lambda), the filesystem at __dirname is read-only.
// Use os.tmpdir() (/tmp) for SQLite storage.
let DATA_DIR = path.join(__dirname, 'data');
let dbPath = path.join(DATA_DIR, 'gymmer.db');

if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  DATA_DIR = os.tmpdir();
  dbPath = path.join(DATA_DIR, 'gymmer.db');
} else {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    if (err.code === 'EROFS') {
      DATA_DIR = os.tmpdir();
      dbPath = path.join(DATA_DIR, 'gymmer.db');
    } else {
      throw err;
    }
  }
}

const db = new DatabaseSync(dbPath);

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

// --- Seed & Sync users (always ensure active team has updated credentials & purge deprecated users) ---
const SALT_ROUNDS = 10;
const TEAM_USERS = [
  { username: 'shaurya', display_name: 'Shaurya', password: 'Shaurya@FitOps#2026' },
  { username: 'tanish',  display_name: 'Tanish',  password: 'Tanish@LeadForce#2026' },
  { username: 'daksh',   display_name: 'Daksh',   password: 'Daksh@GymMaster#2026' },
];

try {
  // Purge any trace of shashwat
  db.prepare("DELETE FROM users WHERE username = 'shashwat'").run();
} catch {}

for (const u of TEAM_USERS) {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(u.username);
  const hash = bcrypt.hashSync(u.password, SALT_ROUNDS);
  if (!existing) {
    db.prepare('INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)').run(u.username, hash, u.display_name);
  } else {
    db.prepare('UPDATE users SET password_hash = ?, display_name = ? WHERE username = ?').run(hash, u.display_name, u.username);
  }
}
console.log('✅ Synced team accounts (Shaurya, Tanish, Daksh) with secure credentials');

module.exports = db;
