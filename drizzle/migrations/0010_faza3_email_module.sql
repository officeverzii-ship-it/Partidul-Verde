CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin editor manage templates" ON public.email_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_national') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_national') OR public.has_role(auth.uid(), 'editor'));

CREATE TABLE public.email_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_segments TO authenticated;
GRANT ALL ON public.email_segments TO service_role;
ALTER TABLE public.email_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin editor manage segments" ON public.email_segments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_national') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_national') OR public.has_role(auth.uid(), 'editor'));

CREATE TABLE public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  segment_id uuid REFERENCES public.email_segments(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'ciorna',
  scheduled_at timestamptz,
  sent_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaigns TO authenticated;
GRANT ALL ON public.email_campaigns TO service_role;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin editor manage campaigns" ON public.email_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin_national') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_national') OR public.has_role(auth.uid(), 'editor'));

CREATE TABLE public.email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  email text NOT NULL,
  subject text,
  template_name text,
  status text NOT NULL DEFAULT 'queued',
  resend_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_messages TO authenticated;
GRANT ALL ON public.email_messages TO service_role;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read messages" ON public.email_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin_national') OR public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin_filiala'));
CREATE POLICY "admin editor write messages" ON public.email_messages FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin_national') OR public.has_role(auth.uid(), 'editor'));
CREATE POLICY "admin editor update messages" ON public.email_messages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin_national') OR public.has_role(auth.uid(), 'editor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin_national') OR public.has_role(auth.uid(), 'editor'));

CREATE TABLE public.email_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_suppressions TO authenticated;
GRANT ALL ON public.email_suppressions TO service_role;
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read suppressions" ON public.email_suppressions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin_national') OR public.has_role(auth.uid(), 'editor'));

ALTER TABLE public.contacts ADD COLUMN unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.contacts ADD COLUMN newsletter_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE public.contacts ADD COLUMN newsletter_confirm_token uuid;

CREATE OR REPLACE FUNCTION public.unsubscribe_email(_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _email text;
BEGIN
  UPDATE public.contacts SET newsletter_confirmed = false, updated_at = now()
  WHERE unsubscribe_token = _token
  RETURNING email INTO _email;
  IF _email IS NULL THEN RETURN false; END IF;
  INSERT INTO public.email_suppressions (email, reason) VALUES (_email, 'dezabonare')
  ON CONFLICT (email) DO NOTHING;
  RETURN true;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.unsubscribe_email(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.confirm_newsletter(_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.contacts SET newsletter_confirmed = true, newsletter_confirm_token = NULL, updated_at = now()
  WHERE newsletter_confirm_token = _token;
  RETURN FOUND;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.confirm_newsletter(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.start_newsletter_signup(_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _token uuid;
BEGIN
  _token := gen_random_uuid();
  UPDATE public.contacts
  SET newsletter_confirm_token = _token, newsletter_confirmed = false, updated_at = now()
  WHERE email = lower(_email);
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN _token;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.start_newsletter_signup(text) TO anon, authenticated;