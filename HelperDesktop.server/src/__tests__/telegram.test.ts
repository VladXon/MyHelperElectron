import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import telegramRouter from '../routes/telegram';
import { getDb } from '../db';

const app = express();
app.use(express.json());

app.use((req: any, _res, next) => {
  req.user = { id: 99999, login: 'tg_test_user' };
  next();
});

app.use('/api/telegram', telegramRouter);

const LINKS_PATH = path.join(__dirname, '..', '..', '..', 'HelperDesktop.telegram', 'bot-links.json');
let originalLinks = '';

beforeAll(() => {
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO users (id, login, name, password, is_dev) VALUES (?, ?, ?, ?, ?)').run(
    99999, 'tg_test_user', 'TG Test User', 'scrypt:abc:def', 0
  );

  if (fs.existsSync(LINKS_PATH)) {
    originalLinks = fs.readFileSync(LINKS_PATH, 'utf-8');
  }
});

afterAll(() => {
  const db = getDb();
  db.prepare('DELETE FROM pending_telegram_links').run();
  db.prepare('DELETE FROM users WHERE login = ?').run('tg_test_user');

  if (originalLinks) {
    fs.writeFileSync(LINKS_PATH, originalLinks);
  }
});

beforeEach(() => {
  const db = getDb();
  db.prepare('DELETE FROM pending_telegram_links').run();

  const cleanLinks = { linkedUsers: {}, adminIds: [] };
  fs.writeFileSync(LINKS_PATH, JSON.stringify(cleanLinks, null, 2));
});

