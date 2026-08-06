/**

 * Deneme derlemesi sonrası yerel dosyaları üretim profiline döndürür.

 * erp-config.js okunur, erp-build.js içine gömülür ve pakete dahil edilir.

 */

const fs = require('fs');

const path = require('path');



const root = path.join(__dirname, '..');

const electronDir = path.join(root, 'electron');



function readErpConfig() {

    const cfgPath = path.join(root, 'erp-config.js');

    if (!fs.existsSync(cfgPath)) {

        console.error('[hata] erp-config.js bulunamadı — build iptal.');

        console.error('       erp-config.sample.js dosyasını kopyalayıp Supabase URL ve anon key girin.');

        process.exit(1);

    }

    const src = fs.readFileSync(cfgPath, 'utf8');

    const urlMatch = src.match(/url:\s*['"]([^'"]+)['"]/);

    const keyMatch = src.match(/anonKey:\s*['"]([^'"]+)['"]/);

    const url = urlMatch ? urlMatch[1].trim() : '';

    const anonKey = keyMatch ? keyMatch[1].trim() : '';

    if (!url || !anonKey || url.includes('YOUR_PROJECT') || anonKey.includes('YOUR_SUPABASE')) {

        console.error('[hata] erp-config.js geçersiz — Supabase URL ve anon key doldurulmalı.');

        process.exit(1);

    }

    return { url, anonKey };

}



const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const version = String(pkg.version || '1.0.0').trim();

const supabase = readErpConfig();



const channel = {

    channel: 'production',

    productTitle: 'Simteks Tekstil ERP',

    version

};



fs.writeFileSync(path.join(electronDir, 'channel.json'), JSON.stringify(channel, null, 2), 'utf8');



const buildJs = `/** Üretim / normal masaüstü kurulumu — otomatik üretildi, elle düzenlemeyin */

window.__ERP_BUILD = {

    channel: 'production',

    label: '',

    version: '${version}',

    supabase: {

        url: '${supabase.url}',

        anonKey: '${supabase.anonKey}'

    }

};

`;



fs.writeFileSync(path.join(root, 'erp-build.js'), buildJs, 'utf8');



console.log('[prod] electron/channel.json ve erp-build.js (Supabase gömülü) hazırlandı.');


