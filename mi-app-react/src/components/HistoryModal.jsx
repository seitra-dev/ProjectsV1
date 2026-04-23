import { useState, useEffect } from 'react';
import { X, Clock, User, Edit3, Trash2, Plus, Loader } from 'lucide-react';
import { dbAuditLog } from '../lib/database';
import { getTaskStatus, getProjectStatus } from '../constants/statuses';

// ============================================================================
// HELPERS
// ============================================================================

const ACTION_CONFIG = {
  INSERT: { label: 'Creado',       icon: <Plus size={14} />,  bg: '#d1fae5', color: '#065f46' },
  UPDATE: { label: 'Actualizado',  icon: <Edit3 size={14} />, bg: '#dbeafe', color: '#1e40af' },
  DELETE: { label: 'Eliminado',    icon: <Trash2 size={14} />,bg: '#fee2e2', color: '#991b1b' },
};

const FIELD_LABELS = {
  title:       'Título',
  status:      'Estado',
  priority:    'Prioridad',
  description: 'Descripción',
  assignee_id: 'Asignado',
  start_date:  'Fecha inicio',
  end_date:    'Fecha fin',
  name:        'Nombre',
  progress:    'Progreso',
  owner_id:    'Responsable',
  workspace_id:'Workspace',
  list_id:     'Lista',
  parent_id:   'Tarea padre',
};

const PRIORITY_LABELS = {
  urgent: 'Urgente',
  high:   'Alta',
  medium: 'Media',
  low:    'Baja',
};

const formatValue = (field, value) => {
  if (value === null || value === undefined || value === '') return '(vacío)';
  if (field === 'status')   return getTaskStatus(value).label || getProjectStatus(value).label || value;
  if (field === 'priority') return PRIORITY_LABELS[value] || value;
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object')  return JSON.stringify(value);
  return String(value);
};

const formatDate = (iso) =>
  new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ============================================================================
// HISTORY MODAL
// ============================================================================

function HistoryModal({ isOpen, onClose, entityType, entityId, entityName }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!isOpen || !entityId) return;
    setHistory([]);
    setError(null);
    setLoading(true);
    dbAuditLog.getHistory(entityType, entityId)
      .then(setHistory)
      .catch(e => setError(e.message || 'Error cargando historial'))
      .finally(() => setLoading(false));
  }, [isOpen, entityId, entityType]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000, padding: '20px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '16px',
          width: '100%', maxWidth: '680px',
          maxHeight: '82vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #e8ecf0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
              background: '#eef2ff', display: 'flex', alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Clock size={18} color="#6366f1" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
                Historial de cambios
              </h3>
              {entityName && (
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>
                  {entityName}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#94a3b8',
              cursor: 'pointer', padding: 4, display: 'flex',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', color: '#94a3b8', gap: '10px' }}>
              <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              Cargando historial...
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
              <Clock size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <div style={{ fontSize: '14px', fontWeight: 500 }}>Sin historial registrado</div>
              <div style={{ fontSize: '12px', marginTop: '6px' }}>
                Los cambios aparecerán aquí una vez que se realice alguna modificación.
              </div>
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <div style={{ position: 'relative' }}>
              {history.map((entry, idx) => {
                const cfg = ACTION_CONFIG[entry.action] || ACTION_CONFIG.UPDATE;
                const changedFields = Array.isArray(entry.changed_fields) ? entry.changed_fields : [];

                return (
                  <div
                    key={entry.id}
                    style={{ paddingLeft: '44px', paddingBottom: '24px', position: 'relative' }}
                  >
                    {/* Línea vertical de timeline */}
                    {idx < history.length - 1 && (
                      <div style={{
                        position: 'absolute', left: '15px', top: '32px', bottom: 0,
                        width: '2px', background: '#f1f5f9',
                      }} />
                    )}

                    {/* Ícono del evento */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0,
                      width: 32, height: 32, borderRadius: '50%',
                      background: cfg.bg, color: cfg.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid white',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                    }}>
                      {cfg.icon}
                    </div>

                    {/* Contenido */}
                    <div>
                      {/* Línea de título + fecha */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <span style={{
                          fontWeight: 600, fontSize: '14px', color: '#1e293b',
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                        }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '99px',
                            background: cfg.bg, color: cfg.color,
                            fontSize: '11px', fontWeight: 700,
                          }}>
                            {cfg.label}
                          </span>
                          {entry.description || ''}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: '12px', flexShrink: 0 }}>
                          {formatDate(entry.changed_at)}
                        </span>
                      </div>

                      {/* Usuario */}
                      {(entry.user_name || entry.user_email) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                          <User size={12} />
                          <span style={{ fontWeight: 500 }}>{entry.user_name || entry.user_email}</span>
                          {entry.user_email && entry.user_name && (
                            <span style={{ color: '#94a3b8' }}>· {entry.user_email}</span>
                          )}
                        </div>
                      )}

                      {/* Campos modificados */}
                      {entry.action === 'UPDATE' && changedFields.length > 0 && (
                        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {changedFields.map((field, fi) => (
                            <div key={fi}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                {FIELD_LABELS[field] || field}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{
                                  padding: '2px 8px', background: '#fee2e2', color: '#991b1b',
                                  borderRadius: '4px', fontSize: '12px', fontWeight: 500,
                                  maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {formatValue(field, entry.old_values?.[field])}
                                </span>
                                <span style={{ color: '#94a3b8', fontSize: '14px' }}>→</span>
                                <span style={{
                                  padding: '2px 8px', background: '#d1fae5', color: '#065f46',
                                  borderRadius: '4px', fontSize: '12px', fontWeight: 500,
                                  maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {formatValue(field, entry.new_values?.[field])}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        {!loading && history.length > 0 && (
          <div style={{
            padding: '12px 24px', borderTop: '1px solid #f1f5f9',
            fontSize: '12px', color: '#94a3b8', textAlign: 'right',
          }}>
            {history.length} {history.length === 1 ? 'registro' : 'registros'}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryModal;
