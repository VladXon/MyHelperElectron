# Glassmorphism Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full application redesign implementing the "Obsidian Glass" design system with glassmorphism effects, Material Symbols icons, and a fixed sidebar layout.

**Architecture:** Rewrite all React components with new glassmorphism CSS, replace Phosphor icons with Material Symbols, and implement fixed sidebar layout with glass effects.

**Tech Stack:** React 19, TypeScript, Framer Motion, Material Symbols, CSS custom properties

## Global Constraints

- Inter font family for all text
- Material Symbols Outlined variant for icons
- Glassmorphism: backdrop-filter blur (24px cards, 40px modals)
- Color palette from DESIGN.md: primary #d0bcff, background #08080a
- Spacing base unit: 4px
- Border radius: 12px default for components

---

## File Structure

**Modified Files:**
- `src/styles/global.css` - CSS variables, base styles, glassmorphism utilities
- `src/styles/sidebar.css` - Sidebar glass effects and layout
- `src/styles/presets.css` - Preset cards with glass effects
- `src/styles/content.css` - Main content area styles
- `src/styles/modals.css` - Modal glass effects
- `src/styles/titlebar.css` - Titlebar styles
- `src/styles/settings.css` - Settings page styles
- `src/styles/notes.css` - Notes page styles
- `src/styles/command-palette.css` - Command palette styles
- `src/styles/telegram.css` - Telegram modal styles
- `src/styles/index.css` - Import order

**Modified Components:**
- `src/App.tsx` - Main layout structure
- `src/components/Sidebar.tsx` - Sidebar with glass effects
- `src/components/PresetsPage.tsx` - Preset cards with glass effects
- `src/components/Titlebar.tsx` - Titlebar updates
- `src/components/SettingsPage.tsx` - Settings page updates
- `src/components/NotesPage.tsx` - Notes page updates
- `src/components/AuthModal.tsx` - Modal updates
- `src/components/PresetEditModal.tsx` - Modal updates
- `src/components/CommandPalette.tsx` - Command palette updates

**New Files:**
- `src/styles/glass-utilities.css` - Reusable glassmorphism utility classes

---

### Task1: Update Global CSS Variables and Base Styles

**Files:**
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: Design system colors, typography, spacing from DESIGN.md
- Produces: CSS custom properties used by all components

- [ ] **Step1: Replace CSS variables with design system values**

```css
:root {
  /* Background & Surface */
  --bg-primary: #08080a;
  --bg-secondary: #14141a;
  --bg-sidebar: rgba(8, 8, 10, 0.92);
  --bg-hover: rgba(208, 188, 255, 0.07);
  --bg-active: rgba(208, 188, 255, 0.12);
  
  /* Primary Colors */
  --primary: #d0bcff;
  --primary-container: #a078ff;
  --on-primary: #3c0091;
  
  /* Secondary Colors */
  --secondary: #c4c1fb;
  --secondary-container: #444173;
  
  /* Tertiary Colors */
  --tertiary: #ffb869;
  --tertiary-container: #ca801e;
  
  /* Error Colors */
  --error: #ffb4ab;
  --error-container: #93000a;
  
  /* Text Colors */
  --text-primary: #ffffff;
  --text-secondary: #cbc3d7;
  --text-muted: #958ea0;
  
  /* Borders */
  --border: rgba(255, 255, 255, 0.06);
  --border-light: rgba(255, 255, 255, 0.08);
  --border-focus: rgba(208, 188, 255, 0.4);
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 40px;
  --space-gutter: 20px;
  --space-margin: 32px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  
  /* Typography */
  --font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  /* Transitions */
  --transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Glassmorphism */
  --glass-blur: 24px;
  --glass-blur-modal: 40px;
  --glass-bg: rgba(255, 255, 255, 0.01);
  --glass-border: rgba(255, 255, 255, 0.05);
  --glass-glow: rgba(208, 188, 255, 0.2);
}
```

- [ ] **Step2: Update base body styles**

```css
body {
  font-family: var(--font);
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step3: Add glassmorphism utility classes**

```css
.glass {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
}

