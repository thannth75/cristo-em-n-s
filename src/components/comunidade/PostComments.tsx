import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Loader2, Heart, MoreVertical, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  user_liked?: boolean;
}

interface PostCommentsProps {
  postId: string;
  commentsCount: number;
  onCommentsChange: (count: number) => void;
}

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
    
    const { data: commentsData } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (commentsData) {
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      // Check which comments user has liked
      const { data: userLikes } = await supabase
        .from("comment_reactions")
        .select("comment_id")
        .eq("user_id", user?.id)
        .in("comment_id", commentsData.map(c => c.id));

      const likedCommentIds = new Set(userLikes?.map(l => l.comment_id) || []);

      const commentsWithProfiles = commentsData.map(comment => ({
        ...comment,
        profile: profiles?.find(p => p.user_id === comment.user_id),
        user_liked: likedCommentIds.has(comment.id),
      }));

      setComments(commentsWithProfiles);
    }
    
    setIsLoading(false);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !user) return;

    if (newComment.length > 500) {
      toast({ title: "Comentário muito longo", description: "Máximo 500 caracteres", variant: "destructive" });
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
    } else {
      setNewComment("");
      fetchComments();
      
      // Update comments count on post
      const newCount = commentsCount + 1;
      await supabase
        .from("community_posts")
        .update({ comments_count: newCount })
        .eq("id", postId);
      
      onCommentsChange(newCount);
    }

    setIsSending(false);
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!user) return;

    if (isLiked) {
      await supabase
        .from("comment_reactions")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("comment_reactions").insert({
        comment_id: commentId,
        user_id: user.id,
        reaction_type: "like",
      });
    }

    // Update local state
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          user_liked: !isLiked,
          likes_count: isLiked ? Math.max(0, c.likes_count - 1) : c.likes_count + 1,
        };
      }
      return c;
    }));
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user?.id);

    if (!error) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      
      // Update comments count
      const newCount = Math.max(0, commentsCount - 1);
      await supabase
        .from("community_posts")
        .update({ comments_count: newCount })
        .eq("id", postId);
      
      onCommentsChange(newCount);
    }
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
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        {commentsCount}
      </button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl px-4">
          <SheetHeader className="pb-4">
            <SheetTitle className="font-serif">
              Comentários ({commentsCount})
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col h-full">
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
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
                      className="flex gap-3 group"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {comment.profile?.full_name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-muted rounded-xl px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-semibold text-sm text-foreground truncate">
                                {comment.profile?.full_name || "Anônimo"}
                              </span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatTime(comment.created_at)}
                              </span>
                            </div>
                            {comment.user_id === user?.id && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          <p className="text-sm text-foreground mt-1 break-words">
                            {comment.content}
                          </p>
                        </div>
                        {/* Like button for comment */}
                        <button
                          onClick={() => handleLikeComment(comment.id, comment.user_liked || false)}
                          className={`flex items-center gap-1 text-xs mt-1 ml-3 transition-colors ${
                            comment.user_liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
                          }`}
                        >
                          <Heart className={`h-3 w-3 ${comment.user_liked ? "fill-current" : ""}`} />
                          {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Input Area */}
            <div className="flex gap-2 pt-4 border-t border-border pb-safe">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escreva um comentário..."
                className="flex-1 rounded-xl"
                maxLength={500}
                onKeyPress={(e) => e.key === "Enter" && handleSendComment()}
              />
              <Button
                onClick={handleSendComment}
                size="icon"
                className="rounded-xl shrink-0"
                disabled={!newComment.trim() || isSending}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default PostComments;
