-- Remove the author column from follow_ups table since we don't need to track who made the follow-up
ALTER TABLE public.follow_ups DROP COLUMN IF EXISTS author;