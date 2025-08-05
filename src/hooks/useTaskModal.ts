import { useState, useCallback } from 'react';
import { Task } from '@/types/task';

/**
 * Optimized hook for managing task modal state across components
 * Reduces duplicate state management patterns
 */
export const useTaskModal = () => {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const openNewTaskForm = useCallback(() => {
    setSelectedTask(null);
    setIsTaskFormOpen(true);
  }, []);

  const openEditTaskForm = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  }, []);

  const closeTaskForm = useCallback(() => {
    setIsTaskFormOpen(false);
    setSelectedTask(null);
  }, []);

  const handleTaskSave = useCallback((onSave: (task: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => void) => {
    return (taskData: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
      onSave(taskData);
      closeTaskForm();
    };
  }, [closeTaskForm]);

  return {
    // State
    isTaskFormOpen,
    selectedTask,
    
    // Actions
    openNewTaskForm,
    openEditTaskForm,
    closeTaskForm,
    handleTaskSave,
    
    // Direct state setters (for compatibility)
    setIsTaskFormOpen,
    setSelectedTask,
  };
};