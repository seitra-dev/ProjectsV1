import React, { useState, useEffect } from 'react';
import { X, Briefcase, Save } from 'lucide-react';
import { dbProjects } from '../lib/database';
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

const AREA_OPTIONS = ['TI', 'Crédito', 'Cartera', 'Riesgo', 'Datos', 'Transversal'];

const EMPTY = {
  name: '', responsableId: '', area: '', workspaceId: '',
  startDate: '', endDate: '', priority: 'medium', status: 'active', description: '',
};

// ============================================================================
// COMPONENTE
// ============================================================================
export default function CreateProjectModal({ open, onClose, users = [], workspaces = [], onSuccess }) {
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape' && !saving) onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, saving, onClose]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.name.trim()) { setError('El nombre del proyecto es requerido.'); return; }
    setSaving(true);
    setError('');
    try {
      const created = await dbProjects.create({
        name:        form.name.trim(),
        workspaceId: form.workspaceId || null,
        leaderId:    form.responsableId || null,
        startDate:   form.startDate || null,
        endDate:     form.endDate   || null,
        priority:    form.priority,
        status:      form.status,
        description: form.description,
        tags:        form.area ? [form.area] : [],
        roadmap:     { phases: [], userStories: [], risks: [], meetings: [] },
      });
      onSuccess?.(created);
      setForm(EMPTY);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear el proyecto.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
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

          {/* Workspace */}
          {workspaces.length > 0 && (
            <div style={S.group}>
              <label style={S.label}>Workspace</label>
              <select style={S.select} value={form.workspaceId} onChange={e => set('workspaceId', e.target.value)}>
                <option value="">— Sin workspace</option>
                {workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          )}

          {/* Responsable + Área */}
          <div style={S.row}>
            <div>
              <label style={S.label}>Responsable</label>
              <select style={S.select} value={form.responsableId} onChange={e => set('responsableId', e.target.value)}>
                <option value="">— Sin asignar</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Área</label>
              <select style={S.select} value={form.area} onChange={e => set('area', e.target.value)}>
                <option value="">— Seleccionar</option>
                {AREA_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
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
          <button style={{ ...S.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={handleSubmit} disabled={saving}>
            <Save size={15} />
            {saving ? 'Guardando...' : 'Guardar ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}
