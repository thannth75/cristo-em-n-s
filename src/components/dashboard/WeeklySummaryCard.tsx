import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, BookOpen, Heart, MessageCircle, Sparkles, Brain, PenLine } from "lucide-react";
import type { WeeklySummary } from "@/hooks/useWeeklySummary";

interface MetricProps {
  icon: React.ElementType;
  label: string;
  value: number;
}

function Metric({ icon: Icon, label, value }: MetricProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function WeeklySummaryCard({ summary }: { summary: WeeklySummary }) {
  if (summary.isLoading) {
    return (
      <div className="rounded-2xl bg-card p-4 animate-pulse">
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
      className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-serif text-sm font-semibold text-foreground">Resumo Semanal</h3>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="font-bold text-xs text-primary">+{summary.xpEarned} XP</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Metric icon={BookOpen} label="Devocionais" value={summary.devotionalsCompleted} />
        <Metric icon={Heart} label="Orações" value={summary.prayersCreated} />
        <Metric icon={BookOpen} label="Leituras" value={summary.readingsCompleted} />
        <Metric icon={MessageCircle} label="Posts" value={summary.postsCreated} />
        <Metric icon={Brain} label="Quizzes" value={summary.quizzesCompleted} />
        <Metric icon={PenLine} label="Diário" value={summary.journalEntries} />
      </div>

      {totalActions === 0 && (
        <p className="mt-3 text-xs text-muted-foreground text-center italic">
          Que tal começar sua semana espiritual? 🙏
        </p>
      )}
    </motion.div>
  );
}
