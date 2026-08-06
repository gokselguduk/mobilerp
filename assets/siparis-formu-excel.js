/* Simteks ERP — Siparis formu Excel export + Genel Durum dokuma import (EXE 1.0.2 kaynagi) */
/** aaa.xlsx — yalnızca «SİPARİŞ FORMU» sekmesi (sabit hücre düzeni) */
const SIPARIS_FORMU_SABLON_URL = 'assets/siparis-formu-sablon.xlsx';
let _siparisFormuSablonBuf = null;
/** Şablondaki veri hücreleri (başlıklar B/F, değerler C ve H birleşik alanları) */
const SIPARIS_FORMU_HUCRE = {
    sno: { row: 4, col: 3 },
    starih: { row: 4, col: 8 },
    firma: { row: 5, col: 3 },
    ttarih: { row: 5, col: 8 },
    renkVeriSatirlari: [63, 64, 65, 66, 67],
    renk1: 2,
    rkod1: 4,
    renk2: 6,
    rkod2: 8
};

function siparisFormuTtarihFormdanAl() {
    const tt = String(document.getElementById('val-ttarih')?.value || '').trim();
    return tt;
}

function siparisFormuRenkCiftleriTopla(kalemler) {
    const liste = [];
    const seen = new Set();
    (kalemler || []).forEach(k => {
        const renk = String(k.renk || '').trim();
        if (!renk) return;
        const kodlar = [k.rkod1, k.rkod2, k.rkod3, k.rkod4, k.rkod5, k.rkod6]
            .map(x => String(x ?? '').trim())
            .filter(Boolean);
        if (!kodlar.length && k.rkod) {
            String(k.rkod).split('|').forEach(p => {
                const t = p.trim();
                if (t) kodlar.push(t);
            });
        }
        if (!kodlar.length) {
            const key = renk + '||';
            if (!seen.has(key)) {
                seen.add(key);
                liste.push({ renk, rkod: '' });
            }
        } else {
            kodlar.forEach(kod => {
                const key = renk + '||' + kod;
                if (!seen.has(key)) {
                    seen.add(key);
                    liste.push({ renk, rkod: kod });
                }
            });
        }
    });
    return liste;
}

/** Her Excel satırında en fazla 2 renk + 2 renk kodu (B/D ve F/H) */
function siparisFormuRenkSatirlariOlustur(kalemler) {
    const ciftler = siparisFormuRenkCiftleriTopla(kalemler);
    const satirlar = [];
    for (let i = 0; i < ciftler.length; i += 2) {
        satirlar.push({
            renk1: ciftler[i]?.renk || '',
            rkod1: ciftler[i]?.rkod || '',
            renk2: ciftler[i + 1]?.renk || '',
            rkod2: ciftler[i + 1]?.rkod || ''
        });
    }
    if (!satirlar.length) {
        satirlar.push({ renk1: '', rkod1: '', renk2: '', rkod2: '' });
    }
    return satirlar;
}

function siparisFormuSheetAdiBul(wb) {
    const names = wb?.SheetNames || [];
    const normHit = names.find(sn => {
        const n = siparisExcelNormHeader(sn);
        return n.includes('siparis formu') && !n.includes('kumas');
    });
    if (normHit) return normHit;
    const exact = names.find(sn => /^S[Iİ\u0130]PAR[Iİ\u0130][ŞS\u015e] FORMU$/iu.test(String(sn).trim()) && !/KUMA[SŞ]/iu.test(sn));
    if (exact) return exact;
    for (const sn of names) {
        if (/KUMA[SŞ]/iu.test(sn)) continue;
        const ws = wb.Sheets[sn];
        if (!ws) continue;
        const b4 = siparisFormuHucre(ws, 4, 2);
        const b7 = siparisFormuHucre(ws, 7, 2);
        if (siparisExcelNormHeader(b4).includes('siparis no') || siparisExcelNormHeader(b7).includes('urun kod')) {
            return sn;
        }
    }
    return '';
}

function siparisFormuHucre(ws, row, col) {
    if (!ws) return '';
    const addr = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
    const cell = ws[addr];
    if (!cell) return '';
    if (cell.w != null && String(cell.w).trim() !== '') return String(cell.w).trim();
    if (cell.v != null && String(cell.v).trim() !== '') return String(cell.v).trim();
    return '';
}

function siparisFormuHucreYaz(ws, row, col, val) {
    const addr = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
    const s = val === null || val === undefined ? '' : String(val).trim();
    if (!s) { delete ws[addr]; return; }
    ws[addr] = { t: 's', v: s };
}

function siparisFormuBaslikMi(v) {
    const n = siparisExcelNormHeader(v);
    if (!n) return false;
    return n.includes('siparis no') || n.includes('siparis tarih') || n.includes('musteri')
        || n.includes('termin tarih') || n === 'renk' || n.includes('renk kodu')
        || n.includes('urun kod') || n.includes('urun adi') || n.includes('ebat')
        || n.includes('adet mt') || n.includes('adet/');
}

function siparisFormuSatirDeger(ws, row, cols) {
    for (const c of cols) {
        const v = siparisFormuHucre(ws, row, c);
        if (!v || siparisFormuBaslikMi(v)) continue;
        return v;
    }
    return '';
}

function siparisFormuMiktarBirimParse(raw) {
    const s = String(raw ?? '').trim();
    if (!s) return { miktar: 0, birim: 'ADET' };
    const u = s.toUpperCase();
    let birim = 'ADET';
    if (/\bMT\b|\bMETRE\b/.test(u)) birim = 'MT';
    else if (/\bKG\b|\bKILO\b/.test(u)) birim = 'KG';
    return { miktar: stokToNumber(s), birim };
}

/** Excel hücre biçimi — metin değil sayı + birim formatı (şablon: [$ad] [$mt]) */
function siparisFormuExcelBirimNumFmt(birim, mevcutFmt) {
    const b = normalizeSiparisBirim(birim);
    const fmt = String(mevcutFmt || '');
    if (b === 'MT' && /\[(\$mt|mt)\]/i.test(fmt)) return fmt;
    if (b === 'KG' && /(kg|\[(\$kg)\])/i.test(fmt)) return fmt;
    if (b === 'ADET' && /\[(\$ad|ad)\]/i.test(fmt)) return fmt;
    if (b === 'MT') return '#,##0.00 [$mt]';
    if (b === 'KG') return '#,##0.00 [$kg]';
    return '#,##0 [$ad]';
}

