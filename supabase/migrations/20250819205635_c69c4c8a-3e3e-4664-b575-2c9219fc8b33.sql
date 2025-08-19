-- Update existing projects to use P1, P2, P3 format based on start_date order
DO $$
DECLARE
    user_record RECORD;
    project_record RECORD;
    counter INTEGER;
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
            -- Update the project ID to P1, P2, P3, etc.
            UPDATE public.projects 
            SET id = 'P' || counter::TEXT
            WHERE id = project_record.id 
            AND user_id = user_record.user_id;
            
            -- Also update any tasks that reference this project by name
            -- Since tasks reference projects by name, not ID, we don't need to update task references
            
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;