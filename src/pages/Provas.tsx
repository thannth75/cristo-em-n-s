import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNavigation from "@/components/BottomNavigation";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, TrendingUp, Award, BookOpen, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CreateExamDialog from "@/components/provas/CreateExamDialog";
import EditExamDialog from "@/components/provas/EditExamDialog";
import ExamGradesDialog from "@/components/provas/ExamGradesDialog";
import MyGradesCard from "@/components/provas/MyGradesCard";
import AttendanceScoreCard from "@/components/provas/AttendanceScoreCard";
import AdBanner from "@/components/ads/AdBanner";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Exam {
  id: string;
  title: string;
  description: string | null;
  exam_date: string;
  max_score: number;
  exam_type: string;
  created_at: string;
}

interface ExamGrade {
  id: string;
  exam_id: string;
  score: number | null;
  notes: string | null;
  graded_at: string;
  exams: Exam;
}

export default function Provas() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isApproved, isLeader, isAdmin, canAccessYouthContent, userCity } = useAuth();
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [myGrades, setMyGrades] = useState<ExamGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading && user && !isApproved) {
      navigate("/pending");
    } else if (!authLoading && user && isApproved && !canAccessYouthContent) {
      // Redirecionar se não tem acesso a conteúdo de jovens
      navigate("/dashboard");
    }
  }, [user, authLoading, isApproved, canAccessYouthContent, navigate]);

  useEffect(() => {
    if (user && isApproved) {
      fetchData();
    }
  }, [user, isApproved]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar provas - filtradas por cidade se não for admin
      let examsQuery = supabase
        .from("exams")
        .select("*")
        .order("exam_date", { ascending: false });

      // Filtrar por cidade se não for admin
      if (!isAdmin && userCity) {
        examsQuery = examsQuery.eq("city", userCity);
      }

      const { data: examsData } = await examsQuery;

      if (examsData) setExams(examsData);

      // Buscar minhas notas
      const { data: gradesData } = await supabase
        .from("exam_grades")
        .select("*, exams(*)")
        .eq("user_id", user!.id)
        .order("graded_at", { ascending: false });

      if (gradesData) setMyGrades(gradesData as unknown as ExamGrade[]);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExam = async () => {
    if (!deletingExam) return;

    try {
      const { error } = await supabase.from("exams").delete().eq("id", deletingExam.id);

      if (error) throw error;

      toast({ title: "Prova excluída com sucesso" });
      fetchData();
    } catch (error) {
      console.error("Erro ao excluir prova:", error);
      toast({ title: "Erro ao excluir prova", variant: "destructive" });
    } finally {
      setDeletingExam(null);
    }
  };

  const getExamTypeBadge = (type: string) => {
    const types: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      prova: { label: "Prova", variant: "default" },
      trabalho: { label: "Trabalho", variant: "secondary" },
      participacao: { label: "Participação", variant: "outline" },
    };
    return types[type] || types.prova;
  };

  if (authLoading || !user || !isApproved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))' }}>
      <PageHeader title="Provas e Avaliações" showBack />

      <main className="py-4 sm:py-6">
        <ResponsiveContainer size="lg" className="space-y-4 sm:space-y-6">
          {/* Banner de anúncio sutil no topo */}
          <AdBanner position="inline" />

          <Tabs defaultValue="minhas-notas" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="minhas-notas" className="text-[10px] sm:text-sm py-2 px-1 sm:px-3 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1">
                <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="leading-tight">Notas</span>
              </TabsTrigger>
              <TabsTrigger value="frequencia" className="text-[10px] sm:text-sm py-2 px-1 sm:px-3 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="leading-tight">Frequência</span>
              </TabsTrigger>
              {(isLeader || isAdmin) && (
                <TabsTrigger value="gerenciar" className="text-[10px] sm:text-sm py-2 px-1 sm:px-3 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1">
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="leading-tight">Gerenciar</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="minhas-notas" className="space-y-4 mt-4">
              <MyGradesCard grades={myGrades} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="frequencia" className="space-y-4 mt-4">
              <AttendanceScoreCard userId={user.id} />
            </TabsContent>

            {(isLeader || isAdmin) && (
              <TabsContent value="gerenciar" className="space-y-4 mt-4">
                <div className="flex justify-between items-center gap-2">
                  <h3 className="text-base sm:text-lg font-semibold">Provas Cadastradas</h3>
                  <Button onClick={() => setShowCreateDialog(true)} size="sm" className="shrink-0">
                    <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Nova Prova</span>
                    <span className="sm:hidden">Nova</span>
                  </Button>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : exams.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhuma prova cadastrada ainda</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {exams.map((exam) => {
                      const typeInfo = getExamTypeBadge(exam.exam_type);
                      return (
                        <Card
                          key={exam.id}
                          className="cursor-pointer hover:bg-accent/50 transition-colors"
                        >
                          <CardHeader className="p-3 sm:p-4 pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0" onClick={() => setSelectedExam(exam)}>
                                <CardTitle className="text-sm sm:text-base truncate">{exam.title}</CardTitle>
                                <CardDescription className="text-xs">
                                  {format(new Date(exam.exam_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant={typeInfo.variant} className="text-[10px] sm:text-xs">
                                  {typeInfo.label}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditingExam(exam)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => setDeletingExam(exam)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardHeader>
                          {exam.description && (
                            <CardContent className="p-3 sm:p-4 pt-0" onClick={() => setSelectedExam(exam)}>
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{exam.description}</p>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>

          {/* Banner de anúncio sutil no final */}
          <AdBanner position="footer" />
        </ResponsiveContainer>
      </main>

      <CreateExamDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchData}
      />

      {editingExam && (
        <EditExamDialog
          exam={editingExam}
          open={!!editingExam}
          onOpenChange={(open) => !open && setEditingExam(null)}
          onSuccess={fetchData}
        />
      )}

      {selectedExam && (
        <ExamGradesDialog
          exam={selectedExam}
          open={!!selectedExam}
          onOpenChange={(open) => !open && setSelectedExam(null)}
          onSuccess={fetchData}
        />
      )}

      <AlertDialog open={!!deletingExam} onOpenChange={(open) => !open && setDeletingExam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Prova</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingExam?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExam} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
}
