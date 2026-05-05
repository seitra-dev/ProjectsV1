import { useState, useEffect, useCallback } from 'react';
import { Check, X, Users, Clock, RefreshCw, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

const ACCENT  = '#6357dc';
const GREEN   = '#16a34a';
const RED     = '#dc2626';
const T1      = '#1e293b';
const T2      = '#64748b';
const BORDER  = '#e2e8f0';

// ── Helpers ──────────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Justo ahora';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Ayer';
  if (d < 30)  return `Hace ${d} días`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

function UserAvatar({ user, size = 40 }) {
  const isUrl = typeof user?.avatar === 'string' &&
    (user.avatar.startsWith('http') || user.avatar.startsWith('data:'));
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 3,
      background: isUrl ? 'transparent' : `linear-gradient(135deg, ${ACCENT} 0%, #8b5cf6 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, overflow: 'hidden',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38,
    }}>
      {isUrl
        ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (user?.avatar && user.avatar.length <= 4
            ? user.avatar
            : (user?.name || user?.email || 'U').charAt(0).toUpperCase()
          )
      }
    </div>
  );
}

// ── Fila de solicitud ─────────────────────────────────────────────────────────
function RequestRow({ request, org, onApprove, onReject, isProcessing }) {
  const { user } = request;
  const [hoverApprove, setHoverApprove] = useState(false);
  const [hoverReject, setHoverReject]   = useState(false);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '1rem 1.25rem',
      borderBottom: `1px solid ${BORDER}`,
      background: isProcessing ? '#f8fafc' : 'white',
      opacity: isProcessing ? 0.6 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Avatar */}
      <UserAvatar user={user} size={42} />

      {/* Info usuario */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: T1, fontSize: '0.9rem', marginBottom: 2 }}>
          {user?.name || 'Sin nombre'}
        </div>
        <div style={{ color: T2, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.email}
        </div>
      </div>

      {/* Org destino */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: org?.color || ACCENT,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.85rem',
        }}>
          {org?.icon || '🏢'}
        </div>
        <span style={{ color: T2, fontSize: '0.82rem', fontWeight: 500 }}>
          {org?.name || '—'}
        </span>
      </div>

      {/* Tiempo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8', fontSize: '0.78rem', flexShrink: 0, minWidth: 90 }}>
        <Clock size={12} />
        {timeAgo(request.requested_at)}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button
          disabled={isProcessing}
          onClick={() => onReject(request)}
          onMouseEnter={() => setHoverReject(true)}
          onMouseLeave={() => setHoverReject(false)}
          title="Rechazar solicitud"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '0.45rem 0.85rem', borderRadius: 8,
            border: `1px solid ${hoverReject ? '#fecaca' : BORDER}`,
            background: hoverReject ? '#fef2f2' : 'white',
            color: hoverReject ? RED : T2,
            fontSize: '0.8rem', fontWeight: 500,
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}
        >
          <X size={13} />
          Rechazar
        </button>

        <button
          disabled={isProcessing}
          onClick={() => onApprove(request)}
          onMouseEnter={() => setHoverApprove(true)}
          onMouseLeave={() => setHoverApprove(false)}
          title="Aprobar solicitud"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '0.45rem 0.85rem', borderRadius: 8,
            border: 'none',
            background: hoverApprove
              ? '#15803d'
              : `linear-gradient(135deg, ${GREEN} 0%, #15803d 100%)`,
            color: '#fff',
            fontSize: '0.8rem', fontWeight: 600,
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}
        >
          <Check size={13} />
          Aprobar
        </button>
      </div>
    </div>
  );
}

