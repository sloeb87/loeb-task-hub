-- Add cost_center column to projects table
ALTER TABLE public.projects 
ADD COLUMN cost_center text;