
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  dbEnvironments,
  dbEnvironmentMembers,
  dbWorkspaces,
  dbProjects,
  dbTasks,
  dbComments,
  dbChatMessages,
  dbLists,
  handleSupabaseError
} from '../lib/database';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // ============================================================================
  // ESTADO
  // ============================================================================
  const [environments, setEnvironments] = useState([]);
  const [currentEnvironment, setCurrentEnvironment] = useState(null);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lists, setLists] = useState([]);

  // ==========================================================================
  // HELPERS (compatibilidad con AppContext-OLD)
  // ==========================================================================

  const setCurrentEnvironmentById = async (envId) => {
    if (!envId) {
      setCurrentEnvironment(null);
      setCurrentWorkspace(null);
      return;
    }

    const env = environments.find((e) => e.id === envId);
    if (!env) return;

    // Cargar workspaces en caso de que aún no estén cargados
    const workspaces = env.workspaces ?? (await dbWorkspaces.getByEnvironment(envId));
    const envWithWorkspaces = { ...env, workspaces };

    setCurrentEnvironment(envWithWorkspaces);
    setEnvironments((prevEnvs) =>
      prevEnvs.map((e) => (e.id === envId ? envWithWorkspaces : e))
    );

    // Resetear workspace al cambiar de entorno
    setCurrentWorkspace(null);
  };

  const setCurrentWorkspaceById = (workspaceId) => {
    if (!workspaceId) {
      setCurrentWorkspace(null);
      return;
    }

    const workspace = currentEnvironment?.workspaces?.find((w) => w.id === workspaceId);
    setCurrentWorkspace(workspace || null);
  };

  // ============================================================================
  // CARGAR DATOS INICIALES
  // ============================================================================

  // Helper: obtener usuario de localStorage sin pasar por el SDK
  const getUserFromStorage = () => {
    try {
      const ref = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0];
      const raw = localStorage.getItem(`sb-${ref}-auth-token`);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (!session?.user || !session?.access_token) return null;
      return session.user;
    } catch { return null; }
  };

  const loadEnvironments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AppContext] SDK session:', session?.user?.email, '| uid:', session?.user?.id);
      console.log('[AppContext] iniciando carga de entornos...');
      const envs = await dbEnvironments.getAll();
      console.log('[AppContext] entornos encontrados:', envs);
      setEnvironments(envs);

      if (envs.length > 0) {
        setCurrentEnvironment(envs[0]);
        console.log('[AppContext] llamando getByEnvironment con:', envs[0]?.id);
        const workspaces = await dbWorkspaces.getByEnvironment(envs[0].id);
        console.log('[AppContext] workspaces recibidos:', workspaces);
        const loadedLists = await dbLists.getByEnvironment(envs[0].id);
        setEnvironments(prev =>
          prev.map(env =>
            env.id === envs[0].id ? { ...env, workspaces } : env
          )
        );
        console.log('[AppContext] setCurrentEnvironment con workspaces:', { ...envs[0], workspaces });
        setCurrentEnvironment(prev => ({ ...prev, workspaces }));
        setLists(loadedLists);
      }
    } catch (error) {
      console.error('[AppContext] Error cargando entornos:', error);
    }
  };

