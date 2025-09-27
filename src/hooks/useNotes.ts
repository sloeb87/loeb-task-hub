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

  // Save note with retry logic and immediate mode
  const saveNote = useCallback(async (content: string, immediate = false) => {
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
      
      // Show success toast only for immediate saves (not auto-saves)
      if (immediate) {
        toast({
          title: 'Note saved',
          description: 'Your changes have been saved.',
        });
      }
    } catch (error) {
      console.error('Failed to save note:', error);
      toast({
        title: 'Failed to save note',
        description: 'Your changes may not be saved. Retrying...',
        variant: 'destructive'
      });
      
      // Retry once after a short delay
      setTimeout(() => {
        saveNote(content, immediate);
      }, 1000);
    } finally {
      setIsSaving(false);
    }
  }, [user, note, toast]);

  // Emergency save function for page unload
  const emergencySave = useCallback(async (content: string) => {
    if (!user || !note || !content) return;

    try {
      // Use the regular supabase client with keepalive for emergency saves
      const { error } = await supabase
        .from('notes')
        .update({ content })
        .eq('id', note.id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Emergency save failed:', error);
      // Try one more time with a direct fetch approach
      try {
        const response = await fetch(`https://emjtsxfjrprcrssuvbat.supabase.co/rest/v1/notes?id=eq.${note.id}&user_id=eq.${user.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtanRzeGZqcnByY3Jzc3V2YmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MDM4MTAsImV4cCI6MjA2ODE3OTgxMH0.uOZTnz5FyObUEzH6w6m3j2faA-RspxqwDopIypUWAzQ',
            'authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'content-type': 'application/json',
            'content-profile': 'public'
          },
          body: JSON.stringify({ content }),
          keepalive: true
        });
      } catch (finalError) {
        console.error('Final emergency save attempt failed:', finalError);
      }
    }
  }, [user, note]);

  // Load note on mount
  useEffect(() => {
    loadNote();
  }, [loadNote]);

  return {
    note,
    isLoading,
    isSaving,
    saveNote,
    emergencySave,
    refreshNote: loadNote
  };
}