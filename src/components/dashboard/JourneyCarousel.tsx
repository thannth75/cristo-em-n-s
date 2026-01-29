import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface JourneyItem {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  badge?: string;
}

interface JourneyCarouselProps {
  items: JourneyItem[];
  onNavigate: (href: string) => void;
  className?: string;
}

export default function JourneyCarousel({ items, onNavigate, className }: JourneyCarouselProps) {
  return (
    <div className={cn("-mx-4 px-4", className)}>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.button
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => onNavigate(item.href)}
              className={cn(
                "snap-start shrink-0 w-[78%] xs:w-[70%] sm:w-[320px]",
                "rounded-2xl bg-card border border-border shadow-md",
                "p-4 text-left touch-feedback",
                "hover:bg-accent/40 transition-colors"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                    {item.badge && (
                      <span className="shrink-0 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
