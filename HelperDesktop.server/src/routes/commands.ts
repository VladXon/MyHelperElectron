import { Router, type Request, type Response } from 'express';
import { spawn } from 'node:child_process';
import { getDb } from '../db';
import type { UserRow } from '../types';
import { validate, commandSchema } from '../validate';
import { getServer } from '../server';
import { logger } from '../logger';

const router = Router();

router.post('/restart', (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  if (!req.user?.is_dev) {
    logger.security('Non-dev attempted /restart', { requestId, userId: req.user?.id, login: req.user?.login });
    res.status(403).json({ error: 'Forbidden: dev only' });
    return;
  }
  logger.info('Server restart requested', { requestId, by: req.user.login });
  res.json({ message: 'Server restarting...' });
  const srv = getServer();
  const done = () => {
    const child = spawn(process.argv[0], process.argv.slice(1), {
      cwd: process.cwd(),
      stdio: 'inherit',
      detached: true,
      windowsHide: true,
    });
    child.unref();
    process.exit(0);
  };
  if (srv) {
    srv.close(done);
  } else {
    done();
  }
});

router.get('/serverinfo', (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  if (!req.user?.is_dev) {
    logger.security('Non-dev attempted /serverinfo', { requestId, userId: req.user?.id, login: req.user?.login });
    res.status(403).json({ error: 'Forbidden: dev only' });
    return;
  }
  const db = getDb();
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;

  const info = {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    uptimeHuman: formatUptime(process.uptime()),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    memory: {
      rss: formatBytes(process.memoryUsage().rss),
      heapUsed: formatBytes(process.memoryUsage().heapUsed),
      heapTotal: formatBytes(process.memoryUsage().heapTotal),
    },
    users: userCount,
    timestamp: new Date().toISOString(),
  };

  logger.info('Server info requested', { requestId, by: req.user.login });
  res.json(info);
});

router.post('/command', validate(commandSchema), (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { command } = req.body;

  const parts = command.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (!req.user?.is_dev) {
    logger.security('Non-dev attempted /command', { requestId, userId: req.user?.id, login: req.user?.login, command });
    res.status(403).json({ error: 'Forbidden: dev only' });
    return;
  }

  logger.info('Command executed', { requestId, by: req.user.login, command });

  if (cmd === '/serverinfo') {
    const db = getDb();
    const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
    const info = {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      uptimeHuman: formatUptime(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        rss: formatBytes(process.memoryUsage().rss),
        heapUsed: formatBytes(process.memoryUsage().heapUsed),
        heapTotal: formatBytes(process.memoryUsage().heapTotal),
      },
      users: userCount,
      timestamp: new Date().toISOString(),
    };
    res.json({ output: JSON.stringify(info, null, 2) });
  } else if (cmd === '/restart') {
    logger.warn('Restart command executed', { requestId, by: req.user.login });
    res.json({ output: 'Server restarting...' });
    const srv = getServer();
    const done = () => {
      const child = spawn(process.argv[0], process.argv.slice(1), {
        cwd: process.cwd(),
        stdio: 'inherit',
        detached: true,
        windowsHide: true,
      });
      child.unref();
      process.exit(0);
    };
    if (srv) {
      srv.close(done);
    } else {
      done();
    }
  } else if (cmd === '/op') {
    const login = args[0];
    if (!login) {
      res.json({ output: 'Usage: /op <login>' });
      return;
    }
    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE login = ?').get(login) as UserRow | undefined;
    if (!row) {
      res.json({ output: `User "${login}" not found` });
      return;
    }
    db.prepare('UPDATE users SET is_dev = 1 WHERE id = ?').run(row.id);
    logger.info('User granted dev via command', { requestId, by: req.user.login, target: login });
    res.json({ output: `User "${login}" is now a developer` });
  } else {
    logger.warn('Unknown command', { requestId, command: cmd });
    res.status(400).json({ output: `Unknown command: ${cmd}` });
  }
});

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

export default router;