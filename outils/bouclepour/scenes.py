"""Les neuf scènes de « La boucle Pour — le sac et l'ascenseur ».

Chaque fonction reçoit le dessin, l'avancement `p` (0 → 1) de la séquence et le
temps absolu `t`. À gauche l'histoire (sac, immeuble, ascenseur), à droite le
cahier où l'agent écrit — exactement comme dans les autres capsules du site.
"""
from __future__ import annotations

import math

from PIL import ImageDraw

from theme import (
    FOND, FOND_PANNEAU, FOND_PANNEAU_2, BORDURE, TEXTE, TEXTE_2, TEXTE_3,
    ORANGE, ORANGE_FONCE, AMBRE, VIOLET, VERT, BLEU, ROSE,
    police, melange, boite_arrondie, texte, largeur_texte, texte_centre,
    couper_texte, fleche,
)
import dessin as G
from dessin import (
    LARGEUR, HAUTEUR, MARGE, PANEL_G, PANEL_D, BANDE,
    sac, immeuble, ascenseur, compteur, jeton, cahier, cadre_code,
    bandeau_rappel, bulle, coche, titre_carte, Ligne, panneau, entete, _ease, _ease_out,
)

TOTAL = 9

# Le rappel permanent, en bas de l'écran.
RAPPEL = [
    ("S", "le sac qui accumule", ORANGE),
    ("T[k]", "l'étage numéro k", AMBRE),
    ("compteur", "l'ascenseur qui compte", BLEU),
]


def _entete(d, titre, etape, chapitre):
    entete(d, titre, etape, TOTAL, chapitre)


def _panneaux(d, titre_gauche, titre_droite="ce que j'écris"):
    panneau(d, PANEL_G, titre_gauche, accent=melange(BORDURE, ORANGE, 0.35))
    cadre_code(d, PANEL_D, titre_droite)


def _carte_etage(box, k, n):
    """Position verticale du centre de l'étage k dans la boîte de l'immeuble."""
    x0, y0, x1, y1 = box
    h = (y1 - y0) / n
    return y1 - (k + 0.5) * h


# ══════════════════════════════════════════════════════════════════════════
#  1 · Le sac, c'est une variable
# ══════════════════════════════════════════════════════════════════════════
def scene_sac(d, p, t):
    # carton d'ouverture : plein cadre, puis on entre dans l'histoire
    if p < 0.085:
        d.rectangle([0, 0, LARGEUR, HAUTEUR], fill=FOND)
        titre_carte(d, "ALGORITHMIQUE · BOUCLES", "La boucle Pour",
                    "Le sac, l'ascenseur et le compteur",
                    min(1.0, 0.45 + p / 0.02))
        return

    _entete(d, "La boucle Pour — le sac et l'ascenseur", 1, "1 · Un sac, c'est une variable")
    _panneaux(d, "l'histoire")
    cx, cy = 560, 560
    k = _ease_out(min(1.0, (p - 0.085) / 0.18))
    # le contenu change au fil du récit : c'est ça, une variable
    if p < 0.24:
        contenu = ()
    elif p < 0.46:
        contenu = ("T[0]",)
    elif p < 0.66:
        contenu = ("T[0]", "T[1]")
    else:
        contenu = ("T[0]", "T[1]", "T[2]")
    secousse = max(0.0, 1 - abs(p - 0.62) * 9) if 0.42 < p < 0.8 else 0.0
    sac(d, cx, cy - (1 - k) * 70, contenu=contenu, nom="S" if p > 0.9 else None,
        echelle=1.12, halo=0.55 + 0.35 * G._pulse(t, 2.4), secousse=secousse)

    # étiquette « VARIABLE » au-dessus du sac
    if p > 0.46:
        a = _ease_out(min(1.0, (p - 0.46) / 0.14))
        y = cy - 250 - 12 * G._pulse(t, 1.8)
        larg = 260
        boite_arrondie(d, [cx - larg / 2, y - 30, cx + larg / 2, y + 30], rayon=14,
                       fond=melange(FOND_PANNEAU, VIOLET, 0.3 * a), bord=VIOLET, largeur_bord=3)
        d.text((cx, y), "VARIABLE", font=police(30, True), fill=melange(FOND, TEXTE, a), anchor="mm")

    lignes = [
        Ligne("Un sac = un conteneur", TEXTE, 34, a_partir_de=0.12),
        Ligne("son contenu change", TEXTE_2, 30, a_partir_de=0.40),
        Ligne("→ c'est une VARIABLE", VIOLET, 34, gras=True, a_partir_de=0.62),
        Ligne("", a_partir_de=0.86),
        Ligne("(et j'ai plusieurs sacs…)", TEXTE_3, 26, gras=False, mono=False, a_partir_de=0.80),
    ]
    cahier(d, PANEL_D, lignes, p)
    bandeau_rappel(d, RAPPEL, t)


