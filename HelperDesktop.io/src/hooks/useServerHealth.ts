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