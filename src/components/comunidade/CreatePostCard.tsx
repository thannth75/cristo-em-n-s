import { Image, Video, Smile, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface CreatePostCardProps {
  userName?: string;
  avatarUrl?: string | null;
  onClick: () => void;
}

export default function CreatePostCard({ userName, avatarUrl, onClick }: CreatePostCardProps) {
  const userInitial = userName?.charAt(0).toUpperCase() || "?";

  return (
    <div className="bg-card rounded-none sm:rounded-2xl border-y sm:border border-border p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 sm:h-11 sm:w-11 shrink-0">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
            {userInitial}
          </AvatarFallback>
        </Avatar>

        <button
          onClick={onClick}
          className="flex-1 text-left px-4 py-2.5 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground text-sm sm:text-base transition-colors"
        >
          No que você está pensando, {userName?.split(" ")[0]}?
        </button>
      </div>

      <div className="flex items-center justify-around mt-3 pt-3 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          className="flex-1 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/5"
        >
          <Image className="h-5 w-5 text-primary" />
          <span className="hidden xs:inline text-sm">Foto</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          className="flex-1 gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
        >
          <Video className="h-5 w-5 text-destructive" />
          <span className="hidden xs:inline text-sm">Vídeo</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          className="flex-1 gap-2 text-muted-foreground hover:text-accent-foreground hover:bg-accent/50"
        >
          <Smile className="h-5 w-5 text-accent-foreground" />
          <span className="hidden xs:inline text-sm">Sentimento</span>
        </Button>
      </div>
    </div>
  );
}
