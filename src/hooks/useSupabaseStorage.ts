import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, Project, FollowUp } from '@/types/task';
import { useToast } from '@/hooks/use-toast';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface TaskCounts {
  active: number;
  completed: number;
  overdue: number;
  total: number;
}

// Utility function to convert Supabase task format to your Task type
const convertFromSupabase = (supabaseTask: any): Task => ({
  id: supabaseTask.id,
  creationDate: supabaseTask.creation_date,
  title: supabaseTask.title,
  description: supabaseTask.description || '',
  dueDate: supabaseTask.due_date,
  priority: supabaseTask.priority,
  status: supabaseTask.status,
  project: supabaseTask.project,
  responsible: supabaseTask.responsible,
  followUps: supabaseTask.follow_ups || [],
  isRecurring: supabaseTask.is_recurring || false,
  recurringPattern: supabaseTask.recurring_pattern || null,
  recurringStartDate: supabaseTask.recurring_start_date || null,
  recurringEndDate: supabaseTask.recurring_end_date || null,
  recurringInterval: supabaseTask.recurring_interval || null,
  recurringDaysOfWeek: supabaseTask.recurring_days_of_week || [],
  originalTaskId: supabaseTask.original_task_id || null,
});

// Utility function to convert your Task type to Supabase task format
const convertToSupabase = (task: Omit<Task, 'id' | 'creationDate' | 'followUps'> | Task): any => {
  const supabaseTask: any = {
    title: task.title,
    description: task.description,
    due_date: task.dueDate,
    priority: task.priority,
    status: task.status,
    project: task.project,
    responsible: task.responsible,
    is_recurring: task.isRecurring || false,
    recurring_pattern: task.recurringPattern || null,
    recurring_start_date: task.recurringStartDate || null,
    recurring_end_date: task.recurringEndDate || null,
    recurring_interval: task.recurringInterval || null,
    recurring_days_of_week: task.recurringDaysOfWeek || [],
    original_task_id: task.originalTaskId || null,
  };

  if ('id' in task) {
    supabaseTask.id = task.id;
  }

  return supabaseTask;
};

const loadTaskCounts = async (): Promise<TaskCounts> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*');

    if (error) {
      console.error("Error fetching tasks for counts:", error);
      return { active: 0, completed: 0, overdue: 0, total: 0 };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active = data.filter(task => task.status === 'active').length;
    const completed = data.filter(task => task.status === 'completed').length;
    const overdue = data.filter(task => task.status === 'active' && new Date(task.due_date) < today).length;
    const total = data.length;

    return { active, completed, overdue, total };
  } catch (error) {
    console.error("Error calculating task counts:", error);
    return { active: 0, completed: 0, overdue: 0, total: 0 };
  }
};

