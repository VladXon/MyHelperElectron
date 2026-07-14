import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CaretRight, Check, ArrowRight, Link, LinkBreak, User, TelegramLogo, Palette, HardDrives } from '@phosphor-icons/react';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import TelegramModal from './TelegramModal';
import Modal, { ModalClose, ModalHeader } from './Modal';
import type { ThemeColorKey } from '../ThemeContext';

const colorLabels: Record<ThemeColorKey, string> = {
  '--bg-primary': 'Основной фон',
  '--bg-secondary': 'Вторичный фон',
  '--bg-sidebar': 'Фон сайдбара',
  '--bg-sidebar-hover': 'Ховер сайдбара',
  '--bg-sidebar-active': 'Активный пункт',
  '--text-primary': 'Основной текст',
  '--text-secondary': 'Вторичный текст',
  '--text-muted': 'Приглушённый текст',
  '--accent': 'Акцентный цвет',
  '--accent-hover': 'Акцент (ховер)',
  '--border': 'Цвет границ',
};

type SectionId = 'account' | 'telegram' | 'appearance' | 'server';

function PasswordModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 3) {
      setError('Пароль должен быть минимум 3 символа');
      return;
    }

    setLoading(true);
    setError(null);

    const login = user?.login;
    if (!login) { setError('Пользователь не найден'); return; }
    try {
      await window.electronAuth.changePassword(login, currentPassword, newPassword);
      await window.electronAuth.saveCredentials(login, newPassword);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch {
      setError('Ошибка. Проверьте текущий пароль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} size="sm">
      <ModalClose onClick={onClose} disabled={loading} />
      <ModalHeader
        icon={<Lock size={22} />}
        title="Смена пароля"
        subtitle={user?.login}
      />

      {success ? (
        <motion.div className="success-message" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Check size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Пароль изменён
        </motion.div>
      ) : (
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-field">
            <label className="modal-label">Текущий пароль</label>
            <input className="modal-input" type="password" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoFocus disabled={loading} />
          </div>
          <div className="modal-field">
            <label className="modal-label">Новый пароль</label>
            <input className="modal-input" type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={loading} />
          </div>
          <div className="modal-field">
            <label className="modal-label">Подтвердите пароль</label>
            <input className="modal-input" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading} />
          </div>
          <div className="modal-error-area">
            {error ? <p className="modal-error">{error}</p> : null}
          </div>
          <button className="modal-submit" type="submit" disabled={loading}>
            {loading ? 'Сохранение...' : 'Изменить пароль'}
          </button>
        </form>
      )}
    </Modal>
  );
}

