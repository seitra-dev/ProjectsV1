import React, { useState } from 'react';
import { X, Flag, Save } from 'lucide-react';
import { dbProjects } from '../lib/database';

// ============================================================================
// ESTILOS (compartidos con otros modales)
// ============================================================================
const S = {
  overlay: {
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
  },
  content: {
    background: 'white', borderRadius: '16px', maxWidth: '620px', width: '100%',
    maxHeight: '90vh', overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', margin: '0 16px',
  },
  header: {
    padding: '24px', borderBottom: '1px solid #f3f4f6',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    position: 'sticky', top: 0, background: 'white', zIndex: 1, borderRadius: '16px 16px 0 0',
  },
  title: { fontSize: '20px', fontWeight: 700, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 },
  iconBox: { background: '#f5f3ff', borderRadius: '10px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  form: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#374151' },
  input: {
    width: '100%', padding: '11px 14px', border: '1px solid #d1d5db', borderRadius: '8px',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1f2937',
  },
  select: {
    width: '100%', padding: '11px 14px', border: '1px solid #d1d5db', borderRadius: '8px',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    color: '#1f2937', background: 'white', cursor: 'pointer',
  },
  textarea: {
    width: '100%', padding: '11px 14px', border: '1px solid #d1d5db', borderRadius: '8px',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    color: '#1f2937', resize: 'vertical', minHeight: '84px',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  footer: {
    padding: '20px 24px', borderTop: '1px solid #f3f4f6',
    display: 'flex', justifyContent: 'flex-end', gap: '12px',
    position: 'sticky', bottom: 0, background: 'white',
  },
  btnPrimary: {
    padding: '11px 24px', background: '#8b5cf6', color: 'white', border: 'none',
    borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit',
  },
  btnSecondary: {
    padding: '11px 24px', background: 'white', color: '#6b7280', border: '1px solid #d1d5db',
    borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
  },
  error: { padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px' },
};

const PHASE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

const EMPTY = { name: '', projectId: '', responsableId: '', startDate: '', endDate: '', description: '', color: '#8b5cf6' };

// ============================================================================
// COMPONENTE
// ============================================================================
export default function CreateMilestoneModal({ open, onClose, projects = [], users = [], defaultProjectId = null, onSuccess }) {
  const [form, setForm]     = useState({ ...EMPTY, projectId: defaultProjectId || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.name.trim())  { setError('El nombre del hito es requerido.'); return; }
    if (!form.projectId)    { setError('Selecciona el proyecto padre.'); return; }
    setSaving(true);
    setError('');
    try {
      // Cargar el proyecto actual para obtener el roadmap vigente
      const project = await dbProjects.getById(form.projectId);
      const currentPhases = project.roadmap?.phases || [];

      const newPhase = {
        id:            `phase-${Date.now()}`,
        name:          form.name.trim(),
        description:   form.description || '',
        startDate:     form.startDate || null,
        endDate:       form.endDate   || null,
        responsableId: form.responsableId || null,
        color:         form.color,
        tasks:         [],
      };

      const updatedProject = await dbProjects.update(project.id, {
        roadmap: {
          ...project.roadmap,
          phases: [...currentPhases, newPhase],
        },
      });

      onSuccess?.(updatedProject, newPhase);
      setForm({ ...EMPTY, projectId: defaultProjectId || '' });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear el hito.');
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
            <span style={S.iconBox}><Flag size={20} color="#8b5cf6" /></span>
            Nuevo Hito / Fase
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} color="#9ca3af" />
          </button>
        </div>

        {/* FORMULARIO */}
        <div style={S.form}>
          {error && <div style={S.error}>{error}</div>}

          {/* Nombre */}
          <div>
            <label style={S.label}>Nombre del hito *</label>
            <input
              style={S.input}
              placeholder="Ej: Fase 1 - Análisis de requerimientos"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>

          {/* Proyecto padre */}
          <div>
            <label style={S.label}>Proyecto padre *</label>
            <select style={S.select} value={form.projectId} onChange={e => set('projectId', e.target.value)}>
              <option value="">— Seleccionar proyecto</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Responsable + Color */}
          <div style={S.row}>
            <div>
              <label style={S.label}>Responsable</label>
              <select style={S.select} value={form.responsableId} onChange={e => set('responsableId', e.target.value)}>
                <option value="">— Sin asignar</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Color del hito</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                {PHASE_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('color', c)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', background: c, border: 'none',
                      cursor: 'pointer', flexShrink: 0,
                      outline: form.color === c ? `3px solid ${c}` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
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

          {/* Descripción */}
          <div>
            <label style={S.label}>Notas / Descripción</label>
            <textarea
              style={S.textarea}
              placeholder="Describe los objetivos de este hito..."
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
