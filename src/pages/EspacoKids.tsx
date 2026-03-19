import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, BookOpen, Brain, Gamepad2, GraduationCap, Heart,
  Music2, Sparkles, Star, Target, Trophy, Palette, Lightbulb, Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useXpAward } from "@/hooks/useXpAward";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/BottomNavigation";
import { KidsStoryReaderDialog } from "@/components/kids/KidsStoryReaderDialog";
import {
  KIDS_MEMORY_VERSES, KIDS_QUIZ_QUESTIONS, KIDS_STORIES,
  KIDS_TRACKS, KIDS_WEEKLY_MISSIONS,
  type KidsStory, type KidsAgeGroup,
} from "@/data/kidsTeenContent";

// Ghibli memory game imports
import imgJesusPastor from "@/assets/memory/jesus-pastor.png";
import imgArcaNoe from "@/assets/memory/arca-noe.png";
import imgDaviGolias from "@/assets/memory/davi-golias.png";
import imgDanielLeoes from "@/assets/memory/daniel-leoes.png";
import imgPombaPaz from "@/assets/memory/pomba-paz.png";
import imgSarzaArdente from "@/assets/memory/sarza-ardente.png";
import imgMoisesMar from "@/assets/memory/moises-mar.png";
import imgNascimentoJesus from "@/assets/memory/nascimento-jesus.png";

type KidsTab = "home" | "stories" | "quiz" | "missions" | "memory" | "devocional" | "tracks";

