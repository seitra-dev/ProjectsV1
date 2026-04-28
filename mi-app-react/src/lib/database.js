// ============================================================================
// SEITRA - SERVICIO DE BASE DE DATOS CON SUPABASE

import { supabase } from './supabase';

// ============================================================================
// HELPER: fetch directo al REST API (evita Web Locks del SDK)
// ============================================================================
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const getAuthToken = () => {
  try {
    const ref = SUPA_URL?.split('//')[1]?.split('.')[0];
    const raw = localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return SUPA_KEY;
    const session = JSON.parse(raw);
    return session?.access_token || SUPA_KEY;
  } catch { return SUPA_KEY; }
};

const restHeaders = () => ({
  'Content-Type': 'application/json',
  'apikey': SUPA_KEY,
  'Authorization': `Bearer ${getAuthToken()}`,
  'Prefer': 'return=representation',
});

const restFetch = async (path, method, body) => {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    method,
    headers: restHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.hint || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
};

// ============================================================================
// ESTADOS DE TAREA — fuente única de verdad para toda la app
// ============================================================================

/**
 * Todos los estados válidos de una tarea en SEITRA.
 * Importar desde aquí en cualquier componente para mantener consistencia.
 */
export const TASK_STATUS_OPTIONS = {
  pending: {
    label: 'Pendiente',
    color: '#FF9800',
    bg: '#FFF4E5',
    dbValue: 'pending',
  },
  in_progress: {
    label: 'En Curso',
    color: '#2196F3',
    bg: '#E3F2FD',
    dbValue: 'in_progress',
  },
  waiting: {
    label: 'En Espera',
    color: '#0369a1',
    bg: '#e0f2fe',
    dbValue: 'waiting',
  },
  paused: {
    label: 'En Pausa',
    color: '#78909C',
    bg: '#ECEFF1',
    dbValue: 'paused',
  },
  expedite: {
    label: 'Expedite',
    color: '#FF1744',
    bg: '#FFEBEE',
    dbValue: 'expedite',
  },
  completed: {
    label: 'Completado',
    color: '#00D68F',
    bg: '#E8F5E9',
    dbValue: 'completed',
  },
  blocked: {
    label: 'Bloqueado',
    color: '#DC2626',
    bg: '#FFEBEE',
    dbValue: 'blocked',
  },
};

/**
 * Lista ordenada para selectores de UI.
 */
export const TASK_STATUS_LIST = [
  'pending',
  'in_progress',
  'waiting',
  'paused',
  'expedite',
  'completed',
  'blocked',
];

// ============================================================================
// SELECTOR: hasExpediteActive
// Verifica si hay tareas Expedite activas para el usuario/proyecto.
// ============================================================================

/**
 * Devuelve true si alguna de las tareas dadas está en estado 'expedite'.
 * Filtra por userId y/o projectId si se proveen.
 *
 * @param {Array}  tasks     - Array de tareas (ya cargadas en el store).
 * @param {string} [userId]  - ID del usuario autenticado.
 * @param {string} [projectId] - ID del proyecto activo (opcional).
 * @returns {Object} { active: boolean, task: Task|null }
 */
export const hasExpediteActive = (tasks = [], userId = null, projectId = null) => {
  const expediteTasks = tasks.filter((t) => {
    if (t.isDeleted) return false;
    if (t.status !== 'expedite') return false;

    // Si se filtra por proyecto
    if (projectId && t.projectId !== projectId) return false;

    // Si se filtra por usuario: aplica si la tarea es del usuario O no está asignada
    if (userId && t.assigneeId && t.assigneeId !== userId) return false;

    return true;
  });

  return {
    active: expediteTasks.length > 0,
    tasks: expediteTasks,
    task: expediteTasks[0] ?? null,
  };
};

