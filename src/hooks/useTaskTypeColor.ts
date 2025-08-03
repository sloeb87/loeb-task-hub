import { useParameters } from '@/hooks/useParameters';

// Hook to get task type color based on parameters
export const useTaskTypeColor = () => {
  const { parameters } = useParameters();
  
  const getTaskTypeColor = (taskTypeName: string) => {
    const taskType = parameters.taskTypes.find(t => t.name === taskTypeName);
    return taskType?.color || '#6b7280'; // Default gray if not found
  };

  const getTaskTypeStyle = (taskTypeName: string) => {
    const color = getTaskTypeColor(taskTypeName);
    return {
      backgroundColor: `${color}20`, // 20% opacity
      borderColor: color,
      color: color
    };
  };

  return { getTaskTypeColor, getTaskTypeStyle };
};