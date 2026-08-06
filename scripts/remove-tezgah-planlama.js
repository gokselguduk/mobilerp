/**
 * Tezgah Planlama (TEZGAH_YONETIMI / Gantt) modülünü kaldırır.
 * Kullanım: node scripts/remove-tezgah-planlama.js [stok.html|assets/mobil/mobil-app.js]
 */
const fs = require('fs');
const path = require('path');

const rel = process.argv[2] || 'stok.html';
const file = path.join(__dirname, '..', rel);
let s = fs.readFileSync(file, 'utf8');
const nl = s.includes('\r\n') ? '\r\n' : '\n';

function delBlock(startMarker, endMarker, label) {
    const a = s.indexOf(startMarker);
    const b = s.indexOf(endMarker, a + 1);
    if (a === -1) { console.warn('skip (start not found):', label); return; }
    if (b === -1) { console.warn('skip (end not found):', label); return; }
    s = s.slice(0, a) + s.slice(b);
    console.log('removed:', label);
}

// Nav
s = s.replace(/\s*<div onclick="setAppMode\('TEZGAH_YONETIMI'\)"[^>]*>↳ Tezgah Planlama<\/div>\r?\n/, nl);

// Permissions
s = s.replace(/\s*\['TEZGAH_YONETIMI', 'Gantt planlama'\],\r?\n/, '');
s = s.replace(/\s*\['TEZGAH_GIRIS', 'Tezgah tanımlama'\],\r?\n/, '');
s = s.replace(
    /codes: \['BOYAHANE_URETIM', 'YIKAMA_TAKIP', 'TEZGAH_YONETIMI', 'TEZGAH_GIRIS', 'DOKUMA_TAKIP'\]/,
    "codes: ['BOYAHANE_URETIM', 'YIKAMA_TAKIP', 'DOKUMA_TAKIP']"
);

// Globals
s = s.replace(/\r?\nlet ganttVisible = false;\r?\n/, nl);
s = s.replace(/\r?\nlet ganttFilters = \{[\s\S]*?\};\r?\n\r?\n/, nl);

// sortTezgahNoKeys
s = s.replace(/\r?\nfunction sortTezgahNoKeys\(keys\) \{[\s\S]*?\}\r?\n(?=function suggestNextSiparisNo)/, nl);

// Whitelist / loadData guard
s = s.replace(/'TEZGAH_YONETIMI','TEZGAH_GIRIS',/, '');
s = s.replace(/'TODO_GIRIS', 'TEZGAH_GIRIS', 'NUMUNE_URETIM'/, "'TODO_GIRIS', 'NUMUNE_URETIM'");

// erpRefresh branch
s = s.replace(/\r?\n        if \(mode === 'TEZGAH_YONETIMI'\) \{[\s\S]*?return;\r?\n        \}\r?\n(?=        if \(mode === 'KONFEKSIYON'\))/, nl);

// Dashboard Gantt helper
delBlock('// Dashboard tezgah Gantt', '// --- DASHBOARD ---', 'dashboardTezgahGanttHtml');

// Dashboard data vars
s = s.replace(/\r?\n    const tezgahlar   = dataCache\.tezgahlar   \|\| \[\];\r?\n/, nl);
s = s.replace(/\r?\n    const dolulTezgah  = tezgahlar\.filter[\s\S]*?\r?\n    const musaitTezgah = tezgahlar\.filter[\s\S]*?\r?\n/, nl);

