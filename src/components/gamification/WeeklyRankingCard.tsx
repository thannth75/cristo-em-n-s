import { motion } from "framer-motion";
import { Crown, Medal, TrendingUp } from "lucide-react";

interface RankingUser {
  user_id: string;
  full_name: string;
  weekly_xp: number;
  rank: number;
  avatar_url?: string | null;
}

interface WeeklyRankingCardProps {
  topUsers: RankingUser[];
  currentUserId?: string;
  currentUserRank?: RankingUser | null;
}

export function WeeklyRankingCard({
  topUsers,
  currentUserId,
  currentUserRank,
}: WeeklyRankingCardProps) {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg">
            <Crown className="h-4 w-4 text-white" />
          </div>
        );
      case 2:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-400 shadow-lg">
            <Medal className="h-4 w-4 text-white" />
          </div>
        );
      case 3:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-orange-600 shadow-lg">
            <Medal className="h-4 w-4 text-white" />
          </div>
        );
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-muted-foreground">
            {rank}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card p-5 shadow-md"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Ranking Semanal</h3>
        </div>
        <span className="text-xs text-muted-foreground">XP ganho esta semana</span>
      </div>

      {topUsers.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Nenhuma atividade esta semana</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topUsers.slice(0, 5).map((user, index) => (
            <motion.div
              key={user.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
                user.user_id === currentUserId
                  ? "bg-primary/10 ring-2 ring-primary"
                  : user.rank <= 3
                  ? "bg-accent/50"
                  : "bg-muted/50"
              }`}
            >
              {getRankBadge(user.rank)}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif font-semibold text-primary">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {user.full_name}
                  {user.user_id === currentUserId && (
                    <span className="ml-1 text-xs text-primary">(você)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  +{user.weekly_xp.toLocaleString()} XP
                </p>
              </div>
              {user.rank <= 3 && (
                <span className="text-lg">
                  {user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : "🥉"}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Current user position if not in top 5 */}
      {currentUserRank && currentUserRank.rank > 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 pt-4 border-t border-border"
        >
          <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-3">
            {getRankBadge(currentUserRank.rank)}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-serif font-semibold text-primary">
              {currentUserRank.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {currentUserRank.full_name}
                <span className="ml-1 text-xs text-primary">(você)</span>
              </p>
              <p className="text-xs text-muted-foreground">
                +{currentUserRank.weekly_xp.toLocaleString()} XP
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
