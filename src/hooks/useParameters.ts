import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Parameter {
  id: string;
  name: string;
  color: string;
  category: 'scopes' | 'environments' | 'taskTypes' | 'statuses' | 'priorities';
}

interface Parameters {
  scopes: Parameter[];
  environments: Parameter[];
  taskTypes: Parameter[];
  statuses: Parameter[];
  priorities: Parameter[];
}

const DEFAULT_PARAMETERS: Parameters = {
  scopes: [
    { id: '1', name: 'Frontend', color: '#3b82f6', category: 'scopes' },
    { id: '2', name: 'Backend', color: '#10b981', category: 'scopes' },
    { id: '3', name: 'Database', color: '#8b5cf6', category: 'scopes' },
    { id: '4', name: 'Infrastructure', color: '#f59e0b', category: 'scopes' },
    { id: '5', name: 'Mobile', color: '#ef4444', category: 'scopes' },
    { id: '6', name: 'API', color: '#06b6d4', category: 'scopes' },
    { id: '7', name: 'UI/UX', color: '#ec4899', category: 'scopes' },
    { id: '8', name: 'DevOps', color: '#84cc16', category: 'scopes' }
  ],
  environments: [
    { id: '1', name: 'Development', color: '#3b82f6', category: 'environments' },
    { id: '2', name: 'Testing', color: '#10b981', category: 'environments' },
    { id: '3', name: 'Staging', color: '#f59e0b', category: 'environments' },
    { id: '4', name: 'Production', color: '#ef4444', category: 'environments' },
    { id: '5', name: 'Demo', color: '#8b5cf6', category: 'environments' }
  ],
  taskTypes: [
    { id: '1', name: 'Development', color: '#3b82f6', category: 'taskTypes' },
    { id: '2', name: 'Testing', color: '#10b981', category: 'taskTypes' },
    { id: '3', name: 'Documentation', color: '#f59e0b', category: 'taskTypes' },
    { id: '4', name: 'Review', color: '#8b5cf6', category: 'taskTypes' },
    { id: '5', name: 'Meeting', color: '#06b6d4', category: 'taskTypes' },
    { id: '6', name: 'Research', color: '#ec4899', category: 'taskTypes' }
  ],
  statuses: [
    { id: '1', name: 'Open', color: '#6b7280', category: 'statuses' },
    { id: '2', name: 'In Progress', color: '#3b82f6', category: 'statuses' },
    { id: '3', name: 'Completed', color: '#10b981', category: 'statuses' },
    { id: '4', name: 'On Hold', color: '#f59e0b', category: 'statuses' }
  ],
  priorities: [
    { id: '1', name: 'Low', color: '#10b981', category: 'priorities' },
    { id: '2', name: 'Medium', color: '#f59e0b', category: 'priorities' },
    { id: '3', name: 'High', color: '#ef4444', category: 'priorities' },
    { id: '4', name: 'Critical', color: '#dc2626', category: 'priorities' }
  ]
};

export const useParameters = () => {
  const [parameters, setParameters] = useState<Parameters>(DEFAULT_PARAMETERS);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadParameters = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('parameters')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading parameters:', error);
        return;
      }

      if (data && data.length > 0) {
        // Group parameters by category
        const groupedParams = data.reduce((acc, param) => {
          const category = param.category as 'scopes' | 'environments' | 'taskTypes' | 'statuses' | 'priorities';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push({
            id: param.id,
            name: param.name,
            color: param.color,
            category: category
          });
          return acc;
        }, {} as Record<string, Parameter[]>);

        // Merge with defaults for any missing categories
        const updatedParameters = {
          scopes: groupedParams.scopes || DEFAULT_PARAMETERS.scopes,
          environments: groupedParams.environments || DEFAULT_PARAMETERS.environments,
          taskTypes: groupedParams.taskTypes || DEFAULT_PARAMETERS.taskTypes,
          statuses: groupedParams.statuses || DEFAULT_PARAMETERS.statuses,
          priorities: groupedParams.priorities || DEFAULT_PARAMETERS.priorities,
        };

        setParameters(updatedParameters);
      }
    } catch (error) {
      console.error('Error loading parameters:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadParameters();
    }
  }, [user]);

  return {
    parameters,
    loading,
    refreshParameters: loadParameters
  };
};