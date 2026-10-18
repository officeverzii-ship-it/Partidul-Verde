
-- Acces portal: membri aprobați (după email) sau roluri administrative
CREATE OR REPLACE FUNCTION public.portal_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id,'admin_national')
    OR public.has_role(_user_id,'admin_filiala')
    OR public.has_role(_user_id,'editor')
    OR public.has_role(_user_id,'coordonator_voluntari')
    OR EXISTS (
      SELECT 1 FROM public.members m
      JOIN auth.users u ON u.id = _user_id
      WHERE lower(m.email) = lower(u.email) AND m.status = 'aprobat'
    );
$$;
REVOKE ALL ON FUNCTION public.portal_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.portal_access(uuid) TO authenticated;

-- Restricționează tabelele portalului la utilizatorii cu acces
DROP POLICY "members read visible documents" ON public.portal_documents;
CREATE POLICY "members read visible documents" ON public.portal_documents FOR SELECT TO authenticated
USING (public.portal_access(auth.uid()) AND (
  (branch_id IS NULL OR branch_id = public.user_branch(auth.uid()) OR public.has_role(auth.uid(),'admin_national'))
  AND (
    min_role = 'membru'
    OR (min_role = 'staff' AND (public.has_role(auth.uid(),'admin_national') OR public.has_role(auth.uid(),'admin_filiala') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'coordonator_voluntari')))
    OR (min_role = 'admin' AND (public.has_role(auth.uid(),'admin_national') OR public.has_role(auth.uid(),'admin_filiala')))
  )
));

DROP POLICY "members read internal events" ON public.internal_events;
CREATE POLICY "members read internal events" ON public.internal_events FOR SELECT TO authenticated
USING (public.portal_access(auth.uid()) AND (branch_id IS NULL OR branch_id = public.user_branch(auth.uid()) OR public.has_role(auth.uid(),'admin_national')));

DROP POLICY "members read threads" ON public.forum_threads;
CREATE POLICY "members read threads" ON public.forum_threads FOR SELECT TO authenticated USING (public.portal_access(auth.uid()));
DROP POLICY "members create threads" ON public.forum_threads;
CREATE POLICY "members create threads" ON public.forum_threads FOR INSERT TO authenticated WITH CHECK (public.portal_access(auth.uid()) AND author_id = auth.uid());

DROP POLICY "members read visible posts" ON public.forum_posts;
CREATE POLICY "members read visible posts" ON public.forum_posts FOR SELECT TO authenticated
USING (public.portal_access(auth.uid()) AND (NOT hidden OR author_id = auth.uid() OR public.has_role(auth.uid(),'admin_national') OR public.has_role(auth.uid(),'admin_filiala') OR public.has_role(auth.uid(),'editor')));
DROP POLICY "members create posts" ON public.forum_posts;
CREATE POLICY "members create posts" ON public.forum_posts FOR INSERT TO authenticated
WITH CHECK (public.portal_access(auth.uid()) AND author_id = auth.uid() AND NOT EXISTS (SELECT 1 FROM public.forum_threads t WHERE t.id = thread_id AND t.locked));

DROP POLICY "branch members read messages" ON public.branch_messages;
CREATE POLICY "branch members read messages" ON public.branch_messages FOR SELECT TO authenticated
USING (public.portal_access(auth.uid()) AND (branch_id = public.user_branch(auth.uid()) OR public.has_role(auth.uid(),'admin_national')));
DROP POLICY "branch members send messages" ON public.branch_messages;
CREATE POLICY "branch members send messages" ON public.branch_messages FOR INSERT TO authenticated
WITH CHECK (public.portal_access(auth.uid()) AND author_id = auth.uid() AND (branch_id = public.user_branch(auth.uid()) OR public.has_role(auth.uid(),'admin_national')));
