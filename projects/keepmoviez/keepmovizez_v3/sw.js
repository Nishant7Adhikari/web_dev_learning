const CACHE_NAME = 'keepmoviez-cache-v3.0'; // Increment version if you change cached files
const OFFLINE_URL = 'offline.html'; // Your offline fallback page

const CORE_ASSETS = [
  './', // Alias for index.html
  './index.html',
  './style.css',
  './manifest.json',
  './offline.html',
  './js/constant.js',
  './js/utils.js',
  './js/indexeddb.js',
  './js/data.js',
  './js/io1.js',
  './js/io2.js',
  './js/tmdb.js',
  './js/genre.js',
  './js/ui.js',
  './js/stats.js',
  './js/supabase.js',
  './js/main.js',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png', 'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;900&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js',
  'https://code.jquery.com/jquery-3.5.1.slim.min.js',
  'https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.2/dist/umd/popper.min.js',
  'https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  // Add any other critical assets from CDNs if you have them (e.g., webfonts for Font Awesome)
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching core assets');
        // Create a new Request object for Google Fonts with no-cors mode
        const googleFontsRequest = new Request(
          'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;900&display=swap',
          { mode: 'no-cors' } // Use no-cors for opaque response, or implement a proper strategy for Google Fonts
        );
        // Cache all core assets
        const assetsToCache = CORE_ASSETS.filter(url => !url.includes('fonts.googleapis.com'));
        assetsToCache.push(googleFontsRequest);

        return cache.addAll(assetsToCache);
      })
      .then(() => {
        console.log('Core assets cached successfully');
      })
      .catch(error => {
        console.error('Failed to cache core assets:', error);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response; // Serve from cache
          }
          // Not in cache, fetch from network
          return fetch(event.request).then((networkResponse) => {
            // Optionally, cache new resources dynamically (be careful with this)
            // if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            //   const responseToCache = networkResponse.clone();
            //   caches.open(CACHE_NAME).then((cache) => {
            //     cache.put(event.request, responseToCache);
            //   });
            // }
            return networkResponse;
          }).catch(() => {
            // For non-navigation requests, if network fails and not in cache,
            // you might return a generic error response or nothing.
            // For simplicity, we're not providing a specific fallback here for non-navigation.
            if (event.request.url.includes('image')) { // Example: Fallback for images
                 // return caches.match('path/to/your/placeholder-image.png');
            }
          });
        })
    );
  }
});
