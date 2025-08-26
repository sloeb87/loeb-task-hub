-- Update links field structure to support multiple links per type for tasks and projects

-- First, let's see what the current structure looks like by checking existing data
-- The current links field is JSONB and needs to be migrated to support arrays

-- We'll need to migrate existing data from single strings to arrays
-- For tasks table
UPDATE public.tasks 
SET links = jsonb_build_object(
  'oneNote', CASE 
    WHEN links->>'oneNote' IS NOT NULL AND links->>'oneNote' != '' 
    THEN jsonb_build_array(links->'oneNote') 
    ELSE jsonb_build_array() 
  END,
  'teams', CASE 
    WHEN links->>'teams' IS NOT NULL AND links->>'teams' != '' 
    THEN jsonb_build_array(links->'teams') 
    ELSE jsonb_build_array() 
  END,
  'email', CASE 
    WHEN links->>'email' IS NOT NULL AND links->>'email' != '' 
    THEN jsonb_build_array(links->'email') 
    ELSE jsonb_build_array() 
  END,
  'file', CASE 
    WHEN links->>'file' IS NOT NULL AND links->>'file' != '' 
    THEN jsonb_build_array(links->'file') 
    ELSE jsonb_build_array() 
  END,
  'folder', CASE 
    WHEN links->>'folder' IS NOT NULL AND links->>'folder' != '' 
    THEN jsonb_build_array(links->'folder') 
    ELSE jsonb_build_array() 
  END
)
WHERE links IS NOT NULL;

-- For tasks with NULL links, set default empty arrays structure
UPDATE public.tasks 
SET links = jsonb_build_object(
  'oneNote', jsonb_build_array(),
  'teams', jsonb_build_array(),
  'email', jsonb_build_array(),
  'file', jsonb_build_array(),
  'folder', jsonb_build_array()
)
WHERE links IS NULL;

-- For projects table
UPDATE public.projects 
SET links = jsonb_build_object(
  'oneNote', CASE 
    WHEN links->>'oneNote' IS NOT NULL AND links->>'oneNote' != '' 
    THEN jsonb_build_array(links->'oneNote') 
    ELSE jsonb_build_array() 
  END,
  'teams', CASE 
    WHEN links->>'teams' IS NOT NULL AND links->>'teams' != '' 
    THEN jsonb_build_array(links->'teams') 
    ELSE jsonb_build_array() 
  END,
  'email', CASE 
    WHEN links->>'email' IS NOT NULL AND links->>'email' != '' 
    THEN jsonb_build_array(links->'email') 
    ELSE jsonb_build_array() 
  END,
  'file', CASE 
    WHEN links->>'file' IS NOT NULL AND links->>'file' != '' 
    THEN jsonb_build_array(links->'file') 
    ELSE jsonb_build_array() 
  END,
  'folder', CASE 
    WHEN links->>'folder' IS NOT NULL AND links->>'folder' != '' 
    THEN jsonb_build_array(links->'folder') 
    ELSE jsonb_build_array() 
  END
)
WHERE links IS NOT NULL;

-- For projects with NULL links, set default empty arrays structure  
UPDATE public.projects 
SET links = jsonb_build_object(
  'oneNote', jsonb_build_array(),
  'teams', jsonb_build_array(),
  'email', jsonb_build_array(),
  'file', jsonb_build_array(),
  'folder', jsonb_build_array()
)
WHERE links IS NULL;