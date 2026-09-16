# Présentation intégrée de projets.re

## Objectif
Créer dans l’application une présentation courte, convaincante et facile à parcourir au doigt, destinée aux citoyens, porteurs de projets, institutions et financeurs.

## Expérience proposée
- Ajouter une page dédiée `/presentation`, accessible depuis la navigation.
- Présenter 9 écrans plein cadre au format 16:9, avec un récit progressif : problème, promesse, fonctionnement, bénéfices par public, coopération, transparence, preuves visibles et appel à l’action.
- Permettre le swipe horizontal sur mobile et trackpad, les flèches clavier et des commandes précédent/suivant discrètes.
- Afficher la progression et permettre d’aller directement à un écran.
- Adapter chaque écran à la taille disponible sans texte coupé, avec une lecture claire sur ordinateur comme sur téléphone.
- Utiliser les données réelles déjà affichées par la plateforme pour les chiffres de démonstration, sans inventer d’impact.
- Proposer sur le dernier écran des accès directs vers les projets, le dépôt, les espaces citoyens et institutions.

## Direction visuelle
- Reprendre l’identité contrastée actuelle : ivoire, basalte, flamboyant et lagon.
- Alterner écrans clairs et sombres, avec une typographie éditoriale forte et des compositions variées.
- Utiliser des formes, pictogrammes et données de l’application plutôt qu’une succession de listes.
- Respecter la réduction des animations demandée par le navigateur.

## Détails techniques
- Créer une route TanStack dédiée avec ses propres métadonnées de partage.
- Construire un lecteur autonome à défilement horizontal avec `scroll-snap`, gestion clavier, suivi de l’écran actif et URL `?slide=N`.
- Masquer l’en-tête et le pied de page habituels pendant la présentation afin de consacrer l’espace au récit, tout en gardant une sortie claire vers le site.
- Charger les projets et appels existants pour calculer les indicateurs affichés.
- Vérifier le swipe, les commandes, l’URL, l’absence de débordement et la lisibilité sur mobile et ordinateur.
