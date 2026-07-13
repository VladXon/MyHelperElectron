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