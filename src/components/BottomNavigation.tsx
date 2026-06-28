import { forwardRef } from "react";
import { Home, BookOpen, Calendar, User, Users, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Início", href: "/dashboard" },
  { icon: BookOpen, label: "Estudos", href: "/estudos" },
  { icon: null, label: "AI", href: "__fab__" }, // center FAB slot
  { icon: Users, label: "Comunidade", href: "/comunidade" },
  { icon: User, label: "Perfil", href: "/perfil" },
];

const BottomNavigation = forwardRef<HTMLElement>(function BottomNavigation(_, ref) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleFab = () => {
    // Dispatch a global event so AIFloatingButton or assistant can open
    window.dispatchEvent(new CustomEvent("open-ai-assistant"));
  };

  return (
    <nav
      ref={ref}
      className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 12px))",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      <div className="mx-auto max-w-lg px-3">
        <div
          className={cn(
            "pointer-events-auto relative flex items-end justify-around",
            "rounded-[2rem] bg-card/85 backdrop-blur-2xl",
            "border border-border/60",
            "shadow-[0_10px_40px_-12px_hsl(110_25%_18%/0.20)]",
            "px-2 py-1.5"
          )}
        >
          {navItems.map((item) => {
            // FAB center button
            if (item.href === "__fab__") {
              return (
                <motion.button
                  key="fab"
                  onClick={handleFab}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  aria-label="Assistente espiritual"
                  className={cn(
                    "relative -mt-7 flex h-14 w-14 items-center justify-center",
                    "rounded-full text-primary-foreground",
                    "shadow-[0_8px_24px_-6px_hsl(110_30%_30%/0.45)]",
                    "ring-4 ring-background"
                  )}
                  style={{ background: "var(--gradient-hope)" }}
                >
                  <span
                    className="absolute inset-0 rounded-full opacity-60 blur-md"
                    style={{ background: "var(--gradient-hope)" }}
                  />
                  <Sparkles className="relative h-6 w-6" strokeWidth={2.2} />
                </motion.button>
              );
            }

            const Icon = item.icon!;
            const isActive = location.pathname === item.href;

            return (
              <motion.button
                key={item.href}
                onClick={() => navigate(item.href)}
                whileTap={{ scale: 0.88 }}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-0.5",
                  "min-h-[52px] px-2 py-1 rounded-2xl",
                  "transition-colors select-none"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="navActivePill"
                    className="absolute inset-1 rounded-2xl bg-primary/12"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative h-[22px] w-[22px] transition-all",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
                <span
                  className={cn(
                    "relative text-[10px] leading-none transition-all",
                    isActive ? "font-semibold text-primary" : "font-medium text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});

export default BottomNavigation;
