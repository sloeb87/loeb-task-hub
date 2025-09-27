import React, { useState, useEffect, useRef } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, Clock } from 'lucide-react';

const Notes = () => {
  const { note, isLoading, isSaving, saveNote } = useNotes();
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update content when note is loaded
  useEffect(() => {
    if (note) {
      setContent(note.content);
      setLastSaved(note.updated_at);
    }
  }, [note]);

  // Handle Enter key press to save immediately
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      // Clear any pending auto-save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save immediately
      saveNote(content);
      setLastSaved(new Date().toISOString());
    }
  };

  // Auto-save with debouncing
  useEffect(() => {
    if (note && content !== note.content) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save (500ms delay)
      saveTimeoutRef.current = setTimeout(() => {
        saveNote(content);
        setLastSaved(new Date().toISOString());
      }, 500);
    }

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, note, saveNote]);

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
                  {isSaving && (
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Save className="w-3 h-3 animate-pulse" />
                      <span>Saving...</span>
                    </Badge>
                  )}
                  {lastSaved && !isSaving && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Saved {formatLastSaved(lastSaved)}</span>
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground">
                Write your thoughts, ideas, and quick notes here. Press Enter to save immediately, or notes auto-save as you type.
              </p>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
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