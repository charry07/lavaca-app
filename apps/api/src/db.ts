import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const DATA_DIR = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'lavaca.db');

const db = new Database(DB_PATH);

// Performance settings
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    phone       TEXT UNIQUE NOT NULL,
    displayName TEXT NOT NULL,
    username    TEXT UNIQUE NOT NULL,
    documentId  TEXT UNIQUE,
    avatarUrl   TEXT,
    email       TEXT,
    createdAt   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS otps (
    phone      TEXT PRIMARY KEY,
    code       TEXT NOT NULL,
    expiresAt  INTEGER NOT NULL,
    verified   INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS groups (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    icon       TEXT,
    createdBy  TEXT NOT NULL,
    createdAt  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS group_members (
    groupId TEXT NOT NULL,
    userId  TEXT NOT NULL,
    PRIMARY KEY (groupId, userId),
    FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    joinCode    TEXT UNIQUE NOT NULL,
    adminId     TEXT NOT NULL,
    totalAmount REAL NOT NULL,
    currency    TEXT NOT NULL DEFAULT 'COP',
    splitMode   TEXT NOT NULL DEFAULT 'equal',
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'open',
    createdAt   TEXT NOT NULL,
    closedAt    TEXT
  );

  CREATE TABLE IF NOT EXISTS participants (
    joinCode        TEXT NOT NULL,
    userId          TEXT NOT NULL,
    displayName     TEXT NOT NULL,
    amount          REAL NOT NULL DEFAULT 0,
    percentage      REAL,
    status          TEXT NOT NULL DEFAULT 'pending',
    paymentMethod   TEXT,
    isRouletteWinner INTEGER NOT NULL DEFAULT 0,
    isRouletteCoward INTEGER NOT NULL DEFAULT 0,
    joinedAt        TEXT NOT NULL,
    paidAt          TEXT,
    PRIMARY KEY (joinCode, userId),
    FOREIGN KEY (joinCode) REFERENCES sessions(joinCode) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS feed_events (
    id        TEXT PRIMARY KEY,
    groupId   TEXT,
    sessionId TEXT,
    type      TEXT NOT NULL,
    message   TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS feed_event_users (
    eventId TEXT NOT NULL,
    userId  TEXT NOT NULL,
    PRIMARY KEY (eventId, userId),
    FOREIGN KEY (eventId) REFERENCES feed_events(id) ON DELETE CASCADE
  );
`);

console.log('Database initialized at ' + DB_PATH);

export default db;
