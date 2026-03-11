import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BookOpen, Gamepad2, Trophy, Star, Target, Library,
  ArrowLeft, Sparkles, Heart
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useXpAward } from "@/hooks/useXpAward";
import { useToast } from "@/hooks/use-toast";

// ─── Histórias Bíblicas ────────────────────────────────────────
const BIBLE_STORIES = [
  { id: "creation", title: "A Criação do Mundo", emoji: "🌍", description: "Deus criou o céu, a terra e tudo que existe!", chapters: 3, reference: "Gênesis 1-2" },
  { id: "noah", title: "Noé e a Arca", emoji: "🚢", description: "Noé obedeceu a Deus e construiu uma grande arca.", chapters: 3, reference: "Gênesis 6-9" },
  { id: "david", title: "Davi e Golias", emoji: "⚔️", description: "Um jovem corajoso enfrentou um gigante com fé em Deus!", chapters: 2, reference: "1 Samuel 17" },
  { id: "daniel", title: "Daniel na Cova dos Leões", emoji: "🦁", description: "Daniel confiou em Deus e foi protegido.", chapters: 2, reference: "Daniel 6" },
  { id: "jonah", title: "Jonas e o Grande Peixe", emoji: "🐋", description: "Jonas aprendeu que não podemos fugir de Deus.", chapters: 3, reference: "Jonas 1-4" },
  { id: "moses", title: "Moisés e o Mar Vermelho", emoji: "🌊", description: "Deus abriu o mar para salvar seu povo!", chapters: 2, reference: "Êxodo 14" },
  { id: "jesus-birth", title: "O Nascimento de Jesus", emoji: "⭐", description: "O Salvador do mundo nasceu em Belém.", chapters: 2, reference: "Lucas 2" },
  { id: "miracles", title: "Os Milagres de Jesus", emoji: "✨", description: "Jesus curou doentes e fez coisas incríveis!", chapters: 4, reference: "Marcos/Lucas" },
];

// ─── Missões Semanais ────────────────────────────────────────
const WEEKLY_MISSIONS = [
  { id: "read-story", title: "Ler uma história bíblica", emoji: "📖", xp: 20 },
  { id: "memorize-verse", title: "Memorizar um versículo", emoji: "💭", xp: 30 },
  { id: "pray-today", title: "Fazer uma oração", emoji: "🙏", xp: 15 },
  { id: "complete-quiz", title: "Completar um quiz", emoji: "🧠", xp: 25 },
  { id: "help-someone", title: "Ajudar alguém hoje", emoji: "❤️", xp: 40 },
];

// ─── Quiz Infantil ────────────────────────────────────────
const KIDS_QUIZ_QUESTIONS = [
  { question: "Quem construiu a arca?", options: ["Moisés", "Noé", "Davi", "Jonas"], correct: 1 },
  { question: "Quantos dias Deus levou para criar o mundo?", options: ["3 dias", "5 dias", "6 dias", "7 dias"], correct: 2 },
  { question: "Quem derrotou o gigante Golias?", options: ["Sansão", "Davi", "Josué", "Samuel"], correct: 1 },
  { question: "Onde Jesus nasceu?", options: ["Nazaré", "Jerusalém", "Belém", "Egito"], correct: 2 },
  { question: "Quem foi engolido por um grande peixe?", options: ["Pedro", "Jonas", "Paulo", "Elias"], correct: 1 },
  { question: "Quem abriu o Mar Vermelho?", options: ["Noé", "Abraão", "Moisés", "Josué"], correct: 2 },
];

type KidsTab = "stories" | "quiz" | "missions" | "memory";

