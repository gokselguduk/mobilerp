/**
 * Tekstil ERP — masaüstü kabuğu (Electron).
 *
 * Giriş: Kurulum sonrası yalnızca bu uygulama ile açılır (tarayıcı adres çubuğu yok).
 *
 * İki mod:
 * - electron/url.config.json içinde "loadUrl" boş → paket içindeki stok.html (yerel dosya).
 * - "loadUrl": "https://..." → aynı arayüz canlı siteden yüklenir; HTML güncellemesi için
 *   yalnızca web dağıtımını yenilemeniz yeterli, .exe’yi yeniden üretmek zorunda değilsiniz.
 *
 * İnternet: Supabase ve CDN scriptleri zaten bağlantı kullanır.
 */
const { app, BrowserWindow, ipcMain, protocol, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');

let mainWindowRef = null;
let autoUpdater = null;
let _fallbackUpdateExePath = null;
let _fallbackUpdateVersion = null;
let _fallbackDownloadInProgress = false;
try {
    ({ autoUpdater } = require('electron-updater'));
} catch {
    autoUpdater = null;
}

protocol.registerSchemesAsPrivileged([
    {
        scheme: 'erp-local',
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true,
            corsEnabled: true,
            stream: true
        }
    }
]);

// Windows'ta bazı makinelerde paketli uygulamada ICU fd hatası görülebiliyor.
// Sandbox kapatılarak child process başlatma hatası engellenir.
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
// Supabase/indirme: bazı ağlarda QUIC (HTTP/3) güncelleme indirmesini keser
app.commandLine.appendSwitch('disable-quic');
app.commandLine.appendSwitch('disable-http3');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.quit();
    process.exit(0);
}

function readChannelConfig() {
    const p = path.join(__dirname, 'channel.json');
    try {
        const j = JSON.parse(fs.readFileSync(p, 'utf8'));
        return (j && typeof j === 'object') ? j : {};
    } catch {
        return { channel: 'production', productTitle: 'Simteks Tekstil ERP', version: '1.0.0' };
    }
}

function readLoadUrl() {
    const runtime = readRuntimeOverrides();
    const runtimeUrl = String(runtime.loadUrl || '').trim();
    if (runtimeUrl) {
        try {
            const parsed = new URL(runtimeUrl);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return runtimeUrl;
        } catch {}
    }
    const p = path.join(__dirname, 'url.config.json');
    try {
        const raw = fs.readFileSync(p, 'utf8');
        const j = JSON.parse(raw);
        const u = String(j.loadUrl || '').trim();
        if (!u) return '';
        const parsed = new URL(u);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
        return u;
    } catch {
        return '';
    }
}

function getContentDir() {
    return path.join(app.getPath('userData'), 'content');
}

function getContentFeedBaseUrl() {
    const cfg = readUpdateConfig();
    const explicit = String(cfg.contentUrl || '').trim();
    if (explicit) return explicit.replace(/\/+$/, '');
    const winUrl = getUpdateFeedBaseUrl();
    if (winUrl.endsWith('/win')) return `${winUrl.slice(0, -4)}/content`;
    return winUrl ? `${winUrl.replace(/\/+$/, '')}/../content`.replace(/\/\.\./, '') : '';
}

function resolveStokHtml() {
    const patched = path.join(getContentDir(), 'stok.html');
    const manifestPath = path.join(getContentDir(), 'manifest.json');
    if (fs.existsSync(patched) && fs.existsSync(manifestPath)) return patched;
    return path.join(__dirname, '..', 'stok.html');
}

function resolvePreload() {
    return path.join(__dirname, 'preload.js');
}

