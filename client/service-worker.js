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
        vibrate: [150, 80, 150], // Daha belirgin bir titreşim deseni
        data: data.data || {}
    };

    const payloadData = data.data || {};
    const senderId = payloadData.senderId;
    const groupId = payloadData.groupId;

    event.waitUntil(
        caches.open('app-settings').then((cache) => {
            return cache.match('/muted-chats');
        }).then((response) => {
            if (response) {
                return response.json().catch(() => []);
            }
            return [];
        }).then((mutedChats) => {
            const isGroupMuted = groupId && mutedChats.includes(`group_${groupId}`);
            const isUserMuted = senderId && mutedChats.includes(`user_${senderId}`);

            if (isGroupMuted || isUserMuted) {
                console.log('Bu sohbet sessize alınmış, bildirim sessiz gösterilecek.');
                options.silent = true;
                options.vibrate = [];
            }
            
            return self.registration.showNotification(title, options);
        }).catch((err) => {
            console.error('Push bildirim hatası:', err);
            return self.registration.showNotification(title, options);
        })
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
