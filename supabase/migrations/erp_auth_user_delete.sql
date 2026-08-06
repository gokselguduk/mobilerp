-- ============================================================
-- Kullanıcı silme (yönetici paneli)
-- Supabase SQL Editor → yapıştır → Run
-- ============================================================

CREATE OR REPLACE FUNCTION public.erp_admin_user_delete(
    p_token text,
    p_target_username text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_username text;
    v_target_role text;
    v_admin_count int;
BEGIN
    IF p_target_username IS NULL OR length(trim(p_target_username)) = 0 THEN
        RETURN jsonb_build_object('ok', false, 'err', 'validasyon');
    END IF;

    -- Admin oturum doğrulama (save_v2 ile uyumlu)
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

    IF v_caller_username IS NOT NULL
       AND lower(v_caller_username) = lower(trim(p_target_username)) THEN
        RETURN jsonb_build_object('ok', false, 'err', 'kendi_hesap');
    END IF;

    SELECT role INTO v_target_role
    FROM public.erp_users
    WHERE lower(username) = lower(trim(p_target_username))
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'err', 'bulunamadı');
    END IF;

    IF v_target_role = 'admin' THEN
        SELECT count(*)::int INTO v_admin_count
        FROM public.erp_users
        WHERE role = 'admin' AND active = true;
        IF v_admin_count <= 1 THEN
            RETURN jsonb_build_object('ok', false, 'err', 'son_yonetici');
        END IF;
    END IF;

    IF to_regclass('public.erp_sessions') IS NOT NULL THEN
        DELETE FROM public.erp_sessions s
        USING public.erp_users u
        WHERE s.user_id::text = u.id::text
          AND lower(u.username) = lower(trim(p_target_username));
    END IF;

    DELETE FROM public.erp_users
    WHERE lower(username) = lower(trim(p_target_username));

    RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.erp_admin_user_delete(text, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'erp_admin_user_delete'
) AS delete_rpc_var;
