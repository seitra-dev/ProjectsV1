import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Briefcase, Flag, CheckSquare, GitBranch,
  ChevronRight, ChevronDown, Plus, Trash2,
  ListChecks, CheckCircle2, Clock, AlertTriangle,
  RefreshCw, Search, Globe, Globe2,
} from 'lucide-react';
import { dbUsers, dbProjects } from '../lib/database';
import { useApp } from '../context/AppContext';
import { getGlobalMetrics, getEnvironmentMetrics } from './metrics';
import CreateProjectModal   from './CreateProjectModal';
import CreateMilestoneModal from './CreateMilestoneModal';
import CreateTaskModal      from './CreateTaskModal';
import { PROJECT_STATUS_DROPDOWN, getTaskStatus, getProjectStatus } from '../constants/statuses';
import StatusBadge from './shared/StatusBadge';

// ============================================================================
// COLORES
// ============================================================================
const PRIORITY_COLOR = {
  urgent: { bg: '#fee2e2', text: '#991b1b', label: 'Urgente' },
  high:   { bg: '#fed7aa', text: '#9a3412', label: 'Alta'    },
  medium: { bg: '#dbeafe', text: '#1e40af', label: 'Media'   },
  low:    { bg: '#f3f4f6', text: '#6b7280', label: 'Baja'    },
};
const pColor = (p) => PRIORITY_COLOR[p] || PRIORITY_COLOR.medium;
const sColor = (s) => { const c = getProjectStatus(s) || getTaskStatus(s); return { bg: c.bg, text: c.color, label: c.label }; };

const calcDays = (start, end) => {
  if (!start || !end) return '—';
  const d = Math.round((new Date(end) - new Date(start)) / 86400000);
  return d >= 0 ? `${d}d` : '—';
};
const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return d; }
};
const avatarInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';

