/**
 * Mamül depo giriş/çıkış — tekli/toplu mod ve toplu liste (masaüstü + mobil ortak)
 * stok-kart-desktop.js sonrası yüklenmeli
 */
function mamulDepoAdetBakiye(stokKodu) {
    if (typeof depoMamulBakiyeHesapla === 'function') {
        return parseInt(depoMamulBakiyeHesapla(stokKodu).adet, 10) || 0;
    }
    return (dataCache.kumas_stok || []).filter(x => kumasStokHareketiMamulDepoMu(x) && String(x.stok_kodu || '').trim() === String(stokKodu || '').trim())
        .reduce((s, x) => s + (parseInt(x.cuval_sayisi || 0, 10) || 0), 0);
}

function mamulDepoCikisSecimModu() {
    return typeof movementType !== 'undefined' && movementType === 'ÇIKIŞ';
}

function mamulDepoAdetBakiyeMap() {
    const map = {};
    (dataCache.kumas_stok || []).forEach(h => {
        if (typeof kumasStokHareketiMamulDepoMu === 'function' && !kumasStokHareketiMamulDepoMu(h)) return;
        const k = String(h.stok_kodu || '').trim();
        if (!k || k === 'KODSUZ') return;
        map[k] = (map[k] || 0) + (parseInt(h.cuval_sayisi || 0, 10) || 0);
    });
    return map;
}

/** Çıkış seçimi: stok kartı olan ve net bakiyesi > 0 mamül ürünler */
function mamulDepoStoktaKartlar(q, limit) {
    const lim = Number.isFinite(limit) ? limit : 40;
    const qLower = String(q || '').trim().toLowerCase();
    const bakMap = mamulDepoAdetBakiyeMap();
    const stokluKodlar = Object.keys(bakMap).filter(kod => (bakMap[kod] || 0) > 0);
    const kartlar = [];
    const seen = new Set();

    const kartEkle = (kart, kodHint) => {
        const kod = String(kart?.desen_kodu || kart?.stok_kodu || kodHint || '').trim();
        if (!kod || seen.has(kod)) return;
        const bakiye = bakMap[kod] || bakMap[String(kart?.desen_kodu || '').trim()] || 0;
        /* Arama yaparken bakiyesi 0 olan kartlar da görünsün (aksi halde "ürün kayboldu" sanılıyor) —
           yalnızca sorgu yokken (serbest gezinme/varsayılan liste) stoksuz kartlar gizli kalsın. */
        if (bakiye <= 0 && !qLower) return;
        seen.add(kod);
        if (!kart.desen_kodu) kart = { ...kart, desen_kodu: kod };
        if (bakiye <= 0) kart = { ...kart, _sifirBakiye: true };
        kartlar.push(kart);
    };

    if (qLower && typeof mamulDepoAramaSonuclari === 'function') {
        mamulDepoAramaSonuclari(q, 80).forEach(k => kartEkle(k));
    }
    if (!kartlar.length) {
        stokluKodlar.forEach(kod => {
            const kart = mamulTopluKartBul(kod)
                || (dataCache.kumas_kutuphanesi || []).find(x =>
                    String(x.desen_kodu || '').trim() === kod || String(x.stok_kodu || '').trim() === kod);
            kartEkle(kart || { desen_kodu: kod, urun_adi: kod }, kod);
        });
        if (qLower) {
            const filtered = kartlar.filter(k => {
                const blob = [k.desen_kodu, k.stok_kodu, k.urun_adi, k.desen_adi, k.firma, k.kumas_cinsi, k.renk]
                    .map(v => String(v || '').toLowerCase()).join(' ');
                return blob.includes(qLower);
            });
            filtered.sort((a, b) => (bakMap[String(b.desen_kodu || '').trim()] || 0) - (bakMap[String(a.desen_kodu || '').trim()] || 0));
            return filtered.slice(0, lim);
        }
    }

    kartlar.sort((a, b) => (bakMap[String(b.desen_kodu || '').trim()] || 0) - (bakMap[String(a.desen_kodu || '').trim()] || 0));
    return kartlar.slice(0, lim);
}
window.mamulDepoCikisSecimModu = mamulDepoCikisSecimModu;
window.mamulDepoAdetBakiyeMap = mamulDepoAdetBakiyeMap;
window.mamulDepoStoktaKartlar = mamulDepoStoktaKartlar;
let mamulDepoGirisMod = 'TOPLU';

/** Sipariş kalemi için mamül stok kartı yokken sevk kimliği (SIP-…) */
function mamulTopluSiparisYerTutucuKod(siparis, kalem, kalemIdx) {
    const kod = String(kalem?.kod || kalem?.stok_kodu || '').trim();
    if (kod && kod.toUpperCase() !== 'KODSUZ' && mamulTopluKartBul(kod)) return kod;
    const sno = String(siparis?.sno || siparis?.id || 'X').trim().replace(/\s+/g, '');
    const urun = String(kalem?.ad || kalem?.urun || '').trim()
        .replace(/[^\wçğıöşüÇĞİÖŞÜ\-]+/gi, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 28);
    const base = urun ? `SIP-${sno}-K${kalemIdx}-${urun}` : `SIP-${sno}-K${kalemIdx}`;
    return base.slice(0, 60);
}

/** Açık siparişlerde ADET (mamül) kalemleri — stok kartı olmasa da aranabilir */
function mamulTopluSiparisKaynakRows() {
    const out = [];
    const seen = new Set();
    const liste = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.siparisler)) ? dataCache.siparisler : [];
    liste.forEach(sip => {
        if (!sip || String(sip.durum || '').toUpperCase() === 'TAMAMLANDI') return;
        const kalemler = typeof siparisListeKalemleriArr === 'function'
            ? siparisListeKalemleriArr(sip)
            : (typeof uaSiparisKalemleriGetir === 'function' ? uaSiparisKalemleriGetir(sip) : []);
        if (!Array.isArray(kalemler) || !kalemler.length) return;
        const sno = String(sip.sno || '').trim();
        const firma = String(sip.firma || sip.musteri || '').trim();
        kalemler.forEach((k, ki) => {
            const birim = typeof siparisKalemBirim === 'function'
                ? siparisKalemBirim(k)
                : String(k?.birim || 'ADET').toUpperCase();
            if (birim !== 'ADET') return;
            const ad = String(k.ad || k.urun || k.kumas_cinsi || '').trim();
            const renk = String(
                (typeof uaKalemRenkGetir === 'function' ? uaKalemRenkGetir(k) : '') || k.renk || ''
            ).trim();
            const ebat = String(
                (typeof uaKalemEbatGetir === 'function' ? uaKalemEbatGetir(k) : '') || k.ebat || k.olcu || ''
            ).trim();
            const hamKod = String(k.kod || k.stok_kodu || '').trim();
            const kart = hamKod && hamKod.toUpperCase() !== 'KODSUZ' ? mamulTopluKartBul(hamKod) : null;
            const kartVar = !!(kart && (typeof kumasKutuphanesiKartiMamulMu !== 'function' || kumasKutuphanesiKartiMamulMu(kart)));
            const kod = kartVar ? hamKod : mamulTopluSiparisYerTutucuKod(sip, k, ki);
            if (!kod || seen.has(kod.toUpperCase())) return;
            if (kartVar) return;
            seen.add(kod.toUpperCase());
            const miktar = Math.round(parseFloat(k.miktar) || 0);
            out.push({
                desen_kodu: kod,
                stok_kodu: kod,
                kod,
                urun_adi: ad || kod,
                ad: ad || kod,
                firma: firma || '',
                renk,
                ebat,
                noKart: true,
                siparisKaynak: true,
                siparis_id: sip.id,
                siparis_sno: sno,
                kalem_idx: ki,
                siparis_miktar: miktar,
                siparis_birim: 'ADET',
                lot_no: sno || ''
            });
        });
    });
    return out;
}
window.mamulTopluSiparisKaynakRows = mamulTopluSiparisKaynakRows;

function mamulTopluBosSatir() {
    return {
        kod: '', ad: '', adet: '', not: '', hata: '',
        noKart: false, renk: '',
        siparis_id: '', siparis_sno: '', kalem_idx: null,
        siparis_miktar: 0, siparis_birim: ''
    };
}

function mamulTopluSatiraSiparisYaz(row, src) {
    if (!row) return;
    row.siparis_id = src?.siparis_id || '';
    row.kalem_idx = (src && src.kalem_idx != null && src.kalem_idx !== '') ? src.kalem_idx : null;
    row.siparis_miktar = Math.round(parseFloat(src?.siparis_miktar) || 0);
    row.siparis_birim = src?.siparis_birim || 'ADET';
    row.siparis_sno = src?.siparis_sno || src?.lot_no || row.siparis_sno || '';
    row.renk = src?.renk || row.renk || '';
    row.ebat = src?.ebat || row.ebat || '';
    row.noKart = !!(src?.noKart || row.noKart);
}

function mamulTopluSatirSiparisTemizle(row) {
    if (!row) return;
    row.siparis_id = '';
    row.kalem_idx = null;
    row.siparis_miktar = 0;
    row.siparis_birim = '';
    row.siparis_sno = '';
    row.noKart = false;
    row.renk = '';
    row.ebat = '';
}

