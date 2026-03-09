import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Calendar, Users, Music, Heart, Award,
  MessageSquare, Shield, ChevronRight, Trophy, Brain,
  Target, MessageCircle, Sparkles, ClipboardCheck, Sun,
  Flame, Star, Radio, Globe, ExternalLink, Compass, Gamepad2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAchievements } from "@/hooks/useAchievements";
import { useGamification } from "@/hooks/useGamification";
import { useStreaks } from "@/hooks/useStreaks";
import { useWeeklySummary } from "@/hooks/useWeeklySummary";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import VerseCard from "@/components/VerseCard";
import FeatureCard from "@/components/FeatureCard";
import GlowOrb from "@/components/GlowOrb";
import ParallaxBackground from "@/components/ParallaxBackground";
import BirthdaysCard from "@/components/comunidade/BirthdaysCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AdFeed } from "@/components/ads/AdBanner";
import AIFloatingButton from "@/components/ai/AIFloatingButton";
import AmbientSound from "@/components/AmbientSound";
import JourneyCarousel, { type JourneyItem } from "@/components/dashboard/JourneyCarousel";
import StreakCard from "@/components/dashboard/StreakCard";
import WeeklySummaryCard from "@/components/dashboard/WeeklySummaryCard";
import SpiritualSuggestion from "@/components/dashboard/SpiritualSuggestion";

