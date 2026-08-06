/**
 * Sunucuya yüklenecek dosyaları tek klasörde toplar.
 *
 *   node scripts/paket-sunucu.js          → sunucuya-at/     (masaüstü + mobil)
 *   node scripts/paket-sunucu.js mobil    → sunucuya-at-mobil/  (yalnızca mobil)
 */
const fs = require('fs');
const path = require('path');

const mobilOnly = process.argv.includes('mobil');
const root = path.join(__dirname, '..');
const out = path.join(root, mobilOnly ? 'sunucuya-at-mobil' : 'sunucuya-at');

function mkdir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) return false;
  mkdir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return true;
}

function dirSize(dir) {
  let n = 0;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    n += st.isDirectory() ? dirSize(p) : st.size;
  }
  return n;
}

function countFiles(dir) {
  let n = 0;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    n += fs.statSync(p).isDirectory() ? countFiles(p) : 1;
  }
  return n;
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

if (fs.existsSync(out)) {
  fs.rmSync(out, { recursive: true, force: true });
}
mkdir(out);

if (mobilOnly) {
  copyFile(path.join(root, 'mobil-erp.html'), path.join(out, 'mobil-erp.html'));

  fs.writeFileSync(path.join(out, 'index.html'), `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Simteks ERP Mobil</title>
  <script>location.replace('mobil-erp.html');</script>
</head>
<body><p><a href="mobil-erp.html">Mobil ERP</a></p></body>
</html>
`, 'utf8');

  copyFile(path.join(root, 'robots.txt'), path.join(out, 'robots.txt'));

  const cfg = path.join(root, 'erp-config.js');
  const cfgOut = path.join(out, 'erp-config.js');
  if (fs.existsSync(cfg)) {
    copyFile(cfg, cfgOut);
  } else {
    copyFile(path.join(root, 'erp-config.sample.js'), cfgOut);
    console.warn('UYARI: erp-config.js yok — sample kopyalandi. Supabase bilgilerini doldurun!');
  }

  copyFile(path.join(root, 'erp-build.js'), path.join(out, 'erp-build.js'));
  copyFile(path.join(root, 'manifest.webmanifest'), path.join(out, 'manifest.webmanifest'));
  copyFile(path.join(root, 'sw.js'), path.join(out, 'sw.js'));
  copyFile(path.join(root, 'assets', 'stok-kart-desktop.js'), path.join(out, 'assets', 'stok-kart-desktop.js'));
  copyFile(path.join(root, 'assets', 'mamul-depo-toplu.js'), path.join(out, 'assets', 'mamul-depo-toplu.js'));
  copyFile(path.join(root, 'assets', 'erp_auth_tablo_fix.embed.js'), path.join(out, 'assets', 'erp_auth_tablo_fix.embed.js'));
  copyFile(path.join(root, 'assets', 'mobil', 'mobil-app.js'), path.join(out, 'assets', 'mobil', 'mobil-app.js'));
  copyFile(path.join(root, 'assets', 'mobil', 'mobil-erp.css'), path.join(out, 'assets', 'mobil', 'mobil-erp.css'));
  copyDir(path.join(root, 'assets', 'mobil', 'icons'), path.join(out, 'assets', 'mobil', 'icons'));

  const kb = Math.round(dirSize(out) / 1024);
  fs.writeFileSync(path.join(out, 'OKU-BENI.txt'), `SIMTEKS ERP — YALNIZCA MOBİL PAKET
==================================

Bu klasördeki HER ŞEYİ sunucuya yükleyin. Başka dosya gerekmez.

Açılış adresi:
  https://siteniz.com/mobil-erp.html
  veya https://siteniz.com/  (otomatik yönlendirir)

Telefonda uygulama gibi: Chrome → Ana ekrana ekle (PWA).
Gerçek APK için: MOBIL-UYGULAMA-OKU.txt

Dosyalar (hepsi gerekli):
  mobil-erp.html, index.html, erp-config.js, erp-build.js
  manifest.webmanifest, sw.js
  assets/mobil/*, assets/stok-kart-desktop.js,
  assets/mamul-depo-toplu.js, assets/erp_auth_tablo_fix.embed.js
  robots.txt

Nasıl oluşturuldu:
  Proje klasöründe SUNUCUYA-AT-MOBIL.bat çift tıklayın.

Boyut: yaklaşık ${kb} KB
`, 'utf8');
} else {
  for (const f of ['index.html', 'stok.html', 'mobil-erp.html', 'robots.txt', 'erp-config.sample.js', 'netlify.toml', 'vercel.json', 'manifest.webmanifest', 'sw.js', 'erp-build.js']) {
    copyFile(path.join(root, f), path.join(out, f));
  }

  const cfg = path.join(root, 'erp-config.js');
  const cfgOut = path.join(out, 'erp-config.js');
  if (fs.existsSync(cfg)) {
    copyFile(cfg, cfgOut);
  } else {
    copyFile(path.join(root, 'erp-config.sample.js'), cfgOut);
    console.warn('UYARI: erp-config.js yok — sample kopyalandi. Supabase bilgilerini doldurun!');
  }

  copyDir(path.join(root, 'assets'), path.join(out, 'assets'), (name, full) => {
    if (name.endsWith('.xlsx')) return false;
    if (name.endsWith('.sql') && full.includes('assets')) return false;
    return true;
  });

  const standalone = path.join(root, 'mobil-erp.standalone.html');
  if (fs.existsSync(standalone)) {
    copyFile(standalone, path.join(out, 'mobil-erp.standalone.html'));
  }

  const kb = Math.round(dirSize(out) / 1024);
  fs.writeFileSync(path.join(out, 'OKU-BENI.txt'), `SIMTEKS ERP — SUNUCUYA YUKLEME PAKETI (TAM)
=====================================

Masaustu + mobil. HER SEYI sunucuya yukleyin.

  Masaustu : https://siteniz.com/stok.html
  Mobil    : https://siteniz.com/mobil-erp.html

erp-config.js → GitHub'a ATMAYIN.
Telefonda uygulama: Ana ekrana ekle (PWA) veya MOBIL-UYGULAMA-OKU.txt

Boyut: yaklasik ${kb} KB
`, 'utf8');
}

console.log(JSON.stringify({
  ok: true,
  mod: mobilOnly ? 'mobil' : 'tam',
  klasor: path.basename(out),
  kb: Math.round(dirSize(out) / 1024),
  dosyaSayisi: countFiles(out)
}, null, 2));
