// Service Worker for Antigravity Chat Push Notifications
self.addEventListener('push', (event) => {
    let data = { title: 'Yeni Mesaj', body: 'Harika bir haberiniz var!' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            // Text payload fallback
            data = { title: 'Yeni Mesaj', body: event.data.text() };
        }
    }

    const title = data.title;
    const options = {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        data: data.data || {}
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Uygulamayı aç veya odaklan
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// PWA Standalone Yükleme Kriterleri (Install, Activate ve Fetch Dinleyicileri)
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // İstekleri normal şekilde ağa iletiyoruz
    event.respondWith(fetch(event.request));
});
