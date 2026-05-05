-- =============================================================================
-- MIGRACIÓN 003: Función RPC para aprobar solicitudes de ingreso a la organización
-- Ejecutar en: Supabase → SQL Editor
--
-- Por qué es necesaria:
--   La tabla organization_members tiene RLS habilitado y no hay policy INSERT
--   que permita a un org_admin agregar miembros ajenos. En lugar de relajar
--   la seguridad con una policy amplia, usamos SECURITY DEFINER para que la
--   función corra con privilegios elevados, pero valida internamente que el
--   llamador sea admin de esa organización.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.approve_join_request(
  p_request_id        uuid,
  p_organization_id   uuid,
  p_user_id           uuid,
  p_reviewed_by       uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el llamador es admin de esa org O es platform_owner
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_organization_id
      AND user_id         = auth.uid()
      AND role            = 'org_admin'
  ) AND NOT EXISTS (
    SELECT 1 FROM users
    WHERE id   = auth.uid()
      AND role = 'platform_owner'
  ) THEN
    RAISE EXCEPTION 'No autorizado: debes ser admin de esta organización para aprobar solicitudes';
  END IF;

  -- Insertar como miembro (ignorar si ya existe)
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (p_organization_id, p_user_id, 'member')
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  -- Marcar la solicitud como aprobada
  UPDATE organization_join_requests
  SET
    status      = 'approved',
    reviewed_at = NOW(),
    reviewed_by = p_reviewed_by
  WHERE id = p_request_id;
END;
$$;

-- Permitir ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.approve_join_request(uuid, uuid, uuid, uuid) TO authenticated;
