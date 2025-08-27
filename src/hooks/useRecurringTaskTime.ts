import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useTimeTracking } from './useTimeTracking';

export interface RecurringTaskTimeData {
  totalTime: number;
  taskIds: string[];
}

export function useRecurringTaskTime() {
  const { user } = useAuth();
  const { getTaskTime } = useTimeTracking();
  const cacheRef = useRef<Map<string, RecurringTaskTimeData>>(new Map());
  const debounceRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const getRecurringTaskTime = useCallback(async (taskId: string, parentTaskId?: string, isRecurring?: boolean): Promise<RecurringTaskTimeData> => {
    if (!user) return { totalTime: 0, taskIds: [] };

    // Check cache first
    const cacheKey = parentTaskId || taskId;
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey)!;
    }

    // Debounce the database query to prevent spam
    const existingTimeout = debounceRef.current.get(cacheKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(async () => {
        try {
          let relatedTaskNumbers: string[] = [];

          if (isRecurring && !parentTaskId) {
            // This is the parent task - get all its children plus itself
            const { data: childTasks, error } = await supabase
              .from('tasks')
              .select('task_number, id')
              .eq('user_id', user.id)
              .eq('parent_task_id', taskId); // This should be the actual UUID, not task number

            if (error) {
              console.error('Error fetching child tasks:', error);
              resolve({ totalTime: 0, taskIds: [] });
              return;
            }

            relatedTaskNumbers = [taskId, ...childTasks.map(t => t.task_number)];
          } else if (parentTaskId) {
            // This is a child task - get the parent and all siblings using task_number
            const { data: allRelatedTasks, error } = await supabase
              .from('tasks')
              .select('task_number, id, is_recurring')
              .eq('user_id', user.id)
              .or(`task_number.eq.${parentTaskId},parent_task_id.eq.${parentTaskId}`);

            if (error) {
              console.error('Error fetching related tasks:', error);
              resolve({ totalTime: 0, taskIds: [] });
              return;
            }

            relatedTaskNumbers = allRelatedTasks.map(t => t.task_number);
          } else {
            // Not a recurring task
            relatedTaskNumbers = [taskId];
          }

          // Calculate total time from all related tasks
          const totalTime = relatedTaskNumbers.reduce((total, taskNumber) => {
            const taskTime = getTaskTime(taskNumber);
            return total + taskTime.totalTime;
          }, 0);

          const result = { totalTime, taskIds: relatedTaskNumbers };
          
          // Update cache
          cacheRef.current.set(cacheKey, result);
          
          resolve(result);
        } catch (error) {
          console.error('Error calculating recurring task time:', error);
          resolve({ totalTime: 0, taskIds: [] });
        } finally {
          debounceRef.current.delete(cacheKey);
        }
      }, 100); // 100ms debounce

      debounceRef.current.set(cacheKey, timeout);
    });
  }, [user, getTaskTime]); // Removed cache from dependencies to prevent infinite loops

  // Clear cache when user changes
  useEffect(() => {
    cacheRef.current.clear();
    // Clear all pending timeouts
    debounceRef.current.forEach(timeout => clearTimeout(timeout));
    debounceRef.current.clear();
  }, [user]);

  return { getRecurringTaskTime };
}