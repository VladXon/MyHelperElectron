# React Query Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate NotesPage, PresetsPage, and App.tsx to use React Query hooks for state management.

**Architecture:** Incremental migration — NotesPage first, then PresetsPage, then App.tsx cleanup. Each step is independently testable.

**Tech Stack:** React, React Query (@tanstack/react-query), TypeScript, Electron IPC

## Global Constraints

- TypeScript must compile without errors after each task
- No regressions in existing functionality
- Follow existing code patterns and conventions
- Each task produces a working, testable state

---

## Task 1: Migrate NotesPage to React Query

**Files:**
- Modify: `HelperDesktop.io/src/components/NotesPage.tsx`

**Interfaces:**
- Consumes: `useNotes`, `useCreateNote`, `useUpdateNote`, `useDeleteNote`, `useToggleNote` from `hooks/useNotes.ts`
- Produces: NotesPage component with React Query state management

- [ ] **Step 1: Read current NotesPage implementation**

Read `HelperDesktop.io/src/components/NotesPage.tsx` to understand current structure.

- [ ] **Step 2: Update imports**

Replace:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import NoteEditModal from './NoteEditModal';
```

With:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, useToggleNote } from '../hooks/useNotes';
import { useTelegramStatus } from '../hooks/useTelegramStatus';
import NoteEditModal from './NoteEditModal';
```

- [ ] **Step 3: Replace state management with React Query hooks**

Inside the component, replace:
```typescript
const [notes, setNotes] = useState<Note[]>([]);
const [search, setSearch] = useState('');
const [showModal, setShowModal] = useState(false);
const [editNote, setEditNote] = useState<Note | null>(null);
const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
const [telegramLinked, setTelegramLinked] = useState(false);

const loadNotes = useCallback(async () => {
  if (!user) return;
  const data = await window.electronNotes.getAll();
  setNotes(data);
}, [user]);

useEffect(() => { loadNotes(); }, [loadNotes]);
```

With:
```typescript
const { data: notes = [] } = useNotes(user?.id ?? null);
const createNote = useCreateNote();
const updateNote = useUpdateNote();
const deleteNote = useDeleteNote();
const toggleNote = useToggleNote();
const { data: telegramStatus } = useTelegramStatus();

const [search, setSearch] = useState('');
const [showModal, setShowModal] = useState(false);
const [editNote, setEditNote] = useState<Note | null>(null);
const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
```

- [ ] **Step 4: Update handleCreate and handleEdit**

Replace:
```typescript
const handleCreate = async () => {
  const status = await window.electronTelegram.status();
  setEditNote(null);
  setShowModal(true);
  setTelegramLinked(status.linked);
};

const handleEdit = async (note: Note) => {
  const status = await window.electronTelegram.status();
  setEditNote(note);
  setShowModal(true);
  setTelegramLinked(status.linked);
};
```

With:
```typescript
const handleCreate = () => {
  setEditNote(null);
  setShowModal(true);
};

const handleEdit = (note: Note) => {
  setEditNote(note);
  setShowModal(true);
};
```

- [ ] **Step 5: Update handleSave**

Replace:
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

With:
```typescript
const handleSave = async (noteData: { title: string; body: string; tags: string[]; reminder_at: number | null; notify_telegram: boolean }) => {
  if (editNote) {
    await updateNote.mutateAsync({ id: editNote.id, data: noteData });
  } else {
    await createNote.mutateAsync(noteData);
  }
  setShowModal(false);
};
```

- [ ] **Step 6: Update handleToggle**

Replace:
```typescript
const handleToggle = async (id: number, field: 'pinned' | 'completed') => {
  await window.electronNotes.toggle(id, field);
  loadNotes();
};
```

With:
```typescript
const handleToggle = (id: number, field: 'pinned' | 'completed') => {
  toggleNote.mutate({ id, field });
};
```

- [ ] **Step 7: Update handleDelete**

Replace:
```typescript
const handleDelete = async (id: number) => {
  if (deleteConfirm === id) {
    await window.electronNotes.remove(id);
    setDeleteConfirm(null);
    loadNotes();
  } else {
    setDeleteConfirm(id);
  }
};
```

With:
```typescript
const handleDelete = async (id: number) => {
  if (deleteConfirm === id) {
    await deleteNote.mutateAsync(id);
    setDeleteConfirm(null);
  } else {
    setDeleteConfirm(id);
  }
};
```

- [ ] **Step 8: Update NoteEditModal usage**

Replace:
```typescript
<AnimatePresence>
  {showModal && <NoteEditModal note={editNote} onSave={handleSave} onClose={() => setShowModal(false)} telegramLinked={telegramLinked} />}
</AnimatePresence>
```

