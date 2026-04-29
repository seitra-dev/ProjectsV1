import React, { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, Tooltip as RechartTooltip,
  BarChart, Bar, Cell,
  LineChart, Line, CartesianGrid, ReferenceLine, ResponsiveContainer, YAxis,
} from 'recharts';
import {
  TrendingUp, Filter, X, RefreshCw, AlertTriangle,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dbPerformance } from '../lib/database';
import { getGlobalMetrics, computeAreaKpisFromData } from './metrics';

// ─── Constantes ───────────────────────────────────────────────────────────────

const PERSON_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
];
const TALLAJE_COLORS = ['#c7d2fe', '#818cf8', '#4f46e5', '#312e81'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today       = () => new Date().toISOString().slice(0, 10);
const firstOfYear = () => `${new Date().getFullYear()}-01-01`;

const getIsoWeekKey = (dateStr) => {
  const d = new Date((typeof dateStr === 'string' ? dateStr : new Date(dateStr).toISOString()).slice(0, 10));
  const thu = new Date(d);
  thu.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const year = thu.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const w = 1 + Math.round((thu - jan4) / (7 * 24 * 3600 * 1000));
  return `${year}-W${String(w).padStart(2, '0')}`;
};

const getWeekLabel = (wk) => {
  const [yr, wStr] = wk.split('-');
  const w = parseInt(wStr.slice(1), 10);
  const jan4 = new Date(parseInt(yr, 10), 0, 4);
  const mon = new Date(jan4);
  mon.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (w - 1) * 7);
  return `${String(mon.getDate()).padStart(2,'0')}/${String(mon.getMonth()+1).padStart(2,'0')}`;
};

// Genera todas las semanas ISO entre startDate y endDate (inclusive)
const getWeeksInRange = (startDate, endDate) => {
  const seen = new Set(); const weeks = [];
  const start = new Date(startDate || firstOfYear());
  const end   = new Date(endDate   || today());
  const cur   = new Date(start);
  while (cur <= end) {
    const k = getIsoWeekKey(cur.toISOString().slice(0, 10));
    if (!seen.has(k)) { seen.add(k); weeks.push(k); }
    cur.setDate(cur.getDate() + 7);
  }
  // asegurar que la semana de end esté incluida
  const lastK = getIsoWeekKey(end.toISOString().slice(0, 10));
  if (!seen.has(lastK)) weeks.push(lastK);
  return weeks;
};

// Agrega trend_data en puntos semanales, filtrando por el rango de fechas
const aggregateTrendWeekly = (items, startDate = null, endDate = null) => {
  if (!items?.length) return [];
  const map = {};
  items.forEach(({ t }) => {
    const d = t.slice(0, 10);
    if (startDate && d < startDate) return;
    if (endDate   && d > endDate)   return;
    const k = getIsoWeekKey(t);
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => ({ t: k, v, label: getWeekLabel(k) }));
};

const weeksInPeriod = (s, e) => {
  const ms = new Date(e || today()) - new Date(s || firstOfYear());
  return Math.max(1, Math.ceil(ms / (7 * 24 * 3600 * 1000)));
};

// Agrega N filas en una sola fila resumen
const agg = (rows, weeks) => {
  const total = rows.reduce((s, r) => s + r.total_closed, 0);
  const late  = rows.reduce((s, r) => s + (r.late_count || 0), 0);
  const valid = rows.filter(r => r.kpi_pct != null);
  const kpi   = valid.length ? Math.round(valid.reduce((s, r) => s + r.kpi_pct, 0) / valid.length) : null;
  const capR  = weeks > 0 ? Math.round((total / weeks) * 10) / 10 : 0;
  const trend = rows.flatMap(r => r.trend_data || []);
  const sz    = rows.reduce((a, r) => ({
    xs: a.xs + (r.size_dist?.xs || 0), s: a.s + (r.size_dist?.s || 0),
    m:  a.m  + (r.size_dist?.m  || 0), l: a.l + (r.size_dist?.l  || 0),
  }), { xs: 0, s: 0, m: 0, l: 0 });
  return { total, late, kpi, capR, trend, sz };
};

// Color estable por assignee_id
const personColor = (aid) => {
  if (!aid) return '#94a3b8';
  const hash = String(aid).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PERSON_COLORS[hash % PERSON_COLORS.length];
};

// ─── CSS Shimmer ──────────────────────────────────────────────────────────────

const SHIMMER = `
  @keyframes pd-sh { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  .pd-skel { background:linear-gradient(90deg,#f1f5f9 25%,#e8edf3 50%,#f1f5f9 75%);
    background-size:800px 100%; animation:pd-sh 1.5s infinite linear; border-radius:4px; }
`;

// ─── Micro componentes visuales ───────────────────────────────────────────────

const KpiBadge = ({ pct }) => {
  if (pct == null) return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;
  const cfg = pct >= 100 ? { label: 'En Tiempo', bg: '#dcfce7', c: '#15803d' }
    : pct >= 85  ? { label: 'Leve',     bg: '#d1fae5', c: '#065f46' }
    : pct >= 70  ? { label: 'Moderado', bg: '#fef3c7', c: '#92400e' }
    :              { label: 'Crítico',  bg: '#fee2e2', c: '#b91c1c' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{pct}%</span>
      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 500, background: cfg.bg, color: cfg.c }}>{cfg.label}</span>
    </div>
  );
};

