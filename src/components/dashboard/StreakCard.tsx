import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Flame, BookOpen, Heart, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StreakData } from "@/hooks/useStreaks";

interface StreakItemProps {
  icon: React.ElementType;
  label: string;
  count: number;
  tint: string;
  delay: number;
}

const StreakItem = forwardRef<HTMLDivElement, StreakItemProps>(function StreakItem(
  { icon: Icon, label, count, tint, delay },
  ref
) {
  const isActive = count > 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 280, damping: 22 }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "group relative overflow-hidden flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border backdrop-blur-md transition-all",
        isActive
          ? "bg-card/70 border-primary/25 shadow-[0_4px_18px_-6px_hsl(var(--primary)/0.25)]"
          : "bg-card/40 border-border/40"
      )}
    >
      {isActive && (
        <div
          aria-hidden
          className={cn("pointer-events-none absolute -inset-6 opacity-50 blur-2xl", tint)}
        />
      )}
      <div
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-full border transition-all",
          isActive
            ? "bg-gradient-to-br from-card to-card/60 border-primary/30"
            : "bg-muted/60 border-border/40"
        )}
      >
        {isActive && (
          <motion.span
            className={cn("absolute inset-0 rounded-full", tint, "opacity-40")}
            animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <Icon
          className={cn(
            "relative h-5 w-5 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground"
          )}
        />
      </div>
      <div className="relative text-center">
        <p
          className={cn(
            "font-serif text-lg font-bold leading-none tracking-tight",
            isActive ? "text-foreground" : "text-muted-foreground/60"
          )}
        >
          {count}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
});

interface StreakCardProps {
  streaks: StreakData;
}

export default function StreakCard({ streaks }: StreakCardProps) {
  if (streaks.isLoading) {
    return (
      <div className="rounded-2xl bg-card/60 backdrop-blur-md p-4 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-3" />
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const maxStreak = streaks.longestStreak;
  const today = new Date();
  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];
  const todayIdx = today.getDay();
  const bestCurrent = Math.max(streaks.prayer, streaks.reading, streaks.devotional, streaks.attendance);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-card/70 backdrop-blur-xl border border-border/50 p-4 shadow-sm"
    >
      {/* Aurora glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-warning/10 blur-3xl"
      />

      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/10">
            <Flame className="h-4 w-4 text-destructive" />
          </div>
          <h3 className="font-serif text-sm font-semibold text-foreground">Sequência Espiritual</h3>
        </div>
        {maxStreak > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5">
            <Sparkles className="h-3 w-3 text-warning" />
            <span className="text-[10px] font-semibold text-warning">Recorde {maxStreak}d</span>
          </div>
        )}
      </div>

      {/* Weekly dots */}
      <div className="relative mb-3 flex items-center justify-between px-1">
        {weekDays.map((d, i) => {
          const offset = (todayIdx - i + 7) % 7;
          const within = offset < bestCurrent;
          const isToday = i === todayIdx;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.05 * i, type: "spring", stiffness: 300 }}
                className={cn(
                  "h-2 w-2 rounded-full",
                  within
                    ? "bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)]"
                    : "bg-muted-foreground/20",
                  isToday && "ring-2 ring-primary/40 ring-offset-1 ring-offset-card"
                )}
              />
              <span
                className={cn(
                  "text-[9px] font-medium",
                  isToday ? "text-primary" : "text-muted-foreground/60"
                )}
              >
                {d}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative grid grid-cols-4 gap-2">
        <StreakItem icon={Heart} label="Oração" count={streaks.prayer} tint="bg-destructive/40" delay={0.05} />
        <StreakItem icon={BookOpen} label="Leitura" count={streaks.reading} tint="bg-primary/40" delay={0.1} />
        <StreakItem icon={Flame} label="Devocional" count={streaks.devotional} tint="bg-warning/40" delay={0.15} />
        <StreakItem icon={Users} label="Presença" count={streaks.attendance} tint="bg-info/40" delay={0.2} />
      </div>
    </motion.div>
  );
}