function resolveAssetPath(fileName) {
    const safe = path.basename(String(fileName || ''));
    if (!safe || safe !== fileName) return null;
    const rel = path.join('assets', safe);
    const contentAssets = path.join(getContentDir(), 'assets');
    const bases = [
        fs.existsSync(contentAssets) ? contentAssets : '',
        process.resourcesPath ? path.join(process.resourcesPath, 'assets') : '',
        path.join(__dirname, '..', 'assets'),
        path.join(app.getAppPath(), 'assets'),
        path.join(path.dirname(process.execPath), 'assets'),
        path.join(__dirname, '..')
    ];
    const tryPaths = [];
    for (const base of bases) {
        if (!base) continue;
        if (base.endsWith('assets') || base.endsWith('assets' + path.sep)) {
            tryPaths.push(path.join(base, safe));
        } else {
            tryPaths.push(path.join(base, rel));
        }
    }
    const seen = new Set();
    for (const full of tryPaths) {
        if (!full || seen.has(full)) continue;
        seen.add(full);
        try {
            if (fs.existsSync(full)) return full;
        } catch (e) {}
    }
    return tryPaths[0] || path.join(__dirname, '..', rel);
}

function getRuntimeConfigPath() {
    try {
        return path.join(app.getPath('userData'), 'runtime.config.json');
    } catch {
        return '';
    }
}

function readRuntimeOverrides() {
    const p = getRuntimeConfigPath();
    if (!p) return {};
    try {
        if (!fs.existsSync(p)) return {};
        const raw = fs.readFileSync(p, 'utf8');
        const j = JSON.parse(raw);
        return (j && typeof j === 'object') ? j : {};
    } catch {
        return {};
    }
}

function readUpdateConfig() {
    const p = path.join(__dirname, 'update.config.json');
    try {
        const j = JSON.parse(fs.readFileSync(p, 'utf8'));
        return (j && typeof j === 'object') ? j : {};
    } catch {
        return {};
    }
}

