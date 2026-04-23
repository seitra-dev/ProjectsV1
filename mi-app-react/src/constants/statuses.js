// ============================================================================
// CENTRAL STATUS CONFIGURATION
// Single source of truth for all status states across the app.
// ============================================================================

// ---------------------------------------------------------------------------
// TASK STATUSES  (official states + legacy aliases)
// ---------------------------------------------------------------------------

export const TASK_STATUSES = {
  // Official states
  pending:     { label: 'Pendiente',    color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  in_progress: { label: 'En Curso',     color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  waiting:     { label: 'En Espera',    color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  paused:      { label: 'En Pausa',     color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  expedite:    { label: 'Expedite',     color: '#e11d48', bg: '#fff1f2', border: '#fecdd3' },
  completed:   { label: 'Completado',   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  blocked:     { label: 'Bloqueado',    color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  cancelled:   { label: 'Cancelado',    color: '#9ca3af', bg: '#f3f4f6', border: '#e5e7eb' },
  // Legacy aliases (used in old data — displayed but not shown in dropdowns)
  todo:        { label: 'Pendiente',    color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  done:        { label: 'Completado',   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  review:      { label: 'En Revisión',  color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  active:      { label: 'Activo',       color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
};

/** Official task statuses for dropdowns (excludes legacy aliases) */
export const TASK_STATUS_DROPDOWN = {
  pending:     TASK_STATUSES.pending,
  in_progress: TASK_STATUSES.in_progress,
  waiting:     TASK_STATUSES.waiting,
  paused:      TASK_STATUSES.paused,
  expedite:    TASK_STATUSES.expedite,
  completed:   TASK_STATUSES.completed,
  blocked:     TASK_STATUSES.blocked,
  cancelled:   TASK_STATUSES.cancelled,
};

/** Resolve a task status key to its config (falls back gracefully) */
export const getTaskStatus = (key) =>
  TASK_STATUSES[key] || { label: key || '—', color: '#9ca3af', bg: '#f3f4f6', border: '#e5e7eb' };

// ---------------------------------------------------------------------------
// PROJECT STATUSES
// ---------------------------------------------------------------------------

export const PROJECT_STATUSES = {
  backlog:     { label: 'Backlog',      color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  active:      { label: 'Activo',       color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  in_progress: { label: 'En Curso',     color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  paused:      { label: 'En Pausa',     color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  completed:   { label: 'Completado',   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  blocked:     { label: 'Bloqueado',    color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  archived:    { label: 'Archivado',    color: '#9ca3af', bg: '#f3f4f6', border: '#e5e7eb' },
  cancelled:   { label: 'Cancelado',    color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
};

/** Official project statuses for dropdowns */
export const PROJECT_STATUS_DROPDOWN = { ...PROJECT_STATUSES };

/** Resolve a project status key to its config (falls back gracefully) */
export const getProjectStatus = (key) =>
  PROJECT_STATUSES[key] || TASK_STATUSES[key] || { label: key || '—', color: '#9ca3af', bg: '#f3f4f6', border: '#e5e7eb' };
