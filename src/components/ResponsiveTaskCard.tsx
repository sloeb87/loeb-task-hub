import React from 'react';
import { useScopeColor, useTaskTypeColor, useEnvironmentColor } from '@/hooks/useParameterColors';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, FolderOpen, MessageSquarePlus, Clock, Play, Pause, Square, Mail, FileText, ExternalLink } from "lucide-react";
import { Task } from "@/types/task";

interface ResponsiveTaskCardProps {
  task: Task;
  onEditTask: (task: Task) => void;
  onFollowUp: (task: Task) => void;
  onStartTimer?: (taskId: string) => void;
  onStopTimer?: (taskId: string) => void;
  isTimerRunning?: boolean;
  timeSpent?: number;
}

export const ResponsiveTaskCard = ({ 
  task, 
  onEditTask, 
  onFollowUp,
  onStartTimer,
  onStopTimer,
  isTimerRunning = false,
  timeSpent = 0
}: ResponsiveTaskCardProps) => {
  const { getScopeStyle } = useScopeColor();
  const { getTaskTypeStyle } = useTaskTypeColor();
  const { getEnvironmentStyle } = useEnvironmentColor();
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100';
      case 'in progress': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-100';
      case 'on hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100';
      case 'open': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-100';
      case 'low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completed';

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <Card className="w-full mb-4 hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-base truncate text-foreground">
                {task.title}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          </div>
          <div className="flex flex-col gap-2 ml-3">
            <Badge className={`${getStatusColor(task.status)} text-xs px-2 py-1`}>
              {task.status}
            </Badge>
            <Badge className={`${getPriorityColor(task.priority)} text-xs px-2 py-1`}>
              {task.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Task Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <FolderOpen className="w-4 h-4 mr-2" />
              <span>Project</span>
            </div>
            <p className="text-sm font-medium text-foreground truncate">{task.project}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="w-4 h-4 mr-2" />
              <span>Responsible</span>
            </div>
            <p className="text-sm font-medium text-foreground truncate">{task.responsible}</p>
          </div>
        </div>

        {/* Badges Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              className="text-xs border"
              style={getScopeStyle(task.scope)}
            >
              {task.scope}
            </Badge>
            <Badge 
              className="text-xs border"
              style={getTaskTypeStyle(task.taskType)}
            >
              {task.taskType}
            </Badge>
            <Badge 
              className="text-xs border"
              style={getEnvironmentStyle(task.environment)}
            >
              {task.environment}
            </Badge>
          </div>
        </div>

        {/* Due Date and Time Tracking */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Due Date</span>
            </div>
            <p className={`text-sm font-medium ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
              {new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-2" />
              <span>Time Spent</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                {formatTime(timeSpent)}
              </p>
              {isTimerRunning && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
        </div>

        {/* Time Tracking Controls */}
        {(onStartTimer || onStopTimer) && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <span className="text-sm font-medium text-foreground">Timer Controls</span>
            <div className="flex gap-2">
              {!isTimerRunning ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStartTimer?.(task.id)}
                  className="h-8 px-3"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Start
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStopTimer?.(task.id)}
                  className="h-8 px-3"
                >
                  <Pause className="w-3 h-3 mr-1" />
                  Stop
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Task Links */}
        {task.links && Object.values(task.links).some(link => link) && (
          <div className="space-y-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <ExternalLink className="w-4 h-4 mr-2" />
              <span>Task Links</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {task.links.folder && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="justify-start h-auto py-2 px-3"
                  onClick={(e) => handleLinkClick(task.links.folder!, e)}
                >
                  <FolderOpen className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs">Folder</span>
                </Button>
              )}
              {task.links.email && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="justify-start h-auto py-2 px-3"
                  onClick={(e) => handleLinkClick(`mailto:${task.links.email}`, e)}
                >
                  <Mail className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                  <span className="text-xs">Email</span>
                </Button>
              )}
              {task.links.file && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="justify-start h-auto py-2 px-3"
                  onClick={(e) => handleLinkClick(task.links.file!, e)}
                >
                  <FileText className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs">File</span>
                </Button>
              )}
              {task.links.oneNote && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="justify-start h-auto py-2 px-3"
                  onClick={(e) => handleLinkClick(task.links.oneNote!, e)}
                >
                  <ExternalLink className="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" />
                  <span className="text-xs">OneNote</span>
                </Button>
              )}
              {task.links.teams && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="justify-start h-auto py-2 px-3"
                  onClick={(e) => handleLinkClick(task.links.teams!, e)}
                >
                  <ExternalLink className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs">Teams</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onEditTask(task)}
            className="flex-1"
          >
            Edit Task
          </Button>
          <Button
            variant="outline"
            onClick={() => onFollowUp(task)}
            className="flex-1"
          >
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            Follow-up
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};