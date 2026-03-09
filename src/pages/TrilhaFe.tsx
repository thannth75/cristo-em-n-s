import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass, Flame, CheckCircle, Lock, ChevronRight, Star,
  Heart, BookOpen, MessageCircle, Sun, Sparkles, Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useXpAward } from "@/hooks/useXpAward";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import { LevelUpCelebration } from "@/components/gamification/LevelUpCelebration";
import { cn } from "@/lib/utils";

interface Challenge {
  id: string;
  day: number;
  title: string;
  description: string;
  action: string;
  icon: typeof Heart;
  xp: number;
}

const faithChallenges: Challenge[] = [
  { id: "1", day: 1, title: "Primeiro Passo", description: "Comece o dia em oração, entregando suas preocupações a Deus.", action: "Orar por 5 minutos", icon: Heart, xp: 15 },
  { id: "2", day: 2, title: "Palavra Viva", description: "Leia um capítulo do Evangelho de João e medite em uma frase.", action: "Ler João 1", icon: BookOpen, xp: 20 },
  { id: "3", day: 3, title: "Gratidão", description: "Liste 5 coisas pelas quais você é grato a Deus hoje.", action: "Escrever no diário", icon: Star, xp: 15 },
  { id: "4", day: 4, title: "Silêncio", description: "Fique 10 minutos em silêncio na presença de Deus, apenas ouvindo.", action: "Meditar em silêncio", icon: Sun, xp: 25 },
  { id: "5", day: 5, title: "Intercessão", description: "Ore por 3 pessoas que precisam de Deus hoje.", action: "Orar pelos outros", icon: MessageCircle, xp: 20 },
  { id: "6", day: 6, title: "Louvor", description: "Ouça um louvor e cante com todo seu coração para Deus.", action: "Adorar com música", icon: Sparkles, xp: 15 },
  { id: "7", day: 7, title: "Descanso", description: "Descanse em Deus. Releia suas anotações da semana e agradeça.", action: "Reflexão semanal", icon: Trophy, xp: 30 },
];

