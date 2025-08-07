-- Convert project scope from single text to array to support multiple scopes
-- First, let's backup the existing scope data and convert it to an array format

-- Step 1: Add a new temporary column for the array
ALTER TABLE public.projects ADD COLUMN scope_array text[];

-- Step 2: Migrate existing scope data to the array format
UPDATE public.projects 
SET scope_array = CASE 
  WHEN scope IS NOT NULL AND scope != '' THEN ARRAY[scope]
  ELSE '{}'::text[]
END;

-- Step 3: Drop the old scope column
ALTER TABLE public.projects DROP COLUMN scope;

-- Step 4: Rename the new column to scope
ALTER TABLE public.projects RENAME COLUMN scope_array TO scope;

-- Step 5: Set the scope column to not null with a default empty array
ALTER TABLE public.projects ALTER COLUMN scope SET NOT NULL;
ALTER TABLE public.projects ALTER COLUMN scope SET DEFAULT '{}'::text[];