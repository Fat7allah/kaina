"""Génère les visuels de marque Kaïna (SVG) utilisés par la landing page du salon.

Palette Proximité : cèdre #0F5C4A, safran #F2A900, terre cuite #C4532D, sable #F6EFE3.
Logo « Deux points » repris de Rebranding/02_Logo_final/kaina-logo-couleur.svg.
Lancer : python3 generer_visuels.py (écrit les .svg dans ce dossier).
"""
from pathlib import Path

CEDRE, CEDRE_F, SAFRAN, TERRE, SABLE, NOIR, BLANC = "#0F5C4A", "#0A4537", "#F2A900", "#C4532D", "#F6EFE3", "#111111", "#FFFFFF"
KRAFT, KRAFT_F, PEAU, PEAU_F = "#C99A5B", "#B1844A", "#B97E57", "#9E6747"
LOGO_D = ("M51.20,40.00 L51.20,171.20 M105.60,100.80 L57.60,142.40 M72.00,131.20 L108.80,171.20 "
          "M224.00,136.00 A35.20,35.20 0 1 1 153.60,136.00 A35.20,35.20 0 1 1 224.00,136.00 M224.00,100.80 L224.00,171.20 "
          "M265.60,100.80 L265.60,171.20 M307.20,171.20 L307.20,136.00 A35.20,35.20 0 0 1 377.60,136.00 L377.60,171.20 "
          "M489.60,136.00 A35.20,35.20 0 1 1 419.20,136.00 A35.20,35.20 0 1 1 489.60,136.00 M489.60,100.80 L489.60,171.20")
OUT = Path(__file__).parent


def logo(x, y, w, color=CEDRE, dots=SAFRAN):
    """Logo Kaïna, largeur w, coin haut-gauche (x, y). Le dessin utile occupe ~ x 40-501, y 49-182 sur 541x218."""
    s = w / 460
    return (f'<g transform="translate({x - 40 * s:.1f} {y - 49 * s:.1f}) scale({s:.4f})">'
            f'<path d="{LOGO_D}" fill="none" stroke="{color}" stroke-width="22.4" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<circle cx="248" cy="62.4" r="13.12" fill="{dots}"/><circle cx="283.2" cy="62.4" r="13.12" fill="{dots}"/></g>')


def carton(x, y, w, h, logo_on=True):
    """Carton kraft avec ruban et logo."""
    t = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{w*.04:.1f}" fill="{KRAFT}"/>'
    t += f'<rect x="{x}" y="{y}" width="{w}" height="{h*.16:.1f}" fill="{KRAFT_F}"/>'
    t += f'<rect x="{x + w*.44:.1f}" y="{y}" width="{w*.12:.1f}" height="{h*.16:.1f}" fill="#E6C48E"/>'
    if logo_on:
        t += f'<rect x="{x + w*.1:.1f}" y="{y + h*.28:.1f}" width="{w*.8:.1f}" height="{h*.5:.1f}" rx="{w*.05:.1f}" fill="{SABLE}"/>'
        t += logo(x + w * .18, y + h * .4, w * .64, CEDRE)
    return t


def van(x, y, s=1.0, door_open=False):
    """Fourgon de livraison vu de profil (vers la droite), ~620 x 330 à l'échelle 1."""
    g = [f'<g transform="translate({x} {y}) scale({s})">',
         '<ellipse cx="320" cy="322" rx="300" ry="16" fill="#000" opacity=".12"/>',
         # caisse
         f'<path d="M20 60 Q20 20 60 20 H420 Q452 20 470 46 L540 150 Q600 160 612 196 V282 Q612 300 594 300 H38 Q20 300 20 282 Z" fill="{BLANC}" stroke="#D8CFBF" stroke-width="3"/>',
         # vitre cabine
         '<path d="M436 40 H458 Q468 40 476 52 L528 146 H436 Z" fill="#23423A"/>',
         '<path d="M446 52 L470 52 L500 104" stroke="#fff" stroke-width="6" opacity=".25" stroke-linecap="round" fill="none"/>',
         # portes et poignées
         '<path d="M428 30 V290 M300 24 V290" stroke="#D8CFBF" stroke-width="3"/>',
         '<rect x="440" y="166" width="26" height="7" rx="3.5" fill="#B9B0A0"/><rect x="306" y="150" width="7" height="26" rx="3.5" fill="#B9B0A0"/>',
         # bandes de marque
         f'<rect x="20" y="236" width="592" height="22" fill="{CEDRE}"/><rect x="20" y="258" width="592" height="7" fill="{SAFRAN}"/>',
         logo(60, 92, 220, CEDRE),
         f'<text x="64" y="212" font-family="Inter,Arial,sans-serif" font-size="19" font-weight="600" fill="{CEDRE}" letter-spacing="1">Distribution</text>',
         # phares, pare-chocs, rétro
         f'<rect x="586" y="200" width="24" height="22" rx="6" fill="{SAFRAN}"/>',
         '<rect x="560" y="276" width="56" height="20" rx="8" fill="#2a2a2a"/>',
         '<rect x="520" y="118" width="14" height="30" rx="5" fill="#2a2a2a"/>']
    if door_open:
        g += [f'<rect x="304" y="28" width="122" height="208" fill="#3B3328"/>',
              carton(316, 150, 52, 44, False), carton(372, 150, 48, 44, False), carton(326, 106, 56, 44, False), carton(316, 196, 100, 38, False)]
    for cx in (140, 500):
        g += [f'<circle cx="{cx}" cy="300" r="44" fill="{NOIR}"/>', f'<circle cx="{cx}" cy="300" r="20" fill="#CFC8BB"/>', f'<circle cx="{cx}" cy="300" r="7" fill="#777"/>']
    g.append('</g>')
    return "".join(g)


