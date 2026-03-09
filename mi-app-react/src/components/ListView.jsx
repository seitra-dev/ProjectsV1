import React, { useState } from 'react';
import { 
  ChevronDown, ChevronRight, Plus, Flag, X, GripVertical, 
  MoreVertical, Pencil, Trash2, Settings
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DESIGN_TOKENS } from '../styles/tokens';
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
  urgent: { label: 'Urgente', color: '#FF3D71' },
  high: { label: 'Alta', color: '#FFAB00' },
  medium: { label: 'Media', color: '#0095FF' },
  low: { label: 'Baja', color: '#86868B' }
};

const STATUS_OPTIONS = {
  pending: { label: 'PENDIENTE', color: '#FF9800', bg: '#FFF4E5' },
  in_progress: { label: 'EN CURSO', color: '#2196F3', bg: '#E3F2FD' },
  completed: { label: 'COMPLETADO', color: '#00D68F', bg: '#E8F5E9' },
  blocked: { label: 'BLOQUEADO', color: '#DC2626', bg: '#FFEBEE' }
};

// ============================================================================
// SORTABLE TASK ROW
// ============================================================================
const SortableTaskRow = ({ task, projects, users, weeks, onUpdate, onDelete }) => {
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
  const assignee = users.find(u => u.id === task.assigneeId);
  const priority = PRIORITY_OPTIONS[task.priority] || PRIORITY_OPTIONS.medium;
  const status = STATUS_OPTIONS[task.status] || STATUS_OPTIONS.pending;
  const week = weeks.find(w => w.id === task.weekId);

  const handleSave = () => {
    onUpdate(editedTask);
    setIsEditing(false);
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter' && field === 'title') {
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditedTask(task);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: '24px 350px 150px 120px 120px 120px 150px 40px',
        gap: '8px',
        padding: '12px 32px',
        background: isDragging ? DESIGN_TOKENS.primary.lightest : (isEditing ? '#FFFBF0' : 'white'),
        borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
        alignItems: 'center',
        fontSize: '13px',
        transition: 'all 0.15s',
        border: isEditing ? `2px solid ${DESIGN_TOKENS.primary.base}` : (isDragging ? `2px solid ${DESIGN_TOKENS.primary.base}` : 'none'),
        borderRadius: (isDragging || isEditing) ? '8px' : '0'
      }}
      onMouseEnter={(e) => {
        if (!isDragging && !isEditing) e.currentTarget.style.background = DESIGN_TOKENS.neutral[50];
      }}
      onMouseLeave={(e) => {
        if (!isDragging && !isEditing) e.currentTarget.style.background = 'white';
      }}
      onDoubleClick={() => setIsEditing(true)}
      >
        {/* DRAG HANDLE */}
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            color: DESIGN_TOKENS.neutral[400],
            display: 'flex',
            opacity: 0.5,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
          onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
        >
          <GripVertical size={16} />
        </div>

        {/* TITLE */}
        {isEditing ? (
          <input
            type="text"
            value={editedTask.title}
            onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
            onKeyDown={(e) => handleKeyDown(e, 'title')}
            onBlur={handleSave}
            autoFocus
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '13px',
              fontWeight: 500,
              outline: 'none',
              fontFamily: DESIGN_TOKENS.typography.fontFamily,
              color: DESIGN_TOKENS.neutral[800]
            }}
          />
        ) : (
          <div style={{ 
            fontWeight: 500,
            color: DESIGN_TOKENS.neutral[800]
          }}>
            {task.title}
          </div>
        )}

        {/* PROJECT */}
        {isEditing ? (
          <select
            value={editedTask.projectId || ''}
            onChange={(e) => setEditedTask({ ...editedTask, projectId: Number(e.target.value) || null })}
            style={{
              padding: '6px',
              border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
              borderRadius: '4px',
              fontSize: '12px',
              background: 'white'
            }}
          >
            <option value="">—</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        ) : (
          <div style={{
            padding: '4px 10px',
            background: project?.color + '20' || DESIGN_TOKENS.neutral[100],
            color: project?.color || DESIGN_TOKENS.neutral[600],
            borderRadius: '4px',
            fontSize: '12px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {project?.name || '—'}
          </div>
        )}

        {/* STATUS */}
        {isEditing ? (
          <select
            value={editedTask.status}
            onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
            style={{
              padding: '6px',
              border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
              borderRadius: '4px',
              fontSize: '12px',
              background: 'white'
            }}
          >
            {Object.entries(STATUS_OPTIONS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        ) : (
          <div style={{
            padding: '4px 10px',
            background: status.bg,
            color: status.color,
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}>
            {status.label}
          </div>
        )}

        {/* PRIORITY */}
        {isEditing ? (
          <select
            value={editedTask.priority}
            onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
            style={{
              padding: '6px',
              border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
              borderRadius: '4px',
              fontSize: '12px',
              background: 'white'
            }}
          >
            {Object.entries(PRIORITY_OPTIONS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Flag size={14} color={priority.color} fill={priority.color} />
            <span style={{ color: priority.color, fontSize: '12px' }}>
              {priority.label}
            </span>
          </div>
        )}

        {/* START DATE */}
        {isEditing ? (
          <input
            type="date"
            value={editedTask.startDate || ''}
            onChange={(e) => setEditedTask({ ...editedTask, startDate: e.target.value })}
            style={{
              padding: '6px',
              border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
              borderRadius: '4px',
              fontSize: '12px',
              background: 'white'
            }}
          />
        ) : (
          <div style={{ color: DESIGN_TOKENS.neutral[600], fontSize: '12px' }}>
            {task.startDate || '—'}
          </div>
        )}

        {/* END DATE */}
        {isEditing ? (
          <input
            type="date"
            value={editedTask.endDate || ''}
            onChange={(e) => setEditedTask({ ...editedTask, endDate: e.target.value })}
            style={{
              padding: '6px',
              border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
              borderRadius: '4px',
              fontSize: '12px',
              background: 'white'
            }}
          />
        ) : (
          <div style={{ color: DESIGN_TOKENS.neutral[600], fontSize: '12px' }}>
            {task.endDate || '—'}
          </div>
        )}

        {/* WEEK */}
        {isEditing ? (
          <select
            value={editedTask.weekId || ''}
            onChange={(e) => setEditedTask({ ...editedTask, weekId: Number(e.target.value) || null })}
            style={{
              padding: '6px',
              border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
              borderRadius: '4px',
              fontSize: '12px',
              background: 'white'
            }}
          >
            <option value="">—</option>
            {weeks.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        ) : (
          <div style={{ color: DESIGN_TOKENS.neutral[500], fontSize: '12px' }}>
            {week?.name || '—'}
          </div>
        )}

        {/* ACTIONS */}
        {isEditing ? (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={handleSave}
              style={{
                padding: '6px',
                background: DESIGN_TOKENS.primary.base,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              ✓
            </button>
            <button
              onClick={() => {
                setEditedTask(task);
                setIsEditing(false);
              }}
              style={{
                padding: '6px',
                background: DESIGN_TOKENS.neutral[200],
                color: DESIGN_TOKENS.neutral[700],
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onDelete(task.id)}
            style={{
              padding: '6px',
              background: 'transparent',
              border: 'none',
              color: DESIGN_TOKENS.neutral[400],
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'flex'
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
    </div>
  );
};

// ============================================================================
// GENERIC LIST VIEW
// ============================================================================
function ListView({ 
  listId,
  listName: initialListName, 
  tasks, 
  projects, 
  users, 
  onTasksChange,
  onListNameChange,
  onListDelete
}) {
  const { currentEnvironment, currentWorkspace } = useApp();
  const [listName, setListName] = useState(initialListName);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [weeks, setWeeks] = useState([
    { id: 1, name: 'SEMANA 9', weekNumber: 9 },
    { id: 2, name: 'Semana 10', weekNumber: 10 },
    { id: 3, name: 'Semana 11', weekNumber: 11 }
  ]);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [editingWeekId, setEditingWeekId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [showNewTaskRow, setShowNewTaskRow] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const workspaceProjects = currentWorkspace 
    ? projects.filter(p => p.workspaceId === currentWorkspace.id)
    : projects;

  const listTasks = tasks.filter(t => t.listId === listId);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

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
    if (listName.trim()) {
      onListNameChange(listId, listName.trim());
    }
    setIsEditingName(false);
  };

  const handleAddTask = () => {
    setShowNewTaskRow(true);
  };

  const handleSaveNewTask = (taskData) => {
    const newTask = {
      id: Date.now(),
      ...taskData,
      listId,
      workspaceId: currentWorkspace?.id,
      environmentId: currentEnvironment?.id,
      createdAt: new Date().toISOString(),
      progress: 0
    };
    onTasksChange([...tasks, newTask]);
    setShowNewTaskRow(false);
  };

  const handleDeleteTask = (taskId) => {
    if (confirm('¿Eliminar esta tarea?')) {
      onTasksChange(tasks.filter(t => t.id !== taskId));
    }
  };

  const handleDeleteList = () => {
    if (confirm(`¿Eliminar la lista "${listName}"?`)) {
      onListDelete(listId);
    }
    setShowListMenu(false);
  };

  const activeTask = listTasks.find(t => t.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: DESIGN_TOKENS.neutral[50]
      }}>
        {/* HEADER */}
        <div style={{
          padding: '24px 32px',
          background: 'white',
          borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px',
              color: DESIGN_TOKENS.neutral[500],
              fontSize: DESIGN_TOKENS.typography.size.sm
            }}>
              <span>{currentEnvironment?.icon || '📁'} {currentEnvironment?.name || 'Sin entorno'}</span>
              <ChevronRight size={14} />
              <span style={{ 
                color: DESIGN_TOKENS.primary.base,
                fontWeight: DESIGN_TOKENS.typography.weight.semibold 
              }}>
                {currentWorkspace?.name || 'Sin espacio'}
              </span>
            </div>
            
            {isEditingName ? (
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                onBlur={handleSaveListName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveListName();
                  if (e.key === 'Escape') {
                    setListName(initialListName);
                    setIsEditingName(false);
                  }
                }}
                autoFocus
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: DESIGN_TOKENS.neutral[800],
                  fontFamily: DESIGN_TOKENS.typography.fontFamily,
                  width: '100%',
                  borderBottom: `2px solid ${DESIGN_TOKENS.primary.base}`
                }}
              />
            ) : (
              <h1 
                onClick={() => setIsEditingName(true)}
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  margin: 0,
                  color: DESIGN_TOKENS.neutral[800],
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = DESIGN_TOKENS.primary.base}
                onMouseLeave={(e) => e.currentTarget.style.color = DESIGN_TOKENS.neutral[800]}
              >
                {listName}
                <Pencil size={18} style={{ opacity: 0.5 }} />
              </h1>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowListMenu(!showListMenu)}
              style={{
                padding: '10px',
                background: 'white',
                border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <MoreVertical size={18} />
            </button>

            {showListMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: 'white',
                border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
                borderRadius: '8px',
                boxShadow: DESIGN_TOKENS.shadows.lg,
                padding: '6px',
                minWidth: '180px',
                zIndex: 100
              }}>
                <button
                  onClick={() => {
                    setIsEditingName(true);
                    setShowListMenu(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    background: 'none',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: DESIGN_TOKENS.neutral[700],
                    textAlign: 'left'
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
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    background: 'none',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: DESIGN_TOKENS.danger.base,
                    textAlign: 'left'
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

        {/* CONTENT */}
        <div style={{
          flex: 1,
          overflow: 'auto'
        }}>
          {/* TABLE HEADER */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '24px 350px 150px 120px 120px 120px 120px 150px 40px',
            gap: '8px',
            padding: '12px 32px',
            background: DESIGN_TOKENS.neutral[50],
            borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
            fontSize: '11px',
            fontWeight: 600,
            color: DESIGN_TOKENS.neutral[500],
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <div></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Nombre
              <button
                onClick={handleAddTask}
                style={{
                  padding: '4px 8px',
                  background: DESIGN_TOKENS.primary.base,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={12} /> Tarea
              </button>
            </div>
            <div>Proyecto</div>
            <div>Estado</div>
            <div>Prioridad</div>
            <div>Fecha inicio</div>
            <div>Fecha límite</div>
            <div>Semana</div>
            <div></div>
          </div>

          {/* TASKS */}
          <SortableContext
            items={listTasks.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {listTasks.map(task => (
              <SortableTaskRow
                key={task.id}
                task={task}
                projects={workspaceProjects}
                users={users}
                weeks={weeks}
                onUpdate={(updated) => {
                  onTasksChange(tasks.map(t => t.id === task.id ? updated : t));
                }}
                onDelete={handleDeleteTask}
              />
            ))}
          </SortableContext>

          {/* NEW TASK ROW */}
          {showNewTaskRow && (
            <NewTaskRow
              projects={workspaceProjects}
              users={users}
              weeks={weeks}
              onSave={handleSaveNewTask}
              onCancel={() => setShowNewTaskRow(false)}
            />
          )}

          {listTasks.length === 0 && !showNewTaskRow && (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              color: DESIGN_TOKENS.neutral[400]
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>
                No hay tareas en esta lista
              </div>
              <button
                onClick={handleAddTask}
                style={{
                  marginTop: '16px',
                  padding: '10px 20px',
                  background: DESIGN_TOKENS.primary.base,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={16} /> Crear primera tarea
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DRAG OVERLAY */}
      <DragOverlay>
        {activeTask ? (
          <div style={{
            padding: '12px 32px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: DESIGN_TOKENS.shadows.lg,
            border: `2px solid ${DESIGN_TOKENS.primary.base}`,
            fontSize: '13px',
            opacity: 0.9,
            fontWeight: 500
          }}>
            {activeTask.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ============================================================================
// NEW TASK ROW
// ============================================================================
const NewTaskRow = ({ projects, users, weeks, onSave, onCancel }) => {
  const [taskData, setTaskData] = useState({
    title: '',
    projectId: null,
    status: 'pending',
    priority: 'medium',
    startDate: '',
    endDate: '',
    weekId: null,
    assigneeId: null
  });

  const handleSave = () => {
    if (taskData.title.trim()) {
      onSave(taskData);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onCancel();
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '24px 350px 150px 120px 120px 120px 120px 150px 40px',
      gap: '8px',
      padding: '12px 32px',
      background: '#FFFBF0',
      borderBottom: `2px solid ${DESIGN_TOKENS.primary.base}`,
      alignItems: 'center'
    }}>
      <div></div>

      <input
        type="text"
        placeholder="Nombre de la tarea..."
        value={taskData.title}
        onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
        onKeyDown={handleKeyDown}
        autoFocus
        style={{
          border: 'none',
          background: 'transparent',
          fontSize: '13px',
          outline: 'none',
          fontWeight: 500,
          fontFamily: DESIGN_TOKENS.typography.fontFamily
        }}
      />

      <select
        value={taskData.projectId || ''}
        onChange={(e) => setTaskData({ ...taskData, projectId: Number(e.target.value) || null })}
        style={{
          padding: '6px',
          border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
          borderRadius: '4px',
          fontSize: '12px',
          background: 'white'
        }}
      >
        <option value="">—</option>
        {projects.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <select
        value={taskData.status}
        onChange={(e) => setTaskData({ ...taskData, status: e.target.value })}
        style={{
          padding: '6px',
          border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
          borderRadius: '4px',
          fontSize: '12px',
          background: 'white'
        }}
      >
        {Object.entries(STATUS_OPTIONS).map(([key, { label }]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      <select
        value={taskData.priority}
        onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
        style={{
          padding: '6px',
          border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
          borderRadius: '4px',
          fontSize: '12px',
          background: 'white'
        }}
      >
        {Object.entries(PRIORITY_OPTIONS).map(([key, { label }]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      <input
        type="date"
        value={taskData.startDate}
        onChange={(e) => setTaskData({ ...taskData, startDate: e.target.value })}
        style={{
          padding: '6px',
          border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
          borderRadius: '4px',
          fontSize: '12px',
          background: 'white'
        }}
      />

      <input
        type="date"
        value={taskData.endDate}
        onChange={(e) => setTaskData({ ...taskData, endDate: e.target.value })}
        style={{
          padding: '6px',
          border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
          borderRadius: '4px',
          fontSize: '12px',
          background: 'white'
        }}
      />

      <select
        value={taskData.weekId || ''}
        onChange={(e) => setTaskData({ ...taskData, weekId: Number(e.target.value) || null })}
        style={{
          padding: '6px',
          border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
          borderRadius: '4px',
          fontSize: '12px',
          background: 'white'
        }}
      >
        <option value="">—</option>
        {weeks.map(w => (
          <option key={w.id} value={w.id}>{w.name}</option>
        ))}
      </select>

      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={handleSave}
          style={{
            padding: '6px',
            background: DESIGN_TOKENS.primary.base,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 600
          }}
        >
          ✓
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '6px',
            background: DESIGN_TOKENS.neutral[200],
            color: DESIGN_TOKENS.neutral[700],
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
};

export default ListView;