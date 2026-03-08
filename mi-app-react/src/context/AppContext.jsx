// ============================================================================
// APP CONTEXT CON SUPABASE
// ============================================================================
// Este contexto reemplaza localStorage por Supabase
// ============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  dbEnvironments, 
  dbEnvironmentMembers,
  dbWorkspaces, 
  dbProjects,
  dbTasks,
  dbComments,
  dbChatMessages,
  handleSupabaseError 
} from '../lib/database';

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

  // ============================================================================
  // CARGAR DATOS INICIALES
  // ============================================================================
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);

        // Por ahora, usamos un usuario hardcodeado
        // Después implementaremos autenticación real
        const mockUser = {
          id: 'temp-user-id', // Este será reemplazado con auth real
          email: 'user@seitra.com',
          name: 'Usuario Demo',
          avatar: '👤',
          role: 'admin'
        };
        
        setCurrentUser(mockUser);

        // Cargar entornos del usuario
        // Por ahora cargamos todos, después filtraremos por usuario
        const envs = await dbEnvironments.getAll();
        setEnvironments(envs);

        // Si hay entornos, seleccionar el primero por defecto
        if (envs.length > 0) {
          setCurrentEnvironment(envs[0]);
          
          // Cargar workspaces del entorno
          const workspaces = await dbWorkspaces.getByEnvironment(envs[0].id);
          
          // Actualizar el entorno con sus workspaces
          setEnvironments(prevEnvs => 
            prevEnvs.map(env => 
              env.id === envs[0].id 
                ? { ...env, workspaces }
                : env
            )
          );
        }

      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
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
        owner_id: currentUser?.id
      });

      // Agregar el creador como miembro admin
      if (currentUser?.id) {
        await dbEnvironmentMembers.add(newEnv.id, currentUser.id, 'admin');
      }

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

      // Agregar el workspace al entorno correspondiente
      setEnvironments(prev =>
        prev.map(env => {
          if (env.id === envId) {
            return {
              ...env,
              workspaces: [...(env.workspaces || []), newWorkspace]
            };
          }
          return env;
        })
      );

      // Si es el entorno actual, actualizar también
      if (currentEnvironment?.id === envId) {
        setCurrentEnvironment(prev => ({
          ...prev,
          workspaces: [...(prev.workspaces || []), newWorkspace]
        }));
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
  // VALOR DEL CONTEXTO
  // ============================================================================

  const value = {
    // Estado
    environments,
    currentEnvironment,
    currentWorkspace,
    currentUser,
    isLoading,

    // Setters
    setEnvironments,
    setCurrentEnvironmentState,
    setCurrentWorkspaceState,
    setCurrentUser,

    // Environments
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,

    // Workspaces
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,

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