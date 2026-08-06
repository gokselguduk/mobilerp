/**
 * mobil-erp.html → parçalı dosyalar
 * - assets/mobil/mobil-erp.css
 * - assets/mobil/mobil-app.js  (ana inline script)
 * HTML kabuğu inceltilir; script sırası korunur.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'mobil-erp.html');
const outDir = path.join(root, 'assets', 'mobil');

let html = fs.readFileSync(htmlPath, 'utf8');
const before = html.length;

// 1) CSS çıkar
const styleRe = /<style>([\s\S]*?)<\/style>/;
const styleMatch = html.match(styleRe);
if (!styleMatch) {
  console.error('style bloğu bulunamadı');
  process.exit(1);
}
const cssBody = styleMatch[1].replace(/^\s*\n/, '');
fs.writeFileSync(path.join(outDir, 'mobil-erp.css'), cssBody, 'utf8');
html = html.replace(styleRe, '    <link rel="stylesheet" href="assets/mobil/mobil-erp.css">\n');

// 2) Ana inline script: son </script> öncesi büyük blok (mobil-overrides'dan önce)
// Pattern: zoom-lock script küçük; sonra HTML; sonra büyük app script; sonra overrides src
const scripts = [];
const scriptRe = /<script(\b[^>]*)>([\s\S]*?)<\/script>/g;
let m;
while ((m = scriptRe.exec(html)) !== null) {
  scripts.push({
    full: m[0],
    attrs: m[1] || '',
    body: m[2] || '',
    index: m.index,
    end: m.index + m[0].length,
    hasSrc: /\bsrc\s*=/.test(m[1] || '')
  });
}

const inlineScripts = scripts.filter(s => !s.hasSrc && s.body.trim().length > 500);
if (!inlineScripts.length) {
  console.error('büyük inline script bulunamadı');
  process.exit(1);
}

// En büyük inline script = app
inlineScripts.sort((a, b) => b.body.length - a.body.length);
const app = inlineScripts[0];
const appJs = app.body.replace(/^\uFEFF/, '');
fs.writeFileSync(path.join(outDir, 'mobil-app.js'), appJs, 'utf8');

// HTML'de bu bloğu src ile değiştir (overrides'tan ÖNCE olmalı — zaten oradaydı)
html = html.slice(0, app.index) +
  '<script src="assets/mobil/mobil-app.js"></script>' +
  html.slice(app.end);

// Küçük zoom-lock varsa ayrı dosya YAPMA — mobil-app.js içine göm (dağınık dosya istemiyoruz)
const smallInlines = scripts.filter(s => !s.hasSrc && s.body.trim().length > 50 && s.body.length < 5000 && s !== app);
for (const sm of smallInlines) {
  const needle = sm.full;
  const pos = html.indexOf(needle);
  if (pos < 0) continue;
  if (sm.body.includes('erpMobileZoomLock')) {
    const appFile = path.join(outDir, 'mobil-app.js');
    let appNow = fs.readFileSync(appFile, 'utf8');
    if (!appNow.includes('erpMobileZoomLock')) {
      appNow = '/* --- mobil zoom kilidi --- */\n' + sm.body.trim() + '\n\n' + appNow;
      fs.writeFileSync(appFile, appNow, 'utf8');
    }
    html = html.slice(0, pos) + html.slice(pos + needle.length);
  }
}

fs.writeFileSync(htmlPath, html, 'utf8');

const after = html.length;
console.log(JSON.stringify({
  beforeBytes: before,
  afterBytes: after,
  savedBytes: before - after,
  cssBytes: cssBody.length,
  appJsBytes: appJs.length,
  files: fs.readdirSync(outDir)
}, null, 2));