function mamulTopluSiparisOzetHesapla(row) {
    if (!row) return null;
    const sid = String(row.siparis_id || '').trim();
    const ki = parseInt(row.kalem_idx, 10);
    if (!sid || !Number.isFinite(ki) || ki < 0) return null;
    const sip = ((typeof dataCache !== 'undefined' && dataCache.siparisler) || [])
        .find(s => String(s.id) === sid);
    const kalemler = typeof siparisListeKalemleriArr === 'function'
        ? siparisListeKalemleriArr(sip || {})
        : [];
    const kalem = (kalemler || [])[ki] || {};
    let siparis = Math.round(parseFloat(row.siparis_miktar) || 0);
    if (!siparis) siparis = Math.round(parseFloat(kalem.miktar) || 0);

    const kdDok = (typeof _kdCache !== 'undefined' && _kdCache[`KD_DOKUMA_${sid}`]) || {};
    const uRaw = kdDok.urunler || {};
    const u = (Array.isArray(uRaw) ? uRaw[ki] : null)
        || uRaw[ki] || uRaw[String(ki)] || {};
    let dokunan = 0;
    if (typeof dokumaUrunIkinciOzet === 'function') {
        const dokOzet = dokumaUrunIkinciOzet(u, kalem);
        dokunan = Math.round(parseFloat(
            dokOzet.adet != null ? dokOzet.adet
                : (dokOzet.ikinci != null ? dokOzet.ikinci : u.toplam_adet)
        ) || 0);
    } else {
        dokunan = Math.round(parseFloat(u.toplam_adet) || 0);
    }

    const rowK = (typeof _kdCache !== 'undefined' && _kdCache[`KD_KONFEKSIYON_${sid}`])
        ? (_kdCache[`KD_KONFEKSIYON_${sid}`][`kalem_${ki}`] || {})
        : {};
    let yukleme = 0;
    if (typeof planlamaIhtiyacSevkAdet === 'function') {
        yukleme = Math.round(planlamaIhtiyacSevkAdet(sid, ki, rowK) || 0);
    } else {
        yukleme = Math.max(
            parseInt(rowK.sevk_edilen || 0, 10) || 0,
            parseInt(rowK.sevk_adet || 0, 10) || 0
        );
        if (typeof sevkiyatYuklemeCacheOku === 'function') {
            const loc = sevkiyatYuklemeCacheOku(sid, ki);
            if (loc != null) yukleme = Math.max(yukleme, loc);
        }
    }
    if (typeof sevkiyatSiparisKalemYuklemeFromDepo === 'function') {
        yukleme = Math.max(yukleme, Math.round(sevkiyatSiparisKalemYuklemeFromDepo(sid, ki) || 0));
    }

    // Yüklenebilir = dokuma − yüklenen | Sipariş kalan = sipariş − yükleme
    const yuklenebilir = Math.max(0, dokunan - yukleme);
    const siparisKalan = Math.max(0, siparis - yukleme);
    return {
        siparis,
        sevk: yukleme,
        dokunan,
        sevkEdilebilir: yuklenebilir,
        kapanis: siparisKalan,
        birimLbl: 'ad'
    };
}

function mamulTopluSiparisOzetHtml(row) {
    const o = mamulTopluSiparisOzetHesapla(row);
    if (!o) return '';
    const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('tr-TR');
    const b = o.birimLbl || 'ad';
    return `<div class="kumas-toplu-urun-ozet" title="Dokuma ${fmt(o.dokunan)} ${b} · Yüklenen ${fmt(o.sevk)} ${b} · Sipariş ${fmt(o.siparis)} ${b}">
        <span class="kt-ozet-chip kt-ozet--sevk" title="Dokuma − yüklenen">Yüklenebilir <b>${fmt(o.sevkEdilebilir)}</b> ${b}</span>
        <span class="kt-ozet-chip kt-ozet--kapama" title="Sipariş − yükleme">Sipariş kalan <b>${fmt(o.kapanis)}</b> ${b}</span>
    </div>`;
}

function mamulTopluSerbestKimlik(q) {
    const raw = String(q || '').trim();
    if (!raw) return null;
    // Kartı olan mamül kodu serbest kimlik olmasın
    if (typeof depoMamulStokKartiDogrula === 'function' && !depoMamulStokKartiDogrula(raw)) return null;
    if (!/^SIP-/i.test(raw) && raw.length < 2) return null;
    const ad = /^SIP-/i.test(raw)
        ? raw.replace(/^SIP-[^-]+-K\d+-?/i, '').replace(/_/g, ' ').trim() || raw
        : raw;
    return {
        desen_kodu: raw.slice(0, 60),
        stok_kodu: raw.slice(0, 60),
        kod: raw.slice(0, 60),
        urun_adi: ad,
        ad,
        noKart: true,
        siparisKaynak: false,
        firma: '',
        renk: ''
    };
}

function mamulTopluKaynakBul(kod) {
    const k = String(kod || '').trim();
    if (!k) return null;
    const ku = k.toUpperCase();
    const sip = mamulTopluSiparisKaynakRows().find(r => String(r.kod || '').toUpperCase() === ku);
    if (sip) return sip;
    if (/^SIP-/i.test(k)) return mamulTopluSerbestKimlik(k);
    return null;
}

function mamulDepoModSec(mod) {
    mamulDepoGirisMod = 'TOPLU';
    const tekli = document.getElementById('mamul-depo-tekli-wrap');
    const toplu = document.getElementById('mamul-depo-toplu-wrap');
    const tekPrev = document.getElementById('mamul-depo-tekli-preview');
    const topPrev = document.getElementById('mamul-depo-toplu-preview');
    const grid = document.getElementById('inputs-grid');
    if (tekli) tekli.style.display = 'none';
    if (toplu) toplu.style.display = '';
    if (tekPrev) tekPrev.style.display = 'none';
    if (topPrev) topPrev.style.display = '';
    if (grid) {
        const mobil = document.body?.classList?.contains('mobil-erp-body') || window.matchMedia('(max-width: 900px)').matches;
        if (mobil) grid.style.cssText = 'display:flex;flex-direction:column;gap:12px;overflow:visible';
        else grid.style.gridTemplateColumns = '1fr';
    }
    document.querySelectorAll('.mamul-depo-mod-btn').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.mod === mamulDepoGirisMod);
    });
    const actBtn = document.getElementById('main-action-btn');
    if (actBtn) actBtn.textContent = 'Toplu Kaydet';
    if (!(window._mamulTopluSatirlar || []).length) mamulTopluSatirBaslat();
    mamulTopluOzetGuncelle();
}

function mamulTopluSatirBaslat() {
    mamulTopluKodDropKapat();
    window._mamulTopluSatirlar = [mamulTopluBosSatir()];
    mamulTopluListeRender();
}

/** Hızlı giriş: stok kodunu toplu listenin belirtilen satırına yazar (mobil + masaüstü) */
function mamulTopluKodSatiraYaz(kod, satirIdx) {
    const k = String(kod || '').trim();
    if (!k) return false;
    if (!(window._mamulTopluSatirlar || []).length) mamulTopluSatirBaslat();
    let idx = Number.isFinite(satirIdx) ? satirIdx : 0;
    const rows = window._mamulTopluSatirlar;
    while (idx >= rows.length) mamulTopluSatirEkle();
    const r = rows[idx];
    const coz = mamulTopluKodCoz(k);
    if (coz.hata) { if (typeof erpToast === 'function') erpToast(coz.hata, 'error'); return false; }
    if (coz.coklu) { if (typeof erpToast === 'function') erpToast(`"${k}" için ${coz.adaylar.length} eşleşme — kodu netleştirin.`, 'warn', 5000); return false; }
    r.kod = coz.kod || k;
    r.ad = coz.kart?.urun_adi || coz.kart?.desen_adi || coz.kart?.kumas_cinsi || coz.kart?.ad || '—';
    r.hata = '';
    if (coz.noKart || coz.kart?.noKart) {
        mamulTopluSatiraSiparisYaz(r, coz.kart);
        r.noKart = true;
    } else {
        mamulTopluSatirSiparisTemizle(r);
    }
    mamulTopluListeRender();
    mamulTopluOzetGuncelle();
    setTimeout(() => {
        const body = document.getElementById('mamul-toplu-hareket-body');
        const adetInp = body?.querySelectorAll('input[data-col="adet"]')?.[idx];
        if (adetInp) { adetInp.focus(); adetInp.select?.(); }
    }, 80);
    return true;
}
window.mamulTopluKodSatiraYaz = mamulTopluKodSatiraYaz;

function mamulTopluSatirEkle() {
    if (!window._mamulTopluSatirlar) window._mamulTopluSatirlar = [];
    window._mamulTopluSatirlar.push(mamulTopluBosSatir());
    mamulTopluListeRender();
}

function mamulTopluSatirSil(idx) {
    const rows = window._mamulTopluSatirlar || [];
    if (rows.length <= 1) window._mamulTopluSatirlar = [mamulTopluBosSatir()];
    else rows.splice(idx, 1);
    mamulTopluListeRender();
    mamulTopluOzetGuncelle();
}

async function mamulTopluYapistir() {
    let text = '';
    try {
        text = await navigator.clipboard.readText();
    } catch (e) {
        text = window.prompt('Excel satırlarını yapıştırın (Kod/Ürün Adı · Adet · Not — tab veya noktalı virgül ile ayrılmış):', '') || '';
    }
    if (!text.trim()) return;
    const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const parsed = lines.map(line => {
        const parts = line.split(/\t|;/).map(x => x.trim());
        return { kod: parts[0] || '', adet: parts[1] || '', not: parts[2] || '', ad: '', hata: '' };
    }).filter(r => r.kod || r.adet);
    if (!parsed.length) { erpToast('Yapıştırılan metinde geçerli satır bulunamadı.', 'warn'); return; }
    window._mamulTopluSatirlar = parsed;
    parsed.forEach((r) => {
        if (r.kod) {
            const coz = mamulTopluKodCoz(r.kod);
            if (coz.kod && !coz.hata && !coz.coklu) {
                r.kod = coz.kod;
                r.ad = coz.kart?.urun_adi || coz.kart?.desen_adi || coz.kart?.kumas_cinsi || coz.kart?.ad || '—';
                if (coz.noKart || coz.kart?.noKart) {
                    mamulTopluSatiraSiparisYaz(r, coz.kart);
                    r.noKart = true;
                }
            } else if (coz.coklu) {
                r.hata = `${coz.adaylar.length} eşleşme — satırda kod seçin`;
            } else {
                r.hata = coz.hata || 'Bulunamadı';
            }
        }
    });
    mamulTopluListeRender();
    mamulTopluOzetGuncelle();
    erpToast(`${parsed.length} satır listeye aktarıldı. Kontrol edip Toplu Kaydet'e basın.`, 'success', 4500);
}

function mamulTopluKartBul(kod) {
    const k = String(kod || '').trim();
    if (!k) return null;
    if (typeof mamulKartBul === 'function') {
        const bul = mamulKartBul(k);
        if (bul) return bul;
    }
    const ku = k.toUpperCase();
    return (dataCache.kumas_kutuphanesi || []).find(x =>
        String(x.desen_kodu || '').trim().toUpperCase() === ku
        || String(x.stok_kodu || '').trim().toUpperCase() === ku
    ) || null;
}

function mamulTopluKodAra(q, limit = 60) {
    const lim = Number.isFinite(limit) ? limit : 12;
    const s = String(q || '').trim();
    const qLower = s.toLowerCase();
    const out = [];
    const seen = new Set();
    const push = (item) => {
        if (!item) return;
        const kod = String(item.desen_kodu || item.stok_kodu || item.kod || '').trim();
        if (!kod || seen.has(kod.toUpperCase())) return;
        seen.add(kod.toUpperCase());
        out.push(item);
    };

    if (mamulDepoCikisSecimModu()) {
        mamulDepoStoktaKartlar(s, lim).forEach(push);
        mamulTopluSiparisKaynakRows().forEach(r => {
            if (out.length >= lim) return;
            if (qLower) {
                const blob = [r.kod, r.ad, r.urun_adi, r.siparis_sno, r.firma, r.renk, r.ebat]
                    .map(v => String(v || '').toLowerCase()).join(' ');
                if (!blob.includes(qLower)) return;
            }
            push(r);
        });
        return out.slice(0, lim);
    }

    if (!s) return [];
    if (typeof mamulDepoAramaSonuclari === 'function') {
        mamulDepoAramaSonuclari(s, lim).forEach(push);
        return out.slice(0, lim);
    }
    (dataCache.kumas_kutuphanesi || []).filter(x =>
        x.desen_kodu && !String(x.desen_kodu).startsWith('NU') && kumasKutuphanesiKartiMamulMu(x) &&
        [x.desen_kodu, x.urun_adi, x.desen_adi, x.firma, x.kumas_cinsi, x.renk]
            .some(v => String(v || '').toLowerCase().includes(qLower))
    ).slice(0, lim).forEach(push);
    return out;
}

