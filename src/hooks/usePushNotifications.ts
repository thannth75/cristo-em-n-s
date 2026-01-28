import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | "unsupported";
  isEnabled: boolean;
  swRegistration: ServiceWorkerRegistration | null;
  isLoading: boolean;
}

// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user, isApproved } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "unsupported",
    isEnabled: false,
    swRegistration: null,
    isLoading: false,
  });

  // Check if notifications are supported
  const checkSupport = useCallback(() => {
    const isSupported = 
      typeof window !== 'undefined' &&
      'Notification' in window && 
      'serviceWorker' in navigator && 
      'PushManager' in window;
    
    return isSupported;
  }, []);

  // Register service worker for push notifications
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PushNotifications] Service workers not supported');
      return null;
    }

    try {
      // Check if already registered
      const existingReg = await navigator.serviceWorker.getRegistration('/');
      if (existingReg) {
        console.log('[PushNotifications] Using existing service worker');
        await navigator.serviceWorker.ready;
        return existingReg;
      }

      // Register new service worker
      const registration = await navigator.serviceWorker.register('/sw-push.js', {
        scope: '/',
      });
      
      console.log('[PushNotifications] Service worker registered:', registration.scope);
      await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.error('[PushNotifications] SW registration error:', error);
      return null;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    const isSupported = checkSupport();
    
    if (isSupported) {
      setState((prev) => ({
        ...prev,
        isSupported: true,
        permission: Notification.permission,
        isEnabled: Notification.permission === 'granted',
      }));

      // Register service worker in background
      registerServiceWorker().then((registration) => {
        if (registration) {
          setState((prev) => ({ ...prev, swRegistration: registration }));
        }
      });
    } else {
      setState(prev => ({
        ...prev,
        isSupported: false,
        permission: 'unsupported',
      }));
    }
  }, [checkSupport, registerServiceWorker]);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta notificações push.",
        variant: "destructive",
      });
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // First check if permission is already denied
      if (Notification.permission === "denied") {
        toast({
          title: "Permissão bloqueada",
          description: "Você bloqueou as notificações. Ative nas configurações do navegador.",
          variant: "destructive",
        });
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      
      setState(prev => ({
        ...prev,
        permission,
        isEnabled: permission === "granted",
      }));

      if (permission === "granted") {
        // Register service worker if not already
        let registration = state.swRegistration;
        if (!registration) {
          registration = await registerServiceWorker();
        }

        if (!registration) {
          throw new Error("Falha ao registrar service worker");
        }

        // Get VAPID key from edge function
        const { data: vapidData, error: vapidError } = await supabase.functions.invoke("get-vapid-key");
        
        if (vapidError || !vapidData?.publicKey) {
          console.error("[PushNotifications] VAPID key error:", vapidError);
          throw new Error("Notificações push não estão configuradas no servidor");
        }

        // Subscribe to push
        const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        });

        // Save subscription to database
        if (user?.id) {
          const subscriptionJson = subscription.toJSON();
          const p256dh = subscriptionJson.keys?.p256dh;
          const auth = subscriptionJson.keys?.auth;

          if (p256dh && auth) {
            await supabase.from("push_subscriptions").upsert(
              {
                user_id: user.id,
                endpoint: subscription.endpoint,
                p256dh,
                auth,
              },
              { onConflict: "user_id,endpoint" }
            );
          }
        }

        toast({
          title: "Notificações ativadas! 🔔",
          description: "Você receberá alertas mesmo com o app fechado.",
        });
        
        setState(prev => ({ ...prev, isLoading: false }));
        return true;
      } else if (permission === "denied") {
        toast({
          title: "Permissão negada",
          description: "Você pode ativar nas configurações do navegador.",
          variant: "destructive",
        });
      }
      
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    } catch (error) {
      console.error("[PushNotifications] Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao ativar notificações";
      toast({
        title: "Erro ao ativar",
        description: errorMessage,
        variant: "destructive",
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [state.isSupported, state.swRegistration, user?.id, toast, registerServiceWorker]);

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
