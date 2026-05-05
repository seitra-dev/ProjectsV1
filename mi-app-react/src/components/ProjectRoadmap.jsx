import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import ConfirmModal from './ConfirmModal';
import {
  Plus, ChevronDown, ChevronRight, ChevronLeft, Edit, Trash2, Check, X,
  Home, Clipboard, FileText, AlertTriangle, Calendar, Target, CheckCircle2, AlertCircle, Users, TrendingUp, Map
} from 'lucide-react';
import { DESIGN_TOKENS } from '../styles/tokens';
import { TASK_STATUSES, getTaskStatus, getProjectStatus } from '../constants/statuses';

// ============================================================================
// PROJECT ROADMAP - Dynamic Component
// ============================================================================

const ProjectRoadmap = ({ project, tasks = [], users = [], onProjectUpdate, onTaskCreate, onTaskUpdate, onTaskDelete }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddTabMenu, setShowAddTabMenu] = useState(false);
  const addTabBtnRef = useRef(null);
  const addTabMenuRef = useRef(null);

  // Inicializar estructura si no existe
  const roadmapData = project.roadmap || {
    phases: [],
    userStories: [],
    risks: [],
    meetings: [],
    enabledTabs: ['stories', 'risks', 'meetings']
  };

  // Para proyectos existentes sin enabledTabs guardado, mostrar todas por defecto
  const enabledOptionalTabs = roadmapData.enabledTabs ?? ['stories', 'risks', 'meetings'];

  const updateRoadmap = (updates) => {
    onProjectUpdate({
      ...project,
      roadmap: {
        ...roadmapData,
        ...updates
      }
    });
  };

  const FIXED_TABS = [
    { id: 'overview', label: 'Resumen', icon: Home, color: '#6366f1' },
    { id: 'plan', label: 'Plan de Trabajo', icon: Clipboard, color: '#0ea5e9' },
  ];

  const OPTIONAL_TABS = [
    { id: 'stories', label: 'Historias de Usuario', icon: FileText, color: '#10b981' },
    { id: 'risks', label: 'Riesgos', icon: AlertTriangle, color: '#f59e0b' },
    { id: 'meetings', label: 'Seguimiento', icon: Calendar, color: '#8b5cf6' },
  ];

  const tabs = [
    ...FIXED_TABS,
    ...OPTIONAL_TABS.filter(t => enabledOptionalTabs.includes(t.id))
  ];

  const availableToAdd = OPTIONAL_TABS.filter(t => !enabledOptionalTabs.includes(t.id));

  const enableTab = (tabId) => {
    updateRoadmap({ enabledTabs: [...enabledOptionalTabs, tabId] });
    setShowAddTabMenu(false);
    setActiveTab(tabId);
  };

  const disableTab = (tabId) => {
    updateRoadmap({ enabledTabs: enabledOptionalTabs.filter(t => t !== tabId) });
    if (activeTab === tabId) setActiveTab('overview');
  };

  useEffect(() => {
    const handler = (e) => {
      if (
        addTabBtnRef.current && !addTabBtnRef.current.contains(e.target) &&
        addTabMenuRef.current && !addTabMenuRef.current.contains(e.target)
      ) setShowAddTabMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
              {FIXED_TABS.map(tab => (
                <NavTab
                  key={tab.id}
                  label={tab.label}
                  icon={tab.icon}
                  color={tab.color}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
              {OPTIONAL_TABS.filter(t => enabledOptionalTabs.includes(t.id)).map(tab => (
                <NavTab
                  key={tab.id}
                  label={tab.label}
                  icon={tab.icon}
                  color={tab.color}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  onRemove={() => disableTab(tab.id)}
                />
              ))}

              {/* Botón para agregar secciones opcionales */}
              {availableToAdd.length > 0 && (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    ref={addTabBtnRef}
                    onClick={() => setShowAddTabMenu(s => !s)}
                    title="Agregar sección"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 12px', borderRadius: '10px',
                      fontSize: '13px', fontWeight: 600,
                      border: `1.5px dashed ${DESIGN_TOKENS.border.color.normal}`,
                      cursor: 'pointer', transition: 'all 0.2s',
                      background: showAddTabMenu ? DESIGN_TOKENS.neutral[100] : 'transparent',
                      color: showAddTabMenu ? DESIGN_TOKENS.neutral[700] : DESIGN_TOKENS.neutral[400],
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = DESIGN_TOKENS.neutral[100]; e.currentTarget.style.color = DESIGN_TOKENS.neutral[700]; e.currentTarget.style.borderColor = DESIGN_TOKENS.neutral[400]; }}
                    onMouseLeave={(e) => { if (!showAddTabMenu) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = DESIGN_TOKENS.neutral[400]; e.currentTarget.style.borderColor = DESIGN_TOKENS.border.color.normal; } }}
                  >
                    <Plus size={14} />
                    Agregar sección
                  </button>
                  {showAddTabMenu && (
                    <div
                      ref={addTabMenuRef}
                      style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                        background: 'white', border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
                        borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        padding: '6px', minWidth: '220px', zIndex: 200,
                        animation: 'rmap-menuIn 0.15s ease',
                      }}
                    >
                      <p style={{ fontSize: '11px', fontWeight: 700, color: DESIGN_TOKENS.neutral[400], textTransform: 'uppercase', letterSpacing: '0.6px', margin: '6px 10px 8px', padding: 0 }}>
                        Secciones disponibles
                      </p>
                      {availableToAdd.map(tab => {
                        const TabIcon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => enableTab(tab.id)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '9px 12px', background: 'none', border: 'none',
                              borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                              fontWeight: 500, color: DESIGN_TOKENS.neutral[700], textAlign: 'left',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = `${tab.color}12`; e.currentTarget.style.color = tab.color; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = DESIGN_TOKENS.neutral[700]; }}
                          >
                            <TabIcon size={16} color={tab.color} />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
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
                {getProjectStatus(project.status).label}
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
            tasks={tasks}
            users={users}
            onTabChange={setActiveTab}
          />
        )}
        {activeTab === 'plan' && (
          <PlanTab
            phases={roadmapData.phases || []}
            tasks={tasks}
            projectId={project.id}
            users={users}
            onUpdate={(phases) => updateRoadmap({ phases })}
            onTaskCreate={onTaskCreate}
            onTaskUpdate={onTaskUpdate}
            onTaskDelete={onTaskDelete}
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
        .rmap-tl-scroll::-webkit-scrollbar { display: none; }
        @keyframes rmap-menuIn {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// NAV TAB 
// ============================================================================

const NavTab = ({ label, icon: Icon, color, active, onClick, onRemove }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: `10px ${onRemove ? '28px' : '16px'} 10px 16px`,
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

      {/* Botón para quitar la sección opcional */}
      {onRemove && hovered && (
        <button
          title="Quitar sección"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{
            position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
            width: '18px', height: '18px', borderRadius: '50%',
            background: active ? 'rgba(255,255,255,0.25)' : DESIGN_TOKENS.neutral[200],
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: active ? 'white' : DESIGN_TOKENS.neutral[500],
            zIndex: 1, transition: 'background 0.15s',
            padding: 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = active ? 'rgba(255,255,255,0.4)' : DESIGN_TOKENS.neutral[300]}
          onMouseLeave={(e) => e.currentTarget.style.background = active ? 'rgba(255,255,255,0.25)' : DESIGN_TOKENS.neutral[200]}
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
};

// ============================================================================
// OVERVIEW TAB
// ============================================================================

const OverviewTab = ({ project, roadmapData, tasks = [], users = [], onTabChange }) => {
  const phases = roadmapData.phases || [];
  const stories = roadmapData.userStories || [];
  const risks = roadmapData.risks || [];

  const phasedTasks = tasks.filter(t => phases.some(p => String(p.id) === String(t.roadmapPhaseId)));
  const totalActivities = phasedTasks.length;
  const completedActivities = phasedTasks.filter(t => t.status === 'completed' || t.status === 'done').length;
  const totalPoints = stories.reduce((sum, s) => sum + (s.points || 0), 0);
  const criticalRisks = risks.filter(r => r.level === 'critical' || r.level === 'high').length;

  // Fase actual = primera fase en progreso o pendiente
  const currentPhaseIdx = phases.findIndex(p => p.status === 'in_progress' || !p.status || p.status === 'pending');
  const currentPhase = currentPhaseIdx >= 0 ? phases[currentPhaseIdx] : phases[0];
  const phaseLabel = phases.length > 0 ? `${Math.max(currentPhaseIdx, 0) + 1} / ${phases.length}` : '0 / 0';

  const kpis = [
    {
      label: 'Fase actual',
      value: phaseLabel,
      sub: currentPhase?.name || 'Sin fases',
      icon: Target,
      gradient: `linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)`,
      tab: 'plan',
    },
    {
      label: 'Actividades',
      value: totalActivities,
      sub: `${completedActivities} completadas`,
      icon: CheckCircle2,
      gradient: `linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)`,
      tab: 'plan',
    },
    {
      label: 'Historias de Usuario',
      value: stories.length,
      sub: `${totalPoints} story points`,
      icon: FileText,
      gradient: `linear-gradient(135deg, #10b981 0%, #059669 100%)`,
      tab: 'stories',
    },
    {
      label: 'Riesgos activos',
      value: criticalRisks,
      sub: `${risks.length} total`,
      icon: AlertCircle,
      gradient: `linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)`,
      tab: 'risks',
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
          const clickable = !!kpi.tab && !!onTabChange;
          return (
            <div
              key={i}
              role={clickable ? 'button' : undefined}
              title={clickable ? `Ver ${kpi.label}` : undefined}
              onClick={clickable ? () => onTabChange(kpi.tab) : undefined}
              style={{
                background: kpi.gradient,
                borderRadius: '16px',
                padding: '24px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: clickable ? 'pointer' : 'default',
              }}
              onMouseEnter={(e) => {
                if (!clickable) return;
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.18)';
              }}
              onMouseLeave={(e) => {
                if (!clickable) return;
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
          <PhaseTimeline phases={phases} tasks={tasks} users={users} />
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

const TL_SLOT = 100;  // px per phase slot — enough for icon + name
const TL_ICON = 44;   // icon square size
const TL_LINE = TL_ICON / 2; // line Y = icon vertical center

const tlStyle = (status) => {
  const c = getTaskStatus(status);
  return { bg: c.bg, border: c.border, icon: c.color };
};

const PhaseTimeline = ({ phases, tasks = [], users = [] }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [canScrollL, setCanScrollL] = useState(false);
  const [canScrollR, setCanScrollR] = useState(false);
  const scrollRef = useRef(null);

  const activeIndex   = phases.findIndex(p => p.status === 'in_progress');
  const selectedPhase = phases.find(p => p.id === selectedId) || null;

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollL(el.scrollLeft > 4);
    setCanScrollR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [phases.length]); // eslint-disable-line

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || activeIndex < 0) return;
    const target = activeIndex * TL_SLOT + TL_SLOT / 2 - el.clientWidth / 2;
    setTimeout(() => el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' }), 120);
  }, [activeIndex]); // eslint-disable-line

  const doScroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * TL_SLOT * 4, behavior: 'smooth' });
  };

  // Colored line: from first icon center up to active (or last completed)
  // Using % of total phases so the line adapts when slots grow via flex
  let coloredEnd = -1;
  if (activeIndex >= 0) {
    coloredEnd = activeIndex;
  } else {
    for (let i = phases.length - 1; i >= 0; i--) {
      if (phases[i].status === 'completed') { coloredEnd = i; break; }
    }
  }
  // halfSlot% = the % of container width that equals half a slot
  // line runs from halfSlot% to (100 - halfSlot)%
  const halfSlotPct  = phases.length > 0 ? 50 / phases.length : 0;
  const coloredPct   = coloredEnd > 0 ? (coloredEnd / phases.length) * 100 : 0;

  return (
    <div>
      <div style={{ position: 'relative' }}>
        {/* Edge fades — only when scrolling */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, zIndex: 5, pointerEvents: 'none',
          background: 'linear-gradient(90deg, white, transparent)',
          opacity: canScrollL ? 1 : 0, transition: 'opacity 0.2s',
        }} />
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, zIndex: 5, pointerEvents: 'none',
          background: 'linear-gradient(270deg, white, transparent)',
          opacity: canScrollR ? 1 : 0, transition: 'opacity 0.2s',
        }} />

        {/* Nav arrows */}
        {canScrollL && (
          <button onClick={() => doScroll(-1)} style={{
            position: 'absolute', left: 2, top: TL_LINE, transform: 'translateY(-50%)',
            zIndex: 10, width: 26, height: 26, borderRadius: '50%', padding: 0,
            background: 'white', border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.10)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChevronLeft size={15} color="#64748b" />
          </button>
        )}
        {canScrollR && (
          <button onClick={() => doScroll(1)} style={{
            position: 'absolute', right: 2, top: TL_LINE, transform: 'translateY(-50%)',
            zIndex: 10, width: 26, height: 26, borderRadius: '50%', padding: 0,
            background: 'white', border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.10)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChevronRight size={15} color="#64748b" />
          </button>
        )}

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="rmap-tl-scroll"
          style={{ overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', padding: '2px 0 0' }}
        >
          {/* flex: 1 distributes phases evenly across the full width.
              minWidth: TL_SLOT is the floor — when too many phases overflow, scroll kicks in. */}
          <div style={{ position: 'relative', display: 'flex', minWidth: '100%' }}>

            {/* Gray base line — percentage-based so it adapts to any slot width */}
            {phases.length > 1 && (
              <div style={{
                position: 'absolute', top: TL_LINE, zIndex: 0, height: 2,
                left: `${halfSlotPct}%`, right: `${halfSlotPct}%`,
                background: '#e2e8f0', borderRadius: 2,
              }} />
            )}
            {/* Colored progress line */}
            {coloredPct > 0 && (
              <div style={{
                position: 'absolute', top: TL_LINE, zIndex: 0, height: 2,
                left: `${halfSlotPct}%`, width: `${coloredPct}%`,
                background: 'linear-gradient(90deg, #10b981, #6366f1)',
                borderRadius: 2, transition: 'width 0.6s ease',
              }} />
            )}

            {/* Phase nodes */}
            {phases.map((phase, i) => {
              const phaseTasks = tasks.filter(t => String(t.roadmapPhaseId) === String(phase.id));
              const status     = phase.status || 'pending';
              const isActive   = status === 'in_progress';
              const isDone     = status === 'completed';
              const isSelected = selectedId === phase.id;
              const ps         = tlStyle(status);

              return (
                <div
                  key={phase.id}
                  onClick={() => setSelectedId(selectedId === phase.id ? null : phase.id)}
                  style={{
                    flex: 1, minWidth: TL_SLOT, zIndex: 1, position: 'relative',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '5px', paddingBottom: '12px', cursor: 'pointer',
                  }}
                >
                  {/* Clipboard icon */}
                  <div style={{
                    width: TL_ICON, height: TL_ICON, borderRadius: '12px',
                    background: isSelected ? `${ps.icon}1a` : ps.bg,
                    border: `1.5px solid ${isActive || isSelected ? ps.icon : ps.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    boxShadow: isActive
                      ? `0 0 0 4px ${ps.icon}20, 0 4px 10px ${ps.icon}25`
                      : isSelected
                        ? `0 0 0 3px ${ps.icon}28`
                        : '0 1px 3px rgba(0,0,0,0.07)',
                    transition: 'all 0.18s',
                    transform: isSelected ? 'scale(1.07)' : 'scale(1)',
                  }}>
                    <Clipboard size={20} color={ps.icon} strokeWidth={1.75} />
                    {/* Completed badge */}
                    {isDone && (
                      <div style={{
                        position: 'absolute', bottom: -4, right: -4,
                        width: 15, height: 15, borderRadius: '50%',
                        background: '#10b981', border: '2px solid white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '7px', color: 'white', fontWeight: 900,
                      }}>✓</div>
                    )}
                  </div>

                  {/* Phase number */}
                  <span style={{
                    fontSize: '10px', fontWeight: 700,
                    color: isActive ? ps.icon : isDone ? ps.icon : '#94a3b8',
                    letterSpacing: '0.2px',
                  }}>
                    Fase {i + 1}
                  </span>

                  {/* Phase name */}
                  <span style={{
                    fontSize: '11px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#1e293b' : '#475569',
                    textAlign: 'center',
                    maxWidth: TL_SLOT - 8,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                  }}>
                    {phase.name || '—'}
                  </span>

                  {/* Activity count */}
                  <span style={{
                    fontSize: '10px', color: '#94a3b8', fontWeight: 500,
                  }}>
                    {phaseTasks.length} actividades
                  </span>

                  {/* Active badge */}
                  {isActive && (
                    <span style={{
                      fontSize: '9px', fontWeight: 700, padding: '2px 8px',
                      background: '#6366f1', color: 'white', borderRadius: '8px',
                      animation: 'pulse 2s infinite',
                    }}>
                      Activa
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail panel on click */}
      {selectedPhase && (
        <PhaseDetailPanel
          phase={selectedPhase}
          phaseIndex={phases.findIndex(p => p.id === selectedPhase.id)}
          phaseTasks={tasks.filter(t => String(t.roadmapPhaseId) === String(selectedPhase.id))}
          users={users}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// PHASE DETAIL PANEL
// ============================================================================

const PhaseDetailPanel = ({ phase, phaseIndex, phaseTasks, users, onClose }) => {
  const completedCount = phaseTasks.filter(t => t.status === 'completed' || t.status === 'done').length;
  const progress       = phaseTasks.length > 0 ? Math.round((completedCount / phaseTasks.length) * 100) : 0;
  const responsable    = users.find(u => String(u.id) === String(phase.responsableId));
  const status    = phase.status || 'pending';
  const statusDef = PHASE_STATUS[status] || PHASE_STATUS.pending;

  return (
    <div style={{
      marginTop: '16px',
      background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)',
      border: '1px solid #c7d2fe', borderRadius: '12px',
      padding: '16px 20px', position: 'relative',
      animation: 'fadeSlideDown 0.18s ease',
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 12, right: 12,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 4, color: '#9ca3af', display: 'flex', borderRadius: '6px',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = '#e5e7eb'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'none'; }}
      >
        <X size={15} />
      </button>

      {/* Header row */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap', paddingRight: 28 }}>
        {/* Icon + name */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '180px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
            background: `${phase.color || '#6366f1'}18`,
            border: `2px solid ${phase.color || '#6366f1'}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
          }}>{phase.icon || '📋'}</div>
          <div>
            <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Fase {phaseIndex + 1}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>
              {phase.name || 'Sin nombre'}
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</div>
          <span style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
            background: statusDef.bg, color: statusDef.color,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusDef.dot }} />
            {statusDef.label}
          </span>
        </div>

        {/* Progress */}
        <div style={{ minWidth: 140 }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avance</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: 6 }}>
            {completedCount}/{phaseTasks.length} actividades
          </div>
          <div style={{ height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden', width: 120 }}>
            <div style={{
              height: '100%', borderRadius: 3, transition: 'width 0.4s',
              background: phase.color || '#6366f1', width: `${progress}%`,
            }} />
          </div>
          <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: 3 }}>{progress}% completado</div>
        </div>

        {/* Responsable */}
        {responsable && (
          <div>
            <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Responsable</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
              {typeof responsable.avatar === 'string' && (responsable.avatar.startsWith('http') || responsable.avatar.startsWith('data:'))
                ? <img src={responsable.avatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <span style={{ fontSize: '18px' }}>{responsable.avatar || '👤'}</span>
              }
              {responsable.name || responsable.email}
            </div>
          </div>
        )}
      </div>

      {/* Task chips */}
      {phaseTasks.length > 0 ? (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #c7d2fe' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Actividades ({phaseTasks.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {phaseTasks.slice(0, 10).map(t => {
              const isDone = t.status === 'completed' || t.status === 'done';
              return (
                <span key={t.id} style={{
                  fontSize: '12px', padding: '3px 10px', borderRadius: '20px',
                  background: isDone ? '#d1fae5' : 'white',
                  color: isDone ? '#065f46' : '#6b7280',
                  border: `1px solid ${isDone ? '#a7f3d0' : '#e5e7eb'}`,
                  textDecoration: isDone ? 'line-through' : 'none',
                  fontWeight: isDone ? 600 : 400,
                }}>
                  {t.title || t.name}
                </span>
              );
            })}
            {phaseTasks.length > 10 && (
              <span style={{
                fontSize: '12px', padding: '3px 10px', borderRadius: '20px',
                background: '#f3f4f6', color: '#9ca3af',
              }}>+{phaseTasks.length - 10} más</span>
            )}
          </div>
        </div>
      ) : (
        <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>
          Sin actividades en esta fase.
        </p>
      )}

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// PLAN TAB
// ============================================================================

const PlanTab = ({ phases, tasks = [], projectId, users = [], onUpdate, onTaskCreate, onTaskUpdate, onTaskDelete }) => {
  const [openPhase, setOpenPhase] = useState(phases[0]?.id || null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

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
    setConfirmData({
      title: '¿Eliminar fase?',
      message: 'Esta fase y todas sus actividades serán eliminadas permanentemente.',
      onConfirm: () => onUpdate(phases.filter(p => p.id !== phaseId)),
    });
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
          phaseTasks={tasks.filter(t => String(t.roadmapPhaseId) === String(phase.id))}
          isOpen={openPhase === phase.id}
          isCreating={isCreating && phase.id === openPhase}
          projectId={projectId}
          users={users}
          onToggle={() => setOpenPhase(openPhase === phase.id ? null : phase.id)}
          onUpdate={(updates) => handleUpdatePhase(phase.id, updates)}
          onDelete={() => handleDeletePhase(phase.id)}
          onFinishCreating={() => setIsCreating(false)}
          onTaskCreate={onTaskCreate}
          onTaskUpdate={onTaskUpdate}
          onTaskDelete={onTaskDelete}
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
      <ConfirmModal
        isOpen={!!confirmData}
        title={confirmData?.title}
        message={confirmData?.message}
        onConfirm={() => { confirmData?.onConfirm(); setConfirmData(null); }}
        onCancel={() => setConfirmData(null)}
      />
    </div>
  );
};

// ============================================================================
// PHASE CARD
// ============================================================================

const TASK_STATUS_STYLE = Object.fromEntries(
  Object.entries(TASK_STATUSES).map(([k, v]) => [k, { label: v.label, color: v.color, bg: v.bg }])
);

const PHASE_STATUS = Object.fromEntries(
  ['pending','in_progress','completed','blocked','paused','waiting','expedite','cancelled'].map(k => {
    const c = getTaskStatus(k);
    return [k, { label: c.label, bg: c.bg, color: c.color, dot: c.color }];
  })
);

const PhaseCard = ({ phase, phaseTasks = [], isOpen, isCreating, projectId, users = [], onToggle, onUpdate, onDelete, onFinishCreating, onTaskCreate, onTaskUpdate, onTaskDelete }) => {
  const [isEditing, setIsEditing] = useState(isCreating);
  const [editedName, setEditedName] = useState(phase.name);
  const [editedResponsableId, setEditedResponsableId] = useState(phase.responsableId || '');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [statusMenuPos, setStatusMenuPos] = useState({ top: 0, left: 0 });
  const statusBtnRef = useRef(null);

  const phaseStatus = PHASE_STATUS[phase.status] || PHASE_STATUS.pending;

  const handleOpenStatusMenu = (e) => {
    e.stopPropagation();
    if (statusBtnRef.current) {
      const rect = statusBtnRef.current.getBoundingClientRect();
      setStatusMenuPos({ top: rect.bottom + 6, left: rect.left });
    }
    setShowStatusMenu(v => !v);
  };

  const completedActivities = phaseTasks.filter(t => t.status === 'completed' || t.status === 'done').length;
  const totalActivities = phaseTasks.length;
  const progress = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  const handleSaveName = () => {
    if (editedName.trim()) {
      onUpdate({ name: editedName.trim(), responsableId: editedResponsableId || null });
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
              <>
                <span style={{
                  fontWeight: 700,
                  color: DESIGN_TOKENS.neutral[800],
                  fontSize: '14px'
                }}>
                  Fase {phase.order} — {phase.name || 'Sin nombre'}
                </span>
                {phase.responsableId && (() => {
                  const resp = users.find(u => String(u.id) === String(phase.responsableId));
                  return resp ? (
                    <span style={{
                      fontSize: '11px', color: DESIGN_TOKENS.neutral[500],
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      {typeof resp.avatar === 'string' && (resp.avatar.startsWith('http') || resp.avatar.startsWith('data:'))
                        ? <img src={resp.avatar} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <span style={{ fontSize: '13px' }}>{resp.avatar || '👤'}</span>
                      }
                      {resp.name || resp.email}
                    </span>
                  ) : null;
                })()}
              </>
            )}

            {isEditing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Responsable selector */}
                {users.length > 0 && (
                  <select
                    value={editedResponsableId}
                    onChange={(e) => setEditedResponsableId(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                      borderRadius: '8px',
                      padding: '7px 10px',
                      fontSize: '13px',
                      fontFamily: DESIGN_TOKENS.typography.fontFamily,
                      color: DESIGN_TOKENS.neutral[700],
                      background: 'white',
                      cursor: 'pointer',
                      outline: 'none',
                      minWidth: '160px',
                    }}
                  >
                    <option value="">— Sin responsable</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.email}</option>
                    ))}
                  </select>
                )}
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
                      setEditedResponsableId(phase.responsableId || '');
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
              </div>
            )}

            {!isEditing && (
              <>
                <span style={{ fontSize: '11px', color: DESIGN_TOKENS.neutral[500] }}>
                  {totalActivities} actividades
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: phase.color || DESIGN_TOKENS.primary.base }}>
                  {completedActivities}/{totalActivities} completadas
                </span>
                {/* Status pill */}
                <button
                  ref={statusBtnRef}
                  onClick={handleOpenStatusMenu}
                  style={{
                    padding: '3px 10px',
                    background: phaseStatus.bg,
                    color: phaseStatus.color,
                    border: `1px solid ${phaseStatus.color}30`,
                    borderRadius: '20px',
                    fontSize: '11px', fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: phaseStatus.dot, flexShrink: 0 }} />
                  {phaseStatus.label}
                </button>
                {showStatusMenu && (
                  <>
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                      onClick={e => { e.stopPropagation(); setShowStatusMenu(false); }}
                    />
                    <div style={{
                      position: 'fixed',
                      top: statusMenuPos.top,
                      left: statusMenuPos.left,
                      zIndex: 9999,
                      background: 'white', borderRadius: '10px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                      border: '1px solid #e5e7eb', padding: '4px', minWidth: '150px',
                    }}>
                      {Object.entries(PHASE_STATUS).map(([key, def]) => (
                        <button
                          key={key}
                          onClick={e => { e.stopPropagation(); onUpdate({ status: key }); setShowStatusMenu(false); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            width: '100%', padding: '7px 10px', border: 'none',
                            background: (phase.status || 'pending') === key ? def.bg : 'transparent',
                            borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
                            fontWeight: (phase.status || 'pending') === key ? 700 : 400,
                            color: (phase.status || 'pending') === key ? def.color : DESIGN_TOKENS.neutral[600],
                          }}
                          onMouseEnter={e => { if ((phase.status || 'pending') !== key) e.currentTarget.style.background = '#f9fafb'; }}
                          onMouseLeave={e => { if ((phase.status || 'pending') !== key) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: def.dot, flexShrink: 0 }} />
                          {def.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
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
          phaseTasks={phaseTasks}
          projectId={projectId}
          onTaskCreate={onTaskCreate}
          onTaskUpdate={onTaskUpdate}
          onTaskDelete={onTaskDelete}
        />
      )}
    </div>
  );
};

// ============================================================================
// ACTIVITY LIST
// ============================================================================

const ACTIVITY_STATUS = Object.fromEntries(
  Object.entries(TASK_STATUSES).map(([k, v]) => [k, { label: v.label, color: v.color, bg: v.bg }])
);

const ActivityList = ({ phase, phaseTasks = [], projectId, onTaskCreate, onTaskUpdate, onTaskDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (isAdding && inputRef.current) inputRef.current.focus();
  }, [isAdding]);

  const handleAddActivity = async () => {
    const title = newName.trim();
    if (!title) { setIsAdding(false); return; }
    setSaving(true);
    try {
      await onTaskCreate({
        title,
        projectId,
        roadmapPhaseId: String(phase.id),
        status: 'pending',
        priority: 'medium',
      });
      setNewName('');
      setIsAdding(false);
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDone = async (task) => {
    const next = (task.status === 'completed' || task.status === 'done') ? 'pending' : 'completed';
    await onTaskUpdate(task.id, { status: next });
  };

  const handleUpdateTask = async (taskId, updates) => {
    await onTaskUpdate(taskId, updates);
  };

  const handleDeleteTask = async (taskId) => {
    await onTaskDelete(taskId);
  };

  return (
    <div style={{ borderTop: `1px solid ${DESIGN_TOKENS.border.color.subtle}` }}>
      {/* Task rows */}
      {phaseTasks.length > 0 && (
        <div>
          {phaseTasks.map((task, idx) => (
            <ActivityRow
              key={task.id}
              activity={task}
              isLast={idx === phaseTasks.length - 1}
              phaseColor={phase.color || DESIGN_TOKENS.primary.base}
              onToggleDone={() => handleToggleDone(task)}
              onUpdate={(updates) => handleUpdateTask(task.id, updates)}
              onDelete={() => handleDeleteTask(task.id)}
            />
          ))}
        </div>
      )}

      {/* New task inline form */}
      {isAdding && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '10px 20px',
          borderBottom: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          background: '#fafbff',
        }}>
          <div style={{
            width: '18px', height: '18px', borderRadius: '50%',
            border: `2px solid ${DESIGN_TOKENS.neutral[300]}`, flexShrink: 0
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
              flex: 1, border: `1px solid ${DESIGN_TOKENS.primary.base}`,
              borderRadius: '8px', padding: '7px 12px', fontSize: '13px',
              fontFamily: DESIGN_TOKENS.typography.fontFamily, outline: 'none',
              color: DESIGN_TOKENS.neutral[800],
            }}
          />
          <button
            onClick={handleAddActivity}
            disabled={saving}
            style={{
              padding: '7px 16px', background: saving ? '#94a3b8' : DESIGN_TOKENS.primary.base,
              color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <Check size={14} /> {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            onClick={() => { setIsAdding(false); setNewName(''); }}
            style={{
              padding: '7px 10px', background: DESIGN_TOKENS.neutral[100],
              color: DESIGN_TOKENS.neutral[600], border: 'none', borderRadius: '8px',
              cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Empty state + Add button */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: phaseTasks.length === 0 ? 'center' : 'flex-start',
        padding: phaseTasks.length === 0 ? '24px 20px' : '10px 20px',
      }}>
        {phaseTasks.length === 0 && !isAdding && (
          <span style={{ fontSize: '13px', color: DESIGN_TOKENS.neutral[400], marginRight: '16px' }}>
            Sin actividades aún.
          </span>
        )}
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', background: 'transparent',
              border: `1.5px dashed ${DESIGN_TOKENS.neutral[300]}`,
              borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
              fontWeight: 600, color: DESIGN_TOKENS.neutral[500], transition: 'all 0.15s',
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
  const [editedName, setEditedName] = useState(activity.title || activity.name || '');
  const [showActions, setShowActions] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [statusMenuPos, setStatusMenuPos] = useState({ top: 0, left: 0 });
  const statusBtnRef = useRef(null);
  const statusDef = ACTIVITY_STATUS[activity.status] || ACTIVITY_STATUS.pending;
  const isDone = activity.status === 'completed' || activity.status === 'done';
  const { canEditTaskDates } = useApp();
  const canEditDates = canEditTaskDates();

  const handleOpenStatusMenu = (e) => {
    e.stopPropagation();
    if (statusBtnRef.current) {
      const rect = statusBtnRef.current.getBoundingClientRect();
      setStatusMenuPos({ top: rect.bottom + 6, left: rect.left });
    }
    setShowStatusMenu(v => !v);
  };

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
        zIndex: showStatusMenu ? 10 : 'auto',
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
              if (editedName.trim()) onUpdate({ title: editedName.trim() });
              setIsEditingName(false);
            }
            if (e.key === 'Escape') { setEditedName(activity.title || activity.name || ''); setIsEditingName(false); }
          }}
          onBlur={() => {
            if (editedName.trim()) onUpdate({ title: editedName.trim() });
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
          onDoubleClick={() => { setEditedName(activity.title || activity.name || ''); setIsEditingName(true); }}
          style={{
            flex: 1, fontSize: '13px', fontWeight: 500, cursor: 'text',
            color: isDone ? DESIGN_TOKENS.neutral[400] : DESIGN_TOKENS.neutral[700],
            textDecoration: isDone ? 'line-through' : 'none',
            transition: 'all 0.15s',
          }}
        >
          {activity.title || activity.name}
        </span>
      )}

      {/* Status pill */}
      <button
        ref={statusBtnRef}
        onClick={handleOpenStatusMenu}
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
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onClick={e => { e.stopPropagation(); setShowStatusMenu(false); }}
          />
          <div style={{
            position: 'fixed',
            top: statusMenuPos.top,
            left: statusMenuPos.left,
            zIndex: 9999,
            background: 'white', borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
            border: '1px solid #e5e7eb', padding: '4px',
            minWidth: '150px',
          }}>
            {Object.entries(ACTIVITY_STATUS).filter(([k]) => !['todo','done','review','active'].includes(k)).map(([key, def]) => (
              <button
                key={key}
                onClick={e => { e.stopPropagation(); onUpdate({ status: key }); setShowStatusMenu(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '7px 10px', border: 'none',
                  background: activity.status === key ? def.bg : 'transparent',
                  borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
                  fontWeight: activity.status === key ? 700 : 400,
                  color: activity.status === key ? def.color : DESIGN_TOKENS.neutral[600],
                }}
                onMouseEnter={e => { if (activity.status !== key) e.currentTarget.style.background = DESIGN_TOKENS.neutral[50]; }}
                onMouseLeave={e => { if (activity.status !== key) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: def.color, display: 'inline-block', flexShrink: 0 }} />
                {def.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Due date */}
      <input
        type="date"
        value={activity.endDate || activity.dueDate || ''}
        onChange={(e) => canEditDates && onUpdate({ endDate: e.target.value })}
        disabled={!canEditDates}
        style={{
          border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          borderRadius: '6px', padding: '3px 8px', fontSize: '11px',
          color: DESIGN_TOKENS.neutral[600],
          cursor: canEditDates ? 'pointer' : 'not-allowed',
          fontFamily: DESIGN_TOKENS.typography.fontFamily,
          opacity: canEditDates ? (showActions || activity.endDate || activity.dueDate ? 1 : 0) : 0.5,
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
  const [items, setItems] = useState(stories || []);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');

  const handleAdd = () => {
    if (!newText.trim()) return;
    const next = [...items, { id: Date.now(), title: newText.trim(), points: 0, status: 'pending' }];
    setItems(next);
    onUpdate(next);
    setNewText('');
    setAdding(false);
  };

  const handleRemove = (id) => {
    const next = items.filter(s => s.id !== id);
    setItems(next);
    onUpdate(next);
  };

  if (items.length === 0 && !adding) {
    return (
      <EmptyState
        icon={FileText}
        title="Sin historias de usuario"
        description="Registra los requerimientos del proyecto como historias de usuario para mantener el foco en el valor entregado."
        action={{ label: 'Agregar primera historia', onClick: () => setAdding(true) }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map(s => (
        <div key={s.id} style={{
          background: 'white', borderRadius: '12px', padding: '16px 20px',
          border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <FileText size={16} color={DESIGN_TOKENS.neutral[400]} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: '14px', color: DESIGN_TOKENS.neutral[700] }}>{s.title}</span>
          {s.points > 0 && (
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '2px 8px',
              background: '#eef2ff', color: '#6366f1', borderRadius: '20px',
            }}>{s.points} pts</span>
          )}
          <button onClick={() => handleRemove(s.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: DESIGN_TOKENS.neutral[400], display: 'flex',
          }}>
            <X size={14} />
          </button>
        </div>
      ))}

      {adding ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            autoFocus
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="Como [usuario], quiero [acción] para [beneficio]..."
            style={{
              flex: 1, padding: '10px 14px', border: `1px solid ${DESIGN_TOKENS.primary.base}`,
              borderRadius: '10px', fontSize: '13px', outline: 'none',
              fontFamily: DESIGN_TOKENS.typography.fontFamily,
            }}
          />
          <button onClick={handleAdd} style={{
            padding: '10px 16px', background: DESIGN_TOKENS.primary.base, color: 'white',
            border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          }}>Agregar</button>
          <button onClick={() => setAdding(false)} style={{
            padding: '10px 14px', background: DESIGN_TOKENS.neutral[100], color: DESIGN_TOKENS.neutral[600],
            border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px',
          }}>Cancelar</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{
          padding: '12px', background: 'white', border: `2px dashed ${DESIGN_TOKENS.border.color.normal}`,
          borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          color: DESIGN_TOKENS.neutral[500], display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <Plus size={16} /> Agregar historia de usuario
        </button>
      )}
    </div>
  );
};

// ============================================================================
// RISKS TAB
// ============================================================================

const RISK_LEVELS = [
  { key: 'low',      label: 'Bajo',     color: '#10b981', bg: '#d1fae5' },
  { key: 'medium',   label: 'Medio',    color: '#f59e0b', bg: '#fef3c7' },
  { key: 'high',     label: 'Alto',     color: '#f97316', bg: '#ffedd5' },
  { key: 'critical', label: 'Crítico',  color: '#ef4444', bg: '#fee2e2' },
];

const RisksTab = ({ risks, onUpdate }) => {
  const [items, setItems] = useState(risks || []);
  const [adding, setAdding] = useState(false);
  const [newRisk, setNewRisk] = useState({ title: '', level: 'medium' });

  const handleAdd = () => {
    if (!newRisk.title.trim()) return;
    const next = [...items, { id: Date.now(), ...newRisk, title: newRisk.title.trim() }];
    setItems(next);
    onUpdate(next);
    setNewRisk({ title: '', level: 'medium' });
    setAdding(false);
  };

  const handleRemove = (id) => {
    const next = items.filter(r => r.id !== id);
    setItems(next);
    onUpdate(next);
  };

  if (items.length === 0 && !adding) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Sin riesgos registrados"
        description="Identifica y documenta los riesgos del proyecto para anticiparte a problemas y definir planes de mitigación."
        action={{ label: 'Registrar primer riesgo', onClick: () => setAdding(true) }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map(r => {
        const lvl = RISK_LEVELS.find(l => l.key === r.level) || RISK_LEVELS[1];
        return (
          <div key={r.id} style={{
            background: 'white', borderRadius: '12px', padding: '16px 20px',
            border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '3px 10px',
              background: lvl.bg, color: lvl.color, borderRadius: '20px', whiteSpace: 'nowrap',
            }}>{lvl.label}</span>
            <span style={{ flex: 1, fontSize: '14px', color: DESIGN_TOKENS.neutral[700] }}>{r.title}</span>
            <button onClick={() => handleRemove(r.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: DESIGN_TOKENS.neutral[400], display: 'flex',
            }}>
              <X size={14} />
            </button>
          </div>
        );
      })}

      {adding ? (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            autoFocus
            value={newRisk.title}
            onChange={e => setNewRisk(p => ({ ...p, title: e.target.value }))}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="Descripción del riesgo..."
            style={{
              flex: 1, minWidth: '200px', padding: '10px 14px',
              border: `1px solid ${DESIGN_TOKENS.primary.base}`,
              borderRadius: '10px', fontSize: '13px', outline: 'none',
              fontFamily: DESIGN_TOKENS.typography.fontFamily,
            }}
          />
          <select
            value={newRisk.level}
            onChange={e => setNewRisk(p => ({ ...p, level: e.target.value }))}
            style={{
              padding: '10px 12px', border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
              borderRadius: '10px', fontSize: '13px', outline: 'none',
              fontFamily: DESIGN_TOKENS.typography.fontFamily, background: 'white', cursor: 'pointer',
            }}
          >
            {RISK_LEVELS.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
          </select>
          <button onClick={handleAdd} style={{
            padding: '10px 16px', background: DESIGN_TOKENS.primary.base, color: 'white',
            border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          }}>Agregar</button>
          <button onClick={() => setAdding(false)} style={{
            padding: '10px 14px', background: DESIGN_TOKENS.neutral[100], color: DESIGN_TOKENS.neutral[600],
            border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px',
          }}>Cancelar</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{
          padding: '12px', background: 'white', border: `2px dashed ${DESIGN_TOKENS.border.color.normal}`,
          borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          color: DESIGN_TOKENS.neutral[500], display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <Plus size={16} /> Registrar riesgo
        </button>
      )}
    </div>
  );
};

// ============================================================================
// MEETINGS TAB
// ============================================================================

const MeetingsTab = ({ meetings, onUpdate }) => {
  const [items, setItems] = useState(meetings || []);
  const [adding, setAdding] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', notes: '' });

  const handleAdd = () => {
    if (!newMeeting.title.trim()) return;
    const next = [...items, { id: Date.now(), ...newMeeting, title: newMeeting.title.trim() }];
    setItems(next);
    onUpdate(next);
    setNewMeeting({ title: '', date: '', notes: '' });
    setAdding(false);
  };

  const handleRemove = (id) => {
    const next = items.filter(m => m.id !== id);
    setItems(next);
    onUpdate(next);
  };

  if (items.length === 0 && !adding) {
    return (
      <EmptyState
        icon={Calendar}
        title="Sin reuniones registradas"
        description="Lleva un registro de las reuniones de seguimiento, decisiones tomadas y compromisos del equipo."
        action={{ label: 'Registrar primera reunión', onClick: () => setAdding(true) }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {items.map(m => (
        <div key={m.id} style={{
          background: 'white', borderRadius: '12px', padding: '16px 20px',
          border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={15} color={DESIGN_TOKENS.neutral[400]} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, color: DESIGN_TOKENS.neutral[700] }}>{m.title}</span>
            {m.date && <span style={{ fontSize: '12px', color: DESIGN_TOKENS.neutral[400] }}>{m.date}</span>}
            <button onClick={() => handleRemove(m.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: DESIGN_TOKENS.neutral[400], display: 'flex',
            }}>
              <X size={14} />
            </button>
          </div>
          {m.notes && (
            <p style={{ margin: '8px 0 0 25px', fontSize: '13px', color: DESIGN_TOKENS.neutral[500], lineHeight: 1.5 }}>
              {m.notes}
            </p>
          )}
        </div>
      ))}

      {adding ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              autoFocus
              value={newMeeting.title}
              onChange={e => setNewMeeting(p => ({ ...p, title: e.target.value }))}
              placeholder="Título de la reunión..."
              style={{
                flex: 1, padding: '10px 14px', border: `1px solid ${DESIGN_TOKENS.primary.base}`,
                borderRadius: '10px', fontSize: '13px', outline: 'none',
                fontFamily: DESIGN_TOKENS.typography.fontFamily,
              }}
            />
            <input
              type="date"
              value={newMeeting.date}
              onChange={e => setNewMeeting(p => ({ ...p, date: e.target.value }))}
              style={{
                padding: '10px 12px', border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
                borderRadius: '10px', fontSize: '13px', outline: 'none',
                fontFamily: DESIGN_TOKENS.typography.fontFamily,
              }}
            />
          </div>
          <textarea
            value={newMeeting.notes}
            onChange={e => setNewMeeting(p => ({ ...p, notes: e.target.value }))}
            placeholder="Acuerdos, decisiones o notas de la reunión..."
            rows={2}
            style={{
              width: '100%', padding: '10px 14px', border: `1px solid ${DESIGN_TOKENS.border.color.normal}`,
              borderRadius: '10px', fontSize: '13px', outline: 'none', resize: 'vertical',
              fontFamily: DESIGN_TOKENS.typography.fontFamily, boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setAdding(false)} style={{
              padding: '10px 14px', background: DESIGN_TOKENS.neutral[100], color: DESIGN_TOKENS.neutral[600],
              border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px',
            }}>Cancelar</button>
            <button onClick={handleAdd} style={{
              padding: '10px 16px', background: DESIGN_TOKENS.primary.base, color: 'white',
              border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            }}>Guardar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{
          padding: '12px', background: 'white', border: `2px dashed ${DESIGN_TOKENS.border.color.normal}`,
          borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
          color: DESIGN_TOKENS.neutral[500], display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <Plus size={16} /> Registrar reunión
        </button>
      )}
    </div>
  );
};

// ============================================================================
// EMPTY STATE
// ============================================================================

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div style={{
    background: 'white',
    borderRadius: '16px',
    padding: '64px 32px',
    textAlign: 'center',
    border: `1px solid ${DESIGN_TOKENS.border.color.subtle}`
  }}>
    <Icon
      size={64}
      style={{ margin: '0 auto 16px', opacity: 0.3, color: DESIGN_TOKENS.neutral[400] }}
    />
    <h3 style={{ fontSize: '18px', fontWeight: 700, color: DESIGN_TOKENS.neutral[700], margin: '0 0 8px' }}>
      {title}
    </h3>
    <p style={{ fontSize: '14px', color: DESIGN_TOKENS.neutral[500], margin: action ? '0 0 20px' : 0 }}>
      {description}
    </p>
    {action && (
      <button
        onClick={action.onClick}
        style={{
          padding: '10px 20px', background: DESIGN_TOKENS.primary.base, color: 'white',
          border: 'none', borderRadius: '10px', cursor: 'pointer',
          fontSize: '14px', fontWeight: 600, fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', gap: '8px',
        }}
      >
        <Plus size={15} /> {action.label}
      </button>
    )}
  </div>
);

export default ProjectRoadmap;