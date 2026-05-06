import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Bell, UserPlus, Calendar, Trash2, Clock, AlertTriangle,
  CheckCheck, X, RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dbNotifications } from '../lib/database';
import { supabase } from '../lib/supabase';

// ── helpers ──────────────────────────────────────────────────────────────────
const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'ahora mismo';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ayer';
  if (d < 7)  return `hace ${d} días`;
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
};

const TYPE_META = {
  task_assigned:       { icon: <UserPlus  size={14} />, color: '#0066FF', bg: 'rgba(0,102,255,0.08)'   },
  task_date_changed:   { icon: <Calendar  size={14} />, color: '#FFAB00', bg: 'rgba(255,171,0,0.10)'   },
  task_deleted:        { icon: <Trash2    size={14} />, color: '#FF3D71', bg: 'rgba(255,61,113,0.08)'  },
  task_due_soon:       { icon: <Clock     size={14} />, color: '#FFAB00', bg: 'rgba(255,171,0,0.10)'   },
  task_overdue:        { icon: <AlertTriangle size={14} />, color: '#FF3D71', bg: 'rgba(255,61,113,0.08)' },
  project_date_changed:{ icon: <Calendar  size={14} />, color: '#0066FF', bg: 'rgba(0,102,255,0.08)'   },
};
const defaultMeta = { icon: <Bell size={14} />, color: '#64748b', bg: 'rgba(100,116,139,0.08)' };

