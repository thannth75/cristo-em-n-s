import { Home, BookOpen, Calendar, User, MessageCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "Início", href: "/dashboard" },
  { icon: BookOpen, label: "Estudos", href: "/estudos" },
  { icon: MessageCircle, label: "Chat", href: "/comunidade" },
  { icon: Calendar, label: "Agenda", href: "/agenda" },
  { icon: User, label: "Perfil", href: "/perfil" },
];

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 sm:px-4 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.href}
              onClick={() => navigate(item.href)}
              whileTap={{ scale: 0.9 }}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-1.5 touch-feedback no-select min-w-0"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-2 sm:inset-x-3 -top-1.5 h-0.5 sm:h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Icon
                  className={`h-5 w-5 sm:h-6 sm:w-6 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </motion.div>
              <span
                className={`text-[10px] sm:text-xs transition-colors leading-tight truncate max-w-full ${
                  isActive ? "font-semibold text-primary" : "text-muted-foreground"
                }`}
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
