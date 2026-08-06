-- Sipariş fotoğrafları — Simteks kurulumunda kolon adı: siparis_fotograflar (jsonb)
-- Supabase SQL Editor'de bir kez çalıştırın (çoğu projede zaten vardır).

ALTER TABLE public.siparisler
  ADD COLUMN IF NOT EXISTS siparis_fotograflar jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.siparisler.siparis_fotograflar IS
  'Sipariş fotoğrafları: [{src: Storage URL (tercih) veya data-url, aciklama}]. Storage: siparis_foto_storage.sql';