// ============================================================================
// SQL PARA SUPABASE (pegar en el SQL Editor de Supabase)
// ============================================================================
/*
  ── EJECUTAR EN SUPABASE SQL EDITOR ──────────────────────────────────────────

  -- 1. Validar que el status sea uno de los valores permitidos
  ALTER TABLE tasks
    DROP CONSTRAINT IF EXISTS tasks_status_check;

  ALTER TABLE tasks
    ADD CONSTRAINT tasks_status_check
    CHECK (status IN (
      'pending',
      'in_progress',
      'paused',
      'expedite',
      'completed',
      'blocked',
      'todo',
      'done'
    ));

  -- 2. Trigger: bloquear cambio a 'in_progress' o 'completed'
  --    si el usuario tiene una tarea 'expedite' activa.
  CREATE OR REPLACE FUNCTION check_expedite_block()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN
    -- Solo aplica cuando se intenta pasar a in_progress o completed
    IF NEW.status IN ('in_progress', 'completed') THEN
      -- Si la tarea que se edita es la misma en Expedite, se permite cerrarla
      IF OLD.status = 'expedite' THEN
        RETURN NEW;
      END IF;

      -- Verificar si el assignee tiene otra tarea expedite pendiente
      IF NEW.assignee_id IS NOT NULL THEN
        IF EXISTS (
          SELECT 1 FROM tasks
          WHERE assignee_id = NEW.assignee_id
            AND status = 'expedite'
            AND id <> NEW.id
            AND is_deleted = FALSE
        ) THEN
          RAISE EXCEPTION
            'EXPEDITE_BLOCK: El usuario tiene una tarea Expedite activa. '
            'Resuelve la urgencia antes de avanzar otras tareas.'
            USING ERRCODE = 'P0001';
        END IF;
      END IF;
    END IF;

    RETURN NEW;
  END;
  $$;

  DROP TRIGGER IF EXISTS trg_check_expedite_block ON tasks;

  CREATE TRIGGER trg_check_expedite_block
    BEFORE UPDATE OF status ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION check_expedite_block();

  ── FIN SQL ───────────────────────────────────────────────────────────────────
*/

// ============================================================================
// MAPPERS: DB (snake_case) <-> Frontend (camelCase)
// ============================================================================

const mapProject = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    status: row.status || 'active',
    priority: row.priority || 'medium',
    color: row.color || '#6366f1',
    startDate: row.start_date,
    endDate: row.end_date,
    progress: row.progress || 0,
    leaderId: row.owner_id,
    workspaceId: row.workspace_id,
    environmentId: row.environment_id || row.workspace?.environment_id || null,
    tags: row.tags || [],
    members: row.members || [],
    favorite: row.favorite || false,
    roadmap: row.roadmap || { phases: [], userStories: [], risks: [], meetings: [] },
    customFieldDefinitions: row.custom_field_definitions || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const toDbProject = (project) => {
  const db = {};
  if (project.name !== undefined) db.name = project.name;
  if (project.description !== undefined) db.description = project.description;
  if (project.status !== undefined) db.status = project.status;
  if (project.color !== undefined) db.color = project.color;
  if (project.startDate !== undefined) db.start_date = project.startDate || null;
  if (project.endDate !== undefined) db.end_date = project.endDate || null;
  if (project.progress !== undefined) db.progress = project.progress;
  if (project.leaderId !== undefined) db.owner_id = project.leaderId;
  if (project.workspaceId !== undefined) db.workspace_id = project.workspaceId;
  if (project.environmentId !== undefined) db.environment_id = project.environmentId;
  if (project.tags !== undefined) db.tags = project.tags;
  if (project.members !== undefined) db.members = project.members || [];
  if (project.favorite !== undefined) db.favorite = project.favorite;
  if (project.roadmap !== undefined) db.roadmap = project.roadmap;
  if (project.customFieldDefinitions !== undefined) db.custom_field_definitions = project.customFieldDefinitions;
  return db;
};

