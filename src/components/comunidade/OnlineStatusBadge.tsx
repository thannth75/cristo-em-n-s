import { cn } from "@/lib/utils";
import { formatLastSeen, isOnline } from "@/hooks/usePresence";

interface OnlineStatusBadgeProps {
  lastSeen: string | null;
  showText?: boolean;
  className?: string;
}

const OnlineStatusBadge = ({ lastSeen, showText = false, className }: OnlineStatusBadgeProps) => {
  const online = isOnline(lastSeen);
  const statusText = formatLastSeen(lastSeen);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full shrink-0",
          online ? "bg-primary animate-pulse" : "bg-muted-foreground/50"
        )}
      />
      {showText && (
        <span className={cn(
          "text-xs",
          online ? "text-primary font-medium" : "text-muted-foreground"
        )}>
          {statusText}
        </span>
      )}
    </div>
  );
};

export default OnlineStatusBadge;
