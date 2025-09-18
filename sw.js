const CACHE_NAME = 'nishant-adhikari-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/data/projects.json',
  '/data/teams.json',
  '/media/icon-512x512.png',
  '/media/icon-192x192.png',
  '/media/icons/default.png',
  '/media/icons/keepmoviez.png',
  '/media/male.svg',
  '/media/female.svg',
  '/media/social/discord.svg',
  '/media/social/github.svg',
  '/media/social/twitter.svg',
  '/media/social/instagram.svg',
  '/media/social/facebook.svg',
  '/media/social/linkedin.svg'
];

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Note: addAll() is atomic. If one fetch fails, the whole operation fails.
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event with Network-First for data and Cache-First for assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // For data files (JSON), use a Network-First strategy.
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If the fetch is successful, clone the response and cache it.
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          // If the fetch fails (e.g., offline), return the cached version.
          return caches.match(request);
        })
    );
  } else {
    // For all other requests, use the Cache-First strategy.
    event.respondWith(
      caches.match(request)
        .then(response => {
          // Cache hit - return response
          if (response) {
            return response;
          }
          // Not in cache - fetch from network
          return fetch(request);
        })
    );
  }
});

// Activate event to clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});