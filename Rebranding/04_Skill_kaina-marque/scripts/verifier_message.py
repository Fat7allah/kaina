#!/usr/bin/env python3
"""Vérifie qu'un texte respecte les règles éditoriales R1 à R10 de la charte Kaïna.

Usage :
  python3 verifier_message.py --canal sms --public externe message.txt
  echo "texte" | python3 verifier_message.py --canal email --public externe

Code de sortie : 0 si conforme, 1 si au moins une alerte.
"""
import argparse, re, sys, unicodedata

NOMBRES_EXTERNES = {"2004", "14000", "85%", "6", "2027", "2026"}
NOMBRES_INTERNES = NOMBRES_EXTERNES | {"1,1", "520", "160", "90", "94%", "2025", "31%", "20%", "3,9%", "210", "5"}

PROMESSES = [r"garanti(e|es|s)?", r"toujours", r"jamais en retard", r"100\s?%", r"z[ée]ro rupture", r"sans faute",
             r"gratuit(e|es|s)?", r"offert(e|es|s)?", r"prix le plus bas", r"en \d+\s?h(eures?)?\b",
             r"livr\w* en \d+", r"remise de \d+", r"-\s?\d+\s?%"]
SUPERLATIFS = [r"n\s?°\s?1", r"num[ée]ro\s?1", r"leader", r"le meilleur", r"la meilleure", r"les meilleurs",
               r"le moins cher", r"imbattable", r"in[ée]gal[ée]", r"unique au maroc"]
GRAPHIES = [r"\bKAINA\b", r"\bKAÏNA\b(?! DISTRIBUTION)", r"\bKaina\b", r"Ka[iï]na distrib\b", r"Cap service 2027",
            r"Cap Services 2027"]
RESERVES = [r"logo officiel", r"charte officielle", r"identit[ée] d[ée]finitive", r"identit[ée] approuv[ée]e",
            r"nouvelle identit[ée] officielle"]
TUTOIEMENT = [r"\btu\b", r"\bton\b", r"\bta\b", r"\btes\b", r"\btoi\b", r"\bt'"]
JARGON = [r"\bOTIF\b", r"taux de service", r"\bKPI\b"]


def normaliser_nombre(n):
    return re.sub(r"[\s  ]", "", n)


def phrases(texte):
    return [p.strip() for p in re.split(r"(?<=[.!?])\s+|\n+", texte) if p.strip()]


def verifier(texte, canal, public):
    alertes = []
    t = unicodedata.normalize("NFC", texte)
    # R1 — nombres hors liste blanche (on ignore ce qui est entre crochets)
    sans_crochets = re.sub(r"\[[^\]]*\]", "", t)
    autorises = NOMBRES_EXTERNES if public == "externe" else NOMBRES_INTERNES
    for m in re.finditer(r"\d[\d\s  ]*(?:,\d+)?\s?%?", sans_crochets):
        brut = m.group(0).strip()
        if not brut:
            continue
        n = normaliser_nombre(brut)
        if n not in autorises:
            alertes.append(("R1", brut, "Nombre absent des faits autorisés : le sourcer ou le remplacer par [À CONFIRMER]."))
    def chercher(regle, motifs, msg, flags=re.IGNORECASE):
        for mo in motifs:
            for m in re.finditer(mo, t, flags):
                alertes.append((regle, m.group(0), msg))
    chercher("R2", PROMESSES, "Promesse non validée : retirer ou faire valider par la Direction commerciale.")
    chercher("R3", SUPERLATIFS, "Superlatif invérifiable : retirer.")
    # R4 — citations entre guillemets sans source
    for m in re.finditer(r"«([^»]{15,})»", t):
        contenu = m.group(1)
        if "Cap Service 2027" in contenu or "Votre commerce, bien servi" in contenu:
            continue
        if not re.search(r"source\s*:", t, re.IGNORECASE):
            alertes.append(("R4", "«" + contenu[:40] + "…»", "Citation ou témoignage sans source fournie."))
    if public == "externe":
        chercher("R5", TUTOIEMENT, "Tutoiement interdit dans un message externe.")
        chercher("R5", JARGON, "Jargon interne dans un message externe : dire « livraison complète et à l'heure ».")
    limite = 20 if canal == "sms" else 25
    for p in phrases(t):
        nb = len(re.findall(r"[\wÀ-ÿ'’-]+", p))
        if nb > limite:
            alertes.append(("R6", p[:50] + "…", f"Phrase de {nb} mots (maximum {limite})."))
    chercher("R8", GRAPHIES, "Graphie de marque incorrecte : écrire « Kaïna » ou « Kaïna Distribution ».", flags=0)
    chercher("R10", RESERVES, "La charte n'est pas validée : ne pas la présenter comme officielle.")
    return alertes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("fichier", nargs="?")
    ap.add_argument("--canal", choices=["sms", "email", "doc"], default="doc")
    ap.add_argument("--public", choices=["externe", "interne"], default="externe")
    a = ap.parse_args()
    texte = open(a.fichier, encoding="utf-8").read() if a.fichier else sys.stdin.read()
    alertes = verifier(texte, a.canal, a.public)
    if not alertes:
        print("CONFORME : aucune alerte (R1-R10). Vérifier manuellement R7 (une seule action) et R9.")
        return 0
    print(f"NON CONFORME : {len(alertes)} alerte(s)")
    for regle, extrait, msg in alertes:
        print(f"- {regle} | « {extrait} » | {msg}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
