import { getDb } from './db';

const migrations: Array<{ name: string; up: string }> = [
  {
    name: '001_initial',
    up: `
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
    `,
  },
  {
    name: '002_sessions',
    up: `
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        refresh_token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `,
  },
  {
    name: '003_pending_telegram_links',
    up: `
      CREATE TABLE IF NOT EXISTS pending_telegram_links (
        code TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('qr', 'code')),
        login TEXT,
        telegram_id INTEGER,
        expires_at INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
  },
  {
    name: '004_notes',
    up: `
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        tags TEXT NOT NULL DEFAULT '[]',
        pinned INTEGER NOT NULL DEFAULT 0,
        completed INTEGER NOT NULL DEFAULT 0,
        reminder_at INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
      CREATE INDEX IF NOT EXISTS idx_notes_reminder ON notes(user_id, reminder_at) WHERE reminder_at IS NOT NULL AND completed = 0;
    `,
  },
  {
    name: '005_indexes',
    up: `
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_data_user_id ON data(user_id);
      CREATE INDEX IF NOT EXISTS idx_pending_links_expires ON pending_telegram_links(expires_at);
    `,
  },
  {
    name: '006_note_notify_telegram',
    up: `
      ALTER TABLE notes ADD COLUMN notify_telegram INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE notes ADD COLUMN telegram_notified INTEGER NOT NULL DEFAULT 0;
    `,
  },
];

export function runMigrations() {
  const db = getDb();
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    (db.prepare('SELECT name FROM _migrations').all() as { name: string }[]).map(r => r.name)
  );

  for (const m of migrations) {
    if (!applied.has(m.name)) {
      db.transaction(() => {
        db.exec(m.up);
        db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(m.name);
      })();
      console.log(`[migrate] Applied: ${m.name}`);
    }
  }
}
