import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

/**
 * SelectDropdown — custom dropdown with floating panel rendered via portal.
 * El panel se monta en document.body para escapar de cualquier backdropFilter,
 * transform o filter en los ancestros que rompería position:fixed.
 *
 * Props:
 *   value       — valor actualmente seleccionado
 *   onChange    — llamado con evento sintético { target: { value } } (compatible con handlers existentes)
 *   options     — array de { value, label, dot? (color string) }
 *   placeholder — texto cuando no hay valor seleccionado
 *   size        — 'sm' | 'md' (default 'md')
 *   style       — aplicado al contenedor
 *   disabled
 */
export default function SelectDropdown({
  value,
  onChange,
  options = [],
  placeholder = '— Seleccionar',
  size = 'md',
  style = {},
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, minWidth: 160, openUp: false });
  const ref     = useRef(null);
  const btnRef  = useRef(null);
  const panelRef = useRef(null);
  const isSmall  = size === 'sm';
  const MAX_H    = 280;

  // Cierra al hacer click fuera (funciona igual con portal)
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        ref.current    && !ref.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const calcPos = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const minW = Math.max(rect.width, 160);

    // Flip vertical si no hay espacio abajo
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < MAX_H && spaceAbove > spaceBelow;

    // Ajuste horizontal: si el panel se saldría a la derecha, lo desplazamos a la izquierda
    let left = rect.left;
    if (left + minW > vw - 8) left = Math.max(8, vw - minW - 8);

    setPanelPos({
      top:     openUp ? rect.top : rect.bottom + 4,
      left,
      minWidth: minW,
      openUp,
    });
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!open) calcPos();
    setOpen(v => !v);
  };

  const selected = options.find(o => String(o.value) === String(value));

  const handleSelect = (optValue) => {
    onChange({ target: { value: optValue } });
    setOpen(false);
  };

  const fullWidth = style.width === '100%' || style.width === '100vw';

  // Panel JSX — se montará vía portal en document.body
  const panel = open && createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top:      panelPos.top,
        left:     panelPos.left,
        minWidth: panelPos.minWidth,
        zIndex:   99999,
        background:   'white',
        borderRadius: '14px',
        border:       '1px solid #e8ecf0',
        boxShadow:    '0 8px 28px rgba(15,23,42,0.13)',
        padding:      '6px',
        overflowY:    'auto',
        maxHeight:    `${MAX_H}px`,
        transform:    panelPos.openUp ? 'translateY(-100%)' : undefined,
      }}
    >
      {options.map(opt => {
        const isActive = String(opt.value) === String(value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '10px',
              width:      '100%',
              padding:    '8px 12px',
              border:     'none',
              borderRadius: '8px',
              cursor:     'pointer',
              fontSize:   '13px',
              fontWeight: isActive ? 600 : 400,
              fontFamily: 'inherit',
              textAlign:  'left',
              background: isActive ? '#eef2ff' : 'transparent',
              color:      isActive ? '#4f46e5' : '#374151',
              transition: 'background 0.12s',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.dot && (
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: opt.dot, flexShrink: 0,
              }} />
            )}
            <span style={{ flex: 1 }}>{opt.label}</span>
            {isActive && <Check size={13} style={{ color: '#4f46e5', flexShrink: 0 }} />}
          </button>
        );
      })}
    </div>,
    document.body
  );

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        display:  fullWidth ? 'block' : 'inline-flex',
        ...style,
      }}
    >
      {/* ── Trigger ── */}
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        onMouseEnter={e => { if (!disabled && !open) e.currentTarget.style.borderColor = '#a5b4fc'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = '#e2e8f0'; }}
        style={{
          display:    'flex',
          alignItems: 'center',
          gap:        isSmall ? '6px' : '8px',
          width:      fullWidth ? '100%' : 'auto',
          padding:    isSmall ? '5px 28px 5px 10px' : '9px 34px 9px 12px',
          border:     '1px solid',
          borderColor: open ? '#6366f1' : '#e2e8f0',
          borderRadius: isSmall ? '8px' : '10px',
          background: 'white',
          color:      selected ? '#374151' : '#9ca3af',
          fontSize:   isSmall ? '12px' : '13.5px',
          fontWeight: 500,
          fontFamily: 'inherit',
          cursor:     disabled ? 'not-allowed' : 'pointer',
          outline:    'none',
          textAlign:  'left',
          boxShadow:  open ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
          opacity:    disabled ? 0.6 : 1,
          transition: 'border-color 0.18s, box-shadow 0.18s',
          whiteSpace: 'nowrap',
          overflow:   'hidden',
          boxSizing:  'border-box',
        }}
      >
        {selected?.dot && (
          <span style={{
            width:        isSmall ? 7 : 8,
            height:       isSmall ? 7 : 8,
            borderRadius: '50%',
            background:   selected.dot,
            flexShrink:   0,
          }} />
        )}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selected?.label ?? placeholder}
        </span>
      </button>

      {/* ── Custom arrow ── */}
      <ChevronDown
        size={isSmall ? 13 : 15}
        style={{
          position:  'absolute',
          right:     isSmall ? 8 : 10,
          top:       '50%',
          transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          color:         '#9ca3af',
          pointerEvents: 'none',
          transition:    'transform 0.18s',
        }}
      />

      {/* ── Portal panel ── */}
      {panel}
    </div>
  );
}