def livreur(x, y, s=1.0, avec_carton=True):
    """Livreur de face, casquette et veste Kaïna, ~200 x 420 à l'échelle 1. (x, y) = haut de la tête."""
    g = [f'<g transform="translate({x} {y}) scale({s})">',
         '<ellipse cx="100" cy="414" rx="80" ry="10" fill="#000" opacity=".14"/>',
         # jambes et chaussures
         f'<path d="M58 250 H96 L94 400 H64 Z M104 250 H142 L136 400 H106 Z" fill="#26302D"/>',
         f'<rect x="54" y="394" width="44" height="16" rx="8" fill="{NOIR}"/><rect x="102" y="394" width="44" height="16" rx="8" fill="{NOIR}"/>',
         # buste (veste cèdre)
         f'<path d="M40 128 Q40 104 66 98 L100 92 L134 98 Q160 104 160 128 L156 262 H44 Z" fill="{CEDRE}"/>',
         f'<path d="M100 98 V262" stroke="{CEDRE_F}" stroke-width="3"/>',
         f'<path d="M84 96 L100 120 L116 96" fill="{SABLE}"/>',
         logo(112, 140, 34, SABLE),
         # cou et tête
         f'<rect x="88" y="74" width="24" height="26" rx="8" fill="{PEAU_F}"/>',
         f'<ellipse cx="100" cy="52" rx="32" ry="36" fill="{PEAU}"/>',
         '<path d="M86 66 Q100 76 114 66" stroke="#5a3626" stroke-width="3" fill="none" stroke-linecap="round"/>',
         '<circle cx="88" cy="50" r="3.4" fill="#2a1a12"/><circle cx="112" cy="50" r="3.4" fill="#2a1a12"/>',
         # casquette
         f'<path d="M66 40 Q66 8 100 8 Q134 8 134 40 Z" fill="{CEDRE}"/>',
         f'<path d="M62 40 H150 Q150 48 140 48 H62 Z" fill="{CEDRE_F}"/>',
         f'<circle cx="95" cy="25" r="4.5" fill="{SAFRAN}"/><circle cx="107" cy="25" r="4.5" fill="{SAFRAN}"/>']
    if avec_carton:
        g += [carton(30, 150, 140, 104),
              f'<path d="M40 140 Q26 190 34 214" stroke="{CEDRE}" stroke-width="22" stroke-linecap="round" fill="none"/>',
              f'<path d="M160 140 Q174 190 166 214" stroke="{CEDRE}" stroke-width="22" stroke-linecap="round" fill="none"/>',
              f'<circle cx="34" cy="220" r="12" fill="{PEAU}"/><circle cx="166" cy="220" r="12" fill="{PEAU}"/>']
    else:
        g += [f'<path d="M44 130 Q30 190 38 250" stroke="{CEDRE}" stroke-width="22" stroke-linecap="round" fill="none"/>',
              f'<path d="M156 130 Q170 190 162 250" stroke="{CEDRE}" stroke-width="22" stroke-linecap="round" fill="none"/>',
              f'<circle cx="38" cy="256" r="12" fill="{PEAU}"/><circle cx="162" cy="256" r="12" fill="{PEAU}"/>']
    g.append('</g>')
    return "".join(g)


