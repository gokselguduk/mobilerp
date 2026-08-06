/**
 * Son N dakikadaki depo hareketlerini listeler (silmeden önce önizleme).
 * Kullanım: node scripts/preview-recent-movements.js [dakika]
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const minutes = Math.max(1, parseInt(process.argv[2] || '30', 10));

function loadKey() {
    const cfgPath = path.join(root, 'erp-update.config.js');
    if (fs.existsSync(cfgPath)) {
        delete require.cache[require.resolve(cfgPath)];
        const c = require(cfgPath);
        if (c.serviceRoleKey && !String(c.serviceRoleKey).includes('YOUR_')) {
            return { url: c.supabaseUrl, key: c.serviceRoleKey };
        }
    }
    const erpPath = path.join(root, 'erp-config.js');
    const txt = fs.readFileSync(erpPath, 'utf8');
    const urlM = txt.match(/url:\s*['"](https:\/\/[^'"]+\.supabase\.co)['"]/);
    const keyM = txt.match(/anonKey:\s*['"]([^'"]+)['"]/);
    return { url: urlM?.[1], key: keyM?.[1] };
}

async function fetchRows(table, sinceIso) {
    const { url, key } = loadKey();
    const q = `${url}/rest/v1/${table}?select=id,created_at,updated_at,stok_kodu,islem_turu,kaynak_birim,miktar_kg,miktar_mt,cuval_sayisi,notlar&or=(created_at.gte.${sinceIso},updated_at.gte.${sinceIso})&order=created_at.desc`;
    const res = await fetch(q, {
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            Accept: 'application/json'
        }
    });
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
    return res.json();
}

function isMovementRow(r, table) {
    const kb = String(r.kaynak_birim || '');
    if (table === 'iplik_stok') {
        if (kb === 'IPLIK_KART_GIRIS') return false;
        if (String(r.stok_kodu || '').startsWith('IP-') && Math.abs(Number(r.miktar_kg) || 0) < 0.0001) return false;
    }
    const depoChannels = [
        'DEPO_HAREKET_IPLIK', 'DEPO_HAREKET_KUMAS', 'DEPO_HAREKET_HAM_KUMAS',
        'DEPO_HAREKET_MAMUL_KUMAS', 'DEPO_HAREKET_MAMUL_DEPO',
        'DOKUMA_TAKIP', 'DOKUMA_DEPO_SEVK', 'STOK_EXCEL_IMPORT'
    ];
    if (depoChannels.some((c) => kb === c || kb.startsWith('DEPO_HAREKET'))) return true;
    const it = String(r.islem_turu || '').toUpperCase();
    if (it === 'GİRİŞ' || it === 'GIRIS' || it === 'ÇIKIŞ' || it === 'CIKIS') return true;
    return false;
}

(async () => {
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    console.log(`Son ${minutes} dk (since ${since})\n`);
    for (const table of ['iplik_stok', 'kumas_stok']) {
        const rows = await fetchRows(table, since);
        const moves = rows.filter((r) => isMovementRow(r, table));
        console.log(`=== ${table}: ${moves.length} hareket (${rows.length} toplam satır) ===`);
        moves.forEach((r) => {
            console.log([
                r.id,
                r.created_at?.slice(0, 19),
                r.islem_turu,
                r.kaynak_birim,
                r.stok_kodu,
                `kg:${r.miktar_kg}`,
                `mt:${r.miktar_mt}`,
                `ad:${r.cuval_sayisi}`
            ].join(' | '));
        });
        console.log('');
    }
})().catch((e) => {
    console.error('[hata]', e.message || e);
    process.exit(1);
});
