-- Add checklist column to tasks table to store checklist items
ALTER TABLE public.tasks 
ADD COLUMN checklist JSONB DEFAULT '[]'::jsonb;