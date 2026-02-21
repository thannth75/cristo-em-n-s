import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, Play, Check, ChevronRight, Calendar, BookOpen, 
  Target, Clock, Flame, Award 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useXpAward } from "@/hooks/useXpAward";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LevelUpCelebration } from "@/components/gamification/LevelUpCelebration";

interface RoutinePlan {
  id: string;
  name: string;
  description: string | null;
  duration_days: number;
  category: string;
  is_active: boolean;
}

interface RoutineDay {
  id: string;
  plan_id: string;
  day_number: number;
  title: string;
  description: string | null;
  bible_reading: string | null;
  reflection_prompt: string | null;
  action_item: string | null;
}

interface UserProgress {
  id: string;
  plan_id: string;
  current_day: number;
  started_at: string;
  completed_at: string | null;
  is_active: boolean;
}

interface DailyCheckin {
  id: string;
  routine_day_id: string;
  completed_at: string;
}

const RotinaComDeus = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading, isProfileComplete } = useAuth();
  const { toast } = useToast();
  const { awardXp, showLevelUp, levelUpData, closeLevelUp } = useXpAward(user?.id);

  const [plans, setPlans] = useState<RoutinePlan[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [currentPlan, setCurrentPlan] = useState<RoutinePlan | null>(null);
  const [planDays, setPlanDays] = useState<RoutineDay[]>([]);
  const [todayDay, setTodayDay] = useState<RoutineDay | null>(null);
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isCheckinDialogOpen, setIsCheckinDialogOpen] = useState(false);
  const [reflectionNotes, setReflectionNotes] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isApproved) {
        navigate("/pending");
      } else if (!isProfileComplete) {
        navigate("/onboarding");
      }
    }
  }, [user, isApproved, authLoading, isProfileComplete, navigate]);

  useEffect(() => {
    if (isApproved && user) {
      fetchData();
    }
  }, [isApproved, user]);

  const fetchData = async () => {
    setIsLoading(true);

    // Fetch available plans
    const { data: plansData } = await supabase
      .from("spiritual_routine_plans")
      .select("*")
      .eq("is_active", true);

    setPlans(plansData || []);

    // Fetch user's active progress
    const { data: progressData } = await supabase
      .from("user_routine_progress")
      .select("*")
      .eq("user_id", user?.id)
      .eq("is_active", true)
      .maybeSingle();

    if (progressData) {
      setUserProgress(progressData);

      // Get current plan
      const plan = plansData?.find(p => p.id === progressData.plan_id);
      setCurrentPlan(plan || null);

      // Fetch plan days
      const { data: daysData } = await supabase
        .from("spiritual_routine_days")
        .select("*")
        .eq("plan_id", progressData.plan_id)
        .order("day_number");

      setPlanDays(daysData || []);

      // Get today's day
      const today = daysData?.find(d => d.day_number === progressData.current_day);
      setTodayDay(today || null);

      // Fetch user's checkins for this plan
      if (daysData) {
        const dayIds = daysData.map(d => d.id);
        const { data: checkinsData } = await supabase
          .from("routine_daily_checkins")
          .select("*")
          .eq("user_id", user?.id)
          .in("routine_day_id", dayIds);

        setCheckins(checkinsData || []);
      }
    } else {
      setUserProgress(null);
      setCurrentPlan(null);
      setPlanDays([]);
      setTodayDay(null);
      setCheckins([]);
    }

    setIsLoading(false);
  };

  const handleStartPlan = async (plan: RoutinePlan) => {
    // Deactivate any current progress
    await supabase
      .from("user_routine_progress")
      .update({ is_active: false })
      .eq("user_id", user?.id)
      .eq("is_active", true);

    // Start new plan
    const { error } = await supabase.from("user_routine_progress").insert({
      user_id: user?.id,
      plan_id: plan.id,
      current_day: 1,
    });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível iniciar o plano.", variant: "destructive" });
    } else {
      toast({ title: "Plano iniciado! 🔥", description: `Você começou ${plan.name}!` });
      setIsPlanDialogOpen(false);
      fetchData();
    }
  };

  const handleCheckin = async () => {
    if (!todayDay || !userProgress) return;

    // Check if already checked in
    const alreadyCheckedIn = checkins.some(c => c.routine_day_id === todayDay.id);
    if (alreadyCheckedIn) {
      toast({ title: "Já concluído!", description: "Você já fez o check-in de hoje." });
      return;
    }

    // Save checkin
    const { data: checkinData, error } = await supabase
      .from("routine_daily_checkins")
      .insert({
        user_id: user?.id,
        routine_day_id: todayDay.id,
        reflection_notes: reflectionNotes || null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Erro", description: "Não foi possível registrar.", variant: "destructive" });
      return;
    }

    // Award XP
    await awardXp("rotina", checkinData.id, "Check-in diário da rotina");

    // Advance to next day
    const nextDay = userProgress.current_day + 1;

    if (currentPlan && nextDay > currentPlan.duration_days) {
      // Plan completed!
      await supabase
        .from("user_routine_progress")
        .update({
          completed_at: new Date().toISOString(),
          is_active: false,
        })
        .eq("id", userProgress.id);

      await awardXp("rotina", userProgress.plan_id, "Plano de rotina completo!");

      toast({
        title: "🎉 Parabéns!",
        description: `Você completou ${currentPlan.name}!`,
      });
    } else {
      await supabase
        .from("user_routine_progress")
        .update({ current_day: nextDay })
        .eq("id", userProgress.id);

      toast({
        title: "Dia concluído! ✅",
        description: `Dia ${userProgress.current_day} completo!`,
      });
    }

    setIsCheckinDialogOpen(false);
    setReflectionNotes("");
    fetchData();
  };

  const calculateProgress = () => {
    if (!userProgress || !currentPlan) return 0;
    return Math.round(((userProgress.current_day - 1) / currentPlan.duration_days) * 100);
  };

  const isDayCompleted = (dayId: string) => {
    return checkins.some(c => c.routine_day_id === dayId);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "oracao": return <Heart className="h-5 w-5" />;
      case "leitura": return <BookOpen className="h-5 w-5" />;
      case "jejum": return <Flame className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "oracao": return "text-rose-500";
      case "leitura": return "text-blue-500";
      case "jejum": return "text-orange-500";
      default: return "text-primary";
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
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">Rotina com Deus</h1>
              <p className="text-sm text-muted-foreground">Planos guiados para crescimento espiritual</p>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : userProgress && currentPlan ? (
          <div className="space-y-6">
            {/* Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl gradient-hope p-5 text-primary-foreground"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-80">Seu plano atual</p>
                  <h3 className="font-serif text-xl font-semibold">{currentPlan.name}</h3>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-foreground/20">
                  {getCategoryIcon(currentPlan.category)}
                </div>
              </div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Dia {userProgress.current_day} de {currentPlan.duration_days}</span>
                <span>{calculateProgress()}%</span>
              </div>
              <div className="h-2 rounded-full bg-primary-foreground/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateProgress()}%` }}
                  className="h-full rounded-full bg-primary-foreground"
                />
              </div>
            </motion.div>

            {/* Today's Task */}
            {todayDay && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl bg-card p-5 shadow-md"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Dia {todayDay.day_number}: {todayDay.title}</h3>
                </div>

                {todayDay.description && (
                  <p className="text-sm text-muted-foreground mb-4">{todayDay.description}</p>
                )}

                {todayDay.bible_reading && (
                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span className="font-medium">Leitura:</span>
                    <span className="text-muted-foreground">{todayDay.bible_reading}</span>
                  </div>
                )}

                {todayDay.reflection_prompt && (
                  <div className="rounded-xl bg-muted/50 p-3 mb-4">
                    <p className="text-sm italic text-muted-foreground">
                      💭 "{todayDay.reflection_prompt}"
                    </p>
                  </div>
                )}

                {todayDay.action_item && (
                  <div className="flex items-start gap-2 mb-4 text-sm">
                    <Target className="h-4 w-4 text-primary mt-0.5" />
                    <span><strong>Ação:</strong> {todayDay.action_item}</span>
                  </div>
                )}

                <Button
                  onClick={() => setIsCheckinDialogOpen(true)}
                  disabled={isDayCompleted(todayDay.id)}
                  className="w-full rounded-xl"
                >
                  {isDayCompleted(todayDay.id) ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Concluído!
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Marcar como Concluído
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Days Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-semibold text-foreground mb-3">Sua Jornada</h3>
              <div className="space-y-2">
                {planDays.slice(0, 7).map((day) => {
                  const isCompleted = isDayCompleted(day.id);
                  const isCurrent = day.day_number === userProgress.current_day;
                  const isFuture = day.day_number > userProgress.current_day;

                  return (
                    <div
                      key={day.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        isCurrent ? "bg-primary/10 border border-primary/30" :
                        isCompleted ? "bg-muted/50" : "bg-card"
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isCompleted ? "bg-primary text-primary-foreground" :
                        isCurrent ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        {isCompleted ? <Check className="h-4 w-4" /> : day.day_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isFuture ? "text-muted-foreground" : "text-foreground"}`}>
                          {day.title}
                        </p>
                      </div>
                      {isCurrent && (
                        <Badge className="bg-primary/10 text-primary text-xs">Hoje</Badge>
                      )}
                    </div>
                  );
                })}
                {planDays.length > 7 && (
                  <p className="text-center text-xs text-muted-foreground pt-2">
                    +{planDays.length - 7} dias restantes
                  </p>
                )}
              </div>
            </motion.div>

            {/* Change Plan */}
            <Button
              variant="outline"
              onClick={() => setIsPlanDialogOpen(true)}
              className="w-full rounded-xl"
            >
              Trocar Plano
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* No active plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card p-8 text-center shadow-md"
            >
              <Heart className="mx-auto mb-4 h-12 w-12 text-primary/50" />
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                Comece sua Rotina!
              </h3>
              <p className="text-muted-foreground mb-4">
                Escolha um plano guiado para crescer espiritualmente
              </p>
              <Button onClick={() => setIsPlanDialogOpen(true)} className="rounded-xl">
                <Play className="mr-2 h-4 w-4" />
                Escolher Plano
              </Button>
            </motion.div>

            {/* Plan Options Preview */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Planos Disponíveis</h3>
              {plans.map((plan, idx) => (
                <motion.button
                  key={plan.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  onClick={() => handleStartPlan(plan)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card shadow-md text-left hover:shadow-lg transition-shadow"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted ${getCategoryColor(plan.category)}`}>
                    {getCategoryIcon(plan.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">{plan.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">{plan.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{plan.duration_days} dias</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Plan Selection Dialog */}
        <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif">Escolha um Plano</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handleStartPlan(plan)}
                  className="w-full p-4 rounded-xl bg-muted hover:bg-primary/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-background ${getCategoryColor(plan.category)}`}>
                      {getCategoryIcon(plan.category)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{plan.name}</p>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                      <p className="text-xs text-primary mt-1">{plan.duration_days} dias</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Checkin Dialog */}
        <Dialog open={isCheckinDialogOpen} onOpenChange={setIsCheckinDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif">Concluir o Dia</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {todayDay && (
                <div className="rounded-xl bg-muted p-4">
                  <p className="font-semibold text-foreground mb-1">{todayDay.title}</p>
                  {todayDay.action_item && (
                    <p className="text-sm text-muted-foreground">✅ {todayDay.action_item}</p>
                  )}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Reflexão do dia (opcional)
                </label>
                <Textarea
                  value={reflectionNotes}
                  onChange={(e) => setReflectionNotes(e.target.value)}
                  placeholder="O que Deus falou com você hoje?"
                  className="rounded-xl"
                  rows={3}
                />
              </div>

              <Button onClick={handleCheckin} className="w-full rounded-xl">
                <Check className="mr-2 h-4 w-4" />
                Concluir Dia
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Versículo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 rounded-2xl bg-accent/50 p-5 text-center"
        >
          <p className="font-serif italic text-muted-foreground">
            "Buscarás e me acharás, quando me buscares de todo o teu coração."
          </p>
          <p className="mt-2 text-sm font-medium text-primary">— Jeremias 29:13</p>
        </motion.div>
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

export default RotinaComDeus;
