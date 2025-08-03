import React from 'react';
import { Clock, Pause } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { Task } from "@/types/task";

interface RunningTimerDisplayProps {
  tasks: Task[];
  className?: string;
}

export const RunningTimerDisplay = ({ tasks, className = "" }: RunningTimerDisplayProps) => {
  const { taskTimers, stopTimer } = useTimeTracking();

  // Find the currently running task
  const runningTask = React.useMemo(() => {
    const runningTimerEntry = Array.from(taskTimers.entries()).find(([_, data]) => data.isRunning);
    if (!runningTimerEntry) return null;

    const [taskId] = runningTimerEntry;
    return tasks.find(task => task.id === taskId);
  }, [taskTimers, tasks]);

  if (!runningTask) return null;

  const handleStopTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopTimer(runningTask.id);
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span className="text-sm font-medium text-red-700 dark:text-red-300">Timer Running:</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-red-800 dark:text-red-200 truncate max-w-48">
            {runningTask.title}
          </span>
          <span className="text-xs text-red-600 dark:text-red-400">
            {runningTask.project} • {runningTask.id}
          </span>
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