function sha256Buffer(buf) {
    return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha256File(filePath) {
    return sha256Buffer(fs.readFileSync(filePath));
}

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function readLocalContentManifest() {
    try {
        const p = path.join(getContentDir(), 'manifest.json');
        if (!fs.existsSync(p)) return null;
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
        return null;
    }
}

function contentFileUrl(base, relPath) {
    const encoded = String(relPath || '').split('/').map((p) => encodeURIComponent(p)).join('/');
    return `${base.replace(/\/+$/, '')}/${encoded}`;
}

async function fetchRemoteContentManifest() {
    const base = getContentFeedBaseUrl();
    if (!base) return null;
    const buf = await httpRequestBuffer(`${base}/manifest.json?ts=${Date.now()}`);
    return JSON.parse(buf.toString('utf8'));
}

async function getContentUpdateInfo() {
    const local = readLocalContentManifest();
    let remote = null;
    try {
        remote = await fetchRemoteContentManifest();
    } catch (e) {
        return { ok: false, message: String(e?.message || e), localVersion: local?.version || null };
    }
    if (!remote || !Array.isArray(remote.files)) {
        return { ok: false, message: 'manifest.json okunamadı', localVersion: local?.version || null };
    }
    const localMap = new Map((local?.files || []).map((f) => [f.path, f.sha256]));
    const pending = remote.files.filter((f) => localMap.get(f.path) !== f.sha256);
    return {
        ok: true,
        localVersion: local?.version || null,
        remoteVersion: remote.version || null,
        updateAvailable: pending.length > 0,
        pendingCount: pending.length,
        usingPatch: fs.existsSync(path.join(getContentDir(), 'stok.html'))
    };
}

async function syncContentUpdates() {
    if (!app.isPackaged) return { ok: false, updated: false, reason: 'not-packaged' };
    if (readLoadUrl()) return { ok: false, updated: false, reason: 'remote-url-mode' };
    const base = getContentFeedBaseUrl();
    if (!base) return { ok: false, updated: false, reason: 'no-content-feed' };
    try {
        sendUpdateStatus({ phase: 'checking', kind: 'content' });
        const remote = await fetchRemoteContentManifest();
        if (!remote || !Array.isArray(remote.files)) {
            return { ok: false, updated: false, error: 'manifest geçersiz' };
        }

        const local = readLocalContentManifest();
        const localMap = new Map((local?.files || []).map((f) => [f.path, f.sha256]));
        const needs = remote.files.filter((f) => localMap.get(f.path) !== f.sha256);
        if (needs.length === 0) {
            sendUpdateStatus({ phase: 'content-none', version: remote.version, localVersion: local?.version || null });
            return {
                ok: true,
                updated: false,
                version: remote.version,
                localVersion: local?.version || remote.version,
                remoteVersion: remote.version
            };
        }

        const contentDir = getContentDir();
        ensureDir(contentDir);
        let done = 0;
        for (const f of needs) {
            done += 1;
            sendUpdateStatus({
                phase: 'downloading',
                percent: Math.round((done / needs.length) * 100),
                version: remote.version,
                file: f.path,
                kind: 'content'
            });
            const dest = path.join(contentDir, f.path.replace(/\//g, path.sep));
            ensureDir(path.dirname(dest));
            const tmp = `${dest}.download`;
            await httpDownloadFile(`${contentFileUrl(base, f.path)}?ts=${Date.now()}`, tmp, null);
            const hash = sha256File(tmp);
            if (hash !== f.sha256) {
                try { fs.unlinkSync(tmp); } catch {}
                throw new Error(`Dosya doğrulama hatası: ${f.path}`);
            }
            try { if (fs.existsSync(dest)) fs.unlinkSync(dest); } catch {}
            fs.renameSync(tmp, dest);
        }

        fs.writeFileSync(path.join(contentDir, 'manifest.json'), JSON.stringify(remote, null, 2), 'utf8');
        sendUpdateStatus({ phase: 'ready', version: remote.version, count: needs.length, kind: 'content' });
        return {
            ok: true,
            updated: true,
            version: remote.version,
            localVersion: remote.version,
            remoteVersion: remote.version,
            count: needs.length
        };
    } catch (e) {
        const msg = String(e?.message || e);
        sendUpdateStatus({ phase: 'error', message: msg, kind: 'content' });
        return { ok: false, updated: false, error: msg };
    }
}

function sendUpdateStatus(payload) {
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
        mainWindowRef.webContents.send('erp-update-status', payload || {});
    }
}

function isNetworkQuicError(err) {
    const s = String(err?.message || err);
    return /ERR_QUIC|QUIC_PROTOCOL|Failed to fetch|net::ERR/i.test(s);
}

function getUpdateFeedBaseUrl() {
    const cfg = readUpdateConfig();
    return String(cfg.url || '').trim().replace(/\/+$/, '');
}

function compareVersions(a, b) {
    const pa = String(a || '0').split('.').map((n) => parseInt(n, 10) || 0);
    const pb = String(b || '0').split('.').map((n) => parseInt(n, 10) || 0);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        const da = pa[i] || 0;
        const db = pb[i] || 0;
        if (da > db) return 1;
        if (da < db) return -1;
    }
    return 0;
}

function parseLatestYml(text) {
    const body = String(text || '');
    const versionMatch = body.match(/^version:\s*([^\s#]+)/m);
    const pathMatch = body.match(/^path:\s*([^\s#]+)/m);
    const version = versionMatch ? versionMatch[1].trim() : '';
    const fileName = pathMatch ? pathMatch[1].trim() : '';
    return { version, fileName };
}

function httpRequestBuffer(urlStr, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        let parsed;
        try {
            parsed = new URL(urlStr);
        } catch (e) {
            reject(e);
            return;
        }
        const lib = parsed.protocol === 'https:' ? https : http;
        const req = lib.get(urlStr, {
            headers: {
                'User-Agent': 'Simteks-ERP-Updater/1.0',
                Accept: '*/*'
            }
        }, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && maxRedirects > 0) {
                const next = new URL(res.headers.location, urlStr).href;
                res.resume();
                resolve(httpRequestBuffer(next, maxRedirects - 1));
                return;
            }
            if (res.statusCode !== 200) {
                res.resume();
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        });
        req.on('error', reject);
    });
}

function httpDownloadFile(urlStr, destPath, onProgress, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        let parsed;
        try {
            parsed = new URL(urlStr);
        } catch (e) {
            reject(e);
            return;
        }
        const lib = parsed.protocol === 'https:' ? https : http;
        const req = lib.get(urlStr, {
            headers: {
                'User-Agent': 'Simteks-ERP-Updater/1.0',
                Accept: '*/*'
            }
        }, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && maxRedirects > 0) {
                const next = new URL(res.headers.location, urlStr).href;
                res.resume();
                resolve(httpDownloadFile(next, destPath, onProgress, maxRedirects - 1));
                return;
            }
            if (res.statusCode !== 200) {
                res.resume();
                reject(new Error(`HTTP ${res.statusCode}`));
                return;
            }
            const total = parseInt(res.headers['content-length'] || '0', 10) || 0;
            let received = 0;
            const file = fs.createWriteStream(destPath);
            res.on('data', (chunk) => {
                received += chunk.length;
                file.write(chunk);
                if (typeof onProgress === 'function' && total > 0) {
                    onProgress({ percent: (received / total) * 100, transferred: received, total });
                }
            });
            res.on('end', () => {
                file.end(() => resolve(destPath));
            });
            res.on('error', (err) => {
                file.close(() => {
                    try { fs.unlinkSync(destPath); } catch {}
                    reject(err);
                });
            });
            file.on('error', reject);
        });
        req.on('error', reject);
    });
}

