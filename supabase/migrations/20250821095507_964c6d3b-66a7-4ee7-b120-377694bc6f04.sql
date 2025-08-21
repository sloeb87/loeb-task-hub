-- Drop the existing trigger and function for recurring tasks (with CASCADE)
DROP FUNCTION IF EXISTS public.create_recurring_task_instance() CASCADE;

-- Create a new function to generate all recurring task instances
CREATE OR REPLACE FUNCTION public.create_all_recurring_instances()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_date date;
  new_due_date date;
  new_start_date date;
  instance_count integer := 0;
  max_instances integer := 1000; -- Safety limit
BEGIN
  -- Only proceed if this is a recurring task being created or updated to be recurring
  IF NEW.is_recurring = true AND NEW.recurrence_end_date IS NOT NULL AND NEW.recurrence_type IS NOT NULL THEN
    
    -- Check if this is a new recurring task or if recurrence settings changed
    IF OLD IS NULL OR OLD.is_recurring = false OR 
       OLD.recurrence_type != NEW.recurrence_type OR 
       OLD.recurrence_interval != NEW.recurrence_interval OR 
       OLD.recurrence_end_date != NEW.recurrence_end_date THEN
      
      -- Delete any existing future instances for this parent task
      DELETE FROM public.tasks 
      WHERE parent_task_id = NEW.id 
      AND status = 'Open' 
      AND due_date > NEW.due_date;
      
      -- Initialize dates for the next instance
      current_date := NEW.due_date;
      
      -- Generate instances until end date or safety limit
      LOOP
        -- Calculate next due date based on recurrence type and interval
        CASE NEW.recurrence_type
          WHEN 'daily' THEN
            new_due_date := current_date + (NEW.recurrence_interval || ' days')::interval;
            new_start_date := NEW.start_date + (new_due_date - NEW.due_date);
          WHEN 'weekly' THEN
            new_due_date := current_date + (NEW.recurrence_interval || ' weeks')::interval;
            new_start_date := NEW.start_date + (new_due_date - NEW.due_date);
          WHEN 'monthly' THEN
            new_due_date := current_date + (NEW.recurrence_interval || ' months')::interval;
            new_start_date := NEW.start_date + (new_due_date - NEW.due_date);
        END CASE;
        
        -- Exit if we've passed the end date or hit safety limit
        EXIT WHEN new_due_date > NEW.recurrence_end_date OR instance_count >= max_instances;
        
        -- For weekdays only (daily recurrence), skip weekends
        IF NEW.recurrence_type = 'daily' AND NEW.recurrence_interval = 1 THEN
          -- Skip Saturday (6) and Sunday (0)
          IF EXTRACT(DOW FROM new_due_date) IN (0, 6) THEN
            current_date := new_due_date;
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
          NEW.user_id, NEW.project_id, NEW.title, NEW.description, 'Open', NEW.priority,
          NEW.responsible, NEW.environment, NEW.task_type, NEW.scope, NEW.stakeholders,
          NEW.dependencies, NEW.details, NEW.links, NEW.checklist, new_start_date, new_due_date,
          false, -- Future instances are not recurring themselves
          NULL, NULL, -- Clear recurrence settings for instances
          NEW.id, -- Set parent task ID
          NULL -- Clear end date for instances
        );
        
        current_date := new_due_date;
        instance_count := instance_count + 1;
      END LOOP;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for when recurring tasks are created or updated
CREATE TRIGGER on_recurring_task_upsert
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.create_all_recurring_instances();