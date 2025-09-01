import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useTaskNavigation } from "@/contexts/TaskFormContext";

export const AppHeaderWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isParametersOpen, setIsParametersOpen] = useState(false);
  const { taskNavigationState } = useTaskNavigation();
  const { tasks, refreshTasks } = useSupabaseStorage();

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

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('dark-mode', JSON.stringify(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Map routes to activeView
  const getActiveViewFromPath = (pathname: string) => {
    if (pathname === '/tasks') return 'tasks';
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/projects') return 'projects';
    if (pathname.startsWith('/projects/')) return 'project-details';
    if (pathname === '/time-tracking') return 'timetracking';
    if (pathname === '/follow-ups') return 'followups';
    if (pathname.startsWith('/tasks/')) return 'task-edit';
    return 'tasks';
  };

  const activeView = getActiveViewFromPath(location.pathname);

  // Get current project name from URL if on project details page
  const getCurrentProjectFromUrl = () => {
    if (location.pathname.startsWith('/projects/')) {
      const encodedProjectName = location.pathname.split('/projects/')[1];
      return decodeURIComponent(encodedProjectName);
    }
    return null;
  };

  const currentProjectName = getCurrentProjectFromUrl();

  const handleViewChange = (view: "tasks" | "dashboard" | "projects" | "project-details" | "timetracking" | "followups" | "task-edit") => {
    switch (view) {
      case 'tasks':
        navigate('/tasks');
        break;
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'projects':
        navigate('/projects');
        break;
      case 'project-details':
        // Navigate back to the current project details if available
        if (currentProjectName) {
          navigate(`/projects/${encodeURIComponent(currentProjectName)}`);
        } else {
          navigate('/projects');
        }
        break;
      case 'timetracking':
        navigate('/time-tracking');
        break;
      case 'followups':
        navigate('/follow-ups');
        break;
      case 'task-edit':
        navigate('/tasks/new');
        break;
      default:
        navigate('/tasks');
    }
  };

  const handleRefresh = async () => {
    await refreshTasks();
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleOpenParameters = () => {
    setIsParametersOpen(true);
  };

  // Get editing task title and ID from URL if on task edit page
  const getCurrentTaskFromUrl = () => {
    if (location.pathname.startsWith('/tasks/') && location.pathname !== '/tasks') {
      const taskId = location.pathname.split('/tasks/')[1];
      if (taskId && taskId !== 'new') {
        const task = tasks.find(t => t.id === taskId);
        return task ? { id: taskId, title: task.title } : { id: taskId, title: 'Loading...' };
      }
      return { id: 'new', title: 'New Task' };
    }
    return null;
  };

  const currentTask = getCurrentTaskFromUrl();
  
  // Get current project name from state if available (legacy support)
  const selectedProjectName = currentProjectName || (location.state as any)?.selectedProject || null;
  
  // Get editing task title
  const editingTaskTitle = currentTask?.title || taskNavigationState.selectedTask?.title || null;
  const editingTaskId = currentTask?.id || taskNavigationState.selectedTask?.id || null;

  return (
    <AppHeader
      activeView={activeView}
      onViewChange={handleViewChange}
      isDarkMode={isDarkMode}
      onToggleDarkMode={toggleDarkMode}
      onOpenParameters={handleOpenParameters}
      onRefresh={handleRefresh}
      onBack={handleBack}
      selectedProjectName={selectedProjectName}
      selectedProjectId={null} // Remove ID display for cleaner look
      editingTaskTitle={editingTaskTitle}
      editingTaskId={editingTaskId}
      tasks={tasks}
    />
  );
};