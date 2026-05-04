-- =============================================================================
-- MIGRACIÓN 002: Crear tabla organization_join_requests
-- Ejecutar DESPUÉS de la migración 001.
-- =============================================================================

CREATE TABLE IF NOT EXISTS organization_join_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  requested_at    timestamptz DEFAULT now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid REFERENCES users(id),
  UNIQUE(organization_id, user_id)
);

-- RLS
ALTER TABLE organization_join_requests ENABLE ROW LEVEL SECURITY;

-- El usuario ve sus propias solicitudes
CREATE POLICY "user sees own requests"
ON organization_join_requests FOR SELECT
USING (user_id = auth.uid());

-- El org_admin ve las solicitudes a su org
CREATE POLICY "org_admin sees requests to their org"
ON organization_join_requests FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('org_admin', 'super_admin')
  )
);

-- El usuario puede crear su propia solicitud
CREATE POLICY "user can create own request"
ON organization_join_requests FOR INSERT
WITH CHECK (user_id = auth.uid());

-- El org_admin puede actualizar (aprobar/rechazar) solicitudes de su org
CREATE POLICY "org_admin can update requests"
ON organization_join_requests FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
    AND role IN ('org_admin', 'super_admin')
  )
);

-- =============================================================================
-- MIGRACIÓN 003 (opcional): Agregar descripción a organizations si no existe
-- =============================================================================
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS color      text DEFAULT '#6366f1',
ADD COLUMN IF NOT EXISTS icon       text DEFAULT '🏢';
