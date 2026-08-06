-- kumas_stok tablosuna lot_no kolonu (yoksa ekle)
-- Supabase Dashboard > SQL Editor'de çalıştırın.
-- Sonra Settings > API > Reload schema (veya bir süre bekleyin) ile schema cache yenilenebilir.

ALTER TABLE public.kumas_stok
  ADD COLUMN IF NOT EXISTS lot_no text;

COMMENT ON COLUMN public.kumas_stok.lot_no IS 'Lot / sipariş no (sevk ve stok hareketlerinde)';

NOTIFY pgrst, 'reload schema';
