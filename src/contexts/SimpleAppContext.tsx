import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// Simple types for the lightweight version
export interface SimpleProject {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold';
  owner?: string;
  start_date?: string;
  end_date?: string;
  team_members?: string;
  project_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SimpleTask {
  id: string;
  project_id?: string;
  project_name?: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  responsible?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SimpleFollowup {
  id: string;
  task_id: string;
  task_title?: string;
  content: string;
  created_at: string;
}

export interface SimpleTimeEntry {
  id: string;
  task_id?: string;
  project_id?: string;
  task_title?: string;
  project_name?: string;
  description?: string;
  duration_minutes: number;
  date: string;
  created_at: string;
}

interface SimpleAppContextType {
  // Data
  projects: SimpleProject[];
  tasks: SimpleTask[];
  followups: SimpleFollowup[];
  timeEntries: SimpleTimeEntry[];
  
  // Loading states
  loading: boolean;
  
  // CRUD operations
  createProject: (project: Omit<SimpleProject, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<SimpleProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  createTask: (task: Omit<SimpleTask, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<SimpleTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  createFollowup: (followup: Omit<SimpleFollowup, 'id' | 'created_at'>) => Promise<void>;
  deleteFollowup: (id: string) => Promise<void>;
  
  createTimeEntry: (entry: Omit<SimpleTimeEntry, 'id' | 'created_at'>) => Promise<void>;
  updateTimeEntry: (id: string, updates: Partial<SimpleTimeEntry>) => Promise<void>;
  deleteTimeEntry: (id: string) => Promise<void>;
  
  // Refresh data
  refreshData: () => Promise<void>;
}

const SimpleAppContext = createContext<SimpleAppContextType | undefined>(undefined);

export const useSimpleApp = () => {
  const context = useContext(SimpleAppContext);
  if (!context) {
    throw new Error('useSimpleApp must be used within SimpleAppProvider');
  }
  return context;
};

export const SimpleAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<SimpleProject[]>([]);
  const [tasks, setTasks] = useState<SimpleTask[]>([]);
  const [followups, setFollowups] = useState<SimpleFollowup[]>([]);
  const [timeEntries, setTimeEntries] = useState<SimpleTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  const fetchData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('simple_projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (projectsError) throw projectsError;
      
      // Fetch tasks with project names
      const { data: tasksData, error: tasksError } = await supabase
        .from('simple_tasks')
        .select(`
          *,
          simple_projects(name)
        `)
        .order('created_at', { ascending: false });
      
      if (tasksError) throw tasksError;
      
      // Fetch followups with task titles
      const { data: followupsData, error: followupsError } = await supabase
        .from('simple_followups')
        .select(`
          *,
          simple_tasks(title)
        `)
        .order('created_at', { ascending: false });
      
      if (followupsError) throw followupsError;
      
      // Fetch time entries
      const { data: timeEntriesData, error: timeEntriesError } = await supabase
        .from('simple_time_entries')
        .select(`
          *,
          simple_tasks(title),
          simple_projects(name)
        `)
        .order('date', { ascending: false });
      
      if (timeEntriesError) throw timeEntriesError;
      
      setProjects((projectsData || []).map(project => ({
        ...project,
        status: project.status as 'active' | 'completed' | 'on_hold'
      })));
      setTasks((tasksData || []).map(task => ({
        ...task,
        status: task.status as 'todo' | 'in_progress' | 'completed',
        priority: task.priority as 'low' | 'medium' | 'high' | 'urgent',
        project_name: task.simple_projects?.name || undefined
      })));
      setFollowups((followupsData || []).map(followup => ({
        ...followup,
        task_title: followup.simple_tasks?.title || undefined
      })));
      setTimeEntries((timeEntriesData || []).map(entry => ({
        ...entry,
        task_title: entry.simple_tasks?.title || undefined,
        project_name: entry.simple_projects?.name || undefined
      })));
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when user changes
  useEffect(() => {
    fetchData();
  }, [user]);

  // Project operations
  const createProject = async (project: Omit<SimpleProject, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('simple_projects')
        .insert([{ ...project, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      
      setProjects(prev => [{
        ...data,
        status: data.status as 'active' | 'completed' | 'on_hold'
      }, ...prev]);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const updateProject = async (id: string, updates: Partial<SimpleProject>) => {
    try {
      const { data, error } = await supabase
        .from('simple_projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      setProjects(prev => prev.map(p => p.id === id ? {
        ...data,
        status: data.status as 'active' | 'completed' | 'on_hold'
      } : p));
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('simple_projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setProjects(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  // Task operations
  const createTask = async (task: Omit<SimpleTask, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('simple_tasks')
        .insert([{ ...task, user_id: user.id }])
        .select(`
          *,
          simple_projects(name)
        `)
        .single();
      
      if (error) throw error;
      
      const newTask = {
        ...data,
        status: data.status as 'todo' | 'in_progress' | 'completed',
        priority: data.priority as 'low' | 'medium' | 'high' | 'urgent',
        project_name: data.simple_projects?.name || undefined
      };
      
      setTasks(prev => [newTask, ...prev]);
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const updateTask = async (id: string, updates: Partial<SimpleTask>) => {
    try {
      const { data, error } = await supabase
        .from('simple_tasks')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          simple_projects(name)
        `)
        .single();
      
      if (error) throw error;
      
      const updatedTask = {
        ...data,
        status: data.status as 'todo' | 'in_progress' | 'completed',
        priority: data.priority as 'low' | 'medium' | 'high' | 'urgent',
        project_name: data.simple_projects?.name || undefined
      };
      
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('simple_tasks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTasks(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  // Followup operations
  const createFollowup = async (followup: Omit<SimpleFollowup, 'id' | 'created_at'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('simple_followups')
        .insert([{ ...followup, user_id: user.id }])
        .select(`
          *,
          simple_tasks(title)
        `)
        .single();
      
      if (error) throw error;
      
      const newFollowup = {
        ...data,
        task_title: data.simple_tasks?.title || undefined
      };
      
      setFollowups(prev => [newFollowup, ...prev]);
      toast({
        title: "Success",
        description: "Follow-up added successfully",
      });
    } catch (error) {
      console.error('Error creating followup:', error);
      toast({
        title: "Error",
        description: "Failed to add follow-up",
        variant: "destructive",
      });
    }
  };

  const deleteFollowup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('simple_followups')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setFollowups(prev => prev.filter(f => f.id !== id));
      toast({
        title: "Success",
        description: "Follow-up deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting followup:', error);
      toast({
        title: "Error",
        description: "Failed to delete follow-up",
        variant: "destructive",
      });
    }
  };

  // Time entry operations
  const createTimeEntry = async (entry: Omit<SimpleTimeEntry, 'id' | 'created_at'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('simple_time_entries')
        .insert([{ ...entry, user_id: user.id }])
        .select(`
          *,
          simple_tasks(title),
          simple_projects(name)
        `)
        .single();
      
      if (error) throw error;
      
      const newEntry = {
        ...data,
        task_title: data.simple_tasks?.title || undefined,
        project_name: data.simple_projects?.name || undefined
      };
      
      setTimeEntries(prev => [newEntry, ...prev]);
      toast({
        title: "Success",
        description: "Time entry added successfully",
      });
    } catch (error) {
      console.error('Error creating time entry:', error);
      toast({
        title: "Error",
        description: "Failed to add time entry",
        variant: "destructive",
      });
    }
  };

  const updateTimeEntry = async (id: string, updates: Partial<SimpleTimeEntry>) => {
    try {
      const { data, error } = await supabase
        .from('simple_time_entries')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          simple_tasks(title),
          simple_projects(name)
        `)
        .single();
      
      if (error) throw error;
      
      const updatedEntry = {
        ...data,
        task_title: data.simple_tasks?.title || undefined,
        project_name: data.simple_projects?.name || undefined
      };
      
      setTimeEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));
      toast({
        title: "Success",
        description: "Time entry updated successfully",
      });
    } catch (error) {
      console.error('Error updating time entry:', error);
      toast({
        title: "Error",
        description: "Failed to update time entry",
        variant: "destructive",
      });
    }
  };

  const deleteTimeEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('simple_time_entries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTimeEntries(prev => prev.filter(e => e.id !== id));
      toast({
        title: "Success",
        description: "Time entry deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting time entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive",
      });
    }
  };

  const value: SimpleAppContextType = {
    projects,
    tasks,
    followups,
    timeEntries,
    loading,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    createFollowup,
    deleteFollowup,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    refreshData: fetchData,
  };

  return (
    <SimpleAppContext.Provider value={value}>
      {children}
    </SimpleAppContext.Provider>
  );
};