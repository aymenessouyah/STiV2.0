"""Le strict nécessaire de dessin pour le cours « Systèmes, technologies et Internet ».

Le thème vient de `outils/tpvid6/theme.py` (comme toutes les capsules) ; ce
module garde le fond, les constantes de l'écran, et les primitives propres à un
**cours** :

* `carte()` — une notion, son exemple, une couleur : la brique des listes ;
* `table()` — les tableaux du manuel (rôles, LAN/MAN/WAN, protocoles) ;
* `chaine()` — une suite de boîtes reliées par des flèches (le trajet d'une
  mesure, la publication MQTT, les trois temps du déploiement) ;
* `pile()` — les couches de la machine, de l'utilisateur au matériel ;
* `etiquette()` — un sigle posé sur un schéma (IP, MAC, DNS).
"""
from __future__ import annotations

import math

from theme import (
    FOND, FOND_PANNEAU, FOND_PANNEAU_2, BORDURE, TEXTE, TEXTE_2, TEXTE_3,
    ORANGE, AMBRE, VIOLET, VERT, BLEU, ROSE, ROUGE_BORD,
    police, melange, boite_arrondie, fleche, couper_texte, largeur_texte,
)

LARGEUR, HAUTEUR = 1920, 1080
MARGE = 64

# Les deux moitiés de l'écran : le cours à gauche, les tableaux à droite.
GAUCHE = (64, 186, 916, 884)
DROITE = (940, 186, 1856, 884)
BANDE = (64, 906, 1856, 1012)


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


def carte(d, box, titre: str, corps=(), couleur=BLEU, p: float = 1.0,
          seuil: float = 0.0, taille_titre: int = 23, taille_corps: int = 19,
          sigle: str | None = None):
    """Une carte : un titre, un sigle à droite, puis des lignes de texte."""
    x0, y0, x1, y1 = box
    if p < seuil:
        return
    k = min(1.0, (p - seuil) / 0.12)
    fond_ = melange(FOND_PANNEAU, melange(FOND_PANNEAU_2, couleur, 0.10), k)
    boite_arrondie(d, box, rayon=14, fond=fond_,
                   bord=melange(FOND_PANNEAU, couleur, 0.55 * k), largeur_bord=2)
    # le filet de couleur, à gauche : la carte a du relief
    d.rounded_rectangle([x0, y0 + 6, x0 + 5, y1 - 6], radius=3,
                        fill=melange(FOND_PANNEAU, couleur, k))
    d.text((x0 + 22, y0 + 16), titre, font=police(taille_titre, True),
           fill=melange(FOND_PANNEAU, TEXTE, k), anchor="la")
    if sigle:
        d.text((x1 - 18, y0 + 20), sigle, font=police(17, True),
               fill=melange(FOND_PANNEAU, couleur, k), anchor="ra")
    y = y0 + 16 + taille_titre + 14
    for ligne in corps:
        if y > y1 - taille_corps:
            break
        for morceau in couper_texte(ligne, taille_corps, x1 - x0 - 44):
            if y > y1 - taille_corps:
                break
            d.text((x0 + 22, y), morceau, font=police(taille_corps),
                   fill=melange(FOND_PANNEAU, TEXTE_2, k), anchor="la")
            y += taille_corps + 8
        y += 4


def table(d, box, entetes, lignes, couleur=AMBRE, p: float = 1.0,
          seuil: float = 0.0, largeurs=None, taille: int = 19,
          couleur_cle=None, pas: float | None = None, seuils=None):
    """Un tableau : en-tête souligné, puis une ligne par entrée.

    `largeurs` donne les fractions de largeur des colonnes ; la première
    colonne est écrite en gras. Chaque ligne apparaît l'une après l'autre.
    """
    x0, y0, x1, y1 = box
    if p < seuil:
        return
    largeur = x1 - x0
    n = len(entetes)
    parts = largeurs or [1.0 / n] * n
    xs, curseur = [], x0
    for part in parts:
        xs.append(curseur)
        curseur += largeur * part
    pas = pas or (taille + 20)
    d.text((x0, y0), entetes[0], font=police(17, True), fill=melange(FOND_PANNEAU, couleur, 0.85), anchor="la")
    for i, entete in enumerate(entetes[1:], start=1):
        d.text((xs[i] + 8, y0), entete, font=police(17, True),
               fill=melange(FOND_PANNEAU, couleur, 0.85), anchor="la")
    d.line([(x0, y0 + 28), (x1, y0 + 28)], fill=melange(FOND_PANNEAU, couleur, 0.5), width=2)
    y = y0 + 46
    for j, ligne in enumerate(lignes):
        # `seuils` donne l'apparition de chaque ligne (une paragraphe de la
        # voix) ; sinon les lignes tombent l'une après l'autre, à pas régulier.
        s_ligne = seuils[j] if seuils else seuil + j * 0.06
        if p < s_ligne:
            return
        k = min(1.0, (p - s_ligne) / 0.10)
        if y + taille + 6 > y1:
            break
        cellules = list(ligne)
        d.text((x0, y), cellules[0], font=police(taille, True),
               fill=melange(FOND_PANNEAU, couleur_cle or TEXTE, k), anchor="la")
        for i, cellule in enumerate(cellules[1:], start=1):
            morceaux = couper_texte(cellule, taille, largeur - (xs[i] - x0) - 16)
            d.text((xs[i] + 8, y), morceaux[0], font=police(taille),
                   fill=melange(FOND_PANNEAU, TEXTE_2, k), anchor="la")
            if len(morceaux) > 1:
                y += taille + 6
                d.text((xs[i] + 8, y), morceaux[1], font=police(taille),
                       fill=melange(FOND_PANNEAU, TEXTE_2, k), anchor="la")
        y += pas
        if j < len(lignes) - 1:
            d.line([(x0, y - 12), (x1, y - 12)], fill=melange(FOND_PANNEAU, BORDURE, 0.9), width=1)


