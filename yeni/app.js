/* ════ SİMTEKS YENİ MOBİL — KABUK (22.10.2026) ════════════════════════════════
   Görünüm sıfırdan (prototip: https://claude.ai/artifact/7e73EGsdACQDTSRCcfzRwC); HESAP YOK.
   Bütün sayılar ana programın kendi fonksiyonlarından gelir (assets/erp-core.js, kaynak src/stok/js):
     sipariş durumu siparisDurumMeta / siparisKapaliMi, kalem sayıları siparisKalemAsamaSayilari,
     olaylar (bugün olanlar, hareketler) raporVeriYukle → _raporVeri.olaylar, uyarılar erpUyarilariHesapla,
     ekran listesi ERP_PERM_GROUP_DEFS + erpUserCan. Burada aynı adla fonksiyon TANIMLANMAZ (her şey bu
     kapalı bölümün içinde, öneki ym); veritabanına HİÇBİR ŞEY yazılmaz (giriş / çıkış dışında).
   Eski mobile geçiş YOK (22.10.2026, kullanıcı: "eski görünüm diye bir şey yok, hepsini yeni görünümde yapacağız"):
   ana programın menüsündeki her ekran burada yapılır; bitmeyen ekran "hazırlanıyor" der (hazirlaniyorCiz).
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const YENI_EKRANLAR = new Set(['DASHBOARD', 'SIPARIS_LISTE', 'SIPARIS_KAPANAN',
        'KUMAS', 'MAMUL_DEPO', 'IPLIK', 'DOKUMA_DEPO', 'DEPO_HAREKET_LISTE', 'MUHASEBE_FIS',
        'DOKUMA_TAKIP', 'TEZGAH_PLANLAMA', 'DOKUMA_FASON_TAKIP',
        'KONFEKSIYON_KESIM', 'KONFEKSIYON_YIKAMA', 'KONFEKSIYON_KALITE', 'KONFEKSIYON_PLANLAMA', 'FASON_TAKIP',
        'PLANLAMA', 'SEVKIYAT', 'RAPORLAR', 'YAPILACAKLAR',
        'BOYAHANE_URETIM', 'NUMUNE', 'KART_LISTE', 'URUN_AGACI', 'TEKNIK_FOY', 'IPLIK_KART_GIRIS', 'KUMAS_KART_GIRIS', 'MAMUL_KART_GIRIS',
        'GUNLUK_ISLEMLER', 'KULLANICI_YONETIMI', 'STOK_SAYIM']);
    /* İki yerleşim: geliştirme (mobil-yeni/mobil.html, çekirdek ../assets/) ve yükleme paketi (mobil/YUKLE-BUNU, hepsi
       aynı klasörde: yeni-mobil.html + erp-core.js — scripts/sync-mobil-assets.js yazar) */
    const GELISTIRME = /\/mobil-yeni\//.test(location.pathname);
    const LISTE_ADIM = 40;

    const D = {
        tab: 'ana', detay: null, ekran: null, dsekme: 'kalem', suzgec: 'acik', arama: '', acikGrup: null, acikUyari: null,
        limit: LISTE_ADIM, yukleniyor: '', hata: '', pencere: false,
        hazir: { sip: false, sayi: false, uyari: false }, surum: 0, sure: {}
    };
    const kok = () => document.getElementById('yeni-kok');

    /* ── Simgeler ─────────────────────────────────────────────────────── */
    const svg = (yol, b = 20, k = 1.9) => `<svg width="${b}" height="${b}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${k}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${yol}</svg>`;
    /* Düğme işaretleri (görsel takımda karşılığı olmayanlar): geri / ileri oku, kilit, uyarı üçgeni */
    const I = {
        geri: '<path d="M15 5l-7 7 7 7"></path>',
        sag: '<path d="m9 6 6 6-6 6"></path>',
        ucgen: '<path d="M12 3 2 20h20z"></path><path d="M12 10v4M12 17h.01"></path>',
        kilit: '<rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>'
    };
    /* SİMGELER = görsel yenilemenin çizgi takımı (23.10.2026, kullanıcı: "tekstil erp görsel klasöründeki ikonları kullanalım,
       yeni tasarım o şekilde olacak"). Takım aşağıdaki blokta (betik yazar); ekran → simge görsel kenar çubuğunun grubu,
       görselin ekranlarda kullandığı özel simgeler (stok türü, depo girişi, kesim, kart) EKRAN_OZEL'de. Bekçi "Yeni mobil: simgeler". */
    /* GORSEL-SIMGELER:BAS — görsel yenileme dalı (rafta/gorsel-yenileme) src/stok/partials/shell.html sbi- takımı; node scripts/yeni-mobil-simgeler.js yazar, ELLE DEĞİŞTİRME */
    const GS = {
        'home': '<path d="M3 11l9-7 9 7"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
        'siparis': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
        'depo': '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
        'sevkiyat': '<path d="M14 17V6H3v11h2"/><path d="M14 9h4l3 3.5V17h-2"/><path d="M9 17h6"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
        'kart': '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M5.5 16c.6-1.4 1.9-2.2 3.5-2.2s2.9.8 3.5 2.2"/><path d="M15 10h3M15 14h3"/>',
        'dokuma': '<path d="M6 4h12M6 20h12"/><path d="M8 4v16M16 4v16"/><path d="M8 8.5l8 2.5M8 13l8 2.5"/>',
        'terbiye': '<path d="M12 3.5s6 6.4 6 10.8a6 6 0 0 1-12 0c0-4.4 6-10.8 6-10.8z"/><path d="M9.2 14.5a2.9 2.9 0 0 0 2.8 2.7"/>',
        'konfeksiyon': '<path d="M8.5 3.5L3.5 6.5 5.5 10.5 8 9.5V20.5h8V9.5l2.5 1 2-4-5-3c-.5 1.5-2 2.5-3.5 2.5s-3-1-3.5-2.5z"/>',
        'fason': '<path d="M4 8h14l-3-3"/><path d="M20 16H6l3 3"/>',
        'numune': '<path d="M9 3h6"/><path d="M10 3v6l-5.2 9.1A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.7-2.9L14 9V3"/><path d="M7.6 15h8.8"/>',
        'planlama': '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
        'yonetim': '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
        'gunluk': '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 3h6v3H9z"/><path d="M9 11h6M9 15h6M9 19h3"/>',
        'kullanici': '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.4 3.4-5.5 6.5-5.5s5.7 2.1 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.9c1.8.9 3 2.6 3.5 5.1"/>',
        'ara': '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
        'asagi': '<path d="M6 9l6 6 6-6"/>',
        'panel': '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9.5 4.5v15"/><path d="M15.5 10l-2 2 2 2"/>',
        'cikis': '<path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2"/><path d="M9 12h11M17 9l3 3-3 3"/>',
        'yenile': '<path d="M20 11.5a8 8 0 1 0-2.4 5.7"/><path d="M20 5v6.5h-6.5"/>',
        'arti': '<path d="M12 5v14M5 12h14"/>',
        'kapat': '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
        'konum': '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
        'kutu': '<path d="M3.5 7.5L12 3.5l8.5 4v9L12 20.5l-8.5-4z"/><path d="M3.5 7.5L12 11.5l8.5-4M12 11.5v9"/>',
        'liste': '<path d="M10 6.5h10M10 12h10M10 17.5h10"/><path d="M3.8 6.6l1.4 1.4 2.4-2.6M3.8 12.1l1.4 1.4 2.4-2.6M3.8 17.6l1.4 1.4 2.4-2.6"/>',
        'giris': '<path d="M12 3.5v10.5M8 10l4 4 4-4"/><path d="M4 14.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5"/>',
        'makas': '<circle cx="6" cy="7" r="2.5"/><circle cx="6" cy="17" r="2.5"/><path d="M8.2 8.3L20 18M8.2 15.7L20 6"/>',
        'gunes': '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
        'zil': '<path d="M12 3.5a5.6 5.6 0 0 0-5.6 5.6v3.2c0 1-.35 2-1 2.8L4.6 16.5h14.8l-.8-1.4a4.5 4.5 0 0 1-1-2.8V9.1A5.6 5.6 0 0 0 12 3.5z"/><path d="M9.7 19.6a2.4 2.4 0 0 0 4.6 0"/>',
        'ay': '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
        'agac': '<circle cx="12" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/><path d="M12 7v5M6 17v-5h12v5"/>',
        'a-bobin': '<path d="M5 4h9M5 20h9"/><path d="M6.5 4v16M12.5 4v16"/><path d="M6.5 9l6 2M6.5 13l6 2"/><path d="M18.5 9.5s2 2.2 2 3.7a2 2 0 0 1-4 0c0-1.5 2-3.7 2-3.7z"/>',
        'a-bukum': '<path d="M7 3c0 5.5 10 6.5 10 12v6"/><path d="M17 3c0 5.5-10 6.5-10 12v6"/>',
        'a-topboya': '<ellipse cx="6.5" cy="12" rx="2.5" ry="5"/><path d="M6.5 7H14M6.5 17H14M14 7v10"/><path d="M19 9.5s2 2.2 2 3.7a2 2 0 0 1-4 0c0-1.5 2-3.7 2-3.7z"/>',
        'a-baski': '<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="2"/><path d="M7 14h10v6H7z"/>',
        'a-topyikama': '<ellipse cx="6.5" cy="9.5" rx="2.5" ry="4.5"/><path d="M6.5 5H16M6.5 14H16M16 5v9"/><path d="M3 19c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0"/>',
        'a-sacak': '<path d="M4 5h16"/><path d="M6 5v11M10 5v13M14 5v11M18 5v13"/>',
        'a-parcabaski': '<path d="M9.5 3h5v5l3 3h-11l3-3z"/><path d="M5 14h14v3H5z"/><path d="M5 20.5h14"/>',
        'iplik': '<circle cx="12" cy="12" r="8"/><path d="M5.2 8.6c4.3-.2 9.2 2 12.6 6.2M4.4 13.3c3.6-.6 8.4.9 11 5M8.6 4.8c3 2.1 5.8 6 6.8 10.6"/>',
        'kumas': '<ellipse cx="6.5" cy="9" rx="3" ry="5"/><path d="M6.5 4H17a3 5 0 0 1 0 10H6.5"/><path d="M17 14v6H9.5"/>',
        'mamul': '<rect x="4" y="4.5" width="16" height="4.5" rx="1.2"/><rect x="4" y="10" width="16" height="4.5" rx="1.2"/><rect x="4" y="15.5" width="16" height="4.5" rx="1.2"/>',
        'a-nakis': '<path d="M5 19L16.5 7.5"/><circle cx="18" cy="6" r="1.8"/><path d="M3.5 14.5c2.5 0 3 4.5 6 4.5"/>'
    };
    /* GORSEL-SIMGELER:SON */
    const gs = (ad, b = 20) => svg(GS[ad] || '', b, 1.7);
    const EKRAN_SIMGE = {
        DASHBOARD: 'home',
        SIPARIS_GIRIS: 'siparis', SIPARIS_LISTE: 'siparis', SIPARIS_KAPANAN: 'siparis', URUN_AGACI: 'siparis',
        IPLIK: 'depo', KUMAS: 'depo', MAMUL_DEPO: 'depo', STOK_SAYIM: 'depo',
        SEVKIYAT: 'sevkiyat', DEPO_HAREKET_LISTE: 'sevkiyat', MUHASEBE_FIS: 'sevkiyat',
        KART_LISTE: 'kart',
        TEZGAH_PLANLAMA: 'dokuma', DOKUMA_TAKIP: 'dokuma', DOKUMA_DEPO: 'dokuma',
        BOYAHANE_URETIM: 'terbiye', KONFEKSIYON_YIKAMA: 'terbiye',
        KONFEKSIYON_KESIM: 'konfeksiyon', KONFEKSIYON_KALITE: 'konfeksiyon', KONF_ISLEM_RAPOR: 'konfeksiyon',
        DOKUMA_FASON_TAKIP: 'fason', FASON_TAKIP: 'fason',
        NUMUNE: 'numune',
        PLANLAMA: 'planlama', YAPILACAKLAR: 'planlama', TEKNIK_FOY: 'planlama', KONFEKSIYON_PLANLAMA: 'planlama',
        RAPORLAR: 'yonetim', DIAGNOSTICS: 'yonetim', GUNLUK_ISLEMLER: 'gunluk', KULLANICI_YONETIMI: 'kullanici'
    };
    /* Görselin menü dışında kullandığı ekrana özel simgeler (Sevkiyat merkezi / Depo hareketleri: stok türü; ana sayfa düğmeleri) */
    const EKRAN_OZEL = { IPLIK: 'iplik', KUMAS: 'kumas', MAMUL_DEPO: 'mamul', DEPO_HAREKET: 'giris', KONFEKSIYON_KESIM: 'makas',
        KONFEKSIYON: 'konfeksiyon', IPLIK_KART_GIRIS: 'kart', KUMAS_KART_GIRIS: 'kart', MAMUL_KART_GIRIS: 'kart' };
    const ekranSimge = kod => EKRAN_OZEL[kod] || EKRAN_SIMGE[kod] || 'liste';
    /* Ekranlar sekmesi grup kartı → görsel kenar çubuğundaki karşılığı */
    const GRUP_SIMGE = { genel: 'home', siparis: 'siparis', depo: 'depo', dokuma: 'dokuma', terbiye: 'terbiye', konfeksiyon: 'konfeksiyon', kart: 'kart', sistem: 'yonetim', yonetim: 'yonetim' };


    /* ── Renkler: sipariş durumu (veritabanındaki durum alanı, 02 SIPARIS_DURUM_SECENEKLERI) ── */
    const DURUM_RENK = {
        PLANDA: ['#475467', '#F2F4F7'], BEKLEMEDE: ['#B54708', '#FEF4E6'], DOKUMA: ['#0E7C70', '#E3F5F2'],
        TERBIYE: ['#C11574', '#FCE7F3'], 'ÜRETİMDE': ['#6927DA', '#F2EEFF'], KONFEKSIYON: ['#3538CD', '#EEF0FF'],
        HAZIR: ['#175CD3', '#E8F1FD'], SEVK: ['#175CD3', '#E8F1FD'], TAMAMLANDI: ['#067647', '#E7F6EC'],
        'İPTAL': ['#B42318', '#FEECEB'], DEVAM: ['#6927DA', '#F2EEFF']
    };
    const ADIMLAR = [['PLANDA', 'Plan'], ['DOKUMA', 'Dokuma'], ['TERBIYE', 'Terbiye'], ['KONFEKSIYON', 'Konf.'], ['HAZIR', 'Hazır'], ['SEVK', 'Sevk'], ['TAMAMLANDI', 'Bitti']];
    const ADIM_SIRA = { PLANDA: 0, BEKLEMEDE: 0, DOKUMA: 1, 'ÜRETİMDE': 1, DEVAM: 1, TERBIYE: 2, KONFEKSIYON: 3, HAZIR: 4, SEVK: 5, TAMAMLANDI: 6 };
    const ASAMA_RENK = [
        [/DOKUMA/, '#0E7C70', '#E3F5F2'], [/KES/, '#C4320A', '#FEEFE6'], [/YIKAMA/, '#0B7EA8', '#E3F4FA'],
        [/KAL|KK_/, '#6927DA', '#F2EEFF'], [/SEVK|YUKLE/, '#175CD3', '#E8F1FD'], [/BOYA|TERB/, '#C11574', '#FCE7F3']
    ];

    /* ── Küçük yardımcılar (hesap değil, yalnız gösterim) ─────────────── */
    const esc = (v) => pdfEsc(v);
    const fmt = (n) => {
        const x = Number(n) || 0;
        return x.toLocaleString('tr-TR', { maximumFractionDigits: Math.abs(x) < 100 && x % 1 ? 1 : 0 });
    };
    const birimKisa = (b) => ({ ADET: 'ad', MT: 'mt', KG: 'kg' })[String(b || '').toUpperCase()] || String(b || '').toLowerCase();
    const tarihTr = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? `${m[3]}.${m[2]}.${m[1]}` : ''; };
    const tarihKisa = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? `${m[3]}.${m[2]}` : ''; };
    const saatOf = (ms) => { const d = new Date(ms); return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); };
    const harf = (ad) => String(ad || '?').trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0)).join('').toLocaleUpperCase('tr-TR') || '?';
    const durumKod = (s) => siparisDurumNorm(s && s.durum);
    const durumRenk = (s) => DURUM_RENK[durumKod(s)] || DURUM_RENK.PLANDA;
    const modAd = (() => { let m = null; return (kod) => { if (!m) m = new Map(ERP_PERM_MODES); return m.get(kod) || kod; }; })();
    const asamaRenk = (kod) => { const k = String(kod || '').toUpperCase(); const r = ASAMA_RENK.find(x => x[0].test(k)); return r ? [r[1], r[2]] : ['#475467', '#F2F4F7']; };
    const asamaKisa = (kod) => String(kod || '?').replace(/[^A-Za-zÇĞİÖŞÜ]/g, '').slice(0, 2).toLocaleUpperCase('tr-TR');

    function terminBilgi(s) {
        if (siparisKapaliMi(s)) return { metin: durumKod(s) === 'İPTAL' ? 'İptal' : 'Kapandı', renk: '#067647', zemin: '#E7F6EC' };
        const g = erpUyariGunFarki(s.ttarih);
        if (g == null) return { metin: 'Termin yok', renk: '#475467', zemin: '#F2F4F7', gun: null };
        if (g < 0) return { metin: `${-g} gün geçti`, renk: '#B42318', zemin: '#FEECEB', gun: g };
        if (g <= ERP_UYARI_ESIK.terminYakinGun) return { metin: g === 0 ? 'Bugün' : `${g} gün kaldı`, renk: '#B54708', zemin: '#FEF4E6', gun: g };
        return { metin: tarihKisa(s.ttarih), renk: '#344054', zemin: '#F2F4F7', gun: g };
    }

    /* ── Kalem sayıları: ana programın fonksiyonu, veri değişince bir kez ── */
    let _ozetSurum = -1; const _ozet = new Map();
    function siparisOzet(s) {
        if (_ozetSurum !== D.surum) { _ozet.clear(); _ozetSurum = D.surum; }
        const sid = String(s.id);
        if (_ozet.has(sid)) return _ozet.get(sid);
        const kalemler = [];
        let oranTop = 0, oranSay = 0;
        const sevkBirim = {};
        siparisListeKalemleriArr(s).forEach((k, ki) => {
            if (k && k.iptal) return;   /* çıkarılan kalem gösterilmez, sıra numarası (ki) korunur */
            let a = null;
            if (D.hazir.sayi) { try { a = siparisKalemAsamaSayilari(s, ki, k); } catch (e) { a = null; } }
            const siparis = a ? a.siparis : (parseFloat(k.miktar) || 0);
            const sevk = a ? (a.kumas && a.metraj ? a.metraj.sevk : a.sevk) || 0 : 0;
            if (siparis > 0) { oranTop += Math.min(1, sevk / siparis); oranSay++; }
            const b = birimKisa(a ? a.birim : siparisKalemBirim(k));
            if (sevk) sevkBirim[b] = (sevkBirim[b] || 0) + sevk;
            kalemler.push({ k, ki, a, siparis, sevk, birim: b });
        });
        const o = {
            kalemler,
            yuzde: D.hazir.sayi && oranSay ? Math.round(oranTop * 100 / oranSay) : null,
            sevkMetin: Object.keys(sevkBirim).map(b => `${fmt(sevkBirim[b])} ${b}`).join(' · ') || '0'
        };
        _ozet.set(sid, o);
        return o;
    }

    function siparisler() { return (typeof dataCache !== 'undefined' && dataCache.siparisler) || []; }
    function suzgecUyar(s, f) {
        const kapali = siparisKapaliMi(s);
        if (f === 'kapanan') return kapali;
        if (kapali) return false;
        const g = erpUyariGunFarki(s.ttarih);
        if (f === 'geciken') return g != null && g < 0;
        if (f === 'yakin') return g != null && g >= 0 && g <= ERP_UYARI_ESIK.terminYakinGun;
        if (f === 'hazir') return durumKod(s) === 'HAZIR';
        return true;
    }
    /* Sipariş araması (kullanıcı 23.10.2026): YALNIZ sipariş no, müşteri adı ve ürün adı — "rateks yazınca Rateks boyahanesinde
       bobini boyanan sipariş çıkmasın"; yazılan kelimelerin hepsi bu üç alanda geçmeli. Kapsam: Kapanan süzgeci seçili değilse
       yalnız AÇIK siparişler (aramaKapsami). Ana programın arama kuralından (02 siparisListeTekAramaEslesir: renk, ebat, durum,
       not … da arar) bilerek ayrı. */
    /* Türkçe harfler sadeleşir (ı/İ/I → i, ş → s, ç → c, ğ → g, ü → u, ö → o): veride "KIR ÇIÇEĞI" gibi karışık yazım var, kullanıcı
       Türkçe klavyesiz de yazar ("kir cicegi" de bulur) */
    const aramaNorm = (t) => String(t || '').toLocaleLowerCase('tr-TR').replace(/̇/g, '').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o');
    const aramaMetni = (s) => aramaNorm([s.sno, s.firma, ...siparisListeKalemleriArr(s).map(k => k.ad)].join(' '));
    const aramaUyar = (s, q) => { const m = aramaMetni(s); return aramaNorm(q).split(/s+/).filter(Boolean).every(t => m.includes(t)); };
    const aramaKapsami = () => (D.suzgec === 'kapanan' ? 'kapanan' : 'acik');
    function siraAnahtar(s) { const g = erpUyariGunFarki(s.ttarih); return g == null ? 99999 : g; }
    function listeSiparisleri() {
        const q = D.arama.trim();
        let l = siparisler();
        if (q) l = l.filter(s => (aramaKapsami() === 'kapanan') === siparisKapaliMi(s) && aramaUyar(s, q));
        else l = l.filter(s => suzgecUyar(s, D.suzgec));
        const kapanan = D.suzgec === 'kapanan';
        return l.slice().sort((a, b) => {
            if (kapanan) return String(b.ttarih || b.starih || '').localeCompare(String(a.ttarih || a.starih || ''));
            const ka = siparisKapaliMi(a) ? 1 : 0, kb = siparisKapaliMi(b) ? 1 : 0;
            return ka - kb || siraAnahtar(a) - siraAnahtar(b);
        });
    }

    function olaylar() { return (typeof _raporVeri !== 'undefined' && _raporVeri && _raporVeri.olaylar) || []; }
    function uyarilar() { return (typeof _erpUyari !== 'undefined' && _erpUyari.liste) || []; }

    /* ── Parçalar ─────────────────────────────────────────────────────── */
    function bantDugmeleri() {
        const n = uyarilar().length;
        return `<button class="yuvarlak-dugme ${D.yukleniyor ? 'donuyor' : ''}" data-is="yenile" aria-label="Yenile">${gs('yenile', 19)}</button>
            <button class="yuvarlak-dugme" data-is="tab" data-d="uyari" aria-label="Uyarılar">${gs('zil', 20)}${n ? `<span class="rozet">${n}</span>` : ''}</button>`;
    }
    function yukleniyorSerit() {
        if (D.hata) return `<div class="yukleniyor-serit" style="color:#B42318">${esc(D.hata)}</div>`;
        return D.yukleniyor ? `<div class="yukleniyor-serit">${gs('yenile', 14)}<span>${esc(D.yukleniyor)}</span></div>` : '';
    }
    function sipKart(s) {
        const [renk, zemin] = durumRenk(s);
        const t = terminBilgi(s), o = siparisOzet(s), meta = siparisDurumMeta(s.durum);
        const y = o.yuzde;
        return `<button class="sip-kart" data-is="siparis" data-d="${esc(s.id)}">
            <span class="sip-ust">
                <span class="harf" style="background:${zemin};color:${renk}">${esc(harf(s.firma))}</span>
                <span class="satir-orta"><span class="sip-no">${esc(s.sno || '—')}</span><span class="alt tek-satir" style="font-size:13px">${esc(s.firma || '—')}</span></span>
                <span class="hap" style="background:${t.zemin};color:${t.renk}">${esc(t.metin)}</span>
            </span>
            <span class="cubuk-satir"><span class="cubuk"><i style="width:${y || 0}%;background:${renk}"></i></span><span class="yuzde">${y == null ? '…' : '%' + y}</span></span>
            <span class="sip-alt"><span style="font-weight:600;color:${renk}">${esc(meta.label)}</span><span class="soluk tek-satir">${o.kalemler.length} kalem · ${esc(siparisListeAdetGoster(s))}</span></span>
        </button>`;
    }

    /* ── Ekranlar ─────────────────────────────────────────────────────── */
    function anaCiz() {
        const u = erpCurrentUser || {};
        const acik = siparisler().filter(s => !siparisKapaliMi(s));
        const geciken = acik.filter(s => suzgecUyar(s, 'geciken')).length;
        const yakin = acik.filter(s => suzgecUyar(s, 'yakin')).length;
        const bugun = erpYerelGun();
        const bugunOlay = olaylar().filter(o => o.gun === bugun).sort((a, b) => b.ms - a.ms);
        const bugunSevk = new Set(bugunOlay.filter(o => o.asama === 'SEVK').map(o => o.sid)).size;
        const tarih = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
        const uy = uyarilar();
        const kpi = (is, d, ikon, renk, zemin, deger, ad, degerRenk) => `<button class="kpi" data-is="${is}" data-d="${d}">
            <span class="simge" style="background:${zemin};color:${renk}">${ikon}</span>
            <span><span class="kpi-deger" style="${degerRenk ? 'color:' + degerRenk : ''}">${D.hazir.sip ? deger : '…'}</span><span class="kpi-ad">${ad}</span></span></button>`;
        const kisayol = (is, d, ikon, renk, zemin, ad) => `<button class="kisayol" data-is="${is}" data-d="${d}"><span class="simge" style="background:${zemin};color:${renk}">${ikon}</span><span>${ad}</span></button>`;
        return `<div class="bant buyuk">
                <div class="bant-ust">
                    <button class="avatar" data-is="profil" aria-label="Hesap">${esc(harf(u.display_name || u.username))}</button>
                    <span style="flex:1;display:flex;flex-direction:column;gap:1px;min-width:0"><span class="bant-alt">${esc(tarih)}</span><span class="tek-satir" style="font-size:19px;font-weight:600">Merhaba, ${esc(String(u.display_name || u.username || '').split(' ')[0])}</span></span>
                    ${bantDugmeleri()}
                </div>
                <button class="arama" data-is="aramaya-git">${gs('ara', 18)}<span>Sipariş, müşteri ya da ürün ara</span></button>
            </div>
            <div class="kpi-izgara">
                ${kpi('liste', 'acik', gs('siparis'), '#4A5FC1', '#E7EBF8', acik.length, 'Açık sipariş')}
                ${kpi('liste', 'geciken', svg(I.ucgen), '#D92D20', '#FEECEB', geciken, 'Termini geçen', geciken ? '#B42318' : '')}
                ${kpi('liste', 'yakin', gs('planlama'), '#B54708', '#FEF4E6', yakin, `Termine ≤${ERP_UYARI_ESIK.terminYakinGun} gün`)}
                ${/* dokununca bugünün sevkiyat fişleri (kullanıcı 23.10.2026) */ erpUserCan('MUHASEBE_FIS')
                    ? kpi('fis-bugun', '', gs('sevkiyat'), '#067647', '#E7F6EC', D.hazir.sayi ? bugunSevk : '…', 'Bugün sevk edilen')
                    : kpi('liste', 'acik', gs('sevkiyat'), '#067647', '#E7F6EC', D.hazir.sayi ? bugunSevk : '…', 'Bugün sevk edilen')}
            </div>
            ${yukleniyorSerit()}
            <div class="kisayollar">
                ${kisayol('liste', 'hazir', gs('kutu', 22), '#175CD3', '#E8F1FD', 'Hazır')}
                ${kisayol('liste', 'kapanan', gs('liste', 22), '#067647', '#E7F6EC', 'Kapanan')}
                ${kisayol('tab', 'uyari', gs('zil', 22), '#B54708', '#FEF4E6', 'Uyarılar')}
                ${kisayol('tab', 'ekranlar', gs('panel', 22), '#6927DA', '#F2EEFF', 'Ekranlar')}
            </div>
            <div class="bolum-baslik"><span>Dikkat isteyenler</span><button data-is="tab" data-d="uyari">Hepsi</button></div>
            ${uy.length ? `<div class="yatay yatay-kartlar">${uy.slice(0, 6).map((x, i) => {
                const sv = ERP_UYARI_SEVIYE[x.seviye] || ERP_UYARI_SEVIYE.BILGI;
                const [r, z] = x.seviye === 'KRITIK' ? ['#B42318', '#FEECEB'] : x.seviye === 'UYARI' ? ['#B54708', '#FEF4E6'] : ['#175CD3', '#E8F1FD'];
                return `<button class="dikkat-kart" data-is="uyari-ac" data-d="${i}">
                    <span style="display:flex;gap:6px;align-items:center"><span class="hap" style="background:${z};color:${r}">${esc(sv.ad)}</span><span class="soluk">${esc(ERP_UYARI_GRUP[x.grup] || '')}</span></span>
                    <span class="baslik">${esc(x.baslik)}</span>
                    <span class="alt tek-satir">${esc((x.ornekler || [])[0] || x.detay || '')}</span></button>`;
            }).join('')}</div>` : `<div class="liste-kutu"><div class="bos">${D.hazir.uyari ? 'Şu an uyarı yok.' : 'Uyarılar hesaplanıyor…'}</div></div>`}
            <div class="bolum-baslik"><span>Bugün olanlar</span><span class="soluk" style="font-size:12px;font-weight:400">${D.hazir.sayi ? bugunOlay.length + ' işlem' : ''}</span></div>
            <div class="liste-kutu">${!D.hazir.sayi ? '<div class="bos">Yükleniyor…</div>' : bugunOlay.length ? bugunOlay.slice(0, 8).map(olaySatir).join('') : '<div class="bos">Bugün henüz işlem yok.</div>'}</div>
            ${aktifPanelHtml()}`;
    }

    /* ── Aktif kullanıcılar (yalnız yönetici; masaüstü ana sayfa paneli ile aynı model: 17 erpAktifPanelModeli,
       satır metinleri 17'nin metin fonksiyonlarından). Liste dakikada bir + çevrimiçi kanal değişince tazelenir
       (17 erpAktifPanelBaslat / erpAktifPanelYenile → kancalar aşağıda); kişiye dokununca o günün Günlük İşlemleri. */
    const AKTIF_RENK = { 'var(--text3)': '#98A2B3', 'var(--amber-c,#f59e0b)': '#DC6803', 'var(--emerald-c)': '#079455' };
    const aktifRenk = (v) => AKTIF_RENK[v] || '#667085';
    function aktifPanelHtml() {
        if (!(typeof erpIsAdmin === 'function' && erpIsAdmin())) return '';
        const m = erpAktifPanelModeli();
        const bas = (meta, govde) => `<div id="ym-aktif"><div class="bolum-baslik"><span>Aktif kullanıcılar</span></div>
            <div class="soluk" style="font-size:12.5px;margin:-6px 4px 8px">${meta}</div><div class="liste-kutu">${govde}</div></div>`;
        if (m.durum === 'KURULUM') return bas('kurulum gerekli', '<div class="bos">Aktif kullanıcı takibi kurulmamış (supabase/aktif-gunluk-adim 1 → 5).</div>');
        if (m.durum !== 'TAMAM') return bas(m.hata ? 'okunamadı' : 'yükleniyor…', m.hata ? `<div class="bos" style="color:#B42318">Liste okunamadı: ${esc(m.hata)}</div>` : '<div class="bos">Yükleniyor…</div>');
        const simdi = m.h.simdi;
        const not = (t, kirmizi) => `<div class="bos ym-aktif-not" style="text-align:left;padding:8px 14px${kirmizi ? ';color:#B42318' : ''}">${esc(t)}</div>`;
        const cihaz = (c) => {
            const metin = erpAktifCihazMetin(c), d = erpAktifCihazDurum(c);
            if (!d) return `<span class="alt ym-aktif-cihaz">${esc(metin)}</span>`;
            const govde = metin.slice(0, metin.length - (' · ' + d.metin).length);
            return `<span class="alt ym-aktif-cihaz">${esc(govde)} · <b style="color:${aktifRenk(d.renk)};font-weight:600">${esc(d.metin)}</b></span>`;
        };
        const satir = (p) => {
            const ad = String(p.display_name || p.username || '?');
            const gun = erpAktifGunMetin(p);
            const s = p.islem;
            return `<button class="satir ym-aktif-kisi" data-is="aktif-kisi" data-d="${esc(ad)}" data-u="${esc(p.username || '')}" style="align-items:flex-start">
                <span class="etiket-kare" style="position:relative;background:#F2F4F7;color:#344054;border-radius:50%">${esc(harf(ad))}
                    <span style="position:absolute;right:-1px;bottom:-1px;width:10px;height:10px;border-radius:50%;border:2px solid #fff;background:${aktifRenk(erpAktifNoktaRenk(p))}"></span></span>
                <span class="satir-orta" style="white-space:normal"><span class="ust tek-satir ym-aktif-ad">${esc(ad)}${String(p.role).toLowerCase() === 'admin' ? ' <span class="soluk" style="font-weight:400">· yönetici</span>' : ''}</span>
                    ${p.cevrimici ? p.cihazlar.map(cihaz).join('') : `<span class="alt ym-aktif-cevrimdisi">${esc(erpAktifCevrimdisiMetin(p, simdi))}</span>`}
                    ${gun ? `<span class="alt ym-aktif-gun" style="font-size:11px">${esc(gun)}</span>` : ''}</span>
                <span class="hap ym-aktif-islem" style="flex:none;${s.n ? 'background:#E7F6EC;color:#067647' : 'background:#F2F4F7;color:#667085'}">${s.n ? s.n.toLocaleString('tr-TR') + ' işlem' : '—'}</span>
            </button>`;
        };
        const notlar = [
            m.tazeHata ? not(`Liste tazelenemedi (${erpGoreceliZaman(m.tazeZaman, Date.now())} okunan bilgi gösteriliyor): ${m.tazeHata}`, true) : '',
            m.eskiSurum ? not('Giriş-çıkış saatleri, aktif / boşta ve değişiklik sayıları için supabase/aktif-gunluk-adim (1 → 5) çalıştırılmalı.') : '',
            m.kanalParamYok ? not('Anlık görünüm için supabase/aktif-gunluk-adim çalıştırılmalı — şimdilik dakikalık nabızla gösteriliyor.')
                : m.eslenmeyenCihaz ? not(`Yeni açılan ${m.eslenmeyenCihaz} cihaz eşleniyor…`) : '',
            m.eslesmeyen.length ? not('Eşleşmeyen kayıt adları: ' + m.eslesmeyen.map(([a, n]) => `${a} (${n})`).join(', ')) : '',
            m.sayimHata ? not('Bugünkü kayıt sayıları okunamadı: ' + m.sayimHata, true) : '',
            m.degisiklikHata ? not('Bugünkü değişiklik sayıları okunamadı: ' + m.degisiklikHata, true) : ''
        ].join('');
        return bas(`<span id="ym-aktif-meta">${m.cevrimici} çevrimiçi${m.aktifSay ? ` · ${m.aktifSay} aktif` : ''} · ${m.kisiler.length} kişi</span>${m.canli ? ' · <span style="color:#079455">● anlık</span>' : ''}`,
            (m.kisiler.length ? m.kisiler.map(satir).join('') : '<div class="bos">Kullanıcı yok</div>') + notlar);
    }
    /* Çekirdeğin panel zamanlayıcısı / çevrimiçi kanalı bunlara sorar (17 erpAktifEkranAcik, erpAktifPanelYenile) */
    window.erpAktifPanelAcikMi = () => !D.ekran && D.tab === 'ana' && !!document.getElementById('ym-aktif');
    window.erpAktifPanelKanca = () => { const el = document.getElementById('ym-aktif'); if (el) el.outerHTML = aktifPanelHtml(); };

    function olaySatir(o) {
        const [r, z] = asamaRenk(o.asama);
        const sip = siparisler().find(s => String(s.id) === String(o.sid));
        const miktar = o.miktar ? `${fmt(o.miktar)} ${birimKisa(o.birim)}` : '';
        return `<button class="satir" data-is="siparis" data-d="${esc(o.sid)}" ${sip ? '' : 'disabled'}>
            <span class="etiket-kare" style="background:${z};color:${r}">${esc(asamaKisa(o.asama))}</span>
            <span class="satir-orta"><span class="ust tek-satir">${esc(raporAsamaAd(o.asama, o.alt))}${miktar ? ' · ' + esc(miktar) : ''}</span>
            <span class="alt tek-satir">${esc(o.sno || '')} · ${esc(o.urun || o.firma || '')}${o.kullanici ? ' · ' + esc(o.kullanici) : ''}</span></span>
            <span class="soluk" style="flex:none">${esc(o.gun === erpYerelGun() ? saatOf(o.ms) : tarihKisa(o.gun) + ' ' + saatOf(o.ms))}</span>
        </button>`;
    }

    function listeCiz() {
        const l = listeSiparisleri();
        const cipler = [['acik', 'Açık'], ['yakin', 'Termini yakın'], ['geciken', 'Geciken'], ['hazir', 'Hazır'], ['kapanan', 'Kapanan']];
        return `<div class="bant">
                <div class="bant-ust"><span class="bant-baslik">Siparişler</span><span class="sayi-hap" id="ym-sayi">${l.length} sipariş</span>${bantDugmeleri()}</div>
                <label class="arama">${gs('ara', 18)}<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Sipariş ara</span>
                    <input type="search" id="ym-arama" value="${esc(D.arama)}" placeholder="Sipariş no, müşteri, ürün…" autocomplete="off" data-canli="serbest"></label>
                <div class="yatay cipler">${cipler.map(([id, ad]) => `<button class="cip ${(D.arama ? aramaKapsami() === id : D.suzgec === id) ? 'secili' : ''}" data-is="suzgec" data-d="${id}">${ad}<b>${siparisler().filter(s => suzgecUyar(s, id)).length}</b></button>`).join('')}</div>
            </div>
            ${yukleniyorSerit()}
            <div class="kartlar" id="ym-kartlar">${kartlarHtml(l)}</div>`;
    }
    function kartlarHtml(l) {
        if (!D.hazir.sip && !l.length) return '<div class="sip-kart"><div class="bos">Siparişler yükleniyor…</div></div>';
        if (!l.length) return `<div class="sip-kart"><div class="bos">${D.arama ? 'Bu aramaya uyan sipariş yok.' : 'Bu süzgeçte sipariş yok.'}</div></div>`;
        return l.slice(0, D.limit).map(sipKart).join('') + (l.length > D.limit ? `<button class="daha" data-is="daha">${l.length - D.limit} sipariş daha göster</button>` : '');
    }

    function detayCiz() {
        const s = siparisler().find(x => String(x.id) === String(D.detay));
        if (!s) return `<div class="bant"><div class="bant-ust"><button class="geri" data-is="geri" aria-label="Geri">${svg(I.geri, 22, 2.2)}</button><span class="bant-baslik">Sipariş bulunamadı</span></div></div>`;
        const [renk, zemin] = durumRenk(s);
        const t = terminBilgi(s), o = siparisOzet(s), meta = siparisDurumMeta(s.durum);
        const y = o.yuzde == null ? 0 : o.yuzde;
        const simdi = ADIM_SIRA[durumKod(s)] != null ? ADIM_SIRA[durumKod(s)] : 0;
        const iptal = durumKod(s) === 'İPTAL';
        const adimHtml = ADIMLAR.map(([kod, ad], i) => {
            const bitti = !iptal && i < simdi, aktif = !iptal && i === simdi;
            const hat = i === ADIMLAR.length - 1 ? 'transparent' : (!iptal && i < simdi ? renk : '#E4E7EC');
            return `<div class="adim"><span class="hat" style="background:${hat}"></span>
                <span class="nokta" style="border-color:${bitti || aktif ? renk : '#D0D5DD'};background:${bitti || (aktif && kod === 'TAMAMLANDI') ? renk : '#FFFFFF'}"></span>
                <span class="ad" style="color:${bitti || aktif ? '#101828' : '#98A2B3'}">${ad}</span></div>`;
        }).join('');
        const sekme = (id, ad) => `<button class="sekme ${D.dsekme === id ? 'secili' : ''}" data-is="dsekme" data-d="${id}">${ad}</button>`;
        let govde = '';
        if (D.dsekme === 'kalem') govde = o.kalemler.length ? o.kalemler.map(kalemKart).join('') : '<div class="kalem-kart"><div class="bos">Kalem yok.</div></div>';
        else if (D.dsekme === 'hareket') {
            const h = olaylar().filter(x => String(x.sid) === String(s.id)).sort((a, b) => b.ms - a.ms);
            govde = `<div class="liste-kutu" style="margin:0">${!D.hazir.sayi ? '<div class="bos">Yükleniyor…</div>' : h.length ? h.slice(0, 60).map(olaySatir).join('') + (h.length > 60 ? `<div class="bos">Son 60 işlem gösteriliyor (toplam ${h.length}).</div>` : '') : '<div class="bos">Bu siparişte üretim / sevk işlemi yok.</div>'}</div>`;
        } else {
            const satir = (a, d) => d ? `<div class="bilgi-satir"><span class="soluk" style="font-size:13px">${a}</span><span class="d">${esc(d)}</span></div>` : '';
            govde = `<div class="liste-kutu" style="margin:0;padding:2px 14px">
                ${satir('Müşteri', s.firma)}${satir('Sipariş tarihi', tarihTr(s.starih))}${satir('Termin', tarihTr(s.ttarih) || 'Girilmemiş')}
                ${satir('Durum', meta.label)}${satir('Sipariş grubu', s.siparis_grubu)}${satir('Üretim yeri', s.uretim_yeri)}
                ${satir('Miktar', siparisListeAdetGoster(s))}${satir('Not', s.notlar)}${satir('Son değiştiren', [s.updated_by, tarihTr(s.updated_at)].filter(Boolean).join(' · '))}</div>${siparisFotoHtml(s)}`;
        }
        return `<div class="bant buyuk" style="padding-top:calc(6px + var(--ust-bosluk));gap:4px">
                <div class="bant-ust" style="gap:6px"><button class="geri" data-is="geri" aria-label="Siparişlere dön">${svg(I.geri, 22, 2.2)}</button>
                    <span class="bant-baslik">${esc(s.sno || '—')}</span><span class="hap" style="background:#FFFFFF;color:${renk};font-size:12px;padding:5px 10px">${esc(meta.label)}</span></div>
                <span style="font-size:16px;font-weight:600">${esc(s.firma || '—')}</span>
                <span class="bant-alt" style="font-size:13px">Termin ${esc(tarihTr(s.ttarih) || 'yok')} · ${esc(t.metin)} · ${o.kalemler.length} kalem</span>
            </div>
            <div class="ozet-kart">
                <div class="halka-satir">
                    <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="Sevk yüzdesi"><circle cx="32" cy="32" r="26" fill="none" stroke="#EEF0F4" stroke-width="7"></circle>
                        <circle cx="32" cy="32" r="26" fill="none" stroke="${renk}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(y / 100 * 163.4).toFixed(1)} 163.4" transform="rotate(-90 32 32)"></circle>
                        <text x="32" y="37" text-anchor="middle" font-size="14" font-weight="700" fill="#101828">${o.yuzde == null ? '…' : '%' + y}</text></svg>
                    <span style="display:flex;flex-direction:column;gap:2px;min-width:0"><span class="soluk">Sevk edilen</span><span style="font-size:17px;font-weight:700">${D.hazir.sayi ? esc(o.sevkMetin) : '…'}</span><span class="soluk">Sipariş ${esc(siparisListeAdetGoster(s))}</span></span>
                </div>
                <div class="adimlar">${adimHtml}</div>
            </div>
            <div class="sekmeler">${sekme('kalem', 'Kalemler')}${sekme('hareket', 'Hareketler')}${sekme('bilgi', 'Bilgi')}</div>
            <div class="ayrinti-govde">${govde}
                <div class="kilit-not">${svg(I.kilit, 16)}<span>Mobilde yalnız görüntü. Değişiklik masaüstünden yapılır.</span></div></div>`;
    }

    function kalemKart(x, i) {
        const { k, a, siparis, birim } = x;
        const p = (v) => siparis > 0 ? Math.max(0, Math.min(100, Math.round(v * 100 / siparis))) : 0;
        const kutu = (ad, deger, renk, zemin, yuzde) => `<div class="asama-kutu" style="background:${zemin}"><span class="d" style="color:${renk}">${deger}</span><span class="a">${ad}</span><span class="c"><i style="width:${yuzde}%;background:${renk}"></i></span></div>`;
        let kutular;
        if (!a) kutular = '<div class="soluk" style="grid-column:1/-1;text-align:center;padding:8px">Sayılar yükleniyor…</div>';
        else if (a.kumas && a.metraj) {
            const m = a.metraj, kalan = Math.max(0, (m.siparis || 0) - (m.dokunan || 0));
            kutular = kutu('Dokunan', fmt(m.dokunan), '#0E7C70', '#E3F5F2', p(m.dokunan)) + kutu('Sevk', fmt(m.sevk), '#175CD3', '#E8F1FD', p(m.sevk))
                + kutu('Hazır', fmt(m.hazir), '#067647', '#E7F6EC', p(m.hazir)) + kutu('Kalan', fmt(kalan), '#475467', '#F2F4F7', p(kalan));
        } else {
            const dok = a.dokuma || {};
            kutular = kutu('Dokuma', fmt(dok.ikinci || dok.metre || 0), '#0E7C70', '#E3F5F2', p(dok.ikinci || 0)) + kutu('Kesim', fmt(a.kesim), '#C4320A', '#FEEFE6', p(a.kesim))
                + kutu('Kalite', fmt(a.kalite), '#6927DA', '#F2EEFF', p(a.kalite)) + kutu('Sevk', fmt(a.sevk), '#175CD3', '#E8F1FD', p(a.sevk));
        }
        const alt = [k.kod, k.renk, k.ebat].filter(v => String(v || '').trim()).join(' · ');
        return `<div class="kalem-kart">
            <div class="kalem-ust"><span class="kalem-no">${i + 1}</span>
                <span class="satir-orta"><span style="font-weight:600">${esc(k.ad || '—')}</span><span class="alt">${esc(alt || (a && a.kumas ? 'Kumaş' : 'Mamül'))}</span></span>
                <span style="font-size:13px;font-weight:700;flex:none">${fmt(siparis)} ${esc(birim)}</span></div>
            <div class="asama-izgara">${kutular}</div></div>`;
    }

    function uyariCiz() {
        const l = uyarilar();
        return `<div class="bant"><div class="bant-ust"><span class="bant-baslik">Uyarılar</span><span class="sayi-hap">${l.length} açık</span>${bantDugmeleri()}</div></div>
            ${yukleniyorSerit()}
            <div class="kartlar">${l.length ? l.map((x, i) => {
                const sv = ERP_UYARI_SEVIYE[x.seviye] || ERP_UYARI_SEVIYE.BILGI;
                const [r, z] = x.seviye === 'KRITIK' ? ['#B42318', '#FEECEB'] : x.seviye === 'UYARI' ? ['#B54708', '#FEF4E6'] : ['#175CD3', '#E8F1FD'];
                const acik = D.acikUyari === i, orn = x.ornekler || [];
                const git = x.mod === 'SIPARIS_LISTE' ? `<button class="cip" style="background:#E7EBF8;align-self:flex-start" data-is="liste" data-d="${x.id === 'sip-geciken' ? 'geciken' : x.id === 'sip-yakin' ? 'yakin' : 'acik'}">Siparişlerde gör</button>`
                    : x.mod ? `<button class="cip" style="background:#E7EBF8;align-self:flex-start" data-is="ekran-ac" data-d="${esc(x.mod)}">${esc(modAd(x.mod))} ekranını aç</button>` : '';
                return `<div class="uyari-kart">
                    <button style="display:flex;align-items:center;gap:12px;width:100%" data-is="uyari-ac" data-d="${i}">
                        <span class="simge" style="width:40px;height:40px;border-radius:13px;background:${z};color:${r}">${svg(I.ucgen)}</span>
                        <span class="satir-orta"><span style="font-weight:600">${esc(x.baslik)}</span><span class="alt">${esc(ERP_UYARI_GRUP[x.grup] || '')}${x.detay ? ' · ' + esc(x.detay) : ''}</span></span>
                        <span class="hap" style="background:${z};color:${r}">${esc(sv.ad)}</span></button>
                    ${orn.length ? `<div class="uyari-ornek">${(acik ? orn : orn.slice(0, 2)).map(t => `<span>${esc(t)}</span>`).join('')}${!acik && orn.length > 2 ? `<span style="color:#4A5FC1;font-weight:500">+${orn.length - 2} tane daha</span>` : ''}</div>` : ''}
                    ${acik || !orn.length ? git : ''}</div>`;
            }).join('') : `<div class="sip-kart"><div class="bos">${D.hazir.uyari ? 'Şu an uyarı yok.' : 'Uyarılar hesaplanıyor…'}</div></div>`}</div>`;
    }

    /* Ana programın menüsü: ERP_PERM_GROUP_DEFS (01) içindeki EKRANLAR (APP_MODE_WHITELIST), kişinin yetkisiyle */
    /* Mobilde başka grupta duran ekranlar (kullanıcı 23.10.2026: "iplik stoğunu dokumadan stok depo alanına alalım");
       ana programın menüsü değişmez. Ekran, hedef grupta MAMUL_DEPO'nun ardına girer. */
    const GRUP_TASI = { IPLIK: 'depo' };
    function ekranGruplari() {
        const tasinan = (k, gid) => !GRUP_TASI[k] || GRUP_TASI[k] === gid;
        const gruplar = ERP_PERM_GROUP_DEFS.map(g => {
            const kodlar = g.kodlar.filter(k => tasinan(k, g.id));
            Object.entries(GRUP_TASI).forEach(([k, gid]) => {
                if (gid !== g.id || kodlar.includes(k)) return;
                const i = kodlar.indexOf('MAMUL_DEPO');
                kodlar.splice(i >= 0 ? i + 1 : kodlar.length, 0, k);
            });
            return { id: g.id, ad: g.ad, kodlar: kodlar.filter(k => APP_MODE_WHITELIST.includes(k) && erpUserCan(k)) };
        }).filter(g => g.kodlar.length);
        if (erpIsAdmin()) gruplar.push({ id: 'yonetim', ad: 'Yönetim', kodlar: ['GUNLUK_ISLEMLER', 'KULLANICI_YONETIMI'] });
        return gruplar;
    }
    const GRUP_RENK = { genel: ['#3538CD', '#EEF0FF'], siparis: ['#175CD3', '#E8F1FD'], depo: ['#067647', '#E7F6EC'], dokuma: ['#0E7C70', '#E3F5F2'],
        terbiye: ['#C11574', '#FCE7F3'], konfeksiyon: ['#C4320A', '#FEEFE6'], kart: ['#6927DA', '#F2EEFF'], sistem: ['#475467', '#F2F4F7'], yonetim: ['#B54708', '#FEF4E6'] };
    function ekranAdi(kod) { return kod === 'GUNLUK_ISLEMLER' ? 'Günlük İşlemler' : kod === 'KULLANICI_YONETIMI' ? 'Kullanıcı Yönetimi' : modAd(kod); }
    function ekranSatir(kod) {
        const hazir = YENI_EKRANLAR.has(kod);
        return `<button class="ekran-satir" data-is="ekran-ac" data-d="${kod}"><span>${esc(ekranAdi(kod))}</span>
            <span class="nokta-k" style="background:${hazir ? '#17B26A' : '#D0D5DD'}"></span><span class="soluk" style="width:84px">${hazir ? 'Hazır' : 'Hazırlanıyor'}</span></button>`;
    }
    function ekranlarCiz() {
        return `<div class="bant"><div class="bant-ust"><span class="bant-baslik">Bütün ekranlar</span>${bantDugmeleri()}</div>
                <span class="bant-alt">Ana programdaki menünün aynısı · yeşil = hazır, gri = hazırlanıyor</span></div>
            <div class="kartlar">${ekranGruplari().map(g => {
                const [r, z] = GRUP_RENK[g.id] || GRUP_RENK.sistem;
                const acik = D.acikGrup === g.id;
                return `<div class="grup-kart"><button class="grup-bas" data-is="grup" data-d="${g.id}">
                        <span class="simge" style="width:40px;height:40px;border-radius:13px;background:${z};color:${r}">${gs(GRUP_SIMGE[g.id] || ekranSimge(g.kodlar[0]))}</span>
                        <span class="satir-orta"><span style="font-weight:600">${esc(g.ad)}</span><span class="alt tek-satir">${esc(g.kodlar.map(ekranAdi).join(', '))}</span></span>
                        <span class="hap" style="background:#F2F4F7;color:#475467">${g.kodlar.length}</span></button>
                    ${acik ? g.kodlar.map(ekranSatir).join('') : ''}</div>`;
            }).join('')}</div>`;
    }

    /* ════ STOK VE DEPO (22.10.2026) — sayılar ana programın fonksiyonlarından, burada hesap yok:
       kumaş   kumasStokListeHareketleri → kumasStokListeGruplariOlustur → kumasStokListeFiltreliGruplar
       mamül   mamulStokListeHareketleri → mamulStokHamGruplariOlustur → mamulStokListeFiltreliGruplar
       iplik   iplikStokListeGruplariOlustur → iplikStokListeFiltreliGruplar
       defter  depoHareketDefterSatirlari · Dokuma Depo dtDokumaDepoKdTopluYukle → dokumaDepoGorunurSatirlar
       fişler  muhasebeFisleriYukle → muhasebeFisFiltreUygula ════ */
    const STOK_EKRANLAR = ['KUMAS', 'MAMUL_DEPO', 'IPLIK', 'DOKUMA_DEPO', 'DEPO_HAREKET_LISTE', 'MUHASEBE_FIS'];
    const STOK_FILTRE_BOS = { q: '', tip: 'HEPSİ', bas: '', bit: '' };
    const stBos = () => ({ ara: '', filtre: 'POZITIF', tip: 'HEPSİ', grup: 'HEPSİ', durum: 'HEPSI', limit: LISTE_ADIM, acik: null,
        /* dokuma ekranları: Dokuma takip görünümü / seçili sipariş / dönem, tezgah sekmesi + süzgeçler, fason sekmesi + süzgeçler */
        gorunum: 'SIPARIS', sid: '', donem: 'GUN', tarih: '', kaynak: '', tpSekme: 'TEZGAH', tpDurum: 'HEPSI', tpTip: 'HEPSI',
        fsSekme: 'IS', fsDurum: 'AKTIF', fsIsDurum: 'HEPSI',
        /* konfeksiyon: ekran sekmesi (boş = ekranın ilk sekmesi), kalite "tüm aktif siparişler", planlama yer / planlılar, fason süzgeçleri */
        kfSekme: '', kfTumu: '', kpYer: 'HEPSI', kpPlanli: '', kfDurum: 'AKTIF', kfIs: 'HEPSI',
        /* planlama sekmesi + açık bekleyen kutusu, sevkiyat süzgeci, yapılacaklar durumu, rapor sekmesi */
        plSekme: 'OZET', plDetay: '', svTur: 'MAMUL', svGun: '7', ydDurum: 'ACIK', rpSekme: 'YR_OZET',
        /* fişler ve sevkiyat gün süzgeci (GUN_CIP) */
        gun: 'HEPSI',
        /* terbiye tür / görünüm / durum / boyahane, numune tür / durum, kart grubu */
        tbTur: 'BOBIN', tbGor: 'IS', tbDurum: 'ACIK', tbFirma: 'HEPSI', nmTur: 'KUMAS', nmDurum: 'ACIK', kSekme: 'IPLIK',
        /* günlük işlemler gün / kişi / tür, sayım tipi / ekran, fason defter türü, konfeksiyon fason görünümü */
        giGun: '', giKisi: '', giTur: '', syTip: 'MAMUL', syEkran: 'SAYIM', dfTur: 'HEPSI', kfsGor: 'SIPARIS' });
    D.st = stBos();
    D.dd = { satirlar: null, yukleniyor: false, hata: '' };
    D.fis = { liste: null, yukleniyor: false, hata: '' };
    const _stHam = {};
    function stHam(ad, fn) {
        const h = _stHam[ad];
        if (h && h.surum === D.surum) return h.deger;
        const deger = fn();
        _stHam[ad] = { surum: D.surum, deger };
        return deger;
    }
    const kumasHam = () => stHam('kumas', () => kumasStokListeGruplariOlustur(kumasStokListeHareketleri()));
    const mamulHam = () => stHam('mamul', () => mamulStokHamGruplariOlustur(mamulStokListeHareketleri()));
    const iplikHam = () => stHam('iplik', () => iplikStokListeGruplariOlustur((dataCache && dataCache.iplik_stok) || []));
    const stAra = () => D.st.ara.toLowerCase().trim();
    function stokPaket(kod, filtre) {
        const f = filtre || D.st.filtre;
        if (kod === 'KUMAS') return kumasStokListeFiltreliGruplar(kumasHam(), stAra(), f, STOK_FILTRE_BOS);
        if (kod === 'MAMUL_DEPO') return mamulStokListeFiltreliGruplar(mamulHam(), stAra(), f, STOK_FILTRE_BOS);
        return iplikStokListeFiltreliGruplar(iplikHam(), stAra(), f, STOK_FILTRE_BOS);
    }
    const fmt1 = (n) => (Number(n) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 1 });
    const tarihSaat = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); };
    const msTarih = (ms) => ms ? new Date(ms).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—';

    /* Dokuma Depo ve fişler ekran açılınca okunur (masaüstündeki gibi) */
    async function ddYukle(zorla) {
        if (D.dd.yukleniyor || (D.dd.satirlar && !zorla)) return;
        D.dd.yukleniyor = true; D.dd.hata = ''; ciz();
        const t0 = performance.now();
        try { D.dd.satirlar = await dtDokumaDepoKdTopluYukle(); }
        catch (e) { D.dd.hata = 'Dokuma Depo okunamadı: ' + (e && e.message ? e.message : e); D.dd.satirlar = null; }
        finally { D.dd.yukleniyor = false; D.sure['dokuma depo'] = Math.round(performance.now() - t0); ciz(); }
    }
    async function fisYukle(zorla) {
        if (D.fis.yukleniyor || (D.fis.liste && !zorla)) return;
        D.fis.yukleniyor = true; D.fis.hata = ''; ciz();
        const t0 = performance.now();
        try { D.fis.liste = await muhasebeFisleriYukle({ force: !!zorla }); }
        catch (e) { D.fis.hata = 'Fişler okunamadı: ' + (e && e.message ? e.message : e); D.fis.liste = null; }
        finally { D.fis.yukleniyor = false; D.sure['fişler'] = Math.round(performance.now() - t0); ciz(); }
    }

    function stokCiz() {
        const kart = (kod, renk, zemin, _ikon, deger, alt) => erpUserCan(kod) ? `<button class="kpi" style="width:100%" data-is="ekran-ac" data-d="${kod}">
            <span class="simge" style="background:${zemin};color:${renk}">${gs(ekranSimge(kod))}</span>
            <span class="satir-orta"><span style="font-weight:600">${esc(modAd(kod))}</span><span class="alt">${alt}</span></span>
            <span style="font-size:16px;font-weight:700;flex:none;text-align:right">${deger}</span></button>` : '';
        let kumas = '…', mamul = '…', iplik = '…', kAlt = '', mAlt = '', iAlt = '', defter = '…';
        if (D.hazir.sip) {
            try {
                const k = stokPaket('KUMAS', 'POZITIF'), m = stokPaket('MAMUL_DEPO', 'POZITIF'), ip = stokPaket('IPLIK', 'POZITIF');
                kumas = `${fmt1(k.topNetMt)} mt`; kAlt = `${k.grps.length} kalem · ${fmt1(k.topNet)} kg`;
                mamul = `${fmt(m.topNet)} ad`; mAlt = `${m.grps.length} kalem stokta`;
                iplik = `${fmt1(ip.topNet)} kg`; iAlt = `${ip.grps.length} kalem stokta`;
                const bugun = erpYerelGun();
                const o = depoHareketDefterSatirlari({ q: '', tip: 'HEPSİ', bas: bugun, bit: bugun }, 'HEPSİ').ozet;
                defter = `${o.gN + o.cN}`;
            } catch (e) { console.warn('stok özeti', e); }
        }
        const ddAlt = D.dd.satirlar ? (() => { const g = dokumaDepoGorunurSatirlar(D.dd.satirlar, { q: '', durum: 'HEPSI', siparisId: '' }); return [`${fmt1(g.ozetMt)} mt`, g.ozetKg ? `${fmt1(g.ozetKg)} kg` : '', g.ozetAd ? `${fmt(g.ozetAd)} ad` : ''].filter(Boolean).join(' · '); })() : 'Açınca okunur';
        const fisAlt = D.fis.liste ? `${D.fis.liste.filter(f => erpYerelGun(f.created_at) === erpYerelGun()).length} fiş bugün` : 'Açınca okunur';
        const digerleri = ['STOK_SAYIM', 'KART_LISTE'].filter(k => erpUserCan(k));
        return `<div class="bant"><div class="bant-ust"><span class="bant-baslik">Stok ve depo</span>${bantDugmeleri()}</div>
                <span class="bant-alt">Rakamlar ana programın stok ekranlarıyla aynı · stokta olanlar</span></div>
            ${yukleniyorSerit()}
            <div class="kartlar">
                ${kart('KUMAS', '#0E7C70', '#E3F5F2', null, kumas, kAlt)}
                ${kart('MAMUL_DEPO', '#3538CD', '#EEF0FF', null, mamul, mAlt)}
                ${kart('IPLIK', '#C11574', '#FCE7F3', null, iplik, iAlt)}
                ${kart('DOKUMA_DEPO', '#C4320A', '#FEEFE6', null, '', esc(ddAlt))}
                ${kart('DEPO_HAREKET_LISTE', '#175CD3', '#E8F1FD', null, defter, 'bugünkü giriş + çıkış')}
                ${kart('MUHASEBE_FIS', '#067647', '#E7F6EC', null, '', esc(fisAlt))}
                ${digerleri.length ? `<div class="grup-kart">${digerleri.map(k => `<button class="grup-bas" data-is="ekran-ac" data-d="${k}"><span class="satir-orta"><span style="font-weight:600">${esc(modAd(k))}</span><span class="alt">${YENI_EKRANLAR.has(k) ? 'Kartlar, lotlar, varyantlar' : 'Hazırlanıyor'}</span></span>${svg(I.sag, 16)}</button>`).join('')}</div>` : ''}
            </div>`;
    }

    /* Ekran başı: geri, başlık, arama, çipler — gövde ayrı çizilir (aramada klavye kapanmasın) */
    function stokEkranBas(baslik, ipucu, cipler, govdeHtml) {
        return `<div class="bant"><div class="bant-ust" style="gap:6px"><button class="geri" data-is="geri" aria-label="Geri">${svg(I.geri, 22, 2.2)}</button>
                <span class="bant-baslik">${esc(baslik)}</span><button class="yuvarlak-dugme ${D.yukleniyor || D.dd.yukleniyor || D.fis.yukleniyor ? 'donuyor' : ''}" data-is="st-yenile" aria-label="Yenile">${gs('yenile', 19)}</button></div>
                <label class="arama">${gs('ara', 18)}<span style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Ara</span>
                    <input type="search" id="ym-st-ara" value="${esc(D.st.ara)}" placeholder="${esc(ipucu)}" autocomplete="off" data-canli="serbest"></label>
                ${cipler.map(c => `<div class="yatay cipler">${c}</div>`).join('')}
            </div>${yukleniyorSerit()}<div id="ym-st-govde">${govdeHtml || ''}</div>`;
    }
    const cip = (is, deger, ad, secili, sayi) => `<button class="cip ${secili ? 'secili' : ''}" data-is="${is}" data-d="${esc(deger)}">${esc(ad)}${sayi != null ? `<b>${sayi}</b>` : ''}</button>`;
    const ozetSatir = (parcalar) => `<div style="display:grid;grid-template-columns:repeat(${parcalar.length},minmax(0,1fr));gap:8px;padding:12px 16px 0">${parcalar.map(([ad, deger, renk]) =>
        `<div class="kpi" style="flex-direction:column;align-items:flex-start;gap:2px;padding:10px 12px"><span class="kpi-ad">${esc(ad)}</span><span style="font-size:16px;font-weight:700;color:${renk || '#101828'}">${deger}</span></div>`).join('')}</div>`;
    const dahaDugme = (n) => n > D.st.limit ? `<button class="daha" data-is="st-daha">${n - D.st.limit} tane daha göster</button>` : '';
    const bilgiSatiri = (a, d) => d === '' || d == null ? '' : `<div class="bilgi-satir"><span class="soluk" style="font-size:13px">${esc(a)}</span><span class="d">${esc(d)}</span></div>`;

    function stokGrupEkran(kod) {
        const p = stokPaket(kod);
        const say = p.sayac || {};
        const cipler = [cip('st-suz', 'POZITIF', 'Stokta', D.st.filtre === 'POZITIF', say.pozitif), cip('st-suz', 'HEPSI', 'Tümü', D.st.filtre === 'HEPSI', say.hepsi), cip('st-suz', 'KRITIK', 'Tükendi', D.st.filtre === 'KRITIK', say.kritik)];
        const ipucu = kod === 'IPLIK' ? 'İplik kodu, no, marka, lot…' : 'Stok kodu, ürün, renk…';
        return stokEkranBas(modAd(kod), ipucu, [cipler.join('')], stokGrupGovde(kod, p));
    }
    function stokGrupGovde(kod, p) {
        p = p || stokPaket(kod);
        if (!D.hazir.sip) return '<div class="kartlar"><div class="sip-kart"><div class="bos">Stok yükleniyor…</div></div></div>';
        const ozet = kod === 'KUMAS' ? ozetSatir([['Net metre', `${fmt1(p.topNetMt)} mt`], ['Net kg', `${fmt1(p.topNet)} kg`], ['Kalem', fmt(p.grps.length)]])
            : kod === 'MAMUL_DEPO' ? ozetSatir([['Net adet', `${fmt(p.topNet)} ad`], ['Kalem', fmt(p.grps.length)]])
            : ozetSatir([['Net kg', `${fmt1(p.topNet)} kg`], ['Kalem', fmt(p.grps.length)]]);
        const kartlar = p.grps.slice(0, D.st.limit).map(g => kod === 'KUMAS' ? kumasKart(g) : kod === 'MAMUL_DEPO' ? mamulKart(g) : iplikKart(g)).join('');
        return `${ozet}<div class="kartlar">${kartlar || '<div class="sip-kart"><div class="bos">Bu süzgeçte kalem yok.</div></div>'}${dahaDugme(p.grps.length)}</div>`;
    }
    const negRenk = (n) => (Number(n) || 0) < 0 ? '#B42318' : '#101828';
    function stokKartCerceve(anahtar, renk, zemin, harfMetin, baslik, alt, sagUst, sagAlt, acikHtml) {
        const acik = D.st.acik === anahtar;
        return `<div class="sip-kart" style="padding:0;gap:0"><button style="display:flex;align-items:center;gap:10px;padding:12px;width:100%" data-is="st-ac" data-d="${esc(anahtar)}">
            <span class="harf" style="background:${zemin};color:${renk};font-size:11px">${esc(harfMetin)}</span>
            <span class="satir-orta"><span style="font-weight:700" class="tek-satir">${esc(baslik)}</span><span class="alt tek-satir">${esc(alt)}</span></span>
            <span style="display:flex;flex-direction:column;align-items:flex-end;flex:none">${sagUst}<span class="soluk">${sagAlt}</span></span></button>
            ${acik ? `<div style="padding:0 14px 10px;border-top:1px solid var(--cizgi)">${acikHtml}</div>` : ''}</div>`;
    }
    function hareketDugmesi(ara, grup) {
        return `<button class="cip" style="background:#E7EBF8;margin-top:8px" data-is="st-hareket" data-d="${esc(grup + '|' + ara)}">Hareketlerini gör ${svg(I.sag, 14)}</button>`;
    }
    function kumasKart(g) {
        const sag = `<span style="font-size:15px;font-weight:700;color:${negRenk(g.net_mt)}">${fmt1(g.net_mt)} mt</span>`;
        const alt = [g.urun_adi !== g.stok_kodu ? g.urun_adi : '', g.renk].filter(Boolean).join(' · ') || g.kumas_cinsi || '';
        return stokKartCerceve('K|' + g.stok_kodu, '#0E7C70', '#E3F5F2', 'KU', g.stok_kodu, alt, sag, `${fmt1(g.net_kg)} kg${g.top_sayisi ? ' · ' + fmt(g.top_sayisi) + ' top' : ''}`,
            bilgiSatiri('Giriş', `${fmt1(g.giris_mt)} mt · ${fmt1(g.giris_kg)} kg`) + bilgiSatiri('Çıkış', `${fmt1(g.cikis_mt)} mt · ${fmt1(g.cikis_kg)} kg`)
            + bilgiSatiri('Hareket', fmt(g.hareket)) + bilgiSatiri('Son giriş', msTarih(g.son_giris_at)) + bilgiSatiri('Son çıkış', msTarih(g.son_cikis_at))
            + bilgiSatiri('Kumaş cinsi', g.kumas_cinsi) + bilgiSatiri('Renk kodu', g.renk_kodu) + bilgiSatiri('Tarak eni', g.tarak_eni)
            + hareketDugmesi(g.stok_kodu, 'KUMAS'));
    }
    function mamulKart(g) {
        const sag = `<span style="font-size:15px;font-weight:700;color:${negRenk(g.net_ad)}">${fmt(g.net_ad)} ad</span>`;
        const d = g._detay || {};
        const alt = [d.urun_adi || d.ad || '', d.ebat || '', d.renk || ''].filter(Boolean).join(' · ') || g.kumas_cinsi || '';
        return stokKartCerceve('M|' + g.stok_kodu, '#3538CD', '#EEF0FF', 'MA', g.stok_kodu, alt, sag, g.net_kg ? `${fmt1(g.net_kg)} kg` : '',
            bilgiSatiri('Giriş', `${fmt(g.giris_ad)} ad`) + bilgiSatiri('Çıkış', `${fmt(g.cikis_ad)} ad`) + bilgiSatiri('Hareket', fmt(g.hareket))
            + bilgiSatiri('Son giriş', msTarih(g.son_giris_at)) + bilgiSatiri('Son çıkış', msTarih(g.son_cikis_at)) + bilgiSatiri('Son çıkış firması', g.son_cikis_firma)
            + bilgiSatiri('Cins', g.kumas_cinsi) + hareketDugmesi(g.stok_kodu, 'MAMUL_DEPO'));
    }
    function iplikKart(g) {
        const sag = `<span style="font-size:15px;font-weight:700;color:${negRenk(g.net_kg)}">${fmt1(g.net_kg)} kg</span>`;
        const lotlar = (g.lots || []).map(l => `<div class="bilgi-satir"><span><span style="font-weight:500">${esc(l.lot_no)}</span> <span class="soluk">${esc(l.marka || '')}</span></span><span class="d" style="color:${negRenk(l.net_kg)}">${fmt1(l.net_kg)} kg</span></div>`).join('');
        return stokKartCerceve('I|' + g.stok_kodu, '#C11574', '#FCE7F3', 'İP', `${g.stok_kodu} · ${g.iplik_no}`, [g.marka, g.cins].filter(x => x && x !== 'GENEL' && x !== '---').join(' · '), sag, `${g.lot_sayisi} lot`,
            `<div class="soluk" style="padding-top:8px;font-size:12px">Lotlar</div>${lotlar}` + hareketDugmesi(g.stok_kodu, 'IPLIK'));
    }

    /* Depo hareketleri: ana programın defteri, sekme (kanal) + giriş/çıkış */
    function defterEkran() {
        const gruplar = [['HEPSİ', 'Tümü'], ['IPLIK', 'İplik'], ['KUMAS', 'Kumaş'], ['MAMUL_DEPO', 'Mamül']];
        const tipler = [['HEPSİ', 'Hepsi'], ['GİRİŞ', 'Depo girişi'], ['ÇIKIŞ', 'Sevkiyat']];
        return stokEkranBas(modAd('DEPO_HAREKET_LISTE'), 'Stok kodu, ürün, firma, irsaliye…',
            [gruplar.map(([k, a]) => cip('st-grup', k, a, D.st.grup === k)).join(''), tipler.map(([k, a]) => cip('st-tip', k, a, D.st.tip === k)).join('')], defterGovde());
    }
    function defterGovde() {
        if (!D.hazir.sip) return '<div class="kartlar"><div class="sip-kart"><div class="bos">Hareketler yükleniyor…</div></div></div>';
        const { rows, ozet } = depoHareketDefterSatirlari({ q: D.st.ara, tip: D.st.tip, bas: '', bit: '' }, D.st.grup);
        const miktar = (kg, mt, ad) => [mt ? `${fmt1(mt)} mt` : '', kg ? `${fmt1(kg)} kg` : '', ad ? `${fmt(ad)} ad` : ''].filter(Boolean).join(' · ') || '0';
        const ozetHtml = ozetSatir([['Giriş · ' + fmt(ozet.gN) + ' satır', miktar(ozet.gKg, ozet.gMt, ozet.gAd), '#067647'], ['Çıkış · ' + fmt(ozet.cN) + ' satır', miktar(ozet.cKg, ozet.cMt, ozet.cAd), '#B42318']]);
        const satirlar = rows.slice(0, D.st.limit).map(r => {
            const tip = depoHareketDefterIslemTip(r), ch = depoHareketDefterKanalBul(r);
            const giris = tip === 'GİRİŞ';
            const ad = r.iplik_no ? `${r.stok_kodu || ''} · ${r.iplik_no}` : (r.stok_kodu || r.desen_kodu || '—');
            const ad2 = [r.kumas_cinsi || r.urun_adi || r.cins || '', r.renk || '', r.lot_no ? 'Lot ' + r.lot_no : ''].filter(Boolean).join(' · ');
            return `<div class="satir"><span class="etiket-kare" style="background:${giris ? '#E7F6EC' : tip === 'ÇIKIŞ' ? '#FEECEB' : '#F2F4F7'};color:${giris ? '#067647' : tip === 'ÇIKIŞ' ? '#B42318' : '#475467'}">${giris ? 'G' : tip === 'ÇIKIŞ' ? 'Ç' : '?'}</span>
                <span class="satir-orta"><span class="ust tek-satir">${esc(ad)}</span><span class="alt tek-satir">${esc(ad2)}</span>
                <span class="alt tek-satir">${esc([ch.etiket, r.firma, r.updated_by].filter(Boolean).join(' · '))}</span></span>
                <span style="display:flex;flex-direction:column;align-items:flex-end;flex:none;gap:2px"><span style="font-weight:600;font-size:13px">${esc(muhasebeFisKalemMiktarYazi({ mt: r.miktar_mt, kg: r.miktar_kg, adet: r.cuval_sayisi }))}</span><span class="soluk">${esc(tarihSaat(r.created_at))}</span></span></div>`;
        }).join('');
        return `${ozetHtml}<div class="kartlar"><div class="liste-kutu" style="margin:0">${satirlar || '<div class="bos">Bu süzgeçte hareket yok.</div>'}</div>${dahaDugme(rows.length)}</div>`;
    }

    /* Dokuma Depo: kalemlerin depoda kalanı (ortak kural) + sevk edilenler */
    function ddEkran() {
        if (!D.dd.satirlar && !D.dd.yukleniyor && !D.dd.hata) setTimeout(() => ddYukle(false), 0);
        const g = D.dd.satirlar ? dokumaDepoGorunurSatirlar(D.dd.satirlar, { q: '', durum: 'HEPSI', siparisId: '' }) : null;
        const durumlar = [['HEPSI', 'Hepsi', g ? g.rows.length : null], ['DEPO', 'Depoda', g ? g.bekleyen : null], ['SEVK', 'Sevk edildi', g ? g.sevkEdilen : null]];
        return stokEkranBas(modAd('DOKUMA_DEPO'), 'Sipariş, ürün, firma, renk…', [durumlar.map(([k, a, n]) => cip('st-durum', k, a, D.st.durum === k, n)).join('')], ddGovde());
    }
    function ddGovde() {
        if (D.dd.hata) return `<div class="kartlar"><div class="sip-kart"><div class="bos" style="color:#B42318">${esc(D.dd.hata)}</div></div></div>`;
        if (!D.dd.satirlar) return '<div class="kartlar"><div class="sip-kart"><div class="bos">Dokuma Depo okunuyor…</div></div></div>';
        const g = dokumaDepoGorunurSatirlar(D.dd.satirlar, { q: D.st.ara, durum: D.st.durum, siparisId: '' });
        const ozetHtml = ozetSatir([['Metre', `${fmt1(g.ozetMt)} mt`], ['Kg', `${fmt1(g.ozetKg)} kg`], ['Adet', `${fmt(g.ozetAd)} ad`]]);
        let sonFirma = null;
        const satirlar = g.rows.slice(0, D.st.limit).map(r => {
            const baslik = r.firma !== sonFirma ? `<div class="soluk" style="padding:10px 4px 4px;font-weight:600;font-size:12px">${esc(r.firma || '—')}</div>` : '';
            sonFirma = r.firma;
            const miktar = [r.miktar_mt ? `${fmt1(r.miktar_mt)} mt` : '', r.miktar_kg ? `${fmt1(r.miktar_kg)} kg` : '', r.cuval_sayisi ? `${fmt(r.cuval_sayisi)} ad` : ''].filter(Boolean).join(' · ') || '0';
            const sevk = !r._kdOnly && g.sevkSet.has(String(r.id));
            return `${baslik}<div class="sip-kart" style="flex-direction:row;align-items:center;gap:10px">
                <span class="satir-orta"><span style="font-weight:600" class="tek-satir">${esc(r.kumas_cinsi || r.stok_kodu || '—')}</span>
                <span class="alt tek-satir">${esc([g.kayitSnoAl(r), r.renk, r.urun_ebat].filter(Boolean).join(' · '))}</span></span>
                <span style="display:flex;flex-direction:column;align-items:flex-end;flex:none;gap:2px"><span style="font-weight:700;font-size:13px">${esc(miktar)}</span>
                <span class="hap" style="background:${sevk ? '#E8F1FD' : '#E7F6EC'};color:${sevk ? '#175CD3' : '#067647'}">${sevk ? 'Sevk edildi' : 'Depoda'}</span></span></div>`;
        }).join('');
        const sevkler = dokumaDepoSevkEdilenSatirlari();
        const hedefAd = { MUSTERI: 'Müşteri', BOYAHANE: 'Terbiye', GENEL_DEPO: 'Genel Depo', KONFEKSIYON: 'Konfeksiyon' };
        const sevkHtml = sevkler.slice(0, 40).map(r => {
            const hedef = String(depoSevkYerOku(r.notlar) || '').toUpperCase();
            return `<div class="satir"><span class="satir-orta"><span class="ust tek-satir">${esc(r.siparis_sno || r.lot_no || '—')} · ${esc(r.kumas_cinsi || r.stok_kodu || '—')}</span>
                <span class="alt tek-satir">${esc([hedefAd[hedef] || hedef, r.updated_by].filter(Boolean).join(' · '))}</span></span>
                <span style="display:flex;flex-direction:column;align-items:flex-end;flex:none"><span style="font-weight:600;font-size:13px">${esc(muhasebeFisKalemMiktarYazi({ mt: r.miktar_mt, kg: r.miktar_kg, adet: r.cuval_sayisi, dokuma_depo: true }))}</span><span class="soluk">${esc(tarihSaat(r.created_at))}</span></span></div>`;
        }).join('');
        return `${ozetHtml}<div class="kartlar">${satirlar || '<div class="sip-kart"><div class="bos">Bu süzgeçte satır yok.</div></div>'}${dahaDugme(g.rows.length)}</div>
            ${sevkler.length ? `<div class="bolum-baslik"><span>Sevk edilenler</span><span class="soluk" style="font-size:12px;font-weight:400">son 60 gün · ${sevkler.length}</span></div>
            <div class="liste-kutu">${sevkHtml}${sevkler.length > 40 ? `<div class="bos">İlk 40 satır gösteriliyor.</div>` : ''}</div>` : ''}`;
    }

    /* Gün süzgeci (fişler + sevkiyat): Bugün / son 7 gün / son 30 gün / hepsi (yüklenen 120 gün) → { bas, bit } */
    const GUN_CIP = [['BUGUN', 'Bugün'], ['7', '7 gün'], ['30', '30 gün'], ['HEPSI', 'Hepsi']];
    function gunAraligi(kod) {
        if (!kod || kod === 'HEPSI') return { bas: '', bit: '' };
        const d = new Date();
        d.setDate(d.getDate() - (kod === 'BUGUN' ? 0 : parseInt(kod, 10) - 1));
        return { bas: erpYerelGun(d), bit: erpYerelGun() };
    }

    /* Sevkiyat fişleri: ana programın fişleri (hareketlerden türer) */
    function fisEkran() {
        if (!D.fis.liste && !D.fis.yukleniyor && !D.fis.hata) setTimeout(() => fisYukle(false), 0);
        const tipler = [['HEPSİ', 'Hepsi'], ['MAMUL', 'Mamül'], ['KUMAS', 'Kumaş'], ['DOKUMA', 'Dokuma depo'], ['IPLIK', 'İplik']];
        return stokEkranBas(modAd('MUHASEBE_FIS'), 'Fiş no, müşteri, plaka, ürün…', [tipler.map(([k, a]) => cip('st-tip', k, a, D.st.tip === k)).join(''),
            GUN_CIP.map(([k, a]) => cip('dk-set', 'gun=' + k, a, (D.st.gun || 'HEPSI') === k)).join('')], fisGovde());
    }
    function fisGovde() {
        if (D.fis.hata) return `<div class="kartlar"><div class="sip-kart"><div class="bos" style="color:#B42318">${esc(D.fis.hata)}</div></div></div>`;
        if (!D.fis.liste) return '<div class="kartlar"><div class="sip-kart"><div class="bos">Fişler okunuyor…</div></div></div>';
        const l = muhasebeFisFiltreUygula(D.fis.liste, Object.assign({ q: D.st.ara, tip: D.st.tip }, gunAraligi(D.st.gun)));
        const kartlar = l.slice(0, D.st.limit).map(f => {
            const acik = D.st.acik === 'F|' + f.id;
            const tip = muhasebeFisTipEtiket(f.depo_grup, f.kalemler);
            const kalemler = (f.kalemler || []).map(k => `<div class="bilgi-satir"><span><span style="font-weight:500">${esc(k.urun_adi || k.stok_kodu || '—')}</span>
                <span class="soluk"> ${esc([k.stok_kodu !== k.urun_adi ? k.stok_kodu : '', k.renk, k.ebat].filter(Boolean).join(' · '))}</span></span><span class="d">${esc(muhasebeFisFisMiktarYazi(k))}</span></div>`).join('');
            return `<div class="sip-kart" style="padding:0;gap:0"><button style="display:flex;flex-direction:column;gap:6px;padding:12px;width:100%" data-is="st-ac" data-d="${esc('F|' + f.id)}">
                <span style="display:flex;align-items:center;gap:8px;width:100%"><span style="font-weight:700">${esc(muhasebeFisGorunenNo(f))}</span>
                    <span class="hap" style="background:#E7EBF8;color:#3B4A7A">${esc(tip)}</span><span class="soluk" style="margin-left:auto">${esc(tarihSaat(f.created_at))}</span></span>
                <span style="display:flex;justify-content:space-between;gap:8px;width:100%"><span class="tek-satir" style="font-weight:500">${esc(f.musteri || '—')}</span>
                    <span style="font-weight:700;flex:none">${esc(muhasebeFisKalemToplamYazi(f.kalemler, f.depo_grup))}</span></span></button>
                ${acik ? `<div style="padding:0 14px 10px;border-top:1px solid var(--cizgi)">${kalemler}
                    ${bilgiSatiri('Teslim alan', f.teslim_alan)}${bilgiSatiri('Telefon', f.teslim_tel)}${bilgiSatiri('Plaka', f.plaka)}${bilgiSatiri('Şoför', f.sofor)}
                    ${bilgiSatiri('Adres', f.teslim_adres)}${bilgiSatiri('İrsaliye', f.irsaliye_no)}${bilgiSatiri('Not', f.notlar)}${bilgiSatiri('Kaydeden', f.created_by)}</div>` : ''}</div>`;
        }).join('');
        return `${ozetSatir([['Fiş', fmt(l.length)], ['Son 120 gün', 'yüklü']])}<div class="kartlar">${kartlar || '<div class="sip-kart"><div class="bos">Bu süzgeçte fiş yok.</div></div>'}${dahaDugme(l.length)}</div>`;
    }

    function stokEkranCiz() {
        if (D.ekran === 'DEPO_HAREKET_LISTE') return defterEkran();
        if (D.ekran === 'DOKUMA_DEPO') return ddEkran();
        if (D.ekran === 'MUHASEBE_FIS') return fisEkran();
        return stokGrupEkran(D.ekran);
    }
    function stokGovdeTazele() {
        const kap = document.getElementById('ym-st-govde'); if (!kap) return;
        if (DOKUMA_EKRANLAR.includes(D.ekran)) { kap.innerHTML = dokumaGovde(); return; }
        if (KONF_EKRANLAR.includes(D.ekran)) { kap.innerHTML = konfGovde(); return; }
        if (PLAN_EKRANLAR.includes(D.ekran)) { kap.innerHTML = planGovde(); return; }
        if (EK5_EKRANLAR.includes(D.ekran)) { kap.innerHTML = ek5Govde(); return; }
        if (YON_EKRANLAR.includes(D.ekran)) { kap.innerHTML = yonGovde(); return; }
        kap.innerHTML = D.ekran === 'DEPO_HAREKET_LISTE' ? defterGovde() : D.ekran === 'DOKUMA_DEPO' ? ddGovde() : D.ekran === 'MUHASEBE_FIS' ? fisGovde() : stokGrupGovde(D.ekran);
    }

    /* ════ DOKUMA (22.10.2026) — sayılar ana programın fonksiyonlarından, burada hesap yok:
       Dokuma takip  sipariş: dtFormVerisi (05) · hareket: dtRaporVeriYukle → dtRaporModeli (04)
       Tezgah        tpYukle → tpOzetModeli / tpFiltreliTezgahlar / tpGanttParcalar / tpBekleyenSatirlari / tpDikkatListesi (05)
       Dokuma fason  dokumaFasonListeModeli · dokumaFasonIplikHesabi / Satirlari (14) · fasonCbListeModeli (41) ════ */
    const DOKUMA_EKRANLAR = ['DOKUMA_TAKIP', 'TEZGAH_PLANLAMA', 'DOKUMA_FASON_TAKIP'];
    /* form = seçili siparişin modeli { sid, m }; formOku / hareket / tp / fs = okundu mu (…Yuk = okunuyor) */
    D.dk = { form: null, formOku: false, formOkuYuk: false, hareket: false, hareketYuk: false, tp: false, tpYuk: false, fs: false, fsYuk: false, hata: '' };
    async function dkYukle(ne, fn) {
        const yuk = ne + 'Yuk';
        if (D.dk[yuk]) return;
        D.dk[yuk] = true; D.dk.hata = ''; ciz();
        const t0 = performance.now();
        try { await fn(); D.dk[ne] = true; }
        catch (e) { D.dk.hata = 'Okunamadı: ' + (e && e.message ? e.message : e); }
        finally { D.dk[yuk] = false; D.sure[ne] = Math.round(performance.now() - t0); ciz(); }
    }
    const dkFormYukle = (sid) => dkYukle('formOku', async () => { D.dk.form = null; D.dk.form = { sid, m: await dtFormVerisi(sid) }; });
    const dkHareketYukle = (zorla) => { if (zorla) _dtRaporVeri = { ts: 0, girisler: null, tarihsiz: 0, bekleyen: null }; return dkYukle('hareket', () => dtRaporVeriYukle()); };
    const dkTpYukle = (zorla) => dkYukle('tp', () => tpYukle(!!zorla));
    const dkFsYukle = (zorla) => dkYukle('fs', () => Promise.all([dokumaFasonSiparisleriYukle(!!zorla), fasonAkisYukle(!!zorla)]));
    const dkBekliyor = (metin) => `<div class="kartlar"><div class="sip-kart"><div class="bos">${esc(metin)}</div></div></div>`;
    const dkHata = () => D.dk.hata ? `<div class="kartlar"><div class="sip-kart"><div class="bos" style="color:#B42318">${esc(D.dk.hata)}</div></div></div>` : '';
    const sayiMt = (n) => `${fmt1(n)} m`;

    function dokumaEkranCiz() {
        const s = D.st;
        if (D.ekran === 'DOKUMA_TAKIP') {
            const cip1 = [cip('dk-set', 'gorunum=SIPARIS', 'Sipariş takip', s.gorunum === 'SIPARIS'), cip('dk-set', 'gorunum=HAREKET', 'Hareket kayıtları', s.gorunum === 'HAREKET')].join('');
            const satirlar = [cip1];
            if (s.gorunum === 'HAREKET') {
                satirlar.push([['GUN', 'Günlük'], ['HAFTA', 'Haftalık'], ['AY', 'Aylık']].map(([k, a]) => cip('dk-set', 'donem=' + k, a, s.donem === k)).join(''));
            }
            return stokEkranBas(modAd('DOKUMA_TAKIP'), s.gorunum === 'HAREKET' ? 'Sipariş, müşteri, ürün, giren…' : 'Sipariş no, müşteri, ürün…', satirlar, dokumaGovde());
        }
        if (D.ekran === 'TEZGAH_PLANLAMA') {
            const sekmeler = [['TEZGAH', 'Tezgahlar'], ['BEKLEYEN', 'Bekleyen siparişler'], ['DIKKAT', 'Dikkat']].map(([k, a]) => cip('dk-set', 'tpSekme=' + k, a, s.tpSekme === k)).join('');
            const satirlar = [sekmeler];
            if (s.tpSekme === 'TEZGAH' && D.dk.tp) {
                const om = tpOzetModeli();
                satirlar.push([['HEPSI', 'Hepsi', _tpCache.tezgahlar.length], ['DOKUYOR', 'Dokuyor', om.DOKUYOR], ['DURUYOR', 'Duruyor', om.DURUYOR], ['BOSTA', 'Boşta', om.BOSTA], ['GEC', 'Termini aşacak', om.GEC]]
                    .map(([k, a, n]) => cip('dk-set', 'tpDurum=' + k, a, s.tpDurum === k, n)).join(''));
                satirlar.push([['HEPSI', 'Hepsi'], ['ARMÜR', 'Armürlü'], ['JAKAR', 'Jakarlı']].map(([k, a]) => cip('dk-set', 'tpTip=' + k, a, s.tpTip === k)).join(''));
            }
            return stokEkranBas(modAd('TEZGAH_PLANLAMA'), 'Sipariş, müşteri, ürün, tezgah…', satirlar, dokumaGovde());
        }
        const sekmeler = [['IS', 'Dokuma işleri'], ['COZGU', 'Çözgücüler'], ['BUKUM', 'Bükümcüler'], ['FIRMA', 'Firmalar & cari'], ['DEFTER', 'İşlem defteri']].map(([k, a]) => cip('dk-set', 'fsSekme=' + k, a, s.fsSekme === k)).join('');
        const satirlar = [sekmeler];
        if (s.fsSekme === 'DEFTER') satirlar.push(dfTurCip());
        if (s.fsSekme === 'IS') {
            satirlar.push([['AKTIF', 'Aktif'], ['TAMAMLANDI', 'Tamamlanan'], ['HEPSI', 'Tümü']].map(([k, a]) => cip('dk-set', 'fsDurum=' + k, a, s.fsDurum === k)).join('')
                + [['HEPSI', 'Tüm işler'], ['ACIK', 'Açık'], ['GECIKEN', 'Termini geçen'], ['EKSIK', 'Bilgisi eksik']].map(([k, a]) => cip('dk-set', 'fsIsDurum=' + k, a, s.fsIsDurum === k)).join(''));
        }
        return stokEkranBas(modAd('DOKUMA_FASON_TAKIP'), s.fsSekme === 'IS' ? 'Sipariş no, kumaş, firma…' : 'Firma, iplik kodu…', satirlar, dokumaGovde());
    }
    function dokumaGovde() {
        if (D.ekran === 'DOKUMA_TAKIP') return D.st.gorunum === 'HAREKET' ? dtHareketGovde() : dtSiparisGovde();
        if (D.ekran === 'TEZGAH_PLANLAMA') return tezgahGovde();
        return fasonGovde();
    }

    /* ── Dokuma takip · sipariş ── */
    function dtSiparisGovde() {
        const s = D.st;
        if (!s.sid) {
            const q = stAra();
            const l = siparisler().filter(x => !siparisKapaliMi(x)).filter(x => !q || aramaUyar(x, q))
                .sort((a, b) => siraAnahtar(a) - siraAnahtar(b));
            const kartlar = l.slice(0, s.limit).map(x => {
                const [renk, zemin] = durumRenk(x);
                return `<button class="sip-kart" data-is="dk-sip" data-d="${esc(x.id)}"><span class="sip-ust">
                    <span class="harf" style="background:${zemin};color:${renk}">${esc(harf(x.firma))}</span>
                    <span class="satir-orta"><span class="sip-no">${esc(x.sno || '—')}</span><span class="alt tek-satir">${esc(x.firma || '—')} · ${siparisListeKalemleriArr(x).length} kalem</span></span>
                    ${svg(I.sag, 16)}</span></button>`;
            }).join('');
            return `<div class="kartlar"><div class="soluk" style="padding:0 4px">Dokuma girişlerini görmek için sipariş seçin</div>${kartlar || '<div class="sip-kart"><div class="bos">Açık sipariş yok.</div></div>'}${dahaDugme(l.length)}</div>`;
        }
        if (!D.dk.form || String(D.dk.form.sid) !== String(s.sid)) {
            if (!D.dk.formOkuYuk) setTimeout(() => dkFormYukle(s.sid), 0);
            return dkHata() || dkBekliyor('Siparişin dokuma kayıtları okunuyor…');
        }
        const m = D.dk.form.m;
        if (!m) return dkBekliyor('Sipariş bulunamadı.');
        const geri = `<button class="cip" style="background:#E7EBF8;margin:12px 16px 0" data-is="dk-set" data-d="sid=">${svg(I.geri, 14)} ${esc(m.siparis.sno || '')} · ${esc(m.siparis.firma || '')} — başka sipariş</button>`;
        const ozet = ozetSatir([['Toplam metre', `${m.toplamMetre.toFixed(1)} m`], [m.ikinciToplamLabel, `${m.ikinciToplamDeger} ${m.ikinciToplamUnit}`], ['Sipariş adedi', fmt(m.siparisAdedi)]]);
        const kalemler = m.satirlar.map(({ i, kb, k, u, birim, siparisMiktar, alan }) => {
            const sipMetin = birim === 'ADET' ? Math.round(siparisMiktar).toLocaleString('tr-TR') : siparisMiktar.toFixed(1);
            const alt = kb ? `ham · yalnız metre · ${kb.kalemSay} kalem bu kumaştan kesilir${kb.km.kod ? ' · ' + kb.km.kod : ''}` : [k.kod, k.renk, k.ebat, birim].filter(Boolean).join(' · ');
            const kutu = (ad, deger, renk, zemin) => `<div class="asama-kutu" style="background:${zemin}"><span class="d" style="color:${renk}">${deger}</span><span class="a">${ad}</span></div>`;
            return `<div class="kalem-kart"><div class="kalem-ust"><span class="kalem-no">${i + 1}</span>
                <span class="satir-orta"><span style="font-weight:600">${esc(k.ad || k.kod || 'Ürün ' + (i + 1))}${kb ? ' <span class="hap" style="background:#FEF4E6;color:#B54708">KUMAŞ</span>' : ''}</span><span class="alt">${esc(alt)}</span></span>
                <span style="font-size:13px;font-weight:700;flex:none">${esc(sipMetin)} ${esc(birim.toLowerCase())}</span></div>
                <div class="asama-izgara" style="grid-template-columns:repeat(${1 + (alan.kg ? 1 : 0) + (alan.adet ? 1 : 0)},minmax(0,1fr))">
                    ${kutu('Dokunan metre', `${parseFloat(u.toplam_metre || 0).toFixed(1)} m`, '#0E7C70', '#E3F5F2')}
                    ${alan.kg ? kutu('Dokunan kg', `${parseFloat(u.toplam_kg || 0).toFixed(1)} kg`, '#6927DA', '#F2EEFF') : ''}
                    ${alan.adet ? kutu('Dokunan adet', `${parseInt(u.toplam_adet || 0)} ad`, '#067647', '#E7F6EC') : ''}
                </div></div>`;
        }).join('');
        const girisler = m.girisler.slice(0, 80).map(({ g, ad }) => {
            const h = Array.isArray(g.gecmis) ? g.gecmis[g.gecmis.length - 1] : null;
            const miktar = [g.metre ? '+' + parseFloat(g.metre).toFixed(1) + ' m' : '', g.kg ? '+' + parseFloat(g.kg).toFixed(1) + ' kg' : '', g.adet ? '+' + g.adet + ' ad' : ''].filter(Boolean).join(' · ');
            return `<div class="satir"><span class="satir-orta"><span class="ust tek-satir">${esc(ad)}</span>
                <span class="alt tek-satir">${esc([g.user || g.kullanici || '—', h ? 'düzeltildi: ' + (h.user || '—') : ''].filter(Boolean).join(' · '))}</span></span>
                <span style="display:flex;flex-direction:column;align-items:flex-end;flex:none"><span style="font-weight:600;font-size:13px">${esc(miktar)}</span><span class="soluk">${esc(g.tarih || '')}</span></span></div>`;
        }).join('');
        return `${geri}${ozet}<div class="kartlar">${kalemler || '<div class="sip-kart"><div class="bos">Sipariş kalemi yok.</div></div>'}</div>
            ${m.girisler.length ? `<div class="bolum-baslik"><span>Giriş geçmişi</span><span class="soluk" style="font-size:12px;font-weight:400">${m.girisler.length} giriş</span></div>
            <div class="liste-kutu">${girisler}${m.girisler.length > 80 ? '<div class="bos">Son 80 giriş gösteriliyor.</div>' : ''}</div>` : ''}`;
    }

    /* ── Dokuma takip · hareket kayıtları ── */
    function dtDonemEtiket(donem, aralik) {
        const son = new Date(aralik.bit); son.setDate(son.getDate() - 1);
        if (donem === 'AY') return aralik.bas.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
        if (donem === 'HAFTA') return `${aralik.bas.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} – ${son.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        return aralik.bas.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
    }
    function dtHareketGovde() {
        if (!D.dk.hareket) {
            if (!D.dk.hareketYuk) setTimeout(() => dkHareketYukle(false), 0);
            return dkHata() || dkBekliyor('Dokuma girişleri okunuyor…');
        }
        const s = D.st;
        const md = dtRaporModeli(_dtRaporVeri.girisler || [], { donem: s.donem, tarih: s.tarih, q: s.ara, kaynak: s.kaynak });
        const t = md.t;
        const nav = `<div style="display:flex;align-items:center;gap:8px;padding:12px 16px 0">
            <button class="yuvarlak-dugme" style="width:38px;height:38px" data-is="dk-kaydir" data-d="-1" aria-label="Önceki dönem">${svg(I.geri, 18, 2.2)}</button>
            <span style="flex:1;text-align:center;font-weight:600">${esc(dtDonemEtiket(s.donem, md.aralik))}</span>
            <button class="yuvarlak-dugme" style="width:38px;height:38px" data-is="dk-kaydir" data-d="1" aria-label="Sonraki dönem">${svg(I.sag, 18, 2.2)}</button>
            ${s.tarih ? `<button class="cip" style="background:#E7EBF8" data-is="dk-set" data-d="tarih=">Bugün</button>` : ''}</div>`;
        const ozet = ozetSatir([['Top', fmt(t.top)], ['Metre', fmt1(t.m)], ...(t.kg ? [['KG', fmt1(t.kg)]] : []), ...(t.ad ? [['Adet', fmt(t.ad)]] : [])]);
        const kaynaklar = md.kaynaklar.length ? `<div class="yatay cipler" style="margin:12px 0 0;padding:0 16px">${md.kaynaklar.map(({ kod, ad, x }) =>
            cip('dk-set', 'kaynak=' + (s.kaynak === kod ? '' : kod), `${ad} · ${x.top} top · ${fmt1(x.m)} m`, s.kaynak === kod)).join('')}</div>` : '';
        if (!md.liste.length) return `${nav}${kaynaklar}<div class="kartlar"><div class="sip-kart"><div class="bos">Bu dönemde${s.kaynak ? ' bu kaynaktan' : ''}${md.kelimeler.length ? ' aramaya uyan' : ''} dokuma girişi yok.</div></div></div>`;
        const miktar = (x) => [x.m ? fmt1(x.m) + ' m' : '', x.kg ? fmt1(x.kg) + ' kg' : '', x.ad ? fmt(x.ad) + ' ad' : ''].filter(Boolean).join(' · ') || '—';
        const gunler = md.gunler ? `<div class="bolum-baslik"><span>Gün gün</span></div><div class="liste-kutu">${md.gunler.map(({ gun, x }) => `<div class="satir" style="${x.top ? '' : 'opacity:.45'}">
            <span class="satir-orta"><span class="ust">${esc(gun.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', weekday: 'short' }))}</span></span>
            <span style="display:flex;flex-direction:column;align-items:flex-end;flex:none"><span style="font-weight:600;font-size:13px">${esc(miktar(x))}</span><span class="soluk">${x.top || '—'} top</span></span></div>`).join('')}</div>` : '';
        const gruplar = `<div class="bolum-baslik"><span>Sipariş / ürün bazında</span><span class="soluk" style="font-size:12px;font-weight:400">${md.gruplar.length} ürün</span></div>
            <div class="liste-kutu">${md.gruplar.slice(0, 40).map(x => `<div class="satir"><span class="satir-orta"><span class="ust tek-satir">${esc(x.sno)} · ${esc(x.urun)}</span><span class="alt tek-satir">${esc(x.firma || '—')}</span></span>
            <span style="display:flex;flex-direction:column;align-items:flex-end;flex:none"><span style="font-weight:600;font-size:13px">${esc(miktar(x))}</span><span class="soluk">${x.top} top</span></span></div>`).join('')}
            ${md.gruplar.length > 40 ? '<div class="bos">İlk 40 ürün gösteriliyor.</div>' : ''}</div>`;
        const girisler = `<div class="bolum-baslik"><span>Girişler</span><span class="soluk" style="font-size:12px;font-weight:400">${md.liste.length} top</span></div>
            <div class="liste-kutu">${md.liste.slice(0, s.limit).map(r => `<div class="satir"><span class="satir-orta"><span class="ust tek-satir">${esc(r.sno)} · ${esc(r.urun)}</span>
            <span class="alt tek-satir">${esc([r.firma, dtRaporKaynakAd(r.kaynak), r.user].filter(Boolean).join(' · '))}</span></span>
            <span style="display:flex;flex-direction:column;align-items:flex-end;flex:none"><span style="font-weight:600;font-size:13px">${esc(miktar({ m: r.metre, kg: r.kg, ad: r.adet }))}</span><span class="soluk">${esc(tarihSaat(r.ms))}</span></span></div>`).join('')}</div>
            <div style="padding:0 16px">${dahaDugme(md.liste.length)}</div>`;
        return `${nav}${ozet}${kaynaklar}${gunler}${gruplar}${girisler}`;
    }

    /* ── Tezgah planlama ── */
    function tpFiltreKur() { _tpFiltre.q = D.st.ara; _tpFiltre.durum = D.st.tpDurum; _tpFiltre.tip = D.st.tpTip; }   /* ana programın süzgeç durumu (mobilde ekranı yok) */
    function tezgahGovde() {
        if (!D.dk.tp) {
            if (!D.dk.tpYuk) setTimeout(() => dkTpYukle(false), 0);
            return dkHata() || dkBekliyor('Tezgahlar okunuyor…');
        }
        tpFiltreKur();
        const s = D.st;
        if (s.tpSekme === 'DIKKAT') {
            const l = tpDikkatListesi();
            return `<div class="kartlar">${l.length ? `<div class="liste-kutu" style="margin:0">${l.map(x => `<div class="satir"><span class="satir-orta"><span style="font-size:13px;line-height:1.45">${x.metin}</span></span></div>`).join('')}</div>`
                : '<div class="sip-kart"><div class="bos" style="color:#067647">Şu an dikkat edilecek bir şey yok.</div></div>'}</div>`;
        }
        if (s.tpSekme === 'BEKLEYEN') {
            if (!_tpIhtiyac.ts) return dkBekliyor('Siparişler taranıyor…');
            const l = tpBekleyenSatirlari();
            const kartlar = l.slice(0, s.limit).map(r => {
                const birim = { ADET: 'adet', MT: 'm', KG: 'kg' }[r.birim] || '';
                const eksik = r.birim === 'ADET' ? Math.ceil(r.eksik - 1e-9) : r.eksik;
                const miktar = `${r.birim === 'ADET' ? tpFmt(eksik, 0) : tpFmt(eksik, 1)} ${birim}` + (r.birim === 'ADET' && r.hamBoyM > 0 ? ` ≈ ${tpFmt(eksik * r.hamBoyM, 0)} m` : '');
                const tb = terminBilgi(r.s);
                const notlar = [r.tezgahlar.length ? 'kısmen planlı: ' + r.tezgahlar.join(', ') : '', r.bitenTezgahlar.length ? 'bitirilen iş: ' + r.bitenTezgahlar.join(', ') : ''].filter(Boolean).join(' · ');
                return `<div class="sip-kart"><span class="sip-ust"><span class="satir-orta"><span class="sip-no">${esc(r.s.sno || '#' + r.s.id)}</span><span class="alt tek-satir">${esc(r.s.firma || r.s.musteri || '')}</span></span>
                    <span class="hap" style="background:${tb.zemin};color:${tb.renk}">${esc(r.s.ttarih ? 'termin ' + tpTerminMetni(r.s.ttarih) : 'termin yok')}</span></span>
                    <span style="font-size:13px">${esc(tpKalemEtiketi(r.k, r.idx))}</span>
                    <span style="display:flex;justify-content:space-between;gap:8px"><span class="soluk">tezgah bekleyen</span><span style="font-weight:700">${esc(miktar)}</span></span>
                    ${notlar ? `<span class="soluk" style="color:#B54708">${esc(notlar)}</span>` : ''}</div>`;
            }).join('');
            return `<div class="kartlar">${kartlar || '<div class="sip-kart"><div class="bos">Tezgah bekleyen sipariş yok.</div></div>'}${dahaDugme(l.length)}</div>`;
        }
        const liste = tpFiltreliTezgahlar();
        const kartlar = liste.slice(0, s.limit).map(t => {
            const d = tpDurum(t), meta = TP_DURUM_META[d] || TP_DURUM_META.BOSTA;
            const [renk, zemin] = d === 'DOKUYOR' ? ['#067647', '#E7F6EC'] : d === 'DURUYOR' ? ['#B42318', '#FEECEB'] : ['#475467', '#F2F4F7'];
            const parcalar = tpGanttParcalar(t);
            const acikIsler = tpAcikIsler(t.id);
            const eksikSay = acikIsler.filter(i => !tpIsSureBilgisi(i, t).hesaplandi).length;
            const etki = tpDuraklamaEtkisi(t);
            const durAdlari = etki.suren.map(x => tpDurNeden(x.neden).ad + (x.aciklama ? ': ' + x.aciklama : '')).join(' · ');
            const ilk = parcalar[0];
            const ozetMetin = ilk ? `${ilk.tip === 'AKTIF' ? 'Dokunuyor' : 'Sırada'}: ${ilk.ad}${ilk.alt ? ' · ' + ilk.alt : ''}`
                : etki.suren.length ? 'duruyor — ' + durAdlari : !acikIsler.length ? 'boşta' : eksikSay ? `süre hesaplanamıyor — ${eksikSay} işte eksik bilgi` : 'hedefler dokundu';
            const toplamGun = parcalar.reduce((a, p) => Math.max(a, p.bas + p.sure), 0);
            const levY = tpLeventYeterlilik(t);
            const anahtar = 'T|' + t.id;
            const acik = D.st.acik === anahtar;
            const isler = parcalar.map(p => {
                const bitis = tpGunEkle(p.bas + p.sure);
                const isKaydi = p.isId != null ? _tpCache.isler.find(x => String(x.id) === String(p.isId)) : null;
                const risk = isKaydi ? tpIsTerminRiski(isKaydi, bitis) : null;
                const gec = !!(risk && risk.fark > 0);
                return `<div class="bilgi-satir"><span><span style="font-weight:600">${p.tip === 'AKTIF' ? '▶ ' : ''}${gec ? '⚠ ' : ''}${esc(p.ad)}</span><span class="soluk"> ${esc(p.alt || '')}</span>
                    <div class="soluk">${esc(tpFmt(p.metre))} m · ${esc(tpGunMetni(p.sure))} · bitiş ${esc(bitis.toLocaleDateString('tr-TR'))}${risk ? ` · termin ${esc(tpTerminMetni(risk.termin))}${gec ? ` — <b style="color:#B42318">${risk.fark} gün geç</b>` : ''}` : ''}</div></span></div>`;
            }).join('');
            return `<div class="sip-kart" style="padding:0;gap:0"><button style="display:flex;align-items:center;gap:10px;padding:12px;width:100%" data-is="st-ac" data-d="${esc(anahtar)}">
                <span class="harf" style="background:${zemin};color:${renk};font-size:12px">${esc(String(t.tezgah_no || '—').slice(0, 4))}</span>
                <span class="satir-orta"><span style="font-weight:700" class="tek-satir">${esc(t.tezgah_no || '—')} <span class="soluk" style="font-weight:400">${esc(t.tezgah_tipi || '')}</span></span><span class="alt tek-satir">${esc(ozetMetin)}</span></span>
                <span style="display:flex;flex-direction:column;align-items:flex-end;flex:none"><span class="hap" style="background:${zemin};color:${renk}">${esc(meta.ad)}</span>
                <span class="soluk">${parcalar.length ? esc(tpGunKisa(toplamGun)) + ' iş' : ''}</span></span></button>
                ${acik ? `<div style="padding:0 14px 10px;border-top:1px solid var(--cizgi)">${isler || '<div class="bos">Planlı iş yok.</div>'}
                    ${levY && !levY.yetiyor ? bilgiSatiri('Levent', `${tpGunMetni(levY.bitisGun)} sonra biter · ${tpFmt(levY.eksikMetre)} m eksik`) : ''}
                    ${etki.suren.length ? bilgiSatiri('Duruş', durAdlari) : ''}${eksikSay ? bilgiSatiri('Eksik bilgi', `${eksikSay} işte`) : ''}</div>` : ''}</div>`;
        }).join('');
        return `<div class="kartlar">${kartlar || '<div class="sip-kart"><div class="bos">Bu süzmede tezgah yok.</div></div>'}${dahaDugme(liste.length)}</div>`;
    }

    /* ── Dokuma fason ── */
    const FS_DURUM = { KAPANDI: ['✓ Bitti', '#067647', '#E7F6EC'], TAMAM: ['Tamam', '#067647', '#E7F6EC'], KISMI: ['Kısmi geldi', '#B54708', '#FEF4E6'], FASONDA: ['Fasonda', '#0B7EA8', '#E3F4FA'] };
    function fasonGovde() {
        if (!D.dk.fs) {
            if (!D.dk.fsYuk) setTimeout(() => dkFsYukle(false), 0);
            return dkHata() || dkBekliyor('Dokuma fason kayıtları okunuyor…');
        }
        const s = D.st;
        if (s.fsSekme === 'COZGU' || s.fsSekme === 'BUKUM') return fasonCbGovde(s.fsSekme === 'COZGU' ? 'C' : 'B');
        if (s.fsSekme === 'FIRMA') return fasonCariGovde('DOKUMA');
        if (s.fsSekme === 'DEFTER') return fasonDefterGovde('DOKUMA');
        const md = dokumaFasonListeModeli({ arama: s.ara, firma: 'HEPSI', isDurum: s.fsIsDurum, siparisDurum: s.fsDurum });
        const k = md.kpi;
        const ozet = ozetSatir([['Dokuma siparişi', `${fasonFmtI(k.siparis)}<span class="soluk" style="font-weight:400"> · ${fasonFmtI(k.acik)} açık</span>`], ['Fasondan beklenen', fasonFmtM(k.beklenen) + ' m', '#B42318']])
            + ozetSatir([['Gönderilen iplik (net)', fasonFmtM(k.netIplik) + ' kg'], ['Gelen ham kumaş', fasonFmtM(k.hamMt) + ' m', '#067647'], ['Geciken / eksik', `${fasonFmtI(k.geciken)} / ${fasonFmtI(k.eksik)}`, '#B54708']]);
        const kartlar = md.filtreli.slice(0, s.limit).map(r => fasonIsKart(r, md.ozetler.get(String(r.id)))).join('');
        return `${ozet}<div class="kartlar">${kartlar || '<div class="sip-kart"><div class="bos">Bu süzgeçte dokuma siparişi yok.</div></div>'}${dahaDugme(md.filtreli.length)}</div>`;
    }
    function fasonIsKart(r, d) {
        const fasonMi = dokumaFasonFasonMu(r);
        const anahtar = 'F|' + r.id;
        const acik = D.st.acik === anahtar;
        const [dAd, dRenk, dZemin] = d ? (FS_DURUM[d.durum] || ['Gönderilmedi', '#475467', '#F2F4F7']) : ['Simteks', '#475467', '#F2F4F7'];
        let ic = '';
        if (acik) {
            if (!fasonMi) ic = '<div class="bos" style="text-align:left">Simteks\'te dokunuyor — üretimi Dokuma takip / Tezgah planlamadan izlenir.</div>';
            else {
                const o = d.oAll;
                ic = bilgiSatiri('Hedef', fasonFmtM(d.hedef) + ' m')
                    + bilgiSatiri('Gelen ham kumaş', `${fasonFmtM(o.hamMt)} m · %${d.pct} · ${fasonFmtI(o.hamTop)} top${o.hamKg ? ' · ' + fasonFmtM(o.hamKg) + ' kg' : ''}`)
                    + bilgiSatiri('1. / 2. kalite', `${fasonFmtM(o.k1Mt)} / ${fasonFmtM(o.hamK2)} m`)
                    + bilgiSatiri('Kalan', fasonFmtM(d.kalan) + ' m' + (d.gecikme ? ` · ${d.gecikme} gün gecikti` : ''))
                    + bilgiSatiri('İplik ihtiyacı', `${fasonFmtM(d.ihtiyac.toplamKg)} kg (çözgü ${fasonFmtM(d.ihtiyac.cozguKg)} · atkı ${fasonFmtM(d.ihtiyac.atkiKg)})`)
                    + bilgiSatiri('Gönderilen iplik (net)', `${fasonFmtM(o.netIplik)} kg (çözgü ${fasonFmtM(o.netIplikC)} · atkı ${fasonFmtM(o.netIplikA)})`)
                    + (o.leventGiden || o.leventGelen ? bilgiSatiri('Levent', `giden ${fasonFmtM(o.leventGiden)} · gelen ${fasonFmtM(o.leventGelen)} m`) : '')
                    + (o.cozguMt || o.hasilCikan ? bilgiSatiri('Çözgü / haşıl', `${fasonFmtM(o.cozguMt)} m · ${fasonFmtI(o.cozguLevent)} levent${o.hasilCikan ? ' · haşıldan çıkan ' + fasonFmtM(o.hasilCikan) + ' m' : ''}`) : '')
                    + (Object.keys(o.sayimlar).length ? bilgiSatiri('Son sayım (fasonda kalan)', `${fasonFmtM(Object.values(o.sayimlar).reduce((a, x) => a + x.kg, 0))} kg`) : '')
                    + (fasonFiyatGorur() ? bilgiSatiri('Hakediş (matrah)', fasonParaMetin(d.hakedis)) : '')
                    + fasonIplikHesabiMobil(d);
            }
        }
        return `<div class="sip-kart" style="padding:0;gap:0"><button style="display:flex;flex-direction:column;gap:8px;padding:12px;width:100%" data-is="st-ac" data-d="${esc(anahtar)}">
            <span class="sip-ust" style="width:100%"><span class="satir-orta"><span class="sip-no">${esc(r.sno || '—')}</span><span class="alt tek-satir">${esc(r.kumas_adi || '')}</span></span>
                <span class="hap" style="background:${dZemin};color:${dRenk}">${esc(dAd)}</span></span>
            ${d ? `<span class="cubuk-satir" style="width:100%"><span class="cubuk"><i style="width:${Math.min(100, d.pct || 0)}%;background:#0E7C70"></i></span><span class="yuzde">%${d.pct}</span></span>` : ''}
            <span class="sip-alt" style="width:100%"><span style="font-weight:600;color:#B54708" class="tek-satir">${esc(fasonMi ? (d?.firma || r.dokuma_fason_firma || '—') : 'Simteks Dokuma')}</span>
                <span class="soluk">${d ? fasonFmtM(d.oAll.hamMt) + ' / ' : ''}${fasonFmtM(r.metre)} m${r.ttarih ? ' · termin ' + esc(fasonTarihYaz(String(r.ttarih).slice(0, 10))) : ''}</span></span>
            ${d && (d.eksik.length || d.gecikme) ? `<span style="display:flex;gap:6px">${d.eksik.length ? '<span class="hap" style="background:#FEF4E6;color:#B54708">eksik bilgi</span>' : ''}${d.gecikme ? `<span class="hap" style="background:#FEECEB;color:#B42318">${d.gecikme} gün gecikti</span>` : ''}</span>` : ''}</button>
            ${acik ? `<div style="padding:0 14px 10px;border-top:1px solid var(--cizgi)">${ic}</div>` : ''}</div>`;
    }
    /* İplik hesabı: masaüstündeki tablo (14 dokumaFasonIplikSatirlari), telefonda iplik iplik */
    function fasonIplikHesabiMobil(d) {
        const ih = dokumaFasonIplikHesabi(d);
        if (!ih.hareketVar) return '';
        const RENK = { kirmizi: '#B42318', sari: '#B54708', yesil: '#067647', gri: '#98A2B3' };
        const satirlar = dokumaFasonIplikSatirlari(ih);
        const n = dokumaFasonIplikNotlari(ih);
        const bloklar = ih.kol.map(k => {
            const b = dokumaFasonIplikKolonAdi(ih, k);
            return `<div style="margin-top:10px;border:1px solid var(--cizgi);border-radius:12px;padding:4px 10px">
                <div style="font-weight:700;padding:6px 0">${esc(b.ad)}${b.alt ? ` <span class="soluk" style="font-weight:400">${esc(b.alt)}</span>` : ''}</div>
                ${satirlar.map(s => { const h = s.f(k); if (!h || !h.t) return ''; return `<div class="bilgi-satir" style="${s.kalin ? 'font-weight:700' : ''}"><span class="soluk" style="font-size:12px">${esc(s.et)}</span>
                    <span class="d" style="${h.r ? 'color:' + RENK[h.r] : ''}">${esc(h.t)}${h.a ? `<div style="font-size:11px;font-weight:400;color:${RENK[h.ar] || '#667085'}">${esc(h.a)}</div>` : ''}</span></div>`; }).join('')}</div>`;
        }).join('');
        const notlar = [n.ipNo, n.eksik, n.diger, n.kgKontrol ? 'Kg kontrolü: ' + n.kgKontrol.on + n.kgKontrol.sapma + (n.kgKontrol.son ? ' · ' + n.kgKontrol.son : '') : (n.kgBekle ? 'Kg kontrolü: ' + n.kgBekle : ''), n.randiman].filter(Boolean);
        return `<div class="soluk" style="padding-top:10px;font-size:12px;font-weight:600">İplik hesabı · ${esc(n.baslikAlt)}</div>${bloklar}
            ${notlar.length ? `<div class="soluk" style="font-size:12px;line-height:1.5;padding-top:8px">${notlar.map(x => esc(x)).join('<br>')}</div>` : ''}`;
    }
    function fasonCbGovde(tur) {
        if (!(dataCache.iplik_stok || []).length) return dkBekliyor('İplik hareketleri yükleniyor…');
        const { firmalar, genel } = fasonCbListeModeli(tur);
        const q = stAra();
        const kg = (x) => (x == null ? '—' : `${fasonFmtM(Math.round(x * 10) / 10)} kg`);
        const l = firmalar.filter(({ f, h }) => !q || [f.ad, ...h.satirlar.map(x => x.kod + ' ' + (x.ad || ''))].join(' ').toLocaleLowerCase('tr-TR').indexOf(q) >= 0);
        const ozet = ozetSatir([['Giden (net)', kg(genel.gon)], [tur === 'C' ? 'Levente sarılan' : 'Bükülü gelen', kg(genel.kul)], ['Firmada kalmalı', kg(genel.kal), '#B54708']]);
        const kartlar = l.map(({ f, h }) => {
            const t = h.toplam;
            const anahtar = tur + '|' + f.key;
            const acik = D.st.acik === anahtar;
            const fark = t.fark == null ? (t.sayimVar ? '—' : 'sayım yok') : (t.fark < -0.5 ? fasonFmtM(Math.round(-t.fark * 10) / 10) + ' kg fazla' : kg(t.fark));
            const satirlar = h.satirlar.map(s => `<div style="margin-top:8px;border:1px solid var(--cizgi);border-radius:12px;padding:4px 10px">
                <div style="font-weight:700;padding:6px 0">${esc(s.kod)} <span class="soluk" style="font-weight:400">${esc(s.ad || '')}</span></div>
                ${bilgiSatiri('Giden', `${kg(s.gon)} · ${fasonFmtI(s.gonSay)} gönderim`)}${bilgiSatiri('İade', kg(s.iade))}
                ${bilgiSatiri(tur === 'C' ? 'Levente sarılan' : 'Bükülü gelen', s.kullanilanEksik ? 'hesaplanamadı' : kg(s.kullanilan) + (tur === 'C' && s.levent ? ` · ${fasonFmtI(s.levent)} levent` : ''))}
                ${bilgiSatiri('Firmada kalmalı', kg(s.kalmali))}${bilgiSatiri('Sayım', s.sayim == null ? 'yok' : `${kg(s.sayim)} · ${fasonTarihYaz(s.sayimTarih)}`)}
                ${bilgiSatiri('Fark', s.fark == null ? '—' : s.fazla ? fasonFmtM(Math.round(-s.fark * 10) / 10) + ' kg fazla' : kg(s.fark) + (s.farkPct != null ? ` · %${fasonFmtM(Math.round(s.farkPct * 10) / 10)}` : ''))}</div>`).join('');
            return `<div class="sip-kart" style="padding:0;gap:0"><button style="display:flex;flex-direction:column;gap:6px;padding:12px;width:100%" data-is="st-ac" data-d="${esc(anahtar)}">
                <span style="display:flex;justify-content:space-between;gap:8px;width:100%"><span style="font-weight:700" class="tek-satir">${esc(f.ad)}</span><span style="font-weight:700;flex:none">${kg(t.kalmali)}</span></span>
                <span style="display:flex;justify-content:space-between;gap:8px;width:100%"><span class="soluk">${fasonFmtI(h.gonderimler.length)} gönderim · giden ${kg(t.net)}</span><span class="soluk">fark: ${esc(fark)}</span></span></button>
                ${acik ? `<div style="padding:0 14px 10px;border-top:1px solid var(--cizgi)">${satirlar || '<div class="bos">İplik yok.</div>'}</div>` : ''}</div>`;
        }).join('');
        return `${ozet}<div class="kartlar">${kartlar || '<div class="sip-kart"><div class="bos">Kayıt yok.</div></div>'}</div>`;
    }

    /* ════ KONFEKSİYON (22.10.2026) — sayılar ana programın fonksiyonlarından, burada hesap yok:
       Kesim    konfKesimOnuBekleyenler / konfKesimOnuToplam / konfKesimOnuKapatilanlar / konfKesilenModeli (04)
       Yıkama   konfYikamaPanelModeli / konfPipelineYikamaOzet / _konfYikamaFisGecmisCache (04)
       Kalite   konfKalitePanelModeli / konfPipelineKaliteOzet (04)
       Planlama konfPlanlamaListeModeli / konfPlanRowsGet / konfPlanGunlukYapilacak (06)
       Fason    fasonGruplar / fasonGrupFiltrele / fasonKpiModeli (13) ════ */
    const KONF_EKRANLAR = ['KONFEKSIYON_KESIM', 'KONFEKSIYON_YIKAMA', 'KONFEKSIYON_KALITE', 'KONFEKSIYON_PLANLAMA', 'FASON_TAKIP'];
    Object.assign(D.dk, { kf: false, kfYuk: false, kp: null, kpYuk: false, kpOku: false, kpOkuYuk: false, kfs: false, kfsYuk: false });
    /* kesim / yıkama / kalite: ekranın kendi okuması gibi (kesim geçmişinde rota onarımı YAZDIĞI için atlanır — mobil yazmaz) */
    const kfYukle = (zorla) => dkYukle('kf', () => Promise.all([konfLoadGlobalKumasGelis({ force: !!zorla }), konfLoadKesimGecmis({ force: !!zorla, skipRotaDuzelt: true }), konfLoadYikamaFisGecmis({ force: !!zorla })]));
    const kpYukle = () => dkYukle('kpOku', async () => {
        const acik = siparisler().filter(s => !siparisKapaliMi(s)).map(s => s.id);
        await sbKdGetMany(acik, 'KD_URUN_AGACI');   /* üretim yeri (Simteks / fason / doğrudan sevk) ürün ağacından */
        D.dk.kp = await konfPlanlamaListeModeli(D.st.kpYer, D.st.kpPlanli === '1');
    });
    const kfsYukle = (zorla) => dkYukle('kfs', () => Promise.all([fasonAkisYukle(!!zorla), sbKdGetMany(fasonTakipFiltreliSiparisler('HEPSI').map(s => s.id), 'KD_URUN_AGACI', zorla ? { force: true } : undefined)]));
    const adMetin = (n) => `${fmt(n)} ad`;
    const sekmeCip = (alan, liste) => liste.map(([k, a, n]) => cip('dk-set', alan + '=' + k, a, D.st[alan] === k, n)).join('');

    function konfEkranCiz() {
        const s = D.st;
        if (!s.kfSekme) s.kfSekme = { KONFEKSIYON_KESIM: 'ONU', KONFEKSIYON_YIKAMA: 'YIKAMADA', KONFEKSIYON_KALITE: 'AKTIF' }[D.ekran] || '';
        const satirlar = [];
        let ipucu = 'Sipariş, müşteri, ürün, renk…';
        if (D.ekran === 'KONFEKSIYON_KESIM') satirlar.push(sekmeCip('kfSekme', [['ONU', 'Kesim önünde bekleyen'], ['KESILEN', 'Kesilen ürünler'], ['KAPALI', 'Bitti denenler']]));
        else if (D.ekran === 'KONFEKSIYON_YIKAMA') satirlar.push(sekmeCip('kfSekme', [['YIKAMADA', 'Yıkamada'], ['HAZIR', 'Yıkamaya hazır'], ['GELEN', 'Yıkamadan gelen'], ['BITMIS', 'Bitmiş'], ['FIS', 'Yıkama fişleri']]));
        else if (D.ekran === 'KONFEKSIYON_KALITE') satirlar.push(sekmeCip('kfSekme', [['AKTIF', 'Kalite / paket'], ['BITMIS', 'Bitmiş']]) + cip('dk-set', 'kfTumu=' + (s.kfTumu === '1' ? '' : '1'), 'Tüm aktif siparişler', s.kfTumu === '1'));
        else if (D.ekran === 'KONFEKSIYON_PLANLAMA') {
            if (!s.sid) satirlar.push(sekmeCip('kpYer', [['HEPSI', 'Hepsi'], ['SIMTEKS_KONF', 'Simteks']]) + cip('dk-set', 'kpPlanli=' + (s.kpPlanli === '1' ? '' : '1'), 'Planlı siparişler de', s.kpPlanli === '1'));
        } else {
            satirlar.push(sekmeCip('kfsGor', [['SIPARIS', 'Siparişler'], ['FIRMA', 'Firmalar & cari'], ['DEFTER', 'İşlem defteri']]));
            if (s.kfsGor === 'DEFTER') satirlar.push(dfTurCip());
            if (s.kfsGor === 'SIPARIS') satirlar.push(sekmeCip('kfDurum', [['AKTIF', 'Aktif'], ['TAMAMLANDI', 'Kapanan'], ['HEPSI', 'Tümü']]));
            if (s.kfsGor === 'SIPARIS') satirlar.push(sekmeCip('kfIs', [['HEPSI', 'Tüm kalemler'], ['ACIK', 'Açık'], ['GECIKEN', 'Termini geçen'], ['EKSIK_FOY', 'Föyü eksik'], ['TAMAM', 'Tamamlanan']]));
            ipucu = 'Sipariş, müşteri, ürün, kumaş…';
        }
        return stokEkranBas(modAd(D.ekran), ipucu, satirlar, konfGovde());
    }
    function konfGovde() {
        if (D.ekran === 'KONFEKSIYON_PLANLAMA') return kpGovde();
        if (D.ekran === 'FASON_TAKIP') return kfsGovde();
        if (!D.dk.kf) {
            if (!D.dk.kfYuk) setTimeout(() => kfYukle(false), 0);
            return dkHata() || dkBekliyor('Kesim / yıkama / kalite kayıtları okunuyor…');
        }
        if (D.ekran === 'KONFEKSIYON_KESIM') return kesimGovde();
        if (D.ekran === 'KONFEKSIYON_YIKAMA') return yikamaGovde();
        return kaliteGovde();
    }
    const urunSatiri = (baslik, alt, sagUst, sagAlt) => `<div class="satir"><span class="satir-orta"><span class="ust tek-satir">${esc(baslik)}</span><span class="alt tek-satir">${esc(alt)}</span></span>
        <span style="display:flex;flex-direction:column;align-items:flex-end;flex:none;gap:2px"><span style="font-weight:700;font-size:13px">${esc(sagUst)}</span><span class="soluk">${esc(sagAlt)}</span></span></div>`;
    const kfAra = (dizi, alanlar) => { const q = stAra(); return !q ? dizi : dizi.filter(r => alanlar(r).join(' ').toLocaleLowerCase('tr-TR').indexOf(q) >= 0); };

    /* ── Kesim ── */
    function kesimGovde() {
        const s = D.st;
        if (s.kfSekme === 'KESILEN') {
            const m = konfKesilenModeli(s.ara);
            const ozet = ozetSatir([['Kesim kaydı', fmt(m.tum.length)], ['Toplam kesilen', adMetin(m.toplamAd)]]);
            const satirlar = m.eslesen.slice(0, s.limit).map(r => urunSatiri(`${r.siparis_sno || '—'} · ${r.desen || '—'}`,
                [r.firma, r.renk, r.ebat].filter(Boolean).join(' · '), adMetin(r.miktar || 0), r.ts ? new Date(r.ts).toLocaleDateString('tr-TR') : '—')).join('');
            return `${ozet}<div class="kartlar"><div class="liste-kutu" style="margin:0">${satirlar || `<div class="bos">${m.araniyor ? 'Aramaya uyan kesim kaydı yok.' : 'Henüz kesilmiş ürün yok.'}</div>`}</div>${dahaDugme(m.eslesen.length)}</div>`;
        }
        if (s.kfSekme === 'KAPALI') {
            const l = konfKesimOnuKapatilanlar();
            const satirlar = l.map(g => {
                const n = konfKesimOnuKalemAd(g.siparis_id, g.kalem_idx, g.ornek);
                const kp = g.kapali || {};
                return urunSatiri(`${n.sno} · ${n.urun}`, [n.firma, n.renk, n.ebat, kp.user].filter(Boolean).join(' · '),
                    `artan ${fmt(kp.artan || 0)}`, `gelen ${fmt(kp.gelen || 0)} · kesilen ${fmt(kp.kesilen || 0)}`);
            }).join('');
            return `<div class="kartlar"><div class="soluk" style="padding:0 4px">Son 30 günde "✓ Bitti" denen kalemler</div><div class="liste-kutu" style="margin:0">${satirlar || '<div class="bos">Kayıt yok.</div>'}</div></div>`;
        }
        const liste = konfKesimOnuBekleyenler();
        const top = konfKesimOnuToplam(liste);
        const ozet = ozetSatir([['Kalem', fmt(liste.length)], ['Bekleyen adet', adMetin(top.topAd)], ['Bekleyen metre', `${fmt1(top.topMt)} m`]]);
        const simdi = Date.now();
        const l = kfAra(liste.map(g => ({ g, n: konfKesimOnuKalemAd(g.siparis_id, g.kalem_idx, g.ornek, g.kumas) })), ({ n }) => [n.sno, n.firma, n.urun, n.renk, n.ebat]);
        const kartlar = l.slice(0, s.limit).map(({ g, n }) => {
            const gun = g.bekleyenTs ? Math.max(0, Math.floor((simdi - g.bekleyenTs) / 86400000)) : null;
            const sayi = konfKesimOnuSayi;
            const gelen = [g.gelenAd ? `${sayi(g.gelenAd)} ad` : '', g.gelenMt ? `${sayi(g.gelenMt, 1)} m` : '', g.gelenKg ? `${sayi(g.gelenKg, 1)} kg` : ''].filter(Boolean).join(' · ');
            const kesilen = g.kesilenAd ? `${sayi(g.kesilenAd)} ad${g.metreMi && g.kesilenMt ? ` ≈ ${sayi(g.kesilenMt, 1)} m` : ''}` : '—';
            const kalan = g.metreMi ? `${sayi(g.kalanMt, 1)} m` : `${sayi(g.kalanAd)} ad`;
            return `<div class="sip-kart"><span class="sip-ust"><span class="satir-orta"><span class="sip-no">${esc(n.sno)} · ${esc(n.urun)}</span><span class="alt tek-satir">${esc([n.firma, n.renk, n.ebat].filter(Boolean).join(' · '))}</span></span>
                <span class="hap" style="background:#F2EEFF;color:#6927DA">${esc(kalan)}</span></span>
                <span class="sip-alt"><span class="soluk">gelen ${esc(gelen || '—')} · kesilen ${esc(kesilen)}</span>
                <span style="color:${gun == null ? '#667085' : gun >= 7 ? '#B42318' : gun >= 3 ? '#B54708' : '#667085'};font-weight:600">${gun == null ? '' : gun + ' gündür'}</span></span></div>`;
        }).join('');
        return `${ozet}<div class="kartlar">${kartlar || '<div class="sip-kart"><div class="bos">Kesim önünde bekleyen mal yok.</div></div>'}${dahaDugme(l.length)}</div>`;
    }

    /* ── Yıkama ── */
    function yikamaGovde() {
        const s = D.st;
        const m = konfYikamaPanelModeli();
        const ozet = ozetSatir([['Yıkamaya hazır', adMetin(m.hazirToplamAd), '#B54708'], ['Yıkamada', adMetin(m.yikamadaToplamAd), '#0B7EA8'], ['Gelen (aktif)', adMetin(m.gelenAktifToplamAd), '#067647']]);
        let govde = '';
        if (s.kfSekme === 'HAZIR') {
            const l = kfAra(m.hazirListe, r => [r.siparis_sno, r.firma, r.desen, r.renk, r.ebat]);
            govde = l.slice(0, s.limit).map(r => urunSatiri(`${r.siparis_sno || '—'} · ${r.desen || '—'}`, [r.firma, r.renk, r.ebat].filter(Boolean).join(' · '),
                `${fmt(r.gidecek)} ad gidecek`, `kesilen ${fmt(r.kesilen)} · ${r.ts ? new Date(r.ts).toLocaleDateString('tr-TR') : '—'}`)).join('');
            govde = `<div class="liste-kutu" style="margin:0">${govde || '<div class="bos">Yıkamaya hazır mal yok.</div>'}</div>${dahaDugme(l.length)}`;
        } else if (s.kfSekme === 'GELEN' || s.kfSekme === 'BITMIS') {
            const kaynak = s.kfSekme === 'GELEN' ? m.gelenAktifRows : m.bitmisYikamaRows.filter(r => konfPipelineBitmisFiltreEslesir(r, ''));
            const l = kfAra(kaynak, r => [r.siparis_sno, r.firma, r.kumas_cinsi, r.stok_kodu, r.renk, r.ebat]);
            govde = l.slice(0, s.limit).map(r => {
                const o = konfPipelineYikamaOzet(r), k = konfPipelineKaliteOzet(r);
                return urunSatiri(`${r.siparis_sno || '—'} · ${r.kumas_cinsi || r.stok_kodu || '—'}`, [r.firma, r.renk, r.ebat].filter(Boolean).join(' · '),
                    `${fmt(o.gel)} / ${fmt(o.sevk)} ad geldi`, `paket ${fmt(k.gec)} · kalitede ${fmt(k.bekleyen)} · yıkamada ${fmt(o.yikamada)}`);
            }).join('');
            govde = `<div class="liste-kutu" style="margin:0">${govde || '<div class="bos">Kayıt yok.</div>'}</div>${dahaDugme(l.length)}`;
        } else if (s.kfSekme === 'FIS') {
            const l = kfAra(_konfYikamaFisGecmisCache || [], f => [f.fis_no, f.firma, f.siparis_sno, f.user, f.not,
                ...(f.satirlar || []).map(x => [x.siparis_sno, x.firma, x.desen, x.renk, x.ebat].join(' '))]);
            /* fişe dokununca içeriği (kullanıcı 23.10.2026): fişin satırları — sipariş, ürün, renk, ebat, adet (04 konfYikamaFisGecmisSatirFromRaw) */
            govde = l.slice(0, s.limit).map(f => {
                const acik = s.acik === 'Y|' + f.id;
                const satirlar = (f.satirlar || []).map(x => `<div class="bilgi-satir"><span><span style="font-weight:500">${esc([x.siparis_sno, x.desen].filter(Boolean).join(' · ') || '—')}</span>
                    <span class="soluk"> ${esc([x.renk, x.ebat, x.firma].filter(Boolean).join(' · '))}</span></span><span class="d">${esc(fmt(parseInt(x.adet, 10) || 0))} ad</span></div>`).join('');
                return `<div style="border-bottom:1px solid var(--cizgi)"><button style="display:block;width:100%;text-align:left" data-is="st-ac" data-d="${esc('Y|' + f.id)}">
                    ${urunSatiri(`${f.fis_no} · ${f.firma}`, [f.siparis_sno, f.user, f.not].filter(Boolean).join(' · '),
                        `${fmt(f.toplam_ad)} ad · ${f.kalem_say} kalem`, f.tarih ? new Date(f.tarih).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—')}</button>
                    ${acik ? `<div style="padding:0 14px 10px">${satirlar || '<div class="bos">Fişte satır yok.</div>'}</div>` : ''}</div>`;
            }).join('');
            govde = `<div class="liste-kutu" style="margin:0">${govde || '<div class="bos">Yıkama fişi yok.</div>'}</div>${dahaDugme(l.length)}`;
        } else {
            const l = kfAra(m.yikamadaGruplar, g => [g.siparis_sno, g.firma, g.urun, g.renk, g.ebat]);
            govde = l.slice(0, s.limit).map(g => urunSatiri(`${g.siparis_sno || '—'} · ${g.urun || '—'}`, [g.firma, g.renk, g.ebat, g.kayitSay > 1 ? g.kayitSay + ' kayıt' : ''].filter(Boolean).join(' · '),
                `${fmt(g.yikamadaTop)} ad yıkamada`, `sevk ${fmt(g.sevkTop)} · geldi ${fmt(g.gelTop)} · ${g.sonTs ? new Date(g.sonTs).toLocaleDateString('tr-TR') : '—'}`)).join('');
            govde = `<div class="liste-kutu" style="margin:0">${govde || '<div class="bos">Yıkamada bekleyen mal yok.</div>'}</div>${dahaDugme(l.length)}`;
        }
        return `${ozet}<div class="kartlar">${govde}</div>`;
    }

    /* ── Kalite ── */
    function kaliteGovde() {
        const s = D.st;
        const m = konfKalitePanelModeli(undefined, s.ara, s.ara, s.kfTumu === '1');
        const ozet = ozetSatir([['Aktif kayıt', fmt(m.rows.length) + (s.ara ? ' / ' + fmt(m.rowsHam.length) : '')], ['Bekleyen', adMetin(m.toplamBek), '#B54708'], ['Bitmiş', fmt(m.bitmisRows.length)]]);
        const kaynak = s.kfSekme === 'BITMIS' ? m.bitmisFiltreli : m.rows;
        const satirlar = kaynak.slice(0, s.limit).map(r => {
            const k = konfPipelineKaliteOzet(r);
            const nereden = r.sentetik ? 'kesim girişi yok' : (k.yikamadan ? `yıkamadan ${fmt(k.yikamaGelen)} ad geldi` : 'direkt kesim');
            return urunSatiri(`${r.siparis_sno || '—'} · ${r.kumas_cinsi || r.stok_kodu || '—'}`, [r.firma, r.renk, nereden].filter(Boolean).join(' · '),
                `${fmt(k.bekleyen)} ad bekliyor`, `kesilen ${fmt(r.kesilen_adet || 0)} · havuz ${fmt(k.havuz)} · paket ${fmt(k.gec)} · sevk ${fmt(k.sevk)}`);
        }).join('');
        return `${ozet}<div class="kartlar"><div class="liste-kutu" style="margin:0">${satirlar || '<div class="bos">Kayıt yok.</div>'}</div>${dahaDugme(kaynak.length)}</div>`;
    }

    /* ── Konfeksiyon planlama ── */
    function kpGovde() {
        const s = D.st;
        if (!D.dk.kpOku) {
            if (!D.dk.kpOkuYuk) setTimeout(kpYukle, 0);
            return dkHata() || dkBekliyor('Planlama siparişleri okunuyor…');
        }
        const kp = D.dk.kp;
        if (!s.sid) {
            const d = kp.konfDagilim;
            const ozet = ozetSatir([['Simteks', fmt(d.simteks)], ['Fason', fmt(d.fason)], ['Doğrudan sevk', fmt(d.dogrudan)], ['Plana dahil olmayan', fmt(kp.planaDahilEdilmeyenSiparisler.length)]]);
            const l = kfAra(kp.planlamaSecimSiparisleri, x => [x.sno, x.firma]);
            const kartlar = l.slice(0, s.limit).map(x => `<button class="sip-kart" data-is="dk-sip" data-d="${esc(x.id)}"><span class="sip-ust"><span class="satir-orta"><span class="sip-no">${esc(x.sno || '—')}</span>
                <span class="alt tek-satir">${esc(x.firma || '—')}${kp.planlanmisSiparisSet.has(String(x.id)) ? ' · planlı' : ''}</span></span>${svg(I.sag, 16)}</span></button>`).join('');
            return `${ozet}<div class="kartlar">${kartlar || '<div class="sip-kart"><div class="bos">Seçilecek sipariş yok.</div></div>'}${dahaDugme(l.length)}</div>`;
        }
        const sip = siparisler().find(x => String(x.id) === String(s.sid));
        if (!sip) return dkBekliyor('Sipariş bulunamadı.');
        const kd = konfGetKdForSiparis(sip.id);
        const planVar = Array.isArray(kd && kd.konf_plan_rows) && kd.konf_plan_rows.length > 0;
        const rows = konfPlanRowsGet(sip, uaSiparisKalemleriGetir(sip), kd);
        const bugun = erpYerelGun();
        const { gunlukYapilacak, gunlukToplam } = konfPlanGunlukYapilacak(rows, bugun);
        const geri = `<button class="cip" style="background:#E7EBF8;margin:12px 16px 0" data-is="dk-set" data-d="sid=">${svg(I.geri, 14)} ${esc(sip.sno || '')} · ${esc(sip.firma || '')} — başka sipariş</button>`;
        const asama = (ad, gun, tamam) => `<span class="hap" style="background:${tamam ? '#E7F6EC' : gun ? '#FEF4E6' : '#F2F4F7'};color:${tamam ? '#067647' : gun ? '#B54708' : '#98A2B3'}">${tamam ? '✓ ' : ''}${ad}${gun ? ' ' + esc(tarihKisa(gun)) : ''}</span>`;
        const kartlar = rows.map(r => `<div class="kalem-kart"><div class="kalem-ust"><span class="satir-orta"><span style="font-weight:600">${esc(r.urun || '—')}</span>
                <span class="alt">${esc([r.program_asama ? 'program: ' + r.program_asama : '', r.not].filter(Boolean).join(' · '))}</span></span>
                <span style="font-size:13px;font-weight:700;flex:none">${fmt(r.adet || 0)} ad</span></div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">${asama('Kesim', r.kesim_gun, r.kesim)}${asama('Dikim', r.dikim_gun, r.dikim)}${asama('Kalite', r.kalite_gun, r.kalite)}${asama('Sevk', r.sevk_gun, r.sevk)}</div></div>`).join('');
        const bugunHtml = gunlukYapilacak.length ? `<div class="bolum-baslik"><span>Bugün yapılacak</span><span class="soluk" style="font-size:12px;font-weight:400">${fmt(gunlukToplam)} ad</span></div>
            <div class="liste-kutu">${gunlukYapilacak.map(r => urunSatiri(r.urun || '—', r.plan_asama, `${fmt(r.adet || 0)} ad`, '')).join('')}</div>` : '';
        return `${geri}${planVar ? '' : '<div class="kilit-not" style="margin:12px 16px 0">Bu siparişin planı girilmemiş — ana programın gösterdiği varsayılan satırlar.</div>'}
            ${bugunHtml}<div class="kartlar">${kartlar || '<div class="sip-kart"><div class="bos">Plan satırı yok.</div></div>'}</div>`;
    }

    /* ── Konfeksiyon fason ── */
    function kfsGovde() {
        const s = D.st;
        if (!D.dk.kfs) {
            if (!D.dk.kfsYuk) setTimeout(() => kfsYukle(false), 0);
            return dkHata() || dkBekliyor('Fason kayıtları okunuyor…');
        }
        if (s.kfsGor === 'FIRMA') return fasonCariGovde('KONF');
        if (s.kfsGor === 'DEFTER') return fasonDefterGovde('KONF');
        const gruplar = fasonGrupFiltrele(fasonGruplar(s.kfDurum), { arama: s.ara, firma: 'HEPSI', isDurum: s.kfIs, siparisDurum: s.kfDurum });
        const k = fasonKpiModeli(gruplar);
        const ozet = ozetSatir([['Fason kalem', `${fasonFmtI(k.kalem)}<span class="soluk" style="font-weight:400"> · ${fasonFmtI(k.acik)} açık</span>`], ['Fasondan beklenen', fasonFmtI(k.beklenen) + ' ad', '#B42318']])
            + ozetSatir([['Gönderilen kumaş', fasonFmtM(k.netKumas) + ' m'], ['Gelen ürün', fasonFmtI(k.gelen) + ' ad', '#067647'], ['Geciken / föyü eksik', `${fasonFmtI(k.geciken)} / ${fasonFmtI(k.eksik)}`, '#B54708']])
            + (fasonFiyatGorur() ? ozetSatir([['Hakediş (matrah)', fasonParaMetin(k.hakedis)]]) : '');
        const kartlar = gruplar.slice(0, s.limit).map(g => {
            const dl = g.durumlar || g.kalemler.map(x => x.durum);
            const durum = g.tamam ? 'TAMAM' : dl.some(d => d === 'KISMI' || d === 'TAMAM') ? 'KISMI' : dl.some(d => d === 'FASONDA') ? 'FASONDA' : 'BEKLIYOR';
            const [dAd, dRenk, dZemin] = FS_DURUM[durum] || ['Gönderilmedi', '#475467', '#F2F4F7'];
            const anahtar = 'K|' + g.siparisId;
            const acik = D.st.acik === anahtar;
            const kalemler = acik ? g.kalemler.map(x => `<div style="margin-top:8px;border:1px solid var(--cizgi);border-radius:12px;padding:4px 10px">
                <div style="font-weight:700;padding:6px 0">${esc(x.kalemAd || '—')} <span class="soluk" style="font-weight:400">${esc([x.renk, x.ebat, x.firma].filter(Boolean).join(' · '))}</span></div>
                ${bilgiSatiri('Hedef', fasonFmtI(x.hedef) + ' ad')}${bilgiSatiri('Gelen (son iş)', `${fasonFmtI(x.gelen)} ad · %${x.pct}`)}
                ${bilgiSatiri('Hatalı / tamirde', `${fasonFmtI(x.hatali)} / ${fasonFmtI(x.tamirde)}`)}${bilgiSatiri('Kalan', fasonFmtI(x.kalan) + ' ad' + (x.gecikme ? ` · ${x.gecikme} gün gecikti` : ''))}
                ${x.kumasli ? bilgiSatiri('Kumaş', `ihtiyaç ${x.kumasIhtiyac ? fasonFmtM(x.kumasIhtiyac) + ' m' : '—'} · gönderilen ${fasonFmtM(x.netKumas)} m`) : bilgiSatiri('Gönderilen ürün', fasonFmtI(x.urunGiden) + ' ad')}
                ${fasonFiyatGorur() ? bilgiSatiri('Hakediş (matrah)', fasonParaMetin(x.hakedis)) : ''}</div>`).join('')
                + (g.agac ? `<div style="margin-top:8px;border:1px solid var(--cizgi);border-radius:12px;padding:4px 10px"><div style="font-weight:700;padding:6px 0">Fason ürün ağacı</div>
                    ${bilgiSatiri('Hedef / gelen', `${fasonFmtI(g.agac.hedef)} / ${fasonFmtI(g.agac.gelen)} ad`)}${g.agac.gecikme ? bilgiSatiri('Gecikme', g.agac.gecikme + ' gün') : ''}</div>` : '') : '';
            return `<div class="sip-kart" style="padding:0;gap:0"><button style="display:flex;flex-direction:column;gap:8px;padding:12px;width:100%" data-is="st-ac" data-d="${esc(anahtar)}">
                <span class="sip-ust" style="width:100%"><span class="satir-orta"><span class="sip-no">${esc(g.sno)}</span><span class="alt tek-satir">${esc(g.musteri)}</span></span>
                    <span class="hap" style="background:${dZemin};color:${dRenk}">${esc(dAd)}</span></span>
                <span class="cubuk-satir" style="width:100%"><span class="cubuk"><i style="width:${g.pct}%;background:#C4320A"></i></span><span class="yuzde">%${g.pct}</span></span>
                <span class="sip-alt" style="width:100%"><span style="font-weight:600;color:#B54708" class="tek-satir">${esc(g.firmalar.join(' · ') || 'Firma girilmemiş')}</span>
                    <span class="soluk">${fasonFmtI(g.topGelen)} / ${fasonFmtI(g.topHedef)} ad${g.termin ? ' · termin ' + esc(fasonTarihYaz(String(g.termin).slice(0, 10))) : ''}</span></span>
                ${g.eksikFoy || g.gecikme ? `<span style="display:flex;gap:6px">${g.eksikFoy ? `<span class="hap" style="background:#FEF4E6;color:#B54708">${g.eksikFoy} föy eksik</span>` : ''}${g.gecikme ? `<span class="hap" style="background:#FEECEB;color:#B42318">${g.gecikme} gün gecikti</span>` : ''}</span>` : ''}</button>
                ${acik ? `<div style="padding:0 14px 10px;border-top:1px solid var(--cizgi)">${kalemler || '<div class="bos">Kalem yok.</div>'}</div>` : ''}</div>`;
        }).join('');
        return `${ozet}<div class="kartlar">${kartlar || '<div class="sip-kart"><div class="bos">Fason kalem yok.</div></div>'}${dahaDugme(gruplar.length)}</div>`;
    }

    /* ════ PLANLAMA · SEVKİYAT · RAPORLAR · YAPILACAKLAR (22.10.2026) — sayılar ana programın fonksiyonlarından:
       Planlama     planlamaModeli / planlamaAlanSatirlari / planlamaSiparisTopla / planlamaDetayRowsByKod (04)
       Sevkiyat     sevkiyat fişlerinin kalemleri (assets/muhasebe-fis.js muhasebeFisFiltreUygula / muhasebeFisFisMiktarYazi) — 23.10.2026
                    kullanıcı isteğiyle sipariş bazlı tablo yerine kalem kalem sevkler; sevk girişi ve sevkiyat formları ana programda
       Raporlar     raporVeriYukle + sekmenin dışa aktarım paketi (raporOzetDisaPaket …: ekran, Excel ve PDF aynı modelden — 10);
                    süzgeçler ana programın kendi ayar fonksiyonlarıyla (raporDonemTip, raporUretimAyar …)
       Yapılacaklar planlamaTodoYukle / planlamaTodoListeModeli / planlamaTodoSatirModeli (04) — ekleme / bitirme / silme ana programda ════ */
    const PLAN_EKRANLAR = ['PLANLAMA', 'SEVKIYAT', 'RAPORLAR', 'YAPILACAKLAR'];
    Object.assign(D.dk, { pl: null, plOku: false, plOkuYuk: false, yd: false, ydYuk: false, rp: false, rpYuk: false });
    const plYukle = (zorla) => dkYukle('plOku', async () => {
        if (zorla) { _planlamaPerfCache.aylikTs = 0; _planlamaPerfCache.bugunTs = 0; }
        D.dk.pl = await planlamaModeli();
    });
    const ydYukle = (zorla) => dkYukle('yd', () => planlamaTodoYukle(!!zorla));
    const rpYukle = (zorla) => dkYukle('rp', async () => {
        await satisFiyatDurumYukle();   /* fiyat sekmesi yalnız yetkiliye (sunucu söyler; yetkisize veri dönmez) */
        if (raporKdEksikler().length) await raporKdEksikleriOku();
        await raporVeriYukle(!!zorla);
        if (D.st.rpSekme === 'YR_FIYAT') await satisFiyatHazirla(!!zorla);
    });
    const coklu = (mt, ad, kg) => [mt > 0 ? `${fmt1(mt)} mt` : '', kg > 0 ? `${fmt1(kg)} kg` : '', ad > 0 ? `${fmt(Math.round(ad))} ad` : ''].filter(Boolean).join('<br>') || '—';

    function planEkranCiz() {
        const s = D.st;
        const satirlar = [];
        let ipucu = 'Sipariş no, müşteri…';
        if (D.ekran === 'PLANLAMA') {
            satirlar.push(sekmeCip('plSekme', [['OZET', 'Özet'], ['UYARI', 'Akış uyarıları', D.dk.pl ? D.dk.pl.globalWarnings.length : null], ['SIMTEKS_KONF', 'Simteks konf.'], ['FASON_KONF', 'Fason konf.'], ['DOGRUDAN_SEVK', 'Doğrudan sevk']]));
        } else if (D.ekran === 'SEVKIYAT') {
            const say = D.fis.liste ? Object.fromEntries(SV_TURLER.map(([k]) => [k, svSatirlari(k).length])) : {};
            satirlar.push(sekmeCip('svTur', SV_TURLER.map(([k, a]) => [k, a, say[k]])));
            satirlar.push(sekmeCip('svGun', GUN_CIP));
            ipucu = 'Ürün, müşteri, sipariş no, fiş no…';
        } else if (D.ekran === 'YAPILACAKLAR') {
            satirlar.push(sekmeCip('ydDurum', [['ACIK', 'Açık'], ['BITTI', 'Tamamlanan'], ['HEPSI', 'Hepsi']]));
            ipucu = 'Görev, sipariş, kişi…';
        } else {
            satirlar.push(...rpCipler());
            ipucu = { YR_STOK: 'Stok kodu, ad ara…', YR_URETIM: 'Sipariş, müşteri, ürün, kişi ara…' }[s.rpSekme] || 'Sipariş, müşteri, ürün ara…';
        }
        /* Sevkiyat mobilde bütün türlerin sevkini gösterir — ana programdaki "(mamul)" eki yok */
        return stokEkranBas(D.ekran === 'SEVKIYAT' ? 'Sevkiyat' : modAd(D.ekran), ipucu, satirlar, planGovde());
    }
    function planGovde() {
        if (D.ekran === 'PLANLAMA') return plGovde();
        if (D.ekran === 'SEVKIYAT') return svGovde();
        if (D.ekran === 'YAPILACAKLAR') return ydGovde();
        return rpGovde();
    }

    /* ── Planlama ── */
    const PL_BEKLEYEN = [['DOKUMA_TAMAM', 'Dokuması tamamlanan ürün', '#4A5FC1'], ['YIKAMA_BEK', 'Yıkamada bekleyen mal', '#B54708'], ['KESIM_BEK', 'Kesimde bekleyen mal', '#6927DA'],
        ['KALITE_BEK', 'Kalite onayı bekleyen', '#B42318'], ['KOLI_BEK', 'Koliye giriş bekleyen', '#0B7EA8'], ['SEVK_HAZIR', 'Sevke hazır bekleyen', '#067647']];
    function plGovde() {
        const s = D.st;
        if (!D.dk.plOku) {
            if (!D.dk.plOkuYuk) setTimeout(() => plYukle(false), 0);
            return dkHata() || dkBekliyor('Planlama: ürün bazlı veriler okunuyor…');
        }
        const m = D.dk.pl;
        if (s.plSekme === 'UYARI') {
            const l = kfAra(m.globalWarnings.slice(0, 250), w => [w.siparis, w.musteri, w.urun, w.metin, w.tip]);
            const satirlar = l.slice(0, s.limit).map(w => `<div class="satir"><span class="etiket-kare" style="background:#FEECEB;color:#B42318">!</span><span class="satir-orta">
                <span class="ust tek-satir">${esc(w.tip)} · ${esc(w.siparis)} · ${esc(w.musteri)}</span><span class="alt">${esc(w.urun)} — ${esc(w.metin)}</span></span></div>`).join('');
            return `<div class="kartlar"><div class="soluk" style="padding:0 4px">Sipariş → Dokuma → Kesim → Yıkama → Kalite → Sevk · bu cihazda kapatılanlar görünmez</div>
                <div class="liste-kutu" style="margin:0">${satirlar || '<div class="bos" style="color:#067647">Aktif akış uyarısı yok.</div>'}</div>${dahaDugme(l.length)}</div>`;
        }
        if (s.plSekme !== 'OZET') {
            const kalemler = planlamaAlanSatirlari(m.urunSatirlari, s.plSekme);
            const l = kfAra(planlamaSiparisTopla(kalemler), r => [r.s.sno, r.s.firma]);
            const kartlar = l.slice(0, s.limit).map((r, n) => {
                const anahtar = 'P|' + r.s.id;
                const acik = s.acik === anahtar;
                const ic = acik ? kalemler.filter(k => String(k.s.id) === String(r.s.id)).map(k => `<div style="margin-top:8px;border:1px solid var(--cizgi);border-radius:12px;padding:4px 10px">
                    <div style="font-weight:700;padding:6px 0">${esc(k.urunEtiket)}</div>
                    ${bilgiSatiri('Hedef / dokuma', `${fmt(k.hedef)} / ${fmt(k.dokAdet)}`)}${bilgiSatiri('Kesim', fmt(k.kes))}${bilgiSatiri('Yıkamaya / yıkamadan', `${fmt(k.ySevkPr)} / ${fmt(k.yGelPr)}`)}
                    ${bilgiSatiri('Dikim / kalite / koli', `${fmt(k.dik)} / ${fmt(k.kk)} / ${fmt(k.kol)}`)}${bilgiSatiri('Sevk', `${fmt(k.sevkPr)} · %${k.sevkYuzde}`)}
                    ${bilgiSatiri('Bekleyen', `yık. ${fmt(k.yBek)} · kesim ${fmt(k.kesBek)} · kalite ${fmt(k.kaliteBek)} · koli ${fmt(k.koliBek)} · sevke hazır ${fmt(k.sevkHazirBek)}`)}
                    ${k.uyarilar.length ? `<div class="soluk" style="color:#B42318;padding:4px 0">${k.uyarilar.map(w => esc(w.metin)).join('<br>')}</div>` : ''}</div>`).join('') : '';
                return `<div class="sip-kart" style="padding:0;gap:0"><button style="display:flex;flex-direction:column;gap:8px;padding:12px;width:100%" data-is="st-ac" data-d="${esc(anahtar)}">
                    <span class="sip-ust" style="width:100%"><span class="satir-orta"><span class="sip-no">${n + 1}. ${esc(r.s.sno || '—')}</span><span class="alt tek-satir">${esc(r.s.firma || '—')} · ${fmt(r.urunCesit)} ürün</span></span>
                        <span class="hap" style="background:${r.uyariTop ? '#FEECEB' : '#E7F6EC'};color:${r.uyariTop ? '#B42318' : '#067647'}">${r.uyariTop ? r.uyariTop + ' uyarı' : 'OK'}</span></span>
                    <span class="cubuk-satir" style="width:100%"><span class="cubuk"><i style="width:${Math.min(100, r.sevkYuzde)}%;background:#0B7EA8"></i></span><span class="yuzde">%${r.sevkYuzde}</span></span>
                    <span style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;width:100%;font-size:12px;text-align:left">
                        ${[['Hedef', r.hedef], ['Dokuma', r.dokAdet], ['Kesim', r.kes], ['Sevk', r.sevkPr], ['Yık.bek.', r.yBek], ['Kalite bek.', r.kaliteBek], ['Koli bek.', r.koliBek], ['Sevke hazır', r.sevkHazirBek]]
                            .map(([a, v]) => `<span><span class="soluk" style="display:block;font-size:11px">${a}</span><b>${fmt(v)}</b></span>`).join('')}</span>
                    <span class="sip-alt" style="width:100%"><span class="soluk">kolaylık %${r.kolaySkor}</span><span class="soluk">${r.s.ttarih ? 'termin ' + esc(new Date(r.s.ttarih).toLocaleDateString('tr-TR')) : 'termin yok'}</span></span></button>
                    ${acik ? `<div style="padding:0 14px 10px;border-top:1px solid var(--cizgi)">${ic || '<div class="bos">Kalem yok.</div>'}</div>` : ''}</div>`;
            }).join('');
            return `${ozetSatir([['Sipariş', fmt(l.length)], ['Kalem', fmt(kalemler.length)]])}<div class="kartlar">${kartlar || '<div class="sip-kart"><div class="bos">Bu alanda aktif sipariş bulunamadı.</div></div>'}${dahaDugme(l.length)}</div>`;
        }
        const bek = { DOKUMA_TAMAM: m.dokumaTamamSayisi, YIKAMA_BEK: m.bekleyen.yikama, KESIM_BEK: m.bekleyen.kesim, KALITE_BEK: m.bekleyen.kalite, KOLI_BEK: m.bekleyen.koli, SEVK_HAZIR: m.bekleyen.sevk };
        const kutular = `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:12px 16px 0">${PL_BEKLEYEN.map(([k, a, renk]) =>
            `<button class="kpi" style="flex-direction:column;align-items:flex-start;gap:2px;padding:10px 12px;${s.plDetay === k ? 'outline:2px solid ' + renk : ''}" data-is="dk-set" data-d="plDetay=${s.plDetay === k ? '' : k}">
                <span class="kpi-ad">${esc(a)}</span><span style="font-size:17px;font-weight:700;color:${renk}">${fmt(bek[k])}</span></button>`).join('')}</div>`;
        let detay = '';
        if (s.plDetay) {
            const l = planlamaDetayRowsByKod(s.plDetay, m.urunSatirlari);
            detay = `<div class="bolum-baslik"><span>${esc(planlamaDetayBaslik(s.plDetay))}</span><span class="soluk" style="font-size:12px;font-weight:400">${fmt(l.length)} ürün</span></div>
                <div class="liste-kutu">${l.slice(0, s.limit).map(r => urunSatiri(`${r.s.sno || '—'} · ${r.urunEtiket || '—'}`, [r.s.firma, r.alan].filter(Boolean).join(' · '),
                    fmt(planlamaDetayMiktarByKod(r, s.plDetay)), r.s.ttarih ? new Date(r.s.ttarih).toLocaleDateString('tr-TR') : '—')).join('') || '<div class="bos">Bu başlıkta bekleyen ürün yok.</div>'}</div>
                ${l.length > s.limit ? `<div class="kartlar" style="padding-top:0">${dahaDugme(l.length)}</div>` : ''}`;
        }
        const mini = (baslik, l, bos) => `<div class="bolum-baslik"><span>${baslik}</span></div><div class="liste-kutu">${l.map(o => urunSatiri(`${o.sip.sno || '—'} · ${o.urun}`,
            [o.sip.firma, o.adet > 1 ? o.adet + ' kayıt birleştirildi' : ''].filter(Boolean).join(' · '), o.miktar ? fmt(o.miktar) + ' ad' : '—', o.saat)).join('') || `<div class="bos">${bos}</div>`}</div>`;
        return `${ozetSatir([['Aktif sipariş', fmt(m.aktifSip.length)], ['Ürün satırı', fmt(m.urunSatirlari.length)], ['Yık.bek. (ürün)', fmt(m.yikBekUrunTop)]])}
            ${kutular}${detay}
            <div class="bolum-baslik"><span>Üretim girişleri (miktar toplam)</span></div>
            ${ozetSatir([['Günlük', fmt(m.gunlukUretim)], ['Haftalık', fmt(m.haftalikUretim)], ['Aylık', fmt(m.aylikUretim)]])}
            ${mini('Bugün yıkamaya sevk', m.bugunYikSevk, 'Bugün kayıtlı yıkama sevk satırı yok.')}
            ${mini('Bugün kesim', m.bugunKesim, 'Bugün kayıtlı kesim satırı yok.')}`;
    }

    /* ── Sevkiyat ── */
    /* ── Sevkiyat (kullanıcı 23.10.2026: "mamül, kumaş ve iplik olmak üzere kalem kalem sevkler yazılsın, siparişler
       yazılmasın"): sevkiyat fişlerinin (assets/muhasebe-fis.js — hareketlerden türer) kalemleri tek tek, türe ve güne
       göre. Tür süzgeci fiş ekranıyla aynı (muhasebeFisFiltreUygula); miktar fişteki gibi (muhasebeFisFisMiktarYazi).
       Satıra dokununca fişi açılır. Ana programdaki sipariş bazlı Sevkiyat ekranı mobilde gösterilmez. ── */
    const SV_TURLER = [['MAMUL', 'Mamül'], ['KUMAS', 'Kumaş'], ['IPLIK', 'İplik'], ['DOKUMA', 'Dokuma depo']];
    function svSatirlari(tur) {
        const fisler = muhasebeFisFiltreUygula(D.fis.liste || [], Object.assign({ q: '', tip: tur }, gunAraligi(D.st.svGun)));
        return fisler.flatMap(f => (f.kalemler || []).map(k => ({ f, k })))
            .sort((a, b) => String(b.f.created_at || '').localeCompare(String(a.f.created_at || '')));
    }
    function svGovde() {
        const s = D.st;
        if (D.fis.hata) return dkBekliyor(D.fis.hata);
        if (!D.fis.liste) {
            if (!D.fis.yukleniyor) setTimeout(() => fisYukle(false), 0);
            return dkBekliyor('Sevkiyat fişleri okunuyor…');
        }
        const hepsi = svSatirlari(s.svTur);
        const q = s.ara.trim().toLocaleLowerCase('tr-TR');
        const l = !q ? hepsi : hepsi.filter(({ f, k }) => [k.urun_adi, k.stok_kodu, k.renk, k.ebat, k.siparis_no, f.musteri, muhasebeFisGorunenNo(f)]
            .join(' ').toLocaleLowerCase('tr-TR').includes(q));
        const fisSay = new Set(l.map(x => x.f.id)).size;
        const grup = s.svTur === 'DOKUMA' ? 'KUMAS' : s.svTur;
        const toplam = l.length ? muhasebeFisKalemToplamYazi(l.map(x => x.k), grup) : '—';
        const kartlar = l.slice(0, s.limit).map(({ f, k }) => `<button class="sip-kart" style="gap:4px;text-align:left" data-is="sv-fis" data-d="${esc(f.id + '|' + muhasebeFisGorunenNo(f))}">
                <span style="display:flex;justify-content:space-between;gap:8px;width:100%"><span class="tek-satir" style="font-weight:600">${esc(k.urun_adi || k.stok_kodu || '—')}</span>
                    <span style="font-weight:700;flex:none;color:#067647">${esc(muhasebeFisFisMiktarYazi(k))}</span></span>
                <span class="alt tek-satir">${esc([k.stok_kodu !== k.urun_adi ? k.stok_kodu : '', k.renk, k.ebat, k.siparis_no].filter(Boolean).join(' · ') || '—')}</span>
                <span class="soluk tek-satir">${esc([f.musteri || '—', muhasebeFisGorunenNo(f), tarihSaat(f.created_at)].join(' · '))}</span></button>`).join('');
        return `${ozetSatir([['Kalem', fmt(l.length)], ['Fiş', fmt(fisSay)], ['Toplam', toplam]])}<div class="kartlar">
            ${kartlar || `<div class="sip-kart"><div class="bos">${hepsi.length ? 'Aramaya uyan sevk yok.' : 'Bu süzgeçte sevk yok.'}</div></div>`}${dahaDugme(l.length)}</div>`;
    }
    /* ── Yapılacaklar (kişinin kendi görevleri; salt okunur) ── */
    function ydGovde() {
        const s = D.st;
        if (!D.dk.yd) {
            if (!D.dk.ydYuk) setTimeout(() => ydYukle(false), 0);
            return dkHata() || dkBekliyor('Yapılacaklar okunuyor…');
        }
        const m = planlamaTodoListeModeli();
        const kaynak = s.ydDurum === 'BITTI' ? m.bitmis : s.ydDurum === 'HEPSI' ? m.hepsi : m.acik;
        const l = kfAra(kaynak, t => [t.task, planlamaTodoNotTemiz(t.description), t.assigned_to, t.unit, (planlamaTodoSiparisEtiketOku(t.description) || {}).sno]);
        const satirlar = l.slice(0, s.limit).map(t => {
            const x = planlamaTodoSatirModeli(t);
            const tarih = x.gecerliTerm ? `<span style="font-weight:${x.gecikti || x.bugunMu ? 700 : 400};color:${x.gecikti ? '#B42318' : x.bugunMu ? '#B54708' : '#667085'}">${x.gecikti ? '⚠ ' : x.bugunMu ? '● ' : ''}${x.bugunMu ? 'bugün' : esc(x.term.toLocaleDateString('tr-TR'))}</span>` : '';
            return `<div class="satir" style="border-left:3px solid ${x.bitti ? 'transparent' : x.renk};${x.bitti ? 'opacity:.6' : ''}">
                <span class="etiket-kare" style="background:${x.bitti ? '#E7F6EC' : '#F2F4F7'};color:${x.bitti ? '#067647' : '#98A2B3'}">${x.bitti ? '✓' : ''}</span>
                <span class="satir-orta"><span class="ust" style="${x.bitti ? 'text-decoration:line-through' : ''}">${esc(t.task || '—')}</span>
                    <span class="alt" style="display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center"><span class="hap" style="background:${x.renk}1e;color:${x.renk}">${esc(t.priority || 'NORMAL')}</span>
                    ${t.unit ? `<span>${esc(t.unit)}</span>` : ''}${x.sipEtiket && x.sipEtiket.sno ? `<span style="color:#4A5FC1;font-weight:600">${esc(x.sipEtiket.sno)}</span>` : ''}
                    ${t.assigned_to ? `<span>${esc(t.assigned_to)}</span>` : ''}${tarih}</span>
                    ${x.not ? `<span class="alt">${esc(x.not)}</span>` : ''}</span></div>`;
        }).join('');
        return `${ozetSatir([['Açık', fmt(m.acik.length)], ['Tarihi geldi', fmt(m.geciken), m.geciken ? '#B42318' : ''], ['Tamamlanan', fmt(m.bitmis.length), '#067647']])}
            <div class="kartlar"><div class="soluk" style="padding:0 4px">Yalnız kendi görevlerin · ekleme ve tamamlama ana programda</div>
            <div class="liste-kutu" style="margin:0">${satirlar || '<div class="bos">Görev yok.</div>'}</div>${dahaDugme(l.length)}</div>`;
    }

    /* ── Raporlar: sekme → ana programın dışa aktarım paketi (tablo modelleri) ── */
    const rpSekmeleri = () => RAPOR_YENI_SEKMELER.filter(raporSekmeAcikMi);
    const rpCip = (deger, ad, secili, sayi) => cip('rp-ayar', deger, ad, secili, sayi);
    const rpEtiket = (ad) => `<span class="soluk" style="flex:none;align-self:center;font-size:12px;font-weight:600">${ad}</span>`;
    function rpCipler() {
        const s = D.st;
        if (!rpSekmeleri().some(t => t.id === s.rpSekme)) s.rpSekme = 'YR_OZET';
        const satirlar = [rpSekmeleri().map(t => rpCip('sekme|' + t.id, t.label.replace(/^\S+\s/, ''), s.rpSekme === t.id)).join('')];
        const fr = satisFiyatRapor;
        const donemVar = s.rpSekme === 'YR_OZET' || s.rpSekme === 'YR_URETIM' || s.rpSekme === 'YR_STOK' || (s.rpSekme === 'YR_SIPARIS' && raporSiparis.tarihAlan)
            || (s.rpSekme === 'YR_FIYAT' && (fr.gorunum === 'SEVK' ? !fr.tumZaman : fr.urunDonem));
        if (s.rpSekme === 'YR_FIYAT') {
            const kutu = (alan, ad) => rpCip(`fiyat|${alan}|${fr[alan] ? '0' : '1'}`, (fr[alan] ? '✓ ' : '') + ad, !!fr[alan]);
            satirlar.push([['SEVK', 'Satışlar (sevk edilenler)'], ['URUN', 'Ürüne göre fiyat']].map(([k, ad]) => rpCip('fiyat|gorunum|' + k, ad, fr.gorunum === k)).join('')
                + (fr.gorunum === 'SEVK' ? kutu('tumZaman', 'Tüm tarihler') + kutu('yalnizFiyatli', 'Yalnız fiyatı girilmiş') : kutu('birlestir', 'Renk varyantlarını birleştir') + kutu('urunDonem', 'Sipariş tarihine göre')));
        }
        if (donemVar) {
            const a = raporDonemAralik();
            satirlar.push(rpEtiket('Dönem') + RAPOR_DONEM_TIPLERI.filter(([k]) => k !== 'OZEL').map(([k, ad]) => rpCip('donem|' + k, ad, raporDonem.tip === k)).join('')
                + rpCip('kaydir|-1', '‹', false) + `<span class="cip" style="background:transparent;font-weight:700">${esc(a.etiket)}</span>` + rpCip('kaydir|1', '›', false) + rpCip('bugun', 'Bugün', false));
        }
        if (s.rpSekme === 'YR_URETIM') {
            satirlar.push(rpEtiket('Satır') + RAPOR_KIRILIMLAR.map(([k, ad]) => rpCip('uretim|k1|' + k, ad, raporUretim.k1 === k)).join(''));
            satirlar.push(rpEtiket('Birim') + RAPOR_BIRIMLER.map(([k, ad]) => rpCip('uretim|birim|' + k, ad, raporUretim.birim === k)).join('')
                + RAPOR_ASAMALAR.map(x => rpCip('asama|' + x.kod, x.ad, raporUretim.asamalar.includes(x.kod))).join(''));
        } else if (s.rpSekme === 'YR_SIPARIS') {
            satirlar.push([['URUN', 'Ürün (adet)'], ['KUMAS', 'Kumaş (mt / kg)']].map(([k, ad]) => rpCip('siparis|tur|' + k, ad, raporSiparis.tur === k)).join('')
                + [['ACIK', 'Açık'], ['TUMU', 'Tümü']].map(([k, ad]) => rpCip('siparis|durum|' + k, ad, raporSiparis.durum === k)).join(''));
            satirlar.push([['', 'Tüm tarihler'], ['SIPARIS', 'Sipariş tarihine göre'], ['TERMIN', 'Termine göre']].map(([k, ad]) => rpCip('siparis|tarihAlan|' + k, ad, raporSiparis.tarihAlan === k)).join(''));
        } else if (s.rpSekme === 'YR_STOK') {
            const depo = RAPOR_STOK_DEPOLAR.find(d => d.kod === raporStok.depo);
            satirlar.push(RAPOR_STOK_DEPOLAR.map(d => rpCip('stok|depo|' + d.kod, d.ad, raporStok.depo === d.kod)).join('')
                + depo.birimler.map(([k, ad]) => rpCip('stok|birim|' + k, ad, raporStok.birim === k)).join(''));
            satirlar.push([['BAKIYELI', 'Bakiyesi / hareketi olan'], ['HAREKETLI', 'Dönemde hareket gören'], ['TUMU', 'Tüm kodlar']].map(([k, ad]) => rpCip('stok|kapsam|' + k, ad, raporStok.kapsam === k)).join(''));
        } else if (s.rpSekme === 'YR_KONTROL' && D.dk.rp && _raporVeri.olaylar) {
            const sayim = {};
            raporKontrolSuz(raporKontrolBulgulari(), true).forEach(b => { sayim[b.kural] = (sayim[b.kural] || 0) + 1; });
            satirlar.push([['TUMU', 'Tüm kayıtlar'], ['ACIK', 'Yalnız açık siparişler'], ['GUN30', 'Son 30 gün'], ['GUN7', 'Son 7 gün']].map(([k, ad]) => rpCip('kontrol|son|' + k, ad, raporKontrolFiltre.son === k)).join(''));
            satirlar.push(RAPOR_KONTROL_KURALLARI.map(k => rpCip('kontrol|kural|' + (raporKontrolFiltre.kural === k.kod ? '' : k.kod), k.ad, raporKontrolFiltre.kural === k.kod, sayim[k.kod] || 0)).join(''));
        }
        return satirlar;
    }
    /* Arama kutusu sekmenin kendi arama alanına yazılır (ana programdaki kutunun yaptığı gibi) */
    function rpAramaUygula() {
        const q = D.st.ara;
        if (D.st.rpSekme === 'YR_URETIM') raporUretim.q = q;
        else if (D.st.rpSekme === 'YR_SIPARIS') raporSiparis.q = q;
        else if (D.st.rpSekme === 'YR_STOK') raporStok.q = q;
        else if (D.st.rpSekme === 'YR_KONTROL') raporKontrolFiltre.q = q;
        else if (D.st.rpSekme === 'YR_FIYAT') satisFiyatRapor.q = q;
    }
    /* Süzgeç düğmesi → ana programın kendi ayar fonksiyonu (onlar yalnız durumu değiştirir; ekran kutuları burada yok) */
    function rpAyar(d) {
        const [ne, a, b] = String(d || '').split('|');
        if (ne === 'sekme') {
            D.st.rpSekme = a; D.st.ara = '';
            if (a === 'YR_FIYAT') { D.dk.rp = false; rpYukle(false); }
        }
        else if (ne === 'donem') raporDonemTip(a);
        else if (ne === 'kaydir') raporDonemKaydir(parseInt(a, 10) || 0);
        else if (ne === 'bugun') raporDonemBugun();
        else if (ne === 'uretim') raporUretimAyar(a, b);
        else if (ne === 'asama') raporUretimAsama(a);
        else if (ne === 'siparis') raporSiparisAyar(a, b);
        else if (ne === 'stok') raporStokAyar(a, b);
        else if (ne === 'kontrol') { if (a === 'kural') raporKontrolKural(b); else raporKontrolFiltre[a] = b; }
        else if (ne === 'fiyat') satisFiyatRaporAyar(a, a === 'gorunum' ? b : b === '1');
        D.st.limit = LISTE_ADIM;
    }
    function rpPaket() {
        rpAramaUygula();
        const t = D.st.rpSekme;
        if (t === 'YR_URETIM') return raporUretimDisaPaket();
        if (t === 'YR_SIPARIS') return raporSiparisDisaPaket();
        if (t === 'YR_STOK') return raporStokDisaPaket();
        if (t === 'YR_KONTROL') return raporKontrolDisaPaket();
        if (t === 'YR_FIYAT') return satisFiyatRaporDisaPaket();
        return raporOzetDisaPaket();
    }
    function rpModelHtml(m) {
        const kol = m.kolonlar;
        const metin = [], sayi = [];
        kol.forEach((k, i) => (!k.tip || k.tip === 'metin' ? metin : sayi).push(i));
        const deger = (c, v) => (v == null || v === '' ? '' : raporHucreMetni(kol[c], v));
        const limit = D.st.limit;
        const satirlar = m.satirlar.slice(0, limit).map(s => {
            const bas = metin.slice(0, 2).map(c => deger(c, s[c])).filter(Boolean).join(' · ') || '—';
            const alt = metin.slice(2).map(c => deger(c, s[c])).filter(Boolean).join(' · ');
            const hucre = sayi.map(c => [kol[c].ad, deger(c, s[c])]).filter(([, v]) => v && v !== '—');
            return `<div class="satir" style="flex-direction:column;align-items:stretch;gap:4px"><span class="ust">${esc(bas)}</span>${alt ? `<span class="alt">${esc(alt)}</span>` : ''}
                ${hucre.length ? `<span style="display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12px">${hucre.map(([a, v]) => `<span><span class="soluk">${esc(a)}</span> <b>${esc(v)}</b></span>`).join('')}</span>` : ''}</div>`;
        }).join('');
        const top = m.toplam ? sayi.map(c => [kol[c].ad, deger(c, m.toplam[c])]).filter(([, v]) => v && v !== '—') : [];
        return `<div class="bolum-baslik"><span>${esc(m.baslik)}</span><span class="soluk" style="font-size:12px;font-weight:400">${fmt(m.satirlar.length)} satır</span></div>
            ${top.length ? `<div class="kartlar" style="padding-top:0;padding-bottom:6px"><div class="kpi" style="flex-wrap:wrap;gap:4px 12px;font-size:12px"><b>Toplam</b>${top.map(([a, v]) => `<span><span class="soluk">${esc(a)}</span> <b>${esc(v)}</b></span>`).join('')}</div></div>` : ''}
            <div class="liste-kutu">${satirlar || '<div class="bos">Kayıt yok.</div>'}</div>
            ${m.satirlar.length > limit ? `<div class="kartlar" style="padding-top:0">${dahaDugme(m.satirlar.length)}</div>` : ''}
            ${m.not ? `<div class="soluk" style="padding:4px 20px 0;font-size:12px">${esc(m.not)}</div>` : ''}`;
    }
    function rpGovde() {
        if (!D.dk.rp) {
            if (!D.dk.rpYuk) setTimeout(() => rpYukle(false), 0);
            return dkHata() || dkBekliyor('Rapor verileri okunuyor…');
        }
        if (!_raporVeri.olaylar) return dkBekliyor(_raporVeri.hata || 'Rapor verisi yok.');
        let p;
        try { p = rpPaket(); } catch (e) { return dkBekliyor('Rapor kurulamadı: ' + (e && e.message ? e.message : e)); }
        if (!p) return dkBekliyor('Bu sekme bu oturumda açık değil.');
        return `<div class="kartlar" style="padding-bottom:0"><div class="soluk" style="padding:0 4px">${esc(p.filtre || '')} · ${fmt(_raporVeri.olaylar.length)} kayıt, ${esc(new Date(_raporVeri.ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }))} itibarıyla</div></div>
            ${p.modeller.map(rpModelHtml).join('')}${p.not ? `<div class="soluk" style="padding:10px 20px;font-size:12px">${esc(p.not)}</div>` : ''}`;
    }

    /* ════ TERBİYE · NUMUNE · STOK KARTLARI · ÜRÜN AĞACI / TEKNİK FÖY (22.10.2026) — sayılar ana programın fonksiyonlarından:
       Terbiye   fasonAkisYukle → terbiyeListeModeli / terbiyeIlerleme / terbiyeIsBilgiParcalari (24), terbiyeOzet alanları (23),
                 terbiyeBoyahaneStokModeli / terbiyeMusteriRenkleriSuz / terbiyeDefterModeli / terbiyeGonderilenIplikler (42)
       Numune    numuneYukle → numuneListeSatirlari / numuneDurumSayilari / numuneGeciktiMi / numuneBilgiSatirlari (15)
       Kartlar   stokKartListeSayilari / stokKartTumuSatirlari / stokKartKumasGruplari + kumas|mamul|iplikKartListeSatirModeli
                 (assets/stok-kart-desktop.js); PDF = ana programın stokKartPdfIndir
       Ürün ağacı uaSiparisDurumlari / uaKalemIslemOzeti / uaAksesuarPlani / uaTahminiKumasMetre (06), kumasPlaniHesapla (29)
       Yazma yok: boya işi / hareket, numune, kart, ağaç düzenleme ana programda (ürün ağacı yöneticiye mobilde 6. grupta). ════ */
    const EK5_EKRANLAR = ['BOYAHANE_URETIM', 'NUMUNE', 'KART_LISTE', 'URUN_AGACI', 'TEKNIK_FOY'];
    Object.assign(D.dk, { tb: false, tbYuk: false, nm: false, nmYuk: false, nmTam: {}, ua: null, uaOku: false, uaOkuYuk: false });
    const tbYukle = (zorla) => dkYukle('tb', () => fasonAkisYukle(!!zorla || Date.now() - _fasonAkis.zaman > 20000));
    const nmYukle = (zorla) => dkYukle('nm', () => numuneYukle(!!zorla));
    const uaYukle = () => dkYukle('uaOku', async () => { D.dk.ua = await uaSiparisDurumlari(); });
    const fmtTr = (n, b) => { const x = Number(n) || 0; return x.toLocaleString('tr-TR', { maximumFractionDigits: b == null ? 2 : b }); };

    function ek5EkranCiz() {
        const s = D.st;
        const satirlar = [];
        let ipucu = 'Ara…';
        if (D.ekran === 'BOYAHANE_URETIM') {
            const m = D.dk.tb ? terbiyeListeModeli({ tur: s.tbTur, arama: '', durum: s.tbDurum, firma: s.tbFirma }) : null;
            satirlar.push(sekmeCip('tbTur', [['BOBIN', '🧵 Bobin boya', m ? m.acikSay.BOBIN : null], ['KUMAS', '🎨 Kumaş boya', m ? m.acikSay.KUMAS : null]])
                + sekmeCip('tbGor', [['IS', 'Boya işleri'], ['STOK', 'Boyahanede ne var'], ['RENK', 'Müşteri renkleri'], ['CARI', 'Boyahaneler (cari)']]));
            if (s.tbGor === 'IS') {
                satirlar.push(sekmeCip('tbDurum', [['ACIK', 'Açık'], ['BITEN', 'Biten'], ['TUMU', 'Tümü']])
                    + (m ? sekmeCip('tbFirma', [['HEPSI', 'Tüm boyahaneler'], ...m.firmalar.map(f => [f, f])]) : ''));
            }
            ipucu = s.tbGor === 'RENK' ? 'Müşteri, renk, renk kodu, iplik, boyahane…' : 'Sipariş, renk, malzeme, firma…';
        } else if (D.ekran === 'NUMUNE') {
            const say = D.dk.nm ? numuneDurumSayilari(s.nmTur) : {};
            satirlar.push(sekmeCip('nmTur', [['KUMAS', '🧵 Kumaş numune'], ['MAMUL', '🧥 Mamül numune']]));
            satirlar.push(sekmeCip('nmDurum', [['ACIK', 'Açık', say.ACIK], ['HEPSI', 'Hepsi', say.HEPSI], ...NUMUNE_DURUMLAR.map(([d, ad]) => [d, ad, say[d]]), ['SILINEN', 'Silinenler']]));
            ipucu = 'Numune no, müşteri, desen, sorumlu…';
        } else if (D.ekran === 'KART_LISTE') {
            const say = D.hazir.sip ? stokKartListeSayilari(s.ara.trim()) : {};
            satirlar.push(sekmeCip('kSekme', [['IPLIK', '🧶 İplik', say.iplik], ['KUMAS', '🏁 Kumaş', say.kumas], ['MAMUL', '🧥 Mamül', say.mamul]]));
            ipucu = 'Kod, desen adı, müşteri, renk, ebat, iplik no, lot…';
        } else {
            ipucu = 'Sipariş no, müşteri…';
        }
        return stokEkranBas(modAd(D.ekran), ipucu, satirlar, ek5Govde());
    }
    function ek5Govde() {
        if (D.ekran === 'BOYAHANE_URETIM') return tbGovde();
        if (D.ekran === 'NUMUNE') return nmGovde();
        if (D.ekran === 'KART_LISTE') return kartGovde();
        return uaGovde();
    }

    /* ── Terbiye ── */
    const TB_DURUM = { BEKLIYOR: ['Gönderilmedi', '#B54708', '#FEF4E6'], BOYAHANEDE: ['Boyahanede', '#175CD3', '#E8F1FD'], GELDI: ['Hepsi geldi', '#067647', '#E7F6EC'], TAMAM: ['Bitti', '#067647', '#E7F6EC'] };
    function tbGovde() {
        const s = D.st;
        if (!D.dk.tb) {
            if (!D.dk.tbYuk) setTimeout(() => tbYukle(false), 0);
            return dkHata() || dkBekliyor('Boya işleri okunuyor…');
        }
        if (s.tbGor === 'CARI') return fasonCariGovde('TERBIYE');
        if (s.tbGor === 'STOK') {
            const m = terbiyeBoyahaneStokModeli(s.tbTur);
            if (!m.acik.length) return dkBekliyor(`Boyahanelerde bekleyen ${m.A.malzemeAd.toLocaleLowerCase('tr-TR')} yok.`);
            return `${ozetSatir([['Boyahanelerde toplam', esc(terbiyeMiktar(m.genel, m.A)), '#B54708'], ['Açık iş', fmt(m.acik.length)]])}
                ${m.bloklar.map(b => `<div class="bolum-baslik"><span>🏭 ${esc(b.firma)}</span><span class="soluk" style="font-size:12px;font-weight:400">${b.isler.length} iş · ${esc(terbiyeMiktar(b.toplam, m.A))}</span></div>
                <div class="liste-kutu">${b.isler.map(({ o, mal, sonGon, gun, yakin }) => urunSatiri(`${o.tanim.renk || '—'}${o.tanim.renk_kodu ? ' · ' + o.tanim.renk_kodu : ''}`,
                    [mal || o.tanim.malzeme, o.siparis ? `${o.siparis.sno || ''} · ${o.siparis.firma || ''}` : 'Stok için',
                        sonGon ? `son gönderim ${fasonTarihYaz(sonGon.tarih)}${gun != null ? ' · ' + gun + ' gün' : ''}` : '',
                        o.termin ? `termin ${fasonTarihYaz(o.termin)}${o.gecikme ? ` · ${o.gecikme} gün geçti` : yakin ? ` · ${o.terminKalan ? o.terminKalan + ' gün' : 'bugün'}` : ''}` : ''].filter(Boolean).join(' · '),
                    terbiyeMiktar(o.kalan, m.A), `giden ${terbiyeMiktar(o.net, m.A)} · gelen ${terbiyeMiktar(o.gelen[m.A.ana], m.A)}`)).join('')}</div>`).join('')}`;
        }
        if (s.tbGor === 'RENK') {
            const l = terbiyeMusteriRenkleriSuz(s.ara);
            if (!l.length) return dkBekliyor(s.ara ? 'Aramaya uyan renk yok.' : 'Henüz boya işi yok.');
            return l.slice(0, s.limit).map(m => `<div class="bolum-baslik"><span>👤 ${esc(m.musteri)}</span><span class="soluk" style="font-size:12px;font-weight:400">${m.renkler.length} renk</span></div>
                <div class="liste-kutu">${m.renkler.map(r => `<div class="satir" style="flex-direction:column;align-items:stretch;gap:3px">
                    <span class="ust">${esc(r.renkKodu || '—')} · ${esc([...r.renkler].join(' / ') || '—')}</span>
                    <span class="alt">${esc([r.malzeme.join(', '), r.boyahaneler.join(', ')].filter(Boolean).join(' · ') || '—')}</span>
                    <span class="alt">${r.isler.map(o => `${o.A.ikon} ${esc(o.siparis?.sno || 'stok')} · ${esc(fasonTarihYaz(terbiyeIsTarihi(o)))}`).join('  ')}</span>
                    <span style="display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12px"><span><span class="soluk">Boyalı gelen</span> <b>${esc([r.gelenKg ? fasonFmtM(r.gelenKg) + ' kg' : '', r.gelenMt ? fasonFmtM(r.gelenMt) + ' m' : ''].filter(Boolean).join(' · ') || '—')}</b></span>
                        <span><span class="soluk">Fire</span> <b>${r.fire != null ? '%' + esc(fasonFmtM(r.fire)) : '—'}</b></span>
                        ${r.kartlar.map(k => `<span><span class="soluk">${esc(k.kod)}</span> <b style="color:${k.kg > 0.001 ? '#067647' : '#98A2B3'}">${esc(fasonFmtM(k.kg))} kg</b></span>`).join('')}</span></div>`).join('')}</div>`).join('')
                + (l.length > s.limit ? `<div class="kartlar">${dahaDugme(l.length)}</div>` : '');
        }
        const m = terbiyeListeModeli({ tur: s.tbTur, arama: s.ara, durum: s.tbDurum, firma: s.tbFirma });
        const A = m.A;
        const ozet = ozetSatir([['Boyahanede', esc(terbiyeMiktar(m.boyahanede, A)), '#0B7EA8'], ['Daha gönderilecek', esc(terbiyeMiktar(m.gonderilecek, A)), '#B54708'],
            ['Açık / geciken', `${fasonFmtI(m.acik.length)} / ${fasonFmtI(m.geciken)}`, m.geciken ? '#B42318' : '']])
            + (fasonFiyatGorur() ? ozetSatir([['Hakediş', fasonParaMetin(m.hakedis), '#067647']]) : '')
            + (m.firmaKalan.size ? `<div class="soluk" style="padding:8px 20px 0;font-size:12px">${[...m.firmaKalan].map(([f, v]) => `${esc(f)}: ${esc(terbiyeMiktar(v, A))}`).join(' · ')}</div>` : '');
        const kartlar = m.liste.slice(0, s.limit).map(o => {
            const anahtar = 'T|' + o.b.anahtar;
            const acik = s.acik === anahtar;
            const [dAd, dRenk, dZemin] = TB_DURUM[o.durum] || ['—', '#475467', '#F2F4F7'];
            const yakin = o.terminKalan != null && o.terminKalan >= 0 && o.terminKalan <= ERP_UYARI_ESIK.boyahaneTerminGun;
            const sip = o.siparis ? `${o.siparis.sno || ''} · ${o.siparis.firma || ''}` : (o.tanim.siparis_id ? `#${o.tanim.siparis_id}` : 'Stok için');
            const kutu = (ad, v, renk) => `<span><span class="soluk" style="display:block;font-size:11px">${ad}</span><b style="color:${renk || '#101828'}">${esc(v)}</b></span>`;
            return `<div class="sip-kart" style="padding:0;gap:0;border-left:3px solid ${o.gecikme ? '#B42318' : o.kapali ? '#067647' : '#0B7EA8'}"><button style="display:flex;flex-direction:column;gap:8px;padding:12px;width:100%" data-is="st-ac" data-d="${esc(anahtar)}">
                <span class="sip-ust" style="width:100%"><span class="satir-orta"><span class="sip-no">${o.tur === 'KUMAS' ? esc(terbiyeIslemAd(o.islem)) + ' · ' : ''}${esc(terbiyeRenkGoster(o.tanim) || (o.islem === 'YIKAMA' ? '' : 'Renk yok'))}${o.tanim.renk_kodu ? ' · ' + esc(o.tanim.renk_kodu) : ''}</span>
                    <span class="alt tek-satir">${esc(o.tanim.malzeme || A.malzemeAd)} · ${esc(sip)}${o.tanim.kalem_ad ? ' · ' + esc(o.tanim.kalem_ad) : ''}</span></span>
                    <span class="hap" style="background:${dZemin};color:${dRenk}">${esc(dAd)}</span></span>
                <span class="cubuk-satir" style="width:100%"><span class="cubuk"><i style="width:${terbiyeIlerleme(o)}%;background:#067647"></i></span><span class="yuzde">%${terbiyeIlerleme(o)}</span></span>
                <span style="display:grid;grid-template-columns:repeat(${o.hedef ? 4 : 3},minmax(0,1fr));gap:4px;width:100%;font-size:12px;text-align:left">
                    ${o.hedef ? kutu('Boyanacak', terbiyeMiktar(o.hedef, A)) : ''}${kutu('Gönderilen', terbiyeMiktar(o.net, A), '#0B7EA8')}${kutu('Boyalı gelen', terbiyeMiktar(o.gelen[A.ana], A), '#067647')}
                    ${kutu(o.kapali ? 'Fire' : 'Boyahanede', terbiyeMiktar(o.kapali ? o.fire : o.kalan, A), o.kapali ? '#98A2B3' : (o.kalan > 0.004 ? '#B54708' : '#98A2B3'))}</span>
                <span class="sip-alt" style="width:100%"><span style="font-weight:600;color:#B54708" class="tek-satir">🏭 ${esc(o.firma || 'boyahane yok')}</span>
                    <span style="color:${o.gecikme ? '#B42318' : yakin ? '#B54708' : '#667085'};font-weight:${o.gecikme || yakin ? 700 : 400}">${o.termin ? `${o.boyahaneTermin ? 'boyahane' : 'istenen'} ${esc(fasonTarihYaz(o.termin))}${o.gecikme ? ` · ${o.gecikme} gün geçti` : yakin ? ` · ${o.terminKalan ? o.terminKalan + ' gün' : 'bugün'}` : ''}` : ''}</span></span></button>
                ${acik ? `<div style="padding:0 14px 12px;border-top:1px solid var(--cizgi)">${tbDetay(o)}</div>` : ''}</div>`;
        }).join('');
        return `${ozet}<div class="kartlar">${kartlar || `<div class="sip-kart"><div class="bos">${m.hepsi.length ? 'Süzgece uyan iş yok.' : `Henüz ${esc(A.ad.toLocaleLowerCase('tr-TR'))} işi yok.`}</div></div>`}${dahaDugme(m.liste.length)}</div>`;
    }
    function tbDetay(o) {
        const A = o.A;
        const bilgi = terbiyeIsBilgiParcalari(o);
        const gecmis = terbiyeTerminGecmisi(o.b.anahtar).filter(g => g.eski);
        const iplikler = terbiyeGonderilenIplikler(o);
        const dm = terbiyeDefterModeli(o);
        return `${bilgi.length ? `<div style="padding-top:10px;font-size:13px;line-height:1.6;color:#344054">${bilgi.join(' · ')}</div>` : ''}
            ${o.tanim.not ? `<div class="soluk" style="padding-top:6px">📝 ${esc(o.tanim.not)}</div>` : ''}
            ${bilgiSatiri('İstenen termin', o.istenenTermin ? fasonTarihYaz(o.istenenTermin) : '—')}${bilgiSatiri('Boyahanenin verdiği', o.boyahaneTermin ? fasonTarihYaz(o.boyahaneTermin) : '— girilmedi')}
            ${gecmis.map(g => bilgiSatiri(g.tur === 'BOYAHANE' ? 'Termin değişti (boyahane)' : 'Termin değişti (istenen)', `${fasonTarihYaz(g.eski)} → ${g.yeni ? fasonTarihYaz(g.yeni) : 'silindi'} · ${g.user || ''}`)).join('')}
            ${o.tur === 'BOBIN' ? bilgiSatiri('Bobin', [terbiyeBobinTipAd(o.tanim.bobin_tipi), o.tanim.bobin_kg ? `${fasonFmtM(fasonTakipNum(o.tanim.bobin_kg, 3))} kg / bobin` : ''].filter(Boolean).join(' · ') || 'tipi / ağırlığı girilmedi') : ''}
            ${iplikler.map(v => bilgiSatiri(v.metin || '—', `${fasonFmtM(v.kg)} kg${v.top ? ' · ' + fasonFmtI(v.top) + ' bobin' : ''}`)).join('')}
            ${o.tur === 'KUMAS' ? bilgiSatiri('Talimat', terbiyeKumasTeknikMetin(o.tanim) || 'en / gramaj / tolerans / tuşe girilmedi') : ''}
            ${dm.satirlar.length ? `<div style="font-weight:700;padding:10px 0 4px">⚖ Giden ↔ gelen${dm.oran != null ? ` <span class="soluk" style="font-weight:400">· gelen / giden %${esc(fasonFmtM(dm.oran))}</span>` : ''}</div>
                ${dm.satirlar.map(({ h, giden, v, kalan }) => { const t = FASON_TIPLER[h.tip] || {};
                    return `<div class="bilgi-satir"><span><span style="font-weight:500">${esc(fasonTarihYaz(h.tarih))} · ${esc(t.ikon || '')} ${esc(t.ad || h.tip)}</span>
                        <span class="soluk" style="display:block;font-size:12px">${esc(o.tur === 'BOBIN' ? [h.iplik_kodu, h.iplik_ad, h.lot_no ? 'lot ' + h.lot_no : ''].filter(Boolean).join(' · ') : [h.kumas_kodu, h.kumas_ad].filter(Boolean).join(' · '))}${h.fis_no ? ' · irs. ' + esc(h.fis_no) : ''}</span></span>
                        <span class="d" style="text-align:right"><span style="color:${giden ? '#0B7EA8' : '#067647'}">${giden ? '+' : '−'}${esc(terbiyeMiktar(v, A))}</span><span class="soluk" style="display:block;font-size:12px">kalan ${esc(terbiyeMiktar(kalan, A))}</span></span></div>`; }).join('')}` : ''}`;
    }

    /* ── Numune ── */
    function nmGovde() {
        const s = D.st;
        if (!D.dk.nm) {
            if (!D.dk.nmYuk) setTimeout(() => nmYukle(false), 0);
            return dkHata() || dkBekliyor('Numuneler okunuyor…');
        }
        if (_numune.tabloYok) return dkBekliyor('Numune tablosu henüz kurulmamış.');
        if (_numune.hata) return dkBekliyor('Numuneler okunamadı: ' + _numune.hata);
        const l = numuneListeSatirlari(s.ara, s.nmTur, s.nmDurum);
        const bugun = numuneBugun();
        const kartlar = l.slice(0, s.limit).map(r => {
            const [, dAd, dRenk] = numuneDurumBilgi(r.durum);
            const gecikti = numuneGeciktiMi(r, bugun);
            const anahtar = 'N|' + r.id;
            const acik = s.acik === anahtar;
            const tam = D.dk.nmTam[r.id];
            if (acik && tam === undefined) {
                D.dk.nmTam[r.id] = null;
                numuneTamSatir(r.id).then(x => { D.dk.nmTam[r.id] = x || false; stokGovdeTazele(); }).catch(() => { D.dk.nmTam[r.id] = false; stokGovdeTazele(); });
            }
            const kayit = tam || r;
            const bildirim = tam ? numuneGeriBildirimler(tam) : [];
            return `<div class="sip-kart" style="padding:0;gap:0;${r.silindi ? 'opacity:.55' : ''}"><button style="display:flex;flex-direction:column;gap:6px;padding:12px;width:100%" data-is="st-ac" data-d="${esc(anahtar)}">
                <span class="sip-ust" style="width:100%"><span class="satir-orta"><span class="sip-no">${esc(r.numune_no)}</span><span class="alt tek-satir">${esc(r.musteri || '—')} · ${esc(r.urun_adi || '—')}</span></span>
                    <span class="hap" style="background:${dRenk}22;color:${dRenk}">${esc(dAd)}</span></span>
                <span class="sip-alt" style="width:100%"><span class="soluk">${esc([numuneMiktarMetni(r), r.sorumlu, r.kart_kodu ? 'kart ' + r.kart_kodu : ''].filter(Boolean).join(' · '))}</span>
                    <span style="color:${gecikti ? '#B42318' : '#667085'};font-weight:${gecikti ? 700 : 400}">${r.termin ? 'termin ' + esc(numuneTarihTr(r.termin)) + (gecikti ? ' ⚠' : '') : ''}</span></span></button>
                ${acik ? `<div style="padding:0 14px 12px;border-top:1px solid var(--cizgi)">${numuneBilgiSatirlari(kayit).map(([a, d]) => bilgiSatiri(a, d)).join('')}
                    ${kayit.aciklama ? bilgiSatiri('Numune notu', kayit.aciklama) : ''}
                    ${tam === null || tam === undefined ? '<div class="soluk" style="padding-top:6px">Ayrıntı okunuyor…</div>' : ''}
                    ${bildirim.map(b => bilgiSatiri(`${b.durum} · ${b.k || ''}`, b.not)).join('')}</div>` : ''}</div>`;
        }).join('');
        return `${ozetSatir([['Listede', fmt(l.length)], ['Toplam numune', fmt(_numune.liste.length)]])}<div class="kartlar">${kartlar || '<div class="sip-kart"><div class="bos">Bu süzgeçte numune yok.</div></div>'}${dahaDugme(l.length)}</div>`;
    }

    /* ── Stok kartları (ürün arşivi) ── */
    function kartGovde() {
        const s = D.st;
        if (!D.hazir.sip) return dkBekliyor('Kartlar yükleniyor…');
        const r = stokKartTumuSatirlari(s.ara.toLowerCase().trim());
        const pdfDugme = (rec, grup) => `<button class="cip" style="background:#E7EBF8;margin-top:8px" data-is="kart-pdf" data-d="${esc(grup + '|' + rec.id)}">⤓ Kartın PDF'i</button>`;
        let kartlar = '', n = 0;
        if (s.kSekme === 'IPLIK') {
            n = r.iplikRows.length;
            kartlar = r.iplikRows.slice(0, s.limit).map(i => {
                const x = iplikKartListeSatirModeli(i);
                const anahtar = 'KI|' + i.id;
                const lotlar = x.lots.map(l => `<div class="bilgi-satir"><span><span style="font-weight:500">${esc(l.lot_no || '—')}</span> <span class="soluk">${esc([l.marka, l.renk, l.tedarikci, l.cuval_rengi].filter(v => v && v !== '—').join(' · '))}</span></span>
                    <span class="d">${fmt(parseInt(l.cuval_sayisi, 10) || 0)} çuval · ${esc(fmtTr(l.miktar_kg))} kg</span></div>`).join('');
                return stokKartCerceve(anahtar, '#C11574', '#FCE7F3', 'İP', `${i.stok_kodu || '—'} · ${i.iplik_no || '—'}`, i.cins || '', `<span style="font-size:15px;font-weight:700;color:${x.tot > 0 ? '#067647' : '#98A2B3'}">${esc(fmtTr(x.tot))} kg</span>`,
                    `${x.lots.length} lot`, (lotlar ? `<div class="soluk" style="padding-top:8px;font-size:12px">Lotlar</div>${lotlar}${bilgiSatiri('Toplam', `${fmt(x.cuval)} çuval · ${fmtTr(x.tot)} kg`)}` : '<div class="bos">Lot yok.</div>') + pdfDugme(i, 'IPLIK'));
            }).join('');
        } else if (s.kSekme === 'KUMAS') {
            const gruplar = stokKartKumasGruplari(r.kumasRows);
            n = gruplar.length;
            kartlar = gruplar.slice(0, s.limit).map(g => {
                const x = kumasKartListeSatirModeli(g);
                const anahtar = 'KK|' + g.anaKod;
                const varyant = x.varyantlar.map(v => `<div class="bilgi-satir"><span><span style="font-weight:500">${esc(v.kod)}</span> <span class="soluk">${esc([v.terbiye, v.renk, v.renk_kodu].filter(Boolean).join(' · '))}</span></span><span class="d">${esc(fmtTr(v.stok, 1))} mt</span></div>${kartFotoHtml(v.record)}`).join('');
                return stokKartCerceve(anahtar, '#0E7C70', '#E3F5F2', 'KU', g.anaKod, [x.d.desen_adi, x.d.kumas_cinsi, x.d.musteri].filter(v => v && v !== '—').join(' · '),
                    `<span style="font-size:15px;font-weight:700;color:${x.toplamMt > 0 ? '#067647' : x.toplamMt < 0 ? '#B42318' : '#98A2B3'}">${esc(fmtTr(x.toplamMt, 1))} mt</span>`,
                    x.cokluVaryant ? `${x.vSayToplam} varyant` : esc(x.terbiye),
                    bilgiSatiri('Tarih', x.d.tarih) + bilgiSatiri('Tarak eni / mamül en', `${x.d.tarak_eni || '—'} / ${x.d.mamul_en || '—'}`) + bilgiSatiri('Müşteri', x.d.musteri)
                    + kartFotoHtml(g.parent?.record) + (varyant ? `<div class="soluk" style="padding-top:8px;font-size:12px">Varyantlar</div>${varyant}` : '') + (g.parent?.record ? pdfDugme(g.parent.record, 'KUMAS') : ''));
            }).join('');
        } else {
            const gruplar = mamulKartListeGruplariOlustur(r.mamulRows);
            n = gruplar.length;
            kartlar = gruplar.slice(0, s.limit).map(g => {
                const x = mamulKartListeSatirModeli(g);
                const anahtar = 'KM|' + g.anaKod;
                const varyant = x.varyantlar.map(v => `<div class="bilgi-satir"><span><span style="font-weight:500">${esc(v.sku)}</span> <span class="soluk">${esc(v.renk_etiket || '')}</span></span><span class="d">${esc(v.stok == null ? '—' : String(v.stok))}</span></div>${v.recordId != null && v.recordId !== g.parent?.record?.id ? kartFotoHtml((dataCache.kumas_kutuphanesi || []).find(k => String(k.id) === String(v.recordId))) : ''}`).join('');
                return stokKartCerceve(anahtar, '#3538CD', '#EEF0FF', 'MA', g.anaKod, [x.d.desen_adi, x.d.istenen_mamul_ebat, x.d.musteri].filter(v => v && v !== '—').join(' · '),
                    `<span style="font-size:14px;font-weight:700">${esc(x.toplamStok)}</span>`, esc(x.renkOzet),
                    bilgiSatiri('Tarih', x.d.tarih) + bilgiSatiri('Kumaş cinsi', x.d.kumas_cinsi) + bilgiSatiri('İstenen ebat', x.d.istenen_mamul_ebat)
                    + kartFotoHtml(g.parent?.record) + (varyant ? `<div class="soluk" style="padding-top:8px;font-size:12px">Renk varyantları</div>${varyant}` : '') + (g.parent?.record ? pdfDugme(g.parent.record, 'MAMUL') : ''));
            }).join('');
        }
        return `<div class="kartlar">${kartlar || '<div class="sip-kart"><div class="bos">Kart yok.</div></div>'}${dahaDugme(n)}</div>`;
    }

    /* ── Ürün ağacı / teknik föy ── */
    function uaGovde() {
        const s = D.st;
        if (!D.dk.uaOku) {
            if (!D.dk.uaOkuYuk) setTimeout(uaYukle, 0);
            return dkHata() || dkBekliyor('Ürün ağaçları okunuyor…');
        }
        if (!s.sid) {
            const l = kfAra(D.dk.ua, x => [x.sno, x.firma]);
            const tanimsiz = D.dk.ua.filter(x => x.tanimsiz).length;
            const kartlar = l.slice(0, s.limit).map(x => `<button class="sip-kart" data-is="dk-sip" data-d="${esc(x.id)}"><span class="sip-ust"><span class="satir-orta"><span class="sip-no">${esc(x.sno || '—')}</span>
                <span class="alt tek-satir">${esc(x.firma || '—')}</span></span><span class="hap" style="background:${x.tanimsiz ? '#FEF4E6' : '#E7F6EC'};color:${x.tanimsiz ? '#B54708' : '#067647'}">${x.tanimsiz ? '○ Tanımsız' : '✓ Tanımlı'}</span></span></button>`).join('');
            return `${ozetSatir([['Açık sipariş', fmt(D.dk.ua.length)], ['Tanımsız', fmt(tanimsiz), tanimsiz ? '#B54708' : '#067647']])}<div class="kartlar">${kartlar || '<div class="sip-kart"><div class="bos">Sipariş yok.</div></div>'}${dahaDugme(l.length)}</div>`;
        }
        const sip = siparisler().find(x => String(x.id) === String(s.sid));
        if (!sip) return dkBekliyor('Sipariş bulunamadı.');
        const kalemler = uaSiparisKalemleriGetir(sip);
        const agac = (_kdCache[`KD_URUN_AGACI_${sip.id}`] || {}).siparis || {};
        const geri = `<button class="cip" style="background:#E7EBF8;margin:12px 16px 0" data-is="dk-set" data-d="sid=">${svg(I.geri, 14)} ${esc(sip.sno || '')} · ${esc(sip.firma || '')} — başka sipariş</button>`;
        const kp = kumasPlaniHesapla(sip, kalemler);
        const kpHtml = kp.var ? `<div class="bolum-baslik"><span>🧵 Kumaş planı</span></div><div class="liste-kutu">${kp.kumaslar.map(k => urunSatiri(`${k.id} · ${k.ad || k.kod || 'kumaş'}`, k.kod || '',
            `boyalı ${kumasPlaniFmt(k.boyali)} m`, `ham ${kumasPlaniFmt(k.ham)} m`)).join('')}</div>` : '';
        const oz = uaKalemIslemOzeti(sip.id, kalemler, []);
        const ak = uaAksesuarPlani(sip, kalemler);
        const kalemKartlari = kalemler.map((k, i) => {
            const ua = uaGetCacheAgac(sip.id, i);
            const tanimli = ua.asamalar && ua.asamalar.length > 0;
            const anahtar = 'U|' + i;
            const acik = s.acik === anahtar;
            let ic = '';
            if (acik) {
                const utg = uaEnsureUrunTeknikGenel(ua);
                const yerAd = { SIMTEKS_KONF: 'Simteks konfeksiyon', FASON_KONF: 'Fason konfeksiyon', DOGRUDAN_SEVK: 'Doğrudan sevk' }[utg.uretim_yeri] || utg.uretim_yeri || '—';
                const sira = (ua.asamalar || []).map(id => UA_ASAMALAR.find(a => a.id === id)).filter(Boolean);
                ic = bilgiSatiri('Üretim yeri', yerAd) + (utg.uretim_yeri === 'FASON_KONF' ? bilgiSatiri('Fason firma', utg.fason_firma || '—') : '')
                    + bilgiSatiri('Aşamalar', sira.map((a, n) => `${n + 1}. ${a.label}`).join(' → ') || 'seçilmedi')
                    + (uaSayi(ua.kumas_metre) ? bilgiSatiri('Kumaş', `${fmtTr(uaSayi(ua.kumas_metre))} m / ürün · tolerans %${fmtTr(uaSayi(ua.kumas_tolerans))}`) : '')
                    + (k.miktar && ua.kumas_metre ? bilgiSatiri('Tahmini toplam kumaş', uaTahminiKumasMetre(ua, k).toFixed(1) + ' metre') : '')
                    + bilgiSatiri('Not', ua.not || '') + uaDuzenleHtml(sip.id, i, ua);
            }
            return `<div class="sip-kart" style="padding:0;gap:0"><button style="display:flex;align-items:center;gap:10px;padding:12px;width:100%" data-is="st-ac" data-d="${esc(anahtar)}">
                <span class="satir-orta"><span style="font-weight:600" class="tek-satir">${esc(siparisKalemAdMetni(k) || k.kod || 'Ürün ' + (i + 1))}</span>
                    <span class="alt tek-satir">${esc([uaKalemRenkGetir(k) || '', uaKalemEbatGetir(k) || '', 'sipariş ' + (k.miktar || 0)].filter(Boolean).join(' · '))}</span></span>
                <span class="hap" style="background:${tanimli ? '#E7F6EC' : '#F2F4F7'};color:${tanimli ? '#067647' : '#98A2B3'}">${tanimli ? '✓ Tanımlı' : '—'}</span></button>
                ${acik ? `<div style="padding:0 14px 10px;border-top:1px solid var(--cizgi)">${ic}</div>` : ''}</div>`;
        }).join('');
        return `${geri}${ozetSatir([['Ağaç', agac.tamamlandi ? '✓ Tanımlı' : 'Tanımsız', agac.tamamlandi ? '#067647' : '#B54708'], ['Kalem', fmt(kalemler.length)]])}
            ${kpHtml}<div class="bolum-baslik"><span>Ürün kalemleri</span></div><div class="kartlar" style="padding-top:0">${kalemKartlari || '<div class="sip-kart"><div class="bos">Kalem yok.</div></div>'}</div>
            <div class="bolum-baslik"><span>İşlemler</span><span class="soluk" style="font-size:12px;font-weight:400">${oz.secili.length} kalem</span></div>
            <div class="liste-kutu">${oz.asamalar.map(({ a, kalemSay }, n) => urunSatiri(`${n + 1}. ${a.ikon} ${a.label}`, '', `${kalemSay} kalem`, '')).join('') || '<div class="bos">Tanımlı üretim aşaması yok.</div>'}</div>
            <div class="bolum-baslik"><span>Genel aksesuar planı</span><span class="soluk" style="font-size:12px;font-weight:400">${ak.fasonAdet ? 'fason ' + fmt(ak.fasonAdet) + ' adet' : ''}</span></div>
            <div class="liste-kutu">${ak.dolu.map(a => { const t = ak.toplamlar.find(x => x.ak.id === a.id);
                return urunSatiri(a.label, a.birim, String(ak.genel[a.id]), ak.fasonAdet > 0 && t ? `fason toplam ${fmtTr(t.top, 1)}` : ''); }).join('') || '<div class="bos">Boş.</div>'}</div>
            ${uaAksesuarDuzenleHtml(sip, ak)}`;
    }

    /* ════ YÖNETİM + YAZABİLEN EKRANLAR (22.10.2026) — hesap ana programdan, yazma yalnız kapıdan (ykKapiKur):
       Günlük işlemler  gunlukYukle → _gunluk.satirlar → gunlukListeModeli / gunlukAcYolu (18)
       Kullanıcılar     erpAdminKullanicilariOku / erpAdminListeModeli (03) + erpAktifYukle / erpAktifHesapla (17) — yalnız görüntü
       Stok sayımı      assets/stok-sayim.js: sayimSatirlariOlustur / sayimFiltreleSatirlar / sayimMobilFiltrele / sayimMobilSayilari,
                        giriş stokSayimSayiYaz / stokSayimSayiEkle, oturum stokSayimOturumBaslat / Duraklat, kayıt stokSayimKaydet (TEK yazıcı)
       Fason cari       fasonCariListesi / fasonEkstreModeli / fasonDefterSatirlari (12) — dokuma, konfeksiyon, terbiye
       Fotoğraf         sipariş: siparisFotoEkleDosyalarla (08) · kart: kartFotografKaydet (01)
       Ürün ağacı       yönetici: uaSecimAyarla + uaAsamaKucukTikla / uaAsamaSiraDegistir / uaUrunTeknikGenelGuncelle / uaFieldGuncelle /
                        uaAksesuarGenelGuncelle / uaKaydet (06) ════ */
    const YON_EKRANLAR = ['GUNLUK_ISLEMLER', 'KULLANICI_YONETIMI', 'STOK_SAYIM'];
    Object.assign(D.dk, { gi: false, giYuk: false, giGun: '', ky: null, kyOku: false, kyOkuYuk: false, sy: false, syYuk: false });
    const giYukle = (zorla) => dkYukle('gi', async () => {
        if (!_gunluk.gun || zorla === 'gun') _gunluk.gun = D.st.giGun || gunlukBugun();
        D.dk.giGun = _gunluk.gun;
        await Promise.all([gunlukYukle(true), _erpAktif.veri ? null : erpAktifYukle().catch(() => {})]);
    });
    const kyYukle = () => dkYukle('kyOku', async () => {
        const [r] = await Promise.all([erpAdminKullanicilariOku(), erpAktifYukle().catch(() => {})]);
        if (!r.ok) throw new Error(r.err);
        D.dk.ky = r.users;
    });
    const syYukle = () => dkYukle('sy', async () => { await sayimArsivSunucudanCek({}); });

    function yonEkranCiz() {
        const s = D.st;
        const satirlar = [];
        let ipucu = 'Ara…';
        if (D.ekran === 'GUNLUK_ISLEMLER') {
            const gun = D.dk.giGun || s.giGun || gunlukBugun();
            satirlar.push(cip('gi-gun', '-1', '‹ Önceki gün', false) + `<span class="cip" style="background:transparent;font-weight:700">${esc(gunlukTrTarih(gun))}</span>`
                + (gun < gunlukBugun() ? cip('gi-gun', '1', 'Sonraki gün ›', false) + cip('gi-gun', '0', 'Bugün', false) : ''));
            if (D.dk.gi) {
                const lm = gunlukListeModeli(_gunluk.satirlar, { kisi: s.giKisi, tur: s.giTur, ara: s.ara });
                const sirala = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);
                /* Aktif kullanıcılardan gelinen kişinin o gün kaydı yoksa da çipi görünür (0) — dokununca süzgeç kalkar */
                const kisiler = sirala(lm.kisiSay); if (s.giKisi && !lm.kisiSay.has(s.giKisi)) kisiler.unshift([s.giKisi, 0]);
                satirlar.push(kisiler.map(([k, n]) => cip('gi-suz', 'giKisi|' + k, k, s.giKisi === k, n)).join(''));
                satirlar.push(sirala(lm.turSay).map(([k, n]) => cip('gi-suz', 'giTur|' + k, k, s.giTur === k, n)).join(''));
            }
            ipucu = 'Sipariş no, ürün, firma, kişi…';
        } else if (D.ekran === 'KULLANICI_YONETIMI') {
            ipucu = 'Ad ya da kullanıcı adı…';
        } else {
            sayimOturumHazirla();
            const tumu = sayimSatirlariOlustur();
            const say = sayimMobilSayilari(tumu);
            satirlar.push(sekmeCip('syTip', [['MAMUL', 'Mamül'], ['KUMAS', 'Kumaş'], ['IPLIK', 'İplik']]) + cip('dk-set', 'syEkran=' + (s.syEkran === 'RAPOR' ? 'SAYIM' : 'RAPOR'), 'Raporlar', s.syEkran === 'RAPOR'));
            if (s.syEkran !== 'RAPOR') satirlar.push([['SAYILACAK', 'Sayılacak', say.sayilacakN], ['SAYILAN', 'Sayılan', say.sayilanN], ['TUMU', 'Tümü']]
                .map(([k, a, n]) => cip('sy-filtre', k, a, _sayimMobilFiltre === k, n)).join(''));
            ipucu = 'Stok kodu, ürün, renk, lot…';
        }
        return stokEkranBas(modAd(D.ekran), ipucu, satirlar, yonGovde());
    }
    function yonGovde() {
        if (D.ekran === 'GUNLUK_ISLEMLER') return giGovde();
        if (D.ekran === 'KULLANICI_YONETIMI') return kyGovde();
        return syGovde();
    }
    const yalnizYonetici = () => dkBekliyor('Bu bölüme yalnızca yönetici erişebilir.');

    /* ── Günlük işlemler ── */
    const GI_EKRAN = { SIPARIS: null, KART: 'KART_LISTE', DEPO: 'DEPO_HAREKET_LISTE', KESIM: 'KONFEKSIYON_KESIM', KESIM_ONU: 'KONFEKSIYON_KESIM', YIKAMA: 'KONFEKSIYON_YIKAMA',
        DOKUMA_DEPO: 'DOKUMA_DEPO', TEZGAH: 'TEZGAH_PLANLAMA', DOKUMA: 'DOKUMA_TAKIP', TERBIYE: 'BOYAHANE_URETIM', NUMUNE: 'NUMUNE', KULLANICI: 'KULLANICI_YONETIMI', DOKUMA_FASON: 'DOKUMA_FASON_TAKIP' };
    function giGovde() {
        const s = D.st;
        if (!erpIsAdmin()) return yalnizYonetici();
        if (!D.dk.gi) {
            if (!D.dk.giYuk) setTimeout(() => giYukle(false), 0);
            return dkHata() || dkBekliyor('Günün işlemleri okunuyor…');
        }
        const lm = gunlukListeModeli(_gunluk.satirlar, { kisi: s.giKisi, tur: s.giTur, ara: s.ara });
        const satirlar = lm.gorunen.slice(0, s.limit).map((x, i) => {
            const yol = gunlukAcYolu(x);
            const d = new Date(x.ts);
            return `<div class="satir"><span class="etiket-kare" style="background:${x.iz ? '#FEF4E6' : '#E8F1FD'};color:${x.iz ? '#B54708' : '#175CD3'};font-size:11px">${esc(Number.isFinite(d.getTime()) ? d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '—')}</span>
                <span class="satir-orta"><span class="ust tek-satir">${esc(x.kisiAd)} · <span style="color:${x.iz ? '#B54708' : '#475467'};font-weight:500">${esc(x.tur)}</span></span><span class="alt">${esc(x.ayrinti || '—')}</span></span>
                ${yol ? `<button class="cip" style="background:#E7EBF8;flex:none" data-is="gi-ac" data-d="${i}">${esc(yol.etiket === 'Düzelt' ? 'Aç' : yol.etiket)}</button>` : ''}</div>`;
        }).join('');
        return `${ozetSatir([['İşlem', fmt(lm.tum.length)], ['Kişi', fmt(lm.kisiler)], ['Süzülen', fmt(lm.gorunen.length)]])}
            ${_gunluk.hatalar.length ? `<div class="kilit-not" style="margin:12px 16px 0">Okunamayan: ${esc(_gunluk.hatalar.join(' · '))}</div>` : ''}
            <div class="kartlar"><div class="soluk" style="padding:0 4px">Düzeltme kaydın kendi ekranında (ana program) yapılır</div>
            <div class="liste-kutu" style="margin:0">${satirlar || `<div class="bos">${lm.tum.length ? 'Süzgece uyan işlem yok.' : 'Bu gün kayıtlı işlem yok.'}</div>`}</div>${dahaDugme(lm.gorunen.length)}</div>`;
    }
    function giAc(i) {
        const lm = gunlukListeModeli(_gunluk.satirlar, { kisi: D.st.giKisi, tur: D.st.giTur, ara: D.st.ara });
        const x = lm.gorunen[i]; if (!x) return;
        const yol = gunlukAcYolu(x); if (!yol) return;
        const r = x.r || {};
        if (yol.tip === 'SIPARIS') {
            const sid = x.t === 'siparisler' ? r.id : (x.t === 'depo_hareket_iz' ? r.kayit_id : r.siparis_id);
            D.ekran = null; D.tab = 'siparis'; D.detay = String(sid); D.dsekme = 'kalem';
            return;
        }
        const ekran = GI_EKRAN[yol.tip]; if (!ekran) return;
        D.ekran = ekran; D.st = stBos();
        if (yol.tip === 'KART') D.st.ara = String(r.desen_kodu || r.stok_kodu || r.iplik_no || '').trim();
        if (yol.tip === 'DEPO') D.st.ara = String(r.stok_kodu || '').trim();
        if (yol.tip === 'DOKUMA' && r.siparis_id != null) D.st.sid = String(r.siparis_id);
    }

    /* ── Kullanıcı yönetimi (yalnız görüntü) ── */
    function kyGovde() {
        const s = D.st;
        if (!erpIsAdmin()) return yalnizYonetici();
        if (!D.dk.kyOku) {
            if (!D.dk.kyOkuYuk) setTimeout(kyYukle, 0);
            return dkHata() || dkBekliyor('Kullanıcılar okunuyor…');
        }
        const h = erpAktifHesapla();
        const aktif = (un) => h && h.kisiler.find(k => String(k.username || '').toLowerCase() === String(un || '').toLowerCase());
        const l = erpAdminListeModeli(D.dk.ky, s.ara);
        const etiketler = Object.fromEntries(ERP_PERM_MODES);
        const kartlar = l.map(x => {
            const p = aktif(x.un);
            const anahtar = 'U|' + x.un;
            const acik = s.acik === anahtar;
            const durum = p ? (p.cevrimici ? 'çevrimiçi · ' + p.cihazlar.map(c => erpAktifCihazMetin(c)).join(' / ') : erpAktifCevrimdisiMetin(p, h.simdi)) : '';
            const gunMetin = p ? erpAktifGunMetin(p) : '';
            const nokta = !p || !p.cevrimici ? '#98A2B3' : p.aktif === false ? '#B54708' : '#067647';
            const ekranlar = acik ? ERP_PERM_GROUP_DEFS.map(g => {
                const ac = g.kodlar.filter(kod => x.yonetici || erpModeAcikMi(kod, x.modlar, false));
                return ac.length ? bilgiSatiri(`${g.ikon} ${g.ad}`, ac.map(k => etiketler[k] || k).join(', ')) : '';
            }).join('') : '';
            return `<div class="sip-kart" style="padding:0;gap:0;${x.pasif ? 'opacity:.6' : ''}"><button style="display:flex;align-items:center;gap:10px;padding:12px;width:100%" data-is="st-ac" data-d="${esc(anahtar)}">
                <span class="avatar" style="position:relative">${esc(harf(x.u.display_name || x.un))}<span style="position:absolute;right:-1px;bottom:-1px;width:10px;height:10px;border-radius:50%;border:2px solid #fff;background:${nokta}"></span></span>
                <span class="satir-orta"><span style="font-weight:700" class="tek-satir">${esc(x.u.display_name || x.un)}</span>
                    <span class="alt tek-satir">${esc(x.un)} · ${x.yonetici ? 'tümü' : x.acikSayi + ' ekran'} · ${esc(x.ozet)}</span>
                    ${durum ? `<span class="alt tek-satir" style="color:${p && p.cevrimici ? '#067647' : '#667085'}">${esc(durum)}</span>` : ''}</span>
                <span style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex:none"><span class="hap" style="background:${x.yonetici ? '#F2EEFF' : '#F2F4F7'};color:${x.yonetici ? '#6927DA' : '#475467'}">${esc(x.rozet)}</span>
                    ${x.pasif ? '<span class="hap" style="background:#FEECEB;color:#B42318">Pasif</span>' : ''}${p && p.islem && p.islem.n ? `<span class="soluk">${fmt(p.islem.n)} işlem</span>` : ''}</span></button>
                ${acik ? `<div style="padding:0 14px 10px;border-top:1px solid var(--cizgi)">${gunMetin ? bilgiSatiri('Bugün', gunMetin) : ''}${ekranlar || bilgiSatiri('Ekranlar', 'yetki verilmemiş')}</div>` : ''}</div>`;
        }).join('');
        const cevrimici = h ? h.kisiler.filter(p => p.cevrimici).length : 0;
        return `${ozetSatir([['Kullanıcı', fmt(D.dk.ky.length)], ['Çevrimiçi', fmt(cevrimici), '#067647'], ['Pasif', fmt(D.dk.ky.filter(u => u.active === false).length)]])}
            <div class="kartlar"><div class="soluk" style="padding:0 4px">Yetki, şifre ve kullanıcı ekleme ana programda</div>${kartlar || '<div class="sip-kart"><div class="bos">Eşleşen kullanıcı yok.</div></div>'}</div>`;
    }

    /* ── Stok sayımı (yazar: yalnız sayım) ── */
    function syGovde() {
        const s = D.st;
        if (!ykYetki('STOK_SAYIM')) return dkBekliyor('Stok sayımı yetkiniz yok.');
        if (!D.dk.sy && !D.dk.syYuk) setTimeout(syYukle, 0);
        if (s.syEkran === 'RAPOR') return syRaporGovde();
        sayimOturumHazirla();
        _sayimAra = s.ara;
        const mamul = _sayimTip === 'MAMUL';
        const birim = sayimBirim();
        const tumu = sayimSatirlariOlustur();
        const l = sayimMobilFiltrele(sayimFiltreleSatirlar(tumu));
        const paket = sayimGirisPaketiniTopla();
        const aktif = sayimOturumAktifMi();
        const yaziN = (n) => sayimParcaYazi(n, mamul);
        let sonGrup = null;
        const kartlar = l.slice(0, s.limit).map(r => {
            const g = String(r.grup || r.ana_grup || 'Diğer').trim() || 'Diğer';
            const baslik = g !== sonGrup ? `<div class="soluk" style="padding:10px 4px 4px;font-weight:600;font-size:12px">${esc(g)}</div>` : '';
            sonGrup = g;
            const mevcut = sayimYuvarla(r.mevcut, mamul);
            const kayitli = sayimKayitliMi(r.stok_kodu);
            const meta = sayimKartMeta(r);
            const ust = `<span class="satir-orta"><span style="font-weight:700" class="tek-satir">${esc(r.label || r.kayit_kodu || r.stok_kodu)}</span>
                <span class="alt tek-satir">${esc([r.kayit_kodu || r.stok_kodu, meta].filter(Boolean).join(' · '))}</span></span>`;
            if (kayitli) {
                const sayilan = sayimParcaToplam(r.stok_kodu);
                const fark = sayimYuvarla(sayilan - mevcut, mamul);
                const parca = sayimParcalarAl(r.stok_kodu).map(yaziN).join(' + ');
                return `${baslik}<div class="sip-kart" style="gap:6px;border-left:3px solid #067647"><span class="sip-ust">${ust}<span style="font-size:16px;font-weight:700;flex:none">${esc(yaziN(sayilan))} <span class="soluk" style="font-weight:400">${birim}</span></span></span>
                    <span class="sip-alt"><span class="soluk">${esc(parca)} · stok ${esc(yaziN(mevcut))} ${birim}</span><span style="font-weight:700;color:${fark > 0 ? '#067647' : fark < 0 ? '#B42318' : '#667085'}">${fark === 0 ? '0' : (fark > 0 ? '+' : '') + esc(String(fark))}</span></span>
                    ${aktif && _sayimMobilFiltre === 'SAYILAN' ? `<span style="display:flex;gap:6px"><input class="sy-inp" data-kod="${esc(r.stok_kodu)}" inputmode="decimal" placeholder="Ekstra" style="flex:1;min-width:0;padding:10px 12px;border:1px solid var(--cizgi);border-radius:12px;font-size:15px">
                        <button class="cip" style="background:#E7EBF8" data-is="sy-ekle" data-d="${esc(r.stok_kodu)}">Ekle</button></span>` : ''}</div>`;
            }
            return `${baslik}<div class="sip-kart" style="gap:8px;${aktif ? '' : 'opacity:.75'}"><span class="sip-ust">${ust}
                    <button class="cip" style="flex:none;background:#F2F4F7" data-is="sy-stok" data-d="${esc(r.stok_kodu)}" ${aktif ? '' : 'disabled'} title="Stoğu sayılana kopyala">stok ${esc(yaziN(mevcut))} ${birim}</button></span>
                <span style="display:flex;gap:6px"><input class="sy-inp" data-kod="${esc(r.stok_kodu)}" inputmode="decimal" placeholder="Sayılan" ${aktif ? '' : 'disabled'}
                    value="${esc(_sayimGirisler[r.stok_kodu] || '')}" style="flex:1;min-width:0;padding:10px 12px;border:1px solid var(--cizgi);border-radius:12px;font-size:16px">
                    <button class="ana-dugme" style="width:auto;padding:0 18px;height:44px" data-is="sy-kaydet" data-d="${esc(r.stok_kodu)}" ${aktif ? '' : 'disabled'}>Kaydet</button></span></div>`;
        }).join('');
        const durumMetin = _sayimDurum === 'AKTIF' ? `Sayım sürüyor · ${sayimTipEtiket(_sayimTip)} · ${sayimSayilanAdet()} kalem`
            : _sayimDurum === 'DURAKLATILDI' ? `Sayım duraklatıldı · ${sayimSayilanAdet()} kalem bekliyor` : 'Sayım kapalı — başlatınca ürünleri tek tek kaydedin; rapor tamamlanınca oluşur';
        const bar = `<div class="kartlar" style="padding-bottom:0"><div class="sip-kart" style="flex-direction:row;align-items:center;gap:10px">
            <span class="satir-orta"><span style="font-weight:700">${esc(durumMetin)}</span><span class="alt">${paket.sayilanlar.length ? `${paket.sayilanlar.length} sayıldı · ${paket.farklar.length} fark` : 'Henüz sayı girilmedi'}</span></span>
            ${aktif ? `<button class="cip" style="background:#FEF4E6;color:#B54708;flex:none" data-is="sy-durum" data-d="DURAKLAT">Duraklat</button>`
                : `<button class="cip secili" style="flex:none" data-is="sy-durum" data-d="BASLAT">${_sayimDurum === 'DURAKLATILDI' ? 'Devam et' : 'Sayım başlasın'}</button>`}</div>
            ${_sayimDurum !== 'KAPALI' && paket.sayilanlar.length ? `<button class="ana-dugme" data-is="sy-tamam">Sayım tamamlandı (${paket.sayilanlar.length} kalem)</button>` : ''}</div>`;
        const bos = _sayimMobilFiltre === 'SAYILAN' ? 'Henüz sayılan ürün yok.' : 'Sayılacak ürün kalmadı.';
        return `${bar}<div class="kartlar">${kartlar || `<div class="sip-kart"><div class="bos">${bos}</div></div>`}${dahaDugme(l.length)}</div>`;
    }
    function syRaporGovde() {
        const s = D.st;
        const l = sayimArsivOku();
        const kartlar = l.slice(0, s.limit).map(r => {
            const anahtar = 'R|' + r.id;
            const acik = s.acik === anahtar;
            const gruplar = acik ? sayimGrupOzeti(r.satirlar) : [];
            return `<div class="sip-kart" style="padding:0;gap:0"><button style="display:flex;flex-direction:column;gap:4px;padding:12px;width:100%" data-is="st-ac" data-d="${esc(anahtar)}">
                <span class="sip-ust" style="width:100%"><span class="sip-no">${esc(r.id)}</span><span class="hap" style="background:#E7EBF8;color:#3B4A7A">${esc(sayimTipEtiket(r.tip))}</span></span>
                <span class="sip-alt" style="width:100%"><span class="soluk">${esc(new Date(r.tarih).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }))} · ${esc(r.kullanici || '')}</span>
                    <span style="font-weight:600">${fmt((r.satirlar || []).length)} kalem · ${fmt(r.fark_adet || 0)} fark</span></span></button>
                ${acik ? `<div style="padding:0 14px 10px;border-top:1px solid var(--cizgi)">${gruplar.map(g => bilgiSatiri(`${g.grup} · ${g.kalem} kalem`, `stok ${fmt1(g.eski)} → sayılan ${fmt1(g.sayilan)} · fark ${fmt1(g.fark)} ${r.birim || ''}`)).join('')}
                    ${(r.satirlar || []).filter(x => Number(x.fark) !== 0).slice(0, 80).map(x => bilgiSatiri(`${x.kayit_kodu || x.stok_kodu}${x.lot_no ? ' · lot ' + x.lot_no : ''}`, `${fmt1(x.mevcut)} → ${fmt1(x.sayilan)} (${x.fark > 0 ? '+' : ''}${fmt1(x.fark)})`)).join('')}</div>` : ''}</div>`;
        }).join('');
        return `<div class="kartlar">${kartlar || '<div class="sip-kart"><div class="bos">Sayım raporu yok.</div></div>'}${dahaDugme(l.length)}</div>`;
    }
    async function sySatir(is, kod, el) {
        const kutu = [...document.querySelectorAll('.sy-inp')].find(x => x.dataset.kod === kod);
        if (is === 'sy-stok') {
            const r = sayimSatirlariOlustur().find(x => x.stok_kodu === kod);
            if (kutu && r) { kutu.value = String(sayimYuvarla(r.mevcut, _sayimTip === 'MAMUL')); kutu.focus(); }
            return false;
        }
        const sonuc = is === 'sy-ekle' ? stokSayimSayiEkle(kod, kutu ? kutu.value : '') : stokSayimSayiYaz(kod, kutu ? kutu.value : '');
        if (!sonuc.ok) { if (sonuc.mesaj) erpToast(sonuc.mesaj, 'info'); if (sonuc.odak && kutu) kutu.focus(); return false; }
        if (sonuc.mesaj) erpToast(sonuc.mesaj, 'success');
        return true;
    }

    /* ── Fason firmalar & cari + işlem defteri (dokuma / konfeksiyon / terbiye) ── */
    function fasonCariGovde(alan) {
        const s = D.st;
        const fiyat = fasonFiyatGorur();
        const l = kfAra(fasonCariListesi(alan), r => [r.ad]);
        const alanAd = (a) => ({ DOKUMA: 'Dokuma', TERBIYE: 'Terbiye (boyahane)' })[a] || 'Konfeksiyon';
        const metin = (o) => String(fasonParaMetin(o)).replace(/<br>/g, ' · ');
        const kartlar = l.slice(0, s.limit).map(r => {
            const anahtar = 'C|' + r.key;
            const acik = s.acik === anahtar && fiyat;
            const em = acik ? fasonEkstreModeli(r.ad, alan || '') : null;
            return `<div class="sip-kart" style="padding:0;gap:0"><button style="display:flex;flex-direction:column;gap:4px;padding:12px;width:100%" data-is="st-ac" data-d="${esc(anahtar)}">
                <span class="sip-ust" style="width:100%"><span class="satir-orta"><span class="sip-no" style="color:#B54708">${esc(r.ad)}</span><span class="alt">${esc([...r.alanlar].map(alanAd).join(' · '))}</span></span>
                    <span class="hap" style="background:#F2F4F7;color:#475467">${fmt(r.is)} iş</span></span>
                ${fiyat ? `<span style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;width:100%;font-size:12px;text-align:left">
                    <span><span class="soluk" style="display:block;font-size:11px">Hakediş</span><b>${esc(metin(r.hakedis))}</b></span>
                    <span><span class="soluk" style="display:block;font-size:11px">Ödenen</span><b>${esc(metin(r.odeme))}</b></span>
                    <span><span class="soluk" style="display:block;font-size:11px">Bakiye</span><b style="color:#B42318">${esc(metin(r.bakiye))}</b></span></span>` : ''}</button>
                ${em ? `<div style="padding:0 14px 10px;border-top:1px solid var(--cizgi)"><div class="soluk" style="padding-top:8px;font-size:12px">Cari ekstre</div>
                    ${em.satirlar.map(({ s: x, bakiye }) => `<div class="bilgi-satir"><span><span style="font-weight:500">${esc(fasonTarihYaz(x.tarih))} · ${esc({ HAKEDIS: 'Hakediş', ODEME: 'Ödeme', KESINTI: 'Kesinti', EK_UCRET: 'Ek ücret' }[x.tur] || x.tur)}</span>
                        <span class="soluk" style="display:block;font-size:12px">${esc(x.aciklama)}</span></span>
                        <span class="d" style="text-align:right"><span style="color:${x.tutar < 0 ? '#067647' : '#101828'}">${esc(fasonFmtPara(x.tutar, x.pb))}</span><span class="soluk" style="display:block;font-size:12px">bakiye ${esc(fasonFmtPara(bakiye, x.pb))}</span></span></div>`).join('') || '<div class="bos">Hareket yok.</div>'}</div>` : ''}</div>`;
        }).join('');
        return `<div class="kartlar"><div class="soluk" style="padding:0 4px">Bakiye = hakediş − ödenen${fiyat ? ' · firmaya dokununca cari ekstre' : ' · tutarları yalnız fason fiyat yetkilisi görür'} · ödeme / kesinti girişi ana programda</div>
            ${kartlar || '<div class="sip-kart"><div class="bos">Fason firma yok.</div></div>'}${dahaDugme(l.length)}</div>`;
    }
    function fasonDefterGovde(alan) {
        const s = D.st;
        const l = fasonDefterSatirlari(alan, { arama: s.ara, defterTur: s.dfTur || 'HEPSI', firma: 'HEPSI' });
        const satirlar = l.slice(0, s.limit).map(x => `<div class="satir" style="flex-direction:column;align-items:stretch;gap:3px">
            <span class="ust" style="display:flex;justify-content:space-between;gap:8px"><span class="tek-satir">${esc(x.b.baslik || '—')}</span><span class="soluk" style="flex:none;font-weight:400">${esc(fasonZamanYaz(x.o.ts))}</span></span>
            <span class="alt">${esc([x.o.user, x.firma, x.o.n.tarih ? 'işlem ' + fasonTarihYaz(x.o.n.tarih) : ''].filter(Boolean).join(' · '))}</span>
            <span style="font-size:13px">${fasonOlayMetin(x.o)}</span></div>`).join('');
        return `<div class="kartlar"><div class="soluk" style="padding:0 4px">${fmt(l.length)} kayıt · en yeni üstte · silinen de burada kalır</div>
            <div class="liste-kutu" style="margin:0">${satirlar || '<div class="bos">Kayıt yok.</div>'}</div>${dahaDugme(l.length)}</div>`;
    }
    const dfTurCip = () => sekmeCip('dfTur', [['HEPSI', 'Tüm işlemler'], [FASON_ISLEM.GIDEN, 'Gönderimler'], [FASON_ISLEM.GELEN, 'Gelen / iade'], [FASON_ISLEM.KONTROL, 'Kontroller'],
        ...(fasonFiyatGorur() ? [[FASON_ISLEM.HESAP, 'Ödeme / kesinti']] : []), [FASON_ISLEM.FIRE, 'Fireler'], [FASON_ISLEM.DUZENLE, 'Düzeltmeler'], [FASON_ISLEM.SIL, 'Silmeler'], [FASON_ISLEM.FOY, 'Föy / iş']]);

    /* ── Fotoğraf: siparişe (yetkili) ve stok kartına (yetkili) ── */
    D.foto = { sid: null, dosyalar: [], kaydediliyor: false };
    function siparisFotoHtml(s) {
        const fotolar = siparisFotograflarFromRaw(s.siparis_fotograflar);
        const yetki = siparisFotoEkleYetkiliMi();
        const secilen = D.foto.sid === String(s.id) ? D.foto.dosyalar : [];
        return `<div class="liste-kutu" style="margin:12px 0 0;padding:10px 14px">
            <div style="font-weight:700;padding-bottom:6px">Fotoğraflar <span class="soluk" style="font-weight:400">${fotolar.length}</span></div>
            ${fotolar.length ? `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">${fotolar.map(f => `<a href="${esc(f.src)}" target="_blank" rel="noopener" style="display:flex;flex-direction:column;gap:3px;text-decoration:none;color:inherit">
                <img src="${esc(f.src)}" alt="" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;background:#F2F4F7"><span class="soluk" style="font-size:11px">${esc(f.aciklama || '')}</span></a>`).join('')}</div>` : '<div class="soluk">Fotoğraf yok.</div>'}
            ${yetki ? `<label class="cip" style="background:#E7EBF8;margin-top:10px;display:inline-flex">📷 Fotoğraf seç / çek<input type="file" accept="image/*" multiple class="ym-foto-sec" data-sid="${esc(s.id)}" style="display:none"></label>
                ${secilen.map((x, n) => `<div style="display:flex;gap:8px;align-items:flex-start;margin-top:8px"><img src="${esc(x.url)}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:10px;flex:none">
                    <textarea class="ym-foto-not" data-n="${n}" rows="2" placeholder="Ne olduğunu yazın (ör. etiket yeri)" style="flex:1;min-width:0;border:1px solid var(--cizgi);border-radius:10px;padding:8px;font:inherit">${esc(x.aciklama)}</textarea>
                    <button class="cip" data-is="foto-cikar" data-d="${n}">✕</button></div>`).join('')}
                ${secilen.length ? `<button class="ana-dugme" style="margin-top:10px" data-is="foto-kaydet" ${D.foto.kaydediliyor ? 'disabled' : ''}>${D.foto.kaydediliyor ? 'Yükleniyor…' : `Kaydet (${secilen.length} fotoğraf)`}</button>` : ''}` : ''}</div>`;
    }
    async function siparisFotoKaydet() {
        if (D.foto.kaydediliyor || !D.foto.dosyalar.length) return;
        D.foto.kaydediliyor = true; ciz();
        const ok = await siparisFotoEkleDosyalarla(D.foto.sid, D.foto.dosyalar.map(x => ({ dosya: x.dosya, aciklama: x.aciklama })));
        D.foto.kaydediliyor = false;
        if (ok) { D.foto.dosyalar.forEach(x => { try { URL.revokeObjectURL(x.url); } catch (e) {} }); D.foto.dosyalar = []; }
        ciz();
    }
    async function kartFotoKaydet(recId, dosya) {
        erpToast('Fotoğraf yükleniyor…', 'info', 2500);
        let kaynak = dosya;
        try { kaynak = (await siparisFotoDosyaSikistir(dosya)) || dosya; } catch (e) { kaynak = dosya; }
        const s = await kartFotografKaydet(recId, kaynak);
        if (!s.ok) erpToast('Fotoğraf eklenemedi: ' + (s.error || ''), 'error', 6000);
        else erpToast('Kart fotoğrafı kaydedildi.', 'success');
        stokGovdeTazele();
    }
    const kartFotoHtml = (rec) => {
        if (!rec) return '';
        const src = kartFotografSrc(rec);
        return `<div style="display:flex;gap:10px;align-items:center;padding-top:8px">${src ? `<a href="${esc(src)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="" loading="lazy" style="width:72px;height:72px;object-fit:cover;border-radius:12px"></a>` : '<span class="soluk">Fotoğraf yok</span>'}
            ${ykYetki('KART_FOTO_EKLE') && rec.id != null ? `<label class="cip" style="background:#E7EBF8">📷 ${src ? 'Değiştir' : 'Ekle'}<input type="file" accept="image/*" class="ym-kart-foto" data-id="${esc(rec.id)}" style="display:none"></label>` : ''}</div>`;
    };

    /* ── Ürün ağacı düzenleyici (yalnız yönetici) ── */
    function uaDuzenleHtml(sid, ki, ua) {
        if (!erpIsAdmin()) return '';
        const utg = uaEnsureUrunTeknikGenel(ua);
        const sira = (ua.asamalar || []).filter(id => UA_ASAMALAR.some(a => a.id === id));
        const giris = (alan, deger, ipucu, tip) => `<input class="ym-ua-alan" data-alan="${alan}" value="${esc(deger == null ? '' : deger)}" placeholder="${esc(ipucu)}" ${tip === 'sayi' ? 'inputmode="decimal"' : ''}
            style="flex:1;min-width:0;padding:10px 12px;border:1px solid var(--cizgi);border-radius:12px;font:inherit">`;
        return `<div style="margin-top:10px;padding:10px;border:1px dashed #C7CEF0;border-radius:14px;display:flex;flex-direction:column;gap:8px">
            <div style="font-weight:700;color:#4A5FC1">✎ Düzenle <span class="soluk" style="font-weight:400">· yönetici · her değişiklik hemen kaydedilir</span></div>
            <div class="yatay cipler" style="padding:0">${[['SIMTEKS_KONF', 'Simteks konf.'], ['FASON_KONF', 'Fason konf.'], ['DOGRUDAN_SEVK', 'Doğrudan sevk']].map(([k, a]) => cip('ua-yer', k, a, utg.uretim_yeri === k)).join('')}</div>
            ${utg.uretim_yeri === 'FASON_KONF' ? `<div style="display:flex;gap:6px">${giris('fason_firma', utg.fason_firma, 'Fason firma / atölye')}</div>` : ''}
            <div class="yatay cipler" style="padding:0;flex-wrap:wrap">${UA_ASAMALAR.map(a => cip('ua-asama', a.id, `${a.ikon} ${a.label}${a.zorunlu ? ' *' : ''}`, (ua.asamalar || []).includes(a.id))).join('')}</div>
            ${sira.length ? `<div>${sira.map((id, n) => { const a = UA_ASAMALAR.find(x => x.id === id); return `<div class="bilgi-satir"><span>${n + 1}. ${a.ikon} ${esc(a.label)}</span>
                <span style="display:flex;gap:4px">${n > 0 ? cip('ua-sira', n + '|-1', '↑', false) : ''}${n < sira.length - 1 ? cip('ua-sira', n + '|1', '↓', false) : ''}</span></div>`; }).join('')}</div>` : ''}
            <div style="display:flex;gap:6px">${giris('kumas_metre', uaSayi(ua.kumas_metre) || '', 'Metre / ürün', 'sayi')}${giris('kumas_tolerans', uaSayi(ua.kumas_tolerans) || '', 'Tolerans %', 'sayi')}</div>
            <textarea class="ym-ua-alan" data-alan="not" rows="2" placeholder="Özel not / üretim talimatı" style="border:1px solid var(--cizgi);border-radius:12px;padding:10px;font:inherit">${esc(ua.not || '')}</textarea>
            <button class="ana-dugme" data-is="ua-kaydet" data-d="${esc(sid + '|' + ki)}">Ürün ağacını kaydet</button></div>`;
    }
    function uaAksesuarDuzenleHtml(sip, ak) {
        if (!erpIsAdmin()) return '';
        return `<div class="liste-kutu" style="padding:10px 14px"><div style="font-weight:700;color:#4A5FC1;padding-bottom:6px">✎ Aksesuar planı (yönetici)</div>
            ${UA_AKSESUARLAR.map(a => `<div class="bilgi-satir"><span>${esc(a.label)} <span class="soluk">${esc(a.birim)}</span></span>
                <input class="ym-ua-ak" data-ak="${esc(a.id)}" data-sid="${esc(sip.id)}" inputmode="decimal" value="${esc(ak.genel[a.id] || '')}" placeholder="0" style="width:90px;padding:8px;border:1px solid var(--cizgi);border-radius:10px;text-align:right;font:inherit"></div>`).join('')}</div>`;
    }

    /* Ürün ağacı yazıcıları seçili sipariş / kalem üzerinde çalışır (uaSecimAyarla) — kapı yalnız yöneticiye ve bu ekranda izin verir */
    function uaAcikKalem() {
        const m = /^U\|(\d+)$/.exec(String(D.st.acik || ''));
        return m && D.st.sid ? { sid: D.st.sid, ki: parseInt(m[1], 10) } : null;
    }
    async function uaIslem(is, d) {
        if (!erpIsAdmin()) return;
        if (is === 'ua-kaydet') {
            const [sid, ki] = String(d).split('|');
            uaSecimAyarla(sid, parseInt(ki, 10));
            await uaKaydet();
            D.dk.uaOku = false; uaYukle();
            return;
        }
        const k = uaAcikKalem(); if (!k) return;
        uaSecimAyarla(k.sid, k.ki);
        if (is === 'ua-yer') await uaUrunTeknikGenelGuncelle('uretim_yeri', d);
        else if (is === 'ua-asama') await uaAsamaKucukTikla(d);
        else if (is === 'ua-sira') { const [n, yon] = String(d).split('|').map(Number); await uaAsamaSiraDegistir(n, yon); }
        stokGovdeTazele();
    }
    async function uaAlanYaz(alan, deger) {
        const k = uaAcikKalem(); if (!k || !erpIsAdmin()) return;
        uaSecimAyarla(k.sid, k.ki);
        if (alan === 'fason_firma') await uaUrunTeknikGenelGuncelle('fason_firma', deger, false);
        else await uaFieldGuncelle(alan, deger);
        stokGovdeTazele();
    }

    /* Henüz yapılmamış ekran: başlık + bilgi (eski mobile geçiş yok) */
    function hazirlaniyorCiz() {
        return `<div class="bant"><div class="bant-ust" style="gap:6px"><button class="geri" data-is="geri" aria-label="Geri">${svg(I.geri, 22, 2.2)}</button>
                <span class="bant-baslik">${esc(ekranAdi(D.ekran))}</span></div></div>
            <div class="kartlar"><div class="sip-kart" style="align-items:center;text-align:center;padding:28px 18px;gap:10px">
                <span class="simge" style="width:56px;height:56px;border-radius:18px;background:#E7EBF8;color:#4A5FC1">${gs(ekranSimge(D.ekran), 26)}</span>
                <span style="font-size:16px;font-weight:600">Bu ekran yeni görünümde hazırlanıyor</span>
                <span class="soluk" style="font-size:13px;line-height:1.5">Rakamları ana programla birebir aynı olacak; hazır olunca burada açılır.</span></div></div>`;
    }

    function altMenu() {
        const n = uyarilar().length;
        const d = (id, ikon, ad) => `<button class="alt-dugme ${D.tab === id ? 'secili' : ''}" data-is="tab" data-d="${id}"><span class="kap">${gs(ikon, 22)}</span><span>${ad}</span>${id === 'uyari' && n ? `<span class="rozet">${n}</span>` : ''}</button>`;
        return `<nav class="alt-menu">${d('ana', 'home', 'Ana sayfa')}${d('siparis', 'siparis', 'Siparişler')}${d('stok', 'depo', 'Stok')}${d('uyari', 'zil', 'Uyarılar')}${d('ekranlar', 'panel', 'Ekranlar')}</nav>`;
    }

    function profilPencere() {
        if (!D.pencere) return '';
        const u = erpCurrentUser || {};
        const kademe = typeof erpUstAdminMi === 'function' && erpUstAdminMi() ? 'Admin' : erpIsAdmin() ? 'Yönetici' : 'Kullanıcı';
        const sure = Object.entries(D.sure).map(([k, v]) => `${k} ${(v / 1000).toFixed(1)} sn`).join(' · ');
        return `<div class="perde" data-is="pencere-kapat"><div class="alt-pencere" data-is="pencere-ic">
            <span class="tutamak"></span>
            <div style="display:flex;align-items:center;gap:12px;padding:6px 0 10px"><span class="avatar">${esc(harf(u.display_name || u.username))}</span>
                <span class="satir-orta"><span style="font-weight:600;font-size:16px">${esc(u.display_name || u.username || '')}</span><span class="alt">${esc(u.username || '')} · ${kademe}</span></span></div>
            <button class="pencere-satir" data-is="yenile">${gs('yenile')}<span>Verileri yenile</span></button>
            <button class="pencere-satir" data-is="cikis" style="color:#B42318">${gs('cikis')}<span>Oturumu kapat</span></button>
            ${sure ? `<span class="soluk" style="padding-top:8px">Son yükleme: ${esc(sure)}</span>` : ''}
        </div></div>`;
    }

    /* ── Çizim ────────────────────────────────────────────────────────── */
    const _kaydirma = {};
    function ekranAnahtari() { return D.ekran ? 'ekran:' + D.ekran : D.tab === 'siparis' && D.detay ? 'detay:' + D.detay : D.tab; }
    function ciz() {
        const k = kok(); if (!k) return;
        const ic = k.querySelector('.icerik');
        const once = k.dataset.ekran;
        if (ic && once) _kaydirma[once] = ic.scrollTop;
        let govde;
        if (D.ekran) govde = STOK_EKRANLAR.includes(D.ekran) ? stokEkranCiz() : DOKUMA_EKRANLAR.includes(D.ekran) ? dokumaEkranCiz()
            : KONF_EKRANLAR.includes(D.ekran) ? konfEkranCiz() : PLAN_EKRANLAR.includes(D.ekran) ? planEkranCiz() : EK5_EKRANLAR.includes(D.ekran) ? ek5EkranCiz() : YON_EKRANLAR.includes(D.ekran) ? yonEkranCiz() : hazirlaniyorCiz();
        else if (D.tab === 'ana') govde = anaCiz();
        else if (D.tab === 'siparis') govde = D.detay ? detayCiz() : listeCiz();
        else if (D.tab === 'uyari') govde = uyariCiz();
        else if (D.tab === 'stok') govde = stokCiz();
        else govde = ekranlarCiz();
        const odakId = document.activeElement && ['ym-arama', 'ym-st-ara'].includes(document.activeElement.id) ? document.activeElement.id : null;
        const secim = odakId ? document.activeElement.selectionStart : null;
        k.innerHTML = `<div class="icerik"><div class="sarici">${govde}</div></div>${altMenu()}${profilPencere()}`;
        const an = ekranAnahtari();
        k.dataset.ekran = an;
        const yeniIc = k.querySelector('.icerik');
        if (yeniIc) yeniIc.scrollTop = _kaydirma[an] || 0;
        if (odakId) { const a = document.getElementById(odakId); if (a) { a.focus(); try { a.setSelectionRange(secim, secim); } catch (e) {} } }
        if (!erpCurrentUser) return;
        /* Nabız: ekran değişince yönetici listesinde hemen görünsün (17 erpNabizEkranDegisti — masaüstünde setAppMode çağırır) */
        const kod = ymEkranKodu();
        if (kod !== _nabizEkran) { _nabizEkran = kod; try { erpNabizEkranDegisti(); } catch (e) {} }
        if (an === 'ana' && document.getElementById('ym-aktif')) { try { erpAktifPanelBaslat(); } catch (e) {} }
    }
    /* Nabız / çevrimiçi kanalında görünen ekran kodu (17 erpNabizEkran buradan okur): açık ekranın ana programdaki kodu;
       sekmelerde karşılığı (Ana sayfa = DASHBOARD, Siparişler = SIPARIS_LISTE / SIPARIS_KAPANAN) ya da mobilin kendi sekmesi */
    let _nabizEkran = null;
    function ymEkranKodu() {
        if (D.ekran) return D.ekran;
        if (D.tab === 'ana') return 'DASHBOARD';
        if (D.tab === 'siparis') return !D.detay && D.suzgec === 'kapanan' ? 'SIPARIS_KAPANAN' : 'SIPARIS_LISTE';
        return { stok: 'MOBIL_STOK', uyari: 'MOBIL_UYARI', ekranlar: 'MOBIL_EKRANLAR' }[D.tab] || 'DASHBOARD';
    }
    window.erpEkranKoduAl = ymEkranKodu;
    /* Arama yazarken yalnız kartlar değişir (kutu yeniden çizilmez, klavye kapanmaz) */
    function kartlariTazele() {
        const l = listeSiparisleri();
        const kap = document.getElementById('ym-kartlar'); if (kap) kap.innerHTML = kartlarHtml(l);
        const say = document.getElementById('ym-sayi'); if (say) say.textContent = `${l.length} sipariş`;
        document.querySelectorAll('.cip[data-is="suzgec"]').forEach(c => c.classList.toggle('secili', D.arama ? c.dataset.d === aramaKapsami() : c.dataset.d === D.suzgec));
    }

    function tikla(e) {
        const el = e.target.closest('[data-is]');
        if (!el || el.disabled) return;
        const is = el.dataset.is, d = el.dataset.d;
        if (is === 'pencere-ic') return;
        switch (is) {
            case 'tab': D.tab = d; D.detay = null; D.ekran = null; D.pencere = false; if (d === 'siparis') D.limit = LISTE_ADIM; break;
            case 'liste': D.tab = 'siparis'; D.detay = null; D.ekran = null; D.suzgec = d; D.arama = ''; D.limit = LISTE_ADIM; break;
            case 'suzgec': D.suzgec = d; D.arama = ''; D.limit = LISTE_ADIM; break;
            case 'siparis': D.tab = 'siparis'; D.detay = d; D.ekran = null; D.dsekme = 'kalem'; break;
            case 'geri': if (D.ekran) D.ekran = null; else D.detay = null; break;
            case 'dsekme': D.dsekme = d; break;
            case 'daha': D.limit += LISTE_ADIM; break;
            case 'aramaya-git':
                D.tab = 'siparis'; D.detay = null; D.arama = ''; ciz();
                setTimeout(() => { const a = document.getElementById('ym-arama'); if (a) a.focus(); }, 30);
                return;
            case 'uyari-ac': {
                const i = parseInt(d, 10);
                if (D.tab !== 'uyari') { D.tab = 'uyari'; D.acikUyari = i; }
                else D.acikUyari = D.acikUyari === i ? null : i;
                break;
            }
            case 'grup': D.acikGrup = D.acikGrup === d ? null : d; break;
            case 'ekran-ac':
                D.detay = null; D.ekran = null;
                if (d === 'DASHBOARD') D.tab = 'ana';
                else if (d === 'SIPARIS_LISTE' || d === 'SIPARIS_KAPANAN') { D.tab = 'siparis'; D.arama = ''; D.suzgec = d === 'SIPARIS_KAPANAN' ? 'kapanan' : 'acik'; }
                else if (/_KART_GIRIS$/.test(d)) { D.ekran = 'KART_LISTE'; D.st = stBos(); D.st.kSekme = d.replace('_KART_GIRIS', ''); }   /* kart girişi formu mobilde yok: o grubun kart listesi */
                else { D.ekran = d; D.st = stBos(); if (d === 'STOK_SAYIM') D.st.syTip = _sayimTip; }
                break;
            case 'st-suz': D.st.filtre = d; D.st.limit = LISTE_ADIM; D.st.acik = null; break;
            case 'st-tip': D.st.tip = d; D.st.limit = LISTE_ADIM; D.st.acik = null; break;
            case 'st-grup': D.st.grup = d; D.st.limit = LISTE_ADIM; break;
            case 'st-durum': D.st.durum = d; D.st.limit = LISTE_ADIM; break;
            case 'st-ac': D.st.acik = D.st.acik === d ? null : d; break;
            case 'fis-bugun':   /* ana ekran "Bugün sevk edilen" → bugünün sevkiyat fişleri (23.10.2026) */
                D.detay = null; D.ekran = 'MUHASEBE_FIS'; D.st = stBos(); D.st.gun = 'BUGUN'; break;
            case 'sv-fis': {   /* Sevkiyat satırı → o satırın fişi açık */
                const i = d.indexOf('|');
                D.ekran = 'MUHASEBE_FIS'; D.st = stBos(); D.st.ara = d.slice(i + 1); D.st.acik = 'F|' + d.slice(0, i); break;
            }
            case 'st-daha': D.st.limit += LISTE_ADIM; break;
            case 'st-hareket': {   /* kalemin hareketleri: depo defteri o kanal + stok koduyla aranmış açılır */
                const i = d.indexOf('|');
                D.ekran = 'DEPO_HAREKET_LISTE'; D.st = stBos(); D.st.grup = d.slice(0, i); D.st.ara = d.slice(i + 1);
                break;
            }
            case 'dk-set': {   /* "alan=değer" → ekran süzgeci / sekmesi */
                const i = d.indexOf('=');
                const alan = d.slice(0, i);
                D.st[alan] = d.slice(i + 1); D.st.limit = LISTE_ADIM; D.st.acik = null;
                if (alan === 'kpYer' || alan === 'kpPlanli') D.dk.kpOku = false;
                if (alan === 'syTip' && _sayimTip !== D.st.syTip) stokSayimTipDegistir(D.st.syTip);   /* süren sayım duraklar, o tipin oturumu yüklenir (ana programdaki gibi) */   /* planlama listesi süzgece göre yeniden kurulur */
                break;
            }
            case 'dk-sip': D.st.sid = d; D.st.ara = ''; D.st.acik = null; break;
            case 'rp-ayar': rpAyar(d); break;
            case 'gi-gun': {   /* gün kaydır / bugün */
                const yon = parseInt(d, 10) || 0;
                if (!yon) D.st.giGun = gunlukBugun();
                else { const { bas } = gunlukAralik(D.dk.giGun || gunlukBugun()); bas.setDate(bas.getDate() + yon);
                    const g = `${bas.getFullYear()}-${String(bas.getMonth() + 1).padStart(2, '0')}-${String(bas.getDate()).padStart(2, '0')}`;
                    D.st.giGun = g > gunlukBugun() ? gunlukBugun() : g; }
                D.st.giKisi = ''; D.st.giTur = ''; D.st.limit = LISTE_ADIM; D.dk.gi = false; giYukle('gun');
                break;
            }
            case 'gi-suz': { const i = d.indexOf('|'), alan = d.slice(0, i), v = d.slice(i + 1); D.st[alan] = D.st[alan] === v ? '' : v; D.st.limit = LISTE_ADIM; break; }
            case 'gi-ac': giAc(parseInt(d, 10)); break;
            case 'aktif-kisi':   /* masaüstündeki "Günlük İşlemler ›" gibi (18 gunlukKisiyeAc): bugün, o kişi */
                if (!erpIsAdmin()) return;
                D.detay = null; D.ekran = 'GUNLUK_ISLEMLER'; D.st = stBos(); D.st.giGun = gunlukBugun(); D.st.giKisi = d;
                if (_gunluk.gun !== D.st.giGun) { D.dk.gi = false; giYukle('gun'); }
                break;
            case 'sy-filtre': _sayimMobilFiltre = d; D.st.limit = LISTE_ADIM; break;
            case 'sy-durum': if (d === 'BASLAT') stokSayimOturumBaslat(); else stokSayimOturumDuraklat(); break;
            case 'sy-tamam': stokSayimKaydet().finally(ciz); return;
            case 'sy-kaydet': case 'sy-ekle': case 'sy-stok': sySatir(is, d, el).then(ok => { if (ok) stokGovdeTazele(); }); return;
            case 'foto-cikar': { const x = D.foto.dosyalar.splice(parseInt(d, 10), 1)[0]; if (x) { try { URL.revokeObjectURL(x.url); } catch (e) {} } break; }
            case 'foto-kaydet': siparisFotoKaydet(); return;
            case 'ua-yer': case 'ua-asama': case 'ua-sira': case 'ua-kaydet': uaIslem(is, d); return;
            case 'kart-pdf': {   /* ana programın kart PDF'i (yalnız okur, dosya indirir) */
                const i = d.indexOf('|'), grup = d.slice(0, i), id = d.slice(i + 1);
                const kayit = grup === 'IPLIK' ? (dataCache.iplik_stok || []).find(r => String(r.id) === id) : (dataCache.kumas_kutuphanesi || []).find(r => String(r.id) === id);
                if (kayit) stokKartPdfIndir(kayit, grup, el);
                return;
            }
            case 'dk-kaydir': {   /* dönemi kaydır (ana programdaki ◀ ▶ ile aynı) */
                const yon = parseInt(d, 10) || 0;
                const t = D.st.tarih ? new Date(D.st.tarih + 'T00:00:00') : new Date();
                if (D.st.donem === 'AY') t.setMonth(t.getMonth() + yon, 1);
                else t.setDate(t.getDate() + yon * (D.st.donem === 'HAFTA' ? 7 : 1));
                D.st.tarih = dtRaporGunIso(t); D.st.limit = LISTE_ADIM;
                break;
            }
            case 'st-yenile':
                if (D.ekran === 'DOKUMA_TAKIP') { if (D.st.gorunum === 'HAREKET') { D.dk.hareket = false; dkHareketYukle(true); } else { D.dk.form = null; ciz(); } }
                else if (D.ekran === 'TEZGAH_PLANLAMA') { D.dk.tp = false; dkTpYukle(true); }
                else if (D.ekran === 'DOKUMA_FASON_TAKIP') { D.dk.fs = false; dkFsYukle(true); }
                else if (D.ekran === 'KONFEKSIYON_PLANLAMA') { D.dk.kpOku = false; kpYukle(); }
                else if (D.ekran === 'FASON_TAKIP') { D.dk.kfs = false; kfsYukle(true); }
                else if (D.ekran === 'PLANLAMA') { D.dk.plOku = false; plYukle(true); }
                else if (D.ekran === 'SEVKIYAT') fisYukle(true);
                else if (D.ekran === 'YAPILACAKLAR') { D.dk.yd = false; ydYukle(true); }
                else if (D.ekran === 'RAPORLAR') { D.dk.rp = false; rpYukle(true); }
                else if (D.ekran === 'BOYAHANE_URETIM') { D.dk.tb = false; tbYukle(true); }
                else if (D.ekran === 'NUMUNE') { D.dk.nm = false; D.dk.nmTam = {}; nmYukle(true); }
                else if (D.ekran === 'URUN_AGACI' || D.ekran === 'TEKNIK_FOY') { D.dk.uaOku = false; uaYukle(); }
                else if (D.ekran === 'GUNLUK_ISLEMLER') { D.dk.gi = false; giYukle(true); }
                else if (D.ekran === 'KULLANICI_YONETIMI') { D.dk.kyOku = false; kyYukle(); }
                else if (D.ekran === 'STOK_SAYIM') { D.dk.sy = false; _sayimArsivCekildi = false; syYukle(); }
                else if (KONF_EKRANLAR.includes(D.ekran)) { D.dk.kf = false; kfYukle(true); }
                else if (D.ekran === 'DOKUMA_DEPO') ddYukle(true);
                else if (D.ekran === 'MUHASEBE_FIS') fisYukle(true);
                else veriYukle(true);
                return;
            case 'profil': D.pencere = true; break;
            case 'pencere-kapat': D.pencere = false; break;
            case 'yenile': D.pencere = false; veriYukle(true); break;
            case 'cikis': D.pencere = false; ciz(); erpLogout(); return;
            default: return;
        }
        ciz();
    }

    /* ── Veri: ana programın yükleyicileri (yalnız okur) ──────────────── */
    let _yukleniyor = null;
    async function adim(ad, metin, fn) {
        D.yukleniyor = metin; ciz();
        const t0 = performance.now();
        try { await fn(); } finally { D.sure[ad] = Math.round(performance.now() - t0); }
    }
    function veriYukle(zorla) {
        if (_yukleniyor) return _yukleniyor;
        D.hata = '';
        _yukleniyor = (async () => {
            try {
                /* ana programın açılışındaki tablolar (02 ERP_SYNC_TABLES) — stok ekranları aynı veriden hesaplar */
                await adim('sipariş', 'Siparişler ve stok alınıyor…', () => syncAllData(false, { silent: true, tables: ['siparisler', 'kumas_stok', 'iplik_stok', 'kumas_kutuphanesi'] }));
                if (D.dd.satirlar) D.dd.satirlar = null;   /* Dokuma Depo / fişler açılınca tazeden okunur */
                if (D.fis.liste) D.fis.liste = null;
                D.hazir.sip = siparisler().length > 0; D.surum++;
                await adim('sayılar', 'Kalem sayıları hesaplanıyor…', () => raporVeriYukle(!!zorla));
                D.hazir.sayi = true; D.surum++;
                await adim('uyarı', 'Uyarılar hesaplanıyor…', async () => { await erpUyariVeriTazele(!!zorla); erpUyarilariHesapla(); });
                D.hazir.uyari = true;
            } catch (e) {
                console.warn('yeni mobil veri', e);
                D.hata = 'Veri alınamadı: ' + (e && e.message ? e.message : e) + ' — yenile ile tekrar deneyin.';
            } finally {
                D.yukleniyor = ''; _yukleniyor = null; ciz();
            }
        })();
        return _yukleniyor;
    }

    /* ── Canlı tazeleme (çekirdeğin motoru: 04 Realtime + yoklama, 32 anlık haber) ─────────────────────────────
       Motor değişen satırları önbelleğe işler, sonra 00 erpRefreshCurrentScreen'i çağırır → yeni mobilde buraya gelir.
       Masaüstünün dallarıyla aynı kural: yazarken bekler (00 erpIsUserEditingUi, arama kutusu bekletmez), Dokuma Depo /
       Tezgah Planlama yalnız ilgili değişiklikte okur (04 erpLiveEkranIlgiliMi), sayım oturumu sürerken sayım çizilmez.
       Kendi önbelleği olan ekranın okuyucusu sessizce yeniden çalışır (eski görüntü yerinde kalır, yükleniyor yazmaz). */
    const YM_CANLI_OKU = {
        PLANLAMA: () => plYukle(false), SEVKIYAT: () => YM_CANLI_OKU.MUHASEBE_FIS(), YAPILACAKLAR: () => ydYukle(false),
        RAPORLAR: () => rpYukle(false), KONFEKSIYON_PLANLAMA: () => kpYukle(), NUMUNE: () => nmYukle(false),
        DOKUMA_DEPO: () => erpLiveEkranIlgiliMi('DOKUMA_DEPO') ? ddYukle(true) : 'atla',
        TEZGAH_PLANLAMA: () => erpLiveEkranIlgiliMi('TEZGAH_PLANLAMA') ? dkTpYukle(true) : 'atla',
        MUHASEBE_FIS: () => {
            if (D.fis.yukleniyor || !D.fis.liste) return;
            D.fis.yukleniyor = true;
            return muhasebeFisleriYukle({ force: false }).then(l => { D.fis.liste = l; }).catch(() => {}).finally(() => { D.fis.yukleniyor = false; ciz(); });
        },
        DOKUMA_TAKIP: () => {
            if (D.st.gorunum === 'HAREKET') return D.dk.hareket ? dkYukle('hareket', () => dtRaporVeriYukle()) : null;
            const f = D.dk.form;
            return f && f.sid ? dkYukle('formOku', async () => { const m = await dtFormVerisi(f.sid); D.dk.form = { sid: f.sid, m }; }) : null;
        },
        STOK_SAYIM: () => (typeof sayimOturumAktifMi === 'function' && sayimOturumAktifMi() ? 'atla' : null)
    };
    let _canliSay = 0;
    function ymCanliTazele(opts = {}) {
        if (!erpCurrentUser || !kok()) return false;
        if (!opts.force && erpIsUserEditingUi()) { erpScheduleDeferredUiRefresh(); return false; }
        const oku = D.ekran ? YM_CANLI_OKU[D.ekran] : null;
        let r = null;
        try { r = oku ? oku() : null; } catch (e) { console.warn('canlı tazeleme', e); }
        if (r === 'atla') return false;
        _canliSay++;
        D.surum++;
        if (!D.ekran && (D.tab === 'ana' || D.tab === 'siparis')) {   /* ana sayfadaki "bugün olanlar" + kartlardaki sayılar (60 sn tazelik) */
            raporVeriYukle(false).then(() => { D.surum++; ciz(); }).catch(() => {});
        }
        if (!D.ekran && (D.tab === 'ana' || D.tab === 'uyari')) { try { erpUyarilariHesapla(); } catch (e) {} }
        ciz();
        return true;
    }
    window.erpEkranTazeleKanca = ymCanliTazele;
    window.__ymCanli = () => _canliSay;   /* sınama: kaç kez çizildi */

    /* ── Giriş ────────────────────────────────────────────────────────── */
    function girisCiz(hata) {
        kok().innerHTML = `<div class="icerik"><form class="giris" id="ym-giris">
            <div style="display:flex;flex-direction:column;align-items:center;gap:10px"><span class="giris-logo">S</span>
                <span style="font-size:22px;font-weight:700">Simteks ERP</span><span class="soluk">Mobil · yeni görünüm</span></div>
            <div class="giris-kutu">
                ${hata ? `<div class="hata">${esc(hata)}</div>` : ''}
                <label>Kullanıcı adı<input id="ym-kullanici" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false"></label>
                <label>Şifre<input id="ym-sifre" type="password" autocomplete="current-password"></label>
                <button class="ana-dugme" id="ym-giris-dugme" type="submit">Giriş yap</button>
            </div>
        </form></div>`;
        document.getElementById('ym-giris').addEventListener('submit', async (e) => {
            e.preventDefault();
            const ad = (document.getElementById('ym-kullanici').value || '').trim().toLowerCase();
            const sifre = document.getElementById('ym-sifre').value || '';
            if (!ad || !sifre) { girisCiz('Kullanıcı adı ve şifre zorunlu.'); return; }
            const b = document.getElementById('ym-giris-dugme'); b.disabled = true; b.textContent = 'Giriş yapılıyor…';
            try {
                const r = await erpGirisDogrula(ad, sifre);
                if (!r.ok) { girisCiz(r.err); document.getElementById('ym-kullanici').value = ad; return; }
                basla();
            } catch (err) {
                girisCiz('Sunucuya ulaşılamadı: ' + (err && err.message ? err.message : err));
            }
        });
    }

    function basla() {
        try { erpYetkiSenkBaslat(); } catch (e) { console.warn('yetki eşitleme', e); }
        /* Önbellek (eski mobil / önceki açılış) varsa ekran hemen dolar, sonra taze okunur */
        try { if (erpDataCacheRestore()) { D.hazir.sip = siparisler().length > 0; D.surum++; } } catch (e) {}
        kok().addEventListener('click', tikla);
        let _stAraZaman = null;
        kok().addEventListener('change', (e) => {
            const t = e.target;
            if (t.classList.contains('ym-foto-sec')) {   /* siparişe fotoğraf: seçilenler önizlemeyle listeye, açıklama yazılınca Kaydet */
                if (D.foto.sid !== t.dataset.sid) { D.foto.dosyalar = []; D.foto.sid = t.dataset.sid; }
                [...(t.files || [])].filter(f => /^image\//.test(f.type || '') || /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(f.name || ''))
                    .forEach(f => D.foto.dosyalar.push({ dosya: f, url: URL.createObjectURL(f), aciklama: '' }));
                t.value = ''; ciz(); return;
            }
            if (t.classList.contains('ym-kart-foto')) { const f = t.files && t.files[0]; const id = t.dataset.id; t.value = ''; if (f && id) kartFotoKaydet(id, f); return; }
            if (t.classList.contains('ym-ua-alan')) { uaAlanYaz(t.dataset.alan, t.value); return; }
            if (t.classList.contains('ym-ua-ak')) { uaSecimAyarla(t.dataset.sid, null); uaAksesuarGenelGuncelle(t.dataset.ak, t.value).then(() => stokGovdeTazele()); return; }
        });
        kok().addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('sy-inp')) {
                e.preventDefault();
                const kod = e.target.dataset.kod;
                sySatir(_sayimMobilFiltre === 'SAYILAN' ? 'sy-ekle' : 'sy-kaydet', kod).then(ok => { if (ok) stokGovdeTazele(); });
            }
        });
        kok().addEventListener('input', (e) => {
            if (e.target.classList && e.target.classList.contains('ym-foto-not')) { const x = D.foto.dosyalar[parseInt(e.target.dataset.n, 10)]; if (x) x.aciklama = e.target.value; return; }
            if (e.target.id === 'ym-st-ara') {   /* stok ekranlarında arama: yalnız gövde, kısa bekleyişle (büyük listeler) */
                D.st.ara = e.target.value; D.st.limit = LISTE_ADIM; D.st.acik = null;
                clearTimeout(_stAraZaman); _stAraZaman = setTimeout(stokGovdeTazele, 180);
                return;
            }
            if (e.target.id !== 'ym-arama') return;
            D.arama = e.target.value; D.limit = LISTE_ADIM; kartlariTazele();
        });
        ciz();
        /* Masaüstü açılışı gibi (03 boot): damga veri okunmadan ÖNCE (okuma sırasında değişen kaçmasın), sonra canlı senkron */
        erpLiveDamgaTabani().catch(() => {})
            .then(() => veriYukle(false))
            .then(() => { try { erpLiveSyncStart(); } catch (e) { console.warn('canlı senkron', e); } });
    }

    /* ── YAZMA KAPISI (22.10.2026; eski mobildeki kapının aynı kuralları — assets/mobil/mobil-app.js mobilSaltOkunurKapisiKur) ──
       Mobil SALT OKUNUR. Engel ekranda değil burada: her ekran, düğme ve arka plan işi bu bağlantıdan geçer. İzinli olanlar:
       • stok sayımı — Stok sayım ekranındayken sayımın kendi fark hareketi ([SAYIM] notu, GİRİŞ/ÇIKIŞ, tablonun sayım kaynağı),
         sayım raporu (siparis_akis STOK_SAYIM_RAPOR) ve raporun yeni yazma kapısı erp_sayim_yaz
       • siparişe fotoğraf — SIPARIS_FOTO_EKLE yetkisi + çekirdekteki yazıcı o an çalışıyor + yalnız fotoğraf / geçmiş alanları
       • stok kartı fotoğrafı — KART_FOTO_EKLE yetkisi + yazıcı çalışıyor + yalnız fotoğraf / geçmiş alanları
       • ürün ağacı — yönetici + Ürün ağacı / Teknik föy ekranı: KD_URUN_AGACI kabı, siparişin üretim yeri, değişiklik izi (kaynak URUN_AGACI)
       • okuma ve oturum RPC'leri (fiyatlar da: sunucu yalnız yetkiliye verir), yapı geçişi izleme bildirimleri
       Silme, sipariş / kart bilgisi, depo, üretim girişi hiçbir yoldan geçmez. */
    const YK_OKUMA_RPC = /^(erp_login|erp_logout|erp_session_[a-z_]+|erp_admin_users_list|erp_oturum_gunluk_oku|erp_fiyat_(durum|oku|gecmis|yetkililer)|erp_fason_fiyat_(durum|oku|gecmis|yetkililer)|erp_fason_hesap_oku)$/;
    const YK_IZLEME_RPC = /^erp_yapi_(cihaz_bildir|fark_yaz)$/;
    const YK_SAYIM_KAYNAK = { iplik_stok: ['DEPO_HAREKET_IPLIK'], kumas_stok: ['DEPO_HAREKET_MAMUL_DEPO', 'DEPO_HAREKET_KUMAS'] };
    const YK_FOTO_ALAN = ['siparis_fotograflar', 'islem_gecmisi', 'updated_by', 'updated_at'];
    const YK_KART_FOTO_ALAN = ['fotograf', 'fotograf_url', 'islem_gecmisi', 'updated_by', 'updated_at'];
    const ykYetki = (kod) => typeof erpUserCan === 'function' && erpUserCan(kod);
    const ykFotoAcik = () => window.__erpSiparisFotoYazma === true && ykYetki('SIPARIS_FOTO_EKLE');
    const ykKartFotoAcik = () => window.__erpKartFotoYazma === true && ykYetki('KART_FOTO_EKLE');
    const ykUaAcik = () => (D.ekran === 'URUN_AGACI' || D.ekran === 'TEKNIK_FOY') && typeof erpIsAdmin === 'function' && erpIsAdmin();
    const ykAlanlar = (p) => (p && typeof p === 'object' && !Array.isArray(p)) ? Object.keys(p) : null;
    function ykIzinliMi(tablo, yontem, p) {
        const satirlar = Array.isArray(p) ? p : [p];
        const nesne = satirlar.length > 0 && satirlar.every(r => r && typeof r === 'object');
        if (D.ekran === 'STOK_SAYIM' && (yontem === 'insert' || yontem === 'upsert') && nesne) {
            if (tablo === 'siparis_akis' && satirlar.every(r => r.islem === 'STOK_SAYIM_RAPOR')) return true;
            if (YK_SAYIM_KAYNAK[tablo] && satirlar.every(r => String(r.notlar || '').startsWith('[SAYIM]') && (r.islem_turu === 'GİRİŞ' || r.islem_turu === 'ÇIKIŞ')
                && YK_SAYIM_KAYNAK[tablo].includes(r.kaynak_birim))) return true;
        }
        const al = ykAlanlar(p);
        if (tablo === 'siparisler' && yontem === 'update' && al && ykFotoAcik() && al.includes('siparis_fotograflar') && al.every(a => YK_FOTO_ALAN.includes(a))) return true;
        if (tablo === 'kumas_kutuphanesi' && yontem === 'update' && al && ykKartFotoAcik() && al.includes('fotograf_url') && al.every(a => YK_KART_FOTO_ALAN.includes(a))) return true;
        if (ykUaAcik() && nesne) {
            if (tablo === 'siparis_akis' && yontem === 'update' && al && p.kalem_ad === 'KD_URUN_AGACI' && al.every(a => ['notlar', 'kalem_ad', 'miktar'].includes(a))) return true;
            if (tablo === 'siparis_akis' && yontem === 'insert' && satirlar.every(r => r.islem === 'KD_URUN_AGACI' && r.kalem_ad === 'KD_URUN_AGACI')) return true;
            if (tablo === 'siparisler' && yontem === 'update' && al && al.includes('uretim_yeri') && al.every(a => ['uretim_yeri', 'updated_by', 'updated_at'].includes(a))) return true;
            if (tablo === 'depo_hareket_iz' && yontem === 'insert' && satirlar.every(r => r.kaynak === 'URUN_AGACI')) return true;
        }
        return false;
    }
    let _ykUyariAt = 0;
    function ykEngel(neden) {
        console.info('[yeni mobil salt okunur] engellendi:', neden);
        if (Date.now() - _ykUyariAt > 6000) { _ykUyariAt = Date.now(); try { erpToast('Mobil salt okunurdur — bu işlemi ana programdan yapın.', 'error', 4500); } catch (e) {} }
        const sonuc = { data: null, error: { message: 'Mobil salt okunurdur — bu işlemi ana programdan yapın.', code: 'MOBIL_SALT_OKUNUR' } };
        const zincir = new Proxy(function () {}, { get: (_, ad) => (ad === 'then' ? (ok, hata) => Promise.resolve(sonuc).then(ok, hata) : () => zincir), apply: () => zincir });
        return zincir;
    }
    function ykKapiKur(client) {
        if (!client || client.__ymKapi) return;
        client.__ymKapi = true;
        const asilFrom = client.from.bind(client);
        client.from = (tablo) => {
            const q = asilFrom(tablo);
            for (const yontem of ['insert', 'upsert', 'update', 'delete']) {
                const asil = q[yontem] && q[yontem].bind(q);
                if (!asil) continue;
                q[yontem] = (p, ...rest) => (yontem !== 'delete' && ykIzinliMi(tablo, yontem, p) ? asil(p, ...rest) : ykEngel(tablo + '.' + yontem));
            }
            return q;
        };
        const asilRpc = client.rpc.bind(client);
        client.rpc = (ad, ...rest) => (YK_OKUMA_RPC.test(String(ad || '')) || YK_IZLEME_RPC.test(String(ad || ''))
            || (String(ad) === 'erp_sayim_yaz' && D.ekran === 'STOK_SAYIM') ? asilRpc(ad, ...rest) : ykEngel('rpc ' + ad));
        if (client.storage && client.storage.from) {
            const asilDepo = client.storage.from.bind(client.storage);
            client.storage.from = (kova) => {
                const s = asilDepo(kova);
                for (const yontem of ['upload', 'update', 'remove', 'move', 'copy']) {
                    if (!s[yontem]) continue;
                    const asil = s[yontem].bind(s);
                    /* yalnız YENİ dosya (upload), yalnız fotoğraf yazıcısı çalışırken; silme / üzerine yazma hiç yok */
                    s[yontem] = (...a) => ((yontem === 'upload' && kova === 'siparis-fotograflar' && ykFotoAcik())
                        || (yontem === 'upload' && kova === 'kumas-fotograflar' && ykKartFotoAcik()) ? asil(...a) : ykEngel('depo ' + kova + '.' + yontem));
                }
                return s;
            };
        }
    }

    /* ── Açılış: çekirdeği eski mobille aynı sırayla yükle ────────────── */
    function betikYukle(dosya) {
        return new Promise((ok, red) => {
            const s = document.createElement('script');
            s.src = (GELISTIRME ? '../assets/' : '') + dosya + '?v=' + (window.__YM_SURUM || '');
            s.onload = ok; s.onerror = () => red(new Error(dosya + ' yüklenemedi'));
            document.body.appendChild(s);
        });
    }
    async function acilis() {
        window.ERP_MOBIL_LITE = true; window.ERP_MOBIL_NO_CHARTS = true; window.ERP_MOBIL_NO_EXCEL = true;
        try {
            for (const d of ['erp_auth_tablo_fix.embed.js', 'kumas-ceki.js', 'muhasebe-fis.js', 'stok-kart-desktop.js', 'mamul-depo-toplu.js', 'stok-sayim.js', 'erp-core.js']) {
                await betikYukle(d);
            }
            /* Çekirdek masaüstünün açılışını window.onload'a bağlar (06: oturum + eski ekran + senkron) — burada çalışmasın */
            window.onload = null;
        } catch (e) {
            kok().innerHTML = `<div class="giris"><div class="hata">Program yüklenemedi: ${String(e.message || e)}</div><a class="ana-dugme" style="line-height:50px" href="">Tekrar dene</a></div>`;
            return;
        }
        if (typeof erpIsSupabaseReady === 'function' && !erpIsSupabaseReady()) {
            kok().innerHTML = '<div class="giris"><div class="hata">Sunucu bağlantısı kurulamadı (erp-config.js).</div></div>';
            return;
        }
        ykKapiKur(sb);   /* girişten ÖNCE: bundan sonraki her yazma kapıdan geçer */
        if (erpOturumOnbellektenKur()) basla();
        else girisCiz('');
    }
    window.__ym = D;   /* sınama için (yalnız okunur) */
    window.__ymKapi = { izinliMi: ykIzinliMi, kur: ykKapiKur };   /* sınama: kapı kuralları ağa çıkmadan denenir */
    acilis();
})();
