-- First, get the user_id from one of the existing tasks
DO $$
DECLARE
    target_user_id uuid;
    new_parent_id uuid;
BEGIN
    -- Get the user_id from existing P5 tasks
    SELECT user_id INTO target_user_id 
    FROM tasks 
    WHERE project_id = 'P5' 
    LIMIT 1;
    
    -- Generate a new UUID for the parent task
    new_parent_id := gen_random_uuid();
    
    -- Delete all orphaned "Wheel Betterflow" meetings
    DELETE FROM tasks 
    WHERE project_id = 'P5' 
    AND task_type = 'Meeting' 
    AND title = 'Wheel Betterflow'
    AND is_recurring = false;
    
    -- Create the new recurring parent task for "Wheel Betterflow"
    INSERT INTO tasks (
        id,
        user_id,
        project_id,
        title,
        description,
        task_type,
        status,
        priority,
        responsible,
        environment,
        scope,
        stakeholders,
        start_date,
        due_date,
        is_recurring,
        recurrence_type,
        recurrence_interval,
        recurrence_end_date,
        parent_task_id,
        recurrence_days_of_week
    ) VALUES (
        new_parent_id,
        target_user_id,
        'P5',
        'Wheel Betterflow',
        'Preparation',
        'Meeting',
        'Open',
        'Medium',
        'Selim Loeb',
        '',
        ARRAY['B4'],
        ARRAY[]::text[],
        '2025-08-13'::date,
        '2025-08-28'::date,
        true,
        'weekly',
        1,
        '2025-12-31'::date,
        NULL,
        NULL
    );
    
    -- Generate recurring instances using the existing function
    PERFORM generate_recurring_instances(new_parent_id);
    
END $$;