def chaine(d, box, etapes, p: float = 1.0, seuil: float = 0.0,
           verticale: bool = False, taille_titre: int = 21, taille_corps: int = 17,
           couleur_defaut=BLEU, remplir: float = 0.62):
    """Des boîtes reliées par des flèches, une par étape.

    `etapes` = [(titre, détail, couleur)] ; une étape sans titre et sans détail
    est un simple maillon : la flèche est dessinée seule.
    """
    x0, y0, x1, y1 = box
    n = len(etapes)
    if verticale:
        hauteur = (y1 - y0 - (n - 1) * 26) / n
        boites = [(x0, y0 + i * (hauteur + 26), x1, y0 + i * (hauteur + 26) + hauteur)
                  for i in range(n)]
    else:
        fleche_w = 30
        largeur = (x1 - x0 - (n - 1) * fleche_w) / n
        boites = [(x0 + i * (largeur + fleche_w), y0,
                   x0 + i * (largeur + fleche_w) + largeur, y0 + (y1 - y0) * remplir)
                  for i in range(n)]
    for i, (titre, detail, couleur) in enumerate(etapes):
        if p < seuil + i * 0.08:
            return
        k = min(1.0, (p - seuil - i * 0.08) / 0.14)
        carte(d, boites[i], titre, [detail] if detail else [],
              couleur=couleur or couleur_defaut, p=1.0,
              taille_titre=taille_titre, taille_corps=taille_corps)
        if i < n - 1:
            if verticale:
                fleche(d, ((boites[i][0] + boites[i][2]) / 2, boites[i][3] + 3),
                       ((boites[i][0] + boites[i][2]) / 2, boites[i + 1][1] - 4),
                       couleur=melange(FOND_PANNEAU, TEXTE_3, k), epaisseur=3,
                       progression=k)
            else:
                fleche(d, (boites[i][2] + 5, (boites[i][1] + boites[i][3]) / 2),
                       (boites[i + 1][0] - 5, (boites[i][1] + boites[i][3]) / 2),
                       couleur=melange(FOND_PANNEAU, TEXTE_3, k), epaisseur=3,
                       progression=k)


def pile(d, box, couches, p: float = 1.0, seuil: float = 0.0,
         taille_titre: int = 24, taille_corps: int = 18):
    """Les couches de la machine, empilées du haut vers le bas.

    `couches` = [(titre, détail, couleur, mis_en_avant)].
    """
    x0, y0, x1, y1 = box
    n = len(couches)
    hauteur = (y1 - y0 - (n - 1) * 22) / n
    for i, (titre, detail, couleur, vedette) in enumerate(couches):
        if p < seuil + i * 0.08:
            return
        k = min(1.0, (p - seuil - i * 0.08) / 0.14)
        y = y0 + i * (hauteur + 22)
        boite = (x0, y, x1, y + hauteur)
        fond_ = melange(FOND_PANNEAU, melange(FOND_PANNEAU_2, couleur, 0.22 if vedette else 0.10), k)
        boite_arrondie(d, boite, rayon=14, fond=fond_,
                       bord=melange(FOND_PANNEAU, couleur, (0.9 if vedette else 0.45) * k),
                       largeur_bord=3 if vedette else 2)
        d.text((x0 + 26, y + 14), titre, font=police(taille_titre, True),
               fill=melange(FOND_PANNEAU, TEXTE, k), anchor="la")
        if detail:
            d.text((x0 + 26, y + 16 + taille_titre + 6), detail, font=police(taille_corps),
                   fill=melange(FOND_PANNEAU, TEXTE_2, k), anchor="la")
        if i < n - 1:
            cx = (x0 + x1) / 2
            fleche(d, (cx, y + hauteur + 2), (cx, y + hauteur + 20),
                   couleur=melange(FOND_PANNEAU, TEXTE_3, k), epaisseur=3, progression=k)


def etiquette(d, x, y, texte, couleur=ROSE, p: float = 1.0, seuil: float = 0.0,
              taille: int = 17, ancre: str = "la"):
    """Un sigle posé sur un schéma : IP, MAC, DNS, HTTP…"""
    if p < seuil:
        return
    k = min(1.0, (p - seuil) / 0.12)
    largeur = largeur_texte(texte, taille, True) + 22
    x_gauche = x if ancre == "la" else x - largeur
    boite_arrondie(d, (x_gauche, y, x_gauche + largeur, y + taille + 14), rayon=9,
                   fond=melange(FOND_PANNEAU, melange(FOND_PANNEAU_2, couleur, 0.22), k),
                   bord=melange(FOND_PANNEAU, couleur, 0.7 * k), largeur_bord=2)
    d.text((x_gauche + 11, y + 12), texte, font=police(taille, True),
           fill=melange(FOND_PANNEAU, couleur, k), anchor="la")
