import { useMemo } from 'react';
import { Task } from '@/types/task';

export type FilterType = "all" | "open" | "inprogress" | "onhold" | "critical" | "active";

export const useTaskFilters = (tasks: Task[], activeFilter: FilterType) => {
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      switch (activeFilter) {
        case "open":
          return task.status === "Open";
        case "inprogress":
          return task.status === "In Progress";
        case "active":
          return task.status === "Open" || task.status === "In Progress";
        case "onhold":
          return task.status === "On Hold";
        case "critical":
          return task.priority === "Critical" && task.status !== "Completed";
        case "all":
          return true;
        default:
          return true;
      }
    });
  }, [tasks, activeFilter]);

  const taskCounts = useMemo(() => {
    return {
      total: tasks.length,
      open: tasks.filter(t => t.status === "Open").length,
      inProgress: tasks.filter(t => t.status === "In Progress").length,
      onHold: tasks.filter(t => t.status === "On Hold").length,
      critical: tasks.filter(t => t.priority === "Critical" && t.status !== "Completed").length,
      completed: tasks.filter(t => t.status === "Completed").length
    };
  }, [tasks]);

  return {
    filteredTasks,
    taskCounts
  };
};