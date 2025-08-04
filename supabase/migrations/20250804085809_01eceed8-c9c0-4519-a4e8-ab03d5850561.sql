-- First drop all existing RLS policies
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;  
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;

-- Add user_id column first (for RLS)
ALTER TABLE public.projects 
ADD COLUMN user_id uuid;

-- Update existing records to set user_id to owner_id value
UPDATE public.projects 
SET user_id = owner_id;

-- Make user_id NOT NULL and add foreign key constraint
ALTER TABLE public.projects 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.projects 
ADD CONSTRAINT projects_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Now drop the owner_id column and add owner as text
ALTER TABLE public.projects 
DROP COLUMN owner_id;

ALTER TABLE public.projects 
ADD COLUMN owner text;

-- Create new RLS policies based on user_id
CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (user_id = auth.uid());