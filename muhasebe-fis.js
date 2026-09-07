/**
 * Sevkiyat fişi modülü (eski: muhasebe teslim fişi).
 * Fişler kumas_stok çıkış hareketlerinden otomatik üretilir.
 * İrsaliye numarası / muhasebeye gönderme akışı yok — yalnızca sevkiyat kaydı ve yazdırma.
 */

/* ─── Durum değişkenleri ─── */
let _muhasebeFisCache    = [];
let _muhasebeFisFiltre   = { q: '', tip: 'HEPSİ', bas: '', bit: '' };
let _muhasebeFisAcik     = {};
let _muhasebeFisGecmisAcik = false;
let _muhasebeFisCekiAktif  = null;
let _muhasebeFisCacheAt  = 0;
let _muhasebeFisListeLimit = 10;
let _muhasebeFisStokKaynak = null;
const MUHASEBE_FIS_SAYFA_ADIM = 10;
const MUHASEBE_FIS_STOK_GUN = 120;
const MUHASEBE_FIS_STOK_LIMIT = 600;
const MUHASEBE_FIS_CACHE_MS = 120000;

/* ─── Yardımcılar ─── */

function muhasebeFisEsc(v) {
    if (typeof pdfEsc === 'function') return pdfEsc(v);
    return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function muhasebeFisNormalize(row) {
    if (!row) return null;
    const id = String(row.id || '').trim();
    if (!id) return null;
    // irsaliye_no kolonundan veya notlar içindeki [IRS:...] tag'inden oku
    let irsNo = String(row.irsaliye_no || '').trim();
    if (!irsNo) {
        const m = String(row.notlar || '').match(/\[IRS:([^\]]+)\]/i);
        if (m) irsNo = m[1].trim();
    }
    const durum = irsNo ? 'IRSALIYE_KESILDI' : 'BEKLEMEDE';
    return {
        id,
        fis_no:       String(row.fis_no || '').trim(),
        created_at:   row.created_at || new Date().toISOString(),
        depo_grup:    String(row.depo_grup || 'MAMUL').toUpperCase(),
        musteri:      String(row.musteri || '').toUpperCase().trim(),
        teslim_alan:  String(row.teslim_alan || '').trim(),
        teslim_tel:   String(row.teslim_tel || '').trim(),
        plaka:        String(row.plaka || '').toUpperCase().trim(),
        sofor:        String(row.sofor || '').trim(),
        teslim_adres: String(row.teslim_adres || '').trim(),
        irsaliye_no:  irsNo,
        notlar:       String(row.notlar || '').trim(),
        kalemler:     Array.isArray(row.kalemler) ? row.kalemler : [],
        hareket_ids:  Array.isArray(row.hareket_ids) ? row.hareket_ids.map(String) : [],
        durum,
        created_by:   String(row.created_by || '').trim()
    };
}

function muhasebeFisBul(id) {
    return (_muhasebeFisCache || []).find(f => String(f.id) === String(id)) || null;
}

/* ─── Supabase: fiş ekranı için sınırlı stok çekme ─── */

async function muhasebeFisStokTablosuCek(tablo, opts) {
    opts = opts || {};
    if (typeof sb === 'undefined' || !sb) return [];
    const cols = (typeof erpSyncLightCols === 'function')
        ? erpSyncLightCols(tablo)
        : ((typeof ERP_SYNC_LIGHT_COLS !== 'undefined' && ERP_SYNC_LIGHT_COLS[tablo]) || '*');
    const limit = Math.min(Math.max(parseInt(opts.limit, 10) || MUHASEBE_FIS_STOK_LIMIT, 50), 2000);
    try {
        let q = sb.from(tablo).select(cols).order('created_at', { ascending: false }).limit(limit);
        if (opts.sinceIso) q = q.gte('created_at', opts.sinceIso);
        if (opts.beforeIso) q = q.lt('created_at', opts.beforeIso);
        const { data, error } = await q;
        if (error) {
            console.warn('[MF]', tablo, 'sınırlı yükleme:', error.message);
            return [];
        }
        return Array.isArray(data) ? data : [];
    } catch (e) {
        console.warn('[MF]', tablo, 'sınırlı yükleme exception:', e.message);
        return [];
    }
}

function muhasebeFisStokKaynakBirlestir(tablo, batch) {
    if (!batch?.length || typeof dataCache === 'undefined') return;
    if (typeof erpSyncUnionById === 'function') {
        dataCache[tablo] = erpSyncUnionById(batch, dataCache[tablo] || []);
    } else {
        const map = new Map((dataCache[tablo] || []).map(r => [String(r.id), r]));
        batch.forEach(r => map.set(String(r.id), { ...(map.get(String(r.id)) || {}), ...r }));
        dataCache[tablo] = Array.from(map.values());
    }
}

function muhasebeFisStokEnEskiIso(rows) {
    let min = Infinity;
    (rows || []).forEach(r => {
        const t = Date.parse(r?.created_at || '');
        if (Number.isFinite(t) && t < min) min = t;
    });
    return Number.isFinite(min) ? new Date(min).toISOString() : null;
}

async function muhasebeFisStokKaynakYukle(opts) {
    opts = opts || {};
    const eski = !!opts.eski;
    if (!eski && _muhasebeFisStokKaynak?.ilkYuklendi && !opts.force) return;

    let sinceIso = opts.sinceIso || null;
    let beforeIso = null;
    if (eski && _muhasebeFisStokKaynak?.enEskiIso) {
        beforeIso = _muhasebeFisStokKaynak.enEskiIso;
        sinceIso = new Date(Date.parse(beforeIso) - MUHASEBE_FIS_STOK_GUN * 86400000).toISOString();
    } else if (!sinceIso) {
        sinceIso = new Date(Date.now() - MUHASEBE_FIS_STOK_GUN * 86400000).toISOString();
    }

    const fetchOpts = { sinceIso, beforeIso, limit: MUHASEBE_FIS_STOK_LIMIT };
    const [kumasBatch, iplikBatch] = await Promise.all([
        muhasebeFisStokTablosuCek('kumas_stok', fetchOpts),
        muhasebeFisStokTablosuCek('iplik_stok', fetchOpts)
    ]);
    muhasebeFisStokKaynakBirlestir('kumas_stok', kumasBatch);
    muhasebeFisStokKaynakBirlestir('iplik_stok', iplikBatch);

    const batchEnEski = muhasebeFisStokEnEskiIso([...kumasBatch, ...iplikBatch]);
    const prevEnEski = _muhasebeFisStokKaynak?.enEskiIso || null;
    let enEskiIso = batchEnEski || sinceIso;
    if (prevEnEski && batchEnEski) {
        enEskiIso = Date.parse(batchEnEski) < Date.parse(prevEnEski) ? batchEnEski : prevEnEski;
    } else if (prevEnEski) {
        enEskiIso = prevEnEski;
    }

    const bosBatch = !kumasBatch.length && !iplikBatch.length;
    let tamMi = !!(_muhasebeFisStokKaynak?.tamMi);
    if (eski && bosBatch) tamMi = true;
    else if (!eski && bosBatch) tamMi = true;

    _muhasebeFisStokKaynak = {
        ilkYuklendi: true,
        enEskiIso,
        tamMi
    };
}

/* ─── Supabase: kumas_stok taze çekme (tek fiş / detay) ─── */

async function muhasebeFisIplikStokTazele() {
    if (typeof sb === 'undefined' || !sb) return;
    try {
        const syncedAt = typeof erpTableSyncedAt === 'function' ? erpTableSyncedAt('iplik_stok') : 0;
        if (syncedAt && (Date.now() - syncedAt) < 60000) return;
        if (typeof erpSyncFetchTable === 'function') {
            const prev = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.iplik_stok))
                ? dataCache.iplik_stok
                : [];
            let fo = {};
            if (prev.length >= 80 && typeof erpSyncTableWatermarkMs === 'function') {
                const wm = erpSyncTableWatermarkMs(prev);
                if (wm > 0) {
                    fo = {
                        sinceIso: new Date(wm - 3000).toISOString(),
                        maxPages: 25,
                        pageSize: 400
                    };
                }
            }
            const out = await erpSyncFetchTable('iplik_stok', true, fo);
            if (out?.error) console.warn('[MF] iplik_stok yükleme hatası:', out.error.message || out.error);
            const gelen = out?.data;
            if (typeof dataCache === 'undefined') return;
            if (Array.isArray(gelen) && gelen.length) {
                if ((out?.incremental || out?.truncated) && typeof erpSyncUnionById === 'function') {
                    dataCache.iplik_stok = erpSyncUnionById(gelen, dataCache.iplik_stok);
                } else if (typeof erpDataCacheMergeTable === 'function') {
                    dataCache.iplik_stok = erpDataCacheMergeTable('iplik_stok', gelen, dataCache.iplik_stok);
                } else {
                    dataCache.iplik_stok = gelen;
                }
            }
            if (typeof erpTableSyncedAtYaz === 'function') erpTableSyncedAtYaz('iplik_stok');
            return;
        }
        const cols = (typeof erpSyncLightCols === 'function')
            ? erpSyncLightCols('iplik_stok')
            : ((typeof ERP_SYNC_LIGHT_COLS !== 'undefined' && ERP_SYNC_LIGHT_COLS.iplik_stok) || '*');
        const pageSize = 1000;
        let all = [];
        for (let from = 0; from < 50000; from += pageSize) {
            const { data, error } = await sb.from('iplik_stok')
                .select(cols)
                .order('created_at', { ascending: false })
                .range(from, from + pageSize - 1);
            if (error) { console.warn('[MF] iplik_stok yükleme hatası:', error.message); break; }
            const batch = Array.isArray(data) ? data : [];
            all = all.concat(batch);
            if (batch.length < pageSize) break;
        }
        if (!all.length || typeof dataCache === 'undefined') return;
        const prevMap = new Map((dataCache.iplik_stok || []).map(r => [String(r.id), r]));
        const tazeler = new Map(all.map(r => [String(r.id), r]));
        dataCache.iplik_stok = (dataCache.iplik_stok || []).map(r =>
            tazeler.has(String(r.id)) ? { ...r, ...tazeler.get(String(r.id)) } : r
        );
        all.forEach(r => {
            if (!prevMap.has(String(r.id))) dataCache.iplik_stok.unshift(r);
        });
    } catch (e) {
        console.warn('[MF] iplik_stok tazele exception:', e.message);
    }
}

async function muhasebeFisKumasStokTazele() {
    if (typeof sb === 'undefined' || !sb) return;
    try {
        const syncedAt = typeof erpTableSyncedAt === 'function' ? erpTableSyncedAt('kumas_stok') : 0;
        if (syncedAt && (Date.now() - syncedAt) < 60000) return;
        if (typeof erpSyncFetchTable === 'function') {
            const prev = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.kumas_stok))
                ? dataCache.kumas_stok
                : [];
            let fo = {};
            if (prev.length >= 80 && typeof erpSyncTableWatermarkMs === 'function') {
                const wm = erpSyncTableWatermarkMs(prev);
                if (wm > 0) {
                    fo = {
                        sinceIso: new Date(wm - 3000).toISOString(),
                        maxPages: 25,
                        pageSize: 400
                    };
                }
            }
            const out = await erpSyncFetchTable('kumas_stok', true, fo);
            if (out?.error) console.warn('[MF] kumas_stok yükleme hatası:', out.error.message || out.error);
            const gelen = out?.data;
            if (typeof dataCache === 'undefined') return;
            if (Array.isArray(gelen) && gelen.length) {
                if ((out?.incremental || out?.truncated) && typeof erpSyncUnionById === 'function') {
                    dataCache.kumas_stok = erpSyncUnionById(gelen, dataCache.kumas_stok);
                } else if (typeof erpDataCacheMergeTable === 'function') {
                    dataCache.kumas_stok = erpDataCacheMergeTable('kumas_stok', gelen, dataCache.kumas_stok);
                } else {
                    dataCache.kumas_stok = gelen;
                }
            }
            if (typeof erpTableSyncedAtYaz === 'function') erpTableSyncedAtYaz('kumas_stok');
            return;
        }
        const cols = (typeof erpSyncLightCols === 'function')
            ? erpSyncLightCols('kumas_stok')
            : ((typeof ERP_SYNC_LIGHT_COLS !== 'undefined' && ERP_SYNC_LIGHT_COLS.kumas_stok) || '*');
        const pageSize = 1000;
        let all = [];
        for (let from = 0; from < 50000; from += pageSize) {
            const { data, error } = await sb.from('kumas_stok')
                .select(cols)
                .order('created_at', { ascending: false })
                .range(from, from + pageSize - 1);
            if (error) { console.warn('[MF] kumas_stok yükleme hatası:', error.message); break; }
            const batch = Array.isArray(data) ? data : [];
            all = all.concat(batch);
            if (batch.length < pageSize) break;
        }
        if (!all.length || typeof dataCache === 'undefined') return;
        const prevMap = new Map((dataCache.kumas_stok || []).map(r => [String(r.id), r]));
        const tazeler = new Map(all.map(r => [String(r.id), r]));
        dataCache.kumas_stok = (dataCache.kumas_stok || []).map(r =>
            tazeler.has(String(r.id)) ? { ...r, ...tazeler.get(String(r.id)) } : r
        );
        all.forEach(r => {
            if (!prevMap.has(String(r.id))) dataCache.kumas_stok.unshift(r);
        });
    } catch (e) {
        console.warn('[MF] kumas_stok tazele exception:', e.message);
    }
}

