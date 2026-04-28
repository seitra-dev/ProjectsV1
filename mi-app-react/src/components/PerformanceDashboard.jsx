import React, { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, Tooltip as RechartTooltip,
  BarChart, Bar, Cell,
  LineChart, Line, CartesianGrid, ReferenceLine, ResponsiveContainer, YAxis,
} from 'recharts';
import {
  TrendingUp, Filter, X, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dbKpiThresholds, dbPerformance } from '../lib/database';
import { getGlobalMetrics, computeAreaKpisFromData } from './metrics';

// ─── Constantes ───────────────────────────────────────────────────────────────

const PERSON_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
];

const TALLAJE_COLORS = ['#c7d2fe', '#818cf8', '#4f46e5', '#312e81'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getIsoWeekKey = (dateStr) => {
  const d = new Date((typeof dateStr === 'string' ? dateStr : new Date(dateStr).toISOString()).slice(0, 10));
  const thu = new Date(d);
  thu.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const year = thu.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const w = 1 + Math.round((thu - jan4) / (7 * 24 * 3600 * 1000));
  return `${year}-W${String(w).padStart(2, '0')}`;
};

const getWeekLabel = (weekKey) => {
  const [yr, wStr] = weekKey.split('-');
  const w = parseInt(wStr.slice(1), 10);
  const jan4 = new Date(parseInt(yr, 10), 0, 4);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (w - 1) * 7);
  return `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')}`;
};

const getLast8Weeks = () => {
  const now = new Date();
  const seen = new Set();
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const k = getIsoWeekKey(d.toISOString().slice(0, 10));
    if (!seen.has(k)) { seen.add(k); weeks.push(k); }
  }
  return weeks;
};

const aggregateTrendWeekly = (items) => {
  if (!items?.length) return [];
  const map = {};
  items.forEach(({ t }) => {
    const key = getIsoWeekKey(t);
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-13)
    .map(([key, v]) => ({ t: key, v, label: getWeekLabel(key) }));
};

const weeksInPeriod = (startDate, endDate) => {
  const s = new Date(startDate || firstOfYear());
  const e = new Date(endDate   || today());
  return Math.max(1, Math.ceil((e - s) / (7 * 24 * 3600 * 1000)));
};

const today      = () => new Date().toISOString().slice(0, 10);
const firstOfYear = () => `${new Date().getFullYear()}-01-01`;

// ─── Micro componentes ────────────────────────────────────────────────────────

const SHIMMER_STYLE = `
  @keyframes pd-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  .pd-skel {
    background: linear-gradient(90deg, #f1f5f9 25%, #e8edf3 50%, #f1f5f9 75%);
    background-size: 800px 100%;
    animation: pd-shimmer 1.5s infinite linear;
    border-radius: 4px;
  }
`;

const KpiBadge = ({ pct }) => {
  if (pct == null) return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;
  const cfg = pct >= 100
    ? { label: 'En Tiempo', bg: '#dcfce7', color: '#15803d' }
    : pct >= 85
      ? { label: 'Leve',     bg: '#d1fae5', color: '#065f46' }
      : pct >= 70
        ? { label: 'Moderado', bg: '#fef3c7', color: '#92400e' }
        : { label: 'Crítico',  bg: '#fee2e2', color: '#b91c1c' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{pct}%</span>
      <span style={{
        padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 500,
        background: cfg.bg, color: cfg.color,
      }}>{cfg.label}</span>
    </div>
  );
};

const Avatar = ({ name, src, size = 30 }) => {
  if (src) {
    return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316'];
  const bg = colors[(name || '').charCodeAt(0) % colors.length] || '#6366f1';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: 'white', flexShrink: 0 }}>
      {initials}
    </div>
  );
};

const SizingChart = ({ dist }) => {
  if (!dist) return <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>;
  const data = [
    { name: 'XS', v: dist.xs },
    { name: 'S',  v: dist.s  },
    { name: 'M',  v: dist.m  },
    { name: 'L',  v: dist.l  },
  ];
  if (data.reduce((s, d) => s + d.v, 0) === 0) return <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>;
  return (
    <BarChart width={72} height={46} data={data} margin={{ top: 2, right: 0, bottom: 14, left: 0 }}>
      <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
      <RechartTooltip contentStyle={{ fontSize: 10, padding: '2px 8px', borderRadius: 6 }} formatter={(v, n) => [v, n]} />
      <Bar dataKey="v" radius={[2, 2, 0, 0]}>
        {data.map((_, i) => <Cell key={i} fill={TALLAJE_COLORS[i]} />)}
      </Bar>
    </BarChart>
  );
};

