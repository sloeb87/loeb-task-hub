-- Update existing time entries to use task_number instead of UUID in task_id field
-- This migration maps UUID task_ids to their corresponding task_numbers

UPDATE public.time_entries 
SET task_id = tasks.task_number
FROM public.tasks 
WHERE time_entries.task_id = tasks.id::text 
AND time_entries.user_id = tasks.user_id;