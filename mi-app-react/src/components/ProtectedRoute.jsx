/**
 * <ProtectedRoute> — Envuelve contenido que requiere un rol específico.
 *
 * Props:
 *   requirePlatformOwner  — solo accesible para platform_owner
 *   requireOrgRole        — 'org_admin' | 'member' (platform_owner siempre pasa)
 *   fallback              — qué renderizar si no tiene acceso (null por defecto)
 *
 * Uso:
 *   <ProtectedRoute requirePlatformOwner>
 *     <PanelGlobal />
 *   </ProtectedRoute>
 *
 *   <ProtectedRoute requireOrgRole="org_admin">
 *     <GestionMiembros />
 *   </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requirePlatformOwner = false,
  requireOrgRole = null,
  fallback = null,
  isPlatformOwner = false,
  orgRole = null,
}) {
  if (requirePlatformOwner && !isPlatformOwner) return fallback;

  if (requireOrgRole && !isPlatformOwner) {
    const roleHierarchy = { org_admin: 2, member: 1 };
    const required = roleHierarchy[requireOrgRole] ?? 0;
    const current  = roleHierarchy[orgRole]        ?? 0;
    if (current < required) return fallback;
  }

  return children;
}
