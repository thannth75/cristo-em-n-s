import { useEffect, useCallback, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface NativePushState {
  isNative: boolean;
  isSupported: boolean;
  permissionGranted: boolean;
  token: string | null;
}

export function useNativePushNotifications() {
  const { user, isApproved } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<NativePushState>({
    isNative: false,
    isSupported: false,
    permissionGranted: false,
    token: null,
  });

  const isNativePlatform = Capacitor.isNativePlatform();

  // Register push notifications for native platforms
  const registerPush = useCallback(async () => {
    if (!isNativePlatform) return;

    try {
      // Check if we have permission
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('[NativePush] Permission not granted');
        setState(prev => ({ ...prev, permissionGranted: false }));
        return;
      }

      setState(prev => ({ ...prev, permissionGranted: true }));

      // Register with the system
      await PushNotifications.register();
    } catch (error) {
      console.error('[NativePush] Error registering:', error);
    }
  }, [isNativePlatform]);

  // Save token to database
  const saveToken = useCallback(async (token: string) => {
    if (!user?.id) return;

    try {
      // Save as push_token in notification_preferences
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          push_token: token,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('[NativePush] Error saving token:', error);
      } else {
        console.log('[NativePush] Token saved successfully');
      }
    } catch (err) {
      console.error('[NativePush] Error:', err);
    }
  }, [user?.id]);

  // Setup listeners
  useEffect(() => {
    if (!isNativePlatform) {
      setState(prev => ({ ...prev, isNative: false, isSupported: false }));
      return;
    }

    setState(prev => ({ ...prev, isNative: true, isSupported: true }));

    // Registration success listener
    const registrationListener = PushNotifications.addListener('registration', (token: Token) => {
      console.log('[NativePush] Registration token:', token.value);
      setState(prev => ({ ...prev, token: token.value }));
      saveToken(token.value);
    });

    // Registration error listener
    const registrationErrorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('[NativePush] Registration error:', error);
      toast({
        title: 'Erro nas notificações',
        description: 'Não foi possível registrar as notificações push.',
        variant: 'destructive',
      });
    });

    // Push notification received (foreground)
    const pushReceivedListener = PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('[NativePush] Notification received:', notification);
      // Show a local toast when app is in foreground
      toast({
        title: notification.title || 'Nova notificação',
        description: notification.body || '',
      });
    });

    // Push notification action performed (user tapped)
    const pushActionListener = PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('[NativePush] Action performed:', notification);
      // Handle navigation based on notification data
      const data = notification.notification.data;
      if (data?.url) {
        window.location.href = data.url;
      }
    });

    // Cleanup
    return () => {
      registrationListener.then(l => l.remove());
      registrationErrorListener.then(l => l.remove());
      pushReceivedListener.then(l => l.remove());
      pushActionListener.then(l => l.remove());
    };
  }, [isNativePlatform, saveToken, toast]);

  // Auto-register when user is approved
  useEffect(() => {
    if (isNativePlatform && user && isApproved) {
      registerPush();
    }
  }, [isNativePlatform, user, isApproved, registerPush]);

  return {
    ...state,
    registerPush,
  };
}
