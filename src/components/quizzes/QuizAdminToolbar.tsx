import { useMemo, useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type Difficulty = "facil" | "medio" | "dificil";

type QuestionDraft = {
  question: string;
  options: [string, string, string, string];
  correct_answer: 0 | 1 | 2 | 3;
  explanation: string;
  points: number;
};

interface QuizAdminToolbarProps {
  userId: string;
  canManage: boolean;
  onRefresh: () => void;
}

const createEmptyQuestion = (): QuestionDraft => ({
  question: "",
  options: ["", "", "", ""],
  correct_answer: 0,
  explanation: "",
  points: 2,
});

export default function QuizAdminToolbar({ userId, canManage, onRefresh }: QuizAdminToolbarProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    book: "",
    difficulty: "facil" as Difficulty,
    points_reward: 10,
    is_active: true,
  });

  const [questions, setQuestions] = useState<QuestionDraft[]>([...Array(5)].map(createEmptyQuestion));

  const canSubmit = useMemo(() => {
    if (!form.title.trim()) return false;
    if (questions.length === 0) return false;
    return questions.every((q) => {
      if (!q.question.trim()) return false;
      if (q.options.some((o) => !o.trim())) return false;
      return true;
    });
  }, [form.title, questions]);

  if (!canManage) return null;

  const reset = () => {
    setForm({
      title: "",
      description: "",
      book: "",
      difficulty: "facil",
      points_reward: 10,
      is_active: true,
    });
    setQuestions([...Array(5)].map(createEmptyQuestion));
  };

  const handleCreate = async () => {
    if (!canSubmit || isSaving) return;
    setIsSaving(true);
    try {
      const { data: quiz, error: quizError } = await supabase
        .from("bible_quizzes")
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          book: form.book.trim() || null,
          difficulty: form.difficulty,
          points_reward: form.points_reward,
          is_active: form.is_active,
          created_by: userId,
        })
        .select("id")
        .single();

      if (quizError) throw quizError;

      const payload = questions.map((q, idx) => ({
        quiz_id: quiz.id,
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        correct_answer: q.correct_answer,
        explanation: q.explanation.trim() || null,
        points: q.points,
        order_position: idx + 1,
      }));

      const { error: qError } = await supabase.from("quiz_questions").insert(payload);
      if (qError) throw qError;

      toast({ title: "Quiz criado! ✅", description: "O quiz já está disponível na lista." });
      setOpen(false);
      reset();
      onRefresh();
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Erro ao criar quiz",
        description: e?.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async (count: number) => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const runs = Array.from({ length: count });
      for (const _ of runs) {
        const { error } = await supabase.functions.invoke("generate-auto-quiz");
        if (error) throw error;
      }
      toast({
        title: "Quizzes gerados! ✨",
        description: `${count} quizzes foram gerados automaticamente.`,
      });
      onRefresh();
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Erro ao gerar quizzes",
        description: e?.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2">
        <Dialog open={open} onOpenChange={(v) => (setOpen(v), !v && reset())}>
          <DialogTrigger asChild>
            <Button className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Novo quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-serif">Criar Quiz</DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-1 space-y-5">
              <div className="space-y-3">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                    className="rounded-xl"
                    placeholder="Ex: Quiz de Gênesis"
                  />
                </div>
                <div>
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                    className="rounded-xl resize-none"
                    rows={3}
                    placeholder="Ex: Teste seu conhecimento sobre..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Livro/Tema (opcional)</Label>
                    <Input
                      value={form.book}
                      onChange={(e) => setForm((s) => ({ ...s, book: e.target.value }))}
                      className="rounded-xl"
                      placeholder="Ex: Romanos"
                    />
                  </div>
                  <div>
                    <Label>Dificuldade</Label>
                    <Select
                      value={form.difficulty}
                      onValueChange={(v) =>
                        setForm((s) => ({
                          ...s,
                          difficulty: v as Difficulty,
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
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Perguntas</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setQuestions((q) => [...q, createEmptyQuestion()])}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={idx} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">Pergunta {idx + 1}</p>
                        {questions.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl"
                            onClick={() => setQuestions((arr) => arr.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <Textarea
                        value={q.question}
                        onChange={(e) =>
                          setQuestions((arr) =>
                            arr.map((it, i) => (i === idx ? { ...it, question: e.target.value } : it)),
                          )
                        }
                        className="rounded-xl resize-none"
                        rows={2}
                        placeholder="Digite a pergunta..."
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => (
                          <Input
                            key={optIdx}
                            value={opt}
                            onChange={(e) =>
                              setQuestions((arr) =>
                                arr.map((it, i) => {
                                  if (i !== idx) return it;
                                  const next = [...it.options] as QuestionDraft["options"];
                                  next[optIdx] = e.target.value;
                                  return { ...it, options: next };
                                }),
                              )
                            }
                            className="rounded-xl"
                            placeholder={`Opção ${String.fromCharCode(65 + optIdx)}`}
                          />
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label>Resposta correta</Label>
                          <Select
                            value={String(q.correct_answer)}
                            onValueChange={(v) =>
                              setQuestions((arr) =>
                                arr.map((it, i) => (i === idx ? { ...it, correct_answer: Number(v) as 0 | 1 | 2 | 3 } : it)),
                              )
                            }
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">A</SelectItem>
                              <SelectItem value="1">B</SelectItem>
                              <SelectItem value="2">C</SelectItem>
                              <SelectItem value="3">D</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Pontos</Label>
                          <Input
                            type="number"
                            min={1}
                            value={q.points}
                            onChange={(e) =>
                              setQuestions((arr) =>
                                arr.map((it, i) => (i === idx ? { ...it, points: Math.max(1, Number(e.target.value || 1)) } : it)),
                              )
                            }
                            className="rounded-xl"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Explicação (opcional)</Label>
                        <Textarea
                          value={q.explanation}
                          onChange={(e) =>
                            setQuestions((arr) =>
                              arr.map((it, i) => (i === idx ? { ...it, explanation: e.target.value } : it)),
                            )
                          }
                          className="rounded-xl resize-none"
                          rows={2}
                          placeholder="Explique brevemente por que esta é a resposta correta..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 rounded-xl"
                onClick={handleCreate}
                disabled={!canSubmit || isSaving}
              >
                {isSaving ? "Salvando..." : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => handleGenerate(3)}
          disabled={isGenerating}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isGenerating ? "Gerando..." : "Gerar 3 (IA)"}
        </Button>
      </div>
    </div>
  );
}
