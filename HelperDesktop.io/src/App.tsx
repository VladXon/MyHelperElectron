import { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import Sidebar from './components/Sidebar';
import Titlebar from './components/Titlebar';
import AuthModal from './components/AuthModal';
import PresetEditModal from './components/PresetEditModal';
import CommandPalette from './components/CommandPalette';
import type { Preset, Note } from './types.d';

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

  const [presets, setPresets] = useState<Preset[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editPreset, setEditPreset] = useState<Preset | null | 'new'>('new');

  useEffect(() => {
    window.electronPresets.getAll().then(setPresets);
  }, []);

  useEffect(() => {
    if (user) {
      window.electronNotes.getAll().then(setNotes);
    }
  }, [user]);

  userRef.current = user;

  useEffect(() => {
    let cancelled = false;

    const autoLogin = async () => {
      if (cancelled || userRef.current) return;
      try {
        const creds = await window.electronAuth.loadCredentials();
        if (creds.login && !userRef.current) {
          await login(creds.login, creds.login, creds.password || '');
        }
      } catch { /* auto-login failed */ }
    };

    const cleanup = window.electronServer.onHealth((data) => {
      if (cancelled) return;
      serverOnlineRef.current = data.online;
      setServerOnline(data.online);
      if (data.online && wasOffline.current) {
        wasOffline.current = false;
        void autoLogin();
      } else if (!data.online) {
        wasOffline.current = true;
      }
    });

    void window.electronServer.test().then(ok => {
      if (cancelled) return;
      serverOnlineRef.current = ok;
      setServerOnline(ok);
      if (!ok) wasOffline.current = true;
      void window.electronServer.connectWs();
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [login]);

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
    void window.electronServer.test().then(ok => {
      serverOnlineRef.current = ok;
      setServerOnline(ok);
    });
  }, []);

  const handleSelectPage = useCallback((id: string) => {
    setActivePage(id);
  }, []);

  const handleLoginClick = useCallback(() => {
    setShowAuth(true);
  }, []);

  const handleCloseAuth = useCallback(() => {
    setShowAuth(false);
  }, []);

  const handleLaunchPreset = useCallback(async (id: string) => {
    const preset = presets.find(p => p.id === id);
    if (preset && preset.apps.length > 0) {
      await window.electronPresets.launch(preset.apps);
    }
  }, [presets]);

  const handleEditPreset = useCallback((id: string) => {
    const preset = presets.find(p => p.id === id);
    if (preset) setEditPreset(preset);
  }, [presets]);

  const handleAddPreset = useCallback(() => {
    setEditPreset(null);
  }, []);

  const handleSavePreset = useCallback(async (saved: Preset) => {
    await window.electronPresets.save(saved);
    setPresets(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setEditPreset('new');
  }, []);

  const handleTogglePin = useCallback(async (id: string) => {
    setPresets(prev => {
      const next = prev.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p);
      const target = next.find(p => p.id === id);
      if (target) window.electronPresets.save(target);
      return next;
    });
  }, []);

  const handleDeletePreset = useCallback(async (id: string) => {
    await window.electronPresets.delete(id);
    setPresets(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditPreset('new');
  }, []);

  const pinnedPresets = useMemo(() =>
    presets.filter(p => p.pinned).map(p => ({ id: p.id, name: p.name, icon: p.icon })),
    [presets]
  );

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
        onLoginClick={handleLoginClick}
      />
      <div className="app-body">
        <Sidebar
          pages={pages}
          active={activePage}
          onSelect={handleSelectPage}
          pinnedPresets={pinnedPresets}
          onLaunchPreset={handleLaunchPreset}
          onEditPreset={handleEditPreset}
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
        {editPreset !== 'new' && (
          <PresetEditModal
            preset={editPreset}
            onClose={handleCloseEdit}
            onSave={handleSavePreset}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCmdPalette && (
          <CommandPalette
            onClose={() => setShowCmdPalette(false)}
            onNavigate={handleSelectPage}
            pages={pages}
            notes={notes}
            presets={presets}
            onOpenNote={(noteId) => {
              setActivePage('notes');
              window.dispatchEvent(new CustomEvent('deep-link-note', { detail: noteId }));
            }}
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
