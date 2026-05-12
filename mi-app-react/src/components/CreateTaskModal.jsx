import React, { useState, useMemo } from 'react';
import { X, CheckSquare, Save } from 'lucide-react';
import { dbTasks } from '../lib/database';
import { TASK_STATUS_DROPDOWN } from '../constants/statuses';
import SelectDropdown from './shared/SelectDropdown';

// ============================================================================
// ESTILOS
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
  iconBox: { background: '#ecfdf5', borderRadius: '10px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
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
    padding: '11px 24px', background: '#10b981', color: 'white', border: 'none',
    borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit',
  },
  btnSecondary: {
    padding: '11px 24px', background: 'white', color: '#6b7280', border: '1px solid #d1d5db',
    borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
  },
  error: { padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px' },
  hint: { fontSize: '11px', color: '#9ca3af', marginTop: '5px' },
};

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high',   label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

const STATUS_OPTIONS = Object.entries(TASK_STATUS_DROPDOWN).map(([value, cfg]) => ({ value, label: cfg.label }));

const EMPTY = {
  name: '', projectId: '', milestoneId: '', responsableId: '',
  startDate: '', endDate: '', priority: 'medium', status: 'pending', description: '',
};

// ============================================================================
// COMPONENTE
// ============================================================================
export default function CreateTaskModal({
  open, onClose,
  projects = [],       // array de objetos proyecto (raw de metrics o mapped)
  users = [],
  defaultProjectId = null,
  defaultMilestoneId = null,
  onSuccess,
}) {
  const [form, setForm] = useState({
    ...EMPTY,
    projectId:   defaultProjectId   || '',
    milestoneId: defaultMilestoneId || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Fases/hitos disponibles según el proyecto seleccionado
  const milestones = useMemo(() => {
    if (!form.projectId) return [];
    const project = projects.find(p => p.id === form.projectId);
    return project?.roadmap?.phases || [];
  }, [form.projectId, projects]);

  // Si cambia el proyecto, limpiar milestone seleccionado
  const handleProjectChange = (projectId) => {
    setForm(prev => ({ ...prev, projectId, milestoneId: '' }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.name.trim()) { setError('El nombre de la tarea es requerido.'); return; }
    if (!form.projectId)   { setError('Selecciona el proyecto.'); return; }
    setSaving(true);
    setError('');
    try {
      const created = await dbTasks.create({
        title:          form.name.trim(),
        projectId:      form.projectId,
        roadmapPhaseId: form.milestoneId || null,
        assigneeId:     form.responsableId || null,
        startDate:      form.startDate || null,
        dueDate:        form.endDate   || null,
        priority:       form.priority,
        status:         form.status,
        description:    form.description,
      });
      onSuccess?.(created);
      setForm({ ...EMPTY, projectId: defaultProjectId || '', milestoneId: defaultMilestoneId || '' });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear la tarea.');
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
            <span style={S.iconBox}><CheckSquare size={20} color="#10b981" /></span>
            Nueva Tarea
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
            <label style={S.label}>Nombre de la tarea *</label>
            <input
              style={S.input}
              placeholder="Ej: Levantamiento de requerimientos"
              value={form.name}
              onChange={e => set('name', e.target.value)}
            />
          </div>

          {/* Proyecto + Hito */}
          <div style={S.row}>
            <div>
              <label style={S.label}>Proyecto *</label>
              <SelectDropdown style={{ width: '100%' }} value={form.projectId} onChange={e => handleProjectChange(e.target.value)}
                options={[{ value: '', label: '— Seleccionar proyecto' }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
            </div>
            <div>
              <label style={S.label}>Hito / Fase</label>
              <SelectDropdown
                style={{ width: '100%' }}
                value={form.milestoneId}
                onChange={e => set('milestoneId', e.target.value)}
                disabled={milestones.length === 0}
                options={[{ value: '', label: '— Sin hito' }, ...milestones.map(ph => ({ value: ph.id, label: ph.name }))]}
              />
              {form.projectId && milestones.length === 0 && (
                <div style={S.hint}>Este proyecto no tiene hitos creados aún.</div>
              )}
            </div>
          </div>

          {/* Responsable */}
          <div>
            <label style={S.label}>Responsable</label>
            <SelectDropdown style={{ width: '100%' }} value={form.responsableId} onChange={e => set('responsableId', e.target.value)}
              options={[{ value: '', label: '— Sin asignar' }, ...users.map(u => ({ value: u.id, label: u.name || u.email }))]} />
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
              <SelectDropdown style={{ width: '100%' }} value={form.priority} onChange={e => set('priority', e.target.value)}
                options={PRIORITY_OPTIONS.map(o => ({ ...o, dot: { low: '#64748b', medium: '#3b82f6', high: '#f59e0b', urgent: '#ef4444' }[o.value] }))} />
            </div>
            <div>
              <label style={S.label}>Estado</label>
              <SelectDropdown style={{ width: '100%' }} value={form.status} onChange={e => set('status', e.target.value)}
                options={STATUS_OPTIONS.map(o => ({ ...o, dot: TASK_STATUS_DROPDOWN[o.value]?.color }))} />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label style={S.label}>Notas / Descripción</label>
            <textarea
              style={S.textarea}
              placeholder="Detalla el alcance de la tarea..."
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
