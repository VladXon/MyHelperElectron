import { ipcMain } from 'electron';

export function registerNotesIPC(apiFetch: (method: string, path: string, body?: unknown) => Promise<unknown>) {
  ipcMain.handle('notes:get-all', async () => {
    return await apiFetch('GET', '/api/notes');
  });

  ipcMain.handle('notes:create', async (_event, note: { title: string; body: string; tags: string[]; reminder_at?: number | null }) => {
    return await apiFetch('POST', '/api/notes', note);
  });

  ipcMain.handle('notes:update', async (_event, id: number, note: Record<string, unknown>) => {
    return await apiFetch('PUT', `/api/notes/${id}`, note);
  });

  ipcMain.handle('notes:remove', async (_event, id: number) => {
    await apiFetch('DELETE', `/api/notes/${id}`);
  });

  ipcMain.handle('notes:toggle', async (_event, id: number, field: 'pinned' | 'completed') => {
    return await apiFetch('PATCH', `/api/notes/${id}/toggle`, { field });
  });
}
