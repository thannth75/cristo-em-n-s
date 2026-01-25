import { Bell, Menu } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo-vida-em-cristo.png";

interface AppHeaderProps {
  userName?: string;
  onMenuClick?: () => void;
}

const AppHeader = ({ userName = "Jovem", onMenuClick }: AppHeaderProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <div>
            <p className="text-sm text-muted-foreground">{getGreeting()},</p>
            <h1 className="font-serif text-lg font-semibold text-foreground">{userName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.img
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            src={logo}
            alt="Vida em Cristo"
            className="h-10 w-auto"
          />
          <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-destructive" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
