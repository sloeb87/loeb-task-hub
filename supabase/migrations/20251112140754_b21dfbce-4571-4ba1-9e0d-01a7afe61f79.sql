-- Add start_date and end_date to recurrence_stats table
ALTER TABLE public.recurrence_stats
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS recurrence_end_date date;

-- Update refresh_recurrence_stats function to include dates
CREATE OR REPLACE FUNCTION public.refresh_recurrence_stats(p_parent uuid, p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Backfill the date fields for existing records
SELECT * FROM public.backfill_all_recurrence_stats();