import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';

const iconMap: Record<string, string> = {
  presets: 'dashboard',
  notes: 'edit_note',
  settings: 'settings',
};

interface SidebarItem {
  id: string;
  label: string;
}

interface SidebarProps {
  pages: SidebarItem[];
  active: string;
  onSelect: (id: string) => void;
  onLoginClick: () => void;
  onAddAccount?: () => void;
}

export default function Sidebar({
  pages, active, onSelect, onLoginClick, onAddAccount,
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
            <span className="sidebar-item-icon">
              <span className="material-symbols-outlined">{iconMap[item.id]}</span>
            </span>
            <span className="sidebar-item-label">{item.label}</span>
          </motion.button>
        ))}
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
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>delete</span>
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
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
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
