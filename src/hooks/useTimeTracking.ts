import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  description?: string;
  createdAt: string;
}

export interface TaskTimeData {
  taskId: string;
  totalTime: number; // in minutes
  isRunning: boolean;
  currentSessionStart?: string;
}

export function useTimeTracking() {
  const { user } = useAuth();
  const [taskTimers, setTaskTimers] = useState<Map<string, TaskTimeData>>(new Map());
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
      // Temporary localStorage implementation until types are updated
      const savedTimers = localStorage.getItem(`timers_${user.id}`);
      if (savedTimers) {
        const parsed = JSON.parse(savedTimers);
        const taskTimeMap = new Map<string, TaskTimeData>();
        Object.entries(parsed).forEach(([taskId, data]: [string, any]) => {
          taskTimeMap.set(taskId, data);
        });
        setTaskTimers(taskTimeMap);
      }
    } catch (error) {
      console.error('Error loading time data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTimer = useCallback(async (taskId: string) => {
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

      // Temporary localStorage implementation
      const startTime = new Date().toISOString();
      
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
          currentSessionStart: startTime
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
      if (!taskData?.isRunning || !taskData.currentSessionStart) return;

      const endTime = new Date();
      const startTime = new Date(taskData.currentSessionStart);
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      // Update local state
      setTaskTimers(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(taskId);
        if (current) {
          newMap.set(taskId, {
            ...current,
            isRunning: false,
            currentSessionStart: undefined,
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

  return {
    taskTimers,
    isLoading,
    startTimer,
    stopTimer,
    getTaskTime,
    getTotalTimeForAllTasks,
    loadTimeData
  };
}