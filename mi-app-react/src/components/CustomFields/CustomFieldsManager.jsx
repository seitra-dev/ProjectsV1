import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Users,
  Layers,
  CalendarClock,
  StickyNote,
  GripHorizontal,
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

/** Campos inteligentes: se persisten con is_preset + preset_type */
const SUGGESTED_PRESETS = [
  {
    preset_type: 'project_responsible',
    name: 'Responsable del proyecto',
    label: 'Responsable del proyecto',
    subtitle: 'Miembros del proyecto',
    fieldType: 'member_select',
    Icon: Users,
    accent: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
  },
  {
    preset_type: 'roadmap_phase',
    name: 'Fase del proyecto',
    label: 'Fase del proyecto',
    subtitle: 'Sincronizado con el roadmap',
    fieldType: 'roadmap_sync',
    Icon: Layers,
    accent: '#0EA5E9',
    bg: 'rgba(14, 165, 233, 0.12)',
  },
  {
    preset_type: 'review_date',
    name: 'Fecha de revisión',
    label: 'Fecha de revisión',
    subtitle: 'Campo fecha rápido',
    fieldType: 'date',
    Icon: CalendarClock,
    accent: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.14)',
  },
  {
    preset_type: 'notes',
    name: 'Notas',
    label: 'Notas',
    subtitle: 'Texto libre',
    fieldType: 'text',
    Icon: StickyNote,
    accent: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
  },
];

const CLICKUP_OPTION_COLORS = [
  '#7B68EE', '#3397DD', '#1BBC9C', '#EAB308', '#F97316', '#EC4899',
  '#22C55E', '#6366F1', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16',
];

function nextOptionColor(index) {
  return CLICKUP_OPTION_COLORS[index % CLICKUP_OPTION_COLORS.length];
}

const PANEL_W = 360;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Gestor de columnas personalizadas: modal flotante arrastrable, sugeridos y flujo por tipo.
 */
