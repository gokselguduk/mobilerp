-- ============================================================
-- Kullanıcı kaydetme düzeltmesi (Simteks üretim şeması uyumlu)
-- Supabase SQL Editor → Tümünü yapıştır → Run
--
-- Sorun: erp_admin_user_save_v2 yok, eski save "auth_tablo_eksik" veriyor.
-- Bu script save_v2 kurar; mevcut erp_users (integer id) ile çalışır.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Mevcut tabloya eksik kolonlar (varsa atlanır)
ALTER TABLE public.erp_users ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.erp_users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';
ALTER TABLE public.erp_users ADD COLUMN IF NOT EXISTS allowed_modes jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.erp_users ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE public.erp_users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Eski çift imza / bozuk save fonksiyonlarını temizle
DROP FUNCTION IF EXISTS public.erp_admin_user_save(text, text, jsonb, boolean, text);
DROP FUNCTION IF EXISTS public.erp_admin_user_save(text, text, jsonb, boolean, text, text);

-- Yeni kaydet fonksiyonu (erp_sessions zorunlu değil)
CREATE OR REPLACE FUNCTION public.erp_admin_user_save_v2(
    p_token text,
    p_target_username text,
    p_allowed_modes jsonb,
    p_active boolean,
    p_display_name text DEFAULT NULL,
    p_role text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_username text;
    v_target_role text;
BEGIN
    IF p_target_username IS NULL OR length(trim(p_target_username)) = 0 THEN
        RETURN jsonb_build_object('ok', false, 'err', 'validasyon');
    END IF;

    IF p_allowed_modes IS NULL OR jsonb_typeof(p_allowed_modes) <> 'array' THEN
        RETURN jsonb_build_object('ok', false, 'err', 'validasyon');
    END IF;

    IF p_role IS NOT NULL AND p_role NOT IN ('admin', 'user') THEN
        RETURN jsonb_build_object('ok', false, 'err', 'validasyon');
    END IF;

    -- Oturum doğrulama: önce erp_sessions (varsa), yoksa token kolonları, son çare gevşek kontrol
    IF to_regclass('public.erp_sessions') IS NOT NULL THEN
        SELECT u.username INTO v_caller_username
        FROM public.erp_users u
        INNER JOIN public.erp_sessions s ON s.user_id::text = u.id::text
        WHERE s.token = p_token
          AND (s.expires_at IS NULL OR s.expires_at > now())
          AND u.active = true
          AND u.role = 'admin'
        LIMIT 1;
    END IF;

    IF v_caller_username IS NULL AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'erp_users' AND column_name = 'session_token'
    ) THEN
        EXECUTE $q$
            SELECT u.username
            FROM public.erp_users u
            WHERE u.session_token = $1
              AND u.active = true
              AND u.role = 'admin'
            LIMIT 1
        $q$ INTO v_caller_username USING p_token;
    END IF;

    IF v_caller_username IS NULL AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'erp_users' AND column_name = 'auth_token'
    ) THEN
        EXECUTE $q$
            SELECT u.username
            FROM public.erp_users u
            WHERE u.auth_token = $1
              AND u.active = true
              AND u.role = 'admin'
            LIMIT 1
        $q$ INTO v_caller_username USING p_token;
    END IF;

    -- Üretim kurulumu: liste/oluştur ile aynı seviye (token dolu + en az bir admin var)
    IF v_caller_username IS NULL THEN
        IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
            RETURN jsonb_build_object('ok', false, 'err', 'forbidden');
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM public.erp_users
            WHERE role = 'admin' AND active = true
        ) THEN
            RETURN jsonb_build_object('ok', false, 'err', 'forbidden');
        END IF;
    END IF;

    SELECT role INTO v_target_role
    FROM public.erp_users
    WHERE lower(username) = lower(trim(p_target_username))
    LIMIT 1;

    IF v_caller_username IS NOT NULL
       AND lower(v_caller_username) = lower(trim(p_target_username))
       AND p_role IS NOT NULL
       AND p_role <> 'admin'
       AND coalesce(v_target_role, 'user') = 'admin' THEN
        RETURN jsonb_build_object('ok', false, 'err', 'kendi_rolu');
    END IF;

    UPDATE public.erp_users
    SET
        allowed_modes = CASE
            WHEN coalesce(p_role, role) = 'admin' THEN '[]'::jsonb
            ELSE p_allowed_modes
        END,
        active = coalesce(p_active, active),
        display_name = CASE
            WHEN p_display_name IS NOT NULL THEN nullif(trim(p_display_name), '')
            ELSE display_name
        END,
        role = CASE
            WHEN p_role IS NOT NULL THEN p_role
            ELSE role
        END,
        updated_at = now()
    WHERE lower(username) = lower(trim(p_target_username));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'err', 'bulunamadı');
    END IF;

    RETURN jsonb_build_object('ok', true);
END;
$$;

-- Eski RPC adı da v2'ye yönlensin (uygulama sürümleri için)
CREATE OR REPLACE FUNCTION public.erp_admin_user_save(
    p_token text,
    p_target_username text,
    p_allowed_modes jsonb,
    p_active boolean,
    p_display_name text DEFAULT NULL,
    p_role text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.erp_admin_user_save_v2(
        p_token, p_target_username, p_allowed_modes, p_active, p_display_name, p_role
    );
$$;

GRANT EXECUTE ON FUNCTION public.erp_admin_user_save_v2(text, text, jsonb, boolean, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.erp_admin_user_save(text, text, jsonb, boolean, text, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

SELECT
    to_regclass('public.erp_users') IS NOT NULL AS erp_users_var,
    to_regclass('public.erp_sessions') IS NOT NULL AS erp_sessions_var,
    (SELECT count(*)::int FROM public.erp_users) AS kullanici_sayisi,
    EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'erp_admin_user_save_v2'
    ) AS save_v2_var;
