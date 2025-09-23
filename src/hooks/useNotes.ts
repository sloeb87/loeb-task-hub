import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useNotes() {
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Load existing note or create new one
  const loadNote = useCallback(async () => {
    if (!user || !isAuthenticated) return;

    try {
      setIsLoading(true);
      
      // Try to get existing note
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        throw error;
      }

      if (data) {
        setNote(data);
      } else {
        // Create a new note if none exists
        const { data: newNote, error: createError } = await supabase
          .from('notes')
          .insert({
            user_id: user.id,
            content: ''
          })
          .select()
          .single();

        if (createError) throw createError;
        setNote(newNote);
      }
    } catch (error) {
      console.error('Failed to load note:', error);
      toast({
        title: 'Failed to load notes',
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated, toast]);

  // Save note with debouncing
  const saveNote = useCallback(async (content: string) => {
    if (!user || !note) return;

    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('notes')
        .update({ content })
        .eq('id', note.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setNote(prev => prev ? { ...prev, content, updated_at: new Date().toISOString() } : null);
    } catch (error) {
      console.error('Failed to save note:', error);
      toast({
        title: 'Failed to save note',
        description: 'Your changes may not be saved.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }, [user, note, toast]);

  // Load note on mount
  useEffect(() => {
    loadNote();
  }, [loadNote]);

  return {
    note,
    isLoading,
    isSaving,
    saveNote,
    refreshNote: loadNote
  };
}