const TrilhaFe = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { awardXp, showLevelUp, levelUpData, closeLevelUp } = useXpAward(user?.id);

  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [currentDay, setCurrentDay] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/auth");
      else if (!isApproved) navigate("/pending");
    }
  }, [user, isApproved, authLoading, navigate]);

  useEffect(() => {
    if (user) loadProgress();
  }, [user]);

  const loadProgress = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("journal_entries")
      .select("created_at")
      .eq("user_id", user?.id)
      .ilike("title", "Trilha de Fé%")
      .order("created_at", { ascending: true });

    if (data) {
      const days = new Set(data.map((_, i) => i + 1));
      setCompletedDays(days);
      setCurrentDay(Math.min(days.size + 1, 7));
    }
    setIsLoading(false);
  };

  const completeChallenge = async (challenge: Challenge) => {
    if (completedDays.has(challenge.day)) return;

    // Save to journal
    await supabase.from("journal_entries").insert({
      user_id: user?.id,
      title: `Trilha de Fé - Dia ${challenge.day}`,
      content: `✅ ${challenge.title}\n\n${challenge.description}\n\nAção: ${challenge.action}`,
      mood: "grateful",
    });

    // Award XP
    await awardXp("rotina", challenge.id, `Trilha de Fé - Dia ${challenge.day}`);

    setCompletedDays(prev => new Set([...prev, challenge.day]));
    setCurrentDay(Math.min(challenge.day + 1, 7));

    toast({
      title: `Dia ${challenge.day} concluído! 🎉`,
      description: `+${challenge.xp} XP — Continue firme na jornada!`,
    });
  };

  const progress = (completedDays.size / 7) * 100;
  const userName = profile?.full_name?.split(" ")[0] || "Jovem";

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      style={{ paddingBottom: "calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))" }}
    >
      <AppHeader userName={userName} />

      <main className="py-4 sm:py-6">
        <ResponsiveContainer size="lg">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Compass className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-lg sm:text-2xl font-semibold text-foreground">
                Trilha de Fé
              </h1>
              <p className="text-[10px] sm:text-sm text-muted-foreground">
                7 dias para fortalecer sua caminhada
              </p>
            </div>
          </motion.div>

          {/* Progress Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-accent/10 border border-primary/20 p-5 mb-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Seu Progresso</span>
              </div>
              <span className="text-sm font-bold text-primary">{completedDays.size}/7 dias</span>
            </div>
            <Progress value={progress} className="h-2.5 mb-2" />
            <p className="text-xs text-muted-foreground">
              {completedDays.size === 7
                ? "🏆 Parabéns! Você completou a Trilha de Fé!"
                : completedDays.size === 0
                ? "Comece sua jornada espiritual hoje!"
                : `Faltam ${7 - completedDays.size} dias para completar a trilha`}
            </p>
          </motion.div>

          {/* Challenges List */}
          <div className="space-y-3">
            {faithChallenges.map((challenge, index) => {
              const isCompleted = completedDays.has(challenge.day);
              const isLocked = challenge.day > currentDay;
              const isCurrent = challenge.day === currentDay;
              const Icon = challenge.icon;

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => !isLocked && !isCompleted && completeChallenge(challenge)}
                    disabled={isLocked}
                    className={cn(
                      "w-full rounded-xl p-4 text-left transition-all flex items-center gap-4",
                      isCompleted
                        ? "bg-primary/10 border border-primary/30"
                        : isCurrent
                        ? "bg-card border-2 border-primary shadow-lg"
                        : isLocked
                        ? "bg-muted/50 border border-border opacity-60"
                        : "bg-card border border-border hover:bg-accent/50"
                    )}
                  >
                    {/* Day indicator */}
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl shrink-0",
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                          ? "bg-primary/20"
                          : "bg-muted"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : isLocked ? (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Icon className={cn("h-5 w-5", isCurrent ? "text-primary" : "text-muted-foreground")} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">
                          Dia {challenge.day}
                        </span>
                        {isCurrent && !isCompleted && (
                          <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                            Hoje
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[10px] text-primary font-medium">+{challenge.xp} XP</span>
                        )}
                      </div>
                      <h3
                        className={cn(
                          "font-semibold text-sm",
                          isCompleted ? "text-primary" : "text-foreground"
                        )}
                      >
                        {challenge.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {challenge.description}
                      </p>
                    </div>

                    {/* Action indicator */}
                    {!isLocked && !isCompleted && (
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Completion Card */}
          <AnimatePresence>
            {completedDays.size === 7 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-300/50 dark:border-amber-700/30 p-6 text-center"
              >
                <Trophy className="h-12 w-12 text-amber-600 mx-auto mb-3" />
                <h3 className="font-serif text-lg font-bold text-foreground mb-2">
                  Trilha Completa! 🎉
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Você completou os 7 dias da Trilha de Fé. Sua perseverança fortaleceu sua caminhada com Deus!
                </p>
                <Button
                  onClick={() => navigate("/rotina-com-deus")}
                  className="rounded-full"
                >
                  Continuar com Rotinas
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Encouragement */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 rounded-xl bg-card border border-border p-4 text-center"
          >
            <p className="text-sm text-muted-foreground italic">
              "Porque eu bem sei os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar-lhes esperança e um futuro."
            </p>
            <p className="text-xs text-primary font-medium mt-2">Jeremias 29:11</p>
          </motion.div>
        </ResponsiveContainer>
      </main>

      <BottomNavigation />

      {levelUpData && (
        <LevelUpCelebration
          open={showLevelUp}
          onClose={closeLevelUp}
          newLevel={levelUpData.newLevel}
          levelTitle={levelUpData.levelTitle}
          levelIcon={levelUpData.levelIcon}
          rewards={levelUpData.rewards}
        />
      )}
    </div>
  );
};

export default TrilhaFe;
