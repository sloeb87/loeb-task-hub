import { useParameters } from '@/hooks/useParameters';

// Hook to get scope color based on parameters
export const useScopeColor = () => {
  const { parameters } = useParameters();
  
  const getScopeColor = (scopeName: string) => {
    const scope = parameters.scopes.find(s => s.name === scopeName);
    return scope?.color || '#6b7280'; // Default gray if not found
  };

  const getScopeStyle = (scopeName: string) => {
    const color = getScopeColor(scopeName);
    return {
      backgroundColor: `${color}20`, // 20% opacity
      borderColor: color,
      color: color
    };
  };

  return { getScopeColor, getScopeStyle };
};