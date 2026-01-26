import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(href)}
      className="group relative w-full overflow-hidden rounded-xl sm:rounded-2xl bg-card p-3 sm:p-4 text-left shadow-md transition-all hover:shadow-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      
      <div className="relative z-10 flex items-start gap-2 sm:gap-3">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <h3 className="font-serif text-sm sm:text-base font-semibold text-foreground truncate">{title}</h3>
            {badge && (
              <span className="rounded-full bg-gold/20 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium text-gold shrink-0">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-1">{description}</p>
        </div>
      </div>
    </motion.button>
  );
};

export default FeatureCard;
