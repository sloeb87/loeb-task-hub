import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Clock, Repeat, FolderOpen, Mail, FileText, ExternalLink } from "lucide-react";
import { Task } from "@/types/task";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { useRecurringTaskTime } from "@/hooks/useRecurringTaskTime";
import { formatTime } from "@/utils/taskOperations";

interface TimeTrackingCellProps {
  task: Task;
  onTimerToggle: (task: Task, e: React.MouseEvent) => void;
  onLinkClick: (url: string, e: React.MouseEvent) => void;
}

export const TimeTrackingCell: React.FC<TimeTrackingCellProps> = ({
  task,
  onTimerToggle,
  onLinkClick
}) => {
  const { getTaskTime } = useTimeTracking();
  const { getRecurringTaskTime } = useRecurringTaskTime();
  const taskTime = getTaskTime(task.id);
  
  const [recurringTimeData, setRecurringTimeData] = useState<{totalTime: number, taskIds: string[]}>({
    totalTime: taskTime.totalTime, 
    taskIds: []
  });

  useEffect(() => {
    if (task.isRecurring || task.parentTaskId) {
      getRecurringTaskTime(task.id, task.parentTaskId, task.isRecurring).then(data => {
        setRecurringTimeData(data);
      });
    }
  }, [task.id, task.parentTaskId, task.isRecurring, taskTime.totalTime, getRecurringTaskTime]);

  const totalRecurringTime = (task.isRecurring || task.parentTaskId) ? recurringTimeData.totalTime : taskTime.totalTime;

  return (
    <div className="space-y-2">
      {/* Time Tracking Controls */}
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant={taskTime.isRunning ? "destructive" : "outline"}
          onClick={(e) => onTimerToggle(task, e)}
          className="h-7 w-7 p-0"
          title={taskTime.isRunning ? "Stop Timer" : "Start Timer"}
        >
          {taskTime.isRunning ? (
            <Pause className="w-3 h-3" />
          ) : (
            <Play className="w-3 h-3" />
          )}
        </Button>
        {taskTime.isRunning && (
          <div className="flex items-center text-red-600 dark:text-red-400">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-1"></div>
            <span className="text-sm font-medium">Live</span>
          </div>
        )}
      </div>
      {totalRecurringTime > 0 && (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-3 h-3 mr-1" />
          <span>{formatTime(totalRecurringTime)}</span>
          {(task.isRecurring || task.parentTaskId) && totalRecurringTime !== taskTime.totalTime && (
            <div title="Total time across all recurring instances">
              <Repeat className="w-3 h-3 ml-1 text-blue-500" />
            </div>
          )}
        </div>
      )}
      
      {/* Task Link Icons */}
      {task.links && Object.values(task.links).some(link => link) && (
        <div className="flex items-center space-x-1">
          {task.links.folder && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="p-1 h-6 w-6 hover:bg-blue-100 dark:hover:bg-blue-900"
              onClick={(e) => onLinkClick(task.links.folder!, e)}
              title="Open Folder"
            >
              <FolderOpen className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            </Button>
          )}
          {task.links.email && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="p-1 h-6 w-6 hover:bg-green-100 dark:hover:bg-green-900"
              onClick={(e) => onLinkClick(`mailto:${task.links.email}`, e)}
              title="Send Email"
            >
              <Mail className="w-3 h-3 text-green-600 dark:text-green-400" />
            </Button>
          )}
          {task.links.file && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="p-1 h-6 w-6 hover:bg-purple-100 dark:hover:bg-purple-900"
              onClick={(e) => onLinkClick(task.links.file!, e)}
              title="Open File"
            >
              <FileText className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            </Button>
          )}
          {task.links.oneNote && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="p-1 h-6 w-6 hover:bg-orange-100 dark:hover:bg-orange-900"
              onClick={(e) => onLinkClick(task.links.oneNote!, e)}
              title="Open OneNote"
            >
              <ExternalLink className="w-3 h-3 text-orange-600 dark:text-orange-400" />
            </Button>
          )}
          {task.links.teams && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="p-1 h-6 w-6 hover:bg-indigo-100 dark:hover:bg-indigo-900"
              onClick={(e) => onLinkClick(task.links.teams!, e)}
              title="Open Teams"
            >
              <ExternalLink className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};