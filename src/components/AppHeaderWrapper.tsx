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
    if (pathname === '/time-tracking') return 'timetracking';
    if (pathname === '/follow-ups') return 'followups';
    if (pathname.startsWith('/tasks/')) return 'task-edit';
    return 'tasks';
  };

  const activeView = getActiveViewFromPath(location.pathname);

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

  // Get current project name from state if available
  const selectedProjectName = location.state?.selectedProject || null;
  
  // Get editing task title
  const editingTaskTitle = taskNavigationState.selectedTask?.title || null;

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
      editingTaskTitle={editingTaskTitle}
      tasks={tasks}
    />
  );
};