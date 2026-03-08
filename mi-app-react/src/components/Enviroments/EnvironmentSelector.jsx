import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Settings, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext-OLD';
import { DESIGN_TOKENS } from '/src/styles/tokens';


// ============================================================================
// ENVIRONMENT SELECTOR - Dropdown en TopBar
// ============================================================================

const EnvironmentSelector = ({ onCreateEnvironment, onOpenSettings }) => {
  const { 
    currentEnvironment, 
    environments, 
    setCurrentEnvironment 
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectEnvironment = (envId) => {
    setCurrentEnvironment(envId);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    onCreateEnvironment();
  };

  const handleOpenSettings = () => {
    setIsOpen(false);
    onOpenSettings();
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: isOpen ? 'rgba(0, 102, 255, 0.03)' : 'rgba(255, 255, 255, 0.74)',
          border: `1px solid ${isOpen ? 'rgba(0, 102, 255, 0.77)' : 'rgba(31, 41, 51, 0.06)'}`,
          borderRadius: DESIGN_TOKENS.border.radius.md,
          cursor: 'pointer',
          transition: `all ${DESIGN_TOKENS.transition.normal}`,
          fontSize: DESIGN_TOKENS.typography.size.base,
          fontWeight: DESIGN_TOKENS.typography.weight.semibold,
          color: DESIGN_TOKENS.neutral[800],
          letterSpacing: DESIGN_TOKENS.typography.letterSpacing.normal,
          minWidth: '200px',
          justifyContent: 'space-between'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
            e.currentTarget.style.borderColor = 'rgba(31, 41, 51, 0.12)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(31, 41, 51, 0.06)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          {currentEnvironment ? (
            <>
              <span style={{ fontSize: '16px' }}>{currentEnvironment.icon || '📁'}</span>
              <span style={{ 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
              }}>
                {currentEnvironment.name}
              </span>
            </>
          ) : (
            <span style={{ color: DESIGN_TOKENS.neutral[400] }}>
              Seleccionar entorno
            </span>
          )}
        </div>
        <ChevronDown 
          size={16} 
          style={{
            transition: `transform ${DESIGN_TOKENS.transition.normal}`,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: DESIGN_TOKENS.neutral[500]
          }}
        />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          background: 'white',
          border: `0.5px solid ${DESIGN_TOKENS.border.color.subtle}`,
          borderRadius: DESIGN_TOKENS.border.radius.md,
          boxShadow: `0 12px 40px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)`,
          minWidth: '280px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000,
          animation: 'dropdownFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          padding: '8px'
        }}>
          {/* HEADER */}
          <div style={{
            padding: '12px 12px 8px',
            fontSize: DESIGN_TOKENS.typography.size.xs,
            fontWeight: DESIGN_TOKENS.typography.weight.semibold,
            color: DESIGN_TOKENS.neutral[400],
            textTransform: 'uppercase',
            letterSpacing: '0.6px'
          }}>
            Entornos disponibles
          </div>

          {/* ENVIRONMENT LIST */}
          {environments.length > 0 ? (
            <div style={{ marginBottom: '8px' }}>
              {environments.map((env) => (
                <button
                  key={env.id}
                  onClick={() => handleSelectEnvironment(env.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    background: currentEnvironment?.id === env.id 
                      ? 'rgba(0, 102, 255, 0.06)' 
                      : 'transparent',
                    border: 'none',
                    borderRadius: DESIGN_TOKENS.border.radius.sm,
                    cursor: 'pointer',
                    transition: `all ${DESIGN_TOKENS.transition.fast}`,
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (currentEnvironment?.id !== env.id) {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentEnvironment?.id !== env.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{env.icon || '📁'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: DESIGN_TOKENS.typography.size.base,
                      fontWeight: DESIGN_TOKENS.typography.weight.medium,
                      color: DESIGN_TOKENS.neutral[800],
                      marginBottom: '2px'
                    }}>
                      {env.name}
                    </div>
                    <div style={{
                      fontSize: DESIGN_TOKENS.typography.size.xs,
                      color: DESIGN_TOKENS.neutral[400]
                    }}>
                      {env.workspaces?.length || 0} espacios
                    </div>
                  </div>
                  {currentEnvironment?.id === env.id && (
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: DESIGN_TOKENS.primary.base
                    }} />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '24px 12px',
              textAlign: 'center',
              color: DESIGN_TOKENS.neutral[400],
              fontSize: DESIGN_TOKENS.typography.size.sm
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.3 }}>📁</div>
              <div style={{ fontWeight: DESIGN_TOKENS.typography.weight.medium }}>
                No hay entornos
              </div>
              <div style={{ fontSize: DESIGN_TOKENS.typography.size.xs, marginTop: '4px' }}>
                Crea tu primer entorno
              </div>
            </div>
          )}

          {/* DIVIDER */}
          <div style={{
            height: '0.5px',
            background: DESIGN_TOKENS.border.color.subtle,
            margin: '8px 0'
          }} />

          {/* ACTIONS */}
          <button
            onClick={handleCreateNew}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: DESIGN_TOKENS.border.radius.sm,
              cursor: 'pointer',
              transition: `all ${DESIGN_TOKENS.transition.fast}`,
              fontSize: DESIGN_TOKENS.typography.size.base,
              fontWeight: DESIGN_TOKENS.typography.weight.medium,
              color: DESIGN_TOKENS.primary.base
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 102, 255, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Plus size={18} />
            Crear entorno de trabajo
          </button>

          {currentEnvironment && (
            <>
              <div style={{
                height: '0.5px',
                background: DESIGN_TOKENS.border.color.subtle,
                margin: '8px 0'
              }} />

              <button
                onClick={handleOpenSettings}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: DESIGN_TOKENS.border.radius.sm,
                  cursor: 'pointer',
                  transition: `all ${DESIGN_TOKENS.transition.fast}`,
                  fontSize: DESIGN_TOKENS.typography.size.base,
                  fontWeight: DESIGN_TOKENS.typography.weight.medium,
                  color: DESIGN_TOKENS.neutral[700]
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Settings size={18} />
                Administrar entorno
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  // Aquí iría la lógica para abrir gestión de personas
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: DESIGN_TOKENS.border.radius.sm,
                  cursor: 'pointer',
                  transition: `all ${DESIGN_TOKENS.transition.fast}`,
                  fontSize: DESIGN_TOKENS.typography.size.base,
                  fontWeight: DESIGN_TOKENS.typography.weight.medium,
                  color: DESIGN_TOKENS.neutral[700]
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Users size={18} />
                Personas
              </button>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default EnvironmentSelector;