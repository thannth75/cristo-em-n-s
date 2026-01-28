import { Home, BookOpen, Calendar, User, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Início", href: "/dashboard" },
  { icon: BookOpen, label: "Estudos", href: "/estudos" },
  { icon: Users, label: "Comunidade", href: "/comunidade" },
  { icon: Calendar, label: "Agenda", href: "/agenda" },
  { icon: User, label: "Perfil", href: "/perfil" },
];

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t border-border bg-card/95 backdrop-blur-xl",
        "shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
      )}
      style={{ 
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 8px))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 sm:px-4 py-1.5 sm:py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.href}
              onClick={() => navigate(item.href)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center",
                "min-h-[44px] min-w-[44px] py-1 px-1",
                "rounded-lg transition-colors",
                "-webkit-user-select-none select-none",
                isActive && "bg-primary/5"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-2 sm:inset-x-3 -top-1 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 sm:h-6 sm:w-6 transition-all",
                  isActive ? "text-primary scale-110" : "text-muted-foreground"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[10px] sm:text-xs leading-tight mt-0.5",
                  isActive ? "font-semibold text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
