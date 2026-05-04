import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, Tooltip as RechartTooltip,
  LineChart, Line, CartesianGrid, ReferenceLine, ResponsiveContainer, YAxis,
} from 'recharts';
import {
  TrendingUp, Filter, X, RefreshCw, AlertTriangle,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dbPerformance } from '../lib/database';
import { supabase } from '../lib/supabase';

// ─── Constantes ───────────────────────────────────────────────────────────────

const PERSON_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const today       = () => new Date().toISOString().slice(0, 10);
const firstOfYear = () => `${new Date().getFullYear()}-01-01`;

const daysBetween = (s, e) => Math.round((new Date(e) - new Date(s)) / (24 * 3600 * 1000));
const getGranularity = (s, e) => {
  const d = daysBetween(s || firstOfYear(), e || today());
  if (d <= 14) return 'day';
  if (d <= 90) return 'week';
  return 'month';
};

const getDayKey   = (t) => (typeof t === 'string' ? t : new Date(t).toISOString()).slice(0, 10);
const getDayLabel = (k) => { const [, m, d] = k.split('-'); return `${d}/${m}`; };

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

const getMonthKey   = (t) => (typeof t === 'string' ? t : new Date(t).toISOString()).slice(0, 7);
const MONTH_NAMES   = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const getMonthLabel = (k) => { const [yr, m] = k.split('-'); return `${MONTH_NAMES[parseInt(m,10)-1]} ${yr.slice(2)}`; };

