import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import BottomNavigation from "@/components/BottomNavigation";
import { 
  Gamepad2, 
  Target, 
  Brain, 
  Sparkles, 
  Trophy,
  Flame,
  ChevronRight,
  Zap,
  Heart
} from "lucide-react";

const games = [
  {
    id: "desafios-diarios",
    title: "Desafios Diários",
    description: "Missões práticas para fortalecer sua fé no dia a dia",
    icon: Target,
    color: "from-amber-500 to-orange-600",
    badge: "Novo",
    href: "/desafios-diarios"
  },
  {
    id: "roleta-desafios",
    title: "Roleta de Desafios",
    description: "Gire a roleta e receba um desafio surpresa de Deus",
    icon: Sparkles,
    color: "from-purple-500 to-pink-600",
    badge: "Popular",
    href: "/roleta-desafios"
  },
  {
    id: "memoria-biblica",
    title: "Memória Bíblica",
    description: "Memorize versículos combinando cartas sagradas",
    icon: Brain,
    color: "from-blue-500 to-cyan-600",
    badge: null,
    href: "/memoria-biblica"
  },
  {
    id: "trilha-fe",
    title: "Trilha de Fé",
    description: "Jornada de 7 dias com desafios espirituais progressivos",
    icon: Flame,
    color: "from-green-500 to-emerald-600",
    badge: null,
    href: "/trilha-fe"
  }
];

export default function JogosEspirituais() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 pb-24">
      <PageHeader title="Jogos Espirituais" showBack />
      
      <ResponsiveContainer className="py-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 border border-primary/20"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
              <Gamepad2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Cresça Jogando!</h2>
              <p className="text-sm text-muted-foreground">
                Desafios interativos para fortalecer sua fé
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <div className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium">Ganhe XP</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-xs font-medium">Conquistas</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium">Crescimento</span>
            </div>
          </div>
        </motion.div>

        {/* Games Grid */}
        <div className="space-y-4">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="group cursor-pointer overflow-hidden border-none bg-card/50 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-xl"
                onClick={() => navigate(game.href)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${game.color} shadow-lg transition-transform group-hover:scale-110`}>
                    <game.icon className="h-7 w-7 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{game.title}</h3>
                      {game.badge && (
                        <Badge variant="secondary" className="shrink-0 text-[10px] px-2 py-0">
                          {game.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {game.description}
                    </p>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Motivation Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-sm italic text-muted-foreground">
            "Exercita-te a ti mesmo na piedade"
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            1 Timóteo 4:7
          </p>
        </motion.div>
      </ResponsiveContainer>

      <BottomNavigation />
    </div>
  );
}
