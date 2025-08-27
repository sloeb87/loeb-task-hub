import { useState, useEffect, useCallback } from 'react';
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
  const [cache, setCache] = useState<Map<string, RecurringTaskTimeData>>(new Map());

  const getRecurringTaskTime = useCallback(async (taskId: string, parentTaskId?: string, isRecurring?: boolean): Promise<RecurringTaskTimeData> => {
    if (!user) return { totalTime: 0, taskIds: [] };

    // Check cache first
    const cacheKey = parentTaskId || taskId;
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    try {
      let relatedTaskNumbers: string[] = [];

      if (isRecurring && !parentTaskId) {
        // First get the task's UUID from its task number
        const { data: parentTask, error: parentError } = await supabase
          .from('tasks')
          .select('id')
          .eq('user_id', user.id)
          .eq('task_number', taskId)
          .maybeSingle();

        if (parentError || !parentTask) {
          // Task not found, just return the single task
          return { totalTime: getTaskTime(taskId).totalTime, taskIds: [taskId] };
        }

        // This is the parent task - get all its children plus itself
        const { data: childTasks, error } = await supabase
          .from('tasks')
          .select('task_number')
          .eq('user_id', user.id)
          .eq('parent_task_id', parentTask.id);

        if (error) {
          console.error('Error fetching child tasks:', error);
          return { totalTime: 0, taskIds: [] };
        }

        relatedTaskNumbers = [taskId, ...childTasks.map(t => t.task_number)];
      } else if (parentTaskId) {
        // First get the parent task's UUID from its task number
        const { data: parentTask, error: parentError } = await supabase
          .from('tasks')
          .select('id')
          .eq('user_id', user.id)
          .eq('task_number', parentTaskId)
          .maybeSingle();

        if (parentError || !parentTask) {
          // Parent task not found, just return the single task
          return { totalTime: getTaskTime(taskId).totalTime, taskIds: [taskId] };
        }

        // This is a child task - get the parent and all siblings
        const { data: allRelatedTasks, error } = await supabase
          .from('tasks')
          .select('task_number, id, is_recurring')
          .eq('user_id', user.id)
          .or(`task_number.eq.${parentTaskId},parent_task_id.eq.${parentTask.id}`);

        if (error) {
          console.error('Error fetching related tasks:', error);
          return { totalTime: 0, taskIds: [] };
        }

        relatedTaskNumbers = allRelatedTasks.map(t => t.task_number);
      } else {
        // Not a recurring task
        relatedTaskNumbers = [taskId];
      }

      console.log(`Found related task numbers for ${taskId}:`, relatedTaskNumbers);

      // Calculate total time from all related tasks
      const totalTime = relatedTaskNumbers.reduce((total, taskNumber) => {
        const taskTime = getTaskTime(taskNumber);
        console.log(`Time for ${taskNumber}:`, taskTime.totalTime);
        return total + taskTime.totalTime;
      }, 0);

      const result = { totalTime, taskIds: relatedTaskNumbers };
      
      // Update cache
      setCache(prev => new Map(prev).set(cacheKey, result));
      
      console.log(`Total recurring time for ${taskId}:`, totalTime);
      return result;
    } catch (error) {
      console.error('Error calculating recurring task time:', error);
      return { totalTime: 0, taskIds: [] };
    }
  }, [user, getTaskTime, cache]);

  // Clear cache when user changes
  useEffect(() => {
    setCache(new Map());
  }, [user]);

  return { getRecurringTaskTime };
}