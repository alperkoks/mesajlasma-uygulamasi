// GELİŞTİRME SÜRECİNDE ÖNBELLEK BYPASS EDİCİ SERVICE WORKER
const CACHE_NAME = 'agchat-bypass-v5';

self.addEventListener('install', (event) => {
    // Kurulum anında beklemeden hemen aktif olmasını sağla
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Eski tüm önbellekleri tamamen sil ve temizle
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    console.log('🧹 Geliştirme Temizliği - Önbellek Siliniyor:', cache);
                    return caches.delete(cache);
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Tüm istekleri önbelleğe almadan doğrudan ağdan çek (Network-Only)
self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
});
