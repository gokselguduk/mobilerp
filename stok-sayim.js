/* ============================================================
   Stok Sayım Modülü  v20260820sayim7
   Sayılan adet = yeni stok. Fark hareket olarak yazılır,
   sayım raporu arşivlenir. Kayıt toplu + zaman aşımı ile gider.
   Telefonda kart düzeni; masaüstünde tablo.
   ============================================================ */

let _sayimTip = 'MAMUL';
let _sayimAra = '';
let _sayimKaydediliyor = false;
let _sayimEkran = 'SAYIM'; /* SAYIM | ARSIV | RAPOR */
let _sayimGirisler = {};
let _sayimAcikRaporId = null;
let _sayimMobilFiltre = 'STOKLU'; /* STOKLU | SAYILAN | TUMU */

function sayimMobilMi() {
    try {
        return !!(window.ERP_MOBIL_LITE || document.body?.classList?.contains('erp-mobil-lite'));
    } catch (e) {
        return false;
    }
}

const SAYIM_ARSIV_LS = 'erp_stok_sayim_arsiv_v1';
const SAYIM_ARSIV_MAX = 60;
const SAYIM_AKIS_ISLEM = 'STOK_SAYIM_RAPOR';
let _sayimArsivCekiliyor = false;
let _sayimArsivCekildi = false;

function sayimEsc(s) {
    const d = document.createElement('span');
    d.textContent = String(s == null ? '' : s);
    return d.innerHTML;
}

function sayimKullanici() {
    try {
        return String(erpCurrentUser?.display_name || erpCurrentUser?.username || 'Sistem').trim() || 'Sistem';
    } catch (e) {
        return 'Sistem';
    }
}

/* ---- Mamül / kumaş / iplik satırları ---- */

function sayimMamulSatirlariniOlustur() {
    const bakiyeMap = {};
    (dataCache.kumas_stok || []).filter(kumasStokHareketiMamulDepoMu).forEach(r => {
        const k = (r.stok_kodu || '').trim();
        if (!k) return;
        bakiyeMap[k] = (bakiyeMap[k] || 0) + (parseInt(r.cuval_sayisi || 0, 10) || 0);
    });

    const kutup = dataCache.kumas_kutuphanesi || [];
    const mamulKartlar = kutup.filter(k => typeof kumasKutuphanesiKartiMamulMu === 'function' && kumasKutuphanesiKartiMamulMu(k));
    const satirlar = [];
    const islendi = new Set();

    mamulKartlar.forEach(kart => {
        const kod = String(kart.desen_kodu || '').trim();
        if (!kod || islendi.has(kod)) return;
        const vNo = typeof mamulVaryantNoBul === 'function' ? mamulVaryantNoBul(kod) : 0;
        if (vNo > 0) {
            islendi.add(kod);
            return;
        }
        islendi.add(kod);
        const varyantlar = typeof mamulAnaVaryantKayitlariTopla === 'function'
            ? mamulAnaVaryantKayitlariTopla(kart)
            : [];
        if (varyantlar.length === 0) {
            const detay = typeof mamulTopluUrunDetayOlustur === 'function'
                ? mamulTopluUrunDetayOlustur(kart) : null;
            satirlar.push({
                stok_kodu: kod,
                kayit_kodu: kod,
                grup: detay?.grup || '',
                label: detay?.ad || kart.urun_adi || kart.desen_adi || '',
                renk: detay?.renk || kart.renk || '—',
                ebat: detay?.ebat || '—',
                mevcut: bakiyeMap[kod] || 0,
                kart
            });
        } else {
            varyantlar.forEach(vKart => {
                const vKod = String(vKart.desen_kodu || '').trim();
                if (vKod) islendi.add(vKod);
                const detay = typeof mamulTopluUrunDetayOlustur === 'function'
                    ? mamulTopluUrunDetayOlustur(vKart) : null;
                satirlar.push({
                    stok_kodu: vKod || kod,
                    kayit_kodu: vKod || kod,
                    grup: detay?.grup || '',
                    label: detay?.ad || vKart.urun_adi || kart.urun_adi || '',
                    renk: detay?.renk || vKart.renk || '—',
                    ebat: detay?.ebat || '—',
                    mevcut: bakiyeMap[vKod] || 0,
                    kart: vKart
                });
            });
        }
    });

    return satirlar.sort((a, b) => a.stok_kodu.localeCompare(b.stok_kodu, 'tr', { numeric: true }));
}

function sayimKumasSatirlariniOlustur() {
    const gruplar = typeof kumasStokListeGruplariOlustur === 'function'
        ? kumasStokListeGruplariOlustur(dataCache.kumas_stok || [])
        : [];
    if (gruplar.length) {
        return gruplar.map(g => {
            const kod = String(g.stok_kodu || '').trim();
            const kart = typeof kumasKutuphanesiKartBul === 'function' ? kumasKutuphanesiKartBul(kod) : (g.kart || null);
            const tek = {
                tarak_eni: g.tarak_eni,
                atki_sikligi: g.atki_sikligi,
                cozgu_sikligi: g.cozgu_sikligi,
                atki_ipi: g.atki_ipi,
                cozgu_ipi: g.cozgu_ipi
            };
            if (typeof kumasKartTeknikDetay === 'function') {
                const kartTek = kumasKartTeknikDetay(kart || g);
                if (!tek.tarak_eni) tek.tarak_eni = kartTek.tarak_eni;
                if (!tek.atki_sikligi) tek.atki_sikligi = kartTek.atki_sikligi;
                if (!tek.cozgu_sikligi) tek.cozgu_sikligi = kartTek.cozgu_sikligi;
                if (!tek.atki_ipi) tek.atki_ipi = kartTek.atki_ipi;
                if (!tek.cozgu_ipi) tek.cozgu_ipi = kartTek.cozgu_ipi;
            }
            const terbiye = typeof kumasStokListeTerbiyeTur === 'function' ? kumasStokListeTerbiyeTur(g) : (g.terbiye || '');
            const anaGrup = typeof kumasStokListeAnaGrup === 'function' ? kumasStokListeAnaGrup(g) : (g.ana_grup || '');
            return {
                stok_kodu: kod,
                kayit_kodu: kod,
                grup: anaGrup,
                label: g.urun_adi || g.kumas_cinsi || '',
                kumas_cinsi: g.kumas_cinsi || '',
                terbiye: terbiye || '',
                tarak_eni: tek.tarak_eni || '',
                atki_sikligi: tek.atki_sikligi || '',
                cozgu_sikligi: tek.cozgu_sikligi || '',
                atki_ipi: tek.atki_ipi || '',
                cozgu_ipi: tek.cozgu_ipi || '',
                renk: g.renk || '',
                ebat: '',
                mevcut: Math.round((parseFloat(g.net_mt) || 0) * 100) / 100,
                kart: kart || g
            };
        }).sort((a, b) => a.stok_kodu.localeCompare(b.stok_kodu, 'tr', { numeric: true }));
    }

    const bakiyeMap = {};
    (dataCache.kumas_stok || []).filter(r => typeof kumasStokHareketiKumasDepoMu !== 'function' || kumasStokHareketiKumasDepoMu(r)).forEach(r => {
        const k = (r.stok_kodu || '').trim();
        if (!k) return;
        bakiyeMap[k] = (bakiyeMap[k] || 0) + (parseFloat(r.miktar_mt) || 0);
    });
    return (dataCache.kumas_kutuphanesi || [])
        .filter(k => {
            if (typeof kumasKutuphanesiKartiMamulMu === 'function' && kumasKutuphanesiKartiMamulMu(k)) return false;
            if (String(k.ana_grup || '').toUpperCase() === 'NUMUNE') return false;
            return true;
        })
        .map(k => {
            const kod = String(k.stok_kodu || k.desen_kodu || '').trim();
            const tek = typeof kumasKartTeknikDetay === 'function' ? kumasKartTeknikDetay(k) : {};
            return {
                stok_kodu: kod,
                kayit_kodu: kod,
                grup: k.ana_grup || '',
                label: k.urun_adi || k.desen_adi || k.kumas_cinsi || '',
                kumas_cinsi: k.kumas_cinsi || '',
                terbiye: k.terbiye || '',
                tarak_eni: tek.tarak_eni || '',
                atki_sikligi: tek.atki_sikligi || '',
                cozgu_sikligi: tek.cozgu_sikligi || '',
                atki_ipi: tek.atki_ipi || '',
                cozgu_ipi: tek.cozgu_ipi || '',
                renk: k.renk || '',
                ebat: '',
                mevcut: Math.round((bakiyeMap[kod] || 0) * 100) / 100,
                kart: k
            };
        })
        .sort((a, b) => a.stok_kodu.localeCompare(b.stok_kodu, 'tr', { numeric: true }));
}

