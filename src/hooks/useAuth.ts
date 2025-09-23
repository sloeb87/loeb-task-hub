import { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', { event, hasSession: !!session, userId: session?.user?.id });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false); // Always set loading to false after auth state change
      }
    );

    // Get existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Got existing session:', { hasSession: !!session, userId: session?.user?.id });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Memoize signOut function to prevent recreation
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  // Memoize isAuthenticated to prevent object recreation
  const isAuthenticated = useMemo(() => !!user, [user]);

  // Memoize the return object to prevent recreation
  return useMemo(() => ({
    user,
    session,
    loading,
    signOut,
    isAuthenticated
  }), [user, session, loading, signOut, isAuthenticated]);
}