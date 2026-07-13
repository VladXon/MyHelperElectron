import { describe, it, expect, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import helmet from 'helmet';

function createApp(isProduction: boolean) {
  const app = express();
  app.use(helmet({
    contentSecurityPolicy: isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
  }));
  app.get('/test', (_req, res) => res.send('ok'));
  return app;
}

describe('CSP Headers', () => {
  it('sets strict CSP in production mode', async () => {
    const app = createApp(true);
    const res = await request(app).get('/test');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['content-security-policy']).toContain("script-src 'self'");
    expect(res.headers['content-security-policy']).toContain("style-src 'self' 'unsafe-inline'");
    expect(res.headers['content-security-policy']).toContain("connect-src 'self' ws: wss:");
    expect(res.headers['content-security-policy']).toContain("frame-src 'none'");
  });

  it('disables CSP in development', async () => {
    const app = createApp(false);
    const res = await request(app).get('/test');
    expect(res.headers['content-security-policy']).toBeUndefined();
  });
});