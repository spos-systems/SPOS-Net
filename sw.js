/* SPOS Net v2 service worker.
 * v1 shipped a cache-first worker; this replacement purges every legacy
 * cache immediately so returning visitors get the new build, and keeps
 * nothing cached — a speed test has no offline value.
 */
const VERSION = 'sposnet-v2.1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* pure pass-through: never serve stale UI */
self.addEventListener('fetch', () => { /* no-op */ });

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
