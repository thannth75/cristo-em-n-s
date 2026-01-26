import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Exam {
  id: string;
  title: string;
  description: string | null;
  exam_date: string;
  max_score: number;
  exam_type: string;
}

interface Profile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

interface Grade {
  user_id: string;
  score: number | null;
  notes: string;
}

interface ExamGradesDialogProps {
  exam: Exam;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ExamGradesDialog({ exam, open, onOpenChange, onSuccess }: ExamGradesDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [grades, setGrades] = useState<Record<string, Grade>>({});

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, exam.id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar todos os perfis aprovados
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .eq("is_approved", true)
        .order("full_name");

      if (profilesData) setProfiles(profilesData);

      // Buscar notas existentes para esta prova
      const { data: gradesData } = await supabase
        .from("exam_grades")
        .select("user_id, score, notes")
        .eq("exam_id", exam.id);

      if (gradesData) {
        const gradesMap: Record<string, Grade> = {};
        gradesData.forEach((g) => {
          gradesMap[g.user_id] = {
            user_id: g.user_id,
            score: g.score,
            notes: g.notes || "",
          };
        });
        setGrades(gradesMap);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateGrade = (userId: string, field: "score" | "notes", value: string) => {
    setGrades((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        user_id: userId,
        [field]: field === "score" ? (value === "" ? null : parseFloat(value)) : value,
      },
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const gradesToUpsert = Object.values(grades)
        .filter((g) => g.score !== null && g.score !== undefined)
        .map((g) => ({
          exam_id: exam.id,
          user_id: g.user_id,
          score: g.score,
          notes: g.notes || null,
          graded_by: user.id,
          graded_at: new Date().toISOString(),
        }));

      if (gradesToUpsert.length > 0) {
        const { error } = await supabase.from("exam_grades").upsert(gradesToUpsert, {
          onConflict: "exam_id,user_id",
        });

        if (error) throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Notas salvas com sucesso",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar notas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as notas",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "";
    const percentage = (score / exam.max_score) * 100;
    if (percentage >= 70) return "text-green-500";
    if (percentage >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{exam.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {format(new Date(exam.exam_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            <Badge variant="outline">Máx: {exam.max_score}</Badge>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-3">
                {profiles.map((profile) => {
                  const grade = grades[profile.user_id];
                  return (
                    <div
                      key={profile.user_id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-accent/30"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{profile.full_name}</p>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max={exam.max_score}
                        step="0.5"
                        placeholder="Nota"
                        className={`w-20 text-center ${getScoreColor(grade?.score ?? null)}`}
                        value={grade?.score ?? ""}
                        onChange={(e) => updateGrade(profile.user_id, "score", e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Notas
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
