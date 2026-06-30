import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartTooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList,
} from 'recharts';
import {
  Filter, X, AlertTriangle, CheckCircle2, Clock,
  ChevronDown, RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dbProjects, dbTasks, dbUsers } from '../lib/database';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  green:      '#059669', greenLight: '#f0fdf4', greenMid: '#bbf7d0',
  blue:       '#2563eb', blueLight:  '#eff6ff', blueMid:  '#bfdbfe',
  amber:      '#d97706', amberLight: '#fffbeb',
  gray:       '#94a3b8', grayLight:  '#f8fafc',
  red:        '#dc2626', redLight:   '#fef2f2',
  slate50:    '#f8fafc', slate100: '#f1f5f9', slate200: '#e2e8f0',
  slate400:   '#94a3b8', slate500:  '#64748b', slate700: '#334155', slate900: '#0f172a',
  white:      '#ffffff',
};

// ─── Status categorization ────────────────────────────────────────────────────
const getProjectCat = (status) => {
  if (status === 'completed') return 'completed';
  if (['in_progress', 'active', 'expedite', 'waiting', 'paused', 'blocked'].includes(status)) return 'in_progress';
  if (status === 'backlog') return 'backlog';
  if (['pending', 'todo'].includes(status)) return 'pending';
  return null;
};

const getTaskCat = (status) => {
  if (status === 'completed') return 'completed';
  if (['in_progress', 'expedite', 'waiting', 'paused', 'blocked'].includes(status)) return 'in_progress';
  if (['pending', 'todo'].includes(status)) return 'pending';
  if (status === 'backlog') return 'backlog';
  return null;
};

const PROJ_CATS = {
  completed:   { label: 'Entregados', color: '#059669' },
  in_progress: { label: 'En curso',   color: '#2563eb' },
  backlog:     { label: 'Backlog',    color: '#94a3b8' },
  pending:     { label: 'Pendientes', color: '#d97706' },
};

const TASK_CATS = {
  completed:   { label: 'Completadas', color: '#059669' },
  in_progress: { label: 'En curso',    color: '#2563eb' },
  backlog:     { label: 'Backlog',     color: '#94a3b8' },
  pending:     { label: 'Pendientes',  color: '#d97706' },
};

const PRIORITY_CFG = {
  urgent: { label: 'Urgente', color: '#dc2626' },
  high:   { label: 'Alta',    color: '#f97316' },
  medium: { label: 'Media',   color: '#eab308' },
  low:    { label: 'Baja',    color: '#22c55e' },
};

const SEVERITY_CFG = {
  high:   { bg: '#fef2f2', border: '#fecaca', dot: '#dc2626', text: '#dc2626' },
  medium: { bg: '#fffbeb', border: '#fde68a', dot: '#d97706', text: '#92400e' },
  low:    { bg: '#f0fdf4', border: '#bbf7d0', dot: '#059669', text: '#065f46' },
};

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const todayStr     = () => new Date().toISOString().slice(0, 10);
const firstOfYear  = () => `${new Date().getFullYear()}-01-01`;

const projectInRange = (p, from, to) => {
  if (!from && !to) return true;
  const s = p.startDate?.slice(0, 10);
  const e = p.endDate?.slice(0, 10);
  if (!s && !e) return true;
  const effS = s || e;
  const effE = e || s;
  return (!from || effE >= from) && (!to || effS <= to);
};

const monthsBetween = (from, to) => {
  if (!from || !to) return [];
  const months = [];
  const cur = new Date(from.slice(0, 7) + '-01');
  const end = new Date(to.slice(0, 7) + '-01');
  while (cur <= end) {
    months.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
};

// ─── Shared UI styles ─────────────────────────────────────────────────────────
const SEL = {
  padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8,
  fontSize: 12, fontFamily: 'inherit', color: '#334155', background: 'white', outline: 'none',
};
const BTN = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '7px 14px', border: 'none', borderRadius: 8,
  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};

const FF = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </label>
    {children}
  </div>
);

