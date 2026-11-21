# Kaïna Flotte · back-end (version 1)

Ouvrir **controle.html** dans Chrome, Edge ou Safari (double-clic). Rien à installer.
Les données restent enregistrées dans le navigateur après rechargement.

## Les fichiers
- `moteur.js` : le moteur. Il range les données, applique les règles et calcule les alertes.
- `controle.html` : l'écran de contrôle (nombre d'enregistrements par table, import, liste des alertes).

## Les 3 tables
- **Véhicules** : n°, immatriculation, type, site d'origine, agence (calculée), conducteur, compteur, km dernière vidange, fin visite technique, fin assurance, km et litres du mois, statut, archivé. Calculés : vidange dans, consommation, écart à la référence, à vérifier.
- **Conducteurs** : n°, nom, téléphone, agence, catégorie de permis, fin de validité du permis, date d'embauche, véhicule affecté, statut, archivé.
- **Alertes** : n°, règle, priorité, concerne, agence, constat, proposition, créée le, à traiter avant, statut (Ouverte ou Disparue). Remplie uniquement par les règles.

## Les actions (pour les futurs écrans)
- `ajouter(table, fiche)`, `modifier(table, n°, changements)`, `supprimer(table, n°, motif)` (= archiver, récupérable avec `restaurer`), `rechercher(table, texte, filtres)`.
- Import en deux temps : `analyserImport(parc, conducteurs)` montre ce qui va changer sans rien enregistrer, puis `confirmerImport()` ou `annulerImport()`.
- Les tables Alertes ne s'ajoutent ni ne se modifient : toute tentative est refusée.

## Recette au 16/11/2026
Import des 2 CSV : 31 véhicules (V17 fusionné), 32 conducteurs, 13 alertes (5 P1, 4 P2, 4 P3), identiques au cahier des charges. Réimport : toujours 13 alertes. Aucun véhicule n'est immobilisé par l'application.
