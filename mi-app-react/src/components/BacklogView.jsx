import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Plus, Flag, X, GripVertical, Check, ArrowUpDown } from 'lucide-react';
import { TASK_STATUS_DROPDOWN } from '../constants/statuses';
import { useApp } from '../context/AppContext';
import { DESIGN_TOKENS } from '../styles/tokens';
import { dbTasks, dbProjects, dbUsers } from '../lib/database';
import {
  buildGroups, GroupBySelector, SortSelector, GenericGroup
} from './shared/GroupBySelector';
import { ColumnMenu } from './shared/ColumnMenu';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ============================================================================
// CONSTANTS
// ============================================================================

const PRIORITY_OPTIONS = {
  urgent: { label: 'Urgente', color: '#ef4444' },
  high:   { label: 'Alta',    color: '#f97316' },
  medium: { label: 'Media',   color: '#6366f1' },
  low:    { label: 'Baja',    color: '#94a3b8' },
};

const STATUS_PILL = TASK_STATUS_DROPDOWN;

// ============================================================================
// TASK CHECKBOX
// ============================================================================
const TaskCheckbox = ({ checked, onChange }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onChange(!checked)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        border: `2px solid ${checked ? '#1e3a5f' : hovered ? '#1e3a5f' : '#d1d5db'}`,
        background: checked ? '#1e3a5f' : hovered ? 'rgba(30,58,95,0.05)' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s ease'
      }}
    >
      {checked && <Check size={11} color="white" strokeWidth={3} />}
    </div>
  );
};

