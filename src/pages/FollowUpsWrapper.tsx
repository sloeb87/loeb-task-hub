import React, { useEffect, useState } from 'react';
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { FollowUpsPage } from "./FollowUps";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FollowUpsWrapper = () => {
  const { tasks, projects, updateFollowUp } = useSupabaseStorage();
  const { user, isAuthenticated } = useAuth();
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);

  // SEO
  useEffect(() => {
    document.title = "Follow Ups | Task Tracker";
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'Manage and track follow-ups on your tasks.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(meta);
    }
  }, []);

  // Fetch all tasks including meetings
  useEffect(() => {
    const fetchAllTasks = async () => {
      if (!isAuthenticated || !user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching all tasks:', error);
        return;
      }

      // Convert to Task type format
      const convertedTasks = (data || []).map((task: any) => ({
        id: task.task_number,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        responsible: task.responsible,
        startDate: task.start_date,
        dueDate: task.due_date,
        completionDate: task.completion_date || undefined,
        duration: task.duration || undefined,
        plannedTimeHours: task.planned_time_hours || 0,
        project: task.project_id || '',
        scope: task.scope || [],
        taskType: task.task_type,
        environment: task.environment,
        dependencies: task.dependencies || [],
        stakeholders: task.stakeholders || [],
        details: task.details || '',
        links: (task.links && typeof task.links === 'object' && !Array.isArray(task.links)) 
          ? task.links 
          : {},
        checklist: typeof task.checklist === 'string' ? JSON.parse(task.checklist) : (Array.isArray(task.checklist) ? task.checklist : []),
        creationDate: task.creation_date,
        followUps: [],
        isRecurring: task.is_recurring || false,
        recurrenceType: task.recurrence_type || undefined,
        recurrenceInterval: task.recurrence_interval || undefined,
        recurrenceEndDate: task.recurrence_end_date || undefined,
        parentTaskId: task.parent_task_id || undefined
      }));

      setAllTasks(convertedTasks);
    };

    fetchAllTasks();
  }, [isAuthenticated, user]);

  // Fetch follow-ups from database with real-time subscription
  useEffect(() => {
    const fetchFollowUps = async () => {
      if (!isAuthenticated || !user) return;

      const { data, error } = await supabase
        .from('follow_ups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching follow-ups:', error);
        return;
      }

      setFollowUps(data || []);
    };

    fetchFollowUps();

    // Set up real-time subscription
    if (isAuthenticated && user) {
      const channel = supabase
        .channel('follow_ups_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'follow_ups'
          },
          (payload) => {
            console.log('Follow-up change detected:', payload);
            // Refetch all follow-ups when any change occurs
            fetchFollowUps();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated, user]);

  return (
    <FollowUpsPage 
      tasks={allTasks} 
      projects={projects}
      followUps={followUps}
      onEditTask={() => {}} // Will be handled by navigation
      onUpdateFollowUp={updateFollowUp}
    />
  );
};

export default FollowUpsWrapper;