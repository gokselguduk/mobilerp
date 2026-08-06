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
let mamulDepoGirisMod = 'TEKLI';

function mamulDepoModSec(mod) {
    mamulDepoGirisMod = mod === 'TOPLU' ? 'TOPLU' : 'TEKLI';
    const tekli = document.getElementById('mamul-depo-tekli-wrap');
    const toplu = document.getElementById('mamul-depo-toplu-wrap');
    const tekPrev = document.getElementById('mamul-depo-tekli-preview');
    const topPrev = document.getElementById('mamul-depo-toplu-preview');
    const grid = document.getElementById('inputs-grid');
    if (tekli) tekli.style.display = mamulDepoGirisMod === 'TEKLI' ? '' : 'none';
    if (toplu) toplu.style.display = mamulDepoGirisMod === 'TOPLU' ? '' : 'none';
    if (tekPrev) tekPrev.style.display = mamulDepoGirisMod === 'TEKLI' ? '' : 'none';
    if (topPrev) topPrev.style.display = mamulDepoGirisMod === 'TOPLU' ? '' : 'none';
    if (grid) {
        const mobil = document.body?.classList?.contains('mobil-erp-body') || window.matchMedia('(max-width: 900px)').matches;
        if (mobil) grid.style.cssText = 'display:flex;flex-direction:column;gap:12px;overflow:visible';
        else grid.style.gridTemplateColumns = mamulDepoGirisMod === 'TOPLU' ? '1fr' : '1fr 260px';
    }
    document.querySelectorAll('.mamul-depo-mod-btn').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.mod === mamulDepoGirisMod);
    });
    const actBtn = document.getElementById('main-action-btn');
    if (actBtn) actBtn.textContent = mamulDepoGirisMod === 'TOPLU' ? 'Toplu Kaydet' : 'Kaydet';
    if (mamulDepoGirisMod === 'TOPLU' && !(window._mamulTopluSatirlar || []).length) mamulTopluSatirBaslat();
    mamulTopluOzetGuncelle();
}

