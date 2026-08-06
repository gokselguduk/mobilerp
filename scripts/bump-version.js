/**
 * package.json patch sürümünü +1 artırır (1.0.14 → 1.0.15).
 * electron/channel.json da güncellenir.
 * Kullanım: node scripts/bump-version.js
 *          node scripts/bump-version.js --dry
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const channelPath = path.join(root, 'electron', 'channel.json');
const dry = process.argv.includes('--dry');

function bumpPatch(ver) {
    const parts = String(ver || '0.0.0').trim().split('.').map(x => parseInt(x, 10));
    while (parts.length < 3) parts.push(0);
    const major = Number.isFinite(parts[0]) ? parts[0] : 0;
    const minor = Number.isFinite(parts[1]) ? parts[1] : 0;
    const patch = (Number.isFinite(parts[2]) ? parts[2] : 0) + 1;
    return `${major}.${minor}.${patch}`;
}

function main() {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const onceki = String(pkg.version || '0.0.0').trim();
    const yeni = bumpPatch(onceki);
    if (dry) {
        console.log(`[bump] ${onceki} → ${yeni} (dry)`);
        return { onceki, yeni };
    }
    pkg.version = yeni;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

    let channel = { channel: 'production', productTitle: 'Simteks Tekstil ERP', version: yeni };
    try {
        if (fs.existsSync(channelPath)) {
            channel = { ...JSON.parse(fs.readFileSync(channelPath, 'utf8')), version: yeni };
        }
    } catch (e) {}
    fs.writeFileSync(channelPath, JSON.stringify(channel, null, 2) + '\n', 'utf8');

    console.log(`[bump] Sürüm ${onceki} → ${yeni}`);
    return { onceki, yeni };
}

if (require.main === module) {
    try {
        main();
    } catch (e) {
        console.error('[bump] Hata:', e.message || e);
        process.exit(1);
    }
}

module.exports = { bumpPatch, main };