async function fallbackFetchLatestInfo() {
    const base = getUpdateFeedBaseUrl();
    if (!base) throw new Error('Güncelleme adresi yapılandırılmamış');
    const ymlUrl = `${base}/latest.yml`;
    const buf = await httpRequestBuffer(ymlUrl);
    const meta = parseLatestYml(buf.toString('utf8'));
    if (!meta.version) throw new Error('latest.yml sürüm bilgisi okunamadı');
    const fileName = meta.fileName || `Simteks-Tekstil-ERP-Setup-${meta.version}.exe`;
    return {
        version: meta.version,
        fileName,
        downloadUrl: `${base}/${fileName}`
    };
}

async function fallbackCheckUpdates() {
    const current = app.getVersion();
    try {
        const info = await fallbackFetchLatestInfo();
        const updateAvailable = compareVersions(info.version, current) > 0;
        return {
            ok: true,
            version: info.version,
            current,
            updateAvailable,
            via: 'https-fallback'
        };
    } catch (e) {
        return { ok: false, message: String(e?.message || e), current };
    }
}

function showFallbackInstallDialog(version) {
    const win = mainWindowRef && !mainWindowRef.isDestroyed() ? mainWindowRef : null;
    dialog.showMessageBox(win, {
        type: 'info',
        title: 'Simteks Tekstil ERP — Güncelleme',
        message: `Yeni sürüm indirildi (${version})`,
        detail: 'Kurulum için uygulama kapanacak ve kurulum sihirbazı açılacak. Devam edilsin mi?',
        buttons: ['Kur ve kapat', 'Sonra'],
        defaultId: 0,
        cancelId: 1,
        noLink: true
    }).then(({ response }) => {
        if (response === 0) runFallbackInstaller();
    }).catch(() => {});
}

async function startFallbackUpdateDownload() {
    if (_fallbackDownloadInProgress) return;
    if (!app.isPackaged) return;
    const current = app.getVersion();
    _fallbackDownloadInProgress = true;
    try {
        sendUpdateStatus({ phase: 'checking', via: 'https-fallback' });
        const info = await fallbackFetchLatestInfo();
        if (compareVersions(info.version, current) <= 0) {
            sendUpdateStatus({ phase: 'none', via: 'https-fallback' });
            return;
        }
        sendUpdateStatus({ phase: 'available', version: info.version, via: 'https-fallback' });
        const dest = path.join(app.getPath('temp'), info.fileName);
        await httpDownloadFile(info.downloadUrl, dest, (p) => {
            sendUpdateStatus({
                phase: 'downloading',
                percent: Math.round(p.percent || 0),
                version: info.version,
                via: 'https-fallback'
            });
        });
        _fallbackUpdateExePath = dest;
        _fallbackUpdateVersion = info.version;
        sendUpdateStatus({ phase: 'ready', version: info.version, via: 'https-fallback', kind: 'exe' });
    } catch (e) {
        sendUpdateStatus({
            phase: 'error',
            message: `Yedek indirme başarısız: ${String(e?.message || e)}`,
            via: 'https-fallback'
        });
    } finally {
        _fallbackDownloadInProgress = false;
    }
}

