# MyHelperElectron

Десктопное приложение для управления пресетами запуска приложений с интеграцией Telegram бота и локальным Express сервером.

---

## Стек

| Область | Технологии |
|---------|-----------|
| Desktop | Electron 43, Electron Forge 7 |
| Frontend | React 19, TypeScript 5.7, Vite 5, Framer Motion, Phosphor Icons |
| Backend | Express 4, better-sqlite3, Zod 4, express-rate-limit |
| Auth | Node crypto scrypt, JWT (jsonwebtoken) |
| Bot | grammy (Telegram Bot API) |
| Realtime | ws (WebSocket health heartbeat) |
| Tests | Vitest, Supertest, Playwright (e2e) |

---

## Текущее состояние

### Готово

| Модуль | Статус |
|--------|--------|
| Пресеты запуска приложений | Готово — CRUD, запуск, закрепление в sidebar |
| Мульти-аккаунт | Готово — переключение, шифрование credentials (safeStorage) |
| Telegram привязка | Готово — QR flow + code flow, shared SQLite |
| Настройки темы | Готово — CSS variables, per-user storage |
| Здоровье сервера | Готово — WebSocket heartbeat + HTTP polling |
| Заметки | Готово — CRUD, теги, pinned/completed, напоминания |
| Палитра команд | Готово — Ctrl+K, быстрая навигация |
| DateTimePicker | Готово — выбор даты/времени, умное позиционирование (dropUp) |
| Кастомный titlebar | Готово — frameless window, кнопки управления |
| IPC модули | Готово — разбиты по фичам (auth, notes, presets, server, settings, telegram) |
| CSS модули | Готово — разбиты по компонентам (11 файлов) |

### Исправлено (текущая сессия)

| Что | Описание |
|-----|----------|
| CSP Headers | Строгий Content Security Policy через Helmet |
| Path Traversal Protection | Валидация всех файловых операций |
| Drizzle ORM Migration | Полная миграция с raw SQL на Drizzle |
| Playwright E2E Tests | API тесты для auth, data, notes, telegram, security |
| CI/CD Pipeline | GitHub Actions: lint, typecheck, test, build, e2e |
| Линт ошибки | Удалены неиспользуемые импорты, `any` → `unknown`, дублирующие импорты |
| DateTimePicker | Умное позиционирование (открывается вверх если мало места), маркер "сегодня" |
| IPC модули | Разделение main.ts на 7 файлов в `main/ipc/` |
| CSS | Разбиение index.css на 11 файлов по модулям |

### Текущие ошибки линта

| Ошибка | Файл | Причина |
|--------|------|---------|
| `import/no-unresolved` | `e2e/playwright.config.ts` | `@playwright/test` не установлен (devDependency) |
| `import/no-unresolved` | `e2e/server-api.spec.ts` | `@playwright/test` не установлен (devDependency) |

---

## Архитектура

```
Renderer (React) → preload (IPC) → Main (Electron) → HTTP fetch → Express Server → SQLite
                                                                  ↕ spawn
                                                            Telegram Bot (grammy)
```

### Принципы изоляции

- `contextIsolation: true`, `nodeIntegration: false` — Renderer не имеет доступа к Node.js
- Вся связь Renderer ↔ Main через IPC (`ipcRenderer.invoke` → `ipcMain.handle`)
- Preload bridge: `contextBridge.exposeInMainWorld`
- Бот НЕ вызывает сервер напрямую, только через БД или HTTP
- Сервер spawn'ит бота как child process при старте

---

## Структура

