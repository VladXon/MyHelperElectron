import type { Request, Response, NextFunction } from 'express';
import { getDb, verifyPassword } from './db';
import { verifyToken, getSessionByToken } from './auth';
import type { UserRow } from '../../shared/types';
import { logger } from './logger';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const requestId = (req as any).requestId;
  const authHeader = req.headers['authorization'] as string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload) {
      logger.warn('Invalid or expired token', { requestId, ip: req.ip });
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    const session = getSessionByToken(token);
    if (!session) {
      logger.warn('Session expired or not found', { requestId, ip: req.ip });
      res.status(401).json({ error: 'Session expired' });
      return;
    }
    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as UserRow | undefined;
    if (!row) {
      logger.warn('User not found for valid token', { requestId, userId: payload.userId });
      res.status(401).json({ error: 'User not found' });
      return;
    }
    req.user = row;
    logger.debug('Authenticated via Bearer token', { requestId, userId: row.id, login: row.login });
    next();
    return;
  }

  const login = req.headers['x-auth-login'] as string | undefined;
  const password = req.headers['x-auth-password'] as string | undefined;

  if (!login || !password) {
    logger.warn('Missing authentication headers', { requestId, ip: req.ip, hasLogin: !!login, hasPassword: !!password });
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE login = ?').get(login) as UserRow | undefined;

  if (!row || !verifyPassword(password, row.password)) {
    logger.security('Invalid credentials', { requestId, login, ip: req.ip });
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  req.user = row;
  logger.debug('Authenticated via headers', { requestId, userId: row.id, login: row.login });
  next();
}