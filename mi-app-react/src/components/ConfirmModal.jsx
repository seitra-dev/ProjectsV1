import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'delete' }) => {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  useEffect(() => { if (!isOpen) setConfirming(false); }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setConfirming(true);
    try { await onConfirm(); } finally { setConfirming(false); }
  };

  const isDanger = type === 'delete';
  const accentColor = isDanger ? '#ef4444' : '#f59e0b';
  const accentBg = isDanger ? '#fef2f2' : '#fffbeb';

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '32px 28px 28px',
          maxWidth: '380px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.08)',
          animation: 'confirmIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Icon */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: accentBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px',
        }}>
          {isDanger
            ? <Trash2 size={24} color={accentColor} strokeWidth={2} />
            : <AlertTriangle size={24} color={accentColor} strokeWidth={2} />
          }
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '17px', fontWeight: 700, color: '#0f172a',
          marginBottom: '8px', lineHeight: 1.3,
        }}>
          {title}
        </h3>

        {/* Message */}
        <p style={{
          fontSize: '14px', color: '#64748b',
          lineHeight: 1.65, marginBottom: '28px',
        }}>
          {message || 'Esta acción no se puede deshacer.'}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            disabled={confirming}
            style={{
              flex: 1,
              padding: '11px 0',
              border: '1.5px solid #e2e8f0',
              borderRadius: '11px',
              background: '#f8fafc',
              color: '#475569',
              fontSize: '14px', fontWeight: 600,
              cursor: confirming ? 'not-allowed' : 'pointer',
              opacity: confirming ? 0.5 : 1,
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { if (!confirming) { e.target.style.background = '#f1f5f9'; e.target.style.borderColor = '#cbd5e1'; } }}
            onMouseLeave={e => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; }}
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            disabled={confirming}
            style={{
              flex: 1,
              padding: '11px 0',
              border: 'none',
              borderRadius: '11px',
              background: accentColor,
              color: '#fff',
              fontSize: '14px', fontWeight: 600,
              cursor: confirming ? 'not-allowed' : 'pointer',
              opacity: confirming ? 0.7 : 1,
              transition: 'opacity 0.15s, filter 0.15s',
            }}
            onMouseEnter={e => { if (!confirming) e.target.style.filter = 'brightness(1.08)'; }}
            onMouseLeave={e => { e.target.style.filter = 'none'; }}
          >
            {confirming
              ? (isDanger ? 'Eliminando…' : 'Confirmando…')
              : (isDanger ? 'Eliminar' : 'Confirmar')
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confirmIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
