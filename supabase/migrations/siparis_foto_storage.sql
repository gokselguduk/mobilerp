-- Sipariş fotoğrafları → Supabase Storage (base64 yerine URL)
-- Supabase SQL Editor'de bir kez çalıştırın.

-- 1) Public bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'siparis-fotograflar',
  'siparis-fotograflar',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2) Politikalar (ERP anon key ile okuma/yazma)
DROP POLICY IF EXISTS "siparis_foto_public_read" ON storage.objects;
CREATE POLICY "siparis_foto_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'siparis-fotograflar');

DROP POLICY IF EXISTS "siparis_foto_anon_insert" ON storage.objects;
CREATE POLICY "siparis_foto_anon_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'siparis-fotograflar');

DROP POLICY IF EXISTS "siparis_foto_anon_update" ON storage.objects;
CREATE POLICY "siparis_foto_anon_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'siparis-fotograflar')
  WITH CHECK (bucket_id = 'siparis-fotograflar');

DROP POLICY IF EXISTS "siparis_foto_anon_delete" ON storage.objects;
CREATE POLICY "siparis_foto_anon_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'siparis-fotograflar');

COMMENT ON COLUMN public.siparisler.siparis_fotograflar IS
  'Sipariş fotoğrafları: [{src: storage veya data url, aciklama}] — tercih Storage URL';