// ── NotificationCenter ────────────────────────────────────────────────────────
function NotificationCenter({ tasks = [], projects = [], users = [] }) {
  const {
    currentUser, organizationId,
    orgRole, isPlatformOwner,
    pendingRequestsCount, setPendingRequestsCount,
  } = useApp();

  const isAdmin = isPlatformOwner?.() || orgRole === 'org_admin';

  const [open,        setOpen]        = useState(false);
  const [tab,         setTab]         = useState('notifs'); // 'notifs' | 'requests'
  const [storedNotifs, setStoredNotifs] = useState([]);
  const [loadingN,    setLoadingN]    = useState(false);
  const [requests,    setRequests]    = useState([]);
  const [loadingR,    setLoadingR]    = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const wrapRef = useRef(null);

  // ── computed: overdue + due-soon tasks for current user ────────────────────
  const computedNotifs = useMemo(() => {
    if (!currentUser?.id) return [];
    const myTasks = tasks.filter(
      t => t.assigneeId === currentUser.id && t.status !== 'completed' && t.status !== 'cancelled'
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const notifs = [];

    myTasks.forEach(task => {
      const dueDateStr = task.dueDate || task.endDate;
      if (!dueDateStr) return;
      const due = new Date(dueDateStr + 'T00:00');
      const diffDays = Math.ceil((due - today) / 86400000);

      if (diffDays < 0) {
        const abs = Math.abs(diffDays);
        notifs.push({
          id: `c-ov-${task.id}`, type: 'task_overdue',
          title: 'Tarea vencida',
          body: `"${task.title}" venció hace ${abs} día${abs !== 1 ? 's' : ''}`,
          entityType: 'task', entityId: task.id,
          read: false, computed: true, created_at: null,
        });
      } else if (diffDays <= 3) {
        const label = diffDays === 0 ? 'hoy' : diffDays === 1 ? 'mañana' : `en ${diffDays} días`;
        notifs.push({
          id: `c-ds-${task.id}`, type: 'task_due_soon',
          title: 'Por vencer',
          body: `"${task.title}" vence ${label}`,
          entityType: 'task', entityId: task.id,
          read: false, computed: true, created_at: null,
        });
      }
    });
    return notifs;
  }, [tasks, currentUser?.id]);

  // all notifs = computed first, then stored (sorted by date)
  const allNotifs = useMemo(() => {
    const stored = storedNotifs.map(n => ({ ...n, computed: false }));
    return [...computedNotifs, ...stored];
  }, [computedNotifs, storedNotifs]);

  const unreadNotifs   = allNotifs.filter(n => !n.read).length;
  const totalBadge     = unreadNotifs + (isAdmin ? pendingRequestsCount : 0);

  // ── fetch stored notifications ─────────────────────────────────────────────
  const fetchNotifs = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoadingN(true);
    try {
      const data = await dbNotifications.getForUser(currentUser.id);
      setStoredNotifs(data);
    } catch (e) {
      console.error('[NotifCenter] fetch notifs:', e);
    } finally {
      setLoadingN(false);
    }
  }, [currentUser?.id]);

  // ── fetch join requests ────────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    if (!organizationId || !isAdmin) return;
    setLoadingR(true);
    try {
      const { data } = await supabase
        .from('organization_join_requests')
        .select('*, user:users(id, name, email, avatar)')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      setRequests(data || []);
    } finally {
      setLoadingR(false);
    }
  }, [organizationId, isAdmin]);

  useEffect(() => {
    if (!open) return;
    fetchNotifs();
    if (isAdmin) fetchRequests();
  }, [open, fetchNotifs, fetchRequests, isAdmin]);

  // ── click outside ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  // ── realtime: new notifications ────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return;
    const ch = supabase
      .channel(`notifs:${currentUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${currentUser.id}`,
      }, payload => {
        setStoredNotifs(prev => [payload.new, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [currentUser?.id]);

  // ── mark all read ──────────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    if (!currentUser?.id) return;
    await dbNotifications.markAllRead(currentUser.id).catch(() => {});
    setStoredNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  // ── join request actions ───────────────────────────────────────────────────
  const handleApprove = async (req) => {
    setProcessingId(req.id);
    try {
      const { error } = await supabase.rpc('approve_join_request', {
        p_request_id: req.id, p_organization_id: req.organization_id,
        p_user_id: req.user_id, p_reviewed_by: currentUser?.id,
      });
      if (error) throw error;
      setPendingRequestsCount(prev => Math.max(0, prev - 1));
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (e) { console.error(e); } finally { setProcessingId(null); }
  };

  const handleReject = async (req) => {
    setProcessingId(req.id);
    try {
      await supabase.from('organization_join_requests')
        .update({ status: 'rejected', reviewed_by: currentUser?.id, reviewed_at: new Date().toISOString() })
        .eq('id', req.id);
      setPendingRequestsCount(prev => Math.max(0, prev - 1));
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (e) { console.error(e); } finally { setProcessingId(null); }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  const btnBase = {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, transition: 'background 0.15s, color 0.15s',
    padding: '7px', color: '#64748b', fontFamily: 'inherit',
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* ── Bell button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Notificaciones"
        style={{ ...btnBase, position: 'relative' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.05)'; e.currentTarget.style.color = '#0f172a'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b'; }}
      >
        <Bell size={17} />
        {totalBadge > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            minWidth: 16, height: 16, borderRadius: 8,
            background: '#ef4444', color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1, pointerEvents: 'none',
          }}>
            {totalBadge > 9 ? '9+' : totalBadge}
          </span>
        )}
      </button>

      {/* ── Panel ── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 360, maxHeight: 480,
          background: '#fff', borderRadius: 14,
          border: '1px solid #e2e8f0',
          boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
          zIndex: 2000, display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '12px 14px 0', borderBottom: '1px solid #f1f5f9',
            position: 'sticky', top: 0, background: '#fff', zIndex: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Notificaciones</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {unreadNotifs > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    title="Marcar todo como leído"
                    style={{ ...btnBase, padding: '5px 8px', fontSize: 11, color: '#0066FF', gap: 4 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,102,255,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <CheckCheck size={13} /> Leído
                  </button>
                )}
                <button
                  onClick={() => { fetchNotifs(); if (isAdmin) fetchRequests(); }}
                  title="Actualizar"
                  style={{ ...btnBase, padding: 5 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  style={{ ...btnBase, padding: 5 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Tabs (only if admin) */}
            {isAdmin && (
              <div style={{ display: 'flex', gap: 0 }}>
                {[
                  { key: 'notifs',   label: 'Para ti',     count: unreadNotifs },
                  { key: 'requests', label: 'Solicitudes', count: pendingRequestsCount },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    style={{
                      flex: 1, padding: '7px 0', background: 'none', border: 'none',
                      borderBottom: tab === t.key ? '2px solid #0066FF' : '2px solid transparent',
                      color: tab === t.key ? '#0066FF' : '#64748b',
                      fontWeight: tab === t.key ? 700 : 500,
                      fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      transition: 'all 0.15s',
                    }}
                  >
                    {t.label}
                    {t.count > 0 && (
                      <span style={{
                        background: tab === t.key ? '#0066FF' : '#e2e8f0',
                        color: tab === t.key ? '#fff' : '#64748b',
                        borderRadius: 999, fontSize: 10, fontWeight: 700,
                        padding: '1px 6px', lineHeight: '16px',
                      }}>
                        {t.count > 9 ? '9+' : t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {/* ── Notificaciones tab ── */}
            {tab === 'notifs' && (
              loadingN
                ? <EmptyState icon={<RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />} text="Cargando…" />
                : allNotifs.length === 0
                  ? <EmptyState icon={<Bell size={22} />} text="Todo al día, sin notificaciones" />
                  : allNotifs.map(n => <NotifRow key={n.id} n={n} onRead={async () => {
                      if (n.computed || n.read) return;
                      await dbNotifications.markRead(n.id).catch(() => {});
                      setStoredNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                    }} />)
            )}

            {/* ── Solicitudes tab ── */}
            {tab === 'requests' && (
              loadingR
                ? <EmptyState icon={<RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />} text="Cargando…" />
                : requests.length === 0
                  ? <EmptyState icon={<Bell size={22} />} text="No hay solicitudes pendientes" />
                  : requests.map(req => {
                      const u = req.user || {};
                      const busy = processingId === req.id;
                      const avatarIsUrl = typeof u.avatar === 'string' && (u.avatar.startsWith('http') || u.avatar.startsWith('data:'));
                      return (
                        <div key={req.id} style={{ padding: '11px 14px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                            background: '#e2e8f0', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#475569', overflow: 'hidden',
                          }}>
                            {avatarIsUrl
                              ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : (u.name || u.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.name || u.email}
                            </div>
                            <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                            <button disabled={busy} onClick={() => handleReject(req)} style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 11, fontWeight: 600, color: '#64748b', cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit' }}>Rechazar</button>
                            <button disabled={busy} onClick={() => handleApprove(req)} style={{ padding: '4px 9px', borderRadius: 6, border: 'none', background: '#0f172a', fontSize: 11, fontWeight: 600, color: '#fff', cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit' }}>Aprobar</button>
                          </div>
                        </div>
                      );
                    })
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── NotifRow ──────────────────────────────────────────────────────────────────
function NotifRow({ n, onRead }) {
  const meta = TYPE_META[n.type] || defaultMeta;
  return (
    <div
      onClick={onRead}
      style={{
        padding: '11px 14px', borderBottom: '1px solid #f8fafc',
        display: 'flex', gap: 10, alignItems: 'flex-start',
        background: n.read ? '#fff' : 'rgba(0,102,255,0.03)',
        cursor: n.read || n.computed ? 'default' : 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (!n.read && !n.computed) e.currentTarget.style.background = 'rgba(0,102,255,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = n.read ? '#fff' : 'rgba(0,102,255,0.03)'; }}
    >
      {/* Icon */}
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: meta.bg, color: meta.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {meta.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 12, color: '#0f172a' }}>{n.title}</span>
          {!n.read && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0066FF', flexShrink: 0 }} />
          )}
        </div>
        {n.body && (
          <div style={{ fontSize: 12, color: '#52606D', lineHeight: 1.45, wordBreak: 'break-word' }}>{n.body}</div>
        )}
        {n.created_at && (
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{timeAgo(n.created_at)}</div>
        )}
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
function EmptyState({ icon, text }) {
  return (
    <div style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8' }}>
      <div style={{ marginBottom: 10, opacity: 0.5 }}>{icon}</div>
      <div style={{ fontSize: 13 }}>{text}</div>
    </div>
  );
}

export default NotificationCenter;
