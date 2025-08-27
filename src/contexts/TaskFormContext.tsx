import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task } from '@/types/task';

interface TaskNavigationState {
  selectedTask: Task | null;
  projectName: string | null;
  contextKey: string;
  formData?: any;
}

interface TaskNavigationContextType {
  taskNavigationState: TaskNavigationState;
  navigateToTaskEdit: (projectName?: string, task?: Task, contextKey?: string) => void;
  updateSelectedTask: (task: Task | null) => void;
  saveFormData: (formData: any) => void;
  onNavigateToTaskEdit?: (projectName?: string, task?: Task, contextKey?: string) => void;
  setNavigationCallback: (callback: (projectName?: string, task?: Task, contextKey?: string) => void) => void;
}

const TaskNavigationContext = createContext<TaskNavigationContextType | undefined>(undefined);

const STORAGE_KEY = 'taskNavigationState';

export const TaskNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [taskNavigationState, setTaskNavigationState] = useState<TaskNavigationState>({
    selectedTask: null,
    projectName: null,
    contextKey: 'unknown',
    formData: undefined
  });
  
  const [navigationCallback, setNavigationCallback] = useState<((projectName?: string, task?: Task, contextKey?: string) => void) | undefined>();

  const navigateToTaskEdit = (projectName?: string, task?: Task, contextKey = 'unknown') => {
    console.log('TASK_NAVIGATION - Navigating to task edit:', { projectName, taskId: task?.id, contextKey });
    setTaskNavigationState({
      selectedTask: task || null,
      projectName: projectName || null,
      contextKey,
      formData: undefined,
    });
    
    if (navigationCallback) {
      navigationCallback(projectName, task, contextKey);
    }
  };

  const updateSelectedTask = (task: Task | null) => {
    setTaskNavigationState(prev => ({ ...prev, selectedTask: task }));
  };

  const saveFormData = (formData: any) => {
    setTaskNavigationState(prev => ({ ...prev, formData }));
  };

  const setNavigationCallbackWrapper = (callback: (projectName?: string, task?: Task, contextKey?: string) => void) => {
    setNavigationCallback(callback);
  };

  return (
    <TaskNavigationContext.Provider value={{
      taskNavigationState,
      navigateToTaskEdit,
      updateSelectedTask,
      saveFormData,
      onNavigateToTaskEdit: navigationCallback,
      setNavigationCallback: setNavigationCallbackWrapper
    }}>
      {children}
    </TaskNavigationContext.Provider>
  );
};

export const useTaskNavigation = () => {
  const context = useContext(TaskNavigationContext);
  if (context === undefined) {
    throw new Error('useTaskNavigation must be used within a TaskNavigationProvider');
  }
  return context;
};

// Legacy compatibility
export const useTaskForm = useTaskNavigation;
export const TaskFormProvider = TaskNavigationProvider;