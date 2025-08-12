import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { TimeEntry, TimeEntryFilters, TimeEntryStats } from '@/types/timeEntry';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TaskTimeData {
  taskId: string;
  totalTime: number; // in minutes
  isRunning: boolean;
  currentSessionStart?: string;
  currentEntryId?: string;
}

export function useTimeTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [taskTimers, setTaskTimers] = useState<Map<string, TaskTimeData>>(new Map());
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing time data
  useEffect(() => {
    if (user) {
      loadTimeData();
    }
  }, [user]);

  // Listen for manual data refresh events
  useEffect(() => {
    const handleTimeEntriesUpdated = () => {
      if (user) {
        loadTimeData();
      }
    };

    window.addEventListener('timeEntriesUpdated', handleTimeEntriesUpdated);
    return () => {
      window.removeEventListener('timeEntriesUpdated', handleTimeEntriesUpdated);
    };
  }, [user]);

  // Realtime subscription for time_entries
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, () => {
        loadTimeData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Update running timers every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTaskTimers(prev => {
        const newMap = new Map(prev);
        let hasChanges = false;
        
        newMap.forEach((taskData, taskId) => {
          if (taskData.isRunning && taskData.currentSessionStart) {
            const startTime = new Date(taskData.currentSessionStart);
            const currentTime = new Date();
            const sessionMinutes = Math.floor((currentTime.getTime() - startTime.getTime()) / (1000 * 60));
            
            // Update total time with current session
            const baseTime = taskData.totalTime - (taskData.isRunning ? Math.floor((currentTime.getTime() - startTime.getTime()) / (1000 * 60)) : 0);
            const newTotalTime = baseTime + sessionMinutes;
            
            if (newTotalTime !== taskData.totalTime) {
              newMap.set(taskId, {
                ...taskData,
                totalTime: newTotalTime
              });
              hasChanges = true;
            }
          }
        });
        
        return hasChanges ? newMap : prev;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const loadTimeData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Load time entries from database
      const { data: timeEntriesData, error: timeEntriesError } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (timeEntriesError) {
        console.error('Error loading time entries:', timeEntriesError);
        return;
      }

      // Convert database entries to TimeEntry format
      const entries: TimeEntry[] = (timeEntriesData || []).map(entry => ({
        id: entry.id,
        taskId: entry.task_id,
        taskTitle: entry.task_title,
        projectName: entry.project_name,
        responsible: entry.responsible,
        userId: entry.user_id,
        startTime: entry.start_time,
        endTime: entry.end_time,
        duration: entry.duration,
        description: entry.description,
        isRunning: entry.is_running,
        createdAt: entry.created_at
      }));

      setTimeEntries(entries);

      // Calculate task totals from database entries
      const taskTimeMap = new Map<string, TaskTimeData>();
      entries.forEach(entry => {
        const taskId = entry.taskId;
        const existing = taskTimeMap.get(taskId) || {
          taskId,
          totalTime: 0,
          isRunning: false
        };

        // Add duration to total time
        if (entry.duration) {
          existing.totalTime += entry.duration;
        }

        // If this is a running entry, mark as running
        if (entry.isRunning) {
          existing.isRunning = true;
          existing.currentSessionStart = entry.startTime;
          existing.currentEntryId = entry.id;
        }

        taskTimeMap.set(taskId, existing);
      });

      setTaskTimers(taskTimeMap);
    } catch (error) {
      console.error('Error loading time data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = useCallback(async (taskId: string, taskTitle?: string, projectName?: string, responsible?: string) => {
    if (!user) return;

    try {
      // Check if there's already a running timer for this task
      const existingTimer = taskTimers.get(taskId);
      if (existingTimer?.isRunning) return;

      // Stop any other running timers
      const runningTasks = Array.from(taskTimers.entries())
        .filter(([_, data]) => data.isRunning)
        .map(([id]) => id);
      
      for (const runningTaskId of runningTasks) {
        await stopTimer(runningTaskId);
      }

      // Create new time entry in database
      const startTime = new Date().toISOString();
      
      const { data: newEntry, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: user.id,
          task_id: taskId,
          task_title: taskTitle || taskId,
          project_name: projectName || 'Unknown Project',
          responsible: responsible || 'Unknown',
          start_time: startTime,
          description: 'Timer session',
          is_running: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating time entry:', error);
        toast({ title: 'Failed to start timer', variant: 'destructive' });
        return;
      }

      // Convert to TimeEntry format
      const timeEntry: TimeEntry = {
        id: newEntry.id,
        taskId: newEntry.task_id,
        taskTitle: newEntry.task_title,
        projectName: newEntry.project_name,
        responsible: newEntry.responsible,
        userId: newEntry.user_id,
        startTime: newEntry.start_time,
        description: newEntry.description,
        isRunning: newEntry.is_running,
        createdAt: newEntry.created_at
      };

      // Update time entries
      setTimeEntries(prev => [timeEntry, ...prev]);
      
      // Update local state
      setTaskTimers(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(taskId) || {
          taskId,
          totalTime: 0,
          isRunning: false
        };
        
        newMap.set(taskId, {
          ...current,
          isRunning: true,
          currentSessionStart: startTime,
          currentEntryId: newEntry.id
        });
        
        return newMap;
      });
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  }, [user, taskTimers]);

  const stopTimer = useCallback(async (taskId: string) => {
    if (!user) return;

    try {
      const taskData = taskTimers.get(taskId);
      if (!taskData?.isRunning || !taskData.currentSessionStart || !taskData.currentEntryId) return;

      const endTime = new Date();
      const startTime = new Date(taskData.currentSessionStart);
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      // Update the time entry in database
      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: endTime.toISOString(),
          duration: duration,
          is_running: false
        })
        .eq('id', taskData.currentEntryId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating time entry:', error);
        toast({ title: 'Failed to stop timer', variant: 'destructive' });
        return;
      }

      // Update the time entry in state
      setTimeEntries(prev => 
        prev.map(entry => 
          entry.id === taskData.currentEntryId
            ? {
                ...entry,
                endTime: endTime.toISOString(),
                duration: duration,
                isRunning: false
              }
            : entry
        )
      );

      // Update local state
      setTaskTimers(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(taskId);
        if (current) {
          newMap.set(taskId, {
            ...current,
            isRunning: false,
            currentSessionStart: undefined,
            currentEntryId: undefined,
            totalTime: current.totalTime + duration
          });
        }
        
        return newMap;
      });
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  }, [user, taskTimers]);

  const getTaskTime = useCallback((taskId: string): TaskTimeData => {
    return taskTimers.get(taskId) || {
      taskId,
      totalTime: 0,
      isRunning: false
    };
  }, [taskTimers]);

  const getTotalTimeForAllTasks = useCallback((): number => {
    // Calculate from actual time entries to avoid inflated running timer values
    return timeEntries.reduce((total, entry) => total + (entry.duration || 0), 0);
  }, [timeEntries]);

  const getFilteredTimeEntries = useCallback((filters: TimeEntryFilters): TimeEntry[] => {
    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      
      // Date range filter (takes priority over year/month)
      if (filters.dateRange?.from && filters.dateRange?.to) {
        const from = new Date(filters.dateRange.from);
        const to = new Date(filters.dateRange.to);
        to.setHours(23, 59, 59, 999); // Include the entire end date
        
        if (entryDate < from || entryDate > to) {
          return false;
        }
      } else {
        // Fallback to year/month filtering
        if (filters.year && entryDate.getFullYear() !== filters.year) {
          return false;
        }
        
        if (filters.month && (entryDate.getMonth() + 1).toString().padStart(2, '0') !== filters.month) {
          return false;
        }
      }
      
      // Task filter
      if (filters.taskId && entry.taskId !== filters.taskId) return false;
      
      // Project filter
      if (filters.projectName && entry.projectName !== filters.projectName) return false;
      
      // Responsible filter
      if (filters.responsible && entry.responsible !== filters.responsible) return false;
      
      // Running status filter
      if (filters.isRunning !== undefined && entry.isRunning !== filters.isRunning) return false;
      
      return true;
    });
  }, [timeEntries]);

  const getTimeEntryStats = useCallback((entries: TimeEntry[]): TimeEntryStats => {
    const totalTime = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const runningEntries = entries.filter(entry => entry.isRunning).length;
    const completedEntries = entries.filter(entry => !entry.isRunning && entry.duration);
    const averageEntryDuration = completedEntries.length > 0 
      ? completedEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / completedEntries.length 
      : 0;

    return {
      totalEntries: entries.length,
      totalTime,
      runningEntries,
      averageEntryDuration
    };
  }, []);

  const deleteTimeEntry = useCallback(async (entryId: string) => {
    if (!user) return;

    try {
      // Delete from database
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting time entry:', error);
        toast({ title: 'Failed to delete time entry', variant: 'destructive' });
        return;
      }

      // Remove from state
      setTimeEntries(prev => prev.filter(entry => entry.id !== entryId));
      
      // Reload time data to recalculate totals
      await loadTimeData();
    } catch (error) {
      console.error('Error deleting time entry:', error);
    }
  }, [user, loadTimeData]);

  return {
    taskTimers,
    timeEntries,
    isLoading,
    startTimer,
    stopTimer,
    getTaskTime,
    getTotalTimeForAllTasks,
    getFilteredTimeEntries,
    getTimeEntryStats,
    loadTimeData,
    deleteTimeEntry
  };
}