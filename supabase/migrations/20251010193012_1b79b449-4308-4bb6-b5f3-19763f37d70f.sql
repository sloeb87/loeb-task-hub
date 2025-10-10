-- Add index on task_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON public.tasks(task_type);