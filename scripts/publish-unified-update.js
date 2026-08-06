/**
 * Tek güncelleme yayını → Supabase
 * Kullanım: GUNCELLEME-YAYINLA.bat  veya  npm run publish
 *
 * Adımlar:
 *   0) Sürüm otomatik +1 (1.0.14 → 1.0.15)
 *   1) Arayüz (stok.html, assets) → storage .../content/
 *   2) EXE derle
 *   3) EXE + latest.yml → storage .../win/
 */
const { execSync } = require('child_process');
const path = require('path');
const { main: bumpVersion } = require('./bump-version');

const root = path.join(__dirname, '..');

function run(cmd, label) {
    console.log('');
    console.log(`[${label}] ${cmd}`);
    execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function main() {
    console.log('');
    console.log('========================================');
    console.log('  Simteks ERP — Güncelleme yayını');
    console.log('========================================');

    const skipBump = process.env.ERP_SKIP_VERSION_BUMP === '1'
        || process.argv.includes('--no-bump');
    let version;
    if (skipBump) {
        const pkg = require(path.join(root, 'package.json'));
        version = String(pkg.version || '?').trim();
        console.log(`[0/3] Sürüm artışı atlandı (mevcut: ${version})`);
    } else {
        const bumped = bumpVersion();
        version = bumped.yeni;
        // require cache temizle — sonraki script'ler yeni sürümü görsün
        try { delete require.cache[require.resolve(path.join(root, 'package.json'))]; } catch (e) {}
    }

    console.log(`  Yayınlanacak sürüm: v${version}`);

    run('node scripts/publish-content-update.js', '1/3 Arayüz');
    run('npm run build:win', '2/3 EXE derleme');
    try {
        run('node scripts/prepare-desktop-update.js', 'yedek');
    } catch (e) {
        console.warn('[uyarı] Yerel yedek atlandı.');
    }
    run('node scripts/upload-desktop-update-supabase.js', '3/3 Supabase yükleme');

    console.log('');
    console.log('========================================');
    console.log('  HAZIR — güncelleme yayında.');
    console.log(`  Sürüm: ${version}`);
    console.log('  Fabrika: uygulamayı aç → Güncelleme yükle');
    console.log('========================================');
    console.log('');
}

try {
    main();
} catch (e) {
    console.error('');
    console.error('[HATA]', e.message || e);
    process.exit(1);
}
