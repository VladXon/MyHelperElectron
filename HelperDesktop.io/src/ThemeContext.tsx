import { createContext, useContext, useEffect, useCallback, useState, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

const defaultColors = {
  '--bg-primary': '#0b0b12',
  '--bg-secondary': '#10101c',
  '--bg-sidebar': '#06060b',
  '--bg-sidebar-hover': '#160d2b',
  '--bg-sidebar-active': '#23143f',
  '--text-primary': '#eee6ff',
  '--text-secondary': '#a68ec4',
  '--text-muted': '#54466b',
  '--accent': '#a855f7',
  '--accent-hover': '#c084fc',
  '--border': '#191236',
};

export type ThemeColorKey = keyof typeof defaultColors;
type ThemeColors = Record<string, string>;

interface ThemeState {
  colors: ThemeColors;
  updateColor: (key: string, value: string) => void;
  resetColors: () => void;
  saveColors: () => Promise<void>;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [colors, setColors] = useState<ThemeColors>(defaultColors);

  useEffect(() => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(colors)) {
      root.style.setProperty(key, value);
    }
  }, [colors]);

  useEffect(() => {
    if (!user) return;
    window.electronSettings.getAll(user.id)
      .then(saved => {
        const themeKeys = Object.keys(defaultColors);
        const themeColors: Record<string, string> = {};
        for (const key of themeKeys) {
          if (saved[key]) {
            themeColors[key] = saved[key];
          }
        }
        if (Object.keys(themeColors).length > 0) {
          setColors(prev => ({ ...prev, ...themeColors }));
        }
      })
      .catch(err => console.error('Failed to load theme settings:', err));
  }, [user]);

  const updateColor = useCallback((key: string, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetColors = useCallback(() => {
    setColors(defaultColors);
  }, []);

  const saveColors = useCallback(async () => {
    if (!user) return;
    const themeKeys = Object.keys(defaultColors);
    const themeData: Record<string, string> = {};
    for (const key of themeKeys) {
      themeData[key] = colors[key];
    }
    await window.electronSettings.setMany(themeData, user.id);
  }, [colors, user]);

  const value = useMemo(() => ({
    colors, updateColor, resetColors, saveColors
  }), [colors, updateColor, resetColors, saveColors]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}
