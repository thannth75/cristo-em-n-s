import { motion } from "framer-motion";
import { LucideIcon, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  delay?: number;
  badge?: string;
}

const FeatureCard = ({ title, description, icon: Icon, href, delay = 0, badge }: FeatureCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(href)}
      className="group relative w-full overflow-hidden rounded-2xl border border-border/50 bg-card p-3 text-left shadow-[var(--shadow-sm)] transition-all duration-300 hover:shadow-[var(--shadow-md)] hover:border-primary/30 touch-feedback"
    >
      {/* Animated gradient sheen */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"
        style={{ background: "var(--gradient-spiritual)" }}
      />

      <div className="relative z-10 flex items-center gap-3">
        <div className="relative shrink-0">
          {/* Glow halo */}
          <div className="absolute inset-0 rounded-2xl bg-primary/15 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-105">
            <Icon className="h-[18px] w-[18px] text-primary transition-transform duration-300 group-hover:rotate-[-4deg]" strokeWidth={2.1} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-serif text-[13px] font-semibold text-foreground truncate leading-tight">
              {title}
            </h3>
            {badge && (
              <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-semibold text-gold shrink-0 leading-none">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">{description}</p>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-all duration-300 group-hover:text-primary group-hover:translate-x-0.5 shrink-0" />
      </div>
    </motion.button>
  );
};

export default FeatureCard;
