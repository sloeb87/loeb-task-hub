export interface TimeEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  projectName: string;
  responsible: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  description?: string;
  createdAt: string;
  isRunning: boolean;
}

export interface TimeEntryFilters {
  month?: string;
  year?: number;
  taskId?: string;
  projectName?: string;
  responsible?: string;
  isRunning?: boolean;
}

export interface TimeEntryStats {
  totalEntries: number;
  totalTime: number; // in minutes
  runningEntries: number;
  averageEntryDuration: number;
}