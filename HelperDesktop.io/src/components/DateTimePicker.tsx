import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarBlank, Clock, CaretLeft, CaretRight, X } from '@phosphor-icons/react';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export default function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const date = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const [viewMonth, setViewMonth] = useState(date.getMonth());
  const [selectedDate, setSelectedDate] = useState<{ year: number; month: number; day: number } | null>(
    value ? { year: date.getFullYear(), month: date.getMonth(), day: date.getDate() } : null
  );
  const [hours, setHours] = useState(value ? date.getHours() : 12);
  const [minutes, setMinutes] = useState(value ? date.getMinutes() : 0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const now = new Date();

  const toggleOpen = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 340);

      if (value) {
        const d = new Date(value);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
        setSelectedDate({ year: d.getFullYear(), month: d.getMonth(), day: d.getDate() });
        setHours(d.getHours());
        setMinutes(d.getMinutes());
      } else {
        const now = new Date();
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
        setSelectedDate({ year: now.getFullYear(), month: now.getMonth(), day: now.getDate() });
        setHours(now.getHours());
        setMinutes(now.getMinutes());
      }
    }
    setOpen(!open);
  };

  const applyValue = (y: number, m: number, d: number, h: number, min: number) => {
    const dt = new Date(y, m, d, h, min);
    const pad = (n: number) => String(n).padStart(2, '0');
    onChange(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(h)}:${pad(min)}`);
  };

  const selectDay = (day: number) => {
    setSelectedDate({ year: viewYear, month: viewMonth, day });
    applyValue(viewYear, viewMonth, day, hours, minutes);
  };

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  const setHour = (h: number) => {
    const v = ((h % 24) + 24) % 24;
    setHours(v);
  };

  const setMin = (m: number) => {
    const v = ((m % 60) + 60) % 60;
    setMinutes(v);
  };

  const goToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate({ year: now.getFullYear(), month: now.getMonth(), day: now.getDate() });
    setHours(now.getHours());
    setMinutes(now.getMinutes());
    applyValue(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
  };

  const clear = () => {
    setSelectedDate(null);
    setHours(12);
    setMinutes(0);
    onChange('');
    setOpen(false);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const pad = (n: number) => String(n).padStart(2, '0');
  const displayValue = value
    ? `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
    : '';

  return (
    <div className="dtpicker" ref={ref}>
      <button className="dtpicker-trigger" onClick={toggleOpen} type="button">
        <CalendarBlank size={14} />
        <span>{displayValue || 'Выбрать дату и время'}</span>
        {value && (
          <button className="dtpicker-clear" onClick={(e) => { e.stopPropagation(); clear(); }} type="button">
            <X size={12} />
          </button>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className={`dtpicker-dropdown ${dropUp ? 'dtpicker-dropup' : ''}`}
            initial={{ opacity: 0, y: dropUp ? 8 : -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropUp ? 8 : -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
          >
            <div className="dtpicker-calendar">
              <div className="dtpicker-cal-header">
                <button onClick={() => changeMonth(-1)} type="button"><CaretLeft size={14} /></button>
                <span>{MONTHS[viewMonth]} {viewYear}</span>
                <button onClick={() => changeMonth(1)} type="button"><CaretRight size={14} /></button>
              </div>
              <div className="dtpicker-weekdays">
                {WEEKDAYS.map(d => <span key={d}>{d}</span>)}
              </div>
              <div className="dtpicker-days">
                {days.map((d, i) => {
                  if (d === null) return <span key={`e${i}`} className="dtpicker-day empty" />;
                  const isSelected = selectedDate && selectedDate.year === viewYear && selectedDate.month === viewMonth && selectedDate.day === d;
                  const isToday = now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === d;
                  return (
                    <button
                      key={d}
                      className={`dtpicker-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                      onClick={() => selectDay(d)}
                      type="button"
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="dtpicker-time">
              <div className="dtpicker-time-label">
                <Clock size={12} />
                <span>Время</span>
              </div>
              <div className="dtpicker-time-controls">
                <div className="dtpicker-spin">
                  <button onClick={() => setHour(hours + 1)} type="button">▲</button>
                  <span>{pad(hours)}</span>
                  <button onClick={() => setHour(hours - 1)} type="button">▼</button>
                </div>
                <span className="dtpicker-colon">:</span>
                <div className="dtpicker-spin">
                  <button onClick={() => setMin(minutes + 1)} type="button">▲</button>
                  <span>{pad(minutes)}</span>
                  <button onClick={() => setMin(minutes - 1)} type="button">▼</button>
                </div>
              </div>
              <div className="dtpicker-time-actions">
                <button
                  className="dtpicker-apply"
                  onClick={() => {
                    const d = selectedDate || { year: viewYear, month: viewMonth, day: new Date().getDate() };
                    applyValue(d.year, d.month, d.day, hours, minutes);
                    setOpen(false);
                  }}
                  type="button"
                >
                  Применить
                </button>
              </div>
              <button className="dtpicker-today" onClick={goToday} type="button">Сейчас</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
