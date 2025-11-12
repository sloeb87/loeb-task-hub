import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { Parameters } from './Parameters';
import { FavoritesDialog } from './FavoritesDialog';
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useTaskNavigation } from "@/contexts/TaskFormContext";
import { Task } from "@/types/task";

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

export const AppHeaderWrapper = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isParametersOpen, setIsParametersOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const { taskNavigationState } = useTaskNavigation();
  const { tasks: currentTasks, projects, refreshTasks, loadTaskById, loadAllTasks, updateTask } = useSupabaseStorage();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  
  // Load ALL tasks for timer display (not just current page/project)
  useEffect(() => {
    const loadAllTasksForTimer = async () => {
      try {
        // Only load tasks if not on project detail page to avoid duplicate calls
        if (!location.pathname.startsWith('/projects/')) {
          const tasks = await loadAllTasks();
          setAllTasks(tasks);
        }
      } catch (error) {
        console.error('Error loading all tasks for timer display:', error);
      }
    };

    loadAllTasksForTimer();
  }, [loadAllTasks, location.pathname]);

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

  // Memoized function to get project details with caching
  const getProjectDetails = useCallback((projectId: string) => {
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
  }, [projectCache, lastViewed.project, projects]);

  // Memoized function to get task details with caching
  const getTaskDetails = useCallback(async (taskId: string) => {
    // Check cache first
    if (taskCache.has(taskId)) {
      return taskCache.get(taskId);
    }

    // Check if already in lastViewed and still valid
    if (lastViewed.task?.id === taskId && 
        lastViewed.task.title !== 'Loading...' &&
        Date.now() - lastViewed.task.cachedAt < CACHE_DURATION) {
      return lastViewed.task;
    }

    // Find in loaded tasks first (faster)
    let task = currentTasks.find(t => t.id === taskId);
    
    // If not found in current paginated tasks, load from database
    if (!task) {
      console.log('Task not in current page, loading from database:', taskId);
      task = await loadTaskById(taskId);
    }
    
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
  }, [taskCache, lastViewed.task, currentTasks, loadTaskById]);

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

  // Memoized function to map routes to activeView
  const getActiveViewFromPath = useCallback((pathname: string) => {
    if (pathname === '/tasks') return 'tasks';
    if (pathname === '/meetings') return 'meetings';
    if (pathname === '/projects') return 'projects';
    if (pathname.startsWith('/projects/')) return 'project-details';
    if (pathname === '/time-tracking') return 'timetracking';
    if (pathname === '/follow-ups') return 'followups';
    if (pathname === '/notes') return 'notes';
    if (pathname.startsWith('/tasks/')) return 'task-edit';
    return 'tasks';
  }, []);

  const activeView = getActiveViewFromPath(location.pathname);

  // Track current project and task from URL and task navigation context
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
    // Also check if we have project info from task navigation context
    else if (taskNavigationState.projectId && taskNavigationState.projectName) {
      const contextProject: CachedItem = {
        id: taskNavigationState.projectId,
        name: taskNavigationState.projectName,
        cachedAt: Date.now()
      };
      if (!lastViewed.project || lastViewed.project.id !== taskNavigationState.projectId) {
        setLastViewed(prev => ({
          ...prev,
          project: contextProject
        }));
      }
    }
    // If we have project name from task but no ID, try to find the project ID
    else if (taskNavigationState.projectName && !taskNavigationState.projectId) {
      const foundProject = projects.find(p => p.name === taskNavigationState.projectName);
      if (foundProject) {
        const contextProject: CachedItem = {
          id: foundProject.id,
          name: foundProject.name,
          cachedAt: Date.now()
        };
        if (!lastViewed.project || lastViewed.project.id !== foundProject.id) {
          setLastViewed(prev => ({
            ...prev,
            project: contextProject
          }));
        }
      }
    }

    // Update last viewed task if on task details page
    if (location.pathname.startsWith('/tasks/') && location.pathname !== '/tasks') {
      const taskId = location.pathname.split('/tasks/')[1];
      if (taskId && taskId !== 'new') {
        if (!lastViewed.task || lastViewed.task.id !== taskId) {
          // Set loading state immediately
          setLastViewed(prev => ({
            ...prev,
            task: { id: taskId, title: 'Loading...', cachedAt: Date.now() }
          }));
          
          // Load task details asynchronously with better error handling
          getTaskDetails(taskId).then(taskDetails => {
            if (taskDetails) {
              setLastViewed(prev => ({
                ...prev,
                task: taskDetails
              }));
            } else {
              // If task loading fails, clear the loading state
              console.warn('Failed to load task details for:', taskId);
              setLastViewed(prev => ({
                ...prev,
                task: { id: taskId, title: `Task ${taskId}`, cachedAt: Date.now() }
              }));
            }
          }).catch(error => {
            console.error('Error loading task details:', error);
            setLastViewed(prev => ({
              ...prev,
              task: { id: taskId, title: `Task ${taskId}`, cachedAt: Date.now() }
            }));
          });
        }
      } else if (taskId === 'new') {
        // Clear task when creating new task
        setLastViewed(prev => ({
          ...prev,
          task: null
        }));
      }
    }
    // Also check if we have task info from task navigation context (prioritize this over loading)
    else if (taskNavigationState.selectedTask) {
      const contextTask: CachedItem = {
        id: taskNavigationState.selectedTask.id,
        title: taskNavigationState.selectedTask.title,
        cachedAt: Date.now()
      };
      if (!lastViewed.task || lastViewed.task.id !== taskNavigationState.selectedTask.id || lastViewed.task.title === 'Loading...') {
        setLastViewed(prev => ({
          ...prev,
          task: contextTask
        }));
      }
    }
  }, [location.pathname, taskNavigationState, getProjectDetails, getTaskDetails, lastViewed.project, lastViewed.task, projects]);

  const handleViewChange = (view: "tasks" | "meetings" | "projects" | "project-details" | "timetracking" | "followups" | "task-edit" | "meeting-edit" | "notes") => {
    switch (view) {
      case 'tasks':
        navigate('/tasks');
        break;
      case 'meetings':
        navigate('/meetings');
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
      case 'notes':
        navigate('/notes');
        break;
      case 'task-edit':
        // Navigate to the last viewed task if available
        if (lastViewed.task?.id) {
          navigate(`/tasks/${lastViewed.task.id}`);
        } else {
          navigate('/tasks/new');
        }
        break;
      case 'meeting-edit':
        // Navigate to the last viewed meeting if available
        if (lastViewed.task?.id) {
          navigate(`/tasks/${lastViewed.task.id}`);
        } else {
          navigate('/meetings');
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

  const handleOpenFavorites = useCallback(() => {
    setIsFavoritesOpen(true);
  }, []);

  const handleTaskClick = useCallback((task: Task) => {
    navigate(`/tasks/${task.id}`);
    setIsFavoritesOpen(false);
  }, [navigate]);

  const handleToggleFavorite = useCallback(async (task: Task) => {
    if (updateTask) {
      await updateTask({
        ...task,
        isFavorite: false
      });
      // Refresh the task list to update favorites
      await refreshTasks();
    }
  }, [updateTask, refreshTasks]);

  // Get favorite tasks
  const favoriteTasks = allTasks.filter(task => task.isFavorite);

  // Use cached last viewed items for immediate display
  const displayProject = lastViewed.project;
  const displayTask = lastViewed.task;
  
  // Get current project name from cached state
  const selectedProjectName = displayProject?.name || null;
  
  // Get editing task title from cached state
  const editingTaskTitle = displayTask?.title || null;
  const editingTaskId = displayTask?.id || null;

  return (
    <>
      <AppHeader
        activeView={activeView}
        onViewChange={handleViewChange}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenParameters={handleOpenParameters}
        onOpenFavorites={handleOpenFavorites}
        onBack={handleBack}
        selectedProjectName={selectedProjectName}
        selectedProjectId={null} // Remove ID display for cleaner look
        editingTaskTitle={editingTaskTitle}
        editingTaskId={editingTaskId}
        tasks={allTasks}
      />
      <Parameters 
        isOpen={isParametersOpen} 
        onClose={() => setIsParametersOpen(false)} 
      />
      <FavoritesDialog
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        favoriteTasks={favoriteTasks}
        onTaskClick={handleTaskClick}
        onToggleFavorite={handleToggleFavorite}
      />
    </>
  );
});