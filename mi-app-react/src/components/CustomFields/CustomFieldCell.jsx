import React, { useRef, useState } from 'react';
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
    const selectedOption = field.options.find(
      (opt) => opt.id === safeValue || opt.label === safeValue
    );

    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            ...inputStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            background: selectedOption
              ? selectedOption.color + '15'
              : '#fff',
            border: `1px solid ${selectedOption ? selectedOption.color : '#e5e7eb'}`,
            color: selectedOption ? selectedOption.color : '#6b7280',
            fontWeight: selectedOption ? 500 : 400,
          }}
        >
          {selectedOption && (
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: selectedOption.color,
                flexShrink: 0,
              }}
            />
          )}
          <span style={{ flex: 1, textAlign: 'left' }}>
            {selectedOption?.label || 'Seleccionar...'}
          </span>
          <ChevronDown size={14} />
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000,
              minWidth: '160px',
            }}
          >
            {field.options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onChange(option.id || option.label);
                  onSave?.(option.id || option.label);
                  setDropdownOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: 'none',
                  background:
                    option.id === safeValue || option.label === safeValue
                      ? option.color + '20'
                      : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: option.color,
                  fontWeight:
                    option.id === safeValue || option.label === safeValue
                      ? 600
                      : 400,
                }}
                onMouseEnter={(e) => {
                  if (option.id !== safeValue && option.label !== safeValue) {
                    e.currentTarget.style.background = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    option.id === safeValue || option.label === safeValue
                      ? option.color + '20'
                      : 'transparent';
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: option.color,
                  }}
                />
                {option.label}
              </button>
            ))}
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
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
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
              <span style={{ flex: 1, textAlign: 'left', fontSize: '12px' }}>
                {selectedMember.name || selectedMember.email}
              </span>
            </>
          )}
          {!selectedMember && (
            <span style={{ color: '#9ca3af' }}>Asignar...</span>
          )}
          <ChevronDown size={14} />
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000,
              maxHeight: '200px',
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
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
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
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000,
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
  // DEFAULT: tipo no soportado
  // ========================================================================
  return (
    <span style={{ color: '#9ca3af', fontSize: '12px' }}>
      Tipo no soportado: {field.type}
    </span>
  );
}

export default CustomFieldCell;