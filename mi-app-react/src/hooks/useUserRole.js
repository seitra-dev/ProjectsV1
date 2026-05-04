import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook central de roles y organización.
 * Requiere un userId (del usuario autenticado).
 *
 * Retorna:
 *   isPlatformOwner      — users.role === 'platform_owner'
 *   orgRole              — organization_members.role en la org del usuario
 *   organizationId       — ID de la org actual del usuario
 *   envRole              — role en el entorno actual (pasado como parámetro)
 *   hasPendingRequest    — el usuario tiene solicitud pendiente a alguna org
 *   pendingRequestsCount — solicitudes pendientes recibidas (para org_admin)
 *   canCreateEnvironments
 *   canManageOrg
 *   canSeeAllEnvironments
 *   hasOrg               — tiene org asignada (o es platform_owner)
 *   reload               — función para refrescar manualmente
 */
export function useUserRole(userId, userRole, currentEnvId, membershipMap = {}) {
  const [orgRole, setOrgRole] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const isPlatformOwner = userId === 'e33a38dc-da51-4318-a01a-4f04da60291a' || userRole === 'platform_owner';

  const load = useCallback(async () => {
    if (!userId) { setIsLoading(false); return; }

    if (isPlatformOwner) {
      setOrganizationId(null);
      setOrgRole(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (membership) {
        setOrganizationId(membership.organization_id);
        setOrgRole(membership.role);

        if (membership.role === 'org_admin') {
          const { count } = await supabase
            .from('organization_join_requests')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', membership.organization_id)
            .eq('status', 'pending');
          setPendingRequestsCount(count || 0);
        }
      } else {
        setOrganizationId(null);
        setOrgRole(null);

        const { data: requests } = await supabase
          .from('organization_join_requests')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .limit(1);
        setHasPendingRequest((requests || []).length > 0);
      }
    } catch (e) {
      console.warn('[useUserRole]', e);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isPlatformOwner]);

  useEffect(() => { load(); }, [load]);

  const envRole = currentEnvId ? membershipMap[currentEnvId]?.role || null : null;

  return {
    isPlatformOwner,
    orgRole,
    organizationId,
    envRole,
    hasPendingRequest,
    pendingRequestsCount,
    isLoading,
    hasOrg: isPlatformOwner || orgRole != null,
    canCreateEnvironments: isPlatformOwner || orgRole === 'org_admin',
    canManageOrg: isPlatformOwner || orgRole === 'org_admin',
    canSeeAllEnvironments: isPlatformOwner || orgRole === 'org_admin',
    reload: load,
  };
}
