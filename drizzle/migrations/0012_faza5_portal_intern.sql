
-- Documente și proceduri interne, cu vizibilitate pe rol și filială
CREATE TABLE public.portal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  min_role text NOT NULL DEFAULT 'membru' CHECK (min_role IN ('membru','staff','admin')),
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_documents TO authenticated;
GRANT ALL ON public.portal_documents TO service_role;
ALTER TABLE public.portal_documents ENABLE ROW LEVEL SECURITY;
-- Vizibil: orice membru autentificat; filtrul pe filială: document global sau al filialei utilizatorului;
-- min_role 'staff' cere un rol administrativ, 'admin' cere admin_national/admin_filiala
CREATE POLICY "members read visible documents" ON public.portal_documents FOR SELECT TO authenticated
USING (
  (branch_id IS NULL OR branch_id = public.user_branch(auth.uid()) OR public.has_role(auth.uid(),'admin_national'))
  AND (
    min_role = 'membru'
    OR (min_role = 'staff' AND (public.has_role(auth.uid(),'admin_national') OR public.has_role(auth.uid(),'admin_filiala') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'coordonator_voluntari')))
    OR (min_role = 'admin' AND (public.has_role(auth.uid(),'admin_national') OR public.has_role(auth.uid(),'admin_filiala')))
  )
);
CREATE POLICY "staff manage documents" ON public.portal_documents FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin_national') OR public.has_role(auth.uid(),'admin_filiala') OR public.has_role(auth.uid(),'editor'))
WITH CHECK (public.has_role(auth.uid(),'admin_national') OR public.has_role(auth.uid(),'admin_filiala') OR public.has_role(auth.uid(),'editor'));

-- Calendar intern
CREATE TABLE public.internal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  location text,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_events TO authenticated;
GRANT ALL ON public.internal_events TO service_role;
ALTER TABLE public.internal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read internal events" ON public.internal_events FOR SELECT TO authenticated
USING (branch_id IS NULL OR branch_id = public.user_branch(auth.uid()) OR public.has_role(auth.uid(),'admin_national'));
CREATE POLICY "staff manage internal events" ON public.internal_events FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin_national') OR public.has_role(auth.uid(),'admin_filiala') OR public.has_role(auth.uid(),'coordonator_voluntari'))
WITH CHECK (public.has_role(auth.uid(),'admin_national') OR public.has_role(auth.uid(),'admin_filiala') OR public.has_role(auth.uid(),'coordonator_voluntari'));

-- Forum: subiecte
CREATE TABLE public.forum_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  author_id uuid NOT NULL,
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_threads TO authenticated;
GRANT ALL ON public.forum_threads TO service_role;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read threads" ON public.forum_threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "members create threads" ON public.forum_threads FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "authors or moderators update threads" ON public.forum_threads FOR UPDATE TO authenticated
USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin_national') OR public.has_role(auth.uid(),'admin_filiala') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "moderators delete threads" ON public.forum_threads FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin_national') OR public.has_role(auth.uid(),'admin_filiala'));

-- Forum: răspunsuri (moderare prin hidden)
CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  body text NOT NULL,
  author_id uuid NOT NULL,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_posts TO authenticated;
GRANT ALL ON public.forum_posts TO service_role;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members read visible posts" ON public.forum_posts FOR SELECT TO authenticated
USING (NOT hidden OR author_id = auth.uid() OR public.has_role(auth.uid(),'admin_national') OR public.has_role(auth.uid(),'admin_filiala') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "members create posts" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "authors or moderators update posts" ON public.forum_posts FOR UPDATE TO authenticated
USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin_national') OR public.has_role(auth.uid(),'admin_filiala') OR public.has_role(auth.uid(),'editor'));
CREATE POLICY "moderators delete posts" ON public.forum_posts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin_national') OR public.has_role(auth.uid(),'admin_filiala'));

-- Mesagerie pe filiale (Realtime)
CREATE TABLE public.branch_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.branch_messages TO authenticated;
GRANT ALL ON public.branch_messages TO service_role;
ALTER TABLE public.branch_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch members read messages" ON public.branch_messages FOR SELECT TO authenticated
USING (branch_id = public.user_branch(auth.uid()) OR public.has_role(auth.uid(),'admin_national'));
CREATE POLICY "branch members send messages" ON public.branch_messages FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND (branch_id = public.user_branch(auth.uid()) OR public.has_role(auth.uid(),'admin_national')));
CREATE POLICY "authors delete own messages" ON public.branch_messages FOR DELETE TO authenticated
USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin_national') OR public.has_role(auth.uid(),'admin_filiala'));
ALTER PUBLICATION supabase_realtime ADD TABLE public.branch_messages;

-- Audit pe documente și moderare forum
CREATE TRIGGER audit_portal_documents AFTER INSERT OR UPDATE OR DELETE ON public.portal_documents FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_forum_threads AFTER INSERT OR UPDATE OR DELETE ON public.forum_threads FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_forum_posts AFTER INSERT OR UPDATE OR DELETE ON public.forum_posts FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
