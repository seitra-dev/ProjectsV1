import { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus,
  AlertTriangle, Clock, CheckCircle2, Briefcase,
  ChevronDown, Activity, Target, Zap, ArrowUpRight, Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dbProjects, dbTasks } from '../lib/database';

// ─── Paleta ──────────────────────────────────────────────────────────────────
const C = {
  blue:    '#2563eb',
  blueLight: '#eff6ff',
  blueMid: '#bfdbfe',
  emerald: '#059669',
  amber:   '#d97706',
  red:     '#dc2626',
  redLight:'#fef2f2',
  slate50: '#f8fafc',
  slate100:'#f1f5f9',
  slate200:'#e2e8f0',
  slate400:'#94a3b8',
  slate500:'#64748b',
  slate700:'#334155',
  slate900:'#0f172a',
  white:   '#ffffff',
};

// ─── Ranges ──────────────────────────────────────────────────────────────────
const RANGES = [
  { id: '30d',  label: 'Últimos 30 días',  days: 30  },
  { id: '90d',  label: 'Últimos 90 días',  days: 90  },
  { id: '180d', label: 'Últimos 6 meses',  days: 180 },
  { id: 'year', label: 'Este año',          days: 365 },
];

// ─── Priority config ─────────────────────────────────────────────────────────
const PRIORITY_CFG = {
  urgent: { label: 'Urgente', color: '#dc2626', bg: '#fef2f2' },
  high:   { label: 'Alta',    color: '#f97316', bg: '#fff7ed' },
  medium: { label: 'Media',   color: '#eab308', bg: '#fefce8' },
  low:    { label: 'Baja',    color: '#22c55e', bg: '#f0fdf4' },
};

// ─── Sparkline SVG ────────────────────────────────────────────────────────────
function Sparkline({ data = [], color = C.blue, width = 72, height = 28 }) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* last dot */}
      <circle
        cx={parseFloat(pts[pts.length - 1].split(',')[0])}
        cy={parseFloat(pts[pts.length - 1].split(',')[1])}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

// ─── Trend badge ─────────────────────────────────────────────────────────────
function TrendBadge({ value, inverse = false }) {
  if (value === null || value === undefined) return null;
  const pos = inverse ? value < 0 : value > 0;
  const neg = inverse ? value > 0 : value < 0;
  const color = pos ? C.emerald : neg ? C.red : C.slate400;
  const Icon  = pos ? TrendingUp : neg ? TrendingDown : Minus;
  const abs   = Math.abs(value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, color, fontSize: 11, fontWeight: 700 }}>
      <Icon size={11} />
      {abs > 0 ? `${abs > 999 ? '+∞' : (value > 0 ? '+' : '')}${value}%` : '—'}
    </div>
  );
}

// ─── Tooltip personalizado ────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.slate200}`,
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {label && <p style={{ margin: '0 0 5px', fontWeight: 700, color: C.slate900, fontSize: 11 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.fill || p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Card shell ───────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.white,
      border: `1px solid ${C.slate200}`,
      borderRadius: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ padding: '18px 22px 0' }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {subtitle}
      </p>
      <h3 style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: C.slate900 }}>
        {title}
      </h3>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const daysSince = (date) => {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
};

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

const trend = (curr, prev) => {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
};

// Genera un array de "semanas" pasadas con recuentos de tareas completadas
const buildSparkWeeks = (tasks, weeks = 8) => {
  const now = Date.now();
  return Array.from({ length: weeks }, (_, i) => {
    const end = now - i * 7 * 86_400_000;
    const start = end - 7 * 86_400_000;
    return tasks.filter(t => {
      if (t.status !== 'completed' && t.status !== 'done') return false;
      const ts = t.updatedAt ? new Date(t.updatedAt).getTime() : 0;
      return ts >= start && ts < end;
    }).length;
  }).reverse();
};

