import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Capacitor } from '@capacitor/core';

/**
 * Auto-subscribe users to Web Push notifications on login
 * This hook runs once when the user logs in and automatically
 * subscribes them to push notifications if not already subscribed
 */
export function useAutoWebPush() {
  const { user, isApproved } = useAuth();
  const hasAttemptedRef = useRef(false);

  const urlBase64ToUint8Array = useCallback((base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }, []);

  const autoSubscribe = useCallback(async () => {
    // Skip if already attempted or on native platform
    if (hasAttemptedRef.current || Capacitor.isNativePlatform()) return;
    if (!user?.id || !isApproved) return;

    // Check browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      console.log('[AutoWebPush] Browser does not support push notifications');
      return;
    }

    // Check if permission already denied
    if (Notification.permission === 'denied') {
      console.log('[AutoWebPush] Notifications are blocked by user');
      return;
    }

    hasAttemptedRef.current = true;

    try {
      // Check if already subscribed in database
      const { data: existingSub } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (existingSub && existingSub.length > 0) {
        console.log('[AutoWebPush] User already has a push subscription');
        return;
      }

      // Get VAPID key
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke('get-vapid-key');
      if (vapidError || !vapidData?.publicKey) {
        console.error('[AutoWebPush] Failed to get VAPID key:', vapidError);
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw-push.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      console.log('[AutoWebPush] Service worker ready');

      // Check if already subscribed in browser
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Request permission if not granted
        if (Notification.permission !== 'granted') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('[AutoWebPush] User denied notification permission');
            return;
          }
        }

        // Subscribe to push
        const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        });
        console.log('[AutoWebPush] New subscription created');
      }

      // Save to database
      const subscriptionJson = subscription.toJSON();
      const p256dh = subscriptionJson.keys?.p256dh;
      const auth = subscriptionJson.keys?.auth;

      if (!p256dh || !auth) {
        console.error('[AutoWebPush] Missing subscription keys');
        return;
      }

      const { error: saveError } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth,
        },
        { onConflict: 'user_id,endpoint' }
      );

      if (saveError) {
        console.error('[AutoWebPush] Failed to save subscription:', saveError);
      } else {
        console.log('[AutoWebPush] ✅ Push subscription saved successfully');
      }
    } catch (error) {
      console.error('[AutoWebPush] Error during auto-subscribe:', error);
    }
  }, [user?.id, isApproved, urlBase64ToUint8Array]);

  useEffect(() => {
    // Auto-subscribe after a short delay to not block initial render
    const timer = setTimeout(() => {
      autoSubscribe();
    }, 3000);

    return () => clearTimeout(timer);
  }, [autoSubscribe]);
}
