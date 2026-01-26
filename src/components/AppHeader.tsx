import { Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo-vida-em-cristo.png";
import { Badge } from "@/components/ui/badge";
import NotificationCenter from "@/components/NotificationCenter";

interface AppHeaderProps {
  userName?: string;
  onMenuClick?: () => void;
}

const AppHeader = ({ userName = "Jovem", onMenuClick }: AppHeaderProps) => {
  const navigate = useNavigate();
  const { isAdmin, isLeader } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <header 
      className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-xl"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Logo em destaque */}
          <motion.button
            onClick={() => navigate("/dashboard")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative shrink-0 touch-feedback"
          >
            <div className="absolute inset-0 blur-lg bg-primary/20 rounded-full scale-125" />
            <img
              src={logo}
              alt="Vida em Cristo"
              className="relative h-9 sm:h-12 w-auto drop-shadow-md"
            />
          </motion.button>
          
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">{getGreeting()},</p>
            <div className="flex items-center gap-1 sm:gap-2">
              <h1 className="font-serif text-sm sm:text-lg font-semibold text-foreground truncate max-w-[100px] sm:max-w-none">{userName}</h1>
              {isAdmin && (
                <Badge className="bg-destructive/10 text-destructive text-[10px] sm:text-xs px-1 sm:px-1.5 py-0 shrink-0">
                  <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </Badge>
              )}
              {isLeader && !isAdmin && (
                <Badge className="bg-gold/20 text-gold text-[10px] sm:text-xs px-1 sm:px-1.5 py-0 shrink-0">
                  <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <NotificationCenter />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
