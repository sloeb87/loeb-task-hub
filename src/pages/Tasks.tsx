import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Task, Project } from "@/types/task";
import { TaskTable } from "@/components/TaskTable";
import { TaskSummaryCardsOptimized } from "@/components/TaskSummaryCardsOptimized";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useTaskFilters, FilterType } from "@/hooks/useTaskFilters";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { toast } from "@/hooks/use-toast";

const Tasks = () => {
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState<FilterType>("active");
  const [sortField, setSortField] = useState<string>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { startTimer } = useTimeTracking();

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

  const { filteredTasks } = useTaskFilters(tasks, activeFilter, location.state?.dateFilter);

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
      <main className="container mx-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted-foreground">
            Organize and track your tasks efficiently
          </p>
        </header>

        <TaskSummaryCardsOptimized
          tasks={tasks}
          taskCounts={taskCounts}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onSortChange={handleSortChange}
        />

        <TaskTable
          tasks={filteredTasks}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          onEditTask={() => {}} // Navigation handled in TaskTable via navigateToTaskEdit
          onFollowUp={() => {}} // Navigation handled in TaskTable via navigateToTaskEdit
          pagination={pagination}
          onSearch={searchTasks}
          currentSearchTerm={currentSearchTerm}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
};

export default Tasks;