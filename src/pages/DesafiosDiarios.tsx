import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/PageHeader";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useXpAward } from "@/hooks/useXpAward";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Target, 
  CheckCircle2, 
  Circle,
  Zap,
  Heart,
  BookOpen,
  Users,
  MessageCircle,
  Sun,
  Moon,
  Sparkles,
  Trophy,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: typeof Heart;
  xp: number;
  category: "oracao" | "leitura" | "comunidade" | "acao";
  timeOfDay?: "manha" | "tarde" | "noite";
}

const dailyChallenges: Challenge[] = [
  {
    id: "oracao-manha",
    title: "Oração Matinal",
    description: "Comece o dia conversando com Deus por 5 minutos",
    icon: Sun,
    xp: 15,
    category: "oracao",
    timeOfDay: "manha"
  },
  {
    id: "leitura-salmo",
    title: "Leia um Salmo",
    description: "Medite em um Salmo hoje e deixe a Palavra te guiar",
    icon: BookOpen,
    xp: 20,
    category: "leitura"
  },
  {
    id: "encorajar-alguem",
    title: "Encoraje Alguém",
    description: "Envie uma mensagem de ânimo para um irmão ou irmã",
    icon: MessageCircle,
    xp: 25,
    category: "comunidade"
  },
  {
    id: "ato-bondade",
    title: "Ato de Bondade",
    description: "Faça algo gentil por alguém sem esperar nada em troca",
    icon: Heart,
    xp: 30,
    category: "acao"
  },
  {
    id: "gratidao",
    title: "Lista de Gratidão",
    description: "Escreva 3 coisas pelas quais você é grato a Deus hoje",
    icon: Sparkles,
    xp: 15,
    category: "oracao"
  },
  {
    id: "oracao-noite",
    title: "Oração Noturna",
    description: "Termine o dia agradecendo a Deus e entregando suas preocupações",
    icon: Moon,
    xp: 15,
    category: "oracao",
    timeOfDay: "noite"
  }
];

export default function DesafiosDiarios() {
  const authState = useAuth();
  const { awardXp } = useXpAward();
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (authState.user) {
      loadCompletedChallenges();
    }
  }, [authState.user]);

  const loadCompletedChallenges = async () => {
    if (!authState.user) return;
    
    const { data } = await supabase
      .from("journal_entries")
      .select("title")
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`)
      .like("title", "Desafio Diário:%");

    if (data) {
      const completed = data.map(entry => {
        const match = entry.title?.match(/Desafio Diário: (.+)/);
        return match ? match[1] : "";
      }).filter(Boolean);
      setCompletedChallenges(completed);
    }
    setLoading(false);
  };

  const completeChallenge = async (challenge: Challenge) => {
    if (!user || completedChallenges.includes(challenge.id)) return;

    try {
      await supabase.from("journal_entries").insert({
        user_id: user.id,
        title: `Desafio Diário: ${challenge.id}`,
        content: `✅ ${challenge.title}\n\n${challenge.description}`,
        mood: "motivated"
      });

      await awardXp("rotina", `challenge-${challenge.id}-${today}`, challenge.title);
      
      setCompletedChallenges(prev => [...prev, challenge.id]);
      
      toast.success(`🎯 ${challenge.title} concluído!`, {
        description: `+${challenge.xp} XP ganhos!`
      });
    } catch (error) {
      toast.error("Erro ao completar desafio");
    }
  };

  const progress = (completedChallenges.length / dailyChallenges.length) * 100;
  const allCompleted = completedChallenges.length === dailyChallenges.length;

  const getCategoryColor = (category: Challenge["category"]) => {
    switch (category) {
      case "oracao": return "from-purple-500 to-violet-600";
      case "leitura": return "from-blue-500 to-cyan-600";
      case "comunidade": return "from-green-500 to-emerald-600";
      case "acao": return "from-amber-500 to-orange-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 pb-24">
      <PageHeader title="Desafios Diários" showBack />
      
      <ResponsiveContainer className="py-6">
        {/* Progress Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/20 to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                    <h2 className="font-bold text-lg">
                      {completedChallenges.length}/{dailyChallenges.length} Desafios
                    </h2>
                  </div>
                </div>
                {allCompleted && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    <Trophy className="h-3 w-3 mr-1" />
                    Completo!
                  </Badge>
                )}
              </div>
              
              <Progress value={progress} className="h-3" />
              
              {allCompleted && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-primary mt-3 font-medium"
                >
                  🎉 Parabéns! Você completou todos os desafios de hoje!
                </motion.p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Challenges List */}
        <div className="space-y-3">
          {dailyChallenges.map((challenge, index) => {
            const isCompleted = completedChallenges.includes(challenge.id);
            
            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className={`overflow-hidden border transition-all ${
                    isCompleted 
                      ? "bg-primary/5 border-primary/30" 
                      : "bg-card/50 hover:bg-card/80 cursor-pointer"
                  }`}
                  onClick={() => !isCompleted && completeChallenge(challenge)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      isCompleted 
                        ? "bg-primary/20" 
                        : `bg-gradient-to-br ${getCategoryColor(challenge.category)}`
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      ) : (
                        <challenge.icon className="h-6 w-6 text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {challenge.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {challenge.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm font-semibold">{challenge.xp}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Motivation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm italic text-muted-foreground">
            "Tudo quanto fizerdes, fazei-o de todo o coração"
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Colossenses 3:23
          </p>
        </motion.div>
      </ResponsiveContainer>

      <BottomNavigation />
    </div>
  );
}
