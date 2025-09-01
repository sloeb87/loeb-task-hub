import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useTaskNavigation } from "@/contexts/TaskFormContext";

interface CachedItem {
  id: string;
  name?: string;
  title?: string;
  cachedAt: number;
}

interface LastViewedState {
  project: CachedItem | null;
  task: CachedItem | null;
}

// Cache for 5 minutes to avoid constant refetching
const CACHE_DURATION = 5 * 60 * 1000;

export const AppHeaderWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isParametersOpen, setIsParametersOpen] = useState(false);
  const { taskNavigationState } = useTaskNavigation();
  const { tasks, projects, refreshTasks } = useSupabaseStorage();

  // Persistent state for last viewed project and task with caching
  const [lastViewed, setLastViewed] = useState<LastViewedState>(() => {
    const saved = localStorage.getItem('lastViewedItems');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check if cached data is still valid
        const now = Date.now();
        if (parsed.project && now - parsed.project.cachedAt > CACHE_DURATION) {
          parsed.project = null;
        }
        if (parsed.task && now - parsed.task.cachedAt > CACHE_DURATION) {
          parsed.task = null;
        }
        return parsed;
      } catch (e) {
        return { project: null, task: null };
      }
    }
    return { project: null, task: null };
  });

  // Cache for project and task details
  const [projectCache, setProjectCache] = useState<Map<string, CachedItem>>(new Map());
  const [taskCache, setTaskCache] = useState<Map<string, CachedItem>>(new Map());

  // Save to localStorage whenever lastViewed changes
  useEffect(() => {
    localStorage.setItem('lastViewedItems', JSON.stringify(lastViewed));
  }, [lastViewed]);

  // Function to get project details with caching
  const getProjectDetails = (projectId: string) => {
    // Check cache first
    if (projectCache.has(projectId)) {
      return projectCache.get(projectId);
    }
    
    // Check if already in lastViewed and still valid
    if (lastViewed.project?.id === projectId && 
        Date.now() - lastViewed.project.cachedAt < CACHE_DURATION) {
      return lastViewed.project;
    }

    // Find in loaded projects
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const cachedProject: CachedItem = {
        id: projectId,
        name: project.name,
        cachedAt: Date.now()
      };
      setProjectCache(prev => new Map(prev).set(projectId, cachedProject));
      return cachedProject;
    }

    return null;
  };

  // Function to get task details with caching
  const getTaskDetails = (taskId: string) => {
    // Check cache first
    if (taskCache.has(taskId)) {
      return taskCache.get(taskId);
    }

    // Check if already in lastViewed and still valid
    if (lastViewed.task?.id === taskId && 
        Date.now() - lastViewed.task.cachedAt < CACHE_DURATION) {
      return lastViewed.task;
    }

    // Find in loaded tasks
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const cachedTask: CachedItem = {
        id: taskId,
        title: task.title,
        cachedAt: Date.now()
      };
      setTaskCache(prev => new Map(prev).set(taskId, cachedTask));
      return cachedTask;
    }

    return null;
  };

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
      if (!lastViewed.project || lastViewed.project.id !== projectId) {
        const projectDetails = getProjectDetails(projectId);
        if (projectDetails) {
          setLastViewed(prev => ({
            ...prev,
            project: projectDetails
          }));
        }
      }
    }

    // Update last viewed task if on task details page
    if (location.pathname.startsWith('/tasks/') && location.pathname !== '/tasks') {
      const taskId = location.pathname.split('/tasks/')[1];
      if (taskId && taskId !== 'new') {
        if (!lastViewed.task || lastViewed.task.id !== taskId) {
          const taskDetails = getTaskDetails(taskId);
          if (taskDetails) {
            setLastViewed(prev => ({
              ...prev,
              task: taskDetails
            }));
          } else {
            // Create placeholder for task that's not loaded yet
            setLastViewed(prev => ({
              ...prev,
              task: { id: taskId, title: 'Loading...', cachedAt: Date.now() }
            }));
          }
        }
      } else if (taskId === 'new') {
        // Clear task when creating new task
        setLastViewed(prev => ({
          ...prev,
          task: null
        }));
      }
    }
  }, [location.pathname]);

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

  // Use cached last viewed items for immediate display
  const displayProject = lastViewed.project;
  const displayTask = lastViewed.task;
  
  // Get current project name from cached state
  const selectedProjectName = displayProject?.name || null;
  
  // Get editing task title from cached state
  const editingTaskTitle = displayTask?.title || null;
  const editingTaskId = displayTask?.id || null;

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