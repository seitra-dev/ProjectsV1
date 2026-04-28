import { useState, useEffect, useRef } from 'react';
import { X, Users, UserPlus, Trash2, Crown, ShieldCheck, User, Eye, Search, ChevronDown, Loader, ArrowRightLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { dbEnvironmentMembers, dbUsers } from '../../lib/database';

// ============================================================================
// CONSTANTS
// ============================================================================

const ROLE_CONFIG = {
  owner:  { label: 'Propietario', icon: <Crown size={13} />,      color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  admin:  { label: 'Administrador', icon: <ShieldCheck size={13} />, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  member: { label: 'Miembro',     icon: <User size={13} />,       color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  viewer: { label: 'Observador',  icon: <Eye size={13} />,        color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

const ASSIGNABLE_ROLES = ['admin', 'member', 'viewer'];

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.member;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function Avatar({ user, size = 36 }) {
  const initials = (user?.name || user?.email || '?')[0].toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: 'white', flexShrink: 0,
    }}>
      {user?.avatar && user.avatar !== '👤' ? user.avatar : initials}
    </div>
  );
}

// ============================================================================
// ENVIRONMENT MEMBERS MODAL
// ============================================================================

const EnvironmentMembersModal = ({ isOpen, onClose }) => {
  const { currentEnvironment, currentUser, getUserRoleInEnv, canManageMembers, environments } = useApp();
  const [activeTab, setActiveTab] = useState('members');
  const [movingMemberId, setMovingMemberId] = useState(null);
  const moveRef = useRef(null);

  // — Tab Miembros —
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState('');

  // — Tab Invitar —
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  const envId = currentEnvironment?.id;
  const myRole = getUserRoleInEnv(envId);
  const isOwner = myRole === 'owner';
  const canManage = canManageMembers(envId);
  const otherEnvironments = (environments || []).filter(e => e.id !== envId);

  // Cargar miembros al abrir
  useEffect(() => {
    if (!isOpen || !envId) return;
    setActiveTab('members');
    setInviteSuccess('');
    setInviteError('');
    setMembersError('');
    setMovingMemberId(null);
    loadMembers();
    loadAllUsers();
  }, [isOpen, envId]);

  // Cerrar dropdown de mover al hacer clic fuera
  useEffect(() => {
    if (!movingMemberId) return;
    const handler = (e) => {
      if (moveRef.current && !moveRef.current.contains(e.target)) {
        setMovingMemberId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [movingMemberId]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    setMembersError('');
    try {
      const data = await dbEnvironmentMembers.getByEnvironment(envId);
      setMembers(data);
    } catch (e) {
      console.error('[MembersModal] Error cargando miembros:', e);
      setMembersError('No se pudieron cargar los miembros. Verifica los permisos de la tabla.');
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const data = await dbUsers.getAll();
      setAllUsers(data);
    } catch (e) {
      console.error('[MembersModal] Error cargando usuarios:', e);
    }
  };

  const handleRemoveMember = async (userId, userName) => {
    if (!canManage) { alert('No tienes permisos para eliminar miembros de este entorno.'); return; }
    if (!window.confirm(`¿Eliminar a "${userName}" del entorno?`)) return;
    try {
      await dbEnvironmentMembers.remove(envId, userId);
      setMembers(prev => prev.filter(m => m.user_id !== userId));
    } catch (e) {
      alert('Error al eliminar miembro: ' + e.message);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!canManage) { alert('No tienes permisos para cambiar roles en este entorno.'); return; }
    try {
      await dbEnvironmentMembers.updateRole(envId, userId, newRole);
      setMembers(prev => prev.map(m =>
        m.user_id === userId ? { ...m, role: newRole } : m
      ));
    } catch (e) {
      alert('Error al cambiar rol: ' + e.message);
    }
  };

  const handleMoveMember = async (userId, userName, targetEnvId) => {
    if (!canManage) { alert('No tienes permisos para mover miembros.'); return; }
    const targetEnv = (environments || []).find(e => e.id === targetEnvId);
    if (!window.confirm(`¿Mover a "${userName}" al entorno "${targetEnv?.name || targetEnvId}"?`)) return;
    try {
      const member = members.find(m => m.user_id === userId);
      const role = member?.role || 'member';
      await dbEnvironmentMembers.add(targetEnvId, userId, role === 'owner' ? 'member' : role, currentUser?.id);
      await dbEnvironmentMembers.remove(envId, userId);
      setMembers(prev => prev.filter(m => m.user_id !== userId));
    } catch (e) {
      alert('Error al mover miembro: ' + e.message);
    } finally {
      setMovingMemberId(null);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    if (!canManage) {
      setInviteError('No tienes permisos para invitar miembros a este equipo. Solo el propietario o administrador del equipo pueden hacerlo.');
      return;
    }
    if (!selectedUserId) { setInviteError('Selecciona un usuario.'); return; }
    setInviting(true);
    try {
      await dbEnvironmentMembers.add(envId, selectedUserId, inviteRole, currentUser?.id);
      setInviteSuccess('Usuario invitado correctamente.');
      setSelectedUserId('');
      loadMembers();
    } catch (e) {
      setInviteError(
        e.message.includes('duplicate') || e.message.includes('unique')
          ? 'Este usuario ya es miembro del entorno.'
          : e.message.includes('row-level security') || e.message.includes('policy')
          ? 'No tienes permiso para invitar miembros. Solo el propietario o administrador del equipo pueden hacerlo.'
          : 'Ocurrió un error al invitar al usuario. Intenta de nuevo.'
      );
    } finally {
      setInviting(false);
    }
  };

  // Usuarios que ya son miembros (para excluirlos de la lista de invitados)
  const memberUserIds = new Set(members.map(m => m.user_id));
  const availableUsers = allUsers.filter(u =>
    !memberUserIds.has(u.id) &&
    (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen || !currentEnvironment) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '1rem',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '16px',
          width: '100%', maxWidth: '560px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
          maxHeight: '85vh',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e8ecf0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
              background: currentEnvironment.color ? `${currentEnvironment.color}20` : '#eef2ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
            }}>
              {currentEnvironment.icon || '📁'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                Gestión de miembros
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                {currentEnvironment.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e8ecf0', padding: '0 1.5rem' }}>
          {[
            { id: 'members', icon: <Users size={15} />, label: `Miembros (${members.length})` },
            ...(canManage ? [{ id: 'invite', icon: <UserPlus size={15} />, label: 'Invitar' }] : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '0.75rem 1rem', background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? '#667eea' : 'transparent'}`,
                color: activeTab === tab.id ? '#667eea' : '#64748b',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
                marginBottom: '-1px',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>

          {/* ── TAB: MIEMBROS ── */}
          {activeTab === 'members' && (
            <div>
              {loadingMembers ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : membersError ? (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '0.85rem' }}>
                  {membersError}
                </div>
              ) : members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                  No hay miembros en este equipo.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {members.map(member => {
                    const user = allUsers.find(u => String(u.id) === String(member.user_id)) || {};
                    const isMe = member.user_id === currentUser?.id;
                    const isThisOwner = member.role === 'owner';
                    return (
                      <div
                        key={member.user_id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '10px 12px', borderRadius: '10px',
                          background: isMe ? '#fafafe' : 'transparent',
                          border: isMe ? '1px solid #e8ecf0' : '1px solid transparent',
                        }}
                      >
                        <Avatar user={user} size={36} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {user.name || user.email || 'Usuario'}
                            {isMe && <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 400 }}>(tú)</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.email}
                          </div>
                        </div>

                        {/* Role selector / badge */}
                        {canManage && !isThisOwner && !isMe ? (
                          <select
                            value={member.role}
                            onChange={e => handleChangeRole(member.user_id, e.target.value)}
                            style={{
                              border: '1.5px solid #e2e8f0', borderRadius: '7px',
                              padding: '4px 8px', fontSize: '0.78rem', fontWeight: 600,
                              color: '#374151', background: 'white', cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            {ASSIGNABLE_ROLES.map(r => (
                              <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>
                            ))}
                          </select>
                        ) : (
                          <RoleBadge role={member.role} />
                        )}

                        {/* Botón mover a otro entorno */}
                        {canManage && !isThisOwner && !isMe && otherEnvironments.length > 0 && (
                          <div style={{ position: 'relative' }} ref={movingMemberId === member.user_id ? moveRef : null}>
                            <button
                              onClick={() => setMovingMemberId(movingMemberId === member.user_id ? null : member.user_id)}
                              style={{
                                background: 'none', border: 'none', color: '#cbd5e1',
                                cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '6px',
                                transition: 'color 0.15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = '#6366f1'}
                              onMouseLeave={e => e.currentTarget.style.color = movingMemberId === member.user_id ? '#6366f1' : '#cbd5e1'}
                              title="Mover a otro entorno"
                            >
                              <ArrowRightLeft size={16} />
                            </button>
                            {movingMemberId === member.user_id && (
                              <div style={{
                                position: 'absolute', right: 0, top: '110%', zIndex: 100,
                                background: 'white', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                border: '1px solid #e2e8f0', minWidth: '180px', overflow: 'hidden',
                              }}>
                                <div style={{ padding: '8px 12px', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Mover a entorno
                                </div>
                                {otherEnvironments.map(env => (
                                  <button
                                    key={env.id}
                                    onClick={() => handleMoveMember(member.user_id, user.name || user.email, env.id)}
                                    style={{
                                      width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                                      padding: '8px 12px', background: 'transparent', border: 'none',
                                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: '0.85rem', color: '#1e293b',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  >
                                    <span style={{ fontSize: '16px' }}>{env.icon || '📁'}</span>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{env.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Botón eliminar */}
                        {canManage && !isThisOwner && !isMe && (
                          <button
                            onClick={() => handleRemoveMember(member.user_id, user.name || user.email)}
                            style={{
                              background: 'none', border: 'none', color: '#cbd5e1',
                              cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '6px',
                              transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                            title="Eliminar miembro"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: INVITAR ── */}
          {activeTab === 'invite' && (
            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Buscador */}
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSelectedUserId(''); }}
                  placeholder="Buscar usuario por nombre o email..."
                  style={{
                    width: '100%', padding: '0.7rem 1rem 0.7rem 2.25rem',
                    border: '1.5px solid #e2e8f0', borderRadius: '10px',
                    fontSize: '0.875rem', boxSizing: 'border-box',
                    outline: 'none', fontFamily: 'inherit', color: '#1e293b',
                  }}
                  onFocus={e => e.target.style.borderColor = '#667eea'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Lista de usuarios disponibles */}
              {searchQuery.length > 0 && (
                <div style={{
                  border: '1.5px solid #e2e8f0', borderRadius: '10px',
                  maxHeight: '200px', overflowY: 'auto',
                }}>
                  {availableUsers.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                      No se encontraron usuarios disponibles
                    </div>
                  ) : (
                    availableUsers.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { setSelectedUserId(u.id); setSearchQuery(`${u.name} (${u.email})`); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 12px', background: selectedUserId === u.id ? '#f0f4ff' : 'transparent',
                          border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => { if (selectedUserId !== u.id) e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={e => { if (selectedUserId !== u.id) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <Avatar user={u} size={30} />
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.email}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Selector de rol */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>Rol a asignar</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    style={{
                      width: '100%', padding: '0.7rem 2rem 0.7rem 0.9rem',
                      border: '1.5px solid #e2e8f0', borderRadius: '10px',
                      fontSize: '0.875rem', fontFamily: 'inherit', color: '#1e293b',
                      background: 'white', cursor: 'pointer', appearance: 'none',
                      outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = '#667eea'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  >
                    {ASSIGNABLE_ROLES.map(r => (
                      <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                  {inviteRole === 'admin' && 'Puede gestionar miembros y configurar el entorno.'}
                  {inviteRole === 'member' && 'Puede ver y trabajar en todos los proyectos del entorno.'}
                  {inviteRole === 'viewer' && 'Solo puede ver el contenido del entorno, sin editar.'}
                </p>
              </div>

              {/* Mensajes */}
              {inviteError && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem' }}>
                  {inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', color: '#16a34a', fontSize: '0.85rem' }}>
                  ✓ {inviteSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={inviting || !selectedUserId}
                style={{
                  width: '100%', padding: '0.8rem', border: 'none', borderRadius: '10px',
                  background: inviting || !selectedUserId ? '#94a3b8' : '#1e293b',
                  color: 'white', fontSize: '0.9rem', fontWeight: 600,
                  cursor: inviting || !selectedUserId ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'background 0.2s',
                }}
                onMouseEnter={e => { if (!inviting && selectedUserId) e.currentTarget.style.background = '#334155'; }}
                onMouseLeave={e => { if (!inviting && selectedUserId) e.currentTarget.style.background = '#1e293b'; }}
              >
                {inviting ? 'Invitando...' : 'Invitar al entorno'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnvironmentMembersModal;
