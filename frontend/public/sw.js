// Gymmer Dashboard — Service Worker
// Caches the app shell for offline support and faster loads

const CACHE_NAME = 'gymmer-dashboard-v1';

// Core app shell files to cache
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: pre-cache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - API calls: Network-first (always fetch fresh data; fall back to offline message)
// - Assets (JS/CSS/icons): Cache-first (serve from cache, update in background)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // API routes: network-first, no caching
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(
          JSON.stringify({ error: 'You appear to be offline. Please check your connection.' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
    );
    return;
  }

  // App shell + static assets: cache-first, network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          // Update cache with fresh response
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
