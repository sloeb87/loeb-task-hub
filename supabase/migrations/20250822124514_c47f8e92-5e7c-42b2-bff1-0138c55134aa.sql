-- Update the create_all_recurring_instances function to handle specific days of the week
CREATE OR REPLACE FUNCTION public.create_all_recurring_instances()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  iter_date date;
  new_due_date date;
  new_start_date date;
  instance_count integer := 0;
  max_instances integer := 1000; -- Safety limit
  target_day_of_week integer;
  days_ahead integer;
BEGIN
  -- Only proceed if this is a recurring task being created or updated to be recurring
  IF NEW.is_recurring = true AND NEW.recurrence_end_date IS NOT NULL AND NEW.recurrence_type IS NOT NULL THEN
    
    -- Check if this is a new recurring task or if recurrence settings changed
    IF OLD IS NULL OR OLD.is_recurring = false OR 
       OLD.recurrence_type != NEW.recurrence_type OR 
       OLD.recurrence_interval != NEW.recurrence_interval OR 
       OLD.recurrence_end_date != NEW.recurrence_end_date OR
       OLD.recurrence_days_of_week IS DISTINCT FROM NEW.recurrence_days_of_week THEN
      
      -- Delete any existing future instances for this parent task
      DELETE FROM public.tasks 
      WHERE parent_task_id = NEW.id 
      AND status = 'Open' 
      AND due_date > NEW.due_date;
      
      -- Initialize dates for the next instance
      iter_date := NEW.due_date;
      
      -- Generate instances until end date or safety limit
      LOOP
        -- Calculate next due date based on recurrence type and interval
        CASE NEW.recurrence_type
          WHEN 'daily' THEN
            new_due_date := iter_date + (NEW.recurrence_interval || ' days')::interval;
            new_start_date := NEW.start_date + (new_due_date - NEW.due_date);
          WHEN 'weekly' THEN
            -- Handle weekly recurrence with specific days of the week
            IF NEW.recurrence_days_of_week IS NOT NULL AND array_length(NEW.recurrence_days_of_week, 1) > 0 THEN
              -- Find the next occurrence within the selected days
              new_due_date := NULL;
              FOR i IN 1..7 * NEW.recurrence_interval LOOP
                target_day_of_week := EXTRACT(DOW FROM (iter_date + i));
                IF target_day_of_week = ANY(NEW.recurrence_days_of_week) THEN
                  new_due_date := iter_date + i;
                  EXIT;
                END IF;
              END LOOP;
              
              -- If no matching day found within the interval, skip to next cycle
              IF new_due_date IS NULL THEN
                new_due_date := iter_date + (NEW.recurrence_interval || ' weeks')::interval;
              END IF;
            ELSE
              -- Default weekly behavior (same day of week)
              new_due_date := iter_date + (NEW.recurrence_interval || ' weeks')::interval;
            END IF;
            new_start_date := NEW.start_date + (new_due_date - NEW.due_date);
          WHEN 'monthly' THEN
            new_due_date := iter_date + (NEW.recurrence_interval || ' months')::interval;
            new_start_date := NEW.start_date + (new_due_date - NEW.due_date);
        END CASE;
        
        -- Exit if we've passed the end date or hit safety limit
        EXIT WHEN new_due_date > NEW.recurrence_end_date OR instance_count >= max_instances;
        
        -- For weekdays only (daily recurrence), skip weekends
        IF NEW.recurrence_type = 'daily' AND NEW.recurrence_interval = 1 THEN
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
          NEW.user_id, NEW.project_id, NEW.title, NEW.description, 'Open', NEW.priority,
          NEW.responsible, NEW.environment, NEW.task_type, NEW.scope, NEW.stakeholders,
          NEW.dependencies, NEW.details, NEW.links, NEW.checklist, new_start_date, new_due_date,
          false, -- Future instances are not recurring themselves
          NULL, NULL, -- Clear recurrence settings for instances
          NEW.id, -- Set parent task ID
          NULL, -- Clear end date for instances
          NULL -- Clear days of week for instances
        );
        
        iter_date := new_due_date;
        instance_count := instance_count + 1;
      END LOOP;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update the generate_recurring_instances function to handle specific days of the week
CREATE OR REPLACE FUNCTION public.generate_recurring_instances(task_uuid uuid)
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