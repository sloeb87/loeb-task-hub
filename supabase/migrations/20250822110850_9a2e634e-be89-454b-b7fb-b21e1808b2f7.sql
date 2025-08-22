-- Remove the automatic recurring instance creation trigger from task updates
-- This ensures only the Generate button creates recurring instances, not the Update Task button

-- Drop the existing trigger that automatically creates recurring instances
DROP TRIGGER IF EXISTS create_recurring_instances_trigger ON public.tasks;

-- The generate_recurring_instances function will still be available for manual generation
-- but won't be automatically triggered on task updates