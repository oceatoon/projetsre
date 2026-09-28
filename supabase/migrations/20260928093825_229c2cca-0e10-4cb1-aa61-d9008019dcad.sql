CREATE OR REPLACE FUNCTION public.is_project_owner(_project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects WHERE id = _project_id AND owner_id = auth.uid())
$$;
GRANT EXECUTE ON FUNCTION public.is_project_owner(uuid) TO anon, authenticated;

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'communication',
  title text NOT NULL,
  goal text NOT NULL DEFAULT '',
  target_amount numeric,
  target_count integer,
  cadence text NOT NULL DEFAULT '',
  starts_on date NOT NULL DEFAULT current_date,
  ends_on date,
  is_public boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active',
  report text NOT NULL DEFAULT '',
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaigns TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY campaigns_read ON public.campaigns FOR SELECT TO anon, authenticated
  USING (is_public OR public.is_project_owner(project_id));
CREATE POLICY campaigns_insert ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (public.is_project_owner(project_id) AND author_id = auth.uid());
CREATE POLICY campaigns_update ON public.campaigns FOR UPDATE TO authenticated
  USING (public.is_project_owner(project_id)) WITH CHECK (public.is_project_owner(project_id));
CREATE POLICY campaigns_delete ON public.campaigns FOR DELETE TO authenticated
  USING (public.is_project_owner(project_id));
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.campaign_visible(_campaign_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = _campaign_id
    AND (c.is_public OR public.is_project_owner(c.project_id)))
$$;
CREATE OR REPLACE FUNCTION public.campaign_owned(_campaign_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = _campaign_id
    AND public.is_project_owner(c.project_id))
$$;
GRANT EXECUTE ON FUNCTION public.campaign_visible(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.campaign_owned(uuid) TO anon, authenticated;

CREATE TABLE public.campaign_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  scheduled_for date NOT NULL DEFAULT current_date,
  channel text NOT NULL DEFAULT 'email',
  audience text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'prevu',
  recipients integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaign_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_messages TO authenticated;
GRANT ALL ON public.campaign_messages TO service_role;
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY cm_read ON public.campaign_messages FOR SELECT TO anon, authenticated
  USING (public.campaign_owned(campaign_id) OR (public.campaign_visible(campaign_id) AND status <> 'prevu'));
CREATE POLICY cm_write ON public.campaign_messages FOR ALL TO authenticated
  USING (public.campaign_owned(campaign_id)) WITH CHECK (public.campaign_owned(campaign_id));
CREATE TRIGGER update_campaign_messages_updated_at BEFORE UPDATE ON public.campaign_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.campaign_volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid,
  person_name text NOT NULL DEFAULT '',
  motivation text NOT NULL DEFAULT '',
  stage text NOT NULL DEFAULT 'inscrit',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_volunteers TO authenticated;
GRANT ALL ON public.campaign_volunteers TO service_role;
ALTER TABLE public.campaign_volunteers ENABLE ROW LEVEL SECURITY;
CREATE POLICY cv_read ON public.campaign_volunteers FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.campaign_owned(campaign_id));
CREATE POLICY cv_insert ON public.campaign_volunteers FOR INSERT TO authenticated
  WITH CHECK ((user_id = auth.uid() AND public.campaign_visible(campaign_id)) OR public.campaign_owned(campaign_id));
CREATE POLICY cv_update ON public.campaign_volunteers FOR UPDATE TO authenticated
  USING (public.campaign_owned(campaign_id)) WITH CHECK (public.campaign_owned(campaign_id));
CREATE POLICY cv_delete ON public.campaign_volunteers FOR DELETE TO authenticated
  USING (public.campaign_owned(campaign_id) OR user_id = auth.uid());
CREATE TRIGGER update_campaign_volunteers_updated_at BEFORE UPDATE ON public.campaign_volunteers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.project_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.project_followers TO authenticated;
GRANT ALL ON public.project_followers TO service_role;
ALTER TABLE public.project_followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY pf_read ON public.project_followers FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_project_owner(project_id));
CREATE POLICY pf_insert ON public.project_followers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY pf_delete ON public.project_followers FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.follower_count(_project_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.project_followers WHERE project_id = _project_id
$$;
GRANT EXECUTE ON FUNCTION public.follower_count(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.campaign_public_stats(_campaign_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN NOT public.campaign_visible(_campaign_id) THEN NULL ELSE jsonb_build_object(
    'volunteers', (SELECT count(*) FROM public.campaign_volunteers v WHERE v.campaign_id = c.id),
    'volunteers_active', (SELECT count(*) FROM public.campaign_volunteers v WHERE v.campaign_id = c.id AND v.stage IN ('premiere_mission','regulier')),
    'pledges', (SELECT count(*) FROM public.supports s WHERE s.project_id = c.project_id AND s.amount IS NOT NULL AND s.created_at::date BETWEEN c.starts_on AND coalesce(c.ends_on, current_date)),
    'pledged', (SELECT coalesce(sum(s.amount),0) FROM public.supports s WHERE s.project_id = c.project_id AND s.created_at::date BETWEEN c.starts_on AND coalesce(c.ends_on, current_date)),
    'testers', (SELECT count(*) FROM public.supports s WHERE s.project_id = c.project_id AND s.kind = 'testeur' AND s.created_at::date BETWEEN c.starts_on AND coalesce(c.ends_on, current_date)),
    'supports', (SELECT count(*) FROM public.supports s WHERE s.project_id = c.project_id AND s.created_at::date BETWEEN c.starts_on AND coalesce(c.ends_on, current_date)),
    'feedback', (SELECT count(*) FROM public.feedback f WHERE f.project_id = c.project_id AND f.created_at::date BETWEEN c.starts_on AND coalesce(c.ends_on, current_date)),
    'followers_new', (SELECT count(*) FROM public.project_followers pf WHERE pf.project_id = c.project_id AND pf.created_at::date BETWEEN c.starts_on AND coalesce(c.ends_on, current_date)),
    'messages_sent', (SELECT count(*) FROM public.campaign_messages m WHERE m.campaign_id = c.id AND m.status <> 'prevu'),
    'messages_total', (SELECT count(*) FROM public.campaign_messages m WHERE m.campaign_id = c.id),
    'recipients', (SELECT coalesce(sum(m.recipients),0) FROM public.campaign_messages m WHERE m.campaign_id = c.id)
  ) END FROM public.campaigns c WHERE c.id = _campaign_id
$$;
GRANT EXECUTE ON FUNCTION public.campaign_public_stats(uuid) TO anon, authenticated;