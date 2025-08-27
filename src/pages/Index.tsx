import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ListTodo, ArrowLeft, Play, CheckCircle } from "lucide-react";
import { Task, Project } from "@/types/task";
import { useLocation } from 'react-router-dom';


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
import { TaskSummaryCardsOptimized } from "@/components/TaskSummaryCardsOptimized";
import { AppHeader } from "@/components/AppHeader";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { useTaskNavigation } from "@/contexts/TaskFormContext";
  
  const Index = () => {
  const location = useLocation();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null); // For project details view
  const [isDarkMode, setIsDarkMode] = useState(false);

  

  // ... rest of component
  
  // Time tracking hook
  const { startTimer } = useTimeTracking();

  // Task navigation hook for second header navigation
  const { taskNavigationState, setNavigationCallback, updateSelectedTask } = useTaskNavigation();

  // Custom hooks for optimized data management
  const {
    tasks,
    projects: supabaseProjects,
    isLoading,
    error,
    pagination,
    taskCounts,
    currentSearchTerm, // Destructure current search term
    loadTasks,
    searchTasks,
    loadAllTasksForProject,
    createTask,
    updateTask,
    addFollowUp,
    updateFollowUp,
    deleteFollowUp,
    deleteTask,
    deleteAllRecurringTasks,
    updateAllRecurringTasks,
    getRelatedRecurringTasks,
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
      // Also update navigation state
      updateSelectedTask(fresh);
    }
  }, [tasks, selectedTask?.id]); // Removed updateSelectedTask from dependencies
  
  const [followUpTask, setFollowUpTask] = useState<Task | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("active");
  const [activeView, setActiveView] = useState<"tasks" | "dashboard" | "projects" | "project-details" | "timetracking" | "followups" | "task-edit">("tasks");
  const [sortField, setSortField] = useState<string>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Handle navigation state from chart clicks
  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      if (state.activeView && state.dateFilter) {
        // Switch to the requested view
        setActiveView(state.activeView);
        
        console.log('Navigating from chart click to view:', state.activeView, 'with date filter:', state.dateFilter);
      } else if (state.view && state.dateFilter) {
        // Legacy support for 'view' property
        setActiveView(state.view);
        
        console.log('Navigating from chart click to view:', state.view, 'with date filter:', state.dateFilter);
      }
    }
  }, [location.state]);

  // SEO: dynamic title, description, canonical per view
  useEffect(() => {
    const labels: Record<typeof activeView, string> = {
      tasks: "Task Management",
      dashboard: "KPI Dashboard", 
      projects: "Projects",
      "project-details": "Project Details",
      timetracking: "Time Tracking",
      followups: "Follow Ups",
      "task-edit": "Task Edit",
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
  const handleViewChange = (view: "tasks" | "dashboard" | "projects" | "project-details" | "timetracking" | "followups" | "task-edit") => {
    setActiveView(view);
    
    // Set active filter and sorting when navigating to tasks view (same as clicking Active label)
    if (view === "tasks") {
      setActiveFilter("active");
      // Apply the same sorting as clicking the Active card
      handleSortChange('dueDatePriority', 'asc');
    }
    
    // Clear any navigation state/filters when switching to main views
    if (view === "tasks" || view === "projects" || view === "followups" || view === "dashboard" || view === "timetracking") {
      // Replace current history state to clear any date filters from chart clicks
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    // Trigger refresh when navigating to time tracking
    if (view === 'timetracking') {
      window.dispatchEvent(new CustomEvent('timeEntriesUpdated'));
    }
    
    // Don't clear selected project when navigating between tabs
    // Selected project should persist until a new project is explicitly selected
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
    filteredTasks
  } = useTaskFilters(tasks, activeFilter, location.state?.dateFilter);

  // Event handlers using useCallback for optimization
  const handleCreateTask = useCallback(async (taskData: Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    await createTask(taskData);
    refreshTasks();
    setActiveView("tasks");
  }, [createTask, refreshTasks]);
   const handleUpdateTask = useCallback(async (updatedTask: Task) => {
    console.log('Index - handleUpdateTask called with:', updatedTask.id, updatedTask.title);
    try {
      await updateTask(updatedTask);
      await refreshTasks();
      
      // Keep the updated task selected and stay in edit view to maintain focus
      const refreshedTask = tasks.find(t => t.id === updatedTask.id);
      if (refreshedTask) {
        setSelectedTask(refreshedTask);
      }
      // Stay in task-edit view instead of switching back to tasks
      console.log('Task updated successfully, maintaining edit view');
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  }, [updateTask, refreshTasks, tasks]);
  const handleEditTask = useCallback((task: Task) => {
    setSelectedTask(task);
    // Also update navigation state
    updateSelectedTask(task);
    // Find and set the corresponding project for the task
    const taskProject = projects.find(project => project.name === task.project);
    if (taskProject) {
      setSelectedProject(taskProject);
    }
    setActiveView("task-edit");
  }, [projects]); // Removed updateSelectedTask from dependencies

  // Set up navigation callback for timer and other components  
  useEffect(() => {
    const handleNavigateToTaskEdit = (projectName?: string, task?: Task, contextKey?: string) => {
      console.log('INDEX - Navigation callback triggered:', { projectName, taskId: task?.id, contextKey });
      if (task) {
        handleEditTask(task);
      } else {
        // New task creation
        setSelectedTask(null);
        if (projectName) {
          const project = projects.find(p => p.name === projectName);
          if (project) setSelectedProject(project);
        }
        setActiveView("task-edit");
      }
    };
    
    setNavigationCallback(handleNavigateToTaskEdit);
  }, [handleEditTask, projects]);
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

  // Handler to explicitly clear selected project (can be used for "close" functionality)
  const handleClearSelectedProject = useCallback(() => {
    setSelectedProject(null);
    if (activeView === "project-details") {
      setActiveView("projects"); // Navigate back to projects if we're on project details
    }
  }, [activeView]);

  const handleNavigateToProject = useCallback((projectName: string) => {
    setProjectToShowDetails(projectName);
    setActiveView("projects");
    // Reset project details after a short delay to ensure it only triggers once
    setTimeout(() => setProjectToShowDetails(null), 100);
  }, []);

  // Pagination and sorting handlers
  const handlePageChange = useCallback((page: number) => {
    if (currentSearchTerm) {
      // If there's an active search, maintain the search with new page
      searchTasks(currentSearchTerm, page, 50, sortField, sortDirection);
    } else {
      loadTasks(page, 50, sortField, sortDirection);
    }
  }, [loadTasks, searchTasks, currentSearchTerm, sortField, sortDirection]);

  const handleSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    if (currentSearchTerm) {
      // If there's an active search, maintain the search with new sorting
      searchTasks(currentSearchTerm, 1, 50, field, direction);
    } else {
      // Reload tasks with new sorting, reset to page 1
      loadTasks(1, 50, field, direction);
    }
  }, [loadTasks, searchTasks, currentSearchTerm]);

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
          selectedProjectId={selectedProject?.id}
          editingTaskTitle={selectedTask?.title}
          editingTaskId={selectedTask?.id}
          tasks={tasks}
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
                
                <Button onClick={() => {
                  console.log('INDEX - New Task button clicked');
                  setSelectedTask(null);
                  setActiveView("task-edit");
                }} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Task
                </Button>
              </div>

              {/* Controls */}
              
              {/* Date Filter Indicator for Tasks */}
              {location.state?.dateFilter && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Filtered by Date: {new Date(location.state.dateFilter.from).toLocaleDateString()} - {new Date(location.state.dateFilter.to).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Showing {filteredTasks.length} of {tasks.length} tasks
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          window.history.replaceState({}, '', window.location.pathname);
                          window.location.reload();
                        }}
                        className="text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/40"
                      >
                        Clear Filter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <TaskSummaryCardsOptimized 
                tasks={tasks} 
                taskCounts={taskCounts}
                activeFilter={activeFilter} 
                onFilterChange={setActiveFilter}
                onSortChange={handleSortChange}
                dateFilter={location.state?.dateFilter}
              />

              {filteredTasks.length > 0 ? (
                <>
              <TaskTable 
                tasks={filteredTasks} 
                onEditTask={handleEditTask} 
                onFollowUp={handleFollowUpTask}
                pagination={pagination}
                onPageChange={handlePageChange}
                isLoading={isLoading}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
                onSearch={searchTasks}
                currentSearchTerm={currentSearchTerm} // Pass current search term
              />
                </>
              ) : location.state?.dateFilter ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">No tasks found for selected date range</p>
                      <p className="mb-4">No tasks were created during {new Date(location.state.dateFilter.from).toLocaleDateString()} - {new Date(location.state.dateFilter.to).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">No tasks yet</p>
                      <p className="mb-4">Create your first task to get started</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : activeView === "dashboard" ? (
            <Suspense fallback={<div className="py-10 text-center">Loading dashboard…</div>}>
              <KPIDashboard tasks={tasks} projects={projects} onEditTask={handleEditTask} />
            </Suspense>
          ) : activeView === "timetracking" ? (
            <Suspense fallback={<div className="py-10 text-center">Loading time tracking…</div>}>
              <TimeTrackingPage tasks={tasks} projects={projects} onEditTask={handleEditTask} />
            </Suspense>
          ) : activeView === "followups" ? (
            <Suspense fallback={<div className="py-10 text-center">Loading follow-ups…</div>}>
              <FollowUpsPage tasks={tasks} projects={projects} onEditTask={handleEditTask} onUpdateFollowUp={handleUpdateFollowUpWrapper} />
            </Suspense>
          ) : activeView === "task-edit" ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" onClick={() => setActiveView("tasks")} className="p-2">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center space-x-3">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {selectedTask ? (
                        <>
                          <span className="text-blue-600 dark:text-blue-400">{selectedTask.id}</span>_{selectedTask.title}
                        </>
                      ) : (
                        "Create New Task"
                      )}
                    </h1>
                    {selectedTask && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startTimer(selectedTask.id, selectedTask.title, selectedTask.project, selectedTask.responsible)}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20 transition-colors"
                        title="Start time tracking for this task"
                      >
                        <Play className="w-4 h-4" fill="currentColor" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <TaskFormOptimized 
                isOpen={true}
                onClose={() => {
                  setSelectedTask(null);
                  setActiveView("tasks");
                }}
                onSave={handleSaveTask}
                onDelete={handleDeleteTask}
                onDeleteAllRecurring={deleteAllRecurringTasks}
                onUpdateAllRecurring={updateAllRecurringTasks}
                onAddFollowUp={handleAddFollowUpWrapper}
                onUpdateFollowUp={handleUpdateFollowUpWrapper}
                onDeleteFollowUp={handleDeleteFollowUpWrapper}
                onFollowUpTask={handleFollowUpTask}
                task={selectedTask}
                allTasks={tasks}
                allProjects={projects}
                projectName={selectedProject?.name} // Pre-select project when creating from project details
                onEditRelatedTask={handleEditTask}
                onNavigateToProject={handleNavigateToProject}
                getRelatedRecurringTasks={getRelatedRecurringTasks}
                persistedFormData={undefined}
                onFormDataChange={undefined}
                renderInline={true}
              />
            </div>
          ) : activeView === "project-details" && selectedProject ? (
            <Suspense fallback={<div className="py-10 text-center">Loading project details…</div>}>
              <ProjectDetailView
                project={selectedProject}
                tasks={tasks}
                allTasks={tasks}
                allProjects={projects}
                loadAllTasksForProject={loadAllTasksForProject}
                onBack={() => setActiveView("projects")}
                onEditProject={() => {}} // Not needed in this context
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                onCreateTask={() => {
                  // Create new task with project pre-selected
                  setSelectedTask(null);
                  // selectedProject is already set for this detail view
                  setActiveView("task-edit");
                }} // Navigate to task-edit view for new task creation
                onEditTask={(task) => {
                  setSelectedTask(task);
                  // Find and set the corresponding project for the task
                  const taskProject = projects.find(project => project.name === task.project);
                  if (taskProject) {
                    setSelectedProject(taskProject);
                  }
                  setActiveView("task-edit");
                }} // Switch to task-edit view and update project when task is clicked
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
                chartDateFilter={location.state?.dateFilter}
              />
            </Suspense>
          )}
        </div>

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

        {/* Parameters Dialog */}
        <Parameters isOpen={isParametersOpen} onClose={() => setIsParametersOpen(false)} />
      </div>
    </div>;
};
export default Index;