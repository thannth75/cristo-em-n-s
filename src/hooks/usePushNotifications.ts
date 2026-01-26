import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | "unsupported";
  isEnabled: boolean;
  swRegistration: ServiceWorkerRegistration | null;
}

export function usePushNotifications() {
  const { user, isApproved } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "unsupported",
    isEnabled: false,
    swRegistration: null,
  });

  // Register service worker for push notifications
  const registerServiceWorker = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return null;

    try {
      // Check if sw-push.js exists, otherwise use default
      const registration = await navigator.serviceWorker.register("/sw-push.js", {
        scope: "/",
      });
      console.log("[PushNotifications] Service worker registered:", registration.scope);
      return registration;
    } catch (error) {
      console.warn("[PushNotifications] Custom SW not found, using default");
      return null;
    }
  }, []);

  useEffect(() => {
    // Check if notifications are supported
    const isSupported = "Notification" in window && "serviceWorker" in navigator;
    
    if (isSupported) {
      setState((prev) => ({
        ...prev,
        isSupported: true,
        permission: Notification.permission,
        isEnabled: Notification.permission === "granted",
      }));

      // Register service worker
      registerServiceWorker().then((registration) => {
        if (registration) {
          setState((prev) => ({ ...prev, swRegistration: registration }));
        }
      });
    }
  }, [registerServiceWorker]);

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
        // Register service worker if not already
        if (!state.swRegistration) {
          await registerServiceWorker();
        }

        toast({
          title: "Notificações ativadas! 🔔",
          description: "Você receberá alertas mesmo com o app em segundo plano.",
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
  }, [state.isSupported, state.swRegistration, toast, registerServiceWorker]);

  const sendLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (state.isEnabled && state.isSupported) {
      try {
        // Try to use service worker for notification (works in background)
        if (state.swRegistration) {
          state.swRegistration.showNotification(title, {
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-96x96.png",
            requireInteraction: true,
            ...options,
          });
          return null;
        }

        // Fallback to regular notification
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
  }, [state.isEnabled, state.isSupported, state.swRegistration]);

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
          const notification = payload.new as { title: string; message: string; type: string; action_url?: string };
          
          // Send local notification via service worker
          sendLocalNotification(notification.title, {
            body: notification.message,
            tag: `notification-${Date.now()}`,
            data: {
              url: notification.action_url || "/",
            },
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
