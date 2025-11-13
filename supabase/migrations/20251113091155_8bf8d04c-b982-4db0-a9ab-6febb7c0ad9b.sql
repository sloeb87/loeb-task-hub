-- Drop the existing trigger first
DROP TRIGGER IF EXISTS create_task_update_followup_trigger ON public.tasks;

-- Recreate the function to handle all task updates including completion
CREATE OR REPLACE FUNCTION public.create_task_update_followup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  changes_text TEXT;
  change_parts TEXT[];
BEGIN
  -- Only create follow-up if this is an actual update (not insert)
  IF TG_OP = 'UPDATE' THEN
    -- Initialize changes array
    change_parts := ARRAY[]::TEXT[];
    
    -- Check for status changes
    IF OLD.status != NEW.status THEN
      -- Special handling for completion
      IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
        -- Don't add to change_parts, will be handled separately below
        -- This prevents "Status: Open → Completed" appearing with "Task completed"
        NULL;
      ELSIF OLD.status = 'Completed' AND NEW.status != 'Completed' THEN
        change_parts := array_append(change_parts, 'Task reopened - Status: Completed → ' || NEW.status);
      ELSE
        change_parts := array_append(change_parts, 'Status: ' || OLD.status || ' → ' || NEW.status);
      END IF;
    END IF;
    
    -- Check for priority changes
    IF OLD.priority != NEW.priority THEN
      change_parts := array_append(change_parts, 'Priority: ' || OLD.priority || ' → ' || NEW.priority);
    END IF;
    
    -- Check for title changes
    IF OLD.title != NEW.title THEN
      change_parts := array_append(change_parts, 'Title: "' || OLD.title || '" → "' || NEW.title || '"');
    END IF;
    
    -- Check for responsible person changes
    IF OLD.responsible != NEW.responsible THEN
      change_parts := array_append(change_parts, 'Responsible: ' || COALESCE(OLD.responsible, 'None') || ' → ' || COALESCE(NEW.responsible, 'None'));
    END IF;
    
    -- Check for due date changes
    IF OLD.due_date != NEW.due_date THEN
      change_parts := array_append(change_parts, 'Due date: ' || OLD.due_date || ' → ' || NEW.due_date);
    END IF;
    
    -- Check for task type changes
    IF OLD.task_type != NEW.task_type THEN
      change_parts := array_append(change_parts, 'Task type: ' || OLD.task_type || ' → ' || NEW.task_type);
    END IF;
    
    -- Check for description changes
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      change_parts := array_append(change_parts, 'Description updated');
    END IF;
    
    -- Handle task completion - create a clean follow-up
    IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
      -- Skip creating completion follow-up for Meeting tasks and recurring meetings
      IF NEW.task_type != 'Meeting' AND NEW.is_recurring = false THEN
        INSERT INTO public.follow_ups (task_id, text, task_status)
        VALUES (NEW.task_number, 'Task marked completed', NEW.status);
      END IF;
    END IF;
    
    -- Only create general update follow-up if there are other changes (not just completion)
    IF array_length(change_parts, 1) > 0 THEN
      changes_text := 'Task updated: ' || array_to_string(change_parts, ', ');
      
      -- Insert follow-up record
      INSERT INTO public.follow_ups (task_id, text, task_status)
      VALUES (NEW.task_number, changes_text, NEW.status);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER create_task_update_followup_trigger
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.create_task_update_followup();