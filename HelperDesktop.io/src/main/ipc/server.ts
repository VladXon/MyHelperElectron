import { ipcMain } from 'electron';

export function registerServerIPC(
  getServerUrl: () => string,
  setServerUrl: (url: string) => void,
  apiFetch: (method: string, path: string, body?: unknown) => Promise<unknown>,
  connectWebSocket: () => void,
  disconnectWebSocket: () => void
) {
  ipcMain.handle('server:get-url', () => {
    return getServerUrl();
  });

  ipcMain.handle('server:set-url', (_event, url: string) => {
    setServerUrl(url);
    disconnectWebSocket();
    connectWebSocket();
  });

  ipcMain.handle('server:test', async () => {
    try {
      const serverUrl = getServerUrl();
      const res = await fetch(`${serverUrl}/api/health`);
      if (res.ok) {
        connectWebSocket();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  ipcMain.handle('server:api', async (_event, method: string, path: string, body?: unknown) => {
    return apiFetch(method, path, body);
  });

  ipcMain.handle('server:connect-ws', () => {
    connectWebSocket();
  });
}