function mamulTopluKodEtiket(kart) {
    if (kart?.noKart || kart?.siparisKaynak) {
        return {
            ad: kart.urun_adi || kart.ad || kart.kod || '—',
            renk: kart.renk || '',
            ebat: kart.ebat || '',
            musteri: kart.firma || ''
        };
    }
    if (typeof mamulTopluUrunDetayOlustur === 'function') {
        const d = mamulTopluUrunDetayOlustur(kart);
        return { ad: d.ad, renk: d.renk, ebat: d.ebat, musteri: d.musteri };
    }
    if (!kart) return { ad: '—', renk: '', ebat: '', musteri: '' };
    return {
        ad: kart.urun_adi || kart.desen_adi || kart.kumas_cinsi || '—',
        renk: kart.renk || '',
        ebat: kart.ebat || kart.olcu || '',
        musteri: kart.firma || ''
    };
}

/** Arama satırı: yüklenebilir (dokuma−yükleme) + sipariş kalan (sipariş−yükleme) */
function mamulTopluDropAdetOzet(k) {
    if (k?.noKart || k?.siparisKaynak || (k?.siparis_id != null && k?.kalem_idx != null)) {
        const o = mamulTopluSiparisOzetHesapla(k);
        if (o) {
            return {
                yuklenebilir: Math.max(0, Math.round(Number(o.sevkEdilebilir) || 0)),
                siparisKalan: Math.max(0, Math.round(Number(o.kapanis) || 0))
            };
        }
        const sip = Math.round(parseFloat(k.siparis_miktar) || 0);
        return { yuklenebilir: 0, siparisKalan: sip };
    }
    const kod = String(k?.desen_kodu || k?.stok_kodu || k?.kod || '').trim();
    const bak = kod ? mamulDepoAdetBakiye(kod) : 0;
    return { yuklenebilir: Math.max(0, bak), siparisKalan: null };
}

function mamulTopluKodCoz(girdi) {
    const raw = String(girdi || '').trim();
    if (!raw) return { kod: '', kart: null, hata: '', adaylar: [] };

    // Kartsız sipariş / SIP kimliği (çıkış)
    if (mamulDepoCikisSecimModu()) {
        const sipExact = mamulTopluKaynakBul(raw);
        if (sipExact?.noKart) {
            return { kod: String(sipExact.kod || sipExact.desen_kodu || raw).trim(), kart: sipExact, hata: '', adaylar: [], noKart: true };
        }
    }

    const exactHata = typeof depoMamulStokKartiDogrula === 'function' ? depoMamulStokKartiDogrula(raw) : null;
    if (!exactHata) {
        if (mamulDepoCikisSecimModu() && mamulDepoAdetBakiye(raw) <= 0) {
            return { kod: raw, kart: null, hata: `"${raw}" stokta yok — yalnız stokta bulunan veya sipariş ürünü çıkılabilir`, adaylar: [] };
        }
        const kart = mamulTopluKartBul(raw);
        return { kod: raw, kart, hata: '', adaylar: [] };
    }

    const adaylar = mamulTopluKodAra(raw, 60);
    if (adaylar.length === 1) {
        const kart = adaylar[0];
        const kod = String(kart.desen_kodu || kart.stok_kodu || kart.kod || '').trim();
        return { kod, kart, hata: '', adaylar: [], otomatik: true, noKart: !!kart.noKart };
    }
    if (adaylar.length > 1) {
        const kartli = adaylar.filter(a => !a.noKart);
        if (kartli.length === 1) {
            const kart = kartli[0];
            return { kod: String(kart.desen_kodu || '').trim(), kart, hata: '', adaylar: [], noKart: false };
        }
        return { kod: raw, kart: null, hata: '', adaylar, coklu: true };
    }

    if (mamulDepoCikisSecimModu()) {
        const serbest = mamulTopluSerbestKimlik(raw);
        if (serbest) return { kod: serbest.kod, kart: serbest, hata: '', adaylar: [], noKart: true };
    }
    return { kod: raw, kart: null, hata: exactHata || `"${raw}" için mamül kartı veya sipariş ürünü bulunamadı`, adaylar: [] };
}

window._mamulTopluDropIdx = -1;

function mamulTopluKodDropKapat() {
    document.querySelectorAll('#mamul-toplu-kod-drop').forEach(drop => {
        if (typeof dropdownPortalTemizle === 'function') {
            dropdownPortalTemizle(drop);
            return;
        }
        drop.classList.remove('is-open');
        drop.style.display = 'none';
        drop.style.pointerEvents = 'none';
        drop.innerHTML = '';
        drop._anchorInput = null;
        ['position', 'top', 'left', 'width', 'maxHeight', 'zIndex'].forEach(k => { try { drop.style[k] = ''; } catch (e) {} });
        if (drop.parentElement === document.body) {
            try { drop.remove(); } catch (e) {}
        }
    });
    window._mamulTopluDropIdx = -1;
    window._mamulTopluAramaAdaylari = [];
}

function mamulTopluKodDropPortalaAl(drop) {
    if (!drop) drop = document.getElementById('mamul-toplu-kod-drop');
    if (!drop) {
        drop = document.createElement('div');
        drop.id = 'mamul-toplu-kod-drop';
        document.body.appendChild(drop);
    }
    if (typeof dropdownAnchorKaydet === 'function') dropdownAnchorKaydet(drop);
    if (drop.parentElement !== document.body) document.body.appendChild(drop);
    return drop;
}

function mamulTopluKodDropKonumla(inp, drop) {
    if (!inp || !drop) return;
    const rect = inp.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 10;
    const spaceAbove = rect.top - 10;
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow + 20;
    const avail = Math.max(140, openUp ? spaceAbove : spaceBelow);
    const maxH = Math.min(420, avail);
    const minW = Math.min(920, window.innerWidth - 16);
    const width = Math.min(Math.max(rect.width, minW), window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 16 - width));
    const top = openUp
        ? Math.max(8, rect.top - maxH - 4)
        : (rect.bottom + 4);
    if (typeof dropdownAnchorKaydet === 'function') dropdownAnchorKaydet(drop);
    drop.style.position = 'fixed';
    drop.style.zIndex = '200000';
    drop.style.top = top + 'px';
    drop.style.left = left + 'px';
    drop.style.width = width + 'px';
    drop.style.minWidth = Math.min(560, width) + 'px';
    drop.style.maxWidth = (window.innerWidth - 16) + 'px';
    drop.style.maxHeight = maxH + 'px';
    drop.style.overflowY = 'auto';
    drop.style.overflowX = 'auto';
    drop.style.webkitOverflowScrolling = 'touch';
    drop._anchorInput = inp;
    if (drop.parentElement !== document.body) document.body.appendChild(drop);
}

function mamulTopluKodDropGoster(idx, adaylar) {
    const inp = document.getElementById('mt-kod-' + idx);
    const drop = mamulTopluKodDropPortalaAl();
    if (!inp || !drop || !adaylar?.length) return;
    try {
        if (typeof hideAllDropdowns === 'function') {
            ['iplik-search-results', 'kumas-search-results', 'mamul-search-results', 'kumas-toplu-kod-drop'].forEach(id => {
                document.querySelectorAll('#' + id).forEach(d => {
                    if (typeof dropdownPortalTemizle === 'function') dropdownPortalTemizle(d);
                });
            });
            try { if (typeof kumasTopluDropKapat === 'function') kumasTopluDropKapat(); } catch (e) {}
        }
    } catch (e) {}
    window._mamulTopluDropIdx = idx;
    window._mamulTopluAramaAdaylari = adaylar;
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const fmt = (n) => (n == null || n === '') ? '—' : Math.round(Number(n) || 0).toLocaleString('tr-TR');
    const head = `<div class="mamul-drop-head" aria-hidden="true">
        <span>Stok kodu</span><span>Ürün adı</span><span>Müşteri</span><span>Ebat</span><span>Renk</span>
        <span class="mamul-drop-num">Yüklenebilir</span><span class="mamul-drop-num">Sipariş kalan</span>
    </div>`;
    const rowsHtml = adaylar.map((k, ai) => {
        const et = mamulTopluKodEtiket(k);
        const adet = mamulTopluDropAdetOzet(k);
        const kod = String(k.desen_kodu || k.stok_kodu || k.kod || '').trim();
        const musteriGoster = String(et.musteri || k.firma || '').trim() || '—';
        const sipBadge = k.siparis_sno
            ? `<span class="mamul-drop-sip">Sip ${esc(k.siparis_sno)}${k.noKart ? ' · kartsız' : ''}</span>`
            : (k.noKart ? '<span class="mamul-drop-sip">kartsız</span>' : '');
        const sifirBadge = k._sifirBakiye ? '<span class="mamul-drop-sip" style="color:var(--rose-c);border-color:var(--rose-c)">0 stok</span>' : '';
        return `<div class="mamul-toplu-kod-drop-item mamul-drop-row${k._sifirBakiye ? ' is-sifir-bakiye' : ''}" onmousedown="event.preventDefault();mamulTopluKodSec(${idx},${ai})" title="${esc(kod)}">
            <span class="mamul-drop-kod">${esc(kod || '—')}</span>
            <span class="mamul-drop-ad">
                <b>${esc(et.ad || '—')}</b>
                ${sipBadge}${sifirBadge}
            </span>
            <span class="mamul-drop-musteri">${esc(musteriGoster)}</span>
            <span class="mamul-drop-ebat">${esc(et.ebat || '—')}</span>
            <span class="mamul-drop-renk">${esc(et.renk || '—')}</span>
            <span class="mamul-drop-num mamul-drop-yuk">${fmt(adet.yuklenebilir)}</span>
            <span class="mamul-drop-num mamul-drop-kalan">${fmt(adet.siparisKalan)}</span>
        </div>`;
    }).join('');
    drop.innerHTML = head + rowsHtml;
    drop.style.display = 'block';
    drop.style.pointerEvents = 'auto';
    drop.classList.add('is-open');
    drop._anchorInput = inp;
    mamulTopluKodDropKonumla(inp, drop);
}
window.mamulTopluKodDropKonumla = mamulTopluKodDropKonumla;

