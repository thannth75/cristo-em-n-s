import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, TrendingUp, TrendingDown, Minus, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Exam {
  id: string;
  title: string;
  max_score: number;
  exam_type: string;
  exam_date: string;
}

interface ExamGrade {
  id: string;
  exam_id: string;
  score: number | null;
  notes: string | null;
  graded_at: string;
  exams: Exam;
}

interface MyGradesCardProps {
  grades: ExamGrade[];
  isLoading: boolean;
}

export default function MyGradesCard({ grades, isLoading }: MyGradesCardProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calcular média geral
  const validGrades = grades.filter((g) => g.score !== null);
  const averagePercentage =
    validGrades.length > 0
      ? validGrades.reduce((sum, g) => sum + (g.score! / g.exams.max_score) * 100, 0) / validGrades.length
      : 0;

  const getScoreStatus = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 70)
      return { color: "text-green-500", bg: "bg-green-500", icon: TrendingUp, label: "Excelente" };
    if (percentage >= 50)
      return { color: "text-yellow-500", bg: "bg-yellow-500", icon: Minus, label: "Regular" };
    return { color: "text-red-500", bg: "bg-red-500", icon: TrendingDown, label: "Precisa melhorar" };
  };

  const getExamTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      prova: "Prova",
      trabalho: "Trabalho",
      participacao: "Participação",
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-4">
      {/* Resumo geral */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Seu Desempenho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Média geral</span>
            <span className="text-2xl font-bold">{averagePercentage.toFixed(1)}%</span>
          </div>
          <Progress value={averagePercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {validGrades.length} avaliação(ões) concluída(s)
          </p>
        </CardContent>
      </Card>

      {/* Lista de notas */}
      {grades.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Você ainda não tem notas registradas</p>
            <p className="text-sm text-muted-foreground mt-1">
              As notas aparecerão aqui quando o líder registrá-las
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {grades.map((grade) => {
            const status = grade.score !== null ? getScoreStatus(grade.score, grade.exams.max_score) : null;
            const StatusIcon = status?.icon || Minus;

            return (
              <Card key={grade.id}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{grade.exams.title}</CardTitle>
                      <CardDescription className="text-xs">
                        {format(new Date(grade.exams.exam_date), "dd 'de' MMMM", { locale: ptBR })}
                        {" • "}
                        {getExamTypeLabel(grade.exams.exam_type)}
                      </CardDescription>
                    </div>
                    {grade.score !== null && status && (
                      <Badge variant="outline" className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {grade.score}/{grade.exams.max_score}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                {grade.score !== null && status && (
                  <CardContent className="p-4 pt-0">
                    <Progress
                      value={(grade.score / grade.exams.max_score) * 100}
                      className={`h-1.5 ${status.bg}`}
                    />
                    {grade.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">"{grade.notes}"</p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
