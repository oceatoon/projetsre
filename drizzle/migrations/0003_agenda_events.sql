ALTER TABLE public.events ADD COLUMN description text NOT NULL DEFAULT '';
ALTER TABLE public.events ADD COLUMN visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private'));
ALTER TABLE public.events ADD COLUMN author_id uuid;

DROP POLICY IF EXISTS events_public_read ON public.events;
CREATE POLICY events_read ON public.events FOR SELECT
  USING ((visibility = 'public' AND public.project_visible(project_id)) OR public.is_project_owner(project_id));
CREATE POLICY events_update_owner ON public.events FOR UPDATE TO authenticated
  USING (public.is_project_owner(project_id)) WITH CHECK (public.is_project_owner(project_id));
CREATE POLICY events_delete_owner ON public.events FOR DELETE TO authenticated
  USING (public.is_project_owner(project_id));
GRANT UPDATE, DELETE ON public.events TO authenticated;

CREATE TABLE public.partner_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_slug text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_slug, user_id)
);
GRANT SELECT ON public.partner_members TO authenticated;
GRANT ALL ON public.partner_members TO service_role;
ALTER TABLE public.partner_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY partner_members_read ON public.partner_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY partner_members_admin ON public.partner_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.is_partner_member(_slug text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.partner_members WHERE partner_slug = _slug AND user_id = auth.uid())
      OR public.has_role(auth.uid(), 'admin')
$$;

CREATE TABLE public.partner_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_slug text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_events TO authenticated;
GRANT ALL ON public.partner_events TO service_role;
ALTER TABLE public.partner_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY partner_events_read ON public.partner_events FOR SELECT
  USING (visibility = 'public' OR public.is_partner_member(partner_slug));
CREATE POLICY partner_events_insert ON public.partner_events FOR INSERT TO authenticated
  WITH CHECK (public.is_partner_member(partner_slug) AND author_id = auth.uid());
CREATE POLICY partner_events_update ON public.partner_events FOR UPDATE TO authenticated
  USING (public.is_partner_member(partner_slug)) WITH CHECK (public.is_partner_member(partner_slug));
CREATE POLICY partner_events_delete ON public.partner_events FOR DELETE TO authenticated
  USING (public.is_partner_member(partner_slug));
CREATE INDEX partner_events_slug_idx ON public.partner_events (partner_slug, starts_at);