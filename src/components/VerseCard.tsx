import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

interface VerseCardProps {
  verse: string;
  reference: string;
}

const VerseCard = ({ verse, reference }: VerseCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-card p-4 sm:p-6 shadow-lg glow-green"
    >
      <div className="absolute -right-6 sm:-right-8 -top-6 sm:-top-8 h-24 sm:h-32 w-24 sm:w-32 rounded-full bg-primary/10" />
      <div className="absolute -left-3 sm:-left-4 -bottom-3 sm:-bottom-4 h-16 sm:h-24 w-16 sm:w-24 rounded-full bg-accent/30" />
      
      <div className="relative z-10">
        <div className="mb-3 sm:mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">Versículo do Dia</span>
        </div>
        
        <blockquote className="mb-3 sm:mb-4 font-serif text-sm sm:text-lg italic leading-relaxed text-foreground">
          "{verse}"
        </blockquote>
        
        <p className="text-right text-sm sm:text-base font-semibold text-primary">
          — {reference}
        </p>
      </div>
    </motion.div>
  );
};

export default VerseCard;
