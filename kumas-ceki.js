/**
 * Kumaş Çeki Listesi Sistemi
 * - Kumaş ÇIKIŞ formunda "Çeki Listesi Oluştur" butonuyla açılır
 * - Top top sıra no, metre, kg/ad girişi
 * - Veri kumas_stok notlar alanına [CEKI:JSON] tag olarak kaydedilir
 * - Depo hareketler listesindeki "Çeki" butonu bu veriyi okur ve gösterir
 */

// ─── State ───────────────────────────────────────────────────────────────────
let _kumasCekiSatirlar = [];   // { mt, kg, ad } dizisi (index = sıra no - 1)
let _kumasCekiKapasite = 100;  // şu an kaç satır gösteriliyor
const KUMAS_CEKI_SLOT = 25;    // her +ekle kaç satır ekler
const KUMAS_CEKI_KOLON = 5;    // A4'te yan yana sütun
const KUMAS_CEKI_SATIR = 25;   // her sütundaki sıra (5×25 = 125 top / sayfa)


function kumasCekiToplamlar() {
    let mt = 0, kg = 0, ad = 0;
    _kumasCekiSatirlar.forEach(s => {
        mt += parseFloat(s.mt) || 0;
        kg += parseFloat(s.kg) || 0;
        ad += parseInt(s.ad, 10) || 0;
    });
    return { mt: +mt.toFixed(3), kg: +kg.toFixed(3), ad };
}

function kumasCekiVeriJson() {
    const dolu = _kumasCekiSatirlar.map((s, i) => ({ no: i + 1, mt: s.mt || 0, kg: s.kg || 0, ad: s.ad || 0 }))
        .filter(s => s.mt > 0 || s.kg > 0 || s.ad > 0);
    return dolu;
}

// ─── Overlay açma/kapama ─────────────────────────────────────────────────────
function kumasCekiAc() {
    const ov = document.getElementById('kumas-ceki-overlay');
    if (ov && ov.dataset.cekiMod === 'form') {
        ov.classList.add('is-open');
        ov.style.display = 'flex';
        kumasCekiRenderTablo();
        return;
    }
    if (ov) ov.remove();
    // overlay html'i ekle
    const div = document.createElement('div');
    div.id = 'kumas-ceki-overlay';
    div.dataset.cekiMod = 'form';
    div.innerHTML = `
        <div class="kumas-ceki-box">
            <div class="kumas-ceki-head">
                <div>
                    <h3>ÇEKİ LİSTESİ</h3>
                    <div class="kumas-ceki-meta" id="kumas-ceki-stok-meta">Ürün seçilmedi</div>
                    <div class="kumas-ceki-musteri" id="kumas-ceki-musteri-meta"></div>
                </div>
                <div class="kumas-ceki-toolbar">
                    <button type="button" onclick="kumasCekiYazdir()">Yazdır</button>
                    <button type="button" onclick="kumasCekiPdfIndir()">PDF indir</button>
                    <button type="button" class="is-kapat" onclick="kumasCekiKapat()">Kapat</button>
                </div>
                <div class="kumas-ceki-acts">
                    <button type="button" onclick="kumasCekiEkle(${KUMAS_CEKI_SLOT})">+${KUMAS_CEKI_SLOT} top</button>
                    <button type="button" onclick="kumasCekiEkle(100)">+100 top</button>
                    <button type="button" onclick="kumasCekiTemizle()">Temizle</button>
                    <button type="button" class="is-save" onclick="kumasCekiKaydet()">Listeyi kaydet</button>
                </div>
            </div>
            <div class="kumas-ceki-ozet-bar">
                <span>Yüklenen top: <b id="ceki-ozet-top">0</b></span>
                <span>Toplam metre: <b id="ceki-ozet-mt">0</b></span>
                <span>Toplam kg: <b id="ceki-ozet-kg">0</b></span>
                <span>Kapasite: <b id="ceki-ozet-kap">${_kumasCekiKapasite}</b></span>
            </div>
            <div class="kumas-ceki-blocks" id="kumas-ceki-blocks"></div>
        </div>`;
    document.body.appendChild(div);
    div.classList.add('is-open');
    // Seçili ürün meta bilgisi
    const kod  = document.getElementById('val-stok-kodu')?.value || '';
    const urun = document.getElementById('val-cins')?.value || document.getElementById('ksel-cins')?.textContent || '';
    const musteri = String(document.getElementById('val-afirma')?.value || document.getElementById('val-firma-detay')?.value || '').trim();
    const metaEl = div.querySelector('#kumas-ceki-stok-meta');
    const musEl = div.querySelector('#kumas-ceki-musteri-meta');
    const tp = kumasCekiTeslimPlakaOku();
    if (metaEl) metaEl.textContent = [kod, urun].filter(x => x && String(x).trim()).join(' - ') || 'Ürün seçilmedi';
    if (musEl) {
        const parcalar = [];
        if (musteri) parcalar.push('Müşteri: ' + musteri);
        if (tp.teslim) parcalar.push('Teslim alan: ' + tp.teslim);
        if (tp.plaka) parcalar.push('Plaka: ' + tp.plaka);
        musEl.textContent = parcalar.join(' · ');
    }
    kumasCekiRenderTablo();
}

function kumasCekiKapat() {
    const ov = document.getElementById('kumas-ceki-overlay');
    if (!ov) return;
    ov.classList.remove('is-open');
    ov.style.display = 'none';
}

