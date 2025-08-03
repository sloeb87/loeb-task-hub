import React from 'react';
import { useScopeColor } from '@/hooks/useScopeColor';
import { useTaskTypeColor } from '@/hooks/useTaskTypeColor';
import { useEnvironmentColor } from '@/hooks/useEnvironmentColor';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, FolderOpen, MessageSquarePlus, Clock, Play, Pause, Square } from "lucide-react";
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

  return (
    <Card className="w-full hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate text-gray-900 dark:text-white">
              {task.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {task.id}
            </p>
          </div>
          <div className="flex flex-wrap gap-1 ml-2">
            <Badge className={`${getStatusColor(task.status)} text-xs px-2 py-0.5`}>
              {task.status}
            </Badge>
            <Badge className={`${getPriorityColor(task.priority)} text-xs px-2 py-0.5`}>
              {task.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Project and Scope */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <FolderOpen className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{task.project}</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <span className="w-3 h-3 mr-1 flex-shrink-0 bg-blue-500 rounded-full"></span>
            <Badge 
              className="text-xs border"
              style={getScopeStyle(task.scope)}
            >
              {task.scope}
            </Badge>
          </div>
        </div>

        {/* Task Type and Environment */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center">
            <Badge 
              className="text-xs border"
              style={getTaskTypeStyle(task.taskType)}
            >
              {task.taskType}
            </Badge>
          </div>
          <div className="flex items-center">
            <Badge 
              className="text-xs border"
              style={getEnvironmentStyle(task.environment)}
            >
              {task.environment}
            </Badge>
          </div>
        </div>

        {/* Responsible and Due Date */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <User className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{task.responsible}</span>
          </div>
          <div className={`flex items-center ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
            <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{task.dueDate}</span>
          </div>
        </div>

        {/* Time Tracking */}
        {(onStartTimer || onStopTimer || timeSpent > 0) && (
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
              <Clock className="w-3 h-3 mr-1" />
              <span>{formatTime(timeSpent)}</span>
              {isTimerRunning && (
                <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <div className="flex gap-1">
              {!isTimerRunning ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStartTimer?.(task.id)}
                  className="h-6 px-2 text-xs"
                >
                  <Play className="w-3 h-3" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStopTimer?.(task.id)}
                  className="h-6 px-2 text-xs"
                >
                  <Pause className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditTask(task)}
            className="flex-1 text-xs h-8"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onFollowUp(task)}
            className="flex-1 text-xs h-8"
          >
            <MessageSquarePlus className="w-3 h-3 mr-1" />
            Follow-up
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};