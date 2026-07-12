import { Router, type Request, type Response } from 'express';
import { getDb } from '../db';
import type { DataRecord } from '../types';
import { validate, dataUpsertSchema, dataBatchSchema } from '../validate';
import { logger } from '../logger';

const router = Router();

function getUserId(req: Request, res: Response): number | null {
  const id = Number(req.params.userId);
  const requestId = (req as any).requestId;
  if (!Number.isInteger(id) || id <= 0) {
    logger.warn('Invalid userId parameter', { requestId, userId: req.params.userId });
    res.status(400).json({ error: 'Invalid userId' });
    return null;
  }
  if (req.user && req.user.id !== id) {
    logger.security('Access denied: userId mismatch', { requestId, requestedUserId: id, actualUserId: req.user.id });
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return id;
}

router.get('/:userId', (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (userId === null) return;
  const requestId = (req as any).requestId;
  const db = getDb();
  const rows = db.prepare('SELECT * FROM data WHERE user_id = ? ORDER BY key').all(userId) as DataRecord[];
  logger.debug('Fetched user data', { requestId, userId, count: rows.length });
  res.json(rows);
});

router.get('/:userId/:key', (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (userId === null) return;
  const requestId = (req as any).requestId;
  const db = getDb();
  const row = db.prepare('SELECT * FROM data WHERE user_id = ? AND key = ?').get(userId, req.params.key) as DataRecord | undefined;

  if (!row) {
    logger.debug('Data record not found', { requestId, userId, key: req.params.key });
    res.status(404).json({ error: 'Record not found' });
    return;
  }

  logger.debug('Fetched data record', { requestId, userId, key: req.params.key });
  res.json(row);
});

router.post('/:userId', validate(dataUpsertSchema), (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (userId === null) return;
  const requestId = (req as any).requestId;
  const { key, value } = req.body;

  const db = getDb();
  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!userExists) {
    logger.warn('User not found for data upsert', { requestId, userId });
    res.status(400).json({ error: 'User not found' });
    return;
  }

  const existing = db.prepare('SELECT * FROM data WHERE user_id = ? AND key = ?').get(userId, key) as DataRecord | undefined;

  if (existing) {
    db.prepare('UPDATE data SET value = ?, updated_at = datetime(\'now\') WHERE id = ?').run(value ?? '', existing.id);
    const updated = db.prepare('SELECT * FROM data WHERE id = ?').get(existing.id) as DataRecord;
    logger.debug('Data record updated', { requestId, userId, key });
    res.json(updated);
    return;
  }

  const stmt = db.prepare('INSERT INTO data (user_id, key, value) VALUES (?, ?, ?)');
  const result = stmt.run(userId, key, value ?? '');

  const created = db.prepare('SELECT * FROM data WHERE id = ?').get(result.lastInsertRowid) as DataRecord;
  logger.info('Data record created', { requestId, userId, key });
  res.status(201).json(created);
});

router.put('/:userId/:key', (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (userId === null) return;
  const requestId = (req as any).requestId;
  const { value } = req.body;

  if (typeof value !== 'string' || value.length > 10000) {
    logger.warn('Invalid value for data update', { requestId, userId, key: req.params.key, valueLength: value?.length });
    res.status(400).json({ error: 'value is required (max 10000 chars)' });
    return;
  }

  const db = getDb();
  const existing = db.prepare('SELECT * FROM data WHERE user_id = ? AND key = ?').get(userId, req.params.key) as DataRecord | undefined;

  if (!existing) {
    logger.debug('Data record not found for update', { requestId, userId, key: req.params.key });
    res.status(404).json({ error: 'Record not found' });
    return;
  }

  db.prepare('UPDATE data SET value = ?, updated_at = datetime(\'now\') WHERE id = ?').run(value, existing.id);
  const updated = db.prepare('SELECT * FROM data WHERE id = ?').get(existing.id) as DataRecord;
  logger.debug('Data record updated via PUT', { requestId, userId, key: req.params.key });
  res.json(updated);
});

router.post('/:userId/batch', validate(dataBatchSchema), (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (userId === null) return;
  const requestId = (req as any).requestId;
  const { data: pairs } = req.body;

  const db = getDb();
  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!userExists) {
    logger.warn('User not found for batch upsert', { requestId, userId });
    res.status(400).json({ error: 'User not found' });
    return;
  }

  const entries = Object.entries(pairs as Record<string, string>);
  if (entries.length === 0) {
    logger.debug('Empty batch upsert', { requestId, userId });
    res.json({ updated: 0 });
    return;
  }

  const upsert = db.transaction(() => {
    const upsertKey = db.prepare(`
      INSERT INTO data (user_id, key, value, updated_at) VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
    for (const [key, value] of entries) {
      upsertKey.run(userId, key, value ?? '');
    }
  });

  try {
    upsert();
    logger.info('Batch upsert completed', { requestId, userId, count: entries.length });
    res.json({ updated: entries.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Batch upsert failed', err as Error, { requestId, userId });
    res.status(400).json({ error: msg });
  }
});

router.delete('/:userId/:key', (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  if (userId === null) return;
  const requestId = (req as any).requestId;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM data WHERE user_id = ? AND key = ?').get(userId, req.params.key) as DataRecord | undefined;

  if (!existing) {
    logger.debug('Data record not found for delete', { requestId, userId, key: req.params.key });
    res.status(404).json({ error: 'Record not found' });
    return;
  }

  db.prepare('DELETE FROM data WHERE id = ?').run(existing.id);
  logger.info('Data record deleted', { requestId, userId, key: req.params.key });
  res.json({ message: 'Deleted' });
});

export default router;