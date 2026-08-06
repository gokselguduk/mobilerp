/**
 * dist/ içindeki güncelleme dosyalarını Supabase Storage'a yükler.
 * Gerekli: erp-update.config.js (örnek: erp-update.config.sample.js)
 */
const fs = require('fs');
const path = require('path');
const { BUCKET, STORAGE_PREFIX, readSupabaseUrlFromErpConfig } = require('./desktop-update-constants');

const root = path.join(__dirname, '..');

function loadPublisherConfig() {
    const cfgPath = path.join(root, 'erp-update.config.js');
    if (!fs.existsSync(cfgPath)) {
        console.error('[hata] erp-update.config.js yok.');
        console.error('Kopyalayın: erp-update.config.sample.js → erp-update.config.js');
        console.error('serviceRoleKey: Supabase Dashboard → Settings → API → service_role');
        process.exit(1);
    }
    delete require.cache[require.resolve(cfgPath)];
    return require(cfgPath);
}

async function uploadObject({ supabaseUrl, serviceRoleKey, objectPath, filePath, contentType }) {
    const url = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/${BUCKET}/${objectPath}`;
    const body = fs.readFileSync(filePath);
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            'Content-Type': contentType,
            'x-upsert': 'true',
            'Cache-Control': 'no-cache'
        },
        body
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Yükleme hatası (${objectPath}): ${res.status} ${txt}`);
    }
}

async function main() {
    const cfg = loadPublisherConfig();
    const pkg = require(path.join(root, 'package.json'));
    const version = String(pkg.version || '0.0.0').trim();
    const exeName = `Simteks-Tekstil-ERP-Setup-${version}.exe`;
    const dist = path.join(root, 'dist');
    const exeSrc = path.join(dist, exeName);
    const ymlSrc = path.join(dist, 'latest.yml');
    const blockmapSrc = path.join(dist, `${exeName}.blockmap`);

    const supabaseUrl = String(cfg.supabaseUrl || readSupabaseUrlFromErpConfig(root)).trim();
    const serviceRoleKey = String(cfg.serviceRoleKey || '').trim();
    if (!supabaseUrl) {
        console.error('[hata] supabaseUrl bulunamadı (erp-update.config.js veya erp-config.js)');
        process.exit(1);
    }
    if (!serviceRoleKey || serviceRoleKey.includes('YOUR_SERVICE_ROLE')) {
        console.error('[hata] serviceRoleKey doldurulmamış (erp-update.config.js)');
        process.exit(1);
    }
    if (!fs.existsSync(exeSrc)) {
        console.error('[hata] Kurulum dosyası yok:', exeSrc);
        console.error('Önce: npm run build:win');
        process.exit(1);
    }
    if (!fs.existsSync(ymlSrc)) {
        console.error('[hata] latest.yml yok:', ymlSrc);
        process.exit(1);
    }

    const prefix = String(cfg.storagePath || STORAGE_PREFIX).replace(/^\/+|\/+$/g, '');
    const exeKey = `${prefix}/${exeName}`;
    const ymlKey = `${prefix}/latest.yml`;
    const blockmapKey = `${prefix}/${exeName}.blockmap`;

    console.log('[yukle] Supabase Storage:', BUCKET, '→', prefix + '/');
    await uploadObject({
        supabaseUrl,
        serviceRoleKey,
        objectPath: exeKey,
        filePath: exeSrc,
        contentType: 'application/octet-stream'
    });
    console.log('[ok]', exeName);

    if (fs.existsSync(blockmapSrc)) {
        await uploadObject({
            supabaseUrl,
            serviceRoleKey,
            objectPath: blockmapKey,
            filePath: blockmapSrc,
            contentType: 'application/octet-stream'
        });
        console.log('[ok]', `${exeName}.blockmap`);
    }

    await uploadObject({
        supabaseUrl,
        serviceRoleKey,
        objectPath: ymlKey,
        filePath: ymlSrc,
        contentType: 'text/yaml'
    });
    console.log('[ok] latest.yml (son — böylece yarım paket görünmez)');

    const feedUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${prefix}`;
    console.log('');
    console.log('[tamam] Güncelleme yayında.');
    console.log('Kontrol:', `${feedUrl}/latest.yml`);
}

main().catch((e) => {
    console.error('[hata]', e.message || e);
    process.exit(1);
});
