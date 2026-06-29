import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, BookOpen, Heart, MessageCircle, Sparkles, Brain, PenLine } from "lucide-react";
import type { WeeklySummary } from "@/hooks/useWeeklySummary";

interface MetricProps {
  icon: React.ElementType;
  label: string;
  value: number;
  delay: number;
}

function Metric({ icon: Icon, label, value, delay }: MetricProps) {
  const active = value > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative flex items-center gap-2.5 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30 p-2"
    >
      <div
        className={
          "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 " +
          (active ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground")
        }
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <p className={"font-serif text-sm font-bold " + (active ? "text-foreground" : "text-muted-foreground/60")}>
          {value}
        </p>
      </div>
    </motion.div>
  );
}

export default function WeeklySummaryCard({ summary }: { summary: WeeklySummary }) {
  if (summary.isLoading) {
    return (
      <div className="rounded-2xl bg-card/60 backdrop-blur-md p-4 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded mb-3" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const totalActions =
    summary.devotionalsCompleted +
    summary.prayersCreated +
    summary.readingsCompleted +
    summary.postsCreated +
    summary.quizzesCompleted +
    summary.journalEntries;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl bg-card/70 backdrop-blur-xl border border-border/50 p-4 shadow-sm"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -left-10 h-44 w-44 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-serif text-sm font-semibold text-foreground">Resumo Semanal</h3>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-primary/15 to-warning/15 px-2.5 py-1 border border-primary/20">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="font-bold text-xs text-primary">+{summary.xpEarned} XP</span>
        </div>
      </div>

      <div className="relative grid grid-cols-3 gap-2">
        <Metric icon={BookOpen} label="Devocionais" value={summary.devotionalsCompleted} delay={0.05} />
        <Metric icon={Heart} label="Orações" value={summary.prayersCreated} delay={0.08} />
        <Metric icon={BookOpen} label="Leituras" value={summary.readingsCompleted} delay={0.11} />
        <Metric icon={MessageCircle} label="Posts" value={summary.postsCreated} delay={0.14} />
        <Metric icon={Brain} label="Quizzes" value={summary.quizzesCompleted} delay={0.17} />
        <Metric icon={PenLine} label="Diário" value={summary.journalEntries} delay={0.2} />
      </div>

      {totalActions === 0 && (
        <p className="relative mt-3 text-xs text-muted-foreground text-center italic">
          Que tal começar sua semana espiritual? 🙏
        </p>
      )}
    </motion.div>
  );
}