function mamulTopluSatirBaslat() {
    mamulTopluKodDropKapat();
    window._mamulTopluSatirlar = [{ kod: '', ad: '', adet: '', not: '', hata: '' }];
    mamulTopluListeRender();
}

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
    const drop = document.getElementById('mamul-toplu-kod-drop');
    if (drop) {
        drop.style.display = 'none';
        drop.innerHTML = '';
    }
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
        const metaParca = [et.ebat, et.renk, et.musteri].filter(Boolean);
        return `<div class="mamul-toplu-kod-drop-item" onmousedown="event.preventDefault();mamulTopluKodSec(${idx},'${kodEsc.replace(/'/g, "\\'")}')">
            <span class="mamul-toplu-kod-drop-item__kod">${kodEsc}</span>
            <span class="mamul-toplu-kod-drop-item__ad">${esc(et.ad)}</span>
            ${metaParca.length ? `<span class="mamul-toplu-kod-drop-item__meta">${metaParca.map(x => esc(x)).join(' · ')}</span>` : ''}
        </div>`;
    }).join('');
    const rect = inp.getBoundingClientRect();
    drop.style.position = 'fixed';
    drop.style.display = 'block';
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
    if (q.length < 2) {
        mamulTopluKodDropKapat();
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
    let teslimTur = '';
    let firmaCikis = '';
    let irs = '';
    const genelNot = document.getElementById('val-notlar-toplu')?.value?.trim() || '';
    if (isCikis) {
        teslimTur = document.getElementById('val-cikis-yeri')?.value?.trim() || '';
        firmaCikis = document.getElementById('val-afirma')?.value?.trim() || '';
        irs = document.getElementById('val-irs-toplu')?.value?.trim() || '';
        if (!teslimTur) return { err: 'Çıkış için teslim türü seçin.' };
        if (teslimTur !== 'DEPO TRANSFER' && !firmaCikis) return { err: 'Çıkışta müşteri/alıcı firma zorunludur.' };
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
            ? depoNotlarWithBirimTeslim('AD', teslimTur, satirNot)
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
    if (!confirm(`${payloads.length} satır mamül ${movementType === 'ÇIKIŞ' ? 'çıkış' : 'giriş'} kaydedilsin mi?`)) return;
    isSaveInProgress = true;
    try {
        let insertPayload = payloads.map(x => ({ ...x }));
        const triedCols = new Set();
        while (true) {
            const { error } = await sb.from('kumas_stok').insert(insertPayload);
            if (!error) break;
            const msg = String(error?.message || '');
            const m = msg.match(/Could not find the '([^']+)' column/i);
            const missingCol = m?.[1];
            if (!missingCol || triedCols.has(missingCol)) throw error;
            triedCols.add(missingCol);
            insertPayload = insertPayload.map(row => { const r = { ...row }; delete r[missingCol]; return r; });
        }
        if (typeof erpSyncTablesBackground === 'function') erpSyncTablesBackground(['kumas_stok']);
        else if (typeof syncAllData === 'function') {
            syncAllData(false, { silent: true, light: true, tables: ['kumas_stok'] }).catch(() => {});
        }
        erpToast(`${payloads.length} mamül hareketi kaydedildi.`, 'success', 5000);
        window._mamulTopluSatirlar = [];
        mamulTopluSatirBaslat();
        loadData();
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
    return `
        <!-- SOL -->
        <div style="display:flex;flex-direction:column;gap:12px;overflow:visible">

            <!-- Hareket Tipi Banner -->
            <div class="panel-box" style="padding:12px 16px;border-left:3px solid ${accentColor};background:rgba(${accentRgb},0.05)">
                <div style="display:flex;align-items:center;justify-content:space-between">
                    <div style="display:flex;align-items:center;gap:10px">
                        <span style="font-size:22px">${isGiris ? '📥' : '📤'}</span>
                        <div>
                            <div style="font-size:8px;font-weight:700;color:var(--text3);text-transform:uppercase;font-family:'DM Mono',monospace">Depo işlemi</div>
                            <div style="font-family:'Instrument Serif',serif;font-size:18px;color:${accentColor}">${isGiris ? 'Depo girişi — Mamül' : 'Sevkiyat — Mamül'}</div>
                            <div style="font-size:9px;color:var(--text3);margin-top:4px">${isGiris ? 'Tek tek veya toplu giriş — stok kodu + adet' : 'Tek tek veya toplu çıkış — stok kodu + adet + teslim bilgisi'}</div>
                        </div>
                    </div>
                    <div style="font-size:9px;font-weight:700;color:var(--text3);font-family:'DM Mono',monospace">${new Date().toLocaleDateString('tr-TR')}</div>
                </div>
                <div class="mamul-depo-mod-bar" style="margin-top:12px">
                    <button type="button" class="mamul-depo-mod-btn is-active" data-mod="TEKLI" onclick="mamulDepoModSec('TEKLI')">Tek tek</button>
                    <button type="button" class="mamul-depo-mod-btn" data-mod="TOPLU" onclick="mamulDepoModSec('TOPLU')">${isGiris ? 'Toplu giriş' : 'Toplu çıkış'}</button>
                </div>
            </div>

            ${!isGiris ? `
            <!-- ÇIKIŞ YERİ (tekli + toplu ortak) -->
            <div class="panel-box" style="padding:0;overflow:hidden;border-left:3px solid var(--rose-c)">
                <div class="panel-head">
                    <div class="panel-head-title"><span class="panel-head-dot" style="background:var(--rose-c)"></span>📍 TESLİM YERİ</div>
                </div>
                <div style="padding:14px 16px;display:flex;flex-direction:column;gap:10px">
                    <div>
                        <label class="pro-label" style="color:var(--rose-c)">TESLİM TÜRÜ</label>
                        <select id="val-cikis-yeri" onchange="checkMamulExit(this);updateMamulPreview()" class="pro-input"
                            style="border-color:rgba(251,113,133,0.3)">
                            <option value="İÇ SATIŞ">🏠 İÇ SATIŞ</option>
                            <option value="DIŞ SATIŞ / İHRACAT">🌍 DIŞ SATIŞ / İHRACAT</option>
                            <option value="FASON">🏭 FASON</option>
                            <option value="DEPO TRANSFER">📦 DEPO TRANSFER</option>
                            <option value="DİĞER">📋 DİĞER</option>
                        </select>
                    </div>
                    <div id="wrap-mamul-firma">
                        <label class="pro-label" style="color:var(--rose-c)">MÜŞTERİ / ALICI FİRMA <span class="req-star">★</span></label>
                        <input id="val-afirma" oninput="updateMamulPreview()" class="pro-input" placeholder="Kime verildi — firma / müşteri adı..."
                            style="text-transform:uppercase;border-color:rgba(251,113,133,0.3)">
                    </div>
                </div>
            </div>` : ''}

            <div id="mamul-depo-tekli-wrap">
            <!-- ÜRÜN ARA & SEÇ -->
            <div class="panel-box search-panel" style="padding:0;overflow:visible;border-left:3px solid ${accentColor}">
                <div class="panel-head">
                    <div class="panel-head-title"><span class="panel-head-dot" style="background:${accentColor}"></span>🔍 ÜRÜN SEÇ</div>
                </div>
                <div style="padding:14px 16px;display:flex;flex-direction:column;gap:10px;overflow:visible">
                    <div style="position:relative">
                        <label class="pro-label" style="color:${accentColor}">STOK KODU veya ÜRÜN ADI ile Ara</label>
                        <input id="mamul-search" class="pro-input" placeholder="2026001 veya ürün adı yazın..."
                            oninput="mamulSearch(this.value)"
                            style="font-family:'DM Mono',monospace;border-color:rgba(${accentRgb},0.35)">
                        <div id="mamul-search-results" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:9999;background:var(--surface);border:1px solid var(--border2);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.15);max-height:220px;overflow-y:auto;margin-top:4px"></div>
                    </div>

                    <!-- Seçilen ürün kartı -->
                    <div id="mamul-selected-card" style="display:none;padding:12px 14px;border-radius:10px;border:1.5px solid rgba(${accentRgb},0.35);background:rgba(${accentRgb},0.06)">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                            <div style="font-size:9px;font-weight:700;color:${accentColor};font-family:'DM Mono',monospace;text-transform:uppercase">Seçilen Ürün</div>
                            <button onclick="mamulClearSelection()" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:14px" title="Seçimi temizle">✕</button>
                        </div>
                        <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:11px">
                            <span style="font-family:'DM Mono',monospace;font-weight:700;color:${accentColor}" id="msel-kod">—</span>
                            <span style="font-weight:600;color:var(--text)" id="msel-ad">—</span>
                            <span style="font-size:9px;color:var(--text3)">Cins</span>
                            <span style="font-size:10px;color:var(--text2)" id="msel-cins">—</span>
                            <span style="font-size:9px;color:var(--text3)">Lot</span>
                            <span style="font-size:10px;color:var(--text2);font-family:'DM Mono',monospace" id="msel-lot">—</span>
                            <span style="font-size:9px;color:var(--text3)">Mevcut Stok</span>
                            <span style="font-size:11px;font-weight:700;color:var(--emerald-c);font-family:'DM Mono',monospace" id="msel-stok">— ad</span>
                        </div>
                    </div>
                    <input type="hidden" id="val-stok-kodu-mamul">
                </div>
            </div>

            ${isGiris ? `
            <!-- STOK GİRİŞİ — yalnız adet + tarih + not -->
            <div class="panel-box" style="padding:0;overflow:hidden;border-left:3px solid ${accentColor}">
                <div class="panel-head">
                    <div class="panel-head-title"><span class="panel-head-dot" style="background:${accentColor}"></span>📦 STOK GİRİŞİ</div>
                </div>
                <div style="padding:14px 16px;display:grid;grid-template-columns:1fr;gap:10px">
                    <div>
                        <label id="val-kg-label" class="pro-label" style="color:${accentColor}">ADET <span class="req-star">★</span></label>
                        <input id="val-kg" type="number" min="1" step="1" oninput="updateMamulPreview()" class="pro-input"
                            style="font-family:'DM Mono',monospace;font-size:20px;font-weight:700;color:${accentColor};border-color:rgba(${accentRgb},0.35);text-align:center"
                            placeholder="0">
                        <input type="hidden" id="val-miktar-birim" value="AD">
                        <input type="hidden" id="val-cuval" value="0">
                    </div>
                    <div>
                        <label class="pro-label">GİRİŞ TARİHİ</label>
                        <input id="val-mamul-giris-tarih" readonly class="pro-input"
                            value="${new Date().toLocaleString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}"
                            style="font-family:'DM Mono',monospace;font-size:12px;color:var(--text2);background:var(--surface2);cursor:default">
                    </div>
                    <div>
                        <label class="pro-label">NOTLAR</label>
                        <textarea id="val-notlar" rows="3" class="pro-input" placeholder="Stok girişi ile ilgili not..."
                            style="resize:vertical;line-height:1.6;font-size:11px"></textarea>
                    </div>
                </div>
            </div>` : `
            <!-- STOK ÇIKIŞI -->
            <div class="panel-box" style="padding:0;overflow:hidden;border-left:3px solid ${accentColor}">
                <div class="panel-head">
                    <div class="panel-head-title"><span class="panel-head-dot" style="background:${accentColor}"></span>📦 STOK ÇIKIŞI</div>
                </div>
                <div style="padding:14px 16px;display:grid;grid-template-columns:1fr;gap:10px">
                    <div>
                        <label id="val-kg-label" class="pro-label" style="color:${accentColor}">ADET <span class="req-star">★</span></label>
                        <input id="val-kg" type="number" min="1" step="1" oninput="updateMamulPreview()" class="pro-input"
                            style="font-family:'DM Mono',monospace;font-size:20px;font-weight:700;color:${accentColor};border-color:rgba(${accentRgb},0.35);text-align:center"
                            placeholder="0">
                        <input type="hidden" id="val-miktar-birim" value="AD">
                        <input type="hidden" id="val-cuval" value="0">
                    </div>
                    <div>
                        <label class="pro-label">İRSALİYE / EVRAK NO</label>
                        <input id="val-irs" oninput="updateMamulPreview()" class="pro-input" placeholder="Çıkış irsaliye no...">
                    </div>
                    <div>
                        <label class="pro-label">NOTLAR</label>
                        <textarea id="val-notlar" rows="3" class="pro-input" placeholder="Sevkiyat notu..."
                            style="resize:vertical;line-height:1.6;font-size:11px"></textarea>
                    </div>
                </div>
            </div>`}
            </div><!-- /mamul-depo-tekli-wrap -->

            <div id="mamul-depo-toplu-wrap" style="display:none">
            <div class="panel-box" style="padding:0;overflow:hidden;border-left:3px solid ${accentColor}">
                <div class="panel-head">
                    <div class="panel-head-title"><span class="panel-head-dot" style="background:${accentColor}"></span>📋 TOPLU ${isGiris ? 'GİRİŞ' : 'ÇIKIŞ'} LİSTESİ</div>
                </div>
                <div style="padding:12px 14px;display:flex;flex-direction:column;gap:10px">
                    <div style="font-size:10px;color:var(--text3);line-height:1.5">Her satıra <b>stok kodu</b> veya <b>ürün adı</b> yazın — ad yazınca eşleşen kodlar listelenir. <b>Adet</b> zorunlu. Excel yapıştırma da desteklenir.</div>
                    ${isGiris ? `
                    <div>
                        <label class="pro-label">GENEL NOT <span style="font-size:8px;color:var(--text3)">(tüm satırlara uygulanır)</span></label>
                        <textarea id="val-notlar-toplu" rows="2" class="pro-input" placeholder="Toplu giriş notu..." style="resize:vertical;font-size:11px"></textarea>
                    </div>
                    <div>
                        <label class="pro-label">GİRİŞ TARİHİ</label>
                        <input readonly class="pro-input" value="${new Date().toLocaleString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}"
                            style="font-family:'DM Mono',monospace;font-size:12px;background:var(--surface2);cursor:default">
                    </div>` : `
                    <div>
                        <label class="pro-label">İRSALİYE / EVRAK NO <span style="font-size:8px;color:var(--text3)">(tüm çıkış için)</span></label>
                        <input id="val-irs-toplu" class="pro-input" placeholder="Çıkış irsaliye no...">
                    </div>
                    <div>
                        <label class="pro-label">GENEL NOT</label>
                        <textarea id="val-notlar-toplu" rows="2" class="pro-input" placeholder="Toplu sevkiyat notu..." style="resize:vertical;font-size:11px"></textarea>
                    </div>`}
                    <div class="mamul-toplu-hareket-wrap">
                        <div class="mamul-toplu-hareket-head">
                            <span>Kod / Ürün Adı</span><span>Ürün</span><span>Adet</span><span>Not</span><span></span>
                        </div>
                        <div id="mamul-toplu-hareket-body"></div>
                        <div id="mamul-toplu-kod-drop"></div>
                        <div id="mamul-toplu-hareket-ozet" class="mamul-toplu-hareket-ozet">0 satır</div>
                        <div class="mamul-toplu-hareket-actions">
                            <button type="button" class="btn-pro btn-secondary-pro" style="padding:6px 14px;font-size:10px" onclick="mamulTopluSatirEkle()">+ Satır ekle</button>
                            <button type="button" class="btn-pro btn-secondary-pro" style="padding:6px 14px;font-size:10px" onclick="mamulTopluYapistir()">📋 Excel'den yapıştır</button>
                            <button type="button" class="btn-pro btn-secondary-pro" style="padding:6px 14px;font-size:10px" onclick="mamulTopluSatirBaslat()">Listeyi temizle</button>
                        </div>
                    </div>
                </div>
            </div>
            </div><!-- /mamul-depo-toplu-wrap -->
        </div>

        <!-- SAĞ: ÖNİZLEME (tekli) -->
        <div id="mamul-depo-tekli-preview" style="position:sticky;top:0;display:flex;flex-direction:column;gap:12px">
            <div class="panel-box" style="padding:0;overflow:hidden;border-left:3px solid ${accentColor}">
                <div class="panel-head" style="background:rgba(${accentRgb},0.06)">
                    <div class="panel-head-title" style="color:${accentColor}">
                        <span class="panel-head-dot" style="background:${accentColor}"></span>
                        ${isGiris ? '📥 GİRİŞ' : '📤 ÇIKIŞ'}
                    </div>
                </div>
                <div style="padding:14px 16px;display:flex;flex-direction:column;gap:10px">
                    <div>
                        <div style="font-size:8px;color:${accentColor};font-family:'DM Mono',monospace;text-transform:uppercase;margin-bottom:2px">STOK KODU</div>
                        <div id="mprev-kod" style="font-family:'DM Mono',monospace;font-size:15px;font-weight:700;color:${accentColor}">—</div>
                    </div>
                    <div>
                        <div style="font-size:8px;color:var(--text3);font-family:'DM Mono',monospace;text-transform:uppercase;margin-bottom:2px">ÜRÜN</div>
                        <div id="mprev-no" style="font-family:'Instrument Serif',serif;font-size:17px;color:var(--text);line-height:1.2">—</div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
                        ${['LOT:mprev-lot','CİNS:mprev-cins','MARKA:mprev-marka','KALİTE:mprev-kalite'].map(x => {
                            const [l,id] = x.split(':');
                            return `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:7px 9px">
                                <div style="font-size:7px;color:var(--text3);font-family:'DM Mono',monospace;text-transform:uppercase;margin-bottom:2px">${l}</div>
                                <div id="${id}" style="font-size:10px;font-weight:600;color:var(--text)">—</div>
                            </div>`;
                        }).join('')}
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
                        <div style="background:rgba(${accentRgb},0.08);border:1.5px solid rgba(${accentRgb},0.25);border-radius:10px;padding:12px;text-align:center">
                            <div id="mprev-ana-birim-lbl" style="font-size:8px;color:${accentColor};font-family:'DM Mono',monospace;margin-bottom:4px">${isGiris ? 'GİRİLECEK ADET' : 'ÇIKIŞ ADET'}</div>
                            <div id="mprev-kg" style="font-family:'Instrument Serif',serif;font-size:24px;color:${accentColor};line-height:1">0</div>
                        </div>
                        <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center">
                            <div style="font-size:8px;color:var(--text3);font-family:'DM Mono',monospace;margin-bottom:4px">MEVCUT STOK</div>
                            <div id="mprev-cuval" style="font-family:'Instrument Serif',serif;font-size:24px;color:var(--emerald-c);line-height:1">0 ad</div>
                        </div>
                    </div>
                    ${isGiris ? `
                    <div>
                        <div style="font-size:8px;color:var(--text3);font-family:'DM Mono',monospace;text-transform:uppercase;margin-bottom:2px">GİRİŞ TARİHİ</div>
                        <div id="mprev-tarih" style="font-size:11px;font-weight:500;color:var(--text2);font-family:'DM Mono',monospace">${new Date().toLocaleString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
                    </div>` : `
                    <div>
                        <div style="font-size:8px;color:var(--text3);font-family:'DM Mono',monospace;text-transform:uppercase;margin-bottom:2px">İRSALİYE</div>
                        <div id="mprev-irs" style="font-size:11px;font-weight:500;color:var(--text2);font-family:'DM Mono',monospace">—</div>
                    </div>`}
                    <div style="padding:8px 12px;border-radius:8px;background:rgba(${accentRgb},0.1);border:1px solid rgba(${accentRgb},0.25);text-align:center;font-size:11px;font-weight:700;color:${accentColor};font-family:'DM Mono',monospace">
                        ${isGiris ? '📥 GİRİŞ HAREKETİ' : '📤 ÇIKIŞ HAREKETİ'}
                    </div>
                </div>
            </div>
        </div>

        <div id="mamul-depo-toplu-preview" style="display:none">
            <div class="panel-box" style="padding:14px 16px;border-left:3px solid ${accentColor}">
                <div style="font-size:8px;color:var(--text3);font-family:'DM Mono',monospace;text-transform:uppercase;margin-bottom:6px">Toplu özet</div>
                <div id="mamul-toplu-preview-ozet" style="font-family:'Instrument Serif',serif;font-size:22px;color:${accentColor}">0 ürün · 0 adet</div>
                <div style="font-size:10px;color:var(--text3);margin-top:8px">Kaydet butonuna basınca tüm satırlar tek seferde işlenir.</div>
            </div>
        </div>`;
}
window.mamulDepoKomutaFormHtml = mamulDepoKomutaFormHtml;

function mamulDepoKomutaFormMount(grid, notesContainer, isGiris, opts) {
    opts = opts || {};
    const mobil = !!opts.mobil;
    const accentColor = isGiris ? 'var(--emerald-c)' : 'var(--rose-c)';
    const accentRgb = isGiris ? '52,211,153' : '251,113,133';
    if (grid) {
        grid.style.cssText = mobil
            ? 'display:flex;flex-direction:column;gap:12px;overflow:visible'
            : 'display:grid;grid-template-columns:1fr 260px;gap:14px;align-items:start;overflow:visible';
        grid.innerHTML = mamulDepoKomutaFormHtml(isGiris, accentColor, accentRgb);
    }
    if (notesContainer) notesContainer.innerHTML = '';
    setTimeout(function () {
        mamulDepoGirisMod = 'TEKLI';
        if (typeof mamulDepoFormSabitle === 'function') mamulDepoFormSabitle();
        if (typeof mamulTopluSatirBaslat === 'function') mamulTopluSatirBaslat();
        if (typeof mamulDepoModSec === 'function') mamulDepoModSec('TEKLI');
        if (!isGiris) {
            const cikisSel = document.getElementById('val-cikis-yeri');
            if (cikisSel && typeof checkMamulExit === 'function') checkMamulExit(cikisSel);
        }
        if (typeof depoHizliHareketStokKodu !== 'undefined' && depoHizliHareketStokKodu && typeof depoHizliStokKoduFormaUygula === 'function') {
            depoHizliStokKoduFormaUygula('MAMUL_DEPO');
        }
    }, 0);
}
window.mamulDepoKomutaFormMount = mamulDepoKomutaFormMount;
