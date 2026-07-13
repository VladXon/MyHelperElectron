import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import authRouter from '../src/routes/auth';
import dataRouter from '../src/routes/data';
import commandsRouter from '../src/routes/commands';
import { authenticate } from '../src/middleware';
import { getDb } from '../src/db';

const app = express();
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/data', authenticate, dataRouter);
app.use('/api', authenticate, commandsRouter);

const LOGIN = `e2e_${Date.now()}`;
const PASS = 'securePass123';
let authHeaders: Record<string, string> = {};

describe('E2E: full user flow', () => {
  afterAll(() => {
    const db = getDb();
    db.exec(`DELETE FROM users WHERE login LIKE 'e2e_%'`);
    db.exec(`DELETE FROM data WHERE user_id NOT IN (SELECT id FROM users)`);
  });

  it('1. health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('2. register', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ login: LOGIN, password: PASS, name: 'E2E User' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('E2E User');
    expect(res.body.is_dev).toBe(0);
  });

  it('3. login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ login: LOGIN, password: PASS });
    expect(res.status).toBe(200);
    expect(res.body.login).toBe(LOGIN);
    authHeaders = {
      'x-auth-login': LOGIN,
      'x-auth-password': PASS,
    };
  });

  it('4. grant dev via /op', async () => {
    const res = await request(app)
      .post('/api/auth/op')
      .set(authHeaders)
      .send({ login: LOGIN });
    expect(res.status).toBe(200);
    expect(res.body.is_dev).toBe(1);
  });

  it('5. reject access to another user\'s data', async () => {
    const res = await request(app)
      .post('/api/data/999999/batch')
      .set(authHeaders)
      .send({ data: { theme: 'dark', lang: 'ru' } });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('6. save settings — need correct userId', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ login: LOGIN, password: PASS });
    const userId = loginRes.body.id;

    const res = await request(app)
      .post(`/api/data/${userId}/batch`)
      .set(authHeaders)
      .send({ data: { '--bg-primary': '#000000', '--accent': '#a855f7' } });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(2);
  });

  it('7. load settings', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ login: LOGIN, password: PASS });
    const userId = loginRes.body.id;

    const res = await request(app)
      .get(`/api/data/${userId}`)
      .set(authHeaders);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const saved = res.body.reduce((acc: any, r: any) => ({ ...acc, [r.key]: r.value }), {});
    expect(saved['--bg-primary']).toBe('#000000');
    expect(saved['--accent']).toBe('#a855f7');
  });

  it('8. change password', async () => {
    const res = await request(app)
      .put('/api/auth/password')
      .send({ login: LOGIN, currentPassword: PASS, newPassword: 'newPass456' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ login: LOGIN, password: PASS });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ login: LOGIN, password: 'newPass456' });
    expect(newLogin.status).toBe(200);
  });

  it('9. server info', async () => {
    authHeaders['x-auth-password'] = 'newPass456';
    const res = await request(app)
      .get('/api/serverinfo')
      .set(authHeaders);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('users');
  });

  it('10. command — /serverinfo', async () => {
    const res = await request(app)
      .post('/api/command')
      .set(authHeaders)
      .send({ command: '/serverinfo' });
    expect(res.status).toBe(200);
    expect(res.body.output).toContain('uptime');
  });

  it('11. command — /op on self', async () => {
    const res = await request(app)
      .post('/api/command')
      .set(authHeaders)
      .send({ command: `/op ${LOGIN}` });
    expect(res.status).toBe(200);
    expect(res.body.output).toContain('is now a developer');
  });
});
