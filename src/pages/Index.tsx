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
import ProjectsPage from "./Projects";
import Parameters from "@/components/Parameters";
import { useTaskStorage } from "@/hooks/useTaskStorage";
import { useProjectStorage } from "@/hooks/useProjectStorage";
import { useTaskFilters, FilterType } from "@/hooks/useTaskFilters";

const Index = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Custom hooks for optimized data management
  const { 
    tasks, 
    isLoading: tasksLoading, 
    error: tasksError, 
    createTask, 
    updateTask, 
    addFollowUp,
    deleteTask 
  } = useTaskStorage();

  // Use project storage hook
  const {
    projects,
    isLoading: projectsLoading,
    error: projectsError,
    createProject,
    updateProject,
    deleteProject
  } = useProjectStorage();

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

  // State management
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [followUpTask, setFollowUpTask] = useState<Task | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeView, setActiveView] = useState<"tasks" | "dashboard" | "projects">("tasks");
  const [isParametersOpen, setIsParametersOpen] = useState(false);
  const [projectFilter, setProjectFilter] = useState<'all' | 'active' | 'on-hold' | 'completed'>('all');

  // Use optimized filtering hook
  const { filteredTasks, taskCounts } = useTaskFilters(tasks, activeFilter);

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

  const handleAddFollowUpWrapper = useCallback((taskId: string, followUpText: string) => {
    addFollowUp(taskId, followUpText);
    setFollowUpTask(null);
  }, [addFollowUp]);

  const handleFollowUpTask = useCallback((updatedTask: Task) => {
    console.log('Index - handleFollowUpTask called with:', updatedTask.id, updatedTask.title);
    updateTask(updatedTask);
  }, [updateTask]);

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
      const project = projects.find(p => p.id === projectId);
      if (!project) return;
      
      // Delete all tasks associated with this project first
      const tasksToDelete = tasks.filter(task => task.project === project.name);
      for (const task of tasksToDelete) {
        await deleteTask(task.id);
      }
      
      // Delete the project
      await deleteProject(projectId);
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  }, [projects, tasks, deleteTask, deleteProject]);

  const handleDeleteTask = useCallback((taskId: string) => {
    deleteTask(taskId);
  }, [deleteTask]);

  const handleSaveTask = useCallback(async (taskData: Task | Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    try {
      console.log('Index - handleSaveTask called with:', taskData);
      if ('id' in taskData) {
        // Updating existing task
        await updateTask(taskData as Task);
      } else {
        // Creating new task
        await createTask(taskData);
      }
      setIsTaskFormOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  }, [updateTask, createTask]);

  // Show loading state
  if (tasksLoading || projectsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (tasksError || projectsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error: {tasksError || projectsError}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <AppHeader 
        activeView={activeView}
        onViewChange={setActiveView}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenParameters={() => setIsParametersOpen(true)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === "tasks" ? (
          <>
            {/* Task Management Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <ListTodo className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Management</h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Create, assign, and track individual tasks</p>
                </div>
              </div>
              <Button onClick={() => setIsTaskFormOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Task
              </Button>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-border p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Showing {filteredTasks.length} of {taskCounts.total} tasks
                </div>
              </div>
            </div>

            <TaskSummaryCardsOptimized 
              tasks={tasks}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

            <TaskTable 
              tasks={filteredTasks} 
              onEditTask={handleEditTask} 
              onFollowUp={handleFollowUpTask} 
            />
          </>
        ) : activeView === "dashboard" ? (
          <KPIDashboard 
            tasks={tasks} 
            projects={projects} 
            onEditTask={handleEditTask} 
          />
        ) : (
          <ProjectsPage 
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
          />
        )}

        {/* Task Form Dialog */}
        <TaskFormOptimized 
          isOpen={isTaskFormOpen} 
          onClose={() => {
            setIsTaskFormOpen(false);
            setSelectedTask(null);
          }} 
          onSave={handleSaveTask} 
          onDelete={handleDeleteTask}
          task={selectedTask} 
          allTasks={tasks}
          allProjects={projects}
        />

        {/* Follow Up Dialog */}
        {followUpTask && (
          <FollowUpDialog 
            isOpen={!!followUpTask} 
            onClose={() => setFollowUpTask(null)} 
            onAddFollowUp={text => handleAddFollowUpWrapper(followUpTask.id, text)} 
            task={followUpTask} 
          />
        )}

        {/* Parameters Dialog */}
        <Parameters isOpen={isParametersOpen} onClose={() => setIsParametersOpen(false)} />
      </div>
    </div>
  );
};

export default Index;
