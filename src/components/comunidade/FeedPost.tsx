import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical, 
  Pencil, 
  Trash2,
  Bookmark,
  Send
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PostComments from "./PostComments";
import { RepostButton } from "./RepostButton";
import { VideoPost } from "./VideoPost";
import { renderMentions } from "./MentionInput";
import { LevelBadge } from "@/components/gamification/LevelBadge";

interface FeedPostProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    image_url: string | null;
    video_url?: string | null;
    likes_count: number;
    comments_count: number;
    reposts_count: number;
    created_at: string;
    profiles?: { 
      full_name: string; 
      avatar_url: string | null;
      current_level?: number;
    };
    user_liked?: boolean;
    user_reposted?: boolean;
  };
  currentUserId: string;
  onLike: (postId: string, isLiked: boolean) => void;
  onEdit: (post: any) => void;
  onDelete: (post: any) => void;
  onViewLikers: (postId: string, count: number) => void;
  onCommentsChange: (postId: string, count: number) => void;
  onRepostSuccess: () => void;
}

export function FeedPost({
  post,
  currentUserId,
  onLike,
  onEdit,
  onDelete,
  onViewLikers,
  onCommentsChange,
  onRepostSuccess,
}: FeedPostProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Agora";
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString("pt-BR");
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const shouldTruncate = post.content.length > 280;
  const displayContent = shouldTruncate && !isExpanded 
    ? post.content.slice(0, 280) + "..." 
    : post.content;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <button 
          onClick={() => navigate(`/perfil/${post.user_id}`)}
          className="relative shrink-0"
        >
          <Avatar className="h-11 w-11 ring-2 ring-primary/10">
            <AvatarImage src={post.profiles?.avatar_url || ""} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(post.profiles?.full_name || "?")}
            </AvatarFallback>
          </Avatar>
          {(post.profiles?.current_level || 0) > 1 && (
            <div className="absolute -bottom-1 -right-1">
              <LevelBadge level={post.profiles?.current_level || 1} size="sm" />
            </div>
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <button 
            onClick={() => navigate(`/perfil/${post.user_id}`)}
            className="font-semibold text-foreground hover:underline truncate block"
          >
            {post.profiles?.full_name || "Anônimo"}
          </button>
          <p className="text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
        </div>

        {post.user_id === currentUserId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(post)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(post)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-foreground whitespace-pre-wrap break-words">
          {renderMentions(displayContent)}
        </p>
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary text-sm font-medium mt-1 hover:underline"
          >
            {isExpanded ? "Ver menos" : "Ver mais"}
          </button>
        )}
      </div>

      {/* Media */}
      {post.image_url && (
        <div className="relative">
          <img 
            src={post.image_url} 
            alt="Post" 
            className="w-full max-h-[500px] object-cover"
            loading="lazy"
          />
        </div>
      )}

      {post.video_url && (
        <VideoPost videoUrl={post.video_url} />
      )}

      {/* Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-sm text-muted-foreground border-t border-border/50">
        <button
          onClick={() => onViewLikers(post.id, post.likes_count)}
          className="hover:text-foreground transition-colors"
        >
          {post.likes_count} curtidas
        </button>
        <span>{post.comments_count} comentários</span>
      </div>

      {/* Actions */}
      <div className="flex items-center border-t border-border/50">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onLike(post.id, post.user_liked || false)}
          className={`flex-1 flex items-center justify-center gap-2 py-3 transition-colors ${
            post.user_liked 
              ? "text-destructive" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className={`h-5 w-5 ${post.user_liked ? "fill-current" : ""}`} />
          <span className="text-sm font-medium">Curtir</span>
        </motion.button>

        <div className="flex-1 flex items-center justify-center py-3">
          <PostComments
            postId={post.id}
            commentsCount={post.comments_count}
            onCommentsChange={(count) => onCommentsChange(post.id, count)}
          />
        </div>

        <div className="flex-1 flex items-center justify-center py-3">
          <RepostButton
            postId={post.id}
            postContent={post.content}
            postUserName={post.profiles?.full_name || "Anônimo"}
            repostsCount={post.reposts_count}
            userId={currentUserId}
            hasReposted={post.user_reposted}
            onRepostSuccess={onRepostSuccess}
          />
        </div>
      </div>
    </motion.article>
  );
}