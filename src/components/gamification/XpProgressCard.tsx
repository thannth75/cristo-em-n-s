import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp } from "lucide-react";

interface XpProgressCardProps {
  totalXp: number;
  currentLevel: number;
  levelTitle: string;
  levelIcon: string;
  progressPercent: number;
  xpToNextLevel: number;
  nextLevelTitle?: string;
}

export function XpProgressCard({
  totalXp,
  currentLevel,
  levelTitle,
  levelIcon,
  progressPercent,
  xpToNextLevel,
  nextLevelTitle,
}: XpProgressCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background p-5 shadow-lg border border-primary/20"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 text-2xl">
            {levelIcon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-primary uppercase tracking-wider">
                Nível {currentLevel}
              </span>
              <TrendingUp className="h-3 w-3 text-primary" />
            </div>
            <h3 className="font-serif text-xl font-bold text-foreground">{levelTitle}</h3>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-2xl font-bold">{totalXp.toLocaleString()}</span>
          </div>
          <span className="text-xs text-muted-foreground">XP Total</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Progresso para o próximo nível</span>
          <span className="font-medium text-primary">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-3" />
        {nextLevelTitle && xpToNextLevel > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Faltam <span className="font-semibold text-primary">{xpToNextLevel} XP</span> para{" "}
            <span className="font-medium">{nextLevelTitle}</span>
          </p>
        )}
      </div>
    </motion.div>
  );
}
