# Design: Упоминание заметки в Telegram

## Overview

Добавить возможность упоминать заметки в Telegram при создании. Пользователь ставит галочку "Упомянуть в Telegram" в форме создания заметки — бот отправляет уведомление с заголовком, текстом, тегами и deep link на заметку.

## Architecture

### Механика отправки

Используем существующий polling-механизм бота (аналогично напоминаниям):

1. Два новых поля в таблице `notes`:
   - `notify_telegram` (INTEGER, default 0) — флаг "отправить в Telegram"
   - `telegram_notified` (INTEGER, default 0) — флаг "уже отправлено"

2. При создании заметки с `notify_telegram=true`:
   - Сервер сохраняет `notify_telegram=1, telegram_notified=0`

3. Бот каждые 30 сек (существующий `setInterval`) проверяет:
   ```sql
   SELECT n.*, u.login FROM notes n
   JOIN users u ON n.user_id = u.id
   WHERE n.notify_telegram = 1 AND n.telegram_notified = 0
   ```

4. Для каждой найденной заметки:
   - Находит привязанный Telegram ID через `getLinkedTelegramId(login)`
   - Отправляет сообщение с заголовком, текстом, тегами и deep link
   - Ставит `telegram_notified=1`

### Deep link

- Протокол: `helperdesktop://note/{id}`
- Регистрируется в Electron через `app.setAsDefaultProtocolClient('helperdesktop')`
- Обрабатывается через `app.on('open-url')` (macOS) и `process.argv` (Windows/Linux)
- При открытии по ссылке — переходим на страницу заметок и подсвечиваем заметку

### Формат Telegram-сообщения

```
📝 <b>Название заметки</b>

Текст заметки...

🏷 Тег1, Тег2

🔗 Открыть: helperdesktop://note/123
```

## Files to Change

### shared/types.ts
- Добавить `notify_telegram: boolean` и `telegram_notified: boolean` в интерфейс `Note`

### HelperDesktop.server/src/migrate.ts
- Новая миграция `006_note_notify_telegram`:
  ```sql
  ALTER TABLE notes ADD COLUMN notify_telegram INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE notes ADD COLUMN telegram_notified INTEGER NOT NULL DEFAULT 0;
  ```

### HelperDesktop.server/src/validate.ts
- `noteCreateSchema`: добавить `notify_telegram: z.boolean().optional().default(false)`
- `noteUpdateSchema`: добавить `notify_telegram: z.boolean().optional()`

### HelperDesktop.server/src/routes/notes.ts
- `POST /`: передавать `notify_telegram` при вставке
- `PUT /:id`: обрабатывать `notify_telegram` при обновлении
- `GET /`: возвращать новые поля

### HelperDesktop.telegram/src/index.ts
- В существующий `setInterval` добавить проверку `notify_telegram`:
  - После обработки напоминаний, обработать `notify_telegram` заметки
  - Формат сообщения: заголовок + текст + теги + deep link
  - После отправки: `UPDATE notes SET telegram_notified = 1 WHERE id = ?`

### HelperDesktop.io/src/components/NoteEditModal.tsx
- Добавить чекбокс "Упомянуть в Telegram" после поля напоминания
- Состояние: `const [notifyTelegram, setNotifyTelegram] = useState(note?.notify_telegram ?? false)`
- Передавать в `onSave`

### HelperDesktop.io/src/components/NotesPage.tsx
- Добавить иконку Telegram на карточках с `notify_telegram=true`
- Импортировать иконку `PaperPlaneRight` из `@phosphor-icons/react`

### HelperDesktop.io/src/main.ts
- Зарегистрировать протокол: `app.setAsDefaultProtocolClient('helperdesktop')`
- Обработать deep link: `app.on('open-url')` и `app.on('second-instance')`
- IPC: отправить deep link в renderer для навигации

### HelperDesktop.io/src/preload.ts
- Добавить IPC слушатель для deep link навигации

### HelperDesktop.io/src/styles/notes.css
- Стили для чекбокса "Упомянуть в Telegram"
- Стили для иконки Telegram на карточке

## Error Handling

- Если Telegram не привязан — пропустить отправку (как с напоминаниями)
- Если бот не может отправить сообщение — логировать ошибку, не сбрасывать `telegram_notified`
- Deep link: если приложение не открыто — игнорировать (Telegram просто откроет браузер)

## Testing

- Unit: проверить миграцию, схемы валидации
- Integration: проверить что `POST /api/notes` с `notify_telegram=true` сохраняет правильные поля
- E2E: проверить что бот отправляет уведомление и ставит `telegram_notified=1`
