import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LevelDefinition {
  level_number: number;
  xp_required: number;
  title: string;
  icon: string;
  rewards: string[] | null;
}

interface XpActivity {
  id: string;
  activity_key: string;
  name: string;
  xp_value: number;
  daily_limit: number | null;
  icon: string;
}

interface LevelUpData {
  newLevel: number;
  levelTitle: string;
  levelIcon: string;
  rewards?: string[];
}

export function useXpAward(userId: string | undefined) {
  const { toast } = useToast();
  const [activities, setActivities] = useState<XpActivity[]>([]);
  const [levels, setLevels] = useState<LevelDefinition[]>([]);
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [activitiesRes, levelsRes] = await Promise.all([
        supabase.from("xp_activities").select("*").eq("is_active", true),
        supabase.from("level_definitions").select("*").order("level_number"),
      ]);
      setActivities(activitiesRes.data || []);
      setLevels(levelsRes.data || []);
    };
    fetchData();
  }, []);

  const awardXp = useCallback(
    async (activityKey: string, activityId?: string, customDescription?: string) => {
      if (!userId) return null;

      const activity = activities.find((a) => a.activity_key === activityKey);
      if (!activity) {
        console.warn(`Activity ${activityKey} not found`);
        return null;
      }

      // Check daily limit
      if (activity.daily_limit) {
        const today = new Date().toISOString().split("T")[0];
        const { count } = await supabase
          .from("xp_transactions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("activity_type", activityKey)
          .gte("created_at", today);

        if ((count || 0) >= activity.daily_limit) {
          return null; // Daily limit reached
        }
      }

      // Award XP
      const { data: result, error } = await supabase.rpc("add_user_xp", {
        p_user_id: userId,
        p_xp_amount: activity.xp_value,
        p_activity_type: activityKey,
        p_activity_id: activityId || null,
        p_description: customDescription || activity.name,
      });

      if (error) {
        console.error("Error awarding XP:", error);
        return null;
      }

      const xpResult = result?.[0];

      // Show toast
      toast({
        title: `+${activity.xp_value} XP! ${activity.icon}`,
        description: customDescription || activity.name,
      });

      // Check for level up
      if (xpResult?.level_up) {
        const newLevelDef = levels.find((l) => l.level_number === xpResult.new_level);
        if (newLevelDef) {
          setLevelUpData({
            newLevel: xpResult.new_level,
            levelTitle: newLevelDef.title,
            levelIcon: newLevelDef.icon,
            rewards: newLevelDef.rewards || undefined,
          });
          setShowLevelUp(true);
        }
      }

      return xpResult;
    },
    [userId, activities, levels, toast]
  );

  const closeLevelUp = useCallback(() => {
    setShowLevelUp(false);
    setLevelUpData(null);
  }, []);

  return {
    awardXp,
    levelUpData,
    showLevelUp,
    closeLevelUp,
    activities,
  };
}
