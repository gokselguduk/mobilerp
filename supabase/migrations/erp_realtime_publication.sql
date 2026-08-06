-- Supabase Realtime: değişen satırları diğer bilgisayarlara yayınla
-- SQL Editor'de bir kez çalıştırın.

-- 1) Tabloları realtime publication'a ekle (zaten varsa hata yok say)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'siparisler',
    'kumas_stok',
    'kumas_kutuphanesi',
    'iplik_stok',
    'todo_list',
    'tezgahlar',
    'siparis_akis'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_object THEN
        RAISE NOTICE 'Publication supabase_realtime yok veya tablo % bulunamadı', t;
      WHEN OTHERS THEN
        RAISE NOTICE 'Realtime eklenemedi %: %', t, SQLERRM;
    END;
  END LOOP;
END $$;

-- 2) UPDATE/DELETE olaylarında satır kimliği güvenilir gelsin
ALTER TABLE IF EXISTS public.siparisler REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.kumas_stok REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.kumas_kutuphanesi REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.iplik_stok REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.todo_list REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.tezgahlar REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.siparis_akis REPLICA IDENTITY FULL;
