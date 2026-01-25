import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useAchievements() {
  const { user, isApproved } = useAuth();

  useEffect(() => {
    if (!user || !isApproved) return;

    // Grant achievements on login
    const grantAchievements = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.access_token) return;

        const response = await supabase.functions.invoke("grant-achievements", {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        });

        if (response.data?.granted > 0) {
          console.log(`🏆 ${response.data.granted} conquista(s) desbloqueada(s)!`);
        }
      } catch (error) {
        console.error("Error checking achievements:", error);
      }
    };

    grantAchievements();
  }, [user, isApproved]);
}
