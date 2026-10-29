"""Primitives graphiques de « La boucle Pour — le sac et l'ascenseur ».

Tout est dessiné à la main (PIL) : le sac qui accumule, l'immeuble à étages,
l'ascenseur qui monte et qui compte, le cahier où l'on écrit le bloc, puis la
structure complète de la boucle. Aucune image externe.
"""
from __future__ import annotations

import math

from PIL import Image, ImageDraw

from theme import (
    FOND, FOND_PANNEAU, FOND_PANNEAU_2, BORDURE, TEXTE, TEXTE_2, TEXTE_3,
    ORANGE, ORANGE_FONCE, AMBRE, VIOLET, VERT, BLEU, ROSE, ROUGE_BORD,
    police, melange, boite_arrondie, texte, largeur_texte, texte_centre,
    couper_texte, fleche, degrade_vertical,
)

LARGEUR, HAUTEUR = 1920, 1080

# ── Zones de l'écran ───────────────────────────────────────────────────────
MARGE = 64
PANEL_G = (MARGE, 186, 1072, 884)        # l'histoire : sac, immeuble, ascenseur
PANEL_D = (1104, 186, 1856, 884)         # ce que j'écris : le cahier
BANDE = (MARGE, 906, 1856, 1012)         # rappel des trois objets du récit

# Couleurs du récit
SAC = (234, 140, 48)
SAC_CLAIR = (250, 186, 108)
ETAGE = (32, 47, 74)
ETAGE_VIDE = (44, 62, 92)
CABINE = (74, 130, 214)
CODE_FOND = (11, 17, 30)

# ── Les valeurs de l'immeuble : T = [4, 7, 2, 9], la somme vaut 22 ────────
VALEURS = (4, 7, 2, 9)
SOMME_TOTALE = sum(VALEURS)


