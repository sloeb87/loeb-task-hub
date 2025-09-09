-- Fix the follow_ups table to use task_number properly

-- 1. First drop all existing RLS policies on follow_ups
DROP POLICY IF EXISTS "Users can view follow-ups for their tasks" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can create follow-ups for their tasks" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can update follow-ups for their tasks" ON public.follow_ups;
DROP POLICY IF EXISTS "Users can delete follow-ups for their tasks" ON public.follow_ups;

-- 2. Add the task_number column
ALTER TABLE public.follow_ups 
ADD COLUMN task_number text;

-- 3. Update existing follow_ups to use task_number
UPDATE public.follow_ups 
SET task_number = (
  SELECT task_number 
  FROM public.tasks 
  WHERE tasks.id = follow_ups.task_id
);

-- 4. Make task_number NOT NULL after population
ALTER TABLE public.follow_ups 
ALTER COLUMN task_number SET NOT NULL;

-- 5. Drop the old task_id column and rename task_number to task_id
ALTER TABLE public.follow_ups 
DROP COLUMN task_id CASCADE;

ALTER TABLE public.follow_ups 
RENAME COLUMN task_number TO task_id;

-- 6. Recreate RLS policies for follow_ups using task_number
CREATE POLICY "Users can view follow-ups for their tasks" 
ON public.follow_ups 
FOR SELECT 
USING (task_id IN ( 
  SELECT task_number 
  FROM tasks 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create follow-ups for their tasks" 
ON public.follow_ups 
FOR INSERT 
WITH CHECK (task_id IN ( 
  SELECT task_number 
  FROM tasks 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update follow-ups for their tasks" 
ON public.follow_ups 
FOR UPDATE 
USING (task_id IN ( 
  SELECT task_number 
  FROM tasks 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete follow-ups for their tasks" 
ON public.follow_ups 
FOR DELETE 
USING (task_id IN ( 
  SELECT task_number 
  FROM tasks 
  WHERE user_id = auth.uid()
));

-- 7. Update all functions to use task_number instead of UUID

-- Update calculate_task_metrics function to work with task_number
CREATE OR REPLACE FUNCTION public.calculate_task_metrics(p_task_number text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  task_record tasks%ROWTYPE;
  total_time_seconds INTEGER := 0;
  session_count INTEGER := 0;
  last_entry_time TIMESTAMP WITH TIME ZONE;
  actual_days NUMERIC := 0;
  planned_actual_ratio NUMERIC := 0;
  overdue_days INTEGER := 0;
  completion_pct NUMERIC := 0;
  checklist_array JSONB;
BEGIN
  -- Get task record by task_number
  SELECT * INTO task_record FROM public.tasks WHERE task_number = p_task_number;
  
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
  
  -- Upsert metrics record using task_number
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

-- Update recalculate_all_task_metrics to use task_number
CREATE OR REPLACE FUNCTION public.recalculate_all_task_metrics(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  task_record RECORD;
  processed_count INTEGER := 0;
BEGIN
  -- Loop through all tasks for the user
  FOR task_record IN 
    SELECT task_number FROM public.tasks 
    WHERE user_id = p_user_id
  LOOP
    PERFORM public.calculate_task_metrics(task_record.task_number);
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$function$;

-- Update trigger functions to use task_number
CREATE OR REPLACE FUNCTION public.trigger_update_task_metrics()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Calculate metrics for the affected task using task_number
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.task_metrics WHERE task_number = OLD.task_number;
    RETURN OLD;
  ELSE
    PERFORM public.calculate_task_metrics(NEW.task_number);
    RETURN NEW;
  END IF;
END;
$function$;

-- Update time entries trigger to use task_number consistently
CREATE OR REPLACE FUNCTION public.trigger_update_metrics_from_time_entries()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- For time entries, task_id already contains the task_number
  IF TG_OP = 'DELETE' THEN
    PERFORM public.calculate_task_metrics(OLD.task_id);
    RETURN OLD;
  ELSE
    PERFORM public.calculate_task_metrics(NEW.task_id);
    RETURN NEW;
  END IF;
END;
$function$;

-- Update recurring task function to use task_number
CREATE OR REPLACE FUNCTION public.generate_recurring_instances(task_number_param text)
 RETURNS TABLE(created_count integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  task_record tasks%ROWTYPE;
  iter_date date;
  new_due_date date;
  new_start_date date;
  instance_count integer := 0;
  max_instances integer := 1000; -- Safety limit
  target_day_of_week integer;
BEGIN
  -- Get the task record by task_number
  SELECT * INTO task_record FROM public.tasks WHERE task_number = task_number_param AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::integer, 'Task not found or access denied'::text;
    RETURN;
  END IF;
  
  -- Check if this is a recurring task
  IF NOT task_record.is_recurring OR task_record.recurrence_end_date IS NULL OR task_record.recurrence_type IS NULL THEN
    RETURN QUERY SELECT 0::integer, 'Task is not configured for recurrence'::text;
    RETURN;
  END IF;
  
  -- Delete any existing future instances for this parent task
  DELETE FROM public.tasks 
  WHERE parent_task_id = task_record.id 
  AND status = 'Open' 
  AND due_date > task_record.due_date
  AND user_id = auth.uid();
  
  -- Initialize dates for the next instance
  iter_date := task_record.due_date;
  
  -- Generate instances until end date or safety limit
  LOOP
    -- Calculate next due date based on recurrence type and interval
    CASE task_record.recurrence_type
      WHEN 'daily' THEN
        new_due_date := iter_date + (task_record.recurrence_interval || ' days')::interval;
        new_start_date := task_record.start_date + (new_due_date - task_record.due_date);
      WHEN 'weekly' THEN
        -- Handle weekly recurrence with specific days of the week
        IF task_record.recurrence_days_of_week IS NOT NULL AND array_length(task_record.recurrence_days_of_week, 1) > 0 THEN
          -- Find the next occurrence within the selected days
          new_due_date := NULL;
          FOR i IN 1..7 * task_record.recurrence_interval LOOP
            target_day_of_week := EXTRACT(DOW FROM (iter_date + i));
            IF target_day_of_week = ANY(task_record.recurrence_days_of_week) THEN
              new_due_date := iter_date + i;
              EXIT;
            END IF;
          END LOOP;
          
          -- If no matching day found within the interval, skip to next cycle
          IF new_due_date IS NULL THEN
            new_due_date := iter_date + (task_record.recurrence_interval || ' weeks')::interval;
          END IF;
        ELSE
          -- Default weekly behavior (same day of week)
          new_due_date := iter_date + (task_record.recurrence_interval || ' weeks')::interval;
        END IF;
        new_start_date := task_record.start_date + (new_due_date - task_record.due_date);
      WHEN 'monthly' THEN
        new_due_date := iter_date + (task_record.recurrence_interval || ' months')::interval;
        new_start_date := task_record.start_date + (new_due_date - task_record.due_date);
    END CASE;
    
    -- Exit if we've passed the end date or hit safety limit
    EXIT WHEN new_due_date > task_record.recurrence_end_date OR instance_count >= max_instances;
    
    -- For weekdays only (daily recurrence), skip weekends
    IF task_record.recurrence_type = 'daily' AND task_record.recurrence_interval = 1 THEN
      -- Skip Saturday (6) and Sunday (0)
      IF EXTRACT(DOW FROM new_due_date) IN (0, 6) THEN
        iter_date := new_due_date;
        CONTINUE;
      END IF;
    END IF;
    
    -- Create the next recurring task instance
    INSERT INTO public.tasks (
      user_id, project_id, title, description, status, priority, 
      responsible, environment, task_type, scope, stakeholders, 
      dependencies, details, links, checklist, start_date, due_date,
      is_recurring, recurrence_type, recurrence_interval, 
      parent_task_id, recurrence_end_date, recurrence_days_of_week
    ) VALUES (
      task_record.user_id, task_record.project_id, task_record.title, task_record.description, 'Open', task_record.priority,
      task_record.responsible, task_record.environment, task_record.task_type, task_record.scope, task_record.stakeholders,
      task_record.dependencies, task_record.details, task_record.links, task_record.checklist, new_start_date, new_due_date,
      false, -- Future instances are not recurring themselves
      NULL, NULL, -- Clear recurrence settings for instances
      task_record.id, -- Set parent task ID
      NULL, -- Clear end date for instances
      NULL -- Clear days of week for instances
    );
    
    iter_date := new_due_date;
    instance_count := instance_count + 1;
  END LOOP;
  
  RETURN QUERY SELECT instance_count, format('Created %s recurring task instances', instance_count)::text;
END;
$function$;

-- Create triggers for updated functions
DROP TRIGGER IF EXISTS trigger_update_task_metrics ON public.tasks;
CREATE TRIGGER trigger_update_task_metrics
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_task_metrics();

DROP TRIGGER IF EXISTS trigger_update_metrics_from_time_entries ON public.time_entries;
CREATE TRIGGER trigger_update_metrics_from_time_entries
  AFTER INSERT OR UPDATE OR DELETE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_metrics_from_time_entries();