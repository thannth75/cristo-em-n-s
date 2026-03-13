import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, GraduationCap, BookOpen, Users, Heart, Shield, Lock, Play, FileText, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import BottomNavigation from "@/components/BottomNavigation";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  lessons: number;
  emoji: string;
  locked?: boolean;
}

const COURSES: Course[] = [
  { id: "discipulado-1", title: "Discipulado - Primeiros Passos", description: "Os fundamentos da fé cristã para novos convertidos.", category: "Discipulado", lessons: 8, emoji: "🌱" },
  { id: "familia-crista", title: "Família Cristã", description: "Princípios bíblicos para viver em família conforme a Palavra.", category: "Família", lessons: 6, emoji: "👨‍👩‍👧‍👦" },
  { id: "vida-oracao", title: "Vida de Oração", description: "Aprofunde sua vida de oração e intimidade com Deus.", category: "Vida Espiritual", lessons: 7, emoji: "🙏" },
  { id: "estudo-biblico-basico", title: "Estudo Bíblico Básico", description: "Aprenda a estudar a Bíblia de forma eficaz.", category: "Estudo Bíblico", lessons: 10, emoji: "📖" },
  { id: "lideranca-crista", title: "Liderança Cristã", description: "Princípios de liderança servil segundo a Bíblia.", category: "Liderança", lessons: 5, emoji: "👑" },
  { id: "evangelismo", title: "Evangelismo Pessoal", description: "Como compartilhar o Evangelho com naturalidade.", category: "Missão", lessons: 6, emoji: "🌍" },
];

const Cursos = () => {
  const navigate = useNavigate();
  const { user, isApproved, isLoading, isAdmin, isLeader } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  useEffect(() => {
    if (!isLoading) {
      if (!user) navigate("/auth");
      else if (!isApproved) navigate("/pending");
    }
  }, [user, isApproved, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const categories = ["Todos", ...new Set(COURSES.map((c) => c.category))];
  const filtered = selectedCategory === "Todos" ? COURSES : COURSES.filter((c) => c.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: "calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))" }}>
      <div className="sticky top-0 z-40 border-b border-border/60 bg-card/95 backdrop-blur px-4 py-3" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 12px))" }}>
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="h-9 w-9 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-base font-bold text-foreground sm:text-lg">
              <GraduationCap className="h-4 w-4 text-primary" />
              Cursos Cristãos
            </h1>
            <p className="text-xs text-muted-foreground">Capacitação ministerial e crescimento espiritual</p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-4 space-y-4">
        {/* Aviso pastoral */}
        {(isAdmin || isLeader) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Área Pastoral</h3>
            </div>
            <p className="text-xs text-muted-foreground">Como líder, você poderá criar cursos com apostilas, vídeos e questionários em breve.</p>
          </motion.div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={selectedCategory === cat ? "default" : "outline"}
              className="rounded-full text-xs h-8 whitespace-nowrap shrink-0"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Lista de cursos */}
        <div className="grid gap-3">
          {filtered.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl shrink-0">
                  {course.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-foreground">{course.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{course.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" /> {course.lessons} lições
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
                      {course.category}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Progress value={0} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground mt-1">0% concluído</p>
                  </div>
                </div>
              </div>
              <Button size="sm" className="mt-3 w-full rounded-full gap-1.5" variant="outline">
                <Play className="h-3.5 w-3.5" /> Iniciar curso
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Avisos pastorais */}
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Avisos Pastorais</h3>
          </div>
          <div className="space-y-2">
            <div className="rounded-xl bg-muted/30 p-3">
              <p className="text-sm text-foreground">📢 Novos cursos serão adicionados em breve pelo pastor!</p>
              <p className="text-xs text-muted-foreground mt-1">Os pastores e líderes podem publicar avisos, orientações e comunicados aqui.</p>
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Cursos;
