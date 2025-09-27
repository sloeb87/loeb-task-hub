import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  type: 'task' | 'project' | 'time_entry' | 'follow_up' | 'note';
  title: string;
  description?: string;
  relevance: number;
  metadata: Record<string, any>;
}

export interface GlobalSearchResults {
  results: SearchResult[];
  totalCount: number;
  resultsByType: {
    tasks: SearchResult[];
    projects: SearchResult[];
    timeEntries: SearchResult[];
    followUps: SearchResult[];
    notes: SearchResult[];
  };
  isLoading: boolean;
}

export const useGlobalSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchTasks = useCallback(async (searchTerm: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        task_number,
        title,
        description,
        status,
        priority,
        responsible,
        project_id,
        due_date,
        task_type,
        environment,
        scope
      `)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,responsible.ilike.%${searchTerm}%,task_number.ilike.%${searchTerm}%`)
      .limit(50);

    if (error) throw error;

    return (data || []).map(task => ({
      id: task.id,
      type: 'task' as const,
      title: `${task.task_number}: ${task.title}`,
      description: task.description,
      relevance: calculateRelevance(searchTerm, [task.title, task.description, task.task_number]),
      metadata: {
        taskNumber: task.task_number,
        status: task.status,
        priority: task.priority,
        responsible: task.responsible,
        projectId: task.project_id,
        dueDate: task.due_date,
        taskType: task.task_type,
        environment: task.environment,
        scope: task.scope
      }
    }));
  }, []);

  const searchProjects = useCallback(async (searchTerm: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,owner.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`)
      .limit(50);

    if (error) throw error;

    return (data || []).map(project => ({
      id: project.id,
      type: 'project' as const,
      title: `${project.id}: ${project.name}`,
      description: project.description,
      relevance: calculateRelevance(searchTerm, [project.name, project.description, project.id]),
      metadata: {
        projectId: project.id,
        status: project.status,
        owner: project.owner,
        startDate: project.start_date,
        endDate: project.end_date,
        costCenter: project.cost_center,
        scope: project.scope
      }
    }));
  }, []);

  const searchTimeEntries = useCallback(async (searchTerm: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .or(`task_title.ilike.%${searchTerm}%,project_name.ilike.%${searchTerm}%,responsible.ilike.%${searchTerm}%,task_id.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(50);

    if (error) throw error;

    return (data || []).map(entry => ({
      id: entry.id,
      type: 'time_entry' as const,
      title: `${entry.task_id}: ${entry.task_title}`,
      description: `${entry.duration ? Math.round(entry.duration / 60) : 0}h in ${entry.project_name}`,
      relevance: calculateRelevance(searchTerm, [entry.task_title, entry.project_name, entry.task_id]),
      metadata: {
        taskId: entry.task_id,
        taskTitle: entry.task_title,
        projectName: entry.project_name,
        responsible: entry.responsible,
        duration: entry.duration,
        startTime: entry.start_time,
        endTime: entry.end_time,
        isRunning: entry.is_running
      }
    }));
  }, []);

  const searchFollowUps = useCallback(async (searchTerm: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from('follow_ups')
      .select('*')
      .or(`text.ilike.%${searchTerm}%,task_id.ilike.%${searchTerm}%`)
      .limit(50);

    if (error) throw error;

    return (data || []).map(followUp => ({
      id: followUp.id,
      type: 'follow_up' as const,
      title: `Follow-up for ${followUp.task_id}`,
      description: followUp.text,
      relevance: calculateRelevance(searchTerm, [followUp.text, followUp.task_id]),
      metadata: {
        taskId: followUp.task_id,
        taskStatus: followUp.task_status,
        createdAt: followUp.created_at,
        text: followUp.text
      }
    }));
  }, []);

  const searchNotes = useCallback(async (searchTerm: string): Promise<SearchResult[]> => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .ilike('content', `%${searchTerm}%`)
      .limit(50);

    if (error) throw error;

    return (data || []).map(note => ({
      id: note.id,
      type: 'note' as const,
      title: 'Note',
      description: note.content.substring(0, 100) + (note.content.length > 100 ? '...' : ''),
      relevance: calculateRelevance(searchTerm, [note.content]),
      metadata: {
        content: note.content,
        createdAt: note.created_at,
        updatedAt: note.updated_at
      }
    }));
  }, []);

  const calculateRelevance = (searchTerm: string, fields: (string | null | undefined)[]): number => {
    const term = searchTerm.toLowerCase();
    let relevance = 0;

    fields.forEach((field, index) => {
      if (!field) return;
      
      const fieldLower = field.toLowerCase();
      const weight = 1 / (index + 1); // First fields have higher weight
      
      if (fieldLower.includes(term)) {
        const position = fieldLower.indexOf(term);
        const positionScore = 1 - (position / fieldLower.length);
        relevance += weight * positionScore;
        
        // Exact match bonus
        if (fieldLower === term) {
          relevance += weight * 2;
        }
        
        // Word boundary bonus
        if (position === 0 || fieldLower[position - 1] === ' ') {
          relevance += weight * 0.5;
        }
      }
    });

    return relevance;
  };

  const performGlobalSearch = useCallback(async (searchTerm: string): Promise<GlobalSearchResults> => {
    if (!searchTerm.trim()) {
      return {
        results: [],
        totalCount: 0,
        resultsByType: {
          tasks: [],
          projects: [],
          timeEntries: [],
          followUps: [],
          notes: []
        },
        isLoading: false
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      const [tasks, projects, timeEntries, followUps, notes] = await Promise.all([
        searchTasks(searchTerm),
        searchProjects(searchTerm),
        searchTimeEntries(searchTerm),
        searchFollowUps(searchTerm),
        searchNotes(searchTerm)
      ]);

      const allResults = [...tasks, ...projects, ...timeEntries, ...followUps, ...notes]
        .sort((a, b) => b.relevance - a.relevance);

      const result: GlobalSearchResults = {
        results: allResults,
        totalCount: allResults.length,
        resultsByType: {
          tasks,
          projects,
          timeEntries,
          followUps,
          notes
        },
        isLoading: false
      };

      setResults(allResults);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [searchTasks, searchProjects, searchTimeEntries, searchFollowUps, searchNotes]);

  const searchResultsByType = useMemo(() => {
    return {
      tasks: results.filter(r => r.type === 'task'),
      projects: results.filter(r => r.type === 'project'),
      timeEntries: results.filter(r => r.type === 'time_entry'),
      followUps: results.filter(r => r.type === 'follow_up'),
      notes: results.filter(r => r.type === 'note')
    };
  }, [results]);

  return {
    performGlobalSearch,
    results,
    searchResultsByType,
    isLoading,
    error,
    clearResults: () => setResults([])
  };
};