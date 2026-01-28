// Service Worker for Web Push Notifications - Vida em Cristo
// Funciona mesmo com o app fechado (como WhatsApp/Instagram)

const CACHE_NAME = 'vida-em-cristo-v2';

// Handle push events - triggered when notification arrives
self.addEventListener('push', function(event) {
  console.log('[SW] Push event received');

  let notificationData = {
    title: '🙏 Vida em Cristo',
    body: 'Você tem uma nova notificação!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'vida-em-cristo-' + Date.now(),
    data: {
      url: '/dashboard',
    },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        tag: payload.tag || notificationData.tag,
        data: {
          url: payload.url || payload.action_url || '/dashboard',
        },
      };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      notificationData.body = event.data.text();
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      requireInteraction: true,
      renotify: true,
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'close', title: 'Fechar' },
      ],
    }
  );

  event.waitUntil(promiseChain);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification click:', event.action);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/dashboard';

  const promiseChain = self.clients
    .matchAll({
      type: 'window',
      includeUncontrolled: true,
    })
    .then(function(windowClients) {
      // Check if there's already a window open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    });

  event.waitUntil(promiseChain);
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Notification closed');
});

// Handle service worker install
self.addEventListener('install', function(event) {
  console.log('[SW] Service worker installed');
  self.skipWaiting();
});

// Handle service worker activate
self.addEventListener('activate', function(event) {
  console.log('[SW] Service worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle fetch for offline support (optional)
self.addEventListener('fetch', function(event) {
  // Let the browser do its default thing for non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For GET requests, try network first, then cache
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});
