import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotes } from '@/hooks/useNotes';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, Clock } from 'lucide-react';

const Notes = () => {
  const location = useLocation();
  const { note, isLoading, isSaving, saveNote, emergencySave } = useNotes();
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousLocationRef = useRef(location.pathname);

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

  // Save on navigation within the app
  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = previousLocationRef.current;
    
    // If the route changed and we're leaving the notes page, save
    if (previousPath === '/notes' && currentPath !== '/notes' && hasUnsavedChanges && content && note) {
      emergencySave(content);
      setHasUnsavedChanges(false);
    }
    
    // Update the previous location reference
    previousLocationRef.current = currentPath;
  }, [location.pathname, hasUnsavedChanges, content, note, emergencySave]);

  // Save on page visibility change (when user switches apps/tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges && content && note) {
        // Save immediately when page becomes hidden
        emergencySave(content);
        setHasUnsavedChanges(false);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && content && note) {
        // Emergency save before page unload
        emergencySave(content);
        // Show warning to user
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handleWindowBlur = () => {
      if (hasUnsavedChanges && content && note) {
        // Save when window loses focus
        emergencySave(content);
        setHasUnsavedChanges(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [hasUnsavedChanges, content, note, emergencySave]);

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
                Write your thoughts, ideas, and quick notes here. Press Ctrl+S (or Cmd+S) to save manually, or notes save automatically when switching pages/apps.
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