function sayimIplikSatirlariniOlustur() {
    const bakiyeMap = {};
    (dataCache.iplik_stok || []).forEach(r => {
        const k = (r.stok_kodu || '').trim();
        if (!k) return;
        bakiyeMap[k] = (bakiyeMap[k] || 0) + (parseFloat(r.miktar_kg) || 0);
    });
    const kartlar = typeof iplikKartlariListe === 'function' ? iplikKartlariListe() : [];
    return kartlar.map(k => {
        const kod = String(k.stok_kodu || '').trim();
        return {
            stok_kodu: kod,
            kayit_kodu: kod,
            grup: k.marka || k.cins || 'İplik',
            label: k.cins || k.iplik_no || '',
            renk: '',
            ebat: '',
            mevcut: Math.round((bakiyeMap[kod] || 0) * 100) / 100,
            kart: k
        };
    }).sort((a, b) => a.stok_kodu.localeCompare(b.stok_kodu, 'tr', { numeric: true }));
}

function sayimSatirlariOlustur() {
    if (_sayimTip === 'MAMUL') return sayimMamulSatirlariniOlustur();
    if (_sayimTip === 'KUMAS') return sayimKumasSatirlariniOlustur();
    return sayimIplikSatirlariniOlustur();
}

function sayimFiltreleSatirlar(rows) {
    const q = _sayimAra.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(r => {
        const blob = [r.stok_kodu, r.label, r.grup, r.kumas_cinsi, r.terbiye, r.renk, r.ebat,
            r.tarak_eni, r.atki_sikligi, r.cozgu_sikligi, r.atki_ipi, r.cozgu_ipi,
            r.kart?.firma, r.kart?.marka].join(' ').toLowerCase();
        return blob.includes(q);
    });
}

function sayimBirim() {
    if (_sayimTip === 'MAMUL') return 'ad';
    if (_sayimTip === 'KUMAS') return 'mt';
    return 'kg';
}

function sayimKolonSayisi() {
    if (_sayimTip === 'MAMUL') return 8;
    if (_sayimTip === 'KUMAS') return 13;
    return 5;
}

function sayimTheadHtml() {
    if (_sayimTip === 'MAMUL') {
        return `<th>Ürün grubu</th><th>Stok kodu</th><th>Ürün</th><th>Ürün renk</th><th>Ürün ebat</th>
                <th class="num">Stok</th><th class="num">Sayılan</th><th class="num">Fark</th>`;
    }
    if (_sayimTip === 'KUMAS') {
        return `<th>Ana grup</th><th>Stok kodu</th><th>Ürün</th><th>Kumaş cinsi</th><th>Terbiye türü</th>
                <th>Tarak eni</th><th>Atkı sıklığı</th><th>Çözgü sıklığı</th><th>Atkı ipi</th><th>Çözgü ipi</th>
                <th class="num">Stok</th><th class="num">Sayılan</th><th class="num">Fark</th>`;
    }
    return `<th>Stok kodu</th><th>Ürün</th><th class="num">Stok</th><th class="num">Sayılan</th><th class="num">Fark</th>`;
}

function sayimYuvarla(n, mamul) {
    const x = Number(n) || 0;
    return mamul ? Math.round(x) : Math.round(x * 100) / 100;
}

function sayimMobilFiltrele(rows) {
    if (!sayimMobilMi()) return rows;
    if (_sayimMobilFiltre === 'SAYILAN') {
        return rows.filter(r => {
            const v = _sayimGirisler[r.stok_kodu];
            return v != null && String(v).trim() !== '';
        });
    }
    if (_sayimMobilFiltre === 'STOKLU') {
        return rows.filter(r => {
            const v = _sayimGirisler[r.stok_kodu];
            const dolu = v != null && String(v).trim() !== '';
            return dolu || Number(r.mevcut) !== 0;
        });
    }
    return rows;
}

function sayimKartMeta(r) {
    if (_sayimTip === 'MAMUL') {
        return [r.renk && r.renk !== '—' ? r.renk : '', r.ebat && r.ebat !== '—' ? r.ebat : ''].filter(Boolean).join(' · ');
    }
    if (_sayimTip === 'KUMAS') {
        return [r.kumas_cinsi, r.terbiye].filter(x => x && x !== '—').join(' · ');
    }
    return r.grup && r.grup !== '—' ? r.grup : '';
}

