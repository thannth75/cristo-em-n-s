import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WeeklySummary {
  devotionalsCompleted: number;
  prayersCreated: number;
  readingsCompleted: number;
  postsCreated: number;
  xpEarned: number;
  isLoading: boolean;
}

export function useWeeklySummary(userId: string | undefined): WeeklySummary {
  const [data, setData] = useState<WeeklySummary>({
    devotionalsCompleted: 0,
    prayersCreated: 0,
    readingsCompleted: 0,
    postsCreated: 0,
    xpEarned: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      const [devRes, prayerRes, readingRes, postsRes, xpRes] = await Promise.all([
        supabase
          .from("devotional_progress")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("completed_at", weekAgo),
        supabase
          .from("prayer_requests")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", weekAgo),
        supabase
          .from("daily_reading_checkins")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("completed_at", weekAgo),
        supabase
          .from("community_posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", weekAgo),
        supabase
          .from("xp_transactions")
          .select("xp_amount")
          .eq("user_id", userId)
          .gte("created_at", weekAgo),
      ]);

      const xpTotal = (xpRes.data || []).reduce((sum, r) => sum + r.xp_amount, 0);

      setData({
        devotionalsCompleted: devRes.count || 0,
        prayersCreated: prayerRes.count || 0,
        readingsCompleted: readingRes.count || 0,
        postsCreated: postsRes.count || 0,
        xpEarned: xpTotal,
        isLoading: false,
      });
    };

    fetch();
  }, [userId]);

  return data;
}
