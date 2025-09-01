import React, { useEffect } from 'react';
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import TimeTrackingPage from "./TimeTracking";

const TimeTrackingWrapper = () => {
  const { tasks, projects } = useSupabaseStorage();

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

  return (
    <TimeTrackingPage tasks={tasks} projects={projects} />
  );
};

export default TimeTrackingWrapper;