// Service Worker for Drinkosaur PWA and Push Notifications
try {
    importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

    firebase.initializeApp({
        apiKey: "AIzaSyBGkKn2DBlD0HLmI3Smc10lJF143Co2_Ew",
        authDomain: "drinkosaur-5cebe.firebaseapp.com",
        projectId: "drinkosaur-5cebe",
        storageBucket: "drinkosaur-5cebe.firebasestorage.app",
        messagingSenderId: "999271625766",
        appId: "1:999271625766:web:b4104448736a297fc7e2e7",
    });

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
        console.log('[sw.js] Received background message ', payload);
        if (payload.notification) {
            const notificationTitle = payload.notification.title || 'Drinkosaur';
            const notificationOptions = {
                body: payload.notification.body,
                icon: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj3GwalK-_8qkiqtJ9wxjVPg7C3VGn-slPe3XK-DNhm4iSq2f0VBeOEjanUW_uoncmzZu74szYMJhs_o8xYV0RU3g-HZTflVBgh9Tj8wSy43r1MiQrgyrp8HIQJyP6wBQu5bT5tFCrLhskSvzeL8flCHnZ6T-7kheSEkcwm6fQuSGZE-LKrBq6KbB_pg4k/s16000/drinkosaur.png',
                badge: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj3GwalK-_8qkiqtJ9wxjVPg7C3VGn-slPe3XK-DNhm4iSq2f0VBeOEjanUW_uoncmzZu74szYMJhs_o8xYV0RU3g-HZTflVBgh9Tj8wSy43r1MiQrgyrp8HIQJyP6wBQu5bT5tFCrLhskSvzeL8flCHnZ6T-7kheSEkcwm6fQuSGZE-LKrBq6KbB_pg4k/s16000/drinkosaur.png'
            };
            self.registration.showNotification(notificationTitle, notificationOptions);
        }
    });
} catch (e) {
    console.error('Service Worker: Firebase scripts failed to load or initialize', e);
}

const CACHE_NAME = 'drinkosaur-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://cdn.tailwindcss.com'
];

// PWA Logic: Install and Cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
