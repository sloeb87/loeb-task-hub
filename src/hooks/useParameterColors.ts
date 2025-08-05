import { useParameters } from '@/hooks/useParameters';
import { useMemo } from 'react';

export type ParameterType = 'scopes' | 'statuses' | 'priorities' | 'taskTypes' | 'environments';

// Consolidated hook for all parameter-based colors
export const useParameterColors = () => {
  const { parameters, loading } = useParameters();
  
  // Memoize color functions to prevent recreating them on every render
  const colorFunctions = useMemo(() => {
    const getParameterColor = (type: ParameterType, name: string): string => {
      const item = parameters[type].find((p: any) => p.name === name);
      return item?.color || '#6b7280'; // Default gray if not found
    };

    const getParameterStyle = (type: ParameterType, name: string) => {
      const color = getParameterColor(type, name);
      return {
        backgroundColor: `${color}20`, // 20% opacity
        borderColor: color,
        color: color
      };
    };

    // Individual getters for backward compatibility
    const getScopeColor = (scopeName: string) => getParameterColor('scopes', scopeName);
    const getScopeStyle = (scopeName: string) => getParameterStyle('scopes', scopeName);
    
    const getStatusColor = (statusName: string) => getParameterColor('statuses', statusName);
    const getStatusStyle = (statusName: string) => getParameterStyle('statuses', statusName);
    
    const getPriorityColor = (priorityName: string) => getParameterColor('priorities', priorityName);
    const getPriorityStyle = (priorityName: string) => getParameterStyle('priorities', priorityName);
    
    const getTaskTypeColor = (taskTypeName: string) => getParameterColor('taskTypes', taskTypeName);
    const getTaskTypeStyle = (taskTypeName: string) => getParameterStyle('taskTypes', taskTypeName);
    
    const getEnvironmentColor = (environmentName: string) => getParameterColor('environments', environmentName);
    const getEnvironmentStyle = (environmentName: string) => getParameterStyle('environments', environmentName);

    return {
      // Generic functions
      getParameterColor,
      getParameterStyle,
      
      // Specific functions for backward compatibility
      getScopeColor,
      getScopeStyle,
      getStatusColor,
      getStatusStyle,
      getPriorityColor,
      getPriorityStyle,
      getTaskTypeColor,
      getTaskTypeStyle,
      getEnvironmentColor,
      getEnvironmentStyle,
      
      // Loading state
      loading
    };
  }, [parameters]);

  return colorFunctions;
};

// Individual hooks for backward compatibility (now just wrappers)
export const useScopeColor = () => {
  const { getScopeColor, getScopeStyle, loading } = useParameterColors();
  return { getScopeColor, getScopeStyle, loading };
};

export const useStatusColor = () => {
  const { getStatusColor, getStatusStyle, loading } = useParameterColors();
  return { getStatusColor, getStatusStyle, loading };
};

export const usePriorityColor = () => {
  const { getPriorityColor, getPriorityStyle, loading } = useParameterColors();
  return { getPriorityColor, getPriorityStyle, loading };
};

export const useTaskTypeColor = () => {
  const { getTaskTypeColor, getTaskTypeStyle, loading } = useParameterColors();
  return { getTaskTypeColor, getTaskTypeStyle, loading };
};

export const useEnvironmentColor = () => {
  const { getEnvironmentColor, getEnvironmentStyle, loading } = useParameterColors();
  return { getEnvironmentColor, getEnvironmentStyle, loading };
};