import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const REACTIONS = ["❤️", "🙏", "🔥", "👏", "😊", "😢", "🎉"] as const;

interface ReactionCount {
  reaction: string;
  count: number;
  userReacted: boolean;
}

interface PostReactionsProps {
  postId: string;
  userId: string;
}

export default function PostReactions({ postId, userId }: PostReactionsProps) {
  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    fetchReactions();
  }, [postId]);

  const fetchReactions = async () => {
    const { data } = await supabase
      .from("post_reactions")
      .select("reaction, user_id")
      .eq("post_id", postId);

    if (!data) return;

    const map = new Map<string, { count: number; userReacted: boolean }>();
    for (const r of data) {
      const existing = map.get(r.reaction) || { count: 0, userReacted: false };
      existing.count++;
      if (r.user_id === userId) existing.userReacted = true;
      map.set(r.reaction, existing);
    }

    setReactions(
      Array.from(map.entries()).map(([reaction, v]) => ({
        reaction,
        count: v.count,
        userReacted: v.userReacted,
      }))
    );
  };

  const toggleReaction = async (emoji: string) => {
    const existing = reactions.find((r) => r.reaction === emoji && r.userReacted);

    if (existing) {
      await supabase
        .from("post_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId)
        .eq("reaction", emoji);
    } else {
      await supabase.from("post_reactions").insert({
        post_id: postId,
        user_id: userId,
        reaction: emoji,
      });
    }

    setShowPicker(false);
    fetchReactions();
  };

  return (
    <div className="relative flex items-center gap-1 flex-wrap">
      {reactions.map((r) => (
        <button
          key={r.reaction}
          onClick={() => toggleReaction(r.reaction)}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
            r.userReacted
              ? "border-primary/40 bg-primary/10 text-foreground"
              : "border-border bg-muted/30 text-muted-foreground hover:border-primary/30"
          }`}
        >
          <span>{r.reaction}</span>
          <span className="font-medium">{r.count}</span>
        </button>
      ))}

      <button
        onClick={() => setShowPicker(!showPicker)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted/30 text-sm hover:border-primary/30 hover:bg-primary/5 transition-colors"
        title="Reagir"
      >
        +
      </button>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            className="absolute bottom-full left-0 mb-2 flex gap-1 rounded-xl border border-border bg-card p-2 shadow-lg z-20"
          >
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className="rounded-lg p-1.5 text-lg hover:bg-muted/50 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
