-- Manuel kumaş depo sıfırlama (mamül kayıtları korunur)
-- ÖNEMLİ: Çalıştırmadan önce Supabase yedeği alın.

DELETE FROM public.kumas_stok
WHERE NOT (
    UPPER(COALESCE(kaynak_birim, '')) IN ('MAMUL_DEPO', 'DEPO_HAREKET_MAMUL_DEPO')
    OR UPPER(COALESCE(SPLIT_PART(TRIM(COALESCE(stok_kodu, '')), '-', 1), '')) IN ('MA', 'MM')
);

-- Dokuma stok bağlantılarını temizlemek için siparis_akis KD_DOKUMA kayıtları
-- ERP içinden sıfırlama yapıldığında otomatik güncellenir.
