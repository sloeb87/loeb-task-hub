-- Create function to generate sequential project numbers (P1, P2, P3, etc.)
CREATE OR REPLACE FUNCTION public.generate_project_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get the next project number for this user
  SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 2) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.projects
  WHERE user_id = NEW.user_id
  AND id ~ '^P[0-9]+$'; -- Only consider IDs that match P followed by digits
  
  NEW.id := 'P' || next_number::TEXT;
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically generate project numbers before insert
CREATE TRIGGER trigger_generate_project_number
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_project_number();