function runFallbackInstaller() {
    if (!_fallbackUpdateExePath || !fs.existsSync(_fallbackUpdateExePath)) {
        return { ok: false, message: 'İndirilen kurulum dosyası bulunamadı' };
    }
    spawn(_fallbackUpdateExePath, [], { detached: true, stdio: 'ignore' }).unref();
    app.quit();
    return { ok: true };
}

function initAutoUpdater() {
    if (!autoUpdater || !app.isPackaged) return;
    const cfg = readUpdateConfig();
    const url = String(cfg.url || '').trim();
    if (!url) return;

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.setFeedURL({
        provider: 'generic',
        url,
        channel: String(cfg.channel || 'latest').trim() || 'latest'
    });

    autoUpdater.on('checking-for-update', () => sendUpdateStatus({ phase: 'checking', kind: 'exe' }));
    autoUpdater.on('update-available', (info) => sendUpdateStatus({ phase: 'available', version: info?.version || '', kind: 'exe' }));
    autoUpdater.on('update-not-available', () => sendUpdateStatus({ phase: 'none', kind: 'exe' }));
    autoUpdater.on('download-progress', (p) => sendUpdateStatus({ phase: 'downloading', percent: Math.round(p?.percent || 0), kind: 'exe' }));
    autoUpdater.on('update-downloaded', (info) => {
        const ver = info?.version || '';
        sendUpdateStatus({ phase: 'ready', version: ver, kind: 'exe' });
    });
    autoUpdater.on('error', (err) => {
        const raw = String(err?.message || err);
        if (isNetworkQuicError(raw)) {
            sendUpdateStatus({ phase: 'error', message: 'Ağ hatası — alternatif indirme kullanılacak', kind: 'exe', quic: true });
            return;
        }
        sendUpdateStatus({ phase: 'error', message: raw, kind: 'exe' });
    });
}

function createWindow() {
    const channelCfg = readChannelConfig();
    const winTitle = String(channelCfg.productTitle || 'Simteks Tekstil ERP').trim();
    const win = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1024,
        minHeight: 640,
        title: winTitle,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            webSecurity: true,
            preload: resolvePreload()
        }
    });

    win.once('ready-to-show', () => win.show());
    mainWindowRef = win;

    const remoteUrl = readLoadUrl();
    if (remoteUrl) {
        win.loadURL(remoteUrl);
    } else {
        win.loadFile(resolveStokHtml());
    }

    win.on('closed', () => {
        if (mainWindowRef === win) mainWindowRef = null;
        if (process.platform !== 'darwin') {
            /* pencereler app.quit ile kapanır */
        }
    });
}

ipcMain.handle('erp-read-asset', async (_evt, fileName) => {
    const assetPath = resolveAssetPath(fileName);
    if (!assetPath || !fs.existsSync(assetPath)) {
        throw new Error('Asset bulunamadı: ' + String(fileName || '') + ' (aranan: ' + assetPath + ')');
    }
    return fs.readFileSync(assetPath).toString('base64');
});

ipcMain.handle('erp-get-content-info', async () => getContentUpdateInfo());

ipcMain.handle('erp-sync-content', async () => syncContentUpdates());

ipcMain.handle('erp-reload-window', async () => {
    const win = mainWindowRef && !mainWindowRef.isDestroyed() ? mainWindowRef : null;
    if (win) win.reload();
    return { ok: true };
});

ipcMain.handle('erp-app-version', async () => app.getVersion());

ipcMain.handle('erp-check-for-updates', async () => {
    const exe = await checkExeUpdateInfo();
    return {
        ok: !!exe.ok,
        updateAvailable: !!exe.available,
        version: exe.version,
        current: exe.current,
        via: exe.via || null,
        message: exe.message || null
    };
});

async function checkExeUpdateInfo() {
    const current = app.getVersion();
    if (!app.isPackaged) {
        return { ok: true, available: false, version: current, current };
    }
    if (autoUpdater) {
        try {
            const r = await autoUpdater.checkForUpdates();
            const remote = r?.updateInfo?.version || current;
            return {
                ok: true,
                available: compareVersions(remote, current) > 0,
                version: remote,
                current
            };
        } catch (e) {
            if (isNetworkQuicError(e)) {
                const fb = await fallbackCheckUpdates();
                return {
                    ok: !!fb.ok,
                    available: !!fb.updateAvailable,
                    version: fb.version || current,
                    current,
                    via: fb.updateAvailable ? 'https-fallback' : undefined,
                    message: fb.message
                };
            }
            return { ok: false, available: false, version: current, current, message: String(e?.message || e) };
        }
    }
    return fallbackCheckUpdates().then((fb) => ({
        ok: !!fb.ok,
        available: !!fb.updateAvailable,
        version: fb.version || current,
        current,
        via: fb.updateAvailable ? 'https-fallback' : undefined,
        message: fb.message
    }));
}

