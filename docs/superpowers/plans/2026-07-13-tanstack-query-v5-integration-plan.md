# TanStack Query v5 Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace manual data fetching in Electron renderer with TanStack Query v5 + DevTools

**Architecture:** Centralized query keys, QueryClient provider in App.tsx, 5 custom hooks for server health, presets, notes, telegram, auth. Migrate App.tsx and NotesPage.tsx to use hooks.

**Tech Stack:** TanStack Query v5, React 19, Electron, TypeScript, Vitest

---

## Global Constraints

- Use TanStack Query v5 (`@tanstack/react-query@^5.0.0`)
- DevTools only in development (`@tanstack/react-query-devtools@^5.0.0`)
- Query keys: centralized in `src/lib/queryKeys.ts` as `const` tuples
- Default query options: `staleTime: 5min`, `gcTime: 10min`, `retry: 1`, `refetchOnWindowFocus: false`
- Mutations: `retry: 0`, optimistic updates for pin/toggle
- DevTools: `<ReactQueryDevtools initialIsOpen={false} />` only when `import.meta.env.DEV`
- No breaking changes to AuthContext public API
- Follow existing code style (2-space indent, no semicolons in types.d.ts but yes in .tsx, functional components)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Add deps |
| `src/lib/queryKeys.ts` | Create | Centralized query keys |
| `src/lib/queryClient.tsx` | Create | QueryClient + Provider + DevTools |
| `src/hooks/useServerHealth.ts` | Create | Server health polling hook |
| `src/hooks/usePresets.ts` | Create | Presets CRUD hooks |
| `src/hooks/useNotes.ts` | Create | Notes CRUD hooks |
| `src/hooks/useTelegramStatus.ts` | Create | Telegram status hook |
| `src/hooks/useAuthQuery.ts` | Create | Auth data hooks |
| `src/App.tsx` | Modify | Replace manual state with hooks |
| `src/components/NotesPage.tsx` | Modify | Replace manual mutations with hooks |
| `src/AuthContext.tsx` | Modify | Optional: add query hooks for accounts |

---

## Tasks

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: Updated package.json with `@tanstack/react-query@^5.0.0`, `@tanstack/react-query-devtools@^5.0.0`

- [ ] **Step 1.1: Add dependencies to package.json**

```json
{
  "dependencies": {
    "@phosphor-icons/react": "^2.1.10",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-query-devtools": "^5.0.0",
    "electron-squirrel-startup": "^1.0.1",
    "framer-motion": "^12.42.2",
    "qrcode": "^1.5.4",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-scan": "^0.5.7",
    "ws": "^8.21.0"
  }
}
```

- [ ] **Step 1.2: Install dependencies**

```bash
cd D:\repos\MyHelperElectron\HelperDesktop.io && npm install
```

- [ ] **Step 1.3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add TanStack Query v5 and DevTools dependencies"
```

---

### Task 2: Create Query Keys (`src/lib/queryKeys.ts`)

**Files:**
- Create: `src/lib/queryKeys.ts`

**Interfaces:**
- Produces: `queryKeys` object with typed const tuples for all data domains

- [ ] **Step 2.1: Write queryKeys.ts**

```typescript
// src/lib/queryKeys.ts
export const queryKeys = {
  server: {
    health: ['server', 'health'] as const,
    url: ['server', 'url'] as const,
  },
  auth: {
    user: ['auth', 'user'] as const,
    accounts: ['auth', 'accounts'] as const,
  },
  presets: {
    all: ['presets'] as const,
    detail: (id: string) => ['presets', id] as const,
  },
  notes: {
    all: ['notes'] as const,
    detail: (id: number) => ['notes', id] as const,
  },
  telegram: {
    status: ['telegram', 'status'] as const,
  },
} as const;
```

- [ ] **Step 2.2: Commit**

```bash
git add src/lib/queryKeys.ts
git commit -m "feat: add centralized query keys"
```

---

### Task 3: Create QueryClient Provider (`src/lib/queryClient.tsx`)

**Files:**
- Create: `src/lib/queryClient.tsx`

**Interfaces:**
- Consumes: `queryKeys` (not directly, but same patterns)
- Produces: `queryClient` instance, `QueryProvider` component

- [ ] **Step 3.1: Write queryClient.tsx**

```tsx
// src/lib/queryClient.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode } from 'react';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 min
      gcTime: 10 * 60 * 1000,          // 10 min (v5: cacheTime -> gcTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

