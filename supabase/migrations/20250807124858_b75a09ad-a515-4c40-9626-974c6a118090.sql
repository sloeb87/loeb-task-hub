-- Update task T16 to assign it to the SAP4Genesis project
UPDATE public.tasks 
SET project_id = 'ce0ae62e-fb2f-4244-bf7f-9aa658eab512',
    updated_at = now()
WHERE task_number = 'T16';