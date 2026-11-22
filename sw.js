/* SPOS Net v2.2 service worker — installable PWA with offline app shell.
 *
 * Strategy:
 *   • Precache the app shell (HTML, CSS, JS, icons, logo, manifest).
 *   • Same-origin GET assets: stale-while-revalidate — instant opens, updates
 *     arrive in the background on the next visit.
 *   • Cross-origin requests (the Cloudflare measurement endpoints, fonts CDN,
 *     RIPEstat, API calls) are never intercepted — they must hit the network.
 *   • Legacy caches are purged on activate.
 */
const VERSION = 'sposnet-v4.0.0';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './404.html',
  './assets/css/fonts.css?v=4',
  './assets/css/style.css?v=4',
  './assets/js/app.js?v=4',
  './assets/js/engine.js',
  './assets/js/gauge.js',
  './assets/js/i18n.js',
  './assets/fonts/readex-pro-arabic-var.woff2',
  './assets/fonts/readex-pro-latin-var.woff2',
  './assets/img/company-logo.png',
  './assets/img/favicon.svg',
  './assets/img/favicon-32.png',
  './assets/img/icon-180.png',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './assets/img/icon-512-maskable.png',
  './favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => Promise.allSettled(SHELL.map((u) => cache.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isFont = (u) => u.pathname.endsWith('.woff2');

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;          /* never touch measurement traffic */
  if (url.pathname.includes('/assets/testdata/')) return;  /* 16 MB test payload — network only, never cached */

  /* navigations: network-first so updates land, cache fallback offline */
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || Response.error())),
    );
    return;
  }

  /* fonts & icons: cache-first (immutable enough) */
  if (isFont(url) || url.pathname.startsWith('/assets/img/')) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })),
    );
    return;
  }

  /* other same-origin assets: stale-while-revalidate */
  event.respondWith(
    caches.match(req).then((hit) => {
      const refresh = fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || refresh;
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