function sayimKartHtml(r) {
    const mamul = _sayimTip === 'MAMUL';
    const birim = sayimBirim();
    const mevcut = sayimYuvarla(r.mevcut, mamul);
    const girilen = _sayimGirisler[r.stok_kodu];
    const sayilan = girilen == null || girilen === '' ? null : parseFloat(girilen);
    const dolu = sayilan != null && !isNaN(sayilan);
    let farkYazi = '—';
    let farkCls = '';
    if (dolu) {
        const fark = sayimYuvarla(sayilan - mevcut, mamul);
        farkYazi = fark === 0 ? '0' : (fark > 0 ? '+' + fark : String(fark));
        farkCls = fark > 0 ? ' fark-artis' : fark < 0 ? ' fark-azalis' : '';
    }
    const qtyYazi = mamul
        ? mevcut.toLocaleString('tr-TR')
        : mevcut.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
    const meta = sayimKartMeta(r);
    const kod = sayimEsc(r.stok_kodu);
    return `<article class="sayim-kart${dolu ? ' sayim-kart--dolu' : ''}${mevcut === 0 ? ' sayim-kart--sifir' : ''}" data-kod="${kod}">
        <div class="sayim-kart-ad">${sayimEsc(r.label || r.stok_kodu)}</div>
        <div class="sayim-kart-kod">${kod}${meta ? ` · ${sayimEsc(meta)}` : ''}</div>
        <div class="sayim-kart-cift">
            <button type="button" class="sayim-kart-stok" onclick="stokSayimStokKopyala(this)" title="Stoğu sayılana kopyala">
                <em>Mevcut stok</em>
                <strong>${qtyYazi}</strong>
                <span>${birim}</span>
            </button>
            <label class="sayim-kart-say">
                <span>Sayılan stok</span>
                <input type="number" class="sayim-inp" inputmode="decimal" enterkeyhint="next"
                       data-kod="${kod}"
                       data-kayitkod="${sayimEsc(r.kayit_kodu)}"
                       data-label="${sayimEsc(r.label)}"
                       data-mevcut="${mevcut}"
                       value="${dolu ? sayimEsc(girilen) : ''}"
                       placeholder="0"
                       step="any"
                       oninput="stokSayimFarkGuncelle(this)">
            </label>
        </div>
        <div class="sayim-kart-alt">
            <span>Mevcuda dokununca kopyalanır</span>
            <span class="sayim-kart-fark${farkCls}">${farkYazi === '—' ? 'fark yok' : 'fark ' + farkYazi}</span>
        </div>
    </article>`;
}

function sayimKartListeHtml(rows) {
    if (!rows.length) {
        const mesaj = _sayimMobilFiltre === 'SAYILAN'
            ? 'Henüz sayılan ürün yok. Karttaki sayı alanına dokunup girin.'
            : _sayimMobilFiltre === 'STOKLU'
                ? 'Stoğu olan ürün yok. Tümü ile sıfır stokluları da görebilirsiniz.'
                : 'Stokta kartlı ürün bulunamadı';
        return `<div class="sayim-bos-kutu">${mesaj}</div>`;
    }
    const map = new Map();
    rows.forEach(r => {
        const g = String(r.grup || r.ana_grup || 'Diğer').trim() || 'Diğer';
        if (!map.has(g)) map.set(g, []);
        map.get(g).push(r);
    });
    let html = '';
    map.forEach((list, g) => {
        html += `<div class="sayim-grup-bas">${sayimEsc(g)} · ${list.length}</div>`;
        html += list.map(sayimKartHtml).join('');
    });
    return html;
}

function sayimListeHtml(rows) {
    return sayimMobilMi() ? sayimKartListeHtml(rows) : sayimTabloHtml(rows);
}

function sayimChipBarHtml(allN, gorunenN) {
    const chips = [
        { id: 'STOKLU', lbl: 'Stoğu olan' },
        { id: 'SAYILAN', lbl: 'Sayılan' },
        { id: 'TUMU', lbl: 'Tümü' }
    ];
    return `<div class="sayim-chip-bar">
        ${chips.map(c => `<button type="button" class="sayim-chip${_sayimMobilFiltre === c.id ? ' aktif' : ''}" onclick="stokSayimMobilFiltre('${c.id}')">${c.lbl}</button>`).join('')}
        <span class="sayim-chip-ozet">${gorunenN} / ${allN}</span>
    </div>`;
}

function sayimTabloHtml(rows) {
    const mamul = _sayimTip === 'MAMUL';
    const kumas = _sayimTip === 'KUMAS';
    const birim = sayimBirim();

    if (!rows.length) {
        return `<div class="ms-table-wrap"><table class="ms-table sayim-tablo">
            <thead><tr>${sayimTheadHtml()}</tr></thead>
            <tbody><tr><td colspan="${sayimKolonSayisi()}" style="text-align:center;padding:24px;color:#888">Stokta kartlı ürün bulunamadı</td></tr></tbody>
        </table></div>`;
    }

    const tbody = rows.map((r, i) => {
        const mevcut = sayimYuvarla(r.mevcut, mamul);
        const qtyCls = mevcut < 0 ? ' is-neg' : mevcut === 0 ? ' is-zero' : '';
        const qtyYazi = mamul
            ? mevcut.toLocaleString('tr-TR')
            : mevcut.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
        const girilen = _sayimGirisler[r.stok_kodu];
        const sayilan = girilen == null || girilen === '' ? null : parseFloat(girilen);
        let farkYazi = '—';
        let farkCls = 'sayim-td-fark';
        if (sayilan != null && !isNaN(sayilan)) {
            const fark = sayimYuvarla(sayilan - mevcut, mamul);
            farkYazi = fark === 0 ? '0' : (fark > 0 ? '+' + fark : String(fark));
            farkCls += fark > 0 ? ' fark-artis' : fark < 0 ? ' fark-azalis' : '';
        }
        let cells = '';
        if (mamul || kumas) cells += `<td class="ms-grup">${sayimEsc(r.grup || '—')}</td>`;
        cells += `<td class="ms-kod">${sayimEsc(r.stok_kodu)}</td>
                  <td><div class="ms-name">${sayimEsc(r.label)}</div></td>`;
        if (mamul) {
            cells += `<td class="ms-ozellik">${sayimEsc(r.renk)}</td>
                      <td class="ms-ozellik">${sayimEsc(r.ebat)}</td>`;
        }
        if (kumas) {
            cells += `<td class="ms-ozellik">${sayimEsc(r.kumas_cinsi || '—')}</td>
                      <td class="ms-ozellik">${sayimEsc(r.terbiye || '—')}</td>
                      <td class="ms-teknik">${sayimEsc(r.tarak_eni || '—')}</td>
                      <td class="ms-teknik">${sayimEsc(r.atki_sikligi || '—')}</td>
                      <td class="ms-teknik">${sayimEsc(r.cozgu_sikligi || '—')}</td>
                      <td class="ms-teknik">${sayimEsc(r.atki_ipi || '—')}</td>
                      <td class="ms-teknik">${sayimEsc(r.cozgu_ipi || '—')}</td>`;
        }
        cells += `<td class="num"><span class="ms-qty${qtyCls}">${qtyYazi}<em>${birim}</em></span></td>
                  <td class="sayim-td-input" onclick="event.stopPropagation()">
                      <input type="number" class="sayim-inp"
                             data-kod="${sayimEsc(r.stok_kodu)}"
                             data-kayitkod="${sayimEsc(r.kayit_kodu)}"
                             data-label="${sayimEsc(r.label)}"
                             data-mevcut="${mevcut}"
                             value="${sayilan == null || isNaN(sayilan) ? '' : sayimEsc(girilen)}"
                             placeholder="—" step="any"
                             oninput="stokSayimFarkGuncelle(this, ${i})">
                  </td>
                  <td class="${farkCls}" id="sayim-fark-${i}">${farkYazi}</td>`;
        return `<tr class="sayim-row">${cells}</tr>`;
    }).join('');

    return `<div class="ms-table-wrap"><table class="ms-table sayim-tablo">
        <thead><tr>${sayimTheadHtml()}</tr></thead>
        <tbody>${tbody}</tbody>
    </table></div>`;
}

