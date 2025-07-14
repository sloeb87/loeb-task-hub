
export type TaskStatus = "Open" | "In Progress" | "Completed" | "On Hold";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";
export type TaskType = "Development" | "Testing" | "Documentation" | "Review" | "Meeting" | "Research";

export interface FollowUp {
  id: string;
  text: string;
  timestamp: string;
  author: string;
}

export interface Task {
  id: string;
  scope: string;
  project: string;
  environment: string;
  taskType: TaskType;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  responsible: string;
  creationDate: string;
  startDate: string;
  dueDate: string;
  completionDate?: string;
  duration?: number; // in days
  dependencies?: string[]; // Task IDs that this task depends on
  followUps: FollowUp[];
  comments?: { text: string; timestamp: string }[];
  details: string;
  links: {
    oneNote?: string;
    teams?: string;
    email?: string;
    file?: string;
    folder?: string;
  };
  stakeholders: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  team: string[];
  startDate: string;
  endDate: string;
  status: "Active" | "On Hold" | "Completed";
  tasks: string[]; // Task IDs
}

export interface KPIMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageTaskDuration: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
  tasksByUser: Record<string, number>;
}
