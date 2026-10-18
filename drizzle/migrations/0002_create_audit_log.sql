CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_log TO authenticated;
GRANT INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "national reads audit log"
ON public.audit_log FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin_national'::app_role));

CREATE POLICY "system inserts audit log"
ON public.audit_log FOR INSERT TO authenticated
WITH CHECK (true);