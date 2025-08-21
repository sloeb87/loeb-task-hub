import { useMemo } from 'react';
import { Task } from '@/types/task';

export type FilterType = "all" | "open" | "inprogress" | "onhold" | "critical" | "active";

interface DateFilter {
  from: Date;
  to: Date;
}

export const useTaskFilters = (tasks: Task[], activeFilter: FilterType, dateFilter?: DateFilter) => {
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
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

    // Apply date filtering if provided
    if (dateFilter) {
      console.log('Task filtering with dateFilter:', {
        dateFilter,
        totalTasks: filtered.length,
        filterStartTime: dateFilter.from.getTime(),
        filterEndTime: dateFilter.to.getTime()
      });
      
      const beforeFilteringCount = filtered.length;
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.dueDate);
        const filterStart = new Date(dateFilter.from);
        const filterEnd = new Date(dateFilter.to);
        
        const isInRange = taskDate >= filterStart && taskDate <= filterEnd;
        
        console.log('Task date check:', {
          taskId: task.id,
          taskTitle: task.title,
          taskDueDate: taskDate.toISOString(),
          taskTime: taskDate.getTime(),
          filterStart: filterStart.toISOString(),
          filterEnd: filterEnd.toISOString(),
          isInRange
        });
        
        return isInRange;
      });
      
      console.log('Task filtering result:', {
        beforeFiltering: beforeFilteringCount,
        afterFiltering: filtered.length,
        filteredTaskIds: filtered.map(t => t.id)
      });
    }

    return filtered;
  }, [tasks, activeFilter, dateFilter]);

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