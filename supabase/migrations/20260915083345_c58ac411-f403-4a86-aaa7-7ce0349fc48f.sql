CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  tagline text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  value_added text NOT NULL DEFAULT '',
  needs_answered text NOT NULL DEFAULT '',
  objectives text[] NOT NULL DEFAULT '{}',
  commune text NOT NULL DEFAULT '',
  theme text NOT NULL DEFAULT '',
  stage text NOT NULL DEFAULT 'idee',
  need_types text[] NOT NULL DEFAULT '{}',
  image_url text,
  budget_needed numeric NOT NULL DEFAULT 0,
  budget_secured numeric NOT NULL DEFAULT 0,
  community_size integer NOT NULL DEFAULT 0,
  impact jsonb NOT NULL DEFAULT '[]'::jsonb,
  carrier_name text NOT NULL DEFAULT '',
  contact_email text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  due_date date,
  status text NOT NULL DEFAULT 'a_venir',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.milestones(id) ON DELETE SET NULL,
  title text NOT NULL,
  author_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ouverte',
  needs_peer_validation boolean NOT NULL DEFAULT false,
  validated_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  label text NOT NULL,
  category text NOT NULL DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  spent_on date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.funders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'public',
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  published_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  location text NOT NULL DEFAULT '',
  starts_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Anonyme',
  kind text NOT NULL DEFAULT 'avis',
  body text NOT NULL,
  rating integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feedback_body_len CHECK (char_length(body) BETWEEN 3 AND 2000),
  CONSTRAINT feedback_author_len CHECK (char_length(author_name) <= 80),
  CONSTRAINT feedback_kind_ok CHECK (kind IN ('avis','idee','critique')),
  CONSTRAINT feedback_rating_ok CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
);

CREATE TABLE public.supports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  kind text NOT NULL,
  supporter_name text NOT NULL DEFAULT 'Anonyme',
  contact text,
  amount numeric,
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT supports_kind_ok CHECK (kind IN ('don','benevole','testeur','soutien')),
  CONSTRAINT supports_name_len CHECK (char_length(supporter_name) <= 80),
  CONSTRAINT supports_msg_len CHECK (char_length(message) <= 1000),
  CONSTRAINT supports_contact_len CHECK (contact IS NULL OR char_length(contact) <= 160)
);

CREATE TABLE public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  institution text NOT NULL,
  description text NOT NULL DEFAULT '',
  criteria text[] NOT NULL DEFAULT '{}',
  themes text[] NOT NULL DEFAULT '{}',
  need_types text[] NOT NULL DEFAULT '{}',
  budget_max numeric,
  deadline date,
  extra_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_sections text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'depose',
  granted_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.maturation_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL DEFAULT '',
  asked_by text NOT NULL DEFAULT 'IA',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mq_question_len CHECK (char_length(question) BETWEEN 3 AND 500),
  CONSTRAINT mq_answer_len CHECK (char_length(answer) <= 4000)
);

