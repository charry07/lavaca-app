import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('lavaca.db');
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS preferences (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_history (
      id TEXT PRIMARY KEY NOT NULL,
      join_code TEXT NOT NULL,
      description TEXT,
      total_amount INTEGER NOT NULL,
      split_mode TEXT NOT NULL,
      participant_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      amount INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      is_roulette_winner INTEGER NOT NULL DEFAULT 0,
      payment_method TEXT,
      FOREIGN KEY (session_id) REFERENCES session_history(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_id);
    CREATE INDEX IF NOT EXISTS idx_session_history_code ON session_history(join_code);
  `);
}

// --- Preferences ---

export async function getPreference(key: string): Promise<string | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM preferences WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setPreference(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)',
    [key, value],
  );
}

// --- Session History ---

export interface SessionHistoryRow {
  id: string;
  join_code: string;
  description: string | null;
  total_amount: number;
  split_mode: string;
  participant_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function saveSessionToHistory(session: {
  id: string;
  joinCode: string;
  description?: string;
  totalAmount: number;
  splitMode: string;
  participantCount: number;
  status: string;
}): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO session_history (id, join_code, description, total_amount, split_mode, participant_count, status, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      session.id,
      session.joinCode,
      session.description ?? null,
      session.totalAmount,
      session.splitMode,
      session.participantCount,
      session.status,
    ],
  );
}

export async function getSessionHistory(): Promise<SessionHistoryRow[]> {
  const database = await getDatabase();
  return database.getAllAsync<SessionHistoryRow>(
    'SELECT * FROM session_history ORDER BY updated_at DESC LIMIT 50',
  );
}

export async function deleteSessionFromHistory(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM session_history WHERE id = ?', [id]);
}
