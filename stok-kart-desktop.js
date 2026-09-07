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

    function mamulUrunGrubuNormalize(s) {
        return String(s || '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('tr-TR');
    }
    window.mamulUrunGrubuNormalize = mamulUrunGrubuNormalize;

    function mamulUrunGrubuOku(kart) {
        const meta = mamulEkAlanMetaDecode(kart?.notlar);
        return mamulUrunGrubuNormalize(meta.urun_grubu || kart?.urun_grubu);
    }
    window.mamulUrunGrubuOku = mamulUrunGrubuOku;

    function mamulUrunGrubuSecenekleri() {
        const set = new Map();
        const kartlar = (typeof dataCache !== 'undefined' && dataCache.kumas_kutuphanesi) ? dataCache.kumas_kutuphanesi : [];
        kartlar.forEach(k => {
            if (typeof kumasKutuphanesiKartiMamulMu === 'function' && !kumasKutuphanesiKartiMamulMu(k)) return;
            const g = mamulUrunGrubuOku(k);
            if (g) set.set(g, true);
        });
        return [...set.keys()].sort((a, b) => a.localeCompare(b, 'tr'));
    }
    window.mamulUrunGrubuSecenekleri = mamulUrunGrubuSecenekleri;

    function mamulUrunGrubuDatalistDoldur() {
        const dl = document.getElementById('mamul-urun-grubu-list');
        if (!dl) return;
        const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        dl.innerHTML = mamulUrunGrubuSecenekleri().map(g => `<option value="${esc(g)}">`).join('');
    }
    window.mamulUrunGrubuDatalistDoldur = mamulUrunGrubuDatalistDoldur;

    function mamulListeBaslikGoster(s) {
        const t = String(s || '').trim();
        if (!t) return '';
        const harf = t.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, '');
        if (!harf) return t;
        if (harf !== harf.toLocaleUpperCase('tr-TR')) return t;
        return t.toLocaleLowerCase('tr-TR').replace(/(^|[\s(\/\-*])(\S)/g, (m, a, b) => a + b.toLocaleUpperCase('tr-TR'));
    }
    window.mamulListeBaslikGoster = mamulListeBaslikGoster;

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

    /* Varyant fotoğraflarını bellekte tut: { v1: 'data:image/...', v2: ... } */
    if (!window._mamulVaryantFotolar) window._mamulVaryantFotolar = {};

    window.mamulVaryantFotoYukle = function(vNo, input) {
        const file = input?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result;
            window._mamulVaryantFotolar[`v${vNo}`] = base64;
            const preview = document.getElementById(`val-mamul-v${vNo}-foto-preview`);
            const ph = document.getElementById(`val-mamul-v${vNo}-foto-ph`);
            if (preview) { preview.src = base64; preview.style.display = 'inline-block'; }
            if (ph) ph.textContent = '✓ Değiştir';
        };
        reader.readAsDataURL(file);
    };


    window.mamulVaryantFotoDoldur = function(vNo, base64) {
        if (!base64) return;
        window._mamulVaryantFotolar[`v${vNo}`] = base64;
        const preview = document.getElementById(`val-mamul-v${vNo}-foto-preview`);
        const ph = document.getElementById(`val-mamul-v${vNo}-foto-ph`);
        if (preview) { preview.src = base64; preview.style.display = 'inline-block'; }
        if (ph) ph.textContent = '✓ Değiştir';
    };

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
            const varyant = {
                renk_etiket: g(`val-mamul-v${v}-renk-etiket`),
                atki
            };
            const foto = window._mamulVaryantFotolar?.[`v${v}`];
            if (foto) varyant.fotograf = foto;
            varyantlar.push(varyant);
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
        const fotoRow = `<tr>
                <td style="font-size:8px;color:var(--text3)">FOTO</td>
                ${nums.map(v => `
                    <td colspan="3" style="padding:4px 3px;vertical-align:middle">
                        <label for="val-mamul-v${v}-foto" style="display:inline-flex;align-items:center;gap:5px;cursor:pointer;border:1px dashed var(--border2);border-radius:5px;padding:3px 6px;background:var(--surface);font-size:8px;color:var(--text3);white-space:nowrap">
                            <img id="val-mamul-v${v}-foto-preview" style="width:32px;height:32px;object-fit:contain;border-radius:4px;border:1px solid var(--border);background:var(--surface2);display:none">
                            <span id="val-mamul-v${v}-foto-ph">📷 Ekle</span>
                        </label>
                        <input type="file" id="val-mamul-v${v}-foto" accept="image/*" class="hidden" onchange="mamulVaryantFotoYukle(${v},this)">
                    </td>
                `).join('')}
            </tr>`;
        const varyantRows = renkAdiRow + fotoRow + [1, 2, 3, 4, 5, 6].map(a => `
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
                // Varyant fotoğrafı
                if (vv.fotograf) {
                    if (typeof mamulVaryantFotoDoldur === 'function') mamulVaryantFotoDoldur(v, vv.fotograf);
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
        const grupHam = String(meta.urun_grubu || ana?.urun_grubu || kart?.urun_grubu || '').trim();
        const grup = mamulUrunGrubuNormalize(grupHam);
        const baslikParcalari = [];
        if (desen) baslikParcalari.push(desen);
        if (urun && urun.toLocaleUpperCase('tr-TR') !== desen.toLocaleUpperCase('tr-TR')) baslikParcalari.push(urun);
        const adHam = baslikParcalari.length ? baslikParcalari.join(' · ') : (etiket.ad || '—');
        return {
            ad: mamulListeBaslikGoster(adHam),
            desen: mamulListeBaslikGoster(desen),
            urun: mamulListeBaslikGoster(urun),
            ebat: mamulListeBaslikGoster(ebat),
            renk: mamulListeBaslikGoster(renk),
            musteri: mamulListeBaslikGoster(musteri),
            grup: mamulListeBaslikGoster(grupHam) || grup
        };
    }
    window.mamulTopluUrunDetayOlustur = mamulTopluUrunDetayOlustur;


    function mamulDepoStokAramaMetni(stokKodu, detay, ek) {
        return [
            stokKodu,
            detay?.desen,
            detay?.urun,
            detay?.ad,
            detay?.ebat,
            detay?.renk,
            detay?.musteri,
            detay?.grup,
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

    function kumasStokHareketKoduOku(x) {
        return String(x?.stok_kodu || x?.desen_kodu || '').trim().toUpperCase();
    }
    window.kumasStokHareketKoduOku = kumasStokHareketKoduOku;

    /* ── BAKİYE İNDEKSİ ──────────────────────────────────────────────────
       Stok kartı listeleri her satır için bakiye ister. İndeks olmadan her
       istek tüm hareket tablosunu baştan tarar; maliyet kart × hareket
       olarak büyür. Burada hareketler tek geçişte Map'lere toplanır, satır
       başına maliyet O(1)'e iner. İndeks dizi referansı veya uzunluğu
       değişince kendini yeniler; satır bazlı canlı güncellemelerde
       erpBakiyeIndexInvalidate() çağrılır.                                */
    const _erpBakiyeIdx = {
        kumasKod: null,   // Map<"ANAKOD|varyantNo", bakiye>
        kumasAile: null,  // Map<"ANAKOD", bakiye>
        mamulKod: null,   // Map<stokKodu, bakiye>
        iplikKod: null,   // Map<stokKodu, bakiye + lots>
        iplikRows: null,
        kumasSrc: null,
        kumasLen: -1,
        iplikSrc: null,
        iplikLen: -1
    };

    function erpBakiyeIndexInvalidate() {
        _erpBakiyeIdx.kumasKod = null;
        _erpBakiyeIdx.kumasAile = null;
        _erpBakiyeIdx.mamulKod = null;
        _erpBakiyeIdx.iplikKod = null;
        _erpBakiyeIdx.iplikRows = null;
        _erpBakiyeIdx.kumasSrc = null;
        _erpBakiyeIdx.iplikSrc = null;
        _erpBakiyeIdx.kumasLen = -1;
        _erpBakiyeIdx.iplikLen = -1;
    }
    window.erpBakiyeIndexInvalidate = erpBakiyeIndexInvalidate;

    function erpBakiyeBos() {
        return { kg: 0, mt: 0, adet: 0 };
    }

    function erpBakiyeTopla(hedef, x) {
        hedef.kg += parseFloat(x.miktar_kg) || 0;
        hedef.mt += parseFloat(x.miktar_mt) || 0;
        hedef.adet += parseInt(x.cuval_sayisi, 10) || 0;
    }

    function erpBakiyeKopya(b) {
        return b ? { kg: b.kg, mt: b.mt, adet: b.adet } : erpBakiyeBos();
    }

    /** kumas_stok tek geçiş: kumaş kodu · kumaş ailesi · mamül kodu indeksleri */
    function kumasBakiyeIndexAl() {
        const src = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.kumas_stok))
            ? dataCache.kumas_stok
            : [];
        if (_erpBakiyeIdx.kumasKod && _erpBakiyeIdx.kumasSrc === src && _erpBakiyeIdx.kumasLen === src.length) {
            return _erpBakiyeIdx;
        }
        const kodMap = new Map();
        const aileMap = new Map();
        const mamulMap = new Map();
        const mamulMu = typeof kumasStokHareketiMamulDepoMu === 'function' ? kumasStokHareketiMamulDepoMu : null;
        for (let n = 0; n < src.length; n++) {
            const x = src[n];
            if (!x) continue;
            /* kumasStokHareketiKumasDepoMu = !MamulDepoMu — tek kontrol yeterli */
            if (mamulMu && mamulMu(x)) {
                const kod = String(x.stok_kodu || '').trim().toUpperCase();
                if (!kod) continue;
                let m = mamulMap.get(kod);
                if (!m) { m = erpBakiyeBos(); mamulMap.set(kod, m); }
                erpBakiyeTopla(m, x);
                continue;
            }
            const hk = kumasStokHareketKoduOku(x);
            if (!hk) continue;
            const ana = kumasAnaKodBul(hk);
            const vNo = kumasVaryantNoBul(hk);
            const key = ana + '|' + vNo;
            let k = kodMap.get(key);
            if (!k) { k = erpBakiyeBos(); kodMap.set(key, k); }
            erpBakiyeTopla(k, x);
            let a = aileMap.get(ana);
            if (!a) { a = erpBakiyeBos(); aileMap.set(ana, a); }
            erpBakiyeTopla(a, x);
        }
        _erpBakiyeIdx.kumasKod = kodMap;
        _erpBakiyeIdx.kumasAile = aileMap;
        _erpBakiyeIdx.mamulKod = mamulMap;
        _erpBakiyeIdx.kumasSrc = src;
        _erpBakiyeIdx.kumasLen = src.length;
        return _erpBakiyeIdx;
    }
    window.kumasBakiyeIndexAl = kumasBakiyeIndexAl;

    function depoMamulBakiyeHesapla(stokKodu) {
        const kod = String(stokKodu || '').trim().toUpperCase();
        if (!kod) return erpBakiyeBos();
        return erpBakiyeKopya(kumasBakiyeIndexAl().mamulKod.get(kod));
    }
    window.depoMamulBakiyeHesapla = depoMamulBakiyeHesapla;

    /** Kumaş deposu net bakiye (açılış + giriş − çıkış) — tek stok kodu (SM-0016 ↔ SM0016) */
    function depoKumasBakiyeHesapla(stokKodu) {
        const kod = String(stokKodu || '').trim().toUpperCase();
        if (!kod) return erpBakiyeBos();
        const key = kumasAnaKodBul(kod) + '|' + kumasVaryantNoBul(kod);
        return erpBakiyeKopya(kumasBakiyeIndexAl().kumasKod.get(key));
    }
    window.depoKumasBakiyeHesapla = depoKumasBakiyeHesapla;

    /** Ana kart + tüm varyant kodları (SM-0016, SM-0016-1 …) toplam bakiye */
    function depoKumasAileBakiyeHesapla(anaKod) {
        const ana = kumasAnaKodBul(anaKod);
        if (!ana) return erpBakiyeBos();
        return erpBakiyeKopya(kumasBakiyeIndexAl().kumasAile.get(ana));
    }
    window.depoKumasAileBakiyeHesapla = depoKumasAileBakiyeHesapla;

    /** Boyalı varyant bakiyesi: yalnız SM-XXXX-N hareketleri */
    function depoKumasVaryantBakiyeHesapla(anaKod, vNo) {
        const ana = kumasAnaKodBul(anaKod);
        const v = Math.max(1, parseInt(vNo, 10) || 1);
        if (!ana) return erpBakiyeBos();
        return erpBakiyeKopya(kumasBakiyeIndexAl().kumasKod.get(ana + '|' + v));
    }
    window.depoKumasVaryantBakiyeHesapla = depoKumasVaryantBakiyeHesapla;

    /** Ana karttaki miktar_mt önbelleği (yalnız SM-XXXX, varyant kayıtları sayılmaz) */
    function kumasAileKartMiktarMt(anaKod) {
        const ana = kumasAnaKodBul(anaKod);
        if (!ana) return 0;
        let mt = 0;
        (dataCache.kumas_kutuphanesi || []).forEach(k => {
            const kod = String(k.desen_kodu || k.stok_kodu || '').trim().toUpperCase();
            if (kumasAnaKodBul(kod) !== ana || kumasVaryantNoBul(kod) > 0) return;
            const m = parseFloat(k.miktar_mt);
            if (Number.isFinite(m)) mt += m;
        });
        return mt;
    }
    window.kumasAileKartMiktarMt = kumasAileKartMiktarMt;

    /** Depo hareketleri + kart önbelleği — stok kartı listesinde gösterilecek canlı mt */
    function kumasAileCanliStokMt(anaKod) {
        const hMt = parseFloat(depoKumasAileBakiyeHesapla(anaKod)?.mt) || 0;
        if (hMt !== 0) return hMt;
        return kumasAileKartMiktarMt(anaKod);
    }
    window.kumasAileCanliStokMt = kumasAileCanliStokMt;

    /** iplik_stok tek geçiş: stok kodu + lot bazlı bakiye indeksi */
    function iplikBakiyeIndexAl() {
        const src = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.iplik_stok))
            ? dataCache.iplik_stok
            : [];
        if (_erpBakiyeIdx.iplikKod && _erpBakiyeIdx.iplikSrc === src && _erpBakiyeIdx.iplikLen === src.length) {
            return _erpBakiyeIdx.iplikKod;
        }
        const rows = typeof iplikDepoStokHareketleriHazirla === 'function'
            ? iplikDepoStokHareketleriHazirla(src)
            : src.filter(r => typeof iplikDepoHareketiMi === 'function' ? iplikDepoHareketiMi(r) : true);
        const kodMap = new Map();
        for (let n = 0; n < rows.length; n++) {
            const x = rows[n];
            if (!x) continue;
            const kod = String(x.stok_kodu || '').trim().toUpperCase();
            if (!kod) continue;
            let e = kodMap.get(kod);
            if (!e) { e = { kg: 0, mt: 0, adet: 0, lots: {} }; kodMap.set(kod, e); }
            const k = parseFloat(x.miktar_kg) || 0;
            const m = parseFloat(x.miktar_mt) || 0;
            const a = parseInt(x.cuval_sayisi, 10) || 0;
            e.kg += k;
            e.mt += m;
            e.adet += a;
            const lotKey = String(x.lot_no || 'LOTSUZ').trim().toUpperCase() || 'LOTSUZ';
            if (!e.lots[lotKey]) e.lots[lotKey] = { kg: 0, mt: 0, adet: 0 };
            e.lots[lotKey].kg += k;
            e.lots[lotKey].mt += m;
            e.lots[lotKey].adet += a;
        }
        _erpBakiyeIdx.iplikKod = kodMap;
        _erpBakiyeIdx.iplikRows = rows;
        _erpBakiyeIdx.iplikSrc = src;
        _erpBakiyeIdx.iplikLen = src.length;
        return kodMap;
    }
    window.iplikBakiyeIndexAl = iplikBakiyeIndexAl;

    /** İplik deposu net bakiye (kart açılış + hareketler) */
    function depoIplikBakiyeHesapla(stokKodu) {
        const kod = String(stokKodu || '').trim().toUpperCase();
        if (!kod) return { kg: 0, mt: 0, adet: 0, lots: {} };
        const hit = iplikBakiyeIndexAl().get(kod);
        if (!hit) return { kg: 0, mt: 0, adet: 0, lots: {} };
        const lots = {};
        for (const lotKey in hit.lots) {
            const l = hit.lots[lotKey];
            lots[lotKey] = { kg: l.kg, mt: l.mt, adet: l.adet };
        }
        return { kg: hit.kg, mt: hit.mt, adet: hit.adet, lots };
    }
    window.depoIplikBakiyeHesapla = depoIplikBakiyeHesapla;

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
            urun_grubu: String(meta.urun_grubu || '').trim(),
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

        const foto = (typeof kartFotografSheetHtml === 'function')
            ? kartFotografSheetHtml(record)
            : `<div class="mamul-talimat-sheet__foto"><div class="mamul-talimat-sheet__foto-baslik">KUMAŞ ÖRNEĞİ</div><div class="mamul-talimat-sheet__foto-yok">Fotoğraf yok</div></div>`;

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

    function kumasDokumaTxt(rec, ...keys) {
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const v = typeof kumasAlan === 'function' ? kumasAlan(rec, key, '') : rec?.[key];
            if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
        }
        return '';
    }

    function kumasDokumaAlanlariOku(i) {
        const rec = i || {};
        const kod = String(rec.desen_kodu || rec.stok_kodu || '').trim();
        const anaGrupHam = typeof kumasKartAnaGrupHam === 'function' ? kumasKartAnaGrupHam(rec) : kumasDokumaTxt(rec, 'ana_grup');
        const anaGrup = typeof kumasAnaGrupEtiket === 'function' ? (kumasAnaGrupEtiket(anaGrupHam) || anaGrupHam) : anaGrupHam;
        const hamEn = kumasDokumaTxt(rec, 'ham_en');
        const hamBoy = kumasDokumaTxt(rec, 'ham_boy');
        const mamulEn = kumasDokumaTxt(rec, 'mamul_en');
        const mamulBoy = kumasDokumaTxt(rec, 'mamul_boy');
        const atki = kumasAtkiReceteParse(rec);
        const atkiOzet = atki.map(a => [a.iplik_no, a.cins, a.renk].filter(Boolean).join(' ')).filter(Boolean).join(' | ');
        return {
            stok_kodu: kod,
            tarih: rec.created_at ? new Date(rec.created_at).toLocaleDateString('tr-TR') : '',
            kalite: kumasDokumaTxt(rec, 'kalite') || 'AKTİF',
            musteri: kumasDokumaTxt(rec, 'firma', 'marka'),
            desen_adi: kumasDokumaTxt(rec, 'desen_adi'),
            urun_adi: kumasDokumaTxt(rec, 'urun_adi'),
            kumas_cinsi: kumasDokumaTxt(rec, 'kumas_cinsi'),
            ana_grup: anaGrup,
            terbiye: typeof kumasStokListeTerbiyeTur === 'function' ? (kumasStokListeTerbiyeTur(rec) || kumasDokumaTxt(rec, 'terbiye', 'terbiye_turu')) : kumasDokumaTxt(rec, 'terbiye', 'terbiye_turu'),
            tarak_no: kumasDokumaTxt(rec, 'tarak_no'),
            tarak_eni: kumasDokumaTxt(rec, 'tarak_eni'),
            atki_sikligi: kumasDokumaTxt(rec, 'atki_sikligi', 'atki_siklik'),
            cozgu_sikligi: kumasDokumaTxt(rec, 'cozgu_sikligi', 'dizim_sikligi'),
            cozgu_no: kumasDokumaTxt(rec, 'cozgu_no'),
            cozgu_cinsi: kumasDokumaTxt(rec, 'cozgu_cinsi', 'cozgu_ipi'),
            ham_en: hamEn,
            ham_boy: hamBoy,
            ham_ebat: hamEn && hamBoy ? `${hamEn}*${hamBoy}` : (hamEn || hamBoy),
            ham_gramaj: kumasDokumaTxt(rec, 'ham_gramaj'),
            ham_gsm: kumasDokumaTxt(rec, 'ham_gsm'),
            mamul_en: mamulEn,
            mamul_boy: mamulBoy,
            mamul_ebat: mamulEn && mamulBoy ? `${mamulEn}*${mamulBoy}` : (mamulEn || mamulBoy),
            mamul_gramaj: kumasDokumaTxt(rec, 'mamul_gramaj'),
            mamul_gsm: kumasDokumaTxt(rec, 'mamul_gsm', 'gsm'),
            boya_not: kumasDokumaTxt(rec, 'boya_not'),
            cekme: kumasDokumaTxt(rec, 'cekme'),
            atki_recete: atkiOzet || kumasDokumaTxt(rec, 'atki_renkleri', 'atki_ipi')
        };
    }
    window.kumasDokumaAlanlariOku = kumasDokumaAlanlariOku;

    const KUMAS_TALIMAT_SATIRLARI = [
        [['musteri', 'MÜŞTERİ'], ['kumas_cinsi', 'KUMAŞ CİNSİ'], ['ana_grup', 'ANA GRUP']],
        [['desen_adi', 'DESEN ADI'], ['urun_adi', 'ÜRÜN ADI'], ['terbiye', 'TERBİYE']],
        [['tarak_no', 'TARAK NO'], ['tarak_eni', 'TARAK ENİ'], ['atki_sikligi', 'ATKI SIKLIĞI']],
        [['cozgu_sikligi', 'ÇÖZGÜ SIKLIĞI'], ['cozgu_no', 'ÇÖZGÜ NO'], ['cozgu_cinsi', 'ÇÖZGÜ CİNSİ']],
        [['ham_en', 'HAM EN (CM)'], ['ham_boy', 'HAM BOY (MT)'], ['ham_gramaj', 'HAM GR/MTÜL']],
        [['ham_gsm', 'HAM GSM'], ['mamul_en', 'MAMÜL EN (CM)'], ['mamul_boy', 'MAMÜL BOY (MT)']],
        [['mamul_gramaj', 'MAMÜL GR/MTÜL'], ['mamul_gsm', 'MAMÜL GSM'], ['cekme', 'ÇEKME PAYI (%)']],
        [['boya_not', 'BOYA / BASKI NOTU'], null, null],
    ];
    const KUMAS_TALIMAT_KIRMIZI = new Set(['tarak_eni', 'atki_sikligi', 'cozgu_sikligi', 'terbiye', 'ham_en']);

    function kumasAtkiReceteParse(rec) {
        const meta = typeof kumasMetaAl === 'function' ? (kumasMetaAl(rec) || {}) : {};
        const fromArr = (arr) => (Array.isArray(arr) ? arr : [])
            .map(a => ({
                iplik_no: String(a?.iplik_no || a?.no || '').trim(),
                cins: String(a?.cinsi || a?.cins || '').trim(),
                renk: String(a?.renk || '').trim()
            }))
            .filter(a => a.iplik_no || a.cins || a.renk);
        const fromMeta = fromArr(meta.ham_atki?.length ? meta.ham_atki : meta.atki);
        if (fromMeta.length) return fromMeta;
        const raw = String(rec?.atki_renkleri || meta.atki_renkleri || '').trim();
        if (!raw) return [];
        return raw.split('|').map(part => {
            const p = String(part || '').trim();
            if (!p) return null;
            const parts = p.split(/\s+-\s+/).map(x => x.trim());
            const row = { iplik_no: parts[0] || '', cins: parts[1] || '', renk: parts[2] || '' };
            if (!row.iplik_no && !row.cins && !row.renk) return null;
            return row;
        }).filter(Boolean);
    }
    window.kumasAtkiReceteParse = kumasAtkiReceteParse;

    function kumasAtkiReceteDetayHtml(record) {
        const atki = kumasAtkiReceteParse(record);
        if (!atki.length) return '';
        const esc = (v) => typeof pdfEsc === 'function' ? pdfEsc(v) : String(v ?? '');
        const satirlar = atki.map((a, i) => `<tr>
            <td>ATKI ${i + 1}</td>
            <td>${esc(a.iplik_no || '—')}</td>
            <td>${esc(a.cins || '—')}</td>
            <td>${esc(a.renk || '—')}</td>
        </tr>`).join('');
        return `<div class="mamul-atki-excel-wrap kumas-atki-recete">
            <div class="mamul-varyant-baslik">Atkı iplik reçetesi</div>
            <table class="mamul-atki-excel-tablo">
                <thead><tr><th>Atkı</th><th>İplik no</th><th>Cins</th><th>Renk</th></tr></thead>
                <tbody>${satirlar}</tbody>
            </table>
        </div>`;
    }
    window.kumasAtkiReceteDetayHtml = kumasAtkiReceteDetayHtml;

    function kumasDokumaTalimatDetayPanelHtml(record, opts) {
        const o = opts || {};
        const d = kumasDokumaAlanlariOku(record);
        const kod = String(record?.desen_kodu || d.stok_kodu || '').trim();
        const esc = (v) => typeof pdfEsc === 'function' ? pdfEsc(v) : String(v ?? '');

        const satirlar = KUMAS_TALIMAT_SATIRLARI.map(row => {
            const hucreler = row.map(pair => {
                if (!pair) return '<td class="mamul-talimat-tablo__lbl mamul-talimat-tablo__lbl--bos"></td><td class="mamul-talimat-tablo__val mamul-talimat-tablo__val--bos"></td>';
                const [key, label] = pair;
                const v = String(d[key] ?? '').trim();
                const valCls = KUMAS_TALIMAT_KIRMIZI.has(key) && v ? ' mamul-talimat-tablo__val--kirmizi' : (!v ? ' mamul-talimat-tablo__val--bos' : '');
                return `<td class="mamul-talimat-tablo__lbl">${label}</td>
                    <td class="mamul-talimat-tablo__val${valCls}" title="${esc(v || '—')}">${esc(v || '—')}</td>`;
            }).join('');
            return `<tr>${hucreler}</tr>`;
        }).join('');

        const foto = (typeof kartFotografSheetHtml === 'function')
            ? kartFotografSheetHtml(record)
            : `<div class="mamul-talimat-sheet__foto"><div class="mamul-talimat-sheet__foto-baslik">KUMAŞ ÖRNEĞİ</div><div class="mamul-talimat-sheet__foto-yok">Fotoğraf yok</div></div>`;

        const aciklama = typeof kumasNotlarTemizle === 'function' ? kumasNotlarTemizle(record?.notlar || '') : '';
        const notHtml = aciklama
            ? `<div class="mamul-talimat-sheet__notlar"><span class="mamul-talimat-tablo__lbl">NOTLAR</span><span>${esc(aciklama)}</span></div>`
            : '';

        return `<div class="mamul-talimat-sheet mamul-talimat-sheet--kumas">
            <div class="mamul-talimat-sheet__baslik">${o.baslik || 'SİMTEKS TEKSTİL KUMAŞ DOKUMA TALİMAT KARTI'}</div>
            <div class="mamul-talimat-sheet__alt-baslik">
                <span>Stok kodu: <strong>${esc(kod)}</strong></span>
                <span>Tarih: <strong>${esc(d.tarih || '—')}</strong></span>
                <span>Durum: <strong>${esc(d.kalite || '—')}</strong></span>
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
    window.kumasDokumaTalimatDetayPanelHtml = kumasDokumaTalimatDetayPanelHtml;

    function renderKumasKartDetayModalHtml(kayit, idx) {
        const rec = kayit || {};
        const editIdx = typeof idx === 'number' ? idx : 0;
        let html = kumasDokumaTalimatDetayPanelHtml(rec, { baslik: 'SİMTEKS TEKSTİL KUMAŞ DOKUMA TALİMAT KARTI' });
        html += kumasAtkiReceteDetayHtml(rec);
        html += `<div style="padding:8px 14px 12px">${typeof renderKayitGecmisDetailsBlock === 'function' ? renderKayitGecmisDetailsBlock(rec.islem_gecmisi, '') : ''}</div>`;
        html += `<div class="mamul-kart-aksiyon-bar" style="background:rgba(52,211,153,0.06)">
            <button type="button" onclick="kumasKartTalimatYazdirByIdx(${editIdx})" class="btn-pro btn-primary-pro" style="flex:1;justify-content:center;padding:10px">🖨 Tezgaha ver (yazdır)</button>
            <button type="button" onclick="startEditingFromArchive(${editIdx})" class="btn-pro" style="padding:10px 14px">✏ Kartı düzenle</button>
        </div>`;
        return html;
    }
    window.renderKumasKartDetayModalHtml = renderKumasKartDetayModalHtml;

    function dokumaTalimatYazdirHtml(sheetInner, opts) {
        const o = opts || {};
        const title = o.title || 'Dokuma Talimat Kartı';
        return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>${title}</title>
<style>
@page { size: A4 portrait; margin: 8mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; background: #fff; }
.mamul-talimat-sheet__baslik { text-align: center; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 0 6px; }
.mamul-talimat-sheet__alt-baslik { display: flex; justify-content: center; gap: 18px; flex-wrap: wrap; font-size: 10px; padding: 0 0 8px; border-bottom: 1px solid #222; margin-bottom: 8px; }
.mamul-talimat-sheet__govde { display: grid; grid-template-columns: minmax(0, 1fr) 200px; gap: 8px; align-items: start; }
.mamul-talimat-tablo { width: 100%; border-collapse: collapse; font-size: 10px; }
.mamul-talimat-tablo td { border: 1px solid #222; padding: 4px 6px; vertical-align: middle; }
.mamul-talimat-tablo__lbl { width: 12%; background: #f3f3f3; font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; white-space: nowrap; }
.mamul-talimat-tablo__lbl--bos, .mamul-talimat-tablo__val--bos { background: #fff; color: #888; }
.mamul-talimat-tablo__val { font-weight: 600; }
.mamul-talimat-tablo__val--kirmizi { color: #b91c1c; font-weight: 800; }
.mamul-talimat-sheet__foto { border: 1px solid #222; padding: 6px; text-align: center; }
.mamul-talimat-sheet__foto-baslik { font-size: 8px; font-weight: 700; letter-spacing: 0.06em; margin-bottom: 4px; }
.mamul-talimat-sheet__foto img { max-width: 100%; max-height: 190px; object-fit: contain; }
.mamul-talimat-sheet__notlar { margin-top: 8px; border: 1px solid #222; padding: 6px 8px; font-size: 10px; display: grid; grid-template-columns: 90px 1fr; gap: 8px; }
.mamul-atki-excel-wrap { margin-top: 10px; }
.mamul-varyant-baslik { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
.mamul-atki-excel-tablo { width: 100%; border-collapse: collapse; font-size: 10px; }
.mamul-atki-excel-tablo th, .mamul-atki-excel-tablo td { border: 1px solid #222; padding: 4px 6px; text-align: left; }
.mamul-atki-excel-tablo th { background: #f3f3f3; font-size: 8px; }
.mamul-kart-aksiyon-bar, #kayit-gecmis-details, details { display: none !important; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>${sheetInner}</body></html>`;
    }

    window.kumasKartTalimatYazdir = function (record) {
        if (!record) return;
        const inner = kumasDokumaTalimatDetayPanelHtml(record, { baslik: 'SİMTEKS TEKSTİL KUMAŞ DOKUMA TALİMAT KARTI' })
            + kumasAtkiReceteDetayHtml(record);
        const kod = String(record.desen_kodu || record.stok_kodu || 'kumas');
        if (typeof erpPrintHtml === 'function') {
            erpPrintHtml(dokumaTalimatYazdirHtml(inner, { title: kod + ' — Kumaş dokuma talimatı' }), { title: kod });
        }
    };

    window.kumasKartTalimatYazdirByIdx = function (idx) {
        const rec = (typeof currentData !== 'undefined' && currentData[idx]) || null;
        if (!rec) return;
        window.kumasKartTalimatYazdir(rec);
    };

    window.mamulKartTalimatYazdir = function (record) {
        if (!record) return;
        const inner = mamulDokumaTalimatDetayPanelHtml(record, { baslik: 'SİMTEKS TEKSTİL DOKUMA TALİMAT KARTI' });
        const kod = String(record.desen_kodu || record.stok_kodu || 'mamul');
        if (typeof erpPrintHtml === 'function') {
            erpPrintHtml(dokumaTalimatYazdirHtml(inner, { title: kod + ' — Dokuma talimatı' }), { title: kod });
        }
    };

    window.mamulKartTalimatYazdirByIdx = function (idx) {
        const rec = (typeof currentData !== 'undefined' && currentData[idx]) || null;
        if (!rec) return;
        window.mamulKartTalimatYazdir(rec);
    };

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
        const metaVaryantlarHam = Array.isArray(meta.varyantlar) ? meta.varyantlar : [];
        const children = Array.isArray(grup?.children) ? grup.children : [];

        if (children.length) {
            return children.map((ch, i) => {
                const vNo = ch.varyantNo || (i + 1);
                const metaV = metaVaryantlarHam[vNo - 1] || metaVaryantlarHam[i] || {};
                const childRec = ch.record || {};
                let atki = Array.isArray(metaV.atki) ? metaV.atki : [];
                if (!atki.some(a => a?.iplik_no || a?.renk || a?.atki_sayisi) && childRec.atki_renkleri) {
                    atki = mamulAtkiRenkleriParse(childRec.atki_renkleri);
                }
                const renkEtiket = mamulVaryantRenkEtiket({ ...metaV, atki })
                    || String(childRec.renk || '').trim().toUpperCase();
                const sku = mamulVaryantKodFormatla(grup.anaKod, vNo);
                const gercekKod = String(childRec.desen_kodu || '').trim().toUpperCase();
                return {
                    no: vNo,
                    sku: gercekKod && gercekKod !== sku ? gercekKod : sku,
                    renk_etiket: renkEtiket,
                    atki: mamulAtkiSatirlariPad(atki, 6),
                    stok: stokKartDokumaAlanlariOku(childRec).depo_bakiye,
                    fotograf: metaV.fotograf || childRec.fotograf || null,
                    recordId: childRec.id || null,
                    idx: mamulIdxInCurrentData(childRec)
                };
            });
        }

        const metaVaryantlar = metaVaryantlarHam.filter(mamulVaryantDoluMu);
        if (metaVaryantlar.length) {
            return metaVaryantlar.map((v, i) => ({
                no: i + 1,
                sku: mamulVaryantKodFormatla(grup.anaKod, i + 1),
                renk_etiket: mamulVaryantRenkEtiket(v),
                atki: mamulAtkiSatirlariPad(v.atki, 6),
                stok: '—',
                fotograf: v.fotograf || null,
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
            const fotoHtml = v.fotograf
                ? `<img src="${v.fotograf}" style="width:36px;height:36px;object-fit:contain;border-radius:4px;border:1px solid var(--border);background:var(--surface2);vertical-align:middle;margin-left:6px">`
                : '';
            return `<th colspan="3" class="mamul-atki-excel-tablo__varyant-baslik">
                ${v.no}. VARYANT${renk}${fotoHtml}
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
            <button type="button" onclick="mamulKartTalimatYazdirByIdx(${editIdx})" class="btn-pro btn-primary-pro" style="flex:1;justify-content:center;padding:10px">🖨 Tezgaha ver (yazdır)</button>
            <button type="button" onclick="editMamulKartFromListe('${typeof erpAttr === 'function' ? erpAttr(anaKod) : anaKod}')" class="btn-pro" style="padding:10px 14px">✏ Dokuma talimat kartını düzenle</button>
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

    /** Yalnızca stok kartı tanımı — depo GİRİŞ/ÇIKIŞ satırları kart değildir. */
    function iplikKartTanimKaydiMi(r) {
        if (!r) return false;
        const kb = String(r.kaynak_birim || '').toUpperCase();
        if (kb === 'IPLIK_KART_GIRIS' || kb === 'KART_GIRIS') return true;
        if (kb === 'DEPO_HAREKET_IPLIK' || kb.startsWith('DEPO_HAREKET_') || kb === 'SEVKIYAT' || kb === 'IPLIK_KART_STOK') return false;
        const tip = String(r.islem_turu || '').toUpperCase().replace(/İ/g, 'I').replace(/Ç/g, 'C');
        if (tip === 'GIRIS' || tip === 'CIKIS') return false;
        const kg = Math.abs(parseFloat(r.miktar_kg) || 0);
        const mt = Math.abs(parseFloat(r.miktar_mt) || 0);
        const ad = Math.abs(parseInt(r.cuval_sayisi, 10) || 0);
        if (kg > 1e-9 || mt > 1e-9 || ad > 0) return false;
        const not = String(r.notlar || '');
        if (not.includes('[[IPLIK_LOTS:') || not.includes('[KART_LOT]')) return true;
        const kod = String(r.stok_kodu || '').trim().toUpperCase();
        return kod.startsWith('IP-') && kb !== 'IPLIK';
    }
    window.iplikKartTanimKaydiMi = iplikKartTanimKaydiMi;

    function iplikKartTanimTercihEt(a, b) {
        const skor = (x) => {
            const kb = String(x?.kaynak_birim || '').toUpperCase();
            const not = String(x?.notlar || '');
            let s = 0;
            if (kb === 'IPLIK_KART_GIRIS' || kb === 'KART_GIRIS') s += 1000;
            if (not.includes('[[IPLIK_LOTS:')) s += 100;
            s += new Date(x?.updated_at || x?.created_at || 0).getTime() / 1e13;
            return s;
        };
        return skor(a) >= skor(b);
    }

    function iplikStokKoduMaxBul(rows) {
        let max = 0;
        (rows || []).forEach(r => {
            const m = String(r?.stok_kodu || '').trim().match(/^IP-(\d+)$/i);
            if (m) max = Math.max(max, parseInt(m[1], 10) || 0);
        });
        return max;
    }
    function iplikStokKoduFormatla(n) {
        return `IP-${String(Math.max(1, parseInt(n, 10) || 1)).padStart(4, '0')}`;
    }
    function getNextIplikStokCodeSync() {
        const kartlar = typeof iplikKartlariListe === 'function' ? iplikKartlariListe() : [];
        const all = (typeof dataCache !== 'undefined' && dataCache.iplik_stok) ? dataCache.iplik_stok : [];
        return iplikStokKoduFormatla(Math.max(iplikStokKoduMaxBul(kartlar), iplikStokKoduMaxBul(all)) + 1);
    }
    async function getNextIplikStokCode() {
        let max = Math.max(
            iplikStokKoduMaxBul(typeof iplikKartlariListe === 'function' ? iplikKartlariListe() : []),
            iplikStokKoduMaxBul(typeof dataCache !== 'undefined' ? dataCache.iplik_stok : [])
        );
        try {
            if (typeof sb !== 'undefined' && sb) {
                const { data, error } = await sb.from('iplik_stok').select('stok_kodu').not('stok_kodu', 'is', null).like('stok_kodu', 'IP-%');
                if (!error) max = Math.max(max, iplikStokKoduMaxBul(data));
            }
        } catch (e) {}
        return iplikStokKoduFormatla(max + 1);
    }
    window.getNextIplikStokCode = getNextIplikStokCode;
    window.getNextIplikStokCodeSync = getNextIplikStokCodeSync;

    function kumasStokKoduMaxBul(rows, prefix) {
        const pfx = String(prefix || 'SM').toUpperCase();
        /* SM-0016 ve eski SM0016; varyant SM-0016-1 sayılmaz */
        const re = new RegExp('^' + pfx + '-?(\\d+)$', 'i');
        let max = 0;
        (rows || []).forEach(r => {
            const kod = String(r?.desen_kodu || r?.stok_kodu || '').trim();
            const m = kod.match(re);
            if (m) max = Math.max(max, parseInt(m[1], 10) || 0);
        });
        return max;
    }

    /** Canonical ana kod: SM-0001. SM0001 / SM-1 / SM0001-2 hepsi → SM-0001 */
    function kumasAnaKodBul(kod) {
        const s = String(kod || '').trim().toUpperCase();
        const m = s.match(/^(SM|NU)-?(\d+)(?:-\d+)?$/i);
        if (!m) return s;
        return String(m[1]).toUpperCase() + '-' + String(parseInt(m[2], 10)).padStart(4, '0');
    }
    window.kumasAnaKodBul = kumasAnaKodBul;

    function kumasVaryantNoBul(kod) {
        const s = String(kod || '').trim().toUpperCase();
        const m = s.match(/^(?:SM|NU)-?\d+-(\d+)$/i);
        return m ? (parseInt(m[1], 10) || 0) : 0;
    }
    window.kumasVaryantNoBul = kumasVaryantNoBul;

    /** Tam stok kodu: SM-0001 veya SM-0001-2 */
    function kumasStokKodCanon(kod) {
        const s = String(kod || '').trim().toUpperCase();
        if (!s) return '';
        const ana = kumasAnaKodBul(s);
        if (!/^(SM|NU)-\d+$/i.test(ana)) return s;
        const v = kumasVaryantNoBul(s);
        return v > 0 ? `${ana}-${v}` : ana;
    }
    window.kumasStokKodCanon = kumasStokKodCanon;

    /** Eski tire-siz yazım: SM0001 / SM0001-2 */
    function kumasStokKodLegacyCompact(kod) {
        const canon = kumasStokKodCanon(kod);
        const m = String(canon || '').match(/^(SM|NU)-(\d+)(?:-(\d+))?$/i);
        if (!m) return '';
        const base = m[1].toUpperCase() + m[2];
        return m[3] ? `${base}-${m[3]}` : base;
    }
    window.kumasStokKodLegacyCompact = kumasStokKodLegacyCompact;

    function kumasHamStokKoduFormatla(n, prefix) {
        const pfx = String(prefix || 'SM').toUpperCase();
        const num = Math.max(1, parseInt(n, 10) || 1);
        return pfx + '-' + String(num).padStart(4, '0');
    }
    window.kumasHamStokKoduFormatla = kumasHamStokKoduFormatla;

    function kumasVaryantKodFormatla(anaKod, vNo) {
        const ana = kumasAnaKodBul(anaKod);
        const v = Math.max(1, parseInt(vNo, 10) || 1);
        return `${ana}-${v}`;
    }
    window.kumasVaryantKodFormatla = kumasVaryantKodFormatla;

    /** Boyalı varyant kodu: SM-0001-1, SM-0001-2 … */
    function kumasVaryantStokKodu(anaKod, vNo) {
        return kumasVaryantKodFormatla(anaKod, vNo);
    }
    window.kumasVaryantStokKodu = kumasVaryantStokKodu;

    /** Yeni kartta boyalı varyant yok; gerektiğinde + ile eklenir */
    const KUMAS_VARYANT_BASLANGIC = 0;
    window.KUMAS_VARYANT_BASLANGIC = KUMAS_VARYANT_BASLANGIC;

    function kumasVaryantKolonSayisiAl() {
        const n = parseInt(window._kumasVaryantKolonSayisi, 10);
        return Number.isFinite(n) && n >= 0 ? n : KUMAS_VARYANT_BASLANGIC;
    }
    window.kumasVaryantKolonSayisiAl = kumasVaryantKolonSayisiAl;

    function kumasVaryantKolonSayisiIhtiyac(varyantlar, anaKod) {
        let max = 0;
        if (Array.isArray(varyantlar)) {
            varyantlar.forEach((v, i) => {
                if (kumasVaryantFormDoluMu(v)) max = Math.max(max, i + 1);
            });
            max = Math.max(max, varyantlar.length);
        }
        const ana = String(anaKod || '').trim().toUpperCase();
        if (ana) {
            (dataCache.kumas_kutuphanesi || []).forEach(rec => {
                const kod = String(rec.desen_kodu || rec.stok_kodu || '').trim().toUpperCase();
                if (kumasAnaKodBul(kod) !== ana) return;
                const vNo = kumasVaryantNoBul(kod);
                if (vNo > max) max = vNo;
            });
        }
        return max;
    }

    function kumasVaryantKolonSayisiAyarla(n) {
        const sayi = Math.max(0, parseInt(n, 10) || 0);
        window._kumasVaryantKolonSayisi = sayi;
        return sayi;
    }
    window.kumasVaryantKolonSayisiAyarla = kumasVaryantKolonSayisiAyarla;

    function kumasVaryantAtkiBosSatir() {
        return { iplik_no: '', cins: '', renk: '' };
    }

    /** Boyalı varyant: yalnızca renk bilgisi */
    function kumasVaryantBosHucre() {
        return { renk: '', renk_kodu: '', boya_not: '' };
    }

    function kumasVaryantFormDoluMu(v) {
        if (!v) return false;
        if (String(v.renk || '').trim()) return true;
        if (String(v.renk_kodu || '').trim()) return true;
        if (String(v.boya_not || '').trim()) return true;
        return false;
    }

    function kumasVaryantAtkiDensify(v) {
        const src = v && typeof v === 'object' ? v : {};
        return {
            renk: String(src.renk || '').trim(),
            renk_kodu: String(src.renk_kodu || '').trim(),
            boya_not: String(src.boya_not || src.terbiye || '').trim()
        };
    }

    const KUMAS_HAM_ATKI_MAX = 6;

    function kumasHamAtkiSatirSayisiAl() {
        return Math.max(1, Math.min(KUMAS_HAM_ATKI_MAX, parseInt(window._kumasHamAtkiSatirSayisi, 10) || 1));
    }

    function kumasHamAtkiSatirSayisiAyarla(n) {
        const sayi = Math.max(1, Math.min(KUMAS_HAM_ATKI_MAX, parseInt(n, 10) || 1));
        window._kumasHamAtkiSatirSayisi = sayi;
        return sayi;
    }

    function kumasHamAtkiSatirHtml(a, toplam) {
        const sil = toplam > 1
            ? `<button type="button" class="kumas-ham-atki-sil" onclick="kumasHamAtkiSatirSil(${a})" title="Satırı kaldır" aria-label="A${a} kaldır">×</button>`
            : `<span class="kumas-ham-atki-sil-ph" aria-hidden="true"></span>`;
        return `
            <span class="kumas-varyant-atki-label">A${a}</span>
            <input id="val-ham-a${a}-iplik" class="pro-input" placeholder="İplik no">
            <input id="val-ham-a${a}-cins" class="pro-input" placeholder="Cins">
            <input id="val-ham-a${a}-renk" class="pro-input" placeholder="Renk (ham)">
            ${sil}`;
    }

    function kumasHamAtkiGridHtml(satirSayisi) {
        const n = kumasHamAtkiSatirSayisiAyarla(satirSayisi);
        const rows = Array.from({ length: n }, (_, i) => kumasHamAtkiSatirHtml(i + 1, n)).join('');
        return `<div class="kumas-varyant-atki-grid" id="kumas-ham-atki-grid">
            <span class="kumas-varyant-atki-grid__head"></span>
            <span class="kumas-varyant-atki-grid__head">İplik</span>
            <span class="kumas-varyant-atki-grid__head">Cins</span>
            <span class="kumas-varyant-atki-grid__head">Renk</span>
            <span class="kumas-varyant-atki-grid__head"></span>
            ${rows}
        </div>`;
    }

    function kumasHamAtkiFormOku() {
        const n = kumasHamAtkiSatirSayisiAl();
        const atki = [];
        for (let a = 1; a <= n; a++) {
            atki.push({
                iplik_no: String(document.getElementById(`val-ham-a${a}-iplik`)?.value || '').trim(),
                cins: String(document.getElementById(`val-ham-a${a}-cins`)?.value || '').trim(),
                renk: String(document.getElementById(`val-ham-a${a}-renk`)?.value || '').trim()
            });
        }
        return atki;
    }
    window.kumasHamAtkiFormOku = kumasHamAtkiFormOku;

    function kumasHamAtkiGridYenile(satirSayisi, mevcutSatirlar) {
        const wrap = document.getElementById('kumas-ham-atki-wrap');
        if (!wrap) return;
        const list = Array.isArray(mevcutSatirlar) ? mevcutSatirlar : kumasHamAtkiFormOku();
        const n = kumasHamAtkiSatirSayisiAyarla(satirSayisi);
        wrap.innerHTML = kumasHamAtkiGridHtml(n);
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
        for (let a = 1; a <= n; a++) {
            const row = list[a - 1] || kumasVaryantAtkiBosSatir();
            set(`val-ham-a${a}-iplik`, row.iplik_no || '');
            set(`val-ham-a${a}-cins`, row.cins || '');
            set(`val-ham-a${a}-renk`, row.renk || '');
        }
        const ekleBtn = document.getElementById('kumas-ham-atki-ekle');
        if (ekleBtn) ekleBtn.disabled = n >= KUMAS_HAM_ATKI_MAX;
    }

    function kumasHamAtkiFormDoldur(atkiRows) {
        const list = (Array.isArray(atkiRows) ? atkiRows : [])
            .map(a => ({
                iplik_no: String(a?.iplik_no || '').trim(),
                cins: String(a?.cins || '').trim(),
                renk: String(a?.renk || '').trim()
            }))
            .filter(a => a.iplik_no || a.cins || a.renk);
        const n = Math.max(1, Math.min(KUMAS_HAM_ATKI_MAX, list.length || 1));
        if (document.getElementById('kumas-ham-atki-wrap')) {
            kumasHamAtkiGridYenile(n, list);
        } else {
            kumasHamAtkiSatirSayisiAyarla(n);
            for (let a = 1; a <= n; a++) {
                const row = list[a - 1] || kumasVaryantAtkiBosSatir();
                const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
                set(`val-ham-a${a}-iplik`, row.iplik_no || '');
                set(`val-ham-a${a}-cins`, row.cins || '');
                set(`val-ham-a${a}-renk`, row.renk || '');
            }
        }
    }
    window.kumasHamAtkiFormDoldur = kumasHamAtkiFormDoldur;

    window.kumasHamAtkiSatirEkle = function () {
        const mevcut = kumasHamAtkiFormOku();
        const n = kumasHamAtkiSatirSayisiAl();
        if (n >= KUMAS_HAM_ATKI_MAX) {
            if (typeof erpToast === 'function') erpToast(`En fazla ${KUMAS_HAM_ATKI_MAX} atkı ipliği`, 'warn', 2200);
            return;
        }
        kumasHamAtkiGridYenile(n + 1, mevcut);
        const next = document.getElementById(`val-ham-a${n + 1}-iplik`);
        if (next) next.focus();
    };

    window.kumasHamAtkiSatirSil = function (satirNo) {
        const a = Math.max(1, parseInt(satirNo, 10) || 1);
        const mevcut = kumasHamAtkiFormOku();
        if (mevcut.length <= 1) return;
        mevcut.splice(a - 1, 1);
        kumasHamAtkiGridYenile(Math.max(1, mevcut.length), mevcut);
    };

    function kumasHamAtkiHtml() {
        kumasHamAtkiSatirSayisiAyarla(1);
        return `<div class="kumas-ham-atki">
            <div class="kumas-varyant-card__atki-head kumas-ham-atki__head">
                <span>Atkı ipliği reçetesi — ham kumaş (ana stok kodu)</span>
                <button type="button" id="kumas-ham-atki-ekle" class="btn-pro btn-primary-pro kumas-ham-atki-ekle" onclick="kumasHamAtkiSatirEkle()">+ İplik ekle</button>
            </div>
            <div id="kumas-ham-atki-wrap">${kumasHamAtkiGridHtml(1)}</div>
        </div>`;
    }

    function kumasVaryantListesiNormalize(raw) {
        const arr = Array.isArray(raw) ? raw : [];
        return arr.map(kumasVaryantAtkiDensify);
    }
    window.kumasVaryantListesiNormalize = kumasVaryantListesiNormalize;

    function kumasVaryantAtkiSerilestir(atki) {
        return (Array.isArray(atki) ? atki : [])
            .map(a => {
                const no = String(a?.iplik_no || '').trim();
                const c = String(a?.cins || '').trim();
                const r = String(a?.renk || '').trim();
                if (!no && !c && !r) return '';
                return `${no} - ${c} - ${r}`;
            })
            .filter(Boolean)
            .join(' | ');
    }

    function kumasFormAnaKodOku() {
        const raw = document.getElementById('val-kodu')?.value || '';
        return kumasAnaKodBul(raw);
    }
    window.kumasFormAnaKodOku = kumasFormAnaKodOku;

    function kumasVaryantKodOnizle(vNo) {
        const ana = kumasFormAnaKodOku();
        const v = Math.max(1, parseInt(vNo, 10) || 1);
        if (!ana) return `SM-XXXX-${v}`;
        return kumasVaryantStokKodu(ana, v);
    }
    window.kumasVaryantKodOnizle = kumasVaryantKodOnizle;

    function kumasVaryantKodBasliklariYenile() {
        const sayi = kumasVaryantKolonSayisiAl();
        for (let v = 1; v <= sayi; v++) {
            const head = document.getElementById(`kumas-varyant-col-${v}`);
            if (!head) continue;
            const kod = kumasVaryantKodOnizle(v);
            head.innerHTML = `<span class="mamul-varyant-kod-baslik__kod">${kod}</span><span class="mamul-varyant-kod-baslik__v">Boyalı ${v}</span>`;
        }
        const barBtns = document.getElementById('kumas-varyant-bar-btns');
        if (barBtns) barBtns.innerHTML = kumasVaryantBarParcaHtml(sayi);
        const jump = document.getElementById('kumas-varyant-jump');
        if (jump) {
            const cur = jump.value;
            jump.innerHTML = `<option value="">Boyalı varyanta git…</option>${Array.from({ length: sayi }, (_, i) => {
                const v = i + 1;
                const kod = kumasVaryantKodOnizle(v);
                return `<option value="${v}">${kod}</option>`;
            }).join('')}`;
            if (cur && parseInt(cur, 10) <= sayi) jump.value = cur;
        }
        const oniz = document.getElementById('kumas-varyant-kod-onizle');
        if (oniz) {
            const ana = kumasAnaKodBul(document.getElementById('val-kodu')?.value || '') || 'SM-XXXX';
            if (sayi <= 0) {
                oniz.innerHTML = `Ham stok: <span style="font-family:'DM Mono',monospace;color:var(--emerald-c)">${ana}</span> · boyalı varyant yok`;
            } else {
                const ornek = sayi <= 3
                    ? Array.from({ length: sayi }, (_, i) => kumasVaryantStokKodu(ana, i + 1)).join(', ')
                    : `${kumasVaryantStokKodu(ana, 1)} … ${kumasVaryantStokKodu(ana, sayi)} (${sayi} renk)`;
                oniz.innerHTML = `Ham: <span style="font-family:'DM Mono',monospace;color:var(--emerald-c)">${ana}</span> · Boyalı: <span style="font-family:'DM Mono',monospace;color:var(--cyan-c)">${ornek}</span>`;
            }
        }
    }
    window.kumasVaryantKodBasliklariYenile = kumasVaryantKodBasliklariYenile;

    function kumasVaryantKartHtml(v) {
        const kod = kumasVaryantKodOnizle(v);
        const fld = (field, label, ph, extra) =>
            `<div class="kumas-varyant-field"><label>${label}</label><input id="val-kumas-v${v}-${field}" class="pro-input" placeholder="${ph || ''}"${extra || ''}></div>`;
        return `
        <div class="kumas-varyant-card kumas-varyant-card--renk" id="kumas-varyant-card-${v}">
            <div class="kumas-varyant-card__head">
                <div class="kumas-varyant-card__kod" id="kumas-varyant-col-${v}">
                    <span class="mamul-varyant-kod-baslik__kod">${kod}</span>
                    <span class="mamul-varyant-kod-baslik__v">Boyalı ${v}</span>
                </div>
                <div class="kumas-varyant-card__acts">
                    <button type="button" class="btn-pro btn-ghost-pro" onclick="kumasVaryantKartToggle(${v})" title="Daralt / genişlet">▾</button>
                    <button type="button" class="btn-pro btn-ghost-pro kumas-varyant-card__sil" onclick="kumasVaryantKartSil(${v})" title="${kod} varyantını sil">×</button>
                </div>
            </div>
            <div class="kumas-varyant-card__body">
                <div class="kumas-varyant-card__terbiye kumas-varyant-card__renk-only">
                    ${fld('renk', 'Boya rengi', 'Örn. ANTRASİT', ' style="text-transform:uppercase"')}
                    ${fld('renk_kodu', 'Renk / lab kodu', 'Kod', ' style="font-family:\'DM Mono\',monospace"')}
                    ${fld('boya_not', 'Boya notu', 'Opsiyonel not')}
                    <div class="kumas-varyant-field"><label>Stok ekle (mt) <span style="font-size:8px;color:var(--text3);font-weight:400">— depoya giriş hareketi yazılır</span></label><input id="val-kumas-v${v}-ilk_mt" class="pro-input" type="number" min="0" step="0.01" placeholder="0.00" style="font-family:'DM Mono',monospace"></div>
                </div>
            </div>
        </div>`;
    }

    function kumasVaryantBarParcaHtml(kolonSayisi) {
        const n = kolonSayisi || 0;
        if (n <= 0) {
            return `<span style="font-size:9px;color:var(--text3);font-family:'DM Mono',monospace">Boyalı varyant yok — gerektiğinde ekleyin</span>`;
        }
        return `<span style="font-size:9px;color:var(--text2);font-family:'DM Mono',monospace"><strong style="color:var(--cyan-c)">${n}</strong> boyalı renk · depoda ayrı stok</span>`;
    }

    function kumasVaryantDomKartSayisi() {
        return document.querySelectorAll('#kumas-varyant-list .kumas-varyant-card').length;
    }

    function kumasVaryantFormHazirla() {
        const listEl = document.getElementById('kumas-varyant-list');
        if (!listEl) return false;
        return true;
    }
    window.kumasVaryantFormHazirla = kumasVaryantFormHazirla;

    /** DOM'dan okur — FormHazirla/TabloYenile çağırmaz (sonsuz döngüyü önler) */
    function kumasVaryantFormVerisiOkuDom(kolonSayisi) {
        const g = (id) => {
            const el = document.getElementById(id);
            return el ? String(el.value ?? '').trim() : '';
        };
        const domSayi = kumasVaryantDomKartSayisi();
        const sayi = Math.max(
            kolonSayisi || 0,
            domSayi,
            kumasVaryantKolonSayisiAl(),
            0
        );
        const varyantlar = [];
        for (let v = 1; v <= sayi; v++) {
            varyantlar.push(kumasVaryantAtkiDensify({
                renk: g(`val-kumas-v${v}-renk`),
                renk_kodu: g(`val-kumas-v${v}-renk_kodu`),
                boya_not: g(`val-kumas-v${v}-boya_not`)
            }));
        }
        return varyantlar;
    }

    function kumasVaryantFormVerisiOku(kolonSayisi) {
        kumasVaryantFormHazirla();
        return kumasVaryantFormVerisiOkuDom(kolonSayisi);
    }
    window.kumasVaryantFormVerisiOku = kumasVaryantFormVerisiOku;

    function kumasVaryantTabloDoldur(varyantlar, kolonSayisi) {
        const list = kumasVaryantListesiNormalize(varyantlar);
        const sayi = kolonSayisi || kumasVaryantKolonSayisiAl();
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
        for (let v = 1; v <= sayi; v++) {
            const cell = list[v - 1] || kumasVaryantBosHucre();
            set(`val-kumas-v${v}-renk`, cell.renk);
            set(`val-kumas-v${v}-renk_kodu`, cell.renk_kodu);
            set(`val-kumas-v${v}-boya_not`, cell.boya_not);
        }
        kumasVaryantKodBasliklariYenile();
    }

    function kumasVaryantTabloYenile(kolonSayisi, mevcutVaryantlar) {
        const sayi = kumasVaryantKolonSayisiAyarla(kolonSayisi != null ? kolonSayisi : kumasVaryantKolonSayisiAl());
        const listEl = document.getElementById('kumas-varyant-list');
        let kayitli;
        if (Array.isArray(mevcutVaryantlar)) {
            kayitli = mevcutVaryantlar;
        } else if (listEl && kumasVaryantDomKartSayisi() > 0) {
            kayitli = kumasVaryantFormVerisiOkuDom(kumasVaryantKolonSayisiAl());
        } else {
            kayitli = [];
        }
        if (listEl) {
            listEl.innerHTML = sayi > 0
                ? Array.from({ length: sayi }, (_, i) => kumasVaryantKartHtml(i + 1)).join('')
                : `<div class="kumas-varyant-empty">Henüz boyalı renk yok. Boyama gerekiyorsa <strong>+ Renk varyantı ekle</strong> ile SM-0001-1, -2… oluşturun.</div>`;
            if (sayi > 0) kumasVaryantTabloDoldur(kayitli, sayi);
        }
        const barBtns = document.getElementById('kumas-varyant-bar-btns');
        if (barBtns) barBtns.innerHTML = kumasVaryantBarParcaHtml(sayi);
        kumasVaryantKodBasliklariYenile();
    }
    window.kumasVaryantTabloYenile = kumasVaryantTabloYenile;

    /** DB'de kayıtlı en büyük varyant no (SM-0003-3 → 3) */
    function kumasVaryantDbMaxNo(anaKod) {
        const ana = kumasAnaKodBul(anaKod);
        if (!ana) return 0;
        let max = 0;
        (dataCache.kumas_kutuphanesi || []).forEach(rec => {
            const k = String(rec.desen_kodu || rec.stok_kodu || '').trim().toUpperCase();
            if (kumasAnaKodBul(k) !== ana) return;
            const v = kumasVaryantNoBul(k);
            if (v > max) max = v;
        });
        return max;
    }
    window.kumasVaryantDbMaxNo = kumasVaryantDbMaxNo;

    /** Sıradaki boş varyant numarası — form ve DB'deki en büyüğün üstü */
    function kumasVaryantSonrakiNo() {
        const anaKod = kumasFormAnaKodOku();
        return Math.max(
            kumasVaryantKolonSayisiAl(),
            kumasVaryantDomKartSayisi(),
            kumasVaryantDbMaxNo(anaKod)
        ) + 1;
    }
    window.kumasVaryantSonrakiNo = kumasVaryantSonrakiNo;

    /**
     * Formdaki boş varyant hücrelerini DB'deki kayıtlardan tamamlar.
     * Kaydetme mevcut varyantları formdan okuduğu için bu adım atlanırsa
     * yüklenmemiş varyantlar boş sayılır.
     */
    function kumasVaryantFormVeDbBirlestir(anaKod) {
        const mevcut = kumasVaryantFormVerisiOku();
        const ana = kumasAnaKodBul(anaKod || kumasFormAnaKodOku());
        if (!ana) return mevcut;
        let dbList = [];
        try { dbList = kumasVaryantAileVerisiOku(ana) || []; } catch (e) { dbList = []; }
        const uzunluk = Math.max(mevcut.length, dbList.length);
        const out = [];
        for (let n = 0; n < uzunluk; n++) {
            const formCell = mevcut[n];
            const dbCell = dbList[n];
            out.push(kumasVaryantFormDoluMu(formCell)
                ? formCell
                : (kumasVaryantFormDoluMu(dbCell) ? dbCell : (formCell || kumasVaryantBosHucre())));
        }
        return out;
    }
    window.kumasVaryantFormVeDbBirlestir = kumasVaryantFormVeDbBirlestir;

    window.kumasVaryantKolonEkle = function () {
        const anaKod = kumasFormAnaKodOku();
        const mevcut = kumasVaryantFormVeDbBirlestir(anaKod);
        const yeni = Math.max(kumasVaryantSonrakiNo(), mevcut.length + 1);
        kumasVaryantTabloYenile(yeni, mevcut);
        kumasVaryantKolonunaGit(yeni);
        if (typeof erpToast === 'function') erpToast(`Boyalı varyant: ${kumasVaryantKodOnizle(yeni)}`, 'success', 2500);
    };

    /** Varyantı formdan ve (kayıtlıysa) veritabanından kaldırır */
    window.kumasVaryantKartSil = async function (vNo) {
        const v = Math.max(1, parseInt(vNo, 10) || 1);
        const anaKod = kumasFormAnaKodOku();
        const varKod = anaKod ? kumasVaryantStokKodu(anaKod, v) : '';
        const dbKayit = varKod ? kumasAileKayitlariTopla(anaKod).find(x => {
            const k = String(x.desen_kodu || x.stok_kodu || '').trim().toUpperCase();
            return k === varKod || kumasVaryantNoBul(k) === v;
        }) : null;
        const soru = dbKayit
            ? `${varKod} varyantı silinecek. Bu koda ait stok hareketleri kartsız kalır. Devam edilsin mi?`
            : `${varKod || 'V' + v} varyant satırı formdan kaldırılacak. Devam edilsin mi?`;
        if (!confirm(soru)) return;

        if (dbKayit?.id && typeof sb !== 'undefined' && sb) {
            try {
                const { error } = await sb.from('kumas_kutuphanesi').delete().eq('id', dbKayit.id);
                if (error) {
                    if (typeof erpToast === 'function') erpToast('Varyant silinemedi: ' + error.message, 'error', 5000);
                    return;
                }
                dataCache.kumas_kutuphanesi = (dataCache.kumas_kutuphanesi || []).filter(x => x.id !== dbKayit.id);
                if (typeof stockCards !== 'undefined') stockCards = dataCache.kumas_kutuphanesi;
            } catch (e) {
                if (typeof erpToast === 'function') erpToast('Varyant silinemedi: ' + (e.message || e), 'error', 5000);
                return;
            }
        }

        const mevcut = kumasVaryantFormVerisiOku();
        mevcut[v - 1] = kumasVaryantBosHucre();
        /* Sondaki boş varyantları kırp — ortadaki boşluk numaraları korunsun */
        while (mevcut.length && !kumasVaryantFormDoluMu(mevcut[mevcut.length - 1])) mevcut.pop();
        kumasVaryantTabloYenile(mevcut.length, mevcut);
        if (typeof loadData === 'function') loadData();
        if (typeof erpToast === 'function') erpToast(`${varKod || 'V' + v} kaldırıldı.`, 'success', 2800);
    };

    window.kumasVaryantKolonunaGit = function (vNo) {
        const v = Math.max(1, parseInt(vNo, 10) || 1);
        const card = document.getElementById(`kumas-varyant-card-${v}`);
        if (card) {
            card.classList.remove('is-collapsed');
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    window.kumasVaryantKartToggle = function (vNo) {
        const card = document.getElementById(`kumas-varyant-card-${vNo}`);
        if (card) card.classList.toggle('is-collapsed');
    };

    function kumasAnaKayitBul(anaKod) {
        const ana = kumasAnaKodBul(anaKod);
        if (!ana) return null;
        return (dataCache.kumas_kutuphanesi || []).find(x => {
            const k = String(x.desen_kodu || x.stok_kodu || '').trim().toUpperCase();
            return kumasAnaKodBul(k) === ana && kumasVaryantNoBul(k) === 0;
        }) || null;
    }
    window.kumasAnaKayitBul = kumasAnaKayitBul;

    function kumasAileKayitlariTopla(anaKod) {
        const ana = kumasAnaKodBul(anaKod);
        if (!ana) return [];
        return (dataCache.kumas_kutuphanesi || []).filter(x => {
            const k = String(x.desen_kodu || x.stok_kodu || '').trim().toUpperCase();
            return kumasAnaKodBul(k) === ana;
        });
    }
    window.kumasAileKayitlariTopla = kumasAileKayitlariTopla;

    function kumasVaryantKayittanHucre(rec) {
        if (!rec) return kumasVaryantBosHucre();
        const meta = typeof kumasMetaAl === 'function' ? (kumasMetaAl(rec) || {}) : {};
        return kumasVaryantAtkiDensify({
            renk: (typeof kumasKartRenkOku === 'function' ? kumasKartRenkOku(rec) : (rec.renk || meta.renk || '')),
            renk_kodu: (typeof kumasKartRenkKoduOku === 'function' ? kumasKartRenkKoduOku(rec) : (meta.renk_kodu || '')),
            boya_not: String(rec.boya_not || meta.boya_not || '').trim()
        });
    }

    function kumasVaryantAileVerisiOku(anaKod) {
        const ana = kumasAnaKodBul(anaKod);
        const aile = kumasAileKayitlariTopla(ana);
        const anaRec = typeof kumasAnaKayitBul === 'function' ? kumasAnaKayitBul(ana) : null;
        let metaVars = [];
        if (anaRec && typeof kumasMetaAl === 'function') {
            const meta = kumasMetaAl(anaRec) || {};
            if (Array.isArray(meta.kumas_varyantlar) && meta.kumas_varyantlar.length) {
                metaVars = kumasVaryantListesiNormalize(meta.kumas_varyantlar);
            } else if (Array.isArray(meta.varyantlar) && meta.varyantlar.length) {
                metaVars = kumasVaryantListesiNormalize(meta.varyantlar);
            }
        }
        let maxV = 0;
        aile.forEach(rec => {
            const vNo = kumasVaryantNoBul(rec.desen_kodu || rec.stok_kodu);
            if (vNo > maxV) maxV = vNo;
        });
        metaVars.forEach((v, i) => {
            if (kumasVaryantFormDoluMu(v)) maxV = Math.max(maxV, i + 1);
        });
        const sayi = Math.max(0, maxV);
        const out = [];
        for (let v = 1; v <= sayi; v++) {
            const varKod = kumasVaryantStokKodu(ana, v);
            const dbRec = aile.find(x => {
                const k = String(x.desen_kodu || x.stok_kodu || '').trim().toUpperCase();
                return k === varKod || (kumasAnaKodBul(k) === ana && kumasVaryantNoBul(k) === v);
            });
            let cell = null;
            if (dbRec) {
                cell = kumasVaryantKayittanHucre(dbRec);
                /* Ana kart meta'sındaki renk_kodu eksikse tamamla */
                if (metaVars[v - 1] && kumasVaryantFormDoluMu(metaVars[v - 1])) {
                    const mv = kumasVaryantAtkiDensify(metaVars[v - 1]);
                    if (!String(cell.renk_kodu || '').trim() && mv.renk_kodu) cell.renk_kodu = mv.renk_kodu;
                    if (!String(cell.renk || '').trim() && mv.renk) cell.renk = mv.renk;
                    if (!String(cell.boya_not || '').trim() && mv.boya_not) cell.boya_not = mv.boya_not;
                }
            } else if (metaVars[v - 1] && kumasVaryantFormDoluMu(metaVars[v - 1])) {
                cell = kumasVaryantAtkiDensify(metaVars[v - 1]);
            }
            out.push(cell || kumasVaryantBosHucre());
        }
        return out;
    }
    window.kumasVaryantAileVerisiOku = kumasVaryantAileVerisiOku;

    /** Boyalı renk sayısı (SM-XXXX-N kayıtları) */
    function kumasKartListeVaryantSayisi(anaKod) {
        const ana = kumasAnaKodBul(anaKod);
        const dbSay = kumasAileKayitlariTopla(ana).filter(x => {
            const k = String(x.desen_kodu || x.stok_kodu || '').trim().toUpperCase();
            return kumasVaryantNoBul(k) > 0;
        }).length;
        if (dbSay > 0) return dbSay;
        const anaRec = typeof kumasAnaKayitBul === 'function' ? kumasAnaKayitBul(ana) : null;
        if (anaRec && typeof kumasMetaAl === 'function') {
            const meta = kumasMetaAl(anaRec) || {};
            return kumasVaryantListesiNormalize(meta.kumas_varyantlar || meta.varyantlar || [])
                .filter(kumasVaryantFormDoluMu).length;
        }
        return 0;
    }
    window.kumasKartListeVaryantSayisi = kumasKartListeVaryantSayisi;

    function kumasVaryantCokluMu(anaKod) {
        return kumasKartListeVaryantSayisi(anaKod) >= 1;
    }
    window.kumasVaryantCokluMu = kumasVaryantCokluMu;

    function kumasKartListeAnaMi(rec) {
        const kod = String(rec?.desen_kodu || rec?.stok_kodu || '').trim().toUpperCase();
        if (!/^(SM|NU)-?\d+$/i.test(kod)) return false;
        return kumasVaryantNoBul(kod) === 0;
    }

    function kumasKartListeGosterilebilirMi(rec) {
        const kod = String(rec?.desen_kodu || rec?.stok_kodu || '').trim().toUpperCase();
        const vNo = kumasVaryantNoBul(kod);
        if (vNo > 0) {
            /* Boyalı kodlar aile satırında gösterilir — ayrı ana satır olarak değil */
            return !kumasAnaKayitBul(kumasAnaKodBul(kod));
        }
        return true;
    }
    window.kumasKartListeGosterilebilirMi = kumasKartListeGosterilebilirMi;

    window._kumasKartExpanded = window._kumasKartExpanded || new Set();

    window.kumasKartListeToggle = function (anaKod, ev) {
        if (ev) { ev.preventDefault(); ev.stopPropagation(); }
        const ana = String(anaKod || '').trim().toUpperCase();
        if (!ana) return;
        if (window._kumasKartExpanded.has(ana)) window._kumasKartExpanded.delete(ana);
        else window._kumasKartExpanded.add(ana);
        if (typeof loadData === 'function') loadData();
    };

    function kumasKartListeGruplariOlustur(records) {
        const map = new Map();
        (Array.isArray(records) ? records : []).forEach((record, idx) => {
            const kod = String(record?.desen_kodu || record?.stok_kodu || '').trim().toUpperCase();
            if (!kod) return;
            const anaKod = kumasAnaKodBul(kod);
            if (!anaKod) return;
            if (!map.has(anaKod)) map.set(anaKod, { anaKod, parent: null, children: [] });
            const grup = map.get(anaKod);
            const vNo = kumasVaryantNoBul(kod);
            if (vNo > 0) grup.children.push({ record, idx, varyantNo: vNo });
            else if (!grup.parent) grup.parent = { record, idx };
            else {
                /* Aynı ana için SM-0001 ile SM0001 gelirse tireli (canonical) kaydı tut */
                const curKod = String(grup.parent.record?.desen_kodu || grup.parent.record?.stok_kodu || '').trim().toUpperCase();
                const curCanon = kumasStokKodCanon(curKod);
                if (kod === curCanon || (kod !== curCanon && curKod !== curCanon)) {
                    grup.parent = { record, idx };
                }
            }
        });
        const gruplar = Array.from(map.values()).map(grup => {
            grup.children.sort((a, b) => a.varyantNo - b.varyantNo);
            if (grup.parent) {
                kumasAileKayitlariTopla(grup.anaKod).forEach(rec => {
                    const k = String(rec.desen_kodu || rec.stok_kodu || '').trim().toUpperCase();
                    const vNo = kumasVaryantNoBul(k);
                    if (vNo <= 0) return;
                    if (grup.children.some(x => x.varyantNo === vNo)) return;
                    grup.children.push({ record: rec, idx: grup.parent.idx, varyantNo: vNo });
                });
                grup.children.sort((a, b) => a.varyantNo - b.varyantNo);
                if (!grup.children.length) {
                    const cells = kumasVaryantAileVerisiOku(grup.anaKod);
                    const dolu = cells.map((cell, i) => ({ cell, vNo: i + 1 })).filter(x => kumasVaryantFormDoluMu(x.cell));
                    const vSay = dolu.length;
                    if (vSay >= 1) {
                        dolu.forEach(({ cell, vNo }) => {
                            const varKod = kumasVaryantStokKodu(grup.anaKod, vNo);
                            grup.children.push({
                                record: {
                                    ...(grup.parent.record || {}),
                                    desen_kodu: varKod,
                                    stok_kodu: varKod,
                                    terbiye: '',
                                    renk: cell.renk,
                                    boya_not: cell.boya_not,
                                    cekme: null
                                },
                                idx: grup.parent.idx,
                                varyantNo: vNo,
                                synthetic: true
                            });
                        });
                        grup.children.sort((a, b) => a.varyantNo - b.varyantNo);
                    }
                }
            }
            const vSayToplam = typeof kumasKartListeVaryantSayisi === 'function'
                ? kumasKartListeVaryantSayisi(grup.anaKod)
                : grup.children.length;
            if (vSayToplam < 1) grup.children = [];
            if (!grup.parent && grup.children.length) {
                const baz = grup.children[0];
                grup.parent = {
                    record: { ...baz.record, desen_kodu: grup.anaKod, stok_kodu: grup.anaKod, renk: '', boya_not: '' },
                    idx: baz.idx,
                    synthetic: true
                };
            }
            return grup;
        }).filter(g => g.parent);
        gruplar.sort((a, b) => new Date(b.parent.record?.created_at || 0) - new Date(a.parent.record?.created_at || 0));
        return gruplar;
    }
    window.kumasKartListeGruplariOlustur = kumasKartListeGruplariOlustur;

    function kumasKartListeGruplarIdxAyarla(gruplar) {
        const merged = [];
        (Array.isArray(gruplar) ? gruplar : []).forEach(grup => {
            grup.parent.idx = merged.length;
            merged.push(grup.parent.record);
            grup.children.forEach(ch => {
                ch.idx = merged.length;
                merged.push(ch.record);
            });
        });
        return merged;
    }
    window.kumasKartListeGruplarIdxAyarla = kumasKartListeGruplarIdxAyarla;

    function kumasKartListeVaryantVerisiOlustur(grup) {
        const children = Array.isArray(grup?.children) ? grup.children : [];
        const vSay = children.length;
        return children.map((ch, i) => {
            const rec = ch.record || {};
            const vNo = ch.varyantNo || (i + 1);
            const kod = String(rec.desen_kodu || rec.stok_kodu || kumasVaryantStokKodu(grup.anaKod, vNo, vSay)).trim().toUpperCase();
            const d = typeof kumasDokumaAlanlariOku === 'function' ? kumasDokumaAlanlariOku(rec) : {};
            const bakFn = typeof depoKumasVaryantBakiyeHesapla === 'function'
                ? depoKumasVaryantBakiyeHesapla
                : depoKumasBakiyeHesapla;
            const bak = bakFn ? bakFn(grup.anaKod, vNo) : null;
            let mt = bak ? (parseFloat(bak.mt) || 0) : (parseFloat(rec.miktar_mt) || 0);
            return {
                no: vNo,
                kod,
                terbiye: typeof kumasKartTerbiyeOku === 'function' ? kumasKartTerbiyeOku(rec) : (d.terbiye || rec.terbiye || ''),
                renk: typeof kumasKartRenkOku === 'function' ? kumasKartRenkOku(rec) : (d.renk || rec.renk || ''),
                renk_kodu: typeof kumasKartRenkKoduOku === 'function' ? kumasKartRenkKoduOku(rec) : (d.renk_kodu || ''),
                stok: mt,
                idx: ch.idx ?? 0,
                record: rec
            };
        });
    }
    window.kumasKartListeVaryantVerisiOlustur = kumasKartListeVaryantVerisiOlustur;

    function kumasKartListeVaryantAltPanelHtml(grup) {
        const esc = (x) => (typeof pdfEsc === 'function' ? pdfEsc(x) : String(x ?? ''));
        const varyantlar = kumasKartListeVaryantVerisiOlustur(grup);
        const parentIdx = grup.parent?.idx ?? 0;
        if (!varyantlar.length) {
            return `<div class="iplik-kart-lot-panel kumas-varyant-lot-panel" onclick="event.stopPropagation()">
                <div style="padding:4px 2px 8px;font-size:9px;color:var(--text3)">Henüz renk/terbiye varyantı yok.</div>
                <button type="button" class="liste-gecmis-btn" onclick="event.stopPropagation();kumasKartListeyeVaryantEkle(${parentIdx})">+ Varyant ekle</button>
            </div>`;
        }
        const satirlar = varyantlar.map(v => {
            const mtClr = v.stok > 0 ? 'var(--emerald-c)' : (v.stok < 0 ? 'var(--rose-c)' : 'var(--text3)');
            return `<div class="iplik-kart-lot-liste-satir" onclick="event.stopPropagation();showDetail(${v.idx})" title="Varyant kartını aç">
                <span class="iplik-kart-lot-liste-satir__kod">${esc(v.kod)}</span>
                <span>${esc(v.terbiye || '—')}</span>
                <span>${esc(v.renk || '—')}</span>
                <span style="text-align:right;font-family:'DM Mono',monospace;color:${mtClr}">${v.stok.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} mt</span>
            </div>`;
        }).join('');
        const toplam = typeof kumasAileCanliStokMt === 'function'
            ? kumasAileCanliStokMt(grup.anaKod)
            : varyantlar.reduce((a, v) => a + (parseFloat(v.stok) || 0), 0);
        const toplamClr = toplam > 0 ? 'var(--emerald-c)' : (toplam < 0 ? 'var(--rose-c)' : 'var(--text3)');
        return `<div class="iplik-kart-lot-panel kumas-varyant-lot-panel" onclick="event.stopPropagation()">
            <div class="iplik-kart-lot-liste-satir iplik-kart-lot-liste-satir--head">
                <span>Varyant</span><span>Terbiye</span><span>Renk</span><span style="text-align:right">Stok</span>
            </div>
            ${satirlar}
            <div class="iplik-kart-lot-liste-satir" style="font-weight:700;border-top:1px solid var(--border);cursor:default">
                <span>TOPLAM</span><span></span><span></span>
                <span style="text-align:right;font-family:'DM Mono',monospace;color:${toplamClr}">${toplam.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} mt</span>
            </div>
            <div style="display:flex;justify-content:flex-end;padding-top:6px">
                <button type="button" class="liste-gecmis-btn" onclick="event.stopPropagation();kumasKartListeyeVaryantEkle(${parentIdx})">+ Varyant ekle</button>
            </div>
        </div>`;
    }
    window.kumasKartListeVaryantAltPanelHtml = kumasKartListeVaryantAltPanelHtml;

    function kumasKartListeyeVaryantEkle(idx) {
        const listeden = (typeof currentData !== 'undefined' && currentData) ? currentData[idx] : null;
        const i = listeden || (window._stokKartTumuCurrentData || [])[idx];
        if (!i) {
            if (typeof erpToast === 'function') erpToast('Kart bulunamadı.', 'error');
            return;
        }
        /* Varyant satırından gelinmiş olabilir — daima ana karta çevir */
        const anaKod = kumasAnaKodBul(i.desen_kodu || i.stok_kodu || '');
        const anaRec = kumasAnaKayitBul(anaKod) || i;
        if (typeof hideDetailModal === 'function') hideDetailModal();
        try { archiveTab = 'KUMAS'; } catch (e) {}

        /* renderInputs sonunda sıradaki varyant kartı açılır */
        window._kumasVaryantEklePending = anaKod || true;

        const anaIdx = (typeof currentData !== 'undefined' && Array.isArray(currentData))
            ? currentData.findIndex(x => x && x.id === anaRec.id)
            : -1;
        if (anaIdx >= 0 && typeof editRecord === 'function') {
            /* editRecord ana kartın tüm teknik alanlarını doldurur */
            selectedIndex = anaIdx;
            editRecord();
            return;
        }

        /* Kart açık listede değil — formu elle hazırla */
        if (typeof selectedIndex !== 'undefined') selectedIndex = idx;
        if (typeof editingId !== 'undefined') editingId = anaRec.id;
        if (typeof originalRecordSnapshot !== 'undefined') originalRecordSnapshot = { ...anaRec };
        if (typeof appMode !== 'undefined') appMode = 'KUMAS_KART_GIRIS';
        try { document.body.setAttribute('data-erp-mode', 'KUMAS_KART_GIRIS'); } catch (e) {}
        const fc = document.getElementById('form-container');
        if (fc) fc.style.display = 'block';
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) cancelBtn.style.display = 'block';
        const ft = document.getElementById('form-title');
        if (ft) ft.innerText = (anaKod || anaRec.desen_kodu || 'Kumaş') + ' — varyant ekle';
        if (typeof renderInputs === 'function') renderInputs();
        setTimeout(() => {
            const kodEl = document.getElementById('val-kodu');
            if (kodEl && !kodEl.value) kodEl.value = anaKod || anaRec.desen_kodu || '';
            if (typeof kumasVaryantKodBasliklariYenile === 'function') kumasVaryantKodBasliklariYenile();
            try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
        }, 80);
    }
    window.kumasKartListeyeVaryantEkle = kumasKartListeyeVaryantEkle;

    function kumasKartListeGrupSatirHtml(grup) {
        const esc = (x) => (typeof pdfEsc === 'function' ? pdfEsc(x) : String(x ?? ''));
        const parent = grup.parent?.record;
        const idx = grup.parent?.idx ?? 0;
        const d = typeof kumasDokumaAlanlariOku === 'function' ? kumasDokumaAlanlariOku(parent) : {};
        const varyantlar = kumasKartListeVaryantVerisiOlustur(grup);
        const vSayToplam = typeof kumasKartListeVaryantSayisi === 'function'
            ? kumasKartListeVaryantSayisi(grup.anaKod)
            : varyantlar.length;
        const cokluVaryant = vSayToplam >= 2;
        const expanded = cokluVaryant && window._kumasKartExpanded.has(grup.anaKod);
        const anaEsc = typeof erpAttr === 'function' ? erpAttr(grup.anaKod) : grup.anaKod;
        const hucre0 = !cokluVaryant ? (kumasVaryantAileVerisiOku(grup.anaKod)[0] || null) : null;
        const toplamMt = typeof kumasAileCanliStokMt === 'function'
            ? kumasAileCanliStokMt(grup.anaKod)
            : (parseFloat(parent?.miktar_mt) || 0);
        const mtClr = toplamMt > 0 ? 'var(--emerald-c)' : (toplamMt < 0 ? 'var(--rose-c)' : 'var(--text3)');
        const terbiyeOzet = cokluVaryant
            ? `<span class="sk-kart-badge">${vSayToplam} varyant</span>`
            : esc(hucre0?.terbiye || d.terbiye || '—');
        const stokMetin = `${toplamMt.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} mt`;
        const expandBtn = cokluVaryant
            ? `<button type="button" class="mamul-stok-grid__expand" onclick="kumasKartListeToggle('${anaEsc}', event)" title="Terbiye / renk varyantlarını aç-kapat">${expanded ? '▼' : '▶'}</button>`
            : `<span class="mamul-stok-grid__expand mamul-stok-grid__expand--ghost"></span>`;
        const rowCls = `sk-kart-row${expanded ? ' is-expanded' : ''}`;
        const row = `<div class="${rowCls}"><div class="mamul-stok-liste-grid mamul-stok-liste-grid--row kumas-stok-liste-grid${expanded ? ' mamul-stok-liste-grid--expanded' : ''}" onclick="if(!event.target.closest('button'))showDetail(${idx})" title="Dokuma talimat kartını aç">
            ${expandBtn}
            <span class="mamul-stok-liste-grid__cell mamul-stok-liste-grid__cell--kod">${esc(grup.anaKod)}</span>
            <span class="mamul-stok-liste-grid__cell">${esc(d.tarih || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${esc(d.musteri || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${esc(d.kumas_cinsi || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${esc(d.desen_adi || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${terbiyeOzet}</span>
            <span class="mamul-stok-liste-grid__cell mamul-stok-liste-grid__cell--stok" style="color:${mtClr}">${stokMetin}</span>
            <span class="mamul-stok-liste-grid__cell">
                <button type="button" class="sk-kart-gecmis" onclick="event.stopPropagation();showDetailOpenGecmis(${idx})">Geçmiş</button>
            </span>
        </div></div>`;
        if (!expanded || !cokluVaryant) return `<div class="mamul-stok-grup">${row}</div>`;
        return `<div class="mamul-stok-grup">${row}${kumasKartListeVaryantAltPanelHtml(grup)}</div>`;
    }
    window.kumasKartListeGrupSatirHtml = kumasKartListeGrupSatirHtml;
    function getNextStockCodeSync(prefix) {
        const pfx = String(prefix || 'SM').toUpperCase();
        if (pfx === 'MA' && typeof getNextMamulAnaKod === 'function') return getNextMamulAnaKod();
        const lib = (typeof dataCache !== 'undefined' && dataCache.kumas_kutuphanesi) ? dataCache.kumas_kutuphanesi : [];
        if (pfx === 'SM' || pfx === 'NU') {
            return kumasHamStokKoduFormatla(kumasStokKoduMaxBul(lib, pfx) + 1, pfx);
        }
        return `${pfx}-${String(kumasStokKoduMaxBul(lib, pfx) + 1).padStart(4, '0')}`;
    }
    async function getNextStockCode(prefix) {
        const pfx = String(prefix || 'SM').toUpperCase();
        if (pfx === 'MA' && typeof getNextMamulAnaKod === 'function') return getNextMamulAnaKod();
        const lib = (typeof dataCache !== 'undefined' && dataCache.kumas_kutuphanesi) ? dataCache.kumas_kutuphanesi : [];
        let max = kumasStokKoduMaxBul(lib, pfx);
        const yerelVar = (lib || []).some(r => {
            const k = String(r?.desen_kodu || r?.stok_kodu || '').toUpperCase();
            return k.startsWith(pfx);
        });
        /* Cache doluysa ağı bekleme — form açılışı hızlanır */
        if (!yerelVar && typeof sb !== 'undefined' && sb) {
            try {
                const { data, error } = await sb.from('kumas_kutuphanesi')
                    .select('desen_kodu')
                    .not('desen_kodu', 'is', null)
                    .like('desen_kodu', pfx + '%')
                    .limit(3000);
                if (!error) max = Math.max(max, kumasStokKoduMaxBul(data, pfx));
            } catch (e) {}
        }
        if (pfx === 'SM' || pfx === 'NU') {
            return kumasHamStokKoduFormatla(max + 1, pfx);
        }
        return `${pfx}-${String(max + 1).padStart(4, '0')}`;
    }
    window.getNextStockCode = getNextStockCode;
    window.getNextStockCodeSync = getNextStockCodeSync;

    function erpKartNotNullVarsayilan(col) {
        const c = String(col || '');
        if (/miktar|gramaj|gsm|_en$|_boy$|cekme|fiyat|sikligi|siklik|cuval_sayisi/i.test(c)) return 0;
        if (/kalite/i.test(c)) return 'AKTİF';
        if (/ana_grup/i.test(c)) return 'EV TEKSTİLİ';
        return '';
    }
    window.erpKartNotNullVarsayilan = erpKartNotNullVarsayilan;

    function erpKartKodunuIlerlet(row, table) {
        if (!row) return false;
        if (table === 'iplik_stok') {
            const m = String(row.stok_kodu || '').match(/^IP-(\d+)$/i);
            if (!m) return false;
            row.stok_kodu = 'IP-' + String((parseInt(m[1], 10) || 0) + 1).padStart(4, '0');
            const el = document.getElementById('val-stok-kodu');
            if (el) el.value = row.stok_kodu;
            return true;
        }
        if (table === 'kumas_kutuphanesi') {
            const kod = String(row.desen_kodu || row.stok_kodu || '');
            const sm = kod.match(/^(SM|NU)-?(\d+)$/i);
            if (sm) {
                const next = kumasHamStokKoduFormatla((parseInt(sm[2], 10) || 0) + 1, sm[1].toUpperCase());
                row.desen_kodu = next;
                row.stok_kodu = next;
                const el = document.getElementById('val-kodu');
                if (el) el.value = next;
                return true;
            }
            if (typeof mamulAnaKodSeqParse === 'function' && typeof mamulAnaKodFormatla === 'function') {
                const seq = mamulAnaKodSeqParse(kod);
                if (seq > 0) {
                    const next = mamulAnaKodFormatla(seq + 1);
                    row.desen_kodu = next;
                    row.stok_kodu = next;
                    const el = document.getElementById('val-kodu');
                    if (el) el.value = next;
                    return true;
                }
            }
        }
        return false;
    }
    window.erpKartKodunuIlerlet = erpKartKodunuIlerlet;

    function iplikKartlariListe() {
        const all = dataCache.iplik_stok || [];
        const map = new Map();
        all.forEach(r => {
            const key = String(r.stok_kodu || '').trim();
            if (!key || !iplikKartTanimKaydiMi(r)) return;
            const prev = map.get(key);
            if (!prev || iplikKartTanimTercihEt(r, prev)) map.set(key, r);
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
            const kodOk = /^(SM|NU)/i.test(sKodu) && i.ana_grup !== 'MAMUL';
            if (!kodOk) return false;
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
            i.desen_kodu, i.stok_kodu, stokKartListeAdMetni(i), i.kumas_cinsi, i.ana_grup,
            i.iplik_no, i.marka, i.firma, i.renk, i.cins, i.lot_no,
            ...(typeof iplikKartLotlariAl === 'function' ? iplikKartLotlariAl(i).map(l => l.lot_no) : [])
        ].join(' ').toLowerCase();
        return blob.includes(s);
    }
    window.stokKartAramaEslesir = stokKartAramaEslesir;


    function stokKartListeSatirHtml(i, idx, grupHint) {
        const grup = grupHint || archiveTab;
        const tbl = grup === 'IPLIK' ? 'iplik_stok' : 'kumas_kutuphanesi';
        const _isIP = i.desen_kodu?.startsWith('IP-') || !!i.iplik_no || grup === 'IPLIK';
        const _isSM = i.desen_kodu?.startsWith('SM');
        const _isMA = grup === 'MAMUL' || i.ana_grup === 'MAMUL' || mamulStokKoduFormatMi(i.desen_kodu);
        const _mamulKart = grup === 'MAMUL' || _isMA;
        const _mamulKod = String(i.desen_kodu || i.stok_kodu || '').trim();
        const _mamulBak = _mamulKart && _mamulKod ? depoMamulBakiyeHesapla(_mamulKod) : null;
        const _kumasKod = !_mamulKart && !_isIP ? String(i.desen_kodu || i.stok_kodu || '').trim() : '';
        const _kumasAna = _kumasKod && typeof kumasAnaKodBul === 'function' ? kumasAnaKodBul(_kumasKod) : _kumasKod;
        const _kumasMtVal = _kumasAna && typeof kumasAileCanliStokMt === 'function'
            ? kumasAileCanliStokMt(_kumasAna)
            : (_kumasKod && typeof depoKumasBakiyeHesapla === 'function' ? (parseFloat(depoKumasBakiyeHesapla(_kumasKod)?.mt) || 0) : null);
        const _kumasBak = _kumasMtVal != null ? { mt: _kumasMtVal } : null;
        const _iplikKod = _isIP ? String(i.stok_kodu || i.desen_kodu || '').trim() : '';
        const _iplikBak = _iplikKod ? depoIplikBakiyeHesapla(_iplikKod) : null;
        const _icon = _isIP ? '🧶' : _isSM ? '🏁' : _isMA ? '🧥' : '📦';
        const _bClr = _isIP ? '#818cf8' : _isSM ? '#34d399' : _isMA ? '#fb923c' : '#94a3b8';
        const _pillCls = _isIP ? 'pill-blue' : _isSM ? 'pill-green' : _isMA ? 'pill-amber' : 'pill-gray';
        const _mamulBakTxt = _mamulBak ? ((parseInt(_mamulBak.adet, 10) || 0) + ' ad') : '0 ad';
        const _mamulAd = _mamulBak ? (parseInt(_mamulBak.adet, 10) || 0) : 0;
        const _mamulBakClr = _mamulAd > 0 ? 'var(--emerald-c)' : (_mamulAd < 0 ? 'var(--rose-c)' : 'var(--text3)');
        const _lots = _isIP && typeof iplikKartLotlariCanliAl === 'function' ? iplikKartLotlariCanliAl(i)
            : (_isIP && typeof iplikKartLotlariAl === 'function' ? iplikKartLotlariAl(i) : []);
        const _lotKg = _iplikBak ? (parseFloat(_iplikBak.kg) || 0)
            : (_isIP && typeof iplikKartLotToplamKg === 'function' ? iplikKartLotToplamKg(_lots) : null);
        const _neg = _lotKg != null ? _lotKg <= 0 : false;
        const _lotEtiket = _isIP && _lots.length ? `${_lots.length} lot` : '';
        const _kumasMt = _kumasBak ? (parseFloat(_kumasBak.mt) || 0) : null;
        const _kumasClr = _kumasMt == null ? 'var(--text3)' : (_kumasMt > 0 ? 'var(--emerald-c)' : (_kumasMt < 0 ? 'var(--rose-c)' : 'var(--text3)'));
        let sagHtml;
        if (_mamulKart && _mamulBak) {
            sagHtml = `<div style="font-family:'Instrument Serif',serif;font-size:18px;color:${_mamulBakClr};line-height:1">${_mamulBakTxt}</div><div style="font-size:9px;color:var(--text3);font-family:'DM Mono',monospace">güncel stok</div>`;
        } else if (_isIP && _lotKg != null) {
            sagHtml = `<div style="font-family:'Instrument Serif',serif;font-size:20px;color:${_neg ? 'var(--rose-c)' : 'var(--text)'};line-height:1">${Number(_lotKg).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}</div><div style="font-size:9px;color:var(--text3);font-family:'DM Mono',monospace">kg · güncel</div>`;
        } else if (_kumasBak) {
            sagHtml = `<div style="font-family:'Instrument Serif',serif;font-size:18px;color:${_kumasClr};line-height:1">${Number(_kumasMt).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}</div><div style="font-size:9px;color:var(--text3);font-family:'DM Mono',monospace">mt · güncel</div>`;
        } else {
            sagHtml = `<span class="pill pill-gray">—</span>`;
        }
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
                        ${_lotEtiket ? `<span class="pill pill-gray" style="font-size:8px">${pdfEsc(_lotEtiket)}</span>` : ''}
                        <span style="font-size:12px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pdfEsc(stokKartListeAdMetni(i))}</span>
                    </div>
                    <div style="font-size:10px;color:var(--text3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pdfEsc(i.firma || i.marka || '—')} · ${pdfEsc(i.kumas_cinsi || i.cins || '—')}${_isIP && _lots.length ? ' · ' + pdfEsc(_lots.map(l => l.lot_no).filter(Boolean).join(', ')) : ''}</div>
                </div>
            </div>
            <div style="text-align:right;flex-shrink:0;margin-left:12px">
                ${sagHtml}
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

    const STOK_KART_LISTE_META = {
        iplik: {
            icon: '🧶',
            title: 'İplik stok kartları',
            desc: 'Stok kodu <strong>IP-XXXX</strong> · lot bazında marka, renk, çuval ve kg takibi',
            countLbl: 'Kart',
        },
        kumas: {
            icon: '🏁',
            title: 'Kumaş stok kartları',
            desc: 'Ana kod <strong>SM-0001</strong> ham kumaş · boyalı varyantlar <strong>SM-0001-1</strong>, <strong>-2</strong> …',
            countLbl: 'Ana kart',
        },
        mamul: {
            icon: '🧥',
            title: 'Mamül stok kartları',
            desc: 'Üretim talimat kartları · renk / atkı varyantları ile stok ve sevkiyat takibi',
            countLbl: 'Ana kart',
        },
    };

    function stokKartListeShellBaslikHtml(cfg) {
        cfg = cfg || {};
        const variant = String(cfg.variant || 'kumas').toLowerCase();
        const meta = STOK_KART_LISTE_META[variant] || STOK_KART_LISTE_META.kumas;
        const count = parseInt(cfg.grupSayisi ?? cfg.kartSayisi, 10) || 0;
        const countLbl = cfg.countLbl || meta.countLbl;
        const segInner = cfg.segHtml || '';
        const segBlock = segInner
            ? `<div class="sk-kart-seg">${segInner}</div>`
            : '';
        return `<div class="sk-kart-shell sk-kart--${variant}">
            <div class="sk-kart-hero">
                <div class="sk-kart-hero__brand">
                    <div class="sk-kart-hero__icon" aria-hidden="true">${cfg.icon || meta.icon}</div>
                    <div>
                        <div class="sk-kart-hero__title">${cfg.title || meta.title}</div>
                        <div class="sk-kart-hero__desc">${cfg.desc || meta.desc}</div>
                    </div>
                </div>
                <div class="sk-kart-hero__metrics">
                    <div class="sk-kart-metric sk-kart-metric--primary">
                        <div class="sk-kart-metric__val">${count}</div>
                        <div class="sk-kart-metric__lbl">${countLbl}</div>
                    </div>
                    ${cfg.metricsHtml || ''}
                </div>
                ${segBlock}
            </div>`;
    }
    window.stokKartListeShellBaslikHtml = stokKartListeShellBaslikHtml;

    function iplikKartListeShellBaslikHtml(opts) {
        opts = opts || {};
        return stokKartListeShellBaslikHtml({
            variant: 'iplik',
            kartSayisi: opts.kartSayisi ?? opts.grupSayisi,
            countLbl: opts.countLbl,
        });
    }
    window.iplikKartListeShellBaslikHtml = iplikKartListeShellBaslikHtml;

    function mamulKartListeShellBaslikHtml(opts) {
        opts = opts || {};
        return stokKartListeShellBaslikHtml({
            variant: 'mamul',
            grupSayisi: opts.grupSayisi ?? opts.kartSayisi,
            countLbl: opts.countLbl,
        });
    }
    window.mamulKartListeShellBaslikHtml = mamulKartListeShellBaslikHtml;

    function stokKartListeTabloShellBaslikHtml(gridExtraClass, headColsHtml) {
        return `<div class="sk-kart-table-wrap">
            <div class="mamul-stok-liste-wrap">
            <div class="mamul-stok-liste-grid mamul-stok-liste-grid--head ${gridExtraClass || ''}">${headColsHtml}</div>
            <div class="sk-kart-table-body">`;
    }
    window.stokKartListeTabloShellBaslikHtml = stokKartListeTabloShellBaslikHtml;

    function stokKartListeTabloShellKapatHtml(opts) {
        const shell = opts && opts.shell;
        return `</div></div></div>${shell ? '</div>' : ''}`;
    }
    window.stokKartListeTabloShellKapatHtml = stokKartListeTabloShellKapatHtml;

    function mamulStokListeTabloBaslikHtml() {
        return stokKartListeTabloShellBaslikHtml('mamul-stok-liste-grid',
            '<span></span><span>Stok kodu</span><span>Tarih</span><span>Müşteri</span><span>Kumaş cinsi</span>'
            + '<span>Desen adı</span><span>İstenen ebat</span><span>Renk</span>'
            + '<span style="text-align:right">Stok</span><span></span>');
    }
    window.mamulStokListeTabloBaslikHtml = mamulStokListeTabloBaslikHtml;

    function mamulStokListeTabloKapatHtml(opts) {
        return stokKartListeTabloShellKapatHtml(opts);
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
        const row = `<div class="sk-kart-row${expanded ? ' is-expanded' : ''}"><div class="mamul-stok-liste-grid mamul-stok-liste-grid--row${expanded ? ' mamul-stok-liste-grid--expanded' : ''}" onclick="if(!event.target.closest('button'))showDetail(${idx})" title="Detaylı üretim kartını aç">
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
                <button type="button" class="sk-kart-gecmis" onclick="event.stopPropagation();showDetailOpenGecmis(${idx})">Geçmiş</button>
            </span>
        </div></div>`;
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
            const kumas = kumasKartListeGruplariOlustur(
                lib.filter(i => stokKartGrupEslesir(i, 'KUMAS', { ignoreTipFiltre: true }))
                    .filter(i => typeof kumasKartListeGosterilebilirMi !== 'function' || kumasKartListeGosterilebilirMi(i))
            ).length;
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
            const bolumCls = b.id === 'IPLIK' ? ' stok-kart-grup-bolum--iplik'
                : b.id === 'KUMAS' ? ' stok-kart-grup-bolum--kumas'
                : b.id === 'MAMUL' ? ' stok-kart-grup-bolum--mamul' : '';
            html += `<div class="stok-kart-grup-bolum${bolumCls} panel-box" style="border-left-color:${b.renk}">
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
                html += stokKartListeTabloShellKapatHtml({ shell: false });
            } else if (b.id === 'KUMAS') {
                html += kumasKartListeTabloBaslikHtml();
                const kumasGruplar = kumasKartListeGruplariOlustur(
                    b.satirlar.filter(i => typeof kumasKartListeGosterilebilirMi !== 'function' || kumasKartListeGosterilebilirMi(i))
                );
                kumasKartListeGruplarIdxAyarla(kumasGruplar);
                kumasGruplar.forEach(grup => {
                    merged.push(grup.parent.record);
                    grup.children.forEach(ch => merged.push(ch.record));
                    html += kumasKartListeGrupSatirHtml(grup);
                    globalIdx += 1 + grup.children.length;
                });
                html += stokKartListeTabloShellKapatHtml({ shell: false });
            } else if (b.id === 'IPLIK' && typeof iplikKartListeTabloBaslikHtml === 'function') {
                html += iplikKartListeTabloBaslikHtml();
                b.satirlar.forEach(i => {
                    merged.push(i);
                    html += iplikKartListeSatirHtml(i, globalIdx);
                    globalIdx += 1;
                });
                html += stokKartListeTabloShellKapatHtml({ shell: false });
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
        const varyantlarHam = Array.isArray(meta.varyantlar) ? meta.varyantlar : [];
        if (vNo > 0 && varyantlarHam[vNo - 1]) {
            renk = mamulVaryantRenkEtiket(varyantlarHam[vNo - 1]);
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
            urun_grubu: mamulUrunGrubuNormalize(g('val-mamul-urun-grubu')),
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
        s('val-mamul-urun-grubu', m.urun_grubu);
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
        mamulUrunGrubuDatalistDoldur();
        const varyantlar = Array.isArray(m.varyantlar) ? m.varyantlar : [];
        const kolonSayisi = mamulVaryantKolonSayisiIhtiyac(varyantlar);
        // Varyant fotoğraflarını hafızaya al
        window._mamulVaryantFotolar = {};
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
        // Varyant fotoğraflarını doldur (tablodan sonra — DOM hazır olsun diye setTimeout)
        setTimeout(() => {
            varyantlar.forEach((vv, idx) => {
                if (vv?.fotograf) {
                    if (typeof mamulVaryantFotoDoldur === 'function') mamulVaryantFotoDoldur(idx + 1, vv.fotograf);
                }
            });
        }, 50);
    }
    window.mamulEkAlanFormDoldur = mamulEkAlanFormDoldur;


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
            || String(x.stok_kodu || '').trim().toUpperCase() === k
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

    function mamulVaryantKayitBirlestir(dbV, legacyV) {
        const db = mamulVaryantAtkiDensify(dbV || mamulVaryantBosHucre());
        const leg = mamulVaryantAtkiDensify(legacyV || mamulVaryantBosHucre());
        const renk_etiket = String(leg.renk_etiket || db.renk_etiket || '').trim();
        const dbAtkiDolu = db.atki.some(a => a.iplik_no || a.renk || a.atki_sayisi);
        return {
            renk_etiket,
            atki: dbAtkiDolu ? db.atki : leg.atki
        };
    }

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
            if (byNo[vNo] && mamulVaryantFormDoluMu(byNo[vNo])) {
                sablon[i] = legacy[i] ? mamulVaryantKayitBirlestir(byNo[vNo], legacy[i]) : byNo[vNo];
            } else if (legacy[i] && mamulVaryantFormDoluMu(legacy[i])) {
                sablon[i] = legacy[i];
            } else {
                sablon[i] = mamulVaryantBosHucre();
            }
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
            currentImageBase64 = (typeof kartFotografSrc === 'function' ? kartFotografSrc(src) : src?.fotograf) || null;
            if (currentImageBase64 && document.getElementById('img-preview')) {
                document.getElementById('img-preview').src = currentImageBase64;
                document.getElementById('img-preview').style.display = '';
                const ph = document.getElementById('foto-placeholder');
                if (ph) ph.style.display = 'none';
            }
        }
        if (typeof erpFotoOnizleGuncelle === 'function') erpFotoOnizleGuncelle((typeof kartFotografSrc === 'function' ? kartFotografSrc(src) : src?.fotograf) || null);
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
        set('val-mamul-urun-grubu', mamulExcelMapDeger(map, ['URUN GRUBU', 'URUN GRUBU IBARESI', 'GRUP']));
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
        (async () => {
            try {
                if (typeof sb === 'undefined' || !sb) return;
                const yil = typeof getMamulYilTam === 'function' ? getMamulYilTam() : String(new Date().getFullYear());
                const { data, error } = await sb.from('kumas_kutuphanesi').select('desen_kodu').not('desen_kodu', 'is', null).like('desen_kodu', yil + '%');
                if (error || !data) return;
                if (typeof editingId !== 'undefined' && editingId && !opts.force) return;
                const el = document.getElementById('val-kodu');
                if (el !== input) return;
                let maxSeq = 0;
                const say = (rows) => {
                    (rows || []).forEach(item => {
                        const seq = typeof mamulAnaKodSeqParse === 'function' ? mamulAnaKodSeqParse(item?.desen_kodu) : 0;
                        if (seq > maxSeq) maxSeq = seq;
                    });
                };
                say(typeof dataCache !== 'undefined' ? dataCache.kumas_kutuphanesi : []);
                say(data);
                const next = typeof mamulAnaKodFormatla === 'function'
                    ? mamulAnaKodFormatla(maxSeq + 1)
                    : `${yil}${String(maxSeq + 1).padStart(3, '0')}`;
                input.value = next;
                mamulVaryantKodBasliklariYenile();
            } catch (e) {}
        })();
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
            const wrap = `mamul-field${opts.span ? ` mamul-field--span${opts.span}` : ''}`;
            if (opts.type === 'textarea') {
                return `<div class="${wrap}"><label class="pro-label">${label}</label><textarea id="${id}" rows="1" class="pro-input"></textarea></div>`;
            }
            return `<div class="${wrap}"><label class="pro-label">${label}</label><input id="${id}" type="${opts.type || 'text'}" class="pro-input" ${opts.extra || ''}></div>`;
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
                    <button type="button" class="mamul-sheet__save-btn" onclick="handleSave()">Kaydet</button>
                </div>
            </div>

            <div class="mamul-sheet__section">Kimlik</div>
            <div class="mamul-sheet__grid mamul-sheet__grid--kimlik">
                ${f('val-mamul-urun-grubu', 'Ürün Grubu', { span: 2, extra: 'list="mamul-urun-grubu-list" placeholder="Örn: DOLGULU YORGAN, 4 KAT MUSLİN, PİKE" style="text-transform:uppercase"' })}
                ${f('val-mamul-tarih', 'Tarih', { type: 'date' })}
                ${f('val-firma', 'Müşteri', { extra: 'style="text-transform:uppercase"' })}
                ${f('val-mamul-siparis-no', 'Sipariş No')}
                ${f('val-mamul-tezgah-no', 'Tezgah No')}
                ${f('val-kumas-cinsi', 'Kumaş Cinsi')}
                ${f('val-mamul-kumas-stok-kodu', 'Kumaş Stok Kodu')}
                ${f('val-desen-adi', 'Desen Adı')}
                ${f('val-mamul-tezgah-desen-no', 'Tezgah Desen No')}
            </div>
            <datalist id="mamul-urun-grubu-list"></datalist>

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

    const IPLIK_LOTS_RE = /\[\[IPLIK_LOTS:([A-Za-z0-9+/=]+)\]\]/;
    let _iplikKartLotSayac = 0;

    function iplikLotsTemizle(txt) {
        return String(txt || '').replace(IPLIK_LOTS_RE, '').trim();
    }
    function iplikLotsEncode(lots) {
        try {
            const arr = (Array.isArray(lots) ? lots : []).filter(l => String(l?.lot_no || '').trim());
            if (!arr.length) return '';
            return '[[IPLIK_LOTS:' + btoa(unescape(encodeURIComponent(JSON.stringify(arr)))) + ']]';
        } catch (e) {
            return '';
        }
    }
    function iplikLotsDecode(txt) {
        const m = String(txt || '').match(IPLIK_LOTS_RE);
        if (!m) return null;
        try {
            const arr = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
            return Array.isArray(arr) ? arr : null;
        } catch (e) {
            return null;
        }
    }
    function iplikNotlarOlustur(userNot, lots) {
        const clean = iplikLotsTemizle(userNot);
        const token = iplikLotsEncode(lots);
        if (!token) return clean;
        return clean ? (clean + '\n' + token) : token;
    }
    function iplikKartLotlariAl(rec) {
        const fromMeta = iplikLotsDecode(rec?.notlar);
        const legacy = {
            marka: rec?.marka || '',
            renk: rec?.renk || '',
            tedarikci: rec?.tedarikci || '',
            depo_konum: rec?.depo_konum || '',
            fiyat: rec?.fiyat ?? '',
            para_birimi: rec?.para_birimi || 'TRY',
            kalite_kat: rec?.kalite_kat || '',
            cuval_rengi: rec?.cuval_rengi || '',
            cuval_sayisi: rec?.cuval_sayisi ?? ''
        };
        if (fromMeta && fromMeta.length) {
            return fromMeta.map(l => ({
                lot_no: l.lot_no || '',
                miktar_kg: l.miktar_kg,
                marka: l.marka || legacy.marka,
                renk: l.renk || legacy.renk,
                tedarikci: l.tedarikci || legacy.tedarikci,
                depo_konum: l.depo_konum || legacy.depo_konum,
                fiyat: l.fiyat != null && l.fiyat !== '' ? l.fiyat : legacy.fiyat,
                para_birimi: l.para_birimi || legacy.para_birimi,
                kalite_kat: l.kalite_kat || legacy.kalite_kat,
                cuval_rengi: l.cuval_rengi || legacy.cuval_rengi,
                cuval_sayisi: l.cuval_sayisi != null && l.cuval_sayisi !== '' ? l.cuval_sayisi : legacy.cuval_sayisi
            }));
        }
        const lot = String(rec?.lot_no || '').trim();
        if (!lot) return [];
        return [{ lot_no: lot, miktar_kg: 0, ...legacy }];
    }
    /** Kart lotları — depo hareketlerine göre güncel kalan kg */
    function iplikKartLotlariCanliAl(rec) {
        const ham = iplikKartLotlariAl(rec);
        const kod = String(rec?.stok_kodu || '').trim();
        if (!kod || !ham.length) return ham;
        const bak = typeof depoIplikBakiyeHesapla === 'function' ? depoIplikBakiyeHesapla(kod) : null;
        if (!bak || !bak.lots) return ham;
        return ham.map(l => {
            const key = String(l.lot_no || 'LOTSUZ').trim().toUpperCase() || 'LOTSUZ';
            const live = bak.lots[key];
            if (!live) return { ...l, miktar_kg: 0 };
            return { ...l, miktar_kg: Math.round((parseFloat(live.kg) || 0) * 1000) / 1000 };
        });
    }
    function iplikKartLotToplamKg(lots) {
        return (lots || []).reduce((a, l) => a + (parseFloat(l.miktar_kg) || 0), 0);
    }
    /** TR ondalık: 100,5 · 100.5 · 1.234,56 */
    function erpParseDecimalTr(val, fallback) {
        let s = String(val ?? '').trim().replace(/\s/g, '');
        if (!s) return fallback !== undefined ? fallback : 0;
        if (s.includes(',') && s.includes('.')) {
            s = s.replace(/\./g, '').replace(',', '.');
        } else {
            s = s.replace(',', '.');
        }
        const n = parseFloat(s);
        return Number.isFinite(n) ? n : (fallback !== undefined ? fallback : 0);
    }
    window.erpParseDecimalTr = erpParseDecimalTr;

    function iplikKartLotlariOkuDom() {
        const rows = [...document.querySelectorAll('#iplik-lot-container .iplik-kart-lot-row')];
        return rows.map(row => {
            const g = (sel) => row.querySelector(sel)?.value || '';
            return {
                lot_no: String(g('.iplik-lot-no')).trim(),
                miktar_kg: erpParseDecimalTr(g('.iplik-lot-miktar'), 0),
                marka: String(g('.iplik-lot-marka')).trim().toUpperCase(),
                renk: String(g('.iplik-lot-renk')).trim(),
                tedarikci: String(g('.iplik-lot-tedarikci')).trim().toUpperCase(),
                depo_konum: String(g('.iplik-lot-depo')).trim(),
                fiyat: g('.iplik-lot-fiyat'),
                para_birimi: String(g('.iplik-lot-para')).trim() || 'TRY',
                kalite_kat: String(g('.iplik-lot-kalite')).trim(),
                cuval_rengi: String(g('.iplik-lot-cuval-renk')).trim().toUpperCase(),
                cuval_sayisi: parseInt(g('.iplik-lot-cuval-adet'), 10) || 0
            };
        }).filter(l => l.lot_no || l.miktar_kg || l.renk || l.tedarikci || l.marka || l.depo_konum || l.fiyat || l.cuval_rengi || l.cuval_sayisi);
    }
    function iplikKartLotToplamGuncelle() {
        const lots = iplikKartLotlariOkuDom();
        const dolu = lots.filter(l => l.lot_no);
        const kg = iplikKartLotToplamKg(dolu);
        const cuvalTop = dolu.reduce((a, l) => a + (parseInt(l.cuval_sayisi, 10) || 0), 0);
        const kod = document.getElementById('val-stok-kodu')?.value || '—';
        const el = document.getElementById('iplik-kart-lot-toplam');
        if (el) {
            el.innerHTML = `<span style="font-family:'DM Mono',monospace;color:var(--text3)">Stok kodu</span> <b style="font-family:'DM Mono',monospace;color:var(--accent2)">${kod}</b>
                <span style="margin:0 8px;color:var(--border2)">·</span>
                <span>${dolu.length} lot</span>
                <span style="margin:0 8px;color:var(--border2)">·</span>
                <span style="font-family:'Instrument Serif',serif;font-size:16px;color:var(--emerald-c)">${kg.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kg</span>
                <span style="font-size:8px;color:var(--text3);margin-left:6px">toplam</span>
                ${cuvalTop ? `<span style="margin:0 8px;color:var(--border2)">·</span><span style="font-family:'DM Mono',monospace">${cuvalTop} çuval/koli</span>` : ''}`;
        }
        const prev = document.getElementById('prev-iplik-lot-ozet');
        if (prev) prev.textContent = dolu.length ? (dolu.map(l => l.lot_no + ' (' + (parseFloat(l.miktar_kg) || 0) + ' kg)').join(' · ')) : '—';
    }
    function iplikKartLotSatirHtml(lot, opts) {
        lot = lot || {};
        opts = opts || {};
        const n = ++_iplikKartLotSayac;
        const esc = (x) => String(x ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        const sel = (cur, val) => String(cur || '') === String(val) ? ' selected' : '';
        const kalite = lot.kalite_kat || '1. KALİTE';
        const para = lot.para_birimi || 'TRY';
        const yeniCls = opts.yeni ? ' iplik-kart-lot-row--yeni' : '';
        return `<div class="iplik-kart-lot-row nu-atki-row${yeniCls}" data-lot-idx="${n}" style="display:flex;flex-direction:column;gap:8px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
            <div style="display:grid;grid-template-columns:1.15fr 90px 1fr 1fr 1fr 32px;gap:8px;align-items:end">
                <div>
                    <div style="font-size:8px;font-weight:700;color:var(--accent2);font-family:'DM Mono',monospace;margin-bottom:3px">LOT NO ★</div>
                    <input class="pro-input iplik-lot-no" value="${esc(lot.lot_no)}" placeholder="Lot / parti" style="font-family:'DM Mono',monospace;font-size:12px;border-color:rgba(139,92,246,0.25)" oninput="iplikKartLotToplamGuncelle()">
                </div>
                <div>
                    <div style="font-size:8px;font-weight:700;color:var(--emerald-c);font-family:'DM Mono',monospace;margin-bottom:3px">MİKTAR (kg)</div>
                    <input class="pro-input iplik-lot-miktar" type="text" inputmode="decimal" autocomplete="off" value="${lot.miktar_kg != null && lot.miktar_kg !== '' ? esc(lot.miktar_kg) : ''}" placeholder="0" style="font-family:'DM Mono',monospace;font-size:12px;text-align:right" oninput="iplikKartLotToplamGuncelle()">
                </div>
                <div>
                    <div style="font-size:8px;font-weight:700;color:var(--text3);font-family:'DM Mono',monospace;margin-bottom:3px">MARKA</div>
                    <input class="pro-input iplik-lot-marka" value="${esc(lot.marka)}" placeholder="KORTEKS…" style="font-size:11px;text-transform:uppercase">
                </div>
                <div>
                    <div style="font-size:8px;font-weight:700;color:var(--cyan-c);font-family:'DM Mono',monospace;margin-bottom:3px">RENK</div>
                    <input class="pro-input iplik-lot-renk" value="${esc(lot.renk)}" placeholder="Renk / boya" style="font-size:11px">
                </div>
                <div>
                    <div style="font-size:8px;font-weight:700;color:var(--text3);font-family:'DM Mono',monospace;margin-bottom:3px">TEDARİKÇİ</div>
                    <input class="pro-input iplik-lot-tedarikci" value="${esc(lot.tedarikci)}" placeholder="Firma" style="font-size:11px;text-transform:uppercase">
                </div>
                <button type="button" onclick="this.closest('.iplik-kart-lot-row').remove();iplikKartLotToplamGuncelle()"
                    style="height:36px;width:32px;border-radius:6px;background:rgba(251,113,133,0.1);border:1px solid rgba(251,113,133,0.2);color:var(--rose-c);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center">✕</button>
            </div>
            <div style="display:grid;grid-template-columns:1.1fr 1fr 1fr 90px 90px 80px;gap:8px;align-items:end">
                <div>
                    <div style="font-size:8px;font-weight:700;color:var(--text3);font-family:'DM Mono',monospace;margin-bottom:3px">KALİTE</div>
                    <select class="pro-input iplik-lot-kalite">
                        <option value="1. KALİTE"${sel(kalite, '1. KALİTE')}>1. Kalite</option>
                        <option value="2. KALİTE"${sel(kalite, '2. KALİTE')}>2. Kalite</option>
                        <option value="FIRE"${sel(kalite, 'FIRE')}>Fire / Atık</option>
                    </select>
                </div>
                <div>
                    <div style="font-size:8px;font-weight:700;color:var(--text3);font-family:'DM Mono',monospace;margin-bottom:3px">DEPO</div>
                    <input class="pro-input iplik-lot-depo" value="${esc(lot.depo_konum)}" placeholder="Konum" style="font-size:11px">
                </div>
                <div>
                    <div style="font-size:8px;font-weight:700;color:var(--text3);font-family:'DM Mono',monospace;margin-bottom:3px">ÇUVAL RENGİ</div>
                    <input class="pro-input iplik-lot-cuval-renk" value="${esc(lot.cuval_rengi)}" placeholder="Beyaz, mavi…" style="font-size:11px;text-transform:uppercase">
                </div>
                <div>
                    <div style="font-size:8px;font-weight:700;color:var(--text3);font-family:'DM Mono',monospace;margin-bottom:3px">ÇUVAL / KOLİ</div>
                    <input class="pro-input iplik-lot-cuval-adet" type="number" step="1" min="0" value="${lot.cuval_sayisi != null && lot.cuval_sayisi !== '' ? esc(lot.cuval_sayisi) : ''}" placeholder="0" style="font-family:'DM Mono',monospace;font-size:12px;text-align:right" oninput="iplikKartLotToplamGuncelle()">
                </div>
                <div>
                    <div style="font-size:8px;font-weight:700;color:var(--text3);font-family:'DM Mono',monospace;margin-bottom:3px">FİYAT</div>
                    <input class="pro-input iplik-lot-fiyat" type="number" step="0.01" value="${esc(lot.fiyat)}" placeholder="0.00" style="font-family:'DM Mono',monospace;font-size:11px">
                </div>
                <div>
                    <div style="font-size:8px;font-weight:700;color:var(--text3);font-family:'DM Mono',monospace;margin-bottom:3px">PARA</div>
                    <select class="pro-input iplik-lot-para">
                        <option value="TRY"${sel(para, 'TRY')}>TL</option>
                        <option value="USD"${sel(para, 'USD')}>USD</option>
                        <option value="EUR"${sel(para, 'EUR')}>EUR</option>
                    </select>
                </div>
            </div>
        </div>`;
    }
    function iplikKartLotEkle(lot, opts) {
        const box = document.getElementById('iplik-lot-container');
        if (!box) return;
        box.insertAdjacentHTML('beforeend', iplikKartLotSatirHtml(lot, opts));
        iplikKartLotToplamGuncelle();
        if (opts && opts.yeni) {
            const last = box.querySelector('.iplik-kart-lot-row:last-child .iplik-lot-no');
            if (last) {
                try { last.focus(); last.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
            }
        }
    }
    function iplikKartLotlariDoldur(rec) {
        const box = document.getElementById('iplik-lot-container');
        if (!box) return;
        box.innerHTML = '';
        _iplikKartLotSayac = 0;
        const lots = rec ? iplikKartLotlariCanliAl(rec) : [];
        if (lots.length) lots.forEach(l => iplikKartLotEkle(l));
        else iplikKartLotEkle({});
        iplikKartLotToplamGuncelle();
    }
    function iplikKartLotDraftYukle(draft) {
        const box = document.getElementById('iplik-lot-container');
        if (!box || !Array.isArray(draft) || !draft.length) return false;
        box.innerHTML = '';
        _iplikKartLotSayac = 0;
        draft.forEach(l => iplikKartLotEkle(l || {}));
        iplikKartLotToplamGuncelle();
        return true;
    }
    window.iplikKartLotDraftYukle = iplikKartLotDraftYukle;
    window.iplikKartLotEkle = iplikKartLotEkle;
    window.iplikKartLotToplamGuncelle = iplikKartLotToplamGuncelle;
    window.iplikKartLotlariOkuDom = iplikKartLotlariOkuDom;
    window.iplikKartLotlariAl = iplikKartLotlariAl;
    window.iplikKartLotlariCanliAl = iplikKartLotlariCanliAl;
    window.iplikKartLotToplamKg = iplikKartLotToplamKg;
    window.iplikKartLotlariDoldur = iplikKartLotlariDoldur;
    window.iplikNotlarOlustur = iplikNotlarOlustur;
    window.iplikLotsTemizle = iplikLotsTemizle;

    function iplikKartKayitBulByKod(kod) {
        const k = String(kod || '').trim().toUpperCase();
        if (!k) return null;
        return iplikKartlariListe().find(r => String(r.stok_kodu || '').trim().toUpperCase() === k) || null;
    }
    function iplikKartMevcutKodSelectDoldur() {
        const sel = document.getElementById('val-iplik-mevcut-kod');
        if (!sel) return;
        const cur = String(document.getElementById('val-stok-kodu')?.value || '').trim().toUpperCase();
        const editing = typeof editingId !== 'undefined' && editingId;
        const liste = iplikKartlariListe();
        const esc = (x) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        let html = `<option value="__YENI__">+ Yeni stok kodu</option>`;
        liste.forEach(k => {
            const kod = String(k.stok_kodu || '').trim();
            if (!kod) return;
            html += `<option value="${esc(kod)}">${esc([kod, k.iplik_no, k.cins].filter(Boolean).join(' · '))}</option>`;
        });
        const hedef = ((editing && cur) || (cur && liste.some(k => String(k.stok_kodu || '').trim().toUpperCase() === cur)))
            ? cur : '__YENI__';
        window._iplikKartKodSelectProgrammatic = true;
        try {
            sel.innerHTML = html;
            sel.value = hedef;
        } finally {
            window._iplikKartKodSelectProgrammatic = false;
        }
    }
    function iplikKartMevcutKodaFormYukle(kart, opts) {
        opts = opts || {};
        if (!kart) return false;
        editingId = kart.id;
        originalRecordSnapshot = { ...kart };
        window._iplikKartMevcutKodaBagli = true;
        const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        sv('val-stok-kodu', kart.stok_kodu);
        sv('val-iplik-no', kart.iplik_no);
        sv('val-cins', kart.cins);
        sv('val-kalite-durum', kart.kalite || 'AKTİF');
        sv('val-notlar', iplikLotsTemizle(kart.notlar));
        iplikKartLotlariDoldur(kart);
        if (opts.bosLotEkle) iplikKartLotEkle({}, { yeni: true });
        const ft = document.getElementById('form-title');
        if (ft) ft.innerText = (kart.stok_kodu || 'İplik') + ' — yeni lot';
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) cancelBtn.style.display = 'block';
        iplikKartMevcutKodSelectDoldur();
        return true;
    }
    function iplikKartYeniKodaDon() {
        editingId = null;
        originalRecordSnapshot = null;
        window._iplikKartMevcutKodaBagli = false;
        const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        sv('val-iplik-no', '');
        sv('val-cins', '');
        sv('val-notlar', '');
        iplikKartLotlariDoldur(null);
        const ft = document.getElementById('form-title');
        if (ft) ft.innerText = 'İplik Stok Kartı';
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) cancelBtn.style.display = 'none';
        const input = document.getElementById('val-stok-kodu');
        if (input) input.value = getNextIplikStokCodeSync();
        getNextIplikStokCode().then(code => {
            if (editingId || window._iplikKartMevcutKodaBagli) return;
            const el = document.getElementById('val-stok-kodu');
            if (el) el.value = code;
            iplikKartMevcutKodSelectDoldur();
            iplikKartLotToplamGuncelle();
        }).catch(() => {});
        const sel = document.getElementById('val-iplik-mevcut-kod');
        if (sel) sel.value = '__YENI__';
        iplikKartMevcutKodSelectDoldur();
        iplikKartLotToplamGuncelle();
    }
    function iplikKartMevcutKodSecildi() {
        if (window._iplikKartKodSelectProgrammatic) return;
        const sel = document.getElementById('val-iplik-mevcut-kod');
        const val = String(sel?.value || '');
        if (!val || val === '__YENI__') { iplikKartYeniKodaDon(); return; }
        const mevcutKod = String(document.getElementById('val-stok-kodu')?.value || '').trim().toUpperCase();
        if (val.toUpperCase() === mevcutKod && editingId) { iplikKartLotEkle({}, { yeni: true }); return; }
        const kart = iplikKartKayitBulByKod(val);
        if (!kart) {
            if (typeof erpToast === 'function') erpToast('Bu stok kodu bulunamadı.', 'error');
            return;
        }
        iplikKartMevcutKodaFormYukle(kart, { bosLotEkle: true });
    }
    function iplikKartListeyeLotEkle(idx) {
        const i = (typeof currentData !== 'undefined' && currentData[idx])
            || (window._stokKartTumuCurrentData || [])[idx];
        if (!i) {
            if (typeof erpToast === 'function') erpToast('Kart bulunamadı.', 'error');
            return;
        }
        selectedIndex = idx;
        editingId = i.id;
        originalRecordSnapshot = { ...i };
        window._iplikKartMevcutKodaBagli = true;
        if (typeof hideDetailModal === 'function') hideDetailModal();
        try { archiveTab = 'IPLIK'; } catch (e) {}
        appMode = 'IPLIK_KART_GIRIS';
        try { document.body.setAttribute('data-erp-mode', 'IPLIK_KART_GIRIS'); } catch (e) {}
        const fc = document.getElementById('form-container');
        if (fc) fc.style.display = 'block';
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) cancelBtn.style.display = 'block';
        const ft = document.getElementById('form-title');
        if (ft) ft.innerText = (i.stok_kodu || 'İplik') + ' — yeni lot';
        if (typeof renderInputs === 'function') renderInputs();
        setTimeout(() => {
            iplikKartMevcutKodaFormYukle(i, { bosLotEkle: true });
            try {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (e) {}
        }, 50);
    }
    window.iplikKartKayitBulByKod = iplikKartKayitBulByKod;
    window.iplikKartMevcutKodSelectDoldur = iplikKartMevcutKodSelectDoldur;
    window.iplikKartMevcutKodaFormYukle = iplikKartMevcutKodaFormYukle;
    window.iplikKartMevcutKodSecildi = iplikKartMevcutKodSecildi;
    window.iplikKartListeyeLotEkle = iplikKartListeyeLotEkle;
    window.iplikKartYeniKodaDon = iplikKartYeniKodaDon;

    function iplikStokKartFormHtml() {
        const f = (id, label, opts) => {
            opts = opts || {};
            const wrap = `mamul-field${opts.span ? ` mamul-field--span${opts.span}` : ''}`;
            if (opts.type === 'textarea') {
                return `<div class="${wrap}"><label class="pro-label">${label}</label><textarea id="${id}" rows="1" class="pro-input" placeholder="${opts.ph || ''}"></textarea></div>`;
            }
            if (opts.type === 'select') {
                return `<div class="${wrap}"><label class="pro-label">${label}</label><select id="${id}" class="pro-input">${opts.options || ''}</select></div>`;
            }
            return `<div class="${wrap}"><label class="pro-label">${label}</label><input id="${id}" type="${opts.type || 'text'}" class="pro-input" ${opts.extra || ''} placeholder="${opts.ph || ''}"></div>`;
        };
        return `
        <div class="mamul-sheet mamul-sheet--kumas">
            <div class="mamul-sheet__toolbar">
                <div class="mamul-sheet__toolbar-left">
                    <div class="mamul-sheet__kod"><input id="val-stok-kodu" readonly title="IP stok kodu"></div>
                    <select id="val-iplik-mevcut-kod" class="pro-input" style="width:auto;min-width:180px;max-width:280px;padding:4px 8px;font-size:10px;height:28px;font-family:'DM Mono',monospace" onchange="iplikKartMevcutKodSecildi()" title="Mevcut stok koduna lot ekle">
                        <option value="__YENI__">+ Yeni stok kodu</option>
                    </select>
                    <span style="font-size:9px;color:var(--text3)">Aynı IP koduna yeni lot eklemek için mevcut kodu seçin</span>
                </div>
                <div class="mamul-sheet__toolbar-right">
                    <select id="val-kalite-durum" class="pro-input" style="width:auto;padding:3px 8px;font-size:9px;height:26px">
                        <option value="AKTİF">AKTİF</option>
                        <option value="PASİF">PASİF</option>
                        <option value="TÜKENDİ">TÜKENDİ</option>
                    </select>
                    <button type="button" class="mamul-sheet__save-btn" onclick="handleSave()">Kaydet</button>
                </div>
            </div>
            <div class="mamul-sheet__section">Kart — iplik kimliği</div>
            <div class="mamul-sheet__grid mamul-sheet__grid--kumas-kimlik">
                ${f('val-iplik-no', 'İplik no / titre', { extra: 'style="font-family:\'DM Mono\',monospace"', ph: 'Ne 30/1, Nm 50/2' })}
                ${f('val-cins', 'İplik cinsi / fiber', { extra: 'style="text-transform:uppercase"', ph: 'Pamuk, PES, viskon' })}
            </div>
            <div class="mamul-sheet__section">Lotlar <span style="font-size:8px;color:var(--text3);font-weight:400;text-transform:none;letter-spacing:0">— marka, renk, çuval, tedarikçi, depo ve fiyat lotta</span> <button type="button" onclick="iplikKartLotEkle({}, {yeni:true})" class="btn-pro" style="margin-left:8px;padding:2px 8px;font-size:8px">+ Lot ekle</button></div>
            <div id="iplik-lot-container"></div>
            <div id="iplik-kart-lot-toplam" style="padding:8px 12px 10px;display:flex;align-items:center;flex-wrap:wrap;gap:4px;border-top:1px solid var(--border);background:var(--surface2);font-size:11px;color:var(--text2)"></div>
            <div class="mamul-sheet__grid mamul-sheet__grid--aciklama">
                ${f('val-notlar', 'Not', { type: 'textarea', ph: '' })}
            </div>
        </div>`;
    }
    window.iplikStokKartFormHtml = iplikStokKartFormHtml;

    function iplikKartListeTabloBaslikHtml() {
        return stokKartListeTabloShellBaslikHtml('iplik-kart-liste-grid',
            '<span></span><span>Stok kodu</span><span>İplik no</span><span>Cins</span>'
            + '<span>Lotlar</span><span style="text-align:right">Toplam kg</span><span></span>');
    }
    window.iplikKartListeTabloBaslikHtml = iplikKartListeTabloBaslikHtml;

    function iplikKartListeToggle(idx, ev) {
        if (ev) ev.stopPropagation();
        window._iplikKartExpanded = window._iplikKartExpanded || new Set();
        const s = window._iplikKartExpanded;
        if (s.has(idx)) s.delete(idx); else s.add(idx);
        if (typeof loadData === 'function') loadData();
    }
    window.iplikKartListeToggle = iplikKartListeToggle;

    function iplikKartListeSatirHtml(i, idx) {
        const esc = (x) => (typeof pdfEsc === 'function' ? pdfEsc(x) : String(x ?? ''));
        const lots = typeof iplikKartLotlariCanliAl === 'function' ? iplikKartLotlariCanliAl(i) : iplikKartLotlariAl(i);
        const bak = typeof depoIplikBakiyeHesapla === 'function' ? depoIplikBakiyeHesapla(i.stok_kodu) : null;
        const tot = bak ? (parseFloat(bak.kg) || 0) : iplikKartLotToplamKg(lots);
        const lotOzet = lots.length
            ? lots.map(l => (l.lot_no || '—') + ' · ' + (parseFloat(l.miktar_kg) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' kg').join(' | ')
            : '—';
        window._iplikKartExpanded = window._iplikKartExpanded || new Set();
        const expanded = window._iplikKartExpanded.has(idx);
        const lotSay = lots.length;
        const rowCls = `sk-kart-row${expanded ? ' is-expanded' : ''}`;
        const row = `<div class="${rowCls}"><div class="mamul-stok-liste-grid mamul-stok-liste-grid--row iplik-kart-liste-grid${expanded ? ' mamul-stok-liste-grid--expanded' : ''}" onclick="${lotSay ? `iplikKartListeToggle(${idx})` : `showDetail(${idx})`}" title="Kartı aç / lotları göster">
            <span class="mamul-stok-liste-grid__cell"><button type="button" class="mamul-stok-grid__expand" onclick="event.stopPropagation();iplikKartListeToggle(${idx})" style="opacity:${lotSay ? 1 : 0.35};cursor:${lotSay ? 'pointer' : 'default'}">${lotSay ? (expanded ? '▼' : '▶') : '·'}</button></span>
            <span class="mamul-stok-liste-grid__cell mamul-stok-liste-grid__cell--kod">${esc(i.stok_kodu || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${esc(i.iplik_no || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${esc(i.cins || '—')}</span>
            <span class="mamul-stok-liste-grid__cell"><span class="sk-kart-badge">${esc(lotSay ? (lotSay + ' lot') : '—')}</span></span>
            <span class="mamul-stok-liste-grid__cell" style="text-align:right;font-family:'DM Mono',monospace;color:${tot > 0 ? 'var(--emerald-c)' : 'var(--text3)'}">${tot.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</span>
            <span class="mamul-stok-liste-grid__cell" style="display:flex;gap:4px;justify-content:flex-end;flex-wrap:wrap">
                <button type="button" class="sk-kart-gecmis" onclick="event.stopPropagation();iplikKartListeyeLotEkle(${idx})" title="Bu stok koduna yeni lot">+ Lot</button>
                <button type="button" class="sk-kart-gecmis" onclick="event.stopPropagation();showDetail(${idx})">Kart</button>
            </span>
        </div></div>`;
        if (!lotSay || !expanded) return row;
        const lotRows = lots.map(l => `<div class="iplik-kart-lot-liste-satir">
            <span>${esc(l.lot_no || '—')}</span>
            <span>${esc(l.marka || '—')}</span>
            <span>${esc(l.renk || '—')}</span>
            <span>${esc(l.tedarikci || '—')}</span>
            <span>${esc(l.cuval_rengi || '—')}</span>
            <span style="text-align:right;font-family:'DM Mono',monospace">${parseInt(l.cuval_sayisi, 10) || 0}</span>
            <span style="text-align:right;font-family:'DM Mono',monospace">${(parseFloat(l.miktar_kg) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kg</span>
        </div>`).join('');
        return row + `<div class="iplik-kart-lot-panel" onclick="event.stopPropagation()">
            <div class="iplik-kart-lot-liste-satir iplik-kart-lot-liste-satir--head">
                <span>Lot no</span><span>Marka</span><span>Renk</span><span>Tedarikçi</span><span>Çuval rengi</span><span style="text-align:right">Çuval</span><span style="text-align:right">Miktar</span>
            </div>
            ${lotRows}
            <div class="iplik-kart-lot-liste-satir" style="font-weight:700;border-top:1px solid var(--border)">
                <span>TOPLAM</span><span></span><span></span><span></span><span></span>
                <span style="text-align:right">${lots.reduce((a, l) => a + (parseInt(l.cuval_sayisi, 10) || 0), 0)}</span>
                <span style="text-align:right;color:var(--emerald-c)">${tot.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kg</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 2px 0">
                <div style="font-size:8px;color:var(--text3)">${esc(lotOzet)}</div>
                <button type="button" class="liste-gecmis-btn" onclick="event.stopPropagation();iplikKartListeyeLotEkle(${idx})">+ Bu koda lot ekle</button>
            </div>
        </div>`;
    }
    window.iplikKartListeSatirHtml = iplikKartListeSatirHtml;

    function kumasStokKartFormHtml(img) {
        const f = (id, label, opts) => {
            opts = opts || {};
            const wrap = `mamul-field${opts.span ? ` mamul-field--span${opts.span}` : ''}`;
            if (opts.type === 'textarea') {
                return `<div class="${wrap}"><label class="pro-label">${label}</label><textarea id="${id}" rows="1" class="pro-input" placeholder="${opts.ph || ''}"></textarea></div>`;
            }
            if (opts.type === 'select') {
                return `<div class="${wrap}"><label class="pro-label">${label}</label><select id="${id}" class="pro-input">${opts.options || ''}</select></div>`;
            }
            return `<div class="${wrap}"><label class="pro-label">${label}</label><input id="${id}" type="${opts.type || 'text'}" class="pro-input" ${opts.extra || ''} placeholder="${opts.ph || ''}"></div>`;
        };
        const fotoInner = img
            ? `<img id="img-preview" src="${img}"><span id="foto-placeholder" style="display:none">📷</span>`
            : `<img id="img-preview" style="display:none" src=""><span id="foto-placeholder">📷</span>`;
        return `
        <div class="mamul-sheet mamul-sheet--kumas">
            <div class="mamul-sheet__toolbar">
                <div class="mamul-sheet__toolbar-left">
                    <div class="mamul-sheet__kod"><input id="val-kodu" readonly title="Ana stok kodu (SM-0001)"></div>
                    <span id="kumas-varyant-kod-onizle" style="font-size:9px;color:var(--text3)">Varyantlar: <span style="font-family:'DM Mono',monospace;color:var(--cyan-c)">SM-0001-1, -2 …</span></span>
                </div>
                <div class="mamul-sheet__toolbar-right">
                    <label for="val-foto" class="mamul-sheet__foto-btn">${fotoInner} Foto</label>
                    <input type="file" id="val-foto" onchange="handleImageUpload(this)" class="hidden">
                    <select id="val-durum" class="pro-input" style="width:auto;padding:3px 8px;font-size:9px;height:26px">
                        <option value="AKTİF">AKTİF</option>
                        <option value="PASİF">PASİF</option>
                        <option value="ARŞİV">ARŞİV</option>
                    </select>
                    <button type="button" class="mamul-sheet__save-btn" onclick="handleSave()">Kaydet</button>
                </div>
            </div>
            <div class="kumas-sheet-info">
                <strong>Ana kart (<span style="font-family:'DM Mono',monospace">SM-0001</span>)</strong> ham kumaşın tüm teknik bilgilerini tutar (atkı, çözgü, sıklık, en/gramaj).
                Depoda ham miktar bu kod üzerinden ilerler.
                <strong>Boyalı varyantlar</strong> yalnızca renk bilgisi taşır
                (<span style="font-family:'DM Mono',monospace">SM-0001-1</span>, <span style="font-family:'DM Mono',monospace">-2</span>, <span style="font-family:'DM Mono',monospace">-3</span>…)
                ve depoda ayrı ayrı stoklanır.
            </div>
            <div class="mamul-sheet__section">Ortak kimlik</div>
            <div class="mamul-sheet__grid mamul-sheet__grid--kumas-kimlik">
                ${f('val-desen-adi', 'Desen adı', { extra: 'style="text-transform:uppercase"', ph: 'Desen adı' })}
                ${f('val-firma', 'Müşteri / firma', { extra: 'style="text-transform:uppercase"', ph: 'Firma' })}
                ${f('val-kumas-cinsi', 'Kumaş cinsi', { extra: 'style="text-transform:uppercase"', ph: 'Saten, armür…' })}
                ${f('val-ana-grup', 'Ana grup', { type: 'select', options: '<option value="EV TEKSTİLİ">Ev Tekstili</option><option value="GIDA TEKSTİLİ">Gıdacı</option><option value="HALI TEKSTİLİ">Halıcı</option>' })}
                ${f('val-urun-adi', 'Ürün adı / tipi', { extra: 'style="text-transform:uppercase"', ph: 'Ürün tipi' })}
            </div>
            <div class="mamul-sheet__section">Ham teknik konstrüksiyon</div>
            <div class="mamul-sheet__grid mamul-sheet__grid--kumas-tek">
                ${f('val-tarak-no', 'Tarak no')}
                ${f('val-tarak-eni', 'Tarak eni (cm)', { ph: 'cm' })}
                ${f('val-atki-sikligi', 'Atkı sıklığı', { ph: '/cm' })}
                ${f('val-cozgu-sikligi', 'Çözgü sıklığı', { ph: '/cm' })}
                ${f('val-cozgu-no', 'Çözgü no')}
                ${f('val-cozgu-cinsi', 'Çözgü cinsi')}
            </div>
            <div class="mamul-sheet__section">Ham atkı ipliği</div>
            ${kumasHamAtkiHtml()}
            <div class="mamul-sheet__section">Ham analizi</div>
            <div class="mamul-sheet__grid mamul-sheet__grid--kumas-analiz">
                ${f('val-ham-en', 'En (cm)', { ph: '0' })}
                ${f('val-ham-boy', 'Boy (mt)', { ph: '0' })}
                ${f('val-ham-gramaj', 'Gramaj (gr/m)', { ph: '0' })}
                ${f('val-ham-gsm', 'Ham GSM', { ph: '0' })}
            </div>
            <div class="mamul-sheet__section">Mamül analizi</div>
            <div class="mamul-sheet__grid mamul-sheet__grid--kumas-analiz">
                ${f('val-mamul-en', 'En (cm)', { ph: '0' })}
                ${f('val-mamul-boy', 'Boy (mt)', { ph: '0' })}
                ${f('val-mamul-gramaj', 'Gramaj (gr/m)', { ph: '0' })}
                ${f('val-mamul-gsm', 'Mamül GSM', { ph: '0' })}
            </div>
            <div class="mamul-sheet__section">Boyalı renk varyantları <span style="font-size:8px;color:var(--text3);font-weight:400">— isteğe bağlı · her renk ayrı stok kodu</span></div>
            <div id="kumas-varyant-kod-onizle" style="font-size:9px;color:var(--text3);margin:0 0 8px;font-family:'DM Mono',monospace"></div>
            <div class="mamul-varyant-bar kumas-varyant-bar">
                <span style="font-size:8px;color:var(--text3);font-family:'DM Mono',monospace;line-height:1.45">Yalnızca renk · boya kodu · not</span>
                <div id="kumas-varyant-bar-btns" class="mamul-varyant-bar__btns"></div>
                <select id="kumas-varyant-jump" class="kumas-varyant-bar__jump" onchange="if(this.value){kumasVaryantKolonunaGit(this.value);this.value='';}">
                    <option value="">Boyalı varyanta git…</option>
                </select>
                <button type="button" onclick="kumasVaryantKolonEkle()" class="btn-pro btn-primary-pro" style="padding:4px 10px;font-size:9px;white-space:nowrap">+ Renk varyantı ekle</button>
            </div>
            <div id="kumas-varyant-list" class="kumas-varyant-list"></div>
            <div class="mamul-sheet__section">Stok ekle <span style="font-size:8px;color:var(--text3);font-weight:400">— isteğe bağlı · depoya giriş hareketi yazılır</span></div>
            <div class="mamul-sheet__grid mamul-sheet__grid--kumas-analiz">
                ${f('val-kumas-ilk-mt', 'Ham stok ekle (mt)', { type: 'number', ph: '0.00', extra: 'min="0" step="0.01" style="font-family:\'DM Mono\',monospace"' })}
                ${f('val-kumas-ilk-kg', 'Ham stok ekle (kg)', { type: 'number', ph: '0.00', extra: 'min="0" step="0.01" style="font-family:\'DM Mono\',monospace"' })}
            </div>
            <div class="mamul-sheet__grid mamul-sheet__grid--aciklama">
                ${f('val-notlar', 'Teknik not', { type: 'textarea', ph: 'Tuşe, apre, müşteri notları…' })}
            </div>
        </div>`;
    }
    window.kumasStokKartFormHtml = kumasStokKartFormHtml;

    function kumasKartListeShellBaslikHtml(opts) {
        opts = opts || {};
        const filtre = String(opts.filtre || window.kumasKartListeFiltre || 'HAM').toUpperCase() === 'MAMUL' ? 'MAMUL' : 'HAM';
        const segBtn = (id, lbl, ikon) => {
            const on = filtre === id;
            return `<button type="button" data-kumas-liste-filtre="${id}" onclick="kumasKartListeFiltreSet('${id}')" class="sk-kart-seg-btn${on ? ' is-on' : ''}">${ikon} ${lbl}</button>`;
        };
        const segHtml = `<span class="sk-kart-seg__lbl">Tür</span>${segBtn('HAM', 'Ham kumaş', '🧵')}${segBtn('MAMUL', 'Mamül kumaş', '🏁')}`;
        return stokKartListeShellBaslikHtml({
            variant: 'kumas',
            grupSayisi: opts.grupSayisi,
            segHtml,
        });
    }
    window.kumasKartListeShellBaslikHtml = kumasKartListeShellBaslikHtml;

    function kumasKartListeTabloKapatHtml(opts) {
        return stokKartListeTabloShellKapatHtml(opts);
    }
    window.kumasKartListeTabloKapatHtml = kumasKartListeTabloKapatHtml;

    function kumasKartListeTabloBaslikHtml() {
        return stokKartListeTabloShellBaslikHtml('kumas-stok-liste-grid',
            '<span></span><span>Stok kodu</span><span>Tarih</span><span>Müşteri</span><span>Kumaş cinsi</span>'
            + '<span>Desen adı</span><span>Boyalı renkler</span><span style="text-align:right">Stok</span><span></span>');
    }
    window.kumasKartListeTabloBaslikHtml = kumasKartListeTabloBaslikHtml;

    function kumasKartListeSatirHtml(i, idx) {
        const esc = (x) => (typeof pdfEsc === 'function' ? pdfEsc(x) : String(x ?? ''));
        const d = typeof kumasDokumaAlanlariOku === 'function' ? kumasDokumaAlanlariOku(i) : {};
        const kod = d.stok_kodu || i.desen_kodu || i.stok_kodu || 'KODSUZ';
        const anaKod = typeof kumasAnaKodBul === 'function' ? kumasAnaKodBul(kod) : kod;
        const vSay = typeof kumasKartListeVaryantSayisi === 'function' ? kumasKartListeVaryantSayisi(anaKod) : 0;
        const mt = typeof kumasAileCanliStokMt === 'function'
            ? kumasAileCanliStokMt(anaKod)
            : (parseFloat(i.miktar_mt) || 0);
        const mtClr = mt > 0 ? 'var(--emerald-c)' : (mt < 0 ? 'var(--rose-c)' : 'var(--text3)');
        const terbiyeOzet = vSay >= 1
            ? `${vSay} boyalı renk`
            : 'Ham';
        return `<div class="mamul-stok-liste-grid mamul-stok-liste-grid--row kumas-stok-liste-grid" onclick="if(!event.target.closest('button'))showDetail(${idx})" title="Dokuma talimat kartını aç">
            <span class="mamul-stok-liste-grid__cell mamul-stok-liste-grid__cell--kod">${esc(kod)}</span>
            <span class="mamul-stok-liste-grid__cell">${esc(d.tarih || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${esc(d.musteri || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${esc(d.kumas_cinsi || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${esc(d.desen_adi || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">${terbiyeOzet}</span>
            <span class="mamul-stok-liste-grid__cell" style="text-align:right;font-family:'DM Mono',monospace;color:${mtClr}" title="Güncel stok">${mt.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} mt</span>
            <span class="mamul-stok-liste-grid__cell">${esc(d.ham_en || '—')}</span>
            <span class="mamul-stok-liste-grid__cell">
                <button type="button" class="liste-gecmis-btn" onclick="event.stopPropagation();showDetailOpenGecmis(${idx})">Geçmiş</button>
            </span>
        </div>`;
    }
    window.kumasKartListeSatirHtml = kumasKartListeSatirHtml;


    function kumasKutuphanesiKartBul(kod) {
        const k = String(kod || '').trim().toUpperCase();
        if (!k) return null;
        const list = (typeof dataCache !== 'undefined' && dataCache.kumas_kutuphanesi) || [];
        const ana = kumasAnaKodBul(k);
        const vNo = kumasVaryantNoBul(k);
        return list.find(x => {
            const a = String(x.stok_kodu || '').trim().toUpperCase();
            const b = String(x.desen_kodu || '').trim().toUpperCase();
            if (a === k || b === k) return true;
            /* SM-0001 ↔ SM0001 aynı ham kart */
            if (vNo === 0) {
                const ax = a || b;
                if (ax && kumasVaryantNoBul(ax) === 0 && kumasAnaKodBul(ax) === ana) return true;
            }
            return false;
        }) || null;
    }
    window.kumasKutuphanesiKartBul = kumasKutuphanesiKartBul;

    function kumasKartDoluSkoru(rec) {
        if (!rec) return 0;
        const keys = ['desen_adi', 'urun_adi', 'firma', 'kumas_cinsi', 'notlar', 'boya_not', 'terbiye'];
        let s = 0;
        keys.forEach(k => { if (String(rec[k] || '').trim()) s += 1; });
        if (parseFloat(rec.miktar_mt) > 0) s += 2;
        if (parseFloat(rec.miktar_kg) > 0) s += 1;
        return s;
    }

    /** SM0001 / SM0001-2 → tire-siz (silinecek / dönüştürülecek) */
    function kumasStokKodTireSizMi(kod) {
        return /^(SM|NU)\d+/i.test(String(kod || '').trim());
    }
    window.kumasStokKodTireSizMi = kumasStokKodTireSizMi;

    /** SM0001 kartlarını yok et; yalnız SM-0001 kalsın. Hareket kodlarını da SM-XXXX yap. */
    async function kumasStokKodNormalizeTemizle(opts) {
        opts = opts || {};
        const silent = !!opts.silent;
        if (typeof sb === 'undefined' || !sb) {
            if (!silent && typeof erpToast === 'function') erpToast('Supabase bağlantısı yok.', 'error');
            return { ok: false, error: 'no-sb' };
        }
        const toast = (msg, t) => { if (!silent && typeof erpToast === 'function') erpToast(msg, t || 'info'); };
        toast('Tire-siz SM kodları siliniyor, SM-0001 formatına geçiliyor…', 'info');

        let lib = [];
        try {
            const { data, error } = await sb.from('kumas_kutuphanesi')
                .select('id,desen_kodu,stok_kodu,desen_adi,urun_adi,firma,kumas_cinsi,notlar,miktar_mt,miktar_kg,created_at,updated_at')
                .limit(8000);
            if (error) throw error;
            lib = data || [];
        } catch (e) {
            try {
                const { data, error } = await sb.from('kumas_kutuphanesi')
                    .select('id,desen_kodu,stok_kodu,created_at,updated_at')
                    .limit(8000);
                if (error) throw error;
                lib = data || [];
            } catch (e2) {
                /* Son çare: önbellek */
                const cached = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.kumas_kutuphanesi))
                    ? dataCache.kumas_kutuphanesi : [];
                if (!cached.length) {
                    toast('Kartlar okunamadı: ' + (e2.message || e2), 'error');
                    return { ok: false, error: e2 };
                }
                lib = cached.slice();
            }
        }

        const byCanon = new Map();
        lib.forEach(rec => {
            const raw = String(rec.desen_kodu || rec.stok_kodu || '').trim();
            if (!raw || !/^(SM|NU)/i.test(raw)) return;
            const canon = kumasStokKodCanon(raw);
            if (!canon || !/^(SM|NU)-\d+/i.test(canon)) return;
            if (!byCanon.has(canon)) byCanon.set(canon, []);
            byCanon.get(canon).push(rec);
        });

        let renamed = 0, deleted = 0, hareket = 0;

        for (const [canon, group] of byCanon.entries()) {
            /* Önce SM-0001 (tireli), sonra dolu skor, sonra eski kayıt */
            group.sort((a, b) => {
                const aKod = String(a.desen_kodu || a.stok_kodu || '').trim().toUpperCase();
                const bKod = String(b.desen_kodu || b.stok_kodu || '').trim().toUpperCase();
                const aTire = kumasStokKodTireSizMi(aKod) ? 0 : 1;
                const bTire = kumasStokKodTireSizMi(bKod) ? 0 : 1;
                if (aTire !== bTire) return bTire - aTire;
                const aExact = aKod === canon ? 1 : 0;
                const bExact = bKod === canon ? 1 : 0;
                if (aExact !== bExact) return bExact - aExact;
                const ds = kumasKartDoluSkoru(b) - kumasKartDoluSkoru(a);
                if (ds) return ds;
                return new Date(a.created_at || 0) - new Date(b.created_at || 0);
            });
            const keeper = group[0];
            const losers = group.slice(1);

            /* Keeper tire-sizse → SM-0001 yap */
            const keepKod = String(keeper.desen_kodu || keeper.stok_kodu || '').trim().toUpperCase();
            if (keepKod !== canon) {
                try {
                    const { error } = await sb.from('kumas_kutuphanesi')
                        .update({ desen_kodu: canon, stok_kodu: canon })
                        .eq('id', keeper.id);
                    if (!error) {
                        renamed += 1;
                        keeper.desen_kodu = canon;
                        keeper.stok_kodu = canon;
                    } else {
                        console.warn('[kumasKodNormalize] rename', error);
                    }
                } catch (e) { console.warn('[kumasKodNormalize] rename', e); }
            }

            /* Diğerleri (özellikle SM0001) tamamen sil */
            for (const loser of losers) {
                try {
                    const { error } = await sb.from('kumas_kutuphanesi').delete().eq('id', loser.id);
                    if (!error) deleted += 1;
                    else console.warn('[kumasKodNormalize] delete', error);
                } catch (e) { console.warn('[kumasKodNormalize] delete', e); }
            }
        }

        /* Kalan tire-siz tek kartlar (grupta yalnız SM0001 vardı) yukarıda rename ile SM- oldu.
           Ek tarama: hâlâ tire-siz kalan varsa sil veya rename et */
        try {
            const kalanTireSiz = (lib || []).filter(rec => {
                const raw = String(rec.desen_kodu || rec.stok_kodu || '').trim();
                return kumasStokKodTireSizMi(raw);
            });
            for (const rec of kalanTireSiz) {
                const raw = String(rec.desen_kodu || rec.stok_kodu || '').trim();
                const canon = kumasStokKodCanon(raw);
                const tireliKardes = lib.find(x => {
                    if (String(x.id) === String(rec.id)) return false;
                    const k = String(x.desen_kodu || x.stok_kodu || '').trim().toUpperCase();
                    return k === canon;
                });
                if (tireliKardes) {
                    const { error } = await sb.from('kumas_kutuphanesi').delete().eq('id', rec.id);
                    if (!error) deleted += 1;
                } else if (String(rec.desen_kodu || '').toUpperCase() !== canon) {
                    const { error } = await sb.from('kumas_kutuphanesi')
                        .update({ desen_kodu: canon, stok_kodu: canon })
                        .eq('id', rec.id);
                    if (!error) renamed += 1;
                }
            }
        } catch (e) { console.warn('[kumasKodNormalize] ekstra', e); }

        /* Depo hareketleri: SM0001 → SM-0001 */
        try {
            const { data: stokRows, error } = await sb.from('kumas_stok')
                .select('id,stok_kodu')
                .or('stok_kodu.ilike.SM%,stok_kodu.ilike.NU%')
                .limit(20000);
            if (error) throw error;
            const updates = [];
            (stokRows || []).forEach(row => {
                const raw = String(row.stok_kodu || '').trim();
                if (!kumasStokKodTireSizMi(raw) && raw.toUpperCase() === kumasStokKodCanon(raw)) return;
                const canon = kumasStokKodCanon(raw);
                if (canon && canon !== raw.toUpperCase()) updates.push({ id: row.id, stok_kodu: canon });
            });
            for (let i = 0; i < updates.length; i += 40) {
                const chunk = updates.slice(i, i + 40);
                await Promise.all(chunk.map(u =>
                    sb.from('kumas_stok').update({ stok_kodu: u.stok_kodu }).eq('id', u.id)
                ));
                hareket += chunk.length;
            }
        } catch (e) {
            console.warn('[kumasKodNormalize] stok', e);
        }

        /* Cache güncelle: tire-siz satırları düşür / canon yap */
        try {
            if (typeof dataCache !== 'undefined' && Array.isArray(dataCache.kumas_kutuphanesi)) {
                const drop = new Set();
                const seen = new Map();
                dataCache.kumas_kutuphanesi.forEach(rec => {
                    const raw = String(rec.desen_kodu || rec.stok_kodu || '').trim();
                    if (!/^(SM|NU)/i.test(raw)) return;
                    const canon = kumasStokKodCanon(raw);
                    if (!seen.has(canon)) {
                        seen.set(canon, rec);
                        rec.desen_kodu = canon;
                        rec.stok_kodu = canon;
                    } else if (kumasStokKodTireSizMi(raw) || String(rec.id) !== String(seen.get(canon).id)) {
                        drop.add(rec.id);
                    }
                });
                if (drop.size) {
                    dataCache.kumas_kutuphanesi = dataCache.kumas_kutuphanesi.filter(r => !drop.has(r.id));
                }
                if (typeof stockCards !== 'undefined') stockCards = dataCache.kumas_kutuphanesi;
            }
            if (typeof dataCache !== 'undefined' && Array.isArray(dataCache.kumas_stok)) {
                dataCache.kumas_stok.forEach(r => {
                    const raw = String(r.stok_kodu || '').trim();
                    const canon = kumasStokKodCanon(raw);
                    if (canon && /^(SM|NU)-\d+/i.test(canon)) r.stok_kodu = canon;
                });
            }
        } catch (e) {}

        const msg = `Tamam: ${deleted} tire-siz kart silindi, ${renamed} SM-XXXX yapıldı, ${hareket} hareket güncellendi.`;
        toast(msg, 'success');
        return { ok: true, renamed, deleted, hareket };
    }
    window.kumasStokKodNormalizeTemizle = kumasStokKodNormalizeTemizle;

    function kumasStokKodCiftleriVarMi(list) {
        const rows = list || (typeof dataCache !== 'undefined' ? dataCache.kumas_kutuphanesi : []) || [];
        let needs = 0;
        const map = new Map();
        rows.forEach(rec => {
            const raw = String(rec.desen_kodu || rec.stok_kodu || '').trim();
            if (!raw || !/^(SM|NU)/i.test(raw)) return;
            if (kumasStokKodTireSizMi(raw)) needs += 1;
            const canon = kumasStokKodCanon(raw);
            if (!/^(SM|NU)-\d+/i.test(canon)) return;
            if (raw.toUpperCase() !== canon) needs += 1;
            map.set(canon, (map.get(canon) || 0) + 1);
        });
        map.forEach(n => { if (n > 1) needs += 1; });
        if (typeof dataCache !== 'undefined' && Array.isArray(dataCache.kumas_stok)) {
            for (const r of dataCache.kumas_stok) {
                if (kumasStokKodTireSizMi(r.stok_kodu)) { needs += 1; break; }
            }
        }
        return needs > 0;
    }
    window.kumasStokKodCiftleriVarMi = kumasStokKodCiftleriVarMi;

    async function kumasStokKodNormalizeGerekirse() {
        try {
            try { localStorage.removeItem('kumas_kod_sm_tire_v2'); } catch (e) {}
            if (!kumasStokKodCiftleriVarMi()) {
                try { localStorage.setItem('kumas_kod_sm_tire_v3', '1'); } catch (e) {}
                return;
            }
            const r = await kumasStokKodNormalizeTemizle({ silent: false });
            if (r && r.ok) {
                try { localStorage.setItem('kumas_kod_sm_tire_v3', '1'); } catch (e) {}
                if (typeof loadData === 'function') setTimeout(() => loadData(), 400);
            }
        } catch (e) {
            console.warn('[kumasStokKodNormalizeGerekirse]', e);
        }
    }
    window.kumasStokKodNormalizeGerekirse = kumasStokKodNormalizeGerekirse;

    function kumasKartTeknikDetay(x) {
        const rec = x || {};
        const txt = (...vals) => vals.map(v => String(v == null ? '' : v).trim()).find(Boolean) || '';
        const dok = typeof kumasDokumaAlanlariOku === 'function' ? kumasDokumaAlanlariOku(rec) : null;
        const meta = (typeof kumasMetaAl === 'function' ? (kumasMetaAl(rec) || {}) : {}) || {};
        const tarakEni = txt(dok?.tarak_eni, rec.tarak_eni, meta.tarak_eni);
        const atkiSik = txt(dok?.atki_sikligi, rec.atki_sikligi, rec.atki_siklik, meta.atki_sikligi, meta.atki_siklik);
        const cozguSik = txt(dok?.cozgu_sikligi, rec.cozgu_sikligi, rec.dizim_sikligi, meta.cozgu_sikligi);
        const cozguIpi = txt(
            dok ? [dok.cozgu_no, dok.cozgu_cinsi].filter(Boolean).join(' ').trim() : '',
            rec.cozgu_ipi,
            meta.cozgu_ipi,
            [txt(rec.cozgu_no, meta.cozgu_no), txt(rec.cozgu_cinsi, meta.cozgu_cinsi)].filter(Boolean).join(' ').trim()
        );
        let atkiIpi = txt(dok?.atki_recete, rec.atki_renkleri, rec.atki_ipi, rec.atki_detayi, meta.atki_ipi);
        if (!atkiIpi && Array.isArray(meta.atki)) {
            atkiIpi = meta.atki.map(a => [a.iplik_no, a.cinsi || a.cins, a.renk].filter(Boolean).join(' ')).filter(Boolean).join(' | ');
        }
        return {
            tarak_eni: tarakEni,
            atki_sikligi: atkiSik,
            cozgu_sikligi: cozguSik,
            atki_ipi: atkiIpi,
            cozgu_ipi: cozguIpi
        };
    }
    window.kumasKartTeknikDetay = kumasKartTeknikDetay;

    function kumasKartTeknikUygula(hedef, kaynak) {
        const d = kumasKartTeknikDetay(kaynak);
        Object.assign(hedef, d);
        return d;
    }

    function kumasKartTeknikSatir(d) {
        const dash = '—';
        const x = d || {};
        return [
            `Tarak eni ${x.tarak_eni || dash}`,
            `Atkı sıklığı ${x.atki_sikligi || dash}`,
            `Çözgü sıklığı ${x.cozgu_sikligi || dash}`,
            `Atkı ipi ${x.atki_ipi || dash}`,
            `Çözgü ipi ${x.cozgu_ipi || dash}`
        ].join(' · ');
    }
    window.kumasKartTeknikSatir = kumasKartTeknikSatir;

    function kumasDepoStokKoduMu(kod) {
        const k = String(kod || '').trim().toUpperCase();
        if (!k || k === 'KODSUZ') return false;
        return /^(SM|NU)-?\d+(-\d+)?$/i.test(k);
    }
    window.kumasDepoStokKoduMu = kumasDepoStokKoduMu;

    // ─── İplik stok listesi (Kumaş / Mamül ms-ekran düzeni) ─────────────────
    window.iplikStokHizliFiltre = window.iplikStokHizliFiltre || 'POZITIF';

    function iplikDepoLotAnahtar(stokKodu, lotNo, marka) {
        return `${String(stokKodu || '').trim()}-${String(lotNo || 'LOTSUZ').trim()}-${String(marka || 'GENEL').trim()}`.toLowerCase();
    }

    /** Gerçek depo hareketi mi? (kart tanımı / sentetik lot meta hariç) */
    function iplikDepoHareketiMi(r) {
        if (!r) return false;
        if (typeof iplikKartTanimKaydiMi === 'function' && iplikKartTanimKaydiMi(r)) return false;
        const kb = String(r.kaynak_birim || '').toUpperCase();
        if (kb === 'IPLIK_KART_GIRIS' || kb === 'KART_GIRIS' || kb === 'IPLIK_KART_STOK') return false;
        if (r._fromKart) return false;
        const not = String(r.notlar || '');
        if (not.includes('[KART_LOT]')) return false;
        const kg = parseFloat(r.miktar_kg) || 0;
        const mt = parseFloat(r.miktar_mt) || 0;
        const ad = parseInt(r.cuval_sayisi, 10) || 0;
        return kg !== 0 || mt !== 0 || ad !== 0;
    }
    window.iplikDepoHareketiMi = iplikDepoHareketiMi;

    /** Stok kartlarındaki lot kg → sentetik giriş satırları */
    function iplikKartlardanSentetikHareketler() {
        const kartlar = typeof iplikKartlariListe === 'function'
            ? iplikKartlariListe()
            : (typeof dataCache !== 'undefined' ? (dataCache.iplik_stok || []) : []);
        const out = [];
        (kartlar || []).forEach(kart => {
            const lots = typeof iplikKartLotlariAl === 'function' ? iplikKartLotlariAl(kart) : [];
            (lots || []).forEach(lot => {
                const kg = parseFloat(lot.miktar_kg) || 0;
                if (!kg) return;
                const lotNo = String(lot.lot_no || '').trim() || 'LOTSUZ';
                out.push({
                    id: `kart-${kart.id || 'x'}-${lotNo}`,
                    stok_kodu: String(kart.stok_kodu || '').trim() || 'IP-XXXX',
                    iplik_no: String(kart.iplik_no || '').trim() || 'BİLİNMEYEN',
                    marka: String(lot.marka || kart.marka || 'GENEL').trim() || 'GENEL',
                    cins: String(kart.cins || '---').trim() || '---',
                    lot_no: lotNo,
                    miktar_kg: kg,
                    cuval_sayisi: parseInt(lot.cuval_sayisi, 10) || 0,
                    cuval_rengi: String(lot.cuval_rengi || kart.cuval_rengi || '').trim(),
                    renk: lot.renk || kart.renk || '',
                    tedarikci: lot.tedarikci || kart.tedarikci || '',
                    depo_konum: lot.depo_konum || kart.depo_konum || '',
                    araci_firma: lot.tedarikci || kart.tedarikci || '',
                    kaynak_birim: 'IPLIK_KART_STOK',
                    islem_turu: 'GİRİŞ',
                    created_at: kart.created_at || kart.updated_at || new Date().toISOString(),
                    notlar: `[KART_LOT]\n[KART_ID:${kart.id || ''}]\nKart lot stoğu`,
                    _fromKart: true,
                    _kart_id: kart.id
                });
            });
        });
        return out;
    }
    window.iplikKartlardanSentetikHareketler = iplikKartlardanSentetikHareketler;

    /** Kart kaydındaki lot kg’lerini kalıcı depo GİRİŞ satırı olarak yazar (çift kayıt yok).
     *  Kartta görünen miktar = kalan stok ise: KART_AKTARIM = kalan − diğer hareketler neti. */
    window.iplikKartAcilisStokunuYaz = async function iplikKartAcilisStokunuYaz(kart) {
        if (!kart || kart.id == null || typeof sb === 'undefined' || !sb?.from) return 0;
        const lots = typeof iplikKartLotlariAl === 'function' ? iplikKartLotlariAl(kart) : [];
        const all = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.iplik_stok)) ? dataCache.iplik_stok : [];
        const user = String((typeof erpCurrentUser !== 'undefined' && (erpCurrentUser?.display_name || erpCurrentUser?.username)) || kart.updated_by || '—');
        const stokKod = String(kart.stok_kodu || '').trim();
        let n = 0;
        for (const lot of (lots || [])) {
            const lotKg = parseFloat(lot.miktar_kg) || 0;
            if (!(lotKg > 0) && lotKg !== 0) continue;
            const lotNo = String(lot.lot_no || '').trim() || 'LOTSUZ';
            const tag = `${kart.id}:${lotNo}`;
            const tagLow = tag.toLowerCase();
            const existing = all.find(r => {
                const m = String(r.notlar || '').match(/\[KART_AKTARIM:([^\]]+)\]/);
                return m && String(m[1]).toLowerCase() === tagLow;
            });
            // Diğer hareketlerin neti (açılış aktarımı hariç) — kart miktarı kalan stok kabul edilir
            let otherNet = 0;
            all.forEach(r => {
                if (!iplikDepoHareketiMi(r)) return;
                if (String(r.stok_kodu || '').trim().toUpperCase() !== stokKod.toUpperCase()) return;
                if (String(r.lot_no || 'LOTSUZ').trim().toUpperCase() !== lotNo.toUpperCase()) return;
                if (existing && String(r.id) === String(existing.id)) return;
                const m = String(r.notlar || '').match(/\[KART_AKTARIM:([^\]]+)\]/);
                if (m && String(m[1]).toLowerCase() === tagLow) return;
                otherNet += parseFloat(r.miktar_kg) || 0;
            });
            const kg = Math.round((lotKg - otherNet) * 1000) / 1000;
            if (!(kg > 0) && !existing) continue;
            const payload = {
                stok_kodu: stokKod,
                iplik_no: String(kart.iplik_no || '').trim(),
                lot_no: lotNo,
                marka: String(lot.marka || kart.marka || 'GENEL').trim() || 'GENEL',
                cins: String(lot.cins || kart.cins || '').trim(),
                miktar_kg: kg > 0 ? kg : 0,
                cuval_sayisi: parseInt(lot.cuval_sayisi, 10) || 0,
                cuval_rengi: String(lot.cuval_rengi || kart.cuval_rengi || '').trim(),
                renk: lot.renk || kart.renk || '',
                tedarikci: lot.tedarikci || kart.tedarikci || '',
                depo_konum: lot.depo_konum || kart.depo_konum || '',
                araci_firma: lot.tedarikci || kart.tedarikci || '',
                kaynak_birim: 'DEPO_HAREKET_IPLIK',
                islem_turu: 'GİRİŞ',
                updated_by: user,
                notlar: `[KART_AKTARIM:${tag}]\nStok kartı açılış stoğu`
            };
            if (existing && existing.id) {
                const curKg = parseFloat(existing.miktar_kg) || 0;
                const curAd = parseInt(existing.cuval_sayisi, 10) || 0;
                if (Math.abs(curKg - payload.miktar_kg) < 1e-9 && curAd === (payload.cuval_sayisi || 0)) continue;
                const { error } = await sb.from('iplik_stok').update({
                    miktar_kg: payload.miktar_kg,
                    cuval_sayisi: payload.cuval_sayisi,
                    marka: payload.marka,
                    updated_by: user
                }).eq('id', existing.id);
                if (error) throw error;
                const ix = all.findIndex(x => String(x.id) === String(existing.id));
                if (ix >= 0) {
                    all[ix] = { ...all[ix], miktar_kg: payload.miktar_kg, cuval_sayisi: payload.cuval_sayisi, marka: payload.marka, updated_by: user };
                }
                n++;
                continue;
            }
            if (!(payload.miktar_kg > 0)) continue;
            const { data, error } = await sb.from('iplik_stok').insert(payload).select('id').limit(1);
            if (error) throw error;
            const row = { ...payload, id: data?.[0]?.id, created_at: new Date().toISOString() };
            if (typeof dataCache !== 'undefined' && Array.isArray(dataCache.iplik_stok)) {
                dataCache.iplik_stok = [row].concat(dataCache.iplik_stok);
            }
            n++;
        }
        return n;
    };

    /** Çıkış sonrası karttaki açılış lot kg’lerini güncel kalan bakiyeye çek. */
    window.iplikKartAcilisStokunuDus = async function iplikKartAcilisStokunuDus(stokKodu) {
        const kod = String(stokKodu || '').trim();
        if (!kod || typeof sb === 'undefined' || !sb?.from) return false;
        const kart = typeof iplikKartKayitBulByKod === 'function' ? iplikKartKayitBulByKod(kod) : null;
        if (!kart || kart.id == null) return false;
        const canli = typeof iplikKartLotlariCanliAl === 'function' ? iplikKartLotlariCanliAl(kart) : iplikKartLotlariAl(kart);
        const notlar = typeof iplikNotlarOlustur === 'function'
            ? iplikNotlarOlustur(kart.notlar, canli)
            : kart.notlar;
        const L0 = canli[0] || {};
        const patch = {
            notlar,
            lot_no: L0.lot_no || kart.lot_no || '',
            marka: String(L0.marka || kart.marka || '').trim(),
            renk: String(L0.renk || kart.renk || '').trim(),
            miktar_kg: 0,
            updated_by: String((typeof erpCurrentUser !== 'undefined' && (erpCurrentUser?.display_name || erpCurrentUser?.username)) || kart.updated_by || '—')
        };
        const { error } = await sb.from('iplik_stok').update(patch).eq('id', kart.id);
        if (error) {
            console.warn('iplikKartAcilisStokunuDus', error.message || error);
            return false;
        }
        const all = dataCache.iplik_stok || [];
        const ix = all.findIndex(x => String(x.id) === String(kart.id));
        if (ix >= 0) {
            all[ix] = { ...all[ix], ...patch };
            delete all[ix]._search_idx;
        }
        return true;
    };

    /** Kumaş kartındaki miktar_mt alanını depo net bakiyesine çek. */
    window.kumasKartAcilisStokunuDus = async function kumasKartAcilisStokunuDus(stokKodu) {
        const kod = String(stokKodu || '').trim();
        if (!kod || typeof sb === 'undefined' || !sb?.from) return false;
        const kart = typeof kumasKutuphanesiKartBul === 'function' ? kumasKutuphanesiKartBul(kod) : null;
        if (!kart || kart.id == null) return false;
        const bak = typeof depoKumasBakiyeHesapla === 'function' ? depoKumasBakiyeHesapla(kod) : { mt: 0 };
        const mt = Math.round((parseFloat(bak.mt) || 0) * 1000) / 1000;
        const cur = parseFloat(kart.miktar_mt);
        if (Number.isFinite(cur) && Math.abs(cur - mt) < 1e-9) return true;
        const patch = {
            miktar_mt: mt,
            updated_by: String((typeof erpCurrentUser !== 'undefined' && (erpCurrentUser?.display_name || erpCurrentUser?.username)) || kart.updated_by || '—')
        };
        const { error } = await sb.from('kumas_kutuphanesi').update(patch).eq('id', kart.id);
        if (error) {
            // miktar_mt kolonu yoksa sessiz geç
            if (!/miktar_mt|column/i.test(String(error.message || ''))) {
                console.warn('kumasKartAcilisStokunuDus', error.message || error);
            }
            // yine de cache'i güncelle (liste canlı bakiyeden okur)
            const lib = dataCache.kumas_kutuphanesi || [];
            const ix = lib.findIndex(x => String(x.id) === String(kart.id));
            if (ix >= 0) lib[ix] = { ...lib[ix], miktar_mt: mt };
            return false;
        }
        const lib = dataCache.kumas_kutuphanesi || [];
        const ix = lib.findIndex(x => String(x.id) === String(kart.id));
        if (ix >= 0) lib[ix] = { ...lib[ix], ...patch };
        return true;
    };

    /**
     * Depo stok hesabı: karttaki açılış lot kg + gerçek giriş/çıkış.
     * Kart lotu, yalnızca [KART_AKTARIM] ile kalıcı depoya yazıldıysa tekrar eklenmez.
     */
    function iplikDepoStokHareketleriHazirla(allRows) {
        const src = allRows || [];
        const real = src.filter(iplikDepoHareketiMi);
        const aktarilmis = new Set();
        src.forEach(r => {
            const m = String(r.notlar || '').match(/\[KART_AKTARIM:([^\]]+)\]/);
            if (m) aktarilmis.add(String(m[1]).toLowerCase());
        });
        /* Manuel girişi olan lot anahtarları — sentetik satır başına tarama yapmamak için */
        const manuelGirisKeys = new Set();
        real.forEach(r => {
            const tip = String(r.islem_turu || '').toUpperCase();
            if (tip !== 'GİRİŞ' && tip !== 'GIRIS') return;
            if (!((parseFloat(r.miktar_kg) || 0) > 0)) return;
            manuelGirisKeys.add(iplikDepoLotAnahtar(r.stok_kodu, r.lot_no, r.marka));
        });
        const syn = iplikKartlardanSentetikHareketler().filter(s => {
            const tag = `${s._kart_id || ''}:${s.lot_no}`.toLowerCase();
            if (aktarilmis.has(tag)) return false;
            return !manuelGirisKeys.has(iplikDepoLotAnahtar(s.stok_kodu, s.lot_no, s.marka));
        });
        return real.concat(syn);
    }
    window.iplikDepoStokHareketleriHazirla = iplikDepoStokHareketleriHazirla;

    function iplikStokListeGruplariOlustur(hareketler) {
        const rows = iplikDepoStokHareketleriHazirla(hareketler);
        const map = {};
        rows.forEach(curr => {
            const ipNo = (curr.iplik_no || 'BİLİNMEYEN').toString().trim();
            const lotNo = (curr.lot_no || 'LOTSUZ').toString().trim();
            const marka = (curr.marka || 'GENEL').toString().trim();
            const cins = (curr.cins || '---').toString().trim();
            const sKodu = (curr.stok_kodu || 'IP-XXXX').toString().trim();
            // Her stok kodu ayrı satır (aynı iplik no farklı kartlarda birleşmesin)
            const gKey = sKodu.toLowerCase();
            if (!map[gKey]) {
                map[gKey] = {
                    iplik_no: ipNo,
                    marka,
                    cins,
                    stok_kodu: sKodu,
                    total_kg: 0,
                    net_kg: 0,
                    lot_sayisi: 0,
                    lots: {},
                    movements: []
                };
            }
            const g = map[gKey];
            const lotKey = `${lotNo}||${marka}`.toLowerCase();
            if (!g.lots[lotKey]) {
                g.lots[lotKey] = {
                    lot_no: lotNo,
                    marka,
                    cins,
                    stok_kodu: sKodu,
                    total_kg: 0,
                    net_kg: 0,
                    movements: []
                };
            }
            const lot = g.lots[lotKey];
            const kg = parseFloat(curr.miktar_kg) || 0;
            lot.total_kg += kg;
            lot.net_kg = lot.total_kg;
            lot.movements.push(curr);
            if (!lot.cins || lot.cins === '---') lot.cins = cins;
            g.total_kg += kg;
            g.net_kg = g.total_kg;
            g.movements.push(curr);
            if ((!g.iplik_no || g.iplik_no === 'BİLİNMEYEN') && ipNo !== 'BİLİNMEYEN') g.iplik_no = ipNo;
            if ((!g.marka || g.marka === 'GENEL') && marka !== 'GENEL') g.marka = marka;
            if ((!g.cins || g.cins === '---') && cins !== '---') g.cins = cins;
        });
        const sira = (kod) => (typeof iplikIpKoduSira === 'function' ? iplikIpKoduSira(kod) : 99999);
        return Object.values(map).map(g => {
            const lots = Object.values(g.lots).sort((a, b) => (b.net_kg || 0) - (a.net_kg || 0));
            return {
                iplik_no: g.iplik_no,
                marka: g.marka,
                cins: g.cins,
                stok_kodu: g.stok_kodu,
                total_kg: g.total_kg,
                net_kg: g.net_kg,
                lot_sayisi: lots.length,
                lots,
                movements: g.movements
            };
        }).sort((a, b) => sira(a.stok_kodu) - sira(b.stok_kodu) || (b.net_kg || 0) - (a.net_kg || 0));
    }
    window.iplikStokListeGruplariOlustur = iplikStokListeGruplariOlustur;

    function iplikStokListeMetinEslesir(g, s) {
        if (!s) return true;
        const lotBlob = (g.lots || []).map(l => [l.lot_no, l.marka, l.cins, l.stok_kodu].join(' ')).join(' ');
        const blob = [g.iplik_no, g.marka, g.cins, g.stok_kodu, lotBlob].join(' ').toLowerCase();
        return blob.includes(s);
    }

    function iplikStokListeFiltreliGruplar(hamGrps, s, filtre, ekFiltre) {
        let grps = (hamGrps || []).filter(g => iplikStokListeMetinEslesir(g, s));
        if (ekFiltre && typeof window.stokGrupFiltreEslesir === 'function') {
            grps = grps.filter(g => window.stokGrupFiltreEslesir(g, ekFiltre));
        }
        const sayac = {
            hepsi: grps.length,
            pozitif: grps.filter(g => (parseFloat(g.net_kg) || 0) > 0).length,
            kritik: grps.filter(g => (parseFloat(g.net_kg) || 0) <= 0).length
        };
        const f = filtre || 'POZITIF';
        if (f === 'POZITIF') grps = grps.filter(g => (parseFloat(g.net_kg) || 0) > 0);
        else if (f === 'KRITIK') grps = grps.filter(g => (parseFloat(g.net_kg) || 0) <= 0);
        const topNet = grps.reduce((a, g) => a + (parseFloat(g.net_kg) || 0), 0);
        return { grps, sayac, topNet, filtre: f };
    }
    window.iplikStokListeFiltreliGruplar = iplikStokListeFiltreliGruplar;

    function iplikStokListeOzetDomGuncelle(ozet) {
        ozet = ozet || {};
        const netKg = Number(ozet.netKg || 0);
        const hero = document.getElementById('iplik-stok-hero-kg');
        const sub = document.getElementById('iplik-stok-sub');
        if (hero) {
            hero.classList.toggle('is-neg', netKg < 0);
            hero.innerHTML = `${netKg.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}<span>kg</span>`;
        }
        if (sub) {
            const n = Array.isArray(window._iplikGroups) ? window._iplikGroups.length : 0;
            sub.textContent = String(n);
        }
    }
    window.iplikStokListeOzetDomGuncelle = iplikStokListeOzetDomGuncelle;

    /** İplik / Kumaş / Mamül depo listeleri — ortak üst kart şablonu */
    function depoStokShellHtml(cfg) {
        cfg = cfg || {};
        const variant = String(cfg.variant || 'iplik');
        const desk = !!cfg.masaustu;
        const heroNeg = !!cfg.heroNeg;
        const heroVal = cfg.heroVal != null ? cfg.heroVal : '0';
        const heroUnit = cfg.heroUnit || '';
        const metrics = Array.isArray(cfg.metrics) ? cfg.metrics : [];
        const defaultMetrics = metrics.length ? metrics : [
            { id: cfg.heroId, val: heroVal, unit: heroUnit, lbl: cfg.heroLbl || 'Toplam', primary: true, neg: heroNeg },
            { id: cfg.countId || cfg.subId, val: cfg.countVal != null ? cfg.countVal : '0', lbl: cfg.countLbl || 'Kalem', primary: false }
        ];
        const metricsHtml = defaultMetrics.map((m) => {
            const neg = m.neg ? ' is-neg' : '';
            const pri = m.primary ? ' depo-stok-metric--primary' : '';
            const unit = m.unit ? `<span>${m.unit}</span>` : '';
            const idAttr = m.id ? ` id="${m.id}"` : '';
            return `<div class="depo-stok-metric${pri}">
                <div class="depo-stok-metric__val${neg}"${idAttr}>${m.val}${unit}</div>
                <div class="depo-stok-metric__lbl">${m.lbl || ''}</div>
            </div>`;
        }).join('');
        return `<div id="${cfg.shellId || ''}" class="ms-ekran ms-ekran--${variant} depo-stok depo-stok--${variant}${desk ? ' ms-ekran--desk' : ''}">
            <div class="depo-stok-hero">
                <div class="depo-stok-hero__left">
                    <div class="depo-stok-hero__icon" aria-hidden="true">${cfg.icon || '📦'}</div>
                    <div class="depo-stok-hero__titles">
                        <div class="depo-stok-hero__title">${cfg.title || 'Depo Stoğu'}</div>
                        <div class="depo-stok-hero__desc">${cfg.desc || ''}</div>
                    </div>
                </div>
                <div class="depo-stok-hero__metrics">${metricsHtml}</div>
                <div class="depo-stok-hero__actions">${cfg.toolsHtml || ''}</div>
            </div>
            <div class="depo-stok-bar"><div class="ms-seg">${cfg.segHtml || ''}</div></div>
            ${cfg.filtreBar || ''}
            <div class="depo-stok-body"><div id="${cfg.dynamicId || ''}">${cfg.dynamicHtml || ''}</div></div>
        </div>`;
    }
    window.depoStokShellHtml = depoStokShellHtml;

    window.iplikStokListeGovdeGuncelle = function () {
        if (typeof loadData === 'function') loadData({ iplikBodyOnly: true });
    };

    function iplikStokHizliFiltreSet(id) {
        window.iplikStokHizliFiltre = id || 'POZITIF';
        window._iplikAcikIdx = null;
        if (typeof loadData === 'function') loadData({ iplikBodyOnly: true });
        else if (typeof iplikStokListeGovdeGuncelle === 'function') iplikStokListeGovdeGuncelle();
    }
    window.iplikStokHizliFiltreSet = iplikStokHizliFiltreSet;

    function iplikHareketTipEtiket(r) {
        if (r && r._fromKart) return 'Kart açılış';
        if (String(r?.notlar || '').includes('[KART_AKTARIM:')) return 'Kart açılış';
        const t = String(r?.islem_turu || '').toUpperCase().replace(/İ/g, 'I').replace(/Ç/g, 'C');
        if (t.includes('CIKIS')) return 'ÇIKIŞ';
        if (t.includes('GIRIS')) return 'GİRİŞ';
        const kg = parseFloat(r?.miktar_kg) || 0;
        const mt = parseFloat(r?.miktar_mt) || 0;
        const ad = parseInt(r?.cuval_sayisi, 10) || 0;
        if (kg < 0 || mt < 0 || ad < 0) return 'ÇIKIŞ';
        if (kg > 0 || mt > 0 || ad > 0) return 'GİRİŞ';
        return 'Hareket';
    }

    function iplikHareketMiktarYazi(r) {
        const kg = parseFloat(r?.miktar_kg) || 0;
        const mt = parseFloat(r?.miktar_mt) || 0;
        const ad = parseInt(r?.cuval_sayisi, 10) || 0;
        if (Math.abs(kg) > 1e-9) return kg.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' kg';
        if (Math.abs(mt) > 1e-9) return mt.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' mt';
        if (ad) return ad + ' ad';
        return '0 kg';
    }

    function iplikStokHareketLimitOku(kod) {
        const k = String(kod || '').trim();
        const map = window._iplikHareketGoster = window._iplikHareketGoster || {};
        if (!k) return 5;
        if (!map[k]) map[k] = 5;
        return map[k];
    }

    window.iplikStokHareketDahaGoster = function (kod) {
        const k = String(kod || '').trim();
        if (!k) return;
        const map = window._iplikHareketGoster = window._iplikHareketGoster || {};
        map[k] = (map[k] || 5) + 5;
        if (typeof iplikStokListeGovdeGuncelle === 'function') iplikStokListeGovdeGuncelle();
        else if (typeof loadData === 'function') loadData({ iplikBodyOnly: true });
    };

    function iplikStokHareketPanelHtml(g, esc) {
        const kod = String(g?.stok_kodu || '').trim();
        const list = (Array.isArray(g?.movements) ? g.movements : []).slice().sort((a, b) => {
            const ta = new Date(a.created_at || 0).getTime() || 0;
            const tb = new Date(b.created_at || 0).getTime() || 0;
            return tb - ta;
        });
        const limit = iplikStokHareketLimitOku(kod);
        const shown = list.slice(0, limit);
        const kalan = Math.max(0, list.length - shown.length);
        const rows = shown.map((r) => {
            const tip = iplikHareketTipEtiket(r);
            const tipCls = tip === 'ÇIKIŞ' ? 'iplik-hv-cikis' : (tip === 'GİRİŞ' ? 'iplik-hv-giris' : 'iplik-hv-kart');
            const kg = parseFloat(r.miktar_kg) || 0;
            const mt = parseFloat(r.miktar_mt) || 0;
            const ad = parseInt(r.cuval_sayisi, 10) || 0;
            const signed = kg || mt || ad;
            const dt = r.created_at ? new Date(r.created_at) : null;
            const dtTxt = dt && !isNaN(dt.getTime())
                ? dt.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '—';
            const user = String(r.updated_by || r.firma || '').trim() || '—';
            const not = String(r.notlar || '').replace(/\[\[IPLIK_LOTS:[^\]]*\]\]/g, '').replace(/\[KART_LOT\][^\n]*/g, '').replace(/\[KART_AKTARIM:[^\]]*\]/g, '').replace(/\[BİRİM:[^\]]*\]/g, '').trim();
            const kgClr = signed < 0 ? 'var(--rose-c)' : (signed > 0 ? 'var(--emerald-c)' : 'var(--text3)');
            return `<div class="iplik-kart-lot-liste-satir">
                <span style="font-family:'DM Mono',monospace;font-size:9px;color:var(--text3)">${esc(dtTxt)}</span>
                <span class="${tipCls}">${esc(tip)}</span>
                <span style="font-family:'DM Mono',monospace">${esc(r.lot_no || '—')}</span>
                <span style="text-align:right;font-family:'DM Mono',monospace;color:${kgClr}">${esc(iplikHareketMiktarYazi(r))}</span>
                <span>${esc(user)}</span>
                <span style="color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(not)}">${esc(not || '—')}</span>
            </div>`;
        }).join('');
        const bos = `<div class="iplik-lot-empty">Bu iplikte henüz giriş / çıkış hareketi yok.</div>`;
        const sayacTxt = list.length
            ? (kalan > 0 ? ` · ${shown.length} / ${list.length}` : ` · ${list.length}`)
            : '';
        const dahaBtn = kalan > 0
            ? `<div style="margin-top:8px;text-align:center">
                <button type="button" class="ms-btn ms-btn-ghost" style="padding:4px 12px;font-size:9px"
                    onclick="event.stopPropagation();iplikStokHareketDahaGoster('${esc(kod)}')">
                    5 hareket daha göster (${kalan} kaldı)
                </button>
            </div>`
            : '';
        return `<div class="iplik-depo-hareket-panel">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
                <div style="font-size:8px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;font-family:'DM Mono',monospace">Giriş / çıkış hareketleri${sayacTxt}</div>
                <button type="button" class="ms-btn ms-btn-ghost" style="padding:3px 8px;font-size:9px" onclick="event.stopPropagation();iplikStokHareketlereGit('${esc(kod)}')">Tüm hareketler</button>
            </div>
            ${list.length ? `<div class="iplik-kart-lot-liste-satir iplik-kart-lot-liste-satir--head">
                <span>Tarih</span><span>İşlem</span><span>Lot</span><span style="text-align:right">Miktar</span><span>Kullanıcı</span><span>Not</span>
            </div>${rows}${dahaBtn}` : bos}
        </div>`;
    }

    function iplikStokLotPanelHtml(g, idx, esc) {
        const lots = Array.isArray(g.lots) ? g.lots : [];
        const tot = lots.reduce((a, lot) => a + (Number(lot.net_kg != null ? lot.net_kg : lot.total_kg) || 0), 0);
        const lotBlock = lots.length ? `<div class="iplik-lot-block">
            <div class="iplik-kart-lot-liste-satir iplik-kart-lot-liste-satir--head">
                <span>Stok kodu</span><span>Lot no</span><span>Marka</span><span>Cins</span><span style="text-align:right">Miktar</span>
            </div>
            ${lots.map((lot) => {
                const kg = Number(lot.net_kg != null ? lot.net_kg : lot.total_kg || 0);
                const kgClr = kg > 0 ? 'var(--emerald-c)' : (kg < 0 ? 'var(--rose-c)' : 'var(--text3)');
                return `<div class="iplik-kart-lot-liste-satir">
                    <span class="mamul-stok-liste-grid__cell mamul-stok-liste-grid__cell--kod">${esc(lot.stok_kodu || g.stok_kodu || '—')}</span>
                    <span style="font-family:'DM Mono',monospace;font-weight:700;color:var(--accent2)">${esc(lot.lot_no || 'LOTSUZ')}</span>
                    <span>${esc(lot.marka || g.marka || '—')}</span>
                    <span>${esc(lot.cins || g.cins || '—')}</span>
                    <span style="text-align:right;font-family:'DM Mono',monospace;color:${kgClr}">${kg.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} kg</span>
                </div>`;
            }).join('')}
            <div class="iplik-kart-lot-liste-satir" style="font-weight:700;border-top:1px solid var(--border)">
                <span>${esc(g.stok_kodu || '—')}</span><span>TOPLAM</span><span></span><span>${lots.length} lot</span>
                <span style="text-align:right;color:var(--emerald-c)">${tot.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} kg</span>
            </div>
        </div>` : `<div class="iplik-lot-empty">Bu iplikte lot kaydı yok.</div>`;
        return `<div class="iplik-kart-lot-panel iplik-depo-lot-panel" data-iplik-idx="${idx}" onclick="event.stopPropagation()">
            ${lotBlock}
            ${iplikStokHareketPanelHtml(g, esc)}
        </div>`;
    }

    function iplikStokListeDynamicHtml(grps, ozet, opts) {
        opts = opts || {};
        ozet = ozet || {};
        const esc = (s) => {
            if (typeof pdfEsc === 'function') return pdfEsc(s);
            return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        };
        const filtre = ozet.filtre || (window.iplikStokHizliFiltre || 'POZITIF');
        const desk = !!opts.masaustu;
        const acik = window._iplikAcikIdx;
        let html = `<div class="ms-list iplik-stok-list">`;
        if (!(grps || []).length) {
            html += `<div class="ms-empty">${filtre === 'POZITIF' ? 'Stokta iplik yok.' : 'Bu listede iplik yok.'}</div></div>`;
            return html;
        }
        if (desk) {
            html += `<div class="ms-table-wrap"><table class="ms-table ms-table--iplik">
                <thead><tr>
                    <th style="width:28px"></th>
                    <th>Stok kodu</th><th>İplik no</th><th>Marka</th><th>Cins</th><th class="num">Lot</th>
                    <th class="num">Stok</th>
                </tr></thead><tbody>`;
            html += grps.map((g, idx) => {
                const kg = Number(g.net_kg != null ? g.net_kg : g.total_kg || 0);
                const qtyCls = kg < 0 ? ' is-neg' : (kg === 0 ? ' is-zero' : '');
                const lotN = Number(g.lot_sayisi || (g.lots || []).length || 0);
                const open = acik === idx;
                return `<tr class="iplik-stok-tr${open ? ' is-open' : ''}" onclick="iplikStokSatirAc(${idx})" title="Lotları aç/kapat">
                    <td class="iplik-stok-chev">${open ? '▾' : '▸'}</td>
                    <td class="ms-kod">${esc(g.stok_kodu || '—')}</td>
                    <td><div class="ms-name">${esc(g.iplik_no || '—')}</div></td>
                    <td class="ms-ozellik">${esc(g.marka || '—')}</td>
                    <td class="ms-ozellik">${esc(g.cins || '—')}</td>
                    <td class="num">${lotN}</td>
                    <td class="num"><span class="ms-qty${qtyCls}">${kg.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}<em>kg</em></span></td>
                </tr>
                <tr class="iplik-stok-detail${open ? ' is-open' : ''}" id="iplik-stok-detail-${idx}">
                    <td colspan="7">${open ? iplikStokLotPanelHtml(g, idx, esc) : ''}</td>
                </tr>`;
            }).join('');
            html += `</tbody></table></div></div>`;
            return html;
        }
        html += grps.map((g, idx) => {
            const kg = Number(g.net_kg != null ? g.net_kg : g.total_kg || 0);
            const qtyCls = kg < 0 ? ' is-neg' : (kg === 0 ? ' is-zero' : '');
            const lotN = Number(g.lot_sayisi || (g.lots || []).length || 0);
            const open = acik === idx;
            return `<article class="ms-row iplik-stok-card${open ? ' is-open' : ''}">
                <button type="button" class="ms-row-main" onclick="iplikStokSatirAc(${idx})">
                    <div class="ms-row-top">
                        <span class="ms-kod"><span class="iplik-stok-chev">${open ? '▾' : '▸'}</span> ${esc(g.stok_kodu || '—')}</span>
                        <span class="ms-qty${qtyCls}">${kg.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}<em>kg</em></span>
                    </div>
                    <div class="ms-name">${esc(g.iplik_no || '—')}</div>
                    <div class="ms-meta">${esc([g.marka, g.cins, lotN ? (lotN + ' lot') : ''].filter(Boolean).join(' · ') || '—')}</div>
                </button>
                <div class="iplik-stok-detail-card${open ? ' is-open' : ''}" id="iplik-stok-detail-${idx}">
                    ${open ? iplikStokLotPanelHtml(g, idx, esc) : ''}
                </div>
            </article>`;
        }).join('');
        html += `</div>`;
        return html;
    }
    window.iplikStokListeDynamicHtml = iplikStokListeDynamicHtml;

    function iplikStokSatirAc(idx) {
        const grps = window._iplikGroups || [];
        const g = grps[idx];
        if (!g) return;
        const onceki = window._iplikAcikIdx;
        const kod = String(g.stok_kodu || '').trim();
        window._iplikAcikIdx = (onceki === idx) ? null : idx;
        if (window._iplikAcikIdx === null && kod && window._iplikHareketGoster) {
            delete window._iplikHareketGoster[kod];
        }
        if (typeof iplikStokListeGovdeGuncelle === 'function') iplikStokListeGovdeGuncelle();
        else if (typeof loadData === 'function') loadData({ iplikBodyOnly: true });
        if (window._iplikAcikIdx === idx) {
            setTimeout(() => {
                const el = document.getElementById('iplik-stok-detail-' + idx);
                if (el && el.scrollIntoView) {
                    try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
                }
            }, 40);
        }
    }
    window.iplikStokSatirAc = iplikStokSatirAc;
    window.showIplikGroupDetailByObject = function (idx) {
        iplikStokSatirAc(idx);
    };

    function iplikStokListeEkranHtml(grps, ozet, opts) {
        opts = opts || {};
        ozet = ozet || {};
        const esc = (s) => {
            if (typeof pdfEsc === 'function') return pdfEsc(s);
            return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        };
        const filtre = ozet.filtre || (window.iplikStokHizliFiltre || 'POZITIF');
        const sayac = ozet.sayac || {};
        const netKg = Number(ozet.netKg || 0);
        const desk = !!opts.masaustu;
        const filtreObj = opts.filtreObj || ozet.filtreObj || (typeof iplikStokListeFiltre !== 'undefined' ? iplikStokListeFiltre : { q: '', tip: 'HEPSİ', bas: '', bit: '' });
        const filtreBar = typeof stokListeFiltreBarHtml === 'function'
            ? stokListeFiltreBarHtml({
                prefix: 'iplik-stok-f',
                filtre: filtreObj,
                araPlaceholder: 'İplik no, stok kodu, marka, cins, lot…',
                onChangeFn: 'iplikStokListeFiltreYenile',
                onResetFn: 'iplikStokListeFiltreleriSifirla',
                debounceKey: 'iplik-stok-f-ara'
            })
            : '';
        const seg = (id, label, n) =>
            `<button type="button" class="ms-seg-btn${filtre === id ? ' is-on' : ''}" onclick="iplikStokHizliFiltreSet('${id}')">${label}${n != null ? ` <b>${n}</b>` : ''}</button>`;
        return depoStokShellHtml({
            shellId: 'iplik-stok-shell',
            variant: 'iplik',
            masaustu: desk,
            icon: '🧶',
            title: 'İplik Stoğu',
            desc: 'Lot bazlı depo bakiyesi · kg',
            metrics: [
                { id: 'iplik-stok-hero-kg', val: netKg.toLocaleString('tr-TR', { maximumFractionDigits: 1 }), unit: 'kg', lbl: 'Toplam stok', primary: true, neg: netKg < 0 },
                { id: 'iplik-stok-sub', val: String((grps || []).length), lbl: 'İplik çeşidi', primary: false }
            ],
            segHtml: `${seg('POZITIF', 'Stokta', sayac.pozitif)}${seg('HEPSI', 'Tümü', sayac.hepsi)}${seg('KRITIK', 'Tükendi', sayac.kritik)}`,
            toolsHtml: `
                <button type="button" class="ms-btn ms-btn-giris" onclick="iplikStokHizliIslem('GİRİŞ')">Stok girişi</button>
                <button type="button" class="ms-btn ms-btn-sevk" onclick="iplikStokHizliIslem('ÇIKIŞ')">Sevkiyat</button>
                <button type="button" class="ms-btn ms-btn-ghost" onclick="iplikStokHareketlereGit()">Hareketler</button>
                <button type="button" class="ms-btn ms-btn-ghost" onclick="iplikKartlardanDepoStogaAktar()" title="Stok kartlarındaki lot kg’lerini kalıcı depo girişi olarak kaydet">Kartlardan aktar</button>`,
            filtreBar,
            dynamicId: 'iplik-stok-dynamic',
            dynamicHtml: iplikStokListeDynamicHtml(grps, ozet, opts)
        });
    }
    window.iplikStokListeEkranHtml = iplikStokListeEkranHtml;

    function iplikStokHizliIslem(tip, kod) {
        if (tip === 'ÇIKIŞ' || tip === 'CIKIS') {
            if (typeof sevkiyatMerkezAc === 'function') {
                sevkiyatMerkezAc('IPLIK');
                return;
            }
            if (typeof setAppMode === 'function') setAppMode('SEVKIYAT');
            return;
        }
        if (typeof movementType !== 'undefined') movementType = 'GİRİŞ';
        if (typeof iplikDepoFormAcik !== 'undefined') iplikDepoFormAcik = true;
        if (typeof appMode !== 'undefined' && appMode === 'IPLIK') {
            const fc = document.getElementById('form-container');
            if (fc) { fc.style.display = 'block'; fc.classList.remove('ms-form-kapali'); }
            if (typeof renderInputs === 'function') renderInputs();
            if (typeof applyDepoFormLayout === 'function') applyDepoFormLayout();
            if (typeof syncDepoKomutaChrome === 'function') syncDepoKomutaChrome();
            if (typeof depoKomutaFormBaslikGuncelle === 'function') depoKomutaFormBaslikGuncelle();
            const sc = document.querySelector('.content-scroll');
            if (sc && sc.scrollTo) sc.scrollTo({ top: 0, behavior: 'smooth' });
            else window.scrollTo({ top: 0, behavior: 'smooth' });
            const k = String(kod || '').trim();
            if (k) {
                setTimeout(() => {
                    const el = document.getElementById('val-iplik-search') || document.getElementById('val-stok-kodu');
                    if (el) { el.value = k; el.dispatchEvent(new Event('input', { bubbles: true })); }
                }, 80);
            }
            return;
        }
        if (typeof depoKomutaHizliBaslat === 'function') {
            if (typeof depoKomutaHedef !== 'undefined') depoKomutaHedef = 'IPLIK';
            depoKomutaHizliBaslat('IPLIK', 'GİRİŞ');
        }
    }
    window.iplikStokHizliIslem = iplikStokHizliIslem;

    function iplikStokHareketlereGit(stokKodu) {
        const kod = String(stokKodu || '').trim();
        try {
            if (typeof depoHareketDefterFiltre === 'object' && depoHareketDefterFiltre) {
                depoHareketDefterFiltre = { q: kod, tip: 'HEPSİ', bas: '', bit: '' };
                if (typeof saveUiState === 'function') saveUiState({ depoHareketDefterFiltre });
            }
        } catch (e) {}
        if (typeof depoDefterKanalFiltrele === 'function') {
            depoDefterKanalFiltrele('IPLIK');
            return;
        }
        if (typeof depoHareketDefterGrup !== 'undefined') depoHareketDefterGrup = 'IPLIK';
        if (typeof setAppMode === 'function') setAppMode('DEPO_HAREKET_LISTE');
    }
    window.iplikStokHareketlereGit = iplikStokHareketlereGit;

    /** Kart lot kg’lerini DEPO_HAREKET_IPLIK giriş kaydı olarak yazar (kalıcı). */
    window.iplikKartlardanDepoStogaAktar = async function iplikKartlardanDepoStogaAktar() {
        try {
            const all = (typeof dataCache !== 'undefined' ? (dataCache.iplik_stok || []) : []);
            const real = all.filter(iplikDepoHareketiMi);
            const realKeys = new Set(real.map(r => iplikDepoLotAnahtar(r.stok_kodu, r.lot_no, r.marka)));
            const aktarilmis = new Set();
            all.forEach(r => {
                const m = String(r.notlar || '').match(/\[KART_AKTARIM:([^\]]+)\]/);
                if (m) aktarilmis.add(String(m[1]).toLowerCase());
            });
            const syn = iplikKartlardanSentetikHareketler().filter(s => {
                const key = iplikDepoLotAnahtar(s.stok_kodu, s.lot_no, s.marka);
                const tag = `${s._kart_id || ''}:${s.lot_no}`.toLowerCase();
                return !realKeys.has(key) && !aktarilmis.has(tag);
            });
            if (!syn.length) {
                if (typeof erpToast === 'function') erpToast('Aktarılacak yeni kart lot stoğu yok (zaten depoda veya 0 kg).', 'info', 3500);
                return;
            }
            const totKg = syn.reduce((a, s) => a + (parseFloat(s.miktar_kg) || 0), 0);
            if (!confirm(`${syn.length} lot · ${totKg.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} kg\n\nStok kartlarından İplik deposuna kalıcı giriş olarak aktarılsın mı?`)) return;
            if (typeof sb === 'undefined' || !sb?.from) {
                if (typeof erpToast === 'function') erpToast('Veritabanı bağlantısı yok.', 'error');
                return;
            }
            const user = String((typeof erpCurrentUser !== 'undefined' && (erpCurrentUser?.display_name || erpCurrentUser?.username)) || 'Sistem');
            const rows = syn.map(s => ({
                stok_kodu: s.stok_kodu,
                iplik_no: s.iplik_no,
                lot_no: s.lot_no,
                marka: s.marka,
                cins: s.cins,
                miktar_kg: s.miktar_kg,
                renk: s.renk || '',
                tedarikci: s.tedarikci || '',
                depo_konum: s.depo_konum || '',
                araci_firma: s.tedarikci || '',
                kaynak_birim: 'DEPO_HAREKET_IPLIK',
                islem_turu: 'GİRİŞ',
                updated_by: user,
                notlar: `[KART_AKTARIM:${s._kart_id || ''}:${s.lot_no}]\nStok kartından aktarılan açılış stoğu`
            }));
            const chunk = 40;
            let ok = 0;
            for (let i = 0; i < rows.length; i += chunk) {
                const part = rows.slice(i, i + chunk);
                const { data, error } = await sb.from('iplik_stok').insert(part).select('id');
                if (error) throw error;
                ok += (data || part).length;
                if (typeof dataCache !== 'undefined' && Array.isArray(dataCache.iplik_stok) && Array.isArray(data)) {
                    dataCache.iplik_stok = data.concat(dataCache.iplik_stok);
                }
            }
            if (typeof erpToast === 'function') erpToast(`${ok} lot depoya aktarıldı.`, 'success', 3500);
            if (typeof loadData === 'function') loadData();
            else if (typeof iplikStokListeGovdeGuncelle === 'function') iplikStokListeGovdeGuncelle();
        } catch (e) {
            console.error(e);
            if (typeof erpToast === 'function') erpToast('Aktarım hatası: ' + (e.message || e), 'error', 6000);
        }
    };

    function kumasBoyaNotRenkParcala(txt) {
        const s = String(txt || '').trim();
        if (!s) return { renk: '', renk_kodu: '' };
        let renk = '';
        let renk_kodu = '';
        const renkM = s.match(/(?:^|\s)(?:renk|RENK)\s*[:=\-]\s*([^·|/\n;]+)/i);
        const kodM = s.match(/(?:renk\s*kodu?|kod|rkod|rk)\s*[:=\-]\s*([^·|/\n;]+)/i);
        if (renkM) renk = renkM[1].trim();
        if (kodM) renk_kodu = kodM[1].trim();
        if (!renk && !renk_kodu) {
            const parts = s.split(/\s*[·|/]\s*/).map(x => x.trim()).filter(Boolean);
            if (parts.length >= 2) {
                renk = parts[0];
                renk_kodu = parts.slice(1).join(' · ');
            } else if (parts.length === 1) {
                renk = parts[0];
            }
        }
        return { renk, renk_kodu };
    }

    function kumasKartRenkOku(kart) {
        if (!kart) return '';
        const direct = String(kart.renk || '').trim();
        if (direct) return direct;
        if (typeof kumasAlan === 'function') {
            const fromAlan = String(kumasAlan(kart, 'renk', '') || '').trim();
            if (fromAlan) return fromAlan;
        }
        const boya = typeof kumasAlan === 'function' ? kumasAlan(kart, 'boya_not', '') : (kart.boya_not || '');
        return kumasBoyaNotRenkParcala(boya).renk || '';
    }

    function kumasKartRenkKoduOku(kart) {
        if (!kart) return '';
        const direct = String(kart.renk_kodu || '').trim();
        if (direct) return direct;
        if (typeof kumasAlan === 'function') {
            const fromAlan = String(kumasAlan(kart, 'renk_kodu', '') || '').trim();
            if (fromAlan) return fromAlan;
        }
        const meta = typeof kumasMetaAl === 'function' ? (kumasMetaAl(kart) || {}) : {};
        if (String(meta.renk_kodu || '').trim()) return String(meta.renk_kodu).trim();
        const boya = typeof kumasAlan === 'function' ? kumasAlan(kart, 'boya_not', '') : (kart.boya_not || '');
        const fromBoya = kumasBoyaNotRenkParcala(boya).renk_kodu;
        if (fromBoya) return fromBoya;
        /* "krem · LAB-12" gibi tek alanda kod yazılmışsa */
        const renkTxt = String(kart.renk || meta.renk || '').trim();
        if (renkTxt) {
            const fromRenk = kumasBoyaNotRenkParcala(renkTxt).renk_kodu;
            if (fromRenk) return fromRenk;
        }
        return '';
    }
    window.kumasKartRenkOku = kumasKartRenkOku;
    window.kumasKartRenkKoduOku = kumasKartRenkKoduOku;
    window.kumasBoyaNotRenkParcala = kumasBoyaNotRenkParcala;

    /** Depo listesinde kod: SM-0001 = ham, SM-0001-N = boyalı (SM0001 de aynı) */
    function kumasStokListeKoduNorm(kod) {
        const s = String(kod || '').trim().toUpperCase();
        if (!s) return '';
        if (/^(SM|NU)-?\d+/i.test(s) && typeof kumasStokKodCanon === 'function') {
            return kumasStokKodCanon(s);
        }
        return s;
    }
    window.kumasStokListeKoduNorm = kumasStokListeKoduNorm;

    function kumasStokListeAileKodlari(anaKod) {
        const ana = kumasAnaKodBul(anaKod);
        if (!ana) return [];
        const vSay = typeof kumasKartListeVaryantSayisi === 'function' ? kumasKartListeVaryantSayisi(ana) : 0;
        const kodlar = [ana];
        for (let i = 1; i <= vSay; i++) kodlar.push(kumasVaryantStokKodu(ana, i));
        return kodlar;
    }
    window.kumasStokListeAileKodlari = kumasStokListeAileKodlari;

    /** Varyant kodu için kart + meta birleşimi (terbiye/renk varyanta özel) */
    function kumasStokListeVaryantKartBul(kod) {
        const k = String(kod || '').trim().toUpperCase();
        if (!k) return null;
        const direct = typeof kumasKutuphanesiKartBul === 'function' ? kumasKutuphanesiKartBul(k) : null;
        if (direct && kumasVaryantNoBul(k) > 0) {
            /* DB kaydı + meta hücre — renk_kodu notlar/meta'da olabilir */
            const cell = typeof kumasVaryantKayittanHucre === 'function' ? kumasVaryantKayittanHucre(direct) : null;
            if (cell && (cell.renk || cell.renk_kodu || cell.boya_not)) {
                return {
                    ...direct,
                    renk: cell.renk || direct.renk || '',
                    renk_kodu: cell.renk_kodu || direct.renk_kodu || '',
                    boya_not: cell.boya_not || direct.boya_not || ''
                };
            }
            return direct;
        }
        const ana = kumasAnaKodBul(k);
        const vNo = kumasVaryantNoBul(k);
        const vSay = typeof kumasKartListeVaryantSayisi === 'function' ? kumasKartListeVaryantSayisi(ana) : 0;
        const baz = direct || (typeof kumasAnaKayitBul === 'function' ? kumasAnaKayitBul(ana) : null);
        if (!baz) return null;
        if (vSay < 2 && (vNo === 0 || k === ana)) {
            const cells = typeof kumasVaryantAileVerisiOku === 'function' ? kumasVaryantAileVerisiOku(ana) : [];
            const cell = cells[0];
            if (cell && kumasVaryantFormDoluMu(cell)) {
                return {
                    ...baz,
                    desen_kodu: ana,
                    stok_kodu: ana,
                    terbiye: cell.terbiye || baz.terbiye,
                    renk: cell.renk || baz.renk,
                    renk_kodu: cell.renk_kodu || baz.renk_kodu || '',
                    boya_not: cell.boya_not || baz.boya_not,
                    cekme: cell.cekme ?? baz.cekme
                };
            }
            return baz;
        }
        if (vNo <= 0) return baz;
        const cells = typeof kumasVaryantAileVerisiOku === 'function' ? kumasVaryantAileVerisiOku(ana) : [];
        const cell = cells[vNo - 1];
        if (!cell) return { ...baz, desen_kodu: k, stok_kodu: k };
        return {
            ...baz,
            desen_kodu: k,
            stok_kodu: k,
            terbiye: cell.terbiye || baz.terbiye,
            renk: cell.renk || baz.renk,
            renk_kodu: cell.renk_kodu || baz.renk_kodu || '',
            boya_not: cell.boya_not || baz.boya_not,
            cekme: cell.cekme ?? baz.cekme
        };
    }
    window.kumasStokListeVaryantKartBul = kumasStokListeVaryantKartBul;

    function kumasStokListeGrupBos(kod, kart) {
        const tek = kumasKartTeknikDetay(kart || {});
        const ad = kart && typeof stokKartListeAdMetni === 'function'
            ? stokKartListeAdMetni(kart, kod)
            : String(kart?.desen_adi || kart?.urun_adi || kart?.kumas_cinsi || kod || '').trim();
        const anaGrup = kumasKartAnaGrupHam(kart);
        return {
            stok_kodu: kod,
            ana_grup: anaGrup,
            urun_grubu: anaGrup,
            urun_adi: ad || kod,
            kumas_cinsi: String(kart?.kumas_cinsi || '').trim(),
            ebat: '',
            depo: '',
            aciklama: kart && typeof kumasNotlarTemizle === 'function' ? kumasNotlarTemizle(kart.notlar) : '',
            lot_no: kart?.lot_no || '',
            marka: kart?.marka || kart?.firma || '',
            firma: kart?.firma || '',
            tarak_eni: tek.tarak_eni,
            atki_sikligi: tek.atki_sikligi,
            cozgu_sikligi: tek.cozgu_sikligi,
            atki_ipi: tek.atki_ipi,
            cozgu_ipi: tek.cozgu_ipi,
            net_kg: 0, net_mt: 0, giris_kg: 0, cikis_kg: 0, giris_mt: 0, cikis_mt: 0, top_sayisi: 0, hareket: 0,
            son_giris_at: null, son_cikis_at: null,
            renk: kumasKartRenkOku(kart) || '', renk_kodu: kumasKartRenkKoduOku(kart) || '',
            son_renk_at: null, son_renk_kodu_at: null
        };
    }

    function kumasStokSiparisKalemBul(stokKodu) {
        const kod = String(stokKodu || '').trim().toUpperCase();
        if (!kod) return null;
        const liste = (typeof dataCache !== 'undefined' && Array.isArray(dataCache.siparisler)) ? dataCache.siparisler : [];
        for (let si = 0; si < liste.length; si++) {
            const sip = liste[si];
            let kalemler = typeof siparisListeKalemleriArr === 'function' ? siparisListeKalemleriArr(sip) : (sip.kalemler || []);
            let n = 0;
            while (typeof kalemler === 'string' && n < 4) {
                try { kalemler = JSON.parse(kalemler); } catch (e) { break; }
                n++;
            }
            if (!Array.isArray(kalemler)) continue;
            for (let ki = 0; ki < kalemler.length; ki++) {
                const k = kalemler[ki];
                const kk = String(typeof dtKalemStokKodu === 'function' ? dtKalemStokKodu(k) : (k.kod || k.stok_kodu || '')).trim().toUpperCase();
                if (kk && kk === kod) return { sip, k, ki };
            }
        }
        return null;
    }

    function kumasStokHareketRenkKoduHam(x) {
        if (!x) return '';
        if (typeof muhasebeFisSiparisKaleminden === 'function') {
            const fromSip = muhasebeFisSiparisKaleminden(x);
            if (fromSip && typeof siparisKalemRenkKoduMetni === 'function') {
                const rk = siparisKalemRenkKoduMetni(fromSip.k);
                if (rk) return rk;
            }
        }
        if (typeof muhasebeFisNotEtiket === 'function') {
            const tagged = muhasebeFisNotEtiket(x.notlar, 'RENK_KOD') || muhasebeFisNotEtiket(x.notlar, 'RKOD');
            if (tagged) return tagged;
        }
        const renk = String(x.renk || '').trim();
        const kr = String(x.kumas_rengi || '').trim();
        if (kr && kr.toLocaleLowerCase('tr-TR') !== renk.toLocaleLowerCase('tr-TR')) return kr;
        return '';
    }

    function kumasStokListeRenkOku(g) {
        const fromG = String(g?.renk || '').trim();
        if (fromG) return fromG;
        const kod = g?.stok_kodu;
        if (kod) {
            const kart = typeof kumasStokListeVaryantKartBul === 'function'
                ? kumasStokListeVaryantKartBul(kod)
                : (typeof kumasKutuphanesiKartBul === 'function' ? kumasKutuphanesiKartBul(kod) : null);
            if (kart) {
                const fromKart = kumasKartRenkOku(kart);
                if (fromKart) return fromKart;
            }
        }
        const sk = kumasStokSiparisKalemBul(g?.stok_kodu);
        if (sk) {
            const r = String(sk.k?.renk || '').trim();
            if (r) return r;
        }
        return '';
    }

    function kumasStokListeRenkKoduOku(g) {
        const fromG = String(g?.renk_kodu || '').trim();
        if (fromG) return fromG;
        const kod = g?.stok_kodu;
        if (kod) {
            const kart = typeof kumasStokListeVaryantKartBul === 'function'
                ? kumasStokListeVaryantKartBul(kod)
                : (typeof kumasKutuphanesiKartBul === 'function' ? kumasKutuphanesiKartBul(kod) : null);
            if (kart) {
                const fromKart = kumasKartRenkKoduOku(kart);
                if (fromKart) return fromKart;
            }
        }
        const sk = kumasStokSiparisKalemBul(g?.stok_kodu);
        if (sk && typeof siparisKalemRenkKoduMetni === 'function') {
            const rk = siparisKalemRenkKoduMetni(sk.k);
            if (rk) return rk;
        }
        return '';
    }
    window.kumasStokSiparisKalemBul = kumasStokSiparisKalemBul;
    window.kumasStokHareketRenkKoduHam = kumasStokHareketRenkKoduHam;
    window.kumasStokListeRenkOku = kumasStokListeRenkOku;
    window.kumasStokListeRenkKoduOku = kumasStokListeRenkKoduOku;

    function kumasStokListeHareketIsle(g, x) {
        const m = parseFloat(x.miktar_kg) || 0;
        const mt = parseFloat(x.miktar_mt) || 0;
        const tip = String(x.islem_turu || '').toUpperCase();
        const isCikis = tip === 'ÇIKIŞ' || tip === 'CIKIS';
        const ts = x.created_at ? new Date(x.created_at).getTime() : 0;
        g.net_kg += m;
        g.net_mt += mt;
        g.hareket++;
        g.top_sayisi += parseInt(x.cuval_sayisi || 0, 10) || 0;
        const renkHam = String(x.renk || '').trim() || String(x.kumas_rengi || '').trim();
        if (renkHam && ts >= (g.son_renk_at || 0)) {
            g.renk = renkHam;
            g.son_renk_at = ts;
        }
        const rkHam = kumasStokHareketRenkKoduHam(x);
        if (rkHam && ts >= (g.son_renk_kodu_at || 0)) {
            g.renk_kodu = rkHam;
            g.son_renk_kodu_at = ts;
        }
        if (!isCikis) {
            if (m > 0) g.giris_kg += m;
            if (mt > 0) g.giris_mt += mt;
            if (ts && (!g.son_giris_at || ts > g.son_giris_at)) g.son_giris_at = ts;
        } else {
            if (m < 0) g.cikis_kg += Math.abs(m);
            else if (m > 0) g.cikis_kg += m;
            if (mt < 0) g.cikis_mt += Math.abs(mt);
            else if (mt > 0) g.cikis_mt += mt;
            if (ts && (!g.son_cikis_at || ts > g.son_cikis_at)) g.son_cikis_at = ts;
        }
    }

    function kumasStokListeGruplariOlustur(hareketler) {
        const map = {};
        const anaIslenen = new Set();
        (dataCache.kumas_kutuphanesi || []).forEach(kart => {
            const rawKod = String(kart.stok_kodu || kart.desen_kodu || '').trim();
            if (!kumasDepoStokKoduMu(rawKod)) return;
            if (typeof kumasKutuphanesiKartiMamulMu === 'function' && kumasKutuphanesiKartiMamulMu(kart)) return;
            if (typeof stokKartGrupEslesir === 'function' && !stokKartGrupEslesir(kart, 'KUMAS', { ignoreTipFiltre: true })) return;
            const ana = kumasAnaKodBul(rawKod);
            if (anaIslenen.has(ana)) return;
            anaIslenen.add(ana);
            kumasStokListeAileKodlari(ana).forEach(kod => {
                const key = kod.toUpperCase();
                if (!map[key]) {
                    const varKart = kumasStokListeVaryantKartBul(kod);
                    map[key] = kumasStokListeGrupBos(kod, varKart);
                }
            });
        });
        (hareketler || []).forEach(x => {
            if (typeof kumasStokHareketiKumasDepoMu === 'function' && !kumasStokHareketiKumasDepoMu(x)) return;
            const raw = String(x.stok_kodu || x.desen_kodu || '').trim();
            if (!kumasDepoStokKoduMu(raw)) return;
            const kod = kumasStokListeKoduNorm(raw);
            const key = kod.toUpperCase();
            if (!map[key]) {
                const varKart = kumasStokListeVaryantKartBul(kod);
                if (varKart && typeof kumasKutuphanesiKartiMamulMu === 'function' && kumasKutuphanesiKartiMamulMu(varKart)) return;
                map[key] = kumasStokListeGrupBos(kod, varKart);
            }
            kumasStokListeHareketIsle(map[key], x);
        });
        return Object.values(map).sort((a, b) => String(a.stok_kodu || '').localeCompare(String(b.stok_kodu || ''), 'tr', { numeric: true, sensitivity: 'base' }));
    }
    window.kumasStokListeGruplariOlustur = kumasStokListeGruplariOlustur;

    function kumasTopluNorm(s) {
        return String(s || '').trim().toUpperCase();
    }

    function kumasTopluHareketCikisMi(x) {
        const tip = String(x && x.islem_turu || '').toUpperCase();
        return tip === 'ÇIKIŞ' || tip === 'CIKIS';
    }

    /** Stok kodu yoksa cins + ad + renk + lot + marka ile grupla. Firma (müşteri) aramada kullanılır; çıkışta alıcı yazıldığı için anahtara konmaz. */
    function kumasTopluSatirAnahtar(x) {
        const kod = String(x && (x.stok_kodu || x.desen_kodu || x.kod) || '').trim();
        if (kumasDepoStokKoduMu(kod)) return 'KOD:' + (typeof kumasStokKodCanon === 'function' ? kumasStokKodCanon(kod) : kod.toUpperCase());
        const cins = kumasTopluNorm(x && (x.kumas_cinsi || x.urun_adi || x.ad || x.desen_adi) || '');
        const ad = kumasTopluNorm(x && (x.urun_adi || x.ad || x.desen_adi || x.kumas_cinsi) || '');
        const renk = kumasTopluNorm(x && x.renk || '');
        const lot = kumasTopluNorm(x && x.lot_no || '');
        const marka = kumasTopluNorm(x && x.marka || '');
        return ['OZ', cins, ad, renk, lot, marka].join('|');
    }

    function kumasTopluAnahtarBosMu(anahtar) {
        return !anahtar || /^OZ\|+$/.test(String(anahtar));
    }

    function kumasTopluCikisModuMu() {
        const t = String(typeof movementType !== 'undefined' ? movementType : '')
            .toUpperCase().replace(/İ/g, 'I').replace(/Ç/g, 'C');
        if (t.includes('CIKIS')) return true;
        try {
            if (typeof appMode === 'string' && String(appMode).toUpperCase() === 'SEVKIYAT') return true;
        } catch (e) {}
        try {
            const fc = document.getElementById('form-container');
            if (fc && fc.classList.contains('sevkiyat-form-modal')) return true;
        } catch (e) {}
        return false;
    }

    /** Sipariş kalemi için stok kartı yokken sevk kimliği (SIP-… yer tutucu) */
    function kumasTopluSiparisYerTutucuKod(siparis, kalem, kalemIdx) {
        if (typeof sevkiyatMamulDepoHareketStokKodu === 'function') {
            try {
                const k = sevkiyatMamulDepoHareketStokKodu({ siparis, kalem, kalemIdx });
                if (k) return String(k).slice(0, 60);
            } catch (e) {}
        }
        const sno = String(siparis?.sno || '').trim() || 'X';
        const ki = Number.isFinite(Number(kalemIdx)) ? Number(kalemIdx) : 0;
        const urun = String(kalem?.ad || kalem?.urun || kalem?.kumas_cinsi || '').trim()
            .replace(/[^\wçğıöşüÇĞİÖŞÜ\-]+/gi, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 28);
        const base = urun ? `SIP-${sno}-K${ki}-${urun}` : `SIP-${sno}-K${ki}`;
        return base.slice(0, 60);
    }

    /** Açık siparişlerde MT/KG (kumaş) kalemleri — stok kodu olmasa da aranır */
    function kumasTopluSiparisKaynakRows() {
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
                const kumasMi = typeof siparisKalemKumasMi === 'function'
                    ? siparisKalemKumasMi(k)
                    : ['MT', 'KG', 'M', 'METRE'].includes(String(k?.birim || '').toUpperCase().replace(/İ/g, 'I'));
                if (!kumasMi) return;
                const birim = typeof siparisKalemBirim === 'function'
                    ? siparisKalemBirim(k)
                    : String(k?.birim || 'MT').toUpperCase();
                const ad = String(k.ad || k.urun || k.kumas_cinsi || '').trim();
                const renk = String(
                    (typeof uaKalemRenkGetir === 'function' ? uaKalemRenkGetir(k) : '') || k.renk || ''
                ).trim();
                const renk_kodu = typeof siparisKalemRenkKoduMetni === 'function' ? String(siparisKalemRenkKoduMetni(k) || '').trim() : '';
                const hamKod = String(k.kod || k.stok_kodu || '').trim();
                const kartVar = !!(hamKod && hamKod.toUpperCase() !== 'KODSUZ' && kumasDepoStokKoduMu(hamKod) && kumasKutuphanesiKartBul(hamKod));
                if (kartVar) return;
                const kod = kumasTopluSiparisYerTutucuKod(sip, k, ki);
                const anahtar = `SIP:${String(sip.id)}|${ki}`;
                if (!kod || seen.has(anahtar)) return;
                seen.add(anahtar);
                const miktar = parseFloat(k.miktar) || 0;
                out.push({
                    anahtar,
                    kod,
                    ad: ad || kod,
                    kumas_cinsi: ad || '',
                    lot_no: sno || '',
                    marka: firma || '',
                    firma: firma || '',
                    firmaArama: firma || '',
                    renk,
                    renk_kodu,
                    kg: 0,
                    mt: 0,
                    adet: 0,
                    noKart: true,
                    siparisKaynak: true,
                    siparis_id: sip.id,
                    siparis_sno: sno,
                    kalem_idx: ki,
                    siparis_miktar: miktar,
                    siparis_birim: birim === 'KG' ? 'KG' : 'MT'
                });
            });
        });
        return out;
    }
    window.kumasTopluSiparisKaynakRows = kumasTopluSiparisKaynakRows;

    function kumasTopluSerbestKimlik(q) {
        const raw = String(q || '').trim();
        if (!raw) return null;
        if (kumasDepoStokKoduMu(raw)) return null;
        if (!/^SIP-/i.test(raw) && raw.length < 2) return null;
        const ad = /^SIP-/i.test(raw)
            ? raw.replace(/^SIP-[^-]+-K\d+-?/i, '').replace(/_/g, ' ').trim() || raw
            : raw;
        return {
            anahtar: 'SERBEST:' + raw.slice(0, 60).toUpperCase(),
            kod: raw.slice(0, 60),
            ad,
            kumas_cinsi: ad,
            lot_no: '',
            marka: '',
            firma: '',
            firmaArama: '',
            renk: '',
            kg: 0,
            mt: 0,
            adet: 0,
            noKart: true,
            siparisKaynak: false
        };
    }

    function kumasTopluSatiraSiparisYaz(row, src) {
        if (!row) return;
        row.siparis_id = src?.siparis_id || '';
        row.kalem_idx = (src && src.kalem_idx != null && src.kalem_idx !== '') ? src.kalem_idx : null;
        row.siparis_miktar = parseFloat(src?.siparis_miktar) || 0;
        row.siparis_birim = src?.siparis_birim || '';
        row.siparis_sno = src?.siparis_sno || src?.lot_no || row.siparis_sno || '';
        row.noKart = !!(src?.noKart || src?.siparisKaynak || row.noKart);
    }

    function kumasTopluSatirSiparisTemizle(row) {
        if (!row) return;
        row.siparis_id = '';
        row.kalem_idx = null;
        row.siparis_miktar = 0;
        row.siparis_birim = '';
        row.siparis_sno = '';
        row.noKart = false;
    }

    function kumasTopluSiparisOzetHesapla(row) {
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
        const kdD = (typeof _kdCache !== 'undefined' && _kdCache[`KD_DOKUMA_${sid}`]) || {};
        const uRaw = kdD.urunler || {};
        const u = (Array.isArray(uRaw) ? uRaw[ki] : null) || uRaw[ki] || uRaw[String(ki)] || {};
        const rowK = (typeof _kdCache !== 'undefined' && _kdCache[`KD_KONFEKSIYON_${sid}`])
            ? (_kdCache[`KD_KONFEKSIYON_${sid}`][`kalem_${ki}`] || {})
            : {};
        if (typeof siparisKalemKumasMetrajOzet === 'function') {
            const o = siparisKalemKumasMetrajOzet(sid, ki, kalem, u, rowK);
            return {
                siparis: o.siparis,
                sevk: o.sevk,
                dokunan: o.dokunan,
                sevkEdilebilir: o.hazir,
                kapanis: Math.max(0, Math.round(Number(o.siparis) || 0) - Math.round(Number(o.sevk) || 0)),
                birimLbl: o.birimLbl || (o.birim === 'KG' ? 'kg' : 'mt')
            };
        }
        const siparis = Math.round(parseFloat(row.siparis_miktar || kalem.miktar) || 0);
        const sevk = typeof planlamaIhtiyacSevkAdet === 'function' ? Math.round(planlamaIhtiyacSevkAdet(sid, ki, rowK) || 0) : 0;
        return { siparis, sevk, dokunan: 0, sevkEdilebilir: Math.max(0, siparis - sevk), kapanis: Math.max(0, siparis - sevk), birimLbl: 'mt' };
    }

    function kumasTopluSiparisOzetHtml(row) {
        const o = kumasTopluSiparisOzetHesapla(row);
        if (!o) return '';
        const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('tr-TR');
        const b = o.birimLbl || 'mt';
        return `<div class="kumas-toplu-urun-ozet" title="Dokunan ${fmt(o.dokunan)} ${b} · Yüklenen ${fmt(o.sevk)} ${b} · Sipariş ${fmt(o.siparis)} ${b}">
            <span class="kt-ozet-chip kt-ozet--sevk" title="Dokunan − yüklenen">Yüklenebilir <b>${fmt(o.sevkEdilebilir)}</b> ${b}</span>
            <span class="kt-ozet-chip kt-ozet--kapama" title="Sipariş − yükleme">Sipariş kalan <b>${fmt(o.kapanis)}</b> ${b}</span>
        </div>`;
    }

    function kumasTopluSecimYazi(src) {
        if (!src) return '';
        const kod = String(src.kod || '').trim();
        if (kod && kumasDepoStokKoduMu(kod)) {
            const parcalar = [kod];
            if (src.renk) parcalar.push(src.renk);
            if (src.renk_kodu) parcalar.push('Kod: ' + src.renk_kodu);
            return parcalar.length > 1 ? parcalar.join(' · ') : kod;
        }
        if (src.siparisKaynak || src.noKart) {
            return [src.siparis_sno ? ('Sip. ' + src.siparis_sno) : '', src.ad || src.kumas_cinsi, src.firma, src.renk, src.renk_kodu ? ('Kod: ' + src.renk_kodu) : ''].filter(Boolean).join(' · ');
        }
        return [src.ad || src.kumas_cinsi, src.firma || src.marka, src.renk, src.renk_kodu ? ('Kod: ' + src.renk_kodu) : '', src.lot_no].filter(Boolean).join(' · ');
    }

    function kumasTopluAramaBlob(r) {
        return [
            r && r.kod, r && r.ad, r && r.kumas_cinsi, r && r.firma, r && r.firmaArama, r && r.marka, r && r.renk, r && r.renk_kodu, r && r.lot_no,
            r && r.siparis_sno, r && r.siparisKaynak ? 'siparis kartsiz kodsuz' : '',
            r && r.tarak_eni, r && r.atki_sikligi, r && r.cozgu_sikligi, r && r.atki_ipi, r && r.cozgu_ipi
        ].join(' ').toLocaleLowerCase('tr-TR');
    }

    function kumasTopluKaynakRenkHareketUygula(row, x) {
        if (!row || !x) return;
        const ts = x.created_at ? new Date(x.created_at).getTime() : 0;
        const renkHam = String(x.renk || '').trim() || String(x.kumas_rengi || '').trim();
        if (renkHam && ts >= (row._renkTs || 0)) {
            row.renk = renkHam;
            row._renkTs = ts;
        }
        const rkHam = typeof kumasStokHareketRenkKoduHam === 'function' ? kumasStokHareketRenkKoduHam(x) : '';
        if (rkHam && ts >= (row._rkTs || 0)) {
            row.renk_kodu = rkHam;
            row._rkTs = ts;
        }
    }

    function kumasTopluKaynakRenkZenginlestir(row) {
        if (!row) return;
        const kart = row.kod && typeof kumasKutuphanesiKartBul === 'function' ? kumasKutuphanesiKartBul(row.kod) : null;
        if (!row.renk && kart) row.renk = kumasKartRenkOku(kart);
        if (!row.renk_kodu && kart) row.renk_kodu = kumasKartRenkKoduOku(kart);
        const fake = { stok_kodu: row.kod, renk: row.renk, renk_kodu: row.renk_kodu };
        if (!row.renk && typeof kumasStokListeRenkOku === 'function') row.renk = kumasStokListeRenkOku(fake);
        if (!row.renk_kodu && typeof kumasStokListeRenkKoduOku === 'function') row.renk_kodu = kumasStokListeRenkKoduOku(fake);
        delete row._renkTs;
        delete row._rkTs;
    }

    function kumasTopluKaynakSatirBos(anahtar, kod, x) {
        const kartKod = String(kod || '').trim();
        const ad = (typeof stokKartListeAdMetni === 'function' && x
            ? stokKartListeAdMetni(x, kartKod)
            : '') || (x && (x.desen_adi || x.urun_adi || x.kumas_cinsi || x.ad)) || kartKod || 'Kodsuz kumaş';
        const row = {
            anahtar,
            kod: kartKod,
            ad,
            kumas_cinsi: (x && (x.kumas_cinsi || x.urun_adi || x.ad)) || '',
            lot_no: (x && x.lot_no) || '',
            marka: (x && (x.marka || '')) || '',
            firma: (x && (x.firma || x.marka)) || '',
            firmaArama: String((x && (x.firma || x.marka)) || '').trim(),
            renk: (x && x.renk) || '',
            renk_kodu: (x && x.renk_kodu) || '',
            kg: 0,
            mt: 0,
            adet: 0
        };
        kumasKartTeknikUygula(row, x || {});
        if (kartKod) kumasTopluKaynakRenkZenginlestir(row);
        return row;
    }

    function kumasTopluKaynakRows() {
        const map = {};
        const kanal = (typeof depoHareketFormGrubu === 'function') ? depoHareketFormGrubu() : '';
        const hamIstegi = kanal === 'HAM_KUMAS';
        const mamulIstegi = kanal === 'MAMUL_KUMAS';
        const kartTipUygun = (kart) => {
            if (!hamIstegi && !mamulIstegi) return true;
            const tip = typeof kumasKartTipiOku === 'function' ? String(kumasKartTipiOku(kart) || '').toUpperCase() : '';
            if (hamIstegi) return tip !== 'MAMUL';
            if (mamulIstegi) return tip === 'MAMUL';
            return true;
        };
        const mamulKodMu = (kod) => {
            const k = String(kod || '').trim();
            if (!k) return false;
            if (typeof kumasKutuphanesiKartiMamulMu === 'function' && kumasKutuphanesiKartiMamulMu({ stok_kodu: k, desen_kodu: k })) return true;
            return typeof mamulStokKoduFormatMi === 'function' && mamulStokKoduFormatMi(k);
        };
        (dataCache.kumas_kutuphanesi || []).forEach(x => {
            if (typeof kumasKutuphanesiKartiMamulMu === 'function' && kumasKutuphanesiKartiMamulMu(x)) return;
            if (typeof stokKartGrupEslesir === 'function' && !stokKartGrupEslesir(x, 'KUMAS', { ignoreTipFiltre: true })) return;
            if (!kartTipUygun(x)) return;
            const kartKod = String(x.stok_kodu || x.desen_kodu || '').trim();
            if (kartKod && !kumasDepoStokKoduMu(kartKod) && mamulKodMu(kartKod)) return;
            const anahtar = kumasTopluSatirAnahtar(x);
            if (kumasTopluAnahtarBosMu(anahtar)) return;
            if (!map[anahtar]) map[anahtar] = kumasTopluKaynakSatirBos(anahtar, kartKod, x);
        });
        /* Varyant kartları DB'de ayrı kayıt olarak olmayabilir — aile verisinden oluştur */
        if (typeof kumasAnaKodBul === 'function' && typeof kumasVaryantAileVerisiOku === 'function'
            && typeof kumasVaryantStokKodu === 'function' && typeof kumasVaryantFormDoluMu === 'function') {
            const islenenAnalar = new Set();
            (dataCache.kumas_kutuphanesi || []).forEach(x => {
                if (typeof kumasKutuphanesiKartiMamulMu === 'function' && kumasKutuphanesiKartiMamulMu(x)) return;
                const kartKod = String(x.stok_kodu || x.desen_kodu || '').trim();
                if (!kumasDepoStokKoduMu(kartKod)) return;
                const ana = kumasAnaKodBul(kartKod);
                if (!ana || islenenAnalar.has(ana)) return;
                if (typeof kumasVaryantNoBul === 'function' && kumasVaryantNoBul(kartKod) > 0) return;
                islenenAnalar.add(ana);
                const varyantlar = kumasVaryantAileVerisiOku(ana);
                if (!Array.isArray(varyantlar) || !varyantlar.length) return;
                varyantlar.forEach((v, i) => {
                    const vNo = i + 1;
                    const varKod = kumasVaryantStokKodu(ana, vNo);
                    const varAnahtar = 'KOD:' + varKod.toUpperCase();
                    if (map[varAnahtar]) return;
                    const anaKart = x;
                    const ad = (typeof stokKartListeAdMetni === 'function' ? stokKartListeAdMetni(anaKart, ana) : '')
                        || anaKart.desen_adi || anaKart.urun_adi || anaKart.kumas_cinsi || varKod;
                    const renk = String(v.renk || '').trim();
                    const renk_kodu = String(v.renk_kodu || '').trim();
                    map[varAnahtar] = {
                        anahtar: varAnahtar,
                        kod: varKod,
                        ad: ad + (renk ? ' · ' + renk : ''),
                        kumas_cinsi: anaKart.kumas_cinsi || anaKart.urun_adi || '',
                        lot_no: '',
                        marka: String(anaKart.marka || '').trim(),
                        firma: String(anaKart.firma || '').trim(),
                        firmaArama: String(anaKart.firma || '').trim(),
                        renk: renk,
                        renk_kodu: renk_kodu,
                        kg: 0,
                        mt: 0,
                        adet: 0
                    };
                    if (typeof kumasKartTeknikUygula === 'function') kumasKartTeknikUygula(map[varAnahtar], anaKart);
                });
            });
        }
        (dataCache.kumas_stok || []).forEach(x => {
            if (typeof kumasStokHareketiKumasDepoMu === 'function' && !kumasStokHareketiKumasDepoMu(x)) return;
            if (hamIstegi && typeof kumasStokHareketiHamKumasMu === 'function' && !kumasStokHareketiHamKumasMu(x)) return;
            if (mamulIstegi && typeof kumasStokHareketiMamulKumasMu === 'function' && !kumasStokHareketiMamulKumasMu(x)) return;
            const kod = String(x.stok_kodu || '').trim();
            if (/^SIP-/i.test(kod)) return;
            if (kod && !kumasDepoStokKoduMu(kod) && mamulKodMu(kod)) return;
            const anahtar = kumasTopluSatirAnahtar(x);
            if (kumasTopluAnahtarBosMu(anahtar)) return;
            if (!map[anahtar]) {
                const kart = kumasDepoStokKoduMu(kod) ? kumasKutuphanesiKartBul(kod) : null;
                map[anahtar] = kumasTopluKaynakSatirBos(anahtar, kod, kart || x);
            }
            const row = map[anahtar];
            const firmaHareket = String(x.firma || '').trim();
            if (firmaHareket) {
                const blob = String(row.firmaArama || '');
                if (!blob.toLocaleLowerCase('tr-TR').includes(firmaHareket.toLocaleLowerCase('tr-TR'))) {
                    row.firmaArama = blob ? (blob + ' ' + firmaHareket) : firmaHareket;
                }
                if (!row.firma && !kumasTopluHareketCikisMi(x)) row.firma = firmaHareket;
            }
            if (!row.ad && (x.urun_adi || x.kumas_cinsi)) row.ad = x.urun_adi || x.kumas_cinsi;
            if (!row.kumas_cinsi && (x.kumas_cinsi || x.urun_adi)) row.kumas_cinsi = x.kumas_cinsi || x.urun_adi || '';
            kumasTopluKaynakRenkHareketUygula(row, x);
            if (!row.lot_no && x.lot_no) row.lot_no = x.lot_no;
            if (!row.marka && x.marka) row.marka = x.marka;
            row.kg += parseFloat(x.miktar_kg) || 0;
            row.mt += parseFloat(x.miktar_mt) || 0;
            row.adet += parseInt(x.cuval_sayisi || 0, 10) || 0;
        });
        if (kumasTopluCikisModuMu()) {
            try {
                kumasTopluSiparisKaynakRows().forEach(r => {
                    if (!r || !r.anahtar || map[r.anahtar]) return;
                    map[r.anahtar] = r;
                });
            } catch (e) { console.warn('kumasTopluSiparisKaynakRows', e); }
        }
        Object.values(map).forEach(kumasTopluKaynakRenkZenginlestir);
        return Object.values(map).sort((a, b) => {
            const as = a.siparisKaynak ? 0 : 1;
            const bs = b.siparisKaynak ? 0 : 1;
            if (as !== bs) return as - bs;
            const ak = String(a.kod || '');
            const bk = String(b.kod || '');
            if (kumasDepoStokKoduMu(ak) && !kumasDepoStokKoduMu(bk)) return -1;
            if (!kumasDepoStokKoduMu(ak) && kumasDepoStokKoduMu(bk)) return 1;
            const sno = String(a.siparis_sno || '').localeCompare(String(b.siparis_sno || ''), 'tr', { numeric: true });
            if (sno) return sno;
            return String(a.ad || '').localeCompare(String(b.ad || ''), 'tr', { sensitivity: 'base' });
        });
    }
    window.kumasTopluKaynakRows = kumasTopluKaynakRows;
    window.kumasTopluSatirAnahtar = kumasTopluSatirAnahtar;

    function kumasTopluSayi(v) {
        const n = parseFloat(String(v ?? '').replace(',', '.').trim());
        return Number.isFinite(n) ? n : 0;
    }

    function kumasTopluBosSatir() {
        return { query: '', kod: '', ad: '', anahtar: '', firma: '', renk: '', renk_kodu: '', lot_no: '', kumas_cinsi: '', marka: '', _secimYazi: '', mt: '', kg: '', not: '', hata: '', ceki: null, noKart: false, siparis_id: '', siparis_sno: '', kalem_idx: null, siparis_miktar: 0, siparis_birim: '' };
    }

    function kumasTopluKodCoz(raw) {
        const q = String(raw || '').trim();
        if (!q) return { kod: '', row: null, hata: '' };
        const src = kumasTopluKaynakRows();
        const qLower = q.toLocaleLowerCase('tr-TR');
        let adaylar = src.filter(r => r.anahtar && r.anahtar === q);
        if (!adaylar.length) adaylar = src.filter(r => String(r.kod || '').trim() && String(r.kod).toLocaleLowerCase('tr-TR') === qLower);
        if (!adaylar.length) {
            adaylar = src.filter(r => {
                const ad = String(r.ad || '').toLocaleLowerCase('tr-TR');
                const cins = String(r.kumas_cinsi || '').toLocaleLowerCase('tr-TR');
                const firma = String(r.firma || r.marka || '').toLocaleLowerCase('tr-TR');
                const sno = String(r.siparis_sno || '').toLocaleLowerCase('tr-TR');
                return (ad && ad === qLower) || (cins && cins === qLower) || (firma && firma === qLower) || (sno && sno === qLower);
            });
        }
        if (!adaylar.length) adaylar = src.filter(r => kumasTopluAramaBlob(r).includes(qLower));
        if (!adaylar.length && kumasTopluCikisModuMu()) {
            const serbest = kumasTopluSerbestKimlik(q);
            if (serbest) return { kod: serbest.kod, row: serbest, hata: '', noKart: true };
        }
        if (!adaylar.length) return { kod: '', row: null, hata: 'Eşleşme yok' };
        if (adaylar.length > 1) return { kod: adaylar[0].kod || '', row: null, coklu: true, adaylar, hata: `${adaylar.length} eşleşme bulundu — listeden seçin (sipariş / depo ayrı)` };
        return { kod: adaylar[0].kod || '', row: adaylar[0], hata: '', noKart: !!(adaylar[0].noKart || adaylar[0].siparisKaynak) };
    }
    window.kumasTopluKodCoz = kumasTopluKodCoz;

    function kumasTopluSatiraKaynakYaz(row, src) {
        if (!row || !src) return;
        row.anahtar = src.anahtar || '';
        row.kod = src.kod || '';
        row._secimYazi = kumasTopluSecimYazi(src);
        row.query = row._secimYazi;
        row.ad = src.ad || src.kumas_cinsi || src.kod || '';
        row.firma = src.firma || '';
        row.renk = src.renk || '';
        row.renk_kodu = src.renk_kodu || '';
        row.lot_no = src.lot_no || '';
        row.kumas_cinsi = src.kumas_cinsi || '';
        row.marka = src.marka || '';
        row.hata = '';
        if (src.siparisKaynak || src.noKart) kumasTopluSatiraSiparisYaz(row, src);
        else kumasTopluSatirSiparisTemizle(row);
    }

    function kumasTopluSatirKaynakBul(r) {
        if (!r) return null;
        const srcAll = kumasTopluKaynakRows();
        if (r.anahtar) {
            const hit = srcAll.find(x => x.anahtar === r.anahtar);
            if (hit) return hit;
        }
        const kod = String(r.kod || '').trim();
        if (kod && (kumasDepoStokKoduMu(kod) || /^SIP-/i.test(kod))) {
            const hit = srcAll.find(x => String(x.kod || '').trim().toUpperCase() === kod.toUpperCase());
            if (hit) return hit;
        }
        if (r.siparis_id != null && r.kalem_idx != null) {
            const hit = srcAll.find(x => String(x.siparis_id) === String(r.siparis_id) && Number(x.kalem_idx) === Number(r.kalem_idx));
            if (hit) return hit;
        }
        const coz = kumasTopluKodCoz(r.query || r.kod);
        return coz.row || null;
    }

    window._kumasTopluSatirlar = [kumasTopluBosSatir()];
    window.kumasTopluSatirBaslat = function () {
        window._kumasTopluSatirlar = [kumasTopluBosSatir()];
        if (typeof kumasTopluRender === 'function') kumasTopluRender();
    };
    window.kumasTopluSatirEkle = function () {
        window._kumasTopluSatirlar.push(kumasTopluBosSatir());
        kumasTopluRender();
    };
    window.kumasTopluSatirSil = function (idx) {
        const rows = window._kumasTopluSatirlar || [];
        rows.splice(idx, 1);
        if (!rows.length) rows.push(kumasTopluBosSatir());
        kumasTopluRender();
    };
    window.kumasTopluSatirGuncelle = function (idx, alan, deger) {
        const row = (window._kumasTopluSatirlar || [])[idx];
        if (!row) return;
        row[alan] = deger;
        if (alan === 'query') {
            row.hata = '';
            if (String(deger || '') !== String(row._secimYazi || '')) {
                row.anahtar = '';
                row.kod = '';
                row.ad = '';
                kumasTopluSatirSiparisTemizle(row);
            }
        }
        kumasTopluOzetGuncelle();
    };
    function kumasTopluKodDropPortalaAl(drop) {
        if (!drop) {
            drop = document.body.querySelector(':scope > #kumas-toplu-kod-drop');
            if (!drop) drop = document.getElementById('kumas-toplu-kod-drop');
        }
        if (!drop) {
            drop = document.createElement('div');
            drop.id = 'kumas-toplu-kod-drop';
            document.body.appendChild(drop);
        }
        document.querySelectorAll('#kumas-toplu-kod-drop').forEach((d, i) => {
            if (d !== drop && d.parentElement === document.body) {
                try { d.remove(); } catch (e) {}
            }
        });
        if (typeof dropdownAnchorKaydet === 'function') dropdownAnchorKaydet(drop);
        if (drop.parentElement !== document.body) document.body.appendChild(drop);
        return drop;
    }

    function kumasTopluKodDropKonumla(inp, drop) {
        if (!inp || !drop) return;
        const rect = inp.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 10;
        const spaceAbove = rect.top - 10;
        const openUp = spaceBelow < 200 && spaceAbove > spaceBelow + 20;
        const avail = Math.max(140, openUp ? spaceAbove : spaceBelow);
        const maxH = Math.min(420, avail);
        const minW = Math.min(640, window.innerWidth - 16);
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
        drop.style.minWidth = Math.min(520, width) + 'px';
        drop.style.maxWidth = (window.innerWidth - 16) + 'px';
        drop.style.maxHeight = maxH + 'px';
        drop.style.overflowY = 'auto';
        drop.style.overflowX = 'hidden';
        drop.style.pointerEvents = 'auto';
        drop.style.webkitOverflowScrolling = 'touch';
        drop._anchorInput = inp;
        if (drop.parentElement !== document.body) document.body.appendChild(drop);
    }
    window.kumasTopluKodDropKonumla = kumasTopluKodDropKonumla;

    window.kumasTopluDropKapat = function () {
        document.querySelectorAll('#kumas-toplu-kod-drop').forEach(drop => {
            if (typeof dropdownPortalTemizle === 'function') {
                dropdownPortalTemizle(drop);
                return;
            }
            try { drop._anchorInput = null; } catch (e) {}
            drop.classList.remove('is-open');
            drop.style.display = 'none';
            drop.style.pointerEvents = 'none';
            drop.innerHTML = '';
            ['position', 'top', 'left', 'width', 'minWidth', 'maxWidth', 'maxHeight', 'zIndex'].forEach(k => {
                try { drop.style[k] = ''; } catch (e) {}
            });
        });
        document.querySelectorAll('body > #kumas-toplu-kod-drop').forEach(drop => {
            try { drop.remove(); } catch (e) {}
        });
        window._kumasTopluAramaAdaylari = [];
        window._kumasTopluAktifSatir = null;
    };
    window.kumasTopluAdaySec = function (idx) {
        const satirIdx = window._kumasTopluAktifSatir;
        const row = (window._kumasTopluSatirlar || [])[satirIdx];
        const aday = (window._kumasTopluAramaAdaylari || [])[idx];
        if (!row || !aday) return;
        kumasTopluSatiraKaynakYaz(row, aday);
        kumasTopluRender();
        kumasTopluDropKapat();
        const qtyInp = document.getElementById('kt-mt-' + satirIdx);
        if (qtyInp) { qtyInp.focus(); qtyInp.select?.(); }
    };
    window.kumasTopluAra = function (idx, inputEl) {
        try {
            const row = (window._kumasTopluSatirlar || [])[idx];
            if (!row) return;
            const inp = inputEl || document.getElementById('kt-kod-' + idx);
            if (!inp || !inp.isConnected) {
                kumasTopluDropKapat();
                return;
            }
            if (inp.value != null) row.query = inp.value;
            const drop = kumasTopluKodDropPortalaAl();
            if (!drop) return;
            const q = String(row.query || '').trim().toLocaleLowerCase('tr-TR');
            let src = [];
            try { src = kumasTopluKaynakRows() || []; } catch (e) { console.warn('kumasTopluKaynakRows', e); }
            let adaylar;
            if (!q) {
                /* Boş aramada önce varyant kartlarını (SM-XXXX-N), sonra ana kartları göster — limit 32 */
                const varyantlar = src.filter(r => {
                    const k = String(r.kod || '').trim();
                    return k && typeof kumasVaryantNoBul === 'function' && kumasVaryantNoBul(k) > 0;
                });
                const anaKartlar = src.filter(r => {
                    const k = String(r.kod || '').trim();
                    return !k || typeof kumasVaryantNoBul !== 'function' || kumasVaryantNoBul(k) === 0;
                });
                adaylar = [...varyantlar, ...anaKartlar].slice(0, 32);
            } else {
                adaylar = src.filter(r => kumasTopluAramaBlob(r).includes(q));
                if (!adaylar.length) {
                    const qAscii = q.replace(/ı/g, 'i').replace(/İ/g, 'i');
                    adaylar = src.filter(r => kumasTopluAramaBlob(r).replace(/ı/g, 'i').includes(qAscii));
                }
                /* Varyant kartlarını (SM-XXXX-N) her zaman önce göster */
                adaylar.sort((a, b) => {
                    const aV = typeof kumasVaryantNoBul === 'function' ? kumasVaryantNoBul(String(a.kod || '')) : 0;
                    const bV = typeof kumasVaryantNoBul === 'function' ? kumasVaryantNoBul(String(b.kod || '')) : 0;
                    if (aV > 0 && bV === 0) return -1;
                    if (aV === 0 && bV > 0) return 1;
                    return String(a.kod || '').localeCompare(String(b.kod || ''), 'tr', { numeric: true });
                });
                adaylar = adaylar.slice(0, 32);
            }
            window._kumasTopluAramaAdaylari = adaylar;
            window._kumasTopluAktifSatir = idx;
            const esc = (s) => (typeof pdfEsc === 'function' ? pdfEsc(s) : String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'));
            let html;
            if (!adaylar.length) {
                const bos = src.length
                    ? 'Eşleşme yok — sipariş no, ürün adı, müşteri veya stok kodu yazın'
                    : 'Kayıtlı kumaş veya açık sipariş bulunamadı';
                html = `<div class="mamul-toplu-kod-drop-item" style="pointer-events:none;cursor:default">
                    <span class="mamul-toplu-kod-drop-item__ad">${esc(bos)}</span>
                </div>`;
            } else {
                html = adaylar.map((a, i) => {
                    const siparisMi = !!(a.siparisKaynak || a.noKart);
                    const kodYazi = siparisMi
                        ? ('Sipariş ' + (a.siparis_sno || a.kod || ''))
                        : (String(a.kod || '').trim() || 'KODSUZ DEPO');
                    const mus = a.firma || a.marka || '';
                    const varyantMi = !siparisMi && typeof kumasVaryantNoBul === 'function' && kumasVaryantNoBul(String(a.kod || '')) > 0;
                    const ozellik = [
                        siparisMi ? 'Kartsız sipariş' : (varyantMi ? '🎨 Boyalı varyant' : 'Depo stoku'),
                        mus ? ('Müşteri: ' + mus) : '',
                        a.renk ? ('Renk: ' + a.renk) : '',
                        a.renk_kodu ? ('Kod: ' + a.renk_kodu) : '',
                        a.lot_no && !siparisMi ? ('Lot: ' + a.lot_no) : '',
                        a.kumas_cinsi || ''
                    ].filter(Boolean).join(' · ');
                    let ozet = null;
                    try { ozet = siparisMi ? kumasTopluSiparisOzetHesapla(a) : null; } catch (e) {}
                    const stokTxt = ozet
                        ? `Yüklenebilir ${Math.round(ozet.sevkEdilebilir || 0).toLocaleString('tr-TR')} ${ozet.birimLbl || 'mt'} · Sipariş kalan ${Math.round(ozet.kapanis || 0).toLocaleString('tr-TR')}`
                        : `${Number(a.kg || 0).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} kg · ${Number(a.mt || 0).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} mt`;
                    return `
            <div class="mamul-toplu-kod-drop-item" onmousedown="event.preventDefault();kumasTopluAdaySec(${i})">
                <span class="mamul-toplu-kod-drop-item__kod">${esc(kodYazi)}</span>
                <span class="mamul-toplu-kod-drop-item__ad">${esc(a.ad || '—')}</span>
                <span class="mamul-toplu-kod-drop-item__meta">${esc(ozellik)}</span>
                <span class="mamul-toplu-kod-drop-item__meta">${esc(stokTxt)}</span>
            </div>`;
                }).join('');
            }
            drop.innerHTML = html;
            drop.style.display = 'block';
            drop.style.pointerEvents = 'auto';
            drop.classList.add('is-open');
            drop._anchorInput = inp;
            kumasTopluKodDropKonumla(inp, drop);
        } catch (e) {
            console.warn('kumasTopluAra', e);
        }
    };
    window.kumasTopluKodUygula = function (idx) {
        const row = (window._kumasTopluSatirlar || [])[idx];
        if (!row) return;
        if (row.anahtar) {
            const src = kumasTopluSatirKaynakBul(row);
            if (src) {
                kumasTopluSatiraKaynakYaz(row, src);
                kumasTopluRender();
                const qtyKeep = document.getElementById('kt-mt-' + idx);
                if (qtyKeep) { qtyKeep.focus(); qtyKeep.select?.(); }
                return;
            }
        }
        const q = String(row.query || row.kod || '').trim();
        if (!q) {
            row.kod = '';
            row.ad = '';
            row.anahtar = '';
            row.hata = '';
            kumasTopluRender();
            return;
        }
        const coz = kumasTopluKodCoz(q);
        if (coz.coklu) {
            row.hata = coz.hata;
            kumasTopluRender();
            const inp = document.getElementById('kt-kod-' + idx);
            if (inp) kumasTopluAra(idx, inp);
            return;
        }
        if (coz.hata || !coz.row) {
            row.kod = '';
            row.ad = '';
            row.anahtar = '';
            row.hata = coz.hata || 'Ürün bulunamadı';
        } else {
            kumasTopluSatiraKaynakYaz(row, coz.row);
        }
        kumasTopluRender();
        const qtyInp = document.getElementById('kt-mt-' + idx);
        if (qtyInp) { qtyInp.focus(); qtyInp.select?.(); }
    };
    window.kumasTopluKodSatiraYaz = function (kod, idx) {
        const row = (window._kumasTopluSatirlar || [])[idx || 0];
        if (!row) return;
        row.query = kod;
        kumasTopluKodUygula(idx || 0);
    };
    window.kumasTopluYapistir = function () {
        const txt = window.prompt('Her satır: STOK KODU; METRE; KG; NOT', '');
        if (!txt) return;
        const rows = txt.split(/\r?\n/).map(line => {
            const p = line.split('\t').length > 1 ? line.split('\t') : line.split(';');
            return {
                query: String(p[0] || '').trim(),
                kod: '',
                ad: '',
                anahtar: '',
                firma: '',
                renk: '',
                lot_no: '',
                kumas_cinsi: '',
                marka: '',
                _secimYazi: '',
                mt: String(p[1] || '').trim(),
                kg: String(p[2] || '').trim(),
                not: String(p[3] || '').trim(),
                hata: ''
            };
        }).filter(r => r.query || r.mt || r.kg || r.not);
        window._kumasTopluSatirlar = rows.length ? rows : [kumasTopluBosSatir()];
        kumasTopluRender();
    };

    function kumasTopluSatirHtml(r, idx) {
        const esc = (s) => (typeof pdfEsc === 'function' ? pdfEsc(s) : String(s ?? ''));
        const src = kumasTopluSatirKaynakBul(r);
        const meta = (r.anahtar || r.kod || r.ad)
            ? (() => {
                const cekiOz = kumasCekiOzetHesapla(r.ceki);
                const cekiTxt = cekiOz.top ? ` · Çeki: ${cekiOz.top} top` : '';
                if (!src) return (r.hata || '—') + cekiTxt;
                const mus = src.firma || src.marka || '';
                const musTxt = mus ? ` · ${mus}` : '';
                const renkTxt = [
                    src.renk ? `Renk: ${src.renk}` : '',
                    src.renk_kodu ? `Kod: ${src.renk_kodu}` : ''
                ].filter(Boolean).join(' · ');
                const renkBlok = renkTxt ? ` · ${renkTxt}` : '';
                return `${kumasKartTeknikSatir(src)}${musTxt}${renkBlok} · ${Number(src.kg || 0).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} kg · ${Number(src.mt || 0).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} mt${cekiTxt}`;
            })()
            : (kumasCekiOzetHesapla(r.ceki).top ? `Çeki: ${kumasCekiOzetHesapla(r.ceki).top} top` : '—');
        const cekiOzBtn = kumasCekiOzetHesapla(r.ceki);
        return `<div class="kumas-toplu-hareket-row${r.hata ? ' has-error' : ''}">
            <input id="kt-kod-${idx}" class="pro-input kt-kod" value="${esc(r.query)}" placeholder="Sipariş no, ürün, müşteri, kod…"
                oninput="kumasTopluSatirGuncelle(${idx},'query',this.value);kumasTopluAra(${idx},this)"
                onfocus="kumasTopluAra(${idx},this)"
                onblur="setTimeout(function(){kumasTopluDropKapat();kumasTopluKodUygula(${idx});},120)"
                onkeydown="if(event.key==='Enter'){event.preventDefault();kumasTopluKodUygula(${idx});}">
            <div class="kumas-toplu-urun">
                <span class="kumas-toplu-urun-ad">${esc(r.ad || 'Ürün seçilmedi')}${r.noKart || r.siparis_id ? ' <span class="pill" style="font-size:8px;margin-left:6px">kartsız sipariş</span>' : ''}</span>
                <span class="kumas-toplu-urun-meta">${esc(r.hata || meta)}</span>
                ${(!r.hata && (r.noKart || r.siparis_id)) ? kumasTopluSiparisOzetHtml(r) : ''}
            </div>
            <label class="kt-field kt-field--mt"><span>Metre ★</span>
            <input id="kt-mt-${idx}" type="number" min="0" step="0.01" class="pro-input is-ana-input kt-mt" value="${esc(r.mt)}" placeholder="0"
                oninput="kumasTopluSatirGuncelle(${idx},'mt',this.value)"
                onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('kt-kg-${idx}')?.focus();}"></label>
            <label class="kt-field kt-field--kg"><span>Kg</span>
            <input id="kt-kg-${idx}" type="number" min="0" step="0.01" class="pro-input kt-kg" value="${esc(r.kg)}" placeholder="0"
                oninput="kumasTopluSatirGuncelle(${idx},'kg',this.value)"></label>
            <label class="kt-field kt-field--not"><span>Not</span>
            <input id="kt-not-${idx}" class="pro-input kt-not" value="${esc(r.not)}" placeholder="İsteğe bağlı"
                oninput="kumasTopluSatirGuncelle(${idx},'not',this.value)"></label>
            <button type="button" class="kumas-ceki-row-btn${cekiOzBtn.top ? ' has-ceki' : ''}" onclick="kumasCekiListeAc(${idx})" title="Çeki listesi">${cekiOzBtn.top ? cekiOzBtn.top + ' top' : 'Çeki listesi'}</button>
            <button type="button" class="ms-act kt-sil" onclick="kumasTopluSatirSil(${idx})" title="Satırı sil">Sil</button>
        </div>`;
    }

    function kumasTopluOzetGuncelle() {
        const rows = window._kumasTopluSatirlar || [];
        let satir = 0;
        let topMt = 0;
        let topKg = 0;
        rows.forEach(r => {
            const mt = kumasTopluSayi(r.mt);
            const kg = kumasTopluSayi(r.kg);
            if ((r.kod || r.anahtar || r.ad || r.query) && mt > 0 && !r.hata) {
                satir++;
                topMt += mt;
                topKg += kg;
            }
        });
        const oz = document.getElementById('kumas-toplu-hareket-ozet');
        if (oz) oz.innerHTML = `<span><strong>${satir}</strong> geçerli satır</span><span><strong>${topMt.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</strong> mt · <strong>${topKg.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</strong> kg</span>`;
        const prev = document.getElementById('kumas-toplu-preview-ozet');
        if (prev) prev.textContent = `${satir} ürün · ${topMt.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} mt / ${topKg.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kg`;
        kumasCekiFormOzetGuncelle();
    }
    window.kumasTopluOzetGuncelle = kumasTopluOzetGuncelle;

    const KUMAS_CEKI_MIN = 25;
    const KUMAS_CEKI_MAX = 400;
    const KUMAS_CEKI_KOLON = 5;
    const KUMAS_CEKI_SATIR = 25;
    const KUMAS_CEKI_BLOK = KUMAS_CEKI_KOLON * KUMAS_CEKI_SATIR;
    const KUMAS_CEKI_OV_ID = 'kumas-ceki-toplu-overlay';
    window._kumasCekiDraft = null;

    function kumasCekiOzetHesapla(list) {
        let top = 0, mt = 0, kg = 0;
        (list || []).forEach(x => {
            const m = kumasTopluSayi(x && x.mt);
            const k = kumasTopluSayi(x && x.kg);
            if (m > 0 || k > 0) {
                top++;
                mt += m;
                kg += k;
            }
        });
        return { top, mt, kg };
    }
    function kumasCekiFmt(n, d) {
        return Number(n || 0).toLocaleString('tr-TR', { maximumFractionDigits: d == null ? 2 : d });
    }
    function kumasCekiYazi(oz) {
        if (!oz || !oz.top) return '';
        return `${oz.top} top yüklendi · ${kumasCekiFmt(oz.mt)} mt · ${kumasCekiFmt(oz.kg)} kg`;
    }
    function kumasCekiDoluListe(list) {
        return (list || []).filter(x => kumasTopluSayi(x && x.mt) > 0)
            .map(x => ({ mt: kumasTopluSayi(x.mt), kg: kumasTopluSayi(x.kg) }));
    }
    function kumasCekiSlotDoldur(kaynak, adet) {
        const n = Math.max(KUMAS_CEKI_MIN, Math.min(KUMAS_CEKI_MAX, adet || KUMAS_CEKI_MIN));
        const src = Array.isArray(kaynak) ? kaynak : [];
        const out = [];
        for (let i = 0; i < n; i++) {
            const x = src[i] || {};
            out.push({
                mt: x.mt === 0 || x.mt ? String(x.mt) : '',
                kg: x.kg === 0 || x.kg ? String(x.kg) : ''
            });
        }
        return out;
    }
    function kumasCekiFormOzetGuncelle() {
        const el = document.getElementById('kumas-ceki-form-ozet');
        if (!el) return;
        const rows = window._kumasTopluSatirlar || [];
        let top = 0, mt = 0, kg = 0, satir = 0;
        rows.forEach(r => {
            const oz = kumasCekiOzetHesapla(r.ceki);
            if (!oz.top) return;
            satir++;
            top += oz.top;
            mt += oz.mt;
            kg += oz.kg;
        });
        if (!top) {
            el.classList.remove('is-on');
            el.innerHTML = '';
            return;
        }
        el.classList.add('is-on');
        el.innerHTML = `Çeki listesi kaydedildi — <strong>${top} top</strong> yüklendi · <strong>${kumasCekiFmt(mt)} mt</strong> · <strong>${kumasCekiFmt(kg)} kg</strong>${satir > 1 ? ` <span style="font-weight:500;color:var(--text2)">(${satir} ürün)</span>` : ''}`;
    }
    function kumasCekiOverlayEl() {
        let ov = document.getElementById(KUMAS_CEKI_OV_ID);
        if (ov) return ov;
        ov = document.createElement('div');
        ov.id = KUMAS_CEKI_OV_ID;
        ov.dataset.cekiMod = 'toplu';
        ov.innerHTML = `<div class="kumas-ceki-box" onclick="event.stopPropagation()">
            <div class="kumas-ceki-head">
                <div>
                    <h3>ÇEKİ LİSTESİ</h3>
                    <div class="kumas-ceki-meta" id="kumas-ceki-urun">—</div>
                    <div class="kumas-ceki-musteri" id="kumas-ceki-musteri"></div>
                </div>
                <div class="kumas-ceki-toolbar">
                    <button type="button" onclick="kumasCekiTopluYazdir()">Yazdır</button>
                    <button type="button" onclick="kumasCekiTopluPdfIndir()">PDF indir</button>
                    <button type="button" class="is-kapat" onclick="kumasCekiTopluKapat()">Kapat</button>
                </div>
                <div class="kumas-ceki-acts">
                    <button type="button" onclick="kumasCekiSatirEkle(25)">+25 top</button>
                    <button type="button" onclick="kumasCekiSatirEkle(100)">+100 top</button>
                    <button type="button" onclick="kumasCekiTopluTemizle()">Temizle</button>
                    <button type="button" class="is-save" onclick="kumasCekiTopluKaydet()">Listeyi kaydet</button>
                </div>
            </div>
            <div class="kumas-ceki-ozet-bar" id="kumas-ceki-live-ozet"></div>
            <div class="kumas-ceki-blocks" id="kumas-ceki-toplu-blocks"></div>
        </div>`;
        ov.addEventListener('click', (e) => { if (e.target === ov) window.kumasCekiTopluKapat(); });
        document.body.appendChild(ov);
        ov.addEventListener('input', kumasCekiInput);
        ov.addEventListener('keydown', kumasCekiKey);
        if (!window._kumasCekiEscBagli) {
            window._kumasCekiEscBagli = true;
            document.addEventListener('keydown', (e) => {
                if (e.key !== 'Escape') return;
                if (!document.getElementById(KUMAS_CEKI_OV_ID)) return;
                e.preventDefault();
                window.kumasCekiTopluKapat();
            });
        }
        return ov;
    }
    function kumasCekiLiveOzetCiz() {
        const draft = window._kumasCekiDraft;
        const ozEl = document.getElementById('kumas-ceki-live-ozet');
        if (!draft || !ozEl) return;
        const oz = kumasCekiOzetHesapla(draft.slots);
        ozEl.innerHTML = `<span>Yüklenen top: <b>${oz.top}</b></span><span>Toplam metre: <b>${kumasCekiFmt(oz.mt)}</b></span><span>Toplam kg: <b>${kumasCekiFmt(oz.kg)}</b></span><span>Kapasite: <b>${draft.slots.length}</b> / ${KUMAS_CEKI_MAX}</span>`;
        const blocks = document.getElementById('kumas-ceki-toplu-blocks');
        if (!blocks) return;
        const cols = blocks.querySelectorAll('.kumas-ceki-col');
        cols.forEach(col => {
            const start = parseInt(col.getAttribute('data-start'), 10) || 0;
            const end = parseInt(col.getAttribute('data-end'), 10) || 0;
            let mt = 0, kg = 0;
            for (let i = start; i < end; i++) {
                const s = draft.slots[i];
                if (!s) continue;
                mt += kumasTopluSayi(s.mt);
                kg += kumasTopluSayi(s.kg);
            }
            const mtEl = col.querySelector('[data-col-mt]');
            const kgEl = col.querySelector('[data-col-kg]');
            if (mtEl) mtEl.textContent = kumasCekiFmt(mt);
            if (kgEl) kgEl.textContent = kumasCekiFmt(kg);
        });
    }
    function kumasCekiGridCiz() {
        const draft = window._kumasCekiDraft;
        const host = document.getElementById('kumas-ceki-toplu-blocks');
        if (!draft || !host) return;
        const slots = draft.slots;
        let html = '';
        for (let b = 0; b < slots.length; b += KUMAS_CEKI_BLOK) {
            const chunk = Math.min(KUMAS_CEKI_BLOK, slots.length - b);
            const per = Math.ceil(chunk / KUMAS_CEKI_KOLON) || KUMAS_CEKI_SATIR;
            html += '<div class="kumas-ceki-block">';
            for (let c = 0; c < KUMAS_CEKI_KOLON; c++) {
                const start = b + c * per;
                const end = Math.min(start + per, b + chunk);
                if (start >= b + chunk) {
                    html += '<div class="kumas-ceki-col" style="visibility:hidden"></div>';
                    continue;
                }
                let rows = '';
                for (let i = start; i < end; i++) {
                    const s = slots[i] || { mt: '', kg: '' };
                    rows += `<tr>
                        <td class="no">${i + 1}</td>
                        <td><input data-ceki="${i}" data-alan="mt" value="${String(s.mt ?? '').replace(/"/g, '&quot;')}" inputmode="decimal"></td>
                        <td><input data-ceki="${i}" data-alan="kg" value="${String(s.kg ?? '').replace(/"/g, '&quot;')}" inputmode="decimal"></td>
                    </tr>`;
                }
                html += `<div class="kumas-ceki-col" data-start="${start}" data-end="${end}">
                    <table>
                        <thead><tr><th>Sıra No</th><th>Metre</th><th>Kg</th></tr></thead>
                        <tbody>${rows}</tbody>
                        <tfoot><tr><td>Toplam</td><td data-col-mt>0</td><td data-col-kg>0</td></tr></tfoot>
                    </table>
                </div>`;
            }
            html += '</div>';
        }
        host.innerHTML = html;
        kumasCekiLiveOzetCiz();
    }
    function kumasCekiInput(e) {
        const inp = e.target.closest ? e.target.closest('input[data-ceki]') : null;
        if (!inp || !window._kumasCekiDraft) return;
        const i = parseInt(inp.getAttribute('data-ceki'), 10);
        const alan = inp.getAttribute('data-alan');
        if (!window._kumasCekiDraft.slots[i]) window._kumasCekiDraft.slots[i] = { mt: '', kg: '' };
        window._kumasCekiDraft.slots[i][alan] = inp.value;
        kumasCekiLiveOzetCiz();
    }
    function kumasCekiKey(e) {
        const inp = e.target.closest ? e.target.closest('input[data-ceki]') : null;
        if (!inp) return;
        const i = parseInt(inp.getAttribute('data-ceki'), 10);
        const alan = inp.getAttribute('data-alan');
        const go = (ni, na) => {
            const el = document.querySelector(`#${KUMAS_CEKI_OV_ID} input[data-ceki="${ni}"][data-alan="${na}"]`);
            if (el) { el.focus(); el.select(); }
        };
        if (e.key === 'Enter') {
            e.preventDefault();
            if (alan === 'mt') go(i, 'kg');
            else go(i + 1, 'mt');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            go(i + 1, alan);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            go(i - 1, alan);
        }
    }
    window.kumasCekiListeAc = function (idx) {
        const rows = window._kumasTopluSatirlar || [];
        if (!rows.length) {
            if (typeof erpToast === 'function') erpToast('Önce çıkış satırı oluşturun.', 'warn');
            return;
        }
        let i = Number.isInteger(idx) ? idx : rows.findIndex(r => r.kod || r.anahtar || r.query);
        if (i < 0) i = 0;
        const row = rows[i];
        if (!row) return;
        const mevcut = Array.isArray(row.ceki) ? row.ceki : [];
        const n = Math.max(KUMAS_CEKI_MIN, Math.min(KUMAS_CEKI_MAX, Math.ceil(Math.max(mevcut.length, KUMAS_CEKI_MIN) / KUMAS_CEKI_SATIR) * KUMAS_CEKI_SATIR));
        window._kumasCekiDraft = { idx: i, slots: kumasCekiSlotDoldur(mevcut, n) };
        const ov = kumasCekiOverlayEl();
        const urun = document.getElementById('kumas-ceki-urun');
        const musEl = document.getElementById('kumas-ceki-musteri');
        if (urun) urun.textContent = [row.kod || row.query || '', row.ad].filter(Boolean).join(' - ') || 'Ürün seçilmedi';
        if (musEl) {
            const mus = String(document.getElementById('val-afirma')?.value || '').trim();
            musEl.textContent = mus ? ('Müşteri: ' + mus) : '';
        }
        ov.classList.add('is-open');
        ov.style.display = 'flex';
        const host = document.getElementById('kumas-ceki-toplu-blocks');
        if (host) host.innerHTML = '<div style="padding:18px;color:#64748b;font-size:12px">Liste hazırlanıyor…</div>';
        requestAnimationFrame(() => {
            kumasCekiGridCiz();
            const first = ov.querySelector('input[data-alan="mt"]');
            if (first) first.focus();
        });
    };
    window.kumasCekiSatirEkle = function (adet) {
        const draft = window._kumasCekiDraft;
        if (!draft) return;
        const ek = parseInt(adet, 10) || 25;
        const n = Math.min(KUMAS_CEKI_MAX, draft.slots.length + ek);
        if (n === draft.slots.length) {
            if (typeof erpToast === 'function') erpToast('En fazla 400 top girilebilir.', 'warn');
            return;
        }
        draft.slots = kumasCekiSlotDoldur(draft.slots, n);
        kumasCekiGridCiz();
    };
    window.kumasCekiTopluTemizle = function () {
        const draft = window._kumasCekiDraft;
        if (!draft) return;
        draft.slots = kumasCekiSlotDoldur([], draft.slots.length);
        kumasCekiGridCiz();
    };
    window.kumasCekiTopluKapat = function () {
        const ov = document.getElementById(KUMAS_CEKI_OV_ID);
        if (ov) {
            ov.classList.remove('is-open');
            ov.style.display = 'none';
            try { ov.remove(); } catch (e) {}
        }
        window._kumasCekiDraft = null;
    };
    window.kumasCekiTopluKaydet = function () {
        const draft = window._kumasCekiDraft;
        if (!draft) {
            if (typeof erpToast === 'function') erpToast('Açık bir çeki listesi yok.', 'error');
            return;
        }
        const row = (window._kumasTopluSatirlar || [])[draft.idx];
        if (!row) {
            if (typeof erpToast === 'function') erpToast('Çeki listesinin bağlı olduğu satır bulunamadı.', 'error');
            return;
        }
        const yarim = (draft.slots || []).filter(x => {
            const m = kumasTopluSayi(x && x.mt);
            const k = kumasTopluSayi(x && x.kg);
            return (k > 0 && m <= 0); /* kg varsa metre zorunlu; metre tek başına yeterli */
        });
        if (yarim.length) {
            if (typeof erpToast === 'function') erpToast('Kg girildiyse metre de zorunludur.', 'error');
            return;
        }
        const dolu = kumasCekiDoluListe(draft.slots);
        if (!dolu.length) {
            if (typeof erpToast === 'function') erpToast('En az bir top için metre girin.', 'error');
            return;
        }
        const oz = kumasCekiOzetHesapla(dolu);
        row.ceki = dolu;
        row.mt = String(Math.round(oz.mt * 100) / 100);
        row.kg = String(Math.round(oz.kg * 100) / 100);
        row.hata = '';
        const satirIdx = draft.idx;
        window.kumasCekiTopluKapat();
        kumasTopluRender();
        if (typeof erpToast === 'function') erpToast(`Çeki listesi kaydedildi: ${kumasCekiYazi(oz)}`, 'success', 4500);
        const mtInp = document.getElementById('kt-mt-' + satirIdx);
        if (mtInp) mtInp.focus();
    };
    window.kumasCekiTopluYazdir = function () {
        const draft = window._kumasCekiDraft;
        if (!draft) return;
        const row = (window._kumasTopluSatirlar || [])[draft.idx] || {};
        const dolu = kumasCekiDoluListe(draft.slots).map((x, i) => ({ no: i + 1, mt: x.mt, kg: x.kg }));
        if (!dolu.length) {
            if (typeof erpToast === 'function') erpToast('Liste boş.', 'warn');
            return;
        }
        const meta = {
            stok_kodu: row.kod || '',
            urun_adi: row.ad || '',
            musteri: String(document.getElementById('val-afirma')?.value || '').trim(),
            ...(typeof kumasCekiTeslimPlakaOku === 'function' ? kumasCekiTeslimPlakaOku() : {}),
            otoyazdir: true
        };
        if (typeof kumasCekiA4Yazdir === 'function') {
            kumasCekiA4Yazdir(dolu, meta);
            return;
        }
        if (typeof erpToast === 'function') erpToast('Yazdırma modülü yüklenemedi.', 'error');
    };
    window.kumasCekiTopluPdfIndir = function () {
        const draft = window._kumasCekiDraft;
        if (!draft) return;
        const row = (window._kumasTopluSatirlar || [])[draft.idx] || {};
        const dolu = kumasCekiDoluListe(draft.slots).map((x, i) => ({ no: i + 1, mt: x.mt, kg: x.kg }));
        if (!dolu.length) {
            if (typeof erpToast === 'function') erpToast('Liste boş.', 'warn');
            return;
        }
        const meta = {
            stok_kodu: row.kod || '',
            urun_adi: row.ad || '',
            musteri: String(document.getElementById('val-afirma')?.value || '').trim(),
            ...(typeof kumasCekiTeslimPlakaOku === 'function' ? kumasCekiTeslimPlakaOku() : {})
        };
        if (typeof kumasCekiA4Html !== 'function' || typeof erpBelgePdfIndir !== 'function') {
            window.kumasCekiTopluYazdir();
            return;
        }
        erpBelgePdfIndir(kumasCekiA4Html(dolu, meta), 'ceki-listesi' + (row.kod ? '-' + row.kod : ''));
    };
    window.kumasCekiFormOzetGuncelle = kumasCekiFormOzetGuncelle;

    function kumasTopluRender() {
        const body = document.getElementById('kumas-toplu-hareket-body');
        if (!body) return;
        body.innerHTML = (window._kumasTopluSatirlar || []).map((r, idx) => kumasTopluSatirHtml(r, idx)).join('');
        kumasTopluOzetGuncelle();
    }
    window.kumasTopluRender = kumasTopluRender;

    function kumasDepoKomutaFormHtml(isGiris) {
        const tarihStr = new Date().toLocaleString('tr-TR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
        return `
        <div class="mdf ${isGiris ? 'mdf--giris' : 'mdf--cikis'}">
            <div class="mdf-bar">
                <div class="mdf-bar-left">
                    <span class="mdf-badge">${isGiris ? 'Giriş' : 'Sevkiyat'}</span>
                    <span class="mdf-ozet" id="kumas-toplu-preview-ozet">0 ürün · 0 mt / 0 kg</span>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
                    ${isGiris ? '' : '<button type="button" class="mdf-ceki-btn" onclick="kumasCekiListeAc()">Çeki Listesi</button>'}
                    <button type="button" class="mdf-save" onclick="handleSave()">${isGiris ? 'Girişi kaydet' : 'Sevkiyatı kaydet'}</button>
                </div>
            </div>
            ${!isGiris ? `
            <div class="mdf-teslim-card">
                <div class="mdf-teslim">
                    <div>
                        <label class="pro-label">Müşteri / alıcı <span class="req-star">★</span></label>
                        <input id="val-afirma" class="pro-input" placeholder="Kime verildi?" style="text-transform:uppercase">
                    </div>
                    <div>
                        <label class="pro-label">Teslim alan</label>
                        <input id="val-teslim-alan" class="pro-input" placeholder="Kişi adı" style="text-transform:uppercase">
                    </div>
                    <div>
                        <label class="pro-label">Araç plaka</label>
                        <input id="val-plaka" class="pro-input" placeholder="34 ABC 123" style="text-transform:uppercase">
                    </div>
                </div>
                <div style="margin-top:8px">
                    <label class="pro-label">Genel not</label>
                    <input id="val-notlar-toplu" class="pro-input" placeholder="İsteğe bağlı — muhasebe fişine yazılır">
                </div>
                <input type="hidden" id="val-teslim-tel">
                <input type="hidden" id="val-sofor">
                <input type="hidden" id="val-teslim-adres">
                <input type="hidden" id="val-irs-toplu">
            </div>
            <div id="kumas-ceki-form-ozet" class="kumas-ceki-form-ozet"></div>` : `
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
            <div class="mamul-toplu-hareket-wrap">
                <div class="kumas-toplu-hareket-head">
                    <span>Stok kodu / ürün</span><span>Ürün</span><span class="is-ana">Metre ★</span><span>Kg</span><span>Not</span><span>Çeki</span><span></span>
                </div>
                <div id="kumas-toplu-hareket-body"></div>
                <div id="kumas-toplu-kod-drop"></div>
                <div id="kumas-toplu-hareket-ozet" class="mamul-toplu-hareket-ozet">0 satır</div>
                <div class="mamul-toplu-hareket-actions">
                    <button type="button" class="btn-pro btn-secondary-pro" style="padding:5px 10px;font-size:11px" onclick="kumasTopluSatirEkle()">+ Satır</button>
                    <button type="button" class="btn-pro btn-secondary-pro" style="padding:5px 10px;font-size:11px" onclick="kumasTopluYapistir()">Excel yapıştır</button>
                    <button type="button" class="btn-pro btn-secondary-pro" style="padding:5px 10px;font-size:11px" onclick="kumasTopluSatirBaslat()">Temizle</button>
                    <span class="mdf-hint">Sipariş no, ürün adı veya müşteri yazın. Stok kodu olmayan siparişler listeden seçilir. Metre zorunlu, kg isteğe bağlıdır.</span>
                </div>
            </div>
        </div>`;
    }
    window.kumasDepoKomutaFormHtml = kumasDepoKomutaFormHtml;

    function kumasDepoKomutaFormMount(grid, notesContainer, isGiris) {
        document.querySelectorAll('body > #kumas-toplu-kod-drop').forEach(d => d.remove());
        try { kumasTopluDropKapat(); } catch (e) {}
        try { window.kumasCekiTopluKapat(); } catch (e) {}
        if (grid) {
            grid.style.cssText = 'display:flex;flex-direction:column;gap:10px;overflow:visible;width:100%';
            grid.innerHTML = kumasDepoKomutaFormHtml(isGiris);
        }
        if (notesContainer) notesContainer.innerHTML = '';
        setTimeout(function () {
            kumasTopluSatirBaslat();
            if (window._kumasTopluHizliKod) {
                kumasTopluKodSatiraYaz(window._kumasTopluHizliKod, 0);
                window._kumasTopluHizliKod = '';
            }
        }, 0);
    }
    window.kumasDepoKomutaFormMount = kumasDepoKomutaFormMount;

    function kumasTopluPayloadOlustur() {
        const rows = window._kumasTopluSatirlar || [];
        const isCikis = typeof movementType !== 'undefined' && movementType === 'ÇIKIŞ';
        const genelNot = String(document.getElementById('val-notlar-toplu')?.value || '').trim();
        const firmaCikis = String(document.getElementById('val-afirma')?.value || '').trim();
        if (isCikis && !firmaCikis) return { err: 'Çıkışta müşteri / alıcı zorunludur.' };
        if (isCikis && typeof muhasebeFisTeslimDogrula === 'function') {
            const teslimErr = muhasebeFisTeslimDogrula();
            if (teslimErr) return { err: teslimErr };
        }
        const payloads = [];
        const hatalar = [];
        rows.forEach((r, i) => {
            const mt = kumasTopluSayi(r.mt);
            const kg = kumasTopluSayi(r.kg);
            const bosSatir = !String(r.query || '').trim() && !r.kod && !r.anahtar && !r.ad && mt <= 0 && kg <= 0 && !(r.ceki && r.ceki.length);
            if (bosSatir) return;
            let src = kumasTopluSatirKaynakBul(r);
            if (!src && r.query) {
                const coz = kumasTopluKodCoz(r.query);
                if (coz.coklu) { hatalar.push(`Satır ${i + 1}: ${coz.hata}`); return; }
                if (coz.hata) { hatalar.push(`Satır ${i + 1}: ${coz.hata}`); return; }
                src = coz.row;
            }
            if (!src) { hatalar.push(`Satır ${i + 1}: ürün seçin (sipariş no, isim veya müşteri ile arayın)`); return; }
            const noKart = !!(src.noKart || src.siparisKaynak || r.noKart || /^SIP-/i.test(String(src.kod || r.kod || '')));
            if (!isCikis && noKart) {
                hatalar.push(`Satır ${i + 1}: kartsız sipariş ürüne depo girişi yapılamaz`);
                return;
            }
            let kod = String(src.kod || r.kod || '').trim();
            if (!kod && noKart) kod = kumasTopluSiparisYerTutucuKod(
                { sno: src.siparis_sno || r.siparis_sno, id: src.siparis_id || r.siparis_id },
                { ad: src.ad || r.ad },
                src.kalem_idx != null ? src.kalem_idx : r.kalem_idx
            );
            if (mt <= 0) { hatalar.push(`Satır ${i + 1}: metre girin`); return; }
            if (Array.isArray(r.ceki) && r.ceki.length) {
                const cekiYarim = r.ceki.some(x => {
                    const m = kumasTopluSayi(x && x.mt);
                    const k = kumasTopluSayi(x && x.kg);
                    return (k > 0 && m <= 0);
                });
                if (cekiYarim) {
                    hatalar.push(`Satır ${i + 1}: çeki listesinde kg girildiyse metre de girin`);
                    return;
                }
            }
            const sign = isCikis ? -1 : 1;
            const cekiOz = kumasCekiOzetHesapla(r.ceki);
            const cekiTxt = cekiOz.top ? `Çeki: ${cekiOz.top} top · ${kumasCekiFmt(cekiOz.mt)} mt · ${kumasCekiFmt(cekiOz.kg)} kg` : '';
            const sidTag = String(src.siparis_id != null ? src.siparis_id : (r.siparis_id || '')).trim();
            const kiTag = parseInt(src.kalem_idx != null ? src.kalem_idx : r.kalem_idx, 10);
            const sno = String(src.siparis_sno || r.siparis_sno || src.lot_no || '').trim();
            const sevkKumasTag = (isCikis && sidTag && Number.isFinite(kiTag) && kiTag >= 0)
                ? `[SEVK_KUMAS:sip=${sidTag}|k=${kiTag}|mt=${mt}|kg=${kg}]`
                : '';
            const sipNot = noKart ? [sno ? `Sipariş ${sno}` : '', 'kartsız kumaş sevk'].filter(Boolean).join(' · ') : '';
            const satirNot = [genelNot, r.not, sipNot, cekiTxt, sevkKumasTag].filter(Boolean).join(' · ');
            let notlarVal = typeof depoNotlarWithBirim === 'function' ? depoNotlarWithBirim('MT', satirNot) : satirNot;
            if (isCikis && typeof depoNotlarWithTeslimDetay === 'function') {
                notlarVal = depoNotlarWithTeslimDetay(
                    notlarVal,
                    typeof muhasebeFisTeslimFormOku === 'function' ? muhasebeFisTeslimFormOku() : null
                );
            }
            if (cekiOz.top) {
                const dolu = kumasCekiDoluListe(r.ceki).map((x, n) => ({ no: n + 1, mt: x.mt, kg: x.kg }));
                notlarVal += `\n[CEKI_TOP:${cekiOz.top}][CEKI_OZET:${cekiOz.top} top · ${kumasCekiFmt(cekiOz.mt)} mt · ${kumasCekiFmt(cekiOz.kg)} kg][CEKI:${JSON.stringify(dolu)}]`;
            }
            payloads.push({
                stok_kodu: kod,
                kumas_cinsi: src.kumas_cinsi || src.ad || '',
                urun_adi: src.ad || src.kumas_cinsi || '',
                lot_no: sno || src.lot_no || '',
                marka: src.marka || src.firma || '',
                renk: src.renk || '',
                miktar_mt: sign * Math.abs(mt),
                miktar_kg: sign * Math.abs(kg),
                cuval_sayisi: sign * (cekiOz.top || 0),
                irsaliye_no: isCikis ? String(document.getElementById('val-irs-toplu')?.value || '').trim() : '',
                cuval_rengi: '',
                araci_firma: String(document.getElementById('val-plaka')?.value || '').trim().toUpperCase(),
                firma: isCikis ? firmaCikis.toUpperCase() : '',
                notlar: notlarVal,
                _ceki: cekiOz.top ? kumasCekiDoluListe(r.ceki) : [],
                siparis_id: sidTag || null,
                kalem_idx: Number.isFinite(kiTag) ? kiTag : null,
                siparis_sno: sno,
                noKart,
                islem_turu: typeof movementType !== 'undefined' ? movementType : (isCikis ? 'ÇIKIŞ' : 'GİRİŞ'),
                kaynak_birim: (typeof depoKaynakBirimImportBelirle === 'function'
                    ? depoKaynakBirimImportBelirle((typeof depoHareketFormGrubu === 'function' ? depoHareketFormGrubu() : 'KUMAS'), kod)
                    : null) || (typeof depoKumasKaynakBirimBelirle === 'function' ? depoKumasKaynakBirimBelirle(kod) : '') || 'DEPO_HAREKET_KUMAS',
                updated_by: String(erpCurrentUser?.display_name || erpCurrentUser?.username || '').trim() || '—',
                islem_gecmisi: `${new Date().toLocaleString('tr-TR')} — Toplu kumaş ${isCikis ? 'çıkış' : 'giriş'} (${mt} mt / ${kg} kg${cekiOz.top ? ' / ' + cekiOz.top + ' top' : ''}${noKart ? ' · kartsız sipariş' : ''})`
            });
        });
        if (!payloads.length && !hatalar.length) return { err: 'En az bir satır girin.' };
        if (hatalar.length) return { err: hatalar.slice(0, 5).join('\n') };
        return { payloads };
    }
    window.kumasTopluPayloadOlustur = kumasTopluPayloadOlustur;

    async function kumasTopluKaydet() {
        if (isSaveInProgress) return;
        const { payloads, err } = kumasTopluPayloadOlustur();
        if (err) { erpToast(err, 'error', 7000); return; }
        const onayMsg = `${payloads.length} satır kumaş ${movementType === 'ÇIKIŞ' ? 'çıkış' : 'giriş'} kaydedilsin mi?`;
        const ok = typeof erpAskConfirm === 'function' ? await erpAskConfirm(onayMsg) : confirm(onayMsg);
        if (!ok) return;
        try { kumasTopluDropKapat(); } catch (e) {}
        isSaveInProgress = true;
        try {
            let insertPayload = payloads.map(x => {
                const r = { ...x };
                delete r._ceki;
                delete r.siparis_id;
                delete r.kalem_idx;
                delete r.siparis_sno;
                delete r.noKart;
                return r;
            });
            const triedCols = new Set();
            let hareketIds = [];
            while (true) {
                const ins = await sb.from('kumas_stok').insert(insertPayload).select('id');
                if (!ins.error) {
                    hareketIds = (ins.data || []).map(r => r.id).filter(Boolean);
                    /* Yerel cache — stok kartı / depo listesi aynı bakiyeyi görsün */
                    if (!Array.isArray(dataCache.kumas_stok)) dataCache.kumas_stok = [];
                    insertPayload.forEach((row, i) => {
                        dataCache.kumas_stok.unshift({ ...row, id: hareketIds[i] || undefined });
                    });
                    if (typeof erpBakiyeIndexInvalidate === 'function') erpBakiyeIndexInvalidate();
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
            let cekiArsiv = false;
            if (movementType === 'ÇIKIŞ' && typeof muhasebeFisKumasCikisKaydet === 'function') {
                try {
                    const fis = await muhasebeFisKumasCikisKaydet({ payloads, hareketIds });
                    if (fis?.fis_no) fisNo = fis.fis_no;
                    cekiArsiv = payloads.some(p => Array.isArray(p._ceki) && p._ceki.length);
                } catch (e) { console.warn('kumaş muhasebe fişi:', e?.message || e); }
            }
            if (typeof erpSyncTablesBackground === 'function') erpSyncTablesBackground(['kumas_stok']);
            else if (typeof syncAllData === 'function') syncAllData(false, { silent: true, light: true, tables: ['kumas_stok'] }).catch(() => {});
            if (movementType === 'ÇIKIŞ' && typeof sevkiyatKumasCikisSiparisYuklemeIsle === 'function') {
                try {
                    const yuk = await sevkiyatKumasCikisSiparisYuklemeIsle(payloads, { kaynak: 'SEVKIYAT_KUMAS' });
                    if (yuk && yuk.ok > 0 && typeof erpToast === 'function') {
                        erpToast(`${yuk.ok} sipariş kaleminde Yükleme (metre/kg) güncellendi.`, 'success', 3500);
                    }
                } catch (e) { console.warn('kumaş→sipariş yükleme', e); }
            }
            erpToast(fisNo
                ? `${payloads.length} kumaş çıkış kaydedildi. Muhasebe fişi ${fisNo} asıldı.${cekiArsiv ? ' Çeki listesi fişe arşivlendi.' : ''}`
                : `${payloads.length} kumaş hareketi kaydedildi.`, 'success', 6000);
            window._kumasTopluSatirlar = [];
            try { kumasTopluDropKapat(); } catch (e) {}
            kumasTopluSatirBaslat();
            if (typeof loadData === 'function') loadData();
            if (typeof erpRestoreKeyboard === 'function') setTimeout(erpRestoreKeyboard, 0);
        } catch (e) {
            erpToast('Toplu kayıt hatası: ' + (e?.message || e), 'error', 7000);
        } finally {
            isSaveInProgress = false;
        }
    }
    window.kumasTopluKaydet = kumasTopluKaydet;

    let kumasStokHizliFiltre = 'POZITIF';
    window.kumasStokHizliFiltre = kumasStokHizliFiltre;
    window.kumasStokHizliFiltreSet = function (filtre) {
        kumasStokHizliFiltre = String(filtre || '').toUpperCase();
        if (!['POZITIF', 'HEPSI', 'KRITIK'].includes(kumasStokHizliFiltre)) kumasStokHizliFiltre = 'POZITIF';
        window.kumasStokHizliFiltre = kumasStokHizliFiltre;
        if (typeof loadData === 'function') loadData();
    };

    function kumasStokHizliKodDoldur(stokKodu) {
        const kod = String(stokKodu || '').trim();
        if (!kod) return;
        if (document.getElementById('kumas-toplu-hareket-body') && typeof kumasTopluKodSatiraYaz === 'function') {
            kumasTopluKodSatiraYaz(kod, 0);
            return;
        }
        const rows = (dataCache.kumas_stok || []).filter(x =>
            typeof kumasStokHareketiKumasDepoMu === 'function'
                ? kumasStokHareketiKumasDepoMu(x) && kumasStokHareketKoduOku(x) === kod.toUpperCase()
                : kumasStokHareketKoduOku(x) === kod.toUpperCase()
        );
        if (!rows.length) return;
        const secim = rows.reduce((acc, x) => {
            acc.stok_kodu = kod;
            acc.kumas_cinsi = acc.kumas_cinsi || x.kumas_cinsi || x.urun_adi || '';
            acc.lot_no = acc.lot_no || x.lot_no || '';
            acc.marka = acc.marka || x.marka || '';
            acc.renk = acc.renk || x.renk || '';
            acc.bakiye = (acc.bakiye || 0) + (parseFloat(x.miktar_kg) || 0);
            acc.bakiye_mt = (acc.bakiye_mt || 0) + (parseFloat(x.miktar_mt) || 0);
            return acc;
        }, { stok_kodu: kod, kumas_cinsi: '', lot_no: '', marka: '', renk: '', bakiye: 0, bakiye_mt: 0 });
        if (typeof kumasSelectItem === 'function') {
            window._kumasSearchData = [secim];
            kumasSelectItem({ getAttribute: () => '0' });
            return;
        }
        const fill = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.value = v || '';
        };
        fill('val-kumas-search', secim.stok_kodu);
        fill('val-stok-kodu', secim.stok_kodu);
        fill('val-cins', secim.kumas_cinsi);
        fill('val-lot', secim.lot_no);
        fill('val-marka', secim.marka);
        fill('val-renk', secim.renk);
    }
    window.kumasStokHizliKodDoldur = kumasStokHizliKodDoldur;

    function kumasStokHizliIslem(tip, stokKodu) {
        const t = tip === 'ÇIKIŞ' ? 'ÇIKIŞ' : 'GİRİŞ';
        window._kumasTopluHizliKod = String(stokKodu || '').trim();
        if (typeof movementType !== 'undefined') movementType = t;
        if (typeof depoKomutaHedef !== 'undefined') depoKomutaHedef = 'KUMAS';
        if (typeof appMode !== 'undefined') appMode = 'DEPO_HAREKET';
        try { document.body.setAttribute('data-erp-mode', 'DEPO_HAREKET'); } catch (e) {}
        if (typeof saveUiState === 'function') saveUiState({ appMode: 'DEPO_HAREKET' });
        const titleEl = document.getElementById('current-title');
        if (titleEl) titleEl.innerText = 'Depo Giriş Çıkış';
        if (typeof depoKomutaHizliBaslat === 'function') {
            depoKomutaHizliBaslat('KUMAS', t);
        } else {
            if (typeof renderInputs === 'function') renderInputs();
            if (typeof loadData === 'function') loadData();
        }
        if (stokKodu) setTimeout(() => kumasStokHizliKodDoldur(stokKodu), 0);
    }
    window.kumasStokHizliIslem = kumasStokHizliIslem;

    function kumasStokHareketlereGit() {
        if (typeof depoDefterKanalFiltrele === 'function') {
            depoDefterKanalFiltrele('KUMAS');
            return;
        }
        if (typeof depoHareketDefterGrup !== 'undefined') depoHareketDefterGrup = 'KUMAS';
        if (typeof setAppMode === 'function') setAppMode('DEPO_HAREKET_LISTE');
    }
    window.kumasStokHareketlereGit = kumasStokHareketlereGit;

    function kumasAnaGrupNorm(v) {
        const s = String(v || '').trim();
        if (!s || s === '—' || s === '-') return '';
        const u = s.toLocaleUpperCase('tr-TR')
            .replace(/İ/g, 'I').replace(/İ/g, 'I')
            .replace(/Ş/g, 'S').replace(/Ğ/g, 'G')
            .replace(/Ü/g, 'U').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
            .replace(/_/g, ' ')
            .replace(/\s+/g, ' ');
        if (u === 'MAMUL') return '';
        if (u.includes('GIDA')) return 'GIDACI';
        if (u.includes('HALI')) return 'HALICI';
        if ((u.includes('EV') && u.includes('TEKSTIL')) || u === 'EV') return 'EV_TEKSTILI';
        if (u === 'NUMUNE') return 'NUMUNE';
        return '';
    }
    function kumasAnaGrupEtiket(v) {
        const k = kumasAnaGrupNorm(v);
        if (k === 'EV_TEKSTILI') return 'Ev Tekstili';
        if (k === 'GIDACI') return 'Gıdacı';
        if (k === 'HALICI') return 'Halıcı';
        if (k === 'NUMUNE') return 'Numune';
        const s = String(v || '').trim();
        if (!s || s === '—' || s.toUpperCase() === 'MAMUL') return '';
        return s;
    }
    window.kumasAnaGrupEtiket = kumasAnaGrupEtiket;

    function kumasKartAnaGrupHam(kart) {
        if (!kart) return '';
        if (typeof kumasKutuphanesiKartiMamulMu === 'function' && kumasKutuphanesiKartiMamulMu(kart)) return '';
        const fromAlan = typeof kumasAlan === 'function' ? kumasAlan(kart, 'ana_grup', '') : '';
        const raw = String(fromAlan || kart.ana_grup || kart.urun_grubu || '').trim();
        if (raw && raw.toUpperCase() !== 'MAMUL') return raw;
        return 'EV TEKSTİLİ';
    }
    window.kumasKartAnaGrupHam = kumasKartAnaGrupHam;

    function kumasStokListeAnaGrup(g) {
        const kart = typeof kumasStokListeVaryantKartBul === 'function'
            ? kumasStokListeVaryantKartBul(g?.stok_kodu)
            : (typeof kumasKutuphanesiKartBul === 'function' ? kumasKutuphanesiKartBul(g?.stok_kodu) : null);
        const ham = kumasKartAnaGrupHam(kart) || g?.ana_grup || g?.urun_grubu || '';
        return kumasAnaGrupEtiket(ham) || 'Ev Tekstili';
    }
    window.kumasStokListeAnaGrup = kumasStokListeAnaGrup;

    function kumasStokListeTerbiyeTur(g) {
        const recs = [];
        const kod = String(g?.stok_kodu || g?.desen_kodu || '').trim();
        if (typeof kumasStokListeVaryantKartBul === 'function' && kod) {
            const vk = kumasStokListeVaryantKartBul(kod);
            if (vk) recs.push(vk);
        } else if (typeof kumasKutuphanesiKartBul === 'function' && kod) {
            const kart = kumasKutuphanesiKartBul(kod);
            if (kart) recs.push(kart);
        }
        if (g) recs.push(g);
        for (let i = 0; i < recs.length; i++) {
            if (typeof kumasKartTerbiyeOku === 'function') {
                const v = kumasKartTerbiyeOku(recs[i]);
                if (v) return v;
            }
            if (typeof kumasAlan === 'function') {
                const v = kumasAlan(recs[i], 'terbiye', '');
                if (v != null && String(v).trim()) return String(v).trim();
            }
        }
        return '';
    }
    window.kumasStokListeTerbiyeTur = kumasStokListeTerbiyeTur;

    function kumasStokGrupOzeti(grps) {
        const map = {};
        (grps || []).forEach(g => {
            const key = kumasStokListeAnaGrup(g) || String(g.ana_grup || '').trim();
            if (!key || key === '—' || key === '-') return;
            if (!map[key]) map[key] = { ad: key, kg: 0, mt: 0 };
            map[key].kg += parseFloat(g.net_kg) || 0;
            map[key].mt += parseFloat(g.net_mt) || 0;
        });
        return Object.values(map).sort((a, b) => b.mt - a.mt || b.kg - a.kg || a.ad.localeCompare(b.ad, 'tr'));
    }
    window.kumasStokGrupOzeti = kumasStokGrupOzeti;

    function kumasStokListeMetinEslesir(g, s) {
        const tek = typeof kumasKartTeknikDetay === 'function'
            ? kumasKartTeknikDetay((typeof kumasKutuphanesiKartBul === 'function' ? kumasKutuphanesiKartBul(g?.stok_kodu) : null) || g)
            : {};
        const blob = [
            g.stok_kodu, g.urun_adi, g.urun_grubu, g.ana_grup,
            (typeof kumasStokListeAnaGrup === 'function' ? kumasStokListeAnaGrup(g) : ''),
            g.kumas_cinsi, g.firma, g.marka,
            (typeof kumasStokListeTerbiyeTur === 'function' ? kumasStokListeTerbiyeTur(g) : ''),
            (typeof kumasStokListeRenkOku === 'function' ? kumasStokListeRenkOku(g) : ''),
            (typeof kumasStokListeRenkKoduOku === 'function' ? kumasStokListeRenkKoduOku(g) : ''),
            tek.tarak_eni, tek.atki_sikligi, tek.cozgu_sikligi, tek.atki_ipi, tek.cozgu_ipi
        ].join(' ').toLowerCase();
        return !s || blob.includes(s);
    }

    function kumasStokListeFiltreliGruplar(hamGrps, s, filtre, ekFiltre) {
        let grps = (hamGrps || []).filter(g => kumasStokListeMetinEslesir(g, s));
        if (ekFiltre && typeof window.stokGrupFiltreEslesir === 'function') {
            grps = grps.filter(g => window.stokGrupFiltreEslesir(g, ekFiltre));
        }
        const sayac = {
            hepsi: grps.length,
            pozitif: grps.filter(g => (parseFloat(g.net_kg) || 0) > 0 || (parseFloat(g.net_mt) || 0) > 0).length,
            kritik: grps.filter(g => (parseFloat(g.net_kg) || 0) <= 0 && (parseFloat(g.net_mt) || 0) <= 0).length
        };
        const f = filtre || 'POZITIF';
        if (f === 'POZITIF') grps = grps.filter(g => (parseFloat(g.net_kg) || 0) > 0 || (parseFloat(g.net_mt) || 0) > 0);
        else if (f === 'KRITIK') grps = grps.filter(g => (parseFloat(g.net_kg) || 0) <= 0 && (parseFloat(g.net_mt) || 0) <= 0);
        const topNet = grps.reduce((a, g) => a + (parseFloat(g.net_kg) || 0), 0);
        const topNetMt = grps.reduce((a, g) => a + (parseFloat(g.net_mt) || 0), 0);
        return { grps, sayac, topNet, topNetMt, filtre: f };
    }
    window.kumasStokListeFiltreliGruplar = kumasStokListeFiltreliGruplar;

    function kumasStokListeOzetDomGuncelle(ozet) {
        ozet = ozet || {};
        const netMt = Number(ozet.netMt || 0);
        const netKg = Number(ozet.netKg || 0);
        const hero = document.getElementById('kumas-stok-hero-mt');
        const heroKg = document.getElementById('kumas-stok-hero-kg');
        const sub = document.getElementById('kumas-stok-sub');
        if (hero) {
            hero.classList.toggle('is-neg', netMt < 0);
            hero.innerHTML = `${netMt.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}<span>mt</span>`;
        }
        if (heroKg) {
            heroKg.classList.toggle('is-neg', netKg < 0);
            heroKg.innerHTML = `${netKg.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}<span>kg</span>`;
        }
        if (sub) {
            const n = Array.isArray(window._kumasGroups) ? window._kumasGroups.length : 0;
            sub.textContent = String(n);
        }
    }
    window.kumasStokListeOzetDomGuncelle = kumasStokListeOzetDomGuncelle;

    window.kumasStokListeGovdeGuncelle = function () {
        if (typeof loadData === 'function') loadData({ kumasBodyOnly: true });
    };

    function kumasStokListeDynamicHtml(grps, ozet, opts) {
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
        const filtre = ozet.filtre || (window.kumasStokHizliFiltre || 'POZITIF');
        const rowFn = opts.rowFn || 'showKumasGroupDetail';
        const desk = !!opts.masaustu;
        const grupOzet = kumasStokGrupOzeti(grps);
        let html = '';
        if (grupOzet.length) {
            html += `<div class="ms-grup-ozet">${grupOzet.map(x =>
                `<span class="ms-grup-ozet-item"><b>${Number(x.mt).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} mt</b> ${esc(x.ad)}</span>`
            ).join('')}</div>`;
        }
        html += `<div class="ms-list">`;
        if (!(grps || []).length) {
            html += `<div class="ms-empty">${filtre === 'POZITIF' ? 'Stokta kumaş yok.' : 'Bu listede kumaş yok.'}</div></div>`;
            return html;
        }
        if (desk) {
            html += `<div class="ms-table-wrap"><table class="ms-table">
                <thead><tr>
                    <th>Ana grup</th><th>Stok kodu</th><th>Ürün</th><th>Kumaş cinsi</th><th>Terbiye türü</th><th>Renk</th><th>Renk kodu</th>
                    <th>Tarak eni</th><th>Atkı sıklığı</th><th>Çözgü sıklığı</th><th>Atkı ipi</th><th>Çözgü ipi</th>
                    <th class="num">Stok</th>
                </tr></thead><tbody>`;
            html += grps.map((g, idx) => {
                const kod = String(g.stok_kodu || '').trim();
                const mt = Number(g.net_mt || 0);
                const qtyCls = mt < 0 ? ' is-neg' : (mt === 0 ? ' is-zero' : '');
                const terbiye = kumasStokListeTerbiyeTur(g);
                const renk = kumasStokListeRenkOku(g);
                const renkKodu = kumasStokListeRenkKoduOku(g);
                const tek = {
                    tarak_eni: g.tarak_eni,
                    atki_sikligi: g.atki_sikligi,
                    cozgu_sikligi: g.cozgu_sikligi,
                    atki_ipi: g.atki_ipi,
                    cozgu_ipi: g.cozgu_ipi
                };
                const kartTek = kumasKartTeknikDetay(kumasStokListeVaryantKartBul(kod) || kumasKutuphanesiKartBul(kod) || g);
                if (!tek.tarak_eni) tek.tarak_eni = kartTek.tarak_eni;
                if (!tek.atki_sikligi) tek.atki_sikligi = kartTek.atki_sikligi;
                if (!tek.cozgu_sikligi) tek.cozgu_sikligi = kartTek.cozgu_sikligi;
                if (!tek.atki_ipi) tek.atki_ipi = kartTek.atki_ipi;
                if (!tek.cozgu_ipi) tek.cozgu_ipi = kartTek.cozgu_ipi;
                return `<tr onclick="${rowFn}(${idx})">
                    <td class="ms-grup">${esc(kumasStokListeAnaGrup(g))}</td>
                    <td class="ms-kod">${esc(kod)}</td>
                    <td><div class="ms-name">${esc((typeof stokKartListeAdMetni === 'function' ? stokKartListeAdMetni(kumasStokListeVaryantKartBul(kod) || kumasKutuphanesiKartBul(kod) || g, g.kumas_cinsi || '—') : (g.urun_adi || g.kumas_cinsi || '—')))}</div></td>
                    <td class="ms-ozellik">${esc(g.kumas_cinsi || '—')}</td>
                    <td class="ms-ozellik">${esc(terbiye || '—')}</td>
                    <td class="ms-ozellik">${esc(renk || '—')}</td>
                    <td class="ms-ozellik">${esc(renkKodu || '—')}</td>
                    <td class="ms-teknik">${esc(tek.tarak_eni || '—')}</td>
                    <td class="ms-teknik">${esc(tek.atki_sikligi || '—')}</td>
                    <td class="ms-teknik">${esc(tek.cozgu_sikligi || '—')}</td>
                    <td class="ms-teknik">${esc(tek.atki_ipi || '—')}</td>
                    <td class="ms-teknik">${esc(tek.cozgu_ipi || '—')}</td>
                    <td class="num"><span class="ms-qty${qtyCls}">${mt.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}<em>mt</em></span></td>
                </tr>`;
            }).join('');
            html += `</tbody></table></div></div>`;
            return html;
        }
        html += grps.map((g, idx) => {
            const kod = String(g.stok_kodu || '').trim();
            const mt = Number(g.net_mt || 0);
            const kart = kumasStokListeVaryantKartBul(kod) || kumasKutuphanesiKartBul(kod) || g;
            const dok = typeof kumasDokumaAlanlariOku === 'function' ? kumasDokumaAlanlariOku(kart) : {};
            const tek = kumasKartTeknikDetay(kart);
            const desenAdi = String(dok.desen_adi || kart.desen_adi || g.desen_adi || '').trim();
            const urunAdi = String(dok.urun_adi || kart.urun_adi || g.urun_adi || '').trim();
            const cins = String(dok.kumas_cinsi || g.kumas_cinsi || '').trim();
            const adKaynak = { ...kart, desen_adi: desenAdi, urun_adi: urunAdi };
            let baslik = typeof stokKartListeAdMetni === 'function'
                ? String(stokKartListeAdMetni(adKaynak, '') || '').trim()
                : '';
            if (!baslik || baslik === 'ADSİZ') {
                const parca = [];
                [desenAdi, urunAdi || cins].forEach(p => {
                    const t = String(p || '').trim();
                    if (!t) return;
                    if (!parca.some(x => x.toLocaleLowerCase('tr-TR') === t.toLocaleLowerCase('tr-TR'))) parca.push(t);
                });
                baslik = parca.join(' · ') || cins || kod || '—';
            }
            const grup = kumasStokListeAnaGrup(g);
            const metaParca = [];
            if (cins && !baslik.toLocaleLowerCase('tr-TR').includes(cins.toLocaleLowerCase('tr-TR'))) metaParca.push(cins);
            metaParca.push(kumasKartTeknikSatir(tek));
            const meta = metaParca.filter(Boolean).join(' · ');
            const qtyCls = mt < 0 ? ' is-neg' : (mt === 0 ? ' is-zero' : '');
            return `<article class="ms-row">
                <button type="button" class="ms-row-main" onclick="${rowFn}(${idx})">
                    <div class="ms-row-top">
                        ${grup ? `<span class="ms-chip">${esc(grup)}</span>` : ''}
                        ${kod ? `<span class="ms-kod-pill">${esc(kod)}</span>` : ''}
                    </div>
                    <div class="ms-name">${esc(baslik)}</div>
                    ${meta ? `<div class="ms-meta">${esc(meta)}</div>` : ''}
                </button>
                <div class="ms-qty${qtyCls}">${mt.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}<em>mt</em></div>
            </article>`;
        }).join('');
        html += `</div>`;
        return html;
    }
    window.kumasStokListeDynamicHtml = kumasStokListeDynamicHtml;

    function kumasStokListeEkranHtml(grps, ozet, opts) {
        opts = opts || {};
        ozet = ozet || {};
        const esc = (s) => {
            if (typeof pdfEsc === 'function') return pdfEsc(s);
            return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        };
        const filtre = ozet.filtre || (window.kumasStokHizliFiltre || 'POZITIF');
        const sayac = ozet.sayac || {};
        const netMt = Number(ozet.netMt || 0);
        const netKg = Number(ozet.netKg || 0);
        const desk = !!opts.masaustu;
        const filtreObj = opts.filtreObj || ozet.filtreObj || (typeof kumasStokListeFiltre !== 'undefined' ? kumasStokListeFiltre : { q: '', tip: 'HEPSİ', bas: '', bit: '' });
        const filtreBar = typeof stokListeFiltreBarHtml === 'function'
            ? stokListeFiltreBarHtml({
                prefix: 'kumas-stok-f',
                filtre: filtreObj,
                araPlaceholder: 'Ürün, stok kodu, kumaş cinsi, terbiye, ana grup, firma…',
                onChangeFn: 'kumasStokListeFiltreYenile',
                onResetFn: 'kumasStokListeFiltreleriSifirla',
                debounceKey: 'kumas-stok-f-ara'
            })
            : '';
        const seg = (id, label, n) =>
            `<button type="button" class="ms-seg-btn${filtre === id ? ' is-on' : ''}" onclick="kumasStokHizliFiltreSet('${id}')">${label}${n != null ? ` <b>${n}</b>` : ''}</button>`;
        return depoStokShellHtml({
            shellId: 'kumas-stok-shell',
            variant: 'kumas',
            masaustu: desk,
            icon: '🏁',
            title: 'Kumaş Stoğu',
            desc: 'Ham kumaş depo bakiyesi · mt / kg',
            metrics: [
                { id: 'kumas-stok-hero-mt', val: netMt.toLocaleString('tr-TR', { maximumFractionDigits: 1 }), unit: 'mt', lbl: 'Toplam metraj', primary: true, neg: netMt < 0 },
                { id: 'kumas-stok-hero-kg', val: netKg.toLocaleString('tr-TR', { maximumFractionDigits: 1 }), unit: 'kg', lbl: 'Toplam ağırlık', primary: false, neg: netKg < 0 },
                { id: 'kumas-stok-sub', val: String((grps || []).length), lbl: 'Ürün kalemi', primary: false }
            ],
            segHtml: `${seg('POZITIF', 'Stokta', sayac.pozitif)}${seg('HEPSI', 'Tümü', sayac.hepsi)}${seg('KRITIK', 'Tükendi', sayac.kritik)}`,
            toolsHtml: `
                <button type="button" class="ms-btn ms-btn-giris" onclick="kumasStokHizliIslem('GİRİŞ')">Stok girişi</button>
                <button type="button" class="ms-btn ms-btn-sevk" onclick="kumasStokHizliIslem('ÇIKIŞ')">Sevkiyat</button>
                <button type="button" class="ms-btn ms-btn-ghost" onclick="kumasStokHareketlereGit()">Hareketler</button>
                <button type="button" class="ms-btn ms-btn-ghost" onclick="kumasStokExcelIndir()">Excel</button>`,
            filtreBar,
            dynamicId: 'kumas-stok-dynamic',
            dynamicHtml: kumasStokListeDynamicHtml(grps, ozet, opts)
        });
    }
    window.kumasStokListeEkranHtml = kumasStokListeEkranHtml;

    function kumasExcelKartDeger(kart, key) {
        if (!kart) return '';
        if (typeof kumasAlan === 'function') {
            const v = kumasAlan(kart, key, '');
            if (v !== undefined && v !== null && String(v).trim() !== '') return v;
        }
        const v = kart[key];
        return v == null ? '' : v;
    }

    function kumasExcelSayi(v) {
        if (v == null || v === '') return null;
        const n = parseFloat(String(v).replace(',', '.').replace(/\s/g, ''));
        return Number.isFinite(n) ? n : null;
    }

    function kumasExcelTarih(ts) {
        if (!ts) return '';
        const d = ts instanceof Date ? ts : new Date(ts);
        if (isNaN(d.getTime())) return '';
        return d;
    }

    window.kumasStokExcelIndir = async function () {
        if (typeof kumasStokKodCiftleriVarMi === 'function' && kumasStokKodCiftleriVarMi()
            && typeof kumasStokKodNormalizeTemizle === 'function') {
            try {
                await kumasStokKodNormalizeTemizle({ silent: true });
                if (typeof loadData === 'function') loadData({ kumasBodyOnly: true });
                await new Promise(r => setTimeout(r, 80));
            } catch (e) {}
        }
        let grps = Array.isArray(window._kumasGroups) ? window._kumasGroups : [];
        if (!grps.length && typeof kumasStokListeGruplariOlustur === 'function') {
            const fabricData = (typeof dataCache !== 'undefined' ? (dataCache.kumas_stok || []) : [])
                .filter(x => typeof kumasStokHareketiKumasDepoMu !== 'function' || kumasStokHareketiKumasDepoMu(x));
            grps = kumasStokListeGruplariOlustur(fabricData);
        }
        if (!grps.length) {
            if (typeof erpToast === 'function') erpToast('İndirilecek kumaş stoğu yok.', 'warn');
            return;
        }
        if (typeof ExcelJS === 'undefined' && typeof XLSX === 'undefined') {
            if (typeof erpToast === 'function') erpToast('Excel kütüphanesi yüklenemedi.', 'error');
            return;
        }
        if (typeof sb !== 'undefined' && sb) {
            try {
                if (typeof erpToast === 'function') erpToast('Stok kartları Excel için yükleniyor…', 'info', 2500);
                const { data, error } = await sb.from('kumas_kutuphanesi').select('*').limit(8000);
                if (!error && Array.isArray(data) && data.length && typeof dataCache !== 'undefined') {
                    const map = new Map((dataCache.kumas_kutuphanesi || []).map(x => [String(x.id || x.desen_kodu || ''), x]));
                    data.forEach(row => {
                        const key = String(row.id || row.desen_kodu || '');
                        if (!key) return;
                        const prev = map.get(key) || {};
                        if (Object.prototype.hasOwnProperty.call(prev, '_kumas_meta_cache')) delete prev._kumas_meta_cache;
                        map.set(key, { ...prev, ...row });
                    });
                    dataCache.kumas_kutuphanesi = Array.from(map.values());
                }
            } catch (e) {}
        }
        const kolonlar = [
            { key: 'stok_kodu', baslik: 'Stok kodu', bolum: 'Kimlik', w: 14 },
            { key: 'ana_grup', baslik: 'Ana grup', bolum: 'Kimlik', w: 14 },
            { key: 'desen_adi', baslik: 'Desen adı', bolum: 'Kimlik', w: 22 },
            { key: 'firma', baslik: 'Müşteri / firma', bolum: 'Kimlik', w: 22 },
            { key: 'kumas_cinsi', baslik: 'Kumaş cinsi', bolum: 'Kimlik', w: 16 },
            { key: 'urun_adi', baslik: 'Ürün adı / tipi', bolum: 'Kimlik', w: 20 },
            { key: 'kalite', baslik: 'Durum', bolum: 'Kimlik', w: 10 },
            { key: 'tarak_no', baslik: 'Tarak no', bolum: 'Teknik konstrüksiyon', w: 12 },
            { key: 'tarak_eni', baslik: 'Tarak eni (cm)', bolum: 'Teknik konstrüksiyon', w: 14 },
            { key: 'atki_sikligi', baslik: 'Atkı sıklığı', bolum: 'Teknik konstrüksiyon', w: 13 },
            { key: 'cozgu_sikligi', baslik: 'Çözgü sıklığı', bolum: 'Teknik konstrüksiyon', w: 13 },
            { key: 'cozgu_no', baslik: 'Çözgü no', bolum: 'Teknik konstrüksiyon', w: 12 },
            { key: 'cozgu_cinsi', baslik: 'Çözgü cinsi', bolum: 'Teknik konstrüksiyon', w: 16 },
            { key: 'atki_renkleri', baslik: 'Atkı iplik reçetesi', bolum: 'Teknik konstrüksiyon', w: 36 },
            { key: 'ham_en', baslik: 'Ham en (cm)', bolum: 'Ham analizi', w: 13 },
            { key: 'ham_boy', baslik: 'Ham boy (mt)', bolum: 'Ham analizi', w: 13 },
            { key: 'ham_gramaj', baslik: 'Ham gr/m', bolum: 'Ham analizi', w: 12 },
            { key: 'ham_gsm', baslik: 'Ham GSM', bolum: 'Ham analizi', w: 12 },
            { key: 'mamul_en', baslik: 'Mamül en (cm)', bolum: 'Mamül analizi', w: 14 },
            { key: 'mamul_boy', baslik: 'Mamül boy (mt)', bolum: 'Mamül analizi', w: 14 },
            { key: 'mamul_gramaj', baslik: 'Mamül gr/m', bolum: 'Mamül analizi', w: 12 },
            { key: 'mamul_gsm', baslik: 'Mamül GSM', bolum: 'Mamül analizi', w: 12 },
            { key: 'terbiye', baslik: 'Terbiye türü', bolum: 'Terbiye & finiş', w: 18 },
            { key: 'boya_not', baslik: 'Boya / baskı notu', bolum: 'Terbiye & finiş', w: 22 },
            { key: 'cekme', baslik: 'Çekme payı (%)', bolum: 'Terbiye & finiş', w: 14 },
            { key: 'notlar', baslik: 'Teknik not', bolum: 'Terbiye & finiş', w: 28 },
            { key: 'stok_mt', baslik: 'Stok mt', bolum: 'Stok', w: 12 },
            { key: 'stok_kg', baslik: 'Stok kg', bolum: 'Stok', w: 12 },
            { key: 'top_sayisi', baslik: 'Top', bolum: 'Stok', w: 8 },
            { key: 'son_hareket', baslik: 'Son hareket', bolum: 'Stok', w: 14 },
            { key: 'son_giris', baslik: 'Son giriş', bolum: 'Stok', w: 14 },
            { key: 'son_cikis', baslik: 'Son çıkış', bolum: 'Stok', w: 14 }
        ];
        const satirlar = grps.map(g => {
            const kod = String(g.stok_kodu || '').trim();
            const kart = (typeof kumasKutuphanesiKartBul === 'function' ? kumasKutuphanesiKartBul(kod) : null) || {};
            const tek = typeof kumasKartTeknikDetay === 'function' ? kumasKartTeknikDetay(kart) : {};
            const notlar = typeof kumasNotlarTemizle === 'function'
                ? kumasNotlarTemizle(kumasExcelKartDeger(kart, 'notlar'))
                : kumasExcelKartDeger(kart, 'notlar');
            const sonTs = Math.max(g.son_giris_at || 0, g.son_cikis_at || 0);
            return {
                stok_kodu: kod,
                ana_grup: (typeof kumasStokListeAnaGrup === 'function' ? kumasStokListeAnaGrup(g) : '') || kumasExcelKartDeger(kart, 'ana_grup'),
                desen_adi: kumasExcelKartDeger(kart, 'desen_adi') || g.urun_adi || '',
                firma: kumasExcelKartDeger(kart, 'firma') || g.firma || '',
                kumas_cinsi: kumasExcelKartDeger(kart, 'kumas_cinsi') || g.kumas_cinsi || '',
                urun_adi: kumasExcelKartDeger(kart, 'urun_adi') || '',
                kalite: kumasExcelKartDeger(kart, 'kalite') || 'AKTİF',
                tarak_no: kumasExcelKartDeger(kart, 'tarak_no'),
                tarak_eni: kumasExcelKartDeger(kart, 'tarak_eni') || tek.tarak_eni || g.tarak_eni || '',
                atki_sikligi: kumasExcelKartDeger(kart, 'atki_sikligi') || tek.atki_sikligi || g.atki_sikligi || '',
                cozgu_sikligi: kumasExcelKartDeger(kart, 'cozgu_sikligi') || tek.cozgu_sikligi || g.cozgu_sikligi || '',
                cozgu_no: kumasExcelKartDeger(kart, 'cozgu_no'),
                cozgu_cinsi: kumasExcelKartDeger(kart, 'cozgu_cinsi'),
                atki_renkleri: kumasExcelKartDeger(kart, 'atki_renkleri') || tek.atki_ipi || g.atki_ipi || '',
                ham_en: kumasExcelKartDeger(kart, 'ham_en'),
                ham_boy: kumasExcelKartDeger(kart, 'ham_boy'),
                ham_gramaj: kumasExcelKartDeger(kart, 'ham_gramaj'),
                ham_gsm: kumasExcelKartDeger(kart, 'ham_gsm'),
                mamul_en: kumasExcelKartDeger(kart, 'mamul_en'),
                mamul_boy: kumasExcelKartDeger(kart, 'mamul_boy'),
                mamul_gramaj: kumasExcelKartDeger(kart, 'mamul_gramaj'),
                mamul_gsm: kumasExcelKartDeger(kart, 'mamul_gsm'),
                terbiye: kumasExcelKartDeger(kart, 'terbiye'),
                boya_not: kumasExcelKartDeger(kart, 'boya_not'),
                cekme: kumasExcelKartDeger(kart, 'cekme'),
                notlar,
                stok_mt: Number(g.net_mt || 0),
                stok_kg: Number(g.net_kg || 0),
                top_sayisi: Math.abs(parseInt(g.top_sayisi, 10) || 0),
                son_hareket: kumasExcelTarih(sonTs),
                son_giris: kumasExcelTarih(g.son_giris_at),
                son_cikis: kumasExcelTarih(g.son_cikis_at)
            };
        });
        const topMt = satirlar.reduce((s, r) => s + (Number(r.stok_mt) || 0), 0);
        const topKg = satirlar.reduce((s, r) => s + (Number(r.stok_kg) || 0), 0);
        const tarih = new Date();
        const dosya = `Kumas_Stok_Formu_${tarih.toISOString().slice(0, 10)}.xlsx`;
        const sayiKeys = new Set(['ham_en', 'ham_boy', 'ham_gramaj', 'ham_gsm', 'mamul_en', 'mamul_boy', 'mamul_gramaj', 'mamul_gsm', 'cekme', 'stok_mt', 'stok_kg', 'top_sayisi']);
        const tarihKeys = new Set(['son_hareket', 'son_giris', 'son_cikis']);

        if (typeof ExcelJS !== 'undefined') {
            const wb = new ExcelJS.Workbook();
            wb.creator = 'Simteks ERP';
            wb.created = tarih;
            const ws = wb.addWorksheet('Kumaş Stoğu', {
                views: [{ state: 'frozen', ySplit: 5, xSplit: 1, showGridLines: false }],
                pageSetup: {
                    orientation: 'landscape',
                    fitToPage: true,
                    fitToWidth: 1,
                    fitToHeight: 0,
                    paperSize: 8,
                    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
                }
            });
            ws.columns = kolonlar.map(k => ({ key: k.key, width: k.w }));
            const lastCol = kolonlar.length;
            const bolumRenk = {
                'Kimlik': '1E3A5F',
                'Teknik konstrüksiyon': '14532D',
                'Ham analizi': '9A3412',
                'Mamül analizi': '1E3A8A',
                'Terbiye & finiş': '6B21A8',
                'Stok': '0F766E'
            };
            ws.mergeCells(1, 1, 1, lastCol);
            const t1 = ws.getRow(1);
            t1.getCell(1).value = 'KUMAŞ STOK FORMU';
            t1.getCell(1).font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            t1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
            t1.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
            t1.height = 28;
            for (let c = 2; c <= lastCol; c++) {
                t1.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
            }
            ws.mergeCells(2, 1, 2, lastCol);
            const t2 = ws.getRow(2);
            t2.getCell(1).value = `${tarih.toLocaleString('tr-TR')}  ·  ${satirlar.length} ürün  ·  ${topMt.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} mt  ·  ${topKg.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kg  ·  Stok kartındaki tüm kimlik, teknik, analiz ve terbiye alanları`;
            t2.getCell(1).font = { name: 'Calibri', size: 10, color: { argb: 'FFCBD5E1' } };
            t2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
            t2.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
            t2.height = 20;
            for (let c = 2; c <= lastCol; c++) {
                t2.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
            }
            const bolumRow = ws.getRow(4);
            bolumRow.height = 18;
            let i = 0;
            while (i < kolonlar.length) {
                const bolum = kolonlar[i].bolum;
                let j = i;
                while (j < kolonlar.length && kolonlar[j].bolum === bolum) j++;
                const renk = bolumRenk[bolum] || '334155';
                if (j - 1 > i) ws.mergeCells(4, i + 1, 4, j);
                const cell = bolumRow.getCell(i + 1);
                cell.value = bolum.toLocaleUpperCase('tr-TR');
                cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + renk } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                for (let c = i + 1; c <= j; c++) {
                    bolumRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + renk } };
                    bolumRow.getCell(c).font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
                    bolumRow.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' };
                }
                i = j;
            }
            const head = ws.getRow(5);
            head.height = 22;
            kolonlar.forEach((k, idx) => {
                const cell = head.getCell(idx + 1);
                cell.value = k.baslik;
                cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF0F172A' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
                    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    bottom: { style: 'thin', color: { argb: 'FF64748B' } },
                    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                };
            });
            satirlar.forEach((row, ri) => {
                const excelRow = ws.getRow(6 + ri);
                excelRow.height = 18;
                kolonlar.forEach((k, idx) => {
                    const cell = excelRow.getCell(idx + 1);
                    const val = row[k.key];
                    if (tarihKeys.has(k.key)) {
                        if (val instanceof Date) {
                            cell.value = val;
                            cell.numFmt = 'dd.mm.yyyy';
                        } else cell.value = '';
                    } else if (sayiKeys.has(k.key)) {
                        const n = kumasExcelSayi(val);
                        cell.value = n == null ? null : n;
                        cell.numFmt = (k.key === 'top_sayisi') ? '0' : '#,##0.00';
                    } else {
                        cell.value = val == null ? '' : String(val);
                    }
                    cell.font = { name: 'Calibri', size: 9, color: { argb: 'FF0F172A' } };
                    cell.alignment = { vertical: 'middle', horizontal: sayiKeys.has(k.key) ? 'right' : 'left', wrapText: k.key === 'atki_renkleri' || k.key === 'notlar' };
                    cell.border = {
                        top: { style: 'hair', color: { argb: 'FFE2E8F0' } },
                        left: { style: 'hair', color: { argb: 'FFE2E8F0' } },
                        bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
                        right: { style: 'hair', color: { argb: 'FFE2E8F0' } }
                    };
                    if (ri % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                });
            });
            const tot = ws.getRow(6 + satirlar.length);
            tot.getCell(1).value = 'TOPLAM';
            tot.getCell(1).font = { name: 'Calibri', size: 10, bold: true };
            const mtIdx = kolonlar.findIndex(k => k.key === 'stok_mt') + 1;
            const kgIdx = kolonlar.findIndex(k => k.key === 'stok_kg') + 1;
            tot.getCell(mtIdx).value = topMt;
            tot.getCell(kgIdx).value = topKg;
            tot.getCell(mtIdx).numFmt = '#,##0.00';
            tot.getCell(kgIdx).numFmt = '#,##0.00';
            tot.getCell(mtIdx).font = { name: 'Calibri', size: 10, bold: true };
            tot.getCell(kgIdx).font = { name: 'Calibri', size: 10, bold: true };
            tot.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
            ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: lastCol } };
            ws.headerFooter = { oddHeader: '&LKumaş Stok Formu', oddFooter: '&LSimteks ERP&C&P / &N&R' + tarih.toLocaleDateString('tr-TR') };
            const buf = await wb.xlsx.writeBuffer();
            const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = dosya;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 2500);
            if (typeof erpToast === 'function') erpToast('Kumaş stok formu Excel indirildi.', 'success', 4000);
            return;
        }

        const aoa = [
            ['KUMAŞ STOK FORMU'],
            [`${tarih.toLocaleString('tr-TR')} · ${satirlar.length} ürün · ${topMt.toLocaleString('tr-TR')} mt · ${topKg.toLocaleString('tr-TR')} kg`],
            [],
            kolonlar.map(k => k.bolum),
            kolonlar.map(k => k.baslik),
            ...satirlar.map(row => kolonlar.map(k => {
                const val = row[k.key];
                if (val instanceof Date) return val.toLocaleDateString('tr-TR');
                if (sayiKeys.has(k.key)) return kumasExcelSayi(val);
                return val == null ? '' : val;
            }))
        ];
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        ws['!cols'] = kolonlar.map(k => ({ wch: k.w }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Kumas Stogu');
        XLSX.writeFile(wb, dosya);
        if (typeof erpToast === 'function') erpToast('Kumaş stok formu Excel indirildi.', 'success', 4000);
    };

    function mamulVaryantFormDoluMu(v) {
        if (!v) return false;
        if (String(v.renk_etiket || '').trim()) return true;
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
                notlar: typeof kumasNotlarOlustur === 'function'
                    ? kumasNotlarOlustur('', varMeta)
                    : ''
            };
            if (v?.fotograf) row.fotograf = v.fotograf;

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

    function mamulKumasMetaCacheSil(rec) {
        if (rec && Object.prototype.hasOwnProperty.call(rec, '_kumas_meta_cache')) {
            delete rec._kumas_meta_cache;
        }
    }

    function mamulVaryantCacheGuncelle(anaKayit, varyantlar, anaKod) {
        const ana = String(anaKod || '').trim().toUpperCase();
        const lib = dataCache.kumas_kutuphanesi;
        if (!Array.isArray(lib) || !ana) return;
        if (anaKayit) {
            mamulKumasMetaCacheSil(anaKayit);
            const ix = lib.findIndex(x => String(x.id) === String(anaKayit.id));
            if (ix >= 0) lib[ix].notlar = anaKayit.notlar;
        }
        (Array.isArray(varyantlar) ? varyantlar : []).forEach((v, i) => {
            const vNo = i + 1;
            if (!mamulVaryantFormDoluMu(v)) return;
            const varKod = mamulVaryantKodFormatla(ana, vNo);
            const renk = mamulVaryantRenkEtiket(v);
            const childMeta = mamulVaryantMetaOlustur(v, vNo, ana);
            const childNot = typeof kumasNotlarOlustur === 'function'
                ? kumasNotlarOlustur('', childMeta)
                : '';
            const child = lib.find(x => {
                const k = String(x.desen_kodu || '').trim().toUpperCase();
                return k === varKod || (mamulAnaKodBul(k) === ana && mamulVaryantNoBul(k) === vNo);
            });
            if (!child) return;
            child.renk = renk;
            child.notlar = childNot;
            mamulKumasMetaCacheSil(child);
        });
        if (typeof stockCards !== 'undefined') stockCards = lib;
    }
    window.mamulVaryantCacheGuncelle = mamulVaryantCacheGuncelle;

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
                mamulKumasMetaCacheSil(child);
            }

            anaKayit.notlar = newNotlar;
            mamulKumasMetaCacheSil(anaKayit);
            const libIdx = (dataCache.kumas_kutuphanesi || []).findIndex(x => String(x.id) === String(anaKayit.id));
            if (libIdx >= 0) {
                dataCache.kumas_kutuphanesi[libIdx].notlar = newNotlar;
                mamulKumasMetaCacheSil(dataCache.kumas_kutuphanesi[libIdx]);
            }

            mamulVaryantCacheGuncelle(anaKayit, varyantlar, ana);

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
            if (typeof loadData === 'function') loadData();
            if (typeof erpToast === 'function') erpToast(`V${vNo} renk adı kaydedildi: ${renk || '—'}`, 'success', 2500);
        } catch (e) {
            console.error(e);
            if (typeof erpToast === 'function') erpToast('Renk adı kaydedilemedi: ' + (e.message || e), 'error', 5000);
        }
    };

    function kumasVaryantListeDomDoluMu() {
        const root = document.getElementById('kumas-varyant-list');
        if (!root) return false;
        return Array.from(root.querySelectorAll('input, textarea, select')).some(el => String(el.value ?? '').trim() !== '');
    }

    function kumasVaryantKaydetOnKontrol() {
        /* Ham kart tek başına kaydedilebilir; boyalı varyant zorunlu değil */
        return true;
    }
    window.kumasVaryantKaydetOnKontrol = kumasVaryantKaydetOnKontrol;

    function kumasSayiOku(v) {
        const n = parseFloat(String(v ?? '').replace(',', '.').trim());
        return Number.isFinite(n) ? n : 0;
    }

    function kumasEkAlanFormOku() {
        const varyantlar = typeof kumasVaryantFormVerisiOku === 'function'
            ? kumasVaryantFormVerisiOku()
            : [];
        const hamAtki = typeof kumasHamAtkiFormOku === 'function' ? kumasHamAtkiFormOku() : [];
        /* Stok alanları form sıfırlanmadan önce snapshot alınır — kayıt sonrası DOM boşalıyor */
        const ilk_mt = kumasSayiOku(document.getElementById('val-kumas-ilk-mt')?.value);
        const ilk_kg = kumasSayiOku(document.getElementById('val-kumas-ilk-kg')?.value);
        const varyant_stoklar = [];
        const sayi = Math.max(varyantlar.length, typeof kumasVaryantKolonSayisiAl === 'function' ? kumasVaryantKolonSayisiAl() : 0);
        for (let v = 1; v <= sayi; v++) {
            const mt = kumasSayiOku(document.getElementById(`val-kumas-v${v}-ilk_mt`)?.value);
            if (mt > 0) varyant_stoklar.push({ vNo: v, mt, kg: 0 });
        }
        return {
            kumas_varyantlar: varyantlar,
            varyantlar,
            ham_atki: hamAtki,
            ilk_mt,
            ilk_kg,
            varyant_stoklar
        };
    }
    window.kumasEkAlanFormOku = kumasEkAlanFormOku;

    /**
     * Stok kartından depo girişi — depo giriş ekranı ile aynı tablo/kolon mantığı.
     * Form reset sonrası DOM okunmaz; snapshot ile çağrılmalı.
     */
    async function kumasKartStokGirisYaz(entries, anaPayload) {
        const list = (Array.isArray(entries) ? entries : []).filter(e => {
            const mt = kumasSayiOku(e?.miktar_mt);
            const kg = kumasSayiOku(e?.miktar_kg);
            return String(e?.stok_kodu || '').trim() && (mt > 0 || kg > 0);
        });
        if (!list.length || typeof sb === 'undefined' || !sb?.from) {
            return { ok: true, yazilan: 0, skipped: true };
        }
        const user = String((typeof erpCurrentUser !== 'undefined' && (erpCurrentUser?.display_name || erpCurrentUser?.username)) || '—');
        const ana = anaPayload || {};
        const rows = list.map(e => {
            const kod = String(e.stok_kodu || '').trim();
            const mt = kumasSayiOku(e.miktar_mt);
            const kg = kumasSayiOku(e.miktar_kg);
            const satirNot = typeof depoNotlarWithBirim === 'function'
                ? depoNotlarWithBirim('MT', e.not || 'Stok girişi — kart tanımı')
                : (e.not || 'Stok girişi — kart tanımı');
            const kb = (typeof depoKaynakBirimImportBelirle === 'function'
                ? depoKaynakBirimImportBelirle('KUMAS', kod)
                : null)
                || (typeof depoKumasKaynakBirimBelirle === 'function' ? depoKumasKaynakBirimBelirle(kod) : '')
                || 'DEPO_HAREKET_KUMAS';
            /* Depo giriş ile aynı minimal alanlar — şema uyumsuz kolonlar retry ile düşer */
            return {
                stok_kodu: kod,
                kumas_cinsi: e.kumas_cinsi || ana.kumas_cinsi || ana.urun_adi || '',
                urun_adi: e.urun_adi || ana.urun_adi || ana.kumas_cinsi || '',
                lot_no: '',
                marka: String(ana.firma || '').trim(),
                miktar_mt: mt,
                miktar_kg: kg,
                cuval_sayisi: 0,
                firma: String(ana.firma || '').trim(),
                notlar: satirNot,
                islem_turu: 'GİRİŞ',
                kaynak_birim: kb,
                updated_by: user
            };
        });

        let insertPayload = rows.map(r => ({ ...r }));
        const triedCols = new Set();
        let hareketIds = [];
        while (true) {
            /* Yalnız id seç — fazla kolon select hatası insert'i düşürmesin */
            const ins = await sb.from('kumas_stok').insert(insertPayload).select('id');
            if (!ins.error) {
                hareketIds = (ins.data || []).map(r => r.id).filter(Boolean);
                if (!Array.isArray(dataCache.kumas_stok)) dataCache.kumas_stok = [];
                insertPayload.forEach((row, i) => {
                    dataCache.kumas_stok.unshift({
                        ...row,
                        id: hareketIds[i] || undefined,
                        created_at: new Date().toISOString()
                    });
                });
                if (typeof erpBakiyeIndexInvalidate === 'function') erpBakiyeIndexInvalidate();
                break;
            }
            const msg = String(ins.error?.message || '');
            const m = msg.match(/Could not find the '([^']+)' column/i)
                || msg.match(/column ["']?([a-z0-9_]+)["']? (?:of relation )?does not exist/i);
            const missingCol = m?.[1];
            if (!missingCol || triedCols.has(missingCol)) {
                console.warn('kumasKartStokGirisYaz hata:', msg, insertPayload[0]);
                return { ok: false, error: ins.error, yazilan: 0 };
            }
            triedCols.add(missingCol);
            insertPayload = insertPayload.map(row => {
                const r = { ...row };
                delete r[missingCol];
                return r;
            });
        }
        if (typeof erpSyncTablesBackground === 'function') erpSyncTablesBackground(['kumas_stok']);
        else if (typeof syncAllData === 'function') {
            syncAllData(false, { silent: true, light: true, tables: ['kumas_stok'] }).catch(() => {});
        }
        return { ok: true, yazilan: hareketIds.length || rows.length, ids: hareketIds };
    }
    window.kumasKartStokGirisYaz = kumasKartStokGirisYaz;

    /** Snapshot'tan stok giriş satırları üret */
    function kumasKartStokEntriesFromSnap(ekMeta, anaPayload) {
        const anaKod = typeof kumasAnaKodBul === 'function'
            ? kumasAnaKodBul(anaPayload?.desen_kodu || anaPayload?.stok_kodu || '')
            : String(anaPayload?.desen_kodu || anaPayload?.stok_kodu || '').trim();
        if (!anaKod) return [];
        const stokEntries = [];
        const anaIlkMt = kumasSayiOku(ekMeta?.ilk_mt);
        const anaIlkKg = kumasSayiOku(ekMeta?.ilk_kg);
        if (anaIlkMt > 0 || anaIlkKg > 0) {
            stokEntries.push({
                stok_kodu: anaKod,
                miktar_mt: anaIlkMt,
                miktar_kg: anaIlkKg,
                urun_adi: anaPayload?.urun_adi || '',
                kumas_cinsi: anaPayload?.kumas_cinsi || ''
            });
        }
        const varyantlar = Array.isArray(ekMeta?.kumas_varyantlar)
            ? ekMeta.kumas_varyantlar
            : (Array.isArray(ekMeta?.varyantlar) ? ekMeta.varyantlar : []);
        (Array.isArray(ekMeta?.varyant_stoklar) ? ekMeta.varyant_stoklar : []).forEach(vs => {
            const vNo = Math.max(1, parseInt(vs?.vNo, 10) || 0);
            const mt = kumasSayiOku(vs?.mt);
            const kg = kumasSayiOku(vs?.kg);
            if (vNo < 1 || (mt <= 0 && kg <= 0)) return;
            const varKod = typeof kumasVaryantStokKodu === 'function'
                ? kumasVaryantStokKodu(anaKod, vNo)
                : `${anaKod}-${vNo}`;
            const cell = varyantlar[vNo - 1] || {};
            stokEntries.push({
                stok_kodu: varKod,
                miktar_mt: mt,
                miktar_kg: kg,
                renk: cell.renk || '',
                urun_adi: anaPayload?.urun_adi || '',
                kumas_cinsi: anaPayload?.kumas_cinsi || ''
            });
        });
        return stokEntries;
    }
    window.kumasKartStokEntriesFromSnap = kumasKartStokEntriesFromSnap;

    function kumasVaryantMetaOlustur(v, vNo, anaKod) {
        const cell = kumasVaryantAtkiDensify(v);
        return {
            kumas_varyant: true,
            varyant_no: vNo,
            ana_kod: anaKod,
            renk: cell.renk,
            renk_kodu: cell.renk_kodu,
            boya_not: cell.boya_not
        };
    }

    /** Ailenin (ana + boyalı varyantlar) DB hâlini cache'e yazar — kart tekrar açılınca görünsün */
    async function kumasVaryantCacheTazele(anaKod) {
        const ana = kumasAnaKodBul(anaKod);
        if (!ana || typeof sb === 'undefined' || !sb) return;
        const cols = (typeof ERP_SYNC_LIGHT_COLS !== 'undefined' && ERP_SYNC_LIGHT_COLS?.kumas_kutuphanesi)
            || 'id,created_at,stok_kodu,desen_kodu,desen_adi,urun_adi,kumas_cinsi,firma,kalite,notlar,atki_renkleri,terbiye,boya_not';
        try {
            const legacy = kumasStokKodLegacyCompact(ana);
            const orQ = [
                `desen_kodu.eq.${ana}`,
                `desen_kodu.like.${ana}-%`,
                `stok_kodu.eq.${ana}`,
                `stok_kodu.like.${ana}-%`
            ];
            if (legacy && legacy !== ana) orQ.push(`desen_kodu.eq.${legacy}`, `desen_kodu.like.${legacy}-%`);
            const { data, error } = await sb.from('kumas_kutuphanesi').select(cols).or(orQ.join(','));
            if (error || !Array.isArray(data)) return;
            const list = dataCache.kumas_kutuphanesi || [];
            const byId = new Map(list.map(x => [String(x.id), x]));
            data.forEach(rec => {
                const key = String(rec.id);
                const onceki = byId.get(key);
                const birlesik = onceki ? { ...onceki, ...rec } : rec;
                delete birlesik._kumas_meta_cache;
                delete birlesik._kumas_meta_src;
                byId.set(key, birlesik);
            });
            dataCache.kumas_kutuphanesi = Array.from(byId.values());
            if (typeof stockCards !== 'undefined') stockCards = dataCache.kumas_kutuphanesi;
        } catch (e) {
            console.warn('kumasVaryantCacheTazele', e?.message || e);
        }
    }
    window.kumasVaryantCacheTazele = kumasVaryantCacheTazele;

    async function kumasVaryantKayitlariSenkronize(anaPayload, ekMeta) {
        const anaKod = kumasAnaKodBul(anaPayload?.desen_kodu || anaPayload?.stok_kodu || '');
        if (!anaKod || kumasVaryantNoBul(anaPayload?.desen_kodu || '') > 0) {
            return { ok: true, created: 0, updated: 0, skipped: true };
        }
        let varyantlar = kumasVaryantListesiNormalize(ekMeta?.kumas_varyantlar || ekMeta?.varyantlar);
        /* Form eksik yüklendiyse kayıtlı varyantlar boş sayılmasın */
        if (typeof kumasVaryantAileVerisiOku === 'function') {
            let dbList = [];
            try { dbList = kumasVaryantAileVerisiOku(anaKod) || []; } catch (e) { dbList = []; }
            if (dbList.length) {
                const birlesik = [];
                const uzunluk = Math.max(varyantlar.length, dbList.length);
                for (let n = 0; n < uzunluk; n++) {
                    const formCell = varyantlar[n];
                    const dbCell = dbList[n];
                    birlesik.push(kumasVaryantFormDoluMu(formCell)
                        ? formCell
                        : (kumasVaryantFormDoluMu(dbCell) ? dbCell : (formCell || kumasVaryantBosHucre())));
                }
                varyantlar = birlesik;
            }
        }
        const doluVaryantNolar = [];
        for (let vNo = 1; vNo <= varyantlar.length; vNo++) {
            if (kumasVaryantFormDoluMu(varyantlar[vNo - 1])) doluVaryantNolar.push(vNo);
        }

        /* Boyalı varyant yoksa ekstra DB turu yok — stok yazımı ana kayıt yolunda yapılır */
        if (!doluVaryantNolar.length) {
            return { ok: true, created: 0, updated: 0, skipped: true, anaKod };
        }

        let aileKayitlari = kumasAileKayitlariTopla(anaKod);
        try {
            if (typeof sb !== 'undefined' && sb) {
                const legacy = typeof kumasStokKodLegacyCompact === 'function'
                    ? kumasStokKodLegacyCompact(anaKod)
                    : '';
                const orQ = [
                    `desen_kodu.eq.${anaKod}`,
                    `desen_kodu.like.${anaKod}-%`,
                    `stok_kodu.eq.${anaKod}`,
                    `stok_kodu.like.${anaKod}-%`
                ];
                if (legacy && legacy !== anaKod) {
                    orQ.push(`desen_kodu.eq.${legacy}`, `desen_kodu.like.${legacy}-%`);
                }
                const res = await sb.from('kumas_kutuphanesi').select('id,desen_kodu,stok_kodu,notlar,boya_not').or(orQ.join(','));
                if (!res.error && Array.isArray(res.data)) aileKayitlari = res.data;
            }
        } catch (e) {}

        const aileKayitBul = (varKod, vNo) => {
            const hedef = String(varKod || '').trim().toUpperCase();
            let hit = aileKayitlari.find(x => String(x.desen_kodu || x.stok_kodu || '').trim().toUpperCase() === hedef);
            if (hit) return hit;
            return aileKayitlari.find(x => {
                const k = String(x.desen_kodu || x.stok_kodu || '').trim().toUpperCase();
                return kumasAnaKodBul(k) === anaKod && kumasVaryantNoBul(k) === vNo;
            }) || null;
        };

        const anaKodCanon = (typeof kumasStokKodCanon === 'function' ? kumasStokKodCanon(anaKod) : anaKod) || anaKod;
        const user = String(anaPayload?.updated_by || (typeof erpCurrentUser !== 'undefined' && (erpCurrentUser?.display_name || erpCurrentUser?.username)) || '—');

        let created = 0;
        let updated = 0;
        let skipped = 0;
        const yazmaIsleri = [];

        const hucreAyniMi = (a, b) => {
            const x = kumasVaryantAtkiDensify(a);
            const y = kumasVaryantAtkiDensify(b);
            return x.renk === y.renk && x.renk_kodu === y.renk_kodu && x.boya_not === y.boya_not;
        };

        for (const vNo of doluVaryantNolar) {
            const v = varyantlar[vNo - 1];
            const varKod = kumasVaryantStokKodu(anaKod, vNo);
            const existing = aileKayitBul(varKod, vNo);
            const cell = kumasVaryantAtkiDensify(v);
            const varMeta = kumasVaryantMetaOlustur(cell, vNo, anaKod);
            const notlar = typeof kumasNotlarOlustur === 'function'
                ? kumasNotlarOlustur('', varMeta)
                : '';

            if (existing?.id) {
                const oldCell = typeof kumasVaryantKayittanHucre === 'function'
                    ? kumasVaryantKayittanHucre(existing)
                    : null;
                if (oldCell && hucreAyniMi(oldCell, cell)) {
                    skipped++;
                    continue; /* Değişmemiş — ağ isteği yok */
                }
                /* İnce güncelleme — tüm ana kart alanlarını tekrar yazma */
                yazmaIsleri.push(
                    sb.from('kumas_kutuphanesi').update({
                        notlar,
                        boya_not: cell.boya_not || '',
                        updated_by: user
                    }).eq('id', existing.id)
                        .then(res => ({ tip: 'upd', error: res.error }))
                );
                updated++;
            } else {
                const row = {
                    desen_kodu: varKod,
                    stok_kodu: varKod,
                    desen_adi: anaPayload?.desen_adi || '',
                    urun_adi: anaPayload?.urun_adi || '',
                    firma: anaPayload?.firma || '',
                    kumas_cinsi: anaPayload?.kumas_cinsi || '',
                    ana_grup: anaPayload?.ana_grup || '',
                    kalite: anaPayload?.kalite || 'AKTİF',
                    atki_renkleri: anaPayload?.atki_renkleri || '',
                    terbiye: '',
                    boya_not: cell.boya_not || '',
                    notlar,
                    updated_by: user,
                    kaynak_birim: 'KUMAS_KART_GIRIS'
                };
                yazmaIsleri.push(
                    sb.from('kumas_kutuphanesi').insert([row])
                        .then(res => ({ tip: 'ins', error: res.error }))
                );
                created++;
            }
        }

        if (yazmaIsleri.length) {
            /* Parça parça — 16 paralel istek yerine en fazla 4 */
            for (let i = 0; i < yazmaIsleri.length; i += 4) {
                const chunk = yazmaIsleri.slice(i, i + 4);
                const results = await Promise.all(chunk);
                const fail = results.find(r => r?.error);
                if (fail?.error) return { ok: false, error: fail.error, created, updated, skipped };
            }
        }

        /* Cache tazeleme arka planda — kaydı bekletmesin */
        Promise.resolve().then(() => kumasVaryantCacheTazele(anaKod)).catch(() => {});
        return { ok: true, created, updated, skipped, anaKod };
    }
    window.kumasVaryantKayitlariSenkronize = kumasVaryantKayitlariSenkronize;

    /** Eski birleştirme mantığı kapatıldı — boyalı -N kayıtlar ana karta taşınmaz */
    async function kumasVaryantYanlisCocukKayitlariTemizle() {
        return { ok: true, skipped: true, silinen: 0, birlestirilen: 0 };
    }
    window.kumasVaryantYanlisCocukKayitlariTemizle = kumasVaryantYanlisCocukKayitlariTemizle;

})();
