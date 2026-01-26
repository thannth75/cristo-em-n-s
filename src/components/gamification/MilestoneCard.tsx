import { motion } from "framer-motion";
import { CheckCircle2, Lock, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface MilestoneCardProps {
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: number; // 0-100
}

export function MilestoneCard({
  name,
  description,
  icon,
  xpReward,
  isUnlocked,
  unlockedAt,
  progress,
}: MilestoneCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative rounded-2xl p-4 shadow-md transition-all",
        isUnlocked
          ? "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30"
          : "bg-card border border-border opacity-75"
      )}
    >
      {/* Status indicator */}
      <div className="absolute -top-2 -right-2">
        {isUnlocked ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground shadow-md">
            <Lock className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl text-2xl",
            isUnlocked ? "bg-primary/20" : "bg-muted grayscale"
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "font-semibold truncate",
              isUnlocked ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>

          {/* Reward */}
          <div className="flex items-center gap-1 mt-2">
            <Gift className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium text-primary">+{xpReward} XP</span>
          </div>

          {/* Unlocked date or progress */}
          {isUnlocked && unlockedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Desbloqueado em {new Date(unlockedAt).toLocaleDateString("pt-BR")}
            </p>
          )}
          {!isUnlocked && progress !== undefined && progress > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Progresso</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