def skyline(w, base, color, op=1.0):
    """Silhouette de ville marocaine (immeubles + minaret)."""
    blocks = [(0, 120, 90), (80, 170, 70), (140, 90, 110), (240, 210, 80), (310, 140, 100), (400, 250, 60),
              (450, 120, 120), (560, 190, 90), (640, 100, 100), (730, 230, 70), (790, 150, 110), (890, 110, 90),
              (970, 200, 80), (1040, 130, 120), (1150, 180, 80), (1220, 100, 110), (1320, 220, 70), (1380, 140, 120), (1490, 170, 120)]
    t = f'<g fill="{color}" opacity="{op}">'
    for bx, bh, bw in blocks:
        if bx < w:
            t += f'<rect x="{bx}" y="{base - bh}" width="{bw}" height="{bh}"/>'
    # minaret
    mx = w * .62
    t += f'<rect x="{mx}" y="{base - 330}" width="34" height="330"/><rect x="{mx - 4}" y="{base - 340}" width="42" height="14"/><rect x="{mx + 8}" y="{base - 372}" width="18" height="34"/><circle cx="{mx + 17}" cy="{base - 382}" r="6"/>'
    return t + '</g>'


def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{body}</svg>\n')


def ecrire(nom, contenu):
    (OUT / nom).write_text(contenu, encoding="utf-8")
    print("écrit", nom)


# 1. Héros : fourgon porte ouverte + livreur avec carton
ecrire("kaina-hero-livraison.svg", svg(760, 520,
    f'<circle cx="380" cy="250" r="230" fill="{SABLE}"/>' + van(20, 150, .95, door_open=True) + livreur(520, 70, 1.0),
    "Livreur Kaïna devant un fourgon Kaïna, carton à la main"))

# 2. Fourgon seul (bandeau ville et appel à l'action)
ecrire("kaina-fourgon.svg", svg(640, 350, van(10, 10, 1.0), "Fourgon de livraison Kaïna Distribution"))

# 3. Bandeau ville
ville = (f'<defs><linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBF6EE"/><stop offset="1" stop-color="{SABLE}"/></linearGradient></defs>'
         f'<rect width="1600" height="560" fill="url(#ciel)"/><circle cx="1260" cy="150" r="70" fill="{SAFRAN}" opacity=".35"/>'
         + skyline(1600, 430, "#E3D6C1") + skyline(1600, 430, "#D5C5AC", .0)
         + f'<path d="M0 430 H1600 V560 H0 Z" fill="#3A3A3A"/><path d="M0 492 H1600" stroke="#F6EFE3" stroke-width="8" stroke-dasharray="60 50"/>'
         + van(520, 175, 1.0))
ecrire("kaina-ville.svg", svg(1600, 560, ville, "Fourgon Kaïna en ville"))

# 4. Épicerie de quartier livrée
epi = (f'<rect width="480" height="360" fill="{SABLE}"/><rect x="0" y="300" width="480" height="60" fill="#E9DCC6"/>'
       f'<rect x="40" y="70" width="300" height="230" fill="{BLANC}" stroke="{CEDRE}" stroke-width="5"/>'
       f'<rect x="30" y="44" width="320" height="34" rx="4" fill="{CEDRE}"/>'
       f'<text x="190" y="68" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="700" font-size="17" letter-spacing="6" fill="{SABLE}">HANOUT</text>'
       + "".join(f'<path d="M{40 + i*50} 78 H{90 + i*50} V108 A25 14 0 0 1 {40 + i*50} 108 Z" fill="{TERRE if i % 2 == 0 else BLANC}" stroke="{CEDRE}" stroke-width="2"/>' for i in range(6))
       + f'<rect x="64" y="140" width="130" height="110" fill="#F3EBDD" stroke="{CEDRE}" stroke-width="4"/>'
       + "".join(f'<rect x="{72 + i*20}" y="{150 + (i%2)*4}" width="14" height="{36 - (i%2)*4}" rx="3" fill="{[TERRE, SAFRAN, CEDRE][i % 3]}"/>' for i in range(6))
       + "".join(f'<rect x="{72 + i*20}" y="{204 + (i%2)*4}" width="14" height="{36 - (i%2)*4}" rx="3" fill="{[SAFRAN, CEDRE, TERRE][i % 3]}"/>' for i in range(6))
       + f'<rect x="220" y="140" width="90" height="160" fill="{SABLE}" stroke="{CEDRE}" stroke-width="4"/><circle cx="296" cy="222" r="4" fill="{CEDRE}"/>'
       + livreur(366, 92, .5, avec_carton=False)
       + carton(330, 236, 76, 64) + carton(400, 250, 64, 50) + carton(350, 186, 64, 52))
