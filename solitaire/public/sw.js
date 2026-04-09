// GrandmaGame Solitaire — Service Worker
// Precaches app shell; runtime-caches static assets.
// Does NOT cache user-uploaded images (IndexedDB blobs).

const CACHE_NAME = 'grandmagame-v1';

// App shell — populated at build time by the list below.
// Vite hashes filenames, so we cache the root HTML + manifest +
// icons and let runtime caching handle hashed JS/CSS bundles.
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon.svg',
];

// ── Install: precache app shell ────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ─────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: stale-while-revalidate for static assets ────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) return;

  // Skip blob: and data: URLs (user-uploaded card backs)
  if (request.url.startsWith('blob:') || request.url.startsWith('data:')) return;

  // Navigation requests: network-first (so updates are picked up)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const fetched = fetch(request).then((response) => {
          cache.put(request, response.clone());
          return response;
        });
        return cached || fetched;
      })
    )
  );
});
