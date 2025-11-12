-- Create function to backfill all recurrence stats
CREATE OR REPLACE FUNCTION public.backfill_all_recurrence_stats()
RETURNS TABLE(processed_count integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  task_rec RECORD;
  count_processed integer := 0;
BEGIN
  -- Loop through all recurring parent tasks and their children's parents
  FOR task_rec IN 
    SELECT DISTINCT 
      COALESCE(parent_task_id, id) as parent_id,
      user_id
    FROM public.tasks
    WHERE is_recurring = true OR parent_task_id IS NOT NULL
  LOOP
    -- Refresh stats for this parent task
    PERFORM public.refresh_recurrence_stats(task_rec.parent_id, task_rec.user_id);
    count_processed := count_processed + 1;
  END LOOP;
  
  RETURN QUERY SELECT count_processed, format('Backfilled recurrence stats for %s recurring task series', count_processed)::text;
END;
$function$;

-- Execute the backfill
SELECT * FROM public.backfill_all_recurrence_stats();