function sayimTipEtiket(tip) {
    if (tip === 'MAMUL') return 'Mamül';
    if (tip === 'KUMAS') return 'Kumaş';
    if (tip === 'IPLIK') return 'İplik';
    return tip || '—';
}

function sayimSayiYazi(n, birim) {
    const x = Number(n) || 0;
    const s = birim === 'ad'
        ? Math.round(x).toLocaleString('tr-TR')
        : x.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
    return birim ? `${s} ${birim}` : s;
}

function sayimUstSekmeHtml() {
    const raporAcik = _sayimEkran === 'RAPOR' || _sayimEkran === 'ARSIV';
    const mobil = sayimMobilMi();
    const tips = [
        { val: 'IPLIK', lbl: 'İplik' },
        { val: 'KUMAS', lbl: 'Kumaş' },
        { val: 'MAMUL', lbl: 'Mamül' }
    ];
    const tipBtns = tips.map(t =>
        `<button type="button" class="sayim-tip-btn${!raporAcik && _sayimTip === t.val ? ' aktif' : ''}" onclick="stokSayimTipDegistir('${t.val}')">${t.lbl}</button>`
    ).join('');
    return `<div class="sayim-tip-toggle${mobil ? ' sayim-tip-toggle--mobil' : ''}">
        ${tipBtns}
        <button type="button" class="sayim-tip-btn${raporAcik ? ' aktif' : ''}" onclick="stokSayimRaporSekmesiAc()">${mobil ? 'Rapor' : 'Stok Sayım Raporu'}</button>
    </div>`;
}

function renderStokSayim() {
    const list = document.getElementById('main-list');
    if (!list) return;
    if (!_sayimArsivCekildi && !_sayimArsivCekiliyor) {
        sayimArsivSunucudanCek({ render: true });
    }
    if (_sayimEkran === 'RAPOR' || _sayimEkran === 'ARSIV') {
        list.innerHTML = sayimRaporEkranHtml();
        return;
    }

    const mobil = sayimMobilMi();
    const allRows = sayimSatirlariOlustur();
    const rows = sayimMobilFiltrele(sayimFiltreleSatirlar(allRows));

    list.innerHTML = `<div class="sayim-shell${mobil ? ' sayim-shell--mobil' : ''}">
        <div class="sayim-header">
            ${mobil ? '' : '<h3 class="sayim-baslik">Stok Sayım</h3>'}
            ${sayimUstSekmeHtml()}
        </div>
        <div class="sayim-ara-bar">
            <input type="search" class="sayim-ara-inp" id="sayim-ara"
                   placeholder="${mobil ? 'Kod veya ürün ara' : 'Stok kodu, ürün, kumaş cinsi, terbiye ara...'}"
                   value="${sayimEsc(_sayimAra)}" oninput="stokSayimAraDegisti(this.value)"
                   enterkeyhint="search" autocomplete="off">
        </div>
        ${mobil ? sayimChipBarHtml(allRows.length, rows.length) : `<div class="sayim-ozet" id="sayim-ozet">${rows.length} / ${allRows.length} kalem</div>`}
        <div class="sayim-tablo-wrap" id="sayim-tablo-wrap">${sayimListeHtml(rows)}</div>
        <div class="sayim-actions">
            <span class="sayim-info" id="sayim-info"></span>
            <button type="button" class="sayim-kaydet-btn" id="sayim-kaydet-btn" onclick="stokSayimKaydet()">Sayımı kaydet</button>
        </div>
    </div>`;
    sayimInfoGuncelle();
}

function stokSayimRaporSekmesiAc() {
    const list = sayimArsivOku();
    if (!_sayimAcikRaporId && list.length) _sayimAcikRaporId = list[0].id;
    _sayimEkran = 'RAPOR';
    renderStokSayim();
}
window.stokSayimRaporSekmesiAc = stokSayimRaporSekmesiAc;

function stokSayimEkranDegistir(ekran) {
    if (ekran === 'RAPOR' || ekran === 'ARSIV') stokSayimRaporSekmesiAc();
    else {
        _sayimEkran = 'SAYIM';
        _sayimAcikRaporId = null;
        renderStokSayim();
    }
}
window.stokSayimEkranDegistir = stokSayimEkranDegistir;

function stokSayimTipDegistir(tip) {
    _sayimTip = tip;
    _sayimAra = '';
    _sayimEkran = 'SAYIM';
    _sayimAcikRaporId = null;
    renderStokSayim();
}
window.stokSayimTipDegistir = stokSayimTipDegistir;

function sayimListeYenile() {
    const wrap = document.getElementById('sayim-tablo-wrap');
    if (!wrap) return;
    const allRows = sayimSatirlariOlustur();
    const rows = sayimMobilFiltrele(sayimFiltreleSatirlar(allRows));
    wrap.innerHTML = sayimListeHtml(rows);
    const oz = document.getElementById('sayim-ozet');
    if (oz) oz.textContent = `${rows.length} / ${allRows.length} kalem`;
    const chipOzet = document.querySelector('.sayim-chip-ozet');
    if (chipOzet) chipOzet.textContent = `${rows.length} / ${allRows.length}`;
    sayimInfoGuncelle();
}

function stokSayimAraDegisti(val) {
    _sayimAra = val;
    debounce('sayimAra', sayimListeYenile, 250);
}
window.stokSayimAraDegisti = stokSayimAraDegisti;

function stokSayimMobilFiltre(id) {
    _sayimMobilFiltre = id;
    const bar = document.querySelector('.sayim-chip-bar');
    if (bar) {
        bar.querySelectorAll('.sayim-chip').forEach(b => {
            b.classList.toggle('aktif', b.getAttribute('onclick')?.includes("'" + id + "'"));
        });
    }
    sayimListeYenile();
}
window.stokSayimMobilFiltre = stokSayimMobilFiltre;

function stokSayimStokKopyala(btn) {
    const kart = btn.closest('.sayim-kart');
    const inp = kart?.querySelector('.sayim-inp');
    if (!inp) return;
    inp.value = inp.dataset.mevcut || '0';
    stokSayimFarkGuncelle(inp);
    try { inp.focus(); inp.select(); } catch (e) {}
}
window.stokSayimStokKopyala = stokSayimStokKopyala;

function stokSayimFarkGuncelle(inp, idx) {
    const kod = inp.dataset.kod;
    if (kod) {
        const v = inp.value.trim();
        if (v === '') delete _sayimGirisler[kod];
        else _sayimGirisler[kod] = v;
    }
    const mevcut = parseFloat(inp.dataset.mevcut) || 0;
    const sayilan = inp.value.trim() === '' ? null : parseFloat(inp.value);
    const dolu = sayilan != null && !isNaN(sayilan);
    const fark = dolu ? Math.round((sayilan - mevcut) * 100) / 100 : null;
    const farkYazi = fark == null ? '—' : (fark === 0 ? '0' : (fark > 0 ? '+' + fark : String(fark)));
    const farkMod = fark == null ? '' : (fark > 0 ? ' fark-artis' : fark < 0 ? ' fark-azalis' : '');

    const farkCell = idx != null ? document.getElementById('sayim-fark-' + idx) : null;
    if (farkCell) {
        farkCell.textContent = farkYazi;
        farkCell.className = 'sayim-td-fark' + farkMod;
    }
    const kart = inp.closest('.sayim-kart');
    if (kart) {
        kart.classList.toggle('sayim-kart--dolu', dolu);
        const badge = kart.querySelector('.sayim-kart-fark');
        if (badge) {
            badge.textContent = fark == null ? 'fark yok' : 'fark ' + farkYazi;
            badge.className = 'sayim-kart-fark' + farkMod;
        }
    }
    sayimInfoGuncelle();
}
window.stokSayimFarkGuncelle = stokSayimFarkGuncelle;

