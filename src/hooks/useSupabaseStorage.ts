import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, Project, FollowUp } from '@/types/task';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
interface SupabaseTask {
  id: string;
  task_number: string;
  scope: string[]; // Changed to array
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
  planned_time_hours: number | null;
  dependencies: string[] | null;
  details: string | null;
  links: any;
  stakeholders: string[] | null;
  checklist: any; // Add checklist field
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
  scope: string[]; // Changed to array
  start_date: string;
  end_date: string;
  status: string;
  cost_center: string | null;
  team: string[] | null;
  links: any;
  created_at: string;
  updated_at: string;
}

export function useSupabaseStorage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>(""); // Track current search
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 50,
    totalTasks: 0,
    totalPages: 0
  });
  const [taskCounts, setTaskCounts] = useState({
    total: 0,
    active: 0,
    onHold: 0,
    critical: 0,
    completed: 0
  });
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const convertSupabaseTaskToTask = useCallback(async (supabaseTask: SupabaseTask): Promise<Task> => {
    // Fetch follow-ups for this task
    const { data: followUpsData, error: followUpsError } = await supabase
      .from('follow_ups')
      .select('id, text, created_at, task_status')
      .eq('task_id', supabaseTask.id)
      .order('created_at', { ascending: true });

    if (followUpsError) {
      console.error('Error fetching follow-ups:', followUpsError);
    }

    const followUps = followUpsData?.map(followUp => ({
      id: followUp.id,
      text: followUp.text,
      timestamp: followUp.created_at,
      taskStatus: followUp.task_status || 'Unknown'
    })) || [];

    if (followUps.length > 0) {
      console.log(`Task ${supabaseTask.task_number} has ${followUps.length} follow-ups:`, followUps);
    }

    // Get project name from project_id
    let projectName = '';
    if (supabaseTask.project_id) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('name')
        .eq('id', supabaseTask.project_id)
        .maybeSingle();
      
      projectName = projectData?.name || '';
    }

    if (supabaseTask.task_number === 'T34') {
      console.log('Converting T34 from Supabase:', { 
        environment: supabaseTask.environment,
        task_type: supabaseTask.task_type,
        priority: supabaseTask.priority,
        status: supabaseTask.status
      });
    }

    return {
      id: supabaseTask.task_number, // Use task_number as the ID for compatibility
      scope: supabaseTask.scope || [], // Handle array scope
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
      plannedTimeHours: supabaseTask.planned_time_hours || undefined,
      dependencies: supabaseTask.dependencies || [],
      checklist: Array.isArray(supabaseTask.checklist) ? supabaseTask.checklist : (typeof supabaseTask.checklist === 'string' ? JSON.parse(supabaseTask.checklist) : []), // Parse checklist from JSON
      followUps,
      details: supabaseTask.details || '',
      links: supabaseTask.links || {},
      stakeholders: supabaseTask.stakeholders || [],
      // Recurrence fields
      isRecurring: (supabaseTask as any).is_recurring || false,
      recurrenceType: (supabaseTask as any).recurrence_type,
      recurrenceInterval: (supabaseTask as any).recurrence_interval || 1,
      parentTaskId: (supabaseTask as any).parent_task_id,
      nextRecurrenceDate: (supabaseTask as any).next_recurrence_date,
      recurrenceEndDate: (supabaseTask as any).recurrence_end_date
    };
  }, []);

  const convertSupabaseProjectToProject = (supabaseProject: SupabaseProject): Project => {
    return {
      id: supabaseProject.id,
      name: supabaseProject.name,
      description: supabaseProject.description || '',
      owner: supabaseProject.owner || '',
      team: supabaseProject.team || [],
      startDate: supabaseProject.start_date,
      endDate: supabaseProject.end_date,
      status: supabaseProject.status as any,
      tasks: [], // Will be populated from tasks
      scope: supabaseProject.scope || [], // Handle array scope
      cost_center: supabaseProject.cost_center || undefined,
      links: supabaseProject.links || {}
    };
  };

  const loadTasks = useCallback(async (
    page: number = 1, 
    pageSize: number = 50, 
    sortField: string = 'due_date', 
    sortDirection: 'asc' | 'desc' = 'asc'
  ) => {
    if (!isAuthenticated || !user) {
      console.log('loadTasks: No authentication or user:', { isAuthenticated, hasUser: !!user });
      setTasks([]);
      setPagination(prev => ({ ...prev, totalTasks: 0, totalPages: 0 }));
      setTaskCounts({ total: 0, active: 0, onHold: 0, critical: 0, completed: 0 });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setCurrentSearchTerm(""); // Clear search term when loading regular tasks
      
      // First, get the total count and stats for all tasks
      const { data: allTasksData, error: allTasksError } = await supabase
        .from('tasks')
        .select('status, priority')
        .eq('user_id', user.id);

      console.log('loadTasks: Query result:', { 
        dataCount: allTasksData?.length, 
        error: allTasksError, 
        userId: user.id,
        sampleData: allTasksData?.slice(0, 3) 
      });

      if (allTasksError) throw allTasksError;

      // Calculate total counts across all tasks
      const totalTasks = allTasksData?.length || 0;
      const openTasks = allTasksData?.filter(t => t.status === "Open").length || 0;
      const inProgressTasks = allTasksData?.filter(t => t.status === "In Progress").length || 0;
      const activeTasks = openTasks + inProgressTasks;
      const onHoldTasks = allTasksData?.filter(t => t.status === "On Hold").length || 0;
      const criticalTasks = allTasksData?.filter(t => t.priority === "Critical" && t.status !== "Completed").length || 0;
      const completedTasks = allTasksData?.filter(t => t.status === "Completed").length || 0;
      
      setTaskCounts({
        total: totalTasks,
        active: activeTasks,
        onHold: onHoldTasks,
        critical: criticalTasks,
        completed: completedTasks
      });

      const totalPages = Math.ceil(totalTasks / pageSize);
      
      // Then get the paginated data with sorting
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Map frontend sort fields to database columns
      const dbSortField = (() => {
        switch (sortField) {
          case 'dueDate': return 'due_date';
          case 'taskType': return 'task_type';
          case 'scope': return 'scope';
          case 'project': return 'project_id';
          case 'status': return 'status';
          case 'priority': return 'priority';
          case 'responsible': return 'responsible';
          case 'environment': return 'environment';
          case 'title': return 'title';
          case 'id': return 'task_number';
          default: return 'due_date';
        }
      })();

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

      // Handle special sorting cases
      if (sortField === 'priority') {
        // For priority sorting, order by due date first, then handle priority in client
        query = query.order('due_date', { ascending: true });
      } else if (sortField === 'dueDatePriority') {
        // For combined sorting, order by due date first, then handle priority in client
        query = query.order('due_date', { ascending: true });
      } else {
        query = query.order(dbSortField, { ascending: sortDirection === 'asc' });
      }

      // Apply pagination
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      const convertedTasks = await Promise.all(
        (data || []).map(convertSupabaseTaskToTask)
      );

      // Apply client-side priority sorting if needed (since SQL CASE statements cause parsing issues)
      let sortedTasks = convertedTasks;
      if (sortField === 'priority' || sortField === 'dueDatePriority') {
        const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        
        sortedTasks = convertedTasks.sort((a, b) => {
          // First sort by due date (older first)
          const dateA = new Date(a.dueDate).getTime();
          const dateB = new Date(b.dueDate).getTime();
          if (dateA !== dateB) {
            return dateA - dateB; // older dates first
          }
          
          // Then sort by priority (Critical > High > Medium > Low)
          const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          return priorityB - priorityA; // higher priority first
        });
      }

      setTasks(sortedTasks);
      setPagination({
        currentPage: page,
        pageSize,
        totalTasks,
        totalPages
      });
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

  // Load ALL tasks for a specific project (no pagination)
  const loadAllTasksForProject = useCallback(async (projectName: string): Promise<Task[]> => {
    if (!isAuthenticated || !user) {
      console.log('loadAllTasksForProject: No authentication or user');
      return [];
    }

    try {
      // First find the project ID
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('name', projectName)
        .eq('user_id', user.id)
        .maybeSingle();

      if (projectError) throw projectError;
      
      if (!projectData) {
        console.log('Project not found:', projectName);
        return [];
      }

      // Then get ALL tasks for this project (no pagination)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', projectData.id)
        .order('due_date', { ascending: true });

      if (error) throw error;

      console.log(`Loaded ${data?.length || 0} total tasks for project ${projectName}`);

      const convertedTasks = await Promise.all(
        (data || []).map(convertSupabaseTaskToTask)
      );

      return convertedTasks;
    } catch (err) {
      console.error('Error loading all tasks for project:', err);
      return [];
    }
  }, [isAuthenticated, user, convertSupabaseTaskToTask]);

  // Search through ALL tasks (no pagination)
  const searchTasks = useCallback(async (
    searchTerm: string,
    pageSize: number = 50,
    sortField: string = 'due_date', 
    sortDirection: 'asc' | 'desc' = 'asc'
  ) => {
    if (!isAuthenticated || !user) {
      console.log('searchTasks: No authentication or user');
      setTasks([]);
      setPagination(prev => ({ ...prev, totalTasks: 0, totalPages: 0 }));
      setIsLoading(false);
      return;
    }

    if (!searchTerm.trim()) {
      // If no search term, clear current search and load regular paginated tasks
      setCurrentSearchTerm("");
      loadTasks(1, pageSize, sortField, sortDirection);
      return;
    }

    try {
      setIsLoading(true);
      setCurrentSearchTerm(searchTerm); // Store the current search term
      
      // Map frontend sort fields to database columns
      const dbSortField = (() => {
        switch (sortField) {
          case 'dueDate': return 'due_date';
          case 'taskType': return 'task_type';
          case 'scope': return 'scope';
          case 'project': return 'project_id';
          case 'status': return 'status';
          case 'priority': return 'priority';
          case 'responsible': return 'responsible';
          case 'environment': return 'environment';
          case 'title': return 'title';
          case 'id': return 'task_number';
          default: return 'due_date';
        }
      })();

      // Search across ALL tasks (no pagination limit)
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

      // Add search conditions for multiple fields
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,responsible.ilike.%${searchTerm}%`);

      // Apply sorting
      if (sortField === 'priority' || sortField === 'dueDatePriority') {
        query = query.order('due_date', { ascending: true });
      } else {
        query = query.order(dbSortField, { ascending: sortDirection === 'asc' });
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log(`Search found ${data?.length || 0} tasks for term: "${searchTerm}"`);

      const convertedTasks = await Promise.all(
        (data || []).map(convertSupabaseTaskToTask)
      );

      // Apply client-side priority sorting if needed
      let sortedTasks = convertedTasks;
      if (sortField === 'priority' || sortField === 'dueDatePriority') {
        const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        
        sortedTasks = convertedTasks.sort((a, b) => {
          const dateA = new Date(a.dueDate).getTime();
          const dateB = new Date(b.dueDate).getTime();
          if (dateA !== dateB) {
            return dateA - dateB;
          }
          
          const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          return priorityB - priorityA;
        });
      }

      // For search results, show all results but update pagination info
      const totalTasks = sortedTasks.length;
      const totalPages = Math.ceil(totalTasks / pageSize);
      
      setTasks(sortedTasks);
      setPagination({
        currentPage: 1, // Always show page 1 for search results
        pageSize,
        totalTasks,
        totalPages
      });
      setError(null);
    } catch (err) {
      console.error('Error searching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to search tasks');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, convertSupabaseTaskToTask, loadTasks]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
      loadProjects();
    } else {
      setTasks([]);
      setProjects([]);
      setPagination(prev => ({ ...prev, totalTasks: 0, totalPages: 0 }));
      setIsLoading(false);
    }
  }, [isAuthenticated, loadTasks, loadProjects]);

  // Realtime subscriptions for tasks, projects, and follow-ups
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadTasks();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        loadProjects();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follow_ups' }, () => {
        // Follow-ups affect tasks list
        loadTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user, loadTasks, loadProjects]);

  const createTask = async (taskData: Omit<Task, 'id' | 'creationDate' | 'followUps'>): Promise<Task> => {
    if (!user) throw new Error('User not authenticated');


    try {
      // Find the project ID from the project name
      let projectId = null;
      if (taskData.project) {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('id')
          .eq('name', taskData.project)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (projectError) {
          console.error('Error finding project:', projectError);
        } else {
          projectId = projectData?.id;
        }
      }

      console.log('Found project ID:', projectId, 'for project name:', taskData.project);
      console.log('createTask payload (key fields):', { environment: taskData.environment, status: taskData.status, priority: taskData.priority, taskType: taskData.taskType, project: taskData.project, title: taskData.title });

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          task_number: 'temp', // Will be replaced by trigger
          scope: taskData.scope || [], // Handle array scope
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
          planned_time_hours: taskData.plannedTimeHours || null,
          dependencies: taskData.dependencies || [],
          checklist: JSON.stringify(taskData.checklist || []),
          details: taskData.details,
          links: taskData.links || {},
          stakeholders: taskData.stakeholders || [],
          user_id: user.id,
          // Recurrence fields
          is_recurring: taskData.isRecurring || false,
          recurrence_type: taskData.recurrenceType,
          recurrence_interval: taskData.recurrenceInterval || 1,
          recurrence_end_date: taskData.recurrenceEndDate
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating task:', error);
        throw error;
      }

      console.log('Task created successfully:', data);
      console.log('DB returned fields:', { task_number: data?.task_number, environment: data?.environment, status: data?.status });

      const newTask = await convertSupabaseTaskToTask(data);
      setTasks(prev => [newTask, ...prev]);
      toast({ title: 'Task created', description: newTask.title });
      return newTask;
    } catch (err) {
      console.error('Error in createTask:', err);
      toast({ title: 'Failed to create task', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
      throw err;
    }
  };

  const updateTask = async (updatedTask: Task): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    console.log('updateTask called with:', {
      taskId: updatedTask.id,
      taskType: updatedTask.taskType,
      fullTask: updatedTask
    });

    // Find the task by task_number and get current values to check for changes
    const { data: existingTask, error: findError } = await supabase
      .from('tasks')
      .select('id, status, priority, task_type, due_date')
      .eq('task_number', updatedTask.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (findError || !existingTask) {
      console.error('Error finding task for update:', findError);
      toast({ title: 'Task not found', description: updatedTask.id, variant: 'destructive' });
      throw findError || new Error('Task not found');
    }

    console.log('Found existing task in DB:', existingTask);

    // Find the project ID by name if project is specified
    let projectId = null;
    if (updatedTask.project) {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('name', updatedTask.project)
        .eq('user_id', user.id)
        .maybeSingle();

      if (projectError) {
        console.error('Error finding project:', projectError);
      } else if (projectData) {
        projectId = projectData.id;
      }
    }

    // Check if task is being marked as completed
    const isBeingCompleted = existingTask.status !== 'Completed' && updatedTask.status === 'Completed';
    const todayDate = new Date().toISOString().split('T')[0];

    const updateData = {
      scope: updatedTask.scope || [], // Handle array scope
      project_id: projectId,
      environment: updatedTask.environment,
      task_type: updatedTask.taskType,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      priority: updatedTask.priority,
      responsible: updatedTask.responsible,
      start_date: updatedTask.startDate,
      due_date: updatedTask.dueDate,
      completion_date: isBeingCompleted ? todayDate : (updatedTask.completionDate || null),
      duration: updatedTask.duration || null,
      planned_time_hours: updatedTask.plannedTimeHours || null,
      dependencies: updatedTask.dependencies || [],
      checklist: JSON.stringify(updatedTask.checklist || []),
      details: updatedTask.details,
      links: updatedTask.links || {},
      stakeholders: updatedTask.stakeholders || [],
      // Recurrence fields
      is_recurring: updatedTask.isRecurring || false,
      recurrence_type: updatedTask.recurrenceType,
      recurrence_interval: updatedTask.recurrenceInterval || 1,
      recurrence_end_date: updatedTask.recurrenceEndDate
    };

    console.log('Update data being sent to DB:', updateData);
    console.log('Environment value in update:', updatedTask.environment);
    if (updatedTask.id === 'T34') {
      console.error('CRITICAL: T34 is being updated! Task data:', updatedTask);
    }

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', existingTask.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    console.log('Task updated successfully in DB, updating local state');
    
    // Dispatch custom event to notify components of task update
    window.dispatchEvent(new CustomEvent('taskUpdated', { detail: updatedTask }));

    // Handle follow-ups separately - check if there are new follow-ups to save
    if (updatedTask.followUps && updatedTask.followUps.length > 0) {
      // Get existing follow-ups from database
      const { data: existingFollowUps } = await supabase
        .from('follow_ups')
        .select('id')
        .eq('task_id', existingTask.id);

      const existingFollowUpIds = new Set(existingFollowUps?.map(f => f.id) || []);
      
      // Find new follow-ups (those not in the database yet)
      const newFollowUps = updatedTask.followUps.filter(followUp => 
        !existingFollowUpIds.has(followUp.id)
      );

      // Save new follow-ups to database
      if (newFollowUps.length > 0) {
        const followUpsToInsert = newFollowUps.map(followUp => ({
          task_id: existingTask.id,
          text: followUp.text,
          created_at: followUp.timestamp
        }));

        console.log('Inserting follow-ups:', followUpsToInsert);

        const { error: followUpError } = await supabase
          .from('follow_ups')
          .insert(followUpsToInsert);

        if (followUpError) {
          console.error('Error saving follow-ups:', followUpError);
          // Don't throw here, just log the error so the main task update succeeds
        } else {
          console.log('Follow-ups saved successfully');
        }
      }
    }

    // Add follow-up comment if task was just completed
    if (isBeingCompleted) {
      const { error: followUpError } = await supabase
        .from('follow_ups')
        .insert({
          task_id: existingTask.id,
          text: "Task marked completed",
          task_status: 'Completed',
          created_at: new Date().toISOString()
        });

      if (followUpError) {
        console.error('Error adding completion follow-up:', followUpError);
      }
    }

    // Create follow-ups for tracked field changes
    const followUpsToCreate = [];
    
    // Check for Status change (excluding completion as it's handled above)
    if (existingTask.status !== updatedTask.status && !isBeingCompleted) {
      followUpsToCreate.push({
        task_id: existingTask.id,
        text: `Status changed from "${existingTask.status}" to "${updatedTask.status}"`,
        task_status: updatedTask.status,
        created_at: new Date().toISOString()
      });
    }
    
    // Check for Priority change
    if (existingTask.priority !== updatedTask.priority) {
      followUpsToCreate.push({
        task_id: existingTask.id,
        text: `Priority changed from "${existingTask.priority}" to "${updatedTask.priority}"`,
        task_status: updatedTask.status,
        created_at: new Date().toISOString()
      });
    }
    
    // Check for Task Type change
    if (existingTask.task_type !== updatedTask.taskType) {
      followUpsToCreate.push({
        task_id: existingTask.id,
        text: `Task type changed from "${existingTask.task_type}" to "${updatedTask.taskType}"`,
        task_status: updatedTask.status,
        created_at: new Date().toISOString()
      });
    }
    
    // Check for Due Date change
    if (existingTask.due_date !== updatedTask.dueDate) {
      followUpsToCreate.push({
        task_id: existingTask.id,
        text: `Due date changed from "${existingTask.due_date}" to "${updatedTask.dueDate}"`,
        task_status: updatedTask.status,
        created_at: new Date().toISOString()
      });
    }
    
    // Insert all change follow-ups at once
    if (followUpsToCreate.length > 0) {
      const { error: changeFollowUpError } = await supabase
        .from('follow_ups')
        .insert(followUpsToCreate);

      if (changeFollowUpError) {
        console.error('Error adding change follow-ups:', changeFollowUpError);
      } else {
        console.log(`Added ${followUpsToCreate.length} change follow-up(s)`);
      }
    }

    setTasks(prev => prev.map(task => task.id === updatedTask.id ? {
      ...updatedTask,
      completionDate: isBeingCompleted ? todayDate : updatedTask.completionDate
    } : task));
    
    console.log('Task update complete, dispatching taskUpdated event for:', updatedTask.id);
    
    // Also reload tasks to ensure we have the latest data
    await loadTasks();
    toast({ title: 'Task updated', description: updatedTask.title });
  };

  const addFollowUp = async (taskId: string, followUpText: string): Promise<void> => {
    console.log('addFollowUp called with:', { taskId, followUpText });
    if (!user) throw new Error('User not authenticated');

    // Find the task by task_number and get current status
    const { data: existingTask, error: findError } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('task_number', taskId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (findError || !existingTask) {
      toast({ title: 'Task not found', description: taskId, variant: 'destructive' });
      throw findError || new Error('Task not found');
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const { error } = await supabase
      .from('follow_ups')
      .insert({
        task_id: existingTask.id,
        text: followUpText,
        task_status: existingTask.status,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    // Reload tasks to get the latest data including new follow-ups
    await loadTasks();
  };

  const updateFollowUp = async (followUpId: string, text: string, timestamp?: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    const updateData: any = { text };
    if (timestamp) {
      updateData.created_at = timestamp;
    }

    const { error } = await supabase
      .from('follow_ups')
      .update(updateData)
      .eq('id', followUpId);

    if (error) {
      console.error('Error updating follow-up:', error);
      toast({ title: 'Error updating follow-up', variant: 'destructive' });
      throw error;
    }

    console.log('Follow-up successfully updated');
    await loadTasks();
    toast({ title: 'Follow-up updated' });
  };

  const deleteFollowUp = async (followUpId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('follow_ups')
      .delete()
      .eq('id', followUpId);

    if (error) {
      toast({ title: 'Error deleting follow-up', variant: 'destructive' });
      throw error;
    }

    await loadTasks();
    toast({ title: 'Follow-up deleted' });
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    // Find the task by task_number
    const { data: existingTask, error: findError } = await supabase
      .from('tasks')
      .select('id')
      .eq('task_number', taskId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (findError || !existingTask) {
      toast({ title: 'Task not found', description: taskId, variant: 'destructive' });
      throw findError || new Error('Task not found');
    }

    // Delete related follow-ups first to satisfy FK constraints
    const { error: followUpsError } = await supabase
      .from('follow_ups')
      .delete()
      .eq('task_id', existingTask.id);

    if (followUpsError) throw followUpsError;

    // Then delete the task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', existingTask.id)
      .eq('user_id', user.id);

    if (error) throw error;

    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast({ title: 'Task deleted' });
  };

  const deleteAllRecurringTasks = async (taskId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    // Find the task by task_number
    const { data: existingTask, error: findError } = await supabase
      .from('tasks')
      .select('id, parent_task_id, is_recurring')
      .eq('task_number', taskId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (findError || !existingTask) {
      toast({ title: 'Task not found', description: taskId, variant: 'destructive' });
      throw findError || new Error('Task not found');
    }

    // Determine the parent task ID (either this task if it's the parent, or its parent)
    const parentTaskId = existingTask.is_recurring ? existingTask.id : existingTask.parent_task_id;
    
    if (!parentTaskId) {
      toast({ title: 'This task is not part of a recurring series', variant: 'destructive' });
      return;
    }

    // Find all tasks in the recurring series
    const { data: allRecurringTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id')
      .or(`id.eq.${parentTaskId},parent_task_id.eq.${parentTaskId}`)
      .eq('user_id', user.id);

    if (fetchError) throw fetchError;

    if (!allRecurringTasks || allRecurringTasks.length === 0) {
      toast({ title: 'No recurring tasks found', variant: 'destructive' });
      return;
    }

    const taskIds = allRecurringTasks.map(task => task.id);

    // Delete all follow-ups for all recurring tasks
    const { error: followUpsError } = await supabase
      .from('follow_ups')
      .delete()
      .in('task_id', taskIds);

    if (followUpsError) throw followUpsError;

    // Delete all recurring tasks
    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', taskIds)
      .eq('user_id', user.id);

    if (error) throw error;

    // Update local state
    setTasks(prev => prev.filter(task => !taskIds.includes(task.id)));
    toast({ 
      title: 'Recurring tasks deleted', 
      description: `Deleted ${allRecurringTasks.length} task(s) from the recurring series`
    });
  };

  const updateAllRecurringTasks = async (taskId: string, updateData: {
    title?: string;
    environment?: string;
    taskType?: string;
    status?: string;
    priority?: string;
    responsible?: string;
    description?: string;
    details?: string;
    plannedTimeHours?: number;
    links?: {
      oneNote?: string;
      teams?: string;
      email?: string;
      file?: string;
      folder?: string;
    };
  }): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    // Find the task by task_number
    const { data: existingTask, error: findError } = await supabase
      .from('tasks')
      .select('id, parent_task_id, is_recurring')
      .eq('task_number', taskId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (findError || !existingTask) {
      toast({ title: 'Task not found', description: taskId, variant: 'destructive' });
      throw findError || new Error('Task not found');
    }

    // Determine the parent task ID (either this task if it's the parent, or its parent)
    const parentTaskId = existingTask.is_recurring ? existingTask.id : existingTask.parent_task_id;
    
    if (!parentTaskId) {
      toast({ title: 'This task is not part of a recurring series', variant: 'destructive' });
      return;
    }

    // Find all tasks in the recurring series
    const { data: allRecurringTasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id')
      .or(`id.eq.${parentTaskId},parent_task_id.eq.${parentTaskId}`)
      .eq('user_id', user.id);

    if (fetchError) throw fetchError;

    if (!allRecurringTasks || allRecurringTasks.length === 0) {
      toast({ title: 'No recurring tasks found', variant: 'destructive' });
      return;
    }

    const taskIds = allRecurringTasks.map(task => task.id);

    // Prepare update object with only defined fields
    const fieldsToUpdate: any = {};
    if (updateData.title !== undefined) fieldsToUpdate.title = updateData.title;
    if (updateData.environment !== undefined) fieldsToUpdate.environment = updateData.environment;
    if (updateData.taskType !== undefined) fieldsToUpdate.task_type = updateData.taskType;
    if (updateData.status !== undefined) fieldsToUpdate.status = updateData.status;
    if (updateData.priority !== undefined) fieldsToUpdate.priority = updateData.priority;
    if (updateData.responsible !== undefined) fieldsToUpdate.responsible = updateData.responsible;
    if (updateData.description !== undefined) fieldsToUpdate.description = updateData.description;
    if (updateData.details !== undefined) fieldsToUpdate.details = updateData.details;
    if (updateData.plannedTimeHours !== undefined) fieldsToUpdate.planned_time_hours = updateData.plannedTimeHours;
    if (updateData.links !== undefined) fieldsToUpdate.links = updateData.links;

    // Update all recurring tasks
    const { error } = await supabase
      .from('tasks')
      .update(fieldsToUpdate)
      .in('id', taskIds)
      .eq('user_id', user.id);

    if (error) throw error;

    // Refresh tasks to update local state
    await loadTasks();
    
    toast({ 
      title: 'Recurring tasks updated', 
      description: `Updated ${allRecurringTasks.length} task(s) in the recurring series`
    });
  };

  const createProject = async (projectData: Omit<Project, 'id'>): Promise<Project> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          description: projectData.description,
          owner: projectData.owner,
          user_id: user.id,
          scope: projectData.scope || [], // Handle array scope
          start_date: projectData.startDate,
          end_date: projectData.endDate,
          status: projectData.status,
          cost_center: projectData.cost_center,
          team: projectData.team || [],
          links: projectData.links || {}
          // Note: id will be automatically generated by the database trigger
        })
        .select()
        .single();

      if (error) throw error;

      const newProject = convertSupabaseProjectToProject(data);
      setProjects(prev => [newProject, ...prev]);
      toast({ title: 'Project created', description: newProject.name });
      return newProject;
    } catch (err) {
      toast({ title: 'Failed to create project', variant: 'destructive' });
      throw err;
    }
  };

  const updateProject = async (updatedProject: Project): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('projects')
      .update({
        name: updatedProject.name,
        description: updatedProject.description,
        owner: updatedProject.owner,
        scope: updatedProject.scope || [], // Handle array scope
        start_date: updatedProject.startDate,
        end_date: updatedProject.endDate,
        status: updatedProject.status,
        cost_center: updatedProject.cost_center,
        team: updatedProject.team || [],
        links: updatedProject.links || {}
      })
      .eq('id', updatedProject.id)
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Failed to update project', variant: 'destructive' });
      throw error;
    }

    setProjects(prev => prev.map(project => project.id === updatedProject.id ? updatedProject : project));
    toast({ title: 'Project updated', description: updatedProject.name });
  };

  const deleteProject = async (projectId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
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
      toast({ title: 'Project deleted' });
    } catch (err) {
      toast({ title: 'Failed to delete project', variant: 'destructive' });
      throw err;
    }
  };

  const refreshTasks = (page?: number) => {
    loadTasks(page || pagination.currentPage);
    loadProjects();
  };

  return {
    tasks,
    projects,
    isLoading,
    error,
    pagination,
    taskCounts,
    currentSearchTerm, // Export current search term
    loadTasks,
    searchTasks,
    loadAllTasksForProject,
    createTask,
    updateTask,
    deleteTask,
    deleteAllRecurringTasks,
    updateAllRecurringTasks,
    addFollowUp,
    updateFollowUp,
    deleteFollowUp,
    createProject,
    updateProject,
    deleteProject,
    refreshTasks
  };
}