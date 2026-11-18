CREATE TABLE public.project_reciprocity (
  project_id uuid PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  permeability int NOT NULL DEFAULT 1 CHECK (permeability BETWEEN 1 AND 4),
  governance int NOT NULL DEFAULT 1 CHECK (governance BETWEEN 1 AND 4),
  atomicity int NOT NULL DEFAULT 1 CHECK (atomicity BETWEEN 1 AND 4),
  offers text[] NOT NULL DEFAULT '{}',
  reciprocity_timing text NOT NULL DEFAULT 'immediate',
  preferred_return text NOT NULL DEFAULT '',
  hard_limits text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.project_reciprocity TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_reciprocity TO authenticated;
GRANT ALL ON public.project_reciprocity TO service_role;
ALTER TABLE public.project_reciprocity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read reciprocity" ON public.project_reciprocity FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.is_published OR p.owner_id = auth.uid())));
CREATE POLICY "owner writes reciprocity" ON public.project_reciprocity FOR ALL TO authenticated
  USING (public.is_project_owner(project_id)) WITH CHECK (public.is_project_owner(project_id));

CREATE OR REPLACE FUNCTION public.cooperation_side(_cooperation_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM cooperations c JOIN projects p ON p.id = c.project_a_id WHERE c.id = _cooperation_id AND p.owner_id = auth.uid()) THEN 'a'
    WHEN EXISTS (SELECT 1 FROM cooperations c JOIN projects p ON p.id = c.project_b_id WHERE c.id = _cooperation_id AND p.owner_id = auth.uid()) THEN 'b'
    ELSE NULL END
$$;

CREATE TABLE public.cooperation_charters (
  cooperation_id uuid PRIMARY KEY REFERENCES public.cooperations(id) ON DELETE CASCADE,
  sovereign text[] NOT NULL DEFAULT '{}',
  commons text[] NOT NULL DEFAULT '{}',
  gray text[] NOT NULL DEFAULT '{}',
  test_action text NOT NULL DEFAULT '',
  test_owner text NOT NULL DEFAULT '',
  test_due date,
  outcome_a text NOT NULL DEFAULT '' CHECK (outcome_a IN ('', 'deepen', 'allies', 'pause')),
  outcome_b text NOT NULL DEFAULT '' CHECK (outcome_b IN ('', 'deepen', 'allies', 'pause')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cooperation_charters TO anon;
GRANT SELECT, INSERT, UPDATE ON public.cooperation_charters TO authenticated;
GRANT ALL ON public.cooperation_charters TO service_role;
ALTER TABLE public.cooperation_charters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read charters" ON public.cooperation_charters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "owners insert charters" ON public.cooperation_charters FOR INSERT TO authenticated
  WITH CHECK (public.cooperation_side(cooperation_id) IS NOT NULL);
CREATE POLICY "owners update charters" ON public.cooperation_charters FOR UPDATE TO authenticated
  USING (public.cooperation_side(cooperation_id) IS NOT NULL) WITH CHECK (public.cooperation_side(cooperation_id) IS NOT NULL);