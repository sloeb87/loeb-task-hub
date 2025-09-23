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
import { Users } from "lucide-react";

const Meetings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>("active");
  const [sortField, setSortField] = useState<string>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [selectedTaskForFollowUp, setSelectedTaskForFollowUp] = useState<Task | null>(null);
  
  // Progressive loading - start with 5, load 5 more each time
  const [displayLimit, setDisplayLimit] = useState(5);
  const getPageSize = useCallback(() => {
    return Math.max(displayLimit, 25); // Always load at least what we're displaying
  }, [displayLimit]);

  const { startTimer } = useTimeTracking();
  const { setNavigationCallback } = useTaskNavigation();

  // Set up navigation callback for meeting editing
  useEffect(() => {
    setNavigationCallback((projectName?: string, task?: Task) => {
      if (task) {
        console.log('Meetings - Navigating to meeting edit:', task.id);
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
    meetingCounts,
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

  // Load all meetings separately for meetings page
  const [allMeetings, setAllMeetings] = useState<Task[]>([]);

  // Filter meetings to show based on current filter
  const tasks = React.useMemo(() => {
    if (!allMeetings.length) return [];
    
    switch (activeFilter) {
      case 'active':
        return allMeetings.filter(task => task.status === 'Open' || task.status === 'In Progress');
      case 'open':
        return allMeetings.filter(task => task.status === 'Open');
      case 'inprogress':
        return allMeetings.filter(task => task.status === 'In Progress');
      case 'onhold':
        return allMeetings.filter(task => task.status === 'On Hold');
      case 'critical':
        return allMeetings.filter(task => task.priority === 'Critical' || task.priority === 'High');
      case 'all':
      default:
        return allMeetings;
    }
  }, [allMeetings, activeFilter]);

  // Stable counts from DB (meetings only)
  const meetingTaskCounts = meetingCounts;

  // Handle navigation state from chart clicks
  useEffect(() => {
    if (location.state) {
      const state = location.state as any;
      if (state.dateFilter) {
        console.log('Meetings page - received date filter:', state.dateFilter);
      }
    }
  }, [location.state]);

  // Load all meetings when component mounts
  useEffect(() => {
    const loadMeetings = async () => {
      if (loadAllMeetings) {
        const meetings = await loadAllMeetings();
        setAllMeetings(meetings);
      }
    };
    loadMeetings();
  }, [loadAllMeetings]);

  // Load initial data with correct page size for default filter
  useEffect(() => {
    const pageSize = getPageSize();
    console.log('Meetings: Loading with activeFilter:', activeFilter);
    loadTasks(1, pageSize, sortField, sortDirection, activeFilter);
  }, [loadTasks, getPageSize, activeFilter, sortField, sortDirection]);

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
      await refreshTasks();
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
          Error loading meetings: {error}
        </div>
      </div>
    );
  }

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

        <MeetingSummaryCardsOptimized
          tasks={tasks}
          taskCounts={meetingTaskCounts}
          activeFilter={activeFilter}
          onFilterChange={(filter) => {
            console.log('Meetings: Filter changed to:', filter);
            setActiveFilter(filter);
            // Reload with new page size and filter when filter changes
            const pageSize = getPageSize();
            if (currentSearchTerm.trim()) {
              searchTasks(currentSearchTerm, 1, pageSize, sortField, sortDirection);
            } else {
              console.log('Meetings: Loading meetings with filter:', filter);
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
          onFollowUp={handleOpenFollowUpDialog} // Open follow-up dialog for selected meeting
          onCompleteTask={handleUpdateTask} // Handle meeting completion
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
              onClick={() => setDisplayLimit(prev => prev + 5)}
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