import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, ChevronRight, Trophy, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import { Progress } from "@/components/ui/progress";

const estudos = [
  {
    id: 1,
    book: "Evangelho de João",
    chapters: 21,
    completed: 8,
    currentChapter: 9,
    deadline: "15 Fev",
  },
  {
    id: 2,
    book: "Carta aos Romanos",
    chapters: 16,
    completed: 0,
    currentChapter: 1,
    deadline: "28 Fev",
  },
  {
    id: 3,
    book: "Salmos (1-50)",
    chapters: 50,
    completed: 25,
    currentChapter: 26,
    deadline: "10 Mar",
  },
];

const provas = [
  { id: 1, title: "Prova João 1-7", score: 92, date: "10 Jan" },
  { id: 2, title: "Prova João 8-14", score: 88, date: "20 Jan" },
];

const Estudos = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "Jovem";

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader userName={userName} />

      <main className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="font-serif text-2xl font-semibold text-foreground">
            Estudos Bíblicos
          </h1>
          <p className="text-sm text-muted-foreground">
            Seu progresso na Palavra
          </p>
        </motion.div>

        {/* Card de Destaque */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 overflow-hidden rounded-2xl gradient-hope p-5 text-primary-foreground"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Estudo Atual</p>
              <h3 className="font-serif text-xl font-semibold">Evangelho de João</h3>
              <p className="mt-1 text-sm opacity-80">Capítulo 9 - O cego de nascença</p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-foreground/20">
              <BookOpen className="h-8 w-8" />
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-sm">
              <span>Progresso</span>
              <span>8/21 capítulos</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-primary-foreground/20">
              <div className="h-full rounded-full bg-primary-foreground" style={{ width: "38%" }} />
            </div>
          </div>
        </motion.div>

        {/* Lista de Estudos */}
        <div className="mb-6">
          <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
            Meus Estudos
          </h2>
          <div className="space-y-3">
            {estudos.map((estudo, index) => {
              const progress = Math.round((estudo.completed / estudo.chapters) * 100);
              return (
                <motion.button
                  key={estudo.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="w-full rounded-2xl bg-card p-4 text-left shadow-md transition-all hover:shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{estudo.book}</h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Até {estudo.deadline}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>{estudo.completed} de {estudo.chapters} capítulos</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Provas Realizadas */}
        <div>
          <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
            Provas Realizadas
          </h2>
          <div className="space-y-3">
            {provas.map((prova, index) => (
              <motion.div
                key={prova.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20">
                    <Trophy className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{prova.title}</h4>
                    <p className="text-sm text-muted-foreground">{prova.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary">{prova.score}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Versículo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 rounded-2xl bg-accent/50 p-5 text-center"
        >
          <p className="font-serif italic text-muted-foreground">
            "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho."
          </p>
          <p className="mt-2 text-sm font-medium text-primary">— Salmos 119:105</p>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Estudos;
