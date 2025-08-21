-- Create a function that can be called manually to generate recurring instances
CREATE OR REPLACE FUNCTION public.generate_recurring_instances(task_uuid uuid)
RETURNS TABLE(created_count integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  task_record tasks%ROWTYPE;
  iter_date date;
  new_due_date date;
  new_start_date date;
  instance_count integer := 0;
  max_instances integer := 1000; -- Safety limit
BEGIN
  -- Get the task record
  SELECT * INTO task_record FROM public.tasks WHERE id = task_uuid AND user_id = auth.uid();
  
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
        new_due_date := iter_date + (task_record.recurrence_interval || ' weeks')::interval;
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
      parent_task_id, recurrence_end_date
    ) VALUES (
      task_record.user_id, task_record.project_id, task_record.title, task_record.description, 'Open', task_record.priority,
      task_record.responsible, task_record.environment, task_record.task_type, task_record.scope, task_record.stakeholders,
      task_record.dependencies, task_record.details, task_record.links, task_record.checklist, new_start_date, new_due_date,
      false, -- Future instances are not recurring themselves
      NULL, NULL, -- Clear recurrence settings for instances
      task_record.id, -- Set parent task ID
      NULL -- Clear end date for instances
    );
    
    iter_date := new_due_date;
    instance_count := instance_count + 1;
  END LOOP;
  
  RETURN QUERY SELECT instance_count, format('Created %s recurring task instances', instance_count)::text;
END;
$$;