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