// Dashboard UI
s = s.replace(
    /\{mode:'TEZGAH_YONETIMI',icon:'🖥️',label:'Tezgah'\},/,
    "{mode:'DOKUMA_TAKIP',icon:'🧵',label:'Dokuma'},"
);
s = s.replace(/\{mode:'DOKUMA_TAKIP',icon:'🧵',label:'Dokuma', go:'openDtDokumaHat'\},/, "{mode:'DOKUMA_TAKIP',icon:'🧵',label:'Dokuma'},");
s = s.replace(/Sipariş · sevk · görev · tezgah/, 'Sipariş · sevk · görev · dokuma');
s = s.replace(
    /<button onclick="setAppMode\('TEZGAH_YONETIMI'\)" class="btn-pro btn-ghost-pro" style="padding:5px 10px;font-size:9px">Tezgah<\/button>\r?\n                    <button onclick="setAppMode\('DOKUMA_TAKIP'\)" class="btn-pro btn-ghost-pro" style="padding:5px 10px;font-size:9px">Dokuma<\/button>/,
    '<button onclick="setAppMode(\'DOKUMA_TAKIP\')" class="btn-pro btn-ghost-pro" style="padding:5px 10px;font-size:9px">Dokuma</button>'
);
s = s.replace(
    /<button onclick="openDtDokumaHat\(\)" class="btn-pro btn-ghost-pro" style="padding:5px 10px;font-size:9px">Dokuma<\/button>/,
    '<button onclick="setAppMode(\'DOKUMA_TAKIP\')" class="btn-pro btn-ghost-pro" style="padding:5px 10px;font-size:9px">Dokuma</button>'
);
s = s.replace(
    /\{l:'Müsait tezgah', v:musaitTezgah, c:'var\(--emerald-c\)', m:'TEZGAH_YONETIMI'\},/,
    "{l:'Bugün tamamlanan', v:tamamlananGorevBugun, c:'var(--emerald-c)', m:'TODO_LISTE'},"
);
s = s.replace(
    /\r?\n        <!-- TEZGAH — GANTT -->[\s\S]*?\r?\n        <!-- 7 GÜN GRAFİKLER -->/,
    `${nl}        <!-- 7 GÜN GRAFİKLER -->`
);

// Planlama quick link
s = s.replace(/\s*\$\{planlamaKomutaHizliLinkHtml\("setAppMode\('TEZGAH_YONETIMI'\)"[^}]+\}\)\}\r?\n/, '');
s = s.replace(
    /\$\{planlamaKomutaHizliLinkHtml\("setAppMode\('DOKUMA_TAKIP'\)"[^}]+\}\)\}/,
    '${planlamaKomutaHizliLinkHtml("setAppMode(\'DOKUMA_TAKIP\')", \'🧶\', \'Dokuma takip\', \'Dokuma hattı ve üretim\', \'rgba(251,191,36,.5)\')}'
);
s = s.replace(
    /\$\{planlamaKomutaHizliLinkHtml\("openDtDokumaHat\(\)"[^}]+\}\)\}/,
    '${planlamaKomutaHizliLinkHtml("setAppMode(\'DOKUMA_TAKIP\')", \'🧶\', \'Dokuma takip\', \'Dokuma hattı ve üretim\', \'rgba(251,191,36,.5)\')}'
);

// Dokuma tezgah ayar panel button
s = s.replace(
    /<button type="button" onclick="setAppMode\('TEZGAH_YONETIMI'\)" class="btn-pro btn-ghost-pro" style="padding:4px 10px;font-size:9px">🏭 Tezgah planlama<\/button>/,
    ''
);

