import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, Star, Lock, Sparkles, TrendingUp, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { XpProgressCard } from "@/components/gamification/XpProgressCard";
import { MilestoneCard } from "@/components/gamification/MilestoneCard";
import { XpActivityList } from "@/components/gamification/XpActivityList";
import { LevelProgressList } from "@/components/gamification/LevelProgressList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Conquistas = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const {
    totalXp,
    currentLevel,
    currentLevelDef,
    nextLevelDef,
    progressPercent,
    xpToNextLevel,
    levels,
    activities,
    milestones,
    unlockedMilestones,
    recentTransactions,
    isLoading,
  } = useGamification(user?.id);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isApproved) {
        navigate("/pending");
      }
    }
  }, [user, isApproved, authLoading, navigate]);

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";
  const unlockedMilestoneIds = new Set(unlockedMilestones.map((um) => um.milestone_id));

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Agora";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))' }}>
      <AppHeader userName={userName} />

      <main className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
                Conquistas & XP
              </h1>
              <p className="text-sm text-muted-foreground">Seu progresso espiritual</p>
            </div>
          </div>
        </motion.div>

        {/* XP Progress Card */}
        {!isLoading && currentLevelDef && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <XpProgressCard
              totalXp={totalXp}
              currentLevel={currentLevel}
              levelTitle={currentLevelDef.title}
              levelIcon={currentLevelDef.icon}
              progressPercent={progressPercent}
              xpToNextLevel={xpToNextLevel}
              nextLevelTitle={nextLevelDef?.title}
            />
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6 grid grid-cols-3 gap-3"
        >
          <div className="rounded-2xl bg-card p-4 shadow-md text-center">
            <Sparkles className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{totalXp}</p>
            <p className="text-xs text-muted-foreground">XP Total</p>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-md text-center">
            <TrendingUp className="h-6 w-6 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{currentLevel}</p>
            <p className="text-xs text-muted-foreground">Nível</p>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-md text-center">
            <Star className="h-6 w-6 text-gold mx-auto mb-1" />
            <p className="text-xl font-bold text-foreground">{unlockedMilestones.length}</p>
            <p className="text-xs text-muted-foreground">Marcos</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="milestones" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="milestones" className="text-xs">Marcos</TabsTrigger>
            <TabsTrigger value="levels" className="text-xs">Níveis</TabsTrigger>
            <TabsTrigger value="activities" className="text-xs">XP</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="milestones" className="space-y-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Star className="h-4 w-4 text-gold" />
              Marcos Especiais
            </h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              </div>
            ) : milestones.length === 0 ? (
              <div className="rounded-2xl bg-card p-6 text-center">
                <Star className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhum marco disponível.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {milestones.map((milestone) => {
                  const userMilestone = unlockedMilestones.find(
                    (um) => um.milestone_id === milestone.id
                  );
                  return (
                    <MilestoneCard
                      key={milestone.id}
                      name={milestone.name}
                      description={milestone.description}
                      icon={milestone.icon}
                      xpReward={milestone.xp_reward}
                      isUnlocked={unlockedMilestoneIds.has(milestone.id)}
                      unlockedAt={userMilestone?.unlocked_at}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="levels" className="space-y-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Jornada de Níveis
            </h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              </div>
            ) : (
              <LevelProgressList
                levels={levels}
                currentLevel={currentLevel}
                totalXp={totalXp}
              />
            )}
          </TabsContent>

          <TabsContent value="activities" className="space-y-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Como Ganhar XP
            </h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              </div>
            ) : (
              <XpActivityList activities={activities} />
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Histórico Recente
            </h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="rounded-2xl bg-card p-6 text-center">
                <History className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">Nenhuma atividade ainda.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete atividades para ganhar XP!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between rounded-xl bg-card p-3 shadow-sm border border-border"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">
                          {tx.description || tx.activity_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(tx.created_at)}
                        </p>
                      </div>
                    </div>
                    <span className="text-primary font-bold text-sm shrink-0">
                      +{tx.xp_amount}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Motivação */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 rounded-2xl bg-accent/50 p-5 text-center"
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
