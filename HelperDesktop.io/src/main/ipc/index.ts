import { BrowserWindow } from 'electron';
import { registerAuthIPC, loadAuthFile } from './auth';
import { registerNotesIPC } from './notes';
import { registerSettingsIPC } from './settings';
import { registerPresetsIPC } from './presets';
import { registerTelegramIPC } from './telegram';
import { registerServerIPC } from './server';

export function registerAllIPC(
  getServerUrl: () => string,
  setServerUrl: (url: string) => void,
  apiFetch: (method: string, path: string, body?: unknown) => Promise<unknown>,
  connectWebSocket: () => void,
  disconnectWebSocket: () => void,
  getMainWindow: () => BrowserWindow | null
) {
  registerAuthIPC(getServerUrl, apiFetch);
  registerNotesIPC(apiFetch);
  registerSettingsIPC(apiFetch);
  registerPresetsIPC(getMainWindow);
  registerTelegramIPC(getServerUrl, () => {
    const creds = loadAuthFile();
    const headers: Record<string, string> = {};
    if (creds.token) {
      headers['authorization'] = `Bearer ${creds.token}`;
    } else if (creds.login && creds.password) {
      headers['x-auth-login'] = creds.login;
      headers['x-auth-password'] = creds.password;
    }
    return headers;
  });
  registerServerIPC(getServerUrl, setServerUrl, apiFetch, connectWebSocket, disconnectWebSocket);
}

export { loadAuthFile } from './auth';
