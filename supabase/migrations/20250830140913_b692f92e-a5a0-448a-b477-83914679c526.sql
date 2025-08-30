-- Create missing triggers for the database functions

-- Trigger for generating task numbers
CREATE TRIGGER trigger_generate_task_number
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_task_number();

-- Trigger for updating updated_at column on tasks
CREATE TRIGGER trigger_update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating updated_at column on parameters
CREATE TRIGGER trigger_update_parameters_updated_at
  BEFORE UPDATE ON public.parameters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating updated_at column on profiles
CREATE TRIGGER trigger_update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating updated_at column on projects
CREATE TRIGGER trigger_update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating updated_at column on time_entries
CREATE TRIGGER trigger_update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updating updated_at column on task_metrics
CREATE TRIGGER trigger_update_task_metrics_updated_at
  BEFORE UPDATE ON public.task_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for generating project numbers
CREATE TRIGGER trigger_generate_project_number
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_project_number();

-- Trigger for creating recurring task instances
CREATE TRIGGER trigger_create_recurring_instances
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.create_all_recurring_instances();

-- Trigger for updating task metrics when tasks change
CREATE TRIGGER trigger_update_task_metrics
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_task_metrics();

-- Trigger for updating task metrics when time entries change
CREATE TRIGGER trigger_update_metrics_from_time_entries
  AFTER INSERT OR UPDATE OR DELETE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_metrics_from_time_entries();