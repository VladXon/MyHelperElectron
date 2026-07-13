import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { spawn } from 'node:child_process';
import path from 'node:path';
import authRouter from './routes/auth';
import dataRouter from './routes/data';
import commandsRouter from './routes/commands';
import telegramRouter from './routes/telegram';
import notesRouter from './routes/notes';
import { authenticate } from './middleware';
import { getDb } from './db';
import { setServer } from './server';
import { startWebSocket } from './wss';
import { runMigrations } from './migrate';
import { logger } from './log';

const app = express();
const PORT = process.env.PORT || 3001;

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',').map(o => o.trim());

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

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

function maskPassword(body: unknown): unknown {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const obj = { ...body as Record<string, unknown> };
    if (obj.password) obj.password = '***';
    if (obj.currentPassword) obj.currentPassword = '***';
    if (obj.newPassword) obj.newPassword = '***';
    if (obj.refreshToken) obj.refreshToken = '***';
    if (obj.token) obj.token = '***';
    return obj;
  }
  return body;
}

app.use((req, res, next) => {
  const start = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const requestId = logger.pushRequestId();

  res.on('finish', () => {
    const ms = Date.now() - start;
    const code = res.statusCode;
    const bodyStr = (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')
      ? ` ${JSON.stringify(maskPassword(req.body))}`
      : '';

    const slow = ms > 500 ? ' [SLOW]' : '';
    const statusEmoji = code >= 500 ? '🔥' : code >= 400 ? '⚠' : code >= 300 ? '↪' : '✓';
    const line = `${statusEmoji} [${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${code} (${ms}ms)${slow} [${ip}] [${requestId}]${bodyStr}`;

    if (code >= 500) {
      logger.error(line, new Error(line), { method: req.method, url: req.originalUrl, status: code, duration: ms, ip, requestId, body: maskPassword(req.body) });
    } else if (code >= 400) {
      logger.warn(line, { method: req.method, url: req.originalUrl, status: code, duration: ms, ip, requestId });
    } else {
      logger.info(line, { method: req.method, url: req.originalUrl, status: code, duration: ms, ip, requestId });
    }

    if (code >= 400 && req.method !== 'GET') {
      logger.debug('Request body', { body: maskPassword(req.body) });
    }
  });

  res.on('close', () => {
    logger.popRequestId();
  });

  next();
});

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProduction ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again later.' },
});

app.use(globalLimiter);

app.get('/api/health', (_req, res) => {
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (e) {
    logger.error('Health check failed', e as Error);
    res.status(503).json({ status: 'error', message: 'Database unavailable' });
  }
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/data', authenticate, dataRouter);
app.use('/api', authenticate, commandsRouter);
app.use('/api/telegram', authenticate, telegramRouter);
app.use('/api/notes', authenticate, notesRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  logger.info(`✓ Server running on http://localhost:${PORT}`, { port: PORT, env: process.env.NODE_ENV });
});

setServer(server);
startWebSocket(server);
runMigrations();

const botDir = path.join(__dirname, '..', '..', 'HelperDesktop.telegram');
const isWin = process.platform === 'win32';
const botCmd = isWin ? 'cmd.exe' : 'npx';
const botArgs = isWin ? ['/c', 'npx', 'tsx', 'src/index.ts'] : ['tsx', 'src/index.ts'];

const botChild = spawn(botCmd, botArgs, {
  cwd: botDir,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: !isWin,
  env: { ...process.env, SERVER_URL: `http://localhost:${PORT}` },
});

botChild.stdout?.on('data', (data) => {
  const output = data.toString().trim();
  if (output) logger.info(`[BOT] ${output}`);
});

botChild.stderr?.on('data', (data) => {
  const output = data.toString().trim();
  if (output) logger.error(`[BOT] ${output}`, new Error(output));
});

botChild.on('error', (err) => logger.error('Failed to start bot', err));
botChild.on('exit', (code) => {
  if (code !== 0) logger.warn(`Bot exited with code ${code}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  botChild.kill('SIGTERM');
  try { getDb().pragma('optimize'); } catch { /* ignore */ }
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  botChild.kill('SIGTERM');
  try { getDb().pragma('optimize'); } catch { /* ignore */ }
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
});

export { app };