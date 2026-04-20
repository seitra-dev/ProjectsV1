import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ListChecks,
  TextCursorInput,
  CalendarDays,
  Hash,
  CheckSquare,
  Link2,
  ArrowLeft,
  Trash2,
  X,
} from 'lucide-react';
import { DESIGN_TOKENS } from '../../styles/tokens';
import { dbProjects } from '../../lib/database';

const FIELD_TYPES = [
  { id: 'select', label: 'Lista desplegable', Icon: ListChecks },
  { id: 'text', label: 'Texto', Icon: TextCursorInput },
  { id: 'date', label: 'Fecha', Icon: CalendarDays },
  { id: 'number', label: 'Número', Icon: Hash },
  { id: 'checkbox', label: 'Casilla', Icon: CheckSquare },
  { id: 'url', label: 'URL', Icon: Link2 },
];

const CLICKUP_OPTION_COLORS = [
  '#7B68EE', '#3397DD', '#1BBC9C', '#EAB308', '#F97316', '#EC4899',
  '#22C55E', '#6366F1', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16',
];

function nextOptionColor(index) {
  return CLICKUP_OPTION_COLORS[index % CLICKUP_OPTION_COLORS.length];
}

/**
 * Flujo dos pasos estilo ClickUp: tipo → configuración → guardado en custom_field_definitions.
 */
