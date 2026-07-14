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