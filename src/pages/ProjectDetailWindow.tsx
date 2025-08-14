import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ProjectDetailView } from '@/components/ProjectDetailView';
import { GlobalTaskForm } from '@/components/GlobalTaskForm';
import { ReportModal } from '@/components/ReportModal';
import { useSupabaseStorage } from '@/hooks/useSupabaseStorage';
import { TaskFormProvider } from '@/contexts/TaskFormContext';
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Moon, Sun, ArrowLeft } from "lucide-react";
import { useTheme } from "next-themes";
import type { Project, Task } from '@/types/task';

const ProjectDetailWindow = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  const {
    tasks,
    projects,
    createTask,
    updateTask,
    deleteTask,
    createProject,
    updateProject,
    deleteProject,
    addFollowUp,
    refreshTasks
  } = useSupabaseStorage();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportProject, setReportProject] = useState<Project | null>(null);

  // Get project from URL params
  const projectId = searchParams.get('projectId');
  const projectName = searchParams.get('projectName');
  
  const project = projectId 
    ? projects.find(p => p.id === projectId)
    : projects.find(p => p.name === projectName);

  useEffect(() => {
    if (!project && projects.length > 0) {
      // If project not found, close the window or redirect
      console.error('Project not found');
    }
    
    // Set dynamic page title
    if (project) {
      document.title = `${project.name} - Project Details`;
    }
  }, [project, projects]);

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    const finalTaskData = {
      ...taskData,
      project: project?.name || taskData.project
    };
    await createTask(finalTaskData);
    refreshTasks();
  };

  const handleUpdateTask = async (task: Task) => {
    await updateTask(task);
    refreshTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    refreshTasks();
  };

  const handleUpdateProject = async (projectData: Project) => {
    await updateProject(projectData);
  };

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
    // Close the window after deletion
    window.close();
  };

  const handleGenerateReport = () => {
    if (project) {
      setReportProject(project);
      setIsReportModalOpen(true);
    }
  };

  const handleFollowUp = async (task: Task, followUpText: string) => {
    await addFollowUp(task.id, followUpText);
    refreshTasks();
  };

  const handleBackToMain = () => {
    // Try to focus the main window, or navigate there
    if (window.opener) {
      window.opener.focus();
      window.close();
    } else {
      navigate('/');
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested project could not be found.</p>
          <Button onClick={handleBackToMain}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-foreground">
                Project Detail - {project.name}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center gap-2"
                title="Toggle dark mode"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToMain}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ProjectDetailView
          project={project}
          tasks={tasks}
          allTasks={tasks}
          allProjects={projects}
          onBack={handleBackToMain}
          onEditProject={() => {}} // Not needed in separate window
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
          onCreateTask={() => {}} // Handled by global task form
          onEditTask={() => {}} // Handled by global task form
          onGenerateReport={handleGenerateReport}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onSaveTask={handleCreateTask}
        />
      </div>

      {/* Global Task Form */}
      <GlobalTaskForm />

      {/* Report Modal */}
      {isReportModalOpen && reportProject && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          project={reportProject}
          tasks={tasks.filter(task => task.project === reportProject.name)}
        />
      )}

      <Toaster />
    </div>
  );
};

// Wrapper with providers for standalone window
const ProjectDetailWindowWithProviders = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TaskFormProvider>
        <ProjectDetailWindow />
      </TaskFormProvider>
    </ThemeProvider>
  );
};

export default ProjectDetailWindowWithProviders;