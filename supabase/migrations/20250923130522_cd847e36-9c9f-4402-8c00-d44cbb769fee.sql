-- Performance optimization indexes for faster task and meeting loading
-- These indexes will significantly speed up filtering and sorting operations

-- Index for tasks by user_id and task_type (for meetings page)
CREATE INDEX IF NOT EXISTS idx_tasks_user_task_type ON public.tasks (user_id, task_type);

-- Index for tasks by user_id and status (for active filter)
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks (user_id, status);

-- Index for tasks by user_id, due_date (for sorting by due date)
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON public.tasks (user_id, due_date);

-- Index for tasks by user_id and priority (for critical filter)
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON public.tasks (user_id, priority);

-- Composite index for common query patterns (user + status + due_date)
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_due_date ON public.tasks (user_id, status, due_date);

-- Index for follow_ups by task_id (prevents N+1 queries when batch loading)
CREATE INDEX IF NOT EXISTS idx_followups_task_id ON public.follow_ups (task_id, created_at DESC);

-- Index for projects by user_id (for project name lookups)
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects (user_id, id);

-- Text search optimization indexes
CREATE INDEX IF NOT EXISTS idx_tasks_title_search ON public.tasks USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_tasks_description_search ON public.tasks USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_tasks_responsible_search ON public.tasks USING gin(to_tsvector('english', responsible));

-- Follow-ups text search index
CREATE INDEX IF NOT EXISTS idx_followups_text_search ON public.follow_ups USING gin(to_tsvector('english', text));

-- Analyze tables to update statistics for better query planning
ANALYZE public.tasks;
ANALYZE public.follow_ups;
ANALYZE public.projects;