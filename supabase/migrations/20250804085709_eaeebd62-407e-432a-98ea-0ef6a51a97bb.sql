-- Drop the owner_id column and add owner as text field
ALTER TABLE public.projects 
DROP COLUMN owner_id;

ALTER TABLE public.projects 
ADD COLUMN owner text;

-- Update RLS policies to use user-based access instead of owner_id
DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;  
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;

-- Add user_id column to track project ownership for RLS
ALTER TABLE public.projects 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid();

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