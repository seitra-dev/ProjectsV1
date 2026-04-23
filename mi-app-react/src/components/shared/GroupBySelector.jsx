import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown, Check, Circle, Flag, Folder, User,
  Calendar, Layers, X, ArrowUpAZ, ArrowDownZA
} from 'lucide-react';
import { TASK_STATUSES } from '../../constants/statuses';

// ============================================================================
// CONSTANTS
// ============================================================================

export const ROTATIONAL_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#fb923c'];

export const GROUP_OPTIONS = [
  { value: 'status',    label: 'Estado',           Icon: Circle   },
  { value: 'priority',  label: 'Prioridad',        Icon: Flag     },
  { value: 'project',   label: 'Proyecto',         Icon: Folder   },
  { value: 'assignee',  label: 'Persona asignada', Icon: User     },
  { value: 'due_date',  label: 'Fecha límite',      Icon: Calendar },
  { value: 'week',      label: 'Semana',           Icon: Layers   },
  { value: 'none',      label: 'Sin agrupación',   Icon: X        },
];

export const STATUS_GROUP = Object.fromEntries(
  Object.entries(TASK_STATUSES).map(([k, v]) => [k, { label: v.label, color: v.color }])
);

export const PRIORITY_GROUP = {
  urgent: { label: 'Urgente', color: '#ef4444' },
  high:   { label: 'Alta',    color: '#f97316' },
  medium: { label: 'Media',   color: '#6366f1' },
  low:    { label: 'Baja',    color: '#94a3b8' },
};

// ============================================================================
// WEEK HELPER
// ============================================================================

export function getWeekGroup(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr + 'T12:00:00');
  if (isNaN(date.getTime())) return null;
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `Semana ${weekNum} · ${d.getUTCFullYear()}`;
}

// ============================================================================
// BUILD GROUPS
// fieldMap lets callers adapt snake_case vs camelCase fields:
//   { projectId, assigneeId, startDate, dueDate }
// ============================================================================

const DEFAULT_FIELDS = {
  projectId:  'projectId',
  assigneeId: 'assigneeId',
  startDate:  'startDate',
  dueDate:    'dueDate',
};

