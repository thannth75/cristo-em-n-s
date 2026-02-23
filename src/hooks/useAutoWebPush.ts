import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Capacitor } from '@capacitor/core';

/**
 * Auto-subscribe users to Web Push notifications on login.
 * Always validates and refreshes the push subscription to prevent stale endpoints.
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
    if (hasAttemptedRef.current || Capacitor.isNativePlatform()) return;
    if (!user?.id || !isApproved) return;

    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      console.log('[AutoWebPush] Browser does not support push notifications');
      return;
    }

    if (Notification.permission === 'denied') {
      console.log('[AutoWebPush] Notifications are blocked by user');
      return;
    }

    hasAttemptedRef.current = true;

    try {
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

      // Always get or create a fresh subscription
      let subscription = await registration.pushManager.getSubscription();

      // If there's an existing subscription, unsubscribe and create fresh one
      // This ensures the endpoint is always current and not expired
      if (subscription) {
        try {
          await subscription.unsubscribe();
          console.log('[AutoWebPush] Unsubscribed stale subscription');
        } catch (e) {
          console.warn('[AutoWebPush] Failed to unsubscribe old:', e);
        }
        subscription = null;
      }

      // Request permission if not granted
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('[AutoWebPush] User denied notification permission');
          return;
        }
      }

      // Create fresh subscription
      const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });
      console.log('[AutoWebPush] New fresh subscription created');

      // Save to database
      const subscriptionJson = subscription.toJSON();
      const p256dh = subscriptionJson.keys?.p256dh;
      const auth = subscriptionJson.keys?.auth;

      if (!p256dh || !auth) {
        console.error('[AutoWebPush] Missing subscription keys');
        return;
      }

      // Delete old subscriptions for this user first, then insert new one
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      const { error: saveError } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
      });

      if (saveError) {
        console.error('[AutoWebPush] Failed to save subscription:', saveError);
      } else {
        console.log('[AutoWebPush] ✅ Fresh push subscription saved successfully');
      }
    } catch (error) {
      console.error('[AutoWebPush] Error during auto-subscribe:', error);
    }
  }, [user?.id, isApproved, urlBase64ToUint8Array]);

  useEffect(() => {
    const timer = setTimeout(() => {
      autoSubscribe();
    }, 3000);

    return () => clearTimeout(timer);
  }, [autoSubscribe]);
}
