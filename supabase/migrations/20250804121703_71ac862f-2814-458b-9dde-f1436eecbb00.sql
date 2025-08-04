-- Remove the check constraint on task_type to allow dynamic values from parameters
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;