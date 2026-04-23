import React, { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, Tooltip as RechartTooltip,
} from 'recharts';
import {
  ChevronDown, ChevronRight, TrendingUp, Filter, X, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dbKpiThresholds, dbPerformance } from '../lib/database';

// ─── Constantes ───────────────────────────────────────────────────────────────

const AREA_OPTIONS = ['TI', 'Crédito', 'Cartera', 'Riesgo', 'Datos', 'Transversal'];

const MONTH_ABBR = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

const ENV_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const aggregateTrend = (items) => {
  if (!items?.length) return [];
  const map = {};
  items.forEach(({ t, v }) => {
    const iso = typeof t === 'string' ? t : new Date(t).toISOString();
    const key = iso.slice(0, 7); // YYYY-MM — agrupa por mes
    map[key] = (map[key] || 0) + (v || 1);
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      t: key,
      v,
      label: MONTH_ABBR[parseInt(key.slice(5, 7), 10) - 1],
    }));
};

const mergeTrends = (rows) => aggregateTrend(rows.flatMap(r => r.trend_data || []));

const sumClosed = (rows) => rows.reduce((s, r) => s + (r.total_closed || 0), 0);

const calcAvgKpi = (rows) => {
  const valid = rows.filter(r => r.avg_kpi != null);
  if (!valid.length) return null;
  return Math.round(valid.reduce((s, r) => s + Number(r.avg_kpi), 0) / valid.length * 10) / 10;
};

const calcAvgCapacity = (rows) => {
  const valid = rows.filter(r => r.capacity != null);
  if (!valid.length) return null;
  return Math.round(valid.reduce((s, r) => s + Number(r.capacity), 0) / valid.length * 100) / 100;
};

const today = () => new Date().toISOString().slice(0, 10);
const firstOfYear = () => `${new Date().getFullYear()}-01-01`;

// ─── Micro componentes ────────────────────────────────────────────────────────

const KpiBadge = ({ value, thresholds }) => {
  if (value == null) return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;
  const pct = Math.round(value);
  const cfg = pct >= thresholds.good
    ? { label: 'Bueno', bg: '#d1fae5', color: '#065f46' }
    : pct >= thresholds.leve
      ? { label: 'Leve',  bg: '#fef3c7', color: '#92400e' }
      : { label: 'Bajo',  bg: '#fee2e2', color: '#991b1b' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontWeight: 700, fontSize: 13, color: cfg.color }}>{pct}%</span>
      <span style={{
        padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700,
        background: cfg.bg, color: cfg.color,
      }}>{cfg.label}</span>
    </div>
  );
};

const Sparkline = ({ data, color = '#6366f1' }) => {
  if (!data?.length) return <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>;
  const gradId = `sg${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <AreaChart width={148} height={58} data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <XAxis
        dataKey="label"
        tick={{ fontSize: 9, fill: '#94a3b8' }}
        axisLine={false}
        tickLine={false}
        interval="preserveStartEnd"
      />
      <Area
        type="monotone"
        dataKey="v"
        stroke={color}
        strokeWidth={2}
        fill={`url(#${gradId})`}
        dot={data.length <= 6 ? { r: 2.5, fill: color, strokeWidth: 0 } : false}
        activeDot={{ r: 3, fill: color }}
      />
      <RechartTooltip
        contentStyle={{ fontSize: 10, padding: '2px 8px', borderRadius: 6 }}
        formatter={(v) => [v, 'Cerradas']}
        labelFormatter={(l) => l}
      />
    </AreaChart>
  );
};

const NameCell = ({ name, subtitle, indent = 0, expandable, expanded, onToggle, dot }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: indent * 18 }}>
    {expandable ? (
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{
        border: 'none', background: 'none', cursor: 'pointer', padding: 2, flexShrink: 0,
        color: '#6366f1', display: 'flex', alignItems: 'center',
      }}>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
    ) : (
      <span style={{ width: 20, flexShrink: 0 }} />
    )}
    {dot && (
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />
    )}
    <div style={{ minWidth: 0 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{subtitle}</div>
      )}
    </div>
  </div>
);

// ─── Celdas de tabla ──────────────────────────────────────────────────────────

