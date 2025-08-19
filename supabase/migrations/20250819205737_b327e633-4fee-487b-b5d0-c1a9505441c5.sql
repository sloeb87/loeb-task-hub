-- First, temporarily drop the foreign key constraint to allow updates
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;

-- Change the project_id column in tasks table to text to match projects.id
ALTER TABLE public.tasks ALTER COLUMN project_id TYPE text USING project_id::text;

-- Change the id column in projects table from uuid to text
ALTER TABLE public.projects ALTER COLUMN id TYPE text USING id::text;

-- Update existing projects to use P1, P2, P3 format based on start_date order
DO $$
DECLARE
    user_record RECORD;
    project_record RECORD;
    counter INTEGER;
    old_id TEXT;
    new_id TEXT;
BEGIN
    -- For each user, update their projects with sequential numbering based on start_date
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM public.projects 
        WHERE id !~ '^P[0-9]+$' -- Only process projects that don't already have P format
    LOOP
        counter := 1;
        
        -- Get all projects for this user, ordered by start_date (earliest first)
        FOR project_record IN
            SELECT id, start_date
            FROM public.projects 
            WHERE user_id = user_record.user_id
            AND id !~ '^P[0-9]+$' -- Only process projects that don't already have P format
            ORDER BY start_date ASC, created_at ASC -- Secondary sort by created_at for ties
        LOOP
            old_id := project_record.id;
            new_id := 'P' || counter::TEXT;
            
            -- Update the project ID first
            UPDATE public.projects 
            SET id = new_id
            WHERE id = old_id 
            AND user_id = user_record.user_id;
            
            -- Then update any tasks that reference this project
            UPDATE public.tasks 
            SET project_id = new_id
            WHERE project_id = old_id;
            
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Recreate the foreign key relationship
ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id);