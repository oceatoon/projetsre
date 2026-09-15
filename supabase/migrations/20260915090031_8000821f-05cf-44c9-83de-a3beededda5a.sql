DELETE FROM public.feedback WHERE author_name = 'Test Playwright';
DELETE FROM public.actions WHERE project_id IN (SELECT id FROM public.projects WHERE slug LIKE 'test-fiche-playwright%');
DELETE FROM public.milestones WHERE project_id IN (SELECT id FROM public.projects WHERE slug LIKE 'test-fiche-playwright%');
DELETE FROM public.projects WHERE slug LIKE 'test-fiche-playwright%';