ecrire("kaina-epicerie.svg", svg(480, 360, epi, "Épicerie de quartier livrée par Kaïna"))

# 5. Café-hôtel-restaurant
cafe = (f'<rect width="480" height="360" fill="{CEDRE}"/><rect x="0" y="300" width="480" height="60" fill="{CEDRE_F}"/>'
        f'<rect x="30" y="60" width="250" height="150" rx="10" fill="#14705A"/>'
        f'<path d="M60 150 h80 v30 a26 26 0 0 1 -26 26 h-28 a26 26 0 0 1 -26 -26 z" fill="{SABLE}"/><path d="M140 160 h12 a14 14 0 0 1 0 28 h-12" stroke="{SABLE}" stroke-width="8" fill="none"/>'
        f'<path d="M86 138 c-10 -10 10 -16 0 -30 M110 138 c-10 -10 10 -16 0 -30" stroke="{SAFRAN}" stroke-width="6" fill="none" stroke-linecap="round"/>'
        f'<text x="200" y="120" font-family="Inter,Arial,sans-serif" font-weight="800" font-size="26" fill="{SABLE}">CAFÉ</text>'
        f'<rect x="40" y="250" width="200" height="12" rx="6" fill="{TERRE}"/><rect x="130" y="262" width="12" height="40" fill="{TERRE}"/>'
        + livreur(380, 70, .52, avec_carton=False)
        + carton(270, 230, 80, 70) + carton(350, 240, 70, 60) + carton(286, 172, 70, 58))
ecrire("kaina-cafe.svg", svg(480, 360, cafe, "Café livré par Kaïna"))

# 6. Moyennes et grandes surfaces
gs = (f'<rect width="480" height="360" fill="{TERRE}"/><rect x="0" y="300" width="480" height="60" fill="#A84626"/>'
      + "".join(f'<rect x="30" y="{60 + r*80}" width="250" height="8" fill="{SABLE}"/>' + "".join(
          f'<rect x="{38 + i*30}" y="{24 + r*80}" width="22" height="36" rx="3" fill="{[SAFRAN, SABLE, CEDRE][(i + r) % 3]}"/>' for i in range(8)) for r in range(3))
      + f'<rect x="290" y="282" width="170" height="18" fill="{KRAFT_F}"/>'
      + carton(292, 210, 82, 72) + carton(376, 210, 82, 72) + carton(334, 140, 82, 70)
      + f'<path d="M40 268 h18 l12 30 h60 l12 -22 h-80" stroke="{SABLE}" stroke-width="6" fill="none" stroke-linejoin="round"/>')
ecrire("kaina-grande-surface.svg", svg(480, 360, gs, "Grande surface approvisionnée par Kaïna"))

# 7. Commande WhatsApp
wa = (f'<rect width="480" height="360" fill="{SAFRAN}"/>'
      f'<rect x="150" y="30" width="180" height="330" rx="28" fill="{NOIR}"/><rect x="162" y="48" width="156" height="312" rx="18" fill="{SABLE}"/>'
      f'<rect x="162" y="48" width="156" height="44" fill="{CEDRE}"/>' + logo(176, 62, 54, SABLE)
      + f'<rect x="200" y="110" width="108" height="46" rx="12" fill="#D7EADF"/><rect x="172" y="170" width="108" height="34" rx="12" fill="{BLANC}"/>'
      f'<rect x="222" y="218" width="86" height="30" rx="12" fill="#D7EADF"/>'
      f'<text x="210" y="130" font-family="Inter,Arial,sans-serif" font-size="11" fill="{NOIR}">2 cartons</text><text x="210" y="146" font-family="Inter,Arial,sans-serif" font-size="11" fill="{NOIR}">d\'huile svp</text>'
      f'<text x="182" y="192" font-family="Inter,Arial,sans-serif" font-size="11" fill="{NOIR}">Bien reçu !</text>'
      + carton(40, 236, 90, 80) + carton(350, 236, 90, 80))
ecrire("kaina-whatsapp.svg", svg(480, 360, wa, "Commande WhatsApp à un pré-vendeur Kaïna"))

# 8. Carton seul
ecrire("kaina-carton.svg", svg(240, 200, carton(10, 10, 220, 180), "Carton Kaïna"))