const TH = ({ children, width, align = 'left' }) => (
  <th style={{
    padding: '10px 14px', textAlign: align, fontWeight: 700, fontSize: 11,
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '2px solid #e8edf3', background: '#f8fafc',
    whiteSpace: 'nowrap', width,
  }}>
    {children}
  </th>
);

const TD = ({ children, style }) => (
  <td style={{ padding: '9px 14px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle', ...style }}>
    {children}
  </td>
);

// ─── Fila colaborador (Nivel 3) ───────────────────────────────────────────────

const CollaboratorRow = ({ row, thresholds }) => {
  const trend = useMemo(() => aggregateTrend(row.trend_data), [row.trend_data]);
  return (
    <tr style={{ background: 'white' }}>
      <TD style={{ maxWidth: 260 }}>
        <NameCell name={row.assignee_name} subtitle={row.environment_name} indent={2} dot="#cbd5e1" />
      </TD>
      <TD style={{ textAlign: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{row.total_closed ?? 0}</span>
      </TD>
      <TD><Sparkline data={trend} color="#6366f1" /></TD>
      <TD><KpiBadge value={row.avg_kpi} thresholds={thresholds} /></TD>
      <TD style={{ textAlign: 'center' }}>
        {row.capacity != null
          ? <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{row.capacity}</span>
          : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
      </TD>
    </tr>
  );
};

// ─── Fila entorno (Nivel 2) ───────────────────────────────────────────────────

const EnvironmentSection = ({ envName, color, rows, thresholds }) => {
  const [expanded, setExpanded] = useState(false);
  const trend    = useMemo(() => mergeTrends(rows), [rows]);
  const closed   = useMemo(() => sumClosed(rows), [rows]);
  const kpi      = useMemo(() => calcAvgKpi(rows), [rows]);
  const capacity = useMemo(() => calcAvgCapacity(rows), [rows]);

  return (
    <>
      <tr
        style={{ background: '#fafafa', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <TD style={{ maxWidth: 260 }}>
          <NameCell
            name={envName} subtitle="Squad"
            indent={1} dot={color}
            expandable expanded={expanded}
            onToggle={() => setExpanded(e => !e)}
          />
        </TD>
        <TD style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{closed}</span>
        </TD>
        <TD><Sparkline data={trend} color={color} /></TD>
        <TD><KpiBadge value={kpi} thresholds={thresholds} /></TD>
        <TD style={{ textAlign: 'center' }}>
          {capacity != null
            ? <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{capacity}</span>
            : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
        </TD>
      </tr>
      {expanded && rows.map(r => (
        <CollaboratorRow key={`${r.assignee_id}-${r.environment_id}`} row={r} thresholds={thresholds} />
      ))}
    </>
  );
};

// ─── Fila general (Nivel 1) ───────────────────────────────────────────────────

const GeneralSection = ({ rows, thresholds, envColorMap }) => {
  const [expanded, setExpanded] = useState(true);
  const trend    = useMemo(() => mergeTrends(rows), [rows]);
  const closed   = useMemo(() => sumClosed(rows), [rows]);
  const kpi      = useMemo(() => calcAvgKpi(rows), [rows]);
  const capacity = useMemo(() => calcAvgCapacity(rows), [rows]);

  const byEnv = useMemo(() => {
    const map = {};
    rows.forEach(r => {
      if (!map[r.environment_id]) {
        map[r.environment_id] = { envName: r.environment_name, rows: [] };
      }
      map[r.environment_id].rows.push(r);
    });
    return Object.entries(map).map(([envId, v]) => ({
      envId, envName: v.envName, color: envColorMap[envId] || '#6366f1', rows: v.rows,
    }));
  }, [rows, envColorMap]);

  return (
    <>
      <tr
        style={{ background: '#f1f5f9', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <TD style={{ maxWidth: 260 }}>
          <NameCell
            name="Resumen General" subtitle="Todos los Squads"
            indent={0}
            expandable expanded={expanded}
            onToggle={() => setExpanded(e => !e)}
          />
        </TD>
        <TD style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{closed}</span>
        </TD>
        <TD><Sparkline data={trend} color="#0f172a" /></TD>
        <TD><KpiBadge value={kpi} thresholds={thresholds} /></TD>
        <TD style={{ textAlign: 'center' }}>
          {capacity != null
            ? <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{capacity}</span>
            : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
        </TD>
      </tr>
      {expanded && byEnv.map(env => (
        <EnvironmentSection
          key={env.envId}
          envName={env.envName}
          color={env.color}
          rows={env.rows}
          thresholds={thresholds}
        />
      ))}
    </>
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
  const { currentUser, environments } = useApp();

  const canAccess = ['admin', 'super_admin'].includes(currentUser?.role);

  const defaultFilters = { envId: '', frente: '', area: '', startDate: firstOfYear(), endDate: today() };
  const [filters,  setFilters]  = useState(defaultFilters);
  const [applied,  setApplied]  = useState(defaultFilters);
  const [rows,     setRows]     = useState([]);
  const [thresholds, setThresholds] = useState({ good: 90, leve: 80 });
  const [frenteOpts, setFrenteOpts] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Mapa envId → color estable
  const envColorMap = useMemo(() => {
    const map = {};
    (environments || []).forEach((e, i) => { map[e.id] = ENV_COLORS[i % ENV_COLORS.length]; });
    return map;
  }, [environments]);

  const loadAll = async () => {
    if (!canAccess) return;
    setLoading(true);
    setError('');
    try {
      const [metricsRows, thresh, frentes] = await Promise.all([
        dbPerformance.getMetrics({
          environmentId: applied.envId   || null,
          frente:        applied.frente  || null,
          area:          applied.area    || null,
          startDate:     applied.startDate || null,
          endDate:       applied.endDate   || null,
        }),
        dbKpiThresholds.get(applied.envId || null),
        dbPerformance.getFrenteOptions(),
      ]);
      setRows(metricsRows);
      setThresholds({ good: thresh.threshold_good, leve: thresh.threshold_leve });
      setFrenteOpts(frentes);
    } catch (e) {
      console.error('[PerformanceDashboard]', e);
      setError(e.message || 'Error cargando métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [applied]);

  const handleApply = () => setApplied({ ...filters });
  const handleClear = () => { setFilters(defaultFilters); setApplied(defaultFilters); };
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  if (!canAccess) return null;

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'inherit', maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={20} color="#6366f1" />
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
              Desempeño por Colaborador
            </h2>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
              {rows.length} colaborador{rows.length !== 1 ? 'es' : ''} · {applied.startDate} → {applied.endDate}
            </div>
          </div>
        </div>
        <button onClick={loadAll} style={{ ...BTN_BASE, background: '#f1f5f9', color: '#64748b' }}>
          <RefreshCw size={13} /> Actualizar
        </button>
      </div>

      {/* ── Filtros ── */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap',
        background: 'white', padding: '14px 16px', borderRadius: 12,
        border: '1px solid #e8edf3', marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <FilterField label="Squad">
          <select value={filters.envId} onChange={e => set('envId', e.target.value)} style={SEL}>
            <option value="">Todos</option>
            {(environments || []).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </FilterField>

        <FilterField label="Frente">
          <select value={filters.frente} onChange={e => set('frente', e.target.value)} style={SEL}>
            <option value="">Todos</option>
            {frenteOpts.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </FilterField>

        <FilterField label="Área">
          <select value={filters.area} onChange={e => set('area', e.target.value)} style={SEL}>
            <option value="">Todas</option>
            {AREA_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </FilterField>

        <FilterField label="Ini. Teo.">
          <input type="date" value={filters.startDate} onChange={e => set('startDate', e.target.value)} style={SEL} />
        </FilterField>

        <FilterField label="Fin. Teo.">
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
        background: 'white', borderRadius: 12, border: '1px solid #e8edf3',
        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            Cargando métricas…
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <AlertTriangle size={16} /> {error}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
            Sin datos para el rango y filtros seleccionados.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
              <thead>
                <tr>
                  <TH width="260px">Colaborador</TH>
                  <TH width="80px"  align="center">FIN.</TH>
                  <TH width="160px">Tendencia</TH>
                  <TH width="150px">KPI FIN.</TH>
                  <TH width="100px" align="center">Capacity</TH>
                </tr>
              </thead>
              <tbody>
                <GeneralSection rows={rows} thresholds={thresholds} envColorMap={envColorMap} />
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
