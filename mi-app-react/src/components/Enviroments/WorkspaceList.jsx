import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, MoreVertical, ChevronRight, GripVertical, Pencil, Trash2,
  MessageSquare, ListTodo, Folder, FileText, Trello,
  LayoutDashboard, Zap, FileInput, Layout, Briefcase
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
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
  onDeleteList,
  onAddToFolder,
  onAddItem,
  lists: props_lists,
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
  const [folderAddingItem, setFolderAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Listas del workspace — vienen del contexto vía prop
  const lists = props_lists || [];

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
          gap: '6px',
          padding: '7px 10px 7px 0',
          borderRadius: '8px',
          cursor: isDragging ? 'grabbing' : 'pointer',
          background: isActive
            ? `${workspace.settings?.color || DESIGN_TOKENS.primary.base}18`
            : 'transparent',
          transition: `all ${DESIGN_TOKENS.transition.fast}`,
          position: 'relative',
          borderLeft: workspace.type !== 'folder'
            ? `3px solid ${isActive ? (workspace.settings?.color || DESIGN_TOKENS.primary.base) : 'transparent'}`
            : '3px solid transparent',
          outline: isDragging ? `2px solid ${DESIGN_TOKENS.primary.base}` : 'none',
          paddingLeft: '8px',
        }}
        onMouseEnter={(e) => {
          setIsHovered(true);
          if (!isActive && !isDragging) {
            const color = workspace.settings?.color || DESIGN_TOKENS.primary.base;
            e.currentTarget.style.background = `${color}10`;
            e.currentTarget.style.borderLeftColor = `${color}60`;
          }
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          if (!isActive && !isDragging) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderLeftColor = 'transparent';
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
            opacity: isDragging ? 0 : 0,
            transition: 'opacity 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
          onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
        >
          <GripVertical size={13} />
        </div>

        {/* EXPAND BUTTON */}
        {(lists.length > 0 || workspace.type === 'folder') ? (
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
              flexShrink: 0,
              transition: `transform ${DESIGN_TOKENS.transition.normal}`
            }}
          >
            <ChevronRight
              size={13}
              style={{
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: `transform ${DESIGN_TOKENS.transition.normal}`
              }}
            />
          </button>
        ) : (
          <div style={{ width: '18px', flexShrink: 0 }} />
        )}

        {/* ICON / COLOR DOT */}
        {workspace.type === 'folder' ? (
          <Folder
            size={14}
            color={DESIGN_TOKENS.neutral[500]}
            style={{ flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: workspace.settings?.color || DESIGN_TOKENS.primary.base,
            flexShrink: 0,
            boxShadow: `0 0 0 2px ${(workspace.settings?.color || DESIGN_TOKENS.primary.base)}30`,
          }} />
        )}

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
              background: 'var(--bg-input, white)',
              padding: '3px 8px',
              borderRadius: DESIGN_TOKENS.border.radius.sm,
              fontSize: DESIGN_TOKENS.typography.size.sm,
              outline: 'none',
              fontWeight: DESIGN_TOKENS.typography.weight.medium,
              color: 'var(--text-primary)',
            }}
          />
        ) : (
          <span style={{
            flex: 1,
            fontSize: '13px',
            fontWeight: isActive ? 600 : 500,
            color: isActive
              ? (workspace.settings?.color || DESIGN_TOKENS.primary.base)
              : 'var(--text-primary, #0f172a)',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            letterSpacing: '-0.01em',
            padding: '2px 0',
          }}>
            {workspace.name}
          </span>
        )}

        {/* LIST COUNT badge / ADD button */}
        {isHovered ? (
          <button
            onClick={(e) => { e.stopPropagation(); onAddItem && onAddItem(workspace, e); }}
            style={{
              background: 'none',
              border: 'none',
              padding: '3px',
              cursor: 'pointer',
              color: DESIGN_TOKENS.neutral[400],
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,102,255,0.1)'; e.currentTarget.style.color = DESIGN_TOKENS.primary.base; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = DESIGN_TOKENS.neutral[400]; }}
            title="Agregar al espacio"
          >
            <Plus size={13} />
          </button>
        ) : lists.length > 0 ? (
          <span style={{
            fontSize: '10px',
            color: 'var(--text-subtle, #94a3b8)',
            fontWeight: 600,
            background: 'var(--bg-input, rgba(15,23,42,0.05))',
            borderRadius: '10px',
            padding: '1px 6px',
            flexShrink: 0,
          }}>
            {lists.length}
          </span>
        ) : null}
      </div>

      {/* LISTS (COLLAPSED) */}
      {isExpanded && workspace.type !== 'folder' && (
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

          {/* ADD ITEM BUTTON inside workspace */}
          <button
            onClick={(e) => { onAddItem && onAddItem(workspace, e); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              marginTop: '2px',
              background: 'none',
              border: `1px dashed ${DESIGN_TOKENS.border.color.subtle}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              color: DESIGN_TOKENS.neutral[500],
              width: '100%',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 102, 255, 0.04)';
              e.currentTarget.style.borderColor = DESIGN_TOKENS.primary.base;
              e.currentTarget.style.color = DESIGN_TOKENS.primary.base;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.borderColor = DESIGN_TOKENS.border.color.subtle;
              e.currentTarget.style.color = DESIGN_TOKENS.neutral[500];
            }}
          >
            <Plus size={12} />
            Agregar lista
          </button>
        </div>
      )}

      {/* FOLDER EXPANDED — add item area */}
      {isExpanded && workspace.type === 'folder' && (
        <div style={{ paddingLeft: '36px', marginTop: '2px', paddingBottom: '4px' }}>
          {folderAddingItem ? (
            <div style={{ padding: '4px 8px 8px' }}>
              {/* Type selector */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
                {[
                  { type: 'list', label: 'Lista', color: '#0095FF' },
                  { type: 'doc', label: 'Doc', color: '#10b981' },
                  { type: 'panel', label: 'Panel', color: '#9333EA' },
                  { type: 'whiteboard', label: 'Pizarra', color: '#f59e0b' },
                  { type: 'form', label: 'Form', color: '#ef4444' },
                ].map(({ type, label, color }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFolderAddingItem(type)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${folderAddingItem === type ? color : DESIGN_TOKENS.border.color.subtle}`,
                      background: folderAddingItem === type ? `${color}15` : 'transparent',
                      color: folderAddingItem === type ? color : DESIGN_TOKENS.neutral[600],
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                autoFocus
                placeholder="Nombre..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newItemName.trim()) {
                    onAddToFolder(workspace.id, typeof folderAddingItem === 'string' ? folderAddingItem : 'list', newItemName.trim());
                    setNewItemName('');
                    setFolderAddingItem(false);
                  }
                  if (e.key === 'Escape') {
                    setFolderAddingItem(false);
                    setNewItemName('');
                  }
                }}
                onBlur={() => {
                  if (newItemName.trim()) {
                    onAddToFolder(workspace.id, typeof folderAddingItem === 'string' ? folderAddingItem : 'list', newItemName.trim());
                  }
                  setFolderAddingItem(false);
                  setNewItemName('');
                }}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: `1px solid ${DESIGN_TOKENS.primary.base}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: '11px', color: DESIGN_TOKENS.neutral[400], marginTop: '4px' }}>
                Enter para guardar · Esc para cancelar
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFolderAddingItem('list');
                setNewItemName('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                background: 'none',
                border: `1px dashed ${DESIGN_TOKENS.border.color.subtle}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                color: DESIGN_TOKENS.neutral[500],
                width: '100%',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 102, 255, 0.04)';
                e.currentTarget.style.borderColor = DESIGN_TOKENS.primary.base;
                e.currentTarget.style.color = DESIGN_TOKENS.primary.base;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.borderColor = DESIGN_TOKENS.border.color.subtle;
                e.currentTarget.style.color = DESIGN_TOKENS.neutral[500];
              }}
            >
              <Plus size={12} />
              Agregar elemento
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// WORKSPACE LIST WITH DRAG AND DROP
// ============================================================================
const WorkspaceList = ({ onCreateWorkspace, onSelectWorkspace, onOpenChat, onOpenBacklog, onCreateList, onSelectList }) => {
  const { currentEnvironment, currentWorkspace, deleteWorkspace, updateWorkspace, lists, deleteList, updateList } = useApp();
  const workspaces = currentEnvironment?.workspaces || [];
  const [expandedWorkspaces, setExpandedWorkspaces] = useState({});
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [activeMenuWorkspace, setActiveMenuWorkspace] = useState(null);
  const addMenuRef = useRef(null);
  const addButtonRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const dragState = useRef(null);

  const handleMenuDragStart = useCallback((e) => {
    e.preventDefault();
    dragState.current = {
      startX: e.clientX - menuPos.left,
      startY: e.clientY - menuPos.top,
    };
    const onMove = (ev) => {
      if (!dragState.current) return;
      setMenuPos({
        left: ev.clientX - dragState.current.startX,
        top: ev.clientY - dragState.current.startY,
      });
    };
    const onUp = () => {
      dragState.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [menuPos]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;reordered

      const oldIndex = workspaces.findIndex(item => item.id === active.id);
      const newIndex = workspaces.findIndex(item => item.id === over.id);
      const reordered = arrayMove(workspaces, oldIndex, newIndex);
      
      // Actualiza el contexto directamente
      updateWorkspace(active.id, { order: newIndex }); // o guarda el orden como prefieras
    };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        addButtonRef.current && !addButtonRef.current.contains(event.target) &&
        addMenuRef.current && !addMenuRef.current.contains(event.target)
      ) {
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
  const ws = activeMenuWorkspace;
  setActiveMenuWorkspace(null);
  if (type === 'space') {
    onCreateWorkspace();
  } else if (type === 'chat') {
    onOpenChat && onOpenChat();
  } else if (type === 'backlog') {
    onOpenBacklog && onOpenBacklog();
  } else if (type === 'list') {
    onCreateList && onCreateList(ws);
  } else if (type === 'folder') {
    console.log('Crear carpeta: pendiente de implementación completa');
  } else {
    console.log(`Crear ${type}: pendiente de implementación`);
  }
};

  const handleWorkspaceAddItem = (workspace, e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuH = 440;
    const vp = window.innerHeight;
    const left = rect.right + 10;
    const top = Math.min(rect.top, vp - menuH - 16);
    setMenuPos({ top: Math.max(16, top), left: Math.max(8, left) });
    setActiveMenuWorkspace(workspace);
    setShowAddMenu(true);
  };

  const handleDeleteList = async (list) => {
    if (confirm(`¿Eliminar la lista "${list.name}"?`)) {
      await deleteList(list.id);
    }
  };

  const handleRenameList = async (list) => {
    const newName = prompt('Nuevo nombre:', list.name);
    if (newName && newName.trim()) {
      await updateList(list.id, { name: newName.trim() });
    }
  };

  const handleSelectList = (list) => {
    onSelectList && onSelectList(list);
  };

  const addItemToFolder = (folderId, itemType, itemName) => {
    console.log('addItemToFolder: pendiente de implementación', folderId, itemType, itemName);
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
        <div style={{ position: 'relative' }}>
          <button
            ref={addButtonRef}
            onClick={() => onCreateWorkspace()}
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
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = DESIGN_TOKENS.neutral[400];
            }}
          >
            <Plus size={16} />
          </button>

          {/* ADD MENU — portal para salir del stacking context del sidebar */}
          {showAddMenu && createPortal(
            <div
              ref={addMenuRef}
              style={{
                position: 'fixed',
                top: `${menuPos.top}px`,
                left: `${Math.max(8, menuPos.left)}px`,
                background: 'white',
                border: `1px solid var(--border, ${DESIGN_TOKENS.border.color.subtle})`,
                borderRadius: '16px',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.18)',
                padding: '8px',
                minWidth: '280px',
                zIndex: 9999,
                animation: 'menuFadeIn 0.18s cubic-bezier(0.4,0,0.2,1)'
              }}>
              {/* HEADER — drag handle */}
              <div
                onMouseDown={handleMenuDragStart}
                style={{
                  padding: '8px 12px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'grab',
                  userSelect: 'none',
                  borderBottom: `1px solid var(--border, ${DESIGN_TOKENS.border.color.subtle})`,
                  marginBottom: '6px',
                }}
              >
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: DESIGN_TOKENS.neutral[500],
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Crea
                </span>
                <span style={{ fontSize: '13px', color: DESIGN_TOKENS.neutral[300], letterSpacing: '2px', lineHeight: 1 }}>
                  ⠿
                </span>
              </div>

              {/* ESPACIO */}
              <button
                onClick={() => handleAddOption('space')}
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
                <Briefcase size={18} color={DESIGN_TOKENS.primary.base} style={{ marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: DESIGN_TOKENS.primary.base,
                    marginBottom: '2px'
                  }}>
                    Espacio
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: DESIGN_TOKENS.neutral[500],
                    lineHeight: 1.3
                  }}>
                    Agrupa listas y proyectos de un equipo o área
                  </div>
                </div>
              </button>

              <div style={{ height: '0.5px', background: DESIGN_TOKENS.border.color.subtle, margin: '4px 8px' }} />

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
                    Lista
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
            </div>,
            document.body
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
            <div style={{
              background: 'var(--bg-input, rgba(15,23,42,0.02))',
              borderRadius: '12px',
              padding: '4px 4px',
              border: '1px solid var(--border, rgba(15,23,42,0.04))',
              margin: '0 4px',
            }}>
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
                  onAddToFolder={addItemToFolder}
                  onAddItem={handleWorkspaceAddItem}
                  lists={lists.filter(l => l.workspace_id === workspace.id)}
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