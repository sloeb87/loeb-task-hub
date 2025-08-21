-- Add recurring task functionality to tasks table
ALTER TABLE public.tasks 
ADD COLUMN is_recurring boolean DEFAULT false,
ADD COLUMN recurrence_type text, -- 'daily', 'weekly', 'monthly'
ADD COLUMN recurrence_interval integer DEFAULT 1, -- 1, 2, etc.
ADD COLUMN parent_task_id uuid, -- Reference to original recurring task
ADD COLUMN next_recurrence_date date, -- When to create next instance
ADD COLUMN recurrence_end_date date; -- Optional end date for recurrence

-- Add check constraints for recurrence fields
ALTER TABLE public.tasks 
ADD CONSTRAINT check_recurrence_type 
CHECK (recurrence_type IS NULL OR recurrence_type IN ('daily', 'weekly', 'monthly'));

ALTER TABLE public.tasks 
ADD CONSTRAINT check_recurrence_interval 
CHECK (recurrence_interval IS NULL OR recurrence_interval > 0);

-- Create function to generate next recurring task
CREATE OR REPLACE FUNCTION public.create_recurring_task_instance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_due_date date;
  new_start_date date;
BEGIN
  -- Only proceed if this is a recurring task and we're updating completion
  IF NEW.is_recurring = true AND OLD.status != 'Completed' AND NEW.status = 'Completed' THEN
    
    -- Calculate next due date based on recurrence type and interval
    CASE NEW.recurrence_type
      WHEN 'daily' THEN
        new_due_date := NEW.due_date + (NEW.recurrence_interval || ' days')::interval;
        new_start_date := NEW.start_date + (NEW.recurrence_interval || ' days')::interval;
      WHEN 'weekly' THEN
        new_due_date := NEW.due_date + (NEW.recurrence_interval || ' weeks')::interval;
        new_start_date := NEW.start_date + (NEW.recurrence_interval || ' weeks')::interval;
      WHEN 'monthly' THEN
        new_due_date := NEW.due_date + (NEW.recurrence_interval || ' months')::interval;
        new_start_date := NEW.start_date + (NEW.recurrence_interval || ' months')::interval;
    END CASE;
    
    -- Only create next instance if we haven't passed the end date (if set)
    IF NEW.recurrence_end_date IS NULL OR new_due_date <= NEW.recurrence_end_date THEN
      -- Create the next recurring task instance
      INSERT INTO public.tasks (
        user_id, project_id, title, description, status, priority, 
        responsible, environment, task_type, scope, stakeholders, 
        dependencies, details, links, checklist, start_date, due_date,
        is_recurring, recurrence_type, recurrence_interval, 
        parent_task_id, next_recurrence_date, recurrence_end_date
      ) VALUES (
        NEW.user_id, NEW.project_id, NEW.title, NEW.description, 'Open', NEW.priority,
        NEW.responsible, NEW.environment, NEW.task_type, NEW.scope, NEW.stakeholders,
        NEW.dependencies, NEW.details, NEW.links, NEW.checklist, new_start_date, new_due_date,
        true, NEW.recurrence_type, NEW.recurrence_interval,
        COALESCE(NEW.parent_task_id, NEW.id), new_due_date, NEW.recurrence_end_date
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for automatic recurring task generation
CREATE TRIGGER trigger_create_recurring_task_instance
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.create_recurring_task_instance();