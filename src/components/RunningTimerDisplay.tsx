import React, { useState, useEffect } from 'react';
import { Clock, Pause } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { useTaskForm } from "@/contexts/TaskFormContext";
import { Task } from "@/types/task";

interface RunningTimerDisplayProps {
  tasks: Task[];
  className?: string;
}

export const RunningTimerDisplay = ({ tasks, className = "" }: RunningTimerDisplayProps) => {
  const { taskTimers, stopTimer } = useTimeTracking();
  const { openTaskForm } = useTaskForm();
  const [currentDuration, setCurrentDuration] = useState<string>("");

  // Find the currently running task
  const NON_PROJECT_TASK_ID = 'non_project_time';
  const NON_PROJECT_TASK_TITLE = 'Non-Project-Task';
  const NON_PROJECT_PROJECT_NAME = 'Non Project';

  const runningTaskData = React.useMemo(() => {
    const runningTimerEntry = Array.from(taskTimers.entries()).find(([_, data]) => data.isRunning);
    if (!runningTimerEntry) return null;

    const [taskId, timerData] = runningTimerEntry;
    const task = tasks.find(task => task.id === taskId);
    if (task) return { task, timerData, isNonProject: false };

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

  if (!runningTaskData) return null;

  const handleStopTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopTimer(runningTaskData.task.id);
  };

  const handleTimerClick = () => {
    if (runningTaskData?.isNonProject) return; // Non-Project synthetic task is not editable
    openTaskForm(runningTaskData.task.project, runningTaskData.task, 'runningTimer');
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div 
        className="relative flex items-center space-x-3 h-12 px-4 cursor-pointer transition-all duration-300 rounded-lg border border-timer-border/50 animate-timer-pulse overflow-hidden group"
        style={{ 
          background: 'var(--timer-bg)',
          boxShadow: 'var(--timer-glow)'
        }}
        onClick={handleTimerClick}
        title="Click to edit task"
      >
        {/* Animated background flow effect */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-timer-accent to-transparent animate-data-flow"></div>
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-timer-accent to-transparent animate-data-flow" style={{ animationDelay: '1s' }}></div>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center space-x-2 z-10">
          <div className="relative">
            <div className="w-2 h-2 bg-timer-accent rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-2 h-2 bg-timer-accent rounded-full animate-ping opacity-75"></div>
          </div>
          <Clock className="w-4 h-4 text-timer-text" />
        </div>
        
        {/* Task info */}
        <div className="flex flex-col min-w-0 flex-1 z-10">
          <span className="text-sm font-semibold text-timer-text truncate max-w-48 leading-tight">
            {runningTaskData.task.title}
          </span>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-timer-text/80 truncate">
              {runningTaskData.task.project} • {runningTaskData.task.id}
            </span>
            {currentDuration && (
              <>
                <span className="text-timer-accent">•</span>
                <span className="font-mono font-bold text-timer-accent bg-timer-border/20 px-2 py-0.5 rounded-md border border-timer-border/30">
                  {currentDuration}
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Stop button */}
        <Button
          size="sm"
          variant="outline"
          onClick={handleStopTimer}
          className="h-8 w-8 p-0 border-timer-border/50 hover:border-timer-border bg-transparent hover:bg-timer-border/10 text-timer-text hover:text-timer-accent transition-all duration-200 z-10"
          title="Stop Timer"
        >
          <Pause className="w-3 h-3" />
        </Button>
        
        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-timer-accent/5 to-timer-border/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
      </div>
    </div>
  );
};