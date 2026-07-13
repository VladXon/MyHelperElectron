import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlass, SquaresFour, Notebook, Gear } from '@phosphor-icons/react';

const iconMap: Record<string, typeof SquaresFour> = {
  presets: SquaresFour,
  notes: Notebook,
  settings: Gear,
};

interface CommandPaletteProps {
  onClose: () => void;
  onNavigate: (id: string) => void;
  pages: { id: string; label: string }[];
}

export default function CommandPalette({ onClose, onNavigate, pages }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => {
    if (!query.trim()) return pages;
    const q = query.toLowerCase();
    return pages.filter(i => i.label.toLowerCase().includes(q));
  }, [query, pages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(p => Math.min(p + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(p => Math.max(p - 1, 0));
    } else if (e.key === 'Enter' && items[selected]) {
      onNavigate(items[selected].id);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <motion.div
      className="cmd-palette-overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
    >
      <motion.div
        className="cmd-palette"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: -24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="cmd-palette-input-wrap">
          <MagnifyingGlass size={18} color="var(--text-muted)" />
          <input
            ref={inputRef}
            className="cmd-palette-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Поиск страниц..."
          />
        </div>
        <div className="cmd-palette-list">
          {items.length === 0 ? (
            <div className="cmd-palette-empty">Ничего не найдено</div>
          ) : (
            items.map((item, i) => {
              const Icon = iconMap[item.id] || SquaresFour;
              return (
                <button
                  key={item.id}
                  className={`cmd-palette-item${i === selected ? ' selected' : ''}`}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  onMouseEnter={() => setSelected(i)}
                >
                  <span className="cmd-palette-item-icon">
                    <Icon size={18} />
                  </span>
                  {item.label}
                </button>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
