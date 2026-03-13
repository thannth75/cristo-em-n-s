import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Heart, Radio, PenLine, Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const ModoDevocional = () => {
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

  const features = [
    { title: "Leitura Bíblica", description: "Leia a Palavra com calma e atenção", icon: BookOpen, href: "/biblia", color: "from-emerald-500/20 to-emerald-600/10" },
    { title: "Devocional do Dia", description: "Reflexão e oração guiada", icon: Sun, href: "/devocional", color: "from-amber-500/20 to-amber-600/10" },
    { title: "Pedidos de Oração", description: "Ore e interceda pelos irmãos", icon: Heart, href: "/oracoes", color: "from-rose-500/20 to-rose-600/10" },
    { title: "Rádio de Louvores", description: "Adoração e louvor ao Senhor", icon: Radio, href: "/radio", color: "from-blue-500/20 to-blue-600/10" },
    { title: "Diário Espiritual", description: "Anote suas reflexões", icon: PenLine, href: "/diario", color: "from-purple-500/20 to-purple-600/10" },
    { title: "Momento com Deus", description: "Oração imersiva guiada", icon: Moon, href: "/momento-com-deus", color: "from-indigo-500/20 to-indigo-600/10" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header suave */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 px-4 py-3" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 12px))" }}>
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="h-9 w-9 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-serif font-semibold text-foreground">Modo Devocional</h1>
            <p className="text-xs text-muted-foreground">Silêncio espiritual · Foco em Deus</p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Mensagem de acolhimento */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Moon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-foreground mb-2">Tempo com Deus</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Este é um ambiente focado na sua comunhão com o Senhor. Sem distrações, sem notificações sociais. 
            Apenas você e Deus.
          </p>
        </motion.div>

        {/* Versículo de meditação */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl bg-gradient-to-br from-primary/8 to-accent/5 border border-primary/10 p-5 text-center">
          <p className="text-sm text-foreground italic leading-relaxed">
            "Aquietai-vos e sabei que eu sou Deus; serei exaltado entre as nações; serei exaltado sobre a terra."
          </p>
          <p className="text-xs text-primary font-medium mt-2">Salmos 46:10</p>
        </motion.div>

        {/* Atalhos devocionais */}
        <div className="grid gap-3">
          {features.map((feat, i) => (
            <motion.button
              key={feat.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => navigate(feat.href)}
              className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-4 text-left hover:border-primary/20 hover:shadow-sm transition-all"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feat.color} shrink-0`}>
                <feat.icon className="h-5 w-5 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-foreground">{feat.title}</p>
                <p className="text-xs text-muted-foreground">{feat.description}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Incentivo Bíblia física */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-center">
          <p className="text-sm text-foreground">📖 Separe um momento para ler sua Bíblia física.</p>
          <p className="text-xs text-muted-foreground mt-1">O app é ferramenta de apoio, não substitui a Palavra impressa.</p>
        </motion.div>
      </main>
    </div>
  );
};

export default ModoDevocional;
