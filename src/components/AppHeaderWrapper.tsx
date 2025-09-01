import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useTaskNavigation } from "@/contexts/TaskFormContext";

interface LastViewedState {
  project: { id: string; name: string } | null;
  task: { id: string; title: string } | null;
}

export const AppHeaderWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isParametersOpen, setIsParametersOpen] = useState(false);
  const { taskNavigationState } = useTaskNavigation();
  const { tasks, projects, refreshTasks } = useSupabaseStorage();

  // Persistent state for last viewed project and task
  const [lastViewed, setLastViewed] = useState<LastViewedState>(() => {
    const saved = localStorage.getItem('lastViewedItems');
    return saved ? JSON.parse(saved) : { project: null, task: null };
  });

  // Save to localStorage whenever lastViewed changes
  useEffect(() => {
    localStorage.setItem('lastViewedItems', JSON.stringify(lastViewed));
  }, [lastViewed]);

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

  // Track current project and task from URL and update lastViewed state
  useEffect(() => {
    // Update last viewed project if on project details page
    if (location.pathname.startsWith('/projects/')) {
      const projectId = location.pathname.split('/projects/')[1];
      const project = projects.find(p => p.id === projectId);
      if (project && (!lastViewed.project || lastViewed.project.id !== projectId)) {
        setLastViewed(prev => ({
          ...prev,
          project: { id: projectId, name: project.name }
        }));
      }
    }

    // Update last viewed task if on task details page
    if (location.pathname.startsWith('/tasks/') && location.pathname !== '/tasks') {
      const taskId = location.pathname.split('/tasks/')[1];
      if (taskId && taskId !== 'new') {
        const task = tasks.find(t => t.id === taskId);
        if (task && (!lastViewed.task || lastViewed.task.id !== taskId)) {
          setLastViewed(prev => ({
            ...prev,
            task: { id: taskId, title: task.title }
          }));
        } else if (!task && (!lastViewed.task || lastViewed.task.id !== taskId)) {
          // Task not loaded yet, store with placeholder
          setLastViewed(prev => ({
            ...prev,
            task: { id: taskId, title: 'Loading...' }
          }));
        }
      } else if (taskId === 'new') {
        // Clear task when creating new task
        setLastViewed(prev => ({
          ...prev,
          task: null
        }));
      }
    }
  }, [location.pathname, projects, tasks, lastViewed.project, lastViewed.task]);

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
        // Navigate back to the last viewed project if available
        if (lastViewed.project?.id) {
          navigate(`/projects/${lastViewed.project.id}`);
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
        // Navigate to the last viewed task if available
        if (lastViewed.task?.id) {
          navigate(`/tasks/${lastViewed.task.id}`);
        } else {
          navigate('/tasks/new');
        }
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
  
  // Use persistent last viewed items for display, with current items as fallback
  const displayProject = lastViewed.project;
  const displayTask = lastViewed.task;
  
  // Get current project name from state if available (legacy support)
  const selectedProjectName = displayProject?.name || (location.state as any)?.selectedProject || null;
  
  // Get editing task title
  const editingTaskTitle = displayTask?.title || taskNavigationState.selectedTask?.title || null;
  const editingTaskId = displayTask?.id || taskNavigationState.selectedTask?.id || null;

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