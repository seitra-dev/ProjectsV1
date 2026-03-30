import React, { useRef, useEffect } from 'react';
import { ArrowUpDown, ArrowDownUp, Layers, ArrowLeftToLine, ArrowRightToLine, EyeOff } from 'lucide-react';

export const COLUMN_MENU_OPTIONS = [
  { icon: ArrowUpDown,      label: 'Ordenar A→Z',              action: 'sort_asc'   },
  { icon: ArrowDownUp,      label: 'Ordenar Z→A',              action: 'sort_desc'  },
  { icon: Layers,           label: 'Agrupar por esta columna', action: 'group'      },
  null,
  { icon: ArrowLeftToLine,  label: 'Mover al inicio',          action: 'move_first' },
  { icon: ArrowRightToLine, label: 'Mover al final',           action: 'move_last'  },
  { icon: EyeOff,           label: 'Ocultar columna',          action: 'hide'       },
];

export function ColumnMenu({ col, x, y, columns, setColumns, visibleColumns, setVisibleColumns, onSort, setGroupBy, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleAction = (action) => {
    onClose();
    if (action === 'sort_asc') onSort?.(col.key, 'asc');
    else if (action === 'sort_desc') onSort?.(col.key, 'desc');
    else if (action === 'group') setGroupBy?.(col.key);
    else if (action === 'move_first') {
      setColumns(prev => {
        const next = [...prev];
        const [moved] = next.splice(next.findIndex(c => c.key === col.key), 1);
        return [moved, ...next];
      });
    } else if (action === 'move_last') {
      setColumns(prev => {
        const next = [...prev];
        const [moved] = next.splice(next.findIndex(c => c.key === col.key), 1);
        return [...next, moved];
      });
    } else if (action === 'hide') {
      setVisibleColumns(prev => prev.filter(k => k !== col.key));
    }
  };

  return (
    <div ref={ref} style={{
      position: 'fixed', top: y, left: x, zIndex: 9999,
      background: 'white', border: '1px solid #f1f5f9',
      borderRadius: '14px', padding: '6px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      minWidth: '220px',
    }}>
      {COLUMN_MENU_OPTIONS.map((opt, i) => {
        if (!opt) return <div key={i} style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />;
        const Icon = opt.icon;
        return (
          <div
            key={opt.action}
            onClick={() => handleAction(opt.action)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 14px', borderRadius: '8px',
              fontSize: '13px', color: '#374151', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Icon size={14} color="#64748b" />
            {opt.label}
          </div>
        );
      })}
    </div>
  );
}

export default ColumnMenu;
