import { Task, TaskStatus, TaskPriority } from '@/types/task';

// Status color utility
export const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case "Open":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "In Progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "On Hold":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case "Completed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

// Priority color utility
export const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case "Critical":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "High":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case "Medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "Low":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

// Check if task is overdue
export const isOverdue = (dueDate: string, status: TaskStatus): boolean => {
  if (status === "Completed") return false;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
};

// Calculate task completion percentage
export const getTaskCompletionPercentage = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  const completedTasks = tasks.filter(task => task.status === "Completed").length;
  return Math.round((completedTasks / tasks.length) * 100);
};

// Get task statistics
export const getTaskStats = (tasks: Task[]) => {
  return {
    total: tasks.length,
    open: tasks.filter(t => t.status === "Open").length,
    inProgress: tasks.filter(t => t.status === "In Progress").length,
    onHold: tasks.filter(t => t.status === "On Hold").length,
    completed: tasks.filter(t => t.status === "Completed").length,
    critical: tasks.filter(t => t.priority === "Critical").length,
    overdue: tasks.filter(t => isOverdue(t.dueDate, t.status)).length
  };
};

// Sort tasks by different criteria
export const sortTasks = (tasks: Task[], sortBy: string, direction: 'asc' | 'desc'): Task[] => {
  return [...tasks].sort((a, b) => {
    let aValue: any = a[sortBy as keyof Task];
    let bValue: any = b[sortBy as keyof Task];

    // Handle date sorting
    if (sortBy === 'dueDate' || sortBy === 'creationDate' || sortBy === 'startDate') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    // Handle string sorting
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

// Filter tasks by search term
export const searchTasks = (tasks: Task[], searchTerm: string): Task[] => {
  if (!searchTerm.trim()) return tasks;

  const term = searchTerm.toLowerCase();
  return tasks.filter(task =>
    task.title.toLowerCase().includes(term) ||
    task.description.toLowerCase().includes(term) ||
    task.id.toLowerCase().includes(term) ||
    task.project.toLowerCase().includes(term) ||
    task.responsible.toLowerCase().includes(term)
  );
};

// Get tasks by project
export const getTasksByProject = (tasks: Task[], projectName: string): Task[] => {
  return tasks.filter(task => task.project === projectName);
};

// Get project statistics
export const getProjectStats = (tasks: Task[], projectName: string) => {
  const projectTasks = getTasksByProject(tasks, projectName);
  return getTaskStats(projectTasks);
};

// Format date for display
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Get relative time (e.g., "2 days ago")
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
};