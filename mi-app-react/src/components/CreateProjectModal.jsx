import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Briefcase, Save, ChevronDown, Check } from 'lucide-react';
import { dbProjects, dbEnvironmentMembers } from '../lib/database';
import { PROJECT_STATUS_DROPDOWN } from '../constants/statuses';

// ============================================================================
// ESTILOS COMPARTIDOS
// ============================================================================
const S = {
  overlay: {
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000,
  },
  content: {
    background: 'white',
    borderRadius: '16px',
    maxWidth: '620px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
    margin: '0 16px',
  },
  header: {
    padding: '24px',
    borderBottom: '1px solid #f3f4f6',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    position: 'sticky', top: 0, background: 'white', zIndex: 1,
    borderRadius: '16px 16px 0 0',
  },
  title: {
    fontSize: '20px', fontWeight: 700, color: '#1f2937',
    display: 'flex', alignItems: 'center', gap: '12px', margin: 0,
  },
  iconBox: {
    background: '#eef2ff', borderRadius: '10px',
    padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  form: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  group: {},
  label: { display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' },
  input: {
    width: '100%', padding: '11px 14px', border: '1px solid #d1d5db',
    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', color: '#1f2937',
    transition: 'border-color 0.2s',
  },
  select: {
    width: '100%', padding: '11px 14px', border: '1px solid #d1d5db',
    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', color: '#1f2937', background: 'white', cursor: 'pointer',
  },
  textarea: {
    width: '100%', padding: '11px 14px', border: '1px solid #d1d5db',
    borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', color: '#1f2937', resize: 'vertical', minHeight: '84px',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  footer: {
    padding: '20px 24px', borderTop: '1px solid #f3f4f6',
    display: 'flex', justifyContent: 'flex-end', gap: '12px',
    position: 'sticky', bottom: 0, background: 'white',
  },
  btnPrimary: {
    padding: '11px 24px', background: '#6366f1', color: 'white', border: 'none',
    borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit',
    transition: 'background 0.2s',
  },
  btnSecondary: {
    padding: '11px 24px', background: 'white', color: '#6b7280',
    border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: 600,
    fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
  },
  error: {
    padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: '8px', color: '#dc2626', fontSize: '13px',
  },
};

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high',   label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

const STATUS_OPTIONS = Object.entries(PROJECT_STATUS_DROPDOWN).map(([value, cfg]) => ({ value, label: cfg.label }));

const AREA_OPTIONS = ['TI', 'Crédito', 'Cartera', 'Riesgo', 'Datos', 'Transversal', 'Interno'];

const makeEmpty = (defaultEnvironmentId = '') => ({
  name: '', responsableId: '', area: '',
  environmentId: defaultEnvironmentId || '',
  startDate: '', endDate: '', priority: 'medium', status: 'backlog', description: '',
});

// ============================================================================
// AVATAR HELPER
// ============================================================================
const avatarInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';

function UserAvatar({ user, size = 28 }) {
  if (!user) return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, color: '#9ca3af', fontWeight: 700, flexShrink: 0 }}>?</div>
  );
  const isUrl = typeof user.avatar === 'string' && (user.avatar.startsWith('http') || user.avatar.startsWith('data:'));
  const ini   = avatarInitials(user.name || user.email || '');
  const isEmoji = !isUrl && user.avatar && user.avatar.length <= 4;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#6366f1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isEmoji ? size * 0.55 : size * 0.38, fontWeight: 700, color: 'white', flexShrink: 0 }}>
      {isUrl   ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
       : isEmoji ? user.avatar
       : ini}
    </div>
  );
}

