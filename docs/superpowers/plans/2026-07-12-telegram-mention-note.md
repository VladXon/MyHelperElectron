# Telegram Mention Note Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Mention in Telegram" checkbox to note creation that sends a Telegram notification with the note details and a deep link back to the note.

**Architecture:** Extend the existing notes table with `notify_telegram` and `telegram_notified` flags. The Telegram bot's existing 30-second polling interval checks for notes with `notify_telegram=1 AND telegram_notified=0`, sends a formatted message, and marks them as notified. The Electron app registers a custom `helperdesktop://` protocol for deep link handling.

**Tech Stack:** SQLite (better-sqlite3), Express, grammY (Telegram bot), Electron, React, Zod

---

## File Structure

| File | Responsibility |
|------|----------------|
| `shared/types.ts` | Note interface with new fields |
| `HelperDesktop.server/src/migrate.ts` | Migration 006: add columns |
| `HelperDesktop.server/src/validate.ts` | Zod schemas for create/update |
| `HelperDesktop.server/src/routes/notes.ts` | API routes handling new fields |
| `HelperDesktop.telegram/src/index.ts` | Bot polling for notify_telegram |
| `HelperDesktop.io/src/components/NoteEditModal.tsx` | Checkbox UI |
| `HelperDesktop.io/src/components/NotesPage.tsx` | Telegram icon on cards |
| `HelperDesktop.io/src/main.ts` | Protocol registration + deep link |
| `HelperDesktop.io/src/main/ipc/index.ts` | IPC for deep link navigation |
| `HelperDesktop.io/src/preload.ts` | Expose deep link listener |
| `HelperDesktop.io/src/App.tsx` | Handle deep link navigation |
| `HelperDesktop.io/src/styles/notes.css` | Styles for checkbox and icon |

---

### Task 1: Database Migration

**Files:**
- Modify: `HelperDesktop.server/src/migrate.ts`

**Interfaces:**
- Produces: `notify_telegram` and `telegram_notified` columns on `notes` table

- [ ] **Step 1: Add migration 006**

In `HelperDesktop.server/src/migrate.ts`, add to the `migrations` array after the last entry:

```typescript
{
  name: '006_note_notify_telegram',
  up: `
    ALTER TABLE notes ADD COLUMN notify_telegram INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE notes ADD COLUMN telegram_notified INTEGER NOT NULL DEFAULT 0;
  `,
},
```

- [ ] **Step 2: Verify migration runs**

Run the server and check logs for `[migrate] Applied: 006_note_notify_telegram`:

```bash
cd HelperDesktop.server && npx tsx src/index.ts
```

Expected: Server starts, migration applied in logs, then Ctrl+C to stop.

- [ ] **Step 3: Commit**

```bash
git add HelperDesktop.server/src/migrate.ts
git commit -m "feat(db): add notify_telegram and telegram_notified columns"
```

---

### Task 2: Shared Types

**Files:**
- Modify: `shared/types.ts`

**Interfaces:**
- Produces: Updated `Note` interface consumed by frontend and server

- [ ] **Step 1: Update Note interface**

In `shared/types.ts`, update the `Note` interface:

```typescript
export interface Note {
  id: number;
  user_id: number;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  completed: boolean;
  reminder_at: number | null;
  notify_telegram: boolean;
  telegram_notified: boolean;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add shared/types.ts
git commit -m "feat(types): add notify_telegram and telegram_notified to Note"
```

---

### Task 3: Validation Schemas

**Files:**
- Modify: `HelperDesktop.server/src/validate.ts`

**Interfaces:**
- Produces: Updated Zod schemas consumed by notes routes

- [ ] **Step 1: Update noteCreateSchema**

In `HelperDesktop.server/src/validate.ts`, update `noteCreateSchema`:

```typescript
export const noteCreateSchema = z.object({
  title: z.string().max(200).default(''),
  body: z.string().max(10000).default(''),
  tags: z.array(z.string().max(50)).max(10).default([]),
  reminder_at: z.number().nullable().optional(),
  notify_telegram: z.boolean().optional().default(false),
});
```

- [ ] **Step 2: Update noteUpdateSchema**

In the same file, update `noteUpdateSchema`:

```typescript
export const noteUpdateSchema = z.object({
  title: z.string().max(200).optional(),
  body: z.string().max(10000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  pinned: z.boolean().optional(),
  completed: z.boolean().optional(),
  reminder_at: z.number().nullable().optional(),
  notify_telegram: z.boolean().optional(),
});
```

- [ ] **Step 3: Commit**

```bash
git add HelperDesktop.server/src/validate.ts
git commit -m "feat(api): add notify_telegram to note validation schemas"
```

---

### Task 4: Notes API Routes

**Files:**
- Modify: `HelperDesktop.server/src/routes/notes.ts`

