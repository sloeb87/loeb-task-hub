import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types/task';
import { tasksApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const useTaskStorage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // Initialize tasks from API
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        const loadedTasks = await tasksApi.getTasks();
        setTasks(loadedTasks);
        setError(null);
      } catch (err) {
        console.error('Failed to load tasks from API:', err);
        setError('Failed to load tasks from server');
        toast({
          title: "Error",
          description: "Failed to load tasks from server",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [toast]);

  // Handle API errors
  const handleApiError = useCallback((error: any, action: string) => {
    console.error(`Failed to ${action}:`, error);
    const message = `Failed to ${action}`;
    setError(message);
    toast({
      title: "Error",
      description: message,
      variant: "destructive"
    });
  }, [toast]);

  // Generate next sequential task ID
  const getNextTaskId = useCallback((): string => {
    const existingNumbers = tasks
      .map(task => task.id)
      .filter(id => id.startsWith('T'))
      .map(id => parseInt(id.substring(1)))
      .filter(num => !isNaN(num));
    
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    return `T${maxNumber + 1}`;
  }, [tasks]);

  // Create new task
  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    try {
      setIsLoading(true);
      const taskToCreate = {
        ...taskData,
        creationDate: new Date().toISOString().split('T')[0],
        followUps: []
      };
      
      const newTask = await tasksApi.createTask(taskToCreate);
      setTasks(prev => [...prev, newTask]);
      setError(null);
      
      toast({
        title: "Success",
        description: "Task created successfully"
      });
      
      return newTask;
    } catch (err) {
      handleApiError(err, 'create task');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, toast]);

  // Update existing task
  const updateTask = useCallback(async (updatedTask: Task) => {
    try {
      setIsLoading(true);
      const updated = await tasksApi.updateTask(updatedTask);
      setTasks(prev => prev.map(task => 
        task.id === updated.id ? updated : task
      ));
      setError(null);
      
      toast({
        title: "Success",
        description: "Task updated successfully"
      });
    } catch (err) {
      handleApiError(err, 'update task');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, toast]);

  // Add follow-up to task
  const addFollowUp = useCallback(async (taskId: string, followUpText: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newFollowUp = {
        id: `${taskId}-F${task.followUps.length + 1}`,
        text: followUpText,
        timestamp: new Date().toISOString(),
        author: 'Current User'
      };

      const updatedTask = {
        ...task,
        followUps: [...task.followUps, newFollowUp]
      };

      await updateTask(updatedTask);
    } catch (err) {
      handleApiError(err, 'add follow-up');
    }
  }, [tasks, updateTask, handleApiError]);

  // Delete task
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      setIsLoading(true);
      await tasksApi.deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      setError(null);
      
      toast({
        title: "Success",
        description: "Task deleted successfully"
      });
    } catch (err) {
      handleApiError(err, 'delete task');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, toast]);

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    addFollowUp,
    deleteTask,
    refreshTasks: () => setTasks([...tasks]) // Force re-render if needed
  };
};