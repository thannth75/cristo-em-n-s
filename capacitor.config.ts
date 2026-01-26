import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.106ec547198a4536bba29c5948d32e02',
  appName: 'vidaemcristo',
  webDir: 'dist',
  server: {
    url: 'https://106ec547-198a-4536-bba2-9c5948d32e02.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
