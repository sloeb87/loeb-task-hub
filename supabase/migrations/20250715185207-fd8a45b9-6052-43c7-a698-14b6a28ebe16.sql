-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'On Hold', 'Completed')) DEFAULT 'Active',
  links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_number TEXT NOT NULL UNIQUE, -- T1, T2, T3 format
  scope TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  environment TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('Development', 'Testing', 'Documentation', 'Review', 'Meeting', 'Research')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('Open', 'In Progress', 'Completed', 'On Hold')) DEFAULT 'Open',
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
  responsible TEXT NOT NULL,
  creation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  completion_date DATE,
  duration INTEGER, -- in days
  dependencies TEXT[], -- Task numbers that this task depends on
  details TEXT,
  links JSONB DEFAULT '{}',
  stakeholders TEXT[] DEFAULT '{}',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create follow_ups table
CREATE TABLE public.follow_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS SETOF public.profiles
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.profiles WHERE user_id = auth.uid();
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (owner_id = auth.uid());

-- RLS Policies for tasks
CREATE POLICY "Users can view their own tasks" 
ON public.tasks 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tasks" 
ON public.tasks 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tasks" 
ON public.tasks 
FOR DELETE 
USING (user_id = auth.uid());

-- RLS Policies for follow_ups
CREATE POLICY "Users can view follow-ups for their tasks" 
ON public.follow_ups 
FOR SELECT 
USING (task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid()));

CREATE POLICY "Users can create follow-ups for their tasks" 
ON public.follow_ups 
FOR INSERT 
WITH CHECK (task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid()));

CREATE POLICY "Users can update follow-ups for their tasks" 
ON public.follow_ups 
FOR UPDATE 
USING (task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete follow-ups for their tasks" 
ON public.follow_ups 
FOR DELETE 
USING (task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid()));

-- RLS Policies for comments
CREATE POLICY "Users can view comments for their tasks" 
ON public.comments 
FOR SELECT 
USING (task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid()));

CREATE POLICY "Users can create comments for their tasks" 
ON public.comments 
FOR INSERT 
WITH CHECK (task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid()));

CREATE POLICY "Users can update comments for their tasks" 
ON public.comments 
FOR UPDATE 
USING (task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete comments for their tasks" 
ON public.comments 
FOR DELETE 
USING (task_id IN (SELECT id FROM public.tasks WHERE user_id = auth.uid()));

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to automatically generate task numbers
CREATE OR REPLACE FUNCTION public.generate_task_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get the next task number for this user
  SELECT COALESCE(MAX(CAST(SUBSTRING(task_number FROM 2) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.tasks
  WHERE user_id = NEW.user_id;
  
  NEW.task_number := 'T' || next_number::TEXT;
  RETURN NEW;
END;
$$;

-- Create trigger for automatic task numbering
CREATE TRIGGER generate_task_number_trigger
  BEFORE INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.generate_task_number();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();