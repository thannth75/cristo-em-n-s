import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

interface QuizEditDialogProps {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    book: string | null;
    difficulty: string;
    points_reward: number;
    is_active: boolean;
  };
  onUpdated: () => void;
}

export default function QuizEditDialog({ quiz, onUpdated }: QuizEditDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    title: quiz.title,
    description: quiz.description || "",
    book: quiz.book || "",
    difficulty: quiz.difficulty || "facil",
    points_reward: quiz.points_reward,
    is_active: quiz.is_active,
  });

  useEffect(() => {
    if (open) {
      setForm({
        title: quiz.title,
        description: quiz.description || "",
        book: quiz.book || "",
        difficulty: quiz.difficulty || "facil",
        points_reward: quiz.points_reward,
        is_active: quiz.is_active,
      });
    }
  }, [open, quiz]);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("bible_quizzes")
        .update({
          title: form.title.trim(),
          description: form.description.trim() || null,
          book: form.book.trim() || null,
          difficulty: form.difficulty,
          points_reward: form.points_reward,
          is_active: form.is_active,
        })
        .eq("id", quiz.id);

      if (error) throw error;

      toast({ title: "Quiz atualizado ✅" });
      setOpen(false);
      onUpdated();
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e?.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Editar Quiz</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Livro/Tema</Label>
              <Input
                value={form.book}
                onChange={(e) => setForm((s) => ({ ...s, book: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label>Dificuldade</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v) =>
                  setForm((s) => ({
                    ...s,
                    difficulty: v,
                    points_reward: v === "facil" ? 10 : v === "medio" ? 20 : 30,
                  }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facil">Fácil</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="dificil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Quiz ativo</Label>
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => setForm((s) => ({ ...s, is_active: v }))}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-xl"
              onClick={handleSave}
              disabled={!form.title.trim() || isSaving}
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
