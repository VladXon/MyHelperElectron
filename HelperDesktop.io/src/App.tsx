import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import Sidebar from './components/Sidebar';
import Titlebar from './components/Titlebar';
import AuthModal from './components/AuthModal';
import CommandPalette from './components/CommandPalette';

const SettingsPage = lazy(() => import('./components/SettingsPage'));
const PresetsPage = lazy(() => import('./components/PresetsPage'));
const NotesPage = lazy(() => import('./components/NotesPage'));

const pages = [
  { id: 'presets', label: 'Пресеты' },
  { id: 'notes', label: 'Заметки' },
  { id: 'settings', label: 'Настройки' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pageComponents: Record<string, any> = {
  presets: PresetsPage,
  notes: NotesPage,
  settings: SettingsPage,
};

function AppContent() {
  const [activePage, setActivePage] = useState('settings');
  const [showAuth, setShowAuth] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const { loading, user, login } = useAuth();
  const serverOnlineRef = useRef(true);
  const userRef = useRef(user);
  const wasOffline = useRef(false);

  userRef.current = user;

  const handleHealthEvent = useCallback((data: { online: boolean }) => {
    const wasOnline = serverOnlineRef.current;
    if (data.online && !wasOnline) {
      serverOnlineRef.current = true;
      setServerOnline(true);
      if (wasOffline.current) {
        wasOffline.current = false;
        (async () => {
          const creds = await window.electronAuth.loadCredentials();
          if (creds.login && !userRef.current) {
            try {
              await login(creds.login, creds.login, creds.password || '');
            } catch { /* auto-login failed */ }
          }
        })();
      }
    } else if (!data.online && wasOnline) {
      serverOnlineRef.current = false;
      setServerOnline(false);
      wasOffline.current = true;
    }
  }, [login]);

  useEffect(() => {
    let cancelled = false;
    let pollingTimer: ReturnType<typeof setInterval> | null = null;

    const checkServer = async () => {
      if (cancelled) return;
      try {
        const ok = await window.electronServer.test();
        handleHealthEvent({ online: ok });
      } catch {
        handleHealthEvent({ online: false });
      }
    };

    const cleanup = window.electronServer.onHealth((data) => {
      if (cancelled) return;
      serverOnlineRef.current = data.online;
      setServerOnline(data.online);
      if (data.online && wasOffline.current) {
        wasOffline.current = false;
        (async () => {
          const creds = await window.electronAuth.loadCredentials();
          if (creds.login && !userRef.current) {
            try {
              await login(creds.login, creds.login, creds.password || '');
            } catch { /* auto-login failed */ }
          }
        })();
      } else if (!data.online) {
        wasOffline.current = true;
      }
    });

    checkServer().then(() => {
      void window.electronServer.connectWs();
    });

    pollingTimer = setInterval(checkServer, 30000);

    return () => {
      cancelled = true;
      cleanup();
      if (pollingTimer) clearInterval(pollingTimer);
    };
  }, [login, handleHealthEvent]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCmdPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const unsubscribe = (window as any).electronDeepLink?.onNote((noteId: number) => {
      setActivePage('notes');
      window.dispatchEvent(new CustomEvent('deep-link-note', { detail: noteId }));
    });
    return () => unsubscribe?.();
  }, []);

  const handleReconnect = useCallback(() => {
    void window.electronServer.connectWs();
    window.electronServer.test().then(ok => {
      serverOnlineRef.current = ok;
      setServerOnline(ok);
      if (ok && wasOffline.current) {
        wasOffline.current = false;
        (async () => {
          const creds = await window.electronAuth.loadCredentials();
          if (creds.login && !userRef.current) {
            try {
              await login(creds.login, creds.login, creds.password || '');
            } catch { /* auto-login failed */ }
          }
        })();
      }
    });
  }, [login]);

  const handleSelectPage = useCallback((id: string) => {
    setActivePage(id);
  }, []);

  const handleLoginClick = useCallback(() => {
    setShowAuth(true);
  }, []);

  const handleAddAccount = useCallback(() => {
    setShowAuth(true);
  }, []);

  const handleCloseAuth = useCallback(() => {
    setShowAuth(false);
  }, []);

  const PageComponent = pageComponents[activePage];

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Подключение...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    if (activePage === 'presets') {
      return (
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="loading-spinner" /></div>}>
          <PresetsPage key="presets" />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="loading-spinner" /></div>}>
        {PageComponent ? <PageComponent key={activePage} /> : <SettingsPage key="settings" />}
      </Suspense>
    );
  };

  return (
    <div className="app">
      <Titlebar
        serverOnline={serverOnline}
        onReconnect={handleReconnect}
      />
      <div className="app-body">
        <Sidebar
          pages={pages}
          active={activePage}
          onSelect={handleSelectPage}
          onLoginClick={handleLoginClick}
          onAddAccount={handleAddAccount}
        />
        <main className="content content-relative">
          <AnimatePresence>
            {renderPage()}
          </AnimatePresence>
        </main>
      </div>
      <AnimatePresence>
        {showAuth && <AuthModal onClose={handleCloseAuth} />}
      </AnimatePresence>
      <AnimatePresence>
        {showCmdPalette && (
          <CommandPalette
            onClose={() => setShowCmdPalette(false)}
            onNavigate={handleSelectPage}
            pages={pages}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
