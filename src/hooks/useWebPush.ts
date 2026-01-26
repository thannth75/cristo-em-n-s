import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

interface WebPushState {
  isSupported: boolean;
  permission: NotificationPermission | "unsupported";
  isSubscribed: boolean;
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

export function useWebPush(userId: string | undefined) {
  const { toast } = useToast();
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [state, setState] = useState<WebPushState>({
    isSupported: false,
    permission: "unsupported",
    isSubscribed: false,
    isLoading: true,
  });

  // Fetch VAPID key from edge function
  const fetchVapidKey = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-vapid-key");
      if (error) throw error;
      if (data?.publicKey) {
        setVapidKey(data.publicKey);
        return data.publicKey;
      }
    } catch (error) {
      console.error("[WebPush] Failed to fetch VAPID key:", error);
    }
    return null;
  }, []);

  // Check if web push is supported
  const checkSupport = useCallback(() => {
    const isSupported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    if (!isSupported) {
      setState({
        isSupported: false,
        permission: "unsupported",
        isSubscribed: false,
        isLoading: false,
      });
      return false;
    }

    setState((prev) => ({
      ...prev,
      isSupported: true,
      permission: Notification.permission,
    }));

    return true;
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return null;

    try {
      const registration = await navigator.serviceWorker.register("/sw-push.js", {
        scope: "/",
      });
      console.log("[WebPush] Service worker registered:", registration.scope);
      return registration;
    } catch (error) {
      console.error("[WebPush] Service worker registration failed:", error);
      return null;
    }
  }, []);

  // Check if user is already subscribed
  const checkSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        setState((prev) => ({ ...prev, isSubscribed: true }));
        return true;
      }

      return false;
    } catch (error) {
      console.error("[WebPush] Error checking subscription:", error);
      return false;
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!userId) {
      console.error("[WebPush] Missing userId");
      toast({
        title: "Erro",
        description: "Faça login para ativar notificações.",
        variant: "destructive",
      });
      return false;
    }

    // Get VAPID key if not already fetched
    let publicKey = vapidKey;
    if (!publicKey) {
      publicKey = await fetchVapidKey();
      if (!publicKey) {
        toast({
          title: "Erro de configuração",
          description: "Push notifications não estão configuradas.",
          variant: "destructive",
        });
        return false;
      }
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));

      if (permission !== "granted") {
        toast({
          title: "Permissão negada",
          description: "Você precisa permitir notificações nas configurações do navegador.",
          variant: "destructive",
        });
        setState((prev) => ({ ...prev, isLoading: false }));
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error("Failed to register service worker");
      }

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      console.log("[WebPush] Subscription created:", subscription.endpoint);

      // Extract keys from subscription
      const subscriptionJson = subscription.toJSON();
      const p256dh = subscriptionJson.keys?.p256dh;
      const auth = subscriptionJson.keys?.auth;

      if (!p256dh || !auth) {
        throw new Error("Missing subscription keys");
      }

      // Save subscription to database
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh,
          auth,
        },
        {
          onConflict: "user_id,endpoint",
        }
      );

      if (error) {
        console.error("[WebPush] Error saving subscription:", error);
        throw error;
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      console.error("[WebPush] Subscription error:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      toast({
        title: "Erro ao ativar",
        description: "Não foi possível ativar as notificações push.",
        variant: "destructive",
      });
      return false;
    }
  }, [userId, vapidKey, toast, registerServiceWorker, fetchVapidKey]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!userId) return false;

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", userId)
          .eq("endpoint", subscription.endpoint);
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      toast({
        title: "Notificações desativadas",
        description: "Você não receberá mais alertas push.",
      });

      return true;
    } catch (error) {
      console.error("[WebPush] Unsubscribe error:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [userId, toast]);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      if (!checkSupport()) return;

      await fetchVapidKey();
      await registerServiceWorker();
      await checkSubscription();
      setState((prev) => ({ ...prev, isLoading: false }));
    };

    init();
  }, [checkSupport, registerServiceWorker, checkSubscription, fetchVapidKey]);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}
