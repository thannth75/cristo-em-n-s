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
      className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-lg glow-green"
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10" />
      <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-accent/30" />
      
      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Versículo do Dia</span>
        </div>
        
        <blockquote className="mb-4 font-serif text-lg italic leading-relaxed text-foreground">
          "{verse}"
        </blockquote>
        
        <p className="text-right font-semibold text-primary">
          — {reference}
        </p>
      </div>
    </motion.div>
  );
};

export default VerseCard;
