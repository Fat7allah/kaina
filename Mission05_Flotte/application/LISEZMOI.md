# Kaïna Flotte · application v1

Ouvrir **index.html** dans Chrome, Edge ou Safari (double-clic), sur ordinateur ou téléphone. Rien à installer.
Première fois : Import / export → déposer les 2 CSV → Vérifier les fichiers → Confirmer l'import.

## Fichiers
- `index.html` : l'application (les écrans).
- `moteur.js` : le back-end. Il range les données, applique les règles et calcule les alertes.
- `controle.html` : l'écran de contrôle technique (compteurs par table, liste des alertes).

## Les écrans
1. **Tableau de bord** : bandeau rouge « Ne roulent pas aujourd'hui », véhicules, alertes P1/P2/P3, échéances à 30 jours, coût carburant du mois par agence.
2. **Véhicules** et 3. **Conducteurs** : recherche, filtres (agence, type ou permis, statut, archivés), fiche détaillée avec le conducteur ou le véhicule lié, boutons Ajouter, Modifier, Supprimer (= archiver, restaurable).
4. **Alertes** : P1 en rouge en haut ; boutons Valider, Reporter (date + motif), Escalader (motif). Chaque décision affiche qui et quand. Raccourci « Mettre à jour l'assurance / la visite technique / le permis ».
5. **Import / export** : import en 2 temps, export CSV pour Excel, réglages (nom de la personne, date de calcul).

## Les 3 tables
- **Véhicules**, **Conducteurs** : saisies (import ou formulaire).
- **Alertes** : calculées par les règles, jamais saisies. On peut seulement y prendre une décision (Valider, Reporter, Escalader), qui ne change jamais le statut d'un véhicule ou d'un conducteur.

## Limites de la v1
- Données gardées dans le navigateur de l'ordinateur ou du téléphone utilisé : pas encore partagées entre personnes.
- Pas encore de profils (chef d'agence, direction) ni de connexion : la personne qui décide est réglée dans Import / export.