- [ ] **Step 3.2: Commit**

```bash
git add src/lib/queryClient.tsx
git commit -m "feat: add QueryClient and Provider with DevTools"
```

---

### Task 4: Create Server Health Hook (`src/hooks/useServerHealth.ts`)

**Files:**
- Create: `src/hooks/useServerHealth.ts`

**Interfaces:**
- Consumes: `queryKeys.server.health`, `queryKeys.server.url`, `window.electronServer`
- Produces: `useServerHealth()`, `useServerUrl()`

- [ ] **Step 4.1: Write useServerHealth.ts**

```typescript
// src/hooks/useServerHealth.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';

export function useServerHealth() {
  return useQuery({
    queryKey: queryKeys.server.health,
    queryFn: () => window.electronServer.test(),
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });
}

export function useServerUrl() {
  return useQuery({
    queryKey: queryKeys.server.url,
    queryFn: () => window.electronServer.getUrl(),
    staleTime: Infinity,
  });
}
```

- [ ] **Step 4.2: Commit**

```bash
git add src/hooks/useServerHealth.ts
git commit -m "feat: add useServerHealth hook with 30s polling"
```

---

### Task 5: Create Presets Hooks (`src/hooks/usePresets.ts`)

**Files:**
- Create: `src/hooks/usePresets.ts`

**Interfaces:**
- Consumes: `queryKeys.presets`, `window.electronPresets`, `Preset` type from `../types.d`
- Produces: `usePresets()`, `useSavePreset()`, `useDeletePreset()`, `useTogglePresetPin()`

- [ ] **Step 5.1: Write usePresets.ts**

```typescript
// src/hooks/usePresets.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import type { Preset } from '../types.d';

export function usePresets() {
  return useQuery({
    queryKey: queryKeys.presets.all,
    queryFn: () => window.electronPresets.getAll() as Promise<Preset[]>,
  });
}

export function useSavePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (preset: Preset) => window.electronPresets.save(preset),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.presets.all }),
  });
}

export function useDeletePreset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => window.electronPresets.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.presets.all }),
  });
}

export function useTogglePresetPin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (preset: Preset) => {
      await window.electronPresets.save({ ...preset, pinned: !preset.pinned });
    },
    onMutate: async (preset) => {
      await qc.cancelQueries({ queryKey: queryKeys.presets.all });
      const previous = qc.getQueryData<Preset[]>(queryKeys.presets.all);
      qc.setQueryData<Preset[]>(queryKeys.presets.all, (old) =>
        old?.map((p) => (p.id === preset.id ? { ...p, pinned: !p.pinned } : p))
      );
      return { previous };
    },
    onError: (_err, _preset, ctx) => {
      ctx?.previous && qc.setQueryData(queryKeys.presets.all, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.presets.all }),
  });
}
```

- [ ] **Step 5.2: Commit**

```bash
git add src/hooks/usePresets.ts
git commit -m "feat: add presets hooks (query + mutations with optimistic update)"
```

---

### Task 6: Create Notes Hooks (`src/hooks/useNotes.ts`)

**Files:**
- Create: `src/hooks/useNotes.ts`

**Interfaces:**
- Consumes: `queryKeys.notes`, `window.electronNotes`, `Note` type from `../types.d`
- Produces: `useNotes()`, `useCreateNote()`, `useUpdateNote()`, `useDeleteNote()`, `useToggleNote()`

- [ ] **Step 6.1: Write useNotes.ts**

