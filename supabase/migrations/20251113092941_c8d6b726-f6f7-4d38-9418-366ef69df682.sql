-- Drop the duplicate trigger
-- Keep only the 'create_task_update_followup_trigger' and remove the duplicate 'trigger_task_update_followup'
DROP TRIGGER IF EXISTS trigger_task_update_followup ON public.tasks;

-- Ensure the correct trigger exists (recreate to be safe)
DROP TRIGGER IF EXISTS create_task_update_followup_trigger ON public.tasks;

CREATE TRIGGER create_task_update_followup_trigger
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.create_task_update_followup();