const mapTask = (row) => {
  if (!row) return null;
  const rawCustom = row.custom_fields != null && typeof row.custom_fields === 'object' ? row.custom_fields : {};
  const { _checklist, ...userCustomFields } = rawCustom;
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    status: (row.status || 'todo').toLowerCase(),
    priority: (row.priority || 'medium').toLowerCase(),
    projectId: row.project_id,
    listId: row.list_id || null,
    assigneeId: typeof row.assignee_id === 'object' ? row.assignee_id?.id : row.assignee_id,
    parentId: row.parent_id || null,
    dueDate: row.end_date,
    endDate: row.end_date,
    startDate: row.start_date,
    progress: row.progress || 0,
    tags: row.tags || [],
    estimatedHours: row.estimated_hours,
    roadmapPhaseId: row.roadmap_phase_id || null,
    customFields: userCustomFields,
    checklist: _checklist || null,
    closedAt: row.closed_at || null,
    frente: row.frente || null,
    isDeleted: row.is_deleted === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const toDbTask = (task) => {
  const db = {};
  if (task.title !== undefined) db.title = task.title;
  if (task.description !== undefined) db.description = task.description;
  if (task.status !== undefined) db.status = task.status;
  if (task.priority !== undefined) db.priority = task.priority;
  if (task.projectId !== undefined) db.project_id = task.projectId;
  if (task.listId !== undefined) db.list_id = task.listId || null;
  if (task.assigneeId !== undefined) db.assignee_id = task.assigneeId || null;
  if (task.parentId !== undefined) db.parent_id = task.parentId || null;
  if (task.dueDate !== undefined) db.end_date = task.dueDate || null;
  if (task.startDate !== undefined) db.start_date = task.startDate || null;
  if (task.progress !== undefined) db.progress = task.progress;
  if (task.tags !== undefined) db.tags = task.tags;
  if (task.estimatedHours !== undefined) db.estimated_hours = task.estimatedHours || null;
  if (task.workspaceId !== undefined) db.workspace_id = task.workspaceId || null;
  if (task.environmentId !== undefined) db.environment_id = task.environmentId || null;
  if ('roadmapPhaseId' in task) db.roadmap_phase_id = task.roadmapPhaseId || null;
  // Merge user-defined customFields with internal _checklist key
  const hasChecklist = task.checklist !== undefined;
  const hasCustomFields = task.customFields !== undefined;
  if (hasChecklist || hasCustomFields) {
    const userFields = task.customFields || {};
    const merged = { ...userFields };
    if (hasChecklist) {
      if (task.checklist) merged._checklist = task.checklist;
      else delete merged._checklist;
    }
    db.custom_fields = merged;
  }
  // Auto-track closed_at when status changes
  if (task.status !== undefined) {
    if (task.status === 'completed') db.closed_at = new Date().toISOString();
    else db.closed_at = null;
  }
  if (task.frente !== undefined) db.frente = task.frente || null;
  return db;
};

const mapUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role || 'user',
    system_role: row.system_role || row.role || 'user',
    avatar: row.avatar || '👤',
    createdAt: row.created_at,
  };
};

const mapComment = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    content: row.text,
    createdAt: row.created_at,
    user: row.user ? mapUser(row.user) : null,
  };
};

// ============================================================================
// USUARIOS
// ============================================================================

export const dbUsers = {
  getAll: async () => {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapUser);
  },
  getById: async (id) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) throw error;
    return mapUser(data);
  },
  getByEmail: async (email) => {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return mapUser(data);
  },
  create: async (userData) => {
    const { data, error } = await supabase.from('users').insert({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'user',
      avatar: userData.avatar || '👤',
    }).select().single();
    if (error) throw error;
    return mapUser(data);
  },
  update: async (id, updates) => {
    const db = {};
    if (updates.name !== undefined) db.name = updates.name;
    if (updates.email !== undefined) db.email = updates.email;
    if (updates.role !== undefined) db.role = updates.role;
    if (updates.avatar !== undefined) db.avatar = updates.avatar;
    const { data, error } = await supabase.from('users').update(db).eq('id', id).select().single();
    if (error) throw error;
    return mapUser(data);
  },
  delete: async (id) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============================================================================
// ENTORNOS
// ============================================================================

export const dbEnvironments = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('environments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  getByUser: async (userId) => {
    const { data, error } = await supabase
      .from('environments')
      .select(`*, environment_members!inner(user_id)`)
      .eq('environment_members.user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  create: async (environmentData) => {
    const data = await restFetch('environments', 'POST', environmentData);
    return Array.isArray(data) ? data[0] : data;
  },
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('environments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  delete: async (id) => {
    const { data, error } = await supabase
      .from('environments')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('No se eliminó el equipo. Verifica las políticas de permisos en Supabase (RLS).');
    }
  }
};

