import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Task, Project } from "@/types/task";
import { TaskTableMemo } from "@/components/TaskTableMemo";
import { MeetingSummaryCardsOptimized } from "@/components/MeetingSummaryCardsOptimized";
import { FollowUpDialog } from "@/components/FollowUpDialog";
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { useTaskFilters, FilterType } from "@/hooks/useTaskFilters";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import { useTaskNavigation } from "@/contexts/TaskFormContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { OptimizedLoading } from "@/components/OptimizedLoading";
import { Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { markMeetingsCompletedUntilDate } from "@/utils/markMeetingsCompleted";

const Meetings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>("active");
  const [sortField, setSortField] = useState<string>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [selectedTaskForFollowUp, setSelectedTaskForFollowUp] = useState<Task | null>(null);
  
  // Progressive loading - start with 10, load 10 more each time
  const [displayLimit, setDisplayLimit] = useState(10);
  const getPageSize = useCallback(() => {
    return Math.max(displayLimit, 25); // Always load at least what we're displaying
  }, [displayLimit]);

  const { startTimer } = useTimeTracking();
  const { setNavigationCallback } = useTaskNavigation();

  const {
    tasks: allTasks,
    allMeetings,
    meetingCounts,
    isLoading,
    error,
    pagination,
    taskCounts,
    currentSearchTerm,
    loadTasks,
    loadAllMeetings,
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

  // IMPORTANT: All hooks must be called before any early returns
  // Memoize filtered tasks for better performance with search support
  const filteredTasks = React.useMemo(() => {
    if (!allMeetings) return [];
    
    let filtered = allMeetings;
    
    // Apply search filter if there's a search term
    if (currentSearchTerm.trim()) {
      const searchLower = currentSearchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.responsible.toLowerCase().includes(searchLower) ||
        task.followUps.some(fu => fu.text.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply active filter
    return filtered.filter(task => {
      if (activeFilter === 'open') return task.status === 'Open';
      if (activeFilter === 'active') return task.status !== 'Completed'; // Active = not completed
      if (activeFilter === 'inprogress') return task.status === 'In Progress';
      if (activeFilter === 'onhold') return task.status === 'On Hold';
      if (activeFilter === 'critical') return task.priority === 'Critical' && task.status !== 'Completed'; // Match hook logic
      return true; // 'all' or any other filter
    });
  }, [allMeetings, activeFilter, currentSearchTerm]);

  // Memoize sorted and sliced tasks
  const displayedTasks = React.useMemo(() => {
    if (!filteredTasks.length) return [];
    const sorted = filteredTasks.sort((a, b) => {
      const aTime = new Date(a.dueDate).getTime();
      const bTime = new Date(b.dueDate).getTime();
      return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
    });
    return sorted.slice(0, displayLimit);
  }, [filteredTasks, sortDirection, displayLimit]);

  // Use all meetings from the dedicated hook
  const tasks = allMeetings || [];

  // Use meeting counts directly from the hook
  const meetingTaskCounts = meetingCounts;

  // Set up navigation callback for meeting editing
  useEffect(() => {
    setNavigationCallback((projectName?: string, task?: Task) => {
      if (task) {
        console.log('Meetings - Navigating to meeting edit:', task.id);
        navigate(`/tasks/${task.id}`);
      }
    });
  }, [navigate, setNavigationCallback]);

  // Handle navigation state from chart clicks
  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      if (state.dateFilter) {
        console.log('Meetings page - received date filter:', state.dateFilter);
      }
    }
  }, [location.state]);

  // Load all meetings on component mount
  useEffect(() => {
    console.log('Meetings: Loading all meetings');
    loadAllMeetings();
  }, [loadAllMeetings]);

  // SEO
  useEffect(() => {
    document.title = "Meeting Management | Task Tracker";
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'Manage your meetings effectively with our comprehensive meeting management system.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(meta);
    }
  }, []);

  const handleUpdateTask = useCallback(async (updatedTask: Task) => {
    try {
      await updateTask(updatedTask);
      
      // Force immediate reload if task was completed to refresh the display
      if (updatedTask.status === 'Completed') {
        await loadAllMeetings();
      } else {
        await refreshTasks();
      }
      
      toast({
        title: "Success",
        description: "Meeting updated successfully",
      });
    } catch (error) {
      console.error('Failed to update meeting:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update the meeting. Please try again.",
        variant: "destructive",
      });
    }
  }, [updateTask, refreshTasks, loadAllMeetings]);

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

  const handleMarkMeetingsCompleted = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to perform this action",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await markMeetingsCompletedUntilDate('2025-11-10', user.id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || `Marked ${result.count} meetings as completed`,
        });
        
        // Reload meetings
        await loadAllMeetings();
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update meetings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to mark meetings completed:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }, [user, loadAllMeetings]);

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          Error loading meetings: {error}
        </div>
      </div>
    );
  }

  // Show optimized loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="w-full p-6 space-y-6">
          <header>
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold tracking-tight">Meeting Management</h1>
            </div>
            <p className="text-muted-foreground">
              Organize and track your meetings efficiently
            </p>
          </header>
          <OptimizedLoading type="meetings" count={5} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full p-6 space-y-6">
        <header>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold tracking-tight">Meeting Management</h1>
            </div>
            <Button 
              onClick={handleMarkMeetingsCompleted}
              variant="outline"
            >
              Mark Meetings Complete (until Nov 10)
            </Button>
          </div>
          <p className="text-muted-foreground">
            Organize and track your meetings efficiently
          </p>
        </header>

        <MeetingSummaryCardsOptimized
          tasks={tasks}
          taskCounts={meetingTaskCounts}
          activeFilter={activeFilter}
          onFilterChange={(filter) => {
            console.log('Meetings: Filter changed to:', filter);
            setActiveFilter(filter);
            // Reset display limit when filter changes
            setDisplayLimit(10);
          }}
          onSortChange={handleSortChange}
        />

        <TaskTableMemo
          tasks={displayedTasks}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          onEditTask={() => {}} // Navigation handled in TaskTable via navigateToTaskEdit
          onFollowUp={handleOpenFollowUpDialog} // Open follow-up dialog for selected meeting
          onCompleteTask={handleUpdateTask} // Handle meeting completion
          onToggleFavorite={handleUpdateTask} // Handle favorite toggle
          onSearch={() => {
            // For meetings, search is handled locally in the filteredTasks memo
            // No need for external search since we load all meetings
          }}
          currentSearchTerm={currentSearchTerm}
          isLoading={isLoading}
        />

        {/* Load More Button */}
        {displayLimit < filteredTasks.length && (
          <div className="flex justify-center p-6">
            <Button 
              onClick={() => setDisplayLimit(prev => prev + 10)}
              variant="outline"
              size="lg"
              className="min-w-40"
            >
              Load More Meetings
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

export default Meetings;