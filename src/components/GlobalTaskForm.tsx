import React from 'react';
import { TaskFormOptimized } from './TaskFormOptimized';
import { useTaskForm } from '@/contexts/TaskFormContext';
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage';

export const GlobalTaskForm: React.FC = () => {
  const { taskFormState, closeTaskForm, openTaskForm, saveFormData } = useTaskForm();
  const { 
    tasks, 
    projects, 
    createTask, 
    updateTask, 
    deleteTask, 
    addFollowUp, 
    updateFollowUp 
  } = useSupabaseStorage();

  const handleSave = async (taskData: any) => {
    console.log('GLOBAL_TASK_FORM - Saving task:', taskData);
    
    try {
      if ('id' in taskData) {
        await updateTask(taskData);
      } else {
        // Set the project name if creating task for specific project
        const finalTaskData = {
          ...taskData,
          project: taskFormState.projectName || taskData.project
        };
        await createTask(finalTaskData);
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
      onAddFollowUp={addFollowUp}
      onUpdateFollowUp={updateFollowUp}
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