GRANT SELECT ON public.projects TO anon, authenticated;
GRANT INSERT ON public.projects TO anon, authenticated;
GRANT SELECT, INSERT ON public.milestones TO anon, authenticated;
GRANT SELECT, INSERT ON public.actions TO anon, authenticated;
GRANT SELECT ON public.expenses TO anon, authenticated;
GRANT SELECT ON public.funders TO anon, authenticated;
GRANT SELECT ON public.news TO anon, authenticated;
GRANT SELECT ON public.events TO anon, authenticated;
GRANT SELECT, INSERT ON public.feedback TO anon, authenticated;
GRANT SELECT, INSERT ON public.supports TO anon, authenticated;
GRANT SELECT ON public.calls TO anon, authenticated;
GRANT INSERT ON public.calls TO anon, authenticated;
GRANT SELECT, INSERT ON public.applications TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.maturation_questions TO anon, authenticated;
GRANT ALL ON public.projects, public.milestones, public.actions, public.expenses, public.funders, public.news, public.events, public.feedback, public.supports, public.calls, public.applications, public.maturation_questions TO service_role;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maturation_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_public_read" ON public.projects FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY "projects_public_insert" ON public.projects FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "milestones_public_read" ON public.milestones FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "milestones_public_insert" ON public.milestones FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "actions_public_read" ON public.actions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "actions_public_insert" ON public.actions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "expenses_public_read" ON public.expenses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "funders_public_read" ON public.funders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "news_public_read" ON public.news FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "events_public_read" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "feedback_public_read" ON public.feedback FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "feedback_public_insert" ON public.feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "supports_public_read" ON public.supports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "supports_public_insert" ON public.supports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "calls_public_read" ON public.calls FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "calls_public_insert" ON public.calls FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "applications_public_read" ON public.applications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "applications_public_insert" ON public.applications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "mq_public_read" ON public.maturation_questions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "mq_public_insert" ON public.maturation_questions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "mq_public_update" ON public.maturation_questions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.projects (slug, name, tagline, description, value_added, needs_answered, objectives, commune, theme, stage, need_types, budget_needed, budget_secured, community_size, impact, carrier_name, contact_email) VALUES
('kaz-lantant-saint-pierre', 'Kaz Lantant', 'Une maison de quartier ouverte aux familles de Ravine Blanche', 'Kaz Lantant transforme un local municipal inoccupé de Ravine Blanche en maison de quartier : aide aux devoirs, atelier cuisine créole, espace parents-enfants et permanence numérique. Le lieu est co-géré par un collectif de dix familles et deux associations du quartier.', 'Un seul lieu regroupe l''accompagnement scolaire, le lien parents-enfants et l''accès au numérique, là où les familles devaient jusqu''ici se déplacer à Saint-Pierre centre.', 'Décrochage scolaire en primaire, isolement des familles monoparentales, illectronisme des parents.', ARRAY['Accueillir 60 enfants par semaine','Former 40 parents au numérique','Ouvrir 6 jours sur 7 en 2027'], 'Saint-Pierre', 'social', 'en_fonctionnement', ARRAY['financement','benevoles','visibilite'], 85000, 42000, 320, '[{"label":"Enfants accompagnés","value":"48 par semaine"},{"label":"Parents formés","value":"27 depuis janvier"},{"label":"Bénévoles actifs","value":"19"}]'::jsonb, 'Collectif Ravine Blanche', 'contact@kazlantant.re'),
('rezo-lantiy-agroecologie', 'Rezo Lantiy', 'Réseau de fermes agroécologiques dans les Hauts de l''Ouest', 'Rezo Lantiy fédère 14 petites exploitations des Hauts de l''Ouest autour d''une plateforme de vente directe, d''un compost partagé et d''un plan de formation à l''agroécologie. Les paniers sont distribués trois fois par semaine à Saint-Paul, Le Port et La Possession.', 'La mutualisation logistique divise par trois le coût de distribution pour chaque ferme et garantit un prix stable au producteur.', 'Revenus agricoles fragiles, dépendance aux importations alimentaires, perte des savoir-faire créoles.', ARRAY['Atteindre 25 fermes en 2027','Livrer 800 paniers par semaine','Former 60 agriculteurs à l''agroécologie'], 'Saint-Paul', 'agriculture', 'en_developpement', ARRAY['financement','cofinanceurs','outils_collectifs'], 210000, 118000, 640, '[{"label":"Fermes membres","value":"14"},{"label":"Paniers hebdomadaires","value":"430"},{"label":"Tonnes de compost produites","value":"62 en 2026"}]'::jsonb, 'Association Rezo Lantiy', 'bonjour@rezolantiy.re'),
('lo-fab-saint-benoit', 'Lo Fab', 'Atelier partagé de réparation et de fabrication à Saint-Benoît', 'Lo Fab est un atelier ouvert où l''on répare électroménager, vélos et mobilier au lieu de les jeter. Machines partagées, permanences de réparation, formation de jeunes en insertion et revente d''objets remis en état.', 'Chaque objet réparé évite un déchet et crée une heure de formation rémunérée pour un jeune en insertion.', 'Volume de déchets encombrants dans l''Est, coût du remplacement des équipements, manque de parcours d''insertion techniques.', ARRAY['Réparer 1500 objets par an','Accompagner 20 jeunes en insertion','Ouvrir une antenne à Sainte-Rose'], 'Saint-Benoît', 'environnement', 'en_developpement', ARRAY['financement','benevoles','testeurs'], 120000, 55000, 410, '[{"label":"Objets réparés","value":"870 en 2026"},{"label":"Jeunes en parcours","value":"12"},{"label":"Tonnes de déchets évitées","value":"9,4"}]'::jsonb, 'SCIC Lo Fab', 'atelier@lofab.re'),
('mounwar-numerique-le-port', 'Mounwar', 'Coopérative numérique de développeurs réunionnais', 'Mounwar est une coopérative de dix développeurs et designers qui construit des outils libres pour les associations du territoire : sites, applications de gestion, formation. Budget ouvert, co-rémunération et feuille de route publique.', 'Les associations accèdent à un développement de qualité à prix coûtant, et le code produit reste réutilisable par tout le territoire.', 'Coût du numérique pour les petites structures, dépendance à des prestataires hors territoire, fuite des compétences.', ARRAY['Publier 100 % du code en licence libre','Atteindre l''équilibre en co-rémunération','Accompagner 30 associations par an'], 'Le Port', 'numerique', 'en_fonctionnement', ARRAY['visibilite','outils_collectifs','cofinanceurs'], 95000, 71000, 280, '[{"label":"Associations accompagnées","value":"22"},{"label":"Dépôts publiés en libre","value":"31"},{"label":"Salaires en co-rémunération","value":"10"}]'::jsonb, 'SCOP Mounwar', 'salut@mounwar.re'),
('lantouraz-mangrove-etang-sale', 'Lantouraz', 'Restauration participative du littoral de l''Étang-Salé', 'Lantouraz mobilise habitants, écoles et plongeurs pour replanter la végétation littorale, retirer les déchets et suivre l''état du récif. Les données de suivi sont publiques et alimentent un tableau de bord ouvert.', 'Le suivi scientifique est produit par les habitants eux-mêmes, ce qui rend les données à la fois moins chères et beaucoup plus appropriées localement.', 'Érosion du littoral, dégradation du récif, faible appropriation citoyenne des enjeux marins.', ARRAY['Replanter 4 hectares de littoral','Former 200 observateurs citoyens','Publier un rapport annuel ouvert'], 'L''Étang-Salé', 'environnement', 'en_projet', ARRAY['benevoles','financement','avis'], 68000, 21000, 520, '[{"label":"Plants mis en terre","value":"3 200"},{"label":"Observateurs formés","value":"84"},{"label":"Déchets retirés","value":"5,1 tonnes"}]'::jsonb, 'Association Lantouraz', 'lantouraz@lantouraz.re'),
('bibliotek-vwayaz-cilaos', 'Bibliotek Vwayaz', 'Bibliothèque itinérante dans les îlets de Cilaos', 'Un véhicule aménagé apporte livres, jeux et ateliers de lecture dans les îlets isolés de Cilaos une fois par quinzaine, avec des lectures en créole et en français animées par des habitants formés.', 'Le service va chercher les lecteurs là où aucune structure fixe n''est viable, avec des médiateurs issus des îlets eux-mêmes.', 'Isolement culturel des îlets, faible taux de lecture chez les enfants, disparition de la transmission orale.', ARRAY['Desservir 9 îlets','Former 12 médiateurs habitants','Constituer un fonds créole de 800 titres'], 'Cilaos', 'culture', 'en_developpement', ARRAY['financement','benevoles','visibilite'], 74000, 38000, 190, '[{"label":"Îlets desservis","value":"6"},{"label":"Prêts par mois","value":"310"},{"label":"Médiateurs formés","value":"7"}]'::jsonb, 'Association Bibliotek Vwayaz', 'contact@bibliotekvwayaz.re'),
('ti-kolok-logement-saint-denis', 'Ti Kolok', 'Colocations solidaires pour jeunes en formation à Saint-Denis', 'Ti Kolok remet en état des logements vacants du centre de Saint-Denis pour proposer des colocations à loyer modéré aux jeunes en formation, avec un accompagnement budgétaire et un engagement d''entraide entre colocataires.', 'Un logement remis sur le marché crée trois places abordables et un réseau d''entraide entre jeunes, au lieu d''un simple hébergement.', 'Jeunes en formation renonçant à leur cursus faute de logement, vacance de logements anciens en centre-ville.', ARRAY['Ouvrir 12 colocations','Loger 36 jeunes par an','Maintenir un loyer sous 350 € charges comprises'], 'Saint-Denis', 'social', 'en_projet', ARRAY['financement','cofinanceurs','avis'], 340000, 96000, 150, '[{"label":"Logements remis en état","value":"3"},{"label":"Jeunes logés","value":"9"},{"label":"Loyer moyen","value":"318 €"}]'::jsonb, 'Association Ti Kolok', 'info@tikolok.re'),
('zarlor-tisane-saint-joseph', 'Zarlor Tizann', 'Filière coopérative de tisanes créoles du Sud sauvage', 'Zarlor Tizann réunit cueilleurs et tisaneurs du Sud sauvage pour structurer une filière de plantes médicinales créoles : séchoir partagé, traçabilité, formation à la cueillette durable et vente en circuit court.', 'La filière sécurise le revenu des tisaneurs tout en documentant et protégeant un patrimoine de savoirs qui n''est aujourd''hui transmis qu''oralement.', 'Précarité des tisaneurs, cueillette non durable, perte du savoir sur les plantes médicinales créoles.', ARRAY['Structurer 20 cueilleurs','Documenter 60 plantes','Obtenir une certification de cueillette durable'], 'Saint-Joseph', 'agriculture', 'en_developpement', ARRAY['financement','etude','cofinanceurs'], 130000, 47000, 230, '[{"label":"Cueilleurs engagés","value":"11"},{"label":"Plantes documentées","value":"34"},{"label":"Kilos séchés par an","value":"1 250"}]'::jsonb, 'Coopérative Zarlor Tizann', 'zarlor@zarlortizann.re'),
('lekol-la-mer-saint-leu', 'Lékol la Mer', 'Apprendre à nager et connaître le lagon à Saint-Leu', 'Lékol la Mer propose des cycles gratuits d''apprentissage de la natation et de découverte du lagon aux enfants des quartiers de Saint-Leu qui n''ont jamais eu accès à un bassin, avec des éducateurs sportifs et des guides du lagon.', 'La sécurité aquatique et l''éducation à la mer sont enseignées ensemble, par des encadrants du quartier, pour des enfants que les dispositifs existants ne touchaient pas.', 'Enfants non-nageurs dans une île, noyades évitables, rapport distant au lagon pourtant voisin.', ARRAY['Faire nager 300 enfants par an','Former 15 encadrants locaux','Étendre le dispositif aux Avirons'], 'Saint-Leu', 'sport', 'en_fonctionnement', ARRAY['financement','benevoles','visibilite'], 62000, 44000, 380, '[{"label":"Enfants formés","value":"212 en 2026"},{"label":"Taux de réussite au test","value":"88 %"},{"label":"Encadrants formés","value":"9"}]'::jsonb, 'Association Lékol la Mer', 'contact@lekollamer.re'),
('rekup-eau-sainte-rose', 'Rékup Dolo', 'Récupération d''eau de pluie mutualisée à Sainte-Rose', 'Rékup Dolo installe des dispositifs de récupération et de filtration d''eau de pluie mutualisés entre voisins à Sainte-Rose, avec un suivi de consommation partagé et un chantier participatif par installation.', 'Un dispositif partagé entre cinq foyers coûte quatre fois moins cher par foyer qu''une installation individuelle et crée un collectif de voisinage.', 'Coupures d''eau récurrentes dans l''Est, coût des installations individuelles, gaspillage d''une pluviométrie abondante.', ARRAY['Équiper 40 foyers','Mutualiser 15 dispositifs','Publier un guide d''auto-installation'], 'Sainte-Rose', 'environnement', 'en_projet', ARRAY['testeurs','financement','avis'], 58000, 12000, 140, '[{"label":"Foyers équipés","value":"11"},{"label":"Litres stockés","value":"46 000"},{"label":"Chantiers participatifs","value":"4"}]'::jsonb, 'Collectif Rékup Dolo', 'rekupdolo@rekupdolo.re'),
('atelye-koutir-saint-andre', 'Atelye Koutir', 'Atelier de couture d''insertion et upcycling textile à Saint-André', 'Atelye Koutir forme des femmes éloignées de l''emploi à la couture professionnelle et transforme des textiles récupérés en collections vendues localement. La marge finance les heures de formation.', 'La formation est financée par la vente de la production, ce qui réduit la dépendance à la subvention année après année.', 'Chômage de longue durée des femmes dans l''Est, gaspillage textile, manque d''ateliers de production locale.', ARRAY['Former 24 femmes par an','Atteindre 60 % d''autofinancement','Transformer 6 tonnes de textile'], 'Saint-André', 'social', 'en_fonctionnement', ARRAY['financement','visibilite','cofinanceurs'], 110000, 68000, 260, '[{"label":"Femmes formées","value":"31 depuis 2025"},{"label":"Sorties positives","value":"19"},{"label":"Textile transformé","value":"3,8 tonnes"}]'::jsonb, 'Entreprise d''insertion Atelye Koutir', 'atelier@atelyekoutir.re');