```
MyHelperElectron/
├── HelperDesktop.io/              # Electron + React фронтенд
│   └── src/
│       ├── main.ts                # Main process, IPC proxy, WS client
│       ├── preload.ts             # contextBridge API
│       ├── renderer.tsx           # React entry + ErrorBoundary
│       ├── App.tsx                # Root, server monitoring, presets
│       ├── AuthContext.tsx         # Auth state, multi-account
│       ├── ThemeContext.tsx        # CSS variable theming
│       ├── types.d.ts             # IPC type declarations (Note, Preset, User, etc.)
│       ├── main/ipc/              # IPC handler модули
│       │   ├── index.ts           # Регистрация всех IPC
│       │   ├── auth.ts            # Авторизация (login, register, tokens, multi-account)
│       │   ├── notes.ts           # Заметки (CRUD, toggle)
│       │   ├── presets.ts         # Пресеты (CRUD, launch, dialog)
│       │   ├── server.ts          # Сервер (url, test, api proxy, ws)
│       │   ├── settings.ts        # Настройки (get, set, batch)
│       │   └── telegram.ts        # Telegram (status, link, qr, code)
│       ├── components/            # UI страницы, модалки, sidebar, titlebar
│       │   ├── AuthModal.tsx      # Модальное окно авторизации
│       │   ├── CommandPalette.tsx  # Палитра команд (Ctrl+K)
│       │   ├── DateTimePicker.tsx  # Выбор даты и времени
│       │   ├── ErrorBoundary.tsx   # Обработчик ошибок
│       │   ├── NoteEditModal.tsx   # Редактор заметок
│       │   ├── NotesPage.tsx      # Страница заметок
│       │   ├── PresetEditModal.tsx # Редактор пресетов
│       │   ├── PresetsPage.tsx    # Страница пресетов
│       │   ├── SettingsPage.tsx   # Страница настроек
│       │   ├── Sidebar.tsx        # Боковая панель
│       │   ├── TelegramModal.tsx  # Привязка Telegram
│       │   └── Titlebar.tsx       # Кастомный titlebar
│       └── styles/                # CSS файлы по модулям
│           ├── index.css          # Entry point
│           ├── global.css         # Глобальные стили, переменные
│           ├── titlebar.css       # Titlebar
│           ├── sidebar.css        # Sidebar
│           ├── content.css        # Контент
│           ├── settings.css       # Настройки
│           ├── notes.css          # Заметки + DateTimePicker
│           ├── modals.css         # Модальные окна
│           ├── presets.css        # Пресеты
│           ├── command-palette.css # Палитра команд
│           └── telegram.css       # Telegram модалка
│
├── HelperDesktop.server/          # Express + SQLite backend
│   └── src/
│       ├── index.ts               # Entry, middleware, routes, bot spawn
│       ├── db.ts                  # SQLite schema, password hashing, migrations
│       ├── auth.ts                # JWT, sessions, refresh tokens
│       ├── middleware.ts          # Auth middleware (Bearer + x-auth headers)
│       ├── validate.ts            # Zod 4 schemas + middleware
│       ├── wss.ts                 # WebSocket server, health broadcast
│       ├── migrate.ts             # Embedded SQL migrations
│       ├── routes/                # API routes (auth, data, notes, commands, telegram)
│       └── __tests__/             # Vitest тесты (8 файлов)
│
├── HelperDesktop.telegram/        # Telegram bot (grammy)
│   └── src/
│       ├── index.ts               # Bot commands, handlers
│       ├── config.ts              # bot-config.json loading
│       └── db.ts                  # Shared SQLite
│
├── shared/
│   └── src/
│       ├── types.ts               # Shared types (UserRow, DataRecord, TokenResponse)
│       └── telegram-links.ts      # Shared linking functions
│
└── docs/
    └── README.md                  # Этот файл
```

---

## Preload API

```typescript
contextBridge.exposeInMainWorld('electronWindow', {...})      // Управление окном
contextBridge.exposeInMainWorld('electronAuth', {...})        // Авторизация
contextBridge.exposeInMainWorld('electronSettings', {...})    // Настройки
contextBridge.exposeInMainWorld('electronServer', {...})      // Сервер + WebSocket
contextBridge.exposeInMainWorld('electronPresets', {...})     // Пресеты
contextBridge.exposeInMainWorld('electronDialog', {...})      // Диалоги
contextBridge.exposeInMainWorld('electronTelegram', {...})    // Telegram
contextBridge.exposeInMainWorld('electronNotes', {...})       // Заметки
```

---

## IPC каналы

| Модуль | Каналы | Ответственность |
|--------|--------|-----------------|
| `auth.ts` | `auth:login`, `auth:save-credentials`, `auth:load-credentials`, `auth:clear-credentials`, `auth:change-password`, `auth:set-email`, `auth:get-token`, `auth:save-token`, `auth:logout`, `auth:list-accounts`, `auth:switch-account`, `auth:remove-account` | Login, регистрация, multi-account, credentials (encrypted via safeStorage) |
| `settings.ts` | `settings:get`, `settings:set`, `settings:set-many`, `settings:get-all` | Proxy к `/api/data/:userId` |
| `telegram.ts` | `telegram:status`, `telegram:link`, `telegram:unlink`, `telegram:qr-generate`, `telegram:qr-check`, `telegram:code-send`, `telegram:code-verify` | QR и code flows привязки |
| `presets.ts` | `presets:get-all`, `presets:save`, `presets:delete`, `presets:launch`, `dialog:open-file` | Локальный CRUD пресетов + запуск приложений |
| `notes.ts` | `notes:get-all`, `notes:create`, `notes:update`, `notes:remove`, `notes:toggle` | CRUD заметок |
| `server.ts` | `server:get-url`, `server:set-url`, `server:test`, `server:api`, `server:connect-ws` | URL сервера, health check, API proxy, WebSocket |
| `window.ts` | `window-minimize`, `window-maximize-toggle`, `window-close`, `window-is-maximized` | Управление frameless окном |