function mamulTopluKodSec(idx, adayIdxOrKod) {
    window._mamulTopluDropSeciliyor = true;
    const rows = window._mamulTopluSatirlar || [];
    if (!rows[idx]) return;
    let src = null;
    let k = '';
    if (typeof adayIdxOrKod === 'number' || (typeof adayIdxOrKod === 'string' && /^\d+$/.test(adayIdxOrKod) && (window._mamulTopluAramaAdaylari || [])[Number(adayIdxOrKod)])) {
        src = (window._mamulTopluAramaAdaylari || [])[Number(adayIdxOrKod)];
        k = String(src?.desen_kodu || src?.stok_kodu || src?.kod || '').trim();
    } else {
        k = String(adayIdxOrKod || '').trim();
        src = mamulTopluKaynakBul(k) || mamulTopluKartBul(k);
        if (src && !src.noKart && !src.desen_kodu) src = { ...src, desen_kodu: k };
    }
    if (!k) {
        window._mamulTopluDropSeciliyor = false;
        return;
    }
    const noKart = !!(src?.noKart || src?.siparisKaynak || /^SIP-/i.test(k));
    if (mamulDepoCikisSecimModu() && !noKart && mamulDepoAdetBakiye(k) <= 0) {
        if (typeof erpToast === 'function') erpToast('Bu ürün stokta yok — çıkış yapılamaz.', 'error', 4500);
        window._mamulTopluDropSeciliyor = false;
        return;
    }
    if (!mamulDepoCikisSecimModu() && noKart) {
        if (typeof erpToast === 'function') erpToast('Kartsız ürün depoya girilemez — önce mamül kartı açın.', 'error', 4500);
        window._mamulTopluDropSeciliyor = false;
        return;
    }
    const inp = document.getElementById('mt-kod-' + idx);
    if (inp) inp.value = k;
    rows[idx].kod = k;
    rows[idx].hata = '';
    if (noKart) {
        rows[idx].ad = src?.urun_adi || src?.ad || k;
        mamulTopluSatiraSiparisYaz(rows[idx], src);
        rows[idx].noKart = true;
    } else {
        const kart = mamulTopluKartBul(k) || src;
        rows[idx].ad = kart?.urun_adi || kart?.desen_adi || kart?.kumas_cinsi || '—';
        mamulTopluSatirSiparisTemizle(rows[idx]);
    }
    mamulTopluKodDropKapat();
    mamulTopluListeRender();
    mamulTopluOzetGuncelle();
    setTimeout(() => {
        window._mamulTopluDropSeciliyor = false;
        document.getElementById('mt-adet-' + idx)?.focus();
    }, 50);
}

function mamulTopluKodInput(idx) {
    mamulTopluSatirOku(idx);
    const rows = window._mamulTopluSatirlar || [];
    if (!rows[idx]) return;
    const q = document.getElementById('mt-kod-' + idx)?.value?.trim() || '';
    rows[idx].kod = q;
    rows[idx].hata = '';
    if (q.length < 1) {
        if (mamulDepoCikisSecimModu()) {
            const stoktakiler = mamulTopluKodAra('', 60);
            if (stoktakiler.length) mamulTopluKodDropGoster(idx, stoktakiler);
            else mamulTopluKodDropKapat();
        } else {
            mamulTopluKodDropKapat();
        }
        const urunEl = document.querySelector(`#mamul-toplu-hareket-body .mamul-toplu-hareket-row:nth-child(${idx + 1}) .mamul-toplu-hareket-urun`);
        if (urunEl && !q) urunEl.textContent = '—';
        mamulTopluSatirSiparisTemizle(rows[idx]);
        return;
    }
    if (typeof depoMamulStokKartiDogrula === 'function' && !depoMamulStokKartiDogrula(q)) {
        mamulTopluKodDropKapat();
        const kart = mamulTopluKartBul(q);
        rows[idx].ad = kart?.urun_adi || kart?.desen_adi || kart?.kumas_cinsi || '—';
        mamulTopluSatirSiparisTemizle(rows[idx]);
        const urunEl = document.querySelector(`#mamul-toplu-hareket-body .mamul-toplu-hareket-row:nth-child(${idx + 1}) .mamul-toplu-hareket-urun`);
        if (urunEl) urunEl.textContent = rows[idx].ad || '—';
        mamulTopluOzetGuncelle();
        return;
    }
    const adaylar = mamulTopluKodAra(q, 60);
    if (adaylar.length) mamulTopluKodDropGoster(idx, adaylar);
    else mamulTopluKodDropKapat();
}

function mamulTopluKodUygula(idx) {
    const rows = window._mamulTopluSatirlar || [];
    if (!rows[idx]) return;
    mamulTopluKodDropKapat();
    const girdi = document.getElementById('mt-kod-' + idx)?.value?.trim() || '';
    if (!girdi) {
        rows[idx].kod = '';
        rows[idx].ad = '';
        rows[idx].hata = '';
        mamulTopluSatirSiparisTemizle(rows[idx]);
        /* Listeyi yeniden basma — odak kaybolunca Backspace formu/sayfayı kapatıyordu */
        const rowEl = document.querySelector(`#mamul-toplu-hareket-body .mamul-toplu-hareket-row:nth-child(${idx + 1})`);
        const urunEl = rowEl?.querySelector?.('.mamul-toplu-hareket-urun');
        if (urunEl) urunEl.textContent = '—';
        if (rowEl) rowEl.classList.remove('has-error');
        mamulTopluOzetGuncelle();
        return;
    }
    const coz = mamulTopluKodCoz(girdi);
    if (coz.coklu && coz.adaylar.length) {
        rows[idx].kod = girdi;
        rows[idx].hata = `${coz.adaylar.length} eşleşme — listeden seçin`;
        rows[idx].ad = '—';
        mamulTopluSatirSiparisTemizle(rows[idx]);
        mamulTopluKodDropGoster(idx, coz.adaylar);
    } else if (coz.hata) {
        rows[idx].kod = girdi;
        rows[idx].hata = coz.hata;
        rows[idx].ad = '';
        mamulTopluSatirSiparisTemizle(rows[idx]);
    } else {
        rows[idx].kod = coz.kod;
        rows[idx].hata = '';
        rows[idx].ad = coz.kart?.urun_adi || coz.kart?.desen_adi || coz.kart?.kumas_cinsi || coz.kart?.ad || '—';
        if (coz.noKart || coz.kart?.noKart) {
            mamulTopluSatiraSiparisYaz(rows[idx], coz.kart);
            rows[idx].noKart = true;
        } else {
            mamulTopluSatirSiparisTemizle(rows[idx]);
        }
        const inp = document.getElementById('mt-kod-' + idx);
        if (inp && coz.kod !== girdi) inp.value = coz.kod;
    }
    mamulTopluListeRender();
    mamulTopluOzetGuncelle();
}

function mamulTopluKodBlur(idx) {
    setTimeout(() => {
        if (window._mamulTopluDropSeciliyor) return;
        mamulTopluKodUygula(idx);
    }, 160);
}

function mamulTopluSatirOku(idx) {
    const rows = window._mamulTopluSatirlar || [];
    if (!rows[idx]) return;
    rows[idx].kod = document.getElementById('mt-kod-' + idx)?.value?.trim() || rows[idx].kod || '';
    rows[idx].adet = document.getElementById('mt-adet-' + idx)?.value || '';
    rows[idx].not = document.getElementById('mt-not-' + idx)?.value || '';
}

function mamulTopluListeRender() {
    const host = document.getElementById('mamul-toplu-hareket-body');
    if (!host) return;
    // Liste yenilenince eski sabit dropdown ortada kalmasın
    try { mamulTopluKodDropKapat(); } catch (e) {}
    const rows = window._mamulTopluSatirlar || [];
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    host.innerHTML = rows.map((r, idx) => {
        const noKart = !!(r.noKart || /^SIP-/i.test(String(r.kod || '')));
        const kart = (!r.hata && r.kod && !noKart) ? mamulTopluKartBul(r.kod) : null;
        const detay = kart && typeof mamulTopluUrunDetayOlustur === 'function'
            ? mamulTopluUrunDetayOlustur(kart)
            : null;
        const ozetHtml = noKart && r.siparis_id != null && r.kalem_idx != null
            ? mamulTopluSiparisOzetHtml(r)
            : '';
        const urunTitle = r.hata
            ? r.hata
            : (detay && typeof mamulTopluUrunDetayMetin === 'function'
                ? mamulTopluUrunDetayMetin(detay)
                : (r.ad || '—'));
        let urunInner;
        if (r.hata) {
            urunInner = `<span style="color:var(--rose-c)">${esc(r.hata)}</span>`;
        } else if (noKart) {
            urunInner = `<span class="kumas-toplu-urun-ad">${esc(r.ad || 'Ürün')}${r.siparis_sno ? ` <span style="font-size:9px;color:var(--text3)">· Sip ${esc(r.siparis_sno)}</span>` : ''} <span style="font-size:9px;color:var(--amber-c);font-weight:700">kartsız</span></span>${ozetHtml}`;
        } else if (detay && typeof mamulTopluUrunDetayHtml === 'function') {
            urunInner = mamulTopluUrunDetayHtml(detay, esc);
        } else {
            urunInner = esc(r.ad || '—');
        }
        return `
        <div class="mamul-toplu-hareket-row${r.hata ? ' has-error' : ''}">
            <div class="mamul-toplu-kod-cell">
            <input id="mt-kod-${idx}" class="pro-input" placeholder="Kod, ürün veya sipariş" value="${esc(r.kod)}"
                oninput="mamulTopluKodInput(${idx})" onfocus="mamulTopluKodInput(${idx})" onblur="mamulTopluKodBlur(${idx})"
                onkeydown="if(event.key==='Enter'){event.preventDefault();mamulTopluKodUygula(${idx});document.getElementById('mt-adet-${idx}')?.focus();}"
                style="font-family:'DM Mono',monospace;font-weight:700;color:var(--amber-c);width:100%">
            </div>
            <div class="mamul-toplu-hareket-urun" title="${esc(urunTitle)}">${urunInner}</div>
            <input id="mt-adet-${idx}" type="number" min="1" step="1" class="pro-input" placeholder="0" value="${esc(r.adet)}"
                oninput="mamulTopluSatirOku(${idx});mamulTopluOzetGuncelle()">
            <input id="mt-not-${idx}" class="pro-input" placeholder="Not..." value="${esc(r.not)}"
                oninput="mamulTopluSatirOku(${idx})">
            <button type="button" onclick="mamulTopluSatirSil(${idx})" style="border:none;background:var(--surface2);border-radius:6px;width:28px;height:28px;cursor:pointer;color:var(--text3)" title="Satırı sil">✕</button>
        </div>`;
    }).join('');
}

