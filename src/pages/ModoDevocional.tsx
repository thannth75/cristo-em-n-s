import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, Heart, Radio, PenLine, Moon, Sun, Timer, Volume2, VolumeX, Play, Pause, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const DEVOTIONAL_VERSES = [
  { text: "Aquietai-vos e sabei que eu sou Deus; serei exaltado entre as nações.", ref: "Salmos 46:10" },
  { text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", ref: "Mateus 11:28" },
  { text: "O Senhor é o meu pastor; nada me faltará.", ref: "Salmos 23:1" },
  { text: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.", ref: "Provérbios 3:5" },
  { text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus.", ref: "Isaías 41:10" },
  { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
  { text: "Buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas.", ref: "Mateus 6:33" },
  { text: "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.", ref: "Salmos 119:105" },
  { text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.", ref: "João 3:16" },
  { text: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", ref: "Salmos 37:5" },
];

const TIMER_OPTIONS = [5, 10, 15, 20, 30];

const ModoDevocional = () => {
  const navigate = useNavigate();
  const { user, isApproved, isLoading } = useAuth();
  const [verseIndex, setVerseIndex] = useState(() => Math.floor(Math.random() * DEVOTIONAL_VERSES.length));
  const [timerActive, setTimerActive] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [ambientPlaying, setAmbientPlaying] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) navigate("/auth");
      else if (!isApproved) navigate("/pending");
    }
  }, [user, isApproved, isLoading, navigate]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive) return;
    if (timerSeconds <= 0 && timerMinutes <= 0) {
      setTimerActive(false);
      return;
    }
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 0) {
          setTimerMinutes(m => m - 1);
          return 59;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds, timerMinutes]);

  const startTimer = (mins: number) => {
    setTimerMinutes(mins);
    setTimerSeconds(0);
    setTimerActive(true);
    setShowTimer(false);
  };

  const totalTimerSeconds = timerMinutes * 60 + timerSeconds;
  const nextVerse = () => setVerseIndex(i => (i + 1) % DEVOTIONAL_VERSES.length);
  const verse = DEVOTIONAL_VERSES[verseIndex];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const features = [
    { title: "Leitura Bíblica", description: "Leia a Palavra com calma e atenção", icon: BookOpen, href: "/biblia", color: "from-emerald-500/20 to-emerald-600/10" },
    { title: "Devocional do Dia", description: "Reflexão e oração guiada", icon: Sun, href: "/devocional", color: "from-amber-500/20 to-amber-600/10" },
    { title: "Pedidos de Oração", description: "Ore e interceda pelos irmãos", icon: Heart, href: "/oracoes", color: "from-rose-500/20 to-rose-600/10" },
    { title: "Rádio de Louvores", description: "Adoração e louvor ao Senhor", icon: Radio, href: "/radio", color: "from-blue-500/20 to-blue-600/10" },
    { title: "Diário Espiritual", description: "Anote suas reflexões", icon: PenLine, href: "/diario", color: "from-purple-500/20 to-purple-600/10" },
    { title: "Momento com Deus", description: "Oração imersiva guiada", icon: Moon, href: "/momento-com-deus", color: "from-indigo-500/20 to-indigo-600/10" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header suave */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 px-4 py-3" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 12px))" }}>
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="h-9 w-9 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-serif font-semibold text-foreground">Modo Devocional</h1>
            <p className="text-xs text-muted-foreground">Silêncio espiritual · Foco em Deus</p>
          </div>
          <div className="flex items-center gap-1">
            {timerActive && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-mono font-semibold text-primary"
              >
                {String(timerMinutes).padStart(2, "0")}:{String(timerSeconds).padStart(2, "0")}
              </motion.div>
            )}
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setShowTimer(!showTimer)}>
              <Timer className="h-4 w-4 text-primary" />
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Timer selector */}
        <AnimatePresence>
          {showTimer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Timer de Oração</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TIMER_OPTIONS.map(min => (
                    <Button key={min} variant={timerActive && timerMinutes === min ? "default" : "outline"} size="sm"
                      className="rounded-full" onClick={() => startTimer(min)}>
                      {min} min
                    </Button>
                  ))}
                </div>
                {timerActive && (
                  <div className="space-y-2">
                    <Progress value={100 - (totalTimerSeconds / (TIMER_OPTIONS.find(m => m >= timerMinutes + 1) || timerMinutes) / 60 * 100)} className="h-1.5" />
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setTimerActive(false); setTimerMinutes(0); setTimerSeconds(0); }}>
                      Parar timer
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mensagem de acolhimento */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-6">
          <motion.div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Moon className="h-8 w-8 text-primary" />
          </motion.div>
          <h2 className="font-serif text-xl font-semibold text-foreground mb-2">Tempo com Deus</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Este é um ambiente focado na sua comunhão com o Senhor. Sem distrações, sem notificações sociais. 
            Apenas você e Deus.
          </p>
        </motion.div>

        {/* Versículo de meditação com rotação */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-2xl bg-gradient-to-br from-primary/8 to-accent/5 border border-primary/10 p-5"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={verseIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              <p className="text-sm text-foreground italic leading-relaxed">
                "{verse.text}"
              </p>
              <p className="text-xs text-primary font-medium mt-2">— {verse.ref}</p>
            </motion.div>
          </AnimatePresence>
          <button onClick={nextVerse} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted/50 transition-colors">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </motion.div>

        {/* Atalhos devocionais */}
        <div className="grid gap-3">
          {features.map((feat, i) => (
            <motion.button
              key={feat.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => navigate(feat.href)}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-4 text-left hover:border-primary/20 hover:shadow-sm transition-all"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feat.color} shrink-0`}>
                <feat.icon className="h-5 w-5 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-foreground">{feat.title}</p>
                <p className="text-xs text-muted-foreground">{feat.description}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Incentivo Bíblia física */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-center">
          <p className="text-sm text-foreground">📖 Separe um momento para ler sua Bíblia física.</p>
          <p className="text-xs text-muted-foreground mt-1">O app é ferramenta de apoio, não substitui a Palavra impressa.</p>
        </motion.div>
      </main>
    </div>
  );
};

export default ModoDevocional;
