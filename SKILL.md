---
name: kaina-marque
description: Applique la charte de marque Kaïna Distribution (piste « Deux points », palette Proximité) à tout contenu produit pour Kaïna. À utiliser dès qu'on rédige, relit ou met en page un message commercial, un SMS ou WhatsApp aux commerçants, un document commercial, une communication interne, une affiche, un visuel, une slide ou une maquette au nom de Kaïna Distribution, ou quand on demande si un contenu « respecte la marque Kaïna ».
---

# Kaïna Distribution — application de la marque

Statut : **proposition de charte non approuvée** (rebranding 2026, en attente de validation par la Direction marketing & communication puis la Direction générale). Tant que ce statut n'est pas levé, chaque livrable produit avec ce skill porte la mention « Projet — identité en cours de validation ».

Références détaillées dans `references/charte.md`. Vérification automatique : `scripts/verifier_message.py`.

## 1. Avant d'écrire : qualifier la demande

1. Identifier le public : **commerçant** (épicerie, café-hôtel-restaurant, supérette ou grande surface), **partenaire B2B** (fournisseur, prestataire) ou **collaborateur** (pré-vendeur, livreur, agence, siège).
2. Identifier le canal : SMS/WhatsApp, e-mail, document imprimé, affiche, application, véhicule, uniforme, présentation.
3. Lister les faits dont le message a besoin. Chaque fait doit venir de la liste « Faits autorisés » (`references/charte.md`, section 1) ou d'une source fournie dans la conversation. Sinon, écrire un emplacement entre crochets : `[DATE À CONFIRMER]`, `[OFFRE VALIDÉE PAR LA DIRECTION COMMERCIALE]`.

## 2. Règles éditoriales (toutes vérifiables)

| # | Règle | Comment vérifier |
|---|-------|------------------|
| R1 | Aucun chiffre, pourcentage, délai ou montant qui ne figure pas dans les faits autorisés ou dans une source fournie. | Chaque nombre du texte est présent dans la liste blanche ou entre crochets. |
| R2 | Aucune promesse non validée : pas de « garanti », « toujours », « 100 % », « sans faute », délai de livraison chiffré, remise chiffrée, gratuité. | Aucun mot de la liste « promesses interdites » (`charte.md` §3). |
| R3 | Aucun superlatif comparatif invérifiable : « n°1 », « leader », « le meilleur », « le moins cher », « imbattable ». | Aucun mot de la liste « superlatifs interdits ». |
| R4 | Aucun témoignage, citation de client ou de collaborateur inventé. | Toute citation entre guillemets a une source nommée et fournie. |
| R5 | Vouvoiement pour les commerçants et partenaires. Tutoiement seulement en interne si la demande le précise. | Pas de « tu », « ton », « ta », « tes » dans un message externe. |
| R6 | Phrases courtes : 20 mots maximum par phrase pour un SMS/WhatsApp, 25 ailleurs. | Compter les mots par phrase. |
| R7 | Un message = une action claire pour le lecteur (commander, confirmer, rappeler, signaler). | Une seule demande d'action identifiable. |
| R8 | Nom de marque écrit « Kaïna » (avec tréma) en texte courant ; « Kaïna Distribution » à la première mention dans un document. Jamais « KAINA », « Kaina » ou « Kaïna distrib ». | Recherche des graphies interdites. |
| R9 | Le programme s'écrit « Cap Service 2027 », entre guillemets français à la première mention. | Graphie exacte. |
| R10 | Le logo, les couleurs ou la charte ne sont jamais présentés comme « officiels », « approuvés » ou « définitifs » tant que le statut n'est pas levé. | Aucun de ces mots associé au logo ou à la charte. |

Ton : **clair, chaleureux, concret.** On parle au commerçant comme un partenaire de quartier qui respecte son temps : on dit quoi, quand, et ce qu'il doit faire. Pas de jargon logistique (« OTIF », « taux de service ») dans un message externe ; dire « livraison complète et à l'heure ».

## 3. Règles visuelles

- Couleurs autorisées, et seulement elles (plus noir #111111 et blanc #FFFFFF) :
  - Vert cèdre `#0F5C4A` — couleur principale, logo, textes de titre, fonds forts.
  - Safran `#F2A900` — accent : les deux points du logo, boutons, pictos. Jamais de texte safran sur fond clair.
  - Terre cuite `#C4532D` — secondaire : promotions, signalétique, titres de 24 px et plus.
  - Sable `#F6EFE3` — fond neutre.
- Texte courant : vert cèdre ou noir #111111 sur blanc ou sable. Contraste minimum 4,5:1.
- Typographie : Inter (titres en Bold/SemiBold, texte en Regular). Arabe : IBM Plex Sans Arabic. Remplacement bureautique : Arial (latin et arabe).
- Logo : utiliser uniquement les fichiers fournis (`logos/final/`). Zone de protection = hauteur d'un point du ï tout autour. Taille minimale : 24 mm de large en impression, 96 px à l'écran ; en dessous, utiliser l'icône « ï ».
- Interdits logo : déformer, recolorer hors des versions fournies, ajouter une ombre ou un contour, changer la couleur des deux points pour une autre que safran (version couleur) ou celle du texte (versions monochromes), poser la version couleur sur une photo chargée.

## 4. Procédure de production

1. Qualifier (section 1).
2. Rédiger en appliquant R1 à R10.
3. Lancer la vérification : `python3 scripts/verifier_message.py --canal sms|email|doc --public externe|interne fichier.txt` (ou coller le texte sur l'entrée standard).
4. Corriger chaque point signalé, ou remplacer l'information par un emplacement entre crochets.
5. Livrer avec, en dessous du contenu :
   - « Faits utilisés » : la liste des faits et leur source ;
   - « À valider » : chaque emplacement entre crochets et la personne qui doit le valider (voir `charte.md` §6).

## 5. Procédure de contrôle (quand on demande de relire un contenu)

Rendre un verdict **Conforme / Non conforme** suivi d'un tableau : règle, extrait fautif, correction proposée. Proposer ensuite une version corrigée qui passe le script sans alerte. Ne jamais « corriger » un chiffre en inventant un autre chiffre : le remplacer par un emplacement entre crochets.

## 6. Escalade

- Toute nouvelle promesse commerciale, remise ou délai → Direction commerciale et Direction générale.
- Tout usage du logo hors des cas prévus (co-branding, nouveau support) → Direction marketing & communication.
- Toute communication sur les ressources humaines (recrutement, turnover) → Direction des ressources humaines.
