-- Fix: "function digest(text, unknown) does not exist"
-- Amaç: pgcrypto extension + erp_admin_user_password fonksiyonunu güvenli şekilde yeniden oluşturma

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.erp_admin_user_password(
  p_token           text,
  p_target_username text,
  p_new_password    text
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
    RETURN jsonb_build_object('ok', false, 'err', 'Şifre en az 8 karakter olmalı');
  END IF;

  -- Mevcut sistem hash formatı ile uyumlu
  v_hash := encode(digest(lower(p_target_username) || ':' || p_new_password || ':simteks_erp_salt', 'sha256'), 'hex');

  UPDATE public.erp_users
  SET
    password_hash = v_hash
  WHERE lower(username) = lower(trim(p_target_username));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'err', 'Kullanıcı bulunamadı');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.erp_admin_user_password(text, text, text) TO anon, authenticated;
