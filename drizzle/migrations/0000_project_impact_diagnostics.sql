CREATE TABLE public.project_impact_axes (
 project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
 axis text NOT NULL CHECK (axis IN ('environnement','social','solidarite','educatif','sportif','creatif','productif','territorial')),
 typology integer CHECK (typology BETWEEN 0 AND 5),
 current_score integer CHECK (current_score BETWEEN 0 AND 5),
 target_score integer CHECK (target_score BETWEEN 0 AND 5),
 evidence text NOT NULL DEFAULT '' CHECK (char_length(evidence) <= 1500),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (project_id, axis)
);
GRANT SELECT ON public.project_impact_axes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_impact_axes TO authenticated;
GRANT ALL ON public.project_impact_axes TO service_role;
ALTER TABLE public.project_impact_axes ENABLE ROW LEVEL SECURITY;
CREATE POLICY impact_axes_public ON public.project_impact_axes FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.is_published));
CREATE POLICY impact_axes_owner ON public.project_impact_axes FOR ALL TO authenticated USING (public.is_project_owner(project_id)) WITH CHECK (public.is_project_owner(project_id));
CREATE TABLE public.project_impact_objectives (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
 axis text NOT NULL CHECK (axis IN ('environnement','social','solidarite','educatif','sportif','creatif','productif','territorial')),
 title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 180),
 indicator text NOT NULL CHECK (char_length(indicator) BETWEEN 2 AND 200),
 baseline numeric NOT NULL CHECK (baseline >= 0 AND baseline <= 1e12),
 target numeric NOT NULL CHECK (target > 0 AND target <= 1e12),
 actual numeric NOT NULL CHECK (actual >= 0 AND actual <= 1e12),
 unit text NOT NULL CHECK (char_length(unit) BETWEEN 1 AND 60),
 direction text NOT NULL CHECK (direction IN ('augmenter','reduire')),
 milestone_id uuid REFERENCES public.milestones(id) ON DELETE SET NULL,
 action_id uuid REFERENCES public.actions(id) ON DELETE SET NULL,
 evidence text NOT NULL DEFAULT '' CHECK (char_length(evidence) <= 1500),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK ((direction = 'augmenter' AND target > baseline) OR (direction = 'reduire' AND target < baseline))
);
GRANT SELECT ON public.project_impact_objectives TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_impact_objectives TO authenticated;
GRANT ALL ON public.project_impact_objectives TO service_role;
ALTER TABLE public.project_impact_objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY impact_objectives_public ON public.project_impact_objectives FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.is_published));
CREATE POLICY impact_objectives_owner ON public.project_impact_objectives FOR ALL TO authenticated USING (public.is_project_owner(project_id)) WITH CHECK (public.is_project_owner(project_id));
CREATE FUNCTION public.validate_impact_links() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.milestone_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.milestones WHERE id = NEW.milestone_id AND project_id = NEW.project_id) THEN RAISE EXCEPTION 'Milestone must belong to the same project'; END IF;
 IF NEW.action_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.actions WHERE id = NEW.action_id AND project_id = NEW.project_id) THEN RAISE EXCEPTION 'Action must belong to the same project'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER validate_impact_objective_links BEFORE INSERT OR UPDATE ON public.project_impact_objectives FOR EACH ROW EXECUTE FUNCTION public.validate_impact_links();
CREATE INDEX impact_objectives_project ON public.project_impact_objectives(project_id);