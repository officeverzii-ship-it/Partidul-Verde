CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'membru') ON CONFLICT(user_id,role) DO NOTHING; RETURN NEW; END; $$;
CREATE OR REPLACE FUNCTION public.start_newsletter_signup(_email text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE t uuid; BEGIN UPDATE public.contacts SET newsletter_confirm_token=COALESCE(newsletter_confirm_token,gen_random_uuid()),updated_at=now() WHERE email=lower(trim(_email)) AND newsletter_confirmed=false RETURNING newsletter_confirm_token INTO t; RETURN t; END; $$;
REVOKE ALL ON FUNCTION public.start_newsletter_signup(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.start_newsletter_signup(text) TO service_role;
CREATE OR REPLACE FUNCTION public.upsert_contact(_email text,_full_name text,_phone text DEFAULT NULL,_county text DEFAULT NULL,_source text DEFAULT 'import',_branch_id uuid DEFAULT NULL,_member_id uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE result uuid; staff boolean; BEGIN
IF _email IS NULL OR char_length(_email)>255 OR _email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR _full_name IS NULL OR char_length(trim(_full_name)) NOT BETWEEN 2 AND 100 OR char_length(COALESCE(_phone,''))>20 OR char_length(COALESCE(_county,''))>50 THEN RAISE EXCEPTION 'Date de contact invalide'; END IF;
staff:=public.has_role(auth.uid(),'admin_national') OR (public.has_role(auth.uid(),'admin_filiala') AND _branch_id=public.user_branch(auth.uid()));
IF staff THEN
INSERT INTO public.contacts(email,full_name,phone,county,source,branch_id,member_id) VALUES(lower(trim(_email)),trim(_full_name),_phone,_county,_source,_branch_id,_member_id) ON CONFLICT(email) DO UPDATE SET full_name=EXCLUDED.full_name,phone=COALESCE(EXCLUDED.phone,contacts.phone),county=COALESCE(EXCLUDED.county,contacts.county),branch_id=COALESCE(EXCLUDED.branch_id,contacts.branch_id),member_id=COALESCE(EXCLUDED.member_id,contacts.member_id),updated_at=now() WHERE public.has_role(auth.uid(),'admin_national') OR contacts.branch_id=public.user_branch(auth.uid()) RETURNING id INTO result;
RETURN result;
END IF;
IF _source NOT IN ('newsletter','adeziune','voluntar','eveniment','contact') OR _member_id IS NOT NULL THEN RAISE EXCEPTION 'Acțiune nepermisă'; END IF;
INSERT INTO public.contacts(email,full_name,phone,county,source,branch_id) VALUES(lower(trim(_email)),trim(_full_name),_phone,_county,_source,_branch_id) ON CONFLICT(email) DO NOTHING;
RETURN NULL;
END; $$;
REVOKE ALL ON FUNCTION public.upsert_contact(text,text,text,text,text,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_contact(text,text,text,text,text,uuid,uuid) TO anon,authenticated,service_role;
ALTER POLICY "system inserts audit log" ON public.audit_log WITH CHECK (user_id=auth.uid() AND (public.has_role(auth.uid(),'admin_national') OR public.has_role(auth.uid(),'admin_filiala') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'coordonator_voluntari')));