const EspacoKids = () => {
  const navigate = useNavigate();
  const { user, isApproved, isLoading: authLoading } = useAuth();
  const { awardXp } = useXpAward(user?.id);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<KidsTab>("stories");
  const [readStories, setReadStories] = useState<string[]>([]);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  
  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Memory game state
  const [memoryCards, setMemoryCards] = useState<Array<{ id: number; emoji: string; flipped: boolean; matched: boolean }>>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryCompleted, setMemoryCompleted] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/auth");
      else if (!isApproved) navigate("/pending");
    }
  }, [user, isApproved, authLoading, navigate]);

  // Load progress from journal
  useEffect(() => {
    if (!user) return;
    const loadProgress = async () => {
      const { data } = await supabase
        .from("journal_entries")
        .select("title")
        .eq("user_id", user.id)
        .like("title", "Kids:%");
      if (data) {
        const stories = data.filter(d => d.title?.startsWith("Kids:Story:")).map(d => d.title!.replace("Kids:Story:", ""));
        const missions = data.filter(d => d.title?.startsWith("Kids:Mission:")).map(d => d.title!.replace("Kids:Mission:", ""));
        setReadStories(stories);
        setCompletedMissions(missions);
      }
    };
    loadProgress();
  }, [user]);

  const initMemoryGame = () => {
    const emojis = ["✝️", "📖", "🙏", "⭐", "❤️", "🕊️", "🌈", "🔥"];
    const cards = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setMemoryCards(cards);
    setFlippedCards([]);
    setMemoryMoves(0);
    setMemoryCompleted(false);
  };

  const handleMemoryClick = (id: number) => {
    if (flippedCards.length === 2) return;
    const card = memoryCards[id];
    if (card.flipped || card.matched) return;

    const newCards = [...memoryCards];
    newCards[id].flipped = true;
    setMemoryCards(newCards);
    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMemoryMoves(m => m + 1);
      const [a, b] = newFlipped;
      if (newCards[a].emoji === newCards[b].emoji) {
        newCards[a].matched = true;
        newCards[b].matched = true;
        setMemoryCards(newCards);
        setFlippedCards([]);
        if (newCards.every(c => c.matched)) {
          setMemoryCompleted(true);
          awardXp("rotina", `kids-memory-${Date.now()}`, "Jogo da Memória Kids");
          toast({ title: "Parabéns! 🎉", description: "Você completou o jogo da memória!" });
        }
      } else {
        setTimeout(() => {
          newCards[a].flipped = false;
          newCards[b].flipped = false;
          setMemoryCards([...newCards]);
          setFlippedCards([]);
        }, 800);
      }
    }
  };

  const handleReadStory = async (storyId: string) => {
    if (!user || readStories.includes(storyId)) return;
    await supabase.from("journal_entries").insert({
      user_id: user.id,
      title: `Kids:Story:${storyId}`,
      content: `História bíblica lida: ${storyId}`,
      mood: "happy",
    });
    setReadStories(prev => [...prev, storyId]);
    await awardXp("rotina", `kids-story-${storyId}`, "Leitura Kids");
    toast({ title: "📖 História lida!", description: "+20 XP" });
  };

  const handleCompleteMission = async (missionId: string, xp: number) => {
    if (!user || completedMissions.includes(missionId)) return;
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("journal_entries").insert({
      user_id: user.id,
      title: `Kids:Mission:${missionId}`,
      content: `Missão completada: ${missionId} em ${today}`,
      mood: "motivated",
    });
    setCompletedMissions(prev => [...prev, missionId]);
    await awardXp("rotina", `kids-mission-${missionId}-${today}`, "Missão Kids");
    toast({ title: "🌟 Missão concluída!", description: `+${xp} XP` });
  };

  const handleQuizAnswer = async (index: number) => {
    setSelectedAnswer(index);
    const isCorrect = index === KIDS_QUIZ_QUESTIONS[currentQuestion].correct;
    if (isCorrect) setQuizScore(s => s + 1);
    
    setTimeout(() => {
      setSelectedAnswer(null);
      if (currentQuestion < KIDS_QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestion(q => q + 1);
      } else {
        setQuizFinished(true);
        if (user) {
          awardXp("quiz", `kids-quiz-${Date.now()}`, "Quiz Kids");
        }
      }
    }, 1000);
  };

  const tabs = [
    { id: "stories" as KidsTab, label: "Histórias", emoji: "📖" },
    { id: "quiz" as KidsTab, label: "Quiz", emoji: "🧠" },
    { id: "missions" as KidsTab, label: "Missões", emoji: "🌟" },
    { id: "memory" as KidsTab, label: "Memória", emoji: "🎮" },
  ];

  const totalProgress = readStories.length + completedMissions.length;
  const maxProgress = BIBLE_STORIES.length + WEEKLY_MISSIONS.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-sky-50 to-purple-50 dark:from-background dark:via-background dark:to-background">
      {/* Header Kids */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 dark:from-primary dark:to-accent px-4 py-3 shadow-lg"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 12px))' }}>
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/20 rounded-full h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🌈</span> Espaço Kids / Teen
            </h1>
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
            <Star className="h-4 w-4 text-yellow-200" />
            <span className="text-sm font-bold text-white">{totalProgress * 20} XP</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pt-3 max-w-lg mx-auto">
        <div className="flex items-center gap-2 text-sm mb-1">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span className="text-muted-foreground font-medium">Progresso Geral</span>
          <span className="ml-auto font-bold text-foreground">{totalProgress}/{maxProgress}</span>
        </div>
        <Progress value={(totalProgress / maxProgress) * 100} className="h-3 rounded-full" />
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4 max-w-lg mx-auto">
        <div className="flex gap-1.5 bg-card/80 backdrop-blur rounded-2xl p-1.5 shadow-sm border border-border/50">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === "memory" && memoryCards.length === 0) initMemoryGame(); }}
              className={`flex-1 rounded-xl py-2 text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
              <span className="block text-base mb-0.5">{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 max-w-lg mx-auto pb-8">
        {/* ─── HISTÓRIAS ─── */}
        {activeTab === "stories" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Histórias Bíblicas
            </h2>
            <p className="text-sm text-muted-foreground">Aprenda sobre Deus de um jeito divertido!</p>
            {BIBLE_STORIES.map((story, i) => {
              const isRead = readStories.includes(story.id);
              return (
                <motion.div key={story.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl border p-4 transition-all ${
                    isRead ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-card border-border hover:border-primary/30"
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{story.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground">{story.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{story.description}</p>
                      <p className="text-[10px] text-primary mt-1">{story.reference} · {story.chapters} capítulos</p>
                    </div>
                    <Button size="sm" variant={isRead ? "outline" : "default"}
                      className="rounded-full shrink-0" disabled={isRead}
                      onClick={() => handleReadStory(story.id)}>
                      {isRead ? "✅ Lida" : "Ler"}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ─── QUIZ ─── */}
        {activeTab === "quiz" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {!quizStarted ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🧠</div>
                <h2 className="text-xl font-bold text-foreground">Quiz Bíblico Kids</h2>
                <p className="text-sm text-muted-foreground mt-2 mb-6">Teste seus conhecimentos sobre a Bíblia!</p>
                <Button size="lg" className="rounded-full px-8" onClick={() => { setQuizStarted(true); setCurrentQuestion(0); setQuizScore(0); setQuizFinished(false); }}>
                  Começar! 🚀
                </Button>
              </div>
            ) : quizFinished ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">{quizScore >= 4 ? "🏆" : quizScore >= 2 ? "⭐" : "💪"}</div>
                <h2 className="text-xl font-bold text-foreground">
                  {quizScore >= 4 ? "Incrível!" : quizScore >= 2 ? "Muito bem!" : "Continue tentando!"}
                </h2>
                <p className="text-lg text-primary font-bold mt-2">{quizScore}/{KIDS_QUIZ_QUESTIONS.length} acertos</p>
                <Button className="mt-6 rounded-full" onClick={() => { setQuizStarted(true); setCurrentQuestion(0); setQuizScore(0); setQuizFinished(false); }}>
                  Jogar novamente 🔄
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Pergunta {currentQuestion + 1}/{KIDS_QUIZ_QUESTIONS.length}</span>
                  <span className="text-sm font-bold text-primary">⭐ {quizScore}</span>
                </div>
                <Progress value={((currentQuestion + 1) / KIDS_QUIZ_QUESTIONS.length) * 100} className="h-2 mb-4" />
                <div className="rounded-2xl bg-card border border-border p-5 mb-4">
                  <h3 className="text-lg font-bold text-foreground text-center">
                    {KIDS_QUIZ_QUESTIONS[currentQuestion].question}
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {KIDS_QUIZ_QUESTIONS[currentQuestion].options.map((opt, i) => {
                    const isCorrect = i === KIDS_QUIZ_QUESTIONS[currentQuestion].correct;
                    const isSelected = selectedAnswer === i;
                    return (
                      <motion.button key={i} whileTap={{ scale: 0.97 }}
                        disabled={selectedAnswer !== null}
                        onClick={() => handleQuizAnswer(i)}
                        className={`w-full rounded-xl py-3 px-4 text-left font-medium border-2 transition-all ${
                          selectedAnswer !== null
                            ? isCorrect
                              ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300"
                              : isSelected
                                ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
                                : "border-border bg-card text-muted-foreground"
                            : "border-border bg-card text-foreground hover:border-primary/50"
                        }`}>
                        <span className="mr-2">{["🅰️","🅱️","©️","🅳️"][i]}</span> {opt}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── MISSÕES ─── */}
        {activeTab === "missions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Missões da Semana
            </h2>
            <p className="text-sm text-muted-foreground">Complete missões e ganhe estrelas!</p>
            {WEEKLY_MISSIONS.map((mission, i) => {
              const isCompleted = completedMissions.includes(mission.id);
              return (
                <motion.div key={mission.id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className={`rounded-2xl border p-4 flex items-center gap-3 ${
                    isCompleted ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-card border-border"
                  }`}>
                  <div className="text-2xl">{mission.emoji}</div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {mission.title}
                    </h3>
                    <p className="text-xs text-primary font-medium">+{mission.xp} XP</p>
                  </div>
                  <Button size="sm" variant={isCompleted ? "outline" : "default"}
                    className="rounded-full" disabled={isCompleted}
                    onClick={() => handleCompleteMission(mission.id, mission.xp)}>
                    {isCompleted ? "✅" : "Concluir"}
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* ─── JOGO DA MEMÓRIA ─── */}
        {activeTab === "memory" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-primary" /> Jogo da Memória
              </h2>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">Jogadas: <strong className="text-foreground">{memoryMoves}</strong></span>
                <Button size="sm" variant="outline" className="rounded-full" onClick={initMemoryGame}>🔄</Button>
              </div>
            </div>

            {memoryCompleted && (
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                className="text-center py-4 rounded-2xl bg-gradient-to-r from-amber-100 to-pink-100 dark:from-primary/10 dark:to-accent/10 border border-primary/20">
                <div className="text-4xl mb-2">🎉</div>
                <p className="font-bold text-foreground">Parabéns! Completou em {memoryMoves} jogadas!</p>
              </motion.div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {memoryCards.map((card) => (
                <motion.button key={card.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMemoryClick(card.id)}
                  className={`aspect-square rounded-xl text-2xl flex items-center justify-center border-2 transition-all ${
                    card.flipped || card.matched
                      ? card.matched
                        ? "bg-green-100 dark:bg-green-950/30 border-green-300 dark:border-green-700"
                        : "bg-primary/10 border-primary/30"
                      : "bg-card border-border hover:border-primary/30"
                  }`}>
                  {card.flipped || card.matched ? card.emoji : "❓"}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EspacoKids;
