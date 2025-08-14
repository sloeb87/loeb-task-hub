import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, ListTodo } from "lucide-react";
import { Task, Project } from "@/types/task";


import { TaskTable } from "@/components/TaskTable";
import { TaskFormOptimized } from "@/components/TaskFormOptimized";
// Lazy-load heavy views
const KPIDashboard = lazy(() => import("@/components/KPIDashboard").then(m => ({ default: m.KPIDashboard })));
const FollowUpDialog = lazy(() => import("@/components/FollowUpDialog").then(m => ({ default: m.FollowUpDialog })));
const ProjectsPage = lazy(() => import("./Projects"));
const ProjectDetailView = lazy(() => import("@/components/ProjectDetailView").then(m => ({ default: m.ProjectDetailView })));
const TimeTrackingPage = lazy(() => import("./TimeTracking"));
const FollowUpsPage = lazy(() => import("./FollowUps").then(m => ({ default: m.FollowUpsPage })));
import Parameters from "@/components/Parameters";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useTaskFilters, FilterType } from "@/hooks/useTaskFilters";
import { GlobalTaskForm } from "@/components/GlobalTaskForm";
import { TaskSummaryCardsOptimized } from "@/components/TaskSummaryCardsOptimized";
import { AppHeader } from "@/components/AppHeader";
import { RunningTimerDisplay } from "@/components/RunningTimerDisplay";
  
const Index = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null); // For project details view
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
    deleteProject,
    refreshTasks
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
  
  // Keep selectedTask in sync with latest tasks (so new follow-ups appear in edit form)
  useEffect(() => {
    if (!selectedTask) return;
    const fresh = tasks.find(t => t.id === selectedTask.id);
    if (fresh && fresh !== selectedTask) {
      setSelectedTask(fresh);
    }
  }, [tasks, selectedTask?.id]);
  
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
  const [activeView, setActiveView] = useState<"tasks" | "dashboard" | "projects" | "project-details" | "timetracking" | "followups">("tasks");

  // SEO: dynamic title, description, canonical per view
  useEffect(() => {
    const labels: Record<typeof activeView, string> = {
      tasks: "Task Management",
      dashboard: "KPI Dashboard", 
      projects: "Projects",
      "project-details": "Project Details",
      timetracking: "Time Tracking",
      followups: "Follow Ups",
    };
    const appName = "Task Tracker";
    document.title = `${labels[activeView]} | ${appName}`;

    const descText = `Manage ${labels[activeView].toLowerCase()} in ${appName}.`;
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = descText;

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = window.location.href;
  }, [activeView]);

  // Handle view changes and trigger refresh for time tracking
  const handleViewChange = (view: "tasks" | "dashboard" | "projects" | "project-details" | "timetracking" | "followups") => {
    setActiveView(view);
    
    // Trigger refresh when navigating to time tracking
    if (view === 'timetracking') {
      window.dispatchEvent(new CustomEvent('timeEntriesUpdated'));
    }
    
    // Clear selected project when navigating away from project details
    if (view !== 'project-details') {
      setSelectedProject(null);
    }
  };
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
  const handleCreateTask = useCallback(async (taskData: Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    await createTask(taskData);
    refreshTasks();
    setIsTaskFormOpen(false);
  }, [createTask, refreshTasks]);
  const handleUpdateTask = useCallback(async (updatedTask: Task) => {
    console.log('Index - handleUpdateTask called with:', updatedTask.id, updatedTask.title);
    await updateTask(updatedTask);
    refreshTasks();
    setSelectedTask(null);
    setIsTaskFormOpen(false);
  }, [updateTask, refreshTasks]);
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

  // Handler for when a project is selected for detail view
  const handleEditProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setActiveView("project-details");
  }, []);

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
          onViewChange={handleViewChange}
          isDarkMode={isDarkMode} 
          onToggleDarkMode={toggleDarkMode} 
          onOpenParameters={() => setIsParametersOpen(true)}
          onRefresh={refreshTasks}
          onBack={isProjectDetailView ? () => setIsProjectDetailView(false) : undefined}
          selectedProjectName={selectedProject?.name}
        />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {activeView === "tasks" ? (
            <>
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
            </>
          ) : activeView === "dashboard" ? (
            <Suspense fallback={<div className="py-10 text-center">Loading dashboard…</div>}>
              <KPIDashboard tasks={tasks} projects={projects} onEditTask={handleEditTask} />
            </Suspense>
          ) : activeView === "timetracking" ? (
            <Suspense fallback={<div className="py-10 text-center">Loading time tracking…</div>}>
              <TimeTrackingPage tasks={tasks} projects={projects} />
            </Suspense>
          ) : activeView === "followups" ? (
            <Suspense fallback={<div className="py-10 text-center">Loading follow-ups…</div>}>
              <FollowUpsPage tasks={tasks} onEditTask={handleEditTask} onUpdateFollowUp={handleUpdateFollowUpWrapper} />
            </Suspense>
          ) : activeView === "project-details" && selectedProject ? (
            <Suspense fallback={<div className="py-10 text-center">Loading project details…</div>}>
              <ProjectDetailView
                project={selectedProject}
                tasks={tasks}
                allTasks={tasks}
                allProjects={projects}
                onBack={() => setActiveView("projects")}
                onEditProject={() => {}} // Not needed in this context
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                onCreateTask={() => {}} // Handled by global task form
                onEditTask={() => {}} // Handled by global task form
                onGenerateReport={() => {}} // Could be implemented later
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onSaveTask={handleCreateTask}
              />
            </Suspense>
          ) : (
            <Suspense fallback={<div className="py-10 text-center">Loading projects…</div>}>
              <ProjectsPage 
                key="projects-page-stable" // Stable key to prevent remounts
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
                isInDetailView={isProjectDetailView}
                onEditProject={handleEditProject}
              />
            </Suspense>
          )}
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
          onDeleteFollowUp={handleDeleteFollowUpWrapper}
          onFollowUpTask={handleFollowUpTask}
          task={selectedTask} 
          allTasks={tasks} 
          allProjects={projects}
          onNavigateToProject={handleNavigateToProject}
        />

        {/* Follow Up Dialog */}
        {followUpTask && (
          <Suspense fallback={<div className="py-4 text-center">Loading…</div>}>
            <FollowUpDialog 
              isOpen={!!followUpTask} 
              onClose={() => setFollowUpTask(null)} 
              onAddFollowUp={text => handleAddFollowUpWrapper(followUpTask.id, text)} 
              onUpdateFollowUp={handleUpdateFollowUpWrapper}
              onDeleteFollowUp={handleDeleteFollowUpWrapper}
              task={followUpTask} 
            />
          </Suspense>
        )}

        {/* Global Task Form - Persists across all component remounts */}
        <GlobalTaskForm />

        {/* Parameters Dialog */}
        <Parameters isOpen={isParametersOpen} onClose={() => setIsParametersOpen(false)} />
      </div>
    </div>;
};
export default Index;