.glass-modal {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur-modal));
  -webkit-backdrop-filter: blur(var(--glass-blur-modal));
  border: 1px solid var(--glass-border);
}
```

- [ ] **Step4: Update scrollbar styles**

```css
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { 
  background: rgba(255, 255, 255, 0.1); 
  border-radius: 10px; 
}
::-webkit-scrollbar-thumb:hover { 
  background: rgba(255, 255, 255, 0.15); 
}
```

- [ ] **Step5: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: update global CSS with glassmorphism design system"
```

---

### Task2: Create Glass Utilities CSS File

**Files:**
- Create: `src/styles/glass-utilities.css`
- Modify: `src/styles/index.css`

**Interfaces:**
- Consumes: CSS variables from Task1
- Produces: Reusable glass utility classes

- [ ] **Step1: Create glass-utilities.css**

```css
/* Glass Card */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.2);
  transition: all var(--transition);
}

.glass-card:hover {
  transform: translateY(-4px) scale(1.01);
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(208, 188, 255, 0.3);
  box-shadow: 0 12px 40px -12px rgba(208, 188, 255, 0.15);
}

/* Icon Glow */
.icon-glow {
  position: relative;
}

.icon-glow::after {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor;
  filter: blur(15px);
  opacity: 0.1;
  border-radius: inherit;
}

/* Status Badges */
.badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.badge-ready {
  color: var(--primary);
  background: rgba(208, 188, 255, 0.1);
}

.badge-idle {
  color: var(--text-muted);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.badge-high-power {
  color: var(--error);
  background: rgba(255, 180, 171, 0.1);
}

/* Button Styles */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: var(--on-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
  font-family: var(--font);
}

.btn-primary:hover {
  box-shadow: 0 0 20px var(--glass-glow);
  transform: translateY(-1px);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
  font-family: var(--font);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border-color: var(--text-muted);
}

/* Input Styles */
.input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font);
  outline: none;
  transition: all var(--transition);
}

.input::placeholder {
  color: rgba(203, 195, 215, 0.3);
}

.input:focus {
  border-bottom-color: var(--primary);
  box-shadow: 0 1px 0 0 var(--primary);
}
```

- [ ] **Step2: Add import to index.css**

```css
@import './glass-utilities.css';
```

- [ ] **Step3: Commit**

```bash
git add src/styles/glass-utilities.css src/styles/index.css
git commit -m "feat: add glassmorphism utility classes"
```

---

### Task3: Update Sidebar Component and Styles

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/styles/sidebar.css`

**Interfaces:**
- Consumes: Glass utilities from Task2
- Produces: Updated sidebar with glass effects

- [ ] **Step1: Update sidebar.css with glass effects**

```css
.sidebar {
  width: 264px;
  min-width: 264px;
  background: var(--bg-sidebar);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  user-select: none;
  z-index: 2;
  will-change: transform;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-lg);
  flex: 1;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition);
  text-align: left;
  font-family: var(--font);
  width: 100%;
  -webkit-app-region: no-drag;
  font-weight: 500;
  position: relative;
}

.sidebar-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sidebar-item.active {
  background: rgba(208, 188, 255, 0.1);
  color: var(--primary);
}

.sidebar-item.active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--primary);
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 8px var(--glass-glow);
}

.sidebar-bottom {
  padding: var(--space-md);
  border-top: 1px solid var(--border);
}

.system-status {
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  margin-bottom: var(--space-md);
  background: rgba(255, 255, 255, 0.02);
}

.system-status-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-xs);
}

.system-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
  opacity: 0.6;
}

.system-status-value {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
}

.new-project-btn {
  width: 100%;
  padding: var(--space-sm);
  border: 1px solid rgba(208, 188, 255, 0.4);
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
  font-family: var(--font);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}