export function buildGroups(groupBy, tasks, projects, users, fieldMap = DEFAULT_FIELDS, customFieldDefinitions = []) {
  const f = { ...DEFAULT_FIELDS, ...fieldMap };
  const SIN_FECHA = 'Sin fecha';

  if (typeof groupBy === 'string' && groupBy.startsWith('customField:')) {
    const fieldId = groupBy.slice('customField:'.length);
    const field = customFieldDefinitions.find((cf) => cf.id === fieldId);
    const getVal = (t) => {
      if (!field) return t.customFields?.[fieldId];
      if (field.type === 'roadmap_sync' || field.preset_type === 'roadmap_phase') {
        const v = t.roadmapPhaseId ?? t.customFields?.[fieldId];
        return v == null || v === '' ? null : v;
      }
      return t.customFields?.[fieldId];
    };
    const map = new Map();
    tasks.forEach((t) => {
      const raw = getVal(t);
      const sk = raw == null || raw === '' ? '__empty__' : String(raw);
      if (!map.has(sk)) map.set(sk, []);
      map.get(sk).push(t);
    });
    const groups = [];
    let idx = 0;
    map.forEach((groupTasks, sk) => {
      let label = sk === '__empty__' ? `Sin ${field?.name || 'valor'}` : sk;
      if (sk !== '__empty__' && field && (field.type === 'roadmap_sync' || field.preset_type === 'roadmap_phase')) {
        const t0 = groupTasks[0];
        const proj = projects.find((p) => p.id === t0?.projectId);
        const ph = proj?.roadmap?.phases?.find((p) => String(p.id) === sk);
        if (ph?.name) label = ph.name;
      }
      if (sk !== '__empty__' && field?.type === 'member_select') {
        const u = users.find((x) => String(x.id) === String(sk));
        if (u) label = u.name || u.email || label;
      }
      groups.push({
        key: `cf_${fieldId}_${sk}`,
        label,
        color: ROTATIONAL_COLORS[idx % ROTATIONAL_COLORS.length],
        tasks: groupTasks,
        defaultData: {},
      });
      idx += 1;
    });
    return groups.length
      ? groups
      : [{ key: 'cf_empty', label: 'Sin tareas', color: '#94a3b8', tasks: [], defaultData: {} }];
  }

  if (groupBy === 'none') {
    return [{ key: 'all', label: 'Todas las tareas', color: '#94a3b8', tasks, defaultData: {} }];
  }

  if (groupBy === 'status') {
    return Object.entries(STATUS_GROUP).map(([key, def]) => ({
      key, label: def.label, color: def.color,
      tasks: tasks.filter(t => t.status === key),
      defaultData: { status: key },
    }));
  }

  if (groupBy === 'priority') {
    return Object.entries(PRIORITY_GROUP).map(([key, def]) => ({
      key, label: def.label, color: def.color,
      tasks: tasks.filter(t => t.priority === key),
      defaultData: { priority: key },
    }));
  }

  if (groupBy === 'project') {
    const groups = [];
    const noProj = tasks.filter(t => !t[f.projectId]);
    if (noProj.length > 0)
      groups.push({ key: 'no_project', label: 'Sin proyecto', color: '#94a3b8', tasks: noProj, defaultData: {} });
    projects.forEach((p, idx) => {
      const pts = tasks.filter(t => t[f.projectId] === p.id);
      if (pts.length > 0)
        groups.push({
          key: `project_${p.id}`, label: p.name,
          color: p.color || ROTATIONAL_COLORS[idx % ROTATIONAL_COLORS.length],
          tasks: pts, defaultData: { [f.projectId]: p.id },
        });
    });
    return groups;
  }

  if (groupBy === 'assignee') {
    const groups = [];
    const unassigned = tasks.filter(t => !t[f.assigneeId]);
    if (unassigned.length > 0)
      groups.push({ key: 'unassigned', label: 'Sin asignar', color: '#94a3b8', tasks: unassigned, defaultData: {} });
    const seen = new Set();
    tasks.filter(t => t[f.assigneeId]).forEach(t => {
      const aid = t[f.assigneeId];
      if (seen.has(aid)) return;
      seen.add(aid);
      const u = users.find(u => u.id === aid);
      const ats = tasks.filter(x => x[f.assigneeId] === aid);
      groups.push({
        key: `assignee_${aid}`,
        label: u?.name || u?.email || `Usuario ${aid}`,
        color: ROTATIONAL_COLORS[groups.length % ROTATIONAL_COLORS.length],
        tasks: ats, defaultData: { [f.assigneeId]: aid },
      });
    });
    return groups;
  }

  if (groupBy === 'due_date' || groupBy === 'week') {
    const field = groupBy === 'due_date' ? f.dueDate : f.startDate;
    const map = {};
    tasks.forEach(t => {
      const k = getWeekGroup(t[field]) || SIN_FECHA;
      if (!map[k]) map[k] = [];
      map[k].push(t);
    });
    const sortedKeys = Object.keys(map).sort((a, b) => {
      if (a === SIN_FECHA) return 1;
      if (b === SIN_FECHA) return -1;
      const nA = parseInt(a.match(/\d+/)?.[0] || 0);
      const nB = parseInt(b.match(/\d+/)?.[0] || 0);
      const yA = parseInt(a.match(/\d{4}/)?.[0] || 0);
      const yB = parseInt(b.match(/\d{4}/)?.[0] || 0);
      return yA !== yB ? yA - yB : nA - nB;
    });
    return sortedKeys.map((k, idx) => ({
      key: k, label: k,
      color: k === SIN_FECHA ? '#94a3b8' : ROTATIONAL_COLORS[idx % ROTATIONAL_COLORS.length],
      tasks: map[k], defaultData: {},
    }));
  }

  return [{ key: 'all', label: 'Todas las tareas', color: '#94a3b8', tasks, defaultData: {} }];
}

// ============================================================================
// GROUP BY SELECTOR COMPONENT
// ============================================================================

