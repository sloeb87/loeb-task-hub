-- Add task_type column to time_entries table
ALTER TABLE public.time_entries 
ADD COLUMN task_type text;

-- Update existing time entries with task_type from tasks table
UPDATE public.time_entries 
SET task_type = tasks.task_type
FROM public.tasks 
WHERE time_entries.task_id = tasks.task_number 
  AND time_entries.user_id = tasks.user_id;

-- Update entries that don't have a matching task (like "non_project_time")
UPDATE public.time_entries 
SET task_type = 'Non Project'
WHERE task_type IS NULL;