// Service worker for web push notifications.
// Owner-facing only — installed via Admin > Notifications settings.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: 'New notification', body: event.data.text() };
  }

  const title = payload.title || 'imPRESSive Juice Bar';
  const options = {
    body: payload.body || '',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: payload.tag,
    data: { url: payload.url || '/admin' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/admin';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        try {
          const url = new URL(client.url);
          if (url.origin === self.location.origin && 'focus' in client) {
            client.navigate(targetUrl).catch(() => {});
            return client.focus();
          }
        } catch (e) {
          // ignore
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    }),
  );
});
