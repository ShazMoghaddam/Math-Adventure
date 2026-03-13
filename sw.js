/* ════════════════════════════════════════════════════
   Math Adventure — sw.js
   Service Worker: cache-first strategy for full
   offline play. Bump CACHE_VERSION to force update.
════════════════════════════════════════════════════ */

const CACHE_VERSION = 'math-adventure-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

const FONT_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Boogaloo&family=Nunito:wght@800;900&display=swap',
  'https://fonts.gstatic.com/s/boogaloo/v37/kmK-Zq45GAvOdnaW6x1F_SqM.woff2',
  'https://fonts.gstatic.com/s/nunito/v26/XRXI3I6Li01BKofiOc5wtlZ2di8HDIkhdA.woff2',
];

/* ── Install: pre-cache core assets ─────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      // Core assets must succeed; fonts are best-effort
      return cache.addAll(CORE_ASSETS).then(() =>
        Promise.allSettled(FONT_ASSETS.map(url => cache.add(url)))
      );
    }).then(() => self.skipWaiting())
  );
});

/* ── Activate: remove old caches ────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: cache-first, network fallback ───────── */
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip non-http(s) requests (e.g. chrome-extension)
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Not in cache — fetch from network and cache for next time
      return fetch(event.request).then(response => {
        // Only cache valid responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Don't cache opaque cross-origin responses (except fonts)
        const isFont = url.hostname === 'fonts.gstatic.com' ||
                       url.hostname === 'fonts.googleapis.com';
        if (response.type === 'opaque' && !isFont) return response;

        const toCache = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(event.request, toCache));
        return response;

      }).catch(() => {
        // Network failed and nothing in cache
        // Return offline fallback for HTML navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('', { status: 408, statusText: 'Offline' });
      });
    })
  );
});

/* ── Message: force update from app ─────────────── */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
