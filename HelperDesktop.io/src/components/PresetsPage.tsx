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
      <div className="preset-card-icon-wrap">
        {preset.icon ? (
          <span>{preset.icon}</span>
        ) : (
          <PackageIcon size={22} />
        )}
      </div>
      <div className="preset-card-body">
        <div className="preset-card-name">{preset.name}</div>
        <div className="preset-card-meta">{preset.apps.length} прил.</div>
      </div>
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
        <motion.button
          className="preset-card-btn preset-card-launch"
          onClick={() => onLaunch(preset.id)}
          title="Запустить"
          whileTap={{ scale: 0.95 }}
        >
          <Play size={14} weight="fill" />
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
      <div className="presets-page-header">
        <h1 className="settings-title">Пресеты</h1>
        <motion.button
          className="settings-btn settings-btn-primary"
          onClick={onAdd}
          whileTap={{ scale: 0.97 }}
        >
          + Создать
        </motion.button>
      </div>

      <div className="presets-search-wrap">
        <MagnifyingGlass className="presets-search-icon" size={14} />
        <input
          className="presets-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск пресетов..."
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
            <Package size={48} style={{ opacity: 0.4 }} />
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
                <MagnifyingGlass size={48} style={{ opacity: 0.4 }} />
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
