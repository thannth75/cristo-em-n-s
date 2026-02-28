import { motion } from "framer-motion";
import { TrendingUp, BookOpen, Heart, MessageCircle, Sparkles } from "lucide-react";
import type { WeeklySummary } from "@/hooks/useWeeklySummary";

interface MetricProps {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
}

function Metric({ icon: Icon, label, value, suffix }: MetricProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {value}{suffix}
        </p>
      </div>
    </div>
  );
}

export default function WeeklySummaryCard({ summary }: { summary: WeeklySummary }) {
  if (summary.isLoading) {
    return (
      <div className="rounded-2xl bg-card p-4 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const totalActions = summary.devotionalsCompleted + summary.prayersCreated + summary.readingsCompleted + summary.postsCreated;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl bg-card border border-border/50 p-4 shadow-md"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-serif text-sm font-semibold text-foreground">Resumo Semanal</h3>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Sparkles className="h-3 w-3 text-gold" />
          <span className="font-bold text-foreground">+{summary.xpEarned}</span>
          <span className="text-muted-foreground">XP</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric icon={BookOpen} label="Devocionais" value={summary.devotionalsCompleted} />
        <Metric icon={Heart} label="Orações" value={summary.prayersCreated} />
        <Metric icon={BookOpen} label="Leituras" value={summary.readingsCompleted} />
        <Metric icon={MessageCircle} label="Posts" value={summary.postsCreated} />
      </div>

      {totalActions === 0 && (
        <p className="mt-3 text-xs text-muted-foreground text-center italic">
          Que tal começar sua semana espiritual? 🙏
        </p>
      )}
    </motion.div>
  );
}
