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

    // Apply date filtering if provided - show tasks that were ACTIVE during the date range
    if (dateFilter) {
      console.log('=== TASK ACTIVE PERIOD FILTERING DEBUG ===');
      console.log('Date filter range:', {
        from: dateFilter.from.toISOString(),
        to: dateFilter.to.toISOString()
      });
      console.log('Total tasks before filtering:', filtered.length);
      
      const beforeFilteringCount = filtered.length;
      filtered = filtered.filter(task => {
        const creationDate = new Date(task.creationDate);
        const dueDate = new Date(task.dueDate);
        const completionDate = task.completionDate ? new Date(task.completionDate) : null;
        const filterStart = new Date(dateFilter.from);
        const filterEnd = new Date(dateFilter.to);
        
        // Normalize dates to start of day for comparison
        const creationDateNormalized = new Date(creationDate.getFullYear(), creationDate.getMonth(), creationDate.getDate());
        const dueDateNormalized = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const completionDateNormalized = completionDate ? new Date(completionDate.getFullYear(), completionDate.getMonth(), completionDate.getDate()) : null;
        const filterStartNormalized = new Date(filterStart.getFullYear(), filterStart.getMonth(), filterStart.getDate());
        const filterEndNormalized = new Date(filterEnd.getFullYear(), filterEnd.getMonth(), filterEnd.getDate());
        
        // Task is active during the period if:
        // 1. Task was created before or during the period (creationDate <= filterEnd)
        // 2. Task's due date is after or during the period (dueDate >= filterStart)  
        // 3. If completed, completion date is after the period start (or not completed yet)
        
        const wasCreatedBeforeOrDuringPeriod = creationDateNormalized <= filterEndNormalized;
        const isDueAfterOrDuringPeriod = dueDateNormalized >= filterStartNormalized;
        const wasNotCompletedBeforePeriod = !completionDateNormalized || completionDateNormalized >= filterStartNormalized;
        
        const wasActiveInPeriod = wasCreatedBeforeOrDuringPeriod && isDueAfterOrDuringPeriod && wasNotCompletedBeforePeriod;
        
        console.log(`Task: ${task.title}`, {
          status: task.status,
          creationDate: task.creationDate,
          dueDate: task.dueDate,
          completionDate: task.completionDate,
          wasCreatedBeforeOrDuringPeriod,
          isDueAfterOrDuringPeriod,
          wasNotCompletedBeforePeriod,
          wasActiveInPeriod
        });
        
        return wasActiveInPeriod;
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