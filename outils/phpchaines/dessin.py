"""Le strict nécessaire de dessin pour « Chaînes, transtypage et date/heure ».

Le thème vient de `outils/tpvid6/theme.py` (comme toutes les capsules) ; ce
module garde le fond, les constantes de l'écran, et trois primitives propres à
cette capsule :

* `ruban_octets()` — **le dessin central** : quatorze cases numérotées de 0 à
  13, une par octet, pour la chaîne `"Lycée Rafèha"`. Les deux lettres
  accentuées y occupent deux cases, encadrées : c'est ce dessin qui explique
  pourquoi `R` est à la position 7, pourquoi `strlen` donne 14, et pourquoi
  `substr` peut couper un accent en deux ;
* `frise_timestamp()` — la ligne du temps qui va du 1ᵉʳ janvier 1970 à la
  rentrée de 2026 : ce qu'est un timestamp ;
* `table_lettres()` — les dix lettres du format de `date()`, avec leur
  signification et un exemple.
"""
from __future__ import annotations

import math

from theme import (
    FOND, FOND_PANNEAU, FOND_PANNEAU_2, BORDURE, TEXTE, TEXTE_2, TEXTE_3,
    ORANGE, AMBRE, VIOLET, VERT, BLEU, ROSE, ROUGE_BORD,
    police, melange, boite_arrondie, fleche,
)

LARGEUR, HAUTEUR = 1920, 1080
MARGE = 64

# Les deux moitiés de l'écran : la fiche à gauche, le code à droite.
GAUCHE = (64, 186, 916, 884)
DROITE = (940, 186, 1856, 884)
BANDE = (64, 906, 1856, 1012)

# Le papier de la fiche, le verre de la console.
PAPIER = (29, 36, 53)
PAPIER_LIGNE = (44, 54, 75)
ENCRE = (216, 224, 238)
ROUGE_STYLO = (238, 92, 92)
CODE_FOND = (11, 17, 30)
CODE_LIGNE = (7, 11, 20)

# Les cases du ruban d'octets.
CASE_FOND = (24, 32, 49)
CASE_BORD = (58, 72, 100)
CASE_NUM = (120, 138, 168)


def _pulse(t: float, periode: float = 6.0) -> float:
    return 0.5 + 0.5 * math.sin(2 * math.pi * t / max(0.1, periode))


def fond(d, t: float = 0.0):
    """Dégradé de nuit, deux halos très discrets."""
    for y in range(HAUTEUR):
        k = y / HAUTEUR
        d.line([(0, y), (LARGEUR, y)],
               fill=(int(12 + 8 * k), int(18 + 8 * k), int(33 + 12 * k)))
    halo = int(9 * _pulse(t, 7.0))
    d.ellipse([1180 - 430, -430, 1180 + 430, 250], fill=(18 + halo, 28 + halo, 50 + halo))
    d.ellipse([-420, 640, 560, 1360], fill=(22, 26, 40))


def panneau(d, box, titre_: str, accent=BORDURE):
    """Le cadre d'une moitié d'écran, avec son titre."""
    boite_arrondie(d, box, rayon=20, fond=FOND_PANNEAU,
                   bord=accent, largeur_bord=2)
    if titre_:
        d.text((box[0] + 24, box[1] + 20), titre_, font=police(21, True),
               fill=accent, anchor="la")


def papier(d, box):
    """Le papier de la fiche, avec ses lignes de cahier."""
    boite_arrondie(d, box, rayon=16, fond=PAPIER,
                   bord=melange(BORDURE, TEXTE_3, 0.30), largeur_bord=2)
    y = box[1] + 44
    while y < box[3] - 12:
        d.line([(box[0] + 18, y), (box[2] - 18, y)], fill=PAPIER_LIGNE, width=1)
        y += 42


def console(d, box):
    """Le fond de la console : presque noir, avec sa barre de titre."""
    boite_arrondie(d, box, rayon=16, fond=CODE_FOND,
                   bord=melange(BORDURE, VERT, 0.35), largeur_bord=2)
    d.rounded_rectangle([box[0], box[1], box[2], box[1] + 40], radius=16,
                        fill=CODE_LIGNE)
    d.rectangle([box[0], box[1] + 28, box[2], box[1] + 40], fill=CODE_LIGNE)
    for i, couleur in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse([box[0] + 18 + i * 22, box[1] + 13,
                   box[0] + 30 + i * 22, box[1] + 25], fill=couleur)


