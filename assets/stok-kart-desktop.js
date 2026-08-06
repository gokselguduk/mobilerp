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

    /** Mamül stok kodu: YYYYNNN (ana) · YYYYNNN-N (varyant). Eski YYYY-NNN / MA- formatları da desteklenir. */
    function getMamulYilTam() {
        return String(new Date().getFullYear());
    }
    window.getMamulYilTam = getMamulYilTam;

    function mamulAnaKodSeqParse(kod) {
        const s = String(kod || '').trim().toUpperCase();
        const yil = getMamulYilTam();
        // Yeni: 2026001 veya 2026001-1
        let m = s.match(new RegExp(`^(${yil})(\\d{3})(?:-\\d+)?$`));
        if (m) return parseInt(m[2], 10) || 0;
        // Eski: 2026-001 veya 2026-001-01
        m = s.match(new RegExp(`^(${yil})-(\\d{1,4})(?:-\\d+)?$`));
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
        return `${yil}${String(n).padStart(3, '0')}`;
    }
    window.mamulAnaKodFormatla = mamulAnaKodFormatla;

    function mamulVaryantKodFormatla(anaKod, varyantNo) {
        const ana = mamulAnaKodNormalize(anaKod);
        const v = Math.max(1, parseInt(varyantNo, 10) || 1);
        return `${ana}-${v}`;
    }
    window.mamulVaryantKodFormatla = mamulVaryantKodFormatla;

    function getNextMamulAnaKod() {
        const yil = getMamulYilTam();
        let maxSeq = 0;
        (dataCache.kumas_kutuphanesi || []).forEach(item => {
            const kod = String(item.desen_kodu || '').trim().toUpperCase();
            if (!kod || !mamulStokKoduFormatMi(kod)) return;
            const ana = mamulAnaKodBul(kod);
            if (!ana.startsWith(yil)) return;
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
        if (/^\d{7}(-\d+)?$/.test(s)) return true;
        if (/^\d{4}-\d{1,4}(-\d+)?$/.test(s)) return true;
        if (/^\d{5,6}(-\d+)?$/.test(s)) return true;
        const pref = s.split(/[-\s]/)[0];
        return pref === 'MA' || pref === 'MM';
    }
    window.mamulStokKoduFormatMi = mamulStokKoduFormatMi;

    function mamulAnaKodHamBul(kod) {
        const s = String(kod || '').trim().toUpperCase();
        let m = s.match(/^(\d{7})-\d+$/);
        if (m) return m[1];
        if (/^\d{7}$/.test(s)) return s;
        m = s.match(/^(\d{4}-\d{1,4})-\d+$/);
        if (m) return m[1];
        if (/^\d{4}-\d{1,4}$/.test(s)) return s;
        m = s.match(/^(\d{5,6})-\d+$/);
        if (m) return m[1];
        if (/^\d{5,6}$/.test(s)) return s;
        m = s.match(/^(MA-\d+)(?:-\d+)?$/i);
        return m ? m[1].toUpperCase() : s;
    }

    function mamulAnaKodNormalize(kod) {
        const ham = mamulAnaKodHamBul(kod);
        if (!ham) return '';
        if (/^\d{4}-\d{1,4}$/.test(ham)) {
            const [yil, num] = ham.split('-');
            return `${yil}${String(parseInt(num, 10) || 1).padStart(3, '0')}`;
        }
        if (/^\d{7}$/.test(ham)) return ham;
        if (/^\d{5,6}$/.test(ham)) {
            const seq = mamulAnaKodSeqParse(ham);
            if (seq > 0) return mamulAnaKodFormatla(seq);
        }
        return ham;
    }
    window.mamulAnaKodNormalize = mamulAnaKodNormalize;

    function mamulAnaKodBul(kod) {
        return mamulAnaKodNormalize(kod);
    }
    window.mamulAnaKodBul = mamulAnaKodBul;

    function mamulVaryantNoBul(kod) {
        const s = String(kod || '').trim().toUpperCase();
        let m = s.match(/^\d{7}-(\d+)$/);
        if (m) return parseInt(m[1], 10) || 0;
        m = s.match(/^\d{4}-\d{1,4}-(\d+)$/);
        if (m) return parseInt(m[1], 10) || 0;
        m = s.match(/^\d{5,6}-(\d+)$/);
        if (m) return parseInt(m[1], 10) || 0;
        m = s.match(/^MA-\d+-(\d+)$/i);
        return m ? (parseInt(m[1], 10) || 0) : 0;
    }
    window.mamulVaryantNoBul = mamulVaryantNoBul;

    /** Mamül kart formunda başlangıç varyant kolonu; üst sınır yok — ihtiyaç oldukça eklenir */
    const MAMUL_VARYANT_BASLANGIC = 4;

    function mamulVaryantKolonSayisiAl() {
        return Math.max(MAMUL_VARYANT_BASLANGIC, parseInt(window._mamulVaryantKolonSayisi, 10) || MAMUL_VARYANT_BASLANGIC);
    }
    window.mamulVaryantKolonSayisiAl = mamulVaryantKolonSayisiAl;

    function mamulVaryantKolonSayisiIhtiyac(varyantlar, anaKod) {
        let max = MAMUL_VARYANT_BASLANGIC;
        if (Array.isArray(varyantlar)) max = Math.max(max, varyantlar.length);
        const ana = String(anaKod || '').trim().toUpperCase();
        if (ana) {
            (dataCache.kumas_kutuphanesi || []).forEach(rec => {
                const kod = String(rec.desen_kodu || '').trim().toUpperCase();
                if (mamulAnaKodBul(kod) !== ana) return;
                const vNo = mamulVaryantNoBul(kod);
                if (vNo > max) max = vNo;
            });
        }
        return max;
    }

    function mamulVaryantKolonSayisiAyarla(n) {
        const sayi = Math.max(MAMUL_VARYANT_BASLANGIC, parseInt(n, 10) || MAMUL_VARYANT_BASLANGIC);
        window._mamulVaryantKolonSayisi = sayi;
        return sayi;
    }
    window.mamulVaryantKolonSayisiAyarla = mamulVaryantKolonSayisiAyarla;

    function mamulVaryantAtkiBosSatir() {
        return { iplik_no: '', renk: '', atki_sayisi: '' };
    }

    function mamulVaryantBosHucre() {
        return { renk_etiket: '', atki: Array.from({ length: 6 }, () => mamulVaryantAtkiBosSatir()) };
    }

    function mamulVaryantFormVerisiOku(kolonSayisi) {
        const g = (id) => String(document.getElementById(id)?.value || '').trim();
        const sayi = kolonSayisi || mamulVaryantKolonSayisiAl();
        const varyantlar = [];
        for (let v = 1; v <= sayi; v++) {
            const atki = [];
            for (let a = 1; a <= 6; a++) {
                atki.push({
                    iplik_no: g(`val-mamul-v${v}-a${a}-iplik`),
                    renk: g(`val-mamul-v${v}-a${a}-renk`),
                    atki_sayisi: g(`val-mamul-v${v}-a${a}-sayi`)
                });
            }
            varyantlar.push({
                renk_etiket: g(`val-mamul-v${v}-renk-etiket`),
                atki
            });
        }
        return varyantlar;
    }

    function mamulFormAnaKodOku() {
        const raw = document.getElementById('val-kodu')?.value || '';
        return typeof mamulAnaKodNormalize === 'function'
            ? mamulAnaKodNormalize(raw)
            : String(raw).trim().toUpperCase();
    }
    window.mamulFormAnaKodOku = mamulFormAnaKodOku;

    function mamulVaryantKodOnizle(vNo) {
        const ana = mamulFormAnaKodOku();
        const v = Math.max(1, parseInt(vNo, 10) || 1);
        if (!ana) return `V${v}`;
        return mamulVaryantKodFormatla(ana, v);
    }
    window.mamulVaryantKodOnizle = mamulVaryantKodOnizle;

    function mamulVaryantKodBasliklariYenile() {
        const sayi = mamulVaryantKolonSayisiAl();
        for (let v = 1; v <= sayi; v++) {
            const th = document.getElementById(`mamul-varyant-col-${v}`);
            if (!th) continue;
            const kod = mamulVaryantKodOnizle(v);
            th.innerHTML = `<div class="mamul-varyant-kod-baslik"><span class="mamul-varyant-kod-baslik__kod">${kod}</span><span class="mamul-varyant-kod-baslik__v">V${v}</span></div>`;
        }
        const barBtns = document.getElementById('mamul-varyant-bar-btns');
        if (barBtns) barBtns.innerHTML = mamulVaryantBarParcaHtml(sayi);
    }
    window.mamulVaryantKodBasliklariYenile = mamulVaryantKodBasliklariYenile;

    function mamulVaryantTabloParcaHtml(kolonSayisi) {
        const nums = Array.from({ length: kolonSayisi }, (_, i) => i + 1);
        const varyantHead = nums.map(v => `<th id="mamul-varyant-col-${v}" colspan="3">V${v}</th>`).join('');
        const varyantSubHead = nums.map(() => `<th>İplik</th><th>Renk</th><th>Atkı</th>`).join('');
        const renkAdiRow = `<tr>
                <td>RENK ADI</td>
                ${nums.map(v => `
                    <td colspan="3"><input id="val-mamul-v${v}-renk-etiket" class="pro-input" placeholder="Örn. REJ-BEJ" style="font-weight:700;text-transform:uppercase"></td>
                `).join('')}
            </tr>`;
        const varyantRows = renkAdiRow + [1, 2, 3, 4, 5, 6].map(a => `
            <tr>
                <td>A${a}</td>
                ${nums.map(v => `
                    <td><input id="val-mamul-v${v}-a${a}-iplik" class="pro-input"></td>
                    <td><input id="val-mamul-v${v}-a${a}-renk" class="pro-input"></td>
                    <td><input id="val-mamul-v${v}-a${a}-sayi" class="pro-input"></td>
                `).join('')}
            </tr>
        `).join('');
        return { varyantHead, varyantSubHead, varyantRows };
    }

    function mamulVaryantBarParcaHtml(kolonSayisi) {
        const nums = Array.from({ length: kolonSayisi }, (_, i) => i + 1);
        const navBtns = nums.map(v => {
            const kod = mamulVaryantKodOnizle(v);
            return `<button type="button" onclick="mamulVaryantKolonunaGit(${v})" class="btn-pro btn-ghost-pro" title="V${v} · ${kod}">${kod}</button>`;
        }).join('');
        const kopyaBtns = nums.length > 1
            ? nums.slice(1, Math.min(nums.length, 5)).map(v =>
                `<button type="button" onclick="mamulVaryantKopyala(1,${v})" class="btn-pro btn-ghost-pro">1→${v}</button>`
            ).join('')
            : '';
        return navBtns + kopyaBtns;
    }

    function mamulVaryantTabloYenile(kolonSayisi, mevcutVaryantlar) {
        const sayi = mamulVaryantKolonSayisiAyarla(kolonSayisi || mamulVaryantKolonSayisiAl());
        const scroll = document.getElementById('mamul-varyant-scroll');
        const barBtns = document.getElementById('mamul-varyant-bar-btns');
        const kayitli = Array.isArray(mevcutVaryantlar)
            ? mevcutVaryantlar
            : (scroll ? mamulVaryantFormVerisiOku(mamulVaryantKolonSayisiAl()) : []);
        const parca = mamulVaryantTabloParcaHtml(sayi);
        if (scroll) {
            scroll.innerHTML = `
                <table class="mamul-varyant-table">
                    <thead>
                        <tr><th rowspan="2"></th>${parca.varyantHead}</tr>
                        <tr>${parca.varyantSubHead}</tr>
                    </thead>
                    <tbody>${parca.varyantRows}</tbody>
                </table>`;
        }
        if (barBtns) barBtns.innerHTML = mamulVaryantBarParcaHtml(sayi);
        if (kayitli.length) {
            const s = (id, val) => {
                const el = document.getElementById(id);
                if (!el || val == null || String(val).trim() === '') return;
                el.value = String(val).trim();
            };
            for (let v = 1; v <= sayi; v++) {
                const vv = kayitli[v - 1] || {};
                const atki = Array.isArray(vv.atki) ? vv.atki : [];
                s(`val-mamul-v${v}-renk-etiket`, vv.renk_etiket || mamulVaryantRenkEtiket(vv));
                for (let a = 1; a <= 6; a++) {
                    const aa = atki[a - 1] || {};
                    s(`val-mamul-v${v}-a${a}-iplik`, aa.iplik_no);
                    s(`val-mamul-v${v}-a${a}-renk`, aa.renk);
                    s(`val-mamul-v${v}-a${a}-sayi`, aa.atki_sayisi);
                }
            }
        }
        mamulVaryantKodBasliklariYenile();
        return sayi;
    }
    window.mamulVaryantTabloYenile = mamulVaryantTabloYenile;

    function mamulVaryantKolonEkle() {
        const cur = mamulVaryantKolonSayisiAl();
        const data = mamulVaryantFormVerisiOku(cur);
        mamulVaryantTabloYenile(cur + 1, data);
        mamulVaryantKolonunaGit(cur + 1);
        if (typeof erpToast === 'function') erpToast(`V${cur + 1} varyant kolonu eklendi.`, 'success');
    }
    window.mamulVaryantKolonEkle = mamulVaryantKolonEkle;

    /** Depo giriş/çıkış araması — ana kart adıyla eşleşince tüm varyantları listeler */
    function mamulDepoAramaMetni(kart, anaKart) {
        const k = kart || {};
        const a = anaKart || {};
        return [
            k.desen_kodu, k.stok_kodu, k.urun_adi, k.desen_adi, k.firma, k.kumas_cinsi, k.renk,
            k.atki_renkleri,
            a.desen_kodu, a.urun_adi, a.desen_adi, a.firma, a.kumas_cinsi
        ].map(x => String(x || '').toLowerCase()).join(' ');
    }
    window.mamulDepoAramaMetni = mamulDepoAramaMetni;

    function mamulDepoAramaSonuclari(q, limit = 24) {
        const qLower = String(q || '').trim().toLowerCase();
        if (!qLower) return [];

        const kartlar = (dataCache.kumas_kutuphanesi || []).filter(x =>
            x.desen_kodu && !String(x.desen_kodu).startsWith('NU') &&
            typeof kumasKutuphanesiKartiMamulMu === 'function' && kumasKutuphanesiKartiMamulMu(x)
        );

        const anaMap = {};
        kartlar.forEach(k => {
            const kod = String(k.desen_kodu || '').trim().toUpperCase();
            const ana = mamulAnaKodBul(kod);
            if (!anaMap[ana]) anaMap[ana] = { ana: null, varyantlar: [] };
            const vNo = mamulVaryantNoBul(kod);
            if (vNo > 0) anaMap[ana].varyantlar.push(k);
            else anaMap[ana].ana = k;
        });
        Object.values(anaMap).forEach(g => {
            g.varyantlar.sort((a, b) => mamulVaryantNoBul(a.desen_kodu) - mamulVaryantNoBul(b.desen_kodu));
            if (!g.varyantlar.length && g.ana) {
                const sentez = mamulAnaVaryantKayitlariTopla(g.ana);
                if (sentez.length) g.varyantlar = sentez;
            }
        });

        const seen = new Set();
        const out = [];

        const ekle = (k) => {
            const kod = String(k?.desen_kodu || '').trim();
            if (!kod || seen.has(kod)) return;
            if (!k?._mamulVaryantSentez && typeof depoMamulStokKartiDogrula === 'function' && depoMamulStokKartiDogrula(kod) !== null) return;
            const ana = mamulAnaKodBul(kod);
            const vNo = mamulVaryantNoBul(kod);
            if (vNo <= 0 && (anaMap[ana]?.varyantlar?.length || 0) > 0) return;
            seen.add(kod);
            out.push(k);
        };

        kartlar.forEach(k => {
            const kod = String(k.desen_kodu || '').trim();
            const ana = mamulAnaKodBul(kod);
            const grup = anaMap[ana] || { ana: null, varyantlar: [] };
            const anaKart = grup.ana;
            const kodHit = kod.toLowerCase().includes(qLower);
            const metinHit = mamulDepoAramaMetni(k, anaKart).includes(qLower);
            if (!kodHit && !metinHit) return;

            const vNo = mamulVaryantNoBul(kod);

            if (kodHit) {
                if (vNo > 0) ekle(k);
                else if (grup.varyantlar.length) grup.varyantlar.forEach(v => ekle(v));
                else ekle(k);
                return;
            }

            if (vNo > 0) {
                ekle(k);
            } else if (grup.varyantlar.length) {
                grup.varyantlar.forEach(v => ekle(v));
            } else {
                ekle(k);
            }
        });

        return out.slice(0, limit);
    }
    window.mamulDepoAramaSonuclari = mamulDepoAramaSonuclari;

    function mamulDepoAramaEtiket(kart, anaKart) {
        const ad = kart?.urun_adi || kart?.desen_adi || anaKart?.urun_adi || anaKart?.desen_adi || '—';
        const vNo = mamulVaryantNoBul(kart?.desen_kodu);
        const renk = String(kart?.renk || '').trim();
        const varyant = renk || (vNo > 0 ? `V${String(vNo).padStart(2, '0')}` : '');
        return { ad, varyant };
    }
    window.mamulDepoAramaEtiket = mamulDepoAramaEtiket;

    function mamulTopluUrunDetayOlustur(kart) {
        if (!kart) return { ad: '—', ebat: '', renk: '', musteri: '' };
        const anaKod = typeof mamulAnaKodBul === 'function' ? mamulAnaKodBul(kart.desen_kodu) : kart.desen_kodu;
        const ana = typeof mamulAnaKayitBul === 'function'
            ? mamulAnaKayitBul(anaKod)
            : (dataCache.kumas_kutuphanesi || []).find(k =>
                String(k.desen_kodu || '').trim().toUpperCase() === String(anaKod || '').trim().toUpperCase()
            );
        const metaKaynak = ana || kart;
        const meta = mamulEkAlanMetaDecode(metaKaynak?.notlar || '');
        const etiket = mamulDepoAramaEtiket(kart, ana);
        let ebat = String(meta.istenen_mamul_ebat || meta.olculen_mamul_ebat || '').trim();
        if (!ebat) {
            const en = kart.mamul_en || ana?.mamul_en || kart.ham_en || ana?.ham_en;
            const boy = kart.mamul_boy || ana?.mamul_boy || kart.ham_boy || ana?.ham_boy;
            if (en && boy) ebat = `${en}*${boy}`;
        }
        const renk = String(etiket.varyant || kart.renk || '').trim();
        const musteri = String(meta.musteri || kart.firma || ana?.firma || '').trim();
        const desen = String(ana?.desen_adi || kart?.desen_adi || '').trim();
        const urun = String(kart?.urun_adi || ana?.urun_adi || '').trim();
        const baslikParcalari = [];
        if (desen) baslikParcalari.push(desen);
        if (urun && urun.toUpperCase() !== desen.toUpperCase()) baslikParcalari.push(urun);
        const ad = baslikParcalari.length
            ? baslikParcalari.map(s => s.toUpperCase()).join(' · ')
            : (etiket.ad || '—');
        return {
            ad,
            desen: desen.toUpperCase(),
            urun: urun.toUpperCase(),
            ebat: ebat.toUpperCase(),
            renk: renk.toUpperCase(),
            musteri: musteri.toUpperCase()
        };
    }
    window.mamulTopluUrunDetayOlustur = mamulTopluUrunDetayOlustur;

    function mamulDepoStokSatirAlt(detay, opts) {
        const o = opts || {};
        const parcalar = [];
        if (detay?.ebat) parcalar.push(detay.ebat);
        if (detay?.renk) parcalar.push(detay.renk);
        if (detay?.musteri) parcalar.push(detay.musteri);
        if (o.netAd != null && o.netAd !== '') parcalar.push(`${o.netAd} ad stok`);
        let alt = parcalar.join(' · ');
        if (o.hareket != null) {
            const hTxt = `${o.hareket} hareket · +${o.girisAd || 0} / -${o.cikisAd || 0}`;
            alt = alt ? `${alt} · ${hTxt}` : hTxt;
        }
        return alt || '—';
    }
    window.mamulDepoStokSatirAlt = mamulDepoStokSatirAlt;

    function mamulDepoStokAramaMetni(stokKodu, detay, ek) {
        return [
            stokKodu,
            detay?.desen,
            detay?.urun,
            detay?.ad,
            detay?.ebat,
            detay?.renk,
            detay?.musteri,
            ek
        ].filter(Boolean).join(' ').toLowerCase();
    }
    window.mamulDepoStokAramaMetni = mamulDepoStokAramaMetni;

    function mamulTopluUrunDetayMetin(detay) {
        if (!detay) return '—';
        return [detay.ad, detay.ebat, detay.renk, detay.musteri].filter(Boolean).join(' · ');
    }
    window.mamulTopluUrunDetayMetin = mamulTopluUrunDetayMetin;

    function mamulTopluUrunDetayHtml(detay, escFn) {
        const esc = escFn || (s => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'));
        if (!detay || !detay.ad) return '—';
        const alt = [detay.ebat, detay.renk, detay.musteri].filter(Boolean);
        if (!alt.length) return esc(detay.ad);
        return `<span class="mamul-toplu-urun-ad">${esc(detay.ad)}</span><span class="mamul-toplu-urun-meta">${alt.map(esc).join(' · ')}</span>`;
    }
    window.mamulTopluUrunDetayHtml = mamulTopluUrunDetayHtml;

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
        const toplam = { adet: 0 };
        (Array.isArray(kodlar) ? kodlar : []).forEach(kod => {
            const bak = depoMamulBakiyeHesapla(kod);
            toplam.adet += Number(bak.adet || 0);
        });
        return toplam.adet ? toplam.adet + ' ad' : '0 ad';
    }
    window.mamulStokBakiyeToplamText = mamulStokBakiyeToplamText;

    const MAMUL_DOKUMA_TALIMAT_ALANLARI = [
        ['musteri', 'MÜŞTERİ'],
        ['musteri_siparis_no', 'MÜŞTERİ SİPARİŞ NO'],
        ['tezgah_no', 'TEZGAH NO'],
        ['kumas_cinsi', 'KUMAŞ CİNSİ'],
        ['istenen_mamul_ebat', 'İSTENEN MAMÜL EBAT'],
        ['tezgah_desen_no', 'TEZGAH DESEN NO'],
        ['cozgu_iplik_no', 'ÇÖZGÜ İPLİK NO'],
        ['atki_iplik_no', 'ATKI İPLİK NO'],
        ['cozgu_iplik_markasi', 'ÇÖZGÜ İPLİK MARKASI'],
        ['atki_iplik_markasi', 'ATKI İPLİK MARKASI'],
        ['tarak_no', 'TARAK NO'],
        ['tarak_eni', 'TARAK ENİ'],
        ['cozgu_tel_sayisi', 'ÇÖZGÜ TEL SAYISI'],
        ['cozgu_sikligi', 'ÇÖZGÜ SIKLIĞI'],
        ['atki_sikligi', 'ATKI SIKLIĞI'],
        ['toplam_atki_sayisi', 'TOPLAM ATKI SAYISI'],
        ['sacak_atki_sayisi', 'SAÇAK ATKI SAYISI'],
        ['desen_adi', 'DESEN ADI'],
        ['olculen_ham_ebat', 'ÖLÇÜLEN HAM EBAT'],
        ['olculen_mamul_ebat', 'ÖLÇÜLEN MAMÜL EBAT'],
        ['ham_gram_mtul', 'HAM GRAM/MTÜL'],
        ['ham_gram_m2', 'HAM GR/M²'],
        ['mamul_gram_mtul', 'MAMÜL GRAM/MTÜL'],
        ['mamul_gram_m2', 'MAMÜL GR/M²'],
        ['tahar_raporu', 'TAHAR RAPORU'],
    ];
    window.MAMUL_DOKUMA_TALIMAT_ALANLARI = MAMUL_DOKUMA_TALIMAT_ALANLARI;

    /** Excel satır düzeni — her satırda 3 alan (etiket+değer çifti) */
    const MAMUL_TALIMAT_SATIRLARI = [
        [['musteri', 'MÜŞTERİ'], ['musteri_siparis_no', 'MÜŞTERİ SİPARİŞ NO'], ['tezgah_no', 'TEZGAH NO']],
        [['kumas_cinsi', 'KUMAŞ CİNSİ'], ['desen_adi', 'DESEN ADI'], ['istenen_mamul_ebat', 'İSTENEN MAMÜL EBAT']],
        [['tezgah_desen_no', 'TEZGAH DESEN NO'], ['cozgu_iplik_no', 'ÇÖZGÜ İPLİK NO'], ['atki_iplik_no', 'ATKI İPLİK NO']],
        [['cozgu_iplik_markasi', 'ÇÖZGÜ MARKASI'], ['atki_iplik_markasi', 'ATKI MARKASI'], ['tarak_no', 'TARAK NO']],
        [['tarak_eni', 'TARAK ENİ'], ['cozgu_tel_sayisi', 'ÇÖZGÜ TEL SAYISI'], ['cozgu_sikligi', 'ÇÖZGÜ SIKLIĞI']],
        [['atki_sikligi', 'ATKI SIKLIĞI'], ['toplam_atki_sayisi', 'TOPLAM ATKI SAYISI'], ['sacak_atki_sayisi', 'SAÇAK ATKI SAYISI']],
        [['olculen_ham_ebat', 'ÖLÇÜLEN HAM EBAT'], ['ham_gram_m2', 'HAM GR/M²'], ['ham_gram_mtul', 'HAM GR/MTÜL']],
        [['olculen_mamul_ebat', 'ÖLÇÜLEN MAMÜL EBAT'], ['mamul_gram_m2', 'MAMÜL GR/M²'], ['mamul_gram_mtul', 'MAMÜL GR/MTÜL']],
        [['tahar_raporu', 'TAHAR RAPORU'], null, null],
    ];
    const MAMUL_TALIMAT_KIRMIZI = new Set([
        'tezgah_desen_no', 'olculen_ham_ebat', 'ham_gram_m2', 'ham_gram_mtul',
        'olculen_mamul_ebat', 'mamul_gram_m2', 'mamul_gram_mtul'
    ]);

    function stokKartDokumaAlanlariOku(i) {
        const meta = mamulEkAlanMetaDecode(i?.notlar || '');
        const varyantlar = Array.isArray(meta.varyantlar) ? meta.varyantlar : [];
        const renk = String(i?.renk || '').trim() || mamulVaryantRenkEtiket({ atki: [] });
        const kod = String(i?.desen_kodu || i?.stok_kodu || '').trim();
        const bak = kod ? depoMamulBakiyeHesapla(kod) : null;
        const bakTxt = bak ? ((parseInt(bak.adet, 10) || 0) + ' ad') : '—';
        return {
            stok_kodu: kod,
            tarih: i?.created_at ? new Date(i.created_at).toLocaleDateString('tr-TR') : '',
            musteri: String(i?.firma || meta.musteri || '').trim(),
            musteri_siparis_no: String(meta.musteri_siparis_no || '').trim(),
            tezgah_no: String(meta.tezgah_no || (typeof numuneNotTagOku === 'function' ? numuneNotTagOku(i?.notlar, 'TEZGAH_NO') : '') || '').trim(),
            kumas_cinsi: String(i?.kumas_cinsi || '').trim(),
            istenen_mamul_ebat: String(meta.istenen_mamul_ebat || '').trim(),
            tezgah_desen_no: String(meta.tezgah_desen_no || '').trim(),
            cozgu_iplik_no: String(meta.cozgu_iplik_no || i?.cozgu_no || '').trim(),
            atki_iplik_no: String(meta.atki_iplik_no || '').trim(),
            cozgu_iplik_markasi: String(meta.cozgu_iplik_markasi || i?.cozgu_cinsi || '').trim(),
            atki_iplik_markasi: String(meta.atki_iplik_markasi || '').trim(),
            tarak_no: String(i?.tarak_no || '').trim(),
            tarak_eni: String(i?.tarak_eni || '').trim(),
            cozgu_tel_sayisi: String(meta.cozgu_tel_sayisi || '').trim(),
            cozgu_sikligi: String(meta.cozgu_sikligi || '').trim(),
            atki_sikligi: String(i?.atki_sikligi || '').trim(),
            toplam_atki_sayisi: String(meta.toplam_atki_sayisi || '').trim(),
            sacak_atki_sayisi: String(meta.sacak_atki_sayisi || '').trim(),
            desen_adi: String(i?.desen_adi || '').trim(),
            desen_urun: typeof stokKartListeAdMetni === 'function' ? stokKartListeAdMetni(i, '—') : String(i?.urun_adi || i?.desen_adi || '').trim(),
            olculen_ham_ebat: String(meta.olculen_ham_ebat || meta.ham_ebat || (i?.ham_en && i?.ham_boy ? `${i.ham_en}*${i.ham_boy}` : '')).trim(),
            olculen_mamul_ebat: String(meta.olculen_mamul_ebat || (i?.mamul_en && i?.mamul_boy ? `${i.mamul_en}*${i.mamul_boy}` : '')).trim(),
            ham_gram_mtul: String(meta.ham_gram_mtul ?? i?.ham_gramaj ?? '').trim(),
            ham_gram_m2: String(meta.ham_gram_m2 ?? i?.ham_gsm ?? '').trim(),
            mamul_gram_mtul: String(meta.mamul_gram_mtul ?? i?.mamul_gramaj ?? '').trim(),
            mamul_gram_m2: String(meta.mamul_gram_m2 ?? i?.mamul_gsm ?? '').trim(),
            tahar_raporu: String(meta.tahar_raporu || '').trim(),
            renk_varyant: renk || (varyantlar.length ? `${varyantlar.length} varyant` : ''),
            varyant_ozet: varyantlar.map((v, vi) => mamulVaryantRenkEtiket(v) || `V${vi + 1}`).filter(Boolean).join(' · '),
            depo_bakiye: bakTxt
        };
    }
    window.stokKartDokumaAlanlariOku = stokKartDokumaAlanlariOku;

    function mamulDokumaTalimatDetayPanelHtml(record, opts) {
        const o = opts || {};
        const d = stokKartDokumaAlanlariOku(record);
        const kod = String(record?.desen_kodu || d.stok_kodu || '').trim();
        const esc = (v) => typeof pdfEsc === 'function' ? pdfEsc(v) : String(v ?? '');

        const satirlar = MAMUL_TALIMAT_SATIRLARI.map(row => {
            const hucreler = row.map(pair => {
                if (!pair) return '<td class="mamul-talimat-tablo__lbl mamul-talimat-tablo__lbl--bos"></td><td class="mamul-talimat-tablo__val mamul-talimat-tablo__val--bos"></td>';
                const [key, label] = pair;
                const v = String(d[key] ?? '').trim();
                const valCls = MAMUL_TALIMAT_KIRMIZI.has(key) && v ? ' mamul-talimat-tablo__val--kirmizi' : (!v ? ' mamul-talimat-tablo__val--bos' : '');
                return `<td class="mamul-talimat-tablo__lbl">${label}</td>
                    <td class="mamul-talimat-tablo__val${valCls}" title="${esc(v || '—')}">${esc(v || '—')}</td>`;
            }).join('');
            return `<tr>${hucreler}</tr>`;
        }).join('');

        const foto = record?.fotograf && String(record.fotograf).trim().startsWith('data:image/')
            ? `<div class="mamul-talimat-sheet__foto">
                <div class="mamul-talimat-sheet__foto-baslik">KUMAŞ ÖRNEĞİ</div>
                <img src="${record.fotograf}" alt="Kumaş örneği">
            </div>` : '';

        const aciklama = typeof kumasNotlarTemizle === 'function' ? kumasNotlarTemizle(record?.notlar || '') : '';
        const notHtml = aciklama
            ? `<div class="mamul-talimat-sheet__notlar"><span class="mamul-talimat-tablo__lbl">NOTLAR</span><span>${esc(aciklama)}</span></div>`
            : '';

        return `<div class="mamul-talimat-sheet">
            <div class="mamul-talimat-sheet__baslik">${o.baslik || 'SİMTEKS TEKSTİL DOKUMA TALİMAT KARTI'}</div>
            <div class="mamul-talimat-sheet__alt-baslik">
                <span>Stok kodu: <strong>${esc(kod)}</strong></span>
                <span>Tarih: <strong>${esc(d.tarih || '—')}</strong></span>
            </div>
            <div class="mamul-talimat-sheet__govde">
                <div class="mamul-talimat-sheet__tablo-wrap">
                    <table class="mamul-talimat-tablo"><tbody>${satirlar}</tbody></table>
                    ${notHtml}
                </div>
                ${foto}
            </div>
        </div>`;
    }
    window.mamulDokumaTalimatDetayPanelHtml = mamulDokumaTalimatDetayPanelHtml;

    function mamulIdxInCurrentData(record) {
        if (!record) return -1;
        const list = (typeof currentData !== 'undefined' && Array.isArray(currentData)) ? currentData : [];
        if (record.id != null && record.id !== '') {
            const byId = list.findIndex(r => String(r.id) === String(record.id));
            if (byId >= 0) return byId;
        }
        const kod = String(record.desen_kodu || record.stok_kodu || '').trim().toUpperCase();
        if (!kod) return -1;
        return list.findIndex(r => String(r.desen_kodu || r.stok_kodu || '').trim().toUpperCase() === kod);
    }
    window.mamulIdxInCurrentData = mamulIdxInCurrentData;

    window.mamulShowDetailByRecordId = function (idOrKod) {
        const key = String(idOrKod || '').trim();
        if (!key) return;
        const list = (typeof currentData !== 'undefined' && Array.isArray(currentData)) ? currentData : [];
        let idx = list.findIndex(r => String(r.id) === key);
        if (idx < 0) {
            const kod = key.toUpperCase();
            idx = list.findIndex(r => String(r.desen_kodu || r.stok_kodu || '').trim().toUpperCase() === kod);
        }
        if (idx < 0) {
            if (typeof erpToast === 'function') erpToast('Bu varyant listede ayrı satır olarak yok; ana kartta kalın.', 'warn', 3500);
            return;
        }
        if (typeof showDetail === 'function') showDetail(idx);
    };

    function mamulRenkVaryantOzetHtml(grup) {
        const varyantlar = mamulListeVaryantVerisiOlustur(grup);
        const esc = (v) => typeof pdfEsc === 'function' ? pdfEsc(v) : String(v ?? '');
        const anaKod = String(grup?.anaKod || '').trim().toUpperCase();
        const anaAttr = typeof erpAttr === 'function' ? erpAttr(anaKod) : anaKod.replace(/'/g, "\\'");
        if (!varyantlar.length) {
            return `<div class="mamul-renk-varyant-ozet mamul-renk-varyant-ozet--bos">
                <div class="mamul-varyant-baslik">Renk Varyantları</div>
                <div class="mamul-renk-varyant-ozet__bos">Henüz renk varyantı yok — Excel import veya kart düzenleme ile ekleyin.</div>
            </div>`;
        }
        const chips = varyantlar.map(v => {
            const renk = v.renk_etiket || ('Varyant ' + v.no);
            return `<div class="mamul-renk-chip" title="${esc(v.sku)}">
                <span class="mamul-renk-chip__no">${v.no}</span>
                <input type="text" class="pro-input mamul-renk-chip__renk-inp" value="${esc(renk)}"
                    placeholder="Renk adı…"
                    onmousedown="event.stopPropagation()"
                    onclick="event.stopPropagation()"
                    onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"
                    onchange="mamulVaryantRenkAdiKaydet('${anaAttr}', ${v.no}, this.value)">
                <span class="mamul-renk-chip__kod">${esc(v.sku)}</span>
                <span class="mamul-renk-chip__stok">${esc(v.stok)}</span>
            </div>`;
        }).join('');
        return `<div class="mamul-renk-varyant-ozet">
            <div class="mamul-varyant-baslik">Renk Varyantları <span class="mamul-varyant-sayi">(${varyantlar.length})</span>
                <span style="font-size:8px;color:var(--text3);font-weight:500;margin-left:8px;text-transform:none;letter-spacing:0">— renk adını kutuya yazıp Enter / dışarı tıklayın</span>
            </div>
            <div class="mamul-renk-chips">${chips}</div>
        </div>`;
    }
    window.mamulRenkVaryantOzetHtml = mamulRenkVaryantOzetHtml;

    function mamulVaryantDoluMu(v) {
        if (!v) return false;
        if (String(v.renk_etiket || '').trim()) return true;
        return (Array.isArray(v.atki) ? v.atki : []).some(a =>
            String(a?.iplik_no || '').trim() || String(a?.renk || '').trim() || String(a?.atki_sayisi || '').trim()
        );
    }

    function mamulAtkiRenkleriParse(raw) {
        const s = String(raw || '').trim();
        if (!s) return [];
        return s.split(' | ').map(part => {
            const p = String(part || '').trim();
            const m = p.match(/^A(\d+)\s*:\s*(.+?)\s*\/\s*(.+?)\s*\/\s*(.+)$/i);
            if (m) {
                const iplik = m[2].trim();
                const renk = m[3].trim();
                const sayi = m[4].trim();
                if (iplik === '-' && renk === '-' && sayi === '-') return null;
                return {
                    iplik_no: iplik === '-' ? '' : iplik,
                    renk: renk === '-' ? '' : renk,
                    atki_sayisi: sayi === '-' ? '' : sayi
                };
            }
            if (typeof parseAtkiRenkSatiri === 'function') {
                const pr = parseAtkiRenkSatiri(p.replace(/^A\d+\s*:\s*/i, ''));
                if (!pr.no && !pr.cins && !pr.renk && !pr.sayi) return null;
                return { iplik_no: pr.no || pr.cins || '', renk: pr.renk || '', atki_sayisi: pr.sayi || '' };
            }
            return null;
        }).filter(Boolean);
    }

    function mamulAtkiSatirlariPad(atki, maxRows) {
        const n = Math.max(3, parseInt(maxRows, 10) || 6);
        const arr = (Array.isArray(atki) ? atki : []).slice(0, n).map(a => ({
            iplik_no: String(a?.iplik_no || '').trim(),
            renk: String(a?.renk || '').trim(),
            atki_sayisi: String(a?.atki_sayisi || '').trim()
        }));
        while (arr.length < n) arr.push({ iplik_no: '', renk: '', atki_sayisi: '' });
        return arr;
    }

    function mamulListeVaryantVerisiOlustur(grup) {
        const parent = grup?.parent?.record;
        const meta = mamulEkAlanMetaDecode(parent?.notlar || '');
        const metaVaryantlar = (Array.isArray(meta.varyantlar) ? meta.varyantlar : []).filter(mamulVaryantDoluMu);
        const children = Array.isArray(grup?.children) ? grup.children : [];

        if (children.length) {
            return children.map((ch, i) => {
                const metaV = metaVaryantlar[ch.varyantNo - 1] || metaVaryantlar[i] || {};
                const childRec = ch.record || {};
                let atki = Array.isArray(metaV.atki) ? metaV.atki : [];
                if (!atki.some(a => a?.iplik_no || a?.renk || a?.atki_sayisi) && childRec.atki_renkleri) {
                    atki = mamulAtkiRenkleriParse(childRec.atki_renkleri);
                }
                const renkEtiket = mamulVaryantRenkEtiket({ ...metaV, atki }) || String(childRec.renk || '').trim().toUpperCase();
                const vNo = ch.varyantNo || (i + 1);
                const sku = mamulVaryantKodFormatla(grup.anaKod, vNo);
                const gercekKod = String(childRec.desen_kodu || '').trim().toUpperCase();
                return {
                    no: vNo,
                    sku: gercekKod && gercekKod !== sku ? gercekKod : sku,
                    renk_etiket: renkEtiket,
                    atki: mamulAtkiSatirlariPad(atki, 6),
                    stok: stokKartDokumaAlanlariOku(childRec).depo_bakiye,
                    recordId: childRec.id || null,
                    idx: mamulIdxInCurrentData(childRec)
                };
            });
        }

        if (metaVaryantlar.length) {
            return metaVaryantlar.map((v, i) => ({
                no: i + 1,
                sku: mamulVaryantKodFormatla(grup.anaKod, i + 1),
                renk_etiket: mamulVaryantRenkEtiket(v),
                atki: mamulAtkiSatirlariPad(v.atki, 6),
                stok: '—',
                recordId: grup.parent?.record?.id || null,
                idx: mamulIdxInCurrentData(grup.parent?.record) 
            }));
        }

        const d = stokKartDokumaAlanlariOku(parent);
        if (d.renk_varyant) {
            return [{
                no: 1,
                sku: grup.anaKod,
                renk_etiket: d.renk_varyant,
                atki: mamulAtkiSatirlariPad([]),
                stok: d.depo_bakiye,
                recordId: parent?.id || null,
                idx: mamulIdxInCurrentData(parent)
            }];
        }
        return [];
    }
    window.mamulListeVaryantVerisiOlustur = mamulListeVaryantVerisiOlustur;

    function mamulAtkiExcelHucre(deger) {
        const s = String(deger ?? '').trim();
        return s ? (typeof pdfEsc === 'function' ? pdfEsc(s) : s) : '<span class="mamul-atki-excel-tablo__bos">—</span>';
    }

    function mamulAtkiVaryantExcelListeHtml(grup) {
        const varyantlar = mamulListeVaryantVerisiOlustur(grup);
        if (!varyantlar.length) {
            return `<div class="mamul-atki-excel-wrap mamul-atki-excel-wrap--bos">
                <div class="mamul-varyant-baslik">Atkı Varyant Tablosu</div>
                <div class="mamul-renk-varyant-ozet__bos">Atkı detayları henüz girilmemiş.</div>
            </div>`;
        }

        const varyantBaslik = varyantlar.map(v => {
            const renk = v.renk_etiket ? ` — ${typeof pdfEsc === 'function' ? pdfEsc(v.renk_etiket) : v.renk_etiket}` : '';
            return `<th colspan="3" class="mamul-atki-excel-tablo__varyant-baslik">
                ${v.no}. VARYANT${renk}
                <span class="mamul-atki-excel-tablo__sku">${typeof pdfEsc === 'function' ? pdfEsc(v.sku) : v.sku}</span>
            </th>`;
        }).join('');

        const altBaslik = varyantlar.map(() =>
            `<th>İPLİK NO</th><th>RENK NO — RENK</th><th>ATKI SAYISI</th>`
        ).join('');

        const atkiSatirlari = [1, 2, 3, 4, 5, 6].map(ai => {
            const hucreler = varyantlar.map(v => {
                const a = v.atki[ai - 1] || {};
                return `<td>${mamulAtkiExcelHucre(a.iplik_no)}</td>
                    <td>${mamulAtkiExcelHucre(a.renk)}</td>
                    <td>${mamulAtkiExcelHucre(a.atki_sayisi)}</td>`;
            }).join('');
            const rowHasData = varyantlar.some(v => {
                const a = v.atki[ai - 1] || {};
                return a.iplik_no || a.renk || a.atki_sayisi;
            });
            if (!rowHasData && ai > 3) return '';
            return `<tr><td>ATKI ${ai}</td>${hucreler}</tr>`;
        }).join('');

    const stokSatir = varyantlar.map(v => {
        const key = v.recordId != null ? String(v.recordId) : String(v.sku || '');
        const click = key
            ? ` class="mamul-atki-excel-tablo__stok mamul-atki-excel-tablo__click" onclick="event.stopPropagation();mamulShowDetailByRecordId('${typeof erpAttr === 'function' ? erpAttr(key) : key.replace(/'/g, "\\'")}')" title="Detay"`
            : ' class="mamul-atki-excel-tablo__stok"';
        return `<td colspan="3"${click}>${typeof pdfEsc === 'function' ? pdfEsc(v.stok) : v.stok}</td>`;
    }).join('');

        return `<div class="mamul-atki-excel-wrap">
            <div class="mamul-varyant-baslik">Atkı Varyantları</div>
            <table class="mamul-atki-excel-tablo">
                <thead>
                    <tr><th>Atkı</th>${varyantBaslik}</tr>
                    <tr><th></th>${altBaslik}</tr>
                </thead>
                <tbody>
                    ${atkiSatirlari}
                    <tr><td>STOK</td>${stokSatir}</tr>
                </tbody>
            </table>
        </div>`;
    }
    window.mamulAtkiVaryantExcelListeHtml = mamulAtkiVaryantExcelListeHtml;

    function mamulUretimKartiGrupBul(kayit) {
        const kod = String(kayit?.desen_kodu || kayit?.stok_kodu || '').trim().toUpperCase();
        const anaKod = mamulAnaKodBul(kod) || kod;
        if (!anaKod) return null;
        const lib = dataCache.kumas_kutuphanesi || [];
        const records = lib.filter(k => {
            const k2 = String(k.desen_kodu || k.stok_kodu || '').trim().toUpperCase();
            return k2 === anaKod || mamulAnaKodBul(k2) === anaKod;
        });
        if (!records.length && kayit) records.push(kayit);
        const grup = mamulKartListeGruplariOlustur(records).find(g => g.anaKod === anaKod) || null;
        if (grup) {
            if (grup.parent?.record) grup.parent.idx = mamulIdxInCurrentData(grup.parent.record);
            (grup.children || []).forEach(ch => {
                ch.idx = mamulIdxInCurrentData(ch.record);
            });
        }
        return grup;
    }
    window.mamulUretimKartiGrupBul = mamulUretimKartiGrupBul;

    function mamulUretimKartiAksiyonBarHtml(anaKod) {
        const kod = typeof erpAttr === 'function' ? erpAttr(anaKod) : anaKod;
        return `<div class="mamul-kart-aksiyon-bar">
            <button type="button" onclick="event.stopPropagation();editMamulKartFromListe('${kod}')" class="pill pill-blue" style="cursor:pointer;border:none;font-size:9px;padding:5px 12px">✏️ Kartı Düzenle</button>
        </div>`;
    }

    function renderMamulKartDetayModalHtml(kayit, idx) {
        const grup = mamulUretimKartiGrupBul(kayit);
        const parent = grup?.parent?.record || kayit || {};
        const anaKod = grup?.anaKod || mamulAnaKodBul(parent?.desen_kodu) || String(parent?.desen_kodu || '').trim();
        let html = mamulDokumaTalimatDetayPanelHtml(parent, { baslik: 'SİMTEKS TEKSTİL DOKUMA TALİMAT KARTI' });
        if (grup) {
            html += mamulRenkVaryantOzetHtml(grup);
            html += mamulAtkiVaryantExcelListeHtml(grup);
        }
        html += `<div style="padding:8px 14px 12px">${typeof renderKayitGecmisDetailsBlock === 'function' ? renderKayitGecmisDetailsBlock(parent.islem_gecmisi, '') : ''}</div>`;
        const editIdx = typeof idx === 'number' ? idx : (grup?.parent?.idx ?? 0);
        html += `<div style="padding:0 14px 14px;display:flex;flex-wrap:wrap;gap:8px">
            <button type="button" onclick="editMamulKartFromListe('${typeof erpAttr === 'function' ? erpAttr(anaKod) : anaKod}')" class="btn-pro btn-primary-pro" style="flex:1;justify-content:center;padding:10px">✏ Dokuma talimat kartını düzenle</button>
            <button type="button" onclick="startEditingFromArchive(${editIdx})" class="btn-pro" style="padding:10px 14px">Arşiv düzenle</button>
        </div>`;
        return html;
    }
    window.renderMamulKartDetayModalHtml = renderMamulKartDetayModalHtml;

    window.editMamulKartFromListe = function (idxOrKod) {
        if (typeof idxOrKod === 'number') {
            if (typeof startEditingFromArchive === 'function') startEditingFromArchive(idxOrKod);
            return;
        }
        const kod = String(idxOrKod || '').trim().toUpperCase();
        const ana = mamulAnaKodBul(kod) || kod;
        const record = mamulAnaKayitBul(ana);
        if (!record) {
            if (typeof erpToast === 'function') erpToast('Düzenlenecek mamül kartı bulunamadı: ' + ana, 'warn');
            return;
        }
        const idx = (currentData || []).findIndex(r => String(r.id) === String(record.id));
        if (idx >= 0 && typeof startEditingFromArchive === 'function') startEditingFromArchive(idx);
        else if (typeof startEditingFromArchive === 'function') {
            selectedIndex = (currentData || []).findIndex(r => String(r.desen_kodu || '').trim().toUpperCase() === ana);
            if (selectedIndex >= 0) startEditingFromArchive(selectedIndex);
            else if (typeof erpToast === 'function') erpToast('Listede kayıt bulunamadı — arşiv sekmesini yenileyin.', 'warn');
        }
    };

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
        const _mamulBakTxt = _mamulBak ? ((parseInt(_mamulBak.adet, 10) || 0) + ' ad') : '0 ad';
        const _mamulAd = _mamulBak ? (parseInt(_mamulBak.adet, 10) || 0) : 0;
        const _mamulBakClr = _mamulAd > 0 ? 'var(--emerald-c)' : (_mamulAd < 0 ? 'var(--rose-c)' : 'var(--text3)');
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
            if (!grup.children.length && grup.parent?.record) {
                mamulAnaVaryantKayitlariTopla(grup.parent.record).forEach((rec, i) => {
                    grup.children.push({
                        record: rec,
                        idx: grup.parent.idx,
                        varyantNo: mamulVaryantNoBul(rec.desen_kodu) || (i + 1),
                        synthetic: !!rec._mamulVaryantSentez
                    });
                });
            }
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
        const varyantSayisi = mamulListeVaryantVerisiOlustur(grup).length;
        const toplamStok = mamulStokBakiyeToplamText(
            (grup.children.length ? grup.children.map(x => x.record?.desen_kodu) : [grup.anaKod]).filter(Boolean)
        );
        const renkOzet = varyantSayisi ? `${varyantSayisi} renk varyantı` : (d.renk_varyant || '—');
        const anaEsc = typeof erpAttr === 'function' ? erpAttr(grup.anaKod) : grup.anaKod;
        const row = `<div class="mamul-stok-liste-grid mamul-stok-liste-grid--row${expanded ? ' mamul-stok-liste-grid--expanded' : ''}" onclick="if(!event.target.closest('button'))showDetail(${idx})" title="Detaylı üretim kartını aç">
            <button type="button" class="mamul-stok-grid__expand" onclick="mamulKartListeToggle('${anaEsc}', event)" title="Renk / atkı varyantlarını aç-kapat">${expanded ? '▼' : '▶'}</button>
            <span class="mamul-stok-liste-grid__cell mamul-stok-liste-grid__cell--kod">${typeof pdfEsc === 'function' ? pdfEsc(grup.anaKod) : grup.anaKod}</span>
            <span class="mamul-stok-liste-grid__cell">${typeof pdfEsc === 'function' ? pdfEsc(d.tarih || '—') : (d.tarih || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${typeof pdfEsc === 'function' ? pdfEsc(d.musteri || '—') : (d.musteri || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${typeof pdfEsc === 'function' ? pdfEsc(d.kumas_cinsi || '—') : (d.kumas_cinsi || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${typeof pdfEsc === 'function' ? pdfEsc(d.desen_adi || '—') : (d.desen_adi || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${typeof pdfEsc === 'function' ? pdfEsc(d.istenen_mamul_ebat || '—') : (d.istenen_mamul_ebat || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${typeof pdfEsc === 'function' ? pdfEsc(renkOzet) : renkOzet}</span>
            <span class="mamul-stok-liste-grid__cell mamul-stok-liste-grid__cell--stok">${typeof pdfEsc === 'function' ? pdfEsc(toplamStok) : toplamStok}</span>
            <span class="mamul-stok-liste-grid__cell">
                <button type="button" class="liste-gecmis-btn" onclick="event.stopPropagation();showDetailOpenGecmis(${idx})">Geçmiş</button>
            </span>
        </div>`;
        if (!expanded) return `<div class="mamul-stok-grup">${row}</div>`;
        const renkOzetPanel = mamulRenkVaryantOzetHtml(grup);
        const varyantlar = mamulAtkiVaryantExcelListeHtml(grup);
        return `<div class="mamul-stok-grup">${row}<div class="mamul-stok-alt-panel mamul-stok-alt-panel--varyant" onclick="event.stopPropagation()">${renkOzetPanel}${varyantlar}</div></div>`;
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
        const ana = String(grup?.anaKod || '').toLowerCase();
        const anaNorm = ana.replace(/-/g, '');
        const sNorm = s.replace(/-/g, '');
        if (ana.includes(s) || anaNorm.includes(sNorm)) return true;
        const parent = grup?.parent?.record;
        if (parent) {
            const parentBlob = typeof mamulDepoAramaMetni === 'function'
                ? mamulDepoAramaMetni(parent, parent)
                : siparisMamulAramaMetni(parent, parent);
            if (parentBlob.includes(s) || parentBlob.replace(/-/g, '').includes(sNorm)) return true;
        }
        return (grup.children || []).some(ch => {
            const rec = ch.record;
            const blob = typeof mamulDepoAramaMetni === 'function'
                ? mamulDepoAramaMetni(rec, parent)
                : siparisMamulAramaMetni(rec, parent);
            return blob.includes(s) || blob.replace(/-/g, '').includes(sNorm);
        });
    }

    function siparisMamulAramaMetni(kart, anaKart) {
        if (typeof mamulDepoAramaMetni === 'function') return mamulDepoAramaMetni(kart, anaKart);
        const k = kart || {};
        const a = anaKart || {};
        return [
            k.desen_kodu, k.desen_adi, k.urun_adi, k.firma, k.kumas_cinsi, k.renk,
            siparisMamulEbatOku(k),
            a.desen_adi, a.urun_adi, a.firma, a.kumas_cinsi
        ].map(x => String(x || '').toLowerCase()).join(' ');
    }

    function siparisMamulKaynakOku(k) {
        if (!k) return { self: null, parent: null, vNo: 0, anaKod: '' };
        const vNo = mamulVaryantNoBul(k.desen_kodu);
        const anaKod = mamulAnaKodBul(k.desen_kodu);
        const parent = (vNo > 0 && anaKod) ? mamulAnaKayitBul(anaKod) : null;
        return { self: k, parent, vNo, anaKod };
    }

    function siparisMamulEbatOku(k) {
        if (!k) return '';
        const { self, parent } = siparisMamulKaynakOku(k);
        const hedef = self || k;
        const metaKaynak = parent || hedef;
        const meta = mamulEkAlanMetaDecode(metaKaynak?.notlar || '');
        if (meta.istenen_mamul_ebat) return meta.istenen_mamul_ebat;
        if (meta.olculen_mamul_ebat) return meta.olculen_mamul_ebat;
        if (hedef.mamul_en && hedef.mamul_boy) return `${hedef.mamul_en}*${hedef.mamul_boy}`;
        if (hedef.ham_en && hedef.ham_boy) return `${hedef.ham_en}*${hedef.ham_boy}`;
        if (parent?.mamul_en && parent?.mamul_boy) return `${parent.mamul_en}*${parent.mamul_boy}`;
        return '';
    }

    function siparisMamulDesenOku(k) {
        const { self, parent } = siparisMamulKaynakOku(k);
        return String(self?.desen_adi || parent?.desen_adi || '').trim().toUpperCase();
    }

    function siparisMamulUrunAdiOku(k) {
        const { self, parent } = siparisMamulKaynakOku(k);
        const urun = String(self?.urun_adi || parent?.urun_adi || '').trim();
        if (urun) return urun.toUpperCase();
        return String(self?.kumas_cinsi || parent?.kumas_cinsi || '').trim().toUpperCase();
    }

    function siparisMamulRenkOku(k) {
        if (!k) return '';
        let renk = String(k.renk || '').trim();
        if (renk) return renk.toUpperCase();
        const { self, parent, vNo } = siparisMamulKaynakOku(k);
        const hedef = self || k;
        const metaKaynak = parent || hedef;
        const meta = mamulEkAlanMetaDecode(metaKaynak?.notlar || '');
        const varyantlar = (Array.isArray(meta.varyantlar) ? meta.varyantlar : []).filter(mamulVaryantDoluMu);
        if (vNo > 0 && varyantlar[vNo - 1]) {
            renk = mamulVaryantRenkEtiket(varyantlar[vNo - 1]);
            if (renk) return renk.toUpperCase();
        }
        if (hedef.atki_renkleri) {
            const atki = mamulAtkiRenkleriParse(hedef.atki_renkleri);
            renk = atki.map(a => a.renk).filter(Boolean).slice(-1)[0] || '';
            if (renk) return renk.toUpperCase();
        }
        if (vNo > 0) return `V${String(vNo).padStart(2, '0')}`;
        return '';
    }

    function siparisMamulAnaVaryantliMi(k) {
        const ana = String(mamulAnaKodBul(k?.desen_kodu) || '').toUpperCase();
        if (!ana) return false;
        if (typeof mamulAnaVaryantVarMi === 'function') {
            const anaKayit = mamulAnaKayitBul(ana) || (mamulVaryantNoBul(k?.desen_kodu) <= 0 ? k : null);
            if (mamulAnaVaryantVarMi(anaKayit || ana)) return true;
        }
        return siparisMamulKartlariTopla().some(x => {
            const kod = String(x.desen_kodu || '').trim().toUpperCase();
            return mamulVaryantNoBul(kod) > 0 && mamulAnaKodBul(kod) === ana;
        });
    }
    window.siparisMamulAnaVaryantliMi = siparisMamulAnaVaryantliMi;

    function siparisMamulKodGecerliMi(kod) {
        const k = String(kod || '').trim().toUpperCase();
        if (!k) return { ok: false, msg: 'Mamül stok kodu seçin.' };
        const kart = (typeof mamulKartBul === 'function' ? mamulKartBul(k) : null)
            || siparisMamulKartlariTopla().find(x =>
                String(x.desen_kodu || '').trim().toUpperCase() === k
            );
        if (!kart) return { ok: false, msg: `"${k}" mamül kartı bulunamadı.` };
        return { ok: true };
    }
    window.siparisMamulKodGecerliMi = siparisMamulKodGecerliMi;

    window.siparisKalemMamulDoldur = function (kalemNo, k, opts) {
        opts = opts || {};
        if (!k || !kalemNo) return;
        const mv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
        const anaSecim = opts.anaSecim != null ? !!opts.anaSecim : (mamulVaryantNoBul(k.desen_kodu) <= 0);
        mv(`sk-kod-${kalemNo}`, k.desen_kodu || '');
        mv(`sk-desen-${kalemNo}`, siparisMamulDesenOku(k));
        mv(`sk-ad-${kalemNo}`, siparisMamulUrunAdiOku(k));
        mv(`sk-ebat-${kalemNo}`, String(siparisMamulEbatOku(k) || '').trim().replace(/\s+/g, ''));
        if (anaSecim && siparisMamulAnaVaryantliMi(k)) mv(`sk-renk-${kalemNo}`, '');
        else mv(`sk-renk-${kalemNo}`, siparisMamulRenkOku(k));
        if (typeof updateSiparisPreview === 'function') updateSiparisPreview();
    };

    /** Tek sipariş kalem nesnesini güncel mamül kart alanlarıyla güncelle (miktar/birim korunur) */
    function siparisKalemObjesiniMamulKarttanGuncelle(kalem, kart) {
        if (!kalem || !kart) return { kalem, changed: false };
        const next = { ...kalem };
        let changed = false;
        const set = (key, val) => {
            const v = String(val ?? '').trim();
            if (!v) return;
            if (String(next[key] || '').trim() !== v) {
                next[key] = v;
                changed = true;
            }
        };
        set('kod', kart.desen_kodu || next.kod);
        set('desen', siparisMamulDesenOku(kart));
        set('ad', siparisMamulUrunAdiOku(kart));
        set('ebat', String(siparisMamulEbatOku(kart) || '').trim().replace(/\s+/g, ''));
        const vNo = mamulVaryantNoBul(kart.desen_kodu);
        if (vNo > 0 || !siparisMamulAnaVaryantliMi(kart)) {
            set('renk', siparisMamulRenkOku(kart));
        }
        return { kalem: next, changed };
    }
    window.siparisKalemObjesiniMamulKarttanGuncelle = siparisKalemObjesiniMamulKarttanGuncelle;

    function siparisKalemMamulKartBul(kod) {
        const k = String(kod || '').trim().toUpperCase();
        if (!k) return null;
        return (typeof mamulKartBul === 'function' ? mamulKartBul(k) : null)
            || siparisMamulKartlariTopla().find(x => String(x.desen_kodu || '').trim().toUpperCase() === k)
            || null;
    }

    /** Açık sipariş formundaki kalemleri mamül karttan yenile */
    window.siparisFormKalemleriniMamulKarttanYenile = function (opts) {
        opts = opts || {};
        let n = 0;
        const max = typeof siparisKalemCount === 'number' ? siparisKalemCount : 40;
        for (let j = 1; j <= max; j++) {
            const kodEl = document.getElementById(`sk-kod-${j}`);
            if (!kodEl) continue;
            const kod = String(kodEl.value || '').trim();
            if (!kod) continue;
            const kart = siparisKalemMamulKartBul(kod);
            if (!kart) continue;
            const onceki = {
                desen: document.getElementById(`sk-desen-${j}`)?.value || '',
                ad: document.getElementById(`sk-ad-${j}`)?.value || '',
                ebat: document.getElementById(`sk-ebat-${j}`)?.value || '',
                renk: document.getElementById(`sk-renk-${j}`)?.value || ''
            };
            siparisKalemMamulDoldur(j, kart, { anaSecim: mamulVaryantNoBul(kart.desen_kodu) <= 0 });
            const sonra = {
                desen: document.getElementById(`sk-desen-${j}`)?.value || '',
                ad: document.getElementById(`sk-ad-${j}`)?.value || '',
                ebat: document.getElementById(`sk-ebat-${j}`)?.value || '',
                renk: document.getElementById(`sk-renk-${j}`)?.value || ''
            };
            if (onceki.desen !== sonra.desen || onceki.ad !== sonra.ad || onceki.ebat !== sonra.ebat || onceki.renk !== sonra.renk) n++;
        }
        if (typeof updateSiparisPreview === 'function') updateSiparisPreview();
        if (!opts.silent && typeof erpToast === 'function') {
            erpToast(n ? `${n} ürün mamül karttan güncellendi.` : 'Güncellenecek fark yok (kartlar zaten aynı).', n ? 'success' : 'info', 3500);
        }
        return n;
    };

    window.siparisKalemMamulKarttanYenile = function (kalemNo) {
        const n = parseInt(kalemNo, 10);
        if (!n) return;
        const kod = String(document.getElementById(`sk-kod-${n}`)?.value || '').trim();
        if (!kod) {
            if (typeof erpToast === 'function') erpToast('Önce mamül stok kodu seçin.', 'warn');
            return;
        }
        const kart = siparisKalemMamulKartBul(kod);
        if (!kart) {
            if (typeof erpToast === 'function') erpToast('Mamül kartı bulunamadı: ' + kod, 'warn');
            return;
        }
        siparisKalemMamulDoldur(n, kart, { anaSecim: mamulVaryantNoBul(kart.desen_kodu) <= 0 });
        if (typeof erpToast === 'function') erpToast('Ürün mamül karttan yenilendi.', 'success', 2500);
    };

    /**
     * Mamül kart kaydından sonra: bu koda bağlı sipariş kalemlerini DB'de güncelle.
     * Miktar / birim / renk kodları korunur; desen, ad, ebat, (varyant) renk yenilenir.
     */
    async function siparisleriMamulKoddanSenkronize(desenKodu) {
        const hedef = String(desenKodu || '').trim().toUpperCase();
        const ana = (typeof mamulAnaKodBul === 'function' ? mamulAnaKodBul(hedef) : null) || hedef;
        if (!ana || typeof sb === 'undefined' || !sb) return { updated: 0, kalem: 0 };
        const lib = dataCache.kumas_kutuphanesi || [];
        const aile = lib.filter(k => {
            const kod = String(k.desen_kodu || '').trim().toUpperCase();
            return kod === ana || (typeof mamulAnaKodBul === 'function' && mamulAnaKodBul(kod) === ana);
        });
        const byKod = new Map();
        aile.forEach(k => byKod.set(String(k.desen_kodu || '').trim().toUpperCase(), k));

        let siparisGuncellenen = 0;
        let kalemGuncellenen = 0;
        const liste = Array.isArray(dataCache.siparisler) ? dataCache.siparisler : [];
        const anaU = String(ana).toUpperCase();
        // Hızlı ön filtre: cins metninde ana kod geçmeyen siparişleri atla
        const adaylar = liste.filter(sip => {
            const raw = typeof sip.cins === 'string' ? sip.cins : JSON.stringify(sip.cins || '');
            return raw.toUpperCase().includes(anaU);
        });
        const yazilacaklar = [];
        for (const sip of adaylar) {
            let kalemler = [];
            try {
                kalemler = typeof sip.cins === 'string' ? JSON.parse(sip.cins) : (sip.cins || []);
            } catch (e) { kalemler = []; }
            if (!Array.isArray(kalemler) || !kalemler.length) continue;
            let changed = false;
            const yeni = kalemler.map(k => {
                const kod = String(k?.kod || '').trim().toUpperCase();
                if (!kod) return k;
                const kodAna = (typeof mamulAnaKodBul === 'function' ? mamulAnaKodBul(kod) : null) || kod;
                if (kodAna !== ana && kod !== ana) return k;
                const kart = byKod.get(kod) || siparisKalemMamulKartBul(kod);
                if (!kart) return k;
                const r = siparisKalemObjesiniMamulKarttanGuncelle(k, kart);
                if (r.changed) {
                    changed = true;
                    kalemGuncellenen++;
                }
                return r.kalem;
            });
            if (!changed) continue;
            const cinsStr = JSON.stringify(yeni);
            yazilacaklar.push({ sip, cinsStr });
        }
        if (yazilacaklar.length) {
            const settled = await Promise.all(yazilacaklar.map(({ sip, cinsStr }) =>
                sb.from('siparisler').update({ cins: cinsStr }).eq('id', sip.id)
                    .then(res => ({ sip, cinsStr, error: res.error }))
                    .catch(err => ({ sip, cinsStr, error: err }))
            ));
            settled.forEach(r => {
                if (r.error) {
                    console.warn('siparisleriMamulKoddanSenkronize', r.sip?.id, r.error);
                    return;
                }
                r.sip.cins = r.cinsStr;
                siparisGuncellenen++;
            });
        }
        if (typeof appMode !== 'undefined' && appMode === 'SIPARIS_GIRIS' && typeof editingId !== 'undefined' && editingId) {
            window.siparisFormKalemleriniMamulKarttanYenile({ silent: true });
        }
        return { updated: siparisGuncellenen, kalem: kalemGuncellenen, anaKod: ana };
    }
    window.siparisleriMamulKoddanSenkronize = siparisleriMamulKoddanSenkronize;

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
        const renkGoster = isVariant ? renk : (hasVariants ? `${vCount} varyant` : (renk || '—'));
        const chevHtml = hasVariants
            ? `<span class="chev chev--toggle" onclick="event.stopPropagation();siparisMamulSeciciToggle('${anaEsc}')" title="Varyantları aç/kapat">${chev}</span>`
            : `<span class="chev">${isVariant ? '·' : ''}</span>`;
        const rowTitle = isVariant
            ? `${k.desen_kodu} — varyant seç (renk otomatik dolar)`
            : (hasVariants ? 'Ana ürünü seç — renk boş kalır, elle yazabilirsiniz' : 'Ürünü seç');
        return `<div class="${cls}" onclick="siparisMamulSeciciSecKayit('${kodEsc}')" title="${rowTitle}">
            ${chevHtml}
            <span class="kod">${pdfEsc(k.desen_kodu)}${isVariant ? '<span class="varyant-pill">V</span>' : ''}${hasVariants && !expanded ? `<span class="varyant-pill">+${vCount}</span>` : ''}</span>
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
            const expanded = exp.has(String(grup.anaKod || '').toUpperCase());
            siparisMamulSeciciListe.push(parent);
            html += siparisMamulSeciciSatirHtml(parent, { anaKod: grup.anaKod, hasVariants, expanded, vCount: children.length });
            if (expanded && hasVariants) {
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

    function siparisMamulSeciciFlatRender(kartlar) {
        const list = document.getElementById('siparis-mamul-sec-list');
        const foot = document.getElementById('siparis-mamul-sec-foot');
        if (!list) return;
        siparisMamulSeciciGruplar = [];
        siparisMamulSeciciListe = Array.isArray(kartlar) ? kartlar : [];
        if (!siparisMamulSeciciListe.length) {
            list.innerHTML = `<div style="padding:24px 16px;text-align:center;color:var(--text3);font-size:11px;line-height:1.5">
                Mamül stok kartı bulunamadı.<br>Arama terimini değiştirin veya yeni mamül kartı oluşturun.
            </div>`;
            if (foot) foot.textContent = '0 sonuç';
            return;
        }
        let html = `<div style="display:grid;grid-template-columns:22px 88px 1fr 1fr 72px 72px;gap:8px;padding:4px 12px 8px;font-size:8px;font-weight:700;color:var(--text3);text-transform:uppercase;font-family:'DM Mono',monospace">
            <span></span><span>Kod</span><span>Desen</span><span>Ürün</span><span>Ebat</span><span>Renk</span>
        </div>`;
        siparisMamulSeciciListe.forEach(k => {
            html += siparisMamulSeciciSatirHtml(k, {
                isVariant: mamulVaryantNoBul(k.desen_kodu) > 0,
                flat: true
            });
        });
        list.innerHTML = html;
        if (foot) foot.textContent = `${siparisMamulSeciciListe.length} sonuç (varyantlar dahil)`;
    }

    function siparisMamulSeciciGruplariFiltrele(q) {
        const s = String(q || '').trim().toLowerCase();
        if (!s) return siparisMamulGruplariTopla();
        return siparisMamulGruplariTopla().filter(g => siparisMamulGrupEslestir(g, s));
    }

    window.siparisMamulSeciciAra = function (q) {
        const s = String(q || '').trim();
        if (!s) {
            window._siparisMamulSeciciExpanded = new Set();
            siparisMamulSeciciRender(siparisMamulGruplariTopla().slice(0, 200));
            return;
        }
        const sLower = s.toLowerCase();
        let filtreli = siparisMamulSeciciGruplariFiltrele(s);
        if (!filtreli.length && typeof mamulDepoAramaSonuclari === 'function') {
            const matches = mamulDepoAramaSonuclari(s, 200);
            const anaSet = new Set(matches.map(k => mamulAnaKodBul(k.desen_kodu)).filter(Boolean));
            if (anaSet.size) {
                filtreli = siparisMamulGruplariTopla().filter(g => anaSet.has(g.anaKod));
            }
        }
        if (filtreli.length) {
            filtreli.forEach(g => {
                const ana = String(g.anaKod || '').toUpperCase();
                const parent = g.parent?.record;
                const parentHit = parent && siparisMamulAramaMetni(parent, parent).includes(sLower);
                if (!parentHit && (g.children || []).length) window._siparisMamulSeciciExpanded.add(ana);
            });
            siparisMamulSeciciRender(filtreli.slice(0, 200));
            return;
        }
        siparisMamulSeciciFlatRender(typeof mamulDepoAramaSonuclari === 'function' ? mamulDepoAramaSonuclari(s, 200) : []);
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
        window._siparisMamulSeciciExpanded = new Set();
        const ara = document.getElementById('siparis-mamul-sec-ara');
        const mevcutKod = String(document.getElementById(`sk-kod-${siparisMamulSeciciKalemNo}`)?.value || '').trim();
        if (mevcutKod && mamulVaryantNoBul(mevcutKod) > 0) {
            const ana = String(mamulAnaKodBul(mevcutKod) || '').toUpperCase();
            if (ana) window._siparisMamulSeciciExpanded.add(ana);
        }
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
        window._siparisMamulSeciciExpanded = new Set();
    };

    window.siparisMamulSeciciSecKayit = function (kod) {
        const hedef = String(kod || '').trim().toUpperCase();
        if (!hedef || !siparisMamulSeciciKalemNo) return;
        const k = (typeof mamulKartBul === 'function' ? mamulKartBul(hedef) : null)
            || siparisMamulKartlariTopla().find(x => String(x.desen_kodu || '').trim().toUpperCase() === hedef)
            || siparisMamulSeciciListe.find(x => String(x.desen_kodu || '').trim().toUpperCase() === hedef);
        if (!k) return;
        siparisKalemMamulDoldur(siparisMamulSeciciKalemNo, k, {
            anaSecim: mamulVaryantNoBul(k.desen_kodu) <= 0
        });
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
        (rows || []).forEach((row, ri) => {
            if (ri >= mamulExcelVaryantBaslangicSatir(rows)) return;
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

    function mamulExcelVaryantBaslangicSatir(rows) {
        for (let r = 0; r < (rows || []).length; r++) {
            const row = rows[r] || [];
            for (let c = 0; c < row.length; c++) {
                const h = mamulExcelNormBaslik(row[c]);
                if (/^1\s*\.?\s*VARYANT/.test(h) || h === '1 VARYANT') return r;
            }
            const c0 = mamulExcelNormBaslik(row[0]);
            if (c0 === 'ATKI 1') return r;
            const c1 = mamulExcelNormBaslik(row[1]);
            if (c1.includes('IPLIK') && c1.includes('NO')) return r;
        }
        return (rows || []).length;
    }
    window.mamulExcelVaryantBaslangicSatir = mamulExcelVaryantBaslangicSatir;

    function mamulExcelVaryantKolonBul(rows) {
        const vColsDefault = [1, 5, 9, 13];
        for (let r = 0; r < (rows || []).length; r++) {
            const row = rows[r] || [];
            const iplikCols = [];
            for (let c = 0; c < row.length; c++) {
                const h = mamulExcelNormBaslik(row[c]);
                if (h.includes('IPLIK') && h.includes('NO')) iplikCols.push(c);
            }
            if (iplikCols.length >= 2) {
                return { headerRow: r, vCols: iplikCols };
            }
        }
        for (let r = 0; r < (rows || []).length; r++) {
            const row = rows[r] || [];
            const varyantCols = [];
            for (let c = 0; c < row.length; c++) {
                const h = mamulExcelNormBaslik(row[c]);
                if (/^\d+\s*\.?\s*VARYANT/.test(h)) varyantCols.push(c);
            }
            if (varyantCols.length >= 2) {
                const vCols = varyantCols.map(c => c + 1);
                return { headerRow: r + 1, vCols };
            }
        }
        return { headerRow: -1, vCols: vColsDefault.slice(0, MAMUL_VARYANT_BASLANGIC) };
    }

    function mamulExcelVaryantParse(rows) {
        const { headerRow, vCols } = mamulExcelVaryantKolonBul(rows);
        const vCount = Math.max(vCols.length, MAMUL_VARYANT_BASLANGIC);
        const varyantlar = Array.from({ length: vCount }, () => ({ atki: [] }));

        let atkiBasRow = -1;

        if (headerRow >= 0) {
            for (let r = headerRow + 1; r < Math.min(headerRow + 4, (rows || []).length); r++) {
                const c0 = mamulExcelNormBaslik(rows[r]?.[0]);
                if (c0 === 'ATKI 1' || c0.startsWith('ATKI 1')) {
                    atkiBasRow = r;
                    break;
                }
            }
            if (atkiBasRow < 0) atkiBasRow = headerRow + 1;
        }

        if (atkiBasRow < 0) {
            for (let r = 0; r < (rows || []).length; r++) {
                const c0 = mamulExcelNormBaslik(rows[r]?.[0]);
                const c1 = mamulExcelNormBaslik(rows[r]?.[1]);
                if (c0 === 'ATKI 1' || (c1.includes('IPLIK') && c1.includes('NO'))) {
                    atkiBasRow = c0 === 'ATKI 1' ? r : r + 1;
                    break;
                }
            }
        }

        if (atkiBasRow < 0) return varyantlar;

        for (let a = 0; a < 6; a++) {
            const row = rows[atkiBasRow + a];
            if (!row) continue;
            const label = mamulExcelNormBaslik(row[0]);
            if (!label.startsWith('ATKI')) continue;
            for (let v = 0; v < vCols.length; v++) {
                const base = vCols[v];
                if (!varyantlar[v].atki[a]) varyantlar[v].atki[a] = mamulVaryantAtkiBosSatir();
                varyantlar[v].atki[a] = {
                    iplik_no: String(row[base] ?? '').trim(),
                    renk: String(row[base + 1] ?? '').trim(),
                    atki_sayisi: String(row[base + 2] ?? '').trim()
                };
            }
        }

        return mamulVaryantListesiNormalize(varyantlar);
    }
    window.mamulExcelVaryantParse = mamulExcelVaryantParse;

    function mamulEkAlanFormOku() {
        const g = (id) => String(document.getElementById(id)?.value || '').trim();
        const varyantlar = mamulVaryantFormVerisiOku(mamulVaryantKolonSayisiAl());
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
            varyantlar: mamulVaryantListesiNormalize(varyantlar)
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
        const kolonSayisi = mamulVaryantKolonSayisiIhtiyac(varyantlar);
        if (document.getElementById('mamul-varyant-scroll')) {
            mamulVaryantTabloYenile(kolonSayisi, varyantlar);
        } else {
            for (let v = 1; v <= kolonSayisi; v++) {
                const vv = varyantlar[v - 1] || {};
                const atki = Array.isArray(vv.atki) ? vv.atki : [];
                s(`val-mamul-v${v}-renk-etiket`, vv.renk_etiket || mamulVaryantRenkEtiket(vv));
                for (let a = 1; a <= 6; a++) {
                    const aa = atki[a - 1] || {};
                    s(`val-mamul-v${v}-a${a}-iplik`, aa.iplik_no);
                    s(`val-mamul-v${v}-a${a}-renk`, aa.renk);
                    s(`val-mamul-v${v}-a${a}-sayi`, aa.atki_sayisi);
                }
            }
        }
    }
    window.mamulEkAlanFormDoldur = mamulEkAlanFormDoldur;

    function mamulVaryantBosSablon(kolonSayisi) {
        const n = Math.max(MAMUL_VARYANT_BASLANGIC, parseInt(kolonSayisi, 10) || MAMUL_VARYANT_BASLANGIC);
        return Array.from({ length: n }, () => mamulVaryantBosHucre());
    }

    function mamulAnaMetaOlustur(ekMeta) {
        const m = { ...(ekMeta && typeof ekMeta === 'object' ? ekMeta : {}) };
        delete m.varyantlar;
        delete m.varyant_no;
        delete m.ana_kod;
        delete m.atki;
        delete m.bir_boy_dokunacak;
        return m;
    }
    window.mamulAnaMetaOlustur = mamulAnaMetaOlustur;

    function mamulVaryantMetaOlustur(v, vNo, anaKod) {
        return {
            ana_kod: String(anaKod || '').trim().toUpperCase(),
            varyant_no: vNo,
            renk_etiket: String(v?.renk_etiket || mamulVaryantRenkEtiket(v) || '').trim(),
            atki: Array.isArray(v?.atki) ? v.atki : []
        };
    }
    window.mamulVaryantMetaOlustur = mamulVaryantMetaOlustur;

    function mamulAtkiDizisiParse(atkiStr) {
        const atki = Array.from({ length: 6 }, () => ({ iplik_no: '', renk: '', atki_sayisi: '' }));
        String(atkiStr || '').split('|').forEach(part => {
            const m = part.trim().match(/^A(\d+)\s*:\s*(.+?)\s*\/\s*(.+?)\s*\/\s*(.+)$/i);
            if (!m) return;
            const idx = parseInt(m[1], 10) - 1;
            if (idx < 0 || idx > 5) return;
            atki[idx] = { iplik_no: m[2].trim(), renk: m[3].trim(), atki_sayisi: m[4].trim() };
        });
        return atki;
    }

    function mamulVaryantKayitMetaOku(rec) {
        const meta = mamulEkAlanMetaDecode(rec?.notlar || '');
        let atki = Array.isArray(meta.atki) ? meta.atki : mamulAtkiDizisiParse(rec?.atki_renkleri);
        while (atki.length < 6) atki.push({ iplik_no: '', renk: '', atki_sayisi: '' });
        return {
            renk_etiket: String(meta.renk_etiket || rec?.renk || '').trim(),
            atki: atki.slice(0, 6)
        };
    }

    function mamulAnaKayitBul(anaKod) {
        const ana = mamulAnaKodNormalize(anaKod);
        if (!ana) return null;
        return (dataCache.kumas_kutuphanesi || []).find(x => {
            const k = String(x.desen_kodu || '').trim().toUpperCase();
            if (mamulVaryantNoBul(k) > 0) return false;
            return k === ana || mamulAnaKodBul(k) === ana || mamulAnaKodNormalize(k) === ana;
        }) || null;
    }
    window.mamulAnaKayitBul = mamulAnaKayitBul;

    function mamulAnaVaryantDbKayitlari(anaKod) {
        const ana = mamulAnaKodNormalize(anaKod);
        if (!ana) return [];
        return (dataCache.kumas_kutuphanesi || []).filter(rec => {
            const kod = String(rec.desen_kodu || '').trim().toUpperCase();
            return mamulAnaKodBul(kod) === ana && mamulVaryantNoBul(kod) > 0;
        }).sort((a, b) => mamulVaryantNoBul(a.desen_kodu) - mamulVaryantNoBul(b.desen_kodu));
    }

    function mamulVaryantSentezKartOlustur(anaKayit, vNo, varyantMeta) {
        const anaKod = mamulAnaKodBul(anaKayit?.desen_kodu) || mamulAnaKodNormalize(anaKayit?.desen_kodu);
        const varKod = mamulVaryantKodFormatla(anaKod, vNo);
        const renk = mamulVaryantRenkEtiket(varyantMeta || {});
        const atkiStr = mamulAtkiRenkleriSerilestir((varyantMeta || {}).atki || []);
        return {
            ...anaKayit,
            id: null,
            desen_kodu: varKod,
            stok_kodu: varKod,
            renk: renk,
            atki_renkleri: atkiStr,
            ana_grup: 'MAMUL',
            _mamulVaryantSentez: true
        };
    }

    /** Ana karta bağlı varyant kayıtları — DB yoksa meta'dan sentezler (2026001-1, -2 …) */
    function mamulAnaVaryantKayitlariTopla(anaKayit) {
        if (!anaKayit) return [];
        const anaKod = mamulAnaKodBul(anaKayit.desen_kodu);
        const db = mamulAnaVaryantDbKayitlari(anaKod);
        if (db.length) return db;
        const meta = mamulEkAlanMetaDecode(anaKayit.notlar || '');
        const varyantlar = mamulVaryantlariKayittanTopla(anaKod, meta);
        const out = [];
        varyantlar.forEach((v, i) => {
            if (!mamulVaryantFormDoluMu(v)) return;
            out.push(mamulVaryantSentezKartOlustur(anaKayit, i + 1, v));
        });
        return out;
    }
    window.mamulAnaVaryantKayitlariTopla = mamulAnaVaryantKayitlariTopla;

    function mamulAnaVaryantVarMi(anaKodOrKayit) {
        const anaKayit = (anaKodOrKayit && typeof anaKodOrKayit === 'object')
            ? (mamulVaryantNoBul(anaKodOrKayit.desen_kodu) > 0 ? mamulAnaKayitBul(mamulAnaKodBul(anaKodOrKayit.desen_kodu)) : anaKodOrKayit)
            : mamulAnaKayitBul(anaKodOrKayit);
        return mamulAnaVaryantKayitlariTopla(anaKayit).length > 0;
    }
    window.mamulAnaVaryantVarMi = mamulAnaVaryantVarMi;

    function mamulKartBul(kod) {
        const k = String(kod || '').trim().toUpperCase();
        if (!k) return null;
        const exact = (dataCache.kumas_kutuphanesi || []).find(x =>
            String(x.desen_kodu || '').trim().toUpperCase() === k
        );
        if (exact) return exact;
        const vNo = mamulVaryantNoBul(k);
        if (vNo <= 0) return null;
        const ana = mamulAnaKodBul(k);
        const anaKayit = mamulAnaKayitBul(ana);
        if (!anaKayit) return null;
        return mamulAnaVaryantKayitlariTopla(anaKayit).find(x => {
            const xk = String(x.desen_kodu || '').trim().toUpperCase();
            return xk === k || (mamulVaryantNoBul(xk) === vNo && mamulAnaKodBul(xk) === ana);
        }) || null;
    }
    window.mamulKartBul = mamulKartBul;

    function mamulVaryantlariKayittanTopla(anaKod, legacyMeta) {
        const ana = String(anaKod || '').trim().toUpperCase();
        const byNo = {};
        let maxV = MAMUL_VARYANT_BASLANGIC;
        (dataCache.kumas_kutuphanesi || []).forEach(rec => {
            const kod = String(rec.desen_kodu || '').trim().toUpperCase();
            if (mamulAnaKodBul(kod) !== ana) return;
            const vNo = mamulVaryantNoBul(kod);
            if (vNo >= 1) {
                byNo[vNo] = mamulVaryantKayitMetaOku(rec);
                if (vNo > maxV) maxV = vNo;
            }
        });
        const legacy = Array.isArray(legacyMeta?.varyantlar) ? legacyMeta.varyantlar : [];
        maxV = Math.max(maxV, legacy.length, MAMUL_VARYANT_BASLANGIC);
        const sablon = [];
        for (let i = 0; i < maxV; i++) {
            const vNo = i + 1;
            if (byNo[vNo] && mamulVaryantFormDoluMu(byNo[vNo])) sablon[i] = byNo[vNo];
            else if (legacy[i] && mamulVaryantFormDoluMu(legacy[i])) sablon[i] = legacy[i];
            else sablon[i] = mamulVaryantBosHucre();
        }
        return sablon;
    }
    window.mamulVaryantlariKayittanTopla = mamulVaryantlariKayittanTopla;

    function mamulKartDuzenlemePaketi(kayit) {
        const kod = String(kayit?.desen_kodu || '').trim().toUpperCase();
        const anaKod = mamulAnaKodBul(kod);
        const anaKayit = mamulAnaKayitBul(anaKod) || (mamulVaryantNoBul(kod) === 0 ? kayit : null);
        const metaKaynak = anaKayit || kayit;
        let meta = mamulEkAlanMetaDecode(metaKaynak?.notlar || '') || {};
        if (metaKaynak?.ham_en && metaKaynak?.ham_boy && !meta.ham_ebat) {
            meta.ham_ebat = `${metaKaynak.ham_en}*${metaKaynak.ham_boy}`;
        }
        if (metaKaynak?.mamul_en && !meta.istenen_mamul_ebat) {
            meta.istenen_mamul_ebat = metaKaynak.mamul_boy
                ? `${metaKaynak.mamul_en}*${metaKaynak.mamul_boy}`
                : String(metaKaynak.mamul_en);
        }
        if (metaKaynak?.ham_gsm && !meta.ham_gram_m2) meta.ham_gram_m2 = String(metaKaynak.ham_gsm);
        if (metaKaynak?.mamul_gsm && !meta.mamul_gram_m2) meta.mamul_gram_m2 = String(metaKaynak.mamul_gsm);
        if (!meta.aciklama && typeof kumasNotlarTemizle === 'function') {
            meta.aciklama = kumasNotlarTemizle(metaKaynak?.notlar || '');
        }
        if (!meta.kumas_cinsi && metaKaynak?.kumas_cinsi) meta.kumas_cinsi = metaKaynak.kumas_cinsi;
        if (!meta.desen_adi && metaKaynak?.desen_adi) meta.desen_adi = metaKaynak.desen_adi;
        if (!meta.musteri && metaKaynak?.firma) meta.musteri = metaKaynak.firma;
        meta = mamulAnaMetaOlustur(meta);
        meta.varyantlar = mamulVaryantlariKayittanTopla(anaKod, mamulEkAlanMetaDecode(metaKaynak?.notlar || ''));
        return { anaKod, anaKayit: anaKayit || kayit, meta, fotoKaynak: metaKaynak };
    }

    function mamulKartGirisFormDoldur(kayit) {
        const paket = mamulKartDuzenlemePaketi(kayit);
        const src = paket.fotoKaynak || paket.anaKayit;
        const mv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
        mv('val-kodu', paket.anaKod);
        mv('val-firma', src?.firma);
        mv('val-kumas-cinsi', src?.kumas_cinsi);
        mv('val-desen-adi', src?.desen_adi);
        mv('val-tarak-no', src?.tarak_no);
        mv('val-tarak-eni', src?.tarak_eni);
        mv('val-mamul-atki-sikligi', src?.atki_sikligi);
        mv('val-mamul-cozgu-iplik-no', src?.cozgu_no);
        mv('val-mamul-cozgu-iplik-markasi', src?.cozgu_cinsi);
        mv('val-durum', src?.kalite);
        mamulEkAlanFormDoldur(paket.meta);
        if (typeof currentImageBase64 !== 'undefined') {
            currentImageBase64 = src?.fotograf || null;
            if (currentImageBase64 && document.getElementById('img-preview')) {
                document.getElementById('img-preview').src = currentImageBase64;
                document.getElementById('img-preview').style.display = '';
                const ph = document.getElementById('foto-placeholder');
                if (ph) ph.style.display = 'none';
            }
        }
        if (typeof erpFotoOnizleGuncelle === 'function') erpFotoOnizleGuncelle(src?.fotograf || null);
        mamulVaryantKodBasliklariYenile();
        return paket.anaKayit;
    }
    window.mamulKartGirisFormDoldur = mamulKartGirisFormDoldur;

    function mamulVaryantKopyala(fromV, toV) {
        const f = parseInt(fromV, 10);
        const t = parseInt(toV, 10);
        const maxV = mamulVaryantKolonSayisiAl();
        if (!(f >= 1 && t >= 1 && f <= maxV && t <= maxV) || f === t) return;
        for (let a = 1; a <= 6; a++) {
            ['iplik', 'renk', 'sayi'].forEach(suf => {
                const src = document.getElementById(`val-mamul-v${f}-a${a}-${suf}`);
                const dst = document.getElementById(`val-mamul-v${t}-a${a}-${suf}`);
                if (dst && src) dst.value = src.value;
            });
        }
        if (typeof erpToast === 'function') erpToast(`V${f} verileri V${t} varyantına kopyalandı.`, 'success');
    }
    window.mamulVaryantKopyala = mamulVaryantKopyala;

    function mamulVaryantTemizle(v) {
        const x = parseInt(v, 10);
        if (!(x >= 1 && x <= mamulVaryantKolonSayisiAl())) return;
        for (let a = 1; a <= 6; a++) {
            ['iplik', 'renk', 'sayi'].forEach(suf => {
                const el = document.getElementById(`val-mamul-v${x}-a${a}-${suf}`);
                if (el) el.value = '';
            });
        }
        if (typeof erpToast === 'function') erpToast(`V${x} varyantı temizlendi.`, 'info');
    }
    window.mamulVaryantTemizle = mamulVaryantTemizle;

    function mamulVaryantKolonunaGit(v) {
        const x = parseInt(v, 10);
        if (!(x >= 1 && x <= mamulVaryantKolonSayisiAl())) return;
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

    function mamulVaryantDoluSay(varyantlar) {
        if (!Array.isArray(varyantlar)) return 0;
        return varyantlar.filter(v => {
            return (Array.isArray(v?.atki) ? v.atki : []).some(a =>
                String(a?.iplik_no || '').trim() || String(a?.renk || '').trim() || String(a?.atki_sayisi || '').trim()
            );
        }).length;
    }

    function mamulVaryantBolumuAc(varyantlar) {
        const scrollEl = document.getElementById('mamul-varyant-scroll');
        const section = scrollEl?.previousElementSibling;
        if (scrollEl) {
            try { scrollEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {
                scrollEl.scrollIntoView(false);
            }
            scrollEl.style.transition = 'box-shadow 0.35s ease';
            scrollEl.style.boxShadow = 'inset 0 0 0 2px rgba(251,191,36,0.5)';
            setTimeout(() => { scrollEl.style.boxShadow = ''; }, 2200);
        }
        if (section) {
            section.style.color = 'var(--amber-c)';
            setTimeout(() => { section.style.color = ''; }, 2200);
        }
        let hedefV = 1;
        if (Array.isArray(varyantlar)) {
            for (let i = 0; i < varyantlar.length; i++) {
                const v = varyantlar[i];
                const dolu = (Array.isArray(v?.atki) ? v.atki : []).some(a =>
                        String(a?.iplik_no || '').trim() || String(a?.renk || '').trim());
                if (dolu) { hedefV = i + 1; break; }
            }
        }
        setTimeout(() => {
            mamulVaryantKolonunaGit(hedefV);
            if (scrollEl) scrollEl.style.outline = '1px solid rgba(251,191,36,0.35)';
            setTimeout(() => { if (scrollEl) scrollEl.style.outline = ''; }, 2000);
        }, 320);
    }
    window.mamulVaryantBolumuAc = mamulVaryantBolumuAc;

    function mamulExcelFormaYaz(map, varyantlar) {
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (!el || val == null || String(val).trim() === '') return;
            el.value = String(val).trim();
        };
        set('val-mamul-tarih', mamulExcelMapDeger(map, ['TARIH']));
        set('val-firma', mamulExcelMapDeger(map, ['MUSTERI', 'MUSTERI FIRMA']));
        set('val-mamul-siparis-no', mamulExcelMapDeger(map, ['SIPARIS NO', 'MUSTERI SIPARIS NO']));
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
        set('val-mamul-ham-gram-mtul', mamulExcelMapDeger(map, ['HAM GRAM MTUL', 'HAM GR MTUL']));
        set('val-mamul-ham-gram-m2', mamulExcelMapDeger(map, ['HAM GRAM M2', 'HAM GR M2']));
        set('val-mamul-mamul-gram-mtul', mamulExcelMapDeger(map, ['MAMUL GRAM MTUL', 'MAMUL GRAM AD MTUL']));
        set('val-mamul-mamul-gram-m2', mamulExcelMapDeger(map, ['MAMUL GRAM M2']));
        set('val-mamul-tahar-raporu', mamulExcelMapDeger(map, ['TAHAR RAPORU']));
        set('val-mamul-aciklama', mamulExcelMapDeger(map, ['ACIKLAMA']));
        if (Array.isArray(varyantlar) && varyantlar.length) {
            const need = mamulVaryantKolonSayisiIhtiyac(varyantlar);
            if (document.getElementById('mamul-varyant-scroll')) mamulVaryantTabloYenile(need, varyantlar);
            else mamulEkAlanFormDoldur({ varyantlar });
            setTimeout(() => mamulVaryantBolumuAc(varyantlar), 80);
        }
    }

    function mamulExcelSeciciAc() {
        const inp = document.getElementById('mamul-excel-input');
        if (inp) inp.click();
    }
    window.mamulExcelSeciciAc = mamulExcelSeciciAc;

    function mamulStokKoduAta(opts) {
        opts = opts || {};
        const input = document.getElementById('val-kodu');
        if (!input) return;
        const duzenle = typeof editingId !== 'undefined' && editingId;
        if (duzenle && !opts.force) return;
        if (!opts.excelImport && !opts.force) {
            const mevcut = String(input.value || '').trim();
            if (mevcut) return;
        }
        input.value = typeof getNextMamulAnaKod === 'function'
            ? getNextMamulAnaKod()
            : `${new Date().getFullYear()}001`;
        mamulVaryantKodBasliklariYenile();
    }
    window.mamulStokKoduAta = mamulStokKoduAta;

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
                    mamulStokKoduAta({ excelImport: true });
                    const vSay = mamulVaryantDoluSay(varyantlar);
                    if (typeof erpToast === 'function') {
                        erpToast(
                            vSay
                                ? `Excel aktarıldı: ${file.name} · ${vSay} renk varyantı yüklendi`
                                : `Excel aktarıldı: ${file.name} (varyant bulunamadı — tabloyu kontrol edin)`,
                            vSay ? 'success' : 'warn'
                        );
                    }
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
        mamulVaryantKolonSayisiAyarla(MAMUL_VARYANT_BASLANGIC);
        const kolonSayisi = mamulVaryantKolonSayisiAl();
        const parca = mamulVaryantTabloParcaHtml(kolonSayisi);
        const barParca = mamulVaryantBarParcaHtml(kolonSayisi);
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
            <div class="mamul-sheet__flow">
                <span class="mamul-sheet__flow-step">1</span> Mamül kartı oluştur
                <span style="color:var(--text3)">→</span>
                <span class="mamul-sheet__flow-step">2</span> Renk varyantları (2026001-1, -2 … sınırsız)
                <span style="color:var(--text3)">→</span>
                <span class="mamul-sheet__flow-step">3</span> Kaydet
                <span style="color:var(--text3)">→</span>
                <span class="mamul-sheet__flow-step">4</span> Depo Stok → Mamül Stoğu girişi
            </div>
            <div class="mamul-sheet__toolbar">
                <div class="mamul-sheet__toolbar-left">
                    <div class="mamul-sheet__kod"><input id="val-kodu" readonly title="Yıl-ürün kodu (YYYYNNN)"></div>
                    <span style="font-size:9px;color:var(--text3)">Varyant: <span style="font-family:'DM Mono',monospace;color:var(--cyan-c)">2026001-1</span></span>
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

            <div class="mamul-sheet__section">Renk Varyantları <span style="font-size:8px;color:var(--text3);font-weight:400">— kayıtta otomatik stok kodu: ana-1, ana-2 …</span></div>
            <div class="mamul-varyant-bar">
                <span style="font-size:8px;color:var(--text3);font-family:'DM Mono',monospace">Atkı 1–6 · sınırsız varyant</span>
                <div id="mamul-varyant-bar-btns" class="mamul-varyant-bar__btns">${barParca}</div>
                <button type="button" onclick="mamulVaryantKolonEkle()" class="btn-pro btn-primary-pro" style="padding:2px 8px;font-size:8px;white-space:nowrap">+ Varyant ekle</button>
            </div>
            <div id="mamul-varyant-scroll" class="mamul-varyant-scroll">
                <table class="mamul-varyant-table">
                    <thead>
                        <tr><th rowspan="2"></th>${parca.varyantHead}</tr>
                        <tr>${parca.varyantSubHead}</tr>
                    </thead>
                    <tbody>${parca.varyantRows}
                    </tbody>
                </table>
            </div>
        </div>`;
    }
    window.mamulStokKartFormHtml = mamulStokKartFormHtml;

    function mamulVaryantFormDoluMu(v) {
        if (!v) return false;
        return (Array.isArray(v.atki) ? v.atki : []).some(a =>
            String(a?.iplik_no || '').trim() || String(a?.renk || '').trim() || String(a?.atki_sayisi || '').trim()
        );
    }

    function mamulVaryantRenkEtiket(v) {
        if (!v) return '';
        if (String(v.renk_etiket || '').trim()) return String(v.renk_etiket).trim().toUpperCase();
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

    function mamulVaryantAtkiDensify(v) {
        const raw = Array.isArray(v?.atki) ? v.atki : [];
        const atki = [];
        for (let i = 0; i < 6; i++) {
            atki.push({
                iplik_no: String(raw[i]?.iplik_no || '').trim(),
                renk: String(raw[i]?.renk || '').trim(),
                atki_sayisi: String(raw[i]?.atki_sayisi || '').trim()
            });
        }
        return {
            renk_etiket: String(v?.renk_etiket || '').trim(),
            atki
        };
    }

    function mamulVaryantListesiNormalize(varyantlar) {
        const src = Array.isArray(varyantlar) ? varyantlar : [];
        const out = src.map(v => mamulVaryantAtkiDensify(v));
        while (out.length > MAMUL_VARYANT_BASLANGIC && !mamulVaryantFormDoluMu(out[out.length - 1])) {
            out.pop();
        }
        return out;
    }
    window.mamulVaryantListesiNormalize = mamulVaryantListesiNormalize;

    async function mamulVaryantKayitlariSenkronize(anaPayload, ekMeta) {
        const anaKod = mamulAnaKodNormalize(anaPayload?.desen_kodu || '');
        if (!anaKod || mamulVaryantNoBul(anaPayload?.desen_kodu || '') > 0) {
            return { ok: true, created: 0, updated: 0, skipped: true };
        }
        const varyantlar = mamulVaryantListesiNormalize(ekMeta?.varyantlar);
        const hamAna = mamulAnaKodHamBul(anaPayload?.desen_kodu || anaKod);

        let aileKayitlari = [];
        try {
            const orParts = [`desen_kodu.eq.${anaKod}`, `desen_kodu.like.${anaKod}-%`];
            if (hamAna && hamAna !== anaKod) {
                orParts.push(`desen_kodu.eq.${hamAna}`, `desen_kodu.like.${hamAna}-%`);
            }
            const res = await sb.from('kumas_kutuphanesi').select('id,desen_kodu').or(orParts.join(','));
            if (res.error) return { ok: false, error: res.error, created: 0, updated: 0 };
            aileKayitlari = res.data || [];
        } catch (e) {
            aileKayitlari = (dataCache.kumas_kutuphanesi || []).filter(x => {
                const k = String(x.desen_kodu || '').trim().toUpperCase();
                return k === anaKod || k.startsWith(anaKod + '-') || (hamAna && (k === hamAna || k.startsWith(hamAna + '-')));
            });
        }

        const aileKayitBul = (varKod, vNo) => {
            const hedef = String(varKod || '').trim().toUpperCase();
            let hit = aileKayitlari.find(x => String(x.desen_kodu || '').trim().toUpperCase() === hedef);
            if (hit) return hit;
            return aileKayitlari.find(x => {
                const k = String(x.desen_kodu || '').trim().toUpperCase();
                if (mamulAnaKodBul(k) !== anaKod) return false;
                return mamulVaryantNoBul(k) === vNo;
            }) || null;
        };

        let created = 0;
        let updated = 0;
        const kullanilanIdler = new Set();
        const doluVaryantNolar = [];
        const yazmaIsleri = [];
        const silmeIsleri = [];

        for (let vNo = 1; vNo <= varyantlar.length; vNo++) {
            const v = varyantlar[vNo - 1];
            const varKod = mamulVaryantKodFormatla(anaKod, vNo);
            const existing = aileKayitBul(varKod, vNo);
            const dolu = mamulVaryantFormDoluMu(v);

            if (!dolu) {
                if (existing?.id) silmeIsleri.push(existing.id);
                continue;
            }

            doluVaryantNolar.push(vNo);

            const varMeta = mamulVaryantMetaOlustur(v, vNo, anaKod);
            const renk = mamulVaryantRenkEtiket(v);
            const atkiStr = mamulAtkiRenkleriSerilestir(v.atki);
            const row = {
                desen_kodu: varKod,
                urun_adi: anaPayload.urun_adi || anaPayload.desen_adi || anaPayload.kumas_cinsi || '',
                firma: anaPayload.firma || '',
                kumas_cinsi: anaPayload.kumas_cinsi || '',
                desen_adi: anaPayload.desen_adi || '',
                renk: renk,
                atki_renkleri: atkiStr,
                kalite: anaPayload.kalite || 'AKTİF',
                ana_grup: 'MAMUL',
                tarak_no: '',
                tarak_eni: '',
                atki_sikligi: '',
                cozgu_no: '',
                cozgu_cinsi: '',
                ham_en: '',
                ham_boy: '',
                ham_gsm: '',
                mamul_en: '',
                mamul_boy: '',
                mamul_gsm: '',
                fotograf: null,
                notlar: typeof kumasNotlarOlustur === 'function'
                    ? kumasNotlarOlustur('', varMeta)
                    : ''
            };

            if (existing?.id) {
                kullanilanIdler.add(existing.id);
                yazmaIsleri.push(
                    sb.from('kumas_kutuphanesi').update(row).eq('id', existing.id)
                        .then(res => ({ tip: 'upd', error: res.error }))
                );
                updated++;
            } else {
                yazmaIsleri.push(
                    sb.from('kumas_kutuphanesi').insert([row])
                        .then(res => ({ tip: 'ins', error: res.error }))
                );
                created++;
            }
        }

        for (const rec of aileKayitlari) {
            const k = String(rec.desen_kodu || '').trim().toUpperCase();
            if (k === anaKod || k === hamAna) continue;
            if (kullanilanIdler.has(rec.id)) continue;
            const vNo = mamulVaryantNoBul(k);
            if (vNo < 1) continue;
            if (mamulAnaKodBul(k) !== anaKod) continue;
            const beklenen = mamulVaryantKodFormatla(anaKod, vNo);
            const dolu = doluVaryantNolar.includes(vNo);
            if (!dolu || k !== beklenen) silmeIsleri.push(rec.id);
        }

        if (yazmaIsleri.length) {
            const results = await Promise.all(yazmaIsleri);
            const fail = results.find(r => r?.error);
            if (fail?.error) return { ok: false, error: fail.error, created, updated };
        }
        if (silmeIsleri.length) {
            await Promise.all(silmeIsleri.map(id => sb.from('kumas_kutuphanesi').delete().eq('id', id)));
        }

        return { ok: true, created, updated, anaKod };
    }
    window.mamulVaryantKayitlariSenkronize = mamulVaryantKayitlariSenkronize;
    window.mamulVaryantKayitlariOlustur = mamulVaryantKayitlariSenkronize;

    /** Detay modalındaki renk chip'inden renk adını kaydet */
    window.mamulVaryantRenkAdiKaydet = async function (anaKod, varyantNo, renkAdi) {
        const ana = String(anaKod || '').trim().toUpperCase();
        const vNo = Math.max(1, parseInt(varyantNo, 10) || 1);
        const renk = String(renkAdi || '').trim().toUpperCase();
        if (!ana) {
            if (typeof erpToast === 'function') erpToast('Ana stok kodu bulunamadı.', 'error');
            return;
        }
        const anaKayit = mamulAnaKayitBul(ana);
        if (!anaKayit?.id) {
            if (typeof erpToast === 'function') erpToast('Ana mamül kartı bulunamadı: ' + ana, 'error');
            return;
        }
        try {
            const meta = mamulEkAlanMetaDecode(anaKayit.notlar || '') || {};
            let varyantlar = Array.isArray(meta.varyantlar) ? meta.varyantlar.map(mamulVaryantAtkiDensify) : [];
            while (varyantlar.length < vNo) varyantlar.push(mamulVaryantBosHucre());
            varyantlar[vNo - 1] = {
                ...mamulVaryantAtkiDensify(varyantlar[vNo - 1]),
                renk_etiket: renk
            };
            meta.varyantlar = varyantlar;
            const userNot = typeof kumasNotlarTemizle === 'function'
                ? kumasNotlarTemizle(anaKayit.notlar || '')
                : String(anaKayit.notlar || '');
            const newNotlar = typeof kumasNotlarOlustur === 'function'
                ? kumasNotlarOlustur(userNot, meta)
                : JSON.stringify(meta);

            const updAna = await sb.from('kumas_kutuphanesi').update({ notlar: newNotlar }).eq('id', anaKayit.id);
            if (updAna.error) throw updAna.error;

            const varKod = mamulVaryantKodFormatla(ana, vNo);
            const child = (dataCache.kumas_kutuphanesi || []).find(x => {
                const k = String(x.desen_kodu || '').trim().toUpperCase();
                return k === varKod || (mamulAnaKodBul(k) === ana && mamulVaryantNoBul(k) === vNo);
            });
            if (child?.id) {
                const childMeta = mamulVaryantMetaOlustur(varyantlar[vNo - 1], vNo, ana);
                const childNot = typeof kumasNotlarOlustur === 'function'
                    ? kumasNotlarOlustur('', childMeta)
                    : '';
                await sb.from('kumas_kutuphanesi').update({
                    renk: renk || null,
                    notlar: childNot
                }).eq('id', child.id);
                child.renk = renk;
                child.notlar = childNot;
            }

            anaKayit.notlar = newNotlar;
            const libIdx = (dataCache.kumas_kutuphanesi || []).findIndex(x => String(x.id) === String(anaKayit.id));
            if (libIdx >= 0) dataCache.kumas_kutuphanesi[libIdx].notlar = newNotlar;

            if (typeof currentData !== 'undefined' && Array.isArray(currentData) && typeof selectedIndex === 'number' && currentData[selectedIndex]) {
                const cur = currentData[selectedIndex];
                const curAna = mamulAnaKodBul(cur.desen_kodu) || String(cur.desen_kodu || '').trim().toUpperCase();
                if (curAna === ana || String(cur.id) === String(anaKayit.id)) {
                    if (typeof renderMamulKartDetayModalHtml === 'function') {
                        const body = document.getElementById('modal-body');
                        if (body) body.innerHTML = renderMamulKartDetayModalHtml(anaKayit, selectedIndex);
                    }
                }
            }
            if (typeof erpToast === 'function') erpToast(`V${vNo} renk adı kaydedildi: ${renk || '—'}`, 'success', 2500);
        } catch (e) {
            console.error(e);
            if (typeof erpToast === 'function') erpToast('Renk adı kaydedilemedi: ' + (e.message || e), 'error', 5000);
        }
    };

    /* ===== TEMP: MAMUL TOPLU TEMIZLEME — geçici modül, sonradan tamamen silinecek ===== */
    window._mamulTopluTemizlemeSecili = window._mamulTopluTemizlemeSecili || new Set();
    window._mamulTopluTemizlemeFiltre = window._mamulTopluTemizlemeFiltre || 'TUMU';
    window._mamulTopluTemizlemeAcik = false;
    window._mamulTopluTemizlemeStokluSil = !!window._mamulTopluTemizlemeStokluSil;

    function mamulTopluTemizlemeKayitlari() {
        return (dataCache.kumas_kutuphanesi || []).filter(i => stokKartGrupEslesir(i, 'MAMUL'));
    }

    function mamulTopluTemizlemeYeniFormatMi(kod) {
        const s = String(kod || '').trim().toUpperCase();
        return /^\d{7}(-\d+)?$/.test(s);
    }

    function mamulTopluTemizlemeEskiFormatMi(kod) {
        const s = String(kod || '').trim().toUpperCase();
        if (/^(MA|MM)-/i.test(s)) return true;
        if (/^\d{4}-\d{1,4}(-\d+)?$/.test(s)) return true;
        if (/^\d{5,6}(-\d+)?$/.test(s)) return true;
        return !mamulTopluTemizlemeYeniFormatMi(s);
    }

    function mamulTopluTemizlemeKayitFiltrele(liste) {
        const f = window._mamulTopluTemizlemeFiltre || 'TUMU';
        const ara = String(document.getElementById('mamul-toplu-ara')?.value || '').trim().toLowerCase();
        return (liste || mamulTopluTemizlemeKayitlari()).filter(rec => {
            const kod = String(rec.desen_kodu || '').trim().toUpperCase();
            if (f === 'ESKI' && !mamulTopluTemizlemeEskiFormatMi(kod)) return false;
            if (f === 'YENI_DISI' && mamulTopluTemizlemeYeniFormatMi(kod)) return false;
            if (f === 'VARYANT' && mamulVaryantNoBul(kod) <= 0) return false;
            if (f === 'ANA' && mamulVaryantNoBul(kod) > 0) return false;
            if (ara) {
                const blob = [kod, rec.urun_adi, rec.kumas_cinsi, rec.desen_adi, rec.firma, rec.renk]
                    .map(x => String(x || '').toLowerCase()).join(' ');
                if (!blob.includes(ara)) return false;
            }
            return true;
        });
    }

    function mamulTopluTemizlemeStokVarMi(kod) {
        if (typeof depoMamulBakiyeHesapla !== 'function') return false;
        const bak = depoMamulBakiyeHesapla(kod);
        if (!bak) return false;
        const kg = parseFloat(bak.kg) || 0;
        const mt = parseFloat(bak.mt) || 0;
        const ad = parseInt(bak.ad, 10) || 0;
        return kg > 0 || mt > 0 || ad > 0;
    }

    function mamulTopluTemizlemeOzetGuncelle() {
        const cnt = document.getElementById('mamul-toplu-sec-count');
        const ozet = document.getElementById('mamul-toplu-ozet');
        const silBtn = document.getElementById('mamul-toplu-sil-btn');
        const secili = window._mamulTopluTemizlemeSecili.size;
        if (cnt) cnt.textContent = 'Seçili: ' + secili;
        if (silBtn) silBtn.disabled = secili === 0;
        if (ozet) {
            const tum = mamulTopluTemizlemeKayitlari();
            const eski = tum.filter(r => mamulTopluTemizlemeEskiFormatMi(r.desen_kodu)).length;
            const yeni = tum.filter(r => mamulTopluTemizlemeYeniFormatMi(r.desen_kodu)).length;
            ozet.textContent = `Toplam ${tum.length} mamül kaydı · eski format: ${eski} · yeni format (2026001): ${yeni}`;
        }
    }

    function mamulTopluTemizlemeListeRender() {
        const host = document.getElementById('mamul-toplu-liste');
        if (!host) return;
        const kayitlar = mamulTopluTemizlemeKayitFiltrele();
        if (!kayitlar.length) {
            host.innerHTML = '<div class="mamul-toplu-empty">Filtreye uyan mamül kartı yok.</div>';
            mamulTopluTemizlemeOzetGuncelle();
            return;
        }
        host.innerHTML = kayitlar.map(rec => {
            const id = rec.id;
            const kod = String(rec.desen_kodu || '').trim().toUpperCase();
            const secili = window._mamulTopluTemizlemeSecili.has(id);
            const eski = mamulTopluTemizlemeEskiFormatMi(kod);
            const varyant = mamulVaryantNoBul(kod) > 0;
            const stoklu = mamulTopluTemizlemeStokVarMi(kod);
            const fmtPill = eski
                ? '<span class="pill pill-amber" style="font-size:7px">eski</span>'
                : '<span class="pill pill-green" style="font-size:7px">yeni</span>';
            const tipPill = varyant
                ? '<span class="pill pill-cyan" style="font-size:7px">varyant</span>'
                : '<span class="pill pill-gray" style="font-size:7px">ana</span>';
            const stokPill = stoklu
                ? '<span class="pill pill-red" style="font-size:7px">stoklu</span>'
                : '';
            const ad = pdfEsc(rec.urun_adi || rec.kumas_cinsi || rec.desen_adi || '—');
            return `<label class="mamul-toplu-row${secili ? ' is-selected' : ''}">
                <input type="checkbox" ${secili ? 'checked' : ''} onchange="mamulTopluTemizlemeSecToggle(${id}, this.checked)">
                <span class="mamul-toplu-row__kod">${pdfEsc(kod)}</span>
                <span class="mamul-toplu-row__ad">${ad}</span>
                <span class="mamul-toplu-row__pill">${fmtPill}${tipPill}${stokPill}</span>
            </label>`;
        }).join('');
        mamulTopluTemizlemeOzetGuncelle();
    }

    window.mamulTopluTemizlemeTogglePanel = function () {
        window._mamulTopluTemizlemeAcik = !window._mamulTopluTemizlemeAcik;
        if (typeof loadData === 'function') loadData();
        else if (typeof renderInputs === 'function') renderInputs();
    };

    window.mamulTopluTemizlemeFiltreDegistir = function (val) {
        window._mamulTopluTemizlemeFiltre = val || 'TUMU';
        mamulTopluTemizlemeListeRender();
    };

    window.mamulTopluTemizlemeSecToggle = function (id, checked) {
        const n = parseInt(id, 10);
        if (!n) return;
        if (checked) window._mamulTopluTemizlemeSecili.add(n);
        else window._mamulTopluTemizlemeSecili.delete(n);
        mamulTopluTemizlemeListeRender();
    };

    window.mamulTopluTemizlemeSecHepsi = function () {
        mamulTopluTemizlemeKayitFiltrele().forEach(r => {
            if (r.id) window._mamulTopluTemizlemeSecili.add(r.id);
        });
        mamulTopluTemizlemeListeRender();
    };

    window.mamulTopluTemizlemeSecTemizle = function () {
        window._mamulTopluTemizlemeSecili.clear();
        mamulTopluTemizlemeListeRender();
    };

    window.mamulTopluTemizlemeStokluSilToggle = function (el) {
        window._mamulTopluTemizlemeStokluSil = !!el?.checked;
    };

    window.mamulTopluTemizlemeAc = function () {
        window._mamulTopluTemizlemeAcik = true;
        if (appMode !== 'KART_LISTE') {
            if (typeof setAppMode === 'function') setAppMode('KART_LISTE');
        }
        if (typeof archiveTab !== 'undefined') archiveTab = 'MAMUL';
        if (typeof saveUiState === 'function') saveUiState({ archiveTab: 'MAMUL' });
        if (typeof syncArchiveTabStili === 'function') syncArchiveTabStili();
        if (typeof loadData === 'function') loadData();
    };

    window.mamulTopluTemizlemeSil = async function () {
        const ids = [...window._mamulTopluTemizlemeSecili];
        if (!ids.length) return;
        const lib = dataCache.kumas_kutuphanesi || [];
        const secilen = ids.map(id => lib.find(x => x.id === id)).filter(Boolean);
        const stoklu = secilen.filter(r => mamulTopluTemizlemeStokVarMi(r.desen_kodu));
        if (stoklu.length && !window._mamulTopluTemizlemeStokluSil) {
            const msg = `${stoklu.length} kayıtta depo stoku var. Yine de silmek için "Stoklu kayıtları da sil" kutusunu işaretleyin.\n\n` +
                stoklu.slice(0, 8).map(r => '• ' + r.desen_kodu).join('\n');
            if (typeof erpToast === 'function') erpToast(msg, 'warn', 9000);
            else alert(msg);
            return;
        }
        const kodList = secilen.map(r => r.desen_kodu).slice(0, 12).join('\n') +
            (secilen.length > 12 ? `\n… +${secilen.length - 12} kayıt` : '');
        if (!confirm(`⚠️ ${secilen.length} mamül stok kartı KALICI olarak silinecek:\n\n${kodList}\n\nDevam edilsin mi?`)) return;
        if (!confirm('Son onay: Bu işlem geri alınamaz. Silmek istediğinize emin misiniz?')) return;

        let silinen = 0;
        let hatalar = [];
        for (const id of ids) {
            const { error } = await sb.from('kumas_kutuphanesi').delete().eq('id', id);
            if (error) hatalar.push(error.message);
            else silinen++;
        }
        window._mamulTopluTemizlemeSecili.clear();
        try {
            if (Array.isArray(dataCache?.kumas_kutuphanesi)) {
                const idSet = new Set(ids.map(String));
                dataCache.kumas_kutuphanesi = dataCache.kumas_kutuphanesi.filter(r => !idSet.has(String(r.id)));
                if (typeof stockCards !== 'undefined') stockCards = dataCache.kumas_kutuphanesi;
            }
        } catch (e) {}
        if (typeof erpSyncTablesBackground === 'function') erpSyncTablesBackground(['kumas_kutuphanesi']);
        else if (typeof syncAllData === 'function') {
            syncAllData(false, { silent: true, light: true, tables: ['kumas_kutuphanesi'] }).catch(() => {});
        }
        if (typeof loadData === 'function') loadData();
        else if (typeof renderInputs === 'function') renderInputs();
        const msg = silinen + ' kayıt silindi' + (hatalar.length ? ' · ' + hatalar.length + ' hata' : '');
        if (typeof erpToast === 'function') erpToast(msg, hatalar.length ? 'warn' : 'success', 8000);
        else alert(msg);
    };

    function mamulTopluTemizlemePanelHtml(compact) {
        if (!window._mamulTopluTemizlemeAcik) {
            return `<div class="mamul-toplu-wrap mamul-toplu-wrap--collapsed">
                <button type="button" class="btn-pro btn-danger-pro" style="padding:6px 12px;font-size:10px" onclick="mamulTopluTemizlemeTogglePanel()">⚠ Toplu temizleme (geçici)</button>
            </div>`;
        }
        const filtre = window._mamulTopluTemizlemeFiltre || 'TUMU';
        const stokluChk = window._mamulTopluTemizlemeStokluSil ? 'checked' : '';
        return `<div class="mamul-toplu-wrap" id="mamul-toplu-panel">
            <div class="mamul-toplu-head">
                <div>
                    <div class="mamul-toplu-head__title">⚠ Mamül toplu temizleme <span class="pill pill-amber" style="font-size:7px;margin-left:6px">GEÇİCİ</span></div>
                    <div class="mamul-toplu-head__sub" id="mamul-toplu-ozet">Yükleniyor…</div>
                </div>
                <button type="button" class="btn-pro" style="padding:5px 10px;font-size:9px" onclick="mamulTopluTemizlemeTogglePanel()" title="Paneli gizle">Gizle</button>
            </div>
            <div class="mamul-toplu-controls">
                <input id="mamul-toplu-ara" type="search" class="pro-input" placeholder="Kod, ürün, firma ara…" oninput="mamulTopluTemizlemeListeRender()" style="font-size:10px;flex:1;min-width:140px">
                <select class="pro-input" style="font-size:10px;width:auto" onchange="mamulTopluTemizlemeFiltreDegistir(this.value)">
                    <option value="TUMU"${filtre === 'TUMU' ? ' selected' : ''}>Tüm mamül</option>
                    <option value="ESKI"${filtre === 'ESKI' ? ' selected' : ''}>Eski format (2026-001, MA-…)</option>
                    <option value="YENI_DISI"${filtre === 'YENI_DISI' ? ' selected' : ''}>Yeni format dışı</option>
                    <option value="ANA"${filtre === 'ANA' ? ' selected' : ''}>Yalnız ana kart</option>
                    <option value="VARYANT"${filtre === 'VARYANT' ? ' selected' : ''}>Yalnız varyant</option>
                </select>
                <button type="button" class="btn-pro" style="padding:5px 8px;font-size:9px" onclick="mamulTopluTemizlemeSecHepsi()">Tümünü seç</button>
                <button type="button" class="btn-pro" style="padding:5px 8px;font-size:9px" onclick="mamulTopluTemizlemeSecTemizle()">Seçimi temizle</button>
            </div>
            <div class="mamul-toplu-actions">
                <label style="font-size:9px;color:var(--text3);display:flex;align-items:center;gap:6px;cursor:pointer">
                    <input type="checkbox" ${stokluChk} onchange="mamulTopluTemizlemeStokluSilToggle(this)"> Stoklu kayıtları da sil
                </label>
                <span id="mamul-toplu-sec-count" class="pill pill-blue" style="font-size:9px">Seçili: 0</span>
                <button type="button" id="mamul-toplu-sil-btn" class="btn-pro btn-danger-pro" style="padding:6px 14px;font-size:10px;margin-left:auto" disabled onclick="mamulTopluTemizlemeSil()">Seçilenleri sil</button>
            </div>
            <div id="mamul-toplu-liste" class="mamul-toplu-liste"></div>
        </div>`;
    }
    window.mamulTopluTemizlemePanelHtml = mamulTopluTemizlemePanelHtml;

    window.mamulTopluTemizlemePanelInit = function () {
        if (!document.getElementById('mamul-toplu-panel')) return;
        mamulTopluTemizlemeListeRender();
    };
    /* ===== TEMP: MAMUL TOPLU TEMIZLEME SON ===== */
})();
