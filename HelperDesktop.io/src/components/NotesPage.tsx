import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, PushPin, PushPinSlash, Check, Circle, Clock, Tag, Trash, PencilSimple, X, Notebook } from '@phosphor-icons/react';
import { useAuth } from '../AuthContext';
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
  created_at: string;
  updated_at: string;
}

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const loadNotes = useCallback(async () => {
    if (!user) return;
    const data = await window.electronNotes.getAll();
    setNotes(data);
  }, [user]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const handleCreate = () => {
    setEditNote(null);
    setShowModal(true);
  };

  const handleEdit = (note: Note) => {
    setEditNote(note);
    setShowModal(true);
  };

  const handleSave = async (noteData: { title: string; body: string; tags: string[]; reminder_at: number | null }) => {
    if (editNote) {
      await window.electronNotes.update(editNote.id, noteData);
    } else {
      await window.electronNotes.create({ ...noteData, reminder_at: noteData.reminder_at ?? undefined });
    }
    setShowModal(false);
    loadNotes();
  };

  const handleToggle = async (id: number, field: 'pinned' | 'completed') => {
    await window.electronNotes.toggle(id, field);
    loadNotes();
  };

  const handleDelete = async (id: number) => {
    if (deleteConfirm === id) {
      await window.electronNotes.remove(id);
      setDeleteConfirm(null);
      loadNotes();
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
        {note.completed ? <Check size={16} /> : <Circle size={16} />}
      </button>
      <div className="note-body">
        <div className="note-header">
          <span className="note-title">{note.title || 'Без заголовка'}</span>
          {note.reminder_at && (
            <span className="note-reminder">
              <Clock size={12} /> {formatTime(note.reminder_at)}
            </span>
          )}
        </div>
        {note.body && <p className="note-text">{note.body}</p>}
        <div className="note-footer">
          <span className="note-date">{new Date(note.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
          {note.tags.length > 0 && (
            <div className="note-tags">
              {note.tags.map(t => <span key={t} className="note-tag"><Tag size={10} /> {t}</span>)}
            </div>
          )}
        </div>
      </div>
      <div className="note-actions">
        <button className="note-action-btn" onClick={() => handleToggle(note.id, 'pinned')} title={note.pinned ? 'Открепить' : 'Закрепить'}>
          {note.pinned ? <PushPinSlash size={14} /> : <PushPin size={14} />}
        </button>
        <button className="note-action-btn" onClick={() => handleEdit(note)} title="Редактировать">
          <PencilSimple size={14} />
        </button>
        <button className={`note-action-btn ${deleteConfirm === note.id ? 'danger' : ''}`} onClick={() => handleDelete(note.id)} title={deleteConfirm === note.id ? 'Нажмите ещё раз' : 'Удалить'}>
          <Trash size={14} />
        </button>
      </div>
    </motion.div>
  );

  return (
    <motion.div className="notes-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {!user ? (
        <div className="notes-empty">
          <Notebook size={48} />
          <p>Войдите для просмотра заметок</p>
        </div>
      ) : (<>
      <div className="notes-header">
        <h2>Заметки</h2>
        <button className="btn-primary" onClick={handleCreate}><Plus size={16} /> Новая</button>
      </div>
      <div className="notes-search">
        <input type="text" placeholder="Поиск заметок..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button className="search-clear" onClick={() => setSearch('')}><X size={14} /></button>}
      </div>
      {filtered.length === 0 ? (
        <div className="notes-empty">
          <Notebook size={48} />
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
        {showModal && <NoteEditModal note={editNote} onSave={handleSave} onClose={() => setShowModal(false)} />}
      </AnimatePresence>
      </>)}
    </motion.div>
  );
}
