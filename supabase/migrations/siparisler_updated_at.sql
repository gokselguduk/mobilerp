-- Sipariş güncelleme zaman damgası (senkronizasyon / rapor için isteğe bağlı)
-- Supabase SQL Editor'de bir kez çalıştırın.

ALTER TABLE public.siparisler
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.siparisler
  ADD COLUMN IF NOT EXISTS updated_by text;

COMMENT ON COLUMN public.siparisler.updated_at IS 'Son güncelleme (UTC). Yoksa created_at kullanılır.';
COMMENT ON COLUMN public.siparisler.updated_by IS 'Son güncelleyen kullanıcı adı.';

-- Mevcut satırlar için başlangıç değeri
UPDATE public.siparisler
SET updated_at = COALESCE(updated_at, created_at, now())
WHERE updated_at IS NULL;
