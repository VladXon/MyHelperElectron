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