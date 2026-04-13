import React, { useState } from 'react';
import { X } from 'lucide-react';
import { DESIGN_TOKENS } from '../../styles/tokens';
import { dbProjects } from '../../lib/database';

const FIELD_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
];

export default function AddCustomFieldModal({ open, onClose, project, onSaved }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!project?.id) {
      setError('No hay proyecto seleccionado');
      return;
    }
    if (!name.trim()) {
      setError('Indica un nombre para el campo');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const defs = project.customFieldDefinitions || [];
      const newDef = {
        id: crypto.randomUUID(),
        name: name.trim(),
        type,
      };
      const updated = await dbProjects.update(project.id, {
        customFieldDefinitions: [...defs, newDef],
      });
      onSaved?.(updated);
      setName('');
      setType('text');
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el campo');
    } finally {
      setSaving(false);
    }
  };

  const overlay = {
    position: 'fixed',
    inset: 0,
    zIndex: 10020,
    background: 'rgba(31, 41, 51, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DESIGN_TOKENS.spacing.lg,
    fontFamily: DESIGN_TOKENS.typography.fontFamily,
  };

  const panel = {
    width: '100%',
    maxWidth: '400px',
    background: 'white',
    borderRadius: DESIGN_TOKENS.border.radius.md,
    boxShadow: DESIGN_TOKENS.shadows.xl,
    border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
    padding: DESIGN_TOKENS.spacing.xl,
  };

  return (
    <div style={overlay} onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-custom-field-title"
        onClick={(e) => e.stopPropagation()}
        style={panel}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: DESIGN_TOKENS.spacing.lg }}>
          <h2 id="add-custom-field-title" style={{ margin: 0, fontSize: DESIGN_TOKENS.typography.size.lg, fontWeight: DESIGN_TOKENS.typography.weight.semibold, color: DESIGN_TOKENS.neutral[800] }}>
            Nuevo campo personalizado
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: DESIGN_TOKENS.neutral[500],
              padding: 4,
              borderRadius: DESIGN_TOKENS.border.radius.xs,
              display: 'flex',
            }}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: DESIGN_TOKENS.typography.size.xs, fontWeight: DESIGN_TOKENS.typography.weight.medium, color: DESIGN_TOKENS.neutral[600], marginBottom: 6 }}>
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              fontSize: DESIGN_TOKENS.typography.size.sm,
              border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
              borderRadius: DESIGN_TOKENS.border.radius.sm,
              marginBottom: DESIGN_TOKENS.spacing.lg,
              outline: 'none',
              fontFamily: DESIGN_TOKENS.typography.fontFamily,
            }}
          />

          <label style={{ display: 'block', fontSize: DESIGN_TOKENS.typography.size.xs, fontWeight: DESIGN_TOKENS.typography.weight.medium, color: DESIGN_TOKENS.neutral[600], marginBottom: 6 }}>
            Tipo
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              fontSize: DESIGN_TOKENS.typography.size.sm,
              border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
              borderRadius: DESIGN_TOKENS.border.radius.sm,
              marginBottom: DESIGN_TOKENS.spacing.lg,
              background: 'white',
              fontFamily: DESIGN_TOKENS.typography.fontFamily,
            }}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {error ? (
            <div style={{ fontSize: DESIGN_TOKENS.typography.size.xs, color: DESIGN_TOKENS.danger.base, marginBottom: DESIGN_TOKENS.spacing.md }}>
              {error}
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: DESIGN_TOKENS.spacing.sm, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                borderRadius: DESIGN_TOKENS.border.radius.sm,
                background: 'white',
                color: DESIGN_TOKENS.neutral[700],
                fontSize: DESIGN_TOKENS.typography.size.sm,
                fontWeight: DESIGN_TOKENS.typography.weight.medium,
                cursor: 'pointer',
                fontFamily: DESIGN_TOKENS.typography.fontFamily,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: DESIGN_TOKENS.border.radius.sm,
                background: saving ? DESIGN_TOKENS.neutral[300] : DESIGN_TOKENS.primary.base,
                color: 'white',
                fontSize: DESIGN_TOKENS.typography.size.sm,
                fontWeight: DESIGN_TOKENS.typography.weight.semibold,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: DESIGN_TOKENS.typography.fontFamily,
              }}
            >
              {saving ? 'Guardando…' : 'Añadir campo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
