import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LevelBadge as BaseLevelBadge } from "./LevelBadge";

interface UserLevelBadgeProps {
  userId: string;
  size?: "xs" | "sm" | "md" | "lg";
  showTitle?: boolean;
  className?: string;
}

export function UserLevelBadge({ userId, size = "sm", showTitle = false, className }: UserLevelBadgeProps) {
  const [level, setLevel] = useState<number | null>(null);

  useEffect(() => {
    const fetchLevel = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("current_level")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (data?.current_level) {
        setLevel(data.current_level);
      }
    };

    if (userId) {
      fetchLevel();
    }
  }, [userId]);

  if (!level) return null;

  return (
    <BaseLevelBadge
      level={level}
      size={size}
      showTitle={showTitle}
      className={className}
    />
  );
}
