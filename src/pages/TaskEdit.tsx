import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TaskFormOptimized } from "@/components/TaskFormOptimized";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useTaskNavigation } from "@/contexts/TaskFormContext";
import { Task, Project } from "@/types/task";
import { toast } from "@/hooks/use-toast";

const TaskEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { taskNavigationState, updateSelectedTask } = useTaskNavigation();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const {
    tasks,
    projects,
    createTask,
    updateTask,
    refreshTasks
  } = useSupabaseStorage();

  // Load task data
  useEffect(() => {
    if (id && id !== 'new') {
      const task = tasks.find(t => t.id === id);
      if (task) {
        setSelectedTask(task);
        updateSelectedTask(task);
        
        // Find and set the corresponding project
        const taskProject = projects.find(project => project.name === task.project);
        if (taskProject) {
          setSelectedProject(taskProject);
        }
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
      
      // Also check location state for project name
      if (location.state && (location.state as any).projectName) {
        const project = projects.find(p => p.name === (location.state as any).projectName);
        if (project) {
          setSelectedProject(project);
        }
      }
    }
  }, [id, tasks, projects, taskNavigationState.projectName, location.state, updateSelectedTask]);

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
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
      
      // Navigate to project details if we have a project, otherwise tasks
      if (selectedProject) {
        navigate(`/projects/${encodeURIComponent(selectedProject.name)}`);
      } else {
        navigate('/tasks');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update the task. Please try again.",
        variant: "destructive",
      });
    }
  }, [updateTask, refreshTasks, navigate, selectedProject]);

  const handleCancel = () => {
    if (selectedProject) {
      navigate(`/projects/${encodeURIComponent(selectedProject.name)}`);
    } else {
      navigate('/tasks');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6">
        <TaskFormOptimized
          isOpen={true}
          onClose={handleCancel}
          onSave={selectedTask ? handleUpdateTask : handleCreateTask}
          task={selectedTask}
          allTasks={tasks}
          allProjects={projects}
          projectName={selectedProject?.name}
        />
      </main>
    </div>
  );
};

export default TaskEdit;