```typescript
// src/hooks/useNotes.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import type { Note } from '../types.d';

interface CreateNoteInput {
  title: string;
  body: string;
  tags: string[];
  reminder_at: number | null;
  notify_telegram: boolean;
}

export function useNotes(userId: number | null) {
  return useQuery({
    queryKey: queryKeys.notes.all,
    queryFn: () => window.electronNotes.getAll() as Promise<Note[]>,
    enabled: !!userId,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note: CreateNoteInput) =>
      window.electronNotes.create({ ...note, reminder_at: note.reminder_at ?? undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notes.all }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Note> }) =>
      window.electronNotes.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notes.all }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => window.electronNotes.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notes.all }),
  });
}

export function useToggleNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, field }: { id: number; field: 'pinned' | 'completed' }) =>
      window.electronNotes.toggle(id, field),
    onMutate: async ({ id, field }) => {
      await qc.cancelQueries({ queryKey: queryKeys.notes.all });
      const previous = qc.getQueryData<Note[]>(queryKeys.notes.all);
      qc.setQueryData<Note[]>(queryKeys.notes.all, (old) =>
        old?.map((n) => (n.id === id ? { ...n, [field]: !n[field] } : n))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previous && qc.setQueryData(queryKeys.notes.all, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.notes.all }),
  });
}
```

- [ ] **Step 6.2: Commit**

```bash
git add src/hooks/useNotes.ts
git commit -m "feat: add notes hooks (query + mutations with optimistic updates)"
```

---

### Task 7: Create Telegram Status Hook (`src/hooks/useTelegramStatus.ts`)

**Files:**
- Create: `src/hooks/useTelegramStatus.ts`

**Interfaces:**
- Consumes: `queryKeys.telegram.status`, `window.electronTelegram`
- Produces: `useTelegramStatus()`

- [ ] **Step 7.1: Write useTelegramStatus.ts**

```typescript
// src/hooks/useTelegramStatus.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';

export function useTelegramStatus() {
  return useQuery({
    queryKey: queryKeys.telegram.status,
    queryFn: () => window.electronTelegram.status(),
    staleTime: 2 * 60 * 1000,
  });
}
```

- [ ] **Step 7.2: Commit**

```bash
git add src/hooks/useTelegramStatus.ts
git commit -m "feat: add useTelegramStatus hook"
```

---

### Task 8: Create Auth Query Hooks (`src/hooks/useAuthQuery.ts`)

**Files:**
- Create: `src/hooks/useAuthQuery.ts`

**Interfaces:**
- Consumes: `queryKeys.auth`, `window.electronAuth`
- Produces: `useAuthUser()`, `useAuthAccounts()`

- [ ] **Step 8.1: Write useAuthQuery.ts**

```typescript
// src/hooks/useAuthQuery.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';

export function useAuthUser() {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: async () => {
      const creds = await window.electronAuth.loadCredentials();
      if (!creds.token) return null;
      return window.electronAuth.getToken();
    },
    staleTime: Infinity,
  });
}

export function useAuthAccounts() {
  return useQuery({
    queryKey: queryKeys.auth.accounts,
    queryFn: () => window.electronAuth.listAccounts(),
    staleTime: 30_000,
  });
}
```

- [ ] **Step 8.2: Commit**

```bash
git add src/hooks/useAuthQuery.ts
git commit -m "feat: add auth query hooks for user and accounts"
```

---

### Task 9: Update App.tsx to Use Query Provider and Hooks

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `QueryProvider` from `../lib/queryClient`, `useServerHealth`, `usePresets` from hooks
- Produces: App with provider wrapping, server health + presets from queries

- [ ] **Step 9.1: Modify App.tsx imports and wrap with QueryProvider**

```tsx
// src/App.tsx - add imports
import { QueryProvider } from './lib/queryClient';
import { useServerHealth } from './hooks/useServerHealth';
import { usePresets } from './hooks/usePresets';
```

- [ ] **Step 9.2: Wrap AppContent with QueryProvider**

```tsx
// In App() function, replace AuthProvider/ThemeProvider wrapping:
export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
```

