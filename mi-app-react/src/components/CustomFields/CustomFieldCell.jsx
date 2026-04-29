import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, Lock } from 'lucide-react';

function CustomFieldCell({
  field,
  value,
  onChange,
  onSave,
  users = [],
  project = null,
  roadmapPhases = [],
  currentUser = null,
  environmentId = null,
  canEditDates = false,
}) {
  const originalValueRef = useRef(value);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);

  // Cierra el dropdown al hacer click fuera
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 160) });
    }
    setDropdownOpen(true);
  };

  const handleBlur = (e) => {
    if (onSave && originalValueRef.current !== e.target.value) {
      onSave(e.target.value);
      originalValueRef.current = e.target.value;
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  };

  const safeValue = value ?? '';

  // ========================================================================
  // TIPO: select (con colores)
  // ========================================================================
  if (field.type === 'select' && field.options && Array.isArray(field.options)) {
    // Normaliza: soporta strings simples Y objetos {id, color, label}
    const FALLBACK_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
    const options = field.options.map((opt, i) =>
      typeof opt === 'string'
        ? { id: opt, label: opt, color: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }
        : opt
    );

    const selectedOption = options.find(opt => opt.id === safeValue || opt.label === safeValue);

    return (
      <div ref={triggerRef} style={{ position: 'relative' }}>
        <button
          onClick={openDropdown}
          style={{
            ...inputStyle,
            display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer',
            background: selectedOption ? selectedOption.color + '15' : '#fff',
            border: `1px solid ${selectedOption ? selectedOption.color : '#e5e7eb'}`,
            color: selectedOption ? selectedOption.color : '#6b7280',
            fontWeight: selectedOption ? 500 : 400,
          }}
        >
          {selectedOption && (
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedOption.color, flexShrink: 0 }} />
          )}
          <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedOption?.label || 'Seleccionar...'}
          </span>
          <ChevronDown size={14} style={{ flexShrink: 0 }} />
        </button>

        {dropdownOpen && (
          <div style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            minWidth: dropPos.width,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 9999,
            overflow: 'hidden',
          }}>
            <button
              onClick={() => { onChange(null); onSave?.(null); setDropdownOpen(false); }}
              style={{
                width: '100%', padding: '9px 12px', border: 'none',
                background: !safeValue ? '#f0f4ff' : 'transparent',
                cursor: 'pointer', textAlign: 'left',
                fontSize: '12px', color: '#9ca3af',
              }}
            >
              — Sin valor
            </button>
            {options.map((option) => {
              const isSelected = option.id === safeValue || option.label === safeValue;
              return (
                <button
                  key={option.id}
                  onClick={() => { onChange(option.label); onSave?.(option.label); setDropdownOpen(false); }}
                  style={{
                    width: '100%', padding: '9px 12px', border: 'none',
                    background: isSelected ? option.color + '20' : 'transparent',
                    cursor: 'pointer', textAlign: 'left', display: 'flex',
                    alignItems: 'center', gap: '8px', fontSize: '13px',
                    color: option.color, fontWeight: isSelected ? 600 : 400,
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? option.color + '20' : 'transparent'; }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: option.color, flexShrink: 0 }} />
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ========================================================================
  // TIPO: member_select (selector de miembros del equipo, SOLO DEL PROYECTO)
  // ========================================================================
  if (field.type === 'member_select') {
    // project.members almacena UUIDs → resolver contra el array users (objetos completos).
    // Si no hay members configurados en el proyecto, mostramos todos los del entorno.
    const memberIds = project?.members ?? [];
    const projectMembers = memberIds.length > 0
      ? memberIds.map(id => users.find(u => u.id === id)).filter(Boolean)
      : users;

    const selectedMember = projectMembers.find((m) => m.id === safeValue);

    return (
      <div ref={triggerRef} style={{ position: 'relative' }}>
        <button
          onClick={openDropdown}
          style={{
            ...inputStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            background: '#fff',
          }}
        >
          {selectedMember && (
            <>
              {typeof selectedMember.avatar === 'string' && (selectedMember.avatar.startsWith('http') || selectedMember.avatar.startsWith('data:')) ? (
                <img src={selectedMember.avatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <span style={{ fontSize: '14px' }}>{selectedMember.avatar || '👤'}</span>
              )}
              <span style={{ flex: 1, textAlign: 'left', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedMember.name || selectedMember.email}
              </span>
            </>
          )}
          {!selectedMember && (
            <span style={{ color: '#9ca3af', flex: 1 }}>Asignar...</span>
          )}
          <ChevronDown size={14} style={{ flexShrink: 0 }} />
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: 'fixed',
              top: dropPos.top,
              left: dropPos.left,
              minWidth: dropPos.width,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 9999,
              maxHeight: '220px',
              overflowY: 'auto',
            }}
          >
            <button
              onClick={() => {
                onChange(null);
                onSave?.(null);
                setDropdownOpen(false);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                background: !safeValue ? '#e3f2fd' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '12px',
                color: '#6b7280',
              }}
            >
              — Sin asignar
            </button>

            {projectMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => {
                  onChange(member.id);
                  onSave?.(member.id);
                  setDropdownOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background:
                    member.id === safeValue ? '#e3f2fd' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                }}
              >
                {typeof member.avatar === 'string' && (member.avatar.startsWith('http') || member.avatar.startsWith('data:')) ? (
                  <img src={member.avatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <span style={{ fontSize: '14px' }}>{member.avatar || '👤'}</span>
                )}
                {member.name || member.email}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ========================================================================
  // TIPO: roadmap_sync (sincronizado con roadmap)
  // ========================================================================
  if (field.type === 'roadmap_sync' && roadmapPhases) {
    const selectedPhase = roadmapPhases.find((p) => p.id === safeValue);

    return (
      <div ref={triggerRef} style={{ position: 'relative' }}>
        <button
          onClick={openDropdown}
          style={{
            ...inputStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            background: selectedPhase
              ? selectedPhase.color + '15'
              : '#fff',
            border: `1px solid ${selectedPhase ? selectedPhase.color : '#e5e7eb'}`,
            color: selectedPhase ? selectedPhase.color : '#6b7280',
            fontWeight: selectedPhase ? 500 : 400,
          }}
        >
          {selectedPhase && (
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: selectedPhase.color,
              }}
            />
          )}
          <span style={{ flex: 1, textAlign: 'left' }}>
            {selectedPhase?.name || 'Seleccionar fase...'}
          </span>
          <ChevronDown size={14} />
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: 'fixed',
              top: dropPos.top,
              left: dropPos.left,
              minWidth: dropPos.width,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 9999,
              maxHeight: '240px',
              overflowY: 'auto',
            }}
          >
            {roadmapPhases.map((phase) => (
              <button
                key={phase.id}
                onClick={() => {
                  onChange(phase.id);
                  onSave?.(phase.id);
                  setDropdownOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background:
                    phase.id === safeValue ? phase.color + '20' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: phase.color,
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: phase.color,
                  }}
                />
                {phase.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ========================================================================
  // TIPO: text
  // ========================================================================
  if (field.type === 'text') {
    return (
      <input
        type="text"
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          originalValueRef.current = safeValue;
        }}
        onBlur={handleBlur}
        placeholder={`Escribir ${field.name?.toLowerCase() || 'texto'}...`}
        style={inputStyle}
        className="custom-field-input"
      />
    );
  }

  // ========================================================================
  // TIPO: number
  // ========================================================================
  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={safeValue}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === '' ? null : Number(val));
        }}
        onFocus={() => {
          originalValueRef.current = safeValue;
        }}
        onBlur={handleBlur}
        placeholder="0"
        style={inputStyle}
      />
    );
  }

  // ========================================================================
  // TIPO: date (BLOQUEADO si no es admin/owner del entorno)
  // ========================================================================
  if (field.type === 'date') {
    if (!canEditDates) {
      // Mostrar como read-only con candado
      return (
        <div
          style={{
            ...inputStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f9fafb',
            cursor: 'not-allowed',
            color: '#9ca3af',
          }}
        >
          <span style={{ flex: 1 }}>{safeValue || '—'}</span>
          <Lock size={14} color="#d1d5db" />
        </div>
      );
    }

    return (
      <input
        type="date"
        value={safeValue}
        onChange={(e) => {
          onChange(e.target.value);
          onSave?.(e.target.value);
        }}
        style={inputStyle}
        title="Solo Admin/Owner del entorno puede editar fechas"
      />
    );
  }

  // ========================================================================
  // TIPO: checkbox
  // ========================================================================
  if (field.type === 'checkbox') {
    return (
      <div style={{ textAlign: 'center' }}>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => {
            onChange(e.target.checked);
            onSave?.(e.target.checked);
          }}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
      </div>
    );
  }

  // ========================================================================
  // TIPO: url
  // ========================================================================
  if (field.type === 'url') {
    return (
      <input
        type="url"
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          originalValueRef.current = safeValue;
        }}
        onBlur={handleBlur}
        placeholder="https://..."
        style={{
          ...inputStyle,
          color: safeValue ? '#2563eb' : '#6b7280',
        }}
      />
    );
  }

  // ========================================================================
  // TIPO: dependency (bloqueo / dependencia externa)
  // ========================================================================
  if (field.type === 'dependency') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          type="text"
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { originalValueRef.current = safeValue; }}
          onBlur={handleBlur}
          placeholder="Describir dependencia..."
          style={{ ...inputStyle, flex: 1 }}
        />
        {safeValue && (
          <span style={{
            flexShrink: 0, padding: '2px 6px', borderRadius: '4px',
            fontSize: '10px', fontWeight: 700,
            background: '#fef3c7', color: '#92400e',
            whiteSpace: 'nowrap',
          }}>
            EN PAUSA
          </span>
        )}
      </div>
    );
  }

  // ========================================================================
  // DEFAULT: tipo no soportado
  // ========================================================================
  return (
    <span style={{ color: '#9ca3af', fontSize: '12px' }}>
      Tipo no soportado: {field.type}
    </span>
  );
}

export default CustomFieldCell;