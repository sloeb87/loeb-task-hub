import { useParameters } from '@/hooks/useParameters';

// Hook to get priority color based on parameters
export const usePriorityColor = () => {
  const { parameters } = useParameters();
  
  const getPriorityColor = (priorityName: string) => {
    const priority = parameters.priorities.find(p => p.name === priorityName);
    return priority?.color || '#6b7280'; // Default gray if not found
  };

  const getPriorityStyle = (priorityName: string) => {
    const color = getPriorityColor(priorityName);
    return {
      backgroundColor: `${color}20`, // 20% opacity
      borderColor: color,
      color: color
    };
  };

  return { getPriorityColor, getPriorityStyle };
};