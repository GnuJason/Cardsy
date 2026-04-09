// GrandmaGame Solitaire — Service Worker
// Precaches app shell; runtime-caches static assets (200 only).
// Does NOT cache user-uploaded images (IndexedDB blobs).

const SW_VERSION = 'v5.2.2';
const CACHE_NAME = `grandmagame-static-${SW_VERSION}`;

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

// ── Messages: handle CLEAR_CACHES ──────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_CACHES') {
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    ).then(() => {
      if (event.source) {
        event.source.postMessage({ type: 'CACHES_CLEARED' });
      }
    });
  }
});

// ── Fetch: network-first nav, stale-while-revalidate assets ─
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
          // Only cache successful full responses (never 206 partials)
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/').then((r) => r || new Response('Offline', { status: 503 })))
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const fetched = fetch(request).then((response) => {
          // Only cache 200 OK — never partials (206) or errors
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => {
          // Network failed — return cached or a 503
          return cached || new Response('Offline', { status: 503 });
        });
        return cached || fetched;
      })
    )
  );
});
