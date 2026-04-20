import { ShieldOff } from 'lucide-react';

// ============================================================================
// ACCESS DENIED MODAL
// Mostrar cuando el usuario no tiene permisos para acceder a un entorno
// ============================================================================

const AccessDeniedModal = ({ isOpen, onClose, environmentName }) => {
  if (!isOpen) return null;

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
          background: 'white', borderRadius: '16px', padding: '2rem',
          width: '100%', maxWidth: '400px', textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* Ícono */}
        <div style={{
          width: 56, height: 56, borderRadius: '14px',
          background: '#fef2f2', border: '1.5px solid #fecaca',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
        }}>
          <ShieldOff size={26} color="#dc2626" strokeWidth={1.8} />
        </div>

        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
          Necesitas permisos para acceder
        </h3>

        <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
          {environmentName
            ? <>El equipo <strong>"{environmentName}"</strong> es privado.</>
            : 'Este equipo es privado.'
          }{' '}
          Contacta al administrador para solicitar acceso.
        </p>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '0.8rem', border: 'none', borderRadius: '10px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white', fontSize: '0.9rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

export default AccessDeniedModal;
