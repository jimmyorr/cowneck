self.addEventListener('push', event => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (error) {
        data = { body: event.data ? event.data.text() : '' };
    }

    event.waitUntil(self.registration.showNotification(data.title || 'Good meow-ning!', {
        body: data.body || "Today's cat is ready.",
        icon: data.icon || 'https://placehold.co/192x192/FF9A9E/ffffff?text=Meow',
        badge: data.badge || 'https://placehold.co/96x96/FF9A9E/ffffff?text=Meow',
        tag: 'daily-meow',
        renotify: true,
        data: { url: data.url || '/games/cat-per-day.html' }
    }));
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        const targetUrl = new URL(event.notification.data.url, self.location.origin).href;
        for (const client of windowClients) {
            if ('focus' in client) {
                client.navigate(targetUrl);
                return client.focus();
            }
        }
        return clients.openWindow(targetUrl);
    }));
});