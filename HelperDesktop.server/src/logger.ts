import fs from 'node:fs';
import path from 'node:path';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
  requestId?: string;
}

class Logger {
  private level: LogLevel;
  private logFile: string | null = null;
  private errorFile: string | null = null;
  private requestIdCounter = 0;
  private isProduction: boolean;

  private readonly levels: Record<LogLevel, number> = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5,
  };

  private readonly colors: Record<LogLevel, string> = {
    trace: '\x1b[90m',
    debug: '\x1b[36m',
    info: '\x1b[32m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
    fatal: '\x1b[35m',
  };

  private readonly resetColor = '\x1b[0m';

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.level = (process.env.LOG_LEVEL as LogLevel) || (this.isProduction ? 'info' : 'debug');
    this.initFiles();
  }

  private initFiles() {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const date = new Date().toISOString().split('T')[0];
      this.logFile = path.join(logDir, `app-${date}.log`);
      this.errorFile = path.join(logDir, `error-${date}.log`);
    } catch {
      this.logFile = null;
      this.errorFile = null;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level];
  }

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, message, context, error, requestId } = entry;
    const levelStr = level.toUpperCase().padEnd(5);
    const reqId = requestId ? ` [${requestId}]` : '';
    const ctx = context ? ` ${JSON.stringify(context)}` : '';
    const err = error ? `\n  Error: ${error.message}\n  Stack: ${error.stack}` : '';
    return `[${timestamp}] ${levelStr}${reqId}: ${message}${ctx}${err}`;
  }

  private writeToFile(entry: LogEntry) {
    if (!this.logFile) return;
    try {
      const line = this.formatMessage(entry) + '\n';
      fs.appendFileSync(this.logFile, line);
      if (entry.level === 'error' || entry.level === 'fatal') {
        fs.appendFileSync(this.errorFile!, line);
      }
    } catch { }
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      requestId: this.getCurrentRequestId(),
    };

    const formatted = this.formatMessage(entry);
    const color = this.colors[level];

    if (this.isProduction) {
      console.log(JSON.stringify(entry));
    } else {
      console.log(`${color}${formatted}${this.resetColor}`);
    }

    this.writeToFile(entry);

    if (level === 'fatal') {
      process.exit(1);
    }
  }

  private requestIdStack: string[] = [];

  pushRequestId(id?: string): string {
    const requestId = id || `req_${++this.requestIdCounter}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.requestIdStack.push(requestId);
    return requestId;
  }

  popRequestId(): void {
    this.requestIdStack.pop();
  }

  getCurrentRequestId(): string | undefined {
    return this.requestIdStack[this.requestIdStack.length - 1];
  }

  trace(message: string, context?: Record<string, unknown>) {
    this.log('trace', message, context);
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error);
  }

  fatal(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('fatal', message, context, error);
  }

  request(req: { method: string; url: string; ip?: string; headers?: Record<string, string> }, res?: { statusCode: number }, durationMs?: number) {
    const requestId = this.getCurrentRequestId();
    const statusCode = res?.statusCode;
    const statusEmoji = statusCode ? (statusCode >= 500 ? '🔥' : statusCode >= 400 ? '⚠' : statusCode >= 300 ? '↪' : '✓') : '';
    const slow = durationMs && durationMs > 500 ? ' ⚠' : '';
    const duration = durationMs ? ` (${durationMs}ms)${slow}` : '';
    
    this.info(`${req.method} ${req.url} → ${statusCode || '?'}${duration} [${req.ip || '?'}]`, {
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      statusCode,
      durationMs,
      userAgent: req.headers?.['user-agent'],
    });
  }

  requestError(req: { method: string; url: string; ip?: string }, error: Error) {
    this.error(`${req.method} ${req.url} → ERROR [${req.ip || '?'}]`, error, {
      requestId: this.getCurrentRequestId(),
      method: req.method,
      url: req.url,
      ip: req.ip,
    });
  }

  startup(message: string, context?: Record<string, unknown>) {
    this.info(`🚀 ${message}`, context);
  }

  shutdown(message: string, context?: Record<string, unknown>) {
    this.info(`🛑 ${message}`, context);
  }

  db(message: string, context?: Record<string, unknown>) {
    this.debug(`🗄 ${message}`, context);
  }

  auth(message: string, context?: Record<string, unknown>) {
    this.info(`🔐 ${message}`, context);
  }

  security(message: string, context?: Record<string, unknown>) {
    this.warn(`🛡 ${message}`, context);
  }

  websocket(message: string, context?: Record<string, unknown>) {
    this.debug(`🔌 ${message}`, context);
  }

  bot(message: string, context?: Record<string, unknown>) {
    this.info(`🤖 ${message}`, context);
  }

  performance(message: string, durationMs: number, context?: Record<string, unknown>) {
    const level: LogLevel = durationMs > 1000 ? 'warn' : durationMs > 500 ? 'info' : 'debug';
    this.log(level, `⚡ ${message} (${durationMs}ms)`, { ...context, durationMs });
  }

  child(bindings: Record<string, unknown>): Logger {
    const child = Object.create(this);
    const originalLog = this.log.bind(this);
    child.log = (level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) => {
      originalLog(level, message, { ...bindings, ...context }, error);
    };
    return child;
  }
}

export const logger = new Logger();

export function createRequestLogger(req: { method: string; url: string; ip?: string }) {
  const requestId = logger.pushRequestId();
  return {
    requestId,
    info: (message: string, context?: Record<string, unknown>) => logger.info(message, { ...context, requestId }),
    debug: (message: string, context?: Record<string, unknown>) => logger.debug(message, { ...context, requestId }),
    warn: (message: string, context?: Record<string, unknown>) => logger.warn(message, { ...context, requestId }),
    error: (message: string, error?: Error, context?: Record<string, unknown>) => logger.error(message, error, { ...context, requestId }),
    finish: (res: { statusCode: number }, durationMs: number) => {
      logger.request(req, res, durationMs);
      logger.popRequestId();
    },
    errorHandler: (error: Error) => {
      logger.requestError(req, error);
      logger.popRequestId();
    },
  };
}

export function maskSensitive(data: Record<string, unknown>, keys = ['password', 'token', 'refreshToken', 'currentPassword', 'newPassword', 'authorization', 'cookie']): Record<string, unknown> {
  const result = { ...data };
  for (const key of keys) {
    if (key in result) {
      result[key] = '***';
    }
  }
  return result;
}