export const GroupBySelector = ({ value, onChange, groupLabelOverride = null }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const current = GROUP_OPTIONS.find(o => o.value === value);
  const CurrentIcon = current?.Icon || Layers;
  const isActive = value !== 'none' || !!groupLabelOverride;
  const displayLabel = groupLabelOverride || current?.label || 'Estado';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          padding: '7px 14px',
          background: open ? '#f0f4ff' : isActive ? '#eef2ff' : 'white',
          border: `1px solid ${isActive ? '#6366f1' : '#e5e7eb'}`,
          borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
          color: isActive ? '#6366f1' : '#374151', fontWeight: 500,
          transition: 'all 0.15s', whiteSpace: 'nowrap'
        }}
      >
        <CurrentIcon size={14} />
        <span style={{ color: '#9ca3af', fontWeight: 400 }}>Grupo:</span>
        <span>{displayLabel}</span>
        <ChevronDown size={13} style={{ opacity: 0.5 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 400,
          background: 'white', borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid #f3f4f6', padding: '6px',
          minWidth: '220px'
        }}>
          {GROUP_OPTIONS.map((opt) => {
            const Icon = opt.Icon;
            const isSelected = opt.value === value;
            const isSeparator = opt.value === 'none';
            return (
              <React.Fragment key={opt.value}>
                {isSeparator && <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 0' }} />}
                <button
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', padding: '9px 12px', textAlign: 'left',
                    background: isSelected ? '#eef2ff' : 'transparent',
                    border: 'none', borderRadius: '10px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? '#6366f1' : '#374151',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Icon size={15} color={isSelected ? '#6366f1' : '#9ca3af'} />
                  <span style={{ flex: 1 }}>{opt.label}</span>
                  {isSelected && <Check size={14} color="#6366f1" strokeWidth={2.5} />}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SORT SELECTOR COMPONENT
// ============================================================================

export const SortSelector = ({ direction, onChange }) => (
  <button
    onClick={() => onChange(direction === 'asc' ? 'desc' : 'asc')}
    title={direction === 'asc' ? 'Orden ascendente (A→Z)' : 'Orden descendente (Z→A)'}
    style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '7px 12px', background: 'white',
      border: '1px solid #e5e7eb', borderRadius: '8px',
      cursor: 'pointer', fontSize: '13px', color: '#374151',
      fontWeight: 500, transition: 'all 0.15s', whiteSpace: 'nowrap'
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
  >
    {direction === 'asc'
      ? <ArrowUpAZ size={15} color="#9ca3af" />
      : <ArrowDownZA size={15} color="#9ca3af" />}
    {direction === 'asc' ? 'A → Z' : 'Z → A'}
  </button>
);

// ============================================================================
// GENERIC GROUP HEADER (colapsable con badge + contador + botón agregar)
// ============================================================================

export const GenericGroup = ({ label, color, tasks, isExpanded, onToggle, onAddTask, children }) => (
  <div>
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '7px 32px', background: 'white', cursor: 'pointer',
        borderBottom: '1px solid #f1f5f9', transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
    >
      {isExpanded
        ? <ChevronDown size={13} color="#cbd5e1" />
        : <ChevronRight size={13} color="#cbd5e1" />}

      {/* Dot + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0,
        }} />
        <span style={{
          fontSize: '12px', fontWeight: 700, color: '#374151', letterSpacing: '0.2px',
        }}>
          {label}
        </span>
      </div>

      {/* Task count bubble */}
      <div style={{
        minWidth: '20px', height: '20px', borderRadius: '10px',
        background: '#f1f5f9', color: '#64748b',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: 700, padding: '0 6px',
      }}>
        {tasks.length}
      </div>

      {/* Add task button */}
      <button
        onClick={(e) => { e.stopPropagation(); onAddTask(); }}
        style={{
          marginLeft: '4px', padding: '4px 10px', background: 'transparent',
          border: '1px solid transparent', color: '#94a3b8', cursor: 'pointer',
          fontSize: '12px', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '6px',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f1f5f9';
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.color = '#1e3a5f';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.color = '#94a3b8';
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Agregar tarea
      </button>
    </div>
    {isExpanded && (
      <div style={{ minHeight: tasks.length === 0 ? '32px' : 'auto' }}>
        {children}
      </div>
    )}
  </div>
);