-- Rôles
CREATE TYPE public.app_role AS ENUM ('citoyen', 'porteur', 'institution', 'admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  handle text NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT '',
  commune text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  avatar_url text,
  role public.app_role NOT NULL DEFAULT 'citoyen',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_public_read ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_roles_read_own ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY user_roles_insert_own ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND role <> 'admin');

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Propriété et signature
ALTER TABLE public.projects ADD COLUMN owner_id uuid;
ALTER TABLE public.calls ADD COLUMN owner_id uuid;
ALTER TABLE public.feedback ADD COLUMN author_id uuid;
ALTER TABLE public.supports ADD COLUMN author_id uuid;
ALTER TABLE public.actions ADD COLUMN author_id uuid;
ALTER TABLE public.maturation_questions ADD COLUMN author_id uuid;
ALTER TABLE public.cooperation_messages ADD COLUMN author_id uuid;
ALTER TABLE public.cooperation_steps ADD COLUMN author_id uuid;
ALTER TABLE public.applications ADD COLUMN author_id uuid;
ALTER TABLE public.milestones ADD COLUMN author_id uuid;
ALTER TABLE public.cooperations ADD COLUMN author_id uuid;

CREATE INDEX projects_owner_id_idx ON public.projects (owner_id);
CREATE INDEX calls_owner_id_idx ON public.calls (owner_id);
CREATE INDEX feedback_author_id_idx ON public.feedback (author_id);
CREATE INDEX supports_author_id_idx ON public.supports (author_id);
CREATE INDEX actions_author_id_idx ON public.actions (author_id);

-- Une contribution ne peut être signée qu'au nom du compte connecté
DROP POLICY projects_public_insert ON public.projects;
CREATE POLICY projects_public_insert ON public.projects FOR INSERT TO anon, authenticated
  WITH CHECK (owner_id IS NULL OR owner_id = auth.uid());

DROP POLICY calls_public_insert ON public.calls;
CREATE POLICY calls_public_insert ON public.calls FOR INSERT TO anon, authenticated
  WITH CHECK (owner_id IS NULL OR owner_id = auth.uid());

DROP POLICY feedback_public_insert ON public.feedback;
CREATE POLICY feedback_public_insert ON public.feedback FOR INSERT TO anon, authenticated
  WITH CHECK (author_id IS NULL OR author_id = auth.uid());

DROP POLICY supports_public_insert ON public.supports;
CREATE POLICY supports_public_insert ON public.supports FOR INSERT TO anon, authenticated
  WITH CHECK (author_id IS NULL OR author_id = auth.uid());

DROP POLICY actions_public_insert ON public.actions;
CREATE POLICY actions_public_insert ON public.actions FOR INSERT TO anon, authenticated
  WITH CHECK (author_id IS NULL OR author_id = auth.uid());

DROP POLICY mq_public_insert ON public.maturation_questions;
CREATE POLICY mq_public_insert ON public.maturation_questions FOR INSERT TO anon, authenticated
  WITH CHECK (author_id IS NULL OR author_id = auth.uid());

DROP POLICY coop_messages_public_insert ON public.cooperation_messages;
CREATE POLICY coop_messages_public_insert ON public.cooperation_messages FOR INSERT TO anon, authenticated
  WITH CHECK (author_id IS NULL OR author_id = auth.uid());

DROP POLICY coop_steps_public_insert ON public.cooperation_steps;
CREATE POLICY coop_steps_public_insert ON public.cooperation_steps FOR INSERT TO anon, authenticated
  WITH CHECK (author_id IS NULL OR author_id = auth.uid());

DROP POLICY applications_public_insert ON public.applications;
CREATE POLICY applications_public_insert ON public.applications FOR INSERT TO anon, authenticated
  WITH CHECK (author_id IS NULL OR author_id = auth.uid());

DROP POLICY milestones_public_insert ON public.milestones;
CREATE POLICY milestones_public_insert ON public.milestones FOR INSERT TO anon, authenticated
  WITH CHECK (author_id IS NULL OR author_id = auth.uid());

DROP POLICY cooperations_public_insert ON public.cooperations;
CREATE POLICY cooperations_public_insert ON public.cooperations FOR INSERT TO anon, authenticated
  WITH CHECK (author_id IS NULL OR author_id = auth.uid());

-- Le porteur modifie sa fiche
CREATE POLICY projects_update_owner ON public.projects FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY calls_update_owner ON public.calls FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Le porteur enrichit ses projets
GRANT INSERT ON public.expenses TO authenticated;
GRANT INSERT ON public.news TO authenticated;
GRANT INSERT ON public.events TO authenticated;

CREATE POLICY expenses_insert_owner ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE POLICY news_insert_owner ON public.news FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE POLICY events_insert_owner ON public.events FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

-- Réponses aux questions de maturation
DROP POLICY mq_public_update ON public.maturation_questions;
CREATE POLICY mq_update_owner ON public.maturation_questions FOR UPDATE TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.owner_id IS NULL OR p.owner_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.owner_id IS NULL OR p.owner_id = auth.uid())));