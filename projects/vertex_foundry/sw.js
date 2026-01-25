const CACHE_NAME = 'vertex-foundry-cache-v2';
const urlsToCache = [
    '/',
    'index.html',
    'offline.html',
    'manifest.json',
    'style.css',
    'script.js',
    'curriculumData.js',
    'icon-192.png',
    'icon-512.png'
];

// Install event - cache files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('Opened cache');
            return cache.addAll(urlsToCache);
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - serve cached files if available, with network fallback
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            // Cache hit - return response
            if (response) {
                return response;
            }
            // Not in cache - fetch from network
            return fetch(event.request).catch(() => {
                // Network request failed - return offline page
                return caches.match('offline.html');
            });
        })
    );
});