function sayimInfoGuncelle() {
    const info = document.getElementById('sayim-info');
    if (!info) return;
    const paket = sayimGirisPaketiniTopla();
    if (!paket.sayilanlar.length) {
        info.textContent = sayimMobilMi() ? 'Henüz sayı girilmedi' : '';
        return;
    }
    info.textContent = sayimMobilMi()
        ? `${paket.sayilanlar.length} sayıldı · ${paket.farklar.length} fark`
        : `${paket.sayilanlar.length} kalem sayıldı · ${paket.farklar.length} kalemde fark`;
}

function sayimGirisPaketiniTopla() {
    const allRows = sayimSatirlariOlustur();
    const byKod = {};
    allRows.forEach(r => { byKod[r.stok_kodu] = r; });
    const sayilanlar = [];
    const farklar = [];
    Object.keys(_sayimGirisler).forEach(kod => {
        const raw = _sayimGirisler[kod];
        if (raw == null || String(raw).trim() === '') return;
        const sayilan = parseFloat(raw);
        if (isNaN(sayilan)) return;
        const row = byKod[kod];
        if (!row) return;
        const mevcut = sayimYuvarla(row.mevcut, _sayimTip === 'MAMUL');
        const s = sayimYuvarla(sayilan, _sayimTip === 'MAMUL');
        const fark = sayimYuvarla(s - mevcut, _sayimTip === 'MAMUL');
        const rec = {
            stok_kodu: row.stok_kodu,
            kayit_kodu: row.kayit_kodu || row.stok_kodu,
            label: row.label || '',
            grup: row.grup || '',
            renk: row.renk || '',
            ebat: row.ebat || '',
            kumas_cinsi: row.kumas_cinsi || '',
            mevcut,
            sayilan: s,
            fark
        };
        sayilanlar.push(rec);
        if (fark !== 0) farklar.push(rec);
    });
    return { sayilanlar, farklar };
}

/* ---- Arşiv (yerel + sunucu; tarayıcı ve masaüstü aynı raporu görsün) ---- */

function sayimSb() {
    try {
        return (typeof sb !== 'undefined' && sb) ? sb : window.sb;
    } catch (e) {
        return null;
    }
}

