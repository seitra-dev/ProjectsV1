
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  dbEnvironments,
  dbEnvironmentMembers,
  dbWorkspaces,
  dbProjects,
  dbTasks,
  dbComments,
  dbChatMessages,
  dbLists,
  dbUsers,
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
  // authChecked: true cuando el perfil completo (system_role desde la BD)
  // ya fue cargado. Permite al Sidebar filtrar el menú con el rol correcto.
  const [authChecked, setAuthChecked] = useState(false);
  const [lists, setLists] = useState([]);

  // membershipMap: { [envId]: { role: 'owner'|'admin'|'member'|'viewer', ... } }
  const [membershipMap, setMembershipMap] = useState({});

  // ==========================================================================
  // HELPERS (compatibilidad con AppContext-OLD)
  // ==========================================================================

  /**
   * Filtra workspaces para que los privados solo sean visibles para su creador.
   * super_admin ve todos (para administración).
   */
  const filterWorkspacesForUser = (workspaces, userId) => {
    if (!workspaces) return [];
    return workspaces.filter(ws =>
      ws.visibility !== 'specific_members' || String(ws.created_by) === String(userId)
    );
  };

  const filterListsForUser = (lists, userId) => {
    if (!lists) return [];
    return lists.filter(l => !l.is_private || String(l.created_by) === String(userId));
  };

  const setCurrentEnvironmentById = async (envId) => {
    if (!envId) {
      setCurrentEnvironment(null);
      setCurrentWorkspace(null);
      return;
    }

    const env = environments.find((e) => e.id === envId);
    if (!env) return;

    const rawWorkspaces = env.workspaces ?? (await dbWorkspaces.getByEnvironment(envId));
    const workspaces = filterWorkspacesForUser(rawWorkspaces, currentUser?.id);
    const envWithWorkspaces = { ...env, workspaces };

    setCurrentEnvironment(envWithWorkspaces);
    setEnvironments((prevEnvs) =>
      prevEnvs.map((e) => (e.id === envId ? envWithWorkspaces : e))
    );
    setCurrentWorkspace(null);

    const rawLists = await dbLists.getByEnvironment(envId);
    setLists(filterListsForUser(rawLists, currentUser?.id));
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
  // PERMISOS
  // ============================================================================

  const isSuperAdmin = (user) =>
    (user?.system_role || user?.role) === 'super_admin';

  const getUserRoleInEnv = (envId) =>
    membershipMap[envId]?.role || null;

  const canManageMembers = (envId) => {
    if (isSuperAdmin(currentUser)) return true;
    const role = getUserRoleInEnv(envId);
    return role === 'owner' || role === 'admin';
  };

  const canEditTaskDates = () => {
    const sysRole = currentUser?.system_role;
    return sysRole === 'super_admin' || sysRole === 'admin' || sysRole === 'project_manager';
  };

  const canDeleteEnvironment = (envId) => {
    if (isSuperAdmin(currentUser)) return true;
    return getUserRoleInEnv(envId) === 'owner';
  };

  const canViewEnvironment = (envId) => {
    if (isSuperAdmin(currentUser)) return true;
    return membershipMap[envId] != null;
  };

  // ============================================================================
  // CARGAR DATOS INICIALES
  // ============================================================================

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

  // Enriquece el usuario con system_role desde la tabla users
  const enrichUserProfile = async (baseUser) => {
    try {
      const profile = await dbUsers.getById(baseUser.id);
      if (profile) {
        const enriched = {
          ...baseUser,
          system_role: profile.system_role || profile.role || 'user',
          role: profile.role || 'user',
          name: profile.name || baseUser.name,
          avatar: profile.avatar || baseUser.avatar || '👤',
        };
        // Cachear el rol en localStorage para que el Sidebar filtre correctamente
        // desde el primer render en la próxima carga de página.
        try { localStorage.setItem('seitra_system_role', enriched.system_role); } catch {}
        return enriched;
      }
    } catch (e) {
      console.warn('[AppContext] No se pudo cargar perfil completo:', e);
    }
    return baseUser;
  };

  const loadEnvironments = async (userId, systemRole) => {
    try {
      console.log('[AppContext] cargando entornos para userId:', userId, '| systemRole:', systemRole);
      let envs = [];
      const newMembershipMap = {};
      let myMemberships = [];

      // Cargar membresías una sola vez para todos los roles
      try {
        myMemberships = await dbEnvironmentMembers.getMyMemberships(userId);
        myMemberships.forEach(m => { newMembershipMap[m.environment_id] = m; });
      } catch {}

      if (systemRole === 'super_admin') {
        // Super admin ve TODOS los entornos
        envs = await dbEnvironments.getAll();
      } else {
        // Otros roles: solo entornos donde son miembros
        const memberEnvIds = myMemberships.map(m => m.environment_id);

        if (memberEnvIds.length > 0) {
          const allEnvs = await dbEnvironments.getAll();
          envs = allEnvs.filter(e => memberEnvIds.includes(e.id));
        }
      }

      setMembershipMap(newMembershipMap);
      setEnvironments(envs);

      if (envs.length > 0) {
        // Siempre cargar el entorno PROPIO del usuario:
        // 1. Donde es 'owner' (lo creó)
        // 2. Primer entorno donde es miembro (orden devuelto por la BD)
        // 3. Fallback: primer entorno disponible
        const ownerMembership = myMemberships.find(m => m.role === 'owner');
        const primaryEnvId =
          (ownerMembership && envs.find(e => e.id === ownerMembership.environment_id)?.id) ||
          (myMemberships[0] && envs.find(e => e.id === myMemberships[0].environment_id)?.id) ||
          envs[0]?.id;
        const targetEnv = envs.find(e => e.id === primaryEnvId) || envs[0];

        console.log('[AppContext] entorno propio seleccionado:', targetEnv?.name, '| role:', newMembershipMap[targetEnv?.id]?.role);

        setCurrentEnvironment(targetEnv);
        const rawWorkspaces = await dbWorkspaces.getByEnvironment(targetEnv.id);
        const workspaces = filterWorkspacesForUser(rawWorkspaces, userId);
        const loadedLists = await dbLists.getByEnvironment(targetEnv.id);
        setEnvironments(prev =>
          prev.map(env => env.id === targetEnv.id ? { ...env, workspaces } : env)
        );
        setCurrentEnvironment(prev => ({ ...prev, workspaces }));
        setLists(filterListsForUser(loadedLists, userId));
      }
    } catch (error) {
      console.error('[AppContext] Error cargando entornos:', error);
    }
  };

  useEffect(() => {
    const storedUser = getUserFromStorage();
    if (storedUser) {
      const baseUser = {
        id: storedUser.id,
        email: storedUser.email,
        name: storedUser.user_metadata?.name || storedUser.email,
        role: storedUser.user_metadata?.role || 'user',
        system_role: storedUser.user_metadata?.system_role || storedUser.user_metadata?.role || 'user',
      };
      setCurrentUser(baseUser);

      // Enriquecer con perfil completo (BD) y luego cargar entornos.
      // authChecked se activa cuando TODO está listo, incluyendo el system_role real.
      enrichUserProfile(baseUser).then(enriched => {
        setCurrentUser(enriched);
        loadEnvironments(enriched.id, enriched.system_role).finally(() => {
          setIsLoading(false);
          setAuthChecked(true);
        });
      });
    } else {
      setIsLoading(false);
      setAuthChecked(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AppContext] onAuthStateChange:', event, '| user:', session?.user?.email);

        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setEnvironments([]);
          setCurrentEnvironment(null);
          setCurrentWorkspace(null);
          setMembershipMap({});
          setIsLoading(false);
          setAuthChecked(false);
          // Limpiar caché del rol al cerrar sesión
          try { localStorage.removeItem('seitra_system_role'); } catch {}
          return;
        }

        if (
          session?.user &&
          (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')
        ) {
          // Solo recargar entornos si aún no los tenemos (evitar re-fetch en TOKEN_REFRESHED)
          setEnvironments(prev => {
            if (prev.length === 0) {
              const baseUser = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.email,
                role: session.user.user_metadata?.role || 'user',
                system_role: session.user.user_metadata?.system_role || session.user.user_metadata?.role || 'user',
              };
              enrichUserProfile(baseUser).then(enriched => {
                setCurrentUser(enriched);
                loadEnvironments(enriched.id, enriched.system_role).finally(() => {
                  setIsLoading(false);
                  setAuthChecked(true);
                });
              });
            } else {
              setIsLoading(false);
              setAuthChecked(true);
            }
            return prev;
          });
        } else {
          setIsLoading(false);
          setAuthChecked(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Refrescar el token de Supabase cada 50 min para evitar que expire en sesiones largas
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) console.warn('[AppContext] Token refresh falló:', error.message);
        else console.log('[AppContext] Token de sesión refrescado');
      } catch {}
    }, 50 * 60 * 1000); // 50 minutos
    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // ENVIRONMENTS
  // ============================================================================

  const createEnvironment = async (data) => {
    if (!currentUser?.id) {
      throw new Error('Debes iniciar sesión para crear equipos.');
    }

    try {
      // 1. Crear entorno con owner_id
      const newEnv = await dbEnvironments.create({
        name: data.name,
        description: data.description || '',
        color: data.color || '#6366f1',
        icon: data.icon || '📊',
        owner_id: currentUser.id,
      });

      // 2. Registrar al creador como 'owner' en environment_members
      await dbEnvironmentMembers.add(newEnv.id, currentUser.id, 'owner', currentUser.id);
      setMembershipMap(prev => ({
        ...prev,
        [newEnv.id]: { environment_id: newEnv.id, role: 'owner', user_id: currentUser.id }
      }));

      // 3. Agregar a la lista local
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
      setMembershipMap(prev => { const next = { ...prev }; delete next[envId]; return next; });
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
      // Persistir la selección para restaurarla al refrescar
      if (env?.id) {
        localStorage.setItem('seitra_last_env_id', env.id);
      } else {
        localStorage.removeItem('seitra_last_env_id');
      }
      if (env && !env.workspaces) {
        const rawWorkspaces = await dbWorkspaces.getByEnvironment(env.id);
        const workspaces = filterWorkspacesForUser(rawWorkspaces, currentUser?.id);
        const envWithWorkspaces = { ...env, workspaces };
        setCurrentEnvironment(envWithWorkspaces);
        setEnvironments(prev =>
          prev.map(e => e.id === env.id ? envWithWorkspaces : e)
        );
      }
      const rawLists = await dbLists.getByEnvironment(env.id);
      setLists(filterListsForUser(rawLists, currentUser?.id));
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
      const rawFreshWorkspaces = await dbWorkspaces.getByEnvironment(envId);
      const freshWorkspaces = filterWorkspacesForUser(rawFreshWorkspaces, currentUser?.id);
      setEnvironments(prev =>
        prev.map(env => env.id === envId ? { ...env, workspaces: freshWorkspaces } : env)
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
      setEnvironments(prev =>
        prev.map(env => ({
          ...env,
          workspaces: env.workspaces?.map(ws =>
            ws.id === workspaceId ? { ...ws, ...updated } : ws
          )
        }))
      );
      if (currentEnvironment) {
        setCurrentEnvironment(prev => ({
          ...prev,
          workspaces: prev.workspaces?.map(ws =>
            ws.id === workspaceId ? { ...ws, ...updated } : ws
          )
        }));
      }
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
      setEnvironments(prev =>
        prev.map(env => ({
          ...env,
          workspaces: env.workspaces?.filter(ws => ws.id !== workspaceId)
        }))
      );
      if (currentEnvironment) {
        setCurrentEnvironment(prev => ({
          ...prev,
          workspaces: prev.workspaces?.filter(ws => ws.id !== workspaceId)
        }));
      }
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

  const value = useMemo(() => ({
    // Estado
    environments,
    currentEnvironment,
    currentWorkspace,
    currentUser,
    isLoading,
    authChecked,
    lists,
    membershipMap,

    // Setters
    setEnvironments,
    setCurrentEnvironmentState,
    setCurrentWorkspaceState,
    setCurrentEnvironment: setCurrentEnvironmentById,
    setCurrentWorkspace: setCurrentWorkspaceById,
    setCurrentUser,

    // Permisos
    isSuperAdmin: () => isSuperAdmin(currentUser),
    getUserRoleInEnv,
    canManageMembers,
    canEditTaskDates,
    canDeleteEnvironment,
    canViewEnvironment,
    canWorkWithoutEnvironment: () =>
      ['super_admin', 'admin', 'project_manager'].includes(currentUser?.system_role),

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

    // Database utilities
    db: {
      projects: dbProjects,
      tasks: dbTasks,
      comments: dbComments,
      chat: dbChatMessages
    }
  }), [
    environments, currentEnvironment, currentWorkspace, currentUser,
    isLoading, authChecked, lists, membershipMap,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
