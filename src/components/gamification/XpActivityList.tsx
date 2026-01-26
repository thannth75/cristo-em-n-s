import { motion } from "framer-motion";
import { Sparkles, Clock, Infinity } from "lucide-react";

interface XpActivity {
  id: string;
  activity_key: string;
  name: string;
  description: string | null;
  xp_value: number;
  daily_limit: number | null;
  icon: string;
}

interface XpActivityListProps {
  activities: XpActivity[];
}

export function XpActivityList({ activities }: XpActivityListProps) {
  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center justify-between rounded-xl bg-card p-3 shadow-sm border border-border"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-lg">
              {activity.icon}
            </div>
            <div>
              <h4 className="font-medium text-foreground text-sm">{activity.name}</h4>
              {activity.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {activity.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-primary">
              <Sparkles className="h-3 w-3" />
              <span className="font-bold text-sm">+{activity.xp_value}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              {activity.daily_limit ? (
                <>
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">{activity.daily_limit}x/dia</span>
                </>
              ) : (
                <>
                  <Infinity className="h-3 w-3" />
                  <span className="text-xs">Ilimitado</span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
