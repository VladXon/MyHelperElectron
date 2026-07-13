import { describe, it, expect, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import authRouter from '../routes/auth';
import dataRouter from '../routes/data';
import commandsRouter from '../routes/commands';
import { authenticate } from '../middleware';
import { getDb } from '../db';

const app = express();
app.use(express.json());
app.get('/api/health', (_req, res) => {
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
});
app.use('/api/auth', authRouter);
app.use('/api/data', authenticate, dataRouter);
app.use('/api', authenticate, commandsRouter);

const LOGIN = `srv_test_${Date.now()}`;
const PASS = 'secret';

describe('server health', () => {
  afterAll(() => {
    const db = getDb();
    db.exec(`DELETE FROM users WHERE login LIKE 'srv_test_%'`);
  });

  it('GET /api/health returns ok with db', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});

describe('full auth flow', () => {
  afterAll(() => {
    const db = getDb();
    db.exec(`DELETE FROM users WHERE login LIKE 'srv_test_%'`);
  });

  it('register and re-register (idempotent login)', async () => {
    let res = await request(app)
      .post('/api/auth/register')
      .send({ login: LOGIN, password: PASS });
    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty('password');

    res = await request(app)
      .post('/api/auth/register')
      .send({ login: LOGIN, password: PASS });
    expect(res.status).toBe(200);
    expect(res.body.login).toBe(LOGIN);
  });

  it('register with existing login + wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ login: LOGIN, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('change email with password', async () => {
    const res = await request(app)
      .put('/api/auth/email')
      .send({ login: LOGIN, email: 'new@test.com', password: PASS });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('new@test.com');
  });

  it('reject email change with wrong password', async () => {
    const res = await request(app)
      .put('/api/auth/email')
      .send({ login: LOGIN, email: 'hacker@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('reject email change for unknown user', async () => {
    const res = await request(app)
      .put('/api/auth/email')
      .send({ login: 'no_such_user', email: 'x@y.com', password: 'p' });
    expect(res.status).toBe(404);
  });

  it('get user by id', async () => {
    const reg = await request(app)
      .post('/api/auth/login')
      .send({ login: LOGIN, password: PASS });

    const res = await request(app)
      .get(`/api/auth/${reg.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.login).toBe(LOGIN);
    expect(res.body).not.toHaveProperty('password');
  });

  it('get non-existent user by id', async () => {
    const res = await request(app)
      .get('/api/auth/999999');
    expect(res.status).toBe(404);
  });
});