const AvatarCell = ({ name, src, size = 26 }) => {
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  const init = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const pal  = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
  const bg   = pal[(name || '').charCodeAt(0) % pal.length];
  return <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: 'white', flexShrink: 0 }}>{init}</div>;
};

const SizingChart = ({ dist }) => {
  if (!dist) return <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>;
  const data = [{ name: 'XS', v: dist.xs }, { name: 'S', v: dist.s }, { name: 'M', v: dist.m }, { name: 'L', v: dist.l }];
  if (data.every(d => d.v === 0)) return <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>;
  return (
    <BarChart width={72} height={46} data={data} margin={{ top: 2, right: 0, bottom: 14, left: 0 }}>
      <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
      <RechartTooltip contentStyle={{ fontSize: 10, padding: '2px 8px', borderRadius: 6 }} formatter={(v, n) => [v, n]} />
      <Bar dataKey="v" radius={[2, 2, 0, 0]}>{data.map((_, i) => <Cell key={i} fill={TALLAJE_COLORS[i]} />)}</Bar>
    </BarChart>
  );
};

const Sparkline = ({ data, color = '#6366f1' }) => {
  if (!data?.length) return <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>;
  const gid = `sg${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <AreaChart width={136} height={46} data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
      <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gid})`}
        dot={data.length <= 6 ? { r: 2, fill: color, strokeWidth: 0 } : false} activeDot={{ r: 3, fill: color }} />
      <RechartTooltip contentStyle={{ fontSize: 10, padding: '2px 8px', borderRadius: 6 }}
        formatter={(v) => [v, 'Cerradas']} labelFormatter={(l) => `Sem. ${l}`} />
    </AreaChart>
  );
};

// ─── Gráfico de tendencia semanal (respeta el rango de fechas del filtro) ─────

