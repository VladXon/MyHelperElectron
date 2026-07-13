import { Router, type Request, type Response } from 'express';
import { getDb, hashPassword, verifyPassword } from '../db';
import { generateToken, generateRefreshToken, storeSession, deleteSession, deleteUserSessions, getSessionByRefreshToken, rotateSession, JWT_EXPIRES_IN } from '../auth';
import type { UserRow, TokenResponse } from '../../../shared/types';
import { validate, registerSchema, loginSchema, changePasswordSchema, setEmailSchema, opSchema } from '../validate';
import { logger } from '../logger';

const router = Router();

function stripPassword(row: UserRow) {
  const { password: _, ...user } = row;
  return user;
}

router.post('/register', validate(registerSchema), (req: Request, res: Response) => {
  const { login, password, name } = req.body;
  const requestId = (req as any).requestId;

  const db = getDb();

  const existing = db.prepare('SELECT * FROM users WHERE login = ?').get(login) as UserRow | undefined;
  if (existing) {
    if (!verifyPassword(password, existing.password)) {
      logger.security('Registration attempt with wrong password for existing user', { requestId, login });
      res.status(401).json({ error: 'Invalid password' });
      return;
    }
    logger.info('Existing user logged in via register', { requestId, login, userId: existing.id });
    res.json(stripPassword(existing));
    return;
  }

  const hashed = hashPassword(password);
  const displayName = name || login;
  const stmt = db.prepare('INSERT INTO users (login, name, password, email) VALUES (?, ?, ?, ?)');
  const result = stmt.run(login, displayName, hashed, '');

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as UserRow;
  logger.info('New user registered', { requestId, login, userId: row.id });
  res.status(201).json(stripPassword(row));
});

router.post('/login', validate(loginSchema), (req: Request, res: Response) => {
  const { login, password } = req.body;
  const requestId = (req as any).requestId;

  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE login = ?').get(login) as UserRow | undefined;

  if (!row) {
    logger.security('Login attempt for unknown user', { requestId, login });
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (!verifyPassword(password, row.password)) {
    logger.security('Wrong password', { requestId, login, userId: row.id });
    res.status(401).json({ error: 'Invalid password' });
    return;
  }

  logger.info('User logged in', { requestId, login, userId: row.id });
  res.json(stripPassword(row));
});

router.post('/op', validate(opSchema), (req: Request, res: Response) => {
  const { login } = req.body;
  const requestId = (req as any).requestId;

  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE login = ?').get(login) as UserRow | undefined;

  if (!row) {
    logger.warn('OP command for unknown user', { requestId, login });
    res.status(404).json({ error: 'User not found' });
    return;
  }

  db.prepare('UPDATE users SET is_dev = 1 WHERE id = ?').run(row.id);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(row.id) as UserRow;
  logger.info('User granted dev status', { requestId, login, userId: row.id, by: req.user?.login });
  res.json(stripPassword(updated));
});

router.put('/email', validate(setEmailSchema), (req: Request, res: Response) => {
  const { login, email, password } = req.body;
  const requestId = (req as any).requestId;

  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE login = ?').get(login) as UserRow | undefined;

  if (!row) {
    logger.warn('Email change for unknown user', { requestId, login });
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (!verifyPassword(password, row.password)) {
    logger.security('Email change with invalid password', { requestId, login, userId: row.id });
    res.status(401).json({ error: 'Invalid password' });
    return;
  }

  db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, row.id);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(row.id) as UserRow;
  logger.info('Email updated', { requestId, login, userId: row.id, email });
  res.json(stripPassword(updated));
});

router.put('/password', validate(changePasswordSchema), (req: Request, res: Response) => {
  const { login, currentPassword, newPassword } = req.body;
  const requestId = (req as any).requestId;

  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE login = ?').get(login) as UserRow | undefined;

  if (!row) {
    logger.warn('Password change for unknown user', { requestId, login });
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (!verifyPassword(currentPassword, row.password)) {
    logger.security('Password change with invalid current password', { requestId, login, userId: row.id });
    res.status(401).json({ error: 'Invalid password' });
    return;
  }

  const hashed = hashPassword(newPassword);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, row.id);
  logger.info('Password changed', { requestId, login, userId: row.id });
  res.json({ success: true });
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as UserRow | undefined;

  if (!row) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json(stripPassword(row));
});

router.post('/token', validate(loginSchema), (req: Request, res: Response) => {
  const { login, password } = req.body;
  const requestId = (req as any).requestId;

  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE login = ?').get(login) as UserRow | undefined;

  if (!row) {
    logger.security('Token request for unknown user', { requestId, login });
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (!verifyPassword(password, row.password)) {
    logger.security('Token request with invalid password', { requestId, login, userId: row.id });
    res.status(401).json({ error: 'Invalid password' });
    return;
  }

  const token = generateToken(row.id, row.login);
  const refreshToken = generateRefreshToken();
  storeSession(row.id, token, refreshToken);
  const { password: _, ...user } = row;

  logger.info('Tokens issued', { requestId, login, userId: row.id });
  res.json({
    token,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN,
    user,
  } as TokenResponse);
});

router.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const requestId = (req as any).requestId;

  if (!refreshToken) {
    logger.warn('Refresh request without refreshToken', { requestId });
    res.status(400).json({ error: 'refreshToken required' });
    return;
  }

  const session = getSessionByRefreshToken(refreshToken);
  if (!session) {
    logger.security('Invalid or expired refresh token', { requestId });
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }

  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id) as UserRow | undefined;
  if (!row) {
    logger.warn('User not found for valid refresh token', { requestId, userId: session.user_id });
    res.status(401).json({ error: 'User not found' });
    return;
  }

  const newToken = generateToken(row.id, row.login);
  const newRefreshToken = generateRefreshToken();
  rotateSession(session.token, newToken, newRefreshToken);
  deleteSession(session.token);

  const { password: _, ...user } = row;
  logger.info('Tokens refreshed', { requestId, login: row.login, userId: row.id });
  res.json({
    token: newToken,
    refreshToken: newRefreshToken,
    expiresIn: JWT_EXPIRES_IN,
    user,
  } as TokenResponse);
});

router.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'] as string | undefined;
  const requestId = (req as any).requestId;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    deleteSession(authHeader.slice(7));
    logger.info('User logged out', { requestId, userId: req.user?.id });
  }
  res.json({ success: true });
});

export default router;