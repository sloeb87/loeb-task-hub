-- Add team column to projects table to store team members
ALTER TABLE public.projects 
ADD COLUMN team text[] DEFAULT '{}';

-- Update the updated_at trigger if it doesn't exist
CREATE OR REPLACE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();