-- Drop the duplicate triggers first
DROP TRIGGER IF EXISTS trigger_time_entries_metrics_update ON public.time_entries;
DROP TRIGGER IF EXISTS trigger_update_metrics_from_time_entries ON public.time_entries;

-- Fix the trigger function to handle the array operations correctly
CREATE OR REPLACE FUNCTION public.trigger_update_metrics_from_time_entries()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  task_uuid UUID;
BEGIN
  -- Find the task UUID from task_number - this is where the error might be occurring
  IF TG_OP = 'DELETE' THEN
    -- For DELETE, use OLD values
    SELECT id INTO task_uuid FROM public.tasks 
    WHERE task_number = OLD.task_id AND user_id = OLD.user_id
    LIMIT 1;  -- Add LIMIT to ensure single result
    
    IF FOUND THEN
      PERFORM public.calculate_task_metrics(task_uuid);
    END IF;
    RETURN OLD;
  ELSE
    -- For INSERT/UPDATE, use NEW values
    SELECT id INTO task_uuid FROM public.tasks 
    WHERE task_number = NEW.task_id AND user_id = NEW.user_id
    LIMIT 1;  -- Add LIMIT to ensure single result
    
    IF FOUND THEN
      PERFORM public.calculate_task_metrics(task_uuid);
    END IF;
    RETURN NEW;
  END IF;
END;
$function$;

-- Recreate the trigger with the fixed function
CREATE TRIGGER trigger_update_metrics_from_time_entries
  AFTER INSERT OR UPDATE OR DELETE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_metrics_from_time_entries();