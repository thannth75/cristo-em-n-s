import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LevelDefinition {
  level_number: number;
  xp_required: number;
  title: string;
  description: string | null;
  icon: string;
  rewards: string[] | null;
}

interface XpActivity {
  id: string;
  activity_key: string;
  name: string;
  description: string | null;
  xp_value: number;
  daily_limit: number | null;
  icon: string;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  requirement_activity: string | null;
}

interface UserMilestone {
  id: string;
  milestone_id: string;
  unlocked_at: string;
  milestone?: Milestone;
}

interface XpTransaction {
  id: string;
  xp_amount: number;
  activity_type: string;
  description: string | null;
  created_at: string;
}

interface GamificationData {
  totalXp: number;
  currentLevel: number;
  currentLevelDef: LevelDefinition | null;
  nextLevelDef: LevelDefinition | null;
  xpToNextLevel: number;
  progressPercent: number;
  levels: LevelDefinition[];
  activities: XpActivity[];
  milestones: Milestone[];
  unlockedMilestones: UserMilestone[];
  recentTransactions: XpTransaction[];
}

export function useGamification(userId: string | undefined) {
  const { toast } = useToast();
  const [data, setData] = useState<GamificationData>({
    totalXp: 0,
    currentLevel: 1,
    currentLevelDef: null,
    nextLevelDef: null,
    xpToNextLevel: 100,
    progressPercent: 0,
    levels: [],
    activities: [],
    milestones: [],
    unlockedMilestones: [],
    recentTransactions: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchGamificationData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);

    try {
      // Fetch all data in parallel
      const [
        profileRes,
        levelsRes,
        activitiesRes,
        milestonesRes,
        userMilestonesRes,
        transactionsRes,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("total_xp, current_level")
          .eq("user_id", userId)
          .single(),
        supabase
          .from("level_definitions")
          .select("*")
          .order("level_number", { ascending: true }),
        supabase
          .from("xp_activities")
          .select("*")
          .eq("is_active", true)
          .order("xp_value", { ascending: false }),
        supabase
          .from("milestones")
          .select("*")
          .eq("is_active", true)
          .order("requirement_value", { ascending: true }),
        supabase
          .from("user_milestones")
          .select("*")
          .eq("user_id", userId),
        supabase
          .from("xp_transactions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const profile = profileRes.data;
      const levels = (levelsRes.data || []) as LevelDefinition[];
      const activities = (activitiesRes.data || []) as XpActivity[];
      const milestones = (milestonesRes.data || []) as Milestone[];
      const userMilestones = (userMilestonesRes.data || []) as UserMilestone[];
      const transactions = (transactionsRes.data || []) as XpTransaction[];

      const totalXp = profile?.total_xp || 0;
      const currentLevel = profile?.current_level || 1;

      // Find current and next level definitions
      const currentLevelDef = levels.find((l) => l.level_number === currentLevel) || null;
      const nextLevelDef = levels.find((l) => l.level_number === currentLevel + 1) || null;

      // Calculate progress to next level
      let xpToNextLevel = 0;
      let progressPercent = 100;

      if (nextLevelDef && currentLevelDef) {
        const xpInCurrentLevel = totalXp - currentLevelDef.xp_required;
        const xpNeededForNext = nextLevelDef.xp_required - currentLevelDef.xp_required;
        xpToNextLevel = nextLevelDef.xp_required - totalXp;
        progressPercent = Math.min(100, Math.floor((xpInCurrentLevel / xpNeededForNext) * 100));
      }

      // Enrich user milestones with milestone data
      const enrichedMilestones = userMilestones.map((um) => ({
        ...um,
        milestone: milestones.find((m) => m.id === um.milestone_id),
      }));

      setData({
        totalXp,
        currentLevel,
        currentLevelDef,
        nextLevelDef,
        xpToNextLevel,
        progressPercent,
        levels,
        activities,
        milestones,
        unlockedMilestones: enrichedMilestones,
        recentTransactions: transactions,
      });
    } catch (error) {
      console.error("Error fetching gamification data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGamificationData();
  }, [fetchGamificationData]);

  const awardXp = useCallback(
    async (activityKey: string, activityId?: string, customDescription?: string) => {
      if (!userId) return null;

      // Find the activity
      const activity = data.activities.find((a) => a.activity_key === activityKey);
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
          return null; // Daily limit reached, silently skip
        }
      }

      // Award XP using the database function
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
      
      // Show toast for XP gain
      toast({
        title: `+${activity.xp_value} XP! ${activity.icon}`,
        description: customDescription || activity.name,
      });

      // Check for level up
      if (xpResult?.level_up) {
        const newLevelDef = data.levels.find((l) => l.level_number === xpResult.new_level);
        toast({
          title: `🎉 Subiu para o Nível ${xpResult.new_level}!`,
          description: newLevelDef ? `${newLevelDef.icon} ${newLevelDef.title}` : "Parabéns pelo progresso!",
        });
      }

      // Check for new milestones
      await checkMilestones(xpResult?.new_total_xp || 0, xpResult?.new_level || 1, activityKey);

      // Refresh data
      await fetchGamificationData();

      return xpResult;
    },
    [userId, data.activities, data.levels, toast, fetchGamificationData]
  );

  const checkMilestones = async (totalXp: number, level: number, activityType: string) => {
    if (!userId) return;

    const unlockedIds = new Set(data.unlockedMilestones.map((um) => um.milestone_id));

    for (const milestone of data.milestones) {
      if (unlockedIds.has(milestone.id)) continue;

      let shouldUnlock = false;

      switch (milestone.requirement_type) {
        case "xp_total":
          shouldUnlock = totalXp >= milestone.requirement_value;
          break;
        case "level":
          shouldUnlock = level >= milestone.requirement_value;
          break;
        case "activity_count":
          if (milestone.requirement_activity === activityType) {
            const { count } = await supabase
              .from("xp_transactions")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId)
              .eq("activity_type", milestone.requirement_activity);

            shouldUnlock = (count || 0) >= milestone.requirement_value;
          }
          break;
      }

      if (shouldUnlock) {
        // Insert user milestone
        const { error } = await supabase.from("user_milestones").insert({
          user_id: userId,
          milestone_id: milestone.id,
        });

        if (!error) {
          // Award bonus XP for milestone
          if (milestone.xp_reward > 0) {
            await supabase.rpc("add_user_xp", {
              p_user_id: userId,
              p_xp_amount: milestone.xp_reward,
              p_activity_type: "milestone_reward",
              p_description: `Marco: ${milestone.name}`,
            });
          }

          toast({
            title: `🏆 Marco Desbloqueado!`,
            description: `${milestone.icon} ${milestone.name} (+${milestone.xp_reward} XP)`,
          });
        }
      }
    }
  };

  return {
    ...data,
    isLoading,
    awardXp,
    refresh: fetchGamificationData,
  };
}
