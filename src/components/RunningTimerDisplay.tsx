import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Pause } from 'lucide-react';
import { Button } from "@/components/ui/button";
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

  // Find the currently running task
  const runningTaskData = useMemo(() => {
    if (!taskTimers || taskTimers.size === 0) {
      return null;
    }

    const runningTimerEntry = Array.from(taskTimers.entries()).find(([_, data]) => data.isRunning);
    
    if (!runningTimerEntry) {
      return null;
    }

    const [taskId, timerData] = runningTimerEntry;
    
    // Handle non-project task
    if (taskId === 'non_project_time') {
      const syntheticTask = {
        id: 'non_project_time',
        title: 'Non-Project Time',
        project: 'Non Project',
      } as Task;
      return { task: syntheticTask, timerData, isNonProject: true };
    }

    // Find task in tasks array
    const task = tasks?.find(task => task.id === taskId);
    if (task) {
      return { task, timerData, isNonProject: false };
    }

    // If task not found but timer is running, create a placeholder
    if (timerData.isRunning) {
      const placeholderTask = {
        id: taskId,
        title: `Task ${taskId}`,
        project: 'Unknown Project',
      } as Task;
      return { task: placeholderTask, timerData, isNonProject: false };
    }

    return null;
  }, [taskTimers, tasks]);

  // Update duration display every second
  useEffect(() => {
    if (!runningTaskData?.timerData?.currentSessionStart) {
      setCurrentDuration("");
      return;
    }

    const updateDuration = () => {
      try {
        const startTime = new Date(runningTaskData.timerData.currentSessionStart!);
        const now = new Date();
        const diffMs = now.getTime() - startTime.getTime();
        
        if (diffMs < 0) {
          setCurrentDuration("0:00");
          return;
        }
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        if (hours > 0) {
          setCurrentDuration(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setCurrentDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      } catch (error) {
        console.error('Error updating timer duration:', error);
        setCurrentDuration("0:00");
      }
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [runningTaskData?.timerData?.currentSessionStart]);

  if (!runningTaskData) {
    return null;
  }

  const handleStopTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (runningTaskData?.task?.id) {
      stopTimer(runningTaskData.task.id);
    }
  };

  const handleTimerClick = () => {
    if (runningTaskData?.isNonProject || !runningTaskData?.task) return;
    try {
      navigateToTaskEdit(runningTaskData.task.project, runningTaskData.task, 'runningTimer');
    } catch (error) {
      console.error('Error navigating to task edit:', error);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div 
        className="flex items-center space-x-2 h-10 px-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200"
        onClick={handleTimerClick}
        title={runningTaskData.isNonProject ? "Non-project time tracking" : "Click to edit task"}
      >
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-green-700 dark:text-green-300 truncate max-w-32">
            {runningTaskData.task.title}
          </span>
          {currentDuration && (
            <span className="text-xs font-mono font-bold text-green-600 dark:text-green-400">
              {currentDuration}
            </span>
          )}
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleStopTimer}
          className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-200 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-800/50"
          title="Stop Timer"
        >
          <Pause className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};