import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, Trophy, Star, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
}

interface UserAchievement {
  achievement_id: string;
  earned_at: string;
}

const Conquistas = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    if (isApproved && user) {
      fetchData();
    }
  }, [isApproved, user]);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [achievementsRes, userAchievementsRes] = await Promise.all([
      supabase.from("achievements").select("*").order("points", { ascending: false }),
      supabase.from("user_achievements").select("achievement_id, earned_at").eq("user_id", user?.id),
    ]);

    setAchievements(achievementsRes.data || []);
    setUserAchievements(userAchievementsRes.data || []);
    setIsLoading(false);
  };

  const totalPoints = userAchievements.reduce((sum, ua) => {
    const achievement = achievements.find((a) => a.id === ua.achievement_id);
    return sum + (achievement?.points || 0);
  }, 0);

  const earnedIds = new Set(userAchievements.map((ua) => ua.achievement_id));

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const categories = ["geral", "presenca", "estudo", "musico"];

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader userName={userName} />

      <main className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">
                Conquistas
              </h1>
              <p className="text-sm text-muted-foreground">
                Seus badges e progresso
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid grid-cols-2 gap-3"
        >
          <div className="rounded-2xl gradient-hope p-5 text-primary-foreground">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-2xl font-bold">{userAchievements.length}</p>
                <p className="text-xs opacity-80">Conquistadas</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-md">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-gold" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalPoints}</p>
                <p className="text-xs text-muted-foreground">Pontos</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Conquistas por categoria */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          categories.map((category) => {
            const categoryAchievements = achievements.filter((a) => a.category === category);
            if (categoryAchievements.length === 0) return null;

            const categoryNames: Record<string, string> = {
              geral: "Geral",
              presenca: "Presença",
              estudo: "Estudos",
              musico: "Músico",
            };

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6"
              >
                <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
                  {categoryNames[category]}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {categoryAchievements.map((achievement, index) => {
                    const isEarned = earnedIds.has(achievement.id);
                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className={`relative rounded-2xl p-4 shadow-md transition-all ${
                          isEarned
                            ? "bg-card"
                            : "bg-muted/50 opacity-60"
                        }`}
                      >
                        {!isEarned && (
                          <div className="absolute top-2 right-2">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="text-3xl mb-2">{achievement.icon}</div>
                        <h3 className="font-semibold text-foreground text-sm">
                          {achievement.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {achievement.description}
                        </p>
                        <div className="mt-2 flex items-center gap-1">
                          <Star className="h-3 w-3 text-gold" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {achievement.points} pts
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })
        )}

        {/* Motivação */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-accent/50 p-5 text-center"
        >
          <p className="font-serif text-muted-foreground">
            "Combati o bom combate, acabei a carreira, guardei a fé."
          </p>
          <p className="mt-2 text-sm font-medium text-primary">— 2 Timóteo 4:7</p>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Conquistas;
