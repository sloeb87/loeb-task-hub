import React, { useEffect, useState } from 'react';
import { useSupabaseStorage } from "@/hooks/useSupabaseStorage";
import { FollowUpsPage } from "./FollowUps";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FollowUpsWrapper = () => {
  const { tasks, projects, updateFollowUp } = useSupabaseStorage();
  const { user, isAuthenticated } = useAuth();
  const [followUps, setFollowUps] = useState<any[]>([]);

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
      tasks={tasks} 
      projects={projects}
      followUps={followUps}
      onEditTask={() => {}} // Will be handled by navigation
      onUpdateFollowUp={updateFollowUp}
    />
  );
};

export default FollowUpsWrapper;