# ══════════════════════════════════════════════════════════════════════════
#  2 · Plusieurs sacs : il faut un nom
# ══════════════════════════════════════════════════════════════════════════
def scene_nom(d, p, t):
    _entete(d, "La boucle Pour — le sac et l'ascenseur", 2,
            "2 · Plusieurs sacs : il faut leur donner un nom")
    _panneaux(d, "l'histoire")
    positions = [(300, 560), (560, 560), (820, 560)]
    noms = [None, None, None]
    if p > 0.36:
        noms[2] = "S"
    for i, ((cx, cy), nom) in enumerate(zip(positions, noms)):
        apparait = _ease_out(min(1.0, max(0.0, (p - 0.05 * i) / 0.25)))
        if apparait <= 0:
            continue
        actif = nom is not None
        sac(d, cx, cy - (1 - apparait) * 60, contenu=(f"T[{i}]",), nom=nom,
            echelle=0.74 if not actif else 0.84,
            halo=(0.7 + 0.3 * G._pulse(t, 1.7)) if actif else 0.0)
        if not actif and p > 0.2:
            d.text((cx, cy + 132), "?", font=police(46, True), fill=TEXTE_3, anchor="mm")
    if p > 0.5:
        a = _ease_out(min(1.0, (p - 0.5) / 0.2))
        fleche(d, (820, 690), (700, 720), couleur=melange(FOND, AMBRE, a), epaisseur=4, progression=a)
        d.text((600, 742), "un nom : S", font=police(30, True), fill=melange(FOND, AMBRE, a), anchor="mm")

    lignes = [
        Ligne("3 sacs, 3 contenus", TEXTE, 32, a_partir_de=0.10),
        Ligne("comment les distinguer ?", TEXTE_2, 28, a_partir_de=0.30),
        Ligne("→ un NOM pour chacun", VIOLET, 32, gras=True, a_partir_de=0.48),
        Ligne("", a_partir_de=0.62),
        Ligne("je le nomme :  S", ORANGE, 40, gras=True, a_partir_de=0.66, souligne=True),
    ]
    cahier(d, PANEL_D, lignes, p)
    bandeau_rappel(d, RAPPEL, t)