def barrer(d, x0, x1, y, couleur=ROUGE_STYLO, largeur=3):
    """Le trait qui dit « faux » ou « hors programme »."""
    d.line([(x0, y), (x1, y)], fill=couleur, width=largeur)


# ── Le ruban d'octets : une case par octet ────────────────────────────────
# La chaîne de toute la capsule, octet par octet. Les deux lettres accentuées
# occupent deux octets : la lettre est écrite sur le premier, et les deux
# cases sont encadrées ensemble.
LETTRES = {0: "L", 1: "y", 2: "c", 3: "é", 5: "e", 6: "␣",
           7: "R", 8: "a", 9: "f", 10: "è", 12: "h", 13: "a"}
ACCENTS = {3: (3, 4, "é", ("C3", "A9")), 10: (10, 11, "è", ("C3", "A8"))}
OCTETS = 14


def ruban_octets(d, x: int, y: int, case: int = 52, actif=(), couleur=AMBRE,
                 k: float = 1.0, accents: bool = True, hexa: bool = False,
                 curseur: int | None = None):
    """Les quatorze octets de « Lycée Rafèha », avec leur position au-dessus.

    `actif` met en évidence les positions citées (une liste d'indices) ;
    `curseur` souligne la position en cours de lecture ; `hexa` remplace les
    lettres des cases d'accent par les deux octets qui les composent.
    """
    if k <= 0.004:
        return 0
    actif = set(actif)
    for i in range(OCTETS):
        x0 = x + i * case
        marque = i in actif
        d.text((x0 + case / 2, y + 14), str(i), font=police(17, True),
               fill=melange(PAPIER, couleur if marque else CASE_NUM, k),
               anchor="mm")
        boite_arrondie(d, [x0 + 3, y + 30, x0 + case - 3, y + 30 + case],
                       rayon=8,
                       fond=melange(PAPIER, couleur if marque else CASE_FOND,
                                    0.55 * k if marque else k),
                       bord=melange(PAPIER, couleur if marque else CASE_BORD, k),
                       largeur_bord=2 if marque else 1)
        lettre = LETTRES.get(i, "")
        # la case de continuation d'un accent porte son octet, en petit
        continuation = {4: "A9", 11: "A8"}.get(i)
        if lettre:
            couleur_lettre = TEXTE_3 if lettre == "␣" else (
                (16, 22, 34) if marque else ENCRE)
            d.text((x0 + case / 2, y + 30 + case / 2 + 1), lettre,
                   font=police(int(case * 0.44), True),
                   fill=melange(PAPIER, couleur_lettre, k), anchor="mm")
        elif continuation and not hexa:
            d.text((x0 + case / 2, y + 30 + case / 2), continuation,
                   font=police(int(case * 0.26), True, mono=True),
                   fill=melange(PAPIER, VIOLET, 0.85 * k), anchor="mm")
    # Les deux cases de chaque accent, encadrées ensemble : « 2 octets ».
    if accents:
        for debut, (a, b, lettre, _octets) in ACCENTS.items():
            xa = x + a * case
            xb = x + b * case + case
            d.rounded_rectangle([xa - 3, y + 26, xb + 3, y + 34 + case],
                                radius=10,
                                outline=melange(PAPIER, VIOLET, k), width=2)
    if curseur is not None:
        x0 = x + curseur * case
        d.line([(x0 + 4, y + 40 + case), (x0 + case - 4, y + 40 + case)],
               fill=melange(PAPIER, ROSE, k), width=4)
    return y + 30 + case


def legende_ruban(d, x: int, y: int, texte: str, couleur=CASE_NUM, k: float = 1.0):
    """La ligne sous le ruban : ce qu'il faut lire dans les cases."""
    if k <= 0:
        return
    d.text((x, y), texte, font=police(15), fill=melange(PAPIER, couleur, k),
           anchor="la")


