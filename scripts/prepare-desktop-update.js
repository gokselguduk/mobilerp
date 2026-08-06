/**
 * dist/ kurulum dosyası + latest.yml → sunucuya-at/... yerel yedek kopyası.
 * Asıl yayın: GUNCELLEME-YAYINLA.bat (npm run publish)
 */
const fs = require('fs');
const path = require('path');
const { readSupabaseUrlFromErpConfig, getSupabaseUpdateFeedUrl } = require('./desktop-update-constants');

const root = path.join(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));
const dist = path.join(root, 'dist');
const version = String(pkg.version || '0.0.0').trim();
const exeName = `Simteks-Tekstil-ERP-Setup-${version}.exe`;
const exeSrc = path.join(dist, exeName);
const ymlSrc = path.join(dist, 'latest.yml');
const outDir = path.join(root, 'sunucuya-at', 'updates', 'tekstil-erp', 'win');
const feedUrl = getSupabaseUpdateFeedUrl(readSupabaseUrlFromErpConfig(root));

if (!fs.existsSync(exeSrc)) {
    console.error('[hata] Kurulum dosyası yok:', exeSrc);
    console.error('Önce: npm run build:win');
    process.exit(1);
}
if (!fs.existsSync(ymlSrc)) {
    console.error('[hata] latest.yml yok:', ymlSrc);
    console.error('electron-builder latest.yml üretemedi — build:win tekrar çalıştırın.');
    process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(exeSrc, path.join(outDir, exeName));
fs.copyFileSync(ymlSrc, path.join(outDir, 'latest.yml'));

const blockmap = path.join(dist, `${exeName}.blockmap`);
if (fs.existsSync(blockmap)) {
    fs.copyFileSync(blockmap, path.join(outDir, `${exeName}.blockmap`));
}

const readme = `Simteks Tekstil ERP — yerel yedek paket v${version}
============================================================

Asıl yayın komutu: GUNCELLEME-YAYINLA.bat  (veya npm run publish)

Kontrol URL: ${feedUrl || '(erp-config.js supabase url)'}/latest.yml

Dosyalar:
  - latest.yml
  - ${exeName}
  - ${exeName}.blockmap (varsa)
`;

fs.writeFileSync(path.join(outDir, 'YUKLE-OKU.txt'), readme, 'utf8');

console.log('[tamam] Yerel yedek paket:', outDir);
console.log('Yayın: GUNCELLEME-YAYINLA.bat');
if (feedUrl) console.log('Kontrol URL:', `${feedUrl}/latest.yml`);