export default function CreateCustomFieldFlow({
  open,
  onClose,
  project,
  onSuccess,
  anchorRect = null,
}) {
  const [step, setStep] = useState('select_type');
  const [selectedType, setSelectedType] = useState(null);
  const [fieldName, setFieldName] = useState('');
  const [options, setOptions] = useState([]);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setStep('select_type');
      setSelectedType(null);
      setFieldName('');
      setOptions([]);
      setNewOptionLabel('');
      setError('');
      setSaving(false);
    }
  }, [open]);

  const typeMeta = FIELD_TYPES.find((t) => t.id === selectedType);

  const handlePickType = (typeId) => {
    setSelectedType(typeId);
    setStep('configure_field');
    setError('');
  };

  const goBack = () => {
    setStep('select_type');
    setSelectedType(null);
    setFieldName('');
    setOptions([]);
    setNewOptionLabel('');
    setError('');
  };

  const addOptionFromInput = () => {
    const label = newOptionLabel.trim();
    if (!label) return;
    setOptions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label, color: nextOptionColor(prev.length) },
    ]);
    setNewOptionLabel('');
  };

  const updateOption = (id, patch) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  };

  const removeOption = (id) => {
    setOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const handleCreate = async () => {
    if (!project?.id) {
      setError('No hay proyecto seleccionado');
      return;
    }
    if (!fieldName.trim()) {
      setError('El nombre del campo es obligatorio');
      return;
    }
    if (selectedType === 'select') {
      const validOpts = options.filter((o) => o.label.trim());
      if (validOpts.length === 0) {
        setError('Añade al menos una opción');
        return;
      }
    }

    setSaving(true);
    setError('');
    try {
      const defs = project.customFieldDefinitions || [];
      const newDef = {
        id: crypto.randomUUID(),
        name: fieldName.trim(),
        type: selectedType,
        ...(selectedType === 'select'
          ? {
              options: options
                .filter((o) => o.label.trim())
                .map((o) => ({
                  id: o.id,
                  label: o.label.trim(),
                  color: o.color || nextOptionColor(0),
                })),
            }
          : {}),
      };
      const updated = await dbProjects.update(project.id, {
        customFieldDefinitions: [...defs, newDef],
      });
      onSuccess?.(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo crear el campo');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const panelPosition = anchorRect
    ? {
        position: 'fixed',
        top: anchorRect.bottom + 8,
        left: Math.max(
          12,
          Math.min(
            anchorRect.left,
            (typeof window !== 'undefined' ? window.innerWidth : 400) - 372
          )
        ),
      }
    : {
        position: 'fixed',
        top: '12%',
        left: '50%',
        transform: 'translateX(-50%)',
      };

  const panel = {
    ...panelPosition,
    width: 360,
    maxHeight: 'min(480px, calc(100vh - 48px))',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: 'white',
    borderRadius: DESIGN_TOKENS.border.radius.md,
    boxShadow: DESIGN_TOKENS.shadows.xl,
    border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
    zIndex: 10050,
    fontFamily: DESIGN_TOKENS.typography.fontFamily,
  };

  const rowBtn = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '12px 14px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: DESIGN_TOKENS.typography.size.sm,
    color: DESIGN_TOKENS.neutral[800],
    borderRadius: DESIGN_TOKENS.border.radius.xs,
    transition: `background ${DESIGN_TOKENS.transition.fast}`,
  };

  const inputBase = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    fontSize: DESIGN_TOKENS.typography.size.sm,
    border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
    borderRadius: DESIGN_TOKENS.border.radius.sm,
    outline: 'none',
    fontFamily: DESIGN_TOKENS.typography.fontFamily,
    color: DESIGN_TOKENS.neutral[800],
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10040,
          background: 'rgba(31, 41, 51, 0.12)',
        }}
        aria-hidden
        onClick={onClose}
      />
      <div style={panel} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {step === 'select_type' && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
              }}
            >
              <span
                style={{
                  fontSize: DESIGN_TOKENS.typography.size.sm,
                  fontWeight: DESIGN_TOKENS.typography.weight.semibold,
                  color: DESIGN_TOKENS.neutral[800],
                }}
              >
                Agregar columna
              </span>
              <button
                type="button"
                onClick={onClose}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 4,
                  cursor: 'pointer',
                  color: DESIGN_TOKENS.neutral[500],
                  borderRadius: DESIGN_TOKENS.border.radius.xs,
                  display: 'flex',
                }}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '6px 8px 10px', overflowY: 'auto' }}>
              {FIELD_TYPES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handlePickType(id)}
                  style={rowBtn}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = DESIGN_TOKENS.neutral[50];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Icon size={18} strokeWidth={2} color={DESIGN_TOKENS.neutral[600]} style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: DESIGN_TOKENS.typography.weight.medium }}>{label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'configure_field' && selectedType === 'select' && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 14px',
                borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
              }}
            >
              <button
                type="button"
                onClick={goBack}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 4,
                  cursor: 'pointer',
                  color: DESIGN_TOKENS.neutral[600],
                  display: 'flex',
                  borderRadius: DESIGN_TOKENS.border.radius.xs,
                }}
                aria-label="Volver"
              >
                <ArrowLeft size={20} />
              </button>
              <span
                style={{
                  fontSize: DESIGN_TOKENS.typography.size.sm,
                  fontWeight: DESIGN_TOKENS.typography.weight.semibold,
                  color: DESIGN_TOKENS.neutral[800],
                }}
              >
                Lista desplegable
              </span>
            </div>
            <div style={{ padding: 14, overflowY: 'auto', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: DESIGN_TOKENS.typography.weight.semibold,
                  color: DESIGN_TOKENS.neutral[500],
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                Nombre del campo
              </label>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="p. ej. Estado de revisión"
                style={{ ...inputBase, marginBottom: 16 }}
                autoFocus
              />

              <div
                style={{
                  fontSize: 11,
                  fontWeight: DESIGN_TOKENS.typography.weight.semibold,
                  color: DESIGN_TOKENS.neutral[500],
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                Opciones desplegables
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {options.map((opt) => (
                  <div
                    key={opt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <label
                      style={{
                        position: 'relative',
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: opt.color,
                        flexShrink: 0,
                        cursor: 'pointer',
                        boxShadow: `0 0 0 1px ${DESIGN_TOKENS.border.color.normal}`,
                      }}
                      title="Color"
                    >
                      <input
                        type="color"
                        value={opt.color?.startsWith('#') && opt.color.length >= 7 ? opt.color : '#7B68EE'}
                        onChange={(e) => updateOption(opt.id, { color: e.target.value })}
                        style={{
                          position: 'absolute',
                          opacity: 0,
                          width: '100%',
                          height: '100%',
                          cursor: 'pointer',
                          inset: 0,
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => updateOption(opt.id, { label: e.target.value })}
                      placeholder="Etiqueta"
                      style={{ ...inputBase, flex: 1, padding: '8px 10px' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(opt.id)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 6,
                        cursor: 'pointer',
                        color: DESIGN_TOKENS.neutral[400],
                        borderRadius: DESIGN_TOKENS.border.radius.xs,
                        display: 'flex',
                      }}
                      aria-label="Eliminar opción"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <input
                type="text"
                value={newOptionLabel}
                onChange={(e) => setNewOptionLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOptionFromInput();
                  }
                }}
                placeholder="+ Agregar opción"
                style={{
                  ...inputBase,
                  borderStyle: 'dashed',
                  background: DESIGN_TOKENS.neutral[50],
                }}
              />

              {error ? (
                <div style={{ fontSize: DESIGN_TOKENS.typography.size.xs, color: DESIGN_TOKENS.danger.base, marginTop: 12 }}>
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                disabled={saving}
                onClick={handleCreate}
                style={{
                  marginTop: 16,
                  width: '100%',
                  padding: '10px 16px',
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
                {saving ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </>
        )}

        {step === 'configure_field' && selectedType && selectedType !== 'select' && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 14px',
                borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
              }}
            >
              <button
                type="button"
                onClick={goBack}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 4,
                  cursor: 'pointer',
                  color: DESIGN_TOKENS.neutral[600],
                  display: 'flex',
                  borderRadius: DESIGN_TOKENS.border.radius.xs,
                }}
                aria-label="Volver"
              >
                <ArrowLeft size={20} />
              </button>
              <span
                style={{
                  fontSize: DESIGN_TOKENS.typography.size.sm,
                  fontWeight: DESIGN_TOKENS.typography.weight.semibold,
                  color: DESIGN_TOKENS.neutral[800],
                }}
              >
                {typeMeta?.label || 'Campo'}
              </span>
            </div>
            <div style={{ padding: 14, overflowY: 'auto', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: DESIGN_TOKENS.typography.weight.semibold,
                  color: DESIGN_TOKENS.neutral[500],
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                Nombre del campo
              </label>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="Nombre"
                style={{ ...inputBase, marginBottom: 16 }}
                autoFocus
              />
              {error ? (
                <div style={{ fontSize: DESIGN_TOKENS.typography.size.xs, color: DESIGN_TOKENS.danger.base, marginBottom: 12 }}>
                  {error}
                </div>
              ) : null}
              <button
                type="button"
                disabled={saving}
                onClick={handleCreate}
                style={{
                  width: '100%',
                  padding: '10px 16px',
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
                {saving ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
