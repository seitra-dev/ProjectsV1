-- =============================================================================
-- MIGRACIÓN 001: Normalización de roles
-- Ejecutar en: Supabase SQL Editor
-- IMPORTANTE: No modificar el RLS existente.
-- =============================================================================

-- a) Renombrar 'super_admin' → 'platform_owner' en la tabla users (public)
UPDATE users
SET role = 'platform_owner'
WHERE role = 'super_admin';

-- b) Renombrar 'super_admin' → 'org_admin' en organization_members
--    Si el campo es un enum, puede ser necesario agregar el valor primero.
--    Verificar con: SELECT pg_enum.enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'org_role';
UPDATE organization_members
SET role = 'org_admin'
WHERE role = 'super_admin';

-- c) Limpiar roles en environment_members
UPDATE environment_members
SET role = 'admin'
WHERE role = 'super_admin';

UPDATE environment_members
SET role = 'member'
WHERE role = 'user';

-- d) Verificación post-migración (ejecutar para confirmar que no quedan valores viejos)
SELECT 'users', role, COUNT(*) FROM users GROUP BY role
UNION ALL
SELECT 'org_members', role, COUNT(*) FROM organization_members GROUP BY role
UNION ALL
SELECT 'env_members', role, COUNT(*) FROM environment_members GROUP BY role;
