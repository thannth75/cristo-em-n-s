import { useMemo } from "react";
import { motion } from "framer-motion";
import { Heart, BookOpen, Flame, Brain, PenLine, MessageCircle, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeeklySummary } from "@/hooks/useWeeklySummary";

interface Props {
  summary: WeeklySummary;
}

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const DAILY_QUESTS = [
  { key: "prayer", label: "Orar", icon: Heart, tint: "text-destructive", bg: "bg-destructive/10" },
  { key: "reading", label: "Ler", icon: BookOpen, tint: "text-primary", bg: "bg-primary/10" },
  { key: "devotional", label: "Devocional", icon: Flame, tint: "text-warning", bg: "bg-warning/10" },
  { key: "journal", label: "Diário", icon: PenLine, tint: "text-info", bg: "bg-info/10" },
] as const;

export default function WeeklyJourneyCard({ summary }: Props) {
  const todayIdx = new Date().getDay();

  const completedToday = useMemo(() => {
    // Approximation: treat any activity counted this week proportional
    const total = summary.devotionalsCompleted + summary.prayersCreated + summary.readingsCompleted + summary.journalEntries;
    return Math.min(4, Math.ceil(total / 7));
  }, [summary]);

  if (summary.isLoading) {
    return (
      <div className="rounded-2xl bg-card/60 backdrop-blur-md p-4 animate-pulse h-40" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="relative overflow-hidden rounded-2xl bg-card/70 backdrop-blur-xl border border-border/50 p-4 shadow-sm"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 left-0 h-44 w-44 rounded-full bg-warning/10 blur-3xl"
      />

      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-semibold text-foreground">Jornada da Semana</h3>
            <p className="text-[10px] text-muted-foreground">{completedToday}/4 práticas hoje</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
          <span className="text-[10px] font-semibold text-primary">{DAY_LABELS[todayIdx]}</span>
        </div>
      </div>

      {/* Week ribbon */}
      <div className="relative mb-3 flex items-center justify-between">
        {DAY_LABELS.map((d, i) => {
          const isToday = i === todayIdx;
          const isPast = i < todayIdx;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.04 * i, type: "spring", stiffness: 280 }}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold transition-all",
                  isToday
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_18px_hsl(var(--primary)/0.5)]"
                    : isPast
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-card/60 text-muted-foreground border-border/40"
                )}
              >
                {isPast ? <Check className="h-3 w-3" /> : i + 1}
              </motion.div>
              <span
                className={cn(
                  "text-[9px]",
                  isToday ? "text-primary font-semibold" : "text-muted-foreground/60"
                )}
              >
                {d}
              </span>
            </div>
          );
        })}
      </div>

      {/* Daily quests */}
      <div className="relative grid grid-cols-4 gap-1.5">
        {DAILY_QUESTS.map((q, i) => {
          const done = i < completedToday;
          const Icon = q.icon;
          return (
            <motion.div
              key={q.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i }}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl border p-2 backdrop-blur-sm transition-all",
                done
                  ? "bg-card/80 border-primary/30"
                  : "bg-card/40 border-border/30"
              )}
            >
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full",
                  done ? q.bg : "bg-muted/40"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", done ? q.tint : "text-muted-foreground/60")} />
              </div>
              <span
                className={cn(
                  "text-[9px] font-medium",
                  done ? "text-foreground" : "text-muted-foreground/60"
                )}
              >
                {q.label}
              </span>
              {done && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
