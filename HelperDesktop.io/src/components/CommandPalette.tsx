import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlass, SquaresFour, Notebook, Gear, Tag } from '@phosphor-icons/react';

const iconMap: Record<string, typeof SquaresFour> = {
  presets: SquaresFour,
  notes: Notebook,
  settings: Gear,
};

interface CommandPaletteProps {
  onClose: () => void;
  onNavigate: (id: string) => void;
  pages: { id: string; label: string }[];
  notes?: { id: number; title: string; body: string; tags: string[] }[];
  presets?: { id: string; name: string; icon: string }[];
  onOpenNote?: (id: number) => void;
  onOpenPreset?: (id: string) => void;
}

interface SearchItem {
  id: string;
  label: string;
  section: string;
  icon: typeof SquaresFour;
  action: () => void;
  tags?: string[];
}

export default function CommandPalette({ onClose, onNavigate, pages, notes = [], presets = [], onOpenNote, onOpenPreset }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => {
    const allItems: SearchItem[] = [];

    pages.forEach(p => {
      allItems.push({
        id: `page-${p.id}`,
        label: p.label,
        section: 'Страницы',
        icon: iconMap[p.id] || SquaresFour,
        action: () => { onNavigate(p.id); onClose(); },
      });
    });

    notes.forEach(n => {
      allItems.push({
        id: `note-${n.id}`,
        label: n.title || 'Без заголовка',
        section: 'Заметки',
        icon: Notebook,
        action: () => { onNavigate('notes'); onOpenNote?.(n.id); onClose(); },
        tags: n.tags,
      });
    });

    presets.forEach(p => {
      allItems.push({
        id: `preset-${p.id}`,
        label: p.name,
        section: 'Пресеты',
        icon: SquaresFour,
        action: () => { onNavigate('presets'); onOpenPreset?.(p.id); onClose(); },
      });
    });

    if (!query.trim()) return allItems;

    const q = query.toLowerCase();
    return allItems.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.section.toLowerCase().includes(q) ||
      item.tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [query, pages, notes, presets, onNavigate, onOpenNote, onOpenPreset, onClose]);

  const sections = useMemo(() => {
    const map = new Map<string, SearchItem[]>();
    items.forEach(item => {
      const arr = map.get(item.section) || [];
      arr.push(item);
      map.set(item.section, arr);
    });
    return Array.from(map.entries());
  }, [items]);

  const flatItems = useMemo(() => items, [items]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(p => Math.min(p + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(p => Math.max(p - 1, 0));
    } else if (e.key === 'Enter' && flatItems[selected]) {
      flatItems[selected].action();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let itemIndex = -1;

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
            placeholder="Поиск страниц, заметок, пресетов..."
          />
        </div>
        <div className="cmd-palette-list">
          {flatItems.length === 0 ? (
            <div className="cmd-palette-empty">Ничего не найдено</div>
          ) : (
            sections.map(([section, sectionItems]) => (
              <div key={section}>
                <div className="cmd-palette-section">{section}</div>
                {sectionItems.map(item => {
                  itemIndex++;
                  const idx = itemIndex;
                  return (
                    <button
                      key={item.id}
                      className={`cmd-palette-item${idx === selected ? ' selected' : ''}`}
                      onClick={item.action}
                      onMouseEnter={() => setSelected(idx)}
                    >
                      <span className="cmd-palette-item-icon">
                        <item.icon size={18} />
                      </span>
                      <span className="cmd-palette-item-label">{item.label}</span>
                      {item.tags && item.tags.length > 0 && (
                        <span className="cmd-palette-item-tags">
                          {item.tags.slice(0, 2).map(t => (
                            <span key={t} className="cmd-palette-tag">
                              <Tag size={10} /> {t}
                            </span>
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
