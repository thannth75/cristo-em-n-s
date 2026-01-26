import { motion } from "framer-motion";
import { Cake, Gift, PartyPopper } from "lucide-react";
import { useBirthdays } from "@/hooks/useBirthdays";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const BirthdaysCard = () => {
  const { birthdays, isLoading, getTodaysBirthdays, getUpcomingBirthdays } = useBirthdays();
  
  const todaysBirthdays = getTodaysBirthdays();
  const upcomingBirthdays = getUpcomingBirthdays();
  
  const currentMonth = new Date().toLocaleString("pt-BR", { month: "long" });

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-card p-4 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (birthdays.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card p-4 shadow-md"
      >
        <div className="flex items-center gap-2 mb-3">
          <Cake className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground capitalize">Aniversariantes de {currentMonth}</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum aniversariante este mês
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card p-4 shadow-md"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Cake className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground capitalize">Aniversariantes de {currentMonth}</h3>
      </div>

      {/* Today's birthdays - highlighted */}
      {todaysBirthdays.length > 0 && (
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="mb-4 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 p-3 border border-primary/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <PartyPopper className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Hoje!</span>
          </div>
          <div className="space-y-2">
            {todaysBirthdays.map((person, index) => (
              <motion.div
                key={person.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <Avatar className="h-10 w-10 ring-2 ring-primary/50">
                  <AvatarImage src={person.avatar_url || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {person.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{person.full_name}</p>
                  <p className="text-xs text-primary">🎂 Parabéns!</p>
                </div>
                <Gift className="h-5 w-5 text-primary animate-bounce" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Upcoming birthdays */}
      {upcomingBirthdays.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium mb-2">Próximos</p>
          {upcomingBirthdays.map((person, index) => (
            <motion.div
              key={person.user_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="flex items-center gap-3 py-1"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={person.avatar_url || ""} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {person.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{person.full_name}</p>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                Dia {person.day}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* All birthdays this month summary */}
      {birthdays.length > todaysBirthdays.length + upcomingBirthdays.length && (
        <p className="text-xs text-muted-foreground text-center mt-3 pt-3 border-t border-border">
          {birthdays.length} aniversariante{birthdays.length > 1 ? "s" : ""} este mês
        </p>
      )}
    </motion.div>
  );
};

export default BirthdaysCard;
