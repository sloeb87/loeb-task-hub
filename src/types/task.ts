
export type TaskStatus = "Open" | "In Progress" | "Completed" | "On Hold";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";
export type TaskType = "Development" | "Testing" | "Documentation" | "Review" | "Meeting" | "Meeting Recurring" | "Research";

export interface FollowUp {
  id: string;
  text: string;
  timestamp: string;
  taskStatus?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  timestamp: string;
}

export interface NamedLink {
  id: string;
  name: string;
  url: string;
}

export interface Task {
  id: string; // Task number like T468 - this is the primary identifier users see and work with
  uuid?: string; // Database UUID for internal operations (optional for compatibility)
  scope: string[]; // Changed to array to support multiple scopes
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
  plannedTimeHours?: number; // planned time in hours
  dependencies?: string[]; // Task IDs that this task depends on
  followUps: FollowUp[];
  checklist: ChecklistItem[];
  details: string;
  links: {
    oneNote?: NamedLink[];
    teams?: NamedLink[];
    email?: NamedLink[];
    file?: NamedLink[];
    folder?: NamedLink[];
  };
  stakeholders: string[];
  // Recurring task fields
  isRecurring?: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly';
  recurrenceInterval?: number;
  recurrenceDaysOfWeek?: number[]; // Array of day numbers (0=Sunday, 1=Monday, etc.)
  parentTaskId?: string;
  nextRecurrenceDate?: string;
  recurrenceEndDate?: string;
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
  scope: string[]; // Changed to array to support multiple scopes
  cost_center?: string; // Added cost center to Project
  links?: {
    oneNote?: NamedLink[];
    teams?: NamedLink[];
    email?: NamedLink[];
    file?: NamedLink[];
    folder?: NamedLink[];
  };
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
