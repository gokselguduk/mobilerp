/**
 * Not: Mobil JS artık tek dosyada (assets/mobil/mobil-app.js).
 * Bu script yalnızca eski dağınık parçalar (mobil-lite / zoom-lock / overrides)
 * yeniden oluşursa tekrar birleştirmek içindir.
 *
 * Parçalar yoksa ve mobil-app.js zaten birleşikse dokunmaz.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'assets', 'mobil');
const appPath = path.join(dir, 'mobil-app.js');

function readIf(name) {
  const p = path.join(dir, name);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8').trim() : null;
}

const lite = readIf('mobil-lite.js');
const zoom = readIf('mobil-zoom-lock.js');
const overrides = readIf('mobil-overrides.js');
const raw = fs.readFileSync(appPath, 'utf8');

const already =
  raw.includes('ERP_MOBIL_LITE = true') &&
  raw.includes('erpMobileZoomLock') &&
  raw.includes('[mobil-lite] Dashboard / canlı senkron');

if (!lite && !zoom && !overrides) {
  if (already) {
    try {
      // eslint-disable-next-line no-new-func
      new Function(raw);
      console.log(JSON.stringify({ ok: true, alreadyMerged: true, bytes: raw.length }));
      process.exit(0);
    } catch (e) {
      console.error('mobil-app.js parse error:', e.message);
      process.exit(1);
    }
  }
  console.error('Parça dosyalar yok ve mobil-app.js birleşik görünmüyor.');
  process.exit(1);
}

function extractCore(src) {
  const startKey = '/* --- ana uygulama --- */';
  const endKey = '/* --- mobil overrides';
  const si = src.indexOf(startKey);
  const ei = src.indexOf(endKey);
  if (si >= 0 && ei > si) {
    return src.slice(si + startKey.length, ei).replace(/^\uFEFF/, '').trim();
  }
  if (!src.includes('ERP_MOBIL_LITE = true')) {
    return src.replace(/^\uFEFF/, '').trim();
  }
  throw new Error('core extract failed — markers missing');
}

const core = extractCore(raw);
const liteSrc = lite || raw.slice(
  raw.indexOf('(function (w)') ,
  raw.indexOf('})(window);', raw.indexOf('ERP_MOBIL_LITE = true')) + '})(window);'.length
);
// Prefer disk copies when present
const zoomSrc = zoom || (() => {
  const i = raw.indexOf('erpMobileZoomLock');
  if (i < 0) throw new Error('zoom missing');
  const start = raw.lastIndexOf('try {', i);
  const end = raw.indexOf('})();', i) + 5;
  return raw.slice(start >= 0 ? start : i, end).trim();
})();
const overSrc = overrides || (() => {
  const i = raw.lastIndexOf('if (!w.ERP_MOBIL_LITE) return;');
  const start = raw.lastIndexOf('(function (w)', i);
  return raw.slice(start).trim();
})();

const merged = [
  '/* ==========================================================================',
  ' * Simteks Mobil ERP — tek JS dosyası',
  ' * İçerik: lite bayrak/stub + zoom kilidi + uygulama + mobil overrides',
  ' * Masaüstü (stok.html) bu dosyayı kullanmaz.',
  ' * ========================================================================== */',
  '',
  '/* --- mobil lite (bayraklar + Chart/Excel stub) --- */',
  liteSrc.trim(),
  '',
  '/* --- mobil zoom kilidi --- */',
  zoomSrc.trim(),
  '',
  '/* --- ana uygulama --- */',
  core,
  '',
  '/* --- mobil overrides (dashboard / canlı / excel kapalı) --- */',
  overSrc.trim(),
  ''
].join('\n');

fs.writeFileSync(appPath, merged, 'utf8');
try {
  // eslint-disable-next-line no-new-func
  new Function(merged);
} catch (e) {
  console.error('syntax error:', e.message);
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, bytes: merged.length, coreBytes: core.length }));
