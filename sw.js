const CACHE = 'ea-admin-v6';
const STATIC = ['/enes-admin/icon-192.png', '/enes-admin/icon-512.png', '/enes-admin/apple-touch-icon.png'];

self.addEventListener('install', e => {
  // Statik dosyaları cache'le ama HTML'yi değil
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // HTML dosyaları: HER ZAMAN network'ten al, cache'leme
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Görseller: cache-first
  if (/\.(png|jpg|svg|webp|ico)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return r;
      }))
    );
    return;
  }

  // Diğer: network-first
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
