-- erp_admin_user_save çift overload (5 ve 6 parametre) PostgREST hatasını giderir.
-- Supabase SQL Editor'da bir kez çalıştırın.

DROP FUNCTION IF EXISTS public.erp_admin_user_save(text, text, jsonb, boolean, text);
DROP FUNCTION IF EXISTS public.erp_admin_user_save(text, text, jsonb, boolean, text, text);

CREATE OR REPLACE FUNCTION public.erp_admin_user_save(
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
BEGIN
    IF NOT public.erp_is_admin_session(p_token) THEN
        RETURN jsonb_build_object('ok', false, 'err', 'forbidden');
    END IF;

    IF p_target_username IS NULL OR length(trim(p_target_username)) = 0 THEN
        RETURN jsonb_build_object('ok', false, 'err', 'validasyon');
    END IF;

    IF p_allowed_modes IS NULL OR jsonb_typeof(p_allowed_modes) <> 'array' THEN
        RETURN jsonb_build_object('ok', false, 'err', 'validasyon');
    END IF;

    IF p_role IS NOT NULL AND p_role NOT IN ('admin', 'user') THEN
        RETURN jsonb_build_object('ok', false, 'err', 'validasyon');
    END IF;

    SELECT u.username INTO v_caller_username
    FROM public.erp_users u
    INNER JOIN public.erp_sessions s ON s.user_id = u.id
    WHERE s.token = p_token
      AND s.expires_at > now()
    LIMIT 1;

    IF v_caller_username IS NOT NULL
       AND lower(v_caller_username) = lower(trim(p_target_username))
       AND p_role IS NOT NULL
       AND p_role <> 'admin' THEN
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

GRANT EXECUTE ON FUNCTION public.erp_admin_user_save(text, text, jsonb, boolean, text, text) TO anon, authenticated;
