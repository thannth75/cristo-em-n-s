import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StreakData {
  prayer: number;
  reading: number;
  devotional: number;
  attendance: number;
  longestStreak: number;
  isLoading: boolean;
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const unique = [...new Set(dates.map((d) => d.split("T")[0]))].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Must have today or yesterday to have an active streak
  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1] + "T00:00:00");
    const curr = new Date(unique[i] + "T00:00:00");
    const diff = (prev.getTime() - curr.getTime()) / 86400000;
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function useStreaks(userId: string | undefined): StreakData {
  const [data, setData] = useState<StreakData>({
    prayer: 0,
    reading: 0,
    devotional: 0,
    attendance: 0,
    longestStreak: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

      const [prayerRes, readingRes, devRes, attendanceRes] = await Promise.all([
        supabase
          .from("prayer_requests")
          .select("created_at")
          .eq("user_id", userId)
          .gte("created_at", thirtyDaysAgo)
          .order("created_at", { ascending: false }),
        supabase
          .from("daily_reading_checkins")
          .select("completed_at")
          .eq("user_id", userId)
          .gte("completed_at", thirtyDaysAgo)
          .order("completed_at", { ascending: false }),
        supabase
          .from("devotional_progress")
          .select("completed_at")
          .eq("user_id", userId)
          .gte("completed_at", thirtyDaysAgo)
          .order("completed_at", { ascending: false }),
        supabase
          .from("attendance")
          .select("checked_in_at")
          .eq("user_id", userId)
          .gte("checked_in_at", thirtyDaysAgo)
          .order("checked_in_at", { ascending: false }),
      ]);

      const prayerStreak = calculateStreak(
        (prayerRes.data || []).map((r) => r.created_at)
      );
      const readingStreak = calculateStreak(
        (readingRes.data || []).map((r) => r.completed_at)
      );
      const devStreak = calculateStreak(
        (devRes.data || []).map((r) => r.completed_at)
      );
      const attendanceStreak = calculateStreak(
        (attendanceRes.data || []).map((r) => r.checked_in_at)
      );

      const longest = Math.max(prayerStreak, readingStreak, devStreak, attendanceStreak);

      setData({
        prayer: prayerStreak,
        reading: readingStreak,
        devotional: devStreak,
        attendance: attendanceStreak,
        longestStreak: longest,
        isLoading: false,
      });
    };

    fetch();
  }, [userId]);

  return data;
}
