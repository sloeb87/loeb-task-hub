-- Update task T40 to be linked to project P5
UPDATE public.tasks 
SET project_id = 'P5'
WHERE task_number = 'T40' AND user_id = auth.uid();