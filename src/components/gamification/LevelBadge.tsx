import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LevelBadgeProps {
  level: number;
  icon?: string;
  title?: string;
  size?: "xs" | "sm" | "md" | "lg";
  showTitle?: boolean;
  className?: string;
}

export function LevelBadge({
  level,
  icon: propIcon,
  title: propTitle,
  size = "md",
  showTitle = false,
  className,
}: LevelBadgeProps) {
  const [levelData, setLevelData] = useState<{ icon: string; title: string } | null>(null);

  useEffect(() => {
    if (!propIcon || !propTitle) {
      fetchLevelData();
    }
  }, [level, propIcon, propTitle]);

  const fetchLevelData = async () => {
    const { data } = await supabase
      .from("level_definitions")
      .select("icon, title")
      .eq("level_number", level)
      .single();
    
    if (data) {
      setLevelData(data);
    }
  };

  const icon = propIcon || levelData?.icon || "⭐";
  const title = propTitle || levelData?.title || `Nível ${level}`;

  const sizeClasses = {
    xs: "h-5 w-5 text-xs",
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
