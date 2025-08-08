import React from 'react';
import { TaskFormOptimized } from './TaskFormOptimized';
import { useTaskForm } from '@/contexts/TaskFormContext';
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage';
import type { Task, FollowUp } from '@/types/task';

export const GlobalTaskForm: React.FC = () => {
  const { taskFormState, closeTaskForm, openTaskForm, saveFormData, updateTaskForm } = useTaskForm();
  const { 
    tasks, 
    projects, 
    createTask, 
    updateTask, 
    deleteTask, 
    addFollowUp, 
    updateFollowUp,
    deleteFollowUp,
    refreshTasks
  } = useSupabaseStorage();

  const handleAddFollowUp = async (taskId: string, followUpText: string) => {
    try {
      await addFollowUp(taskId, followUpText);
      // Optimistically update current selected task to keep UI in sync
      if (taskFormState.selectedTask) {
        const optimistic: FollowUp = {
          id: 'temp-' + Date.now().toString(),
          text: followUpText,
          timestamp: new Date().toISOString(),
          taskStatus: taskFormState.selectedTask.status,
        };
        updateTaskForm({
          ...taskFormState.selectedTask,
          followUps: [...taskFormState.selectedTask.followUps, optimistic],
        } as Task);
      }
      // Refresh tasks in background without reloading the page
      refreshTasks();
    } catch (error) {
      console.error('Error adding follow-up:', error);
    }
  };

  const handleUpdateFollowUp = async (taskId: string, followUpId: string, text: string, timestamp?: string) => {
    try {
      await updateFollowUp(followUpId, text, timestamp);
      // Optimistically update current selected task
      if (taskFormState.selectedTask) {
        updateTaskForm({
          ...taskFormState.selectedTask,
          followUps: taskFormState.selectedTask.followUps.map(f => 
            f.id === followUpId ? { ...f, text, timestamp: timestamp || f.timestamp } : f
          ),
        } as Task);
      }
      // Refresh tasks in background without reloading the page
      refreshTasks();
    } catch (error) {
      console.error('Error updating follow-up:', error);
    }
  };

  const handleDeleteFollowUp = async (followUpId: string) => {
    try {
      await deleteFollowUp(followUpId);
      // Optimistically update current selected task
      if (taskFormState.selectedTask) {
        updateTaskForm({
          ...taskFormState.selectedTask,
          followUps: taskFormState.selectedTask.followUps.filter(f => f.id !== followUpId),
        } as Task);
      }
      // Refresh tasks in background without reloading the page
      refreshTasks();
    } catch (error) {
      console.error('Error deleting follow-up:', error);
    }
  };

  const handleSave = async (taskData: any) => {
    console.log('GLOBAL_TASK_FORM - Saving task:', taskData);
    
    try {
      if ('id' in taskData) {
        await updateTask(taskData);
        // Ensure UI reflects the latest data immediately
        refreshTasks();
      } else {
        // Set the project name if creating task for specific project
        const finalTaskData = {
          ...taskData,
          project: taskFormState.projectName || taskData.project
        };
        await createTask(finalTaskData);
        // Ensure UI reflects the latest data immediately
        refreshTasks();
      }
      
      closeTaskForm();
    } catch (error) {
      console.error('Error saving task:', error);
      // Don't close the form if there's an error
    }
  };

  const handleEditRelatedTask = (task: any) => {
    console.log('GLOBAL_TASK_FORM - Opening related task:', task.title);
    // Close current form and open with the related task
    openTaskForm(task.project, task, 'related-task');
  };

  const handleFollowUpTask = (task: any) => {
    console.log('GLOBAL_TASK_FORM - Opening follow-up for task:', task.title);
    // Close current form and open with the task for follow-up
    openTaskForm(task.project, task, 'follow-up');
  };

  if (!taskFormState.isOpen) {
    return null;
  }

  console.log('GLOBAL_TASK_FORM - Rendering with state:', taskFormState);

  return (
    <TaskFormOptimized
      key={taskFormState.selectedTask?.id || 'new'}
      isOpen={taskFormState.isOpen}
      onClose={closeTaskForm}
      onSave={handleSave}
      onDelete={deleteTask}
      onAddFollowUp={handleAddFollowUp}
      onUpdateFollowUp={handleUpdateFollowUp}
      onDeleteFollowUp={handleDeleteFollowUp}
      onFollowUpTask={handleFollowUpTask}
      task={taskFormState.selectedTask}
      allTasks={tasks}
      allProjects={projects}
      projectName={taskFormState.projectName}
      onEditRelatedTask={handleEditRelatedTask}
      persistedFormData={taskFormState.formData}
      onFormDataChange={saveFormData}
    />
  );
};