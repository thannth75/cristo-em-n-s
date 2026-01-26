import { useEffect, useState } from "react";
import { usePresence } from "@/hooks/usePresence";
import { supabase } from "@/integrations/supabase/client";

/**
 * Invisible component that tracks user presence (last_seen)
 * Placed in App.tsx to track presence across all pages
 */
const PresenceTracker = () => {
  const [userId, setUserId] = useState<string | undefined>();
  
  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Track presence
  usePresence(userId);

  // This component renders nothing
  return null;
};

export default PresenceTracker;
