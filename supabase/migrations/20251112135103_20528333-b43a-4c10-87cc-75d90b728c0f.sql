-- Create table to cache recurrence statistics for fast UI loads
CREATE TABLE IF NOT EXISTS public.recurrence_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  parent_task_id uuid NOT NULL,
  recurrence_type text,
  recurrence_interval integer,
  recurrence_days_of_week integer[],
  recurrence_end_date date,
  start_date date,
  total_count integer NOT NULL DEFAULT 0,
  completed_count integer NOT NULL DEFAULT 0,
  remaining_count integer NOT NULL DEFAULT 0,
  next_occurrences jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recurrence_stats_user_parent_unique UNIQUE (user_id, parent_task_id)
);

-- Enable RLS and strict access control
ALTER TABLE public.recurrence_stats ENABLE ROW LEVEL SECURITY;

-- Policies: users can select only their rows
CREATE POLICY "recurrence_stats_select_own"
ON public.recurrence_stats
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own rows
CREATE POLICY "recurrence_stats_insert_own"
ON public.recurrence_stats
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own rows
CREATE POLICY "recurrence_stats_update_own"
ON public.recurrence_stats
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_recurrence_stats_user ON public.recurrence_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_recurrence_stats_parent ON public.recurrence_stats(parent_task_id);

-- Function to refresh (upsert) recurrence stats for a given series
CREATE OR REPLACE FUNCTION public.refresh_recurrence_stats(p_parent uuid, p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer := 0;
  v_completed integer := 0;
  v_remaining integer := 0;
  v_next jsonb := '[]'::jsonb;
  v_parent record;
BEGIN
  IF p_parent IS NULL OR p_user IS NULL THEN
    RETURN;
  END IF;

  -- Parent row for metadata
  SELECT id, start_date, recurrence_type, recurrence_interval, recurrence_days_of_week, recurrence_end_date
  INTO v_parent
  FROM public.tasks
  WHERE id = p_parent AND user_id = p_user
  LIMIT 1;

  -- Aggregate counts across parent and its children
  SELECT COUNT(*)
  INTO v_total
  FROM public.tasks
  WHERE user_id = p_user AND (id = p_parent OR parent_task_id = p_parent);

  SELECT COUNT(*)
  INTO v_completed
  FROM public.tasks
  WHERE user_id = p_user AND (id = p_parent OR parent_task_id = p_parent) AND status = 'Completed';

  SELECT COUNT(*)
  INTO v_remaining
  FROM public.tasks
  WHERE user_id = p_user AND parent_task_id = p_parent AND status = 'Open' AND due_date >= CURRENT_DATE;

  -- Next occurrences (up to 3)
  SELECT COALESCE(jsonb_agg(to_jsonb(t) - '{description,details,links,checklist,dependencies,stakeholders}'::text[]), '[]'::jsonb)
  INTO v_next
  FROM (
    SELECT id, task_number, due_date, status, title
    FROM public.tasks
    WHERE user_id = p_user AND parent_task_id = p_parent AND status = 'Open' AND due_date > CURRENT_DATE
    ORDER BY due_date ASC
    LIMIT 3
  ) t;

  -- Upsert into stats table
  INSERT INTO public.recurrence_stats (
    user_id, parent_task_id, recurrence_type, recurrence_interval, recurrence_days_of_week, recurrence_end_date, start_date,
    total_count, completed_count, remaining_count, next_occurrences, updated_at
  ) VALUES (
    p_user, p_parent,
    v_parent.recurrence_type, v_parent.recurrence_interval, v_parent.recurrence_days_of_week, v_parent.recurrence_end_date, v_parent.start_date,
    COALESCE(v_total,0), COALESCE(v_completed,0), COALESCE(v_remaining,0), COALESCE(v_next,'[]'::jsonb), now()
  )
  ON CONFLICT (user_id, parent_task_id) DO UPDATE SET
    recurrence_type = EXCLUDED.recurrence_type,
    recurrence_interval = EXCLUDED.recurrence_interval,
    recurrence_days_of_week = EXCLUDED.recurrence_days_of_week,
    recurrence_end_date = EXCLUDED.recurrence_end_date,
    start_date = EXCLUDED.start_date,
    total_count = EXCLUDED.total_count,
    completed_count = EXCLUDED.completed_count,
    remaining_count = EXCLUDED.remaining_count,
    next_occurrences = EXCLUDED.next_occurrences,
    updated_at = now();
END;
$$;

-- Trigger to refresh stats when tasks change
CREATE OR REPLACE FUNCTION public.trg_refresh_recurrence_stats()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_parent uuid;
  v_user uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_parent := COALESCE(OLD.parent_task_id, CASE WHEN OLD.is_recurring THEN OLD.id ELSE NULL END);
    v_user := OLD.user_id;
  ELSE
    v_parent := COALESCE(NEW.parent_task_id, CASE WHEN NEW.is_recurring THEN NEW.id ELSE NULL END);
    v_user := NEW.user_id;
  END IF;

  IF v_parent IS NOT NULL AND v_user IS NOT NULL THEN
    PERFORM public.refresh_recurrence_stats(v_parent, v_user);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS tasks_refresh_recurrence_stats_ins ON public.tasks;
DROP TRIGGER IF EXISTS tasks_refresh_recurrence_stats_upd ON public.tasks;
DROP TRIGGER IF EXISTS tasks_refresh_recurrence_stats_del ON public.tasks;

CREATE TRIGGER tasks_refresh_recurrence_stats_ins
AFTER INSERT ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_recurrence_stats();

CREATE TRIGGER tasks_refresh_recurrence_stats_upd
AFTER UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_recurrence_stats();

CREATE TRIGGER tasks_refresh_recurrence_stats_del
AFTER DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_recurrence_stats();