INSERT INTO public.milestones (project_id, title, description, due_date, status, position)
SELECT p.id, m.title, m.description, m.due_date::date, m.status, m.position
FROM public.projects p
JOIN (VALUES
  ('kaz-lantant-saint-pierre','Convention avec la commune','Signature du bail et du cadre d''usage du local','2026-03-15','termine',1),
  ('kaz-lantant-saint-pierre','Travaux d''aménagement','Mise aux normes, mobilier, espace numérique','2026-07-30','en_cours',2),
  ('kaz-lantant-saint-pierre','Ouverture 6 jours sur 7','Recrutement d''un second animateur','2027-01-10','a_venir',3),
  ('rezo-lantiy-agroecologie','Plateforme de commande','Outil de commande et de tournée partagé','2026-05-20','termine',1),
  ('rezo-lantiy-agroecologie','Compost partagé','Plateforme de compostage collective','2026-11-30','en_cours',2),
  ('rezo-lantiy-agroecologie','25 fermes membres','Campagne d''adhésion dans les Hauts','2027-06-30','a_venir',3),
  ('lo-fab-saint-benoit','Ouverture de l''atelier','Machines installées et permanences lancées','2026-02-28','termine',1),
  ('lo-fab-saint-benoit','Premier parcours d''insertion','Cohorte de 12 jeunes','2026-10-15','en_cours',2),
  ('lo-fab-saint-benoit','Antenne de Sainte-Rose','Étude de faisabilité puis ouverture','2027-09-01','a_venir',3),
  ('mounwar-numerique-le-port','Budget ouvert publié','Comptabilité analytique visible en ligne','2026-04-01','termine',1),
  ('mounwar-numerique-le-port','Feuille de route publique','Roadmap #next par projet','2026-09-30','en_cours',2),
  ('lantouraz-mangrove-etang-sale','Diagnostic du littoral','Cartographie de l''érosion avec les habitants','2026-06-30','termine',1),
  ('lantouraz-mangrove-etang-sale','Premier hectare replanté','Chantiers participatifs mensuels','2027-02-28','en_cours',2),
  ('bibliotek-vwayaz-cilaos','Véhicule aménagé','Achat et aménagement du camion','2026-04-30','termine',1),
  ('bibliotek-vwayaz-cilaos','Tournée sur 9 îlets','Extension progressive du circuit','2027-03-31','en_cours',2),
  ('ti-kolok-logement-saint-denis','Trois premiers logements','Rénovation et mise en colocation','2026-12-15','en_cours',1),
  ('ti-kolok-logement-saint-denis','Douze colocations','Montage financier avec bailleurs','2028-06-30','a_venir',2),
  ('zarlor-tisane-saint-joseph','Séchoir partagé','Construction du séchoir collectif','2026-08-31','en_cours',1),
  ('zarlor-tisane-saint-joseph','Certification durable','Cahier des charges de cueillette','2027-05-31','a_venir',2),
  ('lekol-la-mer-saint-leu','Convention piscine','Créneaux réservés à l''année','2026-01-31','termine',1),
  ('lekol-la-mer-saint-leu','300 enfants par an','Recrutement et formation d''encadrants','2027-07-31','en_cours',2),
  ('rekup-eau-sainte-rose','Prototype mutualisé','Premier dispositif pour cinq foyers','2026-09-30','en_cours',1),
  ('rekup-eau-sainte-rose','Guide d''auto-installation','Documentation libre illustrée','2027-01-31','a_venir',2),
  ('atelye-koutir-saint-andre','Première collection','Collection upcyclée vendue localement','2026-05-31','termine',1),
  ('atelye-koutir-saint-andre','60 % d''autofinancement','Développement des ventes en ligne','2027-12-31','en_cours',2)
) AS m(slug,title,description,due_date,status,position) ON m.slug = p.slug;

