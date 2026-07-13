import Database from 'better-sqlite3';
import path from 'node:path';

const DB_PATH = path.join(__dirname, '..', '..', 'HelperDesktop.server', 'helperdesktop.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function getServerUrl(): string {
  return process.env.SERVER_URL || 'http://localhost:3001';
}

import { verifyPassword } from '../../HelperDesktop.server/src/db';
export { verifyPassword };
