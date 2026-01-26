import { motion } from "framer-motion";
import { CheckCircle2, Circle, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface LevelDefinition {
  level_number: number;
  xp_required: number;
  title: string;
  description: string | null;
  icon: string;
  rewards: string[] | null;
}

interface LevelProgressListProps {
  levels: LevelDefinition[];
  currentLevel: number;
  totalXp: number;
}

export function LevelProgressList({ levels, currentLevel, totalXp }: LevelProgressListProps) {
  return (
    <div className="space-y-3">
      {levels.map((level, index) => {
        const isCompleted = currentLevel > level.level_number;
        const isCurrent = currentLevel === level.level_number;
        const isLocked = currentLevel < level.level_number;

        return (
          <motion.div
            key={level.level_number}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "relative rounded-xl p-4 border transition-all",
              isCompleted && "bg-primary/10 border-primary/30",
              isCurrent && "bg-gradient-to-r from-primary/20 to-primary/5 border-primary shadow-md",
              isLocked && "bg-card border-border opacity-60"
            )}
          >
            <div className="flex items-center gap-4">
              {/* Status icon */}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary/20 border-2 border-primary",
                  isLocked && "bg-muted"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <span className="text-lg">{level.icon}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-medium uppercase tracking-wider",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    Nível {level.level_number}
                  </span>
                  {isCurrent && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      Atual
                    </span>
                  )}
                </div>
                <h4
                  className={cn(
                    "font-semibold",
                    isLocked ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  {level.title}
                </h4>
                {level.description && (
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                )}

                {/* Rewards */}
                {level.rewards && level.rewards.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    <Gift className="h-3 w-3 text-primary shrink-0" />
                    {level.rewards.map((reward, i) => (
                      <span
                        key={i}
                        className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                      >
                        {reward}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* XP requirement */}
              <div className="text-right shrink-0">
                <span
                  className={cn(
                    "text-sm font-bold",
                    isCompleted || isCurrent ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {level.xp_required.toLocaleString()}
                </span>
                <p className="text-xs text-muted-foreground">XP</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
