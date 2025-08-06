-- Update task T11 completion date to the correct date when it was actually completed
UPDATE tasks 
SET completion_date = '2025-08-05' 
WHERE task_number = 'T11' AND status = 'Completed';