describe('telegram routes', () => {
  describe('GET /status', () => {
    it('returns linked: false when not linked', async () => {
      const res = await request(app).get('/api/telegram/status');
      expect(res.status).toBe(200);
      expect(res.body.linked).toBe(false);
      expect(res.body.telegramId).toBeUndefined();
    });

    it('returns linked: true when linked', async () => {
      const links = { linkedUsers: { '12345': 'tg_test_user' }, adminIds: [] };
      fs.writeFileSync(LINKS_PATH, JSON.stringify(links, null, 2));

      const res = await request(app).get('/api/telegram/status');
      expect(res.status).toBe(200);
      expect(res.body.linked).toBe(true);
      expect(res.body.telegramId).toBe(12345);
    });
  });

  describe('POST /qr/generate', () => {
    it('generates QR code with deepLink', async () => {
      const res = await request(app).post('/api/telegram/qr/generate');
      expect(res.status).toBe(200);
      expect(res.body.code).toBeDefined();
      expect(res.body.deepLink).toContain('https://t.me/');
      expect(res.body.deepLink).toContain(res.body.code);
      expect(res.body.expiresIn).toBe(300);
    });

    it('stores QR code in pending_telegram_links', async () => {
      const res = await request(app).post('/api/telegram/qr/generate');
      const code = res.body.code;

      const db = getDb();
      const row = db.prepare('SELECT * FROM pending_telegram_links WHERE code = ?').get(code) as { login: string; expires_at: number };
      expect(row).toBeDefined();
      expect(row.login).toBe('tg_test_user');
      expect(row.expires_at).toBeGreaterThan(Date.now());
    });
  });

  describe('POST /qr/check', () => {
    it('returns not_found for unknown code', async () => {
      const res = await request(app)
        .post('/api/telegram/qr/check')
        .send({ code: 'NONEXISTENT' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('not_found');
    });

    it('returns pending for valid unlinked code', async () => {
      const genRes = await request(app).post('/api/telegram/qr/generate');
      const code = genRes.body.code;

      const res = await request(app)
        .post('/api/telegram/qr/check')
        .send({ code });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('pending');
    });

    it('returns linked when bot completes linking', async () => {
      const genRes = await request(app).post('/api/telegram/qr/generate');
      const code = genRes.body.code;

      const links = { linkedUsers: { '11111': 'tg_test_user' }, adminIds: [] };
      fs.writeFileSync(LINKS_PATH, JSON.stringify(links, null, 2));

      const res = await request(app)
        .post('/api/telegram/qr/check')
        .send({ code });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('linked');
      expect(res.body.telegramId).toBe(11111);
    });

    it('returns expired for expired code', async () => {
      const db = getDb();
      db.prepare('INSERT OR REPLACE INTO pending_telegram_links (code, type, login, expires_at) VALUES (?, ?, ?, ?)').run(
        'EXPIRED', 'qr', 'tg_test_user', Date.now() - 1000
      );

      const res = await request(app)
        .post('/api/telegram/qr/check')
        .send({ code: 'EXPIRED' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('expired');
    });

    it('deletes expired code from DB', async () => {
      const db = getDb();
      db.prepare('INSERT OR REPLACE INTO pending_telegram_links (code, type, login, expires_at) VALUES (?, ?, ?, ?)').run(
        'EXPIRED2', 'qr', 'tg_test_user', Date.now() - 1000
      );

      await request(app)
        .post('/api/telegram/qr/check')
        .send({ code: 'EXPIRED2' });

      const row = db.prepare('SELECT * FROM pending_telegram_links WHERE code = ?').get('EXPIRED2');
      expect(row).toBeUndefined();
    });
  });

  describe('POST /code/send', () => {
    it('generates confirmation code', async () => {
      const res = await request(app).post('/api/telegram/code/send');
      expect(res.status).toBe(200);
      expect(res.body.code).toBeDefined();
      expect(res.body.code.length).toBe(6);
      expect(res.body.expiresIn).toBe(600);
    });

    it('stores code in pending_telegram_links', async () => {
      const res = await request(app).post('/api/telegram/code/send');
      const code = res.body.code;

      const db = getDb();
      const row = db.prepare('SELECT * FROM pending_telegram_links WHERE code = ?').get(code) as { login: string; expires_at: number };
      expect(row).toBeDefined();
      expect(row.login).toBe('tg_test_user');
      expect(row.expires_at).toBeGreaterThan(Date.now());
    });
  });

  describe('POST /code/verify', () => {
    it('returns 404 for unknown code', async () => {
      const res = await request(app)
        .post('/api/telegram/code/verify')
        .send({ code: 'UNKNOWN' });
      expect(res.status).toBe(404);
    });

    it('verifies valid server-generated code', async () => {
      const genRes = await request(app).post('/api/telegram/code/send');
      const code = genRes.body.code;

      const res = await request(app)
        .post('/api/telegram/code/verify')
        .send({ code });
      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(true);
    });

    it('deletes code after verification', async () => {
      const genRes = await request(app).post('/api/telegram/code/send');
      const code = genRes.body.code;

      await request(app)
        .post('/api/telegram/code/verify')
        .send({ code });

      const db = getDb();
      const row = db.prepare('SELECT * FROM pending_telegram_links WHERE code = ?').get(code);
      expect(row).toBeUndefined();
    });

    it('verifies bot-generated code and links account', async () => {
      const db = getDb();
      db.prepare('INSERT OR REPLACE INTO pending_telegram_links (code, type, telegram_id, expires_at) VALUES (?, ?, ?, ?)').run(
        'BOTCOD', 'code', 55555, Date.now() + 600000
      );

      const res = await request(app)
        .post('/api/telegram/code/verify')
        .send({ code: 'BOTCOD' });
      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(true);

      const links = JSON.parse(fs.readFileSync(LINKS_PATH, 'utf-8'));
      expect(links.linkedUsers['55555']).toBe('tg_test_user');
    });

    it('returns 410 for expired code', async () => {
      const db = getDb();
      db.prepare('INSERT OR REPLACE INTO pending_telegram_links (code, type, login, expires_at) VALUES (?, ?, ?, ?)').run(
        'EXPIR', 'code', 'tg_test_user', Date.now() - 1000
      );

      const res = await request(app)
        .post('/api/telegram/code/verify')
        .send({ code: 'EXPIR' });
      expect(res.status).toBe(410);
    });

    it('returns 403 for code of different user', async () => {
      const db = getDb();
      db.prepare('INSERT OR REPLACE INTO pending_telegram_links (code, type, login, expires_at) VALUES (?, ?, ?, ?)').run(
        'OTHER', 'code', 'other_user', Date.now() + 600000
      );

      const res = await request(app)
        .post('/api/telegram/code/verify')
        .send({ code: 'OTHER' });
      expect(res.status).toBe(403);
    });
  });

  describe('POST /unlink', () => {
    it('unlinks account', async () => {
      const links = { linkedUsers: { '12345': 'tg_test_user' }, adminIds: [] };
      fs.writeFileSync(LINKS_PATH, JSON.stringify(links, null, 2));

      const res = await request(app).post('/api/telegram/unlink');
      expect(res.status).toBe(200);
      expect(res.body.unlinked).toBe(true);

      const updatedLinks = JSON.parse(fs.readFileSync(LINKS_PATH, 'utf-8'));
      expect(updatedLinks.linkedUsers['12345']).toBeUndefined();
    });

    it('returns unlinked even when not linked', async () => {
      const res = await request(app).post('/api/telegram/unlink');
      expect(res.status).toBe(200);
      expect(res.body.unlinked).toBe(true);
    });
  });

  describe('POST /link (credentials)', () => {
    it('returns 400 without login/password', async () => {
      const res = await request(app)
        .post('/api/telegram/link')
        .send({});
      expect(res.status).toBe(400);
    });
  });
});