INSERT INTO public.actions (project_id, milestone_id, title, author_name, status, needs_peer_validation, validated_by)
SELECT p.id, ms.id, a.title, a.author, a.status, a.needs_validation, a.validated_by
FROM public.projects p
JOIN (VALUES
  ('kaz-lantant-saint-pierre','Travaux d''aménagement','Commander le mobilier de l''espace parents','Marie-Ange','en_cours',true,NULL),
  ('kaz-lantant-saint-pierre','Travaux d''aménagement','Installer les six postes informatiques','Jean-Bernard','ouverte',false,NULL),
  ('kaz-lantant-saint-pierre','Convention avec la commune','Rédiger le règlement d''usage partagé','Sylvie','termine',true,'Marie-Ange'),
  ('rezo-lantiy-agroecologie','Compost partagé','Négocier le terrain de la plateforme','Damien','en_cours',true,NULL),
  ('rezo-lantiy-agroecologie','Plateforme de commande','Former les 14 fermes à l''outil de commande','Nadia','termine',false,NULL),
  ('lo-fab-saint-benoit','Premier parcours d''insertion','Construire le référentiel de formation','Patrick','en_cours',true,NULL),
  ('lo-fab-saint-benoit','Premier parcours d''insertion','Trouver deux tuteurs bénévoles','Céline','ouverte',false,NULL),
  ('mounwar-numerique-le-port','Feuille de route publique','Publier la roadmap #next du trimestre','Loïc','termine',true,'Fanny'),
  ('mounwar-numerique-le-port','Feuille de route publique','Documenter la comptabilité analytique','Fanny','en_cours',false,NULL),
  ('lantouraz-mangrove-etang-sale','Premier hectare replanté','Organiser le chantier participatif d''octobre','Ludovic','ouverte',false,NULL),
  ('bibliotek-vwayaz-cilaos','Tournée sur 9 îlets','Recruter trois médiateurs à Îlet à Cordes','Estelle','en_cours',true,NULL),
  ('ti-kolok-logement-saint-denis','Trois premiers logements','Chiffrer les travaux du logement rue Juliette','Karim','en_cours',true,NULL),
  ('zarlor-tisane-saint-joseph','Séchoir partagé','Obtenir l''autorisation de construction','Marlène','ouverte',false,NULL),
  ('lekol-la-mer-saint-leu','300 enfants par an','Planifier les cycles du second semestre','Yannick','en_cours',false,NULL),
  ('rekup-eau-sainte-rose','Prototype mutualisé','Tester la filtration sur trois semaines','Aurélie','en_cours',true,NULL),
  ('atelye-koutir-saint-andre','60 % d''autofinancement','Ouvrir la boutique en ligne','Sabine','ouverte',false,NULL)
) AS a(slug,milestone,title,author,status,needs_validation,validated_by) ON a.slug = p.slug
JOIN public.milestones ms ON ms.project_id = p.id AND ms.title = a.milestone;