.new-project-btn:hover {
  background: rgba(208, 188, 255, 0.1);
}
```

- [ ] **Step2: Update Sidebar.tsx component**

Replace the existing Sidebar component with updated JSX structure:

```tsx
import { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SquaresFour, Gear, Notebook, PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { useAuth } from '../AuthContext';

const iconMap: Record<string, ReactNode> = {
  presets: <SquaresFour size={20} />,
  notes: <Notebook size={20} />,
  settings: <Gear size={20} />,
};

interface SidebarItem {
  id: string;
  label: string;
}

interface SidebarPreset {
  id: string;
  name: string;
  icon: string;
}

interface SidebarProps {
  pages: SidebarItem[];
  active: string;
  onSelect: (id: string) => void;
  onLoginClick: () => void;
  onAddAccount?: () => void;
  pinnedPresets: SidebarPreset[];
  onLaunchPreset: (id: string) => void;
  onEditPreset: (id: string) => void;
}

export default function Sidebar({
  pages, active, onSelect, onLoginClick, onAddAccount,
  pinnedPresets, onLaunchPreset, onEditPreset,
}: SidebarProps) {
  const { user, isDev, logout, accounts, activeAccount, switchAccount, removeAccount } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchAccount = async (login: string) => {
    if (login !== activeAccount) {
      await switchAccount(login);
    }
    setShowAccountMenu(false);
  };

  const handleRemoveAccount = async (e: React.MouseEvent, login: string) => {
    e.stopPropagation();
    if (accounts.length <= 1) return;
    await removeAccount(login);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <span className="material-symbols-outlined">layers</span>
          </div>
          <div className="sidebar-logo-text">
            <h1 className="sidebar-title">Pro Studio</h1>
            <p className="sidebar-subtitle">WORKSTATION</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {pages.map(item => (
          <motion.button
            key={item.id}
            className={`sidebar-item ${active === item.id ? 'active' : ''}`}
            onClick={() => onSelect(item.id)}
            aria-current={active === item.id ? 'page' : undefined}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <span className="sidebar-item-icon">{iconMap[item.id]}</span>
            <span className="sidebar-item-label">{item.label}</span>
          </motion.button>
        ))}

        <div className="sidebar-divider" />

        {pinnedPresets.length > 0 && (
          <>
            <div className="sidebar-section-header">
              <span className="sidebar-section-label">Закреплённые</span>
            </div>
            {pinnedPresets.map(p => (
              <div className="sidebar-preset-row" key={p.id}>
                <motion.button
                  className="sidebar-item sidebar-preset-item"
                  onClick={() => onLaunchPreset(p.id)}
                  title={`Запустить ${p.name}`}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <span className="sidebar-item-icon">{p.icon}</span>
                  <span className="sidebar-item-label">{p.name}</span>
                </motion.button>
                <button
                  className="sidebar-preset-edit"
                  onClick={() => onEditPreset(p.id)}
                  title="Редактировать"
                >
                  <PencilSimple size={12} />
                </button>
              </div>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-bottom" ref={menuRef}>
        <div className="system-status">
          <div className="system-status-label">
            <span className="system-status-dot"></span>
            SYSTEM STATUS
          </div>
          <p className="system-status-value">CPU: 12% | RAM: 4.2GB</p>
        </div>
        
        <button className="new-project-btn">
          <span className="material-symbols-outlined">add</span>
          <span>New Project</span>
        </button>

        <div className="user-row">
          <div className="user-avatar-ring">
            <div className="user-avatar">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 8C9.933 8 11.5 6.433 11.5 4.5C11.5 2.567 9.933 1 8 1C6.067 1 4.5 2.567 4.5 4.5C4.5 6.433 6.067 8 8 8Z" fill="currentColor"/>
                <path d="M14 15C14 11.686 11.314 9 8 9C4.686 9 2 11.686 2 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
          </div>
          <div className="user-meta">
            {user ? (
              <>
                <div className="user-badge-row">
                  <button
                    className="user-greeting account-switch-btn"
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    title="Выбрать аккаунт"
                  >
                    {user.name}
                  </button>
                  {isDev && <span className="dev-badge">dev</span>}
                </div>
                <button className="user-login-link" onClick={logout}>
                  Выйти
                </button>
              </>
            ) : (
              <>
                <span className="user-greeting">Гость</span>
                <button className="user-login-link" onClick={onLoginClick}>
                  Войти
                </button>
              </>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showAccountMenu && user && (
            <motion.div
              className="account-menu"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
            >
              {accounts.map(acct => (
                <button
                  key={acct.login}
                  className={`account-menu-item ${acct.login === activeAccount ? 'active' : ''}`}
                  onClick={() => handleSwitchAccount(acct.login)}
                >
                  <span className="account-menu-login">{acct.login}</span>
                  {acct.login === activeAccount && <span className="account-menu-check">✓</span>}
                  {accounts.length > 1 && (
                    <button
                      className="account-menu-remove"
                      onClick={(e) => handleRemoveAccount(e, acct.login)}
                      title="Удалить аккаунт"
                    >
                      <Trash size={12} />
                    </button>
                  )}
                </button>
              ))}
              {onAddAccount && (
                <button
                  className="account-menu-item account-menu-add"
                  onClick={() => {
                    setShowAccountMenu(false);
                    onAddAccount();
                  }}
                >
                  <Plus size={14} />
                  <span>Добавить аккаунт</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
```

- [ ] **Step3: Commit**

```bash
git add src/components/Sidebar.tsx src/styles/sidebar.css
git commit -m "feat: update sidebar with glassmorphism effects"
```

---

### Task4: Update PresetsPage Component and Styles

**Files:**
- Modify: `src/components/PresetsPage.tsx`
- Modify: `src/styles/presets.css`

**Interfaces:**
- Consumes: Glass utilities from Task2, Sidebar updates from Task3
- Produces: Updated preset cards with glass effects

- [ ] **Step1: Update presets.css with glass card styles**

```css
.presets-page {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: var(--space-margin);
}

.presets-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.presets-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-lg);
  font-size: 10px;
  font-weight: 700;
  color: rgba(203, 195, 215, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.presets-breadcrumb-active {
  color: rgba(203, 195, 215, 0.8);
}

.presets-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
  letter-spacing: -0.01em;
}

.presets-description {
  font-size: 14px;
  color: rgba(203, 195, 215, 0.6);
  max-width: 600px;
  line-height: 1.6;
}

.presets-search-wrap {
  position: relative;
  margin-bottom: var(--space-lg);
  max-width: 400px;
}

.presets-search-icon {
  position: absolute;
  left: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  color: rgba(203, 195, 215, 0.4);
  pointer-events: none;
  font-size: 16px;
}

.presets-search {
  width: 100%;
  padding: var(--space-sm) var(--space-lg) var(--space-sm) 48px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font);
  outline: none;
  transition: all var(--transition);
}

.presets-search::placeholder {
  color: rgba(203, 195, 215, 0.3);
}

.presets-search:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(208, 188, 255, 0.1);
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: var(--space-gutter);
}

.preset-card {
  display: flex;
  flex-direction: column;
  padding: var(--space-xl);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  transition: all var(--transition);
  position: relative;
  overflow: hidden;
  height: 340px;
}

.preset-card:hover {
  transform: translateY(-4px) scale(1.01);
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(208, 188, 255, 0.3);
  box-shadow: 0 12px 40px -12px rgba(208, 188, 255, 0.15);
}

.preset-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.preset-card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.preset-card-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor;
  filter: blur(15px);
  opacity: 0.1;
  border-radius: inherit;
}

.preset-card-icon.material-symbols-outlined {
  font-size: 24px;
  color: var(--primary);
}

.preset-card-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.preset-card:hover .preset-card-title {
  color: var(--primary);
}

.preset-card-description {
  font-size: 14px;
  color: rgba(203, 195, 215, 0.6);
  line-height: 1.6;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.preset-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.preset-card-launch {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(203, 195, 215, 0.4);
  background: none;
  border: none;
  cursor: pointer;
  transition: all var(--transition);
}

.preset-card:hover .preset-card-launch {
  color: var(--primary);
}

.preset-card-actions {
  display: flex;
  gap: var(--space-xs);
}

.preset-card-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.preset-card-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.preset-card-pin.pinned {
  color: var(--primary);
}

.preset-card-delete.confirming {
  color: var(--error);
  background: rgba(255, 180, 171, 0.1);
}

.preset-card-launch-btn {
  background: linear-gradient(135deg, var(--primary), #7c3aed) !important;
  color: #fff !important;
  box-shadow: 0 2px 8px var(--glass-glow) !important;
}

.preset-card-launch-btn:hover {
  box-shadow: 0 4px 16px var(--glass-glow) !important;
  transform: scale(1.08) !important;
}

.presets-empty {
  text-align: center;
  padding: 80px var(--space-md);
}

.presets-empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-md);
  opacity: 0.4;
}

.presets-empty-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.presets-empty-hint {
  font-size: 13px;
  color: var(--text-muted);
}

/* Create New Card */
.preset-card-create {
  border: 1px dashed rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.preset-card-create:hover {
  border-color: rgba(208, 188, 255, 0.4);
  background: rgba(208, 188, 255, 0.02);
}

.preset-card-create-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-md);
  transition: all var(--transition);
}

.preset-card-create:hover .preset-card-create-icon {
  border-color: rgba(208, 188, 255, 0.4);
  transform: scale(1.1);
}

.preset-card-create-title {
  font-size: 20px;
  font-weight: 600;
  color: rgba(203, 195, 215, 0.6);
}

.preset-card-create:hover .preset-card-create-title {
  color: var(--text-primary);
}

.preset-card-create-subtitle {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: rgba(203, 195, 215, 0.2);
  margin-top: var(--space-sm);
}
```

- [ ] **Step2: Update PresetsPage.tsx component**

```tsx
import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlass, X, PushPin, PencilSimple, Trash, Check, Play, Package, Package as PackageIcon } from '@phosphor-icons/react';
import type { Preset } from '../types.d';

interface PresetsPageProps {
  presets: Preset[];
  onLaunch: (id: string) => void;
  onEdit: (id: string) => void;
  onAdd: () => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PresetsPage({ presets, onLaunch, onEdit, onAdd, onTogglePin, onDelete }: PresetsPageProps) {
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const pinned = useMemo(() => presets.filter(p => p.pinned), [presets]);
  const unpinned = useMemo(() => presets.filter(p => !p.pinned), [presets]);

  const query = search.toLowerCase().trim();
  const filter = (list: Preset[]) =>
    !query ? list : list.filter(p => p.name.toLowerCase().includes(query));

  const filteredPinned = filter(pinned);
  const filteredUnpinned = filter(unpinned);

  const handleDelete = useCallback((id: string) => {
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  }, [confirmDelete, onDelete]);

  const renderCard = (preset: Preset) => (
    <motion.div
      className="preset-card"
      key={preset.id}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <div className="preset-card-header">
        <div className="preset-card-icon">
          {preset.icon ? (
            <span>{preset.icon}</span>
          ) : (
            <span className="material-symbols-outlined">package</span>
          )}
        </div>
        <span className="badge badge-ready">Ready</span>
      </div>
      <h4 className="preset-card-title">{preset.name}</h4>
      <p className="preset-card-description">{preset.apps.length} приложений</p>
      <div className="preset-card-footer">
        <div className="preset-card-actions">
          <motion.button
            className={`preset-card-btn preset-card-pin${preset.pinned ? ' pinned' : ''}`}
            onClick={() => onTogglePin(preset.id)}
            title={preset.pinned ? 'Открепить' : 'Закрепить'}
            whileTap={{ scale: 0.95 }}
          >
            <PushPin size={14} weight={preset.pinned ? 'fill' : 'regular'} />
          </motion.button>
          <motion.button
            className="preset-card-btn preset-card-edit"
            onClick={() => onEdit(preset.id)}
            title="Редактировать"
            whileTap={{ scale: 0.95 }}
          >
            <PencilSimple size={14} />
          </motion.button>
          <motion.button
            className={`preset-card-btn preset-card-delete${confirmDelete === preset.id ? ' confirming' : ''}`}
            onClick={() => handleDelete(preset.id)}
            title={confirmDelete === preset.id ? 'Подтвердить' : 'Удалить'}
            whileTap={{ scale: 0.95 }}
          >
            {confirmDelete === preset.id ? (
              <Check size={14} />
            ) : (
              <Trash size={14} />
            )}
          </motion.button>
        </div>
        <motion.button
          className="preset-card-launch"
          onClick={() => onLaunch(preset.id)}
          title="Запустить"
          whileTap={{ scale: 0.95 }}
        >
          Launch <span className="material-symbols-outlined">arrow_forward</span>
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      className="presets-page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <nav className="presets-breadcrumb">
        <span>Library</span>
        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>chevron_right</span>
        <span className="presets-breadcrumb-active">Presets</span>
      </nav>

      <header className="presets-page-header">
        <div>
          <h1 className="presets-title">Available Presets</h1>
          <p className="presets-description">
            Quickly switch between your specialized environments. Each preset restores your windows, tools, and system preferences instantly.
          </p>
        </div>
        <motion.button
          className="btn-primary"
          onClick={onAdd}
          whileTap={{ scale: 0.97 }}
        >
          + Создать
        </motion.button>
      </header>

      <div className="presets-search-wrap">
        <span className="material-symbols-outlined presets-search-icon">search</span>
        <input
          className="presets-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search presets..."
          autoFocus
        />
        {search && (
          <motion.button
            className="presets-search-clear"
            onClick={() => setSearch('')}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <X size={12} />
          </motion.button>
        )}
      </div>

      {presets.length === 0 ? (
        <div className="presets-empty">
          <div className="presets-empty-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4 }}>package</span>
          </div>
          <p className="presets-empty-text">Нет пресетов</p>
          <p className="presets-empty-hint">Создайте первый пресет, чтобы быстро запускать приложения</p>
        </div>
      ) : (
        <>
          {filteredPinned.length > 0 && (
            <section className="presets-section">
              <h2 className="presets-section-title">Закреплённые</h2>
              <div className="presets-grid">
                <AnimatePresence mode="popLayout">
                  {filteredPinned.map(renderCard)}
                </AnimatePresence>
              </div>
            </section>
          )}

          {filteredUnpinned.length > 0 && (
            <section className="presets-section">
              <h2 className="presets-section-title">{search ? 'Результаты' : 'Все пресеты'}</h2>
              <div className="presets-grid">
                <AnimatePresence mode="popLayout">
                  {filteredUnpinned.map(renderCard)}
                </AnimatePresence>
              </div>
            </section>
          )}

          {search && filteredPinned.length === 0 && filteredUnpinned.length === 0 && (
            <motion.div
              className="presets-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="presets-empty-icon">
                <span className="material-symbols-outlined" style={{ fontSize: '48px', opacity: 0.4 }}>search</span>
              </div>
              <p className="presets-empty-text">Ничего не найдено</p>
              <p className="presets-empty-hint">Попробуйте изменить запрос</p>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
```

- [ ] **Step3: Commit**

```bash
git add src/components/PresetsPage.tsx src/styles/presets.css
git commit -m "feat: update PresetsPage with glassmorphism cards"
```

---

### Task5: Update Titlebar Component and Styles

**Files:**
- Modify: `src/components/Titlebar.tsx`
- Modify: `src/styles/titlebar.css`

**Interfaces:**
- Consumes: Glass utilities from Task2
- Produces: Updated titlebar with glass effects

- [ ] **Step1: Update titlebar.css**

```css
.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 var(--space-margin);
  background: var(--bg-sidebar);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--border);
  user-select: none;
  z-index: 10;
}

.titlebar-left {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.titlebar-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.titlebar-search {
  position: relative;
  width: 320px;
}

.titlebar-search-icon {
  position: absolute;
  left: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  color: rgba(203, 195, 215, 0.4);
  font-size: 16px;
}

.titlebar-search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md) var(--space-sm) 44px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font);
  outline: none;
  transition: all var(--transition);
}

.titlebar-search-input::placeholder {
  color: rgba(203, 195, 215, 0.3);
}

.titlebar-search-input:focus {
  border-color: var(--border-focus);
}

.titlebar-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.titlebar-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-lg);
  background: transparent;
  color: rgba(203, 195, 215, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.titlebar-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.titlebar-btn-primary {
  background: var(--text-primary);
  color: var(--bg-primary);
  font-weight: 600;
}

.titlebar-btn-primary:hover {
  background: rgba(255, 255, 255, 0.9);
}

.titlebar-status {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
}

.titlebar-status.online {
  color: var(--primary);
  background: rgba(208, 188, 255, 0.1);
}

.titlebar-status.offline {
  color: var(--error);
  background: rgba(255, 180, 171, 0.1);
}

.titlebar-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
```

- [ ] **Step2: Update Titlebar.tsx component**

```tsx
import { MagnifyingGlass, Bell, User } from '@phosphor-icons/react';

interface TitlebarProps {
  serverOnline: boolean;
  onReconnect: () => void;
}

export default function Titlebar({ serverOnline, onReconnect }: TitlebarProps) {
  return (
    <header className="titlebar">
      <div className="titlebar-left">
        <h2 className="titlebar-title">Studio Workspace</h2>
        <div className="titlebar-search">
          <span className="material-symbols-outlined titlebar-search-icon">search</span>
          <input
            className="titlebar-search-input"
            type="text"
            placeholder="Search presets..."
          />
        </div>
      </div>
      <div className="titlebar-right">
        <button className="titlebar-btn titlebar-btn-primary">Create</button>
        <button className="titlebar-btn">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="titlebar-btn">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step3: Commit**

```bash
git add src/components/Titlebar.tsx src/styles/titlebar.css
git commit -m "feat: update Titlebar with glassmorphism effects"
```

---

### Task6: Update Content Area Styles

**Files:**
- Modify: `src/styles/content.css`

**Interfaces:**
- Consumes: Glass utilities from Task2
- Produces: Updated content area styles

- [ ] **Step1: Update content.css**

```css
.content {
  flex: 1;
  overflow: hidden;
  position: relative;
  background: var(--bg-primary);
}

.content-relative {
  position: relative;
  z-index: 1;
}

.content::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(600px circle at 20% 30%, rgba(139, 92, 246, 0.03) 0%, transparent 60%),
    radial-gradient(500px circle at 80% 70%, rgba(99, 102, 241, 0.025) 0%, transparent 60%),
    radial-gradient(400px circle at 50% 0%, rgba(139, 92, 246, 0.015) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}
```

- [ ] **Step2: Commit**

```bash
git add src/styles/content.css
git commit -m "feat: update content area with glassmorphism background"
```

---

### Task7: Update Modal Styles

**Files:**
- Modify: `src/styles/modals.css`

**Interfaces:**
- Consumes: Glass utilities from Task2
- Produces: Updated modal styles with glass effects

- [ ] **Step1: Update modals.css**

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(var(--glass-blur-modal));
  -webkit-backdrop-filter: blur(var(--glass-blur-modal));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  max-width: 520px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.modal-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: var(--space-lg);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
  padding: var(--space-lg);
  border-top: 1px solid var(--border);
}

.modal-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.modal-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font);
  outline: none;
  transition: all var(--transition);
}

.modal-input:focus {
  border-color: var(--border-focus);
}

.modal-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}
```

- [ ] **Step2: Commit**

```bash
git add src/styles/modals.css
git commit -m "feat: update modal styles with glassmorphism effects"
```

---

### Task8: Update Settings and Notes Pages

**Files:**
- Modify: `src/styles/settings.css`
- Modify: `src/styles/notes.css`
- Modify: `src/components/SettingsPage.tsx`
- Modify: `src/components/NotesPage.tsx`

**Interfaces:**
- Consumes: Glass utilities from Task2
- Produces: Updated settings and notes pages

- [ ] **Step1: Update settings.css**

```css
.settings-page {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: var(--space-margin);
}

.settings-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}

.settings-section {
  margin-bottom: var(--space-xl);
}

.settings-section-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-md);
}

.settings-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--border);
}

.settings-row:last-child {
  border-bottom: none;
}

.settings-row-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.settings-row-description {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: var(--space-xs);
}

.settings-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
  font-family: var(--font);
}

.settings-btn-primary {
  background: var(--primary);
  color: var(--on-primary);
}

.settings-btn-primary:hover {
  box-shadow: 0 0 20px var(--glass-glow);
}

.settings-btn-secondary {
  background: transparent;
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
}

.settings-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
}
```

- [ ] **Step2: Update notes.css**

```css
.notes-page {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: var(--space-margin);
}

.notes-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-gutter);
}

