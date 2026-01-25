import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plus, Trash2, Sparkles, BookOpen, Hand } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { MOOD_VERSES } from "@/data/bibleReadingPlans";

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  bible_verse: string | null;
  created_at: string;
}

interface MoodVerse {
  mood: string;
  verse: string;
  reference: string;
  encouragement: string;
  prayerSuggestion: string;
}

const moods = [
  { value: "grato", emoji: "🙏", label: "Grato" },
  { value: "alegre", emoji: "😊", label: "Alegre" },
  { value: "esperancoso", emoji: "✨", label: "Esperançoso" },
  { value: "triste", emoji: "😢", label: "Triste" },
  { value: "ansioso", emoji: "😰", label: "Ansioso" },
  { value: "preocupado", emoji: "😟", label: "Preocupado" },
  { value: "medo", emoji: "😨", label: "Com medo" },
  { value: "desanimado", emoji: "😔", label: "Desanimado" },
  { value: "confuso", emoji: "🤔", label: "Confuso" },
];

const getMoodEmoji = (mood: string) => {
  return moods.find(m => m.value === mood)?.emoji || "📝";
};

const Diario = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodVerse, setMoodVerse] = useState<MoodVerse | null>(null);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    mood: "",
    bible_verse: "",
  });

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
      fetchEntries();
    }
  }, [isApproved, user]);

  const fetchEntries = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setEntries(data || []);
    }
    setIsLoading(false);
  };

  const handleSelectMood = (mood: string) => {
    setSelectedMood(mood);
    setNewEntry({ ...newEntry, mood });
    
    // Get random verse for this mood
    const versesForMood = MOOD_VERSES.filter(v => v.mood === mood);
    if (versesForMood.length > 0) {
      const randomVerse = versesForMood[Math.floor(Math.random() * versesForMood.length)];
      setMoodVerse(randomVerse);
    }
    setShowMoodSelector(false);
  };

  const handleCreateEntry = async () => {
    if (!newEntry.content) {
      toast({
        title: "Escreva algo",
        description: "O conteúdo da reflexão é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("journal_entries").insert({
      ...newEntry,
      user_id: user?.id,
      bible_verse: newEntry.bible_verse || moodVerse?.reference || null,
      title: newEntry.title || null,
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a reflexão.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reflexão salva! ✍️",
        description: "Continue firme na sua jornada espiritual.",
      });
      setIsDialogOpen(false);
      setNewEntry({ title: "", content: "", mood: "", bible_verse: "" });
      setSelectedMood(null);
      setMoodVerse(null);
      fetchEntries();
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    const { error } = await supabase.from("journal_entries").delete().eq("id", entryId);

    if (!error) {
      toast({ title: "Reflexão excluída" });
      fetchEntries();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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
          className="mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-foreground">
                Diário Espiritual
              </h1>
              <p className="text-sm text-muted-foreground">
                Suas reflexões e orações
              </p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-xl shadow-lg">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif">Nova Reflexão</DialogTitle>
              </DialogHeader>
              
              <AnimatePresence mode="wait">
                {!selectedMood ? (
                  <motion.div
                    key="mood-selector"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="text-center py-4">
                      <Sparkles className="mx-auto h-10 w-10 text-primary mb-3" />
                      <h3 className="font-semibold text-foreground">Como você está se sentindo?</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Vou te dar um versículo especial
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {moods.map((mood) => (
                        <motion.button
                          key={mood.value}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSelectMood(mood.value)}
                          className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted hover:bg-primary/10 transition-colors"
                        >
                          <span className="text-2xl">{mood.emoji}</span>
                          <span className="text-xs text-muted-foreground">{mood.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="entry-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Selected mood & verse */}
                    <div className="rounded-xl bg-primary/10 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">{getMoodEmoji(selectedMood)}</span>
                        <span className="font-medium text-foreground">
                          {moods.find(m => m.value === selectedMood)?.label}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedMood(null);
                            setMoodVerse(null);
                          }}
                          className="ml-auto text-xs text-primary hover:underline"
                        >
                          Trocar
                        </button>
                      </div>
                      
                      {moodVerse && (
                        <div className="space-y-3">
                          <div className="rounded-lg bg-card p-3">
                            <p className="font-serif italic text-foreground">"{moodVerse.verse}"</p>
                            <p className="mt-1 text-sm font-medium text-primary">— {moodVerse.reference}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p className="flex items-start gap-2">
                              <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              {moodVerse.encouragement}
                            </p>
                          </div>
                          <div className="rounded-lg bg-card p-3 border-l-4 border-primary">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              <Hand className="inline h-3 w-3 mr-1" />
                              Sugestão de oração:
                            </p>
                            <p className="text-sm italic text-foreground">{moodVerse.prayerSuggestion}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Título (opcional)</Label>
                      <Input
                        value={newEntry.title}
                        onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                        placeholder="Título da reflexão"
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <Label>Sua reflexão</Label>
                      <Textarea
                        value={newEntry.content}
                        onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                        placeholder="Escreva seus pensamentos, orações ou gratidão..."
                        className="rounded-xl min-h-[120px]"
                      />
                    </div>
                    <div>
                      <Label>Versículo adicional (opcional)</Label>
                      <Input
                        value={newEntry.bible_verse}
                        onChange={(e) => setNewEntry({ ...newEntry, bible_verse: e.target.value })}
                        placeholder={moodVerse?.reference || "Ex: João 3:16"}
                        className="rounded-xl"
                      />
                    </div>
                    <Button onClick={handleCreateEntry} className="w-full rounded-xl">
                      Salvar Reflexão
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-2xl gradient-hope p-5 text-primary-foreground"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Sua jornada</p>
              <h3 className="font-serif text-xl font-semibold">
                {entries.length} reflexão{entries.length !== 1 && "ões"}
              </h3>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20">
              <BookOpen className="h-7 w-7" />
            </div>
          </div>
        </motion.div>

        {/* Lista de Entradas */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl bg-card p-8 text-center shadow-md"
            >
              <Heart className="mx-auto mb-3 h-12 w-12 text-primary/50" />
              <p className="text-muted-foreground">Nenhuma reflexão ainda.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Clique no + para escrever sua primeira reflexão.
              </p>
            </motion.div>
          ) : (
            entries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="rounded-2xl bg-card p-4 shadow-md"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getMoodEmoji(entry.mood || "")}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {entry.title || "Reflexão"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entry.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {entry.content}
                </p>
                {entry.bible_verse && (
                  <p className="mt-2 text-xs font-medium text-primary">
                    📖 {entry.bible_verse}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Diario;
