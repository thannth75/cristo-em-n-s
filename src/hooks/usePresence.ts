import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const PRESENCE_UPDATE_INTERVAL = 30000; // 30 seconds

export function usePresence(userId: string | undefined) {
  const lastUpdateRef = useRef<number>(0);

  const updateLastSeen = useCallback(async () => {
    if (!userId) return;
    
    const now = Date.now();
    // Throttle updates to avoid too many DB writes
    if (now - lastUpdateRef.current < PRESENCE_UPDATE_INTERVAL) return;
    
    lastUpdateRef.current = now;
    
    await supabase
      .from("profiles")
      .update({ last_seen: new Date().toISOString() })
      .eq("user_id", userId);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // Update on mount
    updateLastSeen();

    // Update on interval
    const interval = setInterval(updateLastSeen, PRESENCE_UPDATE_INTERVAL);

    // Update on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateLastSeen();
      }
    };

    // Update on user activity
    const handleActivity = () => updateLastSeen();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [userId, updateLastSeen]);

  return { updateLastSeen };
}

// Helper to format last seen status
export function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return "Offline";
  
  const now = new Date();
  const seen = new Date(lastSeen);
  const diffMs = now.getTime() - seen.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Online if seen in last 2 minutes
  if (diffMinutes < 2) return "Online";
  
  if (diffMinutes < 60) return `Visto há ${diffMinutes}min`;
  if (diffHours < 24) return `Visto há ${diffHours}h`;
  if (diffDays === 1) return "Visto ontem";
  if (diffDays < 7) return `Visto há ${diffDays} dias`;
  
  return seen.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// Check if user is online (seen in last 2 minutes)
export function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  return diffMs < 2 * 60 * 1000;
}
