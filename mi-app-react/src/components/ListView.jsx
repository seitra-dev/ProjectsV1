import React, { useState, useRef, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';
import { ColumnMenu } from './shared/ColumnMenu';
import {
  ChevronRight, Flag, X, GripVertical,
  MoreVertical, Pencil, Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DESIGN_TOKENS } from '../styles/tokens';
import { dbTasks } from '../lib/database';
import {
  buildGroups, GroupBySelector, SortSelector, GenericGroup
} from './shared/GroupBySelector';
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

const LIST_FIELD_MAP = {
  projectId:  'projectId',
  assigneeId: 'assigneeId',
  startDate:  'startDate',
  dueDate:    'endDate',
};

const PRIORITY_OPTIONS = {
  urgent: { label: 'Urgente', color: '#FF3D71' },
  high:   { label: 'Alta',    color: '#FFAB00' },
  medium: { label: 'Media',   color: '#0095FF' },
  low:    { label: 'Baja',    color: '#86868B' },
};

const STATUS_OPTIONS = {
  pending:     { label: 'Pendiente',   color: '#FF9800', bg: '#FFF4E5' },
  in_progress: { label: 'En Progreso', color: '#2196F3', bg: '#E3F2FD' },
  completed:   { label: 'Completado',  color: '#00D68F', bg: '#E8F5E9' },
  blocked:     { label: 'Bloqueado',   color: '#DC2626', bg: '#FFEBEE' },
};


// ============================================================================
// CUSTOM PILL SELECTS
// ============================================================================

// Hook compartido para cerrar al clickear fuera + posición fixed
const useDropdown = () => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen(o => !o);
  };

  return { open, setOpen, ref, btnRef, pos, toggle };
};

