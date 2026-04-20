import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Briefcase, AlertTriangle, ChevronDown, RefreshCw, Users,
  BarChart2, Calendar, ChevronLeft, ChevronRight, Settings, X,
} from 'lucide-react';
import { DESIGN_TOKENS } from '../styles/tokens';
import { useApp } from '../context/AppContext';
import {
  getGlobalMetrics,
  getEnvironmentMetrics,
  getWeeklyTasks,
} from './metrics';
import ProjectsView from './ProjectsView';

// ============================================================================
// HELPERS
// ============================================================================

/** Devuelve el lunes de la semana actual + offset semanas */
const getMondayByOffset = (offset = 0) => {
  const today = new Date();
  const dow   = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/** "14 – 20 abr 2026" */
const formatWeekLabel = (monday) => {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const startStr = monday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const endStr   = sunday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startStr} – ${endStr}`;
};

const STATUS_LABELS = {
  todo:        'Por Hacer',
  pending:     'Pendiente',
  in_progress: 'En Curso',
  waiting:     'En Espera',
  paused:      'En Pausa',
  review:      'En Revisión',
  completed:   'Completada',
  blocked:     'Bloqueada',
  expedite:    'Expedite',
  done:        'Hecha',
};
const getStatusLabel = (s) => STATUS_LABELS[s] || s;

const STATUS_COLOR = {
  completed:   { bg: '#d1fae5', color: '#065f46' },
  in_progress: { bg: '#dbeafe', color: '#1e40af' },
  waiting:     { bg: '#e0f2fe', color: '#0369a1' },
  blocked:     { bg: '#fee2e2', color: '#991b1b' },
  expedite:    { bg: '#ffebee', color: '#c62828' },
  paused:      { bg: '#eceff1', color: '#37474f' },
  pending:     { bg: '#fff7ed', color: '#9a3412' },
  todo:        { bg: '#f3f4f6', color: '#374151' },
};
const statusStyle = (s) => STATUS_COLOR[s] || { bg: '#f3f4f6', color: '#374151' };

const PRIORITY_MAP = {
  urgent: { label: 'Urgente', bg: '#fee2e2', color: '#991b1b' },
  high:   { label: 'Alta',    bg: '#fef3c7', color: '#92400e' },
  medium: { label: 'Media',   bg: '#ede9fe', color: '#5b21b6' },
  low:    { label: 'Baja',    bg: '#f0fdf4', color: '#166534' },
};
const priorityStyle = (p) => PRIORITY_MAP[p] || PRIORITY_MAP.medium;

const isHigh = (p) => p === 'urgent' || p === 'high';

const avatarInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';

// Saturation color: green < 80%, orange 80-99%, red >= 100%
const satColor = (used, cap) => {
  if (!cap) return null;
  const pct = (used / cap) * 100;
  if (pct >= 100) return { text: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
  if (pct >= 80)  return { text: '#92400e', bg: '#fffbeb', border: '#fde68a' };
  return              { text: '#065f46', bg: '#ecfdf5', border: '#a7f3d0' };
};

// ============================================================================
// CapacitiesModal
// ============================================================================
function CapacitiesModal({ persons, capacities, onSave, onClose }) {
  const [draft, setDraft] = useState(() => {
    const d = {};
    persons.forEach(p => { d[p.id] = capacities[p.id] ?? 5; });
    return d;
  });

  const handleSave = () => {
    const cleaned = {};
    Object.entries(draft).forEach(([uid, val]) => {
      const n = parseInt(val, 10);
      if (!isNaN(n) && n >= 0) cleaned[uid] = n;
    });
    onSave(cleaned);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'white', borderRadius: 16, width: '100%', maxWidth: 460,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column', maxHeight: '80vh',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px', borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Settings size={17} color="#6366f1" />
            <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Capacidades por persona</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Subtitle */}
        <div style={{ padding: '10px 20px 4px', fontSize: 12, color: '#64748b' }}>
          Define cuántas tareas puede gestionar cada persona por semana.
        </div>

        {/* Person list */}
        <div style={{ overflowY: 'auto', padding: '8px 20px 12px', flex: 1 }}>
          {persons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>
              No hay personas registradas para este entorno.
            </div>
          ) : (
            persons.map(p => {
              const isUrl = typeof p.avatar === 'string' && (p.avatar.startsWith('http') || p.avatar.startsWith('data:'));
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid #f8fafc',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: '#6366f1', color: 'white', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                  }}>
                    {isUrl
                      ? <img src={p.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (p.avatar && p.avatar.length <= 4 ? p.avatar : avatarInitials(p.name))
                    }
                  </div>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#0f172a', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={draft[p.id] ?? 5}
                      onChange={e => setDraft(prev => ({ ...prev, [p.id]: e.target.value }))}
                      style={{
                        width: 56, padding: '6px 8px', textAlign: 'center',
                        border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13,
                        fontWeight: 700, color: '#334155', outline: 'none', fontFamily: 'inherit',
                      }}
                      onFocus={e => e.target.style.borderColor = '#6366f1'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>tareas/sem</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', border: '1px solid #e2e8f0', borderRadius: 8,
            background: 'white', color: '#475569', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Cancelar
          </button>
          <button onClick={handleSave} style={{
            padding: '8px 20px', border: 'none', borderRadius: 8,
            background: '#6366f1', color: 'white', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Guardar capacidades
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PersonCard
// ============================================================================
const PersonCard = ({ person }) => {
  const [expanded, setExpanded] = useState(person.overloaded);
  const total    = person.tasks.length;
  const active   = person.inProgress + person.pending;
  const progress = total > 0 ? Math.round((person.completed / total) * 100) : 0;
  const cap      = person.capacity;
  const sc       = satColor(active, cap);
  const isUrl    = typeof person.avatar === 'string' &&
    (person.avatar.startsWith('http') || person.avatar.startsWith('data:'));
  const shownTasks = expanded ? person.tasks : person.tasks.slice(0, 3);

  return (
    <div style={{
      background: 'white',
      borderRadius: 14,
      border: `2px solid ${person.overloaded ? '#fca5a5' : '#e5e7eb'}`,
      overflow: 'hidden',
      boxShadow: person.overloaded ? '0 0 0 3px rgba(239,68,68,0.10)' : '0 1px 4px rgba(0,0,0,0.05)',
      transition: 'box-shadow 0.2s',
    }}>
      {/* HEADER */}
      <div style={{
        padding: '16px 18px',
        background: person.overloaded ? '#fff5f5' : '#fafafa',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
          background: '#6366f1', color: 'white', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: isUrl ? undefined : 16, fontWeight: 700,
        }}>
          {isUrl
            ? <img src={person.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (person.avatar && person.avatar.length <= 4 ? person.avatar : avatarInitials(person.name))
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {person.name}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
            {total} tarea{total !== 1 ? 's' : ''} · {active} activa{active !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Capacity / overload badge */}
        {cap ? (
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            whiteSpace: 'nowrap', flexShrink: 0,
            background: sc?.bg, color: sc?.text, border: `1px solid ${sc?.border}`,
          }}>
            {active}/{cap} {active >= cap ? '⚠ Saturado' : '✓ OK'}
          </span>
        ) : person.overloaded ? (
          <span style={{ padding: '3px 10px', background: '#fee2e2', color: '#991b1b', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
            ⚠ Sobrecargado
          </span>
        ) : null}
      </div>

      {/* TAREAS */}
      <div style={{ padding: '8px 0' }}>
        {shownTasks.map((task) => {
          const ss = statusStyle(task.status);
          const ps = priorityStyle(task.priority);
          return (
            <div key={task.id} style={{
              padding: '9px 18px', borderBottom: '1px solid #f8fafc',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.title}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: ps.bg, color: ps.color }}>{ps.label}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: ss.bg, color: ss.color }}>{getStatusLabel(task.status)}</span>
                  {task.project?.name && (
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: '#f1f5f9', color: '#475569' }}>{task.project.name}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {person.tasks.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 18px 2px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#6366f1', fontWeight: 600 }}
          >
            <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            {expanded ? 'Ver menos' : `Ver ${person.tasks.length - 3} más`}
          </button>
        )}
      </div>

      {/* PROGRESO */}
      <div style={{ padding: '12px 18px 16px', borderTop: '1px solid #f1f5f9' }}>
        {/* Capacity bar (if set) */}
        {cap ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>
              <span>Capacidad: {active}/{cap} tareas activas</span>
              <span>{Math.min(Math.round((active / cap) * 100), 100)}%</span>
            </div>
            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{
                height: '100%',
                width: `${Math.min((active / cap) * 100, 100)}%`,
                background: sc?.text || '#10b981',
                borderRadius: 3, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>
              <span>{person.completed} completada{person.completed !== 1 ? 's' : ''}</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: person.overloaded ? '#ef4444' : '#10b981',
                borderRadius: 3, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </>
        )}
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
          <span>🟢 {person.inProgress} en curso</span>
          <span>⏸ {person.pending} pendientes</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// PersonRow — tabla de responsables
// ============================================================================
const PersonRow = ({ person, index, capacities }) => {
  const total    = person.tasks.length;
  const active   = person.inProgress + person.pending;
  const progress = total > 0 ? Math.round((person.completed / total) * 100) : 0;
  const cap      = capacities[person.id];
  const sc       = satColor(active, cap);
  const isUrl    = typeof person.avatar === 'string' &&
    (person.avatar.startsWith('http') || person.avatar.startsWith('data:'));
  const rowBg    = index % 2 === 0 ? '#ffffff' : '#fafafa';

  return (
    <tr style={{ background: rowBg }}>
      <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: '#6366f1', color: 'white', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
        }}>
          {isUrl
            ? <img src={person.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (person.avatar && person.avatar.length <= 4 ? person.avatar : avatarInitials(person.name))
          }
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{person.name}</span>
        {person.overloaded && (
          <span style={{ padding: '1px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>⚠</span>
        )}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569', textAlign: 'center' }}>{total}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#065f46', textAlign: 'center', fontWeight: 600 }}>{person.completed}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#1e40af', textAlign: 'center' }}>{person.inProgress}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#9a3412', textAlign: 'center' }}>{person.pending}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, textAlign: 'center' }}>
        {cap ? (
          <span style={{ fontWeight: 700, color: sc?.text, background: sc?.bg, border: `1px solid ${sc?.border}`, borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>
            {active}/{cap}
          </span>
        ) : (
          <span style={{ color: active > 10 ? '#dc2626' : '#475569', fontWeight: active > 10 ? 700 : 400 }}>{active}</span>
        )}
      </td>
      <td style={{ padding: '12px 20px 12px 16px', minWidth: 120 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: person.overloaded ? '#ef4444' : '#10b981', borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 11, color: '#94a3b8', width: 32, textAlign: 'right', fontWeight: 600 }}>{progress}%</span>
        </div>
      </td>
    </tr>
  );
};

// ============================================================================
// MAIN VIEW
// ============================================================================
export default function ManagementView() {
  const { currentUser, environments } = useApp();

  // ── Tabs / entorno ────────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState('week');
  const [selectedEnv, setSelectedEnv] = useState('all');

  // ── Datos ─────────────────────────────────────────────────────────────────
  const [metrics,     setMetrics]     = useState(null);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // ── Navegación de semana ──────────────────────────────────────────────────
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semana actual

  const weekStart = useMemo(() => getMondayByOffset(weekOffset), [weekOffset]);
  const weekLabel = useMemo(() => formatWeekLabel(weekStart),    [weekStart]);
  const isCurrentWeek = weekOffset === 0;

  // ── Filtro persona ────────────────────────────────────────────────────────
  const [selectedPerson, setSelectedPerson] = useState('all');

  // ── Búsqueda responsables (tabla) ─────────────────────────────────────────
  const [personSearch, setPersonSearch] = useState('');

  // ── Capacidades (persistidas en localStorage) ─────────────────────────────
  const [capacities, setCapacities] = useState(() => {
    try { return JSON.parse(localStorage.getItem('seitra_capacities') || '{}'); }
    catch { return {}; }
  });
  const [showCapModal, setShowCapModal] = useState(false);

  // ── Entornos visibles ─────────────────────────────────────────────────────
  const visibleEnvs = useMemo(() => environments, [environments]);

  // ── Carga de datos ────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    setError('');
    try {
      const [metricsData, weekly] = await Promise.all([
        selectedEnv === 'all'
          ? getGlobalMetrics(currentUser.id, currentUser.system_role)
          : getEnvironmentMetrics(selectedEnv),
        getWeeklyTasks(selectedEnv, weekStart),
      ]);
      setMetrics(metricsData);
      setWeeklyTasks(weekly || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[ManagementView] Error:', err);
      setError(err.message || 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, currentUser?.system_role, selectedEnv, weekStart]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Procesamiento de tareas semanales ─────────────────────────────────────
  // Incluye todas las tareas activas de la semana (no solo in_progress)
  const activeTasks = useMemo(() =>
    (weeklyTasks || []).filter(t => !['completed', 'done'].includes(t.status)),
    [weeklyTasks]
  );

  // Agrupar por persona + calcular saturación basada en capacidad
  const weeklyByPerson = useMemo(() => {
    const map = {};
    activeTasks.forEach((task) => {
      const uid = task.assignee_id || 'unassigned';
      if (!map[uid]) {
        const cap = uid !== 'unassigned' ? (capacities[uid] || null) : null;
        map[uid] = {
          id:    uid,
          name:  task.assignee?.name || 'Sin asignar',
          avatar: task.assignee?.avatar || '👤',
          tasks: [], completed: 0, inProgress: 0, pending: 0,
          overloaded: false, capacity: cap,
        };
      }
      map[uid].tasks.push(task);
      if (task.status === 'completed')   map[uid].completed++;
      else if (task.status === 'in_progress') map[uid].inProgress++;
      else map[uid].pending++;

      const active = map[uid].inProgress + map[uid].pending;
      const cap    = map[uid].capacity;
      map[uid].overloaded = cap ? (active >= cap) : (active > 10);
    });
    return Object.values(map).sort((a, b) => b.tasks.length - a.tasks.length);
  }, [activeTasks, capacities]);

  // Filtrado por persona seleccionada
  const visibleWeeklyByPerson = useMemo(() => {
    if (selectedPerson === 'all') return weeklyByPerson;
    return weeklyByPerson.filter(p => p.id === selectedPerson);
  }, [weeklyByPerson, selectedPerson]);

  // Totales semanales
  const weeklyStats = useMemo(() => ({
    total:     activeTasks.length,
    highPrio:  activeTasks.filter(t => isHigh(t.priority)).length,
    blocked:   activeTasks.filter(t => t.status === 'blocked').length,
    people:    weeklyByPerson.filter(p => p.id !== 'unassigned').length,
  }), [activeTasks, weeklyByPerson]);

  // Sobrecargados
  const overloaded = useMemo(() =>
    weeklyByPerson.filter(p => p.overloaded && p.id !== 'unassigned'),
    [weeklyByPerson]
  );

  // Personas para el dropdown y el modal (con tareas + métricas globales)
  const allPersons = useMemo(() => {
    const map = {};
    // Primero de métricas globales (más completo)
    (metrics?.tasksByPerson || []).forEach(p => { if (p.id !== 'unassigned') map[p.id] = p; });
    // Complementar con semanales
    weeklyByPerson.forEach(p => { if (p.id !== 'unassigned' && !map[p.id]) map[p.id] = p; });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [metrics?.tasksByPerson, weeklyByPerson]);

  // Filtro tabla responsables
  const filteredPersons = useMemo(() => {
    let src = metrics?.tasksByPerson || [];
    if (selectedPerson !== 'all') src = src.filter(p => p.id === selectedPerson);
    if (!personSearch.trim()) return src;
    const q = personSearch.toLowerCase();
    return src.filter(p => p.name.toLowerCase().includes(q));
  }, [metrics?.tasksByPerson, selectedPerson, personSearch]);

  // ── Guardar capacidades ───────────────────────────────────────────────────
  const handleSaveCapacities = (newCaps) => {
    setCapacities(newCaps);
    localStorage.setItem('seitra_capacities', JSON.stringify(newCaps));
    setShowCapModal(false);
  };

  // ── Acceso ────────────────────────────────────────────────────────────────
  const canAccess = ['super_admin', 'admin', 'project_manager'].includes(currentUser?.system_role);
  if (!canAccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <AlertTriangle size={40} color="#f59e0b" />
        <div style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Acceso restringido</div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>Esta vista es solo para jefes y coordinadores.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 24px', maxWidth: 1400, margin: '0 auto', fontFamily: DESIGN_TOKENS.typography.fontFamily }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart2 size={18} color="#6366f1" />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Gestión</span>
          {lastUpdated && (
            <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 400 }}>
              · {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Dropdown entorno */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedEnv}
              onChange={e => setSelectedEnv(e.target.value)}
              style={{ appearance: 'none', padding: '7px 30px 7px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#334155', background: 'white', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
            >
              <option value="all">Todos los equipos</option>
              {visibleEnvs.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
          </div>

          {/* Botón refrescar */}
          <button onClick={loadData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 11px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: loading ? 'wait' : 'pointer', fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: 'inherit' }}>
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Cargando…' : 'Actualizar'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} />{error}
        </div>
      )}

      {/* ── ALERTA SOBRECARGA ─────────────────────────────────────────────── */}
      {overloaded.length > 0 && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 8px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 20, marginBottom: 16, maxWidth: '100%' }}>
          <AlertTriangle size={13} color="#f97316" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#9a3412', whiteSpace: 'nowrap' }}>
            {overloaded.length} saturada{overloaded.length !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 12, color: '#c2410c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            · {overloaded.map(p => p.name).join(', ')}
          </span>
        </div>
      )}

      {/* ── TAB TOGGLE ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'white', padding: '5px', borderRadius: 12, width: 'fit-content', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {[
          { id: 'projects', label: 'Proyectos', icon: <Briefcase size={15} /> },
          { id: 'week',     label: 'Semana',    icon: <Calendar size={15} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ padding: '9px 22px', border: 'none', borderRadius: 8, cursor: 'pointer', background: activeTab === tab.id ? '#6366f1' : 'transparent', color: activeTab === tab.id ? 'white' : '#6b7280', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.2s' }}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: SEMANA ───────────────────────────────────────────────────── */}
      {activeTab === 'week' && (
        <>
          {/* BARRA UNIFICADA: navegación + resumen */}
          <div style={{
            background: 'white', borderRadius: 12, border: '1px solid #f1f5f9',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 24, overflow: 'hidden',
          }}>
            {/* Fila superior: controles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', flexWrap: 'wrap' }}>
              {/* ← Hoy → */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => setWeekOffset(w => w - 1)} title="Semana anterior"
                  style={{ padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', display: 'flex', color: '#475569' }}>
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => setWeekOffset(0)}
                  style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: isCurrentWeek ? '#0f172a' : 'white', color: isCurrentWeek ? 'white' : '#475569', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                  Hoy
                </button>
                <button onClick={() => setWeekOffset(w => w + 1)} title="Semana siguiente"
                  style={{ padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', display: 'flex', color: '#475569' }}>
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Rango de fechas */}
              <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', flex: 1, whiteSpace: 'nowrap' }}>
                {weekLabel}
              </span>

              {/* Dropdown personas */}
              <div style={{ position: 'relative' }}>
                <select value={selectedPerson} onChange={e => setSelectedPerson(e.target.value)}
                  style={{ appearance: 'none', padding: '7px 30px 7px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#334155', background: 'white', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                  <option value="all">Todas las personas</option>
                  {allPersons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }} />
              </div>

              {/* Botón capacidades */}
              <button onClick={() => setShowCapModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                <Settings size={13} />
                Capacidades
              </button>
            </div>

            {/* Divisor */}
            <div style={{ height: 1, background: '#f1f5f9' }} />

            {/* Fila inferior: métricas en blanco/negro */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '0' }}>
              {[
                { label: 'Tareas activas',   value: weeklyStats.total    },
                { label: 'Alta prioridad',   value: weeklyStats.highPrio },
                { label: 'Bloqueadas',       value: weeklyStats.blocked  },
                { label: 'Personas activas', value: weeklyStats.people   },
              ].map((s, i, arr) => (
                <div key={s.label} style={{
                  padding: '14px 20px',
                  borderRight: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
                  display: 'flex', flexDirection: 'column', gap: 2,
                }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                    {loading ? '—' : s.value}
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CARDS POR PERSONA */}
          <section style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Calendar size={18} color="#6366f1" />
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Planeación Semanal</h2>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, marginLeft: 4 }}>{weekLabel}</span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>Cargando datos semanales…</div>
            ) : visibleWeeklyByPerson.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', background: '#f8fafc', borderRadius: 12, color: '#94a3b8', fontSize: 14 }}>
                {selectedPerson !== 'all'
                  ? 'Esta persona no tiene tareas activas para la semana seleccionada.'
                  : 'No hay tareas activas para esta semana en el equipo seleccionado.'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {visibleWeeklyByPerson.map(person => (
                  <PersonCard key={person.id} person={person} />
                ))}
              </div>
            )}
          </section>

          {/* TABLA TAREAS POR RESPONSABLE */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={18} color="#6366f1" />
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Tareas por Responsable</h2>
                {filteredPersons.length > 0 && (
                  <span style={{ padding: '2px 10px', background: '#eef2ff', color: '#4f46e5', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {filteredPersons.length}
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="Buscar persona…"
                value={personSearch}
                onChange={e => setPersonSearch(e.target.value)}
                style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', width: 200, fontFamily: 'inherit', color: '#334155' }}
              />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Cargando…</div>
            ) : filteredPersons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 14 }}>
                {personSearch ? 'No hay resultados para esa búsqueda.' : 'No hay datos de responsables.'}
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Responsable', 'Total', 'Completadas', 'En Curso', 'Pendientes', 'Activas', 'Progreso'].map(h => (
                        <th key={h} style={{ padding: '11px 16px', textAlign: h === 'Responsable' ? 'left' : 'center', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPersons.map((person, i) => (
                      <PersonRow key={person.id} person={person} index={i} capacities={capacities} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* ── TAB: PROYECTOS ────────────────────────────────────────────────── */}
      {activeTab === 'projects' && (
        <ProjectsView selectedEnvironment={selectedEnv} onRefresh={loadData} />
      )}

      {/* ── MODAL CAPACIDADES ─────────────────────────────────────────────── */}
      {showCapModal && (
        <CapacitiesModal
          persons={allPersons}
          capacities={capacities}
          onSave={handleSaveCapacities}
          onClose={() => setShowCapModal(false)}
        />
      )}
    </div>
  );
}
