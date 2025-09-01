import React, { useEffect } from 'react';
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { FollowUpsPage } from "./FollowUps";

const FollowUpsWrapper = () => {
  const { tasks, projects, updateFollowUp } = useSupabaseStorage();

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

  return (
    <FollowUpsPage 
      tasks={tasks} 
      projects={projects}
      onEditTask={() => {}} // Will be handled by navigation
      onUpdateFollowUp={updateFollowUp}
    />
  );
};

export default FollowUpsWrapper;