/**
 * GitHub'a yüklenecek kaynak kodu tek klasörde toplar.
 *
 *   node scripts/paket-github.js  →  github-at/
 *
 * GitHub web sürükle-bırak limiti: max 100 dosya.
 * Bu yüzden android/ios/www build kopyaları ve artıkları hariç tutulur.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'github-at');

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'dist-deneme',
  'sunucuya-at',
  'sunucuya-at-mobil',
  'github-at',
  'yedek',
  'releases',
  '.recovery_from_exe',
  // Capacitor build çıktıları (kaynak değil; npm/cap ile yeniden üretilir)
  'android',
  'ios',
  'www',
]);

const SKIP_FILES = new Set([
  'erp-config.js',
  'erp-update.config.js',
  'mobil-erp.standalone.html',
  '.env',
  'package-lock.json',
  '_main_script.js',
]);

const SKIP_EXT = new Set([
  '.exe',
  '.blockmap',
  '.dmg',
  '.apk',
  '.aab',
  '.msi',
  '.zip',
  '.7z',
  '.rar',
]);

function mkdir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function shouldSkipName(name, relFromRoot) {
  if (SKIP_DIRS.has(name) || SKIP_FILES.has(name)) return true;
  if (name.startsWith('.pre_exe_restore')) return true;
  if (name === '.env' || name.startsWith('.env.')) return true;
  if (name.startsWith('_') && name.endsWith('.js')) return true;
  const ext = path.extname(name).toLowerCase();
  if (SKIP_EXT.has(ext)) return true;
  // mobile-app/public Capacitor kopyası — asıl kaynak assets/mobil
  if (relFromRoot.replace(/\\/g, '/') === 'mobile-app' && name === 'public') return true;
  return false;
}

function copyTree(srcDir, destDir, relFromRoot) {
  mkdir(destDir);
  for (const name of fs.readdirSync(srcDir)) {
    if (shouldSkipName(name, relFromRoot || '')) continue;
    const s = path.join(srcDir, name);
    const d = path.join(destDir, name);
    let st;
    try {
      st = fs.statSync(s);
    } catch (e) {
      continue;
    }
    const nextRel = relFromRoot ? path.join(relFromRoot, name) : name;
    if (st.isDirectory()) {
      copyTree(s, d, nextRel);
    } else {
      mkdir(path.dirname(d));
      fs.copyFileSync(s, d);
    }
  }
}

function dirSize(dir) {
  let n = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    n += st.isDirectory() ? dirSize(p) : st.size;
  }
  return n;
}

function countFiles(dir) {
  let n = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    n += fs.statSync(p).isDirectory() ? countFiles(p) : 1;
  }
  return n;
}

function copyFileSafe(src, dest) {
  if (!fs.existsSync(src)) return;
  mkdir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

if (fs.existsSync(out)) {
  fs.rmSync(out, { recursive: true, force: true });
}
mkdir(out);
copyTree(root, out, '');

copyFileSafe(
  path.join(root, 'erp-config.sample.js'),
  path.join(out, 'erp-config.sample.js')
);
copyFileSafe(
  path.join(root, 'erp-update.config.sample.js'),
  path.join(out, 'erp-update.config.sample.js')
);

const kb = Math.round(dirSize(out) / 1024);
const mb = (kb / 1024).toFixed(1);
const n = countFiles(out);

if (n > 100) {
  console.warn(`UYARI: ${n} dosya — GitHub web sürükle-bırak max 100. GitHub Desktop veya git push kullanın.`);
}

fs.writeFileSync(
  path.join(out, 'OKU-BENI-GITHUB.txt'),
  `SIMTEKS TEKSTİL ERP — GITHUB PAKETİ
=====================================

Bu klasörün İÇİNDEKİ dosyaları GitHub'a yükleyin.

ÖNEMLİ — GitHub web sürükle-bırak:
  • En fazla 100 dosya kabul eder
  • Bu paket sadeleştirildi (~${n} dosya)
  • Hata alırsanız: GitHub Desktop ile klasörü ekleyin (önerilir)

NASIL (web)
  1) github.com → New repository
  2) "uploading an existing file" / dosya yükle
  3) github-at içindeki HER ŞEYİ seçip sürükleyin
     (klasörün kendisini değil, İÇİNDEKİLERİ)

NASIL (GitHub Desktop — daha sorunsuz)
  1) GitHub Desktop → Add → Add existing repository
     veya Create new repository, Local path = github-at
  2) Publish repository

İLK KURULUM (klonlayan)
  erp-config.sample.js → erp-config.js kopyala, Supabase doldur
  npm install && npm start

BU PAKETTE YOK (bilerek)
  erp-config.js / erp-update.config.js  → şifre
  mobile-app/android|ios|www            → cap sync ile üretilir
  _main_script.js / node_modules / dist
  sunucuya-at* / releases/*.exe

Boyut: ~${mb} MB  (${n} dosya)
`,
  'utf8'
);

console.log(
  JSON.stringify(
    {
      ok: true,
      klasor: 'github-at',
      yol: out,
      mb,
      dosyaSayisi: n,
      webSurukleBirak: n <= 100 ? 'uygun (<=100)' : 'FAZLA — GitHub Desktop kullanin',
      not: 'erp-config.js ve android/ios build kopyalari haric',
    },
    null,
    2
  )
);