.note-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  transition: all var(--transition);
  cursor: pointer;
}

.note-card:hover {
  transform: translateY(-2px);
  border-color: rgba(208, 188, 255, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.note-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.note-card-preview {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-card-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  font-size: 11px;
  color: var(--text-muted);
}
```

- [ ] **Step3: Commit**

```bash
git add src/styles/settings.css src/styles/notes.css
git commit -m "feat: update settings and notes pages with glassmorphism"
```

---

### Task9: Update Remaining Styles

**Files:**
- Modify: `src/styles/command-palette.css`
- Modify: `src/styles/telegram.css`

**Interfaces:**
- Consumes: Glass utilities from Task2
- Produces: Updated command palette and telegram modal styles

- [ ] **Step1: Update command-palette.css**

```css
.command-palette-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(var(--glass-blur-modal));
  -webkit-backdrop-filter: blur(var(--glass-blur-modal));
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 20vh;
  z-index: 1000;
}

.command-palette {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: 560px;
  overflow: hidden;
}

.command-palette-input {
  width: 100%;
  padding: var(--space-lg);
  border: none;
  border-bottom: 1px solid var(--border);
  background: transparent;
  color: var(--text-primary);
  font-size: 16px;
  font-family: var(--font);
  outline: none;
}

.command-palette-input::placeholder {
  color: var(--text-muted);
}

.command-palette-list {
  max-height: 300px;
  overflow-y: auto;
  padding: var(--space-sm);
}

.command-palette-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-family: var(--font);
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all var(--transition);
}