// ─── Tablo render ─────────────────────────────────────────────────────────────
function kumasCekiRenderTablo() {
    const container = document.getElementById('kumas-ceki-blocks');
    if (!container) return;

    // eksik satırları doldur
    while (_kumasCekiSatirlar.length < _kumasCekiKapasite)
        _kumasCekiSatirlar.push({ mt: '', kg: '', ad: '' });

    // A4: 5 sütun × 25 sıra
    const GRUP = KUMAS_CEKI_SATIR;
    const kolonSayisi = Math.ceil(_kumasCekiKapasite / GRUP);
    let html = '';
    for (let blokBaslat = 0; blokBaslat < kolonSayisi; blokBaslat += KUMAS_CEKI_KOLON) {
        const blokBitis = Math.min(blokBaslat + KUMAS_CEKI_KOLON, kolonSayisi);
        html += `<div class="kumas-ceki-block">`;
        for (let k = blokBaslat; k < blokBitis; k++) {
            const baslangic = k * GRUP;
            const bitis = Math.min(baslangic + GRUP, _kumasCekiKapasite);
            const satirHtml = Array.from({ length: bitis - baslangic }, (_, i) => {
                const idx = baslangic + i;
                const s = _kumasCekiSatirlar[idx] || { mt: '', kg: '', ad: '' };
                return `<tr>
                    <td class="no">${idx + 1}</td>
                    <td><input type="number" min="0" step="0.01" value="${s.mt || ''}"
                        oninput="kumasCekiGuncelle(${idx},'mt',this.value)"
                        onfocus="this.select()" placeholder="" autocomplete="off"></td>
                    <td><input type="number" min="0" step="0.01" value="${s.kg !== undefined ? (s.kg || '') : (s.ad || '')}"
                        oninput="kumasCekiGuncelle(${idx},'kg',this.value)"
                        onfocus="this.select()" placeholder="" autocomplete="off"></td>
                </tr>`;
            }).join('');
            // toplam satırı
            const kolMt = Array.from({ length: bitis - baslangic }, (_, i) => parseFloat(_kumasCekiSatirlar[baslangic + i]?.mt) || 0).reduce((a, b) => a + b, 0);
            const kolKg = Array.from({ length: bitis - baslangic }, (_, i) => parseFloat(_kumasCekiSatirlar[baslangic + i]?.kg) || 0).reduce((a, b) => a + b, 0);
            html += `<div class="kumas-ceki-col">
                <table>
                    <thead><tr>
                        <th class="no">Sıra No</th>
                        <th>Metre</th>
                        <th>Kg/Ad</th>
                    </tr></thead>
                    <tbody>${satirHtml}</tbody>
                    <tfoot><tr>
                        <td class="no">∑</td>
                        <td id="ceki-kol-mt-${k}">${kolMt > 0 ? kolMt.toFixed(2) : ''}</td>
                        <td id="ceki-kol-kg-${k}">${kolKg > 0 ? kolKg.toFixed(2) : ''}</td>
                    </tr></tfoot>
                </table>
            </div>`;
        }
        html += `</div>`;
    }
    container.innerHTML = html;
    kumasCekiOzetGuncelle();
}

// ─── Güncelleme ─────────────────────────────────────────────────────────────
function kumasCekiGuncelle(idx, alan, deger) {
    if (!_kumasCekiSatirlar[idx]) _kumasCekiSatirlar[idx] = { mt: '', kg: '', ad: '' };
    _kumasCekiSatirlar[idx][alan] = parseFloat(deger) || 0;
    kumasCekiOzetGuncelle();
    // Kolon toplamını güncelle
    const GRUP = 25;
    const kolonIdx = Math.floor(idx / GRUP);
    const baslangic = kolonIdx * GRUP;
    const bitis = Math.min(baslangic + GRUP, _kumasCekiKapasite);
    const kolMt = Array.from({ length: bitis - baslangic }, (_, i) => parseFloat(_kumasCekiSatirlar[baslangic + i]?.mt) || 0).reduce((a, b) => a + b, 0);
    const kolKg = Array.from({ length: bitis - baslangic }, (_, i) => parseFloat(_kumasCekiSatirlar[baslangic + i]?.kg) || 0).reduce((a, b) => a + b, 0);
    const mtEl = document.getElementById('ceki-kol-mt-' + kolonIdx);
    const kgEl = document.getElementById('ceki-kol-kg-' + kolonIdx);
    if (mtEl) mtEl.textContent = kolMt > 0 ? kolMt.toFixed(2) : '';
    if (kgEl) kgEl.textContent = kolKg > 0 ? kolKg.toFixed(2) : '';
}

function kumasCekiOzetGuncelle() {
    const t = kumasCekiToplamlar();
    const dolu = _kumasCekiSatirlar.filter(s => (parseFloat(s.mt) || 0) > 0 || (parseFloat(s.kg) || 0) > 0).length;
    const topEl  = document.getElementById('ceki-ozet-top');
    const mtEl   = document.getElementById('ceki-ozet-mt');
    const kgEl   = document.getElementById('ceki-ozet-kg');
    const kapEl  = document.getElementById('ceki-ozet-kap');
    if (topEl) topEl.textContent = dolu;
    if (mtEl)  mtEl.textContent  = t.mt > 0 ? t.mt.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) : '0';
    if (kgEl)  kgEl.textContent  = t.kg > 0 ? t.kg.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) : '0';
    if (kapEl) kapEl.textContent = _kumasCekiKapasite + ' / ' + _kumasCekiSatirlar.length;
}

function kumasCekiEkle(sayi) {
    _kumasCekiKapasite += sayi;
    kumasCekiRenderTablo();
}

function kumasCekiTemizle() {
    if (!confirm('Çeki listesi sıfırlansın mı?')) return;
    _kumasCekiSatirlar = [];
    _kumasCekiKapasite = 100;
    kumasCekiRenderTablo();
    kumasCekiFormOzetSifirla();
}

