-- Create task_metrics table to store pre-calculated metrics
CREATE TABLE public.task_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  task_number TEXT NOT NULL,
  
  -- Time tracking metrics
  total_time_logged INTEGER DEFAULT 0, -- in seconds
  total_sessions INTEGER DEFAULT 0,
  last_time_entry TIMESTAMP WITH TIME ZONE,
  
  -- Task completion metrics
  actual_duration_days NUMERIC DEFAULT 0,
  planned_vs_actual_ratio NUMERIC DEFAULT 0,
  
  -- Status tracking
  days_overdue INTEGER DEFAULT 0,
  completion_percentage NUMERIC DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_task_metrics_per_user UNIQUE(user_id, task_id)
);

-- Enable RLS
ALTER TABLE public.task_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own task metrics" 
ON public.task_metrics 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own task metrics" 
ON public.task_metrics 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own task metrics" 
ON public.task_metrics 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own task metrics" 
ON public.task_metrics 
FOR DELETE 
USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_task_metrics_user_task ON public.task_metrics(user_id, task_id);
CREATE INDEX idx_task_metrics_task_number ON public.task_metrics(task_number);
CREATE INDEX idx_task_metrics_updated_at ON public.task_metrics(updated_at);

-- Add trigger for updated_at
CREATE TRIGGER update_task_metrics_updated_at
  BEFORE UPDATE ON public.task_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate and update task metrics
CREATE OR REPLACE FUNCTION public.calculate_task_metrics(p_task_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  task_record tasks%ROWTYPE;
  metrics_record task_metrics%ROWTYPE;
  total_time_seconds INTEGER := 0;
  session_count INTEGER := 0;
  last_entry_time TIMESTAMP WITH TIME ZONE;
  actual_days NUMERIC := 0;
  planned_actual_ratio NUMERIC := 0;
  overdue_days INTEGER := 0;
  completion_pct NUMERIC := 0;
BEGIN
  -- Get task record
  SELECT * INTO task_record FROM public.tasks WHERE id = p_task_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calculate time tracking metrics
  SELECT 
    COALESCE(SUM(duration), 0),
    COUNT(*),
    MAX(end_time)
  INTO 
    total_time_seconds,
    session_count,
    last_entry_time
  FROM public.time_entries 
  WHERE task_id = task_record.task_number 
  AND user_id = task_record.user_id;
  
  -- Calculate actual duration if completed
  IF task_record.completion_date IS NOT NULL THEN
    actual_days := task_record.completion_date - task_record.creation_date;
    
    -- Calculate planned vs actual ratio
    IF task_record.planned_time_hours > 0 THEN
      planned_actual_ratio := (total_time_seconds / 3600.0) / task_record.planned_time_hours;
    END IF;
  END IF;
  
  -- Calculate days overdue
  IF task_record.status != 'Completed' AND task_record.due_date < CURRENT_DATE THEN
    overdue_days := CURRENT_DATE - task_record.due_date;
  END IF;
  
  -- Calculate completion percentage based on checklist
  IF task_record.checklist IS NOT NULL THEN
    WITH checklist_items AS (
      SELECT jsonb_array_elements(task_record.checklist) AS item
    ),
    completed_items AS (
      SELECT COUNT(*) as count
      FROM checklist_items 
      WHERE (item->>'completed')::boolean = true
    ),
    total_items AS (
      SELECT COUNT(*) as count FROM checklist_items
    )
    SELECT 
      CASE 
        WHEN total_items.count = 0 THEN 0
        ELSE (completed_items.count::NUMERIC / total_items.count::NUMERIC) * 100
      END
    INTO completion_pct
    FROM completed_items, total_items;
  END IF;
  
  -- Upsert metrics record
  INSERT INTO public.task_metrics (
    user_id, task_id, task_number,
    total_time_logged, total_sessions, last_time_entry,
    actual_duration_days, planned_vs_actual_ratio,
    days_overdue, completion_percentage
  ) VALUES (
    task_record.user_id, task_record.id, task_record.task_number,
    total_time_seconds, session_count, last_entry_time,
    actual_days, planned_actual_ratio,
    overdue_days, completion_pct
  )
  ON CONFLICT (user_id, task_id) 
  DO UPDATE SET
    total_time_logged = EXCLUDED.total_time_logged,
    total_sessions = EXCLUDED.total_sessions,
    last_time_entry = EXCLUDED.last_time_entry,
    actual_duration_days = EXCLUDED.actual_duration_days,
    planned_vs_actual_ratio = EXCLUDED.planned_vs_actual_ratio,
    days_overdue = EXCLUDED.days_overdue,
    completion_percentage = EXCLUDED.completion_percentage,
    updated_at = NOW();
END;
$$;

-- Function to recalculate all metrics for a user
CREATE OR REPLACE FUNCTION public.recalculate_all_task_metrics(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  task_record RECORD;
  processed_count INTEGER := 0;
BEGIN
  -- Loop through all tasks for the user
  FOR task_record IN 
    SELECT id FROM public.tasks 
    WHERE user_id = p_user_id
  LOOP
    PERFORM public.calculate_task_metrics(task_record.id);
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$$;

-- Trigger to update metrics when tasks change
CREATE OR REPLACE FUNCTION public.trigger_update_task_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Calculate metrics for the affected task
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.task_metrics WHERE task_id = OLD.id;
    RETURN OLD;
  ELSE
    PERFORM public.calculate_task_metrics(NEW.id);
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger to update metrics when time entries change
CREATE OR REPLACE FUNCTION public.trigger_update_metrics_from_time_entries()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  task_uuid UUID;
BEGIN
  -- Find the task UUID from task_number
  IF TG_OP = 'DELETE' THEN
    SELECT id INTO task_uuid FROM public.tasks 
    WHERE task_number = OLD.task_id AND user_id = OLD.user_id;
    
    IF FOUND THEN
      PERFORM public.calculate_task_metrics(task_uuid);
    END IF;
    RETURN OLD;
  ELSE
    SELECT id INTO task_uuid FROM public.tasks 
    WHERE task_number = NEW.task_id AND user_id = NEW.user_id;
    
    IF FOUND THEN
      PERFORM public.calculate_task_metrics(task_uuid);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_tasks_metrics_update
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_task_metrics();

CREATE TRIGGER trigger_time_entries_metrics_update
  AFTER INSERT OR UPDATE OR DELETE ON public.time_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_metrics_from_time_entries();