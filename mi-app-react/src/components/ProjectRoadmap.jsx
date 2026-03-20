import React, { useState } from 'react';
import { 
  Plus, ChevronDown, ChevronRight, Edit, Trash2, Check, X,
  Home, Clipboard, FileText, AlertTriangle, Calendar, Target, CheckCircle2, AlertCircle, Users, TrendingUp, Map
} from 'lucide-react';
import { DESIGN_TOKENS } from '../styles/tokens';

// ============================================================================
// PROJECT ROADMAP - Dynamic Component
// ============================================================================

const ProjectRoadmap = ({ project, onProjectUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Inicializar estructura si no existe
  const roadmapData = project.roadmap || {
    phases: [],
    userStories: [],
    risks: [],
    meetings: []
  };

  const updateRoadmap = (updates) => {
    onProjectUpdate({
      ...project,
      roadmap: {
        ...roadmapData,
        ...updates
      }
    });
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: Home, color: '#6366f1' },
    { id: 'plan', label: 'Plan de Trabajo', icon: Clipboard, color: '#0ea5e9' },
    { id: 'stories', label: 'Historias de Usuario', icon: FileText, color: '#10b981' },
    { id: 'risks', label: 'Riesgos', icon: AlertTriangle, color: '#f59e0b' },
    { id: 'meetings', label: 'Seguimiento', icon: Calendar, color: '#8b5cf6' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: DESIGN_TOKENS.neutral[50],
      fontFamily: DESIGN_TOKENS.typography.fontFamily
    }}>
      {/* HEADER */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            padding: '12px 0'
          }}>
            {/* Project Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 800,
                color: 'white',
                background: `linear-gradient(135deg, ${DESIGN_TOKENS.primary.base}, ${DESIGN_TOKENS.primary.dark})`,
                boxShadow: DESIGN_TOKENS.shadows.md
              }}>
                {project.name?.charAt(0) || 'P'}
              </div>
              <div>
                <p style={{
                  fontWeight: 800,
                  color: DESIGN_TOKENS.neutral[800],
                  fontSize: '14px',
                  lineHeight: '1.2',
                  margin: 0
                }}>
                  {project.name}
                </p>
                <p style={{
                  fontSize: '12px',
                  color: DESIGN_TOKENS.neutral[500],
                  lineHeight: '1.2',
                  margin: 0
                }}>
                  {project.description || 'Plan de Proyecto'}
                </p>
              </div>
            </div>

            <div style={{
              width: '1px',
              height: '32px',
              background: DESIGN_TOKENS.border.color.normal
            }} />

            {/* Navigation Tabs */}
            <nav style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflowX: 'auto',
              flex: 1
            }}>
              {tabs.map(tab => (
                <NavTab
                  key={tab.id}
                  label={tab.label}
                  icon={tab.icon}
                  color={tab.color}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </nav>

            {/* Status Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: DESIGN_TOKENS.primary.lightest,
              border: `1px solid ${DESIGN_TOKENS.primary.light}`,
              flexShrink: 0
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: DESIGN_TOKENS.primary.base,
                animation: 'pulse 2s ease-in-out infinite'
              }} />
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: DESIGN_TOKENS.primary.dark
              }}>
                {project.status === 'active' ? 'Activo' : 
                 project.status === 'completed' ? 'Completado' : 
                 project.status === 'paused' ? 'En Pausa' : 'Por Iniciar'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE TITLE */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '32px 24px 16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between'
        }}>
          <div>
            <p style={{
              fontSize: '12px',
              fontWeight: 700,
              color: DESIGN_TOKENS.neutral[400],
              textTransform: 'uppercase',
              letterSpacing: '1px',
              margin: '0 0 4px'
            }}>
              Plan de Proyecto
            </p>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 900,
              color: DESIGN_TOKENS.neutral[900],
              margin: 0
            }}>
              {(() => {
                const activeTabData = tabs.find(t => t.id === activeTab);
                const ActiveIcon = activeTabData?.icon;
                return (
                    <>
                    {ActiveIcon && <ActiveIcon size={24} style={{ display: 'inline' }} />}{' '}
                    {activeTabData?.label}
                    </>
                );
                })()}
            </h1>
          </div>
          {project.startDate && project.endDate && (
            <div style={{ textAlign: 'right' }}>
              <p style={{
                fontSize: '12px',
                color: DESIGN_TOKENS.neutral[500],
                margin: '0 0 2px'
              }}>
                Período del proyecto
              </p>
              <p style={{
                fontWeight: 700,
                color: DESIGN_TOKENS.neutral[700],
                fontSize: '14px',
                margin: 0
              }}>
                {project.startDate} → {project.endDate}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px 48px'
      }}>
        {activeTab === 'overview' && (
          <OverviewTab 
            project={project}
            roadmapData={roadmapData}
          />
        )}
        {activeTab === 'plan' && (
          <PlanTab 
            phases={roadmapData.phases || []}
            onUpdate={(phases) => updateRoadmap({ phases })}
          />
        )}
        {activeTab === 'stories' && (
          <StoriesTab 
            stories={roadmapData.userStories || []}
            onUpdate={(userStories) => updateRoadmap({ userStories })}
          />
        )}
        {activeTab === 'risks' && (
          <RisksTab 
            risks={roadmapData.risks || []}
            onUpdate={(risks) => updateRoadmap({ risks })}
          />
        )}
        {activeTab === 'meetings' && (
          <MeetingsTab 
            meetings={roadmapData.meetings || []}
            onUpdate={(meetings) => updateRoadmap({ meetings })}
          />
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// NAV TAB 
// ============================================================================

const NavTab = ({ label, icon: Icon, color, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 16px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: 600,
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      whiteSpace: 'nowrap',
      position: 'relative',
      overflow: 'hidden',
      background: active 
        ? `linear-gradient(135deg, ${color}, ${color}dd)`
        : 'transparent',
      color: active ? 'white' : DESIGN_TOKENS.neutral[600],
      boxShadow: active 
        ? `0 4px 12px ${color}40, 0 2px 4px ${color}20`
        : 'none'
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.background = DESIGN_TOKENS.neutral[100];
        e.currentTarget.style.color = DESIGN_TOKENS.neutral[800];
        e.currentTarget.style.transform = 'translateY(-2px)';
      } else {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
        e.currentTarget.style.boxShadow = `0 6px 16px ${color}50, 0 3px 6px ${color}30`;
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = DESIGN_TOKENS.neutral[600];
        e.currentTarget.style.transform = 'translateY(0)';
      } else {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = `0 4px 12px ${color}40, 0 2px 4px ${color}20`;
      }
    }}
  >
    {/* Shine effect cuando está activo */}
    {active && (
      <div style={{
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        animation: 'navTabShine 3s infinite'
      }} />
    )}
    
    <Icon 
      size={18} 
      style={{
        filter: active ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none',
        transition: 'all 0.3s',
        flexShrink: 0
      }}
    />
    {label}

    <style>{`
      @keyframes navTabShine {
        0% { left: -100%; }
        20% { left: 100%; }
        100% { left: 100%; }
      }
    `}</style>
  </button>
);