/* ─── Ana yükleme ─── */

async function muhasebeFisleriYukle(opts) {
    opts = opts || {};
    if (opts.fromCache !== true) {
        await muhasebeFisStokKaynakYukle({ force: !!opts.force, eski: !!opts.eski });
    }
    _muhasebeFisCache = muhasebeFisHareketlerdenOlustur();
    _muhasebeFisCacheAt = Date.now();
    return _muhasebeFisCache;
}

/* ─── İrsaliye işaretleme (iptal — UI'dan kaldırıldı) ─── */
async function muhasebeFisIrsaliyeIsaretle() {
    if (typeof erpToast === 'function') erpToast('İrsaliye numarası girişi kaldırıldı. Bu ekran yalnızca sevkiyat fişleridir.', 'info');
}
async function muhasebeFisBeklemeyeAl() {
    if (typeof erpToast === 'function') erpToast('İrsaliye durumu kullanılmıyor.', 'info');
}

/* ─── Hareketlerden fiş üretme ─── */

function muhasebeFisCikisTipiMi(h) {
    const tip = String(h?.islem_turu || '').toUpperCase()
        .replace(/İ/g,'I').replace(/Ç/g,'C').replace(/Ş/g,'S');
    if (tip.includes('CIKIS')) return true;
    if (tip.includes('GIRIS')) return false;
    return null;
}

/** Stok giriş / stok sayım muhasebe fişine girmez — yalnızca gerçek sevkiyat çıkışları. */
function muhasebeFisMuhasebeDisiHareketMi(h) {
    if (!h) return true;
    const notlar = String(h.notlar || '').toUpperCase()
        .replace(/İ/g, 'I').replace(/Ş/g, 'S');
    if (notlar.includes('[SAYIM]') || notlar.includes('STOK_SAYIM') || /\bSAYIM\b/.test(notlar)) return true;
    const kb = String(h.kaynak_birim || '').toUpperCase()
        .replace(/İ/g, 'I').replace(/Ş/g, 'S');
    if (kb.includes('SAYIM') || kb.includes('STOK_SAYIM')) return true;
    // Açık stok girişi
    if (muhasebeFisCikisTipiMi(h) === false) return true;
    return false;
}

function muhasebeFisMamulCikisHareketiMi(h) {
    if (!h) return false;
    if (muhasebeFisMuhasebeDisiHareketMi(h)) return false;
    if (typeof kumasStokHareketiMamulDepoMu === 'function' && !kumasStokHareketiMamulDepoMu(h)) return false;
    // Muhasebe fişi: müşteri/firma olan gerçek sevkiyat çıkışı
    if (!String(h.firma || '').trim()) return false;
    const tip = muhasebeFisCikisTipiMi(h);
    if (tip === true) return true;
    return false;
}

function muhasebeFisSevkYerOku(h) {
    let yer = '';
    if (typeof depoNotEtiketOku === 'function') yer = String(depoNotEtiketOku(h?.notlar, 'SEVK_YER') || '').trim();
    else {
        const m = String(h?.notlar || '').match(/\[SEVK_YER:([^\]]+)\]/i);
        yer = m ? m[1].trim() : '';
    }
    return yer.toUpperCase().replace(/İ/g, 'I').replace(/Ş/g, 'S').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ö/g, 'O').replace(/Ç/g, 'C');
}

/** İç birim transferleri muhasebe fişine girmez. */
function muhasebeFisIcBirimSevkMi(h) {
    const yer = muhasebeFisSevkYerOku(h);
    const notlar = String(h?.notlar || '').toUpperCase();
    // Dokuma Depo iç sevkiyat (konfeksiyon / terbiye / genel depo)
    if (notlar.includes('DOKUMA_DEPO_SEVK')) {
        return yer === 'KONFEKSIYON' || yer === 'BOYAHANE' || yer === 'GENEL_DEPO';
    }
    if (yer === 'SIMTEKS DOKUMA' || yer === 'SIMTEKS KONFEKSIYON') return true;
    const firma = String(h?.firma || '').trim().toUpperCase()
        .replace(/İ/g, 'I').replace(/Ş/g, 'S');
    if (firma === 'SIMTEKS DOKUMA' || firma === 'SIMTEKS KONFEKSIYON') return true;
    return false;
}

function muhasebeFisKumasCikisHareketiMi(h) {
    if (!h) return false;
    if (muhasebeFisMuhasebeDisiHareketMi(h)) return false;
    if (typeof kumasStokHareketiMamulDepoMu === 'function' && kumasStokHareketiMamulDepoMu(h)) return false;
    const kb = String(h.kaynak_birim || '').toUpperCase();
    const kumasKb = kb === 'DEPO_HAREKET_KUMAS' || kb.startsWith('DEPO_HAREKET_KUMAS')
        || kb === 'DEPO_HAREKET_HAM_KUMAS' || kb === 'DEPO_HAREKET_MAMUL_KUMAS'
        || kb === 'HAM_KUMAS' || kb === 'MAMUL_KUMAS' || kb === 'KUMAS';
    if (!kumasKb) return false;
    const notlar = String(h.notlar || '').toUpperCase();
    // Dokuma hazırlık / iç stok hareketleri hariç; müşteri sevkiyatı dahil
    if (notlar.includes('DOKUMA_SEVKE_HAZIR')) return false;
    if (notlar.includes('DOKUMA_DEPO_SEVK') || notlar.includes('[DOKUMA_DEPO')) {
        if (muhasebeFisSevkYerOku(h) !== 'MUSTERI') return false;
    } else if (notlar.includes('DOKUMA_DEPO')) {
        return false;
    }
    if (!String(h.firma || '').trim()) return false;
    if (muhasebeFisIcBirimSevkMi(h)) return false;
    const tip = muhasebeFisCikisTipiMi(h);
    if (tip === true) return true;
    return false;
}

function muhasebeFisIplikCikisHareketiMi(h) {
    if (!h) return false;
    if (muhasebeFisMuhasebeDisiHareketMi(h)) return false;
    if (typeof iplikDepoHareketiMi === 'function' && !iplikDepoHareketiMi(h)) return false;
    if (!String(h.firma || '').trim()) return false;
    if (muhasebeFisIcBirimSevkMi(h)) return false;
    const tip = muhasebeFisCikisTipiMi(h);
    if (tip === true) return true;
    if (tip === false) return false;
    const kg = parseFloat(h.miktar_kg) || 0;
    const mt = parseFloat(h.miktar_mt) || 0;
    const ad = parseInt(h.cuval_sayisi, 10) || 0;
    return kg < -1e-9 || mt < -1e-9 || ad < 0;
}

function muhasebeFisDepoGrupEtiket(depoGrup) {
    const g = String(depoGrup || '').toUpperCase();
    if (g === 'KUMAS') return 'Kumaş';
    if (g === 'IPLIK') return 'İplik';
    return 'Mamül';
}

function muhasebeFisNotMetaOku(s, key) {
    const m = String(s || '').match(new RegExp('\\[' + key + ':([^\\]]+)\\]', 'i'));
    return m ? m[1].trim() : '';
}