// ─── Kaydet (forma geri yaz) ─────────────────────────────────────────────────
function kumasCekiKaydet() {
    const dolu = kumasCekiVeriJson();
    if (!dolu.length) {
        if (typeof erpToast === 'function') erpToast('Çeki listesi boş.', 'warn');
        return;
    }
    const t = kumasCekiToplamlar();
    // Formdaki kg ve mt alanlarını otomatik doldur
    const kgInput = document.getElementById('val-kg');
    const mtInput = document.getElementById('val-mt');
    const cuvalInput = document.getElementById('val-cuval-kumas');
    if (kgInput && t.kg > 0) { kgInput.value = t.kg.toFixed(3); }
    if (mtInput && t.mt > 0) { mtInput.value = t.mt.toFixed(3); }
    if (kgInput && !(t.kg > 0) && t.mt > 0) {
        const birim = document.getElementById('val-miktar-birim');
        if (birim) birim.value = 'MT';
        kgInput.value = t.mt.toFixed(3);
        if (typeof depoMiktarBirimDegisti === 'function') depoMiktarBirimDegisti();
    }
    if (cuvalInput) { cuvalInput.value = dolu.length; }
    // preview güncelle
    if (typeof updateKumasPreview === 'function') updateKumasPreview();
    // Özet göster
    const ozet = document.getElementById('kumas-ceki-form-ozet');
    if (ozet) {
        ozet.classList.add('is-on');
        ozet.innerHTML = `✅ Çeki listesi hazır: <strong>${dolu.length} top</strong>, ${t.mt > 0 ? t.mt.toLocaleString('tr-TR', {maximumFractionDigits:2})+' mt · ' : ''}${t.kg > 0 ? t.kg.toLocaleString('tr-TR', {maximumFractionDigits:2})+' kg' : ''}`;
    }
    kumasCekiKapat();
    if (typeof erpToast === 'function') erpToast('Çeki listesi kaydedildi. Kayıt butonuyla stok hareketini onaylayın.', 'success', 5000);
}

function kumasCekiFormOzetSifirla() {
    const ozet = document.getElementById('kumas-ceki-form-ozet');
    if (ozet) { ozet.classList.remove('is-on'); ozet.innerHTML = ''; }
}

// ─── Notlar tag olarak veri al ───────────────────────────────────────────────
function kumasCekiNotlarEkle(mevcutNotlar) {
    const dolu = kumasCekiVeriJson();
    if (!dolu.length) return mevcutNotlar || '';
    const t = kumasCekiToplamlar();
    const json = JSON.stringify(dolu);
    const ozet = `${dolu.length} top · ${t.mt > 0 ? t.mt.toFixed(2)+' mt · ' : ''}${t.kg > 0 ? t.kg.toFixed(2)+' kg' : ''}`.trim().replace(/\s·\s$/, '');
    let out = String(mevcutNotlar || '').replace(/\s*\[CEKI:[^\]]+\]\s*/gi, '').replace(/\s*\[CEKI_TOP:[^\]]+\]\s*/gi, '').replace(/\s*\[CEKI_OZET:[^\]]+\]\s*/gi, '').trim();
    out += (out ? '\n' : '') + `[CEKI:${json}]\n[CEKI_TOP:${dolu.length}]\n[CEKI_OZET:${ozet}]`;
    return out;
}

// ─── Notlardan veri oku ve göster ────────────────────────────────────────────
// İki kayıt biçimi var:
//   1) JSON  [CEKI:[{"no":1,"mt":12.5,"kg":3}, ...]]
//   2) Sıkışık (eski toplu sevk)  [CEKI:12.5/3|13|14.2/1.1]
function kumasCekiSatirlariNormalize(arr) {
    if (!Array.isArray(arr) || !arr.length) return null;
    let topNo = 0;
    const out = arr.map((x, i) => {
        if (x == null) return null;
        if (typeof x === 'object' && String(x.tip || '').toLowerCase() === 'ayrac') {
            const etiket = String(x.etiket || x.baslik || x.renk || '').trim();
            if (!etiket) return null;
            return { tip: 'ayrac', etiket };
        }
        if (typeof x === 'number') {
            topNo++;
            return { no: topNo, mt: x, kg: 0 };
        }
        if (typeof x === 'string') {
            const p = x.split('/');
            topNo++;
            return { no: topNo, mt: parseFloat(p[0]) || 0, kg: parseFloat(p[1]) || 0 };
        }
        const mt = parseFloat(x.mt) || 0;
        const kg = parseFloat(x.kg) || parseFloat(x.ad) || 0;
        if (mt <= 0 && kg <= 0) return null;
        topNo++;
        return { no: parseInt(x.no, 10) || topNo, mt, kg };
    }).filter(Boolean);
    return out.length ? out : null;
}