const WeeklyChart = ({ rows, capacities, chartPerson, setChartPerson, startDate, endDate }) => {
  const rangeWeeks = useMemo(() => getWeeksInRange(startDate, endDate), [startDate, endDate]);

  const persons = useMemo(() => {
    const map = {};
    rows.forEach(r => {
      if (!r.assignee_id) return;
      const pid = String(r.assignee_id);
      if (!map[pid]) map[pid] = { assignee_id: r.assignee_id, assignee_name: r.assignee_name, trend_data: [] };
      map[pid].trend_data.push(...(r.trend_data || []));
    });
    return Object.values(map);
  }, [rows]);

  const visible = chartPerson === 'all' ? persons : persons.filter(r => String(r.assignee_id) === chartPerson);

  const chartData = useMemo(() => rangeWeeks.map(wk => {
    const pt = { week: getWeekLabel(wk) };
    visible.forEach(r => {
      pt[r.assignee_name] = (r.trend_data || []).filter(({ t }) => {
        const d = t.slice(0, 10);
        return getIsoWeekKey(t) === wk
          && (!startDate || d >= startDate)
          && (!endDate   || d <= endDate);
      }).length;
    });
    return pt;
  }), [rangeWeeks, visible, startDate, endDate]);

  const selRow = chartPerson !== 'all' ? visible[0] : null;
  const refCap = selRow ? (capacities[String(selRow.assignee_id)] || null) : null;

  if (!persons.length) return null;

  const periodLabel = startDate && endDate ? `${startDate} → ${endDate}` : 'Período seleccionado';

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px', marginTop: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Completadas por semana</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{periodLabel} · {rangeWeeks.length} semana{rangeWeeks.length !== 1 ? 's' : ''}</div>
        </div>
        <select value={chartPerson} onChange={e => setChartPerson(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#334155', background: 'white', cursor: 'pointer', outline: 'none' }}>
          <option value="all">Todas las personas</option>
          {persons.map(r => <option key={r.assignee_id} value={String(r.assignee_id)}>{r.assignee_name}</option>)}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 8, right: 40, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={rangeWeeks.length > 16 ? Math.floor(rangeWeeks.length / 12) : 0} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
          <RechartTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
          {visible.map((r, i) => (
            <Line key={r.assignee_id} type="monotone" dataKey={r.assignee_name}
              stroke={PERSON_COLORS[i % PERSON_COLORS.length]} strokeWidth={2}
              dot={{ r: 3, fill: PERSON_COLORS[i % PERSON_COLORS.length], strokeWidth: 0 }} activeDot={{ r: 5 }} />
          ))}
          {refCap && <ReferenceLine y={refCap} stroke="#94a3b8" strokeDasharray="4 2"
            label={{ value: `Cap. ${refCap}`, position: 'insideTopRight', fontSize: 10, fill: '#94a3b8', dy: -6 }} />}
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
  <th style={{ padding: '10px 14px', textAlign: align, fontWeight: 600, fontSize: 11,
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '1px solid #e2e8f0', background: '#f8fafc', whiteSpace: 'nowrap', width }}>
    {children}
  </th>
);
const TD = ({ children, style }) => (
  <td style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle', ...style }}>
    {children}
  </td>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = ({ bg = 'white', pl = 0 }) => (
  <tr style={{ background: bg }}>
    <TD>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: pl }}>
        <div className="pd-skel" style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0 }} />
        <div><div className="pd-skel" style={{ height: 10, width: 90, marginBottom: 5 }} /><div className="pd-skel" style={{ height: 8, width: 56 }} /></div>
      </div>
    </TD>
    <TD style={{ textAlign: 'center' }}><div className="pd-skel" style={{ height: 12, width: 22, margin: '0 auto' }} /></TD>
    <TD><div className="pd-skel" style={{ width: 72, height: 46, borderRadius: 4 }} /></TD>
    <TD><div className="pd-skel" style={{ width: 136, height: 46, borderRadius: 4 }} /></TD>
    <TD><div className="pd-skel" style={{ width: 96, height: 22, borderRadius: 999 }} /></TD>
    <TD><div className="pd-skel" style={{ width: 56, height: 28, borderRadius: 4, margin: '0 auto' }} /></TD>
  </tr>
);

// ─── Nivel 3: Colaborador ─────────────────────────────────────────────────────

const PersonRow = ({ row, weeks, capacities, startDate, endDate }) => {
  const trend      = useMemo(() => aggregateTrendWeekly(row.trend_data, startDate, endDate), [row.trend_data, startDate, endDate]);
  const isUnassign = !row.assignee_id;
  const capTarget  = isUnassign ? null : (capacities[String(row.assignee_id)] || null);
  const capReal    = Math.round((row.total_closed / weeks) * 10) / 10;
  const color      = personColor(row.assignee_id);

  return (
    <tr style={{ background: 'white' }}>
      <TD style={{ maxWidth: 240 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 48 }}>
          <AvatarCell name={row.assignee_name} src={row.avatar} size={24} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.assignee_name}
            </div>
          </div>
        </div>
      </TD>
      <TD style={{ textAlign: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{row.total_closed}</span>
        {!isUnassign && row.late_count > 0 && (
          <div style={{ fontSize: 10, color: '#f97316', marginTop: 1 }}>{row.late_count} tarde</div>
        )}
      </TD>
      <TD><SizingChart dist={row.size_dist} /></TD>
      <TD><Sparkline data={trend} color={color} /></TD>
      <TD>{isUnassign ? <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span> : <KpiBadge pct={row.kpi_pct} />}</TD>
      <TD style={{ textAlign: 'center' }}>
        {isUnassign ? <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span> : (
          <div>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{capReal}</span>
            <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 2 }}>/sem</span>
            {capTarget && (
              <div style={{ fontSize: 10, marginTop: 1, color: capReal >= capTarget ? '#16a34a' : '#f97316' }}>
                meta {capTarget}
              </div>
            )}
          </div>
        )}
      </TD>
    </tr>
  );
};

