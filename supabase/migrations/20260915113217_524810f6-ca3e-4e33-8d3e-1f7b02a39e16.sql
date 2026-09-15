CREATE TABLE public.cooperations (
  id uuid primary key default gen_random_uuid(),
  project_a_id uuid not null references public.projects(id) on delete cascade,
  project_b_id uuid not null references public.projects(id) on delete cascade,
  kind text not null default 'cooperation',
  title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cooperations_pair_order check (project_a_id < project_b_id),
  constraint cooperations_pair_unique unique (project_a_id, project_b_id)
);
GRANT SELECT, INSERT ON public.cooperations TO anon, authenticated;
GRANT ALL ON public.cooperations TO service_role;
ALTER TABLE public.cooperations ENABLE ROW LEVEL SECURITY;
CREATE POLICY cooperations_public_read ON public.cooperations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cooperations_public_insert ON public.cooperations FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.cooperation_messages (
  id uuid primary key default gen_random_uuid(),
  cooperation_id uuid not null references public.cooperations(id) on delete cascade,
  author_name text not null default 'Anonyme',
  body text not null,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT ON public.cooperation_messages TO anon, authenticated;
GRANT ALL ON public.cooperation_messages TO service_role;
ALTER TABLE public.cooperation_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY coop_messages_public_read ON public.cooperation_messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY coop_messages_public_insert ON public.cooperation_messages FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.cooperation_steps (
  id uuid primary key default gen_random_uuid(),
  cooperation_id uuid not null references public.cooperations(id) on delete cascade,
  title text not null,
  deliverable text not null default '',
  owner_name text not null default '',
  due_date date,
  status text not null default 'a_faire',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE ON public.cooperation_steps TO anon, authenticated;
GRANT ALL ON public.cooperation_steps TO service_role;
ALTER TABLE public.cooperation_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY coop_steps_public_read ON public.cooperation_steps FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY coop_steps_public_insert ON public.cooperation_steps FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY coop_steps_public_update ON public.cooperation_steps FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER update_cooperations_updated_at BEFORE UPDATE ON public.cooperations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cooperation_steps_updated_at BEFORE UPDATE ON public.cooperation_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();