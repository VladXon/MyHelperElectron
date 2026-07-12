import { ipcMain, safeStorage, app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

const AUTH_FILE = path.join(app.getPath('userData'), 'auth.json');

const ENC_PREFIX = 'enc:';
const canEncrypt = safeStorage.isEncryptionAvailable();

function encryptValue(plain: string): string {
  if (!canEncrypt) return plain;
  const buf = safeStorage.encryptString(plain);
  return ENC_PREFIX + buf.toString('base64');
}

function decryptValue(stored: string): string {
  if (!stored.startsWith(ENC_PREFIX)) return stored;
  if (!canEncrypt) return stored;
  const raw = Buffer.from(stored.slice(ENC_PREFIX.length), 'base64');
  return safeStorage.decryptString(raw);
}

interface AuthAccount {
  login: string;
  password: string;
  token?: string;
  refreshToken?: string;
}

interface AuthStore {
  version: number;
  activeAccount: string;
  accounts: Record<string, AuthAccount>;
}

function migrateOldAuthFormat(data: Record<string, unknown>): AuthStore {
  if (data.activeAccount && data.accounts) {
    return data as unknown as AuthStore;
  }
  const login = (data.login as string) || '';
  const password = (data.password as string) || '';
  const token = (data.token as string) || '';
  const refreshToken = (data.refreshToken as string) || '';
  const accounts: Record<string, AuthAccount> = {};
  if (login) {
    accounts[login] = { login, password, token, refreshToken };
  }
  return { version: 2, activeAccount: login, accounts };
}

export function loadAuthStore(): AuthStore {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const raw = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
      const store = migrateOldAuthFormat(raw);
      for (const acct of Object.values(store.accounts)) {
        if (acct.password) {
          acct.password = decryptValue(acct.password);
        }
      }
      return store;
    }
  } catch { /* ignore */ }
  return { version: 2, activeAccount: '', accounts: {} };
}

export function saveAuthStore(store: AuthStore) {
  try {
    const toStore: AuthStore = { ...store, accounts: {} };
    for (const [key, acct] of Object.entries(store.accounts)) {
      toStore.accounts[key] = { ...acct };
      if (toStore.accounts[key].password) {
        toStore.accounts[key].password = encryptValue(toStore.accounts[key].password);
      }
    }
    fs.writeFileSync(AUTH_FILE, JSON.stringify(toStore, null, 2));
  } catch { /* ignore */ }
}

export function loadAuthFile(): { login?: string; password?: string; token?: string; refreshToken?: string } {
  const store = loadAuthStore();
  if (store.activeAccount && store.accounts[store.activeAccount]) {
    const acct = store.accounts[store.activeAccount];
    return { login: acct.login, password: acct.password, token: acct.token, refreshToken: acct.refreshToken };
  }
  return {};
}

export function saveAuthFile(data: { login?: string; password?: string; token?: string; refreshToken?: string }) {
  const store = loadAuthStore();
  if (data.login) {
    store.accounts[data.login] = {
      login: data.login,
      password: data.password || '',
      token: data.token,
      refreshToken: data.refreshToken,
    };
    store.activeAccount = data.login;
  }
  saveAuthStore(store);
}

export function clearAuthFile() {
  try {
    if (fs.existsSync(AUTH_FILE)) fs.unlinkSync(AUTH_FILE);
  } catch { /* ignore */ }
}

