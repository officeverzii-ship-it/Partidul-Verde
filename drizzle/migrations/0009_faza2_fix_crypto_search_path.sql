CREATE OR REPLACE FUNCTION public.encrypt_sensitive(p_text text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE k text;
BEGIN
  SELECT value INTO k FROM public.app_secrets WHERE key = 'sensitive_encryption_key';
  IF k IS NULL THEN RAISE EXCEPTION 'Cheia de criptare lipseste'; END IF;
  RETURN extensions.pgp_sym_encrypt(p_text, k);
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_sensitive(p_cipher bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE k text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin_national') THEN
    RAISE EXCEPTION 'Acces interzis';
  END IF;
  SELECT value INTO k FROM public.app_secrets WHERE key = 'sensitive_encryption_key';
  IF k IS NULL THEN RAISE EXCEPTION 'Cheia de criptare lipseste'; END IF;
  RETURN extensions.pgp_sym_decrypt(p_cipher, k);
END;
$function$;