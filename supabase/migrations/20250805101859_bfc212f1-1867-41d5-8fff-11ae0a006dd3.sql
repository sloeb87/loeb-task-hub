-- Add task_status column to follow_ups table to track the task status when each follow-up was created
ALTER TABLE public.follow_ups 
ADD COLUMN task_status text;