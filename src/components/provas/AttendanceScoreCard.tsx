import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";

interface AttendanceScoreCardProps {
  userId: string;
}

interface AttendanceScore {
  user_id: string;
  full_name: string;
  events_attended: number;
  total_events: number;
  attendance_percentage: number;
  status: string;
}

export default function AttendanceScoreCard({ userId }: AttendanceScoreCardProps) {
  const [score, setScore] = useState<AttendanceScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchScore();
  }, [userId]);

  const fetchScore = async () => {
    try {
      const { data, error } = await supabase
        .from("attendance_scores")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      setScore(data);
    } catch (error) {
      console.error("Erro ao buscar score de frequência:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: typeof TrendingUp; description: string }> = {
      excelente: {
        label: "Excelente",
        color: "text-green-500 bg-green-500/10 border-green-500/30",
        icon: TrendingUp,
        description: "Você está com ótima frequência! Continue assim!",
      },
      bom: {
        label: "Bom",
        color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
        icon: TrendingUp,
        description: "Sua frequência está boa, mas pode melhorar!",
      },
      regular: {
        label: "Regular",
        color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
        icon: Minus,
        description: "Tente comparecer mais aos eventos para melhorar seu score.",
      },
      baixa: {
        label: "Precisa Melhorar",
        color: "text-red-500 bg-red-500/10 border-red-500/30",
        icon: TrendingDown,
        description: "Sua frequência está baixa. Compareça mais aos cultos e ensaios!",
      },
      sem_dados: {
        label: "Sem Dados",
        color: "text-muted-foreground bg-muted border-muted",
        icon: AlertCircle,
        description: "Ainda não há eventos registrados para calcular sua frequência.",
      },
    };
    return statusMap[status] || statusMap.sem_dados;
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Não foi possível carregar seu score de frequência</p>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(score.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-4">
      {/* Card principal de frequência */}
      <Card className={`border-2 ${statusInfo.color}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Score de Frequência
            </CardTitle>
            <Badge variant="outline" className={statusInfo.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
          <CardDescription>Últimos 3 meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <span className="text-4xl font-bold">{score.attendance_percentage}%</span>
            <div className="text-right text-sm text-muted-foreground">
              <p>{score.events_attended} de {score.total_events}</p>
              <p>eventos</p>
            </div>
          </div>
          <Progress value={score.attendance_percentage} className="h-3 mb-3" />
          <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
        </CardContent>
      </Card>

      {/* Dicas para melhorar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Como melhorar sua frequência?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <span className="text-primary">•</span>
            <p>Compareça aos cultos de domingo e quarta</p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span className="text-primary">•</span>
            <p>Participe dos ensaios do ministério de louvor</p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span className="text-primary">•</span>
            <p>Esteja presente nos eventos especiais</p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span className="text-primary">•</span>
            <p>Ative as notificações para não perder nenhum evento</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
