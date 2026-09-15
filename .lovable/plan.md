# projets.re — plateforme des projets du territoire réunionnais

Une plateforme où chaque porteur dépose **une fiche projet unique**, la fait maturer avec l'aide d'une IA, répond à plusieurs appels à projets sans se répéter, et ouvre son projet aux citoyens (avis, bénévolat, cofinancement). Les institutions y publient les projets soutenus par de l'argent public.

## Ce que l'on construit

### 1. Espace public
- Accueil : le manifeste (une fiche, plusieurs dossiers), chiffres clés, projets à la une.
- Annuaire des projets : recherche, filtres par commune, thématique (ESS, environnement, culture, numérique, agriculture, social), type de besoin (financement, bénévoles, testeurs, avis, visibilité, outils collectifs) et stade d'avancement.
- Page projet : présentation, valeur ajoutée, besoins auxquels il répond, communauté, jalons et actions, agenda, actualités, budget ouvert (besoins et dépenses), indicateurs d'impact.
- Appels à projets : liste des AO ouverts publiés par les institutions, avec dates et critères.
- Pages « comprendre » : porteurs, institutions, citoyens, plus des exemples documentés par contexte.

### 2. Fiche unique et dépôt guidé
Un parcours par étapes :
1. « C'est quoi ton projet ? » — texte libre, l'IA propose nom, description, visuel, thématique, partenaires pertinents.
2. Besoins et financement — montants, nature des besoins, cofinanceurs recherchés.
3. Passage à l'action — jalons, actions, calendrier.
4. Publication — visibilité choisie, appel à contributions.

La fiche se complète dans le temps : chaque nouvelle question posée par une institution enrichit la fiche au lieu de créer un nouveau dossier.

### 3. Assistant IA de montage de projet
- Rédaction et amélioration de chaque section, avec suggestions acceptables en un clic.
- Phasage, structuration, découpage en jalons.
- Questions de maturation qui font progresser le dossier.
- Compagnon AO : détecte les appels à projets correspondants et adapte la fiche à un AO donné.
- Suivi : idées d'actions pour atteindre les objectifs annoncés.

### 4. Réponse aux appels à projets
Sélection d'un AO, réutilisation de la fiche, réponse aux questions complémentaires, aperçu et **export PDF d'une sélection d'éléments** du projet.

### 5. Communauté, cofinancement et transparence
- Avis et retours citoyens dans le temps, évaluation collective avec retours rapides pour améliorer un dossier.
- Soutien : intention de don, candidature bénévole, inscription comme testeur.
- Budget ouvert : besoins financiers, dépenses, cofinanceurs, réciprocités.
- Agenda, actualités, avancement mesurable (holoptisme) et actions annoncées par chacun (stigmergie), avec demande de validation par un pair.

### 6. Espace institutions
Publier un AO, suivre les candidatures, publier la liste des projets soutenus par de l'argent public avec les montants.

### 7. Suivi d'activité (préparation oceco)
Vue avancement et participation par personne, feuille de route #next par projet, liste d'actions ouvertes. Le lien technique avec oceco est préparé mais pas branché dans cette version.

## Données et comptes
- Base de données Lovable Cloud : projets, besoins, jalons, actions, dépenses, actualités, avis, soutiens, appels à projets, candidatures, contributeurs.
- Contenu de départ : une dizaine de projets inventés d'intérêt général et d'économie sociale et solidaire ancrés à La Réunion (communes réelles), plus 4 appels à projets d'exemple.
- Pas de comptes utilisateurs dans cette version : le dépôt, les avis et les soutiens fonctionnent sans connexion, avec des espaces porteur et institution accessibles directement. Les comptes et droits viendront ensuite.

## Détails techniques
- TanStack Start, routes séparées par section (`/`, `/projets`, `/projets/$slug`, `/deposer`, `/appels`, `/appels/$slug`, `/institutions`, `/citoyens`, `/exemples`), métadonnées SEO propres à chaque page.
- Lovable Cloud pour la persistance ; lectures publiques ouvertes, écritures via server functions validées par zod.
- IA via Lovable AI (serveur uniquement) : génération de fiche, amélioration de section, questions de maturation, correspondance projet ↔ AO.
- Export PDF généré côté client à partir de la sélection d'éléments.
- Sans comptes, les écritures publiques sont limitées en volume et en taille de champ pour éviter les abus.

## Étapes de livraison
1. Base de données + données d'exemple, design system réunionnais (typographie, palette, composants).
2. Espace public : accueil, annuaire, page projet, AO, pages explicatives.
3. Dépôt guidé + assistant IA de rédaction et maturation.
4. Réponse à un AO + export PDF.
5. Communauté, avis, soutiens, budget ouvert, agenda, indicateurs.
6. Espace institutions et vue suivi d'activité.

## Hors périmètre pour l'instant
Paiements réels, connexion technique à oceco, comptes et rôles, veille automatique des AO externes.
