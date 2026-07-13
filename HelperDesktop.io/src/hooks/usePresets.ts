import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