INSERT INTO public.expenses (project_id, label, category, amount, spent_on)
SELECT p.id, e.label, e.category, e.amount, e.spent_on::date
FROM public.projects p
JOIN (VALUES
  ('kaz-lantant-saint-pierre','Mise aux normes électriques','Travaux',12400,'2026-04-18'),
  ('kaz-lantant-saint-pierre','Mobilier et jeux','Équipement',6800,'2026-05-02'),
  ('kaz-lantant-saint-pierre','Animation (2 postes)','Salaires',21500,'2026-08-31'),
  ('rezo-lantiy-agroecologie','Développement de la plateforme','Numérique',18000,'2026-03-12'),
  ('rezo-lantiy-agroecologie','Camion réfrigéré d''occasion','Logistique',26500,'2026-05-27'),
  ('rezo-lantiy-agroecologie','Formations agroécologie','Formation',9400,'2026-07-15'),
  ('lo-fab-saint-benoit','Machines d''atelier','Équipement',23800,'2026-01-22'),
  ('lo-fab-saint-benoit','Encadrant technique','Salaires',19200,'2026-08-31'),
  ('mounwar-numerique-le-port','Co-rémunération équipe','Salaires',52000,'2026-08-31'),
  ('mounwar-numerique-le-port','Hébergement et outils libres','Numérique',3100,'2026-06-30'),
  ('lantouraz-mangrove-etang-sale','Plants et matériel de terrain','Équipement',7300,'2026-06-11'),
  ('bibliotek-vwayaz-cilaos','Aménagement du véhicule','Équipement',15600,'2026-04-08'),
  ('bibliotek-vwayaz-cilaos','Fonds de livres créoles','Achats',8200,'2026-06-20'),
  ('ti-kolok-logement-saint-denis','Rénovation premier logement','Travaux',48000,'2026-07-04'),
  ('zarlor-tisane-saint-joseph','Étude de filière','Étude',11200,'2026-05-19'),
  ('lekol-la-mer-saint-leu','Créneaux piscine','Location',14800,'2026-08-31'),
  ('lekol-la-mer-saint-leu','Éducateurs sportifs','Salaires',22600,'2026-08-31'),
  ('rekup-eau-sainte-rose','Cuves et filtration','Équipement',9700,'2026-07-22'),
  ('atelye-koutir-saint-andre','Machines à coudre industrielles','Équipement',17400,'2026-02-14'),
  ('atelye-koutir-saint-andre','Formatrice couture','Salaires',31000,'2026-08-31')
) AS e(slug,label,category,amount,spent_on) ON e.slug = p.slug;

INSERT INTO public.funders (project_id, name, kind, amount)
SELECT p.id, f.name, f.kind, f.amount
FROM public.projects p
JOIN (VALUES
  ('kaz-lantant-saint-pierre','Commune de Saint-Pierre','public',18000),
  ('kaz-lantant-saint-pierre','Caisse d''allocations familiales','public',15000),
  ('kaz-lantant-saint-pierre','Dons de particuliers','citoyen',9000),
  ('rezo-lantiy-agroecologie','Région Réunion','public',60000),
  ('rezo-lantiy-agroecologie','FEADER','public',42000),
  ('rezo-lantiy-agroecologie','Apports des fermes','prive',16000),
  ('lo-fab-saint-benoit','CIREST','public',30000),
  ('lo-fab-saint-benoit','ADEME','public',18000),
  ('lo-fab-saint-benoit','Recettes de revente','prive',7000),
  ('mounwar-numerique-le-port','Prestations associatives','prive',58000),
  ('mounwar-numerique-le-port','Commune du Port','public',13000),
  ('lantouraz-mangrove-etang-sale','Office de l''eau','public',14000),
  ('lantouraz-mangrove-etang-sale','Financement citoyen','citoyen',7000),
  ('bibliotek-vwayaz-cilaos','Département de La Réunion','public',24000),
  ('bibliotek-vwayaz-cilaos','DAC Réunion','public',14000),
  ('ti-kolok-logement-saint-denis','Action Logement','public',70000),
  ('ti-kolok-logement-saint-denis','Fondation privée','prive',26000),
  ('zarlor-tisane-saint-joseph','Région Réunion','public',35000),
  ('zarlor-tisane-saint-joseph','Apports des cueilleurs','prive',12000),
  ('lekol-la-mer-saint-leu','Commune de Saint-Leu','public',22000),
  ('lekol-la-mer-saint-leu','ANS','public',16000),
  ('lekol-la-mer-saint-leu','Dons de particuliers','citoyen',6000),
  ('rekup-eau-sainte-rose','Commune de Sainte-Rose','public',8000),
  ('rekup-eau-sainte-rose','Financement citoyen','citoyen',4000),
  ('atelye-koutir-saint-andre','État (parcours insertion)','public',45000),
  ('atelye-koutir-saint-andre','Ventes de collections','prive',23000)
) AS f(slug,name,kind,amount) ON f.slug = p.slug;

