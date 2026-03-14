import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Shield,
  Play,
  FileText,
  Wrench,
  Heart,
  Compass,
  Users,
  Sparkles,
  Church,
  Music,
  Globe,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import BottomNavigation from "@/components/BottomNavigation";

interface Tool {
  id: string;
  title: string;
  description: string;
  emoji: string;
  route: string;
  color: string;
}

const TOOLS: Tool[] = [
  {
    id: "biblia",
    title: "Bíblia Sagrada",
    description: "Leia a Palavra de Deus - ACF completa",
    emoji: "📖",
    route: "/biblia",
    color: "from-blue-500/20 to-blue-600/10",
  },
  {
    id: "devocional",
    title: "Devocional Diário",
    description: "Reflexão bíblica e oração do dia",
    emoji: "🙏",
    route: "/devocional",
    color: "from-amber-500/20 to-amber-600/10",
  },
  {
    id: "plano-leitura",
    title: "Plano de Leitura",
    description: "Leitura bíblica organizada por dias",
    emoji: "📋",
    route: "/plano-leitura",
    color: "from-green-500/20 to-green-600/10",
  },
  {
    id: "modo-devocional",
    title: "Modo Devocional",
    description: "Ambiente sem distrações para meditar",
    emoji: "🕊️",
    route: "/modo-devocional",
    color: "from-purple-500/20 to-purple-600/10",
  },
  {
    id: "oracoes",
    title: "Pedidos de Oração",
    description: "Interceda e peça oração à comunidade",
    emoji: "❤️",
    route: "/oracoes",
    color: "from-red-500/20 to-red-600/10",
  },
  {
    id: "diario",
    title: "Diário Espiritual",
    description: "Registre sua caminhada com Deus",
    emoji: "📝",
    route: "/diario",
    color: "from-teal-500/20 to-teal-600/10",
  },
  {
    id: "versiculos",
    title: "Versículos Favoritos",
    description: "Salve e memorize versículos",
    emoji: "⭐",
    route: "/versiculos",
    color: "from-yellow-500/20 to-yellow-600/10",
  },
  {
    id: "quiz",
    title: "Quiz Bíblico",
    description: "Teste seus conhecimentos bíblicos",
    emoji: "🧠",
    route: "/quiz",
    color: "from-indigo-500/20 to-indigo-600/10",
  },
  {
    id: "radio",
    title: "Rádio de Louvores",
    description: "Ouça louvores 24 horas",
    emoji: "🎵",
    route: "/radio",
    color: "from-pink-500/20 to-pink-600/10",
  },
  {
    id: "testemunhos",
    title: "Testemunhos",
    description: "Compartilhe o que Deus fez na sua vida",
    emoji: "✨",
    route: "/testemunhos",
    color: "from-orange-500/20 to-orange-600/10",
  },
  {
    id: "rotina",
    title: "Rotina com Deus",
    description: "Organize seus hábitos espirituais",
    emoji: "📅",
    route: "/rotina-com-deus",
    color: "from-cyan-500/20 to-cyan-600/10",
  },
  {
    id: "trilha-fe",
    title: "Trilha da Fé",
    description: "Jornada de crescimento espiritual",
    emoji: "🏔️",
    route: "/trilha-fe",
    color: "from-emerald-500/20 to-emerald-600/10",
  },
];

const Cursos = () => {
  const navigate = useNavigate();
  const { user, isApproved, isLoading } = useAuth();

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

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        paddingBottom: "calc(5rem + max(1rem, env(safe-area-inset-bottom, 16px)))",
      }}
    >
      <div
        className="sticky top-0 z-40 border-b border-border/60 bg-card/95 backdrop-blur px-4 py-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 12px))" }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="h-9 w-9 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-base font-bold text-foreground sm:text-lg">
              <Wrench className="h-4 w-4 text-primary" />
              Ferramentas Espirituais
            </h1>
            <p className="text-xs text-muted-foreground">
              Tudo o que você precisa para crescer na fé
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-4 space-y-4">
        {/* Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border border-primary/15 p-4 text-center"
        >
          <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground">
            Suas ferramentas de crescimento espiritual
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Acesse rapidamente tudo o que o Vida em Cristo oferece para sua caminhada com Deus.
          </p>
        </motion.div>

        {/* Tools grid */}
        <div className="grid grid-cols-2 gap-3">
          {TOOLS.map((tool, i) => (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => navigate(tool.route)}
              className={`rounded-2xl border border-border/70 bg-gradient-to-br ${tool.color} p-4 text-left hover:scale-[1.02] active:scale-[0.98] transition-transform`}
            >
              <span className="text-2xl block mb-2">{tool.emoji}</span>
              <h3 className="font-semibold text-sm text-foreground leading-tight">
                {tool.title}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                {tool.description}
              </p>
            </motion.button>
          ))}
        </div>

        {/* Versículo motivacional */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4 text-center">
          <p className="text-xs text-primary font-medium mb-2">✨ Versículo</p>
          <p className="text-sm text-foreground italic">
            "Procura apresentar-te a Deus aprovado, como obreiro que não tem de que se envergonhar, que maneja bem a palavra da verdade."
          </p>
          <p className="text-xs text-muted-foreground mt-1">2 Timóteo 2:15</p>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Cursos;
