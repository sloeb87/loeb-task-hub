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
  const runningTaskData = React.useMemo(() => {
    const runningTimerEntry = Array.from(taskTimers.entries()).find(([_, data]) => data.isRunning);
    if (!runningTimerEntry) return null;

    const [taskId, timerData] = runningTimerEntry;
    const task = tasks.find(task => task.id === taskId);
    return task ? { task, timerData } : null;
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
    openTaskForm(runningTaskData.task.project, runningTaskData.task, 'runningTimer');
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div 
        className="flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        onClick={handleTimerClick}
        title="Click to edit task"
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-red-800 dark:text-red-200 truncate max-w-48">
            {runningTaskData.task.title}
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-red-600 dark:text-red-400">
              {runningTaskData.task.project} • {runningTaskData.task.id}
            </span>
            {currentDuration && (
              <>
                <span className="text-xs text-red-500 dark:text-red-400">•</span>
                <span className="text-xs font-mono font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-800/30 px-1.5 py-0.5 rounded">
                  {currentDuration}
                </span>
              </>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleStopTimer}
          className="h-8 w-8 p-0 border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-800"
          title="Stop Timer"
        >
          <Pause className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};