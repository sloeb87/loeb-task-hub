-- Create simplified tables for lightweight version
-- These can be easily dropped if the new version doesn't work

-- Simple Projects Table
CREATE TABLE public.simple_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  owner TEXT,
  start_date DATE,
  end_date DATE,
  team_members TEXT, -- comma-separated list
  project_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Simple Tasks Table
CREATE TABLE public.simple_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.simple_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  responsible TEXT,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Simple Follow-ups Table
CREATE TABLE public.simple_followups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.simple_tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Simple Time Entries Table
CREATE TABLE public.simple_time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.simple_tasks(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.simple_projects(id) ON DELETE CASCADE,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simple_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_time_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for simple_projects
CREATE POLICY "Users can view their own simple projects" 
ON public.simple_projects FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own simple projects" 
ON public.simple_projects FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simple projects" 
ON public.simple_projects FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own simple projects" 
ON public.simple_projects FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for simple_tasks
CREATE POLICY "Users can view their own simple tasks" 
ON public.simple_tasks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own simple tasks" 
ON public.simple_tasks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simple tasks" 
ON public.simple_tasks FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own simple tasks" 
ON public.simple_tasks FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for simple_followups
CREATE POLICY "Users can view their own simple followups" 
ON public.simple_followups FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own simple followups" 
ON public.simple_followups FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simple followups" 
ON public.simple_followups FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own simple followups" 
ON public.simple_followups FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for simple_time_entries
CREATE POLICY "Users can view their own simple time entries" 
ON public.simple_time_entries FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own simple time entries" 
ON public.simple_time_entries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own simple time entries" 
ON public.simple_time_entries FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own simple time entries" 
ON public.simple_time_entries FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_simple_tasks_project_id ON public.simple_tasks(project_id);
CREATE INDEX idx_simple_tasks_user_status ON public.simple_tasks(user_id, status);
CREATE INDEX idx_simple_followups_task_id ON public.simple_followups(task_id);
CREATE INDEX idx_simple_time_entries_task_id ON public.simple_time_entries(task_id);
CREATE INDEX idx_simple_time_entries_date ON public.simple_time_entries(date);

-- Update timestamp triggers
CREATE TRIGGER update_simple_projects_updated_at
BEFORE UPDATE ON public.simple_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_simple_tasks_updated_at
BEFORE UPDATE ON public.simple_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();