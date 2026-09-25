/* 3. ADIM: ana programla birebir aynı 1 tanım bu dosyadan silindi; mobil onları assets/erp-core.js üzerinden
   (ana programın kendi kodu) çalıştırır. Yeniden: node scripts/mobil-cekirdek-temizle.js */
/* 3. ADIM: ana programla birebir aynı 13 tanım bu dosyadan silindi; mobil onları assets/erp-core.js üzerinden
   (ana programın kendi kodu) çalıştırır. Yeniden: node scripts/mobil-cekirdek-temizle.js */
/* 3. ADIM: ana programla birebir aynı 29 tanım bu dosyadan silindi; mobil onları assets/erp-core.js üzerinden
   (ana programın kendi kodu) çalıştırır. Yeniden: node scripts/mobil-cekirdek-temizle.js */
/* 3. ADIM: ana programla birebir aynı 58 tanım bu dosyadan silindi; mobil onları assets/erp-core.js üzerinden
   (ana programın kendi kodu) çalıştırır. Yeniden: node scripts/mobil-cekirdek-temizle.js */
/* 3. ADIM: ana programla birebir aynı 154 tanım bu dosyadan silindi; mobil onları assets/erp-core.js üzerinden
   (ana programın kendi kodu) çalıştırır. Yeniden: node scripts/mobil-cekirdek-temizle.js */
/* 3. ADIM: ana programla birebir aynı 5 tanım bu dosyadan silindi; mobil onları assets/erp-core.js üzerinden
   (ana programın kendi kodu) çalıştırır. Yeniden: node scripts/mobil-cekirdek-temizle.js */
/* 3. ADIM: ana programla birebir aynı 23 tanım bu dosyadan silindi; mobil onları assets/erp-core.js üzerinden
   (ana programın kendi kodu) çalıştırır. Yeniden: node scripts/mobil-cekirdek-temizle.js */
/* 3. ADIM: ana programla birebir aynı 966 tanım bu dosyadan silindi; mobil onları assets/erp-core.js üzerinden
   (ana programın kendi kodu) çalıştırır. Yeniden: node scripts/mobil-cekirdek-temizle.js */
/* ==========================================================================
 * Simteks Mobil ERP — tek JS dosyası
 * İçerik: lite bayrak/stub + zoom kilidi + uygulama + mobil overrides
 * Masaüstü (stok.html) bu dosyayı kullanmaz.
 * ========================================================================== */

/* --- mobil lite (bayraklar + Chart/Excel stub) --- */
/**
 * Simteks Mobil ERP — hafif katman
 * Chart / Excel kütüphaneleri yüklenmez; stub'lar hata engeller.
 */
(function (w) {
    'use strict';
    w.ERP_MOBIL_LITE = true;
    w.ERP_MOBIL_NO_LIVE = false; // Realtime canlı senkron açık (masaüstü ile aynı)
    w.ERP_MOBIL_NO_DASHBOARD = true; // Mobilde anasayfa yok; açılış siparişler
    w.ERP_MOBIL_NO_CHARTS = true;
    w.ERP_MOBIL_NO_EXCEL = true;
    w.ERP_MOBIL_BOOT_MODE = 'SIPARIS_LISTE';
    try {
        if (document.body) document.body.classList.add('erp-mobil-lite');
        else document.addEventListener('DOMContentLoaded', () => document.body.classList.add('erp-mobil-lite'));
    } catch (e) {}

    // Chart.js stub
    if (typeof w.Chart === 'undefined') {
        w.Chart = function ChartStub() { return { destroy() {}, update() {}, resize() {} }; };
        w.Chart.register = function () {};
        w.Chart.defaults = {};
    }

    // SheetJS stub
    if (typeof w.XLSX === 'undefined') {
        w.XLSX = {
            read() { throw new Error('Mobilde Excel kapalı'); },
            utils: {
                sheet_to_json() { return []; },
                book_new() { return {}; },
                book_append_sheet() {},
                json_to_sheet() { return {}; },
                aoa_to_sheet() { return {}; }
            },
            write() { return new ArrayBuffer(0); },
            writeFile() {}
        };
    }

    // ExcelJS stub
    if (typeof w.ExcelJS === 'undefined') {
        w.ExcelJS = {
            Workbook: function () {
                return {
                    xlsx: {
                        load: async () => {},
                        writeBuffer: async () => new ArrayBuffer(0)
                    },
                    addWorksheet() {
                        return { getCell() { return { value: null }; }, addRow() {} };
                    }
                };
            }
        };
    }
})(window);

/* --- mobil zoom kilidi --- */
try {
    if (localStorage.getItem('erp_ui_skin') === 'workcube') document.body.classList.add('erp-skin-workcube');
} catch (e) {}
/* Mobil uygulama hissi: pinch / çift dokunuş zoom kilidi */
(function erpMobileZoomLock() {
    const lockViewport = () => {
        let meta = document.querySelector('meta[name="viewport"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'viewport';
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover');
    };
    lockViewport();
    // iOS bazen meta'yı değiştirir — periyodik kilitle
    setInterval(lockViewport, 2000);
    document.addEventListener('gesturestart', (e) => { e.preventDefault(); }, { passive: false });
    document.addEventListener('gesturechange', (e) => { e.preventDefault(); }, { passive: false });
    document.addEventListener('gestureend', (e) => { e.preventDefault(); }, { passive: false });
    document.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length > 1) e.preventDefault();
    }, { passive: false });
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const t = e.target;
        if (t && t.closest && t.closest('input,textarea,select,button,a,[role="button"],.btn-pro,.pro-input,.nav-pro,.nav-pro-sub')) {
            lastTouchEnd = Date.now();
            return;
        }
        const now = Date.now();
        if (now - lastTouchEnd <= 280) e.preventDefault();
        lastTouchEnd = now;
    }, { passive: false });
    document.addEventListener('wheel', (e) => {
        if (e.ctrlKey) e.preventDefault();
    }, { passive: false });
    document.addEventListener('dblclick', (e) => {
        const t = e.target;
        if (t && (t.closest('input,textarea,select,[contenteditable="true"]'))) return;
        e.preventDefault();
    }, { passive: false });
})();

/* --- ana uygulama --- */
// ============================================================
//  GÖKSEL GÜDÜK ERP — V9.8.6
//  Düzeltmeler:
//  1. renderInputs — SIPARIS_GIRIS bloğu doğru kapatıldı
//  2. checkIplikExit içine gömülü checkKumasExit ayrıldı
//  3. loadWorkflowHistory içindeki yanlış log kodu temizlendi
//  4. getNextIplikStokCode ve prepareNewIplikCard tekrarları silindi
//  6. loadData fonksiyonu doğru kapatıldı
// ============================================================

// ── OPTİMİZASYON: Debounce + Chart Instance Yönetimi ──
// yeniKartGirisBaslikMetin: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
function kumasKartListeFiltreSet(tip) {
    kumasKartListeFiltre = kumasKartTipiNorm(tip);
    kumasKartGirisTipi = kumasKartListeFiltre;
    saveUiState({ kumasKartListeFiltre });
    const sel = document.getElementById('val-kumas-tipi');
    if (sel) sel.value = kumasKartListeFiltre;
    kumasKartTipiFormGuncelle();
    if (appMode === 'KART_LISTE') loadData();
}

// ── Yardımcı: güvenli getElementById ──

// --- SUPABASE — değerler erp-config.js (window.__ERP_SUPABASE) içindedir ---
/* ERP_QUERY_TIMEOUT_MS: ana programın çekirdeğinden gelir (assets/erp-core.js) */

function erpInitSupabaseClient() {
    const c = erpGetSupabaseConfig();
    if (!c || !c.url || !c.anonKey) return false;
    SB_URL = String(c.url).trim();
    SB_KEY = String(c.anonKey).trim();
    if (SB_URL.includes('YOUR_PROJECT') || SB_KEY.includes('YOUR_SUPABASE')) return false;
    try {
        const opts = (typeof erpSupabaseClientOptions === 'function') ? erpSupabaseClientOptions() : {};
        sb = supabase.createClient(SB_URL, SB_KEY, opts);
        mobilSaltOkunurKapisiKur(sb);
        return true;
    } catch (e) {
        console.error('Supabase client oluşturulamadı:', e);
        return false;
    }
}

/**
 * MOBİL SALT OKUNUR — tek istisna stok sayımı (kullanıcı kararı, 19.09.2026).
 * Engel arayüzde değil YAZMA KAPISINDA: mobildeki her ekran, düğme ve arka plan
 * senkronu buradan geçer; sayım dışında hiçbir yazma veritabanına ulaşmaz.
 * Mobil ana programdan kaymış hesaplar içerdiği için yazdığı veri ana programın
 * doğru verisini bozabiliyordu.
 * İzin verilen: STOK_SAYIM ekranındayken iplik_stok / kumas_stok hareketi ve
 * siparis_akis'e yalnız sayım raporu (islem = STOK_SAYIM_RAPOR); giriş/oturum RPC'leri.
 * 24.09.2026 ikinci istisna: SIPARIS_FOTO_EKLE yetkilisi siparişe açıklamalı fotoğraf
 * ekleyebilir (bkz. mobilFotoYazmasiMi) — sipariş bilgisi yine değiştirilemez.
 */
const MOBIL_SAYIM_TABLOLARI = ['iplik_stok', 'kumas_stok', 'siparis_akis'];
const MOBIL_OKUMA_RPC = /^(erp_login|erp_session_me|erp_logout|erp_session_[a-z_]*|erp_admin_users_list)$/;
let _mobilSaltOkunurUyariAt = 0;

function mobilSaltOkunurMesaj() {
    return 'Mobil salt okunurdur — yalnız stok sayımı girilebilir. Bu işlemi ana programdan yapın.';
}

function mobilSaltOkunurEngelSonucu(neden) {
    console.info('[mobil salt okunur] engellendi:', neden);
    const simdi = Date.now();
    if (simdi - _mobilSaltOkunurUyariAt > 6000) {
        _mobilSaltOkunurUyariAt = simdi;
        try { if (typeof erpToast === 'function') erpToast(mobilSaltOkunurMesaj(), 'error', 4500); } catch (e) {}
    }
    const sonuc = { data: null, error: { message: mobilSaltOkunurMesaj(), code: 'MOBIL_SALT_OKUNUR' } };
    const zincir = new Proxy(function () {}, {
        get: (_, ad) => (ad === 'then' ? (ok, hata) => Promise.resolve(sonuc).then(ok, hata) : () => zincir),
        apply: () => zincir
    });
    return zincir;
}

/* İKİNCİ İSTİSNA — siparişe açıklamalı fotoğraf (kullanıcı, 24.09.2026). Üç şartın
   ÜÇÜ de gerekir: (1) SIPARIS_FOTO_EKLE yetkisi, (2) ortak koddaki siparisFotoEkleKaydet
   o an çalışıyor (window.__erpSiparisFotoYazma), (3) yazılan şey yalnız fotoğraf:
   siparis-fotograflar kovasına yükleme ya da siparisler'de yalnız fotoğraf/geçmiş alanları. */
const MOBIL_FOTO_KOVASI = 'siparis-fotograflar';
const MOBIL_FOTO_ALANLARI = ['siparis_fotograflar', 'islem_gecmisi', 'updated_by', 'updated_at'];
function mobilFotoYazmaAcikMi() {
    return window.__erpSiparisFotoYazma === true
        && typeof erpUserCan === 'function' && erpUserCan('SIPARIS_FOTO_EKLE');
}
function mobilFotoYazmasiMi(tablo, yontem, payload) {
    if (tablo !== 'siparisler' || yontem !== 'update' || !mobilFotoYazmaAcikMi()) return false;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
    const alanlar = Object.keys(payload);
    return alanlar.includes('siparis_fotograflar') && alanlar.every(a => MOBIL_FOTO_ALANLARI.includes(a));
}

/* ÜÇÜNCÜ İSTİSNA — ürün ağacı yalnız yönetici (kullanıcı, 25.09.2026: "sadece admin, benden başka
   kimse giriş yapamayacak"). Şartların HEPSİ: yönetici + Ürün Ağacı ekranı açık + yazılan şey yalnız
   ürün ağacı: siparis_akis'te KD_URUN_AGACI satırı (sbKdSet) ya da siparisler'de yalnız uretim_yeri
   (uaKaydet). Silme, sipariş kalemi ekle/sil (cins/miktar) ve başka tablolar kapalı kalır.
   Yönetici olmayan ekranı zaten açamaz (mobilKisitEngelMetni). */
const MOBIL_UA_KD_ALANLARI = ['notlar', 'kalem_ad', 'miktar'];
const MOBIL_UA_SIPARIS_ALANLARI = ['uretim_yeri', 'updated_by', 'updated_at'];
function mobilUrunAgaciYazmasiMi(tablo, yontem, payload) {
    if (typeof appMode === 'undefined' || appMode !== 'URUN_AGACI') return false;
    if (typeof erpIsAdmin !== 'function' || !erpIsAdmin()) return false;
    if (!payload || typeof payload !== 'object') return false;
    if (tablo === 'siparis_akis') {
        if (yontem === 'update') {
            return !Array.isArray(payload) && payload.kalem_ad === 'KD_URUN_AGACI'
                && Object.keys(payload).every(a => MOBIL_UA_KD_ALANLARI.includes(a));
        }
        if (yontem !== 'insert') return false;
        const satirlar = Array.isArray(payload) ? payload : [payload];
        return satirlar.length > 0 && satirlar.every(r => r && r.islem === 'KD_URUN_AGACI' && r.kalem_ad === 'KD_URUN_AGACI');
    }
    if (tablo === 'siparisler' && yontem === 'update' && !Array.isArray(payload)) {
        const alanlar = Object.keys(payload);
        return alanlar.includes('uretim_yeri') && alanlar.every(a => MOBIL_UA_SIPARIS_ALANLARI.includes(a));
    }
    return false;
}

function mobilSayimYazmasiMi(tablo, payload) {
    if (typeof appMode === 'undefined' || appMode !== 'STOK_SAYIM') return false;
    if (!MOBIL_SAYIM_TABLOLARI.includes(tablo)) return false;
    if (tablo !== 'siparis_akis') return true;
    const satirlar = Array.isArray(payload) ? payload : [payload];
    return satirlar.length > 0 && satirlar.every(r => r && r.islem === 'STOK_SAYIM_RAPOR');
}

/* ── TELEFONDA GENİŞ TABLO → KART ──────────────────────────────────────────
   Ana programın tabloları telefonda ekrana sığmıyor (sipariş detayı kalem tablosu
   1.180 px, Sevkiyat 1.170 px, Depo hareketleri 1.655 px); kullanıcı yana kaydırmak
   zorunda kalıyordu (20.09.2026 görsel çalışması). Sütun GİZLEMİYORUZ — veri kaybı
   olmasın diye her hücre "başlık: değer" satırına dönüşür.
   Burada yalnız etiket işlenir (data-mobil-etiket); görünümü mobil-erp.css yapar.
   Yalnız ekrana SIĞMAYAN tablolar işaretlenir, dar tablolar tablo olarak kalır. */
const MOBIL_TABLO_ESIK = 560;
function mobilTabloKartlastir(kok, yalnizBunlar) {
    try {
        if (window.innerWidth > MOBIL_TABLO_ESIK) return;
        const alan = kok || document;
        const tablolar = yalnizBunlar ? [...yalnizBunlar] : [...alan.querySelectorAll('table')];
        /* PERFORMANS: önce hepsi okunur, sonra hepsi yazılır. Hücre yazısı textContent ile
           okunur (innerText her çağrıda sayfa düzenini hesaplatır; araya etiket yazımı girince
           800 satırlık Sevkiyat tablosunda hücre başına yeniden hesap = saniyeler). */
        const metinAl = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
        const yazilacak = [];
        tablolar.forEach((t) => {
            /* Karta dönmüş tablo artık sığar — yeniden ölçüp geri almak "aç-kapa" döngüsü yapıyordu
               (her çalışmada kart ↔ tablo). Kart kalır; yalnız yeni satırların etiketi tazelenir. */
            if (!t.classList.contains('mobil-kart-tablo')) {
                const sar = t.parentElement;
                /* Sarmalayıcı da tabloyla birlikte genişlemiş olabilir (esnek öğe min-width:auto) —
                   ekran genişliği de sınır sayılır; yoksa tablo "sığıyor" sanılıp dışı kesiliyordu. */
                const sinir = Math.min(sar ? sar.clientWidth : window.innerWidth, window.innerWidth - 16);
                if (t.scrollWidth <= sinir + 8) return;
            }
            /* Başlık az sayıda — innerText ile okunur: "SİP<br>MİKTAR" textContent'te "SİPMİKTAR" oluyordu. */
            const basliklar = [...t.querySelectorAll('thead th')].map((th) => (th.innerText || '').replace(/\s+/g, ' ').trim());
            if (!basliklar.length) return;
            const hucreler = [];
            t.querySelectorAll('tbody tr').forEach((tr) => {
                [...tr.children].forEach((td, i) => {
                    /* Değeri olmayan alan (—) kartı uzatmasın; dolu bilgiler görünür kalır. */
                    const bos = !td.querySelector('input,select,button,img,svg') && ['', '—', '-', '–'].includes(metinAl(td));
                    hucreler.push([td, basliklar[i] || '', bos]);
                });
            });
            yazilacak.push([t, hucreler]);
        });
        for (const [t, hucreler] of yazilacak) {
            for (const [td, et, bos] of hucreler) {
                if (et && td.getAttribute('data-mobil-etiket') !== et) td.setAttribute('data-mobil-etiket', et);
                if (bos) { if (!td.hasAttribute('data-mobil-bos')) td.setAttribute('data-mobil-bos', '1'); }
                else if (td.hasAttribute('data-mobil-bos')) td.removeAttribute('data-mobil-bos');
            }
            if (!t.classList.contains('mobil-kart-tablo')) t.classList.add('mobil-kart-tablo');
        }
    } catch (e) { console.warn('mobilTabloKartlastir', e && e.message); }
}

/* ── TELEFON UYARLAYICISI ──────────────────────────────────────────────────
   Kullanıcı, 24.09.2026: "mobilde ciddi anlamda telefonda kullanamama sorunu var,
   sığmıyor, her şey birbirine giriyor — kökten ve sağlam bir çözüm bulmamız lazım".
   Mobil ana programın ekranlarını çalıştırır; o ekranlar masaüstü için çizilmiş:
   satır içi 8–9 px yazı (~800 yerde), 6'lı/5'li sabit ızgaralar, iç içe kaydırma
   kutuları. Ekran ekran yama yerine, telefonda çizilen HER ekran/pencere gerçek
   ölçüsüne bakılarak uyarlanır — yeni eklenen ekranlar da kendiliğinden uyar.
   Sıra önemli: önce yazı büyür (genişlikler değişir), sonra ızgara/dizi yeniden
   dizilir, iç kaydırmalar açılır, en son sığmayan tablo karta döner.
   Yalnız GÖRÜNÜM değişir (satır içi stil); veri, hesap, olay kodu değişmez.
   Denetim: scripts/mobil-duzen/ (her ekranı ölçer, çakışma/taşma sıfır olmalı). */
const MOBIL_TEL_ESIK = 600;       // bu genişlik ve altı telefon sayılır
const MOBIL_MIN_YAZI = 12;        // normal yazı alt sınırı (px)
const MOBIL_MIN_ETIKET = 11;      // BÜYÜK HARF / aralıklı etiket alt sınırı (görsel olarak daha iri)
const MOBIL_MIN_SUTUN = 132;      // ızgara sütunu bundan darsa yeniden dizilir (px)

function mobilTelefonMu() { return window.innerWidth <= MOBIL_TEL_ESIK; }
const mobilOnemli = (el, ozellik, deger) => el.style.setProperty(ozellik, deger, 'important');

/* PERFORMANS: her adım önce TÜM öğeleri okur, sonra hepsine birden yazar. Yazıp hemen
   okumak tarayıcıyı her öğede sayfa düzenini baştan hesaplamaya zorlar — 2.000 öğelik
   ekranda telefonu saniyelerce donduruyordu (denetimde bir sayfa 588 sn işlemci harcadı).
   Adım başına tek düzen hesabı yapılır. İşlenen yazı öğeleri DOM'a yazmadan WeakSet'te. */
/* Yazı durumu: 1 = bakıldı, gerek yok · 2 = büyütüldü. Büyütülen öğenin satır içi boyu
   ana programın kodu tarafından silinirse (stilini baştan yazan sekme düğmesi) yeniden uygulanır. */
const _mobilYaziDurum = new WeakMap();
const _mobilIzgaraSutun = new WeakMap();

/** Uyarlanacak kökler: ana alan + açık pencereler (sabit konumlu katmanlar). */
function mobilUyarlaKokleri() {
    const out = [];
    const main = document.querySelector('main');
    if (main) out.push(main);
    for (const el of document.body.children) {
        if (el === main || el.contains(main) || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
        const s = getComputedStyle(el);
        if (s.display === 'none' || (s.position !== 'fixed' && s.position !== 'absolute')) continue;
        /* Yalnız EKRANDA görünen katman: PDF/yazdırma için ekran dışına konan gizli kap
           uyarlanırsa telefondan alınan PDF'in düzeni bozulur. */
        const r = el.getBoundingClientRect();
        if (r.right <= 0 || r.bottom <= 0 || r.left >= window.innerWidth || r.top >= window.innerHeight) continue;
        if (s.visibility === 'hidden' || Number(s.opacity) === 0) continue;
        out.push(el);
    }
    return out;
}

const mobilKontrolMu = (el) => /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName);
function mobilKendiYazisiVar(el) {
    if (mobilKontrolMu(el)) return true;
    for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    return false;
}

/** 1) Yazı: okunamayacak kadar küçük yazıyı alt sınıra çeker; sıkışık satır aralığını açar. */
function mobilYaziBuyut(ogeler) {
    const yaz = [];
    for (const el of ogeler) {
        const durum = _mobilYaziDurum.get(el);
        if (durum === 1) continue;
        if (durum === 2 && el.style.getPropertyValue('font-size')) continue;
        if (!mobilKendiYazisiVar(el) || el.closest('svg')) { _mobilYaziDurum.set(el, 1); continue; }
        const s = getComputedStyle(el);
        const boy = parseFloat(s.fontSize) || 0;
        const etiket = s.textTransform === 'uppercase' || parseFloat(s.letterSpacing) >= 0.6;
        const alt = etiket ? MOBIL_MIN_ETIKET : MOBIL_MIN_YAZI;
        if (!boy || boy >= alt) { _mobilYaziDurum.set(el, 1); continue; }
        _mobilYaziDurum.set(el, 2);
        yaz.push([el, alt, s.lineHeight.endsWith('px') && parseFloat(s.lineHeight) < alt * 1.15]);
    }
    for (const [el, alt, satir] of yaz) {
        /* "transition: all" olan düğmede boy animasyonla büyür; sonraki adımlar o an ESKİ
           boyu ölçüp yanlış karar verir. Telefonda üzerine gelme yok — kayıp yok. */
        mobilOnemli(el, 'transition', 'none');
        mobilOnemli(el, 'font-size', alt + 'px');
        if (satir) mobilOnemli(el, 'line-height', '1.25');
    }
}

/** Satır içi şablonda esnek (fr) tanımlı olup ekranda MOBIL_MIN_SUTUN'un altına ezilen sütun var mı?
    Ör. "minmax(320px,1.2fr) minmax(0,3fr)": toplam genişlik iki sütuna yeter görünür ama ilki
    320 px'i alıp ikincisini 21 px'e ezer. Bilerek dar (sabit px) sütunlar (ikon vb.) sayılmaz. */
function mobilIzgaraEzikFrSutunVar(el, izler) {
    const tanim = String(el.style.gridTemplateColumns || '');
    if (!tanim || tanim.includes('repeat(')) return false;
    const parcalar = [];
    let derinlik = 0, bas = 0;
    for (let i = 0; i <= tanim.length; i++) {
        const ch = tanim[i];
        if (ch === '(') derinlik++;
        else if (ch === ')') derinlik--;
        else if ((ch === ' ' || ch === undefined) && derinlik === 0) {
            const p = tanim.slice(bas, i).trim();
            if (p) parcalar.push(p);
            bas = i + 1;
        }
    }
    if (parcalar.length !== izler.length) return false;
    return parcalar.some((p, i) => /fr\b/.test(p) && izler[i] < MOBIL_MIN_SUTUN);
}

/** 2) Izgara: sütunları MOBIL_MIN_SUTUN'dan dar düşen ızgarayı sığan sütun sayısına indirir;
    indirdikten sonra içerik hâlâ taşıyorsa bir sütun daha azaltır (en çok 3 tur). */
function mobilIzgaraUyarla(ogeler) {
    const izgaralar = ogeler.filter((el) => {
        if (el.classList.contains('mobil-izgara-sabit')) return false;   // bilerek dar sütunlu, içeriği sığan ızgara
        const d = getComputedStyle(el).display;
        return d === 'grid' || d === 'inline-grid';
    });
    for (let tur = 0; tur < 3; tur++) {
        const yaz = [];
        for (const el of izgaralar) {
            const s = getComputedStyle(el);
            if (s.gridTemplateAreas && s.gridTemplateAreas !== 'none') continue;
            const izler = s.gridTemplateColumns.split(' ').map(parseFloat).filter((x) => x > 0);
            if (izler.length < 2) continue;
            const genislik = el.clientWidth - (parseFloat(s.paddingLeft) || 0) - (parseFloat(s.paddingRight) || 0);
            const bosluk = parseFloat(s.columnGap) || 0;
            const dar = Math.min(...izler) < MOBIL_MIN_SUTUN;
            const tasiyor = [...el.children].some((c) => c.scrollWidth > c.clientWidth + 3 && c.clientWidth > 0);
            if (!dar && !tasiyor) continue;
            let n = Math.max(1, Math.floor((genislik + bosluk) / (MOBIL_MIN_SUTUN + bosluk)));
            const once = _mobilIzgaraSutun.get(el);
            if (once) n = Math.min(n, Math.max(1, once - (tasiyor ? 1 : 0)));
            if (n >= izler.length && dar && mobilIzgaraEzikFrSutunVar(el, izler)) n = izler.length - 1;
            if (n >= izler.length) continue;
            const sabitKolon = [...el.children].filter((c) => {
                const gc = getComputedStyle(c).gridColumnStart;
                return /^\d+$/.test(gc) && Number(gc) > n;
            });
            yaz.push([el, n, sabitKolon]);
        }
        if (!yaz.length) break;
        for (const [el, n, sabitKolon] of yaz) {
            _mobilIzgaraSutun.set(el, n);
            mobilOnemli(el, 'grid-template-columns', `repeat(${n}, minmax(0, 1fr))`);
            /* Sabit sütun konumu (grid-column: 3) yeni sütun sayısını aşarsa kendi yerine akar. */
            for (const c of sabitKolon) mobilOnemli(c, 'grid-column', 'auto');
        }
    }
}

/** 3) Yatay dizi: içeriği sığmayan tek satırlık esnek diziyi alt satıra kaydırır. */
function mobilDiziUyarla(ogeler) {
    const yaz = [];
    for (const el of ogeler) {
        const s = getComputedStyle(el);
        if (s.display !== 'flex' && s.display !== 'inline-flex') continue;
        if (!s.flexDirection.startsWith('row') || s.flexWrap !== 'nowrap') continue;
        if (/(auto|scroll)/.test(s.overflowX)) continue;          // bilerek kaydırılan çip şeridi
        if (el.closest('table')) continue;
        const tasiyor = el.scrollWidth > el.clientWidth + 2
            || [...el.children].some((c) => c.children.length === 0 && c.scrollWidth > c.clientWidth + 3 && c.clientWidth > 0);
        if (tasiyor) yaz.push([el, !(parseFloat(s.rowGap) > 0)]);
    }
    for (const [el, bosluk] of yaz) {
        mobilOnemli(el, 'flex-wrap', 'wrap');
        if (bosluk) mobilOnemli(el, 'row-gap', '6px');
    }
}

/** 3a) Geniş çocuk: kapsayıcısından geniş öğe kapsayıcıya sığdırılır. Esnek/ızgara öğesi
    varsayılan min-width:auto yüzünden içindeki tablo kadar (900 px) genişliyor, taşan kısmı
    en dıştaki pencerede SESSİZCE kesiliyordu (Sipariş Durum İnceleme ürün tablosu). Sığınca
    içteki tablo sığmadığını görür ve karta döner. Bilerek kaydırılan kaplara dokunulmaz.
    Dıştan içe turlar: dış kap daralınca iç öğeler bir sonraki turda görünür (en çok 4 tur). */
function mobilGenisCocukDaralt(ogeler) {
    const W = window.innerWidth;
    const aday = ogeler.filter((el) => el.tagName !== 'TABLE' && !el.closest('table'));
    for (let tur = 0; tur < 4; tur++) {
        const yaz = [];
        for (const el of aday) {
            const p = el.parentElement;
            if (!p) continue;
            const pw = p.clientWidth;
            if (!pw || pw > W || el.offsetWidth <= pw + 2) continue;
            if (/(auto|scroll)/.test(getComputedStyle(p).overflowX)) continue;
            const s = getComputedStyle(el);
            if (s.position === 'absolute' || s.position === 'fixed') continue;
            if (el.style.getPropertyValue('max-width') === '100%') continue;
            yaz.push([el, s.boxSizing !== 'border-box']);
        }
        if (!yaz.length) break;
        for (const [el, kutu] of yaz) {
            mobilOnemli(el, 'min-width', '0');
            mobilOnemli(el, 'max-width', '100%');
            if (kutu) mobilOnemli(el, 'box-sizing', 'border-box');
        }
    }
}

/** 3b) Kesik yazı: tek satıra sığmayıp "…" ile kesilen bilgi telefonda alt satıra akar
    (Kumaş kartında "ARMÜR · Tarak eni 270 · Atkı…" yarıdan fazlası görünmüyordu). */
function mobilKesikYaziAc(ogeler) {
    const yaz = [];
    for (const el of ogeler) {
        if (el.children.length > 2 || mobilKontrolMu(el)) continue;
        if (el.scrollWidth <= el.clientWidth + 3 || !el.clientWidth) continue;
        if (el.closest('.top-header, .erp-sidebar, table:not(.mobil-kart-tablo), .mobil-tek-satir')) continue;   // .mobil-tek-satir: bilerek kesilen, tamamı ayrıntıda görünen yazı
        const s = getComputedStyle(el);
        if (/(auto|scroll)/.test(s.overflowX)) continue;   // bilerek kaydırılan şerit tek satır kalır
        /* Kesilen ("…") ya da kutusundan taşıp komşusuna binen tek satırlık yazı akar; boşluksuz
           uzun kelime ("SİPARİŞ→DOKUMA→KESİM→…" zinciri) gerekirse bölünür. */
        yaz.push([el, s.whiteSpace === 'nowrap' || s.whiteSpace === 'pre']);
    }
    for (const [el, tekSatir] of yaz) {
        if (tekSatir) {
            mobilOnemli(el, 'white-space', 'normal');
            mobilOnemli(el, 'text-overflow', 'clip');
        }
        mobilOnemli(el, 'overflow-wrap', 'anywhere');
    }
}

/** Öğe, sabit/mutlak bir katmanın (pencere, açılır liste) ASIL kaydırıcısı mı? */
function mobilKatmanKaydiricisiMi(el) {
    for (let p = el; p && p !== document.body; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (p !== el && /(auto|scroll)/.test(s.overflowY)) return false; // arada başka kaydırıcı var
        if (s.position === 'fixed' || s.position === 'absolute') return true;
    }
    return false;
}

/** 4) İç kaydırma: sayfa içindeki küçük kaydırma kutularını açar — telefonda tek, doğal kaydırma. */
const MOBIL_KAYDIRMA_KORU = '.content-scroll, #modal-body, [role="listbox"], [class*="dropdown"], [class*="suggest"], [class*="autocomplete"], [class*="oneri"]';
function mobilIcKaydirmaAc(ogeler) {
    const yaz = [];
    for (const el of ogeler) {
        const s = getComputedStyle(el);
        if (!/(auto|scroll)/.test(s.overflowY)) continue;
        if (el.scrollHeight <= el.clientHeight + 8) continue;
        if (el.matches(MOBIL_KAYDIRMA_KORU) || mobilKatmanKaydiricisiMi(el)) continue;
        yaz.push(el);
    }
    for (const el of yaz) {
        mobilOnemli(el, 'max-height', 'none');
        mobilOnemli(el, 'height', 'auto');
        mobilOnemli(el, 'overflow-y', 'visible');
    }
}

/** Yalnız DEĞİŞEN bölümler: gözlemcinin bildirdiği hedeflerin alt ağacı + onları saran kaplar
    (içerik büyüyünce saran ızgara/dizi yeniden değerlendirilir). Hedef yoksa tüm ekran.
    Canlı veriyle tek satır değiştiğinde tüm sayfa değil yalnız o satır taranır. */
function mobilUyarlanacakOgeler(hedefler) {
    const kokler = mobilUyarlaKokleri();
    if (!hedefler || !hedefler.size) {
        const hepsi = [];
        for (const k of kokler) for (const el of k.querySelectorAll('*')) hepsi.push(el);
        return { ogeler: hepsi, tablolar: document.querySelectorAll('table') };
    }
    const kume = new Set();
    const tablolar = new Set();
    const liste = [...hedefler].filter((h) => h.isConnected && kokler.some((k) => k === h || k.contains(h)));
    /* İç içe hedeflerden yalnız en dıştaki taranır. */
    const distakiler = liste.filter((h) => !liste.some((d) => d !== h && d.contains(h)));
    for (const h of distakiler) {
        kume.add(h);
        for (const el of h.querySelectorAll('*')) kume.add(el);
        for (let p = h.parentElement; p && p !== document.body; p = p.parentElement) kume.add(p);
        h.querySelectorAll('table').forEach((t) => tablolar.add(t));
        const ust = h.closest('table'); if (ust) tablolar.add(ust);
    }
    return { ogeler: [...kume], tablolar: [...tablolar] };
}

let _mobilUyarlaCalisiyor = false;
function mobilTelefonaUyarla(hedefler) {
    if (!mobilTelefonMu() || _mobilUyarlaCalisiyor) return;
    _mobilUyarlaCalisiyor = true;
    const t0 = performance.now();
    try {
        const { ogeler, tablolar } = mobilUyarlanacakOgeler(hedefler);
        /* Tablo içi (Sevkiyat'ta 7.619 öğenin 7.358'i) yalnız yazı adımından geçer — tablo
           zaten karta döner; ızgara/dizi/kaydırma adımlarının orada işi yok. */
        const tabloDisi = ogeler.filter((el) => !el.closest('table'));
        /* Teşhis: window.__mobilUyarlaProfil = {} verilirse adım süreleri (ms) oraya toplanır. */
        const profil = window.__mobilUyarlaProfil && typeof window.__mobilUyarlaProfil === 'object' ? window.__mobilUyarlaProfil : null;
        const adim = (ad, fn, liste) => {
            const a = profil ? performance.now() : 0;
            try { fn(liste); } catch (e) { console.warn(ad, e && e.message); }
            if (profil) profil[ad] = (profil[ad] || 0) + (performance.now() - a);
        };
        adim('mobilYaziBuyut', mobilYaziBuyut, ogeler);
        adim('mobilIzgaraUyarla', mobilIzgaraUyarla, tabloDisi);
        adim('mobilDiziUyarla', mobilDiziUyarla, tabloDisi);
        adim('mobilGenisCocukDaralt', mobilGenisCocukDaralt, tabloDisi);
        adim('mobilKesikYaziAc', mobilKesikYaziAc, tabloDisi);
        adim('mobilIcKaydirmaAc', mobilIcKaydirmaAc, tabloDisi);
        adim('mobilTabloKartlastir', () => mobilTabloKartlastir(document, tablolar), null);
        if (profil) { const a = performance.now(); void document.body.offsetHeight; profil.sonYerlesim = (profil.sonYerlesim || 0) + (performance.now() - a); profil.calisma = (profil.calisma || 0) + 1; profil.oge = (profil.oge || 0) + ogeler.length; }
    } finally {
        _mobilUyarlaCalisiyor = false;
        window.__mobilUyarlaSonMs = Math.round(performance.now() - t0);
    }
}
window.mobilTelefonaUyarla = mobilTelefonaUyarla;

/* Ekran/pencere her çizildiğinde yeniden uygulanır. Uyarlayıcının kendi stil yazımları
   (attributes) izlenmez → kendi kendini tetiklemez. */
function mobilTabloIzleyiciKur() {
    if (window.__mobilTabloIzleyici || !mobilTelefonMu()) return;
    let bekleyen = null;
    let sonCalisma = 0;
    let hedefler = new Set();     // değişen bölümler (childList hedefleri)
    let tamTarama = false;        // tıklama/yön değişimi: stil değişimi her yerde olabilir
    const calistir = () => {
        const h = hedefler; const tam = tamTarama;
        hedefler = new Set(); tamTarama = false;
        sonCalisma = performance.now();
        mobilTelefonaUyarla(tam ? null : h);
    };
    /* Gözlemci bildirimi ekran çizilmeden ÖNCE gelir: hemen uygulanırsa yeni içerik ilk
       karesinden uyarlanmış görünür — önce masaüstü boyutunda görünüp sonra "sıçrama" yok.
       Art arda gelen değişikliklerde (120 ms içinde) yük birikmesin diye bekletilir. */
    const planla = (kayitlar) => {
        if (Array.isArray(kayitlar)) for (const k of kayitlar) {
            if (!k.target || k.target.nodeType !== 1) continue;
            /* body'ye doğrudan eklenen pencere: hedef body değil, eklenen öğenin kendisi. */
            if (k.target === document.body || k.target === document.documentElement) {
                for (const n of k.addedNodes) if (n.nodeType === 1) hedefler.add(n);
            } else hedefler.add(k.target);
        }
        clearTimeout(bekleyen);
        if (performance.now() - sonCalisma > 120) calistir();
        else bekleyen = setTimeout(calistir, 90);
    };
    const tamPlanla = (gecikme) => { tamTarama = true; clearTimeout(bekleyen); bekleyen = setTimeout(calistir, gecikme); };
    /* Tüm sayfa TEK gözlemciyle izlenir: ana alan, sonradan eklenen ya da kapanıp yeniden
       kurulan pencereler. (Önce yalnız başlangıçta bulunan pencere izleniyordu; ikinci açılışta
       pencerenin son çizimi gözden kaçıyordu.) Uyarlayıcı yalnız stil/öznitelik yazar,
       childList değil → kendini tetiklemez. Boştayken sayfada DOM değişimi yok (ölçüldü). */
    const gozlemci = new MutationObserver(planla);
    gozlemci.observe(document.body, { childList: true, subtree: true });
    /* Sekme, aç-kapa gibi yalnız STİL değiştiren dokunuşlar childList üretmez (ana programın
       sekme düğmesi her tıklamada kendi stilini baştan yazıyor, büyütülen yazı siliniyordu). */
    document.addEventListener('click', () => tamPlanla(150), true);
    window.addEventListener('orientationchange', () => tamPlanla(250));
    window.__mobilTabloIzleyici = gozlemci;
    mobilTelefonaUyarla();
}
try {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mobilTabloIzleyiciKur);
    else setTimeout(mobilTabloIzleyiciKur, 0);
} catch (e) {}

function mobilSaltOkunurKapisiKur(client) {
    if (!client || client.__mobilSaltOkunur) return;
    client.__mobilSaltOkunur = true;
    const asilFrom = client.from.bind(client);
    client.from = (tablo) => {
        const q = asilFrom(tablo);
        for (const yontem of ['insert', 'upsert', 'update', 'delete']) {
            const asil = q[yontem] && q[yontem].bind(q);
            if (!asil) continue;
            q[yontem] = (payload, ...rest) => {
                const izin = ((yontem === 'insert' || yontem === 'upsert') && mobilSayimYazmasiMi(tablo, payload))
                    || mobilFotoYazmasiMi(tablo, yontem, payload)
                    || mobilUrunAgaciYazmasiMi(tablo, yontem, payload);
                return izin ? asil(payload, ...rest) : mobilSaltOkunurEngelSonucu(tablo + '.' + yontem);
            };
        }
        return q;
    };
    const asilRpc = client.rpc.bind(client);
    client.rpc = (ad, ...rest) => (MOBIL_OKUMA_RPC.test(String(ad || ''))
        ? asilRpc(ad, ...rest)
        : mobilSaltOkunurEngelSonucu('rpc ' + ad));
    if (client.storage && client.storage.from) {
        const asilStorage = client.storage.from.bind(client.storage);
        client.storage.from = (kova) => {
            const s = asilStorage(kova);
            for (const yontem of ['upload', 'update', 'remove', 'move', 'copy']) {
                if (!s[yontem]) continue;
                const asil = s[yontem].bind(s);
                /* Yalnız siparişe fotoğraf eklerken, yalnız o kovaya YENİ dosya (upload) —
                   silme/taşıma/üzerine yazma hiçbir durumda yok. */
                s[yontem] = (...args) => ((yontem === 'upload' && kova === MOBIL_FOTO_KOVASI && mobilFotoYazmaAcikMi())
                    ? asil(...args)
                    : mobilSaltOkunurEngelSonucu('storage ' + kova + '.' + yontem));
            }
            return s;
        };
    }
}

erpInitSupabaseClient();

// --- Oturum ve yetki ---
/** Mod listesi — kullanıcı yönetiminde checkbox etiketleri */
/* Mod listesi — kullanıcı yönetiminde checkbox etiketleri.
   ANA PROGRAMLA BİREBİR AYNI OLMAK ZORUNDA (src/stok/js/01-supabase-auth.js).
   Buradan eksik kalan her mod, mobilden kaydedilen kullanıcının o yetkisini
   SESSİZCE SİLER — kayıt yalnız işaretli kutulardan toplanır. */
/** Yetki ekranındaki gruplar — ERP_PERM_MODES'daki tüm modları kapsar. */
/** Sık kullanılan görev profilleri — tek tıkla yetki seti. */
let erpAdminUsersCache = [];
let erpAdminUi = { selected: '', search: '', showNew: false };

const ERP_ADMIN_PW_KEY = 'erp_admin_pw_cache';

function erpAdminPwCacheLoad() {
    try { return JSON.parse(localStorage.getItem(ERP_ADMIN_PW_KEY) || '{}'); } catch (e) { return {}; }
}

function erpAdminRememberPassword(username, pw) {
    if (!username || !pw) return;
    const key = String(username).toLowerCase();
    const c = erpAdminPwCacheLoad();
    c[key] = pw;
    try { localStorage.setItem(ERP_ADMIN_PW_KEY, JSON.stringify(c)); } catch (e) {}
    const u = erpAdminUsersCache.find(x => String(x.username || '').toLowerCase() === key);
    if (u) u.password_plain = pw;
}

function erpAdminGetPassword(u) {
    const fromApi = u?.password_plain;
    if (fromApi) return String(fromApi);
    const c = erpAdminPwCacheLoad();
    return c[String(u?.username || '').toLowerCase()] || '';
}

function erpAdminToggleCredEye(btn) {
    const row = btn?.closest('.erp-cred-row, .erp-admin-cred-val');
    if (!row) return;
    const mask = row.querySelector('.erp-cred-mask');
    const plain = row.querySelector('.erp-cred-plain');
    if (!mask || !plain) return;
    const show = mask.style.display !== 'none';
    mask.style.display = show ? 'none' : '';
    plain.style.display = show ? '' : 'none';
    btn.textContent = show ? 'Gizle' : 'Göster';
}

function erpAdminPermLabelMap() {
    const m = {};
    ERP_PERM_MODES.forEach(([c, l]) => { m[c] = l; });
    return m;
}

function erpAdminPermGroupsHtml(checkedModes, inputClass) {
    const labels = erpAdminPermLabelMap();
    const checked = new Set(checkedModes || []);
    return ERP_PERM_GROUP_DEFS.map(g => {
        const items = g.kodlar.map(code => {
            const label = labels[code] || code;
            const on = checked.has(code);
            return `<label class="erp-perm-chip${on ? ' erp-perm-chip--on' : ''}">
                <input type="checkbox" class="${inputClass}" value="${erpEscapeHtml(code)}" ${on ? 'checked' : ''} onchange="this.parentElement.classList.toggle('erp-perm-chip--on', this.checked)">
                <span>${erpEscapeHtml(label)}</span>
            </label>`;
        }).join('');
        return `<div class="erp-perm-group" data-grp="${g.id}">
            <div class="erp-perm-group-head">
                <span class="erp-perm-group-title">${erpEscapeHtml(g.ikon ? g.ikon + ' ' : '')}${erpEscapeHtml(g.ad)}</span>
                <span class="erp-perm-group-actions">
                    <button type="button" class="erp-perm-grp-btn" onclick="erpAdminPermGroupAll(this,'${g.id}',true,'${inputClass}')">Tümü</button>
                    <button type="button" class="erp-perm-grp-btn" onclick="erpAdminPermGroupAll(this,'${g.id}',false,'${inputClass}')">Temizle</button>
                </span>
            </div>
            <div class="erp-perm-group-items">${items}</div>
        </div>`;
    }).join('');
}

function erpAdminPermGroupAll(btn, groupId, on, inputClass) {
    const g = ERP_PERM_GROUP_DEFS.find(x => x.id === groupId);
    if (!g) return;
    const root = btn.closest('.erp-user-card, .erp-newuser-card');
    if (!root) return;
    g.kodlar.forEach(code => {
        const inp = root.querySelector(`input.${inputClass}[value="${CSS.escape(code)}"]`);
        if (inp) {
            inp.checked = on;
            inp.parentElement?.classList.toggle('erp-perm-chip--on', on);
        }
    });
}

function erpAdminPermSelectAll(root, inputClass, on) {
    if (!root) return;
    root.querySelectorAll(`input.${inputClass}`).forEach(inp => {
        inp.checked = on;
        inp.parentElement?.classList.toggle('erp-perm-chip--on', on);
    });
}

/** Hazır rol seçimi — ana programdaki erpAdminSablon ile aynı işi yapar. */
function erpAdminSelectUser(username) {
    erpAdminUi.selected = username || '';
    erpAdminPaintFromCache(window.__erpAdminSaveV2Ready);
}

function erpAdminSetSearch(val) {
    erpAdminUi.search = String(val || '');
    erpAdminPaintFromCache(window.__erpAdminSaveV2Ready);
}

function erpAdminToggleNewUser(force) {
    erpAdminUi.showNew = (force !== undefined) ? !!force : !erpAdminUi.showNew;
    erpAdminPaintFromCache(window.__erpAdminSaveV2Ready);
}

function erpAdminNuRoleChanged(sel) {
    const root = sel?.closest('.erp-newuser-card');
    const box = root?.querySelector('.erp-nu-perms');
    if (!box) return;
    const admin = sel.value === 'admin';
    box.style.display = admin ? 'none' : '';
}

function erpAdminStylesHtml() {
    return `<style id="erp-admin-styles">
        .erp-admin-wrap { max-width:960px; margin:0 auto; display:flex; flex-direction:column; gap:10px; }
        .erp-admin-toolbar { display:flex; flex-wrap:wrap; gap:8px; align-items:center; padding:10px 12px; border:none; box-shadow:none; }
        .erp-admin-search { flex:0 1 160px; min-width:120px; }
        .erp-admin-layout { display:grid; grid-template-columns:minmax(200px,240px) 1fr; gap:10px; align-items:start; }
        @media (max-width:760px) { .erp-admin-layout { grid-template-columns:1fr; } }
        .erp-admin-list { display:flex; flex-direction:column; gap:1px; max-height:calc(100vh - 280px); overflow-y:auto; padding:4px; }
        .erp-admin-list-item { display:flex; flex-direction:column; align-items:flex-start; gap:1px; padding:8px 10px; border-radius:6px; border:none; cursor:pointer; transition:background .1s; text-align:left; background:transparent; width:100%; font-family:inherit; color:inherit; }
        .erp-admin-list-item:hover { background:var(--surface2); }
        .erp-admin-list-item--active { background:var(--surface2); box-shadow:inset 2px 0 0 var(--accent2); }
        .erp-admin-list-name { font-size:11px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
        .erp-admin-list-sub { font-size:9px; color:var(--text3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
        .erp-admin-list-role { font-size:8px; color:var(--text3); margin-top:2px; font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:.06em; }
        .erp-admin-detail-head { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px; padding:12px 14px; border-bottom:1px solid var(--border); }
        .erp-admin-detail-body { padding:12px 14px; display:flex; flex-direction:column; gap:12px; }
        .erp-admin-fields { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:8px; }
        .erp-admin-field label { display:block; font-size:8px; font-weight:600; color:var(--text3); text-transform:uppercase; letter-spacing:.06em; margin-bottom:3px; }
        .erp-admin-cred-row { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:10px 12px; background:var(--surface2); border-radius:8px; border:1px solid var(--border); }
        .erp-admin-cred-val { font-size:11px; color:var(--text); font-family:'DM Mono',monospace; word-break:break-all; }
        .erp-admin-cred-val--muted { color:var(--text3); }
        .erp-perm-toolbar { display:flex; flex-wrap:wrap; gap:6px; align-items:center; justify-content:space-between; margin-bottom:4px; }
        .erp-perm-toolbar-title { font-size:8px; font-weight:600; color:var(--text3); text-transform:uppercase; letter-spacing:.06em; }
        .erp-perm-groups { display:flex; flex-direction:column; gap:6px; }
        .erp-perm-group { border:1px solid var(--border); border-radius:8px; padding:0; overflow:hidden; background:transparent; }
        .erp-perm-group-head { display:flex; align-items:center; justify-content:space-between; gap:6px; padding:7px 10px; background:var(--surface2); }
        .erp-perm-group-title { font-size:9px; font-weight:600; color:var(--text2); }
        .erp-perm-group-actions { display:flex; gap:4px; }
        .erp-perm-grp-btn { padding:2px 6px; font-size:8px; border-radius:4px; border:none; background:transparent; color:var(--text3); cursor:pointer; }
        .erp-perm-grp-btn:hover { color:var(--accent2); }
        .erp-perm-group-items { display:flex; flex-wrap:wrap; gap:4px; padding:8px 10px; }
        .erp-perm-chip { display:inline-flex; align-items:center; gap:3px; padding:3px 7px; border-radius:5px; border:1px solid transparent; background:var(--surface2); font-size:9px; color:var(--text3); cursor:pointer; user-select:none; }
        .erp-perm-chip input { margin:0; width:11px; height:11px; accent-color:var(--accent); }
        .erp-perm-chip--on { color:var(--text); border-color:var(--border); background:var(--surface); }
        .erp-admin-pass-row { display:flex; flex-wrap:wrap; align-items:center; gap:8px; padding-top:10px; border-top:1px solid var(--border); }
        .erp-admin-empty { padding:1.5rem; text-align:center; color:var(--text3); font-size:11px; }
        .erp-newuser-panel { border:1px solid var(--border); border-radius:8px; }
        .erp-cred-eye { border:none; background:transparent; color:var(--text3); font-size:8px; cursor:pointer; padding:0; font-family:inherit; }
        .erp-cred-eye:hover { color:var(--accent2); }
        .erp-admin-save-btn { padding:6px 14px; font-size:10px; border-radius:6px; border:1px solid var(--border); background:var(--surface2); color:var(--text); cursor:pointer; font-family:inherit; font-weight:600; }
        .erp-admin-save-btn:hover { border-color:var(--accent2); color:var(--accent2); }
        .erp-admin-del-btn { padding:6px 14px; font-size:10px; border-radius:6px; border:1px solid rgba(248,113,113,0.35); background:transparent; color:#f87171; cursor:pointer; font-family:inherit; font-weight:600; }
        .erp-admin-del-btn:hover { border-color:#f87171; background:rgba(248,113,113,0.08); }
        .erp-admin-del-btn:disabled { opacity:.4; cursor:not-allowed; }
        .erp-admin-head-actions { display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:flex-end; }
        .erp-admin-delete-overlay { position:fixed; inset:0; z-index:100020; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; padding:16px; }
        .erp-admin-delete-dialog { width:100%; max-width:360px; background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:18px 20px; box-shadow:0 16px 40px rgba(0,0,0,.35); }
        .erp-admin-delete-title { font-size:13px; font-weight:700; color:var(--text); margin-bottom:8px; }
        .erp-admin-delete-msg { font-size:11px; color:var(--text2); line-height:1.5; margin:0 0 16px; }
        .erp-admin-delete-msg strong { color:var(--text); font-weight:600; }
        .erp-admin-delete-warn { display:block; margin-top:8px; font-size:10px; color:#f87171; }
        .erp-admin-delete-actions { display:flex; justify-content:flex-end; gap:8px; }
        .erp-admin-head-title { font-size:12px; font-weight:600; color:var(--text); }
        .erp-admin-head-sub { font-size:9px; color:var(--text3); margin-top:2px; }
    </style>`;
}

function erpAdminPaintFromCache(saveV2Ready) {
    const list = document.getElementById('main-list');
    if (!list) return;
    window.__erpAdminSaveV2Ready = saveV2Ready;
    const users = erpAdminUsersCache || [];
    const q = erpAdminUi.search.trim().toLocaleLowerCase('tr-TR');
    const filtered = q
        ? users.filter(u => {
            const blob = [u.username, u.display_name, u.role].join(' ').toLocaleLowerCase('tr-TR');
            return blob.includes(q);
        })
        : users;

    if (!erpAdminUi.selected || !users.some(u => u.username === erpAdminUi.selected)) {
        erpAdminUi.selected = filtered[0]?.username || users[0]?.username || '';
    }
    if (erpAdminUi.selected && filtered.length && !filtered.some(u => u.username === erpAdminUi.selected)) {
        erpAdminUi.selected = filtered[0]?.username || '';
    }

    const selected = users.find(u => u.username === erpAdminUi.selected) || null;

    const listHtml = filtered.length
        ? filtered.map(u => {
            const un = u.username || '';
            const isSel = un === erpAdminUi.selected;
            const roleLbl = u.role === 'admin' ? 'Yönetici' : 'Kullanıcı';
            const sub = u.display_name && u.display_name !== un ? u.display_name : (u.active === false ? 'Pasif' : roleLbl);
            return `<button type="button" class="erp-admin-list-item${isSel ? ' erp-admin-list-item--active' : ''}" onclick="erpAdminSelectUser('${erpAttr(un)}')">
                <span class="erp-admin-list-name">${erpEscapeHtml(un)}</span>
                <span class="erp-admin-list-sub">${erpEscapeHtml(sub)}</span>
            </button>`;
        }).join('')
        : '<div class="erp-admin-empty">Kullanıcı bulunamadı</div>';

    let detailHtml = '<div class="erp-admin-empty">Soldan bir kullanıcı seçin</div>';
    if (selected) {
        const un = selected.username || '';
        const isSelf = un === erpCurrentUser?.username;
        const modes = erpNormalizeAllowedModes(selected.allowed_modes);
        const curPw = erpAdminGetPassword(selected);
        const pwShow = false;
        const permsHtml = selected.role === 'admin'
            ? '<div class="erp-admin-cred-val erp-admin-cred-val--muted" style="padding:8px 0">Yönetici — tüm modlar</div>'
            : `<div class="erp-perm-toolbar">
                <span class="erp-perm-toolbar-title">Yetkiler</span>
                <span style="display:flex;gap:4px">
                    <select class="erp-perm-grp-btn" onchange="erpAdminSablon(this,'.erp-user-card','erp-mchk')">
                        <option value="">Hazır rol…</option>
                        ${ERP_PERM_SABLONLAR.map(s => `<option value="${erpAttr(s.id)}">${erpEscapeHtml(s.ad)}</option>`).join('')}
                    </select>
                    <button type="button" class="erp-perm-grp-btn" onclick="erpAdminPermSelectAll(this.closest('.erp-user-card'),'erp-mchk',true)">Tümü</button>
                    <button type="button" class="erp-perm-grp-btn" onclick="erpAdminPermSelectAll(this.closest('.erp-user-card'),'erp-mchk',false)">Temizle</button>
                </span>
            </div>
            <div class="erp-perm-groups">${erpAdminPermGroupsHtml(modes, 'erp-mchk')}</div>`;

        detailHtml = `
        <div class="panel-box erp-user-card" style="padding:0;overflow:hidden;border-radius:8px" data-user="${erpAttr(un)}" data-role="${erpAttr(selected.role)}">
            <div class="erp-admin-detail-head">
                <div>
                    <div class="erp-admin-head-title">${erpEscapeHtml(selected.display_name || un)}</div>
                    <div class="erp-admin-head-sub">${selected.active === false ? 'Pasif' : 'Aktif'}${isSelf ? ' · siz' : ''}</div>
                </div>
                <div class="erp-admin-head-actions">
                    <button type="button" class="erp-admin-save-btn" onclick="erpAdminSaveCard(this)">Kaydet</button>
                    ${isSelf ? '' : `<button type="button" class="erp-admin-del-btn" onclick="erpAdminDeleteUser(this)">Sil</button>`}
                    <span class="erp-admin-card-status" style="font-size:8px;color:var(--text3);min-height:12px;width:100%;text-align:right"></span>
                </div>
            </div>
            <div class="erp-admin-detail-body">
                <div class="erp-admin-cred-row">
                    <div class="erp-admin-field" style="margin:0">
                        <label>Kullanıcı adı</label>
                        <div class="erp-admin-cred-val">${erpEscapeHtml(un)}</div>
                    </div>
                    <div class="erp-admin-field" style="margin:0">
                        <label>Şifre</label>
                        <div class="erp-admin-cred-val" style="display:flex;align-items:center;gap:8px">
                            ${curPw
                                ? `<span class="erp-cred-mask" style="display:${pwShow ? 'none' : ''}">••••••••</span>
                                   <span class="erp-cred-plain" style="display:${pwShow ? '' : 'none'}">${erpEscapeHtml(curPw)}</span>
                                   <button type="button" class="erp-cred-eye" onclick="erpAdminToggleCredEye(this)">${pwShow ? 'Gizle' : 'Göster'}</button>`
                                : '<span class="erp-admin-cred-val--muted">Kayıtlı değil</span>'}
                        </div>
                    </div>
                </div>
                <div class="erp-admin-fields">
                    <div class="erp-admin-field">
                        <label>Görünen ad</label>
                        <input class="pro-input erp-disp" type="text" value="${erpAttr(selected.display_name || '')}" style="width:100%;padding:5px 8px;font-size:11px;border-radius:6px">
                    </div>
                    <div class="erp-admin-field">
                        <label>Rol</label>
                        ${isSelf
                            ? '<div class="erp-admin-cred-val" style="padding:5px 0">Yönetici</div>'
                            : `<select class="pro-input erp-role" style="width:100%;padding:5px 8px;font-size:11px;border-radius:6px" onchange="erpAdminPaintFromCache(window.__erpAdminSaveV2Ready)">
                                <option value="user" ${selected.role === 'user' ? 'selected' : ''}>Kullanıcı</option>
                                <option value="admin" ${selected.role === 'admin' ? 'selected' : ''}>Yönetici</option>
                               </select>`}
                    </div>
                    ${selected.role === 'admin' ? '' : `<div class="erp-admin-field" style="display:flex;align-items:flex-end">
                        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin:0;padding:5px 0;font-size:9px;text-transform:none;letter-spacing:0">
                            <input type="checkbox" class="erp-active" ${selected.active !== false ? 'checked' : ''} ${isSelf ? 'disabled' : ''}>
                            <span style="color:var(--text2)">Hesap aktif</span>
                        </label>
                    </div>`}
                </div>
                ${permsHtml}
                <div class="erp-admin-pass-row">
                    <span style="font-size:8px;color:var(--text3)">Yeni şifre</span>
                    <input class="pro-input erp-newpass" type="text" autocomplete="new-password" placeholder="En az 8 karakter" style="flex:1;min-width:120px;max-width:200px;padding:5px 8px;font-size:11px;border-radius:6px">
                    <button type="button" onclick="erpAdminPassword(this)" class="erp-perm-grp-btn" style="font-size:9px">Uygula</button>
                </div>
            </div>
        </div>`;
    }

    const newUserHtml = erpAdminUi.showNew ? `
    <div class="panel-box erp-newuser-card erp-newuser-panel" style="padding:12px 14px;border-radius:8px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div class="erp-admin-head-title" style="font-size:11px">Yeni kullanıcı</div>
            <button type="button" class="erp-perm-grp-btn" onclick="erpAdminToggleNewUser(false)">Kapat</button>
        </div>
        <div class="erp-admin-fields">
            <div class="erp-admin-field"><label>Kullanıcı adı</label><input class="pro-input erp-nu-user" type="text" autocomplete="off" style="width:100%;padding:5px 8px;font-size:11px;border-radius:6px"></div>
            <div class="erp-admin-field"><label>Şifre</label><input class="pro-input erp-nu-pass" type="text" autocomplete="new-password" style="width:100%;padding:5px 8px;font-size:11px;border-radius:6px"></div>
            <div class="erp-admin-field"><label>Görünen ad</label><input class="pro-input erp-nu-disp" type="text" style="width:100%;padding:5px 8px;font-size:11px;border-radius:6px"></div>
            <div class="erp-admin-field"><label>Rol</label>
                <select class="pro-input erp-nu-role" onchange="erpAdminNuRoleChanged(this)" style="width:100%;padding:5px 8px;font-size:11px;border-radius:6px">
                    <option value="user">Kullanıcı</option>
                    <option value="admin">Yönetici</option>
                </select>
            </div>
        </div>
        <div class="erp-nu-perms" style="margin-top:10px">
            <div class="erp-perm-toolbar" style="margin-bottom:6px">
                <span class="erp-perm-toolbar-title">Başlangıç yetkileri</span>
                <span style="display:flex;gap:4px">
                    <select class="erp-perm-grp-btn" onchange="erpAdminSablon(this,'.erp-newuser-card','erp-nuchk')">
                        <option value="">Hazır rol…</option>
                        ${ERP_PERM_SABLONLAR.map(s => `<option value="${erpAttr(s.id)}">${erpEscapeHtml(s.ad)}</option>`).join('')}
                    </select>
                    <button type="button" class="erp-perm-grp-btn" onclick="erpAdminPermSelectAll(this.closest('.erp-newuser-card'),'erp-nuchk',true)">Tümü</button>
                    <button type="button" class="erp-perm-grp-btn" onclick="erpAdminPermSelectAll(this.closest('.erp-newuser-card'),'erp-nuchk',false)">Temizle</button>
                </span>
            </div>
            <div class="erp-perm-groups">${erpAdminPermGroupsHtml([], 'erp-nuchk')}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:12px">
            <button type="button" class="erp-admin-save-btn" onclick="erpAdminCreateUser(this)">Oluştur</button>
            <span class="erp-nu-status" style="font-size:9px;color:var(--text3)"></span>
        </div>
    </div>` : '';

    list.innerHTML = `
    ${erpAdminStylesHtml()}
    <div class="erp-admin-wrap">
        ${erpAdminAuthFixBannerHtml(saveV2Ready)}
        <div class="panel-box erp-admin-toolbar" style="border-radius:8px">
            <div style="flex:1;min-width:0">
                <div class="erp-admin-head-title">Kullanıcılar</div>
                <div class="erp-admin-head-sub">${users.length} hesap</div>
            </div>
            <input class="pro-input erp-admin-search" type="search" placeholder="Ara…" value="${erpAttr(erpAdminUi.search)}"
                oninput="erpAdminSetSearch(this.value)" style="padding:5px 8px;font-size:11px;border-radius:6px">
            <button type="button" class="erp-admin-save-btn" onclick="erpAdminToggleNewUser()">${erpAdminUi.showNew ? 'İptal' : 'Yeni'}</button>
        </div>
        ${newUserHtml}
        <div class="erp-admin-layout">
            <div class="panel-box" style="padding:0;overflow:hidden;border-radius:8px">
                <div class="erp-admin-list">${listHtml}</div>
            </div>
            <div>${detailHtml}</div>
        </div>
    </div>`;
}

/**
 * Bir modun verilen yetki listesiyle açılıp açılmadığını söyler.
 * ANA PROGRAMDAKİ AYNI İSİMLİ FONKSİYONLA BİREBİR AYNI GÖVDE OLMAK ZORUNDA
 * (src/stok/js/01-supabase-auth.js) — ayrışırsa aynı kullanıcı iki platformda
 * farklı ekranlar görür.
 */
function erpApplyNavPermissions() {
    /* Mobil kapsam kısıtı (bkz. mobilKisitEngelMetni): yasaklı girişlerin
       düğmeleri CSS ile gizlenir; yönetici ürün ağacını görür. */
    document.body.classList.add('mobil-kisit');
    document.body.classList.toggle('mobil-admin', erpIsAdmin());
    const nav = document.getElementById('main-nav');
    if (!nav) return;
    nav.querySelectorAll('.erp-nav-denied').forEach(el => el.classList.remove('erp-nav-denied'));
    document.querySelectorAll('.erp-sidebar [data-erp-mode].erp-nav-denied').forEach(el => el.classList.remove('erp-nav-denied'));

    if (!erpCurrentUser) return;

    const mark = (el, mode) => {
        if (!el || !mode) return;
        if (!erpUserCan(mode)) el.classList.add('erp-nav-denied');
    };

    mark(document.getElementById('nav-DASHBOARD'), 'DASHBOARD');

    nav.querySelectorAll('.nav-pro-sub[id^="nav-"]').forEach(el => {
        const id = el.id || '';
        if (!id.startsWith('nav-')) return;
        const m = id.slice(4);
        mark(el, m);
    });

    ['siparis', 'depo', 'kart', 'terbiye', 'dokuma', 'konfeksiyon', 'fason', 'planlama', 'yonetim'].forEach(prefix => {
        const area = document.getElementById('sub-' + prefix);
        const toggle = document.getElementById('nav-' + prefix + '-toggle');
        if (!area || !toggle) return;
        const subs = Array.from(area.querySelectorAll(':scope > .nav-pro-sub'));
        const anyVis = subs.some(s => !s.classList.contains('erp-nav-denied'));
        if (!anyVis) {
            area.classList.add('erp-nav-denied');
            toggle.classList.add('erp-nav-denied');
        }
    });

    document.querySelectorAll('.erp-sidebar [data-erp-mode]').forEach(btn => {
        const m = btn.getAttribute('data-erp-mode');
        mark(btn, m);
    });
}

// --- GLOBAL DEĞİŞKENLER ---
/** Sipariş no için parçalama/sıralama yardımcıları */
/** Liste satırı için kısa ürün özeti (ad / kod) */
/** Siparis termin uyarilari — yalnizca ttarih alani */
const GOREV_ASAMA_MAP = {
    boyahane_iplik: { unit: 'BOYAHANE', asamaId: 'bobin_boya', label: 'Boyahane — iplik' },
    boyahane_top: { unit: 'BOYAHANE', asamaId: 'top_boya', label: 'Boyahane — top boya' },
    dokuma: { unit: 'DOKUMA', asamaId: 'dokuma', label: 'Dokuma' },
};

function siparisTerminGunOzetKisa(gun, durum) {
    if (durum === 'yok' || gun == null) return '—';
    if (durum === 'gecikti') return Math.abs(gun) + ' gün gecikme';
    if (durum === 'bugun') return 'Bugün';
    return gun + ' gün kaldı';
}

function siparisTerminBadgeHtml(u) {
    const txt = siparisTerminGunOzetKisa(u.gun, u.durum);
    const cls = u.durum === 'gecikti' ? 'pill-red' : (u.durum === 'yakin' || u.durum === 'bugun') ? 'pill-amber' : 'pill-gray';
    return `<span class="pill ${cls}" style="font-size:8px;white-space:nowrap" title="${pdfEsc(u.label || u.short || 'Termin')}">${pdfEsc(u.short || 'Termin')}: ${txt}</span>`;
}

function siparisTerminListeHtml(siparis) {
    const tt = String(siparis?.ttarih || '').trim().slice(0, 10);
    if (!tt) return '—';
    const gun = siparisTerminGunHesap(tt);
    const durum = siparisTerminDurumFromGun(gun);
    return siparisTerminBadgeHtml({ short: 'Termin', label: 'Termin tarihi', tarih: tt, gun, durum });
}

function siparisTerminDetayHtml() { return ''; }

/**
 * Sipariş kalemi — Renk kodu metni: yalnızca girilmiş kodlar.
 * Ürün rengi (renk sütunu) ile aynı olan tekrarlar ve mükerrer kodlar yazılmaz.
 */
/** Tezgah no: 1,2,3…10,11 (metin sırası 1,10,11,2 değil) */
/** Yeni sipariş formu: TAMAMLANDI sadece siparisFormSiparisiTamamla ile; konfeksiyon durumu değiştirmez */
/* appMode: ana programın çekirdeğinden gelir (assets/erp-core.js) */
/* siparisListeKolonFiltre: ana programın çekirdeğinden gelir (assets/erp-core.js) */
function siparisGrubuBul(row) {
    const dogrudan = normSiparisGrubu(row?.siparis_grubu || '');
    if (dogrudan) return dogrudan;
    const firma = normSiparisGrubu(row?.firma || '');
    if (firma === 'GIDA' || firma === 'HALI' || firma === 'EV_TEKSTILI' || firma === 'KOLTUK_ORTUSU') return firma;
    let kalemGrup = '';
    try {
        const arr = typeof row?.cins === 'string' ? JSON.parse(row.cins) : (row?.cins || []);
        const txt = (Array.isArray(arr) ? arr : []).map(k => String(k?.grup || '')).join(' ');
        kalemGrup = normSiparisGrubu(txt);
    } catch (e) {}
    if (kalemGrup === 'GIDA' || kalemGrup === 'HALI' || kalemGrup === 'EV_TEKSTILI' || kalemGrup === 'KOLTUK_ORTUSU') return kalemGrup;
    return '';
}

/** Tek kutuya yazılan arama için sipariş metin indeksi (no, firma, özet, durum, grup, termin…) */
/** Sipariş üretim/iş sırası durumları (liste) */
let _detailOpenRecordId = null;
/* ERP_LISTE_POLL_MS: ana programın çekirdeğinden gelir (assets/erp-core.js) */
const ERP_MOBIL_LISTE_POLL_MS = 180000;
/* ERP_DATA_CACHE_MAX_AGE_MS: ana programın çekirdeğinden gelir (assets/erp-core.js) */
/** Yalnızca siparisler — fotoğraf/geçmiş hariç (otomatik yenileme için) */
const ERP_SYNC_DROPPED_LS_KEY = 'erp_sync_dropped_cols_v1';

function erpSyncDroppedCols(table) {
    const t = String(table || '').trim();
    if (!t) return new Set();
    try {
        const all = JSON.parse(localStorage.getItem(ERP_SYNC_DROPPED_LS_KEY) || '{}') || {};
        return new Set(Array.isArray(all[t]) ? all[t] : []);
    } catch (e) { return new Set(); }
}

function erpSyncDropCol(table, col) {
    const t = String(table || '').trim();
    const c = String(col || '').trim();
    if (!t || !c) return;
    if (t === 'siparisler') {
        erpSiparisSyncDropCol(c);
        return;
    }
    const s = erpSyncDroppedCols(t);
    if (s.has(c)) return;
    s.add(c);
    try {
        const all = JSON.parse(localStorage.getItem(ERP_SYNC_DROPPED_LS_KEY) || '{}') || {};
        all[t] = [...s];
        localStorage.setItem(ERP_SYNC_DROPPED_LS_KEY, JSON.stringify(all));
    } catch (e) {}
}

function erpSyncLightCols(table, override) {
    if (override) return override;
    let cols = ERP_SYNC_LIGHT_COLS[table] || '*';
    if (!cols || cols === '*') return cols;
    const dropped = erpSyncDroppedCols(table);
    if (!dropped.size) return cols;
    return cols.split(',').map(c => c.trim()).filter(c => c && !dropped.has(c)).join(',') || '*';
}

/** Otomatik senkron — büyük blob alanları hariç (foto / işlem geçmişi) */
let _erpBgSyncRunning = false;
let _siparisFotoLbItems = [];

/** Depo komuta: IPLIK | KUMAS | MAMUL_DEPO — sadece appMode === DEPO_HAREKET iken */
/** Sihirbaz: TIP = giriş/çıkış seç; GRUP = iplik/kumaş/mamül seç */
let mamulKartAramaFiltre = { q: '', firma: '', urun: '', kod: '', desen: '', kumas: '', renk: '', tezgah: '', takip: '', numune: '' };
let mamulKartListeHizliFiltre = 'HEPSI';
let mamulKartAramaDetayAcik = false;
let mamulKartAramaDebounceTimer = null;
let depoDefterStokAra = '';
let depoHizliHareketStokKodu = null;
let depoHizliHareketLotIdx = null;
let depoHizliHareketBekleyen = null;

/** Sadece görüntüleme için — TÜM [ANAHTAR:değer] etiketlerini temizler (SEVK_* dahil).
 *  Masaüstünden birebir taşındı — Sevkiyat Fişleri "Not:" alanında ham etiketler
 *  görünmesin diye. Yazma akışında kullanılmaz (depoNotlarStripBirim onun işi). */
/** Depo hareket defterinde gösterilecek satırlar */
function depoExcelKanalTahminEt(row) {
    if (!row) return 'KUMAS';
    if (row.iplik_no != null && String(row.iplik_no).trim() !== '') return 'IPLIK';
    if (kumasStokHareketiMamulDepoMu(row)) return 'MAMUL_DEPO';
    const kod = String(row.stok_kodu || '').trim().toUpperCase();
    const pref = kod.split(/[-\s]/)[0];
    if (pref === 'IP') return 'IPLIK';
    if (pref === 'MM' || pref === 'MA') return 'MAMUL_DEPO';
    return 'KUMAS';
}
function depoStokCikisGrupCoz(grup, stokKodu, kaynakBirim) {
    if (!kumasFormGrubuMu(grup) && grup !== 'KUMAS') return grup;
    const kb = String(kaynakBirim || '').toUpperCase();
    if (kb === 'DEPO_HAREKET_MAMUL_KUMAS' || kb === 'MAMUL_KUMAS') return 'MAMUL_KUMAS';
    if (kb === 'DEPO_HAREKET_HAM_KUMAS' || kb === 'HAM_KUMAS' || kb === 'DEPO_HAREKET_KUMAS' || kb === 'DOKUMA_TAKIP') return 'HAM_KUMAS';
    const kaynak = depoKumasKaynakBirimBelirle(stokKodu);
    return kaynak === 'DEPO_HAREKET_MAMUL_KUMAS' ? 'MAMUL_KUMAS' : 'HAM_KUMAS';
}
// depoMamulBakiyeHesapla: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
function depoHizliHareketBaslat(grup, tip, stokKodu, lotIdx) {
    const t = tip === 'ÇIKIŞ' ? 'ÇIKIŞ' : 'GİRİŞ';
    if (grup === 'IPLIK') {
        const kod = stokKodu ? String(stokKodu).trim() : '';
        const li = lotIdx != null ? lotIdx : -1;
        if (kod && li >= 0) {
            const ac = () => {
                const groups = window._iplikGroups || [];
                const gi = groups.findIndex(g => String(g.stok_kodu || '').trim() === kod);
                if (gi >= 0) iplikLotHareketAc(gi, li, t);
                else erpToast(`"${kod}" iplik stoğunda bulunamadı.`, 'warn', 5000);
            };
            if (appMode !== 'IPLIK') { setAppMode('IPLIK'); setTimeout(ac, 200); }
            else ac();
            return;
        }
        if (kod) {
            iplikStogaGitLotSec(kod);
            return;
        }
        if (appMode !== 'IPLIK') setAppMode('IPLIK');
        else erpToast('Depo girişi ve sevkiyat için önce listeden lot seçin.', 'info', 5000);
        return;
    }
    depoHizliHareketBekleyen = {
        grup,
        tip: t,
        stokKodu: stokKodu ? String(stokKodu).trim() : null,
        lotIdx: lotIdx != null ? lotIdx : -1,
    };
    movementType = t;
    setAppMode('DEPO_HAREKET', true);
}
function depoHizliHareketBekleyenUygula() {
    if (!depoHizliHareketBekleyen) return;
    const { grup, tip, stokKodu, lotIdx } = depoHizliHareketBekleyen;
    depoHizliHareketBekleyen = null;
    depoKomutaHedef = grup;
    depoKomutaAsama = 'TIP';
    movementType = tip;
    depoHizliHareketStokKodu = stokKodu;
    depoHizliHareketLotIdx = lotIdx != null ? lotIdx : -1;
    const fc = document.getElementById('form-container');
    if (fc) fc.style.display = 'block';
    renderInputs();
    loadData();
    if (stokKodu) setTimeout(() => depoHizliStokKoduFormaUygula(grup), 100);
}
function depoKumasHareketGrupCoz(grup) {
    if (grup === 'MAMUL_KUMAS') return 'MAMUL_KUMAS';
    if (grup === 'KUMAS' || grup === 'HAM_KUMAS') return 'HAM_KUMAS';
    return null;
}
function aktifKumasKartGirisTipi() {
    if (depoKomutaHedef === 'MAMUL_KUMAS' || appMode === 'MAMUL_KUMAS') return 'MAMUL_KUMAS';
    if (aktifKumasStokGrubu() === 'MAMUL_KUMAS') return 'MAMUL_KUMAS';
    return 'HAM_KUMAS';
}
function depoKumasStokKartiDogrula(stokKodu, grup) {
    const kod = String(stokKodu || '').trim();
    if (!kod) return 'Stok kodu zorunludur.';
    const g = depoKumasHareketGrupCoz(grup);
    if (!g) return null;
    const kart = (dataCache.kumas_kutuphanesi || []).find(k => String(k.desen_kodu || '').trim() === kod);
    if (!kart) return `"${kod}" için stok kartı yok. Önce kumaş kartı oluşturun.`;
    if (kumasKutuphanesiKartiMamulMu(kart)) return `"${kod}" mamül ürün kartı — Mamül depo kanalını kullanın.`;
    if (!kumasKutuphanesiKartiKumasDepoMu(kart)) return `"${kod}" bu kanal için geçerli kumaş kartı değil.`;
    const tip = kumasKartTipiOku(kart);
    if (g === 'HAM_KUMAS' && tip === 'MAMUL') return `"${kod}" mamül kumaş kartı — Mamül kumaş kanalını seçin.`;
    if (g === 'MAMUL_KUMAS' && tip === 'HAM') return `"${kod}" ham kumaş kartı — Ham kumaş kanalını seçin.`;
    return null;
}
function depoIplikStokKartiDogrula(stokKodu) {
    const kod = String(stokKodu || '').trim();
    if (!kod) return 'Stok kodu zorunludur.';
    const kartVar = (dataCache.iplik_stok || []).some(r => String(r.stok_kodu || '').trim() === kod && iplikKartTanimKaydiMi(r));
    if (!kartVar) return `"${kod}" için iplik stok kartı yok. Önce iplik kartı oluşturun.`;
    return null;
}
function depoKaynakBirimImportBelirle(ig, stokKodu) {
    if (ig === 'IPLIK') return 'DEPO_HAREKET_IPLIK';
    if (ig === 'MAMUL_DEPO') return 'DEPO_HAREKET_MAMUL_DEPO';
    if (ig === 'HAM_KUMAS') return 'DEPO_HAREKET_HAM_KUMAS';
    if (ig === 'MAMUL_KUMAS') return 'DEPO_HAREKET_MAMUL_KUMAS';
    if (ig === 'KUMAS' || kumasFormGrubuMu(ig)) return depoKumasKaynakBirimBelirle(stokKodu) || 'DEPO_HAREKET_HAM_KUMAS';
    return 'DEPO_HAREKET_' + ig;
}
function depoHareketKayitSonrasiTemizle(kaydedilenKod) {
    if (appMode !== 'DEPO_HAREKET' || !depoKomutaHedef || editingId) return;
    const grup = depoKomutaHedef;
    const tip = movementType;
    renderInputs();
    setTimeout(() => {
        movementType = tip;
        depoKomutaHedef = grup;
        depoKomutaAsama = 'TIP';
        if (kumasFormGrubuMu(grup)) kumasClearSelection();
        else if (grup === 'MAMUL_DEPO') mamulClearSelection();
        else if (grup === 'IPLIK') iplikClearSelection();
        depoMiktarBirimDegisti();
        syncDepoKomutaChrome();
        syncDepoHareketSecimStili();
        applyDepoFormLayout();
        loadData();
        const lbl = kaydedilenKod ? ` (${kaydedilenKod})` : '';
        const extra = (kumasFormGrubuMu(grup) && tip === 'ÇIKIŞ')
            ? ' Muhasebe fişleri ve çeki listesi Depo Stok menüsünden açılır.'
            : '';
        erpToast(`Hareket kaydedildi${lbl}.${extra}`, 'success', 4500);
        if (typeof kumasCekiFormSifirla === 'function') kumasCekiFormSifirla();
    }, 60);
}
function depoHizliStokKoduFormaUygula(grup) {
    const kod = depoHizliHareketStokKodu;
    if (!kod) return;
    const lotIdx = depoHizliHareketLotIdx;
    depoHizliHareketStokKodu = null;
    depoHizliHareketLotIdx = null;
    if (grup === 'MAMUL_DEPO') mamulSelectByKod(kod);
    else if (grup === 'IPLIK') iplikSelectByKod(kod, lotIdx);
    else if (kumasFormGrubuMu(grup)) kumasSelectByKod(kod, grup);
}
function iplikSelectByKod(kod, lotIdx) {
    const k = String(kod || '').trim();
    if (!k) return;
    const groups = iplikStokGruplariHesapla(dataCache.iplik_stok || []);
    const gi = groups.findIndex(g => String(g.stok_kodu || '').trim() === k);
    if (gi < 0) {
        const kartHata = depoIplikStokKartiDogrula(k);
        erpToast(kartHata || `"${k}" için iplik kartı bulunamadı.`, 'error', 5000);
        return;
    }
    const g = groups[gi];
    let x = {
        stok_kodu: g.stok_kodu,
        iplik_no: iplikGrupListeIplikNoMetin(g),
        lot_no: '',
        marka: g.marka,
        cins: g.cins,
        bakiye: g.total_kg || 0,
        kalite: g.kalite || '1. KALİTE'
    };
    if (lotIdx >= 0 && g.lots && g.lots[lotIdx]) {
        const lot = g.lots[lotIdx];
        x = {
            stok_kodu: g.stok_kodu,
            iplik_no: lot.iplik_no || x.iplik_no,
            lot_no: lot.lot_no || '',
            marka: lot.marka || g.marka,
            cins: lot.cins || g.cins,
            bakiye: lot.bakiye_kg || 0,
            kalite: g.kalite || '1. KALİTE'
        };
    }
    iplikFormaDoldur(x);
}
function mamulSelectByKod(kod) {
    const k = String(kod || '').trim();
    if (!k) return;
    if (typeof mamulDepoGirisMod !== 'undefined' && mamulDepoGirisMod === 'TOPLU' && typeof mamulTopluKodSatiraYaz === 'function') {
        if (mamulTopluKodSatiraYaz(k, 0)) return;
    }
    const kartlar = (dataCache.kumas_kutuphanesi || []).filter(kumasKutuphanesiKartiMamulMu);
    const idx = kartlar.findIndex(x =>
        String(x.desen_kodu || '').trim() === k || String(x.stok_kodu || '').trim() === k
    );
    if (idx >= 0) {
        window._mamulSearchData = kartlar;
        mamulSelectItem({ getAttribute: () => String(idx) });
        return;
    }
    const kartHata = depoMamulStokKartiDogrula(k);
    erpToast(kartHata || `"${k}" için mamül kartı bulunamadı.`, 'error', 5000);
}
function depoDefterStokKoduFiltrele(kod) {
    depoDefterStokAra = String(kod || '').trim().toUpperCase();
    const search = document.getElementById('search');
    if (search) search.value = String(kod || '').trim();
    if (appMode !== 'DEPO_HAREKET_LISTE') setAppMode('DEPO_HAREKET_LISTE');
    else loadData();
}
function depoDefterStokAraUygula(val) {
    depoDefterStokAra = String(val || '').trim().toUpperCase();
    debounce('depoDefterStokAra', () => loadData(), 250);
}
function depoDefterKanalFiltreUygunMu(fGrup, ch, row) {
    if (fGrup === 'HEPSİ') return true;
    if (fGrup === 'STOK_EXCEL_IMPORT') return String(row?.kaynak_birim || '').toUpperCase() === 'STOK_EXCEL_IMPORT';
    if (fGrup === 'KUMAS') return ['HAM_KUMAS', 'MAMUL_KUMAS', 'KUMAS'].includes(ch.kod);
    return ch.kod === fGrup;
}
/** Depo hareket düzenleme: kayıt verisini forma (liste ile aynı alanlar) yükler */
function depoHareketKayitFormDoldur(i) {
    if (!i || appMode !== 'DEPO_HAREKET' || !depoKomutaHedef) return;
    const tipNorm = String(i.islem_turu || '').toUpperCase();
    const isCikis = tipNorm === 'ÇIKIŞ' || tipNorm === 'CIKIS';
    if (i.islem_turu) movementType = isCikis ? 'ÇIKIŞ' : 'GİRİŞ';

    if (depoKomutaHedef === 'IPLIK') {
        const birim = depoBirimFromNotlar(i.notlar);
        const sel = document.getElementById('val-miktar-birim');
        if (sel) sel.value = birim;
        depoMiktarBirimDegisti();
        const absKg = Math.abs(parseFloat(i.miktar_kg) || 0);
        const absMt = Math.abs(parseFloat(i.miktar_mt) || 0);
        const cv = parseInt(i.cuval_sayisi, 10) || 0;
        const kgEl = document.getElementById('val-kg');
        if (kgEl) {
            if (birim === 'MT') kgEl.value = absMt || absKg;
            else if (birim === 'AD') kgEl.value = cv || absKg;
            else kgEl.value = absKg;
        }
        const notEl = document.getElementById('val-notlar');
        if (notEl) notEl.value = depoNotlarStripBirim(i.notlar || '');
        const cuvalEl = document.getElementById('val-cuval');
        if (cuvalEl) cuvalEl.value = birim === 'AD' ? '' : (i.cuval_sayisi ?? '');
        const kalEl = document.getElementById('val-kalite');
        if (kalEl) kalEl.value = i.kalite || '1. KALİTE';
        const irsEl = document.getElementById('val-irs');
        if (irsEl) irsEl.value = i.irsaliye_no || '';
        const cuvalRenkEl = document.getElementById('val-cuval-rengi');
        if (cuvalRenkEl) cuvalRenkEl.value = i.cuval_rengi || '';
        iplikFormaDoldur({
            stok_kodu: i.stok_kodu,
            iplik_no: i.iplik_no,
            lot_no: i.lot_no || i.parti_no,
            marka: i.marka,
            cins: i.cins,
            kalite: i.kalite || '1. KALİTE',
            bakiye: absKg
        });
        if (isCikis) {
            let sevkYer = iplikCikisYeriNorm(depoHareketNotEtiketOku(i.notlar, 'SEVK_YER'));
            if (!sevkYer) {
                const firmaU = String(i.firma || '').trim().toLocaleUpperCase('tr-TR');
                if (firmaU === 'SİMTEKS DOKUMA') sevkYer = 'SİMTEKS DOKUMA';
                else if (typeof IPLIK_CIKIS_SECENEKLER !== 'undefined') {
                    sevkYer = IPLIK_CIKIS_SECENEKLER.find(v => v.toLocaleUpperCase('tr-TR') === firmaU)
                        || (firmaU ? 'FASON DOKUMA' : 'SİMTEKS DOKUMA');
                } else sevkYer = 'SİMTEKS DOKUMA';
            }
            const cy = document.getElementById('val-cikis-yeri');
            if (cy) { cy.value = sevkYer; checkIplikExit(cy); }
            const afEl = document.getElementById('val-afirma');
            if (afEl && sevkYer !== 'SİMTEKS DOKUMA') afEl.value = i.firma || i.araci_firma || '';
        } else {
            const afEl = document.getElementById('val-afirma');
            if (afEl) afEl.value = i.firma || i.araci_firma || i.tedarikci || '';
        }
        updateIplikPreview();
    } else if (kumasFormGrubuMu(depoKomutaHedef)) {
        const birim = depoBirimFromNotlar(i.notlar);
        const sel = document.getElementById('val-miktar-birim');
        if (sel) sel.value = birim;
        depoMiktarBirimDegisti();
        const absKg = Math.abs(parseFloat(i.miktar_kg) || 0);
        const absMt = Math.abs(parseFloat(i.miktar_mt) || 0);
        const cv = parseInt(i.cuval_sayisi, 10) || 0;
        const kgEl = document.getElementById('val-kg');
        if (kgEl) {
            if (birim === 'MT') kgEl.value = absMt;
            else if (birim === 'AD') kgEl.value = cv;
            else kgEl.value = absKg;
        }
        const mtEl = document.getElementById('val-mt');
        if (mtEl) mtEl.value = birim === 'KG' ? absMt : '';
        const kalEl = document.getElementById('val-kalite');
        if (kalEl) kalEl.value = kumasNotlarTemizle(depoNotlarStripBirim(i.notlar || ''));
        const cuvalEl = document.getElementById('val-cuval-kumas');
        if (cuvalEl) cuvalEl.value = birim === 'AD' ? '' : (i.cuval_sayisi ?? '');
        const fill = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
        fill('val-stok-kodu', i.stok_kodu);
        fill('val-cins', i.kumas_cinsi);
        fill('val-lot', i.lot_no);
        fill('val-marka', i.marka);
        fill('val-renk', i.renk);
        fill('val-firma-hidden', i.firma);
        fill('val-irs', i.irsaliye_no);
        fill('val-araci-firma', i.araci_firma);
        fill('val-cuval-rengi', i.cuval_rengi);
        fill('val-firma-detay', i.firma);
        const kInp = document.getElementById('val-kumas-search');
        if (kInp) kInp.value = i.stok_kodu || '';
        const kCard = document.getElementById('kumas-selected-card');
        if (kCard && i.stok_kodu) {
            kCard.style.display = 'block';
            const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || '—'; };
            set('ksel-kod', i.stok_kodu);
            set('ksel-cins', i.kumas_cinsi);
            set('ksel-lot', i.lot_no);
            set('ksel-bakiye', absKg.toFixed(2) + ' kg');
        }
        if (isCikis) {
            const firmaU = String(i.firma || '').trim().toLocaleUpperCase('tr-TR');
            const cy = document.getElementById('val-cikis-yeri');
            if (cy) {
                cy.value = firmaU === 'SİMTEKS KONFEKSİYON' ? 'SİMTEKS KONFEKSİYON' : (firmaU ? 'DİĞER' : 'SİMTEKS KONFEKSİYON');
                checkKumasExit(cy);
            }
        }
        updateKumasPreview();
    } else if (depoKomutaHedef === 'MAMUL_DEPO') {
        const birim = depoBirimFromNotlar(i.notlar);
        const sel = document.getElementById('val-miktar-birim');
        if (sel) sel.value = birim;
        depoMiktarBirimDegisti();
        const absKg = Math.abs(parseFloat(i.miktar_kg) || 0);
        const absMt = Math.abs(parseFloat(i.miktar_mt) || 0);
        const cv = parseInt(i.cuval_sayisi, 10) || 0;
        const kgEl = document.getElementById('val-kg');
        if (kgEl) {
            if (birim === 'MT') kgEl.value = absMt;
            else if (birim === 'AD') kgEl.value = cv;
            else kgEl.value = absKg;
        }
        const notEl = document.getElementById('val-notlar');
        if (notEl) notEl.value = depoNotlarStripBirim(i.notlar || '');
        const cuvalEl = document.getElementById('val-cuval');
        if (cuvalEl) cuvalEl.value = birim === 'AD' ? '' : (i.cuval_sayisi ?? '');
        const kod = i.stok_kodu || '';
        const kart = (dataCache.kumas_kutuphanesi || []).find(x => x.desen_kodu === kod) || {};
        const mamulInp = document.getElementById('val-mamul-search');
        if (mamulInp) mamulInp.value = kod + (kart.urun_adi ? '  —  ' + kart.urun_adi : '');
        const kodEl = document.getElementById('val-stok-kodu-mamul');
        if (kodEl) kodEl.value = kod;
        const irsEl = document.getElementById('val-irs');
        if (irsEl) irsEl.value = i.irsaliye_no || '';
        const afEl = document.getElementById('val-afirma');
        if (afEl) afEl.value = i.firma || '';
        const araciEl = document.getElementById('val-araci-firma');
        if (araciEl) araciEl.value = i.araci_firma || '';
        const cuvalRenkEl = document.getElementById('val-cuval-rengi');
        if (cuvalRenkEl) cuvalRenkEl.value = i.cuval_rengi || '';
        const mCard = document.getElementById('mamul-selected-card');
        if (mCard && kod) {
            mCard.style.display = 'block';
            const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || '—'; };
            set('msel-kod', kod);
            set('msel-ad', kart.urun_adi || kart.desen_adi);
            set('msel-cins', kart.kumas_cinsi || i.kumas_cinsi);
            set('msel-lot', kart.firma || i.marka);
        }
        updateMamulPreview();
    }
    syncDepoKomutaChrome();
    applyDepoFormLayout();
    if (isDepoHareketModu()) syncDepoHareketSecimStili();
}
function depoDefterSatirDuzenle(tbl, id) {
    const i = (dataCache[tbl] || []).find(r => String(r.id) === String(id));
    if (!i) { erpToast('Kayıt bulunamadı.', 'error'); return; }
    const kb = String(i.kaynak_birim || '').toUpperCase();
    if (kb === 'DOKUMA_TAKIP') {
        erpToast('Dokuma kaynaklı girişler buradan düzenlenemez; Dokuma Takip modülünü kullanın.', 'warn', 5000);
        return;
    }
    let hedef = null;
    if (kb === 'DEPO_HAREKET_IPLIK') hedef = 'IPLIK';
    else if (kb === 'DEPO_HAREKET_MAMUL_DEPO') hedef = 'MAMUL_DEPO';
    else if (kb === 'DEPO_HAREKET_HAM_KUMAS') hedef = 'HAM_KUMAS';
    else if (kb === 'DEPO_HAREKET_MAMUL_KUMAS') hedef = 'MAMUL_KUMAS';
    else if (kb === 'DEPO_HAREKET_KUMAS') hedef = 'HAM_KUMAS';
    else if (kb === 'STOK_EXCEL_IMPORT') hedef = depoExcelKanalTahminEt(i);
    if (!hedef) { erpToast('Bu kayıt türü düzenlenemiyor.', 'warn'); return; }
    const tip = String(i.islem_turu || '').toUpperCase();
    depoKomutaHedef = hedef;
    depoKomutaAsama = 'GRUP';
    movementType = (tip === 'ÇIKIŞ' || tip === 'CIKIS') ? 'ÇIKIŞ' : 'GİRİŞ';
    editingId = i.id;
    originalRecordSnapshot = { ...i };
    window._depoDefterEditReturn = true;
    setAppMode('DEPO_HAREKET', true);
    document.getElementById('form-container').style.display = 'block';
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) {
        cancelBtn.style.display = 'block';
        cancelBtn.onclick = () => {
            editingId = null;
            originalRecordSnapshot = null;
            depoKomutaHedef = null;
            window._depoDefterEditReturn = false;
            setAppMode('DEPO_HAREKET_LISTE');
        };
    }
    const ft = document.getElementById('form-title');
    if (ft) ft.innerText = 'Kayıt Güncelleme';
    renderInputs();
    loadData();
    setTimeout(() => {
        depoHareketKayitFormDoldur(i);
        try {
            document.getElementById('form-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {}
    }, 80);
}
async function depoDefterSatirSil(tbl, id) {
    const row = (dataCache[tbl] || []).find(r => String(r.id) === String(id));
    if (!row) { erpToast('Kayıt bulunamadı.', 'error'); return; }
    const kb = String(row.kaynak_birim || '').toUpperCase();
    if (kb === 'DOKUMA_TAKIP') {
        erpToast('Dokuma kaynaklı girişler buradan silinemez; Dokuma Takip modülünü kullanın.', 'warn', 5000);
        return;
    }
    const label = row.stok_kodu || row.iplik_no || id;
    if (!confirm(`"${label}" hareket kaydı kalıcı olarak silinsin mi?\nStok bakiyesi etkilenir.`)) return;
    const { error } = await sb.from(tbl).delete().eq('id', id);
    if (error) { erpToast('Silme başarısız: ' + error.message, 'error'); return; }
    closeModal({ target: { id: 'detail-modal' } });
    try {
        if (Array.isArray(dataCache[tbl])) dataCache[tbl] = dataCache[tbl].filter(r => String(r.id) !== String(id));
    } catch (e) {}
    erpSyncTablesBackground([tbl]);
    erpToast('Hareket kaydı silindi.', 'success');
    loadData();
}
function depoDefterSatirDetay(tbl, id) {
    const row = (dataCache[tbl] || []).find(r => String(r.id) === String(id));
    if (!row) { erpToast('Kayıt bulunamadı.', 'error'); return; }
    const ch = depoKomutaKanalFromKaynak(row.kaynak_birim, row);
    const tip = String(row.islem_turu || '').trim();
    const tipCls = tip === 'GİRİŞ' ? 'pill-green' : (tip === 'ÇIKIŞ' ? 'pill-red' : 'pill-gray');
    const kb = String(row.kaynak_birim || '').toUpperCase();
    const duzenlenebilir = kb !== 'DOKUMA_TAKIP';
    const silinebilir = duzenlenebilir;
    const islemYapan = depoHareketIslemYapan(row);
    const iplik = depoHareketIplikSatirMi(row);
    const notlar = depoNotlarStripBirim(row.notlar || '');
    const hareketTarih = iplikHareketTarihiOku(row);
    const firmaStr = [row.firma, row.araci_firma].filter(x => x && String(x).trim()).join(' · ') || '—';
    const modal = document.getElementById('detail-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    if (!modal || !title || !body) return;
    title.innerText = `${tip || 'Hareket'} · ${row.stok_kodu || '—'}`;
    body.className = 'modal-body-scroll';
    body.style.cssText = '';
    const hucre = (label, val, opts) => {
        opts = opts || {};
        const raw = opts.html != null ? String(opts.html) : '';
        const metin = raw || (val == null || String(val).trim() === '' ? '' : String(val));
        if (!metin) return '';
        return `<div style="padding:10px 12px;border-radius:9px;border:1px solid var(--border);background:var(--surface2)">
            <div style="font-size:8px;font-weight:600;color:var(--text3);text-transform:uppercase;font-family:'DM Mono',monospace;margin-bottom:4px">${pdfEsc(label)}</div>
            <div style="font-size:12px;font-weight:500;color:var(--text);word-break:break-word">${raw || pdfEsc(metin)}</div>
        </div>`;
    };
    const alanlar = [
        hucre('Tarih', depoHareketDefterTarihGoster(row)),
        hucre('İşlem', null, { html: `<span class="pill ${tipCls}" style="font-size:9px">${pdfEsc(tip || '—')}</span>` }),
        hucre('Kanal', ch.etiket),
        hucre('Stok kodu', row.stok_kodu),
        hucre('Tanım', depoHareketDefterTanim(row)),
        hucre('Miktar', depoHareketDefterMiktarStr(row)),
        hucre('İşlem yapan', islemYapan),
        row.lot_no ? hucre('Lot no', row.lot_no) : '',
        row.iplik_no ? hucre('İplik no', row.iplik_no) : '',
        row.marka ? hucre('Marka', row.marka) : '',
        row.cins ? hucre('Cins', row.cins) : '',
        row.renk ? hucre('Renk', row.renk) : '',
        iplik && row.cuval_rengi ? hucre('Çuval rengi', null, { html: iplikCuvalRenkBadgeHtml(row.cuval_rengi) }) : '',
        row.irsaliye_no ? hucre('İrsaliye', row.irsaliye_no) : '',
        firmaStr !== '—' ? hucre('Firma / araç', firmaStr) : '',
        hareketTarih ? hucre('Hareket tarihi', iplikTarihTr(hareketTarih)) : '',
        row.kaynak_birim ? hucre('Kaynak', row.kaynak_birim) : '',
        hucre('Gittiği yer / Firma', depoHareketDefterNotMetin(row))
    ].filter(Boolean).join('');
    body.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
            ${duzenlenebilir ? `<button type="button" onclick="closeModal({target:{id:'detail-modal'}});depoDefterSatirDuzenle('${tbl}','${id}')" class="pill pill-blue" style="cursor:pointer;border:none;padding:6px 12px">✏️ Düzenle</button>` : ''}
            ${silinebilir ? `<button type="button" onclick="depoDefterSatirSil('${tbl}','${id}')" class="pill pill-red" style="cursor:pointer;border:none;padding:6px 12px">🗑 Sil</button>` : ''}
            <button type="button" onclick="closeModal({target:{id:'detail-modal'}});depoDefterStokKoduFiltrele('${erpAttr(row.stok_kodu || '')}')" class="pill pill-gray" style="cursor:pointer;border:none;padding:6px 12px">📋 Bu stok kodu</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-bottom:14px">${alanlar}</div>
        ${renderKayitGecmisDetailsBlock(row.islem_gecmisi, 'depo-detay', { footer: true })}`;
    const editBtn = document.getElementById('modal-edit-btn');
    const delBtn = document.getElementById('modal-delete-btn');
    if (editBtn) {
        editBtn.style.display = duzenlenebilir ? '' : 'none';
        editBtn.onclick = () => { closeModal({ target: { id: 'detail-modal' } }); depoDefterSatirDuzenle(tbl, id); };
    }
    if (delBtn) {
        delBtn.style.display = silinebilir ? '' : 'none';
        delBtn.onclick = () => depoDefterSatirSil(tbl, id);
    }
    modal.style.display = 'flex';
}
function depoSevkeHazirSayaçOzet(rows) {
    const all = rows || dataCache.kumas_stok || [];
    const dokumaGirisToplam = all.filter(r => String(r?.kaynak_birim || '').toUpperCase() === 'DOKUMA_TAKIP').length;
    const sevkSet = depoDokumaSevkEdilmisKaynakIdSet(all);
    const bekleyen = all.filter(r => depoDokumaSevkeHazirMi(r) && !sevkSet.has(String(r.id))).length;
    return { dokumaGirisToplam, sevkEdilen: sevkSet.size, bekleyen };
}
function depoHareketIplikSatirMi(row) {
    if (row._tbl === 'iplik_stok') return true;
    if (row.iplik_no != null && String(row.iplik_no).trim() !== '') return true;
    const kb = String(row.kaynak_birim || '').toUpperCase();
    return kb.includes('IPLIK') || kb === 'BOYAHANE_URETIM' || kb === 'DOKUMA_URETIM';
}
function depoHareketDefterTarihMs(row) {
    const ca = row?.created_at ? new Date(row.created_at).getTime() : 0;
    const ua = row?.updated_at ? new Date(row.updated_at).getTime() : 0;
    return Math.max(ca, ua) || ca || ua || 0;
}
function depoHareketDefterTarihGoster(row) {
    const ms = depoHareketDefterTarihMs(row);
    if (!ms) return '—';
    return new Date(ms).toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function depoHareketNotEtiketOku(notlar, etiket) {
    const m = String(notlar || '').match(new RegExp('\\[' + etiket + ':([^\\]]+)\\]', 'i'));
    return m ? String(m[1]).trim() : '';
}
function depoHareketDefterNotMetin(row) {
    const notlar = depoNotlarStripBirim(row.notlar || '');
    const tip = String(row.islem_turu || '').trim().toUpperCase();
    const firma = String(row.firma || '').trim();
    const araci = String(row.araci_firma || '').trim();
    const tedarikci = String(row.tedarikci || '').trim();
    const parcalar = [];
    if (tip === 'ÇIKIŞ' || tip === 'CIKIS') {
        let gittigiYer = depoHareketNotEtiketOku(notlar, 'SEVK_YER') || firma;
        if (depoHareketIplikSatirMi(row)) gittigiYer = iplikCikisYeriNorm(gittigiYer);
        if (gittigiYer) parcalar.push(gittigiYer);
        const yerNorm = gittigiYer.toLocaleUpperCase('tr-TR');
        const firmaAd = [firma, araci].find(f => f && f.toLocaleUpperCase('tr-TR') !== yerNorm) || '';
        if (firmaAd) parcalar.push(firmaAd);
    } else {
        const firmaAd = firma || tedarikci || araci;
        if (firmaAd) parcalar.push(firmaAd);
        if (araci && araci.toLocaleUpperCase('tr-TR') !== String(firmaAd).toLocaleUpperCase('tr-TR')) parcalar.push(araci);
    }
    return parcalar.length ? parcalar.join(' · ') : '—';
}
function depoHareketIslemYapanSistemMi(ad) {
    const s = String(ad || '').trim();
    if (!s) return true;
    return /excel\s*import|excel\s*iplik|excel\s*sipariş|toplu\s+.*aktar|^sistem$|^excel$/i.test(s);
}
function erpKullaniciGorunenAdBul(kim) {
    const s = String(kim || '').trim();
    if (!s || depoHareketIslemYapanSistemMi(s)) return '';
    const cache = window.erpAdminUsersCache || [];
    const low = s.toLocaleLowerCase('tr-TR');
    const byUser = cache.find(x => String(x.username || '').toLocaleLowerCase('tr-TR') === low);
    if (byUser?.display_name) return String(byUser.display_name).trim();
    const byDisp = cache.find(x => String(x.display_name || '').toLocaleLowerCase('tr-TR') === low);
    if (byDisp?.display_name) return String(byDisp.display_name).trim();
    return s;
}
function depoHareketIslemYapan(row) {
    const adaylar = [];
    const ub = String(row?.updated_by || '').trim();
    if (ub) adaylar.push(ub);
    const gecmis = String(row?.islem_gecmisi || '');
    const ilkKayit = gecmis.match(/✨[^\n]*—\s*\[([^\]]+)\]/);
    if (ilkKayit) adaylar.push(ilkKayit[1].trim());
    (gecmis.match(/\[([^\]]+)\]/g) || []).forEach(t => adaylar.push(t.replace(/^\[|\]$/g, '').trim()));
    const seen = new Set();
    for (const a of adaylar) {
        const key = a.toLocaleLowerCase('tr-TR');
        if (!a || seen.has(key)) continue;
        seen.add(key);
        const ad = erpKullaniciGorunenAdBul(a);
        if (ad) return ad;
    }
    return '—';
}
function depoHareketDefterSiralama(a, b) {
    const d = depoHareketDefterTarihMs(b) - depoHareketDefterTarihMs(a);
    if (d) return d;
    return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true });
}
function isDepoStokListeModu() {
    return appMode === 'IPLIK' || appMode === 'HAM_KUMAS' || appMode === 'MAMUL_KUMAS' || appMode === 'KUMAS' || appMode === 'MAMUL_DEPO';
}
/** Giriş/sevkiyat formu ve üst toggle yalnızca komuta merkezinde */
/** Excel şablon / import hangi kolon seti: liste modu veya komutada seçilen grup */
function depoStokExcelGrubu() {
    if (appMode === 'DEPO_HAREKET' && depoKomutaHedef) return depoKomutaHedef;
    if (isDepoStokListeModu()) return appMode;
    return null;
}
function depoStokListeChromeUygula() {
    const fc = document.getElementById('form-container');
    const listHdr = document.querySelector('#list-title')?.parentElement;
    const mainList = document.getElementById('main-list');
    const liste = isDepoStokListeModu();
    if (fc) fc.classList.toggle('depo-stok-liste-slim', liste);
    document.body.classList.toggle('iplik-stok-liste-mod', liste && appMode === 'IPLIK' && !iplikListeHareketAktif());
    if (listHdr) listHdr.style.display = liste ? 'none' : '';
    if (mainList) mainList.classList.toggle('depo-stok-liste', liste);
}
function syncMamulMobilFab() {
    const fab = document.getElementById('mamul-mobil-fab');
    if (fab) fab.remove();
}
function depoHareketFormunuAc() {
    setAppMode('DEPO_HAREKET');
}
function depoKomutaTipSec(tip) {
    movementType = tip;
    depoKomutaAsama = 'GRUP';
    renderInputs();
    syncDepoKomutaChrome();
    applyDepoFormLayout();
}
function depoKomutaWizardOnceki() {
    depoKomutaAsama = 'TIP';
    renderInputs();
    syncDepoKomutaChrome();
    applyDepoFormLayout();
}
function depoKomutaGrupSec(grup) {
    if (grup === 'KUMAS') grup = 'HAM_KUMAS';
    depoKomutaHedef = grup;
    depoKomutaAsama = 'TIP';
    renderInputs();
    loadData();
    syncDepoKomutaChrome();
    syncDepoHareketSecimStili();
    applyDepoFormLayout();
}
/** Depo formlarında birim seçimine göre etiket / ek alanlar */
let kumasKartGirisTipi = 'HAM';
let kumasKartListeFiltre = 'HAM';
/* Sayfa yenilenince geri dönülebilecek ekranlar.
   ANA PROGRAMLA BİREBİR AYNI OLMAK ZORUNDA (src/stok/js/02-data-yetki.js) — burada
   olmayan ekranda yenileme yapan kullanıcı sessizce Anasayfa'ya düşer. */
// ============================================================
// getChangeLog — JSON formatı
// ============================================================
// ============================================================
// renderGecmisTimeline — islem_gecmisi metnini tıklanabilir
// zaman çizelgesine dönüştürür
// ============================================================
// --- İPLİK STOK KODU ÜRETİCİ (TEK TANIM) ---
// getNextIplikStokCode: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
// iplikKartTanimKaydiMi: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
/** Depo bakiyesine dahil iplik hareket satırı (üretim / kart tanımı hariç) */
/**
 * İplik bakiyesine giren satır mı? ANA PROGRAMLA AYNI KURAL:
 * gerçek depo hareketi (paylaşılan iplikDepoHareketiMi) + kartlardaki lot açılış
 * bakiyelerinden üretilen sentetik satırlar (_fromKart).
 *
 * Eskiden mobil kendi kuralını kullanıyordu: kart lot bakiyelerini hiç saymıyor,
 * üretim çıkışlarını da dışarıda bırakıyordu. 19.09.2026 canlı veride ölçüldü:
 * ana program 633.773 kg, mobil −33.164 kg gösteriyordu (30 koddan 28'i farklı).
 */
function iplikDepoBakiyeKaydiMi(row) {
    if (!row) return false;
    if (row._fromKart) return true;
    return typeof iplikDepoHareketiMi === 'function' ? iplikDepoHareketiMi(row) : false;
}

/** Bakiye hesabının kaynağı: ana programın hazırladığı satırlar (gerçek hareket + kart lotları). */
function iplikBakiyeSatirlari(kayitlar) {
    const kaynak = kayitlar || dataCache.iplik_stok || [];
    return typeof iplikDepoStokHareketleriHazirla === 'function'
        ? iplikDepoStokHareketleriHazirla(kaynak)
        : kaynak.filter(iplikDepoBakiyeKaydiMi);
}
function iplikStokBakiyeHesapla(stokKodu, excludeId) {
    return depoStokNetBakiyeHesapla('iplik_stok', stokKodu, null, excludeId).kg;
}
function iplikSayfaOku(row) {
    const m = String(row?.notlar || '').match(/\[SAYFA:([^\]]+)\]/i);
    return m ? m[1].trim() : '';
}
function iplikNoLotEslestirNorm(v) {
    return String(v || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/\s+/g, '')
        .replace(/\//g, 'X');
}
function iplikLotEslestirNorm(v) {
    return String(v || '').trim().toUpperCase();
}
/** Lot araması: filtre lot numarasının içinde geçmeli (tersi yanlış eşleşme üretir: 15 → 1, 5) */
function iplikStokGrupBul(stokKodu) {
    const kod = String(stokKodu || '').trim();
    if (!kod) return null;
    return (iplikStokGruplariHesapla(dataCache.iplik_stok || [])).find(g => String(g.stok_kodu || '').trim() === kod) || null;
}
function iplikLotBakiyeHesapla(stokKodu, iplikNo, lotNo, excludeId) {
    const kod = String(stokKodu || '').trim();
    const ip = iplikNoLotEslestirNorm(iplikNo) || String(iplikNo || '').trim();
    const lot = iplikLotEslestirNorm(lotNo);
    if (!kod || !ip || !lot) return { kg: 0, cuval: 0 };
    return iplikBakiyeSatirlari().reduce((acc, r) => {
        if (String(r.stok_kodu || '').trim() !== kod) return acc;
        if (excludeId && !r._fromKart && String(r.id) === String(excludeId)) return acc;
        const rip = iplikNoLotEslestirNorm(r.iplik_no) || String(r.iplik_no || '').trim();
        const rlot = iplikLotEslestirNorm(r.lot_no);
        if (rip !== ip || rlot !== lot) return acc;
        acc.kg += parseFloat(r.miktar_kg) || 0;
        acc.cuval += parseInt(r.cuval_sayisi, 10) || 0;
        return acc;
    }, { kg: 0, cuval: 0 });
}
function iplikDepoGirisOnlemKontrol(stokKodu, iplikNo, lotNo) {
    const kod = String(stokKodu || '').trim();
    const ip = String(iplikNo || '').trim();
    const lot = String(lotNo || '').trim();
    const group = iplikStokGrupBul(kod);
    if (!group || !ip || !lot) return {};
    const ipNorm = iplikNoLotEslestirNorm(ip);
    const lotNorm = iplikLotEslestirNorm(lot);
    const lots = group.lots || [];
    const ipVar = lots.some(l => iplikNoLotEslestirNorm(l.iplik_no) === ipNorm);
    const lotVar = lots.some(l => iplikNoLotEslestirNorm(l.iplik_no) === ipNorm && iplikLotEslestirNorm(l.lot_no) === lotNorm);
    if (!ipVar) {
        const mevcut = (group.iplik_nolar || []).filter(Boolean).join(', ') || '—';
        return {
            confirm: `${kod} kartına yeni iplik numarası eklenecek.\n\nYeni: ${ip}\nMevcut iplikler: ${mevcut}\nLot: ${lot}\n\nDevam edilsin mi?`
        };
    }
    if (!lotVar) {
        return {
            confirm: `${kod} · ${ip} için yeni lot açılacak.\n\nLot: ${lot}\n(Bu iplik numarasında bu lot daha önce yok.)\n\nDevam edilsin mi?`
        };
    }
    return {};
}
function iplikDepoCikisLotKontrol(stokKodu, p, excludeId) {
    const kod = String(stokKodu || '').trim();
    const ip = String(p?.iplik_no || '').trim();
    const lot = String(p?.lot_no || '').trim();
    if (!ip) return 'Çıkış için iplik numarası seçilmelidir.';
    if (!lot) return 'Çıkış için lot seçilmelidir (lot satırından 📤 kullanın).';
    const bak = iplikLotBakiyeHesapla(kod, ip, lot, excludeId);
    if (bak.kg < 1e-6) return `${ip} / Lot ${lot} stokta bulunamadı veya bakiye sıfır.`;
    const istenenKg = Math.abs(parseFloat(p.miktar_kg) || 0);
    const istenenCv = Math.abs(parseInt(p.cuval_sayisi, 10) || 0);
    if (istenenKg > 0 && bak.kg + 1e-6 < istenenKg) {
        return `Lot ${lot}: kg yetersiz (mevcut ${bak.kg.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}, istenen ${istenenKg.toLocaleString('tr-TR', { maximumFractionDigits: 2 })})`;
    }
    if (istenenCv > 0 && bak.cuval + 1e-6 < istenenCv) {
        return `Lot ${lot}: çuval yetersiz (mevcut ${bak.cuval}, istenen ${istenenCv})`;
    }
    return null;
}
function iplikAramaNorm(v) {
    return String(v || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[\/\\.,\-_]+/g, 'x')
        .replace(/\s+/g, 'x')
        .replace(/x+/g, 'x');
}
function iplikAramaCekirdek(v) {
    return iplikAramaNorm(v)
        .replace(/^(ne|nm|tex|dtex|den|t)/, '')
        .replace(/^x+/, '');
}
function iplikAramaStokKoduMu(s) {
    return /^IP-\d/i.test(String(s || '').trim());
}
function iplikAramaIplikNoMu(s) {
    const t = String(s || '').trim();
    if (!t || iplikAramaStokKoduMu(t)) return false;
    return /\d/.test(t);
}
function iplikNoAramaEslestir(iplikNo, s) {
    const qs = iplikAramaCekirdek(iplikAramaIplikNoParcala(s));
    const ip = iplikAramaCekirdek(iplikNo);
    if (!qs || !ip) return false;
    if (ip === qs) return true;
    if (qs.includes(ip) && ip.length >= 3 && qs.length <= ip.length + 1) return true;
    const idx = ip.indexOf(qs);
    if (idx < 0) return false;
    if (idx === 0) return true;
    const ch = ip[idx - 1];
    return ch === 'x' || /[a-z]/.test(ch);
}
/** 8/1ARIKAN → 8/1 (yapışık marka ayrımı) */
function iplikAramaIplikNoParcala(s) {
    const t = String(s || '').trim();
    const m = t.match(/^(\d+\s*[\/xX.,\\-]\s*\d+)/);
    return m ? m[1].trim() : t;
}
/** 8/1 ARIKAN, 8/1ARIKAN, 8/1-arıkan → ayrı tokenler */
function iplikKartMetaHaritasi() {
    const map = new Map();
    (dataCache.iplik_stok || []).forEach(r => {
        const kod = String(r.stok_kodu || '').trim();
        if (!kod) return;
        const cur = map.get(kod) || { marka: '', cins: '' };
        if (iplikKartTanimKaydiMi(r)) {
            if (r.marka) cur.marka = String(r.marka).trim();
            if (r.cins && r.cins !== '---') cur.cins = String(r.cins).trim();
        } else if (!cur.marka && r.marka && String(r.marka).trim() !== 'GENEL') {
            cur.marka = String(r.marka).trim();
        }
        map.set(kod, cur);
    });
    return map;
}
function iplikHareketGirisMi(m) {
    const tur = String(m?.islem_turu || '').toUpperCase();
    if (tur === 'GİRİŞ' || tur === 'GIRIS') return true;
    if (tur === 'ÇIKIŞ' || tur === 'CIKIS') return false;
    return (parseFloat(m?.miktar_kg) || 0) >= 0;
}
function iplikHareketTarihiOku(m) {
    const tag = String(m?.notlar || '').match(/\[TARIH:([^\]]+)\]/i);
    if (tag && tag[1]) return tag[1].trim();
    if (m?.created_at) {
        try { return new Date(m.created_at).toISOString().slice(0, 10); } catch (e) { /* */ }
    }
    return '';
}
function iplikTarihTr(iso) {
    if (!iso) return '—';
    const d = new Date(String(iso).includes('T') ? iso : iso + 'T12:00:00');
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('tr-TR');
}
function iplikTarihOzet(tarihler) {
    const arr = [...new Set((tarihler || []).filter(Boolean))].sort();
    if (!arr.length) return '—';
    if (arr.length === 1) return iplikTarihTr(arr[0]);
    return iplikTarihTr(arr[0]) + ' — ' + iplikTarihTr(arr[arr.length - 1]);
}
function iplikIpKoduSira(kod) {
    const m = String(kod || '').match(/^IP-(\d+)$/i);
    return m ? parseInt(m[1], 10) : 99999;
}
// iplikKartlariListe: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
function iplikLotlariHesapla(movements) {
    const map = {};
    (movements || []).filter(iplikDepoBakiyeKaydiMi).forEach(m => {
        const lot = String(m.lot_no ?? '').trim() || 'LOTSUZ';
        const ipNo = iplikNoLotEslestirNorm(m.iplik_no) || String(m.iplik_no ?? '').trim();
        const key = lot + '\x00' + ipNo;
        if (!map[key]) {
            map[key] = { lot_no: lot, iplik_no: ipNo, marka: '', cins: '', tedarikci: '', firma: '', cuval_rengi: '', giris_kg: 0, cikis_kg: 0, bakiye_kg: 0, cuval_giris: 0, cuval_cikis: 0, giris_tarihler: [], cikis_tarihler: [], movements: [] };
        }
        const kg = Math.abs(parseFloat(m.miktar_kg) || 0);
        const cv = parseInt(m.cuval_sayisi, 10) || 0;
        const giris = iplikHareketGirisMi(m);
        const tarih = iplikHareketTarihiOku(m);
        if (giris) {
            map[key].giris_kg += kg;
            map[key].cuval_giris += cv;
            if (tarih) map[key].giris_tarihler.push(tarih);
        } else {
            map[key].cikis_kg += kg;
            map[key].cuval_cikis += cv;
            if (tarih) map[key].cikis_tarihler.push(tarih);
        }
        // Ana programla aynı: bakiye işaretli miktarların toplamı
        map[key].bakiye_kg += parseFloat(m.miktar_kg) || 0;
        map[key].movements.push(m);
        if (!map[key].marka && m.marka) map[key].marka = m.marka;
        if (!map[key].cins && m.cins) map[key].cins = m.cins;
        if (!map[key].tedarikci && m.tedarikci) map[key].tedarikci = m.tedarikci;
        if (!map[key].firma && m.firma) map[key].firma = m.firma;
        const cr = String(m.cuval_rengi || '').trim();
        if (cr && giris) map[key].cuval_rengi = cr.toUpperCase();
        else if (cr && !map[key].cuval_rengi) map[key].cuval_rengi = cr.toUpperCase();
    });
    return Object.values(map).map(l => ({
        ...l,
        cuval_bakiye: (l.cuval_giris || 0) - (l.cuval_cikis || 0),
        giris_tarih: iplikTarihOzet(l.giris_tarihler),
        cikis_tarih: iplikTarihOzet(l.cikis_tarihler)
    })).sort((a, b) => String(a.lot_no).localeCompare(String(b.lot_no), 'tr') || String(a.iplik_no).localeCompare(String(b.iplik_no), 'tr'));
}
function iplikLotlariOzetMetin(lots) {
    if (!lots || !lots.length) return '—';
    const adlar = lots.map(l => l.lot_no).filter(x => x && x !== 'LOTSUZ');
    if (!adlar.length) return `${lots.length} lot`;
    if (adlar.length <= 2) return adlar.join(', ');
    return `${adlar.length} lot · ${adlar.slice(0, 2).join(', ')}…`;
}
function iplikStokKoduSayfaIle(sayfaAdi) {
    const hedef = iplikAaaaKimlikNorm(sayfaAdi);
    if (!hedef) return '';
    const rows = dataCache.iplik_stok || [];
    let bulunan = '';
    rows.forEach(r => {
        if (iplikAaaaKimlikNorm(iplikSayfaOku(r)) !== hedef) return;
        const kod = String(r.stok_kodu || '').trim();
        if (!kod) return;
        if (/^IP-\d{4}$/i.test(kod)) bulunan = kod;
        else if (!bulunan) bulunan = kod;
    });
    return bulunan;
}
function iplikStokGruplariHesapla(kayitlar) {
    const kartMeta = iplikKartMetaHaritasi();
    /* Bakiye satırları ana programın hazırladığı kümeden (kart lotları dahil);
       kart tanım kayıtları yalnız min stok / kalite gibi meta için eklenir. */
    const kaynak = kayitlar || [];
    const satirlar = iplikBakiyeSatirlari(kaynak).concat(kaynak.filter(iplikKartTanimKaydiMi));
    const groupedMap = satirlar.reduce((acc, curr) => {
        const sKodu = (curr.stok_kodu || '').toString().trim();
        const sayfa = iplikSayfaOku(curr);
        const key = sKodu || (sayfa ? 'SF:' + iplikAaaaKimlikNorm(sayfa) : 'IP:' + iplikAaaaKimlikNorm(curr.iplik_no)) || 'BILINMEYEN';
        const marka = (curr.marka || 'GENEL').toString().trim();
        const cins = (curr.cins || '---').toString().trim();
        if (!acc[key]) {
            acc[key] = { stok_kodu: sKodu, sayfa, iplik_no: '', iplik_no_ozet: '', marka, cins, total_kg: 0, min_stok: null, kalite: curr.kalite || 'AKTİF', movements: [], lots: [], lot_sayisi: 0 };
        }
        acc[key].total_kg += iplikDepoBakiyeKaydiMi(curr) ? (parseFloat(curr.miktar_kg) || 0) : 0;
        if (iplikDepoBakiyeKaydiMi(curr)) acc[key].movements.push(curr);
        if (/^IP-\d{4}$/i.test(sKodu)) acc[key].stok_kodu = sKodu;
        else if (!acc[key].stok_kodu && sKodu) acc[key].stok_kodu = sKodu;
        if (sayfa && !acc[key].sayfa) acc[key].sayfa = sayfa;
        if (!acc[key].marka || acc[key].marka === 'GENEL') acc[key].marka = marka;
        if (!acc[key].cins || acc[key].cins === '---') acc[key].cins = cins;
        if (iplikKartTanimKaydiMi(curr)) {
            acc[key].min_stok = parseFloat(curr.min_stok) || acc[key].min_stok;
            acc[key].kalite = curr.kalite || acc[key].kalite;
            acc[key].renk = curr.renk || acc[key].renk;
        }
        return acc;
    }, {});
    // Ana programla aynı: yalnız kart tanımı olan, hiç bakiye satırı olmayan kod listelenmez
    const groups = Object.values(groupedMap).filter(g => g.movements.length > 0);
    groups.forEach(g => {
        g.lots = iplikLotlariHesapla(g.movements);
        g.lot_sayisi = g.lots.length;
        const meta = kartMeta.get(g.stok_kodu) || {};
        g.kart_marka = meta.marka || '';
        g.kart_cins = meta.cins || '';
        if ((!g.marka || g.marka === 'GENEL') && meta.marka) g.marka = meta.marka;
        if ((!g.cins || g.cins === '---') && meta.cins) g.cins = meta.cins;
        const ted = (g.movements || []).map(m => m.tedarikci || m.firma).find(v => v && String(v).trim());
        if (ted) g.tedarikci = String(ted).trim();
        g.lots.forEach(lot => {
            if (!lot.marka || lot.marka === 'GENEL') lot.marka = lot.marka || g.marka || meta.marka || '';
            if (!lot.cins || lot.cins === '---') lot.cins = lot.cins || g.cins || meta.cins || '';
        });
        const ipSet = new Set(g.movements.map(m => String(m.iplik_no || '').trim()).filter(Boolean));
        g.iplik_nolar = [...ipSet];
        if (g.sayfa) {
            g.iplik_no_ozet = g.sayfa;
            g.iplik_no = g.sayfa;
        } else if (ipSet.size === 1) {
            g.iplik_no = [...ipSet][0];
            g.iplik_no_ozet = g.iplik_no;
        } else if (ipSet.size > 1) {
            g.iplik_no_ozet = `${ipSet.size} iplik çeşidi`;
            g.iplik_no = g.iplik_no_ozet;
        }
        if (!g.stok_kodu) g.stok_kodu = iplikStokKoduSayfaIle(g.sayfa) || '';
    });
    return groups.sort((a, b) => iplikIpKoduSira(a.stok_kodu) - iplikIpKoduSira(b.stok_kodu) || (b.total_kg - a.total_kg));
}
function iplikListeHucre(deger, cls) {
    const v = String(deger ?? '').trim() || '—';
    return `<span class="iplik-stok-grid__cell ${cls || ''}" title="${pdfEsc(v)}">${pdfEsc(v)}</span>`;
}
function iplikListeCuvalHucre(rengi) {
    return `<span class="iplik-stok-grid__cell">${iplikCuvalRenkBadgeHtml(rengi, { kisa: true })}</span>`;
}
function iplikGrupListeIplikNoMetin(group) {
    const nolar = (group.iplik_nolar || []).map(n => String(n || '').trim()).filter(Boolean);
    if (nolar.length === 1) return nolar[0];
    if (nolar.length > 1) {
        const ozet = nolar.slice(0, 3).join(', ');
        return nolar.length > 3 ? ozet + '…' : ozet;
    }
    const tek = String(group.iplik_no || '').trim();
    if (tek && tek !== group.sayfa && !tek.includes('çeşidi')) return tek;
    return '—';
}
function iplikStokFiltreAl() {
    if (!window._iplikStokFiltre) window._iplikStokFiltre = { iplik_no: '', lot: '', marka: '', cins: '' };
    return { ...window._iplikStokFiltre };
}
function iplikStokFiltreDomOku() {
    const f = iplikStokFiltreAl();
    ['iplik_no', 'lot', 'marka', 'cins'].forEach(a => {
        const el = document.getElementById('iplik-filtre-' + a);
        if (el) f[a] = el.value || '';
    });
    window._iplikStokFiltre = f;
    return f;
}
function iplikListeHareketAktif() {
    return appMode === 'IPLIK' && !!window._iplikListeHareket;
}
function iplikStogaGitLotSec(stokKodu) {
    const kod = String(stokKodu || '').trim();
    if (!kod) return;
    const ac = () => {
        const groups = window._iplikGroups || iplikStokGruplariHesapla(dataCache.iplik_stok || []);
        const gi = groups.findIndex(g => String(g.stok_kodu || '').trim() === kod);
        if (gi < 0) {
            const kartHata = depoIplikStokKartiDogrula(kod);
            erpToast(kartHata || `"${kod}" iplik stoğunda bulunamadı.`, 'warn', 5000);
            return;
        }
        window._iplikExpanded = window._iplikExpanded || new Set();
        window._iplikExpanded.add(gi);
        if (iplikListeHareketAktif()) iplikListeHareketKapat();
        loadData();
        erpToast(`${kod} — lot satırına tıklayarak giriş veya çıkış yapın.`, 'info', 5500);
    };
    if (appMode !== 'IPLIK') { setAppMode('IPLIK'); setTimeout(ac, 200); }
    else ac();
}
function iplikLotHareketAc(groupIdx, lotIdx, tip, girisModu) {
    if (groupIdx == null || groupIdx < 0) {
        erpToast('Önce stok kartını açıp lot seçin.', 'info', 4500);
        return;
    }
    if (tip === 'ÇIKIŞ' && (lotIdx == null || lotIdx < 0)) {
        erpToast('Sevkiyat için lot satırını seçin.', 'warn');
        return;
    }
    if (tip === 'GİRİŞ' && (lotIdx == null || lotIdx < 0) && girisModu !== 'yeni_lot') {
        erpToast('Giriş için lot seçin veya +Lot ile yeni lot açın.', 'warn');
        return;
    }
    if (tip === 'GİRİŞ' && girisModu === 'yeni_lot') {
        const g = groupIdx >= 0 ? (window._iplikGroups || [])[groupIdx] : null;
        const nolar = (g?.iplik_nolar || []).filter(Boolean);
        if (nolar.length > 1) {
            erpToast('Bu kartta birden fazla iplik numarası var. Yeni lot için ilgili lot satırından 📥 kullanın.', 'warn', 6000);
            return;
        }
    }
    window._iplikListeHareket = { groupIdx, lotIdx: lotIdx == null ? -1 : lotIdx, tip, girisModu: girisModu || null };
    movementType = tip === 'ÇIKIŞ' ? 'ÇIKIŞ' : 'GİRİŞ';
    window._iplikExpanded = window._iplikExpanded || new Set();
    if (groupIdx >= 0) window._iplikExpanded.add(groupIdx);
    document.body.classList.add('iplik-liste-hareket-split');
    document.body.classList.toggle('iplik-liste-lot-dolu', lotIdx >= 0);
    const ft = document.getElementById('form-title');
    if (ft) {
        const g = groupIdx >= 0 ? (window._iplikGroups || [])[groupIdx] : null;
        const lot = g && lotIdx >= 0 ? g.lots?.[lotIdx] : null;
        ft.innerText = (movementType === 'GİRİŞ' ? 'Depo Girişi' : 'Sevkiyat')
            + (girisModu === 'yeni_lot' ? ' — Yeni lot' : '')
            + (g ? ' — ' + (g.stok_kodu || '') + (lot ? ' / Lot ' + lot.lot_no : '') : '');
    }
    const fc = document.getElementById('form-container');
    if (fc) fc.style.display = 'block';
    renderInputs();
    applyDepoFormLayout();
    syncDepoKomutaChrome();
    syncDepoHareketSecimStili();
    setTimeout(() => {
        iplikLotFormaUygula();
        const cy = document.getElementById('val-cikis-yeri');
        if (cy) checkIplikExit(cy);
        const gm = window._iplikListeHareket?.girisModu;
        const focusId = gm === 'yeni_lot' ? 'val-lot' : 'val-kg';
        const focusEl = document.getElementById(focusId) || document.getElementById('val-kg');
        if (focusEl && (!cy || cy.value === 'SİMTEKS DOKUMA' || movementType === 'GİRİŞ')) focusEl.focus();
    }, 80);
    window._erpFocusRestore = null;
    loadData();
}
function iplikYeniLotGirisAc(groupIdx) {
    iplikLotHareketAc(groupIdx, -1, 'GİRİŞ', 'yeni_lot');
}
/* IPLIK_CIKIS_SECENEKLER: ana programın çekirdeğinden gelir (assets/erp-core.js) */
const IPLIK_CIKIS_SECENEK_ETIKET = {
    'SİMTEKS DOKUMA': '🏠 SİMTEKS DOKUMA',
    'FASON DOKUMA': '🏭 FASON DOKUMA',
    'BOBİN BOYA': '🎨 BOBİN BOYA',
    'BÜKÜM': '🔄 BÜKÜM',
    'HAŞIL': '🧵 HAŞIL',
    'SATIŞ': '💰 SATIŞ'
};
function iplikCikisYeriNorm(yer) {
    const y = String(yer || '').trim().toLocaleUpperCase('tr-TR');
    if (y === 'ÇÖZGÜCÜ' || y === 'COZGUCU') return 'HAŞIL';
    return String(yer || '').trim();
}
function iplikCikisYeriSelectHtml(extraStyle) {
    const st = extraStyle || '';
    return '<select id="val-cikis-yeri" onchange="checkIplikExit(this)" class="pro-input" style="' + st + '">' +
        IPLIK_CIKIS_SECENEKLER.map(v => `<option value="${v}">${IPLIK_CIKIS_SECENEK_ETIKET[v] || v}</option>`).join('') +
        '</select>';
}
function iplikListeHizliFormHtml(isGiris, accentColor, accentRgb, ctx) {
    ctx = ctx || {};
    const girisModu = isGiris ? (ctx.girisModu || null) : null;
    const panelBaslik = girisModu === 'yeni_lot' ? 'Yeni lot girişi' : (isGiris ? 'Depo girişi' : 'Sevkiyat');
    const sevkAlanlari = !isGiris ? `
            <div>
                <label class="pro-label" style="color:${accentColor}">GİDECEĞİ YER</label>
                ${iplikCikisYeriSelectHtml(`border-color:rgba(${accentRgb},0.35);font-weight:600`)}
            </div>
            <div id="wrap-cikis-detay" style="display:none">
                <label class="pro-label" style="color:${accentColor}">FİRMA ADI</label>
                <input id="val-afirma" class="pro-input" placeholder="Firma adı..."
                    style="text-transform:uppercase;font-weight:600;border-color:rgba(${accentRgb},0.35)">
            </div>` : `
            <div>
                <label class="pro-label" style="color:${accentColor}">GELDİĞİ YER / TEDARİKÇİ</label>
                <input id="val-afirma" class="pro-input" placeholder="Tedarikçi firma adı..."
                    style="text-transform:uppercase;font-weight:600">
            </div>`;
    const girisEkAlanlar = girisModu === 'yeni_lot' ? `
            <div style="padding:10px 12px;border-radius:8px;background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.28);font-size:10px;color:var(--emerald-c);line-height:1.45">
                Mevcut <b>iplik numarası</b> korunur; yeni lot ve lot bilgileri girilir.
            </div>
            <div>
                <label class="pro-label" style="color:${accentColor}">İPLİK NO <span style="font-size:8px;color:var(--text3)">(sabit)</span></label>
                <input id="val-no" readonly class="pro-input"
                    style="font-family:'DM Mono',monospace;font-weight:700;background:var(--surface2);color:var(--text2);border-color:rgba(${accentRgb},0.2);cursor:default"
                    placeholder="—">
            </div>
            <div>
                <label class="pro-label" style="color:${accentColor}">YENİ LOT NO <span class="req-star">★</span></label>
                <input id="val-lot" class="pro-input" placeholder="Yeni lot numarası..."
                    style="font-family:'DM Mono',monospace;font-weight:600;border-color:rgba(${accentRgb},0.35)">
            </div>
            <div>
                <label class="pro-label" style="color:${accentColor}">MARKA <span class="req-star">★</span></label>
                <input id="val-marka" class="pro-input" placeholder="Marka..."
                    style="text-transform:uppercase;font-weight:600;border-color:rgba(${accentRgb},0.35)">
            </div>
            <div>
                <label class="pro-label" style="color:${accentColor}">CİNS <span class="req-star">★</span></label>
                <input id="val-cins" class="pro-input" placeholder="Pamuk, polyester, karışım..."
                    style="text-transform:uppercase;font-weight:600;border-color:rgba(${accentRgb},0.35)">
            </div>
            <div>
                <label class="pro-label">KALİTE</label>
                <select id="val-kalite" class="pro-input" style="font-weight:600">
                    <option>1. KALİTE</option><option>2. KALİTE</option><option>3. KALİTE</option><option>FIRE</option>
                </select>
            </div>
            <div>
                <label class="pro-label">ÇUVAL RENGİ</label>
                <input id="val-cuval-rengi" class="pro-input" placeholder="Beyaz, mavi..."
                    style="text-transform:uppercase">
            </div>
            <div>
                <label class="pro-label">NOTLAR</label>
                <textarea id="val-notlar" rows="2" class="pro-input" placeholder="Parti, renk tonu veya özel not..."
                    style="resize:vertical;font-size:11px;line-height:1.5"></textarea>
            </div>` : '';
    const gizliKimlik = girisModu === 'yeni_lot'
        ? `<input type="hidden" id="val-stok-kodu">`
        : `<input type="hidden" id="val-stok-kodu"><input type="hidden" id="val-no"><input type="hidden" id="val-lot"><input type="hidden" id="val-marka"><input type="hidden" id="val-cins">`;
    return `
    <div class="panel-box" style="padding:12px 16px;border-left:3px solid ${accentColor};background:rgba(${accentRgb},0.05)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-size:20px">${isGiris ? '📥' : '📤'}</span>
            <div>
                <div style="font-size:8px;font-weight:700;color:var(--text3);text-transform:uppercase;font-family:'DM Mono',monospace">${girisModu ? 'Stok kartı' : 'Seçilen lot'}</div>
                <div style="font-family:'Instrument Serif',serif;font-size:17px;color:${accentColor}">${panelBaslik}</div>
            </div>
        </div>
        <div id="iplik-selected-card" style="display:block;padding:10px 12px;border-radius:10px;border:1px solid rgba(${accentRgb},0.35);background:rgba(${accentRgb},0.06)">
            <div style="display:grid;grid-template-columns:72px 1fr;gap:4px 10px;font-size:10px;align-items:center">
                <span style="font-size:8px;color:var(--text3);font-family:'DM Mono',monospace">STOK</span>
                <span style="font-family:'DM Mono',monospace;font-weight:700;color:${accentColor}" id="isel-kod">—</span>
                <span style="font-size:8px;color:var(--text3)">İPLİK</span>
                <span style="font-weight:600;color:var(--text)" id="isel-no">—</span>
                <span style="font-size:8px;color:var(--text3)">LOT / MARKA</span>
                <span style="color:var(--text2);font-family:'DM Mono',monospace;font-size:9px" id="isel-lot">—</span>
                <span style="font-size:8px;color:var(--text3)">BAKİYE</span>
                <span style="font-weight:700;color:var(--emerald-c);font-family:'DM Mono',monospace" id="isel-bakiye">— kg</span>
            </div>
        </div>
        ${gizliKimlik}
        <input type="hidden" id="val-iplik-search" value="">
    </div>
    <div class="panel-box" style="padding:0;overflow:hidden;border-left:3px solid ${accentColor}">
        <div class="panel-head">
            <div class="panel-head-title"><span class="panel-head-dot" style="background:${accentColor}"></span>${isGiris ? 'GİRİŞ' : 'SEVK'} — GİRİLECEK ALANLAR</div>
        </div>
        <div style="padding:14px 16px;display:flex;flex-direction:column;gap:12px">
            ${girisEkAlanlar}
            <div>
                <label class="pro-label" style="color:${accentColor}">KAÇ KG? <span class="req-star">★</span></label>
                <input id="val-kg" type="number" min="0.1" step="0.01" class="pro-input"
                    style="font-family:'DM Mono',monospace;font-size:24px;font-weight:700;color:${accentColor};text-align:center;border-color:rgba(${accentRgb},0.35)"
                    placeholder="0.00">
            </div>
            <div>
                <label class="pro-label">KAÇ ÇUVAL?</label>
                <input id="val-cuval" type="number" min="0" step="1" class="pro-input"
                    style="font-family:'DM Mono',monospace;font-size:20px;font-weight:700;text-align:center"
                    placeholder="0">
            </div>
            ${sevkAlanlari}
            <div>
                <label class="pro-label">İRSALİYE NO</label>
                <input id="val-irs" class="pro-input" placeholder="İrsaliye / sevk evrak no..."
                    style="font-family:'DM Mono',monospace">
            </div>
        </div>
    </div>
    ${girisModu === 'yeni_lot' ? '' : `<input type="hidden" id="val-kalite" value="1. KALİTE">
    <input type="hidden" id="val-cuval-rengi" value="">
    <input type="hidden" id="val-notlar" value="">`}
    <select id="val-miktar-birim" style="display:none"><option value="KG" selected>kg</option></select>`;
}
function iplikListeHareketKapat() {
    window._iplikListeHareket = null;
    document.body.classList.remove('iplik-liste-hareket-split', 'iplik-liste-lot-dolu');
    const ft = document.getElementById('form-title');
    if (ft) ft.innerText = 'İşlem Girişi';
    renderInputs();
    applyDepoFormLayout();
    loadData();
}
function iplikFormaDoldur(x) {
    if (!x) return;
    document.getElementById('iplik-search-results') && (document.getElementById('iplik-search-results').style.display = 'none');
    const inp = document.getElementById('val-iplik-search');
    if (inp) inp.value = (x.stok_kodu ? x.stok_kodu + ' — ' : '') + (x.iplik_no || '') + (x.lot_no ? ' / Lot ' + x.lot_no : '');
    const fill = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
    fill('val-stok-kodu', x.stok_kodu);
    fill('val-no', x.iplik_no);
    fill('val-lot', x.lot_no);
    fill('val-marka', x.marka);
    fill('val-cins', x.cins);
    const kalEl = document.getElementById('val-kalite');
    const kaliteVal = x.kalite || '1. KALİTE';
    if (kalEl) kalEl.value = kaliteVal;
    const card = document.getElementById('iplik-selected-card');
    if (card) {
        card.style.display = 'block';
        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || '—'; };
        set('isel-kod', x.stok_kodu);
        set('isel-no', x.iplik_no);
        set('isel-lot', [x.lot_no, x.marka, x.cins].filter(Boolean).join(' / ') || '—');
        set('isel-bakiye', (parseFloat(x.bakiye) || 0).toFixed(2) + ' kg');
    }
    const setp = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v || '—'; };
    setp('prev-kod', x.stok_kodu);
    setp('prev-no', x.iplik_no);
    setp('prev-lot', x.lot_no);
    setp('prev-marka', x.marka);
    setp('prev-cins', x.cins);
    setp('prev-kalite', x.kalite || '1. KALİTE');
    if (typeof updateIplikPreview === 'function') updateIplikPreview();
}
function iplikLotFormaUygula() {
    const ctx = window._iplikListeHareket;
    if (!ctx || ctx.groupIdx < 0) return;
    const group = (window._iplikGroups || [])[ctx.groupIdx];
    if (!group) return;
    let x = {
        stok_kodu: group.stok_kodu || '',
        iplik_no: iplikGrupListeIplikNoMetin(group),
        lot_no: '',
        marka: group.marka || '',
        cins: group.cins || '',
        bakiye: group.total_kg || 0,
        kalite: group.kalite || '1. KALİTE'
    };
    if (ctx.lotIdx >= 0 && group.lots && group.lots[ctx.lotIdx]) {
        const lot = group.lots[ctx.lotIdx];
        x = {
            stok_kodu: group.stok_kodu || '',
            iplik_no: lot.iplik_no || x.iplik_no,
            lot_no: lot.lot_no || '',
            marka: lot.marka || group.marka || '',
            cins: lot.cins || group.cins || '',
            bakiye: lot.bakiye_kg || 0,
            kalite: group.kalite || '1. KALİTE'
        };
    } else if (ctx.girisModu === 'yeni_lot') {
        const nolar = (group.iplik_nolar || []).filter(Boolean);
        x.iplik_no = nolar.length === 1 ? nolar[0] : (group.sayfa || group.iplik_no_ozet || x.iplik_no);
        x.lot_no = '';
        x.bakiye = 0;
        const ipNorm = iplikNoLotEslestirNorm(x.iplik_no);
        const refLot = (group.lots || []).find(l => iplikNoLotEslestirNorm(l.iplik_no) === ipNorm);
        if (refLot) {
            x.marka = refLot.marka || group.marka || x.marka;
            x.cins = refLot.cins || group.cins || x.cins;
        }
    }
    iplikFormaDoldur(x);
    if (ctx.tip) movementType = ctx.tip === 'ÇIKIŞ' ? 'ÇIKIŞ' : 'GİRİŞ';
}
// iplikKartListeToggle: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
function iplikCuvalRenkHex(ad) {
    const s = String(ad || '').trim().toLocaleLowerCase('tr-TR');
    if (!s) return '#94a3b8';
    const map = {
        beyaz: '#f8fafc', mavi: '#3b82f6', kirmizi: '#ef4444', 'kırmızı': '#ef4444',
        sari: '#eab308', 'sarı': '#eab308', yesil: '#22c55e', 'yeşil': '#22c55e',
        turuncu: '#f97316', mor: '#a855f7', siyah: '#1e293b', gri: '#94a3b8',
        pembe: '#ec4899', kahverengi: '#92400e', lacivert: '#1e3a8a', bej: '#d6c4a8',
        krem: '#fef3c7', bordo: '#991b1b', lila: '#c084fc', turkuaz: '#06b6d4'
    };
    for (const [k, v] of Object.entries(map)) {
        if (s.includes(k)) return v;
    }
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
    return `hsl(${Math.abs(h) % 360}, 52%, 50%)`;
}
function iplikCuvalRenkBadgeHtml(rengi, opts) {
    opts = opts || {};
    const ad = String(rengi || '').trim();
    if (!ad) return opts.kisa ? '—' : '<span style="font-size:9px;color:var(--text3)">—</span>';
    const hex = iplikCuvalRenkHex(ad);
    const kisa = ad.length > 12 ? ad.slice(0, 11) + '…' : ad;
    return `<span class="iplik-kart-lot-cuval" title="${pdfEsc(ad)}"><span class="iplik-kart-lot-cuval__dot" style="background:${hex}"></span>${pdfEsc(kisa)}</span>`;
}
function iplikKartLotlariBul(stokKodu) {
    const kod = String(stokKodu || '').trim();
    if (!kod) return [];
    const kart = iplikKartlariListe().find(r => String(r.stok_kodu || '').trim() === kod);
    const cardLots = (typeof iplikKartLotlariAl === 'function' && kart) ? iplikKartLotlariAl(kart) : [];
    if (cardLots.length) {
        return cardLots.map(l => ({
            lot_no: l.lot_no || '',
            iplik_no: kart.iplik_no || '',
            marka: kart.marka || '',
            cins: kart.cins || '',
            renk: l.renk || kart.renk || '',
            tedarikci: l.tedarikci || kart.tedarikci || '',
            depo_konum: l.depo_konum || kart.depo_konum || '',
            bakiye_kg: parseFloat(l.miktar_kg) || 0,
            cuval_rengi: kart.cuval_rengi || ''
        }));
    }
    return iplikLotlariHesapla(iplikBakiyeSatirlari().filter(r => String(r.stok_kodu || '').trim() === kod));
}
function iplikKartLotListeBlokHtml(lots, kart, opts) {
    opts = opts || {};
    kart = kart || {};
    if (!lots || !lots.length) {
        return '<div style="padding:8px;font-size:10px;color:var(--text3);text-align:center">Henüz lot kaydı yok</div>';
    }
    const lotRows = lots.map(lot => {
        const neg = (lot.bakiye_kg || 0) <= 0;
        const bakCls = neg ? 'neg' : 'pos';
        const lotLbl = lot.lot_no && lot.lot_no !== 'LOTSUZ' ? lot.lot_no : '—';
        return `<div class="iplik-stok-lot-grid iplik-stok-lot-grid--row">
            ${iplikListeHucre(lot.iplik_no || kart.iplik_no)}
            ${iplikListeHucre(lotLbl)}
            ${iplikListeHucre(lot.marka || kart.marka)}
            ${iplikListeHucre(lot.cins || kart.cins)}
            ${iplikListeCuvalHucre(lot.cuval_rengi)}
            <span class="iplik-stok-grid__cell iplik-stok-grid__cell--bakiye ${bakCls}" style="font-size:12px">${(lot.bakiye_kg || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kg</span>
            <span></span>
        </div>`;
    }).join('');
    const head = opts.baslik !== false
        ? `<div class="iplik-stok-lot-grid iplik-stok-lot-grid--head">
            <span>İplik no</span><span>Lot no</span><span>Marka</span><span>Cins</span><span>Çuval</span>
            <span style="text-align:right">Bakiye</span><span></span>
        </div>`
        : '';
    return head + lotRows;
}
function iplikKartLotPanelHtml(kart, idx, expanded) {
    const lots = iplikKartLotlariBul(kart.stok_kodu);
    if (!lots.length) return '';
    return `<div id="iplik-kart-lot-panel-${idx}" class="iplik-stok-lot-panel" style="display:${expanded ? 'block' : 'none'}">
        ${iplikKartLotListeBlokHtml(lots, kart, { baslik: true })}
    </div>`;
}
// iplikKartListeTabloBaslikHtml: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
function iplikStokDurumPill(group) {
    const kg = group.total_kg || 0;
    const min = parseFloat(group.min_stok) || 0;
    if (kg <= 0) return { cls: 'pill-red', txt: '⚠ Kritik' };
    if (min > 0 && kg < min) return { cls: 'pill-amber', txt: '↓ Düşük' };
    const k = String(group.kalite || 'AKTİF').toUpperCase();
    if (k === 'PASİF') return { cls: 'pill-gray', txt: 'Pasif' };
    if (k === 'TÜKENDİ') return { cls: 'pill-red', txt: 'Tükendi' };
    return { cls: 'pill-green', txt: 'Stokta' };
}
// iplikKartListeSatirHtml: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
function iplikStokListeChromeUygula() {
    const listHdr = document.querySelector('#list-title')?.parentElement;
    const liste = appMode === 'IPLIK';
    if (listHdr) listHdr.style.display = liste ? 'none' : '';
}

/** Mamül stok kodu: assets/stok-kart-desktop.js (YYYYNNN) kullanılır. */
// getNextStockCode: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
const KUMAS_KUTUP_DB_SKIP = new Set(['ana_grup']);

function kumasKutuphanesiDbTemizle(p) {
    if (!p || typeof p !== 'object') return p;
    const o = { ...p };
    KUMAS_KUTUP_DB_SKIP.forEach(k => { delete o[k]; });
    return o;
}

function numuneKayitTuruOku(i) {
    return numuneNotTagOku(i?.notlar, 'KAYIT_TUR').toUpperCase();
}

function numuneNotTagOku(notlar, etiket) {
    const m = String(notlar || '').match(new RegExp('\\[' + etiket + ':([^\\]]+)\\]', 'i'));
    return m ? String(m[1]).trim() : '';
}

function numuneUrunKimlikKoduBul(kayit) {
    if (!kayit) return '';
    return numuneNotTagOku(kayit.notlar, 'URUN_KIMLIK');
}

function mamulStokKoduBul(kayit) {
    if (!kayit) return '';
    return numuneNotTagOku(kayit.notlar, 'MAMUL_STOK');
}
function mamulKartAramaBlob(k) {
    if (!k) return '';
    const meta = mamulEkAlanMetaDecode(k.notlar || '');
    const parcalar = [
        k.desen_kodu, k.stok_kodu, k.urun_adi, k.desen_adi, k.firma, k.kumas_cinsi, k.renk,
        k.tarak_no, k.tarak_eni, k.atki_sikligi, k.cozgu_no, k.cozgu_cinsi,
        k.ham_en, k.ham_boy, k.ham_gsm, k.mamul_en, k.mamul_boy, k.mamul_gsm, k.mamul_gramaj,
        k.urun_kat, k.fiber, k.ham_kumas_kodu,
        meta.takip_no, meta.tezgah_no, meta.tezgah_desen_no, meta.istenen_mamul_ebat, meta.olculen_ham_ebat, meta.olculen_mamul_ebat,
        mamulAnaKodBul(k.desen_kodu),
        numuneNotTagOku(k.notlar, 'NUMUNE_KAYNAK'),
        numuneNotTagOku(k.notlar, 'URUN_KIMLIK'),
        numuneNotTagOku(k.notlar, 'MAMUL_STOK'),
        numuneNotTagOku(k.notlar, 'TEZGAH_NO'),
        k.urun_adi || k.desen_adi,
        k.notlar
    ];
    return parcalar.map(x => String(x || '').toLowerCase()).join(' ');
}
function mamulKartAramaAktifMi() {
    const f = mamulKartAramaFiltre || {};
    return !!(f.q || f.firma || f.urun || f.kod || f.desen || f.kumas || f.renk || f.tezgah || f.takip || f.numune);
}
function mamulKartAramaDetayToggle() {
    mamulKartAramaDetayAcik = !mamulKartAramaDetayAcik;
    if (appMode === 'KART_LISTE' && archiveTab === 'MAMUL') loadData();
}
function mamulKartListeHizliFiltreSet(f) {
    mamulKartListeHizliFiltre = f || 'HEPSI';
    saveUiState({ mamulKartListeHizliFiltre });
    if (appMode === 'KART_LISTE' && archiveTab === 'MAMUL') loadData();
}
function mamulKartListeGruplariFiltrele(gruplar) {
    const f = mamulKartListeHizliFiltre || 'HEPSI';
    if (f === 'HEPSI') return gruplar;
    return (Array.isArray(gruplar) ? gruplar : []).filter(grup => {
        const kodlar = [grup.anaKod, ...(grup.children || []).map(c => c.record?.desen_kodu)].filter(Boolean);
        const stokTxt = mamulStokBakiyeToplamText(kodlar);
        const stoklu = stokTxt !== '0';
        if (f === 'STOKLU') return stoklu;
        if (f === 'SIFIR') return !stoklu;
        if (f === 'VARYANTLI') return (grup.children || []).length > 0;
        return true;
    });
}
function mamulKartListeToolbarHtml(grupSayisi) {
    const f = mamulKartAramaFiltre || {};
    const detayAcik = mamulKartAramaDetayAcik || mamulKartAramaAktifMi();
    const hf = mamulKartListeHizliFiltre || 'HEPSI';
    const chip = (id, lbl) => `<button type="button" onclick="mamulKartListeHizliFiltreSet('${id}')" class="pill ${hf === id ? 'pill-amber' : 'pill-gray'}" style="cursor:pointer;border:none;font-size:9px;padding:4px 10px">${lbl}</button>`;
    const inp = (id, alan, ph, mono) => `<input id="${id}" value="${pdfEsc(f[alan] || '')}" placeholder="${ph}" class="pro-input" style="padding:6px 8px;font-size:10px${mono ? ';font-family:\'DM Mono\',monospace' : ''}" oninput="mamulKartAramaFiltreAlanGuncelle('${alan}',this.value)">`;
    return `<div class="mamul-kart-arama-toolbar panel-box" style="padding:0;border:none;background:transparent">
        <div class="mamul-kart-arama-toolbar">
            <div class="mamul-kart-arama-toolbar__head">
                <div class="mamul-kart-arama-toolbar__title">Mamül stok kartları — arama</div>
                <div class="mamul-kart-arama-toolbar__sayac">${grupSayisi} ana kart${mamulKartAramaAktifMi() ? ' · filtre aktif' : ''}</div>
            </div>
            <div class="mamul-kart-arama-toolbar__ana">
                ${inp('mka-q', 'q', 'Kod, müşteri, desen, ölçü, tezgah, atkı…', false)}
                <button type="button" onclick="mamulKartAramaDetayToggle()" class="pill pill-gray" style="cursor:pointer;border:none;font-size:9px;padding:6px 12px;white-space:nowrap">${detayAcik ? '▾' : '▸'} Detaylı</button>
            </div>
            <div class="mamul-kart-arama-toolbar__chips">
                ${chip('HEPSI', 'Tümü')}
                ${chip('STOKLU', 'Stoklu')}
                ${chip('SIFIR', 'Sıfır stok')}
                ${chip('VARYANTLI', 'Varyantlı')}
            </div>
            ${detayAcik ? `<div class="mamul-kart-arama-toolbar__detay">
                ${inp('mka-kod', 'kod', 'Stok kodu', true)}
                ${inp('mka-firma', 'firma', 'Müşteri / firma', false)}
                ${inp('mka-urun', 'urun', 'Ürün adı', false)}
                ${inp('mka-desen', 'desen', 'Desen adı', false)}
                ${inp('mka-kumas', 'kumas', 'Kumaş cinsi', false)}
                ${inp('mka-renk', 'renk', 'Renk', false)}
                ${inp('mka-tezgah', 'tezgah', 'Tezgah no', true)}
                ${inp('mka-takip', 'takip', 'Takip no', true)}
                ${inp('mka-numune', 'numune', 'Numune kodu', true)}
                <div style="display:flex;justify-content:flex-end;align-items:flex-end">
                    <button type="button" onclick="mamulKartAramaFiltreSifirla()" class="pill pill-gray" style="cursor:pointer;border:none;font-size:9px;padding:6px 12px">Temizle</button>
                </div>
            </div>` : ''}
            <div class="mamul-kart-arama-toolbar__foot"></div>
        </div>
    </div>`;
}
function stokKartListeAksiyonHtml(idx, opts) {
    const o = opts || {};
    const editFn = o.anaKod
        ? `editMamulKartFromListe('${erpAttr(o.anaKod)}')`
        : `editRecordFromList(${idx})`;
    return `<span class="mamul-stok-liste-grid__cell mamul-stok-liste-grid__cell--aksiyon" onclick="event.stopPropagation()">
        <button type="button" class="liste-duzenle-btn" onclick="event.stopPropagation();${editFn}" title="Kartı düzenle">✏️</button>
        <button type="button" class="liste-gecmis-btn" onclick="event.stopPropagation();showDetailOpenGecmis(${idx})" title="Kayıt geçmişi">Geçmiş</button>
    </span>`;
}
function mamulKartAnaKayitBul(anaKod) {
    const ana = String(anaKod || '').trim().toUpperCase();
    if (!ana) return null;
    const lib = dataCache.kumas_kutuphanesi || [];
    return lib.find(k => String(k.desen_kodu || '').trim().toUpperCase() === ana) || null;
}
function stokKartDuzenleAc(record) {
    if (!record) return;
    editingId = record.id;
    originalRecordSnapshot = { ...record };
    const kartGrup = kumasKutuphanesiKartiMamulMu(record) ? 'MAMUL'
        : (stokKartGrupEslesir(record, 'IPLIK') ? 'IPLIK' : 'KUMAS');
    const editMode = kartGrup === 'IPLIK' ? 'IPLIK_KART_GIRIS' : kartGrup === 'MAMUL' ? 'MAMUL_KART_GIRIS' : 'KUMAS_KART_GIRIS';
    if (editMode === 'KUMAS_KART_GIRIS') kumasKartGirisTipi = kumasKartTipiOku(record);
    setAppMode(editMode, true);
    closeModal({ target: { id: 'detail-modal' } });
    const fc = document.getElementById('form-container');
    const cb = document.getElementById('cancel-edit-btn');
    if (fc) fc.style.display = 'block';
    if (cb) cb.style.display = 'block';
    const ft = document.getElementById('form-title');
    if (ft) ft.innerText = 'Kayıt Güncelleme';
    renderInputs();
    syncKartGirisBaslik(editMode, record);
    setTimeout(() => kartGirisFormDoldur(record, editMode), 80);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
function editMamulKartFromListe(idxOrKod) {
    if (typeof idxOrKod === 'number') {
        const hit = currentData[idxOrKod];
        if (hit) { editRecordFromList(idxOrKod); return; }
        erpToast('Kayıt bulunamadı. Listeyi yenileyip tekrar deneyin.', 'warn');
        return;
    }
    const kod = String(idxOrKod || '').trim().toUpperCase();
    const ana = mamulAnaKodBul(kod) || kod;
    let record = mamulKartAnaKayitBul(ana);
    if (!record) {
        const idx = currentData.findIndex(r => String(r.desen_kodu || '').trim().toUpperCase() === kod);
        if (idx >= 0) { editRecordFromList(idx); return; }
        erpToast('Düzenlenecek mamül kartı bulunamadı: ' + ana, 'warn');
        return;
    }
    const idx = currentData.findIndex(r => String(r.id) === String(record.id));
    if (idx >= 0) editRecordFromList(idx);
    else stokKartDuzenleAc(record);
}
function mamulKartDetayliEslestir(kayit, filtre) {
    const f = filtre || mamulKartAramaFiltre;
    const blob = mamulKartAramaBlob(kayit);
    const tek = String(f.q || '').trim().toLowerCase();
    if (tek) {
        const kelimeler = tek.split(/\s+/).filter(Boolean);
        if (!kelimeler.every(w => blob.includes(w))) return false;
    }
    if (f.firma && !blob.includes(String(f.firma).trim().toLowerCase())) return false;
    if (f.urun && !blob.includes(String(f.urun).trim().toLowerCase())) return false;
    if (f.desen && !blob.includes(String(f.desen).trim().toLowerCase())) return false;
    if (f.kumas && !blob.includes(String(f.kumas).trim().toLowerCase())) return false;
    if (f.renk && !blob.includes(String(f.renk).trim().toLowerCase())) return false;
    if (f.tezgah && !blob.includes(String(f.tezgah).trim().toLowerCase())) return false;
    if (f.takip && !blob.includes(String(f.takip).trim().toLowerCase())) return false;
    if (f.kod) {
        const kod = String(kayit.desen_kodu || kayit.stok_kodu || '').toUpperCase();
        if (!kod.includes(String(f.kod).trim().toUpperCase())) return false;
    }
    if (f.numune) {
        const nu = numuneNotTagOku(kayit.notlar, 'NUMUNE_KAYNAK') || String(kayit.desen_kodu || '');
        if (!nu.toUpperCase().includes(String(f.numune).trim().toUpperCase())) return false;
    }
    return true;
}
function mamulKaynakKartlariTopla() {
    const lib = dataCache.kumas_kutuphanesi || [];
    const kaynaklar = [];
    lib.forEach(k => {
        const kod = String(k.desen_kodu || '').trim();
        if (!kod) return;
        if (urunKimligiNumunedenMi(k)) {
            kaynaklar.push({ tip: 'KIMLIK', kayit: k, kod, etiket: 'Ürün kimliği (SM)', alt: k.urun_adi || k.desen_adi || '' });
        } else if (kumasKutuphanesiKartiMamulMu(k)) {
            kaynaklar.push({ tip: 'MAMUL', kayit: k, kod, etiket: 'Mamül stok kartı', alt: k.urun_adi || k.desen_adi || '' });
        }
    });
    return kaynaklar.sort((a, b) => String(b.kayit?.created_at || '').localeCompare(String(a.kayit?.created_at || '')));
}
function mamulKaynakAraListele(q, limit = 14) {
    const filtre = { ...mamulKartAramaFiltre, q: q || mamulKartAramaFiltre.q };
    return mamulKaynakKartlariTopla()
        .filter(item => mamulKartDetayliEslestir(item.kayit, filtre))
        .slice(0, limit);
}
function mamulKartAramaFiltreAlanGuncelle(alan, deger) {
    mamulKartAramaFiltre[alan] = deger || '';
    saveUiState({ mamulKartAramaFiltre });
    const el = document.activeElement;
    window._mamulKartFiltreFocus = {
        id: el?.id || '',
        pos: (el && typeof el.selectionStart === 'number') ? el.selectionStart : null
    };
    clearTimeout(mamulKartAramaDebounceTimer);
    mamulKartAramaDebounceTimer = setTimeout(() => {
        if (appMode === 'KART_LISTE' && archiveTab === 'MAMUL') loadData();
    }, 280);
}
function mamulKartAramaFiltreSifirla() {
    mamulKartAramaFiltre = { q: '', firma: '', urun: '', kod: '', desen: '', kumas: '', renk: '', tezgah: '', takip: '', numune: '' };
    mamulKartListeHizliFiltre = 'HEPSI';
    mamulKartAramaDetayAcik = false;
    saveUiState({ mamulKartAramaFiltre, mamulKartListeHizliFiltre });
    const search = document.getElementById('search');
    if (search) search.value = '';
    ['mka-q', 'mka-firma', 'mka-urun', 'mka-kod', 'mka-desen', 'mka-kumas', 'mka-renk', 'mka-tezgah', 'mka-takip', 'mka-numune'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    loadData();
}
function fillMamulKartFromKaynak(kaynak, yeniMamulKodu) {
    if (!kaynak) return;
    const mv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
    if (yeniMamulKodu) mv('val-kodu', yeniMamulKodu);
    mv('val-urun-adi', (kaynak.urun_adi || kaynak.desen_adi || '').toUpperCase());
    mv('val-firma', (kaynak.firma || '').toUpperCase());
    mv('val-desen-adi', (kaynak.desen_adi || kaynak.urun_adi || '').toUpperCase());
    mv('val-renk', kaynak.renk || '');
    mv('val-mamul-en', kaynak.mamul_en || kaynak.ham_en || '');
    mv('val-mamul-boy', kaynak.mamul_boy || kaynak.ham_boy || '');
    mv('val-mamul-gsm', kaynak.mamul_gsm || kaynak.ham_gsm || '');
    mv('val-agirlik', kaynak.mamul_gramaj || kaynak.agirlik || '');
    mv('val-ham-kumas-kodu', kaynak.ham_kumas_kodu || numuneUrunKimlikKoduBul(kaynak) || numuneNotTagOku(kaynak.notlar, 'URUN_KIMLIK') || '');
    mv('val-fiber', kaynak.fiber || kaynak.kumas_cinsi || kaynak.cozgu_cinsi || '');
    const nu = numuneNotTagOku(kaynak.notlar, 'NUMUNE_KAYNAK') || (String(kaynak.desen_kodu || '').startsWith('NU') ? kaynak.desen_kodu : '');
    const sm = numuneUrunKimlikKoduBul(kaynak) || numuneNotTagOku(kaynak.notlar, 'URUN_KIMLIK');
    const bagNot = [
        nu ? 'Kaynak numune: ' + nu : '',
        sm ? 'Ürün kimliği: ' + sm : ''
    ].filter(Boolean).join('\n');
    mv('val-notlar', bagNot);
    if (kaynak.fotograf) erpFotoOnizleGuncelle(kaynak.fotograf);
    const ft = document.getElementById('form-title');
    if (ft) ft.innerText = 'Mamül Stok Kartı — ' + (kaynak.urun_adi || kaynak.desen_adi || kaynak.desen_kodu || 'Numuneden');
}
function mamulKaynakAraGoster(q) {
    const sonuc = document.getElementById('mamul-kaynak-ara-sonuc');
    if (!sonuc) return;
    const metin = String(q || '').trim();
    if (metin.length < 1) { sonuc.innerHTML = ''; return; }
    const matches = mamulKaynakAraListele(metin);
    window._mamulKaynakAraData = matches;
    if (!matches.length) {
        sonuc.innerHTML = `<div style="padding:12px;font-size:11px;color:var(--text3);text-align:center">Sonuç yok — farklı anahtar kelime veya detaylı filtre deneyin</div>`;
        return;
    }
    sonuc.innerHTML = matches.map((item, i) => {
        const k = item.kayit;
        const maBag = mamulStokKoduBul(k);
        const nuBag = numuneNotTagOku(k.notlar, 'NUMUNE_KAYNAK');
        const tipRenk = item.tip === 'MAMUL' ? 'var(--amber-c)' : item.tip === 'KIMLIK' ? 'var(--emerald-c)' : 'var(--cyan-c)';
        return `<div onclick="mamulKaynakSec(${i})" style="padding:10px 12px;cursor:pointer;border-bottom:1px solid var(--border);display:flex;gap:10px;align-items:flex-start"
            onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='transparent'">
            <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <span style="font-family:'DM Mono',monospace;font-size:10px;font-weight:700;color:${tipRenk}">${pdfEsc(item.kod)}</span>
                    <span style="font-size:9px;color:var(--text3)">${pdfEsc(item.etiket)}</span>
                    ${maBag ? `<span class="pill pill-amber" style="font-size:8px">MA: ${pdfEsc(maBag)}</span>` : ''}
                    ${nuBag ? `<span class="pill pill-cyan" style="font-size:8px">NU: ${pdfEsc(nuBag)}</span>` : ''}
                </div>
                <div style="font-size:11px;font-weight:600;color:var(--text);margin-top:3px">${pdfEsc(k.urun_adi || k.desen_adi || '—')}</div>
                <div style="font-size:9px;color:var(--text3);margin-top:2px">${pdfEsc(k.firma || '—')} · ${pdfEsc(item.alt || '')}</div>
            </div>
            <div style="font-size:9px;color:var(--text2);flex-shrink:0;font-weight:700">${item.tip === 'MAMUL' ? 'Aç' : 'Aktar'}</div>
        </div>`;
    }).join('');
}
async function mamulKaynakSec(idx) {
    const item = (window._mamulKaynakAraData || [])[idx];
    if (!item) return;
    const k = item.kayit;
    const sonuc = document.getElementById('mamul-kaynak-ara-sonuc');
    if (sonuc) sonuc.innerHTML = '';
    const inp = document.getElementById('mamul-kaynak-ara');
    if (inp) inp.value = item.kod + (k.urun_adi ? ' — ' + k.urun_adi : '');
    if (item.tip === 'MAMUL') {
        editingId = k.id;
        originalRecordSnapshot = { ...k };
        if (appMode !== 'MAMUL_KART_GIRIS') await setAppMode('MAMUL_KART_GIRIS', true);
        else { renderInputs(); loadData(); }
        erpToast('Mamül kartı açıldı: ' + item.kod, 'success');
        return;
    }
    const mevcutMa = mamulStokKoduBul(k) || ('');
    if (mevcutMa) {
        const maKayit = (dataCache.kumas_kutuphanesi || []).find(x => String(x.desen_kodu || '') === mevcutMa);
        if (maKayit) {
            editingId = maKayit.id;
            originalRecordSnapshot = { ...maKayit };
            if (appMode !== 'MAMUL_KART_GIRIS') await setAppMode('MAMUL_KART_GIRIS', true);
            else { renderInputs(); loadData(); }
            erpToast('Bağlı mamül kartı açıldı: ' + mevcutMa, 'success');
            return;
        }
    }
    editingId = null;
    originalRecordSnapshot = null;
    if (appMode !== 'MAMUL_KART_GIRIS') await setAppMode('MAMUL_KART_GIRIS');
    const yeniKod = await getNextStockCode('MA');
    renderInputs();
    setTimeout(() => {
        fillMamulKartFromKaynak(k, yeniKod);
        erpToast('Numune/kimlik bilgileri aktarıldı — kontrol edip kaydedin (' + yeniKod + ')', 'success', 5000);
    }, 120);
}
async function mamulStokKartiAc(desenKodu) {
    const kod = String(desenKodu || '').trim();
    if (!kod) return;
    let kart = (dataCache.kumas_kutuphanesi || []).find(k => String(k.desen_kodu || '') === kod && kumasKutuphanesiKartiMamulMu(k));
    if (!kart) {
        await syncAllData();
        kart = (dataCache.kumas_kutuphanesi || []).find(k => String(k.desen_kodu || '') === kod && kumasKutuphanesiKartiMamulMu(k));
    }
    if (!kart) { erpToast('Mamül stok kartı bulunamadı: ' + kod, 'warn'); return; }
    editingId = kart.id;
    originalRecordSnapshot = { ...kart };
    archiveTab = 'MAMUL';
    await setAppMode('MAMUL_KART_GIRIS', true);
}

/** SM ürün kimlik kartı notları — kaynak numune NU kodu burada */
function urunKimligiNumunedenMi(i) {
    if (!i) return false;
    const kod = String(i.desen_kodu || '').toUpperCase().trim();
    if (!kod.startsWith('SM-')) return false;
    if (numuneKayitTuruOku(i) === 'NUMUNE') return false;
    if (numuneKayitTuruOku(i) === 'URUN_KIMLIGI') return true;
    if (String(i.kaynak_birim || '').toUpperCase() === 'NUMUNE_ONAY') return true;
    return !!numuneNotTagOku(i.notlar, 'NUMUNE_KAYNAK');
}

let _numuneListeEylemBound = false;

async function erpAdminSaveV2Ready() {
    try {
        const { error } = await sb.rpc('erp_admin_user_save_v2', {
            p_token: 'probe',
            p_target_username: 'probe',
            p_allowed_modes: [],
            p_active: true,
            p_display_name: null,
            p_role: null
        });
        if (!error) return true;
        const msg = String(error.message || '');
        return !/Could not find|schema cache|PGRST202/i.test(msg);
    } catch (e) {
        return false;
    }
}

function erpAdminSaveErrorText(error, data) {
    const errMap = {
        kendi_rolu: 'Kendi yönetici rolünüzü kaldıramazsınız.',
        kendi_hesap: 'Kendi hesabınızı silemezsiniz.',
        son_yonetici: 'Son yönetici silinemez.',
        forbidden: 'Oturum süresi dolmuş olabilir — çıkış yapıp tekrar giriş yapın.',
        validasyon: 'Gönderilen veri geçersiz.',
        bulunamadı: 'Kullanıcı bulunamadı.',
        auth_tablo_eksik: 'Supabase kaydetme fonksiyonu eski sürüm. SQL kurulumunu çalıştırın.'
    };
    const msg = String(error?.message || '');
    if (/Could not find|schema cache|PGRST202|erp_admin_user_save_v2/i.test(msg)) {
        return 'Kaydetme fonksiyonu (save_v2) Supabase\'te yok. Üstteki kurulum adımlarını uygulayın.';
    }
    if (/Could not find|schema cache|PGRST202|erp_admin_user_delete/i.test(msg)) {
        return 'Silme fonksiyonu Supabase\'te yok. erp_auth_user_delete.sql kurulumunu çalıştırın.';
    }
    if (data?.err === 'auth_tablo_eksik') {
        return 'Eski kaydetme fonksiyonu aktif. SQL kurulumunu çalıştırın (save_v2).';
    }
    return errMap[data?.err] || data?.err || msg || 'bilinmiyor';
}

function erpAdminSavePayloadFromCard(root) {
    const u = root.dataset.user;
    const roleEl = root.querySelector('.erp-role');
    const role = roleEl ? roleEl.value : (root.dataset.role || 'user');
    let modes;
    if (role === 'admin') modes = [];
    else modes = [...root.querySelectorAll('.erp-mchk:checked')].map(c => c.value);
    const active = root.querySelector('.erp-active')?.checked !== false;
    const displayName = (root.querySelector('.erp-disp')?.value || '').trim();
    return {
        p_token: erpGetToken(),
        p_target_username: u,
        p_allowed_modes: modes,
        p_active: active,
        p_display_name: displayName || null,
        p_role: role
    };
}

async function erpAdminRpcUserSave(savePayload) {
    const v2 = await sb.rpc('erp_admin_user_save_v2', savePayload);
    if (!v2.error) return v2;
    const msg = String(v2.error.message || '');
    if (!/Could not find|schema cache|PGRST202/i.test(msg)) return v2;
    return sb.rpc('erp_admin_user_save', savePayload);
}

function erpAdminSupabaseProjectLabel() {
    try {
        const u = String(window.__ERP_SUPABASE?.url || '').trim();
        const m = u.match(/https:\/\/([^.]+)\.supabase\.co/i);
        return m ? m[1] : (u || '—');
    } catch (e) {
        return '—';
    }
}

async function erpAdminGetAuthFixSqlText() {
    if (window.__ERP_AUTH_TABLO_FIX_SQL) return window.__ERP_AUTH_TABLO_FIX_SQL;
    const urls = ['./assets/erp_auth_tablo_fix.sql', 'assets/erp_auth_tablo_fix.sql', './supabase/migrations/erp_auth_tablo_fix.sql'];
    for (const url of urls) {
        try {
            const res = await fetch(url);
            if (res.ok) return await res.text();
        } catch (e) {}
    }
    return '';
}

async function erpAdminCopyAuthFixSql() {
    const text = await erpAdminGetAuthFixSqlText();
    if (!text) {
        erpToast('SQL bulunamadı. Sayfayı Ctrl+F5 yenileyin.', 'error', 5000);
        return;
    }
    try {
        await navigator.clipboard.writeText(text);
        erpToast('SQL panoya kopyalandı → Supabase SQL Editor\'a yapıştırıp Run edin.', 'success', 8000);
    } catch (e) {
        erpToast('Panoya kopyalanamadı — SQL dosyasını indirin.', 'warning', 6000);
    }
}

async function erpAdminDownloadAuthFixSql() {
    const text = await erpAdminGetAuthFixSqlText();
    if (!text) {
        erpToast('SQL bulunamadı. Sayfayı Ctrl+F5 yenileyin.', 'error', 5000);
        return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/sql;charset=utf-8' }));
    a.download = 'erp_auth_tablo_fix.sql';
    a.click();
    URL.revokeObjectURL(a.href);
    erpToast('SQL indirildi → Supabase SQL Editor\'da Run edin.', 'success', 7000);
}

async function erpAdminRecheckSaveV2() {
    const ok = await erpAdminSaveV2Ready();
    if (ok) {
        erpToast('Kurulum tamam — kaydetme hazır.', 'success', 4000);
        await renderKullaniciYonetimi();
        return;
    }
    erpToast('save_v2 hâlâ yok. SQL\'i doğru Supabase projesinde çalıştırdığınızdan emin olun.', 'warning', 7000);
}

function erpAdminAuthFixBannerHtml(saveV2Ready) {
    if (saveV2Ready) return '';
    const proj = erpAdminSupabaseProjectLabel();
    return `
    <div class="panel-box" style="padding:14px 18px;margin-bottom:12px;border:1px solid rgba(248,113,113,0.45);background:rgba(248,113,113,0.08)">
        <div style="font-size:12px;font-weight:700;color:#f87171">Kullanıcı kaydetme henüz kurulmamış</div>
        <div style="font-size:10px;color:var(--text3);margin-top:6px;font-family:'DM Mono',monospace">Bağlı Supabase proje: <b style="color:var(--accent2)">${erpEscapeHtml(proj)}</b> — SQL bu projede çalıştırılmalı</div>
        <div style="font-size:10px;color:var(--text2);margin-top:10px;line-height:1.7">
            <b>1)</b>
            <button type="button" class="wizard-nav-btn" style="padding:4px 10px;font-size:9px;vertical-align:middle;margin:0 4px" onclick="erpAdminCopyAuthFixSql()">SQL kopyala</button>
            veya
            <button type="button" class="wizard-nav-btn" style="padding:4px 10px;font-size:9px;vertical-align:middle;margin:0 4px" onclick="erpAdminDownloadAuthFixSql()">indir</button><br>
            <b>2)</b> <a href="https://supabase.com/dashboard/project/${erpEscapeHtml(proj)}/sql/new" target="_blank" rel="noopener" style="color:var(--accent2)">Supabase SQL Editor</a> → yapıştır → <b>Run</b><br>
            <b>3)</b> Altta <code style="font-size:9px">save_v2_var = true</code> görün · 20 sn bekle ·
            <button type="button" class="wizard-nav-btn" style="padding:3px 8px;font-size:9px;vertical-align:middle" onclick="erpAdminRecheckSaveV2()">Kurulumu doğrula</button>
        </div>
    </div>`;
}

async function erpAdminSaveCard(btn) {
    const root = btn.closest('.erp-user-card');
    if (!root || !erpCurrentUser || erpCurrentUser.role !== 'admin') return;
    const u = root.dataset.user;
    const roleEl = root.querySelector('.erp-role');
    const role = roleEl ? roleEl.value : (root.dataset.role || 'user');
    const st = root.querySelector('.erp-admin-card-status');
    if (st) st.textContent = 'Kaydediliyor…';
    const savePayload = erpAdminSavePayloadFromCard(root);
    const { data, error } = await erpAdminRpcUserSave(savePayload);
    if (error || !data?.ok) {
        if (st) st.textContent = 'Hata: ' + erpAdminSaveErrorText(error, data);
        return;
    }
    root.dataset.role = role;
    if (u === erpCurrentUser.username) {
        erpCurrentUser.display_name = savePayload.p_display_name || erpCurrentUser.username;
        erpCurrentUser.allowed_modes = savePayload.p_allowed_modes;
        erpCurrentUser.active = savePayload.p_active;
        erpUpdateSidebarUser();
        erpApplyNavPermissions();
    }
    if (st) st.textContent = 'Kaydedildi.';
    const idx = erpAdminUsersCache.findIndex(x => x.username === u);
    if (idx >= 0) {
        erpAdminUsersCache[idx] = {
            ...erpAdminUsersCache[idx],
            display_name: savePayload.p_display_name || erpAdminUsersCache[idx].display_name,
            role: savePayload.p_role || erpAdminUsersCache[idx].role,
            active: savePayload.p_active,
            allowed_modes: savePayload.p_allowed_modes
        };
    }
    setTimeout(() => { if (st) st.textContent = ''; }, 2500);
}

function erpAdminForgetPassword(username) {
    if (!username) return;
    const key = String(username).toLowerCase();
    const c = erpAdminPwCacheLoad();
    if (!c[key]) return;
    delete c[key];
    try { localStorage.setItem(ERP_ADMIN_PW_KEY, JSON.stringify(c)); } catch (e) {}
}

function erpAdminCloseDeleteConfirm() {
    const el = document.getElementById('erp-admin-delete-confirm');
    if (el) {
        try { el.remove(); } catch (e) {}
    }
}

function erpAdminOpenDeleteConfirm(username, displayName, onConfirm) {
    erpAdminCloseDeleteConfirm();
    const un = erpEscapeHtml(username || '');
    const dn = erpEscapeHtml(displayName || username || '');
    const host = document.createElement('div');
    host.id = 'erp-admin-delete-confirm';
    host.className = 'erp-admin-delete-overlay';
    host.innerHTML = `
        <div class="erp-admin-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="erp-admin-delete-title">
            <div class="erp-admin-delete-title" id="erp-admin-delete-title">Kullanıcıyı sil</div>
            <p class="erp-admin-delete-msg">
                <strong>${dn}</strong> (<code style="font-size:10px">${un}</code>) hesabı kalıcı olarak silinecek.
                <span class="erp-admin-delete-warn">Bu işlem geri alınamaz.</span>
            </p>
            <div class="erp-admin-delete-actions">
                <button type="button" class="erp-admin-save-btn" id="erp-admin-delete-cancel">İptal</button>
                <button type="button" class="erp-admin-del-btn" id="erp-admin-delete-ok">Evet, sil</button>
            </div>
        </div>`;
    document.body.appendChild(host);
    host.addEventListener('click', e => { if (e.target === host) erpAdminCloseDeleteConfirm(); });
    host.querySelector('#erp-admin-delete-cancel')?.addEventListener('click', erpAdminCloseDeleteConfirm);
    host.querySelector('#erp-admin-delete-ok')?.addEventListener('click', async () => {
        erpAdminCloseDeleteConfirm();
        if (typeof onConfirm === 'function') await onConfirm();
    });
}

async function erpAdminDeleteUser(btn) {
    const root = btn.closest('.erp-user-card');
    if (!root || !erpCurrentUser || erpCurrentUser.role !== 'admin') return;
    const u = root.dataset.user;
    const st = root.querySelector('.erp-admin-card-status');
    if (!u || u === erpCurrentUser.username) {
        if (st) st.textContent = 'Kendi hesabınızı silemezsiniz.';
        return;
    }
    const label = root.querySelector('.erp-disp')?.value?.trim() || u;
    erpAdminOpenDeleteConfirm(u, label, async () => {
        if (st) st.textContent = 'Siliniyor…';
        const { data, error } = await sb.rpc('erp_admin_user_delete', {
            p_token: erpGetToken(),
            p_target_username: u
        });
        if (error || !data?.ok) {
            if (st) st.textContent = 'Hata: ' + erpAdminSaveErrorText(error, data);
            return;
        }
        erpAdminForgetPassword(u);
        erpAdminUsersCache = erpAdminUsersCache.filter(x => x.username !== u);
        erpAdminUi.selected = erpAdminUsersCache[0]?.username || '';
        erpAdminPaintFromCache(window.__erpAdminSaveV2Ready);
        erpToast('Kullanıcı silindi.', 'success');
    });
}

async function erpAdminPassword(btn) {
    const root = btn.closest('.erp-user-card');
    if (!root || !erpCurrentUser || erpCurrentUser.role !== 'admin') return;
    const u = root.dataset.user;
    const inp = root.querySelector('.erp-newpass');
    const pw = inp?.value || '';
    const st = root.querySelector('.erp-admin-card-status');
    if (pw.length < 8) {
        if (st) st.textContent = 'Şifre en az 8 karakter.';
        return;
    }
    if (st) st.textContent = 'Şifre güncelleniyor…';
    const { data, error } = await sb.rpc('erp_admin_user_password', {
        p_token: erpGetToken(),
        p_target_username: u,
        p_new_password: pw
    });
    if (inp) inp.value = '';
    if (error || !data?.ok) {
        if (st) st.textContent = 'Hata: ' + (error?.message || data?.err || 'bilinmiyor');
        return;
    }
    erpAdminRememberPassword(u, pw);
    erpAdminPaintFromCache(window.__erpAdminSaveV2Ready);
    if (st) st.textContent = 'Şifre güncellendi.';
    setTimeout(() => { if (st) st.textContent = ''; }, 2500);
}

async function erpAdminCreateUser(btn) {
    const root = btn.closest('.erp-newuser-card');
    if (!root || !erpCurrentUser || erpCurrentUser.role !== 'admin') return;
    const u = (root.querySelector('.erp-nu-user')?.value || '').trim().toLowerCase();
    const pw = root.querySelector('.erp-nu-pass')?.value || '';
    const dn = (root.querySelector('.erp-nu-disp')?.value || '').trim();
    const role = root.querySelector('.erp-nu-role')?.value || 'user';
    const modes = [...root.querySelectorAll('.erp-nuchk:checked')].map(c => c.value);
    const st = root.querySelector('.erp-nu-status');
    if (u.length < 2) { if (st) st.textContent = 'Kullanıcı adı kısa.'; return; }
    if (pw.length < 8) { if (st) st.textContent = 'Şifre en az 8 karakter.'; return; }
    if (st) st.textContent = 'Oluşturuluyor…';
    const { data, error } = await sb.rpc('erp_admin_user_create', {
        p_token: erpGetToken(),
        p_username: u,
        p_password: pw,
        p_display_name: dn || u,
        p_role: role,
        p_allowed_modes: role === 'admin' ? [] : modes
    });
    if (error || !data?.ok) {
        if (st) st.textContent = 'Hata: ' + (error?.message || data?.err || 'bilinmiyor');
        return;
    }
    erpAdminRememberPassword(u, pw);
    root.querySelector('.erp-nu-user').value = '';
    root.querySelector('.erp-nu-pass').value = '';
    root.querySelector('.erp-nu-disp').value = '';
    if (st) st.textContent = 'Kullanıcı oluşturuldu.';
    erpAdminUi.showNew = false;
    erpAdminUi.selected = u;
    await renderKullaniciYonetimi();
}

// --- VERİ SENKRONİZASYONU ---
function erpSyncQuery(table, light) {
    let cols = '*';
    if (table === 'siparisler') {
        cols = erpSyncSiparisCols('light');
    } else if (light) {
        cols = erpSyncLightCols(table);
    }
    if (table === 'tezgahlar') {
        return sb.from(table).select(cols).order('tezgah_no', { ascending: true });
    }
    return sb.from(table).select(cols).order('created_at', { ascending: false });
}

async function erpSyncFetchTable(table, light, fetchOpts) {
    fetchOpts = fetchOpts || {};
    const mobil = typeof document !== 'undefined' && document.body?.classList?.contains('erp-mobil-lite');
    const paged = table === 'siparisler' || table === 'kumas_kutuphanesi' || mobil;
    if (paged) {
        const useLight = table === 'siparisler' ? true : !!light;
        const pageOpts = { ...fetchOpts };
        if (table !== 'siparisler' && table !== 'kumas_stok' && table !== 'iplik_stok' && table !== 'kumas_kutuphanesi' && !pageOpts.maxPages) {
            pageOpts.maxPages = 10;
        }
        let out = await erpSyncFetchTablePaged(table, useLight, pageOpts);
        if (out?.error && !pageOpts._retried) {
            await new Promise(r => setTimeout(r, 1200));
            out = await erpSyncFetchTablePaged(table, useLight, { ...pageOpts, _retried: true });
        }
        if (out?.error && out.partial?.length) {
            return { data: out.partial, error: null, truncated: true };
        }
        return out;
    }
    let out = await erpWithTimeout(erpSyncQuery(table, light), table);
    if (out?.error && light) {
        out = await erpWithTimeout(erpSyncQuery(table, false), table);
    }
    return out;
}

/** loadData() yalnızca liste/hareket ekranlarında #main-list'i doldurur. Özel ekranlarda çağrılırsa içeriği siler (beyaz sayfa). */
function erpModeLoadDataGuvenliMi(mode = appMode) {
    return [
        'IPLIK', 'KUMAS', 'HAM_KUMAS', 'MAMUL_KUMAS', 'MAMUL_DEPO',
        'DEPO_HAREKET', 'DEPO_HAREKET_LISTE',
        'SIPARIS_LISTE', 'SIPARIS_KAPANAN', 'SIPARIS_GIRIS',
        'KART_LISTE', 'KART_GIRIS', 'IPLIK_KART_GIRIS', 'KUMAS_KART_GIRIS', 'MAMUL_KART_GIRIS'
    ].includes(mode);
}

function erpDetailKayitBul() {
    if (_detailOpenRecordId != null) {
        const sid = String(_detailOpenRecordId);
        const fromCache = (dataCache.siparisler || []).find(s => String(s.id) === sid);
        if (fromCache) return fromCache;
        const fromList = (currentData || []).find(s => String(s.id) === sid);
        if (fromList) return fromList;
    }
    if (selectedIndex != null && currentData?.[selectedIndex]) return currentData[selectedIndex];
    return null;
}

async function erpRefreshCurrentScreen(opts = {}) {
    const force = !!opts.force;
    const mode = appMode;
    if (!force && erpIsDetailModalOpen()) {
        erpScheduleDeferredUiRefresh();
        return;
    }
    try {
        if (mode === 'DASHBOARD') {
            if (typeof setAppMode === 'function') setAppMode(window.ERP_MOBIL_BOOT_MODE || 'SIPARIS_LISTE');
            return;
        }
        if (mode === 'PLANLAMA') {
            if (typeof renderPlanlama === 'function') await renderPlanlama();
            return;
        }
        if (mode === 'DOKUMA_TAKIP') {
            if (!force && erpShouldDeferUiRefresh()) {
                erpScheduleDeferredUiRefresh();
                return;
            }
            if (typeof renderDokumaTakip === 'function') await renderDokumaTakip();
            return;
        }
        if (mode === 'KONFEKSIYON') {
            if (!force && erpIsUserEditingUi()) return;
            if (typeof renderKonfeksiyon === 'function') renderKonfeksiyon();
            return;
        }
        if (mode === 'KONFEKSIYON_KESIM') {
            if (!force && erpIsUserEditingUi()) return;
            if (typeof renderKonfeksiyonKesimEkrani === 'function') renderKonfeksiyonKesimEkrani();
            return;
        }
        if (mode === 'KONFEKSIYON_PLANLAMA') {
            if (typeof renderKonfeksiyonPlanlama === 'function') renderKonfeksiyonPlanlama();
            else if (typeof openKonfeksiyonPlanlama === 'function') openKonfeksiyonPlanlama();
            return;
        }
        if (mode === 'FASON_TAKIP') {
            if (typeof renderFasonTakip === 'function') renderFasonTakip();
            return;
        }
        if (mode === 'DOKUMA_FASON_TAKIP') {
            if (typeof renderDokumaFasonTakip === 'function') renderDokumaFasonTakip();
            return;
        }
        if (mode === 'HASIL_TAKIP') {
            if (typeof renderHasilTakip === 'function') renderHasilTakip();
            return;
        }
        if (mode === 'KONFEKSIYON_YIKAMA') {
            if (typeof renderKonfeksiyon === 'function') renderKonfeksiyon();
            return;
        }
        if (mode === 'YAPILACAKLAR') {
            if (typeof renderYapilacaklar === 'function') await renderYapilacaklar();
            return;
        }
        if (mode === 'DOKUMA_SEVK_GECMIS') {
            if (typeof renderDokumaSevkGecmisi === 'function') renderDokumaSevkGecmisi();
            return;
        }
        if (mode === 'DASHBOARD') {
            if (typeof renderDashboard === 'function') renderDashboard();
            return;
        }
        if (mode === 'URUN_AGACI' || mode === 'TEKNIK_FOY') {
            if (!force && erpIsUserEditingUi()) return;
            if (typeof renderUrunAgaci === 'function') renderUrunAgaci();
            return;
        }
        if (mode === 'RAPORLAR' || mode === 'RAPOR') {
            if (typeof renderRaporlar === 'function') renderRaporlar();
            return;
        }
        if (mode === 'KULLANICI_YONETIMI') {
            if (typeof renderKullaniciYonetimi === 'function') await renderKullaniciYonetimi();
            return;
        }
        if (mode === 'STOK_SAYIM') {
            if (!force && erpShouldDeferUiRefresh()) {
                erpScheduleDeferredUiRefresh();
                return;
            }
            // Aktif sayımda tam yeniden çizim yazılan adetleri silmesin
            if (!force && typeof sayimOturumAktifMi === 'function' && sayimOturumAktifMi()) {
                return;
            }
            if (typeof renderStokSayim === 'function') renderStokSayim();
            return;
        }
        if (mode === 'MUHASEBE_FIS') {
            if (typeof renderMuhasebeFisListe === 'function') renderMuhasebeFisListe({ quiet: true });
            return;
        }
        if (erpModeLoadDataGuvenliMi(mode) && typeof loadData === 'function') {
            if (!force && erpIsUserEditingUi() && !['SIPARIS_LISTE', 'SIPARIS_KAPANAN', 'KART_LISTE', 'IPLIK', 'KUMAS', 'MAMUL_DEPO', 'DEPO_HAREKET_LISTE'].includes(mode)) {
                erpScheduleDeferredUiRefresh();
                return;
            }
            if (!force && mode === 'SIPARIS_LISTE'
                && typeof siparisListeAramaYenile === 'function') {
                siparisListeAramaYenile();
                return;
            }
            loadData();
        }
    } catch (e) {
        console.warn('erpRefreshCurrentScreen:', e?.message || e);
    }
}

function erpSyncRefreshUi() {
    updateSummary();
    if (erpShouldDeferUiRefresh()) {
        erpScheduleDeferredUiRefresh();
        return;
    }
    erpRefreshCurrentScreen({ force: false });
}

// ── Canlı senkron: başka bilgisayardan girilen veri anında görünsün ──
/* ERP_LIVE_POLL_MS: ana programın çekirdeğinden gelir (assets/erp-core.js) */
/* ERP_LIVE_POLL_MS_REALTIME: ana programın çekirdeğinden gelir (assets/erp-core.js) */
let _erpLiveBusy = false;
let _erpLiveLastAppliedAt = 0;
window.erpLiveApplyPending = erpLiveApplyPending;

function erpLiveInvalidateFromPayload(table, payload) {
    if (table !== 'siparis_akis') return;
    const row = payload?.new || payload?.old || {};
    const tip = String(row.islem || '').trim();
    const sid = row.siparis_id;
    if (tip && sid != null && sid !== '') {
        const key = `${tip}_${sid}`;
        if (tip === 'KD_URUN_AGACI' && typeof uaIsKdDirty === 'function' && uaIsKdDirty(sid)) return;
        if (tip === 'KD_DOKUMA' && String(dtSeciliSiparisId) === String(sid) && typeof dtIsUserEditingUi === 'function' && dtIsUserEditingUi()) return;
        delete _kdCache[key];
        if (typeof _uaKdHydrated !== 'undefined') delete _uaKdHydrated[key];
        return;
    }
    Object.keys(_kdCache || {}).forEach(k => {
        const m = String(k).match(/^KD_URUN_AGACI_(.+)$/);
        if (m && typeof uaIsKdDirty === 'function' && uaIsKdDirty(m[1])) return;
        if (/^KD_|^KAPAMA|^YIKAMA/.test(k)) {
            delete _kdCache[k];
            if (typeof _uaKdHydrated !== 'undefined') delete _uaKdHydrated[k];
        }
    });
}

function erpLiveSchedulePull(reason, payloadMeta) {
    if (payloadMeta?.table) {
        const table = payloadMeta.table;
        const payload = payloadMeta.payload || {};
        erpLiveInvalidateFromPayload(table, payload);
        // Satır bazlı patch — full tablo çekme yok (masaüstü ile aynı)
        if (typeof erpLiveApplyPayload === 'function' && erpLiveApplyPayload(table, payload)) {
            if (document.hidden) {
                erpLiveShowPending(true);
                return;
            }
            if (_erpLiveDebounceTimer) clearTimeout(_erpLiveDebounceTimer);
            _erpLiveDebounceTimer = setTimeout(() => {
                try { if (typeof erpDataCachePersist === 'function') erpDataCachePersist(false); } catch (e) {}
                if (isSaveInProgress || (typeof erpShouldDeferUiRefresh === 'function' && erpShouldDeferUiRefresh())) {
                    erpLiveShowPending(true);
                    return;
                }
                erpLiveShowPending(false);
                try {
                    if (typeof updateSummary === 'function') updateSummary();
                    if (typeof erpRefreshCurrentScreen === 'function') {
                        Promise.resolve(erpRefreshCurrentScreen({ force: false })).catch(() => {});
                    } else if (typeof loadData === 'function') loadData();
                } catch (e) {}
                if (reason === 'realtime' || reason === 'remote' || reason === 'poll-change') {
                    const now = Date.now();
                    if (now - (_erpLiveLastToastAt || 0) > 15000) {
                        _erpLiveLastToastAt = now;
                        try { erpToast('Başka oturumdan veri güncellendi.', 'info', 2000); } catch (e) {}
                    }
                }
            }, ERP_LIVE_DEBOUNCE_MS);
            return;
        }
        if (table !== 'siparis_akis' && ERP_SYNC_TABLES.includes(table)) {
            _erpLiveDirtyTables.add(table);
        }
    }
    if (_erpLiveDebounceTimer) clearTimeout(_erpLiveDebounceTimer);
    _erpLiveDebounceTimer = setTimeout(() => {
        const tables = [..._erpLiveDirtyTables];
        _erpLiveDirtyTables.clear();
        erpLivePullAndRefresh({
            forceUi: false,
            reason: reason || 'remote',
            tables: tables.length ? tables : null
        });
    }, ERP_LIVE_DEBOUNCE_MS);
}

async function erpLivePullAndRefresh(opts = {}) {
    if (!erpIsSupabaseReady() || !erpCurrentUser) return;
    if (_erpLiveBusy || _syncAllDataBusy) {
        if (Array.isArray(opts.tables)) opts.tables.forEach(t => _erpLiveDirtyTables.add(t));
        erpLiveSchedulePull(opts.reason || 'busy-retry', null);
        return;
    }
    if (isSaveInProgress) return;
    _erpLiveBusy = true;
    erpLiveSetStatus('sync');
    try {
        await syncAllData(false, {
            silent: true,
            siparisLight: true,
            skipSummary: false,
            tables: opts.tables || undefined
        });
        _erpLiveLastAppliedAt = Date.now();
        if (opts.forceUi || !erpIsUserEditingUi()) {
            erpLiveShowPending(false);
            await erpRefreshCurrentScreen({ force: !!opts.forceUi });
            if (opts.reason === 'remote' || opts.reason === 'realtime' || opts.reason === 'poll-change') {
                const now = Date.now();
                if (now - (_erpLiveLastToastAt || 0) > 12000) {
                    _erpLiveLastToastAt = now;
                    try { erpToast('Başka oturumdan veri güncellendi.', 'info', 2200); } catch (e) {}
                }
            }
        } else {
            erpLiveShowPending(true);
        }
    } catch (e) {
        console.warn('erpLivePullAndRefresh:', e?.message || e);
    } finally {
        _erpLiveBusy = false;
        erpLiveSetStatus(_erpLiveRealtimeOk ? 'live' : 'poll');
    }
}

window.erpLiveSyncStart = erpLiveSyncStart;

/* ── Dokuma girişi canlı izleme (masaüstüyle aynı ilke) ─────────────
   18.09.2026: Dokuma Paneli KD_DOKUMA satırını YERİNDE günceller; siparis_akis'te
   updated_at yok — Realtime gelmezse genel yoklama bu değişikliği göremiyordu.
   Açık Dokuma Takip siparişinin ve açık sipariş penceresinin KD satırı birkaç
   saniyede bir karşılaştırılır; değiştiyse Realtime olayıyla aynı yoldan işlenir.
   Yalnız okuma yapar. */
window.erpLiveSyncStop = erpLiveSyncStop;

function erpCacheKayitGuncelle(table, kayit) {
    if (!table || !kayit || kayit.id == null || !Array.isArray(dataCache[table])) return;
    const idx = dataCache[table].findIndex(r => String(r.id) === String(kayit.id));
    const merged = idx === -1 ? { ...kayit } : { ...dataCache[table][idx], ...kayit };
    if (idx === -1) {
        dataCache[table] = [merged, ...dataCache[table]];
        if (table === 'siparisler') dataCache.siparisler = sortSiparislerBySno(dataCache.siparisler);
    } else {
        dataCache[table][idx] = merged;
    }
    if (table === 'kumas_kutuphanesi') stockCards = dataCache.kumas_kutuphanesi;
    if (table === 'siparisler') erpScheduleSiparisFotoLsMerge();
}

function erpStartListeDataPoll() {
    erpStopListeDataPoll();
    if (_erpLiveStarted) return;
    if (!erpListePollModMu()) return;
    const pollMs = window.ERP_MOBIL_NO_LIVE ? ERP_MOBIL_LISTE_POLL_MS : ERP_LISTE_POLL_MS;
    _erpDataPollTimer = setInterval(() => {
        if (document.hidden || _syncAllDataBusy || isSaveInProgress || erpShouldDeferUiRefresh()) return;
        if (!erpListePollModMu()) return;
        syncAllData(false, { silent: true, siparisLight: true })
            .then(() => erpSyncRefreshUi())
            .catch(() => {});
    }, pollMs);
}

async function erpAwaitSiparisFoto(ms = 8000) {
    const p = siparisFotoOkumaPromise || Promise.resolve();
    let tId;
    const timeout = new Promise(resolve => { tId = setTimeout(resolve, ms); });
    try {
        await Promise.race([p.catch(() => {}), timeout]);
    } finally {
        clearTimeout(tId);
        document.querySelectorAll('[id^="siparis-foto-busy-"]').forEach(el => el.remove());
    }
}

/** Mutasyon sonrası UI'yi bekletmeden ilgili tabloları sessizce tazele */
window.erpSyncTablesBackground = erpSyncTablesBackground;

async function syncAllData(isManual = false, opts = {}) {
    if (typeof isManual === 'object' && isManual !== null) { opts = isManual; isManual = !!opts.manual; }
    const mobilLite = typeof document !== 'undefined' && document.body?.classList?.contains('erp-mobil-lite');
    // Mobilde (ve otomatik senkronda) foto/blob kolonları çekilmez — select * zaman aşımı ve bellek hatası veriyor.
    const light = opts.full ? false
        : !!(opts.siparisLight || opts.light || !isManual || mobilLite);
    const silent = !!opts.silent;
    if (_syncAllDataBusy) {
        _syncAllDataPending = true;
        _syncAllDataPendingArgs = { isManual, opts: { ...opts, light, siparisLight: light || !!opts.siparisLight } };
        return;
    }
    _syncAllDataBusy = true;
    const spinner = document.getElementById('loading-spinner');
    const onceki = erpDataCacheClone();
    let applied = false;
    if (!silent) spinner?.classList.remove('hidden');
    try {
        if (!sb) throw new Error('Supabase bağlantısı yok — sayfayı yenileyip tekrar deneyin');
        const want = Array.isArray(opts.tables) && opts.tables.length
            ? opts.tables.map(String)
            : ERP_SYNC_TABLES;
        const tables = want.filter(t => ERP_SYNC_TABLES.includes(t));
        if (!tables.length) return;
        const settled = await Promise.allSettled(
            tables.map(t => erpSyncFetchTable(t, light, t === 'siparisler' ? (opts.siparisFirstPageOnly ? { maxPages: 1 } : {}) : {}))
        );
        const hatalar = [];
        settled.forEach((res, i) => {
            const key = tables[i];
            if (res.status === 'rejected') {
                hatalar.push(`${key}: ${erpSyncFriendlyError(res.reason?.message || res.reason)}`);
                if (onceki[key]?.length) dataCache[key] = onceki[key];
                return;
            }
            const out = res.value;
            if (out?.error) {
                hatalar.push(`${key}: ${erpSyncFriendlyError(out.error.message || 'hata')}`);
                if (onceki[key]?.length) dataCache[key] = onceki[key];
                return;
            }
            let rows = out.data || [];
            if (key === 'siparisler') {
                const useUnion = light || opts.siparisFirstPageOnly || out?.truncated;
                if (useUnion) rows = erpSyncUnionSiparisler(rows, onceki[key]);
            } else if (out?.truncated) {
                rows = erpSyncUnionById(rows, onceki[key]);
            }
            if (light) rows = erpDataCacheMergeTable(key, rows, onceki[key]);
            if (key === 'siparisler') {
                dataCache.siparisler = sortSiparislerBySno(rows);
                erpScheduleSiparisFotoLsMerge();
            } else if (key === 'tezgahlar') {
                dataCache.tezgahlar = sortTezgahlarByTezgahNo(rows).map(t => ({
                    ...t,
                    id: t?.id ?? t?.iden ?? null
                }));
            } else {
                dataCache[key] = rows;
            }
        });
        applied = true;
        stockCards = dataCache.kumas_kutuphanesi;
        try {
            if (!opts.skipSummary) updateSummary();
            erpDataCachePersist(!!isManual);
        } catch (uiErr) {
            console.warn('syncAllData UI:', uiErr?.message || uiErr);
        }
        if (hatalar.length) {
            console.warn('syncAllData kısmi hata:', hatalar.join(' | '));
            if (isManual) showToast(`Kısmi senkronizasyon: ${hatalar[0]}`, 'warn');
        } else if (isManual || (opts.tables || []).includes('siparisler')) {
            if (!opts.skipScreenRefresh) {
                try { erpRefreshCurrentScreen({ force: isManual }); } catch (e) {}
            }
            if (isManual && !silent && !opts.skipScreenRefresh) showToast('Senkron tamam', 'success');
        }
    } catch (err) {
        console.error("Veri çekme hatası:", err);
        if (!applied) {
            Object.assign(dataCache, onceki);
            stockCards = dataCache.kumas_kutuphanesi;
        }
        if (isManual) {
            const msg = erpSyncFriendlyError(err?.message || 'Bilinmeyen hata');
            showToast(`Senkronizasyon hatası: ${msg}`, 'error');
        }
    } finally {
        _syncAllDataBusy = false;
        if (!silent) spinner?.classList.add('hidden');
        if (_syncAllDataPending) {
            const pending = _syncAllDataPendingArgs;
            _syncAllDataPending = false;
            _syncAllDataPendingArgs = null;
            setTimeout(() => syncAllData(pending.isManual, pending.opts), 0);
        }
    }
}
window.syncAllData = syncAllData;

window.erpSuperYenile = erpSuperYenile;

window.toggleNavGroup = toggleNavGroup;

/** Ürün (kalem) satırı için 0–100: yüksek = kapatmaya daha yakın (kolay → zor sıralama) */
/** Sevk / hedef — saf sevkiyat tamamlanması (%) */
let _planlamaNotlarAra = '';

function planlamaNotlariTopla(siparisler) {
    const out = [];
    for (const s of (siparisler || [])) {
        if (String(s.durum || '').toUpperCase() === 'TAMAMLANDI') continue;
        const sid = String(s.id || '');
        if (!sid) continue;
        const sno = String(s.sno || '—').trim();
        const firma = String(s.firma || '').trim();
        if (erpIsAdmin()) {
            siparisNotlariParse(s.notlar).forEach(item => {
                if (!item.metin) return;
                const suffix = item.yapildi ? ' ✓ Yapıldı' : '';
                out.push({
                    siparisId: sid,
                    sno,
                    firma,
                    urun: 'Sipariş geneli',
                    kalemIdx: -1,
                    not: item.metin + suffix,
                    tip: 'admin',
                    yapildi: !!item.yapildi
                });
            });
        }
        siparisListeKalemleriArr(s).forEach((k, i) => {
            const not = String(k.not || k.notlar || '').trim();
            if (!not) return;
            out.push({
                siparisId: sid,
                sno,
                firma,
                urun: String(k.ad || k.kod || `Kalem ${i + 1}`).trim(),
                kalemIdx: i,
                not,
                tip: 'kalem'
            });
        });
    }
    out.sort((a, b) => {
        const c = String(a.sno).localeCompare(String(b.sno), 'tr', { numeric: true });
        if (c) return c;
        if (a.tip !== b.tip) return a.tip === 'admin' ? -1 : 1;
        return String(a.urun).localeCompare(String(b.urun), 'tr');
    });
    return out;
}

function planlamaNotlarListeHtml(siparisler) {
    const q = planlamaNormUrunMetin(_planlamaNotlarAra);
    const rows = planlamaNotlariTopla(siparisler).filter(r => {
        if (!q) return true;
        const blob = [r.sno, r.firma, r.urun, r.not].map(x => planlamaNormUrunMetin(x)).join(' ');
        return blob.includes(q);
    });
    if (!rows.length) {
        return `<div style="padding:16px;text-align:center;color:var(--text3);font-size:11px">${q ? 'Aramaya uyan not yok.' : 'Aktif siparişlerde not bulunmuyor.'}</div>`;
    }
    return `<div style="display:flex;flex-direction:column;gap:6px;max-height:min(52vh,480px);overflow-y:auto;padding-right:2px">
        ${rows.map(r => {
            const tipLbl = r.tip === 'admin'
                ? '<span class="pill pill-amber" style="font-size:7px;padding:1px 5px;margin-right:4px">Yönetici</span>'
                : '';
            const sidJs = JSON.stringify(r.siparisId);
            return `<button type="button" class="planlama-not-satir" onclick="planlamaSiparisDurumModalAc(${sidJs})" title="Sipariş genel durumu aç">
                <div class="planlama-not-satir-ust">
                    <span class="planlama-not-sno">${pdfEsc(r.sno)}</span>
                    <span class="planlama-not-urun">${tipLbl}${pdfEsc(r.urun)}</span>
                </div>
                <div class="planlama-not-firma">${pdfEsc(r.firma || '—')}</div>
                <div class="planlama-not-metin${r.yapildi ? ' planlama-not-metin--yapildi' : ''}">${pdfEsc(r.not)}</div>
            </button>`;
        }).join('')}
    </div>`;
}

function planlamaNotlarAraGuncelle(val) {
    _planlamaNotlarAra = String(val || '');
    const host = document.getElementById('planlama-notlar-list');
    if (!host) return;
    const siparisler = (dataCache.siparisler || []).filter(s => String(s.durum || '').toUpperCase() !== 'TAMAMLANDI');
    host.innerHTML = planlamaNotlarListeHtml(siparisler);
}

function renderPlanlamaNotlarPanel(siparisler) {
    const allRows = planlamaNotlariTopla(siparisler);
    if (!allRows.length) return '';
    const adminSay = allRows.filter(r => r.tip === 'admin').length;
    const kalemSay = allRows.filter(r => r.tip === 'kalem').length;
    return `<div class="panel-box planlama-notlar-panel" style="padding:12px 14px;border:1px solid rgba(251,191,36,0.28)">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px">
            <div>
                <div style="font-size:10px;font-weight:800;color:var(--amber-c);text-transform:uppercase;letter-spacing:.06em;font-family:'DM Mono',monospace">📝 Notlar</div>
                <div style="font-size:9px;color:var(--text3);margin-top:4px;line-height:1.45">
                    ${allRows.length} kayıt${adminSay ? ` · ${adminSay} yönetici` : ''}${kalemSay ? ` · ${kalemSay} kalem` : ''}
                    · Satıra tıklayınca <b>sipariş durum inceleme</b> açılır
                </div>
            </div>
            <input id="planlama-notlar-ara" class="pro-input" placeholder="Sipariş no, ürün, not ara..." value="${pdfEsc(_planlamaNotlarAra)}" oninput="planlamaNotlarAraGuncelle(this.value)" style="flex:0 1 240px;min-width:140px;padding:6px 10px;font-size:10px">
        </div>
        <div id="planlama-notlar-list">${planlamaNotlarListeHtml(siparisler)}</div>
    </div>`;
}

function planlamaSiparisDurumModalAc(siparisId) {
    fasonTakipSiparisIncelemeAc(siparisId);
}

const PLANLAMA_SIPARIS_BIRLESTIR_KEY = 'erp_planlama_siparis_birlestir_v1';
let _planlamaBirlestirDetayId = '';
let _planlamaBirlestirModalAcik = false;
let _planlamaBirlestirSecimIds = [];

function planlamaBirlestirStoreGet() {
    try {
        const arr = JSON.parse(localStorage.getItem(PLANLAMA_SIPARIS_BIRLESTIR_KEY) || '[]');
        return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
}
function planlamaBirlestirStoreSet(arr) {
    try { localStorage.setItem(PLANLAMA_SIPARIS_BIRLESTIR_KEY, JSON.stringify(arr || [])); } catch (e) {}
}
function planlamaNormUrunMetin(v) {
    return String(v || '').trim().toLocaleUpperCase('tr-TR').replace(/\s+/g, ' ');
}
function planlamaUrunMetinSade(v) {
    return planlamaNormUrunMetin(v)
        .replace(/\([^)]*\)/g, ' ')
        .replace(/[^A-Z0-9ÇĞİÖŞÜ\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function planlamaUrunMetinTokenler(v) {
    return planlamaUrunMetinSade(v).split(/\s+/).filter(t => t.length >= 2);
}
function planlamaUrunLevenshteinOran(a, b) {
    if (a === b) return 1;
    const la = a.length;
    const lb = b.length;
    if (!la || !lb) return 0;
    if (Math.max(la, lb) > 96) return 0;
    const dp = Array.from({ length: la + 1 }, () => new Array(lb + 1).fill(0));
    for (let i = 0; i <= la; i++) dp[i][0] = i;
    for (let j = 0; j <= lb; j++) dp[0][j] = j;
    for (let i = 1; i <= la; i++) {
        for (let j = 1; j <= lb; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        }
    }
    const dist = dp[la][lb];
    return 1 - dist / Math.max(la, lb);
}
function planlamaUrunMetinBenzerlik(a, b) {
    const x = planlamaUrunMetinSade(a);
    const y = planlamaUrunMetinSade(b);
    if (!x || !y) return 0;
    if (x === y) return 1;
    const minKisa = 4;
    if (x.length >= minKisa && y.length >= minKisa) {
        if (x.includes(y) || y.includes(x)) return 0.94;
        const bas = 18;
        const hx = x.slice(0, bas);
        const hy = y.slice(0, bas);
        if (hx === hy) return 0.9;
        if (x.includes(hy) || y.includes(hx)) return 0.86;
    }
    const ta = planlamaUrunMetinTokenler(x);
    const tb = planlamaUrunMetinTokenler(y);
    let tokenSkor = 0;
    if (ta.length && tb.length) {
        const setB = new Set(tb);
        let inter = 0;
        ta.forEach(t => { if (setB.has(t)) inter++; });
        const union = new Set([...ta, ...tb]).size;
        tokenSkor = inter / union;
        if (inter >= 2 && inter >= Math.min(ta.length, tb.length) - 1) tokenSkor = Math.max(tokenSkor, 0.82);
    }
    const lev = planlamaUrunLevenshteinOran(x, y);
    return Math.max(tokenSkor, lev);
}
function planlamaUrunMetinEslesir(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;
    return planlamaUrunMetinBenzerlik(a, b) >= 0.72;
}
function planlamaKalemlerUrunEslesir(k1, k2) {
    const kod1 = planlamaNormUrunMetin(k1?.kod);
    const kod2 = planlamaNormUrunMetin(k2?.kod);
    if (kod1 && kod2) return kod1 === kod2;
    const etiketler1 = [kod1, planlamaNormUrunMetin(k1?.ad), planlamaNormUrunMetin(k1?.grup)].filter(Boolean);
    const etiketler2 = [kod2, planlamaNormUrunMetin(k2?.ad), planlamaNormUrunMetin(k2?.grup)].filter(Boolean);
    for (const a of etiketler1) {
        for (const b of etiketler2) {
            if (planlamaUrunMetinEslesir(a, b)) return true;
        }
    }
    return false;
}
function planlamaNormEbat(v) {
    return planlamaNormUrunMetin(v).replace(/\s*X\s*/gi, 'X').replace(/\s/g, '');
}
function planlamaNormRenkKalem(k) {
    let r = planlamaNormUrunMetin(k?.renk);
    if (r) return r;
    const rk = String(k?.rkod || k?.rkod1 || '').split('|')[0].trim();
    return planlamaNormUrunMetin(rk);
}
function planlamaRenkEslesir(r1, r2) {
    if (!r1 || !r2) return true;
    return r1 === r2 || planlamaUrunMetinEslesir(r1, r2);
}
function planlamaEbatEslesir(e1, e2) {
    if (!e1 || !e2) return true;
    return e1 === e2;
}
function planlamaKalemlerEslesir(k1, k2) {
    if (!planlamaKalemlerUrunEslesir(k1, k2)) return false;
    if (!planlamaRenkEslesir(planlamaNormRenkKalem(k1), planlamaNormRenkKalem(k2))) return false;
    if (!planlamaEbatEslesir(planlamaNormEbat(k1?.ebat || k1?.olcu), planlamaNormEbat(k2?.ebat || k2?.olcu))) return false;
    return true;
}
function planlamaKalemEslesmeAnahtari(k) {
    const kod = planlamaNormUrunMetin(k?.kod);
    const ad = planlamaNormUrunMetin(k?.ad);
    const urun = kod || ad || planlamaNormUrunMetin(k?.grup);
    if (!urun) return '';
    const renk = planlamaNormRenkKalem(k) || '*';
    const ebat = planlamaNormEbat(k?.ebat || k?.olcu) || '*';
    return `${kod ? 'K' : ad ? 'A' : 'G'}:${urun}|${renk}|${ebat}`;
}
function planlamaBirlestirEslesmeYardimHtml(siparisIds) {
    const satirlar = (siparisIds || []).map(siparisId => {
        const sip = (dataCache.siparisler || []).find(s => String(s.id) === String(siparisId));
        if (!sip) return `<div>Sipariş bulunamadı: ${pdfEsc(siparisId)}</div>`;
        const kalemler = siparisListeKalemleriArr(sip);
        if (!kalemler.length) return `<div><b>${pdfEsc(sip.sno || '—')}</b>: kalem yok (siparişte ürün satırı kayıtlı değil)</div>`;
        const ornek = kalemler.slice(0, 4).map((k, i) => {
            const p = [k.kod, k.ad, k.renk || k.rkod, k.ebat].map(x => String(x || '').trim()).filter(Boolean);
            return (p.length ? p.join(' · ') : `Kalem ${i + 1}`);
        }).join(' | ');
        return `<div><b>${pdfEsc(sip.sno || '—')}</b>: ${kalemler.length} kalem — ${pdfEsc(ornek)}${kalemler.length > 4 ? '…' : ''}</div>`;
    });
    return `<div style="margin-top:10px;padding:10px;border-radius:8px;background:var(--surface2);font-size:9px;color:var(--text3);line-height:1.5">
        <div style="font-weight:700;color:var(--text2);margin-bottom:6px">Seçili sipariş kalemleri (eşleşme ipucu)</div>
        ${satirlar.join('')}
        <div style="margin-top:8px;color:var(--text3)">Eşleşme: aynı stok kodu; veya ürün adı benzer (yazım/kısaltma farkı tolere). Renk/ebat bir tarafta boş olabilir. İki tarafta farklı stok kodu varsa ad benzer olsa birleştirilmez.</div>
    </div>`;
}
function planlamaBirlestirGrupId() {
    return 'plm_b_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}
function planlamaBirlestirSiparisBaskaGrupta(siparisId, haricGrupId) {
    const sid = String(siparisId || '');
    return planlamaBirlestirStoreGet().some(g => {
        if (haricGrupId && String(g.id) === String(haricGrupId)) return false;
        return (g.siparisIds || []).map(String).includes(sid);
    });
}
function planlamaBirlestirOrtakKalemAnaliz(siparisIds) {
    const ids = [...new Set((siparisIds || []).map(String).filter(Boolean))];
    const gruplar = [];
    ids.forEach(siparisId => {
        const sip = (dataCache.siparisler || []).find(s => String(s.id) === siparisId);
        if (!sip) return;
        siparisListeKalemleriArr(sip).forEach((k, i) => {
            const kod = planlamaNormUrunMetin(k?.kod);
            const ad = planlamaNormUrunMetin(k?.ad);
            const grup = planlamaNormUrunMetin(k?.grup);
            if (!kod && !ad && !grup) return;
            let ent = gruplar.find(g => planlamaKalemlerEslesir(g.representative, k));
            if (!ent) {
                ent = {
                    key: planlamaKalemEslesmeAnahtari(k),
                    representative: k,
                    urunEtiket: String(k.ad || k.kod || k.grup || `Kalem ${i + 1}`).trim(),
                    kod: k.kod || '',
                    renk: k.renk || k.rkod || '',
                    ebat: k.ebat || k.olcu || '',
                    kaynaklar: [],
                    toplamMiktar: 0
                };
                gruplar.push(ent);
            }
            const miktar = parseFloat(k.miktar) || 0;
            ent.kaynaklar.push({ siparisId, sno: sip.sno || '—', firma: sip.firma || '—', kalemIdx: i, miktar });
            ent.toplamMiktar += miktar;
        });
    });
    const ortak = [];
    const tum = [];
    gruplar.forEach(ent => {
        const sipSet = new Set(ent.kaynaklar.map(x => String(x.siparisId)));
        tum.push({ ...ent, siparisSay: sipSet.size });
        if (sipSet.size >= 2) ortak.push({ ...ent, siparisSay: sipSet.size });
    });
    ortak.sort((a, b) => b.toplamMiktar - a.toplamMiktar);
    return { ortak, tum, siparisSay: ids.length };
}
function planlamaBirlestirGrupMetrikleri(grup, urunSatirlari) {
    const idSet = new Set((grup.siparisIds || []).map(String));
    const rows = (urunSatirlari || []).filter(r => idSet.has(String(r.s?.id)));
    const siparisler = (grup.siparisIds || []).map(id =>
        (dataCache.siparisler || []).find(s => String(s.id) === String(id))
    ).filter(Boolean);
    const sumRow = (arr, field) => arr.reduce((a, r) => a + (parseInt(r[field], 10) || 0), 0);
    const toplam = {
        urunCesit: rows.length,
        hedef: sumRow(rows, 'hedef'),
        dokAdet: sumRow(rows, 'dokAdet'),
        kes: sumRow(rows, 'kes'),
        yBek: sumRow(rows, 'yBek'),
        kaliteBek: sumRow(rows, 'kaliteBek'),
        koliBek: sumRow(rows, 'koliBek'),
        sevkHazirBek: sumRow(rows, 'sevkHazirBek'),
        sevkPr: sumRow(rows, 'sevkPr'),
        uyariTop: rows.reduce((a, r) => a + ((r.uyarilar || []).length), 0)
    };
    toplam.sevkYuzde = toplam.hedef > 0 ? Math.min(100, Math.round((toplam.sevkPr / toplam.hedef) * 100)) : 0;
    const siparisOzet = siparisler.map(s => {
        const sRows = rows.filter(r => String(r.s.id) === String(s.id));
        const hedef = sumRow(sRows, 'hedef');
        const sevkPr = sumRow(sRows, 'sevkPr');
        return {
            s,
            urunCesit: sRows.length,
            hedef,
            dokAdet: sumRow(sRows, 'dokAdet'),
            kes: sumRow(sRows, 'kes'),
            sevkPr,
            sevkYuzde: hedef > 0 ? Math.min(100, Math.round((sevkPr / hedef) * 100)) : 0
        };
    });
    const analiz = planlamaBirlestirOrtakKalemAnaliz(grup.siparisIds);
    return { siparisler, siparisOzet, toplam, ortakKalemler: analiz.ortak };
}
function planlamaBirlestirModalKapat() {
    _planlamaBirlestirModalAcik = false;
    _planlamaBirlestirSecimIds = [];
    const el = document.getElementById('planlama-birlestir-modal');
    if (el) el.remove();
}
function planlamaBirlestirModalAc() {
    _planlamaBirlestirModalAcik = true;
    _planlamaBirlestirSecimIds = [];
    planlamaBirlestirModalRender();
}
function planlamaBirlestirSecimToggle(siparisId) {
    const sid = String(siparisId || '');
    const ix = _planlamaBirlestirSecimIds.indexOf(sid);
    if (ix >= 0) _planlamaBirlestirSecimIds.splice(ix, 1);
    else _planlamaBirlestirSecimIds.push(sid);
    planlamaBirlestirModalRender();
}
function planlamaBirlestirModalRender() {
    let host = document.getElementById('planlama-birlestir-modal');
    if (!host) {
        host = document.createElement('div');
        host.id = 'planlama-birlestir-modal';
        host.style.cssText = 'position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px';
        host.onclick = (e) => { if (e.target === host) planlamaBirlestirModalKapat(); };
        document.body.appendChild(host);
    }
    const aktif = (dataCache.siparisler || []).filter(s => s.durum !== 'TAMAMLANDI');
    const secSet = new Set(_planlamaBirlestirSecimIds.map(String));
    const analiz = _planlamaBirlestirSecimIds.length >= 2
        ? planlamaBirlestirOrtakKalemAnaliz(_planlamaBirlestirSecimIds)
        : { ortak: [], tum: [], siparisSay: _planlamaBirlestirSecimIds.length };
    const listeHtml = aktif.map(s => {
        const sid = String(s.id);
        const checked = secSet.has(sid);
        const baskaGrupta = planlamaBirlestirSiparisBaskaGrupta(sid);
        const disabled = baskaGrupta && !checked;
        return `<label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--border);opacity:${disabled ? 0.45 : 1};cursor:${disabled ? 'not-allowed' : 'pointer'}">
            <input type="checkbox" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} onchange="planlamaBirlestirSecimToggle('${erpAttr(sid)}')" style="accent-color:var(--accent)">
            <div style="min-width:0;flex:1">
                <div style="font-family:'DM Mono',monospace;font-size:11px;font-weight:700">${pdfEsc(s.sno || '—')}</div>
                <div style="font-size:10px;color:var(--text3)">${pdfEsc(s.firma || '—')}</div>
            </div>
            ${baskaGrupta ? '<span style="font-size:8px;color:var(--amber-c)">Başka grupta</span>' : ''}
        </label>`;
    }).join('') || '<div style="padding:16px;color:var(--text3);font-size:11px">Aktif sipariş yok.</div>';
    const onizlemeHtml = _planlamaBirlestirSecimIds.length < 2
        ? '<div style="font-size:10px;color:var(--text3);padding:8px 2px">En az 2 sipariş seçin.</div>'
        : (analiz.ortak.length
            ? `<div style="font-size:10px;color:var(--emerald-c);font-weight:700;margin-bottom:8px">${analiz.ortak.length} ortak ürün kalemi bulundu (toplam miktar birleştirilecek)</div>
               <table class="dt-table" style="width:100%;font-size:10px"><thead><tr><th>Ürün</th><th style="text-align:right">Toplam miktar</th><th>Kaynak</th></tr></thead><tbody>
               ${analiz.ortak.slice(0, 12).map(k => `<tr>
                   <td>${pdfEsc(k.urunEtiket)}</td>
                   <td style="text-align:right;font-weight:700">${(k.toplamMiktar || 0).toLocaleString('tr-TR')}</td>
                   <td style="font-size:9px;color:var(--text3)">${k.kaynaklar.map(x => pdfEsc(x.sno)).join(', ')}</td>
               </tr>`).join('')}
               </tbody></table>${analiz.ortak.length > 12 ? `<div style="font-size:9px;color:var(--text3);margin-top:6px">+${analiz.ortak.length - 12} kalem daha…</div>` : ''}`
            : `<div style="font-size:10px;color:var(--rose-c);padding:8px 2px">Seçilen siparişlerde ortak ürün kalemi bulunamadı. Ürün adları benzer veya stok kodu aynı olmalı (farklı stok kodu + farklı ad birleşmez).</div>${planlamaBirlestirEslesmeYardimHtml(_planlamaBirlestirSecimIds)}`);
    host.innerHTML = `<div class="panel-box" style="width:min(720px,100%);max-height:90vh;overflow:hidden;display:flex;flex-direction:column" onclick="event.stopPropagation()">
        <div class="panel-head">
            <span class="panel-head-title"><span class="panel-head-dot" style="background:var(--violet-c)"></span>Sipariş birleştir (planlama)</span>
            <button type="button" class="btn-pro btn-ghost-pro" style="padding:4px 10px;font-size:10px" onclick="planlamaBirlestirModalKapat()">✕</button>
        </div>
        <div style="padding:10px 14px;font-size:10px;color:var(--text3);line-height:1.45;border-bottom:1px solid var(--border)">
            Orijinal sipariş kayıtlarına dokunulmaz. Yalnızca planlama ekranında birleşik görünüm oluşturulur.
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;flex:1;min-height:0;padding:12px 14px">
            <div class="panel-box" style="padding:0;overflow:auto;max-height:52vh">
                <div style="padding:8px 12px;font-size:9px;font-weight:700;color:var(--text2);border-bottom:1px solid var(--border)">Aktif siparişler (${aktif.length})</div>
                ${listeHtml}
            </div>
            <div style="overflow:auto;max-height:52vh">
                <div style="font-size:9px;font-weight:700;color:var(--text2);margin-bottom:8px">Önizleme · seçili: ${_planlamaBirlestirSecimIds.length}</div>
                ${onizlemeHtml}
            </div>
        </div>
        <div style="padding:12px 14px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">
            <button type="button" class="btn-pro btn-ghost-pro" onclick="planlamaBirlestirModalKapat()">İptal</button>
            <button type="button" class="btn-pro btn-primary-pro" onclick="planlamaBirlestirKaydet()" ${_planlamaBirlestirSecimIds.length < 2 || !analiz.ortak.length ? 'disabled style="opacity:.5"' : ''}>Birleştir</button>
        </div>
    </div>`;
}
function planlamaBirlestirKaydet() {
    const ids = [...new Set(_planlamaBirlestirSecimIds.map(String).filter(Boolean))];
    if (ids.length < 2) {
        erpToast('En az 2 sipariş seçin.', 'warn');
        return;
    }
    const analiz = planlamaBirlestirOrtakKalemAnaliz(ids);
    if (!analiz.ortak.length) {
        erpToast('Ortak ürün kalemi olmadan birleştirme yapılamaz.', 'error');
        return;
    }
    const mesgul = ids.filter(id => planlamaBirlestirSiparisBaskaGrupta(id));
    if (mesgul.length) {
        erpToast('Seçilen siparişlerden biri zaten başka bir birleşik grupta.', 'error');
        return;
    }
    const snolar = ids.map(id => (dataCache.siparisler || []).find(s => String(s.id) === id)?.sno || id).slice(0, 4);
    const grup = {
        id: planlamaBirlestirGrupId(),
        ad: 'Birleşik · ' + snolar.join(' + ') + (ids.length > 4 ? '…' : ''),
        siparisIds: ids,
        olusturma: new Date().toISOString()
    };
    const store = planlamaBirlestirStoreGet();
    store.push(grup);
    planlamaBirlestirStoreSet(store);
    planlamaBirlestirModalKapat();
    erpToast('Planlama birleştirmesi oluşturuldu. Orijinal siparişler değişmedi.', 'success');
    renderPlanlama();
}
function planlamaBirlestirGrupSil(grupId) {
    if (!confirm('Bu birleştirme planlama görünümünden kaldırılacak. Orijinal sipariş kayıtları etkilenmez. Devam?')) return;
    const id = String(grupId || '');
    planlamaBirlestirStoreSet(planlamaBirlestirStoreGet().filter(g => String(g.id) !== id));
    if (_planlamaBirlestirDetayId === id) _planlamaBirlestirDetayId = '';
    erpToast('Birleştirme kaldırıldı.', 'success');
    renderPlanlama();
}
function planlamaBirlestirDetayAc(grupId) {
    _planlamaBirlestirDetayId = String(grupId || '');
    _planlamaSiparisDetay = { alan: '', siparisId: '' };
    planlamaSiparisDetayRender();
    const out = document.getElementById('planlama-siparis-detay-out');
    if (out) out.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function renderPlanlamaBirlestirDetay(grupId, urunSatirlari) {
    const grup = planlamaBirlestirStoreGet().find(g => String(g.id) === String(grupId));
    if (!grup) return '<div style="color:var(--text3);font-size:11px">Birleştirme bulunamadı.</div>';
    const met = planlamaBirlestirGrupMetrikleri(grup, urunSatirlari);
    const analiz = planlamaBirlestirOrtakKalemAnaliz(grup.siparisIds);
    const ortakRows = analiz.ortak.map(k => `<tr>
        <td style="font-weight:600">${pdfEsc(k.urunEtiket)}</td>
        <td style="font-size:9px;color:var(--text3)">${pdfEsc([k.kod, k.renk, k.ebat].filter(Boolean).join(' · '))}</td>
        <td style="text-align:right;font-weight:700">${(k.toplamMiktar || 0).toLocaleString('tr-TR')}</td>
        <td style="font-size:9px">${k.kaynaklar.map(x => `<span style="display:inline-block;margin:2px 4px 2px 0;padding:2px 6px;border-radius:4px;background:var(--surface2);font-family:'DM Mono',monospace">${pdfEsc(x.sno)}: ${(x.miktar || 0).toLocaleString('tr-TR')}</span>`).join('')}</td>
    </tr>`).join('');
    const kaynakSipRows = met.siparisOzet.map(o => `<tr>
        <td style="font-family:'DM Mono',monospace">${pdfEsc(o.s.sno || '—')}</td>
        <td>${pdfEsc(o.s.firma || '—')}</td>
        <td style="text-align:right">${o.urunCesit}</td>
        <td style="text-align:right">${o.hedef.toLocaleString('tr-TR')}</td>
        <td style="text-align:right">${o.dokAdet.toLocaleString('tr-TR')}</td>
        <td style="text-align:right">${o.kes.toLocaleString('tr-TR')}</td>
        <td style="text-align:right;color:var(--cyan-c)">${o.sevkYuzde}%</td>
    </tr>`).join('');
    return `<div class="panel-box" style="padding:14px 16px;border:1px solid rgba(124,58,237,0.35);background:rgba(124,58,237,0.06)">
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;margin-bottom:12px">
            <div>
                <div style="font-size:10px;font-weight:800;color:var(--violet-c);text-transform:uppercase">Birleştirilmiş sipariş · detay</div>
                <div style="font-size:13px;font-weight:700;margin-top:4px">${pdfEsc(grup.ad || '—')}</div>
                <div style="font-size:9px;color:var(--text3);margin-top:4px">Kaynak: ${met.siparisler.map(s => pdfEsc(s.sno || '—')).join(' · ')} — veritabanındaki siparişler aynen duruyor</div>
            </div>
            <button type="button" class="btn-pro btn-ghost-pro" style="padding:4px 10px;font-size:9px" onclick="planlamaSiparisDetayKapat()">Kapat</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-bottom:14px">
            <div class="panel-box" style="padding:8px"><div style="font-size:8px;color:var(--text3)">Toplam hedef</div><div style="font-size:16px;font-weight:700">${met.toplam.hedef.toLocaleString('tr-TR')}</div></div>
            <div class="panel-box" style="padding:8px"><div style="font-size:8px;color:var(--text3)">Dokuma</div><div style="font-size:16px;font-weight:700">${met.toplam.dokAdet.toLocaleString('tr-TR')}</div></div>
            <div class="panel-box" style="padding:8px"><div style="font-size:8px;color:var(--text3)">Kesim</div><div style="font-size:16px;font-weight:700">${met.toplam.kes.toLocaleString('tr-TR')}</div></div>
            <div class="panel-box" style="padding:8px"><div style="font-size:8px;color:var(--text3)">Yık.bek.</div><div style="font-size:16px;font-weight:700;color:var(--amber-c)">${met.toplam.yBek.toLocaleString('tr-TR')}</div></div>
            <div class="panel-box" style="padding:8px"><div style="font-size:8px;color:var(--text3)">Sevk</div><div style="font-size:16px;font-weight:700">${met.toplam.sevkPr.toLocaleString('tr-TR')}</div></div>
            <div class="panel-box" style="padding:8px"><div style="font-size:8px;color:var(--text3)">Sevk %</div><div style="font-size:16px;font-weight:700;color:var(--cyan-c)">${met.toplam.sevkYuzde}%</div></div>
        </div>
        <div style="font-size:9px;font-weight:700;color:var(--text2);margin-bottom:6px">Ortak ürün kalemleri (birleşik miktar)</div>
        <div style="overflow:auto;margin-bottom:14px"><table class="dt-table" style="width:100%;min-width:640px;font-size:10px">
            <thead><tr><th>Ürün</th><th>Özellik</th><th style="text-align:right">Toplam</th><th>Kaynak kırılımı</th></tr></thead>
            <tbody>${ortakRows || '<tr><td colspan="4" style="text-align:center;padding:12px;color:var(--text3)">Ortak kalem yok</td></tr>'}</tbody>
        </table></div>
        <div style="font-size:9px;font-weight:700;color:var(--text2);margin-bottom:6px">Kaynak siparişler (planlama özeti)</div>
        <div style="overflow:auto"><table class="dt-table" style="width:100%;font-size:10px">
            <thead><tr><th>Sipariş</th><th>Müşteri</th><th style="text-align:right">Kalem</th><th style="text-align:right">Hedef</th><th style="text-align:right">Dokuma</th><th style="text-align:right">Kesim</th><th style="text-align:right">Sevk %</th></tr></thead>
            <tbody>${kaynakSipRows}</tbody>
        </table></div>
    </div>`;
}
function renderPlanlamaBirlestirilmisHtml(urunSatirlari) {
    const gruplar = planlamaBirlestirStoreGet();
    const kartlar = gruplar.map(grup => {
        const met = planlamaBirlestirGrupMetrikleri(grup, urunSatirlari);
        const gidJs = JSON.stringify(String(grup.id));
        const kaynakBadges = met.siparisler.map(s =>
            `<span style="display:inline-block;padding:3px 8px;border-radius:6px;background:var(--surface2);border:1px solid var(--border);font-family:'DM Mono',monospace;font-size:9px;margin:2px 4px 2px 0">${pdfEsc(s.sno || '—')}</span>`
        ).join('');
        const ortakMini = met.ortakKalemler.slice(0, 5).map(k =>
            `<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);font-size:10px">
                <span>${pdfEsc(k.urunEtiket)}</span>
                <span style="font-weight:700;font-family:'DM Mono',monospace">${(k.toplamMiktar || 0).toLocaleString('tr-TR')}</span>
            </div>`
        ).join('');
        return `<div class="panel-box" style="padding:12px 14px;border:1px solid rgba(124,58,237,0.28)">
            <div style="display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:10px">
                <div style="min-width:0">
                    <div style="font-size:9px;font-weight:700;color:var(--violet-c);text-transform:uppercase;font-family:'DM Mono',monospace">Birleşik planlama görünümü</div>
                    <div style="font-size:12px;font-weight:700;margin-top:4px">${pdfEsc(grup.ad || '—')}</div>
                    <div style="margin-top:6px">${kaynakBadges}</div>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                    <button type="button" class="btn-pro btn-ghost-pro" style="padding:5px 10px;font-size:9px" onclick='planlamaBirlestirDetayAc(${gidJs})'>Detay</button>
                    <button type="button" class="btn-pro btn-danger-pro" style="padding:5px 10px;font-size:9px" onclick='planlamaBirlestirGrupSil(${gidJs})'>Birleştirmeyi kaldır</button>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:12px">
                <div><div style="font-size:8px;color:var(--text3)">Toplam hedef</div><div style="font-size:15px;font-weight:700">${met.toplam.hedef.toLocaleString('tr-TR')}</div></div>
                <div><div style="font-size:8px;color:var(--text3)">Dokuma</div><div style="font-size:15px;font-weight:700">${met.toplam.dokAdet.toLocaleString('tr-TR')}</div></div>
                <div><div style="font-size:8px;color:var(--text3)">Kesim</div><div style="font-size:15px;font-weight:700">${met.toplam.kes.toLocaleString('tr-TR')}</div></div>
                <div><div style="font-size:8px;color:var(--text3)">Sevk</div><div style="font-size:15px;font-weight:700">${met.toplam.sevkPr.toLocaleString('tr-TR')} <span style="font-size:10px;color:var(--cyan-c)">(${met.toplam.sevkYuzde}%)</span></div></div>
                <div><div style="font-size:8px;color:var(--text3)">Ortak kalem</div><div style="font-size:15px;font-weight:700">${met.ortakKalemler.length}</div></div>
            </div>
            ${ortakMini ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
                <div style="font-size:8px;font-weight:700;color:var(--text3);margin-bottom:4px">Ortak ürünler (özet)</div>${ortakMini}
                ${met.ortakKalemler.length > 5 ? `<div style="font-size:9px;color:var(--text3);margin-top:4px">+${met.ortakKalemler.length - 5} kalem — detay için tıklayın</div>` : ''}
            </div>` : ''}
        </div>`;
    }).join('');
    return `<div class="panel-box" style="padding:12px 14px">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px">
            <div>
                <div style="font-size:10px;font-weight:800;color:var(--text2);text-transform:uppercase;letter-spacing:.08em;font-family:'DM Mono',monospace">Birleştirilmiş siparişler</div>
                <div style="font-size:10px;color:var(--text3);margin-top:4px;line-height:1.45">Aynı ürün kalemlerini planlama için tek görünümde toplar. <b>Orijinal sipariş kayıtları değişmez.</b></div>
            </div>
            <button type="button" class="btn-pro btn-primary-pro" style="padding:7px 14px;font-size:10px" onclick="planlamaBirlestirModalAc()">＋ Sipariş birleştir</button>
        </div>
        ${kartlar || `<div style="padding:16px;text-align:center;color:var(--text3);font-size:11px;border:1px dashed var(--border);border-radius:10px">Henüz birleştirme yok. Aynı ürünü içeren 2+ siparişi seçip birleştirebilirsiniz.</div>`}
    </div>`;
}

const PLANLAMA_MASTER_KEY = 'erp_planlama_master_v1';
let planlamaAltMode = 'ANA';
let _planlamaMasterFiltre = { arama: '', alan: 'HEPSI', sadeceUyari: false };
let _planlamaMasterAcik = true;

function planlamaAltSekmeHtml() {
    const tab = (id, label) => {
        const on = planlamaAltMode === id;
        return `<button type="button" onclick="setPlanlamaAlt('${id}')"
            style="padding:8px 14px;border-radius:9px;border:1px solid ${on ? 'rgba(109,113,255,0.45)' : 'var(--border)'};
            background:${on ? 'rgba(109,113,255,0.14)' : 'var(--surface2)'};color:${on ? 'var(--text)' : 'var(--text2)'};
            font-size:10px;font-weight:${on ? '800' : '600'};cursor:pointer;font-family:'DM Sans',sans-serif">${label}</button>`;
    };
    return `<div class="panel-box" style="padding:10px 14px">
        <div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;font-family:'DM Mono',monospace;margin-bottom:8px">Planlama</div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${tab('ANA', '📊 Planlama Ana')}
        </div>
    </div>`;
}

async function setPlanlamaAlt(alt) {
    planlamaAltMode = 'ANA';
    saveUiState({ planlamaAltMode, appMode: 'PLANLAMA' });
    if (appMode !== 'PLANLAMA') await setAppMode('PLANLAMA');
    else await renderPlanlama();
}

function planlamaMasterStateLoad() {
    try {
        const s = JSON.parse(localStorage.getItem(PLANLAMA_MASTER_KEY) || '{}');
        if (s.filtre && typeof s.filtre === 'object') _planlamaMasterFiltre = { ..._planlamaMasterFiltre, ...s.filtre };
        if (typeof s.acik === 'boolean') _planlamaMasterAcik = s.acik;
    } catch (e) {}
}
function planlamaMasterStateSave() {
    try { localStorage.setItem(PLANLAMA_MASTER_KEY, JSON.stringify({ filtre: _planlamaMasterFiltre, acik: _planlamaMasterAcik })); } catch (e) {}
}
function planlamaAlanLabel(alan) {
    const m = { SIMTEKS_KONF: 'Simteks', FASON_KONF: 'Fason', DOGRUDAN_SEVK: 'Doğrudan sevk' };
    return m[String(alan || '')] || String(alan || '—');
}
function planlamaMasterFiltrelenmisSatirlar() {
    const rows = Array.isArray(_planlamaLastRows) ? _planlamaLastRows : [];
    const q = planlamaNormUrunMetin(_planlamaMasterFiltre.arama);
    return rows.filter(r => {
        if (_planlamaMasterFiltre.alan !== 'HEPSI' && r.alan !== _planlamaMasterFiltre.alan) return false;
        if (_planlamaMasterFiltre.sadeceUyari && !(r.uyarilar || []).length) return false;
        if (!q) return true;
        const blob = [r.s?.sno, r.s?.firma, r.urunEtiket, r.kalemKod, r.kalemRenk, r.kalemEbat]
            .map(x => planlamaNormUrunMetin(x)).join(' ');
        return blob.includes(q);
    });
}
function planlamaMasterNumGoster(val) {
    const v = parseInt(val, 10) || 0;
    return `<span style="font-family:'DM Mono',monospace">${v.toLocaleString('tr-TR')}</span>`;
}
const PLANLAMA_MASTER_TD = 'padding:3px 5px;line-height:1.2;vertical-align:middle';
function planlamaMasterSatirHtml(r, n) {
    const sid = String(r.s?.id || '');
    const sidJs = JSON.stringify(sid);
    const i = parseInt(r.kalemIdx, 10) || 0;
    const uyariHtml = (r.uyarilar || []).length
        ? (r.uyarilar || []).map(w => `<div style="display:flex;align-items:center;gap:3px;margin:1px 0">
            <span class="pill ${w.tip === 'FAZLA' ? 'pill-amber' : 'pill-red'}" style="font-size:7px;white-space:normal;line-height:1.15;padding:2px 4px">${pdfEsc(w.metin)}</span>
            <button type="button" class="btn-pro" style="padding:1px 4px;font-size:7px;flex-shrink:0;line-height:1" onclick="event.stopPropagation();planlamaUyariKapat('${erpAttr(w.id)}');planlamaMasterPanelYenile()">×</button>
        </div>`).join('')
        : `<span class="pill pill-green" style="font-size:7px;padding:2px 4px">OK</span>`;
    const renkEbat = [r.kalemRenk, r.kalemEbat].filter(Boolean).join(' · ') || '—';
    const rowBg = (r.uyarilar || []).length ? 'rgba(251,113,133,.06)' : (n % 2 ? 'var(--surface2)' : 'transparent');
    const td = PLANLAMA_MASTER_TD;
    return `<tr data-planlama-master-row="${sid}_${i}" style="background:${rowBg};border-bottom:1px solid var(--border)">
        <td style="${td};font-family:'DM Mono',monospace;font-size:9px;white-space:nowrap">
            <button type="button" class="btn-pro btn-ghost-pro" style="padding:1px 5px;font-size:8px;line-height:1.2" onclick="planlamaSiparisDetayAc(${JSON.stringify(r.alan || '')}, ${sidJs})">${pdfEsc(r.s?.sno || '—')}</button>
        </td>
        <td style="${td};font-size:9px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${pdfEsc(r.s?.firma || '')}">${pdfEsc(r.s?.firma || '—')}</td>
        <td style="${td};font-size:9px;font-weight:600;min-width:120px">${pdfEsc(r.urunEtiket || '—')}</td>
        <td style="${td};font-size:8px;font-family:'DM Mono',monospace;color:var(--text3)">${pdfEsc(r.kalemKod || '—')}</td>
        <td style="${td};font-size:8px;color:var(--accent2)">${pdfEsc(renkEbat)}</td>
        <td style="${td};font-size:8px">${pdfEsc(planlamaAlanLabel(r.alan))}</td>
        <td style="${td};text-align:right;font-family:'DM Mono',monospace;font-weight:700;font-size:9px" title="Sipariş kalemi">${(r.hedef || 0).toLocaleString('tr-TR')}</td>
        <td style="${td};text-align:right;font-size:9px" title="KD_DOKUMA · urunler">${planlamaMasterNumGoster(r.dokAdet)}</td>
        <td style="${td};text-align:right;font-size:9px" title="KD_KONFEKSIYON · kesilen">${planlamaMasterNumGoster(r.kes)}</td>
        <td style="${td};text-align:right;color:var(--violet-c);font-size:9px" title="Hesap: dokuma − kesim">${(r.kesBek || 0).toLocaleString('tr-TR')}</td>
        <td style="${td};text-align:right;font-size:9px" title="KD_KONFEKSIYON · dikilen">${planlamaMasterNumGoster(r.dik)}</td>
        <td style="${td};text-align:right;font-size:9px" title="KD_KONFEKSIYON · kk_gecen">${planlamaMasterNumGoster(r.kk)}</td>
        <td style="${td};text-align:right;color:var(--rose-c);font-size:9px" title="Hesap: dikim − kalite">${(r.kaliteBek || 0).toLocaleString('tr-TR')}</td>
        <td style="${td};text-align:right;font-size:9px" title="KD_KONFEKSIYON · kolide">${planlamaMasterNumGoster(r.kol)}</td>
        <td style="${td};text-align:right;color:var(--cyan-c);font-size:9px" title="Hesap: kalite − koli">${(r.koliBek || 0).toLocaleString('tr-TR')}</td>
        <td style="${td};text-align:right;font-size:9px" title="KD_KONFEKSIYON · sevk (dağıtılmış)">${planlamaMasterNumGoster(r.sevkPr)}</td>
        <td style="${td};text-align:right;font-weight:700;color:var(--emerald-c);font-size:9px">${r.sevkYuzde || 0}%</td>
        <td style="${td};text-align:right;color:var(--amber-c);font-size:9px">${(r.yBek || 0).toLocaleString('tr-TR')}</td>
        <td style="${td};min-width:140px;max-width:200px;font-size:8px">${uyariHtml}</td>
        <td style="${td};text-align:center;white-space:nowrap">
            <button type="button" class="btn-pro btn-ghost-pro" style="padding:1px 5px;font-size:7px;margin:0 1px;line-height:1.2" onclick="planlamaMasterKonfAc(${sidJs})" title="Konfeksiyon">Konf</button>
            <button type="button" class="btn-pro btn-ghost-pro" style="padding:1px 5px;font-size:7px;margin:0 1px;line-height:1.2" onclick="planlamaMasterDokumaAc(${sidJs})" title="Dokuma takip">Dok</button>
        </td>
    </tr>`;
}
function renderPlanlamaMasterKalemPanel() {
    const filtrelenmis = planlamaMasterFiltrelenmisSatirlar();
    const toplam = (Array.isArray(_planlamaLastRows) ? _planlamaLastRows : []).length;
    const uyariSay = filtrelenmis.filter(r => (r.uyarilar || []).length).length;
    const acik = _planlamaMasterAcik;
    const aramaVal = pdfEsc(_planlamaMasterFiltre.arama || '');
    const alanVal = _planlamaMasterFiltre.alan || 'HEPSI';
    const sadeceUyari = !!_planlamaMasterFiltre.sadeceUyari;
    const tbody = filtrelenmis.length
        ? filtrelenmis.map((r, n) => planlamaMasterSatirHtml(r, n)).join('')
        : `<tr><td colspan="19" style="text-align:center;padding:12px;color:var(--text3);font-size:10px">Filtreye uyan kalem yok.</td></tr>`;
    return `<div class="panel-box" style="padding:12px 14px;border:1px solid rgba(34,211,238,.28)">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;user-select:none" onclick="planlamaMasterPanelToggle()">
            <div>
                <div style="font-size:10px;font-weight:800;color:var(--cyan-c);text-transform:uppercase;letter-spacing:.08em;font-family:'DM Mono',monospace">
                    <span style="display:inline-block;width:14px;margin-right:4px">${acik ? '▼' : '▶'}</span>
                    Açık siparişler · kalem kontrol
                </div>
                <div style="font-size:10px;color:var(--text3);margin-top:4px;line-height:1.45">
                    <b>Salt okunur kontrol noktası</b> — değerler sipariş kalemi, <span style="font-family:'DM Mono',monospace">KD_DOKUMA</span>, <span style="font-family:'DM Mono',monospace">KD_KONFEKSIYON</span> ve akış hareketlerinden çekilir. Düzeltme için <b>Konf</b> / <b>Dok</b> veya ilgili modüle gidin.
                </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:10px;font-family:'DM Mono',monospace">
                <span class="pill pill-gray">${filtrelenmis.length} / ${toplam} kalem</span>
                <span class="pill ${uyariSay ? 'pill-red' : 'pill-green'}">${uyariSay} uyarılı</span>
            </div>
        </div>
        ${acik ? `<div style="margin-top:12px" onclick="event.stopPropagation()">
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px">
                <input type="search" class="pro-input" placeholder="Sipariş no, müşteri, ürün, kod…" value="${aramaVal}" style="min-width:200px;flex:1;font-size:11px"
                    oninput="planlamaMasterFiltreGuncelle('arama', this.value)" />
                <select class="pro-input" style="font-size:10px" onchange="planlamaMasterFiltreGuncelle('alan', this.value)">
                    <option value="HEPSI" ${alanVal === 'HEPSI' ? 'selected' : ''}>Tüm alanlar</option>
                    <option value="SIMTEKS_KONF" ${alanVal === 'SIMTEKS_KONF' ? 'selected' : ''}>Simteks</option>
                    <option value="FASON_KONF" ${alanVal === 'FASON_KONF' ? 'selected' : ''}>Fason</option>
                    <option value="DOGRUDAN_SEVK" ${alanVal === 'DOGRUDAN_SEVK' ? 'selected' : ''}>Doğrudan sevk</option>
                </select>
                <label style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--text2);cursor:pointer">
                    <input type="checkbox" ${sadeceUyari ? 'checked' : ''} onchange="planlamaMasterFiltreGuncelle('sadeceUyari', this.checked)" style="accent-color:var(--rose-c)">
                    Sadece uyarılı
                </label>
                <button type="button" class="btn-pro btn-ghost-pro" style="padding:6px 10px;font-size:10px" onclick="renderPlanlama()">↻ Yenile</button>
                <button type="button" class="btn-pro btn-ghost-pro" style="padding:6px 10px;font-size:10px" onclick="planlamaUyarilariSifirla()">Uyarıları sıfırla</button>
            </div>
            <div style="overflow:auto;max-height:min(72vh,720px);border:1px solid var(--border);border-radius:10px">
                <table class="dt-table planlama-master-kalem-tablo" style="min-width:1680px;width:100%;font-size:9px;border-collapse:collapse">
                    <thead style="position:sticky;top:0;z-index:2;background:var(--surface2)">
                        <tr style="font-size:7px;font-weight:800;color:var(--text3);text-transform:uppercase;font-family:'DM Mono',monospace;line-height:1.2">
                            <th style="padding:4px 5px">Sipariş</th><th style="padding:4px 5px">Müşteri</th><th style="padding:4px 5px">Ürün</th><th style="padding:4px 5px">Kod</th><th style="padding:4px 5px">Renk/Ebat</th><th style="padding:4px 5px">Alan</th>
                            <th style="text-align:right">Hedef</th><th style="text-align:right" title="KD_DOKUMA">Dokuma</th>
                            <th style="text-align:right" title="KD_KONFEKSIYON">Kesim</th><th style="text-align:right">Kes.bek</th>
                            <th style="text-align:right" title="KD_KONFEKSIYON">Dikim</th><th style="text-align:right" title="KD_KONFEKSIYON">KK geçen</th>
                            <th style="text-align:right">Kal.bek</th><th style="text-align:right" title="KD_KONFEKSIYON">Koli</th>
                            <th style="text-align:right">Koli bek</th><th style="text-align:right" title="KD_KONFEKSIYON">Sevk</th>
                            <th style="text-align:right">Sevk %</th><th style="text-align:right">Yık.bek</th><th>Eksik / fazla</th><th>Kaynak</th>
                        </tr>
                    </thead>
                    <tbody>${tbody}</tbody>
                </table>
            </div>
            <div style="font-size:9px;color:var(--text3);margin-top:8px;line-height:1.45">
                Bu tabloda veri girişi yoktur. Bekleyen ve uyarılar planlama formüllerinden hesaplanır. Güncelleme: Konfeksiyon modülü (kesim/dikim/kalite/koli/sevk), Dokuma takip (dokuma adet), sipariş akış hareketleri.
            </div>
        </div>` : ''}
    </div>`;
}
function planlamaMasterPanelToggle() {
    _planlamaMasterAcik = !_planlamaMasterAcik;
    planlamaMasterStateSave();
    planlamaMasterPanelYenile();
}
function planlamaMasterFiltreGuncelle(alan, deger) {
    if (alan === 'sadeceUyari') _planlamaMasterFiltre.sadeceUyari = !!deger;
    else if (alan === 'alan') _planlamaMasterFiltre.alan = String(deger || 'HEPSI');
    else _planlamaMasterFiltre.arama = String(deger || '');
    planlamaMasterStateSave();
    planlamaMasterPanelYenile();
}
function planlamaMasterPanelYenile() {
    const el = document.getElementById('planlama-master-kalem-out');
    if (el) el.innerHTML = renderPlanlamaMasterKalemPanel();
}
async function planlamaMasterKonfAc(siparisId) {
    const sid = String(siparisId || '');
    if (!sid) return;
    await setAppMode('KONFEKSIYON');
    await konfSelectSiparis(sid);
}
async function planlamaMasterDokumaAc(siparisId) {
    const sid = String(siparisId || '');
    if (!sid) return;
    const sip = (dataCache.siparisler || []).find(s => String(s.id) === sid);
    await setAppMode('DOKUMA_TAKIP');
    erpToast((sip?.sno || 'Sipariş') + ' — dokuma verisini Dokuma Takip modülünden girin/güncelleyin.', 'info', 5000);
}

// ——— Sipariş Kapama Dosyası (planlama altı, konfeksiyon kapama simülasyonu) ———
const KAPAMA_KD_TIP = 'KD_SIPARIS_KAPAMA';
const KAPAMA_MANUEL_LS = 'erp_kapama_manuel_v1';

function kapamaIsManuel(id) {
    return String(id || '').startsWith('m_');
}

function kapamaManuelIndexGetir() {
    try { return JSON.parse(localStorage.getItem(KAPAMA_MANUEL_LS) || '[]'); } catch (e) { return []; }
}

function kapamaManuelIndexKaydet(arr) {
    try { localStorage.setItem(KAPAMA_MANUEL_LS, JSON.stringify(arr || [])); } catch (e) {}
}

function kapamaManuelKayitGetir(id) {
    return kapamaManuelIndexGetir().find(x => String(x.id) === String(id)) || null;
}

async function kapamaKdYukle(id, forceReload = false) {
    const sid = String(id || '');
    if (!sid) return {};
    if (kapamaIsManuel(sid)) {
        const rec = kapamaManuelKayitGetir(sid);
        const kd = rec?.kd || {};
        _kdCache[`${KAPAMA_KD_TIP}_${sid}`] = kd;
        return kd;
    }
    return sbKdGet(sid, KAPAMA_KD_TIP, forceReload);
}

async function kapamaKdKaydet(id, kd) {
    const sid = String(id || '');
    if (kapamaIsManuel(sid)) {
        const list = kapamaManuelIndexGetir();
        const i = list.findIndex(x => String(x.id) === sid);
        const baslik = kd.meta?.baslik || kd.meta?.manuel_baslik || 'Manuel simülasyon';
        const mk = kd.manuel_kalemler || [];
        const ozet = mk.length ? mk.map(k => `${k.hedef}× ${k.ad}`).join(' + ') : '';
        const entry = { id: sid, baslik, firma: kd.meta?.firma || '', ozet, guncelleme: new Date().toISOString(), kd };
        if (i >= 0) list[i] = entry;
        else list.push(entry);
        kapamaManuelIndexKaydet(list);
        _kdCache[`${KAPAMA_KD_TIP}_${sid}`] = kd;
        return { ok: true };
    }
    return sbKdSet(sid, KAPAMA_KD_TIP, kd);
}

function kapamaYeniManuelOlustur(baslik, firma, kalemlerIn) {
    const id = `m_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const setAd = String(baslik || 'Yeni set').trim() || 'Yeni set';
    const kalemler = (kalemlerIn || []).map(k => ({
        ad: String(k.ad || '').trim(),
        hedef: parseInt(k.hedef, 10) || 0,
        kesim_birim_mt: kapamaNum(k.kesim_birim_mt),
    })).filter(k => k.ad);
    if (!kalemler.length) kalemler.push({ ad: setAd, hedef: 0, kesim_birim_mt: 0 });
    const kalem = {};
    kalemler.forEach((k, i) => {
        kalem[`kalem_${i}`] = {
            hedef: k.hedef,
            kesim_birim_mt: k.kesim_birim_mt,
            kesim_adet: 0,
            ikinci_kalite: 0,
            ucuncu_kalite: 0,
            arti_adet: 0,
            kolide: 0,
            kk_gecen: 0,
        };
    });
    const kd = {
        meta: { tip: 'manuel', baslik: setAd, firma: String(firma || '').trim(), tarih: new Date().toISOString().slice(0, 10) },
        kumas: { plan_mt: '', dokunan_mt: '', baskiya_giden_mt: '', baskidan_gelen_mt: '', fire_mt: '', kalan_mt: '', kesim_birim_mt: '' },
        manuel_kalemler: kalemler,
        kalem,
        aksesuarlar: [],
        maliyet: {},
    };
    const ozetParca = kalemler.map(k => `${k.hedef}× ${k.ad}`).join(' + ');
    const list = kapamaManuelIndexGetir();
    list.unshift({ id, baslik: setAd, firma: kd.meta.firma, ozet: ozetParca, guncelleme: new Date().toISOString(), kd });
    kapamaManuelIndexKaydet(list);
    _kdCache[`${KAPAMA_KD_TIP}_${id}`] = kd;
    return id;
}

function kapamaManuelOlusturKalemBaslikHtml() {
    return `<div style="display:grid;grid-template-columns:1fr 72px 88px 36px;gap:8px;margin-bottom:6px;font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">
        <span>Parça adı</span><span style="text-align:right">Adet</span><span style="text-align:right">Kesim mt/ad</span><span></span>
    </div>`;
}

function kapamaManuelOlusturKalemSatirHtml(i, k = {}) {
    return `<div class="kap-manuel-kalem-row" data-idx="${i}" style="display:grid;grid-template-columns:1fr 72px 88px 36px;gap:8px;align-items:center;margin-bottom:8px">
        <input type="text" class="pro-input kap-mk-ad" style="width:100%;box-sizing:border-box" value="${pdfEsc(k.ad || '')}" placeholder="Nevresim">
        <input type="number" min="0" step="1" class="pro-input kap-mk-adet" style="width:100%;box-sizing:border-box;text-align:right" value="${k.hedef !== undefined && k.hedef !== '' ? k.hedef : ''}" placeholder="1">
        <input type="number" min="0" step="0.01" class="pro-input kap-mk-birim" style="width:100%;box-sizing:border-box;text-align:right" value="${k.kesim_birim_mt !== undefined && k.kesim_birim_mt !== '' ? k.kesim_birim_mt : ''}" placeholder="0">
        <button type="button" class="btn-pro btn-ghost-pro" style="height:32px;padding:0 8px;font-size:16px;line-height:1" onclick="kapamaManuelOlusturKalemSil(this)" title="Satırı sil">×</button>
    </div>`;
}

function kapamaManuelOlusturFormHtml() {
    const varsayilan = [
        { ad: 'Nevresim', hedef: 1, kesim_birim_mt: '' },
        { ad: 'Yastık kılıfı', hedef: 2, kesim_birim_mt: '' },
    ];
    const rows = varsayilan.map((k, i) => kapamaManuelOlusturKalemSatirHtml(i, k)).join('');
    return `<div class="panel-box" style="padding:16px 18px;border:1px solid rgba(245,158,11,0.35);background:rgba(245,158,11,0.06)">
        <div style="font-size:11px;font-weight:800;color:var(--text);margin-bottom:4px">✨ Yeni manuel simülasyon</div>
        <div style="font-size:10px;color:var(--text3);margin-bottom:12px;line-height:1.45">Set adını ve içindeki parçaları tanımlayın (ör. 1 nevresim + 2 yastık kılıfı).</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
            <div><label class="pro-label">Set / ürün adı</label><input id="kap-yeni-baslik" type="text" class="pro-input" value="Nevresim seti" placeholder="Örn. Nevresim seti"></div>
            <div><label class="pro-label">Müşteri (isteğe bağlı)</label><input id="kap-yeni-firma" type="text" class="pro-input" placeholder="Firma veya müşteri adı"></div>
        </div>
        <div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Set içeriği</div>
        ${kapamaManuelOlusturKalemBaslikHtml()}
        <div id="kap-manuel-kalem-list">${rows}</div>
        <button type="button" class="btn-pro btn-ghost-pro" style="font-size:10px;margin-top:6px" onclick="kapamaManuelOlusturKalemEkle()">+ Parça ekle</button>
        <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="btn-pro btn-primary-pro" style="font-size:11px" onclick="kapamaManuelOlusturGonder()">Simülasyonu oluştur</button>
        </div>
    </div>`;
}

function kapamaManuelOlusturKalemEkle() {
    const list = document.getElementById('kap-manuel-kalem-list');
    if (!list) return;
    const i = list.querySelectorAll('.kap-manuel-kalem-row').length;
    list.insertAdjacentHTML('beforeend', kapamaManuelOlusturKalemSatirHtml(i, { ad: '', hedef: 1 }));
}

function kapamaManuelOlusturKalemSil(btn) {
    const list = document.getElementById('kap-manuel-kalem-list');
    const row = btn?.closest?.('.kap-manuel-kalem-row');
    if (!list || !row) return;
    if (list.querySelectorAll('.kap-manuel-kalem-row').length <= 1) {
        erpToast('Sette en az bir parça olmalı.', 'error');
        return;
    }
    row.remove();
}

function kapamaManuelOlusturFormOku() {
    const baslik = document.getElementById('kap-yeni-baslik')?.value || '';
    const firma = document.getElementById('kap-yeni-firma')?.value || '';
    const kalemler = [];
    document.querySelectorAll('#kap-manuel-kalem-list .kap-manuel-kalem-row').forEach(row => {
        kalemler.push({
            ad: row.querySelector('.kap-mk-ad')?.value || '',
            hedef: row.querySelector('.kap-mk-adet')?.value || '',
            kesim_birim_mt: row.querySelector('.kap-mk-birim')?.value || '',
        });
    });
    return { baslik, firma, kalemler };
}

async function kapamaManuelOlusturGonder() {
    const f = kapamaManuelOlusturFormOku();
    if (!String(f.baslik || '').trim()) {
        erpToast('Set / ürün adı girin (ör. Nevresim seti).', 'error');
        return;
    }
    const kalemler = f.kalemler
        .map(k => ({ ad: String(k.ad || '').trim(), hedef: k.hedef, kesim_birim_mt: k.kesim_birim_mt }))
        .filter(k => k.ad);
    if (!kalemler.length) {
        erpToast('En az bir parça ekleyin: nevresim, yastık kılıfı vb.', 'error');
        return;
    }
    const id = kapamaYeniManuelOlustur(f.baslik, f.firma, kalemler);
    kapamaSiparisId = id;
    saveUiState({ kapamaSiparisId });
    await renderSiparisKapama();
    const oz = kalemler.map(k => `${parseInt(k.hedef, 10) || 0}× ${k.ad}`).join(' + ');
    erpToast(`Oluşturuldu: ${f.baslik.trim()} (${oz})`, 'success', 6000);
}

async function kapamaManuelMevcutKalemEkle(siparisId) {
    const sid = String(siparisId);
    const kd = _kdCache[`${KAPAMA_KD_TIP}_${sid}`] || (await kapamaKdYukle(sid));
    const arr = Array.isArray(kd.manuel_kalemler) ? [...kd.manuel_kalemler] : [];
    arr.push({ ad: 'Yeni parça', hedef: 1, kesim_birim_mt: 0 });
    kd.manuel_kalemler = arr;
    const kalem = {};
    arr.forEach((k, i) => {
        kalem[`kalem_${i}`] = { ...(kd.kalem?.[`kalem_${i}`] || {}), hedef: k.hedef, kesim_birim_mt: k.kesim_birim_mt };
    });
    kd.kalem = kalem;
    _kdCache[`${KAPAMA_KD_TIP}_${sid}`] = kd;
    await kapamaKdKaydet(sid, kd);
    await renderSiparisKapama();
}

function kapamaManuelSil(id) {
    if (!kapamaIsManuel(id)) return;
    kapamaManuelIndexKaydet(kapamaManuelIndexGetir().filter(x => String(x.id) !== String(id)));
    delete _kdCache[`${KAPAMA_KD_TIP}_${id}`];
    if (String(kapamaSiparisId) === String(id)) kapamaSiparisId = null;
}

function kapamaKalemlerGetir(siparisId, kd) {
    if (kapamaIsManuel(siparisId)) {
        const arr = kd?.manuel_kalemler;
        if (Array.isArray(arr) && arr.length) {
            return arr.map((k, i) => ({
                ad: k.ad || `Kalem ${i + 1}`,
                kod: k.kod || '',
                renk: k.renk || '',
                ebat: k.ebat || '',
                miktar: parseInt(k.hedef ?? k.miktar, 10) || 0,
                kesim_birim_mt: kapamaNum(k.kesim_birim_mt),
            }));
        }
        const baslik = kd?.meta?.baslik || 'Ürün';
        return [{ ad: baslik, kod: '', renk: '', ebat: '', miktar: 0, kesim_birim_mt: kapamaNum(kd?.kumas?.kesim_birim_mt) }];
    }
    const siparis = (dataCache.siparisler || []).find(s => String(s.id) === String(siparisId));
    return uaSiparisKalemleriGetir(siparis);
}

function kapamaKumasHesapOzet(kd, kalemler) {
    const k = kd.kumas || {};
    const dok = kapamaNum(k.dokunan_mt);
    const baskG = kapamaNum(k.baskiya_giden_mt);
    const baskD = kapamaNum(k.baskidan_gelen_mt);
    let kesimKull = 0, kesAd = 0, birimKes = 0;
    (kalemler || []).forEach((kl, i) => {
        const row = kd.kalem?.[`kalem_${i}`] || {};
        const d = kapamaKalemKumasDetay(row, kl);
        kesimKull += d.mtToplam;
        kesAd += d.adToplam;
        if (!birimKes && d.birim) birimKes = d.birim;
    });
    kesimKull = Math.round(kesimKull * 100) / 100;
    const fireMt = kapamaNum(k.fire_mt);
    const kalanGir = kapamaNum(k.kalan_mt);
    const kalanHesap = Math.max(0, Math.round((baskD - kesimKull - fireMt) * 100) / 100);
    const kalan = kalanGir > 0 ? kalanGir : kalanHesap;
    const baskiFire = Math.max(0, Math.round((baskG - baskD) * 100) / 100);
    const dokBaskiFark = Math.max(0, Math.round((dok - baskG) * 100) / 100);
    const toplamFire = Math.max(0, Math.round((baskD - kesimKull - kalan) * 100) / 100);
    return { dok, baskG, baskD, birimKes, kesAd, kesimKull, kalan, kalanHesap, fireMt, baskiFire, dokBaskiFark, toplamFire };
}

function kapamaNum(v) {
    const n = parseFloat(String(v ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
}

/** Parça bazlı kumaş: birim mt × (kesim + 2.kal + 3.kal + artı adet) */
function kapamaKalemKumasDetay(row, kl) {
    const birim = kapamaNum(row?.kesim_birim_mt ?? kl?.kesim_birim_mt);
    const kes = kapamaNum(row?.kesim_adet);
    const iki = kapamaNum(row?.ikinci_kalite);
    const uc = kapamaNum(row?.ucuncu_kalite);
    const arti = kapamaNum(row?.arti_adet);
    const mtKes = Math.round(birim * kes * 100) / 100;
    const mt2k = Math.round(birim * iki * 100) / 100;
    const mt3k = Math.round(birim * uc * 100) / 100;
    const mtArti = Math.round(birim * arti * 100) / 100;
    const mtToplam = Math.round((mtKes + mt2k + mt3k + mtArti) * 100) / 100;
    return { birim, kes, iki, uc, arti, mtKes, mt2k, mt3k, mtArti, mtToplam, adToplam: kes + iki + uc + arti };
}

function kapamaAksesuarToplam(kd) {
    const arr = Array.isArray(kd?.aksesuarlar) ? kd.aksesuarlar : [];
    let fatura = 0, sip = 0, al = 0;
    arr.forEach(a => {
        fatura += kapamaNum(a.fatura_tl);
        sip += kapamaNum(a.siparis_adet);
        al += kapamaNum(a.alinan_adet);
    });
    return { fatura: Math.round(fatura * 100) / 100, siparis_adet: sip, alinan_adet: al, satir: arr.length };
}

function kapamaAksesuarSatirHtml(i, a = {}) {
    const fat = a.fatura_tl;
    const birim = kapamaNum(a.alinan_adet) > 0 && kapamaNum(fat) > 0
        ? (kapamaNum(fat) / kapamaNum(a.alinan_adet)).toLocaleString('tr-TR', { maximumFractionDigits: 4 })
        : '—';
    const td = 'padding:5px 6px;border:1px solid var(--border);vertical-align:middle';
    return `<tr data-ak-idx="${i}">
        <td style="${td}"><input type="text" class="pro-input kap-ak-ad" style="width:100%;box-sizing:border-box;font-size:10px" value="${pdfEsc(a.ad || '')}" placeholder="Örn. Fermuar" oninput="kapamaCanliAnaliz()"></td>
        <td style="${td};width:90px"><input type="number" min="0" step="1" class="pro-input kap-ak-sip" style="width:100%;box-sizing:border-box;font-size:10px;text-align:right" value="${a.siparis_adet !== undefined && a.siparis_adet !== '' ? a.siparis_adet : ''}" placeholder="15900" oninput="kapamaCanliAnaliz()"></td>
        <td style="${td};width:90px"><input type="number" min="0" step="1" class="pro-input kap-ak-al" style="width:100%;box-sizing:border-box;font-size:10px;text-align:right" value="${a.alinan_adet !== undefined && a.alinan_adet !== '' ? a.alinan_adet : ''}" placeholder="16000" oninput="kapamaCanliAnaliz()"></td>
        <td style="${td};width:100px"><input type="number" min="0" step="0.01" class="pro-input kap-ak-fat" style="width:100%;box-sizing:border-box;font-size:10px;text-align:right" value="${fat !== undefined && fat !== '' ? fat : ''}" placeholder="₺" oninput="kapamaCanliAnaliz()"></td>
        <td style="${td};width:72px;text-align:right;font-family:'DM Mono',monospace;font-size:9px;color:var(--text3)" id="kap-ak-birim-${i}">${birim}</td>
        <td style="${td};width:36px;text-align:center"><button type="button" class="btn-pro btn-ghost-pro" style="padding:2px 8px;font-size:14px" onclick="kapamaAksesuarSatirSil(this)" title="Sil">×</button></td>
    </tr>`;
}

function kapamaAksesuarPanelHtml(kd) {
    const arr = Array.isArray(kd?.aksesuarlar) && kd.aksesuarlar.length ? kd.aksesuarlar : [{ ad: '', siparis_adet: '', alinan_adet: '', fatura_tl: '' }];
    const rows = arr.map((a, i) => kapamaAksesuarSatirHtml(i, a)).join('');
    const t = kapamaAksesuarToplam(kd);
    return `<div class="panel-box" style="padding:14px 16px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text3)">🧷 Aksesuar alımları</div>
            <button type="button" class="btn-pro btn-ghost-pro" style="font-size:10px" onclick="kapamaAksesuarSatirEkle()">+ Aksesuar satırı</button>
        </div>
        <div style="font-size:10px;color:var(--text3);margin-bottom:8px">Sipariş adedi, alınan adet ve fatura tutarını ayrı girin (ör. 15.900 sipariş · 16.000 adet alındı · fatura 45.000 ₺).</div>
        <div class="overflow-x-auto" style="border:1px solid var(--border);border-radius:10px"><table style="width:100%;min-width:520px;table-layout:fixed;border-collapse:collapse;font-size:10px">
            <thead><tr style="background:var(--surface2)">
                <th style="padding:6px;text-align:left;border:1px solid var(--border)">Aksesuar</th>
                <th style="padding:6px;text-align:right;border:1px solid var(--border);width:90px">Sipariş adet</th>
                <th style="padding:6px;text-align:right;border:1px solid var(--border);width:90px">Alınan adet</th>
                <th style="padding:6px;text-align:right;border:1px solid var(--border);width:100px">Fatura (₺)</th>
                <th style="padding:6px;text-align:right;border:1px solid var(--border);width:72px">Birim ₺</th>
                <th style="padding:6px;border:1px solid var(--border);width:36px"></th>
            </tr></thead>
            <tbody id="kap-aksesuar-list">${rows}</tbody>
        </table></div>
        <div id="kapama-aksesuar-toplam" style="margin-top:10px;font-size:10px;font-family:'DM Mono',monospace;color:var(--text2)">
            Toplam fatura: <b>${t.fatura.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</b>
            · ${t.satir} satır · sipariş ${t.siparis_adet.toLocaleString('tr-TR')} ad · alınan ${t.alinan_adet.toLocaleString('tr-TR')} ad
        </div>
    </div>`;
}

function kapamaAksesuarSatirEkle() {
    const tb = document.getElementById('kap-aksesuar-list');
    if (!tb) return;
    const i = tb.querySelectorAll('tr[data-ak-idx]').length;
    tb.insertAdjacentHTML('beforeend', kapamaAksesuarSatirHtml(i, {}));
}

function kapamaAksesuarSatirSil(btn) {
    const tb = document.getElementById('kap-aksesuar-list');
    const tr = btn?.closest?.('tr[data-ak-idx]');
    if (!tb || !tr) return;
    if (tb.querySelectorAll('tr[data-ak-idx]').length <= 1) {
        tr.querySelectorAll('input').forEach(inp => { inp.value = ''; });
        kapamaCanliAnaliz();
        return;
    }
    tr.remove();
    kapamaCanliAnaliz();
}

function kapamaKalemKumasOzetHtml(kd, kalemler) {
    if (!kalemler.length) return '';
    let topMt = 0;
    const rows = kalemler.map((kl, i) => {
        const row = kd.kalem?.[`kalem_${i}`] || {};
        const d = kapamaKalemKumasDetay(row, kl);
        topMt += d.mtToplam;
        const ad = String(kl.ad || kl.kod || `Parça ${i + 1}`).slice(0, 24);
        return `<tr style="border-top:1px solid var(--border)">
            <td class="px-2 py-2 font-weight:600">${pdfEsc(ad)}</td>
            <td class="px-2 py-2 text-right;font-family:'DM Mono',monospace">${d.birim || '—'}</td>
            <td class="px-2 py-2 text-right">${d.kes.toLocaleString('tr-TR')} → <b>${d.mtKes.toLocaleString('tr-TR')}</b> mt</td>
            <td class="px-2 py-2 text-right">${d.iki.toLocaleString('tr-TR')} → <b>${d.mt2k.toLocaleString('tr-TR')}</b> mt</td>
            <td class="px-2 py-2 text-right">${d.uc.toLocaleString('tr-TR')} → <b>${d.mt3k.toLocaleString('tr-TR')}</b> mt</td>
            <td class="px-2 py-2 text-right">${d.arti.toLocaleString('tr-TR')} → <b>${d.mtArti.toLocaleString('tr-TR')}</b> mt</td>
            <td class="px-2 py-2 text-right;font-weight:800;color:var(--violet-c)">${d.mtToplam.toLocaleString('tr-TR')} mt</td>
        </tr>`;
    }).join('');
    return `<div class="panel-box" style="padding:12px 14px;background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.2)">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text3);margin-bottom:8px">📐 Parça bazlı kumaş tüketimi (birim mt × adet)</div>
        <div class="overflow-x-auto"><table class="w-full text-[10px]">
            <thead style="background:var(--surface2)"><tr>
                <th class="text-left px-2 py-2">Parça</th>
                <th class="text-right px-2 py-2">Birim mt</th>
                <th class="text-right px-2 py-2">Kesim</th>
                <th class="text-right px-2 py-2">2. kalite</th>
                <th class="text-right px-2 py-2">3. kalite</th>
                <th class="text-right px-2 py-2">Artı / fazla</th>
                <th class="text-right px-2 py-2">Toplam mt</th>
            </tr></thead>
            <tbody>${rows}</tbody>
            <tfoot><tr style="border-top:2px solid var(--border);font-weight:800">
                <td colspan="6" class="px-2 py-2 text-right">Tüm parçalar</td>
                <td class="px-2 py-2 text-right;font-family:'DM Mono',monospace;color:var(--violet-c)">${Math.round(topMt * 100) / 100} mt</td>
            </tr></tfoot>
        </table></div>
    </div>`;
}

function kapamaPlanKumasMt(siparisId, kalemler) {
    const kdUa = _kdCache[`KD_URUN_AGACI_${siparisId}`] || {};
    return kalemler.reduce((a, k, i) => {
        const ua = kdUa[`u_${i}`] || {};
        const m = kapamaNum(ua.kumas_metre);
        const ad = parseInt(k.miktar, 10) || 0;
        return a + (m > 0 && ad > 0 ? m * ad : 0);
    }, 0);
}

async function kapamaSistemdenCek(siparisId) {
    const sid = String(siparisId);
    await Promise.all([
        sbKdGet(sid, 'KD_KONFEKSIYON', true),
        sbKdGet(sid, 'KD_DOKUMA', true),
        sbKdGet(sid, 'KD_URUN_AGACI', true),
    ]);
    const siparis = (dataCache.siparisler || []).find(s => String(s.id) === sid);
    const kalemler = uaSiparisKalemleriGetir(siparis);
    const kdK = _kdCache[`KD_KONFEKSIYON_${sid}`] || {};
    const kdD = _kdCache[`KD_DOKUMA_${sid}`] || {};
    const urunler = kdD.urunler || {};
    const planMt = Math.round(kapamaPlanKumasMt(sid, kalemler) * 100) / 100;
    let dokMt = 0, dokAd = 0;
    kalemler.forEach((_, i) => {
        const u = urunler[i] || {};
        dokMt += kapamaNum(u.toplam_metre);
        dokAd += parseInt(u.toplam_adet, 10) || parseInt(u.toplam_kg, 10) || 0;
    });
    const kalem = {};
    kalemler.forEach((k, i) => {
        const kk = kdK[`kalem_${i}`] || {};
        const u = urunler[i] || {};
        const ikiDet = konfIkinciKaliteDetayNorm(kk.iki_kalite_detay || {});
        const iki = konfIkinciKaliteDetayToplam(ikiDet) || parseInt(kk.iki_kalite, 10) || 0;
        kalem[`kalem_${i}`] = {
            hedef: parseInt(k.miktar, 10) || 0,
            dokuma_metre: kapamaNum(u.toplam_metre),
            dokuma_adet: parseInt(u.toplam_adet, 10) || 0,
            kesim_metraj: kapamaNum(kk.kesim_metraj),
            kesim_adet: parseInt(kk.kesilen, 10) || 0,
            dikilen: parseInt(kk.dikilen, 10) || 0,
            kk_gecen: parseInt(kk.kk_gecen, 10) || 0,
            ikinci_kalite: iki,
            kolide: parseInt(kk.kolide, 10) || 0,
            sevk: parseInt(kk.sevk_edilen, 10) || 0,
        };
    });
    const mevcut = _kdCache[`${KAPAMA_KD_TIP}_${sid}`] || {};
    return {
        ...mevcut,
        meta: { ...(mevcut.meta || {}), guncelleme: new Date().toISOString(), kaynak: 'sistem' },
        kumas: {
            plan_mt: planMt,
            giren_mt: kapamaNum(mevcut.kumas?.giren_mt) || dokMt,
            kullanilan_mt: kapamaNum(mevcut.kumas?.kullanilan_mt) || dokMt,
            fire_mt: kapamaNum(mevcut.kumas?.fire_mt),
        },
        maliyet: { ...(mevcut.maliyet || {}), kumas_tl: kapamaNum(mevcut.maliyet?.kumas_tl), konfeksiyon_tl: kapamaNum(mevcut.maliyet?.konfeksiyon_tl), aksesuar_tl: kapamaNum(mevcut.maliyet?.aksesuar_tl), diger_tl: kapamaNum(mevcut.maliyet?.diger_tl), satis_tl: kapamaNum(mevcut.maliyet?.satis_tl) },
        kalem,
        ozet: { dokuma_toplam_adet: dokAd, dokuma_toplam_metre: Math.round(dokMt * 100) / 100 },
    };
}

function kapamaFormdanOku() {
    const sid = String(kapamaSiparisId || '');
    const kd = (_kdCache[`${KAPAMA_KD_TIP}_${sid}`] || {});
    const kalemler = kapamaKalemlerGetir(sid, kd);
    const kumas = {
        ...(kd.kumas || {}),
        plan_mt: kapamaNum(document.getElementById('kap-kumas-plan')?.value),
        dokunan_mt: kapamaNum(document.getElementById('kap-kumas-dokunan')?.value),
        baskiya_giden_mt: kapamaNum(document.getElementById('kap-kumas-baskiya')?.value),
        baskidan_gelen_mt: kapamaNum(document.getElementById('kap-kumas-baskidan')?.value),
        giren_mt: kapamaNum(document.getElementById('kap-kumas-giren')?.value),
        kullanilan_mt: kapamaNum(document.getElementById('kap-kumas-kullan')?.value),
        fire_mt: kapamaNum(document.getElementById('kap-kumas-fire')?.value),
        kalan_mt: kapamaNum(document.getElementById('kap-kumas-kalan')?.value),
        kesim_birim_mt: kapamaNum(document.getElementById('kap-kumas-kesim-birim')?.value),
    };
    if (!kumas.kullanilan_mt && kumas.baskidan_gelen_mt) kumas.kullanilan_mt = kumas.baskidan_gelen_mt;
    if (!kumas.giren_mt && kumas.dokunan_mt) kumas.giren_mt = kumas.dokunan_mt;
    const maliyet = {
        kumas_tl: kapamaNum(document.getElementById('kap-mal-kumas')?.value),
        konfeksiyon_tl: kapamaNum(document.getElementById('kap-mal-konf')?.value),
        aksesuar_tl: kapamaNum(document.getElementById('kap-mal-aks')?.value),
        diger_tl: kapamaNum(document.getElementById('kap-mal-diger')?.value),
        satis_tl: kapamaNum(document.getElementById('kap-mal-satis')?.value),
    };
    const kalem = { ...(kd.kalem || {}) };
    const manuel_kalemler = [];
    kalemler.forEach((kl, i) => {
        const g = (id) => document.getElementById(`kap-kalem-${i}-${id}`);
        const row = {
            hedef: kapamaNum(g('hedef')?.value) || kl.miktar || 0,
            dokuma_metre: kapamaNum(g('dok-mt')?.value),
            dokuma_adet: kapamaNum(g('dok-ad')?.value),
            kesim_birim_mt: kapamaNum(g('kes-birim')?.value),
            kesim_metraj: kapamaNum(g('kes-mt')?.value),
            kesim_adet: kapamaNum(g('kes-ad')?.value),
            dikilen: kapamaNum(g('dik')?.value),
            kk_gecen: kapamaNum(g('kk')?.value),
            ikinci_kalite: kapamaNum(g('iki')?.value),
            ucuncu_kalite: kapamaNum(g('uc')?.value),
            arti_adet: kapamaNum(g('arti')?.value),
            kolide: kapamaNum(g('kol')?.value),
            sevk: kapamaNum(g('sevk')?.value),
        };
        kalem[`kalem_${i}`] = row;
        if (kapamaIsManuel(sid)) {
            manuel_kalemler.push({
                ad: String(document.getElementById(`kap-kalem-${i}-ad`)?.value || kl.ad || '').trim() || `Kalem ${i + 1}`,
                hedef: row.hedef,
                kesim_birim_mt: row.kesim_birim_mt,
            });
        }
    });
    const meta = {
        ...(kd.meta || {}),
        tarih: document.getElementById('kap-meta-tarih')?.value || kd.meta?.tarih,
        not: document.getElementById('kap-meta-not')?.value || kd.meta?.not || '',
        guncelleme: new Date().toISOString(),
    };
    if (kapamaIsManuel(sid)) {
        meta.tip = 'manuel';
        meta.baslik = String(document.getElementById('kap-manuel-baslik')?.value || meta.baslik || '').trim();
        meta.firma = String(document.getElementById('kap-manuel-firma')?.value || meta.firma || '').trim();
    }
    const aksesuarlar = [];
    document.querySelectorAll('#kap-aksesuar-list tr[data-ak-idx]').forEach(tr => {
        const ad = String(tr.querySelector('.kap-ak-ad')?.value || '').trim();
        const siparis_adet = kapamaNum(tr.querySelector('.kap-ak-sip')?.value);
        const alinan_adet = kapamaNum(tr.querySelector('.kap-ak-al')?.value);
        const fatura_tl = kapamaNum(tr.querySelector('.kap-ak-fat')?.value);
        if (ad || siparis_adet || alinan_adet || fatura_tl) aksesuarlar.push({ ad: ad || 'Aksesuar', siparis_adet, alinan_adet, fatura_tl });
    });
    const out = { ...kd, meta, kumas, maliyet, kalem, aksesuarlar };
    if (kapamaIsManuel(sid) && manuel_kalemler.length) out.manuel_kalemler = manuel_kalemler;
    return out;
}

function kapamaEksikAlanlar(kd, kalemler, siparisId) {
    const eksik = [];
    const k = kd.kumas || {};
    const manuel = kapamaIsManuel(siparisId);
    if (manuel) {
        if (!String(kd.meta?.baslik || '').trim()) eksik.push('Simülasyon adı (ör. Nevresim seti)');
        if (!(kapamaNum(k.dokunan_mt) > 0)) eksik.push('Dokunan kumaş (mt)');
        if (!(kapamaNum(k.baskiya_giden_mt) > 0)) eksik.push('Baskıya giden kumaş (mt)');
        if (!(kapamaNum(k.baskidan_gelen_mt) > 0)) eksik.push('Baskıdan gelen kumaş (mt)');
    } else {
        if (!(kapamaNum(k.plan_mt) > 0)) eksik.push('Kumaş — planlanan metraj');
        const kullan = kapamaNum(k.kullanilan_mt) || kapamaNum(k.baskidan_gelen_mt) || kapamaNum(k.dokunan_mt);
        if (!(kullan > 0)) eksik.push('Kumaş — kullanılan metraj');
    }
    const m = kd.maliyet || {};
    if (!manuel) {
        ['kumas_tl', 'konfeksiyon_tl', 'aksesuar_tl', 'satis_tl'].forEach(key => {
            const lbl = { kumas_tl: 'Maliyet — kumaş', konfeksiyon_tl: 'Maliyet — konfeksiyon', aksesuar_tl: 'Maliyet — aksesuar', satis_tl: 'Maliyet — satış geliri' }[key];
            if (!(kapamaNum(m[key]) > 0)) eksik.push(lbl);
        });
    }
    kalemler.forEach((kl, i) => {
        const row = kd.kalem?.[`kalem_${i}`] || {};
        const etik = String(kl.ad || kl.kod || `Kalem ${i + 1}`).slice(0, 28);
        const birimKes = kapamaNum(row.kesim_birim_mt ?? k.kesim_birim_mt);
        if (manuel && !(birimKes > 0)) eksik.push(`${etik} — birim kesim ölçüsü (mt/adet)`);
        if (!(kapamaNum(row.kesim_adet) > 0)) eksik.push(`${etik} — kesilen adet`);
        if (!manuel) {
            if (!(kapamaNum(row.kolide) > 0) && !(kapamaNum(row.kk_gecen) > 0)) eksik.push(`${etik} — çıkan ürün (koli veya KK)`);
        }
        if (!manuel) {
            if (row.ikinci_kalite === '' || row.ikinci_kalite === undefined || row.ikinci_kalite === null) {
                eksik.push(`${etik} — 2. kalite (0 yazılabilir)`);
            } else if (!Number.isFinite(kapamaNum(row.ikinci_kalite)) && row.ikinci_kalite !== 0) eksik.push(`${etik} — 2. kalite`);
        }
    });
    if (manuel) {
        const h = kapamaKumasHesapOzet(kd, kalemler);
        if (h.kesAd > 0 && h.birimKes <= 0) eksik.push('Birim kesim ölçüsü');
    }
    return eksik;
}

function kapamaAnalizHesapla(kd, kalemler) {
    const kumas = kd.kumas || {};
    const mal = kd.maliyet || {};
    const h = kapamaKumasHesapOzet(kd, kalemler);
    const planMt = kapamaNum(kumas.plan_mt) || h.dok;
    const kullanMt = kapamaNum(kumas.kullanilan_mt) || h.baskD || h.dok;
    const fireMt = kapamaNum(kumas.fire_mt) || h.toplamFire;
    const kumasFarkMt = Math.round((kullanMt - planMt) * 100) / 100;
    let hedefTop = 0, cikanTop = 0, eksikTop = 0, ikiTop = 0, ucTop = 0, artiTop = 0, kesTop = 0, kumasParcaMt = 0;
    kalemler.forEach((k, i) => {
        const row = kd.kalem?.[`kalem_${i}`] || {};
        const hedef = parseInt(k.miktar, 10) || kapamaNum(row.hedef);
        const cikan = Math.max(kapamaNum(row.kolide), kapamaNum(row.kk_gecen), kapamaNum(row.sevk));
        const iki = kapamaNum(row.ikinci_kalite);
        const uc = kapamaNum(row.ucuncu_kalite);
        const arti = kapamaNum(row.arti_adet);
        const kDet = kapamaKalemKumasDetay(row, k);
        hedefTop += hedef;
        cikanTop += cikan;
        eksikTop += Math.max(0, hedef - cikan);
        ikiTop += iki;
        ucTop += uc;
        artiTop += arti;
        kesTop += kapamaNum(row.kesim_adet);
        kumasParcaMt += kDet.mtToplam;
    });
    const aksTop = kapamaAksesuarToplam(kd);
    const maliyetTop = kapamaNum(mal.kumas_tl) + kapamaNum(mal.konfeksiyon_tl) + kapamaNum(mal.aksesuar_tl) + aksTop.fatura + kapamaNum(mal.diger_tl);
    const gelir = kapamaNum(mal.satis_tl);
    const karZarar = Math.round((gelir - maliyetTop) * 100) / 100;
    const birimMal = hedefTop > 0 ? maliyetTop / hedefTop : 0;
    const fireAdTop = ikiTop + ucTop + artiTop;
    const bosGidenTahmin = Math.round((fireAdTop * birimMal + fireMt * (planMt > 0 ? kapamaNum(mal.kumas_tl) / planMt : 0)) * 100) / 100;
    const verim = hedefTop > 0 ? Math.round(cikanTop / hedefTop * 100) : 0;
    const fireOran = kullanMt > 0 ? Math.round(fireMt / kullanMt * 100) : 0;
    return {
        planMt, kullanMt, fireMt, kumasFarkMt,
        hedefTop, cikanTop, eksikTop, ikiTop, ucTop, artiTop, kesTop, kumasParcaMt,
        aksesuarToplam: aksTop,
        maliyetTop, gelir, karZarar, bosGidenTahmin, verim, fireOran,
        kumasZincir: h,
    };
}

function kapamaKumasPanelHtml(kd, kalemler, manuel) {
    const k = kd.kumas || {};
    const h = kapamaKumasHesapOzet(kd, kalemler);
    const inp = (id, lbl, val, title) => `<div style="display:flex;flex-direction:column;gap:4px;min-width:0">
        <label class="pro-label" style="margin:0;min-height:28px;display:flex;align-items:flex-end;line-height:1.25;font-size:9px" title="${pdfEsc(title || '')}">${lbl}</label>
        <input id="${id}" type="number" step="0.01" class="pro-input" style="width:100%;box-sizing:border-box" value="${val === '' || val === undefined ? '' : val}" oninput="kapamaCanliAnaliz()"></div>`;
    const erpExtra = manuel ? '' : `
        ${inp('kap-kumas-plan', 'Plan (ürün ağacı)', k.plan_mt, '')}
        ${inp('kap-kumas-giren', 'Depoya giren', k.giren_mt, '')}
        ${inp('kap-kumas-kullan', 'Kullanılan (özet)', k.kullanilan_mt, '')}`;
    return `<div class="panel-box" style="padding:14px 16px">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:10px;color:var(--text3)">🧵 Kumaş akışı (mt)</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(108px,1fr));gap:10px 12px;align-items:end">
            ${inp('kap-kumas-dokunan', 'Dokunan', k.dokunan_mt, 'Dokumadan çıkan toplam metraj')}
            ${inp('kap-kumas-baskiya', 'Baskıya giden', k.baskiya_giden_mt, '')}
            ${inp('kap-kumas-baskidan', 'Baskıdan gelen', k.baskidan_gelen_mt, '')}
            ${inp('kap-kumas-kesim-birim', 'Birim kesim (mt/ad)', k.kesim_birim_mt || h.birimKes, 'Tek parça/set için kumaş mt')}
            ${inp('kap-kumas-fire', 'Fire (manuel)', k.fire_mt, 'Boş bırakırsanız hesaplanır')}
            ${inp('kap-kumas-kalan', 'Kalan kumaş', k.kalan_mt, 'Boş = otomatik hesap')}
            ${erpExtra}
        </div>
        <div style="margin-top:12px;padding:10px 12px;border-radius:10px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);font-size:10px;line-height:1.55;color:var(--text2)">
            <b>Hesap özeti:</b> Kesimde kullanılan ≈ <b>${h.kesimKull.toLocaleString('tr-TR')} mt</b> (${h.birimKes} × ${h.kesAd} adet)
            · Baskı kaybı ≈ <b>${h.baskiFire.toLocaleString('tr-TR')} mt</b>
            · Dokuma→baskı fark ≈ <b>${h.dokBaskiFark.toLocaleString('tr-TR')} mt</b>
            · Kalan ≈ <b>${h.kalan.toLocaleString('tr-TR')} mt</b>
            · Fire (kesim sonrası) ≈ <b>${(h.fireMt || h.toplamFire).toLocaleString('tr-TR')} mt</b>
        </div>
    </div>`;
}

function kapamaAnalizHtml(kd, kalemler, eksik) {
    const tamam = !eksik.length;
    const a = kapamaAnalizHesapla(kd, kalemler);
    const z = a.kumasZincir || {};
    const kumasMsg = z.baskD > 0
        ? `Kumaş zinciri: dokunan <b>${z.dok.toLocaleString('tr-TR')}</b> → baskıya <b>${z.baskG}</b> → baskıdan <b>${z.baskD}</b> mt · kesimde <b>${z.kesimKull}</b> mt kullanıldı · kalan <b>${z.kalan}</b> mt · fire <b>${(z.fireMt || z.toplamFire)}</b> mt.`
        : (a.kumasFarkMt > 0
            ? `Plana göre <b>${a.kumasFarkMt.toLocaleString('tr-TR')} mt</b> fazla kumaş.`
            : a.kumasFarkMt < 0
                ? `Plandan <b>${Math.abs(a.kumasFarkMt).toLocaleString('tr-TR')} mt</b> eksik kayıt.`
                : 'Kumaş metrajı plan ile uyumlu.');
    const urunMsg = a.eksikTop > 0
        ? `Siparişe göre toplam <b>${a.eksikTop.toLocaleString('tr-TR')} adet</b> ürün eksik (hedef ${a.hedefTop.toLocaleString('tr-TR')} · çıkan ${a.cikanTop.toLocaleString('tr-TR')}).`
        : 'Sipariş adedi karşılanmış veya aşılmış.';
    const kalMsg = (a.ikiTop + a.ucTop + a.artiTop) > 0
        ? `Kalite / artı: <b>${a.ikiTop.toLocaleString('tr-TR')}</b> ad 2.kal · <b>${a.ucTop.toLocaleString('tr-TR')}</b> ad 3.kal · <b>${a.artiTop.toLocaleString('tr-TR')}</b> ad artı/fazla · parça kumaşı <b>${(a.kumasParcaMt || 0).toLocaleString('tr-TR')} mt</b>.`
        : '2./3. kalite ve artı adet kaydı yok.';
    const aksMsg = a.aksesuarToplam?.fatura > 0
        ? `Aksesuar faturaları toplam <b>${a.aksesuarToplam.fatura.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</b> (${a.aksesuarToplam.satir} kalem · alınan ${a.aksesuarToplam.alinan_adet.toLocaleString('tr-TR')} ad).`
        : 'Aksesuar fatura satırı girilmemiş.';
    const paraMsg = a.bosGidenTahmin > 0
        ? `Tahmini boşa giden maliyet: <b>${a.bosGidenTahmin.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</b> (2./3. kalite, artı + fire).`
        : 'Fire / kalite maliyet etkisi düşük.';
    const kzMsg = a.karZarar >= 0
        ? `Bu kapama dosyasına göre <b>${a.karZarar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</b> kar görünüyor (gelir ${a.gelir.toLocaleString('tr-TR')} ₺ · maliyet ${a.maliyetTop.toLocaleString('tr-TR')} ₺).`
        : `<b>${Math.abs(a.karZarar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</b> zarar görünüyor (gelir ${a.gelir.toLocaleString('tr-TR')} ₺ · maliyet ${a.maliyetTop.toLocaleString('tr-TR')} ₺).`;
    const durumRenk = tamam ? (a.karZarar >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.1)') : 'rgba(245,158,11,0.1)';
    const durumKenar = tamam ? (a.karZarar >= 0 ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.35)') : 'rgba(245,158,11,0.35)';
    return `
    <div class="panel-box" style="padding:16px 18px;border-color:${durumKenar};background:${durumRenk}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
            <span style="font-size:22px">${tamam ? (a.karZarar >= 0 ? '✅' : '⚠️') : '📝'}</span>
            <div>
                <div style="font-size:13px;font-weight:800;color:var(--text)">${tamam ? 'Kapama analizi hazır' : 'Eksik alanlar var'}</div>
                <div style="font-size:10px;color:var(--text2);margin-top:2px">${tamam ? 'Tüm zorunlu alanlar dolduruldu — özet aşağıda.' : `${eksik.length} alan bekliyor · doldurdukça özet güncellenir.`}</div>
            </div>
            <span class="pill ${tamam ? 'pill-cyan' : 'pill-amber'}" style="margin-left:auto">${tamam ? 'TAM' : `${eksik.length} eksik`}</span>
        </div>
        ${tamam ? `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px">
            ${[
                { l: 'Kumaş fark', v: `${a.kumasFarkMt >= 0 ? '+' : ''}${a.kumasFarkMt} mt`, c: a.kumasFarkMt > 0 ? '#f43f5e' : '#10b981' },
                { l: 'Ürün eksik', v: a.eksikTop.toLocaleString('tr-TR'), c: a.eksikTop > 0 ? '#f59e0b' : '#10b981' },
                { l: '2./3.kal+artı', v: `${(a.ikiTop + a.ucTop + a.artiTop).toLocaleString('tr-TR')} ad`, c: '#f59e0b' },
                { l: 'Parça kumaş', v: `${(a.kumasParcaMt || 0).toLocaleString('tr-TR')} mt`, c: '#8b5cf6' },
                { l: 'Verim', v: `%${a.verim}`, c: '#6366f1' },
                { l: 'Kar / zarar', v: `${a.karZarar >= 0 ? '+' : ''}${a.karZarar.toLocaleString('tr-TR')} ₺`, c: a.karZarar >= 0 ? '#10b981' : '#f43f5e' },
            ].map(x => `<div style="text-align:center;padding:10px;background:var(--surface);border-radius:10px;border:1px solid var(--border)">
                <div style="font-size:16px;font-weight:800;color:${x.c}">${x.v}</div>
                <div style="font-size:8px;font-weight:700;color:var(--text3);text-transform:uppercase;margin-top:4px">${x.l}</div>
            </div>`).join('')}
        </div>
        <ul style="margin:0;padding-left:18px;font-size:11px;color:var(--text);line-height:1.65">
            <li>${kumasMsg}</li>
            <li>${urunMsg}</li>
            <li>${kalMsg}</li>
            <li>${aksMsg}</li>
            <li>${paraMsg}</li>
            <li>${kzMsg}</li>
        </ul>` : `
        <div style="font-size:10px;color:var(--text2);max-height:120px;overflow:auto">
            ${eksik.slice(0, 12).map(e => `<div style="padding:3px 0">· ${pdfEsc(e)}</div>`).join('')}
            ${eksik.length > 12 ? `<div style="color:var(--text3)">… +${eksik.length - 12} alan</div>` : ''}
        </div>`}
    </div>`;
}

function kapamaKalemTabloHtml(kalemler, kd, manuel) {
    const W = { urun: manuel ? 108 : 128, num: 56, kumas: 52 };
    const inp = (i, f, val, ro, typ) => {
        const v = val === '' || val === undefined ? '' : (typ === 'text' ? pdfEsc(String(val)) : String(val));
        return `<input id="kap-kalem-${i}-${f}" type="${typ || 'number'}" class="pro-input" style="width:100%;min-width:0;box-sizing:border-box;padding:4px 5px;font-size:10px;text-align:${typ === 'text' ? 'left' : 'right'}" value="${v}" ${ro ? 'readonly' : ''} oninput="kapamaCanliAnaliz()">`;
    };
    const thG = 'padding:6px 5px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--text3);text-align:center;white-space:nowrap;background:rgba(99,102,241,0.1);border:1px solid var(--border);vertical-align:middle';
    const thS = 'padding:5px 5px;font-size:8px;font-weight:700;color:var(--text2);white-space:nowrap;background:var(--surface2);border:1px solid var(--border);vertical-align:middle';
    const tdC = 'padding:4px 5px;border:1px solid var(--border);vertical-align:middle';
    const erpGrp = manuel ? '' : `<th colspan="3" style="${thG}">Dokuma</th>`;
    const erpSub = manuel ? '' : `
                <th style="${thS};text-align:right;width:${W.num}px">Mt</th>
                <th style="${thS};text-align:right;width:${W.num}px">Ad</th>
                <th style="${thS};text-align:right;width:${W.num}px">Kes.mt</th>`;
    const erpCells = (i, r) => manuel ? '' : `
                <td style="${tdC};width:${W.num}px">${inp(i, 'dok-mt', r.dokuma_metre ?? '', false)}</td>
                <td style="${tdC};width:${W.num}px">${inp(i, 'dok-ad', r.dokuma_adet ?? '', false)}</td>
                <td style="${tdC};width:${W.num}px">${inp(i, 'kes-mt', r.kesim_metraj ?? '', false)}</td>`;
    const minW = manuel ? 940 : 1100;
    return `<div class="overflow-x-auto" style="border:1px solid var(--border);border-radius:10px">
        <table style="width:100%;min-width:${minW}px;table-layout:fixed;border-collapse:collapse;font-size:10px">
        <thead>
            <tr>
                <th rowspan="2" style="${thG};text-align:left;width:${W.urun}px">Ürün</th>
                <th rowspan="2" style="${thG};text-align:right;width:${W.num}px">Hedef</th>
                <th rowspan="2" style="${thG};text-align:right;width:${W.num}px">Birim mt</th>
                ${erpGrp}
                <th colspan="1" style="${thG}">Kesim</th>
                <th colspan="2" style="${thG}">Üretim</th>
                <th colspan="3" style="${thG}">Kalite</th>
                <th rowspan="2" style="${thG};text-align:right;width:${W.kumas}px">Kumaş mt</th>
                <th colspan="2" style="${thG}">Sevk</th>
            </tr>
            <tr>
                ${erpSub}
                <th style="${thS};text-align:right">Kesilen ad</th>
                <th style="${thS};text-align:right">Dikim</th>
                <th style="${thS};text-align:right">KK geçen</th>
                <th style="${thS};text-align:right">2. kalite</th>
                <th style="${thS};text-align:right">3. kalite</th>
                <th style="${thS};text-align:right" title="Fazla / artı adet">Artı</th>
                <th style="${thS};text-align:right">Koli</th>
                <th style="${thS};text-align:right">Sevk</th>
            </tr>
        </thead>
        <tbody>${kalemler.map((k, i) => {
            const r = kd.kalem?.[`kalem_${i}`] || {};
            const hedef = parseInt(k.miktar, 10) || kapamaNum(r.hedef) || 0;
            const km = kapamaKalemKumasDetay(r, k);
            const urunCell = manuel
                ? `<td style="${tdC};width:${W.urun}px">${inp(i, 'ad', k.ad || '', false, 'text')}</td>`
                : `<td style="${tdC};width:${W.urun}px"><div style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${pdfEsc(k.ad || k.kod || '')}">${pdfEsc(k.ad || k.kod || '—')}</div><div style="font-size:8px;color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pdfEsc(k.renk || '')} ${pdfEsc(k.ebat || '')}</div></td>`;
            return `<tr>
                ${urunCell}
                <td style="${tdC};text-align:right">${inp(i, 'hedef', hedef, !manuel)}</td>
                <td style="${tdC};text-align:right">${inp(i, 'kes-birim', r.kesim_birim_mt ?? k.kesim_birim_mt ?? '', false)}</td>
                ${erpCells(i, r)}
                <td style="${tdC};text-align:right">${inp(i, 'kes-ad', r.kesim_adet ?? '', false)}</td>
                <td style="${tdC};text-align:right">${inp(i, 'dik', r.dikilen ?? '', false)}</td>
                <td style="${tdC};text-align:right">${inp(i, 'kk', r.kk_gecen ?? '', false)}</td>
                <td style="${tdC};text-align:right">${inp(i, 'iki', r.ikinci_kalite ?? '', false)}</td>
                <td style="${tdC};text-align:right">${inp(i, 'uc', r.ucuncu_kalite ?? '', false)}</td>
                <td style="${tdC};text-align:right">${inp(i, 'arti', r.arti_adet ?? '', false)}</td>
                <td style="${tdC};text-align:right;font-family:'DM Mono',monospace;font-size:9px;color:var(--violet-c);white-space:nowrap" title="Kesim ${km.mtKes} + 2k ${km.mt2k} + 3k ${km.mt3k} + artı ${km.mtArti} mt">${km.mtToplam.toLocaleString('tr-TR')}</td>
                <td style="${tdC};text-align:right">${inp(i, 'kol', r.kolide ?? '', false)}</td>
                <td style="${tdC};text-align:right">${inp(i, 'sevk', r.sevk ?? '', false)}</td>
            </tr>`;
        }).join('')}</tbody>
        </table></div>`;
}

function kapamaCanliAnaliz() {
    const el = document.getElementById('kapama-analiz-wrap');
    const ozEl = document.getElementById('kapama-kumas-ozet-wrap');
    if (!kapamaSiparisId) return;
    const sid = String(kapamaSiparisId);
    const kd0 = _kdCache[`${KAPAMA_KD_TIP}_${sid}`] || {};
    const kalemler = kapamaKalemlerGetir(sid, kd0);
    const kd = kapamaFormdanOku();
    const eksik = kapamaEksikAlanlar(kd, kalemler, sid);
    if (el) el.innerHTML = kapamaAnalizHtml(kd, kalemler, eksik);
    if (ozEl) {
        const a = kapamaAnalizHesapla(kd, kalemler);
        const h = a.kumasZincir;
        ozEl.innerHTML = `<span>Parça kumaş: <b>${(a.kumasParcaMt || h.kesimKull).toLocaleString('tr-TR')} mt</b></span><span>Kalan: <b>${h.kalan} mt</b></span><span>Fire: <b>${h.fireMt || h.toplamFire} mt</b></span>`;
    }
    const kkEl = document.getElementById('kapama-kalem-kumas-wrap');
    if (kkEl) kkEl.innerHTML = kapamaKalemKumasOzetHtml(kd, kalemler);
    const akEl = document.getElementById('kapama-aksesuar-toplam');
    if (akEl) {
        const t = kapamaAksesuarToplam(kd);
        akEl.innerHTML = `Toplam fatura: <b>${t.fatura.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</b> · ${t.satir} satır · sipariş ${t.siparis_adet.toLocaleString('tr-TR')} ad · alınan ${t.alinan_adet.toLocaleString('tr-TR')} ad`;
        document.querySelectorAll('#kap-aksesuar-list tr[data-ak-idx]').forEach((tr, i) => {
            const al = kapamaNum(tr.querySelector('.kap-ak-al')?.value);
            const fat = kapamaNum(tr.querySelector('.kap-ak-fat')?.value);
            const el = document.getElementById(`kap-ak-birim-${i}`);
            if (el) el.textContent = al > 0 && fat > 0 ? (fat / al).toLocaleString('tr-TR', { maximumFractionDigits: 4 }) : '—';
        });
    }
}

async function kapamaSelectSiparis(id) {
    kapamaSiparisId = id || null;
    saveUiState({ kapamaSiparisId });
    await renderSiparisKapama();
}

async function kapamaSistemdenCekTikla() {
    if (!kapamaSiparisId) { erpToast('Önce sipariş seçin.', 'error'); return; }
    if (kapamaIsManuel(kapamaSiparisId)) { erpToast('Manuel simülasyonda veriler elle girilir.', 'info'); return; }
    try {
        const kd = await kapamaSistemdenCek(kapamaSiparisId);
        _kdCache[`${KAPAMA_KD_TIP}_${kapamaSiparisId}`] = kd;
        await renderSiparisKapama();
        erpToast('Konfeksiyon, dokuma ve ürün ağacından veriler çekildi.', 'success');
    } catch (e) {
        erpToast('Çekme hatası: ' + (e?.message || e), 'error');
    }
}

function kapamaSecimOptsHtml() {
    const siparisler = (dataCache.siparisler || []).filter(s => s.durum !== 'TAMAMLANDI' || String(s.id) === String(kapamaSiparisId));
    const manuel = kapamaManuelIndexGetir();
    const erpOpts = siparisler.map(s => `<option value="${s.id}" ${String(kapamaSiparisId) === String(s.id) ? 'selected' : ''}>${pdfEsc(s.sno)} — ${pdfEsc(s.firma || '?')}</option>`).join('');
    const manOpts = manuel.map(m => {
        const oz = m.ozet || (m.kd?.manuel_kalemler || []).map(k => `${k.hedef}× ${k.ad}`).join(' + ');
        return `<option value="${m.id}" ${String(kapamaSiparisId) === String(m.id) ? 'selected' : ''}>✨ ${pdfEsc(m.baslik)}${oz ? ' (' + pdfEsc(oz) + ')' : ''}${m.firma ? ' — ' + pdfEsc(m.firma) : ''}</option>`;
    }).join('');
    return `<option value="">— Seçin —</option>
        <optgroup label="Kayıtlı siparişler">${erpOpts || '<option disabled>(aktif sipariş yok)</option>'}</optgroup>
        <optgroup label="Manuel simülasyon">${manOpts || '<option disabled>(henüz yok)</option>'}</optgroup>`;
}

async function kapamaKaydet() {
    if (!kapamaSiparisId) { erpToast('Sipariş veya simülasyon seçin.', 'error'); return; }
    const kd = kapamaFormdanOku();
    try {
        await kapamaKdKaydet(kapamaSiparisId, kd);
        _kdCache[`${KAPAMA_KD_TIP}_${kapamaSiparisId}`] = kd;
        erpToast(kapamaIsManuel(kapamaSiparisId) ? 'Manuel simülasyon kaydedildi (bu cihazda).' : 'Kapama dosyası kaydedildi.', 'success');
        kapamaCanliAnaliz();
    } catch (e) {
        erpToast('Kayıt hatası: ' + (e?.message || e), 'error');
    }
}

async function renderSiparisKapama() {
    if (appMode !== 'PLANLAMA' || planlamaAltMode !== 'KAPAMA') return;
    const list = document.getElementById('main-list');
    if (!list) return;
    const secimOpts = kapamaSecimOptsHtml();

    if (!kapamaSiparisId) {
        list.innerHTML = `${planlamaAltSekmeHtml()}
        <div class="panel-box" style="padding:14px 16px">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                <div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;font-family:'DM Mono',monospace">Kaynak</div>
                <select class="pro-input" style="min-width:260px" onchange="kapamaSelectSiparis(this.value)">${secimOpts}</select>
            </div>
        </div>
        ${kapamaManuelOlusturFormHtml()}
        <div class="empty-pro" style="padding:32px 20px;margin-top:0">
            <div class="empty-pro-sub" style="margin-top:0">Veya yukarıdan kayıtlı bir <b>sipariş</b> / daha önce oluşturduğunuz <b>manuel simülasyon</b> seçin.</div>
        </div>`;
        return;
    }

    const sid = String(kapamaSiparisId);
    const manuel = kapamaIsManuel(sid);
    list.innerHTML = `<div class="panel-box" style="padding:40px;text-align:center;color:var(--text3)">Yükleniyor…</div>`;
    await kapamaKdYukle(sid, true);
    let kd = _kdCache[`${KAPAMA_KD_TIP}_${sid}`] || {};
    if (!manuel && (!kd.kalem || !Object.keys(kd.kalem).length)) {
        kd = await kapamaSistemdenCek(sid);
        _kdCache[`${KAPAMA_KD_TIP}_${sid}`] = kd;
    }
    const siparis = manuel ? null : (dataCache.siparisler || []).find(s => String(s.id) === sid);
    const kalemler = kapamaKalemlerGetir(sid, kd);
    const eksik = kapamaEksikAlanlar(kd, kalemler, sid);
    const m = kd.maliyet || {};
    const baslikEtik = manuel ? pdfEsc(kd.meta?.baslik || 'Manuel') : pdfEsc(siparis?.sno || '—');
    const firmaEtik = manuel ? pdfEsc(kd.meta?.firma || '—') : pdfEsc(siparis?.firma || '—');

    list.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px">
        ${planlamaAltSekmeHtml()}
        <div class="panel-box" style="padding:12px 16px">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                <div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;font-family:'DM Mono',monospace">${manuel ? 'Simülasyon' : 'Sipariş'}</div>
                <select class="pro-input" style="min-width:220px" onchange="kapamaSelectSiparis(this.value)">${secimOpts}</select>
                <span class="pill ${manuel ? 'pill-amber' : 'pill-cyan'}">${manuel ? '✨ Manuel' : baslikEtik}</span>
                <span class="pill pill-gray">${firmaEtik}</span>
                ${manuel ? '' : `<button type="button" class="btn-pro btn-ghost-pro" style="font-size:10px" onclick="kapamaSistemdenCekTikla()">↻ Sistemden çek</button>`}
                <button type="button" class="btn-pro btn-primary-pro" style="margin-left:auto;font-size:10px" onclick="kapamaKaydet()">💾 Kaydet</button>
                ${manuel ? `<button type="button" class="btn-pro btn-ghost-pro" style="font-size:10px;color:var(--rose-c)" onclick="if(confirm('Bu manuel simülasyon silinsin mi?')){kapamaManuelSil('${sid}');renderSiparisKapama();}">🗑 Sil</button>` : `<button type="button" class="btn-pro btn-ghost-pro" style="font-size:10px" onclick="setAppMode('KONFEKSIYON'); konfSelectSiparis('${sid}')">🧵 Konfeksiyon</button>`}
            </div>
            <div id="kapama-kumas-ozet-wrap" style="display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;font-size:10px;color:var(--text3);font-family:'DM Mono',monospace"></div>
        </div>
        <div id="kapama-analiz-wrap">${kapamaAnalizHtml(kd, kalemler, eksik)}</div>
        ${manuel ? `<div class="panel-box" style="padding:14px 16px">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:10px;color:var(--text3)">✨ Manuel simülasyon bilgisi</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div><label class="pro-label">Ürün / set adı</label><input id="kap-manuel-baslik" class="pro-input" value="${pdfEsc(kd.meta?.baslik || '')}" oninput="kapamaCanliAnaliz()"></div>
                <div><label class="pro-label">Müşteri / firma</label><input id="kap-manuel-firma" class="pro-input" value="${pdfEsc(kd.meta?.firma || '')}" oninput="kapamaCanliAnaliz()"></div>
            </div>
        </div>` : ''}
        <div class="panel-box" style="padding:14px 16px">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);margin-bottom:10px">📋 Kapama bilgisi</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div><label class="pro-label">Kapama tarihi</label><input id="kap-meta-tarih" type="date" class="pro-input" value="${kd.meta?.tarih || new Date().toISOString().slice(0, 10)}" onchange="kapamaCanliAnaliz()"></div>
                <div><label class="pro-label">Not</label><input id="kap-meta-not" class="pro-input" value="${pdfEsc(kd.meta?.not || '')}" placeholder="Genel not" oninput="kapamaCanliAnaliz()"></div>
            </div>
        </div>
        ${kapamaKumasPanelHtml(kd, kalemler, manuel)}
        <div class="panel-box" style="padding:14px 16px">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap">
                <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text3)">✂️ Kesim · üretim · sevk ${manuel ? '(set parçaları)' : ''}</div>
                ${manuel ? `<button type="button" class="btn-pro btn-ghost-pro" style="font-size:10px" onclick="kapamaManuelMevcutKalemEkle('${sid}')">+ Parça ekle</button>` : ''}
            </div>
            ${manuel ? `<div style="font-size:10px;color:var(--text3);margin-bottom:8px">Her satır setin bir parçasıdır. <b>2./3. kalite</b> ve <b>artı</b> adetleri birim kesim mt ile çarpılarak kumaş tüketimi hesaplanır.</div>` : ''}
            ${kapamaKalemTabloHtml(kalemler, kd, manuel)}
        </div>
        <div id="kapama-kalem-kumas-wrap">${kapamaKalemKumasOzetHtml(kd, kalemler)}</div>
        ${kapamaAksesuarPanelHtml(kd)}
        <div class="panel-box" style="padding:14px 16px">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:10px;color:var(--text3)">💰 Maliyetler (₺) ${manuel ? '<span style="font-weight:400;color:var(--text3)">— isteğe bağlı</span>' : ''}</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px">
                <div><label class="pro-label">Kumaş</label><input id="kap-mal-kumas" type="number" step="0.01" class="pro-input" value="${m.kumas_tl ?? ''}" oninput="kapamaCanliAnaliz()"></div>
                <div><label class="pro-label">Konfeksiyon</label><input id="kap-mal-konf" type="number" step="0.01" class="pro-input" value="${m.konfeksiyon_tl ?? ''}" oninput="kapamaCanliAnaliz()"></div>
                <div><label class="pro-label" title="Aksesuar tablosu toplamına ek">Aksesuar (ek / düzeltme)</label><input id="kap-mal-aks" type="number" step="0.01" class="pro-input" value="${m.aksesuar_tl ?? ''}" oninput="kapamaCanliAnaliz()"></div>
                <div><label class="pro-label">Diğer</label><input id="kap-mal-diger" type="number" step="0.01" class="pro-input" value="${m.diger_tl ?? ''}" oninput="kapamaCanliAnaliz()"></div>
                <div><label class="pro-label">Satış geliri (toplam)</label><input id="kap-mal-satis" type="number" step="0.01" class="pro-input" value="${m.satis_tl ?? ''}" oninput="kapamaCanliAnaliz()"></div>
            </div>
            <div style="font-size:9px;color:var(--text3);margin-top:8px">Aksesuar faturaları yukarıdaki tablodan otomatik toplanır; “Aksesuar (ek)” alanı ek masraf içindir.</div>
        </div>
    </div>`;
    setTimeout(() => kapamaCanliAnaliz(), 0);
}

const IPLIK_DENYE_NM_SABIT = 1.693;

function iplikParseNmNumara(raw) {
    const info = iplikNmKatliParse(raw);
    return info.nm;
}

/** Katlı iplik: 40/2 → 20 Nm (≈20/1), 30/3 → 10 Nm (≈10/1) */
function iplikNmKatliParse(raw) {
    const ham = String(raw ?? '').trim();
    const s = ham.replace(',', '.');
    if (!s) return { ham, nm: 0, katli: false, pay: 0, payda: 1, esdeger: '' };
    const frac = s.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
    if (frac) {
        const pay = parseFloat(frac[1]), payda = parseFloat(frac[2]);
        const nm = payda > 0 ? pay / payda : pay;
        const katli = payda > 1 && nm > 0;
        const esdeger = katli
            ? `≈ ${nm.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}/1`
            : '';
        return { ham, nm: nm > 0 ? nm : 0, katli, pay, payda, esdeger };
    }
    const n = parseFloat(s);
    const nm = Number.isFinite(n) && n > 0 ? n : 0;
    return { ham, nm, katli: false, pay: nm, payda: 1, esdeger: '' };
}

function iplikDenyeToNm(denye) {
    const d = typeof denye === 'number' ? denye : parseFloat(String(denye ?? '').replace(',', '.'));
    if (!Number.isFinite(d) || d <= 0) return 0;
    return (9000 / d) / IPLIK_DENYE_NM_SABIT;
}

/** Tüm hesaplarda kullanılacak Nm karşılığı — NM doğrudan, Denye dönüştürülür */
function iplikNmIslemDeger(tip, numaraRaw) {
    const t = String(tip || 'NM').toUpperCase();
    if (t === 'DENYE') return iplikDenyeToNm(iplikParseNmNumara(numaraRaw));
    return iplikParseNmNumara(numaraRaw);
}

function iplikHesapFmt(n, d = 2) {
    return Number.isFinite(n) && n > 0
        ? n.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d })
        : '—';
}

function iplikNmKatliHtml(raw, nm) {
    const info = iplikNmKatliParse(raw);
    const n = nm > 0 ? nm : info.nm;
    if (!(n > 0)) return '<span style="color:var(--text3)">—</span>';
    if (info.katli && info.esdeger) {
        return `${iplikHesapFmt(n, 2)} <span style="font-size:9px;color:var(--text3)">(${info.esdeger})</span>`;
    }
    return iplikHesapFmt(n, 2);
}

function iplikHesapDonusumGuncelle() {
    const nmRaw = document.getElementById('ih-nm-numara')?.value;
    const denRaw = document.getElementById('ih-den-numara')?.value;
    const nmDeger = iplikNmIslemDeger('NM', nmRaw);
    const denDeger = iplikNmIslemDeger('DENYE', denRaw);
    const denIn = parseFloat(String(denRaw ?? '').replace(',', '.')) || 0;
    const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    const nmInfo = iplikNmKatliParse(nmRaw);
    set('ih-nm-sonuc', nmDeger > 0
        ? `<b style="color:var(--emerald-c)">${iplikHesapFmt(nmDeger, 2)}</b> Nm${nmInfo.esdeger ? ` <span style="font-size:9px;color:var(--text3)">(${nmInfo.esdeger})</span>` : ''}`
        : '<span style="color:var(--text3)">—</span>');
    set('ih-den-sonuc', denDeger > 0
        ? `<b style="color:var(--cyan-c)">${iplikHesapFmt(denDeger, 2)}</b> Nm`
        : '<span style="color:var(--text3)">—</span>');
    set('ih-den-detay', denIn > 0 && denDeger > 0
        ? `Denye→Nm: (9000/${iplikHesapFmt(denIn, 0)})/${IPLIK_DENYE_NM_SABIT}`
        : '');
}

let ihDonusumAcik = false;

function ihDonusumToggle() {
    ihDonusumAcik = !ihDonusumAcik;
    const pan = document.getElementById('ih-donusum-panel');
    const btn = document.getElementById('ih-donusum-toggle');
    if (pan) pan.style.display = ihDonusumAcik ? 'block' : 'none';
    if (btn) {
        btn.style.borderColor = ihDonusumAcik ? 'rgba(34,211,238,0.45)' : '';
        btn.style.color = ihDonusumAcik ? 'var(--cyan-c)' : '';
    }
    if (ihDonusumAcik) iplikHesapDonusumGuncelle();
}

const IPLIK_HESAP_LS = 'erp_iplik_hesap_v3';
const IPLIK_FORMUL_SABIT = 60;
const IPLIK_TARAK_MT_BOLEN = 100;

function iplikCmToMt(cm) {
    const n = typeof cm === 'number' ? cm : parseFloat(String(cm ?? '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n / 100 : 0;
}

/** g / birim = (Atkı × 60 / Nm) × (Tarak eni m / 100) — eni cm girilir, hesapta m */
function iplikAtkiGramBirim(atkiSayisi, iplikNoNm, tarakEniCm) {
    if (!(atkiSayisi > 0) || !(iplikNoNm > 0) || !(tarakEniCm > 0)) return 0;
    const tarakEniMt = iplikCmToMt(tarakEniCm);
    return ((atkiSayisi * IPLIK_FORMUL_SABIT) / iplikNoNm) * (tarakEniMt / IPLIK_TARAK_MT_BOLEN);
}

const IPLIK_COZGU_BOLEN = 100;

function iplikParseTarakNo(raw) {
    const s = String(raw ?? '').trim().replace(',', '.');
    if (!s) return 0;
    const mul = s.match(/^(\d+(?:\.\d+)?)\s*[\*xX×]\s*(\d+(?:\.\d+)?)$/);
    if (mul) return parseFloat(mul[1]) * parseFloat(mul[2]);
    return parseFloat(s) || 0;
}

/** Tarak no: 12*4 → 1 cm'de 48 iplik; çözgü tel = tarak eni × tarak no */
function iplikCozguTelOzetMetni(tarakEniCm, tarakNoRaw, telSayisi) {
    const eni = typeof tarakEniCm === 'number' ? tarakEniCm : parseFloat(String(tarakEniCm ?? '').replace(',', '.')) || 0;
    const ham = String(tarakNoRaw ?? '').trim();
    const telPerCm = iplikParseTarakNo(tarakNoRaw);
    const tel = Math.round(telSayisi || 0);
    if (!(eni > 0) || !(telPerCm > 0) || !(tel > 0)) return '';
    const eniFmt = iplikHesapFmt(eni, 0);
    const telFmt = tel.toLocaleString('tr-TR');
    const noGoster = ham || String(telPerCm);
    if (/[\*xX×]/.test(ham)) {
        return `1 cm'de <b>${noGoster} = ${telPerCm}</b> iplik · çözgü tel = ${eniFmt} × ${noGoster} = <b>${telFmt}</b>`;
    }
    return `1 cm'de <b>${telPerCm}</b> iplik · çözgü tel = ${eniFmt} × ${telPerCm} = <b>${telFmt}</b>`;
}

function iplikCozguTelSayisi(tarakEniCm, tarakNoRaw) {
    const eni = typeof tarakEniCm === 'number' ? tarakEniCm : parseFloat(String(tarakEniCm ?? '').replace(',', '.')) || 0;
    const tarakNo = iplikParseTarakNo(tarakNoRaw);
    if (!(eni > 0) || !(tarakNo > 0)) return 0;
    return eni * tarakNo;
}

/** g / 1 adet = çözgü tel × (60 / Nm) × ürün boyu m / 100 — atkı ile aynı 60 sabiti, boy cm→m */
function iplikCozguGramBirim(telSayisi, iplikNoNm, boyCm) {
    if (!(telSayisi > 0) || !(iplikNoNm > 0) || !(boyCm > 0)) return 0;
    const boyMt = iplikCmToMt(boyCm);
    return telSayisi * (IPLIK_FORMUL_SABIT / iplikNoNm) * boyMt / IPLIK_COZGU_BOLEN;
}

function ihUrunOzet() {
    const v = (id) => parseFloat(String(document.getElementById(id)?.value || '').replace(',', '.')) || 0;
    const birimTip = String(document.getElementById('ih-birim-tip')?.value || 'ADET').toUpperCase();
    const girisMiktar = Math.max(0, v('ih-miktar'));
    const boyCm = Math.max(0, v('ih-boy'));
    const tarakEni = Math.max(0, v('ih-tarak-eni'));
    const tarakNoRaw = String(document.getElementById('ih-tarak-no')?.value || '').trim();
    const tarakNo = iplikParseTarakNo(tarakNoRaw);
    const telSayisi = iplikCozguTelSayisi(tarakEni, tarakNoRaw);
    const adet = birimTip === 'MT' && boyCm > 0 ? girisMiktar / (boyCm / 100) : girisMiktar;
    const kumasMt = boyCm > 0 ? adet * (boyCm / 100) : 0;
    const uretimCarpan = birimTip === 'MT' ? girisMiktar : adet;
    return { birimTip, girisMiktar, boyCm, tarakEni, tarakNo, tarakNoRaw, telSayisi, adet, kumasMt, uretimCarpan };
}

function ihAtkiBirimCtx() {
    const birimTip = String(document.getElementById('ih-birim-tip')?.value || 'ADET').toUpperCase();
    const boyCm = parseFloat(String(document.getElementById('ih-boy')?.value || '').replace(',', '.')) || 0;
    const boyM = boyCm > 0 ? boyCm / 100 : 0;
    const boyMetin = boyM > 0 ? boyM.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) : '—';
    if (birimTip === 'MT') {
        return {
            birimTip,
            miktarEtiket: 'Metre',
            atkiSatirBaslik: 'Atkı / 1 mt',
            atkiGirisAciklama: 'Atkı = <b>1 metre</b> kumaş için o ipliğin toplam atkısı',
            gramBirimBaslik: 'g / 1 mt',
            atkiPlaceholder: '1 mt atkı',
        };
    }
    return {
        birimTip,
        miktarEtiket: 'Adet',
        atkiSatirBaslik: 'Atkı / 1 adet',
        atkiGirisAciklama: `Atkı = <b>1 adet</b> ürün (${boyMetin} m boy) için o ipliğin toplam atkısı`,
        gramBirimBaslik: 'g / 1 adet',
        atkiPlaceholder: '1 adet atkı',
    };
}

function ihAtkiUiGuncelle() {
    const ctx = ihAtkiBirimCtx();
    const setHtml = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    const setText = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
    setHtml('ih-atki-giris-aciklama', `${ctx.atkiGirisAciklama}`);
    setText('ih-miktar-etiket', ctx.miktarEtiket);
    setText('ih-atki-grid-atki-baslik', ctx.atkiSatirBaslik);
    document.querySelectorAll('#ih-atki-list [data-ih="atki"]').forEach(el => { el.placeholder = ctx.atkiPlaceholder; });
}

function ihIplikAnahtar(tip, numaraRaw, etiket) {
    const renk = String(etiket ?? '').trim().toLocaleUpperCase('tr-TR') || '—';
    return `${String(tip || 'NM').toUpperCase()}|${String(numaraRaw || '').trim().toLocaleUpperCase('tr-TR')}|${renk}`;
}

function ihAtkiHesapla() {
    const v = (id) => parseFloat(String(document.getElementById(id)?.value || '').replace(',', '.')) || 0;
    const ctx = ihAtkiBirimCtx();
    const oz = ihUrunOzet();
    const tarakEni = Math.max(0, v('ih-tarak-eni'));
    const firePct = Math.max(0, v('ih-fire-atki') || v('ih-fire'));
    const fireCarpan = 1 + firePct / 100;
    const rows = ihCollectAtkiRows().filter(r => r.nm > 0 && r.atki_sayisi > 0);
    let toplamKg = 0, toplamGram = 0;
    const detay = rows.map(r => {
        const gramBirim = iplikAtkiGramBirim(r.atki_sayisi, r.nm, tarakEni);
        const gramToplam = gramBirim * oz.uretimCarpan * fireCarpan;
        const kgToplam = gramToplam / 1000;
        toplamGram += gramToplam;
        toplamKg += kgToplam;
        return { ...r, gramBirim, gramToplam, kgToplam, kaynak: 'atkı' };
    });
    const out = document.getElementById('ih-atki-sonuc');
    const miktarMetin = oz.birimTip === 'MT'
        ? `${iplikHesapFmt(oz.girisMiktar, 0)} mt`
        : `${iplikHesapFmt(oz.adet, 0)} adet`;
    if (out) {
        const tr = detay.map(r => `<tr>
          <td style="padding:3px 4px;border:1px solid var(--border)">${pdfEsc(r.etiket || '—')}</td>
          <td style="padding:3px 4px;border:1px solid var(--border);font-family:'DM Mono',monospace;font-size:9px">${r.tip === 'DENYE' ? `D ${pdfEsc(r.numaraRaw)}` : pdfEsc(r.numaraRaw || '—')}</td>
          <td style="padding:3px 4px;border:1px solid var(--border);text-align:right">${iplikHesapFmt(r.gramBirim, 1)}</td>
          <td style="padding:3px 4px;border:1px solid var(--border);text-align:right;font-weight:700;color:var(--cyan-c)">${iplikHesapFmt(r.kgToplam, 3)}</td>
        </tr>`).join('');
        out.innerHTML = detay.length ? `
          <div style="font-size:8px;color:var(--text3);margin-bottom:4px;font-family:'DM Mono',monospace">fire %${iplikHesapFmt(firePct, 1)} · ${miktarMetin}</div>
          <div style="font-size:15px;font-weight:800;color:var(--cyan-c);margin-bottom:4px">${iplikHesapFmt(toplamKg, 3)} kg</div>
          <table style="width:100%;border-collapse:collapse;font-size:9px">
            <thead><tr style="background:var(--surface2)">
              <th style="padding:3px 4px;border:1px solid var(--border);text-align:left">Renk</th>
              <th style="padding:3px 4px;border:1px solid var(--border);text-align:left">İplik</th>
              <th style="padding:3px 4px;border:1px solid var(--border);text-align:right">${ctx.gramBirimBaslik.replace('g / ', 'g/')}</th>
              <th style="padding:3px 4px;border:1px solid var(--border);text-align:right">Kg</th>
            </tr></thead>
            <tbody>${tr}</tbody>
          </table>` : '<div style="font-size:9px;color:var(--text3)">Atkı satırı ekleyin.</div>';
    }
    const ozEl = document.getElementById('ih-urun-ozet');
    if (ozEl) {
        const parcalar = [];
        if (oz.birimTip === 'MT' && oz.boyCm > 0) parcalar.push(`${iplikHesapFmt(oz.girisMiktar, 0)} mt → ${iplikHesapFmt(oz.adet, 0)} adet`);
        else parcalar.push(`${iplikHesapFmt(oz.adet, 0)} adet`);
        if (oz.kumasMt > 0) parcalar.push(`${iplikHesapFmt(oz.kumasMt, 0)} m`);
        if (oz.telSayisi > 0) {
            const tn = oz.tarakNoRaw || String(oz.tarakNo);
            parcalar.push(`çzg ${iplikHesapFmt(oz.tarakEni, 0)}×${tn}=${Math.round(oz.telSayisi).toLocaleString('tr-TR')}`);
        }
        ozEl.textContent = parcalar.join(' · ');
    }
    ihAtkiUiGuncelle();
    return { detay, toplamKg, toplamGram, miktarMetin };
}

function ihCozguHesapla() {
    const v = (id) => parseFloat(String(document.getElementById(id)?.value || '').replace(',', '.')) || 0;
    const oz = ihUrunOzet();
    const firePct = Math.max(0, v('ih-fire-cozgu') || v('ih-fire'));
    const fireCarpan = 1 + firePct / 100;
    const tip = String(document.getElementById('ih-cozgu-tip')?.value || 'NM').toUpperCase();
    const numaraRaw = String(document.getElementById('ih-cozgu-numara')?.value || '').trim();
    const etiket = String(document.getElementById('ih-cozgu-etiket')?.value || '').trim();
    const nm = iplikNmIslemDeger(tip, numaraRaw);
    const gramBirim = iplikCozguGramBirim(oz.telSayisi, nm, oz.boyCm);
    const gramToplam = gramBirim * oz.adet * fireCarpan;
    const kgToplam = gramToplam / 1000;
    const out = document.getElementById('ih-cozgu-sonuc');
    const telEl = document.getElementById('ih-cozgu-tel-ozet');
    if (telEl) {
        const ozet = iplikCozguTelOzetMetni(oz.tarakEni, oz.tarakNoRaw, oz.telSayisi);
        telEl.innerHTML = ozet || '<span style="color:var(--text3)">Tarak eni + no (12*4)</span>';
    }
    const nmOniz = document.getElementById('ih-cozgu-nm-onizleme');
    if (nmOniz) {
        const nmInfo = iplikNmKatliParse(numaraRaw);
        nmOniz.innerHTML = numaraRaw && nm > 0
            ? `Nm <b>${iplikHesapFmt(nm, 2)}</b>${nmInfo.esdeger ? ` <span style="color:var(--text3)">${nmInfo.esdeger}</span>` : ''}`
            : '';
    }
    const miktarMetin = `${iplikHesapFmt(oz.adet, 0)} adet`;
    const hesapVar = oz.telSayisi > 0 && nm > 0 && oz.boyCm > 0 && numaraRaw;
    const detay = hesapVar ? [{
        etiket, tip, numaraRaw, nm, gramBirim, gramToplam, kgToplam, kaynak: 'çözgü',
    }] : [];
    if (out) {
        out.innerHTML = hesapVar ? `
          <div style="font-size:8px;color:var(--text3);margin-bottom:4px;font-family:'DM Mono',monospace">fire %${iplikHesapFmt(firePct, 1)} · ${miktarMetin}</div>
          <div style="font-size:15px;font-weight:800;color:var(--violet-c);margin-bottom:4px">${iplikHesapFmt(kgToplam, 3)} kg</div>
          <table style="width:100%;border-collapse:collapse;font-size:9px">
            <thead><tr style="background:var(--surface2)">
              <th style="padding:3px 4px;border:1px solid var(--border);text-align:left">Renk</th>
              <th style="padding:3px 4px;border:1px solid var(--border);text-align:left">İplik</th>
              <th style="padding:3px 4px;border:1px solid var(--border);text-align:right">g/adet</th>
              <th style="padding:3px 4px;border:1px solid var(--border);text-align:right">Kg</th>
            </tr></thead>
            <tbody><tr>
              <td style="padding:3px 4px;border:1px solid var(--border)">${pdfEsc(etiket || '—')}</td>
              <td style="padding:3px 4px;border:1px solid var(--border);font-family:'DM Mono',monospace">${tip === 'DENYE' ? `D ${pdfEsc(numaraRaw)}` : pdfEsc(numaraRaw)}</td>
              <td style="padding:3px 4px;border:1px solid var(--border);text-align:right">${iplikHesapFmt(gramBirim, 1)}</td>
              <td style="padding:3px 4px;border:1px solid var(--border);text-align:right;font-weight:700;color:var(--violet-c)">${iplikHesapFmt(kgToplam, 3)}</td>
            </tr></tbody>
          </table>` : '<div style="font-size:9px;color:var(--text3)">Çözgü verisi girin.</div>';
    }
    return { detay, toplamKg: hesapVar ? kgToplam : 0, toplamGram: hesapVar ? gramToplam : 0, miktarMetin };
}

function ihToplamIplikRender(atkiRes, cozguRes) {
    const out = document.getElementById('ih-iplik-toplam');
    if (!out) return;
    const groups = new Map();
    const ekle = (r) => {
        if (!(r.kgToplam > 0) || !r.numaraRaw) return;
        const etiket = String(r.etiket ?? '').trim();
        const key = ihIplikAnahtar(r.tip, r.numaraRaw, etiket);
        const g = groups.get(key) || {
            tip: r.tip, numaraRaw: r.numaraRaw, etiket, nm: r.nm,
            kg: 0, gram: 0, atkiKg: 0, cozguKg: 0, kaynaklar: [],
        };
        g.kg += r.kgToplam;
        g.gram += r.gramToplam;
        if (r.kaynak === 'çözgü') g.cozguKg += r.kgToplam;
        else g.atkiKg += r.kgToplam;
        if (!g.kaynaklar.includes(r.kaynak)) g.kaynaklar.push(r.kaynak);
        groups.set(key, g);
    };
    (atkiRes?.detay || []).forEach(ekle);
    (cozguRes?.detay || []).forEach(ekle);
    const liste = Array.from(groups.values()).sort((a, b) => b.kg - a.kg);
    let genelKg = 0, genelGram = 0;
    liste.forEach(g => { genelKg += g.kg; genelGram += g.gram; });
    const tr = liste.map(g => {
        const kaynakTxt = [
            g.atkiKg > 0 ? `atkı ${iplikHesapFmt(g.atkiKg, 3)}` : '',
            g.cozguKg > 0 ? `çzg ${iplikHesapFmt(g.cozguKg, 3)}` : '',
        ].filter(Boolean).join(' + ');
        return `<tr>
          <td style="padding:3px 5px;border:1px solid var(--border)">${pdfEsc(g.etiket || '—')}</td>
          <td style="padding:3px 5px;border:1px solid var(--border);font-family:'DM Mono',monospace">${g.tip === 'DENYE' ? `D ${pdfEsc(g.numaraRaw)}` : pdfEsc(g.numaraRaw)}</td>
          <td style="padding:3px 5px;border:1px solid var(--border);text-align:right">${iplikNmKatliHtml(g.numaraRaw, g.nm)}</td>
          <td style="padding:3px 5px;border:1px solid var(--border);text-align:right;font-size:8px;color:var(--text3)">${kaynakTxt}</td>
          <td style="padding:3px 5px;border:1px solid var(--border);text-align:right;font-weight:700;color:var(--accent2)">${iplikHesapFmt(g.kg, 3)}</td>
        </tr>`;
    }).join('');
    out.innerHTML = liste.length ? `
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:6px;flex-wrap:wrap">
        <div style="font-size:10px;font-weight:800;color:var(--accent2)">İplik Toplamı (aynı iplik + renk birleşik)</div>
        <div style="font-size:14px;font-weight:800;color:var(--accent2)">${iplikHesapFmt(genelKg, 3)} kg <span style="font-size:9px;font-weight:400;color:var(--text3)">· ${iplikHesapFmt(genelGram, 0)} g</span></div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:9px">
        <thead><tr style="background:var(--surface2)">
          <th style="padding:3px 5px;border:1px solid var(--border);text-align:left">Renk</th>
          <th style="padding:3px 5px;border:1px solid var(--border);text-align:left">İplik no</th>
          <th style="padding:3px 5px;border:1px solid var(--border);text-align:right">Nm</th>
          <th style="padding:3px 5px;border:1px solid var(--border);text-align:right">Dağılım (kg)</th>
          <th style="padding:3px 5px;border:1px solid var(--border);text-align:right">Toplam kg</th>
        </tr></thead>
        <tbody>${tr}</tbody>
      </table>` : '<div style="font-size:9px;color:var(--text3)">Hesap için atkı veya çözgü verisi girin.</div>';
}

function ihIplikHesapla() {
    const atkiRes = ihAtkiHesapla();
    const cozguRes = ihCozguHesapla();
    ihToplamIplikRender(atkiRes, cozguRes);
}

function ihCollectAtkiRows() {
    const root = document.getElementById('ih-atki-list');
    if (!root) return [];
    return Array.from(root.querySelectorAll('.ih-atki-row')).map(row => {
        const tip = String(row.querySelector('[data-ih="tip"]')?.value || 'NM').toUpperCase();
        const numaraRaw = String(row.querySelector('[data-ih="numara"]')?.value || '').trim();
        const atki_sayisi = parseFloat(row.querySelector('[data-ih="atki"]')?.value || 0) || 0;
        const nm = iplikNmIslemDeger(tip, numaraRaw);
        return {
            etiket: String(row.querySelector('[data-ih="etiket"]')?.value || '').trim(),
            tip, numaraRaw, atki_sayisi, nm,
        };
    }).filter(r => r.numaraRaw || r.atki_sayisi > 0);
}

function ihAddAtkiRow(row = {}) {
    const root = document.getElementById('ih-atki-list');
    if (!root) return;
    const div = document.createElement('div');
    div.className = 'ih-atki-row';
    div.style.cssText = 'display:grid;grid-template-columns:minmax(48px,0.8fr) 44px minmax(52px,1fr) 52px 22px;gap:3px;align-items:center;margin-bottom:3px';
    div.innerHTML = `
      <input class="pro-input" data-ih="etiket" type="text" style="width:100%;box-sizing:border-box;font-size:9px;padding:3px 4px" value="${pdfEsc(row.etiket ?? '')}" placeholder="Renk">
      <select class="pro-input" data-ih="tip" style="width:100%;font-size:9px;padding:2px"><option value="NM" ${(row.tip||'NM')==='NM'?'selected':''}>Nm</option><option value="DENYE" ${row.tip==='DENYE'?'selected':''}>D</option></select>
      <input class="pro-input" data-ih="numara" type="text" style="width:100%;box-sizing:border-box;font-size:9px;padding:3px 4px" value="${pdfEsc(row.numara ?? '')}" placeholder="40/2" title="Katlı: 40/2≈20/1">
      <input class="pro-input" data-ih="atki" type="number" min="0" step="0.01" style="width:100%;box-sizing:border-box;font-size:9px;padding:3px 4px;text-align:right" value="${row.atki_sayisi ?? ''}" placeholder="atkı">
      <button type="button" style="height:22px;border:1px solid rgba(251,113,133,.35);border-radius:4px;background:rgba(251,113,133,.08);color:var(--rose-c);cursor:pointer;font-size:10px;padding:0" onclick="ihRemoveAtkiRow(this)">✕</button>`;
    root.appendChild(div);
    div.querySelectorAll('input,select').forEach(el => {
        el.addEventListener('input', () => { ihAtkiKaydet(); ihIplikHesapla(); });
        el.addEventListener('change', () => { ihAtkiKaydet(); ihIplikHesapla(); });
    });
    ihIplikHesapla();
}

function ihRemoveAtkiRow(btn) {
    btn?.closest?.('.ih-atki-row')?.remove();
    const root = document.getElementById('ih-atki-list');
    if (root && !root.querySelector('.ih-atki-row')) ihAddAtkiRow();
    ihAtkiKaydet();
    ihIplikHesapla();
}

function ihAtkiKaydet() {
    try {
        localStorage.setItem(IPLIK_HESAP_LS, JSON.stringify({
            birim_tip: document.getElementById('ih-birim-tip')?.value,
            miktar: document.getElementById('ih-miktar')?.value,
            boy: document.getElementById('ih-boy')?.value,
            tarak_eni: document.getElementById('ih-tarak-eni')?.value,
            tarak_no: document.getElementById('ih-tarak-no')?.value,
            fire_atki: document.getElementById('ih-fire-atki')?.value,
            fire_cozgu: document.getElementById('ih-fire-cozgu')?.value,
            cozgu: {
                etiket: document.getElementById('ih-cozgu-etiket')?.value,
                tip: document.getElementById('ih-cozgu-tip')?.value,
                numara: document.getElementById('ih-cozgu-numara')?.value,
            },
            atki: ihCollectAtkiRows().map(r => ({ etiket: r.etiket, tip: r.tip, numara: r.numaraRaw, atki_sayisi: r.atki_sayisi })),
        }));
    } catch (e) {}
}

function ihAtkiYukle() {
    try { return JSON.parse(localStorage.getItem(IPLIK_HESAP_LS) || 'null'); } catch (e) { return null; }
}

function renderIplikHesap(mountEl) {
    const list = mountEl || document.getElementById('main-list');
    if (!list) return;
    const s = ihAtkiYukle() || {};
    ihDonusumAcik = false;
    const fireAtki = s.fire_atki ?? s.fire ?? 5;
    const fireCozgu = s.fire_cozgu ?? s.fire ?? 5;
    list.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:6px">
      <div class="panel-box" style="padding:8px 10px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap">
          <div style="font-size:10px;font-weight:800;color:var(--accent2)">🧮 İplik İhtiyaç Hesabı</div>
          <button type="button" id="ih-donusum-toggle" class="btn-pro btn-ghost-pro" style="padding:2px 8px;font-size:9px" onclick="ihDonusumToggle()">↻ Dönüşüm</button>
        </div>
        <div id="ih-donusum-panel" style="display:none;margin-top:6px;padding:6px 8px;border-radius:6px;border:1px solid rgba(34,211,238,0.25);background:rgba(34,211,238,0.05);font-size:9px">
          <div style="display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center">
            <span style="color:var(--emerald-c);font-weight:700">Nm</span>
            <input id="ih-nm-numara" class="pro-input" type="text" placeholder="40/2" style="width:56px;padding:3px 5px;font-size:9px" oninput="iplikHesapDonusumGuncelle()">
            <span id="ih-nm-sonuc">—</span>
            <span style="color:var(--border)">|</span>
            <span style="color:var(--cyan-c);font-weight:700">Denye</span>
            <input id="ih-den-numara" class="pro-input" type="number" min="0" step="1" placeholder="600" style="width:52px;padding:3px 5px;font-size:9px" oninput="iplikHesapDonusumGuncelle()">
            <span id="ih-den-sonuc">—</span>
          </div>
          <div id="ih-den-detay" style="font-size:8px;color:var(--text3);margin-top:3px;font-family:'DM Mono',monospace"></div>
        </div>
      </div>
      <div class="panel-box" style="padding:8px 10px">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:5px 6px">
          <div><label class="pro-label" style="margin:0;font-size:8px">Birim</label>
            <select id="ih-birim-tip" class="pro-input" style="font-size:9px;padding:3px 4px" onchange="ihAtkiKaydet();ihIplikHesapla()">
              <option value="ADET" ${(s.birim_tip||'ADET')==='ADET'?'selected':''}>Adet</option>
              <option value="MT" ${s.birim_tip==='MT'?'selected':''}>Metre</option>
            </select></div>
          <div><label class="pro-label" style="margin:0;font-size:8px" id="ih-miktar-etiket">Adet</label>
            <input id="ih-miktar" class="pro-input" type="number" min="0" step="0.01" value="${s.miktar ?? 100}" style="font-size:9px;padding:3px 4px" oninput="ihAtkiKaydet();ihIplikHesapla()"></div>
          <div><label class="pro-label" style="margin:0;font-size:8px">Boy (cm)</label>
            <input id="ih-boy" class="pro-input" type="number" min="0" step="0.01" value="${s.boy ?? 230}" style="font-size:9px;padding:3px 4px" oninput="ihAtkiKaydet();ihIplikHesapla()"></div>
          <div><label class="pro-label" style="margin:0;font-size:8px">Tarak eni</label>
            <input id="ih-tarak-eni" class="pro-input" type="number" min="0" step="0.01" value="${s.tarak_eni ?? 240}" style="font-size:9px;padding:3px 4px" oninput="ihAtkiKaydet();ihIplikHesapla()"></div>
          <div><label class="pro-label" style="margin:0;font-size:8px" title="12*4=48 tel/cm">Tarak no</label>
            <input id="ih-tarak-no" class="pro-input" type="text" value="${pdfEsc(s.tarak_no ?? '12*4')}" placeholder="12*4" style="font-size:9px;padding:3px 4px" oninput="ihAtkiKaydet();ihIplikHesapla()"></div>
        </div>
        <div id="ih-urun-ozet" style="font-size:8px;color:var(--text3);margin-top:5px;font-family:'DM Mono',monospace"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:6px;align-items:start">
        <div class="panel-box" style="padding:8px 10px;border:1px dashed rgba(34,211,238,0.35);min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;margin-bottom:4px;flex-wrap:wrap">
            <div style="font-size:9px;font-weight:700;color:var(--cyan-c)">Atkı</div>
            <div style="display:flex;align-items:center;gap:4px">
              <label class="pro-label" style="margin:0;font-size:8px">Fire%</label>
              <input id="ih-fire-atki" class="pro-input" type="number" min="0" step="0.01" value="${fireAtki}" style="width:42px;font-size:9px;padding:2px 4px" oninput="ihAtkiKaydet();ihIplikHesapla()">
              <button type="button" class="btn-pro btn-ghost-pro" style="padding:2px 6px;font-size:8px" onclick="ihAddAtkiRow()">+</button>
            </div>
          </div>
          <div id="ih-atki-giris-aciklama" style="font-size:8px;color:var(--text3);margin-bottom:4px"></div>
          <div style="display:grid;grid-template-columns:minmax(48px,0.8fr) 44px minmax(52px,1fr) 52px 22px;gap:3px;font-size:8px;font-weight:700;color:var(--text3);margin-bottom:3px">
            <span>Renk</span><span>Tip</span><span>İplik</span><span id="ih-atki-grid-atki-baslik" style="text-align:right">Atkı</span><span></span>
          </div>
          <div id="ih-atki-list"></div>
          <div id="ih-atki-sonuc" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border)"></div>
        </div>
        <div class="panel-box" style="padding:8px 10px;border:1px dashed rgba(167,139,250,0.35);min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;margin-bottom:4px;flex-wrap:wrap">
            <div style="font-size:9px;font-weight:700;color:var(--violet-c)">Çözgü</div>
            <div style="display:flex;align-items:center;gap:4px">
              <label class="pro-label" style="margin:0;font-size:8px">Fire%</label>
              <input id="ih-fire-cozgu" class="pro-input" type="number" min="0" step="0.01" value="${fireCozgu}" style="width:42px;font-size:9px;padding:2px 4px" oninput="ihAtkiKaydet();ihIplikHesapla()">
            </div>
          </div>
          <div id="ih-cozgu-tel-ozet" style="font-size:8px;color:var(--text3);margin-bottom:4px;font-family:'DM Mono',monospace;line-height:1.35"></div>
          <div style="display:grid;grid-template-columns:1fr 40px 1fr;gap:4px">
            <div><label class="pro-label" style="margin:0;font-size:8px">Renk</label>
              <input id="ih-cozgu-etiket" class="pro-input" type="text" style="font-size:9px;padding:3px 4px" value="${pdfEsc(s.cozgu?.etiket ?? '')}" placeholder="Renk" oninput="ihAtkiKaydet();ihIplikHesapla()"></div>
            <div><label class="pro-label" style="margin:0;font-size:8px">Tip</label>
              <select id="ih-cozgu-tip" class="pro-input" style="font-size:9px;padding:2px" onchange="ihAtkiKaydet();ihIplikHesapla()">
                <option value="NM" ${(s.cozgu?.tip||'NM')==='NM'?'selected':''}>Nm</option>
                <option value="DENYE" ${s.cozgu?.tip==='DENYE'?'selected':''}>D</option>
              </select></div>
            <div><label class="pro-label" style="margin:0;font-size:8px">İplik no</label>
              <input id="ih-cozgu-numara" class="pro-input" type="text" style="font-size:9px;padding:3px 4px" value="${pdfEsc(s.cozgu?.numara ?? '40/1')}" placeholder="40/1" oninput="ihAtkiKaydet();ihIplikHesapla()"></div>
          </div>
          <div id="ih-cozgu-nm-onizleme" style="font-size:8px;color:var(--text3);margin-top:3px;font-family:'DM Mono',monospace"></div>
          <div id="ih-cozgu-sonuc" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border)"></div>
        </div>
      </div>
      <div id="ih-iplik-toplam" class="panel-box" style="padding:8px 10px;border:1px solid rgba(251,191,36,0.35)"></div>
    </div>`;
    const atki = (s.atki && s.atki.length) ? s.atki : [{ etiket: '', tip: 'NM', numara: '40', atki_sayisi: 36 }];
    atki.forEach(r => ihAddAtkiRow(r));
    ihIplikHesapla();
}

let _dtIhModalEsc = null;
function dtIplikHesapModalAc() {
    let overlay = document.getElementById('dt-ih-modal-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'dt-ih-modal-overlay';
        overlay.className = 'dt-ih-modal-overlay';
        overlay.addEventListener('click', (e) => { if (e.target === overlay) dtIplikHesapModalKapat(); });
        overlay.innerHTML = `<div class="dt-ih-modal" onclick="event.stopPropagation()">
            <div class="dt-ih-modal-head">
                <div>
                    <h3 class="dt-ih-modal-title">🧮 İplik İhtiyaç Hesabı</h3>
                    <p class="dt-ih-modal-sub">Hesap penceresini kapattığınızda Dokuma ekranında kaldığınız yerden devam edersiniz.</p>
                </div>
                <button type="button" class="dt-ih-modal-close" onclick="dtIplikHesapModalKapat()" aria-label="Kapat">✕</button>
            </div>
            <div id="dt-ih-modal-body" class="dt-ih-modal-body"></div>
        </div>`;
        document.body.appendChild(overlay);
    }
    const body = document.getElementById('dt-ih-modal-body');
    if (!body) return;
    overlay.classList.add('is-open');
    try { document.body.style.overflow = 'hidden'; } catch (e) {}
    renderIplikHesap(body);
    if (_dtIhModalEsc) document.removeEventListener('keydown', _dtIhModalEsc);
    _dtIhModalEsc = (e) => { if (e.key === 'Escape') dtIplikHesapModalKapat(); };
    document.addEventListener('keydown', _dtIhModalEsc);
}
function dtIplikHesapModalKapat() {
    try { ihAtkiKaydet(); } catch (e) {}
    const overlay = document.getElementById('dt-ih-modal-overlay');
    if (overlay) overlay.classList.remove('is-open');
    const body = document.getElementById('dt-ih-modal-body');
    if (body) body.innerHTML = '';
    try { document.body.style.overflow = ''; } catch (e) {}
    if (_dtIhModalEsc) {
        document.removeEventListener('keydown', _dtIhModalEsc);
        _dtIhModalEsc = null;
    }
}

// ════════════════════════════════════════════════════════
//  KONFEKSİYON ÜRETİM TAKİP MODÜLÜ
// ════════════════════════════════════════════════════════

/** Sipariş detay modalı — “durum inceleme” sekmesi açıkken periyodik yenileme */
/** Sipariş durum inceleme: fason takip paneli (varsayılan kapalı) */
/** Sipariş durum inceleme: operasyon günlüğü "daha fazla göster" açık mı (sipariş id) */
let _siparisDurumOpAcikId = null;
/* Sessiz (poll) yenilemede veri degismediyse DOM yeniden kurulmasin — ayni siparis icin son cizilen "stamp". */
let _siparisDurumLastStamp = '';
let _siparisDurumLastStampSiparisId = null;
/** Operasyon günlüğü "daha fazla göster" — hafif DOM toggle, ağı/yeniden çizimi
 * tetiklemez (fasonToggle ile aynı desen), bu yüzden kaydırma konumunu bozmaz. */
function siparisDurumOpGenisletToggle(siparisId) {
    const sid = String(siparisId || '');
    const fazlaAcikti = _siparisDurumOpAcikId === sid;
    _siparisDurumOpAcikId = fazlaAcikti ? null : sid;
    const fazla = document.getElementById('siparis-durum-op-fazla');
    const btn = document.getElementById('siparis-durum-op-buton');
    if (fazla) fazla.style.display = fazlaAcikti ? 'none' : '';
    if (btn) {
        const kalanSay = fazla ? fazla.querySelectorAll('tr').length : 0;
        btn.textContent = fazlaAcikti ? `+ ${kalanSay} kayıt daha göster ▼` : 'Daha az göster ▲';
    }
}

/** Siparis_akis kalem_ad: "ad (renk · ebat)" veya "ad - renk - ebat" gibi; sipariş kalemiyle gevşek eşleme. */
/**
 * KD_KONFEKSIYON bloğu + üretim tablolarındaki güncel adetler (yalnız GÖSTERİM).
 *
 * Kesim adetleri konf_kesim_yikama'da, kalite/yıkama/sevk adetleri KUMAS_GELIS
 * satırlarında toplanır. Bunlar KD_KONFEKSIYON'a yalnızca
 * konfPipelineSiparisDurumSenkron çalıştığında yazılır; senkron o sipariş için
 * henüz çalışmadıysa Konfeksiyon Panel'den girilen kesim ekranda hiç
 * görünmüyordu. 18.09.2026'da canlı veride ölçüldü: 40 kalemde 2.065 adet
 * kesim panelde vardı, ana programda görünmüyordu.
 *
 * Birleştirme Math.max ile yapılır — mevcut değeri asla düşürmez.
 * Kayıt yolları (konfKaydet, konfPipelineSiparisDurumSenkron) ham bloğu
 * sbKdGet ile ayrıca okur, bu fonksiyondan etkilenmez; çifte sayım riski yok.
 * ANA PROGRAMLA BİREBİR AYNI OLMAK ZORUNDA (src/stok/js/04-live-sync.js).
 */
// ════════════════════════════════════════════════════════
//  DOKUMA TAKİP MODÜLÜ
// ════════════════════════════════════════════════════════

let kapamaSiparisId = null;
/* dtDosyaAktif: ana programın çekirdeğinden gelir (assets/erp-core.js) */
// dtGetKd/dtSetKd — Supabase'e geçildi (sbKdGet/sbKdSet)
function dtHareketDetayFormat(detayRaw) {
    const txt = String(detayRaw || '').trim();
    if (!txt) return '';
    let parsed = null;
    try {
        parsed = JSON.parse(txt);
    } catch (e) {
        const m = txt.match(/(\{[\s\S]*\})/);
        if (m && m[1]) {
            try { parsed = JSON.parse(m[1]); } catch (e2) {}
        }
    }
    if (!parsed || typeof parsed !== 'object') return txt;
    const urunler = parsed?.urunler;
    if (!urunler || typeof urunler !== 'object') return txt;

    const urunIds = Object.keys(urunler).sort((a, b) => String(a).localeCompare(String(b), 'tr', { numeric: true, sensitivity: 'base' }));
    if (!urunIds.length) return txt;

    const satirlar = [];
    urunIds.forEach((uid) => {
        const u = urunler[uid] || {};
        const mt = parseFloat(u.toplam_metre || 0) || 0;
        const kg = parseFloat(u.toplam_kg || 0) || 0;
        const ad = parseInt(u.toplam_adet || 0, 10) || 0;
        satirlar.push(`Ürün #${uid}: Toplam ${mt.toLocaleString('tr-TR')} mt · ${kg.toLocaleString('tr-TR')} kg · ${ad} adet`);
        const girisler = Array.isArray(u.girisler) ? u.girisler : [];
        if (!girisler.length) {
            satirlar.push('  Giriş: yok');
            return;
        }
        girisler.forEach((g, idx) => {
            const gMt = parseFloat(g?.metre || 0) || 0;
            const gKg = parseFloat(g?.kg || 0) || 0;
            const gAd = parseInt(g?.adet || 0, 10) || 0;
            const gTarih = String(g?.tarih || '').trim() || '—';
            satirlar.push(`  Giriş ${idx + 1}: ${gMt.toLocaleString('tr-TR')} mt · ${gKg.toLocaleString('tr-TR')} kg · ${gAd} adet · ${gTarih}`);
        });
    });
    return satirlar.join('\n');
}

/** Dokuma üretim hattı — sıra: iplik hesap → levent hesap → tezgah → iplik sipariş → haşıl → bobin boya → büküm → üretim girişi */
const DT_KULVARLAR = [
    { id: 'IPLIK_HESAP', label: 'İplik Hesap', ikon: '🧮', renk: 'var(--violet-c)', siparisGerekli: true, kaldirilabilir: true },
    { id: 'LEVENT_HESAP', label: 'Levent Hesap', ikon: '📐', renk: 'var(--cyan-c)', siparisGerekli: true, kaldirilabilir: true },
    { id: 'TEZGAH_AYAR', label: 'Tezgah Ayarı', ikon: '🏭', renk: 'var(--text2)', siparisGerekli: true, kaldirilabilir: true },
    { id: 'IPLIK_SIPARIS', label: 'İplik Sipariş', ikon: '📋', renk: 'var(--accent2)', siparisGerekli: true, kaldirilabilir: true },
    { id: 'HASIL', label: 'Haşıl', ikon: '🧵', renk: 'var(--amber-c)', siparisGerekli: false, kaldirilabilir: true },
    { id: 'BOBIN_BOYA', label: 'Bobin Boya', ikon: '🎨', renk: 'var(--rose-c)', siparisGerekli: true, kaldirilabilir: true },
    { id: 'BUKUM', label: 'Büküm', ikon: '🔀', renk: 'var(--emerald-c)', siparisGerekli: true, kaldirilabilir: true },
    { id: 'URETIM_GIRIS', label: 'Üretim Girişi', ikon: '✓', renk: 'var(--cyan-c)', siparisGerekli: true, kaldirilabilir: false },
];
const DT_KULVAR_EKSTRA = [
    { id: 'YEDEK', label: 'Yedek Parça', ikon: '🔧', renk: 'var(--text2)', siparisGerekli: false, kaldirilabilir: true },
    { id: 'HAREKET', label: 'Hareket', ikon: '📜', renk: 'var(--text3)', siparisGerekli: false, kaldirilabilir: true },
];
let dtKulvarDuzenleAcik = false;
function dtAllKulvarlar() { return DT_KULVARLAR.concat(DT_KULVAR_EKSTRA); }
function dtKulvarGecerli(id) {
    return dtAllKulvarlar().some(k => k.id === id);
}
function dtGetSiparisOps(sid) {
    const data = dtLoadOpsData();
    const key = String(sid || '');
    const bag = (data.siparis_ops && data.siparis_ops[key]) ? data.siparis_ops[key] : {};
    const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
    return {
        iplik_siparis: obj(bag.iplik_siparis),
        atki_iplik: obj(bag.atki_iplik),
        iplik_hesap: obj(bag.iplik_hesap),
        levent_hesap: obj(bag.levent_hesap),
        tezgah_ayar: obj(bag.tezgah_ayar),
        bobin_boya: obj(bag.bobin_boya),
        bukum: obj(bag.bukum),
        gizli_kulvarlar: Array.isArray(bag.gizli_kulvarlar) ? bag.gizli_kulvarlar.slice() : []
    };
}
function dtSaveSiparisOps(sid, ops) {
    const data = dtLoadOpsData();
    if (!data.siparis_ops) data.siparis_ops = {};
    data.siparis_ops[String(sid)] = ops;
    dtSaveOpsData(data);
}
function dtVisibleKulvarlar(sid) {
    const gizli = new Set((sid ? dtGetSiparisOps(sid).gizli_kulvarlar : []) || []);
    return dtAllKulvarlar().filter(k => k.id === 'URETIM_GIRIS' || !gizli.has(k.id));
}
function dtToggleKulvarGizle(sid, kulvarId) {
    if (!sid || kulvarId === 'URETIM_GIRIS') return;
    const ops = dtGetSiparisOps(sid);
    const set = new Set(ops.gizli_kulvarlar || []);
    if (set.has(kulvarId)) set.delete(kulvarId); else set.add(kulvarId);
    ops.gizli_kulvarlar = [...set];
    dtSaveSiparisOps(sid, ops);
    const visible = dtVisibleKulvarlar(sid);
    if (!visible.some(k => k.id === dtDosyaAktif)) dtDosyaAktif = visible[0]?.id || 'URETIM_GIRIS';
    saveUiState({ dtDosyaAktif });
    renderDokumaTakip();
}
function dtKulvarDuzenleToggle() {
    dtKulvarDuzenleAcik = !dtKulvarDuzenleAcik;
    renderDokumaTakip();
}
function dtSiparisOpsFieldSet(sid, bagName, idx, field, value) {
    const ops = dtGetSiparisOps(sid);
    if (!ops[bagName]) ops[bagName] = {};
    if (idx != null && idx !== '') {
        const k = String(idx);
        if (!ops[bagName][k]) ops[bagName][k] = {};
        ops[bagName][k][field] = value;
    } else {
        ops[bagName][field] = value;
    }
    dtSaveSiparisOps(sid, ops);
    debounce('dt-kulvar-save', () => renderDokumaTakip(), 200);
}
function dtKalemKumasKart(kalem) {
    const kod = String(kalem?.kod || kalem?.desen_kodu || '').trim();
    if (!kod) return null;
    return (dataCache.kumas_kutuphanesi || []).find(x => String(x.desen_kodu || '').trim() === kod) || null;
}
function dtKalemAtkiSatirlari(kalem) {
    const kart = dtKalemKumasKart(kalem);
    const raw = String(kart?.atki_renkleri || '').trim();
    if (!raw) return [];
    return raw.split(' | ').map(parseAtkiRenkSatiri).filter(r => r.no || r.cins || r.renk);
}
function dtIplikSiparisFieldSet(sid, kalemIdx, field, value) {
    dtSiparisOpsFieldSet(sid, 'iplik_siparis', kalemIdx, field, value);
}
function dtAtkiIplikFieldSet(sid, kalemIdx, atkiIdx, field, value) {
    const ops = dtGetSiparisOps(sid);
    const k = String(kalemIdx);
    if (!ops.atki_iplik[k]) ops.atki_iplik[k] = {};
    if (!ops.atki_iplik[k][atkiIdx]) ops.atki_iplik[k][atkiIdx] = {};
    ops.atki_iplik[k][atkiIdx][field] = value;
    dtSaveSiparisOps(sid, ops);
    debounce('dt-kulvar-save', () => renderDokumaTakip(), 200);
}
function dtIplikHesapKalemVerisi(k, ki, ops) {
    const kart = dtKalemKumasKart(k);
    const ih = ops.iplik_hesap[String(ki)] || ops.iplik_hesap[ki] || {};
    const lv = ops.levent_hesap[String(ki)] || ops.levent_hesap[ki] || {};
    const cozguKg = dtParseKg(ih.cozgu_kg);
    const atkiKgToplam = dtParseKg(ih.atki_kg);
    const leventAdet = parseInt(lv.levent_adet, 10) || 0;
    const metreLevent = dtParseKg(lv.metre_levent);
    const cozguTel = String(lv.cozgu_tel || '').trim();
    const leventHesapKg = dtParseKg(lv.hesap_kg);
    const leventToplamKg = leventHesapKg > 0 ? leventHesapKg : cozguKg;
    const kgPerLevent = (leventAdet > 0 && leventToplamKg > 0) ? leventToplamKg / leventAdet : 0;
    const atkilar = dtKalemAtkiSatirlari(k).map((a, ai) => {
        const ak = (ops.atki_iplik[String(ki)] || ops.atki_iplik[ki] || {})[ai] || {};
        return {
            no: String(a.no || '').trim() || '—',
            cins: String(a.cins || '').trim() || '—',
            renk: String(a.renk || '').trim() || '—',
            sayi: String(a.sayi || '').trim() || '—',
            kg: dtParseKg(ak.ihtiyac_kg),
        };
    });
    const atkiSatirToplam = atkilar.reduce((s, a) => s + a.kg, 0);
    const atkiToplam = atkiSatirToplam > 0 ? atkiSatirToplam : atkiKgToplam;
    return {
        ki,
        ad: String(k.ad || k.kod || 'Ürün ' + (ki + 1)).trim(),
        kod: String(k.kod || k.desen_kodu || '').trim(),
        miktar: parseFloat(k.miktar) || 0,
        birim: String(k.birim || 'ad').trim(),
        tarak: String(kart?.tarak || kart?.tarak_no || '').trim(),
        cozgu: {
            no: String(kart?.cozgu_no || '').trim() || '—',
            cins: String(kart?.cozgu_cinsi || '').trim() || '—',
            kg: cozguKg,
            fire: ih.fire_cozgu,
        },
        levent: {
            adet: leventAdet,
            metre: metreLevent,
            tel: cozguTel || '—',
            toplamKg: leventToplamKg,
            kgPerLevent,
            not: String(lv.not || '').trim(),
        },
        atkilar,
        atkiToplam,
        genelToplam: cozguKg + atkiToplam,
    };
}
function renderDokumaIplikKalemRaporHtml(v) {
    const leventSatir = (() => {
        if (!v.levent.adet && !v.levent.toplamKg) {
            return `<tr><td colspan="5" style="padding:8px 10px;font-size:10px;color:var(--text3)">Levent hesabı girilmedi — Levent Hesap sekmesinden adet/kg ekleyin veya çözgü kg girin.</td></tr>`;
        }
        const detay = [
            v.levent.adet ? `${v.levent.adet} levent` : '',
            v.levent.metre > 0 ? `${dtFmtKg(v.levent.metre)} m/levent` : '',
            v.levent.tel !== '—' ? `${pdfEsc(v.levent.tel)} tel` : '',
            v.levent.kgPerLevent > 0 ? `${dtFmtKg(v.levent.kgPerLevent)} kg/levent` : '',
        ].filter(Boolean).join(' · ');
        return `<tr>
            <td style="padding:7px 10px"><span class="pill pill-violet" style="font-size:8px">Çözgü</span></td>
            <td style="padding:7px 10px;font-family:'DM Mono',monospace;font-size:10px">${pdfEsc(v.cozgu.no)}</td>
            <td style="padding:7px 10px;font-size:10px">${pdfEsc(v.cozgu.cins)}</td>
            <td style="padding:7px 10px;font-size:9px;color:var(--text2)">${pdfEsc(detay)}${v.levent.not ? `<div style="font-size:8px;color:var(--text3);margin-top:2px">${pdfEsc(v.levent.not)}</div>` : ''}</td>
            <td style="padding:7px 10px;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;text-align:right;color:var(--violet-c)">${dtFmtKg(v.levent.toplamKg)}</td>
        </tr>`;
    })();
    const atkiSatirlar = v.atkilar.length
        ? v.atkilar.map(a => `<tr>
            <td style="padding:7px 10px"><span class="pill pill-cyan" style="font-size:8px">Atkı</span></td>
            <td style="padding:7px 10px;font-family:'DM Mono',monospace;font-size:10px">${pdfEsc(a.no)}</td>
            <td style="padding:7px 10px;font-size:10px">${pdfEsc(a.cins)}</td>
            <td style="padding:7px 10px;font-size:10px">${pdfEsc(a.renk)} <span style="color:var(--text3);font-size:9px">(${pdfEsc(a.sayi)})</span></td>
            <td style="padding:7px 10px;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;text-align:right;color:var(--cyan-c)">${dtFmtKg(a.kg)}</td>
        </tr>`).join('')
        : `<tr><td colspan="5" style="padding:8px 10px;font-size:10px;color:var(--text3)">Atkı satırı yok veya kg girilmedi</td></tr>`;
    return `<div class="panel-box" style="padding:0;overflow:hidden;margin-bottom:10px;border:1px solid var(--border)" id="dt-ih-rapor-kalem-${v.ki}">
        <div style="padding:10px 14px;background:var(--surface2);border-bottom:1px solid var(--border);display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            <div style="font-size:11px;font-weight:700;color:var(--text)">${pdfEsc(v.ad)}</div>
            ${v.kod ? `<span class="pill pill-gray" style="font-size:8px;font-family:'DM Mono',monospace">${pdfEsc(v.kod)}</span>` : ''}
            <span style="font-size:9px;color:var(--text3);margin-left:auto;font-family:'DM Mono',monospace">Sipariş: ${v.miktar > 0 ? v.miktar.toLocaleString('tr-TR') + ' ' + pdfEsc(v.birim) : '—'}${v.tarak ? ' · Tarak ' + pdfEsc(v.tarak) : ''}</span>
        </div>
        <div style="padding:8px 14px;font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;font-family:'DM Mono',monospace">🎯 Levent — çözgü ipliği (Haşıl sevk)</div>
        <div style="overflow-x:auto;padding:0 8px 4px"><table class="dt-table"><thead><tr>
            <th>Tip</th><th>İplik No</th><th>Cins / Marka</th><th>Levent detay</th><th style="text-align:right">Kg</th>
        </tr></thead><tbody>${leventSatir}</tbody></table></div>
        <div style="padding:8px 14px 4px;font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;font-family:'DM Mono',monospace">🎨 Atkı iplikleri (Boyahane sevk)</div>
        <div style="overflow-x:auto;padding:0 8px 8px"><table class="dt-table"><thead><tr>
            <th>Tip</th><th>Atkı No</th><th>Cins</th><th>Renk</th><th style="text-align:right">Kg</th>
        </tr></thead><tbody>${atkiSatirlar}</tbody></table></div>
        <div style="padding:8px 14px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:12px;font-size:10px;background:rgba(109,113,255,0.04)">
            <span>Levent/çözgü: <b style="font-family:'DM Mono',monospace;color:var(--violet-c)">${dtFmtKg(v.levent.toplamKg || v.cozgu.kg)} kg</b></span>
            <span>Atkı: <b style="font-family:'DM Mono',monospace;color:var(--cyan-c)">${dtFmtKg(v.atkiToplam)} kg</b></span>
            <span style="margin-left:auto">Kalem toplam: <b style="font-family:'DM Mono',monospace;color:var(--accent2)">${dtFmtKg(v.genelToplam)} kg</b></span>
        </div>
    </div>`;
}
function renderDokumaIplikHesapRaporHtml(siparis, ops) {
    const kalemler = uaSiparisKalemleriGetir(siparis);
    const raporlar = kalemler.map((k, ki) => dtIplikHesapKalemVerisi(k, ki, ops));
    if (!raporlar.length) return '<div style="padding:16px;color:var(--text3)">Sipariş kalemi yok</div>';
    return `<div id="dt-ih-rapor-wrap" style="padding:12px 14px;border-bottom:1px solid var(--border);background:var(--surface)">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
            <div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;font-family:'DM Mono',monospace">📋 Kalem bazlı iplik ihtiyaç raporu</div>
            <button type="button" onclick="dtIplikHesapRaporYazdir()" class="btn-pro btn-ghost-pro" style="padding:4px 10px;font-size:9px;margin-left:auto">🖨 Yazdır</button>
        </div>
        <div style="font-size:10px;color:var(--text2);margin-bottom:12px;line-height:1.45">Her ürün kalemi için hangi iplikten ne kadar gerektiği ve levent başına çözgü dağılımı aşağıda özetlenir. Veri girişi bölümündeki kg alanları ve <b>Levent Hesap</b> sekmesi bu raporu besler.</div>
        ${raporlar.map(renderDokumaIplikKalemRaporHtml).join('')}
    </div>`;
}
function dtIplikHesapRaporYazdir() {
    const wrap = document.getElementById('dt-ih-rapor-wrap');
    if (!wrap) return;
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) { erpToast('Yazdırma penceresi açılamadı', 'warn'); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>İplik İhtiyaç Raporu</title>
        <style>body{font-family:system-ui,sans-serif;padding:20px;font-size:12px;color:#111}
        table{width:100%;border-collapse:collapse;margin:8px 0} th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
        th{background:#f3f4f6;font-size:10px} .hdr{font-size:14px;font-weight:700;margin-bottom:4px}
        .sub{font-size:10px;color:#666;margin-bottom:16px} .kalem{margin-bottom:20px;page-break-inside:avoid}
        .foot{font-size:10px;border-top:1px solid #ccc;padding-top:6px;margin-top:6px}</style></head><body>
        <div class="hdr">İplik İhtiyaç Raporu</div>
        <div class="sub">${pdfEsc((dataCache.siparisler||[]).find(s=>String(s.id)===String(dtSeciliSiparisId))?.sno||'')} — ${new Date().toLocaleString('tr-TR')}</div>
        ${wrap.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
}
function dtParseKg(v) {
    const n = parseFloat(String(v ?? '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 0;
}
function dtIplikNormKey() {
    return Array.from(arguments).map(x => String(x || '').trim().toLocaleUpperCase('tr-TR')).join('|');
}
function dtIplikHesapSiparisToplamlari(siparis, ops) {
    const kalemler = uaSiparisKalemleriGetir(siparis);
    const cozguMap = new Map();
    const atkiMap = new Map();
    kalemler.forEach((k, ki) => {
        const kart = dtKalemKumasKart(k);
        const kayit = ops.iplik_hesap[String(ki)] || ops.iplik_hesap[ki] || {};
        const cozguKg = dtParseKg(kayit.cozgu_kg);
        if (cozguKg > 0) {
            const no = String(kart?.cozgu_no || '').trim();
            const cins = String(kart?.cozgu_cinsi || '').trim();
            const key = dtIplikNormKey(no, cins);
            const g = cozguMap.get(key) || { no: no || '—', cins: cins || '—', kg: 0, kalem: 0 };
            g.kg += cozguKg;
            g.kalem += 1;
            cozguMap.set(key, g);
        }
        dtKalemAtkiSatirlari(k).forEach((a, ai) => {
            const ak = (ops.atki_iplik[String(ki)] || ops.atki_iplik[ki] || {})[ai] || {};
            const kg = dtParseKg(ak.ihtiyac_kg);
            if (kg > 0) {
                const key = dtIplikNormKey(a.no, a.cins, a.renk);
                const g = atkiMap.get(key) || {
                    no: String(a.no || '').trim() || '—',
                    cins: String(a.cins || '').trim() || '—',
                    renk: String(a.renk || '').trim() || '—',
                    kg: 0, kalem: 0,
                };
                g.kg += kg;
                g.kalem += 1;
                atkiMap.set(key, g);
            }
        });
    });
    const cozguListe = Array.from(cozguMap.values()).sort((a, b) => b.kg - a.kg);
    const atkiListe = Array.from(atkiMap.values()).sort((a, b) => b.kg - a.kg);
    const cozguToplam = cozguListe.reduce((s, x) => s + x.kg, 0);
    const atkiToplam = atkiListe.reduce((s, x) => s + x.kg, 0);
    return { cozguListe, atkiListe, cozguToplam, atkiToplam, genelToplam: cozguToplam + atkiToplam };
}
function dtFmtKg(n) {
    if (!(n > 0)) return '—';
    return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}
function renderDokumaIplikHesapToplamHtml(siparis, ops) {
    const t = dtIplikHesapSiparisToplamlari(siparis, ops);
    if (!t.cozguListe.length && !t.atkiListe.length) {
        return `<div style="padding:14px 16px;border-top:2px solid var(--border);background:rgba(109,113,255,0.04)">
            <div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;font-family:'DM Mono',monospace;margin-bottom:6px">Sipariş iplik toplamı</div>
            <div style="font-size:10px;color:var(--text3)">Kalem bazında çözgü / atkı kg girildiğinde aynı iplikler burada otomatik toplanır (Haşıl + Boyahane sevk).</div>
        </div>`;
    }
    const cozguRows = t.cozguListe.map(g => `<tr>
        <td style="padding:7px 10px;font-family:'DM Mono',monospace;font-size:10px">${pdfEsc(g.no)}</td>
        <td style="padding:7px 10px;font-size:10px">${pdfEsc(g.cins)}</td>
        <td style="padding:7px 10px;font-size:9px;color:var(--text3);text-align:center">${g.kalem}</td>
        <td style="padding:7px 10px;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;text-align:right;color:var(--violet-c)">${dtFmtKg(g.kg)}</td>
    </tr>`).join('');
    const atkiRows = t.atkiListe.map(g => `<tr>
        <td style="padding:7px 10px;font-family:'DM Mono',monospace;font-size:10px">${pdfEsc(g.no)}</td>
        <td style="padding:7px 10px;font-size:10px">${pdfEsc(g.cins)}</td>
        <td style="padding:7px 10px;font-size:10px">${pdfEsc(g.renk)}</td>
        <td style="padding:7px 10px;font-size:9px;color:var(--text3);text-align:center">${g.kalem}</td>
        <td style="padding:7px 10px;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;text-align:right;color:var(--cyan-c)">${dtFmtKg(g.kg)}</td>
    </tr>`).join('');
    return `<div style="border-top:2px solid var(--border);background:linear-gradient(180deg,rgba(109,113,255,0.06),rgba(109,113,255,0.02))">
        <div style="padding:12px 16px 8px">
            <div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;font-family:'DM Mono',monospace">Sipariş iplik toplamı — sevk özeti</div>
            <div style="font-size:10px;color:var(--text2);margin-top:4px;line-height:1.45">Aynı çözgü ve atkı iplikleri kalemler arasında birleştirildi. Ekstra toplama yapmadan Haşıl / Boyahane sevk miktarı olarak kullanın.</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;padding:0 16px 12px">
            <div class="panel-box" style="padding:0;overflow:hidden;border-color:rgba(167,139,250,0.35)">
                <div style="padding:8px 12px;font-size:10px;font-weight:700;color:var(--violet-c);border-bottom:1px solid var(--border);background:rgba(167,139,250,0.08)">🧵 Çözgü — Haşıl sevk ${t.cozguToplam > 0 ? `<span style="float:right;font-family:'DM Mono',monospace">${dtFmtKg(t.cozguToplam)} kg</span>` : ''}</div>
                <div style="overflow-x:auto">${t.cozguListe.length ? `<table class="dt-table"><thead><tr><th>Çözgü No</th><th>Cins</th><th style="text-align:center">Kalem</th><th style="text-align:right">Toplam kg</th></tr></thead><tbody>${cozguRows}</tbody></table>` : '<div style="padding:12px;font-size:10px;color:var(--text3)">Çözgü kg girilmedi</div>'}</div>
            </div>
            <div class="panel-box" style="padding:0;overflow:hidden;border-color:rgba(34,211,238,0.35)">
                <div style="padding:8px 12px;font-size:10px;font-weight:700;color:var(--cyan-c);border-bottom:1px solid var(--border);background:rgba(34,211,238,0.08)">🎨 Atkı — Boyahane sevk ${t.atkiToplam > 0 ? `<span style="float:right;font-family:'DM Mono',monospace">${dtFmtKg(t.atkiToplam)} kg</span>` : ''}</div>
                <div style="overflow-x:auto">${t.atkiListe.length ? `<table class="dt-table"><thead><tr><th>Atkı No</th><th>Cins</th><th>Renk</th><th style="text-align:center">Kalem</th><th style="text-align:right">Toplam kg</th></tr></thead><tbody>${atkiRows}</tbody></table>` : '<div style="padding:12px;font-size:10px;color:var(--text3)">Atkı kg girilmedi</div>'}</div>
            </div>
        </div>
        <div style="padding:10px 16px 14px;display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;border-top:1px solid var(--border)">
            <span style="font-size:10px;color:var(--text2)">Çözgü toplam: <b style="font-family:'DM Mono',monospace;color:var(--violet-c)">${dtFmtKg(t.cozguToplam)} kg</b></span>
            <span style="font-size:10px;color:var(--text2)">Atkı toplam: <b style="font-family:'DM Mono',monospace;color:var(--cyan-c)">${dtFmtKg(t.atkiToplam)} kg</b></span>
            <span style="font-size:10px;color:var(--text);margin-left:auto">Genel: <b style="font-family:'DM Mono',monospace;color:var(--accent2)">${dtFmtKg(t.genelToplam)} kg</b></span>
        </div>
    </div>`;
}
function renderDokumaIplikHesapPanel(siparis) {
    if (!siparis) return '';
    const sid = siparis.id;
    const kalemler = uaSiparisKalemleriGetir(siparis);
    const ops = dtGetSiparisOps(sid);
    const girisBloklar = kalemler.map((k, ki) => {
        const kart = dtKalemKumasKart(k);
        const kayit = ops.iplik_hesap[String(ki)] || {};
        const lv = ops.levent_hesap[String(ki)] || {};
        const atkilar = dtKalemAtkiSatirlari(k);
        const atkiSatir = atkilar.map((a, ai) => {
            const ak = (ops.atki_iplik[String(ki)] || {})[ai] || {};
            return `<tr>
                <td style="padding:5px 8px;font-family:'DM Mono',monospace;font-size:10px">${pdfEsc(a.no || '—')}</td>
                <td style="padding:5px 8px;font-size:10px">${pdfEsc(a.cins || '—')}</td>
                <td style="padding:5px 8px;font-size:10px">${pdfEsc(a.renk || '—')}</td>
                <td style="padding:5px 8px;font-family:'DM Mono',monospace;text-align:right">${pdfEsc(a.sayi || '—')}</td>
                <td style="padding:5px 6px"><input type="number" step="0.01" class="pro-input" style="width:80px;padding:3px 6px;font-size:10px" value="${ak.ihtiyac_kg ?? ''}" placeholder="kg" onchange="dtAtkiIplikFieldSet('${sid}',${ki},${ai},'ihtiyac_kg',this.value)"></td>
            </tr>`;
        }).join('');
        const v = dtIplikHesapKalemVerisi(k, ki, ops);
        return `<details class="panel-box" style="padding:0;margin-bottom:8px;overflow:hidden" ${ki === 0 ? 'open' : ''}>
            <summary style="padding:10px 14px;font-size:10px;font-weight:700;cursor:pointer;background:var(--surface2);list-style:none;display:flex;align-items:center;gap:8px">
                <span style="color:var(--text3)">▸</span> Veri girişi — ${pdfEsc(v.ad)}
                <span style="margin-left:auto;font-size:9px;font-weight:400;color:var(--text3);font-family:'DM Mono',monospace">Çzg ${dtFmtKg(v.cozgu.kg)} · Atkı ${dtFmtKg(v.atkiToplam)} kg</span>
            </summary>
            <div style="border-top:1px solid var(--border)">
                <div style="padding:8px 14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;font-size:10px">
                    <div><span style="color:var(--text3)">Çözgü</span><div class="mono" style="margin-top:2px">${pdfEsc(kart?.cozgu_no || '—')} · ${pdfEsc(kart?.cozgu_cinsi || '—')}</div></div>
                    <div><span style="color:var(--text3)">Tarak</span><div class="mono" style="margin-top:2px">${pdfEsc(kart?.tarak || '—')}</div></div>
                    <div><span style="color:var(--text3)">Sipariş</span><div class="mono" style="margin-top:2px">${(parseFloat(k.miktar) || 0).toLocaleString('tr-TR')}</div></div>
                </div>
                <div style="padding:4px 14px 8px;font-size:9px;font-weight:600;color:var(--cyan-c)">Levent (çözgü)</div>
                <div style="padding:0 14px 10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px">
                    <div><label class="pro-label" style="font-size:8px">Levent adet</label><input type="number" min="0" step="1" class="pro-input" style="width:100%;padding:4px 6px;font-size:10px" value="${lv.levent_adet ?? ''}" onchange="dtSiparisOpsFieldSet('${sid}','levent_hesap',${ki},'levent_adet',this.value)"></div>
                    <div><label class="pro-label" style="font-size:8px">m / levent</label><input type="number" step="0.01" class="pro-input" style="width:100%;padding:4px 6px;font-size:10px" value="${lv.metre_levent ?? ''}" onchange="dtSiparisOpsFieldSet('${sid}','levent_hesap',${ki},'metre_levent',this.value)"></div>
                    <div><label class="pro-label" style="font-size:8px">Çözgü tel</label><input class="pro-input" style="width:100%;padding:4px 6px;font-size:10px" value="${pdfEsc(lv.cozgu_tel || '')}" onchange="dtSiparisOpsFieldSet('${sid}','levent_hesap',${ki},'cozgu_tel',this.value)"></div>
                    <div><label class="pro-label" style="font-size:8px">Levent toplam kg</label><input type="number" step="0.01" class="pro-input" style="width:100%;padding:4px 6px;font-size:10px" value="${lv.hesap_kg ?? ''}" onchange="dtSiparisOpsFieldSet('${sid}','levent_hesap',${ki},'hesap_kg',this.value)"></div>
                </div>
                <div style="padding:4px 14px 8px;font-size:9px;font-weight:600;color:var(--violet-c)">İplik ihtiyaç (kg)</div>
                <div style="padding:0 14px 10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px">
                    <div><label class="pro-label" style="font-size:8px">Fire % çözgü</label><input type="number" step="0.01" class="pro-input" style="width:100%;padding:4px 6px;font-size:10px" value="${kayit.fire_cozgu ?? ''}" onchange="dtSiparisOpsFieldSet('${sid}','iplik_hesap',${ki},'fire_cozgu',this.value)"></div>
                    <div><label class="pro-label" style="font-size:8px">Fire % atkı</label><input type="number" step="0.01" class="pro-input" style="width:100%;padding:4px 6px;font-size:10px" value="${kayit.fire_atki ?? ''}" onchange="dtSiparisOpsFieldSet('${sid}','iplik_hesap',${ki},'fire_atki',this.value)"></div>
                    <div><label class="pro-label" style="font-size:8px">Çözgü kg</label><input type="number" step="0.01" class="pro-input" style="width:100%;padding:4px 6px;font-size:10px" value="${kayit.cozgu_kg ?? ''}" onchange="dtSiparisOpsFieldSet('${sid}','iplik_hesap',${ki},'cozgu_kg',this.value)"></div>
                    <div><label class="pro-label" style="font-size:8px">Atkı toplam kg</label><input type="number" step="0.01" class="pro-input" style="width:100%;padding:4px 6px;font-size:10px" value="${kayit.atki_kg ?? ''}" onchange="dtSiparisOpsFieldSet('${sid}','iplik_hesap',${ki},'atki_kg',this.value)"></div>
                </div>
                ${atkilar.length ? `<div style="padding:0 14px 12px;overflow-x:auto"><table class="dt-table"><thead><tr><th>Atkı No</th><th>Cins</th><th>Renk</th><th>Sayı</th><th>İhtiyaç kg</th></tr></thead><tbody>${atkiSatir}</tbody></table></div>` : ''}
            </div>
        </details>`;
    }).join('');
    return `<div class="panel-box" style="padding:0;overflow:hidden">
        <div class="panel-head"><span class="panel-head-title"><span class="panel-head-dot" style="background:var(--violet-c)"></span>İplik Hesap</span>
            <button type="button" onclick="dtIplikHesapModalAc()" class="btn-pro btn-ghost-pro" style="padding:4px 10px;font-size:9px">🧮 Detaylı hesap modülü</button></div>
        ${renderDokumaIplikHesapRaporHtml(siparis, ops)}
        <div style="padding:10px 14px 6px;font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;font-family:'DM Mono',monospace">Veri girişi (kalem bazlı)</div>
        <div style="padding:0 14px 12px">${girisBloklar || '<div style="padding:16px;color:var(--text3)">Sipariş kalemi yok</div>'}</div>
        ${renderDokumaIplikHesapToplamHtml(siparis, ops)}
    </div>`;
}
function renderDokumaLeventHesapPanel(siparis) {
    if (!siparis) return '';
    const sid = siparis.id;
    const kalemler = uaSiparisKalemleriGetir(siparis);
    const ops = dtGetSiparisOps(sid);
    const satirlar = kalemler.map((k, i) => {
        const kayit = ops.levent_hesap[String(i)] || {};
        return `<tr>
            <td style="padding:8px 10px;font-size:11px;font-weight:600">${pdfEsc(k.ad || k.kod || 'Ürün ' + (i + 1))}</td>
            <td style="padding:8px 6px"><input type="number" min="0" step="1" class="pro-input" style="width:70px;padding:4px 6px;font-size:10px" value="${kayit.levent_adet ?? ''}" placeholder="ad" onchange="dtSiparisOpsFieldSet('${sid}','levent_hesap',${i},'levent_adet',this.value)"></td>
            <td style="padding:8px 6px"><input type="number" step="0.01" class="pro-input" style="width:90px;padding:4px 6px;font-size:10px" value="${kayit.cozgu_tel ?? ''}" onchange="dtSiparisOpsFieldSet('${sid}','levent_hesap',${i},'cozgu_tel',this.value)"></td>
            <td style="padding:8px 6px"><input type="number" step="0.01" class="pro-input" style="width:90px;padding:4px 6px;font-size:10px" value="${kayit.metre_levent ?? ''}" onchange="dtSiparisOpsFieldSet('${sid}','levent_hesap',${i},'metre_levent',this.value)"></td>
            <td style="padding:8px 6px"><input type="number" step="0.01" class="pro-input" style="width:90px;padding:4px 6px;font-size:10px" value="${kayit.hesap_kg ?? ''}" onchange="dtSiparisOpsFieldSet('${sid}','levent_hesap',${i},'hesap_kg',this.value)"></td>
            <td style="padding:8px 6px"><input class="pro-input" style="min-width:120px;padding:4px 6px;font-size:10px" value="${pdfEsc(kayit.not || '')}" onchange="dtSiparisOpsFieldSet('${sid}','levent_hesap',${i},'not',this.value)"></td>
        </tr>`;
    }).join('');
    return `<div class="panel-box" style="padding:0;overflow:hidden">
        <div class="panel-head"><span class="panel-head-title"><span class="panel-head-dot" style="background:var(--cyan-c)"></span>Levent Hesap</span></div>
        <div style="overflow-x:auto"><table class="dt-table"><thead><tr>
            <th>Ürün</th><th>Levent adet</th><th>Çözgü tel</th><th>m/levent</th><th>Hesap kg</th><th>Not</th>
        </tr></thead><tbody>${satirlar || '<tr><td colspan="6" style="padding:14px;color:var(--text3)">Sipariş kalemi yok</td></tr>'}</tbody></table></div>
    </div>`;
}
function renderDokumaTezgahAyarPanel(siparis) {
    if (!siparis) return '';
    const sid = siparis.id;
    const kayit = dtGetSiparisOps(sid).tezgah_ayar || {};
    const fld = (label, field, type = 'text', ph = '') => `<div><label class="pro-label" style="font-size:8px">${label}</label>
        <input type="${type}" class="pro-input" style="width:100%;padding:5px 8px;font-size:10px" value="${pdfEsc(kayit[field] ?? '')}" placeholder="${ph}" onchange="dtSiparisOpsFieldSet('${sid}','tezgah_ayar',null,'${field}',this.value)"></div>`;
    return `<div class="panel-box" style="padding:14px 16px">
        <div class="panel-head" style="margin:-14px -16px 12px;padding:10px 16px"><span class="panel-head-title"><span class="panel-head-dot" style="background:var(--text2)"></span>Tezgah Ayarlanması</span>
            </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">
            ${fld('Tezgah No', 'tezgah_no', 'text', 'T-01')}
            ${fld('Ayar tarihi', 'ayar_tarih', 'date')}
            ${fld('Operatör', 'operator')}
            ${fld('Tarak / En', 'tarak_en')}
        </div>
        <div style="margin-top:10px"><label class="pro-label" style="font-size:8px">Not</label>
            <textarea class="pro-input" style="width:100%;min-height:60px;padding:6px 8px;font-size:10px" onchange="dtSiparisOpsFieldSet('${sid}','tezgah_ayar',null,'not',this.value)">${pdfEsc(kayit.not || '')}</textarea></div>
    </div>`;
}
function renderDokumaBobinBoyaPanel(siparis) {
    if (!siparis) return '';
    const sid = siparis.id;
    const kalemler = uaSiparisKalemleriGetir(siparis);
    const ops = dtGetSiparisOps(sid);
    const satirlar = kalemler.map((k, i) => {
        const kayit = ops.bobin_boya[String(i)] || {};
        return `<tr>
            <td style="padding:8px 10px;font-size:11px;font-weight:600">${pdfEsc(k.ad || k.kod || 'Ürün ' + (i + 1))}</td>
            <td style="padding:8px 6px"><input class="pro-input" style="width:100%;padding:4px 6px;font-size:10px" value="${pdfEsc(kayit.renk || '')}" onchange="dtSiparisOpsFieldSet('${sid}','bobin_boya',${i},'renk',this.value)"></td>
            <td style="padding:8px 6px"><input type="number" step="0.01" class="pro-input" style="width:90px;padding:4px 6px;font-size:10px" value="${kayit.miktar_kg ?? ''}" onchange="dtSiparisOpsFieldSet('${sid}','bobin_boya',${i},'miktar_kg',this.value)"></td>
            <td style="padding:8px 6px"><input class="pro-input" style="min-width:120px;padding:4px 6px;font-size:10px" value="${pdfEsc(kayit.not || '')}" onchange="dtSiparisOpsFieldSet('${sid}','bobin_boya',${i},'not',this.value)"></td>
        </tr>`;
    }).join('');
    return `<div class="panel-box" style="padding:0;overflow:hidden">
        <div class="panel-head"><span class="panel-head-title"><span class="panel-head-dot" style="background:var(--rose-c)"></span>Bobin Boya</span></div>
        <div style="overflow-x:auto"><table class="dt-table"><thead><tr><th>Ürün</th><th>Renk</th><th>Miktar kg</th><th>Not</th></tr></thead>
        <tbody>${satirlar || '<tr><td colspan="4" style="padding:14px;color:var(--text3)">Sipariş kalemi yok</td></tr>'}</tbody></table></div>
    </div>`;
}
function renderDokumaBukumPanel(siparis) {
    if (!siparis) return '';
    const sid = siparis.id;
    const kalemler = uaSiparisKalemleriGetir(siparis);
    const ops = dtGetSiparisOps(sid);
    const satirlar = kalemler.map((k, i) => {
        const kayit = ops.bukum[String(i)] || {};
        return `<tr>
            <td style="padding:8px 10px;font-size:11px;font-weight:600">${pdfEsc(k.ad || k.kod || 'Ürün ' + (i + 1))}</td>
            <td style="padding:8px 6px"><input class="pro-input" style="width:100%;padding:4px 6px;font-size:10px" value="${pdfEsc(kayit.iplik || '')}" onchange="dtSiparisOpsFieldSet('${sid}','bukum',${i},'iplik',this.value)"></td>
            <td style="padding:8px 6px"><input type="number" step="0.01" class="pro-input" style="width:90px;padding:4px 6px;font-size:10px" value="${kayit.miktar_kg ?? ''}" onchange="dtSiparisOpsFieldSet('${sid}','bukum',${i},'miktar_kg',this.value)"></td>
            <td style="padding:8px 6px"><input class="pro-input" style="min-width:120px;padding:4px 6px;font-size:10px" value="${pdfEsc(kayit.not || '')}" onchange="dtSiparisOpsFieldSet('${sid}','bukum',${i},'not',this.value)"></td>
        </tr>`;
    }).join('');
    return `<div class="panel-box" style="padding:0;overflow:hidden">
        <div class="panel-head"><span class="panel-head-title"><span class="panel-head-dot" style="background:var(--emerald-c)"></span>Büküm</span></div>
        <div style="overflow-x:auto"><table class="dt-table"><thead><tr><th>Ürün</th><th>İplik</th><th>Miktar kg</th><th>Not</th></tr></thead>
        <tbody>${satirlar || '<tr><td colspan="4" style="padding:14px;color:var(--text3)">Sipariş kalemi yok</td></tr>'}</tbody></table></div>
    </div>`;
}
function renderDokumaIplikSiparisPanel(siparis) {
    if (!siparis) return '';
    const sid = siparis.id;
    const kalemler = uaSiparisKalemleriGetir(siparis);
    const ops = dtGetSiparisOps(sid);
    const satirlar = kalemler.map((k, i) => {
        const kart = dtKalemKumasKart(k);
        const kayit = ops.iplik_siparis[i] || {};
        const cozguNo = kart?.cozgu_no || '—';
        const cozguCins = kart?.cozgu_cinsi || '—';
        const sipMiktar = parseFloat(k.miktar) || 0;
        return `<tr>
            <td style="padding:8px 10px;font-size:11px;font-weight:600">${pdfEsc(k.ad || k.kod || 'Ürün ' + (i + 1))}</td>
            <td style="padding:8px 10px;font-family:'DM Mono',monospace;font-size:10px">${pdfEsc(cozguNo)}</td>
            <td style="padding:8px 10px;font-size:10px">${pdfEsc(cozguCins)}</td>
            <td style="padding:8px 10px;font-family:'DM Mono',monospace;font-size:10px;text-align:right">${sipMiktar > 0 ? sipMiktar.toLocaleString('tr-TR') : '—'}</td>
            <td style="padding:8px 6px"><input type="number" step="0.01" min="0" class="pro-input" style="width:100%;padding:4px 6px;font-size:10px" value="${kayit.ihtiyac_kg ?? ''}" placeholder="kg" onchange="dtIplikSiparisFieldSet('${sid}',${i},'ihtiyac_kg',this.value)"></td>
            <td style="padding:8px 6px"><input type="number" step="0.01" min="0" class="pro-input" style="width:100%;padding:4px 6px;font-size:10px" value="${kayit.siparis_kg ?? ''}" placeholder="kg" onchange="dtIplikSiparisFieldSet('${sid}',${i},'siparis_kg',this.value)"></td>
            <td style="padding:8px 6px"><input class="pro-input" style="width:100%;padding:4px 6px;font-size:10px" value="${pdfEsc(kayit.not || '')}" placeholder="Not" onchange="dtIplikSiparisFieldSet('${sid}',${i},'not',this.value)"></td>
        </tr>`;
    }).join('');
    return `<div class="panel-box" style="padding:0;overflow:hidden">
        <div class="panel-head"><span class="panel-head-title"><span class="panel-head-dot" style="background:var(--violet-c)"></span>İplik Sipariş Miktarı</span>
            <span style="font-size:9px;color:var(--text3)">Çözgü ipliği — ürün kartı + sipariş miktarına göre</span></div>
        <div style="overflow-x:auto">
            <table class="dt-table"><thead><tr>
                <th>Ürün</th><th>Çözgü No</th><th>Marka/Cins</th><th style="text-align:right">Sipariş</th>
                <th>İhtiyaç (kg)</th><th>Sipariş (kg)</th><th>Not</th>
            </tr></thead><tbody>${satirlar || '<tr><td colspan="7" style="padding:14px;color:var(--text3)">Sipariş kalemi yok</td></tr>'}</tbody></table>
        </div>
    </div>`;
}
// ══════════════════════════════════════════════════════════════
// DOKUMA DEPO — masaüstünden taşındı, SALT-OKUNUR (görüntüleme)
// Depodaki kumaşları listeler/filtreler. Fiili sevk işlemi hâlâ
// yalnızca masaüstünden veya Konfeksiyon Panel'den yapılır — bu
// ekran sadece "depoda ne var" sorusuna cevap verir. Stok
// birleştirme/upsert motoru ve toplu sevk sepeti bilinçli olarak
// taşınmadı (canlı stok kaydı oluşturan/güncelleyen karmaşık bir
// motor; salt-okunur bir görüntüleme ekranı için gereksiz risk).
// ══════════════════════════════════════════════════════════════
/** Dokuma Depo listesi: bu tarihten önceki girişler gösterilmez */
/** Depo satırının kaydedildiği sipariş no (birleşik lot_no listesinden değil, siparis_id'den) */
/** Salt-okunur: kesim/sevk girişi yok, sadece "depoda ne var" listesi. */
function openDtDokumaHat() {
    dtDosyaAktif = 'IPLIK_HESAP';
    saveUiState({ dtDosyaAktif });
    setAppMode('DOKUMA_TAKIP');
}
function openDtUretimGiris() {
    dtDosyaAktif = 'URETIM_GIRIS';
    saveUiState({ dtDosyaAktif });
    setAppMode('DOKUMA_TAKIP');
}
function dtBuildDefaultLeventList(count = 200) {
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        no: 'LEV-' + String(i + 1).padStart(3, '0'),
        bos_agirlik: null,
        dolu_agirlik: null,
        hasil_sevk_tarih: '',
        hasil_gelis_tarih: '',
        hasil_kazan: '',
        hasil_durum: 'DOKUMADA',
        not: '',
    }));
}

function dtBuildDefaultYedekParcaList() {
    return [];
}

function dtLeventSet(index, field, value) {
    const data = dtLoadOpsData();
    if (!data.leventler[index]) return;
    const onceki = data.leventler[index][field];
    if (field === 'bos_agirlik' || field === 'dolu_agirlik') {
        const n = parseFloat(value);
        data.leventler[index][field] = Number.isFinite(n) ? n : null;
    } else {
        data.leventler[index][field] = value ?? '';
    }
    dtSaveOpsData(data);
    const yeni = data.leventler[index][field];
    if (String(onceki ?? '') !== String(yeni ?? '')) {
        const lvNo = data.leventler[index]?.no || ('LEV-' + String(index + 1).padStart(3, '0'));
        const alanMap = {
            no: 'Levent No',
            bos_agirlik: 'Boş Ağırlık',
            dolu_agirlik: 'Dolu Ağırlık',
            hasil_sevk_tarih: 'Haşıla Sevk',
            hasil_gelis_tarih: 'Haşıldan Geliş',
            hasil_kazan: 'Kazan',
            hasil_durum: 'Durum',
            not: 'Not'
        };
        const dosya = String(field).startsWith('hasil_') ? 'HASIL' : 'LEVENT';
        dtPushHareket({
            dosya,
            islem: 'Alan Güncellendi',
            alan: alanMap[field] || field,
            detay: `${lvNo} · ${alanMap[field] || field}: ${String(onceki ?? '—')} → ${String(yeni ?? '—')}`
        });
    }
    renderDokumaTakip();
}

function dtLeventTopluBosAgirlik() {
    const v = erpValDecimal('dt-toplu-bos', NaN);
    if (!Number.isFinite(v)) { erpToast('Geçerli bir boş ağırlık girin.', 'error'); return; }
    const data = dtLoadOpsData();
    const degisen = data.leventler.filter(l => parseFloat(l.bos_agirlik) !== v).length;
    data.leventler.forEach(l => { l.bos_agirlik = v; });
    dtSaveOpsData(data);
    dtPushHareket({
        dosya: 'LEVENT',
        islem: 'Toplu Güncelleme',
        alan: 'Boş Ağırlık',
        detay: `${degisen} levent için boş ağırlık ${v} kg yapıldı`
    });
    renderDokumaTakip();
}

function dtYedekSet(index, field, value) {
    const data = dtLoadOpsData();
    if (!Array.isArray(data.yedekParca)) data.yedekParca = [];
    if (!data.yedekParca[index]) return;
    const onceki = data.yedekParca[index][field];
    if (field === 'stok' || field === 'min') {
        const n = parseFloat(value);
        data.yedekParca[index][field] = Number.isFinite(n) ? n : 0;
    } else {
        data.yedekParca[index][field] = value ?? '';
    }
    dtSaveOpsData(data);
    const yeni = data.yedekParca[index][field];
    if (String(onceki ?? '') !== String(yeni ?? '')) {
        dtPushHareket({
            dosya: 'YEDEK',
            islem: 'Alan Güncellendi',
            alan: field,
            detay: `${data.yedekParca[index].kod || 'Yedek'} · ${field}: ${String(onceki ?? '—')} → ${String(yeni ?? '—')}`
        });
    }
    renderDokumaTakip();
}

function dtYedekEkle() {
    const data = dtLoadOpsData();
    if (!Array.isArray(data.yedekParca)) data.yedekParca = [];
    data.yedekParca.push({ kod: '', ad: '', raf: '', stok: 0, min: 0, son: '', durum: 'YETERLİ' });
    dtSaveOpsData(data);
    dtPushHareket({ dosya: 'YEDEK', islem: 'Satır Eklendi', detay: 'Yedek parça listesine yeni satır eklendi' });
    renderDokumaTakip();
}

function dtYedekSil(index) {
    const data = dtLoadOpsData();
    if (!Array.isArray(data.yedekParca) || !data.yedekParca[index]) return;
    const silinen = data.yedekParca[index];
    data.yedekParca.splice(index, 1);
    dtSaveOpsData(data);
    dtPushHareket({ dosya: 'YEDEK', islem: 'Satır Silindi', detay: `${silinen.kod || 'Kod yok'} silindi` });
    renderDokumaTakip();
}

// ── Dokuma → Kumaş Depo stok kararı ──
/* Masaüstünden (05-dokuma-ops.js) birebir taşındı. Mobilde bu fonksiyon YOKTU;
   iki yerde "typeof dokumaUrunIkinciOzet === 'function'" korumasıyla çağrılıyordu,
   dolayısıyla her zaman sessizce yedek hesaba düşüyordu. Yedek, KG siparişlerde
   ikinci birim olarak kg yerine ADET kullanıyor ve toplamlar boşken girişleri
   toplamıyordu. */
/**
 * Sipariş birimine göre dokuma ikinci birim:
 * KG/MT → metre + kg | ADET → metre + adet
 */
function dtGirisStokDurumu(g) {
    if (!g) return 'BEKLIYOR';
    if (g.stok_durumu === 'STOK' || g.stok_id) return 'STOK';
    if (g.stok_durumu === 'ACIK') return 'ACIK';
    if (g.stok_durumu === 'BEKLIYOR') return 'BEKLIYOR';
    if (!Object.prototype.hasOwnProperty.call(g, 'stok_durumu')) return 'STOK';
    return 'BEKLIYOR';
}

function dtGirisStokDurumuBadge(g) {
    const d = dtGirisStokDurumu(g);
    if (d === 'STOK') return '<span class="pill pill-cyan" style="font-size:8px;padding:2px 6px">Stokta</span>';
    if (d === 'ACIK') return '<span class="pill pill-amber" style="font-size:8px;padding:2px 6px">Açık</span>';
    return '<span class="pill pill-amber" style="font-size:8px;padding:2px 6px;border-style:dashed">Karar Bekliyor</span>';
}

function dtKalemStokOzet(u) {
    const girisler = Array.isArray(u?.girisler) ? u.girisler : [];
    const z = { bek_m: 0, bek_kg: 0, bek_ad: 0, acik_m: 0, acik_kg: 0, acik_ad: 0, stok_m: 0, stok_kg: 0, stok_ad: 0, bek_say: 0 };
    for (const g of girisler) {
        const m = parseFloat(g.metre || 0) || 0;
        const kg = parseFloat(g.kg || 0) || 0;
        const ad = parseInt(g.adet || 0, 10) || 0;
        const d = dtGirisStokDurumu(g);
        if (d === 'STOK') { z.stok_m += m; z.stok_kg += kg; z.stok_ad += ad; }
        else if (d === 'ACIK') { z.acik_m += m; z.acik_kg += kg; z.acik_ad += ad; }
        else { z.bek_m += m; z.bek_kg += kg; z.bek_ad += ad; z.bek_say++; }
    }
    return z;
}

async function dtStokaAlGiris(urunIdx, girisIdx, opts) {
    const sid = opts?.siparisId || dtSeciliSiparisId;
    if (!sid) return;
    const kd = await dtGetKd(sid);
    const u = kd?.urunler?.[urunIdx];
    if (!u || !Array.isArray(u.girisler) || !u.girisler[girisIdx]) return;
    const g = u.girisler[girisIdx];
    if (dtGirisStokDurumu(g) !== 'BEKLIYOR') {
        if (!opts?.sessiz) erpToast('Bu giriş için stok kararı zaten verilmiş.', 'error');
        return;
    }
    const metre = parseFloat(g.metre || 0) || 0;
    const kg = parseFloat(g.kg || 0) || 0;
    const adet = parseInt(g.adet || 0, 10) || 0;
    if (metre <= 0) {
        if (!opts?.sessiz) erpToast('Stoka almak için metre (m) zorunludur.', 'error');
        return;
    }
    const ikinciTip = kg > 0 ? 'KG' : (adet > 0 ? 'ADET' : '');
    if (kg <= 0 && adet <= 0) {
        if (!opts?.sessiz) erpToast('Stoka almak için kg veya adet de girilmelidir.', 'error');
        return;
    }
    const siparis = (dataCache.siparisler || []).find(s => String(s.id) === String(sid));
    let kalemler = [];
    try { kalemler = typeof siparis?.cins === 'string' ? JSON.parse(siparis.cins) : (siparis?.cins || []); } catch (e) {}
    const kalem = kalemler[urunIdx] || {};
    const urunAd = kalem.ad || kalem.kod || `Ürün ${urunIdx + 1}`;
    const stokKodu = dtKalemStokKodu(kalem) || String(siparis?.sno || '').trim();
    const simteksOto = !!(opts?.simteksOtomatik || dtKalemOtomatikStokaMi(siparis, kalem));
    const now = new Date();
    const tarih = now.toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const userLabel = dtCurrentUserLabel();
    const { data, error } = await sb.from('kumas_stok').insert([{
        kumas_cinsi: simteksOto && stokKodu ? `${stokKodu} — ${urunAd}` : `${siparis?.sno || '?'} — ${urunAd}`,
        miktar_kg: kg,
        miktar_mt: metre,
        cuval_sayisi: adet,
        firma: siparis?.firma || '',
        stok_kodu: stokKodu,
        lot_no: siparis?.sno || '',
        kaynak_birim: 'DOKUMA_TAKIP',
        islem_turu: 'GİRİŞ',
        notlar: simteksOto ? `[SIMTEKS_STOK] Otomatik dokuma stok girişi · ${stokKodu}` : '[SEVKE_HAZIR] Dokuma çıkışı sevk havuzuna alındı',
        islem_gecmisi: `✨ ${tarih} — Dokuma stoka alındı (${urunAd}) · +${metre.toFixed(2)} m${ikinciTip ? ' · +' + (ikinciTip === 'KG' ? kg.toFixed(2) + ' kg' : adet + ' adet') : ''} · ${userLabel}`,
        updated_by: userLabel
    }]).select('id');
    if (error) {
        if (!opts?.sessiz) erpToast('Stok kaydı oluşturulamadı: ' + error.message, 'error');
        return;
    }
    g.stok_durumu = 'STOK';
    g.stok_id = data?.[0]?.id || null;
    g.stok_tarih = tarih;
    g.stok_otomatik = !!simteksOto;
    await dtSetKd(sid, kd);
    dtPushHareket({
        dosya: 'SIPARIS',
        islem: simteksOto ? 'Dokuma → Simteks Stok (Otomatik)' : 'Dokuma → Kumaş Depo (Stok)',
        siparis: siparis?.sno || String(sid),
        detay: `${urunAd} · +${metre.toFixed(2)} m stoka alındı · ${stokKodu || '—'} · depo #${g.stok_id || '?'}`
    });
    syncAllData();
    if (!opts?.sessiz) {
        erpToast(simteksOto ? 'Simteks stok kodlu ürün depoya otomatik eklendi.' : 'Kumaş depoya stoka alındı (sevke hazır havuzu).', 'success');
        renderDokumaTakip();
    }
}

async function dtGirisAciktaIsaretle(urunIdx, girisIdx) {
    if (!dtSeciliSiparisId) return;
    const kd = await dtGetKd(dtSeciliSiparisId);
    const u = kd?.urunler?.[urunIdx];
    if (!u || !Array.isArray(u.girisler) || !u.girisler[girisIdx]) return;
    const g = u.girisler[girisIdx];
    if (dtGirisStokDurumu(g) !== 'BEKLIYOR') {
        erpToast('Bu giriş için stok kararı zaten verilmiş.', 'error');
        return;
    }
    g.stok_durumu = 'ACIK';
    g.stok_tarih = new Date().toLocaleString('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    await dtSetKd(dtSeciliSiparisId, kd);
    const siparis = (dataCache.siparisler || []).find(s => s.id == dtSeciliSiparisId);
    dtPushHareket({
        dosya: 'SIPARIS',
        islem: 'Dokuma Açıkta Devam',
        siparis: siparis?.sno || String(dtSeciliSiparisId),
        detay: `Ürün #${urunIdx + 1} girişi açıkta — stoka alınmadı`
    });
    erpToast('Açıkta dokumaya devam — stoka alınmadı.', 'success');
    renderDokumaTakip();
}

async function dtStokaAlKalemBekleyen(urunIdx) {
    if (!dtSeciliSiparisId) return;
    const kd = await dtGetKd(dtSeciliSiparisId);
    const u = kd?.urunler?.[urunIdx];
    if (!u || !Array.isArray(u.girisler)) return;
    const indeksler = u.girisler.map((g, gi) => gi).filter(gi => dtGirisStokDurumu(u.girisler[gi]) === 'BEKLIYOR');
    if (!indeksler.length) { erpToast('Bu üründe karar bekleyen giriş yok.', 'error'); return; }
    if (!confirm(`${indeksler.length} bekleyen giriş kumaş depoya (sevke hazır havuzu) alınsın mı?`)) return;
    for (const gi of indeksler) await dtStokaAlGiris(urunIdx, gi, { sessiz: true });
    erpToast(`${indeksler.length} giriş stoka alındı.`, 'success');
    renderDokumaTakip();
}

/* ── Dokuma giriş denetim izi ─────────────────────────────────────
   Masaüstü (src/stok/js/05-dokuma-ops.js) ve Dokuma Paneli ile BİREBİR aynı
   biçim. Bir kayıt silinince üstündeki gecmis[] de onunla gider; silmenin izi
   yalnızca bu ayrı satırda kalır.
   notlar JSON'ında üst düzey adet/metre/mt/kg anahtarı KULLANILMAZ — değerler
   eski/yeni içinde durur; yoksa operasyon günlüğü bunu üretim miktarı sanar. */
/** Giriş geçmişi satırının ürün etiketi — denetim satırında görünür. */
/* ── Dokuma Takip ↔ Tezgah bağlantısı (ürün bazında) ─────────────────
   Masaüstü (05-dokuma-ops.js) ve mobil (mobil-app.js) BİREBİR AYNI blok.
   Bir sipariş kaleminin hangi tezgah(lar)da dokunduğu dokuma_levent_is
   tablosundaki (siparis_id, kalem_idx) bağından okunur — sipariş değil
   ÜRÜN bağlanır, çünkü aynı siparişin ürünleri farklı tezgahlarda dokunur.
   Dokuma girişi bir tezgah seçilerek yapılırsa KD_DOKUMA giriş kaydına
   tezgah_id / levent_id / is_id yazılır; tezgahın dokunan metresi bu
   kayıtlardan hesaplanır (ayrı sayaç tutulmaz, kayma olmaz). */
/** Dokuma giriş kaydına eklenecek tezgah alanları (seçilmediyse boş). */
/**
 * Sipariş miktarına göre fazlalık / kalan. Fazla dokuma ENGELLENMEZ —
 * önceden "kalan" 0'a kırpılıyordu ve 850 m dokunmuş 800 m'lik kalem
 * "0 kalan" görünüyordu; fazlalık hiçbir yerde yazmıyordu.
 */
/** Girişi yapan kullanıcı — denetim izi için her dokuma girişine yazılır. */
function renderDokumaOperasyonPanelleri(siparis, aktifDosya) {
    const ops = dtLoadOpsData();
    const leventTakip = ops.leventler || [];
    const hasilTakip = leventTakip.filter(r => r.hasil_sevk_tarih || r.hasil_gelis_tarih || (r.hasil_durum && r.hasil_durum !== 'DOKUMADA'));
    const yedekParca = Array.isArray(ops.yedekParca) ? ops.yedekParca : [];
    const badge = (d) => {
        if (d === 'KRİTİK' || d === 'DÜŞÜK' || d === 'BİTİŞE YAKIN') return `<span class="pill pill-red">${d}</span>`;
        if (d === 'KONTROL' || d === 'SINIRDA') return `<span class="pill pill-amber">${d}</span>`;
        if (d === 'TAMAMLANDI') return `<span class="pill pill-cyan">${d}</span>`;
        return `<span class="pill pill-green">${d}</span>`;
    };

    const hasilPanel = `
        <div class="panel-box">
            <div class="panel-head">
                <span class="panel-head-title"><span class="panel-head-dot" style="background:var(--amber-c)"></span>Haşıl Takip</span>
                <span style="font-size:9px;color:var(--text3);font-family:'DM Mono',monospace">Levent sevk/geliş operasyon detayları</span>
            </div>
            <div style="overflow-x:auto;max-height:420px;overflow-y:auto">
                <table class="dt-table">
                    <thead><tr><th>Levent No</th><th>Boş (kg)</th><th>Dolu (kg)</th><th>Net (kg)</th><th>Haşıla Sevk</th><th>Haşıldan Geliş</th><th>Kazan</th><th>Durum</th></tr></thead>
                    <tbody>
                        ${hasilTakip.length ? hasilTakip.map(r => `
                            <tr>
                                <td class="mono">${r.no || '—'}</td>
                                <td class="mono">${(parseFloat(r.bos_agirlik)||0).toFixed(2)}</td>
                                <td class="mono">${(parseFloat(r.dolu_agirlik)||0).toFixed(2)}</td>
                                <td class="mono">${Math.max((parseFloat(r.dolu_agirlik)||0) - (parseFloat(r.bos_agirlik)||0), 0).toFixed(2)}</td>
                                <td>${r.hasil_sevk_tarih || '—'}</td>
                                <td>${r.hasil_gelis_tarih || '—'}</td>
                                <td>${r.hasil_kazan || '—'}</td>
                                <td>${badge(r.hasil_durum || 'DOKUMADA')}</td>
                            </tr>
                        `).join('') : `<tr><td colspan="8" style="padding:12px;color:var(--text3)">Henüz haşıl sevk/geliş hareketi yok.</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>`;

    const leventPanel = `
        <div class="panel-box">
            <div class="panel-head">
                <span class="panel-head-title"><span class="panel-head-dot" style="background:var(--cyan-c)"></span>Levent Takip</span>
                <span style="font-size:9px;color:var(--text3);font-family:'DM Mono',monospace">200 sabit levent kartı · boş/dolu ağırlık ve haşıl hareketi</span>
            </div>
            <div style="padding:10px 12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <span style="font-size:9px;color:var(--text3);font-family:'DM Mono',monospace">Toplu boş ağırlık (kg)</span>
                <input id="dt-toplu-bos" type="number" step="0.01" value="12.5" class="pro-input" style="width:90px;padding:5px 8px">
                <button onclick="dtLeventTopluBosAgirlik()" class="btn-pro btn-ghost-pro" style="padding:5px 10px;font-size:10px">Tümüne Uygula</button>
                <span style="margin-left:auto;font-size:9px;color:var(--text3);font-family:'DM Mono',monospace">${leventTakip.length} levent</span>
            </div>
            <div style="overflow-x:auto;max-height:520px;overflow-y:auto">
                <table class="dt-table">
                    <thead><tr><th>#</th><th>Levent No</th><th>Boş Levent Ağırlığı (kg)</th><th>Dolu Levent Ağırlığı (kg)</th><th>Net İplik (kg)</th><th>Haşıla Sevk</th><th>Haşıldan Geliş</th><th>Kazan</th><th>Durum</th><th>Not</th></tr></thead>
                    <tbody>
                        ${leventTakip.map((r, i) => `
                            <tr>
                                <td class="mono">${i + 1}</td>
                                <td><input value="${(r.no ?? '').replace(/"/g,'&quot;')}" onchange="dtLeventSet(${i},'no',this.value)" class="pro-input" style="min-width:120px;padding:4px 6px"></td>
                                <td><input type="number" step="0.01" value="${r.bos_agirlik ?? ''}" onchange="dtLeventSet(${i},'bos_agirlik',this.value)" class="pro-input" style="min-width:90px;padding:4px 6px"></td>
                                <td><input type="number" step="0.01" value="${r.dolu_agirlik ?? ''}" onchange="dtLeventSet(${i},'dolu_agirlik',this.value)" class="pro-input" style="min-width:90px;padding:4px 6px"></td>
                                <td class="mono">${Math.max((parseFloat(r.dolu_agirlik)||0) - (parseFloat(r.bos_agirlik)||0), 0).toFixed(2)}</td>
                                <td><input type="date" value="${r.hasil_sevk_tarih || ''}" onchange="dtLeventSet(${i},'hasil_sevk_tarih',this.value)" class="pro-input" style="min-width:130px;padding:4px 6px"></td>
                                <td><input type="date" value="${r.hasil_gelis_tarih || ''}" onchange="dtLeventSet(${i},'hasil_gelis_tarih',this.value)" class="pro-input" style="min-width:130px;padding:4px 6px"></td>
                                <td><input value="${(r.hasil_kazan || '').replace(/"/g,'&quot;')}" placeholder="Kazan-1" onchange="dtLeventSet(${i},'hasil_kazan',this.value)" class="pro-input" style="min-width:90px;padding:4px 6px"></td>
                                <td>
                                    <select onchange="dtLeventSet(${i},'hasil_durum',this.value)" class="pro-input" style="min-width:115px;padding:4px 6px">
                                        ${['DOKUMADA','HASILA SEVK','HASILDA','HASILDAN GELDI'].map(d => `<option value="${d}" ${r.hasil_durum===d?'selected':''}>${d}</option>`).join('')}
                                    </select>
                                </td>
                                <td><input value="${(r.not || '').replace(/"/g,'&quot;')}" onchange="dtLeventSet(${i},'not',this.value)" class="pro-input" style="min-width:140px;padding:4px 6px"></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;

    const yedekPanel = `
        <div class="panel-box">
            <div class="panel-head">
                <span class="panel-head-title"><span class="panel-head-dot" style="background:var(--rose-c)"></span>Yedek Parça Listesi</span>
                <span style="font-size:9px;color:var(--text3);font-family:'DM Mono',monospace">Sıfırdan doldurulabilir aktif liste</span>
            </div>
            <div style="padding:10px 12px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <button onclick="dtYedekEkle()" class="btn-pro btn-ghost-pro" style="padding:5px 10px;font-size:10px">+ Satır Ekle</button>
                <span style="margin-left:auto;font-size:9px;color:var(--text3);font-family:'DM Mono',monospace">${yedekParca.length} satır</span>
            </div>
            <div style="overflow-x:auto">
                <table class="dt-table">
                    <thead><tr><th>Kod</th><th>Parça</th><th>Raf</th><th>Mevcut</th><th>Min</th><th>Son Hareket</th><th>Durum</th><th></th></tr></thead>
                    <tbody>
                        ${yedekParca.length ? yedekParca.map((r, i) => `
                            <tr>
                                <td><input value="${(r.kod || '').replace(/"/g,'&quot;')}" onchange="dtYedekSet(${i},'kod',this.value)" class="pro-input mono" style="min-width:110px;padding:4px 6px"></td>
                                <td><input value="${(r.ad || '').replace(/"/g,'&quot;')}" onchange="dtYedekSet(${i},'ad',this.value)" class="pro-input" style="min-width:180px;padding:4px 6px"></td>
                                <td><input value="${(r.raf || '').replace(/"/g,'&quot;')}" onchange="dtYedekSet(${i},'raf',this.value)" class="pro-input" style="min-width:80px;padding:4px 6px"></td>
                                <td><input type="number" step="0.01" value="${r.stok ?? 0}" onchange="dtYedekSet(${i},'stok',this.value)" class="pro-input mono" style="min-width:80px;padding:4px 6px"></td>
                                <td><input type="number" step="0.01" value="${r.min ?? 0}" onchange="dtYedekSet(${i},'min',this.value)" class="pro-input mono" style="min-width:80px;padding:4px 6px"></td>
                                <td><input value="${(r.son || '').replace(/"/g,'&quot;')}" onchange="dtYedekSet(${i},'son',this.value)" class="pro-input" style="min-width:100px;padding:4px 6px" placeholder="GG.AA.YYYY"></td>
                                <td>
                                    <select onchange="dtYedekSet(${i},'durum',this.value)" class="pro-input" style="min-width:110px;padding:4px 6px">
                                        ${['YETERLİ','SINIRDA','KRİTİK','KONTROL'].map(d => `<option value="${d}" ${r.durum===d?'selected':''}>${d}</option>`).join('')}
                                    </select>
                                </td>
                                <td><button onclick="dtYedekSil(${i})" class="btn-pro btn-ghost-pro" style="padding:4px 8px;font-size:9px;color:var(--rose-c)">Sil</button></td>
                            </tr>
                        `).join('') : `<tr><td colspan="8" style="padding:12px;color:var(--text3)">Liste boş. + Satır Ekle ile sıfırdan başlayabilirsiniz.</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>`;

    if (aktifDosya === 'HASIL') return `<div style="display:flex;flex-direction:column;gap:16px">${hasilPanel}
        <div>
            <div style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.1em;font-family:'DM Mono',monospace;margin-bottom:8px;padding:0 4px">Levent</div>
            ${leventPanel}
        </div>
    </div>`;
    if (aktifDosya === 'LEVENT') return `<div style="display:grid;grid-template-columns:1fr;gap:12px">${leventPanel}</div>`;
    if (aktifDosya === 'YEDEK') return `<div style="display:grid;grid-template-columns:1fr;gap:12px">${yedekPanel}</div>`;
    return `<div style="display:grid;grid-template-columns:1fr;gap:12px">${hasilPanel}${leventPanel}${yedekPanel}</div>`;
}

// ════════════════════════════════════════════════════════
//  RAPORLAR & ANALİZ MODÜLÜ
// ════════════════════════════════════════════════════════

// ── Dokuma Takip · Günlük Excel içe aktarma ─────────────────────────────
const RAPOR_IZLEME_LS_KEY = 'erp_rapor_siparis_izleme_v1';
let raporIzlemeIds = (() => {
    try {
        const j = JSON.parse(localStorage.getItem(RAPOR_IZLEME_LS_KEY) || '[]');
        return Array.isArray(j) ? j.map(String).filter(Boolean) : [];
    } catch (e) { return []; }
})();
let raporIzlemeAggCache = {};
let raporIzlemeDetayCache = null;
/** Rapor > Ürün özeti: siparis_grubu (GIDA/HALI/EV_TEKSTILI/…), ürün arama, konfeksiyon üretim yeri */
// ── KONFEKSİYON İŞLEM RAPORU (günlük / haftalık / aylık) — masaüstünden birebir taşındı ──
/* DİKKAT: Bu liste doğrudan veritabanı sorgusuna (.in('islem', …)) gider — Türkçe harf
   çevirimi (raporKonfIslemGrupKod) SONRA çalıştığı için, burada olmayan yazım hiç çekilmez.
   Veritabanında aynı işlem iki yazımla kayıtlı (ör. KESİM 287 / KESIM 87 kayıt); Konfeksiyon
   Panel'den girilen kalite kayıtları da 'KALİTE KONTROL' adıyla yazılıyor. Yeni bir işlem adı
   eklenirse buraya da eklenmeli. */
// ── 0. ÜST ÖZET ŞERİDİ (Sipariş tab'ında gösterilir) ──────
// ── 1. SİPARİŞ ÖZETİ ──────────────────────────────────────
// ── 1b. TEK SİPARİŞ RAPORU (detaylı üretim özeti + şemalar) ──
// ── 1c. SİPARİŞ İZLEME PANELİ (manuel seçimli takip listesi) ──
function raporAktifSiparisMi(s) {
    return String(s?.durum || '').toUpperCase() !== 'TAMAMLANDI';
}
function raporIzlemeListeKaydet() {
    try { localStorage.setItem(RAPOR_IZLEME_LS_KEY, JSON.stringify(raporIzlemeIds)); } catch (e) {}
    saveUiState({ raporIzlemeIds: raporIzlemeIds.slice() });
}
function raporIzlemeSecilenCheckboxIds() {
    return Array.from(document.querySelectorAll('.rapor-izleme-pick-cb:checked'))
        .map(el => String(el.value || '').trim())
        .filter(Boolean);
}
function raporIzlemeSecimSayacGuncelle() {
    const n = raporIzlemeSecilenCheckboxIds().length;
    const el = document.getElementById('rapor-izleme-secim-sayac');
    if (el) el.textContent = n ? `${n} sipariş seçili` : 'Sipariş seçin';
}
function raporIzlemeTumunuSec(hepsi) {
    document.querySelectorAll('.rapor-izleme-pick-row:not([style*="display: none"]) .rapor-izleme-pick-cb').forEach(cb => {
        cb.checked = !!hepsi;
    });
    raporIzlemeSecimSayacGuncelle();
}
function raporIzlemeAramaFiltrele() {
    const q = String(document.getElementById('rapor-izleme-ara')?.value || '').toLowerCase().trim();
    document.querySelectorAll('.rapor-izleme-pick-row').forEach(row => {
        const blob = String(row.getAttribute('data-izleme-ara') || '').toLowerCase();
        row.style.display = !q || blob.includes(q) ? '' : 'none';
    });
    raporIzlemeSecimSayacGuncelle();
}
function raporIzlemeSecilenleriEkle() {
    const ids = raporIzlemeSecilenCheckboxIds();
    if (!ids.length) { erpToast('Önce listeden en az bir sipariş işaretleyin.', 'warn'); return; }
    let eklenen = 0;
    let atlanan = 0;
    const mevcut = new Set(raporIzlemeIds.map(String));
    ids.forEach(id => {
        const sip = (dataCache.siparisler || []).find(s => String(s.id) === id);
        if (!sip || !raporAktifSiparisMi(sip)) { atlanan++; return; }
        if (mevcut.has(id)) { atlanan++; return; }
        raporIzlemeIds.push(id);
        mevcut.add(id);
        eklenen++;
    });
    if (!eklenen) {
        erpToast(atlanan ? 'Seçilen siparişler zaten listede veya eklenemez.' : 'Eklenecek sipariş yok.', 'warn');
        return;
    }
    raporIzlemeListeKaydet();
    raporIzlemeDetayCache = null;
    erpToast(`${eklenen} sipariş izleme listesine eklendi${atlanan ? ` · ${atlanan} atlandı` : ''}.`, 'success');
    renderRaporlar();
}
function raporIzlemeKaldir(id) {
    const sid = String(id);
    raporIzlemeIds = raporIzlemeIds.filter(x => String(x) !== sid);
    delete raporIzlemeAggCache[sid];
    raporIzlemeDetayCache = null;
    raporIzlemeListeKaydet();
    renderRaporlar();
}
function raporIzlemeTemizle() {
    if (!raporIzlemeIds.length) return;
    if (!confirm('İzleme listesindeki tüm siparişler kaldırılsın mı?')) return;
    raporIzlemeIds = [];
    raporIzlemeAggCache = {};
    raporIzlemeDetayCache = null;
    raporIzlemeListeKaydet();
    renderRaporlar();
}
function raporIzlemeDetayGit(id) {
    raporTekSeciliSiparisId = String(id);
    raporTab = 'SIPARIS_TEK';
    renderRaporlar();
}
function raporIzlemeIlerlemeSatir(etiket, cur, tgt, renk) {
    const pct = raporTekOranYuzde(cur, tgt);
    const fmt = (n) => (Number(n) || 0).toLocaleString('tr-TR');
    return `<div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:3px">
            <span style="font-size:9px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;font-family:'DM Mono',monospace">${pdfEsc(etiket)}</span>
            <span style="font-size:9px;font-weight:700;color:var(--text2);font-family:'DM Mono',monospace">${fmt(cur)} / ${fmt(tgt)} · %${pct}</span>
        </div>
        <div style="height:6px;border-radius:999px;background:var(--surface2);overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${renk};border-radius:999px;transition:width 0.2s"></div>
        </div>
    </div>`;
}
function raporIzlemeKartHtml(siparis, agg) {
    const sid = String(siparis.id);
    const tgt = agg.sipAdet || 1;
    const gun = siparis.ttarih ? Math.ceil((new Date(siparis.ttarih) - new Date()) / 86400000) : null;
    const terminTxt = gun == null ? '—' : gun < 0 ? `${Math.abs(gun)} gün gecikti` : gun === 0 ? 'Termin bugün' : `${gun} gün kaldı`;
    const durPill = siparis.durum === 'TAMAMLANDI' ? 'pill-green' : (gun != null && gun < 0) ? 'pill-red' : 'pill-blue';
    const tt = siparis.ttarih ? new Date(siparis.ttarih).toLocaleDateString('tr-TR') : '—';
    const yik = (agg.ySevk || 0) + (agg.yGel || 0);
    return `
    <div class="panel-box" style="padding:0;overflow:hidden;border:1px solid var(--border)" id="rapor-izleme-kart-${sid}">
        <div style="padding:14px 16px;border-bottom:1px solid var(--border);background:linear-gradient(135deg, rgba(225,29,72,0.06), transparent)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
                <div style="min-width:0">
                    <div style="font-family:'Instrument Serif',serif;font-size:22px;color:var(--text);line-height:1.1">${pdfEsc(siparis.sno || '—')}</div>
                    <div style="font-size:11px;font-weight:600;color:var(--text2);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pdfEsc(siparis.firma || '—')}</div>
                    <div style="font-size:9px;color:var(--text3);margin-top:4px;font-family:'DM Mono',monospace">Termin: ${pdfEsc(tt)} · ${pdfEsc(terminTxt)}</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
                    <span class="pill ${durPill}" style="font-size:9px">${pdfEsc(siparis.durum || 'BEKLEMEDE')}</span>
                    <button type="button" onclick="raporIzlemeKaldir('${sid}')" title="Listeden çıkar" style="border:none;background:transparent;color:var(--text3);cursor:pointer;font-size:14px;line-height:1">✕</button>
                </div>
            </div>
        </div>
        <div style="padding:14px 16px">
            ${raporIzlemeIlerlemeSatir('Dokuma', agg.dokAdet, tgt, '#22d3ee')}
            ${raporIzlemeIlerlemeSatir('Kesim', agg.kes, tgt, '#818cf8')}
            ${raporIzlemeIlerlemeSatir('Yıkama', yik, Math.max(tgt, 1), '#38bdf8')}
            ${raporIzlemeIlerlemeSatir('Dikim', agg.dik, tgt, '#fb7185')}
            ${raporIzlemeIlerlemeSatir('Kalite', agg.kk, tgt, '#fbbf24')}
            ${raporIzlemeIlerlemeSatir('Koli', agg.kol, tgt, '#34d399')}
            ${raporIzlemeIlerlemeSatir('Sevk', agg.sevk, tgt, '#a78bfa')}
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;font-size:9px;color:var(--text3);font-family:'DM Mono',monospace">
                <span>Dokuma: <b style="color:var(--cyan-c)">${(agg.dokM || 0).toFixed(1)} m</b></span>
                <span>·</span>
                <span><b style="color:var(--accent2)">${(agg.dokKg || 0).toFixed(1)} kg</b></span>
                <span>·</span>
                <span>Sipariş adet: <b>${tgt.toLocaleString('tr-TR')}</b></span>
            </div>
            <button type="button" onclick="raporIzlemeDetayGit('${sid}')" class="btn-pro btn-ghost-pro" style="width:100%;margin-top:12px;padding:8px;font-size:10px;font-weight:700">Tam detay raporu →</button>
        </div>
    </div>`;
}
function renderRaporSiparisIzleme() {
    const aktif = (dataCache.siparisler || []).filter(raporAktifSiparisMi)
        .sort((a, b) => String(a.sno || '').localeCompare(String(b.sno || ''), 'tr', { numeric: true }));
    const seciliSet = new Set(raporIzlemeIds.map(String));
    const eklenebilir = aktif.filter(s => !seciliSet.has(String(s.id)));
    const chipHtml = raporIzlemeIds.map(id => {
        const s = (dataCache.siparisler || []).find(x => String(x.id) === String(id));
        if (!s) return '';
        return `<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;background:rgba(225,29,72,0.1);border:1px solid rgba(225,29,72,0.25);font-size:10px;font-weight:700;color:var(--text)">
            ${pdfEsc(s.sno || id)} <button type="button" onclick="raporIzlemeKaldir('${id}')" style="border:none;background:transparent;cursor:pointer;color:var(--rose-c);font-size:12px;line-height:1">×</button>
        </span>`;
    }).filter(Boolean).join('');
    const pickRows = eklenebilir.map(s => {
        const sid = String(s.id);
        const tt = s.ttarih ? new Date(s.ttarih).toLocaleDateString('tr-TR') : '—';
        const gun = s.ttarih ? Math.ceil((new Date(s.ttarih) - new Date()) / 86400000) : null;
        const terminBadge = gun != null && gun < 0 ? 'pill-red' : (gun != null && gun <= 7 ? 'pill-amber' : '');
        const terminTxt = gun == null ? '' : gun < 0 ? `${Math.abs(gun)}g gecikme` : gun === 0 ? 'bugün' : `${gun}g`;
        const araBlob = [s.sno, s.firma, s.durum, tt].join(' ');
        return `<label class="rapor-izleme-pick-row" data-izleme-ara="${pdfEsc(araBlob)}" style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;cursor:pointer;border:1px solid transparent;transition:background 0.12s"
            onmouseover="this.style.background='var(--surface2)'" onmouseout="this.style.background='transparent'">
            <input type="checkbox" class="rapor-izleme-pick-cb" value="${sid}" onchange="raporIzlemeSecimSayacGuncelle()" style="width:16px;height:16px;accent-color:#e11d48;flex-shrink:0">
            <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <span class="pill pill-blue" style="font-size:9px;font-family:'DM Mono',monospace">${pdfEsc(s.sno || sid)}</span>
                    ${terminBadge ? `<span class="pill ${terminBadge}" style="font-size:8px">${pdfEsc(terminTxt)}</span>` : (terminTxt ? `<span style="font-size:8px;color:var(--text3)">${pdfEsc(terminTxt)}</span>` : '')}
                </div>
                <div style="font-size:10px;color:var(--text2);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pdfEsc(s.firma || '—')}</div>
            </div>
            <div style="font-size:9px;color:var(--text3);font-family:'DM Mono',monospace;flex-shrink:0">${pdfEsc(tt)}</div>
        </label>`;
    }).join('');
    return `
    <div style="display:flex;flex-direction:column;gap:14px" id="rapor-izleme-wrap">
        <div class="panel-box" style="padding:14px 18px;border:1px solid rgba(225,29,72,0.3);background:linear-gradient(135deg, rgba(225,29,72,0.07), rgba(255,255,255,0.5))">
            <div style="font-size:9px;font-weight:800;color:#e11d48;text-transform:uppercase;letter-spacing:0.12em;font-family:'DM Mono',monospace;margin-bottom:6px">Manuel izleme listesi</div>
            <div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:4px">Sadece seçtiğiniz aktif siparişler</div>
            <div style="font-size:10px;color:var(--text3);line-height:1.45;max-width:720px;margin-bottom:12px">Birden fazla siparişi işaretleyip tek seferde ekleyin. İzleme listesi bu cihazda saklanır.</div>
            <div style="display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:12px">
                <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
                    <input type="text" id="rapor-izleme-ara" class="pro-input" placeholder="Sipariş no, firma ara…" oninput="raporIzlemeAramaFiltrele()"
                        style="flex:1;min-width:180px;padding:8px 12px;font-size:11px">
                    <button type="button" onclick="raporIzlemeTumunuSec(true)" class="btn-pro btn-ghost-pro" style="padding:7px 12px;font-size:10px">Tümünü seç</button>
                    <button type="button" onclick="raporIzlemeTumunuSec(false)" class="btn-pro btn-ghost-pro" style="padding:7px 12px;font-size:10px">Seçimi temizle</button>
                </div>
                ${eklenebilir.length ? `
                <div style="border:1px solid var(--border);border-radius:10px;background:var(--surface);max-height:220px;overflow-y:auto;padding:6px">
                    ${pickRows}
                </div>
                ` : `<div style="padding:14px;text-align:center;font-size:11px;color:var(--text3);border:1px dashed var(--border2);border-radius:10px">Eklenebilecek aktif sipariş kalmadı — tümü izleme listesinde.</div>`}
                <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
                    <span id="rapor-izleme-secim-sayac" style="font-size:10px;font-weight:700;color:var(--text2);font-family:'DM Mono',monospace">Sipariş seçin</span>
                    <button type="button" onclick="raporIzlemeSecilenleriEkle()" class="btn-pro btn-primary-pro" style="padding:8px 16px;font-size:10px;font-weight:800">+ Seçilenleri listeye ekle</button>
                    <button type="button" onclick="raporIzlemePaneleYukle(true)" class="btn-pro btn-ghost-pro" style="padding:8px 14px;font-size:10px">↻ Durumları yenile</button>
                    ${raporIzlemeIds.length ? `<button type="button" onclick="raporIzlemeTemizle()" class="btn-pro btn-ghost-pro" style="padding:8px 14px;font-size:10px;color:var(--rose-c)">İzleme listesini temizle</button>` : ''}
                </div>
            </div>
            ${raporIzlemeIds.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;padding-top:12px;border-top:1px solid var(--border)">${chipHtml}</div>` : ''}
            <div style="font-size:9px;color:var(--text3);margin-top:10px">${raporIzlemeIds.length} sipariş izleniyor · ${eklenebilir.length} eklenebilir · ${aktif.length} aktif toplam</div>
        </div>
        <div id="rapor-izleme-kartlar">
            ${raporIzlemeIds.length
                ? '<div class="panel-box" style="padding:32px;text-align:center;color:var(--text3)"><div style="font-size:28px;margin-bottom:8px">⏳</div>Durumlar yükleniyor…</div>'
                : `<div class="panel-box" style="padding:40px 24px;text-align:center">
                    <div style="font-size:36px;margin-bottom:10px;opacity:0.85">📌</div>
                    <div style="font-size:13px;font-weight:700;color:var(--text2)">Henüz izleme listesi yok</div>
                    <div style="font-size:11px;color:var(--text3);margin-top:6px">Yukarıdan siparişleri işaretleyip «Seçilenleri listeye ekle» ile takip etmeye başlayın.</div>
                </div>`}
        </div>
        ${raporIzlemeIds.length ? `
        <div class="panel-box" id="rapor-izleme-detay-merkez" style="padding:16px 18px;border:1px solid rgba(99,102,241,0.35);background:linear-gradient(135deg,rgba(99,102,241,0.06),rgba(255,255,255,0.4))">
            <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px">
                <div>
                    <div style="font-size:9px;font-weight:800;color:#6366f1;text-transform:uppercase;letter-spacing:0.12em;font-family:'DM Mono',monospace;margin-bottom:6px">Detaylı rapor & PDF</div>
                    <div style="font-size:15px;font-weight:800;color:var(--text)">Kalem tabloları, operasyon günlüğü, profesyonel PDF</div>
                    <div style="font-size:10px;color:var(--text3);margin-top:4px;max-width:560px;line-height:1.45">Özet kartların ötesinde her siparişin dokuma–kesim–dikim–sevk detayını görün; tek tıkla yazdırılabilir PDF alın.</div>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
                    <button type="button" onclick="raporIzlemePdfPreset('ozet')" class="btn-pro btn-ghost-pro" style="padding:7px 12px;font-size:10px;font-weight:700" title="Yalnızca özet tablo ve ilerleme">Özet çıktı</button>
                    <button type="button" onclick="raporIzlemePdfPreset('detayli')" class="btn-pro btn-ghost-pro" style="padding:7px 12px;font-size:10px;font-weight:700" title="Tüm bölümler açık">Detaylı çıktı</button>
                    <button type="button" onclick="raporIzlemeDetayRaporuHazirla(true)" class="btn-pro btn-primary-pro" style="padding:8px 16px;font-size:10px;font-weight:800">📋 Raporu hazırla</button>
                    <button type="button" id="rapor-izleme-pdf-btn" onclick="raporIzlemeDetayPdfIndir()" disabled class="btn-pro btn-ghost-pro" style="padding:8px 16px;font-size:10px;font-weight:800;border:1px solid rgba(99,102,241,0.4);color:#6366f1">📄 PDF indir</button>
                </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:12px;padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--surface)">
                <span style="font-size:9px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;font-family:'DM Mono',monospace;margin-right:4px">PDF içeriği:</span>
                <label style="display:flex;align-items:center;gap:5px;font-size:10px;color:var(--text2);cursor:pointer;padding:4px 8px;border-radius:6px;border:1px solid var(--border2)">
                    <input type="checkbox" id="rapor-izleme-pdf-ozet" checked onchange="raporIzlemePdfOnizlemeYenile()" style="accent-color:#6366f1"> Genel özet tablosu
                </label>
                <label style="display:flex;align-items:center;gap:5px;font-size:10px;color:var(--text2);cursor:pointer;padding:4px 8px;border-radius:6px;border:1px solid var(--border2)">
                    <input type="checkbox" id="rapor-izleme-pdf-siparis" checked onchange="raporIzlemePdfOnizlemeYenile()" style="accent-color:#6366f1"> Sipariş ilerleme sayfaları
                </label>
                <label style="display:flex;align-items:center;gap:5px;font-size:10px;color:var(--text2);cursor:pointer;padding:4px 8px;border-radius:6px;border:1px solid var(--border2)">
                    <input type="checkbox" id="rapor-izleme-pdf-kalem" onchange="raporIzlemePdfOnizlemeYenile()" style="accent-color:#6366f1"> Kalem detay tabloları
                </label>
                <label style="display:flex;align-items:center;gap:5px;font-size:10px;color:var(--text2);cursor:pointer;padding:4px 8px;border-radius:6px;border:1px solid var(--border2)">
                    <input type="checkbox" id="rapor-izleme-ops-dahil" onchange="raporIzlemePdfOnizlemeYenile()" style="accent-color:#6366f1"> Operasyon günlüğü
                </label>
                <span id="rapor-izleme-pdf-secim-ozet" style="font-size:9px;color:var(--text3);font-family:'DM Mono',monospace;margin-left:auto"></span>
            </div>
            <div id="rapor-izleme-detay-onizleme">
                <div class="panel-box" style="padding:28px 20px;text-align:center;border:1px dashed var(--border2);background:var(--surface)">
                    <div style="font-size:32px;margin-bottom:8px;opacity:0.8">📑</div>
                    <div style="font-size:12px;font-weight:700;color:var(--text2)">Detay raporu henüz hazırlanmadı</div>
                    <div style="font-size:10px;color:var(--text3);margin-top:6px">«Detaylı raporu hazırla» ile ${raporIzlemeIds.length} siparişin tam verisini yükleyin.</div>
                </div>
            </div>
        </div>` : ''}
    </div>`;
}
async function raporIzlemePaneleYukle(zorla) {
    if (raporTab !== 'SIPARIS_IZLEME') return;
    const root = document.getElementById('rapor-izleme-kartlar');
    if (!root) return;
    if (!raporIzlemeIds.length) return;
    if (!zorla && root.querySelector('[id^="rapor-izleme-kart-"]')) return;
    root.innerHTML = '<div class="panel-box" style="padding:32px;text-align:center;color:var(--text3)"><div style="font-size:28px;margin-bottom:8px">⏳</div>Durumlar yükleniyor…</div>';
    const gecerliIds = raporIzlemeIds.filter(id => (dataCache.siparisler || []).some(s => String(s.id) === String(id)));
    if (gecerliIds.length !== raporIzlemeIds.length) {
        raporIzlemeIds = gecerliIds;
        raporIzlemeListeKaydet();
    }
    const kartlar = [];
    for (const id of raporIzlemeIds) {
        const siparis = (dataCache.siparisler || []).find(s => String(s.id) === String(id));
        if (!siparis) continue;
        try {
            await sbKdGet(siparis.id, 'KD_KONFEKSIYON', true);
            await sbKdGet(siparis.id, 'KD_DOKUMA', true);
            const kdK = _kdCache[`KD_KONFEKSIYON_${siparis.id}`] || {};
            const kdD = _kdCache[`KD_DOKUMA_${siparis.id}`] || {};
            const agg = raporTekAggregateFromKd(siparis, kdK, kdD);
            raporIzlemeAggCache[String(siparis.id)] = agg;
            kartlar.push(raporIzlemeKartHtml(siparis, agg));
        } catch (e) {
            kartlar.push(`<div class="panel-box" style="padding:16px;border-color:rgba(251,113,133,0.35)"><div style="font-weight:700">${pdfEsc(siparis.sno || id)}</div><div style="font-size:11px;color:var(--rose-c);margin-top:6px">Yüklenemedi: ${pdfEsc(e?.message || String(e))}</div></div>`);
        }
    }
    root.innerHTML = kartlar.length
        ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px">${kartlar.join('')}</div>`
        : `<div class="panel-box" style="padding:24px;text-align:center;color:var(--text3)">Listedeki siparişler bulunamadı. Senkronize edip tekrar deneyin.</div>`;
}

function raporIzlemePdfBarSatir(etiket, cur, tgt, renk) {
    const pct = raporTekOranYuzde(cur, tgt);
    const fmt = (n) => (Number(n) || 0).toLocaleString('tr-TR');
    return `<div style="margin-bottom:6px">
        <div style="display:flex;justify-content:space-between;font-size:8px;font-weight:700;color:#475467;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px">
            <span>${pdfEsc(etiket)}</span><span style="font-family:Consolas,monospace">${fmt(cur)} / ${fmt(tgt)} · %${pct}</span>
        </div>
        <div style="height:5px;border-radius:999px;background:#e8ecf2;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${renk};border-radius:999px"></div>
        </div>
    </div>`;
}
function raporIzlemeKalemPdfTablo(siparis, kdK, kdD) {
    const kalemler = uaSiparisKalemleriGetir(siparis);
    const urunler = (kdD && kdD.urunler) ? kdD.urunler : {};
    const th = 'padding:6px 4px;border:1px solid #d9dee9;background:#f4f6fb;font-size:7px;font-weight:700;text-transform:uppercase;text-align:center;color:#475467;line-height:1.2';
    const td = 'padding:5px 4px;border:1px solid #e5e9f2;font-size:9px;text-align:center;font-family:Consolas,monospace;color:#1f2937';
    const fmtI = (n) => { const x = parseInt(n, 10); return Number.isFinite(x) && x !== 0 ? x.toLocaleString('tr-TR') : '—'; };
    const fmtN = (n) => { const x = parseFloat(n); return Number.isFinite(x) && x !== 0 ? x.toLocaleString('tr-TR', { maximumFractionDigits: 1 }) : '—'; };
    if (!kalemler.length) return '<div style="font-size:10px;color:#667085;padding:10px">Kalem satırı yok.</div>';
    const satirlar = kalemler.map((k, i) => {
        const u = urunler[i] || {};
        const row = (kdK && kdK[`kalem_${i}`]) ? kdK[`kalem_${i}`] : {};
        const ad = pdfEsc(k.ad || k.kod || ('Kalem ' + (i + 1)));
        const renkEbat = pdfEsc([k.renk, k.ebat].filter(Boolean).join(' · '));
        const fire = (parseInt(row.fire_kesim, 10) || 0) + (parseInt(row.fire_dikim, 10) || 0) + (parseInt(row.iki_kalite, 10) || 0);
        return `<tr>
            <td style="${td}">${i + 1}</td>
            <td style="${td};text-align:left;font-family:'Segoe UI',sans-serif"><div style="font-weight:600">${ad}</div>${renkEbat ? `<div style="font-size:7px;color:#6366f1;margin-top:1px">${renkEbat}</div>` : ''}</td>
            <td style="${td}">${fmtI(k.miktar)}</td>
            <td style="${td};color:#0891b2">${fmtN(u.toplam_metre)}</td>
            <td style="${td};color:#6366f1">${fmtN(u.toplam_kg)}</td>
            <td style="${td};color:#059669">${fmtI(u.toplam_adet)}</td>
            <td style="${td};color:#6366f1">${fmtI(row.kesilen)}</td>
            <td style="${td};color:#f43f5e">${fmtI(row.dikilen)}</td>
            <td style="${td};color:#d97706">${fmtI(row.kk_gecen)}</td>
            <td style="${td};color:#059669">${fmtI(row.kolide)}</td>
            <td style="${td};color:#7c3aed;font-weight:700">${fmtI(row.sevk_edilen)}</td>
            <td style="${td};font-size:8px">${fire ? fire.toLocaleString('tr-TR') : '—'}</td>
        </tr>`;
    }).join('');
    return `<table style="width:100%;border-collapse:collapse;margin-top:8px">
        <thead><tr>
            <th style="${th}">#</th><th style="${th};text-align:left">Ürün</th><th style="${th}">Sip</th>
            <th style="${th};color:#0891b2">Dok m</th><th style="${th};color:#6366f1">Dok kg</th><th style="${th};color:#059669">Dok ad</th>
            <th style="${th};color:#6366f1">Kes</th><th style="${th};color:#f43f5e">Dik</th><th style="${th};color:#d97706">Kal</th>
            <th style="${th};color:#059669">Kol</th><th style="${th};color:#7c3aed">Sevk</th><th style="${th}">Fire</th>
        </tr></thead>
        <tbody>${satirlar}</tbody>
    </table>`;
}
function raporIzlemeOpsLogPdfTablo(rows, limit) {
    const lim = limit || 25;
    const list = (rows || []).slice().sort((a, b) => {
        const da = konfParseFlexibleDate(a.ts || a.created_at);
        const db = konfParseFlexibleDate(b.ts || b.created_at);
        return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
    }).slice(0, lim);
    const th = 'padding:6px 8px;border:1px solid #d9dee9;background:#f4f6fb;font-size:8px;font-weight:700;text-transform:uppercase;text-align:left;color:#475467';
    const td = 'padding:6px 8px;border:1px solid #e5e9f2;font-size:9px;color:#1f2937;vertical-align:top';
    if (!list.length) return '';
    const satirlar = list.map(r => {
        const dt = konfParseFlexibleDate(r.ts || r.created_at);
        const dtTxt = dt ? dt.toLocaleString('tr-TR') : String(r.ts || '—');
        return `<tr>
            <td style="${td};font-family:Consolas,monospace;white-space:nowrap">${pdfEsc(dtTxt)}</td>
            <td style="${td}"><span style="display:inline-block;padding:2px 6px;border-radius:4px;background:#eef2ff;color:#4338ca;font-size:8px;font-weight:700">${pdfEsc(r.islem || '—')}</span></td>
            <td style="${td}">${pdfEsc(r.kalem_ad || '—')}</td>
            <td style="${td};text-align:right;font-family:Consolas,monospace;font-weight:600">${(parseFloat(r.miktar) || 0).toLocaleString('tr-TR')}</td>
            <td style="${td};color:#667085">${pdfEsc(r.kullanici || '—')}</td>
        </tr>`;
    }).join('');
    return `<div style="margin-top:10px">
        <div style="font-size:9px;font-weight:800;color:#475467;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Operasyon günlüğü (son ${list.length} kayıt)</div>
        <table style="width:100%;border-collapse:collapse">
            <thead><tr><th style="${th}">Zaman</th><th style="${th}">İşlem</th><th style="${th}">Kalem</th><th style="${th};text-align:right">Miktar</th><th style="${th}">Kullanıcı</th></tr></thead>
            <tbody>${satirlar}</tbody>
        </table>
    </div>`;
}
function raporIzlemeOzetTabloPdf(paketler) {
    const th = 'padding:7px 6px;border:1px solid #d9dee9;background:#f4f6fb;font-size:8px;font-weight:700;text-transform:uppercase;text-align:center;color:#475467';
    const td = 'padding:6px;border:1px solid #e5e9f2;font-size:9px;text-align:center;font-family:Consolas,monospace';
    const satirlar = paketler.map(p => {
        const s = p.siparis;
        const a = p.agg;
        const tgt = a.sipAdet || 1;
        const tt = s.ttarih ? new Date(s.ttarih).toLocaleDateString('tr-TR') : '—';
        const yik = (a.ySevk || 0) + (a.yGel || 0);
        return `<tr>
            <td style="${td};text-align:left;font-weight:700;font-family:'Segoe UI',sans-serif">${pdfEsc(s.sno || '—')}</td>
            <td style="${td};text-align:left;font-family:'Segoe UI',sans-serif;max-width:120px">${pdfEsc(s.firma || '—')}</td>
            <td style="${td}">${pdfEsc(tt)}</td>
            <td style="${td};color:#0891b2">%${raporTekOranYuzde(a.dokAdet, tgt)}</td>
            <td style="${td};color:#6366f1">%${raporTekOranYuzde(a.kes, tgt)}</td>
            <td style="${td};color:#38bdf8">%${raporTekOranYuzde(yik, Math.max(tgt, 1))}</td>
            <td style="${td};color:#f43f5e">%${raporTekOranYuzde(a.dik, tgt)}</td>
            <td style="${td};color:#d97706">%${raporTekOranYuzde(a.kk, tgt)}</td>
            <td style="${td};color:#059669">%${raporTekOranYuzde(a.kol, tgt)}</td>
            <td style="${td};color:#7c3aed;font-weight:700">%${raporTekOranYuzde(a.sevk, tgt)}</td>
        </tr>`;
    }).join('');
    return `<div style="margin-bottom:14px">
        <div style="font-size:11px;font-weight:800;color:#1f2937;margin-bottom:8px">Genel özet — ${paketler.length} sipariş</div>
        <table style="width:100%;border-collapse:collapse">
            <thead><tr>
                <th style="${th};text-align:left">Sipariş</th><th style="${th};text-align:left">Firma</th><th style="${th}">Termin</th>
                <th style="${th};color:#0891b2">Dok</th><th style="${th};color:#6366f1">Kes</th><th style="${th};color:#38bdf8">Yık</th>
                <th style="${th};color:#f43f5e">Dik</th><th style="${th};color:#d97706">Kal</th><th style="${th};color:#059669">Kol</th><th style="${th};color:#7c3aed">Sevk</th>
            </tr></thead>
            <tbody>${satirlar}</tbody>
        </table>
    </div>`;
}
function raporIzlemePdfSecenekleriOku() {
    return {
        showOzetTablo: document.getElementById('rapor-izleme-pdf-ozet')?.checked !== false,
        showSiparisSayfalari: document.getElementById('rapor-izleme-pdf-siparis')?.checked !== false,
        showKalemTablo: document.getElementById('rapor-izleme-pdf-kalem')?.checked === true,
        showOpsLog: document.getElementById('rapor-izleme-ops-dahil')?.checked === true,
        opsLimit: 30,
    };
}
function raporIzlemePdfSecimOzetGuncelle() {
    const o = raporIzlemePdfSecenekleriOku();
    const el = document.getElementById('rapor-izleme-pdf-secim-ozet');
    if (!el) return;
    const parcalar = [];
    if (o.showOzetTablo) parcalar.push('özet tablo');
    if (o.showSiparisSayfalari) parcalar.push('ilerleme');
    if (o.showKalemTablo) parcalar.push('kalem');
    if (o.showOpsLog) parcalar.push('ops günlüğü');
    el.textContent = parcalar.length ? `Çıktı: ${parcalar.join(' + ')}` : 'En az bir bölüm seçin';
}
function raporIzlemePdfPreset(tip) {
    const ozet = document.getElementById('rapor-izleme-pdf-ozet');
    const siparis = document.getElementById('rapor-izleme-pdf-siparis');
    const kalem = document.getElementById('rapor-izleme-pdf-kalem');
    const ops = document.getElementById('rapor-izleme-ops-dahil');
    if (tip === 'ozet') {
        if (ozet) ozet.checked = true;
        if (siparis) siparis.checked = true;
        if (kalem) kalem.checked = false;
        if (ops) ops.checked = false;
    } else {
        if (ozet) ozet.checked = true;
        if (siparis) siparis.checked = true;
        if (kalem) kalem.checked = true;
        if (ops) ops.checked = true;
    }
    raporIzlemePdfOnizlemeYenile();
}
function raporIzlemePdfOnizlemeYenile() {
    raporIzlemePdfSecimOzetGuncelle();
    if (!raporIzlemeDetayCache?.paketler?.length) return;
    const root = document.getElementById('rapor-izleme-detay-onizleme');
    if (!root) return;
    root.innerHTML = raporIzlemeDetayOnizlemeHtml(raporIzlemeDetayCache.paketler, raporIzlemePdfSecenekleriOku());
}
function raporIzlemeSiparisPdfBlok(paket, sira, opts) {
    const o = opts || {};
    const s = paket.siparis;
    const a = paket.agg;
    const tgt = a.sipAdet || 1;
    const yik = (a.ySevk || 0) + (a.yGel || 0);
    const tt = s.ttarih ? new Date(s.ttarih).toLocaleDateString('tr-TR') : '—';
    const gun = s.ttarih ? Math.ceil((new Date(s.ttarih) - new Date()) / 86400000) : null;
    const terminTxt = gun == null ? '' : gun < 0 ? `${Math.abs(gun)} gün gecikme` : gun === 0 ? 'Termin bugün' : `${gun} gün kaldı`;
    const durRenk = s.durum === 'TAMAMLANDI' ? '#059669' : (gun != null && gun < 0) ? '#e11d48' : '#6366f1';
    const bars = [
        ['Dokuma', a.dokAdet, tgt, '#22d3ee'],
        ['Kesim', a.kes, tgt, '#818cf8'],
        ['Yıkama', yik, Math.max(tgt, 1), '#38bdf8'],
        ['Dikim', a.dik, tgt, '#fb7185'],
        ['Kalite', a.kk, tgt, '#fbbf24'],
        ['Koli', a.kol, tgt, '#34d399'],
        ['Sevk', a.sevk, tgt, '#a78bfa'],
    ].map(([e, c, t, r]) => raporIzlemePdfBarSatir(e, c, t, r)).join('');
    const kalemHtml = o.showKalemTablo ? `
                <div>
                    <div style="font-size:8px;font-weight:800;color:#6366f1;text-transform:uppercase;margin-bottom:6px">Kalem bazlı detay</div>
                    ${raporIzlemeKalemPdfTablo(s, paket.kdK, paket.kdD)}
                </div>` : '';
    const opsHtml = o.showOpsLog ? raporIzlemeOpsLogPdfTablo(paket.rows, o.opsLimit || 25) : '';
    const gridCols = kalemHtml ? '1fr 1fr' : '1fr';
    return `<div style="page-break-before:${sira > 0 ? 'always' : 'auto'};margin-top:${sira > 0 ? '4px' : '0'}">
        <div style="border:1px solid #d9dee9;border-radius:10px;overflow:hidden;margin-bottom:12px">
            <div style="padding:12px 14px;background:linear-gradient(90deg,#fff5f7,#f8fafc);border-bottom:1px solid #e5e9f2;display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
                <div>
                    <div style="font-size:8px;font-weight:800;color:#e11d48;text-transform:uppercase;letter-spacing:.1em">Sipariş ${sira + 1}</div>
                    <div style="font-size:20px;font-weight:700;color:#111827;margin-top:2px">${pdfEsc(s.sno || '—')}</div>
                    <div style="font-size:11px;font-weight:600;color:#475467;margin-top:2px">${pdfEsc(s.firma || '—')}</div>
                </div>
                <div style="text-align:right">
                    <span style="display:inline-block;padding:3px 8px;border-radius:999px;background:${durRenk}18;color:${durRenk};font-size:9px;font-weight:800">${pdfEsc(s.durum || 'BEKLEMEDE')}</span>
                    <div style="font-size:9px;color:#667085;margin-top:6px;font-family:Consolas,monospace">Termin: ${pdfEsc(tt)}</div>
                    ${terminTxt ? `<div style="font-size:9px;color:#d97706;font-weight:700;margin-top:2px">${pdfEsc(terminTxt)}</div>` : ''}
                </div>
            </div>
            <div style="padding:12px 14px;display:grid;grid-template-columns:${gridCols};gap:12px">
                <div>
                    <div style="font-size:8px;font-weight:800;color:#6366f1;text-transform:uppercase;margin-bottom:8px">Üretim ilerlemesi</div>
                    ${bars}
                    <div style="font-size:8px;color:#667085;margin-top:6px;font-family:Consolas,monospace">
                        Dokuma: ${(a.dokM || 0).toFixed(1)} m · ${(a.dokKg || 0).toFixed(1)} kg · Hatalı: ${(a.hatali || 0).toLocaleString('tr-TR')}
                    </div>
                </div>
                ${kalemHtml}
            </div>
            ${opsHtml ? `<div style="padding:0 14px 12px;border-top:1px solid #e5e9f2">${opsHtml}</div>` : ''}
        </div>
    </div>`;
}
function raporIzlemeDetayPdfBodyHtml(paketler, opts) {
    const o = opts || {};
    let html = '';
    if (o.showOzetTablo !== false) html += raporIzlemeOzetTabloPdf(paketler);
    if (o.showSiparisSayfalari !== false) html += paketler.map((p, i) => raporIzlemeSiparisPdfBlok(p, i, o)).join('');
    if (!html) html = '<div style="padding:20px;color:#667085;font-size:11px">Çıktı için en az bir bölüm seçin (genel özet veya sipariş sayfaları).</div>';
    return `<div id="rapor-izleme-pdf-body">${html}</div>`;
}
function raporIzlemeDetayOnizlemeHtml(paketler, opts) {
    const o = opts || raporIzlemePdfSecenekleriOku();
    const modEtiket = [o.showKalemTablo && 'kalem', o.showOpsLog && 'ops'].filter(Boolean).join(' + ') || 'yalnız özet';
    const ozetKartlar = o.showSiparisSayfalari !== false ? paketler.map((p, i) => {
        const s = p.siparis;
        const a = p.agg;
        const tgt = a.sipAdet || 1;
        const yik = (a.ySevk || 0) + (a.yGel || 0);
        const tt = s.ttarih ? new Date(s.ttarih).toLocaleDateString('tr-TR') : '—';
        const bars = [
            ['Dokuma', a.dokAdet, tgt, '#22d3ee'],
            ['Kesim', a.kes, tgt, '#818cf8'],
            ['Yıkama', yik, Math.max(tgt, 1), '#38bdf8'],
            ['Dikim', a.dik, tgt, '#fb7185'],
            ['Kalite', a.kk, tgt, '#fbbf24'],
            ['Koli', a.kol, tgt, '#34d399'],
            ['Sevk', a.sevk, tgt, '#a78bfa'],
        ].map(([e, c, t, r]) => raporIzlemeIlerlemeSatir(e, c, t, r)).join('');
        const detayBlok = (o.showKalemTablo || o.showOpsLog)
            ? buildSiparisDurumIncelemeHtml(s, p.kdK, p.kdD, p.rows, p.allUa, { showOpsLog: o.showOpsLog, showKalemTablo: o.showKalemTablo })
            : `<div style="font-size:10px;color:var(--text3);padding:8px 0;font-style:italic">Kalem ve operasyon detayı bu çıktıda kapalı — PDF seçeneklerinden açabilirsiniz.</div>`;
        return `<details class="rapor-izleme-detay-sip" ${i === 0 ? 'open' : ''} style="border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface)">
            <summary style="padding:14px 16px;cursor:pointer;list-style:none;background:linear-gradient(90deg,rgba(225,29,72,0.06),transparent);border-bottom:1px solid var(--border)">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
                    <div>
                        <span style="font-family:'DM Mono',monospace;font-size:11px;font-weight:800;color:var(--text)">${pdfEsc(s.sno || '—')}</span>
                        <span style="font-size:10px;color:var(--text3);margin-left:8px">${pdfEsc(s.firma || '—')}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                        <span style="font-size:9px;color:var(--text3);font-family:'DM Mono',monospace">${pdfEsc(tt)}</span>
                        <span class="pill pill-blue" style="font-size:8px">Sevk %${raporTekOranYuzde(a.sevk, tgt)}</span>
                        <span style="font-size:14px;color:var(--text3)">▾</span>
                    </div>
                </div>
            </summary>
            <div style="padding:14px 16px">
                <div style="font-size:9px;font-weight:800;color:var(--accent2);text-transform:uppercase;letter-spacing:.08em;font-family:'DM Mono',monospace;margin-bottom:10px">Aşama ilerlemesi</div>
                <div style="max-width:520px;margin-bottom:16px">${bars}</div>
                ${(o.showKalemTablo || o.showOpsLog) ? `<div style="font-size:9px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;font-family:'DM Mono',monospace;margin-bottom:8px">Ek detaylar</div>${detayBlok}` : ''}
            </div>
        </details>`;
    }).join('') : '';
    const ozetTabloOnizleme = o.showOzetTablo !== false
        ? `<div class="panel-box" style="padding:12px;overflow-x:auto;margin-bottom:4px">${raporIzlemeOzetTabloPdf(paketler)}</div>`
        : '';
    return `<div id="rapor-izleme-detay-rapor-root" style="display:flex;flex-direction:column;gap:10px">
        <div class="panel-box" style="padding:12px 14px;background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(255,255,255,0.5));border:1px solid rgba(99,102,241,0.25)">
            <div style="font-size:10px;font-weight:800;color:var(--accent2);font-family:'DM Mono',monospace">${paketler.length} sipariş · önizleme: ${pdfEsc(modEtiket)}</div>
            <div style="font-size:9px;color:var(--text3);margin-top:4px">PDF seçeneklerini değiştirdiğinizde önizleme anında güncellenir. «Özet çıktı» veya «Detaylı çıktı» ile hızlı seçim yapabilirsiniz.</div>
        </div>
        ${ozetTabloOnizleme}
        ${ozetKartlar || (o.showSiparisSayfalari === false ? '<div style="font-size:10px;color:var(--text3);padding:8px">Sipariş sayfaları kapalı — yalnızca genel özet tablosu PDF\'e gider.</div>' : '')}
    </div>`;
}
async function raporIzlemeDetayVeriYukle(onProgress) {
    const paketler = [];
    const toplam = raporIzlemeIds.length;
    for (let i = 0; i < toplam; i++) {
        const id = raporIzlemeIds[i];
        if (onProgress) onProgress(i + 1, toplam, id);
        const siparis = (dataCache.siparisler || []).find(s => String(s.id) === String(id));
        if (!siparis) continue;
        await sbKdGet(siparis.id, 'KD_KONFEKSIYON', true);
        await sbKdGet(siparis.id, 'KD_DOKUMA', true);
        await sbKdGet(siparis.id, 'KD_URUN_AGACI', true);
        await sbKdGet(siparis.id, 'KD_FASON_TAKIP', true);
        await konfLoadIslemLog(siparis.id);
        const kdK0 = _kdCache[`KD_KONFEKSIYON_${siparis.id}`] || {};
        const kdFason = _kdCache[`KD_FASON_TAKIP_${siparis.id}`] || {};
        const kdK = fasonTakipKdKonfBirlestir(siparis.id, kdK0, kdFason);
        const kdD = _kdCache[`KD_DOKUMA_${siparis.id}`] || {};
        const rows = _konfIslemLogCache[siparis.id] || [];
        const allUa = _kdCache[`KD_URUN_AGACI_${siparis.id}`] || {};
        const agg = raporTekAggregateFromKd(siparis, kdK, kdD);
        raporIzlemeAggCache[String(siparis.id)] = agg;
        paketler.push({ siparis, agg, kdK, kdD, rows, allUa });
    }
    return paketler;
}
async function raporIzlemeDetayRaporuHazirla(zorla) {
    if (!raporIzlemeIds.length) { erpToast('Önce izleme listesine sipariş ekleyin.', 'warn'); return; }
    const root = document.getElementById('rapor-izleme-detay-onizleme');
    if (!root) return;
    if (!zorla && raporIzlemeDetayCache && raporIzlemeDetayCache.paketler && raporIzlemeDetayCache.paketler.length === raporIzlemeIds.length) {
        root.innerHTML = raporIzlemeDetayOnizlemeHtml(raporIzlemeDetayCache.paketler, raporIzlemePdfSecenekleriOku());
        raporIzlemePdfSecimOzetGuncelle();
        const pdfBtn = document.getElementById('rapor-izleme-pdf-btn');
        if (pdfBtn) pdfBtn.disabled = false;
        return;
    }
    root.innerHTML = '<div class="panel-box" style="padding:32px;text-align:center;color:var(--text3)"><div style="font-size:28px;margin-bottom:8px">⏳</div><div id="rapor-izleme-detay-progress">Detaylı veriler yükleniyor…</div></div>';
    const pdfBtn = document.getElementById('rapor-izleme-pdf-btn');
    if (pdfBtn) pdfBtn.disabled = true;
    try {
        const paketler = await raporIzlemeDetayVeriYukle((cur, tot, id) => {
            const el = document.getElementById('rapor-izleme-detay-progress');
            const sip = (dataCache.siparisler || []).find(s => String(s.id) === String(id));
            if (el) el.textContent = `${cur} / ${tot} sipariş yükleniyor… ${sip ? (sip.sno || '') : ''}`;
        });
        if (!paketler.length) {
            root.innerHTML = '<div class="panel-box" style="padding:24px;text-align:center;color:var(--rose-c)">Sipariş verisi yüklenemedi.</div>';
            return;
        }
        raporIzlemeDetayCache = { tarih: new Date(), paketler };
        root.innerHTML = raporIzlemeDetayOnizlemeHtml(paketler, raporIzlemePdfSecenekleriOku());
        raporIzlemePdfSecimOzetGuncelle();
        if (pdfBtn) pdfBtn.disabled = false;
        erpToast(`${paketler.length} sipariş için rapor hazır — çıktı seçeneklerini ayarlayıp PDF alın.`, 'success');
        const kartRoot = document.getElementById('rapor-izleme-kartlar');
        if (kartRoot && kartRoot.querySelector('[id^="rapor-izleme-kart-"]')) {
            /* özet kartlar zaten yüklü */
        } else if (kartRoot) {
            raporIzlemePaneleYukle(true);
        }
    } catch (e) {
        root.innerHTML = `<div class="panel-box" style="padding:20px;border:1px solid rgba(251,113,133,0.4);color:var(--rose-c)">Yükleme hatası: ${pdfEsc(e?.message || String(e))}</div>`;
    }
}
async function raporIzlemeDetayPdfIndir() {
    try { await erpEnsureHtml2Pdf(); } catch (e) {}
    if (typeof html2pdf === 'undefined') { alert('PDF kütüphanesi yüklü değil.'); return; }
    if (!raporIzlemeDetayCache?.paketler?.length) {
        erpToast('Önce «Detaylı raporu hazırla» ile verileri yükleyin.', 'warn');
        return;
    }
    const opts = raporIzlemePdfSecenekleriOku();
    if (!opts.showOzetTablo && !opts.showSiparisSayfalari) {
        erpToast('PDF için en az «Genel özet tablosu» veya «Sipariş ilerleme sayfaları» seçin.', 'warn');
        return;
    }
    const bodyHtml = raporIzlemeDetayPdfBodyHtml(raporIzlemeDetayCache.paketler, opts);
    const tarih = new Date().toLocaleDateString('tr-TR').replace(/[^\d]/g, '');
    const mod = opts.showKalemTablo ? (opts.showOpsLog ? 'detayli' : 'kalem') : (opts.showOpsLog ? 'ops' : 'ozet');
    const shell = buildPdfShellElement({
        title: 'SİPARİŞ İZLEME RAPORU',
        subtitle: `${raporIzlemeDetayCache.paketler.length} sipariş · ${mod} çıktı`,
        docNo: `IZL-${tarih}-${raporIzlemeDetayCache.paketler.length}`,
        bodyHtml,
        note: 'İzleme panelinde seçilen siparişler için otomatik üretilmiştir. İçerik, PDF seçeneklerine göre oluşturulmuştur.',
    });
    html2pdf().set({
        margin: [0, 0],
        filename: `siparis_izleme_${mod}_${raporIzlemeDetayCache.paketler.length}sip_${tarih}.pdf`,
        image: { type: 'jpeg', quality: 0.94 },
        html2canvas: { scale: 1.4, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    }).from(shell).save();
    erpToast('PDF indiriliyor…', 'success');
}

// ── 2. FİRE & KAYIP ───────────────────────────────────────
// ── 3. STOK DURUMU ────────────────────────────────────────
// ── 5. TERMİN PERFORMANSI ─────────────────────────────────
// ── 6. İPLİK STOK & HAREKETLERİ ──────────────────────────
// ── 7. KUMAŞ STOK & HAREKETLERİ ───────────────────────────
// ── 8. DOKUMA RAPORU ──────────────────────────────────────
// ── 9. KONFEKSİYON RAPORU ─────────────────────────────────
// ── CHART'LAR ─────────────────────────────────────────────
// ── EXPORT FONKSİYONLARI ──────────────────────────────────
async function konfSiparisDetayPdf() {
    try { await erpEnsureHtml2Pdf(); } catch (e) {}
    if (typeof html2pdf === 'undefined') { alert('PDF kütüphanesi yüklü değil.'); return; }
    if (!konfeksiyonSiparisId) { alert('Önce Konfeksiyon ekranında bir sipariş seçin.'); return; }
    const sip = (dataCache.siparisler || []).find(s => String(s.id) === String(konfeksiyonSiparisId));
    if (!sip) { alert('Sipariş bulunamadı.'); return; }

    const sno = String(sip.sno || sip.id || 'siparis').trim();
    const firma = String(sip.firma || '').trim();

    // UA-endeksli detay icin gerekli cache'leri guncelle (Konfeksiyon'daki canli veriye gore)
    try {
        await sbKdGet(sip.id, 'KD_KONFEKSIYON', true);
        await sbKdGet(sip.id, 'KD_DOKUMA', true);
        await sbKdGet(sip.id, 'KD_URUN_AGACI', true);
        await konfLoadIslemLog(sip.id);
    } catch (e) {}
    const kdK = _kdCache[`KD_KONFEKSIYON_${sip.id}`] || {};
    const kdD = _kdCache[`KD_DOKUMA_${sip.id}`] || {};
    const rows = _konfIslemLogCache[sip.id] || [];
    const allUa = _kdCache[`KD_URUN_AGACI_${sip.id}`] || {};

    // buildSiparisDurumIncelemeHtml CSS değişkenleri kullanıyor; PDF kabuğunda okunaklı olması için temel theme değişkenleri veriyoruz.
    const themeVars = `
        --text:#111827;--text2:#334155;--text3:#64748b;
        --border:#d9dee9;--surface:#ffffff;--surface2:#f8fafc;
        --accent:#4f46e5;--accent2:#3b82f6;--emerald-c:#10b981;--rose-c:#fb7185;--amber-c:#fbbf24;
    `;
    const innerHtml = buildSiparisDurumIncelemeHtml(sip, kdK, kdD, rows, allUa, { showOpsLog: false });
    const bodyHtml = `
        <div style="margin-top:8px;${themeVars}">
            <style>
              /* PDF export: ekrandaki scroll / max-height kisitlarini iptal et */
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              .panel-box, .panel-head, .dt-table, table { break-inside: avoid; page-break-inside: avoid; }
              .siparis-kalem-scroll,
              .modal-body-scroll,
              #modal-body,
              [style*="max-height"],
              [style*="overflow:auto"],
              [style*="overflow: auto"] {
                max-height: none !important;
                overflow: visible !important;
              }
            </style>
            ${innerHtml}
        </div>
    `;

    const shell = buildPdfShellElement({
        title: 'SİPARİŞ DETAY',
        subtitle: firma ? `${sno} · ${firma}` : sno,
        docNo: `SPD-${new Date().getTime()}`,
        bodyHtml,
        note: 'Bu doküman Konfeksiyon ekranından oluşturulmuştur.'
    });

    html2pdf().set({
        margin: [0, 0],
        filename: `siparis_detay_${sno.replace(/[^\w\-]+/g, '_').slice(0, 40)}_${new Date().toLocaleDateString('tr-TR')}.pdf`,
        image: { type: 'jpeg', quality: 0.96 },
        html2canvas: { scale: 1.15, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    }).from(shell).save();
}

// ════════════════════════════════════════════════════════
//  ÜRÜN AĞACI MODÜLÜ
// ════════════════════════════════════════════════════════

  // hangi kalem (beden/renk) düzenleniyor
 // URUN | SIPARIS
/** Aşama önkoşulu yok — seçilen basamaklar serbest, kayıtı engellemez. */
/** Simteks konfeksiyon / Fason konfeksiyon / Doğrudan sevk — eski SIMTEKS, FASON değerlerini taşır */
/** Ürün ağacı kaydında tek alan güncellenirken önceki veriyi silmemek için derin birleştirme (düz nesneler; diziler tamamen patch ile değişir). */
/** Düzenleme sırasında canlı senkronun ürün ağacı seçimlerini silmesini engeller. */
const _uaKdDirty = {};
const _uaKdHydrated = {};
function uaMarkKdDirty(siparisId) {
    const sid = String(siparisId || '');
    if (!sid) return;
    _uaKdDirty[sid] = true;
}
function uaClearKdDirty(siparisId) {
    const sid = String(siparisId || '');
    delete _uaKdDirty[sid];
}
function uaIsKdDirty(siparisId) {
    return !!_uaKdDirty[String(siparisId || '')];
}

/**
 * Ürün ağacı düzenlemesi: sadece yerel cache.
 * Sunucuya yazma yalnızca uaKaydet (ve sıfırlama) ile yapılır.
 */
// ── YARDIMCI FONKSİYONLAR ──
/** Seçili aşamalar dizisinde sıra değiştir (delta: -1 yukarı, +1 aşağı) */
if (!window.__uaPastalBound) {
    window.__uaPastalBound = true;
    document.addEventListener('mousemove', uaPastalDragMove);
    document.addEventListener('mouseup', uaPastalDragEnd);
}

// ── Fason Takip (ürün ağacında FASON_KONF — sipariş bazlı malzeme takibi) ──
/** Hedefe göre: >= hedef yeşil, ~%85+ sarı, altı kırmızı; hedef yoksa nötr */
// ── DOKUMA FASON — kendi başına, ayrı tabloda dokuma sipariş kayıtları ──
// Müşteri siparişinin (`siparisler` tablosu) kalemlerine hiç dokunmaz — ayrı
// bir tabloda (dokuma_fason_siparisleri) yaşar, bu yüzden hiçbir sipariş
// listesini/picker'ını etkilemez. Bir dokuma işi ("23.000 metre müslin
// fason dokunacak" gibi) Dokuma Sipariş Formu'ndan tek kalem olarak girilir.
/** İplik metre/kg oranı — Ne (İngiliz numarası) ya da Nm (Metrik numara). */
/** Kumaş metrajı + teknik özelliklerden çözgü/atkı ipliği ihtiyacını hesaplar. */
// ── Dokuma Sipariş Formu — yeni dokuma siparişi girişi/düzenlemesi ──
async function dokumaSiparisKaydet() {
    {
        const engel = mobilKisitEngelMetni('DOKUMA_SIPARIS_GIRIS', true);
        if (engel) { erpToast(engel, 'error', 4500); return; }
    }
    const ad = String(document.getElementById('dsp-kumas-ad')?.value || '').trim();
    const metre = parseFloat(document.getElementById('dsp-metre')?.value || 0) || 0;
    if (!ad) { erpToast('Kumaş türü / açıklama girin.', 'error'); return; }
    if (metre <= 0) { erpToast('Toplam metre 0\'dan büyük olmalı.', 'error'); return; }
    const fasonMi = !!document.getElementById('dsp-yer-fason')?.checked;
    const fasonFirma = fasonMi ? String(document.getElementById('dsp-fason-firma')?.value || '').trim() : '';
    const hangiIs = String(document.getElementById('dsp-hangi-is')?.value || '').trim();
    const starih = document.getElementById('dsp-starih')?.value || null;
    const ttarih = document.getElementById('dsp-ttarih')?.value || null;
    const notVal = String(document.getElementById('dsp-not')?.value || '').trim();
    const spec = dokumaSiparisFormDegerleriniOku();
    const hesap = dokumaFasonHesapla({ ...spec, metre });

    const kayit = {
        kumas_adi: ad,
        metre,
        dokuma_uretim_yeri: fasonMi ? 'FASON_DOKUMA' : 'SIMTEKS_DOKUMA',
        dokuma_fason_firma: fasonFirma,
        hangi_is: hangiIs,
        starih,
        ttarih,
        cozgu_sikligi: parseFloat(document.getElementById('dsp-cozgu-sikligi')?.value || 0) || 0,
        atki_sikligi: parseFloat(spec.atki_sikligi) || 0,
        cozgu_tel_sayisi: parseFloat(spec.cozgu_tel_sayisi) || 0,
        tarak_eni_m: parseFloat(spec.tarak_eni_m) || 0,
        ip_no_sistemi: spec.ip_no_sistemi || 'NE',
        cozgu_ip_no: parseFloat(spec.cozgu_ip_no) || 0,
        atki_ip_no: parseFloat(spec.atki_ip_no) || 0,
        cozgu_fire_payi: parseFloat(spec.cozgu_fire_payi) || 0,
        atki_fire_payi: parseFloat(spec.atki_fire_payi) || 0,
        cozgu_ihtiyaci_m: hesap.cozguUzunlukM,
        cozgu_ipligi_kg: hesap.cozguKg,
        atki_ipligi_kg: hesap.atkiKg,
        notlar: notVal
    };
    try {
        if (typeof sb === 'undefined' || !sb?.from) throw new Error('Bağlantı yok');
        if (dokumaSiparisEditId) {
            kayit.updated_at = new Date().toISOString();
            const { error } = await sb.from('dokuma_fason_siparisleri').update(kayit).eq('id', dokumaSiparisEditId);
            if (error) throw error;
            const idx = (dataCache.dokumaFasonSiparisleri || []).findIndex(s => String(s.id) === String(dokumaSiparisEditId));
            if (idx >= 0) Object.assign(dataCache.dokumaFasonSiparisleri[idx], kayit);
            erpToast('Dokuma siparişi güncellendi.', 'success');
        } else {
            kayit.durum = 'BEKLEMEDE';
            kayit.sno = 'DK' + Date.now().toString().slice(-8);
            const ins = await sb.from('dokuma_fason_siparisleri').insert([kayit]).select('*');
            if (ins.error) throw ins.error;
            const newRow = ins.data?.[0];
            if (!dataCache.dokumaFasonSiparisleri) dataCache.dokumaFasonSiparisleri = [];
            if (newRow) dataCache.dokumaFasonSiparisleri.unshift(newRow);
            erpToast('Dokuma siparişi oluşturuldu.', 'success');
        }
        dokumaSiparisEditId = null;
        await setAppMode('DOKUMA_FASON_TAKIP');
    } catch (e) {
        erpToast('Kaydedilemedi: ' + (e?.message || e), 'error');
    }
}

// ── Haşıl Takip — çözgü ipliğinin haşıllanıp dokumaya hazır hale gelmesi ──
// Konfeksiyon Yıkama ekranıyla aynı basit desen: sipariş seç, sevk/gelen
// miktarını gir, bekleyen otomatik hesaplanır. KD_DOKUMA blob'unda saklanır.
/* Mobilin kendi yıkama takibi kaldırıldı; yıkama artık ana programın
   ekranıyla (renderKonfYikama / KONFEKSIYON_YIKAMA) yapılıyor ve zaten
   konf_kesim_yikama tablosuna yazıyor. */
const MOBIL_KY_TABLO = 'konf_kesim_yikama';

/* Kesim adetlerinin asıl kaynağı artık konf_kesim_yikama (Konfeksiyon Panel'in
   "Ürün Ara" ekranı ve masaüstünün manuel kesimi buraya yazıyor — bkz.
   konf_kesim_yikama.sql). Mobil bu tabloyu hiç okumuyordu, sadece
   KD_KONFEKSIYON.kalem_N.kesilen'i gösteriyordu; panelden/masaüstünden
   girilen güncel kesim mobilde 0/eski görünüyordu. Sipariş açılışında bu
   tabloyu da çekip konfGetKd() içinde Math.max ile birleştiriyoruz. */
let _mobilKonfKyCache = { siparisId: null, rows: [], ts: 0 };
async function mobilKonfKyYukle(siparisId, force) {
    if (!siparisId) return [];
    if (!force && _mobilKonfKyCache.siparisId === String(siparisId) && (Date.now() - _mobilKonfKyCache.ts) < 20000) {
        return _mobilKonfKyCache.rows;
    }
    try {
        const { data, error } = await sb.from(MOBIL_KY_TABLO)
            .select('kalem_idx,kesilen_adet,aktif')
            .eq('siparis_id', siparisId)
            .eq('aktif', true)
            .limit(500);
        if (error) throw error;
        _mobilKonfKyCache = { siparisId: String(siparisId), rows: data || [], ts: Date.now() };
    } catch (e) { console.warn('mobilKonfKyYukle', e?.message || e); }
    return _mobilKonfKyCache.rows;
}
function mobilKonfKyKesilenToplam(siparisId, kalemIdx) {
    if (_mobilKonfKyCache.siparisId !== String(siparisId)) return 0;
    return (_mobilKonfKyCache.rows || [])
        .filter(r => Number(r.kalem_idx) === Number(kalemIdx))
        .reduce((s, r) => s + (parseInt(r.kesilen_adet, 10) || 0), 0);
}

/* Dokuma Depo pipeline + masaüstü "Manuel Kalite" girişleri kalem bazlı
   kesilen/yıkama-sevk/yıkama-gelen/kalite-geçen/sevk-edilen adetlerini
   KUMAS_GELIS tipli siparis_akis satırlarının notlar alanında kümülatif tutar
   (bkz. masaüstü konfPipelineSiparisDurumSenkron, 04-live-sync.js). Masaüstü
   bu satırları okuyup KD_KONFEKSIYON'a geri yazıyor; mobil hiç okumadığı için
   o yoldan girilen kalite/kesim/yıkama/sevk mobilde 0/eski görünüyordu.
   Salt-okunur (DB'ye yazılmaz), kalem eşleştirmesi doğrudan kalem_idx ile —
   masaüstünün eşleşme bulamayan satırlar için kullandığı bulanık arama
   burada yok, ama pratikte satırların büyük çoğunluğu kalem_idx taşıyor.
   Sevk girişi burada değişmiyor — sevkiyat hâlâ yalnızca Sevkiyat ekranından
   yapılır, bu yalnızca oradan yazılanın Konfeksiyon ekranında da görünmesini
   sağlar (Math.max ile, asla düşürmeden). */
let _mobilKonfPipelineCache = { siparisId: null, per: {}, ts: 0 };
async function mobilKonfPipelineYukle(siparisId, force) {
    if (!siparisId) return {};
    if (!force && _mobilKonfPipelineCache.siparisId === String(siparisId) && (Date.now() - _mobilKonfPipelineCache.ts) < 20000) {
        return _mobilKonfPipelineCache.per;
    }
    const per = {};
    try {
        const { data, error } = await sb.from('siparis_akis')
            .select('islem,kalem_ad,miktar,notlar')
            .eq('siparis_id', siparisId)
            .eq('islem', 'KUMAS_GELIS')
            .limit(500);
        if (error) throw error;
        (data || []).forEach(r => {
            let j = {};
            try { j = JSON.parse(r.notlar || '{}') || {}; } catch (e) {}
            if (j.panel_silindi || j.silindi) return;
            const ki = parseInt(j.kalem_idx, 10);
            if (!Number.isFinite(ki) || ki < 0) return;
            if (!per[ki]) per[ki] = { kesilen: 0, yikSevk: 0, yikGel: 0, kkGec: 0, sevk: 0 };
            per[ki].kesilen += parseInt(j.kesilen_adet || 0, 10) || 0;
            per[ki].yikSevk += parseInt((j.yikama_sevk_adet ?? j.yikama_bekleyen_adet) || 0, 10) || 0;
            per[ki].yikGel += parseInt(j.yikama_gelen_adet || 0, 10) || 0;
            per[ki].kkGec += parseInt(j.kalite_gecen_adet || 0, 10) || 0;
            per[ki].sevk += parseInt(j.sevk_edilen_adet || 0, 10) || 0;
        });
        _mobilKonfPipelineCache = { siparisId: String(siparisId), per, ts: Date.now() };
    } catch (e) { console.warn('mobilKonfPipelineYukle', e?.message || e); }
    return _mobilKonfPipelineCache.per;
}

/** Yıkamaya gönderim: yıkama önündeki kesim kaydından düşer; kayıt yoksa açar. */
/** Yıkamadan geliş: ortak tablodaki yikama_gelen_adet'i artırır. */
/* ===== Yıkama sevk fişleri (salt okunur) =====
   Fişi masaüstü ve Konfeksiyon Panel oluşturur; mobil aynı siparis_akis
   ('YIKAMA_FIS') kaydını okuyup listeler, görüntüler ve PDF indirir.
   Ana programdaki konfYikamaFisGecmis* ile birebir aynı veri. */
const MOBIL_YIKAMA_FIS_TTL_MS = 60000;

try {
    window.mobilYikamaFisGoster = mobilYikamaFisGoster;
    window.mobilYikamaFisPdfIndir = mobilYikamaFisPdfIndir;
    window.mobilYikamaFisYenile = mobilYikamaFisYenile;
} catch (e) {}

// ══════════════════════════════════════════════════════════════
// MANUEL KESİM + KESİM GEÇMİŞİ — masaüstünden taşındı.
// Siparişler-arası toplu kesim girişi + geçmiş kayıt düzeltme/silme.
// konf_kesim_yikama tablosuna, aynı ikiz-kayıt korumasıyla (konfKyInsert)
// yazar — Konfeksiyon Panel'in "Ürün Ara → Kesim" akışıyla aynı kapı.
// Masaüstünün sipariş-önce-seç / klavye-oklu dropdown arayüzü yerine,
// Konfeksiyon Panel'deki "ara → satır satır kaydet" deseni kullanıldı —
// dokunmatik ekranda daha uygun ve zaten bu oturumda doğrulanmış bir
// desen. "Dokuma sevkten kesim bekleyen" alt bölümü ve "kesim eksik"
// bulucu taşınmadı (ayrı, global bir dokuma-pipeline önbelleğine
// bağımlı — masaüstünde de bu önbellek boşken aynı şekilde gizleniyor).
// ══════════════════════════════════════════════════════════════
/* Konfeksiyon pipeline / manuel kalite durumu — ana programla birebir
   (src/stok/js/04-live-sync.js). Fonksiyonlar tasinirken bu modul
   degiskenleri de gelmezse "tanimsiz" hatasi verir. */
/* Mobilde bu hiç bildirilmemişti, yalnızca örtük global olarak atanıyordu:
   atama yapılmadan önce okuyan her satır ReferenceError veriyordu
   (ör. guard'sız `_konfGlobalKumasGelisCache.map(...)`). Ana programda
   04-live-sync.js'te `let ... = []` olarak bildirili. */
/* konfPipelineBitmisFiltre: ana programın çekirdeğinden gelir (assets/erp-core.js) */
/** Yanlışlıkla KALITE yazılmış ama UA'da parça yıkama olan kayıtları düzelt */
window.konfKesimDuzenleAc = konfKesimDuzenleAc;

window.konfKesimDuzenleIptal = konfKesimDuzenleIptal;

window.konfKesimKaydiGuncelle = konfKesimKaydiGuncelle;

window.konfKesimKaydiSil = konfKesimKaydiSil;

window.konfKesimSonListeDahaFazla = konfKesimSonListeDahaFazla;

/* Masaüstünün karşılığı ayrıca dokuma sevkten gelen global bir pipeline
   önbelleğine (_konfGlobalKumasGelisCache) bakar — o önbellek burada
   taşınmadı (bkz. üstteki not), bu yüzden yalnız konf_kesim_yikama +
   KD_KONFEKSIYON'daki elle girilmiş değer karşılaştırılıyor. Sonuç asla
   gerçek değerden yüksek çıkmaz, yalnızca o tek kaynağı eksik sayabilir. */
window.konfManuelKesimSatirKaydetByEl = konfManuelKesimSatirKaydetByEl;

window.konfManuelKesimAramaDegistir = konfManuelKesimAramaDegistir;

async function konfManuelKesimYenile() {
    await konfLoadKesimGecmis({ force: true });
    renderKonfeksiyonKesimEkrani();
}
window.konfManuelKesimYenile = konfManuelKesimYenile;

async function renderKonfeksiyonKesimEkrani() {
    const list = document.getElementById('main-list');
    if (!list) return;
    if (!(list.innerHTML || '').trim()) {
        list.innerHTML = '<div class="panel-box" style="padding:24px;text-align:center;color:var(--text3);font-size:11px">Kesim ekranı yükleniyor…</div>';
    }
    try { await konfLoadKesimGecmis(); } catch (e) {}
    if (appMode !== 'KONFEKSIYON_KESIM') return;
    list.innerHTML = renderKonfGlobalKumasGelisPanel();
}

/** Masaüstü menü openers — mobil mevcut ekranlara bağlanır */
async function openMamulKartGiris() {
    archiveTab = 'MAMUL';
    try { saveUiState({ archiveTab }); } catch (e) {}
    editingId = null;
    await setAppMode('MAMUL_KART_GIRIS');
}
window.openMamulKartGiris = openMamulKartGiris;
window.openTerbiye = openTerbiye;
window.openKonfeksiyonKesim = openKonfeksiyonKesim;
window.openKonfeksiyonYikama = openKonfeksiyonYikama;
window.openKonfeksiyonKalite = openKonfeksiyonKalite;
window.openKonfIslemRaporu = openKonfIslemRaporu;

/** Tüm kalemlerdeki ürün aşamalarının birleşimi (ilk görülen sıra korunur) + sevk yoksa sonda eklenir */
/* Taşınan yardımcıların bağlı olduğu, mobilde hiç bildirilmemiş durum
   değişkenleri — ana programla birebir (src/stok/js/02-data-yetki.js). */
// ══════════════════════════════════════════════════════════════
// YAPILACAKLAR — ana programdan taşındı (src/stok/js/04-live-sync.js), birebir.
// ══════════════════════════════════════════════════════════════
/* ── YAPILACAKLAR LİSTESİ (Planlama → Yapılacaklar) ───────────────────────
   Tablo: todo_list (bkz. supabase/migrations/yapilacaklar_listesi.sql).
   Sipariş bağlantısı isteğe bağlıdır; description içinde [SIP:id|sno] etiketi
   olarak tutulur — uygulamanın diğer yerlerdeki etiket düzeniyle aynı.
   Görevler yalnızca ELLE eklenir; otomatik görev üretimi bilinçli olarak yoktur
   (yönetilmeyen görev yığını oluşturur). */
   // öncelik düğmelerinde seçili olan
// ══════════════════════════════════════════════════════════════
// DOKUMA SEVK GEÇMİŞİ — ana programdan taşındı (src/stok/js/02-data-yetki.js), birebir.
// ══════════════════════════════════════════════════════════════
/* src/stok/js/04-live-sync.js */
/* src/stok/js/04-live-sync.js */
/* src/stok/js/06-reports.js */
/* src/stok/js/08-kd-misc.js */
/* src/stok/js/04-live-sync.js */
/* src/stok/js/04-live-sync.js */
/* src/stok/js/04-live-sync.js */
/* src/stok/js/07-render.js */
/* src/stok/js/07-render.js */
/* src/stok/js/07-render.js */
/* src/stok/js/07-render.js */
/* src/stok/js/07-render.js */
/* src/stok/js/07-render.js */
/* src/stok/js/07-render.js */
/* src/stok/js/04-live-sync.js */
/* src/stok/js/04-live-sync.js */
/* src/stok/js/04-live-sync.js */
/* src/stok/js/04-live-sync.js */
/* src/stok/js/04-live-sync.js */
/* src/stok/js/05-dokuma-ops.js */
/* src/stok/js/05-dokuma-ops.js */
/* src/stok/js/05-dokuma-ops.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
/* src/stok/js/02-data-yetki.js */
// ══════════════════════════════════════════════════════════════
// ANA PROGRAMDAN TAŞINAN EKSİK YARDIMCILAR
// Mobil bu fonksiyonları ÇAĞIRIYOR ama hiç tanımlamamıştı — kod sözdizimsel
// olarak geçerli olduğu için hata ancak kullanıcı o yola girince
// "X is not defined" olarak çıkıyordu. scripts/kontrol-tanimsiz-fonksiyon.js
// ile bulundu; gövdeler ana programla birebirdir.
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// KONFEKSIYON YIKAMA — ana programdan taşındı (src/stok/js/04-live-sync.js)
// Yıkama ekranı, global yıkama paneli, Yıkama Fişi (oluştur/geçmiş/PDF)
// ve manuel yıkama girişi. Mobilin kendi ayrı yıkama sistemi bunun yerine
// kaldırıldı — ana program baz alınıyor. Gövdeler ana programla birebirdir.
// ══════════════════════════════════════════════════════════════

/* Yıkama fişi durumu — ana programla birebir (src/stok/js/04-live-sync.js). */
// ══════════════════════════════════════════════════════════════
// KONFEKSIYON KALİTE — ana programdan taşındı (src/stok/js/04-live-sync.js)
// Manuel kalite (paket) girişi, global kalite paneli ve "tüm siparişleri
// göster" görünümü mobilde hiç yoktu. Gövdeler ana programla birebirdir;
// değiştirmeden önce scripts/kontrol-fonksiyon-paritesi.js ile kontrol et.
// ══════════════════════════════════════════════════════════════

function konfMiktarOku(val, birim) {
    const b = String(birim || 'ADET').toUpperCase();
    if (b === 'MT' || b === 'KG') {
        const n = parseFloat(val);
        return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : 0;
    }
    return parseInt(val, 10) || 0;
}

function konfKalemMiktarNorm(deger, birim) {
    const b = String(birim || 'ADET').toUpperCase();
    if (b === 'MT' || b === 'KG') {
        const v = erpParseDecimal(deger);
        return Number.isFinite(v) ? Math.round(v * 1000) / 1000 : 0;
    }
    const parsed = erpParseExcelNumberExpr(deger);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : (parseInt(deger, 10) || 0);
}

function konfMiktarFmt(val, birim) {
    const b = String(birim || 'ADET').toUpperCase();
    const n = konfMiktarOku(val, birim);
    if (b === 'MT' || b === 'KG') {
        return `${n.toLocaleString('tr-TR', { maximumFractionDigits: 3 })} ${b.toLowerCase()}`;
    }
    return `${n.toLocaleString('tr-TR')} adet`;
}

function konfLogMiktarGoster(r) {
    if (String(r.islem || '') === 'KONF_LOG' || String(r.islem || '') === 'SIPARIS_LOG') return '—';
    const miktar = parseFloat(r.miktar);
    if (!Number.isFinite(miktar) || miktar === 0) return '0';
    return konfMiktarFmt(miktar, r.birim || 'ADET');
}

function konfLogDetayMetni(j = {}) {
    if (Array.isArray(j?.detay?.alanlar) && j.detay.alanlar.length) return j.detay.alanlar.join(' · ');
    if (j.deltas && typeof j.deltas === 'object') {
        const etiket = {
            kesilen: 'Kesilen', fire_kesim: 'Fire kesim', dikilen: 'Dikilen', fire_dikim: 'Fire dikim',
            kk_gecen: 'Kalite geçen', tamir: 'Tamir', imha: 'İmha', kolide: 'Kolide', sevk_edilen: 'Sevk edilen'
        };
        const parts = [];
        Object.entries(j.deltas).forEach(([k, v]) => {
            if (k === '_iki_kalite_detay' && v && typeof v === 'object') {
                Object.entries(v).forEach(([sk, sv]) => { if (sv) parts.push(`2.kalite ${sk}: +${sv}`); });
            } else if (v) parts.push(`${etiket[k] || k}: +${v}`);
        });
        if (parts.length) return parts.join(' · ');
    }
    if (j.tip) return `Sekme: ${String(j.tip).toUpperCase()}`;
    return '';
}

// --- SİDEBAR ---
/** Arayüz kabuğu: simteks (varsayılan) | workcube — localStorage erp_ui_skin; geri dönüş için "Simteks" seçin */
function erpToggleMobileSidebar(forceOpen) {
    // Mobil ERP'de sidebar her zaman çekmece (geniş tablet dahil)
    const shouldOpen = typeof forceOpen === 'boolean'
        ? forceOpen
        : !document.body.classList.contains('mobile-sidebar-open');
    document.body.classList.toggle('mobile-sidebar-open', shouldOpen);
}

function erpCloseMobileSidebar() {
    try {
        document.body.classList.remove('mobile-sidebar-open');
    } catch (e) {}
}

/** Sayfa seçiminden sonra çekmecenin kapalı kaldığını garanti et */
function erpScheduleMobileSidebarClose() {
    erpCloseMobileSidebar();
    try {
        queueMicrotask(() => erpCloseMobileSidebar());
    } catch (e) {
        setTimeout(erpCloseMobileSidebar, 0);
    }
    setTimeout(erpCloseMobileSidebar, 40);
    setTimeout(erpCloseMobileSidebar, 160);
}

function erpMobilEkranGecis() {
    if (!document.body?.classList?.contains('erp-mobil-lite')) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window._erpViewAnimT) clearTimeout(window._erpViewAnimT);
    window._erpViewAnimT = setTimeout(() => {
        window._erpViewAnimT = null;
        const el = document.querySelector('.content-scroll') || document.getElementById('main-list');
        if (!el) return;
        el.classList.remove('erp-view-in');
        void el.offsetWidth;
        el.classList.add('erp-view-in');
    }, 48);
}

/** Menüde sayfa seçilince çekmeceyi kapat (accordion açılışında kapatma) */
function erpBindMobileNavAutoClose() {
    const aside = document.querySelector('aside.erp-sidebar');
    if (!aside || aside.dataset.erpNavCloseBound === '1') return;
    aside.dataset.erpNavCloseBound = '1';
    aside.addEventListener('click', (e) => {
        const t = e.target;
        if (!t || !t.closest) return;
        // Accordion / arama / senkron — açık kalsın
        if (t.closest('.nav-group-head, [id$="-toggle"], .sidebar-search-wrap, #sidebar-nav-search, .sync-btn')) return;
        // Doğrudan sayfa (Anasayfa, Numune) veya alt menü / footer sayfa butonu
        const leaf = t.closest(
            '.nav-pro-sub, #nav-DASHBOARD, .sidebar-ghost-btn, .nav-pro[onclick*="setAppMode"]'
        );
        if (!leaf) return;
        if (leaf.classList.contains('nav-pro') && /toggleChicSub|toggleNavGroup/.test(String(leaf.getAttribute('onclick') || ''))) return;
        erpScheduleMobileSidebarClose();
    }, true);
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', erpBindMobileNavAutoClose);
} else {
    erpBindMobileNavAutoClose();
}

function erpMobileTabbarSync(mode) {
    const bar = document.getElementById('erp-mobile-tabbar');
    if (!bar) return;
    const m = String(mode || appMode || 'SIPARIS_LISTE');
    const activeMap = {
        SIPARIS_LISTE: 'SIPARIS_LISTE',
        SIPARIS_GIRIS: 'SIPARIS_LISTE',
        SIPARIS_KAPANAN: 'SIPARIS_LISTE',
        URUN_AGACI: 'SIPARIS_LISTE',
        DEPO_HAREKET: 'MAMUL_DEPO',
        DEPO_HAREKET_LISTE: 'MAMUL_DEPO',
        MUHASEBE_FIS: 'MAMUL_DEPO',
        STOK_SAYIM: 'MAMUL_DEPO',
        IPLIK: 'MAMUL_DEPO',
        KUMAS: 'MAMUL_DEPO',
        MAMUL_DEPO: 'MAMUL_DEPO',
        KART_LISTE: 'KART_LISTE',
        IPLIK_KART_GIRIS: 'KART_LISTE',
        KUMAS_KART_GIRIS: 'KART_LISTE',
        MAMUL_KART_GIRIS: 'KART_LISTE',
        KONFEKSIYON: 'KONFEKSIYON',
        KONFEKSIYON_PLANLAMA: 'KONFEKSIYON',
        FASON_TAKIP: 'KONFEKSIYON'
    };
    const activeKey = activeMap[m] || '';
    bar.querySelectorAll('button[data-tab-mode]').forEach(btn => {
        const key = btn.getAttribute('data-tab-mode');
        if (key === 'MENU') {
            btn.classList.remove('active');
            return;
        }
        const can = (typeof erpUserCan !== 'function') || erpUserCan(key)
            || (key === 'DEPO_HAREKET' && (erpUserCan('IPLIK') || erpUserCan('KUMAS') || erpUserCan('MAMUL_DEPO')))
            || (key === 'MAMUL_DEPO' && erpUserCan('MAMUL_DEPO'))
            || (key === 'KART_LISTE' && erpUserCan('KART_LISTE'))
            || (key === 'KONFEKSIYON' && (erpUserCan('KONFEKSIYON_PLANLAMA') || erpUserCan('FASON_TAKIP')));
        btn.classList.toggle('erp-nav-denied', !can);
        btn.classList.toggle('active', can && key === activeKey);
    });
    syncMamulMobilFab();
}

document.addEventListener('click', closeAllFlyouts);

window.onload = async () => {
    if (!erpIsSupabaseReady()) return;

    applyTheme();
    erpApplySkinFromStorage();

    const sc = document.querySelector('.content-scroll');
    if (sc) sc.style.padding = '1.25rem 1.5rem';
    const loggedIn = await erpSessionBootstrap();
    if (!loggedIn) return;

    const ui = loadUiState();
    let initialMode = APP_MODE_WHITELIST.includes(ui?.appMode) ? ui.appMode : (window.ERP_MOBIL_BOOT_MODE || 'SIPARIS_LISTE');
    if (initialMode === 'HAM_KUMAS' || initialMode === 'MAMUL_KUMAS') initialMode = 'KUMAS';
    if (initialMode === 'SIPARIS_KAPAMA') initialMode = 'PLANLAMA';
    if (initialMode === 'RAPOR') initialMode = 'RAPORLAR';
    const bootFallback = window.ERP_MOBIL_BOOT_MODE || 'SIPARIS_LISTE';
    const safeMode = erpUserCan(initialMode) ? initialMode : bootFallback;
    const hadCache = erpDataCacheRestore();
    if (hadCache) updateSummary();
    if (ui && typeof ui === 'object') {
        if (['TUMU', 'IPLIK', 'MAMUL', 'KUMAS', 'HAM_KUMAS', 'MAMUL_KUMAS'].includes(ui.archiveTab)) {
            if (ui.archiveTab === 'MAMUL_KUMAS') { archiveTab = 'KUMAS'; kumasKartListeFiltre = 'MAMUL'; }
            else if (ui.archiveTab === 'HAM_KUMAS') { archiveTab = 'KUMAS'; kumasKartListeFiltre = 'HAM'; }
            else archiveTab = ui.archiveTab;
        }
        if (ui.kumasKartListeFiltre) kumasKartListeFiltre = kumasKartTipiNorm(ui.kumasKartListeFiltre);
        if (ui.mamulKartAramaFiltre && typeof ui.mamulKartAramaFiltre === 'object') {
            mamulKartAramaFiltre = { ...mamulKartAramaFiltre, ...ui.mamulKartAramaFiltre };
        }
        if (['HEPSI', 'STOKLU', 'SIFIR', 'VARYANTLI'].includes(ui.mamulKartListeHizliFiltre)) {
            mamulKartListeHizliFiltre = ui.mamulKartListeHizliFiltre;
        }
        if (['IPLIK','KUMAS','KART','SIPARIS_LISTE'].includes(ui.raporSubMode)) raporSubMode = ui.raporSubMode;
        if (Array.isArray(ui.raporIzlemeIds) && ui.raporIzlemeIds.length) {
            raporIzlemeIds = ui.raporIzlemeIds.map(String).filter(Boolean);
            try { localStorage.setItem(RAPOR_IZLEME_LS_KEY, JSON.stringify(raporIzlemeIds)); } catch (e) {}
        }
        if (ui.konfeksiyonSiparisId !== undefined) konfeksiyonSiparisId = ui.konfeksiyonSiparisId || null;
        if (['ÖZET','KESİM','DİKİM','KALİTE','KOLİ','KAPAMA'].includes(ui.konfeksiyonTab)) konfeksiyonTab = ui.konfeksiyonTab;
        if (ui.boyahaneUretimAlan && BOYAHANE_ALANLARI[ui.boyahaneUretimAlan]) boyahaneUretimAlan = ui.boyahaneUretimAlan;
        if (ui.konfPlanlamaPlanliGoster !== undefined) konfPlanlamaPlanliGoster = !!ui.konfPlanlamaPlanliGoster;
        if (ui.fasonTakipFiltre && typeof ui.fasonTakipFiltre === 'object') fasonTakipFiltre = { ...fasonTakipFiltre, ...ui.fasonTakipFiltre };
        if (ui.fasonTakipAcikSiparisId) fasonTakipAcikSiparisId = String(ui.fasonTakipAcikSiparisId);
        if (ui.dtSeciliSiparisId !== undefined) dtSeciliSiparisId = ui.dtSeciliSiparisId || null;
        if (ui.kapamaSiparisId !== undefined) kapamaSiparisId = ui.kapamaSiparisId || null;
        planlamaAltMode = 'ANA';
        if (ui.dtDosyaAktif !== undefined) {
            const migrated = dtMigrateDosyaAktif(ui.dtDosyaAktif);
            if (dtKulvarGecerli(migrated)) dtDosyaAktif = migrated;
        }
    }
   await setAppMode(safeMode);
   erpSidebarVersionGuncelle();
   // Cache varsa hemen kullan; senkron arka planda (UI bloklanmasın)
   const bootSync = () => syncAllData(false, { silent: true, siparisLight: true })
       .then(() => {
           erpSyncRefreshUi();
           erpScheduleBootBackgroundSync();
       })
       .catch(e => console.warn('Açılış senkron:', e));
   if (hadCache) {
       bootSync();
   } else {
       try {
           await syncAllData(false, { silent: false, siparisLight: true });
       } catch (e) {
           console.warn('Açılış senkron:', e);
       }
       erpSyncRefreshUi();
       erpScheduleBootBackgroundSync();
   }
   try { erpLiveSyncStart(); } catch (e) { console.warn('erpLiveSyncStart', e); }
   document.addEventListener('visibilitychange', () => {
       if (document.hidden) return;
       if (_erpLivePending) {
           try { erpLiveApplyPending(); } catch (e) {}
       }
   });
};
window.addEventListener('beforeunload', () => {
    saveUiState({});
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') erpCloseMobileSidebar();
});

/**
 * Mobil kapsam kararı (kullanıcı, 19.09.2026). YALNIZ MOBİLDE uygulanır; yetki
 * katmanına (erpModeAcikMi) bilerek konmadı — o katman ana programla birebir
 * kalmalı, yoksa aynı kullanıcı masaüstünde de kilitlenir.
 *  - Yeni sipariş / yeni dokuma siparişi açılamaz (mevcut sipariş düzenlenebilir).
 *  - Ürün ağacı girişi yalnız yönetici.
 *  - Yeni stok kartı açılamaz (mevcut kartlar görüntülenir).
 * Stok hareketi giriş/çıkış, stok sayımı ve sevkiyat serbesttir.
 * Boş dönerse izin var; dolu dönerse kullanıcıya gösterilecek engel metnidir.
 */
function mobilKisitEngelMetni(mode, duzenleme) {
    if (mode === 'SIPARIS_GIRIS' && !duzenleme) return 'Mobilden yeni sipariş açılamaz — siparişi ana programdan açın.';
    if (mode === 'DOKUMA_SIPARIS_GIRIS' && !dokumaSiparisEditId) return 'Mobilden yeni dokuma siparişi açılamaz — ana programdan açın.';
    if (mode === 'URUN_AGACI' && !erpIsAdmin()) return 'Ürün ağacı girişi yalnız yönetici tarafından yapılabilir.';
    if (['IPLIK_KART_GIRIS', 'KUMAS_KART_GIRIS', 'MAMUL_KART_GIRIS', 'KART_GIRIS'].includes(mode) && !duzenleme) {
        return 'Mobilden yeni stok kartı açılamaz — kartlar mobilde yalnız görüntülenir.';
    }
    return '';
}

// --- APP MOD YÖNETİMİ ---
async function setAppMode(mode, keepEditingId = false) {
    if (mode === 'TEZGAH_YONETIMI' || mode === 'TEZGAH_GIRIS') mode = 'DOKUMA_TAKIP';
    /* Ana programla aynı (06-reports.js setAppMode): Depo girişi merkezi açılmaz, İplik
       stoğuna gider. Mobilde bu yönlendirme yoktu — merkez liste bölümünü gizliyor ve
       sonraki TÜM ekranlar sayfa yenilenene kadar boş kalıyordu (24.09.2026). */
    if (mode === 'DEPO_HAREKET') mode = 'IPLIK';
    erpScheduleMobileSidebarClose();
    { const lsBolum = document.getElementById('list-section'); if (lsBolum) lsBolum.style.display = ''; }
    if (mode === 'RAPOR') mode = 'RAPORLAR';
    if (mode === 'SIPARIS_TERMIN_PLAN') mode = 'PLANLAMA';
    if (mode === 'HAM_KUMAS' || mode === 'MAMUL_KUMAS') mode = 'KUMAS';
    if (mode === 'NUMUNE_URETIM') mode = 'SIPARIS_LISTE';
    if (mode === 'DIAGNOSTICS') mode = 'SIPARIS_LISTE';
    /* KONFEKSIYON_KALITE ana programda kendi ekranıdır (global kalite paneli +
       manuel kalite girişi). Mobilde eskiden KONFEKSIYON'a çevriliyordu, o
       yüzden yalnız seçili siparişin kalite sekmesi açılıyor, siparişler arası
       global panel hiç görünmüyordu. Artık ana programdaki gibi kendi modu. */
    if (mode === 'KONFEKSIYON_KALITE') { konfeksiyonTab = 'KALİTE'; try { saveUiState({ konfeksiyonTab }); } catch (e) {} }
    else if (mode === 'KONFEKSIYON_YIKAMA') { konfeksiyonTab = 'YIKAMA'; try { saveUiState({ konfeksiyonTab }); } catch (e) {} }
    /* DOKUMA_SEVK_GECMIS eskiden Dokuma Takip'in HAREKET sekmesine çevriliyordu;
       ana programda kendi ekranı (renderDokumaSevkGecmisi) — artık mobilde de. */
    {
        const engel = mobilKisitEngelMetni(mode, !!(keepEditingId && editingId));
        if (engel) {
            try { erpToast(engel, 'error', 4500); } catch (e) {}
            return;
        }
    }
    if (erpCurrentUser && typeof erpUserCan === 'function' && !erpUserCan(mode)) {
        mode = window.ERP_MOBIL_BOOT_MODE || 'SIPARIS_LISTE';
    }
    const prevMode = appMode;
    appMode = mode;
    if (mode === 'SIPARIS_KAPANAN' && prevMode !== 'SIPARIS_KAPANAN') siparisKapananLimitSifirla();
    try { document.body.setAttribute('data-erp-mode', mode); } catch (e) {}
    if (prevMode !== mode) {
        try { erpMobilEkranGecis(); } catch (e) {}
    }
    syncSiparisWizardChrome();
    try { erpMobileTabbarSync(mode); } catch (e) {}
    erpClearTransientUi();
    saveUiState({ appMode: mode });
    if (!['KONFEKSIYON','KONFEKSIYON_PLANLAMA'].includes(mode)) konfStopLiveSync();
    if (!['BOYAHANE_URETIM','DOKUMA_URETIM'].includes(mode)) uretimSeciliSiparisId = null;
    if (!keepEditingId) {
        editingId = null;
        siparisFormKayitDurum = null;
    }
    if (!keepEditingId && mode === 'DEPO_HAREKET' && prevMode !== 'DEPO_HAREKET' && !depoHizliHareketBekleyen) {
        depoKomutaHedef = null;
        depoKomutaAsama = 'TIP';
    }
    if (!keepEditingId && ['IPLIK', 'HAM_KUMAS', 'MAMUL_KUMAS', 'KUMAS', 'MAMUL_DEPO'].includes(mode)) {
        depoKomutaHedef = null;
        depoKomutaAsama = 'TIP';
    }
    atkiRenkCount = 1;
    currentImageBase64 = null;

    const formContainer = document.getElementById('form-container');
    const currentTitle = document.getElementById('current-title');
    const listTitle = document.getElementById('list-title');
    const ozetGrid = document.getElementById('rapor-ozet-grid');
    const filterPanel = document.getElementById('filter-panel');
    const mainList = document.getElementById('main-list');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const toggleArea = document.getElementById('toggle-area');

    const basliklar = {
        'KULLANICI_YONETIMI': 'Kullanıcı Yönetimi',
        'DASHBOARD': 'Anasayfa',
        'PLANLAMA': 'Planlama',
        'DEPO_HAREKET': 'Depo Giriş Çıkış',
        'DEPO_HAREKET_LISTE': 'Depo Hareketleri',
        'MUHASEBE_FIS': 'Muhasebe Fişleri',
        'IPLIK': 'İplik Stoğu',
        'HAM_KUMAS': 'Kumaş Stoğu',
        'MAMUL_KUMAS': 'Kumaş Stoğu',
        'KUMAS': 'Kumaş Stoğu',
        'SIPARIS_GIRIS': 'Yeni Sipariş',
        'SIPARIS_LISTE': 'Siparişler',
        'SIPARIS_KAPANAN': 'Kapanan Siparişler',
        'KART_LISTE': 'Stok Kartları',
        'MAMUL_DEPO': 'Mamül Deposu',
        'STOK_SAYIM': 'Stok Sayım',
        'KART_GIRIS': 'Ürün Kartı',
        'IPLIK_KART_GIRIS': 'İplik Stok Kartı',
        'KUMAS_KART_GIRIS': 'Kumaş Stok Kartı',
        'MAMUL_KART_GIRIS': 'Mamül Stok Kartı',
        'RAPOR': 'Analiz',
        'KONFEKSIYON': 'Konfeksiyon',
        'FASON_TAKIP': 'Konfeksiyon Fason',
        'DOKUMA_FASON_TAKIP': 'Dokuma Fason',
        'DOKUMA_SIPARIS_GIRIS': 'Dokuma Siparişi',
        'HASIL_TAKIP': 'Haşıl Takip',
        'KONFEKSIYON_YIKAMA': 'Yıkama',
        'KONFEKSIYON_PLANLAMA': 'Konfeksiyon Planlama',
        'TEKNIK_FOY': 'Teknik Föy / İş Emirleri',
        'URUN_AGACI': 'Ürün Ağacı',
        'RAPORLAR': 'Raporlar & Analiz',
        'DOKUMA_TAKIP': 'Dokuma Takip',
        'DOKUMA_DEPO': 'Dokuma Depo',
        'KONFEKSIYON_KESIM': 'Kesim',
        'BOYAHANE_URETIM': 'Terbiye',
    };

    if (currentTitle) {
        currentTitle.style.opacity = '0';
        currentTitle.style.transition = 'opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1), transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)';
        currentTitle.style.transform = 'translateY(4px)';
        setTimeout(() => {
            const dinamikBaslik = mode === 'BOYAHANE_URETIM'
                ? `${boyahaneAktifAlanMeta()?.label || 'Boyahane'}`
                : (mode === 'DOKUMA_TAKIP' && dtDosyaAktif === 'URETIM_GIRIS')
                        ? 'Dokuma · Üretim Girişi'
                    : (basliklar[mode] || mode.replace(/_/g, ' '));
            currentTitle.innerText = dinamikBaslik;
            currentTitle.style.opacity = '1';
            currentTitle.style.transform = 'translateY(0)';
        }, 80);
    }

    if (toggleArea) {
        const staticModes = ['KART_GIRIS', 'IPLIK_KART_GIRIS', 'KUMAS_KART_GIRIS', 'MAMUL_KART_GIRIS', 'SIPARIS_GIRIS', 'KART_LISTE', 'SIPARIS_LISTE', 'SIPARIS_KAPANAN', 'PLANLAMA', 'KONFEKSIYON', 'KONFEKSIYON_KESIM', 'FASON_TAKIP', 'DOKUMA_FASON_TAKIP', 'DOKUMA_SIPARIS_GIRIS', 'HASIL_TAKIP', 'KONFEKSIYON_YIKAMA', 'KONFEKSIYON_PLANLAMA', 'TEKNIK_FOY', 'URUN_AGACI', 'RAPORLAR', 'DOKUMA_TAKIP', 'DOKUMA_DEPO', 'BOYAHANE_URETIM', 'DASHBOARD', 'STOK_SAYIM', 'MUHASEBE_FIS'];
        const depoListeModes = ['IPLIK', 'HAM_KUMAS', 'MAMUL_KUMAS', 'KUMAS', 'MAMUL_DEPO'];
        if (staticModes.includes(mode) || depoListeModes.includes(mode) || mode === 'DEPO_HAREKET' || mode === 'DEPO_HAREKET_LISTE') {
            toggleArea.style.display = 'none';
            if (!depoListeModes.includes(mode) && mode !== 'DEPO_HAREKET' && mode !== 'DEPO_HAREKET_LISTE') movementType = 'GİRİŞ';
        } else {
            toggleArea.style.display = 'flex';
            toggleArea.style.flexDirection = 'column';
            toggleArea.style.alignItems = 'stretch';
        }
    }

    document.querySelectorAll('.nav-pro, .nav-pro-sub').forEach(l => l.classList.remove('active'));
    const activeNavId = mode === 'PLANLAMA'
        ? 'nav-PLANLAMA'
        : (mode === 'DOKUMA_TAKIP' ? 'nav-DOKUMA_TAKIP'
            : (mode === 'BOYAHANE_URETIM' ? 'nav-BOYAHANE_URETIM'
            : (mode === 'KONFEKSIYON_YIKAMA' ? 'nav-KONFEKSIYON_YIKAMA'
            : (mode === 'KONFEKSIYON' ? (
                konfeksiyonTab === 'KESİM' ? 'nav-KONFEKSIYON_KESIM'
                : konfeksiyonTab === 'KALİTE' ? 'nav-KONFEKSIYON_KALITE'
                : 'nav-KONFEKSIYON_KESIM'
            )
            : (['IPLIK_KART_GIRIS', 'KUMAS_KART_GIRIS', 'MAMUL_KART_GIRIS', 'KART_GIRIS'].includes(mode) ? 'nav-KART_LISTE'
            : ('nav-' + mode))))));
    const activeNav = document.getElementById(activeNavId);
    if (activeNav) {
        activeNav.classList.add('active');
        // Eğer sub-item ise parent accordion'ı aç
        const parentSub = activeNav.closest('.nav-pro-sub-area');
        if (parentSub) {
            parentSub.classList.add('open');
            const subId = parentSub.id.replace('sub-', '');
            const chev = document.getElementById('chev-' + subId);
            if (chev) chev.style.transform = 'rotate(180deg)';
        }
        const parentGroup = activeNav.closest('.nav-group-body');
        if (parentGroup) {
            parentGroup.classList.add('open');
            const groupChev = document.getElementById('chev-' + parentGroup.id);
            if (groupChev) groupChev.style.transform = 'rotate(180deg)';
        }
    }

    if (cancelBtn) cancelBtn.style.display = 'none';
    if (ozetGrid) { ozetGrid.style.display = 'none'; ozetGrid.style.pointerEvents = 'none'; }
    if (filterPanel) {
        filterPanel.classList.add('hidden');
        filterPanel.classList.remove('siparis-filtre-card');
        document.getElementById('filter-inputs')?.classList.remove('siparis-filtre-grid');
    }
    if (mainList && erpModeLoadDataGuvenliMi(mode)) mainList.innerHTML = '';

    const scrollArea = document.querySelector('.content-scroll');
    if (scrollArea) scrollArea.scrollTop = 0;

    // Top-header her ekranda görünür
    const topHeader = document.querySelector('.top-header');
    const listSection = document.querySelector('#list-title')?.closest('div.flex.items-center');
    const scrollArea2 = document.querySelector('.content-scroll');
  if (mode === 'KULLANICI_YONETIMI') {
    if (!erpCurrentUser || String(erpCurrentUser.role || '').toLowerCase() !== 'admin') { setAppMode(window.ERP_MOBIL_BOOT_MODE || 'SIPARIS_LISTE'); return; }
    if (formContainer) formContainer.style.display = 'none';
    if (listTitle) listTitle.innerText = 'KULLANICI YÖNETİMİ';
    if (ozetGrid) ozetGrid.style.display = 'none';
    if (filterPanel) filterPanel.style.display = 'none';
    if (toggleArea) toggleArea.style.display = 'none';
    if (mainList) {
        mainList.style.display = 'block';
        mainList.innerHTML = ''; // önceki içeriği temizle
    }
    // Dashboard kalıntısını DOM'dan kaldır
    const dashRoot = document.getElementById('dashboard-root');
    if (dashRoot) dashRoot.remove();
    
    if (topHeader) topHeader.style.display = 'flex';
    
    await renderKullaniciYonetimi();
    return;
}

    if (topHeader) topHeader.style.display = 'flex';
    if (listSection) listSection.style.display = 'flex';
    const listHdrTp = document.querySelector('#list-title')?.parentElement;
    if (listHdrTp) listHdrTp.style.display = '';
    if (mainList) mainList.style.display = 'block';
    if (scrollArea2) scrollArea2.style.padding = '0.8rem 0.7rem';
    const dashRoot2 = document.getElementById('dashboard-root');
    if (dashRoot2) dashRoot2.remove();

    if (mode === 'PLANLAMA') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = 'PLANLAMA';
        await renderPlanlama();
        return;
    }
    if (mode === 'DOKUMA_TAKIP') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = dtDosyaAktif === 'URETIM_GIRIS' ? 'DOKUMA · ÜRETİM GİRİŞİ' : 'DOKUMA ÜRETİM HATTI';
        await renderDokumaTakip();
        return;
    }

    if (mode === 'SEVKIYAT') {
        const sevkDepoForm = typeof sevkiyatDepoFormGrubuMu === 'function' && sevkiyatDepoFormGrubuMu(sevkiyatMerkezGrup);
        if (formContainer) {
            formContainer.style.display = sevkDepoForm ? 'flex' : 'none';
            if (!sevkDepoForm) formContainer.classList.remove('sevkiyat-form-modal');
        }
        if (listTitle) listTitle.innerText = "SEVKİYAT";
        if (document.getElementById('sevkiyat-out')) await sevkiyatHafifYenile(true);
        else await renderSevkiyat();
        if (sevkDepoForm) {
            renderInputs();
            if (typeof syncDepoKomutaChrome === 'function') syncDepoKomutaChrome();
            if (typeof applyDepoFormLayout === 'function') applyDepoFormLayout();
        }
        if (typeof sevkiyatFormModalSync === 'function') sevkiyatFormModalSync();
        return;
    }

    if (mode === 'RAPORLAR') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = "RAPORLAR & ANALİZ";
        renderRaporlar();
        return;
    }

    if (mode === 'TEKNIK_FOY') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = "TEKNİK FÖY / İŞ EMRİ HAZIRLAMA";
        uaCalismaModu = 'SIPARIS';
        renderUrunAgaci();
        return;
    }

    if (mode === 'URUN_AGACI') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = "SİPARİŞ / ÜRÜN AĞACI YÖNETİMİ";
        uaCalismaModu = 'URUN';
        renderUrunAgaci();
        return;
    }

    if (mode === 'KONFEKSIYON') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = "KONFEKSİYON ÜRETİM TAKİP";
        renderKonfeksiyon();
        if (konfeksiyonSiparisId) {
            (async () => {
                try {
                    await sbKdGet(konfeksiyonSiparisId, 'KD_KONFEKSIYON', true);
                    await sbKdGet(konfeksiyonSiparisId, 'KD_DOKUMA', true);
                    await sbKdGet(konfeksiyonSiparisId, 'KD_URUN_AGACI', true);
                    await konfLoadIslemLog(konfeksiyonSiparisId);
                    renderKonfeksiyon();
                } catch (e) { console.warn('Konfeksiyon ön yükleme:', e?.message || e); }
            })();
        }
        konfStartLiveSync();
        return;
    }

    if (mode === 'FASON_TAKIP') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = "KONFEKSİYON FASON";
        renderFasonTakip();
        return;
    }

    if (mode === 'DOKUMA_FASON_TAKIP') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = "DOKUMA FASON";
        renderDokumaFasonTakip();
        return;
    }

    if (mode === 'DOKUMA_DEPO') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = "DOKUMA DEPO";
        renderDokumaDepo();
        return;
    }

    if (mode === 'KONFEKSIYON_KESIM') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = "KESİM";
        renderKonfeksiyonKesimEkrani();
        return;
    }

    if (mode === 'KONFEKSIYON_KALITE') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = "KONFEKSİYON KALİTE";
        renderKonfeksiyon();
        return;
    }

    if (mode === 'DOKUMA_SIPARIS_GIRIS') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = dokumaSiparisEditId ? "DOKUMA SİPARİŞİNİ DÜZENLE" : "YENİ DOKUMA SİPARİŞİ";
        renderDokumaSiparisGiris();
        return;
    }

    if (mode === 'HASIL_TAKIP') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = "HAŞIL TAKİP";
        renderHasilTakip();
        return;
    }

    if (mode === 'DASHBOARD') {
        /* Ana programdaki blok üst başlığı ve liste bölümünü gizler; mobilde üst
           başlıkta menü düğmesi olduğu için yalnız form ve özet gizlenir. */
        if (formContainer) formContainer.style.display = 'none';
        if (ozetGrid) ozetGrid.style.display = 'none';
        if (filterPanel) filterPanel.classList.add('hidden');
        if (mainList) mainList.style.display = 'block';
        if (listTitle) listTitle.innerText = "ANASAYFA";
        renderDashboard();
        return;
    }

    if (mode === 'DOKUMA_SEVK_GECMIS') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = "DOKUMA SEVK GEÇMİŞİ";
        await renderDokumaSevkGecmisi();
        return;
    }

    /* Yapılacaklar kendi panelini çizer: boş "İşlem Girişi" formuna gerek yok. */
    if (mode === 'YAPILACAKLAR') {
        if (formContainer) formContainer.style.display = 'none';
        if (ozetGrid) ozetGrid.style.display = 'none';
        if (filterPanel) filterPanel.classList.add('hidden');
        if (mainList) mainList.style.display = 'block';
        if (listTitle) listTitle.innerText = "YAPILACAKLAR";
        await renderYapilacaklar();
        return;
    }

    if (mode === 'KONFEKSIYON_YIKAMA') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = "YIKAMA";
        renderKonfeksiyon();
        return;
    }

    if (mode === 'KONFEKSIYON_PLANLAMA') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = "KONFEKSİYON PLANLAMA";
        renderKonfeksiyonPlanlama();
        if (konfeksiyonSiparisId) {
            (async () => {
                try {
                    await sbKdGet(konfeksiyonSiparisId, 'KD_KONFEKSIYON', true);
                    await sbKdGet(konfeksiyonSiparisId, 'KD_DOKUMA', true);
                    await sbKdGet(konfeksiyonSiparisId, 'KD_URUN_AGACI', true);
                    await konfLoadIslemLog(konfeksiyonSiparisId);
                    renderKonfeksiyonPlanlama();
                } catch (e) { console.warn('Konfeksiyon planlama ön yükleme:', e?.message || e); }
            })();
        }
        konfStartLiveSync();
        return;
    }

    if (mode === 'MUHASEBE_FIS') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = 'MUHASEBE TESLİM FİŞLERİ';
        if (toggleArea) toggleArea.style.display = 'none';
        if (typeof renderMuhasebeFisListe === 'function') await renderMuhasebeFisListe({ force: true });
        else if (mainList) mainList.innerHTML = '<div class="sayim-bos">Muhasebe fiş modülü yüklenemedi.</div>';
        return;
    }

    if (mode === 'STOK_SAYIM') {
        if (formContainer) formContainer.style.display = 'none';
        if (listTitle) listTitle.innerText = 'STOK SAYIM';
        if (toggleArea) toggleArea.style.display = 'none';
        if (typeof renderStokSayim === 'function') renderStokSayim();
        else if (mainList) mainList.innerHTML = '<div class="sayim-bos">Stok sayım modülü yüklenemedi.</div>';
        return;
    }

    /* Mobil SALT OKUNUR: stok ekranlarında işlem girişi formu hiç çizilmez.
       Eskiden çiziliyordu; telefonda 850 piksellik boş form listenin üstünü kaplıyor,
       kullanıcı stoğu görmek için ekranı aşağı kaydırmak zorunda kalıyordu
       (kullanıcı, 20.09.2026: "stoklarda çok rahatsız edici bir görsel var").
       Tek yazma ekranı STOK_SAYIM'dır ve o yukarıda kendi dalında döner. */
    const hideFormModes = ['KART_LISTE', 'SIPARIS_LISTE', 'SIPARIS_KAPANAN', 'DEPO_HAREKET_LISTE',
        'IPLIK', 'KUMAS', 'HAM_KUMAS', 'MAMUL_KUMAS', 'MAMUL_DEPO'];
    if (formContainer) {
        formContainer.style.display = hideFormModes.includes(mode) ? 'none' : 'block';
    }

    if (listTitle) {
        if (mode === 'DEPO_HAREKET_LISTE') listTitle.innerText = 'DETAYLI HAREKET LİSTESİ';
        else if (mode === 'SIPARIS_LISTE') listTitle.innerText = 'AÇIK SİPARİŞLER';
        else if (mode === 'SIPARIS_KAPANAN') listTitle.innerText = 'KAPANAN SİPARİŞLER';
        else listTitle.innerText = mode.includes('LISTE') ? "KAYITLI ARŞİV LİSTESİ" : "HAREKET KAYITLARI";
    }

    // Liste-only modlarda ağır form şablonunu yeniden kurma
    if (!hideFormModes.includes(mode)) {
        renderInputs();
    } else {
        const grid = document.getElementById('inputs-grid');
        const notesContainer = document.getElementById('notes-container');
        if (grid) { grid.innerHTML = ''; grid.classList.remove('numune-layout'); }
        if (notesContainer) notesContainer.innerHTML = '';
    }
    if (mode === 'SIPARIS_LISTE' || mode === 'SIPARIS_KAPANAN') {
        siparisListeFilterPanelKur({ skipLoad: true });
    }
    loadData();
    if (['SIPARIS_LISTE', 'SIPARIS_KAPANAN', 'SIPARIS_GIRIS'].includes(mode)) {
        syncAllData(false, { silent: true, tables: ['siparisler'], light: true })
            .then(() => {
                if (appMode !== mode) return;
                if (mode === 'SIPARIS_GIRIS' && !editingId) syncSiparisNoInput();
                loadData();
            })
            .catch(e => console.warn('Sipariş listesi yenileme:', e?.message || e));
    }
    if (['MAMUL_DEPO', 'KUMAS', 'HAM_KUMAS', 'MAMUL_KUMAS', 'IPLIK', 'DEPO_HAREKET_LISTE'].includes(mode)) {
        const tables = mode === 'IPLIK' ? ['iplik_stok'] : ['kumas_stok', 'kumas_kutuphanesi'];
        syncAllData(false, { silent: true, tables, light: true, skipScreenRefresh: true, skipSummary: true })
            .then(() => { if (appMode === mode && typeof loadData === 'function') loadData(); })
            .catch(e => console.warn('Stok listesi yenileme:', e?.message || e));
    }
    if (depoHizliHareketBekleyen) setTimeout(() => depoHizliHareketBekleyenUygula(), 50);
    if (erpListePollModMu()) erpStartListeDataPoll();
    else erpStopListeDataPoll();
    try { syncMamulMobilFab(); } catch (e) {}
}

// ============================================================
// renderInputs — Tüm if/else if zinciri doğru kapatıldı
// ============================================================
// --- renderInputs SONU ---

// ============================================================
// loadData — Tüm modlar için, doğru kapatılmış tek fonksiyon
// ============================================================
function loadData(opts) {
    opts = opts || {};
    const list = document.getElementById('main-list');
    const filterPanel = document.getElementById('filter-panel');
    if (!list) return;

    // Özel ekranlarda (üretim girişi, planlama, konfeksiyon…) liste renderı içeriği siler → beyaz sayfa.
    if (!erpModeLoadDataGuvenliMi(appMode)) return;

    depoStokListeChromeUygula();
    iplikStokListeChromeUygula();

    const searchInput = document.getElementById('search');
    const iplikFiltreEl = document.getElementById('iplik-filtre-iplik_no');
    if (iplikFiltreEl) iplikStokFiltreDomOku();
    let s = searchInput ? searchInput.value.toLowerCase().trim() : '';
    if (appMode === 'IPLIK' || (appMode === 'DEPO_HAREKET' && depoKomutaHedef === 'IPLIK')) {
        s = '';
    }

    if (appMode === 'DEPO_HAREKET_LISTE') {
        renderDepoHareketDefteri();
        return;
    }

    if (appMode === 'DEPO_HAREKET' && !depoKomutaHedef) {
        list.innerHTML = `<div class="panel-box" style="padding:24px;margin-top:8px;text-align:center;color:var(--text2);font-size:12px;line-height:1.5">Hareket listesi, stok grubunu seçtikten sonra görünür.<br><span style="font-size:10px;color:var(--text3)">İplik, kumaş veya mamül seçin.</span></div>`;
        currentData = [];
        return;
    }

    let table = 'kumas_stok';
    if (appMode.includes('SIPARIS')) table = 'siparisler';
    else if (appMode === 'KART_LISTE') {
        if (archiveTab === 'IPLIK') table = 'iplik_stok';
        else table = 'kumas_kutuphanesi';
    }
    else if (['KART_GIRIS', 'KUMAS_KART_GIRIS', 'MAMUL_KART_GIRIS'].includes(appMode)) table = 'kumas_kutuphanesi';
    else if (appMode === 'IPLIK_KART_GIRIS') table = 'iplik_stok';
    else if (appMode === 'DEPO_HAREKET' && depoKomutaHedef === 'IPLIK') table = 'iplik_stok';
    else if (appMode === 'DEPO_HAREKET' && (kumasFormGrubuMu(depoKomutaHedef) || depoKomutaHedef === 'MAMUL_DEPO')) table = 'kumas_stok';
    else if (['IPLIK', 'BOYAHANE_URETIM', 'DOKUMA_URETIM', 'KONFEKSIYON_URETIM', 'AKSESUAR_URETIM'].includes(appMode)) table = 'iplik_stok';
    else if (appMode === 'MAMUL_DEPO') table = 'kumas_stok';

    let baseData = dataCache[table] || [];

    // --- ARŞİV SEKMELERİ (Stok Kartları) — grup seçimi özet kartlarından yapılır ---
    if (appMode === 'KART_LISTE') {
        if (filterPanel) {
            filterPanel.classList.add('hidden');
            const eskiTabs = document.getElementById('archive-tabs');
            if (eskiTabs) eskiTabs.remove();
        }
    }

    /* İplik / Kumaş / Mamül stok listeleri ANA PROGRAMLA BİREBİR aynı blok
       (src/stok/js/07-render.js loadData) — tek fark masaustu:false: aynı
       paylaşılan ekranın telefon sürümü. Mobilin eski kendi iplik listesi
       kaldırıldı; üç ekran artık aynı tasarım ve aynı kullanım. */
    // --- KUMAŞ DEPO GRUPLAMA — yalnızca SM/NU kumaş kartları, sipariş artığı kodlar hariç ---
    if (table === 'kumas_stok' && (appMode === 'KUMAS' || (appMode === 'DEPO_HAREKET' && depoKomutaHedef === 'KUMAS'))) {
        const fabricData = baseData.filter(x =>
            kumasStokHareketiKumasDepoMu(x) &&
            (typeof kumasDepoStokKoduMu !== 'function' || kumasDepoStokKoduMu(x.stok_kodu))
        );
        if (!opts.kumasBodyOnly) {
            window._kumasStokGrpsHam = typeof kumasStokListeGruplariOlustur === 'function'
                ? kumasStokListeGruplariOlustur(fabricData)
                : [];
        }
        kumasStokListeFiltre = typeof stokListeFiltreOku === 'function'
            ? stokListeFiltreOku('kumas-stok-f', kumasStokListeFiltre)
            : { ...kumasStokListeFiltre, q: String(kumasStokListeAra || searchInput?.value || '').trim() };
        kumasStokListeAra = kumasStokListeFiltre.q;
        saveUiState({ kumasStokListeFiltre });
        const araMetin = kumasStokListeFiltre.q.toLowerCase().trim();
        const filtrePaket = typeof kumasStokListeFiltreliGruplar === 'function'
            ? kumasStokListeFiltreliGruplar(window._kumasStokGrpsHam || [], araMetin, window.kumasStokHizliFiltre || 'POZITIF', kumasStokListeFiltre)
            : null;
        const grps = filtrePaket ? filtrePaket.grps : [];
        const ozet = filtrePaket
            ? { netKg: filtrePaket.topNet, netMt: filtrePaket.topNetMt, filtre: filtrePaket.filtre, sayac: filtrePaket.sayac, ara: kumasStokListeFiltre.q, filtreObj: kumasStokListeFiltre }
            : { netKg: 0, netMt: 0, filtre: 'POZITIF', sayac: {}, ara: kumasStokListeFiltre.q, filtreObj: kumasStokListeFiltre };
        if (opts.kumasBodyOnly && document.getElementById('kumas-stok-shell')) {
            const dyn = document.getElementById('kumas-stok-dynamic');
            if (dyn && typeof kumasStokListeDynamicHtml === 'function') {
                dyn.innerHTML = kumasStokListeDynamicHtml(grps, ozet, { rowFn: 'showKumasGroupDetail', masaustu: false });
            }
            if (typeof kumasStokListeOzetDomGuncelle === 'function') kumasStokListeOzetDomGuncelle(ozet);
            window._kumasGroups = grps;
            currentData = fabricData;
            return;
        }
        const html = typeof kumasStokListeEkranHtml === 'function'
            ? kumasStokListeEkranHtml(grps, ozet, { rowFn: 'showKumasGroupDetail', masaustu: false, filtreObj: kumasStokListeFiltre })
            : '';

        list.innerHTML = html;
        window._kumasGroups = grps;
        currentData = fabricData;
        return;
    }

    // --- MAMUL DEPO GRUPLAMA (stok kodu bazında net bakiye) — sadece mamül hareketleri ---
    if (table === 'kumas_stok' && (appMode === 'MAMUL_DEPO' || (appMode === 'DEPO_HAREKET' && depoKomutaHedef === 'MAMUL_DEPO'))) {
        const mamulData = baseData.filter(kumasStokHareketiMamulDepoMu);
        if (!opts.mamulBodyOnly) {
            window._mamulStokGrpsHam = typeof mamulStokHamGruplariOlustur === 'function'
                ? mamulStokHamGruplariOlustur(mamulData)
                : [];
        }
        mamulStokListeFiltre = typeof stokListeFiltreOku === 'function'
            ? stokListeFiltreOku('mamul-stok-f', mamulStokListeFiltre)
            : { ...mamulStokListeFiltre, q: String(mamulStokListeAra || searchInput?.value || '').trim() };
        mamulStokListeAra = mamulStokListeFiltre.q;
        saveUiState({ mamulStokListeFiltre });
        const araMetin = mamulStokListeFiltre.q.toLowerCase().trim();
        const filtrePaket = typeof mamulStokListeFiltreliGruplar === 'function'
            ? mamulStokListeFiltreliGruplar(window._mamulStokGrpsHam || [], araMetin, mamulStokHizliFiltre || 'POZITIF', mamulStokListeFiltre)
            : null;
        let mGrps = filtrePaket ? filtrePaket.grps : [];
        mGrps.forEach(g => { g.adet = g.net_ad; });
        const mTopNet = filtrePaket ? filtrePaket.topNet : 0;
        const ozet = filtrePaket
            ? { netAd: mTopNet, filtre: filtrePaket.filtre, sayac: filtrePaket.sayac, ara: mamulStokListeFiltre.q, filtreObj: mamulStokListeFiltre }
            : { netAd: 0, filtre: mamulStokHizliFiltre, sayac: {}, ara: mamulStokListeFiltre.q, filtreObj: mamulStokListeFiltre };
        if (opts.mamulBodyOnly && document.getElementById('mamul-stok-shell')) {
            const dyn = document.getElementById('mamul-stok-dynamic');
            if (dyn && typeof mamulStokListeDynamicHtml === 'function') {
                dyn.innerHTML = mamulStokListeDynamicHtml(mGrps, ozet, { rowFn: 'mamulDepoSatirTikla', masaustu: false });
            }
            if (typeof mamulStokListeOzetDomGuncelle === 'function') mamulStokListeOzetDomGuncelle(ozet);
            window._mamulGroups = mGrps;
            currentData = mamulData.filter(x => {
                const kod = (x.stok_kodu || '').trim();
                return kod && kod !== 'KODSUZ' && depoMamulStokKartiDogrula(kod) === null;
            });
            return;
        }
        const mHtml = typeof mamulStokListeEkranHtml === 'function'
            ? mamulStokListeEkranHtml(mGrps, ozet, { rowFn: 'mamulDepoSatirTikla', pdf: true, masaustu: false, filtreObj: mamulStokListeFiltre })
            : '';

        list.innerHTML = mHtml;
        window._mamulGroups = mGrps;
        currentData = mamulData.filter(x => {
            const kod = (x.stok_kodu || '').trim();
            return kod && kod !== 'KODSUZ' && depoMamulStokKartiDogrula(kod) === null;
        });
        return;
    }

    // --- İPLİK DEPO GRUPLAMA (Kumaş / Mamül ms-ekran) ---
    if (table === 'iplik_stok' && (appMode === 'IPLIK' || (appMode === 'DEPO_HAREKET' && depoKomutaHedef === 'IPLIK'))) {
        if (!opts.iplikBodyOnly) {
            window._iplikStokGrpsHam = typeof iplikStokListeGruplariOlustur === 'function'
                ? iplikStokListeGruplariOlustur(baseData)
                : [];
        }
        iplikStokListeFiltre = typeof stokListeFiltreOku === 'function'
            ? stokListeFiltreOku('iplik-stok-f', iplikStokListeFiltre)
            : { ...iplikStokListeFiltre, q: String(iplikStokListeAra || searchInput?.value || '').trim() };
        iplikStokListeAra = iplikStokListeFiltre.q;
        saveUiState({ iplikStokListeFiltre });
        const araMetin = iplikStokListeFiltre.q.toLowerCase().trim();
        const filtrePaket = typeof iplikStokListeFiltreliGruplar === 'function'
            ? iplikStokListeFiltreliGruplar(window._iplikStokGrpsHam || [], araMetin, window.iplikStokHizliFiltre || 'POZITIF', iplikStokListeFiltre)
            : null;
        const grps = filtrePaket ? filtrePaket.grps : [];
        const ozet = filtrePaket
            ? { netKg: filtrePaket.topNet, filtre: filtrePaket.filtre, sayac: filtrePaket.sayac, ara: iplikStokListeFiltre.q, filtreObj: iplikStokListeFiltre }
            : { netKg: 0, filtre: 'POZITIF', sayac: {}, ara: iplikStokListeFiltre.q, filtreObj: iplikStokListeFiltre };
        if (opts.iplikBodyOnly && document.getElementById('iplik-stok-shell')) {
            const dyn = document.getElementById('iplik-stok-dynamic');
            if (dyn && typeof iplikStokListeDynamicHtml === 'function') {
                dyn.innerHTML = iplikStokListeDynamicHtml(grps, ozet, { rowFn: 'showIplikGroupDetailByObject', masaustu: false });
            }
            if (typeof iplikStokListeOzetDomGuncelle === 'function') iplikStokListeOzetDomGuncelle(ozet);
            window._iplikGroups = grps;
            currentData = grps;
            return;
        }
        const html = typeof iplikStokListeEkranHtml === 'function'
            ? iplikStokListeEkranHtml(grps, ozet, { rowFn: 'showIplikGroupDetailByObject', masaustu: false, filtreObj: iplikStokListeFiltre })
            : '';
        list.innerHTML = html;
        window._iplikGroups = grps;
        currentData = grps;
        return;
    }

    // --- GENEL FİLTRELEME --- (ana programla birebir: src/stok/js/07-render.js loadData)
    // Bu blok mobilde yoktu: currentData sekmeye göre süzülmediği için "Mamül ana kart"
    // sekmesinde iplik ve kumaş kartları da listeleniyordu (kullanıcı, 20.09.2026).
    currentData = baseData.filter(i => {
        const searchMatch = (() => {
            if (table === 'siparisler') {
                return siparisListeTekAramaEslesir(i);
            }
            if (!s) return true;
            if (typeof erpRowSearchIdx === 'function') return erpRowSearchIdx(i).includes(s);
            if (!i._search_idx) i._search_idx = JSON.stringify(i).toLowerCase();
            return i._search_idx.includes(s);
        })();
        const sKodu = (i.stok_kodu || i.desen_kodu || "").toString().toUpperCase().trim();

        let areaMatch = false;
        if (appMode === 'KART_LISTE') {
            if (archiveTab === 'IPLIK') {
                const ipKodu = (i.stok_kodu || "").toString().toUpperCase().trim();
                areaMatch = ipKodu.startsWith('IP-') || ipKodu === '' || !!i.iplik_no;
            } else if (archiveTab === 'KUMAS') {
                areaMatch = /^(SM|NU)/i.test(sKodu) && i.ana_grup !== 'MAMUL';
            } else if (archiveTab === 'MAMUL') {
                areaMatch = typeof kumasKutuphanesiKartiMamulMu === 'function' && kumasKutuphanesiKartiMamulMu(i);
            } else if (archiveTab === 'TUMU') {
                areaMatch = false;
            }
        } else {
            areaMatch = true;
        }
        return searchMatch && areaMatch;
    }).sort((a, b) => {
        if (table === 'siparisler') return compareSiparisNo(a.sno, b.sno);
        return new Date(b.created_at) - new Date(a.created_at);
    });

    // --- İPLİK ARŞİVİ: kart listesi ---
    if (appMode === 'KART_LISTE' && archiveTab === 'IPLIK') {
        const existingChart = document.getElementById('iplik-grafik-container');
        if (existingChart) existingChart.remove();
        currentData = iplikKartlariListe().filter(i => {
            if (!s) return true;
            const lotlar = (typeof iplikKartLotlariAl === 'function' ? iplikKartLotlariAl(i) : []).map(l => l.lot_no).join(' ');
            const blob = [i.stok_kodu, i.iplik_no, i.marka, i.cins, i.lot_no, i.renk, i.kalite, lotlar].join(' ').toLowerCase();
            return blob.includes(s);
        });
    } else {
        const existingChart = document.getElementById('iplik-grafik-container');
        if (existingChart) existingChart.remove();
    }

    if (table === 'siparisler' && appMode === 'SIPARIS_KAPANAN') {
        currentData = currentData.filter(i => String(i.durum || '').toUpperCase() === 'TAMAMLANDI');
    }
    if (table === 'siparisler' && appMode === 'SIPARIS_LISTE') {
        currentData = currentData.filter(i => String(i.durum || '').toUpperCase() !== 'TAMAMLANDI');
    }
    if (table === 'siparisler' && (appMode === 'SIPARIS_LISTE' || appMode === 'SIPARIS_KAPANAN')) {
        currentData = siparisListeSirala(currentData);
    }
    /* Kapanan siparişler — ana programla aynı: son kapanan üstte, ilk 10 (+10 düğmesi), aramada tümü. */
    let siparisKapananToplam = 0;
    let siparisKapananGosterilen = 0;
    const siparisKapananAramaAktif = table === 'siparisler' && appMode === 'SIPARIS_KAPANAN' && siparisKapananAramaAktifMi();
    if (table === 'siparisler' && appMode === 'SIPARIS_KAPANAN') {
        siparisKapananToplam = currentData.length;
        currentData = siparisKapananSonKapanisSirala(currentData);
        if (!siparisKapananAramaAktif) {
            siparisKapananGosterilen = Math.min(siparisKapananListeLimitOku(), currentData.length);
            currentData = currentData.slice(0, siparisKapananGosterilen);
        }
    }

    const siparisHizliSayac = (table === 'siparisler' && appMode === 'SIPARIS_LISTE')
        ? siparisListeHizliSayacHesapla(currentData)
        : { hepsi: 0, planda: 0, beklemede: 0, dokuma: 0, uretimde: 0, konfeksiyon: 0, sevk: 0, geciken: 0, yakin: 0 };
    if (table === 'siparisler' && appMode === 'SIPARIS_LISTE') {
        currentData = currentData.filter(i => {
            const d = siparisDurumNorm(i.durum);
            if (siparisListeHizliFiltre === 'PLANDA') return d === 'PLANDA';
            if (siparisListeHizliFiltre === 'BEKLEMEDE') return d === 'BEKLEMEDE';
            if (siparisListeHizliFiltre === 'DOKUMA') return d === 'DOKUMA';
            if (siparisListeHizliFiltre === 'URETIMDE') return d === 'ÜRETİMDE' || d === 'DEVAM';
            if (siparisListeHizliFiltre === 'KONFEKSIYON') return d === 'KONFEKSIYON';
            if (siparisListeHizliFiltre === 'SEVK') return d === 'SEVK';
            if (siparisListeHizliFiltre === 'GECIKEN') return siparisTerminGecikmisMi(i);
            if (siparisListeHizliFiltre === 'YAKLASAN') return siparisTerminYakinMi(i);
            return true;
        });
    }

    const mamulListeBaslik = '';
    const stokKartAksiyonBaslik = (appMode === 'KART_LISTE') ? stokKartListeOzetHtml() : '';
    const iplikKartListeBaslik = (appMode === 'KART_LISTE' && archiveTab === 'IPLIK') ? `
        <div class="panel-box" style="padding:10px 12px;margin-bottom:10px;border:1px solid var(--border)">
            <div style="font-size:9px;font-weight:700;color:var(--accent2);text-transform:uppercase;letter-spacing:0.08em;font-family:'DM Mono',monospace;margin-bottom:8px">İplik stok kartları</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
                <button type="button" onclick="setAppMode('IPLIK')" class="pill pill-blue" style="cursor:pointer;border:none;padding:6px 12px">📦 İplik stoğu</button>
                <span style="font-size:9px;color:var(--text3);margin-left:4px">Bakiye sütunu tüm hareketlerin toplamıdır · Hareket için iplik stoğunda lot seçin</span>
            </div>
        </div>
        ${iplikKartListeTabloBaslikHtml()}` : '';
    /* Kumaş kartlarında TÜR (ham / mamül kumaş) seçimi KALDIRILDI — ana programla aynı
       (kullanıcı, 20.09.2026: "kumaş stok kartları hepsi bir yerde olacak, mamül kumaş
        ham kumaş aynı olacak; mamül ürün ayrı"). Mamül ÜRÜN kartları MAMÜL ANA KART sekmesinde. */
    const kumasListeBaslik = (appMode === 'KART_LISTE' && archiveTab === 'KUMAS') ? `
        ${kumasKartListeTabloBaslikHtml()}` : '';

    const siparisListeBaslik = ((appMode === 'SIPARIS_LISTE' || appMode === 'SIPARIS_KAPANAN') && table === 'siparisler') ? `
        ${siparisListeAramaToolbarHtml(siparisHizliSayac)}
        <div class="siparis-liste-baslik siparis-liste-baslik--kolon" style="pointer-events:auto;user-select:auto" role="presentation">
            <div class="siparis-lc-no"><span onclick="siparisListeToggleSiralama('sno')" style="cursor:pointer">Sipariş no ${siparisListeSortIcon('sno')}</span></div>
            <div class="siparis-lc-firma"><span onclick="siparisListeToggleSiralama('firma')" style="cursor:pointer">Müşteri ${siparisListeSortIcon('firma')}</span></div>
            <div class="siparis-lc-ozet"><span onclick="siparisListeToggleSiralama('ozet')" style="cursor:pointer">Özet sipariş ${siparisListeSortIcon('ozet')}</span></div>
            <div class="siparis-lc-adet" style="text-align:right"><span onclick="siparisListeToggleSiralama('adet')" style="cursor:pointer">Toplam ${siparisListeSortIcon('adet')}</span></div>
            <div class="siparis-lc-termin" style="text-align:right"><span onclick="siparisListeToggleSiralama('termin')" style="cursor:pointer">Termin ${siparisListeSortIcon('termin')}</span></div>
            <div class="siparis-lc-gecmis"><span onclick="siparisListeToggleSiralama('grup')" style="cursor:pointer">Ürün Grubu ${siparisListeSortIcon('grup')}</span></div>
        </div>` : '';

    let stokKartGrupluHtml = '';
    let mamulListeGrupluHtml = '';
    if (appMode === 'KART_LISTE' && archiveTab === 'TUMU') {
        const sLower = (document.getElementById('search')?.value || '').toLowerCase().trim();
        const iplikRows = iplikKartlariListe().filter(i => stokKartAramaEslesir(i, sLower));
        const lib = dataCache.kumas_kutuphanesi || [];
        const kumasRows = lib.filter(i => stokKartGrupEslesir(i, 'KUMAS') && stokKartAramaEslesir(i, sLower))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const mamulRows = lib.filter(i => {
            if (!stokKartGrupEslesir(i, 'MAMUL') || !stokKartAramaEslesir(i, sLower)) return false;
            const birlesik = { ...mamulKartAramaFiltre, q: [sLower, mamulKartAramaFiltre.q].filter(Boolean).join(' ').trim() };
            return mamulKartDetayliEslestir(i, birlesik);
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        stokKartGrupluHtml = stokKartGrupluListeHtml(iplikRows, kumasRows, mamulRows);
        currentData = window._stokKartTumuCurrentData || [];
    }

    let mamulListeToolbarHtml = '';
    if (appMode === 'KART_LISTE' && archiveTab === 'MAMUL') {
        const mamulGruplar = mamulKartListeGruplariFiltrele(mamulKartListeGruplariOlustur(currentData));
        const mamulTopluPanel = typeof mamulTopluTemizlemePanelHtml === 'function' ? mamulTopluTemizlemePanelHtml() : '';
        mamulListeToolbarHtml = mamulTopluPanel + mamulKartListeToolbarHtml(mamulGruplar.length) + mamulStokListeTabloBaslikHtml();
        mamulListeGrupluHtml = mamulGruplar.map(mamulStokListeGrupSatirHtml).join('');
    }

    let listeHtml = siparisListeBaslik + stokKartAksiyonBaslik + iplikKartListeBaslik + kumasListeBaslik + mamulListeBaslik + mamulListeToolbarHtml;
    if (appMode === 'KART_LISTE' && archiveTab === 'TUMU') {
        listeHtml += stokKartGrupluHtml;
    } else if (appMode === 'KART_LISTE' && archiveTab === 'MAMUL') {
        listeHtml += mamulListeGrupluHtml;
    } else {
    listeHtml += currentData.map((i, idx) => {
        if (table === 'siparisler') {
            return siparisListeSatirHtml(i, idx);
        }
        if (appMode === 'KART_LISTE' && archiveTab === 'KUMAS' && String(i.desen_kodu || '').toUpperCase().startsWith('SM')) {
            return kumasKartListeSatirHtml(i, idx);
        }
        if (appMode === 'KART_LISTE' && archiveTab === 'IPLIK') {
            return iplikKartListeSatirHtml(i, idx);
        }
        if (appMode === 'KART_LISTE' && archiveTab === 'MAMUL') {
            return mamulStokListeSatirHtml(i, idx);
        }
        const _isIP  = i.desen_kodu?.startsWith('IP-') || !!i.iplik_no;
        const _isSM  = i.desen_kodu?.startsWith('SM');
        const _isMA  = i.ana_grup === 'MAMUL' || mamulStokKoduFormatMi(i.desen_kodu);
        const _mamulKart = appMode === 'KART_LISTE' && archiveTab === 'MAMUL';
        const _mamulKod = String(i.desen_kodu || i.stok_kodu || '').trim();
        const _mamulBak = _mamulKart && _mamulKod ? depoMamulBakiyeHesapla(_mamulKod) : null;
        const _icon  = _isIP ? '🧶' : _isSM ? '🏁' : _isMA ? '🧥' : '📦';
        const _bClr  = _isIP ? '#818cf8' : _isSM ? '#34d399' : _isMA ? '#fb923c' : '#94a3b8';
        const _pill  = _isIP ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                     : _isSM ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                     : _isMA ? 'bg-orange-50 text-orange-600 border-orange-100'
                     : 'bg-slate-50 text-slate-500 border-slate-100';
        const _iconBg = _isIP ? 'bg-indigo-50' : _isSM ? 'bg-emerald-50' : _isMA ? 'bg-orange-50' : 'bg-slate-50';
        const _kg    = i.miktar_kg !== undefined ? Math.abs(i.miktar_kg||0) : null;
        const _neg   = (i.miktar_kg||0) < 0;
        const _isArsiv = (table === 'kumas_kutuphanesi');
        const _pillCls = _isIP ? 'pill-blue' : _isSM ? 'pill-green' : _isMA ? 'pill-amber' : 'pill-gray';
        const _mamulBakTxt = _mamulBak ? ([
            Math.abs(_mamulBak.kg) > 1e-6 ? _mamulBak.kg.toFixed(1) + ' kg' : null,
            Math.abs(_mamulBak.mt) > 1e-6 ? _mamulBak.mt.toFixed(1) + ' mt' : null,
            _mamulBak.adet ? _mamulBak.adet + ' ad' : null,
        ].filter(Boolean).join(' · ') || '0') : '0';
        const _mamulBakClr = _mamulBak && _mamulBak.kg > 0 ? 'var(--emerald-c)' : (_mamulBak && _mamulBak.kg < 0 ? 'var(--rose-c)' : 'var(--text3)');
        const _skEsc = erpAttr(_mamulKod);
        const _mamulNu = numuneNotTagOku(i.notlar, 'NUMUNE_KAYNAK');
        const _mamulSm = numuneNotTagOku(i.notlar, 'URUN_KIMLIK');
        return `<div class="record-item record-item--liste-gecmis" style="border-left-color:${_bClr}">
            <div class="record-item-gecmis-hit" onclick="showDetail(${idx})">
            <div style="display:flex;align-items:center;gap:10px;min-width:0">
                <div style="width:36px;height:36px;border-radius:9px;overflow:hidden;border:1px solid var(--border);flex-shrink:0;background:var(--surface2)">
                    ${i.fotograf ? `<img src="${i.fotograf}" style="width:100%;height:100%;object-fit:cover">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:16px">${_icon}</div>`}
                </div>
                <div style="min-width:0">
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                        <span class="pill ${_pillCls}">${i.desen_kodu||i.stok_kodu||'KODSUZ'}</span>
                        <span style="font-size:12px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pdfEsc(stokKartListeAdMetni(i))}</span>
                        ${_mamulKart ? `<span class="pill ${_mamulBak && _mamulBak.kg > 0 ? 'pill-green' : (_mamulBak && _mamulBak.kg <= 0 ? 'pill-red' : 'pill-gray')}" style="font-size:8px">Depo: ${_mamulBakTxt}</span>` : ''}
                        ${_mamulKart && _mamulNu ? `<span class="pill pill-cyan" style="font-size:8px">NU: ${pdfEsc(_mamulNu)}</span>` : ''}
                        ${_mamulKart && _mamulSm ? `<span class="pill pill-green" style="font-size:8px">SM: ${pdfEsc(_mamulSm)}</span>` : ''}
                    </div>
                    <div style="font-size:10px;color:var(--text3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.firma||i.marka||'—'} · ${i.kumas_cinsi||i.cins||'—'}</div>
                </div>
            </div>
            <div style="text-align:right;flex-shrink:0;margin-left:12px">
                ${_mamulKart && _mamulBak
                    ? `<div style="font-family:'Instrument Serif',serif;font-size:18px;color:${_mamulBakClr};line-height:1">${_mamulBakTxt}</div><div style="font-size:9px;color:var(--text3);font-family:'DM Mono',monospace">depo bakiye</div>`
                    : _isArsiv
                    ? `<span class="pill pill-gray">ARŞİV</span>`
                    : `<div style="font-family:'Instrument Serif',serif;font-size:20px;color:${_neg?'var(--rose-c)':'var(--text)'};line-height:1">${_kg!==null?_kg.toLocaleString():'—'}</div><div style="font-size:9px;color:var(--text3);font-family:'DM Mono',monospace">kg</div>`}
                <div style="font-size:9px;color:var(--text3);font-family:'DM Mono',monospace;margin-top:2px">${new Date(i.created_at).toLocaleDateString('tr-TR')}</div>
            </div>
            </div>
            ${_mamulKart && _mamulKod ? `
            <div style="display:flex;flex-direction:column;gap:4px;flex-shrink:0">
                <button type="button" onclick="event.stopPropagation();depoHizliHareketBaslat('MAMUL_DEPO','GİRİŞ','${_skEsc}')" title="Giriş" style="padding:4px 8px;border-radius:6px;border:1px solid rgba(52,211,153,0.35);background:rgba(52,211,153,0.08);color:var(--emerald-c);cursor:pointer;font-size:10px;font-weight:700">📥</button>
                <button type="button" onclick="event.stopPropagation();depoHizliHareketBaslat('MAMUL_DEPO','ÇIKIŞ','${_skEsc}')" title="Sevkiyat" style="padding:4px 8px;border-radius:6px;border:1px solid rgba(251,113,133,0.35);background:rgba(251,113,133,0.08);color:var(--rose-c);cursor:pointer;font-size:10px;font-weight:700">📤</button>
                <button type="button" onclick="event.stopPropagation();depoDefterStokKoduFiltrele('${_skEsc}')" title="Defter" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);background:var(--surface2);color:var(--text2);cursor:pointer;font-size:10px;font-weight:700">📋</button>
            </div>` : `<button type="button" class="liste-gecmis-btn" onclick="event.stopPropagation(); showDetailOpenGecmis(${idx})" title="Kayıt geçmişi">Geçmiş</button>`}
        </div>`;
    }).join('');
    }
    if (appMode === 'KART_LISTE' && archiveTab === 'KUMAS') listeHtml += '</div>';
    if (appMode === 'KART_LISTE' && archiveTab === 'IPLIK') listeHtml += '</div>';
    if (appMode === 'KART_LISTE' && archiveTab === 'MAMUL') listeHtml += mamulStokListeTabloKapatHtml();
    if (table === 'siparisler' && appMode === 'SIPARIS_KAPANAN' && !siparisKapananAramaAktif) {
        listeHtml += siparisKapananDahaFazlaHtml(siparisKapananGosterilen, siparisKapananToplam);
    }
    list.innerHTML = listeHtml;
    if (appMode === 'KART_LISTE' && archiveTab === 'MAMUL' && typeof mamulTopluTemizlemePanelInit === 'function') mamulTopluTemizlemePanelInit();
    if (appMode === 'KART_LISTE' && archiveTab === 'MAMUL' && window._mamulKartFiltreFocus?.id) {
        const el = document.getElementById(window._mamulKartFiltreFocus.id);
        if (el) {
            el.focus();
            const p = window._mamulKartFiltreFocus.pos;
            if (typeof p === 'number') {
                const safe = Math.max(0, Math.min(p, String(el.value || '').length));
                el.setSelectionRange(safe, safe);
            }
        }
    }
    /* Kaynağı: erp-core.js aynı bloğu window._siparisAramaFocus yazar (siparisListePanelFiltreAlan).
       Bu dosya daha önce farklı adlarla (_siparisPanelFocus / _siparisKolonFocus) okuyordu — hiçbiri
       hiç yazılmadığı için mobilde odak hiç geri gelmiyordu, her harften sonra alan yeniden seçilmek
       zorunda kalınıyordu. */
    if (window._siparisAramaFocus && table === 'siparisler' && (appMode === 'SIPARIS_LISTE' || appMode === 'SIPARIS_KAPANAN')) {
        const el = document.getElementById('f-siparis-q');
        if (el) {
            el.focus();
            const p = window._siparisAramaFocus.pos;
            if (typeof p === 'number' && typeof el.setSelectionRange === 'function') {
                const safe = Math.max(0, Math.min(p, String(el.value || '').length));
                el.setSelectionRange(safe, safe);
            }
        }
        window._siparisAramaFocus = null;
    }
}

// ============================================================
// showKumasGroupDetail — Kumaş stok kodu bazlı hareket detayı
// ============================================================
window.iplikCikisSecim = function(secim) {
    // hidden input'a yaz
    const hiddenInput = document.getElementById('val-cikis-yeri');
    if (hiddenInput) hiddenInput.value = secim;

    // Radio buton stillerini güncelle
    IPLIK_CIKIS_SECENEKLER.forEach((opt, i) => {
        const label = document.getElementById('cikis-opt-' + i);
        const radio = document.getElementById('cikis-radio-' + i);
        const dot   = document.getElementById('cikis-dot-' + i);
        if (!label) return;
        if (opt === secim) {
            label.classList.add('border-violet-500', 'bg-violet-50');
            label.classList.remove('border-slate-100');
            if (radio) { radio.classList.add('border-violet-500'); radio.classList.remove('border-slate-200'); }
            if (dot)   { dot.classList.add('bg-violet-500'); dot.classList.remove('bg-transparent'); }
        } else {
            label.classList.remove('border-violet-500', 'bg-violet-50');
            label.classList.add('border-slate-100');
            if (radio) { radio.classList.remove('border-violet-500'); radio.classList.add('border-slate-200'); }
            if (dot)   { dot.classList.remove('bg-violet-500'); dot.classList.add('bg-transparent'); }
        }
    });

    // SİMTEKS DOKUMA seçiliyse firma kutusu gizle, diğerlerinde göster
    const wrap = document.getElementById('wrap-cikis-detay');
    if (wrap) {
        if (secim === 'SİMTEKS DOKUMA') {
            wrap.classList.add('hidden');
            const afirma = document.getElementById('val-afirma');
            if (afirma) afirma.value = '';
        } else {
            wrap.classList.remove('hidden');
            const afirma = document.getElementById('val-afirma');
            if (afirma) { afirma.focus(); }
        }
    }
    updateIplikPreview();
};

// ============================================================
// WIZARD FONKSİYONLARI — İplik / Kumaş / Mamül
// ============================================================
function siparisKalemGecerliMi(k) {
    const adKod = String(k?.ad || k?.kod || '').trim();
    const mik = erpParseDecimal(k?.miktar);
    return adKod !== '' && mik != null && mik > 0;
}

function syncSiparisWizardChrome(step) {
    const act = document.getElementById('main-action-btn');
    if (appMode !== 'SIPARIS_GIRIS') {
        document.body.classList.remove('siparis-wizard-step-3');
        if (act) act.style.removeProperty('display');
        return;
    }
    const adim = step != null ? step : siparisWizardAktifAdim();
    document.body.classList.toggle('siparis-wizard-step-3', adim === 3);
    if (act) act.style.display = 'none';
}

function siparisWizardAktifAdim() {
    for (let s = 1; s <= 3; s++) {
        if (document.getElementById('siparis-step-' + s)?.classList.contains('active')) return s;
    }
    return 1;
}

// ── CANLI ÖNİZLEME FONKSİYONLARI ──
function siparisKayitTamGetir(i) {
    if (!i) return i;
    const hasCins = i.cins != null && String(i.cins).trim() !== '' && String(i.cins) !== '[]';
    if (hasCins) return i;
    const hit = (dataCache.siparisler || []).find(s => String(s.id) === String(i.id));
    return hit || i;
}

/** Düzenleme modunda sipariş formunu mevcut kayıtla doldurur */
function siparisFormKayitDoldur(kayit) {
    const tam = siparisKayitTamGetir(kayit);
    if (!tam) return;
    siparisFormKayitDurum = tam.durum || 'BEKLEMEDE';
    applySiparisFormuVeriToForm(siparisFormuVeriFromKayit(tam));
    const grupEl = document.getElementById('val-siparis-grubu');
    if (grupEl) grupEl.value = tam.siparis_grubu || 'EV_TEKSTILI';
    const ttEl = document.getElementById('val-ttarih');
    if (ttEl) ttEl.value = tam.ttarih || '';
    const notEl = document.getElementById('val-notlar');
    if (notEl) notEl.value = tam.notlar || '';
    siparisFotograflar = siparisFotografListesiAl(tam);
    siparisFotoRenderList();
    syncSiparisNoInput();
    siparisFormSiparisDurumUiSync();
    updateSiparisPreview();
    _wizardGo('siparis', 1, 2);
}

function siparisKalemleriKayittanOku(kayit) {
    if (!kayit) return [];
    let raw = [];
    try {
        const cins = kayit.cins ?? kayit.kalemler;
        if (typeof cins === 'string') {
            raw = JSON.parse(cins);
            if (typeof raw === 'string') raw = JSON.parse(raw);
        } else {
            raw = cins || [];
        }
    } catch (e) { raw = []; }
    if (!Array.isArray(raw)) raw = [];
    return raw.map((k, idx) => {
        if (k == null) return null;
        if (typeof k === 'string' || typeof k === 'number') {
            return { ad: String(k), miktar: '', birim: 'ADET' };
        }
        const o = typeof k === 'object' ? k : {};
        const nested = o.urun || o.urun_detay || o.detay || {};
        return {
            kod: o.kod || nested.kod || '',
            grup: o.grup || '',
            ad: o.ad || o.urun_adi || o.urunAdi || o.name || nested.ad || nested.urun_adi || '',
            desen: o.desen || o.desen_adi || nested.desen || nested.desen_adi || '',
            renk: o.renk || o.renk_adi || nested.renk || '',
            rkod: o.rkod || '',
            rkod1: o.rkod1 || '',
            rkod2: o.rkod2 || '',
            rkod3: o.rkod3 || '',
            rkod4: o.rkod4 || '',
            rkod5: o.rkod5 || '',
            rkod6: o.rkod6 || '',
            ebat: o.ebat || o.olcu || o.beden || nested.ebat || '',
            miktar: o.miktar ?? o.adet ?? o.qty ?? nested.miktar ?? '',
            birim: normalizeSiparisBirim(o.birim || o.kaynak_birim || 'ADET')
        };
    }).filter(Boolean);
}

function siparisKalemleriniFormaYukle(kayit) {
    const container = document.getElementById('siparis-kalemleri-container');
    if (!container) return;
    container.innerHTML = '';
    siparisKalemCount = 0;
    const kalemler = siparisKalemleriKayittanOku(kayit);
    if (kalemler.length) kalemler.forEach(k => addSiparisKalem(k));
    else addSiparisKalem();
}

function siparisKalemIndexFromCardId(id) {
    const m = String(id || '').match(/^item-card-(\d+)$/);
    return m ? parseInt(m[1], 10) : null;
}

function syncSiparisKalemCountFromDom() {
    const container = document.getElementById('siparis-kalemleri-container');
    if (!container) {
        siparisKalemCount = 0;
        return;
    }
    let max = 0;
    container.querySelectorAll('[id^="item-card-"]').forEach(card => {
        const idx = siparisKalemIndexFromCardId(card.id);
        if (idx != null && idx > max) max = idx;
    });
    siparisKalemCount = max;
}

function removeSiparisKalem(n) {
    const card = document.getElementById('item-card-' + n);
    if (card) card.remove();
    syncSiparisKalemCountFromDom();
    try { updateSiparisPreview(); } catch (e) {}
}

function syncAtkiRenkCountFromDom() {
    const container = document.getElementById('atki-renk-container');
    if (!container) {
        atkiRenkCount = 0;
        return;
    }
    let max = 0;
    container.querySelectorAll('input[id^="val-atki-no-"]').forEach(inp => {
        const m = String(inp.id || '').match(/^val-atki-no-(\d+)$/);
        if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    atkiRenkCount = max;
}

function removeAtkiRenkRow(btn) {
    const row = btn?.closest?.('.nu-atki-row');
    if (row) row.remove();
    syncAtkiRenkCountFromDom();
}

function collectAtkiRenkleriFromForm() {
    const container = document.getElementById('atki-renk-container');
    if (!container) return [];
    const out = [];
    const v2Liste = numuneVaryantRenkListeOku('val-v2-renk-list');
    const v3Liste = numuneVaryantRenkListeOku('val-v3-renk-list');
    const v4Liste = numuneVaryantRenkListeOku('val-v4-renk-list');
    let rowIdx = 0;
    container.querySelectorAll('.nu-atki-row').forEach(row => {
        const noInp = row.querySelector('input[id^="val-atki-no-"]');
        const idxM = String(noInp?.id || '').match(/^val-atki-no-(\d+)$/);
        const j = idxM ? parseInt(idxM[1], 10) : null;
        if (!j) return;
        const n = document.getElementById(`val-atki-no-${j}`)?.value || '';
        const c = document.getElementById(`val-atki-cins-${j}`)?.value || '';
        const r = document.getElementById(`val-atki-renk-${j}`)?.value || '';
        const s = document.getElementById(`val-atki-sayi-${j}`)?.value || '';
        const v2 = v2Liste[rowIdx] || '';
        const v3 = v3Liste[rowIdx] || '';
        const v4 = v4Liste[rowIdx] || '';
        rowIdx++;
        if (n || c || r || s || v2 || v3 || v4) out.push(`${n} - ${c} - ${r} - ${s} - ${v2} - ${v3} - ${v4}`);
    });
    syncAtkiRenkCountFromDom();
    return out;
}

function parseAtkiRenkSatiri(row) {
    const raw = String(row || '');
    const parts = raw.split(' - ').map(x => String(x || '').trim());
    return {
        no: parts[0] || '',
        cins: parts[1] || '',
        renk: parts[2] || '',
        sayi: parts[3] || '',
        v2_renk: parts[4] || '',
        v3_renk: parts[5] || '',
        v4_renk: parts[6] || ''
    };
}

// Kumaş stok arama — kumas_stok tablosunda stok kodu bazında grupla
function depoAramaKartBul(kod) {
    const k = String(kod || '').trim();
    if (!k) return null;
    return (dataCache.kumas_kutuphanesi || []).find(x => String(x.desen_kodu || '').trim() === k) || null;
}
function depoAramaHucre(text, cls) {
    const v = String(text ?? '').trim();
    const show = v || '—';
    return `<span class="depo-arama-drop__cell ${cls || ''}" title="${pdfEsc(show)}">${pdfEsc(show)}</span>`;
}
function depoAramaDropHtml(tip, labels, rowsHtml) {
    return `<div class="depo-arama-drop depo-arama-drop--${tip}">
        <div class="depo-arama-drop__head">${labels.map(l => `<span>${l}</span>`).join('')}</div>
        ${rowsHtml}
    </div>`;
}
function depoAramaKumasSatirHtml(x, i) {
    const k = x._kart || depoAramaKartBul(x.stok_kodu) || {};
    const cins = x.kumas_cinsi || kumasKartKumasCinsiOku(k) || '—';
    const cozgu = kumasKartListeCozguOzet(k) || '—';
    const atki = kumasKartListeAtkiIplikOzet(k) || '—';
    const bakiye = parseFloat(x.bakiye) || 0;
    const bakCls = bakiye <= 0 ? 'depo-arama-drop__cell--neg' : 'depo-arama-drop__cell--pos';
    return `<div class="depo-arama-drop__row" data-idx="${i}" onclick="kumasSelectItem(this)">
        ${depoAramaHucre(x.stok_kodu, 'depo-arama-drop__cell--kod')}
        ${depoAramaHucre(cins)}
        ${depoAramaHucre(k.tarak_eni)}
        ${depoAramaHucre(k.tarak_no)}
        ${depoAramaHucre(k.atki_sikligi)}
        ${depoAramaHucre(cozgu)}
        ${depoAramaHucre(atki)}
        ${depoAramaHucre(bakiye.toFixed(1) + ' kg', bakCls)}
    </div>`;
}
function depoAramaIplikSatirHtml(x, i) {
    const bakiye = parseFloat(x.bakiye) || 0;
    const bakCls = bakiye < 0 ? 'depo-arama-drop__cell--neg' : 'depo-arama-drop__cell--pos';
    return `<div class="depo-arama-drop__row" data-idx="${i}" onclick="iplikSelectItem(this)">
        ${depoAramaHucre(x.stok_kodu, 'depo-arama-drop__cell--kod')}
        ${depoAramaHucre(x.iplik_no)}
        ${depoAramaHucre(x.lot_no)}
        ${depoAramaHucre(x.marka)}
        ${depoAramaHucre(x.cins)}
        ${depoAramaHucre(bakiye.toFixed(1) + ' kg', bakCls)}
    </div>`;
}
function kumasSelectByKod(kod, grup) {
    const k = String(kod || '').trim();
    if (!k) return;
    const g = depoKumasHareketGrupCoz(grup || depoKomutaHedef) || 'HAM_KUMAS';
    const kart = (dataCache.kumas_kutuphanesi || []).find(x => String(x.desen_kodu || '').trim() === k);
    const bak = depoStokNetBakiyeHesapla('kumas_stok', k, g, null);
    let x = null;
    if (kart && kumasKutuphanesiKartiGrupMu(kart, g)) {
        x = {
            stok_kodu: k,
            kumas_cinsi: kumasKartKumasCinsiOku(kart) || kart.kumas_cinsi || kart.desen_adi || '',
            lot_no: kart.lot_no || '',
            marka: kart.firma || kart.marka || '',
            renk: kart.renk || '',
            bakiye: bak.kg || 0
        };
    }
    if (x) {
        window._kumasSearchData = [x];
        kumasSelectItem({ getAttribute: () => '0' });
        return;
    }
    const kartHata = depoKumasStokKartiDogrula(k, g);
    erpToast(kartHata || `"${k}" için geçerli kumaş kartı bulunamadı.`, 'error', 5000);
}
// Mamul arama — stok kodu veya ürün adı; ana kart eşleşince varyantlar açılır

function mamulClearSelection() {
    const card = document.getElementById('mamul-selected-card');
    if (card) card.style.display = 'none';
    const inp = document.getElementById('mamul-search');
    if (inp) inp.value = '';
    const hidden = document.getElementById('val-stok-kodu-mamul');
    if (hidden) hidden.value = '';
    ['mprev-kod','mprev-no','mprev-lot','mprev-cins','mprev-marka'].forEach(id => {
        const el = document.getElementById(id); if (el) el.textContent = '—';
    });
}

// ============================================================
// renderIplikGrafik — İplik Arşivi Donut + Bar Grafik Analizi
// ============================================================
// Grafikten detaya git — o ipliğin ilk kaydını modal'da aç
// --- loadData SONU ---

// ============================================================
// switchRaporTab — appMode düzeltildi
// ============================================================
function siparisListeFilterPanelKur(opts = {}) {
    if (!window.siparisListePanelFiltre || typeof window.siparisListePanelFiltre !== 'object') {
        window.siparisListePanelFiltre = { q: '' };
    } else if (window.siparisListePanelFiltre.q == null) {
        const eski = window.siparisListePanelFiltre;
        window.siparisListePanelFiltre = {
            q: [eski.sno, eski.firma, eski.durum, eski.ay].filter(Boolean).join(' ').trim()
        };
    }
    siparisListeKolonFiltre = { sno: '', firma: '', ozet: '', adet: '', termin: '', grup: '' };
    const filterPanel = document.getElementById('filter-panel');
    const container = document.getElementById('filter-inputs');
    if (filterPanel) {
        filterPanel.classList.add('hidden');
        filterPanel.classList.remove('siparis-filtre-card');
    }
    if (container) {
        container.innerHTML = '';
        container.classList.remove('siparis-filtre-grid', 'siparis-filtre-tek');
    }
    const headerSearch = document.getElementById('search');
    if (headerSearch) headerSearch.value = '';
    if (!opts.skipLoad) loadData();
}

function siparisListeSatirHtml(i, idx) {
    const kritik = siparisTerminEnKritikDurum(i);
    const gecikti = kritik === 'gecikti';
    const yakin = kritik === 'yakin' || kritik === 'bugun';
    const durumKod = siparisDurumNorm(i.durum);
    const durumMeta = siparisDurumMeta(durumKod);
    const borderClr = durumKod === 'TAMAMLANDI' ? 'var(--emerald-c)'
        : (durumKod === 'İPTAL' ? 'var(--rose-c)'
        : (gecikti ? 'var(--rose-c)' : (yakin ? 'var(--amber-c)' : (durumMeta.renk || 'var(--accent)'))));
    const terminGun = siparisTerminListeHtml(i);
    const ozetRaw = siparisListeOzetMetni(i, 96);
    const adetVal = siparisListeAdetGoster(i);
    const durumSel = (appMode === 'SIPARIS_LISTE')
        ? siparisDurumSelectHtml(i.id, i.durum, { compact: true })
        : `<span class="pill ${durumMeta.pill}" style="font-size:7px;padding:1px 5px;align-self:flex-start">${pdfEsc(durumMeta.label)}</span>`;
    /* Renk özeti satırı — ana programdaki ile aynı (renk adı · renk kodu, en çok 3 kalem).
       Mobilde hiç görünmüyordu (kullanıcı, 20.09.2026: "ana programda görülüp mobilde görülmeyen veri"). */
    const renkOzet = (() => {
        const kalemler = siparisListeKalemleriArr(i);
        const seen = new Set();
        const bits = [];
        kalemler.forEach(k => {
            const renk = String(k.renk || '').trim();
            const rk = typeof siparisKalemRenkKoduMetni === 'function' ? siparisKalemRenkKoduMetni(k) : '';
            const t = [renk, rk].filter(Boolean).join(' · ');
            if (!t) return;
            const key = t.toLocaleLowerCase('tr-TR');
            if (seen.has(key)) return;
            seen.add(key);
            bits.push(t);
        });
        return bits.slice(0, 3).join(' | ');
    })();
    const yukYuzde = Math.round(siparisYuklemeOrani(i) * 100);
    return `<div class="record-item siparis-liste-row${yukYuzde > 0 ? ' has-yukleme' : ''}" style="border-left-color:${borderClr};--yuk:${yukYuzde}%" title="${pdfEsc((i.sno || '') + ' · ' + (i.firma || '') + ' · ' + durumMeta.label + (yukYuzde > 0 ? ` · %${yukYuzde} yüklendi` : ''))}">
        <div onclick="showDetail(${idx})" class="siparis-liste-row-hit">
        <div class="siparis-lc-no">
            <span style="font-size:11px;font-weight:700;font-family:'DM Mono',monospace;color:var(--text);line-height:1.2">${pdfEsc(i.sno || '—')}</span>
            ${durumSel}
        </div>
        <div class="siparis-lc-firma mobil-tek-satir" title="${pdfEsc(i.firma || '')}">${pdfEsc(i.firma || '—')}</div>
        <div class="siparis-lc-ozet mobil-tek-satir${renkOzet ? ' has-renk' : ''}" title="${pdfEsc(ozetRaw + (renkOzet ? ' · ' + renkOzet : ''))}">${pdfEsc(ozetRaw)}${renkOzet ? `<div class="siparis-lc-renk" title="${pdfEsc(renkOzet)}">${pdfEsc(renkOzet)}</div>` : ''}</div>
        <div class="siparis-lc-adet">${pdfEsc(adetVal)}<span>kalem toplamı</span></div>
        <div class="siparis-lc-termin">
            ${appMode === 'SIPARIS_KAPANAN' && typeof siparisKapanisBilgiHtml === 'function'
                ? siparisKapanisBilgiHtml(i)
                : `<div style="font-weight:600;color:var(--text)">${pdfEsc(i.ttarih ? new Date(i.ttarih).toLocaleDateString('tr-TR') : '—')}</div>
            <div style="margin-top:2px;display:flex;justify-content:flex-end;flex-wrap:wrap;gap:3px">${terminGun}</div>`}
        </div>
        </div>
        <div class="siparis-lc-gecmis">
            <span class="pill pill-gray" style="font-size:8px;padding:3px 7px">${pdfEsc((i.siparis_grubu || 'EV_TEKSTILI').replaceAll('_', ' '))}</span>
        </div>
    </div>`;
}

/** Arama/filtre yazarken listeyi tam yeniden çizmez — input odağı ve mobil klavye korunur */
function siparisListeAramaYenile() {
    if (appMode !== 'SIPARIS_LISTE' && appMode !== 'SIPARIS_KAPANAN') {
        loadData();
        return;
    }
    if (erpIsDetailModalOpen()) {
        erpScheduleDeferredUiRefresh();
        return;
    }
    const list = document.getElementById('main-list');
    if (!list || !list.querySelector('.siparis-liste-toolbar')) {
        if (erpShouldDeferUiRefresh()) {
            erpScheduleDeferredUiRefresh();
            return;
        }
        loadData();
        return;
    }

    const q = siparisListeTekAramaOku();
    const scrollHost = list.closest('.content-scroll') || list.parentElement;
    const prevScroll = scrollHost?.scrollTop ?? 0;

    let data = (dataCache.siparisler || []).slice();
    if (appMode === 'SIPARIS_KAPANAN') {
        data = data.filter(i => String(i.durum || '').toUpperCase() === 'TAMAMLANDI');
    } else {
        data = data.filter(i => String(i.durum || '').toUpperCase() !== 'TAMAMLANDI');
    }

    data = data.filter(i => siparisListeTekAramaEslesir(i, q));
    data = siparisListeSirala(data);

    if (appMode === 'SIPARIS_LISTE') {
        data = data.filter(i => {
            const d = String(i.durum || '').toUpperCase();
            if (siparisListeHizliFiltre === 'BEKLEMEDE') return d === 'BEKLEMEDE';
            if (siparisListeHizliFiltre === 'URETIMDE') return d === 'ÜRETİMDE' || d === 'DEVAM';
            if (siparisListeHizliFiltre === 'GECIKEN') return siparisTerminGecikmisMi(i);
            if (siparisListeHizliFiltre === 'YAKLASAN') return siparisTerminYakinMi(i);
            return true;
        });
    }

    currentData = data;
    list.querySelectorAll('.record-item.siparis-liste-row, .siparis-liste-bos').forEach(el => el.remove());
    const rowsHtml = currentData.length
        ? currentData.map((i, idx) => siparisListeSatirHtml(i, idx)).join('')
        : `<div class="siparis-liste-bos" style="padding:28px 16px;text-align:center;color:var(--text3);font-size:12px">Eşleşen sipariş yok</div>`;
    list.insertAdjacentHTML('beforeend', rowsHtml);
    if (scrollHost) scrollHost.scrollTop = prevScroll;
}

window.syncArchiveTabStili = function() {
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

function acKayitliStokKartlari() {
    closeAllSubs();
    try { erpCloseMobileSidebar(); } catch (e) {}
    const sub = document.getElementById('sub-kart');
    if (sub) sub.classList.add('open');
    const chev = document.getElementById('chev-kart');
    if (chev) chev.style.transform = 'rotate(180deg)';
    if (!['TUMU', 'IPLIK', 'KUMAS', 'MAMUL'].includes(archiveTab)) archiveTab = 'TUMU';
    saveUiState({ archiveTab });
    if (appMode !== 'KART_LISTE') setAppMode('KART_LISTE');
    else {
        syncArchiveTabStili();
        if (typeof loadData === 'function') loadData();
    }
}

// stokKartListeAdMetni: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
function stokKartGrupBul(i) {
    if (stokKartGrupEslesir(i, 'IPLIK')) return 'IPLIK';
    if (stokKartGrupEslesir(i, 'MAMUL')) return 'MAMUL';
    return 'KUMAS';
}

// stokKartAramaEslesir: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
// stokKartGrupEslesir: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
// stokKartListeSatirHtml: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
// stokKartListeOzetHtml: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
// stokKartGrupluListeHtml: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
window.switchArchiveTab = function(tab) {
    const hedef = String(tab || '').toUpperCase();
    if (!['TUMU', 'IPLIK', 'KUMAS', 'MAMUL'].includes(hedef)) return;
    archiveTab = hedef;
    saveUiState({ archiveTab });
    try { erpCloseMobileSidebar(); } catch (e) {}
    if (appMode !== 'KART_LISTE') {
        setAppMode('KART_LISTE');
        return;
    }
    syncArchiveTabStili();
    if (typeof loadData === 'function') loadData();
};

// --- KAYIT KAYDETME ---
async function handleSave() {
    if (isSaveInProgress) {
        erpToast('Kaydetme işlemi zaten devam ediyor, lütfen bekleyin.', 'warn');
        return;
    }
    /* Ekran açılışı engellense de "düzenlemeyi iptal et" ile aynı formdan yeni
       kayıt atılabiliyordu; kısıt kaydetme anında da uygulanır. */
    {
        const engel = mobilKisitEngelMetni(appMode, !!editingId);
        if (engel) { erpToast(engel, 'error', 4500); return; }
    }
    if (depoHareketFormGrubu() === 'MAMUL_DEPO' && typeof mamulDepoGirisMod !== 'undefined' && mamulDepoGirisMod === 'TOPLU') {
        await mamulTopluKaydet();
        return;
    }
    if (kumasFormGrubuMu(depoHareketFormGrubu()) && !editingId && document.getElementById('kumas-toplu-hareket-body') && typeof kumasTopluKaydet === 'function') {
        await kumasTopluKaydet();
        return;
    }
    isSaveInProgress = true;
    try {
        erpNormalizeAllDecimalInputsInForm();
        if (appMode === 'SIPARIS_GIRIS') {
            await erpAwaitSiparisFoto();
        }
    } catch (preErr) {
        isSaveInProgress = false;
        erpToast('Kayıt hazırlanırken hata: ' + (preErr?.message || preErr), 'error', 3600);
        return;
    }
    let table = 'kumas_stok';
    if (appMode === 'SIPARIS_GIRIS') table = 'siparisler';
    else if (['KART_GIRIS', 'KUMAS_KART_GIRIS', 'MAMUL_KART_GIRIS'].includes(appMode)) table = 'kumas_kutuphanesi';
    else if (appMode === 'IPLIK_KART_GIRIS') table = 'iplik_stok';
    else if (appMode === 'DEPO_HAREKET' && depoKomutaHedef === 'IPLIK') table = 'iplik_stok';
    else if (appMode === 'DEPO_HAREKET' && (kumasFormGrubuMu(depoKomutaHedef) || depoKomutaHedef === 'MAMUL_DEPO')) table = 'kumas_stok';
    else if (['IPLIK', 'BOYAHANE_URETIM', 'DOKUMA_URETIM', 'KONFEKSIYON_URETIM', 'AKSESUAR_URETIM'].includes(appMode)) table = 'iplik_stok';
    else if (appMode === 'MAMUL_DEPO') table = 'kumas_stok';

    const now = new Date().toLocaleString('tr-TR');
    const currentUser = String(erpCurrentUser?.display_name || erpCurrentUser?.username || 'Sistem').trim() || 'Sistem';
    let yeniLog = "";

    if (editingId) {
        // Tezgahlar tablosunda islem_gecmisi kolonu yok; log'u notlar icine yazariz.
        const eskiGecmis = (originalRecordSnapshot?.islem_gecmisi || "");
        const degisiklikDetayi = getDetailedChangeLog();
        yeniLog = eskiGecmis + degisiklikDetayi;
        // Hiç alan değişmemişse yine de zaman damgası ekle
        if (!degisiklikDetayi) {
            yeniLog = eskiGecmis + `\n═══════════════════════════════\n🔄 ${now} — [${currentUser}]\n  • (Değişiklik tespit edilmedi)`;
        }
    } else {
        yeniLog = `✨ ${now} — [${currentUser}]: Kayıt sisteme tanımlandı.`;
    }

    const kaynakBirim = iplikListeHareketAktif()
        ? 'DEPO_HAREKET_IPLIK'
        : (appMode === 'DEPO_HAREKET' && depoKomutaHedef)
        ? (kumasFormGrubuMu(depoKomutaHedef)
            ? depoKaynakBirimImportBelirle(depoKomutaHedef, document.getElementById('val-stok-kodu')?.value)
            : `DEPO_HAREKET_${depoKomutaHedef}`)
        : appMode;
    let p = { updated_by: currentUser, kaynak_birim: kaynakBirim, islem_gecmisi: yeniLog };

    try {
        if (appMode === 'IPLIK_KART_GIRIS') {
            p = {
                ...p,
                stok_kodu:      document.getElementById('val-stok-kodu')?.value || '',
                iplik_no:       document.getElementById('val-iplik-no')?.value?.toUpperCase() || '',
                marka:          document.getElementById('val-marka')?.value?.toUpperCase() || '',
                cins:           document.getElementById('val-cins')?.value?.toUpperCase() || '',
                lot_no:         '',
                renk:           document.getElementById('val-renk')?.value || '',
                bukum:          parseFloat(document.getElementById('val-bukum')?.value) || null,
                bukum_yonu:     document.getElementById('val-bukum-yonu')?.value || '',
                mukavemet:      parseFloat(document.getElementById('val-mukavemet')?.value) || null,
                uzama:          parseFloat(document.getElementById('val-uzama')?.value) || null,
                ip_kolu:        parseFloat(document.getElementById('val-ip-kolu')?.value) || null,
                bobin_uzunluk:  parseFloat(document.getElementById('val-bobin-uzunluk')?.value) || null,
                nem:            parseFloat(document.getElementById('val-nem')?.value) || null,
                kalite_kat:     document.getElementById('val-kalite-kat')?.value || '1. KALİTE',
                tedarikci:      document.getElementById('val-tedarikci')?.value?.toUpperCase() || '',
                depo_konum:     document.getElementById('val-depo-konum')?.value || '',
                min_stok:       erpValDecimal('val-min-stok') || null,
                fiyat:          erpValDecimal('val-fiyat') || null,
                para_birimi:    document.getElementById('val-para-birimi')?.value || 'TRY',
                kullanim:       document.getElementById('val-kullanim')?.value || '',
                kalite:         document.getElementById('val-kalite-durum')?.value || 'AKTİF',
                notlar:         document.getElementById('val-notlar')?.value || '',
                miktar_kg:      0,
                cuval_sayisi:   0,
                cuval_rengi:    document.getElementById('val-cuval-rengi')?.value?.toUpperCase() || originalRecordSnapshot?.cuval_rengi || '',
                araci_firma:    document.getElementById('val-araci-firma')?.value?.toUpperCase() || originalRecordSnapshot?.araci_firma || '',
            };
            if (!p.stok_kodu || !p.iplik_no) { erpToast('İplik kartı için Stok Kodu ve İplik No zorunludur.', 'error'); return; }
            if (!editingId && (dataCache.iplik_stok || []).some(r => String(r.stok_kodu || '').trim() === p.stok_kodu.trim() && iplikKartTanimKaydiMi(r))) {
                erpToast('Bu stok kodu için iplik kartı zaten tanımlı: ' + p.stok_kodu, 'error', 6000);
                return;
            }
            const lots = typeof iplikKartLotlariOkuDom === 'function' ? iplikKartLotlariOkuDom() : [];
            if (lots.some(l => !String(l.lot_no || '').trim() && (parseFloat(l.miktar_kg) || l.renk || l.tedarikci))) {
                erpToast('Miktar veya lot bilgisi girilen satırlarda lot numarası zorunludur.', 'error');
                return;
            }
            const doluLot = lots.filter(l => String(l.lot_no || '').trim());
            const lotNos = doluLot.map(l => String(l.lot_no).trim().toUpperCase());
            if (new Set(lotNos).size !== lotNos.length) {
                erpToast('Aynı stok kartında tekrarlayan lot numarası olamaz.', 'error');
                return;
            }
            p.lot_no = doluLot[0]?.lot_no || '';
            if (typeof iplikNotlarOlustur === 'function') p.notlar = iplikNotlarOlustur(p.notlar, doluLot);
        } else if (appMode === 'KUMAS_KART_GIRIS') {
            const kartTip = kumasKartTipiNorm(document.getElementById('val-kumas-tipi')?.value || kumasKartGirisTipi);
            const userNotlar = document.getElementById('val-notlar')?.value || '';
            const atkiArr = [];
            document.querySelectorAll('[id^="val-atki-no-"]').forEach(el => {
                const n = el.id.split('-').pop();
                const no = el.value || '';
                const c = document.getElementById('val-atki-cins-'+n)?.value || '';
                const r = document.getElementById('val-atki-renk-'+n)?.value || '';
                if (no || c || r) atkiArr.push({ iplik_no: no, cins: c, renk: r });
            });
            const atkiStr = atkiArr.length
                ? atkiArr.map(a => (a.iplik_no || '') + ' - ' + (a.cins || '') + ' - ' + (a.renk || '')).join(' | ')
                : (typeof kumasKartAtkiTopla === 'function' ? kumasKartAtkiTopla() : '');
            p = {
                ...p,
                desen_kodu:     document.getElementById('val-kodu')?.value || '',
                stok_kodu:      document.getElementById('val-kodu')?.value || '',
                desen_adi:      document.getElementById('val-desen-adi')?.value?.toUpperCase() || '',
                firma:          document.getElementById('val-firma')?.value?.toUpperCase() || '',
                kumas_cinsi:    document.getElementById('val-kumas-cinsi')?.value?.toUpperCase() || '',
                ana_grup:       document.getElementById('val-ana-grup')?.value || document.getElementById('val-urun-grubu')?.value || 'EV TEKSTİLİ',
                urun_adi:       document.getElementById('val-urun-adi')?.value?.toUpperCase() || '',
                tarak_no:       document.getElementById('val-tarak-no')?.value || '',
                tarak_eni:      document.getElementById('val-tarak-eni')?.value || '',
                atki_sikligi:   document.getElementById('val-atki-sikligi')?.value || '',
                cozgu_sikligi:  document.getElementById('val-cozgu-sikligi')?.value || '',
                cozgu_no:       numuneKodAlaniniNormalizeEt(document.getElementById('val-cozgu-no')?.value || document.getElementById('val-cozgu-iplik-no')?.value || ''),
                cozgu_cinsi:    (document.getElementById('val-cozgu-cinsi')?.value || document.getElementById('val-cozgu-iplik-marka')?.value || '').toUpperCase(),
                ham_en:         erpValDecimal('val-ham-en') || null,
                ham_boy:        erpValDecimal('val-ham-boy') || null,
                ham_gramaj:     erpValDecimal('val-ham-gramaj') || null,
                ham_gsm:        erpValDecimal('val-ham-gsm') || null,
                mamul_en:       erpValDecimal('val-mamul-en') || null,
                mamul_boy:      erpValDecimal('val-mamul-boy') || null,
                mamul_gramaj:   erpValDecimal('val-mamul-gramaj') || null,
                mamul_gsm:      erpValDecimal('val-mamul-gsm') || null,
                terbiye:        document.getElementById('val-terbiye')?.value || '',
                boya_not:       document.getElementById('val-boya-not')?.value || '',
                cekme:          erpValDecimal('val-cekme') || null,
                renk:           kartTip === 'MAMUL' ? (document.getElementById('val-renk-kodu')?.value?.toUpperCase() || '') : '',
                atki_renkleri:  atkiStr,
                kalite:         document.getElementById('val-durum')?.value || 'AKTİF',
                fotograf:       currentImageBase64,
            };
            const tipNot = typeof kumasKartNotlarPaketle === 'function'
                ? kumasKartNotlarPaketle(kartTip, userNotlar, document.getElementById('val-urun-grubu')?.value || p.ana_grup)
                : userNotlar;
            if (typeof kumasNotlarOlustur === 'function') {
                const existingMeta = typeof kumasKartMetaTemizle === 'function'
                    ? kumasKartMetaTemizle(kumasMetaDecode(originalRecordSnapshot?.notlar) || {})
                    : (kumasMetaDecode(originalRecordSnapshot?.notlar) || {});
                p.notlar = kumasNotlarOlustur(tipNot, {
                    ...existingMeta,
                    cozgu_sikligi: p.cozgu_sikligi || '',
                    ana_grup: p.ana_grup || '',
                    terbiye: p.terbiye || '',
                    boya_not: p.boya_not || '',
                    tarak_no: p.tarak_no || '',
                    tarak_eni: p.tarak_eni || '',
                    atki_sikligi: p.atki_sikligi || '',
                    cozgu_no: p.cozgu_no || '',
                    cozgu_cinsi: p.cozgu_cinsi || '',
                    ham_en: p.ham_en ?? '',
                    ham_boy: p.ham_boy ?? '',
                    ham_gramaj: p.ham_gramaj ?? '',
                    ham_gsm: p.ham_gsm ?? '',
                    mamul_en: p.mamul_en ?? '',
                    mamul_boy: p.mamul_boy ?? '',
                    mamul_gramaj: p.mamul_gramaj ?? '',
                    mamul_gsm: p.mamul_gsm ?? '',
                    cekme: p.cekme ?? '',
                    atki: atkiArr
                });
            } else {
                p.notlar = tipNot;
            }
            if (!p.desen_kodu || !p.desen_adi) { erpToast('Kumaş kartı için Desen Kodu ve Desen Adı zorunludur.', 'error'); return; }
        } else if (appMode === 'MAMUL_KART_GIRIS') {
            const ekMetaFull = typeof mamulEkAlanFormOku === 'function' ? mamulEkAlanFormOku() : {};
            const ekMetaAna = typeof mamulAnaMetaOlustur === 'function' ? mamulAnaMetaOlustur(ekMetaFull) : ekMetaFull;
            const anaKod = typeof mamulAnaKodBul === 'function'
                ? mamulAnaKodBul(document.getElementById('val-kodu')?.value || '')
                : (document.getElementById('val-kodu')?.value || '');
            const hamE = typeof mamulExcelEbatParcala === 'function'
                ? mamulExcelEbatParcala(ekMetaAna.ham_ebat || ekMetaAna.olculen_ham_ebat || '')
                : { en: '', boy: '' };
            const mamulE = typeof mamulExcelEbatParcala === 'function'
                ? mamulExcelEbatParcala(ekMetaAna.istenen_mamul_ebat || ekMetaAna.olculen_mamul_ebat || '')
                : { en: '', boy: '' };
            const desenAdi = document.getElementById('val-desen-adi')?.value?.toUpperCase() || '';
            const kumasCinsi = document.getElementById('val-kumas-cinsi')?.value || '';
            p = {
                ...p,
                desen_kodu:     anaKod,
                urun_adi:       desenAdi || kumasCinsi || anaKod || '',
                firma:          document.getElementById('val-firma')?.value?.toUpperCase() || '',
                kumas_cinsi:    kumasCinsi,
                desen_adi:      desenAdi,
                tarak_no:       document.getElementById('val-tarak-no')?.value || '',
                tarak_eni:      document.getElementById('val-tarak-eni')?.value || '',
                atki_sikligi:   document.getElementById('val-mamul-atki-sikligi')?.value || '',
                cozgu_no:       document.getElementById('val-mamul-cozgu-iplik-no')?.value || '',
                cozgu_cinsi:    document.getElementById('val-mamul-cozgu-iplik-markasi')?.value || '',
                ham_en:         hamE.en || ekMetaAna.ham_ebat || '',
                ham_boy:        hamE.boy || '',
                ham_gsm:        ekMetaAna.ham_gram_m2 || '',
                mamul_en:       mamulE.en || ekMetaAna.istenen_mamul_ebat || '',
                mamul_boy:      mamulE.boy || '',
                mamul_gsm:      ekMetaAna.mamul_gram_m2 || '',
                renk:           '',
                atki_renkleri:  '',
                kalite:         document.getElementById('val-durum')?.value || 'AKTİF',
                fotograf:       currentImageBase64,
                ana_grup:       'MAMUL',
                notlar:         typeof kumasNotlarOlustur === 'function'
                    ? kumasNotlarOlustur(ekMetaAna.aciklama || '', ekMetaAna)
                    : (ekMetaAna.aciklama || ''),
            };
            if (!p.desen_kodu) { erpToast('Mamül kartı için stok kodu zorunludur.', 'error'); return; }
            if (!p.desen_adi && !p.kumas_cinsi) { erpToast('Desen adı veya kumaş cinsi zorunludur.', 'error'); return; }
            window._mamulSonEkMetaFull = ekMetaFull;
        } else if (appMode === 'KART_GIRIS') {
            const atkiDizisi = collectAtkiRenkleriFromForm();
            Object.assign(p, {
                ana_grup: document.getElementById('val-ana-grup')?.value || '',
                desen_kodu: document.getElementById('val-kodu')?.value || '',
                urun_adi: document.getElementById('val-urun-adi')?.value?.toUpperCase() || '',
                desen_adi: document.getElementById('val-desen-adi')?.value?.toUpperCase() || '',
                firma: document.getElementById('val-firma')?.value?.toUpperCase() || '',
                kumas_cinsi: document.getElementById('val-kumas-cinsi')?.value || '',
                tarak_no: document.getElementById('val-tarak-no')?.value || '',
                tarak_eni: document.getElementById('val-tarak-eni')?.value || '',
                atki_sikligi: document.getElementById('val-atki-sikligi')?.value || '',
                cozgu_no: document.getElementById('val-cozgu-no')?.value || '',
                cozgu_cinsi: document.getElementById('val-cozgu-cinsi')?.value || '',
                ham_en: document.getElementById('val-ham-en')?.value || '',
                ham_gramaj: document.getElementById('val-ham-gramaj')?.value || '',
                ham_gsm: document.getElementById('val-ham-gsm')?.value || '',
                mamul_en: document.getElementById('val-mamul-en')?.value || '',
                mamul_gramaj: document.getElementById('val-mamul-gramaj')?.value || '',
                mamul_gsm: document.getElementById('val-mamul-gsm')?.value || '',
                atki_renkleri: atkiDizisi.join(' | '),
                kalite: document.getElementById('val-durum')?.value || 'AKTİF',
                notlar: document.getElementById('val-notlar')?.value || '',
                fotograf: currentImageBase64
            });
            if (!p.desen_kodu || !p.urun_adi) { erpToast('Teknik kart için Desen Kodu ve Ürün Adı zorunludur.', 'error'); return; }
        } else if (appMode === 'SIPARIS_GIRIS') {
            siparisFotograflar = (siparisFotograflar || []).filter(f => {
                const src = String(f?.src || '').trim();
                return src.startsWith('data:image/') || src.startsWith('http://') || src.startsWith('https://');
            });
            _siparisKayitFotoSayisi = siparisFotograflar.length;
            if (_siparisKayitFotoSayisi > 0) {
                const hint = editingId || document.getElementById('val-sno')?.value || 'yeni';
                siparisFotograflar = await siparisFotograflariStorageHazirla(siparisFotograflar, hint);
                _siparisKayitFotoSayisi = siparisFotograflar.length;
            }
            let fotoDbVal = siparisFotografDbDeger(siparisFotograflar);
            if (_siparisKayitFotoSayisi > 0 && !fotoDbVal) {
                const fotoHazirlaniyor = !!document.querySelector('[id^="siparis-foto-busy-"]');
                if (fotoHazirlaniyor) {
                    erpToast('Fotoğraflar işleniyor; birkaç saniye bekleyip tekrar deneyin (fotoğraf zorunlu değil).', 'warn', 6000);
                    return;
                }
                siparisFotograflar = [];
                _siparisKayitFotoSayisi = 0;
                fotoDbVal = null;
            }
            const kalemler = collectSiparisKalemlerFromForm();
            const kalemlerValid = kalemler.filter(siparisKalemGecerliMi);
            let durumVal = editingId
                ? (originalRecordSnapshot?.durum || 'BEKLEMEDE')
                : 'BEKLEMEDE';
            if (editingId && originalRecordSnapshot && originalRecordSnapshot.durum === 'TAMAMLANDI') {
                durumVal = 'TAMAMLANDI';
            }
            const starihVal = String(document.getElementById('val-starih')?.value || '').trim();
            const ttarihRaw = String(document.getElementById('val-ttarih')?.value || '').trim();
            if (!editingId) syncSiparisNoInput();
            const autoSno = editingId
                ? String(originalRecordSnapshot?.sno || document.getElementById('val-sno')?.value || '').trim()
                : suggestNextSiparisNo();
            const siparisKayit = {
                sno: autoSno,
                firma: document.getElementById('val-firma')?.value?.toUpperCase() || '',
                siparis_grubu: document.getElementById('val-siparis-grubu')?.value || 'EV_TEKSTILI',
                // Bazi kurulumlarda siparisler.uretim_yeri kolonu zorunlu/constraint'li.
                // Siparis girisini bloklamamasi icin varsayilan deger gonder.
                uretim_yeri: 'SIMTEKS_KONF',
                starih: starihVal || null,
                ttarih: ttarihRaw || null,
                durum: durumVal,
                cins: JSON.stringify(kalemlerValid),
                miktar: kalemlerValid.reduce((acc, curr) => acc + parseFloat(curr.miktar || 0), 0)
            };
            if (fotoDbVal) siparisKayit[SIPARIS_FOTO_DB_COL] = fotoDbVal;
            Object.assign(p, siparisKayit);
            if (!p.sno) { erpToast('Sipariş numarası oluşturulamadı. Sayfayı yenileyip tekrar deneyin.', 'error'); return; }
            if (!p.firma && !starihVal) { erpToast('Müşteri ve sipariş tarihi zorunludur.', 'error'); return; }
            if (!p.firma) { erpToast('Müşteri adı zorunludur.', 'error'); return; }
            if (!starihVal) { erpToast('Sipariş tarihi zorunludur.', 'error'); return; }
            if (kalemlerValid.length === 0) {
                erpToast('En az 1 geçerli ürün kalemi girin (2. adım: Ürün Kalemleri). Fotoğraf zorunlu değildir.', 'error');
                _wizardGo('siparis', siparisWizardAktifAdim(), 2);
                return;
            }
        } else if (kumasFormGrubuMu(depoHareketFormGrubu())) {
            const sKodu = document.getElementById('val-stok-kodu')?.value?.trim();
            const kartHata = depoKumasStokKartiDogrula(sKodu, depoHareketFormGrubu());
            if (kartHata) { erpToast(kartHata, 'error', 6000); return; }
            if (!sKodu) { erpToast('Önce bir kumaş seçin (stok kodu zorunlu).', 'error'); return; }
            const birim = (document.getElementById('val-miktar-birim')?.value || 'KG').toUpperCase();
            const qty = erpValDecimal('val-kg', 0);
            if (!qty || qty <= 0) { erpToast('Miktar girilmesi zorunludur.', 'error'); return; }
            const sign = movementType === 'ÇIKIŞ' ? -1 : 1;
            let miktar_kg = 0;
            let miktar_mt = 0;
            let cuval_sayisi = parseInt(document.getElementById('val-cuval-kumas')?.value) || 0;
            if (birim === 'KG') {
                miktar_kg = sign * Math.abs(qty);
                const mt = erpValDecimal('val-mt', 0);
                miktar_mt = movementType === 'ÇIKIŞ' ? -Math.abs(mt) : Math.abs(mt);
            } else if (birim === 'MT') {
                miktar_mt = sign * Math.abs(qty);
            } else {
                cuval_sayisi = Math.round(Math.abs(qty));
            }
            const kaliteRaw = (document.getElementById('val-kalite')?.value || '').trim();
            const body = depoNotlarWithBirim(birim, kaliteRaw);
            const meta = editingId && originalRecordSnapshot ? kumasMetaAl(originalRecordSnapshot) : null;
            const hasMeta = meta && typeof meta === 'object' && Object.values(meta).some(v => String(v ?? '').trim() !== '');
            let notlarVal = hasMeta ? kumasNotlarOlustur(body, meta) : body;
            let firmaKayit = document.getElementById('val-afirma')?.value?.toUpperCase()
                || document.getElementById('val-firma-detay')?.value?.toUpperCase()
                || document.getElementById('val-firma-hidden')?.value?.toUpperCase() || '';
            if (movementType === 'ÇIKIŞ') {
                const cikisYer = (document.getElementById('val-cikis-yeri')?.value || 'SİMTEKS KONFEKSİYON').trim();
                if (cikisYer !== 'SİMTEKS KONFEKSİYON') {
                    const fd = (document.getElementById('val-firma-detay')?.value || document.getElementById('val-afirma')?.value || '').trim();
                    if (!fd) { erpToast('Sevkiyat için firma / kişi adı zorunludur.', 'error'); return; }
                    firmaKayit = fd.toUpperCase();
                } else if (!firmaKayit) firmaKayit = 'SİMTEKS KONFEKSİYON';
                if (typeof depoNotlarWithTeslimDetay === 'function') {
                    notlarVal = depoNotlarWithTeslimDetay(notlarVal, typeof muhasebeFisTeslimFormOku === 'function' ? muhasebeFisTeslimFormOku() : null);
                }
                if (typeof kumasCekiPayloadNotlarEkle === 'function') {
                    notlarVal = kumasCekiPayloadNotlarEkle(notlarVal);
                }
            }

            Object.assign(p, {
                stok_kodu:   sKodu,
                kumas_cinsi: document.getElementById('val-cins')?.value || '',
                lot_no:      document.getElementById('val-lot')?.value  || '',
                marka:       document.getElementById('val-marka')?.value || '',
                renk:        document.getElementById('val-renk')?.value  || '',
                miktar_kg,
                miktar_mt,
                irsaliye_no:  document.getElementById('val-irs')?.value   || '',
                cuval_sayisi,
                cuval_rengi:  document.getElementById('val-cuval-rengi')?.value?.toUpperCase() || '',
                araci_firma:  document.getElementById('val-araci-firma')?.value?.toUpperCase() || '',
                firma:        firmaKayit,
                notlar:       notlarVal,
                islem_turu:   movementType
            });
        } else if (depoHareketFormGrubu() === 'IPLIK') {
            const sKodu = document.getElementById('val-stok-kodu')?.value?.trim();
            const iplikKartHata = depoIplikStokKartiDogrula(sKodu);
            if (iplikKartHata) { erpToast(iplikKartHata, 'error', 6000); return; }
            if (!sKodu) { erpToast('Önce bir iplik seçin (stok kodu zorunlu).', 'error'); return; }
            const birim = (document.getElementById('val-miktar-birim')?.value || 'KG').toUpperCase();
            const qty = erpValDecimal('val-kg', 0);
            if (!qty || qty <= 0) { erpToast('Miktar girilmesi zorunludur.', 'error'); return; }
            const sign = movementType === 'ÇIKIŞ' ? -1 : 1;
            let miktar_kg = 0;
            let miktar_mt = 0;
            let cuval_sayisi = parseInt(document.getElementById('val-cuval')?.value) || 0;
            if (birim === 'KG') {
                miktar_kg = sign * Math.abs(qty);
            } else if (birim === 'MT') {
                miktar_mt = sign * Math.abs(qty);
            } else {
                cuval_sayisi = Math.round(Math.abs(qty));
            }
            const notRaw = document.getElementById('val-notlar')?.value || '';
            const cikisYeri = movementType === 'ÇIKIŞ'
                ? (document.getElementById('val-cikis-yeri')?.value || 'SİMTEKS DOKUMA').trim()
                : '';
            if (movementType === 'ÇIKIŞ' && cikisYeri !== 'SİMTEKS DOKUMA') {
                const af = (document.getElementById('val-afirma')?.value || '').trim();
                if (!af) { erpToast('Seçilen birim için firma adı zorunludur.', 'error'); return; }
            }
            const boyaAlanNotu = appMode === 'BOYAHANE_URETIM'
                ? `[BOYAHANE_ALAN:${(boyahaneAktifAlanMeta()?.label || 'Boyahane').toUpperCase()}]`
                : '';
            let bobinDetayNotu = '';
            if (appMode === 'BOYAHANE_URETIM' && boyahaneAktifAlanMeta()?.id === 'BOBIN_BOYA') {
                const ipNo = String(document.getElementById('val-boya-iplik-no')?.value || '').trim();
                const lot = String(document.getElementById('val-boya-iplik-lot')?.value || '').trim();
                const ipKg = String(document.getElementById('val-boya-iplik-kg')?.value || '').trim();
                const renkKod = String(document.getElementById('val-boya-renk-kodu')?.value || '').trim();
                const teslim = String(document.getElementById('val-boya-teslim-tarih')?.value || '').trim();
                const termin = String(document.getElementById('val-boya-termin-tarih')?.value || '').trim();
                bobinDetayNotu = [
                    '[BOBIN_BOYA_DETAY]',
                    `Iplik No: ${ipNo || '-'}`,
                    `Iplik Lot: ${lot || '-'}`,
                    `Iplik KG: ${ipKg || '-'}`,
                    `Renk Kodu: ${renkKod || '-'}`,
                    `Teslim Tarihi: ${teslim || '-'}`,
                    `Termin Tarihi: ${termin || '-'}`
                ].join('\n');
            }
            const sevkYerNotu = movementType === 'ÇIKIŞ' && cikisYeri ? `[SEVK_YER:${cikisYeri}]` : '';
            const finalNot = [boyaAlanNotu, bobinDetayNotu, sevkYerNotu, notRaw].filter(Boolean).join('\n').trim();
            const afirmaVal = document.getElementById('val-afirma')?.value?.toUpperCase() || '';
            const firmaKayit = movementType === 'ÇIKIŞ'
                ? (cikisYeri === 'SİMTEKS DOKUMA' ? 'SİMTEKS DOKUMA' : afirmaVal)
                : afirmaVal;

            Object.assign(p, {
                stok_kodu:   sKodu,
                iplik_no:    document.getElementById('val-no')?.value       || '',
                lot_no:      document.getElementById('val-lot')?.value      || '',
                marka:       document.getElementById('val-marka')?.value    || '',
                cins:        document.getElementById('val-cins')?.value     || '',
                kalite:      document.getElementById('val-kalite')?.value   || '1. KALİTE',
                miktar_kg,
                miktar_mt,
                irsaliye_no: document.getElementById('val-irs')?.value      || '',
                cuval_sayisi,
                cuval_rengi:  document.getElementById('val-cuval-rengi')?.value?.toUpperCase() || '',
                araci_firma:  firmaKayit,
                firma:        firmaKayit,
                notlar:       depoNotlarWithBirim(birim, finalNot),
                islem_turu:   movementType
            });
            if (!p.miktar_mt) delete p.miktar_mt;
            const ipNo = String(p.iplik_no || '').trim();
            const lotNo = String(p.lot_no || '').trim();
            if (movementType === 'GİRİŞ') {
                if (!ipNo) { erpToast('İplik girişi için iplik numarası zorunludur.', 'error'); return; }
                if (!lotNo) { erpToast('İplik girişi için lot numarası zorunludur.', 'error'); return; }
                if (window._iplikListeHareket?.girisModu === 'yeni_lot') {
                    if (!String(p.marka || '').trim()) { erpToast('Yeni lot için marka zorunludur.', 'error'); return; }
                    if (!String(p.cins || '').trim()) { erpToast('Yeni lot için cins zorunludur.', 'error'); return; }
                }
                const onlem = iplikDepoGirisOnlemKontrol(p.stok_kodu, ipNo, lotNo);
                if (onlem.confirm && !confirm(onlem.confirm)) return;
            }
        } else if (depoHareketFormGrubu() === 'MAMUL_DEPO') {
            const sKodu = document.getElementById('val-stok-kodu-mamul')?.value?.trim();
            const mamulKartHata = depoMamulStokKartiDogrula(sKodu);
            if (mamulKartHata) { erpToast(mamulKartHata, 'error', 6000); return; }
            if (!sKodu) { erpToast('Önce bir ürün seçin (stok kodu zorunlu).', 'error'); return; }
            const birim = 'AD';
            const qty = parseInt(document.getElementById('val-kg')?.value || 0, 10);
            if (!qty || qty <= 0) { erpToast('Adet girilmesi zorunludur.', 'error'); return; }
            const sign = movementType === 'ÇIKIŞ' ? -1 : 1;
            const cuval_sayisi = sign * qty;
            let firmaCikis = '';
            if (movementType === 'ÇIKIŞ') {
                firmaCikis = document.getElementById('val-afirma')?.value?.trim() || '';
                if (!firmaCikis) {
                    erpToast('Çıkışta kime verildiği (müşteri/alıcı firma) zorunludur.', 'error', 6000);
                    return;
                }
            }
            const kart = (typeof mamulKartBul === 'function' ? mamulKartBul(sKodu) : null)
                || (dataCache.kumas_kutuphanesi || []).find(x => x.desen_kodu === sKodu) || {};
            const notRaw = document.getElementById('val-notlar')?.value || '';
            let notlarVal = depoNotlarWithBirim(birim, notRaw);
            if (movementType === 'ÇIKIŞ' && typeof depoNotlarWithTeslimDetay === 'function') {
                notlarVal = depoNotlarWithTeslimDetay(notlarVal, typeof muhasebeFisTeslimFormOku === 'function' ? muhasebeFisTeslimFormOku() : null);
            }

            Object.assign(p, {
                stok_kodu:   sKodu,
                kumas_cinsi: kart.kumas_cinsi || kart.urun_adi || '',
                lot_no:      kart.lot_no      || '',
                marka:       kart.firma       || '',
                renk:        kart.renk        || '',
                cuval_sayisi,
                irsaliye_no: movementType === 'ÇIKIŞ' ? (document.getElementById('val-irs')?.value || '') : '',
                firma:        (firmaCikis || document.getElementById('val-afirma')?.value?.toUpperCase() || kart.firma || ''),
                notlar:       notlarVal,
                islem_turu:   movementType
            });
            if (movementType === 'ÇIKIŞ') {
                const bakiyeErr = depoStokCikisBakiyeKontrol('MAMUL_DEPO', sKodu, p, editingId);
                if (bakiyeErr) {
                    erpToast('Çıkış yapılamıyor — ' + bakiyeErr, 'error', 6000);
                    return;
                }
            }
        }

        const depoGrupKayit = depoHareketFormGrubu();
        if (depoGrupKayit === 'IPLIK' && movementType === 'ÇIKIŞ' && p.stok_kodu) {
            const lotErr = iplikDepoCikisLotKontrol(p.stok_kodu, p, editingId);
            if (lotErr) {
                erpToast('Çıkış yapılamıyor — ' + lotErr, 'error', 6000);
                return;
            }
        } else if (depoGrupKayit && movementType === 'ÇIKIŞ' && p.stok_kodu) {
            const bakiyeErr = depoStokCikisBakiyeKontrol(depoGrupKayit, p.stok_kodu, p, editingId);
            if (bakiyeErr) {
                erpToast('Çıkış yapılamıyor — ' + bakiyeErr, 'error', 6000);
                return;
            }
        }

        // Son guvence: tezgahlar tablosuna islem_gecmisi kolonu asla gonderilmesin.
        if (table === 'tezgahlar') {
            try { delete p.islem_gecmisi; } catch (e) {}
        }

        if (table === 'kumas_kutuphanesi') p = kumasKutuphanesiDbTemizle(p);
        if (['KUMAS_KART_GIRIS', 'MAMUL_KART_GIRIS', 'KART_GIRIS'].includes(appMode)) {
            if (editingId && !String(currentImageBase64 || '').trim()) {
                try { delete p.fotograf; } catch (e) {}
            }
        }

        let error = null;
        _siparisDbDroppedCols = [];
        _siparisSonKayitId = null;
        if (appMode === 'SIPARIS_GIRIS' && !editingId) {
            const snoNorm = normalizeSiparisNo(p.sno);
            if (snoNorm) {
                const cacheHasSameSno = (dataCache.siparisler || []).some(s => normalizeSiparisNo(s?.sno) === snoNorm);
                if (cacheHasSameSno) {
                    erpToast(`Bu sipariş no zaten kayıtlı: ${snoNorm}`, 'error', 3600);
                    return;
                }
                const { data: existingSiparis, error: checkErr } = await sb.from('siparisler').select('id,sno').eq('sno', snoNorm).maybeSingle();
                if (checkErr) throw checkErr;
                if (existingSiparis?.id) {
                    erpToast(`Bu sipariş no zaten kayıtlı: ${snoNorm}`, 'error', 3600);
                    return;
                }
            }
        }
        if (editingId) {
            const triedCols = new Set();
            let usedKey = 'id';
            while (true) {
                const upd = await sb.from(table).update(p).eq(usedKey, editingId);
                error = upd.error || null;
                if (!error) break;
                const msg = String(error?.message || '');
                const missingKeyCol = /Could not find the 'id' column/i.test(msg);
                const m = msg.match(/Could not find the '([^']+)' column/i);
                const missingCol = m?.[1];
                if (table === 'tezgahlar' && missingKeyCol && usedKey === 'id') {
                    usedKey = 'iden';
                    continue;
                }
                if (missingCol && !triedCols.has(missingCol)) {
                    triedCols.add(missingCol);
                    _siparisDbDroppedCols.push(missingCol);
                    try { delete p[missingCol]; } catch (e) {}
                    continue;
                }
                break;
            }
            if (!error && _siparisDbDroppedCols.length) {
                console.warn(`${table} update sırasında şemada olmayan kolonlar atlandı:`, _siparisDbDroppedCols);
            }
            _siparisSonKayitId = editingId;
        } else {
            let insertPayload = [{ ...p }];
            const triedCols = new Set();
            while (true) {
                const ins = await sb.from(table).insert(insertPayload).select('id');
                error = ins.error || null;
                if (!error) {
                    if (ins.data?.[0]?.id) _siparisSonKayitId = ins.data[0].id;
                    break;
                }
                const msg = String(error?.message || '');
                const m = msg.match(/Could not find the '([^']+)' column/i);
                const missingCol = m?.[1];
                if (!missingCol || triedCols.has(missingCol)) break;
                triedCols.add(missingCol);
                _siparisDbDroppedCols.push(missingCol);
                insertPayload = insertPayload.map(row => {
                    const r = { ...row };
                    delete r[missingCol];
                    return r;
                });
                const hasAnyCol = insertPayload[0] && Object.keys(insertPayload[0]).length > 0;
                if (!hasAnyCol) break;
            }
            if (!error && _siparisDbDroppedCols.length) {
                console.warn(`${table} insert sırasında şemada olmayan kolonlar atlandı:`, _siparisDbDroppedCols);
            }
        }

        if (!error) {
            const savedId = _siparisSonKayitId || editingId;
            const fotoSnap = (table === 'siparisler' && _siparisKayitFotoSayisi > 0)
                ? (Array.isArray(siparisFotograflar) ? siparisFotograflar.slice() : [])
                : [];
            const fotoDropped = _siparisDbDroppedCols.includes(SIPARIS_FOTO_DB_COL)
                || _siparisDbDroppedCols.includes('fotograf');
            const mamulEkMetaSnap = (appMode === 'MAMUL_KART_GIRIS')
                ? (window._mamulSonEkMetaFull || (typeof mamulEkAlanFormOku === 'function' ? mamulEkAlanFormOku() : {}))
                : null;
            const mamulPayloadSnap = appMode === 'MAMUL_KART_GIRIS' ? { ...p } : null;
            window._mamulSonEkMetaFull = null;

            if (savedId) {
                const row = { ...p, id: savedId };
                if (fotoSnap.length) {
                    row[SIPARIS_FOTO_DB_COL] = (typeof siparisFotografDbDeger === 'function' ? siparisFotografDbDeger(fotoSnap) : null) || fotoSnap;
                    try {
                        siparisFotoLsKaydet(savedId, fotoSnap);
                        siparisFotoKayitSonrasiOnbellek(savedId, fotoSnap);
                    } catch (e) {}
                }
                erpCacheKayitGuncelle(table, row);
            }

            if (appMode === 'SIPARIS_GIRIS' && editingId && p.durum) {
                siparisFormKayitDurum = p.durum;
                siparisFormSiparisDurumUiSync();
            }
            const wasEditing = !!editingId;
            const depoDefterDonus = wasEditing && appMode === 'DEPO_HAREKET' && window._depoDefterEditReturn;
            if (depoDefterDonus) {
                editingId = null;
                originalRecordSnapshot = null;
                depoKomutaHedef = null;
                window._depoDefterEditReturn = false;
            }
            if (wasEditing && appMode === 'SIPARIS_GIRIS') {
                editingId = null;
                originalRecordSnapshot = null;
                siparisFormKayitDurum = null;
            }
            try { siparisFotoLsCacheBirlestir(); } catch (e) {}
            const listeHareketKayit = iplikListeHareketAktif();
            if (listeHareketKayit) iplikListeHareketKapat();
            const returnMode = appMode;
            const hedefListe = depoDefterDonus ? 'DEPO_HAREKET_LISTE'
                : ((appMode === 'SIPARIS_GIRIS' && !wasEditing) ? 'SIPARIS_LISTE' : returnMode);
            const depoYeniKayit = !wasEditing && appMode === 'DEPO_HAREKET' && !depoDefterDonus;
            const kaydedilenStokKodu = String(p.stok_kodu || p.desen_kodu || '').trim();
            if (!wasEditing && movementType === 'ÇIKIŞ' && savedId) {
                try {
                    if (kumasFormGrubuMu(depoHareketFormGrubu()) && typeof muhasebeFisKumasCikisKaydet === 'function') {
                        await muhasebeFisKumasCikisKaydet({ payloads: [p], hareketIds: [savedId] });
                    } else if (depoHareketFormGrubu() === 'MAMUL_DEPO' && typeof muhasebeFisMamulCikisKaydet === 'function') {
                        await muhasebeFisMamulCikisKaydet({ payloads: [p], hareketIds: [savedId] });
                    }
                } catch (e) { console.warn('muhasebe fişi:', e?.message || e); }
            }
            if (kumasFormGrubuMu(depoHareketFormGrubu()) && movementType === 'ÇIKIŞ' && typeof kumasCekiFormSifirla === 'function') {
                kumasCekiFormSifirla();
            }

            // Toast önce — ağ doğrulaması UI'yi bekletmesin
            if (fotoSnap.length && fotoDropped) {
                erpToast('Sipariş kaydedildi; fotoğraflar bu cihazda yedeklendi (DB foto kolonu yok).', 'warn', 10000);
            } else if (!depoYeniKayit) {
                erpToast('Kayıt başarıyla kaydedildi.', 'success');
            }

            if (hedefListe !== appMode) {
                setAppMode(hedefListe).catch(() => {});
            } else {
                loadData();
                if (depoYeniKayit) depoHareketKayitSonrasiTemizle(kaydedilenStokKodu);
                else if (appMode === 'SIPARIS_GIRIS') renderInputs();
            }

            setTimeout(() => {
                (async () => {
                    try {
                        if (fotoSnap.length && savedId && !fotoDropped) {
                            let chk = null, chkErr = null;
                            ({ data: chk, error: chkErr } = await sb.from('siparisler').select(SIPARIS_FOTO_DB_COL).eq('id', savedId).maybeSingle());
                            if (chkErr) {
                                ({ data: chk, error: chkErr } = await sb.from('siparisler').select('fotograf').eq('id', savedId).maybeSingle());
                            }
                            const raw = chk ? (typeof siparisKayitFotoAlani === 'function' ? siparisKayitFotoAlani(chk) : chk[SIPARIS_FOTO_DB_COL]) : null;
                            const dbFotos = chkErr ? [] : siparisFotograflarFromRaw(raw);
                            if (!dbFotos.length) {
                                siparisFotoLsKaydet(savedId, fotoSnap);
                                siparisFotoKayitSonrasiOnbellek(savedId, fotoSnap);
                                erpToast('Sipariş OK; fotoğraflar cihazda yedeklendi (DB doğrulanamadı).', 'warn', 8000);
                            } else {
                                siparisFotoLsKaydet(savedId, dbFotos);
                                siparisFotoKayitSonrasiOnbellek(savedId, dbFotos);
                            }
                        }
                        if (mamulPayloadSnap && typeof mamulVaryantKayitlariSenkronize === 'function') {
                            const vr = await mamulVaryantKayitlariSenkronize(mamulPayloadSnap, mamulEkMetaSnap || {});
                            if (!vr.ok && vr.error) console.warn('Mamül varyant:', vr.error.message);
                            else {
                                const n = (vr.created || 0) + (vr.updated || 0);
                                if (n > 0) erpToast(`${n} renk varyantı senkronlandı.`, 'success', 3500);
                            }
                        }
                        await syncAllData(false, {
                            silent: true,
                            light: true,
                            tables: [table || 'siparisler'],
                            siparisFirstPageOnly: (table || 'siparisler') === 'siparisler',
                            skipSummary: false
                        });
                        try { siparisFotoLsCacheBirlestir(); } catch (e) {}
                        try { updateSummary(); } catch (e) {}
                        if (typeof erpModeLoadDataGuvenliMi === 'function' && erpModeLoadDataGuvenliMi(appMode) && typeof loadData === 'function') {
                            loadData();
                        }
                    } catch (e) {
                        console.warn('kayit arka plan:', e?.message || e);
                    }
                })();
            }, 20);
        } else {
            erpToast("Kayıt başarısız: " + error.message, 'error', 3600);
        }
    } catch (err) {
        erpToast("Kayıt başarısız: " + err.message, 'error', 3600);
    } finally {
        isSaveInProgress = false;
    }
}

// --- Sipariş listesi: detay modal (okunaklı özet + kalem tablosu) ---
const SIPARIS_NOTLAR_V = 1;

function siparisNotlariYeniId() {
    return 'sn_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function siparisErpUser() {
    return String(erpCurrentUser?.display_name || erpCurrentUser?.username || 'Admin').trim();
}

function siparisNotlariParse(raw) {
    const s = String(raw || '').trim();
    if (!s) return [];
    if (s.startsWith('{') || s.startsWith('[')) {
        try {
            const j = JSON.parse(s);
            if (j && Number(j.v) === SIPARIS_NOTLAR_V && Array.isArray(j.items)) {
                return j.items.map(it => ({
                    id: String(it.id || siparisNotlariYeniId()),
                    metin: String(it.metin || '').trim(),
                    yapildi: !!it.yapildi,
                    ts: it.ts || null,
                    user: String(it.user || '').trim() || null,
                    yapildi_ts: it.yapildi_ts || null,
                    yapildi_user: String(it.yapildi_user || '').trim() || null
                })).filter(it => it.metin);
            }
        } catch (e) {}
    }
    return [{
        id: siparisNotlariYeniId(),
        metin: s,
        yapildi: false,
        ts: null,
        user: null,
        yapildi_ts: null,
        yapildi_user: null
    }];
}

function siparisNotlariSerialize(items) {
    const clean = (items || []).map(it => ({
        id: it.id,
        metin: String(it.metin || '').trim(),
        yapildi: !!it.yapildi,
        ts: it.ts || null,
        user: it.user || null,
        yapildi_ts: it.yapildi_ts || null,
        yapildi_user: it.yapildi_user || null
    })).filter(it => it.metin);
    if (!clean.length) return null;
    return JSON.stringify({ v: SIPARIS_NOTLAR_V, items: clean });
}

function siparisNotlariSirala(items) {
    return [...(items || [])].sort((a, b) => {
        if (a.yapildi !== b.yapildi) return a.yapildi ? 1 : -1;
        const ta = a.ts ? new Date(a.ts).getTime() : 0;
        const tb = b.ts ? new Date(b.ts).getTime() : 0;
        return ta - tb;
    });
}

let _siparisNotlarFiltre = 'TUMU';

function siparisNotFiltreSec(filtre) {
    _siparisNotlarFiltre = filtre === 'BEKLEYEN' || filtre === 'TAMAMLANDI' ? filtre : 'TUMU';
    const sip = (typeof currentData !== 'undefined' && selectedIndex != null) ? currentData[selectedIndex] : null;
    if (sip && sip.id != null) siparisNotlarPanelYenile(sip.id);
}

function siparisNotZamanKisa(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    const dk = Math.floor(diff / 60000);
    if (dk < 1) return 'Az önce';
    if (dk < 60) return dk + ' dk önce';
    const sa = Math.floor(dk / 60);
    if (sa < 24) return sa + ' sa önce';
    const gun = Math.floor(sa / 24);
    if (gun < 7) return gun + ' gün önce';
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

const SN_CHECK_SVG = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6l2.5 2.5 4.5-5"/></svg>';

function siparisNotSatirHtml(it, siparisId) {
    const yap = !!it.yapildi;
    const ekleyen = it.user ? pdfEsc(it.user) : '—';
    const ekZaman = siparisNotZamanKisa(it.ts) || (it.ts ? new Date(it.ts).toLocaleString('tr-TR') : '');
    const tamZaman = yap && it.yapildi_ts ? siparisNotZamanKisa(it.yapildi_ts) : '';
    const tamlayan = yap && it.yapildi_user ? pdfEsc(it.yapildi_user) : '';
    const badge = yap
        ? '<span class="sn-meta-badge sn-meta-badge--tam">Tamamlandı</span>'
        : '<span class="sn-meta-badge sn-meta-badge--bek">Bekliyor</span>';
    const metaTam = yap && tamZaman
        ? `<span class="sn-meta-item">✓ ${tamZaman}${tamlayan ? ' · ' + tamlayan : ''}</span>`
        : '';
    const actLbl = yap ? 'Geri al' : 'Tamamla';
    const actCls = yap ? 'sn-act sn-act--tam' : 'sn-act';
    const nid = pdfEsc(it.id);
    return `<div class="sn-item${yap ? ' sn-item--done' : ''}" data-not-id="${nid}" data-yapildi="${yap ? '1' : '0'}">
        <button type="button" class="sn-check" data-sn-action="toggle" data-not-id="${nid}" title="${yap ? 'Tamamlanmadı işaretle' : 'Tamamlandı işaretle'}">${yap ? SN_CHECK_SVG : ''}</button>
        <div class="sn-body">
            <div class="sn-text">${pdfEsc(it.metin)}</div>
            <div class="sn-meta">
                ${badge}
                <span class="sn-meta-item">${ekleyen}${ekZaman ? ' · ' + ekZaman : ''}</span>
                ${metaTam}
            </div>
        </div>
        <div class="sn-item-acts">
            <button type="button" class="${actCls}" data-sn-action="toggle" data-not-id="${nid}">${actLbl}</button>
            <button type="button" class="sn-act sn-act--sil" data-sn-action="sil" data-not-id="${nid}" title="Notu sil">Sil</button>
        </div>
    </div>`;
}

function siparisNotListeHtml(siparisId, items, filtre) {
    const all = siparisNotlariSirala(items);
    if (!all.length) {
        return `<div class="sn-bos">
            <div class="sn-bos-icon">📝</div>
            <div class="sn-bos-t">Henüz not yok</div>
            <div class="sn-bos-s">Yukarıdaki alana yazıp <b>Ekle</b> ile ilk notu oluşturun.</div>
        </div>`;
    }
    const f = filtre || _siparisNotlarFiltre || 'TUMU';
    let bekleyen = all.filter(x => !x.yapildi);
    let tamamlanan = all.filter(x => x.yapildi);
    if (f === 'BEKLEYEN') tamamlanan = [];
    else if (f === 'TAMAMLANDI') bekleyen = [];
    if (!bekleyen.length && !tamamlanan.length) {
        return `<div class="sn-bos-filtre">
            <div class="sn-bos-t">Bu filtrede not yok</div>
            <div class="sn-bos-s">Farklı bir sekme seçin veya yeni not ekleyin.</div>
        </div>`;
    }
    let html = '';
    if (bekleyen.length) {
        html += (f === 'TUMU' ? '<div class="sn-grup-bas">Bekleyen · ' + bekleyen.length + '</div>' : '');
        html += '<div class="sn-list">' + bekleyen.map(it => siparisNotSatirHtml(it, siparisId)).join('') + '</div>';
    }
    if (tamamlanan.length) {
        html += (f === 'TUMU' ? '<div class="sn-grup-bas">Tamamlanan · ' + tamamlanan.length + '</div>' : '');
        html += '<div class="sn-list">' + tamamlanan.map(it => siparisNotSatirHtml(it, siparisId)).join('') + '</div>';
    }
    return html;
}

function siparisNotFiltreToolbarHtml(siparisId, items) {
    const all = items || [];
    const nBek = all.filter(x => !x.yapildi).length;
    const nTam = all.filter(x => x.yapildi).length;
    const f = _siparisNotlarFiltre || 'TUMU';
    const mk = (key, lbl, say) => {
        const on = f === key ? ' sn-filtre-btn--on' : '';
        return `<button type="button" class="sn-filtre-btn${on}" onclick="siparisNotFiltreSec('${key}')">${lbl}${say != null ? ' (' + say + ')' : ''}</button>`;
    };
    return `<div class="sn-toolbar">${mk('TUMU', 'Tümü', all.length)}${mk('BEKLEYEN', 'Bekleyen', nBek)}${mk('TAMAMLANDI', 'Tamamlanan', nTam)}</div>`;
}

function siparisDetayNotSayisi(i) {
    let n = 0;
    if (erpIsAdmin()) n += siparisNotlariParse(i.notlar).length;
    siparisListeKalemleriArr(i).forEach(k => {
        if (String(k.not || k.notlar || '').trim()) n++;
    });
    return n;
}

function buildSiparisDetayNotlarHtml(i) {
    let html = '';
    if (erpIsAdmin()) {
        const items = siparisNotlariParse(i.notlar);
        const bekleyen = items.filter(x => !x.yapildi).length;
        const tamamlanan = items.filter(x => x.yapildi).length;
        const pct = items.length ? Math.round((tamamlanan / items.length) * 100) : 0;
        html += `
        <div class="siparis-notlar-gorev-panel" id="siparis-notlar-gorev-${i.id}">
            <div class="sn-head">
                <div>
                    <div class="sn-head-title">İş takip notları</div>
                    <div class="sn-head-sub">Üretim, planlama ve iç iletişim notları</div>
                </div>
                <div class="sn-chips">
                    <span class="sn-chip sn-chip--bek">${bekleyen} bekliyor</span>
                    <span class="sn-chip sn-chip--tam">${tamamlanan} tamam</span>
                    <span class="sn-chip">${items.length} toplam</span>
                </div>
            </div>
            ${items.length ? `<div class="sn-progress" title="%${pct} tamamlandı"><div class="sn-progress-bar" style="width:${pct}%"></div></div>` : ''}
            <div class="sn-composer">
                <div class="sn-composer-row">
                    <textarea id="siparis-not-yeni-${i.id}" class="sn-composer-input" rows="2" placeholder="Yeni not yazın…"></textarea>
                    <button type="button" id="siparis-not-ekle-btn-${i.id}" class="btn-pro btn-primary-pro sn-composer-btn">Ekle</button>
                </div>
                <div class="sn-composer-hint">Ctrl+Enter ile hızlı kaydet</div>
            </div>
            ${items.length ? siparisNotFiltreToolbarHtml(i.id, items) : ''}
            <div class="sn-list-wrap" id="siparis-not-liste-wrap-${i.id}">${siparisNotListeHtml(i.id, items)}</div>
        </div>`;
    }
    const kalemNotlar = siparisListeKalemleriArr(i).map((k, ix) => ({
        ix,
        ad: k.ad || k.kod || ('Kalem ' + (ix + 1)),
        not: String(k.not || k.notlar || '').trim()
    })).filter(r => r.not);
    if (kalemNotlar.length) {
        html += `
        <div class="sn-kalem-panel">
            <div class="sn-kalem-head">
                <span class="sn-kalem-head-t">Sipariş girişi — kalem notları</span>
                <span class="pill pill-gray" style="font-size:9px;padding:2px 8px;font-weight:600">${kalemNotlar.length}</span>
            </div>
            <div class="sn-kalem-list">
                ${kalemNotlar.map(r => `
                <div class="sn-kalem-item">
                    <div class="sn-kalem-ust">
                        <span class="sn-kalem-no">#${r.ix + 1}</span>
                        <span class="sn-kalem-ad">${pdfEsc(r.ad)}</span>
                    </div>
                    <div class="sn-kalem-metin">${pdfEsc(r.not)}</div>
                </div>`).join('')}
            </div>
        </div>`;
    }
    if (!html) {
        html = `<div class="sn-bos" style="margin:8px 0">
            <div class="sn-bos-icon">📝</div>
            <div class="sn-bos-t">Bu siparişe ait not bulunmuyor</div>
            <div class="sn-bos-s">Sipariş girişinde kalem notu eklerseniz burada görünür.</div>
        </div>`;
    }
    return html;
}

function siparisNotComposerKeydown(ev, siparisId) {
    if (ev.ctrlKey && ev.key === 'Enter') {
        ev.preventDefault();
        siparisNotEkle(siparisId);
    }
}

function siparisNotlarTabBadgeGuncelle(siparis) {
    const btn = document.getElementById('siparis-tab-btn-notlar');
    if (!btn || !siparis) return;
    const notSay = siparisDetayNotSayisi(siparis);
    btn.innerHTML = notSay > 0
        ? `Sipariş notları <span style="opacity:0.85;font-size:9px">(${notSay})</span>`
        : 'Sipariş notları';
}

function siparisNotlarPanelYenile(siparisId) {
    const sid = String(siparisId || '');
    const sip = (dataCache.siparisler || []).find(s => String(s.id) === sid)
        || (typeof currentData !== 'undefined' && selectedIndex != null && currentData[selectedIndex] && String(currentData[selectedIndex].id) === sid ? currentData[selectedIndex] : null);
    if (!sip) return;
    const panel = document.getElementById('siparis-modal-tab-notlar');
    if (panel) {
        panel.innerHTML = buildSiparisDetayNotlarHtml(sip);
        siparisNotlarPanelWire(sip.id);
    }
    siparisNotlarTabBadgeGuncelle(sip);
    const planHost = document.getElementById('planlama-notlar-list');
    if (planHost) {
        const siparisler = (dataCache.siparisler || []).filter(s => String(s.durum || '').toUpperCase() !== 'TAMAMLANDI');
        planHost.innerHTML = planlamaNotlarListeHtml(siparisler);
    }
}

function siparisNotlarPanelWire(siparisId) {
    const sid = String(siparisId || '');
    const root = document.getElementById('siparis-notlar-gorev-' + sid);
    if (!root) return;
    root.onclick = (ev) => {
        const btn = ev.target.closest('[data-sn-action]');
        if (btn) {
            ev.preventDefault();
            ev.stopPropagation();
            const notId = btn.getAttribute('data-not-id');
            const action = btn.getAttribute('data-sn-action');
            if (!notId) return;
            if (action === 'toggle') {
                const row = btn.closest('.sn-item');
                const yap = row && row.classList.contains('sn-item--done');
                siparisNotDurumDegistir(siparisId, notId, !yap);
            } else if (action === 'sil') {
                siparisNotSil(siparisId, notId);
            }
            return;
        }
        const row = ev.target.closest('.sn-item[data-not-id]');
        if (row) {
            const notId = row.getAttribute('data-not-id');
            if (!notId) return;
            const yap = row.classList.contains('sn-item--done');
            siparisNotDurumDegistir(siparisId, notId, !yap);
        }
    };
    const ekleBtn = document.getElementById('siparis-not-ekle-btn-' + sid);
    if (ekleBtn) ekleBtn.onclick = () => siparisNotEkle(siparisId);
    const ta = document.getElementById('siparis-not-yeni-' + sid);
    if (ta) ta.onkeydown = (ev) => siparisNotComposerKeydown(ev, siparisId);
}

async function siparisNotlarDbKaydet(siparisId, items, logMesaj) {
    const sip = (dataCache.siparisler || []).find(s => String(s.id) === String(siparisId));
    if (!sip) throw new Error('Sipariş bulunamadı');
    const user = siparisErpUser();
    const notlar = siparisNotlariSerialize(items);
    const ts = new Date().toLocaleString('tr-TR');
    const eskiGecmis = String(sip.islem_gecmisi || '');
    const yeniGecmis = logMesaj
        ? eskiGecmis + `\n═══════════════════════════════\n📝 ${ts} — [${user}]\n  • ${logMesaj}`
        : eskiGecmis;
    const { error } = await sb.from('siparisler').update({
        notlar,
        updated_by: user,
        islem_gecmisi: yeniGecmis
    }).eq('id', siparisId);
    if (error) throw error;
    sip.notlar = notlar;
    if (logMesaj) {
        sip.islem_gecmisi = yeniGecmis;
        sip.updated_by = user;
    }
    const cacheIdx = (dataCache.siparisler || []).findIndex(s => String(s.id) === String(siparisId));
    if (cacheIdx >= 0) {
        dataCache.siparisler[cacheIdx] = { ...dataCache.siparisler[cacheIdx], notlar, ...(logMesaj ? { islem_gecmisi: yeniGecmis, updated_by: user } : {}) };
    }
    if (typeof currentData !== 'undefined' && selectedIndex != null && currentData[selectedIndex] && String(currentData[selectedIndex].id) === String(siparisId)) {
        currentData[selectedIndex] = { ...currentData[selectedIndex], notlar, ...(logMesaj ? { islem_gecmisi: yeniGecmis, updated_by: user } : {}) };
    }
}

async function siparisNotEkle(siparisId) {
    if (!erpIsAdmin()) {
        erpToast('Sipariş notları yalnızca admin hesapları tarafından eklenebilir.', 'error');
        return;
    }
    const ta = document.getElementById('siparis-not-yeni-' + siparisId);
    const btn = document.getElementById('siparis-not-ekle-btn-' + siparisId);
    const metin = String(ta?.value || '').trim();
    if (!metin) {
        erpToast('Not metni boş olamaz.', 'warn');
        return;
    }
    const sip = (dataCache.siparisler || []).find(s => String(s.id) === String(siparisId));
    if (!sip) {
        erpToast('Sipariş bulunamadı.', 'error');
        return;
    }
    const items = siparisNotlariParse(sip.notlar);
    items.push({
        id: siparisNotlariYeniId(),
        metin,
        yapildi: false,
        ts: new Date().toISOString(),
        user: siparisErpUser(),
        yapildi_ts: null,
        yapildi_user: null
    });
    if (btn) { btn.disabled = true; btn.textContent = 'Ekleniyor…'; }
    try {
        await siparisNotlarDbKaydet(siparisId, items, 'Yeni not eklendi: ' + metin.slice(0, 80));
        if (ta) ta.value = '';
        siparisNotlarPanelYenile(siparisId);
        const ta2 = document.getElementById('siparis-not-yeni-' + siparisId);
        if (ta2) ta2.focus();
        erpToast('Not eklendi.', 'success');
    } catch (e) {
        erpToast('Not eklenemedi: ' + (e?.message || e), 'error', 5000);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Ekle'; }
    }
}

async function siparisNotDurumDegistir(siparisId, notId, yapildi) {
    if (!erpIsAdmin()) {
        erpToast('Not durumu yalnızca admin tarafından değiştirilebilir.', 'error');
        siparisNotlarPanelYenile(siparisId);
        return;
    }
    const sip = (dataCache.siparisler || []).find(s => String(s.id) === String(siparisId));
    if (!sip) return;
    const items = siparisNotlariParse(sip.notlar);
    const it = items.find(x => String(x.id) === String(notId));
    if (!it) return;
    const yeni = yapildi !== undefined ? !!yapildi : !it.yapildi;
    if (it.yapildi === yeni) return;
    it.yapildi = yeni;
    if (it.yapildi) {
        it.yapildi_ts = new Date().toISOString();
        it.yapildi_user = siparisErpUser();
    } else {
        it.yapildi_ts = null;
        it.yapildi_user = null;
    }
    try {
        const log = it.yapildi
            ? 'Not tamamlandı: ' + it.metin.slice(0, 80)
            : 'Not geri alındı: ' + it.metin.slice(0, 80);
        await siparisNotlarDbKaydet(siparisId, items, log);
        siparisNotlarPanelYenile(siparisId);
    } catch (e) {
        erpToast('Not güncellenemedi: ' + (e?.message || e), 'error', 5000);
        siparisNotlarPanelYenile(siparisId);
    }
}

async function siparisNotSil(siparisId, notId) {
    if (!erpIsAdmin()) {
        erpToast('Not silme yalnızca admin tarafından yapılabilir.', 'error');
        return;
    }
    const sip = (dataCache.siparisler || []).find(s => String(s.id) === String(siparisId));
    if (!sip) return;
    const items = siparisNotlariParse(sip.notlar);
    const it = items.find(x => String(x.id) === String(notId));
    if (!it) return;
    if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;
    const kalan = items.filter(x => String(x.id) !== String(notId));
    try {
        await siparisNotlarDbKaydet(siparisId, kalan, 'Not silindi: ' + it.metin.slice(0, 80));
        siparisNotlarPanelYenile(siparisId);
        erpToast('Not silindi.', 'success');
    } catch (e) {
        erpToast('Not silinemedi: ' + (e?.message || e), 'error', 5000);
    }
}

function siparisKalemTabloPanelHtml(kalemler) {
    if (kalemler.length) {
        return `
        <div class="siparis-kalem-panel">
            <div class="siparis-kalem-head">
                <span class="siparis-kalem-head-title">Sipariş kalemleri</span>
                <span class="pill pill-gray" style="font-size:9px;padding:2px 8px;font-weight:600">${kalemler.length} satır</span>
            </div>
            <div class="siparis-kalem-scroll" data-scroll-key="ozet-kalemler">
                <table class="dt-table siparis-kalem-tablo" style="width:100%;min-width:920px;border-collapse:separate;border-spacing:0">
                    <thead>
                        <tr>
                            <th style="text-align:left;white-space:nowrap">#</th>
                            <th style="text-align:left;min-width:160px">Ürün</th>
                            <th style="text-align:left;min-width:88px">Kod</th>
                            <th style="text-align:left;min-width:72px">Grup</th>
                            <th style="text-align:left;min-width:88px">Renk</th>
                            <th style="text-align:left;min-width:80px">Ebat</th>
                            <th style="text-align:left;min-width:100px">Renk kodu</th>
                            <th style="text-align:right;white-space:nowrap">Miktar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${kalemler.map((k, ix) => {
                            const rk = siparisKalemRenkKoduMetni(k);
                            return `<tr>
                                <td style="font-family:'DM Mono',monospace;color:var(--text3);vertical-align:top">${ix + 1}</td>
                                <td style="font-weight:500;color:var(--text);vertical-align:top;line-height:1.4">${pdfEsc(k.ad || '—')}</td>
                                <td style="color:var(--text2);vertical-align:top">${pdfEsc(k.kod || '—')}</td>
                                <td style="color:var(--text2);vertical-align:top">${pdfEsc(k.grup || '—')}</td>
                                <td style="color:var(--text2);vertical-align:top">${pdfEsc(k.renk || '—')}</td>
                                <td style="color:var(--text2);vertical-align:top;white-space:nowrap">${pdfEsc(k.ebat || '—')}</td>
                                <td style="font-size:11px;color:var(--text2);word-break:break-word;vertical-align:top;max-width:14rem">${rk ? pdfEsc(rk) : '—'}</td>
                                <td style="text-align:right;font-weight:600;font-family:'DM Mono',monospace;vertical-align:top;white-space:nowrap">${(parseFloat(k.miktar) || 0).toLocaleString('tr-TR')} <span style="font-weight:500;color:var(--text3);font-size:9px">${pdfEsc(String(k.birim || 'ADET').toLowerCase())}</span></td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    }
    return `
        <div style="padding:16px 18px;border:1px dashed var(--border);border-radius:11px;background:var(--surface2)">
            <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:4px">Kalem satırı yok</div>
            <div style="font-size:11px;color:var(--text3);line-height:1.45">Bu siparişte ürün satırı tanımlı değil. Düzenle ile kalemleri ekleyebilirsiniz.</div>
        </div>`;
}

/** Konfeksiyon panelinde kaydedilen sevk_edilen öncelikli; operasyon günlüğü yalnızca KD boşsa. */
/** Kalem filtresi olmadan işlem kodlarına göre toplam (SEVK satırları günlükte görünüp kalem eşleşmeyebilir). */
/** Sipariş durum inceleme + tek sipariş rapor detayı: sol sipariş özeti, sağda ürün ağacı sırasıyla aşamalar */
/** Sipariş durum inceleme — geniş tablonun yatay scroll konumu (canlı yenilemede sıfırlanmasın; masaüstüyle aynı) */
// --- KAYIT DETAYI ---
function syncKartGirisBaslik(mod, kayit) {
    const ft = document.getElementById('form-title');
    if (!ft) return;
    const kod = kayit?.desen_kodu || kayit?.stok_kodu || '';
    const basliklar = {
        IPLIK_KART_GIRIS: kod ? `İplik Kartı — ${kod}` : 'İplik Kartı — Düzenleme',
        KUMAS_KART_GIRIS: kod ? `Kumaş Kartı — ${kod}` : 'Kumaş Kartı — Düzenleme',
        MAMUL_KART_GIRIS: kod ? `Mamül Kartı — ${kod}` : 'Mamül Kartı — Düzenleme',
    };
    ft.innerText = basliklar[mod] || 'Kayıt Güncelleme';
}

function iplikKartGirisFormDoldur(i) {
    const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    sv('val-stok-kodu', i.stok_kodu);
    sv('val-iplik-no', i.iplik_no);
    sv('val-marka', i.marka);
    sv('val-cins', i.cins);
    sv('val-renk', i.renk);
    sv('val-bukum', i.bukum);
    sv('val-bukum-yonu', i.bukum_yonu);
    sv('val-mukavemet', i.mukavemet);
    sv('val-uzama', i.uzama);
    sv('val-ip-kolu', i.ip_kolu);
    sv('val-bobin-uzunluk', i.bobin_uzunluk);
    sv('val-nem', i.nem);
    sv('val-kalite-kat', i.kalite_kat);
    sv('val-tedarikci', i.tedarikci);
    sv('val-depo-konum', i.depo_konum);
    sv('val-cuval-rengi', i.cuval_rengi);
    sv('val-araci-firma', i.araci_firma);
    sv('val-min-stok', i.min_stok);
    sv('val-fiyat', i.fiyat);
    sv('val-para-birimi', i.para_birimi);
    sv('val-kullanim', i.kullanim);
    sv('val-kalite-durum', i.kalite);
    sv('val-notlar', typeof iplikLotsTemizle === 'function' ? iplikLotsTemizle(i.notlar) : i.notlar);
    if (typeof iplikKartLotlariDoldur === 'function') iplikKartLotlariDoldur(i);
}

function kumasKartGirisFormDoldur(i) {
    const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
    sv('val-kodu', i.desen_kodu);
    sv('val-firma', i.firma);
    sv('val-desen-adi', i.desen_adi);
    sv('val-tarak-no', i.tarak_no);
    sv('val-tarak-eni', i.tarak_eni);
    sv('val-atki-sikligi', i.atki_sikligi);
    sv('val-kumas-cinsi', kumasKartKumasCinsiOku(i));
    kumasKartGirisTipi = kumasKartTipiOku(i);
    if (document.getElementById('val-kumas-tipi')) document.getElementById('val-kumas-tipi').value = kumasKartGirisTipi;
    setTimeout(() => kumasKartTipiFormGuncelle(), 50);
    sv('val-urun-grubu', kumasKartUrunGrubuOku(i));
    sv('val-ana-grup', (typeof kumasAlan === 'function' ? kumasAlan(i, 'ana_grup', i.ana_grup) : i.ana_grup) || 'EV TEKSTİLİ');
    sv('val-urun-adi', i.urun_adi);
    sv('val-cozgu-iplik-no', numuneKodAlaniniNormalizeEt(i.cozgu_no || ''));
    sv('val-cozgu-iplik-marka', i.cozgu_cinsi);
    sv('val-cozgu-no', numuneKodAlaniniNormalizeEt(i.cozgu_no || ''));
    sv('val-cozgu-cinsi', i.cozgu_cinsi);
    sv('val-cozgu-sikligi', typeof kumasAlan === 'function' ? kumasAlan(i, 'cozgu_sikligi', i.cozgu_sikligi) : i.cozgu_sikligi);
    sv('val-renk-kodu', i.renk);
    sv('val-ham-en', i.ham_en);
    sv('val-ham-boy', i.ham_boy);
    sv('val-ham-gramaj', i.ham_gramaj);
    sv('val-ham-gsm', i.ham_gsm);
    sv('val-mamul-en', i.mamul_en);
    sv('val-mamul-boy', i.mamul_boy);
    sv('val-mamul-gramaj', i.mamul_gramaj);
    sv('val-mamul-gsm', i.mamul_gsm);
    sv('val-terbiye', typeof kumasAlan === 'function' ? kumasAlan(i, 'terbiye', i.terbiye) : i.terbiye);
    sv('val-boya-not', typeof kumasAlan === 'function' ? kumasAlan(i, 'boya_not', i.boya_not) : i.boya_not);
    sv('val-cekme', typeof kumasAlan === 'function' ? kumasAlan(i, 'cekme', i.cekme) : i.cekme);
    sv('val-durum', i.kalite || 'AKTİF');
    sv('val-notlar', kumasKartSistemNotuTemizle(i.notlar));
    setTimeout(() => {
        const c1 = document.getElementById('atki-renk-container');
        if (c1 && typeof addAtkiRenk === 'function') {
            c1.innerHTML = '';
            atkiRenkCount = 0;
            if (i.atki_renkleri) {
                String(i.atki_renkleri).split(' | ').forEach(row => {
                    const p = typeof parseAtkiRenkSatiri === 'function' ? parseAtkiRenkSatiri(row) : { no: '', cins: '', renk: '', sayi: '' };
                    addAtkiRenk(p.no, p.cins, p.renk, p.sayi);
                });
            } else {
                addAtkiRenk();
            }
        } else if (typeof kumasKartAtkiFormYukle === 'function') {
            kumasKartAtkiFormYukle(i);
        }
    }, 60);
    erpFotoOnizleGuncelle((typeof kartFotografSrc === 'function' ? kartFotografSrc(i) : i.fotograf) || null);
}

function kartGirisFormDoldur(i, mod) {
    if (!i || !mod) return;
    if (mod === 'IPLIK_KART_GIRIS') iplikKartGirisFormDoldur(i);
    else if (mod === 'MAMUL_KART_GIRIS') {
        if (typeof mamulKartGirisFormDoldur === 'function') {
            const anaKayit = mamulKartGirisFormDoldur(i);
            if (anaKayit?.id) {
                editingId = anaKayit.id;
                originalRecordSnapshot = { ...anaKayit };
            }
        }
    }
    else if (mod === 'KUMAS_KART_GIRIS') kumasKartGirisFormDoldur(i);
}

function editRecordFromList(idx) {
    selectedIndex = idx;
    editRecord();
}

// --- DÜZENLEME ---
// --- PDF EXPORT ---
// --- ÖZET GÜNCELLEME ---
// --- KUMAŞ STOK ARAMA ---

// --- KUMAŞ ÇIKIŞ KONTROLÜ ---

// --- İPLİK ÇIKIŞ KONTROLÜ ---
// --- İPLİK ARAMA (YENİ SİSTEM) ---

// --- İPLİK ARAMA (ESKİ - GERİ UYUM) ---
// --- YENİ İPLİK KARTI HAZIRLAMA (TEK TANIM) ---
// Arama'dan Kart Girişine yönlendirme
// Toast bildirimi
// Dropdown portal — overflow:hidden sorununu aşmak için body'e taşı
(function erpMobilDropdownScrollResizeBind() {
    const onScroll = (e) => {
        try {
            if (dropdownScrollIcerisindeMi(e)) return;
            repositionOpenDropdowns();
            const idx = window._mamulTopluDropIdx;
            const drop = document.getElementById('mamul-toplu-kod-drop');
            if (idx >= 0 && drop && drop.classList.contains('is-open') && typeof mamulTopluKodDropKonumla === 'function') {
                const inp = document.getElementById('mt-kod-' + idx);
                if (inp) mamulTopluKodDropKonumla(inp, drop);
            }
        } catch (err) {}
    };
    const onResize = () => { try { repositionOpenDropdowns(); } catch (e) {} };
    const scrollHandler = (typeof erpRafThrottle === 'function') ? erpRafThrottle(onScroll) : onScroll;
    const resizeHandler = (typeof erpDebounce === 'function') ? erpDebounce(onResize, 120) : onResize;
    window.addEventListener('scroll', scrollHandler, true);
    window.addEventListener('resize', resizeHandler);
})();

// Dışarı tıklanınca kapat
document.addEventListener('click', function(e) {
    const ids = ['val-iplik-search','val-kumas-search','mamul-search'];
    const dropIds = ['iplik-search-results','kumas-search-results','mamul-search-results'];
    let inside = false;
    ids.forEach((id, i) => {
        const inp = document.getElementById(id);
        const drop = document.getElementById(dropIds[i]);
        if ((inp && inp.contains(e.target)) || (drop && drop.contains(e.target))) inside = true;
    });
    const topluDrop = document.getElementById('mamul-toplu-kod-drop');
    if (topluDrop && topluDrop.contains(e.target)) inside = true;
    document.querySelectorAll('[id^="mt-kod-"]').forEach(inp => {
        if (inp.contains(e.target)) inside = true;
    });
    if (!inside) hideAllDropdowns();
});

// ============================================================
// SUPABASE KD (Key-Data) YARDIMCI FONKSİYONLARI
// localStorage yerine siparis_akis tablosu kullanır
// tip: 'KD_DOKUMA' | 'KD_KONFEKSIYON' | 'KD_URUN_AGACI'
// ============================================================
  // Bellek cache — aynı oturumda tekrar çekmemek için
/* _kdCacheAt: ana programın çekirdeğinden gelir (assets/erp-core.js) */
try { window.planlamaIhtiyacSatirCacheInvalidate = planlamaIhtiyacSatirCacheInvalidate; } catch (e) {}
try { window.kdCacheStaleMi = kdCacheStaleMi; } catch (e) {}
async function sbKdFetchRemote(siparisId, tip) {
    try {
        const { data, error } = await erpWithTimeout(
            sb.from('siparis_akis')
            .select('id,kalem_ad,notlar,created_at')
            .eq('siparis_id', siparisId)
            .eq('islem', tip)
            .order('created_at', { ascending: false })
            .limit(20),
            `siparis_akis:${tip}`
        );
        if (error) throw error;
        const candidates = (data || [])
            .filter(r => !r?.kalem_ad || String(r.kalem_ad) === String(tip))
            .map(r => {
                try {
                    const parsed = JSON.parse(r?.notlar || '{}') || {};
                    return { row: r, parsed, score: kdDataScore(parsed) };
                } catch (e) {
                    return null;
                }
            })
            .filter(Boolean)
            .sort((a, b) => {
                const ta = new Date(a.row.created_at || 0).getTime();
                const tb = new Date(b.row.created_at || 0).getTime();
                if (tb !== ta) return tb - ta;
                const ds = (b.score || 0) - (a.score || 0);
                if (ds !== 0) return ds;
                return String(b.row.id || '').localeCompare(String(a.row.id || ''), 'tr', { numeric: true, sensitivity: 'base' });
            });
        return (candidates[0]?.parsed) || {};
    } catch (e) {
        console.error('sbKdFetchRemote error', tip, siparisId, e);
        return {};
    }
}

function kdPlainDeepMerge(base, incoming) {
    if (!kdIsPlainObject(base)) base = {};
    if (!kdIsPlainObject(incoming)) return incoming;
    const out = { ...base };
    Object.keys(incoming).forEach((k) => {
        const b = base[k];
        const n = incoming[k];
        if (kdIsPlainObject(b) && kdIsPlainObject(n)) out[k] = kdPlainDeepMerge(b, n);
        else out[k] = n;
    });
    return out;
}

function hideDetailModal() {
    siparisDurumPollStop();
    _detailOpenRecordId = null;
    const modal = document.getElementById('detail-modal');
    if (!modal) return;
    const kapat = () => {
        modal.classList.remove('erp-sheet-closing');
        modal.style.display = 'none';
        const mb = modal.querySelector('.modal-box');
        if (mb) mb.style.removeProperty('max-width');
        const bod = document.getElementById('modal-body');
        if (bod) {
            bod.className = 'modal-body-scroll';
            bod.style.cssText = '';
        }
        document.querySelectorAll('.kayit-gecmis-details').forEach(d => { d.open = false; });
        erpFlushDeferredUiRefresh();
    };
    const mobilSheet = document.body.classList.contains('erp-mobil-lite')
        && window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        && modal.style.display && modal.style.display !== 'none';
    if (mobilSheet) {
        if (window._erpSheetCloseT) clearTimeout(window._erpSheetCloseT);
        modal.classList.add('erp-sheet-closing');
        window._erpSheetCloseT = setTimeout(() => {
            window._erpSheetCloseT = null;
            kapat();
        }, 200);
        return;
    }
    kapat();
}

function openStokExcelImport() {
    const el = document.getElementById('stok-excel-input');
    if (el) el.click();
}

function stokNormIslem(v) {
    const t = String(v || '').toUpperCase();
    if (t.includes('Ç') || t.includes('CIKIS') || t.includes('ÇIKIŞ')) return 'ÇIKIŞ';
    return 'GİRİŞ';
}

window.kartFotografListesi = kartFotografListesi;
window.kartFotografSrc = kartFotografSrc;
window.kartFotografSheetHtml = kartFotografSheetHtml;
window.kartFotoBuyut = function (src) {
    const s = String(src || '').trim();
    if (!s) return;
    kartFotoLightboxEnsure();
    const lb = document.getElementById('kart-foto-lightbox');
    const img = lb && lb.querySelector('img');
    if (!lb || !img) return;
    img.src = s;
    lb.classList.add('is-open');
};
window.kartFotoKapat = function () {
    const lb = document.getElementById('kart-foto-lightbox');
    if (!lb) return;
    lb.classList.remove('is-open');
    const img = lb.querySelector('img');
    if (img) img.removeAttribute('src');
};
window.erpLazyLoadFotograf = erpLazyLoadFotograf;

/* KUMAS_KART_META_KEYS: ana programın çekirdeğinden gelir (assets/erp-core.js) */
window.kumasKartMetaTemizle = kumasKartMetaTemizle;

window.stokListeFiltreOku = stokListeFiltreOku;
window.stokGrupFiltreEslesir = stokGrupFiltreEslesir;
window.stokListeFiltreBarHtml = stokListeFiltreBarHtml;
window.kumasStokListeFiltreYenile = kumasStokListeFiltreYenile;
window.kumasStokListeFiltreleriSifirla = kumasStokListeFiltreleriSifirla;
window.mamulStokListeFiltreYenile = mamulStokListeFiltreYenile;
window.mamulStokListeFiltreleriSifirla = mamulStokListeFiltreleriSifirla;

/** Mamül deposu hareketleri — kumaş (SM-/KUMAS) ile karışmaz */
function kumasKartTipiNorm(tip) {
    const t = String(tip || '').trim().toUpperCase();
    return (t === 'MAMUL' || t === 'MAMUL_KUMAS') ? 'MAMUL' : 'HAM';
}
// kumasKartTipiOku: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
function kumasStokHareketTipiOku(x) {
    const kb = String(x?.kaynak_birim || '').toUpperCase();
    if (kb === 'DEPO_HAREKET_MAMUL_KUMAS' || kb === 'MAMUL_KUMAS') return 'MAMUL';
    if (kb === 'DEPO_HAREKET_HAM_KUMAS' || kb === 'HAM_KUMAS') return 'HAM';
    if (kb === 'DOKUMA_TAKIP') return 'HAM';
    const tag = numuneNotTagOku(x?.notlar, 'KUMAS_TİPİ') || numuneNotTagOku(x?.notlar, 'KUMAS_TIPI');
    if (tag) return kumasKartTipiNorm(tag);
    return 'HAM';
}
function kumasStokHareketiHamKumasMu(x) {
    return kumasStokHareketiKumasDepoMu(x) && kumasStokHareketTipiOku(x) === 'HAM';
}
function kumasStokHareketiMamulKumasMu(x) {
    return kumasStokHareketiKumasDepoMu(x) && kumasStokHareketTipiOku(x) === 'MAMUL';
}
function kumasFormGrubuMu(g) {
    return g === 'KUMAS' || g === 'HAM_KUMAS' || g === 'MAMUL_KUMAS';
}
function kumasDepoGrupNorm(grup) {
    if (grup === 'MAMUL_KUMAS') return 'MAMUL';
    if (grup === 'HAM_KUMAS') return 'HAM';
    return null;
}
function aktifKumasStokGrubu() {
    if (appMode === 'KUMAS') return 'HAM_KUMAS';
    if (depoKomutaHedef === 'KUMAS') return 'HAM_KUMAS';
    if (appMode === 'MAMUL_KUMAS' || depoKomutaHedef === 'MAMUL_KUMAS') return 'MAMUL_KUMAS';
    if (appMode === 'HAM_KUMAS' || depoKomutaHedef === 'HAM_KUMAS') return 'HAM_KUMAS';
    return null;
}
function kumasStokHareketiGrupMu(x, grup) {
    const tip = kumasDepoGrupNorm(grup);
    if (!tip) return kumasStokHareketiKumasDepoMu(x);
    return tip === 'HAM' ? kumasStokHareketiHamKumasMu(x) : kumasStokHareketiMamulKumasMu(x);
}
function kumasKutuphanesiKartiGrupMu(k, grup) {
    if (!kumasKutuphanesiKartiKumasDepoMu(k)) return false;
    const tip = kumasDepoGrupNorm(grup);
    if (!tip) return true;
    return kumasKartTipiOku(k) === tip;
}
function kumasStokBaslikEtiket(grup) {
    if (!kumasDepoGrupNorm(grup)) return 'Kumaş stoğu';
    return kumasDepoGrupNorm(grup) === 'MAMUL' ? 'Mamül kumaş stoğu' : 'Ham kumaş stoğu';
}
function depoKumasKaynakBirimBelirle(stokKodu) {
    const kod = String(stokKodu || '').trim();
    const kart = (dataCache.kumas_kutuphanesi || []).find(k => String(k.desen_kodu || '').trim() === kod);
    return kumasKartTipiOku(kart) === 'MAMUL' ? 'DEPO_HAREKET_MAMUL_KUMAS' : 'DEPO_HAREKET_HAM_KUMAS';
}
function kumasKartSistemNotuTemizle(notlar) {
    return String(notlar || '')
        .replace(/\[KUMAS_T[İI]P[İI]:[^\]]*\]\s*/gi, '')
        .replace(/\[URUN_GRUBU:[^\]]*\]\s*/gi, '')
        .replace(/\[ATKI_IPLIK_NO:[^\]]*\]\s*/gi, '')
        .replace(/\[ATKI_IPLIK_MARKA:[^\]]*\]\s*/gi, '')
        .trim();
}
function kumasKartUrunGrubuOku(kayit) {
    if (!kayit) return 'DİĞER';
    const tag = numuneNotTagOku(kayit.notlar, 'URUN_GRUBU');
    if (tag) return kumasUrunGrubuNorm(tag);
    return kumasUrunGrubuNorm(kayit.kumas_cinsi || kayit.ana_grup);
}
function kumasKartKumasCinsiOku(kayit) {
    const c = String(kayit?.kumas_cinsi || '').trim();
    if (!c) return '';
    if (numuneNotTagOku(kayit?.notlar, 'URUN_GRUBU')) return c;
    const g = kumasUrunGrubuNorm(c);
    if (['MÜSLİN', 'PIKE', 'ÇENDERE', 'GIDA', 'DİĞER'].includes(g) && !/[A-ZÇĞİÖŞÜ]{4,}/i.test(c.replace(g, ''))) return '';
    if (String(kayit?.ana_grup || '').toUpperCase().includes('TEKSTİL')) return '';
    return c;
}
function kumasKartAtkıIplikNoOku(kayit) {
    return numuneKodAlaniniNormalizeEt(numuneNotTagOku(kayit?.notlar, 'ATKI_IPLIK_NO') || '');
}
function kumasKartAtkıIplikMarkaOku(kayit) {
    return numuneNotTagOku(kayit?.notlar, 'ATKI_IPLIK_MARKA');
}
function kumasKartNotlarPaketle(tip, userNotlar, urunGrubu) {
    const satirlar = ['[KUMAS_TİPİ:' + kumasKartTipiNorm(tip) + ']', '[URUN_GRUBU:' + kumasUrunGrubuNorm(urunGrubu || 'DİĞER') + ']'];
    const body = kumasKartSistemNotuTemizle(userNotlar);
    if (body) satirlar.push(body);
    return satirlar.join('\n');
}
let kumasKartAtkiSatirNo = 0;
function kumasKartAtkiSatirEkle(iplikNo = '', marka = '') {
    kumasKartAtkiSatirNo++;
    const n = kumasKartAtkiSatirNo;
    const container = document.getElementById('kumas-atki-iplik-container');
    if (!container) return;
    const esc = v => String(v || '').replace(/"/g, '&quot;');
    const div = document.createElement('div');
    div.className = 'kumas-atki-row';
    div.dataset.row = String(n);
    div.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 32px;gap:8px;align-items:end';
    div.innerHTML = `
        <div>
            <label class="pro-label">İPLİK NO</label>
            <input id="val-kkart-atki-no-${n}" value="${esc(iplikNo)}" class="pro-input" placeholder="40/1"
                oninput="this.value=numuneKodAlaniniNormalizeEt(this.value)" style="font-family:'DM Mono',monospace">
        </div>
        <div>
            <label class="pro-label">MARKA</label>
            <input id="val-kkart-atki-marka-${n}" value="${esc(marka)}" class="pro-input" placeholder="Marka" style="text-transform:uppercase">
        </div>
        <button type="button" onclick="kumasKartAtkiSatirSil(${n})" class="pill pill-gray" style="cursor:pointer;border:none;height:34px" title="Sil">✕</button>`;
    container.appendChild(div);
}
function kumasKartAtkiSatirSil(n) {
    const rows = document.querySelectorAll('#kumas-atki-iplik-container .kumas-atki-row');
    if (rows.length <= 1) { erpToast('En az bir atkı satırı kalmalı.', 'warn'); return; }
    const el = document.querySelector(`#kumas-atki-iplik-container .kumas-atki-row[data-row="${n}"]`);
    if (el) el.remove();
}
function kumasKartAtkiTopla() {
    const arr = [];
    document.querySelectorAll('#kumas-atki-iplik-container .kumas-atki-row').forEach(row => {
        const n = row.dataset.row;
        const no = numuneKodAlaniniNormalizeEt(document.getElementById('val-kkart-atki-no-' + n)?.value || '');
        const marka = (document.getElementById('val-kkart-atki-marka-' + n)?.value || '').trim().toUpperCase();
        if (no || marka) arr.push((no || '—') + ' - ' + (marka || '—'));
    });
    return arr.join(' | ');
}
function kumasKartAtkıListesiOku(kayit) {
    const list = [];
    if (kayit?.atki_renkleri) {
        String(kayit.atki_renkleri).split(' | ').forEach(row => {
            const p = String(row || '').trim();
            if (!p) return;
            const parts = p.split(' - ').map(x => x.trim());
            const no = parts[0] && parts[0] !== '—' ? parts[0] : '';
            const marka = parts[1] && parts[1] !== '—' ? parts[1] : '';
            if (no || marka) list.push({ no, marka });
        });
    }
    if (!list.length) {
        const no = kumasKartAtkıIplikNoOku(kayit);
        const marka = kumasKartAtkıIplikMarkaOku(kayit);
        if (no || marka) list.push({ no, marka });
    }
    return list;
}
function kumasKartAtkiFormYukle(kayit) {
    const container = document.getElementById('kumas-atki-iplik-container');
    if (!container) return;
    container.innerHTML = '';
    kumasKartAtkiSatirNo = 0;
    const list = kayit ? kumasKartAtkıListesiOku(kayit) : [];
    if (!list.length) kumasKartAtkiSatirEkle();
    else list.forEach(r => kumasKartAtkiSatirEkle(r.no, r.marka));
}
function kumasUrunGrubuNorm(v) {
    const s = String(v || '').trim().toUpperCase()
        .replaceAll('İ', 'I').replaceAll('Ş', 'S').replaceAll('Ğ', 'G').replaceAll('Ü', 'U').replaceAll('Ö', 'O').replaceAll('Ç', 'C');
    if (s.includes('MUSLIN') || s.includes('MÜSLİN') || s === 'MUSLIN') return 'MÜSLİN';
    if (s.includes('PIKE')) return 'PIKE';
    if (s.includes('CENDERE') || s.includes('ÇENDERE')) return 'ÇENDERE';
    if (s.includes('GIDA')) return 'GIDA';
    if (['MÜSLİN', 'PIKE', 'ÇENDERE', 'GIDA', 'DİĞER'].includes(String(v || '').trim().toUpperCase())) return String(v || '').trim().toUpperCase();
    return 'DİĞER';
}
const MAMUL_DOKUMA_TALIMAT_ALANLARI = [
    ['musteri', 'MÜŞTERİ'],
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
    ['ham_gram_m2', 'HAM GRAM/M2'],
    ['mamul_gram_mtul', 'MAMÜL GRAM/MTÜL'],
    ['mamul_gram_m2', 'MAMÜL GRAM/M2'],
    ['tahar_raporu', 'TAHAR RAPORU'],
];

// stokKartDokumaAlanlariOku: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
// mamulDokumaTalimatDetayPanelHtml: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
function mamulVaryantDoluMu(v) {
    if (!v) return false;
    if (String(v.renk_etiket || '').trim()) return true;
    return (Array.isArray(v.atki) ? v.atki : []).some(a =>
        String(a?.iplik_no || '').trim() || String(a?.renk || '').trim() || String(a?.atki_sayisi || '').trim()
    );
}

function mamulVaryantRenkEtiket(v) {
    if (!v) return '';
    if (String(v.renk_etiket || '').trim()) return String(v.renk_etiket).trim().toUpperCase();
    const renkler = (Array.isArray(v.atki) ? v.atki : [])
        .map(a => String(a?.renk || '').trim())
        .filter(Boolean);
    return renkler.length ? renkler[renkler.length - 1].toUpperCase() : '';
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
        const pr = parseAtkiRenkSatiri(p.replace(/^A\d+\s*:\s*/i, ''));
        if (!pr.no && !pr.cins && !pr.renk && !pr.sayi) return null;
        return {
            iplik_no: pr.no || pr.cins || '',
            renk: pr.renk || '',
            atki_sayisi: pr.sayi || ''
        };
    }).filter(Boolean);
}

function mamulAtkiSatirlariPad(atki) {
    const arr = (Array.isArray(atki) ? atki : []).slice(0, 3).map(a => ({
        iplik_no: String(a?.iplik_no || '').trim(),
        renk: String(a?.renk || '').trim(),
        atki_sayisi: String(a?.atki_sayisi || '').trim()
    }));
    while (arr.length < 3) arr.push({ iplik_no: '', renk: '', atki_sayisi: '' });
    return arr;
}

// mamulListeVaryantVerisiOlustur: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
function mamulAtkiExcelHucre(deger) {
    const s = String(deger ?? '').trim();
    return s ? pdfEsc(s) : '<span class="mamul-atki-excel-tablo__bos">—</span>';
}

// mamulAtkiVaryantExcelListeHtml: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
// mamulUretimKartiGrupBul: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
function exportAktifModalExcel() {
    exportAktifSiparisFormuExcel();
}

function mamulUretimKartiAksiyonBarHtml(anaKod) {
    const kod = erpAttr(anaKod);
    return `<div style="display:flex;flex-wrap:wrap;gap:8px;padding:10px 14px;border-bottom:1px solid var(--border);background:rgba(251,191,36,0.04)">
        <button type="button" onclick="event.stopPropagation();editMamulKartFromListe('${kod}')" class="pill pill-blue" style="cursor:pointer;border:none;font-size:9px;padding:5px 12px">✏️ Kartı Düzenle</button>
    </div>`;
}

function mamulStokListeHucre(deger, cls) {
    const v = String(deger ?? '').trim() || '—';
    return `<span class="mamul-stok-liste-grid__cell ${cls || ''}" title="${pdfEsc(v)}">${pdfEsc(v)}</span>`;
}

// mamulStokBakiyeToplamText: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
// mamulKartListeGruplariOlustur: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
// mamulStokListeTabloBaslikHtml: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
// mamulStokListeTabloKapatHtml: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
window._mamulKartExpanded = window._mamulKartExpanded || new Set();

function mamulKartListeToggle(anaKod, ev) {
    if (ev) { ev.preventDefault(); ev.stopPropagation(); }
    const ana = String(anaKod || '').trim().toUpperCase();
    if (!ana) return;
    if (window._mamulKartExpanded.has(ana)) window._mamulKartExpanded.delete(ana);
    else window._mamulKartExpanded.add(ana);
    if (typeof loadData === 'function') loadData();
}

// mamulStokListeGrupSatirHtml: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
function mamulStokListeSatirHtml(i, idx) {
    const d = stokKartDokumaAlanlariOku(i);
    return `<div class="mamul-stok-liste-grid mamul-stok-liste-grid--row" onclick="showDetail(${idx})">
        <span></span>
        ${mamulStokListeHucre(d.stok_kodu, 'mamul-stok-liste-grid__cell--kod')}
        ${mamulStokListeHucre(d.tarih)}
        ${mamulStokListeHucre(d.musteri)}
        ${mamulStokListeHucre(d.kumas_cinsi)}
        ${mamulStokListeHucre(d.desen_adi, 'mamul-stok-liste-grid__cell--ad')}
        ${mamulStokListeHucre(d.istenen_mamul_ebat)}
        ${mamulStokListeHucre(d.mamul_gram_m2)}
        ${mamulStokListeHucre(d.renk_varyant || d.varyant_ozet)}
        ${mamulStokListeHucre(d.depo_bakiye, 'mamul-stok-liste-grid__cell--stok')}
        ${stokKartListeAksiyonHtml(idx)}
    </div>`;
}

function kumasKartListeHucre(deger, cls) {
    const v = String(deger ?? '').trim() || '—';
    return `<span class="kumas-kart-liste-grid__cell ${cls || ''}" title="${pdfEsc(v)}">${pdfEsc(v)}</span>`;
}
// kumasKartListeTabloBaslikHtml: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
function kumasKartListeCozguOzet(kayit) {
    const no = numuneKodAlaniniNormalizeEt(kayit?.cozgu_no || '');
    const marka = String(kayit?.cozgu_cinsi || '').trim();
    if (!no && !marka) return '';
    return marka ? (no ? no + ' ' + marka : marka) : no;
}
function kumasKartListeAtkiIplikOzet(kayit) {
    const list = kumasKartAtkıListesiOku(kayit);
    if (!list.length) return '';
    return list.map(r => {
        const no = String(r.no || '').trim();
        const marka = String(r.marka || '').trim();
        if (no && marka) return no + ' ' + marka;
        return no || marka;
    }).filter(Boolean).join(' · ');
}
// kumasKartListeSatirHtml: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
function kumasKartTipiFormGuncelle() {
    const sel = document.getElementById('val-kumas-tipi');
    const tip = kumasKartTipiNorm(sel?.value || kumasKartGirisTipi || kumasKartListeFiltre);
    kumasKartGirisTipi = tip;
    kumasKartListeFiltre = tip;
    saveUiState({ kumasKartListeFiltre: tip });
    const mamulPanel = document.getElementById('kumas-mamul-alan-panel');
    if (mamulPanel) mamulPanel.style.display = tip === 'MAMUL' ? 'grid' : 'none';
    document.querySelectorAll('[data-kumas-liste-filtre]').forEach(btn => {
        const aktif = btn.getAttribute('data-kumas-liste-filtre') === tip;
        btn.classList.toggle('pill-green', aktif && tip === 'HAM');
        btn.classList.toggle('pill-cyan', aktif && tip === 'MAMUL');
        btn.classList.toggle('pill-gray', !aktif);
    });
    if (appMode === 'KART_LISTE' && archiveTab === 'KUMAS') loadData();
}

/** kumas_kutuphanesi kartı mamül mü (arama / liste ayrımı) */
/** kumas_kutuphanesi kartı kumaş depo aramasında listelensin mi (mamül / numune hariç) */
function kumasKutuphanesiKartiKumasDepoMu(k) {
    if (!k || kumasKutuphanesiKartiMamulMu(k)) return false;
    const dc = String(k.desen_kodu || '').trim();
    if (!dc) return false;
    if (dc.toUpperCase().startsWith('NU')) return false;
    return true;
}

function excelRowsWithAutoHeader(ws) {
    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (!aoa.length) return [];
    const score = (row) => {
        const hs = (row || []).map(c => siparisExcelNormHeader(c));
        let s = 0;
        if (hs.some(x => x.includes('stok'))) s += 2;
        if (hs.some(x => x.includes('kg') || x.includes('miktar'))) s += 2;
        if (hs.some(x => x.includes('islem') || x.includes('giris') || x.includes('cikis'))) s += 1;
        return s;
    };
    let headerIdx = 0, best = -1;
    aoa.slice(0, Math.min(25, aoa.length)).forEach((r, i) => {
        const sc = score(r);
        if (sc > best) { best = sc; headerIdx = i; }
    });
    // Bazı dosyalarda üstte title/not satırları olur; skor düşükse klasik parser fallback.
    if (best < 2) {
        const direct = XLSX.utils.sheet_to_json(ws, { defval: '' });
        return direct.map(r => {
            const out = {};
            Object.entries(r || {}).forEach(([k, v]) => { out[siparisExcelNormHeader(k)] = v; });
            return out;
        }).filter(r => Object.values(r).some(v => String(v ?? '').trim() !== ''));
    }
    const headers = (aoa[headerIdx] || []).map(h => siparisExcelNormHeader(h));
    return aoa.slice(headerIdx + 1)
        .map(r => {
            const out = {};
            headers.forEach((h, i) => { if (h) out[h] = r[i]; });
            return out;
        })
        .filter(r => Object.values(r).some(v => String(v ?? '').trim() !== ''));
}

function exportDepoHareketExcel() {
    if (typeof XLSX === 'undefined') { erpToast('Excel kütüphanesi yüklenemedi.', 'error'); return; }
    const rows = window._depoDefterRows || [];
    if (!rows.length) { erpToast('Dışa aktarılacak hareket yok. Filtreleri kontrol edin.', 'warn'); return; }
    const out = rows.map(row => {
        const ch = depoKomutaKanalFromKaynak(row.kaynak_birim, row);
        return {
            'Tarih': depoHareketDefterTarihGoster(row),
            'İşlem': row.islem_turu || '',
            'Kanal': ch.etiket,
            'Stok Kodu': row.stok_kodu || '',
            'Tanım': depoHareketDefterTanim(row),
            'Miktar': depoHareketDefterMiktarStr(row),
            'İrsaliye': row.irsaliye_no || '',
            'Firma': row.firma || '',
            'Aracı Firma': row.araci_firma || '',
            'İşlem Yapan': depoHareketIslemYapan(row),
            'Not': depoHareketDefterNotMetin(row),
            'Kaynak': row.kaynak_birim || ''
        };
    });
    const ws = XLSX.utils.json_to_sheet(out);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Depo Hareketleri');
    XLSX.writeFile(wb, `depo-hareketleri-${new Date().toISOString().slice(0, 10)}.xlsx`);
    erpToast(`${rows.length} hareket Excel'e aktarıldı.`, 'success');
}

function downloadStokExcelTemplate() {
    if (typeof XLSX === 'undefined') { alert("Excel kütüphanesi yüklenemedi."); return; }
    const xg = depoStokExcelGrubu();
    let rows = [];
    let aciklama = [];
    if (xg === 'IPLIK') {
        rows = [
            { "İşlem Türü":"GİRİŞ", "Stok Kodu":"IP-001", "İplik No":"NE 30/1", "Lot No":"L-001", "Marka":"XMARK", "Cins":"PAMUK", "Kalite":"1. KALİTE", "KG":1200, "İrsaliye No":"IRS-001", "Çuval Sayısı":24, "Çuval Rengi":"BEYAZ", "Aracı Firma":"ABC LOJISTIK", "Firma":"TEDARIKCI A", "Notlar":"-" },
            { "İşlem Türü":"ÇIKIŞ", "Stok Kodu":"IP-001", "İplik No":"NE 30/1", "Lot No":"L-001", "Marka":"XMARK", "Cins":"PAMUK", "Kalite":"1. KALİTE", "KG":250, "İrsaliye No":"IRS-002", "Çuval Sayısı":5, "Çuval Rengi":"BEYAZ", "Aracı Firma":"ABC LOJISTIK", "Firma":"DOKUMA BOLUMU", "Notlar":"Sipariş sevki" }
        ];
    } else if (xg === 'KUMAS') {
        rows = [
            { "İşlem Türü":"GİRİŞ", "Üretim Yeri":"DOKUMA", "Stok Kodu":"SM-001", "Ürün Grubu":"PIKE", "Ürün Adı":"BORDURLU PIKE", "Ebat":"160x220", "Kumaş Cinsi":"PIKE", "Lot No":"K-001", "Marka":"SIMTEKS", "Renk":"ACIK BEJ", "KG":850, "MT":3000, "Top Sayısı":18, "Depo":"A1", "İrsaliye No":"IRS-101", "Çuval Sayısı":18, "Çuval Rengi":"MAVI", "Aracı Firma":"XYZ NAKLIYE", "Firma":"TEDARIKCI B", "Açıklama":"İlk giriş", "Notlar":"-" },
            { "İşlem Türü":"ÇIKIŞ", "Üretim Yeri":"KONFEKSIYON", "Stok Kodu":"SM-001", "Ürün Grubu":"PIKE", "Ürün Adı":"BORDURLU PIKE", "Ebat":"160x220", "Kumaş Cinsi":"PIKE", "Lot No":"K-001", "Marka":"SIMTEKS", "Renk":"ACIK BEJ", "KG":120, "MT":420, "Top Sayısı":3, "Depo":"A1", "İrsaliye No":"IRS-102", "Çuval Sayısı":3, "Çuval Rengi":"MAVI", "Aracı Firma":"XYZ NAKLIYE", "Firma":"KONFEKSIYON", "Açıklama":"Kesim sevki", "Notlar":"Kesim sevki" }
        ];
    } else if (xg === 'MAMUL_DEPO') {
        rows = [
            { "İşlem Türü":"GİRİŞ", "Stok Kodu":"2026001-1", "Adet":50, "Notlar":"Toplu mamül giriş" },
            { "İşlem Türü":"ÇIKIŞ", "Stok Kodu":"2026001-1", "Adet":10, "İrsaliye No":"IRS-202", "Teslim Türü":"İÇ SATIŞ", "Firma":"MÜŞTERİ A", "Notlar":"Sevkiyat" }
        ];
    } else {
        alert('Şablon için önce stok ekranında (iplik / kumaş / mamül) olun veya Depo stok hareketlerinde grup seçin.');
        return;
    }
    aciklama = [
        { Alan: "İşlem Türü", Açıklama: "GİRİŞ veya ÇIKIŞ", Örnek: "GİRİŞ" },
        { Alan: "Stok Kodu", Açıklama: "Zorunlu", Örnek: "IP-001 / SM-001 / 2026001-1" },
        { Alan: "Üretim Yeri", Açıklama: "Kumaş şablonunda önerilir", Örnek: "DOKUMA" },
        { Alan: "Ürün Grubu", Açıklama: "Kumaş şablonunda önerilir", Örnek: "PIKE" },
        { Alan: "Ürün Adı", Açıklama: "Kumaş şablonunda önerilir", Örnek: "BORDURLU PIKE" },
        { Alan: "Ebat", Açıklama: "Kumaş şablonunda önerilir", Örnek: "160x220" },
        { Alan: "KG", Açıklama: "Zorunlu, sayı", Örnek: "1200" },
        { Alan: "MT", Açıklama: "Sadece Kumaş için opsiyonel", Örnek: "3000" },
        { Alan: "Top Sayısı", Açıklama: "Kumaşta çuval/top adedi", Örnek: "18" },
        { Alan: "Depo", Açıklama: "Kumaşta depo lokasyonu", Örnek: "A1" },
        { Alan: "Açıklama", Açıklama: "Kumaşta not metni", Örnek: "Kesim sevki" },
        { Alan: "Kural", Açıklama: "Her satır bir stok hareketidir", Örnek: "-" }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "StokHareketleri");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(aciklama), "Aciklama");
    const tip = xg === 'IPLIK' ? 'Iplik' : (xg === 'KUMAS' ? 'Kumas' : 'Mamul');
    XLSX.writeFile(wb, `${tip}_Stok_Import_Sablonu_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function downloadSiparisExcelTemplate() {
    if (typeof XLSX === 'undefined') { alert("Excel kütüphanesi yüklenemedi."); return; }
    const rows = [
        {
            "Sipariş No": "SP-1001",
            "Müşteri": "SIMTEKS TEKSTIL",
            "Sipariş Tarihi": "2026-03-01",
            "Termin": "2026-03-20",
            "Durum": "BEKLEMEDE",
            "Grup": "PIKE",
            "Ürün Kod": "URN-001",
            "Ürün Adı": "BORDURLU PIKE",
            "Renk": "ACIK BEJ",
            "Renk Kodu 1": "RK-101",
            "Renk Kodu 2": "RK-102",
            "Renk Kodu 3": "",
            "Renk Kodu 4": "",
            "Renk Kodu 5": "",
            "Renk Kodu 6": "",
            "Ebat": "160x220",
            "Adet/Miktar": 200
        },
        {
            "Sipariş No": "SP-1001",
            "Müşteri": "SIMTEKS TEKSTIL",
            "Sipariş Tarihi": "2026-03-01",
            "Termin": "2026-03-20",
            "Durum": "BEKLEMEDE",
            "Grup": "PIKE",
            "Ürün Kod": "URN-002",
            "Ürün Adı": "BORDURLU PIKE",
            "Renk": "SOMON",
            "Renk Kodu 1": "RK-201",
            "Renk Kodu 2": "",
            "Renk Kodu 3": "",
            "Renk Kodu 4": "",
            "Renk Kodu 5": "",
            "Renk Kodu 6": "",
            "Ebat": "200x220",
            "Adet/Miktar": 150
        },
        {
            "Sipariş No": "SP-1002",
            "Müşteri": "ABC EV TEKSTIL",
            "Sipariş Tarihi": "2026-03-03",
            "Termin": "2026-03-28",
            "Durum": "BEKLEMEDE",
            "Grup": "NEVRESIM",
            "Ürün Kod": "URN-101",
            "Ürün Adı": "NEVRESIM TAKIMI",
            "Renk": "GRI",
            "Renk Kodu 1": "RK-301",
            "Renk Kodu 2": "RK-302",
            "Renk Kodu 3": "",
            "Renk Kodu 4": "",
            "Renk Kodu 5": "",
            "Renk Kodu 6": "",
            "Ebat": "200x220",
            "Adet/Miktar": 500
        }
    ];
    const aciklama = [
        { Alan: "Sipariş No", Açıklama: "Zorunlu. Aynı siparişe ait tüm satırlarda aynı olmalı.", Örnek: "SP-1001" },
        { Alan: "Müşteri", Açıklama: "Zorunlu. Firma / müşteri adı.", Örnek: "SIMTEKS TEKSTIL" },
        { Alan: "Sipariş Tarihi", Açıklama: "Zorunlu. YYYY-MM-DD önerilir.", Örnek: "2026-03-01" },
        { Alan: "Termin", Açıklama: "Zorunlu. YYYY-MM-DD önerilir.", Örnek: "2026-03-20" },
        { Alan: "Durum", Açıklama: "Opsiyonel. Boşsa BEKLEMEDE alınır.", Örnek: "BEKLEMEDE" },
        { Alan: "Grup", Açıklama: "Opsiyonel. Ürün grubu/alt kategori.", Örnek: "PIKE" },
        { Alan: "Ürün Kod", Açıklama: "Opsiyonel ama önerilir.", Örnek: "URN-001" },
        { Alan: "Ürün Adı", Açıklama: "Zorunlu (kalem için).", Örnek: "BORDURLU PIKE" },
        { Alan: "Renk", Açıklama: "Opsiyonel.", Örnek: "SOMON" },
        { Alan: "Renk Kodu 1..6", Açıklama: "Opsiyonel. Sipariş formundaki renk kodu alanları.", Örnek: "RK-101" },
        { Alan: "Ebat", Açıklama: "Opsiyonel.", Örnek: "160x220" },
        { Alan: "Adet/Miktar", Açıklama: "Zorunlu (kalem için), sayı olmalı.", Örnek: "200" },
        { Alan: "Kural", Açıklama: "Her satır = 1 ürün kalemi. Aynı Sipariş No'lu satırlar tek siparişte birleşir.", Örnek: "-" }
    ];

    const wb = XLSX.utils.book_new();
    const wsData = XLSX.utils.json_to_sheet(rows);
    const wsHelp = XLSX.utils.json_to_sheet(aciklama);
    XLSX.utils.book_append_sheet(wb, wsData, "Siparisler");
    XLSX.utils.book_append_sheet(wb, wsHelp, "Aciklama");
    XLSX.writeFile(wb, `Siparis_Import_Sablonu_${new Date().toISOString().slice(0,10)}.xlsx`);
}

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
    return String(document.getElementById('val-ttarih')?.value || '').trim();
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

/** Excel hücre biçimi — sayı + birim (programdaki MT/KG/ADET ile aynı) */
function siparisFormuExcelBirimNumFmt(birim, mevcutFmt) {
    const b = normalizeSiparisBirim(birim);
    if (b === 'MT') return '#,##0.00" mt"';
    if (b === 'KG') return '#,##0.00" kg"';
    return '#,##0" adet"';
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
    const desen = String(k.desen || '').trim();
    const ad = String(k.ad || '').trim();
    const parcalar = [];
    if (kod) parcalar.push(kod);
    if (desen && desen !== kod && desen !== ad) parcalar.push(desen);
    if (ad && ad !== kod) parcalar.push(ad);
    if (parcalar.length >= 2) return parcalar.join(' — ');
    return parcalar[0] || kod || ad || desen || '';
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

/** Genel Durum / No.N: SİPARİŞ FORMU'ndan tek hücre okuyan formüllere görünür sonuç + birim biçimi yazar */
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
                const srcFmt = String(src.numFmt || src.style?.numFmt || '').trim();
                if (srcFmt) {
                    cell.numFmt = srcFmt;
                    try { cell.style = Object.assign({}, cell.style || {}, { numFmt: srcFmt }); } catch (e) {}
                }
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
        const miktar = parseFloat(k.miktar) || 0;
        const birim = normalizeSiparisBirim(k.birim);
        const addr = XLSX.utils.encode_cell({ r: row - 1, c: 8 });
        if (!miktar) {
            delete ws[addr];
        } else {
            ws[addr] = {
                t: 'n',
                v: birim === 'ADET' ? Math.round(miktar) : miktar,
                z: siparisFormuExcelBirimNumFmt(birim)
            };
        }
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
        desen: k.desen || k.desen_adi || '',
        ad: k.ad || '',
        renk: k.renk || '',
        ebat: k.ebat || '',
        not: k.not || k.notlar || '',
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
    }
    const container = document.getElementById('siparis-kalemleri-container');
    if (container) {
        const kalemler = (veri.kalemler || []).filter(siparisFormuKalemGecerli);
        siparisKalemleriniFormaYukle({ cins: kalemler.length ? kalemler : [] });
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
    const fmt = siparisFormuExcelBirimNumFmt(b);
    cell.numFmt = fmt;
    try { cell.style = Object.assign({}, cell.style || {}, { numFmt: fmt }); } catch (e) {}
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
        siparisFormuEjMiktar(ws, row, 9, k.miktar, k.birim || k.kaynak_birim || 'ADET');
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
    const userLabel = typeof dtCurrentUserLabel === 'function' ? dtCurrentUserLabel() : (erpCurrentUser?.ad || 'Excel');
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
        const eskiMt = parseFloat(u.toplam_metre) || 0;
        const eskiKg = parseFloat(u.toplam_kg) || 0;
        const eskiAd = parseInt(u.toplam_adet, 10) || 0;
        const yeniKg = birim === 'KG' ? adKg : 0;
        const yeniAd = birim !== 'KG' ? Math.round(adKg) : 0;
        u.toplam_metre = metre;
        if (birim === 'KG') {
            u.toplam_kg = adKg;
            u.toplam_adet = 0;
        } else {
            u.toplam_adet = Math.round(adKg);
            u.toplam_kg = 0;
        }
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
                ...dtGirisKullaniciAlanlari(),
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
        dtPushHareket({
            dosya: 'SIPARIS',
            islem: 'Genel Durum Excel — dokuma toplamları',
            siparis: siparis?.sno || String(siparisId),
            detay: `${ok} kalem güncellendi · fark ${deltalar.length} satır${opts.kaynakDosya ? ' · ' + opts.kaynakDosya : ''}`
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
        if (siparis?.id) await syncAllData();
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
    try { localStorage.setItem(DT_EXCEL_UNDO_LS, JSON.stringify(undoPkg)); } catch (e) {}
    if (appMode === 'DOKUMA_TAKIP' && String(dtSeciliSiparisId) === String(siparis.id) && typeof renderDokumaTakip === 'function') {
        renderDokumaTakip();
    }
    if (hatali.length) {
        erpToast(`${snoNorm}: ${sonuc.ok} kalem aktarıldı, ${hatali.length} satır eşleşmedi.`, 'warning', 8000);
    } else {
        erpToast(`${snoNorm}: ${sonuc.ok} kalem dokuma verisi aktarıldı.`, 'success', 7000);
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

async function siparisFormuVeriKaydet(veri) {
    const kalemler = (veri.kalemler || []).filter(k => (k.ad || k.kod) && (parseFloat(k.miktar || 0) > 0));
    const snoNorm = normalizeSiparisNo(veri.sno);
    if (!snoNorm) {
        alert('SİPARİŞ FORMU: Sipariş no (C4) zorunludur.');
        return false;
    }
    if (!kalemler.length) {
        alert('SİPARİŞ FORMU: En az bir ürün satırı (ürün adı + miktar) gerekli.');
        return false;
    }
    kalemler.forEach(k => {
        k.rkod = [k.rkod1, k.rkod2, k.rkod3, k.rkod4, k.rkod5, k.rkod6].filter(Boolean).join(' | ') || k.rkod || '';
    });
    const u = veri.uretim || {};
    const uretimNot = [
        u.tarak_no ? `Tarak: ${u.tarak_no}` : '',
        u.tarak_eni ? `Tarak eni: ${u.tarak_eni}` : '',
        u.cozgu_sikligi ? `Çözgü sıklığı: ${u.cozgu_sikligi}` : '',
        u.cozgu_ipi ? `Çözgü ipi: ${u.cozgu_ipi}` : '',
        u.atki_sikligi ? `Atkı sıklığı: ${u.atki_sikligi}` : '',
        u.atki_ipi ? `Atkı ipi: ${u.atki_ipi}` : ''
    ].filter(Boolean).join(' | ');
    const notlar = [veri.notlar, uretimNot].filter(Boolean).join('\n');
    const fotoDb = siparisFotografDbDeger((veri.fotolar || []).filter(f => String(f.src || '').trim()));
    const record = {
        sno: snoNorm,
        firma: veri.firma || 'BELIRSIZ MUSTERI',
        starih: veri.starih || new Date().toISOString().slice(0, 10),
        ttarih: veri.ttarih || null,
        durum: 'BEKLEMEDE',
        uretim_yeri: 'SIMTEKS_KONF',
        cins: JSON.stringify(kalemler),
        miktar: kalemler.reduce((a, k) => a + (parseFloat(k.miktar || 0) || 0), 0),
        updated_by: 'Excel Import (Sipariş Formu)',
        kaynak_birim: 'SIPARIS_FORMU_EXCEL',
        islem_gecmisi: `✨ ${new Date().toLocaleString('tr-TR')} — [SİPARİŞ FORMU Excel]: Aktarım`
    };
    if (notlar) record.notlar = notlar;
    if (fotoDb) record[SIPARIS_FOTO_DB_COL] = fotoDb;

    const existingMap = {};
    (dataCache.siparisler || []).forEach(s => {
        const key = normalizeSiparisNo(s.sno);
        if (key) existingMap[key] = s;
    });
    const mevcut = existingMap[snoNorm];
    if (mevcut?.id) {
        const { error } = await sb.from('siparisler').update(record).eq('id', mevcut.id);
        if (error) throw error;
        await syncAllData();
        if (appMode === 'SIPARIS_LISTE') loadData();
        alert(`✅ SİPARİŞ FORMU güncellendi: ${snoNorm}`);
    } else {
        const { data: existingDbRows, error: existingDbErr } = await sb.from('siparisler').select('id,sno').eq('sno', snoNorm).limit(1);
        if (existingDbErr) throw existingDbErr;
        const hit = (existingDbRows || []).find(s => normalizeSiparisNo(s?.sno) === snoNorm);
        if (hit?.id) {
            const { error } = await sb.from('siparisler').update(record).eq('id', hit.id);
            if (error) throw error;
        } else {
            const { error } = await sb.from('siparisler').insert([record]);
            if (error) throw error;
        }
        await syncAllData();
        if (appMode === 'SIPARIS_LISTE') loadData();
        alert(`✅ SİPARİŞ FORMU kaydedildi: ${snoNorm}`);
    }
    return true;
}

async function siparisFormuVeriIsle(veri, opts = {}) {
    if (!veri) return false;
    const kalemler = (veri.kalemler || []).filter(siparisFormuKalemGecerli);
    if (!String(veri.sno || '').trim() && !kalemler.length) {
        alert('SİPARİŞ FORMU sekmesinde sipariş no veya ürün kalemi bulunamadı.');
        return false;
    }
    if (opts.sadeceDokuma && veri.genelDurumDokuma?.length) {
        return siparisGenelDurumDokumaUygula(veri, opts);
    }
    if (appMode === 'SIPARIS_GIRIS') {
        applySiparisFormuVeriToForm(veri);
        if (veri.genelDurumDokuma?.length) {
            erpToast('Form dolduruldu. Dokuma verisi için siparişi kaydettikten sonra Excel\'i tekrar yükleyin veya Dokuma Takip\'ten aktarın.', 'info', 7000);
        } else {
            alert(`✅ SİPARİŞ FORMU verileri forma aktarıldı (${opts.kaynakDosya || 'Excel'}). Kontrol edip kaydedin.`);
        }
        return true;
    }
    const kayitOk = await siparisFormuVeriKaydet(veri);
    if (kayitOk && veri.genelDurumDokuma?.length) {
        await siparisGenelDurumDokumaUygula(veri, { ...opts, atlaOnay: true });
    }
    return kayitOk;
}

function iplikAaaaExcelFormatMi(wb) {
    for (const sn of wb.SheetNames || []) {
        if (/^sayfa\d*$/i.test(String(sn || '').trim())) continue;
        const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: '' });
        for (let i = 0; i < Math.min(12, aoa.length); i++) {
            const tarihCount = (aoa[i] || []).map(c => siparisExcelNormHeader(c)).filter(h => h === 'tarih').length;
            if (tarihCount >= 2) return true;
        }
    }
    return false;
}
function iplikAaaaColAt(hdr, fromCol, labels, endCol) {
    const vars = (Array.isArray(labels) ? labels : [labels]).map(l => siparisExcelNormHeader(l));
    const limit = endCol != null ? Math.min(endCol, hdr.length) : Math.min(fromCol + 22, hdr.length);
    for (let i = fromCol; i < limit; i++) {
        const h = siparisExcelNormHeader(hdr[i]);
        if (!h) continue;
        if (vars.some(v => h === v || (v.length > 4 && h.includes(v)))) return i;
    }
    return -1;
}
function iplikAaaaRowCell(row, col) {
    if (col < 0) return '';
    const v = row[col];
    return v === null || v === undefined ? '' : v;
}
function iplikAaaaKimlikNorm(v) {
    return String(v || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim();
}
function iplikAaaaKimlikKey(sayfaAdi) {
    return iplikAaaaKimlikNorm(sayfaAdi);
}
function iplikMaxSiraIpKodu() {
    let max = 0;
    const scan = (kod) => {
        const m = String(kod || '').trim().match(/^IP-(\d+)$/i);
        if (m) max = Math.max(max, parseInt(m[1], 10) || 0);
    };
    (dataCache.iplik_stok || []).forEach(r => scan(r.stok_kodu));
    return max;
}
async function iplikAaaaStokKodlariAta(rows) {
    let seq = iplikMaxSiraIpKodu();
    try {
        const next = await getNextIplikStokCode();
        const n = parseInt(String(next).split('-')[1], 10);
        if (Number.isFinite(n)) seq = Math.max(seq, n - 1);
    } catch (e) { /* önbellek yeterli */ }
    const kodMap = new Map();
    const sayfaSirasi = [];
    rows.forEach(r => {
        const s = String(r._sayfa || '').trim();
        if (s && !sayfaSirasi.includes(s)) sayfaSirasi.push(s);
    });
    sayfaSirasi.forEach(sayfa => {
        seq += 1;
        kodMap.set(iplikAaaaKimlikKey(sayfa), `IP-${String(seq).padStart(4, '0')}`);
    });
    return rows.map(row => {
        const key = iplikAaaaKimlikKey(row._sayfa || '');
        const { _sayfa, _tarihSort, ...rest } = row;
        return { ...rest, stok_kodu: kodMap.get(key), _tarihSort };
    });
}
function iplikAaaaParseBlockRow(row, hdr, startCol, endCol, islemTuru, sheetName) {
    const g = (labels) => iplikAaaaColAt(hdr, startCol, labels, endCol);
    const val = (labels) => String(iplikAaaaRowCell(row, g(labels)) ?? '').trim();
    const iplikNo = val(['İplik Numarası', 'İplik No']);
    const kgRaw = stokToNumber(iplikAaaaRowCell(row, g(['KG', 'Miktar'])));
    if (!iplikNo || kgRaw <= 0.0009) return null;
    const junk = ['MARKA', 'TOPLAM', 'IPLIK', 'GENEL', 'STOK'];
    if (junk.includes(iplikNo.toLocaleUpperCase('tr-TR'))) return null;
    const lot = val(['Lot', 'Lot No']);
    const marka = val(['Marka']);
    const cins = val(['Cins', 'Cinsi']);
    const kalite = val(['Kalite', 'Kalite ']);
    const cuval = parseInt(iplikAaaaRowCell(row, g(['Çuval Sayısı', 'Cuval Sayisi'])), 10) || 0;
    const cuvalDesen = val(['Çuval Deseni', 'Cuval Deseni']);
    const stokYeri = val(['Stok Yeri', 'Depo']);
    const uretici = val(['Üretici Firma', 'Uretici Firma']);
    const araci = val(['Aracı Firma', 'Araci Firma']);
    const sevkYeri = val(['Sevk Yeri']);
    const satinAlan = val(['Satın Alınan Firma', 'Satin Alinan Firma']);
    const aciklama = val(['Açıklama', 'Aciklama']);
    const fiyat = stokToNumber(iplikAaaaRowCell(row, g(['Fiyat'])));
    const vade = val(['Vade']);
    const tarih = siparisExcelToDate(iplikAaaaRowCell(row, g(['Tarih']))) || '';
    const miktar_kg = islemTuru === 'ÇIKIŞ' ? -Math.abs(kgRaw) : Math.abs(kgRaw);
    const noteParts = [`[SAYFA:${sheetName}]`];
    if (tarih) noteParts.push(`[TARIH:${tarih}]`);
    if (vade) noteParts.push(`Vade: ${vade}`);
    if (aciklama) noteParts.push(aciklama);
    return {
        _sayfa: sheetName,
        iplik_no: iplikNoLotEslestirNorm(iplikNo) || iplikNo.toUpperCase(),
        lot_no: lot,
        marka: marka.toUpperCase(),
        cins: cins.toUpperCase(),
        kalite: (kalite || '1. KALİTE').toUpperCase(),
        miktar_kg,
        cuval_sayisi: cuval,
        cuval_rengi: cuvalDesen.toUpperCase(),
        depo_konum: stokYeri.toUpperCase(),
        tedarikci: (islemTuru === 'GİRİŞ' ? uretici : satinAlan).toUpperCase(),
        araci_firma: araci.toUpperCase(),
        firma: (islemTuru === 'ÇIKIŞ' ? sevkYeri : uretici).toUpperCase(),
        fiyat: fiyat || null,
        notlar: noteParts.join(' | '),
        islem_turu: islemTuru,
        _tarihSort: tarih || '9999-12-31',
    };
}
function parseIplikAaaaExcelWorkbook(wb) {
    const out = [];
    const skipSheets = new Set(['GENEL STOK', 'SAYFA2']);
    (wb.SheetNames || []).forEach(sn => {
        const snUp = String(sn || '').trim();
        if (/^sayfa\d*$/i.test(snUp)) return;
        if (skipSheets.has(snUp.toLocaleUpperCase('tr-TR'))) return;
        const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: '' });
        let headerIdx = -1;
        for (let i = 0; i < Math.min(12, aoa.length); i++) {
            const tarihCount = (aoa[i] || []).map(c => siparisExcelNormHeader(c)).filter(h => h === 'tarih').length;
            if (tarihCount >= 2) { headerIdx = i; break; }
        }
        if (headerIdx < 0) return;
        const hdr = aoa[headerIdx] || [];
        const allTarih = [];
        hdr.forEach((c, i) => { if (siparisExcelNormHeader(c) === 'tarih') allTarih.push(i); });
        if (allTarih.length < 2) return;
        const blockEnd = (bi) => allTarih[bi + 1] != null ? allTarih[bi + 1] : hdr.length;
        for (let r = headerIdx + 1; r < aoa.length; r++) {
            const row = aoa[r] || [];
            const gRow = iplikAaaaParseBlockRow(row, hdr, allTarih[0], blockEnd(0), 'GİRİŞ', snUp);
            if (gRow) out.push(gRow);
            const cRow = iplikAaaaParseBlockRow(row, hdr, allTarih[1], blockEnd(1), 'ÇIKIŞ', snUp);
            if (cRow) out.push(cRow);
        }
    });
    out.sort((a, b) => {
        const o = { 'GİRİŞ': 0, 'ÇIKIŞ': 1 };
        const d = (o[a.islem_turu] ?? 0) - (o[b.islem_turu] ?? 0);
        if (d) return d;
        return String(a._tarihSort).localeCompare(String(b._tarihSort));
    });
    return out;
}

async function importStokExcel(input) {
    const file = input?.files?.[0];
    if (!file) return;
    if (typeof XLSX === 'undefined') { alert("Excel kütüphanesi yüklenemedi."); return; }
    try {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        if (!wb.SheetNames.length) { alert("Excel içinde sayfa bulunamadı."); return; }

        const ig = depoStokExcelGrubu();
        if (!ig) {
            alert('Excel yüklemek için İplik / Kumaş / Mamül stoğu ekranında olun veya Depo stok hareketlerinde önce stok grubunu seçin.');
            input.value = '';
            return;
        }

        let table = '';
        const payload = [];
        let autoCodeCount = 0;
        let skipQtyCount = 0;
        let skipBakiyeCount = 0;
        let bestRows = [];
        let bestSheet = '';
        const importBakiyeSim = {};
        let iplikDefterSayfa = 0;
        let iplikDefterKodSayisi = 0;
        const importBakiyeOnay = (stokKodu, islemTuru, miktar_kg, miktar_mt, cuval_sayisi) => {
            const key = String(stokKodu || '').trim();
            if (!key) return islemTuru !== 'ÇIKIŞ';
            if (!importBakiyeSim[key]) {
                importBakiyeSim[key] = depoStokNetBakiyeHesapla(table, key, ig, null);
            }
            const sim = importBakiyeSim[key];
            const istKg = Math.abs(parseFloat(miktar_kg) || 0);
            const istMt = Math.abs(parseFloat(miktar_mt) || 0);
            const istAd = Math.abs(parseInt(cuval_sayisi || 0, 10) || 0);
            if (islemTuru === 'GİRİŞ') {
                sim.kg += istKg;
                sim.mt += istMt;
                sim.adet += istAd;
                return true;
            }
            if (istKg > 0 && sim.kg + 1e-6 < istKg) return false;
            if (istMt > 0 && sim.mt + 1e-6 < istMt) return false;
            if (istAd > 0 && sim.adet + 1e-6 < istAd) return false;
            sim.kg -= istKg;
            sim.mt -= istMt;
            sim.adet -= istAd;
            return true;
        };

        if (ig === 'IPLIK' && iplikAaaaExcelFormatMi(wb)) {
            table = 'iplik_stok';
            const parsedRaw = parseIplikAaaaExcelWorkbook(wb);
            const parsed = await iplikAaaaStokKodlariAta(parsedRaw);
            iplikDefterKodSayisi = new Set(parsed.map(r => r.stok_kodu)).size;
            iplikDefterSayfa = (wb.SheetNames || []).filter(sn => {
                const u = String(sn || '').trim();
                return u && !/^sayfa\d*$/i.test(u) && u.toLocaleUpperCase('tr-TR') !== 'GENEL STOK';
            }).length;
            bestSheet = `${iplikDefterSayfa} sayfa (İplik defteri)`;
            parsed.forEach(row => {
                const tarihEtiket = row._tarihSort && row._tarihSort !== '9999-12-31' ? row._tarihSort : '';
                const { _tarihSort, ...rest } = row;
                payload.push({
                    ...rest,
                    ...(tarihEtiket ? { created_at: tarihEtiket + 'T12:00:00.000Z' } : {}),
                    updated_by: 'Excel Import (İplik Defteri)',
                    kaynak_birim: depoKaynakBirimImportBelirle('IPLIK', rest.stok_kodu),
                    islem_gecmisi: `✨ ${new Date().toLocaleString('tr-TR')} — [Excel İplik Defteri]${tarihEtiket ? ' ' + tarihEtiket : ''}: ${rest.islem_turu}`
                });
            });
        } else {
        wb.SheetNames.forEach(sn => {
            const rr = excelRowsWithAutoHeader(wb.Sheets[sn]);
            if (rr.length > bestRows.length) {
                bestRows = rr;
                bestSheet = sn;
            }
        });
        const rows = bestRows;
        if (!rows.length) { alert("Excel boş görünüyor."); return; }
        const autoCodeCache = {};
        const normCodePart = (v) => String(v || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, '')
            .slice(0, 8);
        const getStokKodu = (r, prefix, idx) => {
            const manual = String(siparisExcelPick(r, ['stok kodu','stok kod','stok']) || '').trim();
            if (manual) return manual;
            const p1 = siparisExcelPick(r, ['urun grubu','ürün grubu','grup','iplik no','urun adi','ürün adı','urun kumas cinsi','kumas cinsi']);
            const p2 = siparisExcelPick(r, ['ebat','renk','lot no','lot']);
            const key = `${prefix}|${String(p1 || '').trim()}|${String(p2 || '').trim()}`;
            if (autoCodeCache[key]) return autoCodeCache[key];
            autoCodeCount++;
            const c1 = normCodePart(p1) || 'GEN';
            const c2 = normCodePart(p2);
            const seq = String(idx + 1).padStart(4, '0');
            const code = `${prefix}-${c1}${c2 ? '-' + c2 : ''}-${seq}`;
            autoCodeCache[key] = code;
            return code;
        };
        if (ig === 'IPLIK') {
            table = 'iplik_stok';
            rows.forEach((r, idx) => {
                const stok_kodu = getStokKodu(r, 'IP', idx);
                const kgRaw = stokToNumber(siparisExcelPick(r, ['kg','miktar kg','miktar']));
                if (!kgRaw) { skipQtyCount++; return; }
                const islem_turu = stokNormIslem(siparisExcelPick(r, ['islem turu','islem','giris cikis']));
                const miktar_kg = islem_turu === 'ÇIKIŞ' ? -Math.abs(kgRaw) : Math.abs(kgRaw);
                const cuval_sayisi = parseInt(siparisExcelPick(r, ['top sayisi','top sayısı','cuval sayisi','çuval sayısı']) || 0) || 0;
                if (!importBakiyeOnay(stok_kodu, islem_turu, miktar_kg, 0, cuval_sayisi)) { skipBakiyeCount++; return; }
                payload.push({
                    stok_kodu,
                    iplik_no: String(siparisExcelPick(r, ['iplik no','no']) || '').trim(),
                    lot_no: String(siparisExcelPick(r, ['lot no','lot']) || '').trim(),
                    marka: String(siparisExcelPick(r, ['marka']) || '').trim(),
                    cins: String(siparisExcelPick(r, ['cins','fiber']) || '').trim(),
                    kalite: String(siparisExcelPick(r, ['kalite']) || '1. KALİTE').trim(),
                    miktar_kg,
                    irsaliye_no: String(siparisExcelPick(r, ['irsaliye no','irsaliye']) || '').trim(),
                    cuval_sayisi,
                    cuval_rengi: String(siparisExcelPick(r, ['cuval rengi','çuval rengi']) || '').trim().toUpperCase(),
                    araci_firma: String(siparisExcelPick(r, ['araci firma','aracı firma']) || '').trim().toUpperCase(),
                    firma: String(siparisExcelPick(r, ['firma','musteri']) || '').trim().toUpperCase(),
                    notlar: String(siparisExcelPick(r, ['not','notlar']) || '').trim(),
                    islem_turu,
                    updated_by: 'Excel Import',
                    kaynak_birim: depoKaynakBirimImportBelirle('IPLIK', stok_kodu),
                    islem_gecmisi: `✨ ${new Date().toLocaleString('tr-TR')} — [Excel Import]: Toplu stok aktarımı`
                });
            });
        } else if (ig === 'KUMAS') {
            table = 'kumas_stok';
            rows.forEach((r, idx) => {
                const stok_kodu = getStokKodu(r, 'KM', idx);
                const kgRaw = stokToNumber(siparisExcelPick(r, ['kg','miktar kg','miktar']));
                const mtRaw = stokToNumber(siparisExcelPick(r, ['mt','metre','miktar mt']));
                if (!kgRaw && !mtRaw) { skipQtyCount++; return; }
                const islem_turu = stokNormIslem(siparisExcelPick(r, ['islem turu','islem','giris cikis']));
                const uretim_yeri = String(siparisExcelPick(r, ['uretim yeri','üretim yeri']) || '').trim();
                const urun_grubu = String(siparisExcelPick(r, ['urun grubu','ürün grubu','grup']) || '').trim();
                const urun_adi = String(siparisExcelPick(r, ['urun adi','ürün adı']) || '').trim();
                const ebat = String(siparisExcelPick(r, ['ebat','olcu','ölçü']) || '').trim();
                const depo = String(siparisExcelPick(r, ['depo','depo yeri','depo konum']) || '').trim();
                const aciklama = String(siparisExcelPick(r, ['aciklama','açıklama']) || '').trim();
                const userNot = String(siparisExcelPick(r, ['not','notlar']) || '').trim();
                const miktar_kg = islem_turu === 'ÇIKIŞ' ? -Math.abs(kgRaw || 0) : Math.abs(kgRaw || 0);
                const miktar_mt = islem_turu === 'ÇIKIŞ' ? -Math.abs(mtRaw) : Math.abs(mtRaw);
                const cuval_sayisi = parseInt(siparisExcelPick(r, ['top sayisi','top sayısı','cuval sayisi','çuval sayısı']) || 0) || 0;
                if (!importBakiyeOnay(stok_kodu, islem_turu, miktar_kg, miktar_mt, cuval_sayisi)) { skipBakiyeCount++; return; }
                payload.push({
                    stok_kodu,
                    uretim_yeri,
                    urun_grubu,
                    urun_adi,
                    ebat,
                    kumas_cinsi: String(siparisExcelPick(r, ['kumas cinsi','urun kumas cinsi','urun kumas']) || '').trim(),
                    lot_no: String(siparisExcelPick(r, ['lot no','lot']) || '').trim(),
                    marka: String(siparisExcelPick(r, ['marka']) || '').trim(),
                    renk: String(siparisExcelPick(r, ['renk']) || '').trim(),
                    miktar_kg,
                    miktar_mt,
                    irsaliye_no: String(siparisExcelPick(r, ['irsaliye no','irsaliye']) || '').trim(),
                    cuval_sayisi,
                    cuval_rengi: String(siparisExcelPick(r, ['cuval rengi','çuval rengi']) || '').trim().toUpperCase(),
                    depo,
                    araci_firma: String(siparisExcelPick(r, ['araci firma','aracı firma']) || '').trim().toUpperCase(),
                    firma: String(siparisExcelPick(r, ['firma','musteri']) || '').trim().toUpperCase(),
                    notlar: kumasNotlarOlustur(
                        userNot || aciklama,
                        { uretim_yeri, urun_grubu, urun_adi, ebat, depo, aciklama }
                    ),
                    islem_turu,
                    updated_by: 'Excel Import',
                    kaynak_birim: depoKaynakBirimImportBelirle(ig, stok_kodu),
                    islem_gecmisi: `✨ ${new Date().toLocaleString('tr-TR')} — [Excel Import]: Toplu stok aktarımı`
                });
            });
        } else if (ig === 'MAMUL_DEPO') {
            table = 'kumas_stok';
            rows.forEach((r, idx) => {
                const stok_kodu = getStokKodu(r, 'MM', idx);
                const kgRaw = stokToNumber(siparisExcelPick(r, ['kg','miktar kg','miktar']));
                if (!kgRaw) { skipQtyCount++; return; }
                const islem_turu = stokNormIslem(siparisExcelPick(r, ['islem turu','islem','giris cikis']));
                const miktar_kg = islem_turu === 'ÇIKIŞ' ? -Math.abs(kgRaw) : Math.abs(kgRaw);
                const cuval_sayisi = parseInt(siparisExcelPick(r, ['cuval sayisi','çuval sayısı']) || 0) || 0;
                if (!importBakiyeOnay(stok_kodu, islem_turu, miktar_kg, 0, cuval_sayisi)) { skipBakiyeCount++; return; }
                payload.push({
                    stok_kodu,
                    kumas_cinsi: String(siparisExcelPick(r, ['urun kumas cinsi','kumas cinsi','urun cinsi']) || '').trim(),
                    lot_no: String(siparisExcelPick(r, ['lot no','lot']) || '').trim(),
                    marka: String(siparisExcelPick(r, ['marka']) || '').trim(),
                    renk: String(siparisExcelPick(r, ['renk']) || '').trim(),
                    miktar_kg,
                    irsaliye_no: String(siparisExcelPick(r, ['irsaliye no','irsaliye']) || '').trim(),
                    cuval_sayisi,
                    cuval_rengi: String(siparisExcelPick(r, ['cuval rengi','çuval rengi']) || '').trim().toUpperCase(),
                    araci_firma: String(siparisExcelPick(r, ['araci firma','aracı firma']) || '').trim().toUpperCase(),
                    firma: String(siparisExcelPick(r, ['firma','musteri']) || '').trim().toUpperCase(),
                    notlar: String(siparisExcelPick(r, ['not','notlar']) || '').trim(),
                    islem_turu,
                    updated_by: 'Excel Import',
                    kaynak_birim: depoKaynakBirimImportBelirle('MAMUL_DEPO', stok_kodu),
                    islem_gecmisi: `✨ ${new Date().toLocaleString('tr-TR')} — [Excel Import]: Toplu stok aktarımı`
                });
            });
        } else {
            alert('Bu modda stok excel import aktif değil.');
            input.value = '';
            return;
        }
        }

        if (!payload.length) {
            const rowInfo = iplikDefterSayfa
                ? `(Taranan: ${bestSheet || '-'})`
                : `(Taranan sayfa: ${bestSheet || '-'}, Toplam satır: ${(bestRows || []).length}, Miktar boş/0 atlanan: ${skipQtyCount})`;
            alert(`Geçerli stok hareketi bulunamadı. Kontrol edin:\n• Başlık satırı\n• KG/MT değerleri\n${rowInfo}`);
            input.value = '';
            return;
        }

        let insertPayload = payload.map(x => ({ ...x }));
        const droppedCols = [];
        const triedCols = new Set();
        while (true) {
            const { error } = await sb.from(table).insert(insertPayload);
            if (!error) break;
            const msg = String(error?.message || error || '');
            const m = msg.match(/Could not find the '([^']+)' column/i);
            const missingCol = m?.[1];
            if (!missingCol || triedCols.has(missingCol)) throw error;
            triedCols.add(missingCol);
            droppedCols.push(missingCol);
            insertPayload = insertPayload.map(row => {
                const r = { ...row };
                delete r[missingCol];
                return r;
            });
            const hasAnyCol = insertPayload[0] && Object.keys(insertPayload[0]).length > 0;
            if (!hasAnyCol) throw error;
        }
        erpSyncTablesBackground([table || 'kumas_stok', 'iplik_stok'].filter((v, i, a) => a.indexOf(v) === i));
        loadData();
        alert(`✅ Stok Excel aktarımı tamamlandı. ${payload.length} hareket eklendi.${iplikDefterSayfa ? `\n📑 ${iplikDefterSayfa} sayfa iplik defteri okundu.` : ''}${iplikDefterKodSayisi ? `\n🏷️ ${iplikDefterKodSayisi} adet IP-0001 formatında stok kodu atandı.` : ''}${iplikDefterSayfa ? '\nℹ️ İplik defteri: tüm giriş/çıkışlar bakiye kontrolü olmadan kaydedildi; stokları listeden düzenleyebilirsiniz.' : ''}${autoCodeCount ? `\n⚠️ ${autoCodeCount} satırda Stok Kodu boştu; otomatik kod üretildi.` : ''}${!iplikDefterSayfa && skipBakiyeCount ? `\n⚠️ ${skipBakiyeCount} çıkış satırı yetersiz bakiye nedeniyle atlandı.` : ''}${droppedCols.length ? `\nℹ️ Şemada olmayan kolonlar otomatik atlandı: ${droppedCols.join(', ')}` : ''}`);
    } catch (err) {
        alert("Stok Excel aktarımı başarısız: " + (err?.message || err));
    } finally {
        input.value = '';
    }
}

function erpFotoOnizleGuncelle(src) {
    if (src !== undefined) currentImageBase64 = src || null;
    const root = document.getElementById('form-container') || document.getElementById('inputs-grid') || document;
    const img = root.querySelector('#img-preview') || document.getElementById('img-preview');
    const ph = root.querySelector('#foto-placeholder') || document.getElementById('foto-placeholder');
    const has = !!(currentImageBase64 && String(currentImageBase64).trim());
    if (img) {
        if (has) {
            img.src = currentImageBase64;
            img.style.display = 'block';
            img.style.visibility = 'visible';
        } else {
            img.removeAttribute('src');
            img.style.display = 'none';
        }
    }
    if (ph) ph.style.display = has ? 'none' : 'flex';
}

function siparisFotoLightboxEnsure() {
    if (document.getElementById('siparis-foto-lightbox')) return;
    const lb = document.createElement('div');
    lb.id = 'siparis-foto-lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.onclick = (ev) => { if (ev.target === lb) siparisFotoLightboxKapat(); };
    lb.innerHTML = '<div class="siparis-foto-lightbox-inner" onclick="event.stopPropagation()">' +
        '<button type="button" class="siparis-foto-lightbox-kapat" onclick="siparisFotoLightboxKapat()" aria-label="Kapat">&times;</button>' +
        '<img id="siparis-foto-lightbox-img" src="" alt="">' +
        '<div id="siparis-foto-lightbox-cap"></div></div>';
    document.body.appendChild(lb);
    if (!window.__siparisFotoLbEsc) {
        window.__siparisFotoLbEsc = true;
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') siparisFotoLightboxKapat(); });
    }
}

function siparisFotoLightboxAc(src, caption) {
    if (!src) return;
    siparisFotoLightboxEnsure();
    const lb = document.getElementById('siparis-foto-lightbox');
    const img = document.getElementById('siparis-foto-lightbox-img');
    const cap = document.getElementById('siparis-foto-lightbox-cap');
    if (!lb || !img) return;
    img.src = src;
    if (cap) {
        const t = String(caption || '').trim();
        cap.textContent = t;
        cap.style.display = t ? 'block' : 'none';
    }
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

function siparisFotoLightboxKapat() {
    const lb = document.getElementById('siparis-foto-lightbox');
    if (!lb) return;
    lb.classList.remove('is-open');
    const img = document.getElementById('siparis-foto-lightbox-img');
    if (img) img.removeAttribute('src');
    document.body.style.overflow = '';
}

function siparisFotoLightboxAcIdx(idx) {
    const f = (_siparisFotoLbItems || [])[idx];
    if (f?.src) siparisFotoLightboxAc(f.src, f.aciklama);
}

function siparisFotoDosyaSikistirOld(file)  {
    return new Promise((resolve) => {
        if (!file || !String(file.type || '').startsWith('image/')) { resolve(''); return; }
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                let w = img.naturalWidth || img.width;
                let h = img.naturalHeight || img.height;
                const max = SIPARIS_FOTO_MAX_PX;
                if (w > max || h > max) {
                    if (w >= h) { h = Math.round(h * max / w); w = max; }
                    else { w = Math.round(w * max / h); h = max; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, w);
                canvas.height = Math.max(1, h);
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(String(reader.result || '')); return; }
                ctx.drawImage(img, 0, 0, w, h);
                try { resolve(canvas.toDataURL('image/jpeg', SIPARIS_FOTO_JPEG_Q)); }
                catch (e) { resolve(String(reader.result || '')); }
            };
            img.onerror = () => resolve('');
            img.src = String(reader.result || '');
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
    });
}

/** Detay modal — fotoğraflar isteğe bağlı (mobilde kararlı; otomatik açılmaz) */
function siparisFotoPanelShellHtml(i, cachedCount) {
    const sid = String(i?.id ?? '');
    if (!sid) return '';
    const n = cachedCount || 0;
    const alt = n > 0 ? ` (${n} önbellekte)` : '';
    return `
    <div class="siparis-kalem-panel siparis-foto-panel">
        <div class="siparis-kalem-head">
            <span class="siparis-kalem-head-title">Sipariş fotoğrafları</span>
        </div>
        <button type="button" id="siparis-foto-btn-${sid}" class="btn-pro btn-ghost-pro siparis-foto-yukle-btn"
            onclick="siparisFotoPanelYukle('${sid}')">📷 Fotoğrafları göster${alt}</button>
        <div id="siparis-foto-icerik-${sid}" class="siparis-foto-icerik" hidden></div>
    </div>`;
}

async function siparisFotoPanelYukle(siparisId) {
    const sid = String(siparisId ?? '');
    const host = document.getElementById('siparis-foto-icerik-' + sid);
    const btn = document.getElementById('siparis-foto-btn-' + sid);
    if (!host) return;
    host.hidden = false;
    host.innerHTML = '<div class="siparis-foto-durum">Fotoğraflar yükleniyor…</div>';
    if (btn) { btn.disabled = true; btn.textContent = 'Yükleniyor…'; }
    try {
        let kayit = (dataCache.siparisler || []).find(s => String(s.id) === sid);
        let fotos = kayit ? siparisFotografListesiAl(kayit) : [];
        if (!fotos.length) {
            kayit = await siparisKayitFotolarLazyYukle(siparisId);
            fotos = kayit ? siparisFotografListesiAl(kayit) : [];
        }
        if (!fotos.length) {
            host.innerHTML = '<div class="siparis-foto-durum">Bu siparişte kayıtlı fotoğraf yok.</div>';
            if (btn) { btn.textContent = '📷 Fotoğraf yok'; btn.disabled = false; }
            return;
        }
        host.innerHTML = siparisFotografHtmlGrid(fotos, { minW: 120, imgH: 130 });
        if (btn) { btn.textContent = '📷 ' + fotos.length + ' fotoğraf'; btn.disabled = false; }
    } catch (e) {
        host.innerHTML = '<div class="siparis-foto-durum siparis-foto-durum--err">Fotoğraflar yüklenemedi.</div>';
        if (btn) { btn.textContent = '📷 Tekrar dene'; btn.disabled = false; }
    }
}

/** Form belleği + kayıt fotograf alanından sipariş foto listesi */
/** Supabase jsonb kolonuna yazılacak dizi */
/** DB boş kalan siparişlerde cihazdaki foto yedegini önbelleğe yansıt */
/** Sipariş detayı açılırken fotoğraf / geçmiş lazy yükle */
function siparisFotoUploadFiles(files) {
    if (!files.length) return;
    const total = files.length;
    let done = 0;
    let okCount = 0;
    const busyId = 'siparis-foto-busy-' + Date.now();
    const host = document.getElementById('siparis-foto-list');
    if (host) {
        host.insertAdjacentHTML('beforeend', '<div id="' + busyId + '" style="padding:8px;font-size:10px;color:var(--accent2);text-align:center">Fotoğraf hazırlanıyor 0/' + total + '...</div>');
    }
    const tasks = files.map(file => siparisFotoDosyaSikistir(file).then(async (src) => {
        done++;
        const busy = document.getElementById(busyId);
        if (busy) busy.textContent = 'Fotoğraf hazırlanıyor ' + done + '/' + total + '...';
        if (!src) return '';
        const idx = siparisFotograflar.push({ src, aciklama: '' }) - 1;
        okCount++;
        const hint = editingId ? `siparis/${editingId}` : `pending/${(document.getElementById('val-sno')?.value || 'yeni').replace(/[^\w-]/g, '')}`;
        siparisFotoStorageYukle(src, hint).then(url => {
            if (url && siparisFotograflar[idx] && siparisFotograflar[idx].src === src) {
                siparisFotograflar[idx].src = url;
                try { siparisFotoRenderList(); updateSiparisPreview(); } catch (e) {}
            }
        }).catch(() => {});
        return src;
    }));
    siparisFotoOkumaPromise = siparisFotoOkumaPromise.then(() => Promise.all(tasks)).finally(() => {
        document.getElementById(busyId)?.remove();
        if (okCount) {
            siparisFotoRenderList();
            updateSiparisPreview();
            if (okCount > 1) erpToast(okCount + ' fotoğraf eklendi. Her birine ayrı açıklama yazabilirsiniz.', 'success', 4000);
        }
        if (okCount < total) erpToast((total - okCount) + ' fotoğraf işlenemedi.', 'warn', 4500);
    });
}

/** Ebat/ölçü metinleri (50x70, 50*70, 40×60) sayı sanılmasın */
function erpLooksLikeEbatOlcu(raw) {
    const s = String(raw || '').trim();
    if (!s) return false;
    // 50x70 / 50 x 70 / 50*70 / 50×70
    if (/\d+(?:[.,]\d+)?\s*[xX*×]\s*\d+(?:[.,]\d+)?/.test(s)) return true;
    // 50-70 / 100–120 (iki ölçü)
    if (/^\d{2,4}\s*[-–]\s*\d{2,4}$/.test(s)) return true;
    return false;
}
try { window.erpLooksLikeEbatOlcu = erpLooksLikeEbatOlcu; } catch (e) {}

/** TR/EN ondalık: 12,5 / 12.5 / 1.234,56 / 1,234.56 ve Excel toplama (a+b) */
function erpParseDecimal(raw) {
    const s = String(raw ?? '').trim();
    if (!s) return null;
    if (typeof erpInputHasTextChars === 'function' && erpInputHasTextChars(s)) return null;
    if (/\d+\s*\/\s*\d+/.test(s)) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    // Ayrı fonksiyon yoksa bile ebatı sayı sanma
    if ((typeof erpLooksLikeEbatOlcu === 'function' && erpLooksLikeEbatOlcu(s))
        || /\d+(?:[.,]\d+)?\s*[xX*×]\s*\d+(?:[.,]\d+)?/.test(s)) return null;
    if (/^SP\d+$/i.test(s.replace(/\s/g, ''))) return null;
    if (s.includes('+')) {
        if (typeof erpParseExcelNumberExpr === 'function') return erpParseExcelNumberExpr(s);
        return null;
    }
    let t = s.replace(/\s/g, '');
    const lastComma = t.lastIndexOf(',');
    const lastDot = t.lastIndexOf('.');
    if (lastComma >= 0 && lastDot >= 0) {
        if (lastComma > lastDot) t = t.replace(/\./g, '').replace(',', '.');
        else t = t.replace(/,/g, '');
    } else if (lastComma >= 0) {
        const parts = t.split(',');
        t = parts.length > 2
            ? parts.slice(0, -1).join('') + '.' + parts[parts.length - 1]
            : t.replace(',', '.');
    } else if ((t.match(/\./g) || []).length > 1) {
        const parts = t.split('.');
        const last = parts[parts.length - 1];
        t = (last.length <= 3 ? parts.slice(0, -1).join('') + '.' + last : parts.join(''));
    }
    const v = parseFloat(t);
    return Number.isFinite(v) ? v : null;
}

function erpValDecimal(id, def) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    const v = erpParseDecimal(el?.value);
    if (v != null) return v;
    return def !== undefined ? def : null;
}

function erpInputHasTextChars(raw) {
    return /[a-zA-ZÇĞİÖŞÜçğıöşüıİ*×]/.test(String(raw || ''));
}

function erpNormalizeAllDecimalInputsInForm() {
    const roots = [
        document.getElementById('form-container'),
        document.getElementById('notes-container'),
        document.getElementById('siparis-kalemleri-container')
    ].filter(Boolean);
    roots.forEach(root => {
        root.querySelectorAll('input').forEach(el => {
            if (erpSkipExcelNormalizeInput(el)) return;
            const raw = String(el.value || '').trim();
            if (!raw) return;
            if (erpInputHasTextChars(raw)) return;
            const v = erpParseDecimal(raw);
            if (v == null) return;
            const norm = String(v);
            if (raw !== norm) el.value = norm;
        });
    });
}

function numuneKodAlaniniNormalizeEt(v) {
    return String(v || '')
        .replace(/[^0-9A-Za-zÇĞİÖŞÜçğıöşü*\/.\-\s]/g, '')
        .replace(/\s+/g, ' ')
        .trimStart();
}

function erpSkipExcelNormalizeInput(el) {
    if (!el) return true;
    const id = String(el?.id || '');
    const type = String(el?.getAttribute?.('type') || '').toLowerCase();
    if (['date', 'datetime-local', 'month', 'time', 'week', 'password', 'email', 'tel', 'url', 'search', 'color', 'file', 'checkbox', 'radio'].includes(type)) return true;
    if (el.readOnly || el.disabled) return true;
    if (el.classList?.contains('siparis-termin-inp')) return true;
    if (id === 'val-starih' || id === 'val-ttarih' || id === 'val-deadline' || id === 'val-numune-tarih') return true;
    if (id === 'val-sno' || id === 'val-firma' || id === 'val-stok-kodu' || id === 'val-desen-kodu' || id === 'val-kodu') return true;
    if (id === 'val-desen-adi' || id === 'val-urun-adi' || id === 'val-kumas-cinsi') return true;
    if (id === 'val-cozgu-iplik-no' || id === 'val-cozgu-iplik-marka' || id === 'val-renk-kodu') return true;
    if (id.startsWith('val-kkart-atki-')) return true;
    if (id === 'val-cozgu-cinsi' || id === 'val-boya-not' || id === 'val-musteri' || id === 'val-urun') return true;
    if (id.includes('-marka') || id.includes('-adi') || id.includes('-cinsi') || id.includes('-firma')) return true;
    if (id.endsWith('-not') || id.includes('-not-')) return true;
    if (id === 'val-lot' || id === 'val-marka' || id === 'val-renk' || id === 'val-cins' || id === 'val-task' || id === 'val-desc') return true;
    if (id.startsWith('sk-kod-') || id.startsWith('sk-ad-') || id.startsWith('sk-desen-') || id.startsWith('sk-renk-') || id.startsWith('sk-rkod')) return true;
    if (id === 'val-iplik-no' || id === 'val-tarak-no' || id === 'val-cozgu-no') return true;
    if (id === 'ih-nm-numara' || id === 'ih-tarak-no' || id === 'ih-cozgu-numara') return true;
    if (id.startsWith('val-atki-no-')) return true;
    if (String(el?.dataset?.ih || '') === 'numara') return true;
    // Stok sayım / mobil kart girişleri — blur'da sayı normalize etme
    if (el.classList?.contains('sayim-inp') || el.classList?.contains('sayim-ekle-inp') || el.classList?.contains('sayim-ara-inp')) return true;
    if (id === 'sayim-ara') return true;
    return false;
}

// type=number alanlarda "+" yazılamadığı için fokus sırasında text'e çevirip
// blur'da sonucu hesaplayıp tekrar number'a döndürürüz.
document.addEventListener('focusin', (e) => {
    const el = e?.target;
    if (!el) return;
    const tag = String(el.tagName || '').toUpperCase();
    if (tag !== 'INPUT') return;
    const type = String(el.getAttribute('type') || '').toLowerCase();
    if (type !== 'number') return;
    try {
        el.dataset.erpExcelWasNumber = '1';
        el.setAttribute('type', 'text');
        el.setAttribute('inputmode', 'decimal');
        // mobil/IME için: number klavyesi + serbest karakter
    } catch (x) {}
}, true);

document.addEventListener('focusout', (e) => {
    const el = e?.target;
    if (!el) return;
    const tag = String(el.tagName || '').toUpperCase();
    if (tag !== 'INPUT') return;
    const type = String(el.getAttribute('type') || '').toLowerCase();
    // Sayısal giriş alanlarında (number dahil) excel toplama desteği
    if (type === 'number' || type === 'text' || type === '') {
        if (!erpSkipExcelNormalizeInput(el)) erpNormalizeExcelNumberInput(el);
    }
    // focusin'de number->text yaptıysak geri al
    try {
        if (el.dataset && el.dataset.erpExcelWasNumber === '1') {
            delete el.dataset.erpExcelWasNumber;
            el.setAttribute('type', 'number');
            el.removeAttribute('inputmode');
        }
    } catch (x) {}
}, true);

document.addEventListener('keydown', (e) => {
    if (!e || e.key !== 'Enter') return;
    const el = e.target;
    if (!el) return;
    const tag = String(el.tagName || '').toUpperCase();
    // textarea'da Enter yeni satır olmalı
    if (tag === 'TEXTAREA') return;
    if (tag !== 'INPUT' && tag !== 'SELECT') return;
    // Önce varsa expression'ı normalize et
    if (tag === 'INPUT' && !erpSkipExcelNormalizeInput(el)) erpNormalizeExcelNumberInput(el);
    // İstek: Enter ile otomatik kayıt yok. Sadece Kaydet butonu ile kayıt.
}, true);

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
    const s = String(q || '').trim();
    if (!s) return true;
    const parent = grup?.parent?.record;
    if (parent && mamulKartDetayliEslestir(parent, { q: s })) return true;
    return (grup.children || []).some(ch => mamulKartDetayliEslestir(ch.record, { q: s }));
}

function siparisMamulSeciciFlatRender(kartlar) {
    const host = document.getElementById('siparis-mamul-sec-list');
    const foot = document.getElementById('siparis-mamul-sec-foot');
    if (!host) return;
    siparisMamulSeciciGruplar = [];
    siparisMamulSeciciListe = Array.isArray(kartlar) ? kartlar : [];
    if (!siparisMamulSeciciListe.length) {
        host.innerHTML = `<div style="padding:24px 16px;text-align:center;color:var(--text3);font-size:11px;line-height:1.5">
            <div style="font-size:22px;margin-bottom:8px">🔍</div>
            Mamül stok kartı bulunamadı.<br>Arama terimini değiştirin veya yeni mamül kartı oluşturun.
        </div>`;
        if (foot) foot.textContent = '0 sonuç';
        return;
    }
    let html = `<div style="display:grid;grid-template-columns:22px 88px 1fr 1fr 72px 72px;gap:8px;padding:4px 12px 8px;font-size:8px;font-weight:700;color:var(--text3);text-transform:uppercase;font-family:'DM Mono',monospace;letter-spacing:0.06em;position:sticky;top:0;background:var(--surface);z-index:1">
        <span></span><span>Kod</span><span>Desen</span><span>Ürün</span><span>Ebat</span><span>Renk</span>
    </div>`;
    siparisMamulSeciciListe.forEach(k => {
        html += siparisMamulSeciciSatirHtml(k, {
            isVariant: mamulVaryantNoBul(k.desen_kodu) > 0,
            flat: true
        });
    });
    host.innerHTML = html;
    if (foot) foot.textContent = `${siparisMamulSeciciListe.length} sonuç (varyantlar dahil)`;
}

function siparisMamulEbatOku(k) {
    if (!k) return '';
    try {
        if (typeof mamulEkAlanMetaDecode === 'function') {
            const meta = mamulEkAlanMetaDecode(k.notlar || '');
            if (meta.istenen_mamul_ebat) return meta.istenen_mamul_ebat;
            if (meta.olculen_mamul_ebat) return meta.olculen_mamul_ebat;
        }
    } catch (e) {}
    if (k.mamul_en && k.mamul_boy) return `${k.mamul_en}*${k.mamul_boy}`;
    if (k.ham_en && k.ham_boy) return `${k.ham_en}*${k.ham_boy}`;
    return '';
}

function siparisMamulKaynakOku(k) {
    if (!k) return { self: null, parent: null, vNo: 0 };
    const vNo = mamulVaryantNoBul(k.desen_kodu);
    const anaKod = mamulAnaKodBul(k.desen_kodu);
    const parent = (vNo > 0 && anaKod) ? mamulAnaKayitBul(anaKod) : null;
    return { self: k, parent, vNo, anaKod };
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
    if (!vNo && varyantlar.length === 1) {
        renk = mamulVaryantRenkEtiket(varyantlar[0]);
        if (renk) return renk.toUpperCase();
    }
    const rv = String(stokKartDokumaAlanlariOku(hedef).renk_varyant || '').trim();
    if (rv && !/^\d+\s*varyant/i.test(rv)) return rv.toUpperCase();
    return '';
}

// siparisMamulAnaVaryantliMi: ana programın assets/stok-kart-desktop.js sürümü kullanılır (mobil kopyası silindi — ezmesin).
function siparisKalemMamulDoldur(kalemNo, k, opts = {}) {
    if (!k || !kalemNo) return;
    const mv = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? ''; };
    const anaSecim = opts.anaSecim != null ? !!opts.anaSecim : (mamulVaryantNoBul(k.desen_kodu) <= 0);
    mv(`sk-kod-${kalemNo}`, k.desen_kodu || '');
    mv(`sk-desen-${kalemNo}`, siparisMamulDesenOku(k));
    mv(`sk-ad-${kalemNo}`, siparisMamulUrunAdiOku(k));
    mv(`sk-grup-${kalemNo}`, (k.kumas_cinsi || k.firma || '').toUpperCase());
    mv(`sk-ebat-${kalemNo}`, String(siparisMamulEbatOku(k) || '').trim().replace(/\s+/g, ''));
    if (anaSecim && siparisMamulAnaVaryantliMi(k)) mv(`sk-renk-${kalemNo}`, '');
    else mv(`sk-renk-${kalemNo}`, siparisMamulRenkOku(k));
    updateSiparisPreview();
}

function siparisMamulSeciciSatirHtml(k, opts = {}) {
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
    const cls = [
        'siparis-mamul-sec-row',
        isVariant ? 'is-variant' : 'is-parent',
        hasVariants ? 'has-variants' : ''
    ].filter(Boolean).join(' ');
    const chevOnclick = hasVariants
        ? `event.stopPropagation();siparisMamulSeciciToggle('${erpAttr(anaKod)}')`
        : '';
    const renkGoster = isVariant ? renk : (hasVariants ? `${vCount} varyant` : (renk || '—'));
    const chevHtml = hasVariants
        ? `<span class="chev chev--toggle"${chevOnclick ? ` onclick="${chevOnclick}"` : ''} title="Varyantları aç/kapat">${chev}</span>`
        : `<span class="chev">${isVariant ? '·' : ''}</span>`;
    const rowTitle = isVariant
        ? `${k.desen_kodu} — varyant seç (renk otomatik dolar)`
        : (hasVariants ? 'Ana ürünü seç — renk boş kalır, elle yazabilirsiniz' : 'Ürünü seç');
    return `<div class="${cls}" onclick="siparisMamulSeciciSecKayit('${erpAttr(k.desen_kodu)}')" title="${rowTitle}">
        ${chevHtml}
        <span class="kod">${pdfEsc(k.desen_kodu)}${isVariant ? '<span class="varyant-pill">V</span>' : ''}${hasVariants && !expanded ? `<span class="varyant-pill">+${vCount}</span>` : ''}</span>
        <span class="ad" title="${pdfEsc(desen)}">${pdfEsc(desen)}</span>
        <span class="meta" title="${pdfEsc(urun)}">${pdfEsc(urun)}</span>
        <span class="meta" title="${pdfEsc(ebat)}">${pdfEsc(ebat)}</span>
        <span class="meta" title="${pdfEsc(renkGoster)}">${pdfEsc(renkGoster)}</span>
    </div>`;
}

function siparisMamulSeciciRender(gruplar) {
    const host = document.getElementById('siparis-mamul-sec-list');
    const foot = document.getElementById('siparis-mamul-sec-foot');
    if (!host) return;
    siparisMamulSeciciGruplar = Array.isArray(gruplar) ? gruplar : [];
    siparisMamulSeciciListe = [];
    if (!siparisMamulSeciciGruplar.length) {
        host.innerHTML = `<div style="padding:24px 16px;text-align:center;color:var(--text3);font-size:11px;line-height:1.5">
            <div style="font-size:22px;margin-bottom:8px">🔍</div>
            Mamül stok kartı bulunamadı.<br>Arama terimini değiştirin veya yeni mamül kartı oluşturun.
        </div>`;
        if (foot) foot.textContent = '0 ana ürün';
        return;
    }
    const exp = window._siparisMamulSeciciExpanded;
    let html = `<div style="display:grid;grid-template-columns:22px 88px 1fr 1fr 72px 72px;gap:8px;padding:4px 12px 8px;font-size:8px;font-weight:700;color:var(--text3);text-transform:uppercase;font-family:'DM Mono',monospace;letter-spacing:0.06em;position:sticky;top:0;background:var(--surface);z-index:1">
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
        html += siparisMamulSeciciSatirHtml(parent, {
            anaKod: grup.anaKod,
            hasVariants,
            expanded,
            vCount: children.length
        });
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
    host.innerHTML = html;
    if (foot) {
        const ana = siparisMamulSeciciGruplar.length;
        const totalAna = siparisMamulGruplariTopla().length;
        foot.textContent = ana === totalAna
            ? `${ana} ana ürün · ${varyantSayisi} varyant gizli/açık`
            : `${ana} / ${totalAna} ana ürün`;
    }
}

function siparisMamulSeciciAra(q) {
    const s = String(q || '').trim();
    if (!s) {
        window._siparisMamulSeciciExpanded = new Set();
        siparisMamulSeciciRender(siparisMamulGruplariTopla().slice(0, 200));
        return;
    }
    const sLower = s.toLowerCase();
    let filtreli = siparisMamulGruplariTopla().filter(g => siparisMamulGrupEslestir(g, s));
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
            const parentHit = parent && typeof mamulDepoAramaMetni === 'function'
                ? mamulDepoAramaMetni(parent, parent).includes(sLower)
                : false;
            if (!parentHit && (g.children || []).length) window._siparisMamulSeciciExpanded.add(ana);
        });
        siparisMamulSeciciRender(filtreli.slice(0, 200));
        return;
    }
    siparisMamulSeciciFlatRender(typeof mamulDepoAramaSonuclari === 'function' ? mamulDepoAramaSonuclari(s, 200) : []);
}

function siparisMamulSeciciToggle(anaKod) {
    const ana = String(anaKod || '').trim().toUpperCase();
    if (!ana) return;
    if (window._siparisMamulSeciciExpanded.has(ana)) window._siparisMamulSeciciExpanded.delete(ana);
    else window._siparisMamulSeciciExpanded.add(ana);
    siparisMamulSeciciRender(siparisMamulSeciciGruplar);
}

function siparisMamulSeciciAc(kalemNo) {
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
}

function siparisMamulSeciciKapat(ev) {
    if (ev && ev.target && ev.currentTarget !== ev.target && ev.type === 'click') return;
    const modal = document.getElementById('siparis-mamul-sec-modal');
    if (modal) modal.style.display = 'none';
    siparisMamulSeciciKalemNo = 0;
    window._siparisMamulSeciciExpanded = new Set();
}

function siparisMamulSeciciSecKayit(kod) {
    const hedef = String(kod || '').trim().toUpperCase();
    if (!hedef || !siparisMamulSeciciKalemNo) return;
    const k = (typeof mamulKartBul === 'function' ? mamulKartBul(hedef) : null)
        || (siparisMamulKartlariTopla() || []).find(x =>
            String(x.desen_kodu || '').trim().toUpperCase() === hedef
        ) || (siparisMamulSeciciListe || []).find(x =>
            String(x.desen_kodu || '').trim().toUpperCase() === hedef
        );
    if (!k) return;
    siparisKalemMamulDoldur(siparisMamulSeciciKalemNo, k, {
        anaSecim: mamulVaryantNoBul(k.desen_kodu) <= 0
    });
    siparisMamulSeciciKapat();
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('siparis-mamul-sec-modal');
        if (modal && modal.style.display === 'flex') siparisMamulSeciciKapat();
    }
});

// ============================================================
// searchActiveOrders, selectOrderForWeaving, selectProductForWeaving — Tek tanım
// ============================================================
async function boyahaneWarmupUaCache(forceRender = true) {
    if (boyahaneUaWarmupRunning) return;
    const siparisler = (dataCache.siparisler || []).filter(s => String(s?.durum || '').toUpperCase() !== 'TAMAMLANDI');
    const eksik = siparisler.filter(s => _kdCache[`KD_URUN_AGACI_${s.id}`] === undefined);
    if (!eksik.length) return;
    boyahaneUaWarmupRunning = true;
    try {
        await Promise.all(eksik.map(s => sbKdGet(s.id, 'KD_URUN_AGACI')));
        if (forceRender && appMode === 'BOYAHANE_URETIM') renderInputs();
    } catch (e) {
    } finally {
        boyahaneUaWarmupRunning = false;
    }
}

async function openBoyahaneUretim(alanId = 'BOBIN_BOYA') {
    boyahaneUretimAlan = BOYAHANE_ALANLARI[alanId] ? alanId : 'BOBIN_BOYA';
    saveUiState({ boyahaneUretimAlan });
    await setAppMode('BOYAHANE_URETIM');
    await boyahaneWarmupUaCache(false);
}

// --- SİPARİŞ / DASHBOARD ---

// --- İŞ AKIŞI ---

window.startEditingFromArchive = function(idx) {
    const record = currentData[idx];
    if (!record) return;
    stokKartDuzenleAc(record);
};

const collectStockCardData = () => {
    const atkiDizisi = [];
    document.querySelectorAll('[id^="val-atki-no-"]').forEach((el) => {
        const idNum = el.id.split('-').pop();
        const n = el.value || '';
        const c = document.getElementById(`val-atki-cins-${idNum}`)?.value || '';
        const r = document.getElementById(`val-atki-renk-${idNum}`)?.value || '';
        const s = document.getElementById(`val-atki-sayi-${idNum}`)?.value || '';
        const idx = Math.max(0, parseInt(idNum, 10) - 1);
        const v2 = numuneVaryantRenkListeOku('val-v2-renk-list')[idx] || '';
        const v3 = numuneVaryantRenkListeOku('val-v3-renk-list')[idx] || '';
        const v4 = numuneVaryantRenkListeOku('val-v4-renk-list')[idx] || '';
        if (n || c || r || s || v2 || v3 || v4) atkiDizisi.push(`${n} - ${c} - ${r} - ${s} - ${v2} - ${v3} - ${v4}`);
    });
    return {
        ana_grup: document.getElementById('val-ana-grup')?.value || 'EV TEKSTİLİ',
        desen_kodu: document.getElementById('val-kodu')?.value || '',
        urun_adi: document.getElementById('val-urun-adi')?.value?.toUpperCase() || '',
        desen_adi: document.getElementById('val-desen-adi')?.value?.toUpperCase() || '',
        firma: document.getElementById('val-firma')?.value?.toUpperCase() || '',
        ham_en: erpValDecimal('val-ham-en') || 0,
        ham_gsm: erpValDecimal('val-ham-gsm') || 0,
        mamul_en: erpValDecimal('val-mamul-en') || 0,
        mamul_gsm: erpValDecimal('val-mamul-gsm') || 0,
        atki_renkleri: atkiDizisi.join(' | '),
        kalite: document.getElementById('val-durum')?.value || 'AKTİF',
        notlar: document.getElementById('val-notlar')?.value || '',
        fotograf: currentImageBase64,
        updated_by: "Admin",
        kaynak_birim: appMode
    };
};
// Güvenlik varsayılanı: login bypass kapalı.
// Sadece yerel geliştirme için erp-config.js içinde allowLocalBypass=true verilirse açılır.
async function erpDoLogin() {
    const userEl = document.getElementById('erp-login-user');
    const passEl = document.getElementById('erp-login-pass');
    const errEl  = document.getElementById('erp-login-error');
    const btn    = document.getElementById('erp-login-btn');
    const username = (userEl?.value || '').trim().toLowerCase();
    const password = passEl?.value || '';
    if (!username || !password) {
        if (errEl) { errEl.textContent = '⚠ Kullanıcı adı ve şifre zorunludur.'; errEl.style.display = 'block'; }
        return;
    }
    if (btn) { btn.textContent = 'Giriş yapılıyor…'; btn.disabled = true; btn.style.opacity = '0.7'; }
    if (errEl) errEl.style.display = 'none';
    try {
        const { data, error } = await sb.rpc('erp_login', { p_username: username, p_password: password });
        if (error) throw error;
        if (!data?.ok) {
            if (errEl) { errEl.textContent = '✕ ' + (data?.err || 'Kullanıcı adı veya şifre hatalı.'); errEl.style.display = 'block'; }
            if (btn) { btn.textContent = 'Giriş Yap'; btn.disabled = false; btn.style.opacity = '1'; }
            if (passEl) passEl.value = '';
            return;
        }
        const user = data.user;
        erpSetToken(data.token);
        localStorage.setItem('erp_user_cache', JSON.stringify(user));
        erpCurrentUser = {
            username:      user.username,
            display_name:  user.display_name || user.username,
            role:          user.role,
            allowed_modes: erpNormalizeAllowedModes(user.allowed_modes)
        };
        const overlay = document.getElementById('erp-login-overlay');
        if (overlay) overlay.remove();
        const sidebar = document.querySelector('aside.erp-sidebar');
        const mainEl  = document.querySelector('main');
        if (sidebar) sidebar.style.display = '';
        if (mainEl)  mainEl.style.display  = '';
        erpCloseMobileSidebar();
        erpUpdateSidebarUser();
        erpApplyNavPermissions();
        erpInjectAdminNav();
        await syncAllData(false, { silent: false, siparisLight: true });
        await setAppMode(window.ERP_MOBIL_BOOT_MODE || 'SIPARIS_LISTE');
    } catch (err) {
        const msg = err?.message || String(err);
        if (errEl) {
            errEl.textContent = msg.includes('function') || msg.includes('rpc')
                ? '⚠ Supabase SQL kurulumu tamamlanmamış. Önce supabase_setup.sql çalıştırın.'
                : '✕ Sunucu hatası: ' + msg;
            errEl.style.display = 'block';
        }
        if (btn) { btn.textContent = 'Giriş Yap'; btn.disabled = false; btn.style.opacity = '1'; }
    }
}

window.editRecordFromList = editRecordFromList;
window.mamulStokKartiAc = mamulStokKartiAc;
window.mamulKaynakSec = mamulKaynakSec;
window.mamulKaynakAraGoster = mamulKaynakAraGoster;
window.mamulKartAramaFiltreSifirla = mamulKartAramaFiltreSifirla;
window.mamulKartListeHizliFiltreSet = mamulKartListeHizliFiltreSet;
window.mamulKartAramaDetayToggle = mamulKartAramaDetayToggle;
window.editMamulKartFromListe = editMamulKartFromListe;

/* ══════════════════════════════════════════════════════════════════
 * SEVKİYAT GENEL MERKEZİ — masaüstünden (stok.html) birebir taşındı
 * Kaynak: 01-supabase-auth.js, 02-data-yetki.js, 04-live-sync.js
 * Not: renderPlanlama() burada YOK — mobilin kendi Planlama ekranı
 * korunuyor, çakışma olmasın diye. Sevkiyat, İhtiyaç Planlama motoruna
 * (planlamaIhtiyac*) dayanıyor; o motor burada birebir mevcut.
 * ══════════════════════════════════════════════════════════════════ */
/** Sevk / yüklenen adedi — tek kaynak menü: Sevkiyat */
try { window.planlamaIhtiyacSevkGirisYapabilir = planlamaIhtiyacSevkGirisYapabilir; } catch (e) {}

/** Adet kutuları yalnızca Sevkiyat ekranında açık */
try { window.sevkiyatAdetGirisAktifMi = sevkiyatAdetGirisAktifMi; } catch (e) {}
/* planlamaYerPanelAcikMi / planlamaYerPanelToggle — mobilde zaten (yukarıda) tanımlı, tekrar edilmedi */

try { window.planlamaIhtiyacAdetYazi = planlamaIhtiyacAdetYazi; } catch (e) {}

/** Sevkiyat mamül hareketlerini sipariş için DB'den çekip dataCache'e ekle (özet/durum depo köprüsü). */
try { window.sevkiyatSiparisDepoHareketleriYukle = sevkiyatSiparisDepoHareketleriYukle; } catch (e) {}

/** Operasyon günlüğü KONF_SEVK / SEVK — kalem mutlak yükleme (toplam_sevk) veya delta toplamı. */
try { window.sevkiyatSiparisKalemYuklemeFromAkis = sevkiyatSiparisKalemYuklemeFromAkis; } catch (e) {}

/** Sevkiyat Merkezi depo hareketlerinden (kumas_stok) kalem yükleme toplamı.
 * Mamül = adet (cuval); kumaş MT/KG kalem = metre (veya kg). Sipariş durum / özet buradan da okur. */
/** Aynı siparişte bu ürün adı bu birim grubunda tek kalemde mi? */
try { window.sevkiyatSiparisKalemYuklemeFromDepo = sevkiyatSiparisKalemYuklemeFromDepo; } catch (e) {}

/** Durum inceleme günlüğü: sevkiyat/depo çıkışları. Kullanıcı yalnız stok satırındaki updated_by. */
try { window.siparisDurumDepoSevkGunlukSatirlari = siparisDurumDepoSevkGunlukSatirlari; } catch (e) {}

/** Kumaş çıkış payload → sipariş + kalem eşlemesi */
try { window.sevkiyatKumasPayloadSiparisKalemCoz = sevkiyatKumasPayloadSiparisKalemCoz; } catch (e) {}

/**
 * Kumaş metraj çıkışı → sipariş durum Yükleme (KD sevk_edilen) — eski konfeksiyon sevk gibi birikir.
 * payloads: kumas_stok ÇIKIŞ satırları (mt/kg + lot/SIP/siparis_id).
 */
try { window.sevkiyatKumasCikisSiparisYuklemeIsle = sevkiyatKumasCikisSiparisYuklemeIsle; } catch (e) {}

/** Sevkiyat yükleme — oturum içi anlık mirror (KD gecikse bile Yüklenen hemen görünsün) */
/** KD + yerel mirror — Sevkiyat Yüklenen alanı buradan beslenir */
try { window.sevkiyatYuklemeCacheYaz = sevkiyatYuklemeCacheYaz; } catch (e) {}

/** Konfeksiyon sevk + KD + Sevkiyat depo hareketi — sevk ekranıyla aynı kaynak */
/** Açık sipariş için depo + akış yüklemelerini KD_KONFEKSIYON'a geri yaz (özet/durum kalıcı görsün) */
try { window.sevkiyatSiparisYuklemeKdDepodanOnar = sevkiyatSiparisYuklemeKdDepodanOnar; } catch (e) {}

/**
 * Ortak sevk toplamı (mutlak). Sipariş ihtiyaç + konfeksiyon sevk + sipariş detay aynı yere yazar/okur:
 * KD_KONFEKSIYON.kalem_i.sevk_edilen + pipeline sevk_edilen_adet (+ artan fark için KONF_SEVK log).
 * Azaltmada aynı kalemin TÜM pipeline satırları dengelenir (tek satır güncelleyip diğerlerini bırakmaz).
 *
 * Tek yazma UI: menü → Sevkiyat (Yüklenen / Sevk +/-).
 */
try { window.erpSevkAdetGirisAc = erpSevkAdetGirisAc; } catch (e) {}

try { window.erpSevkAdetYazmaKapaliMi = erpSevkAdetYazmaKapaliMi; } catch (e) {}

try { window.siparisOpKonfSevkSevkiyatAynasiMi = siparisOpKonfSevkSevkiyatAynasiMi; } catch (e) {}

try { window.konfSevkToplamYaz = konfSevkToplamYaz; } catch (e) {}

/**
 * Mamül sevkiyat toplu yükleme — sipariş başına 1 KD yazımı + tek akış insert.
 * Satır satır konfSevkToplamYaz yerine kullanılır (dakikalarca süren kayıt engeli).
 * entries: [{ siparisId, kalemIdx, deltaAdet, note? }]
 */
try { window.konfSevkMamulTopluYukle = konfSevkMamulTopluYukle; } catch (e) {}

/** Sipariş ihtiyaç satırından sevk — +adet ekler, -adet düşer; alan sıfırlanır */
try { window.planlamaIhtiyacSevkTaslakYaz = planlamaIhtiyacSevkTaslakYaz; } catch (e) {}

/** Sevkiyat grid mamül çıkışı: stok_kodu yoksa ürün / sno / kalem yedekleri */
/**
 * Sevkiyat Merkezi adet grid → kumas_stok mamül hareketi + muhasebe fişi.
 * delta > 0: ÇIKIŞ; delta < 0: GİRİŞ (düzeltme). Aynı SEVK_GRID etiketi tekrar yazılmaz.
 */
try { window.sevkiyatMamulDepoHareketYaz = sevkiyatMamulDepoHareketYaz; } catch (e) {}
try { window.sevkiyatMamulStokKoduCoz = sevkiyatMamulStokKoduCoz; } catch (e) {}

try { window.planlamaIhtiyacSevkKaydet = planlamaIhtiyacSevkKaydet; } catch (e) {}

/** Yüklenen toplamını doğrudan düzelt (mutlak değer) */
try { window.planlamaIhtiyacYuklemeDuzelt = planlamaIhtiyacYuklemeDuzelt; } catch (e) {}

// ════════════════════════════════════════════════════════
//  SEVKİYAT — mamul sevk adedi tek giriş ekranı
// ════════════════════════════════════════════════════════
/** @type {'TUMU'|'HAZIR'|'KALAN'|'KUMAS'|'URUN'} */
try { window.sevkiyatAraYaz = sevkiyatAraYaz; } catch (e) {}

try { window.sevkiyatTipSec = sevkiyatTipSec; } catch (e) {}

try { window.sevkiyatSadeceKalanToggle = sevkiyatSadeceKalanToggle; } catch (e) {}

try { window.sevkiyatFiltreSifirla = sevkiyatFiltreSifirla; } catch (e) {}

/** Sevkiyat listesinde tüm satırları göster (varsayılan: ilk 400 — veri kaybolmaz, hepsi aramada) */
try { window.sevkiyatTumunuGosterToggle = sevkiyatTumunuGosterToggle; } catch (e) {}

try { window.erpOrphanAramaDropTemizle = erpOrphanAramaDropTemizle; } catch (e) {}

try { window.sevkiyatRender = sevkiyatRender; } catch (e) {}

try { window.renderSevkiyat = renderSevkiyat; } catch (e) {}

/* isDepoHareketModu / depoHareketFormGrubu — mobilin kendi (yukarıda, SEVKIYAT
   dalıyla yamanmış) sürümü kullanılıyor; masaüstünün isDepoStokModu'ya bağımlı
   sürümü burada bilinçli olarak yeniden tanımlanmadı (çakışma/regresyon olmasın). */
/** Kaydet başarılı → Sevkiyat form modalını kapat (kısa gecikme: toast / render yarışı olmasın). */
try {
    window.sevkiyatFormModalAktifMi = sevkiyatFormModalAktifMi;
    window.sevkiyatFormModalSync = sevkiyatFormModalSync;
    window.sevkiyatFormModalOverlayClick = sevkiyatFormModalOverlayClick;
    window.sevkiyatFormModalKayitSonrasiKapat = sevkiyatFormModalKayitSonrasiKapat;
} catch (e) {}

try { window.sevkiyatMerkezAc = sevkiyatMerkezAc; } catch (e) {}

try { window.sevkiyatMerkezKapat = sevkiyatMerkezKapat; } catch (e) {}

/* ══════════════════════════════════════════════════════════════════
 * SEVKİYAT GENEL MERKEZİ — son
 * ══════════════════════════════════════════════════════════════════ */

/* --- mobil overrides (menü masaüstü ile aynı; excel/chart kapalı) --- */
/**
 * Simteks Mobil ERP — ana dosya yüklendikten sonra uygulanan sadeleştirmeler
 * - Anasayfa yok; açılış siparişler
 * - Canlı senkron Realtime açık (satır bazlı)
 * - Grafik / Excel yolları kapalı
 */
(function (w) {
    'use strict';
    if (!w.ERP_MOBIL_LITE) return;

    const toast = (msg) => {
        try {
            if (typeof w.erpToast === 'function') w.erpToast(msg, 'warn', 2200);
            else if (typeof w.showToast === 'function') w.showToast(msg, 'warn');
        } catch (e) {}
    };

    const excelKapali = () => {
        toast('Mobilde Excel yükleme / indirme kapalı. Masaüstü ERP kullanın.');
        return false;
    };

    // —— Grafik: Anasayfa ana programla aynı olsun diye açık (chart.js mobil-erp.html'de yüklü) ——

    // —— Canlı senkron: Realtime açık (satır bazlı); Excel/grafik kapalı kalır ——

    // —— PDF: html2pdf yalnızca ihtiyaç olunca ——
    const HTML2PDF_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    let _html2pdfPromise = null;
    w.erpEnsureHtml2Pdf = function () {
        if (typeof w.html2pdf === 'function') return Promise.resolve(w.html2pdf);
        if (_html2pdfPromise) return _html2pdfPromise;
        _html2pdfPromise = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = HTML2PDF_SRC;
            s.async = true;
            s.onload = () => resolve(w.html2pdf);
            s.onerror = () => {
                _html2pdfPromise = null;
                reject(new Error('PDF kütüphanesi yüklenemedi'));
            };
            document.head.appendChild(s);
        });
        return _html2pdfPromise;
    };
    const _exportToPDF = typeof w.exportToPDF === 'function' ? w.exportToPDF.bind(w) : null;
    if (_exportToPDF) {
        w.exportToPDF = async function () {
            try {
                await w.erpEnsureHtml2Pdf();
            } catch (e) {
                toast('PDF için kütüphane yüklenemedi.');
                return;
            }
            return _exportToPDF.apply(this, arguments);
        };
    }

    // —— Excel API stub ——
    const excelFns = [
        'importSiparisExcel', 'importStokExcel', 'openStokExcelImport', 'downloadStokExcelTemplate',
        'exportDepoHareketExcel', 'exportAktifModalExcel', 'exportToExcel',
        'dtExcelDosyaOku', 'openDtExcelImport', 'dtExcelSonImportGeriAl',
        'downloadSiparisExcelTemplate', 'exportSiparisFormuExcel',
        'mamulUretimKartiExcelIndir', 'uretimKartiExcelIndir'
    ];
    excelFns.forEach((name) => {
        w[name] = function () { return excelKapali(); };
    });

    // —— UI: anasayfa / excel butonlarını gizle ——
    function hideLiteUi() {
        const hideIds = [
            'stok-excel-template-btn',
            'stok-excel-import-btn',
            'siparis-excel-input',
            'stok-excel-input',
            'dt-excel-input',
            'modal-excel-btn',
            'nav-DASHBOARD'
        ];
        hideIds.forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.style.display = 'none';
            el.classList.add('erp-nav-denied');
        });
        document.body.classList.add('erp-mobil-lite');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideLiteUi);
    } else {
        hideLiteUi();
    }
    // Geç yüklenen nav için tekrar
    setTimeout(hideLiteUi, 800);
    setTimeout(hideLiteUi, 2500);

    console.info('[mobil-lite] Anasayfa yok; açılış siparişler; Chart / Excel kapalı; Realtime açık');
})(window);
