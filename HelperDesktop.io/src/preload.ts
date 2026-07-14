import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronWindow', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximizeToggle: () => ipcRenderer.send('window-maximize-toggle'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizedChanged: (callback: (maximized: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, maximized: unknown) => {
      callback(maximized === true);
    };
    ipcRenderer.on('window-maximized-changed', handler);
    return () => {
      ipcRenderer.removeListener('window-maximized-changed', handler);
    };
  },
  onResized: (callback: (size: { width: number; height: number }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, size: unknown) => {
      callback(size as { width: number; height: number });
    };
    ipcRenderer.on('window-resized', handler);
    return () => {
      ipcRenderer.removeListener('window-resized', handler);
    };
  },
});

contextBridge.exposeInMainWorld('electronAuth', {
  login: (login: string, name: string, password: string) => ipcRenderer.invoke('auth:login', login, name, password),
  checkDev: (login: string, password: string) => ipcRenderer.invoke('auth:check-dev', login, password),
  loadCredentials: () => ipcRenderer.invoke('auth:load-credentials'),
  saveCredentials: (login: string, password: string) => ipcRenderer.invoke('auth:save-credentials', login, password),
  clearCredentials: () => ipcRenderer.invoke('auth:clear-credentials'),
  changePassword: (login: string, currentPassword: string, newPassword: string) => ipcRenderer.invoke('auth:change-password', login, currentPassword, newPassword),
  setEmail: (login: string, email: string, password: string) => ipcRenderer.invoke('auth:set-email', login, email, password),
  getToken: () => ipcRenderer.invoke('auth:get-token'),
  saveToken: (token: string, refreshToken: string) => ipcRenderer.invoke('auth:save-token', token, refreshToken),
  logout: () => ipcRenderer.invoke('auth:logout'),
  listAccounts: () => ipcRenderer.invoke('auth:list-accounts'),
  switchAccount: (login: string) => ipcRenderer.invoke('auth:switch-account', login),
  removeAccount: (login: string) => ipcRenderer.invoke('auth:remove-account', login),
});

contextBridge.exposeInMainWorld('electronSettings', {
  get: (key: string, userId: number) => ipcRenderer.invoke('settings:get', key, userId),
  set: (key: string, value: string, userId: number) => ipcRenderer.invoke('settings:set', key, value, userId),
  setMany: (data: Record<string, string>, userId: number) => ipcRenderer.invoke('settings:set-many', data, userId),
  getAll: (userId: number) => ipcRenderer.invoke('settings:get-all', userId),
});

contextBridge.exposeInMainWorld('electronServer', {
  getUrl: () => ipcRenderer.invoke('server:get-url'),
  setUrl: (url: string) => ipcRenderer.invoke('server:set-url', url),
  test: () => ipcRenderer.invoke('server:test'),
  api: (method: string, path: string, body?: unknown) => ipcRenderer.invoke('server:api', method, path, body),
  connectWs: () => ipcRenderer.invoke('server:connect-ws'),
  onHealth: (callback: (data: { online: boolean; timestamp?: string; uptime?: number }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => {
      callback(data as { online: boolean; timestamp?: string; uptime?: number });
    };
    ipcRenderer.on('server:health', handler);
    return () => {
      ipcRenderer.removeListener('server:health', handler);
    };
  },
});

contextBridge.exposeInMainWorld('electronPresets', {
  getAll: () => ipcRenderer.invoke('presets:get-all'),
  save: (preset: unknown) => ipcRenderer.invoke('presets:save', preset),
  delete: (id: string) => ipcRenderer.invoke('presets:delete', id),
  launch: (apps: unknown) => ipcRenderer.invoke('presets:launch', apps),
});

contextBridge.exposeInMainWorld('electronDialog', {
  openFile: () => ipcRenderer.invoke('dialog:open-file'),
});

contextBridge.exposeInMainWorld('electronTelegram', {
  status: () => ipcRenderer.invoke('telegram:status'),
  link: (login: string, password: string) => ipcRenderer.invoke('telegram:link', login, password),
  unlink: () => ipcRenderer.invoke('telegram:unlink'),
  qrGenerate: () => ipcRenderer.invoke('telegram:qr-generate'),
  qrCheck: (code: string) => ipcRenderer.invoke('telegram:qr-check', code),
  codeSend: () => ipcRenderer.invoke('telegram:code-send'),
  codeVerify: (code: string) => ipcRenderer.invoke('telegram:code-verify', code),
});

contextBridge.exposeInMainWorld('electronNotes', {
  getAll: () => ipcRenderer.invoke('notes:get-all'),
  create: (note: { title: string; body: string; tags: string[]; reminder_at?: number | null }) => ipcRenderer.invoke('notes:create', note),
  update: (id: number, note: Record<string, unknown>) => ipcRenderer.invoke('notes:update', id, note),
  remove: (id: number) => ipcRenderer.invoke('notes:remove', id),
  toggle: (id: number, field: 'pinned' | 'completed') => ipcRenderer.invoke('notes:toggle', id, field),
});

contextBridge.exposeInMainWorld('electronDeepLink', {
  onNote: (callback: (noteId: number) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, noteId: unknown) => {
      callback(noteId as number);
    };
    ipcRenderer.on('deep-link:note', handler);
    return () => {
      ipcRenderer.removeListener('deep-link:note', handler);
    };
  },
});
