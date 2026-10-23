/**
 * Simteks ERP — ortak çalışma zamanı yardımcıları
 * UI / form alanı değiştirmez; performans ve dayanıklılık katmanı.
 */
(function (w) {
    'use strict';

    function erpLsQuotaRecover() {
        const keys = [
            'erp_data_cache_v3',
            'erp_siparis_sync_dropped_v1',
            'erp_ui_state_v1'
        ];
        keys.forEach(function (k) {
            try { w.localStorage.removeItem(k); } catch (e) {}
        });
    }

    /** localStorage yaz — kota aşımında eski önbelleği temizleyip bir kez daha dener */
    w.erpLsSet = function erpLsSet(key, value) {
        const raw = typeof value === 'string' ? value : JSON.stringify(value);
        try {
            w.localStorage.setItem(key, raw);
            return true;
        } catch (e) {
            if (!e || (e.name !== 'QuotaExceededError' && e.code !== 22 && e.code !== 1014)) return false;
            try { erpLsQuotaRecover(); } catch (e2) {}
            try {
                w.localStorage.setItem(key, raw);
                return true;
            } catch (e3) {
                return false;
            }
        }
    };

    /** requestAnimationFrame ile olay throttle — scroll/resize için */
    w.erpRafThrottle = function erpRafThrottle(fn) {
        let scheduled = false;
        let lastArgs = null;
        return function throttled() {
            lastArgs = arguments;
            if (scheduled) return;
            scheduled = true;
            w.requestAnimationFrame(function () {
                scheduled = false;
                const args = lastArgs;
                lastArgs = null;
                try { fn.apply(null, args); } catch (e) {}
            });
        };
    };

    /** resize için hafif debounce */
    w.erpDebounce = function erpDebounce(fn, waitMs) {
        let t = null;
        return function debounced() {
            const ctx = this;
            const args = arguments;
            if (t) clearTimeout(t);
            t = setTimeout(function () {
                t = null;
                try { fn.apply(ctx, args); } catch (e) {}
            }, waitMs || 120);
        };
    };

    /** Supabase istemci seçenekleri — özel oturum (erp_sessions) kullanılır */
    w.erpSupabaseClientOptions = function erpSupabaseClientOptions() {
        return {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            },
            realtime: {
                params: { eventsPerSecond: 8 }
            }
        };
    };

    /**
     * Ağır, seyrek kullanılan kütüphaneleri (Excel/PDF) yalnızca ilk gerçek
     * ihtiyaç anında yükler — açılışta <head> üzerinden hepsini indirmek
     * yerine. Aynı URL için tek indirme yapılır (paralel çağrılar aynı
     * promise'i paylaşır).
     */
    const _erpScriptPromises = {};
    w.erpEnsureScript = function erpEnsureScript(url) {
        if (_erpScriptPromises[url]) return _erpScriptPromises[url];
        const p = new Promise(function (resolve, reject) {
            const s = document.createElement('script');
            s.src = url;
            s.async = true;
            s.onload = function () { resolve(); };
            s.onerror = function () { reject(new Error('Kütüphane yüklenemedi: ' + url)); };
            document.head.appendChild(s);
        });
        _erpScriptPromises[url] = p;
        p.catch(function () { delete _erpScriptPromises[url]; });
        return p;
    };

    w.erpEnsureXLSX = function erpEnsureXLSX() {
        if (typeof w.XLSX !== 'undefined') return Promise.resolve();
        return w.erpEnsureScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
    };

    w.erpEnsureExcelJS = function erpEnsureExcelJS() {
        if (typeof w.ExcelJS !== 'undefined') return Promise.resolve();
        return w.erpEnsureScript('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js');
    };

    w.erpEnsureHtml2Pdf = function erpEnsureHtml2Pdf() {
        if (typeof w.html2pdf !== 'undefined') return Promise.resolve();
        return w.erpEnsureScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
    };
})(window);
