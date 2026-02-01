import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MessageCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserLevelBadge } from "@/components/gamification/UserLevelBadge";
import { VideoPost } from "./VideoPost";
import PostComments from "./PostComments";
import { RepostButton } from "./RepostButton";
import { renderMentions } from "./MentionInput";
import { cn } from "@/lib/utils";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  video_url?: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string | null };
  user_liked?: boolean;
  user_reposted?: boolean;
}

interface ModernFeedPostProps {
  post: Post;
  currentUserId: string;
  onLike: (postId: string, isLiked: boolean) => void;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
  onViewLikers: (postId: string, count: number) => void;
  onCommentsChange: (postId: string, count: number) => void;
  onRepostSuccess: () => void;
}

export default function ModernFeedPost({
  post,
  currentUserId,
  onLike,
  onEdit,
  onDelete,
  onViewLikers,
  onCommentsChange,
  onRepostSuccess,
}: ModernFeedPostProps) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const isOwn = post.user_id === currentUserId;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (mins < 1) return "Agora";
    if (mins < 60) return `${mins}min`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const userName = post.profiles?.full_name || "Anônimo";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-none sm:rounded-2xl border-y sm:border border-border overflow-hidden"
    >
      {/* Header */}
      <header className="flex items-center gap-3 p-3 sm:p-4">
        <button
          onClick={() => navigate(`/perfil/${post.user_id}`)}
          className="relative shrink-0"
        >
          <Avatar className="h-10 w-10 sm:h-11 sm:w-11 ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
            <AvatarImage src={post.profiles?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/perfil/${post.user_id}`)}
              className="font-semibold text-foreground hover:underline truncate text-sm sm:text-base"
            >
              {userName}
            </button>
            <UserLevelBadge userId={post.user_id} size="xs" />
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            {formatDate(post.created_at)}
          </p>
        </div>

        {isOwn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(post)}>
                <Pencil className="h-4 w-4 mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(post)} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      {/* Content */}
      {post.content && (
        <div className="px-3 sm:px-4 pb-3">
          <p className="text-sm sm:text-[15px] text-foreground leading-relaxed whitespace-pre-wrap break-words">
            {renderMentions(post.content)}
          </p>
        </div>
      )}

      {/* Media */}
      {post.image_url && (
        <div className="relative aspect-[4/3] sm:aspect-video bg-muted">
          <img
            src={post.image_url}
            alt="Post"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {post.video_url && <VideoPost videoUrl={post.video_url} />}

      {/* Stats bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 text-xs sm:text-sm text-muted-foreground border-b border-border/50">
        <button
          onClick={() => onViewLikers(post.id, post.likes_count)}
          className="hover:underline"
        >
          {post.likes_count} {post.likes_count === 1 ? "curtida" : "curtidas"}
        </button>
        <div className="flex gap-3 sm:gap-4">
          <span>{post.comments_count} comentários</span>
          <span>{post.reposts_count} reposts</span>
        </div>
      </div>

      {/* Actions - Grid de 3 colunas perfeitamente alinhado */}
      <div className="grid grid-cols-3 divide-x divide-border/50">
        {/* Curtir */}
        <button
          onClick={() => onLike(post.id, post.user_liked || false)}
          className={cn(
            "flex items-center justify-center gap-1.5 py-3 min-h-[48px] transition-colors active:bg-muted/50",
            post.user_liked
              ? "text-destructive"
              : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
          )}
        >
          <Heart className={cn("h-5 w-5 shrink-0", post.user_liked && "fill-current")} />
          <span className="text-sm font-medium hidden xs:inline">Curtir</span>
        </button>

        {/* Comentar */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center justify-center gap-1.5 py-3 min-h-[48px] text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors active:bg-muted/50"
        >
          <MessageCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium hidden xs:inline">Comentar</span>
        </button>

        {/* Repostar */}
        <RepostButton
          postId={post.id}
          postContent={post.content}
          postUserName={userName}
          repostsCount={post.reposts_count}
          userId={currentUserId}
          hasReposted={post.user_reposted}
          onRepostSuccess={onRepostSuccess}
        />
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="p-3 sm:p-4 bg-muted/30 border-t border-border/50">
          <PostComments
            postId={post.id}
            commentsCount={post.comments_count}
            onCommentsChange={(count) => onCommentsChange(post.id, count)}
          />
        </div>
      )}
    </motion.article>
  );
}
