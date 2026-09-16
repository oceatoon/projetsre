# Des profils pour participer vraiment

Aujourd'hui tout se fait sans identité : les avis, soutiens, actions et coopérations sont signés d'un nom libre. On ajoute des comptes, un profil public et un rôle, puis on relie chaque contribution à son auteur.

## Comptes et connexion

- Page **/connexion** : création de compte et connexion par e-mail + mot de passe, plus connexion Google en un clic.
- À la première connexion, un court accueil demande : nom affiché, commune, courte présentation, rôle principal (citoyen, porteur de projet, institution).
- Menu en haut à droite : mon profil, mes projets, mes contributions, se déconnecter.
- La consultation reste libre : personne n'a besoin de compte pour lire la plateforme.

## Profil

- Page **/profil/$identifiant** publique : nom, commune, présentation, rôle, projets portés, contributions visibles (avis, actions, soutiens non confidentiels), coopérations.
- Page **/moi** privée : modifier son profil, retrouver ses projets, ses réponses aux appels, ses questions de maturation en attente, ses coopérations.

## Ce que chaque rôle peut faire

- **Citoyen** : donner un avis, soutenir (don, bénévolat, test), raconter une action, valider l'action d'un pair, participer aux fils de coopération.
- **Porteur** : déposer une fiche, la modifier ensuite, répondre aux appels, ajouter jalons, actions, dépenses, actualités, événements, répondre aux questions de maturation, ouvrir une coopération.
- **Institution** : publier un appel, suivre les candidatures, déclarer un projet soutenu et le montant.

## Contributions signées

Chaque écriture existante est rattachée au compte connecté (avis, soutiens, actions, questions, messages et étapes de coopération, fiches, appels, candidatures). Les contributions déjà en base restent affichées avec leur nom actuel.

Sans être connecté, on peut encore lire ; pour contribuer, un encart « Connectez-vous pour participer » apparaît à la place du formulaire, sans redirection brutale.

## Détails techniques

- Auth Lovable Cloud : e-mail/mot de passe + Google (fournisseur configuré dans le même mouvement). Pas d'inscription anonyme.
- Table `profiles` (id = utilisateur, handle unique, display_name, commune, bio, avatar_url, role) créée à l'inscription par déclencheur, plus table `user_roles` séparée avec fonction `has_role` pour les droits.
- Colonne `owner_id` / `author_id` ajoutée aux tables d'écriture, remplie côté serveur depuis la session ; RLS resserrée : lecture publique conservée, écriture réservée aux comptes connectés, modification réservée au propriétaire (fiche projet, appel) ou à l'auteur (avis, action).
- Routes protégées sous `_authenticated/` (mon espace, dépôt, réponse à un appel, espace institution) ; les pages publiques restent en rendu serveur pour le partage.
- Les formulaires publics existants passent par des fonctions serveur authentifiées ; le jeton est attaché automatiquement.

## Étapes

1. Base : `profiles`, `user_roles`, `has_role`, colonnes d'auteur, RLS resserrée.
2. Connexion, accueil de profil, menu compte.
3. Pages profil public et mon espace.
4. Formulaires reliés au compte + encarts « connectez-vous pour participer ».
5. Droits par rôle sur dépôt, appels, institutions, coopérations.

## Hors périmètre

Paiements réels, invitations d'équipe sur une même fiche, modération avancée, connexion oceco.
