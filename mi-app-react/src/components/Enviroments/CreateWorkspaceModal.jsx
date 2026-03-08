import React, { useState } from 'react';
import { 
  X, ChevronDown, Search,
  Briefcase, Target, Rocket, Zap, Palette, Beaker, BarChart3, Lightbulb,
  Building2, Wrench, TrendingUp, Star, Flame, Laptop, Smartphone, GraduationCap,
  Trophy, Boxes, Drama, Video, Music, Gamepad2, Flag, Heart,
  Plane, Globe, Users, Sun, Moon, Sparkles, Gem, Gift,
  Code, Database, Settings, Lock, Mail, MessageSquare, Calendar, FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext-OLD.jsx';
import { DESIGN_TOKENS } from '../../styles/tokens.js';


const ICON_OPTIONS = [
  { icon: Briefcase, name: 'Briefcase' },
  { icon: Target, name: 'Target' },
  { icon: Rocket, name: 'Rocket' },
  { icon: Zap, name: 'Zap' },
  { icon: Palette, name: 'Palette' },
  { icon: Beaker, name: 'Beaker' },
  { icon: BarChart3, name: 'BarChart' },
  { icon: Lightbulb, name: 'Lightbulb' },
  { icon: Building2, name: 'Building' },
  { icon: Wrench, name: 'Wrench' },
  { icon: TrendingUp, name: 'TrendingUp' },
  { icon: Star, name: 'Star' },
  { icon: Flame, name: 'Flame' },
  { icon: Laptop, name: 'Laptop' },
  { icon: Smartphone, name: 'Smartphone' },
  { icon: GraduationCap, name: 'GraduationCap' },
  { icon: Trophy, name: 'Trophy' },
  { icon: Boxes, name: 'Boxes' },
  { icon: Drama, name: 'Drama' },
  { icon: Video, name: 'Video' },
  { icon: Music, name: 'Music' },
  { icon: Gamepad2, name: 'Gamepad' },
  { icon: Flag, name: 'Flag' },
  { icon: Heart, name: 'Heart' },
  { icon: Plane, name: 'Plane' },
  { icon: Globe, name: 'Globe' },
  { icon: Users, name: 'Users' },
  { icon: Sun, name: 'Sun' },
  { icon: Moon, name: 'Moon' },
  { icon: Sparkles, name: 'Sparkles' },
  { icon: Gem, name: 'Gem' },
  { icon: Gift, name: 'Gift' },
  { icon: Code, name: 'Code' },
  { icon: Database, name: 'Database' },
  { icon: Settings, name: 'Settings' },
  { icon: Lock, name: 'Lock' },
  { icon: Mail, name: 'Mail' },
  { icon: MessageSquare, name: 'MessageSquare' },
  { icon: Calendar, name: 'Calendar' },
  { icon: FileText, name: 'FileText' }
];

const CreateWorkspaceModal = ({ isOpen, onClose }) => {
  const { currentEnvironment, createWorkspace } = useApp();
  
  const [formData, setFormData] = useState({
    iconName: 'Briefcase',
    name: '',
    description: '',
    permission: 'full',
    isPrivate: false,
    useTemplate: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPermissionDropdown, setShowPermissionDropdown] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');

  const permissionOptions = [
    { value: 'full', label: 'Edición completa', desc: 'Puede editar todo' },
    { value: 'edit', label: 'Puede editar', desc: 'Puede editar contenido' },
    { value: 'comment', label: 'Puede comentar', desc: 'Solo comentarios' },
    { value: 'view', label: 'Solo ver', desc: 'Solo lectura' }
  ];

  const selectedIcon = ICON_OPTIONS.find(opt => opt.name === formData.iconName) || ICON_OPTIONS[0];
  const SelectedIconComponent = selectedIcon.icon;

  const filteredIcons = ICON_OPTIONS.filter(opt => 
    opt.name.toLowerCase().includes(iconSearch.toLowerCase())
  );

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
    
    if (!validate() || !currentEnvironment) return;

    setIsSubmitting(true);

    try {
      await createWorkspace(currentEnvironment.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        settings: {
          icon: formData.iconName,
          visibility: formData.isPrivate ? 'specific_members' : 'all_members',
          permission: formData.permission
        },
        modules: []
      });

      // Reset form
      setFormData({
        iconName: 'Briefcase',
        name: '',
        description: '',
        permission: 'full',
        isPrivate: false,
        useTemplate: false
      });

      onClose();
    } catch (error) {
      console.error('Error creating workspace:', error);
      setErrors({ submit: 'Error al crear el espacio' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      iconName: 'Briefcase',
      name: '',
      description: '',
      permission: 'full',
      isPrivate: false,
      useTemplate: false
    });
    setErrors({});
    setShowIconPicker(false);
    setIconSearch('');
    onClose();
  };

  if (!isOpen) return null;

  const selectedPermission = permissionOptions.find(p => p.value === formData.permission);

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
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: '24px 24px 20px',
          borderBottom: '1px solid #E8E8ED',
          position: 'relative'
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 600, 
            margin: 0,
            color: '#1D1D1F'
          }}>
            Crear un espacio
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#86868B',
            margin: '4px 0 0 0'
          }}>
            Un espacio representa a los equipos, departamentos o grupos, cada uno con sus propias listas, flujos de trabajo y ajustes.
          </p>
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#86868B',
              padding: '4px',
              display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* ICON & NAME */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1D1D1F'
            }}>
              Icono y nombre
            </label>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              {/* ICON SELECTOR */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: DESIGN_TOKENS.primary.base,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <SelectedIconComponent size={28} />
                </button>

                {/* ICON PICKER GRID */}
                {showIconPicker && (
                  <div style={{
                    position: 'absolute',
                    top: '64px',
                    left: 0,
                    background: 'white',
                    border: '1px solid #E8E8ED',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    zIndex: 100,
                    width: '320px',
                    maxHeight: '380px'
                  }}>
                    {/* SEARCH */}
                    <div style={{ 
                      position: 'relative',
                      marginBottom: '12px'
                    }}>
                      <Search 
                        size={16} 
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#86868B'
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={iconSearch}
                        onChange={(e) => setIconSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px 8px 36px',
                          border: '1px solid #E8E8ED',
                          borderRadius: '8px',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* ICONS GRID */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(8, 1fr)',
                      gap: '4px',
                      maxHeight: '280px',
                      overflowY: 'auto',
                      padding: '4px'
                    }}>
                      {filteredIcons.map(({ icon: IconComponent, name }) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, iconName: name });
                            setShowIconPicker(false);
                            setIconSearch('');
                          }}
                          title={name}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: formData.iconName === name ? `2px solid ${DESIGN_TOKENS.primary.base}` : '2px solid transparent',
                            borderRadius: '8px',
                            background: formData.iconName === name ? DESIGN_TOKENS.primary.lightest : 'transparent',
                            color: formData.iconName === name ? DESIGN_TOKENS.primary.base : '#3E4C59',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s',
                            padding: 0
                          }}
                          onMouseEnter={(e) => {
                            if (formData.iconName !== name) {
                              e.currentTarget.style.background = '#F5F5F7';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (formData.iconName !== name) {
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                        >
                          <IconComponent size={18} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* NAME INPUT */}
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="P. ej. Marketing, Ingeniería, Recursos Humanos"
                style={{
                  flex: 1,
                  padding: '16px',
                  border: errors.name ? '1px solid #FF3D71' : '1px solid #E8E8ED',
                  borderRadius: '8px',
                  fontSize: '15px',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  if (!errors.name) {
                    e.currentTarget.style.borderColor = DESIGN_TOKENS.primary.base;
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.name ? '#FF3D71' : '#E8E8ED';
                }}
              />
            </div>
            {errors.name && (
              <span style={{
                fontSize: '12px',
                color: '#FF3D71',
                marginTop: '6px',
                display: 'block'
              }}>
                {errors.name}
              </span>
            )}
          </div>

          {/* DESCRIPTION */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1D1D1F'
            }}>
              Descripción<span style={{ color: '#86868B', fontWeight: 400 }}>(opcional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #E8E8ED',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = DESIGN_TOKENS.primary.base;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E8E8ED';
              }}
            />
          </div>

          {/* PERMISSION DROPDOWN */}
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1D1D1F'
            }}>
              <Users size={16} />
              Permiso predeterminado
            </label>
            
            <button
              type="button"
              onClick={() => setShowPermissionDropdown(!showPermissionDropdown)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: 'white',
                border: '1px solid #E8E8ED',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#1D1D1F'
              }}
            >
              <span>{selectedPermission?.label}</span>
              <ChevronDown size={16} style={{
                transform: showPermissionDropdown ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s'
              }} />
            </button>

            {showPermissionDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                background: 'white',
                border: '1px solid #E8E8ED',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                zIndex: 10,
                overflow: 'hidden'
              }}>
                {permissionOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, permission: option.value });
                      setShowPermissionDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: formData.permission === option.value ? '#F5F5F7' : 'white',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderBottom: '1px solid #F5F5F7'
                    }}
                    onMouseEnter={(e) => {
                      if (formData.permission !== option.value) {
                        e.currentTarget.style.background = '#FAFBFC';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (formData.permission !== option.value) {
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#1D1D1F' }}>
                      {option.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#86868B', marginTop: '2px' }}>
                      {option.desc}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRIVACY TOGGLE */}
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            background: '#FAFBFC',
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1D1D1F', marginBottom: '4px' }}>
                  Hacer privada
                </div>
                <div style={{ fontSize: '13px', color: '#86868B' }}>
                  Solo tú y los miembros invitados tienen acceso
                </div>
              </div>
              <label style={{
                position: 'relative',
                display: 'inline-block',
                width: '44px',
                height: '24px',
                flexShrink: 0
              }}>
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  inset: 0,
                  background: formData.isPrivate ? DESIGN_TOKENS.primary.base : '#CBD2D9',
                  borderRadius: '24px',
                  transition: '0.3s'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '18px',
                    width: '18px',
                    left: formData.isPrivate ? '23px' : '3px',
                    bottom: '3px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: '0.3s'
                  }} />
                </span>
              </label>
            </div>
          </div>

          {/* TEMPLATE OPTION */}
          <div style={{ marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, useTemplate: !formData.useTemplate })}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'white',
                border: '1px solid #E8E8ED',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                color: '#1D1D1F',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{formData.useTemplate ? '☑' : '☐'}</span>
              Utilizar plantilla
            </button>
          </div>

          {/* ACTIONS */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '14px',
              background: isSubmitting ? '#CBD2D9' : '#1D1D1F',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = '#3E4C59';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.background = '#1D1D1F';
              }
            }}
          >
            {isSubmitting ? 'Creando...' : 'Continuar'}
          </button>

          {errors.submit && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: '#FEE2E2',
              borderRadius: '8px',
              color: '#DC2626',
              fontSize: '13px'
            }}>
              {errors.submit}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateWorkspaceModal;