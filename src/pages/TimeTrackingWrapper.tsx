import React, { useEffect, useState } from 'react';
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { Task } from "@/types/task";
import TimeTrackingPage from "./TimeTracking";

const TimeTrackingWrapper = () => {
  const { projects, loadAllTasks } = useSupabaseStorage();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load ALL tasks for time tracking (no pagination)
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        const tasks = await loadAllTasks();
        setAllTasks(tasks);
        console.log('🎯 TimeTrackingWrapper: Loaded', tasks.length, 'tasks for time tracking');
      } catch (error) {
        console.error('Error loading all tasks for time tracking:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [loadAllTasks]);

  // SEO
  useEffect(() => {
    document.title = "Time Tracking | Task Tracker";
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'Track time spent on tasks and analyze productivity.');
    if (!document.querySelector('meta[name="description"]')) {
      document.head.appendChild(meta);
    }
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading all tasks for time tracking...</div>;
  }

  return (
    <TimeTrackingPage tasks={allTasks} projects={projects} />
  );
};

export default TimeTrackingWrapper;