**Interfaces:**
- Consumes: Updated Zod schemas from Task 3
- Produces: API endpoints that persist and return `notify_telegram` and `telegram_notified`

- [ ] **Step 1: Update POST / route**

In `HelperDesktop.server/src/routes/notes.ts`, update the `POST /` handler to include `notify_telegram`:

```typescript
router.post('/', validate(noteCreateSchema), (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { title, body, tags, reminder_at, notify_telegram } = req.body;
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO notes (user_id, title, body, tags, reminder_at, notify_telegram) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.user!.id, title, body, JSON.stringify(tags), reminder_at ?? null, notify_telegram ? 1 : 0);
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid) as any;
  logger.info('Note created', { requestId, userId: req.user!.id, noteId: note.id });
  res.status(201).json({
    ...note,
    tags: JSON.parse(note.tags),
    notify_telegram: !!note.notify_telegram,
    telegram_notified: !!note.telegram_notified,
  });
});
```

- [ ] **Step 2: Update PUT /:id route**

Update the `PUT /:id` handler to handle `notify_telegram`:

```typescript
router.put('/:id', validate(noteIdParams, 'params'), validate(noteUpdateSchema), (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { id } = req.params;
  const db = getDb();
  const existing = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(id, req.user!.id);
  if (!existing) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }

  const fields: Record<string, any> = { ...req.body };
  if (fields.tags) fields.tags = JSON.stringify(fields.tags);
  if (fields.notify_telegram !== undefined) fields.notify_telegram = fields.notify_telegram ? 1 : 0;
  fields.updated_at = new Date().toISOString();

  const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE notes SET ${sets} WHERE id = ?`).run(...Object.values(fields), id);
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as any;
  logger.info('Note updated', { requestId, userId: req.user!.id, noteId: id });
  res.json({
    ...note,
    tags: JSON.parse(note.tags),
    notify_telegram: !!note.notify_telegram,
    telegram_notified: !!note.telegram_notified,
  });
});
```

- [ ] **Step 3: Update GET / route**

Update the `GET /` handler to return boolean fields:

```typescript
router.get('/', (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const db = getDb();
  const notes = db.prepare(
    'SELECT * FROM notes WHERE user_id = ? ORDER BY pinned DESC, created_at DESC'
  ).all(req.user!.id);
  logger.debug('Fetched notes', { requestId, userId: req.user!.id, count: notes.length });
  res.json(notes.map((n: any) => ({
    ...n,
    tags: JSON.parse(n.tags),
    notify_telegram: !!n.notify_telegram,
    telegram_notified: !!n.telegram_notified,
  })));
});
```

- [ ] **Step 4: Commit**

```bash
git add HelperDesktop.server/src/routes/notes.ts
git commit -m "feat(api): handle notify_telegram in notes CRUD"
```

---

### Task 5: Telegram Bot Polling

**Files:**
- Modify: `HelperDesktop.telegram/src/index.ts`

**Interfaces:**
- Consumes: `notes` table with `notify_telegram` and `telegram_notified` columns
- Consumes: `getLinkedTelegramId()` from `shared/src/telegram-links.ts`

- [ ] **Step 1: Add notify_telegram polling**

In `HelperDesktop.telegram/src/index.ts`, after the existing reminder `setInterval` block (after line 258), add a new `setInterval`:

```typescript
setInterval(async () => {
  try {
    const db = getDb();
    const pending = db.prepare(
      `SELECT n.*, u.login FROM notes n
       JOIN users u ON n.user_id = u.id
       WHERE n.notify_telegram = 1 AND n.telegram_notified = 0`
    ).all() as any[];

    for (const note of pending) {
      const telegramId = getLinkedTelegramId(note.login);
      if (!telegramId) {
        db.prepare(`UPDATE notes SET telegram_notified = 1, updated_at = datetime('now') WHERE id = ?`).run(note.id);
        continue;
      }

      const tags = note.tags ? JSON.parse(note.tags) : [];
      const tagStr = tags.length ? `\n🏷 ${tags.join(', ')}` : '';
      const bodyStr = note.body ? `\n${note.body}` : '';
      const deepLink = `helperdesktop://note/${note.id}`;

      await bot.api.sendMessage(telegramId,
        `📝 <b>${note.title || 'Без заголовка'}</b>` +
        bodyStr +
        tagStr +
        `\n\n🔗 <a href="${deepLink}">Открыть заметку</a>`,
        { parse_mode: 'HTML', disable_web_page_preview: true }
      );

      db.prepare(`UPDATE notes SET telegram_notified = 1, updated_at = datetime('now') WHERE id = ?`).run(note.id);
      logger.bot('Telegram mention sent', { noteId: note.id, login: note.login });
    }
  } catch (err) {
    logger.error('Telegram mention poll error', err as Error);
  }
}, 30_000);
```

- [ ] **Step 2: Commit**

```bash
git add HelperDesktop.telegram/src/index.ts
git commit -m "feat(bot): add notify_telegram polling and messaging"
```

---

### Task 6: Frontend - NoteEditModal Checkbox

**Files:**
- Modify: `HelperDesktop.io/src/components/NoteEditModal.tsx`

**Interfaces:**
- Consumes: `Note` interface with `notify_telegram` field
- Produces: `notify_telegram` in `onSave` callback data

- [ ] **Step 1: Add notify_telegram state and checkbox**

In `HelperDesktop.io/src/components/NoteEditModal.tsx`:

1. Update the props interface:
```typescript
interface NoteEditModalProps {
  note: { id: number; title: string; body: string; tags: string[]; reminder_at: number | null; notify_telegram?: boolean } | null;
  onSave: (data: { title: string; body: string; tags: string[]; reminder_at: number | null; notify_telegram: boolean }) => void;
  onClose: () => void;
}
```

2. Add state after the `reminder` state (around line 23):
```typescript
const [notifyTelegram, setNotifyTelegram] = useState(note?.notify_telegram ?? false);
```

3. Update `handleSave` to include `notify_telegram`:
```typescript
const handleSave = () => {
  const reminder_at = reminder ? new Date(reminder).getTime() : null;
  onSave({ title, body, tags, reminder_at, notify_telegram });
};
```

4. Add checkbox UI after the `note-edit-reminder` div (before the closing `</div>` of `note-edit-fields`):
```typescript
<div className="note-edit-notify">
  <label className="note-notify-checkbox">
    <input
      type="checkbox"
      checked={notifyTelegram}
      onChange={e => setNotifyTelegram(e.target.checked)}
    />
    <span>Упомянуть в Telegram</span>
  </label>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add HelperDesktop.io/src/components/NoteEditModal.tsx