function mamulTopluOzetGuncelle() {
    const rows = window._mamulTopluSatirlar || [];
    rows.forEach((_, i) => mamulTopluSatirOku(i));
    let satir = 0, adet = 0, hata = 0;
    rows.forEach(r => {
        const a = parseInt(r.adet, 10) || 0;
        if (r.kod && a > 0 && !r.hata) { satir++; adet += a; }
        if (r.hata) hata++;
    });
    const oz = document.getElementById('mamul-toplu-hareket-ozet');
    if (oz) oz.innerHTML = `<span><strong>${satir}</strong> geçerli satır · <strong>${adet}</strong> toplam adet</span>${hata ? `<span style="color:var(--rose-c)">${hata} satırda hata</span>` : ''}`;
    const prev = document.getElementById('mamul-toplu-preview-ozet');
    if (prev) prev.textContent = `${satir} ürün · ${adet} adet`;
}

function mamulTopluPayloadOlustur() {
    const isCikis = movementType === 'ÇIKIŞ';
    let firmaCikis = '';
    let irs = '';
    const genelNot = document.getElementById('val-notlar-toplu')?.value?.trim() || '';
    if (isCikis) {
        firmaCikis = document.getElementById('val-afirma')?.value?.trim() || '';
        irs = document.getElementById('val-irs-toplu')?.value?.trim() || '';
        if (!firmaCikis) return { err: 'Çıkışta müşteri/alıcı firma zorunludur.' };
        if (typeof muhasebeFisTeslimDogrula === 'function') {
            const teslimErr = muhasebeFisTeslimDogrula();
            if (teslimErr) return { err: teslimErr };
        }
    }
    const rows = window._mamulTopluSatirlar || [];
    rows.forEach((_, i) => mamulTopluSatirOku(i));
    const payloads = [];
    const kodToplam = {};
    const hatalar = [];
    rows.forEach((r, i) => {
        let kod = (r.kod || '').trim();
        let noKart = !!(r.noKart || /^SIP-/i.test(kod));
        let src = noKart ? (mamulTopluKaynakBul(kod) || {
            kod, ad: r.ad || kod, urun_adi: r.ad || kod, noKart: true,
            siparis_id: r.siparis_id, kalem_idx: r.kalem_idx,
            siparis_sno: r.siparis_sno, siparis_miktar: r.siparis_miktar, renk: r.renk
        }) : null;
        if (kod) {
            const coz = mamulTopluKodCoz(kod);
            if (!coz.hata && !coz.coklu && coz.kod) {
                kod = coz.kod;
                if (coz.noKart || coz.kart?.noKart) {
                    noKart = true;
                    src = coz.kart;
                }
            } else if (coz.coklu) { hatalar.push(`Satır ${i + 1}: "${kod}" için ${coz.adaylar.length} eşleşme — kod seçin`); return; }
        }
        const ad = parseInt(r.adet, 10) || 0;
        if (!kod && !ad) return;
        const sevkiyatCikisKodsuz = isCikis && typeof appMode === 'string' && appMode === 'SEVKIYAT';
        let kodsuzFallback = false;
        if (!kod) {
            if (sevkiyatCikisKodsuz) {
                const yedek = String(r.not || r.urun || r.ad || '').trim();
                kod = yedek
                    ? (typeof sevkiyatMamulStokKoduCoz === 'function'
                        ? sevkiyatMamulStokKoduCoz({ kod: '', urun: yedek, sno: '', kalemIdx: i })
                        : yedek.slice(0, 72))
                    : `SEVK-KODSUZ-${i + 1}`;
                kodsuzFallback = true;
                noKart = true;
            } else {
                hatalar.push(`Satır ${i + 1}: stok kodu boş`);
                return;
            }
        }
        if (ad <= 0) { hatalar.push(`Satır ${i + 1}: adet girin`); return; }
        if (!isCikis && (noKart || kodsuzFallback)) {
            hatalar.push(`Satır ${i + 1}: kartsız ürün depoya girilemez — önce mamül kartı açın`);
            return;
        }
        if (!kodsuzFallback && !noKart) {
            const kartHata = typeof depoMamulStokKartiDogrula === 'function' ? depoMamulStokKartiDogrula(kod) : null;
            if (kartHata) { hatalar.push(`Satır ${i + 1}: ${kartHata}`); return; }
        }
        // Kartsız sipariş sevk: stok bakiyesi kontrolüne dahil etme
        if (!noKart && !kodsuzFallback) {
            kodToplam[kod] = (kodToplam[kod] || 0) + ad;
        }
        const kart = (noKart || kodsuzFallback) ? null : mamulTopluKartBul(kod);
        const sign = isCikis ? -1 : 1;
        const sidTag = (src?.siparis_id != null ? String(src.siparis_id) : String(r.siparis_id || '')).trim();
        const kiTag = Number.isFinite(parseInt(src?.kalem_idx != null ? src.kalem_idx : r.kalem_idx, 10))
            ? parseInt(src?.kalem_idx != null ? src.kalem_idx : r.kalem_idx, 10)
            : null;
        const sno = String(src?.siparis_sno || r.siparis_sno || src?.lot_no || '').trim();
        const sevkTag = (isCikis && sidTag && kiTag != null && kiTag >= 0)
            ? `[SEVK_MERKEZ_ADET:sip=${sidTag}|k=${kiTag}|ad=${ad}]`
            : '';
        const renkVal = String(kart?.renk || src?.renk || r.renk || '').trim();
        const ebatVal = String(kart?.ebat || kart?.olcu || src?.ebat || src?.olcu || r.ebat || '').trim();
        const grupVal = String(kart?.urun_grubu || src?.grup || src?.urun_grubu || r.grup || '').trim();
        const sevkTagTemizle = (v) => String(v || '').replace(/[\[\]]/g, '').trim();
        const sipNot = noKart
            ? [sno ? `Sipariş ${sno}` : '', renkVal ? `Renk ${renkVal}` : '', 'kartsız mamül sevk'].filter(Boolean).join(' · ')
            : '';
        const satirNot = [
            genelNot, r.not, sipNot, sevkTag,
            kodsuzFallback ? `[SEVK_URUN:${sevkTagTemizle(kod)}]` : '',
            renkVal ? `[SEVK_RENK:${sevkTagTemizle(renkVal)}]` : '',
            ebatVal ? `[SEVK_EBAT:${sevkTagTemizle(ebatVal)}]` : '',
            grupVal ? `[SEVK_GRUP:${sevkTagTemizle(grupVal)}]` : ''
        ].filter(Boolean).join(' · ');
        const notlarVal = isCikis
            ? (typeof depoNotlarWithTeslimDetay === 'function'
                ? depoNotlarWithTeslimDetay(depoNotlarWithBirim('AD', satirNot), typeof muhasebeFisTeslimFormOku === 'function' ? muhasebeFisTeslimFormOku() : null)
                : depoNotlarWithBirim('AD', satirNot))
            : depoNotlarWithBirim('AD', satirNot);
        payloads.push({
            stok_kodu: kod,
            urun_adi: kart?.urun_adi || kart?.desen_adi || src?.urun_adi || src?.ad || r.ad || (kodsuzFallback ? kod : ''),
            kumas_cinsi: kart?.kumas_cinsi || kart?.urun_adi || src?.urun_adi || src?.ad || r.ad || (kodsuzFallback ? kod : ''),
            lot_no: kart?.lot_no || sno || '',
            marka: kart?.firma || src?.firma || '',
            renk: renkVal,
            ebat: ebatVal,
            urun_grubu: grupVal,
            cuval_sayisi: sign * ad,
            irsaliye_no: isCikis ? irs : '',
            firma: isCikis ? firmaCikis.toUpperCase() : '',
            notlar: notlarVal,
            siparis_id: sidTag || null,
            kalem_idx: kiTag,
            siparis_sno: sno,
            islem_turu: movementType,
            kaynak_birim: 'DEPO_HAREKET_MAMUL_DEPO',
            ana_grup: 'MAMUL',
            updated_by: String(erpCurrentUser?.display_name || erpCurrentUser?.username || 'Sistem').trim() || 'Sistem',
            islem_gecmisi: `✨ ${new Date().toLocaleString('tr-TR')} — Toplu mamül ${isCikis ? 'çıkış' : 'giriş'}${noKart ? ' · kartsız' : ''}`
        });
    });
    if (!payloads.length && !hatalar.length) return { err: 'En az bir satırda stok kodu ve adet girin.' };
    if (hatalar.length) return { err: hatalar.slice(0, 5).join('\n') + (hatalar.length > 5 ? `\n… +${hatalar.length - 5} hata` : '') };
    if (isCikis) {
        for (const [kod, istenen] of Object.entries(kodToplam)) {
            if (!(istenen > 0)) continue;
            const bak = mamulDepoAdetBakiye(kod);
            if (bak + 1e-6 < istenen) return { err: `${kod}: yetersiz stok (mevcut ${bak}, istenen ${istenen})` };
        }
    }
    return { payloads };
}

