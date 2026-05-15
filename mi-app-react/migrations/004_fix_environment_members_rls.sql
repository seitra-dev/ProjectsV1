-- =============================================================================
-- FIX: infinite recursion in environment_members RLS policies (error 42P17)
--
-- The problem: RLS policies on environment_members query environment_members
-- themselves to check if the user has access → infinite loop.
--
-- Solution: SECURITY DEFINER helper functions that bypass RLS, used inside
-- the policies instead of direct subqueries on the same table.
-- =============================================================================

-- Step 1: Helper function – bypasses RLS to check role in one environment
CREATE OR REPLACE FUNCTION public.get_env_role(env_id uuid, uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM environment_members
  WHERE environment_id = env_id
    AND user_id = uid
  LIMIT 1;
$$;

-- Step 2: Helper function – bypasses RLS to check bare membership
CREATE OR REPLACE FUNCTION public.is_env_member(env_id uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM environment_members
    WHERE environment_id = env_id AND user_id = uid
  );
$$;

-- Step 3: Drop ALL existing policies on environment_members to start clean
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'environment_members'
      AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.environment_members', pol.policyname);
  END LOOP;
END$$;

-- Step 4: Recreate policies using the SECURITY DEFINER helpers (no recursion)

-- SELECT: you can read rows if it's your own membership OR you belong to that environment
CREATE POLICY "env_members_select"
  ON public.environment_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_env_member(environment_id, auth.uid())
  );

-- INSERT: you can insert if:
--   a) you're inserting yourself (owner self-registration during env creation), OR
--   b) you're an owner or admin of that environment
CREATE POLICY "env_members_insert"
  ON public.environment_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR public.get_env_role(environment_id, auth.uid()) IN ('owner', 'admin')
  );

-- UPDATE: only owners and admins can change roles
CREATE POLICY "env_members_update"
  ON public.environment_members
  FOR UPDATE
  USING (
    public.get_env_role(environment_id, auth.uid()) IN ('owner', 'admin')
  )
  WITH CHECK (
    public.get_env_role(environment_id, auth.uid()) IN ('owner', 'admin')
  );

-- DELETE: owners/admins can remove others; anyone can remove themselves
CREATE POLICY "env_members_delete"
  ON public.environment_members
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.get_env_role(environment_id, auth.uid()) IN ('owner', 'admin')
  );

-- Step 5: Also fix environments table if its INSERT policy references environment_members
-- (drop and recreate only if the policy exists and causes the same recursion)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'environments'
      AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.environments', pol.policyname);
  END LOOP;
END$$;

-- environments SELECT: visible to members of that environment OR its creator
CREATE POLICY "environments_select"
  ON public.environments
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR public.is_env_member(id, auth.uid())
  );

-- environments INSERT: any authenticated user can create an environment
CREATE POLICY "environments_insert"
  ON public.environments
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- environments UPDATE: only owner or admin
CREATE POLICY "environments_update"
  ON public.environments
  FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR public.get_env_role(id, auth.uid()) IN ('owner', 'admin')
  );

-- environments DELETE: only owner
CREATE POLICY "environments_delete"
  ON public.environments
  FOR DELETE
  USING (
    owner_id = auth.uid()
    OR public.get_env_role(id, auth.uid()) = 'owner'
  );
