import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface QuickDevotional {
  id: string;
  title: string;
  bible_reference: string;
  bible_verse: string;
}

export default function QuickDevotionalWidget() {
  const navigate = useNavigate();
  const [devotional, setDevotional] = useState<QuickDevotional | null>(null);

  useEffect(() => {
    const fetchToday = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("daily_devotionals")
        .select("id, title, bible_reference, bible_verse")
        .eq("devotional_date", today)
        .maybeSingle();
      setDevotional(data);
    };
    fetchToday();
  }, []);

  if (!devotional) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate("/devocional")}
      className="w-full rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/30 p-3.5 text-left"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 shrink-0">
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <BookOpen className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">
              Devocional de Hoje
            </span>
          </div>
          <h4 className="text-sm font-semibold text-foreground truncate">{devotional.title}</h4>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">
            "{devotional.bible_verse.slice(0, 80)}..."
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1">
            {devotional.bible_reference}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />
      </div>
    </motion.button>
  );
}
