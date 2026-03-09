import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import ResponsiveContainer from "@/components/layout/ResponsiveContainer";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useXpAward } from "@/hooks/useXpAward";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Sparkles, 
  RotateCw, 
  CheckCircle2,
  Zap,
  Heart,
  BookOpen,
  Users,
  MessageCircle,
  Flame,
  Hand,
  Gift,
  Music
} from "lucide-react";
import { format } from "date-fns";
import confetti from "canvas-confetti";

interface Challenge {
  id: number;
  title: string;
  description: string;
  icon: typeof Heart;
  color: string;
  xp: number;
}

const challenges: Challenge[] = [
  { id: 1, title: "Ore por 10 minutos", description: "Dedique um tempo especial de oração a Deus", icon: Hand, color: "#8B5CF6", xp: 20 },
  { id: 2, title: "Leia 3 capítulos", description: "Mergulhe na Palavra de Deus hoje", icon: BookOpen, color: "#3B82F6", xp: 30 },
  { id: 3, title: "Jejum de redes sociais", description: "Fique 3 horas sem redes sociais e ore", icon: Flame, color: "#EF4444", xp: 35 },
  { id: 4, title: "Encoraje 3 pessoas", description: "Envie mensagens de ânimo para irmãos", icon: MessageCircle, color: "#10B981", xp: 25 },
  { id: 5, title: "Cante louvores", description: "Passe 15 minutos adorando a Deus com música", icon: Music, color: "#F59E0B", xp: 20 },
  { id: 6, title: "Faça uma doação", description: "Doe algo para alguém necessitado hoje", icon: Gift, color: "#EC4899", xp: 40 },
  { id: 7, title: "Visite alguém", description: "Visite um irmão que está afastado ou doente", icon: Users, color: "#06B6D4", xp: 45 },
  { id: 8, title: "Perdoe alguém", description: "Libere perdão a quem te magoou", icon: Heart, color: "#DC2626", xp: 50 },
];

export default function RoletaDesafios() {
  const { user } = useAuth();
  const { awardXp } = useXpAward(user?.id);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [challengeCompleted, setChallengeCompleted] = useState(false);

  const spinWheel = () => {
    if (isSpinning || hasSpunToday) return;

    setIsSpinning(true);
    setSelectedChallenge(null);
    setChallengeCompleted(false);

    // Random number of full rotations (5-10) plus random segment
    const randomIndex = Math.floor(Math.random() * challenges.length);
    const segmentAngle = 360 / challenges.length;
    const targetAngle = 360 * (5 + Math.random() * 5) + (randomIndex * segmentAngle) + (segmentAngle / 2);
    
    setRotation(prev => prev + targetAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setSelectedChallenge(challenges[randomIndex]);
      setHasSpunToday(true);
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }, 4000);
  };

  const completeChallenge = async () => {
    if (!user || !selectedChallenge || challengeCompleted) return;

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      await supabase.from("journal_entries").insert({
        user_id: user.id,
        title: `🎯 Roleta: ${selectedChallenge.title}`,
        content: `✅ Desafio da Roleta completado!\n\n${selectedChallenge.description}`,
        mood: "grateful"
      });

      await awardXp("rotina", `roleta-${today}`, selectedChallenge.title);
      
      setChallengeCompleted(true);
      
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5 }
      });

      toast.success("🎉 Desafio concluído!", {
        description: `+${selectedChallenge.xp} XP ganhos!`
      });
    } catch (error) {
      toast.error("Erro ao completar desafio");
    }
  };

  const segmentAngle = 360 / challenges.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 pb-24">
      <PageHeader title="Roleta de Desafios" showBack />
      
      <ResponsiveContainer className="py-6">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Desafio Surpresa de Deus</h2>
          <p className="text-muted-foreground text-sm">
            Gire a roleta e receba um desafio especial para hoje!
          </p>
        </motion.div>

        {/* Wheel */}
        <div className="relative flex justify-center mb-8">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
            <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
          </div>

          {/* Wheel Container */}
          <motion.div
            className="relative w-72 h-72"
            style={{ rotate: rotation }}
            animate={{ rotate: rotation }}
            transition={{ 
              duration: 4, 
              ease: [0.2, 0.8, 0.2, 1]
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
              {challenges.map((challenge, index) => {
                const startAngle = index * segmentAngle;
                const endAngle = startAngle + segmentAngle;
                const startRad = (startAngle - 90) * (Math.PI / 180);
                const endRad = (endAngle - 90) * (Math.PI / 180);
                
                const x1 = 100 + 95 * Math.cos(startRad);
                const y1 = 100 + 95 * Math.sin(startRad);
                const x2 = 100 + 95 * Math.cos(endRad);
                const y2 = 100 + 95 * Math.sin(endRad);
                
                const largeArc = segmentAngle > 180 ? 1 : 0;
                
                const iconAngle = (startAngle + segmentAngle / 2 - 90) * (Math.PI / 180);
                const iconX = 100 + 60 * Math.cos(iconAngle);
                const iconY = 100 + 60 * Math.sin(iconAngle);

                return (
                  <g key={challenge.id}>
                    <path
                      d={`M 100 100 L ${x1} ${y1} A 95 95 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={challenge.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text
                      x={iconX}
                      y={iconY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="20"
                      style={{ transform: `rotate(${startAngle + segmentAngle / 2}deg)`, transformOrigin: `${iconX}px ${iconY}px` }}
                    >
                      {index === 0 && "🙏"}
                      {index === 1 && "📖"}
                      {index === 2 && "🔥"}
                      {index === 3 && "💬"}
                      {index === 4 && "🎵"}
                      {index === 5 && "🎁"}
                      {index === 6 && "👥"}
                      {index === 7 && "❤️"}
                    </text>
                  </g>
                );
              })}
              <circle cx="100" cy="100" r="20" fill="white" stroke="#E5E7EB" strokeWidth="2" />
              <circle cx="100" cy="100" r="8" fill="hsl(var(--primary))" />
            </svg>
          </motion.div>
        </div>

        {/* Spin Button or Result */}
        <AnimatePresence mode="wait">
          {!selectedChallenge ? (
            <motion.div
              key="spin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <Button
                size="lg"
                onClick={spinWheel}
                disabled={isSpinning || hasSpunToday}
                className="gap-2 px-8 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                <RotateCw className={`h-5 w-5 ${isSpinning ? "animate-spin" : ""}`} />
                {isSpinning ? "Girando..." : hasSpunToday ? "Já girou hoje" : "Girar Roleta"}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
                <CardContent className="p-6 text-center">
                  <div 
                    className="inline-flex h-16 w-16 items-center justify-center rounded-full mb-4"
                    style={{ backgroundColor: selectedChallenge.color }}
                  >
                    <selectedChallenge.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">{selectedChallenge.title}</h3>
                  <p className="text-muted-foreground mb-4">{selectedChallenge.description}</p>
                  
                  <div className="flex justify-center gap-2 mb-4">
                    <Badge variant="secondary" className="gap-1">
                      <Zap className="h-3 w-3 text-amber-500" />
                      {selectedChallenge.xp} XP
                    </Badge>
                  </div>

                  {!challengeCompleted ? (
                    <Button 
                      onClick={completeChallenge}
                      className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Completei o Desafio!
                    </Button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-green-500">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Desafio Concluído!</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-sm italic text-muted-foreground">
            "O Senhor guia os passos do homem"
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Provérbios 16:9
          </p>
        </motion.div>
      </ResponsiveContainer>

      <BottomNavigation />
    </div>
  );
}