const Sparkline = ({ data, color = '#6366f1' }) => {
  if (!data?.length) return <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>;
  const gradId = `sg${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <AreaChart width={144} height={46} data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
      <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gradId})`}
        dot={data.length <= 6 ? { r: 2, fill: color, strokeWidth: 0 } : false}
        activeDot={{ r: 3, fill: color }}
      />
      <RechartTooltip contentStyle={{ fontSize: 10, padding: '2px 8px', borderRadius: 6 }}
        formatter={(v) => [v, 'Cerradas']} labelFormatter={(l) => `Sem. ${l}`} />
    </AreaChart>
  );
};

// ─── Gráfico de líneas semanal ────────────────────────────────────────────────

const WeeklyChart = ({ rows, capacities, chartPerson, setChartPerson }) => {
  const last8 = useMemo(() => getLast8Weeks(), []);

  const visibleRows = useMemo(() =>
    chartPerson === 'all' ? rows : rows.filter(r => String(r.assignee_id) === chartPerson),
  [rows, chartPerson]);

  const chartData = useMemo(() =>
    last8.map(wk => {
      const point = { week: getWeekLabel(wk) };
      visibleRows.forEach(r => {
        point[r.assignee_name] = (r.trend_data || []).filter(({ t }) => getIsoWeekKey(t) === wk).length;
      });
      return point;
    }),
  [last8, visibleRows]);

  const selectedRow = chartPerson !== 'all' ? visibleRows[0] : null;
  const refCap      = selectedRow ? (capacities[String(selectedRow.assignee_id)] || null) : null;

  if (!rows.length) return null;

  return (
    <div style={{
      background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
      padding: '20px 24px', marginTop: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Completadas por semana</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Últimas 8 semanas</div>
        </div>
        <select
          value={chartPerson}
          onChange={e => setChartPerson(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#334155', background: 'white', cursor: 'pointer', outline: 'none' }}
        >
          <option value="all">Todas las personas</option>
          {rows.map(r => <option key={r.assignee_id} value={String(r.assignee_id)}>{r.assignee_name}</option>)}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 8, right: 32, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
          <RechartTooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          />
          {visibleRows.map((r, i) => (
            <Line
              key={r.assignee_id}
              type="monotone"
              dataKey={r.assignee_name}
              stroke={PERSON_COLORS[i % PERSON_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3, fill: PERSON_COLORS[i % PERSON_COLORS.length], strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          ))}
          {refCap && (
            <ReferenceLine
              y={refCap}
              stroke="#94a3b8"
              strokeDasharray="4 2"
              label={{ value: `Cap. ${refCap}`, position: 'insideTopRight', fontSize: 10, fill: '#94a3b8', dy: -6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {refCap && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 11, color: '#94a3b8' }}>
          <div style={{ width: 20, borderTop: '2px dashed #94a3b8' }} />
          Capacity configurada: {refCap} tareas/sem
        </div>
      )}
    </div>
  );
};

// ─── Celdas de tabla ──────────────────────────────────────────────────────────

const TH = ({ children, width, align = 'left' }) => (
  <th style={{
    padding: '10px 14px', textAlign: align, fontWeight: 600, fontSize: 11,
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '1px solid #e2e8f0', background: '#f8fafc',
    whiteSpace: 'nowrap', width,
  }}>
    {children}
  </th>
);

const TD = ({ children, style }) => (
  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle', ...style }}>
    {children}
  </td>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <tr style={{ background: 'white' }}>
    <TD>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="pd-skel" style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0 }} />
        <div>
          <div className="pd-skel" style={{ height: 11, width: 100, marginBottom: 5 }} />
          <div className="pd-skel" style={{ height: 9, width: 64 }} />
        </div>
      </div>
    </TD>
    <TD style={{ textAlign: 'center' }}><div className="pd-skel" style={{ height: 14, width: 24, margin: '0 auto' }} /></TD>
    <TD><div className="pd-skel" style={{ width: 72, height: 46, borderRadius: 4 }} /></TD>
    <TD><div className="pd-skel" style={{ width: 144, height: 46, borderRadius: 4 }} /></TD>
    <TD><div className="pd-skel" style={{ width: 100, height: 22, borderRadius: 999 }} /></TD>
    <TD><div className="pd-skel" style={{ width: 60, height: 30, borderRadius: 4 }} /></TD>
  </tr>
);

// ─── Fila de persona ──────────────────────────────────────────────────────────

const PersonRow = ({ row, applied, capacities, color }) => {
  const trend   = useMemo(() => aggregateTrendWeekly(row.trend_data), [row.trend_data]);
  const capTarget = capacities[String(row.assignee_id)] || null;
  const weeks     = weeksInPeriod(applied.startDate, applied.endDate);
  const capReal   = row.total_closed > 0 ? Math.round((row.total_closed / weeks) * 10) / 10 : 0;

  return (
    <tr style={{ background: 'white' }}>
      <TD style={{ maxWidth: 240 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Avatar name={row.assignee_name} src={row.avatar} size={30} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.assignee_name}
            </div>
            {row.frente && (
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{row.frente}</div>
            )}
          </div>
        </div>
      </TD>

      <TD style={{ textAlign: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{row.total_closed}</span>
        {row.late_count > 0 && (
          <div style={{ fontSize: 10, color: '#f97316', marginTop: 1 }}>
            {row.late_count} tarde{row.late_count !== 1 ? 's' : ''}
          </div>
        )}
      </TD>

      <TD><SizingChart dist={row.size_dist} /></TD>
      <TD><Sparkline data={trend} color={color} /></TD>
      <TD><KpiBadge pct={row.kpi_pct} /></TD>

      <TD style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
          {capReal}
          <span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8', marginLeft: 2 }}>/sem</span>
        </div>
        {capTarget && (
          <div style={{ fontSize: 10, marginTop: 2, color: capReal >= capTarget ? '#16a34a' : '#f97316' }}>
            meta {capTarget}
          </div>
        )}
      </TD>
    </tr>
  );
};

// ─── Estilos compartidos ──────────────────────────────────────────────────────

const SEL = {
  padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8,
  fontSize: 12, fontFamily: 'inherit', color: '#334155',
  background: 'white', cursor: 'pointer', outline: 'none',
};

const BTN_BASE = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '7px 14px', border: 'none', borderRadius: 8,
  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};

const FilterField = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </label>
    {children}
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PerformanceDashboard() {
  const { currentUser, currentWorkspace } = useApp();

  const canAccess = ['admin', 'super_admin'].includes(currentUser?.role);

  const defaultFilters = { frente: '', startDate: firstOfYear(), endDate: today() };
  const [filters,    setFilters]    = useState(defaultFilters);
  const [applied,    setApplied]    = useState(defaultFilters);
  const [rows,       setRows]       = useState([]);
  const [frenteOpts, setFrenteOpts] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [chartPerson, setChartPerson] = useState('all');

  const [areaKpis,    setAreaKpis]    = useState(null);
  const [kpisLoading, setKpisLoading] = useState(true);

  const capacities = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('seitra_capacities') || '{}'); }
    catch { return {}; }
  }, []);

  const loadAll = async () => {
    if (!canAccess) return;
    setLoading(true);
    setError('');
    try {
      const wsId = currentWorkspace?.id || null;
      const [metricsRows, frentes] = await Promise.all([
        dbPerformance.getMetrics({
          workspaceId: wsId,
          frente:      applied.frente    || null,
          startDate:   applied.startDate || null,
          endDate:     applied.endDate   || null,
        }),
        dbPerformance.getFrenteOptions(wsId),
      ]);
      setRows(metricsRows);
      setFrenteOpts(frentes);
    } catch (e) {
      console.error('[PerformanceDashboard]', e);
      setError(e.message || 'Error cargando métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [applied, currentWorkspace?.id]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setKpisLoading(true);
      try {
        const base = await getGlobalMetrics(currentUser?.id, currentUser?.system_role);
        if (!cancelled) setAreaKpis(computeAreaKpisFromData(base.projects || [], base.tasks || []));
      } catch (e) {
        console.error('[PerformanceDashboard] KPIs error:', e);
      } finally {
        if (!cancelled) setKpisLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  const handleApply = () => setApplied({ ...filters });
  const handleClear = () => { setFilters(defaultFilters); setApplied(defaultFilters); };
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  if (!canAccess) return null;

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'inherit', maxWidth: 1400, margin: '0 auto' }}>
      <style>{SHIMMER_STYLE}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={20} color="#6366f1" />
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
              Desempeño por Colaborador
            </h2>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
              {currentWorkspace?.name
                ? `Workspace: ${currentWorkspace.name} · `
                : ''}{rows.length} colaborador{rows.length !== 1 ? 'es' : ''} · {applied.startDate} → {applied.endDate}
            </div>
          </div>
        </div>
        <button onClick={loadAll} style={{ ...BTN_BASE, background: '#f1f5f9', color: '#64748b' }}>
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {/* ── KPIs del área ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Progreso del área</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: 6 }}>
            {kpisLoading ? '—' : `${areaKpis?.weightedProgress ?? 0}%`}
          </div>
          <div style={{ height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${kpisLoading ? 0 : Math.min(100, areaKpis?.weightedProgress ?? 0)}%`, background: '#6366f1', borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>
            {kpisLoading ? '' : `${areaKpis?.activeProjectsCount ?? 0} proyecto${areaKpis?.activeProjectsCount !== 1 ? 's' : ''} activo${areaKpis?.activeProjectsCount !== 1 ? 's' : ''}`}
          </div>
        </div>

        {(() => {
          const v = areaKpis?.weeklyVelocity;
          const icon  = !v ? '→' : v.trend === 'up' ? '↑' : v.trend === 'down' ? '↓' : '→';
          const color = !v ? '#94a3b8' : v.trend === 'up' ? '#16a34a' : v.trend === 'down' ? '#dc2626' : '#64748b';
          return (
            <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Velocidad semanal</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{kpisLoading ? '—' : (v?.current ?? 0)}</span>
                {!kpisLoading && <span style={{ fontSize: 20, fontWeight: 800, color }}>{icon}</span>}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>
                {kpisLoading ? '' : `Esta semana · anterior: ${v?.previous ?? 0}`}
              </div>
            </div>
          );
        })()}

        <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Cumplimiento de fechas</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, marginBottom: 4, color: kpisLoading ? '#94a3b8' : (areaKpis?.onTimeRate == null ? '#94a3b8' : areaKpis.onTimeRate >= 70 ? '#16a34a' : areaKpis.onTimeRate >= 50 ? '#f59e0b' : '#dc2626') }}>
            {kpisLoading ? '—' : (areaKpis?.onTimeRate == null ? '—' : `${areaKpis.onTimeRate}%`)}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            {kpisLoading ? '' : (areaKpis?.onTimeRate == null ? 'Sin datos suficientes' : 'A tiempo · últimos 30 días')}
          </div>
        </div>

        {(() => {
          const blocked  = areaKpis?.blockedActive ?? 0;
          const hasAlert = !kpisLoading && blocked > 0;
          return (
            <div style={{ background: hasAlert ? '#fff7ed' : 'white', borderRadius: 12, padding: '16px 20px', border: `1px solid ${hasAlert ? '#fed7aa' : '#f1f5f9'}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'background 0.3s' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: hasAlert ? '#c2410c' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Tareas bloqueadas</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: hasAlert ? '#ea580c' : '#0f172a', lineHeight: 1 }}>{kpisLoading ? '—' : blocked}</span>
                {hasAlert && <AlertTriangle size={18} color="#f97316" />}
              </div>
              <div style={{ fontSize: 11, color: hasAlert ? '#c2410c' : '#94a3b8', marginTop: 5 }}>
                {kpisLoading ? '' : hasAlert ? 'Requieren atención' : 'En proyectos activos'}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Filtros ── */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap',
        background: 'white', padding: '14px 16px', borderRadius: 12,
        border: '1px solid #e2e8f0', marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <FilterField label="Frente">
          <select value={filters.frente} onChange={e => set('frente', e.target.value)} style={SEL}>
            <option value="">Todos</option>
            {frenteOpts.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </FilterField>

        <FilterField label="Ini.">
          <input type="date" value={filters.startDate} onChange={e => set('startDate', e.target.value)} style={SEL} />
        </FilterField>

        <FilterField label="Fin">
          <input type="date" value={filters.endDate} onChange={e => set('endDate', e.target.value)} style={SEL} />
        </FilterField>

        <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end' }}>
          <button onClick={handleApply} style={{ ...BTN_BASE, background: '#1e293b', color: 'white' }}>
            <Filter size={13} /> Filtrar
          </button>
          <button onClick={handleClear} style={{ ...BTN_BASE, background: '#f1f5f9', color: '#64748b' }}>
            <X size={13} /> Limpiar
          </button>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div style={{
        background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <AlertTriangle size={16} /> {error}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr>
                  <TH width="220px">Colaborador</TH>
                  <TH width="70px" align="center">FIN.</TH>
                  <TH width="90px">Tallaje</TH>
                  <TH width="156px">Tendencia</TH>
                  <TH width="140px">KPI Cumpl.</TH>
                  <TH width="100px" align="center">Cap. Real</TH>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3,4,5].map(i => <SkeletonRow key={i} />)
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                      Sin datos para el período seleccionado.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <PersonRow
                      key={row.assignee_id}
                      row={row}
                      applied={applied}
                      capacities={capacities}
                      color={PERSON_COLORS[i % PERSON_COLORS.length]}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Gráfico de líneas ── */}
      {!loading && !error && rows.length > 0 && (
        <WeeklyChart
          rows={rows}
          capacities={capacities}
          chartPerson={chartPerson}
          setChartPerson={setChartPerson}
        />
      )}
    </div>
  );
}
