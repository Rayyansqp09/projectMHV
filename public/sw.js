self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};

  self.registration.showNotification(data.title || 'New Pending Match', {
    body: data.body || 'A new match arrived in pending list',
    icon: data.icon || '/images/logo.png',
    data: {
      url: '/admin/pending'
    }
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
