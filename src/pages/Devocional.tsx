import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Sun, 
  BookOpen, 
  CheckCircle, 
  ChevronRight, 
  Sparkles,
  Clock,
  Calendar as CalendarIcon,
  Hand
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";

interface Devotional {
  id: string;
  title: string;
  content: string;
  bible_verse: string;
  bible_reference: string;
  reflection_questions: string[];
  prayer_focus: string | null;
  devotional_date: string;
}

interface DevotionalProgress {
  devotional_id: string;
  completed_at: string;
  personal_reflection: string | null;
}

const Devocional = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [todayDevotional, setTodayDevotional] = useState<Devotional | null>(null);
  const [recentDevotionals, setRecentDevotionals] = useState<Devotional[]>([]);
  const [userProgress, setUserProgress] = useState<DevotionalProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedDevotional, setSelectedDevotional] = useState<Devotional | null>(null);
  const [personalReflection, setPersonalReflection] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

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
    const today = new Date().toISOString().split("T")[0];
    
    // Fetch today's devotional
    const { data: todayData } = await supabase
      .from("daily_devotionals")
      .select("*")
      .eq("devotional_date", today)
      .maybeSingle();
    
    setTodayDevotional(todayData);

    // Fetch recent devotionals
    const { data: recentData } = await supabase
      .from("daily_devotionals")
      .select("*")
      .lte("devotional_date", today)
      .order("devotional_date", { ascending: false })
      .limit(7);
    
    setRecentDevotionals(recentData || []);

    // Fetch user progress
    const { data: progressData } = await supabase
      .from("devotional_progress")
      .select("devotional_id, completed_at, personal_reflection")
      .eq("user_id", user?.id);
    
    setUserProgress(progressData || []);
    setIsLoading(false);
  };

  const isDevotionalCompleted = (devotionalId: string) => {
    return userProgress.some(p => p.devotional_id === devotionalId);
  };

  const handleOpenDevotional = (devotional: Devotional) => {
    setSelectedDevotional(devotional);
    const existingProgress = userProgress.find(p => p.devotional_id === devotional.id);
    setPersonalReflection(existingProgress?.personal_reflection || "");
  };

  const handleCompleteDevotional = async () => {
    if (!selectedDevotional) return;
    
    setIsCompleting(true);
    
    const { error } = await supabase
      .from("devotional_progress")
      .upsert({
        user_id: user?.id,
        devotional_id: selectedDevotional.id,
        personal_reflection: personalReflection || null,
      }, { onConflict: "user_id,devotional_id" });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar seu progresso.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Devocional concluído! 🙏",
        description: "Continue firme na sua caminhada com Deus.",
      });
      setSelectedDevotional(null);
      fetchData();
    }
    setIsCompleting(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";
  const completedCount = userProgress.length;
  const streakDays = calculateStreak();

  function calculateStreak(): number {
    if (userProgress.length === 0) return 0;
    
    const sortedDates = userProgress
      .map(p => new Date(p.completed_at).toISOString().split("T")[0])
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      const expectedStr = expectedDate.toISOString().split("T")[0];
      
      if (sortedDates.includes(expectedStr)) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader userName={userName} />

      <main className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Sun className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">
              Devocional Diário
            </h1>
            <p className="text-sm text-muted-foreground">
              Comece seu dia com Deus
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid grid-cols-2 gap-3"
        >
          <div className="rounded-2xl bg-primary/10 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-primary">{streakDays}</span>
            </div>
            <p className="text-xs text-muted-foreground">Dias seguidos</p>
          </div>
          <div className="rounded-2xl bg-accent/50 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{completedCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">Devocionais lidos</p>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Today's Devotional */}
            {todayDevotional ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <h2 className="font-serif text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Devocional de Hoje
                </h2>
                <button
                  onClick={() => handleOpenDevotional(todayDevotional)}
                  className="w-full rounded-2xl gradient-hope p-5 text-primary-foreground shadow-lg text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm opacity-80 mb-1">{formatDate(todayDevotional.devotional_date)}</p>
                      <h3 className="font-serif text-xl font-semibold mb-2">
                        {todayDevotional.title}
                      </h3>
                      <p className="text-sm opacity-90 mb-2 line-clamp-2">
                        "{todayDevotional.bible_verse}"
                      </p>
                      <p className="text-xs font-medium opacity-80">
                        — {todayDevotional.bible_reference}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      {isDevotionalCompleted(todayDevotional.id) ? (
                        <CheckCircle className="h-8 w-8 text-primary-foreground" />
                      ) : (
                        <ChevronRight className="h-6 w-6 opacity-70" />
                      )}
                    </div>
                  </div>
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6 rounded-2xl bg-card p-6 text-center shadow-md"
              >
                <Sun className="mx-auto mb-3 h-12 w-12 text-primary/50" />
                <h3 className="font-semibold text-foreground mb-2">
                  Devocional de hoje não disponível
                </h3>
                <p className="text-sm text-muted-foreground">
                  Os líderes ainda não publicaram o devocional de hoje.
                </p>
              </motion.div>
            )}

            {/* Recent Devotionals */}
            {recentDevotionals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="font-serif text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Devocionais Recentes
                </h2>
                <div className="space-y-3">
                  {recentDevotionals
                    .filter(d => d.id !== todayDevotional?.id)
                    .map((devotional, index) => (
                      <motion.button
                        key={devotional.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        onClick={() => handleOpenDevotional(devotional)}
                        className="w-full rounded-2xl bg-card p-4 shadow-md text-left flex items-center gap-4"
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          isDevotionalCompleted(devotional.id) 
                            ? "bg-primary/20" 
                            : "bg-muted"
                        }`}>
                          {isDevotionalCompleted(devotional.id) ? (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {devotional.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(devotional.devotional_date)}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </motion.button>
                    ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Devotional Detail Dialog */}
        <Dialog open={!!selectedDevotional} onOpenChange={() => setSelectedDevotional(null)}>
          <DialogContent className="mx-4 max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">
                {selectedDevotional?.title}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {selectedDevotional && formatDate(selectedDevotional.devotional_date)}
              </p>
            </DialogHeader>

            {selectedDevotional && (
              <div className="space-y-5">
                {/* Bible Verse */}
                <div className="rounded-xl bg-primary/10 p-4">
                  <p className="font-serif italic text-foreground text-lg mb-2">
                    "{selectedDevotional.bible_verse}"
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    — {selectedDevotional.bible_reference}
                  </p>
                </div>

                {/* Devotional Content */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Reflexão
                  </h4>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {selectedDevotional.content}
                  </p>
                </div>

                {/* Reflection Questions */}
                {selectedDevotional.reflection_questions?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Perguntas para reflexão
                    </h4>
                    <ul className="space-y-2">
                      {selectedDevotional.reflection_questions.map((question, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-primary font-semibold">{i + 1}.</span>
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prayer Focus */}
                {selectedDevotional.prayer_focus && (
                  <div className="rounded-xl bg-accent/50 p-4 border-l-4 border-primary">
                    <h4 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                      <Hand className="h-4 w-4 text-primary" />
                      Foco de oração
                    </h4>
                    <p className="text-sm text-muted-foreground italic">
                      {selectedDevotional.prayer_focus}
                    </p>
                  </div>
                )}

                {/* Personal Reflection */}
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Sua reflexão pessoal (opcional)
                  </Label>
                  <Textarea
                    value={personalReflection}
                    onChange={(e) => setPersonalReflection(e.target.value)}
                    placeholder="Escreva o que Deus falou ao seu coração..."
                    className="rounded-xl min-h-[100px]"
                  />
                </div>

                {/* Complete Button */}
                <Button
                  onClick={handleCompleteDevotional}
                  disabled={isCompleting}
                  className="w-full rounded-xl"
                >
                  {isDevotionalCompleted(selectedDevotional.id) 
                    ? "Atualizar reflexão" 
                    : "Marcar como lido"
                  }
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Devocional;
