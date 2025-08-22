-- Add column to store selected days of the week for recurring tasks
ALTER TABLE public.tasks 
ADD COLUMN recurrence_days_of_week integer[] DEFAULT NULL;

COMMENT ON COLUMN public.tasks.recurrence_days_of_week IS 'Array of integers (0-6) representing selected days of the week for weekly recurrence (0=Sunday, 1=Monday, etc.)';