function sayimArsivOku() {
    try {
        const raw = localStorage.getItem(SAYIM_ARSIV_LS);
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

function sayimArsivYaz(list) {
    try {
        localStorage.setItem(SAYIM_ARSIV_LS, JSON.stringify((list || []).slice(0, SAYIM_ARSIV_MAX)));
    } catch (e) {
        console.warn('sayım arşiv yazılamadı', e);
    }
}

function sayimArsivBirlestir(a, b) {
    const map = new Map();
    [...(b || []), ...(a || [])].forEach(r => {
        if (r && r.id) map.set(String(r.id), r);
    });
    return Array.from(map.values()).sort((x, y) => String(y.tarih || '').localeCompare(String(x.tarih || '')));
}

async function sayimArsivSunucuyaYaz(rapor) {
    const client = sayimSb();
    if (!client || !rapor?.id) return false;
    const row = {
        siparis_id: 0,
        islem: SAYIM_AKIS_ISLEM,
        kalem_ad: String(rapor.id),
        miktar: Number(rapor.fark_adet) || 0,
        notlar: JSON.stringify(rapor)
    };
    try {
        let ins = await client.from('siparis_akis').insert([row]);
        if (ins.error && /siparis_id/i.test(String(ins.error.message || ''))) {
            const r2 = { siparis_id: 0, ...row };
            delete r2.siparis_id;
            ins = await client.from('siparis_akis').insert([r2]);
        }
        if (ins.error) {
            console.warn('sayım rapor sunucu:', ins.error.message);
            return false;
        }
        return true;
    } catch (e) {
        console.warn('sayım rapor sunucu:', e?.message || e);
        return false;
    }
}

async function sayimArsivSunucudanCek(opts = {}) {
    if (_sayimArsivCekiliyor) return sayimArsivOku();
    const client = sayimSb();
    const yerel = sayimArsivOku();
    if (!client) {
        _sayimArsivCekildi = true;
        return yerel;
    }
    _sayimArsivCekiliyor = true;
    try {
        const q = client.from('siparis_akis')
            .select('kalem_ad,notlar,created_at,miktar')
            .eq('islem', SAYIM_AKIS_ISLEM)
            .order('created_at', { ascending: false })
            .limit(SAYIM_ARSIV_MAX);
        const res = typeof erpWithTimeout === 'function'
            ? await erpWithTimeout(q, 'sayim-arsiv', 18000)
            : await q;
        if (res.error) throw res.error;
        const sunucu = (res.data || []).map(row => {
            try {
                const j = JSON.parse(row.notlar || '');
                if (!j || typeof j !== 'object') return null;
                if (!j.id) j.id = row.kalem_ad;
                if (!j.tarih) j.tarih = row.created_at;
                return j;
            } catch (e) {
                return null;
            }
        }).filter(Boolean);
        const birlesik = sayimArsivBirlestir(yerel, sunucu).slice(0, SAYIM_ARSIV_MAX);
        sayimArsivYaz(birlesik);
        const sunucuIds = new Set(sunucu.map(r => String(r.id)));
        for (const r of yerel) {
            if (r?.id && !sunucuIds.has(String(r.id))) await sayimArsivSunucuyaYaz(r);
        }
        _sayimArsivCekildi = true;
        if (opts.render && (_sayimEkran === 'RAPOR' || _sayimEkran === 'ARSIV')) renderStokSayim();
        return birlesik;
    } catch (e) {
        console.warn('sayım arşiv çekilemedi', e?.message || e);
        _sayimArsivCekildi = true;
        return yerel;
    } finally {
        _sayimArsivCekiliyor = false;
    }
}

function sayimRaporNo() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return 'SY-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

function sayimRaporKaydet(rapor) {
    const list = sayimArsivOku();
    list.unshift(rapor);
    sayimArsivYaz(list);
}

function sayimGrupOzeti(satirlar) {
    const map = {};
    (satirlar || []).forEach(s => {
        const g = String(s.grup || '').trim() || 'Diğer';
        if (!map[g]) map[g] = { grup: g, kalem: 0, eski: 0, sayilan: 0, fark: 0 };
        map[g].kalem++;
        map[g].eski += Number(s.mevcut) || 0;
        map[g].sayilan += Number(s.sayilan) || 0;
        map[g].fark += Number(s.fark) || 0;
    });
    return Object.values(map).sort((a, b) => Math.abs(b.sayilan) - Math.abs(a.sayilan));
}

function sayimCanliGrupOzeti(tip) {
    const onceki = _sayimTip;
    _sayimTip = tip || _sayimTip;
    let rows = [];
    try { rows = sayimSatirlariOlustur(); } catch (e) { rows = []; }
    _sayimTip = onceki;
    const map = {};
    rows.forEach(r => {
        const g = String(r.grup || '').trim() || 'Diğer';
        if (!map[g]) map[g] = { grup: g, kalem: 0, stok: 0 };
        map[g].kalem++;
        map[g].stok += Number(r.mevcut) || 0;
    });
    return Object.values(map).sort((a, b) => Math.abs(b.stok) - Math.abs(a.stok));
}

function sayimRaporBul(id) {
    return sayimArsivOku().find(r => String(r.id) === String(id)) || null;
}

function stokSayimRaporAc(id) {
    _sayimAcikRaporId = id;
    _sayimEkran = 'RAPOR';
    renderStokSayim();
}
window.stokSayimRaporAc = stokSayimRaporAc;

function sayimRaporEkranHtml() {
    const arsiv = sayimArsivOku();
    const rapor = sayimRaporBul(_sayimAcikRaporId) || arsiv[0] || null;
    if (rapor && !_sayimAcikRaporId) _sayimAcikRaporId = rapor.id;

    const secHtml = arsiv.length
        ? `<select class="sayim-rapor-sec" onchange="stokSayimRaporAc(this.value)">
            ${arsiv.map(x => `<option value="${sayimEsc(x.id)}"${rapor && x.id === rapor.id ? ' selected' : ''}>${sayimEsc((x.tarih ? new Date(x.tarih).toLocaleString('tr-TR') : x.id) + ' · ' + sayimTipEtiket(x.tip) + ' · ' + x.id)}</option>`).join('')}
           </select>`
        : '';

    const govde = rapor ? sayimRaporDetayGovdeHtml(rapor) : sayimRaporBosHtml();

    return `<div class="sayim-shell${sayimMobilMi() ? ' sayim-shell--mobil' : ''}">
        <div class="sayim-header">
            ${sayimMobilMi() ? '' : '<h3 class="sayim-baslik">Stok Sayım</h3>'}
            ${sayimUstSekmeHtml()}
        </div>
        <div class="sayim-rapor-arac">${secHtml}
            ${rapor && !sayimMobilMi() ? `<button type="button" class="sayim-kaydet-btn" onclick="stokSayimRaporYazdir()">Yazdır</button>` : ''}
        </div>
        <div id="sayim-rapor-kagit">${govde}</div>
        ${rapor && sayimMobilMi() ? `<div class="sayim-actions"><button type="button" class="sayim-kaydet-btn" onclick="stokSayimRaporYazdir()">Raporu yazdır</button></div>` : ''}
    </div>`;
}

function sayimRaporBosHtml() {
    const canli = sayimCanliGrupOzeti(_sayimTip);
    const birim = sayimBirim();
    const grupKart = canli.length
        ? canli.map(g => `<div class="sayim-grup-kart">
            <div class="sayim-grup-ad">${sayimEsc(g.grup)}</div>
            <div class="sayim-grup-miktar">${sayimSayiYazi(g.stok, birim)}</div>
            <div class="sayim-grup-alt">${g.kalem} ürün</div>
        </div>`).join('')
        : `<div class="sayim-bos">Bu depoda grup özeti yok.</div>`;
    return `<div class="sayim-bos-kutu">${_sayimArsivCekiliyor && !_sayimArsivCekildi
        ? 'Kayıtlı sayım raporları sunucudan yükleniyor…'
        : 'Henüz kayıtlı sayım raporu yok. İplik / kumaş / mamülde sayımı kaydedince tarih, ürün farkları ve grup stokları burada durur.'}</div>
        <h4 class="sayim-bolum-baslik">Şu anki stok — ${sayimEsc(sayimTipEtiket(_sayimTip))}</h4>
        <div class="sayim-grup-grid">${grupKart}</div>`;
}

function sayimRaporDetayGovdeHtml(r) {
    const birim = r.birim || (r.tip === 'MAMUL' ? 'ad' : r.tip === 'KUMAS' ? 'mt' : 'kg');
    const satirlar = r.satirlar || [];
    const farklar = satirlar.filter(s => Number(s.fark) !== 0).sort((a, b) => Math.abs(b.fark) - Math.abs(a.fark));
    const artis = satirlar.reduce((a, s) => a + Math.max(0, Number(s.fark) || 0), 0);
    const eksilis = satirlar.reduce((a, s) => a + Math.min(0, Number(s.fark) || 0), 0);
    const yeniStok = satirlar.reduce((a, s) => a + (Number(s.sayilan) || 0), 0);
    const eskiStok = satirlar.reduce((a, s) => a + (Number(s.mevcut) || 0), 0);
    const tarih = r.tarih ? new Date(r.tarih).toLocaleString('tr-TR') : '—';
    const gruplar = sayimGrupOzeti(satirlar);
    const canliGrup = sayimCanliGrupOzeti(r.tip);

    const kpi = [
        { lbl: 'Sayım tarihi', val: tarih, alt: r.kullanici || '' },
        { lbl: 'Depo', val: sayimTipEtiket(r.tip), alt: r.id },
        { lbl: 'Sayılan kalem', val: String(satirlar.length), alt: (r.fark_adet || farklar.length) + ' kalemde fark' },
        { lbl: 'Yeni stok', val: sayimSayiYazi(yeniStok, birim), alt: 'Eski ' + sayimSayiYazi(eskiStok, birim) },
        { lbl: 'Fazla çıkan', val: '+' + sayimSayiYazi(artis, birim), cls: 'is-plus' },
        { lbl: 'Eksik çıkan', val: sayimSayiYazi(eksilis, birim), cls: 'is-minus' }
    ].map(k => `<div class="sayim-kpi${k.cls ? ' ' + k.cls : ''}">
        <div class="sayim-kpi-lbl">${k.lbl}</div>
        <div class="sayim-kpi-val">${sayimEsc(k.val)}</div>
        ${k.alt ? `<div class="sayim-kpi-alt">${sayimEsc(k.alt)}</div>` : ''}
    </div>`).join('');

    const grupKart = gruplar.length
        ? gruplar.map(g => {
            const f = Number(g.fark) || 0;
            const fCls = f > 0 ? 'fark-artis' : f < 0 ? 'fark-azalis' : '';
            return `<div class="sayim-grup-kart">
                <div class="sayim-grup-ad">${sayimEsc(g.grup)}</div>
                <div class="sayim-grup-miktar">${sayimSayiYazi(g.sayilan, birim)}</div>
                <div class="sayim-grup-alt">${g.kalem} ürün · fark <span class="${fCls}">${f > 0 ? '+' : ''}${sayimSayiYazi(f, birim)}</span></div>
            </div>`;
        }).join('')
        : `<div class="sayim-bos">Grup bilgisi yok</div>`;

    const canliKart = canliGrup.length
        ? canliGrup.map(g => `<div class="sayim-grup-kart sayim-grup-kart--canli">
            <div class="sayim-grup-ad">${sayimEsc(g.grup)}</div>
            <div class="sayim-grup-miktar">${sayimSayiYazi(g.stok, birim)}</div>
            <div class="sayim-grup-alt">${g.kalem} ürün · güncel stok</div>
        </div>`).join('')
        : '';

    const farkListe = farklar.length
        ? (sayimMobilMi()
            ? farklar.map(s => {
                const f = Number(s.fark) || 0;
                const cls = f > 0 ? ' fark-artis' : ' fark-azalis';
                const ekstra = [s.renk && s.renk !== '—' ? s.renk : '', s.ebat && s.ebat !== '—' ? s.ebat : ''].filter(Boolean).join(' · ');
                return `<article class="sayim-kart">
                    <div class="sayim-kart-ust">
                        <div class="sayim-kart-ad">${sayimEsc(s.label)}</div>
                        <span class="sayim-kart-fark${cls}">${f > 0 ? '+' : ''}${sayimSayiYazi(f, birim)}</span>
                    </div>
                    <div class="sayim-kart-kod">${sayimEsc(s.stok_kodu)}${s.grup ? ' · ' + sayimEsc(s.grup) : ''}${ekstra ? ' · ' + sayimEsc(ekstra) : ''}</div>
                    <div class="sayim-kart-alt"><span>eski ${sayimSayiYazi(s.mevcut, birim)}</span><span>sayılan ${sayimSayiYazi(s.sayilan, birim)}</span></div>
                </article>`;
            }).join('')
            : `<div class="ms-table-wrap"><table class="ms-table sayim-tablo">
            <thead><tr><th>Grup</th><th>Stok kodu</th><th>Ürün</th><th class="num">Eski</th><th class="num">Sayılan</th><th class="num">Fark</th></tr></thead>
            <tbody>${farklar.map(s => {
                const f = Number(s.fark) || 0;
                const cls = f > 0 ? ' fark-artis' : ' fark-azalis';
                const ekstra = [s.renk && s.renk !== '—' ? s.renk : '', s.ebat && s.ebat !== '—' ? s.ebat : ''].filter(Boolean).join(' · ');
                return `<tr>
                <td>${sayimEsc(s.grup || '—')}</td>
                <td class="ms-kod">${sayimEsc(s.stok_kodu)}</td>
                <td>${sayimEsc(s.label)}${ekstra ? ` <span class="sayim-mini">${sayimEsc(ekstra)}</span>` : ''}</td>
                <td class="num">${sayimSayiYazi(s.mevcut, birim)}</td>
                <td class="num">${sayimSayiYazi(s.sayilan, birim)}</td>
                <td class="num sayim-td-fark${cls}">${f > 0 ? '+' : ''}${sayimSayiYazi(f, birim)}</td>
            </tr>`;
            }).join('')}</tbody></table></div>`)
        : `<div class="sayim-bos">Bu sayımda stok farkı çıkmadı</div>`;

    const tumListe = sayimMobilMi()
        ? `<details class="sayim-tum-liste"><summary>Tüm sayılan kalemler (${satirlar.length})</summary>
            ${satirlar.map(s => {
                const f = Number(s.fark) || 0;
                const cls = f > 0 ? ' fark-artis' : f < 0 ? ' fark-azalis' : '';
                return `<article class="sayim-kart">
                    <div class="sayim-kart-ust">
                        <div class="sayim-kart-ad">${sayimEsc(s.label)}</div>
                        <span class="sayim-kart-fark${cls}">${f === 0 ? '0' : ((f > 0 ? '+' : '') + sayimSayiYazi(f, birim))}</span>
                    </div>
                    <div class="sayim-kart-kod">${sayimEsc(s.stok_kodu)}</div>
                    <div class="sayim-kart-alt"><span>eski ${sayimSayiYazi(s.mevcut, birim)}</span><span>sayılan ${sayimSayiYazi(s.sayilan, birim)}</span></div>
                </article>`;
            }).join('') || '<div class="sayim-bos">Satır yok</div>'}
           </details>`
        : `<details class="sayim-tum-liste">
            <summary>Tüm sayılan kalemler (${satirlar.length})</summary>
            <div class="ms-table-wrap"><table class="ms-table sayim-tablo">
                <thead><tr><th>Grup</th><th>Stok kodu</th><th>Ürün</th><th class="num">Eski</th><th class="num">Sayılan</th><th class="num">Fark</th></tr></thead>
                <tbody>${satirlar.map(s => {
                    const f = Number(s.fark) || 0;
                    const cls = f > 0 ? ' fark-artis' : f < 0 ? ' fark-azalis' : '';
                    return `<tr>
            <td>${sayimEsc(s.grup || '—')}</td>
            <td class="ms-kod">${sayimEsc(s.stok_kodu)}</td>
            <td>${sayimEsc(s.label)}</td>
            <td class="num">${sayimSayiYazi(s.mevcut, birim)}</td>
            <td class="num">${sayimSayiYazi(s.sayilan, birim)}</td>
            <td class="num sayim-td-fark${cls}">${f === 0 ? '0' : ((f > 0 ? '+' : '') + sayimSayiYazi(f, birim))}</td>
        </tr>`;
                }).join('') || `<tr><td colspan="6" style="text-align:center;padding:18px;color:#888">Satır yok</td></tr>`}</tbody>
            </table></div>
        </details>`;

    return `<div class="sayim-rapor-kagit">
        <div class="sayim-kpi-grid">${kpi}</div>
        <h4 class="sayim-bolum-baslik">Ürün grubu — sayım sonrası stok</h4>
        <div class="sayim-grup-grid">${grupKart}</div>
        ${canliKart ? `<h4 class="sayim-bolum-baslik">Ürün grubu — şu anki güncel stok</h4><div class="sayim-grup-grid">${canliKart}</div>` : ''}
        <h4 class="sayim-bolum-baslik">Fark çıkan ürünler</h4>
        ${farkListe}
        ${tumListe}
    </div>`;
}

function stokSayimRaporYazdir() {
    const el = document.getElementById('sayim-rapor-kagit');
    if (!el) return;
    const w = window.open('', '_blank', 'noopener,width=900,height=700');
    if (!w) { erpToast('Yazdırma penceresi açılamadı', 'warn'); return; }
    w.document.write(`<!doctype html><html><head><title>Stok sayım raporu</title>
        <style>
            body { font-family: sans-serif; color: #111; padding: 16px; }
            h1 { font-size: 18px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
            th.num, td.num { text-align: right; }
            .fark-artis { color: #166534; } .fark-azalis { color: #991b1b; }
        </style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
}
window.stokSayimRaporYazdir = stokSayimRaporYazdir;

/* ---- Kayıt: fark hareketi + rapor ---- */

function sayimHareketPayload(f) {
    const isGiris = f.fark > 0;
    const user = sayimKullanici();
    const notlar = `[SAYIM] ${f.stok_kodu} · eski ${f.mevcut} · sayılan ${f.sayilan} · fark ${f.fark > 0 ? '+' : ''}${f.fark}`;
    const kutup = (dataCache.kumas_kutuphanesi || []).find(k =>
        String(k.desen_kodu || k.stok_kodu || '').trim() === String(f.kayit_kodu || f.stok_kodu)) || {};
    const base = {
        stok_kodu: f.kayit_kodu || f.stok_kodu,
        islem_turu: isGiris ? 'GİRİŞ' : 'ÇIKIŞ',
        notlar,
        updated_by: user
    };
    if (_sayimTip === 'IPLIK') {
        const ipKart = typeof iplikKartlariListe === 'function'
            ? iplikKartlariListe().find(k => k.stok_kodu === f.stok_kodu) : null;
        return {
            ...base,
            iplik_no: ipKart?.iplik_no || '',
            marka: ipKart?.marka || '',
            cins: ipKart?.cins || '',
            lot_no: ipKart?.lot_no || '',
            miktar_kg: isGiris ? Math.abs(f.fark) : -Math.abs(f.fark),
            kaynak_birim: 'IPLIK'
        };
    }
    if (_sayimTip === 'MAMUL') {
        return {
            ...base,
            kumas_cinsi: kutup.kumas_cinsi || kutup.urun_adi || '',
            lot_no: kutup.lot_no || '',
            marka: kutup.firma || '',
            renk: kutup.renk || '',
            cuval_sayisi: isGiris ? Math.abs(Math.round(f.fark)) : -Math.abs(Math.round(f.fark)),
            miktar_kg: 0,
            miktar_mt: 0,
            kaynak_birim: 'DEPO_HAREKET_MAMUL_DEPO'
        };
    }
    return {
        ...base,
        kumas_cinsi: kutup.kumas_cinsi || kutup.urun_adi || '',
        lot_no: kutup.lot_no || '',
        marka: kutup.firma || '',
        renk: kutup.renk || '',
        miktar_mt: isGiris ? Math.abs(f.fark) : -Math.abs(f.fark),
        miktar_kg: 0,
        cuval_sayisi: 0,
        kaynak_birim: 'DEPO_HAREKET_KUMAS'
    };
}

async function sayimHareketleriYaz(table, payloads, onIlerleme) {
    const chunks = [];
    for (let i = 0; i < payloads.length; i += 40) chunks.push(payloads.slice(i, i + 40));
    const inserted = [];
    let done = 0;
    for (const chunk of chunks) {
        let insertPayload = chunk.map(x => ({ ...x }));
        const triedCols = new Set();
        let ok = false;
        for (let deneme = 0; deneme < 12 && !ok; deneme++) {
            const q = sb.from(table).insert(insertPayload).select('id,stok_kodu,created_at,cuval_sayisi,miktar_kg,miktar_mt,islem_turu,kaynak_birim,notlar');
            let ins;
            try {
                ins = typeof erpWithTimeout === 'function'
                    ? await erpWithTimeout(q, 'sayim-kayit', 22000)
                    : await q;
            } catch (e) {
                throw e;
            }
            if (!ins.error) {
                inserted.push(...(ins.data || []));
                ok = true;
                break;
            }
            const msg = String(ins.error?.message || '');
            const m = msg.match(/Could not find the '([^']+)' column/i);
            const missingCol = m?.[1];
            if (!missingCol || triedCols.has(missingCol)) throw ins.error;
            triedCols.add(missingCol);
            insertPayload = insertPayload.map(row => {
                const r = { ...row };
                delete r[missingCol];
                return r;
            });
        }
        if (!ok) throw new Error('Sayım hareketleri yazılamadı');
        done += chunk.length;
        if (typeof onIlerleme === 'function') onIlerleme(done, payloads.length);
    }
    return inserted;
}

function sayimCacheHareketEkle(table, payloads, inserted) {
    if (!dataCache[table]) dataCache[table] = [];
    const byKod = {};
    (inserted || []).forEach(r => {
        if (r?.stok_kodu) byKod[String(r.stok_kodu)] = r;
    });
    const now = new Date().toISOString();
    payloads.forEach(p => {
        const db = byKod[String(p.stok_kodu)] || {};
        dataCache[table].unshift({
            ...p,
            id: db.id || p.id,
            created_at: db.created_at || now
        });
    });
}

async function stokSayimKaydet() {
    if (_sayimKaydediliyor) return;
    const paket = sayimGirisPaketiniTopla();
    if (!paket.sayilanlar.length) {
        erpToast('Sayılan adet girilmedi. Doldurduğunuz satırlar yeni stok olur.', 'info');
        return;
    }
    const farkN = paket.farklar.length;
    const onayMsg = farkN
        ? `${paket.sayilanlar.length} kalem sayıldı. ${farkN} kalemde stok ${paket.farklar.filter(x => x.fark > 0).length ? 'artacak / ' : ''}düzeltilecek ve sayım raporu arşivlenecek. Devam edilsin mi?`
        : `${paket.sayilanlar.length} kalem sayıldı, fark yok. Rapor yine de arşivlensin mi?`;
    const ok = typeof erpAskConfirm === 'function' ? await erpAskConfirm(onayMsg) : confirm(onayMsg);
    if (!ok) return;

    _sayimKaydediliyor = true;
    const btn = document.getElementById('sayim-kaydet-btn');
    const btnYazi = (s) => { if (btn) { btn.disabled = true; btn.textContent = s; } };
    btnYazi('Kaydediliyor…');

    const rapor = {
        id: sayimRaporNo(),
        tarih: new Date().toISOString(),
        tip: _sayimTip,
        birim: sayimBirim(),
        kullanici: sayimKullanici(),
        satirlar: paket.sayilanlar,
        fark_adet: farkN
    };

    try {
        if (farkN) {
            const table = _sayimTip === 'IPLIK' ? 'iplik_stok' : 'kumas_stok';
            const payloads = paket.farklar.map(sayimHareketPayload);
            const inserted = await sayimHareketleriYaz(table, payloads, (a, b) => btnYazi(`Kaydediliyor ${a}/${b}…`));
            sayimCacheHareketEkle(table, payloads, inserted);
            if (typeof erpSyncTablesBackground === 'function') erpSyncTablesBackground([table]);
        }
        sayimRaporKaydet(rapor);
        btnYazi('Rapor senkron…');
        await sayimArsivSunucuyaYaz(rapor);
        _sayimArsivCekildi = true;
        Object.keys(_sayimGirisler).forEach(k => { delete _sayimGirisler[k]; });
        erpToast(farkN
            ? `Sayım kaydedildi. ${farkN} kalemde stok güncellendi. Rapor ${rapor.id} arşivlendi.`
            : `Sayım raporu ${rapor.id} arşivlendi. Stok değişmedi.`, 'success', 6000);
        _sayimAcikRaporId = rapor.id;
        _sayimEkran = 'RAPOR';
        renderStokSayim();
    } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        erpToast('Sayım kaydı tamamlanamadı: ' + msg, 'error', 8000);
        console.error('stokSayimKaydet', e);
    } finally {
        _sayimKaydediliyor = false;
        if (btn) { btn.disabled = false; btn.textContent = 'Sayımı kaydet'; }
    }
}
window.stokSayimKaydet = stokSayimKaydet;
window.renderStokSayim = renderStokSayim;