async function mamulTopluKaydet() {
    if (isSaveInProgress) return;
    const { payloads, err } = mamulTopluPayloadOlustur();
    if (err) { erpToast(err, 'error', 7000); return; }
    const onayMsg = `${payloads.length} satır mamül ${movementType === 'ÇIKIŞ' ? 'çıkış' : 'giriş'} kaydedilsin mi?`;
    const ok = typeof erpAskConfirm === 'function' ? await erpAskConfirm(onayMsg) : confirm(onayMsg);
    if (!ok) return;
    try { mamulTopluKodDropKapat(); } catch (e) {}
    isSaveInProgress = true;
    try {
        let insertPayload = payloads.map(x => {
            const r = { ...x };
            delete r.siparis_id;
            delete r.kalem_idx;
            delete r.siparis_sno;
            return r;
        });
        const triedCols = new Set();
        let hareketIds = [];
        while (true) {
            const ins = await sb.from('kumas_stok').insert(insertPayload).select('id');
            if (!ins.error) {
                hareketIds = (ins.data || []).map(r => r.id).filter(Boolean);
                break;
            }
            const msg = String(ins.error?.message || '');
            const m = msg.match(/Could not find the '([^']+)' column/i);
            const missingCol = m?.[1];
            if (!missingCol || triedCols.has(missingCol)) throw ins.error;
            triedCols.add(missingCol);
            insertPayload = insertPayload.map(row => { const r = { ...row }; delete r[missingCol]; return r; });
        }
        if (Array.isArray(dataCache.kumas_stok)) {
            const ts = new Date().toISOString();
            (hareketIds || []).forEach((id, i) => {
                if (!id) return;
                dataCache.kumas_stok.unshift({ ...(payloads[i] || payloads[0] || {}), id, created_at: ts });
            });
        }
        let fisNo = '';
        if (movementType === 'ÇIKIŞ' && typeof muhasebeFisMamulCikisKaydet === 'function') {
            try {
                const fis = await muhasebeFisMamulCikisKaydet({ payloads, hareketIds });
                if (fis?.fis_no) fisNo = fis.fis_no;
            } catch (e) { console.warn('muhasebe fişi:', e?.message || e); }
        }
        /* Sipariş Yükleme (adet) — kartsız / sipariş bağlı satırlar (toplu / hızlı) */
        if (movementType === 'ÇIKIŞ') {
            const yukEntries = [];
            for (const p of payloads) {
                const sid = p.siparis_id != null ? String(p.siparis_id).trim() : '';
                let ki = parseInt(p.kalem_idx, 10);
                const stok = String(p.stok_kodu || '').trim();
                const mSip = stok.match(/^SIP-([^-]+)-K(\d+)/i);
                let sidUse = sid;
                if (mSip && !sidUse) {
                    const sno = String(mSip[1] || '').trim();
                    const sip = (dataCache.siparisler || []).find(s => String(s.sno || '').trim() === sno);
                    if (sip?.id != null) sidUse = String(sip.id);
                    if (!Number.isFinite(ki) || ki < 0) ki = parseInt(mSip[2], 10);
                }
                if (!sidUse || !Number.isFinite(ki) || ki < 0) continue;
                const adet = Math.abs(parseInt(p.cuval_sayisi, 10) || 0);
                if (!adet) continue;
                yukEntries.push({
                    siparisId: sidUse,
                    kalemIdx: ki,
                    deltaAdet: adet,
                    note: `Mamül sevk +${adet} ad`
                });
            }
            let yukOk = 0;
            if (yukEntries.length) {
                try {
                    if (typeof konfSevkMamulTopluYukle === 'function') {
                        yukOk = await konfSevkMamulTopluYukle(yukEntries);
                    } else if (typeof konfSevkToplamYaz === 'function') {
                        for (const e of yukEntries) {
                            const rowK = (typeof _kdCache !== 'undefined' && _kdCache[`KD_KONFEKSIYON_${e.siparisId}`])
                                ? (_kdCache[`KD_KONFEKSIYON_${e.siparisId}`][`kalem_${e.kalemIdx}`] || {})
                                : {};
                            const kdN = Math.max(
                                parseInt(rowK.sevk_edilen || 0, 10) || 0,
                                parseInt(rowK.sevk_adet || 0, 10) || 0,
                                (typeof sevkiyatYuklemeCacheOku === 'function' ? sevkiyatYuklemeCacheOku(e.siparisId, e.kalemIdx) : null) || 0
                            );
                            const hedef = Math.max(0, kdN + e.deltaAdet);
                            if (hedef === kdN) continue;
                            await konfSevkToplamYaz(e.siparisId, e.kalemIdx, hedef, {
                                kaynak: 'SEVKIYAT_MAMUL_TOPLU',
                                note: e.note,
                                skipDetayYenile: true,
                                skipAkisReload: true
                            });
                            yukOk += 1;
                        }
                    }
                } catch (e) { console.warn('mamül→sipariş yükleme', e); }
            }
            if (yukOk > 0 && typeof erpToast === 'function') {
                erpToast(`${yukOk} sipariş kaleminde Yükleme (adet) güncellendi.`, 'success', 3500);
            }
            try {
                if (yukOk > 0 && typeof sevkiyatRender === 'function' && typeof appMode === 'string' && appMode === 'SEVKIYAT') {
                    sevkiyatRender({ keepFocus: true });
                }
            } catch (e) {}
        }
        if (typeof erpSyncTablesBackground === 'function') erpSyncTablesBackground(['kumas_stok']);
        else if (typeof syncAllData === 'function') {
            syncAllData(false, { silent: true, light: true, tables: ['kumas_stok'] }).catch(() => {});
        }
        erpToast(fisNo
            ? `${payloads.length} mamül çıkış kaydedildi. Muhasebe fişi ${fisNo} asıldı.`
            : `${payloads.length} mamül hareketi kaydedildi.`, 'success', 6000);
        window._mamulTopluSatirlar = [];
        mamulTopluSatirBaslat();
        if (typeof mamulDepoFormKapat === 'function' && typeof appMode !== 'undefined' && appMode === 'MAMUL_DEPO') {
            mamulDepoFormKapat();
        } else if (typeof appMode === 'string' && appMode === 'SEVKIYAT') {
            /* Tam loadData çağırma — sevkiyat kaydını 30–60 sn uzatıyordu */
            if (typeof sevkiyatRender === 'function') {
                try { sevkiyatRender({ keepFocus: true }); } catch (e) {}
            }
        } else {
            loadData();
        }
        if (typeof sevkiyatFormModalKayitSonrasiKapat === 'function') sevkiyatFormModalKayitSonrasiKapat();
    } catch (e) {
        erpToast('Toplu kayıt hatası: ' + (e?.message || e), 'error', 7000);
    } finally {
        isSaveInProgress = false;
    }
}

function mamulDepoFormSabitle() {
    const birimSel = document.getElementById('val-miktar-birim');
    if (birimSel) birimSel.value = 'AD';
    const lbl = document.getElementById('val-kg-label');
    if (lbl) lbl.innerHTML = 'ADET <span class="req-star">★</span>';
    const qtyInp = document.getElementById('val-kg');
    if (qtyInp) {
        qtyInp.min = '1';
        qtyInp.step = '1';
        qtyInp.placeholder = '0';
    }
    const mprevLbl = document.getElementById('mprev-ana-birim-lbl');
    if (mprevLbl) mprevLbl.textContent = movementType === 'ÇIKIŞ' ? 'ÇIKIŞ ADET' : 'GİRİLECEK ADET';
    const cuvalInp = document.getElementById('val-cuval');
    if (cuvalInp) cuvalInp.value = '0';
    const ts = new Date().toLocaleString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const tarihInp = document.getElementById('val-mamul-giris-tarih');
    if (tarihInp) tarihInp.value = ts;
    const tarihPrev = document.getElementById('mprev-tarih');
    if (tarihPrev) tarihPrev.textContent = ts;
}


function mamulDepoKomutaFormHtml(isGiris, accentColor, accentRgb) {
    const tarihStr = new Date().toLocaleString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
    return `
        <div class="mdf ${isGiris ? 'mdf--giris' : 'mdf--cikis'}">
            <div class="mdf-bar">
                <div class="mdf-bar-left">
                    <span class="mdf-badge">${isGiris ? 'Giriş' : 'Sevkiyat'}</span>
                    <span class="mdf-ozet" id="mamul-toplu-preview-ozet">0 ürün · 0 adet</span>
                </div>
                <button type="button" class="mdf-save" onclick="handleSave()">${isGiris ? 'Girişi kaydet' : 'Sevkiyatı kaydet'}</button>
            </div>

            ${!isGiris ? `
            <div class="mdf-teslim-card">
                <div class="mdf-teslim">
                    <div>
                        <label class="pro-label">Müşteri / alıcı <span class="req-star">★</span></label>
                        <input id="val-afirma" oninput="updateMamulPreview()" class="pro-input" placeholder="Kime verildi?" style="text-transform:uppercase">
                    </div>
                    <div>
                        <label class="pro-label">Teslim alan</label>
                        <input id="val-teslim-alan" oninput="updateMamulPreview()" class="pro-input" placeholder="Kişi adı" style="text-transform:uppercase">
                    </div>
                    <div>
                        <label class="pro-label">Araç plaka</label>
                        <input id="val-plaka" oninput="updateMamulPreview()" class="pro-input" placeholder="34 ABC 123" style="text-transform:uppercase">
                    </div>
                </div>
                <input type="hidden" id="val-teslim-tel">
                <input type="hidden" id="val-sofor">
                <input type="hidden" id="val-teslim-adres">
                <input type="hidden" id="val-irs-toplu">
                <input type="hidden" id="val-notlar-toplu">
            </div>` : `
            <div class="mdf-not">
                <div>
                    <label class="pro-label">Genel not</label>
                    <input id="val-notlar-toplu" class="pro-input" placeholder="İsteğe bağlı — tüm satırlara yazılır">
                </div>
                <div>
                    <label class="pro-label">Tarih</label>
                    <input readonly class="pro-input" value="${tarihStr}" style="background:var(--surface2);cursor:default;min-width:140px">
                </div>
            </div>`}

            <div id="mamul-depo-toplu-wrap">
                <div class="mamul-toplu-hareket-wrap">
                    <div class="mamul-toplu-hareket-head">
                        <span>Stok kodu / ürün</span><span>Ürün</span><span>Adet</span><span>Not</span><span></span>
                    </div>
                    <div id="mamul-toplu-hareket-body"></div>
                    <div id="mamul-toplu-kod-drop"></div>
                    <div id="mamul-toplu-hareket-ozet" class="mamul-toplu-hareket-ozet">0 satır</div>
                    <div class="mamul-toplu-hareket-actions">
                        <button type="button" class="btn-pro btn-secondary-pro" style="padding:5px 10px;font-size:11px" onclick="mamulTopluSatirEkle()">+ Satır</button>
                        <button type="button" class="btn-pro btn-secondary-pro" style="padding:5px 10px;font-size:11px" onclick="mamulTopluYapistir()">Excel yapıştır</button>
                        <button type="button" class="btn-pro btn-secondary-pro" style="padding:5px 10px;font-size:11px" onclick="mamulTopluSatirBaslat()">Temizle</button>
                        <span class="mdf-hint">Kod, sipariş ürün adı veya SIP kimliği yazın. Çıkışta stoksuz sipariş ürünleri de seçilebilir.</span>
                    </div>
                </div>
            </div>

            <div id="mamul-depo-tekli-wrap" style="display:none">
                <input id="mamul-search" class="pro-input" style="display:none">
                <div id="mamul-search-results" style="display:none"></div>
                <div id="mamul-selected-card" style="display:none">
                    <span id="msel-kod"></span><span id="msel-ad"></span><span id="msel-cins"></span>
                    <span id="msel-lot"></span><span id="msel-stok"></span>
                </div>
                <input type="hidden" id="val-stok-kodu-mamul">
                <label id="val-kg-label" class="pro-label" style="display:none">ADET</label>
                <input id="val-kg" type="hidden" value="">
                <input type="hidden" id="val-miktar-birim" value="AD">
                <input type="hidden" id="val-cuval" value="0">
                <input id="val-mamul-giris-tarih" type="hidden" value="${tarihStr}">
                <textarea id="val-notlar" style="display:none"></textarea>
                ${isGiris ? '' : '<input id="val-irs" type="hidden">'}
            </div>
            <div id="mamul-depo-tekli-preview" style="display:none">
                <div id="mprev-kod">—</div><div id="mprev-no">—</div>
                <div id="mprev-lot">—</div><div id="mprev-cins">—</div>
                <div id="mprev-marka">—</div><div id="mprev-kalite">—</div>
                <div id="mprev-ana-birim-lbl"></div><div id="mprev-kg">0</div>
                <div id="mprev-cuval">0 ad</div><div id="mprev-tarih">${tarihStr}</div>
                <div id="mprev-musteri">—</div><div id="mprev-teslim-alan">—</div>
                <div id="mprev-plaka">—</div><div id="mprev-irs">—</div>
            </div>
            <div id="mamul-depo-toplu-preview" style="display:none"></div>
        </div>`;
}
window.mamulDepoKomutaFormHtml = mamulDepoKomutaFormHtml;

