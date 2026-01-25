import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Music, Calendar, Users, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";

const escalas = [
  {
    id: 1,
    date: "Domingo, 26 Jan",
    time: "19:00",
    event: "Culto de Adoração",
    musicians: [
      { name: "João", instrument: "Violão" },
      { name: "Maria", instrument: "Teclado" },
      { name: "Pedro", instrument: "Bateria" },
    ],
    confirmed: true,
  },
  {
    id: 2,
    date: "Sexta, 31 Jan",
    time: "20:00",
    event: "Culto de Jovens",
    musicians: [
      { name: "Ana", instrument: "Voz" },
      { name: "Lucas", instrument: "Guitarra" },
      { name: "Sara", instrument: "Baixo" },
    ],
    confirmed: false,
  },
];

const ensaios = [
  { id: 1, date: "Sábado, 25 Jan", time: "16:00", location: "Sala de Ensaios" },
  { id: 2, date: "Sábado, 01 Fev", time: "16:00", location: "Sala de Ensaios" },
];

const Musicos = () => {
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
            Músicos & Escalas
          </h1>
          <p className="text-sm text-muted-foreground">
            Organize sua participação musical
          </p>
        </motion.div>

        {/* Card Destaque */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 overflow-hidden rounded-2xl gradient-hope p-5 text-primary-foreground"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20">
              <Music className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-medium opacity-90">Próxima Escala</p>
              <h3 className="font-serif text-lg font-semibold">Domingo, 26 Jan - 19h</h3>
              <p className="text-sm opacity-80">Culto de Adoração</p>
            </div>
          </div>
        </motion.div>

        {/* Escalas */}
        <div className="mb-6">
          <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
            Escalas do Mês
          </h2>
          <div className="space-y-3">
            {escalas.map((escala, index) => (
              <motion.div
                key={escala.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="rounded-2xl bg-card p-4 shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{escala.event}</h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{escala.date}, {escala.time}</span>
                    </div>
                  </div>
                  {escala.confirmed ? (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Confirmado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-gold/20 px-2 py-1 text-xs font-medium text-gold">
                      <Clock className="h-3.5 w-3.5" />
                      Pendente
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {escala.musicians.map((musician, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {musician.name} • {musician.instrument}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Ensaios */}
        <div>
          <h2 className="mb-3 font-serif text-lg font-semibold text-foreground">
            Próximos Ensaios
          </h2>
          <div className="space-y-3">
            {ensaios.map((ensaio, index) => (
              <motion.div
                key={ensaio.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/20">
                  <Users className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{ensaio.date}</h4>
                  <p className="text-sm text-muted-foreground">
                    {ensaio.time} • {ensaio.location}
                  </p>
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
            "Quando vos reunis, cada um pode ter um salmo, um ensino, uma revelação..."
          </p>
          <p className="mt-2 text-sm font-medium text-primary">— 1 Coríntios 14:26</p>
        </motion.div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Musicos;