// ============================================================================
// PILL SELECT (reemplaza <select> nativo)
// ============================================================================
const PillSelect = ({ value, options, onChange, placeholder = '—', rounded = true }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = options[value];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: rounded ? '20px' : '6px',
          padding: rounded ? '4px 12px' : '3px 8px',
          fontSize: '12px',
          background: open ? '#f3f4f6' : (rounded ? '#f9fafb' : '#f8fafc'),
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          whiteSpace: 'nowrap',
          color: current?.color || '#374151',
          fontWeight: current ? 500 : 400
        }}
      >
        {current?.label || placeholder}
        <span style={{ fontSize: '9px', opacity: 0.6 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          zIndex: 300,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          padding: '4px',
          minWidth: '140px'
        }}>
          {Object.entries(options).map(([key, opt]) => (
            <button
              key={key}
              onClick={(e) => { e.stopPropagation(); onChange(key); setOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                background: value === key ? '#f0f4ff' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                color: opt.color || '#374151',
                fontWeight: value === key ? 600 : 400
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = value === key ? '#f0f4ff' : 'transparent'}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// PillSelect para listas de proyectos (opciones dinámicas)
const ProjectPillSelect = ({ value, projects, onChange, rounded = true }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = projects.find(p => p.id === value || p.id === Number(value));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: rounded ? '20px' : '6px',
          padding: rounded ? '4px 12px' : '3px 8px',
          fontSize: '12px',
          background: open ? '#f3f4f6' : (rounded ? '#f9fafb' : '#f8fafc'),
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          whiteSpace: 'nowrap',
          color: current?.color || '#374151',
          maxWidth: '140px',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {current?.name || '— Proyecto'}
        </span>
        <span style={{ fontSize: '9px', opacity: 0.6, flexShrink: 0 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          zIndex: 300,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          padding: '4px',
          minWidth: '160px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '8px 12px', background: !value ? '#f0f4ff' : 'transparent',
              border: 'none', borderRadius: '4px', cursor: 'pointer',
              fontSize: '12px', color: '#9ca3af'
            }}
          >
            — Sin proyecto
          </button>
          {projects.map(p => (
            <button
              key={p.id}
              onClick={(e) => { e.stopPropagation(); onChange(p.id); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px',
                background: value === p.id ? '#f0f4ff' : 'transparent',
                border: 'none', borderRadius: '4px', cursor: 'pointer',
                fontSize: '12px', color: p.color || '#374151',
                fontWeight: value === p.id ? 600 : 400
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.background = value === p.id ? '#f0f4ff' : 'transparent'}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SORTABLE TASK ROW
// ============================================================================

const SortableTaskRow = ({ task, projects, users, onUpdate, columns, visibleColumns }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const [checked, setChecked] = useState(task.status === 'completed');
  const style = { transform: CSS.Transform.toString(transform), transition };

  const project = projects.find(p => p.id === task.projectId);
  const assignee = task.assignee || users.find(u => u.id === task.assigneeId);
  const priority = PRIORITY_OPTIONS[task.priority] || PRIORITY_OPTIONS.medium;
  const statusDef = STATUS_PILL[task.status] || STATUS_PILL.pending;
  const initials = assignee?.name
    ? assignee.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : assignee?.email?.[0]?.toUpperCase() || '?';

  const visibleCols = columns.filter(c => visibleColumns.includes(c.key));
  const dynamicGrid = `28px 20px ${visibleCols.map(c => c.width).join(' ')}`;

  const renderCell = (colKey) => {
    switch (colKey) {
      case 'nombre':
        return (
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontWeight: 500, fontSize: '14px',
              color: checked ? '#94a3b8' : '#111827',
              textDecoration: checked ? 'line-through' : 'none',
              overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', lineHeight: '1.3',
            }}>
              {task.title}
            </div>
            {project && (
              <div style={{
                fontSize: '11px', color: '#94a3b8',
                overflow: 'hidden', textOverflow: 'ellipsis',
                whiteSpace: 'nowrap', lineHeight: '1.3', marginTop: '1px',
              }}>
                {project.name}
              </div>
            )}
          </div>
        );
      case 'proyecto':
        return (
          <div style={{ fontSize: '13px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project?.name || '—'}
          </div>
        );
      case 'estado':
        return (
          <div style={{
            display: 'inline-flex', padding: '3px 10px',
            background: statusDef.bg, color: statusDef.color,
            borderRadius: '20px', fontSize: '11px', fontWeight: 700,
            whiteSpace: 'nowrap', justifySelf: 'start',
          }}>
            {statusDef.label}
          </div>
        );
      case 'prioridad':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Flag size={12} color={priority.color} fill={priority.color} />
            <span style={{ color: priority.color, fontSize: '12px', fontWeight: 500 }}>{priority.label}</span>
          </div>
        );
      case 'fecha_inicio':
        return <div style={{ color: '#94a3b8', fontSize: '12px' }}>{task.start_date || '—'}</div>;
      case 'fecha_limite':
        return <div style={{ color: '#94a3b8', fontSize: '12px' }}>{task.due_date || '—'}</div>;
      case 'asignado':
        return assignee ? (
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: '#1e3a5f', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 700, flexShrink: 0,
          }}>
            {initials}
          </div>
        ) : <div style={{ width: '26px' }} />;
      default:
        return <div />;
    }
  };

  return (
    <div ref={setNodeRef} style={{ ...style, opacity: isDragging ? 0.5 : 1 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: dynamicGrid,
          gap: '8px',
          padding: '9px 32px',
          background: isDragging ? '#eef6ff' : 'white',
          borderBottom: '1px solid #f1f5f9',
          alignItems: 'center',
          fontSize: '13px',
          transition: 'background 0.12s',
          outline: isDragging ? '2px solid #1e3a5f' : 'none',
          borderRadius: isDragging ? '8px' : '0',
        }}
        onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.background = '#f8faff'; }}
        onMouseLeave={(e) => { if (!isDragging) e.currentTarget.style.background = 'white'; }}
      >
        {/* CHECKBOX */}
        <TaskCheckbox
          checked={checked}
          onChange={(v) => {
            setChecked(v);
            onUpdate({ status: v ? 'completed' : 'pending' });
          }}
        />

        {/* DRAG HANDLE */}
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            color: '#cbd5e1',
            display: 'flex',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#64748b'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#cbd5e1'}
        >
          <GripVertical size={14} />
        </div>

        {/* DYNAMIC CELLS */}
        {visibleCols.map(col => (
          <React.Fragment key={col.key}>
            {renderCell(col.key)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// DROPPABLE STATUS GROUP (mantenido para DnD cross-group)
// ============================================================================
const DroppableStatusGroup = ({ statusKey, statusInfo, tasks, isExpanded, onToggle, onAddTask, children }) => {
  const { setNodeRef } = useSortable({
    id: `status-${statusKey}`,
    data: { type: 'status', status: statusKey }
  });

  return (
    <div ref={setNodeRef} style={{ marginBottom: '4px' }}>
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 32px',
          background: 'white',
          cursor: 'pointer',
          borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          transition: 'background 0.15s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = DESIGN_TOKENS.neutral[50]}
        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
      >
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <div style={{
          padding: '4px 12px',
          background: statusInfo.color + '20',
          color: statusInfo.color,
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.5px'
        }}>
          {statusInfo.label}
        </div>
        <span style={{ fontSize: '13px', color: DESIGN_TOKENS.neutral[500] }}>
          {tasks.length}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onAddTask(); }}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            background: 'transparent',
            border: 'none',
            color: DESIGN_TOKENS.neutral[400],
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = DESIGN_TOKENS.neutral[100];
            e.currentTarget.style.color = DESIGN_TOKENS.primary.base;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = DESIGN_TOKENS.neutral[400];
          }}
        >
          <Plus size={14} /> Tarea
        </button>
      </div>

      {isExpanded && (
        <div style={{ minHeight: tasks.length === 0 ? '60px' : 'auto' }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// BACKLOG VIEW — CONECTADO A SUPABASE
// ============================================================================
function BacklogView() {
  const { currentEnvironment, currentWorkspace, organizationId } = useApp();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [newTaskRow, setNewTaskRow] = useState({ groupKey: null, defaultData: {} });
  const [groupBy, setGroupBy] = useState('status');
  const [sortDirection, setSortDirection] = useState('asc');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [columns, setColumns] = useState([
    { key: 'nombre', label: 'NOMBRE', width: '1fr' },
    { key: 'proyecto', label: 'PROYECTO', width: '150px' },
    { key: 'estado', label: 'ESTADO', width: '120px' },
    { key: 'prioridad', label: 'PRIORIDAD', width: '120px' },
    { key: 'fecha_inicio', label: 'FECHA INICIO', width: '130px' },
    { key: 'fecha_limite', label: 'FECHA LÍMITE', width: '130px' },
    { key: 'asignado', label: 'ASIGNADO', width: '150px' },
  ]);
  const [visibleColumns, setVisibleColumns] = useState(
    ['nombre', 'estado', 'prioridad', 'fecha_inicio', 'fecha_limite', 'asignado']
  );
  const [draggedCol, setDraggedCol] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [colMenu, setColMenu] = useState(null);

  // ── Cargar datos cuando cambia el workspace ──────────────────────────────
  // String() normaliza número/string para evitar disparos dobles por coerción de tipo
  useEffect(() => {
    if (!currentWorkspace?.id) {
      setTasks([]);
      setProjects([]);
      return;
    }
    loadData();
  }, [String(currentWorkspace?.id ?? '')]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projectsData, usersData] = await Promise.all([
        dbProjects.getByWorkspace(currentWorkspace.id),
        dbUsers.getAll()
      ]);
      setProjects(projectsData);
      setUsers(usersData);

      // Cargar tareas de todos los proyectos del workspace
      if (projectsData.length > 0) {
        const taskPromises = projectsData.map(p => dbTasks.getByProject(p.id));
        const taskArrays = await Promise.all(taskPromises);
        setTasks(taskArrays.flat());
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error cargando backlog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const reorderColumns = (fromKey, toKey) => {
    if (!fromKey || !toKey || fromKey === toKey) return;
    setColumns(prev => {
      const next = [...prev];
      const fromIdx = next.findIndex(c => c.key === fromKey);
      const toIdx = next.findIndex(c => c.key === toKey);
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  // ── Drag & Drop ──────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Computed groups ──────────────────────────────────────────────────────
  const sortedTasks = [...tasks].sort((a, b) => {
    const cmp = (a.title || '').localeCompare(b.title || '', 'es');
    return sortDirection === 'asc' ? cmp : -cmp;
  });
  const groups = buildGroups(groupBy, sortedTasks, projects, users);

  // Reset collapsed groups when groupBy changes
  const prevGroupByRef = useRef(groupBy);
  if (prevGroupByRef.current !== groupBy) {
    prevGroupByRef.current = groupBy;
  }

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragOver = (event) => {
    if (groupBy !== 'status') return; // cross-group DnD solo para status
    const { active, over } = event;
    if (!over) return;
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;
    const overTask = tasks.find(t => t.id === over.id);
    const newStatus = overTask?.status || activeTask.status;
    if (newStatus !== activeTask.status) {
      setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: newStatus } : t));
    }
  };

  const handleDragEnd = async (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const activeTask = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id);
    if (!activeTask) return;

    // Reordenar dentro del mismo grupo
    const groupTasks = groups.find(g => g.tasks.some(t => t.id === active.id))?.tasks || [];
    const oldIdx = groupTasks.findIndex(t => t.id === active.id);
    const newIdx = groupTasks.findIndex(t => t.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
      const reordered = arrayMove(groupTasks, oldIdx, newIdx);
      const otherTasks = tasks.filter(t => !groupTasks.some(g => g.id === t.id));
      setTasks([...otherTasks, ...reordered]);
    }

    // Guardar nuevo status en Supabase si cambió (solo cuando groupBy === 'status')
    if (groupBy === 'status') {
      const currentTask = tasks.find(t => t.id === active.id);
      if (currentTask && currentTask.status !== activeTask.status) {
        try {
          await dbTasks.update(active.id, { status: currentTask.status });
        } catch (error) {
          console.error('Error actualizando status:', error);
          setTasks(prev => prev.map(t => t.id === active.id ? activeTask : t));
        }
      }
    }
  };

  // ── Crear nueva tarea ────────────────────────────────────────────────────
  const handleSaveNewTask = async (taskData) => {
    if (!currentWorkspace?.id) return;



    const payload = {
      title: taskData.title,
      status: taskData.status,
      priority: taskData.priority || 'medium',
      projectId: taskData.projectId,
      assigneeId: taskData.assigneeId || null,
      startDate: taskData.startDate || null,
      dueDate: taskData.endDate || null,
      workspaceId: currentWorkspace.id,
      environmentId: currentEnvironment?.id || null,
      organizationId: organizationId || currentEnvironment?.organization_id || currentWorkspace?.organization_id || null,
      progress: 0,
    };

    try {
      const newTask = await dbTasks.create(payload);
      setTasks(prev => [newTask, ...prev]);
      setNewTaskRow({ groupKey: null, defaultData: {} });
    } catch (error) {
      console.error('[handleSaveNewTask] Error creando tarea:', error);
    }
  };

  const activeTask = tasks.find(t => t.id === activeId);

  // ── Loading state ────────────────────────────────────────────────────────
  if (!currentWorkspace) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '12px',
        color: DESIGN_TOKENS.neutral[400]
      }}>
        <div style={{ fontSize: '40px' }}>📋</div>
        <div style={{ fontWeight: 600 }}>Selecciona un espacio para ver el backlog</div>
      </div>
    );
  }

  return (
    <>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: DESIGN_TOKENS.neutral[50] }}>
        {/* HEADER */}
        <div style={{
          padding: '20px 32px 16px',
          background: 'white',
          borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '6px', color: DESIGN_TOKENS.neutral[500],
            fontSize: DESIGN_TOKENS.typography.size.sm
          }}>
            <span>{currentEnvironment?.icon || '📁'} {currentEnvironment?.name || 'Sin entorno'}</span>
            <ChevronRight size={14} />
            <span style={{ color: DESIGN_TOKENS.primary.base, fontWeight: DESIGN_TOKENS.typography.weight.semibold }}>
              {currentWorkspace?.name}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0, color: DESIGN_TOKENS.neutral[800] }}>
              Backlog
            </h1>
            {/* TOOLBAR */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GroupBySelector value={groupBy} onChange={(v) => { setGroupBy(v); setCollapsedGroups({}); setNewTaskRow({ groupKey: null, defaultData: {} }); }} />
              <SortSelector direction={sortDirection} onChange={setSortDirection} />
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          width: '100%',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: '#e5e7eb transparent',
        }}>
          {/* inner wrapper — evita que 1fr comprima las columnas */}
          <div style={{ minWidth: 'fit-content', width: '100%' }}>
          {/* TABLE HEADER */}
          {(() => {
            const visibleCols = columns.filter(c => visibleColumns.includes(c.key));
            const dynGrid = `28px 20px ${visibleCols.map(c => c.width).join(' ')}`;
            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: dynGrid,
                gap: '8px',
                padding: '8px 32px',
                background: 'white',
                borderBottom: '2px solid #f1f5f9',
                fontSize: '11px',
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                minWidth: 'fit-content',
              }}>
                <div />
                <div />
                {visibleCols.map(col => (
                  <div
                    key={col.key}
                    draggable
                    onDragStart={() => setDraggedCol(col.key)}
                    onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key); }}
                    onDrop={() => { reorderColumns(draggedCol, col.key); setDraggedCol(null); setDragOverCol(null); }}
                    onDragEnd={() => { setDraggedCol(null); setDragOverCol(null); }}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setColMenu({ col, x: rect.left, y: rect.bottom + 4 });
                    }}
                    style={{
                      cursor: 'pointer',
                      opacity: draggedCol === col.key ? 0.4 : 1,
                      borderLeft: dragOverCol === col.key && draggedCol !== col.key
                        ? '2px solid #1e3a5f' : '2px solid transparent',
                      paddingLeft: '4px',
                      userSelect: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {col.label}
                    <ArrowUpDown size={10} style={{ opacity: 0.4 }} />
                  </div>
                ))}
              </div>
            );
          })()}

          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: DESIGN_TOKENS.neutral[400] }}>
              Cargando tareas...
            </div>
          ) : (
            groups.map((group) => {
              const isExpanded = collapsedGroups[group.key] !== true;
              const isAddingTask = newTaskRow.groupKey === group.key;

              return (
                <GenericGroup
                  key={group.key}
                  label={group.label}
                  color={group.color}
                  tasks={group.tasks}
                  isExpanded={isExpanded}
                  onToggle={() => setCollapsedGroups(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
                  onAddTask={() => setNewTaskRow({ groupKey: group.key, defaultData: group.defaultData || {} })}
                >
                  <SortableContext
                    items={group.tasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {group.tasks.map(task => (
                      <SortableTaskRow
                        key={task.id}
                        task={task}
                        projects={projects}
                        users={users}
                        columns={columns}
                        visibleColumns={visibleColumns}
                        onUpdate={async (updated) => {
                          console.log('[updateTask] campo: assigneeId, valor:', updated.assigneeId);
                          const payload = { ...updated };
                          console.log('[updateTask] enviando a Supabase:', payload);
                          // Optimistic update: refleja el cambio antes del await
                          const prev = tasks;
                          setTasks(p => p.map(t => t.id === task.id ? { ...t, ...updated } : t));
                          try {
                            const result = await dbTasks.update(task.id, payload);
                            console.log('[updateTask] respuesta Supabase:', result);
                          } catch (error) {
                            console.log('[updateTask] error si hay:', error);
                            // Revert on error
                            setTasks(prev);
                          }
                        }}
                      />
                    ))}
                  </SortableContext>

                  {isAddingTask && (
                    <NewTaskRow
                      status={newTaskRow.defaultData?.status || 'pending'}
                      defaultData={newTaskRow.defaultData}
                      projects={projects}
                      users={users}
                      onSave={handleSaveNewTask}
                      onCancel={() => setNewTaskRow({ groupKey: null, defaultData: {} })}
                    />
                  )}
                </GenericGroup>
              );
            })
          )}
          </div>{/* /min-width wrapper */}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `28px 20px ${columns.filter(c => visibleColumns.includes(c.key)).map(c => c.width).join(' ')}`,
            gap: '8px',
            padding: '10px 32px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: DESIGN_TOKENS.shadows.lg,
            border: `2px solid #1e3a5f`,
            fontSize: '13px',
            opacity: 0.92,
            alignItems: 'center'
          }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #d1d5db' }} />
            <GripVertical size={15} color={DESIGN_TOKENS.neutral[400]} />
            <div style={{ fontWeight: 500 }}>{activeTask.title}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
      {colMenu && (
        <ColumnMenu
          col={colMenu.col}
          x={colMenu.x}
          y={colMenu.y}
          columns={columns}
          setColumns={setColumns}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          onSort={(colKey, dir) => setTasks(prev => [...prev].sort((a, b) => {
            const va = String(a[colKey] ?? '');
            const vb = String(b[colKey] ?? '');
            return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
          }))}
          setGroupBy={setGroupBy}
          onClose={() => setColMenu(null)}
        />
      )}
    </>
  );
}