---

## API Endpoints

### Auth (`/api/auth`) — rate limit: 20/15min

| Method | Path | Auth | Описание |
|--------|------|------|----------|
| POST | `/register` | No | Регистрация (идемпотентна) |
| POST | `/login` | No | Проверка пароля |
| POST | `/token` | No | Выдача JWT + refresh token |
| POST | `/refresh` | No | Ротация refresh token |
| POST | `/logout` | Optional | Удаление сессии |
| PUT | `/email` | Password | Смена email |
| PUT | `/password` | Current password | Смена пароля |

### Data (`/api/data`) — все требуют аутентификацию

| Method | Path | Описание |
|--------|------|----------|
| GET | `/:userId` | Все записи пользователя |
| GET | `/:userId/:key` | Одна запись |
| POST | `/:userId` | Upsert одной записи |
| PUT | `/:userId/:key` | Обновление значения |
| POST | `/:userId/batch` | Батч upsert |
| DELETE | `/:userId/:key` | Удаление |

### Notes (`/api/notes`) — все требуют аутентификацию

| Method | Path | Описание |
|--------|------|----------|
| GET | `/` | Все заметки |
| POST | `/` | Создание |
| PUT | `/:id` | Обновление |
| DELETE | `/:id` | Удаление |
| PATCH | `/:id/toggle` | Переключение pinned/completed |

### Telegram (`/api/telegram`) — все требуют аутентификацию

| Method | Path | Описание |
|--------|------|----------|
| GET | `/status` | Статус привязки |
| POST | `/link` | Проверка credentials |
| POST | `/unlink` | Отвязка |
| POST | `/qr/generate` | QR код (5 мин TTL) |
| POST | `/qr/check` | Статус QR |
| POST | `/code/send` | Код подтверждения (10 мин TTL) |
| POST | `/code/verify` | Верификация кода |

### Health & WebSocket

- `GET /api/health` — `SELECT 1`, возврат status/timestamp
- `ws://host:port/ws` — heartbeat каждые 10 секунд

---

## Аутентификация

### Методы

1. **Bearer Token:** `Authorization: Bearer <jwt>` → verify JWT → check session → load user
2. **Headers:** `x-auth-login` + `x-auth-password` → verify password → load user

### JWT

- HS256, payload: `{ userId, login, jti }`
- Access token: 24 часа
- Refresh token: 48 byte hex, 7 дней

### Multi-account (Electron)

**Формат `userData/auth.json`:**
```json
{
  "version": 2,
  "activeAccount": "login1",
  "accounts": {
    "login1": { "login": "login1", "password": "enc:...", "token": "...", "refreshToken": "..." }
  }
}
```

- `safeStorage.encryptString/decryptString` — префикс `enc:` для зашифрованных значений
- Автовход: token → refresh → login/password

---

## База данных

**Движок:** SQLite (better-sqlite3), WAL mode

### Текущие таблицы

```sql
users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    password TEXT NOT NULL DEFAULT '',  -- scrypt:<N>:<r>:<p>:<salt>:<hash>
    is_dev INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    refresh_token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, key)
);

notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',  -- JSON array
    pinned INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    reminder_at INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

pending_telegram_links (
    code TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('qr', 'code')),
    login TEXT,
    telegram_id INTEGER,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## Конфигурация

| Файл | Назначение |
|------|------------|
| `userData/auth.json` | Зашифрованные credentials (multi-account) |
| `userData/server-url.json` | URL бэкенда |
| `userData/presets.json` | Пресеты приложений |
| `bot-config.json` | Telegram bot token |
| `bot-links.json` | Связки telegram_id ↔ login |

| Переменная | По умолчанию |
|------------|--------------|
| `PORT` | `3001` |
| `JWT_SECRET` | dev fallback в коде |
| `SERVER_URL` | `http://localhost:3001` |

---

## Запуск

