import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'delete' }) => {
  if (!isOpen) return null;
  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: '20px', padding: '32px',
        maxWidth: '400px', width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
        animation: 'confirmIn 0.2s cubic-bezier(0.34,1.56,0.64,1)'
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: type === 'delete' ? '#fef2f2' : '#fffbeb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px'
        }}>
          {type === 'delete'
            ? <Trash2 size={22} color="#ef4444" />
            : <AlertTriangle size={22} color="#f59e0b" />
          }
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>
          {title}
        </h3>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px', lineHeight: 1.6 }}>
          {message || 'Esta acción no se puede deshacer.'}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '10px 20px', border: '1.5px solid #e5e7eb',
            borderRadius: '10px', background: 'white', color: '#374151',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer'
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            padding: '10px 20px', border: 'none',
            borderRadius: '10px',
            background: type === 'delete' ? '#ef4444' : '#f59e0b',
            color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer'
          }}>
            {type === 'delete' ? 'Eliminar' : 'Confirmar'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes confirmIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
