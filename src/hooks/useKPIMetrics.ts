
import { useMemo } from 'react';
import { Task, KPIMetrics } from "@/types/task";
import { useTaskMetrics } from './useTaskMetrics';

export const useKPIMetrics = (tasks: Task[]) => {
  const { aggregatedMetrics, taskMetrics } = useTaskMetrics();
  
  return useMemo((): KPIMetrics => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "Completed").length;
    
    // Use pre-calculated overdue count from metrics if available
    const overdueTasks = aggregatedMetrics?.overdueTasksCount ?? 
      tasks.filter(t => {
        const today = new Date();
        const dueDate = new Date(t.dueDate);
        return t.status !== "Completed" && dueDate < today;
      }).length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Use pre-calculated average duration from metrics if available
    let averageTaskDuration = 0;
    if (taskMetrics.length > 0) {
      const completedMetrics = taskMetrics.filter(m => m.actual_duration_days > 0);
      averageTaskDuration = completedMetrics.length > 0 
        ? completedMetrics.reduce((sum, m) => sum + m.actual_duration_days, 0) / completedMetrics.length
        : 0;
    } else {
      // Fallback to original calculation
      const completedTasksWithDuration = tasks.filter(t => t.status === "Completed" && t.completionDate);
      const totalDuration = completedTasksWithDuration.reduce((sum, task) => {
        const created = new Date(task.creationDate);
        const completed = new Date(task.completionDate!);
        return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      }, 0);
      averageTaskDuration = completedTasksWithDuration.length > 0 ? totalDuration / completedTasksWithDuration.length : 0;
    }

    const tasksByStatus = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksByPriority = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksByUser = tasks.reduce((acc, task) => {
      acc[task.responsible] = (acc[task.responsible] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate,
      averageTaskDuration,
      tasksByStatus,
      tasksByPriority,
      tasksByUser
    };
  }, [tasks, aggregatedMetrics, taskMetrics]);
};