// ============================================================================
// NEW TASK ROW
// ============================================================================
const NewTaskRow = ({ status, defaultData = {}, projects, users, onSave, onCancel }) => {
  const [taskData, setTaskData] = useState({
    title: '',
    projectId: defaultData.projectId || null,
    priority: defaultData.priority || 'medium',
    startDate: '',
    endDate: '',
    assigneeId: defaultData.assigneeId || null,
    status: defaultData.status || status || 'pending',
  });

  const handleSave = () => {
    if (!taskData.title.trim()) return;
    onSave(taskData);
  };

  const dateInputStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '3px 8px',
    fontSize: '12px',
    background: '#f8fafc',
    outline: 'none',
    color: '#374151',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: DESIGN_TOKENS.typography.fontFamily,
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28px 20px 1fr 120px 120px 130px 130px 150px',
      gap: '8px',
      padding: '9px 32px',
      background: '#ffffff',
      borderLeft: '3px solid #1e3a5f',
      borderBottom: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      margin: '4px 0',
      alignItems: 'center',
    }}>
      {/* CHECKBOX decorativo */}
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%',
        border: '2px solid #d1d5db', flexShrink: 0,
      }} />

      {/* DRAG HANDLE placeholder */}
      <div />

      {/* NOMBRE */}
      <input
        type="text"
        placeholder="Nombre de la tarea..."
        value={taskData.title}
        onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') onCancel();
        }}
        autoFocus
        style={{
          border: 'none',
          background: 'transparent',
          fontSize: '14px',
          outline: 'none',
          fontWeight: 500,
          color: '#111827',
          fontFamily: DESIGN_TOKENS.typography.fontFamily,
          width: '100%',
        }}
      />

      {/* PROYECTO — pill dropdown compacto */}
      <div>
        <ProjectPillSelect
          value={taskData.projectId}
          projects={projects}
          onChange={(id) => setTaskData({ ...taskData, projectId: id })}
          rounded={false}
        />
      </div>

      {/* PRIORIDAD — pill dropdown compacto */}
      <PillSelect
        value={taskData.priority}
        options={PRIORITY_OPTIONS}
        onChange={(v) => setTaskData({ ...taskData, priority: v })}
        rounded={false}
      />

      {/* FECHA INICIO */}
      <input
        type="date"
        value={taskData.startDate}
        onChange={(e) => setTaskData({ ...taskData, startDate: e.target.value })}
        style={dateInputStyle}
      />

      {/* FECHA LÍMITE */}
      <input
        type="date"
        value={taskData.endDate}
        onChange={(e) => setTaskData({ ...taskData, endDate: e.target.value })}
        style={dateInputStyle}
      />

      {/* BOTONES */}
      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
        <button
          onClick={handleSave}
          title="Guardar"
          style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: '#1e3a5f', color: 'white', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#2d5a9e'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#1e3a5f'}
        >
          <Check size={13} strokeWidth={3} />
        </button>
        <button
          onClick={onCancel}
          title="Cancelar"
          style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: '#f1f5f9', color: '#64748b', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};

export default BacklogView;