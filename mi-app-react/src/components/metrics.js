// ============================================================================
// MÉTRICAS PARA DASHBOARD DE GESTIÓN
// ============================================================================
// Estas funciones calculan métricas agregadas desde Supabase.
// Incluyen datos enriquecidos: workspace.name y environment.name en cada proyecto.
// ============================================================================

import { supabase } from '../lib/supabase';

// ============================================================================
// HELPERS INTERNOS
// ============================================================================

const buildTasksByPerson = (tasks) => {
  const map = {};
  (tasks || []).forEach(task => {
    const uid  = task.assignee_id || 'unassigned';
    const name = task.assignee?.name || 'Sin asignar';
    if (!map[uid]) {
      map[uid] = {
        id: uid, name,
        avatar: task.assignee?.avatar || '👤',
        tasks: [], completed: 0, inProgress: 0, pending: 0, overloaded: false,
      };
    }
    map[uid].tasks.push(task);
    if (task.status === 'completed')  map[uid].completed++;
    else if (task.status === 'in_progress') map[uid].inProgress++;
    else map[uid].pending++;
    const active = map[uid].inProgress + map[uid].pending;
    map[uid].overloaded = active > 10;
  });
  return Object.values(map);
};

const calcKpis = (projects, tasks) => ({
  totalProjects:  projects.length,
  totalMilestones: (tasks || []).filter(t => !t.parent_id).length,
  totalTasks:     (tasks || []).length,
  completed:      (tasks || []).filter(t => t.status === 'completed').length,
  inProgress:     (tasks || []).filter(t => t.status === 'in_progress').length,
  highPriority:   (tasks || []).filter(t => t.priority === 'urgent' || t.priority === 'high').length,
  blocked:        (tasks || []).filter(t => t.status === 'blocked').length,
});

