import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types/task';
import { mockTasks } from '@/data/mockData';

export const useTaskStorage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize tasks from localStorage
  useEffect(() => {
    const loadTasks = () => {
      try {
        // For deployment: start with empty data instead of loading from localStorage
        // Remove the next line and uncomment the line after to restore localStorage loading
        let loadedTasks = mockTasks; // Force empty data for deployment
        // let loadedTasks = stored ? JSON.parse(stored) : mockTasks; // Restore this for normal operation
        
        // Migrate old task IDs to new format (T1, T2, T3...)
        let needsMigration = false;
        loadedTasks = loadedTasks.map((task: Task, index: number) => {
          if (!task.id.startsWith('T') || task.id.includes('-')) {
            needsMigration = true;
            return { ...task, id: `T${index + 1}` };
          }
          return task;
        });
        
        if (needsMigration) {
          localStorage.setItem('pmtask-tasks', JSON.stringify(loadedTasks));
          console.log('Migrated task IDs to new format');
        }
        
        setTasks(loadedTasks);
        setError(null);
      } catch (err) {
        console.error('Failed to load tasks from localStorage:', err);
        setTasks(mockTasks);
        setError('Failed to load tasks from storage');
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  // Save tasks to localStorage
  const saveTasks = useCallback((updatedTasks: Task[]) => {
    try {
      localStorage.setItem('pmtask-tasks', JSON.stringify(updatedTasks));
      setError(null);
    } catch (err) {
      console.error('Failed to save tasks to localStorage:', err);
      setError('Failed to save tasks to storage');
    }
  }, []);

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
  const createTask = useCallback((taskData: Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    const newTask: Task = {
      ...taskData,
      id: getNextTaskId(),
      creationDate: new Date().toISOString().split('T')[0],
      followUps: []
    };
    
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
    return newTask;
  }, [tasks, getNextTaskId, saveTasks]);

  // Update existing task
  const updateTask = useCallback((updatedTask: Task) => {
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    );
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  }, [tasks, saveTasks]);

  // Add follow-up to task
  const addFollowUp = useCallback((taskId: string, followUpText: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const newFollowUp = {
          id: `${taskId}-F${task.followUps.length + 1}`,
          text: followUpText,
          timestamp: new Date().toISOString(),
          author: 'Current User'
        };
        return {
          ...task,
          followUps: [...task.followUps, newFollowUp]
        };
      }
      return task;
    });
    
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  }, [tasks, saveTasks]);

  // Delete task
  const deleteTask = useCallback((taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    saveTasks(updatedTasks);
  }, [tasks, saveTasks]);

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