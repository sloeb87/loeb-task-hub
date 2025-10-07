-- Update all "Wheel Betterflow" tasks to be linked with the BetterFlow project
UPDATE public.tasks
SET project_id = 'P5'
WHERE title ILIKE '%Wheel Betterflow%'
  AND (project_id IS NULL OR project_id != 'P5');