def _ease(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def _ease_out(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def _pulse(t: float, periode: float = 1.6) -> float:
    """0 → 1 → 0, sans à-coup (pour les halos)."""
    return 0.5 + 0.5 * math.sin(2 * math.pi * t / periode)


# ══════════════════════════════════════════════════════════════════════════
#  Fond, en-tête, panneaux
# ══════════════════════════════════════════════════════════════════════════
def fond(d: ImageDraw.ImageDraw, t: float = 0.0):
    """Dégradé de nuit + un halo bleu très doux qui respire."""
    for y in range(HAUTEUR):
        k = y / HAUTEUR
        d.line([(0, y), (LARGEUR, y)],
               fill=(int(13 + 7 * k), int(20 + 6 * k), int(36 + 10 * k)))
    halo = int(10 * _pulse(t, 7.0))
    d.ellipse([1180 - 420, -420, 1180 + 420, 260], fill=(19 + halo, 30 + halo, 52 + halo))
    d.ellipse([-380, 620, 520, 1320], fill=(17, 25, 43))


def entete(d: ImageDraw.ImageDraw, titre: str, etape: int, total: int, chapitre: str = ""):
    d.text((MARGE, 46), "CAPSULE · JAVASCRIPT · LES BOUCLES", font=police(19, True),
           fill=ORANGE)
    d.text((MARGE, 78), titre, font=police(50, True), fill=TEXTE)
    if chapitre:
        d.text((MARGE, 136), chapitre, font=police(23), fill=TEXTE_2)
    # la frise des étapes : un point par étape, le courant brille
    x1 = LARGEUR - MARGE
    d.text((x1, 58), f"ÉTAPE {etape} / {total}", font=police(22, True), fill=TEXTE_2, anchor="ra")
    pas, larg, y = 14, 30, 96
    depart = x1 - (total * (larg + pas) - pas)
    for i in range(total):
        x = depart + i * (larg + pas)
        fait = i < etape - 1
        courant = i == etape - 1
        if courant:
            d.rounded_rectangle([x - 3, y - 3, x + larg + 3, y + 11], radius=7,
                                fill=melange(FOND, ORANGE, 0.22))
            couleur = ORANGE
        elif fait:
            couleur = melange(BORDURE, VERT, 0.55)
        else:
            couleur = (26, 38, 58)
        d.rounded_rectangle([x, y, x + larg, y + 8], radius=4, fill=couleur)


def panneau(d: ImageDraw.ImageDraw, box, titre: str | None = None, accent=BORDURE,
            fond_=FOND_PANNEAU):
    boite_arrondie(d, box, rayon=26, fond=fond_, bord=accent, largeur_bord=2)
    if titre:
        x0, y0, _, _ = box
        d.text((x0 + 28, y0 + 22), titre, font=police(22, True), fill=TEXTE_2)


# ══════════════════════════════════════════════════════════════════════════
#  Objets du récit
# ══════════════════════════════════════════════════════════════════════════
def jeton(d: ImageDraw.ImageDraw, cx: float, cy: float, label: str, couleur=AMBRE,
          echelle: float = 1.0, alpha: float = 1.0):
    """Une petite étiquette (T[0], T[1], « total »…) qu'on peut poser où on veut."""
    taille = int(26 * echelle)
    f = police(taille, True, mono=True)
    larg = f.getlength(label) + int(26 * echelle)
    haut = int(42 * echelle)
    fond = melange(FOND_PANNEAU_2, couleur, 0.18 * alpha)
    boite_arrondie(d, [cx - larg / 2, cy - haut / 2, cx + larg / 2, cy + haut / 2],
                   rayon=int(12 * echelle), fond=fond, bord=couleur, largeur_bord=2)
    d.text((cx, cy), label, font=f, fill=melange(TEXTE, couleur, 0.35), anchor="mm")


def sac(d: ImageDraw.ImageDraw, cx: float, cy: float, contenu=(), nom: str | None = None,
        echelle: float = 1.0, halo: float = 0.0, secousse: float = 0.0, alpha: float = 1.0):
    """Le sac : corps arrondi, anse, et les jetons ramassés à l'intérieur."""
    larg, haut = 300 * echelle, 236 * echelle
    cx += math.sin(secousse * 42) * 7 * secousse
    x0, y0 = cx - larg / 2, cy - haut / 2
    x1, y1 = x0 + larg, y0 + haut

    if halo > 0.02:
        h = int(38 * halo)
        d.ellipse([x0 - 34 - h, y0 - 30 - h, x1 + 34 + h, y1 + 34 + h],
                  outline=melange(FOND, ORANGE, 0.45 * halo), width=6)

    # anse
    d.arc([x0 + larg * 0.26, y0 - haut * 0.34, x1 - larg * 0.26, y0 + haut * 0.20],
          start=185, end=355, fill=SAC_CLAIR, width=int(12 * echelle))
    # corps
    boite_arrondie(d, [x0, y0, x1, y1], rayon=34 * echelle,
                   fond=melange(FOND_PANNEAU_2, SAC, 0.26), bord=SAC, largeur_bord=4)
    # rabat
    d.line([(x0 + 16, y0 + 34 * echelle), (x1 - 16, y0 + 34 * echelle)],
           fill=melange(SAC, TEXTE, 0.25), width=3)
    d.text((cx, y0 + 20 * echelle), "SAC", font=police(int(19 * echelle), True),
           fill=melange(SAC_CLAIR, TEXTE, 0.35), anchor="ma")

    # étiquette de nom
    if nom:
        nx, ny = x1 - 12 * echelle, y0 - 6 * echelle
        f = police(int(30 * echelle), True)
        larg_n = f.getlength(nom) + 34 * echelle
        boite_arrondie(d, [nx - larg_n / 2, ny - 26 * echelle, nx + larg_n / 2, ny + 26 * echelle],
                       rayon=12, fond=AMBRE, bord=melange(AMBRE, TEXTE, 0.3))
        d.text((nx, ny), nom, font=f, fill=(32, 24, 8), anchor="mm")

    # contenu, en grille de deux colonnes
    if contenu:
        colonnes = 2 if len(contenu) > 2 else max(1, len(contenu))
        lignes_n = math.ceil(len(contenu) / colonnes)
        zone_haut = y0 + 54 * echelle
        zone_bas = y1 - 18 * echelle
        pas_y = min(46 * echelle, (zone_bas - zone_haut) / max(1, lignes_n))
        pas_x = (x1 - x0 - 24 * echelle) / colonnes
        depart_y = (zone_haut + zone_bas) / 2 - pas_y * (lignes_n - 1) / 2
        for i, item in enumerate(contenu):
            col, lig = i % colonnes, i // colonnes
            jeton(d, x0 + 12 * echelle + pas_x * (col + 0.5), depart_y + lig * pas_y,
                  str(item), couleur=VERT, echelle=min(0.8, 0.74 * echelle / 0.86 * echelle))
    else:
        d.text((cx, cy + 12 * echelle), "?", font=police(int(72 * echelle), True),
               fill=melange(TEXTE_3, TEXTE, 0.25), anchor="mm")


def _porte(d: ImageDraw.ImageDraw, box, ouverture: float):
    """Deux battants qui coulissent dans le mur, sans jamais sortir du cadre."""
    x0, y0, x1, y1 = box
    largeur = (x1 - x0) / 2
    k = _ease(ouverture)
    d.rectangle([x0, y0, x1, y1], fill=(30, 44, 68), outline=(88, 116, 158), width=2)
    d.rectangle([x0 + 4, y0 + 4, x1 - 4, y1 - 4], fill=(22, 34, 54))
    reste = max(0.0, 1.0 - k)
    d.rectangle([x0 + 1, y0 + 1, x0 + 1 + largeur * reste, y1 - 1],
                fill=(58, 84, 124), outline=(96, 124, 166), width=2)
    d.rectangle([x1 - 1 - largeur * reste, y0 + 1, x1 - 1, y1 - 1],
                fill=(58, 84, 124), outline=(96, 124, 166), width=2)


def _carte_valeur(d: ImageDraw.ImageDraw, cx: float, cy: float, k: int, valeur: int,
                  pris: bool = False, actif: bool = False):
    """La valeur d'un étage : une carte lisible, avec son étiquette T[k]."""
    larg, haut = 88, 80
    bord = melange(BORDURE, VERT, 0.55) if pris else (AMBRE if actif else melange(BORDURE, AMBRE, 0.5))
    fond = (26, 36, 50) if pris else melange((26, 36, 54), AMBRE, 0.14)
    boite_arrondie(d, [cx - larg / 2, cy - haut / 2, cx + larg / 2, cy + haut / 2],
                   rayon=15, fond=fond, bord=bord, largeur_bord=3 if actif else 2)
    d.text((cx, cy + 6), str(valeur), font=police(38, True, mono=True),
           fill=melange(TEXTE_3, FOND, 0.35) if pris else TEXTE, anchor="mm")
    jeton(d, cx, cy - haut / 2 - 1, f"T[{k}]",
          couleur=TEXTE_3 if pris else AMBRE, echelle=0.6)
    if pris:
        coche(d, cx + larg / 2 - 6, cy + haut / 2 - 4, 24, progression=1.0)


def immeuble(d: ImageDraw.ImageDraw, box, nb_etages: int = 4, etage_actif: int | None = None,
             ouvert: float = 0.0, remplis=(), ramasse_en_cours: float = 0.0, t: float = 0.0,
             valeurs=None, montrer_valeurs: bool = True,
             fenetres_allumees: int | None = None):
    """L'immeuble : l'étage 0 en bas, l'étage n-1 en haut, une porte par étage.

    Chaque étage montre sa **valeur** (la case du tableau T) sur une carte, et
    des fenêtres chaleureuses : on voit tout de suite quel étage on a ramassé.
    """
    x0, y0, x1, y1 = box
    valeurs = VALEURS if valeurs is None else valeurs
    hauteur = (y1 - y0) / nb_etages
    if fenetres_allumees is None:
        fenetres_allumees = nb_etages

    # le sol, et une petite plante pour faire vivant
    d.line([(x0 - 26, y1 + 4), (x1 + 26, y1 + 4)], fill=melange(BORDURE, VERT, 0.25), width=4)
    d.line([(x1 + 16, y1 + 4), (x1 + 16, y1 - 34)], fill=melange(BORDURE, VERT, 0.5), width=3)
    d.ellipse([x1 + 2, y1 - 52, x1 + 30, y1 - 26], fill=melange((20, 30, 46), VERT, 0.55))

    for k in range(nb_etages):
        haut = y1 - (k + 1) * hauteur
        bas = y1 - k * hauteur
        actif = etage_actif == k
        pris = k in remplis
        boite_arrondie(d, [x0, haut + 4, x1 - 96, bas - 4], rayon=18,
                       fond=melange(ETAGE, (58, 82, 120), 0.5 if actif else 0.0),
                       bord=BLEU if actif else BORDURE, largeur_bord=3 if actif else 2)
        d.text((x0 + 20, bas - 16), f"étage {k}", font=police(19, True),
               fill=TEXTE if actif else TEXTE_3, anchor="ls")

        # fenêtres : allumées tant que l'étage n'est pas ramassé
        for col in range(2):
            for lig in range(2):
                fx = x0 + 100 + col * 34
                fy = haut + 18 + lig * 32
                allumee = (k < fenetres_allumees) and not pris
                coul = melange((24, 36, 56), (250, 206, 122), 0.85 if allumee else 0.12)
                d.rounded_rectangle([fx, fy, fx + 25, fy + 21], radius=5, fill=coul,
                                    outline=melange(BORDURE, TEXTE_3, 0.15), width=1)

        vx = x1 - 200
        vy = (haut + bas) / 2
        if actif and ramasse_en_cours > 0:
            vx -= 150 * _ease(ramasse_en_cours)
            vy -= 40 * _ease(ramasse_en_cours)
        if montrer_valeurs:
            _carte_valeur(d, vx, vy, k, valeurs[k] if k < len(valeurs) else 0,
                          pris=pris, actif=actif)
        elif k not in remplis:
            jeton(d, vx, vy, f"T[{k}]", couleur=AMBRE, echelle=0.95)
        _porte(d, [x1 - 92, haut + 16, x1 - 10, bas - 16], ouvert if actif else 0.0)


def personnage(d: ImageDraw.ImageDraw, cx: float, cy: float, echelle: float = 1.0,
               sac_a_la_main: bool = True):
    """Le passager de l'ascenseur : c'est moi, avec mon sac."""
    s = echelle
    # jambes
    d.line([(cx - 6 * s, cy + 20 * s), (cx - 8 * s, cy + 36 * s)],
           fill=(58, 76, 108), width=int(7 * s))
    d.line([(cx + 6 * s, cy + 20 * s), (cx + 8 * s, cy + 36 * s)],
           fill=(58, 76, 108), width=int(7 * s))
    # corps
    boite_arrondie(d, [cx - 15 * s, cy - 6 * s, cx + 15 * s, cy + 24 * s], rayon=9 * s,
                   fond=(96, 146, 230), bord=(150, 188, 246), largeur_bord=2)
    # tête
    d.ellipse([cx - 14 * s, cy - 36 * s, cx + 14 * s, cy - 8 * s],
              fill=(246, 210, 178), outline=(196, 150, 116), width=2)
    # cheveux
    d.chord([cx - 15 * s, cy - 38 * s, cx + 15 * s, cy - 12 * s], start=180, end=360,
            fill=(64, 48, 36))
    # yeux et sourire
    d.ellipse([cx - 7 * s, cy - 26 * s, cx - 2 * s, cy - 21 * s], fill=(44, 38, 34))
    d.ellipse([cx + 2 * s, cy - 26 * s, cx + 7 * s, cy - 21 * s], fill=(44, 38, 34))
    d.arc([cx - 7 * s, cy - 22 * s, cx + 7 * s, cy - 13 * s], start=20, end=160,
          fill=(160, 96, 76), width=2)
    # le sac à la main
    if sac_a_la_main:
        d.arc([cx + 15 * s, cy + 4 * s, cx + 31 * s, cy + 16 * s], start=180, end=360,
              fill=SAC_CLAIR, width=int(3 * s))
        boite_arrondie(d, [cx + 16 * s, cy + 8 * s, cx + 34 * s, cy + 28 * s], rayon=5 * s,
                       fond=melange(FOND_PANNEAU_2, SAC, 0.3), bord=SAC, largeur_bord=2)


def ascenseur(d: ImageDraw.ImageDraw, box, nb_etages: int, position: float,
              etage_affiche: int, compteur_actif: float = 0.0, ecran: bool = True,
              passager: bool = True, echelle_passager: float = 0.82):
    """La cage d'ascenseur : un rail, la cabine avec son passager, l'écran qui compte."""
    x0, y0, x1, y1 = box
    hauteur = (y1 - y0) / nb_etages
    d.rounded_rectangle([x0, y0, x1, y1], radius=16, fill=(16, 24, 39), outline=BORDURE, width=2)
    d.line([(x0 + 14, y0 + 10), (x0 + 14, y1 - 10)], fill=(40, 56, 84), width=3)
    d.line([(x1 - 14, y0 + 10), (x1 - 14, y1 - 10)], fill=(40, 56, 84), width=3)

    # cabine : position 0 = étage 0 (en bas)
    haut_cabine = y1 - (position + 1) * hauteur
    marge = 10
    cabine = [x0 + 18, haut_cabine + marge, x1 - 18, haut_cabine + hauteur - marge]
    boite_arrondie(d, cabine, rayon=14, fond=melange(FOND_PANNEAU_2, CABINE, 0.3),
                   bord=CABINE, largeur_bord=3)
    cy = (cabine[1] + cabine[3]) / 2
    if passager and (cabine[3] - cabine[1]) > 80:
        personnage(d, (cabine[0] + cabine[2]) / 2, cy + 6, echelle=echelle_passager)
    else:
        d.text(((x0 + x1) / 2, cy), "▲\n▼", font=police(20, True),
               fill=melange(CABINE, TEXTE, 0.5), anchor="mm")

    # écran du compteur, en haut de la cage
    if not ecran:
        return
    ecran_box = [x0 + 6, y0 - 62, x1 - 6, y0 - 8]
    halo = 0.4 + 0.6 * _pulse(compteur_actif * 3.2, 0.9) if compteur_actif > 0.01 else 0.0
    boite_arrondie(d, ecran_box, rayon=12, fond=(8, 12, 22), bord=melange(BORDURE, BLEU, halo), largeur_bord=2)
    d.text(((ecran_box[0] + ecran_box[2]) / 2, (ecran_box[1] + ecran_box[3]) / 2), str(etage_affiche),
           font=police(34, True, mono=True), fill=BLEU if compteur_actif > 0.01 else TEXTE_3, anchor="mm")


def compteur(d: ImageDraw.ImageDraw, cx: float, cy: float, valeur: int, actif: float = 0.0):
    """Le compteur du récit, posé librement dans la scène."""
    boite = [cx - 118, cy - 74, cx + 118, cy + 74]
    halo = 0.5 + 0.5 * _pulse(actif * 4.2, 0.8) if actif > 0.01 else 0.0
    boite_arrondie(d, boite, rayon=20, fond=(9, 14, 26),
                   bord=melange(BORDURE, BLEU, 0.4 + 0.6 * halo), largeur_bord=3)
    d.text((cx, cy - 44), "COMPTEUR", font=police(17, True), fill=TEXTE_3, anchor="ma")
    d.text((cx, cy + 12), str(valeur), font=police(66, True, mono=True),
           fill=BLEU if actif > 0.01 else TEXTE_2, anchor="mm")


# ══════════════════════════════════════════════════════════════════════════
#  Le cahier : ce que l'agent écrit
# ══════════════════════════════════════════════════════════════════════════
class Ligne:
    """Une ligne du cahier : texte, couleur, retrait, et moment de frappe."""

    def __init__(self, contenu="", couleur=TEXTE, taille=34, retrait=0, gras=False,
                 mono=True, a_partir_de=0.0, barree=False, souligne=False, note=None):
        self.contenu = contenu
        self.couleur = couleur
        self.taille = taille
        self.retrait = retrait
        self.gras = gras
        self.mono = mono
        self.a_partir_de = a_partir_de      # fraction de la scène
        self.barree = barree
        self.souligne = souligne
        self.note = note


def cahier(d: ImageDraw.ImageDraw, box, lignes, p: float, defilement: float = 0.0):
    """Dessine les lignes, en révélant les caractères au rythme du récit."""
    x0, y0, x1, y1 = box
    y = y0 + 74 - defilement
    pas = 52
    for ligne in lignes:
        if not ligne.contenu:
            y += pas * 0.46
            continue
        if p < ligne.a_partir_de:
            y += pas
            continue
        local = (p - ligne.a_partir_de) / 0.22
        avancement = max(0.0, min(1.0, local))
        contenu = ligne.contenu
        visible = contenu[: int(len(contenu) * avancement + 0.999)]
        if not visible:
            y += pas
            continue
        police_l = police(ligne.taille, ligne.gras, ligne.mono)
        x = x0 + 26 + ligne.retrait
        couleur = ligne.couleur
        if ligne.barree:
            couleur = melange(couleur, FOND_PANNEAU, 0.55)
        d.text((x, y), visible, font=police_l, fill=couleur)
        largeur = police_l.getlength(visible)
        if ligne.souligne and avancement >= 1:
            d.line([(x, y + ligne.taille + 9), (x + largeur, y + ligne.taille + 9)],
                   fill=AMBRE, width=4)
        if ligne.barree and avancement >= 1:
            d.line([(x - 4, y + ligne.taille * 0.62), (x + largeur + 4, y + ligne.taille * 0.62)],
                   fill=ROUGE_BORD, width=4)
        if ligne.note and avancement >= 1:
            d.text((x + largeur + 18, y + 4), ligne.note, font=police(19, True),
                   fill=melange(ligne.couleur, TEXTE_2, 0.4))
        if avancement < 1:
            d.rectangle([x + largeur + 2, y + 4, x + largeur + 5, y + ligne.taille * 0.98], fill=AMBRE)
        y += pas
    return y


def cadre_code(d: ImageDraw.ImageDraw, box, titre: str = "ce que j'écris", accent=VIOLET):
    boite_arrondie(d, box, rayon=18, fond=CODE_FOND, bord=melange(BORDURE, accent, 0.5), largeur_bord=2)
    x0, y0, x1, _ = box
    d.text((x0 + 24, y0 + 20), titre, font=police(20, True), fill=melange(TEXTE_2, accent, 0.5))
    d.line([(x0 + 20, y0 + 54), (x1 - 20, y0 + 54)], fill=(26, 36, 56), width=2)


def bandeau_rappel(d: ImageDraw.ImageDraw, items, t: float = 0.0):
    """Le rappel permanent : S (le sac), T (les étages), le compteur."""
    x0, y0, x1, y1 = BANDE
    boite_arrondie(d, [x0, y0, x1, y1], rayon=20, fond=(15, 22, 37), bord=BORDURE, largeur_bord=2)
    pas = (x1 - x0) / max(1, len(items))
    for i, (titre, detail, couleur) in enumerate(items):
        cx = x0 + pas * (i + 0.5)
        d.text((cx - 20, (y0 + y1) / 2), titre, font=police(32, True, mono=True), fill=couleur, anchor="rm")
        d.text((cx + 6, (y0 + y1) / 2), detail, font=police(21), fill=TEXTE_2, anchor="lm")
        if i:
            d.line([(x0 + pas * i, y0 + 18), (x0 + pas * i, y1 - 18)], fill=(28, 40, 60), width=2)


def _puce_tableau(d: ImageDraw.ImageDraw, cx: float, cy: float, valeur: int, *,
                   actif: bool, pris: bool, t: float = 0.0):
    """Une case du tableau T, dans le bandeau du bas."""
    larg, haut = 86, 52
    if actif:
        halo = 3 + 2 * _pulse(t, 1.2)
        boite_arrondie(d, [cx - larg / 2 - halo, cy - haut / 2 - halo,
                           cx + larg / 2 + halo, cy + haut / 2 + halo],
                       rayon=16, fond=melange(FOND, AMBRE, 0.22), bord=melange(FOND, AMBRE, 0.6),
                       largeur_bord=2)
    fond = melange((24, 34, 52), AMBRE, 0.16) if actif else (24, 34, 52)
    bord = AMBRE if actif else (melange(BORDURE, VERT, 0.5) if pris else BORDURE)
    boite_arrondie(d, [cx - larg / 2, cy - haut / 2, cx + larg / 2, cy + haut / 2],
                   rayon=12, fond=fond, bord=bord, largeur_bord=2)
    d.text((cx, cy + 1), str(valeur), font=police(26, True, mono=True),
           fill=TEXTE if actif or not pris else melange(TEXTE_3, FOND, 0.3), anchor="mm")
    if pris:
        coche(d, cx + larg / 2 - 4, cy + haut / 2 - 2, 18, progression=1.0)


def bandeau_etat(d: ImageDraw.ImageDraw, indice: int | None = None, somme: int = 0,
                 compteur: int | None = None, valeurs=VALEURS, t: float = 0.0,
                 somme_connue: bool = True):
    """Le fil rouge du bas : le tableau T, le compteur, et la somme en cours."""
    x0, y0, x1, y1 = BANDE
    boite_arrondie(d, [x0, y0, x1, y1], rayon=20, fond=(15, 22, 37), bord=BORDURE, largeur_bord=2)

    # ── le tableau T
    d.text((x0 + 26, y0 + 16), "le tableau T  (les étages)", font=police(17, True), fill=TEXTE_3)
    cx = x0 + 62
    for k, v in enumerate(valeurs):
        _puce_tableau(d, cx, y0 + 68, v,
                      actif=(indice == k),
                      pris=(indice is not None and k < indice), t=t)
        cx += 98
    d.line([(x0 + 470, y0 + 20), (x0 + 470, y1 - 20)], fill=BORDURE, width=2)

    # ── le compteur
    cx_compteur = x0 + 606
    d.text((cx_compteur, y0 + 26), "compteur", font=police(17, True), fill=TEXTE_3, anchor="mm")
    valeur_c = "—" if compteur is None else str(compteur)
    boite_arrondie(d, [cx_compteur - 44, y0 + 44, cx_compteur + 44, y1 - 16], rayon=12,
                   fond=(10, 16, 28), bord=melange(BORDURE, BLEU, 0.55), largeur_bord=2)
    d.text((cx_compteur, y0 + 70), valeur_c, font=police(30, True, mono=True),
           fill=BLEU if compteur is not None else TEXTE_3, anchor="mm")
    d.text((cx_compteur + 60, y0 + 70), "étage", font=police(17, True), fill=TEXTE_3, anchor="lm")
    d.line([(x0 + 724, y0 + 20), (x0 + 724, y1 - 20)], fill=BORDURE, width=2)

    # ── la somme, le but de toute la capsule
    d.text((x0 + 838, y0 + 26), "S  (la somme des étages)", font=police(17, True),
           fill=TEXTE_3, anchor="lm")
    d.text((x0 + 838, y0 + 70), "=", font=police(30, True), fill=TEXTE_3, anchor="lm")
    valeur_s = str(somme) if somme_connue else "…"
    boite_arrondie(d, [x0 + 876, y0 + 46, x0 + 1000, y1 - 14], rayon=14,
                   fond=melange((16, 24, 38), VERT if somme_connue else BLEU, 0.20),
                   bord=melange(BORDURE, VERT if somme_connue else BLEU, 0.65), largeur_bord=3)
    d.text((x0 + 938, y0 + 70), valeur_s, font=police(34, True, mono=True),
           fill=VERT if somme_connue else TEXTE_2, anchor="mm")

    # ── la promesse de la capsule, à droite
    if somme_connue and somme == SOMME_TOTALE:
        texte_fin = "la somme est complète : c'est gagné !"
        coul = VERT
    elif somme_connue:
        texte_fin = f"il reste {SOMME_TOTALE - somme} à ramasser"
        coul = TEXTE_2
    else:
        texte_fin = f"à trouver : la somme des {len(valeurs)} étages"
        coul = TEXTE_2
    d.text((x1 - 34, y0 + 30), texte_fin, font=police(20, True), fill=coul, anchor="ra")
    d.text((x1 - 34, y0 + 66), "S = T[0] + T[1] + T[2] + T[3]", font=police(19, True, mono=True),
           fill=melange(TEXTE_3, AMBRE, 0.35), anchor="ra")


def bulle(d: ImageDraw.ImageDraw, box, phrases, p: float, accent=AMBRE, taille=26,
          queue: int = 0):
    """Une bulle de réflexion : le texte se replie tout seul dans la boîte."""
    x0, y0, x1, y1 = box
    boite_arrondie(d, box, rayon=22, fond=(23, 33, 52), bord=accent, largeur_bord=3)
    if queue == 0:
        queue = 1 if x1 > LARGEUR / 2 else -1
    if queue > 0:
        d.polygon([(x0 + 36, y1), (x0 + 70, y1 + 24), (x0 + 74, y1)], fill=(23, 33, 52))
        d.line([(x0 + 36, y1), (x0 + 70, y1 + 24), (x0 + 74, y1)], fill=accent, width=3)
    else:
        d.polygon([(x1 - 36, y1), (x1 - 70, y1 + 24), (x1 - 74, y1)], fill=(23, 33, 52))
        d.line([(x1 - 36, y1), (x1 - 70, y1 + 24), (x1 - 74, y1)], fill=accent, width=3)

    # replier chaque phrase dans la largeur utile
    police_ = police(taille, True)
    utile = (x1 - x0) - 52
    lignes = []
    for i, phrase in enumerate(phrases):
        mots, courant = phrase.split(), ""
        for mot in mots:
            essai = (courant + " " + mot).strip()
            if largeur_texte(essai, taille, gras=True) <= utile or not courant:
                courant = essai
            else:
                lignes.append((courant, i))
                courant = mot
        lignes.append((courant, i))
    n = len(phrases)
    hauteur_ligne = taille + 8
    total = len(lignes) * hauteur_ligne
    y = y0 + ((y1 - y0) - total) / 2
    for texte_, i in lignes:
        if p < i * (0.5 / max(1, n)) * 2:
            break
        coul = accent if i == n - 1 else TEXTE
        d.text(((x0 + x1) / 2, y + hauteur_ligne / 2), texte_, font=police_,
               fill=coul, anchor="mm")
        y += hauteur_ligne


def coche(d: ImageDraw.ImageDraw, cx: float, cy: float, taille: float = 60, couleur=VERT,
          progression: float = 1.0):
    """Une coche qui se dessine (progression 0 → 1)."""
    pts = [(cx - taille * 0.42, cy + taille * 0.02),
           (cx - taille * 0.10, cy + taille * 0.34),
           (cx + taille * 0.44, cy - taille * 0.34)]
    longueur = [0.55, 0.62]
    reste = max(0.0, min(1.0, progression))
    precedent = pts[0]
    for i in range(2):
        part = min(1.0, reste / longueur[i]) if longueur[i] else 0
        reste -= longueur[i]
        if part <= 0:
            break
        x = precedent[0] + (pts[i + 1][0] - precedent[0]) * part
        y = precedent[1] + (pts[i + 1][1] - precedent[1]) * part
        d.line([precedent, (x, y)], fill=couleur, width=int(taille * 0.16))
        precedent = pts[i + 1]


def titre_carte(d: ImageDraw.ImageDraw, sur_titre: str, titre: str, sous_titre: str, p: float):
    """Carton de début : la promesse de la capsule, et les deux objets du récit."""
    k = _ease_out(max(0.0, min(1.0, p * 2.2)))
    y = HAUTEUR / 2 - 300 + (1 - k) * 40
    d.text((LARGEUR / 2, y), sur_titre, font=police(28, True), fill=ORANGE, anchor="mm")
    d.text((LARGEUR / 2, y + 84), titre, font=police(76, True), fill=TEXTE, anchor="mm")
    d.text((LARGEUR / 2, y + 168), sous_titre, font=police(30), fill=TEXTE_2, anchor="mm")

    # le sac et l'ascenseur, esquissés sous le titre
    if k > 0.35:
        a = max(0.0, min(1.0, (k - 0.35) / 0.5))
        sac(d, LARGEUR / 2 - 250, y + 470, contenu=("T[0]", "T[1]"), nom="S",
            echelle=0.78, halo=0.55 * a)
        ascenseur(d, [LARGEUR / 2 + 60, y + 340, LARGEUR / 2 + 220, y + 600], 4, 1.0, 1,
                  compteur_actif=a)
        d.text((LARGEUR / 2 + 140, y + 646), "le compteur", font=police(22), fill=TEXTE_3,
               anchor="mm")