/** Fiş notundan satır bazlı "Çeki: N top · …" özetlerini temizle (ilk satır yanılgısı olmasın). */
function muhasebeFisNotlarCekiMetniTemizle(txt) {
    return String(txt || '')
        .replace(/\s*Çeki\s*:\s*\d+\s*top(?:\s*[·•\-]\s*[\d.,]+\s*(?:mt|kg))*/gi, '')
        .replace(/\s*Çeki\s*:\s*[^\n\[]+/gi, '')
        .replace(/\s*·\s*·+/g, ' · ')
        .replace(/^\s*·\s*|\s*·\s*$/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function muhasebeFisHareketGrupAnahtari(h) {
    const ts = h.created_at ? new Date(h.created_at).getTime() : 0;
    const bucket = Number.isFinite(ts) ? Math.floor(ts / 120000) : 0;
    const teslim = typeof depoNotlarTeslimOku === 'function' ? depoNotlarTeslimOku(h.notlar) : '';
    return [bucket, String(h.firma||'').trim().toUpperCase(), String(teslim||'').trim().toUpperCase(),
            String(h.updated_by||'').trim().toUpperCase()].join('|');
}

function muhasebeFisKalemDoluMu(k) {
    if (!k) return false;
    return (parseInt(k.adet,10)||0) > 0 || Math.abs(parseFloat(k.mt)||0) > 1e-9 || Math.abs(parseFloat(k.kg)||0) > 1e-9;
}

/** Miktar 0 olsa bile ürün satırı varsa fiş/PDF'de göster. */
function muhasebeFisKalemGosterilebilirMi(k) {
    if (!k) return false;
    if (muhasebeFisKalemDoluMu(k)) return true;
    return !!(String(k.stok_kodu || '').trim() || String(k.urun_adi || '').trim() || String(k.kumas_cinsi || '').trim());
}

function muhasebeFisSayiAbs(v) {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return Math.abs(v) || 0;
    const s = String(v).trim().replace(/\s/g, '').replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.abs(n) : 0;
}

/** Fişe bağlı stok hareketlerini cache'den (gerekirse id ile) çöz. */
function muhasebeFisHareketleriCoz(fis) {
    const hIds = (fis?.hareket_ids || []).filter(id => id != null && id !== '').map(String);
    if (!hIds.length) return [];
    const idSet = new Set(hIds);
    const grup = String(fis?.depo_grup || '').toUpperCase();
    if (grup === 'IPLIK') {
        const iplik = typeof dataCache !== 'undefined' ? (dataCache.iplik_stok || []) : [];
        return iplik.filter(h => idSet.has(String(h.id)));
    }
    const kumas = typeof dataCache !== 'undefined' ? (dataCache.kumas_stok || []) : [];
    return kumas.filter(h => idSet.has(String(h.id)));
}

/**
 * Fiş kalemlerini her zaman güncel hareketlerden üret.
 * Cache'deki fis.kalemler boş/eski olsa bile PDF ve çeki dolu kalsın.
 */
function muhasebeFisKalemleriCoz(fis) {
    if (!fis) return [];
    const grup = String(fis.depo_grup || 'MAMUL').toUpperCase();
    const hareketler = muhasebeFisHareketleriCoz(fis);
    let kalemler = [];
    if (hareketler.length) {
        kalemler = hareketler
            .map(h => muhasebeFisKalemFromPayload(h, grup))
            .filter(muhasebeFisKalemGosterilebilirMi);
    }
    if (!kalemler.length) {
        kalemler = (fis.kalemler || []).filter(muhasebeFisKalemGosterilebilirMi);
    }
    return kalemler;
}

/** [CEKI:] yoksa mt/kg/top'tan tek satırlık çeki üret. */
function muhasebeFisCekiSatirlariUret(hareket) {
    if (!hareket) return null;
    if (typeof kumasCekiNotlarOku === 'function') {
        const mevcut = kumasCekiNotlarOku(hareket.notlar);
        if (mevcut && mevcut.length) return mevcut;
    }
    const mt = muhasebeFisSayiAbs(hareket.miktar_mt);
    const kg = muhasebeFisSayiAbs(hareket.miktar_kg);
    const tops = Math.round(muhasebeFisSayiAbs(hareket.cuval_sayisi) || muhasebeFisSayiAbs(hareket.top_sayisi) || 0);
    if (mt <= 1e-9 && kg <= 1e-9 && tops <= 0) return null;
    if (tops > 1 && mt > 1e-9) {
        const birimMt = mt / tops;
        const birimKg = kg > 1e-9 ? kg / tops : 0;
        const out = [];
        for (let i = 0; i < tops; i++) {
            out.push({ no: i + 1, mt: Math.round(birimMt * 100) / 100, kg: Math.round(birimKg * 100) / 100 });
        }
        const sumMt = out.reduce((s, r) => s + r.mt, 0);
        const sumKg = out.reduce((s, r) => s + r.kg, 0);
        if (out.length) {
            out[out.length - 1].mt = Math.round((out[out.length - 1].mt + (mt - sumMt)) * 100) / 100;
            if (kg > 1e-9) out[out.length - 1].kg = Math.round((out[out.length - 1].kg + (kg - sumKg)) * 100) / 100;
        }
        return out;
    }
    return [{ no: 1, mt: mt || 0, kg: kg || (tops > 0 ? tops : 0) }];
}

async function muhasebeFisHareketleriTazele(fis) {
    const hIds = (fis?.hareket_ids || []).filter(id => id != null && id !== '').map(String);
    if (!hIds.length || typeof sb === 'undefined' || !sb) return muhasebeFisHareketleriCoz(fis);
    const grup = String(fis?.depo_grup || '').toUpperCase();
    const tablo = grup === 'IPLIK' ? 'iplik_stok' : 'kumas_stok';
    try {
        const cols = tablo === 'kumas_stok'
            ? 'id,stok_kodu,urun_adi,kumas_cinsi,firma,marka,renk,ebat,olcu,miktar_kg,miktar_mt,cuval_sayisi,top_sayisi,notlar,islem_turu,kaynak_birim,ana_grup,lot_no,created_at,updated_by,irsaliye_no'
            : 'id,stok_kodu,iplik_no,urun_adi,cins,firma,marka,renk,miktar_kg,miktar_mt,cuval_sayisi,notlar,islem_turu,kaynak_birim,created_at,updated_by';
        const { data } = await sb.from(tablo).select(cols).in('id', hIds);
        if (!Array.isArray(data) || !data.length || typeof dataCache === 'undefined') {
            return muhasebeFisHareketleriCoz(fis);
        }
        const cacheKey = tablo === 'kumas_stok' ? 'kumas_stok' : 'iplik_stok';
        const prev = Array.isArray(dataCache[cacheKey]) ? dataCache[cacheKey] : [];
        const map = new Map(prev.map(r => [String(r.id), r]));
        data.forEach(t => {
            const id = String(t.id);
            map.set(id, { ...(map.get(id) || {}), ...t });
        });
        dataCache[cacheKey] = Array.from(map.values());
    } catch (e) { /* cache ile devam */ }
    return muhasebeFisHareketleriCoz(fis);
}

function muhasebeFisKalemMiktarYazi(k) {
    const mt = Math.abs(parseFloat(k?.mt)||0);
    const kg = Math.abs(parseFloat(k?.kg)||0);
    const ad = Math.abs(parseInt(k?.adet,10)||0);
    const parts = [];
    if (mt > 1e-9) parts.push(mt.toLocaleString('tr-TR',{maximumFractionDigits:2}) + ' mt');
    if (kg > 1e-9) parts.push(kg.toLocaleString('tr-TR',{maximumFractionDigits:2}) + ' kg');
    if (ad > 0)    parts.push(ad + ((mt > 1e-9 || kg > 1e-9) ? ' top' : ' ad'));
    return parts.join(' · ') || '—';
}

function muhasebeFisKartBul(kod) {
    const k = String(kod || '').trim();
    if (!k) return null;
    if (typeof kumasKutuphanesiKartBul === 'function') {
        const a = kumasKutuphanesiKartBul(k);
        if (a) return a;
    }
    if (typeof mamulTopluKartBul === 'function') {
        const a = mamulTopluKartBul(k);
        if (a) return a;
    }
    const u = k.toUpperCase();
    const list = typeof dataCache !== 'undefined' ? (dataCache.kumas_kutuphanesi || []) : [];
    const kodHit = list.find(x =>
        String(x.stok_kodu || '').trim().toUpperCase() === u ||
        String(x.desen_kodu || '').trim().toUpperCase() === u
    );
    if (kodHit) return kodHit;
    const n = k.toLocaleLowerCase('tr-TR');
    return list.find(x => {
        const ad = String(x.urun_adi || '').trim().toLocaleLowerCase('tr-TR');
        const desen = String(x.desen_adi || '').trim().toLocaleLowerCase('tr-TR');
        return (ad && ad === n) || (desen && desen === n);
    }) || null;
}

function muhasebeFisNotEtiket(notlar, etiket) {
    const m = String(notlar || '').match(new RegExp('\\[' + etiket + ':([^\\]]+)\\]', 'i'));
    return m ? String(m[1] || '').trim() : '';
}

function muhasebeFisSiparisKaleminden(p) {
    const not = String(p?.notlar || '');
    let sid = p?.siparis_id != null && p.siparis_id !== '' ? p.siparis_id : null;
    let ki = p?.kalem_idx != null && p.kalem_idx !== '' ? parseInt(p.kalem_idx, 10) : NaN;
    let m = not.match(/\[SEVK_MERKEZ_ADET:sip=([^\]|]+)\|k=(\d+)/i);
    if (m) {
        if (sid == null) sid = m[1];
        if (!Number.isFinite(ki)) ki = parseInt(m[2], 10);
    }
    m = not.match(/\[SEVK_GRID:([^\]|]+)\|(\d+)/i);
    if (m) {
        if (sid == null) sid = m[1];
        if (!Number.isFinite(ki)) ki = parseInt(m[2], 10);
    }
    if (sid == null || !Number.isFinite(ki) || ki < 0) return null;
    const sip = (typeof dataCache !== 'undefined' ? (dataCache.siparisler || []) : [])
        .find(s => String(s.id) === String(sid));
    if (!sip) return null;
    let kalemler = [];
    if (typeof uaSiparisKalemleriGetir === 'function') {
        kalemler = uaSiparisKalemleriGetir(sip) || [];
    } else if (typeof siparisListeKalemleriArr === 'function') {
        kalemler = siparisListeKalemleriArr(sip);
    }
    let n = 0;
    while (typeof kalemler === 'string' && n < 4) {
        try { kalemler = JSON.parse(kalemler); } catch (e) { break; }
        n++;
    }
    if (!Array.isArray(kalemler) || !kalemler[ki]) return null;
    return { sip, k: kalemler[ki], ki };
}

function muhasebeFisKalemFromPayload(p, depoGrup) {
    let kod  = String(p?.stok_kodu || '').trim();
    let adet = Math.round(muhasebeFisSayiAbs(p?.cuval_sayisi));
    if (!adet) adet = Math.round(muhasebeFisSayiAbs(p?.top_sayisi));
    let mt   = muhasebeFisSayiAbs(p?.miktar_mt);
    let kg   = muhasebeFisSayiAbs(p?.miktar_kg);
    // Bazı kayıtlarda miktar yalnızca notta kalır
    if (mt <= 1e-9 && p?.notlar) {
        const mMt = String(p.notlar).match(/\[(?:MT|METRE|MIKTAR_MT):([^\]]+)\]/i);
        if (mMt) mt = muhasebeFisSayiAbs(mMt[1]);
    }
    if (kg <= 1e-9 && p?.notlar) {
        const mKg = String(p.notlar).match(/\[(?:KG|MIKTAR_KG):([^\]]+)\]/i);
        if (mKg) kg = muhasebeFisSayiAbs(mKg[1]);
    }
    if (!adet && p?.notlar) {
        const mAd = String(p.notlar).match(/\[(?:AD|ADET|TOP):([^\]]+)\]/i);
        if (mAd) adet = Math.round(muhasebeFisSayiAbs(mAd[1]));
    }
    const gRaw = String(depoGrup || '').toUpperCase();
    const grup = gRaw === 'KUMAS' ? 'KUMAS' : (gRaw === 'IPLIK' ? 'IPLIK' : 'MAMUL');
    let kart = muhasebeFisKartBul(kod);

    if (grup === 'IPLIK') {
        return {
            depo_grup: 'IPLIK',
            stok_kodu: kod,
            urun_adi: String(p?.iplik_no || p?.urun_adi || p?.cins || kod).trim(),
            urun_grubu: String(p?.marka || '').trim(),
            kumas_cinsi: String(p?.cins || '').trim(),
            terbiye: '',
            tarak_eni: '',
            ham_en: '',
            atki_sikligi: '',
            cozgu_sikligi: '',
            atki_ipi: '',
            cozgu_ipi: '',
            renk: String(p?.renk || '').trim(),
            ebat: '',
            adet, mt, kg
        };
    }

    if (grup === 'KUMAS') {
        const varyantKart = typeof kumasStokListeVaryantKartBul === 'function'
            ? kumasStokListeVaryantKartBul(kod)
            : kart;
        const anaKod = typeof kumasAnaKodBul === 'function' ? kumasAnaKodBul(kod) : kod;
        const anaKart = typeof kumasAnaKayitBul === 'function' ? kumasAnaKayitBul(anaKod) : null;
        const kaynakKart = varyantKart || kart || null;
        const bazKart = anaKart || kaynakKart || null;
        const tekKaynak = bazKart || p;
        const tek = typeof kumasKartTeknikDetay === 'function' ? kumasKartTeknikDetay(tekKaynak) : {};
        const terbiye = typeof kumasStokListeTerbiyeTur === 'function'
            ? kumasStokListeTerbiyeTur({ ...(bazKart || {}), ...(kaynakKart || {}), ...(p || {}), stok_kodu: kod })
            : String(kaynakKart?.terbiye || bazKart?.terbiye || p?.terbiye || '').trim();
        const kumasCinsi = String(
            bazKart?.kumas_cinsi || kaynakKart?.kumas_cinsi || p?.kumas_cinsi || ''
        ).trim();
        const desenAdi = String(bazKart?.desen_adi || kaynakKart?.desen_adi || p?.desen_adi || '').trim();
        const urunAlan = String(bazKart?.urun_adi || kaynakKart?.urun_adi || p?.urun_adi || '').trim();
        let urunAdi = desenAdi;
        const boyaliMi = typeof kumasVaryantNoBul === 'function'
            ? kumasVaryantNoBul(kod) > 0
            : /^(?:SM|NU)-?\d+-\d+$/i.test(kod);
        if (!urunAdi && urunAlan) {
            const ayniCins = kumasCinsi
                && urunAlan.toLocaleLowerCase('tr-TR') === kumasCinsi.toLocaleLowerCase('tr-TR');
            /* Boyalıda ürün=cins tekrarını gizle; hamda eski gibi göster */
            urunAdi = (ayniCins && boyaliMi) ? '' : urunAlan;
        }
        if (!urunAdi && typeof stokKartListeAdMetni === 'function' && bazKart) {
            const ad = String(stokKartListeAdMetni(bazKart, '') || '').trim();
            if (ad && (!boyaliMi || !kumasCinsi || ad.toLocaleLowerCase('tr-TR') !== kumasCinsi.toLocaleLowerCase('tr-TR'))) {
                urunAdi = ad;
            }
        }
        if (!urunAdi && !boyaliMi) urunAdi = desenAdi || urunAlan || kumasCinsi || kod;
        /* Ürün = kumaş cinsi (ör. ikisi de ARMÜR) boyalıda ürün kolonunu boş bırak; ayırt edici renk gösterilir */
        let renk = '';
        if (typeof kumasKartRenkOku === 'function' && kaynakKart) renk = String(kumasKartRenkOku(kaynakKart) || '').trim();
        if (!renk && typeof kumasStokListeRenkOku === 'function') {
            renk = String(kumasStokListeRenkOku({ ...(p || {}), ...(kaynakKart || {}), stok_kodu: kod }) || '').trim();
        }
        if (!renk) renk = String(p?.renk || p?.kumas_rengi || '').trim();
        if (!renk) {
            renk = muhasebeFisNotEtiket(p?.notlar, 'SEVK_RENK')
                || muhasebeFisNotEtiket(p?.notlar, 'RENK')
                || '';
        }
        let renkKodu = '';
        if (typeof kumasKartRenkKoduOku === 'function' && kaynakKart) {
            renkKodu = String(kumasKartRenkKoduOku(kaynakKart) || '').trim();
        }
        if (!renkKodu && typeof kumasStokListeRenkKoduOku === 'function') {
            renkKodu = String(kumasStokListeRenkKoduOku({ ...(p || {}), stok_kodu: kod }) || '').trim();
        }
        if (!renkKodu) renkKodu = muhasebeFisNotEtiket(p?.notlar, 'RENK_KOD') || muhasebeFisNotEtiket(p?.notlar, 'RKOD') || '';
        const renkGoster = [renk, renkKodu].filter((v, i, a) => v && a.indexOf(v) === i).join(' · ');
        const anaGrup = typeof kumasStokListeAnaGrup === 'function'
            ? kumasStokListeAnaGrup({ stok_kodu: kod, ana_grup: bazKart?.ana_grup || kart?.ana_grup, urun_grubu: bazKart?.urun_grubu || kart?.urun_grubu })
            : String(bazKart?.ana_grup || kart?.ana_grup || '').trim();
        return {
            depo_grup: 'KUMAS',
            stok_kodu: kod,
            urun_adi: urunAdi,
            urun_grubu: anaGrup,
            kumas_cinsi: kumasCinsi,
            terbiye: terbiye || '',
            tarak_eni: tek.tarak_eni || p?.tarak_eni || '',
            ham_en: (typeof kumasAlan === 'function' ? kumasAlan(tekKaynak, 'ham_en', '') : '') || String(bazKart?.ham_en || kaynakKart?.ham_en || p?.ham_en || '').trim(),
            atki_sikligi: tek.atki_sikligi || '',
            cozgu_sikligi: tek.cozgu_sikligi || '',
            atki_ipi: tek.atki_ipi || '',
            cozgu_ipi: tek.cozgu_ipi || '',
            renk: renkGoster,
            renk_kodu: renkKodu,
            ebat: '',
            adet, mt, kg
        };
    }

    let ad = String(p?.urun_adi || p?.kumas_cinsi || kod || '').trim();
    if ((!ad || ad === kod) && p?.notlar) {
        const mUrun = String(p.notlar).match(/\[SEVK_URUN:([^\]]+)\]/i);
        if (mUrun && mUrun[1].trim()) ad = mUrun[1].trim();
    }
    const notRenkSerbest = (() => {
        const tagged = muhasebeFisNotEtiket(p?.notlar, 'SEVK_RENK');
        if (tagged) return tagged;
        const m = String(p?.notlar || '').match(/(?:^|[·\s])Renk\s+([^·\[]+)/i);
        return m ? String(m[1] || '').trim() : '';
    })();
    let ebat = String(p?.ebat || p?.olcu || muhasebeFisNotEtiket(p?.notlar, 'SEVK_EBAT') || '').trim();
    let renk = String(p?.renk || p?.kumas_rengi || notRenkSerbest || '').trim();
    let urunGrubu = String(p?.urun_grubu || p?.ana_grup || muhasebeFisNotEtiket(p?.notlar, 'SEVK_GRUP') || '').trim();
    if (urunGrubu.toUpperCase() === 'MAMUL') urunGrubu = '';
    const fromSip = muhasebeFisSiparisKaleminden(p);
    if (fromSip) {
        const sk = fromSip.k;
        const sipAd = String(sk.ad || sk.urun_adi || '').trim();
        if (sipAd && (!ad || ad === kod)) ad = sipAd;
        if (!renk) {
            renk = String((typeof uaKalemRenkGetir === 'function' ? uaKalemRenkGetir(sk) : sk.renk) || '').trim();
        }
        if (!ebat) {
            ebat = String((typeof uaKalemEbatGetir === 'function' ? uaKalemEbatGetir(sk) : (sk.ebat || sk.olcu)) || '').trim();
        }
        if (!urunGrubu) {
            urunGrubu = String(sk.grup || sk.urun_grubu || sk.urun_grup || '').trim();
        }
        const gercekKod = String(sk.kod || sk.stok_kodu || '').trim();
        const kodUrunleAyni = kod && ad && kod.toLocaleLowerCase('tr-TR') === ad.toLocaleLowerCase('tr-TR');
        if (gercekKod && (!kod || kodUrunleAyni || /^SEVK-KODSUZ/i.test(kod))) {
            kod = gercekKod;
        }
    }
    if (!kart && ad) {
        const kartAd = muhasebeFisKartBul(ad);
        if (kartAd) kart = kartAd;
    }
    if (kart && typeof mamulTopluUrunDetayOlustur === 'function') {
        const d = mamulTopluUrunDetayOlustur(kart);
        const dAd = String(d.ad || '').trim();
        if (dAd && dAd !== '—') ad = dAd;
        const dEbat = String(d.ebat || '').trim();
        const dRenk = String(d.renk || '').trim();
        const dGrup = String(d.grup || '').trim();
        if (!ebat && dEbat && dEbat !== '—') ebat = dEbat;
        if (!renk && dRenk && dRenk !== '—') renk = dRenk;
        if (!urunGrubu && dGrup && dGrup !== '—') urunGrubu = dGrup;
        const kartKod = String(kart.stok_kodu || kart.desen_kodu || '').trim();
        const kodUrunleAyni = kod && ad && kod.toLocaleLowerCase('tr-TR') === ad.toLocaleLowerCase('tr-TR');
        if (kartKod && (!kod || kodUrunleAyni || /^SEVK-KODSUZ/i.test(kod))) {
            kod = kartKod;
        }
    }
    return {
        depo_grup: 'MAMUL',
        stok_kodu: kod || '—',
        urun_adi: ad || kod || '—',
        urun_grubu: urunGrubu,
        kumas_cinsi: '',
        terbiye: '',
        tarak_eni: '',
        ham_en: '',
        atki_sikligi: '',
        cozgu_sikligi: '',
        atki_ipi: '',
        cozgu_ipi: '',
        renk, ebat,
        adet, mt, kg
    };
}