// ── Vista principal ───────────────────────────────────────────────────────────
export default function OrgJoinRequestsView() {
  const { organizationId, currentUser, setPendingRequestsCount } = useApp();

  const [requests,   setRequests]   = useState([]);
  const [org,        setOrg]        = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [processing, setProcessing] = useState(null); // id de la solicitud en proceso
  const [toast,      setToast]      = useState(null); // { msg, type }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      // Solicitudes pendientes — si hay organizationId filtra por ella, si no trae todas
      let query = supabase
        .from('organization_join_requests')
        .select('id, user_id, organization_id, status, requested_at')
        .eq('status', 'pending')
        .order('requested_at', { ascending: true });

      if (organizationId) query = query.eq('organization_id', organizationId);

      const { data: reqs, error: reqErr } = await query;
      if (reqErr) throw reqErr;
      if (!reqs?.length) { setRequests([]); return; }

      // Datos de los usuarios solicitantes
      const userIds = [...new Set(reqs.map(r => r.user_id))];
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email, avatar')
        .in('id', userIds);

      const userMap = Object.fromEntries((users || []).map(u => [u.id, u]));
      setRequests(reqs.map(r => ({ ...r, user: userMap[r.user_id] || null })));
    } catch (err) {
      console.error('[OrgJoinRequestsView] Error cargando solicitudes:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      supabase
        .from('organizations')
        .select('id, name, icon, color')
        .eq('id', organizationId)
        .single()
        .then(({ data }) => setOrg(data));
    }
    loadRequests();
  }, [organizationId, loadRequests]);

  // ── Aprobar ─────────────────────────────────────────────────────────────────
  const handleApprove = async (request) => {
    setProcessing(request.id);
    try {
      const { error } = await supabase.rpc('approve_join_request', {
        p_request_id:      request.id,
        p_organization_id: request.organization_id,
        p_user_id:         request.user_id,
        p_reviewed_by:     currentUser?.id,
      });
      if (error) throw error;

      setRequests(prev => prev.filter(r => r.id !== request.id));
      setPendingRequestsCount(prev => Math.max(0, prev - 1));
      showToast(`${request.user?.name || 'Usuario'} ahora es miembro de la organización.`);
    } catch (err) {
      console.error('[handleApprove]', err);
      showToast(err.message || 'Error al aprobar.', 'error');
    } finally {
      setProcessing(null);
    }
  };

  // ── Rechazar ────────────────────────────────────────────────────────────────
  const handleReject = async (request) => {
    setProcessing(request.id);
    try {
      const { error } = await supabase
        .from('organization_join_requests')
        .update({
          status:      'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUser?.id,
        })
        .eq('id', request.id);
      if (error) throw error;

      setRequests(prev => prev.filter(r => r.id !== request.id));
      setPendingRequestsCount(prev => Math.max(0, prev - 1));
      showToast(`Solicitud de ${request.user?.name || 'usuario'} rechazada.`, 'info');
    } catch (err) {
      console.error('[handleReject]', err);
      showToast(err.message || 'Error al rechazar.', 'error');
    } finally {
      setProcessing(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{
      padding: '2rem 2.5rem',
      fontFamily: 'Inter, system-ui, sans-serif',
      maxWidth: 900, margin: '0 auto',
      position: 'relative',
    }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: toast.type === 'error' ? '#fef2f2' : toast.type === 'info' ? '#f0f9ff' : '#f0fdf4',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : toast.type === 'info' ? '#bae6fd' : '#bbf7d0'}`,
          color: toast.type === 'error' ? RED : toast.type === 'info' ? '#0369a1' : GREEN,
          borderRadius: 12, padding: '0.75rem 1.25rem',
          fontSize: '0.85rem', fontWeight: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast.type === 'error' ? <X size={15} /> : <Check size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={17} color={ACCENT} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: T1 }}>
              Solicitudes de ingreso
            </h1>
          </div>
          <p style={{ margin: 0, color: T2, fontSize: '0.85rem' }}>
            {org
              ? <>Solicitudes pendientes para <strong style={{ color: T1 }}>{org.name}</strong></>
              : 'Gestiona quién puede unirse a tu organización.'
            }
          </p>
        </div>

        <button
          onClick={loadRequests}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.5rem 1rem', borderRadius: 8,
            border: `1px solid ${BORDER}`, background: 'white',
            color: T2, fontSize: '0.82rem', fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Actualizar
        </button>
      </div>

      {/* Contenido */}
      {loading ? (
        <div style={{
          background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`,
          padding: '3rem', textAlign: 'center', color: T2, fontSize: '0.9rem',
        }}>
          <RefreshCw size={20} color="#cbd5e1" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <div>Cargando solicitudes…</div>
        </div>

      ) : requests.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`,
          padding: '4rem 2rem', textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#f8fafc', border: `1px solid ${BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <Building2 size={22} color="#cbd5e1" />
          </div>
          <p style={{ margin: '0 0 0.4rem', fontWeight: 600, color: T1, fontSize: '0.95rem' }}>
            No hay solicitudes pendientes
          </p>
          <p style={{ margin: 0, color: T2, fontSize: '0.83rem' }}>
            Cuando alguien solicite unirse a tu organización, aparecerá aquí.
          </p>
        </div>

      ) : (
        <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>

          {/* Cabecera tabla */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '0.65rem 1.25rem',
            background: '#f8fafc', borderBottom: `1px solid ${BORDER}`,
          }}>
            <div style={{ flex: 1, fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Usuario
            </div>
            <div style={{ width: 160, fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Organización
            </div>
            <div style={{ width: 100, fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Solicitado
            </div>
            <div style={{ width: 180, fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
              Acción
            </div>
          </div>

          {/* Filas */}
          {requests.map((req) => (
            <RequestRow
              key={req.id}
              request={req}
              org={org}
              onApprove={handleApprove}
              onReject={handleReject}
              isProcessing={processing === req.id}
            />
          ))}

          {/* Footer con conteo */}
          <div style={{
            padding: '0.75rem 1.25rem',
            background: '#f8fafc', borderTop: `1px solid ${BORDER}`,
            fontSize: '0.78rem', color: T2, fontWeight: 500,
          }}>
            {requests.length} solicitud{requests.length !== 1 ? 'es' : ''} pendiente{requests.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
