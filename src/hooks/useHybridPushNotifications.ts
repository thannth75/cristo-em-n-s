import { usePushNotifications } from './usePushNotifications';
import { useNativePushNotifications } from './useNativePushNotifications';
import { Capacitor } from '@capacitor/core';

/**
 * Hybrid push notification hook that automatically selects the right
 * notification system based on the platform:
 * - Native (Capacitor): Uses native push notifications for iOS/Android
 * - Web (PWA): Uses Web Push API with VAPID
 */
export function useHybridPushNotifications() {
  const isNative = Capacitor.isNativePlatform();
  
  // Native push for Capacitor apps
  const nativePush = useNativePushNotifications();
  
  // Web push for PWA
  const webPush = usePushNotifications();

  if (isNative) {
    return {
      isSupported: nativePush.isSupported,
      isEnabled: nativePush.permissionGranted,
      permission: nativePush.permissionGranted ? 'granted' as const : 'default' as const,
      requestPermission: nativePush.registerPush,
      sendLocalNotification: webPush.sendLocalNotification, // Fallback to web for local
      isNative: true,
      token: nativePush.token,
    };
  }

  return {
    isSupported: webPush.isSupported,
    isEnabled: webPush.isEnabled,
    permission: webPush.permission,
    requestPermission: webPush.requestPermission,
    sendLocalNotification: webPush.sendLocalNotification,
    isNative: false,
    token: null,
  };
}
