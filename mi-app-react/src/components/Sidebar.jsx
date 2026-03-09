import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Home, Briefcase, Check, Calendar, PieChart, BarChart2, Star, MessageSquare } from 'lucide-react';
import { DESIGN_TOKENS } from '/src/styles/tokens';
import WorkspaceList from './Enviroments/WorkspaceList';
import CreateWorkspaceModal from './Enviroments/CreateWorkspaceModal';
import CreateListModal from './Enviroments/CreateListModal';

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

function Sidebar({ isOpen, activeView, onViewChange, projects, onProjectSelect, user, toggleFavorite, isMobile, onClose }) {
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateList, setShowCreateList] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: <Home size={19} />, label: 'Dashboard' },
    { id: 'projects', icon: <Briefcase size={19} />, label: 'Proyectos' },
    { id: 'tasks', icon: <Check size={19} />, label: 'Mis Tareas' },
    { id: 'calendar', icon: <Calendar size={19} />, label: 'Calendario' },
    { id: 'chat', icon: <MessageSquare size={19} />, label: 'Chat del Equipo' },
    { id: 'analytics', icon: <PieChart size={19} />, label: 'Analítica' },
  ];

  const favoriteProjects = projects.filter(p => p.favorite);
  const collapsed = !isOpen && !isMobile;

  const handleSelectWorkspace = (workspace) => {
    onViewChange('backlog', 'Backlog');
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
                      width: '4px',
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
                  {(!collapsed || isMobile) && <span>{item.label}</span>}
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
                onCreateList={() => setShowCreateList(true)}  // ← NUEVO
              />
            </div>
          )}
        </nav>

        {/* PERFIL USUARIO - ENMARCADO BONITO */}
        <div style={{ padding: '12px' }}>
            <div style={{
                ...sidebarFooterStyle,
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '12px',
                justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
            }}>
                <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, #0f172a 0%, #334155 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '14px',
                    flexShrink: 0,
                }}>
                    {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                {(!collapsed || isMobile) && (
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {user?.name || user?.email || 'Usuario'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 500 }}>
                            {user?.role === 'admin' ? 'Project Manager' : 'Analista'}
                        </div>
                    </div>
                )}
            </div>
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
          onClose={() => setShowCreateList(false)}
          onSave={(listData) => {
            setShowCreateList(false);
            onViewChange('list', listData.name);
          }}
        />,
        document.body
      )}
    </>
  );
}

export default Sidebar;