const CACHE_NAME = 'peerlight-shell-v1780376953534';
const FONTS_CACHE = 'peerlight-fonts-v1';
const SHELL_ASSETS = [
  '/',
  '/offline',
  '/_next/static/chunks/15pjn.n4_q6le.js',
  '/_next/static/chunks/0pqt~8bl3ukh4.js',
  '/_next/static/chunks/07lhk_q6pmm3r.js',
  '/_next/static/chunks/0c7h~x4_chf35.js',
  '/_next/static/chunks/turbopack-0kemc0e062jzz.js',
  '/_next/static/chunks/03~yq9q893hmn.js',
  '/_next/static/chunks/0d352~a3j7k5b.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const KEEP = [CACHE_NAME, FONTS_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never cache API calls (privacy guard)
  if (url.pathname.startsWith('/api/')) return;

  // 2. Google Fonts — stale-while-revalidate into FONTS_CACHE
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONTS_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // 3. Next.js static assets (hashed = immutable) — cache-first with runtime put
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => undefined);
      })
    );
    return;
  }

  // 4. Navigation requests — network-first, fallback to /offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline'))
    );
    return;
  }

  // 5. All other static — cache-first with silent catch
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).catch(() => undefined);
    })
  );
});
