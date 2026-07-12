import { createContext, useContext, useCallback, useState, useEffect, useMemo, type ReactNode } from 'react';
import type { User, AccountInfo } from './types.d';

interface AuthState {
  user: User | null;
  isDev: boolean;
  loading: boolean;
  login: (login: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  accounts: AccountInfo[];
  activeAccount: string;
  switchAccount: (login: string) => Promise<void>;
  removeAccount: (login: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isDev, setIsDev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [activeAccount, setActiveAccount] = useState('');

  const refreshAccounts = useCallback(async () => {
    const data = await window.electronAuth.listAccounts();
    setAccounts(data.accounts);
    setActiveAccount(data.activeAccount);
  }, []);

  useEffect(() => {
    window.electronAuth.loadCredentials().then(async (creds) => {
      if (creds.token) {
        try {
          const u = await window.electronAuth.login(creds.login || '', creds.login || '', creds.password || '') as User;
          setUser(u);
          setIsDev(Boolean(u.is_dev));
          await refreshAccounts();
          setLoading(false);
          return;
        } catch {
          try {
            const tokenData = await window.electronAuth.getToken();
            if (tokenData.refreshToken) {
              const res = await window.electronServer.api('POST', '/api/auth/refresh', { refreshToken: tokenData.refreshToken }) as { token: string; refreshToken: string; user: User };
              if (res.token) {
                await window.electronAuth.saveToken(res.token, res.refreshToken);
                setUser(res.user);
                setIsDev(Boolean(res.user.is_dev));
                await refreshAccounts();
                setLoading(false);
                return;
              }
            }
          } catch { /* refresh failed */ }
        }
      } else if (creds.login && creds.password) {
        try {
          const u = await window.electronAuth.login(creds.login, creds.login, creds.password) as User;
          setUser(u);
          setIsDev(Boolean(u.is_dev));
        } catch {
          await window.electronAuth.clearCredentials();
        }
      }
      await refreshAccounts();
    }).finally(() => {
      setLoading(false);
    });
  }, [refreshAccounts]);

  const login = useCallback(async (login: string, name: string, password: string) => {
    const u = await window.electronAuth.login(login, name, password) as User;
    setUser(u);
    setIsDev(Boolean(u.is_dev));
    await refreshAccounts();
  }, [refreshAccounts]);

  const logout = useCallback(async () => {
    await window.electronAuth.logout();
    setUser(null);
    setIsDev(false);
    await refreshAccounts();
  }, [refreshAccounts]);

  const switchAccount = useCallback(async (login: string) => {
    await window.electronAuth.switchAccount(login);
    setLoading(true);
    setUser(null);
    setIsDev(false);
    const creds = await window.electronAuth.loadCredentials();
    if (creds.login && creds.password) {
      try {
        const u = await window.electronAuth.login(creds.login, creds.login, creds.password) as User;
        setUser(u);
        setIsDev(Boolean(u.is_dev));
      } catch {
        await window.electronAuth.clearCredentials();
      }
    }
    await refreshAccounts();
    setLoading(false);
  }, [refreshAccounts]);

  const removeAccount = useCallback(async (login: string) => {
    await window.electronAuth.removeAccount(login);
    const data = await window.electronAuth.listAccounts();
    if (data.accounts.length === 0) {
      setUser(null);
      setIsDev(false);
    } else if (data.activeAccount !== activeAccount) {
      await switchAccount(data.activeAccount);
    }
    await refreshAccounts();
  }, [activeAccount, switchAccount, refreshAccounts]);

  const value = useMemo(() => ({
    user, isDev, loading, login, logout, accounts, activeAccount, switchAccount, removeAccount, refreshAccounts
  }), [user, isDev, loading, login, logout, accounts, activeAccount, switchAccount, removeAccount, refreshAccounts]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
