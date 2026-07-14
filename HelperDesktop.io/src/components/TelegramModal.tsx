import { useState, useEffect, useCallback } from 'react';
import { QrCode, Key, User, Check, Copy } from '@phosphor-icons/react';
import QRCodeLib from 'qrcode';
import Modal, { ModalClose, ModalHeader } from './Modal';

type TabId = 'qr' | 'code' | 'credentials';

interface TelegramModalProps {
  onClose: () => void;
  onLinked: () => void;
}

export default function TelegramModal({ onClose, onLinked }: TelegramModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('qr');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [qrDisplay, setQrDisplay] = useState('');
  const [qrCheckCode, setQrCheckCode] = useState('');
  const [qrStatus, setQrStatus] = useState<'idle' | 'pending' | 'linked' | 'expired'>('idle');
  const [qrImageUrl, setQrImageUrl] = useState('');

  const [confirmCode, setConfirmCode] = useState('');

  const [credLogin, setCredLogin] = useState('');
  const [credPassword, setCredPassword] = useState('');

  const [copied, setCopied] = useState(false);

  const generateQR = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronTelegram.qrGenerate();
      setQrDisplay(result.deepLink);
      setQrCheckCode(result.code);
      setQrStatus('pending');
      const imageUrl = await QRCodeLib.toDataURL(result.deepLink, {
        width: 180,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrImageUrl(imageUrl);
    } catch {
      setError('Не удалось сгенерировать QR-код');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'qr' && qrStatus === 'pending') {
      const interval = setInterval(async () => {
        try {
          const result = await window.electronTelegram.qrCheck(qrCheckCode);
          if (result.status === 'linked') {
            setQrStatus('linked');
            onLinked();
          } else if (result.status === 'expired') {
            setQrStatus('expired');
          }
        } catch { /* ignore check errors */ }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeTab, qrStatus, qrCheckCode, onLinked]);

  useEffect(() => {
    if (activeTab === 'qr') {
      generateQR();
    }
  }, [activeTab, generateQR]);

  const handleVerifyCode = useCallback(async () => {
    if (!confirmCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronTelegram.codeVerify(confirmCode.trim());
      if (result.verified) {
        onLinked();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Неверный код');
    } finally {
      setLoading(false);
    }
  }, [confirmCode, onLinked]);

  const handleLinkCredentials = useCallback(async () => {
    if (!credLogin.trim() || !credPassword.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronTelegram.link(credLogin.trim(), credPassword);
      if (result.telegramId) {
        onLinked();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка привязки');
    } finally {
      setLoading(false);
    }
  }, [credLogin, credPassword, onLinked]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(qrDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [qrDisplay]);

  const tabs = [
    { id: 'qr' as TabId, label: 'QR-код', icon: QrCode },
    { id: 'code' as TabId, label: 'Код', icon: Key },
    { id: 'credentials' as TabId, label: 'Логин', icon: User },
  ];

  return (
    <Modal onClose={onClose} size="sm">
      <ModalClose onClick={onClose} />
      <ModalHeader
        icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
          </svg>
        }
        title="Привязка Telegram"
        subtitle="Выберите способ привязки"
      />

      <div className="telegram-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`telegram-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="telegram-tab-content">
        {activeTab === 'qr' && (
          <div className="telegram-qr">
            {loading ? (
              <div className="telegram-loading">
                <div className="loading-spinner" />
              </div>
            ) : qrStatus === 'linked' ? (
              <div className="telegram-success">
                <Check size={24} />
                <span>Telegram привязан!</span>
              </div>
            ) : (
              <>
                <div className="telegram-qr-code">
                  {qrImageUrl ? (
                    <img src={qrImageUrl} alt="QR Code" className="qr-image" />
                  ) : (
                    <div className="qr-placeholder">
                      <span className="qr-text">{qrDisplay}</span>
                    </div>
                  )}
                </div>
                <p className="telegram-hint">
                  Отсканируйте QR-код в Telegram или перейдите по ссылке
                </p>
                <button className="telegram-copy-btn" onClick={handleCopyLink}>
                  {copied ? <><Check size={14} /> Скопировано</> : <><Copy size={14} /> Копировать ссылку</>}
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'code' && (
          <div className="telegram-code">
            <p className="telegram-hint">
              Отправьте команду /link боту в Telegram и введите полученный код
            </p>
            <div className="modal-field">
              <label className="modal-label">Код подтверждения</label>
              <input
                className="modal-input"
                type="text"
                placeholder="XXXXXX"
                value={confirmCode}
                onChange={e => setConfirmCode(e.target.value.toUpperCase())}
                maxLength={6}
                disabled={loading}
              />
            </div>
            <div className="modal-error-area">
              {error ? <p className="modal-error">{error}</p> : null}
            </div>
            <button
              className="modal-submit"
              onClick={handleVerifyCode}
              disabled={loading || confirmCode.length < 6}
            >
              {loading ? 'Проверка...' : 'Подтвердить'}
            </button>
          </div>
        )}

        {activeTab === 'credentials' && (
          <div className="telegram-credentials">
            <div className="modal-field">
              <label className="modal-label">Логин</label>
              <input
                className="modal-input"
                type="text"
                placeholder="your_login"
                value={credLogin}
                onChange={e => setCredLogin(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Пароль</label>
              <input
                className="modal-input"
                type="password"
                placeholder="••••••••"
                value={credPassword}
                onChange={e => setCredPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="modal-error-area">
              {error ? <p className="modal-error">{error}</p> : null}
            </div>
            <button
              className="modal-submit"
              onClick={handleLinkCredentials}
              disabled={loading || !credLogin.trim() || !credPassword.trim()}
            >
              {loading ? 'Привязка...' : 'Привязать'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
