/**
 * Muhasebe teslim fişi modülü.
 * Fişler kumas_stok çıkış hareketlerinden otomatik üretilir.
 * Durum yönetimi: kumas_stok.irsaliye_no alanı üzerinden — Supabase'de saklanır,
 * tüm bilgisayarlarda senkronize çalışır.
 * irsaliye_no dolu → IRSALIYE_KESILDI | boş → BEKLEMEDE
 */

/* ─── Durum değişkenleri ─── */
let _muhasebeFisCache    = [];
let _muhasebeFisFiltre   = { q: '', tip: 'HEPSİ', bas: '', bit: '' };
let _muhasebeFisAcik     = {};
let _muhasebeFisGecmisAcik = false;
let _muhasebeFisCekiAktif  = null;

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

/* ─── Supabase: kumas_stok taze çekme ─── */

async function muhasebeFisKumasStokTazele() {
    if (typeof sb === 'undefined' || !sb) return;
    try {
        if (typeof erpSyncFetchTable === 'function') {
            const out = await erpSyncFetchTable('kumas_stok', true, {});
            if (out?.error) console.warn('[MF] kumas_stok yükleme hatası:', out.error.message || out.error);
            const gelen = out?.data;
            if (!Array.isArray(gelen) || !gelen.length || typeof dataCache === 'undefined') return;
            if (out?.truncated && typeof erpSyncUnionById === 'function') {
                dataCache.kumas_stok = erpSyncUnionById(gelen, dataCache.kumas_stok);
            } else if (typeof erpDataCacheMergeTable === 'function') {
                dataCache.kumas_stok = erpDataCacheMergeTable('kumas_stok', gelen, dataCache.kumas_stok);
            } else {
                dataCache.kumas_stok = gelen;
            }
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
    if (opts.fromCache !== true) await muhasebeFisKumasStokTazele();
    _muhasebeFisCache = muhasebeFisHareketlerdenOlustur();
    return _muhasebeFisCache;
}

/* ─── İrsaliye işaretleme ─── */

async function muhasebeFisIrsaliyeIsaretle(id) {
    const fis = muhasebeFisBul(id);
    if (!fis) return;
    const mevcut = fis.irsaliye_no || '';
    let no = typeof erpAskPrompt === 'function'
        ? await erpAskPrompt('Kesilen irsaliye numarasını girin:', mevcut)
        : prompt('Kesilen irsaliye numarasını girin:', mevcut);
    if (no === null) return;
    no = String(no).trim();
    if (!no) { if (typeof erpToast === 'function') erpToast('İrsaliye numarası boş olamaz.', 'warn'); return; }

    // kumas_stok'taki ilgili hareketleri güncelle — Supabase'e yaz
    const hIds = (fis.hareket_ids || []).filter(Boolean);
    if (!hIds.length) { if (typeof erpToast === 'function') erpToast('Bu fişe bağlı hareket bulunamadı.', 'error'); return; }
    if (typeof sb === 'undefined' || !sb) { if (typeof erpToast === 'function') erpToast('Supabase bağlantısı yok!', 'error'); return; }

    const user = (typeof erpCurrentUser !== 'undefined' && erpCurrentUser)
        ? String(erpCurrentUser.display_name || erpCurrentUser.username || 'Sistem').trim() : 'Sistem';

    // kumas_stok'ta irsaliye_no kolonu olmayabilir — notlar alanına [IRS:...] tag yaz
    let hatali = 0;
    let sonHata = '';
    for (const hid of hIds) {
        // Mevcut notlar'ı oku
        const satir = (typeof dataCache !== 'undefined' ? (dataCache.kumas_stok||[]) : []).find(h => String(h.id) === String(hid));
        const eskiNotlar = String(satir?.notlar || '');
        // Eski [IRS:...] tag varsa çıkar, yeni ekle
        const yeniNotlar = eskiNotlar.replace(/\[IRS:[^\]]*\]/gi, '').trim() + ` [IRS:${no}]`;

        const guncelleme = { notlar: yeniNotlar, updated_by: user };
        // irsaliye_no kolonu varsa onu da güncelle (varsa çalışır, yoksa notlar yeterli)
        const { error } = await sb.from('kumas_stok').update(guncelleme).eq('id', hid);
        if (error) {
            console.error('[MF] güncelleme hatası:', hid, error.message);
            sonHata = error.message;
            hatali++;
        } else {
            // dataCache'i güncelle
            if (satir) { satir.notlar = yeniNotlar; satir.irsaliye_no = no; }
        }
    }
    if (hatali) {
        if (typeof erpToast === 'function') erpToast(`Kayıt güncellenemedi: ${sonHata}`, 'error', 10000);
        return;
    }

    if (typeof erpToast === 'function') erpToast(`İrsaliye kesildi: ${no}`, 'success', 4000);
    renderMuhasebeFisListe();
}

async function muhasebeFisBeklemeyeAl(id) {
    const fis = muhasebeFisBul(id);
    if (!fis) return;
    const hIds = (fis.hareket_ids || []).filter(Boolean);
    if (typeof sb !== 'undefined' && sb) {
        const user = (typeof erpCurrentUser !== 'undefined' && erpCurrentUser)
            ? String(erpCurrentUser.display_name || erpCurrentUser.username || 'Sistem').trim() : 'Sistem';
        for (const hid of hIds) {
            const satir = (typeof dataCache !== 'undefined' ? (dataCache.kumas_stok||[]) : []).find(h => String(h.id) === String(hid));
            const yeniNotlar = String(satir?.notlar || '').replace(/\[IRS:[^\]]*\]/gi, '').trim();
            await sb.from('kumas_stok').update({ notlar: yeniNotlar, updated_by: user }).eq('id', hid);
            if (satir) { satir.notlar = yeniNotlar; satir.irsaliye_no = ''; }
        }
    }
    renderMuhasebeFisListe();
}

/* ─── Hareketlerden fiş üretme ─── */