```bash
# Сервер (watch mode, спавнит бота)
cd HelperDesktop.server && npm run dev

# Клиент (Electron + Vite)
cd HelperDesktop.io && npm run dev

# Тесты сервера
cd HelperDesktop.server && npm test

# Линт клиента
cd HelperDesktop.io && npm run lint
```

---

## Безопасность

### Реализованные меры

| Мера | Реализация |
|------|-----------|
| Context Isolation | `contextIsolation: true`, `nodeIntegration: false` |
| IPC | Только через `contextBridge` + `ipcRenderer.invoke` |
| Пароли | scrypt (N=16384, r=8, p=1, salt=32B, key=64B) |
| JWT | HS256, 24h access, 7d refresh |
| Rate Limiting | 20 req/15min на `/api/auth/*` |
| Input Validation | Zod 4 на критических эндпоинтах |
| SQL Injection | Параметризованные запросы (better-sqlite3) |
| Шифрование credentials | Electron safeStorage |
| Sandbox | `sandbox: true` в webPreferences |
| DevTools | Заблокирован в production (`if (!app.isPackaged)`) |
| CSP Headers | Строгие директивы через Helmet (production) |
| Path Traversal | Валидация во всех файловых операциях |

### Известные проблемы

| Проблема | Серьёзность |
|----------|-------------|
| Нет шифрования БД | Высокая (при медицинских данных) |
| WebSocket без аутентификации | Средняя |

---

## Технический долг

### P0 (немедленно) ✅ ВСЕ ИСПРАВЛЕНО

| Задача | Статус |
|--------|--------|
| CSP заголовки | ✅ Готово |
| Path traversal protection | ✅ Готово |

### P1 (1-2 месяца) ✅ ВЫПОЛНЕНО

| Задача | Статус |
|--------|--------|
| Drizzle ORM | ✅ Миграция завершена |
| Интеграционные тесты | ✅ Vitest + Supertest |
| CI/CD | ✅ GitHub Actions |

### P2 (3-6 месяцев) ⏳ ОЖИДАЕТ

| Задача | Статус |
|--------|--------|
| Feature-based архитектура | ⏳ Планируется |
| AI Assistant (LM Studio) | ⏳ Планируется |
| Календарь, задачи | Расширение функционала |

---

## Дорожная карта

### Фаза 1: Стабилизация (текущая) ✅ ЗАВЕРШЕНА
- [x] Разбить main.ts на IPC модули
- [x] Разбить index.css по фичам (11 файлов)
- [x] Исправить линт ошибки
- [x] DateTimePicker с умным позиционированием
- [x] Добавить CSP заголовки
- [x] CI (lint + typecheck + build)

### Фаза 2: Инфраструктура (2-3 месяца) ✅ ЗАВЕРШЕНА
- [x] Drizzle ORM вместо raw SQL
- [x] Интеграционные тесты (Vitest)
- [x] E2E тесты (Playwright)
- [x] GitHub Actions CI/CD

### Фаза 3: Ядро платформы (3-6 месяцев)
- [ ] AI Assistant (LM Studio, OpenAI-compatible API)
- [ ] Расширенный Telegram (управление заметками/задачами)
- [ ] Задачи (tasks) с статусами
- [ ] Календарь

### Фаза 4: Медицинский модуль (6-9 месяцев)
- [ ] Талоны к врачу (CRUD + напоминания)
- [ ] Медицинские документы (загрузка файлов)
- [ ] Шифрование медицинских данных (AES-256-GCM)

### Фаза 5: Поиск и синхронизация (9-12 месяцев)
- [ ] Полнотекстовый поиск (SQLite FTS5)
- [ ] Облачная синхронизация
- [ ] Автоматические бэкапы

---

## Тестирование

### Конфигурация

- `pool: 'forks'`, `fileParallelism: false` — предотвращает race conditions с SQLite
- Серверные тесты: Vitest + Supertest
- E2E: Playwright (API тесты)

### Наборы тестов (server)

| Файл | Описание |
|------|----------|
| `validate.test.ts` | Zod схемы |
| `middleware.test.ts` | Auth middleware |
| `db.test.ts` | Hash/verify, migrations |
| `routes.test.ts` | Auth flow |
| `data.test.ts` | Data CRUD |
| `notes.test.ts` | Notes CRUD |
| `telegram.test.ts` | Telegram linking |
| `commands.test.ts` | Dev commands |
| `server.test.ts` | Health + auth flow |
| `security-flow.test.ts` | Security integration |
| `csp.test.ts` | CSP headers |
| `path-validation.test.ts` | Path traversal protection |

---

*Обновлено: 12 июля 2026*
