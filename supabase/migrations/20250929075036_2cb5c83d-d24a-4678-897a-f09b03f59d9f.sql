-- Add is_favorite column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN is_favorite boolean DEFAULT false;