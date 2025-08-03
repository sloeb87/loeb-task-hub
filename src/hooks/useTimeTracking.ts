import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { TimeEntry, TimeEntryFilters, TimeEntryStats } from '@/types/timeEntry';

export interface TaskTimeData {
  taskId: string;
  totalTime: number; // in minutes
  isRunning: boolean;
  currentSessionStart?: string;
  currentEntryId?: string;
}

export function useTimeTracking() {
  const { user } = useAuth();
  const [taskTimers, setTaskTimers] = useState<Map<string, TaskTimeData>>(new Map());
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing time data
  useEffect(() => {
    if (user) {
      loadTimeData();
    }
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
      
      // Load from localStorage for now (until database migration is complete)
      const savedTimers = localStorage.getItem(`timers_${user.id}`);
      const savedEntries = localStorage.getItem(`timeEntries_${user.id}`);
      
      // Load task timers
      if (savedTimers) {
        const parsed = JSON.parse(savedTimers);
        const taskTimeMap = new Map<string, TaskTimeData>();
        Object.entries(parsed).forEach(([taskId, data]: [string, any]) => {
          taskTimeMap.set(taskId, data);
        });
        setTaskTimers(taskTimeMap);
      }
      
      // Load time entries
      if (savedEntries) {
        const entries = JSON.parse(savedEntries);
        setTimeEntries(entries);
      }
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

      // Create new time entry
      const entryId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = new Date().toISOString();
      
      const newEntry: TimeEntry = {
        id: entryId,
        taskId: taskId,
        taskTitle: taskTitle || taskId,
        projectName: projectName || 'Unknown Project',
        responsible: responsible || 'Unknown',
        userId: user.id,
        startTime: startTime,
        description: 'Timer session',
        createdAt: startTime,
        isRunning: true
      };

      // Update time entries
      setTimeEntries(prev => {
        const updated = [...prev, newEntry];
        localStorage.setItem(`timeEntries_${user.id}`, JSON.stringify(updated));
        return updated;
      });
      
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
          currentEntryId: entryId
        });
        
        // Save to localStorage
        const timersObj = Object.fromEntries(newMap);
        localStorage.setItem(`timers_${user.id}`, JSON.stringify(timersObj));
        
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

      // Update the time entry
      setTimeEntries(prev => {
        const updated = prev.map(entry => 
          entry.id === taskData.currentEntryId
            ? {
                ...entry,
                endTime: endTime.toISOString(),
                duration: duration,
                isRunning: false
              }
            : entry
        );
        localStorage.setItem(`timeEntries_${user.id}`, JSON.stringify(updated));
        return updated;
      });

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
        
        // Save to localStorage
        const timersObj = Object.fromEntries(newMap);
        localStorage.setItem(`timers_${user.id}`, JSON.stringify(timersObj));
        
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
    return Array.from(taskTimers.values()).reduce((total, taskData) => total + taskData.totalTime, 0);
  }, [taskTimers]);

  const getFilteredTimeEntries = useCallback((filters: TimeEntryFilters): TimeEntry[] => {
    return timeEntries.filter(entry => {
      // Month filter
      if (filters.month) {
        const entryMonth = new Date(entry.startTime).getMonth() + 1;
        if (entryMonth.toString().padStart(2, '0') !== filters.month) return false;
      }
      
      // Year filter
      if (filters.year) {
        const entryYear = new Date(entry.startTime).getFullYear();
        if (entryYear !== filters.year) return false;
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
    loadTimeData
  };
}