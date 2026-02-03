import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Check, 
  Calendar,
  Trophy,
  ChevronRight,
  Play,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useXpAward } from "@/hooks/useXpAward";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { LevelUpCelebration } from "@/components/gamification/LevelUpCelebration";
import { BIBLE_BOOKS } from "@/data/bibleReadingPlans";

interface ReadingPlan {
  id: string;
  name: string;
  description: string | null;
  plan_type: string;
  total_days: number;
  is_active: boolean;
}

interface UserProgress {
  id: string;
  plan_id: string;
  current_day: number;
  started_at: string;
  completed_at: string | null;
  is_active: boolean;
}

interface DailyReading {
  id: string;
  day_number: number;
  title: string;
  readings: string[];
  book: string | null;
  chapter_start: number | null;
  chapter_end: number | null;
}

const PlanoLeitura = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { awardXp, showLevelUp, levelUpData, closeLevelUp } = useXpAward(user?.id);
  
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [todayReading, setTodayReading] = useState<DailyReading | null>(null);
  const [checkedToday, setCheckedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ReadingPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bookContent, setBookContent] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);

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
    
    // Fetch available plans
    const { data: plansData } = await supabase
      .from("reading_plans")
      .select("*")
      .eq("is_active", true);
    
    setPlans(plansData || []);

    // Fetch user's active progress
    const { data: progressData } = await supabase
      .from("user_reading_progress")
      .select("*")
      .eq("user_id", user?.id)
      .eq("is_active", true)
      .maybeSingle();

    if (progressData) {
      setUserProgress(progressData);
      
      // Fetch today's reading
      const { data: readingData } = await supabase
        .from("reading_plan_days")
        .select("*")
        .eq("plan_id", progressData.plan_id)
        .eq("day_number", progressData.current_day)
        .maybeSingle();

      setTodayReading(readingData);

      // Check if already checked in today
      if (readingData) {
        const { data: checkin } = await supabase
          .from("daily_reading_checkins")
          .select("id")
          .eq("user_id", user?.id)
          .eq("plan_day_id", readingData.id)
          .maybeSingle();

        setCheckedToday(!!checkin);
      }
    }

    setIsLoading(false);
  };

  const handleStartPlan = async (plan: ReadingPlan) => {
    // Deactivate any current progress
    await supabase
      .from("user_reading_progress")
      .update({ is_active: false })
      .eq("user_id", user?.id);

    // Start new plan
    const { error } = await supabase.from("user_reading_progress").insert({
      user_id: user?.id,
      plan_id: plan.id,
      current_day: 1,
    });

    if (error) {
      toast({ title: "Erro", description: "Não foi possível iniciar o plano.", variant: "destructive" });
    } else {
      toast({ title: "Plano iniciado! 📖", description: `Você começou ${plan.name}!` });
      setIsDialogOpen(false);
      fetchData();
    }
  };

  const handleCheckIn = async () => {
    if (!todayReading || !userProgress) return;

    // Save check-in
    const { data: checkinData, error } = await supabase.from("daily_reading_checkins").insert({
      user_id: user?.id,
      plan_day_id: todayReading.id,
    }).select().single();

    if (error) {
      toast({ title: "Erro", description: "Não foi possível registrar a leitura.", variant: "destructive" });
      return;
    }

    // Award XP for daily reading
    await awardXp("bible_reading", checkinData?.id, "Leitura bíblica do dia");

    // Advance to next day
    const nextDay = userProgress.current_day + 1;
    const plan = plans.find(p => p.id === userProgress.plan_id);

    if (plan && nextDay > plan.total_days) {
      // Plan completed!
      await supabase
        .from("user_reading_progress")
        .update({
          completed_at: new Date().toISOString(),
          is_active: false,
        })
        .eq("id", userProgress.id);

      // Award bonus XP for completing the plan
      await awardXp("reading_plan_complete", userProgress.plan_id, "Plano de leitura completo!");

      toast({
        title: "🎉 Parabéns!",
        description: "Você completou o plano de leitura!",
      });
    } else {
      await supabase
        .from("user_reading_progress")
        .update({ current_day: nextDay })
        .eq("id", userProgress.id);

      toast({
        title: "Leitura concluída! ✅",
        description: `Dia ${userProgress.current_day} completo!`,
      });
    }

    fetchData();
  };

  const calculateProgress = () => {
    if (!userProgress || !plans.length) return 0;
    const plan = plans.find(p => p.id === userProgress.plan_id);
    if (!plan) return 0;
    return Math.round((userProgress.current_day / plan.total_days) * 100);
  };

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const currentPlan = plans.find(p => p.id === userProgress?.plan_id);

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
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">Plano de Leitura</h1>
              <p className="text-sm text-muted-foreground">Leia a Bíblia em 1 ano</p>
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
                  <p className="text-sm opacity-80">Seu progresso</p>
                  <h3 className="font-serif text-xl font-semibold">{currentPlan.name}</h3>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-foreground/20">
                  <Trophy className="h-8 w-8" />
                </div>
              </div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Dia {userProgress.current_day} de {currentPlan.total_days}</span>
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

            {/* Today's Reading */}
            {todayReading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl bg-card p-5 shadow-md"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Leitura de Hoje</h3>
                </div>
                <div className="mb-4">
                  <p className="font-serif text-lg text-foreground">{todayReading.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {todayReading.readings.map((reading, idx) => (
                      <span key={idx} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                        {reading}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleCheckIn}
                  disabled={checkedToday}
                  className="w-full rounded-xl"
                >
                  {checkedToday ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Leitura Concluída!
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Marcar como Lido
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Change Plan */}
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
              className="w-full rounded-xl"
            >
              Trocar Plano de Leitura
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
              <Target className="mx-auto mb-4 h-12 w-12 text-primary/50" />
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                Comece sua jornada!
              </h3>
              <p className="text-muted-foreground mb-4">
                Escolha um plano e leia a Bíblia toda em 1 ano
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl">
                <Play className="mr-2 h-4 w-4" />
                Escolher Plano
              </Button>
            </motion.div>
          </div>
        )}

        {/* Bible Books Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <h3 className="font-serif text-lg font-semibold text-foreground mb-4">
            Conheça os Livros da Bíblia
          </h3>
          <Tabs defaultValue="old">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="old">Antigo Testamento</TabsTrigger>
              <TabsTrigger value="new">Novo Testamento</TabsTrigger>
            </TabsList>
            <TabsContent value="old" className="space-y-2">
              {BIBLE_BOOKS.filter(b => b.testament === "old").map((book) => (
                <button
                  key={book.name}
                  onClick={() => {
                    setSelectedBook(book.name);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{book.name}</span>
                    <span className="text-xs text-muted-foreground">{book.chapters} cap.</span>
                  </div>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                    {book.category}
                  </span>
                </button>
              ))}
            </TabsContent>
            <TabsContent value="new" className="space-y-2">
              {BIBLE_BOOKS.filter(b => b.testament === "new").map((book) => (
                <button
                  key={book.name}
                  onClick={() => {
                    setSelectedBook(book.name);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{book.name}</span>
                    <span className="text-xs text-muted-foreground">{book.chapters} cap.</span>
                  </div>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                    {book.category}
                  </span>
                </button>
              ))}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Plan Selection Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif">Escolha um Plano</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {plans.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Nenhum plano disponível ainda.</p>
                  <p className="text-sm text-muted-foreground mt-2">Os líderes podem criar planos de leitura.</p>
                </div>
              ) : (
                plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handleStartPlan(plan)}
                    className="w-full p-4 rounded-xl bg-muted hover:bg-primary/10 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                        <p className="text-xs text-primary mt-1">{plan.total_days} dias</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
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

export default PlanoLeitura;
