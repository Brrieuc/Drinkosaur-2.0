// Minimal Service Worker to allow PWA Installation on iOS
self.addEventListener('fetch', (event) => {
    // Empty fetch listener is enough to satisfy PWA requirements
});

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Push notification listener (for future use)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Drinkosaur';
    const options = {
        body: data.body || 'Une mise à jour est disponible.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png'
    };
    event.waitUntil(self.registration.showNotification(title, options));
});
