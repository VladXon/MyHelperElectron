import { ipcMain } from 'electron';

export function registerTelegramIPC(getServerUrl: () => string, getAuthHeaders: () => Record<string, string>) {
  ipcMain.handle('telegram:status', async () => {
    const headers = getAuthHeaders();
    const url = getServerUrl();
    const res = await fetch(`${url}/api/telegram/status`, { headers });
    if (!res.ok) throw new Error('Failed to check status');
    return res.json();
  });

  ipcMain.handle('telegram:link', async (_event, login: string, password: string) => {
    const headers = getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    const url = getServerUrl();
    const res = await fetch(`${url}/api/telegram/link`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ login, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to link');
    }
    return res.json();
  });

  ipcMain.handle('telegram:unlink', async () => {
    const headers = getAuthHeaders();
    const url = getServerUrl();
    const res = await fetch(`${url}/api/telegram/unlink`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error('Failed to unlink');
    return res.json();
  });

  ipcMain.handle('telegram:qr-generate', async () => {
    const headers = getAuthHeaders();
    const url = getServerUrl();
    const res = await fetch(`${url}/api/telegram/qr/generate`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error('Failed to generate QR');
    return res.json();
  });

  ipcMain.handle('telegram:qr-check', async (_event, code: string) => {
    const headers = getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    const url = getServerUrl();
    const res = await fetch(`${url}/api/telegram/qr/check`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ code })
    });
    if (!res.ok) throw new Error('Failed to check QR');
    return res.json();
  });

  ipcMain.handle('telegram:code-send', async () => {
    const headers = getAuthHeaders();
    const url = getServerUrl();
    const res = await fetch(`${url}/api/telegram/code/send`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error('Failed to send code');
    return res.json();
  });

  ipcMain.handle('telegram:code-verify', async (_event, code: string) => {
    const headers = getAuthHeaders();
    headers['Content-Type'] = 'application/json';
    const url = getServerUrl();
    const res = await fetch(`${url}/api/telegram/code/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ code })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to verify code');
    }
    return res.json();
  });
}
