-- Sipariş no (sno) çakışma temizliği + performans index'leri
-- Supabase SQL Editor'de adım adım çalıştırın.

-- ═══════════════════════════════════════════════════════════════════════════
-- ADIM A — Çiftleri gör (sadece SELECT, veri değiştirmez)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  s.sno,
  COUNT(*) AS adet,
  string_agg(
    s.id::text || ' | ' || COALESCE(s.firma, '—') || ' | ' ||
    COALESCE(to_char(s.starih, 'DD.MM.YYYY'), '—') || ' | ' ||
    COALESCE(s.durum, '—') || ' | ' ||
    COALESCE(to_char(s.created_at AT TIME ZONE 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI'), '—'),
    E'\n'
    ORDER BY s.created_at NULLS LAST, s.id
  ) AS kayitlar
FROM public.siparisler s
WHERE s.sno IS NOT NULL AND btrim(s.sno) <> ''
GROUP BY s.sno
HAVING COUNT(*) > 1
ORDER BY adet DESC, s.sno;

-- ═══════════════════════════════════════════════════════════════════════════
-- ADIM B — Çiftleri ayır (EN ESKİ kaydın sno'su kalır; yenilere -D2, -D3)
-- Örnek: SP446 + SP446  →  SP446 + SP446-D2
-- NOT: lot_no / notlarda metin olarak yazılmış eski sno referansları elle kontrol edilmeli.
-- Önce ADIM A sonucunu kaydedin / ekran görüntüsü alın.
-- ═══════════════════════════════════════════════════════════════════════════
/*
WITH ranked AS (
  SELECT
    id,
    sno,
    ROW_NUMBER() OVER (
      PARTITION BY sno
      ORDER BY created_at NULLS LAST, id
    ) AS rn
  FROM public.siparisler
  WHERE sno IS NOT NULL AND btrim(sno) <> ''
),
dupes AS (
  SELECT id, sno, rn FROM ranked WHERE rn > 1
)
UPDATE public.siparisler s
SET sno = d.sno || '-D' || d.rn::text
FROM dupes d
WHERE s.id = d.id;
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- ADIM C — Hız index'leri (çift varken UNIQUE kullanma)
-- ═══════════════════════════════════════════════════════════════════════════
-- updated_at yoksa ekle (siparisler_updated_at.sql ile aynı)
ALTER TABLE public.siparisler
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.siparisler
  ADD COLUMN IF NOT EXISTS updated_by text;
UPDATE public.siparisler
SET updated_at = COALESCE(updated_at, created_at, now())
WHERE updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_siparisler_sno
  ON public.siparisler (sno);

CREATE INDEX IF NOT EXISTS idx_siparisler_created_at
  ON public.siparisler (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_siparisler_updated_at
  ON public.siparisler (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_kumas_kutuphanesi_desen_kodu
  ON public.kumas_kutuphanesi (desen_kodu);

-- ═══════════════════════════════════════════════════════════════════════════
-- ADIM D — Çiftler bittikten sonra UNIQUE (tekrar oluşmayı DB'de engeller)
-- ADIM B yorumunu kaldırıp çalıştırdıktan / elle düzelttikten sonra:
-- ═══════════════════════════════════════════════════════════════════════════
/*
DROP INDEX IF EXISTS idx_siparisler_sno;
CREATE UNIQUE INDEX IF NOT EXISTS idx_siparisler_sno
  ON public.siparisler (sno);
*/