With:
```typescript
<AnimatePresence>
  {showModal && <NoteEditModal note={editNote} onSave={handleSave} onClose={() => setShowModal(false)} telegramLinked={telegramStatus?.linked ?? false} />}
</AnimatePresence>
```

- [ ] **Step 9: Remove unused imports**

Remove `useCallback` from React imports if no longer used.

- [ ] **Step 10: Verify TypeScript compiles**

Run: `cd HelperDesktop.io && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 11: Commit**

```bash
git add HelperDesktop.io/src/components/NotesPage.tsx
git commit -m "refactor: migrate NotesPage to React Query hooks"
```

---

## Task 2: Migrate PresetsPage to React Query

**Files:**
- Modify: `HelperDesktop.io/src/components/PresetsPage.tsx`

**Interfaces:**
- Consumes: `usePresets`, `useSavePreset`, `useDeletePreset`, `useTogglePresetPin` from `hooks/usePresets.ts`
- Produces: PresetsPage component with React Query state management

- [ ] **Step 1: Read current PresetsPage implementation**

Read `HelperDesktop.io/src/components/PresetsPage.tsx` to understand current structure.

- [ ] **Step 2: Update imports**

Replace:
```typescript
import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Preset } from '../types.d';
```

With:
```typescript
import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePresets, useSavePreset, useDeletePreset, useTogglePresetPin } from '../hooks/usePresets';
import type { Preset } from '../types.d';
```

- [ ] **Step 3: Replace props with React Query hooks**

Replace:
```typescript
interface PresetsPageProps {
  presets: Preset[];
  onLaunch: (id: string) => void;
  onEdit: (id: string) => void;
  onAdd: () => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PresetsPage({ presets, onLaunch, onEdit, onAdd, onTogglePin, onDelete }: PresetsPageProps) {
```

With:
```typescript
export default function PresetsPage() {
  const { data: presets = [], isLoading } = usePresets();
  const savePreset = useSavePreset();
  const deletePreset = useDeletePreset();
  const togglePresetPin = useTogglePresetPin();
```

- [ ] **Step 4: Add state for modal and launch**

Add after hooks:
```typescript
const [editPreset, setEditPreset] = useState<Preset | null>(null);
const [showNewPreset, setShowNewPreset] = useState(false);
```

- [ ] **Step 5: Update handleDelete**

Replace:
```typescript
const handleDelete = useCallback((id: string) => {
  if (confirmDelete === id) {
    onDelete(id);
    setConfirmDelete(null);
  } else {
    setConfirmDelete(id);
  }
}, [confirmDelete, onDelete]);
```

With:
```typescript
const handleDelete = useCallback((id: string) => {
  if (confirmDelete === id) {
    deletePreset.mutate(id);
    setConfirmDelete(null);
  } else {
    setConfirmDelete(id);
  }
}, [confirmDelete, deletePreset]);
```

- [ ] **Step 6: Update onTogglePin usage in renderCard**

Replace:
```typescript
<motion.button
  className={`preset-card-btn preset-card-pin${preset.pinned ? ' pinned' : ''}`}
  onClick={() => onTogglePin(preset.id)}
  title={preset.pinned ? 'Открепить' : 'Закрепить'}
  whileTap={{ scale: 0.95 }}
>
```

With:
```typescript
<motion.button
  className={`preset-card-btn preset-card-pin${preset.pinned ? ' pinned' : ''}`}
  onClick={() => togglePresetPin.mutate(preset)}
  title={preset.pinned ? 'Открепить' : 'Закрепить'}
  whileTap={{ scale: 0.95 }}
>
```

- [ ] **Step 7: Update onEdit and onAdd usage in renderCard and header**

Replace:
```typescript
<motion.button
  className="preset-card-btn preset-card-edit"
  onClick={() => onEdit(preset.id)}
  title="Редактировать"
  whileTap={{ scale: 0.95 }}
>
```

With:
```typescript
<motion.button
  className="preset-card-btn preset-card-edit"
  onClick={() => setEditPreset(preset)}
  title="Редактировать"
  whileTap={{ scale: 0.95 }}
>
```

Replace:
```typescript
<motion.button
  className="btn-primary"
  onClick={onAdd}
  whileTap={{ scale: 0.97 }}
>
  + Создать
</motion.button>
```

With:
```typescript
<motion.button
  className="btn-primary"
  onClick={() => setShowNewPreset(true)}
  whileTap={{ scale: 0.97 }}
>
  + Создать
</motion.button>
```

- [ ] **Step 8: Add launch handler**

Add after handleDelete:
```typescript
const handleLaunch = useCallback(async (id: string) => {
  const preset = presets.find(p => p.id === id);
  if (preset && preset.apps.length > 0) {
    await window.electronPresets.launch(preset.apps);
  }
}, [presets]);
```

- [ ] **Step 9: Update onLaunch usage in renderCard**

Replace:
```typescript
<motion.button
  className="preset-card-launch"
  onClick={() => onLaunch(preset.id)}
  title="Запустить"
  whileTap={{ scale: 0.95 }}
>
```

With:
```typescript
<motion.button
  className="preset-card-launch"
  onClick={() => handleLaunch(preset.id)}
  title="Запустить"
  whileTap={{ scale: 0.95 }}
>
```

- [ ] **Step 10: Add loading state**

Add after the search section:
```typescript
if (isLoading) {
  return (
    <div className="presets-page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="loading-spinner" />
      </div>
    </div>
  );
}
```

- [ ] **Step 11: Verify TypeScript compiles**

Run: `cd HelperDesktop.io && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 12: Commit**

```bash
git add HelperDesktop.io/src/components/PresetsPage.tsx
git commit -m "refactor: migrate PresetsPage to React Query hooks"
```

---

## Task 3: Update App.tsx to Remove Presets/Notes State

**Files:**
- Modify: `HelperDesktop.io/src/App.tsx`

**Interfaces:**
- Consumes: PresetsPage and NotesPage now self-contained
- Produces: App.tsx with minimal state (routing, auth, UI)

- [ ] **Step 1: Read current App.tsx implementation**

Read `HelperDesktop.io/src/App.tsx` to understand current structure.

- [ ] **Step 2: Remove presets and notes state**

Remove these lines:
```typescript
const [presets, setPresets] = useState<Preset[]>([]);
const [notes, setNotes] = useState<Note[]>([]);
const [editPreset, setEditPreset] = useState<Preset | null | 'new'>('new');
```

- [ ] **Step 3: Remove useEffect blocks for loading data**

Remove these useEffect blocks:
```typescript
useEffect(() => {
  window.electronPresets.getAll().then(setPresets);
}, []);

useEffect(() => {
  if (user) {
    window.electronNotes.getAll().then(setNotes);
  }
}, [user]);
```

- [ ] **Step 4: Remove preset-related callbacks**

Remove these callbacks:
```typescript
const handleLaunchPreset = useCallback(async (id: string) => {
  const preset = presets.find(p => p.id === id);
  if (preset && preset.apps.length > 0) {
    await window.electronPresets.launch(preset.apps);
  }
}, [presets]);

const handleEditPreset = useCallback((id: string) => {
  const preset = presets.find(p => p.id === id);
  if (preset) setEditPreset(preset);
}, [presets]);

const handleAddPreset = useCallback(() => {
  setEditPreset(null);
}, []);

const handleSavePreset = useCallback((saved: Preset) => {
  setPresets(prev => {
    const idx = prev.findIndex(p => p.id === saved.id);
    if (idx >= 0) {
      const next = [...prev];
      next[idx] = saved;
      return next;
    }
    return [...prev, saved];
  });
  setEditPreset('new');
}, []);

const handleTogglePin = useCallback(async (id: string) => {
  setPresets(prev => {
    const next = prev.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p);
    const target = next.find(p => p.id === id);
    if (target) window.electronPresets.save(target);
    return next;
  });
}, []);

const handleDeletePreset = useCallback(async (id: string) => {
  await window.electronPresets.delete(id);
  setPresets(prev => prev.filter(p => p.id !== id));
}, []);

const handleCloseEdit = useCallback(() => {
  setEditPreset('new');
}, []);

const pinnedPresets = useMemo(() =>
  presets.filter(p => p.pinned).map(p => ({ id: p.id, name: p.name, icon: p.icon })),
  [presets]
);
```

- [ ] **Step 5: Update PresetsPage rendering**

Replace:
```typescript
if (activePage === 'presets') {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="loading-spinner" /></div>}>
      <PresetsPage
        key="presets"
        presets={presets}
        onLaunch={handleLaunchPreset}
        onEdit={handleEditPreset}
        onAdd={handleAddPreset}
        onTogglePin={handleTogglePin}
        onDelete={handleDeletePreset}
      />
    </Suspense>
  );
}
```

With:
```typescript
if (activePage === 'presets') {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="loading-spinner" /></div>}>
      <PresetsPage key="presets" />
    </Suspense>
  );
}
```

- [ ] **Step 6: Remove PresetEditModal from App.tsx**

Remove:
```typescript
<AnimatePresence>
  {editPreset !== 'new' && (
    <PresetEditModal
      preset={editPreset}
      onClose={handleCloseEdit}
      onSave={handleSavePreset}
    />
  )}
</AnimatePresence>
```

- [ ] **Step 7: Remove unused imports**

Remove:
```typescript
import PresetEditModal from './components/PresetEditModal';
```

Remove `Preset` and `Note` from type imports:
```typescript
import type { Preset, Note } from './types.d';
```

Should become:
```typescript
// Remove this line entirely if no other types are used
```

- [ ] **Step 8: Update Sidebar props**

Replace:
```typescript
<Sidebar
  pages={pages}
  active={activePage}
  onSelect={handleSelectPage}
  pinnedPresets={pinnedPresets}
  onLaunchPreset={handleLaunchPreset}
  onEditPreset={handleEditPreset}
/>
```

With:
```typescript
<Sidebar
  pages={pages}
  active={activePage}
  onSelect={handleSelectPage}
/>
```

- [ ] **Step 9: Remove unused state variables**

Remove:
```typescript
const [editPreset, setEditPreset] = useState<Preset | null | 'new'>('new');
```

- [ ] **Step 10: Verify TypeScript compiles**

Run: `cd HelperDesktop.io && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 11: Commit**

```bash
git add HelperDesktop.io/src/App.tsx
git commit -m "refactor: remove presets/notes state from App.tsx"
```

---

## Task 4: Update CommandPalette to Use React Query

**Files:**
- Modify: `HelperDesktop.io/src/components/CommandPalette.tsx`

**Interfaces:**
- Consumes: `useNotes` from `hooks/useNotes.ts`, `usePresets` from `hooks/usePresets.ts`
- Produces: CommandPalette with its own data fetching

- [ ] **Step 1: Read current CommandPalette implementation**

Read `HelperDesktop.io/src/components/CommandPalette.tsx` to understand current structure.

- [ ] **Step 2: Update imports**

Add:
```typescript
import { useNotes } from '../hooks/useNotes';
import { usePresets } from '../hooks/usePresets';
import { useAuth } from '../AuthContext';
```

- [ ] **Step 3: Replace props with hooks**

Replace:
```typescript
interface CommandPaletteProps {
  onClose: () => void;
  onNavigate: (page: string) => void;
  pages: { id: string; label: string }[];
  notes: Note[];
  presets: Preset[];
  onOpenNote: (noteId: number) => void;
}

export default function CommandPalette({ onClose, onNavigate, pages, notes, presets, onOpenNote }: CommandPaletteProps) {
```

With:
```typescript
interface CommandPaletteProps {
  onClose: () => void;
  onNavigate: (page: string) => void;
  pages: { id: string; label: string }[];
  onOpenNote: (noteId: number) => void;
}

export default function CommandPalette({ onClose, onNavigate, pages, onOpenNote }: CommandPaletteProps) {
  const { user } = useAuth();
  const { data: notes = [] } = useNotes(user?.id ?? null);
  const { data: presets = [] } = usePresets();
```

- [ ] **Step 4: Update App.tsx to remove notes/presets from CommandPalette**

In `App.tsx`, replace:
```typescript
<CommandPalette
  onClose={() => setShowCmdPalette(false)}
  onNavigate={handleSelectPage}
  pages={pages}
  notes={notes}
  presets={presets}
  onOpenNote={(noteId) => {
    setActivePage('notes');
    window.dispatchEvent(new CustomEvent('deep-link-note', { detail: noteId }));
  }}
/>
```

With:
```typescript
<CommandPalette
  onClose={() => setShowCmdPalette(false)}
  onNavigate={handleSelectPage}
  pages={pages}
  onOpenNote={(noteId) => {
    setActivePage('notes');
    window.dispatchEvent(new CustomEvent('deep-link-note', { detail: noteId }));
  }}
/>
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd HelperDesktop.io && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add HelperDesktop.io/src/components/CommandPalette.tsx HelperDesktop.io/src/App.tsx
git commit -m "refactor: migrate CommandPalette to React Query"
```

---

## Task 5: Final Cleanup and Verification

**Files:**
- Modify: `HelperDesktop.io/src/App.tsx` (remove unused imports)

- [ ] **Step 1: Remove unused imports from App.tsx**

Remove:
```typescript
import type { Preset, Note } from './types.d';
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd HelperDesktop.io && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run tests**

Run: `cd HelperDesktop.io && npm test`
Expected: All tests pass

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: cleanup unused imports after React Query migration"
```
