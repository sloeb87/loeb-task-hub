-- Copy time tracking data to new dates
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/emjtsxfjrprcrssuvbat/sql/new

-- Copy entries from 2025-11-05 to 2025-11-12
INSERT INTO time_entries (
  user_id, task_id, task_title, project_name, responsible, 
  start_time, end_time, duration, description, 
  environment, scope, task_type, is_running
)
SELECT 
  user_id, task_id, task_title, project_name, responsible,
  start_time + INTERVAL '7 days' as start_time,
  end_time + INTERVAL '7 days' as end_time,
  duration, 
  CASE 
    WHEN description IS NOT NULL THEN 'Copied from ' || start_time::date || ': ' || description
    ELSE 'Copied from ' || start_time::date
  END as description,
  environment, scope, task_type, false
FROM time_entries
WHERE start_time::date = '2025-11-05' AND is_running = false;

-- Copy entries from 2025-11-06 to 2025-11-13
INSERT INTO time_entries (
  user_id, task_id, task_title, project_name, responsible, 
  start_time, end_time, duration, description, 
  environment, scope, task_type, is_running
)
SELECT 
  user_id, task_id, task_title, project_name, responsible,
  start_time + INTERVAL '7 days' as start_time,
  end_time + INTERVAL '7 days' as end_time,
  duration, 
  CASE 
    WHEN description IS NOT NULL THEN 'Copied from ' || start_time::date || ': ' || description
    ELSE 'Copied from ' || start_time::date
  END as description,
  environment, scope, task_type, false
FROM time_entries
WHERE start_time::date = '2025-11-06' AND is_running = false;

-- Copy entries from 2025-11-07 to 2025-11-14
INSERT INTO time_entries (
  user_id, task_id, task_title, project_name, responsible, 
  start_time, end_time, duration, description, 
  environment, scope, task_type, is_running
)
SELECT 
  user_id, task_id, task_title, project_name, responsible,
  start_time + INTERVAL '7 days' as start_time,
  end_time + INTERVAL '7 days' as end_time,
  duration, 
  CASE 
    WHEN description IS NOT NULL THEN 'Copied from ' || start_time::date || ': ' || description
    ELSE 'Copied from ' || start_time::date
  END as description,
  environment, scope, task_type, false
FROM time_entries
WHERE start_time::date = '2025-11-07' AND is_running = false;

-- Copy entries from 2025-11-10 to 2025-11-18
INSERT INTO time_entries (
  user_id, task_id, task_title, project_name, responsible, 
  start_time, end_time, duration, description, 
  environment, scope, task_type, is_running
)
SELECT 
  user_id, task_id, task_title, project_name, responsible,
  start_time + INTERVAL '8 days' as start_time,
  end_time + INTERVAL '8 days' as end_time,
  duration, 
  CASE 
    WHEN description IS NOT NULL THEN 'Copied from ' || start_time::date || ': ' || description
    ELSE 'Copied from ' || start_time::date
  END as description,
  environment, scope, task_type, false
FROM time_entries
WHERE start_time::date = '2025-11-10' AND is_running = false;

-- Copy entries from 2025-11-11 to 2025-11-19
INSERT INTO time_entries (
  user_id, task_id, task_title, project_name, responsible, 
  start_time, end_time, duration, description, 
  environment, scope, task_type, is_running
)
SELECT 
  user_id, task_id, task_title, project_name, responsible,
  start_time + INTERVAL '8 days' as start_time,
  end_time + INTERVAL '8 days' as end_time,
  duration, 
  CASE 
    WHEN description IS NOT NULL THEN 'Copied from ' || start_time::date || ': ' || description
    ELSE 'Copied from ' || start_time::date
  END as description,
  environment, scope, task_type, false
FROM time_entries
WHERE start_time::date = '2025-11-11' AND is_running = false;

-- Copy entries from 2025-11-12 to 2025-11-20
INSERT INTO time_entries (
  user_id, task_id, task_title, project_name, responsible, 
  start_time, end_time, duration, description, 
  environment, scope, task_type, is_running
)
SELECT 
  user_id, task_id, task_title, project_name, responsible,
  start_time + INTERVAL '8 days' as start_time,
  end_time + INTERVAL '8 days' as end_time,
  duration, 
  CASE 
    WHEN description IS NOT NULL THEN 'Copied from ' || start_time::date || ': ' || description
    ELSE 'Copied from ' || start_time::date
  END as description,
  environment, scope, task_type, false
FROM time_entries
WHERE start_time::date = '2025-11-12' AND is_running = false;

-- Verify the copies
SELECT 
  start_time::date as date,
  COUNT(*) as entry_count,
  SUM(duration) as total_minutes
FROM time_entries
WHERE start_time::date IN ('2025-11-12', '2025-11-13', '2025-11-14', '2025-11-18', '2025-11-19', '2025-11-20')
GROUP BY start_time::date
ORDER BY start_time::date;
