import { Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Story {
  id: string;
  user_id: string;
  image_url: string | null;
  profile?: { full_name: string; avatar_url: string | null };
}

interface ModernStoriesRowProps {
  currentUserId: string;
  currentUserName?: string;
  currentUserAvatar?: string | null;
  hasOwnStory: boolean;
  groupedStories: Record<string, Story[]>;
  onCreateStory: () => void;
  onViewStory: (userId: string) => void;
}

export default function ModernStoriesRow({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  hasOwnStory,
  groupedStories,
  onCreateStory,
  onViewStory,
}: ModernStoriesRowProps) {
  const uniqueUsers = Object.keys(groupedStories).filter(uid => uid !== currentUserId);

  return (
    <div className="bg-card border-b border-border">
      <div className="flex gap-3 py-3 px-3 sm:px-4 overflow-x-auto scrollbar-hide">
        {/* Create Story */}
        <button
          onClick={hasOwnStory ? () => onViewStory(currentUserId) : onCreateStory}
          className="flex flex-col items-center gap-1.5 shrink-0"
        >
          <div className="relative">
            <div
              className={cn(
                "p-0.5 rounded-full",
                hasOwnStory
                  ? "bg-gradient-to-tr from-primary via-primary/80 to-accent"
                  : "bg-muted"
              )}
            >
              <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-card">
                <AvatarImage src={currentUserAvatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-lg font-semibold">
                  {currentUserName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
            </div>
            {!hasOwnStory && (
              <div className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-card">
                <Plus className="h-4 w-4" />
              </div>
            )}
          </div>
          <span className="text-[11px] sm:text-xs text-muted-foreground font-medium max-w-14 truncate">
            {hasOwnStory ? "Seu story" : "Criar"}
          </span>
        </button>

        {/* Other users' stories */}
        {uniqueUsers.map((userId) => {
          const story = groupedStories[userId][0];
          const userName = story.profile?.full_name || "Anônimo";

          return (
            <button
              key={userId}
              onClick={() => onViewStory(userId)}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary via-primary/80 to-accent">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-card">
                  <AvatarImage src={story.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-muted to-muted-foreground/20 text-foreground text-lg font-semibold">
                    {userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[11px] sm:text-xs text-foreground font-medium max-w-14 truncate">
                {userName.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

