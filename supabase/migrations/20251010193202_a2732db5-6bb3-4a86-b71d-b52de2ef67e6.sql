-- Add is_meeting boolean field for faster meeting detection
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS is_meeting boolean NOT NULL DEFAULT false;

-- Update existing records to set is_meeting based on task_type
UPDATE public.tasks 
SET is_meeting = true 
WHERE task_type IN ('Meeting', 'Meeting Recurring');

-- Add index on is_meeting for fast filtering
CREATE INDEX IF NOT EXISTS idx_tasks_is_meeting ON public.tasks(is_meeting);

-- Create trigger function to automatically set is_meeting when task_type changes
CREATE OR REPLACE FUNCTION public.set_is_meeting()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.is_meeting := NEW.task_type IN ('Meeting', 'Meeting Recurring');
  RETURN NEW;
END;
$$;

-- Create trigger to call the function on insert or update
DROP TRIGGER IF EXISTS trigger_set_is_meeting ON public.tasks;
CREATE TRIGGER trigger_set_is_meeting
BEFORE INSERT OR UPDATE OF task_type ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_is_meeting();