// ============================================================================
// OVERVIEW TAB
// ============================================================================

const OverviewTab = ({ project, roadmapData }) => {
  const phases = roadmapData.phases || [];
  const stories = roadmapData.userStories || [];
  const risks = roadmapData.risks || [];
  
  const totalActivities = phases.reduce((sum, p) => sum + (p.activities?.length || 0), 0);
  const totalPoints = stories.reduce((sum, s) => sum + (s.points || 0), 0);
  const criticalRisks = risks.filter(r => r.level === 'critical' || r.level === 'high').length;

  const kpis = [
    { 
      label: 'Fase actual', 
      value: phases.length > 0 ? `1 / ${phases.length}` : '0 / 0',
      sub: phases[0]?.name || 'Sin fases',
      icon: Target,
      gradient: `linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)`
    },
    { 
      label: 'Actividades', 
      value: totalActivities,
      sub: '0 completadas',
      icon: CheckCircle2,
      gradient: `linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)`
    },
    { 
      label: 'Historias de Usuario', 
      value: stories.length,
      sub: `${totalPoints} story points`,
      icon: FileText,
      gradient: `linear-gradient(135deg, #10b981 0%, #059669 100%)`
    },
    { 
      label: 'Riesgos activos', 
      value: criticalRisks,
      sub: 'críticos / altos',
      icon: AlertCircle,
      gradient: `linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)`
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px'
      }}>
        {kpis.map((kpi, i) => {
          const IconComponent = kpi.icon;
          return (
            <div
              key={i}
              style={{
                background: kpi.gradient,
                borderRadius: '16px',
                padding: '24px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              }}
            >
              {/* Decorative pattern */}
              <div style={{
                position: 'absolute',
                right: '-20px',
                top: '-20px',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                filter: 'blur(20px)'
              }} />
              
              <IconComponent 
                size={64}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '16px',
                  opacity: 0.2,
                  strokeWidth: 1.5
                }}
              />
              
              <p style={{
                fontSize: '11px',
                fontWeight: 700,
                opacity: 0.9,
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                margin: '0 0 8px',
                position: 'relative',
                zIndex: 1
              }}>
                {kpi.label}
              </p>
              <p style={{
                fontSize: '36px',
                fontWeight: 900,
                margin: '0 0 4px',
                lineHeight: 1,
                position: 'relative',
                zIndex: 1,
                textShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                {kpi.value}
              </p>
              <p style={{
                fontSize: '12px',
                opacity: 0.85,
                margin: 0,
                position: 'relative',
                zIndex: 1
              }}>
                {kpi.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Timeline Visual */}
      {phases.length > 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          boxShadow: DESIGN_TOKENS.shadows.sm
        }}>
          <h3 style={{
            fontSize: '12px',
            fontWeight: 700,
            color: DESIGN_TOKENS.neutral[400],
            textTransform: 'uppercase',
            letterSpacing: '1px',
            margin: '0 0 24px'
          }}>
            Roadmap del Proyecto
          </h3>
          <PhaseTimeline phases={phases} />
        </div>
      ) : (
        <EmptyState
          icon={Map}
          title="No hay fases definidas"
          description="Comienza agregando fases al plan de trabajo"
        />
      )}
    </div>
  );
};

// ============================================================================
// PHASE TIMELINE
// ============================================================================

const PhaseTimeline = ({ phases }) => {
  return (
    <div style={{ position: 'relative' }}>
      {/* Progress Line */}
      <div style={{
        position: 'absolute',
        top: '28px',
        left: '32px',
        right: '32px',
        height: '2px',
        background: DESIGN_TOKENS.neutral[200]
      }} />
      <div style={{
        position: 'absolute',
        top: '28px',
        left: '32px',
        width: '5%',
        height: '2px',
        background: `linear-gradient(90deg, ${DESIGN_TOKENS.primary.base}, ${DESIGN_TOKENS.primary.dark})`,
        transition: 'width 1s ease'
      }} />

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        {phases.map((phase, i) => (
          <div
            key={phase.id}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              zIndex: 10,
              transition: 'all 0.3s',
              background: i === 0 
                ? `linear-gradient(135deg, ${phase.color || DESIGN_TOKENS.primary.base}22, ${phase.color || DESIGN_TOKENS.primary.base}44)`
                : DESIGN_TOKENS.neutral[100],
              border: i === 0 
                ? `2px solid ${phase.color || DESIGN_TOKENS.primary.base}`
                : `2px solid ${DESIGN_TOKENS.neutral[200]}`,
              opacity: i === 0 ? 1 : 0.5,
              boxShadow: i === 0 ? DESIGN_TOKENS.shadows.lg : 'none'
            }}>
              {phase.icon || '📋'}
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: '12px',
                fontWeight: 700,
                color: i === 0 ? DESIGN_TOKENS.neutral[800] : DESIGN_TOKENS.neutral[400],
                margin: '0 0 2px'
              }}>
                {phase.name}
              </p>
              <p style={{
                fontSize: '11px',
                color: DESIGN_TOKENS.neutral[500],
                margin: 0
              }}>
                {phase.activities?.length || 0} actividades
              </p>
            </div>
            {i === 0 && (
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '12px',
                color: 'white',
                background: phase.color || DESIGN_TOKENS.primary.base
              }}>
                Activa
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// PLAN TAB
// ============================================================================

const PlanTab = ({ phases, onUpdate }) => {
  const [openPhase, setOpenPhase] = useState(phases[0]?.id || null);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddPhase = () => {
    const newPhase = {
      id: Date.now(),
      name: '',
      icon: '📋',
      color: DESIGN_TOKENS.primary.base,
      order: phases.length + 1,
      status: 'pending',
      activities: []
    };
    setIsCreating(true);
    onUpdate([...phases, newPhase]);
    setOpenPhase(newPhase.id);
  };

  const handleUpdatePhase = (phaseId, updates) => {
    onUpdate(phases.map(p => p.id === phaseId ? { ...p, ...updates } : p));
  };

  const handleDeletePhase = (phaseId) => {
    if (confirm('¿Eliminar esta fase?')) {
      onUpdate(phases.filter(p => p.id !== phaseId));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{
        fontSize: '12px',
        color: DESIGN_TOKENS.neutral[500],
        fontWeight: 500,
        margin: 0
      }}>
        Haz clic en una fase para expandirla y ver sus actividades
      </p>

      {phases.map(phase => (
        <PhaseCard
          key={phase.id}
          phase={phase}
          isOpen={openPhase === phase.id}
          isCreating={isCreating && phase.id === openPhase}
          onToggle={() => setOpenPhase(openPhase === phase.id ? null : phase.id)}
          onUpdate={(updates) => handleUpdatePhase(phase.id, updates)}
          onDelete={() => handleDeletePhase(phase.id)}
          onFinishCreating={() => setIsCreating(false)}
        />
      ))}

      <button
        onClick={handleAddPhase}
        style={{
          width: '100%',
          padding: '20px',
          background: 'white',
          border: `2px dashed ${DESIGN_TOKENS.border.color.normal}`,
          borderRadius: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          fontSize: '14px',
          fontWeight: 600,
          color: DESIGN_TOKENS.neutral[500],
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = DESIGN_TOKENS.primary.base;
          e.currentTarget.style.background = DESIGN_TOKENS.primary.lightest;
          e.currentTarget.style.color = DESIGN_TOKENS.primary.dark;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = DESIGN_TOKENS.border.color.normal;
          e.currentTarget.style.background = 'white';
          e.currentTarget.style.color = DESIGN_TOKENS.neutral[500];
        }}
      >
        <Plus size={20} />
        Agregar Nueva Fase
      </button>
    </div>
  );
};

// ============================================================================
// PHASE CARD
// ============================================================================

const PhaseCard = ({ phase, isOpen, isCreating, onToggle, onUpdate, onDelete, onFinishCreating }) => {
  const [isEditing, setIsEditing] = useState(isCreating);
  const [editedName, setEditedName] = useState(phase.name);

  const completedActivities = phase.activities?.filter(a => a.status === 'done').length || 0;
  const totalActivities = phase.activities?.length || 0;
  const progress = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  const handleSaveName = () => {
    if (editedName.trim()) {
      onUpdate({ name: editedName.trim() });
      setIsEditing(false);
      if (isCreating) onFinishCreating();
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
      boxShadow: DESIGN_TOKENS.shadows.sm
    }}>
      {/* Phase Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
      onClick={!isEditing ? onToggle : undefined}
      onMouseEnter={(e) => {
        if (!isEditing) e.currentTarget.style.background = DESIGN_TOKENS.neutral[50];
      }}
      onMouseLeave={(e) => {
        if (!isEditing) e.currentTarget.style.background = 'white';
      }}
      >
        {/* Icon */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0,
          background: `${phase.color || DESIGN_TOKENS.primary.base}18`,
          border: `1.5px solid ${phase.color || DESIGN_TOKENS.primary.base}44`
        }}>
          {phase.icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '6px'
          }}>
            {isEditing ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') {
                    setEditedName(phase.name);
                    setIsEditing(false);
                    if (isCreating) onDelete();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                placeholder="Nombre de la fase..."
                style={{
                  flex: 1,
                  border: `1px solid ${DESIGN_TOKENS.primary.base}`,
                  background: 'white',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  outline: 'none',
                  fontFamily: DESIGN_TOKENS.typography.fontFamily
                }}
              />
            ) : (
              <span style={{
                fontWeight: 700,
                color: DESIGN_TOKENS.neutral[800],
                fontSize: '14px'
              }}>
                Fase {phase.order} — {phase.name || 'Sin nombre'}
              </span>
            )}

            {isEditing && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveName();
                  }}
                  style={{
                    padding: '6px',
                    background: DESIGN_TOKENS.success.base,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex'
                  }}
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditedName(phase.name);
                    setIsEditing(false);
                    if (isCreating) onDelete();
                  }}
                  style={{
                    padding: '6px',
                    background: DESIGN_TOKENS.neutral[200],
                    color: DESIGN_TOKENS.neutral[700],
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {!isEditing && (
              <>
                <span style={{
                  fontSize: '11px',
                  color: DESIGN_TOKENS.neutral[500]
                }}>
                  {totalActivities} actividades
                </span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: phase.color || DESIGN_TOKENS.primary.base
                }}>
                  {completedActivities}/{totalActivities} completadas
                </span>
              </>
            )}
          </div>

          {!isEditing && totalActivities > 0 && (
            <div style={{
              height: '6px',
              background: DESIGN_TOKENS.neutral[200],
              borderRadius: '10px',
              width: '256px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                borderRadius: '10px',
                transition: 'width 0.5s',
                width: `${progress}%`,
                background: phase.color || DESIGN_TOKENS.primary.base
              }} />
            </div>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              style={{
                padding: '8px',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: DESIGN_TOKENS.neutral[500],
                display: 'flex',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = DESIGN_TOKENS.warning.lightest;
                e.currentTarget.style.color = DESIGN_TOKENS.warning.base;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = DESIGN_TOKENS.neutral[500];
              }}
            >
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={{
                padding: '8px',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: DESIGN_TOKENS.neutral[500],
                display: 'flex',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = DESIGN_TOKENS.danger.lightest;
                e.currentTarget.style.color = DESIGN_TOKENS.danger.base;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = DESIGN_TOKENS.neutral[500];
              }}
            >
              <Trash2 size={16} />
            </button>

            {isOpen ? <ChevronDown size={20} color={DESIGN_TOKENS.neutral[400]} /> : <ChevronRight size={20} color={DESIGN_TOKENS.neutral[400]} />}
          </div>
        )}
      </div>

      {/* Activities */}
      {isOpen && !isEditing && (
        <ActivityList
          phase={phase}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

// ============================================================================
// ACTIVITY LIST
// ============================================================================

const ACTIVITY_STATUS = {
  pending:     { label: 'Pendiente',   color: '#94a3b8', bg: '#f1f5f9' },
  in_progress: { label: 'En Progreso', color: '#3b82f6', bg: '#eff6ff' },
  review:      { label: 'En Revisión', color: '#f59e0b', bg: '#fffbeb' },
  done:        { label: 'Completado',  color: '#10b981', bg: '#f0fdf4' },
};

const ActivityList = ({ phase, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = React.useRef(null);

  const activities = phase.activities || [];

  const handleAddActivity = () => {
    const name = newName.trim();
    if (!name) { setIsAdding(false); return; }
    const newActivity = {
      id: Date.now(),
      name,
      status: 'pending',
      dueDate: '',
    };
    onUpdate({ activities: [...activities, newActivity] });
    setNewName('');
    setIsAdding(false);
  };

  const handleToggleDone = (actId) => {
    onUpdate({
      activities: activities.map(a =>
        a.id === actId
          ? { ...a, status: a.status === 'done' ? 'pending' : 'done' }
          : a
      )
    });
  };

  const handleUpdateActivity = (actId, updates) => {
    onUpdate({
      activities: activities.map(a => a.id === actId ? { ...a, ...updates } : a)
    });
  };

  const handleDeleteActivity = (actId) => {
    onUpdate({ activities: activities.filter(a => a.id !== actId) });
  };

  React.useEffect(() => {
    if (isAdding && inputRef.current) inputRef.current.focus();
  }, [isAdding]);

  return (
    <div style={{
      borderTop: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
    }}>
      {/* Activity rows */}
      {activities.length > 0 && (
        <div>
          {activities.map((activity, idx) => (
            <ActivityRow
              key={activity.id}
              activity={activity}
              isLast={idx === activities.length - 1}
              phaseColor={phase.color || DESIGN_TOKENS.primary.base}
              onToggleDone={() => handleToggleDone(activity.id)}
              onUpdate={(updates) => handleUpdateActivity(activity.id, updates)}
              onDelete={() => handleDeleteActivity(activity.id)}
            />
          ))}
        </div>
      )}

      {/* New activity inline form */}
      {isAdding && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 20px',
          borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          background: '#fafbff',
        }}>
          {/* Checkbox placeholder */}
          <div style={{
            width: '18px', height: '18px', borderRadius: '50%',
            border: `2px solid ${DESIGN_TOKENS.neutral[300]}`,
            flexShrink: 0
          }} />
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddActivity();
              if (e.key === 'Escape') { setIsAdding(false); setNewName(''); }
            }}
            placeholder="Nombre de la actividad..."
            style={{
              flex: 1,
              border: `1px solid ${DESIGN_TOKENS.primary.base}`,
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '13px',
              fontFamily: DESIGN_TOKENS.typography.fontFamily,
              outline: 'none',
              color: DESIGN_TOKENS.neutral[800],
            }}
          />
          <button
            onClick={handleAddActivity}
            style={{
              padding: '7px 16px',
              background: DESIGN_TOKENS.primary.base,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <Check size={14} /> Guardar
          </button>
          <button
            onClick={() => { setIsAdding(false); setNewName(''); }}
            style={{
              padding: '7px 10px',
              background: DESIGN_TOKENS.neutral[100],
              color: DESIGN_TOKENS.neutral[600],
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Empty state + Add button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: activities.length === 0 ? 'center' : 'flex-start',
        padding: activities.length === 0 ? '24px 20px' : '10px 20px',
      }}>
        {activities.length === 0 && !isAdding && (
          <span style={{ fontSize: '13px', color: DESIGN_TOKENS.neutral[400], marginRight: '16px' }}>
            Sin actividades aún.
          </span>
        )}
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px',
              background: 'transparent',
              border: `1.5px dashed ${DESIGN_TOKENS.neutral[300]}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              color: DESIGN_TOKENS.neutral[500],
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = phase.color || DESIGN_TOKENS.primary.base;
              e.currentTarget.style.color = phase.color || DESIGN_TOKENS.primary.base;
              e.currentTarget.style.background = `${phase.color || DESIGN_TOKENS.primary.base}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = DESIGN_TOKENS.neutral[300];
              e.currentTarget.style.color = DESIGN_TOKENS.neutral[500];
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Plus size={14} /> Agregar actividad
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// ACTIVITY ROW
// ============================================================================

const ActivityRow = ({ activity, isLast, phaseColor, onToggleDone, onUpdate, onDelete }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(activity.name);
  const [showActions, setShowActions] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusDef = ACTIVITY_STATUS[activity.status] || ACTIVITY_STATUS.pending;
  const isDone = activity.status === 'done';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '9px 20px',
        borderBottom: isLast ? 'none' : `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
        background: 'white',
        transition: 'background 0.12s',
        position: 'relative',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#f8faff'; setShowActions(true); }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; setShowActions(false); setShowStatusMenu(false); }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggleDone}
        style={{
          width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
          border: `2px solid ${isDone ? phaseColor : DESIGN_TOKENS.neutral[300]}`,
          background: isDone ? phaseColor : 'white',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, transition: 'all 0.15s',
        }}
      >
        {isDone && <Check size={11} color="white" strokeWidth={3} />}
      </button>

      {/* Name */}
      {isEditingName ? (
        <input
          autoFocus
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (editedName.trim()) onUpdate({ name: editedName.trim() });
              setIsEditingName(false);
            }
            if (e.key === 'Escape') { setEditedName(activity.name); setIsEditingName(false); }
          }}
          onBlur={() => {
            if (editedName.trim()) onUpdate({ name: editedName.trim() });
            setIsEditingName(false);
          }}
          style={{
            flex: 1, border: `1px solid ${DESIGN_TOKENS.primary.base}`,
            borderRadius: '6px', padding: '4px 8px', fontSize: '13px',
            fontFamily: DESIGN_TOKENS.typography.fontFamily, outline: 'none',
          }}
        />
      ) : (
        <span
          onDoubleClick={() => { setEditedName(activity.name); setIsEditingName(true); }}
          style={{
            flex: 1, fontSize: '13px', fontWeight: 500, cursor: 'text',
            color: isDone ? DESIGN_TOKENS.neutral[400] : DESIGN_TOKENS.neutral[700],
            textDecoration: isDone ? 'line-through' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {activity.name}
        </span>
      )}

      {/* Status pill */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowStatusMenu(v => !v)}
          style={{
            padding: '3px 10px',
            background: statusDef.bg,
            color: statusDef.color,
            border: `1px solid ${statusDef.color}40`,
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {statusDef.label}
        </button>
        {showStatusMenu && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 100,
            background: 'white', borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid #f3f4f6', padding: '4px',
            minWidth: '150px',
          }}>
            {Object.entries(ACTIVITY_STATUS).map(([key, def]) => (
              <button
                key={key}
                onClick={() => { onUpdate({ status: key }); setShowStatusMenu(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '7px 10px', border: 'none',
                  background: activity.status === key ? def.bg : 'transparent',
                  borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
                  fontWeight: activity.status === key ? 700 : 400,
                  color: activity.status === key ? def.color : DESIGN_TOKENS.neutral[600],
                }}
                onMouseEnter={(e) => { if (activity.status !== key) e.currentTarget.style.background = DESIGN_TOKENS.neutral[50]; }}
                onMouseLeave={(e) => { if (activity.status !== key) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: def.color, display: 'inline-block', flexShrink: 0 }} />
                {def.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Due date */}
      <input
        type="date"
        value={activity.dueDate || ''}
        onChange={(e) => onUpdate({ dueDate: e.target.value })}
        style={{
          border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          borderRadius: '6px', padding: '3px 8px', fontSize: '11px',
          color: DESIGN_TOKENS.neutral[600], cursor: 'pointer',
          fontFamily: DESIGN_TOKENS.typography.fontFamily,
          opacity: showActions || activity.dueDate ? 1 : 0,
          transition: 'opacity 0.15s',
        }}
      />

      {/* Delete */}
      <button
        onClick={onDelete}
        style={{
          padding: '4px', background: 'transparent', border: 'none',
          borderRadius: '6px', cursor: 'pointer', color: DESIGN_TOKENS.neutral[400],
          display: 'flex', opacity: showActions ? 1 : 0, transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = DESIGN_TOKENS.danger?.base || '#ef4444'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = DESIGN_TOKENS.neutral[400]; }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};

// ============================================================================
// STORIES TAB
// ============================================================================

const StoriesTab = ({ stories, onUpdate }) => {
  return (
    <EmptyState
      icon={FileText}
      title="Historias de Usuario"
      description="Esta sección permitirá gestionar historias de usuario del proyecto"
    />
  );
};

// ============================================================================
// RISKS TAB
// ============================================================================

const RisksTab = ({ risks, onUpdate }) => {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Gestión de Riesgos"
      description="Esta sección permitirá identificar y mitigar riesgos del proyecto"
    />
  );
};

// ============================================================================
// MEETINGS TAB
// ============================================================================

const MeetingsTab = ({ meetings, onUpdate }) => {
  return (
    <EmptyState
      icon={Calendar}
      title="Seguimiento y Reuniones"
      description="Esta sección permitirá registrar reuniones y acuerdos del proyecto"
    />
  );
};

// ============================================================================
// EMPTY STATE
// ============================================================================

const EmptyState = ({ icon: Icon, title, description }) => (
  <div style={{
    background: 'white',
    borderRadius: '16px',
    padding: '64px 32px',
    textAlign: 'center',
    border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`
  }}>
    <Icon 
      size={64}
      style={{
        margin: '0 auto 16px',
        opacity: 0.3,
        color: DESIGN_TOKENS.neutral[400]
      }}
    />
    <h3 style={{
      fontSize: '18px',
      fontWeight: 700,
      color: DESIGN_TOKENS.neutral[700],
      margin: '0 0 8px'
    }}>
      {title}
    </h3>
    <p style={{
      fontSize: '14px',
      color: DESIGN_TOKENS.neutral[500],
      margin: 0
    }}>
      {description}
    </p>
  </div>
);

export default ProjectRoadmap;