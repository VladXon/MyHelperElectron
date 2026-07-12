import { describe, it, expect, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import dataRouter from '../routes/data';
import authRouter from '../routes/auth';
import { authenticate } from '../middleware';
import { getDb, hashPassword } from '../db';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/data', authenticate, dataRouter);

const LOGIN = `data_test_${Date.now()}`;
const PASS = 'secret';
let USER_ID: number;
let authHeaders: Record<string, string>;

describe('data routes', () => {
  afterAll(() => {
    const db = getDb();
    db.exec(`DELETE FROM users WHERE login LIKE 'data_test_%'`);
    db.exec(`DELETE FROM data WHERE user_id NOT IN (SELECT id FROM users)`);
  });

  it('setup: register and login user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ login: LOGIN, password: PASS });
    expect(res.status).toBe(201);
    USER_ID = res.body.id;
    authHeaders = { 'x-auth-login': LOGIN, 'x-auth-password': PASS };
  });

  it('GET /:userId returns empty array for new user', async () => {
    const res = await request(app)
      .get(`/api/data/${USER_ID}`)
      .set(authHeaders);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /:userId creates a record', async () => {
    const res = await request(app)
      .post(`/api/data/${USER_ID}`)
      .set(authHeaders)
      .send({ key: 'theme', value: 'dark' });
    expect(res.status).toBe(201);
    expect(res.body.key).toBe('theme');
    expect(res.body.value).toBe('dark');
  });

  it('POST /:userId upserts existing key', async () => {
    const res = await request(app)
      .post(`/api/data/${USER_ID}`)
      .set(authHeaders)
      .send({ key: 'theme', value: 'light' });
    expect(res.status).toBe(200);
    expect(res.body.value).toBe('light');
  });

  it('POST /:userId rejects empty key', async () => {
    const res = await request(app)
      .post(`/api/data/${USER_ID}`)
      .set(authHeaders)
      .send({ key: '', value: 'x' });
    expect(res.status).toBe(400);
  });

  it('GET /:userId/:key returns specific record', async () => {
    const res = await request(app)
      .get(`/api/data/${USER_ID}/theme`)
      .set(authHeaders);
    expect(res.status).toBe(200);
    expect(res.body.key).toBe('theme');
  });

  it('GET /:userId/:key returns 404 for missing key', async () => {
    const res = await request(app)
      .get(`/api/data/${USER_ID}/nonexistent`)
      .set(authHeaders);
    expect(res.status).toBe(404);
  });

  it('PUT /:userId/:key updates record', async () => {
    const res = await request(app)
      .put(`/api/data/${USER_ID}/theme`)
      .set(authHeaders)
      .send({ value: 'updated' });
    expect(res.status).toBe(200);
    expect(res.body.value).toBe('updated');
  });

  it('PUT /:userId/:key returns 404 for missing', async () => {
    const res = await request(app)
      .put(`/api/data/${USER_ID}/nope`)
      .set(authHeaders)
      .send({ value: 'x' });
    expect(res.status).toBe(404);
  });

  it('PUT /:userId/:key rejects missing value', async () => {
    const res = await request(app)
      .put(`/api/data/${USER_ID}/theme`)
      .set(authHeaders)
      .send({});
    expect(res.status).toBe(400);
  });

  it('PUT /:userId/:key rejects oversized value', async () => {
    const res = await request(app)
      .put(`/api/data/${USER_ID}/theme`)
      .set(authHeaders)
      .send({ value: 'x'.repeat(10001) });
    expect(res.status).toBe(400);
  });

  it('POST /:userId/batch upserts multiple records', async () => {
    const res = await request(app)
      .post(`/api/data/${USER_ID}/batch`)
      .set(authHeaders)
      .send({ data: { color: '#000', lang: 'ru', fontSize: '14' } });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(3);
  });

  it('POST /:userId/batch accepts empty data', async () => {
    const res = await request(app)
      .post(`/api/data/${USER_ID}/batch`)
      .set(authHeaders)
      .send({ data: {} });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(0);
  });

  it('POST /:userId/batch rejects non-existent user', async () => {
    const res = await request(app)
      .post('/api/data/999999/batch')
      .set(authHeaders)
      .send({ data: { x: 'y' } });
    expect(res.status).toBe(403);
  });

  it('DELETE /:userId/:key removes a record', async () => {
    let res = await request(app)
      .delete(`/api/data/${USER_ID}/theme`)
      .set(authHeaders);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Deleted');

    res = await request(app)
      .get(`/api/data/${USER_ID}/theme`)
      .set(authHeaders);
    expect(res.status).toBe(404);
  });

  it('DELETE /:userId/:key returns 404 for missing', async () => {
    const res = await request(app)
      .delete(`/api/data/${USER_ID}/nonexistent`)
      .set(authHeaders);
    expect(res.status).toBe(404);
  });

  it('forbids access to other user data', async () => {
    const res = await request(app)
      .get('/api/data/999999')
      .set(authHeaders);
    expect(res.status).toBe(403);
  });

  it('rejects invalid userId in URL', async () => {
    const res = await request(app)
      .get('/api/data/0')
      .set(authHeaders);
    expect(res.status).toBe(400);
  });
});