function muhasebeFisCikisTipiMi(h) {
    const tip = String(h?.islem_turu || '').toUpperCase()
        .replace(/İ/g,'I').replace(/Ç/g,'C').replace(/Ş/g,'S');
    if (tip.includes('CIKIS')) return true;
    if (tip.includes('GIRIS')) return false;
    return null;
}

function muhasebeFisMamulCikisHareketiMi(h) {
    if (!h) return false;
    if (typeof kumasStokHareketiMamulDepoMu === 'function' && !kumasStokHareketiMamulDepoMu(h)) return false;
    const tip = muhasebeFisCikisTipiMi(h);
    if (tip === true) return true;
    if (tip === false) return false;
    return (parseInt(h.cuval_sayisi, 10) || 0) < 0;
}

function muhasebeFisKumasCikisHareketiMi(h) {
    if (!h) return false;
    if (typeof kumasStokHareketiMamulDepoMu === 'function' && kumasStokHareketiMamulDepoMu(h)) return false;
    const kb = String(h.kaynak_birim || '').toUpperCase();
    const kumasKb = kb === 'DEPO_HAREKET_KUMAS' || kb.startsWith('DEPO_HAREKET_KUMAS')
        || kb === 'DEPO_HAREKET_HAM_KUMAS' || kb === 'DEPO_HAREKET_MAMUL_KUMAS'
        || kb === 'HAM_KUMAS' || kb === 'MAMUL_KUMAS' || kb === 'KUMAS';
    if (!kumasKb) return false;
    const notlar = String(h.notlar || '').toUpperCase();
    if (notlar.includes('DOKUMA_SEVKE_HAZIR') || notlar.includes('DOKUMA_DEPO')) return false;
    if (!String(h.firma || '').trim()) return false;
    const tip = muhasebeFisCikisTipiMi(h);
    if (tip === true) return true;
    if (tip === false) return false;
    return (parseFloat(h.miktar_mt) || 0) < 0 || (parseFloat(h.miktar_kg) || 0) < 0;
}

function muhasebeFisNotMetaOku(s, key) {
    const m = String(s || '').match(new RegExp('\\[' + key + ':([^\\]]+)\\]', 'i'));
    return m ? m[1].trim() : '';
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
    return (typeof dataCache !== 'undefined' ? (dataCache.kumas_kutuphanesi || []) : []).find(x =>
        String(x.stok_kodu || '').trim().toUpperCase() === u ||
        String(x.desen_kodu || '').trim().toUpperCase() === u
    ) || null;
}

