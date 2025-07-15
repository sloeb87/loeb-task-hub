-- Create parameters table for storing user-configurable parameters
CREATE TABLE public.parameters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('scopes', 'environments', 'taskTypes', 'statuses', 'priorities')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.parameters ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own parameters" 
ON public.parameters 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own parameters" 
ON public.parameters 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own parameters" 
ON public.parameters 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own parameters" 
ON public.parameters 
FOR DELETE 
USING (user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_parameters_updated_at
BEFORE UPDATE ON public.parameters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();