// ─── Shared components ────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.slate200}`,
      borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ top, title }) {
  return (
    <div style={{ padding: '16px 20px 0' }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {top}
      </p>
      <h3 style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: C.slate900 }}>
        {title}
      </h3>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.slate200}`,
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: 12,
    }}>
      {label && <p style={{ margin: '0 0 5px', fontWeight: 700, color: C.slate900 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.color || p.fill }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// Label sobre cada punto del gráfico de línea (omite ceros)
const LineValueLabel = ({ x, y, value }) => {
  if (!value) return null;
  return (
    <text x={x} y={y - 10} textAnchor="middle"
      fill="#059669" fontSize={12} fontWeight="700"
      fontFamily="Inter, system-ui, sans-serif">
      {value}
    </text>
  );
};

// Label de total sobre la barra apilada completa
const BarTotalLabel = ({ x, y, width, value }) => {
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 6} textAnchor="middle"
      fill="#334155" fontSize={12} fontWeight="700"
      fontFamily="Inter, system-ui, sans-serif">
      {value}
    </text>
  );
};

// Label dentro de cada segmento de barra (solo si el segmento es suficientemente alto)
const SegmentLabel = ({ x, y, width, height, value }) => {
  if (!value || height < 18) return null;
  return (
    <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="central"
      fill="white" fontSize={11} fontWeight="700"
      fontFamily="Inter, system-ui, sans-serif">
      {value}
    </text>
  );
};

function AvatarCell({ name, src, size = 30 }) {
  if (src && typeof src === 'string' && src.startsWith('http')) {
    return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  const init = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const pal = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
  const bg = pal[(name || '').charCodeAt(0) % pal.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: 'white',
    }}>
      {init}
    </div>
  );
}

// ─── KPI Status Card ─────────────────────────────────────────────────────────
function KpiStatusCard({ sublabel, total, cats, catValues }) {
  const totalCats = Object.values(catValues).reduce((a, b) => a + b, 0);

  return (
    <Card style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        {sublabel}
      </div>
      <div style={{ fontSize: 34, fontWeight: 800, color: C.slate900, lineHeight: 1, marginBottom: 10 }}>
        {total}
      </div>

      {/* Stacked color bar */}
      {totalCats > 0 && (
        <div style={{ display: 'flex', height: 5, borderRadius: 4, overflow: 'hidden', gap: 1, marginBottom: 14 }}>
          {Object.entries(cats).map(([k, cat]) => {
            const v = catValues[k] || 0;
            const share = (v / totalCats) * 100;
            return share > 0 ? (
              <div key={k} style={{ flex: share, background: cat.color, minWidth: 2 }} />
            ) : null;
          })}
        </div>
      )}

      {/* Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {Object.entries(cats).map(([k, cat]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: C.slate500 }}>{cat.label}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.slate700 }}>{catValues[k] || 0}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Completion Rate Card ─────────────────────────────────────────────────────
function CompletionRateCard({ rate, completed, total }) {
  const clamp = Math.min(100, Math.max(0, rate || 0));
  const color = clamp >= 70 ? C.green : clamp >= 50 ? C.amber : C.red;
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (clamp / 100) * circ;

  return (
    <Card style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, alignSelf: 'flex-start' }}>
        TASA DE COMPLETITUD
      </div>
      <svg width={96} height={96} viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke={C.slate100} strokeWidth="7" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color}
          strokeWidth="7" strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round" transform="rotate(-90 48 48)" />
        <text x="48" y="48" textAnchor="middle" dominantBaseline="central"
          fontSize="16" fontWeight="800" fill={C.slate900}>{clamp}%</text>
      </svg>
      <div style={{ marginTop: 10, textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.slate500 }}>
          {completed} de {total} proyectos
        </div>
        <div style={{ fontSize: 10, color: C.slate400, marginTop: 2 }}>entregados</div>
      </div>
    </Card>
  );
}

// ─── Data loader ──────────────────────────────────────────────────────────────
async function loadAnalyticsData(envList) {
  const [users, ...envData] = await Promise.all([
    dbUsers.getAll().catch(() => []),
    ...envList.map(async (env) => {
      const projs = await dbProjects.getByEnvironment(env.id).catch(() => []);
      const taskArrays = await Promise.all(
        projs.map(p => dbTasks.getByProject(p.id).catch(() => []))
      );
      return { projs, tasks: taskArrays.flat() };
    }),
  ]);
  return {
    allProjects: envData.flatMap(d => d.projs),
    allTasks:    envData.flatMap(d => d.tasks),
    users,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AnalyticsGeneralView() {
  const { environments } = useApp();

  const def = { startDate: firstOfYear(), endDate: todayStr() };
  const [filters,       setFilters]      = useState(def);
  const [applied,       setApplied]      = useState(def);
  const [selectedEnvId, setSelectedEnvId] = useState('all');
  const [showEnvMenu,   setShowEnvMenu]  = useState(false);
  const [raw,           setRaw]          = useState({ allProjects: [], allTasks: [], users: [] });
  const [loading,       setLoading]      = useState(true);
  const [error,         setError]        = useState(null);

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const doLoad = useCallback(async () => {
    const envsToLoad = selectedEnvId === 'all'
      ? environments
      : environments.filter(e => e.id === selectedEnvId);
    if (!envsToLoad.length) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const data = await loadAnalyticsData(envsToLoad);
      setRaw(data);
    } catch (e) {
      setError(e.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [environments, selectedEnvId]);

  useEffect(() => { doLoad(); }, [doLoad]);

  // ── Computed metrics ───────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const { allProjects, allTasks, users } = raw;
    const from = applied.startDate;
    const to   = applied.endDate;

    const userMap = {};
    (users || []).forEach(u => { userMap[String(u.id)] = u; });

    // ── Projects ──
    const filteredProjects = allProjects.filter(p => {
      if (['cancelled', 'archived'].includes(p.status)) return false;
      return projectInRange(p, from, to);
    });

    const projCatValues = { completed: 0, in_progress: 0, backlog: 0, pending: 0 };
    filteredProjects.forEach(p => {
      const cat = getProjectCat(p.status);
      if (cat) projCatValues[cat]++;
    });
    const totalProjects    = filteredProjects.length;
    const completedProjects = projCatValues.completed;
    const completionRate   = totalProjects > 0
      ? Math.round((completedProjects / totalProjects) * 100) : 0;

    // ── Milestones (roadmap.phases) ──
    const allPhases = filteredProjects.flatMap(p => p.roadmap?.phases || []);
    const phaseCatValues = { completed: 0, in_progress: 0, backlog: 0, pending: 0 };
    allPhases.forEach(ph => {
      const cat = getProjectCat(ph.status || 'pending');
      if (cat) phaseCatValues[cat]++;
    });

    // ── Tasks ──
    const projSet = new Set(filteredProjects.map(p => p.id));
    const filteredTasks = allTasks.filter(t => projSet.has(t.projectId));

    const taskCatValues = { completed: 0, in_progress: 0, backlog: 0, pending: 0 };
    filteredTasks.forEach(t => {
      const cat = getTaskCat(t.status);
      if (cat) taskCatValues[cat]++;
    });

    // ── Projects over time (line chart) ──
    const monthlyCompleted = {};
    filteredProjects
      .filter(p => p.status === 'completed' && p.endDate)
      .forEach(p => {
        const k = p.endDate.slice(0, 7);
        monthlyCompleted[k] = (monthlyCompleted[k] || 0) + 1;
      });

    const months = monthsBetween(from, to);
    const projectsOverTime = months.map(k => ({
      label: `${MONTH_NAMES[parseInt(k.slice(5)) - 1]} ${k.slice(2, 4)}`,
      entregados: monthlyCompleted[k] || 0,
    }));

    // ── By area (stacked bar) ──
    const envProjectMap = {};
    filteredProjects.forEach(p => {
      const eid = p.environmentId || '__none__';
      if (!envProjectMap[eid]) envProjectMap[eid] = { completed: 0, in_progress: 0, backlog: 0, pending: 0 };
      const cat = getProjectCat(p.status);
      if (cat) envProjectMap[eid][cat]++;
    });

    const byArea = Object.entries(envProjectMap).map(([eid, vals]) => {
      const env = environments.find(e => e.id === eid);
      const total = vals.completed + vals.in_progress + vals.backlog + vals.pending;
      return {
        label: env
          ? (env.name.length > 14 ? env.name.slice(0, 12) + '…' : env.name)
          : 'Sin equipo',
        color: env?.color || C.gray,
        total, ...vals,
      };
    }).sort((a, b) => b.total - a.total);

    // ── Workload per person ──
    const personMap = {};
    filteredTasks.forEach(t => {
      if (!t.assigneeId) return;
      const uid = String(t.assigneeId);
      if (!personMap[uid]) personMap[uid] = { completed: 0, in_progress: 0, pending: 0, total: 0 };
      personMap[uid].total++;
      const cat = getTaskCat(t.status);
      if (cat === 'completed')   personMap[uid].completed++;
      else if (cat === 'in_progress') personMap[uid].in_progress++;
      else                            personMap[uid].pending++;
    });

    const workload = Object.entries(personMap)
      .map(([uid, data]) => {
        const u = userMap[uid];
        return { uid, name: u?.name || 'Usuario', avatar: u?.avatar || null, ...data };
      })
      .filter(p => p.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // ── Priority distribution ──
    const priorityDist = ['urgent', 'high', 'medium', 'low']
      .map(pri => ({
        name:  PRIORITY_CFG[pri].label,
        value: filteredTasks.filter(t => t.priority === pri).length,
        color: PRIORITY_CFG[pri].color,
      }))
      .filter(d => d.value > 0);

    // ── Risks ──
    const todayS = todayStr();
    const risks = filteredProjects
      .map(p => {
        const pTasks = filteredTasks.filter(t => t.projectId === p.id);
        if (!pTasks.length) return null;
        const overdue = pTasks.filter(t =>
          t.endDate && t.endDate.slice(0, 10) < todayS && t.status !== 'completed'
        ).length;
        const blocked = pTasks.filter(t => t.status === 'blocked').length;
        if (overdue === 0 && blocked === 0) return null;
        const compRate = Math.round(
          pTasks.filter(t => t.status === 'completed').length / pTasks.length * 100
        );
        const severity = overdue > 5 || blocked > 3 ? 'high'
          : overdue > 2  || blocked > 1 ? 'medium' : 'low';
        return { id: p.id, name: p.name, color: p.color, severity, overdue, blocked, completionRate: compRate };
      })
      .filter(Boolean)
      .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]))
      .slice(0, 6);

    const riskEnvIds = new Set(
      risks
        .map(r => filteredProjects.find(p => p.id === r.id)?.environmentId)
        .filter(Boolean)
    );
    const teamsAtRisk = riskEnvIds.size;

    return {
      totalProjects, completedProjects, completionRate,
      projCatValues, phaseCatValues, totalPhases: allPhases.length,
      taskCatValues, totalTasks: filteredTasks.length,
      projectsOverTime, byArea, workload,
      priorityDist, risks, teamsAtRisk,
    };
  }, [raw, applied, environments]);

  // ── Render helpers ─────────────────────────────────────────────────────────
  const selectedEnv  = environments.find(e => e.id === selectedEnvId);
  const visibleEnvs  = selectedEnvId === 'all' ? environments : environments.filter(e => e.id === selectedEnvId);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: C.slate500 }}>
        <div style={{ width: 22, height: 22, border: `2px solid ${C.slate200}`, borderTopColor: C.blue, borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        Cargando analítica…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px 20px', background: C.redLight, border: '1px solid #fecaca', borderRadius: 12, color: C.red, fontSize: 13 }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: C.slate900 }}>

      {/* ── TOOLBAR ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap',
        background: 'white', padding: '14px 16px', borderRadius: 12,
        border: '1px solid #e2e8f0', marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>

        {/* Team selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowEnvMenu(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 12px', fontFamily: 'inherit', cursor: 'pointer',
              background: selectedEnvId !== 'all' ? C.blueLight : 'white',
              border: `1px solid ${selectedEnvId !== 'all' ? C.blueMid : '#e2e8f0'}`,
              borderRadius: 8, fontSize: 12, fontWeight: 600,
              color: selectedEnvId !== 'all' ? C.blue : C.slate700,
            }}
          >
            <span style={{ fontSize: 14 }}>{selectedEnv ? (selectedEnv.icon || '📊') : '🌐'}</span>
            {selectedEnv ? selectedEnv.name : 'Todos los equipos'}
            <ChevronDown size={12} color={C.slate400} style={{ transform: showEnvMenu ? 'rotate(180deg)' : 'none', transition: '.2s', flexShrink: 0 }} />
          </button>

          {showEnvMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 89 }} onClick={() => setShowEnvMenu(false)} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 90,
                background: C.white, border: `1px solid ${C.slate200}`,
                borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                padding: 6, minWidth: 220, maxHeight: 280, overflowY: 'auto',
              }}>
                <button
                  onClick={() => { setSelectedEnvId('all'); setShowEnvMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: selectedEnvId === 'all' ? 700 : 500, background: selectedEnvId === 'all' ? C.blueLight : 'none', color: selectedEnvId === 'all' ? C.blue : C.slate700, display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span>🌐</span> Todos los equipos
                </button>
                {environments.length > 0 && <div style={{ height: 1, background: C.slate100, margin: '4px 0' }} />}
                {environments.map(env => (
                  <button
                    key={env.id}
                    onClick={() => { setSelectedEnvId(env.id); setShowEnvMenu(false); }}
                    style={{ width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: selectedEnvId === env.id ? 700 : 500, background: selectedEnvId === env.id ? C.blueLight : 'none', color: selectedEnvId === env.id ? C.blue : C.slate700, display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: env.color || C.blue, display: 'inline-block', flexShrink: 0 }} />
                    {env.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Date range */}
        <FF label="Ini.">
          <input type="date" value={filters.startDate} onChange={e => setF('startDate', e.target.value)} style={SEL} />
        </FF>
        <FF label="Fin">
          <input type="date" value={filters.endDate} onChange={e => setF('endDate', e.target.value)} style={SEL} />
        </FF>

        <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end' }}>
          <button onClick={() => setApplied({ ...filters })} style={{ ...BTN, background: '#1e293b', color: 'white' }}>
            <Filter size={13} /> Filtrar
          </button>
          <button onClick={() => { setFilters(def); setApplied(def); }} style={{ ...BTN, background: C.slate100, color: C.slate500 }}>
            <X size={13} /> Limpiar
          </button>
          <button onClick={doLoad} style={{ ...BTN, background: C.slate100, color: C.slate500 }}>
            <RefreshCw size={13} /> Actualizar
          </button>
        </div>
      </div>

      {/* ── OVERVIEW STRIP ──────────────────────────────────────────────────── */}
      <div style={{
        background: 'white', border: '1px solid #e2e8f0', borderRadius: 12,
        padding: '14px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%', display: 'inline-block',
              background: metrics.teamsAtRisk > 0 ? '#f59e0b' : '#10b981',
            }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: C.slate900 }}>
              {selectedEnv ? selectedEnv.name : 'Todos los equipos'}
            </span>
          </div>
          {metrics.teamsAtRisk > 0 && (
            <span style={{ fontSize: 12, color: '#92400e', background: '#fef3c7', padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>
              {metrics.teamsAtRisk} equipo{metrics.teamsAtRisk > 1 ? 's' : ''} requiere{metrics.teamsAtRisk === 1 ? '' : 'n'} atención
            </span>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {visibleEnvs.map(env => (
              <span key={env.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.slate500 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: env.color || C.blue, display: 'inline-block' }} />
                {env.name}
              </span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontSize: 24, fontWeight: 800,
            color: metrics.completionRate >= 70 ? '#059669' : metrics.completionRate >= 50 ? '#d97706' : '#dc2626',
          }}>
            {metrics.completionRate}%
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, color: C.slate400, marginLeft: 6 }}>tasa de completitud</span>
        </div>
      </div>

      {/* ── KPI CARDS ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <KpiStatusCard
          sublabel="PROYECTOS"
          total={metrics.totalProjects}
          cats={PROJ_CATS}
          catValues={metrics.projCatValues}
        />
        <KpiStatusCard
          sublabel="HITOS"
          total={metrics.totalPhases}
          cats={PROJ_CATS}
          catValues={metrics.phaseCatValues}
        />
        <KpiStatusCard
          sublabel="TAREAS"
          total={metrics.totalTasks}
          cats={TASK_CATS}
          catValues={metrics.taskCatValues}
        />
        <CompletionRateCard
          rate={metrics.completionRate}
          completed={metrics.completedProjects}
          total={metrics.totalProjects}
        />
      </div>

      {/* ── PROYECTOS EN EL TIEMPO + POR ÁREA ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Proyectos entregados por mes — LINE CHART */}
        <Card>
          <SectionLabel top="PROYECTOS EN EL TIEMPO" title="Proyectos entregados por mes" />
          <div style={{ padding: '16px 20px 20px' }}>
            {metrics.projectsOverTime.length === 0 || metrics.projectsOverTime.every(d => d.entregados === 0) ? (
              <div style={{ textAlign: 'center', color: C.slate400, fontSize: 13, padding: '36px 0' }}>
                Sin proyectos completados en el período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={metrics.projectsOverTime} margin={{ top: 26, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.slate100} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.slate400 }} axisLine={false} tickLine={false} interval={metrics.projectsOverTime.length > 12 ? Math.floor(metrics.projectsOverTime.length / 10) : 0} />
                  <YAxis tick={{ fontSize: 10, fill: C.slate400 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                  <RechartTooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone" dataKey="entregados" name="Entregados"
                    stroke="#059669" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#059669', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#059669' }}
                    label={<LineValueLabel />}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Proyectos por equipo — STACKED BAR */}
        <Card>
          <SectionLabel top="POR ÁREA" title="Proyectos por equipo" />
          <div style={{ padding: '16px 20px 20px' }}>
            {metrics.byArea.length === 0 ? (
              <div style={{ textAlign: 'center', color: C.slate400, fontSize: 13, padding: '36px 0' }}>Sin datos</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={metrics.byArea} margin={{ top: 26, right: 8, left: -10, bottom: 0 }} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.slate100} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.slate400 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: C.slate400 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                    <RechartTooltip content={<ChartTooltip />} />
                    <Bar dataKey="completed"   name="Entregados" stackId="a" fill="#059669" radius={[0,0,0,0]}>
                      <LabelList content={<SegmentLabel />} dataKey="completed" />
                    </Bar>
                    <Bar dataKey="in_progress" name="En curso"   stackId="a" fill="#2563eb" radius={[0,0,0,0]}>
                      <LabelList content={<SegmentLabel />} dataKey="in_progress" />
                    </Bar>
                    <Bar dataKey="backlog"     name="Backlog"    stackId="a" fill="#94a3b8" radius={[0,0,0,0]}>
                      <LabelList content={<SegmentLabel />} dataKey="backlog" />
                    </Bar>
                    <Bar dataKey="pending"     name="Pendientes" stackId="a" fill="#d97706" radius={[4,4,0,0]}>
                      <LabelList content={<SegmentLabel />} dataKey="pending" />
                      <LabelList content={<BarTotalLabel />} dataKey="total" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                  {[
                    { label: 'Entregados', color: '#059669' },
                    { label: 'En curso',   color: '#2563eb' },
                    { label: 'Backlog',    color: '#94a3b8' },
                    { label: 'Pendientes', color: '#d97706' },
                  ].map(({ label, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: C.slate500 }}>
                      <span style={{ width: 8, height: 8, background: color, borderRadius: 2, display: 'inline-block' }} />
                      {label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* ── CARGA DE TRABAJO ────────────────────────────────────────────────── */}
      {metrics.workload.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <SectionLabel top="CARGA DE TRABAJO" title="Tareas por persona" />
          <div style={{
            padding: '16px 20px 20px',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14,
          }}>
            {metrics.workload.map((p) => {
              const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
              const barColor = pct >= 80 ? '#059669' : pct >= 50 ? '#2563eb' : '#d97706';
              return (
                <div key={p.uid} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AvatarCell name={p.name} src={p.avatar} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.slate700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.slate900, flexShrink: 0, marginLeft: 8 }}>
                        {p.completed}/{p.total}
                      </span>
                    </div>
                    <div style={{ height: 5, background: C.slate100, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4, transition: 'width .4s' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                      <span style={{ fontSize: 10, color: '#059669' }}>✓ {p.completed}</span>
                      <span style={{ fontSize: 10, color: '#2563eb' }}>⟳ {p.in_progress}</span>
                      <span style={{ fontSize: 10, color: '#d97706' }}>○ {p.pending}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── PRIORIDAD + RIESGOS ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Priority distribution */}
        <Card>
          <SectionLabel top="CARGA DE TRABAJO" title="Distribución por prioridad" />
          <div style={{ padding: '16px 20px 20px' }}>
            {metrics.priorityDist.length === 0 ? (
              <div style={{ textAlign: 'center', color: C.slate400, fontSize: 13, padding: '32px 0' }}>Sin datos</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ flex: '0 0 130px', height: 130 }}>
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie
                        data={metrics.priorityDist}
                        cx="50%" cy="50%"
                        innerRadius={38} outerRadius={58}
                        paddingAngle={3} dataKey="value" strokeWidth={0}
                      >
                        {metrics.priorityDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <RechartTooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {metrics.priorityDist.map((item, i) => {
                    const tot = metrics.priorityDist.reduce((a, b) => a + b.value, 0);
                    const share = tot > 0 ? Math.round((item.value / tot) * 100) : 0;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, display: 'inline-block' }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.slate700 }}>{item.name}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.slate500 }}>
                            {item.value} <span style={{ color: C.slate400, fontWeight: 400 }}>({share}%)</span>
                          </span>
                        </div>
                        <div style={{ height: 4, background: C.slate100, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${share}%`, height: '100%', background: item.color, borderRadius: 4, transition: 'width .4s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Risks */}
        <Card>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.slate100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>ALERTAS</p>
              <h3 style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 700, color: C.slate900 }}>Riesgos potenciales</h3>
            </div>
            {metrics.risks.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: C.redLight, color: C.red, fontSize: 12, fontWeight: 700 }}>
                <AlertTriangle size={12} />
                {metrics.risks.length} proyecto{metrics.risks.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div style={{ padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
            {metrics.risks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: C.slate400 }}>
                <CheckCircle2 size={28} color="#bbf7d0" style={{ margin: '0 auto 8px', display: 'block' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: C.green }}>Sin riesgos detectados</div>
                <div style={{ fontSize: 11, marginTop: 2 }}>Todos los proyectos están saludables</div>
              </div>
            ) : metrics.risks.map((risk, i) => {
              const sv = SEVERITY_CFG[risk.severity];
              return (
                <div key={i} style={{ padding: '10px 14px', background: sv.bg, border: `1px solid ${sv.border}`, borderLeft: `3px solid ${sv.dot}`, borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: risk.color || sv.dot, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.slate900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {risk.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {risk.overdue > 0 && (
                          <span style={{ fontSize: 11, color: sv.text, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={10} /> {risk.overdue} vencida{risk.overdue > 1 ? 's' : ''}
                          </span>
                        )}
                        {risk.blocked > 0 && (
                          <span style={{ fontSize: 11, color: sv.text, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <AlertTriangle size={10} /> {risk.blocked} bloqueada{risk.blocked > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: sv.text, fontWeight: 700 }}>{risk.completionRate}%</div>
                      <div style={{ fontSize: 10, color: C.slate400 }}>completado</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, height: 3, background: sv.border, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${risk.completionRate}%`, height: '100%', background: sv.dot, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

    </div>
  );
}