git commit -m "feat(ui): add notify_telegram checkbox to note editor"
```

---

### Task 7: Frontend - NotesPage Telegram Icon

**Files:**
- Modify: `HelperDesktop.io/src/components/NotesPage.tsx`

**Interfaces:**
- Consumes: `Note` interface with `notify_telegram` field

- [ ] **Step 1: Import PaperPlaneRight icon**

In `HelperDesktop.io/src/components/NotesPage.tsx`, update the import from `@phosphor-icons/react`:

```typescript
import { Plus, PushPin, PushPinSlash, Check, Circle, Clock, Tag, Trash, PencilSimple, X, Notebook, PaperPlaneRight } from '@phosphor-icons/react';
```

- [ ] **Step 2: Update Note interface**

Add `notify_telegram` and `telegram_notified` to the local `Note` interface:

```typescript
interface Note {
  id: number;
  user_id: number;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  completed: boolean;
  reminder_at: number | null;
  notify_telegram: boolean;
  telegram_notified: boolean;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 3: Update handleSave to pass notify_telegram**

Update the `handleSave` function:

```typescript
const handleSave = async (noteData: { title: string; body: string; tags: string[]; reminder_at: number | null; notify_telegram: boolean }) => {
  if (editNote) {
    await window.electronNotes.update(editNote.id, noteData);
  } else {
    await window.electronNotes.create({ ...noteData, reminder_at: noteData.reminder_at ?? undefined });
  }
  setShowModal(false);
  loadNotes();
};
```

- [ ] **Step 4: Add Telegram icon to note card**

In the `renderCard` function, after the `note-reminder` span (around line 103), add:

```typescript
{note.notify_telegram && (
  <span className={`note-telegram ${note.telegram_notified ? 'sent' : ''}`}>
    <PaperPlaneRight size={12} />
  </span>
)}
```

- [ ] **Step 5: Commit**

```bash
git add HelperDesktop.io/src/components/NotesPage.tsx
git commit -m "feat(ui): show telegram icon on notes with notify_telegram"
```

---

### Task 8: Frontend - Preload IPC

**Files:**
- Modify: `HelperDesktop.io/src/preload.ts`

**Interfaces:**
- Produces: `electronDeepLink.onNote` listener exposed to renderer

- [ ] **Step 1: Add deep link IPC**

In `HelperDesktop.io/src/preload.ts`, add after the `electronNotes` block:

```typescript
contextBridge.exposeInMainWorld('electronDeepLink', {
  onNote: (callback: (noteId: number) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, noteId: unknown) => {
      callback(noteId as number);
    };
    ipcRenderer.on('deep-link:note', handler);
    return () => {
      ipcRenderer.removeListener('deep-link:note', handler);
    };
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add HelperDesktop.io/src/preload.ts
git commit -m "feat(ipc): expose deep link listener to renderer"
```

---

### Task 9: Electron - Protocol Registration

**Files:**
- Modify: `HelperDesktop.io/src/main.ts`
- Modify: `HelperDesktop.io/src/main/ipc/index.ts`

**Interfaces:**
- Consumes: `getMainWindow()` from main process
- Produces: Deep link handling that sends IPC to renderer

- [ ] **Step 1: Register custom protocol in main.ts**

In `HelperDesktop.io/src/main.ts`, add after `app.on('ready')` registration but before `createWindow()` call (around line 202):

```typescript
app.on('ready', () => {
  Menu.setApplicationMenu(null);

  // Register custom protocol
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('helperdesktop', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('helperdesktop');
  }

  createWindow();
});
```

- [ ] **Step 2: Handle deep link events in main.ts**

Add deep link handlers after the `app.on('ready')` block:

```typescript
function handleDeepLink(url: string) {
  const match = url.match(/helperdesktop:\/\/note\/(\d+)/);
  if (match) {
    const noteId = parseInt(match[1], 10);
    const win = getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      win.webContents.send('deep-link:note', noteId);
    }
  }
}

app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

app.on('second-instance', (_event, commandLine) => {
  const url = commandLine.find(arg => arg.startsWith('helperdesktop://'));
  if (url) handleDeepLink(url);
});
```

- [ ] **Step 3: Commit**

```bash
git add HelperDesktop.io/src/main.ts
git commit -m "feat(electron): register helperdesktop:// protocol and handle deep links"
```

---

### Task 10: Frontend - Deep Link Navigation

**Files:**
- Modify: `HelperDesktop.io/src/App.tsx`

**Interfaces:**
- Consumes: `electronDeepLink.onNote` from preload

- [ ] **Step 1: Add deep link handler in App.tsx**

In `HelperDesktop.io/src/App.tsx`, add a `useEffect` to listen for deep link navigation. Read the file first to understand the current structure, then add:

```typescript
useEffect(() => {
  const unsubscribe = (window as any).electronDeepLink?.onNote((noteId: number) => {
    // Navigate to notes page and scroll to note
    navigate('/notes');
    // Dispatch custom event for NotesPage to handle
    window.dispatchEvent(new CustomEvent('deep-link-note', { detail: noteId }));
  });
  return () => unsubscribe?.();
}, []);
```

Note: Check if `navigate` is available from router. If using React Router, import `useNavigate`. If using custom routing, adapt accordingly.

- [ ] **Step 2: Handle deep link in NotesPage**

In `HelperDesktop.io/src/components/NotesPage.tsx`, add a `useEffect` to handle the deep link event:

```typescript
useEffect(() => {
  const handler = (e: CustomEvent) => {
    const noteId = e.detail;
    const note = notes.find(n => n.id === noteId);
    if (note) {
      handleEdit(note);
    }
  };
  window.addEventListener('deep-link-note', handler as EventListener);
  return () => window.removeEventListener('deep-link-note', handler as EventListener);
}, [notes]);
```

- [ ] **Step 3: Commit**

```bash
git add HelperDesktop.io/src/App.tsx HelperDesktop.io/src/components/NotesPage.tsx
git commit -m "feat(ui): handle deep link navigation to note"
```

---

### Task 11: CSS Styles

**Files:**
- Modify: `HelperDesktop.io/src/styles/notes.css`

**Interfaces:**
- Produces: Styles for checkbox and Telegram icon

- [ ] **Step 1: Add styles for notify checkbox and Telegram icon**

In `HelperDesktop.io/src/styles/notes.css`, add at the end:

```css
.note-edit-notify {
  display: flex;
  align-items: center;
}

.note-notify-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  user-select: none;
}

.note-notify-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}

.note-telegram {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #0088cc;
  background: rgba(0, 136, 204, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.note-telegram.sent {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}
```

- [ ] **Step 2: Commit**

```bash
git add HelperDesktop.io/src/styles/notes.css
git commit -m "feat(ui): add styles for notify_telegram checkbox and icon"
```

---

### Task 12: Typecheck and Verify

**Files:**
- All modified files

**Interfaces:**
- Consumes: All previous tasks

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: No TypeScript errors.

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: All existing tests pass.

- [ ] **Step 3: Manual verification**

1. Start the server: `cd HelperDesktop.server && npx tsx src/index.ts`
2. Start the frontend: `cd HelperDesktop.io && npm run dev`
3. Create a note with "Упомянуть в Telegram" checked
4. Check bot logs for "Telegram mention sent"
5. Check Telegram for the notification message with deep link
6. Click the deep link — app should open and show the note

- [ ] **Step 4: Final commit if needed**

```bash
git add -A
git commit -m "feat: complete telegram mention note feature"
```
