# Документация проекта MyHelperElectron

## Обновленная схема (после миграции)

```
Renderer (React) → preload (IPC) → Main (Electron) → HTTP fetch → Express Server → SQLite (Drizzle ORM)
                                                                          ↕ spawn
                                                                Telegram Bot (grammy)
```

### Безопасность
- CSP: Строгие директивы в production, отключен в development
- Path Traversal: Валидация во всех IPC файловых операциях
- Rate Limiting: 20 req/15min на `/api/auth/*`
- SQL Injection: Параметризованные запросы через Drizzle ORM
- Пароли: scrypt (N=16384, r=8, p=1, salt=32B, key=64B)
- JWT: HS256, 24h access, 7d refresh
- Шифрование credentials: Electron safeStorage

---

## Статус дорожной карты

### Фаза 1: Стабилизация ✅ ЗАВЕРШЕНА
- [x] Разбить main.ts на IPC модули
- [x] Разбить index.css по фичам (11 файлов)
- [x] Исправить линт ошибки
- [x] DateTimePicker с умным позиционированием
- [x] **Добавить CSP заголовки** ← НОВОЕ
- [x] **CI (lint + typecheck + build)** ← НОВОЕ

### Фаза 2: Инфраструктура ✅ ЗАВЕРШЕНА
- [x] **Drizzle ORM вместо raw SQL** ← НОВОЕ
- [x] **Интеграционные тесты (Vitest)** ← ИМЕЮТСЯ
- [x] **E2E тесты (Playwright)** ← НОВОЕ
- [x] **GitHub Actions CI/CD** ← ИМЕЕТСЯ, ИСПРАВЛЕНО

### Фаза 3: Ядро платформы (3-6 месяцев) ⏳ ОЖИДАЕТ
- [ ] AI Assistant (LM Studio, OpenAI-compatible API)
- [ ] Расширенный Telegram (управление заметками/задачами)
- [ ] Задачи (tasks) с статусами
- [ ] Календарь

### Фаза 4: Медицинский модуль (6-9 месяцев) ⏳ ОЖИДАЕТ
- [ ] Талоны к врачу (CRUD + напоминания)
- [ ] Медицинские документы (загрузка файлов)
- [ ] Шифрование медицинских данных (AES-256-GCM)

### Фаза 5: Поиск и синхронизация (9-12 месяцев) ⏳ ОЖИДАЕТ
- [ ] Полнотекстовый поиск (SQLite FTS5)
- [ ] Облачная синхронизация
- [ ] Автоматические бэкапы

---

## Технический долг

### P0 (высший приоритет) ✅ ВСЕ ИСПРАВЛЕНО
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

---

## Результаты миграции на Drizzle ORM

| Метрика | До | После |
|---------|-----|-------|
| Файлов с raw SQL | 12 | 0 |
| Типобезопасность запросов | Нет | Полная |
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