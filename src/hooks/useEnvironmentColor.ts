import { useParameters } from '@/hooks/useParameters';

// Hook to get environment color based on parameters
export const useEnvironmentColor = () => {
  const { parameters } = useParameters();
  
  const getEnvironmentColor = (environmentName: string) => {
    const environment = parameters.environments.find(e => e.name === environmentName);
    return environment?.color || '#6b7280'; // Default gray if not found
  };

  const getEnvironmentStyle = (environmentName: string) => {
    const color = getEnvironmentColor(environmentName);
    return {
      backgroundColor: `${color}20`, // 20% opacity
      borderColor: color,
      color: color
    };
  };

  return { getEnvironmentColor, getEnvironmentStyle };
};