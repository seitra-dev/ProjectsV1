import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Home, Briefcase, Check, Calendar, PieChart, BarChart2, MessageSquare, Users } from 'lucide-react';
import { DESIGN_TOKENS } from '/src/styles/tokens';
import WorkspaceList from './Enviroments/WorkspaceList';
import CreateWorkspaceModal from './Enviroments/CreateWorkspaceModal';
import CreateListModal from './Enviroments/CreateListModal';
import { useApp } from '../context/AppContext';

const sidebarStyle = {
  background: 'var(--bg-sidebar)',
  backdropFilter: 'blur(25px)',
  WebkitBackdropFilter: 'blur(25px)',
  display: 'flex',
  flexDirection: 'column',
  borderRight: '1px solid var(--border)',
  boxShadow: '10px 0 40px rgba(0, 0, 0, 0.03)',
  borderTopRightRadius: '24px',
  borderBottomRightRadius: '24px',
  transition: 'background 0.4s ease, border-color 0.4s ease',
};

const sidebarLogoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
  padding: '40px 24px 32px',
};

// LÍNEAS DIVISORIAS ELEGANTES
const Divider = () => (
  <div style={{
    height: '1px',
    width: '80%',
    margin: '8px auto',
    background: 'var(--divider)'
  }} />
);

const sidebarFooterStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
  padding: '20px 24px',
  borderTop: '1px solid var(--border)',
  background: 'var(--bg-surface)',
  borderBottomRightRadius: '24px',
};