function kumasCekiNotlarOku(notlar) {
    const s = String(notlar || '');
    const idx = s.search(/\[CEKI:/i);
    if (idx < 0) return null;
    const start = s.indexOf(':', idx) + 1;
    const rest = s.slice(start);
    if (!rest) return null;

    if (rest[0] === '[') {
        let depth = 0;
        for (let i = 0; i < rest.length; i++) {
            const ch = rest[i];
            if (ch === '[') depth++;
            else if (ch === ']') {
                depth--;
                if (depth === 0) {
                    try { return kumasCekiSatirlariNormalize(JSON.parse(rest.slice(0, i + 1))); }
                    catch (e) { break; }
                }
            }
        }
    }

    const end = rest.indexOf(']');
    if (end < 0) return null;
    const compact = rest.slice(0, end).trim();
    if (!compact) return null;
    if (compact[0] === '{') {
        try { return kumasCekiSatirlariNormalize(JSON.parse('[' + compact + ']')); } catch (e) {}
    }
    return kumasCekiSatirlariNormalize(compact.split('|').filter(Boolean));
}

function kumasCekiUrunAdiBul(row) {
    if (!row) return '';
    if (typeof muhasebeFisKalemFromPayload === 'function' && (row.stok_kodu || row.kumas_cinsi || row.urun_adi)) {
        const k = muhasebeFisKalemFromPayload(row, 'KUMAS');
        if (k && k.urun_adi) return String(k.urun_adi).trim();
    }
    return String(row.urun_adi || row.ad || row.desen_adi || row.kumas_cinsi || '').trim();
}
function kumasCekiTeslimPlakaNotlardan(notlar) {
    if (typeof muhasebeFisNotMetaOku === 'function') {
        return {
            teslim: muhasebeFisNotMetaOku(notlar, 'TESLIM_ALAN') || '',
            plaka: muhasebeFisNotMetaOku(notlar, 'PLAKA') || ''
        };
    }
    const s = String(notlar || '');
    const pick = tag => {
        const m = s.match(new RegExp('\\[' + tag + ':([^\\]]+)\\]', 'i'));
        return m ? m[1].trim() : '';
    };
    return { teslim: pick('TESLIM_ALAN'), plaka: pick('PLAKA') };
}
function kumasCekiTeslimPlakaOku(extra, notlar) {
    const o = (extra && typeof extra === 'object') ? extra : {};
    let teslim = String(o.teslim || o.teslim_alan || '').trim();
    let plaka = String(o.plaka || '').trim();
    const notKaynak = notlar || o.notlar || '';
    if ((!teslim || !plaka) && notKaynak) {
        const fromNot = kumasCekiTeslimPlakaNotlardan(notKaynak);
        if (!teslim) teslim = fromNot.teslim;
        if (!plaka) plaka = fromNot.plaka;
    }
    if (!teslim || !plaka) {
        if (typeof muhasebeFisTeslimFormOku === 'function') {
            const t = muhasebeFisTeslimFormOku();
            if (!teslim) teslim = String(t.teslim_alan || '').trim();
            if (!plaka) plaka = String(t.plaka || '').trim();
        } else {
            if (!teslim) teslim = String(document.getElementById('val-teslim-alan')?.value || '').trim().toUpperCase();
            if (!plaka) plaka = String(document.getElementById('val-plaka')?.value || '').trim().toUpperCase();
        }
    }
    return { teslim, plaka };
}
function kumasCekiMetaNormalize(input, row, notlar) {
    const o = (input && typeof input === 'object' && !Array.isArray(input)) ? input : {};
    const stok = String(o.stok_kodu || o.kod || (row && (row.stok_kodu || row.kod)) || '').trim();
    let urun = String(o.urun_adi || o.ad || '').trim();
    if (!urun && row) urun = kumasCekiUrunAdiBul(row);
    let musteri = String(o.musteri || o.firma || (row && (row.firma || row.musteri)) || '').trim();
    let urunSatir = String(o.urunSatir || o.baslik || '').trim();
    if (!urunSatir) urunSatir = [stok, urun].filter(Boolean).join(' - ');
    if (!urunSatir && typeof input === 'string') urunSatir = String(input).trim();
    if (!urunSatir) urunSatir = '—';
    const tp = kumasCekiTeslimPlakaOku(o, notlar || o.notlar || (row && row.notlar));
    return {
        stok_kodu: stok,
        urun_adi: urun,
        musteri,
        urunSatir: urunSatir || '—',
        teslim: tp.teslim,
        plaka: tp.plaka,
        tarih: o.tarih || '',
        otoyazdir: !!o.otoyazdir
    };
}
function kumasCekiEsc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function kumasCekiGoster(notlar, baslikBilgi) {
    const satirlar = kumasCekiNotlarOku(notlar);
    if (!satirlar || !satirlar.length) {
        if (typeof erpToast === 'function') erpToast('Bu harekette çeki listesi verisi yok.', 'warn');
        return;
    }
    kumasCekiGosterSatirlar(satirlar, baslikBilgi);
}

/** Eski çeki tablosu: Sıra No · Metre · Kg/Ad. Araya renk ayırıcı satırı gelebilir. */
function kumasCekiKolonHtmlUret(satirlar) {
    const list = Array.isArray(satirlar) ? satirlar : [];
    const GRUP = KUMAS_CEKI_SATIR;
    const kolonSayisi = Math.max(1, Math.ceil(list.length / GRUP));
    let kolonHtml = '';
    for (let k = 0; k < kolonSayisi; k++) {
        const baslangic = k * GRUP;
        const kisim = list.slice(baslangic, baslangic + GRUP);
        const satirHtml = kisim.map(s => {
            if (s && s.tip === 'ayrac') {
                return `<tr class="kumas-ceki-ayrac">
                    <td colspan="3" style="text-align:left;font-weight:800;font-size:11px;background:#f1f5f9;padding:4px 6px">${kumasCekiEsc(s.etiket || '')}</td>
                </tr>`;
            }
            return `<tr>
                <td class="no">${s.no}</td>
                <td>${s.mt > 0 ? (+s.mt).toLocaleString('tr-TR', {maximumFractionDigits:2}) : ''}</td>
                <td>${s.kg > 0 ? (+s.kg).toLocaleString('tr-TR', {maximumFractionDigits:2}) : ''}</td>
            </tr>`;
        }).join('');
        const kolMt = kisim.reduce((a, s) => a + (s && s.tip === 'ayrac' ? 0 : (parseFloat(s.mt) || 0)), 0);
        const kolKg = kisim.reduce((a, s) => a + (s && s.tip === 'ayrac' ? 0 : (parseFloat(s.kg) || 0)), 0);
        kolonHtml += `<div class="kumas-ceki-col">
            <table>
                <thead><tr><th class="no">Sıra No</th><th>Metre</th><th>Kg/Ad</th></tr></thead>
                <tbody>${satirHtml}</tbody>
                <tfoot><tr>
                    <td class="no">∑</td>
                    <td>${kolMt > 0 ? kolMt.toFixed(2) : ''}</td>
                    <td>${kolKg > 0 ? kolKg.toFixed(2) : ''}</td>
                </tr></tfoot>
            </table>
        </div>`;
    }
    return kolonHtml;
}

function kumasCekiGosterSatirlar(satirlarIn, baslikBilgi) {
    const satirlar = Array.isArray(satirlarIn)
        ? (typeof kumasCekiSatirlariNormalize === 'function' ? (kumasCekiSatirlariNormalize(satirlarIn) || satirlarIn) : satirlarIn)
        : [];
    if (!satirlar.length) {
        if (typeof erpToast === 'function') erpToast('Çeki listesi boş.', 'warn');
        return;
    }
    const topSatirlar = satirlar.filter(s => !(s && s.tip === 'ayrac'));
    const t = topSatirlar.reduce((acc, s) => {
        acc.mt += parseFloat(s.mt) || 0;
        acc.kg += parseFloat(s.kg) || 0;
        return acc;
    }, { mt: 0, kg: 0 });

    const meta = kumasCekiMetaNormalize(baslikBilgi);
    const metaEnc = encodeURIComponent(JSON.stringify({
        stok_kodu: meta.stok_kodu,
        urun_adi: meta.urun_adi,
        musteri: meta.musteri,
        teslim: meta.teslim,
        plaka: meta.plaka,
        urunSatir: meta.urunSatir,
        baslik: meta.urunSatir
    }));
    let ov = document.getElementById('kumas-ceki-goruntule-overlay');
    if (ov) ov.remove();
    ov = document.createElement('div');
    ov.id = 'kumas-ceki-goruntule-overlay';
    ov.classList.add('is-open');
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147482600;background:rgba(8,12,24,0.6);display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;padding:0;box-sizing:border-box';
    ov.innerHTML = `
        <div class="kumas-ceki-box">
            <div class="kumas-ceki-head">
                <div>
                    <h3>ÇEKİ LİSTESİ</h3>
                    <div class="kumas-ceki-meta">${kumasCekiEsc(meta.urunSatir)}</div>
                    ${meta.musteri ? `<div class="kumas-ceki-musteri">Müşteri: ${kumasCekiEsc(meta.musteri)}</div>` : ''}
                    <div class="kumas-ceki-musteri">Teslim alan: ${kumasCekiEsc(meta.teslim || '—')} · Plaka: ${kumasCekiEsc(meta.plaka || '—')}</div>
                </div>
                <div class="kumas-ceki-toolbar">
                    <button type="button" onclick="kumasCekiGosteriYazdir('${encodeURIComponent(JSON.stringify(satirlar))}','${metaEnc}')">Yazdır</button>
                    <button type="button" onclick="kumasCekiGosteriPdfIndir('${encodeURIComponent(JSON.stringify(satirlar))}','${metaEnc}')">PDF indir</button>
                    <button type="button" class="is-kapat" onclick="kumasCekiGoruntuleKapat()">Kapat</button>
                </div>
            </div>
            <div class="kumas-ceki-ozet-bar">
                <span>Top sayısı: <b>${topSatirlar.length}</b></span>
                <span>Toplam metre: <b>${t.mt > 0 ? t.mt.toLocaleString('tr-TR',{maximumFractionDigits:2}) : '—'}</b></span>
                <span>Toplam kg: <b>${t.kg > 0 ? t.kg.toLocaleString('tr-TR',{maximumFractionDigits:2}) : '—'}</b></span>
            </div>
            <div class="kumas-ceki-blocks" style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;padding:8px">
                ${kumasCekiKolonHtmlUret(satirlar)}
            </div>
        </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e) { if (e.target === ov) kumasCekiGoruntuleKapat(); });
}

function kumasCekiGoruntuleKapat() {
    const ov = document.getElementById('kumas-ceki-goruntule-overlay');
    if (ov) ov.remove();
}

// ─── Yazdır ─────────────────────────────────────────────────────────────────
function kumasCekiYazdir() {
    const dolu = kumasCekiVeriJson();
    if (!dolu.length) { if (typeof erpToast === 'function') erpToast('Liste boş.', 'warn'); return; }
    const kod  = document.getElementById('val-stok-kodu')?.value || '';
    const urun = document.getElementById('val-cins')?.value || document.getElementById('ksel-cins')?.textContent || '';
    const musteri = String(document.getElementById('val-afirma')?.value || document.getElementById('val-firma-detay')?.value || '').trim();
    const tp = kumasCekiTeslimPlakaOku();
    kumasCekiA4Yazdir(dolu, { stok_kodu: kod, urun_adi: urun, musteri, teslim: tp.teslim, plaka: tp.plaka });
}

/** A4 dikey, 5 sütun × 25 sıra. Hem ekran Yazdır hem muhasebe/depo çıktısı bunu kullanır. */
function kumasCekiA4Html(satirlar, meta) {
    const info = kumasCekiMetaNormalize(meta);
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const sayi = (v) => {
        const n = parseFloat(String(v ?? '').replace(',', '.').replace(/\s/g, ''));
        return Number.isFinite(n) ? n : 0;
    };
    const fmt = (n) => {
        const v = sayi(n);
        return v > 0 ? v.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) : '';
    };
    const COLS = KUMAS_CEKI_KOLON;
    const ROWS = KUMAS_CEKI_SATIR;
    const PAGE = COLS * ROWS;
    const list = Array.isArray(satirlar)
        ? (typeof kumasCekiSatirlariNormalize === 'function' ? (kumasCekiSatirlariNormalize(satirlar) || satirlar) : satirlar)
        : [];
    /* Fiziksel satırlar (top + renk ayırıcı) sırayla dolsun */
    const slots = list.map(s => {
        if (s && s.tip === 'ayrac') return { ayrac: true, etiket: String(s.etiket || '').trim() };
        return {
            ayrac: false,
            no: s && s.no,
            mt: sayi(s && s.mt),
            kg: sayi(s && s.kg) || sayi(s && s.ad)
        };
    });
    const t = slots.reduce((a, s) => {
        if (!s || s.ayrac) return a;
        a.mt += s.mt; a.kg += s.kg; if (s.mt > 0 || s.kg > 0) a.top++;
        return a;
    }, { mt: 0, kg: 0, top: 0 });
    const maxNo = Math.max(slots.length, 1);
    const n = Math.max(PAGE, Math.ceil(maxNo / PAGE) * PAGE);

    let pages = '';
    for (let b = 0; b < n; b += PAGE) {
        pages += '<div class="ceki-page">';
        for (let c = 0; c < COLS; c++) {
            const start = b + c * ROWS;
            const end = start + ROWS;
            let mt = 0, kg = 0, rows = '';
            for (let i = start; i < end; i++) {
                const s = slots[i];
                if (s && s.ayrac) {
                    rows += `<tr class="ayrac"><td colspan="3">${esc(s.etiket)}</td></tr>`;
                } else {
                    const row = s || { mt: 0, kg: 0, no: '' };
                    mt += row.mt || 0; kg += row.kg || 0;
                    const noYazi = (row.no != null && row.no !== '') ? row.no : (s ? (i + 1) : (i + 1));
                    rows += `<tr><td class="no">${s ? noYazi : (i + 1)}</td><td>${fmt(row.mt)}</td><td>${fmt(row.kg)}</td></tr>`;
                }
            }
            pages += `<div class="ceki-col"><table>
                <thead><tr><th>Sıra</th><th>Metre</th><th>Kg/Ad</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr><td>∑</td><td>${esc(fmt(mt))}</td><td>${esc(fmt(kg))}</td></tr></tfoot>
            </table></div>`;
        }
        pages += '</div>';
    }

    const tarih = info.tarih || new Date().toLocaleDateString('tr-TR');
    return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">
    <title>Çeki Listesi — SİMTEKS</title>
    <style>
      @page { size: A4 portrait; margin: 5mm 4mm; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; color: #111;
        font-family: 'Segoe UI', Arial, sans-serif; }
      @media print { .no-print { display: none !important; } .wrap { page-break-inside: avoid; } }
      .wrap { width: 100%; max-width: 202mm; margin: 0 auto; }
      .head { display: flex; justify-content: space-between; align-items: flex-end;
        border-bottom: 2px solid #111; padding-bottom: 2.5mm; margin-bottom: 2mm; }
      .doc-b { font-size: 15px; font-weight: 800; line-height: 1.2; }
      .doc-m { font-size: 12px; font-weight: 700; margin-top: 2px; }
      .doc-t { font-size: 10px; color: #555; }
      .oz { display: flex; gap: 6mm; font-size: 11px; font-weight: 800; margin-bottom: 2mm; }
      .teslim-bar {
        display: flex; flex-wrap: wrap; gap: 6mm 10mm; font-size: 11px;
        margin-bottom: 2.5mm; padding: 2mm 2.5mm; border: 1px solid #bbb; background: #f7f7f7;
      }
      .teslim-bar div { display: flex; gap: 2mm; align-items: baseline; min-width: 0; }
      .teslim-bar span { color: #666; font-size: 8px; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }
      .teslim-bar b { font-weight: 800; word-break: break-word; }
      .ceki-page {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 1.2mm;
        width: 100%;
        max-width: 100%;
      }
      .ceki-page + .ceki-page { page-break-before: always; margin-top: 2mm; }
      .ceki-col { border: 1px solid #111; min-width: 0; overflow: hidden; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td {
        border: 1px solid #111; text-align: center; font-size: 9px; height: 7.2mm;
        padding: 0 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.15;
      }
      th { background: #eee; font-size: 8.5px; font-weight: 800; height: 6.4mm; }
      .no { width: 24%; background: #f4f4f4; font-weight: 700; font-family: Consolas, monospace; }
      tr.ayrac td { background: #e8e8e8; font-weight: 800; font-size: 8px; text-align: left; padding: 0 3px; }
      tfoot td { background: #f0f0f0; font-weight: 800; height: 6.4mm; font-size: 9px; }
      .imza { margin-top: 4mm; display: flex; justify-content: space-between; }
      .imza div { text-align: center; width: 48mm; }
      .imza i { display: block; border-top: 1px solid #999; margin: 0 auto 2px; width: 42mm; font-style: normal; min-height: 5mm; font-size: 10px; font-weight: 700; }
      .imza span { font-size: 8px; color: #666; text-transform: uppercase; letter-spacing: .06em; }
    </style></head><body>
    <button class="no-print" onclick="window.print()" style="position:fixed;top:8px;right:8px;padding:8px 14px;background:#111;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;z-index:9">🖨 Yazdır</button>
    <div class="wrap">
      <div class="head">
        <div>
          <div class="doc-b">${esc(info.urunSatir)}</div>
          ${info.musteri ? `<div class="doc-m">Müşteri: ${esc(info.musteri)}</div>` : ''}
        </div>
        <div class="doc-t">${esc(tarih)}</div>
      </div>
      <div class="oz">
        <span>${t.top} top</span>
        <span>${esc(fmt(t.mt) || '0')} mt</span>
        <span>${esc(fmt(t.kg) || '0')} kg</span>
      </div>
      <div class="teslim-bar">
        <div><span>Teslim alan</span><b>${esc(info.teslim || '—')}</b></div>
        <div><span>Araç plaka</span><b>${esc(info.plaka || '—')}</b></div>
      </div>
      ${pages}
      <div class="imza">
        <div><i></i><span>Teslim Eden</span></div>
        <div><i>${esc(info.teslim || '')}</i><span>Teslim Alan</span></div>
        <div><i>${esc(info.plaka || '')}</i><span>Plaka</span></div>
      </div>
    </div>
    </body></html>`;
}

function kumasCekiPdfSatirYukseklikAyarla(root, contentMaxPx) {
    const wrap = root.querySelector('.wrap');
    if (!wrap) return;
    const fixed = ['.head', '.oz', '.teslim-bar', '.imza'].reduce((s, sel) => {
        const el = wrap.querySelector(sel);
        return s + (el ? el.offsetHeight : 0);
    }, 0);
    const page = wrap.querySelector('.ceki-page');
    if (!page) return;
    const budget = Math.max(220, contentMaxPx - fixed - 10);
    const tbody = page.querySelector('tbody');
    const rowCount = tbody ? tbody.querySelectorAll('tr').length : KUMAS_CEKI_SATIR;
    const theadH = 18;
    const tfootH = 18;
    // Satır yüksekliğini sayfaya yay; kare/boş hücre için üst sınır koy
    const rawH = Math.floor((budget - theadH - tfootH) / Math.max(rowCount, 1));
    const rowH = Math.max(16, Math.min(24, rawH));
    const bodyFont = Math.max(9, Math.min(11, Math.floor(rowH * 0.52)));
    const headFont = Math.max(8, bodyFont - 1);
    page.querySelectorAll('thead th').forEach(el => {
        el.style.height = theadH + 'px';
        el.style.fontSize = headFont + 'px';
        el.style.padding = '0 2px';
        el.style.lineHeight = '1.15';
    });
    page.querySelectorAll('tfoot td').forEach(el => {
        el.style.height = tfootH + 'px';
        el.style.fontSize = bodyFont + 'px';
        el.style.lineHeight = '1.15';
    });
    page.querySelectorAll('tbody tr').forEach(el => { el.style.height = rowH + 'px'; });
    page.querySelectorAll('tbody td').forEach(el => {
        el.style.height = rowH + 'px';
        el.style.lineHeight = rowH + 'px';
        el.style.fontSize = bodyFont + 'px';
        el.style.padding = '0 2px';
    });
}

function erpBelgeDosyaAdi(ad) {
    return String(ad || 'belge').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_').slice(0, 80);
}

function erpBelgeHtmlGovde(html) {
    const s = String(html || '');
    const head = s.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const body = s.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return (head ? head[1] : '') + (body ? body[1] : (head ? '' : s));
}

function erpBelgeYazdir(html, title) {
    if (typeof erpPrintHtml === 'function') {
        erpPrintHtml(html, { title: title || 'Yazdır' });
        return true;
    }
    const w = window.open('', '_blank', 'width=900,height=1200');
    if (w) {
        try {
            w.document.open();
            w.document.write(html);
            w.document.close();
            setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 250);
            return true;
        } catch (e) {}
    }
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:0';
    document.body.appendChild(iframe);
    try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(() => {
            try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch (e) {}
            setTimeout(() => { try { iframe.remove(); } catch (e) {} }, 1500);
        }, 400);
        return true;
    } catch (e) {
        try { iframe.remove(); } catch (e2) {}
        if (typeof erpToast === 'function') erpToast('Yazdırma açılamadı.', 'error');
        return false;
    }
}

