import Database from 'better-sqlite3';
import path from 'node:path';
import crypto from 'node:crypto';
import { runMigrations } from './migrate';
import { logger } from './log';

const DB_DIR = path.join(__dirname, '..');
const DB_PATH = path.join(DB_DIR, 'helperdesktop.db');

const HASH_ALGO = 'scrypt';
const KEY_LENGTH = 64;
const SALT_LENGTH = 32;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

let db: Database.Database;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }).toString('hex');
  return `${HASH_ALGO}:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split(':');
    if (parts.length === 3 && parts[0] === HASH_ALGO) {
      const [, salt, hash] = parts;
      const derived = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
      return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
    }
    if (parts.length === 6 && parts[0] === HASH_ALGO) {
      const [, nStr, rStr, pStr, salt, hash] = parts;
      const N = parseInt(nStr, 10);
      const r = parseInt(rStr, 10);
      const p = parseInt(pStr, 10);
      const derived = crypto.scryptSync(password, salt, KEY_LENGTH, { N, r, p }).toString('hex');
      return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
    }
    return false;
  } catch {
    return false;
  }
}

function migratePlaintextPasswords() {
  const rows = db.prepare('SELECT id, password FROM users').all() as { id: number; password: string }[];
  let migrated = 0;
  for (const row of rows) {
    if (row.password && !row.password.includes(':')) {
      const hashed = hashPassword(row.password);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, row.id);
      migrated++;
    }
  }
  if (migrated > 0) {
    logger.info(`[DB] Migrated ${migrated} plaintext password(s) to scrypt`);
  }
}

function migrateLegacyScryptParams() {
  const rows = db.prepare('SELECT id, password FROM users').all() as { id: number; password: string }[];
  let migrated = 0;
  for (const row of rows) {
    if (row.password && row.password.startsWith(`${HASH_ALGO}:`)) {
      const parts = row.password.split(':');
      if (parts.length === 3) {
        const [, salt, hash] = parts;
        const rehashed = `${HASH_ALGO}:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt}:${hash}`;
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(rehashed, row.id);
        migrated++;
      }
    }
  }
  if (migrated > 0) {
    logger.info(`[DB] Updated ${migrated} password(s) to new scrypt parameters`);
  }
}

export function getDb(): Database.Database {
  if (!db) {
    logger.debug('[DB] Opening database', { path: DB_PATH });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    initSchema();
    migratePlaintextPasswords();
    migrateLegacyScryptParams();
    runMigrations();
    logger.info('[DB] Database initialized', { path: DB_PATH });
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      password TEXT NOT NULL DEFAULT '',
      is_dev INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, key)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      refresh_token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pending_telegram_links (
      code TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('qr', 'code')),
      login TEXT,
      telegram_id INTEGER,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_data_user_id ON data(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
    CREATE INDEX IF NOT EXISTS idx_pending_telegram_links_expires ON pending_telegram_links(expires_at);
  `);
}

export { KEY_LENGTH, SALT_LENGTH, SCRYPT_N, SCRYPT_R, SCRYPT_P };