function Sidebar({ isOpen, activeView, onViewChange, projects, onProjectSelect, user, toggleFavorite, isMobile, onClose, onSelectList, onOpenUserSettings }) {
  const { setCurrentWorkspaceState, currentEnvironment, orgRole, pendingRequestsCount, isPlatformOwner } = useApp();
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);
  const [createListWorkspace, setCreateListWorkspace] = useState(null);

  // Resolver rol efectivo:
  // 1. user.role desde BD (platform_owner | user)
  // 2. orgRole del AppContext (org_admin | member)
  // 3. caché localStorage como fallback mientras carga
  const effectiveSystemRole = user?.role
    || (() => { try { return localStorage.getItem('seitra_system_role'); } catch { return null; } })()
    || 'user';

  const isOwner    = effectiveSystemRole === 'platform_owner' || isPlatformOwner?.();
  const isOrgAdmin = isOwner || orgRole === 'org_admin';

  const allMenuItems = [
    { id: 'dashboard',   icon: <Home size={19} />,        label: 'Dashboard' },
    { id: 'projects',    icon: <Briefcase size={19} />,   label: 'Proyectos' },
    { id: 'tasks',       icon: <Check size={19} />,       label: 'Mis Tareas' },
    { id: 'calendar',    icon: <Calendar size={19} />,    label: 'Calendario' },
    { id: 'chat',        icon: <MessageSquare size={19} />, label: 'Chat del Equipo' },
    { id: 'analytics',   icon: <PieChart size={19} />,    label: 'Analítica' },
    {
      id: 'management',
      icon: <BarChart2 size={19} />,
      label: 'Gestión',
    },
    {
      id: 'members',
      icon: <Users size={19} />,
      label: 'Miembros',
      badge: isOrgAdmin && pendingRequestsCount > 0 ? pendingRequestsCount : null,
      visibleWhen: isOrgAdmin,
    },
  ];

  const menuItems = allMenuItems.filter(item =>
    item.visibleWhen === undefined ? true : item.visibleWhen
  );

  const favoriteProjects = projects.filter(p => p.favorite);
  const collapsed = !isOpen && !isMobile;

  const handleSelectWorkspace = (workspace) => {
    setCurrentWorkspaceState(workspace);
    onViewChange('workspace', workspace.name);
    if (isMobile) onClose();
  };

  return (
    <>
      {isMobile && isOpen && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.3)',
            backdropFilter: 'blur(4px)',
            zIndex: 998
          }}
        />
      )}

      <div style={{
        ...sidebarStyle,
        width: isMobile ? (isOpen ? '280px' : '0') : (collapsed ? '72px' : '270px'),
        minWidth: isMobile ? (isOpen ? '280px' : '0') : (collapsed ? '72px' : '270px'),
        position: isMobile ? 'fixed' : 'sticky',
        top: '0',
        zIndex: isMobile ? 999 : 1,
        left: isMobile ? (isOpen ? 0 : '-280px') : 'auto',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        height: '100vh',
      }}>
        
        {/* LOGO SEITRA */}
        <div style={{
          ...sidebarLogoStyle,
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
        }}>
          <div style={{
            background: `linear-gradient(135deg, #15066c 0%, #0455c7 100%)`,
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
          }}>
            <BarChart2 size={20} color="#ffffff" strokeWidth={2.5} />
          </div>
          {(!collapsed || isMobile) && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                SEITRA
              </h3>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Enterprise
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* NAV PRINCIPAL */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 9px' }}>
          <div style={{ marginBottom: '24px', marginTop: '10px' }}>
            {(!collapsed || isMobile) && (
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-subtle)',
                textTransform: 'uppercase',
                marginBottom: '12px',
                paddingLeft: '14px',
                letterSpacing: '1px'
              }}>
                Menú
              </div>
            )}

            {/* INDICADOR DE ENTORNO ACTIVO */}
            {(!collapsed || isMobile) && (() => {
              if (activeView === 'management') {
                return (
                  <div style={{
                    margin: '0 4px 12px',
                    padding: '7px 12px',
                    borderRadius: 8,
                    background: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    display: 'flex', alignItems: 'center', gap: 7,
                    fontSize: 12, fontWeight: 600, color: '#4338ca',
                  }}>
                    <span style={{ fontSize: 14 }}>📊</span>
                    Todos los equipos
                  </div>
                );
              }
              if (currentEnvironment) {
                return (
                  <div style={{
                    margin: '0 4px 12px',
                    padding: '7px 12px',
                    borderRadius: 8,
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    display: 'flex', alignItems: 'center', gap: 7,
                    fontSize: 12, fontWeight: 600, color: '#065f46',
                    overflow: 'hidden',
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {currentEnvironment.name}
                    </span>
                  </div>
                );
              }
              return (
                <div style={{
                  margin: '0 4px 12px',
                  padding: '7px 12px',
                  borderRadius: 8,
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  display: 'flex', alignItems: 'center', gap: 7,
                  fontSize: 12, fontWeight: 600, color: '#92400e',
                }}>
                  <span style={{ fontSize: 14 }}>⚠️</span>
                  Sin equipo
                </div>
              );
            })()}

            {menuItems.map(item => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id, item.label);
                    if (isMobile) onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 14px',
                    marginBottom: '4px',
                    position: 'relative',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.06) 0%, rgba(2, 6, 23, 0.1) 100%)'
                      : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    border: isActive ? '1px solid rgba(15, 23, 42, 0.05)' : '1px solid transparent',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    fontSize: '14px',
                    fontWeight: isActive ? 700 : 500,
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  {isActive && !collapsed && (
                    <div style={{
                      position: 'absolute',
                      left: '0',
                      width: '3px',
                      height: '18px',
                      background: '#0f172a',
                      borderRadius: '0 4px 4px 0',
                    }} />
                  )}
                  <span style={{
                    flexShrink: 0,
                    display: 'flex',
                    color: isActive ? 'var(--text-primary)' : 'inherit',
                  }}>{item.icon}</span>
                  {(!collapsed || isMobile) && (
                    <span style={{ flex: 1 }}>{item.label}</span>
                  )}
                  {item.badge && (!collapsed || isMobile) && (
                    <span style={{
                      background: '#ef4444', color: '#fff', borderRadius: '999px',
                      fontSize: '10px', fontWeight: 700, padding: '1px 6px', lineHeight: '16px',
                      minWidth: 18, textAlign: 'center',
                    }}>
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Divider />

          {(!collapsed || isMobile) && (
            <div style={{ marginBottom: '20px', marginTop: '10px' }}>
              <WorkspaceList
                onCreateWorkspace={() => setShowCreateWorkspace(true)}
                onSelectWorkspace={handleSelectWorkspace}
                onOpenChat={() => onViewChange('chat', 'Chat del Equipo')}
                onOpenBacklog={() => onViewChange('backlog', 'Backlog')}
                onCreateList={(ws) => { setCreateListWorkspace(ws || null); setShowCreateList(true); }}
                onSelectList={(list) => {
                  onSelectList && onSelectList(list);
                  if (isMobile) onClose();
                }}
              />
            </div>
          )}
        </nav>

        {/* PERFIL USUARIO - ENMARCADO BONITO */}
        <div style={{ padding: '12px' }}>
            <button
              type="button"
              onClick={() => onOpenUserSettings?.()}
              title="Ajustes de cuenta"
              style={{
                ...sidebarFooterStyle,
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '12px',
                justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                width: '100%',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
            >
                <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: typeof user?.avatar === 'string' && (user.avatar.startsWith('http') || user.avatar.startsWith('data:'))
                      ? 'transparent'
                      : `linear-gradient(135deg, #0f172a 0%, #334155 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '14px',
                    flexShrink: 0,
                    overflow: 'hidden',
                }}>
                    {typeof user?.avatar === 'string' && (user.avatar.startsWith('http') || user.avatar.startsWith('data:')) ? (
                      <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      user?.avatar && String(user.avatar).length <= 4
                        ? user.avatar
                        : (user?.name || user?.email || 'U').charAt(0).toUpperCase()
                    )}
                </div>
                {(!collapsed || isMobile) && (
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {user?.name || user?.email || 'Usuario'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 500 }}>
                            {isOwner ? 'Platform Owner' : isOrgAdmin ? 'Administrador' : 'Miembro'}
                        </div>
                    </div>
                )}
            </button>
        </div>
      </div>

      {createPortal(
        <CreateWorkspaceModal
          isOpen={showCreateWorkspace}
          onClose={() => setShowCreateWorkspace(false)}
        />,
        document.body
      )}
      {createPortal(
        <CreateListModal
          isOpen={showCreateList}
          onClose={() => { setShowCreateList(false); setCreateListWorkspace(null); }}
          preselectedWorkspaceId={createListWorkspace?.id}
          onSave={(newList) => {
            setShowCreateList(false);
            setCreateListWorkspace(null);
            onSelectList && onSelectList(newList);
            if (isMobile) onClose();
          }}
        />,
        document.body
      )}
    </>
  );
}

export default Sidebar;