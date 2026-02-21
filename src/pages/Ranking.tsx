import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Star, Crown, TrendingUp, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { WeeklyRankingCard } from "@/components/gamification/WeeklyRankingCard";

interface RankingUser {
  user_id: string;
  full_name: string;
  total_points: number;
  achievement_count: number;
  rank: number;
}

interface WeeklyRankingUser {
  user_id: string;
  full_name: string;
  weekly_xp: number;
  rank: number;
}

interface XpRankingUser {
  user_id: string;
  full_name: string;
  total_xp: number;
  current_level: number;
  rank: number;
}

const Ranking = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const [achievementRanking, setAchievementRanking] = useState<RankingUser[]>([]);
  const [xpRanking, setXpRanking] = useState<XpRankingUser[]>([]);
  const [weeklyRanking, setWeeklyRanking] = useState<WeeklyRankingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userAchievementRank, setUserAchievementRank] = useState<RankingUser | null>(null);
  const [userXpRank, setUserXpRank] = useState<XpRankingUser | null>(null);
  const [userWeeklyRank, setUserWeeklyRank] = useState<WeeklyRankingUser | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isApproved) {
        navigate("/pending");
      }
    }
  }, [user, isApproved, authLoading, navigate]);

  useEffect(() => {
    if (isApproved) {
      fetchRankings();
    }
  }, [isApproved]);

  const fetchRankings = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchAchievementRanking(),
      fetchXpRanking(),
      fetchWeeklyRanking(),
    ]);
    setIsLoading(false);
  };

  const fetchAchievementRanking = async () => {
    const { data: userAchievements } = await supabase
      .from("user_achievements")
      .select(`user_id, achievements (points)`);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("is_approved", true);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
    const userPoints: Record<string, { points: number; count: number }> = {};
    
    for (const ua of userAchievements || []) {
      const points = (ua.achievements as { points: number | null })?.points || 0;
      if (!userPoints[ua.user_id]) {
        userPoints[ua.user_id] = { points: 0, count: 0 };
      }
      userPoints[ua.user_id].points += points;
      userPoints[ua.user_id].count += 1;
    }

    const rankingList: RankingUser[] = Object.entries(userPoints)
      .map(([userId, data]) => ({
        user_id: userId,
        full_name: profileMap.get(userId) || "Usuário",
        total_points: data.points,
        achievement_count: data.count,
        rank: 0,
      }))
      .sort((a, b) => b.total_points - a.total_points)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    setAchievementRanking(rankingList);
    setUserAchievementRank(rankingList.find((r) => r.user_id === user?.id) || null);
  };

  const fetchXpRanking = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, total_xp, current_level")
      .eq("is_approved", true)
      .order("total_xp", { ascending: false });

    const rankingList: XpRankingUser[] = (profiles || [])
      .filter((p) => (p.total_xp || 0) > 0)
      .map((p, index) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        total_xp: p.total_xp || 0,
        current_level: p.current_level || 1,
        rank: index + 1,
      }));

    setXpRanking(rankingList);
    setUserXpRank(rankingList.find((r) => r.user_id === user?.id) || null);
  };

  const fetchWeeklyRanking = async () => {
    // Get start of current week (Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const { data: transactions } = await supabase
      .from("xp_transactions")
      .select("user_id, xp_amount")
      .gte("created_at", startOfWeek.toISOString());

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("is_approved", true);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
    const weeklyXp: Record<string, number> = {};

    for (const tx of transactions || []) {
      weeklyXp[tx.user_id] = (weeklyXp[tx.user_id] || 0) + tx.xp_amount;
    }

    const rankingList: WeeklyRankingUser[] = Object.entries(weeklyXp)
      .map(([userId, xp]) => ({
        user_id: userId,
        full_name: profileMap.get(userId) || "Usuário",
        weekly_xp: xp,
        rank: 0,
      }))
      .sort((a, b) => b.weekly_xp - a.weekly_xp)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    setWeeklyRanking(rankingList);
    setUserWeeklyRank(rankingList.find((r) => r.user_id === user?.id) || null);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="font-bold text-muted-foreground">{rank}º</span>;
    }
  };

  const getRankBgClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-orange-500/20 border-amber-600/30";
      default:
        return "bg-card";
    }
  };

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))' }}>
      <AppHeader userName={userName} />

      <main className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">
                Ranking
              </h1>
              <p className="text-sm text-muted-foreground">
                Os jovens mais engajados
              </p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="weekly" className="text-xs sm:text-sm">
              <TrendingUp className="h-3 w-3 mr-1 hidden sm:inline" />
              Semanal
            </TabsTrigger>
            <TabsTrigger value="xp" className="text-xs sm:text-sm">
              <Star className="h-3 w-3 mr-1 hidden sm:inline" />
              XP Total
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs sm:text-sm">
              <Award className="h-3 w-3 mr-1 hidden sm:inline" />
              Conquistas
            </TabsTrigger>
          </TabsList>

          {/* Weekly Ranking */}
          <TabsContent value="weekly" className="space-y-4">
            {/* User's weekly position */}
            {userWeeklyRank && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl gradient-hope p-5 text-primary-foreground"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Sua posição esta semana</p>
                    <h3 className="font-serif text-2xl font-semibold">
                      {userWeeklyRank.rank}º lugar
                    </h3>
                    <p className="text-sm opacity-80">
                      +{userWeeklyRank.weekly_xp} XP ganho
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20">
                    <TrendingUp className="h-7 w-7" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Top 3 Podium for Weekly */}
            {weeklyRanking.length >= 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-end justify-center gap-2"
              >
                {/* 2nd place */}
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300/30 font-serif text-lg font-bold text-foreground mb-2">
                    {weeklyRanking[1]?.full_name.charAt(0)}
                  </div>
                  <div className="h-16 w-20 rounded-t-lg bg-gray-300/30 flex flex-col items-center justify-center">
                    <Medal className="h-5 w-5 text-gray-500" />
                    <span className="text-xs font-medium text-muted-foreground mt-1">
                      +{weeklyRanking[1]?.weekly_xp}
                    </span>
                  </div>
                </div>
                
                {/* 1st place */}
                <div className="flex flex-col items-center">
                  <Crown className="h-6 w-6 text-yellow-500 mb-1" />
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/30 font-serif text-xl font-bold text-foreground mb-2">
                    {weeklyRanking[0]?.full_name.charAt(0)}
                  </div>
                  <div className="h-24 w-24 rounded-t-lg bg-yellow-500/30 flex flex-col items-center justify-center">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                    <span className="text-sm font-bold text-foreground mt-1">
                      +{weeklyRanking[0]?.weekly_xp}
                    </span>
                  </div>
                </div>
                
                {/* 3rd place */}
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-600/30 font-serif text-lg font-bold text-foreground mb-2">
                    {weeklyRanking[2]?.full_name.charAt(0)}
                  </div>
                  <div className="h-12 w-20 rounded-t-lg bg-amber-600/30 flex flex-col items-center justify-center">
                    <Medal className="h-5 w-5 text-amber-600" />
                    <span className="text-xs font-medium text-muted-foreground mt-1">
                      +{weeklyRanking[2]?.weekly_xp}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Weekly ranking list */}
            <div className="space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : weeklyRanking.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl bg-card p-8 text-center shadow-md"
                >
                  <Calendar className="mx-auto mb-3 h-12 w-12 text-primary/50" />
                  <p className="text-muted-foreground">Nenhuma atividade esta semana.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Complete atividades para aparecer no ranking!
                  </p>
                </motion.div>
              ) : (
                weeklyRanking.map((item, index) => (
                  <motion.div
                    key={item.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.03 }}
                    className={`flex items-center gap-4 rounded-2xl border p-4 shadow-sm ${getRankBgClass(item.rank)} ${
                      item.user_id === user?.id ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center">
                      {getRankIcon(item.rank)}
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-serif text-lg font-semibold text-primary">
                      {item.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {item.full_name}
                        {item.user_id === user?.id && (
                          <span className="ml-2 text-xs text-primary">(você)</span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        +{item.weekly_xp} XP esta semana
                      </p>
                    </div>
                    {item.rank <= 3 && (
                      <span className="text-lg">
                        {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : "🥉"}
                      </span>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* XP Total Ranking */}
          <TabsContent value="xp" className="space-y-4">
            {userXpRank && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl gradient-hope p-5 text-primary-foreground"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Sua posição (XP Total)</p>
                    <h3 className="font-serif text-2xl font-semibold">
                      {userXpRank.rank}º lugar
                    </h3>
                    <p className="text-sm opacity-80">
                      Nível {userXpRank.current_level} • {userXpRank.total_xp.toLocaleString()} XP
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20">
                    <Star className="h-7 w-7" />
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              {xpRanking.map((item, index) => (
                <motion.div
                  key={item.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.03 }}
                  className={`flex items-center gap-4 rounded-2xl border p-4 shadow-sm ${getRankBgClass(item.rank)} ${
                    item.user_id === user?.id ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center">
                    {getRankIcon(item.rank)}
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-serif text-lg font-semibold text-primary">
                    {item.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {item.full_name}
                      {item.user_id === user?.id && (
                        <span className="ml-2 text-xs text-primary">(você)</span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Nível {item.current_level}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-gold" />
                      <span className="font-bold text-foreground">{item.total_xp.toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">XP</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Achievements Ranking */}
          <TabsContent value="achievements" className="space-y-4">
            {userAchievementRank && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl gradient-hope p-5 text-primary-foreground"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Sua posição (Conquistas)</p>
                    <h3 className="font-serif text-2xl font-semibold">
                      {userAchievementRank.rank}º lugar
                    </h3>
                    <p className="text-sm opacity-80">
                      {userAchievementRank.total_points} pontos • {userAchievementRank.achievement_count} conquistas
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20">
                    <Award className="h-7 w-7" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Top 3 Podium */}
            {achievementRanking.length >= 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-end justify-center gap-2"
              >
                {/* 2nd place */}
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-300/30 font-serif text-lg font-bold text-foreground mb-2">
                    {achievementRanking[1]?.full_name.charAt(0)}
                  </div>
                  <div className="h-16 w-20 rounded-t-lg bg-gray-300/30 flex flex-col items-center justify-center">
                    <Medal className="h-5 w-5 text-gray-500" />
                    <span className="text-xs font-medium text-muted-foreground mt-1">
                      {achievementRanking[1]?.total_points}pts
                    </span>
                  </div>
                </div>
                
                {/* 1st place */}
                <div className="flex flex-col items-center">
                  <Crown className="h-6 w-6 text-yellow-500 mb-1" />
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/30 font-serif text-xl font-bold text-foreground mb-2">
                    {achievementRanking[0]?.full_name.charAt(0)}
                  </div>
                  <div className="h-24 w-24 rounded-t-lg bg-yellow-500/30 flex flex-col items-center justify-center">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                    <span className="text-sm font-bold text-foreground mt-1">
                      {achievementRanking[0]?.total_points}pts
                    </span>
                  </div>
                </div>
                
                {/* 3rd place */}
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-600/30 font-serif text-lg font-bold text-foreground mb-2">
                    {achievementRanking[2]?.full_name.charAt(0)}
                  </div>
                  <div className="h-12 w-20 rounded-t-lg bg-amber-600/30 flex flex-col items-center justify-center">
                    <Medal className="h-5 w-5 text-amber-600" />
                    <span className="text-xs font-medium text-muted-foreground mt-1">
                      {achievementRanking[2]?.total_points}pts
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : achievementRanking.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl bg-card p-8 text-center shadow-md"
                >
                  <Trophy className="mx-auto mb-3 h-12 w-12 text-primary/50" />
                  <p className="text-muted-foreground">Nenhuma conquista ainda.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Complete atividades para ganhar pontos!
                  </p>
                </motion.div>
              ) : (
                achievementRanking.map((item, index) => (
                  <motion.div
                    key={item.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.03 }}
                    className={`flex items-center gap-4 rounded-2xl border p-4 shadow-sm ${getRankBgClass(item.rank)} ${
                      item.user_id === user?.id ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center">
                      {getRankIcon(item.rank)}
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-serif text-lg font-semibold text-primary">
                      {item.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {item.full_name}
                        {item.user_id === user?.id && (
                          <span className="ml-2 text-xs text-primary">(você)</span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.achievement_count} conquista{item.achievement_count !== 1 && "s"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-gold" />
                        <span className="font-bold text-foreground">{item.total_points}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">pontos</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Motivation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 rounded-2xl bg-accent/50 p-5 text-center"
        >
          <p className="font-serif text-muted-foreground">
            "Não olhando cada um para o que é seu, mas cada qual também para o que é dos outros."
          </p>
          <p className="mt-2 text-sm font-medium text-primary">— Filipenses 2:4</p>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Ranking;