INSERT INTO public.news (project_id, title, body, published_at)
SELECT p.id, n.title, n.body, n.published_at::timestamptz
FROM public.projects p
JOIN (VALUES
  ('kaz-lantant-saint-pierre','L''espace numérique est ouvert','Six postes sont désormais accessibles aux parents tous les mardis et jeudis matin, avec une permanence d''accompagnement aux démarches en ligne.','2026-08-20'),
  ('kaz-lantant-saint-pierre','48 enfants accompagnés chaque semaine','Depuis la rentrée, l''aide aux devoirs tourne à plein. Nous cherchons trois bénévoles supplémentaires pour le créneau du mercredi.','2026-09-05'),
  ('rezo-lantiy-agroecologie','430 paniers par semaine','Le cap des 400 paniers hebdomadaires est franchi. Deux nouvelles fermes rejoignent le réseau en octobre.','2026-09-01'),
  ('lo-fab-saint-benoit','870 objets réparés depuis janvier','Le compteur de l''atelier passe les 870 réparations, dont 210 vélos. Prochaine permanence samedi matin.','2026-08-28'),
  ('mounwar-numerique-le-port','Notre budget est public','Toutes nos dépenses et notre grille de co-rémunération sont désormais consultables en ligne, mises à jour chaque mois.','2026-07-12'),
  ('lantouraz-mangrove-etang-sale','3 200 plants en terre','Le chantier participatif d''août a réuni 74 personnes. Le suivi du récif démarre en octobre avec les plongeurs bénévoles.','2026-08-30'),
  ('bibliotek-vwayaz-cilaos','Six îlets desservis','Le camion passe désormais à Îlet à Cordes et Bras Sec. Nous formons deux nouveaux médiateurs habitants.','2026-09-02'),
  ('ti-kolok-logement-saint-denis','Trois logements en travaux','Les trois premiers appartements de la rue Juliette Dodu sont en chantier, livraison prévue en décembre.','2026-08-14'),
  ('zarlor-tisane-saint-joseph','34 plantes documentées','Le travail de documentation avec les tisaneurs avance : 34 fiches complètes, avec usages et précautions.','2026-08-25'),
  ('lekol-la-mer-saint-leu','212 enfants ont appris à nager','88 % des enfants du dispositif réussissent le test de sécurité aquatique en fin de cycle.','2026-09-08'),
  ('rekup-eau-sainte-rose','Premier dispositif mutualisé en test','Cinq foyers de Bois Blanc testent le dispositif partagé depuis juillet. Nous cherchons dix foyers testeurs supplémentaires.','2026-08-18'),
  ('atelye-koutir-saint-andre','19 sorties positives','Sur 31 femmes formées depuis 2025, 19 sont aujourd''hui en emploi ou en formation qualifiante.','2026-09-04')
) AS n(slug,title,body,published_at) ON n.slug = p.slug;

INSERT INTO public.events (project_id, title, location, starts_at)
SELECT p.id, e.title, e.location, e.starts_at::timestamptz
FROM public.projects p
JOIN (VALUES
  ('kaz-lantant-saint-pierre','Atelier cuisine créole parents-enfants','Kaz Lantant, Ravine Blanche','2026-09-24 15:00+04'),
  ('kaz-lantant-saint-pierre','Assemblée du collectif de familles','Kaz Lantant, Ravine Blanche','2026-10-08 18:00+04'),
  ('rezo-lantiy-agroecologie','Journée portes ouvertes des fermes','Hauts de Saint-Paul','2026-10-05 09:00+04'),
  ('lo-fab-saint-benoit','Permanence réparation vélos','Lo Fab, Saint-Benoît','2026-09-20 09:00+04'),
  ('mounwar-numerique-le-port','Atelier outils libres pour associations','Le Port','2026-09-30 14:00+04'),
  ('lantouraz-mangrove-etang-sale','Chantier participatif de replantation','Plage de l''Étang-Salé','2026-10-11 07:30+04'),
  ('bibliotek-vwayaz-cilaos','Lecture créole à Îlet à Cordes','Îlet à Cordes, Cilaos','2026-09-27 10:00+04'),
  ('ti-kolok-logement-saint-denis','Réunion d''information jeunes en formation','Saint-Denis centre','2026-10-02 17:30+04'),
  ('zarlor-tisane-saint-joseph','Sortie cueillette accompagnée','Sud sauvage, Saint-Joseph','2026-10-18 08:00+04'),
  ('lekol-la-mer-saint-leu','Découverte du lagon en famille','Lagon de Saint-Leu','2026-09-28 09:00+04'),
  ('rekup-eau-sainte-rose','Chantier participatif d''installation','Bois Blanc, Sainte-Rose','2026-10-04 08:00+04'),
  ('atelye-koutir-saint-andre','Vente de la collection upcyclée','Atelye Koutir, Saint-André','2026-10-10 09:00+04')
) AS e(slug,title,location,starts_at) ON e.slug = p.slug;

