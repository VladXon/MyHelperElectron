import { app, BrowserWindow, Menu, ipcMain, globalShortcut } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import WsClient from 'ws';
import started from 'electron-squirrel-startup';
import { registerAllIPC, loadAuthFile } from './main/ipc';

if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let wsClient: WsClient | null = null;
let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isClosing = false;

const SERVER_URL_FILE = path.join(app.getPath('userData'), 'server-url.json');

function loadServerUrl(): string {
  try {
    if (fs.existsSync(SERVER_URL_FILE)) {
      const d = JSON.parse(fs.readFileSync(SERVER_URL_FILE, 'utf-8'));
      if (d.url) return d.url;
    }
  } catch { /* ignore */ }
  return process.env.SERVER_URL || 'http://localhost:3001';
}

function saveServerUrl(url: string) {
  try {
    fs.writeFileSync(SERVER_URL_FILE, JSON.stringify({ url }, null, 2));
  } catch { /* ignore */ }
}

let serverUrl = loadServerUrl();

function getServerUrl(): string {
  return serverUrl;
}

function setServerUrl(url: string) {
  serverUrl = url;
  saveServerUrl(url);
}

function getAuthHeaders(): Record<string, string> {
  const creds = loadAuthFile();
  const headers: Record<string, string> = {};
  if (creds.token) {
    headers['authorization'] = `Bearer ${creds.token}`;
  } else if (creds.login && creds.password) {
    headers['x-auth-login'] = creds.login;
    headers['x-auth-password'] = creds.password;
  }
  return headers;
}

async function apiFetch(method: string, fetchPath: string, body?: unknown): Promise<unknown> {
  const url = `${serverUrl}${fetchPath}`;
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Server error ${res.status}: ${err}`);
  }
  return res.json();
}

function getWsUrl(): string {
  return serverUrl.replace(/^http/, 'ws') + '/ws';
}

function sendToRenderer(channel: string, ...args: unknown[]) {
  if (isClosing || !mainWindow || mainWindow.isDestroyed()) return;
  try {
    mainWindow.webContents.send(channel, ...args);
  } catch { /* ignore */ }
}

function connectWebSocket() {
  if (isClosing) return;
  if (wsClient?.readyState === WsClient.OPEN || wsClient?.readyState === WsClient.CONNECTING) return;
  try {
    const url = getWsUrl();
    wsClient = new WsClient(url);
    wsClient.on('open', () => {
      if (isClosing) return;
      console.log('WebSocket connected');
      sendToRenderer('server:health', { online: true });
    });
    wsClient.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'health') {
          sendToRenderer('server:health', { online: true, timestamp: msg.timestamp, uptime: msg.uptime });
        }
      } catch { /* ignore parse errors */ }
    });
    wsClient.on('close', () => {
      if (isClosing) return;
      console.log('WebSocket disconnected');
      sendToRenderer('server:health', { online: false });
      wsClient = null;
      wsReconnectTimer = setTimeout(connectWebSocket, 5000);
    });
    wsClient.on('error', () => {
      wsClient?.close();
      wsClient = null;
    });
  } catch {
    wsClient = null;
    if (!isClosing) {
      wsReconnectTimer = setTimeout(connectWebSocket, 5000);
    }
  }
}

function disconnectWebSocket() {
  isClosing = true;
  if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
  wsReconnectTimer = null;
  wsClient?.close();
  wsClient = null;
}

function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.on('maximize', () => {
    sendToRenderer('window-maximized-changed', true);
  });

  mainWindow.on('unmaximize', () => {
    sendToRenderer('window-maximized-changed', false);
  });

  mainWindow.on('closed', () => {
    disconnectWebSocket();
    mainWindow = null;
  });

  if (!app.isPackaged) {
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      mainWindow?.webContents.toggleDevTools();
    });
  }

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize-toggle', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

registerAllIPC(getServerUrl, setServerUrl, apiFetch, connectWebSocket, disconnectWebSocket, getMainWindow);

app.on('ready', () => {
  Menu.setApplicationMenu(null);

  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('helperdesktop', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('helperdesktop');
  }

  createWindow();
});

function handleDeepLink(url: string) {
  const match = url.match(/helperdesktop:\/\/note\/(\d+)/);
  if (match) {
    const noteId = parseInt(match[1], 10);
    const win = getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      win.webContents.send('deep-link:note', noteId);
    }
  }
}

app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

app.on('second-instance', (_event, commandLine) => {
  const url = commandLine.find(arg => arg.startsWith('helperdesktop://'));
  if (url) handleDeepLink(url);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
