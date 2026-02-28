import { motion } from "framer-motion";
import { Flame, BookOpen, Heart, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StreakData } from "@/hooks/useStreaks";

interface StreakItemProps {
  icon: React.ElementType;
  label: string;
  count: number;
  color: string;
  delay: number;
}

function StreakItem({ icon: Icon, label, count, color, delay }: StreakItemProps) {
  const isActive = count > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 300 }}
      className={cn(
        "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all",
        isActive
          ? "bg-gradient-to-b from-card to-card/80 border-primary/20 shadow-md"
          : "bg-card/50 border-border/50"
      )}
    >
      <div
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full transition-all",
          isActive ? color : "bg-muted"
        )}
      >
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full opacity-30"
            style={{ background: `radial-gradient(circle, hsl(var(--streak-fire) / 0.4), transparent)` }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
      </div>
      <div className="text-center">
        <p className={cn("text-lg font-bold leading-none", isActive ? "text-foreground" : "text-muted-foreground")}>
          {count}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

interface StreakCardProps {
  streaks: StreakData;
}

export default function StreakCard({ streaks }: StreakCardProps) {
  if (streaks.isLoading) {
    return (
      <div className="rounded-2xl bg-card p-4 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-3" />
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const maxStreak = streaks.longestStreak;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl bg-card border border-border/50 p-4 shadow-md"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-destructive" />
          <h3 className="font-serif text-sm font-semibold text-foreground">Sequência Espiritual</h3>
        </div>
        {maxStreak > 0 && (
          <span className="text-xs font-medium text-muted-foreground">
            Melhor: {maxStreak} dias 🔥
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <StreakItem icon={Heart} label="Oração" count={streaks.prayer} color="bg-destructive/80" delay={0.05} />
        <StreakItem icon={BookOpen} label="Leitura" count={streaks.reading} color="bg-primary" delay={0.1} />
        <StreakItem icon={Flame} label="Devocional" count={streaks.devotional} color="bg-warning" delay={0.15} />
        <StreakItem icon={Users} label="Presença" count={streaks.attendance} color="bg-info" delay={0.2} />
      </div>
    </motion.div>
  );
}
