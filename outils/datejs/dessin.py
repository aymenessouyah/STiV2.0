"""Le strict nécessaire de dessin pour « L'objet Date ».

Le thème vient de `outils/tpvid6/theme.py` (comme toutes les capsules) ; ce
module garde le fond, les constantes de l'écran, et trois primitives propres à
cette capsule :

* `calendrier()` — la grille du mois de septembre 2026, avec le 15 encerclé :
  c'est le dessin qui montre d'où viennent `getDate()`, `getMonth()` et
  `getFullYear()` ;
* `bande_mois()` — les douze mois alignés sous leurs deux numéros, `0` et
  habituel : le piège de `getMonth()` devient une image ;
* `horloge()` — la date du jour, telle que `new Date()` la lit sur la machine.
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

# Les cases du calendrier.
CASE_FOND = (24, 32, 49)
CASE_BORD = (58, 72, 100)
CASE_NUM = (120, 138, 168)
JOUR_VIDE = (17, 24, 38)


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
    """Le trait qui dit « hors programme »."""
    d.line([(x0, y), (x1, y)], fill=couleur, width=largeur)


# ── Le calendrier : un mois, une grille, un jour encerclé ─────────────────
JOURS_COURTS = ["L", "M", "M", "J", "V", "S", "D"]
# Septembre 2026 commence un mardi (1er septembre 2026).
DECALAGE_SEPTEMBRE_2026 = 1
JOURS_SEPTEMBRE_2026 = 30


def calendrier(d, x: int, y: int, case: int = 54, actif: int = 15,
               mois: str = "septembre 2026", couleur=AMBRE, k: float = 1.0,
               jours: int = JOURS_SEPTEMBRE_2026,
               decalage: int = DECALAGE_SEPTEMBRE_2026):
    """La grille du mois, avec le jour `actif` encerclé.

    Le 1er septembre 2026 tombe un mardi : la grille laisse donc une case vide
    en tête, comme un vrai calendrier. Une case = un jour.
    """
    if k <= 0.004:
        return 0
    d.text((x, y), mois, font=police(20, True),
           fill=melange(PAPIER, couleur, k), anchor="la")
    y += 34
    for i, lettre in enumerate(JOURS_COURTS):
        d.text((x + i * case + case / 2, y + 12), lettre, font=police(15, True),
               fill=melange(PAPIER, CASE_NUM, k), anchor="mm")
    y += 28
    for jour in range(1, jours + 1):
        rang = jour - 1 + decalage
        col, ligne = rang % 7, rang // 7
        x0 = x + col * case
        y0 = y + ligne * case
        cercle = jour == actif
        boite_arrondie(d, [x0 + 3, y0 + 3, x0 + case - 3, y0 + case - 3], rayon=8,
                       fond=melange(PAPIER, couleur if cercle else CASE_FOND, 0.55 * k if cercle else k),
                       bord=melange(PAPIER, couleur if cercle else CASE_BORD, k),
                       largeur_bord=2 if cercle else 1)
        d.text((x0 + case / 2, y0 + case / 2 + 1), str(jour),
               font=police(int(case * 0.42), True),
               fill=melange(PAPIER, (14, 20, 32) if cercle else TEXTE, k),
               anchor="mm")
    return y + ((jours + decalage + 6) // 7) * case


MOIS = ["janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre"]


def bande_mois(d, x: int, y: int, largeur_case: int = 62, actif: int = 8,
               couleur=VIOLET, k: float = 1.0, numéros: bool = True):
    """Les douze mois, chacun avec ses deux numéros : 0 → 11 et 1 → 12.

    C'est la ligne qui règle définitivement le piège de getMonth() : le même
    mois porte le numéro 8 pour JavaScript et le numéro 9 pour un humain.
    """
    if k <= 0.004:
        return 0
    for i, nom in enumerate(MOIS):
        x0 = x + i * largeur_case
        plein = i == actif
        boite_arrondie(d, [x0 + 2, y, x0 + largeur_case - 2, y + 84], rayon=7,
                       fond=melange(PAPIER, couleur if plein else CASE_FOND, 0.50 * k if plein else k),
                       bord=melange(PAPIER, couleur if plein else CASE_BORD, k),
                       largeur_bord=2 if plein else 1)
        d.text((x0 + largeur_case / 2, y + 14), nom[:4].capitalize(),
               font=police(13, True),
               fill=melange(PAPIER, (14, 20, 32) if plein else TEXTE_2, k),
               anchor="mm")
        if numéros:
            d.text((x0 + largeur_case / 2, y + 42), str(i),
                   font=police(15, True, mono=True),
                   fill=melange(PAPIER, (14, 20, 32) if plein else couleur, k),
                   anchor="mm")
            d.text((x0 + largeur_case / 2, y + 64), f"({i + 1})",
                   font=police(12, False, mono=True),
                   fill=melange(PAPIER, (14, 20, 32) if plein else CASE_NUM, k),
                   anchor="mm")
    return x + 12 * largeur_case


def horloge(d, x: int, y: int, jour: int = 30, mois_num: int = 9,
            annee: int = 2026, couleur=BLEU, k: float = 1.0):
    """La date du jour, lue sur la machine : ce que renvoie new Date()."""
    if k <= 0.004:
        return
    boite_arrondie(d, [x, y, x + 470, y + 108], rayon=14,
                   fond=melange(PAPIER, couleur, 0.10 * k),
                   bord=melange(PAPIER, couleur, 0.65 * k), largeur_bord=2)
    d.text((x + 20, y + 24), "la date de l'ordinateur, maintenant",
           font=police(15), fill=melange(PAPIER, TEXTE_2, k), anchor="la")
    d.text((x + 20, y + 58), f"{jour:02d} / {mois_num:02d} / {annee}",
           font=police(38, True, mono=True),
           fill=melange(PAPIER, TEXTE, k), anchor="la")
    d.text((x + 300, y + 74), "varie à chaque exécution",
           font=police(14, True), fill=melange(PAPIER, couleur, k), anchor="la")
