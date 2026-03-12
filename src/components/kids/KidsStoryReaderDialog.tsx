import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { KidsStory } from "@/data/kidsTeenContent";

interface KidsStoryReaderDialogProps {
  open: boolean;
  story: KidsStory | null;
  isCompleted: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (storyId: string) => Promise<void>;
}

export function KidsStoryReaderDialog({
  open,
  story,
  isCompleted,
  onOpenChange,
  onComplete,
}: KidsStoryReaderDialogProps) {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && story) {
      setChapterIndex(0);
      setVisited(new Set([0]));
      setIsSaving(false);
    }
  }, [open, story?.id]);

  if (!story) return null;

  const totalChapters = story.chapters.length;
  const chapter = story.chapters[chapterIndex];
  const progressPercent = ((chapterIndex + 1) / totalChapters) * 100;
  const hasVisitedAll = useMemo(() => visited.size === totalChapters, [visited.size, totalChapters]);

  const goToChapter = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= totalChapters) return;
    setChapterIndex(nextIndex);
    setVisited((prev) => {
      const next = new Set(prev);
      next.add(nextIndex);
      return next;
    });
  };

  const handleComplete = async () => {
    if (!story || isCompleted || !hasVisitedAll || chapterIndex !== totalChapters - 1) return;
    setIsSaving(true);
    await onComplete(story.id);
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-border/70 bg-card p-0 overflow-hidden">
        <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <BookOpen className="h-5 w-5 text-primary" />
              {story.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {story.reference} · Capítulo {chapterIndex + 1} de {totalChapters}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progresso da leitura</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        <div className="space-y-4 p-5">
          <motion.div
            key={chapter.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border/70 bg-muted/30 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{chapter.title}</h3>
              <span className="text-3xl" aria-hidden>
                {chapter.illustration}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {chapter.text}
            </p>

            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-medium text-primary">Para pensar</p>
              <p className="mt-1 text-sm text-foreground">{chapter.reflection}</p>
            </div>
          </motion.div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => goToChapter(chapterIndex - 1)}
              disabled={chapterIndex === 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>

            {chapterIndex < totalChapters - 1 ? (
              <Button type="button" className="rounded-full" onClick={() => goToChapter(chapterIndex + 1)}>
                Próximo
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-full"
                onClick={handleComplete}
                disabled={isCompleted || !hasVisitedAll || isSaving}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                {isCompleted ? "História concluída" : isSaving ? "Salvando..." : "Concluir leitura"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