// ============================================================================
// MIEMBROS DE ENTORNO
// ============================================================================

export const dbEnvironmentMembers = {
  add: async (environmentId, userId, role = 'member', invitedBy = null) => {
    const payload = { environment_id: environmentId, user_id: userId, role };
    if (invitedBy) payload.invited_by = invitedBy;
    const { data, error } = await supabase
      .from('environment_members')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  getByEnvironment: async (environmentId) => {
    const { data, error } = await supabase
      .from('environment_members')
      .select('*')
      .eq('environment_id', environmentId)
      .order('joined_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  isMember: async (environmentId, userId) => {
    const { data, error } = await supabase
      .from('environment_members')
      .select('*')
      .eq('environment_id', environmentId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  isOwner: async (environmentId, userId) => {
    const { data, error } = await supabase
      .from('environment_members')
      .select('role')
      .eq('environment_id', environmentId)
      .eq('user_id', userId)
      .eq('role', 'owner')
      .maybeSingle();
    if (error) throw error;
    return data !== null;
  },
  updateRole: async (environmentId, userId, newRole) => {
    const { error } = await supabase
      .from('environment_members')
      .update({ role: newRole })
      .eq('environment_id', environmentId)
      .eq('user_id', userId);
    if (error) throw error;
  },
  getMyMemberships: async (userId) => {
    const { data, error } = await supabase
      .from('environment_members')
      .select('environment_id, role, joined_at')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  },
  remove: async (environmentId, userId) => {
    const { error } = await supabase
      .from('environment_members')
      .delete()
      .eq('environment_id', environmentId)
      .eq('user_id', userId);
    if (error) throw error;
  }
};

// ============================================================================
// WORKSPACES (ESPACIOS)
// ============================================================================

export const dbWorkspaces = {
  getByEnvironment: async (environmentId) => {
    const url = `${SUPA_URL}/rest/v1/workspaces?environment_id=eq.${environmentId}&order=created_at.desc`;
    const response = await fetch(url, { method: 'GET', headers: restHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.hint || `HTTP ${response.status}`);
    return data || [];
  },
  getById: async (id) => {
    const data = await restFetch(`workspaces?id=eq.${id}`, 'GET');
    return Array.isArray(data) ? data[0] : data;
  },
  create: async (workspaceData) => {
    const data = await restFetch('workspaces', 'POST', workspaceData);
    return Array.isArray(data) ? data[0] : data;
  },
  update: async (id, updates) => {
    const data = await restFetch(`workspaces?id=eq.${id}`, 'PATCH', updates);
    return Array.isArray(data) ? data[0] : data;
  },
  delete: async (id) => {
    await restFetch(`workspaces?id=eq.${id}`, 'DELETE');
  }
};

// ============================================================================
// PROYECTOS
// ============================================================================

export const dbProjects = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*, workspace:workspaces(environment_id)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapProject);
  },
  getByEnvironment: async (environmentId) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*, workspace:workspaces(environment_id)')
      .eq('environment_id', environmentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapProject);
  },
  getByWorkspace: async (workspaceId) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*, workspace:workspaces(environment_id)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapProject);
  },
  getById: async (id) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*, workspace:workspaces(environment_id)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapProject(data);
  },
  create: async (projectData, currentUser = null) => {
    if (currentUser) await setAuditUser(currentUser.id, currentUser.email, currentUser.name);
    const data = await restFetch('projects', 'POST', toDbProject(projectData));
    return mapProject(Array.isArray(data) ? data[0] : data);
  },
  update: async (id, updates, currentUser = null) => {
    if (currentUser) await setAuditUser(currentUser.id, currentUser.email, currentUser.name);
    const data = await restFetch(`projects?id=eq.${id}`, 'PATCH', toDbProject(updates));
    return mapProject(Array.isArray(data) ? data[0] : data);
  },
  delete: async (id, currentUser = null) => {
    if (currentUser) await setAuditUser(currentUser.id, currentUser.email, currentUser.name);
    const data = await restFetch(`projects?id=eq.${id}`, 'DELETE');
    if (Array.isArray(data) && data.length === 0) {
      throw new Error('No se eliminó el proyecto. Verifica las políticas de permisos en Supabase (RLS).');
    }
  }
};

