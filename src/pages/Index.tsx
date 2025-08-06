import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, ListTodo } from "lucide-react";
import { Task, Project } from "@/types/task";
import { mockProjects } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { TaskTable } from "@/components/TaskTable";
import { TaskFormOptimized } from "@/components/TaskFormOptimized";
import { KPIDashboard } from "@/components/KPIDashboard";
import { FollowUpDialog } from "@/components/FollowUpDialog";
import { TaskSummaryCardsOptimized } from "@/components/TaskSummaryCardsOptimized";
import { AppHeader } from "@/components/AppHeader";
import { RunningTimerDisplay } from "@/components/RunningTimerDisplay";
import ProjectsPage from "./Projects";
import TimeTrackingPage from "./TimeTracking";
import { FollowUpsPage } from "./FollowUps";
import Parameters from "@/components/Parameters";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useTaskFilters, FilterType } from "@/hooks/useTaskFilters";
import { GlobalTaskForm } from "@/components/GlobalTaskForm";
const Index = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Custom hooks for optimized data management
  const {
    tasks,
    projects: supabaseProjects,
    isLoading,
    error,
    createTask,
    updateTask,
    addFollowUp,
    updateFollowUp,
    deleteFollowUp,
    deleteTask,
    createProject,
    updateProject,
    deleteProject
  } = useSupabaseStorage();


  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('dark-mode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedDarkMode ? JSON.parse(savedDarkMode) : prefersDark;
    setIsDarkMode(shouldUseDark);
    if (shouldUseDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('dark-mode', JSON.stringify(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Use only Supabase projects (no fallback to mock data)
  const projects = supabaseProjects;
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Add debugging for task form state changes
  useEffect(() => {
    console.log('INDEX - Task form state changed:', { 
      isTaskFormOpen, 
      selectedTaskId: selectedTask?.id || 'new task',
      visibilityState: document.visibilityState,
      documentHasFocus: document.hasFocus()
    });
  }, [isTaskFormOpen, selectedTask]);
  
  // Prevent task form from closing accidentally on window focus changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('INDEX - Visibility changed:', {
        visibilityState: document.visibilityState,
        isTaskFormOpen,
        documentHasFocus: document.hasFocus()
      });
      
      // Prevent any unintended state changes when window becomes visible/hidden
      if (document.visibilityState === 'visible' && isTaskFormOpen) {
        // Ensure form stays open when coming back to the window
        console.log('INDEX - Window became visible - keeping task form open');
      }
    };

    const handleFocusChange = () => {
      console.log('INDEX - Window focus changed:', {
        hasFocus: document.hasFocus(),
        isTaskFormOpen,
        activeElement: document.activeElement?.tagName
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocusChange);
    window.addEventListener('blur', handleFocusChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocusChange);
      window.removeEventListener('blur', handleFocusChange);
    };
  }, [isTaskFormOpen]);
  const [followUpTask, setFollowUpTask] = useState<Task | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("active");
  const [activeView, setActiveView] = useState<"tasks" | "dashboard" | "projects" | "timetracking" | "followups">("tasks");
  const [isParametersOpen, setIsParametersOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState<'all' | 'active' | 'on-hold' | 'completed'>('active');
  const [projectToShowDetails, setProjectToShowDetails] = useState<string | null>(null);
  
  // Debug activeView changes to see if this is causing Projects component remount
  React.useEffect(() => {
    console.log('INDEX - activeView changed:', activeView);
  }, [activeView]);
  
  // Track when projects page is in detail view
  const [isProjectDetailView, setIsProjectDetailView] = useState(false);

  // Use optimized filtering hook
  const {
    filteredTasks,
    taskCounts
  } = useTaskFilters(tasks, activeFilter);

  // Event handlers using useCallback for optimization
  const handleCreateTask = useCallback((taskData: Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    createTask(taskData);
    setIsTaskFormOpen(false);
  }, [createTask]);
  const handleUpdateTask = useCallback((updatedTask: Task) => {
    console.log('Index - handleUpdateTask called with:', updatedTask.id, updatedTask.title);
    updateTask(updatedTask);
    setSelectedTask(null);
    setIsTaskFormOpen(false);
  }, [updateTask]);
  const handleEditTask = useCallback((task: Task) => {
    console.log('Index - handleEditTask called with task:', task);
    console.log('Task object properties:', Object.keys(task));
    setSelectedTask(task);
    setIsTaskFormOpen(true);
  }, []);
  const handleAddFollowUpWrapper = useCallback(async (taskId: string, followUpText: string) => {
    try {
      await addFollowUp(taskId, followUpText);
      setFollowUpTask(null);
    } catch (error) {
      console.error('Failed to add follow-up:', error);
      // You could add a toast notification here
    }
  }, [addFollowUp]);

  const handleUpdateFollowUpWrapper = useCallback(async (taskId: string, followUpId: string, text: string, timestamp?: string) => {
    console.log('handleUpdateFollowUpWrapper called with:', { taskId, followUpId, text, timestamp });
    try {
      await updateFollowUp(followUpId, text, timestamp);
      console.log('Follow-up updated successfully');
      
      // Note: We don't set followUpTask here anymore because it opens the dialog
      // The task data will be automatically refreshed through the Supabase hook
    } catch (error) {
      console.error('Failed to update follow-up:', error);
    }
  }, [updateFollowUp]);

  const handleDeleteFollowUpWrapper = useCallback(async (followUpId: string) => {
    console.log('handleDeleteFollowUpWrapper called with:', { followUpId });
    try {
      await deleteFollowUp(followUpId);
      console.log('Follow-up deleted successfully');
    } catch (error) {
      console.error('Failed to delete follow-up:', error);
    }
  }, [deleteFollowUp]);


  const handleFollowUpTask = useCallback((task: Task) => {
    console.log('Index - handleFollowUpTask called with:', task.id, task.title);
    setFollowUpTask(task);
  }, []);
  const handleCreateProject = useCallback(async (projectData: Omit<Project, 'id'>) => {
    try {
      await createProject(projectData);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  }, [createProject]);
  const handleUpdateProject = useCallback(async (updatedProject: Project) => {
    try {
      await updateProject(updatedProject);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  }, [updateProject]);
  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      await deleteProject(projectId);
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  }, [deleteProject]);
  const handleDeleteTask = useCallback((taskId: string) => {
    deleteTask(taskId);
  }, [deleteTask]);
  const handleSaveTask = useCallback((taskData: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    console.log('Index - handleSaveTask called with:', taskData);
    if ('id' in taskData) {
      // Updating existing task
      handleUpdateTask(taskData as Task);
    } else {
      // Creating new task
      handleCreateTask(taskData);
    }
  }, [handleUpdateTask, handleCreateTask]);

  const handleNavigateToProject = useCallback((projectName: string) => {
    setProjectToShowDetails(projectName);
    setActiveView("projects");
    // Reset project details after a short delay to ensure it only triggers once
    setTimeout(() => setProjectToShowDetails(null), 100);
  }, []);

  // Show loading state
  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading tasks...</p>
        </div>
      </div>;
  }

  // Show error state
  if (error) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error: {error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader 
        activeView={activeView} 
        onViewChange={setActiveView} 
        isDarkMode={isDarkMode} 
        onToggleDarkMode={toggleDarkMode} 
        onOpenParameters={() => setIsParametersOpen(true)}
        onBack={isProjectDetailView ? () => setIsProjectDetailView(false) : undefined}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {activeView === "tasks" ? <>
            {/* Task Management Header */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <ListTodo className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Management</h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Create, assign, and track individual tasks</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <RunningTimerDisplay tasks={tasks} />
                <Button onClick={() => {
                  console.log('INDEX - New Task button clicked');
                  setIsTaskFormOpen(true);
                }} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Task
                </Button>
              </div>
            </div>

            {/* Controls */}
            

            <TaskSummaryCardsOptimized tasks={tasks} activeFilter={activeFilter} onFilterChange={setActiveFilter} />

            <TaskTable tasks={filteredTasks} onEditTask={handleEditTask} onFollowUp={handleFollowUpTask} />
          </> : activeView === "dashboard" ? <KPIDashboard tasks={tasks} projects={projects} onEditTask={handleEditTask} /> : activeView === "timetracking" ? <TimeTrackingPage tasks={tasks} projects={projects} /> : activeView === "followups" ? <FollowUpsPage tasks={tasks} onEditTask={handleEditTask} onUpdateFollowUp={handleUpdateFollowUpWrapper} /> : <ProjectsPage 
            tasks={tasks} 
            projects={projects} 
            onCreateProject={handleCreateProject} 
            onUpdateProject={handleUpdateProject} 
            onDeleteProject={handleDeleteProject} 
            onCreateTask={handleCreateTask} 
            onUpdateTask={handleUpdateTask} 
            onDeleteTask={handleDeleteTask} 
            projectFilter={projectFilter} 
            setProjectFilter={setProjectFilter} 
            onAddFollowUp={handleAddFollowUpWrapper} 
            initialDetailProject={projectToShowDetails}
            onBackToList={() => setIsProjectDetailView(false)}
          />}
        </div>

        {/* Task Form Dialog */}
        <TaskFormOptimized 
          isOpen={isTaskFormOpen} 
          onClose={() => {
            setIsTaskFormOpen(false);
            setSelectedTask(null);
          }} 
          onSave={handleSaveTask} 
          onDelete={handleDeleteTask} 
          onAddFollowUp={handleAddFollowUpWrapper}
          onUpdateFollowUp={handleUpdateFollowUpWrapper}
          onFollowUpTask={handleFollowUpTask}
          task={selectedTask} 
          allTasks={tasks} 
          allProjects={projects}
          onNavigateToProject={handleNavigateToProject}
        />

        {/* Follow Up Dialog */}
        {followUpTask && (
          <FollowUpDialog 
            isOpen={!!followUpTask} 
            onClose={() => setFollowUpTask(null)} 
            onAddFollowUp={text => handleAddFollowUpWrapper(followUpTask.id, text)} 
            onUpdateFollowUp={handleUpdateFollowUpWrapper}
            onDeleteFollowUp={handleDeleteFollowUpWrapper}
            task={followUpTask} 
          />
        )}

        {/* Global Task Form - Persists across all component remounts */}
        <GlobalTaskForm />

        {/* Parameters Dialog */}
        <Parameters isOpen={isParametersOpen} onClose={() => setIsParametersOpen(false)} />
      </div>
    </div>;
};
export default Index;