-- Create notes table for quick notes
CREATE TABLE public.notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create policies for notes
CREATE POLICY "Users can view their own notes"
ON public.notes
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own notes"
ON public.notes
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notes"
ON public.notes
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notes"
ON public.notes
FOR DELETE
USING (user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();