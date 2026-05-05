import React, { useState, useEffect, useRef } from 'react';

const todayISO = () => new Date().toISOString().split('T')[0];
const fmtDate  = (d) => d ? new Date(d + 'T00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : null;
const uid      = () => Math.random().toString(36).slice(2, 8);

// ── Paleta coordinada con la app ──────────────────────────────────────────────
const C = {
  bg:          '#FAFBFC',            // neutral[50]
  bgPanel:     'rgba(255,255,255,0.6)',
  bgInput:     '#F4F6F8',            // neutral[100]
  text:        '#1F2933',            // neutral[900]
  textSub:     '#52606D',            // neutral[700]
  textMuted:   '#7B8794',            // neutral[500]
  border:      'rgba(31,41,51,0.08)',
  borderFocus: '#0066FF',
  accent:      '#0066FF',            // primary
  accentBg:    'rgba(0,102,255,0.06)',
  accentRing:  'rgba(0,102,255,0.15)',
  danger:      '#FF3D71',
  dangerBg:    'rgba(255,61,113,0.08)',
  success:     '#00D68F',
};

const NOTE_COLORS = [
  { id: 'white',    bg: '#FFFFFF',   label: 'Blanco'  },
  { id: 'blue',     bg: '#EFF6FF',   label: 'Azul'    },
  { id: 'teal',     bg: '#ECFDF5',   label: 'Menta'   },
  { id: 'rose',     bg: '#FFF1F2',   label: 'Rosa'    },
  { id: 'amber',    bg: '#FFFBEB',   label: 'Ámbar'   },
  { id: 'lavender', bg: '#F5F3FF',   label: 'Lavanda' },
];

const NOTE_BGS = [
  { id: 'plain', label: 'Liso'       },
  { id: 'lines', label: 'Líneas'     },
  { id: 'dots',  label: 'Puntos'     },
  { id: 'grid',  label: 'Cuadrícula' },
];

function getBgStyle(bgId, colorBg = '#FFFFFF') {
  switch (bgId) {
    case 'lines': return {
      background: colorBg,
      backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(31,41,51,0.05) 27px, rgba(31,41,51,0.05) 28px)',
      backgroundSize: '100% 28px',
      backgroundPosition: '0 36px',
    };
    case 'dots': return {
      background: colorBg,
      backgroundImage: 'radial-gradient(circle, rgba(31,41,51,0.1) 1px, transparent 1px)',
      backgroundSize: '18px 18px',
    };
    case 'grid': return {
      background: colorBg,
      backgroundImage:
        'linear-gradient(rgba(31,41,51,0.05) 1px, transparent 1px),' +
        'linear-gradient(90deg, rgba(31,41,51,0.05) 1px, transparent 1px)',
      backgroundSize: '18px 18px',
    };
    default: return { background: colorBg };
  }
}

const PRIORITY_COLOR = { low: C.success, mid: '#FFAB00', high: C.danger };