- [ ] **Step 9.3: Replace manual server health polling in AppContent**

```tsx
// Remove: serverOnline, serverOnlineRef, wasOffline, handleHealthEvent, handleReconnect, checkServer useEffect
// Replace with:
const { data: serverOnline = true, refetch: checkServer } = useServerHealth();
```

- [ ] **Step 9.4: Replace manual presets state with usePresets**

```tsx
// Remove: const [presets, setPresets] = useState<Preset[]>([]);
// Replace with:
const { data: presets = [] } = usePresets();
```

- [ ] **Step 9.5: Update handlers to use mutation hooks**

```tsx
// Add at top of AppContent:
const savePresetMutation = useSavePreset();
const deletePresetMutation = useDeletePreset();
const togglePinMutation = useTogglePresetPin();

// Replace handleSavePreset:
const handleSavePreset = useCallback((saved: Preset) => {
  savePresetMutation.mutate(saved);
}, [savePresetMutation]);

// Replace handleDeletePreset:
const handleDeletePreset = useCallback(async (id: string) => {
  deletePresetMutation.mutate(id);
}, [deletePresetMutation]);

// Replace handleTogglePin:
const handleTogglePin = useCallback(async (id: string) => {
  const preset = presets.find(p => p.id === id);
  if (preset) togglePinMutation.mutate(preset);
}, [presets, togglePinMutation]);
```

- [ ] **Step 9.6: Update handleReconnect to use checkServer**

```tsx
const handleReconnect = useCallback(() => {
  void window.electronServer.connectWs();
  checkServer();
}, [checkServer]);
```

- [ ] **Step 9.7: Remove old useEffect for presets loading (line 42-44)**

```tsx
// Remove this:
useEffect(() => {
  window.electronPresets.getAll().then(setPresets);
}, []);
```

- [ ] **Step 9.8: Commit**

```bash
git add src/App.tsx
git commit -m "feat: migrate App.tsx to TanStack Query (server health, presets)"
```

---

### Task 10: Update NotesPage.tsx to Use Notes Hooks

**Files:**
- Modify: `src/components/NotesPage.tsx`

**Interfaces:**
- Consumes: `useNotes`, `useCreateNote`, `useUpdateNote`, `useDeleteNote`, `useToggleNote` from `../hooks/useNotes`
- Produces: NotesPage using query/mutation hooks

- [ ] **Step 10.1: Update imports**

```tsx
// src/components/NotesPage.tsx
import { useAuth } from '../AuthContext';
import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useToggleNote,
} from '../hooks/useNotes';
import { useTelegramStatus } from '../hooks/useTelegramStatus';
```

- [ ] **Step 10.2: Replace manual state and loadNotes**

```tsx
// Remove:
const [notes, setNotes] = useState<Note[]>([]);
const loadNotes = useCallback(async () => { ... }, [user]);
useEffect(() => { loadNotes(); }, [loadNotes]);

// Replace with:
const { user } = useAuth();
const { data: notes = [] } = useNotes(user?.id ?? null);
```

- [ ] **Step 10.3: Replace handleCreate, handleSave, handleToggle, handleDelete with mutations**

```tsx
const createNoteMutation = useCreateNote();
const updateNoteMutation = useUpdateNote();
const deleteNoteMutation = useDeleteNote();
const toggleNoteMutation = useToggleNote();

const handleCreate = async () => {
  const status = await window.electronTelegram.status();
  setEditNote(null);
  setShowModal(true);
  setTelegramLinked(status.linked);
};

const handleSave = async (noteData: CreateNoteInput) => {
  if (editNote) {
    updateNoteMutation.mutate({ id: editNote.id, data: noteData });
  } else {
    createNoteMutation.mutate(noteData);
  }
  setShowModal(false);
};

const handleToggle = async (id: number, field: 'pinned' | 'completed') => {
  toggleNoteMutation.mutate({ id, field });
};

const handleDelete = async (id: number) => {
  if (deleteConfirm === id) {
    deleteNoteMutation.mutate(id);
    setDeleteConfirm(null);
  } else {
    setDeleteConfirm(id);
  }
};
```

