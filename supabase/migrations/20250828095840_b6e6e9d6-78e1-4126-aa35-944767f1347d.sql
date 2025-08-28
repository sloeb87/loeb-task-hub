-- Remove duplicate triggers that might be causing conflicts
DROP TRIGGER IF EXISTS generate_task_number_trigger ON public.tasks;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;

-- Keep only one trigger for each function
-- set_task_number (for task number generation)
-- set_updated_at_tasks (for updated_at timestamp)
-- on_recurring_task_upsert (for recurring tasks)
-- trigger_tasks_metrics_update (for metrics)

-- Double-check the recurring task trigger is working properly by recreating it
DROP TRIGGER IF EXISTS on_recurring_task_upsert ON public.tasks;

CREATE TRIGGER on_recurring_task_upsert 
    AFTER INSERT OR UPDATE ON public.tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION public.create_all_recurring_instances();