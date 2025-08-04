import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, Project, FollowUp } from '@/types/task';
import { useAuth } from './useAuth';

interface SupabaseTask {
  id: string;
  task_number: string;
  scope: string;
  project_id: string | null;
  environment: string;
  task_type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  responsible: string;
  creation_date: string;
  start_date: string;
  due_date: string;
  completion_date: string | null;
  duration: number | null;
  dependencies: string[] | null;
  details: string | null;
  links: any;
  stakeholders: string[] | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface SupabaseProject {
  id: string;
  name: string;
  description: string | null;
  owner: string | null;
  user_id: string;
  scope: string;
  start_date: string;
  end_date: string;
  status: string;
  cost_center: string | null;
  links: any;
  created_at: string;
  updated_at: string;
}

export function useSupabaseStorage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const convertSupabaseTaskToTask = useCallback(async (supabaseTask: SupabaseTask): Promise<Task> => {
    // Fetch follow-ups for this task
    const { data: followUpsData } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('task_id', supabaseTask.id)
      .order('created_at', { ascending: true });

    const followUps: FollowUp[] = followUpsData?.map(fu => ({
      id: fu.id,
      text: fu.text,
      timestamp: fu.created_at,
      author: fu.author
    })) || [];

    // Get project name from project_id
    let projectName = '';
    if (supabaseTask.project_id) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('name')
        .eq('id', supabaseTask.project_id)
        .single();
      
      projectName = projectData?.name || '';
    }

    return {
      id: supabaseTask.task_number, // Use task_number as the ID for compatibility
      scope: supabaseTask.scope,
      project: projectName,
      environment: supabaseTask.environment,
      taskType: supabaseTask.task_type as any,
      title: supabaseTask.title,
      description: supabaseTask.description || '',
      status: supabaseTask.status as any,
      priority: supabaseTask.priority as any,
      responsible: supabaseTask.responsible,
      creationDate: supabaseTask.creation_date,
      startDate: supabaseTask.start_date,
      dueDate: supabaseTask.due_date,
      completionDate: supabaseTask.completion_date || undefined,
      duration: supabaseTask.duration || undefined,
      dependencies: supabaseTask.dependencies || [],
      followUps,
      details: supabaseTask.details || '',
      links: supabaseTask.links || {},
      stakeholders: supabaseTask.stakeholders || []
    };
  }, []);

  const convertSupabaseProjectToProject = (supabaseProject: SupabaseProject): Project => {
    return {
      id: supabaseProject.id,
      name: supabaseProject.name,
      description: supabaseProject.description || '',
      owner: supabaseProject.owner || '',
      team: [], // Will need to be handled separately if needed
      startDate: supabaseProject.start_date,
      endDate: supabaseProject.end_date,
      status: supabaseProject.status as any,
      tasks: [], // Will be populated from tasks
      scope: supabaseProject.scope,
      cost_center: supabaseProject.cost_center || undefined,
      links: supabaseProject.links || {}
    };
  };

  const loadTasks = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const convertedTasks = await Promise.all(
        (data || []).map(convertSupabaseTaskToTask)
      );

      setTasks(convertedTasks);
      setError(null);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, convertSupabaseTaskToTask]);

  const loadProjects = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProjects([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const convertedProjects = (data || []).map(convertSupabaseProjectToProject);
      setProjects(convertedProjects);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
      loadProjects();
    } else {
      setTasks([]);
      setProjects([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, loadTasks, loadProjects]);

  const createTask = async (taskData: Omit<Task, 'id' | 'creationDate' | 'followUps'>): Promise<Task> => {
    if (!user) throw new Error('User not authenticated');

    console.log('Creating task with data:', taskData);
    console.log('User:', user);

    try {
      // Find the project ID from the project name
      let projectId = null;
      if (taskData.project) {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id')
          .eq('name', taskData.project)
          .eq('user_id', user.id)
          .single();
        
        if (projectError) {
          console.error('Error finding project:', projectError);
        } else {
          projectId = projectData?.id;
        }
      }

      console.log('Found project ID:', projectId, 'for project name:', taskData.project);

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          task_number: 'temp', // Will be replaced by trigger
          scope: taskData.scope,
          project_id: projectId,
          environment: taskData.environment,
          task_type: taskData.taskType,
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          responsible: taskData.responsible,
          start_date: taskData.startDate,
          due_date: taskData.dueDate,
          completion_date: taskData.completionDate || null,
          duration: taskData.duration || null,
          dependencies: taskData.dependencies || [],
          details: taskData.details,
          links: taskData.links || {},
          stakeholders: taskData.stakeholders || [],
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating task:', error);
        throw error;
      }

      console.log('Task created successfully:', data);

      const newTask = await convertSupabaseTaskToTask(data);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      console.error('Error in createTask:', err);
      throw err;
    }
  };

  const updateTask = async (updatedTask: Task): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    // Find the task by task_number
    const { data: existingTask, error: findError } = await supabase
      .from('tasks')
      .select('id')
      .eq('task_number', updatedTask.id)
      .eq('user_id', user.id)
      .single();

    if (findError) throw findError;

    const { error } = await supabase
      .from('tasks')
      .update({
        scope: updatedTask.scope,
        project_id: updatedTask.project || null,
        environment: updatedTask.environment,
        task_type: updatedTask.taskType,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        responsible: updatedTask.responsible,
        start_date: updatedTask.startDate,
        due_date: updatedTask.dueDate,
        completion_date: updatedTask.completionDate || null,
        duration: updatedTask.duration || null,
        dependencies: updatedTask.dependencies || [],
        details: updatedTask.details,
        links: updatedTask.links || {},
        stakeholders: updatedTask.stakeholders || []
      })
      .eq('id', existingTask.id);

    if (error) throw error;

    setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
  };

  const addFollowUp = async (taskId: string, followUpText: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    // Find the task by task_number
    const { data: existingTask, error: findError } = await supabase
      .from('tasks')
      .select('id')
      .eq('task_number', taskId)
      .eq('user_id', user.id)
      .single();

    if (findError) throw findError;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .single();

    const { error } = await supabase
      .from('follow_ups')
      .insert([
        {
          task_id: existingTask.id,
          text: followUpText,
          author: profileData?.display_name || user.email || 'Unknown'
        }
      ]);

    if (error) throw error;

    // Reload tasks to get updated follow-ups and wait for completion
    await loadTasks();
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    // Find the task by task_number
    const { data: existingTask, error: findError } = await supabase
      .from('tasks')
      .select('id')
      .eq('task_number', taskId)
      .eq('user_id', user.id)
      .single();

    if (findError) throw findError;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', existingTask.id);

    if (error) throw error;

    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const createProject = async (projectData: Omit<Project, 'id'>): Promise<Project> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        description: projectData.description,
        owner: projectData.owner,
        user_id: user.id,
        scope: projectData.scope,
        start_date: projectData.startDate,
        end_date: projectData.endDate,
        status: projectData.status,
        cost_center: projectData.cost_center,
        links: projectData.links || {}
      })
      .select()
      .single();

    if (error) throw error;

    const newProject = convertSupabaseProjectToProject(data);
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  };

  const updateProject = async (updatedProject: Project): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('projects')
      .update({
        name: updatedProject.name,
        description: updatedProject.description,
        owner: updatedProject.owner,
        scope: updatedProject.scope,
        start_date: updatedProject.startDate,
        end_date: updatedProject.endDate,
        status: updatedProject.status,
        cost_center: updatedProject.cost_center,
        links: updatedProject.links || {}
      })
      .eq('id', updatedProject.id)
      .eq('user_id', user.id);

    if (error) throw error;

    setProjects(prev => prev.map(project => project.id === updatedProject.id ? updatedProject : project));
  };

  const deleteProject = async (projectId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    // First delete all tasks associated with this project
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id);

    if (tasksError) throw tasksError;

    // Then delete the project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) throw error;

    setProjects(prev => prev.filter(project => project.id !== projectId));
    // Refresh tasks to remove deleted project tasks from UI
    loadTasks();
  };

  const refreshTasks = () => {
    loadTasks();
    loadProjects();
  };

  return {
    tasks,
    projects,
    isLoading,
    error,
    createTask,
    updateTask,
    addFollowUp,
    deleteTask,
    createProject,
    updateProject,
    deleteProject,
    refreshTasks
  };
}