// ─── Nivel 2: Frente ──────────────────────────────────────────────────────────

const FrenteSection = ({ label, rows, isNoFrente, weeks, capacities, startDate, endDate }) => {
  const [expanded, setExpanded] = useState(true);
  const a     = useMemo(() => agg(rows, weeks), [rows, weeks]);
  const trend = useMemo(() => aggregateTrendWeekly(a.trend, startDate, endDate), [a.trend, startDate, endDate]);
  const hasNoAssignee = rows.every(r => !r.assignee_id);

  return (
    <>
      <tr style={{ background: '#f8fafc', cursor: 'pointer' }} onClick={() => setExpanded(v => !v)}>
        <TD style={{ maxWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 26 }}>
            <button onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, flexShrink: 0, color: '#6366f1', display: 'flex', alignItems: 'center' }}>
              {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            <span style={{ fontWeight: 600, fontSize: 12, color: '#334155', fontStyle: isNoFrente ? 'italic' : 'normal' }}>{label}</span>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>· {rows.length} persona{rows.length !== 1 ? 's' : ''}</span>
          </div>
        </TD>
        <TD style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{a.total}</span>
          {a.late > 0 && <div style={{ fontSize: 10, color: '#f97316', marginTop: 1 }}>{a.late} tarde</div>}
        </TD>
        <TD><SizingChart dist={a.sz} /></TD>
        <TD><Sparkline data={trend} color="#64748b" /></TD>
        <TD>{hasNoAssignee ? <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span> : <KpiBadge pct={a.kpi} />}</TD>
        <TD style={{ textAlign: 'center' }}>
          {hasNoAssignee ? <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span> : (
            <div>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{a.capR}</span>
              <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 2 }}>/sem</span>
            </div>
          )}
        </TD>
      </tr>
      {expanded && rows.map(r => (
        <PersonRow key={`${r.frente}::${r.assignee_id}`} row={r} weeks={weeks} capacities={capacities} startDate={startDate} endDate={endDate} />
      ))}
    </>
  );
};

// ─── Nivel 1: Entorno ─────────────────────────────────────────────────────────

const EnvironmentSection = ({ env, weeks, capacities, startDate, endDate }) => {
  const [expanded, setExpanded] = useState(true);
  const allRows = useMemo(() => env.frentes.flatMap(f => f.rows), [env.frentes]);
  const a     = useMemo(() => agg(allRows, weeks), [allRows, weeks]);
  const trend = useMemo(() => aggregateTrendWeekly(a.trend, startDate, endDate), [a.trend, startDate, endDate]);
  const color = env.environment_color || '#6366f1';

  return (
    <>
      <tr style={{ background: '#f1f5f9', cursor: 'pointer' }} onClick={() => setExpanded(v => !v)}>
        <TD style={{ maxWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <button onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, flexShrink: 0, color: '#6366f1', display: 'flex', alignItems: 'center' }}>
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{env.environment_name}</span>
            <span style={{ fontSize: 10, color: '#64748b' }}>· {allRows.length} colaborador{allRows.length !== 1 ? 'es' : ''}</span>
          </div>
        </TD>
        <TD style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{a.total}</span>
          {a.late > 0 && <div style={{ fontSize: 10, color: '#f97316', marginTop: 1 }}>{a.late} tarde</div>}
        </TD>
        <TD><SizingChart dist={a.sz} /></TD>
        <TD><Sparkline data={trend} color={color} /></TD>
        <TD><KpiBadge pct={a.kpi} /></TD>
        <TD style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{a.capR}</span>
          <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 2 }}>/sem</span>
        </TD>
      </tr>
      {expanded && env.frentes.map(f => (
        <FrenteSection
          key={f.label}
          label={f.label}
          rows={f.rows}
          isNoFrente={f.isNoFrente}
          weeks={weeks}
          capacities={capacities}
          startDate={startDate}
          endDate={endDate}
        />
      ))}
    </>
  );
};

