/* =====================================================================
   Kaïna Flotte · moteur (back-end)
   ---------------------------------------------------------------------
   Ce fichier range les données et calcule les alertes.
   Il ne dessine aucun écran : les écrans viendront ensuite.

   3 tables : vehicules, conducteurs, alertes.
   Les alertes sont calculées par les règles, jamais saisies à la main.
   Aucune règle ne change le statut d'un véhicule ou d'un conducteur :
   l'application propose, l'humain décide.
   ===================================================================== */
(function (racine) {
  "use strict";

  /* ---------------------------------------------------------------
     1. Réglages (les chiffres des règles, modifiables par Driss)
     --------------------------------------------------------------- */
  var REGLAGES_PAR_DEFAUT = {
    dateDuJour: "16/11/2026",          // date de calcul ; vide = vraie date du jour
    echeanceProcheJours: 30,           // « moins de 30 jours » = 0 à 29 jours
    vidangeProcheKm: 1000,
    surconsommationPct: 25,
    prixGasoil: 13.5,                  // MAD par litre
    utilisateur: "Driss Amghar",       // la personne qui décide (écrit dans les décisions)
    types: {
      "VP pré-vendeur": { referenceL100: 7,  intervalleVidange: 15000, permis: "B" },
      "VP direction":   { referenceL100: 8,  intervalleVidange: 15000, permis: "B" },
      "VUL 3,5 t":      { referenceL100: 11, intervalleVidange: 10000, permis: "B" },
      "Camion 7,5 t":   { referenceL100: 18, intervalleVidange: 10000, permis: "C" }
    },
    sites: {                           // site du fichier → agence
      "Casablanca": "Casablanca", "Mohammedia": "Casablanca",
      "Rabat": "Rabat-Salé", "Salé": "Rabat-Salé", "Témara": "Rabat-Salé",
      "Rabat-Salé": "Rabat-Salé",
      "Tanger": "Tanger", "Fès": "Fès", "Marrakech": "Marrakech", "Agadir": "Agadir"
    }
  };

  var DELAI_JOURS = { P1: 0, P2: 7, P3: 15 };

  /* Colonnes attendues dans les deux fichiers CSV */
  var COLONNES_PARC = ["id", "immatriculation", "type", "agence", "conducteur",
    "km_compteur", "km_derniere_vidange", "fin_visite_technique", "fin_assurance",
    "km_octobre", "carburant_octobre_L", "statut"];
  var COLONNES_CONDUCTEURS = ["id_conducteur", "nom", "telephone", "agence",
    "categorie_permis", "fin_validite_permis", "date_embauche", "vehicule_affecte", "statut"];

  /* ---------------------------------------------------------------
     2. Petits outils (dates, nombres)
     --------------------------------------------------------------- */
  function versDate(jjmmaaaa) {                    // "02/11/2026" → Date
    if (!jjmmaaaa) return null;
    var p = String(jjmmaaaa).trim().split("/");
    if (p.length !== 3) return null;
    var d = new Date(Date.UTC(+p[2], +p[1] - 1, +p[0]));
    return isNaN(d) ? null : d;
  }
  function versTexte(date) {                       // Date → "02/11/2026"
    var j = String(date.getUTCDate()).padStart(2, "0");
    var m = String(date.getUTCMonth() + 1).padStart(2, "0");
    return j + "/" + m + "/" + date.getUTCFullYear();
  }
  function ajouterJours(date, n) { return new Date(date.getTime() + n * 86400000); }
  function joursEntre(a, b) { return Math.round((b - a) / 86400000); }
  function nombre(v) {
    if (v === null || v === undefined || String(v).trim() === "") return null;
    var n = Number(String(v).replace(/\s/g, "").replace(",", "."));
    return isNaN(n) ? null : n;
  }
  function km(n) { return Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " "); }
  function copie(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------------------------------------------------------------
     3. Sauvegarde : les données restent après rechargement
        (dans le navigateur ; en mémoire si aucun navigateur)
     --------------------------------------------------------------- */
  var CLE = "kaina-flotte-v1";
  var memoire = {};
  var stockage = {
    lire: function () {
      try { if (racine.localStorage) return racine.localStorage.getItem(CLE); } catch (e) {}
      return memoire[CLE] || null;
    },
    ecrire: function (texte) {
      try { if (racine.localStorage) { racine.localStorage.setItem(CLE, texte); return; } } catch (e) {}
      memoire[CLE] = texte;
    }
  };

  function baseVide() {
    return { vehicules: [], conducteurs: [], alertes: [],
             reglages: copie(REGLAGES_PAR_DEFAUT), compteurAlertes: 0, dernierImport: null };
  }
  var base = (function () {
    var t = stockage.lire();
    if (!t) return baseVide();
    try { return JSON.parse(t); } catch (e) { return baseVide(); }
  })();
  function enregistrer() { stockage.ecrire(JSON.stringify(base)); }

  function aujourdhui() {
    var d = versDate(base.reglages.dateDuJour);
    if (d) return d;
    var n = new Date();
    return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
  }

  /* ---------------------------------------------------------------
     4. Champs calculés (personne ne les saisit)
     --------------------------------------------------------------- */
  function agenceDuSite(site) {
    return base.reglages.sites[(site || "").trim()] || (site || "").trim();
  }
  function calculerVehicule(v) {
    var t = base.reglages.types[v.type] || {};
    v.agence = agenceDuSite(v.siteOrigine);
    // Compteur incohérent → « à vérifier », aucun calcul de vidange
    v.aVerifier = (v.compteur !== null && v.kmDerniereVidange !== null && v.compteur < v.kmDerniereVidange);
    v.raisonAVerifier = v.aVerifier
      ? "Compteur (" + km(v.compteur) + " km) plus bas que la dernière vidange (" + km(v.kmDerniereVidange) + " km)"
      : "";
    v.vidangeDansKm = (!v.aVerifier && t.intervalleVidange && v.compteur !== null && v.kmDerniereVidange !== null)
      ? v.kmDerniereVidange + t.intervalleVidange - v.compteur : null;
    // Consommation du mois, non calculée si 0 km
    v.consoL100 = (v.kmMois > 0 && v.litresMois !== null)
      ? Math.round(v.litresMois / v.kmMois * 1000) / 10 : null;
    v.ecartReferencePct = (v.consoL100 !== null && t.referenceL100)
      ? Math.round((v.consoL100 / t.referenceL100 - 1) * 100) : null;
    v.coutMoisMAD = v.litresMois !== null ? Math.round(v.litresMois * base.reglages.prixGasoil) : null;
    return v;
  }

  /* ---------------------------------------------------------------
     5. Les règles d'alerte
        Chaque règle renvoie : clé unique de la situation, priorité,
        cible, constat, proposition.
     --------------------------------------------------------------- */
  function trouverVehiculeParImmat(immat) {
    return base.vehicules.find(function (v) { return !v.archive && v.immatriculation === immat; });
  }

  function calculerSituations() {
    var R = base.reglages, jour = aujourdhui(), s = [];
    var vehicules = base.vehicules.filter(function (v) { return !v.archive; });
    var conducteurs = base.conducteurs.filter(function (c) { return !c.archive; });
    var lien = {};                     // véhicule et conducteur concernés par la situation en cours
    function ajout(cle, regle, prio, cible, agence, constat, proposition) {
      s.push({ cle: cle, regle: regle, priorite: prio, cible: cible, agence: agence,
               constat: constat, proposition: proposition,
               immatriculation: lien.immat || "", numeroConducteur: lien.cond || "" });
    }

    vehicules.forEach(function (v) {
      calculerVehicule(v);
      var cible = v.numero + " · " + v.immatriculation + " · " + v.type;
      var cond = conducteurs.find(function (c) { return c.vehiculeAffecte === v.immatriculation; });
      lien = { immat: v.immatriculation, cond: cond ? cond.numero : "" };
      var enService = v.statut === "En service";
      var fv = versDate(v.finVisiteTechnique), fa = versDate(v.finAssurance);

      // Règle 8 · P1 · visite technique expirée, véhicule en service
      if (enService && fv && fv < jour)
        ajout(v.id + "|vt-expiree", "Visite technique expirée", "P1", cible, v.agence,
          "Visite technique expirée le " + v.finVisiteTechnique + ", véhicule en service.",
          "Proposer l'immobilisation au chef de parc, prendre rendez-vous.");
      // Règle 9 · P1 · assurance expirée, véhicule en service
      if (enService && fa && fa < jour)
        ajout(v.id + "|assurance-expiree", "Assurance expirée", "P1", cible, v.agence,
          "Assurance expirée le " + v.finAssurance + ", véhicule en service.",
          "Proposer l'immobilisation au chef de parc jusqu'au renouvellement.");
      // Règle 10 · P1 · carburant consommé par un véhicule immobilisé
      if (v.statut === "Immobilisé" && v.litresMois > 0)
        ajout(v.id + "|carburant-immobilise", "Carburant sur véhicule immobilisé", "P1", cible, v.agence,
          "Immobilisé, " + km(v.kmMois || 0) + " km et " + km(v.litresMois) + " L de gasoil sur le mois.",
          "Vérifier la carte carburant et l'usage du véhicule.");
      // Règle 13 · P2 · visite technique ou assurance qui expire dans moins de 30 jours
      [["Visite technique", fv, v.finVisiteTechnique, "vt-proche"],
       ["Assurance", fa, v.finAssurance, "assurance-proche"]].forEach(function (e) {
        if (!e[1]) return;
        var n = joursEntre(jour, e[1]);
        if (n >= 0 && n < R.echeanceProcheJours)
          ajout(v.id + "|" + e[3], e[0] + " à renouveler", "P2", cible, v.agence,
            e[0] + " le " + e[2] + ", dans " + n + " jours.", "Prendre rendez-vous ou renouveler.");
      });
      // Règles 14 et 17 · vidange dépassée (P2) ou proche (P3)
      if (v.vidangeDansKm !== null) {
        if (v.vidangeDansKm < 0)
          ajout(v.id + "|vidange-depassee", "Vidange dépassée", "P2", cible, v.agence,
            "Vidange dépassée de " + km(-v.vidangeDansKm) + " km (" + km(v.compteur) +
            " km au compteur, dernière à " + km(v.kmDerniereVidange) + ").", "Planifier la vidange.");
        else if (v.vidangeDansKm < R.vidangeProcheKm)
          ajout(v.id + "|vidange-proche", "Vidange proche", "P3", cible, v.agence,
            "Vidange dans " + km(v.vidangeDansKm) + " km.", "Planifier la vidange.");
      }
      // Règle 15 · P2 · surconsommation (jamais sur un véhicule immobilisé)
      if (enService && v.ecartReferencePct !== null && v.ecartReferencePct > R.surconsommationPct)
        ajout(v.id + "|surconsommation", "Surconsommation", "P2", cible, v.agence,
          v.consoL100.toString().replace(".", ",") + " L/100 km sur le mois pour une référence de " +
          R.types[v.type].referenceL100 + ", soit +" + v.ecartReferencePct + " %.",
          "Vérifier : fuite, carte carburant, itinéraire. Aucune sanction automatique.");
      // Règle 18 · P3 · véhicule sans conducteur
      var conduitPar = conducteurs.some(function (c) { return c.vehiculeAffecte === v.immatriculation; });
      if (!v.conducteur && !conduitPar) {
        var libres = conducteurs.filter(function (c) {
          return c.agence === v.agence && !c.vehiculeAffecte && c.statut !== "Congé";
        }).map(function (c) { return c.nom + " (" + c.numero + ")"; });
        ajout(v.id + "|sans-conducteur", "Véhicule sans conducteur", "P3", cible, v.agence,
          "Véhicule sans conducteur.",
          "Signaler au chef d'agence" + (libres.length ? ", conducteur libre de l'agence : " + libres.join(", ") : "") + ".");
      }
      // Règle 20 · P3 · donnée à vérifier
      if (v.aVerifier)
        ajout(v.id + "|a-verifier", "Donnée à vérifier", "P3", cible, v.agence,
          v.raisonAVerifier + ".", "Vérifier le compteur. Aucune alerte de vidange tant que ce n'est pas corrigé.");
    });

    conducteurs.forEach(function (c) {
      var veh = c.vehiculeAffecte ? trouverVehiculeParImmat(c.vehiculeAffecte) : null;
      lien = { immat: veh ? veh.immatriculation : "", cond: c.numero };
      var cible = c.numero + " · " + c.nom + (veh ? " · " + veh.type + " " + veh.immatriculation : "");
      var fp = versDate(c.finValiditePermis);

      // Règle 11 · P1 · permis expiré, affecté à un véhicule en service
      if (fp && fp < jour && veh && veh.statut === "En service")
        ajout(c.id + "|permis-expire", "Permis expiré", "P1", cible, c.agence,
          "Permis expiré le " + c.finValiditePermis + ".",
          "Le conducteur ne prend pas le volant tant que le chef de parc n'a pas réglé la situation.");
      // Règle 12 · P1 · catégorie de permis non adaptée au véhicule
      if (veh) {
        var requis = (base.reglages.types[veh.type] || {}).permis;
        var ok = !requis || c.categoriePermis === requis || (requis === "B" && c.categoriePermis === "C");
        if (!ok)
          ajout(c.id + "|permis-non-adapte", "Permis non adapté", "P1", cible, c.agence,
            "Permis " + c.categoriePermis + " pour un " + veh.type + " (permis " + requis + " requis).",
            "Retirer le véhicule à ce conducteur, proposer un conducteur avec le bon permis.");
      }
      // Règle 16 · P2 · permis qui expire dans moins de 30 jours
      if (fp) {
        var n = joursEntre(jour, fp);
        if (n >= 0 && n < R.echeanceProcheJours)
          ajout(c.id + "|permis-proche", "Permis à renouveler", "P2", cible, c.agence,
            "Permis valable jusqu'au " + c.finValiditePermis + ", dans " + n + " jours.",
            "Préparer un brouillon de rappel, à valider par le chef de parc.");
      }
      // Règle 19 · P3 · conducteur en congé avec un véhicule affecté
      if (c.statut === "Congé" && c.vehiculeAffecte)
        ajout(c.id + "|conge-avec-vehicule", "Conducteur en congé avec véhicule", "P3", cible, c.agence,
          "Conducteur en congé avec le véhicule " + c.vehiculeAffecte + " affecté.",
          "Réaffectation à proposer au chef d'agence.");
    });
    return s;
  }

  /* Règle 21 : recalcul. Une situation = une seule alerte.
     Condition toujours vraie → l'alerte garde son statut et ses décisions.
     Condition plus vraie → « Disparue ».
     Reportée → revient « Ouverte » quand la nouvelle date est atteinte.
     Traitée → se rouvre au prochain import si la condition est toujours vraie. */
  function recalculerAlertes(apresImport) {
    var jour = aujourdhui(), situations = calculerSituations(), vues = {};
    situations.forEach(function (s) {
      vues[s.cle] = true;
      var a = base.alertes.find(function (x) { return x.cle === s.cle; });
      if (!a) {
        base.compteurAlertes += 1;
        a = { numero: "A-" + String(base.compteurAlertes).padStart(4, "0"), cle: s.cle, decisions: [] };
        base.alertes.push(a);
      }
      var reouvrir = !a.statut || a.statut === "Disparue" ||
        (a.statut === "Traitée" && apresImport) ||
        (a.statut === "Reportée" && versDate(a.reporteeJusquau) && versDate(a.reporteeJusquau) <= jour);
      if (!a.statut || a.statut === "Disparue") {
        a.creeeLe = versTexte(jour);
        a.aTraiterAvant = versTexte(ajouterJours(jour, DELAI_JOURS[s.priorite]));
      }
      a.regle = s.regle; a.priorite = s.priorite; a.concerne = s.cible; a.agence = s.agence;
      a.constat = s.constat; a.proposition = s.proposition;
      a.immatriculation = s.immatriculation; a.numeroConducteur = s.numeroConducteur;
      a.decisions = a.decisions || [];
      if (reouvrir) { a.statut = "Ouverte"; delete a.reporteeJusquau; }
    });
    base.alertes.forEach(function (a) { if (!vues[a.cle] && a.statut !== "Disparue") a.statut = "Disparue"; });
    enregistrer();
  }

  /* Décisions humaines sur une alerte : Valider, Reporter, Escalader.
     Chaque décision garde qui, quand et pourquoi. Elle ne change jamais
     le statut d'un véhicule ou d'un conducteur. */
  function deciderAlerte(numero, action, infos) {
    infos = infos || {};
    var a = base.alertes.find(function (x) { return x.numero === numero; });
    if (!a) throw new Error("Alerte introuvable : " + numero);
    if (a.statut === "Disparue") throw new Error("Cette alerte a disparu : la situation est réglée.");
    var motif = (infos.motif || "").trim();
    if (!motif) throw new Error(action === "Valider" ? "Un commentaire court est obligatoire." : "Le motif est obligatoire.");
    var d = { action: action, par: base.reglages.utilisateur || "Utilisateur", le: horodatage(), motif: motif };
    if (action === "Valider") a.statut = "Traitée";
    else if (action === "Reporter") {
      var nd = versDate(infos.nouvelleDate);
      if (!nd) throw new Error("La nouvelle date est obligatoire (JJ/MM/AAAA).");
      if (nd <= aujourdhui()) throw new Error("La nouvelle date doit être après aujourd'hui.");
      a.statut = "Reportée"; a.reporteeJusquau = versTexte(nd); d.nouvelleDate = versTexte(nd);
    } else if (action === "Escalader") a.statut = "Escaladée";
    else throw new Error("Action inconnue : " + action);
    a.decisions.push(d);
    enregistrer();
    return copie(a);
  }
  function horodatage() {
    var n = new Date(), j = aujourdhui();
    return versTexte(j) + " à " + n.getHours() + " h " + String(n.getMinutes()).padStart(2, "0");
  }

  /* ---------------------------------------------------------------
     6. Lecture des CSV (séparateur « ; »)
     --------------------------------------------------------------- */
  function lireCSV(texte) {
    texte = String(texte || "").replace(/^﻿/, "");
    var lignes = texte.split(/\r?\n/).filter(function (l) { return l.trim() !== ""; });
    if (!lignes.length) return { colonnes: [], lignes: [] };
    var colonnes = lignes[0].split(";").map(function (c) { return c.trim(); });
    return {
      colonnes: colonnes,
      lignes: lignes.slice(1).map(function (l) {
        var cases = l.split(";"), o = {};
        colonnes.forEach(function (c, i) { o[c] = (cases[i] || "").trim(); });
        return o;
      })
    };
  }
  function colonnesManquantes(lues, attendues) {
    return attendues.filter(function (c) { return lues.indexOf(c) === -1; });
  }

  function vehiculeDepuisLigne(l) {
    return { numero: l.id, immatriculation: l.immatriculation, type: l.type,
      siteOrigine: l.agence, conducteur: l.conducteur || "",
      compteur: nombre(l.km_compteur), kmDerniereVidange: nombre(l.km_derniere_vidange),
      finVisiteTechnique: l.fin_visite_technique, finAssurance: l.fin_assurance,
      kmMois: nombre(l.km_octobre), litresMois: nombre(l.carburant_octobre_L),
      statut: l.statut || "En service" };
  }
  function conducteurDepuisLigne(l) {
    return { numero: l.id_conducteur, nom: l.nom, telephone: l.telephone, agence: agenceDuSite(l.agence),
      categoriePermis: (l.categorie_permis || "").toUpperCase(), finValiditePermis: l.fin_validite_permis,
      dateEmbauche: l.date_embauche, vehiculeAffecte: l.vehicule_affecte || "", statut: l.statut || "Actif" };
  }

  /* Étape 1 : analyser sans rien enregistrer. Étape 2 : confirmer. */
  var importEnAttente = null;

  function analyserImport(texteParc, texteConducteurs) {
    var parc = lireCSV(texteParc), cond = lireCSV(texteConducteurs);
    var mp = colonnesManquantes(parc.colonnes, COLONNES_PARC);
    var mc = colonnesManquantes(cond.colonnes, COLONNES_CONDUCTEURS);
    if (mp.length || mc.length) {
      importEnAttente = null;
      var msg = [];
      if (mp.length) msg.push("Fichier du parc : colonne manquante " + mp.join(", "));
      if (mc.length) msg.push("Fichier des conducteurs : colonne manquante " + mc.join(", "));
      return { ok: false, erreur: "Import refusé. " + msg.join(". ") + "." };
    }
    var signalements = [], parImmat = {}, vehicules = [];
    parc.lignes.forEach(function (l) {
      var v = vehiculeDepuisLigne(l);
      var dejaVu = parImmat[v.immatriculation];
      if (dejaVu) {                                     // doublon → fusion
        Object.keys(v).forEach(function (k) { if (dejaVu[k] === "" || dejaVu[k] === null) dejaVu[k] = v[k]; });
        signalements.push(v.numero + " · " + v.immatriculation + " : deux lignes, fusionnées en une seule fiche.");
        return;
      }
      parImmat[v.immatriculation] = v; vehicules.push(v);
    });
    vehicules.forEach(function (v) {
      var ag = agenceDuSite(v.siteOrigine);
      if (ag !== v.siteOrigine) signalements.push(v.numero + " · site " + v.siteOrigine + " : rattaché à l'agence " + ag + ".");
      if (v.compteur !== null && v.kmDerniereVidange !== null && v.compteur < v.kmDerniereVidange)
        signalements.push(v.numero + " · " + v.immatriculation + " : compteur plus bas que la dernière vidange, marqué « à vérifier ».");
      if (!v.conducteur) signalements.push(v.numero + " · " + v.immatriculation + " : aucun conducteur.");
    });
    var conducteurs = cond.lignes.map(conducteurDepuisLigne);

    // Simulation sur une copie, pour annoncer les alertes avant d'enregistrer
    var sauvegarde = base;
    base = copie(base);
    fusionner(vehicules, conducteurs);
    var ouvertesAvant = sauvegarde.alertes.filter(function (a) { return a.statut === "Ouverte"; }).length;
    var situations = calculerSituations();
    base = sauvegarde;

    var parPrio = { P1: 0, P2: 0, P3: 0 };
    situations.forEach(function (s) { parPrio[s.priorite]++; });
    importEnAttente = { vehicules: vehicules, conducteurs: conducteurs,
      rapport: { lignesParc: parc.lignes.length, lignesConducteurs: cond.lignes.length } };
    return { ok: true, lignesParc: parc.lignes.length, lignesConducteurs: cond.lignes.length,
      vehicules: vehicules.length, conducteurs: conducteurs.length,
      doublonsFusionnes: parc.lignes.length - vehicules.length,
      alertesApresImport: situations.length, parPriorite: parPrio, alertesOuvertesAvant: ouvertesAvant,
      signalements: signalements, message: "Rien n'est enregistré avant la confirmation." };
  }

  /* Mise à jour sans doublon : véhicule repéré par l'immatriculation,
     conducteur par son numéro. Une fiche archivée reste archivée. */
  function fusionner(vehicules, conducteurs) {
    vehicules.forEach(function (n) {
      var e = base.vehicules.find(function (v) { return v.immatriculation === n.immatriculation; });
      if (e) Object.assign(e, n); else { n.id = "veh-" + n.immatriculation; n.archive = false; base.vehicules.push(n); }
    });
    conducteurs.forEach(function (n) {
      var e = base.conducteurs.find(function (c) { return c.numero === n.numero; });
      if (e) Object.assign(e, n); else { n.id = "cond-" + n.numero; n.archive = false; base.conducteurs.push(n); }
    });
    base.vehicules.forEach(calculerVehicule);
  }

  function confirmerImport() {
    if (!importEnAttente) return { ok: false, erreur: "Aucun import à confirmer : analysez d'abord les deux fichiers." };
    fusionner(importEnAttente.vehicules, importEnAttente.conducteurs);
    base.dernierImport = { le: versTexte(aujourdhui()), lignesParc: importEnAttente.rapport.lignesParc,
      lignesConducteurs: importEnAttente.rapport.lignesConducteurs };
    importEnAttente = null;
    recalculerAlertes(true);
    return { ok: true, compteurs: compteurs() };
  }
  function annulerImport() { importEnAttente = null; return { ok: true }; }

  /* ---------------------------------------------------------------
     7. Actions : ajouter, modifier, supprimer (= archiver), rechercher
     --------------------------------------------------------------- */
  var CHAMPS = {
    vehicules: ["numero", "immatriculation", "type", "siteOrigine", "conducteur", "compteur",
      "kmDerniereVidange", "finVisiteTechnique", "finAssurance", "kmMois", "litresMois", "statut"],
    conducteurs: ["numero", "nom", "telephone", "agence", "categoriePermis", "finValiditePermis",
      "dateEmbauche", "vehiculeAffecte", "statut"]
  };
  var NUMERIQUES = ["compteur", "kmDerniereVidange", "kmMois", "litresMois"];
  var DATES = ["finVisiteTechnique", "finAssurance", "finValiditePermis", "dateEmbauche"];
  var CHOIX = {
    type: Object.keys(REGLAGES_PAR_DEFAUT.types),
    statutVehicule: ["En service", "Immobilisé"],
    statutConducteur: ["Actif", "Congé", "Remplaçant"],
    categoriePermis: ["B", "C"]
  };

  function verifierTable(table) {
    if (table !== "vehicules" && table !== "conducteurs")
      throw new Error("Table « " + table + " » : seules les tables vehicules et conducteurs se modifient. Les alertes sont calculées.");
  }
  function nettoyer(table, donnees) {
    var propre = {}, erreurs = [];
    CHAMPS[table].forEach(function (k) {
      if (!(k in donnees)) return;
      var val = donnees[k];
      if (NUMERIQUES.indexOf(k) !== -1) { val = nombre(val); }
      else val = val === null || val === undefined ? "" : String(val).trim();
      if (DATES.indexOf(k) !== -1 && val && !versDate(val)) erreurs.push(k + " : date attendue au format JJ/MM/AAAA");
      propre[k] = val;
    });
    if (propre.type && CHOIX.type.indexOf(propre.type) === -1) erreurs.push("type : " + CHOIX.type.join(", "));
    if (propre.categoriePermis) {
      propre.categoriePermis = propre.categoriePermis.toUpperCase();
      if (CHOIX.categoriePermis.indexOf(propre.categoriePermis) === -1) erreurs.push("categoriePermis : B ou C");
    }
    var statuts = table === "vehicules" ? CHOIX.statutVehicule : CHOIX.statutConducteur;
    if (propre.statut && statuts.indexOf(propre.statut) === -1) erreurs.push("statut : " + statuts.join(", "));
    if (erreurs.length) throw new Error("Valeurs refusées. " + erreurs.join(" ; "));
    if (table === "conducteurs" && propre.agence) propre.agence = agenceDuSite(propre.agence);
    return propre;
  }
  function trouver(table, numero) {
    return base[table].find(function (x) { return x.numero === numero || x.id === numero; });
  }

  function ajouter(table, donnees) {
    verifierTable(table);
    var f = nettoyer(table, donnees);
    var cle = table === "vehicules" ? "immatriculation" : "numero";
    if (!f.numero || !f[cle]) throw new Error("Champ obligatoire manquant : numero" + (cle !== "numero" ? " et " + cle : ""));
    if (base[table].some(function (x) { return x[cle] === f[cle] || x.numero === f.numero; }))
      throw new Error("Cette fiche existe déjà (" + f.numero + ").");
    var fiche = {};
    CHAMPS[table].forEach(function (k) { fiche[k] = k in f ? f[k] : (NUMERIQUES.indexOf(k) !== -1 ? null : ""); });
    if (!fiche.statut) fiche.statut = table === "vehicules" ? "En service" : "Actif";
    fiche.id = (table === "vehicules" ? "veh-" + fiche.immatriculation : "cond-" + fiche.numero);
    fiche.archive = false;
    base[table].push(table === "vehicules" ? calculerVehicule(fiche) : fiche);
    recalculerAlertes();
    return copie(fiche);
  }

  function modifier(table, numero, changements) {
    verifierTable(table);
    var fiche = trouver(table, numero);
    if (!fiche) throw new Error("Fiche introuvable : " + numero);
    var propre = nettoyer(table, changements);
    if (table === "vehicules" && "conducteur" in propre && propre.conducteur !== fiche.conducteur)
      reaffecterDepuisVehicule(fiche, propre.conducteur);
    if (table === "conducteurs" && "vehiculeAffecte" in propre && propre.vehiculeAffecte !== fiche.vehiculeAffecte)
      reaffecterDepuisConducteur(fiche, propre.vehiculeAffecte);
    Object.assign(fiche, propre);
    if (table === "vehicules") calculerVehicule(fiche);
    recalculerAlertes();
    return copie(fiche);
  }

  /* Réaffectation : quand on change le conducteur d'un véhicule (ou le
     véhicule d'un conducteur), les deux fiches restent d'accord. */
  function reaffecterDepuisVehicule(v, nouveauNom) {
    base.conducteurs.forEach(function (c) { if (c.vehiculeAffecte === v.immatriculation) c.vehiculeAffecte = ""; });
    if (!nouveauNom) return;
    var c = base.conducteurs.find(function (x) { return x.nom === nouveauNom && !x.archive; });
    if (!c) return;
    if (c.vehiculeAffecte) base.vehicules.forEach(function (x) { if (x.immatriculation === c.vehiculeAffecte) x.conducteur = ""; });
    c.vehiculeAffecte = v.immatriculation;
  }
  function reaffecterDepuisConducteur(c, nouvelleImmat) {
    base.vehicules.forEach(function (v) { if (v.immatriculation === c.vehiculeAffecte) v.conducteur = ""; });
    if (!nouvelleImmat) return;
    var v = base.vehicules.find(function (x) { return x.immatriculation === nouvelleImmat && !x.archive; });
    if (!v) return;
    if (v.conducteur) base.conducteurs.forEach(function (x) { if (x.nom === v.conducteur && x !== c) x.vehiculeAffecte = ""; });
    v.conducteur = c.nom;
  }

  /* Supprimer = archiver : la fiche sort des listes et des alertes,
     mais reste récupérable. Rien n'est effacé. */
  function supprimer(table, numero, motif) {
    verifierTable(table);
    var fiche = trouver(table, numero);
    if (!fiche) throw new Error("Fiche introuvable : " + numero);
    fiche.archive = true; fiche.archiveLe = versTexte(aujourdhui()); fiche.motifArchivage = motif || "";
    recalculerAlertes();
    return copie(fiche);
  }
  function restaurer(table, numero) {
    verifierTable(table);
    var fiche = trouver(table, numero);
    if (!fiche) throw new Error("Fiche introuvable : " + numero);
    fiche.archive = false; delete fiche.archiveLe; delete fiche.motifArchivage;
    recalculerAlertes();
    return copie(fiche);
  }

  /* Rechercher : un texte libre (dans tous les champs) + des filtres exacts.
     Ex. rechercher("vehicules", "camion", { agence: "Casablanca" }) */
  function rechercher(table, texte, filtres) {
    if (["vehicules", "conducteurs", "alertes"].indexOf(table) === -1) throw new Error("Table inconnue : " + table);
    filtres = filtres || {};
    var avecArchives = filtres.archives === true; delete filtres.archives;
    var mot = (texte || "").toLowerCase().trim();
    return base[table].filter(function (x) {
      if (table !== "alertes" && x.archive && !avecArchives) return false;
      if (table === "alertes" && !("statut" in filtres) && ACTIVES.indexOf(x.statut) === -1) return false;
      for (var k in filtres) if (x[k] !== filtres[k]) return false;
      if (!mot) return true;
      return Object.keys(x).some(function (k) { return String(x[k] === null ? "" : x[k]).toLowerCase().indexOf(mot) !== -1; });
    }).map(copie);
  }

  /* ---------------------------------------------------------------
     8. Lecture pour l'écran de contrôle
     --------------------------------------------------------------- */
  var ORDRE = { P1: 1, P2: 2, P3: 3 };
  var ACTIVES = ["Ouverte", "Escaladée"];          // une alerte escaladée reste ouverte
  function estActive(a) { return ACTIVES.indexOf(a.statut) !== -1; }
  function trier(liste) {
    return liste.sort(function (a, b) {
      return ORDRE[a.priorite] - ORDRE[b.priorite] ||
        versDate(a.aTraiterAvant) - versDate(b.aTraiterAvant) || a.numero.localeCompare(b.numero);
    });
  }
  function alertesOuvertes() { return trier(base.alertes.filter(estActive)).map(copie); }
  function alertesParStatut(statut) {
    return trier(base.alertes.filter(function (a) { return a.statut === statut; })).map(copie);
  }
  function alertesDe(immatOuNumero) {
    return trier(base.alertes.filter(function (a) {
      return a.statut !== "Disparue" && (a.immatriculation === immatOuNumero || a.numeroConducteur === immatOuNumero);
    })).map(copie);
  }
  function enRetard(a) { return versDate(a.aTraiterAvant) < aujourdhui(); }

  /* Véhicules qui ne doivent pas rouler aujourd'hui : au moins une P1 active
     (sur le véhicule ou sur son conducteur). C'est une proposition : seul
     le chef de parc décide d'immobiliser. */
  function nePasRouler() {
    var parImmat = {};
    base.alertes.filter(function (a) { return estActive(a) && a.priorite === "P1" && a.immatriculation; })
      .forEach(function (a) { (parImmat[a.immatriculation] = parImmat[a.immatriculation] || []).push(a); });
    return Object.keys(parImmat).map(function (immat) {
      var v = base.vehicules.find(function (x) { return x.immatriculation === immat; });
      return { vehicule: copie(v), raisons: parImmat[immat].map(function (a) { return a.regle; }),
               alertes: parImmat[immat].map(copie) };
    }).sort(function (a, b) { return a.vehicule.numero.localeCompare(b.vehicule.numero); });
  }

  /* Échéances des N prochains jours (0 à N−1), plus les vidanges proches */
  function echeances(jours) {
    jours = jours || base.reglages.echeanceProcheJours;
    var jour = aujourdhui(), liste = [];
    function dans(dateTxt) { var d = versDate(dateTxt); return d ? joursEntre(jour, d) : null; }
    base.vehicules.filter(function (v) { return !v.archive; }).forEach(function (v) {
      [["Visite technique", v.finVisiteTechnique], ["Assurance", v.finAssurance]].forEach(function (e) {
        var n = dans(e[1]);
        if (n !== null && n >= 0 && n < jours)
          liste.push({ quoi: e[0], qui: v.numero + " · " + v.immatriculation, agence: v.agence, date: e[1], dansJours: n, lien: { table: "vehicules", numero: v.numero } });
      });
      if (v.vidangeDansKm !== null && v.vidangeDansKm >= 0 && v.vidangeDansKm < base.reglages.vidangeProcheKm)
        liste.push({ quoi: "Vidange", qui: v.numero + " · " + v.immatriculation, agence: v.agence, date: "dans " + km(v.vidangeDansKm) + " km", dansJours: null, lien: { table: "vehicules", numero: v.numero } });
    });
    base.conducteurs.filter(function (c) { return !c.archive; }).forEach(function (c) {
      var n = dans(c.finValiditePermis);
      if (n !== null && n >= 0 && n < jours)
        liste.push({ quoi: "Permis", qui: c.numero + " · " + c.nom, agence: c.agence, date: c.finValiditePermis, dansJours: n, lien: { table: "conducteurs", numero: c.numero } });
    });
    return liste.sort(function (a, b) {
      return (a.dansJours === null ? 999 : a.dansJours) - (b.dansJours === null ? 999 : b.dansJours);
    });
  }

  /* Coût carburant du mois par agence (litres × prix du gasoil) */
  function coutCarburantParAgence() {
    var t = {};
    base.vehicules.filter(function (v) { return !v.archive; }).forEach(function (v) {
      var x = t[v.agence] = t[v.agence] || { agence: v.agence, litres: 0, coutMAD: 0, vehicules: 0 };
      x.litres += v.litresMois || 0; x.vehicules += 1;
    });
    return Object.keys(t).map(function (k) {
      t[k].coutMAD = Math.round(t[k].litres * base.reglages.prixGasoil); return t[k];
    }).sort(function (a, b) { return b.coutMAD - a.coutMAD; });
  }

  function compteurs() {
    var ouv = base.alertes.filter(estActive);
    return {
      vehicules: base.vehicules.filter(function (v) { return !v.archive; }).length,
      vehiculesArchives: base.vehicules.filter(function (v) { return v.archive; }).length,
      vehiculesEnService: base.vehicules.filter(function (v) { return !v.archive && v.statut === "En service"; }).length,
      vehiculesImmobilises: base.vehicules.filter(function (v) { return !v.archive && v.statut === "Immobilisé"; }).length,
      conducteurs: base.conducteurs.filter(function (c) { return !c.archive; }).length,
      conducteursArchives: base.conducteurs.filter(function (c) { return c.archive; }).length,
      alertesOuvertes: ouv.length,
      alertesTotal: base.alertes.length,
      P1: ouv.filter(function (a) { return a.priorite === "P1"; }).length,
      P2: ouv.filter(function (a) { return a.priorite === "P2"; }).length,
      P3: ouv.filter(function (a) { return a.priorite === "P3"; }).length
    };
  }

  /* Export : un fichier CSV « ; » que l'on ouvre avec Excel */
  var EXPORTS = {
    vehicules: [["N° véhicule","numero"],["Immatriculation","immatriculation"],["Type","type"],["Site d'origine","siteOrigine"],
      ["Agence","agence"],["Conducteur","conducteur"],["Compteur (km)","compteur"],["Km dernière vidange","kmDerniereVidange"],
      ["Vidange dans (km)","vidangeDansKm"],["Fin visite technique","finVisiteTechnique"],["Fin assurance","finAssurance"],
      ["Km du mois","kmMois"],["Litres du mois","litresMois"],["Conso L/100","consoL100"],["Écart référence %","ecartReferencePct"],
      ["Statut","statut"],["À vérifier","aVerifier"],["Archivé","archive"]],
    conducteurs: [["N° conducteur","numero"],["Nom","nom"],["Téléphone","telephone"],["Agence","agence"],
      ["Catégorie de permis","categoriePermis"],["Fin de validité du permis","finValiditePermis"],["Date d'embauche","dateEmbauche"],
      ["Véhicule affecté","vehiculeAffecte"],["Statut","statut"],["Archivé","archive"]],
    alertes: [["N° alerte","numero"],["Priorité","priorite"],["Règle","regle"],["Concerne","concerne"],["Agence","agence"],
      ["Constat","constat"],["Proposition","proposition"],["Créée le","creeeLe"],["À traiter avant","aTraiterAvant"],
      ["Statut","statut"],["Dernière décision","derniereDecision"]]
  };
  function exporterCSV(table) {
    var cols = EXPORTS[table]; if (!cols) throw new Error("Table inconnue : " + table);
    function cellule(v) {
      if (v === true) v = "Oui"; else if (v === false) v = "Non"; else if (v === null || v === undefined) v = "";
      v = String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }
    var lignes = base[table].map(function (x) {
      if (table === "alertes") {
        var d = (x.decisions || [])[x.decisions ? x.decisions.length - 1 : 0];
        x = Object.assign({}, x, { derniereDecision: d ? d.action + " par " + d.par + " le " + d.le + " : " + d.motif : "" });
      }
      return cols.map(function (c) { return cellule(typeof x[c[1]] === "number" ? String(x[c[1]]).replace(".", ",") : x[c[1]]); }).join(";");
    });
    return "\uFEFF" + [cols.map(function (c) { return c[0]; }).join(";")].concat(lignes).join("\r\n");
  }
  function fiche(table, numero) {
    verifierTable(table);
    var f = trouver(table, numero); return f ? copie(f) : null;
  }

  function changerReglage(nom, valeur) {
    if (!(nom in base.reglages)) throw new Error("Réglage inconnu : " + nom);
    base.reglages[nom] = valeur;
    base.vehicules.forEach(calculerVehicule);
    recalculerAlertes();
    return copie(base.reglages);
  }
  function toutEffacer() { base = baseVide(); importEnAttente = null; enregistrer(); }

  /* ---------------------------------------------------------------
     9. Ce que le moteur met à disposition des écrans
     --------------------------------------------------------------- */
  racine.KainaFlotte = {
    analyserImport: analyserImport, confirmerImport: confirmerImport, annulerImport: annulerImport,
    ajouter: ajouter, modifier: modifier, supprimer: supprimer, restaurer: restaurer, rechercher: rechercher,
    alertesOuvertes: alertesOuvertes, alertesParStatut: alertesParStatut, alertesDe: alertesDe,
    enRetard: enRetard, deciderAlerte: deciderAlerte, nePasRouler: nePasRouler, echeances: echeances,
    coutCarburantParAgence: coutCarburantParAgence, exporterCSV: exporterCSV, fiche: fiche,
    compteurs: compteurs, recalculerAlertes: recalculerAlertes,
    reglages: function () { return copie(base.reglages); }, changerReglage: changerReglage,
    dernierImport: function () { return base.dernierImport && copie(base.dernierImport); },
    toutEffacer: toutEffacer, choix: CHOIX
  };
})(typeof window !== "undefined" ? window : globalThis);
