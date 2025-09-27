import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  FileText, 
  FolderOpen, 
  Clock, 
  MessageSquare, 
  StickyNote,
  Calendar,
  User,
  Building2,
  Timer,
  ExternalLink
} from "lucide-react";
import { useGlobalSearch, SearchResult } from "@/hooks/useGlobalSearch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResultSelect?: (result: SearchResult) => void;
}

export const GlobalSearchDialog: React.FC<GlobalSearchDialogProps> = ({ 
  open, 
  onOpenChange,
  onResultSelect 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const { performGlobalSearch, isLoading, error } = useGlobalSearch();

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const results = await performGlobalSearch(searchTerm.trim());
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    }
  }, [searchTerm, performGlobalSearch]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [handleSearch]);

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'task': return <FileText className="w-4 h-4" />;
      case 'project': return <FolderOpen className="w-4 h-4" />;
      case 'time_entry': return <Clock className="w-4 h-4" />;
      case 'follow_up': return <MessageSquare className="w-4 h-4" />;
      case 'note': return <StickyNote className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getResultBadgeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'task': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'project': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'time_entry': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'follow_up': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'note': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultSelect) {
      onResultSelect(result);
    }
    onOpenChange(false);
  };

  const formatResultMetadata = (result: SearchResult) => {
    const metadata = result.metadata;
    const items = [];

    switch (result.type) {
      case 'task':
        if (metadata.responsible) items.push(<><User className="w-3 h-3" />{metadata.responsible}</>);
        if (metadata.dueDate) items.push(<><Calendar className="w-3 h-3" />{new Date(metadata.dueDate).toLocaleDateString()}</>);
        if (metadata.status) items.push(<Badge variant="outline" className="text-xs">{metadata.status}</Badge>);
        break;
      case 'project':
        if (metadata.owner) items.push(<><User className="w-3 h-3" />{metadata.owner}</>);
        if (metadata.status) items.push(<Badge variant="outline" className="text-xs">{metadata.status}</Badge>);
        break;
      case 'time_entry':
        if (metadata.duration) items.push(<><Timer className="w-3 h-3" />{Math.round(metadata.duration / 60)}h</>);
        if (metadata.projectName) items.push(<><Building2 className="w-3 h-3" />{metadata.projectName}</>);
        break;
      case 'follow_up':
        if (metadata.createdAt) items.push(<><Calendar className="w-3 h-3" />{new Date(metadata.createdAt).toLocaleDateString()}</>);
        break;
      case 'note':
        if (metadata.updatedAt) items.push(<><Calendar className="w-3 h-3" />{new Date(metadata.updatedAt).toLocaleDateString()}</>);
        break;
    }

    return items;
  };

  const ResultItem: React.FC<{ result: SearchResult }> = ({ result }) => (
    <div 
      className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border last:border-b-0 transition-colors"
      onClick={() => handleResultClick(result)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getResultIcon(result.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm text-foreground truncate">
              {result.title}
            </h4>
            <Badge 
              variant="secondary" 
              className={cn("text-xs capitalize", getResultBadgeColor(result.type))}
            >
              {result.type.replace('_', ' ')}
            </Badge>
          </div>
          {result.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {result.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {formatResultMetadata(result).map((item, index) => (
              <div key={index} className="flex items-center gap-1">
                {item}
              </div>
            ))}
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Global Search
          </DialogTitle>
          <DialogDescription>
            Search across tasks, projects, time entries, follow-ups, and notes
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search everything..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
            />
          </div>
        </div>

        <Separator />

        <ScrollArea className="max-h-[50vh]">
          {isLoading && (
            <div className="p-6 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              Searching...
            </div>
          )}

          {error && (
            <div className="p-6 text-center text-red-500">
              Error: {error}
            </div>
          )}

          {searchResults && !isLoading && (
            <>
              {searchResults.totalCount === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  No results found for "{searchTerm}"
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {/* Show results by type */}
                  {searchResults.resultsByType.tasks.length > 0 && (
                    <>
                      <div className="px-6 py-3 bg-muted/30">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <FileText className="w-4 h-4" />
                          Tasks ({searchResults.resultsByType.tasks.length})
                        </div>
                      </div>
                      {searchResults.resultsByType.tasks.slice(0, 5).map((result: SearchResult) => (
                        <ResultItem key={result.id} result={result} />
                      ))}
                    </>
                  )}

                  {searchResults.resultsByType.projects.length > 0 && (
                    <>
                      <div className="px-6 py-3 bg-muted/30">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <FolderOpen className="w-4 h-4" />
                          Projects ({searchResults.resultsByType.projects.length})
                        </div>
                      </div>
                      {searchResults.resultsByType.projects.slice(0, 5).map((result: SearchResult) => (
                        <ResultItem key={result.id} result={result} />
                      ))}
                    </>
                  )}

                  {searchResults.resultsByType.timeEntries.length > 0 && (
                    <>
                      <div className="px-6 py-3 bg-muted/30">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          Time Entries ({searchResults.resultsByType.timeEntries.length})
                        </div>
                      </div>
                      {searchResults.resultsByType.timeEntries.slice(0, 3).map((result: SearchResult) => (
                        <ResultItem key={result.id} result={result} />
                      ))}
                    </>
                  )}

                  {searchResults.resultsByType.followUps.length > 0 && (
                    <>
                      <div className="px-6 py-3 bg-muted/30">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <MessageSquare className="w-4 h-4" />
                          Follow-ups ({searchResults.resultsByType.followUps.length})
                        </div>
                      </div>
                      {searchResults.resultsByType.followUps.slice(0, 3).map((result: SearchResult) => (
                        <ResultItem key={result.id} result={result} />
                      ))}
                    </>
                  )}

                  {searchResults.resultsByType.notes.length > 0 && (
                    <>
                      <div className="px-6 py-3 bg-muted/30">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <StickyNote className="w-4 h-4" />
                          Notes ({searchResults.resultsByType.notes.length})
                        </div>
                      </div>
                      {searchResults.resultsByType.notes.slice(0, 3).map((result: SearchResult) => (
                        <ResultItem key={result.id} result={result} />
                      ))}
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {!searchTerm.trim() && !isLoading && (
            <div className="p-6 text-center text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
              Start typing to search across all your data
            </div>
          )}
        </ScrollArea>

        {searchResults && searchResults.totalCount > 0 && (
          <div className="px-6 py-3 border-t border-border bg-muted/30">
            <div className="text-xs text-muted-foreground text-center">
              Showing top results • {searchResults.totalCount} total matches found
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};