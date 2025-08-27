import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Task } from "@/types/task";
import { ResponsiveTaskCard } from "./ResponsiveTaskCard";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { useTaskNavigation } from "@/contexts/TaskFormContext";

interface VirtualizedTaskTableProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onFollowUp: (task: Task) => void;
  height?: number;
  itemSize?: number;
}

interface ItemData {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onFollowUp: (task: Task) => void;
  startTimer: (taskId: string) => void;
  stopTimer: (taskId: string) => void;
  navigateToTaskEdit: (projectName?: string, task?: Task, contextKey?: string) => void;
}

const TaskItem = React.memo(({ index, style, data }: {
  index: number;
  style: React.CSSProperties;
  data: ItemData;
}) => {
  const { tasks, onEditTask, onFollowUp, startTimer, stopTimer, navigateToTaskEdit } = data;
  const task = tasks[index];

  if (!task) return null;

  return (
    <div style={style} className="px-4">
      <ResponsiveTaskCard
        task={task}
        onEditTask={onEditTask}
        onFollowUp={onFollowUp}
        onStartTimer={startTimer}
        onStopTimer={stopTimer}
      />
    </div>
  );
});

TaskItem.displayName = 'TaskItem';

export const VirtualizedTaskTable = React.memo(({ 
  tasks, 
  onEditTask, 
  onFollowUp, 
  height = 600, 
  itemSize = 200 
}: VirtualizedTaskTableProps) => {
  const { startTimer, stopTimer } = useTimeTracking();
  const { navigateToTaskEdit } = useTaskNavigation();

  const itemData = useMemo<ItemData>(() => ({
    tasks,
    onEditTask,
    onFollowUp,
    startTimer,
    stopTimer,
    navigateToTaskEdit,
  }), [tasks, onEditTask, onFollowUp, startTimer, stopTimer, navigateToTaskEdit]);

  if (!tasks.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tasks to display
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <List
        height={height}
        width="100%"
        itemCount={tasks.length}
        itemSize={itemSize}
        itemData={itemData}
        overscanCount={5} // Render 5 items outside visible area for smooth scrolling
      >
        {TaskItem}
      </List>
    </div>
  );
});

VirtualizedTaskTable.displayName = 'VirtualizedTaskTable';