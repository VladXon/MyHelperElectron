import { useEffect, useState } from 'react';
import { Minus, Square, SquaresFour, X } from '@phosphor-icons/react';

interface TitlebarProps {
  serverOnline: boolean;
  onReconnect: () => void;
}

export default function Titlebar({ serverOnline, onReconnect }: TitlebarProps) {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    window.electronWindow.isMaximized().then(setMaximized);
    const cleanup = window.electronWindow.onMaximizedChanged(setMaximized);
    return cleanup;
  }, []);

  return (
    <div className="titlebar">
      <div className="titlebar-left" onClick={onReconnect} title={serverOnline ? 'Сервер работает' : 'Сервер недоступен'}>
        <div className={`titlebar-brand-dot ${serverOnline ? 'online' : 'offline'}`} />
        <span className="titlebar-brand">MyHelper</span>
      </div>

      <div className="titlebar-controls">
        <button className="titlebar-btn" onClick={() => window.electronWindow.minimize()} aria-label="Свернуть">
          <Minus size={14} />
        </button>
        <button className="titlebar-btn" onClick={() => window.electronWindow.maximizeToggle()} aria-label={maximized ? 'Восстановить' : 'Развернуть'}>
          {maximized ? <SquaresFour size={12} /> : <Square size={12} />}
        </button>
        <button className="titlebar-btn titlebar-close" onClick={() => window.electronWindow.close()} aria-label="Закрыть">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
