-- Create the missing trigger for updating task metrics when time entries change
-- This is likely the trigger that was causing the "cannot extract elements from a scalar" error

DO $$
BEGIN
  -- Only create if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_metrics_from_time_entries') THEN
    CREATE TRIGGER trigger_update_metrics_from_time_entries
      AFTER INSERT OR UPDATE OR DELETE ON public.time_entries
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_update_metrics_from_time_entries();
  END IF;
END
$$;

-- Also create the task metrics trigger if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_task_metrics') THEN
    CREATE TRIGGER trigger_update_task_metrics
      AFTER INSERT OR UPDATE OR DELETE ON public.tasks
      FOR EACH ROW
      EXECUTE FUNCTION public.trigger_update_task_metrics();
  END IF;
END
$$;