export default function CustomFieldsManager({
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

  const [panelPos, setPanelPos] = useState({ left: 80, top: 80 });
  const panelPosRef = useRef(panelPos);
  panelPosRef.current = panelPos;

  useEffect(() => {
    if (!open) {
      setStep('select_type');
      setSelectedType(null);
      setFieldName('');
      setOptions([]);
      setNewOptionLabel('');
      setError('');
      setSaving(false);
      return;
    }
    if (typeof window === 'undefined') return;
    if (anchorRect) {
      setPanelPos({
        left: clamp(anchorRect.left, 8, window.innerWidth - PANEL_W - 8),
        top: clamp(anchorRect.bottom + 8, 8, window.innerHeight - 120),
      });
    } else {
      setPanelPos({
        left: Math.max(8, (window.innerWidth - PANEL_W) / 2),
        top: Math.max(8, window.innerHeight * 0.1),
      });
    }
  }, [open, anchorRect]);

  const onDragHandleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const start = {
      x: e.clientX,
      y: e.clientY,
      left: panelPosRef.current.left,
      top: panelPosRef.current.top,
    };

    const onMove = (ev) => {
      if (typeof window === 'undefined') return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      setPanelPos({
        left: clamp(start.left + dx, 8, window.innerWidth - PANEL_W - 8),
        top: clamp(start.top + dy, 8, window.innerHeight - 80),
      });
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const typeMeta = FIELD_TYPES.find((t) => t.id === selectedType);

  const handlePickType = (typeId) => {
    setSelectedType(typeId);
    setStep('configure_field');
    setError('');
    setFieldName('');
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

  const appendDefinition = async (newDef) => {
    if (!project?.id) throw new Error('No hay proyecto seleccionado');
    const defs = project.customFieldDefinitions || [];
    return dbProjects.update(project.id, {
      customFieldDefinitions: [...defs, newDef],
    });
  };

  const handlePreset = async (preset) => {
    if (!project?.id) {
      setError('No hay proyecto seleccionado');
      return;
    }
    const defs = project.customFieldDefinitions || [];
    if (defs.some((d) => d.is_preset && d.preset_type === preset.preset_type)) {
      setError('Este campo sugerido ya está añadido');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const newDef = {
        id: crypto.randomUUID(),
        name: preset.name,
        type: preset.fieldType,
        is_preset: true,
        preset_type: preset.preset_type,
      };
      const updated = await appendDefinition(newDef);
      onSuccess?.(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo crear el campo');
    } finally {
      setSaving(false);
    }
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
      const newDef = {
        id: crypto.randomUUID(),
        name: fieldName.trim(),
        type: selectedType,
        is_preset: false,
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
      const updated = await appendDefinition(newDef);
      onSuccess?.(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'No se pudo crear el campo');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

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

  const panelStyle = {
    position: 'fixed',
    left: panelPos.left,
    top: panelPos.top,
    width: PANEL_W,
    maxHeight: 'min(520px, calc(100vh - 24px))',
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
      <div style={panelStyle} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {step === 'select_type' && (
          <>
            <div
              onMouseDown={onDragHandleMouseDown}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '10px 12px',
                borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
                cursor: 'grab',
                userSelect: 'none',
                background: DESIGN_TOKENS.neutral[50],
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                <GripHorizontal size={18} color={DESIGN_TOKENS.neutral[400]} style={{ flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: DESIGN_TOKENS.typography.size.sm,
                    fontWeight: DESIGN_TOKENS.typography.weight.semibold,
                    color: DESIGN_TOKENS.neutral[800],
                  }}
                >
                  Agregar columna
                </span>
              </div>
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
            <div style={{ padding: '8px 8px 12px', overflowY: 'auto', flex: 1 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: DESIGN_TOKENS.typography.weight.bold,
                  color: DESIGN_TOKENS.neutral[400],
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '4px 8px 8px',
                }}
              >
                Sugerido
              </div>
              {SUGGESTED_PRESETS.map((preset) => {
                const Icon = preset.Icon;
                return (
                  <button
                    key={preset.preset_type}
                    type="button"
                    disabled={saving}
                    onClick={() => handlePreset(preset)}
                    style={{
                      ...rowBtn,
                      marginBottom: 4,
                      background: preset.bg,
                      border: `1px solid ${preset.accent}33`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.filter = 'brightness(0.97)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = 'none';
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'white',
                        flexShrink: 0,
                        boxShadow: DESIGN_TOKENS.shadows.xs,
                      }}
                    >
                      <Icon size={20} strokeWidth={2.2} color={preset.accent} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: DESIGN_TOKENS.typography.weight.semibold, color: DESIGN_TOKENS.neutral[800] }}>
                        {preset.label}
                      </div>
                      <div style={{ fontSize: 11, color: DESIGN_TOKENS.neutral[500], marginTop: 2 }}>
                        {preset.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}

              {error ? (
                <div style={{ fontSize: DESIGN_TOKENS.typography.size.xs, color: DESIGN_TOKENS.danger.base, padding: '8px 8px 0' }}>
                  {error}
                </div>
              ) : null}

              <div
                style={{
                  fontSize: 10,
                  fontWeight: DESIGN_TOKENS.typography.weight.bold,
                  color: DESIGN_TOKENS.neutral[400],
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '14px 8px 8px',
                  marginTop: 4,
                  borderTop: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
                }}
              >
                Tipo de campo
              </div>
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
              onMouseDown={onDragHandleMouseDown}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
                cursor: 'grab',
                background: DESIGN_TOKENS.neutral[50],
                userSelect: 'none',
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
              <GripHorizontal size={16} color={DESIGN_TOKENS.neutral[400]} />
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
                  <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              onMouseDown={onDragHandleMouseDown}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
                cursor: 'grab',
                background: DESIGN_TOKENS.neutral[50],
                userSelect: 'none',
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
              <GripHorizontal size={16} color={DESIGN_TOKENS.neutral[400]} />
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
