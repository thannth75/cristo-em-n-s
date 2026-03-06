import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX,
  BookOpen, PenLine, Clock, Heart, Sparkles, Timer,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useXpAward } from "@/hooks/useXpAward";
import { LevelUpCelebration } from "@/components/gamification/LevelUpCelebration";

const TIMER_PRESETS = [
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "30 min", seconds: 1800 },
];

const AMBIENT_SOUNDS = [
  { id: "none", label: "Silêncio", icon: VolumeX },
  { id: "rain", label: "Chuva", icon: Volume2 },
  { id: "nature", label: "Natureza", icon: Volume2 },
  { id: "piano", label: "Piano", icon: Volume2 },
];

const PRAYER_THEMES = [
  { id: "gratidao", emoji: "🙏", label: "Gratidão", description: "Agradeça a Deus por tudo que Ele tem feito", suggestions: ["Agradeça por 3 bênçãos de hoje", "Louve a Deus por quem Ele é", "Agradeça por pessoas que ama"] },
  { id: "intercessao", emoji: "🤝", label: "Intercessão", description: "Ore por outras pessoas e necessidades", suggestions: ["Ore por sua família", "Ore por amigos que precisam de Deus", "Ore por sua igreja e líderes"] },
  { id: "confissao", emoji: "💧", label: "Confissão", description: "Confesse e peça perdão ao Senhor", suggestions: ["Peça perdão por pecados conhecidos", "Peça ao Espírito Santo que revele áreas", "Entregue suas fraquezas a Deus"] },
  { id: "adoracao", emoji: "👑", label: "Adoração", description: "Adore a Deus por Sua grandeza", suggestions: ["Medite nos atributos de Deus", "Cante um louvor em seu coração", "Declare a soberania de Deus"] },
  { id: "direcao", emoji: "🧭", label: "Direção", description: "Peça sabedoria e direção de Deus", suggestions: ["Peça sabedoria para decisões", "Entregue seus planos a Deus", "Peça que Deus abra portas"] },
  { id: "cura", emoji: "💚", label: "Cura", description: "Ore por cura física, emocional e espiritual", suggestions: ["Ore por cura interior", "Entregue suas dores a Deus", "Ore por pessoas enfermas"] },
  { id: "livre", emoji: "✨", label: "Livre", description: "Ore livremente como o Espírito guiar", suggestions: ["Fale com Deus como um amigo", "Ouça a voz de Deus em silêncio", "Deixe o Espírito Santo guiar"] },
];

// Play a gentle bell sound when timer completes
const playCompletionSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    // Three gentle bell tones
    playTone(523.25, audioCtx.currentTime, 1.5); // C5
    playTone(659.25, audioCtx.currentTime + 0.5, 1.5); // E5
    playTone(783.99, audioCtx.currentTime + 1.0, 2.0); // G5
  } catch (e) {
    console.log("Audio not available");
  }
};

const IMMERSIVE_VERSES = [
  { verse: "Aquietai-vos e sabei que eu sou Deus.", reference: "Salmos 46:10" },
  { verse: "Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.", reference: "Mateus 11:28" },
  { verse: "O Senhor é o meu pastor; nada me faltará.", reference: "Salmos 23:1" },
  { verse: "Lança sobre o Senhor o teu fardo, e ele te sustentará.", reference: "Salmos 55:22" },
  { verse: "Não andeis ansiosos por coisa alguma; em tudo, porém, sejam conhecidas as vossas petições.", reference: "Filipenses 4:6" },
  { verse: "Eu sou a videira, vós sois os ramos. Quem permanece em mim e eu nele, esse dá muito fruto.", reference: "João 15:5" },
  { verse: "Buscar-me-eis e me achareis quando me buscardes de todo o vosso coração.", reference: "Jeremias 29:13" },
  { verse: "Alegrai-vos sempre no Senhor; outra vez digo: alegrai-vos!", reference: "Filipenses 4:4" },
  { verse: "Porque para Deus nada é impossível.", reference: "Lucas 1:37" },
  { verse: "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações.", reference: "Filipenses 4:7" },
];

type Phase = "setup" | "prayer" | "journal" | "complete";