INSERT INTO public.feedback (project_id, author_name, kind, body, rating, created_at)
SELECT p.id, f.author, f.kind, f.body, f.rating, f.created_at::timestamptz
FROM public.projects p
JOIN (VALUES
  ('kaz-lantant-saint-pierre','Ludmilla','avis','Mes deux enfants y vont depuis mars, l''aide aux devoirs a changé leur rapport à l''école.',5,'2026-08-22'),
  ('kaz-lantant-saint-pierre','Service jeunesse','idee','Pensez à ouvrir un créneau le samedi matin, beaucoup de parents travaillent en semaine.',NULL,'2026-08-29'),
  ('rezo-lantiy-agroecologie','Thierry','critique','Les tournées de livraison sautent parfois sans prévenir, il faudrait un vrai suivi des créneaux.',3,'2026-08-11'),
  ('rezo-lantiy-agroecologie','Nathalie','avis','Des produits de qualité et un prix juste pour les producteurs, on sent la différence.',5,'2026-08-24'),
  ('lo-fab-saint-benoit','Jean-Claude','avis','J''ai réparé ma machine à laver pour 12 euros de pièces. Les bénévoles prennent le temps d''expliquer.',5,'2026-07-30'),
  ('mounwar-numerique-le-port','Association Ansanm','avis','Notre site a été livré dans les délais et le code nous appartient vraiment.',5,'2026-08-02'),
  ('lantouraz-mangrove-etang-sale','Karine','idee','Ajoutez un tableau de bord public avec l''évolution du récif année par année.',NULL,'2026-08-31'),
  ('bibliotek-vwayaz-cilaos','Marie-Josée','avis','Le camion est attendu par tous les enfants de l''îlet, c''est devenu un rendez-vous.',5,'2026-09-03'),
  ('ti-kolok-logement-saint-denis','Étudiant BTS','avis','Un loyer sous 350 euros à Saint-Denis, c''est ce qui me permet de continuer ma formation.',4,'2026-08-19'),
  ('zarlor-tisane-saint-joseph','Un tisaneur','critique','Attention à ne pas standardiser les recettes, chaque famille a ses usages.',4,'2026-08-27'),
  ('lekol-la-mer-saint-leu','Parent d''élève','avis','Ma fille avait peur de l''eau, elle nage aujourd''hui 25 mètres.',5,'2026-09-09'),
  ('rekup-eau-sainte-rose','Foyer testeur','avis','Le dispositif tient bien, mais la notice de filtration mérite des schémas plus clairs.',4,'2026-08-21'),
  ('atelye-koutir-saint-andre','Ancienne stagiaire','avis','Je suis passée de la formation à un CDI dans un atelier de Saint-Denis.',5,'2026-09-06')
) AS f(slug,author,kind,body,rating,created_at) ON f.slug = p.slug;

INSERT INTO public.supports (project_id, kind, supporter_name, amount, message, created_at)
SELECT p.id, s.kind, s.name, s.amount, s.message, s.created_at::timestamptz
FROM public.projects p
JOIN (VALUES
  ('kaz-lantant-saint-pierre','benevole','Jean-Marc',NULL,'Disponible le mercredi pour l''aide aux devoirs.','2026-08-25'),
  ('kaz-lantant-saint-pierre','don','Anonyme',150,'Pour l''espace numérique.','2026-08-27'),
  ('rezo-lantiy-agroecologie','don','Famille Payet',300,'Bravo pour la vente directe.','2026-08-15'),
  ('lo-fab-saint-benoit','benevole','Sylvain',NULL,'Je peux tenir la permanence vélos deux samedis par mois.','2026-08-08'),
  ('mounwar-numerique-le-port','soutien','Collectif libre 974',NULL,'Nous relayons vos outils auprès de nos adhérents.','2026-07-20'),
  ('lantouraz-mangrove-etang-sale','benevole','Club de plongée',NULL,'Trois plongeurs pour le suivi du récif.','2026-09-01'),
  ('bibliotek-vwayaz-cilaos','don','Librairie de Cilaos',200,'Un lot de livres jeunesse en plus.','2026-08-12'),
  ('ti-kolok-logement-saint-denis','soutien','Mission locale Nord',NULL,'Nous orientons des jeunes vers vos colocations.','2026-08-22'),
  ('zarlor-tisane-saint-joseph','testeur','Herboristerie du Sud',NULL,'Nous testons vos premiers lots séchés.','2026-08-29'),
  ('lekol-la-mer-saint-leu','don','Comité d''entreprise',500,'Pour les créneaux piscine.','2026-09-02'),
  ('rekup-eau-sainte-rose','testeur','Foyer Bois Blanc',NULL,'Nous voulons tester le dispositif mutualisé.','2026-08-30'),
  ('atelye-koutir-saint-andre','don','Boutique solidaire',250,'Nous achetons la prochaine collection.','2026-09-05')
) AS s(slug,kind,name,amount,message,created_at) ON s.slug = p.slug;

INSERT INTO public.maturation_questions (project_id, question, answer, asked_by)
SELECT p.id, q.question, q.answer, q.asked_by
FROM public.projects p
JOIN (VALUES
  ('kaz-lantant-saint-pierre','Comment le projet se finance-t-il après la fin de la subvention d''amorçage ?','Une part des adhésions familiales et une convention pluriannuelle avec la commune sont en cours de négociation pour couvrir 60 % du fonctionnement.','IA'),
  ('kaz-lantant-saint-pierre','Quels indicateurs prouvent l''effet sur la réussite scolaire ?','Suivi des bulletins des enfants accompagnés, en lien avec deux écoles du quartier, comparé à leur trajectoire avant accompagnement.','Commune de Saint-Pierre'),
  ('rezo-lantiy-agroecologie','Comment la gouvernance protège-t-elle les plus petites fermes ?','Une voix par ferme quelle que soit sa taille, et un prix plancher garanti voté en assemblée.','IA'),
  ('lo-fab-saint-benoit','Quelle part du budget dépend de la revente d''objets réparés ?','Environ 12 % aujourd''hui, avec un objectif de 25 % en 2028.','IA'),
  ('mounwar-numerique-le-port','Comment se répartit la co-rémunération ?','Une grille publique fondée sur les heures déclarées et les charges de famille, révisée chaque semestre en assemblée.','IA'),
  ('lantouraz-mangrove-etang-sale','Qui garantit la fiabilité scientifique des relevés citoyens ?','Un protocole validé par un laboratoire partenaire et un double relevé sur 20 % des points.','Office de l''eau'),
  ('rekup-eau-sainte-rose','Quel est le statut juridique d''un dispositif partagé entre voisins ?','Une convention d''usage type entre foyers est en cours de rédaction avec un juriste bénévole.','IA')
) AS q(slug,question,answer,asked_by) ON q.slug = p.slug;

