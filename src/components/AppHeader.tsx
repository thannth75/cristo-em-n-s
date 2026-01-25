import { Bell, Menu, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo-vida-em-cristo.png";
import { Badge } from "@/components/ui/badge";

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
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo em destaque */}
          <motion.button
            onClick={() => navigate("/dashboard")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <div className="absolute inset-0 blur-lg bg-primary/20 rounded-full scale-125" />
            <img
              src={logo}
              alt="Vida em Cristo"
              className="relative h-12 w-auto drop-shadow-md"
            />
          </motion.button>
          
          <div>
            <p className="text-sm text-muted-foreground">{getGreeting()},</p>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-semibold text-foreground">{userName}</h1>
              {isAdmin && (
                <Badge className="bg-destructive/10 text-destructive text-xs px-1.5 py-0">
                  <Shield className="h-3 w-3" />
                </Badge>
              )}
              {isLeader && !isAdmin && (
                <Badge className="bg-gold/20 text-gold text-xs px-1.5 py-0">
                  <Shield className="h-3 w-3" />
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
