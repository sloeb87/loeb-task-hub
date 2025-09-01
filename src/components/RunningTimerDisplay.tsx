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
  const [forceUpdate, setForceUpdate] = useState(0);
  
  console.log('🔍 RunningTimerDisplay RENDERED - tasks:', tasks.length, 'taskTimers size:', taskTimers?.size || 0);

  // Listen for timer changes from other components
  useEffect(() => {
    const handleTimerUpdate = () => {
      console.log('🔔 RunningTimerDisplay - Timer state change event received, forcing update');
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('timerStateChanged', handleTimerUpdate);
    return () => window.removeEventListener('timerStateChanged', handleTimerUpdate);
  }, []);

  // Also listen for changes in taskTimers directly
  useEffect(() => {
    console.log('🔄 RunningTimerDisplay - taskTimers changed, size:', taskTimers.size);
    setForceUpdate(prev => prev + 1);
  }, [taskTimers]);

  // Find the currently running task
  const NON_PROJECT_TASK_ID = 'non_project_time';
  const NON_PROJECT_TASK_TITLE = 'Non-Project-Task';
  const NON_PROJECT_PROJECT_NAME = 'Non Project';

  const runningTaskData = React.useMemo(() => {
    console.log('🔍 TIMER CHECK - All timers:', Array.from(taskTimers.entries()).map(([id, data]) => ({ id, isRunning: data.isRunning, title: tasks.find(t => t.id === id)?.title || 'Unknown' })));
    
    const runningTimerEntry = Array.from(taskTimers.entries()).find(([_, data]) => data.isRunning);
    
    if (!runningTimerEntry) {
      console.log('🔍 TIMER CHECK - No running timer found');
      return null;
    }

    console.log('🔍 TIMER CHECK - Found running timer:', runningTimerEntry[0], 'isRunning:', runningTimerEntry[1].isRunning);
    const [taskId, timerData] = runningTimerEntry;
    const task = tasks.find(task => task.id === taskId);
    
    if (task) {
      console.log('🔍 TIMER CHECK - Found matching task:', task.title, 'for taskId:', taskId);
      return { task, timerData, isNonProject: false };
    }

    if (taskId === NON_PROJECT_TASK_ID) {
      console.log('🔍 TIMER CHECK - Non-project task timer running');
      const syntheticTask = {
        id: NON_PROJECT_TASK_ID,
        title: NON_PROJECT_TASK_TITLE,
        project: NON_PROJECT_PROJECT_NAME,
      } as Task;
      return { task: syntheticTask, timerData, isNonProject: true };
    }

    console.log('🔍 TIMER CHECK - Timer found but no matching task, taskId:', taskId);
    return null;
  }, [taskTimers, tasks.length, forceUpdate]);

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
    console.log('RunningTimerDisplay - No running task data, not rendering');
    return null;
  }

  console.log('RunningTimerDisplay - Rendering timer for:', runningTaskData.task.title);

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
          <span className="text-sm font-semibold text-green-600 dark:text-green-400 truncate max-w-48 leading-tight">
            {runningTaskData.task.title}
          </span>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-green-600/80 dark:text-green-400/80 truncate">
              {runningTaskData.task.project} • {runningTaskData.task.id}
            </span>
            {currentDuration && (
              <>
                <span className="text-green-500">•</span>
                <span className="font-mono font-bold text-green-500">
                  {currentDuration}
                </span>
              </>
            )}
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