# ══════════════════════════════════════════════════════════════════════════
#  3 · L'immeuble, l'ascenseur, et la question
# ══════════════════════════════════════════════════════════════════════════
def scene_immeuble(d, p, t):
    _entete(d, "La boucle Pour — le sac et l'ascenseur", 3,
            "3 · Un immeuble : je prends l'ascenseur")
    _panneaux(d, "l'histoire")
    boite = [140, 372, 584, 836]
    etages = 4
    immeuble(d, boite, etages, etage_actif=None, remplis=())
    ascenseur(d, [628, 372, 748, 836], etages, 0.0, 0, ecran=False)

    if p > 0.30:
        bulle(d, [764, 396, 1060, 486], ["Que dois-je faire ?"],
              min(1.0, (p - 0.30) / 0.18), queue=-1)
    if p > 0.56:
        bulle(d, [744, 516, 1060, 606], ["Et avec chaque client ?"], 1.0,
              accent=ORANGE, queue=-1)
    if p > 0.82:
        a = _ease_out(min(1.0, (p - 0.82) / 0.12))
        d.text((914, 690), "?", font=police(76, True), fill=melange(FOND, AMBRE, a), anchor="mm")
        d.text((914, 762), "des étages, des portes,", font=police(22), fill=melange(FOND, TEXTE_2, a), anchor="mm")
        d.text((914, 792), "un ascenseur", font=police(22), fill=melange(FOND, TEXTE_2, a), anchor="mm")

    lignes = [
        Ligne("Le plan", TEXTE, 32, gras=True, a_partir_de=0.12),
        Ligne("monter étage par étage", TEXTE_2, 28, a_partir_de=0.26),
        Ligne("ramasser ce qu'il y a", TEXTE_2, 28, a_partir_de=0.44),
        Ligne("et le mettre dans S", ORANGE, 30, a_partir_de=0.60),
        Ligne("", a_partir_de=0.78),
        Ligne("mais avec chaque client ?", TEXTE_3, 26, mono=False, a_partir_de=0.80),
    ]
    cahier(d, PANEL_D, lignes, p)
    bandeau_rappel(d, RAPPEL, t)


# ══════════════════════════════════════════════════════════════════════════
#  Le ramassage, mutualisé : étages 0 et 1
# ══════════════════════════════════════════════════════════════════════════
def _ramassage(d, p, t, etage, titre, etape, chapitre, lignes, indice, montre_avant=False):
    _entete(d, "La boucle Pour — le sac et l'ascenseur", etape, chapitre)
    _panneaux(d, "l'histoire")
    boite = [104, 352, 496, 830]
    etages = 4
    ouverture = _ease_out(max(0.0, min(1.0, (p - 0.18) / 0.14)))
    ramasse = max(0.0, min(1.0, (p - 0.36) / 0.22))
    immeuble(d, boite, etages, etage_actif=etage,
             ouvert=ouverture, remplis=tuple(range(0, etage + 1)) if ramasse > 0.9 else tuple(range(0, etage)),
             ramasse_en_cours=ramasse if ramasse < 1 else 0.0)
    position = (etage + 0.0)
    if p < 0.16:
        position = max(0.0, etage - 1) + (p / 0.16)
    ascenseur(d, [540, 352, 656, 830], etages, position, etage,
              compteur_actif=1.0 if p > 0.1 else 0.0)

    # le sac, à droite, reçoit le jeton
    sac_cx, sac_cy = 868, 586
    contenu = tuple(f"T[{k}]" for k in range(etage + 1)) if ramasse > 0.95 else \
        tuple(f"T[{k}]" for k in range(etage))
    secousse = max(0.0, 1 - abs(ramasse - 0.75) * 6) if 0.35 < ramasse < 1 else 0.0
    sac(d, sac_cx, sac_cy, contenu=contenu, nom="S", echelle=0.86,
        halo=0.5 + 0.3 * G._pulse(t, 2.2), secousse=secousse)

    if 0.3 < ramasse < 1.0:
        a = ramasse
        depart = (446, _carte_etage(boite, etage, etages))
        arrivee = (sac_cx - 40, sac_cy - 20)
        x = depart[0] + (arrivee[0] - depart[0]) * _ease(a)
        y = depart[1] + (arrivee[1] - depart[1]) * _ease(a) - math.sin(a * math.pi) * 90
        jeton(d, x, y, f"T[{etage}]", couleur=AMBRE, echelle=0.9)

    if p > 0.72:
        a = _ease_out(min(1.0, (p - 0.72) / 0.15))
        d.text((940, 776), "ça marche", font=police(30, True),
               fill=melange(FOND, VERT, a), anchor="rm")
        coche(d, 962, 774, 40, progression=a)

    cahier(d, PANEL_D, lignes, p)
    bandeau_rappel(d, RAPPEL, t)


