import { useState } from 'react';
import Modal, { ModalClose, ModalHeader } from './Modal';
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
    <Modal onClose={onClose} size="sm">
      <ModalClose onClick={onClose} />
      <ModalHeader
        icon={<span className="material-symbols-outlined" style={{ fontSize: 22 }}>edit_note</span>}
        title={note ? 'Редактировать заметку' : 'Новая заметка'}
        subtitle="Заголовок, текст и напоминание"
      />

      <div className="note-edit-fields">
        <input type="text" className="note-edit-title" placeholder="Заголовок" value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
        <textarea className="note-edit-body" placeholder="Текст заметки..." value={body} onChange={e => setBody(e.target.value)} maxLength={10000} rows={6} />
        <div className="note-edit-tags">
          <div className="tag-input-row">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>label</span>
            <input type="text" placeholder="Добавить тег (Enter)" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} maxLength={50} />
            <button onClick={addTag}>+</button>
          </div>
          {tags.length > 0 && (
            <div className="tag-chips">
              {tags.map(t => (
                <span key={t} className="tag-chip">
                  {t}
                  <span role="button" tabIndex={0} onClick={() => removeTag(t)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 10 }}>close</span>
                  </span>
                </span>
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
    </Modal>
  );
}
