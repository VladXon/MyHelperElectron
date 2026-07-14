import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../AuthContext';
import Modal, { ModalClose, ModalHeader } from './Modal';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { login } = useAuth();
  const loginRef = useRef(login);
  loginRef.current = login;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [loginVal, setLoginVal] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginVal.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const online = await window.electronServer.test();
      if (!online) {
        setError('Сервер недоступен. Попробуйте позже.');
        setLoading(false);
        return;
      }
      await loginRef.current(loginVal.trim(), loginVal.trim(), password);
      onCloseRef.current();
    } catch {
      setError('Неверный логин или пароль.');
    } finally {
      setLoading(false);
    }
  }, [loginVal, password]);

  return (
    <Modal onClose={onClose} size="sm">
      <ModalClose onClick={onClose} disabled={loading} />
      <ModalHeader
        icon={<span className="material-symbols-outlined" style={{ fontSize: 22 }}>person</span>}
        title="Войти в аккаунт"
        subtitle="Введите логин и пароль"
      />

      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="modal-field">
          <label className="modal-label">Логин</label>
          <input
            className="modal-input"
            type="text"
            placeholder="your_login"
            value={loginVal}
            onChange={e => setLoginVal(e.target.value)}
            autoFocus
            disabled={loading}
          />
        </div>
        <div className="modal-field">
          <label className="modal-label">Пароль</label>
          <input
            className="modal-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="modal-error-area">
          {error ? <p className="modal-error">{error}</p> : null}
        </div>
        <button className="modal-submit" type="submit" disabled={loading}>
          {loading ? 'Вход...' : (
            <>
              Войти
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
