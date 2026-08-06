/**
 * mobil-erp.css → mobil-erp.html içine gömer.
 * Sunucuda assets/ klasörü yoksa bile mobil arayüz stilli açılır.
 * CSS düzenledikten sonra: node scripts/inline-mobil-css.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'mobil-erp.html');
const cssPath = path.join(root, 'assets', 'mobil', 'mobil-erp.css');

let html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8').trim();

const styleBlock = `<style id="mobil-erp-inline-css">\n${css}\n</style>`;

// Eski harici linkleri kaldır
html = html.replace(/\s*<link rel="stylesheet" href="assets\/mobil\/mobil-erp\.css">\s*/g, '\n');
html = html.replace(/\s*<link rel="stylesheet" href="skins\/workcube\.css">\s*/g, '\n');

// Önceki inline bloğu güncelle veya head'e ekle
if (html.includes('id="mobil-erp-inline-css"')) {
  html = html.replace(/<style id="mobil-erp-inline-css">[\s\S]*?<\/style>/, styleBlock);
} else {
  html = html.replace('</head>', `    ${styleBlock}\n</head>`);
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log(JSON.stringify({
  ok: true,
  htmlBytes: html.length,
  cssBytes: css.length
}));
