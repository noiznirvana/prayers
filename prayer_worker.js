// Service Worker (sw.js)
const CACHE_NAME = 'miracle-hour-cache-v1'; // Increment version (e.g., v2) to force cache update

// Adjust this list to match your EXACT filenames and paths
const urlsToCache = [
  './', // Represents the root directory, often needed
  './miracle_hour_v2_pwa.html', // *** YOUR HTML FILENAME ***
  './miracle_hour_clock.png',
  './linda_schubert_photo.jpg',
  './icon-192x192.png',
  './icon-512x512.png',
  // You can also add the Google Font CSS URL if needed, though offline fonts can be complex
  'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap'
];

// --- Installation: Cache the app shell ---
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell:', urlsToCache.length, 'files');
        // Add all essential assets. If any fail, the installation fails.
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] App shell cached successfully');
        return self.skipWaiting(); // Activate worker immediately
      })
      .catch(err => console.error('[SW] Cache addAll failed:', err))
  );
});

// --- Activation: Clean up old caches ---
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
                  .map(cacheName => {
                    console.log('[SW] Deleting old cache:', cacheName);
                    return caches.delete(cacheName);
                  })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim(); // Take control of pages immediately
    })
  );
});

// --- Fetch: Serve from Cache first, then network ---
self.addEventListener('fetch', (event) => {
  // Let browser handle non-GET requests
  if (event.request.method !== 'GET') return;

  // Cache First strategy for most assets
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          // Optional: Stale-while-revalidate - fetch update in background
          // fetch(event.request).then(networkResponse => {
          //   caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          // });
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request).then(networkResponse => {
           // Optional: Cache the newly fetched resource for next time
           // Check if response is valid before caching
           // if(networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
           //    let responseToCache = networkResponse.clone();
           //    caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
           // }
           return networkResponse;
        }).catch(error => {
             console.warn(`[SW] Network fetch failed for ${event.request.url}: ${error}`);
             // If network fails AND not in cache, this will result in browser offline error
             // Could provide a generic offline fallback here if needed
        });
      })
  );
});

console.log('[SW] Service Worker Loaded');