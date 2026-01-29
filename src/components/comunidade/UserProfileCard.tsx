import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/gamification/LevelBadge";
import OnlineStatusBadge from "./OnlineStatusBadge";

interface UserProfileCardProps {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  level?: number;
  lastSeen?: string | null;
  showLevel?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function UserProfileCard({
  userId,
  fullName,
  avatarUrl,
  level = 1,
  lastSeen,
  showLevel = true,
  size = "md",
  onClick,
}: UserProfileCardProps) {
  const navigate = useNavigate();

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/perfil/${userId}`);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="flex items-center gap-3 text-left w-full"
    >
      <div className="relative shrink-0">
        <Avatar className={`${sizeClasses[size]} ring-2 ring-primary/20`}>
          <AvatarImage src={avatarUrl || ""} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
        {showLevel && level > 1 && (
          <div className="absolute -bottom-1 -right-1">
            <LevelBadge level={level} size="sm" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`font-semibold text-foreground truncate ${textSizeClasses[size]}`}>
          {fullName}
        </p>
        {lastSeen !== undefined && (
          <OnlineStatusBadge lastSeen={lastSeen} showText />
        )}
      </div>
    </motion.button>
  );
}