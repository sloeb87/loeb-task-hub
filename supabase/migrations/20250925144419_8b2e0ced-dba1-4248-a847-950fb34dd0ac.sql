-- Update task_type from "Meeting" to "Meeting Recurring" for recurring meetings

-- Update parent recurring meeting tasks
UPDATE public.tasks 
SET task_type = 'Meeting Recurring', 
    updated_at = now()
WHERE task_type = 'Meeting' 
  AND is_recurring = true;

-- Update instance recurring meeting tasks (those that are part of a recurring series)
UPDATE public.tasks 
SET task_type = 'Meeting Recurring', 
    updated_at = now()
WHERE task_type = 'Meeting' 
  AND parent_task_id IS NOT NULL;