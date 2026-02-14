import { Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import logo from "@/assets/logo-vida-em-cristo.png";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationCenter from "@/components/NotificationCenter";

interface AppHeaderProps {
  userName?: string;
  onMenuClick?: () => void;
}

const AppHeader = ({ userName = "Jovem", onMenuClick }: AppHeaderProps) => {
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
      className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl"
      style={{
        paddingTop: 'max(0.5rem, env(safe-area-inset-top, 8px))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Logo */}
          <motion.button
            onClick={() => navigate("/dashboard")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative shrink-0"
          >
            <div className="absolute inset-0 blur-lg bg-primary/20 rounded-full scale-125" />
            <img
              src={logo}
              alt="Vida em Cristo"
              className="relative h-9 sm:h-12 w-auto drop-shadow-md"
            />
          </motion.button>
          
          {/* Profile Avatar + Name */}
          <motion.button
            onClick={() => navigate("/perfil")}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 min-w-0"
          >
            <div className="relative shrink-0">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-primary/30">
                <AvatarImage src={profile?.avatar_url || undefined} alt={userName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Level badge on avatar */}
              {gamification.currentLevel > 0 && (
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary text-[9px] sm:text-[10px] font-bold text-primary-foreground ring-2 ring-card">
                  {gamification.currentLevel}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{getGreeting()},</p>
              <div className="flex items-center gap-1">
                <h1 className="font-serif text-sm sm:text-base font-semibold text-foreground truncate max-w-[90px] sm:max-w-[140px]">{userName}</h1>
                {isAdmin && (
                  <Badge className="bg-destructive/10 text-destructive text-[9px] px-1 py-0 shrink-0">
                    <Shield className="h-2.5 w-2.5" />
                  </Badge>
                )}
                {isLeader && !isAdmin && (
                  <Badge className="bg-accent/50 text-accent-foreground text-[9px] px-1 py-0 shrink-0">
                    <Shield className="h-2.5 w-2.5" />
                  </Badge>
                )}
              </div>
            </div>
          </motion.button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <NotificationCenter />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
