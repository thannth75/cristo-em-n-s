import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  icon: string;
  title: string;
  size?: "sm" | "md" | "lg";
  showTitle?: boolean;
  className?: string;
}

export function LevelBadge({
  level,
  icon,
  title,
  size = "md",
  showTitle = false,
  className,
}: LevelBadgeProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-lg",
    lg: "h-14 w-14 text-2xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 shadow-md",
          sizeClasses[size]
        )}
        title={`Nível ${level}: ${title}`}
      >
        {icon}
      </div>
      {showTitle && (
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Nível {level}</span>
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
      )}
    </div>
  );
}
