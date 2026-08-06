-- ============================================================
-- Simteks ERP — oturum, kullanıcı, rol ve mod erişimi
-- ÖNEMLİ: Anon key ile istemci hâlâ API'ye ulaşır; üretimde iş
-- tablolarınız için Row Level Security (RLS) politikaları ekleyin.
-- ============================================================
--
-- ▼▼▼ SUPABASE’TE NASIL ÇALIŞTIRILIR (SQL Editor) ▼▼▼
--
-- 1) Tarayıcıda: https://supabase.com/dashboard → projenizi seçin.
-- 2) Sol menüden "SQL Editor" (veya "SQL") açın.
-- 3) "New query" / "+ New snippet" ile boş bir sorgu açın.
-- 4) Bu dosyanın TAMAMINI seçip kopyalayın (Ctrl+A, Ctrl+C).
--    Dosya yolu (Cursor/VS Code): supabase/migrations/erp_auth.sql
--    Windows Gezgini’nden açmak için proje klasörünüze gidin.
-- 5) Editöre yapıştırın (Ctrl+V), sağ altta veya üstte "Run" / "Çalıştır"a tıklayın.
--    Başarılı olunca yeşil onay veya "Success" görünür.
-- 6) Aşağıdaki INSERT satırlarının başındaki -- işaretlerini kaldırın,
--    BURAYA_GÜÇLÜ_ŞİFRE yerine kendi şifrenizi yazın, tekrar Run edin.
--
-- Hata alırsanız:
-- • "permission denied" → Proje sahibi hesabıyla giriş yaptığınızdan emin olun.
-- • "already exists" → Tablolar varsa sorun değil; script tekrar çalıştırılabilir.
-- • Parça parça: Önce 8–33 satır (tablolar), sonra fonksiyonlar (37–301), en son GRANT (303–310).
--
-- ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲ ▲▲▲
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.erp_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text NOT NULL UNIQUE,
    display_name text,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    allowed_modes jsonb NOT NULL DEFAULT '[]'::jsonb,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.erp_sessions (
    token text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.erp_users(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_erp_sessions_user ON public.erp_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_sessions_expires ON public.erp_sessions(expires_at);

ALTER TABLE public.erp_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.erp_sessions ENABLE ROW LEVEL SECURITY;

-- Doğrudan tablo okuması yok; yalnızca SECURITY DEFINER fonksiyonlar

CREATE OR REPLACE FUNCTION public.erp_is_admin_session(p_token text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.erp_users u
        INNER JOIN public.erp_sessions s ON s.user_id = u.id
        WHERE s.token = p_token
          AND s.expires_at > now()
          AND u.active = true
          AND u.role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.erp_login(p_username text, p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r public.erp_users%ROWTYPE;
    tok text;
BEGIN
    DELETE FROM public.erp_sessions WHERE expires_at < now();

    IF p_username IS NULL OR length(trim(p_username)) = 0 THEN
        RETURN jsonb_build_object('ok', false, 'err', 'validasyon');
    END IF;

    SELECT * INTO r
    FROM public.erp_users
    WHERE lower(username) = lower(trim(p_username))
      AND active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'err', 'auth');
    END IF;

    IF r.password_hash = crypt(COALESCE(p_password, ''), r.password_hash) THEN
        tok := encode(gen_random_bytes(32), 'hex');
        INSERT INTO public.erp_sessions (token, user_id, expires_at)
        VALUES (tok, r.id, now() + interval '8 days');
        RETURN jsonb_build_object(
            'ok', true,
            'token', tok,
            'user', jsonb_build_object(
                'username', r.username,
                'display_name', COALESCE(nullif(trim(r.display_name), ''), r.username),
                'role', r.role,
                'allowed_modes', COALESCE(r.allowed_modes, '[]'::jsonb)
            )
        );
    END IF;

    RETURN jsonb_build_object('ok', false, 'err', 'auth');
END;
$$;

CREATE OR REPLACE FUNCTION public.erp_session_me(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r public.erp_users%ROWTYPE;
BEGIN
    IF p_token IS NULL OR length(p_token) < 16 THEN
        RETURN jsonb_build_object('ok', false);
    END IF;

    SELECT u.* INTO r
    FROM public.erp_users u
    INNER JOIN public.erp_sessions s ON s.user_id = u.id
    WHERE s.token = p_token
      AND s.expires_at > now()
      AND u.active = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false);
    END IF;

    RETURN jsonb_build_object(
        'ok', true,
        'user', jsonb_build_object(
            'username', r.username,
            'display_name', COALESCE(nullif(trim(r.display_name), ''), r.username),
            'role', r.role,
            'allowed_modes', COALESCE(r.allowed_modes, '[]'::jsonb)
        )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.erp_logout(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_token IS NOT NULL AND length(p_token) > 0 THEN
        DELETE FROM public.erp_sessions WHERE token = p_token;
    END IF;
    RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.erp_admin_users_list(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    arr jsonb;
BEGIN
    IF NOT public.erp_is_admin_session(p_token) THEN
        RETURN jsonb_build_object('ok', false, 'err', 'forbidden');
    END IF;

    SELECT coalesce(jsonb_agg(x ORDER BY x->>'username'), '[]'::jsonb) INTO arr
    FROM (
        SELECT jsonb_build_object(
            'username', u.username,
            'display_name', coalesce(nullif(trim(u.display_name), ''), u.username),
            'role', u.role,
            'allowed_modes', coalesce(u.allowed_modes, '[]'::jsonb),
            'active', u.active
        ) AS x
        FROM public.erp_users u
    ) q;

    RETURN jsonb_build_object('ok', true, 'users', arr);
END;
$$;

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

CREATE OR REPLACE FUNCTION public.erp_admin_user_password(
    p_token text,
    p_target_username text,
    p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.erp_is_admin_session(p_token) THEN
        RETURN jsonb_build_object('ok', false, 'err', 'forbidden');
    END IF;

    IF p_new_password IS NULL OR length(p_new_password) < 8 THEN
        RETURN jsonb_build_object('ok', false, 'err', 'zayıf_şifre');
    END IF;

    UPDATE public.erp_users
    SET
        password_hash = crypt(p_new_password, gen_salt('bf')),
        updated_at = now()
    WHERE lower(username) = lower(trim(p_target_username));

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'err', 'bulunamadı');
    END IF;

    RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.erp_admin_user_create(
    p_token text,
    p_username text,
    p_password text,
    p_display_name text,
    p_role text,
    p_allowed_modes jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.erp_is_admin_session(p_token) THEN
        RETURN jsonb_build_object('ok', false, 'err', 'forbidden');
    END IF;

    IF p_username IS NULL OR length(trim(p_username)) < 2 THEN
        RETURN jsonb_build_object('ok', false, 'err', 'validasyon');
    END IF;
    IF p_password IS NULL OR length(p_password) < 8 THEN
        RETURN jsonb_build_object('ok', false, 'err', 'zayıf_şifre');
    END IF;
    IF p_role IS NULL OR p_role NOT IN ('admin', 'user') THEN
        RETURN jsonb_build_object('ok', false, 'err', 'validasyon');
    END IF;
    IF p_allowed_modes IS NULL OR jsonb_typeof(p_allowed_modes) <> 'array' THEN
        RETURN jsonb_build_object('ok', false, 'err', 'validasyon');
    END IF;

    INSERT INTO public.erp_users (username, display_name, password_hash, role, allowed_modes)
    VALUES (
        lower(trim(p_username)),
        coalesce(nullif(trim(p_display_name), ''), trim(p_username)),
        crypt(p_password, gen_salt('bf')),
        p_role,
        p_allowed_modes
    );

    RETURN jsonb_build_object('ok', true);
EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('ok', false, 'err', 'kullanıcı_var');
END;
$$;

GRANT EXECUTE ON FUNCTION public.erp_is_admin_session(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.erp_login(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.erp_session_me(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.erp_logout(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.erp_admin_users_list(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.erp_admin_user_save(text, text, jsonb, boolean, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.erp_admin_user_password(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.erp_admin_user_create(text, text, text, text, text, jsonb) TO anon, authenticated;

-- İlk yönetici: yukarıdaki script başarılı olduktan SONRA bu 5 satırın
-- başındaki -- kaldırıp şifreyi değiştirin ve TEKRAR Run edin.
--
-- INSERT INTO public.erp_users (username, display_name, password_hash, role, allowed_modes)
-- VALUES (
--   'admin',
--   'Yönetici',
--   crypt('BURAYA_GÜÇLÜ_ŞİFRE', gen_salt('bf')),
--   'admin',
--   '[]'::jsonb
-- );
