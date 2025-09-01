import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Task } from '@/types/task';

interface TaskNavigationState {
  selectedTask: Task | null;
  projectName: string | null;
  projectId: string | null;
  contextKey: string;
  formData?: any;
}

interface TaskNavigationContextType {
  taskNavigationState: TaskNavigationState;
  navigateToTaskEdit: (projectName?: string, task?: Task, contextKey?: string, projectId?: string) => void;
  updateSelectedTask: (task: Task | null) => void;
  saveFormData: (formData: any) => void;
  onNavigateToTaskEdit?: (projectName?: string, task?: Task, contextKey?: string, projectId?: string) => void;
  setNavigationCallback: (callback: (projectName?: string, task?: Task, contextKey?: string, projectId?: string) => void) => void;
}

const TaskNavigationContext = createContext<TaskNavigationContextType | undefined>(undefined);

const STORAGE_KEY = 'taskNavigationState';

export const TaskNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [taskNavigationState, setTaskNavigationState] = useState<TaskNavigationState>({
    selectedTask: null,
    projectName: null,
    projectId: null,
    contextKey: 'unknown',
    formData: undefined
  });
  
  const [navigationCallback, setNavigationCallback] = useState<((projectName?: string, task?: Task, contextKey?: string, projectId?: string) => void) | undefined>();

  const navigateToTaskEdit = useCallback((projectName?: string, task?: Task, contextKey = 'unknown', projectId?: string) => {
    console.log('TASK_NAVIGATION - Navigating to task edit:', { projectName, projectId, taskId: task?.id, contextKey });
    
    // Extract project info from task if not provided explicitly
    let finalProjectName = projectName;
    let finalProjectId = projectId;
    
    if (task && !finalProjectName) {
      finalProjectName = task.project || null;
    }
    // Note: projectId needs to be resolved from project name if not provided
    
    setTaskNavigationState({
      selectedTask: task || null,
      projectName: finalProjectName,
      projectId: finalProjectId,
      contextKey,
      formData: undefined,
    });
    
    if (navigationCallback) {
      navigationCallback(finalProjectName, task, contextKey, finalProjectId);
    }
  }, [navigationCallback]);

  const updateSelectedTask = useCallback((task: Task | null) => {
    setTaskNavigationState(prev => ({
      ...prev,
      selectedTask: task,
      // Update project info when task changes
      projectName: task?.project || prev.projectName,
      // projectId remains the same unless explicitly set
    }));
  }, []);

  const saveFormData = useCallback((formData: any) => {
    setTaskNavigationState(prev => ({ ...prev, formData }));
  }, []);

  const setNavigationCallbackWrapper = useCallback((callback: (projectName?: string, task?: Task, contextKey?: string, projectId?: string) => void) => {
    setNavigationCallback(() => callback);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    taskNavigationState,
    navigateToTaskEdit,
    updateSelectedTask,
    saveFormData,
    onNavigateToTaskEdit: navigationCallback,
    setNavigationCallback: setNavigationCallbackWrapper
  }), [taskNavigationState, navigateToTaskEdit, updateSelectedTask, saveFormData, navigationCallback, setNavigationCallbackWrapper]);

  return (
    <TaskNavigationContext.Provider value={contextValue}>
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