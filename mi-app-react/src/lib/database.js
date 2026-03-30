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
// MAPPERS: DB (snake_case) <-> Frontend (camelCase)
// ============================================================================

const mapProject = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    status: row.status || 'active',
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
  if (project.startDate !== undefined) db.start_date = project.startDate;
  if (project.endDate !== undefined) db.end_date = project.endDate;
  if (project.progress !== undefined) db.progress = project.progress;
  if (project.leaderId !== undefined) db.owner_id = project.leaderId;
  if (project.workspaceId !== undefined) db.workspace_id = project.workspaceId;
  if (project.environmentId !== undefined) db.environment_id = project.environmentId;
  if (project.tags !== undefined) db.tags = project.tags;
  if (project.members !== undefined) db.members = project.members || [];
  if (project.favorite !== undefined) db.favorite = project.favorite;
  if (project.roadmap !== undefined) db.roadmap = project.roadmap;
  return db;
};

const mapTask = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    status: (row.status || 'todo').toLowerCase(),
    priority: (row.priority || 'medium').toLowerCase(),
    projectId: row.project_id,
    listId: row.list_id || null,
    assigneeId: row.assignee_id,
    parentId: row.parent_id || null,
    dueDate: row.end_date,
    endDate: row.end_date,
    startDate: row.start_date,
    progress: row.progress || 0,
    tags: row.tags || [],
    estimatedHours: row.estimated_hours,
    dependencies: row.dependencies || [],
    roadmapPhaseId: row.roadmap_phase_id || null,
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
  if (task.dependencies !== undefined) db.dependencies = task.dependencies;
  if (task.workspaceId !== undefined) db.workspace_id = task.workspaceId || null;
  if (task.environmentId !== undefined) db.environment_id = task.environmentId || null;
  if (task.roadmapPhaseId) db.roadmap_phase_id = task.roadmapPhaseId;
  return db;
};

const mapUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role || 'user',
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
    content: row.content,
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
  // Obtener todos los entornos
  getAll: async () => {
    const { data, error } = await supabase
      .from('environments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Obtener entornos de un usuario
  getByUser: async (userId) => {
    const { data, error } = await supabase
      .from('environments')
      .select(`
        *,
        environment_members!inner(user_id)
      `)
      .eq('environment_members.user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Crear entorno
  create: async (environmentData) => {
    const data = await restFetch('environments', 'POST', environmentData);
    return Array.isArray(data) ? data[0] : data;
  },

  // Actualizar entorno
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

  // Eliminar entorno
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
  // Agregar miembro a entorno
  add: async (environmentId, userId, role = 'member') => {
    const { data, error } = await supabase
      .from('environment_members')
      .insert({
        environment_id: environmentId,
        user_id: userId,
        role
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Obtener miembros de un entorno
  getByEnvironment: async (environmentId) => {
    const { data, error } = await supabase
      .from('environment_members')
      .select(`
        *,
        users(id, name, email, avatar)
      `)
      .eq('environment_id', environmentId);
    
    if (error) throw error;
    return data;
  },

  // Eliminar miembro de entorno
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
  // Obtener workspaces de un entorno
  getByEnvironment: async (environmentId) => {
    console.log('[dbWorkspaces] buscando workspaces para env:', environmentId);
    const url = `${SUPA_URL}/rest/v1/workspaces?environment_id=eq.${environmentId}&order=created_at.desc`;
    console.log('[dbWorkspaces] URL completa:', url);
    console.log('[dbWorkspaces] token usado:', getAuthToken()?.substring(0, 30) + '...');
    const response = await fetch(url, { method: 'GET', headers: restHeaders() });
    console.log('[dbWorkspaces] respuesta status:', response.status);
    const data = await response.json();
    console.log('[dbWorkspaces] data recibida:', data);
    if (!response.ok) throw new Error(data.message || data.hint || `HTTP ${response.status}`);
    return data || [];
  },

  // Obtener workspace por ID
  getById: async (id) => {
    const data = await restFetch(`workspaces?id=eq.${id}`, 'GET');
    return Array.isArray(data) ? data[0] : data;
  },

  // Crear workspace
  create: async (workspaceData) => {
    const data = await restFetch('workspaces', 'POST', workspaceData);
    return Array.isArray(data) ? data[0] : data;
  },

  // Actualizar workspace
  update: async (id, updates) => {
    const data = await restFetch(`workspaces?id=eq.${id}`, 'PATCH', updates);
    return Array.isArray(data) ? data[0] : data;
  },

  // Eliminar workspace
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
  create: async (projectData) => {
    const data = await restFetch('projects', 'POST', toDbProject(projectData));
    return mapProject(Array.isArray(data) ? data[0] : data);
  },
  update: async (id, updates) => {
    const data = await restFetch(`projects?id=eq.${id}`, 'PATCH', toDbProject(updates));
    return mapProject(Array.isArray(data) ? data[0] : data);
  },
  delete: async (id) => {
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
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapTask);
  },
  getByProject: async (projectId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapTask);
  },
  getById: async (id) => {
    const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (error) throw error;
    return mapTask(data);
  },
  getByList: async (listId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapTask);
  },
  getSubtasks: async (parentId) => {
    const { data, error } = await supabase.from('tasks').select('*').eq('parent_id', parentId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapTask);
  },
  create: async (taskData) => {
    const data = await restFetch('tasks', 'POST', toDbTask(taskData));
    return mapTask(Array.isArray(data) ? data[0] : data);
  },
  update: async (id, updates) => {
    const body = { ...toDbTask(updates), updated_at: new Date().toISOString() };
    const data = await restFetch(`tasks?id=eq.${id}`, 'PATCH', body);
    return mapTask(Array.isArray(data) ? data[0] : data);
  },
  delete: async (id) => {
    const { data, error } = await supabase.from('tasks').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('La tarea no existe o no tienes permisos para eliminarla');
    }
  }
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
      content: commentData.content,
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
  // Obtener mensajes de un environment
  getByEnvironment: async (environmentId, limit = 100) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:users(id, name, avatar)
      `)
      .eq('environment_id', environmentId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Crear mensaje
  create: async (messageData) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(messageData)
      .select(`
        *,
        user:users(id, name, avatar)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Suscribirse a nuevos mensajes en tiempo real
  subscribe: (environmentId, callback) => {
    const channel = supabase
      .channel(`chat:${environmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `environment_id=eq.${environmentId}`
        },
        callback
      )
      .subscribe();

    return channel;
  },

  // Cancelar suscripción
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
// HELPER: Manejo de errores
// ============================================================================

export const handleSupabaseError = (error) => {
  console.error('Supabase Error:', error);
  
  // Errores comunes
  if (error.code === '23505') {
    return 'Este registro ya existe (duplicado)';
  }
  if (error.code === '23503') {
    return 'Error de referencia: un campo apunta a un registro que no existe';
  }
  if (error.code === '42P01') {
    return 'La tabla no existe';
  }
  
  return error.message || 'Error desconocido en la base de datos';
};