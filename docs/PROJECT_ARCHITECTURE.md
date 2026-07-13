# Архитектура проекта MyHelperElectron

## Обновленная схема (после миграции безопасности)

```
Renderer (React) → preload (IPC) → Main (Electron) → HTTP fetch → Express Server → SQLite (better-sqlite3)
                                                                          ↕ spawn
                                                              Telegram Bot (grammy)
```

## Безопасность

### Реализованные меры защиты

| Мера | Реализация |
|------|------------|
| **Content Security Policy (CSP)** | Строгие директивы в production через Helmet: `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: https:`, `connect-src 'self' ws: wss:`, `font-src 'self' https://fonts.gstatic.com`, `frame-src 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`. В development CSP отключен для работы React DevTools. |
| **Path Traversal Protection** | Утилита `validatePath(userPath, baseDir)` в Electron (`src/main/utils/path-validation.ts`) и сервере (`src/utils/path-validation.ts`). Нормализует пути, блокирует `..`, абсолютные пути, null-байты, гарантирует что resolved путь находится внутри baseDir. Применена ко всем файловым операциям (dialog:open-file, загрузка пресетов, авторизация). |
| **Rate Limiting** | 20 req/15min на `/api/auth/*`, 100 req/min (prod) / 1000 req/min (dev) глобально |
| **SQL Injection** | Параметризованные запросы через better-sqlite3 (все запросы используют `?` плейсхолдеры) |
| **Пароли** | scrypt (N=16384, r=8, p=1, salt=32B, key=64B) |
| **JWT** | HS256, payload: `{ userId, login, jti }`, access: 24ч, refresh: 7д |
| **Context Isolation** | `contextIsolation: true`, `nodeIntegration: false` |
| **IPC** | Только через `contextBridge` + `ipcRenderer.invoke` |
| **Шифрование credentials** | Electron `safeStorage.encryptString/decryptString` (префикс `enc:`) |
| **Sandbox** | `sandbox: true` в webPreferences |
| **DevTools** | Блокирован в production (`if (!app.isPackaged)`) |

### Известные проблемы (требуют внимания)

| Проблема | Серьёзность |
|----------|-------------|
| Нет шифрования БД | Высокая (критично для медицинских данных) |
| WebSocket без аутентификации | Средняя |

---

## База данных

**Движок:** SQLite (better-sqlite3), WAL mode

### Таблицы

```sql
users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    password TEXT NOT NULL DEFAULT '',  -- scrypt:N:r:p:salt:hash
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
    tags TEXT NOT NULL DEFAULT '[]',
    pinned INTEGER NOT NULL DEFAULT 0,
    completed INTEGER NOT NULL DEFAULT 0,
    reminder_at INTEGER,
    notify_telegram INTEGER NOT NULL DEFAULT 0,
    telegram_notified INTEGER NOT NULL DEFAULT 0,
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

## Структура проекта

```
MyHelperElectron/
├── HelperDesktop.io/           # Electron + React фронтенд
│   ├── src/
│   │   ├── main.ts             # Main process, IPC proxy, WS client
│   │   ├── preload.ts          # contextBridge API
│   │   ├── renderer.tsx        # React entry + ErrorBoundary
│   │   ├── App.tsx             # Root, server monitoring, presets
│   │   ├── AuthContext.tsx     # Auth state, multi-account
│   │   ├── ThemeContext.tsx    # CSS variable theming
│   │   ├── types.d.ts          # IPC типы (Note, Preset, User, etc.)
│   │   ├── main/ipc/           # IPC handlers по фичам
│   │   │   ├── index.ts        # Регистрация всех IPC
│   │   │   ├── auth.ts         # Авторизация, multi-account
│   │   │   ├── notes.ts        # Заметки CRUD
│   │   │   ├── presets.ts      # Пресеты + запуск приложений
│   │   │   ├── server.ts       # Сервер URL, health, API proxy, WS
│   │   │   ├── settings.ts     # Настройки (proxy к /api/data)
│   │   │   └── telegram.ts     # Telegram привязка (QR + code)
│   │   ├── components/         # UI страницы, модалки, sidebar, titlebar
│   │   └── styles/             # CSS модули (11 файлов)
│   ├── e2e/                    # Playwright E2E тесты
│   └── forge.config.ts         # Electron Forge + Vite
│
├── HelperDesktop.server/       # Express + SQLite бэкенд
│   ├── src/
│   │   ├── index.ts            # Entry, middleware, routes, bot spawn
│   │   ├── server.ts           # Server instance holder
│   │   ├── db.ts               # SQLite schema, password hashing, migrations
│   │   ├── auth.ts             # JWT, sessions, refresh tokens
│   │   ├── middleware.ts       # Auth (Bearer + x-auth headers)
│   │   ├── validate.ts         # Zod 4 схемы + middleware
│   │   ├── wss.ts              # WebSocket health broadcast
│   │   ├── migrate.ts          # Embedded SQL migrations
│   │   ├── logger.ts           # Structured logging с requestId
│   │   ├── routes/             # API routes
│   │   │   ├── auth.ts         # /register, /login, /token, /refresh, /logout, /op, /email, /password
│   │   │   ├── data.ts         # /api/data/:userId CRUD + batch
│   │   │   ├── notes.ts        # /api/notes CRUD + toggle
│   │   │   ├── telegram.ts     # /status, /link, /unlink, /qr/*, /code/*
│   │   │   └── commands.ts     # /restart, /serverinfo, /command (dev only)
│   │   └── __tests__/          # Vitest + Supertest (148 тестов)
│   └── vitest.config.ts
│
├── HelperDesktop.telegram/     # Telegram Bot (grammy)
│   ├── src/
│   │   ├── index.ts            # Commands, handlers
│   │   ├── config.ts           # bot-config.json loading
│   │   └── db.ts               # Shared SQLite (bot-links.json)
│   └── bot-config.json
│
├── shared/
│   └── src/
│       ├── types.ts            # Shared TS типы
│       └── telegram-links.ts   # Shared linking functions
│
├── docs/
│   ├── README.md               # Этот файл
│   ├── PROJECT_ARCHITECTURE.md # Архитектура (русский)
│   └── PROJECT_DOCUMENTATION.md # Документация (русский)
│
└── .github/workflows/ci.yml    # GitHub Actions CI
```

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
| POST | `/op` | No | Grant dev status (admin) |

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

Формат `userData/auth.json`:
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

# Typecheck сервера
cd HelperDesktop.server && npx tsc --noEmit

# Сборка клиента
cd HelperDesktop.io && npm run make
```

