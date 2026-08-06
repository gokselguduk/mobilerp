/**
 * Tek dosya mobil dağıtım: CSS + JS gömülü mobil-erp.standalone.html
 * GitHub / hosting'e yalnızca bu dosyayı (+ erp-config.js) atabilirsiniz.
 * node scripts/bundle-mobil-standalone.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'mobil-erp.html');
const cssPath = path.join(root, 'assets', 'mobil', 'mobil-erp.css');
const jsPath = path.join(root, 'assets', 'mobil', 'mobil-app.js');
const outPath = path.join(root, 'mobil-erp.standalone.html');

let html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8').trim();
const js = fs.readFileSync(jsPath, 'utf8').trim();

html = html.replace(/\s*<link rel="stylesheet" href="assets\/mobil\/mobil-erp\.css">\s*/g, '\n');
html = html.replace(/\s*<link rel="stylesheet" href="skins\/workcube\.css">\s*/g, '\n');
html = html.replace(/<style id="mobil-erp-inline-css">[\s\S]*?<\/style>/, '');
html = html.replace('</head>', `<style id="mobil-erp-inline-css">\n${css}\n</style>\n</head>`);
html = html.replace(/<script src="assets\/mobil\/mobil-app\.js"><\/script>/, `<script>\n${js}\n</script>`);

fs.writeFileSync(outPath, html, 'utf8');
console.log(JSON.stringify({
  ok: true,
  out: 'mobil-erp.standalone.html',
  bytes: html.length
}));
