/**
 * Mobil uygulama www paketi + yerel vendor kütüphaneler.
 *
 *   node scripts/build-mobil-app.js
 *
 * Çıktı: mobile-app/public/  (Capacitor webDir)
 * Ayrıca PWA dosyaları proje köküne / www'ye yazılır.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const root = path.join(__dirname, '..');
const www = path.join(root, 'mobile-app', 'public');
const vendorDir = path.join(www, 'assets', 'vendor');

const VENDORS = [
  {
    url: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
    file: 'supabase.min.js',
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
    file: 'xlsx.full.min.js',
  },
];

function mkdir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn('EKSIK:', path.relative(root, src));
    return false;
  }
  mkdir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return true;
}

function copyDir(srcDir, destDir, filter) {
  if (!fs.existsSync(srcDir)) return;
  mkdir(destDir);
  for (const name of fs.readdirSync(srcDir)) {
    const s = path.join(srcDir, name);
    const d = path.join(destDir, name);
    const st = fs.statSync(s);
    if (st.isDirectory()) copyDir(s, d, filter);
    else if (!filter || filter(name, s)) copyFile(s, d);
  }
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    mkdir(path.dirname(dest));
    const file = fs.createWriteStream(dest);
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'simteks-erp-build' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        download(res.headers.location, dest).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        reject(new Error('HTTP ' + res.statusCode + ' ' + url));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(dest)));
    });
    req.on('error', (err) => {
      try { file.close(); fs.unlinkSync(dest); } catch (_) {}
      reject(err);
    });
  });
}

function patchHtml(html) {
  // Tailwind CDN kalır (derleyici); supabase + xlsx yerelleştirilir
  html = html.replace(
    /<script src="https:\/\/unpkg\.com\/@supabase\/supabase-js@2"><\/script>/,
    '<script src="assets/vendor/supabase.min.js"></script>'
  );
  html = html.replace(
    /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/xlsx@0\.18\.5\/dist\/xlsx\.full\.min\.js"><\/script>/,
    '<script src="assets/vendor/xlsx.full.min.js"></script>'
  );

  if (!html.includes('manifest.webmanifest')) {
    html = html.replace(
      '<meta name="theme-color" content="#111827">',
      `<meta name="theme-color" content="#111827">
    <link rel="manifest" href="manifest.webmanifest">
    <link rel="apple-touch-icon" href="assets/mobil/icons/icon-192.png">
    <link rel="icon" type="image/png" sizes="192x192" href="assets/mobil/icons/icon-192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="assets/mobil/icons/icon-512.png">`
    );
  }

  if (!html.includes('serviceWorker.register')) {
    html = html.replace(
      '</body>',
      `<script>
(function () {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  });
})();
</script>
</body>`
    );
  }

  return html;
}

const MANIFEST = {
  name: 'Simteks Tekstil ERP',
  short_name: 'Simteks ERP',
  description: 'Simteks Tekstil ERP mobil uygulaması',
  start_url: './index.html',
  scope: './',
  display: 'standalone',
  orientation: 'portrait-primary',
  background_color: '#111827',
  theme_color: '#111827',
  lang: 'tr',
  icons: [
    { src: 'assets/mobil/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: 'assets/mobil/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
};

const SW_JS = `/* Simteks ERP Mobil — uygulama kabuğu önbelleği */
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
`;

async function main() {
  if (fs.existsSync(www)) {
    try {
      fs.rmSync(www, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch (_) {
      // Windows kilit: dosyaları tek tek sil
      function forceRm(p) {
        if (!fs.existsSync(p)) return;
        const st = fs.statSync(p);
        if (st.isDirectory()) {
          for (const name of fs.readdirSync(p)) forceRm(path.join(p, name));
          try { fs.rmdirSync(p); } catch (_) {}
        } else {
          try { fs.unlinkSync(p); } catch (_) {}
        }
      }
      forceRm(www);
    }
  }
  mkdir(www);
  mkdir(vendorDir);

  console.log('Vendor indiriliyor...');
  for (const v of VENDORS) {
    const dest = path.join(vendorDir, v.file);
    try {
      await download(v.url, dest);
      console.log('  OK', v.file, '(' + fs.statSync(dest).size + ' bayt)');
    } catch (err) {
      console.error('  HATA', v.file, err.message);
      process.exitCode = 1;
      return;
    }
  }

  let html = fs.readFileSync(path.join(root, 'mobil-erp.html'), 'utf8');
  html = patchHtml(html);
  fs.writeFileSync(path.join(www, 'index.html'), html, 'utf8');
  // Geliştirme / eski linkler için aynı dosya
  fs.writeFileSync(path.join(www, 'mobil-erp.html'), html, 'utf8');

  const cfg = path.join(root, 'erp-config.js');
  if (fs.existsSync(cfg)) copyFile(cfg, path.join(www, 'erp-config.js'));
  else {
    copyFile(path.join(root, 'erp-config.sample.js'), path.join(www, 'erp-config.js'));
    console.warn('UYARI: erp-config.js yok — sample kopyalandı.');
  }
  copyFile(path.join(root, 'erp-build.js'), path.join(www, 'erp-build.js'));

  copyFile(
    path.join(root, 'assets', 'erp_auth_tablo_fix.embed.js'),
    path.join(www, 'assets', 'erp_auth_tablo_fix.embed.js')
  );
  copyFile(
    path.join(root, 'assets', 'stok-kart-desktop.js'),
    path.join(www, 'assets', 'stok-kart-desktop.js')
  );
  copyFile(
    path.join(root, 'assets', 'mamul-depo-toplu.js'),
    path.join(www, 'assets', 'mamul-depo-toplu.js')
  );
  copyFile(
    path.join(root, 'assets', 'mobil', 'mobil-app.js'),
    path.join(www, 'assets', 'mobil', 'mobil-app.js')
  );
  copyFile(
    path.join(root, 'assets', 'mobil', 'mobil-erp.css'),
    path.join(www, 'assets', 'mobil', 'mobil-erp.css')
  );
  copyDir(path.join(root, 'assets', 'mobil', 'icons'), path.join(www, 'assets', 'mobil', 'icons'));

  fs.writeFileSync(path.join(www, 'manifest.webmanifest'), JSON.stringify(MANIFEST, null, 2), 'utf8');
  fs.writeFileSync(path.join(www, 'sw.js'), SW_JS, 'utf8');

  // Kök PWA (sunucu paketi / yerel önizleme için)
  copyFile(path.join(www, 'manifest.webmanifest'), path.join(root, 'manifest.webmanifest'));
  copyFile(path.join(www, 'sw.js'), path.join(root, 'sw.js'));

  console.log(JSON.stringify({
    ok: true,
    www: path.relative(root, www),
    indexBytes: html.length,
  }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
