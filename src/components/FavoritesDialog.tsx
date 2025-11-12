import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types/task";
import { Star, Calendar, User, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { useScopeColor } from '@/hooks/useParameterColors';

interface FavoritesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteTasks: Task[];
  onTaskClick: (task: Task) => void;
  onToggleFavorite: (task: Task) => void;
}

export const FavoritesDialog: React.FC<FavoritesDialogProps> = ({
  isOpen,
  onClose,
  favoriteTasks,
  onTaskClick,
  onToggleFavorite
}) => {
  const { getScopeStyle } = useScopeColor();
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-star fill-star" />
            Favorite Tasks ({favoriteTasks.length})
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-2">
          {favoriteTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No favorite tasks yet.</p>
              <p className="text-sm">Mark tasks as favorites to see them here.</p>
            </div>
          ) : (
            favoriteTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onTaskClick(task)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {task.id}
                      </Badge>
                      
                      {/* Scope badges with colors */}
                      {task.scope && task.scope.length > 0 && (
                        <div className="flex gap-1">
                          {task.scope.map((scope, index) => (
                            <Badge 
                              key={index}
                              className="text-xs font-medium"
                              style={getScopeStyle(scope)}
                            >
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <Badge
                        variant={
                          task.status === 'Completed' ? 'default' :
                          task.status === 'In Progress' ? 'secondary' :
                          task.status === 'On Hold' ? 'destructive' : 'outline'
                        }
                        className="text-xs"
                      >
                        {task.status}
                      </Badge>
                      <Badge
                        variant={
                          task.priority === 'Critical' ? 'destructive' :
                          task.priority === 'High' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold text-foreground hover:text-primary">
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {task.project && (
                        <div className="flex items-center gap-1">
                          <FolderOpen className="w-3 h-3" />
                          <span>{task.project}</span>
                        </div>
                      )}
                      {task.responsible && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{task.responsible}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Star 
                    className="w-5 h-5 text-star fill-star flex-shrink-0 mt-1 cursor-pointer hover:scale-110 transition-transform" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(task);
                      onTaskClick(task);
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};