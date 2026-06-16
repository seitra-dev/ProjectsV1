-- =============================================================================
-- MIGRACIÓN 005: Estado de proyecto dinámico (calculado desde las tareas)
-- Ejecutar en: Supabase → SQL Editor
--
-- Por qué es necesaria:
--   El estado de un proyecto se calculaba siempre manualmente. Ahora se
--   deriva automáticamente del estado de sus tareas (de mayor a menor
--   prioridad): en_curso > en_espera > en_pausa > bloqueado > pendiente >
--   completado > cancelado. Las tareas 'expedite' y 'active' (alias legacy)
--   cuentan como en_curso; 'todo'/'backlog'/'archived' como pendiente;
--   'done' como completado; 'review' como en_espera.
--
--   Se agrega projects.status_auto (default true) para permitir que un
--   usuario fije el estado manualmente cuando lo necesite: mientras esté en
--   false, el trigger no toca el estado del proyecto. Al volver a marcarlo
--   en true, se recalcula de inmediato.
--
--   Solo se consideran las tareas "raíz" (parent_id IS NULL) — igual
--   convención que ya usa el resto de la app (ProjectsView, KPIs de área)
--   para diferenciar tareas/hitos de subtareas internas.
-- =============================================================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS status_auto boolean NOT NULL DEFAULT true;

-- -----------------------------------------------------------------------------
-- 1. Función que calcula el estado del proyecto según sus tareas raíz activas.
--    Devuelve NULL si el proyecto no tiene tareas raíz (no se toca el estado).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.compute_project_status(p_project_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT
    CASE
      WHEN EXISTS (
        SELECT 1 FROM tasks
        WHERE project_id = p_project_id AND parent_id IS NULL AND is_deleted = false
          AND status IN ('in_progress', 'active', 'expedite')
      ) THEN 'in_progress'
      WHEN EXISTS (
        SELECT 1 FROM tasks
        WHERE project_id = p_project_id AND parent_id IS NULL AND is_deleted = false
          AND status IN ('waiting', 'review')
      ) THEN 'waiting'
      WHEN EXISTS (
        SELECT 1 FROM tasks
        WHERE project_id = p_project_id AND parent_id IS NULL AND is_deleted = false
          AND status = 'paused'
      ) THEN 'paused'
      WHEN EXISTS (
        SELECT 1 FROM tasks
        WHERE project_id = p_project_id AND parent_id IS NULL AND is_deleted = false
          AND status = 'blocked'
      ) THEN 'blocked'
      WHEN EXISTS (
        SELECT 1 FROM tasks
        WHERE project_id = p_project_id AND parent_id IS NULL AND is_deleted = false
          AND status IN ('pending', 'todo', 'backlog', 'archived')
      ) THEN 'pending'
      WHEN EXISTS (
        SELECT 1 FROM tasks
        WHERE project_id = p_project_id AND parent_id IS NULL AND is_deleted = false
          AND status IN ('completed', 'done')
      ) THEN 'completed'
      WHEN EXISTS (
        SELECT 1 FROM tasks
        WHERE project_id = p_project_id AND parent_id IS NULL AND is_deleted = false
          AND status = 'cancelled'
      ) THEN 'cancelled'
      ELSE NULL
    END INTO v_status;
  RETURN v_status;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. Trigger sobre TASKS: cada vez que una tarea cambia, resincroniza el
--    estado del proyecto (o de los dos proyectos, si la tarea se movió de uno
--    a otro), siempre que ese proyecto tenga status_auto = true.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_project_status_from_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
  v_new_status text;
  v_auto       boolean;
  v_current    text;
BEGIN
  v_project_id := COALESCE(NEW.project_id, OLD.project_id);

  IF v_project_id IS NOT NULL THEN
    SELECT status_auto, status INTO v_auto, v_current FROM projects WHERE id = v_project_id;
    IF v_auto IS TRUE THEN
      v_new_status := compute_project_status(v_project_id);
      IF v_new_status IS NOT NULL AND v_new_status IS DISTINCT FROM v_current THEN
        UPDATE projects SET status = v_new_status, updated_at = now() WHERE id = v_project_id;
      END IF;
    END IF;
  END IF;

  -- Tarea movida de proyecto (UPDATE) → resincronizar también el proyecto de origen
  IF TG_OP = 'UPDATE' AND OLD.project_id IS DISTINCT FROM NEW.project_id AND OLD.project_id IS NOT NULL THEN
    SELECT status_auto, status INTO v_auto, v_current FROM projects WHERE id = OLD.project_id;
    IF v_auto IS TRUE THEN
      v_new_status := compute_project_status(OLD.project_id);
      IF v_new_status IS NOT NULL AND v_new_status IS DISTINCT FROM v_current THEN
        UPDATE projects SET status = v_new_status, updated_at = now() WHERE id = OLD.project_id;
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_project_status_from_tasks ON tasks;

CREATE TRIGGER trg_sync_project_status_from_tasks
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION sync_project_status_from_tasks();

-- -----------------------------------------------------------------------------
-- 3. Trigger sobre PROJECTS: al reactivar el modo automático (status_auto
--    false → true), recalcula el estado de inmediato en lugar de esperar al
--    próximo cambio de tarea.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_project_status_on_auto_enable()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status_auto IS TRUE AND (OLD.status_auto IS DISTINCT FROM TRUE) THEN
    NEW.status := COALESCE(compute_project_status(NEW.id), NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_project_status_on_auto_enable ON projects;

CREATE TRIGGER trg_sync_project_status_on_auto_enable
  BEFORE UPDATE OF status_auto ON projects
  FOR EACH ROW
  EXECUTE FUNCTION sync_project_status_on_auto_enable();
