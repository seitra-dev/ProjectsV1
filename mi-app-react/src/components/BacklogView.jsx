import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Calendar, User, Flag, FolderOpen, X, GripVertical } from 'lucide-react';
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
  pending: { label: 'PENDIENTE', color: '#FF9800' },
  in_progress: { label: 'EN CURSO', color: '#2196F3' },
  completed: { label: 'COMPLETADO', color: '#00D68F' }
};

// ============================================================================
// SORTABLE TASK ROW
// ============================================================================
const SortableTaskRow = ({ task, projects, users, onUpdate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const project = projects.find(p => p.id === task.projectId);
  const assignee = users.find(u => u.id === task.assigneeId);
  const priority = PRIORITY_OPTIONS[task.priority] || PRIORITY_OPTIONS.medium;

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
        gridTemplateColumns: '24px 400px 150px 120px 120px 120px 120px 40px',
        gap: '8px',
        padding: '12px 32px',
        background: isDragging ? DESIGN_TOKENS.primary.lightest : 'white',
        borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
        alignItems: 'center',
        fontSize: '13px',
        transition: 'all 0.15s',
        border: isDragging ? `2px solid ${DESIGN_TOKENS.primary.base}` : 'none',
        borderRadius: isDragging ? '8px' : '0'
      }}
      onMouseEnter={(e) => {
        if (!isDragging) e.currentTarget.style.background = DESIGN_TOKENS.neutral[50];
      }}
      onMouseLeave={(e) => {
        if (!isDragging) e.currentTarget.style.background = 'white';
      }}
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

        <div style={{ 
          fontWeight: 500,
          color: DESIGN_TOKENS.neutral[800]
        }}>
          {task.title}
        </div>

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

        <div style={{ color: DESIGN_TOKENS.neutral[600], fontSize: '12px' }}>
          {task.startDate || '—'}
        </div>

        <div style={{ color: DESIGN_TOKENS.neutral[600], fontSize: '12px' }}>
          {task.endDate || '—'}
        </div>

        <div style={{ color: DESIGN_TOKENS.neutral[500], fontSize: '12px' }}>
          {task.sprint || '—'}
        </div>

        <div>
          {assignee && (
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: DESIGN_TOKENS.primary.base,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 600
            }}>
              {assignee.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DROPPABLE STATUS GROUP
// ============================================================================
const DroppableStatusGroup = ({ 
  statusKey, 
  statusInfo, 
  tasks, 
  isExpanded, 
  onToggle, 
  onAddTask,
  projects,
  users,
  onUpdateTask,
  children 
}) => {
  const { setNodeRef } = useSortable({ 
    id: `status-${statusKey}`,
    data: {
      type: 'status',
      status: statusKey
    }
  });

  return (
    <div ref={setNodeRef} style={{ marginBottom: '4px' }}>
      {/* STATUS HEADER */}
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
          onClick={(e) => {
            e.stopPropagation();
            onAddTask();
          }}
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

      {/* TASKS */}
      {isExpanded && (
        <div style={{ minHeight: tasks.length === 0 ? '100px' : 'auto' }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// BACKLOG VIEW WITH DRAG AND DROP
// ============================================================================
function BacklogView({ tasks, projects, users, onTasksChange }) {
  const { currentEnvironment, currentWorkspace } = useApp();
  const [expandedStatuses, setExpandedStatuses] = useState({ in_progress: true, pending: true });
  const [activeId, setActiveId] = useState(null);
  const [newTaskRow, setNewTaskRow] = useState({ status: null });

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

  // Filtrar proyectos del workspace actual
  const workspaceProjects = currentWorkspace 
    ? projects.filter(p => p.workspaceId === currentWorkspace.id)
    : projects;

  // Agrupar tareas por estado
  const groupedTasks = {};
  Object.keys(STATUS_OPTIONS).forEach(status => {
    groupedTasks[status] = tasks.filter(t => t.status === status);
  });

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Si se arrastra sobre otra tarea, obtener su estado
    let newStatus = activeTask.status;
    
    if (over.data?.current?.type === 'status') {
      newStatus = over.data.current.status;
    } else {
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    // Actualizar estado si cambió
    if (newStatus !== activeTask.status) {
      const updatedTasks = tasks.map(t =>
        t.id === active.id ? { ...t, status: newStatus } : t
      );
      onTasksChange(updatedTasks);
    }
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    
    const { active, over } = event;
    
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overTask = tasks.find(t => t.id === over.id);

    if (!activeTask) return;

    // Reordenar dentro del mismo grupo
    if (activeTask.status === overTask?.status) {
      const statusTasks = groupedTasks[activeTask.status];
      const oldIndex = statusTasks.findIndex(t => t.id === active.id);
      const newIndex = statusTasks.findIndex(t => t.id === over.id);
      
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(statusTasks, oldIndex, newIndex);
        const otherTasks = tasks.filter(t => t.status !== activeTask.status);
        onTasksChange([...otherTasks, ...reordered]);
      }
    }
  };

  const toggleStatus = (status) => {
    setExpandedStatuses(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const handleAddTaskRow = (status) => {
    setNewTaskRow({ status });
  };

  const handleSaveNewTask = (taskData) => {
    const newTask = {
      id: Date.now(),
      ...taskData,
      workspaceId: currentWorkspace?.id,
      environmentId: currentEnvironment?.id,
      createdAt: new Date().toISOString(),
      progress: 0
    };
    onTasksChange([...tasks, newTask]);
    setNewTaskRow({ status: null });
  };

  const handleCancelNewTask = () => {
    setNewTaskRow({ status: null });
  };

  const activeTask = tasks.find(t => t.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
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
          borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`
        }}>
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
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            margin: 0,
            color: DESIGN_TOKENS.neutral[800]
          }}>
            Backlog
          </h1>
        </div>

        {/* CONTENT */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '0'
        }}>
          {/* TABLE HEADER */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '24px 400px 150px 120px 120px 120px 120px 40px',
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
            <div>Nombre</div>
            <div>Proyecto</div>
            <div>Prioridad</div>
            <div>Fecha de inicio</div>
            <div>Fecha límite</div>
            <div>Sprint</div>
            <div></div>
          </div>

          {/* GROUPED BY STATUS */}
          {Object.entries(STATUS_OPTIONS).map(([statusKey, statusInfo]) => {
            const statusTasks = groupedTasks[statusKey] || [];
            const isExpanded = expandedStatuses[statusKey];
            const isAddingTask = newTaskRow.status === statusKey;

            return (
              <DroppableStatusGroup
                key={statusKey}
                statusKey={statusKey}
                statusInfo={statusInfo}
                tasks={statusTasks}
                isExpanded={isExpanded}
                onToggle={() => toggleStatus(statusKey)}
                onAddTask={() => handleAddTaskRow(statusKey)}
                projects={workspaceProjects}
                users={users}
              >
                <SortableContext
                  items={statusTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {statusTasks.map(task => (
                    <SortableTaskRow
                      key={task.id}
                      task={task}
                      projects={workspaceProjects}
                      users={users}
                      onUpdate={(updated) => {
                        onTasksChange(tasks.map(t => t.id === task.id ? updated : t));
                      }}
                    />
                  ))}
                </SortableContext>

                {/* NEW TASK ROW */}
                {isAddingTask && (
                  <NewTaskRow
                    status={statusKey}
                    projects={workspaceProjects}
                    users={users}
                    onSave={handleSaveNewTask}
                    onCancel={handleCancelNewTask}
                  />
                )}
              </DroppableStatusGroup>
            );
          })}
        </div>
      </div>

      {/* DRAG OVERLAY */}
      <DragOverlay>
        {activeTask ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '24px 400px 150px 120px 120px 120px 120px 40px',
            gap: '8px',
            padding: '12px 32px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: DESIGN_TOKENS.shadows.lg,
            border: `2px solid ${DESIGN_TOKENS.primary.base}`,
            fontSize: '13px',
            opacity: 0.9
          }}>
            <GripVertical size={16} color={DESIGN_TOKENS.neutral[400]} />
            <div style={{ fontWeight: 500 }}>{activeTask.title}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ============================================================================
// NEW TASK ROW COMPONENT
// ============================================================================
const NewTaskRow = ({ status, projects, users, onSave, onCancel }) => {
  const [taskData, setTaskData] = useState({
    title: '',
    projectId: null,
    priority: 'medium',
    startDate: '',
    endDate: '',
    assigneeId: null,
    status
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
      gridTemplateColumns: '24px 400px 150px 120px 120px 120px 120px 40px',
      gap: '8px',
      padding: '12px 32px',
      background: '#FFFBF0',
      borderBottom: `2px solid ${DESIGN_TOKENS.primary.base}`,
      alignItems: 'center'
    }}>
      <div></div>

      <input
        type="text"
        placeholder="Tarea Nombre o type '/' for commands"
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
        onChange={(e) => setTaskData({ ...taskData, projectId: Number(e.target.value) })}
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

      <div></div>

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

export default BacklogView;