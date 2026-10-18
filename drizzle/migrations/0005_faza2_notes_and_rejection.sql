ALTER TABLE public.members ADD COLUMN rejection_reason text;

CREATE TABLE public.contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  author_id uuid,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.contact_notes TO authenticated;
GRANT ALL ON public.contact_notes TO service_role;
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read notes" ON public.contact_notes FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin_national'::app_role) OR has_role(auth.uid(), 'admin_filiala'::app_role) OR has_role(auth.uid(), 'coordonator_voluntari'::app_role));
CREATE POLICY "staff add notes" ON public.contact_notes FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin_national'::app_role) OR has_role(auth.uid(), 'admin_filiala'::app_role) OR has_role(auth.uid(), 'coordonator_voluntari'::app_role));
CREATE POLICY "staff delete own notes" ON public.contact_notes FOR DELETE TO authenticated USING (author_id = auth.uid() OR has_role(auth.uid(), 'admin_national'::app_role));