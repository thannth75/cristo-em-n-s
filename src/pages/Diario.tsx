import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Plus, Trash2, Smile, BookOpen } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  bible_verse: string | null;
  created_at: string;
}

const moodEmojis: Record<string, string> = {
  grato: "🙏",
  alegre: "😊",
  reflexivo: "🤔",
  esperancoso: "✨",
  triste: "😢",
};

const Diario = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    mood: "grato",
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

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o diário.",
        variant: "destructive",
      });
    } else {
      setEntries(data || []);
    }
    setIsLoading(false);
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
      bible_verse: newEntry.bible_verse || null,
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
      setNewEntry({ title: "", content: "", mood: "grato", bible_verse: "" });
      fetchEntries();
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    const { error } = await supabase.from("journal_entries").delete().eq("id", entryId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a reflexão.",
        variant: "destructive",
      });
    } else {
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
            <DialogContent className="mx-4 max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif">Nova Reflexão</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
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
                  <Label>Como você está se sentindo?</Label>
                  <Select
                    value={newEntry.mood}
                    onValueChange={(value) => setNewEntry({ ...newEntry, mood: value })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grato">🙏 Grato</SelectItem>
                      <SelectItem value="alegre">😊 Alegre</SelectItem>
                      <SelectItem value="reflexivo">🤔 Reflexivo</SelectItem>
                      <SelectItem value="esperancoso">✨ Esperançoso</SelectItem>
                      <SelectItem value="triste">😢 Triste</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label>Versículo do dia (opcional)</Label>
                  <Input
                    value={newEntry.bible_verse}
                    onChange={(e) => setNewEntry({ ...newEntry, bible_verse: e.target.value })}
                    placeholder="Ex: João 3:16"
                    className="rounded-xl"
                  />
                </div>
                <Button onClick={handleCreateEntry} className="w-full rounded-xl">
                  Salvar Reflexão
                </Button>
              </div>
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
                    <span className="text-2xl">
                      {entry.mood ? moodEmojis[entry.mood] || "📝" : "📝"}
                    </span>
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
