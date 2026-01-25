import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Users,
  Music,
  Heart,
  Award,
  Image,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";
import VerseCard from "@/components/VerseCard";
import FeatureCard from "@/components/FeatureCard";
import type { User } from "@supabase/supabase-js";

const dailyVerses = [
  { verse: "Buscai primeiro o Reino de Deus e a sua justiça, e todas as coisas vos serão acrescentadas.", reference: "Mateus 6:33" },
  { verse: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", reference: "Salmos 37:5" },
  { verse: "Não deixemos de congregar-nos, como é costume de alguns, mas encorajemo-nos uns aos outros.", reference: "Hebreus 10:25" },
  { verse: "Tudo quanto fizerdes, fazei-o de todo o coração, como para o Senhor e não para homens.", reference: "Colossenses 3:23" },
  { verse: "O Senhor é o meu pastor; nada me faltará.", reference: "Salmos 23:1" },
];

const features = [
  { title: "Estudos Bíblicos", description: "Cronograma de leitura e provas", icon: BookOpen, href: "/estudos" },
  { title: "Agenda Espiritual", description: "Cultos, ensaios e eventos", icon: Calendar, href: "/agenda" },
  { title: "Presença", description: "Registro de participação", icon: Users, href: "/presenca" },
  { title: "Músicos", description: "Escalas e repertório", icon: Music, href: "/musicos" },
  { title: "Diário Espiritual", description: "Reflexões e orações", icon: Heart, href: "/diario" },
  { title: "Conquistas", description: "Badges e progresso", icon: Award, href: "/conquistas", badge: "Novo" },
  { title: "Galeria", description: "Fotos dos eventos", icon: Image, href: "/galeria" },
  { title: "Pedidos de Oração", description: "Compartilhe com líderes", icon: MessageSquare, href: "/oracoes" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [todayVerse] = useState(() => {
    const dayIndex = new Date().getDate() % dailyVerses.length;
    return dailyVerses[dayIndex];
  });

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
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || "Jovem";

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader userName={userName} />

      <main className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Versículo do Dia */}
          <VerseCard verse={todayVerse.verse} reference={todayVerse.reference} />

          {/* Próximo evento destaque */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="overflow-hidden rounded-2xl gradient-hope p-5 text-primary-foreground shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Próximo Culto</p>
                <h3 className="font-serif text-xl font-semibold">Domingo, 19h</h3>
                <p className="mt-1 text-sm opacity-80">Culto de Adoração</p>
              </div>
              <div className="text-right">
                <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-primary-foreground/20">
                  <span className="text-2xl font-bold">26</span>
                  <span className="text-xs font-medium">JAN</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Funcionalidades */}
          <div>
            <h2 className="mb-4 font-serif text-lg font-semibold text-foreground">
              Minha Jornada
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {features.map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  {...feature}
                  delay={0.1 * index}
                />
              ))}
            </div>
          </div>

          {/* Motivação */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl bg-accent/50 p-5 text-center"
          >
            <p className="font-serif text-muted-foreground">
              "Cada dia é uma nova oportunidade de servir a Deus e crescer em fé."
            </p>
            <p className="mt-2 text-sm font-medium text-primary">
              Continue firme na caminhada! 🙏
            </p>
          </motion.div>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Dashboard;
