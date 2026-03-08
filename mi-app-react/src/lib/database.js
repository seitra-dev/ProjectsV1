// ============================================================================
// SEITRA - SERVICIO DE BASE DE DATOS CON SUPABASE

import { supabase } from './supabase';

// ============================================================================
// USUARIOS
// ============================================================================

export const dbUsers = {
  // Obtener todos los usuarios
  getAll: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Obtener usuario por ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Obtener usuario por email
  getByEmail: async (email) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Crear usuario
  create: async (userData) => {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Actualizar usuario
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar usuario
  delete: async (id) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
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
    const { data, error } = await supabase
      .from('environments')
      .insert(environmentData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
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
    const { error } = await supabase
      .from('environments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
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
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('environment_id', environmentId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Obtener workspace por ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Crear workspace
  create: async (workspaceData) => {
    const { data, error } = await supabase
      .from('workspaces')
      .insert(workspaceData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Actualizar workspace
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar workspace
  delete: async (id) => {
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ============================================================================
// PROYECTOS
// ============================================================================

export const dbProjects = {
  // Obtener proyectos de un workspace
  getByWorkspace: async (workspaceId) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Obtener proyecto por ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Crear proyecto
  create: async (projectData) => {
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Actualizar proyecto
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar proyecto
  delete: async (id) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ============================================================================
// TAREAS
// ============================================================================

export const dbTasks = {
  // Obtener tareas de un proyecto
  getByProject: async (projectId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:users(id, name, avatar)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Obtener tarea por ID
  getById: async (id) => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:users(id, name, avatar)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Obtener subtareas
  getSubtasks: async (parentId) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Crear tarea
  create: async (taskData) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Actualizar tarea
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar tarea
  delete: async (id) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ============================================================================
// COMENTARIOS
// ============================================================================

export const dbComments = {
  // Obtener comentarios de una tarea
  getByTask: async (taskId) => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:users(id, name, avatar)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Crear comentario
  create: async (commentData) => {
    const { data, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Eliminar comentario
  delete: async (id) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ============================================================================
// MENSAJES DE CHAT
// ============================================================================

export const dbChatMessages = {
  // Obtener mensajes de un workspace
  getByWorkspace: async (workspaceId, limit = 100) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:users(id, name, avatar)
      `)
      .eq('workspace_id', workspaceId)
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
  subscribe: (workspaceId, callback) => {
    const channel = supabase
      .channel(`chat:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `workspace_id=eq.${workspaceId}`
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
// HELPER: Manejo de errores
// ============================================================================

export const handleSupabaseError = (error) => {
  console.error('Supabase Error:', error);
  
  // Errores comunes
  if (error.code === '23505') {
    return 'Este registro ya existe (duplicado)';
  }
  if (error.code === '23503') {
    return 'No se puede eliminar porque tiene datos relacionados';
  }
  if (error.code === '42P01') {
    return 'La tabla no existe';
  }
  
  return error.message || 'Error desconocido en la base de datos';
};