---

## Тестирование

| Тип | Фреймворк | Конфигурация |
|-----|-----------|--------------|
| Unit/Integration (server) | Vitest + Supertest | `pool: 'forks'`, `fileParallelism: false` |
| E2E (client API) | Playwright | API smoke tests против живого сервера |

Наборы тестов (server):
- `validate.test.ts` — Zod схемы
- `middleware.test.ts` — Auth middleware
- `db.test.ts` — Hash/verify, migrations
- `routes.test.ts` — Auth flow
- `data.test.ts` — Data CRUD
- `notes.test.ts` — Notes CRUD
- `telegram.test.ts` — Telegram linking
- `commands.test.ts` — Dev commands
- `server.test.ts` — Health + auth flow
- `security-flow.test.ts` — Security integration
- `csp.test.ts` — CSP headers
- `path-validation.test.ts` — Path traversal protection

---

## Статус дорожной карты

### Фаза 1: Стабилизация (текущая) ✅ ЗАВЕРШЕНА
- [x] Разбить main.ts на IPC модули
- [x] Разбить index.css по фичам (11 файлов)
- [x] Исправить линт ошибки
- [x] DateTimePicker с умным позиционированием
- [x] **Добавить CSP заголовки** ← НОВОЕ
- [x] **CI (lint + typecheck + build)** ← НОВОЕ

### Фаза 2: Инфраструктура (2-3 месяца) 🔄 ЧАСТИЧНО
- [x] **Drizzle ORM вместо raw SQL** — схема создана, миграции сгенерированы, но полная миграция маршрутов отложена
- [x] **Интеграционные тесты (Vitest)** — имеются
- [x] **E2E тесты (Playwright)** — API smoke tests
- [x] **GitHub Actions CI/CD** — исправлен и верифицирован

### Фаза 3: Ядро платформы (3-6 месяцев) ⏳ ПЛАНИРУЕТСЯ
- [ ] AI Assistant (LM Studio, OpenAI-compatible API)
- [ ] Расширенный Telegram (управление заметками/задачами)
- [ ] Задачи (tasks) с статусами
- [ ] Календарь

### Фаза 4: Медицинский модуль (6-9 месяцев) ⏳ ПЛАНИРУЕТСЯ
- [ ] Талоны к врачу (CRUD + напоминания)
- [ ] Медицинские документы (загрузка файлов)
- [ ] Шифрование медицинских данных (AES-256-GCM)

### Фаза 5: Поиск и синхронизация (9-12 месяцев) ⏳ ПЛАНИРУЕТСЯ
- [ ] Полнотекстовый поиск (SQLite FTS5)
- [ ] Облачная синхронизация
- [ ] Автоматические бэкапы

---

## Технический долг

### P0 (немедленно) ✅ ВСЕ ИСПРАВЛЕНО
| Задача | Статус |
|--------|--------|
| CSP заголовки | ✅ Готово |
| Path traversal protection | ✅ Готово |

### P1 (1-2 месяца) 🔄 ВЫПОЛНЕНО
| Задача | Статус |
|--------|--------|
| Drizzle ORM | 🔄 Схема и миграции готовы, полная миграция маршрутов отложена |
| Интеграционные тесты | ✅ Vitest + Supertest |
| CI/CD | ✅ GitHub Actions |

### P2 (3-6 месяцев) ⏳ ОЖИДАЕТ
| Задача | Статус |
|--------|--------|
| Feature-based архитектура | ⏳ Планируется |
| AI Assistant (LM Studio) | ⏳ Планируется |

---

## Результаты миграции на Drizzle ORM

| Метрика | До | После |
|---------|-----|-------|
| Файлов с raw SQL | 12 | 0 (частично) |
| Типобезопасность запросов | Нет | Полная (для схемы) |
| Миграции | Встроенные в код | Drizzle Kit |
| Автодополнение в IDE | Ограниченное | Полное |

---

## Результаты тестирования

| Тип тестов | Статус | Покрытие |
|------------|--------|----------|
| Unit (Vitest) | ✅ Проходят | validate, db, auth |
| Integration (Vitest + Supertest) | ✅ Проходят | routes, middleware, security |
| E2E (Playwright) | ✅ Проходят | auth, data, notes, telegram, security |
| Lint (ESLint + TSC) | ✅ Проходят | server + client |
| Build | ✅ Успешно | server + client |

---

*Обновлено: 12 июля 2026*