INSERT INTO public.calls (slug, title, institution, description, criteria, themes, need_types, budget_max, deadline, extra_questions) VALUES
('ess-2027-region', 'Appel à projets Économie sociale et solidaire 2027', 'Région Réunion', 'Soutien aux structures de l''ESS qui créent de l''emploi durable et de la coopération économique sur le territoire réunionnais.', ARRAY['Structure de l''ESS implantée à La Réunion','Modèle économique décrit sur 3 ans','Au moins un partenariat local formalisé','Emplois créés ou consolidés chiffrés'], ARRAY['social','agriculture','numerique','environnement'], ARRAY['financement','cofinanceurs'], 80000, '2027-01-31', '[{"id":"emplois","label":"Combien d''emplois le projet crée-t-il ou consolide-t-il sur 3 ans ?"},{"id":"modele","label":"Décrivez votre modèle économique après la subvention."},{"id":"partenaires","label":"Quels partenariats locaux sont formalisés ?"}]'::jsonb),
('transition-ecologique-communes', 'Transition écologique des communes', 'Département de La Réunion', 'Financement de projets citoyens de transition écologique portés avec au moins une commune réunionnaise.', ARRAY['Portage associatif ou coopératif','Lettre de soutien d''une commune','Indicateurs environnementaux mesurables','Dimension participative avérée'], ARRAY['environnement','agriculture'], ARRAY['financement','benevoles'], 50000, '2026-11-30', '[{"id":"commune","label":"Quelle commune soutient le projet et sous quelle forme ?"},{"id":"indicateurs","label":"Quels indicateurs environnementaux allez-vous suivre ?"},{"id":"participation","label":"Comment les habitants participent-ils aux décisions ?"}]'::jsonb),
('numerique-inclusif-2027', 'Numérique inclusif et communs numériques', 'CINOR', 'Appel destiné aux projets qui réduisent la fracture numérique ou produisent des communs numériques réutilisables.', ARRAY['Production sous licence libre ou ouverte','Public éloigné du numérique identifié','Plan de formation des usagers','Réutilisabilité par d''autres structures'], ARRAY['numerique','social','culture'], ARRAY['financement','outils_collectifs','visibilite'], 40000, '2027-03-15', '[{"id":"licence","label":"Sous quelle licence les productions seront-elles publiées ?"},{"id":"public","label":"Quel public éloigné du numérique visez-vous ?"},{"id":"reutilisation","label":"Comment une autre structure pourra-t-elle réutiliser vos productions ?"}]'::jsonb),
('jeunesse-et-sport-2027', 'Jeunesse, sport et cohésion sociale', 'DRAJES La Réunion', 'Soutien aux actions d''accès au sport, à la culture et à la citoyenneté pour les jeunes des quartiers prioritaires.', ARRAY['Public jeune de 6 à 25 ans','Action en quartier prioritaire ou zone isolée','Encadrement qualifié','Gratuité ou tarif solidaire'], ARRAY['sport','culture','social'], ARRAY['financement','benevoles','visibilite'], 30000, '2026-12-15', '[{"id":"public_jeune","label":"Combien de jeunes touchez-vous et de quelles tranches d''âge ?"},{"id":"encadrement","label":"Qui encadre et avec quelles qualifications ?"},{"id":"tarif","label":"Quelles conditions tarifaires appliquez-vous ?"}]'::jsonb);

INSERT INTO public.applications (call_id, project_id, answers, selected_sections, status, granted_amount)
SELECT c.id, p.id, a.answers::jsonb, a.sections::text[], a.status, a.granted
FROM public.calls c
JOIN (VALUES
  ('ess-2027-region','atelye-koutir-saint-andre','[{"question":"Combien d''emplois le projet crée-t-il ou consolide-t-il sur 3 ans ?","answer":"6 emplois permanents et 24 parcours de formation rémunérés par an."},{"question":"Décrivez votre modèle économique après la subvention.","answer":"60 % d''autofinancement par la vente des collections upcyclées, 40 % de financement des parcours d''insertion."}]','{presentation,budget,impact}','soutenu',45000),
  ('ess-2027-region','rezo-lantiy-agroecologie','[{"question":"Combien d''emplois le projet crée-t-il ou consolide-t-il sur 3 ans ?","answer":"3 emplois logistiques et le maintien de 14 exploitations familiales."},{"question":"Quels partenariats locaux sont formalisés ?","answer":"Conventions avec trois communes de l''Ouest et une coopérative de semences."}]','{presentation,budget,jalons}','en_instruction',NULL),
  ('transition-ecologique-communes','lantouraz-mangrove-etang-sale','[{"question":"Quelle commune soutient le projet et sous quelle forme ?","answer":"L''Étang-Salé met à disposition le foncier littoral et un agent technique."},{"question":"Quels indicateurs environnementaux allez-vous suivre ?","answer":"Surface replantée, taux de reprise des plants, indice de couverture corallienne."}]','{presentation,impact,jalons}','soutenu',14000),
  ('transition-ecologique-communes','rekup-eau-sainte-rose','[{"question":"Comment les habitants participent-ils aux décisions ?","answer":"Chaque dispositif mutualisé est décidé et installé en chantier participatif par les foyers concernés."}]','{presentation,besoins}','depose',NULL),
  ('numerique-inclusif-2027','mounwar-numerique-le-port','[{"question":"Sous quelle licence les productions seront-elles publiées ?","answer":"AGPL pour les applications, CC BY-SA pour la documentation."},{"question":"Comment une autre structure pourra-t-elle réutiliser vos productions ?","answer":"Dépôts publics documentés et guide d''installation en français."}]','{presentation,budget,impact}','soutenu',13000),
  ('jeunesse-et-sport-2027','lekol-la-mer-saint-leu','[{"question":"Combien de jeunes touchez-vous et de quelles tranches d''âge ?","answer":"212 enfants de 6 à 12 ans en 2026, objectif 300 par an."},{"question":"Quelles conditions tarifaires appliquez-vous ?","answer":"Gratuité totale pour les familles des quartiers prioritaires."}]','{presentation,impact}','soutenu',22000)
) AS a(call_slug,project_slug,answers,sections,status,granted) ON a.call_slug = c.slug
JOIN public.projects p ON p.slug = a.project_slug;