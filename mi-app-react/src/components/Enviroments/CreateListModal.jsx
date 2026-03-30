import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DESIGN_TOKENS } from '../../styles/tokens';

const CreateListModal = ({ isOpen, onClose, onSave, preselectedWorkspaceId }) => {
  const { currentWorkspace, currentEnvironment, environments, createList, currentUser } = useApp();

  // Calcular workspaces disponibles según el entorno seleccionado
  const getWorkspacesForEnv = (envId) => {
    const env = environments?.find(e => e.id === envId);
    return env?.workspaces || [];
  };

  const defaultEnvId = currentWorkspace?.environment_id || currentEnvironment?.id || null;
  const defaultWsId = preselectedWorkspaceId || currentWorkspace?.id || null;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    workspaceId: defaultWsId,
    environmentId: defaultEnvId,
    isPrivate: false,
    useTemplate: false
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!formData.environmentId) {
      newErrors.environment = 'Debes seleccionar un entorno';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      const newList = await createList({
        name: formData.name.trim(),
        description: formData.description,
        workspaceId: formData.workspaceId,
        environmentId: formData.environmentId,
        isPrivate: formData.isPrivate,
        createdBy: currentUser?.id || null,
      });
      // Reset form
      setFormData({
        name: '',
        description: '',
        workspaceId: defaultWsId,
        environmentId: defaultEnvId,
        isPrivate: false,
        useTemplate: false
      });
      setErrors({});
      onSave(newList);
    } catch (err) {
      setErrors({ submit: err.message || 'Error al crear la lista' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      workspaceId: defaultWsId,
      environmentId: defaultEnvId,
      isPrivate: false,
      useTemplate: false
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '2rem',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '540px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'slideUp 0.3s ease'
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: '24px 24px 20px',
          borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 700,
              margin: 0,
              color: DESIGN_TOKENS.neutral[800]
            }}>
              Crear una lista
            </h2>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: DESIGN_TOKENS.neutral[400],
                padding: '4px',
                borderRadius: '4px',
                display: 'flex'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = DESIGN_TOKENS.neutral[100]}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              <X size={20} />
            </button>
          </div>
          <p style={{
            fontSize: '14px',
            color: DESIGN_TOKENS.neutral[600],
            margin: 0,
            lineHeight: 1.5
          }}>
            Todas las listas se encuentran ubicadas en un espacio. Las listas pueden albergar cualquier tipo de tarea.
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* NAME */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: DESIGN_TOKENS.neutral[700],
              marginBottom: '8px'
            }}>
              Nombre
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setErrors({ ...errors, name: null });
              }}
              placeholder="e.g. Project, List of items, Campaign"
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.name ? DESIGN_TOKENS.danger.base : DESIGN_TOKENS.border.color.normal}`,
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: DESIGN_TOKENS.typography.fontFamily,
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!errors.name) {
                  e.currentTarget.style.borderColor = DESIGN_TOKENS.primary.base;
                }
              }}
              onBlur={(e) => {
                if (!errors.name) {
                  e.currentTarget.style.borderColor = DESIGN_TOKENS.border.color.normal;
                }
              }}
            />
            {errors.name && (
              <div style={{
                fontSize: '12px',
                color: DESIGN_TOKENS.danger.base,
                marginTop: '4px'
              }}>
                {errors.name}
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: DESIGN_TOKENS.neutral[700],
              marginBottom: '8px'
            }}>
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Cuéntanos un poco sobre tu lista (opcional)"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: DESIGN_TOKENS.typography.fontFamily,
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = DESIGN_TOKENS.primary.base}
              onBlur={(e) => e.currentTarget.style.borderColor = DESIGN_TOKENS.border.color.normal}
            />
          </div>

          {/* ENVIRONMENT */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: DESIGN_TOKENS.neutral[700],
              marginBottom: '8px'
            }}>
              Equipo (ubicación)
            </label>
            <select
              value={formData.environmentId || ''}
              onChange={(e) => {
                setFormData({ ...formData, environmentId: e.target.value, workspaceId: null });
                setErrors({ ...errors, environment: null });
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.environment ? DESIGN_TOKENS.danger.base : DESIGN_TOKENS.border.color.normal}`,
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                background: 'white',
                cursor: 'pointer',
                fontFamily: DESIGN_TOKENS.typography.fontFamily,
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!errors.environment) {
                  e.currentTarget.style.borderColor = DESIGN_TOKENS.primary.base;
                }
              }}
              onBlur={(e) => {
                if (!errors.environment) {
                  e.currentTarget.style.borderColor = DESIGN_TOKENS.border.color.normal;
                }
              }}
            >
              <option value="">Seleccionar entorno...</option>
              {environments?.map(env => (
                <option key={env.id} value={env.id}>
                  {env.icon} {env.name}
                </option>
              ))}
            </select>
            {errors.environment && (
              <div style={{
                fontSize: '12px',
                color: DESIGN_TOKENS.danger.base,
                marginTop: '4px'
              }}>
                {errors.environment}
              </div>
            )}
          </div>

          {/* WORKSPACE */}
          {formData.environmentId && getWorkspacesForEnv(formData.environmentId).length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: DESIGN_TOKENS.neutral[700],
                marginBottom: '8px'
              }}>
                Espacio
              </label>
              <select
                value={formData.workspaceId || ''}
                onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value || null })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'white',
                  cursor: 'pointer',
                  fontFamily: DESIGN_TOKENS.typography.fontFamily,
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = DESIGN_TOKENS.primary.base}
                onBlur={(e) => e.currentTarget.style.borderColor = DESIGN_TOKENS.border.color.normal}
              >
                <option value="">Sin espacio específico</option>
                {getWorkspacesForEnv(formData.environmentId).map(ws => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* PRIVATE TOGGLE */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 0',
            borderTop: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
            borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
            marginBottom: '20px'
          }}>
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: DESIGN_TOKENS.neutral[800],
                marginBottom: '4px'
              }}>
                Hacer privado
              </div>
              <div style={{
                fontSize: '13px',
                color: DESIGN_TOKENS.neutral[500]
              }}>
                Solo tú y los miembros invitados tienen acceso
              </div>
            </div>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '44px',
              height: '24px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                inset: 0,
                background: formData.isPrivate ? DESIGN_TOKENS.primary.base : '#E8E8ED',
                borderRadius: '24px',
                transition: '0.3s'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '18px',
                  width: '18px',
                  left: formData.isPrivate ? '23px' : '3px',
                  bottom: '3px',
                  background: 'white',
                  borderRadius: '50%',
                  transition: '0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </span>
            </label>
          </div>

          {/* TEMPLATE CHECKBOX */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            marginBottom: '24px'
          }}>
            <input
              type="checkbox"
              checked={formData.useTemplate}
              onChange={(e) => setFormData({ ...formData, useTemplate: e.target.checked })}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: DESIGN_TOKENS.primary.base
              }}
            />
            <span style={{
              fontSize: '14px',
              color: DESIGN_TOKENS.neutral[700]
            }}>
              Utilizar plantilla
            </span>
          </label>

          {/* FOOTER */}
          {errors.submit && (
            <div style={{ fontSize: '13px', color: DESIGN_TOKENS.danger.base, marginBottom: '12px' }}>
              {errors.submit}
            </div>
          )}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              style={{
                padding: '10px 20px',
                background: 'white',
                border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                color: DESIGN_TOKENS.neutral[700],
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = DESIGN_TOKENS.neutral[50]; }}
              onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = 'white'; }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 20px',
                background: saving ? DESIGN_TOKENS.neutral[400] : DESIGN_TOKENS.primary.base,
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                color: 'white',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = DESIGN_TOKENS.primary.dark; }}
              onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = DESIGN_TOKENS.primary.base; }}
            >
              {saving ? 'Guardando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CreateListModal;