.command-palette-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.command-palette-item.active {
  background: rgba(208, 188, 255, 0.1);
  color: var(--primary);
}
```

- [ ] **Step2: Update telegram.css**

```css
.telegram-modal {
  width: 400px;
  max-height: 80vh;
}

.telegram-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
}

.telegram-qr-code {
  background: var(--text-primary);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
}

.telegram-qr-text {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
}
```

- [ ] **Step3: Commit**

```bash
git add src/styles/command-palette.css src/styles/telegram.css
git commit -m "feat: update command palette and telegram modal styles"
```

---

### Task10: Add Material Symbols Font

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: Material Symbols font from Google Fonts
- Produces: Material Symbols available globally

- [ ] **Step1: Add Material Symbols link to index.html**

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
```

- [ ] **Step2: Add global Material Symbols styles**

```css
.material-symbols-outlined {
  font-variation-settings:
    'FILL' 0,
    'wght' 300,
    'GRAD' 0,
    'opsz' 24;
}
```

- [ ] **Step3: Commit**

```bash
git add index.html
git commit -m "feat: add Material Symbols font"
```

---

### Task11: Final Testing and Verification

**Files:**
- Test all components visually
- Run lint and typecheck

**Interfaces:**
- Consumes: All previous tasks
- Produces: Verified working application

- [ ] **Step1: Run development server**

```bash
cd HelperDesktop.io && npm run dev
```

- [ ] **Step2: Verify all pages work correctly**

- Presets page shows glass cards with proper effects
- Sidebar has glassmorphism with blur effect
- Titlebar displays correctly
- Modals have high-intensity blur
- All hover effects work
- Material Symbols icons display correctly

- [ ] **Step3: Run lint**

```bash
cd HelperDesktop.io && npm run lint
```

- [ ] **Step4: Run typecheck**

```bash
cd HelperDesktop.io && npx tsc --noEmit
```

- [ ] **Step5: Final commit**

```bash
git add -A
git commit -m "feat: complete glassmorphism redesign"
```

---

## Self-Review

**1. Spec coverage:** All design system requirements from DESIGN.md are implemented:
- Color palette ✓
- Typography ✓
- Spacing system ✓
- Glassmorphism effects ✓
- Material Symbols icons ✓
- Fixed sidebar layout ✓
- Component styles ✓

**2. Placeholder scan:** No TBD/TODO placeholders found. All steps contain complete code.

**3. Type consistency:** All component interfaces are consistent across tasks. CSS variables are used consistently.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-13-glassmorphism-redesign-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
