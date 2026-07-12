import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import authRouter from '../routes/auth';
import { getDb } from '../db';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

const TEST_LOGIN = `test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

describe('auth routes', () => {
  afterAll(() => {
    const db = getDb();
    db.exec(`DELETE FROM users WHERE login LIKE 'test_%'`);
  });

  it('registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ login: TEST_LOGIN, password: 'secret123' });
    expect(res.status).toBe(201);
    expect(res.body.login).toBe(TEST_LOGIN);
    expect(res.body).not.toHaveProperty('password');
  });

  it('logs in existing user with correct password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ login: TEST_LOGIN, password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.login).toBe(TEST_LOGIN);
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ login: TEST_LOGIN, password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('rejects unknown user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ login: 'nonexistent_' + TEST_LOGIN, password: 'x' });
    expect(res.status).toBe(404);
  });

  it('changes password', async () => {
    let res = await request(app)
      .put('/api/auth/password')
      .send({ login: TEST_LOGIN, currentPassword: 'secret123', newPassword: 'newpass' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    res = await request(app)
      .post('/api/auth/login')
      .send({ login: TEST_LOGIN, password: 'newpass' });
    expect(res.status).toBe(200);
  });

  it('rejects register with missing login', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'test123' });
    expect(res.status).toBe(400);
  });

  it('grants dev status via /op', async () => {
    const res = await request(app)
      .post('/api/auth/op')
      .send({ login: TEST_LOGIN });
    expect(res.status).toBe(200);
    expect(res.body.is_dev).toBe(1);
  });

  it('updates email', async () => {
    let res = await request(app)
      .post('/api/auth/login')
      .send({ login: TEST_LOGIN, password: 'newpass' });
    expect(res.status).toBe(200);

    res = await request(app)
      .put('/api/auth/email')
      .send({ login: TEST_LOGIN, email: 'test@example.com', password: 'newpass' });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@example.com');
  });

  it('rejects email update without password', async () => {
    const res = await request(app)
      .put('/api/auth/email')
      .send({ login: TEST_LOGIN, email: 'other@example.com' });
    expect(res.status).toBe(400);
  });

  it('rejects register with existing user and wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ login: TEST_LOGIN, password: 'definitelywrong' });
    expect(res.status).toBe(401);
  });

  it('issues token via /token endpoint', async () => {
    const res = await request(app)
      .post('/api/auth/token')
      .send({ login: TEST_LOGIN, password: 'newpass' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.login).toBe(TEST_LOGIN);
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('rejects /token with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/token')
      .send({ login: TEST_LOGIN, password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('refreshes token via /refresh endpoint', async () => {
    const tokenRes = await request(app)
      .post('/api/auth/token')
      .send({ login: TEST_LOGIN, password: 'newpass' });
    expect(tokenRes.status).toBe(200);
    const refreshToken = tokenRes.body.refreshToken;

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.token).toBeDefined();
    expect(refreshRes.body.refreshToken).toBeDefined();
    expect(refreshRes.body.user.login).toBe(TEST_LOGIN);
  });

  it('rejects /refresh with invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid_refresh_token' });
    expect(res.status).toBe(401);
  });

  it('rejects /refresh without body', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});
    expect(res.status).toBe(400);
  });

  it('logs out successfully', async () => {
    const tokenRes = await request(app)
      .post('/api/auth/token')
      .send({ login: TEST_LOGIN, password: 'newpass' });
    expect(tokenRes.status).toBe(200);
    const token = tokenRes.body.token;

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
  });
});
