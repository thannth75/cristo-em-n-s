import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Heart, Sun, MessageCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  href: string;
  tint: string; // tailwind color tone class for background tint
}

const actions: QuickAction[] = [
  { label: "Bíblia", icon: BookOpen, href: "/biblia", tint: "from-[hsl(110_30%_88%)] to-[hsl(110_25%_80%)]" },
  { label: "Oração", icon: Heart, href: "/momento-com-deus", tint: "from-[hsl(25_60%_90%)] to-[hsl(25_55%_82%)]" },
  { label: "Devocional", icon: Sun, href: "/devocional", tint: "from-[hsl(38_70%_88%)] to-[hsl(38_60%_80%)]" },
  { label: "Comunidade", icon: MessageCircle, href: "/comunidade", tint: "from-[hsl(260_30%_90%)] to-[hsl(260_25%_82%)]" },
];

const QuickActionsRow = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid grid-cols-4 gap-2"
    >
      {actions.map((a, i) => {
        const Icon = a.icon;
        return (
          <motion.button
            key={a.href}
            onClick={() => navigate(a.href)}
            whileTap={{ scale: 0.92 }}
            whileHover={{ y: -3 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3",
              "border border-border/40 bg-card/70 backdrop-blur-sm",
              "shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
            )}
          >
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner",
                a.tint
              )}
            >
              <Icon className="h-5 w-5 text-foreground/75" strokeWidth={2.1} />
            </div>
            <span className="text-[10px] font-semibold text-foreground/80 leading-none">
              {a.label}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
};

export default QuickActionsRow;
