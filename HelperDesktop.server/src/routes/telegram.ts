import { Router } from 'express';
import crypto from 'node:crypto';
import { getDb } from '../db';
import { linkTelegram, unlinkTelegram, getLinkedTelegramId } from '../../../shared/src/telegram-links';
import { logger } from '../logger';

const router = Router();

function generateCode(length = 6): string {
  return crypto.randomBytes(length).toString('base64url').slice(0, length).toUpperCase();
}

router.get('/status', (req, res) => {
  const requestId = (req as any).requestId;
  const user = (req as any).user;
  if (!user) {
    logger.warn('Unauthorized access to /telegram/status', { requestId });
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const telegramId = getLinkedTelegramId(user.login);

  if (telegramId) {
    logger.debug('Telegram status: linked', { requestId, login: user.login, telegramId });
    res.json({ linked: true, telegramId });
  } else {
    logger.debug('Telegram status: not linked', { requestId, login: user.login });
    res.json({ linked: false });
  }
});

router.post('/link', (req, res) => {
  const requestId = (req as any).requestId;
  const user = (req as any).user;
  if (!user) {
    logger.warn('Unauthorized access to /telegram/link', { requestId });
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { login, password } = req.body;
  if (!login || !password) {
    logger.warn('Missing login/password for telegram link', { requestId });
    res.status(400).json({ error: 'Login and password required' });
    return;
  }

  try {
    const db = getDb();
    const row = db.prepare('SELECT id, password, is_dev FROM users WHERE login = ?').get(login) as { id: number; password: string; is_dev: number } | undefined;

    if (!row) {
      logger.warn('User not found for telegram link', { requestId, login });
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { verifyPassword } = require('../../HelperDesktop.telegram/src/db');
    if (!verifyPassword(password, row.password)) {
      logger.security('Invalid password for telegram link', { requestId, login });
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    const existingTelegramId = getLinkedTelegramId(login);
    if (existingTelegramId) {
      logger.info('Telegram already linked', { requestId, login, telegramId: existingTelegramId });
      res.json({ linked: true, telegramId: existingTelegramId });
      return;
    }

    logger.info('Telegram link initiated (credentials verified)', { requestId, login });
    res.json({ linked: false, message: 'Use QR code or confirmation code to link' });
  } catch (err) {
    logger.error('Failed to check telegram link', err as Error, { requestId });
    res.status(500).json({ error: 'Failed to link' });
  }
});

router.post('/unlink', (req, res) => {
  const requestId = (req as any).requestId;
  const user = (req as any).user;
  if (!user) {
    logger.warn('Unauthorized access to /telegram/unlink', { requestId });
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    unlinkTelegram(user.login);
    logger.info('Telegram unlinked', { requestId, login: user.login });
    res.json({ unlinked: true });
  } catch (err) {
    logger.error('Failed to unlink telegram', err as Error, { requestId });
    res.status(500).json({ error: 'Failed to unlink' });
  }
});

router.post('/qr/generate', (req, res) => {
  const requestId = (req as any).requestId;
  const user = (req as any).user;
  if (!user) {
    logger.warn('Unauthorized access to /telegram/qr/generate', { requestId });
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const code = generateCode();
  const db = getDb();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  db.prepare('INSERT OR REPLACE INTO pending_telegram_links (code, type, login, expires_at) VALUES (?, ?, ?, ?)').run(
    code, 'qr', user.login, expiresAt
  );

  const botUsername = process.env.BOT_USERNAME || 'DesktopHelperIOBot';
  const deepLink = `https://t.me/${botUsername}?start=${code}`;

  logger.info('QR code generated for telegram linking', { requestId, login: user.login, code });
  res.json({ code, deepLink, expiresIn: 300 });
});

router.post('/qr/check', (req, res) => {
  const requestId = (req as any).requestId;
  const user = (req as any).user;
  if (!user) {
    logger.warn('Unauthorized access to /telegram/qr/check', { requestId });
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { code } = req.body;
  if (!code) {
    logger.warn('Missing code for QR check', { requestId });
    res.status(400).json({ error: 'Code required' });
    return;
  }

  const db = getDb();
  const row = db.prepare('SELECT * FROM pending_telegram_links WHERE code = ? AND type = ?').get(code, 'qr') as { login: string; expires_at: number } | undefined;

  if (!row) {
    const telegramId = getLinkedTelegramId(user.login);
    if (telegramId) {
      logger.debug('QR check: already linked', { requestId, login: user.login, telegramId });
      res.json({ status: 'linked', telegramId });
    } else {
      logger.debug('QR check: code not found', { requestId, code });
      res.json({ status: 'not_found' });
    }
    return;
  }

  if (Date.now() > row.expires_at) {
    db.prepare('DELETE FROM pending_telegram_links WHERE code = ?').run(code);
    logger.info('QR code expired', { requestId, code });
    res.json({ status: 'expired' });
    return;
  }

  const telegramId = getLinkedTelegramId(row.login);

  if (telegramId) {
    db.prepare('DELETE FROM pending_telegram_links WHERE code = ?').run(code);
    logger.info('QR code linked successfully', { requestId, login: row.login, telegramId });
    res.json({ status: 'linked', telegramId });
  } else {
    logger.debug('QR code pending', { requestId, code });
    res.json({ status: 'pending' });
  }
});

router.post('/code/send', (req, res) => {
  const requestId = (req as any).requestId;
  const user = (req as any).user;
  if (!user) {
    logger.warn('Unauthorized access to /telegram/code/send', { requestId });
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const code = generateCode();
  const db = getDb();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  db.prepare('INSERT OR REPLACE INTO pending_telegram_links (code, type, login, expires_at) VALUES (?, ?, ?, ?)').run(
    code, 'code', user.login, expiresAt
  );

  logger.info('Confirmation code generated for telegram linking', { requestId, login: user.login, code });
  res.json({ code, expiresIn: 600 });
});

router.post('/code/verify', (req, res) => {
  const requestId = (req as any).requestId;
  const user = (req as any).user;
  if (!user) {
    logger.warn('Unauthorized access to /telegram/code/verify', { requestId });
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { code } = req.body;
  if (!code) {
    logger.warn('Missing code for verification', { requestId });
    res.status(400).json({ error: 'Code required' });
    return;
  }

  const db = getDb();
  const normalizedCode = code.toUpperCase();
  const row = db.prepare('SELECT * FROM pending_telegram_links WHERE code = ? AND type = ?').get(normalizedCode, 'code') as { login: string | null; telegram_id: number | null; expires_at: number } | undefined;

  if (!row) {
    logger.warn('Code not found or expired', { requestId, code: normalizedCode });
    res.status(404).json({ error: 'Code not found or expired' });
    return;
  }

  if (Date.now() > row.expires_at) {
    db.prepare('DELETE FROM pending_telegram_links WHERE code = ?').run(normalizedCode);
    logger.warn('Code expired', { requestId, code: normalizedCode });
    res.status(410).json({ error: 'Code expired' });
    return;
  }

  if (row.telegram_id) {
    const userRow = db.prepare('SELECT is_dev FROM users WHERE login = ?').get(user.login) as { is_dev: number } | undefined;
    linkTelegram(row.telegram_id, user.login, userRow?.is_dev === 1);
    db.prepare('DELETE FROM pending_telegram_links WHERE code = ?').run(normalizedCode);
    logger.info('Telegram linked via confirmation code', { requestId, login: user.login, telegramId: row.telegram_id });
    res.json({ verified: true });
    return;
  }

  if (row.login && row.login !== user.login) {
    logger.security('Code verification failed: code belongs to different user', { requestId, expectedLogin: user.login, codeLogin: row.login });
    res.status(403).json({ error: 'Code does not match your account' });
    return;
  }

  db.prepare('DELETE FROM pending_telegram_links WHERE code = ?').run(normalizedCode);
  logger.info('Code verified successfully', { requestId, login: row.login || user.login });
  res.json({ verified: true, login: row.login || user.login });
});

export default router;