# Campagnes : lancer et suivre des campagnes au service d'un projet

Un nouvel espace « Campagnes » sur chaque fiche projet. Le porteur y lance des campagnes guidées, planifie ses messages avec l'aide de l'IA, suit les résultats automatiquement et montre ce que chaque campagne a apporté au projet.

## Quatre modèles de campagne
Chaque modèle arrive avec des étapes, un calendrier de messages proposé et des indicateurs suivis automatiquement.

1. **Bénévoles et accueil** — appel à bénévoles, puis parcours d'accueil pour chaque personne : inscrit, contacté, rencontré, première mission, régulier. Le porteur fait avancer chaque bénévole d'une étape à l'autre.
2. **Communication régulière** — un rythme choisi (hebdomadaire, mensuel), une série de messages prévus : actus, coulisses, remerciements, résultats.
3. **Financement** — objectif chiffré, paliers, période, relances programmées ; suivi des promesses de dons reçues.
4. **Lancement de produit** — avant-première avec testeurs, compte à rebours, ouverture publique, retours après lancement.

## Planifier des messages construits
- Calendrier de la campagne avec, pour chaque message : date, canal (e-mail aux abonnés, réseaux sociaux, affichage/terrain), public visé, texte.
- Bouton « Rédiger avec l'assistant » : l'IA propose toute la séquence de messages à partir du projet et de l'objectif, message par message, modifiable avant validation.
- **E-mail** : les messages e-mail partent automatiquement à la date prévue vers les personnes abonnées au projet.
- **Réseaux** : texte prêt à copier en un clic, le porteur coche « publié ».
- Sur la fiche projet, un bouton « Suivre ce projet » permet aux citoyens connectés de s'abonner (et de se désabonner) aux messages.

## Suivre les résultats (automatique)
Chaque campagne compte ce que la plateforme voit pendant sa période :
- bénévoles inscrits et avancés dans l'accueil,
- promesses de dons et montant total vs objectif,
- inscriptions de testeurs, avis reçus, nouveaux abonnés,
- messages envoyés et nombre de destinataires.
Barre d'avancement vers l'objectif, courbe simple jour par jour.

## Montrer ce que ça apporte au projet
- Bilan de campagne : objectif, résultat, écart, et un court récit généré par l'IA (« ce que cette campagne a changé »), relu par le porteur.
- Le porteur choisit pour chaque campagne : **publique** (visible dans un nouvel onglet « Campagnes » de la fiche projet et sur la page d'accueil des campagnes en cours) ou **privée** (visible seulement par lui).
- Les campagnes publiques ont un bouton d'action clair pour les citoyens : « Je deviens bénévole », « Je promets un don », « Je teste », selon le modèle.

## Où ça se trouve
- Fiche projet : onglet « Campagnes » (campagnes publiques + bouton d'abonnement).
- Espace du porteur : page de pilotage d'une campagne (calendrier, messages, bénévoles, résultats, bilan).
- « Mon espace » : liste des campagnes du porteur.

## Détails techniques
- Nouvelles tables : `campaigns` (projet, modèle, titre, objectif, montant cible, dates, visibilité, statut, bilan), `campaign_messages` (date prévue, canal, public, texte, statut prévu/envoyé/publié, nb destinataires), `campaign_volunteers` (personne, étape d'accueil, notes), `project_followers` (abonnements). RLS : lecture publique uniquement des campagnes publiques, pilotage réservé au propriétaire du projet.
- Résultats calculés à la volée à partir des tables existantes (supports, feedback, abonnés) filtrées sur la période de la campagne — rien à stocker en double.
- IA : génération de séquence de messages et du récit de bilan via les fonctions serveur existantes.
- E-mail : mise en place du domaine d'envoi de la plateforme et d'un modèle d'e-mail de campagne ; un envoi programmé une fois par heure traite les messages arrivés à échéance, par petits lots, sans double envoi, avec lien de désabonnement.
- Routes : onglet dans `/projets/$slug`, pilotage sous `/_authenticated/campagnes/$id`, création `/_authenticated/campagnes/nouvelle`.

## Étapes
1. Tables, abonnements et onglet public « Campagnes ».
2. Création guidée par modèle + pilotage (calendrier, bénévoles, visibilité).
3. Assistant de rédaction des messages et bilan IA.
4. Résultats automatiques et bilan.
5. Envoi e-mail programmé (nécessite la configuration d'un domaine d'envoi).

## Hors périmètre
Publication automatique sur les réseaux sociaux, paiements réels, statistiques d'ouverture des e-mails.
