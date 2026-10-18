CREATE OR REPLACE FUNCTION public.upsert_contact(
  _email text,
  _full_name text,
  _phone text DEFAULT NULL,
  _county text DEFAULT NULL,
  _source text DEFAULT 'import',
  _branch_id uuid DEFAULT NULL,
  _member_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _id uuid;
BEGIN
  INSERT INTO public.contacts (email, full_name, phone, county, source, branch_id, member_id)
  VALUES (lower(_email), _full_name, _phone, _county, _source, _branch_id, _member_id)
  ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = COALESCE(EXCLUDED.phone, contacts.phone),
    county = COALESCE(EXCLUDED.county, contacts.county),
    branch_id = COALESCE(EXCLUDED.branch_id, contacts.branch_id),
    member_id = COALESCE(EXCLUDED.member_id, contacts.member_id),
    updated_at = now()
  RETURNING id INTO _id;
  RETURN _id;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.upsert_contact(text, text, text, text, text, uuid, uuid) TO anon, authenticated, service_role;
REVOKE INSERT, UPDATE ON public.contacts FROM anon;
DROP POLICY IF EXISTS "public upsert contacts" ON public.contacts;
DROP POLICY IF EXISTS "public touch contacts" ON public.contacts;