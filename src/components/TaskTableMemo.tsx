import React from 'react';
import { TaskTable } from './TaskTable';
import { Task } from '@/types/task';

interface TaskTableMemoProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onFollowUp: (task: Task) => void;
  onCompleteTask?: (task: Task) => void;
  hideProjectColumn?: boolean;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalTasks: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void;
  onSearch?: (searchTerm: string, page?: number, pageSize?: number, sortField?: string, sortDirection?: 'asc' | 'desc') => void;
  currentSearchTerm?: string;
}

export const TaskTableMemo = React.memo<TaskTableMemoProps>(({
  tasks,
  onEditTask,
  onFollowUp,
  onCompleteTask,
  hideProjectColumn = false,
  pagination,
  onPageChange,
  isLoading = false,
  sortField = 'dueDate',
  sortDirection = 'asc',
  onSortChange,
  onSearch,
  currentSearchTerm = ""
}) => {
  return (
    <TaskTable
      tasks={tasks}
      onEditTask={onEditTask}
      onFollowUp={onFollowUp}
      onCompleteTask={onCompleteTask}
      hideProjectColumn={hideProjectColumn}
      pagination={pagination}
      onPageChange={onPageChange}
      isLoading={isLoading}
      sortField={sortField}
      sortDirection={sortDirection}
      onSortChange={onSortChange}
      onSearch={onSearch}
      currentSearchTerm={currentSearchTerm}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.tasks === nextProps.tasks &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.hideProjectColumn === nextProps.hideProjectColumn &&
    prevProps.sortField === nextProps.sortField &&
    prevProps.sortDirection === nextProps.sortDirection &&
    prevProps.currentSearchTerm === nextProps.currentSearchTerm &&
    JSON.stringify(prevProps.pagination) === JSON.stringify(nextProps.pagination)
  );
});

TaskTableMemo.displayName = 'TaskTableMemo';