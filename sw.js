/* SPOS Net v9.2 service worker — installable PWA with offline app shell.
 *
 * Strategy (v7+ — "updates land on the first visit"):
 *   • Precache the app shell (HTML, CSS, JS, fonts, icons, manifest).
 *   • Navigations AND code assets (CSS/JS): NETWORK-FIRST — a fresh
 *     deploy is what the user sees on the very next visit, cache is
 *     only the offline fallback.
 *   • Fonts: two small variable-font files (Kufi arabic + latin),
 *     version-stamped URLs — cached as immutable assets.
 *   • Images & any stray static file: cache-first (immutable assets).
 *   • Cross-origin requests (Cloudflare measurement endpoints, RIPEstat,
 *     APIs) are never intercepted.
 *   • All caches from older versions are purged on activate.
 */
const VERSION = 'sposnet-v9.3.0';

const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './404.html',
  './assets/fonts/nkufi-arabic-v9.woff2',
  './assets/fonts/nkufi-latin-v9.woff2',
  './assets/css/fonts.css?v=9.3',
  './assets/css/style.css?v=9.3',
  './assets/js/app.js?v=9.3',
  './assets/js/engine.js',
  './assets/js/gauge.js',
  './assets/js/i18n.js',
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

  /* network-first: navigations and code (css/js) — fresh deploy wins,
     cache only keeps the app usable offline */
  if (req.mode === 'navigate' || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then(
            (r) =>
              r ||
              caches.match('./index.html').then((h) => h || Response.error()),
          ),
        ),
    );
    return;
  }

  /* fonts & icons: cache-first (URLs are version-stamped and immutable) */
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

  /* any other same-origin GET: stale-while-revalidate */
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
