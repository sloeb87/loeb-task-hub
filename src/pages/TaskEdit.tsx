import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TaskFormOptimized } from "@/components/TaskFormOptimized";
import { FollowUpDialog } from "@/components/FollowUpDialog";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useTaskNavigation } from "@/contexts/TaskFormContext";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { Task, Project } from "@/types/task";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Play, Pause, Clock } from "lucide-react";

const TaskEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { taskNavigationState, updateSelectedTask } = useTaskNavigation();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [selectedTaskForFollowUp, setSelectedTaskForFollowUp] = useState<Task | null>(null);
  
  const { startTimer, stopTimer, getTaskTime } = useTimeTracking();

  const {
    tasks,
    projects,
    createTask,
    updateTask,
    deleteTask,
    deleteAllRecurringTasks,
    updateAllRecurringTasks,
    refreshTasks,
    loadTaskById,
    addFollowUp,
    updateFollowUp,
    deleteFollowUp
  } = useSupabaseStorage();

  // Load task data
  useEffect(() => {
    const loadTaskData = async () => {
      if (id && id !== 'new') {
        // First try to find task in current tasks array
        let task = tasks.find(t => t.id === id);
        
        // If not found in current array (pagination issue), load directly from database
        if (!task) {
          console.log('Task not found in current tasks, loading from database:', id);
          task = await loadTaskById(id);
        }
        
        if (task) {
          setSelectedTask(task);
          updateSelectedTask(task);
          
          // Find and set the corresponding project
          const taskProject = projects.find(project => project.name === task.project);
          if (taskProject) {
            setSelectedProject(taskProject);
          }
        } else {
          console.log('Task not found:', id);
          // Optionally redirect to tasks list if task doesn't exist
          // navigate('/tasks');
        }
      } else {
        // New task
        setSelectedTask(null);
        updateSelectedTask(null);
        
        // Use project from navigation state if available
        if (taskNavigationState.projectName) {
          const project = projects.find(p => p.name === taskNavigationState.projectName);
          if (project) {
            setSelectedProject(project);
          }
        }
        
        // Also check location state for project info
        if (location.state && (location.state as any).projectId) {
          const project = projects.find(p => p.id === (location.state as any).projectId);
          if (project) {
            setSelectedProject(project);
          }
        } else if (location.state && (location.state as any).projectName) {
          const project = projects.find(p => p.name === (location.state as any).projectName);
          if (project) {
            setSelectedProject(project);
          }
        }
      }
    };

    loadTaskData();
  }, [id, tasks, projects, taskNavigationState.projectName, location.state, updateSelectedTask, loadTaskById]);

  // SEO
  useEffect(() => {
    const taskTitle = selectedTask ? selectedTask.title : 'New Task';
    document.title = `${taskTitle} | Task Tracker`;
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', `Edit task: ${taskTitle}`);
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(meta);
    }
  }, [selectedTask]);

  const handleCreateTask = useCallback(async (taskData: Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    try {
      await createTask(taskData);
      await refreshTasks();
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      navigate('/tasks');
    } catch (error) {
      console.error('Failed to create task:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create the task. Please try again.",
        variant: "destructive",
      });
    }
  }, [createTask, refreshTasks, navigate]);

  const handleUpdateTask = useCallback(async (updatedTask: Task) => {
    try {
      await updateTask(updatedTask);
      await refreshTasks();
      
      // Update the selected task with the new data
      setSelectedTask(updatedTask);
      updateSelectedTask(updatedTask);
      
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      
      // Stay on the current task edit page instead of navigating away
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update the task. Please try again.",
        variant: "destructive",
      });
    }
  }, [updateTask, refreshTasks, updateSelectedTask]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId);
      await refreshTasks();
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
      navigate('/tasks');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the task. Please try again.",
        variant: "destructive",
      });
    }
  }, [deleteTask, refreshTasks, navigate]);

  const handleDeleteAllRecurring = useCallback(async (taskId: string) => {
    try {
      await deleteAllRecurringTasks(taskId);
      await refreshTasks();
      navigate('/tasks');
    } catch (error) {
      console.error('Failed to delete recurring tasks:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete recurring tasks. Please try again.",
        variant: "destructive",
      });
    }
  }, [deleteAllRecurringTasks, refreshTasks, navigate]);

  const handleUpdateAllRecurring = useCallback(async (taskId: string, updateData: any) => {
    try {
      await updateAllRecurringTasks(taskId, updateData);
      await refreshTasks();
      toast({
        title: "Success",
        description: "All recurring tasks updated successfully",
      });
    } catch (error) {
      console.error('Failed to update recurring tasks:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update recurring tasks. Please try again.",
        variant: "destructive",
      });
    }
  }, [updateAllRecurringTasks, refreshTasks]);

  const handleCancel = () => {
    if (selectedProject) {
      navigate(`/projects/${selectedProject.id}`);
    } else {
      navigate('/tasks');
    }
  };

  const handleOpenFollowUpDialog = useCallback((task: Task) => {
    setSelectedTaskForFollowUp(task);
    setFollowUpDialogOpen(true);
  }, []);

  const handleCloseFollowUpDialog = useCallback(() => {
    setFollowUpDialogOpen(false);
    setSelectedTaskForFollowUp(null);
  }, []);

  const handleAddFollowUpFromDialog = useCallback(async (followUpText: string) => {
    if (!selectedTaskForFollowUp) return;
    try {
      await addFollowUp(selectedTaskForFollowUp.id, followUpText);
      // Refresh the task data to show the new follow-up
      if (selectedTaskForFollowUp.id === selectedTask?.id) {
        const updatedTask = await loadTaskById(selectedTaskForFollowUp.id);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
    } catch (error) {
      console.error('Failed to add follow-up:', error);
    }
  }, [selectedTaskForFollowUp, addFollowUp, selectedTask, loadTaskById]);

  const handleUpdateFollowUpFromDialog = useCallback(async (taskId: string, followUpId: string, text: string, timestamp?: string) => {
    try {
      await updateFollowUp(followUpId, text, timestamp);
      // Refresh the task data to show the updated follow-up
      if (taskId === selectedTask?.id) {
        const updatedTask = await loadTaskById(taskId);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
    } catch (error) {
      console.error('Failed to update follow-up:', error);
    }
  }, [updateFollowUp, selectedTask, loadTaskById]);

  const handleDeleteFollowUpFromDialog = useCallback(async (followUpId: string) => {
    try {
      await deleteFollowUp(followUpId);
      // Refresh the task data to remove the deleted follow-up
      if (selectedTask) {
        const updatedTask = await loadTaskById(selectedTask.id);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
    } catch (error) {
      console.error('Failed to delete follow-up:', error);
    }
  }, [deleteFollowUp, selectedTask, loadTaskById]);

  const handleTimerToggle = useCallback(() => {
    if (!selectedTask) return;
    
    const timerId = selectedTask.id; // Use task.id (task_number)
    const taskTime = getTaskTime(timerId);
    if (taskTime.isRunning) {
      stopTimer(timerId);
      toast({
        title: "Timer Stopped",
        description: `Timer stopped for ${selectedTask.title}`,
      });
    } else {
      startTimer(timerId, selectedTask.title, selectedTask.project, selectedTask.responsible);
      toast({
        title: "Timer Started",
        description: `Timer started for ${selectedTask.title}`,
      });
    }
  }, [selectedTask, startTimer, stopTimer, getTaskTime]);

  const formatTime = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6">
        {selectedTask && (
          <div className="mb-6 flex items-center justify-between bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-medium">{selectedTask.id} - {selectedTask.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Total time: {formatTime(getTaskTime(selectedTask.id).totalTime)}
                </p>
              </div>
            </div>
            <Button
              variant={getTaskTime(selectedTask.id).isRunning ? "destructive" : "default"}
              onClick={handleTimerToggle}
              className="flex items-center gap-2"
            >
              {getTaskTime(selectedTask.id).isRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  Stop Timer
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Timer
                </>
              )}
            </Button>
          </div>
        )}
        
        <TaskFormOptimized
          isOpen={true}
          onClose={handleCancel}
          onSave={selectedTask ? handleUpdateTask : handleCreateTask}
          onDelete={selectedTask ? handleDeleteTask : undefined}
          onDeleteAllRecurring={selectedTask ? handleDeleteAllRecurring : undefined}
          onUpdateAllRecurring={selectedTask ? handleUpdateAllRecurring : undefined}
          onAddFollowUp={addFollowUp}
          onUpdateFollowUp={updateFollowUp}
          onDeleteFollowUp={deleteFollowUp}
          onFollowUpTask={handleOpenFollowUpDialog}
          task={selectedTask}
          allTasks={tasks}
          allProjects={projects}
          projectName={selectedProject?.name}
          renderInline={true}
        />

        {/* Follow-up Dialog */}
        {selectedTaskForFollowUp && (
          <FollowUpDialog
            isOpen={followUpDialogOpen}
            onClose={handleCloseFollowUpDialog}
            onAddFollowUp={handleAddFollowUpFromDialog}
            onUpdateFollowUp={handleUpdateFollowUpFromDialog}
            onDeleteFollowUp={handleDeleteFollowUpFromDialog}
            task={selectedTaskForFollowUp}
          />
        )}
      </main>
    </div>
  );
};

export default TaskEdit;