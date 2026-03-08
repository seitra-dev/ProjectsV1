import React, { createContext, useContext, useState, useEffect } from 'react';

// ============================================================================
// APP CONTEXT - Gestión de Estado Global
// ============================================================================

const STORAGE_KEYS = {
  ENVIRONMENTS: 'seitra_environments',
  CURRENT_ENV: 'seitra_current_environment',
  CURRENT_WORKSPACE: 'seitra_current_workspace',
  USER: 'seitra_current_user'
};

// ─── HELPERS DE STORAGE ────────────────────────────────────────────────────

const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error(`Error reading ${key}:`, e);
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
    }
  },
  delete: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error deleting ${key}:`, e);
    }
  }
};

// ─── PERMISOS POR DEFECTO ──────────────────────────────────────────────────

const DEFAULT_PERMISSIONS = {
  canCreateWorkspace: false,
  canDeleteWorkspace: false,
  canInviteMembers: false,
  canManageSettings: false,
  canCreateProjects: true,
  canDeleteProjects: false,
};

const ADMIN_PERMISSIONS = {
  canCreateWorkspace: true,
  canDeleteWorkspace: true,
  canInviteMembers: true,
  canManageSettings: true,
  canCreateProjects: true,
  canDeleteProjects: true,
};

// ─── CONTEXT ───────────────────────────────────────────────────────────────

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// ─── PROVIDER ──────────────────────────────────────────────────────────────

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [environments, setEnvironments] = useState([]);
  const [currentEnvironment, setCurrentEnvironmentState] = useState(null);
  const [currentWorkspace, setCurrentWorkspaceState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── INICIALIZACIÓN ──────────────────────────────────────────────────────

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = () => {
    // Cargar usuario
    const user = storage.get(STORAGE_KEYS.USER);
    setCurrentUser(user);

    // Cargar entornos
    const envs = storage.get(STORAGE_KEYS.ENVIRONMENTS) || [];
    setEnvironments(envs);

    // Cargar entorno actual
    const currentEnvId = storage.get(STORAGE_KEYS.CURRENT_ENV);
    if (currentEnvId) {
      const env = envs.find(e => e.id === currentEnvId);
      setCurrentEnvironmentState(env || null);
    }

    // Cargar workspace actual
    const currentWsId = storage.get(STORAGE_KEYS.CURRENT_WORKSPACE);
    if (currentWsId && currentEnvId) {
      const env = envs.find(e => e.id === currentEnvId);
      const ws = env?.workspaces?.find(w => w.id === currentWsId);
      setCurrentWorkspaceState(ws || null);
    }

    setIsLoading(false);
  };

  // ─── ENVIRONMENT ACTIONS ─────────────────────────────────────────────────

  const setCurrentEnvironment = (envId) => {
    const env = environments.find(e => e.id === envId);
    setCurrentEnvironmentState(env || null);
    setCurrentWorkspaceState(null); // Reset workspace al cambiar entorno
    storage.set(STORAGE_KEYS.CURRENT_ENV, envId);
    storage.delete(STORAGE_KEYS.CURRENT_WORKSPACE);
  };

  const createEnvironment = async (data) => {
    const newEnv = {
      id: Date.now().toString(),
      name: data.name || 'Nuevo Entorno',
      description: data.description || '',
      color: data.color || '#0066FF',
      icon: data.icon || '📁',
      members: data.members || [
        {
          userId: currentUser?.id,
          role: 'admin',
          permissions: ADMIN_PERMISSIONS,
          joinedAt: new Date().toISOString()
        }
      ],
      workspaces: [],
      settings: {
        visibility: 'private',
        defaultPermissions: DEFAULT_PERMISSIONS,
        allowGuestAccess: false,
        workspaceCreationOpen: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: currentUser?.id
    };

    const updated = [...environments, newEnv];
    setEnvironments(updated);
    storage.set(STORAGE_KEYS.ENVIRONMENTS, updated);
    
    return newEnv;
  };

  const updateEnvironment = (envId, data) => {
    const updated = environments.map(env => 
      env.id === envId 
        ? { ...env, ...data, updatedAt: new Date().toISOString() }
        : env
    );
    setEnvironments(updated);
    storage.set(STORAGE_KEYS.ENVIRONMENTS, updated);

    // Actualizar current environment si es el activo
    if (currentEnvironment?.id === envId) {
      const updatedEnv = updated.find(e => e.id === envId);
      setCurrentEnvironmentState(updatedEnv);
    }
  };

  const deleteEnvironment = (envId) => {
    const updated = environments.filter(env => env.id !== envId);
    setEnvironments(updated);
    storage.set(STORAGE_KEYS.ENVIRONMENTS, updated);

    // Si se eliminó el entorno activo, resetear
    if (currentEnvironment?.id === envId) {
      setCurrentEnvironmentState(null);
      setCurrentWorkspaceState(null);
      storage.delete(STORAGE_KEYS.CURRENT_ENV);
      storage.delete(STORAGE_KEYS.CURRENT_WORKSPACE);
    }
  };

  // ─── WORKSPACE ACTIONS ───────────────────────────────────────────────────

  const setCurrentWorkspace = (workspaceId) => {
    if (!workspaceId) {
      setCurrentWorkspaceState(null);
      storage.delete(STORAGE_KEYS.CURRENT_WORKSPACE);
      return;
    }

    const ws = currentEnvironment?.workspaces?.find(w => w.id === workspaceId);
    setCurrentWorkspaceState(ws || null);
    storage.set(STORAGE_KEYS.CURRENT_WORKSPACE, workspaceId);
  };

  const createWorkspace = async (envId, data) => {
    const newWorkspace = {
      id: Date.now().toString(),
      name: data.name || 'Nuevo Espacio',
      description: data.description || '',
      environmentId: envId,
      modules: data.modules || [],
      members: data.members || [
        {
          userId: currentUser?.id,
          role: 'admin',
          addedAt: new Date().toISOString()
        }
      ],
      settings: {
        visibility: 'all_members',
        color: data.color,
        icon: data.icon
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser?.id
    };

    const updated = environments.map(env => {
      if (env.id === envId) {
        return {
          ...env,
          workspaces: [...(env.workspaces || []), newWorkspace],
          updatedAt: new Date().toISOString()
        };
      }
      return env;
    });

    setEnvironments(updated);
    storage.set(STORAGE_KEYS.ENVIRONMENTS, updated);

    // Actualizar current environment si es el activo
    if (currentEnvironment?.id === envId) {
      const updatedEnv = updated.find(e => e.id === envId);
      setCurrentEnvironmentState(updatedEnv);
    }

    return newWorkspace;
  };

  const updateWorkspace = (workspaceId, data) => {
    const updated = environments.map(env => ({
      ...env,
      workspaces: env.workspaces?.map(ws => 
        ws.id === workspaceId 
          ? { ...ws, ...data, updatedAt: new Date().toISOString() }
          : ws
      )
    }));

    setEnvironments(updated);
    storage.set(STORAGE_KEYS.ENVIRONMENTS, updated);

    // Actualizar estados actuales
    if (currentEnvironment) {
      const updatedEnv = updated.find(e => e.id === currentEnvironment.id);
      setCurrentEnvironmentState(updatedEnv);

      if (currentWorkspace?.id === workspaceId) {
        const updatedWs = updatedEnv?.workspaces?.find(w => w.id === workspaceId);
        setCurrentWorkspaceState(updatedWs);
      }
    }
  };

  const deleteWorkspace = (workspaceId) => {
    const updated = environments.map(env => ({
      ...env,
      workspaces: env.workspaces?.filter(ws => ws.id !== workspaceId)
    }));

    setEnvironments(updated);
    storage.set(STORAGE_KEYS.ENVIRONMENTS, updated);

    // Si se eliminó el workspace activo, resetear
    if (currentWorkspace?.id === workspaceId) {
      setCurrentWorkspaceState(null);
      storage.delete(STORAGE_KEYS.CURRENT_WORKSPACE);
    }

    // Actualizar current environment
    if (currentEnvironment) {
      const updatedEnv = updated.find(e => e.id === currentEnvironment.id);
      setCurrentEnvironmentState(updatedEnv);
    }
  };

  // ─── MODULE ACTIONS ──────────────────────────────────────────────────────

  const createModule = async (workspaceId, data) => {
    const newModule = {
      id: Date.now().toString(),
      name: data.name || 'Nuevo Módulo',
      type: data.type || 'custom',
      workspaceId: workspaceId,
      config: data.config || {},
      order: data.order || 0,
      isDefault: data.isDefault || false,
      createdAt: new Date().toISOString()
    };

    const updated = environments.map(env => ({
      ...env,
      workspaces: env.workspaces?.map(ws => {
        if (ws.id === workspaceId) {
          return {
            ...ws,
            modules: [...(ws.modules || []), newModule],
            updatedAt: new Date().toISOString()
          };
        }
        return ws;
      })
    }));

    setEnvironments(updated);
    storage.set(STORAGE_KEYS.ENVIRONMENTS, updated);

    // Actualizar estados actuales
    if (currentWorkspace?.id === workspaceId) {
      const env = updated.find(e => e.id === currentEnvironment?.id);
      const ws = env?.workspaces?.find(w => w.id === workspaceId);
      setCurrentWorkspaceState(ws);
    }

    return newModule;
  };

  const deleteModule = (moduleId) => {
    const updated = environments.map(env => ({
      ...env,
      workspaces: env.workspaces?.map(ws => ({
        ...ws,
        modules: ws.modules?.filter(m => m.id !== moduleId)
      }))
    }));

    setEnvironments(updated);
    storage.set(STORAGE_KEYS.ENVIRONMENTS, updated);

    // Actualizar current workspace si es necesario
    if (currentWorkspace) {
      const env = updated.find(e => e.id === currentEnvironment?.id);
      const ws = env?.workspaces?.find(w => w.id === currentWorkspace.id);
      setCurrentWorkspaceState(ws);
    }
  };

  // ─── MEMBER ACTIONS ──────────────────────────────────────────────────────

  const addMemberToEnvironment = (envId, userId, role) => {
    const updated = environments.map(env => {
      if (env.id === envId) {
        const permissions = role === 'admin' ? ADMIN_PERMISSIONS : DEFAULT_PERMISSIONS;
        return {
          ...env,
          members: [
            ...(env.members || []),
            {
              userId,
              role,
              permissions,
              joinedAt: new Date().toISOString()
            }
          ]
        };
      }
      return env;
    });

    setEnvironments(updated);
    storage.set(STORAGE_KEYS.ENVIRONMENTS, updated);

    if (currentEnvironment?.id === envId) {
      const updatedEnv = updated.find(e => e.id === envId);
      setCurrentEnvironmentState(updatedEnv);
    }
  };

  const removeMemberFromEnvironment = (envId, userId) => {
    const updated = environments.map(env => {
      if (env.id === envId) {
        return {
          ...env,
          members: env.members?.filter(m => m.userId !== userId)
        };
      }
      return env;
    });

    setEnvironments(updated);
    storage.set(STORAGE_KEYS.ENVIRONMENTS, updated);

    if (currentEnvironment?.id === envId) {
      const updatedEnv = updated.find(e => e.id === envId);
      setCurrentEnvironmentState(updatedEnv);
    }
  };

  const updateMemberRole = (envId, userId, role) => {
    const updated = environments.map(env => {
      if (env.id === envId) {
        const permissions = role === 'admin' ? ADMIN_PERMISSIONS : DEFAULT_PERMISSIONS;
        return {
          ...env,
          members: env.members?.map(m => 
            m.userId === userId 
              ? { ...m, role, permissions }
              : m
          )
        };
      }
      return env;
    });

    setEnvironments(updated);
    storage.set(STORAGE_KEYS.ENVIRONMENTS, updated);

    if (currentEnvironment?.id === envId) {
      const updatedEnv = updated.find(e => e.id === envId);
      setCurrentEnvironmentState(updatedEnv);
    }
  };

  // ─── VALUE ───────────────────────────────────────────────────────────────

  const value = {
    // State
    currentUser,
    currentEnvironment,
    currentWorkspace,
    environments,
    isLoading,
    
    // Environment actions
    setCurrentEnvironment,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    
    // Workspace actions
    setCurrentWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    
    // Module actions
    createModule,
    deleteModule,
    
    // Member actions
    addMemberToEnvironment,
    removeMemberFromEnvironment,
    updateMemberRole,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;