function ServerCommands() {
  const [cmd, setCmd] = useState('');
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const outputRef = useRef(outputLines);
  outputRef.current = outputLines;

  const handleSend = useCallback(async () => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setSending(true);
    const prev = outputRef.current;
    const result = [...prev, `> ${trimmed}`];

    try {
      const res = await window.electronServer.api('POST', '/api/command', { command: trimmed }) as { output: string };
      result.push(res.output);
    } catch (e: unknown) {
      result.push(`Error: ${(e as Error).message || e}`);
    }

    setOutputLines(result);
    setCmd('');
    setSending(false);
  }, [cmd]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <>
      <div className="cmd-row">
        <span className="cmd-prefix">$</span>
        <input
          className="cmd-input"
          type="text"
          value={cmd}
          onChange={e => setCmd(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="/serverinfo"
          disabled={sending}
        />
        <motion.button className="settings-btn settings-btn-primary" onClick={handleSend} disabled={sending || !cmd.trim()} whileTap={{ scale: 0.97 }}>
          {sending ? '...' : <ArrowRight size={16} />}
        </motion.button>
      </div>
      {outputLines.length > 0 && (
        <motion.div className="cmd-output" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          {outputLines.map((line, i) => (
            <pre key={i} className={`cmd-line${line.startsWith('>') ? ' cmd-prompt' : ''}`}>{line}</pre>
          ))}
        </motion.div>
      )}
    </>
  );
}

function Section({
  id, label, badge, icon: Icon, expanded, onToggle, children,
}: {
  id: SectionId; label: string; badge?: string; icon: React.ComponentType<{ size?: number }>; expanded: boolean; onToggle: (id: SectionId) => void; children: React.ReactNode;
}) {
  return (
    <div className={`accordion-section${expanded ? ' expanded' : ''}`}>
      <button className="accordion-header" onClick={() => onToggle(id)}>
        <div className="accordion-header-left">
          <span className="accordion-header-icon"><Icon size={16} /></span>
          <span>{label}</span>
          {badge && <span className="dev-badge settings-dev-badge">{badge}</span>}
        </div>
        <CaretRight size={16} className="accordion-chevron" />
      </button>
      <div className="accordion-body-wrapper">
        <div className="accordion-body">{children}</div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { colors, updateColor, saveColors, resetColors } = useTheme();
  const { user, isDev } = useAuth();
  const [expanded, setExpanded] = useState<Set<SectionId>>(new Set());
  const [saved, setSaved] = useState(false);
  const [colorError, setColorError] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [serverStatus, setServerStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);

  useEffect(() => {
    window.electronServer.getUrl().then(setServerUrl);
    if (user) setEmail(user.email);
  }, [user]);

  useEffect(() => {
    if (user) {
      checkTelegramStatus();
    }
  }, [user]);

  const checkTelegramStatus = useCallback(async () => {
    setTelegramLoading(true);
    try {
      const status = await window.electronTelegram.status();
      setTelegramLinked(status.linked);
      setTelegramId(status.telegramId || null);
    } catch {
      setTelegramLinked(false);
    } finally {
      setTelegramLoading(false);
    }
  }, []);

  const handleUnlink = useCallback(async () => {
    setTelegramLoading(true);
    try {
      await window.electronTelegram.unlink();
      setTelegramLinked(false);
      setTelegramId(null);
    } catch { /* empty */ } finally {
      setTelegramLoading(false);
    }
  }, []);

  const handleTelegramLinked = useCallback(() => {
    setShowTelegramModal(false);
    checkTelegramStatus();
  }, [checkTelegramStatus]);

  const toggleSection = useCallback((id: SectionId) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSaveColors = useCallback(async () => {
    try {
      setColorError(null);
      await saveColors();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setColorError('Не удалось сохранить настройки');
    }
  }, [saveColors]);

  const handleResetColors = useCallback(() => resetColors(), [resetColors]);

  const handleTestConnection = useCallback(async () => {
    setServerStatus('testing');
    const ok = await window.electronServer.test();
    setServerStatus(ok ? 'ok' : 'error');
    setTimeout(() => setServerStatus('idle'), 3000);
  }, []);

  const handleSaveServerUrl = useCallback(async () => {
    await window.electronServer.setUrl(serverUrl);
    setServerStatus('ok');
    setTimeout(() => setServerStatus('idle'), 2000);
  }, [serverUrl]);

  const handleSaveEmail = useCallback(async () => {
    if (!user || !email.trim() || !emailPassword) return;
    setEmailLoading(true);
    setEmailStatus(null);
    try {
      const updated = await window.electronAuth.setEmail(user.login, email.trim(), emailPassword);
      setEmail(updated.email);
      setEmailPassword('');
      setEmailStatus('Email сохранён');
    } catch {
      setEmailStatus('Ошибка: неверный пароль');
    } finally {
      setEmailLoading(false);
      setTimeout(() => setEmailStatus(null), 3000);
    }
  }, [user, email, emailPassword]);

  return (
    <motion.div
      className="settings-page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <div className="settings-header">
        <h1 className="settings-title">Настройки</h1>
      </div>

      <div className="accordion">
        <Section id="account" label="Аккаунт" icon={User} expanded={expanded.has('account')} onToggle={toggleSection}>
          {user ? (
            <>
              <div className="acc-row">
                <span className="acc-label">Логин</span>
                <span className="acc-value">{user.login}</span>
              </div>
              <div className="acc-row">
                <span className="acc-label">Email</span>
                <div className="acc-inline">
                  <input className="modal-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
              </div>
              <div className="acc-row">
                <span className="acc-label">Подтверждение</span>
                <div className="acc-inline">
                  <input className="modal-input" type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} placeholder="подтвердите пароль" />
                  <motion.button className="settings-btn settings-btn-primary" onClick={handleSaveEmail} disabled={emailLoading || !email.trim() || !emailPassword} whileTap={{ scale: 0.97 }}>
                    {emailLoading ? '...' : emailStatus === 'Email сохранён' ? <Check size={16} /> : 'Сохранить'}
                  </motion.button>
                </div>
              </div>
              {emailStatus && (
                <p className={`acc-hint${emailStatus === 'Email сохранён' ? '' : ' error'}`}>{emailStatus}</p>
              )}
              <div className="acc-row acc-row-noborder">
                <span className="acc-label">Пароль</span>
                <motion.button className="settings-btn settings-btn-ghost" onClick={() => setShowPasswordModal(true)} whileTap={{ scale: 0.97 }}>
                  Сменить пароль
                </motion.button>
              </div>
            </>
          ) : (
            <p className="acc-empty">Войдите в аккаунт, чтобы управлять настройками профиля</p>
          )}
        </Section>

        {user && (
          <Section id="telegram" label="Telegram" icon={TelegramLogo} expanded={expanded.has('telegram')} onToggle={toggleSection}>
            {telegramLoading ? (
              <p className="acc-empty">Проверка статуса...</p>
            ) : telegramLinked ? (
              <>
                <div className="acc-row">
                  <span className="acc-label">Статус</span>
                  <span className="acc-value" style={{ color: '#22c55e' }}>
                    <Check size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                    Привязан
                  </span>
                </div>
                {telegramId && (
                  <div className="acc-row acc-row-noborder">
                    <span className="acc-label">Telegram ID</span>
                    <span className="acc-value">{telegramId}</span>
                  </div>
                )}
                <div className="acc-row acc-row-noborder">
                  <motion.button className="settings-btn settings-btn-ghost" onClick={handleUnlink} whileTap={{ scale: 0.97 }}>
                    <LinkBreak size={14} style={{ marginRight: 6 }} />
                    Отвязать
                  </motion.button>
                </div>
              </>
            ) : (
              <>
                <p className="acc-empty">Telegram не привязан</p>
                <div className="acc-row acc-row-noborder">
                  <motion.button className="settings-btn settings-btn-primary" onClick={() => setShowTelegramModal(true)} whileTap={{ scale: 0.97 }}>
                    <Link size={14} style={{ marginRight: 6 }} />
                    Привязать
                  </motion.button>
                </div>
              </>
            )}
          </Section>
        )}

        {user && (
          <Section id="appearance" label="Оформление" badge={!isDev ? 'dev only' : undefined} icon={Palette} expanded={expanded.has('appearance')} onToggle={toggleSection}>
            {isDev ? (
              <>
                <div className="colors-grid">
                  {(Object.entries(colorLabels) as [ThemeColorKey, string][]).map(([key, label]) => (
                    <div className="color-picker-row" key={key}>
                      <label className="color-picker-label">
                        <span className="color-picker-swatch" style={{ background: colors[key] }} />
                        {label}
                      </label>
                      <div className="color-picker-controls">
                        <input type="color" className="color-picker-input" value={colors[key]} onChange={e => updateColor(key, e.target.value)} />
                        <input type="text" className="color-hex-input" value={colors[key]} onChange={e => updateColor(key, e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="acc-actions">
                  <motion.button className="settings-btn settings-btn-primary" onClick={handleSaveColors} whileTap={{ scale: 0.97 }}>
                    {saved ? <><Check size={16} /> Сохранено</> : 'Сохранить тему'}
                  </motion.button>
                  <motion.button className="settings-btn settings-btn-ghost" onClick={handleResetColors} whileTap={{ scale: 0.97 }}>
                    Сбросить
                  </motion.button>
                </div>
                {colorError && <p className="acc-hint error">{colorError}</p>}
              </>
            ) : (
              <p className="acc-empty">Настройка цветов доступна только для dev-аккаунтов</p>
            )}
          </Section>
        )}

        {isDev && (
          <Section id="server" label="Подключение к серверу" icon={HardDrives} expanded={expanded.has('server')} onToggle={toggleSection}>
            <div className="acc-row">
              <input className="modal-input" type="text" value={serverUrl} onChange={e => setServerUrl(e.target.value)} placeholder="http://localhost:3001" />
              <motion.button className="settings-btn settings-btn-primary" onClick={handleSaveServerUrl} whileTap={{ scale: 0.97 }}>
                Применить
              </motion.button>
            </div>
            <div className="acc-row">
              <motion.button className="settings-btn settings-btn-ghost" onClick={handleTestConnection} disabled={serverStatus === 'testing'} whileTap={{ scale: 0.97 }}>
                {serverStatus === 'testing' ? 'Проверка...' : 'Проверить соединение'}
              </motion.button>
              {serverStatus === 'ok' && <span className="server-status server-status-ok"><Check size={14} /> Подключено</span>}
              {serverStatus === 'error' && <span className="server-status server-status-error">✗ Ошибка</span>}
            </div>
            <ServerCommands />
          </Section>
        )}
      </div>

      <AnimatePresence>
        {showPasswordModal && <PasswordModal onClose={() => setShowPasswordModal(false)} />}
        {showTelegramModal && <TelegramModal onClose={() => setShowTelegramModal(false)} onLinked={handleTelegramLinked} />}
      </AnimatePresence>
    </motion.div>
  );
}