- [ ] **Step 10.4: Replace telegram status check in handleEdit/handleCreate**

```tsx
// Remove manual telegram status calls, use hook instead:
const { data: telegramStatus } = useTelegramStatus();
const telegramLinked = telegramStatus?.linked ?? false;

// In handleEdit/handleCreate, use telegramLinked from hook
```

- [ ] **Step 10.5: Commit**

```bash
git add src/components/NotesPage.tsx
git commit -m "feat: migrate NotesPage to TanStack Query hooks"
```

---

### Task 11: Optional - Augment AuthContext with Query Hooks

**Files:**
- Modify: `src/AuthContext.tsx`

**Interfaces:**
- Consumes: `useAuthUser`, `useAuthAccounts` from `../hooks/useAuthQuery`
- Produces: AuthContext with optional query-based data

- [ ] **Step 11.1: Import hooks (optional, for future use)**

```tsx
// src/AuthContext.tsx - add at top
import { useAuthUser, useAuthAccounts } from './hooks/useAuthQuery';
```

- [ ] **Step 11.2: Use in AuthProvider for initial load (optional)**

Keep existing logic but can add:
```tsx
const { data: authUser } = useAuthUser();
const { data: accountsData } = useAuthAccounts();
```

- [ ] **Step 11.3: Commit (if changes made)**

```bash
git add src/AuthContext.tsx
git commit -m "feat: augment AuthContext with query hooks"
```

---

### Task 12: Verify Build and TypeCheck

**Files:**
- None (verification)

**Interfaces:**
- Consumes: All previous tasks

- [ ] **Step 12.1: Run typecheck**

```bash
cd D:\repos\MyHelperElectron\HelperDesktop.io && npx tsc --noEmit
```

Expected: PASS (no TypeScript errors)

- [ ] **Step 12.2: Run linter**

```bash
cd D:\repos\MyHelperElectron\HelperDesktop.io && npm run lint
```

Expected: PASS (no lint errors)

- [ ] **Step 12.3: Run tests**

```bash
cd D:\repos\MyHelperElectron\HelperDesktop.io && npm test
```

Expected: PASS (all tests pass)

- [ ] **Step 12.4: Commit verification**

```bash
git commit --allow-empty -m "chore: verify build and typecheck pass"
```

---

### Task 13: Manual E2E Verification

**Files:**
- None (manual testing)

- [ ] **Step 13.1: Start dev server**

```bash
cd D:\repos\MyHelperElectron\HelperDesktop.io && npm run dev
```

- [ ] **Step 13.2: Verify in Electron app**
  - App loads without console errors
  - Server health shows online/offline correctly (30s polling)
  - Presets page: list, create, edit, delete, pin work
  - Notes page: list, create, edit, delete, pin, complete work
  - DevTools panel opens with `Ctrl+Shift+D` (or click React Query icon)
  - Queries appear in DevTools with correct keys
  - Mutations show optimistic updates

- [ ] **Step 13.3: Commit final**

```bash
git add -A
git commit -m "feat: complete TanStack Query v5 integration"
```

---

## Self-Review Checklist

- [ ] Spec coverage: All 5 hook groups + provider + keys + App/Notes migration covered
- [ ] No placeholders: Every step has exact code and commands
- [ ] Type consistency: `queryKeys` used throughout, `Preset`/`Note` types from `types.d.ts`
- [ ] DevTools only in dev: `import.meta.env.DEV` guard
- [ ] No breaking AuthContext API changes
- [ ] Optimistic updates for pin/toggle mutations
- [ ] Tests: typecheck, lint, unit tests all pass

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-07-13-tanstack-query-v5-integration-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration  
**REQUIRED SUB-SKILL:** `superpowers:subagent-driven-development`

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints  
**REQUIRED SUB-SKILL:** `superpowers:executing-plans`

**Which approach?**