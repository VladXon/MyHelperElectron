import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Preset, PresetApp } from '../types.d';

interface PresetEditModalProps {
  preset: Preset | null;
  onClose: () => void;
  onSave: (preset: Preset) => void;
}

function emptyApp(): PresetApp {
  return { name: '', path: '' };
}

export default function PresetEditModal({ preset, onClose, onSave }: PresetEditModalProps) {
  const [name, setName] = useState(preset?.name ?? '');
  const [icon, setIcon] = useState(preset?.icon ?? '🎮');
  const [apps, setApps] = useState<PresetApp[]>(preset?.apps ?? [emptyApp()]);
  const [saving, setSaving] = useState(false);

  const handleAddApp = useCallback(() => {
    setApps(prev => [...prev, emptyApp()]);
  }, []);

  const handleRemoveApp = useCallback((idx: number) => {
    setApps(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleAppChange = useCallback((idx: number, field: keyof PresetApp, value: string | boolean) => {
    setApps(prev => prev.map((app, i) => (i === idx ? { ...app, [field]: value } : app)));
  }, []);

  const handleBrowse = useCallback(async (idx: number) => {
    const filePath = await window.electronDialog.openFile();
    if (filePath) {
      setApps(prev => prev.map((app, i) => (i === idx ? { ...app, path: filePath } : app)));
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    const id = preset?.id ?? crypto.randomUUID();
    const filtered = apps.filter(a => a.name.trim() || a.path.trim());
    const newPreset: Preset = { id, name: name.trim(), icon: icon || '🎮', apps: filtered };
    onSave(newPreset);
    setSaving(false);
  }, [name, icon, apps, preset, onSave]);

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
        className="modal-card preset-modal"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      >
        <button className="modal-close" onClick={onClose} disabled={saving}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
        </button>

        <div className="modal-header">
          <div className="modal-icon" style={{ fontSize: 22 }}>{icon || '🎮'}</div>
          <h2 className="modal-title">{preset ? 'Редактировать пресет' : 'Новый пресет'}</h2>
          <p className="modal-subtitle">Приложения, которые откроются при запуске</p>
        </div>

        <div className="preset-form">
          <div className="modal-field">
            <label className="modal-label">Название</label>
            <input
              className="modal-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Path of Exile 2"
              disabled={saving}
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">Иконка</label>
            <input
              className="modal-input"
              type="text"
              value={icon}
              onChange={e => setIcon(e.target.value)}
              placeholder="🎮"
              maxLength={4}
              disabled={saving}
              style={{ width: 80, textAlign: 'center', fontSize: 20 }}
            />
          </div>

          <div className="preset-apps-header">
            <span className="modal-label">Приложения</span>
            <motion.button
              className="settings-btn settings-btn-ghost"
              onClick={handleAddApp}
              disabled={saving}
              style={{ padding: '3px 10px', fontSize: 11 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 12, marginRight: 2 }}>add</span>
              Добавить
            </motion.button>
          </div>

          <div className="preset-apps-list">
            {apps.map((app, idx) => (
              <motion.div
                className="preset-app-row"
                key={idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="preset-app-fields">
                  <input
                    className="modal-input preset-app-name"
                    type="text"
                    value={app.name}
                    onChange={e => handleAppChange(idx, 'name', e.target.value)}
                    placeholder="Название"
                    disabled={saving}
                  />
                  <div className="preset-app-path-row">
                    <input
                      className="modal-input preset-app-path"
                      type="text"
                      value={app.path}
                      onChange={e => handleAppChange(idx, 'path', e.target.value)}
                      placeholder="Путь к .exe"
                      disabled={saving}
                    />
                    <motion.button
                      className="preset-browse-btn"
                      onClick={() => handleBrowse(idx)}
                      disabled={saving}
                      title="Обзор"
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>folder_open</span>
                    </motion.button>
                    <label className={`admin-toggle${app.runAsAdmin ? ' active' : ''}`} title="Запуск от имени администратора">
                      <input
                        type="checkbox"
                        checked={!!app.runAsAdmin}
                        onChange={e => handleAppChange(idx, 'runAsAdmin', e.target.checked)}
                        disabled={saving}
                      />
                      <span className="admin-toggle-track">
                        <span className="admin-toggle-thumb">
                          <span className="material-symbols-outlined admin-toggle-icon" style={{ fontSize: 10 }}>admin_panel_settings</span>
                        </span>
                      </span>
                    </label>
                  </div>
                </div>
                <motion.button
                  className="preset-remove-btn"
                  onClick={() => handleRemoveApp(idx)}
                  disabled={saving || apps.length <= 1}
                  title="Удалить"
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                </motion.button>
              </motion.div>
            ))}
          </div>

          <div className="modal-error-area">
            {!name.trim() ? <p className="modal-error">Введите название пресета</p> : null}
          </div>

          <div className="preset-modal-actions">
            <motion.button className="settings-btn settings-btn-ghost" onClick={onClose} disabled={saving} whileTap={{ scale: 0.97 }}>
              Отмена
            </motion.button>
            <motion.button className="modal-submit" onClick={handleSave} disabled={saving || !name.trim()} whileTap={{ scale: 0.97 }}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