const getCurrentWeekKey = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), 0, 1);
  const elapsedDays = Math.floor((now.getTime() - firstDay.getTime()) / 86400000);
  const week = Math.ceil((elapsedDays + firstDay.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
};
const CURRENT_WEEK = getCurrentWeekKey();

const MEMORY_PAIRS = [
  { label: "Jesus Pastor", image: imgJesusPastor },
  { label: "Arca de Noé", image: imgArcaNoe },
  { label: "Davi e Golias", image: imgDaviGolias },
  { label: "Daniel e os Leões", image: imgDanielLeoes },
  { label: "Pomba da Paz", image: imgPombaPaz },
  { label: "Sarça Ardente", image: imgSarzaArdente },
  { label: "Moisés", image: imgMoisesMar },
  { label: "Nascimento de Jesus", image: imgNascimentoJesus },
];

interface MemoryCard { id: number; pairId: number; image: string; flipped: boolean; matched: boolean; }

const KIDS_DEVOTIONALS = [
  { id: "dev1", title: "Deus cuida de mim", verse: "Salmos 23:1", verseText: "O Senhor é o meu pastor; nada me faltará.", message: "Assim como um pastor cuida das suas ovelhas, Deus cuida de você todos os dias.", prayer: "Senhor, obrigado por cuidar de mim. Amém.", emoji: "🐑", ageGroup: "5-8" as KidsAgeGroup },
  { id: "dev2", title: "Coragem para enfrentar", verse: "Josué 1:9", verseText: "Sê forte e corajoso; não temas, porque o Senhor teu Deus é contigo.", message: "Quando sentir medo, lembre-se: Deus está com você!", prayer: "Deus, me dê coragem. Sei que estás comigo. Amém.", emoji: "💪", ageGroup: "9-12" as KidsAgeGroup },
  { id: "dev3", title: "Identidade em Cristo", verse: "2 Coríntios 5:17", verseText: "Se alguém está em Cristo, nova criatura é.", message: "Sua verdadeira identidade está em Cristo. Você é filho(a) de Deus, amado(a) e com propósito.", prayer: "Senhor, me ajude a encontrar minha identidade em Ti. Amém.", emoji: "🦋", ageGroup: "13-17" as KidsAgeGroup },
  { id: "dev4", title: "Amizades que edificam", verse: "Provérbios 27:17", verseText: "Assim como o ferro afia o ferro, o homem afia o seu companheiro.", message: "Escolha amigos que te levem para perto de Deus.", prayer: "Deus, me ajude a ser um bom amigo. Amém.", emoji: "🤝", ageGroup: "13-17" as KidsAgeGroup },
];

const CREATIVE_ACTIVITIES = [
  { id: "draw-verse", title: "Desenhe o versículo", emoji: "🎨", description: "Ilustre o que o versículo significa para você.", xp: 30 },
  { id: "write-prayer", title: "Escreva uma oração", emoji: "✍️", description: "Escreva com suas palavras uma oração ao Senhor.", xp: 25 },
  { id: "teach-friend", title: "Ensine a um amigo", emoji: "💬", description: "Conte a história bíblica que leu para alguém.", xp: 40 },
  { id: "gratitude", title: "Liste 3 gratidões", emoji: "🙏", description: "Escreva 3 coisas pelas quais é grato(a) a Deus.", xp: 20 },
];

const EspacoKids = () => {
  const navigate = useNavigate();
  const { user, isApproved, isLoading: authLoading, isKids, isKidsLeader, isLeader, isAdmin } = useAuth();
  const { awardXp } = useXpAward(user?.id);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<KidsTab>("home");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<KidsAgeGroup | "all">("all");
  const [completedStories, setCompletedStories] = useState<string[]>([]);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [memorizedVerses, setMemorizedVerses] = useState<string[]>([]);
  const [completedActivities, setCompletedActivities] = useState<string[]>([]);
  const [selectedStory, setSelectedStory] = useState<KidsStory | null>(null);
  const [isStoryReaderOpen, setIsStoryReaderOpen] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryCompleted, setMemoryCompleted] = useState(false);
  const [memoryChecking, setMemoryChecking] = useState(false);

  // Access control: ONLY kids, kids_leader, leader, or admin can access
  const canAccess = isKids || isKidsLeader || isLeader || isAdmin;
  const isManager = isKidsLeader || isLeader || isAdmin;

  useEffect(() => {
    if (!authLoading) {
      if (!user) { navigate("/auth"); return; }
      if (!isApproved) { navigate("/pending"); return; }
      // Block non-kids users (jovem, membro, musico without kids role)
      if (!canAccess) {
        navigate("/dashboard");
        return;
      }
    }
  }, [user, isApproved, authLoading, navigate, canAccess]);

  useEffect(() => {
    if (!user) return;
    const loadProgress = async () => {
      const { data } = await supabase.from("journal_entries").select("title").eq("user_id", user.id).like("title", "KidsV2:%");
      if (!data) return;
      setCompletedStories(data.filter(e => e.title?.startsWith("KidsV2:StoryComplete:")).map(e => e.title!.replace("KidsV2:StoryComplete:", "")));
      setCompletedMissions(data.filter(e => e.title?.startsWith(`KidsV2:Mission:${CURRENT_WEEK}:`)).map(e => e.title!.replace(`KidsV2:Mission:${CURRENT_WEEK}:`, "")));
      setMemorizedVerses(data.filter(e => e.title?.startsWith("KidsV2:Verse:")).map(e => e.title!.replace("KidsV2:Verse:", "")));
      setCompletedActivities(data.filter(e => e.title?.startsWith(`KidsV2:Activity:${CURRENT_WEEK}:`)).map(e => e.title!.replace(`KidsV2:Activity:${CURRENT_WEEK}:`, "")));
    };
    loadProgress();
  }, [user]);

  const filteredStories = useMemo(() => selectedAgeGroup === "all" ? KIDS_STORIES : KIDS_STORIES.filter(s => s.ageGroup === selectedAgeGroup), [selectedAgeGroup]);
  const filteredDevotionals = useMemo(() => selectedAgeGroup === "all" ? KIDS_DEVOTIONALS : KIDS_DEVOTIONALS.filter(d => d.ageGroup === selectedAgeGroup), [selectedAgeGroup]);

  const totalProgress = completedStories.length + completedMissions.length + memorizedVerses.length + completedActivities.length;
  const maxProgress = KIDS_STORIES.length + KIDS_WEEKLY_MISSIONS.length + KIDS_MEMORY_VERSES.length + CREATIVE_ACTIVITIES.length;

  const completedStoriesSet = useMemo(() => new Set(completedStories), [completedStories]);
  const completedMissionsSet = useMemo(() => new Set(completedMissions), [completedMissions]);
  const memorizedVersesSet = useMemo(() => new Set(memorizedVerses), [memorizedVerses]);
  const completedActivitiesSet = useMemo(() => new Set(completedActivities), [completedActivities]);

  const initMemoryGame = () => {
    const pairs = MEMORY_PAIRS.slice(0, 6);
    const deck = pairs.flatMap((p, i) => [
      { id: i * 2, pairId: i, image: p.image, flipped: false, matched: false },
      { id: i * 2 + 1, pairId: i, image: p.image, flipped: false, matched: false },
    ]).sort(() => Math.random() - 0.5);
    setMemoryCards(deck);
    setFlippedCards([]);
    setMemoryMoves(0);
    setMemoryCompleted(false);
    setMemoryChecking(false);
  };

  const handleMemoryClick = (cardId: number) => {
    if (memoryChecking || flippedCards.length === 2) return;
    const card = memoryCards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) return;
    const updated = memoryCards.map(c => c.id === cardId ? { ...c, flipped: true } : c);
    setMemoryCards(updated);
    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);
    if (newFlipped.length === 2) {
      setMemoryMoves(prev => prev + 1);
      setMemoryChecking(true);
      const cardA = updated.find(c => c.id === newFlipped[0])!;
      const cardB = updated.find(c => c.id === newFlipped[1])!;
      if (cardA.pairId === cardB.pairId) {
        const matched = updated.map(c => c.pairId === cardA.pairId ? { ...c, matched: true } : c);
        setMemoryCards(matched);
        setFlippedCards([]);
        setMemoryChecking(false);
        if (matched.every(c => c.matched)) {
          setMemoryCompleted(true);
          void awardXp("rotina", `kids-memory-${CURRENT_WEEK}`, "Jogo da Memória Kids");
          toast({ title: "Parabéns! 🎉", description: "Jogo concluído! XP ganho." });
        }
      } else {
        window.setTimeout(() => {
          setMemoryCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
          setFlippedCards([]);
          setMemoryChecking(false);
        }, 750);
      }
    }
  };

  const openStoryReader = (story: KidsStory) => { setSelectedStory(story); setIsStoryReaderOpen(true); };

  const handleCompleteStory = async (storyId: string) => {
    if (!user || completedStories.includes(storyId)) return;
    const { error } = await supabase.from("journal_entries").insert({ user_id: user.id, title: `KidsV2:StoryComplete:${storyId}`, content: `História: ${storyId}`, mood: "blessed" });
    if (error) { toast({ title: "Erro ao salvar", variant: "destructive" }); return; }
    setCompletedStories(prev => [...prev, storyId]);
    await awardXp("rotina", `kids-story-${storyId}`, "Leitura Kids/Teen");
    toast({ title: "História concluída! 📖" });
  };

  const handleCompleteMission = async (missionId: string) => {
    if (!user || completedMissions.includes(missionId)) return;
    const { error } = await supabase.from("journal_entries").insert({ user_id: user.id, title: `KidsV2:Mission:${CURRENT_WEEK}:${missionId}`, content: `Missão: ${missionId}`, mood: "motivated" });
    if (error) return;
    setCompletedMissions(prev => [...prev, missionId]);
    await awardXp("rotina", `kids-mission-${CURRENT_WEEK}-${missionId}`, "Missão semanal Kids");
    toast({ title: "Missão concluída! 🌟" });
  };

  const handleMemorizeVerse = async (verseId: string) => {
    if (!user || memorizedVerses.includes(verseId)) return;
    const { error } = await supabase.from("journal_entries").insert({ user_id: user.id, title: `KidsV2:Verse:${verseId}`, content: `Versículo: ${verseId}`, mood: "grateful" });
    if (error) return;
    setMemorizedVerses(prev => [...prev, verseId]);
    await awardXp("rotina", `kids-verse-${verseId}`, "Versículo memorizado");
    toast({ title: "Versículo memorizado! ✨" });
  };

  const handleCompleteActivity = async (activityId: string) => {
    if (!user || completedActivities.includes(activityId)) return;
    const { error } = await supabase.from("journal_entries").insert({ user_id: user.id, title: `KidsV2:Activity:${CURRENT_WEEK}:${activityId}`, content: `Atividade: ${activityId}`, mood: "creative" });
    if (error) return;
    setCompletedActivities(prev => [...prev, activityId]);
    const activity = CREATIVE_ACTIVITIES.find(a => a.id === activityId);
    await awardXp("rotina", `kids-activity-${CURRENT_WEEK}-${activityId}`, "Atividade criativa Kids");
    toast({ title: "Atividade concluída! 🎨", description: `+${activity?.xp || 0} XP` });
  };

  const startQuiz = () => { setQuizStarted(true); setCurrentQuestion(0); setQuizScore(0); setQuizFinished(false); setSelectedAnswer(null); };

  const handleQuizAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    const isCorrect = index === KIDS_QUIZ_QUESTIONS[currentQuestion].correct;
    const updatedScore = quizScore + (isCorrect ? 1 : 0);
    if (isCorrect) setQuizScore(prev => prev + 1);
    window.setTimeout(async () => {
      setSelectedAnswer(null);
      if (currentQuestion < KIDS_QUIZ_QUESTIONS.length - 1) { setCurrentQuestion(prev => prev + 1); return; }
      setQuizFinished(true);
      if (user) await awardXp("quiz", `kids-quiz-${CURRENT_WEEK}-${Date.now()}`, `Quiz Kids (${updatedScore}/${KIDS_QUIZ_QUESTIONS.length})`);
    }, 800);
  };

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const tabs = [
    { id: "home" as KidsTab, label: "Início", emoji: "🏠" },
    { id: "stories" as KidsTab, label: "Histórias", emoji: "📖" },
    { id: "devocional" as KidsTab, label: "Devocional", emoji: "💡" },
    { id: "quiz" as KidsTab, label: "Quiz", emoji: "🧠" },
    { id: "missions" as KidsTab, label: "Missões", emoji: "🌟" },
    { id: "memory" as KidsTab, label: "Jogos", emoji: "🎮" },
    { id: "tracks" as KidsTab, label: "Trilhas", emoji: "🎯" },
  ];

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: "calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))" }}>
      {/* Header with gradient */}
      <div className="sticky top-0 z-40 border-b border-border/60 bg-gradient-to-r from-primary/5 via-card/95 to-accent/5 backdrop-blur px-4 py-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 12px))" }}>
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="h-9 w-9 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-base font-bold text-foreground sm:text-lg">
              <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                <Sparkles className="h-4 w-4 text-primary" />
              </motion.span>
              Espaço Kids & Teen
            </h1>
            <p className="text-xs text-muted-foreground">Crescendo na fé com alegria! 🌟</p>
          </div>
          <div className="flex items-center gap-2">
            {isManager && (
              <Badge className="bg-primary/10 text-primary text-[10px] gap-1 animate-pulse">
                <Shield className="h-3 w-3" /> Líder
              </Badge>
            )}
            <motion.div
              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              animate={totalProgress > 0 ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ⭐ {totalProgress}/{maxProgress}
            </motion.div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-4 space-y-4">
        {/* Manager banner */}
        {isManager && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Painel do Líder Kids</h3>
            </div>
            <p className="text-xs text-muted-foreground">Você pode gerenciar atividades, acompanhar progresso e atribuir missões às crianças e adolescentes.</p>
          </div>
        )}

        {/* Age filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: "all" as const, label: "Todos", emoji: "👦👧" },
            { id: "5-8" as KidsAgeGroup, label: "5-8 anos", emoji: "🧒" },
            { id: "9-12" as KidsAgeGroup, label: "9-12 anos", emoji: "🧑" },
            { id: "13-17" as KidsAgeGroup, label: "13-17 anos", emoji: "🧑‍🎓" },
          ].map(ag => (
            <button key={ag.id} onClick={() => setSelectedAgeGroup(ag.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                selectedAgeGroup === ag.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}>
              <span>{ag.emoji}</span> {ag.label}
            </button>
          ))}
        </div>

        {/* Progress */}
        <section className="rounded-2xl border border-border/70 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Progresso Espiritual</h2>
          </div>
          <Progress value={(totalProgress / maxProgress) * 100} className="h-2.5" />
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
            <span>📖 {completedStories.length} histórias</span>
            <span>🌟 {completedMissions.length} missões</span>
            <span>💭 {memorizedVerses.length} versículos</span>
            <span>🎨 {completedActivities.length} atividades</span>
          </div>
        </section>

        {/* Tabs */}
        <section className="rounded-2xl border border-border/70 bg-card p-1.5">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id === "memory" && memoryCards.length === 0) initMemoryGame(); }}
                className={`rounded-lg px-2.5 py-2 text-center text-[10px] font-medium transition-colors whitespace-nowrap sm:text-xs shrink-0 ${
                  activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/70"
                }`}>
                <span className="block text-sm mb-0.5">{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* HOME */}
        {activeTab === "home" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Welcome banner with animated elements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400/20 via-primary/10 to-pink-400/20 border border-primary/15 p-5 text-center"
            >
              <motion.p
                className="text-4xl mb-2"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >🌈</motion.p>
              <h2 className="font-serif text-lg font-bold text-foreground">Bem-vindo ao Espaço Kids & Teen!</h2>
              <p className="text-sm text-muted-foreground mt-1">Um lugar especial para aprender sobre Deus.</p>
              {/* Floating decorative elements */}
              <motion.span className="absolute top-2 right-3 text-lg opacity-40" animate={{ y: [0, -8, 0], rotate: [0, 15, 0] }} transition={{ duration: 4, repeat: Infinity }}>⭐</motion.span>
              <motion.span className="absolute bottom-2 left-3 text-lg opacity-30" animate={{ y: [0, -6, 0], rotate: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }}>✨</motion.span>
            </motion.div>

            {/* Daily streak/tip */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl bg-primary/5 border border-primary/15 p-3 flex items-center gap-3"
            >
              <motion.span className="text-2xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>🔥</motion.span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">Dica do dia</p>
                <p className="text-[11px] text-muted-foreground">Leia uma história bíblica e ganhe XP! Cada progresso conta.</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { tab: "stories" as KidsTab, icon: BookOpen, label: "Histórias Bíblicas", color: "bg-blue-500/10 text-blue-600", count: `${filteredStories.length} disponíveis`, delay: 0.05 },
                { tab: "devocional" as KidsTab, icon: Lightbulb, label: "Devocional", color: "bg-amber-500/10 text-amber-600", count: `${filteredDevotionals.length} lições`, delay: 0.1 },
                { tab: "quiz" as KidsTab, icon: Brain, label: "Quiz Bíblico", color: "bg-purple-500/10 text-purple-600", count: `${KIDS_QUIZ_QUESTIONS.length} perguntas`, delay: 0.15 },
                { tab: "missions" as KidsTab, icon: Target, label: "Missões da Semana", color: "bg-green-500/10 text-green-600", count: `${completedMissions.length}/${KIDS_WEEKLY_MISSIONS.length}`, delay: 0.2 },
                { tab: "memory" as KidsTab, icon: Gamepad2, label: "Jogos Bíblicos", color: "bg-pink-500/10 text-pink-600", count: "Memória Ghibli", delay: 0.25 },
                { tab: "tracks" as KidsTab, icon: GraduationCap, label: "Trilhas de Fé", color: "bg-teal-500/10 text-teal-600", count: "3 trilhas", delay: 0.3 },
              ].map(item => (
                <motion.button key={item.tab}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: item.delay }}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => { setActiveTab(item.tab); if (item.tab === "memory" && memoryCards.length === 0) initMemoryGame(); }}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card p-4 hover:bg-accent/50 hover:shadow-md transition-all">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.color}`}><item.icon className="h-5 w-5" /></div>
                  <p className="font-medium text-sm text-foreground text-center">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.count}</p>
                </motion.button>
              ))}
            </div>

            {/* Devotional highlight card */}
            {filteredDevotionals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-50/10 to-amber-100/5 p-4 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <motion.span className="text-2xl" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>{filteredDevotionals[0].emoji}</motion.span>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{filteredDevotionals[0].title}</h3>
                    <p className="text-xs text-primary font-medium">{filteredDevotionals[0].verse}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic leading-relaxed">"{filteredDevotionals[0].verseText}"</p>
                <Button size="sm" className="rounded-full mt-3 gap-1.5" onClick={() => setActiveTab("devocional")}>
                  <Lightbulb className="h-3.5 w-3.5" /> Ler devocional
                </Button>
              </motion.div>
            )}

            {/* Creative Activities */}
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-foreground mb-3"><Palette className="h-4 w-4 text-primary" /> Atividades Criativas</h3>
              <div className="grid grid-cols-2 gap-2">
                {CREATIVE_ACTIVITIES.map((activity, idx) => {
                  const isDone = completedActivitiesSet.has(activity.id);
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + idx * 0.05 }}
                      className={`rounded-xl border bg-card p-3 transition-all ${isDone ? "border-primary/20 bg-primary/5" : "border-border/70 hover:shadow-sm"}`}
                    >
                      <motion.span className="text-2xl block" whileHover={{ scale: 1.2, rotate: 10 }}>{activity.emoji}</motion.span>
                      <p className={`font-medium text-xs mt-1 ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>{activity.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{activity.description}</p>
                      <Button size="sm" variant={isDone ? "outline" : "default"} className="w-full rounded-full mt-2 text-xs h-7"
                        onClick={() => handleCompleteActivity(activity.id)} disabled={isDone}>
                        {isDone ? "✅ Feito" : `+${activity.xp} XP`}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* STORIES */}
        {activeTab === "stories" && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground"><BookOpen className="h-5 w-5 text-primary" /> Histórias Bíblicas</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredStories.map(story => {
                const isCompleted = completedStoriesSet.has(story.id);
                return (
                  <div key={story.id} className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-2xl">{story.coverEmoji}</p>
                        <h4 className="mt-1 font-semibold text-foreground">{story.title}</h4>
                        <p className="text-xs text-muted-foreground">{story.reference}</p>
                      </div>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">{story.ageGroup} anos</span>
                    </div>
                    <p className="mb-3 text-sm text-muted-foreground">{story.summary}</p>
                    <Button className="w-full rounded-full" variant={isCompleted ? "outline" : "default"} onClick={() => openStoryReader(story)}>
                      {isCompleted ? "✅ Revisar" : "Abrir história"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* DEVOCIONAL */}
        {activeTab === "devocional" && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground"><Lightbulb className="h-5 w-5 text-primary" /> Devocional Kids & Teen</h3>
            {filteredDevotionals.map(dev => (
              <div key={dev.id} className="rounded-2xl border border-border/70 bg-card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{dev.emoji}</span>
                  <div>
                    <h4 className="font-bold text-foreground">{dev.title}</h4>
                    <p className="text-xs text-primary font-medium">{dev.verse}</p>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{dev.ageGroup} anos</span>
                  </div>
                </div>
                <div className="rounded-xl bg-primary/5 border border-primary/15 p-3">
                  <p className="text-sm text-foreground italic">"{dev.verseText}"</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{dev.message}</p>
                <div className="rounded-xl bg-accent/30 p-3">
                  <p className="text-xs font-semibold text-foreground mb-1">🙏 Oração:</p>
                  <p className="text-sm text-muted-foreground italic">{dev.prayer}</p>
                </div>
              </div>
            ))}
          </motion.section>
        )}

        {/* QUIZ */}
        {activeTab === "quiz" && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {!quizStarted ? (
              <div className="rounded-2xl border border-border/70 bg-card p-6 text-center">
                <Brain className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground">Quiz Bíblico Kids</h3>
                <p className="mt-1 text-sm text-muted-foreground">Responda perguntas sobre as histórias.</p>
                <Button className="mt-5 rounded-full px-8" onClick={startQuiz}>Começar quiz</Button>
              </div>
            ) : quizFinished ? (
              <div className="rounded-2xl border border-border/70 bg-card p-6 text-center">
                <p className="mb-2 text-4xl">{quizScore >= 5 ? "🏆" : quizScore >= 3 ? "⭐" : "💪"}</p>
                <h3 className="text-lg font-bold text-foreground">Quiz finalizado!</h3>
                <p className="mt-1 text-sm text-muted-foreground">Acertou {quizScore} de {KIDS_QUIZ_QUESTIONS.length}.</p>
                <Button className="mt-5 rounded-full" onClick={startQuiz}>Jogar novamente</Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Pergunta {currentQuestion + 1}/{KIDS_QUIZ_QUESTIONS.length}</span>
                  <span className="font-semibold text-primary">{quizScore} acertos</span>
                </div>
                <Progress value={((currentQuestion + 1) / KIDS_QUIZ_QUESTIONS.length) * 100} className="h-2" />
                <h3 className="mt-4 text-base font-semibold text-foreground">{KIDS_QUIZ_QUESTIONS[currentQuestion].question}</h3>
                <div className="mt-4 grid gap-2">
                  {KIDS_QUIZ_QUESTIONS[currentQuestion].options.map((option, index) => {
                    const isCorrect = index === KIDS_QUIZ_QUESTIONS[currentQuestion].correct;
                    const isSelected = selectedAnswer === index;
                    return (
                      <button key={option} onClick={() => handleQuizAnswer(index)} disabled={selectedAnswer !== null}
                        className={`rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors ${
                          selectedAnswer === null ? "border-border bg-card hover:border-primary/40"
                            : isCorrect ? "border-primary bg-primary/10" : isSelected ? "border-destructive/50 bg-destructive/10" : "border-border bg-card text-muted-foreground"
                        }`}>{option}</button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* MISSIONS */}
        {activeTab === "missions" && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground"><Target className="h-5 w-5 text-primary" /> Missões da Semana</h3>
            {KIDS_WEEKLY_MISSIONS.map(mission => {
              const isDone = completedMissionsSet.has(mission.id);
              return (
                <div key={mission.id} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4">
                  <span className="text-2xl">{mission.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>{mission.title}</p>
                    <p className="text-xs text-primary">+{mission.xp} XP</p>
                  </div>
                  <Button size="sm" variant={isDone ? "outline" : "default"} className="rounded-full"
                    onClick={() => handleCompleteMission(mission.id)} disabled={isDone}>
                    {isDone ? "✅ Feita" : "Concluir"}
                  </Button>
                </div>
              );
            })}
          </motion.section>
        )}

        {/* MEMORY GAME WITH GHIBLI ART */}
        {activeTab === "memory" && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-foreground"><Gamepad2 className="h-5 w-5 text-primary" /> Jogo da Memória Bíblica</h3>
              <Button size="sm" variant="outline" className="rounded-full" onClick={initMemoryGame}>Reiniciar</Button>
            </div>
            <p className="text-sm text-muted-foreground">Encontre os pares de figuras bíblicas!</p>
            {memoryCompleted && (
              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
                🎉 Concluído em <strong>{memoryMoves}</strong> jogadas!
              </div>
            )}
            <div className="grid grid-cols-4 gap-2">
              {memoryCards.map(card => (
                <motion.button key={card.id} whileTap={{ scale: 0.95 }}
                  onClick={() => handleMemoryClick(card.id)}
                  className={`aspect-square rounded-xl border overflow-hidden transition-all ${
                    card.flipped || card.matched
                      ? card.matched ? "border-primary/40 bg-primary/10 scale-95" : "border-border bg-card"
                      : "border-border bg-gradient-to-br from-primary to-primary/70 hover:scale-105"
                  }`}>
                  {card.flipped || card.matched ? (
                    <img src={card.image} alt="Carta bíblica" className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {/* TRACKS */}
        {activeTab === "tracks" && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground"><GraduationCap className="h-5 w-5 text-primary" /> Trilhas por Faixa Etária</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {KIDS_TRACKS.map(track => (
                <div key={track.id} className="rounded-2xl border border-border/70 bg-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">{track.title}</h4>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">{track.ageGroup}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{track.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {track.focus.map(item => (
                      <span key={item} className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground"><Star className="h-4 w-4 text-primary" /> Versículos para Memorizar</h4>
              <div className="space-y-3">
                {KIDS_MEMORY_VERSES.map(verse => {
                  const done = memorizedVersesSet.has(verse.id);
                  return (
                    <div key={verse.id} className="rounded-xl border border-border/70 bg-muted/20 p-3">
                      <p className="text-sm text-foreground">{verse.text}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-primary">{verse.reference}</span>
                        <Button size="sm" variant={done ? "outline" : "default"} className="rounded-full"
                          onClick={() => handleMemorizeVerse(verse.id)} disabled={done}>
                          {done ? "✅ Memorizei" : "Marcar"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>
        )}
      </main>

      <KidsStoryReaderDialog open={isStoryReaderOpen} onOpenChange={setIsStoryReaderOpen}
        story={selectedStory} isCompleted={selectedStory ? completedStoriesSet.has(selectedStory.id) : false}
        onComplete={handleCompleteStory} />

      <BottomNavigation />
    </div>
  );
};

export default EspacoKids;
