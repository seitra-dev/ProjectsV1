import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Settings, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DESIGN_TOKENS } from '/src/styles/tokens';
import AccessDeniedModal from './AccessDeniedModal';

const ROLE_BADGE = {
  owner:  { label: '👑 Propietario',   color: '#f59e0b', bg: '#fffbeb' },
  admin:  { label: '⚙️ Admin',         color: '#6366f1', bg: '#eef2ff' },
  member: { label: '👤 Miembro',       color: '#0ea5e9', bg: '#f0f9ff' },
  viewer: { label: '👁️ Observador',   color: '#64748b', bg: '#f8fafc' },
};


// ============================================================================
// ENVIRONMENT SELECTOR - Dropdown en TopBar
// ============================================================================

const EnvironmentSelector = ({ onCreateEnvironment, onOpenSettings, onManageMembers }) => {
  const {
    currentEnvironment,
    environments,
    setCurrentEnvironment,
    getUserRoleInEnv,
    isSuperAdmin,
    canManageMembers,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [accessDenied, setAccessDenied] = useState(null); // env que no puede ver
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

  const superAdmin = isSuperAdmin();

  const handleSelectEnvironment = (env) => {
    // Super admin siempre puede entrar; otros necesitan membresía
    if (!superAdmin && !getUserRoleInEnv(env.id)) {
      setAccessDenied(env);
      setIsOpen(false);
      return;
    }
    setCurrentEnvironment(env.id);
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

  const handleManageMembers = () => {
    setIsOpen(false);
    onManageMembers?.();
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
              Seleccionar equipo
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
          zIndex: 9999,
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
            Equipos disponibles
          </div>

          {/* ENVIRONMENT LIST */}
          {environments.length > 0 ? (
            <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {environments.map((env) => {
                const isSelected = currentEnvironment?.id === env.id;
                const accentColor = env.color || DESIGN_TOKENS.primary.base;
                const role = getUserRoleInEnv(env.id);
                const badge = role ? ROLE_BADGE[role] : null;
                return (
                <button
                  key={env.id}
                  onClick={() => handleSelectEnvironment(env)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    background: isSelected ? `${accentColor}12` : 'transparent',
                    border: 'none',
                    borderLeft: `3px solid ${isSelected ? accentColor : 'transparent'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: `all ${DESIGN_TOKENS.transition.fast}`,
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = `${accentColor}08`;
                      e.currentTarget.style.borderLeftColor = `${accentColor}50`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderLeftColor = 'transparent';
                    }
                  }}
                >
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: isSelected ? accentColor : `${accentColor}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '15px', flexShrink: 0,
                    transition: `all ${DESIGN_TOKENS.transition.fast}`,
                  }}>
                    {env.icon || '📁'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: DESIGN_TOKENS.typography.size.sm,
                      fontWeight: isSelected ? DESIGN_TOKENS.typography.weight.semibold : DESIGN_TOKENS.typography.weight.medium,
                      color: isSelected ? accentColor : 'var(--text-primary, #0f172a)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {env.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ fontSize: DESIGN_TOKENS.typography.size.xs, color: 'var(--text-subtle, #94a3b8)' }}>
                        {env.workspaces?.length || 0} espacios
                      </span>
                      {badge && (
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 600, padding: '1px 5px',
                          borderRadius: '4px', color: badge.color, background: badge.bg,
                        }}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: accentColor, flexShrink: 0,
                      boxShadow: `0 0 0 2px ${accentColor}30`,
                    }} />
                  )}
                </button>
                );
              })}
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
                No hay equipos
              </div>
              <div style={{ fontSize: DESIGN_TOKENS.typography.size.xs, marginTop: '4px' }}>
                Crea tu primer equipo
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
            Crear equipo de trabajo
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
                Administrar equipo
              </button>

              {canManageMembers(currentEnvironment?.id) && (
                <button
                  onClick={handleManageMembers}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', background: 'transparent', border: 'none',
                    borderRadius: DESIGN_TOKENS.border.radius.sm, cursor: 'pointer',
                    transition: `all ${DESIGN_TOKENS.transition.fast}`,
                    fontSize: DESIGN_TOKENS.typography.size.base,
                    fontWeight: DESIGN_TOKENS.typography.weight.medium,
                    color: DESIGN_TOKENS.neutral[700],
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Users size={18} />
                  Gestionar acceso
                </button>
              )}
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <AccessDeniedModal
        isOpen={accessDenied !== null}
        onClose={() => setAccessDenied(null)}
        environmentName={accessDenied?.name}
      />
    </div>
  );
};

export default EnvironmentSelector;