import { Task, Project, KPIMetrics } from "@/types/task";

export const mockTasks: Task[] = [];

export const mockProjects: Project[] = [];

export const kpiMetrics: KPIMetrics = {
  totalTasks: 0,
  completedTasks: 0,
  overdueTasks: 0,
  completionRate: 0,
  averageTaskDuration: 0,
  tasksByStatus: { "Open": 0, "In Progress": 0, "Completed": 0, "On Hold": 0 },
  tasksByPriority: { "Low": 0, "Medium": 0, "High": 0, "Critical": 0 },
  tasksByUser: {}
};
