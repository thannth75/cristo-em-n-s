import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | "unsupported";
  isEnabled: boolean;
}

export function usePushNotifications() {
  const { user, isApproved } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "unsupported",
    isEnabled: false,
  });

  useEffect(() => {
    // Check if notifications are supported
    const isSupported = "Notification" in window;
    
    if (isSupported) {
      setState({
        isSupported: true,
        permission: Notification.permission,
        isEnabled: Notification.permission === "granted",
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta notificações.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      setState(prev => ({
        ...prev,
        permission,
        isEnabled: permission === "granted",
      }));

      if (permission === "granted") {
        toast({
          title: "Notificações ativadas! 🔔",
          description: "Você receberá alertas importantes.",
        });
        return true;
      } else if (permission === "denied") {
        toast({
          title: "Permissão negada",
          description: "Você pode ativar nas configurações do navegador.",
          variant: "destructive",
        });
        return false;
      }
      
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [state.isSupported, toast]);

  const sendLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (state.isEnabled && state.isSupported) {
      try {
        const notification = new Notification(title, {
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-96x96.png",
          ...options,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    }
    return null;
  }, [state.isEnabled, state.isSupported]);

  // Listen for new notifications from Supabase and show local notification
  useEffect(() => {
    if (!user || !isApproved || !state.isEnabled) return;

    const channel = supabase
      .channel("push_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as { title: string; message: string; type: string };
          
          // Send local notification
          sendLocalNotification(notification.title, {
            body: notification.message,
            tag: `notification-${Date.now()}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isApproved, state.isEnabled, sendLocalNotification]);

  return {
    ...state,
    requestPermission,
    sendLocalNotification,
  };
}