// ============================================================================
// DROPDOWN PERSONALIZADO DE RESPONSABLE
// ============================================================================
function PersonDropdown({ users, value, onChange, loading }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u => (u.name || u.email || '').toLowerCase().includes(q));
  }, [users, search]);

  const selected = users.find(u => String(u.id) === String(value)) || null;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px',
          background: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px',
          display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
          transition: 'border-color 0.2s',
          ...(open ? { borderColor: '#6366f1', boxShadow: '0 0 0 3px rgba(99,102,241,0.12)' } : {}),
        }}
      >
        {selected ? (
          <>
            <UserAvatar user={selected} size={26} />
            <span style={{ flex: 1, color: '#1f2937', fontWeight: 500 }}>{selected.name || selected.email}</span>
          </>
        ) : (
          <>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 14, color: '#9ca3af' }}>—</span>
            </div>
            <span style={{ flex: 1, color: '#9ca3af' }}>
              {loading ? 'Cargando…' : 'Sin asignar'}
            </span>
          </>
        )}
        <ChevronDown size={15} color="#9ca3af" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 500,
          background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(15,23,42,0.13)', overflow: 'hidden',
        }}>
          {/* Búsqueda */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
            <input
              autoFocus
              placeholder="Buscar persona…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '7px 12px', border: '1px solid #e5e7eb',
                borderRadius: '8px', fontSize: 13, outline: 'none',
                fontFamily: 'inherit', color: '#374151', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Lista */}
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {/* Opción "Sin asignar" */}
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              style={{
                width: '100%', padding: '10px 14px', border: 'none', background: !value ? '#f5f3ff' : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: 'inherit', fontSize: 13, color: !value ? '#6366f1' : '#6b7280',
                textAlign: 'left',
              }}
              onMouseEnter={e => { if (value) e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={e => { if (value) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 16, color: '#9ca3af' }}>—</span>
              </div>
              <span style={{ fontWeight: !value ? 600 : 400 }}>Sin asignar</span>
              {!value && <Check size={14} style={{ marginLeft: 'auto', color: '#6366f1' }} />}
            </button>

            {filtered.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                Sin resultados
              </div>
            ) : filtered.map(u => {
              const active = String(u.id) === String(value);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { onChange(String(u.id)); setOpen(false); }}
                  style={{
                    width: '100%', padding: '9px 14px', border: 'none',
                    background: active ? '#eef2ff' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    fontFamily: 'inherit', fontSize: 13, color: active ? '#4f46e5' : '#374151',
                    textAlign: 'left', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <UserAvatar user={u} size={30} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: active ? 600 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.name || u.email}
                    </div>
                    {u.name && u.email && (
                      <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.email}
                      </div>
                    )}
                  </div>
                  {active && <Check size={14} style={{ flexShrink: 0, color: '#6366f1' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function CreateProjectModal({
  open, onClose,
  users = [], environments = [],
  defaultEnvironmentId = null,
  onSuccess,
}) {
  const [form, setForm]           = useState(() => makeEmpty(defaultEnvironmentId));
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [teamUsers, setTeamUsers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Reiniciar formulario cada vez que se abre
  useEffect(() => {
    if (!open) return;
    setForm(makeEmpty(defaultEnvironmentId));
    setError('');
    const handler = (e) => { if (e.key === 'Escape' && !saving) onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, defaultEnvironmentId, saving, onClose]);

  // Cargar miembros del equipo: mismo patrón que EnvironmentMembersModal
  // 1) Traer registros de environment_members (user_id, role)
  // 2) Cruzar con el array `users` ya cargado (el mismo que usa toda la app)
  const envId = form.environmentId;
  useEffect(() => {
    if (!open || !envId) { setTeamUsers([]); setLoadingMembers(false); return; }
    let cancelled = false;
    setLoadingMembers(true);
    setTeamUsers([]);
    dbEnvironmentMembers.getByEnvironment(envId)
      .then(members => {
        if (cancelled) return;
        const memberIds = new Set(members.map(m => String(m.user_id)));
        const filtered  = users.filter(u => memberIds.has(String(u.id)));
        setTeamUsers(filtered);
      })
      .catch(err => {
        if (cancelled) return;
        console.warn('[CreateProjectModal] Error cargando miembros:', err.message);
        setTeamUsers([]);
      })
      .finally(() => { if (!cancelled) setLoadingMembers(false); });
    return () => { cancelled = true; };
  }, [envId, open, users]);

  // Si el responsable elegido no pertenece al nuevo equipo, limpiarlo
  useEffect(() => {
    if (!form.responsableId || teamUsers.length === 0) return;
    if (!teamUsers.find(u => String(u.id) === String(form.responsableId))) {
      setForm(prev => ({ ...prev, responsableId: '' }));
    }
  }, [teamUsers, form.responsableId]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.name.trim()) { setError('El nombre del proyecto es requerido.'); return; }
    setSaving(true);
    setError('');
    try {
      const created = await dbProjects.create({
        name:          form.name.trim(),
        environmentId: form.environmentId || null,
        leaderId:      form.responsableId || null,
        startDate:     form.startDate     || null,
        endDate:       form.endDate       || null,
        priority:      form.priority,
        status:        form.status,
        description:   form.description,
        tags:          form.area ? [form.area] : [],
        roadmap:       { phases: [], userStories: [], risks: [], meetings: [] },
      });
      onSuccess?.(created);
      setForm(makeEmpty(defaultEnvironmentId));
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear el proyecto.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={S.overlay}>
      <div style={S.content}>

        {/* HEADER */}
        <div style={S.header}>
          <h2 style={S.title}>
            <span style={S.iconBox}><Briefcase size={20} color="#6366f1" /></span>
            Nuevo Proyecto
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} color="#9ca3af" />
          </button>
        </div>

        {/* FORMULARIO */}
        <div style={S.form}>
          {error && <div style={S.error}>{error}</div>}

          {/* Nombre */}
          <div style={S.group}>
            <label style={S.label}>Nombre del proyecto *</label>
            <input
              style={S.input}
              placeholder="Ej: Modernización de sistemas"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>

          {/* Equipo */}
          {environments.length > 0 && (
            <div style={S.group}>
              <label style={S.label}>Equipo</label>
              <select
                style={{
                  ...S.select,
                  borderColor: form.environmentId ? '#6366f1' : '#d1d5db',
                  background: form.environmentId ? '#fafafe' : 'white',
                }}
                value={form.environmentId}
                onChange={e => set('environmentId', e.target.value)}
              >
                <option value="">— Seleccionar equipo</option>
                {environments.map(env => (
                  <option key={env.id} value={env.id}>
                    {env.icon ? `${env.icon} ` : ''}{env.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Responsable */}
          <div style={S.group}>
            <label style={S.label}>
              Responsable
              {form.environmentId && (
                <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6, fontSize: 12 }}>
                  {loadingMembers ? '(cargando…)' : `(${teamUsers.length} miembros del equipo)`}
                </span>
              )}
            </label>
            <PersonDropdown
              users={teamUsers}
              value={form.responsableId}
              onChange={v => set('responsableId', v)}
              loading={loadingMembers}
            />
          </div>

          {/* Fechas */}
          <div style={S.row}>
            <div>
              <label style={S.label}>Fecha inicio</label>
              <input type="date" style={S.input} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Fecha fin</label>
              <input type="date" style={S.input} value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>

          {/* Prioridad + Estado */}
          <div style={S.row}>
            <div>
              <label style={S.label}>Prioridad</label>
              <select style={S.select} value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Estado</label>
              <select style={S.select} value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Área */}
          <div style={S.group}>
            <label style={S.label}>Área <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span></label>
            <select style={S.select} value={form.area} onChange={e => set('area', e.target.value)}>
              <option value="">— Seleccionar</option>
              {AREA_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label style={S.label}>Notas / Descripción</label>
            <textarea
              style={S.textarea}
              placeholder="Describe el objetivo del proyecto..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>
        </div>

        {/* FOOTER */}
        <div style={S.footer}>
          <button style={S.btnSecondary} onClick={onClose} type="button">Cancelar</button>
          <button
            style={{ ...S.btnPrimary, opacity: saving ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={saving}
          >
            <Save size={15} />
            {saving ? 'Guardando...' : 'Guardar ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}
