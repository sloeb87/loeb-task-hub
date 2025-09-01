import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useTaskNavigation } from "@/contexts/TaskFormContext";
import { ProjectDetailView } from "@/components/ProjectDetailView";
import { Project, Task } from "@/types/task";
import { toast } from "@/hooks/use-toast";

const ProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const { setNavigationCallback } = useTaskNavigation();

  const {
    tasks,
    projects,
    updateTask,
    deleteTask,
    updateProject,
    deleteProject,
    refreshTasks
  } = useSupabaseStorage();

  // Set up navigation callback for task editing
  useEffect(() => {
    setNavigationCallback((projectName?: string, task?: Task) => {
      if (task) {
        console.log('ProjectDetails - Navigating to task edit:', task.id);
        navigate(`/tasks/${task.id}`);
      }
    });
  }, [navigate, setNavigationCallback]);

  // Find the project by ID
  useEffect(() => {
    if (projectId && projects.length > 0) {
      const foundProject = projects.find(p => p.id === projectId);
      if (foundProject) {
        setProject(foundProject);
      } else {
        // Project not found, redirect to projects list
        navigate('/projects');
      }
    }
  }, [projectId, projects, navigate]);

  // SEO
  useEffect(() => {
    const projectTitle = project ? project.name : 'Project Details';
    document.title = `${projectTitle} | Task Tracker`;
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', `Project details for: ${projectTitle}`);
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(meta);
    }
  }, [project]);

  const handleBack = () => {
    navigate('/projects');
  };

  const handleEditProject = () => {
    // This will open the project form modal within the detail view
    console.log('Edit project:', project?.name);
  };

  const handleCreateTask = () => {
    // Navigate to new task with project pre-selected
    navigate('/tasks/new', { 
      state: { 
        projectId: project?.id,
        projectName: project?.name 
      } 
    });
  };

  const handleEditTask = (task: Task) => {
    console.log('ProjectDetails - Handling task edit:', task.id);
    navigate(`/tasks/${task.id}`);
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      await updateTask(updatedTask);
      await refreshTasks();
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update the task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      await refreshTasks();
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = () => {
    console.log('Generate report for project:', project?.name);
  };

  const handleSaveTask = (taskData: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    if ('id' in taskData) {
      handleUpdateTask(taskData as Task);
    } else {
      // This shouldn't happen in this context, but handle gracefully
      console.log('Task creation should be handled via navigation');
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Loading project details...</h1>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const projectTasks = tasks.filter(task => task.project === project.name);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6">
        <ProjectDetailView
          project={project}
          tasks={projectTasks}
          allTasks={tasks}
          onBack={handleBack}
          onEditProject={handleEditProject}
          onCreateTask={handleCreateTask}
          onEditTask={handleEditTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onSaveTask={handleSaveTask}
          onGenerateReport={handleGenerateReport}
        />
      </main>
    </div>
  );
};

export default ProjectDetails;