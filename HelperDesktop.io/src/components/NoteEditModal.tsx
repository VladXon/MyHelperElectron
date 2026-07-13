import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Tag } from '@phosphor-icons/react';
import DateTimePicker from './DateTimePicker';

interface NoteEditModalProps {
  note: { id: number; title: string; body: string; tags: string[]; reminder_at: number | null; notify_telegram?: boolean } | null;
  onSave: (data: { title: string; body: string; tags: string[]; reminder_at: number | null; notify_telegram: boolean }) => void;
  onClose: () => void;
  telegramLinked?: boolean;
}

export default function NoteEditModal({ note, onSave, onClose, telegramLinked = false }: NoteEditModalProps) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody] = useState(note?.body ?? '');
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [reminder, setReminder] = useState(() => {
    if (note?.reminder_at) {
      const d = new Date(note.reminder_at);
      return d.toISOString().slice(0, 16);
    }
    return '';
  });
  const [notifyTelegram, setNotifyTelegram] = useState(note?.notify_telegram ?? false);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter(x => x !== t));

  const handleSave = () => {
    const reminder_at = reminder ? new Date(reminder).getTime() : null;
    onSave({ title, body, tags, reminder_at, notify_telegram: notifyTelegram });
  };

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal-card note-edit-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{note ? 'Редактировать заметку' : 'Новая заметка'}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="note-edit-fields">
          <input type="text" className="note-edit-title" placeholder="Заголовок" value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
          <textarea className="note-edit-body" placeholder="Текст заметки..." value={body} onChange={e => setBody(e.target.value)} maxLength={10000} rows={6} />
          <div className="note-edit-tags">
            <div className="tag-input-row">
              <Tag size={14} />
              <input type="text" placeholder="Добавить тег (Enter)" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} maxLength={50} />
              <button onClick={addTag}>+</button>
            </div>
            {tags.length > 0 && (
              <div className="tag-chips">
                {tags.map(t => (
                  <span key={t} className="tag-chip">{t}<button onClick={() => removeTag(t)}><X size={10} /></button></span>
                ))}
              </div>
            )}
          </div>
          <div className="note-edit-reminder">
            <label>Напоминание:</label>
            <DateTimePicker value={reminder} onChange={setReminder} />
          </div>
          <div className="note-edit-notify">
            <label className="toggle-switch">
              <input
                type="checkbox"
                className="toggle-switch-input"
                checked={notifyTelegram}
                onChange={e => setNotifyTelegram(e.target.checked)}
                disabled={!telegramLinked}
              />
              <span className="toggle-switch-track">
                <span className="toggle-switch-thumb" />
              </span>
              <span className="toggle-switch-label">Упомянуть в Telegram</span>
            </label>
            {!telegramLinked && (
              <span className="note-notify-hint">Сначала привяжите Telegram в настройках</span>
            )}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Отмена</button>
          <button className="btn-primary" onClick={handleSave}>Сохранить</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
