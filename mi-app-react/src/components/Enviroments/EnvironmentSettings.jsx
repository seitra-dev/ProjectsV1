import React, { useState } from 'react';
import { X, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DESIGN_TOKENS } from '../../styles/tokens.js';

// ============================================================================
// ENVIRONMENT SETTINGS MODAL
// ============================================================================

const COLORS = [
  '#484B5B', '#7E57C2', '#2196F3', '#EC4899', '#9C27B0', 
  '#5E92F3', '#FF9800', '#009688', '#8D6E63', '#26A69A'
];

const EnvironmentSettings = ({ isOpen, onClose }) => {
  const { currentEnvironment, updateEnvironment, deleteEnvironment, currentUser } = useApp();
  
  const [formData, setFormData] = useState({
    name: currentEnvironment?.name || '',
    avatar: currentEnvironment?.icon || '',
    logoRound: null,
    logoRect: null,
    logoSocial: null,
    customUrl: '',
    enableBranding: false,
    selectedColor: currentEnvironment?.color || COLORS[0]
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const isOwner = currentEnvironment?.ownerId === currentUser?.id;

  const handleSave = () => {
    if (!currentEnvironment) return;
    
    updateEnvironment(currentEnvironment.id, {
      name: formData.name,
      icon: formData.avatar,
      color: formData.selectedColor
    });
    
    onClose();
  };

  const handleDelete = () => {
    if (deleteConfirmText === currentEnvironment?.name) {
      deleteEnvironment(currentEnvironment.id);
      onClose();
    }
  };

  if (!isOpen || !currentEnvironment) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #E8E8ED',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            margin: 0,
            color: '#1D1D1F'
          }}>
            Ajustes del entorno de trabajo
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#86868B',
              padding: '8px',
              display: 'flex',
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F7'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '32px' }}>
          {/* GENERAL */}
          <section style={{ marginBottom: '40px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1D1D1F',
              marginBottom: '24px'
            }}>
              General
            </h3>

            {/* Avatar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: '1px solid #F5F5F7'
            }}>
              <span style={{ fontSize: '15px', color: '#1D1D1F' }}>Avatar</span>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: formData.selectedColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: 'white',
                fontWeight: 700
              }}>
                {formData.avatar}
              </div>
            </div>

            {/* Nombre */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: '1px solid #F5F5F7'
            }}>
              <span style={{ fontSize: '15px', color: '#1D1D1F' }}>Nombre</span>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #E8E8ED',
                  borderRadius: '8px',
                  fontSize: '14px',
                  width: '300px',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = DESIGN_TOKENS.primary.base}
                onBlur={(e) => e.currentTarget.style.borderColor = '#E8E8ED'}
              />
            </div>
          </section>

          {/* MARCA PERSONALIZADA */}
          <section style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#1D1D1F',
                margin: 0
              }}>
                Marca personalizada
              </h3>
              <span style={{
                padding: '4px 8px',
                background: '#E3F2FD',
                color: '#1976D2',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                Enterprise
              </span>
            </div>

            {/* Habilitar marca */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: '1px solid #F5F5F7'
            }}>
              <span style={{ fontSize: '15px', color: '#1D1D1F' }}>
                Habilitar marca personalizada
              </span>
              <label style={{
                position: 'relative',
                display: 'inline-block',
                width: '44px',
                height: '24px'
              }}>
                <input
                  type="checkbox"
                  checked={formData.enableBranding}
                  onChange={(e) => setFormData({ ...formData, enableBranding: e.target.checked })}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  inset: 0,
                  background: formData.enableBranding ? DESIGN_TOKENS.primary.base : '#CBD2D9',
                  borderRadius: '24px',
                  transition: '0.3s'
                }}>
                  <span style={{
                    position: 'absolute',
                    height: '18px',
                    width: '18px',
                    left: formData.enableBranding ? '23px' : '3px',
                    bottom: '3px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: '0.3s'
                  }} />
                </span>
              </label>
            </div>

            {/* Logos */}
            <LogoUpload 
              label="Logotipo redondo"
              description="Recomendamos un archivo PNG de 72 x 72 px. Este logotipo se utiliza en la aplicación como avatar de tu entorno de trabajo."
              value={formData.logoRound}
              onChange={(file) => setFormData({ ...formData, logoRound: file })}
            />

            <LogoUpload 
              label="Logotipo de rectángulo"
              description="Recomendamos un archivo PNG de 232 x 48 px. Este logotipo aparece en correos electrónicos, en la pantalla de inicio de sesión y en enlaces públicos a elementos como formularios, documentos, paneles y tareas."
              value={formData.logoRect}
              onChange={(file) => setFormData({ ...formData, logoRect: file })}
            />

            <LogoUpload 
              label="Gráfico de redes sociales"
              description="Recomendamos un archivo PNG de 500 x 260 px. Este gráfico sirve como imagen de vista previa cuando se comparten enlaces de ClickUp."
              value={formData.logoSocial}
              onChange={(file) => setFormData({ ...formData, logoSocial: file })}
            />

            {/* Esquema de colores */}
            <div style={{
              padding: '16px 0',
              borderBottom: '1px solid #F5F5F7'
            }}>
              <div style={{ marginBottom: '12px', fontSize: '15px', color: '#1D1D1F', fontWeight: 500 }}>
                Esquema de colores
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, selectedColor: color })}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: color,
                      border: formData.selectedColor === color ? '3px solid #1D1D1F' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                ))}
              </div>
            </div>

            {/* URL personalizada */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0'
            }}>
              <span style={{ fontSize: '15px', color: '#1D1D1F' }}>URL personalizada</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  value={formData.customUrl}
                  onChange={(e) => setFormData({ ...formData, customUrl: e.target.value })}
                  placeholder="app"
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #E8E8ED',
                    borderRadius: '8px 0 0 8px',
                    fontSize: '14px',
                    width: '150px',
                    outline: 'none'
                  }}
                />
                <span style={{
                  padding: '8px 12px',
                  background: '#F5F5F7',
                  border: '1px solid #E8E8ED',
                  borderLeft: 'none',
                  borderRadius: '0 8px 8px 0',
                  fontSize: '14px',
                  color: '#86868B'
                }}>
                  .clickup.com
                </span>
              </div>
            </div>
          </section>

          {/* ZONA DE PELIGRO */}
          <section style={{
            marginTop: '40px',
            padding: '24px',
            background: '#FEF2F2',
            borderRadius: '12px',
            border: '1px solid #FEE2E2'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#DC2626',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={20} />
              Zona de peligro
            </h3>

            {/* Transferir propiedad */}
            {isOwner && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 0',
                borderBottom: '1px solid #FEE2E2'
              }}>
                <div>
                  <div style={{ fontSize: '15px', color: '#1D1D1F', fontWeight: 500, marginBottom: '4px' }}>
                    Transferir la propiedad absoluta a otra persona
                  </div>
                  <div style={{ fontSize: '13px', color: '#86868B' }}>
                    Solo el propietario puede eliminar el entorno
                  </div>
                </div>
                <button
                  style={{
                    padding: '8px 16px',
                    background: 'white',
                    border: '1px solid #E8E8ED',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    color: '#1D1D1F'
                  }}
                >
                  Seleccionar nuevo propietario
                </button>
              </div>
            )}

            {/* Eliminar entorno */}
            {isOwner && (
              <div style={{ paddingTop: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '15px', color: '#DC2626', fontWeight: 500, marginBottom: '4px' }}>
                    Eliminar este entorno de trabajo para siempre
                  </div>
                  <div style={{ fontSize: '13px', color: '#86868B' }}>
                    Esta acción no se puede deshacer
                  </div>
                </div>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      padding: '10px 20px',
                      background: '#DC2626',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Trash2 size={16} />
                    Eliminar el entorno de trabajo
                  </button>
                ) : (
                  <div style={{
                    padding: '16px',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #FEE2E2'
                  }}>
                    <p style={{ fontSize: '14px', marginBottom: '12px', color: '#1D1D1F' }}>
                      Escribe <strong>{currentEnvironment.name}</strong> para confirmar la eliminación:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={currentEnvironment.name}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #E8E8ED',
                        borderRadius: '8px',
                        fontSize: '14px',
                        marginBottom: '12px',
                        outline: 'none'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'white',
                          border: '1px solid #E8E8ED',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleteConfirmText !== currentEnvironment.name}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: deleteConfirmText === currentEnvironment.name ? '#DC2626' : '#FCA5A5',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: deleteConfirmText === currentEnvironment.name ? 'pointer' : 'not-allowed',
                          color: 'white'
                        }}
                      >
                        Eliminar permanentemente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* FOOTER */}
        <div style={{
          padding: '20px 32px',
          borderTop: '1px solid #E8E8ED',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          position: 'sticky',
          bottom: 0,
          background: 'white'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: 'white',
              border: '1px solid #E8E8ED',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              color: '#1D1D1F'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 24px',
              background: DESIGN_TOKENS.primary.base,
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              color: 'white'
            }}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// LOGO UPLOAD COMPONENT
// ============================================================================
const LogoUpload = ({ label, description, value, onChange }) => {
  return (
    <div style={{
      padding: '16px 0',
      borderBottom: '1px solid #F5F5F7'
    }}>
      <div style={{ marginBottom: '8px', fontSize: '15px', color: '#1D1D1F', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: '13px', color: '#86868B', marginBottom: '12px', lineHeight: 1.5 }}>
        {description}
      </div>
      <button
        style={{
          padding: '8px 16px',
          background: 'white',
          border: '1px solid #E8E8ED',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          color: '#1D1D1F',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <Upload size={16} />
        Agregar
      </button>
    </div>
  );
};

export default EnvironmentSettings;