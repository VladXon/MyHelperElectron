import { ipcMain } from 'electron';

export function registerSettingsIPC(apiFetch: (method: string, path: string, body?: unknown) => Promise<unknown>) {
  ipcMain.handle('settings:get', async (_event, key: string, userId: number) => {
    try {
      const data = await apiFetch('GET', `/api/data/${userId}/${key}`) as { value: string };
      return data.value;
    } catch {
      return null;
    }
  });

  ipcMain.handle('settings:set', async (_event, key: string, value: string, userId: number) => {
    await apiFetch('POST', `/api/data/${userId}`, { key, value });
  });

  ipcMain.handle('settings:set-many', async (_event, data: Record<string, string>, userId: number) => {
    await apiFetch('POST', `/api/data/${userId}/batch`, { data });
  });

  ipcMain.handle('settings:get-all', async (_event, userId: number) => {
    try {
      const rows = await apiFetch('GET', `/api/data/${userId}`) as { key: string; value: string }[];
      const result: Record<string, string> = {};
      for (const row of rows) {
        result[row.key] = row.value;
      }
      return result;
    } catch {
      return {};
    }
  });
}
