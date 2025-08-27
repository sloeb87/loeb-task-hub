import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface TaskMetrics {
  id: string;
  task_id: string;
  task_number: string;
  total_time_logged: number; // in seconds
  total_sessions: number;
  last_time_entry: string | null;
  actual_duration_days: number;
  planned_vs_actual_ratio: number;
  days_overdue: number;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface AggregatedMetrics {
  totalTimeLogged: number; // in hours
  totalSessions: number;
  averageSessionDuration: number; // in minutes
  totalTasksWithTime: number;
  overdueTasksCount: number;
  averageCompletionPercentage: number;
  plannedVsActualEfficiency: number;
}

export const useTaskMetrics = () => {
  const [taskMetrics, setTaskMetrics] = useState<TaskMetrics[]>([]);
  const [aggregatedMetrics, setAggregatedMetrics] = useState<AggregatedMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch task metrics from database
  const fetchTaskMetrics = useCallback(async () => {
    if (!user) {
      setTaskMetrics([]);
      setAggregatedMetrics(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('task_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const metrics = data as TaskMetrics[];
      setTaskMetrics(metrics);

      // Calculate aggregated metrics
      if (metrics.length > 0) {
        const totalTimeHours = metrics.reduce((sum, m) => sum + m.total_time_logged, 0) / 3600;
        const totalSessions = metrics.reduce((sum, m) => sum + m.total_sessions, 0);
        const averageSessionDuration = totalSessions > 0 ? (totalTimeHours * 60) / totalSessions : 0;
        const tasksWithTime = metrics.filter(m => m.total_time_logged > 0).length;
        const overdueTasks = metrics.filter(m => m.days_overdue > 0).length;
        const avgCompletion = metrics.length > 0 
          ? metrics.reduce((sum, m) => sum + m.completion_percentage, 0) / metrics.length 
          : 0;
        const efficiencyRatios = metrics.filter(m => m.planned_vs_actual_ratio > 0);
        const avgEfficiency = efficiencyRatios.length > 0
          ? efficiencyRatios.reduce((sum, m) => sum + m.planned_vs_actual_ratio, 0) / efficiencyRatios.length
          : 0;

        setAggregatedMetrics({
          totalTimeLogged: totalTimeHours,
          totalSessions,
          averageSessionDuration,
          totalTasksWithTime: tasksWithTime,
          overdueTasksCount: overdueTasks,
          averageCompletionPercentage: avgCompletion,
          plannedVsActualEfficiency: avgEfficiency
        });
      } else {
        setAggregatedMetrics({
          totalTimeLogged: 0,
          totalSessions: 0,
          averageSessionDuration: 0,
          totalTasksWithTime: 0,
          overdueTasksCount: 0,
          averageCompletionPercentage: 0,
          plannedVsActualEfficiency: 0
        });
      }
    } catch (err) {
      console.error('Error fetching task metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch task metrics');
      toast({
        title: "Error loading metrics",
        description: "Failed to load task performance metrics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Recalculate all metrics for current user
  const recalculateAllMetrics = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('recalculate_all_task_metrics', {
        p_user_id: user.id
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Metrics updated",
        description: `Recalculated metrics for ${data} tasks`,
      });

      // Refresh the metrics
      await fetchTaskMetrics();
    } catch (err) {
      console.error('Error recalculating metrics:', err);
      toast({
        title: "Error updating metrics",
        description: "Failed to recalculate task metrics",
        variant: "destructive"
      });
    }
  }, [user, toast, fetchTaskMetrics]);

  // Get metrics for a specific task
  const getTaskMetrics = useCallback((taskId: string): TaskMetrics | null => {
    return taskMetrics.find(m => m.task_id === taskId) || null;
  }, [taskMetrics]);

  // Get metrics by task number
  const getTaskMetricsByNumber = useCallback((taskNumber: string): TaskMetrics | null => {
    return taskMetrics.find(m => m.task_number === taskNumber) || null;
  }, [taskMetrics]);

  // Initial fetch
  useEffect(() => {
    fetchTaskMetrics();
  }, [fetchTaskMetrics]);

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('task_metrics_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'task_metrics',
          filter: `user_id=eq.${user.id}`
        }, 
        () => {
          // Refresh metrics when they change
          fetchTaskMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTaskMetrics]);

  return {
    taskMetrics,
    aggregatedMetrics,
    isLoading,
    error,
    refreshMetrics: fetchTaskMetrics,
    recalculateAllMetrics,
    getTaskMetrics,
    getTaskMetricsByNumber
  };
};