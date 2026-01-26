import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, TrendingUp, Award, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import CreateExamDialog from "@/components/provas/CreateExamDialog";
import ExamGradesDialog from "@/components/provas/ExamGradesDialog";
import MyGradesCard from "@/components/provas/MyGradesCard";
import AttendanceScoreCard from "@/components/provas/AttendanceScoreCard";
import AdBanner from "@/components/ads/AdBanner";

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
  const { user, isLoading: authLoading, isApproved, isLeader, isAdmin } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [myGrades, setMyGrades] = useState<ExamGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading && user && !isApproved) {
      navigate("/pending");
    }
  }, [user, authLoading, isApproved, navigate]);

  useEffect(() => {
    if (user && isApproved) {
      fetchData();
    }
  }, [user, isApproved]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar provas
      const { data: examsData } = await supabase
        .from("exams")
        .select("*")
        .order("exam_date", { ascending: false });

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
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Provas e Avaliações" showBack />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Banner de anúncio sutil no topo */}
        <AdBanner position="top" />

        <Tabs defaultValue="minhas-notas" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="minhas-notas" className="text-xs sm:text-sm">
              <Award className="h-4 w-4 mr-1" />
              Minhas Notas
            </TabsTrigger>
            <TabsTrigger value="frequencia" className="text-xs sm:text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              Frequência
            </TabsTrigger>
            {(isLeader || isAdmin) && (
              <TabsTrigger value="gerenciar" className="text-xs sm:text-sm">
                <FileText className="h-4 w-4 mr-1" />
                Gerenciar
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
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Provas Cadastradas</h3>
                <Button onClick={() => setShowCreateDialog(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Prova
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
                        onClick={() => setSelectedExam(exam)}
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{exam.title}</CardTitle>
                              <CardDescription className="text-xs">
                                {format(new Date(exam.exam_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </CardDescription>
                            </div>
                            <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                          </div>
                        </CardHeader>
                        {exam.description && (
                          <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground line-clamp-2">{exam.description}</p>
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
        <AdBanner position="bottom" />
      </main>

      <CreateExamDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchData}
      />

      {selectedExam && (
        <ExamGradesDialog
          exam={selectedExam}
          open={!!selectedExam}
          onOpenChange={(open) => !open && setSelectedExam(null)}
          onSuccess={fetchData}
        />
      )}

      <BottomNavigation />
    </div>
  );
}
