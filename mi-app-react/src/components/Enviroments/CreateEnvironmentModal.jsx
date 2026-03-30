import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DESIGN_TOKENS } from '/src/styles/tokens';

// ============================================================================
// CREATE ENVIRONMENT MODAL
// ============================================================================

const EMOJI_OPTIONS = ['📁', '💼', '🎯', '🚀', '⚡', '🎨', '🔬', '📊', '💡', '🏢', '🛠️', '📈'];

const COLOR_OPTIONS = [
  '#0066FF', // Primary blue
  '#00D68F', // Success green
  '#FFAB00', // Warning orange
  '#FF3D71', // Danger red
  '#0095FF', // Info blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Emerald
];

const CreateEnvironmentModal = ({ isOpen, onClose }) => {
  const { createEnvironment, currentUser } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📁',
    color: '#0066FF'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await createEnvironment({
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon: formData.icon,
        color: formData.color
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        icon: '📁',
        color: '#0066FF'
      });

      onClose();
    } catch (error) {
      console.error('Error creating environment:', error);
      setErrors({ submit: 'Error al crear el entorno' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      icon: '📁',
      color: '#0066FF'
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
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
        animation: 'modalOverlayFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: DESIGN_TOKENS.border.radius.lg,
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.08)`,
          border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          animation: 'modalContentSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          zIndex: 10
        }}>
          <h3 style={{ 
            fontSize: DESIGN_TOKENS.typography.size['2xl'], 
            fontWeight: DESIGN_TOKENS.typography.weight.bold, 
            margin: 0, 
            color: DESIGN_TOKENS.neutral[800],
            letterSpacing: DESIGN_TOKENS.typography.letterSpacing.tight
          }}>
            Crear Equipo de Trabajo
          </h3>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: DESIGN_TOKENS.neutral[600],
              display: 'flex',
              padding: '8px',
              borderRadius: DESIGN_TOKENS.border.radius.sm,
              transition: `all ${DESIGN_TOKENS.transition.fast}`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = DESIGN_TOKENS.neutral[100];
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* ICON & COLOR PREVIEW */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px',
              background: DESIGN_TOKENS.neutral[50],
              borderRadius: DESIGN_TOKENS.border.radius.md,
              border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: DESIGN_TOKENS.border.radius.md,
                background: formData.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                boxShadow: `0 4px 12px ${formData.color}40`
              }}>
                {formData.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: DESIGN_TOKENS.typography.size.lg,
                  fontWeight: DESIGN_TOKENS.typography.weight.semibold,
                  color: DESIGN_TOKENS.neutral[800],
                  marginBottom: '4px'
                }}>
                  {formData.name || 'Nuevo Equipo'}
                </div>
                <div style={{
                  fontSize: DESIGN_TOKENS.typography.size.sm,
                  color: DESIGN_TOKENS.neutral[500]
                }}>
                  {formData.description || 'Agrega una descripción'}
                </div>
              </div>
            </div>

            {/* NAME */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: DESIGN_TOKENS.typography.size.sm,
                fontWeight: DESIGN_TOKENS.typography.weight.semibold,
                color: errors.name ? DESIGN_TOKENS.danger.base : DESIGN_TOKENS.neutral[800]
              }}>
                Nombre del entorno *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej. Datos, Riesgos, Producto..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${errors.name ? DESIGN_TOKENS.danger.base : DESIGN_TOKENS.border.color.normal}`,
                  borderRadius: DESIGN_TOKENS.border.radius.sm,
                  fontSize: DESIGN_TOKENS.typography.size.base,
                  outline: 'none',
                  transition: `all ${DESIGN_TOKENS.transition.fast}`,
                  background: 'white'
                }}
                onFocus={(e) => {
                  if (!errors.name) {
                    e.currentTarget.style.borderColor = DESIGN_TOKENS.primary.base;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${DESIGN_TOKENS.primary.lightest}`;
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.name ? DESIGN_TOKENS.danger.base : DESIGN_TOKENS.border.color.normal;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {errors.name && (
                <span style={{
                  fontSize: DESIGN_TOKENS.typography.size.xs,
                  color: DESIGN_TOKENS.danger.base,
                  marginTop: '6px',
                  display: 'block'
                }}>
                  {errors.name}
                </span>
              )}
            </div>

            {/* DESCRIPTION */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: DESIGN_TOKENS.typography.size.sm,
                fontWeight: DESIGN_TOKENS.typography.weight.semibold,
                color: DESIGN_TOKENS.neutral[800]
              }}>
                Descripción (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el propósito de este entorno..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                  borderRadius: DESIGN_TOKENS.border.radius.sm,
                  fontSize: DESIGN_TOKENS.typography.size.base,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: DESIGN_TOKENS.typography.fontFamily,
                  transition: `all ${DESIGN_TOKENS.transition.fast}`
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = DESIGN_TOKENS.primary.base;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${DESIGN_TOKENS.primary.lightest}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = DESIGN_TOKENS.border.color.normal;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* ICON SELECTOR */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: DESIGN_TOKENS.typography.size.sm,
                fontWeight: DESIGN_TOKENS.typography.weight.semibold,
                color: DESIGN_TOKENS.neutral[800]
              }}>
                Icono
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '8px'
              }}>
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: emoji })}
                    style={{
                      padding: '12px',
                      fontSize: '24px',
                      border: `2px solid ${formData.icon === emoji ? DESIGN_TOKENS.primary.base : DESIGN_TOKENS.border.color.subtle}`,
                      borderRadius: DESIGN_TOKENS.border.radius.sm,
                      background: formData.icon === emoji ? DESIGN_TOKENS.primary.lightest : 'white',
                      cursor: 'pointer',
                      transition: `all ${DESIGN_TOKENS.transition.fast}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (formData.icon !== emoji) {
                        e.currentTarget.style.background = DESIGN_TOKENS.neutral[50];
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (formData.icon !== emoji) {
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* COLOR SELECTOR */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: DESIGN_TOKENS.typography.size.sm,
                fontWeight: DESIGN_TOKENS.typography.weight.semibold,
                color: DESIGN_TOKENS.neutral[800]
              }}>
                Color
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '8px'
              }}>
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      background: color,
                      border: `3px solid ${formData.color === color ? DESIGN_TOKENS.neutral[800] : 'transparent'}`,
                      borderRadius: DESIGN_TOKENS.border.radius.sm,
                      cursor: 'pointer',
                      transition: `all ${DESIGN_TOKENS.transition.fast}`,
                      boxShadow: `0 2px 8px ${color}40`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* ERROR MESSAGE */}
          {errors.submit && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: DESIGN_TOKENS.danger.light,
              borderRadius: DESIGN_TOKENS.border.radius.sm,
              color: DESIGN_TOKENS.danger.base,
              fontSize: DESIGN_TOKENS.typography.size.sm
            }}>
              {errors.submit}
            </div>
          )}

          {/* ACTIONS */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            paddingTop: '24px',
            marginTop: '24px',
            borderTop: `1px solid ${DESIGN_TOKENS.border.color.subtle}`
          }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: DESIGN_TOKENS.neutral[100],
                color: DESIGN_TOKENS.neutral[800],
                border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                borderRadius: DESIGN_TOKENS.border.radius.md,
                fontSize: DESIGN_TOKENS.typography.size.base,
                fontWeight: DESIGN_TOKENS.typography.weight.semibold,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: `all ${DESIGN_TOKENS.transition.normal}`,
                opacity: isSubmitting ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = DESIGN_TOKENS.neutral[200];
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = DESIGN_TOKENS.neutral[100];
                }
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: isSubmitting ? DESIGN_TOKENS.neutral[300] : DESIGN_TOKENS.primary.base,
                color: 'white',
                border: 'none',
                borderRadius: DESIGN_TOKENS.border.radius.md,
                fontSize: DESIGN_TOKENS.typography.size.base,
                fontWeight: DESIGN_TOKENS.typography.weight.semibold,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: `all ${DESIGN_TOKENS.transition.normal}`,
                boxShadow: DESIGN_TOKENS.shadows.sm
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = DESIGN_TOKENS.primary.dark;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = DESIGN_TOKENS.shadows.md;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = DESIGN_TOKENS.primary.base;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = DESIGN_TOKENS.shadows.sm;
                }
              }}
            >
              {isSubmitting ? 'Creando...' : 'Crear Equipo'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalOverlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalContentSlideIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CreateEnvironmentModal;