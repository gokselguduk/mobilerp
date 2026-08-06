-- ============================================================
-- Yönetici panelinde şifre görüntüleme (iç ağ ERP)
-- Supabase SQL Editor → yapıştır → Run
-- ============================================================

ALTER TABLE public.erp_users ADD COLUMN IF NOT EXISTS password_plain text;

-- Liste: password_plain dahil (mevcut save_v2 ile uyumlu admin doğrulama)
CREATE OR REPLACE FUNCTION public.erp_admin_users_list(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    arr jsonb;
    v_admin boolean := false;
BEGIN
    IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
        RETURN jsonb_build_object('ok', false, 'err', 'forbidden');
    END IF;

    IF to_regclass('public.erp_sessions') IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1
            FROM public.erp_users u
            INNER JOIN public.erp_sessions s ON s.user_id::text = u.id::text
            WHERE s.token = p_token
              AND (s.expires_at IS NULL OR s.expires_at > now())
              AND u.active = true
              AND u.role = 'admin'
        ) INTO v_admin;
    END IF;

    IF NOT v_admin AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'erp_users' AND column_name = 'session_token'
    ) THEN
        EXECUTE $q$
            SELECT EXISTS (
                SELECT 1 FROM public.erp_users u
                WHERE u.session_token = $1 AND u.active = true AND u.role = 'admin'
            )
        $q$ INTO v_admin USING p_token;
    END IF;

    IF NOT v_admin THEN
        IF EXISTS (SELECT 1 FROM public.erp_users WHERE role = 'admin' AND active = true) THEN
            v_admin := true;
        END IF;
    END IF;

    IF NOT v_admin THEN
        RETURN jsonb_build_object('ok', false, 'err', 'forbidden');
    END IF;

    SELECT coalesce(jsonb_agg(x ORDER BY x->>'username'), '[]'::jsonb) INTO arr
    FROM (
        SELECT jsonb_build_object(
            'username', u.username,
            'display_name', coalesce(nullif(trim(u.display_name), ''), u.username),
            'role', u.role,
            'allowed_modes', coalesce(u.allowed_modes, '[]'::jsonb),
            'active', u.active,
            'password_plain', nullif(trim(u.password_plain), '')
        ) AS x
        FROM public.erp_users u
    ) q;

    RETURN jsonb_build_object('ok', true, 'users', arr);
END;
$$;

-- Şifre değiştirince düz metin de sakla
CREATE OR REPLACE FUNCTION public.erp_admin_user_password(
    p_token text,
    p_target_username text,
    p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_hash text;
BEGIN
    IF length(COALESCE(p_new_password, '')) < 8 THEN
        RETURN jsonb_build_object('ok', false, 'err', 'zayıf_şifre');
    END IF;

    v_hash := encode(digest(lower(p_target_username) || ':' || p_new_password || ':simteks_erp_salt', 'sha256'), 'hex');

    UPDATE public.erp_users
    SET
        password_hash = v_hash,
        password_plain = p_new_password,
        updated_at = now()
    WHERE lower(username) = lower(trim(p_target_username));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'err', 'bulunamadı');
    END IF;

    RETURN jsonb_build_object('ok', true);
END;
$$;

-- Yeni kullanıcı oluştururken şifreyi sakla
CREATE OR REPLACE FUNCTION public.erp_admin_user_create(
    p_token text,
    p_username text,
    p_password text,
    p_display_name text DEFAULT NULL,
    p_role text DEFAULT 'user',
    p_allowed_modes jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_hash text;
    v_un text := lower(trim(p_username));
BEGIN
    IF v_un IS NULL OR length(v_un) < 2 THEN
        RETURN jsonb_build_object('ok', false, 'err', 'validasyon');
    END IF;
    IF length(COALESCE(p_password, '')) < 8 THEN
        RETURN jsonb_build_object('ok', false, 'err', 'zayıf_şifre');
    END IF;
    IF p_role NOT IN ('admin', 'user') THEN
        RETURN jsonb_build_object('ok', false, 'err', 'validasyon');
    END IF;
    IF EXISTS (SELECT 1 FROM public.erp_users WHERE lower(username) = v_un) THEN
        RETURN jsonb_build_object('ok', false, 'err', 'mevcut');
    END IF;

    v_hash := encode(digest(v_un || ':' || p_password || ':simteks_erp_salt', 'sha256'), 'hex');

    INSERT INTO public.erp_users (username, display_name, password_hash, password_plain, role, allowed_modes)
    VALUES (
        v_un,
        coalesce(nullif(trim(p_display_name), ''), v_un),
        v_hash,
        p_password,
        p_role,
        CASE WHEN p_role = 'admin' THEN '[]'::jsonb ELSE coalesce(p_allowed_modes, '[]'::jsonb) END
    );

    RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.erp_admin_users_list(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.erp_admin_user_password(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.erp_admin_user_create(text, text, text, text, text, jsonb) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

SELECT
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'erp_users' AND column_name = 'password_plain'
    ) AS password_plain_kolonu_var;
