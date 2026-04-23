import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  Layers, Briefcase, CheckSquare, TrendingUp, Loader,
  Crown, ShieldCheck, User, Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dbProjects, dbTasks } from '../lib/database';
import PerformanceDashboard from './PerformanceDashboard';

// ============================================================================
// HELPERS
// ============================================================================

const ROLE_BADGES = {
  owner:  { label: 'Propietario', icon: '👑', color: '#f59e0b' },
  admin:  { label: 'Administrador', icon: '⚙️', color: '#6366f1' },
  member: { label: 'Miembro',     icon: '👤', color: '#0ea5e9' },
  viewer: { label: 'Observador',  icon: '👁️',  color: '#64748b' },
};

const ENV_COLORS = [
  '#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
];

function KpiCard({ icon, label, value, color, subtitle }) {
  return (
    <div style={{
      background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem',
      border: '1px solid #e8ecf0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '10px',
          background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>
        {label}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px',
      padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      fontSize: '0.82rem', fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#1e293b' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ============================================================================
// ANALYTICS DASHBOARD
// ============================================================================

export default function AnalyticsDashboard() {
  const { environments, currentUser, membershipMap, isSuperAdmin } = useApp();
  const superAdmin = isSuperAdmin();
  const canSeePerformance = superAdmin || ['admin', 'super_admin'].includes(currentUser?.role);

  const [activeTab, setActiveTab] = useState('general');

  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    envStats: [],    // [{ name, icon, color, projects, tasks, completed, progress, role }]
    topProjects: [], // top 5 by task count
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (environments.length === 0) {
      setStats(s => ({ ...s, loading: false }));
      return;
    }
    loadStats();
  }, [environments, superAdmin]);

  const loadStats = async () => {
    setStats(s => ({ ...s, loading: true, error: null }));
    try {
      const envStatsArr = [];
      let allProjects = [];
      let allTasks = [];

      for (const env of environments) {
        const projects = await dbProjects.getByEnvironment(env.id).catch(() => []);
        const taskArrays = await Promise.all(projects.map(p => dbTasks.getByProject(p.id).catch(() => [])));
        const tasks = taskArrays.flat();

        const completed = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
        const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
        const role = membershipMap[env.id]?.role || null;

        envStatsArr.push({
          name: env.name.length > 18 ? env.name.slice(0, 16) + '…' : env.name,
          fullName: env.name,
          icon: env.icon || '📁',
          color: env.color || '#667eea',
          projects: projects.length,
          tasks: tasks.length,
          completed,
          progress,
          role,
        });

        allProjects = allProjects.concat(projects);
        allTasks = allTasks.concat(tasks);
      }

      // Top 5 proyectos por número de tareas
      const projectTaskCount = {};
      allTasks.forEach(t => {
        if (t.projectId) projectTaskCount[t.projectId] = (projectTaskCount[t.projectId] || 0) + 1;
      });
      const topProjects = allProjects
        .map(p => ({ ...p, taskCount: projectTaskCount[p.id] || 0 }))
        .sort((a, b) => b.taskCount - a.taskCount)
        .slice(0, 5);

      const totalCompleted = allTasks.filter(t => t.status === 'done' || t.status === 'completed').length;

      setStats({
        totalProjects: allProjects.length,
        totalTasks: allTasks.length,
        completedTasks: totalCompleted,
        envStats: envStatsArr,
        topProjects,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('[AnalyticsDashboard] Error:', err);
      setStats(s => ({ ...s, loading: false, error: 'Error cargando métricas.' }));
    }
  };

  const productivity = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

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

      {activeTab === 'general' && (<>

      {stats.loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
          <Loader size={28} color="#667eea" style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Cargando métricas...</p>
        </div>
      )}

      {!stats.loading && (<>

      {stats.error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {stats.error}
        </div>
      )}

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <KpiCard
          icon={<Layers size={20} color="#667eea" />}
          label="Total entornos"
          value={environments.length}
          color="#667eea"
          subtitle={superAdmin ? 'En el sistema' : 'Donde eres miembro'}
        />
        <KpiCard
          icon={<Briefcase size={20} color="#0ea5e9" />}
          label="Proyectos activos"
          value={stats.totalProjects}
          color="#0ea5e9"
          subtitle="En todos los entornos"
        />
        <KpiCard
          icon={<CheckSquare size={20} color="#10b981" />}
          label="Tareas totales"
          value={stats.totalTasks}
          color="#10b981"
          subtitle={`${stats.completedTasks} completadas`}
        />
        <KpiCard
          icon={<TrendingUp size={20} color="#f59e0b" />}
          label="Productividad"
          value={`${productivity}%`}
          color="#f59e0b"
          subtitle="Tareas completadas"
        />
      </div>

      {/* ── GRÁFICA DE BARRAS + TOP PROYECTOS ── */}
      {stats.envStats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

          {/* Gráfica: Progreso por entorno */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e8ecf0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
              Progreso por entorno
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.envStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="progress" name="Progreso %" radius={[4, 4, 0, 0]}>
                  {stats.envStats.map((entry, i) => (
                    <Cell key={i} fill={entry.color || ENV_COLORS[i % ENV_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 proyectos */}
          <div style={{ background: 'white', borderRadius: '14px', padding: '1.25rem 1.5rem', border: '1px solid #e8ecf0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
              Top 5 proyectos más activos
            </h3>
            {stats.topProjects.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>
                No hay proyectos con tareas.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.topProjects.map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', width: '16px', textAlign: 'right', flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: p.color || '#667eea', flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </div>
                      <div style={{ height: 4, background: '#f1f5f9', borderRadius: '4px', marginTop: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '4px',
                          background: p.color || '#667eea',
                          width: `${p.progress || 0}%`,
                        }} />
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', flexShrink: 0 }}>
                      {p.taskCount} tareas
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TABLA DE ENTORNOS ── */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8ecf0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e8ecf0' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
            Detalle por entorno
          </h3>
        </div>
        {stats.envStats.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
            No hay entornos para mostrar.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Entorno', 'Tu rol', 'Proyectos', 'Tareas', 'Completadas', 'Progreso'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e8ecf0' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.envStats.map((env, i) => {
                  const roleBadge = ROLE_BADGES[env.role];
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafe'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '8px',
                            background: `${env.color}20`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', flexShrink: 0,
                          }}>
                            {env.icon}
                          </div>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{env.fullName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {roleBadge ? (
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: roleBadge.color }}>
                            {roleBadge.icon} {roleBadge.label}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#374151', fontWeight: 600 }}>{env.projects}</td>
                      <td style={{ padding: '12px 16px', color: '#374151', fontWeight: 600 }}>{env.tasks}</td>
                      <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 600 }}>{env.completed}</td>
                      <td style={{ padding: '12px 16px', minWidth: '120px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: '4px',
                              background: env.color || '#667eea',
                              width: `${env.progress}%`,
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', flexShrink: 0, width: '36px' }}>
                            {env.progress}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      </>)}
      </>)}
    </div>
  );
}
