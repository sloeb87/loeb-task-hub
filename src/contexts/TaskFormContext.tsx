import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task } from '@/types/task';

interface TaskFormState {
  isOpen: boolean;
  selectedTask: Task | null;
  projectName: string | null;
  contextKey: string; // To track which component opened it
}

interface TaskFormContextType {
  taskFormState: TaskFormState;
  openTaskForm: (projectName?: string, task?: Task, contextKey?: string) => void;
  closeTaskForm: () => void;
  updateTaskForm: (task: Task | null) => void;
}

const TaskFormContext = createContext<TaskFormContextType | undefined>(undefined);

const STORAGE_KEY = 'globalTaskFormState';

export const TaskFormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [taskFormState, setTaskFormState] = useState<TaskFormState>({
    isOpen: false,
    selectedTask: null,
    projectName: null,
    contextKey: ''
  });

  // Restore state from localStorage on mount
  useEffect(() => {
    const storedState = localStorage.getItem(STORAGE_KEY);
    if (storedState) {
      try {
        const parsed = JSON.parse(storedState);
        console.log('GLOBAL_TASK_FORM - Restoring state from localStorage:', parsed);
        setTaskFormState(parsed);
      } catch (error) {
        console.error('Failed to parse global task form state:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (taskFormState.isOpen) {
      console.log('GLOBAL_TASK_FORM - Saving state to localStorage:', taskFormState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskFormState));
    } else {
      console.log('GLOBAL_TASK_FORM - Clearing state from localStorage');
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [taskFormState]);

  const openTaskForm = (projectName?: string, task?: Task, contextKey = 'unknown') => {
    console.log('GLOBAL_TASK_FORM - Opening task form:', { projectName, taskId: task?.id, contextKey });
    setTaskFormState({
      isOpen: true,
      selectedTask: task || null,
      projectName: projectName || null,
      contextKey
    });
  };

  const closeTaskForm = () => {
    console.log('GLOBAL_TASK_FORM - Closing task form');
    setTaskFormState({
      isOpen: false,
      selectedTask: null,
      projectName: null,
      contextKey: ''
    });
  };

  const updateTaskForm = (task: Task | null) => {
    setTaskFormState(prev => ({ ...prev, selectedTask: task }));
  };

  return (
    <TaskFormContext.Provider value={{
      taskFormState,
      openTaskForm,
      closeTaskForm,
      updateTaskForm
    }}>
      {children}
    </TaskFormContext.Provider>
  );
};

export const useTaskForm = () => {
  const context = useContext(TaskFormContext);
  if (context === undefined) {
    throw new Error('useTaskForm must be used within a TaskFormProvider');
  }
  return context;
};