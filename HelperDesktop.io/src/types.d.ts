export interface User {
  id: number;
  login: string;
  name: string;
  email: string;
  is_dev: number;
  created_at: string;
}

export interface ElectronWindowAPI {
  minimize: () => void;
  maximizeToggle: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  onMaximizedChanged: (callback: (maximized: boolean) => void) => () => void;
}

export interface TokenData {
  token?: string;
  refreshToken?: string;
}

export interface AccountInfo {
  login: string;
  isActive: boolean;
}

export interface ElectronAuthAPI {
  login: (login: string, name: string, password: string) => Promise<User>;
  checkDev: (login: string, password: string) => Promise<boolean>;
  loadCredentials: () => Promise<{ login?: string; password?: string; token?: string; activeAccount: string; accounts: string[] }>;
  saveCredentials: (login: string, password: string) => Promise<void>;
  clearCredentials: () => Promise<void>;
  changePassword: (login: string, currentPassword: string, newPassword: string) => Promise<{ success: boolean }>;
  setEmail: (login: string, email: string, password: string) => Promise<User>;
  getToken: () => Promise<TokenData>;
  saveToken: (token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  listAccounts: () => Promise<{ accounts: AccountInfo[]; activeAccount: string }>;
  switchAccount: (login: string) => Promise<{ success: boolean; activeAccount: string }>;
  removeAccount: (login: string) => Promise<{ success: boolean; activeAccount: string }>;
}

export interface ElectronSettingsAPI {
  get: (key: string, userId: number) => Promise<string | null>;
  set: (key: string, value: string, userId: number) => Promise<void>;
  setMany: (data: Record<string, string>, userId: number) => Promise<{ updated: number }>;
  getAll: (userId: number) => Promise<Record<string, string>>;
}

export interface ElectronServerAPI {
  getUrl: () => Promise<string>;
  setUrl: (url: string) => Promise<void>;
  test: () => Promise<boolean>;
  api: (method: string, path: string, body?: unknown) => Promise<unknown>;
  connectWs: () => Promise<void>;
  onHealth: (callback: (data: { online: boolean; timestamp?: string; uptime?: number }) => void) => () => void;
}

export interface PresetApp {
  name: string;
  path: string;
  runAsAdmin?: boolean;
}

export interface Preset {
  id: string;
  name: string;
  icon: string;
  apps: PresetApp[];
  pinned?: boolean;
}

export interface ElectronPresetsAPI {
  getAll: () => Promise<Preset[]>;
  save: (preset: Preset) => Promise<void>;
  delete: (id: string) => Promise<void>;
  launch: (apps: PresetApp[]) => Promise<{ launched: number }>;
}

export interface ElectronDialogAPI {
  openFile: () => Promise<string | null>;
}

export interface ElectronTelegramAPI {
  status: () => Promise<{ linked: boolean; telegramId?: number }>;
  link: (login: string, password: string) => Promise<{ linked: boolean; telegramId?: number; message?: string }>;
  unlink: () => Promise<{ unlinked: boolean }>;
  qrGenerate: () => Promise<{ code: string; deepLink: string; expiresIn: number }>;
  qrCheck: (code: string) => Promise<{ status: 'pending' | 'linked' | 'expired' | 'not_found'; telegramId?: number }>;
  codeSend: () => Promise<{ code: string; expiresIn: number }>;
  codeVerify: (code: string) => Promise<{ verified: boolean; login?: string }>;
}

export interface Note {
  id: number;
  user_id: number;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  completed: boolean;
  reminder_at: number | null;
  notify_telegram: boolean;
  telegram_notified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ElectronNotesAPI {
  getAll: () => Promise<Note[]>;
  create: (note: { title: string; body: string; tags: string[]; reminder_at?: number | null; notify_telegram?: boolean }) => Promise<Note>;
  update: (id: number, note: Record<string, unknown>) => Promise<Note>;
  remove: (id: number) => Promise<void>;
  toggle: (id: number, field: 'pinned' | 'completed') => Promise<Note>;
}

declare global {
  interface Window {
    electronWindow: ElectronWindowAPI;
    electronAuth: ElectronAuthAPI;
    electronSettings: ElectronSettingsAPI;
    electronServer: ElectronServerAPI;
    electronPresets: ElectronPresetsAPI;
    electronDialog: ElectronDialogAPI;
    electronTelegram: ElectronTelegramAPI;
    electronNotes: ElectronNotesAPI;
  }
}