export function registerAuthIPC(getServerUrl: () => string, apiFetch: (method: string, path: string, body?: unknown) => Promise<unknown>) {
  ipcMain.handle('auth:login', async (_event, login: string, name: string, password: string) => {
    const serverUrl = getServerUrl();
    const res = await fetch(`${serverUrl}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });
    if (!res.ok) {
      if (res.status === 404) {
        const regRes = await fetch(`${serverUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login, name: name || login, password }),
        });
        if (!regRes.ok) {
          const regErr = await regRes.text();
          throw new Error(`Register error ${regRes.status}: ${regErr}`);
        }
        await regRes.json();
        const tokenRes = await fetch(`${serverUrl}/api/auth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login, password }),
        });
        if (!tokenRes.ok) throw new Error('Failed to get token after register');
        const tokenData = await tokenRes.json() as { token: string; refreshToken: string; expiresIn: number; user: { id: number; login: string; name: string; email: string; is_dev: number; created_at: string } };
        saveAuthFile({ login, password, token: tokenData.token, refreshToken: tokenData.refreshToken });
        return tokenData.user;
      }
      const err = await res.text();
      throw new Error(`Login error ${res.status}: ${err}`);
    }
    const data = await res.json() as { token: string; refreshToken: string; expiresIn: number; user: { id: number; login: string; name: string; email: string; is_dev: number; created_at: string } };
    saveAuthFile({ login, password, token: data.token, refreshToken: data.refreshToken });
    return data.user;
  });

  ipcMain.handle('auth:load-credentials', () => {
    const store = loadAuthStore();
    return {
      login: store.activeAccount,
      password: store.accounts[store.activeAccount]?.password || '',
      activeAccount: store.activeAccount,
      accounts: Object.keys(store.accounts),
    };
  });

  ipcMain.handle('auth:save-credentials', (_event, login: string, password: string) => {
    const existing = loadAuthFile();
    saveAuthFile({ ...existing, login, password });
  });

  ipcMain.handle('auth:clear-credentials', () => {
    clearAuthFile();
  });

  ipcMain.handle('auth:change-password', async (_event, login: string, currentPassword: string, newPassword: string) => {
    try {
      const data = await apiFetch('PUT', '/api/auth/password', { login, currentPassword, newPassword });
      return data;
    } catch (err) {
      console.error('auth:change-password error:', err);
      throw err;
    }
  });

  ipcMain.handle('auth:set-email', async (_event, login: string, email: string, password: string) => {
    try {
      const data = await apiFetch('PUT', '/api/auth/email', { login, email, password });
      return data;
    } catch (err) {
      console.error('auth:set-email error:', err);
      throw err;
    }
  });

  ipcMain.handle('auth:get-token', () => {
    const creds = loadAuthFile();
    return { token: creds.token, refreshToken: creds.refreshToken };
  });

  ipcMain.handle('auth:save-token', (_event, token: string, refreshToken: string) => {
    const existing = loadAuthFile();
    saveAuthFile({ ...existing, token, refreshToken });
  });

  ipcMain.handle('auth:logout', async () => {
    const store = loadAuthStore();
    const acct = store.accounts[store.activeAccount];
    if (acct?.token) {
      try {
        const serverUrl = getServerUrl();
        await fetch(`${serverUrl}/api/auth/logout`, {
          method: 'POST',
          headers: { 'authorization': `Bearer ${acct.token}` },
        });
      } catch { /* ignore */ }
    }
    if (acct) {
      acct.token = undefined;
      acct.refreshToken = undefined;
      saveAuthStore(store);
    }
  });

  ipcMain.handle('auth:check-dev', async (_event, login: string, password: string) => {
    try {
      const data = await apiFetch('POST', '/api/auth/login', { login, password }) as { is_dev?: number };
      return Boolean(data.is_dev);
    } catch {
      return false;
    }
  });

  ipcMain.handle('auth:list-accounts', () => {
    const store = loadAuthStore();
    const accounts = Object.values(store.accounts).map(a => ({
      login: a.login,
      isActive: a.login === store.activeAccount,
    }));
    return { accounts, activeAccount: store.activeAccount };
  });

  ipcMain.handle('auth:switch-account', (_event, login: string) => {
    const store = loadAuthStore();
    if (!store.accounts[login]) {
      throw new Error('Account not found');
    }
    store.activeAccount = login;
    saveAuthStore(store);
    return { success: true, activeAccount: login };
  });

  ipcMain.handle('auth:remove-account', (_event, login: string) => {
    const store = loadAuthStore();
    if (!store.accounts[login]) {
      throw new Error('Account not found');
    }
    delete store.accounts[login];
    if (store.activeAccount === login) {
      const remaining = Object.keys(store.accounts);
      store.activeAccount = remaining.length > 0 ? remaining[0] : '';
    }
    saveAuthStore(store);
    return { success: true, activeAccount: store.activeAccount };
  });
}
