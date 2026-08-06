-- Masaüstü EXE uzaktan güncelleme dosyaları (latest.yml + Setup.exe)
-- Supabase Dashboard → Storage → erp-desktop-updates bucket
-- Herkese açık OKUMA; yükleme yalnızca service_role ile (geliştirici bilgisayarı).

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('erp-desktop-updates', 'erp-desktop-updates', true, 524288000)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "erp_desktop_updates_public_read" ON storage.objects;

CREATE POLICY "erp_desktop_updates_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'erp-desktop-updates');