// ─── Data loader ──────────────────────────────────────────────────────────────
async function loadAnalyticsData(environments) {
  const allProjects = [];
  const allTasks    = [];

  await Promise.all(environments.map(async (env) => {
    const projs = await dbProjects.getByEnvironment(env.id).catch(() => []);
    const taskArrays = await Promise.all(
      projs.map(p => dbTasks.getByProject(p.id).catch(() => []))
    );
    allProjects.push(...projs);
    allTasks.push(...taskArrays.flat());
  }));

  return { allProjects, allTasks };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AnalyticsGeneralView() {
  const { environments } = useApp();

  const [rangeId, setRangeId] = useState('30d');
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const [raw, setRaw] = useState({ allProjects: [], allTasks: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const range = RANGES.find(r => r.id === rangeId) || RANGES[0];

  // Cargar datos una sola vez
  useEffect(() => {
    if (!environments.length) { setLoading(false); return; }
    setLoading(true);
    loadAnalyticsData(environments)
      .then(data => { setRaw(data); setError(null); })
      .catch(e => setError(e.message || 'Error'))
      .finally(() => setLoading(false));
  }, [environments]);

  // ── Métricas derivadas ────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const { allProjects, allTasks } = raw;
    const now = Date.now();
    const ms  = range.days * 86_400_000;
    const cutCurr = now - ms;
    const cutPrev = cutCurr - ms;

    const inPeriod = (t, from, to) => {
      const ts = new Date(t.createdAt || t.updatedAt || 0).getTime();
      return ts >= from && ts < to;
    };

    const currTasks = allTasks.filter(t => inPeriod(t, cutCurr, now));
    const prevTasks = allTasks.filter(t => inPeriod(t, cutPrev, cutCurr));

    const currCompleted = currTasks.filter(t => t.status === 'completed' || t.status === 'done').length;
    const prevCompleted = prevTasks.filter(t => t.status === 'completed' || t.status === 'done').length;

    const today = new Date().toISOString().split('T')[0];
    const overdueCurr = currTasks.filter(t => t.endDate && t.endDate < today && t.status !== 'completed' && t.status !== 'done').length;
    const overduePrev = prevTasks.filter(t => t.endDate && t.endDate < today && t.status !== 'completed' && t.status !== 'done').length;

    // Lead time: días entre startDate y updatedAt para tareas completadas en el período
    const closedWithDates = currTasks.filter(t =>
      (t.status === 'completed' || t.status === 'done') &&
      t.startDate && t.updatedAt
    );
    const leadTimes = closedWithDates.map(t =>
      Math.max(0, Math.floor((new Date(t.updatedAt) - new Date(t.startDate)) / 86_400_000))
    );
    const avgLeadTime = leadTimes.length
      ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length)
      : null;

    // Distribución por prioridad (en el período)
    const priorityDist = ['urgent', 'high', 'medium', 'low'].map(p => ({
      name: PRIORITY_CFG[p]?.label ?? p,
      value: currTasks.filter(t => t.priority === p).length,
      color: PRIORITY_CFG[p]?.color ?? '#94a3b8',
    })).filter(d => d.value > 0);

    // Distribución por estado (en el período)
    const statusDist = [
      { key: 'completed', label: 'Completado', color: '#059669' },
      { key: 'in_progress', label: 'En curso',  color: '#2563eb' },
      { key: 'pending',    label: 'Pendiente', color: '#eab308' },
      { key: 'blocked',   label: 'Bloqueado', color: '#dc2626' },
    ].map(s => ({
      ...s,
      value: currTasks.filter(t => t.status === s.key || (s.key === 'completed' && t.status === 'done')).length,
    })).filter(d => d.value > 0);

    // Sparklines: adaptar semanas al rango seleccionado
    const numWeeks = Math.min(Math.ceil(range.days / 7), 13);
    const sparkCompleted = buildSparkWeeks(allTasks, numWeeks);
    const sparkOverdue   = buildSparkWeeks(
      allTasks.filter(t => t.endDate && t.endDate < today), numWeeks
    );

    // Proyectos activos
    const activeProjects = allProjects.filter(p =>
      ['active', 'in_progress', 'pending', 'backlog'].includes(p.status)
    );
    const prevActiveProjects = allProjects.filter(p =>
      ['active', 'in_progress', 'pending', 'backlog'].includes(p.status)
    ); // sin datos históricos → mismos

    // Lead time por proyecto (top 6, tareas del período)
    const leadByProject = allProjects
      .map(p => {
        const pTasks = closedWithDates.filter(t => t.projectId === p.id);
        if (!pTasks.length) return null;
        const avg = Math.round(
          pTasks.map(t => Math.max(0, Math.floor((new Date(t.updatedAt) - new Date(t.startDate)) / 86_400_000)))
            .reduce((a, b) => a + b, 0) / pTasks.length
        );
        return { name: p.name.length > 20 ? p.name.slice(0, 18) + '…' : p.name, days: avg, color: p.color || C.blue };
      })
      .filter(Boolean)
      .sort((a, b) => b.days - a.days)
      .slice(0, 6);

    // Riesgos (tareas del período)
    const risks = allProjects
      .map(p => {
        const pTasks = currTasks.filter(t => t.projectId === p.id);
        if (!pTasks.length) return null;

        const overdue = pTasks.filter(t =>
          t.endDate && t.endDate < today && t.status !== 'completed' && t.status !== 'done'
        ).length;
        const blocked = pTasks.filter(t => t.status === 'blocked').length;
        const totalActive = pTasks.filter(t => t.status !== 'completed' && t.status !== 'done').length;
        const completionRate = pct(pTasks.filter(t => t.status === 'completed' || t.status === 'done').length, pTasks.length);

        const severity =
          overdue > 5 || blocked > 3 ? 'high'
          : overdue > 2 || blocked > 1 ? 'medium'
          : overdue > 0 || blocked > 0 ? 'low'
          : null;

        if (!severity) return null;
        return { id: p.id, name: p.name, color: p.color, severity, overdue, blocked, totalActive, completionRate };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const ord = { high: 0, medium: 1, low: 2 };
        return ord[a.severity] - ord[b.severity];
      })
      .slice(0, 6);

    return {
      // KPIs
      totalProjects:    allProjects.length,
      activeProjects:   activeProjects.length,
      totalTasks:       allTasks.length,
      currTasksTotal:   currTasks.length,
      completedTasks:   allTasks.filter(t => t.status === 'completed' || t.status === 'done').length,
      overdueTotal:     overdueCurr,
      currCompleted, prevCompleted,
      overdueCurr, overduePrev,
      completionRate:   pct(currCompleted, currTasks.length || 1),
      prevRate:         pct(prevCompleted, prevTasks.length || 1),
      avgLeadTime,
      // Charts
      priorityDist,
      statusDist,
      leadByProject,
      sparkCompleted,
      sparkOverdue,
      // Risks
      risks,
    };
  }, [raw, range]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: C.slate500 }}>
        <div style={{
          width: 24, height: 24, border: `2px solid ${C.slate200}`, borderTopColor: C.blue,
          borderRadius: '50%', animation: 'spin .8s linear infinite',
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        Cargando analítica…
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: '16px 20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, color: C.red, fontSize: 13 }}>
        {error}
      </div>
    );
  }

  const trendCompleted = trend(metrics.currCompleted, metrics.prevCompleted);
  const trendOverdue   = trend(metrics.overdueCurr, metrics.overduePrev);
  const trendRate      = metrics.completionRate - metrics.prevRate;

  const SEVERITY = {
    high:   { label: 'Alto riesgo',  bg: '#fef2f2', border: '#fecaca', dot: '#dc2626', text: C.red },
    medium: { label: 'Riesgo medio', bg: '#fffbeb', border: '#fde68a', dot: '#d97706', text: '#92400e' },
    low:    { label: 'Bajo riesgo',  bg: '#f0fdf4', border: '#bbf7d0', dot: '#059669', text: '#065f46' },
  };

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: C.slate900 }}>

      {/* ── TOOLBAR ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowRangeMenu(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', background: C.white,
              border: `1px solid ${C.slate200}`, borderRadius: 10,
              cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.slate700,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <Calendar size={14} color={C.blue} />
            {range.label}
            <ChevronDown size={13} color={C.slate400} style={{ transform: showRangeMenu ? 'rotate(180deg)' : 'none', transition: '.2s' }} />
          </button>
          {showRangeMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 89 }} onClick={() => setShowRangeMenu(false)} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: C.white, border: `1px solid ${C.slate200}`,
                borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                padding: 6, minWidth: 190, zIndex: 90,
              }}>
                {RANGES.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setRangeId(r.id); setShowRangeMenu(false); }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '9px 12px',
                      border: 'none', borderRadius: 8, cursor: 'pointer',
                      fontSize: 13, fontWeight: rangeId === r.id ? 700 : 500,
                      background: rangeId === r.id ? C.blueLight : 'none',
                      color: rangeId === r.id ? C.blue : C.slate700,
                    }}
                    onMouseEnter={e => { if (rangeId !== r.id) e.currentTarget.style.background = C.slate50; }}
                    onMouseLeave={e => { if (rangeId !== r.id) e.currentTarget.style.background = 'none'; }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── KPI CARDS ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>

        {/* Proyectos activos */}
        <Card>
          <div style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={18} color={C.blue} />
              </div>
              <Sparkline data={[3,4,4,5,metrics.activeProjects-1,metrics.activeProjects]} color={C.blue} />
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.slate900, lineHeight: 1 }}>
                {metrics.activeProjects}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.slate500, marginTop: 4 }}>
                Proyectos activos
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: C.slate400 }}>de {metrics.totalProjects} totales</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Tareas completadas */}
        <Card>
          <div style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={18} color={C.emerald} />
              </div>
              <Sparkline data={metrics.sparkCompleted} color={C.emerald} />
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.slate900, lineHeight: 1 }}>
                {metrics.currCompleted}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.slate500, marginTop: 4 }}>
                Completadas en el período
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendBadge value={trendCompleted} />
                <span style={{ fontSize: 11, color: C.slate400 }}>vs período anterior</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Tasa de completitud */}
        <Card>
          <div style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={18} color={C.blue} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                {/* mini donut estático */}
                <svg width={32} height={32} viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke={C.slate100} strokeWidth="4" />
                  <circle cx="16" cy="16" r="12" fill="none" stroke={C.blue}
                    strokeWidth="4" strokeDasharray={`${(metrics.completionRate / 100) * 75.4} 75.4`}
                    strokeLinecap="round" transform="rotate(-90 16 16)" />
                </svg>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.slate900, lineHeight: 1 }}>
                {metrics.completionRate}<span style={{ fontSize: 18, fontWeight: 600, color: C.slate400 }}>%</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.slate500, marginTop: 4 }}>
                Tasa de completitud
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendBadge value={trendRate} />
                <span style={{ fontSize: 11, color: C.slate400 }}>vs período anterior</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Tareas vencidas */}
        <Card>
          <div style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: C.redLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={18} color={C.red} />
              </div>
              <Sparkline data={metrics.sparkOverdue} color={C.red} />
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.slate900, lineHeight: 1 }}>
                {metrics.overdueTotal}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.slate500, marginTop: 4 }}>
                Tareas vencidas
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendBadge value={trendOverdue} inverse />
                <span style={{ fontSize: 11, color: C.slate400 }}>vs período anterior</span>
              </div>
            </div>
          </div>
        </Card>

      </div>

      {/* ── FILA CENTRAL ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Distribución por prioridad */}
        <Card>
          <SectionHeader title="Distribución por prioridad" subtitle="Carga de trabajo" />
          <div style={{ padding: '16px 22px 20px' }}>
            {metrics.priorityDist.length === 0 ? (
              <div style={{ textAlign: 'center', color: C.slate400, fontSize: 13, padding: '32px 0' }}>Sin datos</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ flex: '0 0 140px', height: 140 }}>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={metrics.priorityDist}
                        cx="50%" cy="50%"
                        innerRadius={42} outerRadius={62}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {metrics.priorityDist.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {metrics.priorityDist.map((item, i) => {
                    const total = metrics.priorityDist.reduce((a, b) => a + b.value, 0);
                    const share = pct(item.value, total);
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, display: 'inline-block' }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.slate700 }}>{item.name}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.slate500 }}>{item.value} <span style={{ color: C.slate400, fontWeight: 400 }}>({share}%)</span></span>
                        </div>
                        <div style={{ height: 4, background: C.slate100, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${share}%`, height: '100%', background: item.color, borderRadius: 4, transition: 'width .4s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Distribución por estado */}
        <Card>
          <SectionHeader title="Estado de tareas" subtitle="Visión general" />
          <div style={{ padding: '16px 22px 20px' }}>
            {metrics.statusDist.length === 0 ? (
              <div style={{ textAlign: 'center', color: C.slate400, fontSize: 13, padding: '32px 0' }}>Sin datos</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {metrics.statusDist.map((s, i) => {
                  const total = metrics.currTasksTotal || 1;
                  const share = pct(s.value, total);
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 20, height: 20, borderRadius: 6, background: `${s.color}18`,
                          }}>
                            <span style={{ width: 7, height: 7, borderRadius: 2, background: s.color, display: 'block' }} />
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.slate700 }}>{s.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: C.slate400 }}>{share}%</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.slate900, minWidth: 28, textAlign: 'right' }}>{s.value}</span>
                        </div>
                      </div>
                      <div style={{ height: 6, background: C.slate100, borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${share}%`, height: '100%', background: s.color, borderRadius: 6, transition: 'width .4s ease' }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 8, paddingTop: 12, borderTop: `1px solid ${C.slate100}`, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: C.slate400 }}>Tareas en el período</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: C.slate900 }}>{metrics.currTasksTotal}</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── LEAD TIME + RIESGOS ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Lead time por proyecto */}
        <Card>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.slate100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Velocidad</p>
              <h3 style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: C.slate900 }}>Lead Time promedio</h3>
            </div>
            {metrics.avgLeadTime !== null && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.blue, lineHeight: 1 }}>
                  {metrics.avgLeadTime}
                </div>
                <div style={{ fontSize: 11, color: C.slate400, fontWeight: 600 }}>días promedio</div>
              </div>
            )}
          </div>
          <div style={{ padding: '16px 22px 20px' }}>
            {metrics.leadByProject.length === 0 ? (
              <div style={{ textAlign: 'center', color: C.slate400, fontSize: 13, padding: '24px 0' }}>
                <Clock size={28} color={C.slate200} style={{ margin: '0 auto 8px', display: 'block' }} />
                Sin suficientes datos de fechas
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={metrics.leadByProject.length * 38 + 20}>
                <BarChart
                  data={metrics.leadByProject}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                  barSize={14}
                >
                  <CartesianGrid strokeDasharray="2 4" stroke={C.slate100} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: C.slate400 }} unit="d" axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: C.slate500, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: C.slate50 }} />
                  <Bar dataKey="days" name="Días" radius={[0, 6, 6, 0]}>
                    {metrics.leadByProject.map((entry, i) => (
                      <Cell key={i} fill={entry.color || C.blue} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Riesgos potenciales */}
        <Card>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.slate100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Alertas</p>
              <h3 style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 700, color: C.slate900 }}>Riesgos potenciales</h3>
            </div>
            {metrics.risks.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 20,
                background: C.redLight, color: C.red,
                fontSize: 12, fontWeight: 700,
              }}>
                <AlertTriangle size={12} />
                {metrics.risks.length} proyecto{metrics.risks.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
          <div style={{ padding: '12px 22px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {metrics.risks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: C.slate400 }}>
                <CheckCircle2 size={28} color="#bbf7d0" style={{ margin: '0 auto 8px', display: 'block' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: C.emerald }}>Sin riesgos detectados</div>
                <div style={{ fontSize: 11, marginTop: 2 }}>Todos los proyectos están saludables</div>
              </div>
            ) : metrics.risks.map((risk, i) => {
              const sv = SEVERITY[risk.severity];
              return (
                <div key={i} style={{
                  padding: '10px 14px',
                  background: sv.bg,
                  border: `1px solid ${sv.border}`,
                  borderLeft: `3px solid ${sv.dot}`,
                  borderRadius: 10,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: risk.color || sv.dot, flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.slate900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {risk.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {risk.overdue > 0 && (
                          <span style={{ fontSize: 11, color: sv.text, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Clock size={10} />
                            {risk.overdue} vencida{risk.overdue > 1 ? 's' : ''}
                          </span>
                        )}
                        {risk.blocked > 0 && (
                          <span style={{ fontSize: 11, color: sv.text, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <AlertTriangle size={10} />
                            {risk.blocked} bloqueada{risk.blocked > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: sv.text, fontWeight: 700 }}>{risk.completionRate}%</div>
                      <div style={{ fontSize: 10, color: C.slate400 }}>completado</div>
                    </div>
                  </div>
                  {/* Mini progress */}
                  <div style={{ marginTop: 8, height: 3, background: `${sv.border}`, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${risk.completionRate}%`, height: '100%', background: sv.dot, borderRadius: 3, transition: 'width .4s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── ACTIVIDAD SEMANAL ─────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 8 }}>
        <SectionHeader title="Tareas completadas por semana" subtitle="Tendencia de actividad" />
        <div style={{ padding: '16px 22px 20px' }}>
          {metrics.sparkCompleted.every(v => v === 0) ? (
            <div style={{ textAlign: 'center', color: C.slate400, fontSize: 13, padding: '20px 0' }}>
              <Activity size={24} color={C.slate200} style={{ display: 'block', margin: '0 auto 8px' }} />
              Sin actividad registrada en el período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart
                data={metrics.sparkCompleted.map((v, i) => ({
                  semana: `S${i + 1}`,
                  completadas: v,
                }))}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                barSize={28}
              >
                <CartesianGrid strokeDasharray="2 4" stroke={C.slate100} vertical={false} />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fill: C.slate400 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: C.slate400 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: C.slate50 }} />
                <Bar dataKey="completadas" name="Completadas" fill={C.blue} radius={[5, 5, 0, 0]}>
                  {metrics.sparkCompleted.map((v, i) => (
                    <Cell key={i} fill={
                      i === metrics.sparkCompleted.length - 1 ? C.blue
                        : `${C.blue}70`
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

    </div>
  );
}