function siparisFormuMiktarYaz(miktar, birim) {
    const m = parseFloat(miktar) || 0;
    if (!m) return '';
    const b = normalizeSiparisBirim(birim);
    if (b === 'ADET') return Math.round(m);
    return m;
}

function siparisFormuKalemGecerli(k) {
    if (!k) return false;
    if (String(k.ad || '').trim() || String(k.renk || '').trim() || String(k.ebat || '').trim()) return true;
    if ((parseFloat(k.miktar) || 0) > 0) return true;
    const kod = String(k.kod || '').trim();
    if (kod && !/^\d{1,2}$/.test(kod)) return true;
    return false;
}

/** Şablonda B=sıra no (1..30), C:F birleşik ürün alanı; Genel Durum / No.N → C,G,H,I */
function siparisFormuKalemUrunMetni(k) {
    const kod = String(k.kod || '').trim();
    const ad = String(k.ad || '').trim();
    if (kod && ad && kod !== ad) return `${kod} — ${ad}`;
    return kod || ad || '';
}

function siparisFormuKalemSatirOku(ws, row) {
    const b = siparisFormuHucre(ws, row, 2);
    const c = siparisFormuHucre(ws, row, 3);
    const renk = siparisFormuHucre(ws, row, 7);
    const ebat = siparisFormuHucre(ws, row, 8);
    const mb = siparisFormuMiktarBirimParse(siparisFormuHucre(ws, row, 9));
    let kod = '', ad = '';
    if (c) {
        const ayir = c.split(/\s*[—–\-|]\s*/);
        if (ayir.length >= 2) {
            kod = ayir[0].trim();
            ad = ayir.slice(1).join(' — ').trim();
        } else {
            kod = c;
            ad = c;
        }
    } else if (b && !/^\d{1,2}$/.test(b)) {
        kod = b;
        ad = b;
    }
    return { kod, ad, renk, ebat, miktar: mb.miktar, birim: mb.birim };
}

function siparisFormuWorkbookHesaplaAyari(wb) {
    if (!wb) return;
    wb.calcProperties = Object.assign({}, wb.calcProperties || {}, {
        calcMode: 'auto',
        fullCalcOnLoad: true,
        calcOnSave: true,
        forceFullCalc: true
    });
}

function siparisFormuExcelKolonNo(harf) {
    let n = 0;
    const s = String(harf || '').toUpperCase();
    for (let i = 0; i < s.length; i++) n = n * 26 + (s.charCodeAt(i) - 64);
    return n;
}

function siparisFormuEjHucreDeger(cell) {
    if (!cell) return null;
    const v = cell.value;
    if (v === null || v === undefined) return null;
    if (v instanceof Date) return v;
    if (typeof v === 'object' && v.result !== undefined && v.result !== null) return v.result;
    if (typeof v === 'object' && v.formula) return null;
    if (typeof v === 'object' && v.richText) return v.richText.map(t => t.text || '').join('');
    if (typeof v === 'object' && v.text) return v.text;
    return v;
}

