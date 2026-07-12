import { test, expect } from '@playwright/test';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';

test.describe('Server API smoke tests', () => {
  test('GET /api/health returns ok', async ({ request }) => {
    const res = await request.get(`${SERVER_URL}/api/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('POST /api/auth with invalid body returns 400', async ({ request }) => {
    const res = await request.post(`${SERVER_URL}/api/auth/login`, { data: {} });
    expect(res.status()).toBe(400);
  });

  test('unauthenticated request to /api/data returns 401', async ({ request }) => {
    const res = await request.get(`${SERVER_URL}/api/data/1`);
    expect(res.status()).toBe(401);
  });
});
