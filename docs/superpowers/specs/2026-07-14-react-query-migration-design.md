# React Query Migration Design

**Date:** 2026-07-14
**Project:** MyHelperElectron
**Approach:** Incremental (NotesPage → PresetsPage → App.tsx)

---

## Overview

Migrate NotesPage, PresetsPage, and App.tsx to use React Query hooks for state management. This eliminates duplicate state, enables caching, optimistic updates, and background refetching.

---

## Section 1: NotesPage React Query Migration

### Current State
NotesPage uses raw `useState` + `useCallback` for loading notes:
```typescript
const [notes, setNotes] = useState<Note[]>([]);
const loadNotes = useCallback(async () => {
  if (!user) return;
  const data = await window.electronNotes.getAll();
  setNotes(data);
}, [user]);
useEffect(() => { loadNotes(); }, [loadNotes]);
```

### Proposed Change
Refactor to use existing hooks from `hooks/useNotes.ts`:
- `useNotes(userId)` — query hook
- `useCreateNote()` — mutation hook
- `useUpdateNote()` — mutation hook
- `useDeleteNote()` — mutation hook
- `useToggleNote()` — mutation hook with optimistic update

### Files to Modify
- `src/components/NotesPage.tsx`

### Changes
1. Import hooks from `hooks/useNotes.ts`
2. Replace `useState<Note[]>` with `useNotes(user?.id)`
3. Replace manual `loadNotes()` calls with mutation hooks
4. Remove `loadNotes` callback and `useEffect` for initial load
5. Use `useTelegramStatus` hook for Telegram status

### Benefits
- Automatic caching and background refetching
- Optimistic updates for toggle operations
- Loading/error states handled by React Query
- Consistent data across components

---

## Section 2: PresetsPage React Query Migration

### Current State
PresetsPage receives `presets` as props from App.tsx:
```typescript
interface PresetsPageProps {
  presets: Preset[];
  onLaunch: (id: string) => void;
  onEdit: (id: string) => void;
  onAdd: () => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}
```

### Proposed Change
Refactor PresetsPage to use `usePresets` hook internally:
- `usePresets()` — query hook
- `useSavePreset()` — mutation hook
- `useDeletePreset()` — mutation hook
- `useTogglePresetPin()` — mutation hook with optimistic update

### Files to Modify
- `src/components/PresetsPage.tsx`
- `src/App.tsx` (remove presets state management)

### Changes
1. Import hooks from `hooks/usePresets.ts`
2. Remove `presets` prop — PresetsPage fetches its own data
3. Replace `onLaunch`, `onEdit`, `onAdd`, `onTogglePin`, `onDelete` props with internal handlers
4. Add `PresetEditModal` inside PresetsPage (instead of App.tsx)
5. PresetsPage becomes self-contained

### Benefits
- PresetsPage is self-contained and reusable
- Automatic cache invalidation when presets change
- Consistent pattern with NotesPage
- App.tsx becomes simpler

---

## Section 3: App.tsx Cleanup

### Current State
App.tsx manages `presets` and `notes` state with `useState`:
```typescript
const [presets, setPresets] = useState<Preset[]>([]);
const [notes, setNotes] = useState<Note[]>([]);
const [editPreset, setEditPreset] = useState<Preset | null | 'new'>('new');
```

### Proposed Change
Remove `useState` for presets/notes. Components fetch their own data.

### Files to Modify
- `src/App.tsx`

### Changes
1. Remove `useState<Preset[]>` and `useState<Note[]>` from App.tsx
2. Remove `useEffect` blocks that load presets/notes on mount
3. Remove `handleSavePreset`, `handleTogglePin`, `handleDeletePreset` callbacks
4. Remove `editPreset` state — PresetsPage manages its own modal
5. Keep only: `activePage`, `showAuth`, `serverOnline`, `showCmdPalette`, and related handlers
6. PresetsPage and NotesPage become self-contained

### Benefits
- App.tsx becomes a thin layout shell (just routing + auth)
- Single source of truth for data (React Query cache)
- Easier to reason about — each page owns its data
- Eliminates prop drilling

---

## Implementation Order

1. **NotesPage** (simplest, hooks exist)
2. **PresetsPage** (needs PresetsPage to be self-contained)
3. **App.tsx** (remove state management after components are self-contained)

---

## Testing Strategy

- After each step, verify:
  - Data loads correctly
  - Mutations (create/update/delete/toggle) work
  - Cache invalidation works
  - Loading/error states display correctly
  - CommandPalette search still works with React Query data

---

## Risks

- **Risk:** PresetsPage needs access to `onLaunch` (calls `window.electronPresets.launch`)
  - **Mitigation:** Keep `onLaunch` as a prop or use a context

- **Risk:** App.tsx passes `notes` to CommandPalette
  - **Mitigation:** CommandPalette can use `useNotes` hook directly

---

## Success Criteria

- [ ] NotesPage uses `useNotes` hook
- [ ] PresetsPage uses `usePresets` hook
- [ ] App.tsx has no `useState` for presets/notes
- [ ] All mutations use React Query hooks
- [ ] No regressions in functionality
- [ ] TypeScript compiles without errors
