import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { DESIGN_TOKENS } from '../../styles/tokens';

// ============================================================================
// ADD CUSTOM FIELD MODAL - Modal para crear nuevas columnas personalizadas
// ============================================================================
function AddCustomFieldModal({ isOpen, onClose, onSave }) {
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [options, setOptions] = useState(['']);
  const [required, setRequired] = useState(false);
  const [showInTable, setShowInTable] = useState(true);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!fieldName.trim()) {
      alert('El nombre del campo es requerido');
      return;
    }

    if (fieldType === 'select' && options.filter(o => o.trim()).length === 0) {
      alert('Agrega al menos una opción para el campo de selección');
      return;
    }

    const fieldData = {
      name: fieldName.trim(),
      type: fieldType,
      options: fieldType === 'select' ? options.filter(o => o.trim()) : [],
      required,
      showInTable
    };

    onSave(fieldData);
    handleClose();
  };

  const handleClose = () => {
    setFieldName('');
    setFieldType('text');
    setOptions(['']);
    setRequired(false);
    setShowInTable(true);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
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
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: DESIGN_TOKENS.shadows.xl
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: '24px',
          borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 700,
              margin: 0,
              color: DESIGN_TOKENS.neutral[900]
            }}>
              Agregar columna personalizada
            </h3>
            <p style={{
              fontSize: '14px',
              color: DESIGN_TOKENS.neutral[600],
              margin: '4px 0 0'
            }}>
              Crea un campo personalizado para tus tareas
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              color: DESIGN_TOKENS.neutral[500]
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Nombre del campo */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: DESIGN_TOKENS.neutral[700]
            }}>
              Nombre del campo
            </label>
            <input
              type="text"
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="Ej: Cliente, Presupuesto, Estado interno..."
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
              autoFocus
            />
          </div>

          {/* Tipo de campo */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: DESIGN_TOKENS.neutral[700]
            }}>
              Tipo de campo
            </label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="text">Texto</option>
              <option value="select">Lista desplegable</option>
              <option value="number">Número</option>
              <option value="date">Fecha</option>
              <option value="checkbox">Casilla de verificación</option>
              <option value="url">URL / Enlace</option>
            </select>
          </div>

          {/* Opciones (solo para tipo select) */}
          {fieldType === 'select' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: DESIGN_TOKENS.neutral[700]
              }}>
                Opciones de la lista
              </label>
              {options.map((option, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Opción ${index + 1}`}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      style={{
                        padding: '10px',
                        background: DESIGN_TOKENS.danger.lightest,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: DESIGN_TOKENS.danger.base,
                        display: 'flex'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                style={{
                  padding: '8px 16px',
                  background: DESIGN_TOKENS.neutral[100],
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: DESIGN_TOKENS.neutral[700],
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={14} />
                Agregar opción
              </button>
            </div>
          )}

          {/* Opciones adicionales */}
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            background: DESIGN_TOKENS.neutral[50],
            borderRadius: '8px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>
                Campo requerido
              </span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={showInTable}
                onChange={(e) => setShowInTable(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>
                Mostrar en tabla de tareas
              </span>
            </label>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                flex: 1,
                padding: '12px',
                background: 'white',
                border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: DESIGN_TOKENS.neutral[700]
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px',
                background: DESIGN_TOKENS.primary.base,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                color: 'white'
              }}
            >
              Crear campo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCustomFieldModal;