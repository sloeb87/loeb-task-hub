-- Add planned time in hours to tasks table
ALTER TABLE public.tasks 
ADD COLUMN planned_time_hours numeric(5,2) DEFAULT NULL;