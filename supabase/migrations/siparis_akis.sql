-- siparis_akis: güvenli kurulum / tamamlama (tekrar çalıştırılabilir)
-- Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS public.siparis_akis (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at  timestamptz DEFAULT now() NOT NULL,
  siparis_id  bigint,
  islem       text,
  kalem_ad    text,
  miktar      numeric DEFAULT 0,
  notlar      text
);

ALTER TABLE public.siparis_akis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all" ON public.siparis_akis;
CREATE POLICY "anon_all" ON public.siparis_akis
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_siparis_akis_siparis_islem
  ON public.siparis_akis (siparis_id, islem);
