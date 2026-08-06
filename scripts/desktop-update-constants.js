const fs = require('fs');
const path = require('path');

const BUCKET = 'erp-desktop-updates';
const STORAGE_PREFIX = 'win';
const CONTENT_PREFIX = 'content';

function readSupabaseUrlFromErpConfig(rootDir) {
    const p = path.join(rootDir || path.join(__dirname, '..'), 'erp-config.js');
    try {
        const txt = fs.readFileSync(p, 'utf8');
        const m = txt.match(/url:\s*['"](https:\/\/[^'"]+\.supabase\.co)['"]/i);
        return m ? m[1].replace(/\/+$/, '') : '';
    } catch {
        return '';
    }
}

function getSupabaseUpdateFeedUrl(supabaseUrl) {
    const base = String(supabaseUrl || '').replace(/\/+$/, '');
    if (!base) return '';
    return `${base}/storage/v1/object/public/${BUCKET}/${STORAGE_PREFIX}`;
}

function getSupabaseContentFeedUrl(supabaseUrl) {
    const base = String(supabaseUrl || '').replace(/\/+$/, '');
    if (!base) return '';
    return `${base}/storage/v1/object/public/${BUCKET}/${CONTENT_PREFIX}`;
}

module.exports = {
    BUCKET,
    STORAGE_PREFIX,
    CONTENT_PREFIX,
    readSupabaseUrlFromErpConfig,
    getSupabaseUpdateFeedUrl,
    getSupabaseContentFeedUrl
};
