'use strict';
/**
 * SPOS Net service worker — offline shell caching.
 * Strategy: stale-while-revalidate for same-origin GET requests.
 * Test traffic (speed.cloudflare.com) is never cached or intercepted.
 */
const CACHE = 'sposnet-v1';

const SHELL = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/i18n.js',
  './assets/js/engine.js',
  './assets/js/gauge.js',
  './assets/js/app.js',
  './assets/fonts/cairo-arabic.woff2',
  './assets/fonts/cairo-latin.woff2',
  './assets/img/logo.png',
  './assets/img/favicon-32.png',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // only same-origin, non-API GET requests
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.includes('__down') || url.pathname.includes('__up')) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      const network = fetch(req).then((resp) => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