const getDaysInRange = (startDate, endDate) => {
  const days = []; const cur = new Date(startDate || firstOfYear()); const end = new Date(endDate || today());
  while (cur <= end) { days.push(cur.toISOString().slice(0,10)); cur.setDate(cur.getDate()+1); }
  return days;
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

const getMonthsInRange = (startDate, endDate) => {
  const months = []; const seen = new Set();
  const end = new Date(endDate || today());
  const endM = new Date(end.getFullYear(), end.getMonth(), 1);
  const cur  = new Date((startDate || firstOfYear()).slice(0, 7) + '-01');
  while (cur <= endM) {
    const k = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}`;
    if (!seen.has(k)) { seen.add(k); months.push(k); }
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
};

// Agrega trend_data con granularidad dinámica según el rango de fechas
const aggregateTrend = (items, startDate = null, endDate = null) => {
  if (!items?.length) return [];
  const g = getGranularity(startDate, endDate);
  const map = {};
  items.forEach(({ t }) => {
    const d = (typeof t === 'string' ? t : new Date(t).toISOString()).slice(0, 10);
    if (startDate && d < startDate) return;
    if (endDate   && d > endDate)   return;
    const k = g === 'day' ? getDayKey(t) : g === 'week' ? getIsoWeekKey(t) : getMonthKey(t);
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map).sort(([a],[b]) => a.localeCompare(b)).map(([k, v]) => ({
    t: k, v,
    label: g === 'day' ? getDayLabel(k) : g === 'week' ? getWeekLabel(k) : getMonthLabel(k),
  }));
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
  return { total, late, kpi, capR, trend };
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

// ─── Gráfico de tendencia (granularidad dinámica según rango) ─────────────────

const WeeklyChart = ({ rows, capacities, chartPerson, setChartPerson, startDate, endDate }) => {
  const granularity = useMemo(() => getGranularity(startDate, endDate), [startDate, endDate]);

  const rangePoints = useMemo(() => {
    if (granularity === 'day')  return getDaysInRange(startDate, endDate);
    if (granularity === 'week') return getWeeksInRange(startDate, endDate);
    return getMonthsInRange(startDate, endDate);
  }, [granularity, startDate, endDate]);

  const getPointLabel = useCallback((k) => {
    if (granularity === 'day')  return getDayLabel(k);
    if (granularity === 'week') return getWeekLabel(k);
    return getMonthLabel(k);
  }, [granularity]);

  const getPointKey = useCallback((t) => {
    if (granularity === 'day')  return getDayKey(t);
    if (granularity === 'week') return getIsoWeekKey(t);
    return getMonthKey(t);
  }, [granularity]);

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

  const chartData = useMemo(() => rangePoints.map(pt => {
    const point = { week: getPointLabel(pt) };
    visible.forEach(r => {
      point[r.assignee_name] = (r.trend_data || []).filter(({ t }) => {
        const d = (typeof t === 'string' ? t : new Date(t).toISOString()).slice(0, 10);
        return getPointKey(t) === pt && (!startDate || d >= startDate) && (!endDate || d <= endDate);
      }).length;
    });
    return point;
  }), [rangePoints, visible, startDate, endDate, getPointLabel, getPointKey]);

  const selRow = chartPerson !== 'all' ? visible[0] : null;
  const refCap = selRow ? (capacities[String(selRow.assignee_id)] || null) : null;

  if (!persons.length) return null;

  const periodLabel = startDate && endDate ? `${startDate} → ${endDate}` : 'Período seleccionado';
  const periodTitle = granularity === 'day' ? 'Completadas por día'
    : granularity === 'week' ? 'Completadas por semana' : 'Completadas por mes';
  const periodUnit = granularity === 'day' ? 'día' : granularity === 'week' ? 'semana' : 'mes';

  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px', marginTop: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{periodTitle}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{periodLabel} · {rangePoints.length} {periodUnit}{rangePoints.length !== 1 ? 's' : ''}</div>
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
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={rangePoints.length > 16 ? Math.floor(rangePoints.length / 12) : 0} />
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
    <TD><div className="pd-skel" style={{ width: 136, height: 46, borderRadius: 4 }} /></TD>
    <TD><div className="pd-skel" style={{ width: 96, height: 22, borderRadius: 999 }} /></TD>
    <TD><div className="pd-skel" style={{ width: 56, height: 28, borderRadius: 4, margin: '0 auto' }} /></TD>
  </tr>
);

// ─── Nivel 3: Colaborador ─────────────────────────────────────────────────────

const PersonRow = ({ row, weeks, capacities, startDate, endDate }) => {
  const trend      = useMemo(() => aggregateTrend(row.trend_data, startDate, endDate), [row.trend_data, startDate, endDate]);
  const isUnassign = !row.assignee_id;
  const capTarget  = isUnassign ? null : (capacities[String(row.assignee_id)] || null);
  const capReal    = Math.round((row.total_closed / weeks) * 10) / 10;
  const color      = personColor(row.assignee_id);

  return (
    <tr style={{ background: 'white' }}>
      <TD style={{ maxWidth: 240 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 28 }}>
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

// ─── Nivel 1: Entorno ─────────────────────────────────────────────────────────

const EnvironmentSection = ({ env, weeks, capacities, startDate, endDate }) => {
  const [expanded, setExpanded] = useState(true);
  const a     = useMemo(() => agg(env.rows, weeks), [env.rows, weeks]);
  const trend = useMemo(() => aggregateTrend(a.trend, startDate, endDate), [a.trend, startDate, endDate]);
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
            <span style={{ fontSize: 10, color: '#64748b' }}>· {env.rows.length} colaborador{env.rows.length !== 1 ? 'es' : ''}</span>
          </div>
        </TD>
        <TD style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{a.total}</span>
          {a.late > 0 && <div style={{ fontSize: 10, color: '#f97316', marginTop: 1 }}>{a.late} tarde</div>}
        </TD>
        <TD><Sparkline data={trend} color={color} /></TD>
        <TD><KpiBadge pct={a.kpi} /></TD>
        <TD style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{a.capR}</span>
          <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 2 }}>/sem</span>
        </TD>
      </tr>
      {expanded && env.rows.map(r => (
        <PersonRow key={r.assignee_id} row={r} weeks={weeks} capacities={capacities} startDate={startDate} endDate={endDate} />
      ))}
    </>
  );
};

// ─── Nivel 0: Resumen General ─────────────────────────────────────────────────

const SummaryRow = ({ rows, weeks, byEnv, capacities, startDate, endDate }) => {
  const [expanded, setExpanded] = useState(true);
  const a     = useMemo(() => agg(rows, weeks), [rows, weeks]);
  const trend = useMemo(() => aggregateTrend(a.trend, startDate, endDate), [a.trend, startDate, endDate]);

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
  const { currentUser, currentWorkspace, orgRole, isPlatformOwner } = useApp();
  const canAccess = isPlatformOwner?.(currentUser) || orgRole === 'org_admin';

  const def = { equipo: '', startDate: firstOfYear(), endDate: today() };
  const [filters,     setFilters]     = useState(def);
  const [applied,     setApplied]     = useState(def);
  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [chartPerson, setChartPerson] = useState('all');
  const [rangeKpis,   setRangeKpis]   = useState(null);
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

  const filteredRows = useMemo(() => {
    if (!applied.equipo) return rows;
    return rows.filter(r => String(r.environment_id) === String(applied.equipo));
  }, [rows, applied.equipo]);

  const velocityPerWeek = useMemo(() => {
    const total = filteredRows.reduce((s, r) => s + r.total_closed, 0);
    return weeks > 0 ? Math.round((total / weeks) * 10) / 10 : 0;
  }, [filteredRows, weeks]);

  const onTimeRate = useMemo(() => {
    const valid = filteredRows.filter(r => r.kpi_pct != null);
    if (valid.length < 3) return null;
    return Math.round(valid.reduce((s, r) => s + r.kpi_pct, 0) / valid.length);
  }, [filteredRows]);

  // Jerarquía: Entorno → Colaborador (sobre filteredRows)
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
          rows: [],
        };
      }
      envMap[eid].rows.push(r);
    });
    return Object.values(envMap).sort((a, b) => a.environment_name.localeCompare(b.environment_name));
  }, [filteredRows]);

  const loadAll = async () => {
    if (!canAccess) return;
    setLoading(true); setKpisLoading(true); setError('');
    try {
      const wsId  = currentWorkspace?.id || null;
      const start = applied.startDate || firstOfYear();
      const end   = applied.endDate   || today();

      // Proyectos activos y bloqueadas (workspace-level)
      const pq = supabase.from('projects').select('id, end_date')
        .not('status', 'in', '(completed,cancelled,archived)');
      if (wsId) pq.eq('workspace_id', wsId);

      const bq = supabase.from('tasks').select('id', { count: 'exact', head: true })
        .eq('status', 'blocked');
      if (wsId) bq.eq('workspace_id', wsId);

      const now = new Date();
      const dow = now.getDay();
      const mon = new Date(now);
      mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
      const thisWeekStart = mon.toISOString().slice(0, 10);
      const twq = supabase.from('tasks').select('id', { count: 'exact', head: true })
        .eq('status', 'completed').gte('closed_at', thisWeekStart).lte('closed_at', today());
      if (wsId) twq.eq('workspace_id', wsId);

      const [metricsRows, { data: activeProjects }, { count: blockedCount }, { count: thisWeekCount }] =
        await Promise.all([
          dbPerformance.getMetrics({ workspaceId: wsId, startDate: start, endDate: end }),
          pq, bq, twq,
        ]);

      setRows(metricsRows);
      const completedInRange = (activeProjects || []).filter(
        p => p.end_date && p.end_date >= start && p.end_date <= end
      ).length;
      setRangeKpis({
        totalActiveProjects: (activeProjects || []).length,
        completedInRange,
        blockedCount: blockedCount || 0,
        thisWeekCount: thisWeekCount || 0,
      });
    } catch (e) {
      console.error('[PerformanceDashboard]', e);
      setError(e.message || 'Error cargando métricas');
    } finally {
      setLoading(false); setKpisLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [applied.startDate, applied.endDate, currentWorkspace?.id]);

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  if (!canAccess) return null;

  const totalColabs = filteredRows.length;
  const progresoPercent = rangeKpis && rangeKpis.totalActiveProjects > 0
    ? Math.round(rangeKpis.completedInRange / rangeKpis.totalActiveProjects * 100) : 0;

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
        {/* Progreso */}
        <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Progreso del área</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: 6 }}>{kpisLoading ? '—' : `${progresoPercent}%`}</div>
          <div style={{ height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${kpisLoading ? 0 : Math.min(100, progresoPercent)}%`, background: '#6366f1', borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>
            {kpisLoading ? '' : `${rangeKpis?.completedInRange ?? 0} de ${rangeKpis?.totalActiveProjects ?? 0} proyecto${rangeKpis?.totalActiveProjects !== 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Velocidad semanal */}
        <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Velocidad semanal</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{kpisLoading ? '—' : velocityPerWeek}</span>
            {!kpisLoading && <span style={{ fontSize: 12, color: '#94a3b8' }}>/sem</span>}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>{kpisLoading ? '' : `Esta semana: ${rangeKpis?.thisWeekCount ?? 0}`}</div>
        </div>

        {/* Cumplimiento */}
        <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Cumplimiento de fechas</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, marginBottom: 4, color: kpisLoading ? '#94a3b8' : (onTimeRate == null ? '#94a3b8' : onTimeRate >= 70 ? '#16a34a' : onTimeRate >= 50 ? '#f59e0b' : '#dc2626') }}>
            {kpisLoading ? '—' : (onTimeRate == null ? '—' : `${onTimeRate}%`)}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{kpisLoading ? '' : (onTimeRate == null ? 'Sin datos suficientes' : 'A tiempo en el período')}</div>
        </div>

        {/* Bloqueadas */}
        {(() => {
          const blocked = rangeKpis?.blockedCount ?? 0;
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
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
              <thead>
                <tr>
                  <TH width="220px">Colaborador</TH>
                  <TH width="70px" align="center">FIN.</TH>
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
                    <SkeletonRow bg="white"   pl={28} />
                    <SkeletonRow bg="white"   pl={28} />
                    <SkeletonRow bg="#f1f5f9" pl={0} />
                    <SkeletonRow bg="white"   pl={28} />
                    <SkeletonRow bg="white"   pl={28} />
                  </>
                ) : filteredRows.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Sin datos para el período seleccionado.</td></tr>
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
