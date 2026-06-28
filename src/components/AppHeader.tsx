import { Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import logo from "@/assets/logo-vida-em-cristo.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationCenter from "@/components/NotificationCenter";
import ThemeToggle from "@/components/ThemeToggle";

interface AppHeaderProps {
  userName?: string;
  onMenuClick?: () => void;
}

const AppHeader = ({ userName = "Jovem" }: AppHeaderProps) => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLeader } = useAuth();
  const gamification = useGamification(user?.id);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const initials = (profile?.full_name || userName)
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header
      className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/55"
      style={{
        paddingTop: "max(0.5rem, env(safe-area-inset-top, 8px))",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2.5 sm:py-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Logo */}
          <motion.button
            onClick={() => navigate("/dashboard")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative shrink-0"
            aria-label="Início"
          >
            <img
              src={logo}
              alt="Vida em Cristo"
              className="h-9 sm:h-10 w-auto drop-shadow-sm"
            />
          </motion.button>

          {/* Profile pill */}
          <motion.button
            onClick={() => navigate("/perfil")}
            whileTap={{ scale: 0.97 }}
            className="group flex items-center gap-2.5 min-w-0 rounded-full bg-card/60 backdrop-blur-sm border border-border/40 pl-1 pr-3 py-1 hover:bg-card hover:border-primary/30 transition-all shadow-sm"
          >
            <div className="relative shrink-0">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} alt={userName} className="object-cover" />
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {gamification.currentLevel > 0 && (
                <span
                  className="absolute -bottom-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-primary-foreground ring-2 ring-background shadow-sm"
                  style={{ background: "var(--gradient-hope)" }}
                >
                  {gamification.currentLevel}
                </span>
              )}
            </div>
            <div className="min-w-0 hidden xs:block text-left">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
                {getGreeting()}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <h1 className="font-serif text-sm font-semibold text-foreground truncate max-w-[120px] sm:max-w-[160px] leading-tight">
                  {userName}
                </h1>
                {(isAdmin || isLeader) && (
                  <Shield
                    className={`h-3 w-3 shrink-0 ${
                      isAdmin ? "text-destructive" : "text-primary"
                    }`}
                  />
                )}
              </div>
            </div>
          </motion.button>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <ThemeToggle />
          <NotificationCenter />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
