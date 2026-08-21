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
                    <h3>📋 ÇEKİ LİSTESİ</h3>
                    <div class="kumas-ceki-meta" id="kumas-ceki-stok-meta">Ürün seçilmedi</div>
                    <div class="kumas-ceki-musteri" id="kumas-ceki-musteri-meta"></div>
                </div>
                <div class="kumas-ceki-acts">
                    <button type="button" onclick="kumasCekiEkle(${KUMAS_CEKI_SLOT})">+${KUMAS_CEKI_SLOT} top</button>
                    <button type="button" onclick="kumasCekiEkle(100)">+100 top</button>
                    <button type="button" onclick="kumasCekiTemizle()">Temizle</button>
                    <button type="button" onclick="kumasCekiYazdir()">Yazdır</button>
                    <button type="button" class="is-save" onclick="kumasCekiKaydet()">Listeyi kaydet</button>
                    <button type="button" onclick="kumasCekiKapat()">Kapat</button>
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
    if (metaEl) metaEl.textContent = [kod, urun].filter(x => x && String(x).trim()).join(' - ') || 'Ürün seçilmedi';
    if (musEl) musEl.textContent = musteri ? ('Müşteri: ' + musteri) : '';
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
    const out = arr.map((x, i) => {
        if (x == null) return null;
        if (typeof x === 'number') return { no: i + 1, mt: x, kg: 0 };
        if (typeof x === 'string') {
            const p = x.split('/');
            return { no: i + 1, mt: parseFloat(p[0]) || 0, kg: parseFloat(p[1]) || 0 };
        }
        const mt = parseFloat(x.mt) || 0;
        const kg = parseFloat(x.kg) || parseFloat(x.ad) || 0;
        if (mt <= 0 && kg <= 0) return null;
        return { no: parseInt(x.no, 10) || (i + 1), mt, kg };
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
function kumasCekiMetaNormalize(input, row) {
    const o = (input && typeof input === 'object' && !Array.isArray(input)) ? input : {};
    const stok = String(o.stok_kodu || o.kod || (row && (row.stok_kodu || row.kod)) || '').trim();
    let urun = String(o.urun_adi || o.ad || '').trim();
    if (!urun && row) urun = kumasCekiUrunAdiBul(row);
    let musteri = String(o.musteri || o.firma || (row && (row.firma || row.musteri)) || '').trim();
    let urunSatir = [stok, urun].filter(Boolean).join(' - ');
    if (!urunSatir && typeof input === 'string') urunSatir = String(input).trim();
    if (!urunSatir) urunSatir = String(o.baslik || '').trim();
    return {
        stok_kodu: stok,
        urun_adi: urun,
        musteri,
        urunSatir: urunSatir || '—',
        teslim: String(o.teslim || '').trim(),
        plaka: String(o.plaka || '').trim(),
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
    const t = satirlar.reduce((acc, s) => {
        acc.mt += parseFloat(s.mt) || 0;
        acc.kg += parseFloat(s.kg) || 0;
        return acc;
    }, { mt: 0, kg: 0 });

    const GRUP = KUMAS_CEKI_SATIR;
    const kolonSayisi = Math.ceil(satirlar.length / GRUP);
    let kolonHtml = '';
    for (let k = 0; k < kolonSayisi; k++) {
        const baslangic = k * GRUP;
        const kisim = satirlar.slice(baslangic, baslangic + GRUP);
        const satirHtml = kisim.map(s => `<tr>
            <td class="no">${s.no}</td>
            <td>${s.mt > 0 ? (+s.mt).toLocaleString('tr-TR', {maximumFractionDigits:2}) : ''}</td>
            <td>${s.kg > 0 ? (+s.kg).toLocaleString('tr-TR', {maximumFractionDigits:2}) : ''}</td>
        </tr>`).join('');
        const kolMt = kisim.reduce((a, s) => a + (parseFloat(s.mt) || 0), 0);
        const kolKg = kisim.reduce((a, s) => a + (parseFloat(s.kg) || 0), 0);
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

    const meta = kumasCekiMetaNormalize(baslikBilgi);
    const metaEnc = encodeURIComponent(JSON.stringify({
        stok_kodu: meta.stok_kodu,
        urun_adi: meta.urun_adi,
        musteri: meta.musteri
    }));
    // Mevcut overlay varsa kaldır
    let ov = document.getElementById('kumas-ceki-goruntule-overlay');
    if (ov) ov.remove();
    ov = document.createElement('div');
    ov.id = 'kumas-ceki-goruntule-overlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2147482600;background:rgba(8,12,24,0.6);display:flex;align-items:stretch;justify-content:center;padding:12px;box-sizing:border-box';
    ov.innerHTML = `
        <div class="kumas-ceki-box">
            <div class="kumas-ceki-head">
                <div>
                    <h3>📋 ÇEKİ LİSTESİ</h3>
                    <div class="kumas-ceki-meta">${kumasCekiEsc(meta.urunSatir)}</div>
                    ${meta.musteri ? `<div class="kumas-ceki-musteri">Müşteri: ${kumasCekiEsc(meta.musteri)}</div>` : ''}
                </div>
                <div class="kumas-ceki-acts">
                    <button type="button" onclick="kumasCekiGosteriYazdir('${encodeURIComponent(JSON.stringify(satirlar))}','${metaEnc}')">Yazdır / PDF</button>
                    <button type="button" onclick="document.getElementById('kumas-ceki-goruntule-overlay').remove()">Kapat</button>
                </div>
            </div>
            <div class="kumas-ceki-ozet-bar">
                <span>Top sayısı: <b>${satirlar.length}</b></span>
                <span>Toplam metre: <b>${t.mt > 0 ? t.mt.toLocaleString('tr-TR',{maximumFractionDigits:2}) : '—'}</b></span>
                <span>Toplam kg: <b>${t.kg > 0 ? t.kg.toLocaleString('tr-TR',{maximumFractionDigits:2}) : '—'}</b></span>
            </div>
            <div class="kumas-ceki-blocks" style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;padding:8px">
                ${kolonHtml}
            </div>
        </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e) { if (e.target === ov) ov.remove(); });
}

// ─── Yazdır ─────────────────────────────────────────────────────────────────
function kumasCekiYazdir() {
    const dolu = kumasCekiVeriJson();
    if (!dolu.length) { if (typeof erpToast === 'function') erpToast('Liste boş.', 'warn'); return; }
    const kod  = document.getElementById('val-stok-kodu')?.value || '';
    const urun = document.getElementById('val-cins')?.value || document.getElementById('ksel-cins')?.textContent || '';
    const musteri = String(document.getElementById('val-afirma')?.value || document.getElementById('val-firma-detay')?.value || '').trim();
    kumasCekiA4Yazdir(dolu, { stok_kodu: kod, urun_adi: urun, musteri });
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
    const list = Array.isArray(satirlar) ? satirlar : [];
    const slots = [];
    list.forEach((s, i) => {
        const no = Math.max(1, parseInt(s && s.no, 10) || (i + 1));
        slots[no - 1] = { mt: sayi(s.mt), kg: sayi(s.kg) || sayi(s.ad) };
    });
    const doluSay = list.filter(s => sayi(s.mt) > 0 || sayi(s.kg) > 0 || sayi(s.ad) > 0).length;
    const maxNo = Math.max(doluSay, slots.length, 1);
    const n = Math.max(PAGE, Math.ceil(maxNo / PAGE) * PAGE);
    const t = slots.reduce((a, s) => {
        if (!s) return a;
        a.mt += s.mt; a.kg += s.kg; if (s.mt > 0 || s.kg > 0) a.top++;
        return a;
    }, { mt: 0, kg: 0, top: 0 });

    let pages = '';
    for (let b = 0; b < n; b += PAGE) {
        pages += '<div class="ceki-page">';
        for (let c = 0; c < COLS; c++) {
            const start = b + c * ROWS;
            const end = start + ROWS;
            let mt = 0, kg = 0, rows = '';
            for (let i = start; i < end; i++) {
                const s = slots[i] || { mt: 0, kg: 0 };
                mt += s.mt; kg += s.kg;
                rows += `<tr><td class="no">${i + 1}</td><td>${fmt(s.mt)}</td><td>${fmt(s.kg)}</td></tr>`;
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
      @page { size: A4 portrait; margin: 6mm 5mm; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; color: #111;
        font-family: 'Segoe UI', Arial, sans-serif; }
      @media print { .no-print { display: none !important; } }
      .wrap { width: 200mm; margin: 0 auto; }
      .head { display: flex; justify-content: space-between; align-items: flex-end;
        border-bottom: 2px solid #111; padding-bottom: 3mm; margin-bottom: 2.5mm; }
      .brand { font-size: 18px; font-weight: 900; letter-spacing: -0.3px; line-height: 1; }
      .brand-sub { font-size: 7px; letter-spacing: .14em; color: #666; text-transform: uppercase; margin-top: 2px; }
      .doc-b { font-size: 13px; font-weight: 800; }
      .doc-m { font-size: 11px; font-weight: 700; margin-top: 2px; }
      .doc-t { font-size: 9px; color: #555; }
      .oz { display: flex; gap: 6mm; font-size: 10px; font-weight: 800; margin-bottom: 2.5mm; }
      .ceki-page { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1.4mm; width: 100%; }
      .ceki-page + .ceki-page { page-break-before: always; margin-top: 3mm; }
      .ceki-col { border: 1px solid #111; min-width: 0; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #111; text-align: center; font-size: 7px; height: 6.6mm; padding: 0 1px; }
      th { background: #eee; font-size: 6.5px; font-weight: 800; height: 5.8mm; }
      .no { width: 26%; background: #f4f4f4; font-weight: 700; font-family: Consolas, monospace; }
      tfoot td { background: #f0f0f0; font-weight: 800; height: 5.8mm; }
      .imza { margin-top: 5mm; display: flex; justify-content: space-between; }
      .imza div { text-align: center; width: 48mm; }
      .imza i { display: block; border-top: 1px solid #999; margin: 0 auto 2px; width: 42mm; font-style: normal; }
      .imza span { font-size: 7px; color: #666; text-transform: uppercase; letter-spacing: .06em; }
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
      ${pages}
      <div class="imza">
        <div><i></i><span>Teslim Eden</span></div>
        <div><i></i><span>Teslim Alan</span></div>
        <div><i></i><span>Tarih / İmza</span></div>
      </div>
    </div>
    </body></html>`;
}

function kumasCekiA4Yazdir(satirlar, meta) {
    const html = kumasCekiA4Html(satirlar, meta || {});
    if (typeof erpPrintHtml === 'function') {
        erpPrintHtml(html, { title: 'Çeki Listesi' });
        return;
    }
    const win = window.open('', '_blank', 'width=900,height=1200');
    if (win) { win.document.write(html); win.document.close(); }
    else if (typeof erpToast === 'function') erpToast('Popup engellendi — tarayıcıda popup iznini açın.', 'warn');
}

function kumasCekiGosteriYazdir(satirlarEnc, metaEnc) {
    let satirlar = [];
    try { satirlar = JSON.parse(decodeURIComponent(satirlarEnc)); } catch (e) { satirlar = []; }
    let raw = {};
    try {
        const d = decodeURIComponent(metaEnc || '');
        raw = d.charAt(0) === '{' ? JSON.parse(d) : { baslik: d };
    } catch (e) {
        try { raw = { baslik: decodeURIComponent(metaEnc || '') }; } catch (e2) { raw = {}; }
    }
    kumasCekiA4Yazdir(satirlar, raw);
}

// ─── Depo hareketinden çeki göster ──────────────────────────────────────────
function kumasCekiHarekettenGoster(hareketId) {
    const kumasStok = typeof dataCache !== 'undefined' ? (dataCache.kumas_stok || []) : [];
    const hareket = kumasStok.find(h => String(h.id) === String(hareketId));
    if (!hareket) { if (typeof erpToast === 'function') erpToast('Hareket bulunamadı.', 'error'); return; }
    kumasCekiGoster(hareket.notlar, {
        stok_kodu: hareket.stok_kodu,
        urun_adi: kumasCekiUrunAdiBul(hareket),
        musteri: hareket.firma
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
window.kumasCekiGosteriYazdir   = kumasCekiGosteriYazdir;
window.kumasCekiA4Yazdir        = kumasCekiA4Yazdir;
window.kumasCekiA4Html          = kumasCekiA4Html;
window.kumasCekiGoster          = kumasCekiGoster;
window.kumasCekiHarekettenGoster= kumasCekiHarekettenGoster;
window.kumasCekiFormSifirla     = kumasCekiFormSifirla;
window.kumasCekiPayloadNotlarEkle = kumasCekiPayloadNotlarEkle;
window.kumasCekiNotlarOku       = kumasCekiNotlarOku;
