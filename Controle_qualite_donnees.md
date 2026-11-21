# Mission 03 — Contrôle qualité du fichier de reporting financier

Fichier : `M3_Reporting_Financier_Agences_Nov2025-Oct2026.xlsx` (feuilles Donnees, Objectifs). Aucune correction appliquée, aucun total calculé.

## Contrôles passés
| # | Contrôle | Résultat |
|---|---|---|
| C0 | Structure : 6 agences × 12 mois = 72 lignes, lignes masquées, formules | 73 lignes, rien de masqué, 0 formule (valeurs figées) |
| C1 | Cases vides, nombres stockés en texte | Aucun |
| C2 | Doublons exacts et doublons de clé (Mois, Agence) | 1 doublon : Tanger 2026-06 |
| C3 | Complétude des mois par agence | OK (Tanger 13 lignes à cause du doublon) |
| C4 | Marge brute = CA − Achats | 1 écart : Fès 2026-03 |
| C5 | EBITDA = MB − personnel − logistique − autres | Toujours cohérent |
| C6 | Valeurs impossibles (montants négatifs, MB > CA) | Marrakech 2026-08 |
| C7 | Unités : valeur > 5× ou < 1/5 de la médiane de l'agence | Fès 2026-03 (CA), Marrakech 2026-08 |
| C8 | Ratios hors plage (taux MB 13–16 %, réalisation budget 85–115 %) | Erreurs ci-dessus + signaux métier Agadir/Casablanca |
| C10 | Feuille Objectifs | Seuils saisis en texte (« ≥ 14 % ») |

## Anomalies et corrections proposées
| Ligne Excel | Problème | Correction proposée | Risque si on ne corrige pas |
|---|---|---|---|
| L33 et L34 — Tanger 2026-06 | Doublon exact (13 mois pour Tanger) | Supprimer L34 | CA, marge et EBITDA de Tanger gonflés d'un mois (≈ +13,3 MMAD de CA, +8 %) ; total groupe faussé |
| L43 — Fès 2026-03, CA | Erreur d'unité : 11 849 000 saisi en MAD au lieu de kMAD (CA − Achats = 1 730 = MB saisie si CA = 11 849) | CA = 11 849 | CA groupe multiplié par ~45 sur l'année ; tous les ratios et la réalisation budget (100 051 %) inutilisables |
| L60 — Marrakech 2026-08, Achats | Valeur impossible : achats négatifs (−8 069), signe inversé | Achats = 8 069 → MB = 1 344 → EBITDA = 343 (taux MB 14,3 %, cohérent) | MB 17 482 et EBITDA 16 481 (≈ 40× la normale) : Marrakech paraîtrait l'agence la plus rentable du groupe |
| Feuille Objectifs, B2:B5 | Seuils stockés en texte avec opérateur | Ajouter une colonne numérique (1,00 / 0,14 / 0,035 / 0,035) + sens | Comparaison automatique impossible, risque d'erreur de lecture |

## Points à signaler, sans erreur de saisie (calculs cohérents)
| Ligne | Constat | Proposition | Risque |
|---|---|---|---|
| L69–L74 — Agadir mai–oct. 2026 | EBITDA négatif 6 mois de suite, taux MB 12,5–12,9 % (< 14 %) ; avril EBITDA = 1 | Ne pas corriger : signal métier à confirmer avec l'agence | Le confondre avec une erreur et l'effacer masquerait une dérive réelle |
| L12 — Casablanca 2026-09 | Taux MB 12,8 % | Ne pas corriger ; vérifier remises ou prix d'achat | Idem |
| Toute la feuille | Extraction « non retraitée », valeurs sans formules | Recalculer MB et EBITDA par formule après correction | Une nouvelle erreur de saisie ne serait pas détectée |
