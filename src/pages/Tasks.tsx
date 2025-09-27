import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Task, Project } from "@/types/task";
import { TaskTableMemo } from "@/components/TaskTableMemo";
import { TaskSummaryCardsOptimized } from "@/components/TaskSummaryCardsOptimized";
import { FollowUpDialog } from "@/components/FollowUpDialog";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useTaskFilters, FilterType } from "@/hooks/useTaskFilters";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { useTaskNavigation } from "@/contexts/TaskFormContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ListTodo } from "lucide-react";

const Tasks = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>("active");
  const [sortField, setSortField] = useState<string>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [selectedTaskForFollowUp, setSelectedTaskForFollowUp] = useState<Task | null>(null);
  const [displayLimit, setDisplayLimit] = useState(10);
  
  // Progressive loading - start with 5, load 5 more each time
  const getPageSize = useCallback(() => {
    return Math.max(displayLimit, 50); // Always load at least what we're displaying
  }, [displayLimit]);

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
    tasks: allTasks,
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

  // Filter tasks to exclude meetings
  const tasks = React.useMemo(() => {
    return allTasks.filter(task => task.taskType !== 'Meeting' && task.taskType !== 'Meeting Recurring');
  }, [allTasks]);

  // Use task counts from useSupabaseStorage hook (calculated from all tasks in DB)
  const nonMeetingTaskCounts = React.useMemo(() => {
    // Calculate counts directly from the actual filtered tasks (non-meetings)
    const nonMeetingTasks = allTasks.filter(task => 
      task.taskType !== 'Meeting' && task.taskType !== 'Meeting Recurring'
    );
    
    // Active = all non-completed tasks (excluding meetings)
    const activeTasks = nonMeetingTasks.filter(task => task.status !== 'Completed');
    const completedTasks = nonMeetingTasks.filter(task => task.status === 'Completed');
    const onHoldTasks = nonMeetingTasks.filter(task => task.status === 'On Hold');
    const criticalTasks = nonMeetingTasks.filter(task => 
      task.priority === 'High' || task.priority === 'Critical'
    );
    
    const today = new Date();
    const overdueTasks = nonMeetingTasks.filter(task => {
      if (task.status === 'Completed') return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < today;
    });
    
    // Debug logging
    console.log('Task count debug:', {
      allTasksLength: allTasks.length,
      nonMeetingTasksLength: nonMeetingTasks.length,
      activeTasksLength: activeTasks.length,
      completedTasksLength: completedTasks.length,
      nonMeetingTasks: nonMeetingTasks.map(t => ({ id: t.id, status: t.status, taskType: t.taskType }))
    });
    
    return {
      total: nonMeetingTasks.length, // All tasks (excluding meetings)
      active: activeTasks.length, // All non-completed tasks (excluding meetings)
      completed: completedTasks.length,
      overdue: overdueTasks.length,
      onHold: onHoldTasks.length,
      critical: criticalTasks.length
    };
  }, [allTasks]);

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
    console.log('Tasks: Loading with activeFilter:', activeFilter);
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
      
      // Force immediate reload if task was completed to refresh the display
      if (updatedTask.status === 'Completed') {
        const pageSize = getPageSize();
        await loadTasks(1, pageSize, sortField, sortDirection, activeFilter);
      } else {
        await refreshTasks();
      }
      
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
  }, [updateTask, refreshTasks, loadTasks, getPageSize, sortField, sortDirection, activeFilter]);

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

  const handleOpenFollowUpDialog = useCallback((task: Task) => {
    setSelectedTaskForFollowUp(task);
    setFollowUpDialogOpen(true);
  }, []);

  const handleCloseFollowUpDialog = useCallback(() => {
    setFollowUpDialogOpen(false);
    setSelectedTaskForFollowUp(null);
  }, []);

  const handleAddFollowUpFromDialog = useCallback(async (text: string) => {
    if (selectedTaskForFollowUp) {
      try {
        await addFollowUp(selectedTaskForFollowUp.id, text);
        await refreshTasks();
        handleCloseFollowUpDialog();
        toast({
          title: "Success",
          description: "Follow-up added successfully",
        });
      } catch (error) {
        console.error('Failed to add follow-up:', error);
        toast({
          title: "Error",
          description: "Failed to add follow-up. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [selectedTaskForFollowUp, addFollowUp, refreshTasks, handleCloseFollowUpDialog]);

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
          taskCounts={nonMeetingTaskCounts}
          activeFilter={activeFilter}
          onFilterChange={(filter) => {
            console.log('Tasks: Filter changed to:', filter);
            setActiveFilter(filter);
            // Reload with new page size and filter when filter changes
            const pageSize = getPageSize();
            if (currentSearchTerm.trim()) {
              searchTasks(currentSearchTerm, 1, pageSize, sortField, sortDirection);
            } else {
              console.log('Tasks: Loading tasks with filter:', filter);
              loadTasks(1, pageSize, sortField, sortDirection, filter);
            }
          }}
          onSortChange={handleSortChange}
        />

        <TaskTableMemo
          tasks={tasks.slice(0, displayLimit)}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          onEditTask={() => {}} // Navigation handled in TaskTable via navigateToTaskEdit
          onFollowUp={handleOpenFollowUpDialog} // Open follow-up dialog for selected task
          onCompleteTask={handleUpdateTask} // Handle task completion
          onSearch={(searchTerm, page = 1, _, sortField, sortDirection) => {
            const pageSize = getPageSize();
            searchTasks(searchTerm, page, pageSize, sortField, sortDirection);
          }}
          currentSearchTerm={currentSearchTerm}
          isLoading={isLoading}
        />

        {/* Load More Button */}
        {displayLimit < tasks.length && (
          <div className="flex justify-center p-6">
            <Button 
              onClick={() => setDisplayLimit(prev => prev + 10)}
              variant="outline"
              size="lg"
              className="min-w-40"
            >
              Load More Tasks
            </Button>
          </div>
        )}

        {/* Follow-up Dialog */}
        {selectedTaskForFollowUp && (
          <FollowUpDialog
            isOpen={followUpDialogOpen}
            onClose={handleCloseFollowUpDialog}
            onAddFollowUp={handleAddFollowUpFromDialog}
            onUpdateFollowUp={handleUpdateFollowUpWrapper}
            onDeleteFollowUp={handleDeleteFollowUpWrapper}
            task={selectedTaskForFollowUp}
          />
        )}
      </main>
    </div>
  );
};

export default Tasks;