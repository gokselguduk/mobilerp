/* Stok kartları listesi + sipariş mamül seçici — ana program (stok.html) */
(function () {
    if (typeof window === 'undefined') return;

    let kumasKartListeFiltre = 'HAM';
    try {
        const ui = JSON.parse(localStorage.getItem('erp_ui_state_v1') || '{}');
        if (ui.kumasKartListeFiltre === 'MAMUL' || ui.kumasKartListeFiltre === 'HAM') {
            kumasKartListeFiltre = ui.kumasKartListeFiltre;
        }
    } catch (e) {}

    window.kumasKartListeFiltre = kumasKartListeFiltre;

    function yeniKartGirisBaslikMetin() {
        if (archiveTab === 'IPLIK') return { etiket: 'iplik stok kartı', buton: '🧶 + Yeni iplik kartı' };
        if (archiveTab === 'MAMUL') return { etiket: 'mamül stok kartı', buton: '🧥 + Yeni mamül kartı' };
        const hamMu = kumasKartListeFiltre === 'MAMUL' ? 'mamül kumaş' : 'ham kumaş';
        return { etiket: `${hamMu} stok kartı`, buton: `🏁 + Yeni ${hamMu} kartı` };
    }
    window.yeniKartGirisBaslikMetin = yeniKartGirisBaslikMetin;

    window.kumasKartListeFiltreSet = function (tip) {
        kumasKartListeFiltre = String(tip || '').toUpperCase() === 'MAMUL' ? 'MAMUL' : 'HAM';
        window.kumasKartListeFiltre = kumasKartListeFiltre;
        if (typeof saveUiState === 'function') saveUiState({ kumasKartListeFiltre });
        if (appMode === 'KART_LISTE' && typeof loadData === 'function') loadData();
    };

    function mamulEkAlanMetaDecode(notlar) {
        if (typeof kumasMetaDecode === 'function') {
            const m = kumasMetaDecode(notlar);
            if (m && typeof m === 'object') return m;
        }
        return {};
    }
    window.mamulEkAlanMetaDecode = mamulEkAlanMetaDecode;

    /** Mamül stok kodu: YYYY-NNN (ana) · YYYY-NNN-VV (varyant). Eski MA-/26001 formatları da desteklenir. */
    function getMamulYilTam() {
        return String(new Date().getFullYear());
    }
    window.getMamulYilTam = getMamulYilTam;

    function mamulAnaKodSeqParse(kod) {
        const s = String(kod || '').trim().toUpperCase();
        const yil = getMamulYilTam();
        let m = s.match(new RegExp(`^(${yil})-(\\d{1,4})(?:-\\d+)?$`));
        if (m) return parseInt(m[2], 10) || 0;
        if (/^\d{5,6}/.test(s)) {
            const yy = getMamulYilTam().slice(-2);
            if (s.startsWith(yy)) {
                const ana = s.split('-')[0];
                if (/^\d{5,6}$/.test(ana)) return parseInt(ana.slice(2), 10) || 0;
            }
        }
        m = s.match(/^MA-(\d+)/i);
        if (m) return parseInt(m[1], 10) || 0;
        return 0;
    }

    function mamulAnaKodFormatla(seq) {
        const yil = getMamulYilTam();
        const n = Math.max(1, parseInt(seq, 10) || 1);
        return `${yil}-${String(n).padStart(3, '0')}`;
    }
    window.mamulAnaKodFormatla = mamulAnaKodFormatla;

    function mamulVaryantKodFormatla(anaKod, varyantNo) {
        const ana = String(anaKod || '').trim().toUpperCase();
        const v = Math.max(1, parseInt(varyantNo, 10) || 1);
        return `${ana}-${String(v).padStart(2, '0')}`;
    }
    window.mamulVaryantKodFormatla = mamulVaryantKodFormatla;

    function getNextMamulAnaKod() {
        const yil = getMamulYilTam();
        let maxSeq = 0;
        (dataCache.kumas_kutuphanesi || []).forEach(item => {
            const kod = String(item.desen_kodu || '').trim().toUpperCase();
            if (!kod.includes('-')) return;
            const ana = mamulAnaKodBul(kod);
            if (!ana.startsWith(yil + '-')) return;
            const seq = mamulAnaKodSeqParse(kod);
            if (seq > maxSeq) maxSeq = seq;
        });
        return mamulAnaKodFormatla(maxSeq + 1);
    }
    window.getNextMamulAnaKod = getNextMamulAnaKod;

    function getNextMamulVaryantKod(anaKod) {
        const ana = String(anaKod || '').trim().toUpperCase();
        if (!ana) return getNextMamulAnaKod();
        let maxV = 0;
        (dataCache.kumas_kutuphanesi || []).forEach(item => {
            const kod = String(item.desen_kodu || '').trim().toUpperCase();
            if (mamulAnaKodBul(kod) !== ana) return;
            const v = mamulVaryantNoBul(kod);
            if (v > maxV) maxV = v;
        });
        return mamulVaryantKodFormatla(ana, maxV + 1);
    }
    window.getNextMamulVaryantKod = getNextMamulVaryantKod;

    function mamulStokKoduFormatMi(kod) {
        const s = String(kod || '').trim().toUpperCase();
        if (!s) return false;
        if (/^\d{4}-\d{1,4}(-\d+)?$/.test(s)) return true;
        if (/^\d{5,6}(-\d+)?$/.test(s)) return true;
        const pref = s.split(/[-\s]/)[0];
        return pref === 'MA' || pref === 'MM';
    }
    window.mamulStokKoduFormatMi = mamulStokKoduFormatMi;

    function mamulAnaKodBul(kod) {
        const s = String(kod || '').trim().toUpperCase();
        let m = s.match(/^(\d{4}-\d{1,4})-\d+$/);
        if (m) return m[1];
        if (/^\d{4}-\d{1,4}$/.test(s)) return s;
        m = s.match(/^(\d{5,6})-\d+$/);
        if (m) return m[1];
        if (/^\d{5,6}$/.test(s)) return s;
        m = s.match(/^(MA-\d+)(?:-\d+)?$/i);
        return m ? m[1].toUpperCase() : s;
    }
    window.mamulAnaKodBul = mamulAnaKodBul;

    function mamulVaryantNoBul(kod) {
        const s = String(kod || '').trim().toUpperCase();
        let m = s.match(/^\d{4}-\d{1,4}-(\d+)$/);
        if (m) return parseInt(m[1], 10) || 0;
        m = s.match(/^\d{5,6}-(\d+)$/);
        if (m) return parseInt(m[1], 10) || 0;
        m = s.match(/^MA-\d+-(\d+)$/i);
        return m ? (parseInt(m[1], 10) || 0) : 0;
    }
    window.mamulVaryantNoBul = mamulVaryantNoBul;

    function depoMamulBakiyeHesapla(stokKodu) {
        const kod = String(stokKodu || '').trim().toUpperCase();
        if (!kod) return { kg: 0, mt: 0, adet: 0 };
        let kg = 0, mt = 0, adet = 0;
        (dataCache.kumas_stok || []).filter(x => typeof kumasStokHareketiMamulDepoMu === 'function' && kumasStokHareketiMamulDepoMu(x)).forEach(x => {
            if (String(x.stok_kodu || '').trim().toUpperCase() !== kod) return;
            kg += parseFloat(x.miktar_kg) || 0;
            mt += parseFloat(x.miktar_mt) || 0;
            adet += parseInt(x.cuval_sayisi, 10) || 0;
        });
        return { kg, mt, adet };
    }
    window.depoMamulBakiyeHesapla = depoMamulBakiyeHesapla;

    function mamulStokBakiyeToplamText(kodlar) {
        const toplam = { kg: 0, mt: 0, adet: 0 };
        (Array.isArray(kodlar) ? kodlar : []).forEach(kod => {
            const bak = depoMamulBakiyeHesapla(kod);
            toplam.kg += Number(bak.kg || 0);
            toplam.mt += Number(bak.mt || 0);
            toplam.adet += Number(bak.adet || 0);
        });
        return [
            Math.abs(toplam.kg) > 1e-6 ? toplam.kg.toFixed(1) + ' kg' : null,
            Math.abs(toplam.mt) > 1e-6 ? toplam.mt.toFixed(1) + ' mt' : null,
            toplam.adet ? toplam.adet + ' ad' : null,
        ].filter(Boolean).join(' · ') || '0';
    }
    window.mamulStokBakiyeToplamText = mamulStokBakiyeToplamText;

    function stokKartDokumaAlanlariOku(i) {
        const meta = mamulEkAlanMetaDecode(i?.notlar || '');
        const kod = String(i?.desen_kodu || i?.stok_kodu || '').trim();
        const bak = kod ? depoMamulBakiyeHesapla(kod) : null;
        const bakTxt = bak ? ([
            Math.abs(bak.kg) > 1e-6 ? bak.kg.toFixed(1) + ' kg' : null,
            Math.abs(bak.mt) > 1e-6 ? bak.mt.toFixed(1) + ' mt' : null,
            bak.adet ? bak.adet + ' ad' : null,
        ].filter(Boolean).join(' · ') || '0') : '—';
        return {
            stok_kodu: kod,
            tarih: i?.created_at ? new Date(i.created_at).toLocaleDateString('tr-TR') : '',
            musteri: String(i?.firma || '').trim(),
            kumas_cinsi: String(i?.kumas_cinsi || '').trim(),
            desen_adi: String(i?.desen_adi || '').trim(),
            istenen_mamul_ebat: String(meta.istenen_mamul_ebat || meta.olculen_mamul_ebat || '').trim(),
            mamul_gram_m2: String(meta.mamul_gram_m2 ?? i?.mamul_gsm ?? '').trim(),
            renk_varyant: String(i?.renk || '').trim(),
            depo_bakiye: bakTxt
        };
    }
    window.stokKartDokumaAlanlariOku = stokKartDokumaAlanlariOku;

    function iplikIpKoduSira(kod) {
        const m = String(kod || '').match(/^IP-(\d+)$/i);
        return m ? parseInt(m[1], 10) : 99999;
    }

    function iplikKartTanimKaydiMi(r) {
        const kod = String(r?.stok_kodu || '').trim().toUpperCase();
        return kod.startsWith('IP-') || !!String(r?.iplik_no || '').trim();
    }

    function iplikKartlariListe() {
        const all = dataCache.iplik_stok || [];
        const map = new Map();
        all.forEach(r => {
            const key = String(r.stok_kodu || '').trim();
            if (!key) return;
            if (iplikKartTanimKaydiMi(r)) {
                const prev = map.get(key);
                if (!prev || new Date(r.created_at || 0) > new Date(prev.created_at || 0)) map.set(key, r);
            }
        });
        all.forEach(r => {
            const key = String(r.stok_kodu || '').trim();
            if (!key || map.has(key)) return;
            map.set(key, r);
        });
        return [...map.values()].sort((a, b) => iplikIpKoduSira(a.stok_kodu) - iplikIpKoduSira(b.stok_kodu));
    }
    window.iplikKartlariListe = iplikKartlariListe;

    function kumasKartTipiOku(kayit) {
        if (!kayit) return 'HAM';
        const ag = String(kayit.ana_grup || '').toUpperCase();
        if (ag === 'MAMUL') return 'MAMUL';
        return 'HAM';
    }
    window.kumasKartTipiOku = kumasKartTipiOku;

    function stokKartListeAdMetni(i, fallback) {
        const desen = String(i?.desen_adi || '').trim();
        const urun = String(i?.urun_adi || '').trim();
        if (desen && urun) {
            if (desen.toLocaleLowerCase('tr-TR') === urun.toLocaleLowerCase('tr-TR')) return desen;
            return desen + ' · ' + urun;
        }
        return desen || urun || String(i?.iplik_no || '').trim() || (fallback ?? 'ADSİZ');
    }
    window.stokKartListeAdMetni = stokKartListeAdMetni;

    function stokKartGrupEslesir(i, grup, opts) {
        opts = opts || {};
        const sKodu = String(i.stok_kodu || i.desen_kodu || '').trim().toUpperCase();
        if (grup === 'IPLIK') {
            const ipKodu = String(i.stok_kodu || '').trim().toUpperCase();
            return ipKodu.startsWith('IP-') || !!i.iplik_no;
        }
        if (grup === 'KUMAS') {
            const kodPrefix = sKodu.split('-')[0];
            const baz = (kodPrefix === 'SM' || kodPrefix === 'NU') && i.ana_grup !== 'MAMUL';
            if (!baz) return false;
            if (opts.ignoreTipFiltre || archiveTab === 'TUMU') return true;
            return kumasKartTipiOku(i) === kumasKartListeFiltre;
        }
        if (grup === 'MAMUL') return typeof kumasKutuphanesiKartiMamulMu === 'function' && kumasKutuphanesiKartiMamulMu(i);
        return false;
    }
    window.stokKartGrupEslesir = stokKartGrupEslesir;

    function stokKartAramaEslesir(i, s) {
        if (!s) return true;
        const blob = [
            i.desen_kodu, i.stok_kodu, stokKartListeAdMetni(i), i.kumas_cinsi,
            i.iplik_no, i.marka, i.firma, i.renk, i.cins, i.lot_no
        ].join(' ').toLowerCase();
        return blob.includes(s);
    }
    window.stokKartAramaEslesir = stokKartAramaEslesir;

    function stokKartGrupBul(i) {
        if (stokKartGrupEslesir(i, 'IPLIK')) return 'IPLIK';
        if (stokKartGrupEslesir(i, 'MAMUL')) return 'MAMUL';
        return 'KUMAS';
    }
    window.stokKartGrupBul = stokKartGrupBul;

    function stokKartListeSatirHtml(i, idx, grupHint) {
        const grup = grupHint || archiveTab;
        const tbl = grup === 'IPLIK' ? 'iplik_stok' : 'kumas_kutuphanesi';
        const _isIP = i.desen_kodu?.startsWith('IP-') || !!i.iplik_no || grup === 'IPLIK';
        const _isSM = i.desen_kodu?.startsWith('SM');
        const _isMA = grup === 'MAMUL' || i.ana_grup === 'MAMUL' || mamulStokKoduFormatMi(i.desen_kodu);
        const _mamulKart = grup === 'MAMUL' || _isMA;
        const _mamulKod = String(i.desen_kodu || i.stok_kodu || '').trim();
        const _mamulBak = _mamulKart && _mamulKod ? depoMamulBakiyeHesapla(_mamulKod) : null;
        const _icon = _isIP ? '🧶' : _isSM ? '🏁' : _isMA ? '🧥' : '📦';
        const _bClr = _isIP ? '#818cf8' : _isSM ? '#34d399' : _isMA ? '#fb923c' : '#94a3b8';
        const _pillCls = _isIP ? 'pill-blue' : _isSM ? 'pill-green' : _isMA ? 'pill-amber' : 'pill-gray';
        const _mamulBakTxt = _mamulBak ? ([
            Math.abs(_mamulBak.kg) > 1e-6 ? _mamulBak.kg.toFixed(1) + ' kg' : null,
            Math.abs(_mamulBak.mt) > 1e-6 ? _mamulBak.mt.toFixed(1) + ' mt' : null,
            _mamulBak.adet ? _mamulBak.adet + ' ad' : null,
        ].filter(Boolean).join(' · ') || '0') : '0';
        const _mamulBakClr = _mamulBak && _mamulBak.kg > 0 ? 'var(--emerald-c)' : (_mamulBak && _mamulBak.kg < 0 ? 'var(--rose-c)' : 'var(--text3)');
        const _kg = i.miktar_kg !== undefined ? Math.abs(i.miktar_kg || 0) : null;
        const _neg = (i.miktar_kg || 0) < 0;
        const _isArsiv = tbl === 'kumas_kutuphanesi';
        return `<div class="record-item record-item--liste-gecmis" style="border-left-color:${_bClr}">
            <div class="record-item-gecmis-hit" onclick="showDetail(${idx})">
            <div style="display:flex;align-items:center;gap:10px;min-width:0">
                <div style="width:36px;height:36px;border-radius:9px;overflow:hidden;border:1px solid var(--border);flex-shrink:0;background:var(--surface2)">
                    ${i.fotograf ? `<img src="${i.fotograf}" style="width:100%;height:100%;object-fit:cover">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:16px">${_icon}</div>`}
                </div>
                <div style="min-width:0">
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                        <span class="pill ${_pillCls}">${pdfEsc(i.desen_kodu || i.stok_kodu || 'KODSUZ')}</span>
                        ${_mamulKart && mamulVaryantNoBul(_mamulKod) ? `<span class="pill pill-cyan" style="font-size:8px">↗ ${pdfEsc(mamulAnaKodBul(_mamulKod))}</span>` : ''}
                        ${_mamulKart && i.renk ? `<span class="pill pill-gray" style="font-size:8px">${pdfEsc(i.renk)}</span>` : ''}
                        <span style="font-size:12px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pdfEsc(stokKartListeAdMetni(i))}</span>
                    </div>
                    <div style="font-size:10px;color:var(--text3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pdfEsc(i.firma || i.marka || '—')} · ${pdfEsc(i.kumas_cinsi || i.cins || '—')}</div>
                </div>
            </div>
            <div style="text-align:right;flex-shrink:0;margin-left:12px">
                ${_mamulKart && _mamulBak
                    ? `<div style="font-family:'Instrument Serif',serif;font-size:18px;color:${_mamulBakClr};line-height:1">${_mamulBakTxt}</div><div style="font-size:9px;color:var(--text3);font-family:'DM Mono',monospace">depo bakiye</div>`
                    : _isArsiv
                    ? `<span class="pill pill-gray">ARŞİV</span>`
                    : `<div style="font-family:'Instrument Serif',serif;font-size:20px;color:${_neg ? 'var(--rose-c)' : 'var(--text)'};line-height:1">${_kg !== null ? _kg.toLocaleString() : '—'}</div><div style="font-size:9px;color:var(--text3);font-family:'DM Mono',monospace">kg</div>`}
            </div>
            </div>
            <button type="button" class="liste-gecmis-btn" onclick="event.stopPropagation(); showDetailOpenGecmis(${idx})" title="Kayıt geçmişi">Geçmiş</button>
        </div>`;
    }
    window.stokKartListeSatirHtml = stokKartListeSatirHtml;

    function mamulKartListeGruplariOlustur(records) {
        const map = new Map();
        (Array.isArray(records) ? records : []).forEach((record, idx) => {
            const kod = String(record?.desen_kodu || record?.stok_kodu || '').trim().toUpperCase();
            if (!kod) return;
            const anaKod = mamulAnaKodBul(kod);
            if (!anaKod) return;
            if (!map.has(anaKod)) map.set(anaKod, { anaKod, parent: null, children: [] });
            const grup = map.get(anaKod);
            const varyantNo = mamulVaryantNoBul(kod);
            if (varyantNo > 0) grup.children.push({ record, idx, varyantNo });
            else grup.parent = { record, idx };
        });
        const gruplar = Array.from(map.values()).map(grup => {
            grup.children.sort((a, b) => a.varyantNo - b.varyantNo);
            if (!grup.parent && grup.children.length) {
                const baz = grup.children[0];
                grup.parent = {
                    record: { ...baz.record, desen_kodu: grup.anaKod, renk: '', atki_renkleri: '' },
                    idx: baz.idx,
                    synthetic: true
                };
            }
            return grup;
        }).filter(g => g.parent);
        gruplar.sort((a, b) => new Date(b.parent.record?.created_at || 0) - new Date(a.parent.record?.created_at || 0));
        return gruplar;
    }
    window.mamulKartListeGruplariOlustur = mamulKartListeGruplariOlustur;

    window._mamulKartExpanded = window._mamulKartExpanded || new Set();

    window.mamulKartListeToggle = function (anaKod, ev) {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        const ana = String(anaKod || '').trim().toUpperCase();
        if (!ana) return;
        if (window._mamulKartExpanded.has(ana)) window._mamulKartExpanded.delete(ana);
        else window._mamulKartExpanded.add(ana);
        if (typeof loadData === 'function') loadData();
    };

    function mamulStokListeTabloBaslikHtml() {
        return `<div class="mamul-stok-liste-wrap">
            <div class="mamul-stok-liste-grid mamul-stok-liste-grid--head">
                <span></span><span>Stok kodu</span><span>Tarih</span><span>Müşteri</span><span>Kumaş cinsi</span>
                <span>Desen adı</span><span>İstenen ebat</span><span>Renk</span>
                <span style="text-align:right">Stok</span><span></span>
            </div>`;
    }
    window.mamulStokListeTabloBaslikHtml = mamulStokListeTabloBaslikHtml;

    function mamulStokListeTabloKapatHtml() {
        return `</div>`;
    }
    window.mamulStokListeTabloKapatHtml = mamulStokListeTabloKapatHtml;

    function mamulStokListeGrupSatirHtml(grup) {
        const parent = grup.parent?.record;
        const idx = grup.parent?.idx ?? 0;
        const d = stokKartDokumaAlanlariOku(parent);
        const expanded = window._mamulKartExpanded.has(grup.anaKod);
        const hasChildren = grup.children.length > 0;
        const toplamStok = mamulStokBakiyeToplamText((hasChildren ? grup.children.map(x => x.record?.desen_kodu) : [grup.anaKod]).filter(Boolean));
        const renkOzet = hasChildren ? `${grup.children.length} renk varyantı` : (d.renk_varyant || '—');
        const anaEsc = typeof erpAttr === 'function' ? erpAttr(grup.anaKod) : grup.anaKod;
        let html = `<div class="mamul-stok-liste-grid mamul-stok-liste-grid--row">
            <button type="button" class="mamul-stok-grid__expand" onclick="mamulKartListeToggle('${anaEsc}', event)" title="Varyantları aç/kapat">${expanded ? '▼' : '▶'}</button>
            <span class="mamul-stok-liste-grid__cell mamul-stok-liste-grid__cell--kod" onclick="showDetail(${idx})" style="cursor:pointer">${pdfEsc(grup.anaKod)}</span>
            <span class="mamul-stok-liste-grid__cell">${pdfEsc(d.tarih || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${pdfEsc(d.musteri || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${pdfEsc(d.kumas_cinsi || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${pdfEsc(d.desen_adi || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${pdfEsc(d.istenen_mamul_ebat || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${pdfEsc(renkOzet)}</span>
            <span class="mamul-stok-liste-grid__cell mamul-stok-liste-grid__cell--stok">${pdfEsc(toplamStok)}</span>
            <span class="mamul-stok-liste-grid__cell"><button type="button" class="liste-gecmis-btn" onclick="event.stopPropagation();showDetailOpenGecmis(${idx})">Geçmiş</button></span>
        </div>`;
        if (expanded && hasChildren) {
            html += `<div class="mamul-stok-alt-panel">`;
            grup.children.forEach(ch => {
                const cd = stokKartDokumaAlanlariOku(ch.record);
                html += `<div class="mamul-varyant-grid mamul-varyant-grid--row" onclick="showDetail(${ch.idx})">
                    <span class="mamul-stok-liste-grid__cell mamul-stok-liste-grid__cell--kod">${pdfEsc(ch.record?.desen_kodu || '')}</span>
                    <span class="mamul-stok-liste-grid__cell">${pdfEsc(cd.renk_varyant || ('Varyant ' + ch.varyantNo))}</span>
                    <span class="mamul-stok-liste-grid__cell mamul-stok-liste-grid__cell--stok">${pdfEsc(cd.depo_bakiye)}</span>
                    <span class="mamul-stok-liste-grid__cell"><button type="button" class="liste-gecmis-btn" onclick="event.stopPropagation();showDetailOpenGecmis(${ch.idx})">Geçmiş</button></span>
                </div>`;
            });
            html += `</div>`;
        }
        return html;
    }
    window.mamulStokListeGrupSatirHtml = mamulStokListeGrupSatirHtml;

    function stokKartListeOzetHtml() {
        if (appMode !== 'KART_LISTE') return '';
        try {
            const lib = dataCache.kumas_kutuphanesi || [];
            const iplik = iplikKartlariListe().length;
            const kumas = lib.filter(i => stokKartGrupEslesir(i, 'KUMAS', { ignoreTipFiltre: true })).length;
            const mamul = mamulKartListeGruplariOlustur(lib.filter(i => stokKartGrupEslesir(i, 'MAMUL'))).length;
            const toplam = iplik + kumas + mamul;
            const aktif = archiveTab === 'TUMU' ? 'Tüm stok kartları'
                : archiveTab === 'IPLIK' ? 'İplik stok kartları'
                : archiveTab === 'KUMAS' ? 'Kumaş stok kartları'
                : 'Mamül stok kartları';
            const aktifCls = (id) => archiveTab === id
                ? (id === 'IPLIK' ? ' is-active is-active--iplik'
                    : id === 'KUMAS' ? ' is-active is-active--kumas'
                    : id === 'MAMUL' ? ' is-active is-active--mamul'
                    : ' is-active')
                : '';
            const yeniBtn = archiveTab === 'TUMU'
                ? `<div style="display:flex;gap:6px;flex-wrap:wrap">
                    <button type="button" onclick="setAppMode('IPLIK_KART_GIRIS')" class="btn-pro btn-primary-pro" style="padding:7px 10px;font-size:10px">🧶 İplik</button>
                    <button type="button" onclick="setAppMode('KUMAS_KART_GIRIS')" class="btn-pro btn-primary-pro" style="padding:7px 10px;font-size:10px">🏁 Kumaş</button>
                    <button type="button" onclick="setAppMode('MAMUL_KART_GIRIS')" class="btn-pro btn-primary-pro" style="padding:7px 10px;font-size:10px">🧥 Mamül</button>
                   </div>`
                : `<button type="button" onclick="yeniKartGiris()" class="btn-pro btn-primary-pro" style="padding:7px 14px;font-size:10px">${yeniKartGirisBaslikMetin().buton}</button>`;
            return `<div class="stok-kart-toolbar">
                <div class="stok-kart-toolbar__head">
                    <div>
                        <div class="stok-kart-toolbar__title">Kayıtlı stok kartları</div>
                        <div class="stok-kart-toolbar__sub">${aktif} · sayıya tıklayarak gruba geçin</div>
                    </div>
                    ${yeniBtn}
                </div>
                <div class="stok-kart-ozet-grid">
                    <button type="button" class="stok-kart-ozet-kart${aktifCls('TUMU')}" onclick="switchArchiveTab('TUMU')" title="Tüm grupları göster">
                        <div class="stok-kart-ozet-kart__etiket">Toplam kart</div>
                        <div class="stok-kart-ozet-kart__deger">${toplam}</div>
                        <div class="stok-kart-ozet-kart__ipucu">Tümü</div>
                    </button>
                    <button type="button" class="stok-kart-ozet-kart${aktifCls('IPLIK')}" onclick="switchArchiveTab('IPLIK')" title="İplik kartlarını göster">
                        <div class="stok-kart-ozet-kart__etiket">İplik</div>
                        <div class="stok-kart-ozet-kart__deger stok-kart-ozet-kart__deger--iplik">${iplik}</div>
                        <div class="stok-kart-ozet-kart__ipucu">Listeyi aç</div>
                    </button>
                    <button type="button" class="stok-kart-ozet-kart${aktifCls('KUMAS')}" onclick="switchArchiveTab('KUMAS')" title="Kumaş kartlarını göster">
                        <div class="stok-kart-ozet-kart__etiket">Kumaş</div>
                        <div class="stok-kart-ozet-kart__deger stok-kart-ozet-kart__deger--kumas">${kumas}</div>
                        <div class="stok-kart-ozet-kart__ipucu">Listeyi aç</div>
                    </button>
                    <button type="button" class="stok-kart-ozet-kart${aktifCls('MAMUL')}" onclick="switchArchiveTab('MAMUL')" title="Mamül kartlarını göster">
                        <div class="stok-kart-ozet-kart__etiket">Mamül ana kart</div>
                        <div class="stok-kart-ozet-kart__deger stok-kart-ozet-kart__deger--mamul">${mamul}</div>
                        <div class="stok-kart-ozet-kart__ipucu">Listeyi aç</div>
                    </button>
                </div>
            </div>`;
        } catch (e) {
            console.warn('stokKartListeOzetHtml:', e?.message || e);
            return '';
        }
    }
    window.stokKartListeOzetHtml = stokKartListeOzetHtml;

    function stokKartGrupluListeHtml(iplikRows, kumasRows, mamulRows) {
        const bolumler = [
            { id: 'IPLIK', baslik: '🧶 İplik Stok Kartları', renk: 'var(--accent2)', satirlar: iplikRows },
            { id: 'KUMAS', baslik: '🏁 Kumaş Stok Kartları', renk: 'var(--emerald-c)', satirlar: kumasRows },
            { id: 'MAMUL', baslik: '🧥 Mamül Stok Kartları', renk: 'var(--amber-c)', satirlar: mamulRows },
        ];
        let html = '';
        let globalIdx = 0;
        const merged = [];
        bolumler.forEach(b => {
            html += `<div class="stok-kart-grup-bolum panel-box" style="border-left-color:${b.renk}">
                <div class="stok-kart-grup-bolum__head">
                    <div class="stok-kart-grup-bolum__title" style="color:${b.renk}">${b.baslik}</div>
                    <div class="stok-kart-grup-bolum__actions">
                        <span class="pill pill-gray" style="font-size:9px">${b.satirlar.length} kart</span>
                        <button type="button" onclick="switchArchiveTab('${b.id}')" class="pill pill-gray" style="cursor:pointer;border:none;font-size:9px">Yalnız bu grup →</button>
                    </div>
                </div>`;
            if (!b.satirlar.length) {
                html += `<div style="font-size:10px;color:var(--text3);padding:6px 4px">Bu grupta kayıtlı kart yok.</div>`;
            } else if (b.id === 'MAMUL') {
                html += mamulStokListeTabloBaslikHtml();
                mamulKartListeGruplariOlustur(b.satirlar).forEach(grup => {
                    merged.push(grup.parent.record);
                    grup.children.forEach(ch => merged.push(ch.record));
                    html += mamulStokListeGrupSatirHtml(grup);
                    globalIdx += 1 + grup.children.length;
                });
                html += mamulStokListeTabloKapatHtml();
            } else {
                html += `<div style="display:flex;flex-direction:column;gap:6px">`;
                b.satirlar.forEach(i => {
                    merged.push(i);
                    html += stokKartListeSatirHtml(i, globalIdx, b.id);
                    globalIdx += 1;
                });
                html += `</div>`;
            }
            html += `</div>`;
        });
        window._stokKartTumuCurrentData = merged;
        return html;
    }
    window.stokKartGrupluListeHtml = stokKartGrupluListeHtml;

    window.syncArchiveTabStili = function () {
        const tabColors = { TUMU: 'var(--accent)', IPLIK: 'var(--accent2)', KUMAS: 'var(--emerald-c)', MAMUL: 'var(--amber-c)' };
        document.querySelectorAll('.archive-tab-btn').forEach(btn => {
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text3)';
            btn.style.boxShadow = 'none';
        });
        const activeBtn = document.getElementById('tab-btn-' + archiveTab);
        if (activeBtn) {
            activeBtn.style.background = 'var(--surface)';
            activeBtn.style.color = tabColors[archiveTab] || 'var(--text)';
            activeBtn.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
        }
    };

    window.acKayitliStokKartlari = function () {
        if (typeof closeAllSubs === 'function') closeAllSubs();
        const sub = document.getElementById('sub-kart');
        if (sub) sub.classList.add('open');
        const chev = document.getElementById('chev-kart');
        if (chev) chev.style.transform = 'rotate(180deg)';
        if (!['TUMU', 'IPLIK', 'KUMAS', 'MAMUL'].includes(archiveTab)) archiveTab = 'TUMU';
        if (typeof saveUiState === 'function') saveUiState({ archiveTab });
        if (appMode !== 'KART_LISTE') setAppMode('KART_LISTE');
        else {
            syncArchiveTabStili();
            if (typeof loadData === 'function') loadData();
        }
    };

    /* --- Sipariş mamül seçici --- */
    let siparisMamulSeciciKalemNo = 0;
    let siparisMamulSeciciListe = [];
    let siparisMamulSeciciGruplar = [];
    window._siparisMamulSeciciExpanded = window._siparisMamulSeciciExpanded || new Set();

    function siparisMamulKartlariTopla() {
        return (dataCache.kumas_kutuphanesi || [])
            .filter(k => {
                const kod = String(k.desen_kodu || '').trim();
                if (!kod || kod.startsWith('NU')) return false;
                if (!kumasKutuphanesiKartiMamulMu(k)) return false;
                const kalite = String(k.kalite || 'AKTİF').toUpperCase();
                return kalite !== 'ARŞİV' && kalite !== 'PASİF';
            })
            .sort((a, b) => String(a.desen_kodu || '').localeCompare(String(b.desen_kodu || ''), undefined, { numeric: true }));
    }

    function siparisMamulGruplariTopla() {
        return mamulKartListeGruplariOlustur(siparisMamulKartlariTopla());
    }

    function siparisMamulGrupEslestir(grup, q) {
        const s = String(q || '').trim().toLowerCase();
        if (!s) return true;
        const parent = grup?.parent?.record;
        const blob = (r) => [r?.desen_kodu, r?.desen_adi, r?.urun_adi, r?.firma, r?.kumas_cinsi, r?.renk].join(' ').toLowerCase();
        if (parent && blob(parent).includes(s)) return true;
        return (grup.children || []).some(ch => blob(ch.record).includes(s));
    }

    function siparisMamulEbatOku(k) {
        if (!k) return '';
        const meta = mamulEkAlanMetaDecode(k.notlar || '');
        if (meta.istenen_mamul_ebat) return meta.istenen_mamul_ebat;
        if (k.mamul_en && k.mamul_boy) return `${k.mamul_en}*${k.mamul_boy}`;
        if (k.ham_en && k.ham_boy) return `${k.ham_en}*${k.ham_boy}`;
        return '';
    }

    function siparisMamulDesenOku(k) {
        return String(k?.desen_adi || k?.urun_adi || '').trim().toUpperCase();
    }

    function siparisMamulUrunAdiOku(k) {
        const urun = String(k?.urun_adi || '').trim();
        if (urun) return urun.toUpperCase();
        return String(k?.kumas_cinsi || '').trim().toUpperCase();
    }

    function siparisMamulRenkOku(k) {
        return String(k?.renk || '').trim().toUpperCase();
    }

    window.siparisKalemMamulDoldur = function (kalemNo, k) {
        if (!k || !kalemNo) return;
        const mv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
        mv(`sk-kod-${kalemNo}`, k.desen_kodu || '');
        mv(`sk-desen-${kalemNo}`, siparisMamulDesenOku(k));
        mv(`sk-ad-${kalemNo}`, siparisMamulUrunAdiOku(k));
        const grupEl = document.getElementById(`sk-grup-${kalemNo}`);
        if (grupEl && grupEl.tagName === 'SELECT') {
            const hedef = String(k.kumas_cinsi || k.firma || '').trim().toUpperCase();
            let eslesti = false;
            [...grupEl.options].forEach(opt => {
                if (opt.value && hedef.includes(opt.value)) { grupEl.value = opt.value; eslesti = true; }
            });
            if (!eslesti && hedef) grupEl.value = '';
        } else {
            mv(`sk-grup-${kalemNo}`, (k.kumas_cinsi || k.firma || '').toUpperCase());
        }
        mv(`sk-ebat-${kalemNo}`, String(siparisMamulEbatOku(k) || '').trim().replace(/\s+/g, ''));
        mv(`sk-renk-${kalemNo}`, siparisMamulRenkOku(k));
        if (typeof updateSiparisPreview === 'function') updateSiparisPreview();
    };

    function siparisMamulSeciciSatirHtml(k, opts) {
        opts = opts || {};
        const desen = siparisMamulDesenOku(k) || '—';
        const urun = siparisMamulUrunAdiOku(k) || '—';
        const ebat = siparisMamulEbatOku(k) || '—';
        const renk = siparisMamulRenkOku(k) || '—';
        const isVariant = !!opts.isVariant;
        const hasVariants = !!opts.hasVariants;
        const expanded = !!opts.expanded;
        const anaKod = String(opts.anaKod || mamulAnaKodBul(k.desen_kodu) || '').trim();
        const vCount = opts.vCount || 0;
        const chev = hasVariants ? (expanded ? '▾' : '▸') : (isVariant ? '·' : '');
        const kodEsc = typeof erpAttr === 'function' ? erpAttr(k.desen_kodu) : k.desen_kodu;
        const anaEsc = typeof erpAttr === 'function' ? erpAttr(anaKod) : anaKod;
        const cls = ['siparis-mamul-sec-row', isVariant ? 'is-variant' : 'is-parent', hasVariants ? 'has-variants' : ''].filter(Boolean).join(' ');
        const renkGoster = isVariant ? renk : (hasVariants ? `${vCount} renk` : (renk || '—'));
        return `<div class="${cls}" onclick="siparisMamulSeciciSecKayit('${kodEsc}')" title="Seç">
            <span class="chev"${hasVariants ? ` onclick="event.stopPropagation();siparisMamulSeciciToggle('${anaEsc}')"` : ''}>${chev}</span>
            <span class="kod">${pdfEsc(k.desen_kodu)}${isVariant ? '<span class="varyant-pill">V</span>' : ''}</span>
            <span class="ad">${pdfEsc(desen)}</span>
            <span class="meta">${pdfEsc(urun)}</span>
            <span class="meta">${pdfEsc(ebat)}</span>
            <span class="meta">${pdfEsc(renkGoster)}</span>
        </div>`;
    }

    function siparisMamulSeciciRender(gruplar) {
        const host = document.getElementById('siparis-mamul-sec-modal');
        const list = document.getElementById('siparis-mamul-sec-list');
        const foot = document.getElementById('siparis-mamul-sec-foot');
        if (!list) return;
        siparisMamulSeciciGruplar = Array.isArray(gruplar) ? gruplar : [];
        siparisMamulSeciciListe = [];
        if (!siparisMamulSeciciGruplar.length) {
            list.innerHTML = `<div style="padding:24px 16px;text-align:center;color:var(--text3);font-size:11px">Mamül stok kartı bulunamadı.</div>`;
            if (foot) foot.textContent = '0 ana ürün';
            return;
        }
        const exp = window._siparisMamulSeciciExpanded;
        let html = `<div style="display:grid;grid-template-columns:22px 88px 1fr 1fr 72px 72px;gap:8px;padding:4px 12px 8px;font-size:8px;font-weight:700;color:var(--text3);text-transform:uppercase;font-family:'DM Mono',monospace">
            <span></span><span>Kod</span><span>Desen</span><span>Ürün</span><span>Ebat</span><span>Renk</span>
        </div>`;
        let varyantSayisi = 0;
        siparisMamulSeciciGruplar.forEach(grup => {
            const parent = grup.parent?.record;
            if (!parent) return;
            const children = Array.isArray(grup.children) ? grup.children : [];
            const hasVariants = children.length > 0;
            const expanded = hasVariants && exp.has(String(grup.anaKod || '').toUpperCase());
            siparisMamulSeciciListe.push(parent);
            html += siparisMamulSeciciSatirHtml(parent, { anaKod: grup.anaKod, hasVariants, expanded, vCount: children.length });
            if (expanded) {
                children.forEach(ch => {
                    varyantSayisi++;
                    siparisMamulSeciciListe.push(ch.record);
                    html += siparisMamulSeciciSatirHtml(ch.record, { isVariant: true, anaKod: grup.anaKod });
                });
            } else {
                varyantSayisi += children.length;
            }
        });
        list.innerHTML = html;
        if (foot) foot.textContent = `${siparisMamulSeciciGruplar.length} ana ürün · ${varyantSayisi} varyant`;
    }

    window.siparisMamulSeciciAra = function (q) {
        const tum = siparisMamulGruplariTopla();
        const s = String(q || '').trim();
        if (!s) { siparisMamulSeciciRender(tum.slice(0, 200)); return; }
        const filtreli = tum.filter(g => siparisMamulGrupEslestir(g, s)).slice(0, 200);
        siparisMamulSeciciRender(filtreli);
    };

    window.siparisMamulSeciciToggle = function (anaKod) {
        const ana = String(anaKod || '').trim().toUpperCase();
        if (!ana) return;
        if (window._siparisMamulSeciciExpanded.has(ana)) window._siparisMamulSeciciExpanded.delete(ana);
        else window._siparisMamulSeciciExpanded.add(ana);
        siparisMamulSeciciRender(siparisMamulSeciciGruplar);
    };

    window.siparisMamulSeciciAc = function (kalemNo) {
        siparisMamulSeciciKalemNo = parseInt(kalemNo, 10) || 0;
        const modal = document.getElementById('siparis-mamul-sec-modal');
        if (!modal) return;
        modal.style.display = 'flex';
        const ara = document.getElementById('siparis-mamul-sec-ara');
        const mevcutKod = String(document.getElementById(`sk-kod-${siparisMamulSeciciKalemNo}`)?.value || '').trim();
        if (ara) {
            ara.value = mevcutKod;
            setTimeout(() => { ara.focus(); ara.select(); }, 80);
        }
        siparisMamulSeciciAra(mevcutKod);
    };

    window.siparisMamulSeciciKapat = function (ev) {
        if (ev && ev.target && ev.currentTarget !== ev.target && ev.type === 'click') return;
        const modal = document.getElementById('siparis-mamul-sec-modal');
        if (modal) modal.style.display = 'none';
        siparisMamulSeciciKalemNo = 0;
    };

    window.siparisMamulSeciciSecKayit = function (kod) {
        const hedef = String(kod || '').trim().toUpperCase();
        if (!hedef || !siparisMamulSeciciKalemNo) return;
        const k = siparisMamulKartlariTopla().find(x => String(x.desen_kodu || '').trim().toUpperCase() === hedef)
            || siparisMamulSeciciListe.find(x => String(x.desen_kodu || '').trim().toUpperCase() === hedef);
        if (!k) return;
        siparisKalemMamulDoldur(siparisMamulSeciciKalemNo, k);
        siparisMamulSeciciKapat();
    };

    window.switchArchiveTab = function (tab) {
        const hedef = String(tab || '').toUpperCase();
        if (!['TUMU', 'IPLIK', 'KUMAS', 'MAMUL'].includes(hedef)) return;
        archiveTab = hedef;
        if (typeof saveUiState === 'function') saveUiState({ archiveTab });
        if (appMode !== 'KART_LISTE') {
            setAppMode('KART_LISTE');
            return;
        }
        syncArchiveTabStili();
        if (typeof loadData === 'function') loadData();
    };

    /* --- Mamül stok kartı: Excel şablonu formu + import --- */

    function mamulKodAlaniniNormalizeEt(v) {
        return String(v || '').trim().toUpperCase();
    }
    window.mamulKodAlaniniNormalizeEt = mamulKodAlaniniNormalizeEt;

    function mamulExcelNormBaslik(v) {
        return String(v || '')
            .toLocaleUpperCase('tr-TR')
            .replace(/İ/g, 'I')
            .replace(/Ş/g, 'S')
            .replace(/Ğ/g, 'G')
            .replace(/Ü/g, 'U')
            .replace(/Ö/g, 'O')
            .replace(/Ç/g, 'C')
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    window.mamulExcelNormBaslik = mamulExcelNormBaslik;

    function mamulExcelEbatParcala(v) {
        const s = String(v || '').trim();
        if (!s) return { en: '', boy: '' };
        const m = s.match(/(\d+(?:[.,]\d+)?)\s*[*xX\/\-×]\s*(\d+(?:[.,]\d+)?)/);
        if (!m) return { en: '', boy: '' };
        return { en: m[1].replace(',', '.'), boy: m[2].replace(',', '.') };
    }
    window.mamulExcelEbatParcala = mamulExcelEbatParcala;

    function mamulExcelTarihCevir(v) {
        const s = String(v ?? '').trim();
        if (!s) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        const dm = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/);
        if (dm) {
            let y = parseInt(dm[3], 10);
            if (y < 100) y += 2000;
            return `${y}-${String(parseInt(dm[2], 10)).padStart(2, '0')}-${String(parseInt(dm[1], 10)).padStart(2, '0')}`;
        }
        const n = parseFloat(s);
        if (Number.isFinite(n) && n > 30000 && n < 60000 && typeof XLSX !== 'undefined' && XLSX.SSF) {
            try {
                const d = XLSX.SSF.parse_date_code(n);
                if (d && d.y) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
            } catch (e) {}
        }
        return s;
    }

    function mamulExcelMapOlustur(rows) {
        const map = {};
        const set = (key, val) => {
            const k = mamulExcelNormBaslik(key);
            let v = String(val ?? '').trim();
            if (!k || !v) return;
            if (k === 'TARIH') v = mamulExcelTarihCevir(v);
            if (!map[k]) map[k] = v;
        };
        (rows || []).forEach(row => {
            const cells = Array.isArray(row) ? row : [];
            if (cells[0]) set(cells[0], cells[2] != null && String(cells[2]).trim() !== '' ? cells[2] : cells[1]);
            if (cells[5]) set(cells[5], cells[7] != null && String(cells[7]).trim() !== '' ? cells[7] : cells[6]);
            cells.forEach((c, ci) => {
                const key = mamulExcelNormBaslik(c);
                if (key === 'TARIH') {
                    for (let j = ci + 1; j < Math.min(ci + 4, cells.length); j++) {
                        const vv = String(cells[j] ?? '').trim();
                        if (vv) { set('TARIH', vv); break; }
                    }
                }
            });
        });
        return map;
    }
    window.mamulExcelMapOlustur = mamulExcelMapOlustur;

    function mamulExcelMapDeger(map, keys) {
        for (const k of (keys || [])) {
            const v = map[mamulExcelNormBaslik(k)];
            if (v != null && String(v).trim()) return String(v).trim();
        }
        return '';
    }

    function mamulExcelVaryantParse(rows) {
        const varyantlar = [];
        for (let v = 0; v < 4; v++) varyantlar.push({ siparis_ad_mt: '', bir_boy_dokunacak: '', atki: [] });
        const vCols = [1, 5, 9, 13];
        let atkiBasRow = -1;
        for (let r = 0; r < (rows || []).length; r++) {
            const c0 = mamulExcelNormBaslik(rows[r]?.[0]);
            const c1 = mamulExcelNormBaslik(rows[r]?.[1]);
            if (c0 === 'ATKI 1' || (c1.includes('IPLIK') && c1.includes('NO'))) {
                atkiBasRow = c0 === 'ATKI 1' ? r : r + 1;
                break;
            }
        }
        if (atkiBasRow < 0) return varyantlar;
        for (let a = 0; a < 6; a++) {
            const row = rows[atkiBasRow + a];
            if (!row || !mamulExcelNormBaslik(row[0]).startsWith('ATKI')) continue;
            for (let v = 0; v < 4; v++) {
                const base = vCols[v];
                if (!varyantlar[v].atki[a]) varyantlar[v].atki[a] = { iplik_no: '', renk: '', atki_sayisi: '' };
                varyantlar[v].atki[a] = {
                    iplik_no: String(row[base] ?? '').trim(),
                    renk: String(row[base + 1] ?? '').trim(),
                    atki_sayisi: String(row[base + 2] ?? '').trim()
                };
            }
        }
        (rows || []).forEach(row => {
            const label = mamulExcelNormBaslik(row?.[0]);
            if (label === 'SIPARIS AD MT') {
                for (let v = 0; v < 4; v++) {
                    const val = String(row[vCols[v]] ?? '').trim();
                    if (val) varyantlar[v].siparis_ad_mt = val;
                }
            }
            if (label.includes('BOY DOKUNACAK') || label === '1 BOY DOKUNACAK') {
                for (let v = 0; v < 4; v++) {
                    const val = String(row[vCols[v]] ?? '').trim();
                    if (val) varyantlar[v].bir_boy_dokunacak = val;
                }
            }
        });
        return varyantlar;
    }
    window.mamulExcelVaryantParse = mamulExcelVaryantParse;

    function mamulEkAlanFormOku() {
        const g = (id) => String(document.getElementById(id)?.value || '').trim();
        const varyantlar = [];
        for (let v = 1; v <= 4; v++) {
            const atki = [];
            for (let a = 1; a <= 6; a++) {
                atki.push({
                    iplik_no: g(`val-mamul-v${v}-a${a}-iplik`),
                    renk: g(`val-mamul-v${v}-a${a}-renk`),
                    atki_sayisi: g(`val-mamul-v${v}-a${a}-sayi`)
                });
            }
            varyantlar.push({
                siparis_ad_mt: g(`val-mamul-v${v}-siparis`),
                bir_boy_dokunacak: g(`val-mamul-v${v}-boy`),
                atki
            });
        }
        return {
            tarih: g('val-mamul-tarih'),
            musteri: g('val-firma'),
            siparis_no: g('val-mamul-siparis-no'),
            tezgah_no: g('val-mamul-tezgah-no'),
            kumas_cinsi: g('val-kumas-cinsi'),
            kumas_stok_kodu: g('val-mamul-kumas-stok-kodu'),
            cozgu_sikligi: g('val-mamul-cozgu-sikligi'),
            atki_sikligi: g('val-mamul-atki-sikligi'),
            toplam_atki_sayisi: g('val-mamul-toplam-atki'),
            sacak_atki_sayisi: g('val-mamul-sacak-atki'),
            desen_adi: g('val-desen-adi'),
            tezgah_desen_no: g('val-mamul-tezgah-desen-no'),
            istenen_mamul_ebat: g('val-mamul-istenen-mamul-ebat'),
            cozgu_iplik_no: g('val-mamul-cozgu-iplik-no'),
            atki_iplik_no: g('val-mamul-atki-iplik-no'),
            cozgu_iplik_markasi: g('val-mamul-cozgu-iplik-markasi'),
            atki_iplik_markasi: g('val-mamul-atki-iplik-markasi'),
            tarak_no: g('val-tarak-no'),
            tarak_eni: g('val-tarak-eni'),
            cozgu_tel_sayisi: g('val-mamul-cozgu-tel-sayisi'),
            ham_ebat: g('val-mamul-ham-ebat'),
            istenilen_ham_ebat: g('val-mamul-istenilen-ham-ebat'),
            olculen_ham_ebat: g('val-mamul-olculen-ham-ebat'),
            olculen_mamul_ebat: g('val-mamul-olculen-mamul-ebat'),
            ham_gram_mtul: g('val-mamul-ham-gram-mtul'),
            ham_gram_m2: g('val-mamul-ham-gram-m2'),
            mamul_gram_mtul: g('val-mamul-mamul-gram-mtul'),
            mamul_gram_m2: g('val-mamul-mamul-gram-m2'),
            tahar_raporu: g('val-mamul-tahar-raporu'),
            aciklama: g('val-mamul-aciklama'),
            varyantlar
        };
    }
    window.mamulEkAlanFormOku = mamulEkAlanFormOku;

    function mamulEkAlanFormDoldur(meta) {
        const m = (meta && typeof meta === 'object') ? meta : {};
        const s = (id, val) => {
            const el = document.getElementById(id);
            if (!el || val == null || String(val).trim() === '') return;
            el.value = String(val).trim();
        };
        s('val-mamul-tarih', m.tarih);
        s('val-firma', m.musteri || m.firma);
        s('val-mamul-siparis-no', m.siparis_no);
        s('val-mamul-tezgah-no', m.tezgah_no);
        s('val-kumas-cinsi', m.kumas_cinsi);
        s('val-mamul-kumas-stok-kodu', m.kumas_stok_kodu);
        s('val-mamul-cozgu-sikligi', m.cozgu_sikligi);
        s('val-mamul-atki-sikligi', m.atki_sikligi);
        s('val-mamul-toplam-atki', m.toplam_atki_sayisi);
        s('val-mamul-sacak-atki', m.sacak_atki_sayisi);
        s('val-desen-adi', m.desen_adi);
        s('val-mamul-tezgah-desen-no', m.tezgah_desen_no);
        s('val-mamul-istenen-mamul-ebat', m.istenen_mamul_ebat);
        s('val-mamul-cozgu-iplik-no', m.cozgu_iplik_no);
        s('val-mamul-atki-iplik-no', m.atki_iplik_no);
        s('val-mamul-cozgu-iplik-markasi', m.cozgu_iplik_markasi);
        s('val-mamul-atki-iplik-markasi', m.atki_iplik_markasi);
        s('val-tarak-no', m.tarak_no);
        s('val-tarak-eni', m.tarak_eni);
        s('val-mamul-cozgu-tel-sayisi', m.cozgu_tel_sayisi);
        s('val-mamul-ham-ebat', m.ham_ebat);
        s('val-mamul-istenilen-ham-ebat', m.istenilen_ham_ebat);
        s('val-mamul-olculen-ham-ebat', m.olculen_ham_ebat);
        s('val-mamul-olculen-mamul-ebat', m.olculen_mamul_ebat);
        s('val-mamul-ham-gram-mtul', m.ham_gram_mtul);
        s('val-mamul-ham-gram-m2', m.ham_gram_m2);
        s('val-mamul-mamul-gram-mtul', m.mamul_gram_mtul);
        s('val-mamul-mamul-gram-m2', m.mamul_gram_m2);
        s('val-mamul-tahar-raporu', m.tahar_raporu);
        s('val-mamul-aciklama', m.aciklama);
        const varyantlar = Array.isArray(m.varyantlar) ? m.varyantlar : [];
        for (let v = 1; v <= 4; v++) {
            const vv = varyantlar[v - 1] || {};
            s(`val-mamul-v${v}-siparis`, vv.siparis_ad_mt);
            s(`val-mamul-v${v}-boy`, vv.bir_boy_dokunacak);
            const atki = Array.isArray(vv.atki) ? vv.atki : [];
            for (let a = 1; a <= 6; a++) {
                const aa = atki[a - 1] || {};
                s(`val-mamul-v${v}-a${a}-iplik`, aa.iplik_no);
                s(`val-mamul-v${v}-a${a}-renk`, aa.renk);
                s(`val-mamul-v${v}-a${a}-sayi`, aa.atki_sayisi);
            }
        }
    }
    window.mamulEkAlanFormDoldur = mamulEkAlanFormDoldur;

    function mamulVaryantKopyala(fromV, toV) {
        const f = parseInt(fromV, 10);
        const t = parseInt(toV, 10);
        if (!(f >= 1 && f <= 4 && t >= 1 && t <= 4) || f === t) return;
        for (let a = 1; a <= 6; a++) {
            ['iplik', 'renk', 'sayi'].forEach(suf => {
                const src = document.getElementById(`val-mamul-v${f}-a${a}-${suf}`);
                const dst = document.getElementById(`val-mamul-v${t}-a${a}-${suf}`);
                if (dst && src) dst.value = src.value;
            });
        }
        ['siparis', 'boy'].forEach(suf => {
            const src = document.getElementById(`val-mamul-v${f}-${suf}`);
            const dst = document.getElementById(`val-mamul-v${t}-${suf}`);
            if (dst && src) dst.value = src.value;
        });
        if (typeof erpToast === 'function') erpToast(`V${f} verileri V${t} varyantına kopyalandı.`, 'success');
    }
    window.mamulVaryantKopyala = mamulVaryantKopyala;

    function mamulVaryantTemizle(v) {
        const x = parseInt(v, 10);
        if (!(x >= 1 && x <= 4)) return;
        for (let a = 1; a <= 6; a++) {
            ['iplik', 'renk', 'sayi'].forEach(suf => {
                const el = document.getElementById(`val-mamul-v${x}-a${a}-${suf}`);
                if (el) el.value = '';
            });
        }
        ['siparis', 'boy'].forEach(suf => {
            const el = document.getElementById(`val-mamul-v${x}-${suf}`);
            if (el) el.value = '';
        });
        if (typeof erpToast === 'function') erpToast(`V${x} varyantı temizlendi.`, 'info');
    }
    window.mamulVaryantTemizle = mamulVaryantTemizle;

    function mamulVaryantKolonunaGit(v) {
        const x = parseInt(v, 10);
        if (!(x >= 1 && x <= 4)) return;
        const hedef = document.getElementById(`mamul-varyant-col-${x}`) || document.getElementById(`val-mamul-v${x}-a1-iplik`);
        if (!hedef) return;
        const wrap = document.getElementById('mamul-varyant-scroll');
        if (wrap) {
            const left = Math.max(0, (hedef.offsetLeft || 0) - Math.floor((wrap.clientWidth || 0) * 0.22));
            try { wrap.scrollTo({ left, behavior: 'smooth' }); } catch (e) { wrap.scrollLeft = left; }
        }
        setTimeout(() => {
            const inp = document.getElementById(`val-mamul-v${x}-a1-iplik`);
            if (inp) { inp.focus(); try { inp.select(); } catch (e) {} }
        }, 180);
    }
    window.mamulVaryantKolonunaGit = mamulVaryantKolonunaGit;

    function mamulExcelFormaYaz(map, varyantlar) {
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (!el || val == null || String(val).trim() === '') return;
            el.value = String(val).trim();
        };
        set('val-mamul-tarih', mamulExcelMapDeger(map, ['TARIH']));
        set('val-firma', mamulExcelMapDeger(map, ['MUSTERI', 'MUSTERI FIRMA']));
        set('val-mamul-siparis-no', mamulExcelMapDeger(map, ['SIPARIS NO']));
        set('val-mamul-tezgah-no', mamulExcelMapDeger(map, ['TEZGAH NO']));
        set('val-kumas-cinsi', mamulExcelMapDeger(map, ['KUMAS CINSI']));
        set('val-mamul-kumas-stok-kodu', mamulExcelMapDeger(map, ['KUMAS STOK KODU']));
        set('val-mamul-cozgu-sikligi', mamulExcelMapDeger(map, ['COZGU SIKLIGI']));
        set('val-mamul-atki-sikligi', mamulExcelMapDeger(map, ['ATKI SIKLIGI']));
        set('val-mamul-toplam-atki', mamulExcelMapDeger(map, ['TOPLAM ATKI SAYISI']));
        set('val-mamul-sacak-atki', mamulExcelMapDeger(map, ['SACAK ATKI SAYISI']));
        set('val-desen-adi', mamulExcelMapDeger(map, ['DESEN ADI']));
        set('val-mamul-tezgah-desen-no', mamulExcelMapDeger(map, ['TEZGAH DESEN NO']));
        set('val-mamul-istenen-mamul-ebat', mamulExcelMapDeger(map, ['ISTENEN MAMUL EBAT']));
        set('val-mamul-cozgu-iplik-no', mamulExcelMapDeger(map, ['COZGU IPLIK NO']));
        set('val-mamul-atki-iplik-no', mamulExcelMapDeger(map, ['ATKI IPLIK NO']));
        set('val-mamul-cozgu-iplik-markasi', mamulExcelMapDeger(map, ['COZGU IPLIK MARKASI']));
        set('val-mamul-atki-iplik-markasi', mamulExcelMapDeger(map, ['ATKI IPLIK MARKASI']));
        set('val-tarak-no', mamulExcelMapDeger(map, ['TARAK NO']));
        set('val-tarak-eni', mamulExcelMapDeger(map, ['TARAK ENI']));
        set('val-mamul-cozgu-tel-sayisi', mamulExcelMapDeger(map, ['COZGU TEL SAYISI']));
        set('val-mamul-ham-ebat', mamulExcelMapDeger(map, ['HAM EBAT']));
        set('val-mamul-istenilen-ham-ebat', mamulExcelMapDeger(map, ['ISTENILEN HAM EBAT']));
        set('val-mamul-olculen-ham-ebat', mamulExcelMapDeger(map, ['OLCULEN HAM EBAT']));
        set('val-mamul-olculen-mamul-ebat', mamulExcelMapDeger(map, ['OLCULEN MAMUL EBAT']));
        set('val-mamul-ham-gram-mtul', mamulExcelMapDeger(map, ['HAM GRAM MTUL']));
        set('val-mamul-ham-gram-m2', mamulExcelMapDeger(map, ['HAM GRAM M2']));
        set('val-mamul-mamul-gram-mtul', mamulExcelMapDeger(map, ['MAMUL GRAM MTUL']));
        set('val-mamul-mamul-gram-m2', mamulExcelMapDeger(map, ['MAMUL GRAM M2']));
        set('val-mamul-tahar-raporu', mamulExcelMapDeger(map, ['TAHAR RAPORU']));
        set('val-mamul-aciklama', mamulExcelMapDeger(map, ['ACIKLAMA']));
        if (Array.isArray(varyantlar) && varyantlar.length) {
            mamulEkAlanFormDoldur({ varyantlar });
        }
    }

    function mamulExcelSeciciAc() {
        const inp = document.getElementById('mamul-excel-input');
        if (inp) inp.click();
    }
    window.mamulExcelSeciciAc = mamulExcelSeciciAc;

    function mamulExcelYukle(inp) {
        try {
            const file = inp?.files?.[0];
            if (!file) return;
            if (typeof XLSX === 'undefined') {
                if (typeof erpToast === 'function') erpToast('Excel kütüphanesi yüklenemedi.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = ev?.target?.result;
                    const wb = XLSX.read(data, { type: 'binary', cellDates: true });
                    const wsName = wb.SheetNames.find(n => /DEVE TABANI/i.test(n)) || wb.SheetNames[0];
                    if (!wsName) throw new Error('Sayfa yok');
                    const ws = wb.Sheets[wsName];
                    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
                    const map = mamulExcelMapOlustur(rows);
                    const varyantlar = mamulExcelVaryantParse(rows);
                    mamulExcelFormaYaz(map, varyantlar);
                    if (typeof erpToast === 'function') erpToast(`Excel aktarıldı: ${file.name}`, 'success');
                } catch (e) {
                    if (typeof erpToast === 'function') erpToast('Excel okunamadı. Şablonu kontrol edin.', 'error');
                } finally {
                    if (inp) inp.value = '';
                }
            };
            reader.onerror = () => {
                if (typeof erpToast === 'function') erpToast('Excel dosyası açılamadı.', 'error');
                if (inp) inp.value = '';
            };
            reader.readAsBinaryString(file);
        } catch (e) {
            if (typeof erpToast === 'function') erpToast('Excel aktarımında hata oluştu.', 'error');
            if (inp) inp.value = '';
        }
    }
    window.mamulExcelYukle = mamulExcelYukle;

    function mamulStokKartFormHtml(imageBase64) {
        const img = imageBase64 || '';
        const varyantHead = [1, 2, 3, 4].map(v => `<th id="mamul-varyant-col-${v}" colspan="3">V${v}</th>`).join('');
        const varyantSubHead = [1, 2, 3, 4].map(() => `<th>İplik</th><th>Renk</th><th>Atkı</th>`).join('');
        const varyantRows = [1, 2, 3, 4, 5, 6].map(a => `
            <tr>
                <td>A${a}</td>
                ${[1, 2, 3, 4].map(v => `
                    <td><input id="val-mamul-v${v}-a${a}-iplik" class="pro-input"></td>
                    <td><input id="val-mamul-v${v}-a${a}-renk" class="pro-input"></td>
                    <td><input id="val-mamul-v${v}-a${a}-sayi" class="pro-input"></td>
                `).join('')}
            </tr>
        `).join('');
        const f = (id, label, opts) => {
            opts = opts || {};
            if (opts.type === 'textarea') {
                return `<div class="mamul-field"><label class="pro-label">${label}</label><textarea id="${id}" rows="1" class="pro-input"></textarea></div>`;
            }
            return `<div class="mamul-field"><label class="pro-label">${label}</label><input id="${id}" type="${opts.type || 'text'}" class="pro-input" ${opts.extra || ''}></div>`;
        };
        const fotoInner = img
            ? `<img id="img-preview" src="${img}"><span id="foto-placeholder" style="display:none">📷</span>`
            : `<img id="img-preview" style="display:none" src=""><span id="foto-placeholder">📷</span>`;
        return `
        <div class="mamul-sheet">
            <div class="mamul-sheet__toolbar">
                <div class="mamul-sheet__toolbar-left">
                    <div class="mamul-sheet__kod"><input id="val-kodu" readonly></div>
                    <span style="font-size:10px;font-weight:700;color:var(--amber-c)">🧥 Mamül Stok Kartı</span>
                </div>
                <div class="mamul-sheet__toolbar-right">
                    <label for="val-foto" class="mamul-sheet__foto-btn">${fotoInner} Foto</label>
                    <input type="file" id="val-foto" onchange="handleImageUpload(this)" class="hidden">
                    <button type="button" onclick="mamulExcelSeciciAc()" class="btn-pro btn-primary-pro" style="padding:4px 10px;font-size:9px">📥 Excel</button>
                    <select id="val-durum" class="pro-input" style="width:auto;padding:3px 8px;font-size:9px;height:26px">
                        <option value="AKTİF">AKTİF</option>
                        <option value="PASİF">PASİF</option>
                        <option value="ARŞİV">ARŞİV</option>
                    </select>
                </div>
            </div>

            <div class="mamul-sheet__section">Kimlik</div>
            <div class="mamul-sheet__grid mamul-sheet__grid--kimlik">
                ${f('val-mamul-tarih', 'Tarih', { type: 'date' })}
                ${f('val-firma', 'Müşteri', { extra: 'style="text-transform:uppercase"' })}
                ${f('val-mamul-siparis-no', 'Sipariş No')}
                ${f('val-mamul-tezgah-no', 'Tezgah No')}
                ${f('val-kumas-cinsi', 'Kumaş Cinsi')}
                ${f('val-mamul-kumas-stok-kodu', 'Kumaş Stok Kodu')}
                ${f('val-desen-adi', 'Desen Adı')}
                ${f('val-mamul-tezgah-desen-no', 'Tezgah Desen No')}
            </div>

            <div class="mamul-sheet__section">Dokuma Talimatı</div>
            <div class="mamul-sheet__grid mamul-sheet__grid--dokuma">
                ${f('val-mamul-cozgu-sikligi', 'Çözgü Sıklığı')}
                ${f('val-mamul-atki-sikligi', 'Atkı Sıklığı')}
                ${f('val-mamul-toplam-atki', 'Toplam Atkı')}
                ${f('val-mamul-sacak-atki', 'Saçak Atkı')}
                ${f('val-mamul-cozgu-iplik-no', 'Çözgü İplik No')}
                ${f('val-mamul-atki-iplik-no', 'Atkı İplik No')}
                ${f('val-mamul-cozgu-iplik-markasi', 'Çözgü Marka')}
                ${f('val-mamul-atki-iplik-markasi', 'Atkı Marka')}
                ${f('val-tarak-no', 'Tarak No')}
                ${f('val-tarak-eni', 'Tarak Eni')}
                ${f('val-mamul-cozgu-tel-sayisi', 'Çözgü Tel')}
                ${f('val-mamul-istenen-mamul-ebat', 'İstenen Mamül Ebat')}
                ${f('val-mamul-ham-ebat', 'Ham Ebat')}
                ${f('val-mamul-istenilen-ham-ebat', 'İstenilen Ham Ebat')}
                ${f('val-mamul-olculen-ham-ebat', 'Ölçülen Ham Ebat')}
                ${f('val-mamul-olculen-mamul-ebat', 'Ölçülen Mamül Ebat')}
                ${f('val-mamul-ham-gram-mtul', 'Ham gr/mtül')}
                ${f('val-mamul-ham-gram-m2', 'Ham gr/m²')}
                ${f('val-mamul-mamul-gram-mtul', 'Mamül gr/mtül')}
                ${f('val-mamul-mamul-gram-m2', 'Mamül gr/m²')}
                ${f('val-mamul-tahar-raporu', 'Tahar Raporu')}
            </div>
            <div class="mamul-sheet__grid mamul-sheet__grid--aciklama">
                ${f('val-mamul-aciklama', 'Açıklama', { type: 'textarea' })}
            </div>

            <div class="mamul-sheet__section">Renk Varyantları</div>
            <div class="mamul-varyant-bar">
                <span style="font-size:8px;color:var(--text3);font-family:'DM Mono',monospace">Atkı 1–6 · Sipariş ad/mt</span>
                <div class="mamul-varyant-bar__btns">
                    <button type="button" onclick="mamulVaryantKolonunaGit(1)" class="btn-pro btn-ghost-pro">V1</button>
                    <button type="button" onclick="mamulVaryantKolonunaGit(2)" class="btn-pro btn-ghost-pro">V2</button>
                    <button type="button" onclick="mamulVaryantKolonunaGit(3)" class="btn-pro btn-ghost-pro">V3</button>
                    <button type="button" onclick="mamulVaryantKolonunaGit(4)" class="btn-pro btn-ghost-pro">V4</button>
                    <button type="button" onclick="mamulVaryantKopyala(1,2)" class="btn-pro btn-ghost-pro">1→2</button>
                    <button type="button" onclick="mamulVaryantKopyala(1,3)" class="btn-pro btn-ghost-pro">1→3</button>
                    <button type="button" onclick="mamulVaryantKopyala(1,4)" class="btn-pro btn-ghost-pro">1→4</button>
                </div>
            </div>
            <div id="mamul-varyant-scroll" class="mamul-varyant-scroll">
                <table class="mamul-varyant-table">
                    <thead>
                        <tr><th rowspan="2"></th>${varyantHead}</tr>
                        <tr>${varyantSubHead}</tr>
                    </thead>
                    <tbody>${varyantRows}
                        <tr>
                            <td>Sipariş</td>
                            ${[1, 2, 3, 4].map(v => `<td colspan="3"><input id="val-mamul-v${v}-siparis" class="pro-input"></td>`).join('')}
                        </tr>
                        <tr>
                            <td>1 Boy</td>
                            ${[1, 2, 3, 4].map(v => `<td colspan="3"><input id="val-mamul-v${v}-boy" class="pro-input"></td>`).join('')}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>`;
    }
    window.mamulStokKartFormHtml = mamulStokKartFormHtml;

    function mamulVaryantFormDoluMu(v) {
        if (!v) return false;
        if (String(v.siparis_ad_mt || '').trim() || String(v.bir_boy_dokunacak || '').trim()) return true;
        return (Array.isArray(v.atki) ? v.atki : []).some(a =>
            String(a?.iplik_no || '').trim() || String(a?.renk || '').trim() || String(a?.atki_sayisi || '').trim()
        );
    }

    function mamulVaryantRenkEtiket(v) {
        const renkler = (Array.isArray(v?.atki) ? v.atki : [])
            .map(a => String(a?.renk || '').trim())
            .filter(Boolean);
        return renkler.length ? renkler[renkler.length - 1].toUpperCase() : '';
    }

    function mamulAtkiRenkleriSerilestir(atki) {
        return (Array.isArray(atki) ? atki : []).map((a, i) => {
            const iplik = String(a?.iplik_no || '').trim() || '-';
            const renk = String(a?.renk || '').trim() || '-';
            const sayi = String(a?.atki_sayisi || '').trim() || '-';
            if (iplik === '-' && renk === '-' && sayi === '-') return '';
            return `A${i + 1} : ${iplik} / ${renk} / ${sayi}`;
        }).filter(Boolean).join(' | ');
    }

    async function mamulVaryantKayitlariOlustur(anaPayload, ekMeta) {
        const anaKod = String(anaPayload?.desen_kodu || '').trim().toUpperCase();
        if (!anaKod || mamulVaryantNoBul(anaKod) > 0) return { ok: true, created: 0 };
        const varyantlar = Array.isArray(ekMeta?.varyantlar) ? ekMeta.varyantlar : [];
        const mevcut = (dataCache.kumas_kutuphanesi || []);
        const rows = [];
        for (let vi = 0; vi < varyantlar.length; vi++) {
            const v = varyantlar[vi];
            if (!mamulVaryantFormDoluMu(v)) continue;
            const vNo = vi + 1;
            const varKod = mamulVaryantKodFormatla(anaKod, vNo);
            if (mevcut.some(x => String(x.desen_kodu || '').trim().toUpperCase() === varKod)) continue;
            const renk = mamulVaryantRenkEtiket(v);
            const atkiStr = mamulAtkiRenkleriSerilestir(v.atki);
            const varMeta = { ...ekMeta, varyant_no: vNo };
            if (v.siparis_ad_mt) varMeta.siparis_ad_mt = v.siparis_ad_mt;
            if (v.bir_boy_dokunacak) varMeta.bir_boy_dokunacak = v.bir_boy_dokunacak;
            rows.push({
                desen_kodu: varKod,
                urun_adi: anaPayload.urun_adi || anaPayload.desen_adi || anaPayload.kumas_cinsi || '',
                firma: anaPayload.firma || '',
                kumas_cinsi: anaPayload.kumas_cinsi || '',
                desen_adi: anaPayload.desen_adi || '',
                tarak_no: anaPayload.tarak_no || '',
                tarak_eni: anaPayload.tarak_eni || '',
                atki_sikligi: anaPayload.atki_sikligi || '',
                cozgu_no: anaPayload.cozgu_no || '',
                cozgu_cinsi: anaPayload.cozgu_cinsi || '',
                ham_en: anaPayload.ham_en || '',
                ham_boy: anaPayload.ham_boy || '',
                ham_gsm: anaPayload.ham_gsm || '',
                mamul_en: anaPayload.mamul_en || '',
                mamul_boy: anaPayload.mamul_boy || '',
                mamul_gsm: anaPayload.mamul_gsm || '',
                renk: renk,
                atki_renkleri: atkiStr,
                kalite: anaPayload.kalite || 'AKTİF',
                fotograf: anaPayload.fotograf || null,
                ana_grup: 'MAMUL',
                notlar: typeof kumasNotlarOlustur === 'function'
                    ? kumasNotlarOlustur(ekMeta.aciklama || '', varMeta)
                    : (ekMeta.aciklama || '')
            });
        }
        if (!rows.length) return { ok: true, created: 0 };
        const ins = await sb.from('kumas_kutuphanesi').insert(rows);
        if (ins.error) return { ok: false, error: ins.error, created: 0 };
        return { ok: true, created: rows.length };
    }
    window.mamulVaryantKayitlariOlustur = mamulVaryantKayitlariOlustur;
})();
