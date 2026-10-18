CREATE OR REPLACE FUNCTION public.admin_access_list(_search text DEFAULT '', _page integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
 IF NOT public.has_role(auth.uid(), 'admin_national') THEN RAISE EXCEPTION 'Acces permis doar Adminului Național'; END IF;
 IF _page < 0 OR char_length(_search) > 100 THEN RAISE EXCEPTION 'Căutare invalidă'; END IF;
 SELECT jsonb_build_object('users', COALESCE((SELECT jsonb_agg(x) FROM (
 SELECT u.id, u.email, COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.id,'role',r.role,'branch_id',r.branch_id)) FROM public.user_roles r WHERE r.user_id=u.id),'[]'::jsonb) AS roles
 FROM auth.users u WHERE position(lower(_search) in lower(COALESCE(u.email,''))) > 0 ORDER BY u.email LIMIT 20 OFFSET _page*20) x),'[]'::jsonb),
 'count',(SELECT count(*) FROM auth.users u WHERE position(lower(_search) in lower(COALESCE(u.email,''))) > 0),
 'branches',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',b.id,'name',b.name,'county',b.county)) FROM public.branches b),'[]'::jsonb)) INTO result;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.admin_access_list(text,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_access_list(text,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_admin_access_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP IN ('DELETE','UPDATE') AND OLD.role = 'admin_national' AND (TG_OP = 'DELETE' OR NEW.role <> 'admin_national' OR NEW.user_id <> OLD.user_id) THEN
  PERFORM pg_advisory_xact_lock(7821001);
  IF OLD.user_id = auth.uid() THEN RAISE EXCEPTION 'Nu îți poți retrage propriul rol de Admin Național'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role='admin_national' AND id<>OLD.id) THEN RAISE EXCEPTION 'Trebuie păstrat cel puțin un Admin Național'; END IF;
 END IF;
 IF TG_OP <> 'DELETE' AND NEW.role='admin_filiala' AND NEW.branch_id IS NULL THEN RAISE EXCEPTION 'Selectează filiala pentru Adminul de Filială'; END IF;
 IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER guard_admin_access_change BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.guard_admin_access_change();

CREATE OR REPLACE FUNCTION public.admin_access_change(_email text, _role public.app_role, _branch_id uuid DEFAULT NULL, _remove boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target uuid;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin_national') THEN RAISE EXCEPTION 'Acces permis doar Adminului Național'; END IF;
 IF char_length(_email)>255 THEN RAISE EXCEPTION 'Email invalid'; END IF;
 SELECT id INTO target FROM auth.users WHERE lower(email)=lower(trim(_email));
 IF target IS NULL THEN RAISE EXCEPTION 'Contul nu există. Persoana trebuie să se înregistreze mai întâi'; END IF;
 IF _remove THEN
  DELETE FROM public.user_roles WHERE user_id=target AND role=_role;
 ELSE
  IF _role='admin_filiala' AND (_branch_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.branches WHERE id=_branch_id)) THEN RAISE EXCEPTION 'Selectează o filială validă'; END IF;
  INSERT INTO public.user_roles(user_id,role,branch_id) VALUES(target,_role,CASE WHEN _role='admin_filiala' THEN _branch_id ELSE NULL END)
  ON CONFLICT(user_id,role) DO UPDATE SET branch_id=EXCLUDED.branch_id;
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.admin_access_change(text,public.app_role,uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_access_change(text,public.app_role,uuid,boolean) TO authenticated;