function mamulDepoKomutaFormMount(grid, notesContainer, isGiris, opts) {
    document.querySelectorAll('body > #mamul-toplu-kod-drop').forEach(d => d.remove());
    try { mamulTopluKodDropKapat(); } catch (e) {}
    opts = opts || {};
    const mobil = !!opts.mobil;
    const accentColor = isGiris ? 'var(--emerald-c)' : 'var(--rose-c)';
    const accentRgb = isGiris ? '52,211,153' : '251,113,133';
    if (grid) {
        grid.style.cssText = 'display:flex;flex-direction:column;gap:10px;overflow:visible;width:100%';
        grid.innerHTML = mamulDepoKomutaFormHtml(isGiris, accentColor, accentRgb);
        mamulTopluKodDropPortalaAl();
    }
    if (notesContainer) notesContainer.innerHTML = '';
    setTimeout(function () {
        mamulDepoGirisMod = 'TOPLU';
        if (typeof mamulDepoFormSabitle === 'function') mamulDepoFormSabitle();
        if (typeof mamulTopluSatirBaslat === 'function') mamulTopluSatirBaslat();
        if (typeof mamulDepoModSec === 'function') mamulDepoModSec('TOPLU');
        if (typeof depoHizliHareketStokKodu !== 'undefined' && depoHizliHareketStokKodu && typeof depoHizliStokKoduFormaUygula === 'function') {
            depoHizliStokKoduFormaUygula('MAMUL_DEPO');
        }
    }, 0);
}
window.mamulDepoKomutaFormMount = mamulDepoKomutaFormMount;

