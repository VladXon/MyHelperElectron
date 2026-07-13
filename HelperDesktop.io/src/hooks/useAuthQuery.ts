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