// setAppMode redirect (insert if missing)
if (!s.includes("mode === 'TEZGAH_YONETIMI' || mode === 'TEZGAH_GIRIS'")) {
    s = s.replace(
        /async function setAppMode\(mode, keepEditingId = false\) \{\r?\n/,
        "async function setAppMode(mode, keepEditingId = false) {\n    if (mode === 'TEZGAH_YONETIMI' || mode === 'TEZGAH_GIRIS') mode = 'DOKUMA_TAKIP';\n"
    );
}

// Titles / static modes
s = s.replace(/\r?\n        'TEZGAH_YONETIMI': 'Dokuma Planlama',\r?\n        'TEZGAH_GIRIS': 'Tezgah Tanımlama',/, '');
s = s.replace(/'SIPARIS_GIRIS', 'TEZGAH_GIRIS', 'TODO_GIRIS'/, "'SIPARIS_GIRIS', 'TODO_GIRIS'");
s = s.replace(
    /\r?\n    if \(mode === 'TEZGAH_YONETIMI'\) \{[\s\S]*?return;\r?\n    \}\r?\n\r?\n    if \(mode === 'DOKUMA_TAKIP'\)/,
    `${nl}    if (mode === 'DOKUMA_TAKIP')`
);
s = s.replace(/\r?\n            TEZGAH_GIRIS: 'Tezgah Tanımlama',/, '');

// JAKAR helpers
const jakarStart = s.indexOf('// --- JAKAR ALANI ---');
const jakarEnd = s.indexOf(`${nl}// ============================================================${nl}// renderInputs`, jakarStart);
if (jakarStart > -1 && jakarEnd > -1) {
    s = s.slice(0, jakarStart) + s.slice(jakarEnd);
    console.log('removed: tezgah form helpers');
}

delBlock('    // --- TEZGAH GİRİŞİ ---', '    // --- NUMUNE ÜRETİM ---', 'TEZGAH_GIRIS form');
delBlock('// --- TEZGAH YÖNETİMİ / GANTT ---', '// --- SİPARİŞ / DASHBOARD ---', 'Gantt module');

// Save / edit / delete
s = s.replace(/\r?\n    else if \(appMode === 'TEZGAH_GIRIS'\) table = 'tezgahlar';/, '');
s = s.replace(
    /const eskiGecmis = \(appMode === 'TEZGAH_GIRIS'\)\s*\? \(originalRecordSnapshot\?\.notlar \|\| ""\)\s*: \(originalRecordSnapshot\?\.islem_gecmisi \|\| ""\);/,
    'const eskiGecmis = (originalRecordSnapshot?.islem_gecmisi || "");'
);
s = s.replace(/\r?\n        \} else if \(appMode === 'TEZGAH_GIRIS'\) \{[\s\S]*?\r?\n        \} else if \(appMode === 'TODO_GIRIS'\)/, `${nl}        } else if (appMode === 'TODO_GIRIS')`);
s = s.replace(/\r?\n            let returnMode = appMode === 'TEZGAH_GIRIS' \? 'TEZGAH_YONETIMI' : appMode;/, `${nl}            let returnMode = appMode;`);
s = s.replace(/\r?\n    \} else if \(appMode === 'TEZGAH_GIRIS'\) \{[\s\S]*?\r?\n    \} else if \(appMode === 'KART_IPLIK'\)/, `${nl}    } else if (appMode === 'KART_IPLIK')`);
s = s.replace(/\r?\n    else if \(appMode\.includes\('TEZGAH'\)\) table = 'tezgahlar';/, '');
s = s.replace(/if \(appMode === 'DASHBOARD' \|\| appMode === 'TEZGAH_YONETIMI'\) return;/, "if (appMode === 'DASHBOARD') return;");
s = s.replace(/setAppMode\(appMode === 'TEZGAH_GIRIS' \? 'TEZGAH_YONETIMI' : appMode\)/, 'setAppMode(appMode)');

// handleGlobalSearch
s = s.replace(
    /function handleGlobalSearch\(val\) \{\s*const searchVal = val\.toLowerCase\(\)\.trim\(\);\s*debounce\('globalSearch', \(\) => \{\s*if \(appMode === 'TEZGAH_YONETIMI'\) \{[\s\S]*?\} else \{\s*loadData\(\);\s*\}\s*\}, 250\);\s*\}/,
    "function handleGlobalSearch(val) {\n    debounce('globalSearch', () => loadData(), 250);\n}"
);

// Mobil lite stub
s = s.replace(/w\.dashboardTezgahGanttHtml = function \(\) \{ return ''; \};\r?\n?/, '');

fs.writeFileSync(file, s);
const left = [...new Set((s.match(/TEZGAH_YONETIMI|renderTezgahYonetimi|ganttFilters|ganttVisible|dashboardTezgahGanttHtml|toggleJakarFields/g) || []))];
console.log('Written', rel, 'remaining:', left);