// ─── Nivel 0: Resumen General ─────────────────────────────────────────────────

const SummaryRow = ({ rows, weeks, byEnv, capacities, startDate, endDate }) => {
  const [expanded, setExpanded] = useState(true);
  const a     = useMemo(() => agg(rows, weeks), [rows, weeks]);
  const trend = useMemo(() => aggregateTrendWeekly(a.trend, startDate, endDate), [a.trend, startDate, endDate]);

  return (
    <>
      <tr style={{ background: '#e8edf3', cursor: 'pointer' }} onClick={() => setExpanded(v => !v)}>
        <TD style={{ maxWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, flexShrink: 0, color: '#6366f1', display: 'flex', alignItems: 'center' }}>
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Resumen General</span>
            <span style={{ fontSize: 10, color: '#64748b' }}>· {rows.length} colaborador{rows.length !== 1 ? 'es' : ''}</span>
          </div>
        </TD>
        <TD style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{a.total}</span>
          {a.late > 0 && <div style={{ fontSize: 10, color: '#f97316', marginTop: 1 }}>{a.late} tarde</div>}
        </TD>
        <TD><SizingChart dist={a.sz} /></TD>
        <TD><Sparkline data={trend} color="#0f172a" /></TD>
        <TD><KpiBadge pct={a.kpi} /></TD>
        <TD style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{a.capR}</span>
          <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 2 }}>/sem</span>
        </TD>
      </tr>
      {expanded && byEnv.map(env => (
        <EnvironmentSection
          key={env.environment_id ?? '__noenv__'}
          env={env}
          weeks={weeks}
          capacities={capacities}
          startDate={startDate}
          endDate={endDate}
        />
      ))}
    </>
  );
};

// ─── Estilos compartidos ──────────────────────────────────────────────────────