useEffect(() => {
  // ── Fallback inmediato desde localStorage (no depende de onAuthStateChange) ──
  const storedUser = getUserFromStorage();
  if (storedUser) {
    console.log('[AppContext] sesión encontrada en localStorage, cargando sin esperar SDK...');
    setCurrentUser({
      id: storedUser.id,
      email: storedUser.email,
      name: storedUser.user_metadata?.name || storedUser.email,
      role: storedUser.user_metadata?.role || 'user',
    });
    loadEnvironments().finally(() => setIsLoading(false));
  } else {
    setIsLoading(false);
  }

  // ── Listener del SDK (complementario, por si el token se renueva) ──
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('[AppContext] onAuthStateChange:', event, '| user:', session?.user?.email);
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email,
          role: session.user.user_metadata?.role || 'user',
        });
        // Solo recargar entornos si aún no se cargaron
        setEnvironments(prev => {
          if (prev.length === 0) {
            loadEnvironments();
          }
          return prev;
        });
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setEnvironments([]);
        setCurrentEnvironment(null);
        setCurrentWorkspace(null);
      }
      setIsLoading(false);
    }
  );

  return () => subscription.unsubscribe();
}, []);

  // ============================================================================
  // ENVIRONMENTS
  // ============================================================================

  const createEnvironment = async (data) => {
  try {
    const newEnv = await dbEnvironments.create({
      name: data.name,
      description: data.description || '',
      color: data.color || '#6366f1',
      icon: data.icon || '📊',
    });

      // Agregar workspaces vacío
      const envWithWorkspaces = { ...newEnv, workspaces: [] };
      setEnvironments(prev => [...prev, envWithWorkspaces]);
      
      return envWithWorkspaces;
    } catch (error) {
      console.error('Error creando entorno:', error);
      throw new Error(handleSupabaseError(error));
    }
  };

  const updateEnvironment = async (envId, data) => {
    try {
      const updated = await dbEnvironments.update(envId, data);
      
      setEnvironments(prev =>
        prev.map(env => env.id === envId ? { ...env, ...updated } : env)
      );

      // Actualizar currentEnvironment si es el que se editó
      if (currentEnvironment?.id === envId) {
        setCurrentEnvironment(prev => ({ ...prev, ...updated }));
      }

      return updated;
    } catch (error) {
      console.error('Error actualizando entorno:', error);
      throw new Error(handleSupabaseError(error));
    }
  };

  const deleteEnvironment = async (envId) => {
    try {
      await dbEnvironments.delete(envId);
      
      setEnvironments(prev => prev.filter(env => env.id !== envId));

      // Si se eliminó el entorno actual, resetear
      if (currentEnvironment?.id === envId) {
        setCurrentEnvironment(null);
        setCurrentWorkspace(null);
      }
    } catch (error) {
      console.error('Error eliminando entorno:', error);
      throw new Error(handleSupabaseError(error));
    }
  };

  const setCurrentEnvironmentState = async (env) => {
    try {
      setCurrentEnvironment(env);
      
      if (env) {
        // Cargar workspaces del entorno si no los tiene
        if (!env.workspaces) {
          const workspaces = await dbWorkspaces.getByEnvironment(env.id);
          
          // Actualizar el entorno con sus workspaces
          const envWithWorkspaces = { ...env, workspaces };
          setCurrentEnvironment(envWithWorkspaces);
          
          setEnvironments(prev =>
            prev.map(e => e.id === env.id ? envWithWorkspaces : e)
          );
        }
      }
    } catch (error) {
      console.error('Error cargando workspaces:', error);
    }
  };

  // ============================================================================
  // WORKSPACES
  // ============================================================================

  const createWorkspace = async (envId, data) => {
    try {
      const newWorkspace = await dbWorkspaces.create({
        environment_id: envId,
        name: data.name,
        description: data.description || '',
        icon: data.settings?.icon || 'Briefcase',
        visibility: data.settings?.visibility || 'all_members',
        permission: data.settings?.permission || 'full',
        created_by: currentUser?.id
      });

      // Recargar todos los workspaces del entorno desde Supabase (garantiza estado fresco)
      const freshWorkspaces = await dbWorkspaces.getByEnvironment(envId);

      setEnvironments(prev =>
        prev.map(env =>
          env.id === envId ? { ...env, workspaces: freshWorkspaces } : env
        )
      );

      if (currentEnvironment?.id === envId) {
        setCurrentEnvironment(prev => ({ ...prev, workspaces: freshWorkspaces }));
      }

      return newWorkspace;
    } catch (error) {
      console.error('Error creando workspace:', error);
      throw new Error(handleSupabaseError(error));
    }
  };

  const updateWorkspace = async (workspaceId, data) => {
    try {
      const updated = await dbWorkspaces.update(workspaceId, data);

      // Actualizar en environments
      setEnvironments(prev =>
        prev.map(env => ({
          ...env,
          workspaces: env.workspaces?.map(ws =>
            ws.id === workspaceId ? { ...ws, ...updated } : ws
          )
        }))
      );

      // Actualizar en currentEnvironment
      if (currentEnvironment) {
        setCurrentEnvironment(prev => ({
          ...prev,
          workspaces: prev.workspaces?.map(ws =>
            ws.id === workspaceId ? { ...ws, ...updated } : ws
          )
        }));
      }

      // Actualizar currentWorkspace si es el que se editó
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace(prev => ({ ...prev, ...updated }));
      }

      return updated;
    } catch (error) {
      console.error('Error actualizando workspace:', error);
      throw new Error(handleSupabaseError(error));
    }
  };

  const deleteWorkspace = async (workspaceId) => {
    try {
      await dbWorkspaces.delete(workspaceId);

      // Eliminar de environments
      setEnvironments(prev =>
        prev.map(env => ({
          ...env,
          workspaces: env.workspaces?.filter(ws => ws.id !== workspaceId)
        }))
      );

      // Eliminar de currentEnvironment
      if (currentEnvironment) {
        setCurrentEnvironment(prev => ({
          ...prev,
          workspaces: prev.workspaces?.filter(ws => ws.id !== workspaceId)
        }));
      }

      // Si se eliminó el workspace actual, resetear
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace(null);
      }
    } catch (error) {
      console.error('Error eliminando workspace:', error);
      throw new Error(handleSupabaseError(error));
    }
  };

  const setCurrentWorkspaceState = (workspace) => {
    setCurrentWorkspace(workspace);
  };

  // ============================================================================
  // LISTAS
  // ============================================================================

  const createList = async (listData) => {
    const newList = await dbLists.create(listData);
    setLists(prev => [...prev, newList]);
    return newList;
  };

  const updateList = async (listId, updates) => {
    const updated = await dbLists.update(listId, updates);
    setLists(prev => prev.map(l => l.id === listId ? { ...l, ...updated } : l));
    return updated;
  };

  const deleteList = async (listId) => {
    await dbLists.delete(listId);
    setLists(prev => prev.filter(l => l.id !== listId));
  };

  // ============================================================================
  // VALOR DEL CONTEXTO
  // ============================================================================

  const value = {
    // Estado
    environments,
    currentEnvironment,
    currentWorkspace,
    currentUser,
    isLoading,
    lists,

    // Setters
    setEnvironments,
    setCurrentEnvironmentState,
    setCurrentWorkspaceState,
    // Legacy-friendly setters (compatibilidad con AppContext-OLD)
    setCurrentEnvironment: setCurrentEnvironmentById,
    setCurrentWorkspace: setCurrentWorkspaceById,
    setCurrentUser,

    // Environments
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,

    // Workspaces
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,

    // Lists
    createList,
    updateList,
    deleteList,

    // Database utilities (para que los componentes puedan usarlos directamente)
    db: {
      projects: dbProjects,
      tasks: dbTasks,
      comments: dbComments,
      chat: dbChatMessages
    }
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};