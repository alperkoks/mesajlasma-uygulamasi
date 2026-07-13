const CACHE_NAME = 'agchat-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// Service Worker Kurulumu (Install) ve Dosyaları Önbelleğe Alma
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 PWA Önbellekleme Yapılıyor...');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Eski Önbellekleri Temizleme (Activate)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('🧹 Eski PWA Önbelleği Siliniyor:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// İstekleri Yakalama (Fetch) ve Ağ Hatası Durumunda Önbelleği Kullanma
self.addEventListener('fetch', (event) => {
    // Socket.io ve API isteklerini önbelleğe alma (sadece statik dosyalar)
    if (event.request.url.includes('/api/') || event.request.url.includes('/socket.io/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).catch(() => {
                // Eğer sayfa/dosya ağ hatası yüzünden yüklenemiyorsa çevrimdışı yedek döndür
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