function muhasebeFisHareketlerdenOlustur() {
    const stok = typeof dataCache !== 'undefined' ? (dataCache.kumas_stok || []) : [];
    const iplik = typeof dataCache !== 'undefined' ? (dataCache.iplik_stok || []) : [];
    const mamulGruplar = muhasebeFisHareketGruplarOlustur(stok.filter(muhasebeFisMamulCikisHareketiMi), 'MAMUL');
    const kumasGruplar = muhasebeFisHareketGruplarOlustur(stok.filter(muhasebeFisKumasCikisHareketiMi), 'KUMAS');
    const iplikGruplar = muhasebeFisHareketGruplarOlustur(iplik.filter(muhasebeFisIplikCikisHareketiMi), 'IPLIK');
    return [...mamulGruplar, ...kumasGruplar, ...iplikGruplar]
        .sort((a, b) => (Date.parse(b.created_at)||0) - (Date.parse(a.created_at)||0));
}

function muhasebeFisHareketGruplarOlustur(kayitlar, depoGrup) {
    const gruplar = new Map();
    (kayitlar || []).forEach(h => {
        const key = muhasebeFisHareketGrupAnahtari(h);
        if (!gruplar.has(key)) gruplar.set(key, []);
        gruplar.get(key).push(h);
    });
    const prefix = depoGrup === 'KUMAS' ? 'mf-hk-' : (depoGrup === 'IPLIK' ? 'mf-hi-' : 'mf-h-');
    const noHarf = depoGrup === 'KUMAS' ? 'K' : (depoGrup === 'IPLIK' ? 'I' : 'H');
    const out = [];
    gruplar.forEach(rows => {
        rows.sort((a, b) => (Date.parse(a.created_at)||0) - (Date.parse(b.created_at)||0));
        const first = rows[0];
        const ids   = rows.map(r => r.id).filter(id => id != null && id !== '');
        const kalemler = (() => {
            const raw = rows.map(r => muhasebeFisKalemFromPayload(r, depoGrup));
            const dolu = raw.filter(muhasebeFisKalemDoluMu);
            return dolu.length ? dolu : raw.filter(muhasebeFisKalemGosterilebilirMi);
        })();
        const yil   = first.created_at ? new Date(first.created_at).getFullYear() : new Date().getFullYear();
        const idParca = String(ids[0]||Date.parse(first.created_at)||Date.now()).replace(/[^a-zA-Z0-9]/g,'').slice(-10);
        const teslimTur  = typeof depoNotlarTeslimOku  === 'function' ? depoNotlarTeslimOku(first.notlar)  : '';
        const notlarSade = (() => {
            const temizle = (raw) => {
                let t = typeof depoNotlarStripMeta === 'function' ? depoNotlarStripMeta(raw || '') : String(raw || '');
                t = muhasebeFisNotlarCekiMetniTemizle(t);
                return t;
            };
            const uniq = [];
            rows.forEach(r => {
                const t = temizle(r.notlar);
                if (t && !uniq.includes(t)) uniq.push(t);
            });
            return uniq.join(' · ');
        })();
        // İrsaliye no: irsaliye_no kolonundan veya notlar içindeki [IRS:...] tag'inden oku
        const mfIrsOku = (h) => {
            if (String(h.irsaliye_no||'').trim()) return String(h.irsaliye_no).trim();
            const m = String(h.notlar||'').match(/\[IRS:([^\]]+)\]/i);
            return m ? m[1].trim() : '';
        };
        const irsaliyeNo = (rows.map(mfIrsOku).find(v => v)) || '';
        out.push(muhasebeFisNormalize({
            id:           prefix + idParca,
            fis_no:       `MF-${yil}-${noHarf}${idParca}`,
            created_at:   first.created_at || new Date().toISOString(),
            depo_grup:    depoGrup,
            musteri:      String(first.firma||'').toUpperCase(),
            teslim_alan:  muhasebeFisNotMetaOku(first.notlar,'TESLIM_ALAN'),
            teslim_tel:   muhasebeFisNotMetaOku(first.notlar,'TESLIM_TEL'),
            plaka:        muhasebeFisNotMetaOku(first.notlar,'PLAKA') || String(first.araci_firma||'').toUpperCase(),
            sofor:        muhasebeFisNotMetaOku(first.notlar,'SOFOR'),
            teslim_adres: muhasebeFisNotMetaOku(first.notlar,'TESLIM_ADRES'),
            irsaliye_no:  irsaliyeNo,
            notlar:       notlarSade,
            kalemler,
            hareket_ids:  ids,
            created_by:   first.updated_by || ''
        }));
    });
    return out.filter(Boolean);
}

/* ─── Entegrasyon: çıkış kaydı sonrası türetilmiş fişi bul (yinelenmez) ─── */

function muhasebeFisCikisSonrasiBul({ depoGrup, hareketIds, payloads }) {
    _muhasebeFisCache = muhasebeFisHareketlerdenOlustur();
    const grup = String(depoGrup || '').toUpperCase();
    const ids = new Set((hareketIds || []).filter(id => id != null && id !== '').map(String));
    if (ids.size) {
        const hit = (_muhasebeFisCache || []).find(f =>
            String(f.depo_grup || '').toUpperCase() === grup
            && (f.hareket_ids || []).some(id => ids.has(String(id)))
        );
        if (hit) return hit;
    }
    const firma = String(payloads?.[0]?.firma || '').trim().toUpperCase();
    if (!firma) return null;
    const now = Date.now();
    return (_muhasebeFisCache || []).find(f =>
        String(f.depo_grup || '').toUpperCase() === grup
        && String(f.musteri || '').toUpperCase() === firma
        && Math.abs((Date.parse(f.created_at) || 0) - now) < 180000
    ) || null;
}

