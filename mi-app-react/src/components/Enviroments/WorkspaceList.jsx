import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, MoreVertical, ChevronRight, GripVertical, Pencil, Trash2,
  MessageSquare, ListTodo, Folder, FileText, Trello,
  LayoutDashboard, Zap, FileInput, Layout
} from 'lucide-react';
import { useApp } from '../../context/AppContext-OLD.jsx';
import { DESIGN_TOKENS } from '../../styles/tokens.js';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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
// SORTABLE WORKSPACE ITEM
// ============================================================================
const SortableWorkspaceItem = ({ 
  workspace, 
  isActive, 
  isEditing, 
  isExpanded,
  onToggleExpand,
  onSelect,
  onContextMenu,
  onStartEdit,
  onEndEdit,
  onSelectList,
  onRenameList,
  onDeleteList
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: workspace.id });

  const [showListMenu, setShowListMenu] = useState(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Listas del workspace (simuladas por ahora, luego vendrán del context)
  const lists = workspace.lists || [];

  return (
    <div 
      ref={setNodeRef}
      style={{
        ...style,
        marginBottom: '2px',
      }}
    >
      <div
        onClick={() => onSelect(workspace)}
        onContextMenu={(e) => onContextMenu(e, workspace)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          borderRadius: DESIGN_TOKENS.border.radius.md,
          cursor: isDragging ? 'grabbing' : 'pointer',
          background: isActive ? 'rgba(0, 102, 255, 0.06)' : 'transparent',
          transition: `all ${DESIGN_TOKENS.transition.fast}`,
          position: 'relative',
          border: isDragging ? `2px solid ${DESIGN_TOKENS.primary.base}` : '2px solid transparent'
        }}
        onMouseEnter={(e) => {
          if (!isActive && !isDragging) {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive && !isDragging) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        {/* DRAG HANDLE */}
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            color: DESIGN_TOKENS.neutral[400],
            display: 'flex',
            padding: '2px',
            opacity: isDragging ? 0 : 0.5,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
          onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
        >
          <GripVertical size={14} />
        </div>

        {/* EXPAND BUTTON */}
        {lists.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(workspace.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              color: DESIGN_TOKENS.neutral[400],
              display: 'flex',
              transition: `transform ${DESIGN_TOKENS.transition.normal}`
            }}
          >
            <ChevronRight 
              size={14} 
              style={{
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: `transform ${DESIGN_TOKENS.transition.normal}`
              }}
            />
          </button>
        )}

        {/* ICON */}
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: workspace.settings?.color || DESIGN_TOKENS.primary.base,
          flexShrink: 0,
          marginLeft: lists.length > 0 ? 0 : '18px'
        }} />

        {/* NAME */}
        {isEditing ? (
          <input
            type="text"
            defaultValue={workspace.name}
            autoFocus
            onBlur={(e) => onEndEdit(workspace.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onEndEdit(workspace.id, e.target.value);
              }
              if (e.key === 'Escape') {
                onEndEdit(workspace.id, null);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              border: `1px solid ${DESIGN_TOKENS.primary.base}`,
              background: 'white',
              padding: '4px 8px',
              borderRadius: DESIGN_TOKENS.border.radius.sm,
              fontSize: DESIGN_TOKENS.typography.size.sm,
              outline: 'none',
              fontWeight: DESIGN_TOKENS.typography.weight.medium
            }}
          />
        ) : (
          <span style={{
            flex: 1,
            fontSize: DESIGN_TOKENS.typography.size.sm,
            fontWeight: DESIGN_TOKENS.typography.weight.medium,
            color: isActive ? DESIGN_TOKENS.primary.base : DESIGN_TOKENS.neutral[800],
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {workspace.name}
          </span>
        )}

        {/* LIST COUNT */}
        {lists.length > 0 && (
          <span style={{
            fontSize: DESIGN_TOKENS.typography.size.xs,
            color: DESIGN_TOKENS.neutral[400],
            fontWeight: DESIGN_TOKENS.typography.weight.medium
          }}>
            {lists.length}
          </span>
        )}
      </div>

      {/* LISTS (COLLAPSED) */}
      {isExpanded && lists.length > 0 && (
        <div style={{
          paddingLeft: '36px',
          marginTop: '2px'
        }}>
          {lists.map((list) => (
            <div
              key={list.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: DESIGN_TOKENS.border.radius.sm,
                cursor: 'pointer',
                transition: `all ${DESIGN_TOKENS.transition.fast}`,
                fontSize: DESIGN_TOKENS.typography.size.sm,
                color: DESIGN_TOKENS.neutral[700],
                position: 'relative'
              }}
              onClick={() => onSelectList(list)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: DESIGN_TOKENS.primary.base
                }} />
                <span>{list.name}</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowListMenu(showListMenu === list.id ? null : list.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: DESIGN_TOKENS.neutral[400],
                  display: 'flex',
                  opacity: showListMenu === list.id ? 1 : 0.5,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => {
                  if (showListMenu !== list.id) e.currentTarget.style.opacity = 0.5;
                }}
              >
                <MoreVertical size={14} />
              </button>

              {/* LIST MENU */}
              {showListMenu === list.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: '8px',
                    marginTop: '4px',
                    background: 'white',
                    border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
                    borderRadius: '8px',
                    boxShadow: DESIGN_TOKENS.shadows.lg,
                    padding: '6px',
                    minWidth: '160px',
                    zIndex: 1000,
                    animation: 'menuFadeIn 0.15s ease'
                  }}
                >
                  <button
                    onClick={() => {
                      onRenameList(list);
                      setShowListMenu(null);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: DESIGN_TOKENS.neutral[700],
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 102, 255, 0.06)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <Pencil size={14} color="#FF9800" />
                    Renombr
                  </button>

                  <div style={{ height: '1px', background: DESIGN_TOKENS.border.color.subtle, margin: '4px 0' }} />

                  <button
                    onClick={() => {
                      onDeleteList(list);
                      setShowListMenu(null);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: DESIGN_TOKENS.danger.base,
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = DESIGN_TOKENS.danger.light}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// WORKSPACE LIST WITH DRAG AND DROP
// ============================================================================
const WorkspaceList = ({ onCreateWorkspace, onSelectWorkspace, onOpenChat, onOpenBacklog, onCreateList }) => {
  const { currentEnvironment, currentWorkspace, deleteWorkspace, updateWorkspace } = useApp();
  const [workspaces, setWorkspaces] = useState([]);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState({});
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef(null);

  // Sincronizar workspaces del entorno
  useEffect(() => {
    setWorkspaces(currentEnvironment?.workspaces || []);
  }, [currentEnvironment]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setWorkspaces((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const reordered = arrayMove(items, oldIndex, newIndex);
        // Aquí podrías guardar el orden en el backend o localStorage
        return reordered;
      });
    }
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleExpand = (workspaceId) => {
    setExpandedWorkspaces(prev => ({
      ...prev,
      [workspaceId]: !prev[workspaceId]
    }));
  };

  const handleRename = (workspace) => {
    setEditingWorkspace(workspace.id);
    setContextMenu(null);
  };

  const handleEndEdit = (workspaceId, newName) => {
    if (newName && newName.trim()) {
      updateWorkspace(workspaceId, { name: newName.trim() });
    }
    setEditingWorkspace(null);
  };

  const handleDelete = (workspace) => {
    if (confirm(`¿Eliminar el espacio "${workspace.name}"?`)) {
      deleteWorkspace(workspace.id);
    }
    setContextMenu(null);
  };

  const handleContextMenu = (e, workspace) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      workspace
    });
  };

const handleAddOption = (type) => {
    setShowAddMenu(false);
    if (type === 'space') {
        onCreateWorkspace();
    } else if (type === 'chat') {
        onOpenChat && onOpenChat();
    } else if (type === 'backlog') {
        onOpenBacklog && onOpenBacklog();
    } else if (type === 'list') {
        onCreateList && onCreateList();  
    } else {
        console.log(`Crear ${type}`);
    }
    };

  const handleDeleteList = (list) => {
    if (confirm(`¿Eliminar la lista "${list.name}"?`)) {
      console.log('Eliminar lista:', list);
      // Aquí luego se integrará con el context
    }
  };

  const handleRenameList = (list) => {
    const newName = prompt('Nuevo nombre:', list.name);
    if (newName && newName.trim()) {
      console.log('Renombrar lista:', list.name, '->', newName);
      // Aquí luego se integrará con el context
    }
  };

  const handleSelectList = (list) => {
    console.log('Abrir lista:', list);
    // Aquí se abrirá la ListView con esta lista
  };

  // Cerrar menú contextual
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (!currentEnvironment) {
    return (
      <div style={{
        padding: '24px 16px',
        textAlign: 'center',
        color: DESIGN_TOKENS.neutral[400]
      }}>
        <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>📁</div>
        <div style={{ 
          fontSize: DESIGN_TOKENS.typography.size.sm,
          fontWeight: DESIGN_TOKENS.typography.weight.medium
        }}>
          Selecciona un entorno
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0', position: 'relative' }}>
      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 12px 8px',
        fontSize: DESIGN_TOKENS.typography.size.xs,
        fontWeight: DESIGN_TOKENS.typography.weight.semibold,
        color: DESIGN_TOKENS.neutral[400],
        textTransform: 'uppercase',
        letterSpacing: '0.6px'
      }}>
        Espacios
        <div ref={addMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            style={{
              background: 'none',
              border: 'none',
              color: DESIGN_TOKENS.neutral[400],
              cursor: 'pointer',
              padding: '4px',
              borderRadius: DESIGN_TOKENS.border.radius.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `all ${DESIGN_TOKENS.transition.fast}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 102, 255, 0.1)';
              e.currentTarget.style.color = DESIGN_TOKENS.primary.base;
            }}
            onMouseLeave={(e) => {
              if (!showAddMenu) {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = DESIGN_TOKENS.neutral[400];
              }
            }}
          >
            <Plus size={16} />
          </button>

          {/* ADD MENU */}
          {showAddMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              background: 'white',
              border: `0.5px solid ${DESIGN_TOKENS.border.color.subtle}`,
              borderRadius: DESIGN_TOKENS.border.radius.md,
              boxShadow: `0 8px 24px rgba(0, 0, 0, 0.12)`,
              padding: '6px',
              minWidth: '260px',
              zIndex: 1000,
              animation: 'menuFadeIn 0.15s ease'
            }}>
              {/* HEADER */}
              <div style={{
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 600,
                color: DESIGN_TOKENS.neutral[500],
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Crea
              </div>

              {/* LISTA */}
              <button
                onClick={() => handleAddOption('list')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: DESIGN_TOKENS.border.radius.sm,
                  cursor: 'pointer',
                  transition: `all ${DESIGN_TOKENS.transition.fast}`,
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 102, 255, 0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <ListTodo size={18} color={DESIGN_TOKENS.neutral[700]} style={{ marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 500,
                    color: DESIGN_TOKENS.neutral[800],
                    marginBottom: '2px'
                  }}>
                    lista
                  </div>
                  <div style={{ 
                    fontSize: '12px',
                    color: DESIGN_TOKENS.neutral[500],
                    lineHeight: 1.3
                  }}>
                    Da seguimiento a tareas, proyectos, personas y más
                  </div>
                </div>
              </button>

              {/* CARPETA */}
              <button
                onClick={() => handleAddOption('folder')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: DESIGN_TOKENS.border.radius.sm,
                  cursor: 'pointer',
                  transition: `all ${DESIGN_TOKENS.transition.fast}`,
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 102, 255, 0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <Folder size={18} color={DESIGN_TOKENS.neutral[700]} style={{ marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 500,
                    color: DESIGN_TOKENS.neutral[800],
                    marginBottom: '2px'
                  }}>
                    carpeta
                  </div>
                  <div style={{ 
                    fontSize: '12px',
                    color: DESIGN_TOKENS.neutral[500],
                    lineHeight: 1.3
                  }}>
                    Listas de grupos, documentos y más
                  </div>
                </div>
              </button>

              {/* DOCUMENTO */}
              <button
                onClick={() => handleAddOption('doc')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: DESIGN_TOKENS.border.radius.sm,
                  cursor: 'pointer',
                  transition: `all ${DESIGN_TOKENS.transition.fast}`,
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 102, 255, 0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <FileText size={18} color="#0095FF" />
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 500,
                  color: DESIGN_TOKENS.neutral[800]
                }}>
                  Documento
                </span>
              </button>

              {/* PANEL */}
              <button
                onClick={() => handleAddOption('panel')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: DESIGN_TOKENS.border.radius.sm,
                  cursor: 'pointer',
                  transition: `all ${DESIGN_TOKENS.transition.fast}`,
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 102, 255, 0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <LayoutDashboard size={18} color="#9333EA" />
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 500,
                  color: DESIGN_TOKENS.neutral[800]
                }}>
                  Panel
                </span>
              </button>

              {/* PIZARRA */}
              <button
                onClick={() => handleAddOption('whiteboard')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: DESIGN_TOKENS.border.radius.sm,
                  cursor: 'pointer',
                  transition: `all ${DESIGN_TOKENS.transition.fast}`,
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 102, 255, 0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <Zap size={18} color="#FFAB00" />
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 500,
                  color: DESIGN_TOKENS.neutral[800]
                }}>
                  Pizarra
                </span>
              </button>

              {/* FORMULARIO */}
              <button
                onClick={() => handleAddOption('form')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: DESIGN_TOKENS.border.radius.sm,
                  cursor: 'pointer',
                  transition: `all ${DESIGN_TOKENS.transition.fast}`,
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 102, 255, 0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <Layout size={18} color="#7E57C2" />
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 500,
                  color: DESIGN_TOKENS.neutral[800]
                }}>
                  Formulario
                </span>
              </button>

              <div style={{
                height: '0.5px',
                background: DESIGN_TOKENS.border.color.subtle,
                margin: '6px 0'
              }} />

              {/* IMPORTACIONES */}
              <button
                onClick={() => handleAddOption('import')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: DESIGN_TOKENS.border.radius.sm,
                  cursor: 'pointer',
                  transition: `all ${DESIGN_TOKENS.transition.fast}`,
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 102, 255, 0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <FileInput size={18} color={DESIGN_TOKENS.neutral[600]} />
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 500,
                  color: DESIGN_TOKENS.neutral[800]
                }}>
                  Importaciones
                </span>
                <ChevronRight size={16} color={DESIGN_TOKENS.neutral[400]} style={{ marginLeft: 'auto' }} />
              </button>

              {/* PLANTILLAS */}
              <button
                onClick={() => handleAddOption('template')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  borderRadius: DESIGN_TOKENS.border.radius.sm,
                  cursor: 'pointer',
                  transition: `all ${DESIGN_TOKENS.transition.fast}`,
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 102, 255, 0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <Layout size={18} color={DESIGN_TOKENS.neutral[600]} />
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 500,
                  color: DESIGN_TOKENS.neutral[800]
                }}>
                  Plantillas
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* WORKSPACE LIST WITH DND */}
      {workspaces.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={workspaces.map(w => w.id)}
            strategy={verticalListSortingStrategy}
          >
            <div>
              {workspaces.map((workspace) => (
                <SortableWorkspaceItem
                  key={workspace.id}
                  workspace={workspace}
                  isActive={currentWorkspace?.id === workspace.id}
                  isEditing={editingWorkspace === workspace.id}
                  isExpanded={expandedWorkspaces[workspace.id]}
                  onToggleExpand={toggleExpand}
                  onSelect={onSelectWorkspace}
                  onContextMenu={handleContextMenu}
                  onStartEdit={() => setEditingWorkspace(workspace.id)}
                  onEndEdit={handleEndEdit}
                  onSelectList={handleSelectList}
                  onRenameList={handleRenameList}
                  onDeleteList={handleDeleteList}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div style={{
          padding: '24px 12px',
          textAlign: 'center',
          color: DESIGN_TOKENS.neutral[400]
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}>📂</div>
          <div style={{ 
            fontSize: DESIGN_TOKENS.typography.size.xs,
            fontWeight: DESIGN_TOKENS.typography.weight.medium
          }}>
            Sin espacios
          </div>
          <div style={{ 
            fontSize: DESIGN_TOKENS.typography.size.xs,
            marginTop: '4px'
          }}>
            Usa el + para crear
          </div>
        </div>
      )}

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'white',
            border: `0.5px solid ${DESIGN_TOKENS.border.color.subtle}`,
            borderRadius: DESIGN_TOKENS.border.radius.md,
            boxShadow: `0 12px 40px rgba(0, 0, 0, 0.12)`,
            padding: '6px',
            minWidth: '180px',
            zIndex: 1000,
            animation: 'menuFadeIn 0.15s ease'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleRename(contextMenu.workspace)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              background: 'none',
              border: 'none',
              borderRadius: DESIGN_TOKENS.border.radius.sm,
              cursor: 'pointer',
              fontSize: DESIGN_TOKENS.typography.size.sm,
              fontWeight: DESIGN_TOKENS.typography.weight.medium,
              color: DESIGN_TOKENS.neutral[700],
              transition: `all ${DESIGN_TOKENS.transition.fast}`,
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 102, 255, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            ✏️ Renombrar
          </button>

          <div style={{
            height: '0.5px',
            background: DESIGN_TOKENS.border.color.subtle,
            margin: '4px 0'
          }} />

          <button
            onClick={() => handleDelete(contextMenu.workspace)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              background: 'none',
              border: 'none',
              borderRadius: DESIGN_TOKENS.border.radius.sm,
              cursor: 'pointer',
              fontSize: DESIGN_TOKENS.typography.size.sm,
              fontWeight: DESIGN_TOKENS.typography.weight.medium,
              color: DESIGN_TOKENS.danger.base,
              transition: `all ${DESIGN_TOKENS.transition.fast}`,
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = DESIGN_TOKENS.danger.light;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
          >
            🗑️ Eliminar
          </button>
        </div>
      )}

      <style>{`
        @keyframes workspaceSlideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes menuFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default WorkspaceList;