import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";

const eventos = [
  {
    id: 1,
    title: "Culto de Adoração",
    date: "Domingo, 26 Jan",
    time: "19:00",
    location: "Templo Principal",
    type: "culto",
  },
  {
    id: 2,
    title: "Ensaio da Mocidade",
    date: "Sábado, 25 Jan",
    time: "16:00",
    location: "Sala de Ensaios",
    type: "ensaio",
  },
  {
    id: 3,
    title: "Estudo Bíblico",
    date: "Quarta, 29 Jan",
    time: "19:30",
    location: "Sala de Estudos",
    type: "estudo",
  },
  {
    id: 4,
    title: "Culto de Jovens",
    date: "Sexta, 31 Jan",
    time: "20:00",
    location: "Templo Principal",
    type: "culto",
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case "culto":
      return "bg-primary/10 text-primary";
    case "ensaio":
      return "bg-gold/20 text-gold";
    case "estudo":
      return "bg-accent text-accent-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const Agenda = () => {
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
            Agenda Espiritual
          </h1>
          <p className="text-sm text-muted-foreground">
            Próximos eventos e compromissos
          </p>
        </motion.div>

        {/* Calendário Resumo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 overflow-hidden rounded-2xl gradient-hope p-5 text-primary-foreground"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-primary-foreground/20">
              <Calendar className="mb-1 h-5 w-5" />
              <span className="text-xs font-medium">Janeiro</span>
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold">
                {eventos.length} eventos este mês
              </h3>
              <p className="text-sm opacity-80">
                Continue firme na caminhada!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Lista de Eventos */}
        <div className="space-y-3">
          {eventos.map((evento, index) => (
            <motion.button
              key={evento.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 shadow-md transition-all hover:shadow-lg"
            >
              <div className={`rounded-xl p-3 ${getTypeColor(evento.type)}`}>
                <Calendar className="h-6 w-6" />
              </div>
              
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-foreground">{evento.title}</h3>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {evento.date}, {evento.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {evento.location}
                  </span>
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </motion.button>
          ))}
        </div>

        {/* Versículo motivacional */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 rounded-2xl bg-accent/50 p-5 text-center"
        >
          <p className="font-serif italic text-muted-foreground">
            "Não deixemos de congregar-nos, como é costume de alguns, mas encorajemo-nos uns aos outros."
          </p>
          <p className="mt-2 text-sm font-medium text-primary">— Hebreus 10:25</p>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Agenda;
