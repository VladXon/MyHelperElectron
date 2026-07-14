# Performance Investigation Report

**Date:** 2026-07-14
**Project:** MyHelperElectron

## Problem Statement

React render time: 0ms
JavaScript handlers: 964ms

This indicates the bottleneck is NOT in React rendering, but in synchronous JavaScript operations outside React's render cycle.

## Root Causes Identified

### 1. Duplicate Server Health Checking

**Files:** `App.tsx:71-115`

The app runs TWO parallel health check mechanisms:
- **Polling:** `setInterval(checkServer, 30000)` — checks server every 30 seconds
- **WebSocket:** `window.electronServer.onHealth()` — receives health events via WebSocket

Both trigger `setServerOnline()` and auto-login logic independently. This creates:
- Redundant state updates
- Double auto-login attempts when server comes back online
- Unnecessary IPC calls

**Recommendation:** Remove the polling interval. Rely solely on WebSocket health events. If WebSocket is connected, server is online. Add a fallback check only on initial mount.

### 2. Auth Flow — Unnecessary Server Test Before Login

**File:** `AuthModal.tsx:41`

```typescript
const online = await window.electronServer.test();
if (!online) {
  setError('Сервер недоступен. Попробуйте позже.');
  return;
}
await loginRef.current(loginVal.trim(), loginVal.trim(), password);
```

Every login attempt first makes a separate `test()` IPC call, then the actual login IPC call. This adds ~100-200ms latency.

**Recommendation:** Remove the pre-test. Let the login call itself fail if the server is offline. Handle the error in the catch block.

### 3. NotesPage Not Using React Query

**File:** `NotesPage.tsx:30-36`

The `useNotes.ts` hook exists with React Query integration, but `NotesPage` uses raw `useState` + `useCallback` for loading notes:

```typescript
const loadNotes = useCallback(async () => {
  if (!user) return;
  const data = await window.electronNotes.getAll();
  setNotes(data);
}, [user]);
```

This bypasses React Query's caching, deduplication, and background refetching.

**Recommendation:** Refactor `NotesPage` to use the existing `useNotes` hook from `hooks/useNotes.ts`.

### 4. AuthContext — Multiple Sequential IPC Calls on Mount

**File:** `AuthContext.tsx:33-70`

On app startup:
1. `loadCredentials()` — IPC call
2. `login()` — IPC call (if credentials exist)
3. `getToken()` — IPC call (if login fails)
4. `refreshAccounts()` — IPC call

These are sequential, not parallel. Each IPC call has ~10-50ms overhead.

**Recommendation:** Parallelize independent IPC calls. `loadCredentials` and `listAccounts` can run in parallel.

### 5. AuthModal — Unnecessary useTransition

**File:** `AuthModal.tsx:21-31`

```typescript
const handleLoginChange = useCallback((e) => {
  startTransition(() => {
    setLoginVal(e.target.value);
  });
}, []);
```

`useTransition` is designed for expensive rendering updates. Setting a string state is lightweight and doesn't benefit from `startTransition`. The overhead of the transition wrapper actually adds complexity without benefit.

**Recommendation:** Remove `useTransition` and use direct `setState`.

### 6. Preset State Management — Dual Source of Truth

**File:** `App.tsx:39-44, 183-208`

Presets are stored in both:
- React state: `const [presets, setPresets] = useState<Preset[]>([])`
- Local storage via IPC: `window.electronPresets.getAll()`

Every save/toggle/delete updates both React state AND persists via IPC. The IPC calls are async but not awaited properly in some cases (fire-and-forget), which can cause state inconsistencies.

**Recommendation:** Use React Query for preset state management (hook already exists in `usePresets.ts`).

## Performance Impact Summary

| Issue | Impact | Fix Difficulty |
|-------|--------|----------------|
| Duplicate health checks | Medium | Easy |
| Pre-login server test | Low | Easy |
| NotesPage not using React Query | Medium | Medium |
| Sequential IPC on startup | Low | Medium |
| Unnecessary useTransition | Low | Easy |
| Dual preset state | Medium | Medium |

## Recommended Priority

1. Remove duplicate health checks (immediate impact)
2. Remove pre-login server test (easy win)
3. Remove useTransition from AuthModal (cleanup)
4. Refactor NotesPage to use React Query (medium effort)
5. Refactor PresetsPage to use React Query (medium effort)
6. Parallelize AuthContext startup IPC calls (low impact)

## Files to Modify

- `App.tsx` — Remove polling, use React Query for presets/notes
- `AuthModal.tsx` — Remove pre-test, remove useTransition
- `NotesPage.tsx` — Use `useNotes` hook
- `AuthContext.tsx` — Parallelize startup calls
