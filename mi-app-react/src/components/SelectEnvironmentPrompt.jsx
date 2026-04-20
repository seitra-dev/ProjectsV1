import React from 'react';
import { FolderOpen, ArrowLeft } from 'lucide-react';

/**
 * Pantalla que se muestra cuando el usuario intenta acceder a una vista
 * que requiere un entorno seleccionado, pero aún no tiene ninguno activo.
 */
export default function SelectEnvironmentPrompt() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: '60vh',
      padding: '32px 24px',
      textAlign: 'center',
    }}>
      {/* Icono */}
      <div style={{
        width: 80, height: 80, borderRadius: 20,
        background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
        boxShadow: '0 4px 16px rgba(99,102,241,0.12)',
      }}>
        <FolderOpen size={38} color="#6366f1" strokeWidth={1.5} />
      </div>

      {/* Título */}
      <h2 style={{
        margin: '0 0 12px',
        fontSize: 22, fontWeight: 700, color: '#111827',
      }}>
        Selecciona un equipo
      </h2>

      {/* Descripción */}
      <p style={{
        margin: '0 0 28px',
        fontSize: 15, color: '#6b7280', maxWidth: 380, lineHeight: 1.6,
      }}>
        Para acceder a esta sección, primero selecciona un equipo desde el menú lateral.
      </p>

      {/* Indicador */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 20px',
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: 10, fontSize: 13, color: '#6b7280',
      }}>
        <ArrowLeft size={16} color="#6366f1" />
        Usa el panel lateral para elegir tu equipo de trabajo
      </div>
    </div>
  );
}