function mamulStokHizliIslem(tip, kod) {
    // Depo Stok: yalnızca stok girişi (çıkış / sevkiyat Sevkiyat menüsünden)
    const t = 'GİRİŞ';
    if (tip === 'ÇIKIŞ' || tip === 'CIKIS') {
        if (typeof sevkiyatMerkezAc === 'function') {
            sevkiyatMerkezAc('MAMUL_DEPO');
            return;
        }
        if (typeof erpToast === 'function') erpToast('Çıkış bu ekranda yok. Sevkiyat menüsünü kullanın.', 'info');
        if (typeof setAppMode === 'function') {
            try {
                if (typeof sevkiyatMerkezGrup !== 'undefined') sevkiyatMerkezGrup = 'MAMUL_DEPO';
                if (typeof saveUiState === 'function') saveUiState({ sevkiyatMerkezGrup: 'MAMUL_DEPO' });
            } catch (e) {}
            setAppMode('SEVKIYAT');
        }
        return;
    }
    const k = String(kod || '').trim() || null;
    const masaustu = typeof mamulDepoFormKapat === 'function' && typeof appMode !== 'undefined' && appMode === 'MAMUL_DEPO';
    if (masaustu) {
        mamulDepoFormAcik = true;
        if (typeof movementType !== 'undefined') movementType = t;
        const fc = document.getElementById('form-container');
        if (fc) { fc.style.display = 'block'; fc.classList.remove('ms-form-kapali'); }
        if (typeof renderInputs === 'function') renderInputs();
        if (typeof applyDepoFormLayout === 'function') applyDepoFormLayout();
        if (typeof syncDepoKomutaChrome === 'function') syncDepoKomutaChrome();
        if (k) {
            setTimeout(() => {
                if (typeof mamulTopluKodSatiraYaz === 'function') mamulTopluKodSatiraYaz(k, 0);
            }, 60);
        }
        const sc = document.querySelector('.content-scroll');
        if (sc && sc.scrollTo) sc.scrollTo({ top: 0, behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    if (typeof depoHizliHareketBaslat === 'function') {
        depoHizliHareketBaslat('MAMUL_DEPO', t, k);
        return;
    }
    if (typeof movementType !== 'undefined') movementType = t;
    if (typeof renderInputs === 'function') renderInputs();
    if (k && typeof mamulTopluKodSatiraYaz === 'function') mamulTopluKodSatiraYaz(k, 0);
    const sc = document.querySelector('.content-scroll');
    if (sc && sc.scrollTo) sc.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.mamulStokHizliIslem = mamulStokHizliIslem;

function mamulStokHareketlereGit() {
    if (typeof depoDefterKanalFiltrele === 'function') {
        depoDefterKanalFiltrele('MAMUL_DEPO');
        return;
    }
    if (typeof depoHareketDefterGrup !== 'undefined') depoHareketDefterGrup = 'MAMUL_DEPO';
    if (typeof setAppMode === 'function') setAppMode('DEPO_HAREKET_LISTE');
}
window.mamulStokHareketlereGit = mamulStokHareketlereGit;

function mamulStokGrupOzeti(grps) {
    const map = {};
    (grps || []).forEach(g => {
        const ham = String(g._detay?.grup || '').trim();
        const key = (typeof mamulUrunGrubuNormalize === 'function'
            ? mamulUrunGrubuNormalize(ham)
            : ham.toLocaleUpperCase('tr-TR')) || 'DİĞER';
        const adet = g.adet != null ? (parseInt(g.adet, 10) || 0) : (parseInt(g.net_ad, 10) || 0);
        if (!map[key]) {
            const goster = (typeof mamulListeBaslikGoster === 'function' ? mamulListeBaslikGoster(ham) : ham) || 'Diğer';
            map[key] = { ad: goster, adet: 0 };
        }
        map[key].adet += adet;
    });
    return Object.values(map).sort((a, b) => b.adet - a.adet || a.ad.localeCompare(b.ad, 'tr'));
}
window.mamulStokGrupOzeti = mamulStokGrupOzeti;

function mamulStokHamGruplariOlustur(mamulData) {
    const mGrpMap = {};
    (mamulData || []).forEach(x => {
        const kod = (x.stok_kodu || '').trim();
        if (!kod || kod === 'KODSUZ') return;
        if (!mGrpMap[kod]) mGrpMap[kod] = {
            stok_kodu: kod,
            kumas_cinsi: x.kumas_cinsi || '—',
            lot_no: x.lot_no || '—',
            marka: x.marka || '—',
            net_kg: 0, giris_kg: 0, cikis_kg: 0,
            net_ad: 0, giris_ad: 0, cikis_ad: 0,
            net_mt: 0,
            hareket: 0,
            son_giris_at: null,
            son_cikis_at: null,
            son_cikis_firma: '',
            son_cikis_teslim: ''
        };
        const g = mGrpMap[kod];
        const m = parseFloat(x.miktar_kg) || 0;
        const mt = parseFloat(x.miktar_mt) || 0;
        const ad = parseInt(x.cuval_sayisi || 0, 10) || 0;
        const tip = typeof mamulHareketTipi === 'function' ? mamulHareketTipi(x) : String(x.islem_turu || '');
        const isCikis = tip === 'ÇIKIŞ';
        const ts = x.created_at ? new Date(x.created_at).getTime() : 0;

        g.net_kg += m;
        g.net_mt += mt;
        g.net_ad += ad;
        g.hareket++;
        if (!isCikis) {
            if (m > 0) g.giris_kg += m;
            if (ad > 0) g.giris_ad += ad;
            if (ts && (!g.son_giris_at || ts > g.son_giris_at)) g.son_giris_at = ts;
        } else {
            if (m < 0) g.cikis_kg += Math.abs(m);
            else if (m > 0) g.cikis_kg += m;
            if (ad < 0) g.cikis_ad += Math.abs(ad);
            else if (ad > 0) g.cikis_ad += ad;
            if (ts && (!g.son_cikis_at || ts > g.son_cikis_at)) {
                g.son_cikis_at = ts;
                g.son_cikis_firma = x.firma || '';
                g.son_cikis_teslim = typeof depoNotlarTeslimOku === 'function' ? depoNotlarTeslimOku(x.notlar) : '';
            }
        }
        if (!g.kumas_cinsi || g.kumas_cinsi === '—') g.kumas_cinsi = x.kumas_cinsi || g.kumas_cinsi;
        if (!g.marka || g.marka === '—') g.marka = x.marka || g.marka;
    });
    Object.values(mGrpMap).forEach(g => {
        const kart = typeof mamulKartBul === 'function' ? mamulKartBul(g.stok_kodu) : null;
        g._detay = typeof mamulTopluUrunDetayOlustur === 'function' ? mamulTopluUrunDetayOlustur(kart) : null;
    });
    return Object.values(mGrpMap)
        .filter(g => typeof depoMamulStokKartiDogrula === 'function' ? depoMamulStokKartiDogrula(g.stok_kodu) === null : true)
        .filter(g => {
            if (typeof depoHareketFormGrubu === 'function' && depoHareketFormGrubu() === 'MAMUL_DEPO'
                && typeof movementType !== 'undefined' && movementType === 'ÇIKIŞ' && g.net_ad <= 0) return false;
            return true;
        })
        .sort((a, b) => String(a.stok_kodu || '').localeCompare(String(b.stok_kodu || ''), 'tr', { numeric: true, sensitivity: 'base' }));
}
window.mamulStokHamGruplariOlustur = mamulStokHamGruplariOlustur;

function mamulStokListeMetinEslesir(g, s) {
    const arama = typeof mamulDepoStokAramaMetni === 'function'
        ? mamulDepoStokAramaMetni(g.stok_kodu, g._detay, g.kumas_cinsi + g.marka)
        : (g.stok_kodu + g.kumas_cinsi + g.marka).toLowerCase();
    return !s || arama.includes(s);
}

function mamulStokListeFiltreliGruplar(hamGrps, s, filtre, ekFiltre) {
    let grps = (hamGrps || []).filter(g => mamulStokListeMetinEslesir(g, s));
    if (ekFiltre && typeof window.stokGrupFiltreEslesir === 'function') {
        grps = grps.filter(g => window.stokGrupFiltreEslesir(g, ekFiltre));
    }
    const sayac = {
        hepsi: grps.length,
        pozitif: grps.filter(g => (g.net_ad || 0) > 0).length,
        kritik: grps.filter(g => (g.net_ad || 0) <= 0).length
    };
    const f = filtre || 'POZITIF';
    if (f === 'POZITIF') grps = grps.filter(g => (g.net_ad || 0) > 0);
    else if (f === 'KRITIK') grps = grps.filter(g => (g.net_ad || 0) <= 0);
    const topNet = grps.reduce((a, g) => a + (parseInt(g.net_ad, 10) || 0), 0);
    return { grps, sayac, topNet, filtre: f };
}
window.mamulStokListeFiltreliGruplar = mamulStokListeFiltreliGruplar;

function mamulStokListeOzetDomGuncelle(ozet) {
    ozet = ozet || {};
    const net = Number(ozet.netAd || 0);
    const hero = document.getElementById('mamul-stok-hero-ad');
    const sub = document.getElementById('mamul-stok-sub');
    if (hero) {
        hero.classList.toggle('is-neg', net < 0);
        hero.innerHTML = `${Number(net).toLocaleString('tr-TR')}<span>adet</span>`;
    }
    if (sub) {
        const n = Array.isArray(window._mamulGroups) ? window._mamulGroups.length : 0;
        sub.textContent = String(n);
    }
}
window.mamulStokListeOzetDomGuncelle = mamulStokListeOzetDomGuncelle;

window.mamulStokListeGovdeGuncelle = function () {
    if (typeof loadData === 'function') loadData({ mamulBodyOnly: true });
};

function mamulStokListeDynamicHtml(grps, ozet, opts) {
    opts = opts || {};
    ozet = ozet || {};
    const esc = (s) => {
        if (typeof pdfEsc === 'function') return pdfEsc(s);
        return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    };
    const attr = (s) => {
        if (typeof erpAttr === 'function') return erpAttr(s);
        return esc(s).replace(/'/g, '&#39;');
    };
    const filtre = ozet.filtre || (typeof mamulStokHizliFiltre !== 'undefined' ? mamulStokHizliFiltre : 'POZITIF');
    const rowFn = opts.rowFn || 'showKumasGroupDetail';
    const desk = !!opts.masaustu;
    const fmtTs = (ts) => ts ? new Date(ts).toLocaleDateString('tr-TR') : '—';
    const winKey = opts.windowKey || 'mamul-stok-liste';
    const win = typeof erpListePencere === 'function'
        ? erpListePencere(grps || [], winKey)
        : { visible: grps || [], total: (grps || []).length, lim: 400 };
    const paint = win.visible;
    const moreBtn = typeof erpListeDahaFazlaHtml === 'function'
        ? erpListeDahaFazlaHtml(winKey, win.total, win.lim, "if(typeof loadData==='function')loadData({mamulBodyOnly:true})")
        : '';
    const grupOzet = mamulStokGrupOzeti(grps);
    let html = '';
    if (grupOzet.length) {
        html += `<div class="ms-grup-ozet">${grupOzet.map(x =>
            `<span class="ms-grup-ozet-item"><b>${Number(x.adet).toLocaleString('tr-TR')}</b> ${esc(x.ad)}</span>`
        ).join('')}</div>`;
    }
    html += `<div class="ms-list">`;
    if (!(grps || []).length) {
        html += `<div class="ms-empty">${filtre === 'POZITIF' ? 'Stokta ürün yok.' : 'Bu listede ürün yok.'}</div></div>`;
        return html;
    }
    if (desk) {
        html += `<div class="ms-table-wrap"><table class="ms-table">
            <thead><tr>
                <th>Ürün grubu</th><th>Stok kodu</th><th>Ürün</th><th>Ürün renk</th><th>Ürün ebat</th>
                <th class="num">Stok</th><th>Son hareket</th>
            </tr></thead><tbody>`;
        html += paint.map((g, idx) => {
            const kod = String(g.stok_kodu || '').trim();
            const adet = g.adet != null ? (parseInt(g.adet, 10) || 0) : (parseInt(g.net_ad, 10) || 0);
            const detay = g._detay || null;
            const ad = detay?.ad || g.urun_adi || g.kumas_cinsi || '—';
            const grup = detay?.grup || 'Diğer';
            const renk = detay?.renk || '—';
            const ebat = detay?.ebat || '—';
            const qtyCls = adet < 0 ? ' is-neg' : (adet === 0 ? ' is-zero' : '');
            const sonTs = Math.max(g.son_giris_at || 0, g.son_cikis_at || 0);
            const sonTxt = sonTs
                ? `${fmtTs(sonTs)}${g.son_cikis_at === sonTs && g.son_cikis_firma ? ' · ' + g.son_cikis_firma : ''}`
                : '—';
            return `<tr onclick="${rowFn}(${idx})">
                <td class="ms-grup">${esc(grup)}</td>
                <td class="ms-kod">${esc(kod)}</td>
                <td><div class="ms-name">${esc(ad)}</div></td>
                <td class="ms-ozellik">${esc(renk)}</td>
                <td class="ms-ozellik">${esc(ebat)}</td>
                <td class="num"><span class="ms-qty${qtyCls}">${adet.toLocaleString('tr-TR')}<em>ad</em></span></td>
                <td class="ms-son">${esc(sonTxt)}</td>
            </tr>`;
        }).join('');
        html += `</tbody></table></div>${moreBtn}</div>`;
        return html;
    }
    html += paint.map((g, idx) => {
        const kod = String(g.stok_kodu || '').trim();
        const adet = g.adet != null ? (parseInt(g.adet, 10) || 0) : (parseInt(g.net_ad, 10) || 0);
        const detay = g._detay || null;
        const ad = detay?.ad || g.urun_adi || g.kumas_cinsi || '—';
        const grup = detay?.grup || '';
        const meta = [detay?.ebat, detay?.renk, detay?.musteri].filter(Boolean).join(' · ');
        const qtyCls = adet < 0 ? ' is-neg' : (adet === 0 ? ' is-zero' : '');
        return `<article class="ms-row">
            <button type="button" class="ms-row-main" onclick="${rowFn}(${idx})">
                <div class="ms-row-top">
                    ${grup ? `<span class="ms-chip">${esc(grup)}</span>` : ''}
                    ${kod ? `<span class="ms-kod-pill">${esc(kod)}</span>` : ''}
                </div>
                <div class="ms-name">${esc(ad)}</div>
                ${meta ? `<div class="ms-meta">${esc(meta)}</div>` : ''}
            </button>
            <div class="ms-qty${qtyCls}">${adet.toLocaleString('tr-TR')}<em>ad</em></div>
        </article>`;
    }).join('');
    html += `${moreBtn}</div>`;
    return html;
}
window.mamulStokListeDynamicHtml = mamulStokListeDynamicHtml;

function mamulStokListeEkranHtml(grps, ozet, opts) {
    opts = opts || {};
    ozet = ozet || {};
    const esc = (s) => {
        if (typeof pdfEsc === 'function') return pdfEsc(s);
        return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    };
    const filtre = ozet.filtre || (typeof mamulStokHizliFiltre !== 'undefined' ? mamulStokHizliFiltre : 'POZITIF');
    const sayac = ozet.sayac || {};
    const net = ozet.netAd || 0;
    const desk = !!opts.masaustu;
    const filtreObj = opts.filtreObj || ozet.filtreObj || (typeof mamulStokListeFiltre !== 'undefined' ? mamulStokListeFiltre : { q: '', tip: 'HEPSİ', bas: '', bit: '' });
    const filtreBar = typeof stokListeFiltreBarHtml === 'function'
        ? stokListeFiltreBarHtml({
            prefix: 'mamul-stok-f',
            filtre: filtreObj,
            araPlaceholder: 'Ürün, stok kodu, renk, ebat, müşteri…',
            onChangeFn: 'mamulStokListeFiltreYenile',
            onResetFn: 'mamulStokListeFiltreleriSifirla',
            debounceKey: 'mamul-stok-f-ara'
        })
        : '';
    const seg = (id, label, n) =>
        `<button type="button" class="ms-seg-btn${filtre === id ? ' is-on' : ''}" onclick="mamulStokHizliFiltreSet('${id}')">${label}${n != null ? ` <b>${n}</b>` : ''}</button>`;
    const shellFn = typeof window.depoStokShellHtml === 'function' ? window.depoStokShellHtml : null;
    const netN = Number(net);
    const shellCfg = {
        shellId: 'mamul-stok-shell',
        variant: 'mamul',
        masaustu: desk,
        icon: '🧥',
        title: 'Mamül Stoğu',
        desc: 'Bitmiş ürün depo bakiyesi · adet',
        metrics: [
            { id: 'mamul-stok-hero-ad', val: netN.toLocaleString('tr-TR'), unit: 'adet', lbl: 'Toplam stok', primary: true, neg: netN < 0 },
            { id: 'mamul-stok-sub', val: String((grps || []).length), lbl: 'Ürün kalemi', primary: false }
        ],
        segHtml: `${seg('POZITIF', 'Stokta', sayac.pozitif)}${seg('HEPSI', 'Tümü', sayac.hepsi)}${seg('KRITIK', 'Tükendi', sayac.kritik)}`,
        toolsHtml: `
            <button type="button" class="ms-btn ms-btn-giris" onclick="mamulStokHizliIslem('GİRİŞ')">Stok girişi</button>
            <button type="button" class="ms-btn ms-btn-sevk" onclick="mamulStokHizliIslem('ÇIKIŞ')">Sevkiyat</button>
            <button type="button" class="ms-btn ms-btn-ghost" onclick="mamulStokHareketlereGit()">Hareketler</button>
            ${typeof exportMamulStokPdf === 'function' ? `<button type="button" class="ms-btn ms-btn-ghost" onclick="exportMamulStokPdf()">PDF</button>` : ''}`,
        filtreBar,
        dynamicId: 'mamul-stok-dynamic',
        dynamicHtml: mamulStokListeDynamicHtml(grps, ozet, opts)
    };
    if (shellFn) return shellFn(shellCfg);
    return `<div id="mamul-stok-shell" class="ms-ekran ms-ekran--mamul${desk ? ' ms-ekran--desk' : ''}">
        ${filtreBar}
        <div id="mamul-stok-dynamic">${mamulStokListeDynamicHtml(grps, ozet, opts)}</div>
    </div>`;
}
window.mamulStokListeEkranHtml = mamulStokListeEkranHtml;