async function checkAllUpdates() {
    const current = app.getVersion();
    const content = await getContentUpdateInfo();
    const exe = await checkExeUpdateInfo();
    const contentAvailable = !!(content.ok && content.updateAvailable);
    const exeAvailable = !!(exe.ok && exe.available);
    const remoteVersions = [
        contentAvailable ? content.remoteVersion : null,
        exeAvailable ? exe.version : null
    ].filter(Boolean);
    let displayVersion = current;
    for (const v of remoteVersions) {
        if (compareVersions(v, displayVersion) > 0) displayVersion = v;
    }
    return {
        ok: true,
        current,
        version: displayVersion,
        hasUpdate: contentAvailable || exeAvailable,
        content: {
            available: contentAvailable,
            version: content.remoteVersion || null,
            current: content.localVersion || null,
            pendingCount: content.pendingCount || 0
        },
        exe: {
            available: exeAvailable,
            version: exe.version || current,
            current: exe.current || current,
            via: exe.via || null
        }
    };
}

async function startUnifiedUpdateDownload(opts) {
    opts = opts || {};
    const out = { ok: true, content: null, exe: null };
    if (opts.content) {
        out.content = await syncContentUpdates();
    }
    if (opts.exe) {
        sendUpdateStatus({ phase: 'downloading', percent: 0, kind: 'exe' });
        if (autoUpdater) {
            try {
                autoUpdater.autoDownload = true;
                await autoUpdater.downloadUpdate();
                out.exe = { ok: true, via: 'electron-updater' };
            } catch (e) {
                if (isNetworkQuicError(e)) {
                    await startFallbackUpdateDownload();
                    out.exe = { ok: true, via: 'https-fallback' };
                } else {
                    out.exe = { ok: false, message: String(e?.message || e) };
                }
            }
        } else {
            await startFallbackUpdateDownload();
            out.exe = { ok: true, via: 'https-fallback' };
        }
    }
    return out;
}

ipcMain.handle('erp-check-all-updates', async () => checkAllUpdates());

ipcMain.handle('erp-start-update-download', async (_evt, opts) => startUnifiedUpdateDownload(opts || {}));

ipcMain.handle('erp-install-update', async () => {
    if (_fallbackUpdateExePath && fs.existsSync(_fallbackUpdateExePath)) {
        return runFallbackInstaller();
    }
    if (!autoUpdater) return { ok: false };
    autoUpdater.quitAndInstall(false, true);
    return { ok: true };
});

app.whenReady().then(async () => {
    protocol.handle('erp-local', async (request) => {
        try {
            const u = new URL(request.url);
            if (u.hostname !== 'asset') {
                return new Response('Not found', { status: 404 });
            }
            const name = decodeURIComponent(u.pathname.replace(/^\//, ''));
            const assetPath = resolveAssetPath(name);
            if (!assetPath || !fs.existsSync(assetPath)) {
                return new Response('Not found', { status: 404 });
            }
            const data = fs.readFileSync(assetPath);
            return new Response(data, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            });
        } catch (e) {
            return new Response(String(e?.message || e), { status: 500 });
        }
    });

    const ch = readChannelConfig();
    if (ch.productTitle) app.setName(ch.productTitle);

    // Açılışta eski yamayı sunucudan yenile (kullanıcı Tanılama'ya girmeden)
    if (app.isPackaged) {
        try {
            await syncContentUpdates();
        } catch (e) {
            console.warn('[guncelleme] acilis icerik senkron:', e?.message || e);
        }
    }

    createWindow();
    initAutoUpdater();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('second-instance', () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) {
        if (w.isMinimized()) w.restore();
        w.focus();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