async function erpBelgePdfIndir(html, dosyaAdi) {
    const ad = erpBelgeDosyaAdi(dosyaAdi).replace(/\.pdf$/i, '') + '.pdf';
    if (typeof erpEnsureHtml2Pdf === 'function') {
        try { await erpEnsureHtml2Pdf(); } catch (e) {}
    }
    if (typeof html2pdf !== 'function') {
        try {
            await new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                s.onload = () => resolve();
                s.onerror = () => reject(new Error('html2pdf yüklenemedi'));
                document.head.appendChild(s);
            });
        } catch (e) {}
    }
    if (typeof html2pdf !== 'function') {
        if (typeof erpToast === 'function') erpToast('PDF için yazdırma ekranından “PDF olarak kaydet” seçin.', 'info');
        erpBelgeYazdir(html, ad);
        return;
    }

    // html2canvas iframe içindeki elementi yanlış keser (boş / kırpık PDF).
    // Belgeyi ana document'te geçici host'a koyup oradan yakalıyoruz.
    const old = document.getElementById('erp-pdf-capture-host');
    if (old) try { old.remove(); } catch (e) {}

    const host = document.createElement('div');
    host.id = 'erp-pdf-capture-host';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = [
        'position:fixed',
        'left:0',
        'top:0',
        'width:794px',
        'max-width:794px',
        'background:#ffffff',
        'color:#111111',
        'z-index:2147483646',
        'opacity:1',
        'pointer-events:none',
        'overflow:visible',
        'box-sizing:border-box',
        'padding:0',
        'margin:0'
    ].join(';');

    const root = document.createElement('div');
    root.className = 'erp-pdf-root';
    root.style.cssText = 'width:794px;max-width:794px;background:#fff;color:#111;box-sizing:border-box;';
    root.innerHTML = erpBelgeHtmlGovde(html);
    // Harici img CORS / taint riskini kaldır
    Array.from(root.querySelectorAll('img')).forEach(img => { try { img.remove(); } catch (e) {} });
    // mm ölçüleri html2canvas'ta kaydırma yapabiliyor → px'e zorla
    const isCekiBelge = !!root.querySelector('.ceki-page');
    // A4 (210mm) − html2pdf kenar boşlukları ≈ yazdırılabilir alan
    const pdfMarginMm = isCekiBelge ? 4 : 8;
    const pdfContentPx = isCekiBelge
        ? Math.round((210 - pdfMarginMm * 2) * 96 / 25.4)
        : 794;
    const pdfContentHpx = Math.round((297 - pdfMarginMm * 2) * 96 / 25.4);
    const pageEl = root.querySelector('.page, .wrap');
    if (pageEl) {
        pageEl.style.width = pdfContentPx + 'px';
        pageEl.style.maxWidth = pdfContentPx + 'px';
        pageEl.style.margin = '0';
        pageEl.style.boxSizing = 'border-box';
        pageEl.style.background = '#ffffff';
        pageEl.style.color = '#111111';
    }
    if (isCekiBelge) {
        host.style.width = pdfContentPx + 'px';
        host.style.maxWidth = pdfContentPx + 'px';
        root.style.width = pdfContentPx + 'px';
        root.style.maxWidth = pdfContentPx + 'px';
        root.querySelectorAll('.ceki-page').forEach(el => {
            el.style.width = '100%';
            el.style.maxWidth = '100%';
        });
        kumasCekiPdfSatirYukseklikAyarla(root, pdfContentHpx);
    }
    host.appendChild(root);
    document.body.appendChild(host);

    try {
        if (typeof erpToast === 'function') erpToast('PDF hazırlanıyor…', 'info');
        // Layout settle
        void host.offsetHeight;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        await new Promise(r => setTimeout(r, 60));

        const target = pageEl || root;
        const captureW = Math.max(320, Math.round((target && target.offsetWidth) || pdfContentPx));
        const opt = {
            margin: [pdfMarginMm, pdfMarginMm, pdfMarginMm, pdfMarginMm],
            filename: ad,
            image: { type: 'jpeg', quality: 0.96 },
            pagebreak: { mode: ['css', 'legacy'], before: '.page-break' },
            html2canvas: {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff',
                scrollX: 0,
                scrollY: 0,
                windowWidth: captureW,
                width: captureW,
                x: 0,
                y: 0
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await html2pdf().set(opt).from(target).save();
    } catch (e) {
        console.warn('[erpBelgePdfIndir]', e);
        if (typeof erpToast === 'function') erpToast('PDF indirilemedi, yazdırma açılıyor.', 'warn');
        erpBelgeYazdir(html, ad);
    } finally {
        try { host.remove(); } catch (e) {}
    }
}

function kumasCekiA4Yazdir(satirlar, meta) {
    const html = kumasCekiA4Html(satirlar, meta || {});
    erpBelgeYazdir(html, 'Çeki Listesi');
}

function kumasCekiPdfIndir() {
    const dolu = kumasCekiVeriJson();
    if (!dolu.length) { if (typeof erpToast === 'function') erpToast('Liste boş.', 'warn'); return; }
    const kod  = document.getElementById('val-stok-kodu')?.value || '';
    const urun = document.getElementById('val-cins')?.value || document.getElementById('ksel-cins')?.textContent || '';
    const musteri = String(document.getElementById('val-afirma')?.value || document.getElementById('val-firma-detay')?.value || '').trim();
    const tp = kumasCekiTeslimPlakaOku();
    const html = kumasCekiA4Html(dolu, { stok_kodu: kod, urun_adi: urun, musteri, teslim: tp.teslim, plaka: tp.plaka });
    erpBelgePdfIndir(html, 'ceki-listesi' + (kod ? '-' + kod : ''));
}

function kumasCekiGosteriCoz(satirlarEnc, metaEnc) {
    let satirlar = [];
    try { satirlar = JSON.parse(decodeURIComponent(satirlarEnc)); } catch (e) { satirlar = []; }
    let raw = {};
    try {
        const d = decodeURIComponent(metaEnc || '');
        raw = d.charAt(0) === '{' ? JSON.parse(d) : { baslik: d };
    } catch (e) {
        try { raw = { baslik: decodeURIComponent(metaEnc || '') }; } catch (e2) { raw = {}; }
    }
    return { satirlar, raw };
}

function kumasCekiGosteriYazdir(satirlarEnc, metaEnc) {
    const p = kumasCekiGosteriCoz(satirlarEnc, metaEnc);
    kumasCekiA4Yazdir(p.satirlar, p.raw);
}

function kumasCekiGosteriPdfIndir(satirlarEnc, metaEnc) {
    const p = kumasCekiGosteriCoz(satirlarEnc, metaEnc);
    const html = kumasCekiA4Html(p.satirlar, p.raw);
    const kod = (p.raw && (p.raw.stok_kodu || p.raw.baslik)) || '';
    erpBelgePdfIndir(html, 'ceki-listesi' + (kod ? '-' + kod : ''));
}

// ─── Depo hareketinden çeki göster ──────────────────────────────────────────
function kumasCekiHarekettenGoster(hareketId) {
    const kumasStok = typeof dataCache !== 'undefined' ? (dataCache.kumas_stok || []) : [];
    const hareket = kumasStok.find(h => String(h.id) === String(hareketId));
    if (!hareket) { if (typeof erpToast === 'function') erpToast('Hareket bulunamadı.', 'error'); return; }
    const tp = kumasCekiTeslimPlakaOku({}, hareket.notlar);
    kumasCekiGoster(hareket.notlar, {
        stok_kodu: hareket.stok_kodu,
        urun_adi: kumasCekiUrunAdiBul(hareket),
        musteri: hareket.firma,
        teslim: tp.teslim,
        plaka: tp.plaka || String(hareket.araci_firma || '').trim()
    });
}

// ─── Form payload'una çeki tag ekle ─────────────────────────────────────────
// Kumaş ÇIKIŞ kaydı sırasında çağrılır
function kumasCekiPayloadNotlarEkle(mevcutNotlar) {
    return kumasCekiNotlarEkle(mevcutNotlar);
}

// Form sıfırlandığında çeki listesini de sıfırla
function kumasCekiFormSifirla() {
    _kumasCekiSatirlar = [];
    _kumasCekiKapasite = 100;
    kumasCekiFormOzetSifirla();
}

// ─── Global ─────────────────────────────────────────────────────────────────
window.kumasCekiAc              = kumasCekiAc;
window.kumasCekiKapat           = kumasCekiKapat;
window.kumasCekiEkle            = kumasCekiEkle;
window.kumasCekiTemizle         = kumasCekiTemizle;
window.kumasCekiKaydet          = kumasCekiKaydet;
window.kumasCekiGuncelle        = kumasCekiGuncelle;
window.kumasCekiYazdir          = kumasCekiYazdir;
window.kumasCekiPdfIndir        = kumasCekiPdfIndir;
window.kumasCekiGosteriYazdir   = kumasCekiGosteriYazdir;
window.kumasCekiGosteriPdfIndir = kumasCekiGosteriPdfIndir;
window.erpBelgeYazdir           = erpBelgeYazdir;
window.erpBelgePdfIndir         = erpBelgePdfIndir;
window.kumasCekiA4Yazdir        = kumasCekiA4Yazdir;
window.kumasCekiA4Html          = kumasCekiA4Html;
window.kumasCekiGoster          = kumasCekiGoster;
window.kumasCekiGosterSatirlar  = kumasCekiGosterSatirlar;
window.kumasCekiGoruntuleKapat  = kumasCekiGoruntuleKapat;
window.kumasCekiHarekettenGoster= kumasCekiHarekettenGoster;
window.kumasCekiFormSifirla     = kumasCekiFormSifirla;
window.kumasCekiPayloadNotlarEkle = kumasCekiPayloadNotlarEkle;
window.kumasCekiNotlarOku       = kumasCekiNotlarOku;
window.kumasCekiTeslimPlakaOku  = kumasCekiTeslimPlakaOku;
