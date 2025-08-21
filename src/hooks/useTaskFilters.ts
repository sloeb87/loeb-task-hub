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
      console.log('=== TASK DATE FILTERING DEBUG ===');
      console.log('Date filter range:', {
        from: dateFilter.from.toISOString(),
        to: dateFilter.to.toISOString(),
        fromTime: dateFilter.from.getTime(),
        toTime: dateFilter.to.getTime()
      });
      console.log('Total tasks before filtering:', filtered.length);
      
      const beforeFilteringCount = filtered.length;
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.dueDate);
        const filterStart = new Date(dateFilter.from);
        const filterEnd = new Date(dateFilter.to);
        
        // Normalize dates to start of day for comparison
        const taskDateNormalized = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
        const filterStartNormalized = new Date(filterStart.getFullYear(), filterStart.getMonth(), filterStart.getDate());
        const filterEndNormalized = new Date(filterEnd.getFullYear(), filterEnd.getMonth(), filterEnd.getDate());
        
        const isInRange = taskDateNormalized >= filterStartNormalized && taskDateNormalized <= filterEndNormalized;
        
        console.log(`Task: ${task.title}`, {
          originalDueDate: task.dueDate,
          taskDateNormalized: taskDateNormalized.toISOString(),
          filterStartNormalized: filterStartNormalized.toISOString(),
          filterEndNormalized: filterEndNormalized.toISOString(),
          isInRange
        });
        
        return isInRange;
      });
      
      console.log('=== FILTERING RESULT ===');
      console.log('Before filtering:', beforeFilteringCount);
      console.log('After filtering:', filtered.length);
      console.log('Filtered task titles:', filtered.map(t => t.title));
      console.log('================================');
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