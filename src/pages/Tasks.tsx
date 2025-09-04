import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Task, Project } from "@/types/task";
import { TaskTableMemo } from "@/components/TaskTableMemo";
import { TaskSummaryCardsOptimized } from "@/components/TaskSummaryCardsOptimized";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useTaskFilters, FilterType } from "@/hooks/useTaskFilters";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { useTaskNavigation } from "@/contexts/TaskFormContext";
import { toast } from "@/hooks/use-toast";
import { ListTodo } from "lucide-react";

const Tasks = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>("active");
  const [sortField, setSortField] = useState<string>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Dynamic page size - 25 for all filters
  const getPageSize = useCallback(() => {
    return 25;
  }, []);

  const { startTimer } = useTimeTracking();
  const { setNavigationCallback } = useTaskNavigation();

  // Set up navigation callback for task editing
  useEffect(() => {
    setNavigationCallback((projectName?: string, task?: Task) => {
      if (task) {
        console.log('Tasks - Navigating to task edit:', task.id);
        navigate(`/tasks/${task.id}`);
      }
    });
  }, [navigate, setNavigationCallback]);

  const {
    tasks,
    isLoading,
    error,
    pagination,
    taskCounts,
    currentSearchTerm,
    loadTasks,
    searchTasks,
    updateTask,
    addFollowUp,
    updateFollowUp,
    deleteFollowUp,
    deleteTask,
    deleteAllRecurringTasks,
    updateAllRecurringTasks,
    getRelatedRecurringTasks,
    refreshTasks
  } = useSupabaseStorage();

  // Handle navigation state from chart clicks
  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      if (state.dateFilter) {
        console.log('Tasks page - received date filter:', state.dateFilter);
      }
    }
  }, [location.state]);

  // Load initial data with correct page size for default filter
  useEffect(() => {
    const pageSize = getPageSize();
    loadTasks(1, pageSize, sortField, sortDirection, activeFilter);
  }, [loadTasks, getPageSize, activeFilter, sortField, sortDirection]);

  // SEO
  useEffect(() => {
    document.title = "Task Management | Task Tracker";
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'Manage your tasks effectively with our comprehensive task management system.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(meta);
    }
  }, []);

  // Since filtering is now done at database level, no need for frontend filtering
  // const { filteredTasks } = useTaskFilters(tasks, activeFilter, location.state?.dateFilter);

  const handleUpdateTask = useCallback(async (updatedTask: Task) => {
    try {
      await updateTask(updatedTask);
      await refreshTasks();
      toast({
        title: "Success",
        description: "Task updated successfully",
      });
    } catch (error) {
      console.error('Failed to update task:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update the task. Please try again.",
        variant: "destructive",
      });
    }
  }, [updateTask, refreshTasks]);

  const handleAddFollowUpWrapper = useCallback(async (taskId: string, followUpText: string) => {
    try {
      await addFollowUp(taskId, followUpText);
    } catch (error) {
      console.error('Failed to add follow-up:', error);
    }
  }, [addFollowUp]);

  const handleUpdateFollowUpWrapper = useCallback(async (taskId: string, followUpId: string, text: string, timestamp?: string) => {
    try {
      await updateFollowUp(followUpId, text, timestamp);
    } catch (error) {
      console.error('Failed to update follow-up:', error);
    }
  }, [updateFollowUp]);

  const handleDeleteFollowUpWrapper = useCallback(async (followUpId: string) => {
    try {
      await deleteFollowUp(followUpId);
    } catch (error) {
      console.error('Failed to delete follow-up:', error);
    }
  }, [deleteFollowUp]);

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handlePageChange = useCallback((page: number) => {
    const pageSize = getPageSize();
    if (currentSearchTerm.trim()) {
      // If we're in search mode, use searchTasks with the current search term
      searchTasks(currentSearchTerm, page, pageSize, sortField, sortDirection);
    } else {
      // If not searching, use loadTasks with filter
      loadTasks(page, pageSize, sortField, sortDirection, activeFilter);
    }
  }, [currentSearchTerm, searchTasks, loadTasks, activeFilter, getPageSize, sortField, sortDirection]);

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error loading tasks: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full p-6 space-y-6">
        <header>
          <div className="flex items-center gap-3 mb-2">
            <ListTodo className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
          </div>
          <p className="text-muted-foreground">
            Organize and track your tasks efficiently
          </p>
        </header>

        <TaskSummaryCardsOptimized
          tasks={tasks}
          taskCounts={taskCounts}
          activeFilter={activeFilter}
          onFilterChange={(filter) => {
            setActiveFilter(filter);
            // Reload with new page size and filter when filter changes
            const pageSize = getPageSize();
            if (currentSearchTerm.trim()) {
              searchTasks(currentSearchTerm, 1, pageSize, sortField, sortDirection);
            } else {
              loadTasks(1, pageSize, sortField, sortDirection, filter);
            }
          }}
          onSortChange={handleSortChange}
        />

        <TaskTableMemo
          tasks={tasks}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          onEditTask={() => {}} // Navigation handled in TaskTable via navigateToTaskEdit
          onFollowUp={() => {}} // Navigation handled in TaskTable via navigateToTaskEdit
          onCompleteTask={handleUpdateTask} // Handle task completion
          pagination={pagination}
          onPageChange={handlePageChange}
          onSearch={(searchTerm, page = 1, _, sortField, sortDirection) => {
            const pageSize = getPageSize();
            searchTasks(searchTerm, page, pageSize, sortField, sortDirection);
          }}
          currentSearchTerm={currentSearchTerm}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
};

export default Tasks;