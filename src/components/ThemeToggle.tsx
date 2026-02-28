import { Moon, Sun, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const next = () => {
    const order = ["light", "dark", "system"] as const;
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const label = theme === "dark" ? "Escuro" : theme === "light" ? "Claro" : "Sistema";

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={next}
      className={cn(
        "flex items-center justify-center h-9 w-9 rounded-full",
        "bg-secondary/80 hover:bg-secondary text-foreground",
        "transition-colors touch-target",
        className
      )}
      title={`Tema: ${label}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className="h-4 w-4" />
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
