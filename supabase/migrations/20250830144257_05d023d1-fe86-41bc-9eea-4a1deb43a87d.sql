-- Fix the calculate_task_metrics function to handle checklist as string or array
CREATE OR REPLACE FUNCTION public.calculate_task_metrics(p_task_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  task_record tasks%ROWTYPE;
  metrics_record task_metrics%ROWTYPE;
  total_time_seconds INTEGER := 0;
  session_count INTEGER := 0;
  last_entry_time TIMESTAMP WITH TIME ZONE;
  actual_days NUMERIC := 0;
  planned_actual_ratio NUMERIC := 0;
  overdue_days INTEGER := 0;
  completion_pct NUMERIC := 0;
  checklist_array JSONB;
BEGIN
  -- Get task record
  SELECT * INTO task_record FROM public.tasks WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calculate time tracking metrics
  SELECT 
    COALESCE(SUM(duration), 0),
    COUNT(*),
    MAX(end_time)
  INTO 
    total_time_seconds,
    session_count,
    last_entry_time
  FROM public.time_entries 
  WHERE task_id = task_record.task_number 
  AND user_id = task_record.user_id;
  
  -- Calculate actual duration if completed
  IF task_record.completion_date IS NOT NULL THEN
    actual_days := task_record.completion_date - task_record.creation_date;
    
    -- Calculate planned vs actual ratio
    IF task_record.planned_time_hours > 0 THEN
      planned_actual_ratio := (total_time_seconds / 3600.0) / task_record.planned_time_hours;
    END IF;
  END IF;
  
  -- Calculate days overdue
  IF task_record.status != 'Completed' AND task_record.due_date < CURRENT_DATE THEN
    overdue_days := CURRENT_DATE - task_record.due_date;
  END IF;
  
  -- Calculate completion percentage based on checklist
  IF task_record.checklist IS NOT NULL THEN
    -- Handle both string and array formats for checklist
    IF jsonb_typeof(task_record.checklist) = 'string' THEN
      -- If it's a string, try to parse it as JSON
      BEGIN
        checklist_array := task_record.checklist::text::jsonb;
      EXCEPTION WHEN OTHERS THEN
        checklist_array := '[]'::jsonb;
      END;
    ELSE
      checklist_array := task_record.checklist;
    END IF;
    
    -- Only proceed if we have an array
    IF jsonb_typeof(checklist_array) = 'array' THEN
      WITH checklist_items AS (
        SELECT jsonb_array_elements(checklist_array) AS item
      ),
      completed_items AS (
        SELECT COUNT(*) as count
        FROM checklist_items 
        WHERE (item->>'completed')::boolean = true
      ),
      total_items AS (
        SELECT COUNT(*) as count FROM checklist_items
      )
      SELECT 
        CASE 
          WHEN total_items.count = 0 THEN 0
          ELSE (completed_items.count::NUMERIC / total_items.count::NUMERIC) * 100
        END
      INTO completion_pct
      FROM completed_items, total_items;
    END IF;
  END IF;
  
  -- Upsert metrics record
  INSERT INTO public.task_metrics (
    user_id, task_id, task_number,
    total_time_logged, total_sessions, last_time_entry,
    actual_duration_days, planned_vs_actual_ratio,
    days_overdue, completion_percentage
  ) VALUES (
    task_record.user_id, task_record.id, task_record.task_number,
    total_time_seconds, session_count, last_entry_time,
    actual_days, planned_actual_ratio,
    overdue_days, completion_pct
  )
  ON CONFLICT (user_id, task_id) 
  DO UPDATE SET
    total_time_logged = EXCLUDED.total_time_logged,
    total_sessions = EXCLUDED.total_sessions,
    last_time_entry = EXCLUDED.last_time_entry,
    actual_duration_days = EXCLUDED.actual_duration_days,
    planned_vs_actual_ratio = EXCLUDED.planned_vs_actual_ratio,
    days_overdue = EXCLUDED.days_overdue,
    completion_percentage = EXCLUDED.completion_percentage,
    updated_at = NOW();
END;
$function$;