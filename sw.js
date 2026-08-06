/* Simteks ERP Mobil — uygulama kabuğu önbelleği */
const CACHE = 'simteks-erp-mobil-v2';
const PRECACHE = [
  './',
  './index.html',
  './erp-config.js',
  './erp-build.js',
  './manifest.webmanifest',
  './assets/vendor/supabase.min.js',
  './assets/vendor/xlsx.full.min.js',
  './assets/erp_auth_tablo_fix.embed.js',
  './assets/stok-kart-desktop.js',
  './assets/mamul-depo-toplu.js',
  './assets/mobil/mobil-app.js',
  './assets/mobil/icons/icon-192.png',
  './assets/mobil/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => undefined)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Supabase / API — her zaman ağ
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/rest/') || url.pathname.includes('/auth/')) {
    return;
  }
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.ok && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