// ── TASK ITEM ─────────────────────────────────────────────────────────────────
function TaskItem({ task, onToggle, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: 'white',
      border: `1.5px solid ${expanded ? C.accentRing : C.border}`,
      borderRadius: '12px',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s, border-color 0.2s',
      opacity: task.done ? 0.5 : 1,
      boxShadow: expanded ? `0 0 0 3px ${C.accentRing}` : 'none',
    }}>
      {/* Main row */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          style={{
            width: '20px', height: '20px', borderRadius: '50%',
            border: `2px solid ${task.done ? C.accent : C.textMuted}`,
            background: task.done ? C.accent : 'transparent',
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', cursor: 'pointer',
          }}
        >
          {task.done && (
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M4 8.5l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        <span style={{
          flex: 1, fontSize: '14px', lineHeight: 1.45, fontWeight: 400,
          color: task.done ? C.textMuted : C.text,
          textDecoration: task.done ? 'line-through' : 'none',
          fontFamily: "'Figtree', sans-serif",
        }}>
          {task.text}
        </span>

        {task.date && (
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.accent, flexShrink: 0, opacity: 0.7 }} />
        )}

        <svg
          style={{ width: '15px', height: '15px', color: C.textMuted, flexShrink: 0, transition: 'transform 0.25s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          viewBox="0 0 16 16" fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Expanded area */}
      {expanded && (
        <div style={{
          padding: '10px 16px 14px 48px',
          borderTop: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column', gap: '10px',
          background: C.bg,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: C.textMuted, fontWeight: 600, width: '56px', flexShrink: 0, letterSpacing: '0.02em' }}>Fecha</span>
            <input
              type="date"
              value={task.date || ''}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onUpdate({ date: e.target.value })}
              style={{
                flex: 1, background: 'white', border: `1px solid ${C.border}`,
                borderRadius: '8px', padding: '6px 10px', fontFamily: 'inherit',
                fontSize: '12px', color: C.text, outline: 'none',
                boxShadow: '0 1px 3px rgba(31,41,51,0.04)',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: C.textMuted, fontWeight: 600, width: '56px', flexShrink: 0, letterSpacing: '0.02em', marginTop: '7px' }}>Nota</span>
            <textarea
              placeholder="Agrega un detalle…"
              value={task.note || ''}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onUpdate({ note: e.target.value })}
              style={{
                flex: 1, background: 'white', border: `1px solid ${C.border}`,
                borderRadius: '8px', padding: '6px 10px', fontFamily: 'inherit',
                fontSize: '12px', color: C.text, outline: 'none',
                resize: 'none', height: '48px', lineHeight: 1.5,
                boxShadow: '0 1px 3px rgba(31,41,51,0.04)',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: C.textMuted, fontWeight: 600, width: '56px', flexShrink: 0, letterSpacing: '0.02em' }}>Prioridad</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['low', 'mid', 'high'].map(p => (
                <div
                  key={p}
                  title={p === 'low' ? 'Baja' : p === 'mid' ? 'Media' : 'Alta'}
                  onClick={(e) => { e.stopPropagation(); onUpdate({ priority: p }); }}
                  style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: PRIORITY_COLOR[p],
                    border: `1.5px solid ${C.border}`,
                    cursor: 'pointer',
                    boxShadow: task.priority === p ? `0 0 0 2px white, 0 0 0 3.5px ${PRIORITY_COLOR[p]}` : 'none',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              style={{
                marginLeft: 'auto', fontSize: '12px', color: C.danger,
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 500, padding: '3px 8px',
                borderRadius: '6px', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = C.dangerBg}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── NOTE CARD ─────────────────────────────────────────────────────────────────
function NoteCard({ note, onUpdate, onDelete }) {
  const [showStyle, setShowStyle] = useState(false);
  const [hovered, setHovered]     = useState(false);
  const panelRef  = useRef(null);
  const colorInfo = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];

  useEffect(() => {
    if (!showStyle) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowStyle(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStyle]);

  const bgStyle = getBgStyle(note.bg, colorInfo.bg);

  return (
    <div
      style={{
        borderRadius: '14px', padding: '18px', position: 'relative',
        minHeight: '170px', display: 'flex', flexDirection: 'column', gap: '10px',
        border: `1px solid ${hovered ? 'rgba(0,102,255,0.15)' : 'rgba(31,41,51,0.06)'}`,
        boxShadow: hovered
          ? '0 8px 24px rgba(31,41,51,0.10), 0 2px 6px rgba(0,102,255,0.06)'
          : '0 2px 8px rgba(31,41,51,0.06)',
        transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        animation: 'mstd-noteIn 0.25s ease both',
        ...bgStyle,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <textarea
          placeholder="Título…"
          rows={1}
          value={note.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
          style={{
            fontFamily: "'Figtree', sans-serif",
            fontSize: '15px', color: C.text,
            border: 'none', background: 'transparent', outline: 'none',
            resize: 'none', width: '100%', fontWeight: 700, lineHeight: 1.35, cursor: 'text',
          }}
        />
        <div style={{ display: 'flex', gap: '3px', flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>
          <button
            title="Estilo"
            onClick={() => setShowStyle(s => !s)}
            style={{
              width: '26px', height: '26px', borderRadius: '7px', border: 'none',
              background: 'rgba(31,41,51,0.06)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSub,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = C.accentBg}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(31,41,51,0.06)'}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="6" cy="6" r="1" fill="currentColor" />
              <circle cx="10" cy="6" r="1" fill="currentColor" />
              <circle cx="8" cy="10.5" r="1" fill="currentColor" />
            </svg>
          </button>
          <button
            title="Eliminar"
            onClick={onDelete}
            style={{
              width: '26px', height: '26px', borderRadius: '7px', border: 'none',
              background: 'rgba(31,41,51,0.06)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textSub,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.dangerBg; e.currentTarget.style.color = C.danger; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(31,41,51,0.06)'; e.currentTarget.style.color = C.textSub; }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 5h10M8 8v4M6 8v4M5 5l.5 7h5l.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6.5 5V3.5h3V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <textarea
        placeholder="Escribe algo aquí…"
        value={note.body}
        onChange={(e) => onUpdate({ body: e.target.value })}
        style={{
          flex: 1, fontSize: '13px', color: C.textSub,
          border: 'none', background: 'transparent', outline: 'none',
          resize: 'none', fontFamily: "'Figtree', sans-serif",
          lineHeight: 1.65, cursor: 'text', minHeight: '72px',
        }}
      />

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
        <span style={{ fontSize: '10px', color: C.textMuted, fontWeight: 500, letterSpacing: '0.03em' }}>
          {fmtDate(note.created)}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {NOTE_COLORS.map(c => (
            <div
              key={c.id}
              title={c.label}
              onClick={() => onUpdate({ color: c.id })}
              style={{
                width: '13px', height: '13px', borderRadius: '50%', background: c.bg,
                cursor: 'pointer',
                border: `1.5px solid ${note.color === c.id ? C.accent : 'rgba(31,41,51,0.12)'}`,
                boxShadow: note.color === c.id ? `0 0 0 2px white, 0 0 0 3px ${C.accent}` : 'none',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.35)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
          ))}
        </div>
      </div>

      {/* Style Panel */}
      {showStyle && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute', bottom: '48px', right: '12px',
            background: 'white', border: `1px solid ${C.border}`,
            borderRadius: '12px', padding: '14px',
            boxShadow: '0 8px 32px rgba(31,41,51,0.12)',
            zIndex: 100, minWidth: '200px', animation: 'mstd-popIn 0.15s ease',
          }}
        >
          <p style={{ fontSize: '10px', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
            Fondo
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {NOTE_BGS.map(bg => (
              <div
                key={bg.id}
                title={bg.label}
                onClick={() => onUpdate({ bg: bg.id })}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer',
                  border: `2px solid ${note.bg === bg.id ? C.accent : C.border}`,
                  flexShrink: 0, overflow: 'hidden',
                  boxShadow: note.bg === bg.id ? `0 0 0 2px ${C.accentRing}` : 'none',
                  ...getBgStyle(bg.id, colorInfo.bg),
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: '10px', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
            Color
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {NOTE_COLORS.map(c => (
              <div
                key={c.id}
                title={c.label}
                onClick={() => onUpdate({ color: c.id })}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px', background: c.bg,
                  cursor: 'pointer',
                  border: `2px solid ${note.color === c.id ? C.accent : C.border}`,
                  boxShadow: note.color === c.id ? `0 0 0 2px ${C.accentRing}` : 'none',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const MySpaceToDo = () => {
  const todayLabel = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

  const defaultTasks = [
    { id: uid(), text: 'Revisar correos importantes',  done: false, date: todayISO(), priority: 'mid',  note: '' },
    { id: uid(), text: 'Preparar reunión de equipo',   done: false, date: '',          priority: 'high', note: 'Traer el resumen del Q1' },
    { id: uid(), text: 'Comprar mercado',              done: true,  date: '',          priority: 'low',  note: '' },
  ];

  const defaultNotes = [
    { id: uid(), title: 'Ideas para el proyecto', body: 'Explorar nuevas paletas de color\nRevisar referencias de Behance\nHablar con el cliente la próxima semana', color: 'blue',     bg: 'plain', created: todayISO() },
    { id: uid(), title: 'Lista de lectura',        body: 'Atomic Habits\nThe Design of Everyday Things\nShow Your Work',                                              color: 'teal',     bg: 'lines', created: todayISO() },
    { id: uid(), title: '',                        body: 'No olvidar revisar el sprint del viernes ✦',                                                                 color: 'lavender', bg: 'plain', created: todayISO() },
  ];

  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mstd_tasks') || 'null') || defaultTasks; }
    catch { return defaultTasks; }
  });

  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mstd_notes') || 'null') || defaultNotes; }
    catch { return defaultNotes; }
  });

  const [newTask, setNewTask]       = useState('');
  const [noteFilter, setNoteFilter] = useState('all');
  const [showDone]                  = useState(true);

  useEffect(() => { localStorage.setItem('mstd_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('mstd_notes', JSON.stringify(notes)); }, [notes]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks(t => [{ id: uid(), text: newTask.trim(), done: false, date: '', priority: 'mid', note: '' }, ...t]);
    setNewTask('');
  };

  const updateTask = (id, patch) => setTasks(t => t.map(x => x.id === id ? { ...x, ...patch } : x));
  const deleteTask = (id)        => setTasks(t => t.filter(x => x.id !== id));
  const toggleTask = (id)        => setTasks(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x));

  const addNote = () => {
    const pool = NOTE_COLORS.map(c => c.id);
    setNotes(n => [{ id: uid(), title: '', body: '', color: pool[Math.floor(Math.random() * pool.length)], bg: 'plain', created: todayISO() }, ...n]);
  };
  const updateNote = (id, patch) => setNotes(n => n.map(x => x.id === id ? { ...x, ...patch } : x));
  const deleteNote = (id)        => setNotes(n => n.filter(x => x.id !== id));

  const pending       = tasks.filter(t => !t.done);
  const done          = tasks.filter(t => t.done);
  const filteredNotes = noteFilter === 'all' ? notes : notes.filter(n => n.color === noteFilter);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '400px 1fr',
      gridTemplateRows: 'auto 1fr',
      height: '100%',
      overflow: 'hidden',
      background: C.bg,
      backgroundImage:
        'radial-gradient(ellipse 70% 50% at 10% 0%, rgba(0,102,255,0.04) 0%, transparent 60%),' +
        'radial-gradient(ellipse 50% 40% at 90% 100%, rgba(0,214,143,0.03) 0%, transparent 60%)',
      fontFamily: "'Figtree', sans-serif",
      color: C.text,
    }}>
      <style>{`
        @keyframes mstd-noteIn {
          from { opacity: 0; transform: scale(0.97) translateY(6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        @keyframes mstd-popIn {
          from { opacity: 0; transform: scale(0.93) translateY(-4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        .mstd-scroll::-webkit-scrollbar       { width: 4px; }
        .mstd-scroll::-webkit-scrollbar-track  { background: transparent; }
        .mstd-scroll::-webkit-scrollbar-thumb  { background: rgba(0,102,255,0.2); border-radius: 2px; }
        .mstd-task-input:focus {
          border-color: #0066FF !important;
          box-shadow: 0 0 0 3px rgba(0,102,255,0.12) !important;
        }
        .mstd-task-input::placeholder { color: #9AA5B1; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        gridColumn: '1 / -1',
        padding: '24px 36px 18px',
        display: 'flex', alignItems: 'center', gap: '14px',
        borderBottom: `1px solid ${C.border}`,
        background: 'rgba(250,251,252,0.88)',
        backdropFilter: 'blur(12px)',
        zIndex: 10,
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #0066FF, #0095FF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,102,255,0.25)',
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.9" />
            <rect x="9" y="2" width="5" height="5" rx="1.5" fill="white" opacity="0.6" />
            <rect x="2" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.6" />
            <rect x="9" y="9" width="5" height="5" rx="1.5" fill="white" opacity="0.9" />
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Mi espacio
          </h1>
          <span style={{ fontSize: '12px', color: C.textMuted, fontWeight: 400, textTransform: 'capitalize' }}>
            {todayLabel}
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            padding: '4px 10px', borderRadius: '20px',
            background: C.accentBg, border: `1px solid rgba(0,102,255,0.15)`,
            fontSize: '12px', fontWeight: 600, color: C.accent,
          }}>
            {pending.length} pendientes
          </div>
        </div>
      </header>

      {/* ── TO-DO PANEL ── */}
      <section style={{
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: C.bgPanel,
      }}>
        <div style={{ padding: '20px 28px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textMuted }}>
            Tareas
          </span>
        </div>

        {/* Add task input */}
        <div style={{ padding: '0 28px 16px', position: 'relative' }}>
          <form onSubmit={addTask}>
            <svg
              style={{ position: 'absolute', left: '44px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: C.textMuted, pointerEvents: 'none' }}
              viewBox="0 0 16 16" fill="none"
            >
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              className="mstd-task-input"
              placeholder="Agregar tarea…"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              style={{
                width: '100%', background: 'white',
                border: `1.5px solid ${C.border}`, borderRadius: '10px',
                padding: '11px 14px 11px 40px',
                fontFamily: "'Figtree', sans-serif",
                fontSize: '14px', color: C.text, outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: '0 1px 4px rgba(31,41,51,0.04)',
                boxSizing: 'border-box',
              }}
            />
          </form>
        </div>

        {/* Task list */}
        <div
          className="mstd-scroll"
          style={{ flex: 1, overflowY: 'auto', padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: '6px' }}
        >
          {pending.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task.id)}
              onUpdate={(patch) => updateTask(task.id, patch)}
              onDelete={() => deleteTask(task.id)}
            />
          ))}

          {done.length > 0 && showDone && (
            <>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textMuted, padding: '14px 0 6px', opacity: 0.7 }}>
                Completadas
              </div>
              {done.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id)}
                  onUpdate={(patch) => updateTask(task.id, patch)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
            </>
          )}

          {pending.length === 0 && done.length === 0 && (
            <div style={{ textAlign: 'center', color: C.textMuted, fontSize: '13px', marginTop: '48px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.25 }}>✓</div>
              Sin tareas por ahora
            </div>
          )}
        </div>
      </section>

      {/* ── NOTES PANEL ── */}
      <section style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '20px 32px 14px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={addNote}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              background: C.accent, color: 'white', border: 'none',
              borderRadius: '9px', padding: '9px 16px',
              fontFamily: "'Figtree', sans-serif",
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.15s, transform 0.15s, box-shadow 0.15s',
              boxShadow: '0 2px 8px rgba(0,102,255,0.25)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#0052CC'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,102,255,0.35)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,102,255,0.25)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Nueva nota
          </button>

          {/* Color filters */}
          <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setNoteFilter('all')}
              style={{
                fontSize: '12px', fontWeight: 600, padding: '5px 12px', borderRadius: '20px',
                border: `1.5px solid ${noteFilter === 'all' ? C.accent : C.border}`,
                background: noteFilter === 'all' ? C.accent : 'white',
                color:      noteFilter === 'all' ? 'white'  : C.textSub,
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: noteFilter === 'all' ? '0 2px 6px rgba(0,102,255,0.2)' : 'none',
              }}
            >
              Todas
            </button>
            {NOTE_COLORS.map(c => (
              <button
                key={c.id}
                title={c.label}
                onClick={() => setNoteFilter(c.id)}
                style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: c.bg, cursor: 'pointer',
                  border: `2px solid ${noteFilter === c.id ? C.accent : C.border}`,
                  boxShadow: noteFilter === c.id ? `0 0 0 2px white, 0 0 0 3.5px ${C.accent}` : 'none',
                  transition: 'all 0.15s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Notes grid */}
        <div
          className="mstd-scroll"
          style={{
            flex: 1, overflowY: 'auto', padding: '0 32px 32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '16px', alignContent: 'start',
          }}
        >
          {filteredNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onUpdate={(patch) => updateNote(note.id, patch)}
              onDelete={() => deleteNote(note.id)}
            />
          ))}

          {filteredNotes.length === 0 && (
            <div style={{
              gridColumn: '1 / -1', textAlign: 'center',
              color: C.textMuted, fontSize: '13px', marginTop: '48px',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.2 }}>📝</div>
              Sin notas {noteFilter !== 'all' ? 'con ese color' : 'por ahora'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MySpaceToDo;
