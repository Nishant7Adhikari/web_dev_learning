const CACHE_NAME = 'vertex-foundry-cache-v1';
const urlsToCache = [
    'index.html',
    'offline.html',
    'manifest.json',
    'icon-192.jpg',
    'icon-512.jpg'
];

// Install event – cache files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(urlsToCache))
    );
});

// Activate event
self.addEventListener('activate', event => {
    console.log('Service Worker activated');
});

// Fetch event – serve cached files if offline
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match('offline.html'))
    );
});