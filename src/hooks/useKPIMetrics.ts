
import { useMemo } from 'react';
import { Task, KPIMetrics } from "@/types/task";

export const useKPIMetrics = (tasks: Task[]) => {
  return useMemo((): KPIMetrics => {
    // Exclude Meeting tasks from KPI calculations
    const relevantTasks = tasks.filter(t => t.taskType !== "Meeting");

    const totalTasks = relevantTasks.length;
    const completedTasks = relevantTasks.filter(t => t.status === "Completed").length;
    const overdueTasks = relevantTasks.filter(t => {
      const today = new Date();
      const dueDate = new Date(t.dueDate);
      return t.status !== "Completed" && dueDate < today;
    }).length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const completedTasksWithDuration = relevantTasks.filter(t => t.status === "Completed" && t.completionDate);
    const totalDuration = completedTasksWithDuration.reduce((sum, task) => {
      const created = new Date(task.creationDate);
      const completed = new Date(task.completionDate!);
      return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    const averageTaskDuration = completedTasksWithDuration.length > 0 ? totalDuration / completedTasksWithDuration.length : 0;

    const tasksByStatus = relevantTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksByPriority = relevantTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksByUser = relevantTasks.reduce((acc, task) => {
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
  }, [tasks]);
};
