import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote, useToggleNote } from '../hooks/useNotes';
import { useTelegramStatus } from '../hooks/useTelegramStatus';
import NoteEditModal from './NoteEditModal';

interface Note {
  id: number;
  user_id: number;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  completed: boolean;
  reminder_at: number | null;
  notify_telegram: boolean;
  telegram_notified: boolean;
  created_at: string;
  updated_at: string;
}

export default function NotesPage() {
  const { user } = useAuth();
  const { data: notes = [] } = useNotes(user?.id ?? null);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const toggleNote = useToggleNote();
  const { data: telegramStatus } = useTelegramStatus();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const noteId = e.detail;
      const note = notes.find(n => n.id === noteId);
      if (note) {
        handleEdit(note);
      }
    };
    window.addEventListener('deep-link-note', handler as EventListener);
    return () => window.removeEventListener('deep-link-note', handler as EventListener);
  }, [notes]);

  const handleCreate = () => {
    setEditNote(null);
    setShowModal(true);
  };

  const handleEdit = (note: Note) => {
    setEditNote(note);
    setShowModal(true);
  };

  const handleSave = async (noteData: { title: string; body: string; tags: string[]; reminder_at: number | null; notify_telegram: boolean }) => {
    if (editNote) {
      await updateNote.mutateAsync({ id: editNote.id, data: noteData });
    } else {
      await createNote.mutateAsync(noteData);
    }
    setShowModal(false);
  };

  const handleToggle = (id: number, field: 'pinned' | 'completed') => {
    toggleNote.mutate({ id, field });
  };

  const handleDelete = async (id: number) => {
    if (deleteConfirm === id) {
      await deleteNote.mutateAsync(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  };

  const filtered = notes.filter(n => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q));
  });

  const pinned = filtered.filter(n => n.pinned && !n.completed);
  const active = filtered.filter(n => !n.pinned && !n.completed);
  const completed = filtered.filter(n => n.completed);

  const formatTime = (ts: number) => new Date(ts).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  const renderCard = (note: Note) => (
    <motion.div
      key={note.id}
      className={`note-card ${note.completed ? 'completed' : ''}`}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      <button className="note-check" onClick={() => handleToggle(note.id, 'completed')} title={note.completed ? 'Вернуть' : 'Выполнено'}>
        {note.completed ? (
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>radio_button_unchecked</span>
        )}
      </button>
      <div className="note-body">
        <div className="note-header">
          <span className="note-title">{note.title || 'Без заголовка'}</span>
          {note.reminder_at && (
            <span className="note-reminder">
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>schedule</span> {formatTime(note.reminder_at)}
            </span>
          )}
          {note.notify_telegram && (
            <span className={`note-telegram ${note.telegram_notified ? 'sent' : ''}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>send</span>
            </span>
          )}
        </div>
        {note.body && <p className="note-text">{note.body}</p>}
        <div className="note-footer">
          <span className="note-date">{new Date(note.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
          {note.tags.length > 0 && (
            <div className="note-tags">
              {note.tags.map(t => (
                <span key={t} className="note-tag">
                  <span className="material-symbols-outlined" style={{ fontSize: 10 }}>label</span> {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="note-actions">
        <button className="note-action-btn" onClick={() => handleToggle(note.id, 'pinned')} title={note.pinned ? 'Открепить' : 'Закрепить'}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{note.pinned ? 'push_pin' : 'push_pin'}</span>
        </button>
        <button className="note-action-btn" onClick={() => handleEdit(note)} title="Редактировать">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
        </button>
        <button className={`note-action-btn ${deleteConfirm === note.id ? 'danger' : ''}`} onClick={() => handleDelete(note.id)} title={deleteConfirm === note.id ? 'Нажмите ещё раз' : 'Удалить'}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
        </button>
      </div>
    </motion.div>
  );

  return (
    <motion.div className="notes-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {!user ? (
        <div className="notes-empty">
          <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.4 }}>note</span>
          <p>Войдите для просмотра заметок</p>
        </div>
      ) : (<>
      <div className="notes-header">
        <h2>Заметки</h2>
        <button className="btn-new-note" onClick={handleCreate}>
          <span className="material-symbols-outlined">add_note</span> Новая заметка
        </button>
      </div>
      <div className="notes-search">
        <span className="material-symbols-outlined" style={{ fontSize: 18, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>search</span>
        <input type="text" placeholder="Поиск заметок..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        {search && <button className="search-clear" onClick={() => setSearch('')}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
        </button>}
      </div>
      {filtered.length === 0 ? (
        <div className="notes-empty">
          <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.4 }}>note</span>
          <p>{search ? 'Ничего не найдено' : 'Нет заметок'}</p>
          {!search && <span>Нажмите «Новая» чтобы создать</span>}
        </div>
      ) : (
        <div className="notes-list">
          {pinned.length > 0 && <div className="notes-section"><h3>Закреплённые</h3>{pinned.map(renderCard)}</div>}
          {active.length > 0 && <div className="notes-section"><h3>Активные</h3>{active.map(renderCard)}</div>}
          {completed.length > 0 && <div className="notes-section"><h3>Выполненные</h3>{completed.map(renderCard)}</div>}
        </div>
      )}
      <AnimatePresence>
        {showModal && <NoteEditModal note={editNote} onSave={handleSave} onClose={() => setShowModal(false)} telegramLinked={telegramStatus?.linked ?? false} />}
      </AnimatePresence>
      </>)}
    </motion.div>
  );
}
