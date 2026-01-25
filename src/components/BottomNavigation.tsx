import { Home, BookOpen, Calendar, User, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl safe-area-inset-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.href}
              onClick={() => navigate(item.href)}
              whileTap={{ scale: 0.9 }}
              className="relative flex flex-1 flex-col items-center gap-1 py-2"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-3 -top-2 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Icon
                  className={`h-6 w-6 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </motion.div>
              <span
                className={`text-xs transition-colors ${
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
