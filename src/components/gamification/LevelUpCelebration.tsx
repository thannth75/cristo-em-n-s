import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface LevelUpCelebrationProps {
  open: boolean;
  onClose: () => void;
  newLevel: number;
  levelTitle: string;
  levelIcon: string;
  rewards?: string[];
}

export function LevelUpCelebration({
  open,
  onClose,
  newLevel,
  levelTitle,
  levelIcon,
  rewards,
}: LevelUpCelebrationProps) {
  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4", "#45B7D1"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4", "#45B7D1"],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      const cleanup = fireConfetti();
      return cleanup;
    }
  }, [open, fireConfetti]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="mx-4 max-w-sm rounded-3xl border-0 bg-gradient-to-b from-primary/20 via-background to-background p-0 overflow-hidden">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="p-6 text-center"
            >
              {/* Glow effect */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-primary/10 blur-3xl"
              />

              {/* Stars decoration */}
              <div className="relative mb-4">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Star className="absolute -top-2 -left-2 h-6 w-6 text-gold fill-gold opacity-60" />
                  <Star className="absolute -top-4 right-0 h-4 w-4 text-gold fill-gold opacity-40" />
                  <Star className="absolute bottom-0 -right-2 h-5 w-5 text-gold fill-gold opacity-50" />
                </motion.div>
              </div>

              {/* Trophy animation */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative mb-6"
              >
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-gold/30 to-primary/30 shadow-2xl"
                >
                  <span className="text-5xl">{levelIcon}</span>
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2"
                >
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    NÍVEL {newLevel}
                  </span>
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-gold" />
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    Subiu de Nível!
                  </h2>
                  <Sparkles className="h-5 w-5 text-gold" />
                </div>
                <p className="text-lg font-semibold text-primary mb-2">{levelTitle}</p>
                <p className="text-sm text-muted-foreground">
                  Parabéns pelo seu progresso espiritual!
                </p>
              </motion.div>

              {/* Rewards */}
              {rewards && rewards.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 rounded-xl bg-primary/10 p-4"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Recompensas</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {rewards.map((reward, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground"
                      >
                        {reward}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Close button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6"
              >
                <Button onClick={onClose} className="w-full rounded-xl">
                  Continuar Jornada
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
