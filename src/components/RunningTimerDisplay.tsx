import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Pause } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { useTaskNavigation } from "@/contexts/TaskFormContext";
import { Task } from "@/types/task";

interface RunningTimerDisplayProps {
  tasks: Task[];
  className?: string;
}

export const RunningTimerDisplay = ({ tasks, className = "" }: RunningTimerDisplayProps) => {
  const { taskTimers, stopTimer } = useTimeTracking();
  const { navigateToTaskEdit } = useTaskNavigation();  
  const [currentDuration, setCurrentDuration] = useState<string>("");

  // Debug logging
  React.useEffect(() => {
    console.log('RunningTimerDisplay - taskTimers:', taskTimers);
    console.log('RunningTimerDisplay - tasks count:', tasks.length);
    const runningEntries = Array.from(taskTimers.entries()).filter(([_, data]) => data.isRunning);
    console.log('RunningTimerDisplay - running timers:', runningEntries);
  }, [taskTimers, tasks]);

  // Find the currently running task
  const NON_PROJECT_TASK_ID = 'non_project_time';
  const NON_PROJECT_TASK_TITLE = 'Non-Project-Task';
  const NON_PROJECT_PROJECT_NAME = 'Non Project';

  const runningTaskData = React.useMemo(() => {
    const runningTimerEntry = Array.from(taskTimers.entries()).find(([_, data]) => data.isRunning);
    
    if (!runningTimerEntry) {
      return null;
    }

    const [taskId, timerData] = runningTimerEntry;
    const task = tasks.find(task => task.id === taskId);
    
    if (task) {
      return { task, timerData, isNonProject: false };
    }

    if (taskId === NON_PROJECT_TASK_ID) {
      const syntheticTask = {
        id: NON_PROJECT_TASK_ID,
        title: NON_PROJECT_TASK_TITLE,
        project: NON_PROJECT_PROJECT_NAME,
      } as Task;
      return { task: syntheticTask, timerData, isNonProject: true };
    }

    return null;
  }, [taskTimers, tasks]);

  // Update duration display every second
  useEffect(() => {
    if (!runningTaskData?.timerData.currentSessionStart) {
      setCurrentDuration("");
      return;
    }

    const updateDuration = () => {
      const startTime = new Date(runningTaskData.timerData.currentSessionStart!);
      const now = new Date();
      const diffMs = now.getTime() - startTime.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setCurrentDuration(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setCurrentDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [runningTaskData?.timerData.currentSessionStart]);

  if (!runningTaskData) {
    return null;
  }

  const handleStopTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopTimer(runningTaskData.task.id);
  };

  const handleTimerClick = () => {
    if (runningTaskData?.isNonProject) return; // Non-Project synthetic task is not editable
    navigateToTaskEdit(runningTaskData.task.project, runningTaskData.task, 'runningTimer');
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div 
        className="flex items-center space-x-3 h-12 px-4 cursor-pointer transition-all duration-300 group"
        onClick={handleTimerClick}
        title="Click to edit task"
      >
        {/* Status indicator */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-timer-accent rounded-full animate-pulse"></div>
          <Clock className="w-4 h-4 text-timer-text" />
        </div>
        
        {/* Task info */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center space-x-2 text-sm font-semibold text-green-600 dark:text-green-400">
            <span className="truncate max-w-48">
              {runningTaskData.task.id}_{runningTaskData.task.title}
            </span>
            {currentDuration && (
              <span className="font-mono text-green-500">
                {currentDuration}
              </span>
            )}
          </div>
          <div className="text-xs text-green-600/80 dark:text-green-400/80 truncate">
            {runningTaskData.task.project}
          </div>
        </div>
        
        {/* Stop button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handleStopTimer}
          className="h-8 w-8 p-0 text-timer-text hover:text-timer-accent hover:bg-timer-border/10 transition-all duration-200"
          title="Stop Timer"
        >
          <Pause className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};