function muhasebeFisKalemFromPayload(p, depoGrup) {
    const kod  = String(p?.stok_kodu || '').trim();
    const adet = Math.abs(parseInt(p?.cuval_sayisi, 10) || 0);
    const mt   = Math.abs(parseFloat(p?.miktar_mt) || 0);
    const kg   = Math.abs(parseFloat(p?.miktar_kg) || 0);
    const grup = String(depoGrup || '').toUpperCase() === 'KUMAS' ? 'KUMAS' : 'MAMUL';
    const kart = muhasebeFisKartBul(kod);

    if (grup === 'KUMAS') {
        const tek = typeof kumasKartTeknikDetay === 'function' ? kumasKartTeknikDetay(kart || p) : {};
        const terbiye = typeof kumasStokListeTerbiyeTur === 'function'
            ? kumasStokListeTerbiyeTur({ ...(kart || {}), ...(p || {}), stok_kodu: kod })
            : String(kart?.terbiye || p?.terbiye || '').trim();
        const urunAdi = (typeof stokKartListeAdMetni === 'function' && kart)
            ? stokKartListeAdMetni(kart, kod)
            : (kart?.urun_adi || kart?.desen_adi || p?.urun_adi || p?.kumas_cinsi || kod);
        const anaGrup = typeof kumasStokListeAnaGrup === 'function'
            ? kumasStokListeAnaGrup({ stok_kodu: kod, ana_grup: kart?.ana_grup, urun_grubu: kart?.urun_grubu })
            : String(kart?.ana_grup || '').trim();
        return {
            depo_grup: 'KUMAS',
            stok_kodu: kod,
            urun_adi: urunAdi,
            urun_grubu: anaGrup,
            kumas_cinsi: String(kart?.kumas_cinsi || p?.kumas_cinsi || '').trim(),
            terbiye: terbiye || '',
            tarak_eni: tek.tarak_eni || p?.tarak_eni || '',
            ham_en: (typeof kumasAlan === 'function' ? kumasAlan(kart || p, 'ham_en', '') : '') || String(kart?.ham_en || p?.ham_en || '').trim(),
            atki_sikligi: tek.atki_sikligi || '',
            cozgu_sikligi: tek.cozgu_sikligi || '',
            atki_ipi: tek.atki_ipi || '',
            cozgu_ipi: tek.cozgu_ipi || '',
            renk: '',
            ebat: '',
            adet, mt, kg
        };
    }

    let ad = p?.urun_adi || p?.kumas_cinsi || kod;
    let ebat = '', renk = String(p?.renk || '').trim(), urunGrubu = '';
    if (kart && typeof mamulTopluUrunDetayOlustur === 'function') {
        const d = mamulTopluUrunDetayOlustur(kart);
        if (d.ad && d.ad !== '—') ad = d.ad;
        ebat = d.ebat || '';
        renk = d.renk || renk;
        urunGrubu = d.grup || '';
    }
    return {
        depo_grup: 'MAMUL',
        stok_kodu: kod,
        urun_adi: ad,
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
    const mamulGruplar = muhasebeFisHareketGruplarOlustur(stok.filter(muhasebeFisMamulCikisHareketiMi), 'MAMUL');
    const kumasGruplar = muhasebeFisHareketGruplarOlustur(stok.filter(muhasebeFisKumasCikisHareketiMi), 'KUMAS');
    return [...mamulGruplar, ...kumasGruplar]
        .sort((a, b) => (Date.parse(b.created_at)||0) - (Date.parse(a.created_at)||0));
}

function muhasebeFisHareketGruplarOlustur(kayitlar, depoGrup) {
    const gruplar = new Map();
    (kayitlar || []).forEach(h => {
        const key = muhasebeFisHareketGrupAnahtari(h);
        if (!gruplar.has(key)) gruplar.set(key, []);
        gruplar.get(key).push(h);
    });
    const prefix = depoGrup === 'KUMAS' ? 'mf-hk-' : 'mf-h-';
    const noHarf = depoGrup === 'KUMAS' ? 'K' : 'H';
    const out = [];
    gruplar.forEach(rows => {
        rows.sort((a, b) => (Date.parse(a.created_at)||0) - (Date.parse(b.created_at)||0));
        const first = rows[0];
        const ids   = rows.map(r => r.id).filter(id => id != null && id !== '');
        const kalemler = rows.map(r => muhasebeFisKalemFromPayload(r, depoGrup)).filter(muhasebeFisKalemDoluMu);
        const yil   = first.created_at ? new Date(first.created_at).getFullYear() : new Date().getFullYear();
        const idParca = String(ids[0]||Date.parse(first.created_at)||Date.now()).replace(/[^a-zA-Z0-9]/g,'').slice(-10);
        const teslimTur  = typeof depoNotlarTeslimOku  === 'function' ? depoNotlarTeslimOku(first.notlar)  : '';
        const notlarSade = typeof depoNotlarStripMeta  === 'function' ? depoNotlarStripMeta(first.notlar||'') : String(first.notlar||'');
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

/* ─── Entegrasyon: mamül / kumaş çıkış kaydederken fiş oluşturma ─── */

async function muhasebeFisMamulCikisKaydet({ payloads, hareketIds }) {
    if (typeof movementType !== 'undefined' && movementType !== 'ÇIKIŞ') return null;
    if (!payloads || !payloads.length) return null;
    // Fişler artık otomatik üretiliyor; burada sadece cache'i yenile
    return null;
}

async function muhasebeFisKumasCikisKaydet({ payloads, hareketIds }) {
    if (typeof movementType !== 'undefined' && movementType !== 'ÇIKIŞ') return null;
    if (!payloads || !payloads.length) return null;
    return null;
}

/* ─── Filtre ─── */

function muhasebeFisFiltreIlkYukle() {
    if (_muhasebeFisFiltre && _muhasebeFisFiltre._yuklu) return;
    try {
        const s = localStorage.getItem('erp_mf_filtre_v1');
        if (s) { const p = JSON.parse(s); if (p && typeof p === 'object') _muhasebeFisFiltre = { q:'', tip:'HEPSİ', bas:'', bit:'', ...p }; }
    } catch {}
    _muhasebeFisFiltre._yuklu = true;
}

function muhasebeFisFiltreKaydet() {
    try { localStorage.setItem('erp_mf_filtre_v1', JSON.stringify({ q: _muhasebeFisFiltre.q||'', tip: _muhasebeFisFiltre.tip||'HEPSİ', bas: _muhasebeFisFiltre.bas||'', bit: _muhasebeFisFiltre.bit||'' })); } catch {}
}

function muhasebeFisFiltreOku() { return _muhasebeFisFiltre || { q:'', tip:'HEPSİ', bas:'', bit:'' }; }

function muhasebeFisFiltreYukle(partial) {
    _muhasebeFisFiltre = { ..._muhasebeFisFiltre, ...partial };
    const valid = ['HEPSİ','BEKLEMEDE','IRSALIYE_KESILDI'];
    if (!valid.includes(_muhasebeFisFiltre.tip)) _muhasebeFisFiltre.tip = 'HEPSİ';
}

function muhasebeFisFiltreUygula(list, f) {
    return (list||[]).filter(fis => {
        if (f.tip && f.tip !== 'HEPSİ' && fis.durum !== f.tip) return false;
        if (f.bas || f.bit) {
            const t = Date.parse(fis.created_at)||0;
            if (f.bas && t < Date.parse(f.bas)) return false;
            if (f.bit && t > Date.parse(f.bit) + 86399999) return false;
        }
        if (f.q) {
            const blob = [fis.fis_no, fis.musteri, fis.teslim_alan, fis.plaka, fis.irsaliye_no, fis.depo_grup,
                ...(fis.kalemler||[]).map(k => [k.stok_kodu, k.urun_adi, k.urun_grubu, k.kumas_cinsi, k.terbiye, k.renk, k.ebat].join(' '))].join(' ').toLowerCase();
            if (!blob.includes(f.q.toLowerCase())) return false;
        }
        return true;
    });
}

function muhasebeFisFiltreYenile() {
    const partial = {};
    const el = document.getElementById('mf-filtre-tip');
    const ara = document.getElementById('mf-filtre-ara');
    const bas = document.getElementById('mf-filtre-bas');
    const bit = document.getElementById('mf-filtre-bit');
    if (el)  partial.tip = el.value;
    if (ara) partial.q   = ara.value;
    if (bas) partial.bas = bas.value;
    if (bit) partial.bit = bit.value;
    muhasebeFisFiltreYukle(partial);
    muhasebeFisFiltreKaydet();
    muhasebeFisListeGovdeYaz(document.getElementById('main-list'), _muhasebeFisCache || []);
}

function muhasebeFisFiltreleriSifirla() {
    muhasebeFisFiltreYukle({ q:'', tip:'HEPSİ', bas:'', bit:'' });
    muhasebeFisFiltreKaydet();
    muhasebeFisListeGovdeYaz(document.getElementById('main-list'), _muhasebeFisCache || []);
}

/* ─── Satır açma/kapama ─── */

function muhasebeFisSatirAcikMi(id) { return !!_muhasebeFisAcik[String(id||'')]; }

function muhasebeFisSatirToggle(id) {
    const key = String(id||'');
    if (!key) return;
    _muhasebeFisAcik[key] = !_muhasebeFisAcik[key];
    const el = document.getElementById('mf-detay-' + key);
    if (el) {
        if (_muhasebeFisAcik[key] && !el.innerHTML.trim()) {
            const f = (_muhasebeFisCache||[]).find(x => String(x.id) === key);
            el.innerHTML = f ? muhasebeFisSatirDetay(f) : '';
        }
        el.style.display = _muhasebeFisAcik[key] ? 'block' : 'none';
    }
    const chev = document.getElementById('mf-chev-' + key);
    if (chev) chev.textContent = _muhasebeFisAcik[key] ? '▾' : '›';
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

    const esc = muhasebeFisEsc;
    const hIds = (fis.hareket_ids||[]).filter(Boolean).map(String);

    // Kumaş fişi: Supabase'den notlar alanını taze çek, [CEKI:] tag ara
    if (fis.depo_grup === 'KUMAS' && hIds.length && typeof sb !== 'undefined' && sb) {
        try {
            const { data: taze } = await sb.from('kumas_stok').select('id,stok_kodu,kumas_cinsi,notlar').in('id', hIds);
            if (taze && taze.length) {
                // Cache'i güncelle
                const kumasStokCache = typeof dataCache !== 'undefined' ? (dataCache.kumas_stok||[]) : [];
                taze.forEach(t => {
                    const cached = kumasStokCache.find(c => String(c.id) === String(t.id));
                    if (cached) cached.notlar = t.notlar;
                });
                const cekiKaynak = taze.filter(h => /\[CEKI:/i.test(String(h.notlar||'')));
                for (const cekiH of cekiKaynak) {
                    if (typeof kumasCekiGoster === 'function') {
                        const satirlar = typeof kumasCekiNotlarOku === 'function' ? kumasCekiNotlarOku(cekiH.notlar) : null;
                        if (satirlar && satirlar.length) {
                            kumasCekiGoster(cekiH.notlar, {
                                stok_kodu: cekiH.stok_kodu,
                                urun_adi: (typeof muhasebeFisKalemFromPayload === 'function' ? (muhasebeFisKalemFromPayload(cekiH, 'KUMAS') || {}).urun_adi : '') || cekiH.kumas_cinsi,
                                musteri: fis.musteri
                            });
                            return;
                        }
                    }
                }
            }
        } catch(e) { /* devam et */ }
    }

    // Fallback: cache'den ara
    const kumasStok = typeof dataCache !== 'undefined' ? (dataCache.kumas_stok||[]) : [];
    const ids = new Set(hIds);
    const hareketler = kumasStok.filter(h => ids.has(String(h.id)));

    // [CEKI:] tag varsa kumasCekiGoster ile aç (cache'de varsa)
    if (fis.depo_grup === 'KUMAS') {
        const cekiKaynak = hareketler.filter(h => /\[CEKI:/i.test(String(h.notlar||'')));
        for (const cekiH of cekiKaynak) {
            const satirlar = typeof kumasCekiNotlarOku === 'function' ? kumasCekiNotlarOku(cekiH.notlar) : null;
            if (satirlar && satirlar.length && typeof kumasCekiGoster === 'function') {
                kumasCekiGoster(cekiH.notlar, {
                    stok_kodu: cekiH.stok_kodu,
                    urun_adi: (typeof muhasebeFisKalemFromPayload === 'function' ? (muhasebeFisKalemFromPayload(cekiH, 'KUMAS') || {}).urun_adi : '') || cekiH.kumas_cinsi,
                    musteri: fis.musteri
                });
                return;
            }
        }
    }

    muhasebeFisOverlayAc(fisId);
}

async function muhasebeFisOverlayAc(fisId) {
    _muhasebeFisCekiAktif = fisId;
    if (!(_muhasebeFisCache||[]).length) await muhasebeFisleriYukle();
    const fis = muhasebeFisBul(fisId);
    if (!fis) { if (typeof erpToast === 'function') erpToast('Fiş bulunamadı', 'error'); return; }

    const esc = muhasebeFisEsc;
    const hIds = (fis.hareket_ids||[]).filter(Boolean).map(String);
    const kumasStok = typeof dataCache !== 'undefined' ? (dataCache.kumas_stok||[]) : [];
    const hareketler = kumasStok.filter(h => hIds.includes(String(h.id)));

    let kalemler = (fis.kalemler||[]).filter(muhasebeFisKalemDoluMu);
    if (fis.depo_grup === 'KUMAS' && hareketler.length) {
        const k2 = hareketler.map(h => muhasebeFisKalemFromPayload(h, 'KUMAS')).filter(muhasebeFisKalemDoluMu);
        if (k2.length) kalemler = k2;
    }

    const tarih = fis.created_at ? new Date(fis.created_at).toLocaleDateString('tr-TR') : '';
    const durumYazi = fis.durum === 'IRSALIYE_KESILDI' ? 'İrsaliye kesildi' : 'Muhasebe bekliyor';
    const tipYazi   = fis.depo_grup === 'KUMAS' ? 'Kumaş' : 'Mamül';
    const toplamYazi = muhasebeFisKalemToplamYazi(kalemler, fis.depo_grup);
    const kalemTablo = muhasebeFisKalemTabloHtml(fis.depo_grup, kalemler, {
        toplamYazi,
        darkHead: false
    });

    const html = `<div id="mf-ceki-overlay" style="position:fixed;inset:0;z-index:12000;background:rgba(15,23,42,.6);display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;padding:0;overflow:hidden;backdrop-filter:blur(2px)">
        <style>@media print{#mf-ceki-overlay{position:static;background:none;padding:0;inset:auto}.mf-ceki-head,.mf-ceki-toolbar{display:none!important}#mf-ceki-overlay>div{box-shadow:none;border-radius:0;width:100%!important}}</style>
        <div class="mf-ceki-box kumas-ceki-box" style="width:min(${fis.depo_grup==='KUMAS'?'1100px':'860px'},100%);background:#fff;border-radius:12px;box-shadow:0 24px 64px rgba(0,0,0,.3);overflow:auto;margin:0 auto;flex:1;min-height:0">
            <div class="kumas-ceki-head mf-ceki-head">
                <div>
                    <h3>MUHASEBE FİŞİ</h3>
                    <div class="kumas-ceki-meta">${esc(fis.fis_no)} · ${esc(fis.musteri)}</div>
                    <div class="kumas-ceki-musteri">${esc(tarih)} · ${esc(tipYazi)} · ${esc(durumYazi)}${fis.irsaliye_no ? ' · İrsaliye: ' + esc(fis.irsaliye_no) : ''}</div>
                </div>
                <div class="kumas-ceki-toolbar mf-ceki-toolbar">
                    <button type="button" onclick="event.stopPropagation();muhasebeFisPdfYaz('${esc(fis.id)}')">Yazdır</button>
                    <button type="button" onclick="event.stopPropagation();muhasebeFisPdfIndir('${esc(fis.id)}')">PDF indir</button>
                    <button type="button" class="is-kapat" onclick="muhasebeFisCekiKapat()">Kapat</button>
                </div>
            </div>
            <div style="padding:16px;overflow:auto;max-height:none">
                ${kalemler.length ? kalemTablo : '<div style="padding:32px;text-align:center;color:#94a3b8;font-size:13px">Bu fişe ait kalem bulunamadı.</div>'}
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
    if (String(depoGrup || '').toUpperCase() === 'KUMAS') {
        const mt = ks.reduce((s, k) => s + (parseFloat(k.mt) || 0), 0);
        const kg = ks.reduce((s, k) => s + (parseFloat(k.kg) || 0), 0);
        return [
            mt > 1e-9 ? mt.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' mt' : '',
            kg > 1e-9 ? kg.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' kg' : ''
        ].filter(Boolean).join(' · ') || '—';
    }
    const ad = ks.reduce((s, k) => s + (parseInt(k.adet, 10) || 0), 0);
    return ad > 0 ? ad + ' ad' : '—';
}

function muhasebeFisKalemBasliklar(depoGrup) {
    if (String(depoGrup || '').toUpperCase() === 'KUMAS') {
        return ['#', 'Stok kodu', 'Ürün', 'Kumaş cinsi', 'Terbiye', 'Tarak eni', 'Atkı sıklığı', 'Çözgü sıklığı', 'Atkı ipi', 'Çözgü ipi', 'Miktar'];
    }
    return ['#', 'Stok kodu', 'Ürün', 'Ürün grubu', 'Renk', 'Ebat', 'Miktar'];
}

function muhasebeFisKalemHucreler(k, i, depoGrup) {
    const esc = muhasebeFisEsc;
    if (String(depoGrup || '').toUpperCase() === 'KUMAS') {
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
        k.urun_grubu || '—',
        k.renk || '—',
        k.ebat || '—',
        muhasebeFisKalemMiktarYazi(k)
    ].map(esc);
}

function muhasebeFisKalemTabloHtml(depoGrup, kalemler, opts) {
    opts = opts || {};
    const esc = muhasebeFisEsc;
    const ks = (kalemler || []).filter(muhasebeFisKalemDoluMu);
    const heads = muhasebeFisKalemBasliklar(depoGrup);
    const last = heads.length - 1;
    const th = 'padding:6px 10px;text-align:left;font-size:10px;font-weight:600;color:var(--text3);border-bottom:1px solid var(--border)';
    const td = 'padding:6px 10px;font-size:12px;border-bottom:1px solid var(--border)';
    const headHtml = heads.map((h, i) =>
        `<th style="${th}${i === last ? ';text-align:right' : ''}${i === 0 ? ';width:28px' : ''}">${esc(h)}</th>`
    ).join('');
    const bodyHtml = ks.map((k, i) => {
        const cells = muhasebeFisKalemHucreler(k, i, depoGrup);
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
    const ks = (fis.kalemler || []).filter(muhasebeFisKalemDoluMu);
    const esc = muhasebeFisEsc;
    return `<div>
        ${muhasebeFisKalemTabloHtml(fis.depo_grup, ks)}
        ${fis.irsaliye_no ? `<div style="padding:6px 10px;font-size:11px;color:var(--text3);border-top:1px solid var(--border)">İrsaliye No: <strong style="color:var(--text1)">${esc(fis.irsaliye_no)}</strong></div>` : ''}
        ${fis.notlar ? `<div style="padding:6px 10px;font-size:11px;color:var(--text3);border-top:1px solid var(--border)">Not: ${esc(fis.notlar)}</div>` : ''}
    </div>`;
}

/* ─── Render ─── */

let _muhasebeFisRenderSeq = 0;

function muhasebeFisListeImza(ham) {
    const f = _muhasebeFisFiltre || {};
    const acik = Object.keys(_muhasebeFisAcik || {}).filter(k => _muhasebeFisAcik[k]).sort().join(',');
    const rows = (ham || []).map(x => [
        x.id, x.durum, x.irsaliye_no || '', x.musteri || '',
        (x.hareket_ids || []).length, (x.kalemler || []).length
    ].join(':'));
    return [f.q || '', f.tip || '', f.bas || '', f.bit || '', _muhasebeFisGecmisAcik ? '1' : '0', acik, rows.join('|')].join('~');
}

async function renderMuhasebeFisListe(opts) {
    opts = opts || {};
    const list = document.getElementById('main-list');
    if (!list) return;
    if (typeof appMode === 'string' && appMode && appMode !== 'MUHASEBE_FIS') return;
    muhasebeFisFiltreIlkYukle();

    const quiet = opts.quiet === true;
    const force = opts.force === true;

    _muhasebeFisCache = muhasebeFisHareketlerdenOlustur();
    const hamCache = _muhasebeFisCache || [];
    const ekranBos = !(list.innerHTML || '').trim();

    if (hamCache.length || quiet || !ekranBos) {
        muhasebeFisListeGovdeYaz(list, hamCache);
    } else {
        list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text3);font-size:11px">Muhasebe fişleri yükleniyor…</div>';
    }

    if (quiet && !force) return;

    const seq = ++_muhasebeFisRenderSeq;
    const ham = await muhasebeFisleriYukle();
    if (seq !== _muhasebeFisRenderSeq) return;
    if (typeof appMode === 'string' && appMode && appMode !== 'MUHASEBE_FIS') return;
    muhasebeFisListeGovdeYaz(list, ham);
}

function muhasebeFisListeGovdeYaz(list, ham) {
    if (!list) return;
    const filt = _muhasebeFisFiltre || { q:'', tip:'HEPSİ', bas:'', bit:'' };
    const filtered   = muhasebeFisFiltreUygula(ham, filt);
    const bekleyenTum= (ham||[]).filter(f => f.durum === 'BEKLEMEDE').length;
    const kesilenTum = (ham||[]).filter(f => f.durum === 'IRSALIYE_KESILDI').length;
    const aktifRows  = filtered.filter(f => f.durum === 'BEKLEMEDE');
    const gecmisRows = filtered.filter(f => f.durum === 'IRSALIYE_KESILDI');
    const showAktif  = filt.tip !== 'IRSALIYE_KESILDI';
    const showGecmis = filt.tip !== 'BEKLEMEDE';
    const gecmisAcik = _muhasebeFisGecmisAcik || filt.tip === 'IRSALIYE_KESILDI';
    const esc = muhasebeFisEsc;

    const filtHtml = typeof stokListeFiltreBarHtml === 'function' ? stokListeFiltreBarHtml({
        ns: 'mf-filtre', araPlaceholder: 'Fiş no, müşteri, teslim alan, plaka, irsaliye, ürün…',
        tipLabel: 'Durum', tipId: 'mf-filtre-tip',
        tipOptions: [
            { value: 'HEPSİ', label: 'Tümü' },
            { value: 'BEKLEMEDE', label: 'Muhasebe bekliyor' },
            { value: 'IRSALIYE_KESILDI', label: 'İrsaliye kesildi' }
        ],
        tipValue: filt.tip, araValue: filt.q||'', basValue: filt.bas||'', bitValue: filt.bit||'',
        onTipChange:'muhasebeFisFiltreYenile()', onAraInput:'muhasebeFisFiltreYenile()',
        onBasChange:'muhasebeFisFiltreYenile()', onBitChange:'muhasebeFisFiltreYenile()',
        onSifirla:'muhasebeFisFiltreleriSifirla()'
    }) : '';

    const ozetHtml = `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;align-items:center">
        <div style="padding:8px 14px;border:1px solid var(--border);border-radius:8px;min-width:90px">
            <div style="font-size:10px;color:var(--text3);margin-bottom:2px">Toplam Fiş</div>
            <div style="font-size:20px;font-weight:700;color:var(--text1)">${bekleyenTum + kesilenTum}</div>
        </div>
        <div style="padding:8px 14px;border:1px solid var(--border);border-radius:8px;min-width:110px">
            <div style="font-size:10px;color:var(--text3);margin-bottom:2px">Muhasebe Bekliyor</div>
            <div style="font-size:20px;font-weight:700;color:var(--amber-c)">${bekleyenTum}</div>
        </div>
        <div style="padding:8px 14px;border:1px solid var(--border);border-radius:8px;min-width:100px">
            <div style="font-size:10px;color:var(--text3);margin-bottom:2px">İrsaliye Kesildi</div>
            <div style="font-size:20px;font-weight:700;color:var(--emerald-c)">${kesilenTum}</div>
        </div>
    </div>`;

    const rowHtml = (fis) => {
        const id = esc(fis.id);
        const acik = muhasebeFisSatirAcikMi(fis.id);
        const kalemler = (fis.kalemler||[]).filter(muhasebeFisKalemDoluMu);
        const adetTop  = kalemler.reduce((s,k) => s+(parseInt(k.adet,10)||0), 0);
        const mtTop    = kalemler.reduce((s,k) => s+(parseFloat(k.mt)||0), 0);
        const miktarYazi = fis.depo_grup === 'KUMAS'
            ? (mtTop.toLocaleString('tr-TR',{maximumFractionDigits:2}) + ' mt · ' + kalemler.length + ' kalem')
            : (adetTop + ' ad · ' + kalemler.length + ' kalem');
        const k0 = kalemler[0];
        const kalemOzet = k0
            ? (fis.depo_grup === 'KUMAS'
                ? [k0.stok_kodu, k0.urun_adi, k0.kumas_cinsi].filter(Boolean).join(' · ')
                : [k0.stok_kodu, k0.urun_adi, k0.urun_grubu, k0.renk, k0.ebat].filter(Boolean).join(' · '))
            : '';
        const isKesilen = fis.durum === 'IRSALIYE_KESILDI';
        const tarih = fis.created_at ? new Date(fis.created_at).toLocaleString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
        const cekiBtn = (fis.depo_grup === 'KUMAS' && (fis.hareket_ids||[]).length)
            ? `<button type="button" class="ms-filtre-btn" onclick="muhasebeFisCekiGoster('${id}')">Çeki listesi</button>` : '';
        const durumBtn = !isKesilen
            ? `<button type="button" onclick="muhasebeFisIrsaliyeIsaretle('${id}')"
                style="padding:6px 14px;background:#d97706;color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap"
                title="Tıkla → irsaliye numarası gir">⏳ Muhasebe bekliyor</button>`
            : `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">
                <span style="padding:5px 12px;background:#dcfce7;color:#15803d;border-radius:7px;font-size:12px;font-weight:700">✔ İrsaliye kesildi</span>
                ${fis.irsaliye_no ? `<span style="font-size:10px;color:var(--text3)">No: ${esc(fis.irsaliye_no)}</span>` : ''}
                <button type="button" class="ms-filtre-btn" onclick="muhasebeFisBeklemeyeAl('${id}')" style="font-size:10px;padding:2px 8px">Geri al</button>
               </div>`;
        return `<div class="mf-fis-row" id="mf-row-${id}">
            <div class="mf-fis-head" onclick="muhasebeFisOverlayAc('${id}')">
                <span class="mf-fis-chev" id="mf-chev-${id}">${acik?'▾':'›'}</span>
                <div class="mf-fis-main">
                    <div class="mf-fis-no">${esc(fis.fis_no)} · ${esc(tarih)} · ${esc(fis.depo_grup==='KUMAS'?'Kumaş':'Mamül')}</div>
                    <div class="mf-fis-musteri">${esc(fis.musteri)}</div>
                    <div class="mf-fis-miktar">${esc(miktarYazi)}</div>
                    ${kalemOzet ? `<div class="mf-fis-kalem-ozet">${esc(kalemOzet)}${kalemler.length>1?' · +'+(kalemler.length-1)+' kalem':''}</div>` : ''}
                    ${fis.teslim_alan||fis.plaka ? `<div class="mf-fis-teslim">Teslim: ${esc(fis.teslim_alan||'—')} · Plaka: ${esc(fis.plaka||'—')}</div>` : ''}
                </div>
                <div class="mf-fis-acts" onclick="event.stopPropagation()">
                    ${cekiBtn}
                    <button type="button" class="ms-filtre-btn" onclick="muhasebeFisOverlayAc('${id}')">Fiş</button>
                    <button type="button" class="ms-filtre-btn" onclick="muhasebeFisPdfYaz('${id}')">Yazdır</button>
                    <button type="button" class="ms-filtre-btn" onclick="muhasebeFisPdfIndir('${id}')">PDF</button>
                    ${durumBtn}
                </div>
            </div>
            <div class="mf-fis-body" id="mf-detay-${id}" style="display:${acik?'block':'none'}">${acik?muhasebeFisSatirDetay(fis):''}</div>
        </div>`;
    };

    const aktifHtml  = showAktif  ? (aktifRows.length  ? aktifRows.map(rowHtml).join('')  : '<div style="padding:16px;color:var(--text3);font-size:12px">Muhasebe bekleyen fiş yok.</div>') : '';
    const gecmisBody = showGecmis ? (gecmisRows.length ? gecmisRows.map(rowHtml).join('') : '<div style="padding:16px;color:var(--text3);font-size:12px">İrsaliyesi kesilmiş fiş yok.</div>') : '';

    const html = `<div data-mf-root="1" style="padding:4px 0">
        <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text3);padding:0 0 10px">MUHASEBE TESLİM FİŞLERİ</div>
        ${filtHtml}${ozetHtml}
        ${showAktif ? `<div style="margin-bottom:12px">
            <div style="font-size:11px;font-weight:600;color:var(--text2);padding:6px 0 8px">Muhasebe bekleyen fişler <span style="font-weight:400;color:var(--text3)">${aktifRows.length} fiş</span></div>
            ${aktifHtml}
        </div>` : ''}
        ${showGecmis ? `<div class="mf-fis-section mf-fis-section--gecmis${gecmisAcik?' is-open':''}" id="mf-gecmis-section">
            <div class="mf-fis-section-head" onclick="muhasebeFisGecmisToggle()">
                <span>Geçmiş muhasebe fişleri</span>
                <span class="mf-fis-section-count">${gecmisRows.length} fiş</span>
                <span class="mf-fis-section-chev">▾</span>
            </div>
            <div class="mf-fis-section-body" id="mf-gecmis-body" style="display:${gecmisAcik?'':'none'}">${gecmisBody}</div>
        </div>` : ''}
    </div>`;

    const sig = muhasebeFisListeImza(ham);
    const bizimListe = !!list.querySelector('[data-mf-root], .mf-fis-row, .mf-fis-section');
    if (bizimListe && list.dataset.mfSig === sig) return;
    const sc = document.querySelector('.content-scroll');
    const top = sc ? sc.scrollTop : 0;
    list.innerHTML = html;
    list.dataset.mfSig = sig;
    if (sc) sc.scrollTop = top;
}

/* ─── PDF yazdır ─── */

function muhasebeFisYazdirBasliklar(depoGrup) {
    if (String(depoGrup || '').toUpperCase() === 'KUMAS') {
        return ['Stok kodu', 'Ürün', 'Kumaş cinsi', 'Tarak eni', 'Ham en', 'Miktar'];
    }
    return ['Stok kodu', 'Ürün', 'Miktar'];
}

function muhasebeFisYazdirHucreler(k, depoGrup) {
    const esc = muhasebeFisEsc;
    if (String(depoGrup || '').toUpperCase() === 'KUMAS') {
        return [
            k.stok_kodu || '—',
            k.urun_adi || '—',
            k.kumas_cinsi || '—',
            k.tarak_eni || '—',
            k.ham_en || '—',
            muhasebeFisKalemMiktarYazi(k)
        ].map(esc);
    }
    return [
        k.stok_kodu || '—',
        k.urun_adi || '—',
        muhasebeFisKalemMiktarYazi(k)
    ].map(esc);
}

async function muhasebeFisPdfYaz(id) {
    const html = muhasebeFisBelgeHtml(id);
    if (!html) return;
    const fis = muhasebeFisBul(id);
    if (typeof erpBelgeYazdir === 'function') erpBelgeYazdir(html, String((fis && fis.fis_no) || 'Fiş'));
    else if (typeof erpPrintHtml === 'function') erpPrintHtml(html, { title: String((fis && fis.fis_no) || 'Fiş') });
    else {
        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
        else if (typeof erpToast === 'function') erpToast('Popup engellendi — tarayıcıda popup iznini açın', 'warn');
    }
}

async function muhasebeFisPdfIndir(id) {
    const html = muhasebeFisBelgeHtml(id);
    if (!html) return;
    const fis = muhasebeFisBul(id);
    const ad = (fis && fis.irsaliye_no)
        ? ('irsaliye-' + fis.irsaliye_no)
        : ('muhasebe-fis-' + ((fis && fis.fis_no) || id || 'belge'));
    if (typeof erpBelgePdfIndir === 'function') {
        await erpBelgePdfIndir(html, ad);
        return;
    }
    muhasebeFisPdfYaz(id);
}

function muhasebeFisBelgeHtml(id) {
    const fis = muhasebeFisBul(id);
    if (!fis) { if (typeof erpToast === 'function') erpToast('Fiş bulunamadı', 'error'); return ''; }
    const esc = muhasebeFisEsc;

    let kalemler = (fis.kalemler||[]).filter(muhasebeFisKalemDoluMu);
    if (fis.depo_grup === 'KUMAS' && (fis.hareket_ids||[]).length) {
        const ids = new Set((fis.hareket_ids||[]).map(String));
        const h2 = (typeof dataCache !== 'undefined' ? (dataCache.kumas_stok||[]) : []).filter(h => ids.has(String(h.id)));
        if (h2.length) {
            const k2 = h2.map(h => muhasebeFisKalemFromPayload(h, 'KUMAS')).filter(muhasebeFisKalemDoluMu);
            if (k2.length) kalemler = k2;
        }
    }

    const heads = muhasebeFisYazdirBasliklar(fis.depo_grup);
    const last = heads.length - 1;
    const kalemRows = kalemler.map(k => {
        const cells = muhasebeFisYazdirHucreler(k, fis.depo_grup);
        return `<tr>${cells.map((c, j) => `<td${j===last?' class="r"':''}${j===0?' class="kod"':''}>${c}</td>`).join('')}</tr>`;
    }).join('');
    const topYazi = muhasebeFisKalemToplamYazi(kalemler, fis.depo_grup);
    const tarih = fis.created_at
        ? new Date(fis.created_at).toLocaleString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
        : new Date().toLocaleString('tr-TR');
    const depoAd = String(fis.depo_grup || '').toUpperCase() === 'KUMAS' ? 'Kumaş depo' : 'Mamül depo';
    const metaSatir = [
        fis.musteri ? `<div class="meta-row"><span>Müşteri</span><b>${esc(fis.musteri)}</b></div>` : '',
        fis.teslim_alan ? `<div class="meta-row"><span>Teslim alan</span><b>${esc(fis.teslim_alan)}</b></div>` : '',
        fis.teslim_tel ? `<div class="meta-row"><span>Telefon</span><b>${esc(fis.teslim_tel)}</b></div>` : '',
        fis.plaka ? `<div class="meta-row"><span>Plaka</span><b>${esc(fis.plaka)}</b></div>` : '',
        fis.sofor ? `<div class="meta-row"><span>Şoför</span><b>${esc(fis.sofor)}</b></div>` : '',
        fis.teslim_adres ? `<div class="meta-row meta-row--full"><span>Teslim adresi</span><b>${esc(fis.teslim_adres)}</b></div>` : '',
        fis.irsaliye_no ? `<div class="meta-row"><span>İrsaliye no</span><b>${esc(fis.irsaliye_no)}</b></div>` : '',
        fis.notlar ? `<div class="meta-row meta-row--full"><span>Not</span><b>${esc(fis.notlar)}</b></div>` : ''
    ].filter(Boolean).join('');

    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>${esc(fis.fis_no || 'Muhasebe Fişi')}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#111;font-size:12px}
    .page{width:210mm;margin:0 auto;padding:10mm 12mm}
    .antet{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:10px}
    .antet-sol{display:flex;gap:12px;align-items:flex-start;min-width:0}
    .antet-logo{height:52px;width:auto;max-width:160px;object-fit:contain}
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
    thead th{padding:8px 10px;font-size:10px;font-weight:700;text-align:left;border-bottom:2px solid #111}
    thead th.r{text-align:right}
    tbody td{padding:7px 10px;font-size:12px;border-bottom:1px solid #ddd}
    tbody td.r{text-align:right;font-family:'Courier New',monospace;font-weight:600}
    tbody td.kod{font-family:'Courier New',monospace;font-size:11px}
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
                <img class="antet-logo" src="https://simtekstekstil.com.tr/resimler/logo.png" alt="Simteks Tekstil">
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
                <div class="belge">Muhasebe Teslim Fişi</div>
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
            <div><i></i><span>Teslim Alan</span></div>
            <div><i></i><span>Muhasebe / Kaşe</span></div>
        </div>
        <div class="dip">Bu belge Simteks Tekstil San. ve Tic. Ltd. Şti. muhasebe teslim fişidir.</div>
    </div>
    </body></html>`;
    return html;
}

/* ─── Window exports ─── */
window.muhasebeFisFiltreOku          = muhasebeFisFiltreOku;
window.muhasebeFisFiltreIlkYukle     = muhasebeFisFiltreIlkYukle;
window.muhasebeFisMamulCikisKaydet   = muhasebeFisMamulCikisKaydet;
window.muhasebeFisKumasCikisKaydet   = muhasebeFisKumasCikisKaydet;
window.muhasebeFisIrsaliyeIsaretle   = muhasebeFisIrsaliyeIsaretle;
window.muhasebeFisBeklemeyeAl        = muhasebeFisBeklemeyeAl;
window.muhasebeFisSatirToggle        = muhasebeFisSatirToggle;
window.muhasebeFisGecmisToggle       = muhasebeFisGecmisToggle;
window.muhasebeFisFiltreYenile       = muhasebeFisFiltreYenile;
window.muhasebeFisFiltreleriSifirla  = muhasebeFisFiltreleriSifirla;
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