// ============================================================================
// TAREAS
// ============================================================================

export const dbTasks = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapTask);
  },
  getByProject: async (projectId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapTask);
  },
  getById: async (id) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();
    if (error) throw error;
    return mapTask(data);
  },
  getByList: async (listId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('list_id', listId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapTask);
  },
  getSubtasks: async (parentId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapTask);
  },
  create: async (taskData, currentUser = null) => {
    if (currentUser) await setAuditUser(currentUser.id, currentUser.email, currentUser.name);
    const data = await restFetch('tasks', 'POST', { ...toDbTask(taskData), is_deleted: false });
    return mapTask(Array.isArray(data) ? data[0] : data);
  },
  update: async (id, updates, currentUser = null) => {
    if (currentUser) await setAuditUser(currentUser.id, currentUser.email, currentUser.name);
    const body = { ...toDbTask(updates), updated_at: new Date().toISOString() };
    const data = await restFetch(`tasks?id=eq.${id}`, 'PATCH', body);
    return mapTask(Array.isArray(data) ? data[0] : data);
  },
  delete: async (id, currentUser = null) => {
    if (currentUser) await setAuditUser(currentUser.id, currentUser.email, currentUser.name);
    await restFetch(`tasks?id=eq.${id}`, 'DELETE');
  },
  getDeleted: async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_deleted', true)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapTask);
  },
  restore: async (id) => {
    const data = await restFetch(`tasks?id=eq.${id}`, 'PATCH', {
      is_deleted: false,
      updated_at: new Date().toISOString(),
    });
    return mapTask(Array.isArray(data) ? data[0] : data);
  },
};

// ============================================================================
// COMENTARIOS
// ============================================================================

export const dbComments = {
  getByTask: async (taskId) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, user:users(id, name, avatar)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapComment);
  },
  create: async (commentData) => {
    const data = await restFetch('comments', 'POST', {
      task_id: commentData.taskId,
      user_id: commentData.userId,
      text: commentData.content,
    });
    return mapComment(Array.isArray(data) ? data[0] : data);
  },
  delete: async (id) => {
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) throw error;
  }
};

// ============================================================================
// MENSAJES DE CHAT
// ============================================================================

