-- Update time_entries with missing task_type information from tasks table
UPDATE time_entries 
SET task_type = t.task_type
FROM tasks t
WHERE time_entries.task_id = t.task_number 
  AND (time_entries.task_type IS NULL OR time_entries.task_type = '');

-- Add environment column to time_entries if it doesn't exist
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS environment text;

-- Update time_entries with environment information from tasks table
UPDATE time_entries 
SET environment = t.environment
FROM tasks t
WHERE time_entries.task_id = t.task_number;

-- Add scope column to time_entries if it doesn't exist  
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS scope text[];

-- Update time_entries with scope information from tasks table
UPDATE time_entries 
SET scope = t.scope
FROM tasks t
WHERE time_entries.task_id = t.task_number;