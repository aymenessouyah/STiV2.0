"""Le strict nécessaire de dessin pour « La console et les variables ».

Le thème vient de `outils/tpvid6/theme.py` (comme les autres capsules) ; ce
module ne garde que le fond et les constantes de l'écran.
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

# Les deux moitiés de l'écran : le cours à gauche, le code à droite.
GAUCHE = (64, 186, 916, 884)
DROITE = (940, 186, 1856, 884)
BANDE = (64, 906, 1856, 1012)

# Le papier du cours, le verre de la console.
PAPIER = (29, 36, 53)
PAPIER_LIGNE = (44, 54, 75)
ENCRE = (216, 224, 238)
ROUGE_STYLO = (238, 92, 92)
CODE_FOND = (11, 17, 30)
CODE_LIGNE = (7, 11, 20)


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
    """Le papier du cours, avec ses lignes de cahier."""
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
