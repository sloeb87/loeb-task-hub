-- Update task T11 to have the correct completion date
UPDATE tasks 
SET completion_date = CURRENT_DATE 
WHERE task_number = 'T11' AND status = 'Completed' AND completion_date IS NULL;