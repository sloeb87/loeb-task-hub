import { useParameters } from '@/hooks/useParameters';

// Hook to get status color based on parameters
export const useStatusColor = () => {
  const { parameters } = useParameters();
  
  const getStatusColor = (statusName: string) => {
    const status = parameters.statuses.find(s => s.name === statusName);
    return status?.color || '#6b7280'; // Default gray if not found
  };

  const getStatusStyle = (statusName: string) => {
    const color = getStatusColor(statusName);
    return {
      backgroundColor: `${color}20`, // 20% opacity
      borderColor: color,
      color: color
    };
  };

  return { getStatusColor, getStatusStyle };
};