def scene_etage0(d, p, t):
    lignes = [
        Ligne("le nouveau contenu du sac =", TEXTE_2, 25, mono=False, a_partir_de=0.10),
        Ligne("l'ancien contenu + l'étage 0", TEXTE_2, 25, mono=False, a_partir_de=0.16),
        Ligne("S = S + T[0]", TEXTE, 34, a_partir_de=0.30, barree=True),
        Ligne("", a_partir_de=0.44),
        Ligne("S = S + T[0]", AMBRE, 40, gras=True, a_partir_de=0.50, souligne=True),
        Ligne("", a_partir_de=0.72),
        Ligne("→ ça marche !", VERT, 30, gras=True, mono=False, a_partir_de=0.78),
    ]
    _ramassage(d, p, t, 0, "étage 0", 4, "4 · Étage 0 : S reçoit T[0]", lignes, 0)


def scene_compteur(d, p, t):
    _entete(d, "La boucle Pour — le sac et l'ascenseur", 5,
            "5 · L'ascenseur avance… et il compte")
    _panneaux(d, "l'histoire")
    boite = [140, 372, 560, 836]
    etages = 4
    montee = _ease_out(max(0.0, min(1.0, (p - 0.18) / 0.34)))
    position = montee
    etage = 0 if p < 0.5 else 1
    immeuble(d, boite, etages, etage_actif=etage, remplis=(0,))
    ascenseur(d, [604, 372, 724, 836], etages, position, etage,
              compteur_actif=1.0 if p > 0.2 else 0.0)

    if p > 0.55:
        compteur(d, 902, 500, 1, actif=1.0)
        d.text((902, 640), "l'ascenseur compte les étages", font=police(23), fill=TEXTE_2, anchor="mm")
        d.text((902, 678), "→ on utilise un compteur", font=police(25, True), fill=BLEU, anchor="mm")
    elif p > 0.3:
        compteur(d, 902, 500, 0, actif=1.0)

    lignes = [
        Ligne("Il avance…", TEXTE, 30, mono=False, a_partir_de=0.08),
        Ligne("et il compte : 0, 1, 2…", TEXTE_2, 28, mono=False, a_partir_de=0.28),
        Ligne("", a_partir_de=0.48),
        Ligne("compteur = 0", BLEU, 32, a_partir_de=0.56),
        Ligne("compteur = 1", BLEU, 32, a_partir_de=0.72),
        Ligne("", a_partir_de=0.86),
        Ligne("→ un COMPTEUR", BLEU, 30, gras=True, mono=False, a_partir_de=0.88),
    ]
    cahier(d, PANEL_D, lignes, p)
    bandeau_rappel(d, RAPPEL, t)


def scene_repetition(d, p, t):
    lignes = [
        Ligne("1re fois :", TEXTE_3, 24, mono=False, a_partir_de=0.14),
        Ligne("S = S + T[0]", TEXTE_2, 32, a_partir_de=0.18),
        Ligne("", a_partir_de=0.36),
        Ligne("2e fois :", TEXTE_3, 24, mono=False, a_partir_de=0.42),
        Ligne("S = S + T[1]", AMBRE, 38, gras=True, a_partir_de=0.46, souligne=True),
        Ligne("", a_partir_de=0.66),
        Ligne("c'est la même chose…", TEXTE_2, 27, mono=False, a_partir_de=0.70),
        Ligne("… qui se répète", ORANGE, 30, gras=True, mono=False, a_partir_de=0.82),
    ]
    _ramassage(d, p, t, 1, "étage 1", 6, "6 · Étage 1 : je répète", lignes, 1, montre_avant=True)


