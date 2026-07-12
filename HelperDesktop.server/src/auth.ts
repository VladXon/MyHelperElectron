import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { getDb } from './db';
import { logger } from './logger';

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = 24 * 60 * 60;
const REFRESH_EXPIRES_IN = 7 * 24 * 60 * 60;

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  logger.warn('JWT_SECRET not set in production, using generated secret (tokens will invalidate on restart)');
}

export interface TokenPayload {
  userId: number;
  login: string;
  jti: string;
}

export function generateToken(userId: number, login: string): string {
  const payload: TokenPayload = { userId, login, jti: crypto.randomUUID() };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (e) {
    logger.debug('Token verification failed', { error: (e as Error).message });
    return null;
  }
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function storeSession(userId: number, token: string, refreshToken: string) {
  const db = getDb();
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_IN * 1000).toISOString();
  db.prepare('INSERT INTO sessions (user_id, token, refresh_token, expires_at) VALUES (?, ?, ?, ?)').run(userId, token, refreshToken, expiresAt);
  logger.debug('Session stored', { userId });
}

export function rotateSession(oldToken: string, newToken: string, newRefreshToken: string): boolean {
  const db = getDb();
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_IN * 1000).toISOString();
  const result = db.prepare('UPDATE sessions SET token = ?, refresh_token = ?, expires_at = ? WHERE token = ?').run(newToken, newRefreshToken, expiresAt, oldToken);
  logger.debug('Session rotated', { success: result.changes > 0 });
  return result.changes > 0;
}

export function deleteSession(token: string) {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  logger.debug('Session deleted');
}

export function deleteUserSessions(userId: number) {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  logger.info('All user sessions deleted', { userId });
}

export function getSessionByToken(token: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime(\'now\')').get(token) as { id: number; user_id: number; token: string; refresh_token: string; expires_at: string } | undefined;
}

export function getSessionByRefreshToken(refreshToken: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions WHERE refresh_token = ? AND expires_at > datetime(\'now\')').get(refreshToken) as { id: number; user_id: number; token: string; refresh_token: string; expires_at: string } | undefined;
}

export { JWT_EXPIRES_IN, REFRESH_EXPIRES_IN };