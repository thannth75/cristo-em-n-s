import { motion } from "framer-motion";
import { BookOpen, Share2 } from "lucide-react";
import { toast } from "sonner";

interface VerseCardProps {
  verse: string;
  reference: string;
}

const VerseCard = ({ verse, reference }: VerseCardProps) => {
  const handleShare = async () => {
    const text = `"${verse}" — ${reference}\n\nVida em Cristo 🕊️`;
    try {
      if (navigator.share) {
        await navigator.share({ text, title: "Versículo do Dia" });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Versículo copiado!");
      }
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-border/40 p-5 sm:p-6"
      style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-soft)" }}
    >
      {/* Mesh background */}
      <div
        className="absolute inset-0 opacity-70 pointer-events-none"
        style={{ background: "var(--gradient-mesh)" }}
      />

      {/* Decorative orbs */}
      <motion.div
        className="absolute -right-10 -top-10 h-36 w-36 rounded-full"
        style={{ background: "var(--gradient-hope)", opacity: 0.18, filter: "blur(20px)" }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -left-8 -bottom-8 h-28 w-28 rounded-full"
        style={{ background: "var(--gradient-gold)", opacity: 0.15, filter: "blur(18px)" }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-card/80 backdrop-blur-sm shadow-sm">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80 leading-none">
                Palavra do dia
              </p>
              <span className="text-[11px] text-muted-foreground">Inspiração diária</span>
            </div>
          </div>

          <button
            onClick={handleShare}
            aria-label="Compartilhar versículo"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        <blockquote className="mb-3 font-serif text-base sm:text-lg italic leading-relaxed text-foreground text-balance">
          <span className="font-serif text-3xl leading-none text-primary/30 align-top">"</span>
          {verse}
          <span className="font-serif text-3xl leading-none text-primary/30 align-bottom">"</span>
        </blockquote>

        <div className="flex items-center justify-end gap-2">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/30" />
          <p className="text-sm font-semibold text-primary tracking-wide">{reference}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default VerseCard;
