import { Router, type Request, type Response } from 'express';
import { getDb } from '../db';
import { validate, noteCreateSchema, noteUpdateSchema, noteIdParams } from '../validate';
import { logger } from '../logger';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const db = getDb();
  const notes = db.prepare(
    'SELECT * FROM notes WHERE user_id = ? ORDER BY pinned DESC, created_at DESC'
  ).all(req.user!.id);
  logger.debug('Fetched notes', { requestId, userId: req.user!.id, count: notes.length });
  res.json(notes.map((n: any) => ({ ...n, tags: JSON.parse(n.tags) })));
});

router.post('/', validate(noteCreateSchema), (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { title, body, tags, reminder_at } = req.body;
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO notes (user_id, title, body, tags, reminder_at) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user!.id, title, body, JSON.stringify(tags), reminder_at ?? null);
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid) as any;
  logger.info('Note created', { requestId, userId: req.user!.id, noteId: note.id });
  res.status(201).json({ ...note, tags: JSON.parse(note.tags) });
});

router.put('/:id', validate(noteIdParams, 'params'), validate(noteUpdateSchema), (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { id } = req.params;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(id, req.user!.id);
  if (!existing) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }

  const fields: Record<string, any> = { ...req.body };
  if (fields.tags) fields.tags = JSON.stringify(fields.tags);
  fields.updated_at = new Date().toISOString();

  const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE notes SET ${sets} WHERE id = ?`).run(...Object.values(fields), id);
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as any;
  logger.info('Note updated', { requestId, userId: req.user!.id, noteId: id });
  res.json({ ...note, tags: JSON.parse(note.tags) });
});

router.delete('/:id', validate(noteIdParams, 'params'), (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const db = getDb();
  const result = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  logger.info('Note deleted', { requestId, userId: req.user!.id, noteId: req.params.id });
  res.json({ ok: true });
});

router.patch('/:id/toggle', validate(noteIdParams, 'params'), (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { field } = req.body;
  if (field !== 'pinned' && field !== 'completed') {
    res.status(400).json({ error: 'field must be pinned or completed' });
    return;
  }
  const db = getDb();
  const existing = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);
  if (!existing) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  db.prepare(`UPDATE notes SET ${field} = NOT ${field}, updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id) as any;
  logger.info('Note toggled', { requestId, userId: req.user!.id, noteId: req.params.id, field });
  res.json({ ...note, tags: JSON.parse(note.tags) });
});

export default router;