// ============================================================================
// MÉTRICAS GLOBALES (todos los entornos visibles)
// ============================================================================
export const getGlobalMetrics = async (userId, userRole) => {
  try {
    // 1. Obtener entornos accesibles
    let environments = [];
    if (userRole === 'platform_owner') {
      const { data } = await supabase
        .from('environments')
        .select('id, name, color, icon')
        .order('name');
      environments = data || [];
    } else {
      const { data: memberships } = await supabase
        .from('environment_members')
        .select('environment_id')
        .eq('user_id', userId);
      const ids = (memberships || []).map(m => m.environment_id);
      if (ids.length > 0) {
        const { data } = await supabase
          .from('environments')
          .select('id, name, color, icon')
          .in('id', ids)
          .order('name');
        environments = data || [];
      }
    }

    const envIds = environments.map(e => e.id);
    if (envIds.length === 0) {
      return {
        ...calcKpis([], []),
        tasksByPerson: [], projects: [], tasks: [],
        environments: [], workspaces: [],
      };
    }

    // 2. Workspaces con nombre
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name, environment_id')
      .in('environment_id', envIds);

    const wsIds  = (workspaces || []).map(w => w.id);
    const wsMap  = Object.fromEntries((workspaces || []).map(w => [w.id, w]));
    const envMap = Object.fromEntries(environments.map(e => [e.id, e]));

    // 3. Proyectos por workspace y por environment_id directo — en paralelo
    const [wsProjRes, envProjRes] = await Promise.all([
      wsIds.length > 0
        ? supabase.from('projects').select('*').in('workspace_id', wsIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase.from('projects').select('*').in('environment_id', envIds).order('created_at', { ascending: false }),
    ]);

    let rawProjects = wsProjRes.data || [];
    const seen = new Set(rawProjects.map(p => p.id));
    (envProjRes.data || []).forEach(p => {
      if (!seen.has(p.id)) { rawProjects.push(p); seen.add(p.id); }
    });

    // 4. Tareas con asignado
    const projectIds = rawProjects.map(p => p.id);
    let tasks = [];
    if (projectIds.length > 0) {
      const { data } = await supabase
        .from('tasks')
        .select('*, assignee:users(id, name, email, avatar)')
        .in('project_id', projectIds)
        .eq('is_deleted', false);
      tasks = data || [];
    }

    // 5. Enriquecer proyectos con info de entorno y workspace
    const projects = rawProjects.map(p => {
      const ws  = wsMap[p.workspace_id];
      const env = envMap[p.environment_id || ws?.environment_id];
      return { ...p, _workspace: ws || null, _environment: env || null };
    });

    return {
      ...calcKpis(projects, tasks),
      tasksByPerson: buildTasksByPerson(tasks),
      projects,
      tasks,
      environments,
      workspaces: workspaces || [],
    };

  } catch (error) {
    console.error('Error calculando métricas globales:', error);
    throw error;
  }
};

// ============================================================================
// MÉTRICAS DE UN ENTORNO ESPECÍFICO
// ============================================================================
export const getEnvironmentMetrics = async (environmentId) => {
  try {
    // Entorno
    const { data: envData } = await supabase
      .from('environments')
      .select('id, name, color, icon')
      .eq('id', environmentId)
      .single();
    const environment = envData || null;

    // Workspaces con nombre
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id, name, environment_id')
      .eq('environment_id', environmentId);

    const wsIds = (workspaces || []).map(w => w.id);
    const wsMap = Object.fromEntries((workspaces || []).map(w => [w.id, w]));

    // Proyectos
    let rawProjects = [];
    if (wsIds.length > 0) {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .in('workspace_id', wsIds)
        .order('created_at', { ascending: false });
      rawProjects = data || [];
    }
    // También por environment_id directo
    const { data: directProjects } = await supabase
      .from('projects')
      .select('*')
      .eq('environment_id', environmentId)
      .order('created_at', { ascending: false });
    const seen = new Set(rawProjects.map(p => p.id));
    (directProjects || []).forEach(p => {
      if (!seen.has(p.id)) { rawProjects.push(p); seen.add(p.id); }
    });

    // Tareas
    const projectIds = rawProjects.map(p => p.id);
    let tasks = [];
    if (projectIds.length > 0) {
      const { data } = await supabase
        .from('tasks')
        .select('*, assignee:users(id, name, email, avatar)')
        .in('project_id', projectIds)
        .eq('is_deleted', false);
      tasks = data || [];
    }

    // Enriquecer proyectos
    const projects = rawProjects.map(p => {
      const ws = wsMap[p.workspace_id];
      return { ...p, _workspace: ws || null, _environment: environment };
    });

    return {
      ...calcKpis(projects, tasks),
      tasksByPerson: buildTasksByPerson(tasks),
      projects,
      tasks,
      environments: environment ? [environment] : [],
      workspaces: workspaces || [],
    };

  } catch (error) {
    console.error('Error calculando métricas del entorno:', error);
    throw error;
  }
};

// ============================================================================
// TAREAS DE UNA SEMANA (por defecto: semana actual)
// weekStart: Date (lunes de la semana deseada) — si null usa la semana actual
// ============================================================================
export const getWeeklyTasks = async (environmentId = null, weekStart = null) => {
  try {
    let monday;
    if (weekStart) {
      monday = new Date(weekStart);
      monday.setHours(0, 0, 0, 0);
    } else {
      const today = new Date();
      const dow   = today.getDay();
      monday = new Date(today);
      monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
      monday.setHours(0, 0, 0, 0);
    }
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const mondayStr = monday.toISOString().split('T')[0];
    const sundayStr = sunday.toISOString().split('T')[0];

    // Tareas que se solapan con la semana:
    //   start_date <= sundayStr  AND  end_date >= mondayStr
    let query = supabase
      .from('tasks')
      .select('*, assignee:users(id, name, email, avatar), project:projects(id, name, workspace_id)')
      .lte('start_date', sundayStr)
      .gte('end_date',   mondayStr)
      .eq('is_deleted',  false);

    if (environmentId && environmentId !== 'all') {
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('environment_id', environmentId);
      const wsIds = (workspaces || []).map(w => w.id);

      const [wsProjRes, envProjRes] = await Promise.all([
        wsIds.length > 0
          ? supabase.from('projects').select('id').in('workspace_id', wsIds)
          : Promise.resolve({ data: [] }),
        supabase.from('projects').select('id').eq('environment_id', environmentId),
      ]);

      const seen = new Set();
      const projectIds = [];
      for (const p of [...(wsProjRes.data || []), ...(envProjRes.data || [])]) {
        if (!seen.has(p.id)) { seen.add(p.id); projectIds.push(p.id); }
      }

      if (projectIds.length > 0) {
        query = query.in('project_id', projectIds);
      } else {
        return [];
      }
    }

    const { data: tasks } = await query;
    return tasks || [];

  } catch (error) {
    console.error('Error cargando tareas semanales:', error);
    throw error;
  }
};

// ============================================================================
// KPIs DEL ÁREA — función pura (sin llamadas a DB)
// Recibe proyectos y tareas ya cargados y devuelve los 4 KPIs.
// ============================================================================
export const computeAreaKpisFromData = (projects = [], tasks = []) => {
  // ── KPI A: Progreso ponderado del área ──────────────────────────────────
  const activeProjects = projects.filter(p => ['active', 'in_progress', 'pending'].includes(p.status));
  let weightedProgress = 0;
  if (activeProjects.length > 0) {
    const sum = activeProjects.reduce((acc, proj) => {
      const projTasks = tasks.filter(t => t.project_id === proj.id && !t.parent_id);
      const completed = projTasks.filter(t => t.status === 'completed').length;
      const pct       = projTasks.length > 0 ? (completed / projTasks.length) * 100 : 0;
      return acc + pct;
    }, 0);
    weightedProgress = Math.round(sum / activeProjects.length);
  }

  // ── KPI B: Velocidad semanal ─────────────────────────────────────────────
  const now         = new Date();
  const ms7         = 7 * 24 * 3600 * 1000;
  const cutCurrent  = new Date(now - ms7);
  const cutPrevious = new Date(now - 2 * ms7);

  const isCompletedIn = (t, from, to) => {
    if (t.status !== 'completed') return false;
    const stamp = t.closed_at || t.updated_at;
    if (!stamp) return false;
    const d = new Date(stamp);
    return d >= from && d < to;
  };

  const currentWeekCompleted  = tasks.filter(t => isCompletedIn(t, cutCurrent, now)).length;
  const previousWeekCompleted = tasks.filter(t => isCompletedIn(t, cutPrevious, cutCurrent)).length;

  let velocityTrend = 'equal';
  if (previousWeekCompleted === 0) {
    velocityTrend = currentWeekCompleted > 0 ? 'up' : 'equal';
  } else {
    const ratio = currentWeekCompleted / previousWeekCompleted;
    if (ratio > 1.1) velocityTrend = 'up';
    else if (ratio < 0.9) velocityTrend = 'down';
  }

  // ── KPI C: Tasa de cumplimiento de fechas ───────────────────────────────
  const cut30 = new Date(now - 30 * 24 * 3600 * 1000);
  const recentCompleted = tasks.filter(t => {
    if (t.status !== 'completed') return false;
    if (!t.end_date) return false;
    const stamp = t.closed_at || t.updated_at;
    if (!stamp) return false;
    return new Date(stamp) >= cut30;
  });

  let onTimeRate = null;
  if (recentCompleted.length >= 5) {
    const onTime = recentCompleted.filter(t => {
      const closedDate = new Date(t.closed_at || t.updated_at);
      const dueDate    = new Date(t.end_date);
      return closedDate <= dueDate;
    }).length;
    onTimeRate = Math.round((onTime / recentCompleted.length) * 100);
  }

  // ── KPI D: Tareas bloqueadas en proyectos activos ───────────────────────
  const activeProjectIds = new Set(activeProjects.map(p => p.id));
  const blockedActive = tasks.filter(
    t => t.status === 'blocked' && activeProjectIds.has(t.project_id)
  ).length;

  return {
    weightedProgress,
    weeklyVelocity: { current: currentWeekCompleted, previous: previousWeekCompleted, trend: velocityTrend },
    onTimeRate,
    blockedActive,
    activeProjectsCount: activeProjects.length,
  };
};

// ============================================================================
// KPIs DEL ÁREA — wrapper async (mantiene compatibilidad con otras llamadas)
// ============================================================================
export const getAreaKpis = async (envId = null, userId = null, userRole = null) => {
  try {
    const base = envId && envId !== 'all'
      ? await getEnvironmentMetrics(envId)
      : await getGlobalMetrics(userId, userRole);
    return computeAreaKpisFromData(base.projects || [], base.tasks || []);
  } catch (err) {
    console.error('[getAreaKpis] Error:', err);
    return {
      weightedProgress:    0,
      weeklyVelocity:      { current: 0, previous: 0, trend: 'equal' },
      onTimeRate:          null,
      blockedActive:       0,
      activeProjectsCount: 0,
    };
  }
};

// ============================================================================
// PERSONAS SOBRECARGADAS (>10 tareas activas)
// ============================================================================
export const getOverloadedPeople = async (environmentId = null) => {
  try {
    const metrics = environmentId && environmentId !== 'all'
      ? await getEnvironmentMetrics(environmentId)
      : await getGlobalMetrics();
    return (metrics.tasksByPerson || []).filter(p => p.overloaded);
  } catch (error) {
    console.error('Error calculando personas sobrecargadas:', error);
    return [];
  }
};