function siparisFormuSfTekHucreRefParse(formula, sfName) {
    const f = String(formula || '').trim().replace(/^=/, '');
    const esc = String(sfName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = f.match(new RegExp(`^'${esc}'!\\$?([A-Z]{1,3})\\$?(\\d+)$`, 'i'));
    if (!m) return null;
    return { col: m[1].toUpperCase(), row: parseInt(m[2], 10) };
}

/** Genel Durum / No.N: SİPARİŞ FORMU'ndan tek hücre okuyan formüllere görünür sonuç yazar */
function siparisFormuSfBaglantiSonuclariniGuncelle(wb) {
    const sfWs = siparisFormuWorksheetBulEj(wb);
    if (!sfWs) return;
    const sfName = sfWs.name;
    for (const ws of wb.worksheets) {
        if (ws.name === sfName) continue;
        for (let r = 1; r <= 120; r++) {
            for (let c = 1; c <= 80; c++) {
                const cell = ws.getCell(r, c);
                const formula = cell.formula;
                if (!formula) continue;
                const ref = siparisFormuSfTekHucreRefParse(formula, sfName);
                if (!ref) continue;
                const src = sfWs.getCell(ref.row, siparisFormuExcelKolonNo(ref.col));
                let sonuc = siparisFormuEjHucreDeger(src);
                if (sonuc === null || sonuc === undefined) sonuc = '';
                cell.value = { formula, result: sonuc };
            }
        }
    }
}

function siparisFormuVeriOku(ws) {
    const H = SIPARIS_FORMU_HUCRE;
    const sno = siparisFormuSatirDeger(ws, H.sno.row, [H.sno.col, H.sno.col + 1, H.sno.col + 2]);
    const starih = siparisExcelToDate(siparisFormuSatirDeger(ws, H.starih.row, [H.starih.col, H.starih.col + 1]));
    const firma = siparisFormuSatirDeger(ws, H.firma.row, [H.firma.col, H.firma.col + 1, H.firma.col + 2]).toUpperCase();
    const ttarih = siparisExcelToDate(siparisFormuSatirDeger(ws, H.ttarih.row, [H.ttarih.col, H.ttarih.col + 1]));
    const kalemler = [];
    for (let row = 8; row <= 37; row++) {
        const k = siparisFormuKalemSatirOku(ws, row);
        if (!siparisFormuKalemGecerli(k)) continue;
        kalemler.push(k);
    }
    const renkSatirlari = [];
    H.renkVeriSatirlari.forEach(row => {
        const renk1 = siparisFormuHucre(ws, row, H.renk1);
        const rkod1 = siparisFormuHucre(ws, row, H.rkod1);
        const renk2 = siparisFormuHucre(ws, row, H.renk2);
        const rkod2 = siparisFormuHucre(ws, row, H.rkod2);
        if (siparisFormuBaslikMi(renk1) || siparisFormuBaslikMi(renk2)) return;
        if (!renk1 && !rkod1 && !renk2 && !rkod2) return;
        renkSatirlari.push({ renk1, rkod1, renk2, rkod2 });
    });
    const renkBilgileri = renkSatirlari[0] || { renk1: '', rkod1: '', renk2: '', rkod2: '' };
    const uretim = {
        tarak_no: siparisFormuHucre(ws, 57, 2),
        tarak_eni: siparisFormuHucre(ws, 57, 6),
        cozgu_sikligi: siparisFormuHucre(ws, 58, 2),
        cozgu_ipi: siparisFormuHucre(ws, 58, 6),
        atki_sikligi: siparisFormuHucre(ws, 59, 2),
        atki_ipi: siparisFormuHucre(ws, 59, 6)
    };
    Object.keys(uretim).forEach(k => {
        if (siparisFormuBaslikMi(uretim[k])) uretim[k] = '';
    });
    const notlar = siparisFormuHucre(ws, 69, 2);
    const fotolar = [];
    for (let row = 40; row <= 54; row += 2) {
        const aciklama = siparisFormuHucre(ws, row, 2);
        if (aciklama && !siparisFormuBaslikMi(aciklama)) {
            fotolar.push({ src: '', aciklama });
        }
    }
    return { sno, firma, starih, ttarih, kalemler, renkBilgileri, renkSatirlari, uretim, notlar, fotolar };
}

function siparisFormuVeriYaz(ws, veri) {
    const H = SIPARIS_FORMU_HUCRE;
    siparisFormuHucreYaz(ws, H.sno.row, H.sno.col, veri.sno || '');
    siparisFormuHucreYaz(ws, H.starih.row, H.starih.col, veri.starih || '');
    siparisFormuHucreYaz(ws, H.firma.row, H.firma.col, veri.firma || '');
    siparisFormuHucreYaz(ws, H.ttarih.row, H.ttarih.col, veri.ttarih || '');
    (veri.kalemler || []).forEach((k, i) => {
        const row = 8 + i;
        if (row > 37) return;
        siparisFormuHucreYaz(ws, row, 2, String(i + 1));
        siparisFormuHucreYaz(ws, row, 3, siparisFormuKalemUrunMetni(k));
        siparisFormuHucreYaz(ws, row, 7, k.renk || '');
        siparisFormuHucreYaz(ws, row, 8, k.ebat || '');
        siparisFormuHucreYaz(ws, row, 9, siparisFormuMiktarYaz(k.miktar, k.birim));
    });
    const renkSatirlar = veri.renkSatirlari || siparisFormuRenkSatirlariOlustur(veri.kalemler || []);
    H.renkVeriSatirlari.forEach((row, idx) => {
        const rb = renkSatirlar[idx] || {};
        siparisFormuHucreYaz(ws, row, H.renk1, rb.renk1 || '');
        siparisFormuHucreYaz(ws, row, H.rkod1, rb.rkod1 || '');
        siparisFormuHucreYaz(ws, row, H.renk2, rb.renk2 || '');
        siparisFormuHucreYaz(ws, row, H.rkod2, rb.rkod2 || '');
    });
    const u = veri.uretim || {};
    siparisFormuHucreYaz(ws, 57, 2, u.tarak_no || '');
    siparisFormuHucreYaz(ws, 57, 6, u.tarak_eni || '');
    siparisFormuHucreYaz(ws, 58, 2, u.cozgu_sikligi || '');
    siparisFormuHucreYaz(ws, 58, 6, u.cozgu_ipi || '');
    siparisFormuHucreYaz(ws, 59, 2, u.atki_sikligi || '');
    siparisFormuHucreYaz(ws, 59, 6, u.atki_ipi || '');
    siparisFormuHucreYaz(ws, 69, 2, veri.notlar || '');
    (veri.fotolar || []).forEach((f, i) => {
        const row = 40 + i * 2;
        if (row > 54) return;
        const cap = String(f.aciklama || '').trim() || (f.src ? 'Görsel' : '');
        if (cap) siparisFormuHucreYaz(ws, row, 2, cap);
    });
    const ref = ws['!ref'] || 'A1';
    const rng = XLSX.utils.decode_range(ref);
    rng.e.r = Math.max(rng.e.r, 68);
    rng.e.c = Math.max(rng.e.c, 19);
    ws['!ref'] = XLSX.utils.encode_range(rng);
}

function siparisFormuVeriFromForm() {
    const kalemler = collectSiparisKalemlerFromForm().filter(k =>
        (String(k.ad || k.kod || '').trim() !== '') && (parseFloat(k.miktar || 0) > 0)
    );
    return {
        sno: document.getElementById('val-sno')?.value?.toUpperCase() || '',
        firma: document.getElementById('val-firma')?.value?.toUpperCase() || '',
        starih: document.getElementById('val-starih')?.value || '',
        ttarih: siparisFormuTtarihFormdanAl(),
        kalemler,
        renkSatirlari: siparisFormuRenkSatirlariOlustur(kalemler),
        renkBilgileri: siparisFormuRenkSatirlariOlustur(kalemler)[0] || {},
        uretim: {},
        notlar: '',
        fotolar: (siparisFotograflar || []).map(f => ({ src: f.src, aciklama: f.aciklama || '' }))
    };
}

function siparisFormuVeriFromKayit(i) {
    if (!i) return null;
    let kalemler = [];
    try { kalemler = typeof i.cins === 'string' ? JSON.parse(i.cins) : (i.cins || []); } catch (e) { kalemler = []; }
    kalemler = (kalemler || []).map(k => ({
        kod: k.kod || '',
        grup: k.grup || '',
        ad: k.ad || '',
        renk: k.renk || '',
        ebat: k.ebat || '',
        miktar: parseFloat(k.miktar || 0) || 0,
        birim: normalizeSiparisBirim(k.birim || 'ADET'),
        rkod: k.rkod || '',
        rkod1: k.rkod1 || '',
        rkod2: k.rkod2 || '',
        rkod3: k.rkod3 || '',
        rkod4: k.rkod4 || '',
        rkod5: k.rkod5 || '',
        rkod6: k.rkod6 || ''
    }));
    const renkSatirlari = siparisFormuRenkSatirlariOlustur(kalemler);
    return {
        sno: i.sno || '',
        firma: i.firma || '',
        starih: i.starih || '',
        ttarih: i.ttarih || '',
        kalemler,
        renkSatirlari,
        renkBilgileri: renkSatirlari[0] || {},
        uretim: {},
        notlar: i.notlar || '',
        fotolar: siparisFotografListesiAl(i).map(f => ({ src: f.src, aciklama: f.aciklama || '' }))
    };
}

function siparisFormuVeriKaynak() {
    const formVeri = siparisFormuVeriFromForm();
    if (formVeri.kalemler.length || String(formVeri.firma || '').trim()) return formVeri;
    if (appMode === 'SIPARIS_GIRIS' && editingId) {
        const hit = (dataCache.siparisler || []).find(s => s.id == editingId);
        if (hit) return siparisFormuVeriFromKayit(hit);
    }
    const listed = currentData[selectedIndex];
    if (listed && String(appMode || '').includes('SIPARIS')) return siparisFormuVeriFromKayit(listed);
    return formVeri;
}

function applySiparisFormuVeriToForm(veri) {
    if (!veri) return;
    if (veri.sno) {
        const el = document.getElementById('val-sno');
        if (el) el.value = String(veri.sno).toUpperCase();
    }
    if (veri.firma) {
        const el = document.getElementById('val-firma');
        if (el) el.value = String(veri.firma).toUpperCase();
    }
    if (veri.starih) {
        const el = document.getElementById('val-starih');
        if (el) el.value = veri.starih;
    }
    if (veri.ttarih) {
        const tt = document.getElementById('val-ttarih');
        if (tt) tt.value = veri.ttarih;
        const bt = document.getElementById('val-termin-bizim_termin');
        if (bt) bt.value = veri.ttarih;
    }
    const container = document.getElementById('siparis-kalemleri-container');
    if (container) {
        const kalemler = (veri.kalemler || []).filter(siparisFormuKalemGecerli);
        if (typeof siparisKalemleriniFormaYukle === 'function') {
            siparisKalemleriniFormaYukle({ cins: kalemler.length ? kalemler : [] });
        }
    }
    if (veri.fotolar?.length) {
        const imgFotos = veri.fotolar.filter(f => String(f.src || '').trim());
        if (imgFotos.length) {
            siparisFotograflar = imgFotos.map(f => siparisFotoNormalizeItem(f));
            siparisFotoRenderList();
        }
    }
    syncSiparisNoInput();
    updateSiparisPreview();
}

function siparisFormuBufNormalize(raw) {
    if (!raw) return null;
    if (raw instanceof ArrayBuffer) return raw;
    if (ArrayBuffer.isView(raw)) {
        return raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
    }
    if (raw && raw.type === 'Buffer' && Array.isArray(raw.data)) {
        return Uint8Array.from(raw.data).buffer;
    }
    if (Array.isArray(raw)) {
        return Uint8Array.from(raw).buffer;
    }
    return null;
}

function siparisFormuBase64ToArrayBuffer(b64) {
    const s = String(b64 || '').trim();
    if (!s) return null;
    try {
        const bin = atob(s);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return bytes.buffer;
    } catch (e) {
        return null;
    }
}

function siparisFormuUrlArrayBuffer(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 0) resolve(xhr.response);
            else reject(new Error('HTTP ' + xhr.status));
        };
        xhr.onerror = () => reject(new Error('XHR failed'));
        xhr.send();
    });
}

