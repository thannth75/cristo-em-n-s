import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface PollWidgetProps {
  postId: string;
  userId: string;
}

interface Poll {
  id: string;
  question: string;
  options: string[];
  is_multiple_choice: boolean;
  ends_at: string | null;
}

interface VoteCount {
  option_index: number;
  count: number;
}

export default function PollWidget({ postId, userId }: PollWidgetProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [votes, setVotes] = useState<VoteCount[]>([]);
  const [myVotes, setMyVotes] = useState<number[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoll();
  }, [postId]);

  const fetchPoll = async () => {
    const { data: pollData } = await supabase
      .from("community_polls")
      .select("*")
      .eq("post_id", postId)
      .maybeSingle();

    if (!pollData) { setLoading(false); return; }
    setPoll(pollData as Poll);

    const { data: votesData } = await supabase
      .from("poll_votes")
      .select("option_index, user_id")
      .eq("poll_id", pollData.id);

    if (votesData) {
      const counts: Record<number, number> = {};
      const mine: number[] = [];
      votesData.forEach((v: any) => {
        counts[v.option_index] = (counts[v.option_index] || 0) + 1;
        if (v.user_id === userId) mine.push(v.option_index);
      });
      setVotes(Object.entries(counts).map(([k, v]) => ({ option_index: Number(k), count: v })));
      setMyVotes(mine);
      setTotalVotes(votesData.length);
    }
    setLoading(false);
  };

  const handleVote = async (optionIndex: number) => {
    if (!poll) return;
    const hasVoted = myVotes.includes(optionIndex);

    if (hasVoted) {
      await supabase.from("poll_votes").delete()
        .eq("poll_id", poll.id).eq("user_id", userId).eq("option_index", optionIndex);
      setMyVotes((prev) => prev.filter((i) => i !== optionIndex));
      setTotalVotes((prev) => prev - 1);
      setVotes((prev) => prev.map((v) => v.option_index === optionIndex ? { ...v, count: v.count - 1 } : v));
    } else {
      if (!poll.is_multiple_choice && myVotes.length > 0) {
        // Remove previous vote
        const prevIdx = myVotes[0];
        await supabase.from("poll_votes").delete()
          .eq("poll_id", poll.id).eq("user_id", userId).eq("option_index", prevIdx);
        setVotes((prev) => prev.map((v) => v.option_index === prevIdx ? { ...v, count: Math.max(0, v.count - 1) } : v));
        setTotalVotes((prev) => prev - 1);
      }

      await supabase.from("poll_votes").insert({
        poll_id: poll.id, user_id: userId, option_index: optionIndex,
      });

      setMyVotes((prev) => poll.is_multiple_choice ? [...prev, optionIndex] : [optionIndex]);
      setTotalVotes((prev) => prev + 1);
      setVotes((prev) => {
        const existing = prev.find((v) => v.option_index === optionIndex);
        if (existing) return prev.map((v) => v.option_index === optionIndex ? { ...v, count: v.count + 1 } : v);
        return [...prev, { option_index: optionIndex, count: 1 }];
      });
    }
  };

  if (loading || !poll) return null;

  const hasVoted = myVotes.length > 0;
  const isExpired = poll.ends_at && new Date(poll.ends_at) < new Date();

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">{poll.question}</span>
      </div>

      <div className="space-y-2">
        {poll.options.map((option, idx) => {
          const voteCount = votes.find((v) => v.option_index === idx)?.count || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = myVotes.includes(idx);

          return (
            <button
              key={idx}
              onClick={() => !isExpired && handleVote(idx)}
              disabled={!!isExpired}
              className={cn(
                "relative w-full text-left rounded-lg p-2.5 text-sm transition-all overflow-hidden border",
                isSelected
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-muted/50",
                isExpired && "opacity-70 cursor-default"
              )}
            >
              {/* Progress bar */}
              {hasVoted && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-y-0 left-0 bg-primary/10 rounded-lg"
                />
              )}

              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  <span className={cn("font-medium", isSelected && "text-primary")}>{option}</span>
                </div>
                {hasVoted && (
                  <span className="text-xs text-muted-foreground font-medium shrink-0">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        {totalVotes} {totalVotes === 1 ? "voto" : "votos"}
        {poll.is_multiple_choice && " • múltipla escolha"}
        {isExpired && " • encerrada"}
      </p>
    </div>
  );
}
