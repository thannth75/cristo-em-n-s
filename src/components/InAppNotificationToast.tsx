import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, MessageCircle, Calendar, Award, Heart, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  action_url?: string | null;
  created_at: string;
  senderAvatar?: string | null;
  senderName?: string | null;
}

const notificationIcons: Record<string, React.ElementType> = {
  message: MessageCircle,
  event: Calendar,
  achievement: Award,
  prayer: Heart,
  community: Users,
  default: Bell,
};

const InAppNotificationToast = () => {
  const { user, isApproved } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const timeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Auto-dismiss after 5 seconds
  const scheduleRemoval = (id: string, delay = 5000) => {
    if (timeoutRef.current[id]) {
      clearTimeout(timeoutRef.current[id]);
    }
    timeoutRef.current[id] = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      delete timeoutRef.current[id];
    }, delay);
  };

  const dismissNotification = (id: string) => {
    if (timeoutRef.current[id]) {
      clearTimeout(timeoutRef.current[id]);
      delete timeoutRef.current[id];
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    if (!user || !isApproved) return;

    // Subscribe to new notifications
    const notificationsChannel = supabase
      .channel("in_app_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as InAppNotification;
          setNotifications((prev) => [newNotification, ...prev].slice(0, 3));
          scheduleRemoval(newNotification.id);
        }
      )
      .subscribe();

    // Subscribe to new private messages for instant toast
    const messagesChannel = supabase
      .channel("in_app_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "private_messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const msg = payload.new as { id: string; sender_id: string; content: string; created_at: string };
          
          // Fetch sender profile
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("user_id", msg.sender_id)
            .single();

          const notification: InAppNotification = {
            id: `msg-${msg.id}`,
            title: senderProfile?.full_name || "Nova mensagem",
            message: msg.content.slice(0, 100) + (msg.content.length > 100 ? "..." : ""),
            type: "message",
            action_url: "/mensagens",
            created_at: msg.created_at,
            senderAvatar: senderProfile?.avatar_url,
            senderName: senderProfile?.full_name,
          };

          setNotifications((prev) => [notification, ...prev].slice(0, 3));
          scheduleRemoval(notification.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(messagesChannel);
      Object.values(timeoutRef.current).forEach(clearTimeout);
    };
  }, [user, isApproved]);

  const handleClick = (notification: InAppNotification) => {
    dismissNotification(notification.id);
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const getIcon = (type: string) => {
    const Icon = notificationIcons[type] || notificationIcons.default;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] pointer-events-none flex flex-col items-center gap-2 px-4"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top, 16px))' }}
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            layout
            className="pointer-events-auto w-full max-w-md"
          >
            <button
              onClick={() => handleClick(notification)}
              className="w-full flex items-start gap-3 rounded-2xl bg-card/95 backdrop-blur-xl p-4 shadow-lg border border-border/50 text-left transition-transform active:scale-[0.98]"
            >
              {/* Avatar or Icon */}
              {notification.senderAvatar ? (
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={notification.senderAvatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {notification.senderName?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {getIcon(notification.type)}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">
                  {notification.title}
                </p>
                <p className="text-muted-foreground text-sm line-clamp-2 mt-0.5">
                  {notification.message}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification(notification.id);
                }}
                className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default InAppNotificationToast;