# ══════════════════════════════════════════════════════════════════════════
#  7 · Ce « quelque chose », c'est le compteur
# ══════════════════════════════════════════════════════════════════════════
def scene_quelquechose(d, p, t):
    _entete(d, "La boucle Pour — le sac et l'ascenseur", 7,
            "7 · Le « quelque chose » qui change, c'est le compteur")
    _panneaux(d, "l'histoire")
    sac(d, 360, 560, contenu=("T[0]", "T[1]"), nom="S", echelle=0.9,
        halo=0.4 + 0.25 * G._pulse(t, 2.6))
    valeur = 0 if p < 0.52 else 1
    compteur(d, 830, 520, valeur, actif=1.0)
    if p > 0.3:
        a = _ease_out(min(1.0, (p - 0.3) / 0.2))
        fleche(d, (800, 610), (450, 690), couleur=melange(FOND, BLEU, a), epaisseur=4, progression=a)
        d.text((620, 738), "c'est lui l'indice", font=police(26, True), fill=melange(FOND, BLEU, a), anchor="mm")

    # l'indice de T[ ] suit le compteur
    jeton(d, 600, 372, f"T[{valeur}]", couleur=AMBRE, echelle=1.15)
    if p > 0.62:
        a = _ease_out(min(1.0, (p - 0.62) / 0.16))
        d.text((600, 292), "0 → 0,  1 → 1", font=police(26, True),
               fill=melange(FOND, AMBRE, a), anchor="mm")

    lignes = [
        Ligne("S = S + T[quelque chose]", TEXTE, 32, a_partir_de=0.10),
        Ligne("", a_partir_de=0.28),
        Ligne("quoi, ce quelque chose ?", TEXTE_3, 26, mono=False, a_partir_de=0.30),
        Ligne("", a_partir_de=0.46),
        Ligne("compteur = 0  →  T[0]", BLEU, 30, a_partir_de=0.50),
        Ligne("compteur = 1  →  T[1]", BLEU, 30, a_partir_de=0.62),
        Ligne("", a_partir_de=0.76),
        Ligne("S = S + T[compteur]", AMBRE, 36, gras=True, a_partir_de=0.80, souligne=True),
    ]
    cahier(d, PANEL_D, lignes, p)
    bandeau_rappel(d, RAPPEL, t)


# ══════════════════════════════════════════════════════════════════════════
#  8 · Le bloc
# ══════════════════════════════════════════════════════════════════════════
def scene_bloc(d, p, t):
    _entete(d, "La boucle Pour — le sac et l'ascenseur", 8,
            "8 · J'écris le bloc à répéter")
    _panneaux(d, "l'histoire")
    # la tour des étages, qui défile : le bloc reçoit les jetons un à un
    boite = [130, 352, 520, 830]
    etages = 4
    cycle = (p * 3.2) % 1.0
    etage = min(etages - 1, int(p * 3.2))
    immeuble(d, boite, etages, etage_actif=etage, ouvert=0.9,
             remplis=tuple(range(0, etage + 1)))
    ascenseur(d, [564, 352, 684, 830], etages, float(etage), etage, compteur_actif=1.0)
    recus = tuple(f"T[{k}]" for k in range(0, etage + 1))
    sac(d, 880, 580, contenu=recus, nom="S", echelle=0.82,
        halo=0.5 + 0.3 * G._pulse(t, 1.4), secousse=0.35 * (1 - cycle))

    d.text((884, 760), "il reçoit tous les étages", font=police(23), fill=TEXTE_2, anchor="mm")

    lignes = [
        Ligne("{", TEXTE_2, 38, a_partir_de=0.06),
        Ligne("    S = S + T[compteur];", AMBRE, 32, retrait=20, a_partir_de=0.16),
        Ligne("}", TEXTE_2, 38, a_partir_de=0.30),
        Ligne("", a_partir_de=0.44),
        Ligne("ce bloc, je le répète…", TEXTE_2, 27, mono=False, a_partir_de=0.48),
        Ligne("mais combien de fois ?", ORANGE, 30, gras=True, mono=False, a_partir_de=0.64),
        Ligne("et si ça s'arrête trop tôt ?", TEXTE_3, 25, mono=False, a_partir_de=0.78),
    ]
    cahier(d, PANEL_D, lignes, p)
    bandeau_rappel(d, RAPPEL, t)


