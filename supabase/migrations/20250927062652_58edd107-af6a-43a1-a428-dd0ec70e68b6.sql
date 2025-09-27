-- Create function to generate follow-up on task updates
CREATE OR REPLACE FUNCTION public.create_task_update_followup()
RETURNS TRIGGER AS $$
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
      change_parts := array_append(change_parts, 'Status: ' || OLD.status || ' → ' || NEW.status);
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
    
    -- Check for description changes
    IF OLD.description IS DISTINCT FROM NEW.description THEN
      change_parts := array_append(change_parts, 'Description updated');
    END IF;
    
    -- Check for completion date changes (task completed/reopened)
    IF OLD.completion_date IS DISTINCT FROM NEW.completion_date THEN
      IF NEW.completion_date IS NOT NULL AND OLD.completion_date IS NULL THEN
        change_parts := array_append(change_parts, 'Task completed on ' || NEW.completion_date);
      ELSIF NEW.completion_date IS NULL AND OLD.completion_date IS NOT NULL THEN
        change_parts := array_append(change_parts, 'Task reopened');
      END IF;
    END IF;
    
    -- Only create follow-up if there are actual changes
    IF array_length(change_parts, 1) > 0 THEN
      changes_text := 'Task updated: ' || array_to_string(change_parts, ', ');
      
      -- Insert follow-up record
      INSERT INTO public.follow_ups (task_id, text, task_status)
      VALUES (NEW.task_number, changes_text, NEW.status);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on tasks table
DROP TRIGGER IF EXISTS trigger_task_update_followup ON public.tasks;
CREATE TRIGGER trigger_task_update_followup
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.create_task_update_followup();