function siparisFormuSablonGomuluYukle() {
    const b64 = window.__SIPARIS_FORMU_SABLON_B64;
    if (!b64) return null;
    return siparisFormuBase64ToArrayBuffer(b64);
}

function siparisFormuSablonTarayiciUrlList() {
    const urls = [];
    const loc = window.location;
    if (loc.protocol === 'http:' || loc.protocol === 'https:') {
        urls.push(loc.origin.replace(/\/$/, '') + '/assets/siparis-formu-sablon.xlsx');
    }
    urls.push(SIPARIS_FORMU_SABLON_URL, './' + SIPARIS_FORMU_SABLON_URL);
    try { urls.push(new URL(SIPARIS_FORMU_SABLON_URL, loc.href).href); } catch (e) {}
    try { urls.push(new URL('../assets/siparis-formu-sablon.xlsx', loc.href).href); } catch (e) {}
    if (window.erpDesktop?.isElectron) {
        urls.unshift('erp-local://asset/siparis-formu-sablon.xlsx');
    }
    const seen = new Set();
    return urls.filter(u => {
        const k = String(u || '');
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

function siparisFormuSablonProgramatikOlustur() {
    if (typeof XLSX === 'undefined') return null;
    const set = (ws, r, c, v) => {
        if (v === '' || v == null) return;
        ws[XLSX.utils.encode_cell({ r: r - 1, c: c - 1 })] = { t: 's', v: String(v) };
    };
    const ws = {};
    set(ws, 4, 2, 'SİPARİŞ NO');
    set(ws, 4, 6, 'SİPARİŞ TARİHİ');
    set(ws, 5, 2, 'MÜŞTERİ');
    set(ws, 5, 6, 'TERMİN TARİHİ');
    set(ws, 7, 2, 'ÜRÜN KOD');
    set(ws, 7, 3, 'ÜRÜN ADI');
    set(ws, 7, 7, 'RENK');
    set(ws, 7, 8, 'EBAT');
    set(ws, 7, 9, 'ADET/MT');
    for (let r = 8; r <= 37; r++) set(ws, r, 2, String(r - 7));
    set(ws, 39, 2, 'ÜRÜN GÖRSELLERİ');
    set(ws, 56, 2, 'ÜRETİM DETAYLARI');
    set(ws, 57, 2, 'TARAK NO');
    set(ws, 57, 6, 'TARAK ENİ');
    set(ws, 58, 2, 'ÇÖZGÜ SIKLIĞI');
    set(ws, 58, 6, 'ÇÖZGÜ İPİ');
    set(ws, 59, 2, 'ATKI SIKLIĞI');
    set(ws, 59, 6, 'ATKI İPİ');
    set(ws, 61, 2, 'KULLANILACAK RENK BİLGİLERİ');
    set(ws, 62, 2, 'RENK');
    set(ws, 62, 4, 'RENK KODU');
    set(ws, 62, 6, 'RENK');
    set(ws, 62, 8, 'RENK KODU');
    set(ws, 69, 2, 'NOTLAR');
    ws['!ref'] = 'A1:T80';
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SİPARİŞ FORMU');
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

async function siparisFormuSablonYukle() {
    if (_siparisFormuSablonBuf) return _siparisFormuSablonBuf;

    const readDesktop = window.erpDesktop?.readAssetBase64 || window.erpDesktop?.readAssetBytes;
    if (readDesktop) {
        try {
            const raw = await readDesktop('siparis-formu-sablon.xlsx');
            let buf = null;
            if (typeof raw === 'string') buf = siparisFormuBase64ToArrayBuffer(raw);
            else buf = siparisFormuBufNormalize(raw);
            if (buf && buf.byteLength > 0) {
                _siparisFormuSablonBuf = buf;
                return _siparisFormuSablonBuf;
            }
        } catch (e) {
            console.warn('Masaüstü şablon okuma:', e);
        }
    }

    const gomulu = siparisFormuSablonGomuluYukle();
    if (gomulu && gomulu.byteLength > 0) {
        _siparisFormuSablonBuf = gomulu;
        return _siparisFormuSablonBuf;
    }

    for (const url of siparisFormuSablonTarayiciUrlList()) {
        try {
            let ab = null;
            try {
                const res = await fetch(url);
                if (res.ok) ab = await res.arrayBuffer();
            } catch (e) {
                ab = await siparisFormuUrlArrayBuffer(url);
            }
            if (ab && ab.byteLength > 0) {
                _siparisFormuSablonBuf = ab;
                return _siparisFormuSablonBuf;
            }
        } catch (e) {
            console.warn('Şablon yükleme:', url, e);
        }
    }

    const prog = siparisFormuSablonProgramatikOlustur();
    if (prog && prog.byteLength > 0) {
        _siparisFormuSablonBuf = prog;
        console.warn('Sipariş formu: gömülü/http şablon bulunamadı; basit şablon oluşturuldu.');
        return _siparisFormuSablonBuf;
    }

    throw new Error(
        'Şablon yüklenemedi. Sayfayı yenileyin (Ctrl+F5). ' +
        'Proje kökünden açıyorsanız: npm start → http://localhost:3000/stok.html'
    );
}

function siparisFormuWorksheetBulEj(wb) {
    if (!wb || !wb.worksheets) return null;
    for (const ws of wb.worksheets) {
        const n = siparisExcelNormHeader(ws.name);
        if (n.includes('siparis formu') && !n.includes('kumas')) return ws;
    }
    for (const ws of wb.worksheets) {
        if (/KUMA[SŞ]/iu.test(ws.name || '')) continue;
        try {
            const b4 = String(ws.getCell(4, 2).value || '');
            const b7 = String(ws.getCell(7, 2).value || '');
            if (siparisExcelNormHeader(b4).includes('siparis no') || siparisExcelNormHeader(b7).includes('urun kod')) return ws;
        } catch (e) {}
    }
    return wb.getWorksheet('SİPARİŞ FORMU') || null;
}

function siparisFormuEjHucre(ws, row, col, val) {
    const cell = ws.getCell(row, col);
    if (cell.formula) return;
    const s = val === null || val === undefined ? '' : String(val).trim();
    if (!s) {
        cell.value = null;
        return;
    }
    cell.value = s;
}

function siparisFormuEjTarih(ws, row, col, iso) {
    const cell = ws.getCell(row, col);
    if (cell.formula) return;
    const s = String(iso || '').trim();
    if (!s) { cell.value = null; return; }
    const d = new Date(s + 'T00:00:00');
    cell.value = Number.isNaN(d.getTime()) ? s : d;
}

function siparisFormuEjMiktar(ws, row, col, miktar, birim) {
    const cell = ws.getCell(row, col);
    if (cell.formula) return;
    const m = parseFloat(miktar) || 0;
    if (!m) { cell.value = null; return; }
    const b = normalizeSiparisBirim(birim);
    cell.value = b === 'ADET' ? Math.round(m) : m;
    cell.numFmt = siparisFormuExcelBirimNumFmt(b, cell.numFmt);
}

function siparisFormuVeriYazEj(ws, veri) {
    const H = SIPARIS_FORMU_HUCRE;
    const urunCols = [2, 3, 7, 8, 9];
    for (let row = 8; row <= 37; row++) {
        urunCols.forEach(col => {
            const cell = ws.getCell(row, col);
            if (!cell.formula) cell.value = null;
        });
    }
    H.renkVeriSatirlari.forEach(row => {
        [H.renk1, H.rkod1, H.renk2, H.rkod2].forEach(col => {
            const cell = ws.getCell(row, col);
            if (!cell.formula) cell.value = null;
        });
    });
    siparisFormuEjHucre(ws, H.sno.row, H.sno.col, veri.sno || '');
    siparisFormuEjTarih(ws, H.starih.row, H.starih.col, veri.starih || '');
    siparisFormuEjHucre(ws, H.firma.row, H.firma.col, veri.firma || '');
    siparisFormuEjTarih(ws, H.ttarih.row, H.ttarih.col, veri.ttarih || '');
    (veri.kalemler || []).forEach((k, i) => {
        const row = 8 + i;
        if (row > 37) return;
        siparisFormuEjHucre(ws, row, 2, String(i + 1));
        siparisFormuEjHucre(ws, row, 3, siparisFormuKalemUrunMetni(k));
        siparisFormuEjHucre(ws, row, 7, k.renk || '');
        siparisFormuEjHucre(ws, row, 8, k.ebat || '');
        siparisFormuEjMiktar(ws, row, 9, k.miktar, k.birim);
    });
    const renkSatirlar = veri.renkSatirlari || siparisFormuRenkSatirlariOlustur(veri.kalemler || []);
    H.renkVeriSatirlari.forEach((row, idx) => {
        const rb = renkSatirlar[idx] || {};
        siparisFormuEjHucre(ws, row, H.renk1, rb.renk1 || '');
        siparisFormuEjHucre(ws, row, H.rkod1, rb.rkod1 || '');
        siparisFormuEjHucre(ws, row, H.renk2, rb.renk2 || '');
        siparisFormuEjHucre(ws, row, H.rkod2, rb.rkod2 || '');
    });
    const u = veri.uretim || {};
    siparisFormuEjHucre(ws, 57, 2, u.tarak_no || '');
    siparisFormuEjHucre(ws, 57, 6, u.tarak_eni || '');
    siparisFormuEjHucre(ws, 58, 2, u.cozgu_sikligi || '');
    siparisFormuEjHucre(ws, 58, 6, u.cozgu_ipi || '');
    siparisFormuEjHucre(ws, 59, 2, u.atki_sikligi || '');
    siparisFormuEjHucre(ws, 59, 6, u.atki_ipi || '');
    siparisFormuEjHucre(ws, 69, 2, veri.notlar || '');
    (veri.fotolar || []).forEach((f, i) => {
        const row = 40 + i * 2;
        if (row > 54) return;
        const cap = String(f.aciklama || '').trim() || (f.src ? 'Görsel' : '');
        if (cap) siparisFormuEjHucre(ws, row, 2, cap);
    });
}

function siparisFormuDosyaAdiOlustur(veri) {
    const temiz = (v, yedek) => {
        let s = String(v ?? '').trim();
        if (!s) s = yedek;
        return s.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
    };
    const sno = temiz(veri?.sno, 'yeni').replace(/\s/g, '_');
    const firma = temiz(veri?.firma, 'Musteri');
    return `${sno}_${firma}.xlsx`;
}

function siparisFormuDosyaIndir(buffer, dosyaAd) {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = dosyaAd;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function siparisFormuExcelJsExport(templateBuf, veri) {
    const ExcelJSLib = window.ExcelJS;
    if (!ExcelJSLib) throw new Error('ExcelJS yüklenemedi');
    const wb = new ExcelJSLib.Workbook();
    await wb.xlsx.load(templateBuf);
    const ws = siparisFormuWorksheetBulEj(wb);
    if (!ws) throw new Error('Şablonda SİPARİŞ FORMU sekmesi bulunamadı');
    siparisFormuVeriYazEj(ws, veri);
    siparisFormuSfBaglantiSonuclariniGuncelle(wb);
    siparisFormuWorkbookHesaplaAyari(wb);
    return wb.xlsx.writeBuffer();
}

async function exportAktifSiparisFormuExcel() {
    if (typeof XLSX === 'undefined') { alert('Excel kütüphanesi yüklenemedi.'); return; }
    const veri = siparisFormuVeriKaynak();
    if (!veri || (!veri.kalemler.length && !String(veri.firma || '').trim())) {
        alert('Dışa aktarmak için sipariş seçin veya formda müşteri + en az bir ürün kalemi doldurun.');
        return;
    }
    const dosyaAd = siparisFormuDosyaAdiOlustur(veri);
    try {
        const buf = await siparisFormuSablonYukle();
        if (typeof ExcelJS !== 'undefined') {
            const out = await siparisFormuExcelJsExport(buf, veri);
            siparisFormuDosyaIndir(out, dosyaAd);
            erpToast('Excel indirildi; Genel Durum ve model sekmeleri sipariş verisini içerir.', 'success', 5000);
            return;
        }
        const wb = XLSX.read(buf, { type: 'array' });
        const sn = siparisFormuSheetAdiBul(wb);
        if (!sn) { alert('Şablonda SİPARİŞ FORMU sekmesi bulunamadı.'); return; }
        siparisFormuVeriYaz(wb.Sheets[sn], veri);
        XLSX.writeFile(wb, dosyaAd);
        erpToast('Excel indirildi (sadece içerik; tam tasarım için sayfayı yenileyin).', 'warning', 6000);
    } catch (e) {
        alert('Sipariş formu Excel oluşturulamadı: ' + (e?.message || e));
    }
}

/** Genel Durum — C:ürün, G:renk, H:ebat · J:Toplam Dokunan Mt, K:Toplam Dokunan Ad/Kg */
const GENEL_DURUM_DOKUMA = {
    basSatir: 3, bitSatir: 32,
    colUrun: 3, colRenk: 7, colEbat: 8,
    colMetre: 10, colAdKg: 11
};

function genelDurumSheetAdiBul(wb) {
    const names = wb?.SheetNames || [];
    return names.find(sn => siparisExcelNormHeader(sn).includes('genel durum')) || '';
}

function siparisExcelHucreSayi(ws, row, col) {
    if (!ws) return 0;
    const addr = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
    const cell = ws[addr];
    if (!cell) return 0;
    if (cell.t === 'n' && typeof cell.v === 'number' && Number.isFinite(cell.v)) return cell.v;
    const raw = siparisFormuHucre(ws, row, col);
    if (!raw) return 0;
    return stokToNumber(raw);
}

function genelDurumKalemBul(kalemler, urunRaw, renkRaw, ebatRaw) {
    const urunTxt = String(urunRaw || '').trim();
    let kod = '', ad = '';
    if (urunTxt) {
        const ayir = urunTxt.split(/\s*[—–\-|]\s*/);
        if (ayir.length >= 2) {
            kod = ayir[0].trim();
            ad = ayir.slice(1).join(' — ').trim();
        } else {
            kod = urunTxt;
            ad = urunTxt;
        }
    }
    kod = dtNormTxt(kod).replace(/\s+/g, '');
    ad = dtNormTxt(ad);
    const renk = dtNormTxt(renkRaw);
    const ebatN = dtExcelEbatNorm(ebatRaw);
    let best = -1;
    let bestSk = 0;
    (kalemler || []).forEach((k, i) => {
        let sk = 0;
        const kk = dtNormTxt(k.kod || '').replace(/\s+/g, '');
        const ka = dtNormTxt(k.ad || '');
        const kr = dtNormTxt(k.renk || '');
        const ke = dtExcelEbatNorm(k.ebat || k.olcu || '');
        if (kod && kk && (kk === kod || kk.includes(kod) || kod.includes(kk))) sk += 5;
        if (ad && ka && (ka.includes(ad) || ad.includes(ka))) sk += 3;
        if (!kod && !ad && urunTxt) {
            const ut = dtNormTxt(urunTxt);
            if (ka && (ka.includes(ut) || ut.includes(ka))) sk += 3;
            const utK = ut.replace(/\s+/g, '');
            if (kk && utK && (kk.includes(utK) || utK.includes(kk))) sk += 5;
        }
        if (renk && kr && (renk === kr || renk.includes(kr) || kr.includes(renk))) sk += 2;
        if (ebatN && ke && (ke === ebatN || ke.includes(ebatN) || ebatN.includes(ke))) sk += 2;
        if (sk > bestSk) { bestSk = sk; best = i; }
    });
    if (best >= 0 && bestSk >= 3) return best;
    if ((kalemler || []).length === 1) return 0;
    return -1;
}

function genelDurumDokumaEslestir(kalemler, hamSatirlar) {
    const eslesen = [];
    const hatali = [];
    for (const s of (hamSatirlar || [])) {
        const idx = genelDurumKalemBul(kalemler, s.urun, s.renk, s.ebat);
        if (idx >= 0) {
            eslesen.push({ index: idx, metre: s.metre, adKg: s.adKg, urun: s.urun, renk: s.renk, ebat: s.ebat, excelSatir: s.row });
        } else {
            hatali.push({ ...s, mesaj: 'Ürün adı / renk / ebat eşleşmedi' });
        }
    }
    return { eslesen, hatali };
}

function genelDurumDokumaOku(ws) {
    const satirlar = [];
    if (!ws) return satirlar;
    for (let row = GENEL_DURUM_DOKUMA.basSatir; row <= GENEL_DURUM_DOKUMA.bitSatir; row++) {
        const urun = siparisFormuHucre(ws, row, GENEL_DURUM_DOKUMA.colUrun);
        const renk = siparisFormuHucre(ws, row, GENEL_DURUM_DOKUMA.colRenk);
        const ebat = siparisFormuHucre(ws, row, GENEL_DURUM_DOKUMA.colEbat);
        const metre = siparisExcelHucreSayi(ws, row, GENEL_DURUM_DOKUMA.colMetre);
        const adKg = siparisExcelHucreSayi(ws, row, GENEL_DURUM_DOKUMA.colAdKg);
        if (!String(urun || '').trim() && !String(renk || '').trim() && !String(ebat || '').trim() && metre <= 0 && adKg <= 0) continue;
        if (metre <= 0 && adKg <= 0) continue;
        satirlar.push({ row, urun, renk, ebat, metre, adKg });
    }
    return satirlar;
}

function siparisGenelDurumDokumaEkle(wb, veri) {
    const gdAd = genelDurumSheetAdiBul(wb);
    if (!gdAd) return veri;
    veri.genelDurumDokuma = genelDurumDokumaOku(wb.Sheets[gdAd]);
    return veri;
}

async function genelDurumDokumaKdGuncelle(siparisId, satirlar, kalemler, opts = {}) {
    if (!siparisId || !satirlar?.length) return { ok: 0, atla: 0, deltalar: [] };
    const siparis = (dataCache.siparisler || []).find(s => String(s.id) === String(siparisId));
    const kd = await sbKdGet(siparisId, 'KD_DOKUMA', true) || {};
    if (!kd.urunler) kd.urunler = {};
    const tarih = new Date().toLocaleString('tr-TR');
    const userLabel = typeof dtCurrentUserLabel === 'function' ? dtCurrentUserLabel() : (erpCurrentUser?.display_name || erpCurrentUser?.username || 'Excel');
    let ok = 0;
    let atla = 0;
    const deltalar = [];
    satirlar.forEach(s => {
        const idx = parseInt(s.index, 10);
        if (!Number.isFinite(idx) || idx < 0) { atla++; return; }
        const kalem = kalemler[idx];
        if (!kalem && (parseFloat(s.metre) || 0) <= 0 && (parseFloat(s.adKg) || 0) <= 0) { atla++; return; }
        const metre = parseFloat(s.metre) || 0;
        const adKg = parseFloat(s.adKg) || 0;
        const birim = siparisKalemBirim(kalem || {});
        const key = String(idx);
        if (!kd.urunler[idx]) kd.urunler[idx] = { toplam_metre: 0, toplam_kg: 0, toplam_adet: 0, girisler: [] };
        if (!kd.urunler[key]) kd.urunler[key] = kd.urunler[idx];
        const u = kd.urunler[idx];
        // Önceki KD brüt toplam (Sipariş Takip ile aynı fark hesabı)
        const eskiMt = parseFloat(u.toplam_metre) || 0;
        const eskiKg = parseFloat(u.toplam_kg) || 0;
        const eskiAd = parseInt(u.toplam_adet, 10) || 0;
        const yeniKg = birim === 'KG' ? adKg : 0;
        const yeniAd = birim !== 'KG' ? Math.round(adKg) : 0;

        // Brüt üretim = Excel mutlak (Dokuma Takip / sipariş detay)
        u.toplam_metre = metre;
        if (birim === 'KG') {
            u.toplam_kg = adKg;
            u.toplam_adet = 0;
        } else {
            u.toplam_adet = Math.round(adKg);
            u.toplam_kg = 0;
        }

        // Depo kalan: yalnızca artış (Excel − önceki toplam). Sevk edilmiş kısım korunur.
        const dMt = Math.max(0, Math.round((metre - eskiMt) * 10) / 10);
        const dKg = Math.max(0, Math.round((yeniKg - eskiKg) * 10) / 10);
        const dAd = Math.max(0, yeniAd - eskiAd);
        if (!Array.isArray(u.girisler)) u.girisler = [];
        if (dMt > 0 || dKg > 0 || dAd > 0) {
            const nowIso = new Date().toISOString();
            u.girisler.push({
                metre: dMt || null,
                kg: birim === 'KG' ? (dKg || null) : null,
                adet: birim !== 'KG' ? (dAd || null) : null,
                tarih,
                tarih_iso: nowIso,
                kaynak: 'GENEL_DURUM_EXCEL',
                dosya: opts.kaynakDosya || '',
                stok_durumu: 'STOK',
                stok_otomatik: true
            });
            deltalar.push({ idx, metre: dMt, kg: dKg, adet: dAd });
        }
        kd.urunler[key] = u;
        ok++;
    });
    await sbKdSet(siparisId, 'KD_DOKUMA', kd);
    _kdCache[`KD_DOKUMA_${siparisId}`] = kd;
    if (ok > 0 && typeof dtPushHareket === 'function') {
        const farkAd = deltalar.reduce((s, d) => s + (d.adet || 0), 0);
        const farkMt = deltalar.reduce((s, d) => s + (d.metre || 0), 0);
        dtPushHareket({
            dosya: 'SIPARIS',
            islem: 'Genel Durum Excel — dokuma toplamları',
            siparis: siparis?.sno || String(siparisId),
            detay: `${ok} kalem güncellendi · depoya fark +${farkAd} ad / +${farkMt.toFixed(1)} m${opts.kaynakDosya ? ' · ' + opts.kaynakDosya : ''}`
        });
    }
    return { ok, atla, deltalar };
}

async function siparisGenelDurumDokumaUygula(veri, opts = {}) {
    const hamSatirlar = veri?.genelDurumDokuma || [];
    if (!hamSatirlar.length) {
        erpToast('Genel Durum sayfasında dokuma verisi yok (J: Mt, K: Ad/Kg).', 'warning', 5000);
        return false;
    }
    let snoNorm = normalizeSiparisNo(veri?.sno);
    if (!snoNorm && dtSeciliSiparisId) {
        const secili = (dataCache.siparisler || []).find(s => String(s.id) === String(dtSeciliSiparisId));
        if (secili?.sno) snoNorm = normalizeSiparisNo(secili.sno);
    }
    if (!snoNorm) {
        alert('Sipariş bulunamadı.\n\nDokuma Takip\'te sipariş seçin veya Excel\'de SİPARİŞ FORMU (C4) dolu olsun.');
        return false;
    }
    let siparis = (dataCache.siparisler || []).find(s => normalizeSiparisNo(s.sno) === snoNorm);
    if (!siparis?.id) {
        const { data: rows, error } = await sb.from('siparisler').select('id,sno,cins').limit(10000);
        if (error) throw error;
        siparis = (rows || []).find(s => normalizeSiparisNo(s.sno) === snoNorm);
        if (siparis?.id) {
            if (typeof erpSyncTablesBackground === 'function') erpSyncTablesBackground(['siparisler']);
            else if (typeof syncAllData === 'function') {
                syncAllData(false, { silent: true, light: true, tables: ['siparisler'], siparisFirstPageOnly: true }).catch(() => {});
            }
        }
    }
    if (!siparis?.id) {
        alert(`Sipariş sistemde yok: ${snoNorm}. Önce siparişi kaydedin veya sipariş noyu kontrol edin.`);
        return false;
    }
    let kalemler = (veri.kalemler || []).filter(siparisFormuKalemGecerli);
    if (!kalemler.length) {
        try { kalemler = typeof siparis.cins === 'string' ? JSON.parse(siparis.cins) : (siparis.cins || []); } catch (e) { kalemler = []; }
    }
    const { eslesen, hatali } = genelDurumDokumaEslestir(kalemler, hamSatirlar);
    if (!eslesen.length) {
        const detay = hatali.slice(0, 6).map(h => `  · ${h.urun || '—'} / ${h.renk || '—'} / ${h.ebat || '—'}`).join('\n');
        alert(`Eşleşen kalem yok.\n\nExcel satırları sipariş kalemleriyle (ürün adı, renk, ebat) eşleşmedi:\n${detay || '  (boş satır)'}`);
        return false;
    }
    const ozet = eslesen.map(s => {
        const k = kalemler[s.index];
        const lbl = k?.ad || k?.kod || s.urun || `Kalem ${s.index + 1}`;
        const birimLbl = siparisKalemBirim(k || {}) === 'KG' ? 'kg' : 'adet';
        return `  ${lbl} (${s.renk || '—'} · ${s.ebat || '—'}): ${s.metre} m / ${s.adKg} ${birimLbl}`;
    }).join('\n');
    const hataliOzet = hatali.length
        ? `\n\n⚠ ${hatali.length} satır atlanacak (eşleşmedi):\n` + hatali.slice(0, 8).map(h => `  · ${h.urun || '—'} / ${h.renk || '—'} / ${h.ebat || '—'}`).join('\n')
        : '';
    if (!opts.atlaOnay && !confirm(`${snoNorm}: ${eslesen.length} kalem güncellenecek.${hataliOzet}\n\n${ozet}\n\nDevam?`)) {
        return false;
    }
    const undoPkg = {
        type: 'genel_durum',
        at: new Date().toISOString(),
        satir: eslesen.length,
        sno: snoNorm,
        siparisler: {},
        stokIds: []
    };
    undoPkg.siparisler[siparis.id] = JSON.parse(JSON.stringify(await sbKdGet(siparis.id, 'KD_DOKUMA', true) || { urunler: {} }));
    const sonuc = await genelDurumDokumaKdGuncelle(siparis.id, eslesen, kalemler, opts);
    let stokSonuc = { ok: 0 };
    if (typeof dtGenelDurumDokumaDepoStokSenkron === 'function') {
        stokSonuc = await dtGenelDurumDokumaDepoStokSenkron(siparis.id, kalemler, {
            ...opts,
            undoCapture: true,
            deltalar: sonuc.deltalar || []
        });
        undoPkg.stokIds = stokSonuc.createdIds || [];
        undoPkg.stokOnceki = stokSonuc.updatedBefore || {};
    }
    try { localStorage.setItem(DT_EXCEL_UNDO_LS, JSON.stringify(undoPkg)); } catch (e) {}
    if (appMode === 'DOKUMA_TAKIP' && String(dtSeciliSiparisId) === String(siparis.id) && typeof renderDokumaTakip === 'function') {
        renderDokumaTakip();
    }
    if (hatali.length) {
        erpToast(`${snoNorm}: ${sonuc.ok} kalem aktarıldı, ${hatali.length} satır eşleşmedi.${(sonuc.deltalar || []).length ? ` · Depoya ${(sonuc.deltalar || []).length} fark satırı.` : ' · Depoya eklenecek yeni fark yok.'}`, 'warning', 8000);
    } else {
        const farkN = (sonuc.deltalar || []).length;
        erpToast(`${snoNorm}: ${sonuc.ok} kalem dokuma toplamı güncellendi.${farkN ? ` · Depoya ${farkN} kalem fark eklendi.` : ' · Depoya yeni fark yok (toplam aynı veya daha düşük).'}`, 'success', 7000);
    }
    return true;
}

async function genelDurumSheetDokumaIsle(wb, opts = {}) {
    const gdAd = genelDurumSheetAdiBul(wb);
    if (!gdAd) {
        erpToast('Genel Durum sekmesi bulunamadı.', 'error');
        return false;
    }
    const hamSatirlar = genelDurumDokumaOku(wb.Sheets[gdAd]);
    if (!hamSatirlar.length) {
        erpToast('Genel Durum: J (toplam m) ve K (toplam adet/kg) sütunlarında veri yok.', 'warning', 5000);
        return false;
    }
    const veri = { sno: '', kalemler: [], genelDurumDokuma: hamSatirlar };
    const formSheetAd = siparisFormuSheetAdiBul(wb);
    if (formSheetAd) {
        const formVeri = siparisFormuVeriOku(wb.Sheets[formSheetAd]);
        veri.sno = formVeri.sno || '';
        veri.kalemler = formVeri.kalemler || [];
    }
    if (!veri.sno && dtSeciliSiparisId) {
        const secili = (dataCache.siparisler || []).find(s => String(s.id) === String(dtSeciliSiparisId));
        if (secili?.sno) veri.sno = secili.sno;
    }
    return siparisGenelDurumDokumaUygula(veri, opts);
}

async function siparisFormuExcelGenelDurumDokumaIsle(wb, opts = {}) {
    return genelDurumSheetDokumaIsle(wb, opts);
}