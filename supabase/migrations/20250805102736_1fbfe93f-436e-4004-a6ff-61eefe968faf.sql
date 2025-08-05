-- Update existing follow-ups that don't have a task_status value
-- We'll set them to 'Unknown' to indicate the status wasn't tracked at creation time
UPDATE public.follow_ups 
SET task_status = 'Unknown' 
WHERE task_status IS NULL;