async function muhasebeFisMamulCikisKaydet({ payloads, hareketIds }) {
    if (!payloads || !payloads.length) return null;
    const payloadCikis = payloads.some(p => muhasebeFisCikisTipiMi(p) === true);
    if (!payloadCikis && typeof movementType !== 'undefined' && movementType !== 'ÇIKIŞ') return null;
    return muhasebeFisCikisSonrasiBul({ depoGrup: 'MAMUL', hareketIds, payloads });
}

async function muhasebeFisKumasCikisKaydet({ payloads, hareketIds }) {
    if (!payloads || !payloads.length) return null;
    const payloadCikis = payloads.some(p => muhasebeFisCikisTipiMi(p) === true);
    if (!payloadCikis && typeof movementType !== 'undefined' && movementType !== 'ÇIKIŞ') return null;
    return muhasebeFisCikisSonrasiBul({ depoGrup: 'KUMAS', hareketIds, payloads });
}

async function muhasebeFisIplikCikisKaydet({ payloads, hareketIds }) {
    if (!payloads || !payloads.length) return null;
    const payloadCikis = payloads.some(p => muhasebeFisCikisTipiMi(p) === true);
    if (!payloadCikis && typeof movementType !== 'undefined' && movementType !== 'ÇIKIŞ') return null;
    return muhasebeFisCikisSonrasiBul({ depoGrup: 'IPLIK', hareketIds, payloads });
}

/* ─── Filtre ─── */

function muhasebeFisFiltreIlkYukle() {
    if (_muhasebeFisFiltre && _muhasebeFisFiltre._yuklu) return;
    try {
        const s = localStorage.getItem('erp_mf_filtre_v1');
        if (s) { const p = JSON.parse(s); if (p && typeof p === 'object') muhasebeFisFiltreYukle({ q:'', tip:'HEPSİ', bas:'', bit:'', ...p }); }
    } catch {}
    _muhasebeFisFiltre._yuklu = true;
}

function muhasebeFisFiltreKaydet() {
    try { localStorage.setItem('erp_mf_filtre_v1', JSON.stringify({ q: _muhasebeFisFiltre.q||'', tip: _muhasebeFisFiltre.tip||'HEPSİ', bas: _muhasebeFisFiltre.bas||'', bit: _muhasebeFisFiltre.bit||'' })); } catch {}
}

function muhasebeFisFiltreOku() { return _muhasebeFisFiltre || { q:'', tip:'HEPSİ', bas:'', bit:'' }; }

function muhasebeFisFiltreYukle(partial) {
    _muhasebeFisFiltre = { ..._muhasebeFisFiltre, ...partial };
    const valid = ['HEPSİ', 'MAMUL', 'KUMAS', 'IPLIK'];
    const tip = String(_muhasebeFisFiltre.tip || 'HEPSİ').toUpperCase();
    _muhasebeFisFiltre.tip = valid.includes(tip) ? tip : 'HEPSİ';
}