# ══════════════════════════════════════════════════════════════════════════
#  9 · La boucle Pour, complète
# ══════════════════════════════════════════════════════════════════════════
def scene_boucle(d, p, t):
    _entete(d, "La boucle Pour — le sac et l'ascenseur", 9,
            "9 · La boucle Pour : la structure complète")
    panneau(d, PANEL_G, "le résultat", accent=melange(BORDURE, VERT, 0.35))
    cadre_code(d, PANEL_D, "la boucle Pour", accent=VERT)

    # l'immeuble a été parcouru : le sac est plein
    boite = [130, 352, 520, 830]
    parcourus = min(4, 1 + int(p * 6))
    immeuble(d, boite, 4, etage_actif=parcourus - 1, ouvert=0.85,
             remplis=tuple(range(0, parcourus)))
    ascenseur(d, [564, 352, 684, 830], 4, float(parcourus - 1), parcourus - 1, compteur_actif=1.0)
    recus = tuple(f"T[{k}]" for k in range(0, parcourus))
    sac(d, 880, 580, contenu=recus, nom="S", echelle=0.82,
        halo=0.5 + 0.3 * G._pulse(t, 1.9))

    if p > 0.62:
        a = _ease_out(min(1.0, (p - 0.62) / 0.14))
        d.text((884, 700), "tous les étages sont passés", font=police(24), fill=melange(FOND, TEXTE_2, a), anchor="mm")
        coche(d, 806, 762, 44, progression=a)
        d.text((842, 762), "S contient tout", font=police(26, True), fill=melange(FOND, VERT, a), anchor="lm")

    lignes = [
        Ligne("Pour compteur de 0 à n-1 faire", TEXTE, 30, a_partir_de=0.06),
        Ligne("    S = S + T[compteur]", AMBRE, 30, retrait=24, a_partir_de=0.16),
        Ligne("Fin Pour", TEXTE, 30, a_partir_de=0.26),
        Ligne("", a_partir_de=0.36),
        Ligne("for (let i = 0; i < n; i++) {", BLEU, 28, a_partir_de=0.40),
        Ligne("  S = S + T[i];", AMBRE, 28, retrait=24, a_partir_de=0.50),
        Ligne("}", BLEU, 28, a_partir_de=0.56),
        Ligne("", a_partir_de=0.64),
        Ligne("départ      : compteur = 0", VERT, 24, a_partir_de=0.66, mono=False),
        Ligne("condition   : compteur < n", VERT, 24, a_partir_de=0.74, mono=False),
        Ligne("corps       : S = S + T[…]", VERT, 24, a_partir_de=0.82, mono=False),
        Ligne("fin         : compteur + 1", VERT, 24, a_partir_de=0.90, mono=False),
    ]
    cahier(d, PANEL_D, lignes, p)
    bandeau_rappel(d, [("0", "départ", VERT), ("< n", "condition", VERT),
                       ("S + T[…]", "le corps", AMBRE), ("+1", "incrément", VERT)], t)


SCENES = {
    "sac": scene_sac,
    "nom": scene_nom,
    "immeuble": scene_immeuble,
    "etage0": scene_etage0,
    "compteur": scene_compteur,
    "repetition": scene_repetition,
    "quelquechose": scene_quelquechose,
    "bloc": scene_bloc,
    "boucle": scene_boucle,
}


def dessiner(d, segment, p, t):
    """Point d'entrée : dessine la scène du segment à l'avancement p."""
    SCENES[segment](d, p, t)