// ============================================================================
// SUBCOMPONENTES PEQUEÑOS
// ============================================================================
const ProgressBar = ({ progress = 0, color = '#6366f1', thin = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
    <div style={{ flex: 1, height: thin ? 4 : 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${Math.min(100, Math.max(0, progress))}%`,
        background: color, borderRadius: 3, transition: 'width 0.4s',
      }} />
    </div>
    <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, minWidth: 28, textAlign: 'right' }}>
      {progress}%
    </span>
  </div>
);

const Avatar = ({ user, size = 22 }) => {
  if (!user) return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#e5e7eb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, color: '#9ca3af', fontWeight: 700 }}>?</div>
  );
  const isUrl = typeof user.avatar === 'string' && (user.avatar.startsWith('http') || user.avatar.startsWith('data:'));
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#6366f1', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: 'white' }}>
      {isUrl ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
             : (user.avatar && user.avatar.length <= 4 ? user.avatar : avatarInitials(user.name || user.email || ''))}
    </div>
  );
};

const TypeBadge = ({ type }) => {
  const cfg = {
    project:  { label: 'PROYECTO',  bg: '#eef2ff', color: '#6366f1', icon: <Briefcase size={10} /> },
    milestone:{ label: 'HITO',      bg: '#f5f3ff', color: '#8b5cf6', icon: <Flag size={10} /> },
    task:     { label: 'TAREA',     bg: '#ecfdf5', color: '#10b981', icon: <CheckSquare size={10} /> },
    subtask:  { label: 'SUBTAREA',  bg: '#f9fafb', color: '#6b7280', icon: <GitBranch size={10} /> },
  }[type] || {};
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 4, background: cfg.bg, color: cfg.color, fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {cfg.icon}{cfg.label}
    </span>
  );
};

// Badge de entorno + workspace
const EnvBadge = ({ env, ws }) => {
  if (!env && !ws) return <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>;
  const envColor = env?.color || '#6366f1';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      {env && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700,
          background: `${envColor}18`, color: envColor,
          maxWidth: 140, overflow: 'hidden',
        }}>
          <span style={{ flexShrink: 0 }}>{env.icon || '📁'}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{env.name}</span>
        </div>
      )}
      {ws && (
        <span style={{ fontSize: 10, color: '#94a3b8', paddingLeft: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
          {ws.name}
        </span>
      )}
    </div>
  );
};

const Td = ({ children, style = {} }) => (
  <td style={{ padding: '9px 10px', verticalAlign: 'middle', ...style }}>{children}</td>
);

// ============================================================================
// MENÚ "+" DROPDOWN
// ============================================================================
function AddMenu({ onAddMilestone, onAddTask }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        title="Añadir elemento"
        onClick={() => setOpen(v => !v)}
        style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: 6, padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#6b7280', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280'; }}
      >
        <Plus size={13} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', zIndex: 200, minWidth: 160, overflow: 'hidden' }}>
          <button onClick={() => { onAddMilestone(); setOpen(false); }}
            style={{ width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#8b5cf6', fontFamily: 'inherit', textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f3ff'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Flag size={13} /> Añadir Hito
          </button>
          <button onClick={() => { onAddTask(); setOpen(false); }}
            style={{ width: '100%', padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#10b981', fontFamily: 'inherit', textAlign: 'left' }}
            onMouseEnter={e => e.currentTarget.style.background = '#ecfdf5'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <CheckSquare size={13} /> Añadir Tarea
          </button>
        </div>
      )}
    </div>
  );
}

const ActionBtn = ({ icon, title, color, onClick }) => (
  <button title={title} onClick={onClick}
    style={{ background: 'none', border: '1px solid transparent', borderRadius: 6, padding: '3px 5px', cursor: 'pointer', display: 'flex', alignItems: 'center', color, transition: 'all 0.15s' }}
    onMouseEnter={e => { e.currentTarget.style.background = color + '15'; e.currentTarget.style.borderColor = color + '40'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
  >
    {icon}
  </button>
);

// ============================================================================
// KPI CARD
// ============================================================================
const METRIC_COLORS = [
  { color: '#3b82f6', bg: '#eff6ff' },
  { color: '#8b5cf6', bg: '#f5f3ff' },
  { color: '#6366f1', bg: '#eef2ff' },
  { color: '#10b981', bg: '#ecfdf5' },
  { color: '#f59e0b', bg: '#fffbeb' },
  { color: '#ef4444', bg: '#fef2f2' },
  { color: '#64748b', bg: '#f1f5f9' },
];
const KpiCard = ({ label, value, icon, colorIdx = 0, loading }) => {
  const { color, bg } = METRIC_COLORS[colorIdx];
  return (
    <div style={{
      background: 'white', padding: '10px 14px', borderRadius: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
          {loading ? '—' : (value ?? 0)}
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap' }}>
          {label}
        </div>
      </div>
    </div>
  );
};

// FILAS DE TABLA
// ============================================================================
const ProjectRow = ({ project, expanded, onToggle, users, onAddMilestone, onAddTask, onDelete }) => {
  const owner = users.find(u => u.id === (project.owner_id || project.leaderId));
  const sc    = sColor(project.status || 'active');
  const pc    = pColor(project.priority || 'medium');
  const startDate = project.start_date || project.startDate;
  const endDate   = project.end_date   || project.endDate;

  return (
    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
      <Td style={{ minWidth: 110 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#6366f1', flexShrink: 0 }}>
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
          <TypeBadge type="project" />
        </div>
      </Td>
      <Td style={{ maxWidth: 280 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</div>
        <ProgressBar progress={project._progress || 0} color="#6366f1" />
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{project._completedTasks}/{project._totalTasks} tareas</div>
      </Td>
      <Td style={{ minWidth: 150 }}>
        <EnvBadge env={project._environment} ws={project._workspace} />
      </Td>
      <Td><span style={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(startDate)}</span></Td>
      <Td><span style={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(endDate)}</span></Td>
      <Td style={{ textAlign: 'center' }}><span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>{calcDays(startDate, endDate)}</span></Td>
      <Td>
        <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: pc.bg, color: pc.text }}>{pc.label}</span>
      </Td>
      <Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar user={owner} size={22} />
          <span style={{ fontSize: 12, color: '#374151' }}>{owner?.name || owner?.email || '—'}</span>
        </div>
      </Td>
      <Td>
        <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.text }}>{sc.label}</span>
      </Td>
      <Td>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <AddMenu onAddMilestone={onAddMilestone} onAddTask={onAddTask} />
          <ActionBtn icon={<Trash2 size={13} />} title="Eliminar proyecto" color="#ef4444" onClick={onDelete} />
        </div>
      </Td>
    </tr>
  );
};

const MilestoneRow = ({ milestone, expanded, onToggle, users, onAddTask, onDelete }) => {
  const owner = users.find(u => u.id === milestone.responsableId);
  return (
    <tr style={{ background: 'white', borderBottom: '1px solid #f1f5f9' }}>
      <Td style={{ minWidth: 110 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 22 }}>
          <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#8b5cf6', flexShrink: 0 }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <TypeBadge type="milestone" />
        </div>
      </Td>
      <Td style={{ maxWidth: 280 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: milestone.color || '#8b5cf6', flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: 13, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{milestone.name}</span>
        </div>
        <ProgressBar progress={milestone._progress || 0} color={milestone.color || '#8b5cf6'} thin />
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{milestone._completedTasks}/{milestone._totalTasks} tareas</div>
      </Td>
      <Td />
      <Td><span style={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(milestone.startDate)}</span></Td>
      <Td><span style={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(milestone.endDate)}</span></Td>
      <Td style={{ textAlign: 'center' }}><span style={{ fontSize: 12, color: '#6b7280' }}>{calcDays(milestone.startDate, milestone.endDate)}</span></Td>
      <Td />
      <Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar user={owner} size={20} />
          <span style={{ fontSize: 12, color: '#374151' }}>{owner?.name || '—'}</span>
        </div>
      </Td>
      <Td />
      <Td>
        <div style={{ display: 'flex', gap: 3 }}>
          <ActionBtn icon={<Plus size={13} />} title="Añadir tarea" color="#10b981" onClick={onAddTask} />
          <ActionBtn icon={<Trash2 size={13} />} title="Eliminar hito" color="#ef4444" onClick={onDelete} />
        </div>
      </Td>
    </tr>
  );
};

const TaskRow = ({ task, expanded, onToggle, users, hasSubtasks }) => {
  const assignee = task.assignee || users.find(u => u.id === task.assignee_id);
  const sc = sColor(task.status);
  const pc = pColor(task.priority);
  return (
    <tr style={{ background: '#fafbff', borderBottom: '1px solid #f3f4f6' }}>
      <Td style={{ minWidth: 110 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 44 }}>
          {hasSubtasks ? (
            <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#10b981', flexShrink: 0 }}>
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          ) : <span style={{ width: 19 }} />}
          <TypeBadge type="task" />
        </div>
      </Td>
      <Td style={{ maxWidth: 280 }}>
        <div style={{ fontWeight: 500, fontSize: 13, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
        {task.description && (
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{task.description}</div>
        )}
      </Td>
      <Td />
      <Td><span style={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(task.start_date)}</span></Td>
      <Td><span style={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(task.end_date)}</span></Td>
      <Td style={{ textAlign: 'center' }}><span style={{ fontSize: 12, color: '#6b7280' }}>{calcDays(task.start_date, task.end_date)}</span></Td>
      <Td><span style={{ padding: '3px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: pc.bg, color: pc.text }}>{pc.label}</span></Td>
      <Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Avatar user={assignee} size={20} />
          <span style={{ fontSize: 12, color: '#374151' }}>{assignee?.name || assignee?.email || '—'}</span>
        </div>
      </Td>
      <Td><span style={{ padding: '3px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.text }}>{sc.label}</span></Td>
      <Td />
    </tr>
  );
};

const SubtaskRow = ({ subtask, users }) => {
  const assignee = subtask.assignee || users.find(u => u.id === subtask.assignee_id);
  const sc = sColor(subtask.status);
  return (
    <tr style={{ background: 'white', borderBottom: '1px solid #f9fafb' }}>
      <Td style={{ minWidth: 110 }}>
        <div style={{ paddingLeft: 64 }}><TypeBadge type="subtask" /></div>
      </Td>
      <Td><div style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{subtask.title}</div></Td>
      <Td />
      <Td><span style={{ fontSize: 11, color: '#9ca3af' }}>{fmtDate(subtask.start_date)}</span></Td>
      <Td><span style={{ fontSize: 11, color: '#9ca3af' }}>{fmtDate(subtask.end_date)}</span></Td>
      <Td style={{ textAlign: 'center' }}><span style={{ fontSize: 11, color: '#9ca3af' }}>{calcDays(subtask.start_date, subtask.end_date)}</span></Td>
      <Td />
      <Td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Avatar user={assignee} size={18} />
          <span style={{ fontSize: 11, color: '#374151' }}>{assignee?.name || '—'}</span>
        </div>
      </Td>
      <Td><span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.text }}>{sc.label}</span></Td>
      <Td />
    </tr>
  );
};

const TABLE_HEADERS = [
  'TIPO', 'NOMBRE / PROGRESO', 'EQUIPO', 'INICIO', 'FIN',
  'DÍAS', 'PRIORIDAD', 'RESPONSABLE', 'ESTADO', 'ACCIONES',
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function ProjectsView({ selectedEnvironment, onRefresh: externalRefresh }) {
  const { currentUser } = useApp();

  // ── Datos ─────────────────────────────────────────────────────────────────
  const [rawProjects, setRawProjects] = useState([]);
  const [rawTasks,    setRawTasks]    = useState([]);
  const [users,       setUsers]       = useState([]);
  const [workspaces,  setWorkspaces]  = useState([]);
  const [envList,     setEnvList]     = useState([]);   // entornos visibles
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  // ── Expansión ─────────────────────────────────────────────────────────────
  const [expandedProjects,   setExpandedProjects]   = useState(new Set());
  const [expandedMilestones, setExpandedMilestones] = useState(new Set());
  const [expandedTasks,      setExpandedTasks]      = useState(new Set());

  // ── Filtros ───────────────────────────────────────────────────────────────
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterEnv,      setFilterEnv]      = useState('all');
  const [searchText,     setSearchText]     = useState('');

  // ── Modales ───────────────────────────────────────────────────────────────
  const [modal,    setModal]    = useState(null);   // 'project'|'milestone'|'task'
  const [modalCtx, setModalCtx] = useState({});

  // ── Carga ─────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    setError('');
    try {
      const [metricsData, usersData] = await Promise.all([
        selectedEnvironment && selectedEnvironment !== 'all'
          ? getEnvironmentMetrics(selectedEnvironment)
          : getGlobalMetrics(currentUser.id, currentUser.system_role),
        dbUsers.getAll(),
      ]);

      setRawProjects(metricsData.projects || []);
      setRawTasks(metricsData.tasks || []);
      setUsers(usersData);
      setWorkspaces(metricsData.workspaces || []);
      setEnvList(metricsData.environments || []);
    } catch (err) {
      console.error('[ProjectsView]', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, currentUser?.system_role, selectedEnvironment]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = () => { loadData(); externalRefresh?.(); };

  // ── Mapas auxiliares ──────────────────────────────────────────────────────
  const wsMap = useMemo(() =>
    Object.fromEntries(workspaces.map(w => [w.id, w])),
    [workspaces]
  );

  // ── Jerarquía ─────────────────────────────────────────────────────────────
  const hierarchy = useMemo(() => {
    return rawProjects.map(project => {
      const projectTasks = rawTasks.filter(t => t.project_id === project.id && !t.is_deleted);
      const rootTasks    = projectTasks.filter(t => !t.parent_id);

      const phases = (project.roadmap?.phases || []).map(phase => {
        const phaseTasks  = rootTasks.filter(t => t.roadmap_phase_id === phase.id);
        const completedPh = phaseTasks.filter(t => t.status === 'completed').length;
        return {
          ...phase,
          _tasks: phaseTasks.map(task => ({
            ...task,
            _subtasks: projectTasks.filter(s => s.parent_id === task.id),
          })),
          _totalTasks:     phaseTasks.length,
          _completedTasks: completedPh,
          _progress: phaseTasks.length > 0
            ? Math.round((completedPh / phaseTasks.length) * 100) : 0,
        };
      });

      const unphased = rootTasks
        .filter(t => !t.roadmap_phase_id)
        .map(task => ({ ...task, _subtasks: projectTasks.filter(s => s.parent_id === task.id) }));

      const completedAll = rootTasks.filter(t => t.status === 'completed').length;
      const ws  = project._workspace  || wsMap[project.workspace_id]  || null;
      const env = project._environment || null;

      return {
        ...project,
        _phases:         phases,
        _unphasedTasks:  unphased,
        _totalTasks:     rootTasks.length,
        _completedTasks: completedAll,
        _progress: rootTasks.length > 0
          ? Math.round((completedAll / rootTasks.length) * 100)
          : (project.progress || 0),
        _area:        (project.tags && project.tags[0]) || ws?.name || '—',
        _workspace:   ws,
        _environment: env,
      };
    });
  }, [rawProjects, rawTasks, wsMap]);

  // helper: un proyecto es "general" si no tiene equipo/entorno asignado
  const isGeneral = (p) => {
    const envId   = p._environment?.id || p.environment_id;
    const wsEnvId = p._workspace?.environment_id;
    return !envId && !wsEnvId;
  };

  // ── Filtros aplicados ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = hierarchy;
    if (filterStatus   !== 'all') list = list.filter(p => (p.status || 'active') === filterStatus);
    if (filterPriority !== 'all') list = list.filter(p => (p.priority || 'medium') === filterPriority);
    if (filterEnv      !== 'all') list = list.filter(p => {
      const envId   = p._environment?.id || p.environment_id;
      const wsEnvId = p._workspace?.environment_id;
      // incluir proyectos del equipo seleccionado + proyectos generales (sin equipo)
      return envId === filterEnv || wsEnvId === filterEnv || isGeneral(p);
    });
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(p => p.name?.toLowerCase().includes(q));
    }
    return list;
  }, [hierarchy, filterStatus, filterPriority, filterEnv, searchText]);

  // KPIs calculados del entorno seleccionado (+ generales); ignora status/priority/search
  const envKpis = useMemo(() => {
    let projs = hierarchy;
    if (filterEnv !== 'all') {
      projs = projs.filter(p => {
        const envId   = p._environment?.id || p.environment_id;
        const wsEnvId = p._workspace?.environment_id;
        return envId === filterEnv || wsEnvId === filterEnv || isGeneral(p);
      });
    }
    const projIds = new Set(projs.map(p => p.id));
    const tasks = rawTasks.filter(t => projIds.has(t.project_id) && !t.is_deleted && !t.parent_id);
    return {
      totalProjects:  projs.length,
      totalMilestones: projs.reduce((sum, p) => sum + (p._phases?.length || 0), 0),
      totalTasks:     tasks.length,
      completed:      tasks.filter(t => t.status === 'completed').length,
      inProgress:     tasks.filter(t => t.status === 'in_progress').length,
      highPriority:   tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
      backlog:        projs.filter(p => (p.status || '') === 'backlog').length,
    };
  }, [hierarchy, rawTasks, filterEnv]);

  // ── Toggle helpers ────────────────────────────────────────────────────────
  const toggle = (set, id) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  };

  // ── Eliminar proyecto ─────────────────────────────────────────────────────
  const handleDeleteProject = async (projectId, projectName) => {
    if (!window.confirm(`¿Eliminar el proyecto "${projectName}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await dbProjects.delete(projectId);
      loadData();
    } catch (err) { alert('Error: ' + err.message); }
  };

  // ── Eliminar hito ─────────────────────────────────────────────────────────
  const handleDeleteMilestone = async (projectId, phaseId, phaseName) => {
    if (!window.confirm(`¿Eliminar el hito "${phaseName}"?`)) return;
    try {
      const proj = await dbProjects.getById(projectId);
      await dbProjects.update(projectId, {
        roadmap: { ...proj.roadmap, phases: proj.roadmap.phases.filter(p => p.id !== phaseId) },
      });
      loadData();
    } catch (err) { alert('Error: ' + err.message); }
  };

  // ── Resumen de entornos ───────────────────────────────────────────────────
  const envSummary = useMemo(() => {
    const m = {};
    hierarchy.forEach(p => {
      const eId   = p._environment?.id || p.environment_id || 'unknown';
      const eName = p._environment?.name || 'Sin equipo';
      const eColor= p._environment?.color || '#6366f1';
      if (!m[eId]) m[eId] = { name: eName, color: eColor, count: 0 };
      m[eId].count++;
    });
    return Object.values(m);
  }, [hierarchy]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 16 }}>
        <KpiCard label="Proyectos"      value={envKpis.totalProjects}   icon={<Briefcase size={16} />}     colorIdx={0} loading={loading} />
        <KpiCard label="Hitos"          value={envKpis.totalMilestones} icon={<Flag size={16} />}           colorIdx={1} loading={loading} />
        <KpiCard label="Tareas"         value={envKpis.totalTasks}      icon={<ListChecks size={16} />}     colorIdx={2} loading={loading} />
        <KpiCard label="Completadas"    value={envKpis.completed}       icon={<CheckCircle2 size={16} />}   colorIdx={3} loading={loading} />
        <KpiCard label="En Progreso"    value={envKpis.inProgress}      icon={<Clock size={16} />}          colorIdx={4} loading={loading} />
        <KpiCard label="Alta Prioridad" value={envKpis.highPriority}    icon={<AlertTriangle size={16} />}  colorIdx={5} loading={loading} />
        <KpiCard label="Backlog"        value={envKpis.backlog}         icon={<ListChecks size={16} />}     colorIdx={6} loading={loading} />
      </div>


      {/* BARRA DE ACCIONES */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Búsqueda */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              style={{ padding: '8px 12px 8px 30px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', width: 190 }}
              placeholder="Buscar proyecto…"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>

          {/* Filtro entorno (solo si hay más de 1) */}
          {envList.length > 1 && (
            <select
              value={filterEnv}
              onChange={e => setFilterEnv(e.target.value)}
              style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: 'white', cursor: 'pointer' }}
            >
              <option value="all">Equipo: Todos</option>
              {envList.map(env => (
                <option key={env.id} value={env.id}>{env.icon || '📁'} {env.name}</option>
              ))}
            </select>
          )}

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: 'white', cursor: 'pointer' }}
          >
            <option value="all">Estado: Todos</option>
            {Object.entries(PROJECT_STATUS_DROPDOWN).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', background: 'white', cursor: 'pointer' }}
          >
            <option value="all">Prioridad: Todas</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>

          <button
            onClick={handleRefresh}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#475569', fontFamily: 'inherit' }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Actualizar
          </button>
        </div>

        <button
          onClick={() => { setModalCtx({}); setModal('project'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', border: 'none', borderRadius: 8, background: '#6366f1', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'white', fontFamily: 'inherit' }}
        >
          <Plus size={15} />
          Nuevo Proyecto
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={15} />{error}
        </div>
      )}

      {/* TABLA JERÁRQUICA */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 14 }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
          Cargando proyectos de todos los equipos…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', color: '#9ca3af', fontSize: 14 }}>
          {searchText || filterStatus !== 'all' || filterPriority !== 'all' || filterEnv !== 'all'
            ? 'No hay proyectos que coincidan con los filtros aplicados.'
            : 'No hay proyectos creados aún. Crea el primero usando el botón "Nuevo Proyecto".'}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
              <thead>
                <tr style={{ background: '#1e293b', borderBottom: '2px solid #334155' }}>
                  {TABLE_HEADERS.map(h => (
                    <th key={h} style={{ padding: '11px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(project => {
                  const projExp = expandedProjects.has(project.id);
                  return (
                    <React.Fragment key={project.id}>
                      {/* PROYECTO */}
                      <ProjectRow
                        project={project}
                        expanded={projExp}
                        users={users}
                        onToggle={() => setExpandedProjects(prev => toggle(prev, project.id))}
                        onAddMilestone={() => { setModalCtx({ projectId: project.id }); setModal('milestone'); }}
                        onAddTask={() => { setModalCtx({ projectId: project.id }); setModal('task'); }}
                        onDelete={() => handleDeleteProject(project.id, project.name)}
                      />

                      {/* HITOS (fases del roadmap) */}
                      {projExp && project._phases.map(phase => {
                        const phKey = `${project.id}::${phase.id}`;
                        const phExp = expandedMilestones.has(phKey);
                        return (
                          <React.Fragment key={phase.id}>
                            <MilestoneRow
                              milestone={phase}
                              expanded={phExp}
                              users={users}
                              onToggle={() => setExpandedMilestones(prev => toggle(prev, phKey))}
                              onAddTask={() => { setModalCtx({ projectId: project.id, milestoneId: phase.id }); setModal('task'); }}
                              onDelete={() => handleDeleteMilestone(project.id, phase.id, phase.name)}
                            />
                            {phExp && phase._tasks.map(task => {
                              const tKey = `${phKey}::${task.id}`;
                              const tExp = expandedTasks.has(tKey);
                              return (
                                <React.Fragment key={task.id}>
                                  <TaskRow task={task} expanded={tExp} users={users} hasSubtasks={task._subtasks?.length > 0} onToggle={() => setExpandedTasks(prev => toggle(prev, tKey))} />
                                  {tExp && task._subtasks.map(sub => <SubtaskRow key={sub.id} subtask={sub} users={users} />)}
                                </React.Fragment>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}

                      {/* TAREAS SIN FASE */}
                      {projExp && project._unphasedTasks.map(task => {
                        const tKey = `${project.id}::unphased::${task.id}`;
                        const tExp = expandedTasks.has(tKey);
                        return (
                          <React.Fragment key={task.id}>
                            <TaskRow task={task} expanded={tExp} users={users} hasSubtasks={task._subtasks?.length > 0} onToggle={() => setExpandedTasks(prev => toggle(prev, tKey))} />
                            {tExp && task._subtasks.map(sub => <SubtaskRow key={sub.id} subtask={sub} users={users} />)}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      {/* MODALES */}
      <CreateProjectModal
        open={modal === 'project'}
        onClose={() => setModal(null)}
        users={users}
        workspaces={workspaces}
        onSuccess={() => { setModal(null); loadData(); }}
      />
      <CreateMilestoneModal
        open={modal === 'milestone'}
        onClose={() => setModal(null)}
        projects={hierarchy}
        users={users}
        defaultProjectId={modalCtx.projectId || null}
        onSuccess={() => { setModal(null); loadData(); }}
      />
      <CreateTaskModal
        open={modal === 'task'}
        onClose={() => setModal(null)}
        projects={hierarchy}
        users={users}
        defaultProjectId={modalCtx.projectId || null}
        defaultMilestoneId={modalCtx.milestoneId || null}
        onSuccess={() => { setModal(null); loadData(); }}
      />
    </div>
  );
}
