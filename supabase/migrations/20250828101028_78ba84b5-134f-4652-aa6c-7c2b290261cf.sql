-- Completely disable the recurring task trigger temporarily to test if that's the issue
DROP TRIGGER IF EXISTS on_recurring_task_upsert ON public.tasks;

-- Let's test without the trigger first to see if the basic update works
-- If this fixes it, we know the trigger is the problem