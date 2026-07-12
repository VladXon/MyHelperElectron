import { Bot, type Context, session, type SessionFlavor } from 'grammy';
import { loadConfig } from './config';
import { getDb, getServerUrl, verifyPassword } from './db';
import { loadLinks, saveLinks, linkTelegram, unlinkTelegram, getLinkedTelegramId } from '../../shared/src/telegram-links';
import crypto from 'node:crypto';
import { logger } from '../../HelperDesktop.server/src/logger';

const links = loadLinks();
const LINKED_USERS = new Map(Object.entries(links.linkedUsers).map(([k, v]) => [Number(k), v]));
const ADMIN_IDS = new Set(links.adminIds);

interface SessionData {}

type BotContext = Context & SessionFlavor<SessionData>;

const config = loadConfig();

if (!config.token) {
  logger.error('BOT_TOKEN not set. Create bot-config.json or set BOT_TOKEN env.');
  process.exit(1);
}

const bot = new Bot<BotContext>(config.token);

bot.use(session({ initial: (): SessionData => ({}) }));

bot.command('start', async (ctx) => {
  const text = ctx.message?.text?.trim();
  const parts = text?.split(/\s+/);

  if (parts && parts.length > 1) {
    const code = parts[1];

    const db = getDb();
    const row = db.prepare("SELECT * FROM pending_telegram_links WHERE code = ? AND type = 'qr'").get(code) as { login: string; expires_at: number } | undefined;

    if (!row) {
      await ctx.reply('❌ Неверный или просроченный код QR');
      return;
    }

    if (Date.now() > row.expires_at) {
      db.prepare('DELETE FROM pending_telegram_links WHERE code = ?').run(code);
      await ctx.reply('❌ Код QR просрочен');
      return;
    }

    const user = db.prepare('SELECT login, is_dev FROM users WHERE login = ?').get(row.login) as { login: string; is_dev: number } | undefined;

    if (!user) {
      db.prepare('DELETE FROM pending_telegram_links WHERE code = ?').run(code);
      await ctx.reply('❌ Пользователь не найден');
      return;
    }

    const userId = ctx.from!.id;
    LINKED_USERS.set(userId, user.login);
    if (user.is_dev) {
      ADMIN_IDS.add(userId);
    }
    saveLinks({ linkedUsers: Object.fromEntries(LINKED_USERS) as Record<number, string>, adminIds: [...ADMIN_IDS] });

    db.prepare('DELETE FROM pending_telegram_links WHERE code = ?').run(code);

    await ctx.reply(`✅ Telegram привязан к аккаунту \`${user.login}\``, { parse_mode: 'Markdown' });
    logger.bot('Telegram linked via QR', { telegramId: userId, login: user.login });
    return;
  }

  await ctx.reply(
    `👋 Привет! Я бот HelperDesktop.\n\n` +
    `Команды:\n` +
    `/login <username> <password> — привязать аккаунт\n` +
    `/link — получить код для привязки\n` +
    `/status — статус сервера\n` +
    `/me — информация о профиле\n` +
    `/help — список команд`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    `📋 *Доступные команды:*\n\n` +
    `/login <username> <password> — привязать Telegram к аккаунту\n` +
    `/link — получить код для привязки\n` +
    `/logout — отвязать аккаунт\n` +
    `/status — статус сервера\n` +
    `/me — информация о профиле\n` +
    `/id — мой Telegram ID`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('id', async (ctx) => {
  await ctx.reply(`🆔 Ваш Telegram ID: \`${ctx.from?.id}\``, { parse_mode: 'Markdown' });
});

bot.command('login', async (ctx) => {
  const text = ctx.message?.text?.trim();
  const parts = text?.split(/\s+/);
  if (!parts || parts.length < 3) {
    await ctx.reply('❌ Использование: /login <username> <password>');
    return;
  }

  const [, login, password] = parts;

  const db = getDb();
  const row = db.prepare('SELECT id, name, password, is_dev FROM users WHERE login = ?').get(login) as { id: number; name: string; password: string; is_dev: number } | undefined;
  if (!row) {
    await ctx.reply('❌ Пользователь не найден');
    logger.bot('Login attempt for unknown user', { telegramId: ctx.from!.id, login });
    return;
  }
  if (!verifyPassword(password, row.password)) {
    await ctx.reply('❌ Неверный пароль');
    logger.security('Bot login: wrong password', { telegramId: ctx.from!.id, login });
    return;
  }

  const userId = ctx.from!.id;
  LINKED_USERS.set(userId, login);
  if (row.is_dev) ADMIN_IDS.add(userId);
  linkTelegram(userId, login, row.is_dev === 1);

  await ctx.reply(
    `✅ Telegram привязан к аккаунту \`${login}\`${row.is_dev ? ' [DEV]' : ''}`,
    { parse_mode: 'Markdown' }
  );
  logger.bot('Telegram linked via login', { telegramId: userId, login });
});

bot.command('logout', async (ctx) => {
  const userId = ctx.from!.id;
  const login = LINKED_USERS.get(userId);
  LINKED_USERS.delete(userId);
  ADMIN_IDS.delete(userId);
  if (login) {
    unlinkTelegram(login);
  }
  await ctx.reply('✅ Аккаунт отвязан');
  logger.bot('Telegram unlinked', { telegramId: userId, login });
});

bot.command('me', async (ctx) => {
  const userId = ctx.from!.id;
  const login = LINKED_USERS.get(userId);

  if (!login) {
    await ctx.reply('❌ Аккаунт не привязан. Используйте /login');
    return;
  }

  const db = getDb();
  const row = db.prepare('SELECT login, name, email, is_dev FROM users WHERE login = ?').get(login) as { login: string; name: string; email: string; is_dev: number } | undefined;

  if (!row) {
    await ctx.reply('❌ Пользователь не найден в БД');
    return;
  }

  await ctx.reply(
    `👤 *Профиль*\n\n` +
    `Логин: \`${row.login}\`\n` +
    `Имя: ${row.name || '—'}\n` +
    `Email: ${row.email || '—'}\n` +
    `Статус: ${row.is_dev ? '🌟 Dev' : '👤 User'}`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('status', async (ctx) => {
  try {
    const res = await fetch(`${getServerUrl()}/api/health`);
    const data = await res.json() as { status: string; timestamp: string };
    await ctx.reply(
      `📡 *Сервер*\n\n` +
      `Статус: \`${data.status}\`\n` +
      `Время: \`${data.timestamp}\``,
      { parse_mode: 'Markdown' }
    );
  } catch {
    await ctx.reply('❌ Сервер недоступен');
  }
});

bot.command('link', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const links = loadLinks();

  if (links.linkedUsers[userId]) {
    await ctx.reply('❌ Аккаунт уже привязан. Используйте /logout для отвязки.');
    return;
  }

  const code = crypto.randomBytes(4).toString('base64url').slice(0, 6).toUpperCase();
  const db = getDb();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  db.prepare('INSERT OR REPLACE INTO pending_telegram_links (code, type, telegram_id, expires_at) VALUES (?, ?, ?, ?)').run(
    code, 'code', userId, expiresAt
  );

  await ctx.reply(
    `🔑 *Код подтверждения:*\n\n` +
    `\`${code}\`\n\n` +
    `Введите этот код в настройках приложения для привязки.\n` +
    `Код действителен 10 минут.`,
    { parse_mode: 'Markdown' }
  );
  logger.bot('Confirmation code generated', { telegramId: userId, code });
});

bot.catch((err) => {
  logger.error('Bot error', err);
});

bot.start({
  onStart: () => {
    logger.bot('Telegram bot started');
  },
});

setInterval(async () => {
  try {
    const db = getDb();
    const now = Date.now();
    const pending = db.prepare(
      `SELECT n.*, u.login FROM notes n
       JOIN users u ON n.user_id = u.id
       WHERE n.reminder_at IS NOT NULL AND n.reminder_at <= ? AND n.completed = 0`
    ).all(now) as any[];

    for (const note of pending) {
      const telegramId = getLinkedTelegramId(note.login);
      if (!telegramId) continue;

      const tags = note.tags ? JSON.parse(note.tags) : [];
      const tagStr = tags.length ? `\n🏷 ${tags.join(', ')}` : '';

      await bot.api.sendMessage(telegramId,
        `🔔 <b>Напоминание</b>\n\n📝 ${note.title}` +
        (note.body ? `\n${note.body}` : '') +
        tagStr +
        `\n\n⏰ ${new Date(note.reminder_at).toLocaleString('ru-RU')}`,
        { parse_mode: 'HTML' }
      );

      db.prepare(`UPDATE notes SET reminder_at = NULL, updated_at = datetime('now') WHERE id = ?`).run(note.id);
      logger.bot('Reminder sent', { noteId: note.id, login: note.login });
    }
  } catch (err) {
    logger.error('Reminder poll error', err as Error);
  }
}, 30_000);