const dailyVerses = [
  { verse: "Buscai primeiro o Reino de Deus e a sua justiça, e todas as coisas vos serão acrescentadas.", reference: "Mateus 6:33" },
  { verse: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", reference: "Salmos 37:5" },
  { verse: "Não deixemos de congregar-nos, como é costume de alguns, mas encorajemo-nos uns aos outros.", reference: "Hebreus 10:25" },
  { verse: "Tudo quanto fizerdes, fazei-o de todo o coração, como para o Senhor e não para homens.", reference: "Colossenses 3:23" },
  { verse: "O Senhor é o meu pastor; nada me faltará.", reference: "Salmos 23:1" },
  { verse: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.", reference: "João 3:16" },
  { verse: "Sede fortes e corajosos. Não temais, nem vos espanteis, pois o Senhor estará convosco.", reference: "Josué 1:9" },
];

const spiritualGreetings = {
  morning: [
    "Que a graça de Deus guie seus passos hoje! ☀️",
    "A misericórdia de Deus se renova a cada manhã! 🌅",
    "Novo dia, nova chance de glorificar ao Senhor! ✨",
  ],
  afternoon: [
    "Que Deus renove suas forças nesta tarde! 🕊️",
    "Descanse na presença do Pai nesta tarde! ☁️",
    "Continue firme, Deus está com você! 💪",
  ],
  evening: [
    "Que a paz de Cristo encha seu coração esta noite! 🌙",
    "Agradeça a Deus por mais um dia de graça! ⭐",
    "Entregue suas preocupações a Deus e descanse em paz! 🙏",
  ],
};

interface NextEvent {
  id: string;
  title: string;
  event_date: string;
  start_time: string;
  event_type: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    user, profile, isApproved, isAdmin, isLeader, isLoading,
    canAccessYouthContent, canAccessMusicianContent,
  } = useAuth();
  useAchievements();
  const gamification = useGamification(user?.id);
  const streaks = useStreaks(user?.id);
  const weeklySummary = useWeeklySummary(user?.id);

  const [nextEvent, setNextEvent] = useState<NextEvent | null>(null);
  const [todayVerse] = useState(() => {
    const dayIndex = new Date().getDate() % dailyVerses.length;
    return dailyVerses[dayIndex];
  });

  const spiritualMessage = useMemo(() => {
    const hour = new Date().getHours();
    const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    const msgs = spiritualGreetings[period];
    return msgs[new Date().getDate() % msgs.length];
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user) navigate("/auth");
      else if (!isApproved) navigate("/pending");
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
    if (isApproved) fetchNextEvent();
  }, [isApproved]);

  // Features
  const baseFeatures = [
    { title: "Devocional Diário", description: "Comece o dia com Deus", icon: BookOpen, href: "/devocional", badge: "Novo" },
    { title: "Momento com Deus", description: "Oração imersiva", icon: Sun, href: "/momento-com-deus", badge: "✨" },
    { title: "Mensagens", description: "Chat privado", icon: MessageCircle, href: "/mensagens" },
    { title: "Trilha de Fé", description: "Jornada de 7 dias", icon: Compass, href: "/trilha-fe", badge: "Novo" },
    { title: "Rotina com Deus", description: "Planos espirituais guiados", icon: Heart, href: "/rotina-com-deus" },
    { title: "Versículos por Humor", description: "Palavra para seu momento", icon: Heart, href: "/versiculos" },
    { title: "Testemunhos", description: "Histórias de fé", icon: Heart, href: "/testemunhos" },
    { title: "Lembretes de Oração", description: "Momentos com Deus", icon: MessageSquare, href: "/lembretes-oracao" },
    { title: "Diário Espiritual", description: "Reflexões pessoais", icon: Heart, href: "/diario" },
    { title: "Agenda", description: "Cultos e eventos", icon: Calendar, href: "/agenda" },
    { title: "Quiz Bíblico", description: "Teste seu conhecimento", icon: Brain, href: "/quiz" },
    { title: "Conquistas", description: "Badges e progresso", icon: Award, href: "/conquistas" },
    { title: "Ranking", description: "Veja sua posição", icon: Trophy, href: "/ranking" },
    { title: "Comunidade", description: "Chat e posts", icon: MessageCircle, href: "/comunidade" },
    { title: "Pedidos de Oração", description: "Ore com os irmãos", icon: MessageSquare, href: "/oracoes" },
    { title: "Rádio de Louvores", description: "Ouça louvores 24h", icon: Radio, href: "/radio", badge: "🎵" },
  ];

  const youthFeatures = [
    { title: "Provas e Notas", description: "Avaliações e frequência", icon: ClipboardCheck, href: "/provas" },
    { title: "Células", description: "Pequenos grupos", icon: Users, href: "/celulas" },
    { title: "Plano de Leitura", description: "Leia a Bíblia em 1 ano", icon: Target, href: "/plano-leitura" },
    { title: "Presença", description: "Registro de participação", icon: Users, href: "/presenca" },
  ];

  const musicianFeatures = [
    { title: "Músicos", description: "Escalas e repertório", icon: Music, href: "/musicos" },
  ];

  const features = [...baseFeatures];
  if (canAccessYouthContent) features.push(...youthFeatures);
  if (canAccessMusicianContent) features.push(...musicianFeatures);
  if (isAdmin || isLeader) {
    features.push({ title: "Administração", description: "Gerenciar usuários", icon: Shield, href: "/admin" });
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
    <div
      className="relative min-h-screen bg-background overflow-hidden"
      style={{ paddingBottom: 'calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))' }}
    >
      <ParallaxBackground />
      <GlowOrb className="absolute -top-20 -right-20 h-48 sm:h-64 w-48 sm:w-64 opacity-30" />
      <AppHeader userName={userName} />

      <main
        className="relative z-10 px-4 py-4 sm:py-6 max-w-4xl mx-auto"
        style={{
          paddingLeft: 'max(1rem, env(safe-area-inset-left, 16px))',
          paddingRight: 'max(1rem, env(safe-area-inset-right, 16px))',
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 sm:space-y-5"
        >
          {/* Saudação Espiritual Dinâmica */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/15 p-3.5 sm:p-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 shrink-0">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Mensagem do dia</p>
                <p className="text-sm font-medium text-foreground">{spiritualMessage}</p>
              </div>
            </div>
          </motion.div>

          {/* Versículo do Dia */}
          <VerseCard verse={todayVerse.verse} reference={todayVerse.reference} />

          {/* Sugestão Inteligente */}
          <SpiritualSuggestion streaks={streaks} summary={weeklySummary} />

          {/* XP Progress */}
          {gamification.currentLevelDef && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onClick={() => navigate("/conquistas")}
              className="w-full rounded-2xl gradient-spiritual border border-primary/15 p-3.5 sm:p-4 shadow-md text-left touch-feedback"
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-primary/15 text-lg">
                    {gamification.currentLevelDef.icon}
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Nível {gamification.currentLevel}</p>
                    <h3 className="font-semibold text-sm sm:text-base text-foreground">{gamification.currentLevelDef.title}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="font-bold text-sm sm:text-base">{gamification.totalXp}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">XP</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] sm:text-xs">
                  <span className="text-muted-foreground">Próximo nível</span>
                  <span className="text-primary font-medium">{gamification.progressPercent}%</span>
                </div>
                <Progress value={gamification.progressPercent} className="h-1.5 sm:h-2" />
              </div>
            </motion.button>
          )}

          {/* Streaks */}
          <StreakCard streaks={streaks} />

          {/* Próximo evento */}
          {nextEvent ? (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate("/agenda")}
              className="w-full overflow-hidden rounded-2xl gradient-hope p-4 sm:p-5 text-primary-foreground shadow-lg text-left touch-feedback"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium opacity-90">Próximo Evento</p>
                  <h3 className="font-serif text-lg sm:text-xl font-semibold truncate">{nextEvent.title}</h3>
                  <p className="mt-0.5 text-xs sm:text-sm opacity-80">
                    {formatEventDate(nextEvent.event_date).weekday}, {nextEvent.start_time.slice(0, 5)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex h-14 w-14 sm:h-16 sm:w-16 flex-col items-center justify-center rounded-xl bg-primary-foreground/20">
                    <span className="text-xl sm:text-2xl font-bold">{formatEventDate(nextEvent.event_date).day}</span>
                    <span className="text-[10px] sm:text-xs font-medium">{formatEventDate(nextEvent.event_date).month}</span>
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
              className="overflow-hidden rounded-2xl gradient-hope p-4 sm:p-5 text-primary-foreground shadow-lg"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-7 w-7 opacity-80" />
                <div>
                  <p className="text-xs font-medium opacity-90">Agenda</p>
                  <h3 className="font-serif text-base sm:text-lg font-semibold">Nenhum evento próximo</h3>
                </div>
              </div>
            </motion.div>
          )}

          {/* Resumo Semanal */}
          <WeeklySummaryCard summary={weeklySummary} />

          {/* Aniversariantes */}
          <BirthdaysCard />

          {/* Banner Obra em Restauração */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl bg-gradient-to-r from-primary/15 via-accent/10 to-primary/10 border border-primary/20 p-4 sm:p-5 overflow-hidden relative"
          >
            <div className="absolute -top-4 -right-4 opacity-5">
              <Globe className="h-24 w-24 text-primary" />
            </div>
            <div className="relative z-10 flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 shrink-0">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-sm sm:text-base font-semibold text-foreground">
                  Obra em Restauração
                </h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 mb-2.5">
                  Acesse o site oficial do ministério, ouça a rádio e acompanhe as novidades.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="rounded-full gap-1.5 text-xs h-8"
                    onClick={() => window.open("https://www.obraemrestauracao.org/", "_blank")}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Visitar Site
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full gap-1.5 text-xs h-8"
                    onClick={() => navigate("/radio")}
                  >
                    <Radio className="h-3 w-3" />
                    Rádio de Louvores
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          <AdFeed />

          {/* Minha Jornada */}
          <div>
            <h2 className="mb-3 font-serif text-base sm:text-lg font-semibold text-foreground">
              Minha Jornada
            </h2>
            <div className="sm:hidden">
              <JourneyCarousel items={features as JourneyItem[]} onNavigate={navigate} />
            </div>
            <div className="hidden sm:grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
              {features.map((feature, index) => (
                <FeatureCard key={feature.title} {...feature} delay={0.05 * index} />
              ))}
            </div>
          </div>

          {/* Motivação Dinâmica */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl gradient-spiritual border border-primary/10 p-4 sm:p-5 text-center overflow-hidden relative"
          >
            <div className="absolute top-2 right-3 opacity-10">
              <Flame className="h-12 w-12 text-primary" />
            </div>
            <p className="font-serif text-sm sm:text-base text-muted-foreground italic relative z-10">
            {(() => {
              const best = Math.max(streaks.prayer, streaks.reading, streaks.devotional);
              return best >= 7 
                ? `"🔥 ${best} dias consecutivos! Deus se alegra com sua fidelidade."`
                : best >= 3
                ? `"Você está construindo um hábito santo. ${best} dias seguidos!"`
                : "\"Cada dia é uma nova oportunidade de servir a Deus e crescer em fé.\"";
            })()}
            </p>
            <p className="mt-2 text-xs sm:text-sm font-medium text-primary relative z-10">
              {weeklySummary.devotionalsCompleted > 0 
                ? `${weeklySummary.devotionalsCompleted} devocionais esta semana — continue crescendo! 🌱`
                : "Comece seu devocional de hoje e ganhe XP! 🙏"
              }
            </p>
          </motion.div>
        </motion.div>
      </main>

      <AmbientSound />
      <AIFloatingButton type="general" />
      <BottomNavigation />
    </div>
  );
};

export default Dashboard;
