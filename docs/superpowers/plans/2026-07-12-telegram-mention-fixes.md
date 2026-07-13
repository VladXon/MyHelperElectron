# Fixes: Telegram Mention Feature Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish the "Упомянуть в Telegram" feature: native-looking toggle switch, fixed DateTimePicker with 1-min steps and Apply button, reliable deep link delivery via new Telegram Bot API.

**Architecture:** Three independent UI/bot fixes — no cross-dependencies. Can be executed in parallel.

**Tech Stack:** React (TSX), CSS, grammY (Telegram Bot API)

---

## Global Constraints

- Follow existing code style in `HelperDesktop.io/src/components/` and `HelperDesktop.io/src/styles/notes.css`
- Use CSS custom properties from `--bg-*`, `--text-*`, `--accent`, `--border`, `--radius-*`, `--transition`, `--shadow-*`
- TypeScript strict mode — no `any` unless unavoidable
- No new dependencies
- Commits: one per task, conventional commit format

---

### Task 1: Toggle Switch "Упомянуть в Telegram" в стилистике приложения

**Files:**
- Modify: `HelperDesktop.io/src/components/NoteEditModal.tsx` (lines 69-78)
- Modify: `HelperDesktop.io/src/styles/notes.css` (append)

**Interfaces:**
- Consumes: `notifyTelegram` state (boolean), `setNotifyTelegram` setter
- Produces: Same boolean via `onSave` callback

**Requirements:**
- Visual: track (44×26px), thumb (20×20px), accent fill when checked, smooth 150ms transition
- States: default, hover, focus-visible (3px ring), checked, disabled
- Disabled: when user has no linked Telegram (check via `electronTelegram.status()` or prop)
- Accessibility: native `<input type="checkbox">` hidden, `label` wraps track+thumb+text, `focus-visible` on track

**Steps:**

- [ ] **Step 1: Update NoteEditModal.tsx**
  - Replace current checkbox markup (lines 69-78) with toggle switch structure
  - Add `disabled` prop binding — pass from parent via new prop `telegramLinked?: boolean`
  - Keep `notifyTelegram` state and `onChange` handler

- [ ] **Step 2: Add CSS to notes.css**
  - `.toggle-switch` — inline-flex, gap 10px, cursor pointer
  - `.toggle-switch-input` — visually-hidden (position absolute, opacity 0)
  - `.toggle-switch-track` — 44×26px, rounded 13px, border, bg `--bg-tertiary`, transition all
  - `.toggle-switch-track::before` (thumb) — 20×20px, white, rounded 50%, shadow, transition transform
  - `.toggle-switch-input:checked + .toggle-switch-track` — bg `--accent`, border `--accent`
  - `.toggle-switch-input:checked + .toggle-switch-track::before` — transform translateX(18px)
  - `.toggle-switch-input:focus-visible + .toggle-switch-track` — ring `0 0 0 3px var(--accent-subtle)`
  - `.toggle-switch-input:disabled + .toggle-switch-track` — opacity 0.5, cursor not-allowed
  - `.toggle-switch-label` — 13px, `--text-secondary`

- [ ] **Step 3: Wire disabled state**
  - In `NotesPage.tsx` handleSave → check telegram status before opening modal
  - Pass `telegramLinked` prop to `NoteEditModal`

- [ ] **Step 4: Commit**
  ```bash
  git add HelperDesktop.io/src/components/NoteEditModal.tsx HelperDesktop.io/src/styles/notes.css HelperDesktop.io/src/components/NotesPage.tsx
  git commit -m "feat(ui): add native toggle switch for telegram mention with disabled state"
  ```

---

### Task 2: DateTimePicker — шаг 1 мин + кнопка "Применить"

**Files:**
- Modify: `HelperDesktop.io/src/components/DateTimePicker.tsx`
- Modify: `HelperDesktop.io/src/styles/notes.css` (append)

**Interfaces:**
- Consumes: `value` (ISO string `YYYY-MM-DDTHH:mm`), `onChange(value: string)`
- Produces: `onChange` with updated ISO string

**Requirements:**
- Minute step: 1 (was 5)
- Time changes do NOT auto-apply — only via "Применить" button
- "Применить" confirms selection AND closes dropdown
- Date click still auto-applies (convenience)
- If no date selected yet, "Применить" uses today's date
- Keyboard: Enter on "Применить" works, Escape closes