// PillSelect para objetos { key: { label, color } }
const PillSelect = ({ value, options, onChange, placeholder = '—' }) => {
  const { open, setOpen, ref, btnRef, pos, toggle } = useDropdown();
  const current = options[value];
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={toggle}
        style={{
          border: '1px solid #e5e7eb', borderRadius: '6px', padding: '5px 10px',
          fontSize: '12px', background: open ? '#f3f4f6' : 'white',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          whiteSpace: 'nowrap', color: '#374151', fontWeight: 500,
          width: '100%', boxSizing: 'border-box',
        }}
      >
        {current?.color && <span style={{ width: 8, height: 8, borderRadius: '50%', background: current.color, flexShrink: 0 }} />}
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {current?.label || placeholder}
        </span>
        <span style={{ fontSize: '9px', opacity: 0.5 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999,
          background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: '4px',
          minWidth: Math.max(pos.width, 140),
        }}>
          {Object.entries(options).map(([key, opt]) => (
            <button
              key={key}
              onClick={(e) => { e.stopPropagation(); onChange(key); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                padding: '8px 10px', background: value === key ? '#f0f4ff' : 'transparent',
                border: 'none', borderRadius: '4px', cursor: 'pointer',
                fontSize: '12px', color: '#374151', fontWeight: value === key ? 600 : 400,
              }}
              onMouseEnter={(e) => { if (value !== key) e.currentTarget.style.background = '#f3f4f6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = value === key ? '#f0f4ff' : 'transparent'; }}
            >
              {opt.color && <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color, flexShrink: 0 }} />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ArrayPillSelect para arrays [{ id, name, color? }]
const ArrayPillSelect = ({ value, items, idKey = 'id', labelKey = 'name', colorKey = 'color', onChange, placeholder = '—' }) => {
  const { open, setOpen, ref, btnRef, pos, toggle } = useDropdown();
  const current = items.find(item => item[idKey] === value || item[idKey] === Number(value));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={toggle}
        style={{
          border: '1px solid #e5e7eb', borderRadius: '6px', padding: '5px 10px',
          fontSize: '12px', background: open ? '#f3f4f6' : 'white',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          whiteSpace: 'nowrap', color: '#374151', fontWeight: 500,
          width: '100%', boxSizing: 'border-box',
        }}
      >
        {current?.[colorKey] && <span style={{ width: 8, height: 8, borderRadius: '50%', background: current[colorKey], flexShrink: 0 }} />}
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {current?.[labelKey] || placeholder}
        </span>
        <span style={{ fontSize: '9px', opacity: 0.5 }}>▾</span>
      </button>
      {open && (
        <div style={{
          position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999,
          background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: '4px',
          minWidth: Math.max(pos.width, 160), maxHeight: '200px', overflowY: 'auto',
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', width: '100%',
              padding: '8px 10px', background: !value ? '#f0f4ff' : 'transparent',
              border: 'none', borderRadius: '4px', cursor: 'pointer',
              fontSize: '12px', color: '#9ca3af',
            }}
          >
            — {placeholder}
          </button>
          {items.map(item => (
            <button
              key={item[idKey]}
              onClick={(e) => { e.stopPropagation(); onChange(item[idKey]); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                padding: '8px 10px', background: value === item[idKey] ? '#f0f4ff' : 'transparent',
                border: 'none', borderRadius: '4px', cursor: 'pointer',
                fontSize: '12px', color: '#374151', fontWeight: value === item[idKey] ? 600 : 400,
              }}
              onMouseEnter={(e) => { if (value !== item[idKey]) e.currentTarget.style.background = '#f3f4f6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = value === item[idKey] ? '#f0f4ff' : 'transparent'; }}
            >
              {item[colorKey] && <span style={{ width: 8, height: 8, borderRadius: '50%', background: item[colorKey], flexShrink: 0 }} />}
              {item[labelKey]}
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
const SortableTaskRow = ({ task, projects = [], users = [], weeks = [], onUpdate, onDelete, columns = [], visibleColumns = [] }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(task);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const project = projects.find(p => p.id === task.projectId);
  const priority = PRIORITY_OPTIONS[task.priority] || PRIORITY_OPTIONS.medium;
  const status = STATUS_OPTIONS[task.status] || STATUS_OPTIONS.pending;
  const week = weeks.find(w => w.id === task.weekId);

  const handleSave = () => {
    onUpdate(editedTask);
    setIsEditing(false);
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter' && field === 'title') handleSave();
    if (e.key === 'Escape') { setEditedTask(task); setIsEditing(false); }
  };

  const dateInputStyle = {
    border: '1px solid #e5e7eb', borderRadius: '6px', padding: '5px 8px',
    fontSize: '12px', background: 'white', outline: 'none',
    color: '#374151', width: '100%', boxSizing: 'border-box',
    fontFamily: DESIGN_TOKENS.typography.fontFamily,
  };

  return (
    <div ref={setNodeRef} style={{ ...style, opacity: isDragging ? 0.5 : 1 }}>
      {(() => {
        const visibleCols = columns.filter(c => visibleColumns.includes(c.key));
        const dynGrid = `24px ${visibleCols.map(c => c.width).join(' ')} auto`;

        const renderCell = (colKey) => {
          switch (colKey) {
            case 'nombre':
              return isEditing ? (
                <input
                  type="text"
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, 'title')}
                  autoFocus
                  style={{
                    border: 'none', background: 'transparent', fontSize: '13px',
                    fontWeight: 500, outline: 'none',
                    fontFamily: DESIGN_TOKENS.typography.fontFamily,
                    color: DESIGN_TOKENS.neutral[800],
                  }}
                />
              ) : (
                <div style={{ fontWeight: 500, color: DESIGN_TOKENS.neutral[800] }}>{task.title}</div>
              );
            case 'proyecto':
              return isEditing ? (
                <ArrayPillSelect
                  value={editedTask.projectId}
                  items={projects}
                  onChange={(id) => setEditedTask({ ...editedTask, projectId: id })}
                  placeholder="Proyecto"
                />
              ) : (
                <div style={{
                  padding: '4px 10px',
                  background: project?.color ? project.color + '20' : DESIGN_TOKENS.neutral[100],
                  color: project?.color || DESIGN_TOKENS.neutral[600],
                  borderRadius: '4px', fontSize: '12px', textAlign: 'center',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {project?.name || '—'}
                </div>
              );
            case 'estado':
              return isEditing ? (
                <PillSelect
                  value={editedTask.status}
                  options={STATUS_OPTIONS}
                  onChange={(v) => setEditedTask({ ...editedTask, status: v })}
                />
              ) : (
                <div style={{
                  padding: '4px 10px', background: status.bg, color: status.color,
                  borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                  textAlign: 'center', whiteSpace: 'nowrap',
                }}>
                  {status.label}
                </div>
              );
            case 'prioridad':
              return isEditing ? (
                <PillSelect
                  value={editedTask.priority}
                  options={PRIORITY_OPTIONS}
                  onChange={(v) => setEditedTask({ ...editedTask, priority: v })}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flag size={14} color={priority.color} fill={priority.color} />
                  <span style={{ color: priority.color, fontSize: '12px' }}>{priority.label}</span>
                </div>
              );
            case 'fecha_inicio':
              return isEditing ? (
                <input type="date" value={editedTask.startDate || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, startDate: e.target.value })}
                  style={dateInputStyle} />
              ) : (
                <div style={{ color: DESIGN_TOKENS.neutral[600], fontSize: '12px' }}>{task.startDate || '—'}</div>
              );
            case 'fecha_limite':
              return isEditing ? (
                <input type="date" value={editedTask.endDate || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, endDate: e.target.value })}
                  style={dateInputStyle} />
              ) : (
                <div style={{ color: DESIGN_TOKENS.neutral[600], fontSize: '12px' }}>{task.endDate || '—'}</div>
              );
            case 'semana':
              return isEditing ? (
                <ArrayPillSelect
                  value={editedTask.weekId}
                  items={weeks}
                  onChange={(id) => setEditedTask({ ...editedTask, weekId: id })}
                  placeholder="Semana"
                />
              ) : (
                <div style={{ color: DESIGN_TOKENS.neutral[500], fontSize: '12px' }}>{week?.name || '—'}</div>
              );
            case 'asignado':
              return isEditing ? (
                <ArrayPillSelect
                  value={editedTask.assigneeId}
                  items={users}
                  labelKey="name"
                  onChange={(id) => setEditedTask({ ...editedTask, assigneeId: id })}
                  placeholder="Asignado"
                />
              ) : (() => {
                const assignee = users.find(u => u.id === task.assigneeId);
                if (!assignee) return <div style={{ color: DESIGN_TOKENS.neutral[400], fontSize: '12px' }}>—</div>;
                const initials = assignee.name
                  ? assignee.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                  : assignee.email?.[0]?.toUpperCase() || '?';
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: DESIGN_TOKENS.primary.base, color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 700, flexShrink: 0,
                    }}>{initials}</div>
                    <span style={{ fontSize: '12px', color: DESIGN_TOKENS.neutral[700], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {assignee.name || assignee.email}
                    </span>
                  </div>
                );
              })();
            default:
              return null;
          }
        };

        return (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: dynGrid,
              gap: '8px',
              padding: '12px 32px',
              background: isDragging ? DESIGN_TOKENS.primary.lightest : 'white',
              borderTop: isEditing ? '1px solid #e2e8f0' : 'none',
              borderRight: isEditing ? '1px solid #e2e8f0' : 'none',
              borderBottom: isEditing ? '1px solid #e2e8f0' : `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
              borderLeft: isEditing ? `3px solid ${DESIGN_TOKENS.primary.base}` : 'none',
              borderRadius: isEditing ? '8px' : '0',
              boxShadow: isEditing ? '0 2px 10px rgba(0,102,255,0.08)' : (isDragging ? DESIGN_TOKENS.shadows.lg : 'none'),
              margin: isEditing ? '4px 0' : '0',
              outline: isDragging ? `2px solid ${DESIGN_TOKENS.primary.base}` : 'none',
              alignItems: 'center',
              fontSize: '13px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { if (!isDragging && !isEditing) e.currentTarget.style.background = DESIGN_TOKENS.neutral[50]; }}
            onMouseLeave={(e) => { if (!isDragging && !isEditing) e.currentTarget.style.background = 'white'; }}
            onDoubleClick={() => setIsEditing(true)}
          >
            {/* DRAG HANDLE */}
            <div
              {...attributes}
              {...listeners}
              style={{
                cursor: isDragging ? 'grabbing' : 'grab',
                color: DESIGN_TOKENS.neutral[400],
                display: 'flex', opacity: 0.5, transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
            >
              <GripVertical size={16} />
            </div>

            {/* DYNAMIC COLUMNS */}
            {visibleCols.map(col => (
              <React.Fragment key={col.key}>{renderCell(col.key)}</React.Fragment>
            ))}

            {/* ACTIONS */}
            {isEditing ? (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  onClick={handleSave}
                  style={{
                    padding: '6px 12px', background: DESIGN_TOKENS.primary.base, color: 'white',
                    border: 'none', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = DESIGN_TOKENS.primary.dark}
                  onMouseLeave={(e) => e.currentTarget.style.background = DESIGN_TOKENS.primary.base}
                >
                  Guardar
                </button>
                <button
                  onClick={() => { setEditedTask(task); setIsEditing(false); }}
                  style={{
                    padding: '6px', background: DESIGN_TOKENS.neutral[100],
                    color: DESIGN_TOKENS.neutral[600], border: 'none',
                    borderRadius: '6px', cursor: 'pointer', display: 'flex',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = DESIGN_TOKENS.neutral[200]}
                  onMouseLeave={(e) => e.currentTarget.style.background = DESIGN_TOKENS.neutral[100]}
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onDelete(task.id)}
                style={{
                  padding: '6px', background: 'transparent', border: 'none',
                  color: DESIGN_TOKENS.neutral[400], cursor: 'pointer',
                  borderRadius: '4px', display: 'flex',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = DESIGN_TOKENS.danger.light;
                  e.currentTarget.style.color = DESIGN_TOKENS.danger.base;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = DESIGN_TOKENS.neutral[400];
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );
};

// ============================================================================
// GENERIC LIST VIEW
// ============================================================================
function ListView({
  listId,
  listName: initialListName,
  tasks = [],
  projects = [],
  users = [],
  onTasksChange = () => {},
  onListNameChange = () => {},
  onListDelete = () => {},
  onError = () => {},
  hideTitle = false,
}) {
  const { currentEnvironment, currentWorkspace } = useApp();
  const [listName, setListName] = useState(initialListName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [weeks, setWeeks] = useState([
    { id: 1, name: 'SEMANA 9',  weekNumber: 9  },
    { id: 2, name: 'Semana 10', weekNumber: 10 },
    { id: 3, name: 'Semana 11', weekNumber: 11 },
  ]);
  const [activeId, setActiveId] = useState(null);
  const [showNewTaskRow, setShowNewTaskRow] = useState(false);
  const [newTaskGroupKey, setNewTaskGroupKey] = useState(null);
  const [newTaskDefaultData, setNewTaskDefaultData] = useState({});
  const [groupBy, setGroupBy] = useState('week');
  const [sortDirection, setSortDirection] = useState('asc');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const savingTaskRef = useRef(false);

  const [columns, setColumns] = useState([
    { key: 'nombre',       label: 'NOMBRE',       width: '1fr'   },
    { key: 'proyecto',     label: 'PROYECTO',     width: '150px' },
    { key: 'estado',       label: 'ESTADO',       width: '120px' },
    { key: 'prioridad',    label: 'PRIORIDAD',    width: '120px' },
    { key: 'fecha_inicio', label: 'FECHA INICIO', width: '120px' },
    { key: 'fecha_limite', label: 'FECHA LÍMITE', width: '120px' },
    { key: 'asignado',     label: 'ASIGNADO',     width: '140px' },
  ]);
  const [visibleColumns, setVisibleColumns] = useState([
    'nombre', 'proyecto', 'estado', 'prioridad', 'fecha_inicio', 'fecha_limite', 'asignado'
  ]);
  const [draggedCol, setDraggedCol] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [colMenu, setColMenu] = useState(null);

  const reorderColumns = (fromKey, toKey) => {
    if (!fromKey || !toKey || fromKey === toKey) return;
    setColumns(prev => {
      const next = [...prev];
      const fromIdx = next.findIndex(c => c.key === fromKey);
      const toIdx = next.findIndex(c => c.key === toKey);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const workspaceProjects = currentWorkspace
    ? projects.filter(p => p.workspaceId === currentWorkspace.id)
    : projects;

  const listTasks = listId != null ? tasks.filter(t => t.listId === listId) : tasks;

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = listTasks.findIndex(t => t.id === active.id);
      const newIndex = listTasks.findIndex(t => t.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(listTasks, oldIndex, newIndex);
        const otherTasks = tasks.filter(t => t.listId !== listId);
        onTasksChange([...otherTasks, ...reordered]);
      }
    }
  };

  const handleSaveListName = () => {
    if (listName.trim()) onListNameChange(listId, listName.trim());
    setIsEditingName(false);
  };

  const [newTaskProjectError, setNewTaskProjectError] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  const handleSaveNewTask = async (taskData) => {
    if (!taskData.title?.trim() || savingTaskRef.current) return;
    if (!taskData.projectId) {
      setNewTaskProjectError(true);
      return;
    }
    setNewTaskProjectError(false);
    savingTaskRef.current = true;
    try {
      const created = await dbTasks.create({
        title: taskData.title,
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        projectId: taskData.projectId,
        assigneeId: taskData.assigneeId || null,
        startDate: taskData.startDate || null,
        dueDate: taskData.endDate || null,
        listId,
        workspaceId: currentWorkspace?.id || null,
        progress: 0,
      });
      onTasksChange([{ ...created, listId, endDate: created.dueDate }, ...tasks]);
      setShowNewTaskRow(false);
    } catch (err) {
      console.error('[ListView] Error creando tarea:', err);
    } finally {
      savingTaskRef.current = false;
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await dbTasks.delete(taskId);
      onTasksChange(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('[ListView] Error eliminando tarea:', err);
      onError(err.message || 'Error al eliminar la tarea');
    }
  };

  const handleDeleteList = () => {
    setShowListMenu(false);
    setConfirmData({
      title: '¿Eliminar lista?',
      message: `La lista "${listName}" y todas sus tareas serán eliminadas permanentemente.`,
      onConfirm: () => onListDelete(listId),
    });
  };

  const activeTask = listTasks.find(t => t.id === activeId);

  return (
    <>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: DESIGN_TOKENS.neutral[50] }}>
        {/* HEADER */}
        <div style={{
          padding: '24px 32px',
          background: 'white',
          borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {!hideTitle && (
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                marginBottom: '8px', color: DESIGN_TOKENS.neutral[500],
                fontSize: DESIGN_TOKENS.typography.size.sm,
              }}>
                <span>{currentEnvironment?.icon || '📁'} {currentEnvironment?.name || 'Sin entorno'}</span>
                {currentWorkspace?.name && (
                  <>
                    <ChevronRight size={14} />
                    <span style={{ color: DESIGN_TOKENS.primary.base, fontWeight: DESIGN_TOKENS.typography.weight.semibold }}>
                      {currentWorkspace.name}
                    </span>
                  </>
                )}
              </div>

              {isEditingName ? (
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  onBlur={handleSaveListName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveListName();
                    if (e.key === 'Escape') { setListName(initialListName); setIsEditingName(false); }
                  }}
                  autoFocus
                  style={{
                    fontSize: '28px', fontWeight: 700, border: 'none', outline: 'none',
                    background: 'transparent', color: DESIGN_TOKENS.neutral[800],
                    fontFamily: DESIGN_TOKENS.typography.fontFamily, width: '100%',
                    borderBottom: `2px solid ${DESIGN_TOKENS.primary.base}`,
                  }}
                />
              ) : (
                <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: DESIGN_TOKENS.neutral[800] }}>
                  {listName}
                </h1>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <GroupBySelector
              value={groupBy}
              onChange={(v) => { setGroupBy(v); setCollapsedGroups({}); setShowNewTaskRow(false); }}
            />
            <SortSelector direction={sortDirection} onChange={setSortDirection} />

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowListMenu(!showListMenu)}
                style={{
                  padding: '10px', background: 'white',
                  border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                  borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                }}
              >
                <MoreVertical size={18} />
              </button>

              {showListMenu && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                  background: 'white', border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
                  borderRadius: '8px', boxShadow: DESIGN_TOKENS.shadows.lg,
                  padding: '6px', minWidth: '180px', zIndex: 100,
                }}>
                  <button
                    onClick={() => { setIsEditingName(true); setShowListMenu(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', background: 'none', border: 'none',
                      borderRadius: '4px', cursor: 'pointer', fontSize: '14px',
                      fontWeight: 500, color: DESIGN_TOKENS.neutral[700], textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = DESIGN_TOKENS.neutral[100]}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <Pencil size={16} />
                    Cambiar el nombre
                  </button>

                  <div style={{ height: '1px', background: DESIGN_TOKENS.border.color.subtle, margin: '4px 0' }} />

                  <button
                    onClick={handleDeleteList}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', background: 'none', border: 'none',
                      borderRadius: '4px', cursor: 'pointer', fontSize: '14px',
                      fontWeight: 500, color: DESIGN_TOKENS.danger.base, textAlign: 'left',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = DESIGN_TOKENS.danger.light}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <Trash2 size={16} />
                    Eliminar lista
                  </button>
                </div>
              )}
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
          <div style={{ minWidth: 'fit-content', width: '100%' }}>
          {/* TABLE HEADER — dynamic columns with drag-and-drop */}
          {(() => {
            const visibleCols = columns.filter(c => visibleColumns.includes(c.key));
            const dynGrid = `24px ${visibleCols.map(c => c.width).join(' ')} auto`;
            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: dynGrid,
                gap: '8px',
                padding: '8px 32px',
                background: 'white',
                borderBottom: '2px solid #f1f5f9',
                fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '1.5px',
                position: 'sticky', top: 0, zIndex: 10,
                minWidth: 'fit-content',
              }}>
                <div />
                {visibleCols.map(col => (
                  <div
                    key={col.key}
                    draggable
                    onDragStart={() => setDraggedCol(col.key)}
                    onDragOver={e => { e.preventDefault(); setDragOverCol(col.key); }}
                    onDrop={() => {
                      if (draggedCol && dragOverCol && draggedCol !== dragOverCol) reorderColumns(draggedCol, dragOverCol);
                      setDraggedCol(null); setDragOverCol(null);
                    }}
                    onDragEnd={() => { setDraggedCol(null); setDragOverCol(null); }}
                    onClick={e => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setColMenu({ col, x: r.left, y: r.bottom + 4 });
                    }}
                    style={{
                      cursor: 'pointer',
                      background: dragOverCol === col.key ? '#eff6ff' : 'transparent',
                      borderRadius: '4px',
                      padding: '2px 4px',
                      display: 'flex', alignItems: 'center', gap: '3px',
                      userSelect: 'none',
                      color: draggedCol === col.key ? '#3b82f6' : '#94a3b8',
                      transition: 'background 0.15s',
                    }}
                  >
                    {col.label}
                    <ChevronRight size={9} style={{ transform: 'rotate(90deg)', opacity: 0.5, flexShrink: 0 }} />
                  </div>
                ))}
                <div />
              </div>
            );
          })()}

          {/* TASKS */}
          {(() => {
            const sorted = [...listTasks].sort((a, b) => {
              const cmp = (a.title || '').localeCompare(b.title || '', 'es');
              return sortDirection === 'asc' ? cmp : -cmp;
            });
            const groups = buildGroups(groupBy, sorted, workspaceProjects, users, LIST_FIELD_MAP);

            return groups.map((group) => {
              const isExpanded = collapsedGroups[group.key] !== true;
              const isAddingHere = showNewTaskRow && newTaskGroupKey === group.key;

              return (
                <GenericGroup
                  key={group.key}
                  label={group.label}
                  color={group.color}
                  tasks={group.tasks}
                  isExpanded={isExpanded}
                  onToggle={() => setCollapsedGroups(prev => ({ ...prev, [group.key]: !prev[group.key] }))}
                  onAddTask={() => {
                    setNewTaskGroupKey(group.key);
                    setNewTaskDefaultData(group.defaultData || {});
                    setShowNewTaskRow(true);
                  }}
                >
                  <SortableContext
                    items={group.tasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {group.tasks.map(task => (
                      <SortableTaskRow
                        key={task.id}
                        task={task}
                        projects={workspaceProjects}
                        users={users}
                        weeks={weeks}
                        columns={columns}
                        visibleColumns={visibleColumns}
                        onUpdate={async (updated) => {
                          console.log('[updateTask] campo: assigneeId, valor:', updated.assigneeId);
                          const dbPayload = {
                            title: updated.title,
                            status: updated.status,
                            priority: updated.priority,
                            projectId: updated.projectId || null,
                            assigneeId: updated.assigneeId || null,
                            startDate: updated.startDate || null,
                            dueDate: updated.endDate || null,
                          };
                          console.log('[updateTask] enviando a Supabase:', dbPayload);
                          // Optimistic update: refleja el cambio antes del await
                          const prevTasks = tasks;
                          onTasksChange(tasks.map(t => t.id === updated.id ? updated : t));
                          try {
                            const result = await dbTasks.update(updated.id, dbPayload);
                            console.log('[updateTask] respuesta Supabase:', result);
                          } catch (err) {
                            console.log('[updateTask] error si hay:', err);
                            // Revert on error
                            onTasksChange(prevTasks);
                          }
                        }}
                        onDelete={(taskId) => setConfirmData({
                          title: '¿Eliminar tarea?',
                          message: 'Esta acción no se puede deshacer.',
                          onConfirm: () => handleDeleteTask(taskId),
                        })}
                      />
                    ))}
                  </SortableContext>

                  {isAddingHere && (
                    <NewTaskRow
                      projects={workspaceProjects}
                      users={users}
                      weeks={weeks}
                      defaultData={newTaskDefaultData}
                      projectError={newTaskProjectError}
                      onProjectChange={() => setNewTaskProjectError(false)}
                      onSave={handleSaveNewTask}
                      onCancel={() => { setShowNewTaskRow(false); setNewTaskGroupKey(null); setNewTaskProjectError(false); }}
                      columns={columns}
                      visibleColumns={visibleColumns}
                    />
                  )}
                </GenericGroup>
              );
            });
          })()}

          {showNewTaskRow && !newTaskGroupKey && (
            <NewTaskRow
              projects={workspaceProjects}
              users={users}
              weeks={weeks}
              projectError={newTaskProjectError}
              onProjectChange={() => setNewTaskProjectError(false)}
              onSave={handleSaveNewTask}
              onCancel={() => { setShowNewTaskRow(false); setNewTaskProjectError(false); }}
              columns={columns}
              visibleColumns={visibleColumns}
            />
          )}

          {listTasks.length === 0 && !showNewTaskRow && (
            <div style={{ padding: '48px', textAlign: 'center', color: DESIGN_TOKENS.neutral[400] }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>No hay tareas en esta lista</div>
              <button
                onClick={() => setShowNewTaskRow(true)}
                style={{
                  marginTop: '16px', padding: '10px 20px',
                  background: DESIGN_TOKENS.primary.base, color: 'white',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                }}
              >
                + Crear primera tarea
              </button>
            </div>
          )}
          </div>{/* /minWidth wrapper */}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div style={{
            padding: '12px 32px', background: 'white', borderRadius: '8px',
            boxShadow: DESIGN_TOKENS.shadows.lg,
            border: `2px solid ${DESIGN_TOKENS.primary.base}`,
            fontSize: '13px', opacity: 0.9, fontWeight: 500,
          }}>
            {activeTask.title}
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
        onSort={(colKey, dir) => {
          const sorted = [...listTasks].sort((a, b) => {
            const va = String(a[colKey] ?? '');
            const vb = String(b[colKey] ?? '');
            return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
          });
          onTasksChange(sorted);
        }}
        setGroupBy={setGroupBy}
        onClose={() => setColMenu(null)}
      />
    )}
    <ConfirmModal
      isOpen={!!confirmData}
      title={confirmData?.title}
      message={confirmData?.message}
      onConfirm={() => { confirmData?.onConfirm(); setConfirmData(null); }}
      onCancel={() => setConfirmData(null)}
    />
    </>
  );
}

// ============================================================================
// NEW TASK ROW
// ============================================================================
const NewTaskRow = ({ projects = [], users = [], weeks = [], defaultData = {}, projectError = false, onProjectChange, onSave, onCancel, columns = [], visibleColumns = [] }) => {
  const [taskData, setTaskData] = useState({
    title: '',
    projectId: defaultData.projectId || null,
    status: defaultData.status || 'pending',
    priority: defaultData.priority || 'medium',
    startDate: '',
    endDate: '',
    weekId: defaultData.weekId || null,
    assigneeId: null,
  });

  const handleSave = () => {
    if (taskData.title.trim()) onSave(taskData);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onCancel();
  };

  const dateInputStyle = {
    border: '1px solid #e5e7eb', borderRadius: '6px', padding: '5px 8px',
    fontSize: '12px', background: 'white', outline: 'none',
    color: '#374151', width: '100%', boxSizing: 'border-box',
    fontFamily: DESIGN_TOKENS.typography.fontFamily,
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `24px ${columns.filter(c => visibleColumns.includes(c.key)).map(c => c.width).join(' ')} auto`,
      gap: '8px',
      padding: '10px 32px',
      background: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      borderRight: '1px solid #e2e8f0',
      borderBottom: '1px solid #e2e8f0',
      borderLeft: `3px solid ${DESIGN_TOKENS.primary.base}`,
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,102,255,0.08)',
      margin: '4px 0',
      alignItems: 'center',
    }}>
      {/* Placeholder drag */}
      <div />

      {/* NOMBRE */}
      <input
        type="text"
        placeholder="Nombre de la tarea..."
        value={taskData.title}
        onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
        onKeyDown={handleKeyDown}
        autoFocus
        style={{
          border: 'none', background: 'transparent', fontSize: '13px',
          outline: 'none', fontWeight: 500, color: '#111827',
          fontFamily: DESIGN_TOKENS.typography.fontFamily, width: '100%',
        }}
      />

      {/* PROYECTO */}
      <div>
        <ArrayPillSelect
          value={taskData.projectId}
          items={projects}
          onChange={(id) => {
            setTaskData({ ...taskData, projectId: id });
            onProjectChange?.();
          }}
          placeholder="Proyecto *"
        />
        {projectError && (
          <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px' }}>
            Selecciona un proyecto
          </div>
        )}
      </div>

      {/* ESTADO */}
      <PillSelect
        value={taskData.status}
        options={STATUS_OPTIONS}
        onChange={(v) => setTaskData({ ...taskData, status: v })}
      />

      {/* PRIORIDAD */}
      <PillSelect
        value={taskData.priority}
        options={PRIORITY_OPTIONS}
        onChange={(v) => setTaskData({ ...taskData, priority: v })}
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

      {/* SEMANA */}
      <ArrayPillSelect
        value={taskData.weekId}
        items={weeks}
        onChange={(id) => setTaskData({ ...taskData, weekId: id })}
        placeholder="Semana"
      />

      {/* ASIGNADO */}
      <ArrayPillSelect
        value={taskData.assigneeId}
        items={users}
        labelKey="name"
        onChange={(id) => setTaskData({ ...taskData, assigneeId: id })}
        placeholder="Asignado"
      />

      {/* BOTONES */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <button
          onClick={handleSave}
          title="Guardar (Enter)"
          style={{
            padding: '6px 12px', background: DESIGN_TOKENS.primary.base, color: 'white',
            border: 'none', borderRadius: '6px', cursor: 'pointer',
            fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = DESIGN_TOKENS.primary.dark}
          onMouseLeave={(e) => e.currentTarget.style.background = DESIGN_TOKENS.primary.base}
        >
          Guardar
        </button>
        <button
          onClick={onCancel}
          title="Cancelar (Esc)"
          style={{
            padding: '6px', background: DESIGN_TOKENS.neutral[100],
            color: DESIGN_TOKENS.neutral[600], border: 'none',
            borderRadius: '6px', cursor: 'pointer', display: 'flex',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = DESIGN_TOKENS.neutral[200]}
          onMouseLeave={(e) => e.currentTarget.style.background = DESIGN_TOKENS.neutral[100]}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};

export default ListView;
