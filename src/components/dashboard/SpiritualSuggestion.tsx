import { motion } from "framer-motion";
import { Lightbulb, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { StreakData } from "@/hooks/useStreaks";
import type { WeeklySummary } from "@/hooks/useWeeklySummary";

interface Suggestion {
  message: string;
  action: string;
  href: string;
  emoji: string;
}

function getSuggestion(streaks: StreakData, summary: WeeklySummary): Suggestion {
  // Priority: fix broken streaks > encourage weak areas > celebrate

  if (streaks.devotional === 0 && summary.devotionalsCompleted === 0) {
    return {
      message: "Comece o dia com o devocional!",
      action: "Ler devocional",
      href: "/devocional",
      emoji: "📖",
    };
  }

  if (streaks.prayer === 0) {
    return {
      message: "Não esqueça de orar hoje",
      action: "Ir para orações",
      href: "/oracoes",
      emoji: "🙏",
    };
  }

  if (streaks.reading === 0 && summary.readingsCompleted === 0) {
    return {
      message: "Continue seu plano de leitura bíblica",
      action: "Ler agora",
      href: "/plano-leitura",
      emoji: "📚",
    };
  }

  if (summary.postsCreated === 0) {
    return {
      message: "Compartilhe algo edificante com a comunidade",
      action: "Criar post",
      href: "/comunidade",
      emoji: "✨",
    };
  }

  // Celebrate!
  return {
    message: "Você está firme na caminhada! Continue assim!",
    action: "Ver conquistas",
    href: "/conquistas",
    emoji: "🏆",
  };
}

interface Props {
  streaks: StreakData;
  summary: WeeklySummary;
}

export default function SpiritualSuggestion({ streaks, summary }: Props) {
  const navigate = useNavigate();

  if (streaks.isLoading || summary.isLoading) return null;

  const suggestion = getSuggestion(streaks, summary);

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      onClick={() => navigate(suggestion.href)}
      className="w-full rounded-xl gradient-spiritual border border-primary/10 p-3.5 flex items-center gap-3 text-left touch-feedback group"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg shrink-0 group-hover:bg-primary/20 transition-colors">
        {suggestion.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Lightbulb className="h-3 w-3 text-gold" />
          <span className="text-[10px] font-medium text-gold uppercase tracking-wide">Sugestão</span>
        </div>
        <p className="text-sm font-medium text-foreground truncate">{suggestion.message}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
    </motion.button>
  );
}