**Steps:**

- [ ] **Step 1: Change minute step to 1**
  - Lines 180, 182: `setMin(minutes + 1)` / `setMin(minutes - 1)`

- [ ] **Step 2: Fix selectedDate initialization**
  - In `toggleOpen` (line 48-57): when opening, always set `selectedDate` from `value` or `new Date()`
  - This ensures time spinners have a valid date context even if user hasn't clicked a day

- [ ] **Step 3: Remove auto-apply from time spinners**
  - Keep `setHour`/`setMin` updating internal state only
  - Remove `applyValue` calls from `setHour` (line 82) and `setMin` (line 88)
  - `applyValue` only called from `selectDay` (date click) and new "Применить" handler

- [ ] **Step 4: Add "Применить" button in time section**
  - After line 185 (dtpicker-today), add:
    ```tsx
    <div className="dtpicker-time-actions">
      <button
        className="dtpicker-apply"
        onClick={() => {
          const d = selectedDate || { year: viewYear, month: viewMonth, day: new Date().getDate() };
          applyValue(d.year, d.month, d.day, hours, minutes);
          setOpen(false);
        }}
        type="button"
      >
        Применить
      </button>
    </div>
    ```

- [ ] **Step 5: Add CSS for button**
  - `.dtpicker-time-actions` — padding, border-top
  - `.dtpicker-apply` — full width, accent bg, white text, rounded, font-weight 600, hover `--accent-hover`

- [ ] **Step 6: Commit**
  ```bash
  git add HelperDesktop.io/src/components/DateTimePicker.tsx HelperDesktop.io/src/styles/notes.css
  git commit -m "feat(ui): datetimepicker 1-min step + apply button, fix timestamp init"
  ```

---

### Task 3: Deep link — новый API link_preview_options

**Files:**
- Modify: `HelperDesktop.telegram/src/index.ts` (lines 279-297 area)

**Interfaces:**
- Consumes: `note` object (id, title, body, tags, login)
- Produces: Telegram message sent via `bot.api.sendMessage`

**Requirements:**
- Use ONLY `link_preview_options: { is_disabled: true, url: deepLink }` (grammY 2.x API)
- Include clickable HTML link `<a href="...">Открыть заметку</a>`
- Include plain-text fallback `<code>helperdesktop://note/123</code>` for copy-paste
- No `disable_web_page_preview` (legacy)

**Steps:**

- [ ] **Step 1: Update message builder**
  - Construct `deepLink = 'helperdesktop://note/${note.id}'`
  - Build message with HTML link + plain code fallback
  - Keep existing tag/body formatting

- [ ] **Step 2: Update sendMessage call**
  ```typescript
  await bot.api.sendMessage(telegramId, message, {
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true, url: deepLink }
  });
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add HelperDesktop.telegram/src/index.ts
  git commit -m "feat(bot): use link_preview_options API for reliable deep link delivery"
  ```

---

## Execution Order

All three tasks are independent — can run in parallel or any order.

**Recommended:** Task 1 → Task 2 → Task 3 (UI first, then bot)

---

## Verification Checklist

| Task | Test |
|------|------|
| Toggle Switch | Open note modal → toggle animates smoothly → focus ring on Tab → disabled when TG not linked → value saves |
| DateTimePicker | Open picker → spin minutes → step is 1 → change time without picking day → click "Применить" → value saved correctly (date + new time) → picker closes |
| Deep link | Create note with toggle ON → bot receives → message has clickable "Открыть заметку" + copyable code → click opens app → note highlighted |

---

## Notes for Implementer

- Task 1 requires adding `telegramLinked` prop to `NoteEditModal` and passing from `NotesPage`. Check `electronTelegram.status()` or `window.electronTelegram.status()` in `NotesPage.handleCreate`/`handleEdit`.
- Task 2: Ensure `selectedDate` is never null when time spinners used. Default to today in `toggleOpen`.
- Task 3: `link_preview_options` requires grammY ≥2.0 (already in package.json). Test with real Telegram client — some desktop clients ignore `url` in preview options but still disable preview.