import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { authenticate } from '../middleware';
import { getDb, hashPassword } from '../db';
import { generateToken, generateRefreshToken, storeSession, deleteUserSessions } from '../auth';

const app = express();
app.use(express.json());
app.get('/protected', authenticate, (_req, res) => {
  res.json({ ok: true });
});

const TEST_LOGIN = `mid_test_${Date.now()}`;
const TEST_PASS = 'testPass123';

let testUserId: number;

beforeAll(() => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE login = ?').get(TEST_LOGIN) as { id: number } | undefined;
  if (!existing) {
    const hashed = hashPassword(TEST_PASS);
    const result = db.prepare('INSERT INTO users (login, name, password, email) VALUES (?, ?, ?, ?)').run(TEST_LOGIN, TEST_LOGIN, hashed, '');
    testUserId = result.lastInsertRowid as number;
  } else {
    testUserId = existing.id;
  }
});

afterAll(() => {
  const db = getDb();
  deleteUserSessions(testUserId);
  db.exec(`DELETE FROM users WHERE login LIKE 'mid_test_%'`);
});

describe('authenticate middleware', () => {
  it('allows access with valid credentials', async () => {
    const res = await request(app)
      .get('/protected')
      .set('x-auth-login', TEST_LOGIN)
      .set('x-auth-password', TEST_PASS);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects missing headers', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authentication required');
  });

  it('rejects missing password header', async () => {
    const res = await request(app)
      .get('/protected')
      .set('x-auth-login', TEST_LOGIN);
    expect(res.status).toBe(401);
  });

  it('rejects missing login header', async () => {
    const res = await request(app)
      .get('/protected')
      .set('x-auth-password', TEST_PASS);
    expect(res.status).toBe(401);
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .get('/protected')
      .set('x-auth-login', TEST_LOGIN)
      .set('x-auth-password', 'wrongPassword');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('rejects nonexistent user', async () => {
    const res = await request(app)
      .get('/protected')
      .set('x-auth-login', 'nonexistent_user_xyz')
      .set('x-auth-password', 'somepass');
    expect(res.status).toBe(401);
  });

  it('allows access with valid Bearer token', async () => {
    const token = generateToken(testUserId, TEST_LOGIN);
    storeSession(testUserId, token, generateRefreshToken());
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects invalid Bearer token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid_token_here');
    expect(res.status).toBe(401);
  });

  it('rejects expired Bearer token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsImxvZ2luIjoidGVzdCJ9.noexpiredsession');
    expect(res.status).toBe(401);
  });
});
