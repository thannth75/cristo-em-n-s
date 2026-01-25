import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Users,
  Music,
  Heart,
  Award,
  MessageSquare,
  Shield,
  ChevronRight,
  Trophy,
  Brain,
  Target,
  MessageCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAchievements } from "@/hooks/useAchievements";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import VerseCard from "@/components/VerseCard";
import FeatureCard from "@/components/FeatureCard";
import GlowOrb from "@/components/GlowOrb";

const dailyVerses = [
  { verse: "Buscai primeiro o Reino de Deus e a sua justiça, e todas as coisas vos serão acrescentadas.", reference: "Mateus 6:33" },
  { verse: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", reference: "Salmos 37:5" },
  { verse: "Não deixemos de congregar-nos, como é costume de alguns, mas encorajemo-nos uns aos outros.", reference: "Hebreus 10:25" },
  { verse: "Tudo quanto fizerdes, fazei-o de todo o coração, como para o Senhor e não para homens.", reference: "Colossenses 3:23" },
  { verse: "O Senhor é o meu pastor; nada me faltará.", reference: "Salmos 23:1" },
];

interface NextEvent {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
  event_type: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isAdmin, isLeader, isLoading } = useAuth();
  useAchievements(); // Verificar conquistas automáticas
  
  const [nextEvent, setNextEvent] = useState<NextEvent | null>(null);
  const [todayVerse] = useState(() => {
    const dayIndex = new Date().getDate() % dailyVerses.length;
    return dailyVerses[dayIndex];
  });

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isApproved) {
        navigate("/pending");
      }
    }
  }, [user, isApproved, isLoading, navigate]);

  useEffect(() => {
    const fetchNextEvent = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("events")
        .select("id, title, event_date, start_time, event_type")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      setNextEvent(data);
    };

    if (isApproved) {
      fetchNextEvent();
    }
  }, [isApproved]);

  const features = [
    { title: "Devocional Diário", description: "Comece o dia com Deus", icon: BookOpen, href: "/devocional", badge: "Novo" },
    { title: "Plano de Leitura", description: "Leia a Bíblia em 1 ano", icon: Target, href: "/plano-leitura" },
    { title: "Quiz Bíblico", description: "Teste seu conhecimento", icon: Brain, href: "/quiz" },
    { title: "Testemunhos", description: "Histórias de fé", icon: Heart, href: "/testemunhos", badge: "Novo" },
    { title: "Lembretes de Oração", description: "Momentos com Deus", icon: MessageSquare, href: "/lembretes-oracao", badge: "Novo" },
    { title: "Diário Espiritual", description: "Reflexões pessoais", icon: Heart, href: "/diario" },
    { title: "Agenda", description: "Cultos e eventos", icon: Calendar, href: "/agenda" },
    { title: "Presença", description: "Registro de participação", icon: Users, href: "/presenca" },
    { title: "Músicos", description: "Escalas e repertório", icon: Music, href: "/musicos" },
    { title: "Conquistas", description: "Badges e progresso", icon: Award, href: "/conquistas" },
    { title: "Ranking", description: "Veja sua posição", icon: Trophy, href: "/ranking" },
    { title: "Comunidade", description: "Chat e posts", icon: MessageCircle, href: "/comunidade" },
    { title: "Pedidos de Oração", description: "Compartilhe com líderes", icon: MessageSquare, href: "/oracoes" },
  ];

  // Adicionar admin se for líder ou admin
  if (isAdmin || isLeader) {
    features.push({
      title: "Administração",
      description: "Gerenciar usuários",
      icon: Shield,
      href: "/admin",
    });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return {
      day: date.getDate(),
      month: months[date.getMonth()].toUpperCase(),
      weekday: days[date.getDay()],
    };
  };

  return (
    <div className="relative min-h-screen bg-background pb-24 overflow-hidden">
      {/* Orb decorativo */}
      <GlowOrb className="absolute -top-20 -right-20 h-64 w-64 opacity-30" />
      
      <AppHeader userName={userName} />

      <main className="relative z-10 px-4 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Versículo do Dia */}
          <VerseCard verse={todayVerse.verse} reference={todayVerse.reference} />

          {/* Próximo evento */}
          {nextEvent ? (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate("/agenda")}
              className="w-full overflow-hidden rounded-2xl gradient-hope p-5 text-primary-foreground shadow-lg text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium opacity-90">Próximo Evento</p>
                  <h3 className="font-serif text-xl font-semibold">{nextEvent.title}</h3>
                  <p className="mt-1 text-sm opacity-80">
                    {formatEventDate(nextEvent.event_date).weekday}, {nextEvent.start_time.slice(0, 5)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-primary-foreground/20">
                    <span className="text-2xl font-bold">{formatEventDate(nextEvent.event_date).day}</span>
                    <span className="text-xs font-medium">{formatEventDate(nextEvent.event_date).month}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 opacity-70" />
                </div>
              </div>
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="overflow-hidden rounded-2xl gradient-hope p-5 text-primary-foreground shadow-lg"
            >
              <div className="flex items-center gap-4">
                <Calendar className="h-8 w-8 opacity-80" />
                <div>
                  <p className="text-sm font-medium opacity-90">Agenda</p>
                  <h3 className="font-serif text-lg font-semibold">Nenhum evento próximo</h3>
                </div>
              </div>
            </motion.div>
          )}

          {/* Funcionalidades */}
          <div>
            <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
              Minha Jornada
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {features.map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  {...feature}
                  delay={0.1 * index}
                />
              ))}
            </div>
          </div>

          {/* Motivação */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl bg-accent/50 p-5 text-center"
          >
            <p className="font-serif text-muted-foreground">
              "Cada dia é uma nova oportunidade de servir a Deus e crescer em fé."
            </p>
            <p className="mt-2 text-sm font-medium text-primary">
              Continue firme na caminhada! 🙏
            </p>
          </motion.div>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Dashboard;
