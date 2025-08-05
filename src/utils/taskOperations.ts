import { Task } from '@/types/task';

/**
 * Utility functions for common task operations
 * Reduces duplicate logic across components
 */

// Date utilities
export const isOverdue = (dueDate: string, status: string): boolean => {
  if (status === "Completed") return false;
  return new Date(dueDate) < new Date();
};

export const getDueDateColor = (dueDate: string, status: string): string => {
  if (status === "Completed") return "text-green-600 dark:text-green-400";
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "text-red-600 dark:text-red-400"; // Overdue
  if (diffDays <= 3) return "text-orange-600 dark:text-orange-400"; // Within 3 days
  if (diffDays <= 7) return "text-yellow-600 dark:text-yellow-400"; // Within 7 days
  
  return "text-gray-500 dark:text-gray-400"; // Normal
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Task filtering utilities
export const getUniqueTaskValues = <K extends keyof Task>(
  tasks: Task[], 
  field: K,
  formatter?: (value: Task[K]) => string
): string[] => {
  const values = [...new Set(tasks.map(task => {
    const value = task[field];
    return formatter ? formatter(value) : String(value);
  }))].filter(Boolean);
  
  return values.sort();
};

// Time utilities
export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Task statistics
export const calculateTaskStats = (tasks: Task[]) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const overdue = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    overdue,
    completionRate,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    open: tasks.filter(t => t.status === 'Open').length,
    onHold: tasks.filter(t => t.status === 'On Hold').length,
  };
};

// Project statistics
export const getProjectStats = (tasks: Task[], projectName: string) => {
  const projectTasks = tasks.filter(task => task.project === projectName);
  return calculateTaskStats(projectTasks);
};