import { describe, it, expect, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import commandsRouter from '../routes/commands';
import authRouter from '../routes/auth';
import { authenticate } from '../middleware';
import { getDb } from '../db';

const app = express();
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api', authenticate, commandsRouter);

const LOGIN = `cmd_test_${Date.now()}`;
const PASS = 'secret';
let userAuthHeaders: Record<string, string>;
let devAuthHeaders: Record<string, string>;

describe('commands routes', () => {
  afterAll(() => {
    const db = getDb();
    db.exec(`DELETE FROM users WHERE login LIKE 'cmd_test_%'`);
  });

  it('setup: register regular user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ login: LOGIN, password: PASS });
    expect(res.status).toBe(201);
    userAuthHeaders = { 'x-auth-login': LOGIN, 'x-auth-password': PASS };
  });

  it('setup: promote to dev via auth/op', async () => {
    const res = await request(app)
      .post('/api/auth/op')
      .send({ login: LOGIN });
    expect(res.status).toBe(200);
    devAuthHeaders = { 'x-auth-login': LOGIN, 'x-auth-password': PASS };
  });

  it('GET /serverinfo returns server info', async () => {
    const res = await request(app)
      .get('/api/serverinfo')
      .set(devAuthHeaders);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('nodeVersion');
    expect(res.body).toHaveProperty('memory');
    expect(res.body.nodesVersions).toBeUndefined();
  });

  it('POST /command /serverinfo returns formatted output for dev', async () => {
    const res = await request(app)
      .post('/api/command')
      .set(devAuthHeaders)
      .send({ command: '/serverinfo' });
    expect(res.status).toBe(200);
    expect(res.body.output).toContain('uptime');
    expect(res.body.output).toContain('users');
  });

  it('POST /command /op promotes user', async () => {
    const res = await request(app)
      .post('/api/command')
      .set(devAuthHeaders)
      .send({ command: `/op ${LOGIN}` });
    expect(res.status).toBe(200);
    expect(res.body.output).toContain('is now a developer');

    const row = getDb().prepare('SELECT is_dev FROM users WHERE login = ?').get(LOGIN) as { is_dev: number };
    expect(row.is_dev).toBe(1);
  });

  it('POST /command /op without login shows usage', async () => {
    const res = await request(app)
      .post('/api/command')
      .set(devAuthHeaders)
      .send({ command: '/op' });
    expect(res.status).toBe(200);
    expect(res.body.output).toContain('Usage');
  });

  it('POST /command /op on unknown user returns error', async () => {
    const res = await request(app)
      .post('/api/command')
      .set(devAuthHeaders)
      .send({ command: '/op unknown_user_xyz' });
    expect(res.status).toBe(200);
    expect(res.body.output).toContain('not found');
  });

  it('POST /command unknown command returns error', async () => {
    const res = await request(app)
      .post('/api/command')
      .set(devAuthHeaders)
      .send({ command: '/nonexistent' });
    expect(res.status).toBe(400);
    expect(res.body.output).toContain('Unknown command');
  });

  it('POST /command rejects empty command', async () => {
    const res = await request(app)
      .post('/api/command')
      .set(devAuthHeaders)
      .send({ command: '' });
    expect(res.status).toBe(400);
  });

  it('POST /command requires dev status', async () => {
    const db = getDb();
    db.prepare('UPDATE users SET is_dev = 0 WHERE login = ?').run(LOGIN);

    const res = await request(app)
      .post('/api/command')
      .set(userAuthHeaders)
      .send({ command: '/serverinfo' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden: dev only');

    db.prepare('UPDATE users SET is_dev = 1 WHERE login = ?').run(LOGIN);
  });

  it('POST /restart requires dev status', async () => {
    const db = getDb();
    db.prepare('UPDATE users SET is_dev = 0 WHERE login = ?').run(LOGIN);

    const res = await request(app)
      .post('/api/restart')
      .set(userAuthHeaders);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden: dev only');

    db.prepare('UPDATE users SET is_dev = 1 WHERE login = ?').run(LOGIN);
  });

  it('GET /serverinfo works for dev user', async () => {
    const res = await request(app)
      .get('/api/serverinfo')
      .set(devAuthHeaders);
    expect(res.status).toBe(200);
  });
});
