import React from 'react';
import { useTaskNavigation } from '@/contexts/TaskFormContext';

export const GlobalTaskForm: React.FC = () => {
  const { taskNavigationState, navigateToTaskEdit } = useTaskNavigation();

  const handleEditRelatedTask = (task: any) => {
    console.log('GLOBAL_TASK_FORM - Opening related task:', task.title);
    navigateToTaskEdit(task.project, task, 'related-task');
  };

  const handleFollowUpTask = (task: any) => {
    console.log('GLOBAL_TASK_FORM - Opening follow-up for task:', task.title);
    navigateToTaskEdit(task.project, task, 'follow-up');
  };

  // This component is being phased out in favor of second header navigation
  // Return null to prevent modal rendering
  return null;
};