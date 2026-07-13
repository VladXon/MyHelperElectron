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