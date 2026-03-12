import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Gamepad2,
  GraduationCap,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useXpAward } from "@/hooks/useXpAward";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { KidsStoryReaderDialog } from "@/components/kids/KidsStoryReaderDialog";
import {
  KIDS_MEMORY_VERSES,
  KIDS_QUIZ_QUESTIONS,
  KIDS_STORIES,
  KIDS_TRACKS,
  KIDS_WEEKLY_MISSIONS,
  type KidsStory,
} from "@/data/kidsTeenContent";

type KidsTab = "stories" | "quiz" | "missions" | "memory" | "tracks";

const getCurrentWeekKey = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), 0, 1);
  const elapsedDays = Math.floor((now.getTime() - firstDay.getTime()) / 86400000);
  const week = Math.ceil((elapsedDays + firstDay.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
};

const CURRENT_WEEK = getCurrentWeekKey();

interface MemoryCard {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

const EspacoKids = () => {
  const navigate = useNavigate();
  const { user, isApproved, isLoading: authLoading } = useAuth();
  const { awardXp } = useXpAward(user?.id);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<KidsTab>("stories");
  const [completedStories, setCompletedStories] = useState<string[]>([]);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [memorizedVerses, setMemorizedVerses] = useState<string[]>([]);

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

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/auth");
      else if (!isApproved) navigate("/pending");
    }
  }, [user, isApproved, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const loadProgress = async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("title")
        .eq("user_id", user.id)
        .like("title", "KidsV2:%");

      if (error || !data) return;

      const stories = data
        .filter((entry) => entry.title?.startsWith("KidsV2:StoryComplete:"))
        .map((entry) => entry.title!.replace("KidsV2:StoryComplete:", ""));

      const missions = data
        .filter((entry) => entry.title?.startsWith(`KidsV2:Mission:${CURRENT_WEEK}:`))
        .map((entry) => entry.title!.replace(`KidsV2:Mission:${CURRENT_WEEK}:`, ""));

      const verses = data
        .filter((entry) => entry.title?.startsWith("KidsV2:Verse:"))
        .map((entry) => entry.title!.replace("KidsV2:Verse:", ""));

      setCompletedStories(stories);
      setCompletedMissions(missions);
      setMemorizedVerses(verses);
    };

    loadProgress();
  }, [user]);

  const tabs = [
    { id: "stories" as KidsTab, label: "Histórias", emoji: "📖" },
    { id: "quiz" as KidsTab, label: "Quiz", emoji: "🧠" },
    { id: "missions" as KidsTab, label: "Missões", emoji: "🌟" },
    { id: "memory" as KidsTab, label: "Memória", emoji: "🎮" },
    { id: "tracks" as KidsTab, label: "Trilhas", emoji: "🎯" },
  ];

  const totalProgress = completedStories.length + completedMissions.length + memorizedVerses.length;
  const maxProgress = KIDS_STORIES.length + KIDS_WEEKLY_MISSIONS.length + KIDS_MEMORY_VERSES.length;

  const initMemoryGame = () => {
    const symbols = ["✝️", "📖", "🙏", "⭐", "❤️", "🕊️", "🌈", "🔥"];
    const deck = [...symbols, ...symbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({ id: index, symbol, flipped: false, matched: false }));

    setMemoryCards(deck);
    setFlippedCards([]);
    setMemoryMoves(0);
    setMemoryCompleted(false);
    setMemoryChecking(false);
  };

  const handleMemoryClick = (cardId: number) => {
    if (memoryChecking || flippedCards.length === 2) return;

    const selectedCard = memoryCards[cardId];
    if (!selectedCard || selectedCard.flipped || selectedCard.matched) return;

    const updatedCards = [...memoryCards];
    updatedCards[cardId].flipped = true;
    setMemoryCards(updatedCards);

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMemoryMoves((prev) => prev + 1);
      setMemoryChecking(true);

      const [firstId, secondId] = newFlipped;
      const first = updatedCards[firstId];
      const second = updatedCards[secondId];

      if (first.symbol === second.symbol) {
        updatedCards[firstId].matched = true;
        updatedCards[secondId].matched = true;
        setMemoryCards([...updatedCards]);
        setFlippedCards([]);
        setMemoryChecking(false);

        if (updatedCards.every((card) => card.matched)) {
          setMemoryCompleted(true);
          void awardXp("rotina", `kids-memory-${CURRENT_WEEK}`, "Jogo da Memória Kids");
          toast({
            title: "Parabéns! 🎉",
            description: "Você concluiu o jogo da memória e ganhou XP.",
          });
        }
      } else {
        window.setTimeout(() => {
          updatedCards[firstId].flipped = false;
          updatedCards[secondId].flipped = false;
          setMemoryCards([...updatedCards]);
          setFlippedCards([]);
          setMemoryChecking(false);
        }, 750);
      }
    }
  };

  const openStoryReader = (story: KidsStory) => {
    setSelectedStory(story);
    setIsStoryReaderOpen(true);
  };

  const handleCompleteStory = async (storyId: string) => {
    if (!user || completedStories.includes(storyId)) return;

    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      title: `KidsV2:StoryComplete:${storyId}`,
      content: `História concluída no leitor Kids: ${storyId}`,
      mood: "blessed",
    });

    if (error) {
      toast({ title: "Erro ao salvar leitura", variant: "destructive" });
      return;
    }

    setCompletedStories((prev) => [...prev, storyId]);
    await awardXp("rotina", `kids-story-${storyId}`, "Leitura completa no Espaço Kids/Teen");
    toast({ title: "História concluída! 📖", description: "Leitura registrada com sucesso." });
  };

  const handleCompleteMission = async (missionId: string) => {
    if (!user || completedMissions.includes(missionId)) return;

    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      title: `KidsV2:Mission:${CURRENT_WEEK}:${missionId}`,
      content: `Missão semanal concluída: ${missionId}`,
      mood: "motivated",
    });

    if (error) {
      toast({ title: "Erro ao salvar missão", variant: "destructive" });
      return;
    }

    setCompletedMissions((prev) => [...prev, missionId]);
    await awardXp("rotina", `kids-mission-${CURRENT_WEEK}-${missionId}`, "Missão semanal Kids");
    toast({ title: "Missão concluída! 🌟", description: "Você ganhou XP da semana." });
  };

  const handleMemorizeVerse = async (verseId: string) => {
    if (!user || memorizedVerses.includes(verseId)) return;

    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      title: `KidsV2:Verse:${verseId}`,
      content: `Versículo memorizado: ${verseId}`,
      mood: "grateful",
    });

    if (error) {
      toast({ title: "Erro ao salvar versículo", variant: "destructive" });
      return;
    }

    setMemorizedVerses((prev) => [...prev, verseId]);
    await awardXp("rotina", `kids-verse-${verseId}`, "Versículo memorizado");
    toast({ title: "Versículo memorizado! ✨", description: "Continue firme na Palavra." });
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestion(0);
    setQuizScore(0);
    setQuizFinished(false);
    setSelectedAnswer(null);
  };

  const handleQuizAnswer = (index: number) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(index);
    const isCorrect = index === KIDS_QUIZ_QUESTIONS[currentQuestion].correct;
    const updatedScore = quizScore + (isCorrect ? 1 : 0);

    if (isCorrect) setQuizScore((prev) => prev + 1);

    window.setTimeout(async () => {
      setSelectedAnswer(null);

      if (currentQuestion < KIDS_QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        return;
      }

      setQuizFinished(true);
      if (user) {
        await awardXp(
          "quiz",
          `kids-quiz-${CURRENT_WEEK}-${Date.now()}`,
          `Quiz Kids finalizado (${updatedScore}/${KIDS_QUIZ_QUESTIONS.length})`
        );
      }
    }, 800);
  };

  const completedStoriesSet = useMemo(() => new Set(completedStories), [completedStories]);
  const completedMissionsSet = useMemo(() => new Set(completedMissions), [completedMissions]);
  const memorizedVersesSet = useMemo(() => new Set(memorizedVerses), [memorizedVerses]);

  return (
    <div className="min-h-screen bg-background">
      <div
        className="sticky top-0 z-40 border-b border-border/60 bg-card/95 backdrop-blur px-4 py-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 12px))" }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="h-9 w-9 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-base font-bold text-foreground sm:text-lg">
              <Sparkles className="h-4 w-4 text-primary" />
              Espaço Kids / Teen
            </h1>
            <p className="text-xs text-muted-foreground">Aprender a Bíblia com alegria e propósito</p>
          </div>

          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {totalProgress}/{maxProgress}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-4 pb-10">
        <section className="mb-4 rounded-2xl border border-border/70 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Progresso espiritual da semana</h2>
          </div>
          <Progress value={(totalProgress / maxProgress) * 100} className="h-2.5" />
          <p className="mt-2 text-xs text-muted-foreground">
            Leituras completas, missões e memorização agora só contam após conclusão real.
          </p>
        </section>

        <section className="mb-4 rounded-2xl border border-border/70 bg-card p-2">
          <div className="grid grid-cols-5 gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "memory" && memoryCards.length === 0) initMemoryGame();
                }}
                className={`rounded-xl px-1 py-2 text-center text-[11px] font-medium transition-colors sm:text-xs ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <span className="mb-0.5 block text-base" aria-hidden>
                  {tab.emoji}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === "stories" && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <BookOpen className="h-5 w-5 text-primary" /> Histórias Bíblicas com leitura guiada
            </h3>
            <p className="text-sm text-muted-foreground">
              Abra a história, avance os capítulos e conclua no final para marcar como lida.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {KIDS_STORIES.map((story) => {
                const isCompleted = completedStoriesSet.has(story.id);
                return (
                  <div
                    key={story.id}
                    className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-2xl" aria-hidden>
                          {story.coverEmoji}
                        </p>
                        <h4 className="mt-1 font-semibold text-foreground">{story.title}</h4>
                        <p className="text-xs text-muted-foreground">{story.reference}</p>
                      </div>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        {story.ageGroup} anos
                      </span>
                    </div>

                    <p className="mb-3 text-sm text-muted-foreground">{story.summary}</p>

                    <Button
                      type="button"
                      className="w-full rounded-full"
                      variant={isCompleted ? "outline" : "default"}
                      onClick={() => openStoryReader(story)}
                    >
                      {isCompleted ? "✅ Revisar história" : "Abrir história"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {activeTab === "quiz" && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {!quizStarted ? (
              <div className="rounded-2xl border border-border/70 bg-card p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Quiz Bíblico Kids</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Responda perguntas sobre as histórias estudadas.
                </p>
                <Button className="mt-5 rounded-full px-8" onClick={startQuiz}>
                  Começar quiz
                </Button>
              </div>
            ) : quizFinished ? (
              <div className="rounded-2xl border border-border/70 bg-card p-6 text-center">
                <p className="mb-2 text-4xl" aria-hidden>
                  {quizScore >= 5 ? "🏆" : quizScore >= 3 ? "⭐" : "💪"}
                </p>
                <h3 className="text-lg font-bold text-foreground">Quiz finalizado!</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Você acertou {quizScore} de {KIDS_QUIZ_QUESTIONS.length} perguntas.
                </p>
                <Button className="mt-5 rounded-full" onClick={startQuiz}>
                  Jogar novamente
                </Button>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/70 bg-card p-5">
                <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Pergunta {currentQuestion + 1}/{KIDS_QUIZ_QUESTIONS.length}
                  </span>
                  <span className="font-semibold text-primary">{quizScore} acertos</span>
                </div>
                <Progress value={((currentQuestion + 1) / KIDS_QUIZ_QUESTIONS.length) * 100} className="h-2" />

                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {KIDS_QUIZ_QUESTIONS[currentQuestion].question}
                </h3>

                <div className="mt-4 grid gap-2">
                  {KIDS_QUIZ_QUESTIONS[currentQuestion].options.map((option, index) => {
                    const isCorrect = index === KIDS_QUIZ_QUESTIONS[currentQuestion].correct;
                    const isSelected = selectedAnswer === index;

                    return (
                      <button
                        key={option}
                        onClick={() => handleQuizAnswer(index)}
                        disabled={selectedAnswer !== null}
                        className={`rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors ${
                          selectedAnswer === null
                            ? "border-border bg-card hover:border-primary/40"
                            : isCorrect
                            ? "border-primary bg-primary/10 text-foreground"
                            : isSelected
                            ? "border-destructive/50 bg-destructive/10"
                            : "border-border bg-card text-muted-foreground"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.section>
        )}

        {activeTab === "missions" && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Target className="h-5 w-5 text-primary" /> Missões da semana ({CURRENT_WEEK})
            </h3>
            <p className="text-sm text-muted-foreground">Cada missão concluída concede XP automaticamente.</p>

            {KIDS_WEEKLY_MISSIONS.map((mission) => {
              const isDone = completedMissionsSet.has(mission.id);
              return (
                <div
                  key={mission.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4"
                >
                  <span className="text-2xl" aria-hidden>
                    {mission.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {mission.title}
                    </p>
                    <p className="text-xs text-primary">+{mission.xp} XP</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={isDone ? "outline" : "default"}
                    className="rounded-full"
                    onClick={() => handleCompleteMission(mission.id)}
                    disabled={isDone}
                  >
                    {isDone ? "✅ Feita" : "Concluir"}
                  </Button>
                </div>
              );
            })}
          </motion.section>
        )}

        {activeTab === "memory" && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Gamepad2 className="h-5 w-5 text-primary" /> Jogo da Memória Bíblica
              </h3>
              <Button size="sm" variant="outline" className="rounded-full" onClick={initMemoryGame}>
                Reiniciar
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Combine os símbolos iguais. Ao completar, você recebe XP.
            </p>

            {memoryCompleted && (
              <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
                🎉 Você concluiu em <strong>{memoryMoves}</strong> jogadas.
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {memoryCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleMemoryClick(card.id)}
                  className={`aspect-square rounded-xl border text-2xl transition-colors ${
                    card.flipped || card.matched
                      ? card.matched
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-muted/40"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  {card.flipped || card.matched ? card.symbol : "❓"}
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {activeTab === "tracks" && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <GraduationCap className="h-5 w-5 text-primary" /> Trilhas por faixa etária
            </h3>

            <div className="grid gap-3 sm:grid-cols-3">
              {KIDS_TRACKS.map((track) => (
                <div key={track.id} className="rounded-2xl border border-border/70 bg-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">{track.title}</h4>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
                      {track.ageGroup}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{track.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {track.focus.map((item) => (
                      <span key={item} className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                <Star className="h-4 w-4 text-primary" /> Versículos para memorizar
              </h4>

              <div className="space-y-3">
                {KIDS_MEMORY_VERSES.map((verse) => {
                  const done = memorizedVersesSet.has(verse.id);
                  return (
                    <div key={verse.id} className="rounded-xl border border-border/70 bg-muted/20 p-3">
                      <p className="text-sm text-foreground">{verse.text}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-primary">{verse.reference}</span>
                        <Button
                          size="sm"
                          variant={done ? "outline" : "default"}
                          className="rounded-full"
                          onClick={() => handleMemorizeVerse(verse.id)}
                          disabled={done}
                        >
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

      <KidsStoryReaderDialog
        open={isStoryReaderOpen}
        onOpenChange={setIsStoryReaderOpen}
        story={selectedStory}
        isCompleted={selectedStory ? completedStoriesSet.has(selectedStory.id) : false}
        onComplete={handleCompleteStory}
      />
    </div>
  );
};

export default EspacoKids;
