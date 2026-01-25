import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BibleStudy {
  id: string;
  title: string;
  description: string | null;
  book: string;
  chapters: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface StudyProgress {
  id?: string;
  study_id: string;
  chapters_completed: string[];
  notes: string | null;
}

interface StudyDetailDialogProps {
  study: BibleStudy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | undefined;
  onProgressUpdate: () => void;
}

const StudyDetailDialog = ({
  study,
  open,
  onOpenChange,
  userId,
  onProgressUpdate,
}: StudyDetailDialogProps) => {
  const { toast } = useToast();
  const [progress, setProgress] = useState<StudyProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chapters, setChapters] = useState<string[]>([]);

  useEffect(() => {
    if (study && open && userId) {
      parseChapters();
      fetchProgress();
    }
  }, [study, open, userId]);

  const parseChapters = () => {
    if (!study?.chapters) {
      setChapters([]);
      return;
    }

    const chaptersStr = study.chapters;
    let result: string[] = [];

    if (chaptersStr.includes("-")) {
      const [start, end] = chaptersStr.split("-").map(Number);
      for (let i = start; i <= end; i++) {
        result.push(i.toString());
      }
    } else if (chaptersStr.includes(",")) {
      result = chaptersStr.split(",").map((c) => c.trim());
    } else {
      const num = parseInt(chaptersStr);
      if (!isNaN(num)) {
        for (let i = 1; i <= num; i++) {
          result.push(i.toString());
        }
      }
    }

    setChapters(result);
  };

  const fetchProgress = async () => {
    if (!study || !userId) return;

    const { data } = await supabase
      .from("study_progress")
      .select("*")
      .eq("study_id", study.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setProgress(data);
    } else {
      setProgress({
        study_id: study.id,
        chapters_completed: [],
        notes: null,
      });
    }
  };

  const toggleChapter = async (chapter: string) => {
    if (!study || !userId || !progress) return;

    setIsLoading(true);
    const completed = progress.chapters_completed || [];
    const isCompleted = completed.includes(chapter);
    
    const newCompleted = isCompleted
      ? completed.filter((c) => c !== chapter)
      : [...completed, chapter];

    if (progress.id) {
      // Update existing
      const { error } = await supabase
        .from("study_progress")
        .update({
          chapters_completed: newCompleted,
          completed_at: newCompleted.length === chapters.length ? new Date().toISOString() : null,
        })
        .eq("id", progress.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível salvar o progresso.",
          variant: "destructive",
        });
      } else {
        setProgress({ ...progress, chapters_completed: newCompleted });
        toast({
          title: isCompleted ? "Capítulo desmarcado" : "Capítulo lido! 📖",
          description: isCompleted 
            ? "Progresso atualizado" 
            : `${study.book} ${chapter} concluído!`,
        });
        onProgressUpdate();
      }
    } else {
      // Insert new
      const { data, error } = await supabase
        .from("study_progress")
        .insert({
          study_id: study.id,
          user_id: userId,
          chapters_completed: newCompleted,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível salvar o progresso.",
          variant: "destructive",
        });
      } else {
        setProgress(data);
        toast({
          title: "Capítulo lido! 📖",
          description: `${study.book} ${chapter} concluído!`,
        });
        onProgressUpdate();
      }
    }

    setIsLoading(false);
  };

  const completedCount = progress?.chapters_completed?.length || 0;
  const percent = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 max-w-md rounded-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {study?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Info */}
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="font-medium text-foreground">{study?.book}</p>
            {study?.description && (
              <p className="mt-1 text-sm text-muted-foreground">{study.description}</p>
            )}
          </div>

          {/* Progress */}
          <div className="rounded-xl bg-primary/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Seu progresso</span>
              <span className="text-sm font-bold text-primary">{percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-primary/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full bg-primary"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground text-center">
              {completedCount} de {chapters.length} capítulos
            </p>
          </div>

          {/* Chapters Grid */}
          <div>
            <h3 className="mb-3 font-medium text-foreground">Marque os capítulos lidos:</h3>
            <div className="grid grid-cols-5 gap-2">
              {chapters.map((chapter) => {
                const isCompleted = progress?.chapters_completed?.includes(chapter);
                return (
                  <motion.button
                    key={chapter}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleChapter(chapter)}
                    disabled={isLoading}
                    className={`relative flex h-12 w-12 items-center justify-center rounded-xl text-sm font-medium transition-all ${
                      isCompleted
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {isCompleted && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Check className="h-5 w-5" />
                      </motion.div>
                    )}
                    {!isCompleted && chapter}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Complete Message */}
          {percent === 100 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-primary/20 p-4 text-center"
            >
              <span className="text-2xl">🎉</span>
              <p className="mt-1 font-medium text-primary">Parabéns!</p>
              <p className="text-sm text-muted-foreground">Você completou este estudo!</p>
            </motion.div>
          )}
        </div>

        <div className="pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudyDetailDialog;
