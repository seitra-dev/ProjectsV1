import React, { useRef, useEffect } from 'react';
import {
  ArrowUpDown,
  ArrowDownUp,
  Layers,
  ArrowLeftToLine,
  ArrowRightToLine,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { DESIGN_TOKENS } from '../../styles/tokens';

export const COLUMN_MENU_OPTIONS = [
  { icon: ArrowUpDown, label: 'Ordenar A→Z', action: 'sort_asc' },
  { icon: ArrowDownUp, label: 'Ordenar Z→A', action: 'sort_desc' },
  { icon: Layers, label: 'Agrupar por esta columna', action: 'group' },
  null,
  { icon: ArrowLeftToLine, label: 'Mover al inicio', action: 'move_first' },
  { icon: ArrowRightToLine, label: 'Mover al final', action: 'move_last' },
  { icon: EyeOff, label: 'Ocultar columna', action: 'hide' },
];

const menuShell = {
  position: 'fixed',
  zIndex: 9999,
  background: 'white',
  border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
  borderRadius: DESIGN_TOKENS.border.radius.md,
  padding: 6,
  boxShadow: DESIGN_TOKENS.shadows.lg,
  minWidth: 220,
};

const itemStyle = (danger) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '9px 14px',
  borderRadius: DESIGN_TOKENS.border.radius.sm,
  fontSize: DESIGN_TOKENS.typography.size.sm,
  color: danger ? DESIGN_TOKENS.danger.base : DESIGN_TOKENS.neutral[700],
  cursor: 'pointer',
  fontFamily: DESIGN_TOKENS.typography.fontFamily,
  transition: 'background-color 0.2s ease', // ← MEJORADO: Transición suave
});

/**
 * Menú contextual de columna (estándar o campo personalizado).
 * Si `customField` está definido, las acciones se delegan a los callbacks `onCustomField*`
 * e incluye "Eliminar columna".
 */
export function ColumnMenu({
  col,
  customField,
  x,
  y,
  columns = [], // ← MEJORADO: Fallback a array vacío
  setColumns = () => {}, // ← MEJORADO: Fallback a função vacía
  visibleColumns = [], // ← MEJORADO: Fallback a array vacío
  setVisibleColumns = () => {}, // ← MEJORADO: Fallback a función vacía
  onSort = () => {}, // ← MEJORADO: Fallback
  setGroupBy = () => {}, // ← MEJORADO: Fallback
  onClose = () => {}, // ← MEJORADO: Fallback
  onCustomFieldSort = () => {}, // ← MEJORADO: Fallback
  onCustomFieldGroup = () => {}, // ← MEJORADO: Fallback
  onCustomFieldMove = () => {}, // ← MEJORADO: Fallback
  onCustomFieldHide = () => {}, // ← MEJORADO: Fallback
  onCustomFieldDelete = () => {}, // ← MEJORADO: Fallback
}) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose(); // ← CORREGIDO: Ahora tiene fallback
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleAction = (action) => {
    onClose();
    
    if (customField) {
      switch (action) {
        case 'sort_asc':
          onCustomFieldSort(customField, 'asc');
          break;
        case 'sort_desc':
          onCustomFieldSort(customField, 'desc');
          break;
        case 'group':
          onCustomFieldGroup(customField);
          break;
        case 'move_first':
          onCustomFieldMove(customField.id, 'first');
          break;
        case 'move_last':
          onCustomFieldMove(customField.id, 'last');
          break;
        case 'hide':
          onCustomFieldHide(customField.id);
          break;
        case 'delete':
          onCustomFieldDelete(customField);
          break;
        default:
          break;
      }
      return;
    }

    switch (action) {
      case 'sort_asc':
        onSort(col.key, 'asc');
        break;
      case 'sort_desc':
        onSort(col.key, 'desc');
        break;
      case 'group':
        setGroupBy(col.key);
        break;
      case 'move_first':
        setColumns((prev) => {
          const next = [...prev];
          const idx = next.findIndex((c) => c.key === col.key);
          if (idx === -1) return prev;
          const [moved] = next.splice(idx, 1);
          return [moved, ...next];
        });
        break;
      case 'move_last':
        setColumns((prev) => {
          const next = [...prev];
          const idx = next.findIndex((c) => c.key === col.key);
          if (idx === -1) return prev;
          const [moved] = next.splice(idx, 1);
          return [...next, moved];
        });
        break;
      case 'hide':
        setVisibleColumns((prev) => prev.filter((k) => k !== col.key));
        break;
      default:
        break;
    }
  };

  return (
    <div ref={ref} style={{ ...menuShell, top: y, left: x }}>
      {COLUMN_MENU_OPTIONS.map((opt, i) => {
        if (!opt) {
          return (
            <div
              key={`sep-${i}`}
              style={{
                height: 1,
                background: DESIGN_TOKENS.border.color.subtle,
                margin: '4px 0',
              }}
            />
          );
        }
        const Icon = opt.icon;
        return (
          <div
            key={opt.action}
            onClick={() => handleAction(opt.action)}
            style={itemStyle(false)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = DESIGN_TOKENS.neutral[50];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            role="button" // ← MEJORADO: Accesibilidad
            tabIndex={0} // ← MEJORADO: Accesibilidad
            onKeyDown={(e) => { // ← MEJORADO: Soporte keyboard
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAction(opt.action);
              }
            }}
          >
            <Icon size={14} color={DESIGN_TOKENS.neutral[500]} />
            {opt.label}
          </div>
        );
      })}
      {customField ? (
        <>
          <div
            style={{
              height: 1,
              background: DESIGN_TOKENS.border.color.subtle,
              margin: '4px 0',
            }}
          />
          <div
            onClick={() => handleAction('delete')}
            style={itemStyle(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = DESIGN_TOKENS.danger.light;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            role="button" // ← MEJORADO: Accesibilidad
            tabIndex={0} // ← MEJORADO: Accesibilidad
            onKeyDown={(e) => { // ← MEJORADO: Soporte keyboard
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAction('delete');
              }
            }}
          >
            <Trash2 size={14} color={DESIGN_TOKENS.danger.base} />
            Eliminar columna
          </div>
        </>
      ) : null}
    </div>
  );
}

export default ColumnMenu;