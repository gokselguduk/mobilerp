/**
 * Arayüz dosyalarını Supabase content/ altına yükler.
 * Normal yayın: GUNCELLEME-YAYINLA.bat (bunu da çağırır)
 * Sadece arayüz testi: npm run publish:content
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
    BUCKET,
    CONTENT_PREFIX,
    readSupabaseUrlFromErpConfig
} = require('./desktop-update-constants');

const root = path.join(__dirname, '..');

const ROOT_FILES = ['stok.html', 'erp-build.js', 'erp-config.js'];
const SYNC_DIRS = ['assets', 'skins'];

function loadPublisherConfig() {
    const cfgPath = path.join(root, 'erp-update.config.js');
    if (!fs.existsSync(cfgPath)) {
        console.error('[hata] erp-update.config.js yok.');
        process.exit(1);
    }
    delete require.cache[require.resolve(cfgPath)];
    return require(cfgPath);
}

function sha256File(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function shouldIncludeContentFile(relPath) {
    const p = String(relPath || '').replace(/\\/g, '/');
    if (p.startsWith('assets/mobil/')) return false;
    if (p.endsWith('.md') || p.endsWith('.sql')) return false;
    return true;
}

function walkDir(absDir, relPrefix, out) {
    if (!fs.existsSync(absDir)) return;
    for (const name of fs.readdirSync(absDir)) {
        const abs = path.join(absDir, name);
        const rel = relPrefix ? `${relPrefix}/${name}` : name;
        const st = fs.statSync(abs);
        if (st.isDirectory()) {
            walkDir(abs, rel.replace(/\\/g, '/'), out);
        } else if (st.isFile() && shouldIncludeContentFile(rel)) {
            out.push({
                path: rel.replace(/\\/g, '/'),
                full: abs,
                size: st.size,
                sha256: sha256File(abs)
            });
        }
    }
}

function collectContentFiles() {
    const files = [];
    for (const name of ROOT_FILES) {
        const full = path.join(root, name);
        if (!fs.existsSync(full)) {
            if (name === 'erp-config.js') {
                console.error('[hata] erp-config.js yok — önce doldurun.');
                process.exit(1);
            }
            continue;
        }
        const st = fs.statSync(full);
        files.push({
            path: name,
            full,
            size: st.size,
            sha256: sha256File(full)
        });
    }
    for (const dir of SYNC_DIRS) {
        walkDir(path.join(root, dir), dir, files);
    }
    return files.sort((a, b) => a.path.localeCompare(b.path));
}

async function fetchRemoteManifest(feedUrl) {
    try {
        const res = await fetch(`${feedUrl.replace(/\/+$/, '')}/manifest.json?ts=${Date.now()}`, {
            headers: { 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
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

function guessContentType(relPath) {
    if (relPath.endsWith('.html')) return 'text/html; charset=utf-8';
    if (relPath.endsWith('.js')) return 'application/javascript; charset=utf-8';
    if (relPath.endsWith('.css')) return 'text/css; charset=utf-8';
    if (relPath.endsWith('.json')) return 'application/json; charset=utf-8';
    if (relPath.endsWith('.png')) return 'image/png';
    if (relPath.endsWith('.jpg') || relPath.endsWith('.jpeg')) return 'image/jpeg';
    if (relPath.endsWith('.svg')) return 'image/svg+xml';
    return 'application/octet-stream';
}

async function main() {
    console.log('[hazirlik] erp-build.js üretiliyor…');
    execSync('node scripts/restore-prod-build.js', { cwd: root, stdio: 'inherit' });

    const cfg = loadPublisherConfig();
    const pkg = require(path.join(root, 'package.json'));
    const version = String(pkg.version || '0.0.0').trim();
    const supabaseUrl = String(cfg.supabaseUrl || readSupabaseUrlFromErpConfig(root)).trim();
    const serviceRoleKey = String(cfg.serviceRoleKey || '').trim();
    if (!supabaseUrl || !serviceRoleKey) {
        console.error('[hata] supabaseUrl / serviceRoleKey eksik (erp-update.config.js)');
        process.exit(1);
    }

    const feedUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${CONTENT_PREFIX}`;
    const files = collectContentFiles();
    const remote = await fetchRemoteManifest(feedUrl);
    const remoteMap = new Map((remote?.files || []).map((f) => [f.path, f.sha256]));

    const toUpload = files.filter((f) => {
        if (!remote || remote.version !== version) return true;
        return remoteMap.get(f.path) !== f.sha256;
    });
    const manifest = {
        version,
        publishedAt: new Date().toISOString(),
        files: files.map(({ path: p, sha256, size }) => ({ path: p, sha256, size }))
    };

    console.log(`[yama] Sürüm ${version} — ${files.length} dosya, ${toUpload.length} değişen/yeni`);
    if (toUpload.length === 0) {
        console.log('[atla] Sunucudaki içerik zaten güncel.');
    }

    const prefix = String(cfg.contentPath || CONTENT_PREFIX).replace(/^\/+|\/+$/g, '');
    for (const f of toUpload) {
        const key = `${prefix}/${f.path}`;
        await uploadObject({
            supabaseUrl,
            serviceRoleKey,
            objectPath: key,
            filePath: f.full,
            contentType: guessContentType(f.path)
        });
        const kb = Math.round(f.size / 1024);
        console.log(`[ok] ${f.path} (${kb} KB)`);
    }

    const manifestPath = path.join(root, 'dist', 'content-manifest.json');
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    await uploadObject({
        supabaseUrl,
        serviceRoleKey,
        objectPath: `${prefix}/manifest.json`,
        filePath: manifestPath,
        contentType: 'application/json; charset=utf-8'
    });
    console.log('[ok] manifest.json');

    console.log('');
    console.log('[tamam] İçerik Supabase\'e yüklendi.');
    console.log('Kontrol:', `${feedUrl}/manifest.json`);
}

main().catch((e) => {
    console.error('[hata]', e.message || e);
    process.exit(1);
});
