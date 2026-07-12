import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, X, CaretRight } from '@phosphor-icons/react';
import { useAuth } from '../AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { login } = useAuth();
  const [loginVal, setLoginVal] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
      await login(loginVal.trim(), loginVal.trim(), password);
      onClose();
    } catch {
      setError('Неверный логин или пароль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="modal-card"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      >
        <button className="modal-close" onClick={onClose} disabled={loading}>
          <X size={14} />
        </button>

        <div className="modal-header">
          <div className="modal-icon">
            <User size={22} />
          </div>
          <h2 className="modal-title">Войти в аккаунт</h2>
          <p className="modal-subtitle">Введите логин и пароль</p>
        </div>

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
                <CaretRight size={16} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
