import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotes } from '@/hooks/useNotes';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, Clock } from 'lucide-react';

const Notes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { note, isLoading, isSaving, saveNote, emergencySave } = useNotes();
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update content when note is loaded
  useEffect(() => {
    if (note) {
      setContent(note.content);
      setLastSaved(note.updated_at);
    }
  }, [note]);

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(note ? newContent !== note.content : false);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (hasUnsavedChanges && content && note) {
        saveNote(content, true);
        setLastSaved(new Date().toISOString());
        setHasUnsavedChanges(false);
      }
    }
  };

  // Periodic safety save every 10 seconds if there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges || !content || !note) return;

    const interval = setInterval(() => {
      if (hasUnsavedChanges && content && note) {
        console.log('Periodic safety save triggered');
        emergencySave(content);
        setHasUnsavedChanges(false);
        setLastSaved(new Date().toISOString());
      }
    }, 10000); // Save every 10 seconds

    return () => clearInterval(interval);
  }, [hasUnsavedChanges, content, note, emergencySave]);

  // Intercept navigation and save before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && content && note) {
        console.log('Saving before page unload');
        // Use sendBeacon for reliability during page unload
        const data = JSON.stringify({ content });
        const url = `https://emjtsxfjrprcrssuvbat.supabase.co/rest/v1/notes?id=eq.${note.id}&user_id=eq.${user.id}`;
        
        if (navigator.sendBeacon) {
          const headers = {
            type: 'application/json'
          };
          navigator.sendBeacon(url, new Blob([data], headers));
        }
        
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, content, note]);

  // Save on page visibility change (when user switches apps/tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges && content && note) {
        console.log('Saving due to visibility change');
        emergencySave(content);
        setHasUnsavedChanges(false);
      }
    };

    const handleWindowBlur = () => {
      if (hasUnsavedChanges && content && note) {
        console.log('Saving due to window blur');
        emergencySave(content);
        setHasUnsavedChanges(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [hasUnsavedChanges, content, note, emergencySave]);

  // Save when component unmounts (navigation away from notes)
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && content && note) {
        console.log('Saving due to component unmount');
        // Use synchronous approach for unmount
        const data = JSON.stringify({ content });
        const url = `https://emjtsxfjrprcrssuvbat.supabase.co/rest/v1/notes?id=eq.${note.id}&user_id=eq.${user.id}`;
        
        // Try sendBeacon first
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }));
        } else {
          // Fallback to synchronous fetch
          fetch(url, {
            method: 'PATCH',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtanRzeGZqcnByY3Jzc3V2YmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MDM4MTAsImV4cCI6MjA2ODE3OTgxMH0.uOZTnz5FyObUEzH6w6m3j2faA-RspxqwDopIypUWAzQ',
              'content-type': 'application/json',
              'content-profile': 'public'
            },
            body: data,
            keepalive: true
          }).catch(console.error);
        }
      }
    };
  }, [hasUnsavedChanges, content, note]);

  // SEO
  useEffect(() => {
    document.title = "Quick Notes | Task Tracker";
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'Quick notes for your thoughts and ideas.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(meta);
    }
  }, []);

  const formatLastSaved = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="w-full p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Loading your notes...</h1>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full p-4">
        <div className="max-w-6xl mx-auto h-full">
          <Card className="border-0 shadow-lg h-[calc(100vh-2rem)] flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-foreground">
                  Quick Notes
                </CardTitle>
                <div className="flex items-center space-x-3">
                  {hasUnsavedChanges && !isSaving && (
                    <Badge variant="outline" className="flex items-center space-x-1 text-amber-600 border-amber-600">
                      <span className="w-2 h-2 bg-amber-600 rounded-full animate-pulse"></span>
                      <span>Unsaved changes</span>
                    </Badge>
                  )}
                  {isSaving && (
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Save className="w-3 h-3 animate-pulse" />
                      <span>Saving...</span>
                    </Badge>
                  )}
                  {lastSaved && !isSaving && !hasUnsavedChanges && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Saved {formatLastSaved(lastSaved)}</span>
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground">
                Write your thoughts, ideas, and quick notes here. Press Ctrl+S (or Cmd+S) to save manually. Auto-saves every 10 seconds and when switching pages/apps.
              </p>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col">
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Start writing your notes here..."
                className="min-h-[calc(100vh-12rem)] flex-1 text-base leading-relaxed resize-none border-0 p-6 focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{ 
                  fontSize: '16px',
                  lineHeight: '1.6',
                  fontFamily: 'inherit'
                }}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Notes;