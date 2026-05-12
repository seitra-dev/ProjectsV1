import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * AppSelect — reemplaza todos los <select> nativos de la app.
 * Diseño consistente: borde suave, flecha custom, hover/focus en violeta.
 *
 * Props:
 *   value, onChange, disabled, style  → igual que <select>
 *   children                          → <option> elements
 *   size   'sm' | 'md' (default 'md')
 *   icon   ReactNode opcional (icono izquierdo)
 */
export default function AppSelect({
  value, onChange, disabled = false,
  children, style = {}, size = 'md', icon = null,
  ...rest
}) {
  const isSmall = size === 'sm';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', ...style }}>
      {icon && (
        <span style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: '#94a3b8', pointerEvents: 'none', display: 'flex', alignItems: 'center',
          zIndex: 1,
        }}>
          {icon}
        </span>
      )}

      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...rest}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          width: '100%',
          padding: isSmall
            ? `5px ${icon ? '28px' : '10px'} 5px ${icon ? '28px' : '10px'}`
            : `9px ${icon ? '34px' : '12px'} 9px ${icon ? '34px' : '12px'}`,
          paddingRight: isSmall ? '28px' : '34px',
          border: '1px solid #e2e8f0',
          borderRadius: isSmall ? '8px' : '10px',
          fontSize: isSmall ? '12px' : '13.5px',
          fontWeight: 500,
          fontFamily: 'inherit',
          color: '#374151',
          background: 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.18s, box-shadow 0.18s',
          opacity: disabled ? 0.6 : 1,
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = '#6366f1';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)';
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onMouseEnter={e => {
          if (!disabled && document.activeElement !== e.currentTarget)
            e.currentTarget.style.borderColor = '#a5b4fc';
        }}
        onMouseLeave={e => {
          if (document.activeElement !== e.currentTarget)
            e.currentTarget.style.borderColor = '#e2e8f0';
        }}
      >
        {children}
      </select>

      {/* Flecha custom */}
      <ChevronDown
        size={isSmall ? 13 : 15}
        style={{
          position: 'absolute',
          right: isSmall ? 8 : 10,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#9ca3af',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// ─── Estilos compartidos para paneles de dropdown custom ──────────────────────
export const DROPDOWN_PANEL = {
  position: 'absolute',
  background: 'white',
  borderRadius: '14px',
  border: '1px solid #e8ecf0',
  boxShadow: '0 8px 28px rgba(15,23,42,0.13)',
  padding: '6px',
  zIndex: 400,
  minWidth: 180,
  overflow: 'hidden',
};

export const DROPDOWN_ITEM_BASE = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  padding: '9px 13px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 400,
  fontFamily: 'inherit',
  textAlign: 'left',
  background: 'transparent',
  color: '#374151',
  transition: 'background 0.12s',
};

export const DROPDOWN_ITEM_ACTIVE = {
  ...DROPDOWN_ITEM_BASE,
  background: '#eef2ff',
  color: '#4f46e5',
  fontWeight: 600,
};

export const DROPDOWN_SEPARATOR = {
  height: '1px',
  background: '#f1f5f9',
  margin: '4px 6px',
};
