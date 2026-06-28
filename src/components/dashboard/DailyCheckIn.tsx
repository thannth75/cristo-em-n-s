import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const moods = [
  { emoji: "🙏", label: "Grato", key: "grateful", verse: "Em tudo dai graças. — 1 Ts 5:18" },
  { emoji: "😊", label: "Em paz", key: "peaceful", verse: "A paz vos deixo. — Jo 14:27" },
  { emoji: "🌱", label: "Buscando", key: "seeking", verse: "Buscai e achareis. — Mt 7:7" },
  { emoji: "😔", label: "Cansado", key: "tired", verse: "Vinde a mim. — Mt 11:28" },
  { emoji: "🔥", label: "Animado", key: "joyful", verse: "Alegrai-vos sempre. — Fp 4:4" },
];

const STORAGE_KEY = "vec_daily_checkin";

const todayKey = () => new Date().toISOString().split("T")[0];

const DailyCheckIn = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === todayKey()) {
          setSelected(parsed.mood);
          setDone(true);
        }
      }
    } catch {}
  }, []);

  const handlePick = (key: string) => {
    setSelected(key);
    setDone(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), mood: key }));
    } catch {}
  };

  const current = moods.find((m) => m.key === selected);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border border-border/50 p-5"
      style={{ background: "var(--gradient-aurora)" }}
    >
      <div
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{ background: "var(--gradient-mesh)" }}
      />

      <div className="relative flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-card/70 backdrop-blur-sm shadow-sm">
          <Heart className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-[10px] font-semibold tracking-wider uppercase text-primary/80">
            Check-in espiritual
          </p>
          <h3 className="font-serif text-base font-semibold text-foreground leading-tight">
            Como está seu coração hoje?
          </h3>
        </div>
      </div>

      <div className="relative flex flex-wrap gap-2">
        {moods.map((m) => {
          const active = selected === m.key;
          return (
            <motion.button
              key={m.key}
              onClick={() => handlePick(m.key)}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              className={cn(
                "flex flex-1 min-w-[64px] flex-col items-center gap-1 rounded-2xl px-2 py-2.5",
                "border transition-all backdrop-blur-sm",
                active
                  ? "border-primary/50 bg-card shadow-md"
                  : "border-border/40 bg-card/60 hover:bg-card/80"
              )}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {m.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {done && current && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative mt-3 flex items-start gap-2 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 p-3"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 shrink-0 mt-0.5">
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm text-foreground italic leading-snug">
                "{current.verse}"
              </p>
            </div>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
              <Check className="h-3.5 w-3.5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DailyCheckIn;
