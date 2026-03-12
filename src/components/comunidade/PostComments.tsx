import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Loader2, MoreVertical, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  likes_count: number;
  profile?: { full_name: string; avatar_url: string | null };
  user_reaction?: string | null;
  reaction_counts?: Record<string, number>;
}

interface PostCommentsProps {
  postId: string;
  commentsCount: number;
  onCommentsChange: (count: number) => void;
}

const REACTIONS = [
  { type: "like", emoji: "❤️", label: "Curtir" },
  { type: "pray", emoji: "🙏", label: "Orar" },
  { type: "fire", emoji: "🔥", label: "Forte" },
  { type: "clap", emoji: "👏", label: "Amém" },
  { type: "joy", emoji: "😊", label: "Alegria" },
] as const;

const adjustCount = (counts: Record<string, number>, type: string, delta: number) => {
  const current = counts[type] || 0;
  const next = Math.max(0, current + delta);
  if (next === 0) {
    const { [type]: _removed, ...rest } = counts;
    return rest;
  }
  return { ...counts, [type]: next };
};

const PostComments = ({ postId, commentsCount, onCommentsChange }: PostCommentsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    setIsLoading(true);

    const { data: commentsData, error } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error || !commentsData || commentsData.length === 0) {
      setComments([]);
      setIsLoading(false);
      return;
    }

    const userIds = [...new Set(commentsData.map((comment) => comment.user_id))];
    const commentIds = commentsData.map((comment) => comment.id);

    const [{ data: profiles }, { data: reactions }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds),
      supabase
        .from("comment_reactions")
        .select("comment_id, user_id, reaction_type")
        .in("comment_id", commentIds),
    ]);

    const reactionsByComment = new Map<
      string,
      { counts: Record<string, number>; userReaction: string | null }
    >();

    commentIds.forEach((id) => {
      reactionsByComment.set(id, { counts: {}, userReaction: null });
    });

    (reactions || []).forEach((reaction) => {
      const bucket = reactionsByComment.get(reaction.comment_id);
      if (!bucket) return;

      bucket.counts[reaction.reaction_type] = (bucket.counts[reaction.reaction_type] || 0) + 1;
      if (reaction.user_id === user?.id) {
        bucket.userReaction = reaction.reaction_type;
      }
    });

    const merged = commentsData.map((comment) => {
      const reactionData = reactionsByComment.get(comment.id);
      return {
        ...comment,
        profile: profiles?.find((profile) => profile.user_id === comment.user_id),
        user_reaction: reactionData?.userReaction ?? null,
        reaction_counts: reactionData?.counts ?? {},
      };
    });

    setComments(merged);
    setIsLoading(false);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !user) return;

    if (newComment.length > 500) {
      toast({
        title: "Comentário muito longo",
        description: "Máximo 500 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (error) {
      toast({ title: "Erro ao comentar", variant: "destructive" });
      setIsSending(false);
      return;
    }

    setNewComment("");
    await fetchComments();

    const newCount = commentsCount + 1;
    await supabase.from("community_posts").update({ comments_count: newCount }).eq("id", postId);
    onCommentsChange(newCount);

    setIsSending(false);
  };

  const handleReactComment = async (comment: Comment, reactionType: string) => {
    if (!user) return;

    const nextReaction = comment.user_reaction === reactionType ? null : reactionType;

    const { error: clearError } = await supabase
      .from("comment_reactions")
      .delete()
      .eq("comment_id", comment.id)
      .eq("user_id", user.id);

    if (clearError) {
      toast({ title: "Erro ao reagir", variant: "destructive" });
      return;
    }

    if (nextReaction) {
      const { error: insertError } = await supabase.from("comment_reactions").insert({
        comment_id: comment.id,
        user_id: user.id,
        reaction_type: nextReaction,
      });

      if (insertError) {
        toast({ title: "Erro ao reagir", variant: "destructive" });
        return;
      }
    }

    setComments((prev) =>
      prev.map((item) => {
        if (item.id !== comment.id) return item;

        let counts = { ...(item.reaction_counts || {}) };
        let likes = item.likes_count;

        if (item.user_reaction) {
          counts = adjustCount(counts, item.user_reaction, -1);
          likes = Math.max(0, likes - 1);
        }

        if (nextReaction) {
          counts = adjustCount(counts, nextReaction, 1);
          likes += 1;
        }

        return {
          ...item,
          user_reaction: nextReaction,
          reaction_counts: counts,
          likes_count: likes,
        };
      })
    );
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user?.id);

    if (error) {
      toast({ title: "Erro ao excluir comentário", variant: "destructive" });
      return;
    }

    setComments((prev) => prev.filter((comment) => comment.id !== commentId));

    const newCount = Math.max(0, commentsCount - 1);
    await supabase.from("community_posts").update({ comments_count: newCount }).eq("id", postId);
    onCommentsChange(newCount);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <MessageCircle className="h-4 w-4" />
        {commentsCount}
      </button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[72vh] rounded-t-2xl px-4">
          <SheetHeader className="pb-4">
            <SheetTitle className="font-serif">Comentários ({commentsCount})</SheetTitle>
          </SheetHeader>

          <div className="flex h-full flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto pb-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : comments.length === 0 ? (
                <div className="py-8 text-center">
                  <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Seja o primeiro a comentar!</p>
                </div>
              ) : (
                <AnimatePresence>
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="group flex gap-3"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={comment.profile?.avatar_url || undefined} alt={comment.profile?.full_name || "Avatar"} />
                        <AvatarFallback className="text-xs font-semibold">
                          {comment.profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="rounded-xl bg-muted px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="truncate text-sm font-semibold text-foreground">
                                {comment.profile?.full_name || "Anônimo"}
                              </span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {formatTime(comment.created_at)}
                              </span>
                            </div>

                            {comment.user_id === user?.id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 opacity-0 transition-opacity group-hover:opacity-100">
                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>

                          <p className="mt-1 break-words text-sm text-foreground">{comment.content}</p>
                        </div>

                        <div className="ml-3 mt-1 flex flex-wrap items-center gap-1.5">
                          {REACTIONS.map((reaction) => {
                            const count = comment.reaction_counts?.[reaction.type] || 0;
                            const active = comment.user_reaction === reaction.type;

                            return (
                              <button
                                key={reaction.type}
                                onClick={() => handleReactComment(comment, reaction.type)}
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors",
                                  active
                                    ? "border-primary/40 bg-primary/10 text-foreground"
                                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                                )}
                                aria-label={reaction.label}
                              >
                                <span>{reaction.emoji}</span>
                                {count > 0 && <span>{count}</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            <div className="border-t border-border pt-4 pb-safe">
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  placeholder="Escreva um comentário..."
                  className="flex-1 rounded-xl"
                  maxLength={500}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleSendComment();
                    }
                  }}
                />
                <Button
                  onClick={handleSendComment}
                  size="icon"
                  className="shrink-0 rounded-xl"
                  disabled={!newComment.trim() || isSending}
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default PostComments;
