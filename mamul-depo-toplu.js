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

    const kartEkle = (kart) => {
        const kod = String(kart?.desen_kodu || '').trim();
        if (!kod || seen.has(kod)) return;
        if (typeof depoMamulStokKartiDogrula === 'function' && depoMamulStokKartiDogrula(kod) !== null) return;
        if ((bakMap[kod] || 0) <= 0) return;
        seen.add(kod);
        kartlar.push(kart);
    };

    if (qLower && typeof mamulDepoAramaSonuclari === 'function') {
        mamulDepoAramaSonuclari(q, 80).forEach(kartEkle);
    } else {
        stokluKodlar.forEach(kod => {
            const kart = mamulTopluKartBul(kod)
                || (dataCache.kumas_kutuphanesi || []).find(x => String(x.desen_kodu || '').trim() === kod);
            if (kart) kartEkle(kart);
        });
        if (qLower) {
            const filtered = kartlar.filter(k => {
                const blob = [k.desen_kodu, k.urun_adi, k.desen_adi, k.firma, k.kumas_cinsi, k.renk]
                    .map(v => String(v || '').toLowerCase()).join(' ');
                return blob.includes(qLower);
            });
            filtered.sort((a, b) => (bakMap[b.desen_kodu] || 0) - (bakMap[a.desen_kodu] || 0));
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
    window._mamulTopluSatirlar = [{ kod: '', ad: '', adet: '', not: '', hata: '' }];
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
    r.ad = coz.kart?.urun_adi || coz.kart?.desen_adi || coz.kart?.kumas_cinsi || '—';
    r.hata = '';
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
    window._mamulTopluSatirlar.push({ kod: '', ad: '', adet: '', not: '', hata: '' });
    mamulTopluListeRender();
}

function mamulTopluSatirSil(idx) {
    const rows = window._mamulTopluSatirlar || [];
    if (rows.length <= 1) window._mamulTopluSatirlar = [{ kod: '', ad: '', adet: '', not: '', hata: '' }];
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
                r.ad = coz.kart?.urun_adi || coz.kart?.desen_adi || coz.kart?.kumas_cinsi || '—';
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
    return (dataCache.kumas_kutuphanesi || []).find(x => String(x.desen_kodu || '').trim() === k) || null;
}

function mamulTopluKodAra(q, limit = 12) {
    if (mamulDepoCikisSecimModu()) return mamulDepoStoktaKartlar(q, limit);
    const s = String(q || '').trim();
    if (!s) return [];
    if (typeof mamulDepoAramaSonuclari === 'function') return mamulDepoAramaSonuclari(s, limit);
    const qLower = s.toLowerCase();
    return (dataCache.kumas_kutuphanesi || []).filter(x =>
        x.desen_kodu && !String(x.desen_kodu).startsWith('NU') && kumasKutuphanesiKartiMamulMu(x) &&
        [x.desen_kodu, x.urun_adi, x.desen_adi, x.firma, x.kumas_cinsi, x.renk]
            .some(v => String(v || '').toLowerCase().includes(qLower))
    ).slice(0, limit);
}

function mamulTopluKodEtiket(kart) {
    if (typeof mamulTopluUrunDetayOlustur === 'function') {
        const d = mamulTopluUrunDetayOlustur(kart);
        return { ad: d.ad, renk: d.renk, ebat: d.ebat, musteri: d.musteri };
    }
    if (!kart) return { ad: '—', renk: '', ebat: '', musteri: '' };
    return {
        ad: kart.urun_adi || kart.desen_adi || kart.kumas_cinsi || '—',
        renk: kart.renk || '',
        ebat: '',
        musteri: kart.firma || ''
    };
}

function mamulTopluKodCoz(girdi) {
    const raw = String(girdi || '').trim();
    if (!raw) return { kod: '', kart: null, hata: '', adaylar: [] };
    const exactHata = depoMamulStokKartiDogrula(raw);
    if (!exactHata) {
        if (mamulDepoCikisSecimModu() && mamulDepoAdetBakiye(raw) <= 0) {
            return { kod: raw, kart: null, hata: `"${raw}" stokta yok — yalnız stokta bulunan ürün çıkılabilir`, adaylar: [] };
        }
        const kart = mamulTopluKartBul(raw);
        return { kod: raw, kart, hata: '', adaylar: [] };
    }
    const adaylar = mamulTopluKodAra(raw, 12);
    if (adaylar.length === 1) {
        const kart = adaylar[0];
        const kod = String(kart.desen_kodu || '').trim();
        return { kod, kart, hata: '', adaylar: [], otomatik: true };
    }
    if (adaylar.length > 1) {
        return { kod: raw, kart: null, hata: '', adaylar, coklu: true };
    }
    return { kod: raw, kart: null, hata: exactHata || `"${raw}" için mamül kartı bulunamadı`, adaylar: [] };
}

window._mamulTopluDropIdx = -1;

function mamulTopluKodDropKapat() {
    document.querySelectorAll('#mamul-toplu-kod-drop').forEach(drop => {
        drop.classList.remove('is-open');
        drop.style.display = 'none';
        drop.style.pointerEvents = 'none';
        drop.innerHTML = '';
    });
    window._mamulTopluDropIdx = -1;
}

function mamulTopluKodDropGoster(idx, adaylar) {
    const inp = document.getElementById('mt-kod-' + idx);
    const drop = document.getElementById('mamul-toplu-kod-drop');
    if (!inp || !drop || !adaylar?.length) return;
    window._mamulTopluDropIdx = idx;
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    drop.innerHTML = adaylar.map(k => {
        const et = mamulTopluKodEtiket(k);
        const kodEsc = esc(k.desen_kodu);
        const bak = mamulDepoAdetBakiye(k.desen_kodu);
        const metaParca = [et.ebat, et.renk, et.musteri].filter(Boolean);
        if (mamulDepoCikisSecimModu()) metaParca.push(bak + ' ad stok');
        return `<div class="mamul-toplu-kod-drop-item" onmousedown="event.preventDefault();mamulTopluKodSec(${idx},'${kodEsc.replace(/'/g, "\\'")}')">
            <span class="mamul-toplu-kod-drop-item__kod">${kodEsc}</span>
            <span class="mamul-toplu-kod-drop-item__ad">${esc(et.ad)}</span>
            ${metaParca.length ? `<span class="mamul-toplu-kod-drop-item__meta">${metaParca.map(x => esc(x)).join(' · ')}</span>` : ''}
        </div>`;
    }).join('');
    const rect = inp.getBoundingClientRect();
    drop.style.position = 'fixed';
    drop.style.display = 'block';
    drop.style.pointerEvents = 'auto';
    drop.classList.add('is-open');
    drop.style.top = (rect.bottom + 4) + 'px';
    drop.style.left = Math.max(8, rect.left) + 'px';
    drop.style.width = Math.max(rect.width, 300) + 'px';
    if (drop.parentElement !== document.body) document.body.appendChild(drop);
}

function mamulTopluKodSec(idx, kod) {
    window._mamulTopluDropSeciliyor = true;
    const rows = window._mamulTopluSatirlar || [];
    if (!rows[idx]) return;
    const k = String(kod || '').trim();
    if (mamulDepoCikisSecimModu() && mamulDepoAdetBakiye(k) <= 0) {
        if (typeof erpToast === 'function') erpToast('Bu ürün stokta yok — çıkış yapılamaz.', 'error', 4500);
        window._mamulTopluDropSeciliyor = false;
        return;
    }
    const inp = document.getElementById('mt-kod-' + idx);
    if (inp) inp.value = k;
    rows[idx].kod = k;
    rows[idx].hata = '';
    const kart = mamulTopluKartBul(k);
    rows[idx].ad = kart?.urun_adi || kart?.desen_adi || kart?.kumas_cinsi || '—';
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
            const stoktakiler = mamulDepoStoktaKartlar('', 12);
            if (stoktakiler.length) mamulTopluKodDropGoster(idx, stoktakiler);
            else mamulTopluKodDropKapat();
        } else {
            mamulTopluKodDropKapat();
        }
        const urunEl = document.querySelector(`#mamul-toplu-hareket-body .mamul-toplu-hareket-row:nth-child(${idx + 1}) .mamul-toplu-hareket-urun`);
        if (urunEl && !q) urunEl.textContent = '—';
        return;
    }
    if (!depoMamulStokKartiDogrula(q)) {
        mamulTopluKodDropKapat();
        const kart = mamulTopluKartBul(q);
        rows[idx].ad = kart?.urun_adi || kart?.desen_adi || kart?.kumas_cinsi || '—';
        mamulTopluListeRender();
        mamulTopluOzetGuncelle();
        return;
    }
    const adaylar = mamulTopluKodAra(q, 10);
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
        mamulTopluListeRender();
        mamulTopluOzetGuncelle();
        return;
    }
    const coz = mamulTopluKodCoz(girdi);
    if (coz.coklu && coz.adaylar.length) {
        rows[idx].kod = girdi;
        rows[idx].hata = `${coz.adaylar.length} eşleşme — listeden seçin`;
        rows[idx].ad = '—';
        mamulTopluKodDropGoster(idx, coz.adaylar);
    } else if (coz.hata) {
        rows[idx].kod = girdi;
        rows[idx].hata = coz.hata;
        rows[idx].ad = '';
    } else {
        rows[idx].kod = coz.kod;
        rows[idx].hata = '';
        rows[idx].ad = coz.kart?.urun_adi || coz.kart?.desen_adi || coz.kart?.kumas_cinsi || '—';
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
    const rows = window._mamulTopluSatirlar || [];
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    host.innerHTML = rows.map((r, idx) => {
        const kart = (!r.hata && r.kod) ? mamulTopluKartBul(r.kod) : null;
        const detay = kart && typeof mamulTopluUrunDetayOlustur === 'function'
            ? mamulTopluUrunDetayOlustur(kart)
            : null;
        const urunTitle = r.hata
            ? r.hata
            : (detay && typeof mamulTopluUrunDetayMetin === 'function'
                ? mamulTopluUrunDetayMetin(detay)
                : (r.ad || '—'));
        const urunInner = r.hata
            ? `<span style="color:var(--rose-c)">${esc(r.hata)}</span>`
            : (detay && typeof mamulTopluUrunDetayHtml === 'function'
                ? mamulTopluUrunDetayHtml(detay, esc)
                : esc(r.ad || '—'));
        return `
        <div class="mamul-toplu-hareket-row${r.hata ? ' has-error' : ''}">
            <div class="mamul-toplu-kod-cell">
            <input id="mt-kod-${idx}" class="pro-input" placeholder="Kod veya ürün adı" value="${esc(r.kod)}"
                oninput="mamulTopluKodInput(${idx})" onblur="mamulTopluKodBlur(${idx})"
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
        if (kod) {
            const coz = mamulTopluKodCoz(kod);
            if (!coz.hata && !coz.coklu && coz.kod) kod = coz.kod;
            else if (coz.coklu) { hatalar.push(`Satır ${i + 1}: "${kod}" için ${coz.adaylar.length} eşleşme — kod seçin`); return; }
        }
        const ad = parseInt(r.adet, 10) || 0;
        if (!kod && !ad) return;
        if (!kod) { hatalar.push(`Satır ${i + 1}: stok kodu boş`); return; }
        if (ad <= 0) { hatalar.push(`Satır ${i + 1}: adet girin`); return; }
        const kartHata = depoMamulStokKartiDogrula(kod);
        if (kartHata) { hatalar.push(`Satır ${i + 1}: ${kartHata}`); return; }
        kodToplam[kod] = (kodToplam[kod] || 0) + ad;
        const kart = mamulTopluKartBul(kod);
        const sign = isCikis ? -1 : 1;
        const satirNot = [genelNot, r.not].filter(Boolean).join(' · ');
        const notlarVal = isCikis
            ? (typeof depoNotlarWithTeslimDetay === 'function'
                ? depoNotlarWithTeslimDetay(depoNotlarWithBirim('AD', satirNot), typeof muhasebeFisTeslimFormOku === 'function' ? muhasebeFisTeslimFormOku() : null)
                : depoNotlarWithBirim('AD', satirNot))
            : depoNotlarWithBirim('AD', satirNot);
        payloads.push({
            stok_kodu: kod,
            kumas_cinsi: kart?.kumas_cinsi || kart?.urun_adi || '',
            lot_no: kart?.lot_no || '',
            marka: kart?.firma || '',
            renk: kart?.renk || '',
            cuval_sayisi: sign * ad,
            irsaliye_no: isCikis ? irs : '',
            firma: isCikis ? firmaCikis.toUpperCase() : '',
            notlar: notlarVal,
            islem_turu: movementType,
            kaynak_birim: 'DEPO_HAREKET_MAMUL_DEPO',
            updated_by: String(erpCurrentUser?.display_name || erpCurrentUser?.username || 'Sistem').trim() || 'Sistem',
            islem_gecmisi: `✨ ${new Date().toLocaleString('tr-TR')} — Toplu mamül ${isCikis ? 'çıkış' : 'giriş'}`
        });
    });
    if (!payloads.length && !hatalar.length) return { err: 'En az bir satırda stok kodu ve adet girin.' };
    if (hatalar.length) return { err: hatalar.slice(0, 5).join('\n') + (hatalar.length > 5 ? `\n… +${hatalar.length - 5} hata` : '') };
    if (isCikis) {
        for (const [kod, istenen] of Object.entries(kodToplam)) {
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
        let insertPayload = payloads.map(x => ({ ...x }));
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
        let fisNo = '';
        if (movementType === 'ÇIKIŞ' && typeof muhasebeFisMamulCikisKaydet === 'function') {
            try {
                const fis = await muhasebeFisMamulCikisKaydet({ payloads, hareketIds });
                if (fis?.fis_no) fisNo = fis.fis_no;
            } catch (e) { console.warn('muhasebe fişi:', e?.message || e); }
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
        } else {
            loadData();
        }
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
                        <span class="mdf-hint">Kod veya ürün adı yazın, adet girin.</span>
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
    const t = tip === 'ÇIKIŞ' ? 'ÇIKIŞ' : 'GİRİŞ';
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
        sub.textContent = `${n} ürün`;
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
                <th class="num">Stok</th><th>Son hareket</th><th></th>
            </tr></thead><tbody>`;
        html += grps.map((g, idx) => {
            const kod = String(g.stok_kodu || '').trim();
            const adet = g.adet != null ? (parseInt(g.adet, 10) || 0) : (parseInt(g.net_ad, 10) || 0);
            const detay = g._detay || null;
            const ad = detay?.ad || g.urun_adi || g.kumas_cinsi || '—';
            const grup = detay?.grup || 'Diğer';
            const renk = detay?.renk || '—';
            const ebat = detay?.ebat || '—';
            const qtyCls = adet < 0 ? ' is-neg' : (adet === 0 ? ' is-zero' : '');
            const kodJs = attr(kod);
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
                <td onclick="event.stopPropagation()">
                    <div class="ms-acts">
                        <button type="button" class="ms-act" onclick="mamulStokHizliIslem('GİRİŞ','${kodJs}')">Giriş</button>
                        <button type="button" class="ms-act" onclick="mamulStokHizliIslem('ÇIKIŞ','${kodJs}')">Sevk</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
        html += `</tbody></table></div></div>`;
        return html;
    }
    html += grps.map((g, idx) => {
        const kod = String(g.stok_kodu || '').trim();
        const adet = g.adet != null ? (parseInt(g.adet, 10) || 0) : (parseInt(g.net_ad, 10) || 0);
        const detay = g._detay || null;
        const ad = detay?.ad || g.urun_adi || g.kumas_cinsi || '—';
        const grup = detay?.grup || '';
        const meta = [grup, kod, detay?.ebat, detay?.renk, detay?.musteri].filter(Boolean).join(' · ');
        const qtyCls = adet < 0 ? ' is-neg' : (adet === 0 ? ' is-zero' : '');
        const kodJs = attr(kod);
        return `<article class="ms-row">
            <button type="button" class="ms-row-main" onclick="${rowFn}(${idx})">
                <div class="ms-name">${esc(ad)}</div>
                <div class="ms-meta">${esc(meta)}</div>
            </button>
            <div class="ms-qty${qtyCls}">${adet.toLocaleString('tr-TR')}<em>ad</em></div>
            <div class="ms-acts">
                <button type="button" class="ms-act" onclick="mamulStokHizliIslem('GİRİŞ','${kodJs}')">Giriş</button>
                <button type="button" class="ms-act" onclick="mamulStokHizliIslem('ÇIKIŞ','${kodJs}')">Sevk</button>
            </div>
        </article>`;
    }).join('');
    html += `</div>`;
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
    return `<div id="mamul-stok-shell" class="ms-ekran${desk ? ' ms-ekran--desk' : ''}">
        <div class="ms-head">
            <div class="ms-head-meta">
                <div class="ms-qty-hero${net < 0 ? ' is-neg' : ''}" id="mamul-stok-hero-ad">${Number(net).toLocaleString('tr-TR')}<span>adet</span></div>
                <div class="ms-sub" id="mamul-stok-sub">${(grps || []).length} ürün</div>
                <div class="ms-seg">
                    ${seg('POZITIF', 'Stokta', sayac.pozitif)}
                    ${seg('HEPSI', 'Tümü', sayac.hepsi)}
                    ${seg('KRITIK', 'Tükendi', sayac.kritik)}
                </div>
            </div>
            <div class="ms-tools">
                <button type="button" class="ms-btn ms-btn-giris" onclick="mamulStokHizliIslem('GİRİŞ')">Giriş</button>
                <button type="button" class="ms-btn ms-btn-sevk" onclick="mamulStokHizliIslem('ÇIKIŞ')">Sevkiyat</button>
                <button type="button" class="ms-btn ms-btn-ghost" onclick="mamulStokHareketlereGit()">Hareketler</button>
                ${typeof exportMamulStokPdf === 'function' ? `<button type="button" class="ms-btn ms-btn-ghost" onclick="exportMamulStokPdf()">PDF</button>` : ''}
            </div>
        </div>
        ${filtreBar}
        <div id="mamul-stok-dynamic">${mamulStokListeDynamicHtml(grps, ozet, opts)}</div>
    </div>`;
}
window.mamulStokListeEkranHtml = mamulStokListeEkranHtml;