export function useSupabaseStorage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // New: track initial vs background loading
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [taskCounts, setTaskCounts] = useState<TaskCounts>({
    active: 0,
    completed: 0,
    overdue: 0,
    total: 0
  });
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>('');
  const { toast } = useToast();

  const loadTaskCounts = async (): Promise<TaskCounts> => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*');

      if (error) {
        console.error("Error fetching tasks for counts:", error);
        return { active: 0, completed: 0, overdue: 0, total: 0 };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const active = data.filter(task => task.status === 'active').length;
      const completed = data.filter(task => task.status === 'completed').length;
      const overdue = data.filter(task => task.status === 'active' && new Date(task.due_date) < today).length;
      const total = data.length;

      return { active, completed, overdue, total };
    } catch (error) {
      console.error("Error calculating task counts:", error);
      return { active: 0, completed: 0, overdue: 0, total: 0 };
    }
  };

  const loadTasks = useCallback(async (
    page: number = 1, 
    limit: number = 50, 
    sortBy: string = 'dueDate', 
    sortOrder: 'asc' | 'desc' = 'asc'
  ) => {
    try {
      // Only show loading for initial load or when changing pages
      if (isInitialLoading || page !== pagination.currentPage) {
        setIsLoading(true);
      }
      setError(null);

      const { data, error, count } = await supabase
        .from('tasks')
        .select('*, follow_ups(id, text, timestamp, taskStatus)', { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      setTasks(data.map(convertFromSupabase));
      setPagination({
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage
      });

      const newTaskCounts = await loadTaskCounts();
      setTaskCounts(newTaskCounts);
      
      setIsLoading(false);
      setIsInitialLoading(false); // Mark initial loading as complete
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [isInitialLoading, pagination.currentPage]);

  const refreshTasks = useCallback(async () => {
    // Background refresh - don't show loading spinner
    try {
      setError(null);

      const { data, error, count } = await supabase
        .from('tasks')
        .select('*, follow_ups(id, text, timestamp, taskStatus)', { count: 'exact' })
        .order('dueDate', { ascending: true })
        .range((pagination.currentPage - 1) * 50, pagination.currentPage * 50 - 1);

      if (error) {
        console.error('Error refreshing tasks:', error);
        throw error;
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / 50);
      const hasNextPage = pagination.currentPage < totalPages;
      const hasPreviousPage = pagination.currentPage > 1;

      setTasks(data.map(convertFromSupabase));
      setPagination({
        ...pagination,
        totalPages: totalPages,
        totalCount: totalCount,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage
      });

      const newTaskCounts = await loadTaskCounts();
      setTaskCounts(newTaskCounts);
      
    } catch (err) {
      console.error('Error refreshing tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh tasks');
    }
  }, [pagination.currentPage, currentSearchTerm]);

  const searchTasks = useCallback(async (
    searchTerm: string,
    page: number = 1,
    limit: number = 50,
    sortBy: string = 'dueDate',
    sortOrder: 'asc' | 'desc' = 'asc'
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      setCurrentSearchTerm(searchTerm);

      let query = supabase
        .from('tasks')
        .select('*, follow_ups(id, text, timestamp, taskStatus)', { count: 'exact' })
        .ilike('title', `%${searchTerm}%`)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        console.error('Error searching tasks:', error);
        throw error;
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      setTasks(data.map(convertFromSupabase));
      setPagination({
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage
      });

      const newTaskCounts = await loadTaskCounts();
      setTaskCounts(newTaskCounts);
    } catch (err) {
      console.error('Error searching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to search tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAllTasksForProject = useCallback(async (projectName: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('tasks')
        .select('*, follow_ups(id, text, timestamp, taskStatus)')
        .eq('project', projectName)
        .order('dueDate', { ascending: true });

      if (error) {
        console.error('Error fetching tasks for project:', error);
        throw error;
      }

      setTasks(data.map(convertFromSupabase));
    } catch (err) {
      console.error('Error loading tasks for project:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks for project');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'creationDate' | 'followUps'>) => {
    try {
      setIsLoading(true);
      setError(null);

      const supabaseTask = convertToSupabase(taskData);

      const { data, error } = await supabase
        .from('tasks')
        .insert([supabaseTask])
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        throw error;
      }

      toast({
        title: "Task created!",
        description: `Task "${taskData.title}" created successfully.`,
      })

    } catch (err) {
      console.error('Error creating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem creating your task.",
      })
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateTask = useCallback(async (updatedTask: Task) => {
    try {
      setIsLoading(true);
      setError(null);

      const supabaseTask = convertToSupabase(updatedTask);

      const { data, error } = await supabase
        .from('tasks')
        .update(supabaseTask)
        .eq('id', updatedTask.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        throw error;
      }

      // Optimistically update the tasks state
      setTasks(tasks =>
        tasks.map(task => (task.id === updatedTask.id ? { ...task, ...updatedTask } : task))
      );

      toast({
        title: "Task updated!",
        description: `Task "${updatedTask.title}" updated successfully.`,
      })

    } catch (err) {
      console.error('Error updating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem updating your task.",
      })
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        throw error;
      }

      setTasks(tasks => tasks.filter(task => task.id !== taskId));

      toast({
        title: "Task deleted!",
        description: `Task deleted successfully.`,
      })

    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem deleting your task.",
      })
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteAllRecurringTasks = useCallback(async (originalTaskId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('original_task_id', originalTaskId);

      if (error) {
        console.error('Error deleting all recurring tasks:', error);
        throw error;
      }

      setTasks(tasks => tasks.filter(task => task.originalTaskId !== originalTaskId));

      toast({
        title: "Recurring tasks deleted!",
        description: `All recurring tasks deleted successfully.`,
      })

    } catch (err) {
      console.error('Error deleting all recurring tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete all recurring tasks');
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem deleting all recurring tasks.",
      })
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateAllRecurringTasks = useCallback(async (originalTaskId: string, updatedTask: Task) => {
    try {
      setIsLoading(true);
      setError(null);

      const supabaseTask = convertToSupabase(updatedTask);

      const { data, error } = await supabase
        .from('tasks')
        .update(supabaseTask)
        .eq('original_task_id', originalTaskId)
        .select();

      if (error) {
        console.error('Error updating all recurring tasks:', error);
        throw error;
      }

      // Optimistically update the tasks state
      setTasks(tasks =>
        tasks.map(task => (task.originalTaskId === originalTaskId ? { ...task, ...updatedTask } : task))
      );

      toast({
        title: "Recurring tasks updated!",
        description: `All recurring tasks updated successfully.`,
      })

    } catch (err) {
      console.error('Error updating all recurring tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to update all recurring tasks');
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem updating all recurring tasks.",
      })
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getRelatedRecurringTasks = useCallback(async (originalTaskId: string): Promise<Task[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('tasks')
        .select('*, follow_ups(id, text, timestamp, taskStatus)')
        .eq('original_task_id', originalTaskId)
        .order('dueDate', { ascending: true });

      if (error) {
        console.error('Error fetching related recurring tasks:', error);
        throw error;
      }

      return data.map(convertFromSupabase);
    } catch (err) {
      console.error('Error fetching related recurring tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch related recurring tasks');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addFollowUp = useCallback(async (taskId: string, followUpText: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('follow_ups')
        .insert([{ task_id: taskId, text: followUpText }])
        .select()
        .single();

      if (error) {
        console.error('Error adding follow-up:', error);
        throw error;
      }

      // Refresh tasks to get updated follow-ups
      await refreshTasks();

      toast({
        title: "Follow-up added!",
        description: `Follow-up added successfully.`,
      })

    } catch (err) {
      console.error('Error adding follow-up:', err);
      setError(err instanceof Error ? err.message : 'Failed to add follow-up');
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem adding your follow-up.",
      })
    } finally {
      setIsLoading(false);
    }
  }, [refreshTasks, toast]);

  const updateFollowUp = useCallback(async (followUpId: string, text: string, timestamp?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const updateObject: { text: string, timestamp?: string } = { text };
      if (timestamp) {
        updateObject.timestamp = timestamp;
      }

      const { data, error } = await supabase
        .from('follow_ups')
        .update(updateObject)
        .eq('id', followUpId)
        .select()
        .single();

      if (error) {
        console.error('Error updating follow-up:', error);
        throw error;
      }

      // Refresh tasks to get updated follow-ups
      await refreshTasks();

      toast({
        title: "Follow-up updated!",
        description: `Follow-up updated successfully.`,
      })

    } catch (err) {
      console.error('Error updating follow-up:', err);
      setError(err instanceof Error ? err.message : 'Failed to update follow-up');
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem updating your follow-up.",
      })
    } finally {
      setIsLoading(false);
    }
  }, [refreshTasks, toast]);

  const deleteFollowUp = useCallback(async (followUpId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('follow_ups')
        .delete()
        .eq('id', followUpId);

      if (error) {
        console.error('Error deleting follow-up:', error);
        throw error;
      }

      // Refresh tasks to get updated follow-ups
      await refreshTasks();

      toast({
        title: "Follow-up deleted!",
        description: `Follow-up deleted successfully.`,
      })

    } catch (err) {
      console.error('Error deleting follow-up:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete follow-up');
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem deleting your follow-up.",
      })
    } finally {
      setIsLoading(false);
    }
  }, [refreshTasks, toast]);

  const createProject = useCallback(async (projectData: Omit<Project, 'id'>) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        throw error;
      }

      setProjects(prevProjects => [...prevProjects, { id: data.id, ...projectData }]);

      toast({
        title: "Project created!",
        description: `Project "${projectData.name}" created successfully.`,
      })

    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem creating your project.",
      })
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateProject = useCallback(async (updatedProject: Project) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('projects')
        .update(updatedProject)
        .eq('id', updatedProject.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        throw error;
      }

      setProjects(prevProjects =>
        prevProjects.map(project => (project.id === updatedProject.id ? updatedProject : project))
      );

      toast({
        title: "Project updated!",
        description: `Project "${updatedProject.name}" updated successfully.`,
      })

    } catch (err) {
      console.error('Error updating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project');
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem updating your project.",
      })
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('Error deleting project:', error);
        throw error;
      }

      setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));

      toast({
        title: "Project deleted!",
        description: `Project deleted successfully.`,
      })

    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem deleting your project.",
      })
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*');

        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
          setError(projectsError.message);
        } else {
          setProjects(projectsData || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching projects:', err);
        setError('Failed to load projects');
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    projects,
    isLoading,
    isInitialLoading, // Export the new initial loading state
    error,
    pagination,
    taskCounts,
    currentSearchTerm,
    loadTasks,
    searchTasks,
    loadAllTasksForProject,
    refreshTasks,
    createTask,
    updateTask,
    deleteTask,
    deleteAllRecurringTasks,
    updateAllRecurringTasks,
    getRelatedRecurringTasks,
    addFollowUp,
    updateFollowUp,
    deleteFollowUp,
    createProject,
    updateProject,
    deleteProject
  };
}
