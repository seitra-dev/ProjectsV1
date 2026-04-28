import { useState } from 'react';
import { useApp } from '../context/AppContext';
import PerformanceDashboard from './PerformanceDashboard';
import AnalyticsGeneralView from './AnalyticsGeneralView';

// ============================================================================
// ANALYTICS DASHBOARD
// ============================================================================

export default function AnalyticsDashboard() {
  const { environments, currentUser, isSuperAdmin } = useApp();
  const superAdmin = isSuperAdmin();
  const canSeePerformance = superAdmin || ['admin', 'super_admin'].includes(currentUser?.role);

  const [activeTab, setActiveTab] = useState('general');

  return (
    <div style={{ padding: '1.5rem 2rem', fontFamily: 'Inter, system-ui, sans-serif', maxWidth: '1100px' }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary, #1e293b)' }}>
            Analítica
          </h2>
          {superAdmin && (
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea20, #764ba220)',
              color: '#667eea', border: '1px solid #c7d2fe',
            }}>
              Vista Super Admin
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
          {superAdmin
            ? `Métricas globales de todos los entornos (${environments.length} entornos)`
            : `Métricas de tus entornos (${environments.length} entornos donde eres miembro)`
          }
        </p>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', borderBottom: '1px solid #e8ecf0', paddingBottom: '0' }}>
        {[
          { id: 'general', label: 'General' },
          ...(canSeePerformance ? [{ id: 'desempeno', label: 'Desempeño' }] : []),
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #667eea' : '2px solid transparent',
              color: activeTab === tab.id ? '#667eea' : '#64748b',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginBottom: '-1px',
              fontFamily: 'inherit',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'desempeno' && <PerformanceDashboard />}

      {activeTab === 'general' && <AnalyticsGeneralView />}
    </div>
  );
}
