import { useState, useEffect } from "react";
import { Bell, Check, Award, Calendar, MessageSquare, Info, Trash2, Users, BookOpen, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

type NotificationFilter = "all" | "achievement" | "event" | "prayer" | "community" | "system";

const FILTERS: { key: NotificationFilter; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "Todas", icon: <Bell className="h-3.5 w-3.5" /> },
  { key: "achievement", label: "Conquistas", icon: <Award className="h-3.5 w-3.5" /> },
  { key: "event", label: "Eventos", icon: <Calendar className="h-3.5 w-3.5" /> },
  { key: "community", label: "Social", icon: <Users className="h-3.5 w-3.5" /> },
  { key: "prayer", label: "Oração", icon: <Flame className="h-3.5 w-3.5" /> },
];

const NotificationCenter = () => {
  const { user, isApproved } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<NotificationFilter>("all");

  useEffect(() => {
    if (user && isApproved) {
      fetchNotifications();
      const channel = supabase.channel("notifications")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          (payload) => { setNotifications((prev) => [payload.new as Notification, ...prev]); setUnreadCount((c) => c + 1); })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user, isApproved]);

  const fetchNotifications = async () => {
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user?.id)
      .order("created_at", { ascending: false }).limit(50);
    setNotifications(data || []);
    setUnreadCount((data || []).filter((n) => !n.is_read).length);
  };

  const markAsRead = async (notificationId: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const clearAllNotifications = async () => {
    if (notifications.length === 0) return;
    await supabase.from("notifications").delete().in("id", notifications.map((n) => n.id));
    setNotifications([]); setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "achievement": return <Award className="h-5 w-5 text-gold" />;
      case "event": return <Calendar className="h-5 w-5 text-primary" />;
      case "prayer": return <Flame className="h-5 w-5 text-primary" />;
      case "community": return <Users className="h-5 w-5 text-primary" />;
      case "study": return <BookOpen className="h-5 w-5 text-primary" />;
      default: return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  const filteredNotifications = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-4 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-serif">Notificações</SheetTitle>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllNotifications} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" /> Limpar
                </Button>
              )}
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-1" /> Ler todas
                </Button>
              )}
            </div>
          </div>
          {/* Category Filters */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map((f) => (
              <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"}
                className="rounded-full text-xs h-7 gap-1 shrink-0 px-3"
                onClick={() => setFilter(f.key)}>
                {f.icon} {f.label}
              </Button>
            ))}
          </div>
        </SheetHeader>
        <div className="overflow-y-auto max-h-[calc(100vh-160px)]">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((notification) => (
                <motion.div key={notification.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`p-4 cursor-pointer transition-colors hover:bg-muted/30 ${!notification.is_read ? "bg-primary/5" : ""}`}
                  onClick={() => {
                    if (!notification.is_read) markAsRead(notification.id);
                    if (notification.action_url) window.location.href = notification.action_url;
                  }}>
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-foreground text-sm">{notification.title}</h4>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">{formatTime(notification.created_at)}</span>
                          {!notification.is_read && <div className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{notification.message}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationCenter;
