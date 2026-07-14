# Task 1: Migrate NotesPage to React Query

## What I Implemented

Migrated `NotesPage.tsx` from raw `useState`/`useCallback`/`useEffect` to React Query hooks:

- Replaced `notes` state + `loadNotes` + manual `getAll()` call with `useNotes(user?.id)`
- Replaced direct `window.electronNotes.create/update/remove` calls with `useCreateNote`, `useUpdateNote`, `useDeleteNote` mutations (which auto-invalidate on success)
- Replaced `window.electronNotes.toggle` + `loadNotes` with `useToggleNote` mutation (which has optimistic update via `onMutate`)
- Replaced `window.electronTelegram.status()` calls in `handleCreate`/`handleEdit` with `useTelegramStatus()` hook
- Removed `useCallback` import (no longer needed) and `telegramLinked` state

## What I Tested

- **TypeScript**: `npx tsc --noEmit` — no errors
- **Tests**: `npm test` — 6/6 passing
- **Lint**: `npm run lint` — no new issues (pre-existing warnings only)

## Files Changed

- `HelperDesktop.io/src/components/NotesPage.tsx` — migrated to React Query hooks

## Self-Review Findings

- The migration follows the plan exactly (Steps 1-9)
- The deep-link `useEffect` was kept as-is since it depends on `notes` from the query
- No unused imports remain — `useCallback` was removed from React imports
- All existing UI behavior preserved (search, filter, modal, delete confirm, toggle)
- The `Note` interface is still defined locally (not imported from types.d) — this matches the existing pattern

## Concerns

None. The implementation is clean and follows the plan exactly.
