-- Add composite index for common query patterns (user_id, task_type, status)
CREATE INDEX IF NOT EXISTS idx_tasks_user_type_status ON public.tasks(user_id, task_type, status);