function muhasebeFisTarihGun(iso) {
    const d = iso ? new Date(iso) : null;
    if (!d || !Number.isFinite(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function muhasebeFisFiltreUygula(list, f) {
    f = f || {};
    const q = String(f.q || '').trim().toLowerCase();
    const tip = String(f.tip || 'HEPSİ').toUpperCase();
    return (list || []).filter(fis => {
        if (tip && tip !== 'HEPSİ' && String(fis.depo_grup || '').toUpperCase() !== tip) return false;
        if (f.bas || f.bit) {
            const gun = muhasebeFisTarihGun(fis.created_at);
            if (f.bas && gun && gun < f.bas) return false;
            if (f.bit && gun && gun > f.bit) return false;
            if ((f.bas || f.bit) && !gun) return false;
        }
        if (q) {
            const blob = [
                fis.fis_no, fis.musteri, fis.teslim_alan, fis.plaka, fis.sofor,
                fis.irsaliye_no, fis.depo_grup, fis.created_by, fis.notlar,
                muhasebeFisDepoGrupEtiket(fis.depo_grup),
                ...(fis.kalemler || []).map(k => [k.stok_kodu, k.urun_adi, k.urun_grubu, k.kumas_cinsi, k.terbiye, k.renk, k.ebat].join(' '))
            ].join(' ').toLowerCase();
            if (!blob.includes(q)) return false;
        }
        return true;
    });
}

function muhasebeFisListeLimitSifirla() {
    _muhasebeFisListeLimit = MUHASEBE_FIS_SAYFA_ADIM;
}

async function muhasebeFisDahaFazlaGoster() {
    const list = document.getElementById('main-list');
    if (!list) return;
    const filt = _muhasebeFisFiltre || { q:'', tip:'HEPSİ', bas:'', bit:'' };
    const filtered = muhasebeFisFiltreUygula(_muhasebeFisCache || [], filt);
    const nextLimit = _muhasebeFisListeLimit + MUHASEBE_FIS_SAYFA_ADIM;

    if (nextLimit <= filtered.length) {
        _muhasebeFisListeLimit = nextLimit;
        muhasebeFisListeGovdeYaz(list, _muhasebeFisCache || [], { scrollAnchor: 'mf-daha-fazla-wrap' });
        return;
    }

    if (_muhasebeFisStokKaynak?.tamMi) {
        _muhasebeFisListeLimit = filtered.length || nextLimit;
        muhasebeFisListeGovdeYaz(list, _muhasebeFisCache || [], { scrollAnchor: 'mf-daha-fazla-wrap' });
        return;
    }

    const btn = document.getElementById('mf-daha-fazla-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Yükleniyor…';
    }
    try {
        await muhasebeFisleriYukle({ eski: true });
        const filtered2 = muhasebeFisFiltreUygula(_muhasebeFisCache || [], filt);
        _muhasebeFisListeLimit = Math.min(nextLimit, filtered2.length || nextLimit);
    } catch (e) {
        console.warn('[MF] daha fazla yükleme:', e?.message || e);
    }
    muhasebeFisListeGovdeYaz(list, _muhasebeFisCache || [], { scrollAnchor: 'mf-daha-fazla-wrap' });
}

function muhasebeFisFiltreYenile() {
    const oku = (typeof stokListeFiltreOku === 'function')
        ? stokListeFiltreOku('mf-filtre', _muhasebeFisFiltre)
        : {
            q: document.getElementById('mf-filtre-ara')?.value || '',
            tip: document.getElementById('mf-filtre-tip')?.value || 'HEPSİ',
            bas: document.getElementById('mf-filtre-bas')?.value || '',
            bit: document.getElementById('mf-filtre-bit')?.value || ''
        };
    muhasebeFisFiltreYukle(oku);
    muhasebeFisFiltreKaydet();
    muhasebeFisListeLimitSifirla();
    muhasebeFisListeGovdeYaz(document.getElementById('main-list'), _muhasebeFisCache || []);
}

function muhasebeFisFiltreleriSifirla() {
    muhasebeFisFiltreYukle({ q:'', tip:'HEPSİ', bas:'', bit:'' });
    muhasebeFisFiltreKaydet();
    muhasebeFisListeLimitSifirla();
    muhasebeFisListeGovdeYaz(document.getElementById('main-list'), _muhasebeFisCache || []);
}

/* ─── Satır açma/kapama ─── */

function muhasebeFisSatirAcikMi(id) { return !!_muhasebeFisAcik[String(id||'')]; }

function muhasebeFisSatirToggle(id) {
    const key = String(id||'');
    if (!key) return;
    _muhasebeFisAcik[key] = !_muhasebeFisAcik[key];
    const acik = !!_muhasebeFisAcik[key];
    const el = document.getElementById('mf-detay-' + key);
    if (el) {
        let cell = el.tagName === 'TR' ? (el.querySelector('td') || null) : el;
        if (el.tagName === 'TR' && !cell) {
            cell = document.createElement('td');
            cell.colSpan = 7;
            el.appendChild(cell);
        }
        const hedef = cell || el;
        if (acik && !String(hedef.innerHTML || '').trim()) {
            const f = (_muhasebeFisCache||[]).find(x => String(x.id) === key);
            hedef.innerHTML = f ? muhasebeFisSatirDetay(f) : '';
        }
        el.style.display = acik ? '' : 'none';
        el.classList.toggle('is-open', acik);
    }
    const row = document.getElementById('mf-row-' + key);
    if (row) row.classList.toggle('is-open', acik);
    const chev = document.getElementById('mf-chev-' + key);
    if (chev) chev.textContent = acik ? '▾' : '▸';
}

function muhasebeFisGecmisToggle() {
    _muhasebeFisGecmisAcik = !_muhasebeFisGecmisAcik;
    const body = document.getElementById('mf-gecmis-body');
    const sec  = document.getElementById('mf-gecmis-section');
    if (body) body.style.display = _muhasebeFisGecmisAcik ? '' : 'none';
    if (sec)  sec.classList.toggle('is-open', _muhasebeFisGecmisAcik);
}

/* ─── Teslim formu ─── */

function muhasebeFisTeslimFormOku() {
    const g = id => document.getElementById(id)?.value?.trim() || '';
    return {
        musteri:      g('val-afirma').toUpperCase(),
        teslim_alan:  g('val-teslim-alan').toUpperCase(),
        teslim_tel:   g('val-teslim-tel'),
        plaka:        g('val-plaka').toUpperCase(),
        sofor:        g('val-sofor').toUpperCase(),
        teslim_adres: g('val-teslim-adres'),
        irsaliye_no:  g('val-irs-toplu') || g('val-irs'),
        notlar:       g('val-notlar-toplu') || g('val-notlar')
    };
}

/* ─── Çeki listesi overlay ─── */

async function muhasebeFisCekiGoster(fisId) {
    _muhasebeFisCekiAktif = fisId;
    if (!(_muhasebeFisCache||[]).length) await muhasebeFisleriYukle();
    const fis = muhasebeFisBul(fisId);
    if (!fis) { if (typeof erpToast === 'function') erpToast('Fiş bulunamadı', 'error'); return; }

    await muhasebeFisHareketleriTazele(fis);
    const hareketler = muhasebeFisHareketleriCoz(fis);

    // Kumaş: tüm çekiler tek listede; renk değişince araya renk adı + stok kodu satırı
    if (fis.depo_grup === 'KUMAS' && hareketler.length) {
        const allSatirlar = [];
        let topNo = 0;
        let sumMt = 0;
        let sumKg = 0;
        let renkSay = 0;
        let oncekiVar = false;
        for (const cekiH of hareketler) {
            const satirlar = muhasebeFisCekiSatirlariUret(cekiH);
            if (!satirlar || !satirlar.length) continue;
            const kalem = muhasebeFisKalemFromPayload(cekiH, 'KUMAS') || {};
            const renkAd = String(kalem.renk || '').trim();
            const stokKod = String(kalem.stok_kodu || cekiH.stok_kodu || '').trim();
            const etiket = [renkAd, stokKod].filter(Boolean).join(' · ')
                || String(kalem.urun_adi || kalem.kumas_cinsi || '').trim()
                || 'Kalem';
            if (oncekiVar) {
                allSatirlar.push({ tip: 'ayrac', etiket });
            }
            oncekiVar = true;
            renkSay++;
            satirlar.forEach(s => {
                const mt = parseFloat(s.mt) || 0;
                const kg = parseFloat(s.kg) || 0;
                sumMt += mt;
                sumKg += kg;
                topNo++;
                allSatirlar.push({ no: topNo, mt, kg });
            });
        }
        if (allSatirlar.length) {
            const mtYazi = sumMt > 1e-9
                ? sumMt.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' mt'
                : '';
            const kgYazi = sumKg > 1e-9
                ? sumKg.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' kg'
                : '';
            const urunSatir = [
                topNo + ' top',
                mtYazi,
                kgYazi,
                renkSay > 1 ? (renkSay + ' renk') : ''
            ].filter(Boolean).join(' · ');
            const meta = {
                musteri: fis.musteri,
                teslim: fis.teslim_alan || muhasebeFisNotMetaOku(hareketler[0]?.notlar, 'TESLIM_ALAN'),
                plaka: fis.plaka
                    || muhasebeFisNotMetaOku(hareketler[0]?.notlar, 'PLAKA')
                    || String(hareketler[0]?.araci_firma || '').toUpperCase(),
                urunSatir,
                baslik: urunSatir
            };
            if (typeof kumasCekiGosterSatirlar === 'function') {
                kumasCekiGosterSatirlar(allSatirlar, meta);
                return;
            }
            if (typeof kumasCekiGoster === 'function') {
                const tag = '[CEKI:' + allSatirlar
                    .filter(s => s && s.tip !== 'ayrac')
                    .map(s => `${s.no}:${s.mt || 0}:${s.kg || 0}`).join('|') + ']';
                kumasCekiGoster(tag, meta);
                return;
            }
        }
    }

    // Mamül / iplik veya çeki üretilemeyen kumaş → sevkiyat fişi overlay
    await muhasebeFisOverlayAc(fisId);
}

async function muhasebeFisOverlayAc(fisId) {
    _muhasebeFisCekiAktif = fisId;
    if (!(_muhasebeFisCache||[]).length) await muhasebeFisleriYukle();
    let fis = muhasebeFisBul(fisId);
    if (!fis) { if (typeof erpToast === 'function') erpToast('Fiş bulunamadı', 'error'); return; }

    await muhasebeFisHareketleriTazele(fis);
    fis = muhasebeFisBul(fisId) || fis;
    const esc = muhasebeFisEsc;
    const kalemler = muhasebeFisKalemleriCoz(fis);

    const tarih = fis.created_at ? new Date(fis.created_at).toLocaleDateString('tr-TR') : '';
    const durumYazi = 'Sevkiyat fişi';
    const tipYazi   = muhasebeFisDepoGrupEtiket(fis.depo_grup);
    const toplamYazi = muhasebeFisKalemToplamYazi(kalemler, fis.depo_grup);
    const teslimMeta = `Teslim alan: ${esc(fis.teslim_alan || '—')} · Plaka: ${esc(fis.plaka || '—')}`;
    const kalemTablo = muhasebeFisKalemTabloHtml(fis.depo_grup, kalemler, {
        toplamYazi,
        darkHead: false
    });

    const html = `<div id="mf-ceki-overlay" style="position:fixed;inset:0;z-index:12000;background:rgba(15,23,42,.6);display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;padding:0;overflow:hidden;backdrop-filter:blur(2px)">
        <style>@media print{#mf-ceki-overlay{position:static;background:none;padding:0;inset:auto}.mf-ceki-head,.mf-ceki-toolbar{display:none!important}#mf-ceki-overlay>div{box-shadow:none;border-radius:0;width:100%!important}}</style>
        <div class="mf-ceki-box kumas-ceki-box" style="width:min(${fis.depo_grup==='KUMAS'?'1100px':'860px'},100%);background:#fff;border-radius:12px;box-shadow:0 24px 64px rgba(0,0,0,.3);overflow:auto;margin:0 auto;flex:1;min-height:0">
            <div class="kumas-ceki-head mf-ceki-head">
                <div>
                    <h3>SEVKİYAT FİŞİ</h3>
                    <div class="kumas-ceki-meta">${esc(fis.fis_no)} · ${esc(fis.musteri)}</div>
                    <div class="kumas-ceki-musteri">${esc(tarih)} · ${esc(tipYazi)} · ${esc(durumYazi)}</div>
                    <div class="kumas-ceki-musteri">${teslimMeta}</div>
                </div>
                <div class="kumas-ceki-toolbar mf-ceki-toolbar">
                    <button type="button" class="mf-btn mf-btn--print" onclick="event.stopPropagation();muhasebeFisPdfYaz('${esc(fis.id)}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        <span>Yazdır</span>
                    </button>
                    <button type="button" class="mf-btn mf-btn--pdf" onclick="event.stopPropagation();muhasebeFisPdfIndir('${esc(fis.id)}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>
                        <span>PDF indir</span>
                    </button>
                    <button type="button" class="mf-btn mf-btn--danger-soft" onclick="muhasebeFisCekiKapat()">Kapat</button>
                </div>
            </div>
            <div style="padding:16px;overflow:auto;max-height:none">
                ${kalemler.length ? kalemTablo : '<div style="padding:32px;text-align:center;color:#94a3b8;font-size:13px">Bu fişe ait kalem bulunamadı. Stok hareketi senkronunu bekleyip tekrar deneyin.</div>'}
            </div>
        </div>
    </div>`;

    const old = document.getElementById('mf-ceki-overlay');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('mf-ceki-overlay').addEventListener('click', function(e) {
        if (e.target === this) muhasebeFisCekiKapat();
    });
}

function muhasebeFisCekiKapat() {
    const el = document.getElementById('mf-ceki-overlay');
    if (el) el.remove();
}


/* ─── Satır detay ─── */

function muhasebeFisKalemToplamYazi(kalemler, depoGrup) {
    const ks = kalemler || [];
    const g = String(depoGrup || '').toUpperCase();
    if (g === 'KUMAS') {
        const mt = ks.reduce((s, k) => s + (parseFloat(k.mt) || 0), 0);
        const kg = ks.reduce((s, k) => s + (parseFloat(k.kg) || 0), 0);
        const ad = ks.reduce((s, k) => s + (parseInt(k.adet, 10) || 0), 0);
        return [
            mt > 1e-9 ? mt.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' mt' : '',
            kg > 1e-9 ? kg.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' kg' : '',
            ad > 0 ? ad + ' top' : ''
        ].filter(Boolean).join(' · ') || '—';
    }
    if (g === 'IPLIK') {
        const kg = ks.reduce((s, k) => s + (parseFloat(k.kg) || 0), 0);
        const ad = ks.reduce((s, k) => s + (parseInt(k.adet, 10) || 0), 0);
        return [
            kg > 1e-9 ? kg.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' kg' : '',
            ad > 0 ? ad + ' çuval' : ''
        ].filter(Boolean).join(' · ') || '—';
    }
    const ad = ks.reduce((s, k) => s + (parseInt(k.adet, 10) || 0), 0);
    return ad > 0 ? ad + ' ad' : '—';
}

/** SM-0001 = ham, SM-0001-N = boyalı */
function muhasebeFisKumasKalemHamMi(k) {
    const kod = String(k?.stok_kodu || '').trim();
    if (!kod) return true;
    if (typeof kumasVaryantNoBul === 'function') return kumasVaryantNoBul(kod) === 0;
    return !/^(?:SM|NU)-?\d+-\d+$/i.test(kod);
}

function muhasebeFisKumasListeHamMi(kalemler) {
    const ks = (kalemler || []).filter(Boolean);
    if (!ks.length) return true;
    return ks.every(muhasebeFisKumasKalemHamMi);
}

function muhasebeFisKalemBasliklar(depoGrup, opts) {
    opts = opts || {};
    if (String(depoGrup || '').toUpperCase() === 'KUMAS') {
        if (opts.kumasHam) {
            return ['#', 'Stok kodu', 'Ürün', 'Kumaş cinsi', 'Terbiye', 'Tarak eni', 'Atkı sıklığı', 'Çözgü sıklığı', 'Atkı ipi', 'Çözgü ipi', 'Miktar'];
        }
        return ['#', 'Stok kodu', 'Ürün', 'Kumaş cinsi', 'Renk', 'Terbiye', 'Miktar'];
    }
    return ['#', 'Stok kodu', 'Ürün', 'Ürün grubu', 'Renk', 'Ebat', 'Miktar'];
}

function muhasebeFisKalemHucreler(k, i, depoGrup, opts) {
    opts = opts || {};
    const esc = muhasebeFisEsc;
    if (String(depoGrup || '').toUpperCase() === 'KUMAS') {
        if (opts.kumasHam) {
            return [
                String(i + 1),
                k.stok_kodu || '—',
                k.urun_adi || '—',
                k.kumas_cinsi || '—',
                k.terbiye || '—',
                k.tarak_eni || '—',
                k.atki_sikligi || '—',
                k.cozgu_sikligi || '—',
                k.atki_ipi || '—',
                k.cozgu_ipi || '—',
                muhasebeFisKalemMiktarYazi(k)
            ].map(esc);
        }
        return [
            String(i + 1),
            k.stok_kodu || '—',
            k.urun_adi || '—',
            k.kumas_cinsi || '—',
            k.renk || '—',
            k.terbiye || '—',
            muhasebeFisKalemMiktarYazi(k)
        ].map(esc);
    }
    return [
        String(i + 1),
        k.stok_kodu || '—',
        k.urun_adi || '—',
        k.urun_grubu || '—',
        k.renk || '—',
        k.ebat || '—',
        muhasebeFisKalemMiktarYazi(k)
    ].map(esc);
}

function muhasebeFisKalemTabloHtml(depoGrup, kalemler, opts) {
    opts = opts || {};
    const esc = muhasebeFisEsc;
    const ks = (kalemler || []).filter(muhasebeFisKalemGosterilebilirMi);
    const kumasHam = String(depoGrup || '').toUpperCase() === 'KUMAS' && muhasebeFisKumasListeHamMi(ks);
    const heads = muhasebeFisKalemBasliklar(depoGrup, { kumasHam });
    const last = heads.length - 1;
    const th = 'padding:6px 10px;text-align:left;font-size:10px;font-weight:600;color:var(--text3);border-bottom:1px solid var(--border)';
    const td = 'padding:6px 10px;font-size:12px;border-bottom:1px solid var(--border)';
    const headHtml = heads.map((h, i) =>
        `<th style="${th}${i === last ? ';text-align:right' : ''}${i === 0 ? ';width:28px' : ''}">${esc(h)}</th>`
    ).join('');
    const bodyHtml = ks.map((k, i) => {
        const cells = muhasebeFisKalemHucreler(k, i, depoGrup, { kumasHam });
        return `<tr>${cells.map((c, j) =>
            `<td data-th="${esc(heads[j] || '')}" style="${td}${j === 1 ? ';font-weight:600;font-family:DM Mono,monospace;font-size:11px' : ''}${j === last ? ';text-align:right;font-weight:600' : ''}">${c}</td>`
        ).join('')}</tr>`;
    }).join('');
    const toplam = opts.toplamYazi || muhasebeFisKalemToplamYazi(ks, depoGrup);
    return `<div class="mf-kalem-wrap"><table class="mf-kalem-tablo" style="width:100%;border-collapse:collapse">
        <thead><tr style="background:var(--surface)">${headHtml}</tr></thead>
        <tbody>${bodyHtml || `<tr><td colspan="${heads.length}" style="padding:12px;text-align:center;color:var(--text3)">Kalem yok</td></tr>`}
            ${ks.length ? `<tr style="background:var(--surface);font-weight:700">
                <td colspan="${last}" style="padding:8px 10px;font-size:11px;text-align:right;border-top:2px solid var(--border)">TOPLAM</td>
                <td style="padding:8px 10px;font-size:12px;text-align:right;border-top:2px solid var(--border)">${esc(toplam)}</td>
            </tr>` : ''}
        </tbody>
    </table></div>`;
}

function muhasebeFisSatirDetay(fis) {
    const ks = muhasebeFisKalemleriCoz(fis);
    const esc = muhasebeFisEsc;
    const id = esc(fis.id);
    const icoEye = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
    const icoPrint = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>';
    const icoPdf = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>';
    const icoCeki = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>';
    const cekiBtn = (fis.depo_grup === 'KUMAS' && (fis.hareket_ids || []).length)
        ? `<button type="button" class="mf-btn mf-btn--ceki" onclick="event.stopPropagation();muhasebeFisCekiGoster('${id}')">${icoCeki}<span>Çeki listesi</span></button>`
        : '';
    const meta = [
        fis.teslim_alan ? `Teslim: ${esc(fis.teslim_alan)}` : '',
        fis.plaka ? `Plaka: ${esc(fis.plaka)}` : '',
        fis.sofor ? `Şoför: ${esc(fis.sofor)}` : '',
        fis.teslim_tel ? `Tel: ${esc(fis.teslim_tel)}` : ''
    ].filter(Boolean).join(' · ');
    return `<div class="mf-fis-detay-panel">
        <div class="mf-fis-detay-acts" onclick="event.stopPropagation()">
            <button type="button" class="mf-btn mf-btn--view" onclick="muhasebeFisOverlayAc('${id}')">${icoEye}<span>Fiş görüntüle</span></button>
            <button type="button" class="mf-btn mf-btn--print" onclick="muhasebeFisPdfYaz('${id}')">${icoPrint}<span>Yazdır</span></button>
            <button type="button" class="mf-btn mf-btn--pdf" onclick="muhasebeFisPdfIndir('${id}')">${icoPdf}<span>PDF indir</span></button>
            ${cekiBtn}
        </div>
        ${meta ? `<div class="mf-fis-detay-meta">${meta}</div>` : ''}
        ${muhasebeFisKalemTabloHtml(fis.depo_grup, ks)}
        ${fis.notlar ? `<div class="mf-fis-detay-not">Not: ${esc(fis.notlar)}</div>` : ''}
    </div>`;
}

/* ─── Render ─── */

let _muhasebeFisRenderSeq = 0;

function muhasebeFisListeImza(ham) {
    const f = _muhasebeFisFiltre || {};
    const acik = Object.keys(_muhasebeFisAcik || {}).filter(k => _muhasebeFisAcik[k]).sort().join(',');
    const rows = (ham || []).slice(0, _muhasebeFisListeLimit).map(x => [
        x.id, x.durum, x.irsaliye_no || '', x.musteri || '',
        (x.hareket_ids || []).length, (x.kalemler || []).length
    ].join(':'));
    return [
        f.q || '', f.tip || '', f.bas || '', f.bit || '',
        _muhasebeFisGecmisAcik ? '1' : '0',
        String(_muhasebeFisListeLimit || MUHASEBE_FIS_SAYFA_ADIM),
        (ham || []).length,
        _muhasebeFisStokKaynak?.tamMi ? '1' : '0',
        acik,
        rows.join('|')
    ].join('~');
}

async function renderMuhasebeFisListe(opts) {
    opts = opts || {};
    const list = document.getElementById('main-list');
    if (!list) return;
    if (typeof appMode === 'string' && appMode && appMode !== 'MUHASEBE_FIS') return;
    muhasebeFisFiltreIlkYukle();

    const quiet = opts.quiet === true;
    const force = opts.force === true;
    if (opts.resetLimit !== false && force) muhasebeFisListeLimitSifirla();

    const stale = !_muhasebeFisCacheAt || (Date.now() - _muhasebeFisCacheAt) > MUHASEBE_FIS_CACHE_MS;
    const cacheHazir = Array.isArray(_muhasebeFisCache) && _muhasebeFisCache.length > 0;

    if (cacheHazir && !force && !stale) {
        muhasebeFisListeGovdeYaz(list, _muhasebeFisCache);
        return;
    }

    if (cacheHazir) {
        muhasebeFisListeGovdeYaz(list, _muhasebeFisCache);
    } else if (!quiet) {
        list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text3);font-size:11px">Sevkiyat fişleri yükleniyor…</div>';
    }

    if (quiet && !force) return;

    const seq = ++_muhasebeFisRenderSeq;
    const ham = await muhasebeFisleriYukle({ force: force && !cacheHazir });
    if (seq !== _muhasebeFisRenderSeq) return;
    if (typeof appMode === 'string' && appMode && appMode !== 'MUHASEBE_FIS') return;
    muhasebeFisListeGovdeYaz(list, ham);
}

function muhasebeFisListeGovdeYaz(list, ham, renderOpts) {
    renderOpts = renderOpts || {};
    if (!list) return;
    const filt = _muhasebeFisFiltre || { q:'', tip:'HEPSİ', bas:'', bit:'' };
    const filtered = muhasebeFisFiltreUygula(ham, filt);
    const limit = Math.max(MUHASEBE_FIS_SAYFA_ADIM, parseInt(_muhasebeFisListeLimit, 10) || MUHASEBE_FIS_SAYFA_ADIM);
    const visible = filtered.slice(0, limit);
    const toplam = (ham || []).length;
    const esc = muhasebeFisEsc;
    const dahaFazlaVar = limit < filtered.length || !_muhasebeFisStokKaynak?.tamMi;

    const filtHtml = typeof stokListeFiltreBarHtml === 'function' ? stokListeFiltreBarHtml({
        prefix: 'mf-filtre',
        filtre: { q: filt.q || '', tip: filt.tip || 'HEPSİ', bas: filt.bas || '', bit: filt.bit || '' },
        araPlaceholder: 'Fiş no, müşteri, teslim alan, plaka, ürün…',
        tipLabel: 'Tip',
        tipOptions: [
            { value: 'HEPSİ', label: 'Tümü' },
            { value: 'MAMUL', label: 'Mamül' },
            { value: 'KUMAS', label: 'Kumaş' },
            { value: 'IPLIK', label: 'İplik' }
        ],
        onChangeFn: 'muhasebeFisFiltreYenile',
        onResetFn: 'muhasebeFisFiltreleriSifirla',
        debounceKey: 'mf-filtre-ara'
    }) : '';

    const ozetHtml = `<div class="mf-ozet">
        <span class="mf-ozet-chip"><em>Yüklü fiş</em><b>${toplam}</b></span>
        <span class="mf-ozet-chip"><em>Filtre</em><b>${filtered.length}</b></span>
        <span class="mf-ozet-chip"><em>Gösterilen</em><b>${visible.length}</b></span>
    </div>`;

    const rowHtml = (fis) => {
        const id = esc(fis.id);
        const acik = muhasebeFisSatirAcikMi(fis.id);
        const kalemler = muhasebeFisKalemleriCoz(fis);
        const adetTop  = kalemler.reduce((s,k) => s+(parseInt(k.adet,10)||0), 0);
        const mtTop    = kalemler.reduce((s,k) => s+(parseFloat(k.mt)||0), 0);
        const miktarYazi = fis.depo_grup === 'KUMAS'
            ? (mtTop.toLocaleString('tr-TR',{maximumFractionDigits:2}) + ' mt')
            : (fis.depo_grup === 'IPLIK'
                ? muhasebeFisKalemToplamYazi(kalemler, 'IPLIK')
                : (adetTop + ' ad'));
        const k0 = kalemler[0];
        const kalemOzet = k0
            ? (fis.depo_grup === 'KUMAS'
                ? [k0.stok_kodu, k0.urun_adi || k0.kumas_cinsi, k0.renk].filter(Boolean).join(' · ')
                : (fis.depo_grup === 'IPLIK'
                    ? [k0.stok_kodu, k0.urun_adi].filter(Boolean).join(' · ')
                    : [k0.stok_kodu, k0.urun_adi, k0.renk].filter(Boolean).join(' · ')))
            : '';
        const ozetEk = kalemler.length > 1 ? ` · +${kalemler.length - 1}` : '';
        const tarih = fis.created_at
            ? new Date(fis.created_at).toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})
            : '—';
        const tip = muhasebeFisDepoGrupEtiket(fis.depo_grup);
        return `<tr class="mf-fis-tr${acik ? ' is-open' : ''}" id="mf-row-${id}" onclick="muhasebeFisSatirToggle('${id}')" title="Detayı aç/kapat">
            <td class="mf-fis-chev-td"><span class="mf-fis-chev" id="mf-chev-${id}">${acik ? '▾' : '▸'}</span></td>
            <td class="mf-fis-kod">${esc(fis.fis_no || '—')}</td>
            <td class="mf-fis-tarih">${esc(tarih)}</td>
            <td class="mf-fis-tip">${esc(tip)}</td>
            <td class="mf-fis-musteri">${esc(fis.musteri || '—')}</td>
            <td class="num mf-fis-miktar">${esc(miktarYazi)}</td>
            <td class="mf-fis-ozet">${esc(kalemOzet)}${ozetEk ? esc(ozetEk) : ''}</td>
        </tr>
        <tr class="mf-fis-detail${acik ? ' is-open' : ''}" id="mf-detay-${id}" style="display:${acik ? '' : 'none'}">
            <td colspan="7">${acik ? muhasebeFisSatirDetay(fis) : ''}</td>
        </tr>`;
    };

    const listeHtml = visible.length
        ? `<div class="ms-table-wrap mf-table-wrap"><table class="ms-table mf-table">
            <thead><tr>
                <th style="width:28px"></th>
                <th>Fiş no</th>
                <th>Tarih</th>
                <th>Tip</th>
                <th>Müşteri</th>
                <th class="num">Miktar</th>
                <th>Özet</th>
            </tr></thead>
            <tbody>${visible.map(rowHtml).join('')}</tbody>
        </table></div>`
        : (filtered.length
            ? '<div class="mf-empty">Gösterilecek fiş yok — daha fazla yüklemeyi deneyin.</div>'
            : '<div class="mf-empty">Sevkiyat fişi yok.</div>');

    const dahaFazlaHtml = (visible.length && dahaFazlaVar)
        ? `<div class="mf-daha-fazla-wrap" id="mf-daha-fazla-wrap">
            <button type="button" id="mf-daha-fazla-btn" class="mf-daha-fazla-btn" onclick="muhasebeFisDahaFazlaGoster()">
                10 fiş daha göster${limit < filtered.length ? ` (${filtered.length - limit} filtrede kaldı)` : ''}
            </button>
           </div>`
        : '';

    const html = `<div data-mf-root="1" class="mf-ekran">
        <div class="mf-ekran-baslik">Sevkiyat fişleri</div>
        ${filtHtml}${ozetHtml}
        ${listeHtml}${dahaFazlaHtml}
    </div>`;

    const sig = muhasebeFisListeImza(ham);
    const bizimListe = !!list.querySelector('[data-mf-root], .mf-fis-row, .mf-fis-tr, .mf-fis-section');
    if (bizimListe && list.dataset.mfSig === sig) return;
    const aktif = document.activeElement;
    const keepId = (aktif && String(aktif.id || '').startsWith('mf-filtre-')) ? aktif.id : '';
    const keepVal = keepId ? aktif.value : '';
    const keepSel = keepId && typeof aktif.selectionStart === 'number'
        ? [aktif.selectionStart, aktif.selectionEnd]
        : null;
    const sc = document.querySelector('.content-scroll');
    const top = sc ? sc.scrollTop : 0;
    list.innerHTML = html;
    list.dataset.mfSig = sig;
    if (renderOpts.scrollAnchor) {
        requestAnimationFrame(() => {
            const anchor = document.getElementById(renderOpts.scrollAnchor);
            if (anchor) anchor.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
    } else if (sc) sc.scrollTop = top;
    if (keepId) {
        const el = document.getElementById(keepId);
        if (el) {
            try {
                el.focus();
                if (keepVal != null) el.value = keepVal;
                if (keepSel && el.setSelectionRange) el.setSelectionRange(keepSel[0], keepSel[1]);
            } catch (e) {}
        }
    }
}

/* ─── PDF yazdır ─── */

function muhasebeFisYazdirBasliklar(depoGrup, opts) {
    opts = opts || {};
    const g = String(depoGrup || '').toUpperCase();
    if (g === 'KUMAS') {
        if (opts.kumasHam) {
            return ['Stok kodu', 'Ürün', 'Kumaş cinsi', 'Terbiye', 'Tarak eni', 'Ham en', 'Miktar'];
        }
        return ['Stok kodu', 'Ürün', 'Kumaş cinsi', 'Renk', 'Terbiye', 'Miktar'];
    }
    if (g === 'IPLIK') {
        return ['Stok kodu', 'Ürün', 'Marka', 'Renk', 'Miktar'];
    }
    return ['Stok kodu', 'Ürün', 'Ürün grubu', 'Renk', 'Ebat', 'Miktar'];
}

function muhasebeFisYazdirHucreler(k, depoGrup, opts) {
    opts = opts || {};
    const esc = muhasebeFisEsc;
    const g = String(depoGrup || '').toUpperCase();
    if (g === 'KUMAS') {
        if (opts.kumasHam) {
            return [
                k.stok_kodu || '—',
                k.urun_adi || '—',
                k.kumas_cinsi || '—',
                k.terbiye || '—',
                k.tarak_eni || '—',
                k.ham_en || '—',
                muhasebeFisKalemMiktarYazi(k)
            ].map(esc);
        }
        return [
            k.stok_kodu || '—',
            k.urun_adi || '—',
            k.kumas_cinsi || '—',
            k.renk || '—',
            k.terbiye || '—',
            muhasebeFisKalemMiktarYazi(k)
        ].map(esc);
    }
    if (g === 'IPLIK') {
        return [
            k.stok_kodu || '—',
            k.urun_adi || '—',
            k.urun_grubu || '—',
            k.renk || '—',
            muhasebeFisKalemMiktarYazi(k)
        ].map(esc);
    }
    return [
        k.stok_kodu || '—',
        k.urun_adi || '—',
        k.urun_grubu || '—',
        k.renk || '—',
        k.ebat || '—',
        muhasebeFisKalemMiktarYazi(k)
    ].map(esc);
}

async function muhasebeFisPdfYaz(id) {
    if (!(_muhasebeFisCache||[]).length) await muhasebeFisleriYukle();
    let fis = muhasebeFisBul(id);
    if (fis) await muhasebeFisHareketleriTazele(fis);
    const html = muhasebeFisBelgeHtml(id);
    if (!html) return;
    fis = muhasebeFisBul(id) || fis;
    if (typeof erpBelgeYazdir === 'function') erpBelgeYazdir(html, String((fis && fis.fis_no) || 'Fiş'));
    else if (typeof erpPrintHtml === 'function') erpPrintHtml(html, { title: String((fis && fis.fis_no) || 'Fiş') });
    else {
        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
        else if (typeof erpToast === 'function') erpToast('Popup engellendi — tarayıcıda popup iznini açın', 'warn');
    }
}

async function muhasebeFisPdfIndir(id) {
    if (!(_muhasebeFisCache||[]).length) await muhasebeFisleriYukle();
    let fis = muhasebeFisBul(id);
    if (fis) await muhasebeFisHareketleriTazele(fis);
    const html = muhasebeFisBelgeHtml(id);
    if (!html) return;
    fis = muhasebeFisBul(id) || fis;
    const ad = (fis && fis.fis_no)
        ? ('sevkiyat-fis-' + fis.fis_no)
        : ('sevkiyat-fis-' + (id || 'belge'));
    if (typeof erpBelgePdfIndir === 'function') {
        await erpBelgePdfIndir(html, ad);
        return;
    }
    await muhasebeFisPdfYaz(id);
}

function muhasebeFisBelgeHtml(id) {
    const fis = muhasebeFisBul(id);
    if (!fis) { if (typeof erpToast === 'function') erpToast('Fiş bulunamadı', 'error'); return ''; }
    const esc = muhasebeFisEsc;
    const kalemler = muhasebeFisKalemleriCoz(fis);
    const kumasHam = String(fis.depo_grup || '').toUpperCase() === 'KUMAS' && muhasebeFisKumasListeHamMi(kalemler);

    const heads = muhasebeFisYazdirBasliklar(fis.depo_grup, { kumasHam });
    const last = heads.length - 1;
    const kalemRows = kalemler.map(k => {
        const cells = muhasebeFisYazdirHucreler(k, fis.depo_grup, { kumasHam });
        return `<tr>${cells.map((c, j) => `<td${j===last?' class="r"':''}${j===0?' class="kod"':''}>${c}</td>`).join('')}</tr>`;
    }).join('');
    const topYazi = muhasebeFisKalemToplamYazi(kalemler, fis.depo_grup);
    const tarih = fis.created_at
        ? new Date(fis.created_at).toLocaleString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
        : new Date().toLocaleString('tr-TR');
    const depoAd = muhasebeFisDepoGrupEtiket(fis.depo_grup) + ' depo';
    const metaSatir = [
        fis.musteri ? `<div class="meta-row"><span>Müşteri</span><b>${esc(fis.musteri)}</b></div>` : '',
        `<div class="meta-row"><span>Teslim alan</span><b>${esc(fis.teslim_alan || '—')}</b></div>`,
        fis.teslim_tel ? `<div class="meta-row"><span>Telefon</span><b>${esc(fis.teslim_tel)}</b></div>` : '',
        `<div class="meta-row"><span>Plaka</span><b>${esc(fis.plaka || '—')}</b></div>`,
        fis.sofor ? `<div class="meta-row"><span>Şoför</span><b>${esc(fis.sofor)}</b></div>` : '',
        fis.teslim_adres ? `<div class="meta-row meta-row--full"><span>Teslim adresi</span><b>${esc(fis.teslim_adres)}</b></div>` : '',
        fis.notlar ? `<div class="meta-row meta-row--full"><span>Not</span><b>${esc(fis.notlar)}</b></div>` : ''
    ].filter(Boolean).join('');

    // PDF için px ölçü (mm + html2canvas kaydırma/boş sayfa üretebiliyor)
    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>${esc(fis.fis_no || 'Sevkiyat Fişi')}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#111;font-size:12px}
    .page{width:794px;max-width:794px;margin:0;padding:36px 40px;background:#fff;color:#111}
    .antet{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:10px}
    .antet-sol{display:flex;gap:12px;align-items:flex-start;min-width:0}
    .unvan{font-size:15px;font-weight:800;letter-spacing:-0.2px;line-height:1.2;text-transform:uppercase}
    .kimlik{margin-top:4px;font-size:10px;color:#333;line-height:1.45}
    .antet-sag{text-align:right;flex-shrink:0}
    .belge{font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    .belge-no{margin-top:4px;font-size:12px;font-family:'Courier New',monospace;font-weight:700}
    .belge-meta{margin-top:3px;font-size:10px;color:#444}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:4px 18px;margin-bottom:12px;font-size:11px}
    .meta-row{display:flex;gap:8px;align-items:baseline}
    .meta-row span{color:#666;min-width:88px;font-size:9px;text-transform:uppercase;letter-spacing:.04em}
    .meta-row--full{grid-column:1/-1}
    table{width:100%;border-collapse:collapse}
    thead th{padding:7px 8px;font-size:9px;font-weight:700;text-align:left;border-bottom:2px solid #111;white-space:nowrap}
    thead th.r{text-align:right}
    tbody td{padding:6px 8px;font-size:11px;border-bottom:1px solid #ddd;vertical-align:top}
    tbody td.r{text-align:right;font-family:'Courier New',monospace;font-weight:600;white-space:nowrap}
    tbody td.kod{font-family:'Courier New',monospace;font-size:10px;white-space:nowrap}
    tfoot td{padding:8px 10px;font-size:12px;font-weight:700;border-top:2px solid #111}
    tfoot td.r{text-align:right;font-family:'Courier New',monospace}
    .imza{margin-top:22px;display:flex;justify-content:space-between;gap:16px}
    .imza div{width:32%;text-align:center}
    .imza i{display:block;border-top:1px solid #999;margin:28px auto 6px;width:85%;font-style:normal}
    .imza span{font-size:9px;color:#555;text-transform:uppercase;letter-spacing:.06em}
    .dip{margin-top:14px;font-size:8px;color:#777;text-align:center}
    @page{size:A4;margin:8mm}
    @media print{.no-print{display:none!important}}
    </style></head><body>
    <div class="page">
        <div class="antet">
            <div class="antet-sol">
                <div>
                    <div class="unvan">Simteks Tekstil San. ve Tic. Ltd. Şti.</div>
                    <div class="kimlik">
                        Hacıeyüplü Mah. 3211 Sk. No:2 Merkezefendi / Denizli<br>
                        Tel: 0258 371 67 96 · info@simtekstekstil.com.tr<br>
                        Gökpınar V.D. · VKN 7700062956 · www.simtekstekstil.com.tr
                    </div>
                </div>
            </div>
            <div class="antet-sag">
                <div class="belge">Sevkiyat Fişi</div>
                <div class="belge-no">${esc(fis.fis_no || '—')}</div>
                <div class="belge-meta">${esc(tarih)}<br>${esc(depoAd)}</div>
            </div>
        </div>
        ${metaSatir ? `<div class="meta">${metaSatir}</div>` : ''}
        <table>
            <thead><tr>${heads.map((h,i) => `<th${i===last?' class="r"':''}>${esc(h)}</th>`).join('')}</tr></thead>
            <tbody>${kalemRows||`<tr><td colspan="${heads.length}" style="padding:16px;text-align:center;color:#888">Kalem bulunamadı</td></tr>`}</tbody>
            <tfoot><tr><td colspan="${last}">TOPLAM</td><td class="r">${esc(topYazi||'—')}</td></tr></tfoot>
        </table>
        <div class="imza">
            <div><i></i><span>Teslim Eden</span></div>
            <div><i>${esc(fis.teslim_alan || '')}</i><span>Teslim Alan</span></div>
            <div><i>${esc(fis.plaka || '')}</i><span>Plaka / Onay</span></div>
        </div>
        <div class="dip">Bu belge Simteks Tekstil San. ve Tic. Ltd. Şti. sevkiyat fişidir.</div>
    </div>
    </body></html>`;
    return html;
}

/* ─── Window exports ─── */
window.muhasebeFisFiltreOku          = muhasebeFisFiltreOku;
window.muhasebeFisFiltreIlkYukle     = muhasebeFisFiltreIlkYukle;
window.muhasebeFisMamulCikisKaydet   = muhasebeFisMamulCikisKaydet;
window.muhasebeFisKumasCikisKaydet   = muhasebeFisKumasCikisKaydet;
window.muhasebeFisIplikCikisKaydet   = muhasebeFisIplikCikisKaydet;
window.muhasebeFisCikisSonrasiBul    = muhasebeFisCikisSonrasiBul;
window.muhasebeFisDepoGrupEtiket     = muhasebeFisDepoGrupEtiket;
window.muhasebeFisIrsaliyeIsaretle   = muhasebeFisIrsaliyeIsaretle;
window.muhasebeFisBeklemeyeAl        = muhasebeFisBeklemeyeAl;
window.muhasebeFisSatirToggle        = muhasebeFisSatirToggle;
window.muhasebeFisGecmisToggle       = muhasebeFisGecmisToggle;
window.muhasebeFisFiltreYenile       = muhasebeFisFiltreYenile;
window.muhasebeFisFiltreleriSifirla  = muhasebeFisFiltreleriSifirla;
window.muhasebeFisDahaFazlaGoster     = muhasebeFisDahaFazlaGoster;
window.muhasebeFisListeLimitSifirla   = muhasebeFisListeLimitSifirla;
window.muhasebeFisCekiGoster         = muhasebeFisCekiGoster;
window.muhasebeFisOverlayAc          = muhasebeFisOverlayAc;
window.muhasebeFisCekiKapat          = muhasebeFisCekiKapat;
window.muhasebeFisPdfYaz             = muhasebeFisPdfYaz;
window.muhasebeFisPdfIndir           = muhasebeFisPdfIndir;
window.renderMuhasebeFisListe        = renderMuhasebeFisListe;
window.muhasebeFisBul                = muhasebeFisBul;
window.muhasebeFisKalemFromPayload   = muhasebeFisKalemFromPayload;
window.muhasebeFisMamulCikisHareketiMi = muhasebeFisMamulCikisHareketiMi;
window.muhasebeFisKumasCikisHareketiMi = muhasebeFisKumasCikisHareketiMi;
window.muhasebeFisMuhasebeDisiHareketMi = muhasebeFisMuhasebeDisiHareketMi;
