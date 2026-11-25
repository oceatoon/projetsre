CREATE OR REPLACE FUNCTION public.project_visible(_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM projects p WHERE p.id = _project_id AND (p.is_published OR p.owner_id = auth.uid()))
$$;

CREATE OR REPLACE FUNCTION public.cooperation_visible(_cooperation_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM cooperations c WHERE c.id = _cooperation_id
    AND public.project_visible(c.project_a_id) AND public.project_visible(c.project_b_id))
$$;

DROP POLICY IF EXISTS actions_public_read ON public.actions;
CREATE POLICY actions_public_read ON public.actions FOR SELECT TO anon, authenticated USING (public.project_visible(project_id));
DROP POLICY IF EXISTS applications_public_read ON public.applications;
CREATE POLICY applications_public_read ON public.applications FOR SELECT TO anon, authenticated USING (public.project_visible(project_id));
DROP POLICY IF EXISTS expenses_public_read ON public.expenses;
CREATE POLICY expenses_public_read ON public.expenses FOR SELECT TO anon, authenticated USING (public.project_visible(project_id));
DROP POLICY IF EXISTS feedback_public_read ON public.feedback;
CREATE POLICY feedback_public_read ON public.feedback FOR SELECT TO anon, authenticated USING (public.project_visible(project_id));
DROP POLICY IF EXISTS funders_public_read ON public.funders;
CREATE POLICY funders_public_read ON public.funders FOR SELECT TO anon, authenticated USING (public.project_visible(project_id));
DROP POLICY IF EXISTS milestones_public_read ON public.milestones;
CREATE POLICY milestones_public_read ON public.milestones FOR SELECT TO anon, authenticated USING (public.project_visible(project_id));
DROP POLICY IF EXISTS supports_public_read ON public.supports;
CREATE POLICY supports_public_read ON public.supports FOR SELECT TO anon, authenticated USING (public.project_visible(project_id));

DROP POLICY IF EXISTS cooperations_public_read ON public.cooperations;
CREATE POLICY cooperations_public_read ON public.cooperations FOR SELECT TO anon, authenticated
  USING (public.project_visible(project_a_id) AND public.project_visible(project_b_id));
DROP POLICY IF EXISTS coop_messages_public_read ON public.cooperation_messages;
CREATE POLICY coop_messages_public_read ON public.cooperation_messages FOR SELECT TO anon, authenticated USING (public.cooperation_visible(cooperation_id));
DROP POLICY IF EXISTS "read charters" ON public.cooperation_charters;
CREATE POLICY "read charters" ON public.cooperation_charters FOR SELECT TO anon, authenticated USING (public.cooperation_visible(cooperation_id));
DROP POLICY IF EXISTS coop_steps_public_update ON public.cooperation_steps;
CREATE POLICY coop_steps_owner_update ON public.cooperation_steps FOR UPDATE TO authenticated
  USING (public.cooperation_side(cooperation_id) IS NOT NULL) WITH CHECK (public.cooperation_side(cooperation_id) IS NOT NULL);

DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
CREATE POLICY profiles_read_own ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR auth.uid() IS NOT NULL AND role IS NOT NULL);
CREATE POLICY profiles_public_leaders ON public.profiles FOR SELECT TO anon USING (role IN ('porteur','institution'));