export const dbChatMessages = {
  getByEnvironment: async (environmentId, limit = 100) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`*, user:users(id, name, avatar)`)
      .eq('environment_id', environmentId)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data;
  },
  create: async (messageData) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(messageData)
      .select(`*, user:users(id, name, avatar)`)
      .single();
    if (error) throw error;
    return data;
  },
  subscribe: (environmentId, callback) => {
    const channel = supabase
      .channel(`chat:${environmentId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `environment_id=eq.${environmentId}`
      }, callback)
      .subscribe();
    return channel;
  },
  unsubscribe: (channel) => {
    supabase.removeChannel(channel);
  }
};

// ============================================================================
// LISTAS
// ============================================================================

export const dbLists = {
  getByEnvironment: async (environmentId) => {
    const data = await restFetch(
      `lists?environment_id=eq.${environmentId}&order=created_at.asc`,
      'GET'
    );
    return data || [];
  },
  getByWorkspace: async (workspaceId) => {
    const data = await restFetch(
      `lists?workspace_id=eq.${workspaceId}&order=created_at.asc`,
      'GET'
    );
    return data || [];
  },
  create: async (listData) => {
    const data = await restFetch('lists', 'POST', {
      name: listData.name,
      description: listData.description || '',
      workspace_id: listData.workspaceId || null,
      environment_id: listData.environmentId || null,
      is_private: listData.isPrivate || false,
      created_by: listData.createdBy || null,
    });
    return Array.isArray(data) ? data[0] : data;
  },
  update: async (id, updates) => {
    const db = {};
    if (updates.name !== undefined) db.name = updates.name;
    if (updates.description !== undefined) db.description = updates.description;
    if (updates.isPrivate !== undefined) db.is_private = updates.isPrivate;
    db.updated_at = new Date().toISOString();
    const data = await restFetch(`lists?id=eq.${id}`, 'PATCH', db);
    return Array.isArray(data) ? data[0] : data;
  },
  delete: async (id) => {
    await restFetch(`lists?id=eq.${id}`, 'DELETE');
  },
};

// ============================================================================
// MIEMBROS DEL PROYECTO
// ============================================================================

export const dbProjectMembers = {
  getByProject: async (projectId) => {
    const { data, error } = await supabase
      .from('project_members')
      .select(`*, users(id, name, email, avatar, system_role, role)`)
      .eq('project_id', projectId);
    if (error) throw error;
    return (data || []).map(pm => ({
      id: pm.user_id,
      userId: pm.user_id,
      projectId: pm.project_id,
      role: pm.role,
      name: pm.users?.name || 'Desconocido',
      email: pm.users?.email || '',
      avatar: pm.users?.avatar || '👤',
    }));
  },

  add: async (projectId, userId, role = 'member') => {
    const { data, error } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, user_id: userId, role })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateRole: async (projectId, userId, newRole) => {
    const { data, error } = await supabase
      .from('project_members')
      .update({ role: newRole })
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  remove: async (projectId, userId) => {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);
    if (error) throw error;
  },
};

// ============================================================================
// AUDITORÍA - Configurar usuario actual para triggers
// ============================================================================

export const setAuditUser = async (userId, userEmail, userName) => {
  try {
    await supabase.rpc('set_audit_user', {
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
    });
  } catch (err) {
    // No bloquear la operación si falla; los triggers de Supabase
    // siguen funcionando con auth.uid() como fallback.
    console.warn('[setAuditUser] No se pudo establecer contexto de auditoría:', err?.message);
  }
};

// ============================================================================
// HISTORIAL - Consultar audit_log
// ============================================================================

export const dbAuditLog = {

  getHistory: async (tableName, recordId) => {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .order('changed_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getRecentChanges: async (tableName, limit = 50) => {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('table_name', tableName)
      .order('changed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  getUserActivity: async (userId, limit = 100) => {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('user_id', userId)
      .order('changed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  getStatusChanges: async (recordId = null) => {
    let query = supabase
      .from('audit_log')
      .select('*')
      .eq('table_name', 'tasks')
      .contains('changed_fields', ['status']);
    if (recordId) query = query.eq('record_id', recordId);
    const { data, error } = await query.order('changed_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};

// ============================================================================
// KPI THRESHOLDS
// ============================================================================

export const dbKpiThresholds = {
  get: async (environmentId = null) => {
    let query = supabase.from('kpi_thresholds').select('*');
    if (environmentId) query = query.eq('environment_id', environmentId);
    else query = query.is('environment_id', null);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data || { threshold_good: 90, threshold_leve: 80 };
  },
  upsert: async (environmentId, thresholdGood, thresholdLeve) => {
    const payload = {
      environment_id: environmentId || null,
      threshold_good: thresholdGood,
      threshold_leve: thresholdLeve,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('kpi_thresholds')
      .upsert(payload, { onConflict: 'environment_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ============================================================================
// PERFORMANCE METRICS (RPC)
// ============================================================================

export const dbPerformance = {
  getMetrics: async ({ workspaceId, frente, startDate, endDate } = {}) => {
    const start = startDate || '2020-01-01';
    const end   = endDate ? `${endDate}T23:59:59` : '2099-12-31T23:59:59';

    let query = supabase
      .from('tasks')
      .select('id, assignee_id, closed_at, updated_at, end_date, frente, estimated_hours, assignee:users(id, name, avatar)')
      .eq('status', 'completed')
      .eq('is_deleted', false)
      .or(
        `and(closed_at.not.is.null,closed_at.gte.${start},closed_at.lte.${end}),` +
        `and(closed_at.is.null,updated_at.gte.${start},updated_at.lte.${end})`
      );

    if (workspaceId) query = query.eq('workspace_id', workspaceId);
    if (frente)      query = query.eq('frente', frente);

    const { data, error } = await query;
    if (error) throw error;

    const map = {};
    (data || []).forEach(task => {
      const aid           = task.assignee_id;           // null = sin asignar
      const fk            = task.frente || '__nf__';    // group key for frente
      const key           = `${fk}::${aid || '__na__'}`;
      const effectiveDate = task.closed_at || task.updated_at;

      if (!map[key]) {
        map[key] = {
          assignee_id:   aid,
          assignee_name: aid ? (task.assignee?.name || 'Sin nombre') : 'Sin asignar',
          avatar:        aid ? (task.assignee?.avatar || null) : null,
          frente:        task.frente || null,
          total_closed:  0,
          // KPI: solo tareas con closed_at real (Fix 1)
          _on_time:      0,
          _late:         0,
          _real_kpi:     0,
          trend_data:    [],
          _hours:        [],
        };
      }
      map[key].total_closed++;
      if (effectiveDate) map[key].trend_data.push({ t: effectiveDate, v: 1 });
      if (task.estimated_hours != null) map[key]._hours.push(task.estimated_hours);
      // KPI y tardías solo si closed_at existe (no usar updated_at como fallback)
      if (task.closed_at && task.end_date) {
        map[key]._real_kpi++;
        if (task.closed_at.slice(0, 10) <= task.end_date) map[key]._on_time++;
        else map[key]._late++;
      }
    });

    return Object.values(map).map(r => {
      const { _on_time, _late, _real_kpi, _hours, ...rest } = r;
      return {
        ...rest,
        // null = sin datos reales de closed_at (no mostrar KPI)
        kpi_pct:    (rest.assignee_id && _real_kpi >= 2)
          ? Math.round((_on_time / _real_kpi) * 100)
          : null,
        late_count: _late,
        size_dist: {
          xs: _hours.filter(h => h < 2).length,
          s:  _hours.filter(h => h >= 2 && h < 5).length,
          m:  _hours.filter(h => h >= 5 && h < 10).length,
          l:  _hours.filter(h => h >= 10).length,
        },
      };
    });
  },
  getFrenteOptions: async (workspaceId = null) => {
    let query = supabase
      .from('tasks')
      .select('frente')
      .not('frente', 'is', null)
      .neq('frente', '');
    if (workspaceId) query = query.eq('workspace_id', workspaceId);
    const { data, error } = await query;
    if (error) throw error;
    return [...new Set((data || []).map(r => r.frente))].sort();
  },

  getTallajeDistribution: async ({ environmentId, startDate, endDate } = {}) => {
    const eod = `${endDate || new Date().toISOString().slice(0, 10)}T23:59:59`;
    let query = supabase
      .from('tasks')
      .select(environmentId
        ? 'assignee_id, estimated_hours, projects!inner(environment_id)'
        : 'assignee_id, estimated_hours')
      .not('assignee_id', 'is', null)
      .not('closed_at', 'is', null)
      .eq('is_deleted', false)
      .gte('closed_at', startDate || '2020-01-01')
      .lte('closed_at', eod);

    if (environmentId) query = query.eq('projects.environment_id', environmentId);

    const { data, error } = await query;
    if (error) throw error;
    const map = {};
    (data || []).forEach(t => {
      const aid = String(t.assignee_id);
      if (!map[aid]) map[aid] = { xs: 0, s: 0, m: 0, l: 0 };
      const h = t.estimated_hours;
      if (h == null) return;
      if (h < 2)       map[aid].xs++;
      else if (h < 5)  map[aid].s++;
      else if (h < 10) map[aid].m++;
      else             map[aid].l++;
    });
    return map;
  },
};

// ============================================================================
// HELPER: Manejo de errores
// ============================================================================

export const handleSupabaseError = (error) => {
  console.error('Supabase Error:', error);

  // Error específico del trigger Expedite
  if (error.message?.includes('EXPEDITE_BLOCK')) {
    return '⚠️ Tienes una tarea Expedite activa. Resuélvela antes de avanzar otras tareas.';
  }
  if (error.code === '23505') return 'Este registro ya existe (duplicado)';
  if (error.code === '23503') return 'Error de referencia: un campo apunta a un registro que no existe';
  if (error.code === '42P01') return 'La tabla no existe';

  return error.message || 'Error desconocido en la base de datos';
};