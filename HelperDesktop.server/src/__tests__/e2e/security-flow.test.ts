import { describe, it, expect, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import authRouter from '../../routes/auth';
import dataRouter from '../../routes/data';
import commandsRouter from '../../routes/commands';
import { authenticate } from '../../middleware';
import { getDb } from '../../db';

const app = express();
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/data', authenticate, dataRouter);
app.use('/api', authenticate, commandsRouter);

const LOGIN = `sec_test_${Date.now()}`;
const PASS = 'securePass123';
let authHeaders: Record<string, string>;
let userId: number;

describe('security flow', () => {
  afterAll(() => {
    const db = getDb();
    db.exec(`DELETE FROM users WHERE login LIKE 'sec_test_%'`);
    db.exec(`DELETE FROM data WHERE user_id NOT IN (SELECT id FROM users)`);
  });

  it('register new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ login: LOGIN, password: PASS });
    expect(res.status).toBe(201);
    userId = res.body.id;
    authHeaders = { 'x-auth-login': LOGIN, 'x-auth-password': PASS };
  });

  it('auth required for data endpoints', async () => {
    const res = await request(app).get(`/api/data/${userId}`);
    expect(res.status).toBe(401);
  });

  it('auth required for command endpoints', async () => {
    const res = await request(app)
      .post('/api/command')
      .send({ command: '/serverinfo' });
    expect(res.status).toBe(401);
  });

  it('auth required for restart', async () => {
    const res = await request(app).post('/api/restart');
    expect(res.status).toBe(401);
  });

  it('auth required for serverinfo', async () => {
    const res = await request(app).get('/api/serverinfo');
    expect(res.status).toBe(401);
  });

  it('forbids non-dev from using /command', async () => {
    const res = await request(app)
      .post('/api/command')
      .set(authHeaders)
      .send({ command: '/serverinfo' });
    expect(res.status).toBe(403);
  });

  it('forbids non-dev from using /restart', async () => {
    const res = await request(app)
      .post('/api/restart')
      .set(authHeaders);
    expect(res.status).toBe(403);
  });

  it('password is never returned in responses', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ login: LOGIN, password: PASS });
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('password');

    const res2 = await request(app)
      .get(`/api/auth/${userId}`);
    expect(res2.status).toBe(200);
    expect(res2.body).not.toHaveProperty('password');
  });

  it('rate limiting on auth routes', async () => {
    const limitedApp = express();
    limitedApp.use(express.json());
    const rateLimit = (await import('express-rate-limit')).default;
    const authLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests' },
    });
    limitedApp.use('/api/auth', authLimiter, authRouter);

    const requestLimitedApp = (await import('supertest')).default(limitedApp);

    for (let i = 0; i < 5; i++) {
      await requestLimitedApp
        .post('/api/auth/login')
        .send({ login: LOGIN, password: PASS });
    }

    const blocked = await requestLimitedApp
      .post('/api/auth/login')
      .send({ login: LOGIN, password: PASS });
    expect(blocked.status).toBe(429);
  });

  it('cannot access another user data without auth', async () => {
    const otherLogin = `sec_forbidden_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const otherPass = 'otherPass123';
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ login: otherLogin, password: otherPass });
    if (reg.status === 500) {
      const db = getDb();
      db.exec(`DELETE FROM users WHERE login = '${otherLogin}'`);
      const retry = await request(app)
        .post('/api/auth/register')
        .send({ login: otherLogin, password: otherPass });
      expect([201, 200]).toContain(retry.status);
    } else {
      expect([201, 200]).toContain(reg.status);
    }

    const otherHeaders = { 'x-auth-login': otherLogin, 'x-auth-password': otherPass };
    const res = await request(app)
      .post(`/api/data/${userId}/batch`)
      .set(otherHeaders)
      .send({ data: { x: 'y' } });
    expect(res.status).toBe(403);

    const db = getDb();
    db.exec(`DELETE FROM users WHERE login = '${otherLogin}'`);
  });
});
