# TanStack Query v5 Integration Design

**Date:** 2026-07-13  
**Project:** MyHelperElectron (Electron + React + TypeScript)  
**Version:** v5 (latest)

---

## 1. Overview

Replace manual data fetching (`useEffect` + `useState`) in the Electron renderer with TanStack Query v5 for:
- Server health polling (replaces 30s `setInterval` in App.tsx)
- Presets management (replaces manual `useState` + `useEffect` in App.tsx)
- Notes CRUD (replaces manual fetch/mutations in NotesPage.tsx)
- Telegram status checks
- Auth user/accounts data (augments existing AuthContext)

Add React Query DevTools for development debugging.

---

## 2. Architecture

### 2.1 Query Keys Structure (`src/lib/queryKeys.ts`)

```typescript
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

### 2.2 Query Client Configuration (`src/lib/queryClient.tsx`)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 min
      gcTime: 10 * 60 * 1000,        // 10 min (v5: cacheTime → gcTime)
      retry: 1,
      refetchOnWindowFocus: false,   // Electron app, no browser focus
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### 2.3 Provider Setup (`src/App.tsx`)

```tsx
<QueryClientProvider client={queryClient}>
  {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
  <AuthProvider>
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  </AuthProvider>
</QueryClientProvider>
```

---

## 3. Custom Hooks

### 3.1 Server Health (`src/hooks/useServerHealth.ts`)

```typescript
export function useServerHealth() {
  return useQuery({
    queryKey: queryKeys.server.health,
    queryFn: () => window.electronServer.test(),
    refetchInterval: 30_000,  // replaces setInterval in App.tsx
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

### 3.2 Presets (`src/hooks/usePresets.ts`)

```typescript
export function usePresets() {
  return useQuery({
    queryKey: queryKeys.presets.all,
    queryFn: () => window.electronPresets.getAll(),
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
    onError: (err, preset, context) => {
      context?.previous && qc.setQueryData(queryKeys.presets.all, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.presets.all }),
  });
}
```

### 3.3 Notes (`src/hooks/useNotes.ts`)

```typescript
export function useNotes(userId: number | null) {
  return useQuery({
    queryKey: queryKeys.notes.all,
    queryFn: () => window.electronNotes.getAll(),
    enabled: !!userId,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note: CreateNoteInput) => window.electronNotes.create(note),
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
    onError: (_err, _vars, ctx) => ctx?.previous && qc.setQueryData(queryKeys.notes.all, ctx.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.notes.all }),
  });
}
```

### 3.4 Telegram Status (`src/hooks/useTelegramStatus.ts`)

```typescript
export function useTelegramStatus() {
  return useQuery({
    queryKey: queryKeys.telegram.status,
    queryFn: () => window.electronTelegram.status(),
    staleTime: 2 * 60 * 1000,
  });
}
```

### 3.5 Auth Augmentation (`src/hooks/useAuthQuery.ts`)

```typescript
export function useAuthUser() {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: () => window.electronAuth.loadCredentials().then(c => c.token ? window.electronAuth.getToken() : null),
    staleTime: Infinity,
  });
}

export function useAuthAccounts() {
  return useQuery({
    queryKey: queryKeys.auth.accounts,
    queryFn: () => window.electronAuth.listAccounts(),
    staleTime: 30 * 1000,
  });
}
```

---

## 4. Migration Plan

### Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add `@tanstack/react-query`, `@tanstack/react-query-devtools` |
| `src/lib/queryKeys.ts` | **New** - Centralized query keys |
| `src/lib/queryClient.tsx` | **New** - QueryClient + Provider |
| `src/hooks/useServerHealth.ts` | **New** |
| `src/hooks/usePresets.ts` | **New** |
| `src/hooks/useNotes.ts` | **New** |
| `src/hooks/useTelegramStatus.ts` | **New** |
| `src/hooks/useAuthQuery.ts` | **New** |
| `src/App.tsx` | Replace manual health polling + presets state with hooks |
| `src/components/NotesPage.tsx` | Replace `loadNotes` + manual mutations with hooks |
| `src/components/PresetsPage.tsx` | Receive presets from props (unchanged), parent uses hook |
| `src/AuthContext.tsx` | Keep for login/logout actions, optionally add `useAuthUser`/`useAuthAccounts` |

### Files to Delete
- None (incremental migration)

---

## 5. DevTools Configuration

- Only mount `<ReactQueryDevtools />` in development (`process.env.NODE_ENV === 'development'`)
- Default closed (`initialIsOpen={false}`)
- Position: bottom-right (default)

---

## 6. Cache Behavior

| Data | Stale Time | GC Time | Refetch Interval |
|------|------------|---------|------------------|
| Server health | 5 min | 10 min | 30 sec |
| Server URL | ∞ | 10 min | Never |
| Presets | 5 min | 10 min | On window focus |
| Notes | 5 min | 10 min | On window focus + after mutations |
| Telegram status | 2 min | 10 min | Never |
| Auth user | ∞ | 10 min | Never |
| Auth accounts | 30 sec | 10 min | On window focus |

---

## 7. Error Handling

- Queries: `retry: 1` (default), show error in UI via `error` state
- Mutations: `retry: 0`, use `onError` for toast notifications
- Network errors during health check: treated as `online: false`

---

## 8. Testing Strategy

- Unit test hooks with `@tanstack/react-query` testing utilities
- Integration test: App.tsx renders without console errors
- E2E: DevTools panel opens in dev mode

---

## 9. Rollback Plan

- Keep existing `useEffect` logic commented during transition
- Feature flag via `import.meta.env.VITE_USE_TANSTACK_QUERY` if needed
- Revert `package.json` and remove `src/hooks/`, `src/lib/query*` if issues arise