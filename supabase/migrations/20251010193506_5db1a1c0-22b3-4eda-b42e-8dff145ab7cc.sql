-- Create materialized view for meeting tasks
CREATE MATERIALIZED VIEW IF NOT EXISTS public.meeting_tasks_view AS
SELECT 
  id, task_number, scope, project_id, environment, task_type, title, description,
  status, priority, responsible, creation_date, start_date, due_date, 
  completion_date, duration, planned_time_hours, dependencies, details, 
  links, stakeholders, checklist, user_id, created_at, updated_at, is_recurring, 
  recurrence_type, recurrence_interval, parent_task_id, recurrence_end_date, 
  recurrence_days_of_week, is_favorite, is_meeting
FROM public.tasks
WHERE is_meeting = true;

-- Create materialized view for regular (non-meeting) tasks
CREATE MATERIALIZED VIEW IF NOT EXISTS public.regular_tasks_view AS
SELECT 
  id, task_number, scope, project_id, environment, task_type, title, description,
  status, priority, responsible, creation_date, start_date, due_date, 
  completion_date, duration, planned_time_hours, dependencies, details, 
  links, stakeholders, checklist, user_id, created_at, updated_at, is_recurring, 
  recurrence_type, recurrence_interval, parent_task_id, recurrence_end_date, 
  recurrence_days_of_week, is_favorite, is_meeting
FROM public.tasks
WHERE is_meeting = false;

-- Create indexes on materialized views for fast queries
CREATE INDEX IF NOT EXISTS idx_meeting_tasks_view_user_id ON public.meeting_tasks_view(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_tasks_view_due_date ON public.meeting_tasks_view(due_date);
CREATE INDEX IF NOT EXISTS idx_meeting_tasks_view_status ON public.meeting_tasks_view(status);
CREATE INDEX IF NOT EXISTS idx_meeting_tasks_view_user_status ON public.meeting_tasks_view(user_id, status);

CREATE INDEX IF NOT EXISTS idx_regular_tasks_view_user_id ON public.regular_tasks_view(user_id);
CREATE INDEX IF NOT EXISTS idx_regular_tasks_view_due_date ON public.regular_tasks_view(due_date);
CREATE INDEX IF NOT EXISTS idx_regular_tasks_view_status ON public.regular_tasks_view(status);
CREATE INDEX IF NOT EXISTS idx_regular_tasks_view_user_type_status ON public.regular_tasks_view(user_id, task_type, status);

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_task_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.meeting_tasks_view;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.regular_tasks_view;
END;
$$;

-- Create unique indexes to enable concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_tasks_view_id ON public.meeting_tasks_view(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_regular_tasks_view_id ON public.regular_tasks_view(id);

-- Create trigger function to auto-refresh views when tasks change
CREATE OR REPLACE FUNCTION public.trigger_refresh_task_views()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Refresh materialized views after task changes
  -- Using CONCURRENTLY to avoid locking the views during refresh
  PERFORM public.refresh_task_views();
  RETURN NULL;
END;
$$;

-- Create trigger to refresh views on task insert/update/delete
DROP TRIGGER IF EXISTS trigger_refresh_views_on_task_change ON public.tasks;
CREATE TRIGGER trigger_refresh_views_on_task_change
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_refresh_task_views();

COMMENT ON MATERIALIZED VIEW public.meeting_tasks_view IS 'Pre-filtered view of meeting tasks for fast querying';
COMMENT ON MATERIALIZED VIEW public.regular_tasks_view IS 'Pre-filtered view of regular (non-meeting) tasks for fast querying';
COMMENT ON FUNCTION public.refresh_task_views() IS 'Manually refresh both task materialized views';
COMMENT ON TRIGGER trigger_refresh_views_on_task_change ON public.tasks IS 'Automatically refresh materialized views when tasks change';