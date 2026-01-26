import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Heart, RefreshCw, BookOpen, Share2, Copy, Check, Hand } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { MOOD_VERSES } from "@/data/bibleReadingPlans";
import { useEffect } from "react";

const moods = [
  { value: "grato", emoji: "🙏", label: "Grato", color: "bg-amber-100 border-amber-300 text-amber-700" },
  { value: "alegre", emoji: "😊", label: "Alegre", color: "bg-yellow-100 border-yellow-300 text-yellow-700" },
  { value: "esperancoso", emoji: "✨", label: "Esperançoso", color: "bg-emerald-100 border-emerald-300 text-emerald-700" },
  { value: "triste", emoji: "😢", label: "Triste", color: "bg-blue-100 border-blue-300 text-blue-700" },
  { value: "ansioso", emoji: "😰", label: "Ansioso", color: "bg-purple-100 border-purple-300 text-purple-700" },
  { value: "preocupado", emoji: "😟", label: "Preocupado", color: "bg-orange-100 border-orange-300 text-orange-700" },
  { value: "medo", emoji: "😨", label: "Com Medo", color: "bg-red-100 border-red-300 text-red-700" },
  { value: "desanimado", emoji: "😔", label: "Desanimado", color: "bg-slate-100 border-slate-300 text-slate-700" },
  { value: "confuso", emoji: "🤔", label: "Confuso", color: "bg-indigo-100 border-indigo-300 text-indigo-700" },
];

interface MoodVerse {
  mood: string;
  verse: string;
  reference: string;
  encouragement: string;
  prayerSuggestion: string;
}

const Versiculos = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [currentVerse, setCurrentVerse] = useState<MoodVerse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isApproved) {
        navigate("/pending");
      }
    }
  }, [user, isApproved, authLoading, navigate]);

  const handleSelectMood = (mood: string) => {
    setSelectedMood(mood);
    getRandomVerse(mood);
  };

  const getRandomVerse = (mood: string) => {
    const versesForMood = MOOD_VERSES.filter(v => v.mood === mood);
    if (versesForMood.length > 0) {
      const randomIndex = Math.floor(Math.random() * versesForMood.length);
      setCurrentVerse(versesForMood[randomIndex]);
    }
  };

  const handleNewVerse = () => {
    if (selectedMood) {
      getRandomVerse(selectedMood);
    }
  };

  const handleCopy = async () => {
    if (currentVerse) {
      const text = `"${currentVerse.verse}"\n— ${currentVerse.reference}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copiado! 📋",
        description: "Versículo copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (currentVerse && navigator.share) {
      try {
        await navigator.share({
          title: "Versículo do Vida em Cristo",
          text: `"${currentVerse.verse}"\n— ${currentVerse.reference}\n\n${currentVerse.encouragement}`,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const handleBack = () => {
    setSelectedMood(null);
    setCurrentVerse(null);
  };

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";

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
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">
              Versículos por Humor
            </h1>
            <p className="text-sm text-muted-foreground">
              Receba uma palavra de Deus para seu momento
            </p>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!selectedMood ? (
            <motion.div
              key="mood-selector"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Intro Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl gradient-hope p-6 text-primary-foreground text-center"
              >
                <Heart className="mx-auto h-12 w-12 mb-3 opacity-90" />
                <h2 className="font-serif text-xl font-semibold mb-2">
                  Como você está se sentindo?
                </h2>
                <p className="text-sm opacity-80">
                  Deus tem uma palavra especial para cada momento da sua vida.
                </p>
              </motion.div>

              {/* Mood Grid */}
              <div className="grid grid-cols-3 gap-3">
                {moods.map((mood, index) => (
                  <motion.button
                    key={mood.value}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSelectMood(mood.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${mood.color} hover:shadow-md`}
                  >
                    <span className="text-3xl">{mood.emoji}</span>
                    <span className="text-xs font-medium">{mood.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Footer Quote */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="rounded-2xl bg-accent/50 p-5 text-center"
              >
                <p className="font-serif italic text-muted-foreground">
                  "A palavra de Deus é viva e eficaz."
                </p>
                <p className="mt-2 text-sm font-medium text-primary">— Hebreus 4:12</p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="verse-display"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Selected Mood Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between"
              >
                <button
                  onClick={handleBack}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${moods.find(m => m.value === selectedMood)?.color}`}
                >
                  <span className="text-xl">{moods.find(m => m.value === selectedMood)?.emoji}</span>
                  <span className="font-medium">{moods.find(m => m.value === selectedMood)?.label}</span>
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                  className="rounded-xl"
                >
                  Trocar humor
                </Button>
              </motion.div>

              {currentVerse && (
                <>
                  {/* Main Verse Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl bg-card p-6 shadow-lg border border-border"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span className="font-medium text-primary">{currentVerse.reference}</span>
                    </div>
                    <p className="font-serif text-xl leading-relaxed text-foreground mb-6">
                      "{currentVerse.verse}"
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNewVerse}
                        className="flex-1 rounded-xl gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Novo versículo
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopy}
                        className="rounded-xl"
                      >
                        {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleShare}
                        className="rounded-xl"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>

                  {/* Encouragement Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl bg-primary/10 p-5"
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Palavra de encorajamento</h3>
                        <p className="text-muted-foreground">{currentVerse.encouragement}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Prayer Suggestion Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl bg-card p-5 shadow-md border-l-4 border-primary"
                  >
                    <div className="flex items-start gap-3">
                      <Hand className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Sugestão de oração</h3>
                        <p className="font-serif italic text-muted-foreground">
                          "{currentVerse.prayerSuggestion}"
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Motivation */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center py-4"
                  >
                    <p className="text-sm text-muted-foreground">
                      💚 Deus está com você neste momento
                    </p>
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Versiculos;