const MomentoComDeus = () => {
  const navigate = useNavigate();
  const { user, isApproved, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { awardXp, showLevelUp, levelUpData, closeLevelUp } = useXpAward(user?.id);

  const [phase, setPhase] = useState<Phase>("setup");
  const [selectedTime, setSelectedTime] = useState(600);
  const [timeRemaining, setTimeRemaining] = useState(600);
  const [isRunning, setIsRunning] = useState(false);
  const [ambientSound, setAmbientSound] = useState("none");
  const [isMuted, setIsMuted] = useState(false);
  const [privateNote, setPrivateNote] = useState("");
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState(PRAYER_THEMES[6]); // "Livre" by default
  const [verse] = useState(() => IMMERSIVE_VERSES[Math.floor(Math.random() * IMMERSIVE_VERSES.length)]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    else if (!authLoading && !isApproved) navigate("/pending");
  }, [user, isApproved, authLoading, navigate]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Auto-advance when timer finishes
  useEffect(() => {
    if (phase === "prayer" && timeRemaining === 0 && !isRunning) {
      const elapsed = selectedTime;
      setTotalTimeSpent(elapsed);
      setTimeout(() => setPhase("journal"), 1500);
    }
  }, [timeRemaining, isRunning, phase, selectedTime]);

  const startPrayer = () => {
    setTimeRemaining(selectedTime);
    setPhase("prayer");
    setIsRunning(true);
    startTimeRef.current = Date.now();
  };

  const toggleTimer = () => setIsRunning((prev) => !prev);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeRemaining(selectedTime);
  };

  const skipToJournal = () => {
    setIsRunning(false);
    const elapsed = selectedTime - timeRemaining;
    setTotalTimeSpent(elapsed);
    setPhase("journal");
  };

  const finishSession = async () => {
    // Save journal entry if there's content
    if (privateNote.trim() && user) {
      await supabase.from("journal_entries").insert({
        user_id: user.id,
        title: "Momento com Deus",
        content: privateNote,
        mood: "paz",
        bible_verse: `${verse.verse} — ${verse.reference}`,
      });
    }

    // Award XP
    if (user) {
      await awardXp("oracao", undefined, `Momento com Deus (${Math.round(totalTimeSpent / 60)} min)`);
    }

    setPhase("complete");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercent = ((selectedTime - timeRemaining) / selectedTime) * 100;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      {/* Close button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => navigate(-1)}
        className="fixed top-4 right-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
        style={{ top: "max(1rem, env(safe-area-inset-top, 16px))" }}
      >
        <X className="h-5 w-5" />
      </motion.button>

      <AnimatePresence mode="wait">
        {/* ===== SETUP PHASE ===== */}
        {phase === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 py-12"
          >
            {/* Verse */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-10 text-center max-w-sm"
            >
              <Sparkles className="mx-auto mb-4 h-8 w-8 text-primary/60" />
              <h1 className="font-serif text-2xl font-bold text-foreground mb-2">
                Momento com Deus
              </h1>
              <p className="text-sm text-muted-foreground">
                Separe um tempo para estar na presença do Senhor
              </p>
            </motion.div>

            {/* Verse Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8 rounded-2xl bg-primary/5 border border-primary/10 p-6 max-w-sm w-full text-center"
            >
              <BookOpen className="mx-auto mb-3 h-5 w-5 text-primary/60" />
              <p className="font-serif text-base italic text-foreground leading-relaxed mb-2">
                "{verse.verse}"
              </p>
              <p className="text-xs font-medium text-primary">{verse.reference}</p>
            </motion.div>

            {/* Timer Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-8 w-full max-w-sm"
            >
              <p className="text-sm font-medium text-muted-foreground text-center mb-3">
                <Timer className="inline h-4 w-4 mr-1" />
                Quanto tempo deseja orar?
              </p>
              <div className="grid grid-cols-4 gap-2">
                {TIMER_PRESETS.map((preset) => (
                  <button
                    key={preset.seconds}
                    onClick={() => {
                      setSelectedTime(preset.seconds);
                      setTimeRemaining(preset.seconds);
                    }}
                    className={`rounded-xl py-3 text-sm font-medium transition-all ${
                      selectedTime === preset.seconds
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Start Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={startPrayer}
                size="lg"
                className="rounded-2xl px-10 py-6 text-lg font-semibold shadow-lg"
              >
                <Heart className="mr-2 h-5 w-5" />
                Começar
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* ===== PRAYER PHASE ===== */}
        {phase === "prayer" && (
          <motion.div
            key="prayer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 relative"
          >
            {/* Breathing glow */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.15, 0.3, 0.15],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 m-auto h-72 w-72 rounded-full bg-primary/20 blur-3xl"
            />

            {/* Verse */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative mb-10 text-center max-w-xs"
            >
              <p className="font-serif text-lg italic text-foreground/80 leading-relaxed">
                "{verse.verse}"
              </p>
              <p className="mt-2 text-xs text-primary/70">{verse.reference}</p>
            </motion.div>

            {/* Timer Circle */}
            <div className="relative mb-10">
              <svg width="200" height="200" className="transform -rotate-90">
                <circle
                  cx="100" cy="100" r="90"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="100" cy="100" r="90"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 90}
                  strokeDashoffset={2 * Math.PI * 90 * (1 - progressPercent / 100)}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-light tabular-nums text-foreground">
                  {formatTime(timeRemaining)}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {isRunning ? "Orando..." : "Pausado"}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={resetTimer}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted transition-colors"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <button
                onClick={toggleTimer}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
              </button>
              <button
                onClick={skipToJournal}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted transition-colors"
              >
                <PenLine className="h-5 w-5" />
              </button>
            </div>

            {/* Skip label */}
            <p className="mt-3 text-xs text-muted-foreground">
              Toque no lápis para anotar sua oração
            </p>
          </motion.div>
        )}

        {/* ===== JOURNAL PHASE ===== */}
        {phase === "journal" && (
          <motion.div
            key="journal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 py-12"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm"
            >
              <div className="text-center mb-6">
                <PenLine className="mx-auto mb-3 h-8 w-8 text-primary/60" />
                <h2 className="font-serif text-xl font-semibold text-foreground mb-1">
                  Registre sua Oração
                </h2>
                <p className="text-sm text-muted-foreground">
                  O que Deus falou ao seu coração? (opcional)
                </p>
              </div>

              {/* Time spent */}
              <div className="flex items-center justify-center gap-2 mb-6 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Tempo com Deus: {Math.max(1, Math.round(totalTimeSpent / 60))} min</span>
              </div>

              <Textarea
                value={privateNote}
                onChange={(e) => setPrivateNote(e.target.value)}
                placeholder="Escreva aqui sua oração, reflexão ou gratidão..."
                className="min-h-[160px] rounded-xl border-primary/10 bg-muted/30 resize-none focus:ring-primary/20"
              />

              <div className="mt-6 space-y-3">
                <Button onClick={finishSession} className="w-full rounded-xl" size="lg">
                  <Heart className="mr-2 h-4 w-4" />
                  Finalizar Momento
                </Button>
                <Button
                  variant="ghost"
                  onClick={finishSession}
                  className="w-full text-muted-foreground"
                >
                  Pular anotação
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ===== COMPLETE PHASE ===== */}
        {phase === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex min-h-screen flex-col items-center justify-center px-6"
          >
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10"
            >
              <Sparkles className="h-12 w-12 text-primary" />
            </motion.div>

            <h2 className="font-serif text-2xl font-bold text-foreground mb-2 text-center">
              Que Deus te abençoe! 🙏
            </h2>
            <p className="text-muted-foreground text-center mb-2 max-w-xs">
              Você investiu {Math.max(1, Math.round(totalTimeSpent / 60))} minutos na presença de Deus.
            </p>
            <p className="text-xs text-primary mb-8">+10 XP ganhos</p>

            <div className="space-y-3 w-full max-w-xs">
              <Button onClick={() => navigate("/dashboard")} className="w-full rounded-xl" size="lg">
                Voltar ao Início
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPhase("setup");
                  setPrivateNote("");
                  setTimeRemaining(selectedTime);
                }}
                className="w-full rounded-xl"
              >
                Novo Momento
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LevelUpCelebration
        open={showLevelUp}
        onClose={closeLevelUp}
        newLevel={levelUpData?.newLevel || 1}
        levelTitle={levelUpData?.levelTitle || ""}
        levelIcon={levelUpData?.levelIcon || "⭐"}
        rewards={levelUpData?.rewards}
      />
    </div>
  );
};

export default MomentoComDeus;
