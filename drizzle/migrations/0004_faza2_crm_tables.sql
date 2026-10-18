CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Cheie de criptare pentru date sensibile, accesibilă doar rolului de serviciu
CREATE TABLE public.app_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_secrets TO service_role;
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;
INSERT INTO public.app_secrets (key, value) VALUES ('sensitive_encryption_key', encode(gen_random_bytes(32), 'hex'));

-- Contacte CRM: toate persoanele (membri, voluntari, simpatizanți, abonați)
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  county text,
  city text,
  source text NOT NULL DEFAULT 'manual',
  tags text[] NOT NULL DEFAULT '{}',
  member_id uuid,
  branch_id uuid REFERENCES public.branches(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read contacts" ON public.contacts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin_national'::app_role) OR (has_role(auth.uid(), 'admin_filiala'::app_role) AND (branch_id = user_branch(auth.uid()))));
CREATE POLICY "staff insert contacts" ON public.contacts FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin_national'::app_role) OR (has_role(auth.uid(), 'admin_filiala'::app_role) AND (branch_id = user_branch(auth.uid()))));
CREATE POLICY "staff update contacts" ON public.contacts FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin_national'::app_role) OR (has_role(auth.uid(), 'admin_filiala'::app_role) AND (branch_id = user_branch(auth.uid()))));
CREATE POLICY "staff delete contacts" ON public.contacts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin_national'::app_role));
CREATE POLICY "public upsert contacts" ON public.contacts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "public touch contacts" ON public.contacts FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Înscrieri la evenimente
CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  gdpr_consent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'nou',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_registrations TO authenticated;
GRANT INSERT ON public.event_registrations TO anon;
GRANT ALL ON public.event_registrations TO service_role;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public register event" ON public.event_registrations FOR INSERT TO anon, authenticated WITH CHECK (status = 'nou' AND gdpr_consent = true);
CREATE POLICY "staff read registrations" ON public.event_registrations FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin_national'::app_role) OR has_role(auth.uid(), 'editor'::app_role) OR has_role(auth.uid(), 'admin_filiala'::app_role));
CREATE POLICY "staff manage registrations" ON public.event_registrations FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin_national'::app_role) OR has_role(auth.uid(), 'admin_filiala'::app_role));
CREATE POLICY "staff delete registrations" ON public.event_registrations FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin_national'::app_role));

-- Sarcini (task management)
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assignee uuid,
  branch_id uuid REFERENCES public.branches(id),
  due_date date,
  status text NOT NULL DEFAULT 'de_facut',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff manage tasks" ON public.tasks FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin_national'::app_role) OR (has_role(auth.uid(), 'admin_filiala'::app_role) AND (branch_id = user_branch(auth.uid()))) OR has_role(auth.uid(), 'coordonator_voluntari'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin_national'::app_role) OR (has_role(auth.uid(), 'admin_filiala'::app_role) AND (branch_id = user_branch(auth.uid()))) OR has_role(auth.uid(), 'coordonator_voluntari'::app_role));

-- Cotizații
CREATE TABLE public.dues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  year int NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'neplatita',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, year)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dues TO authenticated;
GRANT ALL ON public.dues TO service_role;
ALTER TABLE public.dues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage dues" ON public.dues FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin_national'::app_role) OR (has_role(auth.uid(), 'admin_filiala'::app_role) AND (EXISTS (SELECT 1 FROM public.members m WHERE m.id = member_id AND m.branch_id = user_branch(auth.uid()))))) WITH CHECK (has_role(auth.uid(), 'admin_national'::app_role) OR (has_role(auth.uid(), 'admin_filiala'::app_role) AND (EXISTS (SELECT 1 FROM public.members m WHERE m.id = member_id AND m.branch_id = user_branch(auth.uid())))));

-- Date sensibile criptate (CNP, adresă completă) — vizibile doar prin funcția de decriptare
ALTER TABLE public.members ADD COLUMN cnp_encrypted bytea;
ALTER TABLE public.members ADD COLUMN address_encrypted bytea;

CREATE OR REPLACE FUNCTION public.encrypt_sensitive(p_text text)
RETURNS bytea LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE k text;
BEGIN
  IF p_text IS NULL OR p_text = '' THEN RETURN NULL; END IF;
  SELECT value INTO k FROM public.app_secrets WHERE key = 'sensitive_encryption_key';
  RETURN pgp_sym_encrypt(p_text, k);
END $$;

CREATE OR REPLACE FUNCTION public.decrypt_sensitive(p_cipher bytea)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE k text;
BEGIN
  IF p_cipher IS NULL THEN RETURN NULL; END IF;
  IF NOT has_role(auth.uid(), 'admin_national'::app_role) THEN RAISE EXCEPTION 'Acces interzis'; END IF;
  SELECT value INTO k FROM public.app_secrets WHERE key = 'sensitive_encryption_key';
  RETURN pgp_sym_decrypt(p_cipher, k);
END $$;

REVOKE ALL ON FUNCTION public.encrypt_sensitive(text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.decrypt_sensitive(bytea) FROM anon;
GRANT EXECUTE ON FUNCTION public.encrypt_sensitive(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_sensitive(bytea) TO authenticated;

-- Double opt-in pentru adeziuni
ALTER TABLE public.members ADD COLUMN email_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE public.members ADD COLUMN confirm_token uuid DEFAULT gen_random_uuid();

-- Trigger de audit pentru modificări de membri și schimbări de roluri
CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, table_name, record_id)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id));
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER audit_members_change AFTER INSERT OR UPDATE OR DELETE ON public.members FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_roles_change AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();