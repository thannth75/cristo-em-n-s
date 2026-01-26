import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Clock, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import StudyDetailDialog from "@/components/estudos/StudyDetailDialog";
import { bibleStudySchema, validateInput } from "@/lib/validation";
import { AdFeed } from "@/components/ads/AdBanner";

interface BibleStudy {
  id: string;
  title: string;
  description: string | null;
  book: string;
  chapters: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

interface StudyProgress {
  study_id: string;
  chapters_completed: string[];
}

const Estudos = () => {
  const navigate = useNavigate();
  const { user, profile, isApproved, isAdmin, isLeader, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [studies, setStudies] = useState<BibleStudy[]>([]);
  const [progress, setProgress] = useState<StudyProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<BibleStudy | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newStudy, setNewStudy] = useState({
    title: "",
    description: "",
    book: "",
    chapters: "",
    end_date: "",
  });

  const canManage = isAdmin || isLeader;

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
      fetchData();
    }
  }, [isApproved, user]);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [studiesRes, progressRes] = await Promise.all([
      supabase
        .from("bible_studies")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("study_progress")
        .select("study_id, chapters_completed")
        .eq("user_id", user?.id),
    ]);

    setStudies(studiesRes.data || []);
    setProgress(progressRes.data || []);
    setIsLoading(false);
  };

  const handleCreateStudy = async () => {
    const validation = validateInput(bibleStudySchema, newStudy);
    
    if (!validation.success) {
      toast({
        title: "Erro de validação",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const validatedData = validation.data;
    const { error } = await supabase.from("bible_studies").insert({
      title: validatedData.title,
      description: validatedData.description || null,
      book: validatedData.book,
      chapters: validatedData.chapters || null,
      end_date: validatedData.end_date || null,
      start_date: new Date().toISOString().split("T")[0],
      created_by: user?.id,
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o estudo.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Estudo criado! 📖",
        description: "O estudo foi adicionado.",
      });
      setIsDialogOpen(false);
      setNewStudy({ title: "", description: "", book: "", chapters: "", end_date: "" });
      fetchData();
    }
  };

  const getStudyProgress = (studyId: string, chapters: string | null) => {
    const userProgress = progress.find((p) => p.study_id === studyId);
    const completed = userProgress?.chapters_completed?.length || 0;
    
    // Parse chapters string like "1-21" or "1,3,5,7"
    let total = 1;
    if (chapters) {
      if (chapters.includes("-")) {
        const [start, end] = chapters.split("-").map(Number);
        total = end - start + 1;
      } else if (chapters.includes(",")) {
        total = chapters.split(",").length;
      } else {
        total = parseInt(chapters) || 1;
      }
    }

    return { completed, total, percent: Math.round((completed / total) * 100) };
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Sem prazo";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const userName = profile?.full_name?.split(" ")[0] || "Jovem";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const activeStudy = studies[0];
  const activeProgress = activeStudy ? getStudyProgress(activeStudy.id, activeStudy.chapters) : null;

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-24">
      <AppHeader userName={userName} />

      <main className="px-3 sm:px-4 py-4 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 flex items-center justify-between"
        >
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
              Estudos Bíblicos
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Seu progresso na Palavra
            </p>
          </div>

          {canManage && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" className="rounded-xl shadow-lg">
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-serif">Novo Estudo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={newStudy.title}
                      onChange={(e) => setNewStudy({ ...newStudy, title: e.target.value })}
                      placeholder="Ex: Estudo de João"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Livro da Bíblia</Label>
                    <Input
                      value={newStudy.book}
                      onChange={(e) => setNewStudy({ ...newStudy, book: e.target.value })}
                      placeholder="Ex: Evangelho de João"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Capítulos (ex: 1-21 ou 1,3,5)</Label>
                    <Input
                      value={newStudy.chapters}
                      onChange={(e) => setNewStudy({ ...newStudy, chapters: e.target.value })}
                      placeholder="1-21"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Data limite (opcional)</Label>
                    <Input
                      type="date"
                      value={newStudy.end_date}
                      onChange={(e) => setNewStudy({ ...newStudy, end_date: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label>Descrição (opcional)</Label>
                    <Textarea
                      value={newStudy.description}
                      onChange={(e) => setNewStudy({ ...newStudy, description: e.target.value })}
                      placeholder="Orientações sobre o estudo"
                      className="rounded-xl"
                    />
                  </div>
                  <Button onClick={handleCreateStudy} className="w-full rounded-xl">
                    Criar Estudo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        {/* Card de Destaque */}
        {activeStudy && activeProgress && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 overflow-hidden rounded-2xl gradient-hope p-5 text-primary-foreground"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium opacity-90">Estudo Atual</p>
                <h3 className="font-serif text-xl font-semibold">{activeStudy.title}</h3>
                <p className="mt-1 text-sm opacity-80">{activeStudy.book}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-foreground/20">
                <BookOpen className="h-8 w-8" />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Progresso</span>
                <span>{activeProgress.completed}/{activeProgress.total} capítulos</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-primary-foreground/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${activeProgress.percent}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="h-full rounded-full bg-primary-foreground"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Lista de Estudos */}
        <div className="mb-6">
          <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
            Todos os Estudos
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : studies.length === 0 ? (
            <div className="rounded-2xl bg-card p-8 text-center shadow-md">
              <BookOpen className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum estudo ativo.</p>
              {canManage && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Clique no + para criar um estudo.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {studies.map((estudo, index) => {
                const studyProgress = getStudyProgress(estudo.id, estudo.chapters);
                   return (
                      <motion.button
                        key={estudo.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        onClick={() => {
                          setSelectedStudy(estudo);
                          setIsDetailOpen(true);
                        }}
                        className="w-full text-left rounded-2xl bg-card p-4 shadow-md hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{estudo.title}</h3>
                            <p className="text-sm text-muted-foreground">{estudo.book}</p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Até {formatDate(estudo.end_date)}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span>{studyProgress.completed} de {studyProgress.total} capítulos</span>
                            <span>{studyProgress.percent}%</span>
                          </div>
                          <Progress value={studyProgress.percent} className="h-2" />
                        </div>
                      </motion.button>
                    );
              })}
            </div>
          )}
        </div>

        {/* Anúncio integrado - estilo profissional */}
        <AdFeed />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl bg-accent/50 p-5 text-center"
        >
          <p className="font-serif italic text-muted-foreground">
            "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho."
          </p>
          <p className="mt-2 text-sm font-medium text-primary">— Salmos 119:105</p>
        </motion.div>
      </main>

      <StudyDetailDialog
        study={selectedStudy}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        userId={user?.id}
        onProgressUpdate={fetchData}
      />

      <BottomNavigation />
    </div>
  );
};

export default Estudos;