const SEL = { padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', color: '#334155', background: 'white', cursor: 'pointer', outline: 'none' };
const BTN = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
const FF  = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
    {children}
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PerformanceDashboard() {
  const { currentUser, currentWorkspace } = useApp();
  const canAccess = ['admin', 'super_admin'].includes(currentUser?.system_role);

  const def = { frente: '', equipo: '', startDate: firstOfYear(), endDate: today() };
  const [filters,     setFilters]     = useState(def);
  const [applied,     setApplied]     = useState(def);
  const [rows,        setRows]        = useState([]);
  const [frenteOpts,  setFrenteOpts]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [chartPerson, setChartPerson] = useState('all');
  const [areaKpis,    setAreaKpis]    = useState(null);
  const [kpisLoading, setKpisLoading] = useState(true);

  const capacities = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('seitra_capacities') || '{}'); }
    catch { return {}; }
  }, []);

  const weeks = useMemo(() => weeksInPeriod(applied.startDate, applied.endDate), [applied]);

  // Opciones de Equipo derivadas de los rows cargados
  const equipoOpts = useMemo(() => {
    const seen = {};
    rows.forEach(r => {
      if (!r.environment_id) return;
      seen[r.environment_id] = { id: r.environment_id, name: r.environment_name || 'Sin nombre' };
    });
    return Object.values(seen).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  // Filtro de equipo aplicado client-side (environment_id no llega a Supabase)
  const filteredRows = useMemo(() => {
    if (!applied.equipo) return rows;
    return rows.filter(r => String(r.environment_id) === String(applied.equipo));
  }, [rows, applied.equipo]);

  // Jerarquía: Entorno → Frente → Colaborador (sobre filteredRows)
  const byEnv = useMemo(() => {
    const envMap = {};
    filteredRows.forEach(r => {
      const eid = r.environment_id ?? '__noenv__';
      if (!envMap[eid]) {
        envMap[eid] = {
          environment_id:    r.environment_id,
          environment_name:  r.environment_name  || 'Sin entorno',
          environment_color: r.environment_color || '#94a3b8',
          environment_icon:  r.environment_icon,
          frenteMap: {},
        };
      }
      const fk = r.frente || '__nf__';
      if (!envMap[eid].frenteMap[fk]) envMap[eid].frenteMap[fk] = [];
      envMap[eid].frenteMap[fk].push(r);
    });

    return Object.values(envMap)
      .sort((a, b) => a.environment_name.localeCompare(b.environment_name))
      .map(env => ({
        ...env,
        frentes: Object.entries(env.frenteMap)
          .sort(([a], [b]) => {
            if (a === '__nf__') return 1; if (b === '__nf__') return -1;
            return a.localeCompare(b);
          })
          .map(([fk, fRows]) => ({
            label:      fk === '__nf__' ? 'Sin frente' : fk,
            isNoFrente: fk === '__nf__',
            rows:       fRows,
          })),
      }));
  }, [filteredRows]);

  const loadAll = async () => {
    if (!canAccess) return;
    setLoading(true); setError('');
    try {
      const wsId = currentWorkspace?.id || null;
      const [metricsRows, frentes] = await Promise.all([
        dbPerformance.getMetrics({ workspaceId: wsId, frente: applied.frente || null, startDate: applied.startDate || null, endDate: applied.endDate || null }),
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

  useEffect(() => { loadAll(); }, [applied.frente, applied.startDate, applied.endDate, currentWorkspace?.id]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setKpisLoading(true);
      try {
        const base = await getGlobalMetrics(currentUser?.id, currentUser?.system_role);
        if (!cancelled) setAreaKpis(computeAreaKpisFromData(base.projects || [], base.tasks || []));
      } catch (e) { console.error('[PerformanceDashboard] KPIs', e); }
      finally { if (!cancelled) setKpisLoading(false); }
    };
    load(); return () => { cancelled = true; };
  }, [currentUser?.id]);

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  if (!canAccess) return null;

  const totalColabs = filteredRows.length;

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'inherit', maxWidth: 1400, margin: '0 auto' }}>
      <style>{SHIMMER}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={20} color="#6366f1" />
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Desempeño por Colaborador</h2>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
              {currentWorkspace?.name ? `${currentWorkspace.name} · ` : ''}
              {totalColabs} colaborador{totalColabs !== 1 ? 'es' : ''} · {applied.startDate} → {applied.endDate}
            </div>
          </div>
        </div>
        <button onClick={loadAll} style={{ ...BTN, background: '#f1f5f9', color: '#64748b' }}>
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {/* ── KPIs del área ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Progreso del área</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: 6 }}>{kpisLoading ? '—' : `${areaKpis?.weightedProgress ?? 0}%`}</div>
          <div style={{ height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${kpisLoading ? 0 : Math.min(100, areaKpis?.weightedProgress ?? 0)}%`, background: '#6366f1', borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>
            {kpisLoading ? '' : `${areaKpis?.activeProjectsCount ?? 0} proyecto${areaKpis?.activeProjectsCount !== 1 ? 's' : ''} activo${areaKpis?.activeProjectsCount !== 1 ? 's' : ''}`}
          </div>
        </div>

        {(() => {
          const v = areaKpis?.weeklyVelocity;
          const icon = !v ? '→' : v.trend === 'up' ? '↑' : v.trend === 'down' ? '↓' : '→';
          const col  = !v ? '#94a3b8' : v.trend === 'up' ? '#16a34a' : v.trend === 'down' ? '#dc2626' : '#64748b';
          return (
            <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Velocidad semanal</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{kpisLoading ? '—' : (v?.current ?? 0)}</span>
                {!kpisLoading && <span style={{ fontSize: 20, fontWeight: 800, color: col }}>{icon}</span>}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>{kpisLoading ? '' : `Esta semana · anterior: ${v?.previous ?? 0}`}</div>
            </div>
          );
        })()}

        <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Cumplimiento de fechas</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, marginBottom: 4, color: kpisLoading ? '#94a3b8' : (areaKpis?.onTimeRate == null ? '#94a3b8' : areaKpis.onTimeRate >= 70 ? '#16a34a' : areaKpis.onTimeRate >= 50 ? '#f59e0b' : '#dc2626') }}>
            {kpisLoading ? '—' : (areaKpis?.onTimeRate == null ? '—' : `${areaKpis.onTimeRate}%`)}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{kpisLoading ? '' : (areaKpis?.onTimeRate == null ? 'Sin datos suficientes' : 'A tiempo · últimos 30 días')}</div>
        </div>

        {(() => {
          const blocked = areaKpis?.blockedActive ?? 0;
          const alert = !kpisLoading && blocked > 0;
          return (
            <div style={{ background: alert ? '#fff7ed' : 'white', borderRadius: 12, padding: '16px 20px', border: `1px solid ${alert ? '#fed7aa' : '#f1f5f9'}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'background 0.3s' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: alert ? '#c2410c' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Tareas bloqueadas</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: alert ? '#ea580c' : '#0f172a', lineHeight: 1 }}>{kpisLoading ? '—' : blocked}</span>
                {alert && <AlertTriangle size={18} color="#f97316" />}
              </div>
              <div style={{ fontSize: 11, color: alert ? '#c2410c' : '#94a3b8', marginTop: 5 }}>{kpisLoading ? '' : (alert ? 'Requieren atención' : 'En proyectos activos')}</div>
            </div>
          );
        })()}
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', background: 'white', padding: '14px 16px', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <FF label="Equipo">
          <select value={filters.equipo} onChange={e => set('equipo', e.target.value)} style={SEL}>
            <option value="">Todos</option>
            {equipoOpts.map(e => <option key={e.id} value={String(e.id)}>{e.name}</option>)}
          </select>
        </FF>
        <FF label="Frente">
          <select value={filters.frente} onChange={e => set('frente', e.target.value)} style={SEL}>
            <option value="">Todos</option>
            {frenteOpts.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </FF>
        <FF label="Ini.">
          <input type="date" value={filters.startDate} onChange={e => set('startDate', e.target.value)} style={SEL} />
        </FF>
        <FF label="Fin">
          <input type="date" value={filters.endDate} onChange={e => set('endDate', e.target.value)} style={SEL} />
        </FF>
        <div style={{ display: 'flex', gap: 6, alignSelf: 'flex-end' }}>
          <button onClick={() => setApplied({ ...filters })} style={{ ...BTN, background: '#1e293b', color: 'white' }}><Filter size={13} /> Filtrar</button>
          <button onClick={() => { setFilters(def); setApplied(def); }} style={{ ...BTN, background: '#f1f5f9', color: '#64748b' }}><X size={13} /> Limpiar</button>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
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
                  <TH width="148px">Tendencia</TH>
                  <TH width="140px">KPI Cumpl.</TH>
                  <TH width="100px" align="center">Cap. Real</TH>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    <SkeletonRow bg="#e8edf3" pl={0} />
                    <SkeletonRow bg="#f1f5f9" pl={0} />
                    <SkeletonRow bg="#f8fafc" pl={26} />
                    <SkeletonRow bg="white"   pl={48} />
                    <SkeletonRow bg="white"   pl={48} />
                    <SkeletonRow bg="#f8fafc" pl={26} />
                    <SkeletonRow bg="white"   pl={48} />
                  </>
                ) : filteredRows.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Sin datos para el período seleccionado.</td></tr>
                ) : (
                  <SummaryRow
                    rows={filteredRows}
                    weeks={weeks}
                    byEnv={byEnv}
                    capacities={capacities}
                    startDate={applied.startDate}
                    endDate={applied.endDate}
                  />
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Gráfico semanal ── */}
      {!loading && !error && filteredRows.length > 0 && (
        <WeeklyChart
          rows={filteredRows}
          capacities={capacities}
          chartPerson={chartPerson}
          setChartPerson={setChartPerson}
          startDate={applied.startDate}
          endDate={applied.endDate}
        />
      )}
    </div>
  );
}