def repere(d, x: int, y: int, texte: str, couleur=ROSE, k: float = 1.0,
           largeur: int = 52):
    """Le trait et l'étiquette sous un morceau du ruban."""
    if k <= 0:
        return
    d.line([(x, y), (x + largeur, y)], fill=melange(PAPIER, couleur, k), width=3)
    d.text((x + largeur / 2, y + 8), texte, font=police(15, True),
           fill=melange(PAPIER, couleur, k), anchor="ma")


# ── La frise du timestamp ─────────────────────────────────────────────────
def frise_timestamp(d, x: int, y: int, largeur: int = 700, k: float = 1.0,
                    couleur=BLEU, depart="1ᵉʳ janvier 1970",
                    arrivee="15 septembre 2026", secondes="1 789 459 200 s"):
    """La ligne du temps : 1970 → la rentrée, et la distance en secondes."""
    if k <= 0.004:
        return
    d.line([(x, y), (x + largeur, y)], fill=melange(PAPIER, BORDURE, k), width=3)
    d.line([(x, y - 9), (x, y + 9)], fill=melange(PAPIER, BLEU, k), width=3)
    d.line([(x + largeur, y - 9), (x + largeur, y + 9)],
           fill=melange(PAPIER, AMBRE, k), width=3)
    d.text((x, y + 16), depart, font=police(16), fill=melange(PAPIER, TEXTE_3, k),
           anchor="la")
    d.text((x + largeur, y + 16), arrivee, font=police(16, True),
           fill=melange(PAPIER, AMBRE, k), anchor="ra")
    d.text((x + largeur / 2, y - 18), secondes, font=police(19, True),
           fill=melange(PAPIER, couleur, k), anchor="mm")
    # quelques graduations, une par décennie
    for i in range(1, 6):
        xx = x + largeur * i / 6
        d.line([(xx, y - 5), (xx, y + 5)], fill=melange(PAPIER, BORDURE, k), width=2)


# ── Le tableau des lettres de date() ──────────────────────────────────────
LETTRES_DATE = [
    ("d", "jour du mois, 2 chiffres", "05"),
    ("j", "jour du mois, sans zéro", "5"),
    ("m", "mois, 2 chiffres", "09"),
    ("n", "mois, sans zéro", "9"),
    ("Y", "année, 4 chiffres", "2026"),
    ("y", "année, 2 chiffres", "26"),
    ("H", "heure, 00 → 23", "08"),
    ("i", "minutes", "00"),
    ("s", "secondes", "00"),
    ("D", "jour court (anglais)", "Tue"),
    ("l", "jour entier (anglais)", "Tuesday"),
]


def table_lettres(d, x: int, y: int, k: float = 1.0, pas: int = 28,
                  actif=(), couleur=VIOLET, colonnes: int = 2):
    """Les lettres du format de date(), en deux colonnes, avec un exemple."""
    if k <= 0.004:
        return y
    actif = set(actif)
    lignes = (len(LETTRES_DATE) + colonnes - 1) // colonnes
    largeur_col = 386
    for i, (lettre, sens, exemple) in enumerate(LETTRES_DATE):
        col, ligne = divmod(i, lignes)
        x0 = x + col * largeur_col
        y0 = y + ligne * pas
        marque = lettre in actif
        if marque:
            boite_arrondie(d, [x0 - 8, y0 - pas / 2 - 2, x0 + largeur_col - 22,
                               y0 + pas / 2 - 2], rayon=8,
                           fond=melange(PAPIER, couleur, 0.22 * k),
                           bord=melange(PAPIER, couleur, 0.7 * k), largeur_bord=1)
        d.text((x0, y0), lettre, font=police(18, True, mono=True),
               fill=melange(PAPIER, couleur if marque else AMBRE, k), anchor="lm")
        d.text((x0 + 30, y0), sens, font=police(16),
               fill=melange(PAPIER, ENCRE if marque else TEXTE_2, k), anchor="lm")
        d.text((x0 + largeur_col - 32, y0), exemple, font=police(16, True, mono=True),
               fill=melange(PAPIER, VERT, k), anchor="rm")
    return y + lignes * pas
