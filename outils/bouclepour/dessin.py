"""Primitives graphiques de « La boucle Pour — l'immeuble et le sac ».

Tout est dessiné à la main (PIL). La capsule repose sur quatre figures :

* `immeuble`      l'immeuble **avec sa cage d'ascenseur intégrée** : quatre
                  étages, leurs valeurs, leurs fenêtres chaudes, la cabine qui
                  monte le long du rail ;
* `boite_memoire` la variable : un nom fixe, une valeur qui change, et la trace
                  des valeurs précédentes ;
* `pile_lignes`   le papier qui se remplit d'une ligne par étage — la figure qui
                  rend la boucle *nécessaire* ;
* `boucle_schema` la boucle : le bloc au centre d'un anneau, et les trois
                  réglages (départ, condition, pas).

Aucune image externe.
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
PANEL_G = (MARGE, 186, 1072, 884)        # l'histoire : immeuble, sac, ascenseur
PANEL_D = (1104, 186, 1856, 884)         # ce que j'écris : le cahier
BANDE = (MARGE, 906, 1856, 1012)         # le fil rouge : T · compteur · S

# ── Couleurs du récit ──────────────────────────────────────────────────────
SAC = (234, 140, 48)
SAC_CLAIR = (250, 186, 108)
BRIQUE = (150, 78, 62)          # la façade chaude de l'immeuble
BRIQUE_CLAIR = (206, 122, 88)
VERRE = (252, 208, 126)         # fenêtres allumées
VERRE_ETEINT = (38, 52, 80)
ACIER = (126, 158, 202)         # la cage d'ascenseur
CABINE = (74, 130, 214)
CODE_FOND = (11, 17, 30)

# ── Les valeurs de l'immeuble : T = [4, 7, 2, 9], la somme vaut 22 ────────
VALEURS = (4, 7, 2, 9)
SOMME_TOTALE = sum(VALEURS)
N_ETAGES = len(VALEURS)


def _ease(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def _ease_out(x: float) -> float:
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def _pulse(t: float, periode: float = 1.6) -> float:
    """0 → 1 → 0, sans à-coup (pour les halos)."""
    return 0.5 + 0.5 * math.sin(2 * math.pi * t / periode)


def _apparait(p: float, debut: float, duree: float = 0.14) -> float:
    """Progression locale d'un élément qui entre à `debut` (fondu doux)."""
    return _ease_out(max(0.0, min(1.0, (p - debut) / duree)))


# ══════════════════════════════════════════════════════════════════════════
#  Fond, en-tête, panneaux
# ══════════════════════════════════════════════════════════════════════════
def fond(d: ImageDraw.ImageDraw, t: float = 0.0):
    """Dégradé de nuit, halo chaud en bas, halo froid en haut à droite."""
    for y in range(HAUTEUR):
        k = y / HAUTEUR
        d.line([(0, y), (LARGEUR, y)],
               fill=(int(12 + 8 * k), int(18 + 8 * k), int(33 + 12 * k)))
    halo = int(9 * _pulse(t, 7.0))
    d.ellipse([1180 - 430, -430, 1180 + 430, 250], fill=(18 + halo, 28 + halo, 50 + halo))
    d.ellipse([-420, 640, 560, 1360], fill=(22, 26, 40))
    # un sol très discret, pour poser l'immeuble
    d.rectangle([0, 900, LARGEUR, HAUTEUR], fill=(15, 21, 35))


def entete(d: ImageDraw.ImageDraw, titre: str, etape: int, total: int, chapitre: str = ""):
    d.text((MARGE, 44), "CAPSULE · JAVASCRIPT · LES BOUCLES", font=police(19, True),
           fill=ORANGE)
    d.text((MARGE, 76), titre, font=police(50, True), fill=TEXTE)
    if chapitre:
        d.text((MARGE, 138), chapitre, font=police(23), fill=TEXTE_2)

    x1 = LARGEUR - MARGE
    d.text((x1, 52), f"ÉTAPE {etape} / {total}", font=police(22, True), fill=TEXTE_2,
           anchor="ra")
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
            fond_=FOND_PANNEAU, grille: bool = True):
    boite_arrondie(d, box, rayon=26, fond=fond_, bord=accent, largeur_bord=2)
    if grille:
        # une grille de repérage discrète : ça « remplit » sans distraire
        x0, y0, x1, y1 = box
        pas = 48
        for gx in range(int(x0) + pas, int(x1) - 8, pas):
            d.line([(gx, y0 + 14), (gx, y1 - 14)], fill=(23, 32, 49), width=1)
        for gy in range(int(y0) + pas, int(y1) - 8, pas):
            d.line([(x0 + 14, gy), (x1 - 14, gy)], fill=(23, 32, 49), width=1)
    if titre:
        x0, y0, _, _ = box
        d.text((x0 + 28, y0 + 20), titre, font=police(22, True), fill=TEXTE_2)


def etape_pastille(d: ImageDraw.ImageDraw, cx: float, cy: float, numero: int,
                   couleur=AMBRE, echelle: float = 1.0):
    """Une pastille numérotée, pour les listes « 1 · 2 · 3 »."""
    r = 18 * echelle
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=melange(FOND_PANNEAU_2, couleur, 0.28),
              outline=couleur, width=2)
    d.text((cx, cy + 1), str(numero), font=police(int(20 * echelle), True),
           fill=couleur, anchor="mm")


# ══════════════════════════════════════════════════════════════════════════
#  Objets du récit
# ══════════════════════════════════════════════════════════════════════════
def jeton(d: ImageDraw.ImageDraw, cx: float, cy: float, label: str, couleur=AMBRE,
          echelle: float = 1.0, alpha: float = 1.0):
    """Une petite étiquette arrondie (T[0], « total »…) qu'on pose où on veut."""
    taille = max(11, int(26 * echelle))
    f = police(taille, True, mono=True)
    larg = f.getlength(label) + int(26 * echelle)
    haut = int(42 * echelle)
    fond = melange(FOND_PANNEAU_2, couleur, 0.18 * alpha)
    boite_arrondie(d, [cx - larg / 2, cy - haut / 2, cx + larg / 2, cy + haut / 2],
                   rayon=int(12 * echelle), fond=fond, bord=couleur, largeur_bord=2)
    d.text((cx, cy), label, font=f, fill=melange(TEXTE, couleur, 0.35), anchor="mm")


def coche(d: ImageDraw.ImageDraw, cx: float, cy: float, taille: float = 60,
          couleur=VERT, progression: float = 1.0):
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
        d.line([precedent, (x, y)], fill=couleur, width=max(2, int(taille * 0.16)))
        precedent = pts[i + 1]


def _croix(d: ImageDraw.ImageDraw, cx: float, cy: float, taille: float = 40,
           couleur=ROUGE_BORD, progression: float = 1.0):
    """Une croix rouge qui se trace (progression 0 → 1)."""
    k = max(0.0, min(1.0, progression))
    if k <= 0:
        return
    r = taille / 2
    epaisseur = max(3, int(taille * 0.15))
    k1 = min(1.0, k * 2)
    k2 = max(0.0, k * 2 - 1)
    d.line([(cx - r, cy - r), (cx - r + 2 * r * k1, cy - r + 2 * r * k1)],
           fill=couleur, width=epaisseur)
    if k2 > 0:
        d.line([(cx + r, cy - r), (cx + r - 2 * r * k2, cy - r + 2 * r * k2)],
               fill=couleur, width=epaisseur)


# ── Le sac : la variable du récit ─────────────────────────────────────────
def sac(d: ImageDraw.ImageDraw, cx: float, cy: float, contenu=(), nom: str | None = None,
        echelle: float = 1.0, halo: float = 0.0, secousse: float = 0.0, alpha: float = 1.0,
        legende: str | None = None):
    """Le sac : une boîte souple avec un nom, un contenu qu'on peut remplacer."""
    larg, haut = 268 * echelle, 212 * echelle
    cx += math.sin(secousse * 42) * 7 * secousse
    x0, y0 = cx - larg / 2, cy - haut / 2
    x1, y1 = x0 + larg, y0 + haut

    if halo > 0.02:
        h = int(34 * halo)
        d.ellipse([x0 - 30 - h, y0 - 26 - h, x1 + 30 + h, y1 + 30 + h],
                  outline=melange(FOND, ORANGE, 0.40 * halo), width=6)

    # anse
    d.arc([x0 + larg * 0.28, y0 - haut * 0.30, x1 - larg * 0.28, y0 + haut * 0.18],
          start=186, end=354, fill=SAC_CLAIR, width=int(11 * echelle))
    # corps
    boite_arrondie(d, [x0, y0, x1, y1], rayon=30 * echelle,
                   fond=melange(FOND_PANNEAU_2, SAC, 0.28), bord=SAC, largeur_bord=4)
    # pli du rabat
    d.line([(x0 + 18, y0 + 30 * echelle), (x1 - 18, y0 + 30 * echelle)],
           fill=melange(SAC, TEXTE, 0.22), width=3)
    d.text((cx, y0 + 16 * echelle), "SAC", font=police(max(11, int(17 * echelle)), True),
           fill=melange(SAC_CLAIR, TEXTE, 0.30), anchor="ma")

    # étiquette de nom
    if nom:
        nx, ny = x1 - 8 * echelle, y0 - 4 * echelle
        f = police(max(13, int(30 * echelle)), True)
        larg_n = f.getlength(nom) + 32 * echelle
        boite_arrondie(d, [nx - larg_n / 2, ny - 24 * echelle, nx + larg_n / 2, ny + 24 * echelle],
                       rayon=12, fond=AMBRE, bord=melange(AMBRE, TEXTE, 0.3))
        d.text((nx, ny), nom, font=f, fill=(32, 24, 8), anchor="mm")

    # contenu, en grille de deux colonnes
    if contenu:
        colonnes = 2 if len(contenu) > 2 else max(1, len(contenu))
        lignes_n = math.ceil(len(contenu) / colonnes)
        zone_haut = y0 + 46 * echelle
        zone_bas = y1 - 14 * echelle
        pas_y = min(44 * echelle, (zone_bas - zone_haut) / max(1, lignes_n))
        pas_x = (x1 - x0 - 22 * echelle) / colonnes
        depart_y = (zone_haut + zone_bas) / 2 - pas_y * (lignes_n - 1) / 2
        for i, item in enumerate(contenu):
            col, lig = i % colonnes, i // colonnes
            jeton(d, x0 + 11 * echelle + pas_x * (col + 0.5), depart_y + lig * pas_y,
                  str(item), couleur=VERT, echelle=max(0.5, 0.72 * echelle))
    else:
        d.text((cx, cy + 10 * echelle), "?", font=police(max(20, int(64 * echelle)), True),
               fill=melange(TEXTE_3, TEXTE, 0.22), anchor="mm")

    if legende:
        d.text((cx, y1 + 26 * echelle), legende, font=police(max(12, int(20 * echelle))),
               fill=TEXTE_3, anchor="mm")


def personnage(d: ImageDraw.ImageDraw, cx: float, cy: float, echelle: float = 1.0,
               sac_a_la_main: bool = True):
    """Le passager : c'est moi, avec mon sac."""
    s = echelle
    # jambes
    d.line([(cx - 6 * s, cy + 18 * s), (cx - 8 * s, cy + 34 * s)],
           fill=(58, 76, 108), width=max(2, int(7 * s)))
    d.line([(cx + 6 * s, cy + 18 * s), (cx + 8 * s, cy + 34 * s)],
           fill=(58, 76, 108), width=max(2, int(7 * s)))
    # corps
    boite_arrondie(d, [cx - 15 * s, cy - 8 * s, cx + 15 * s, cy + 22 * s], rayon=9 * s,
                   fond=(96, 146, 230), bord=(150, 188, 246), largeur_bord=2)
    # tête
    d.ellipse([cx - 14 * s, cy - 38 * s, cx + 14 * s, cy - 10 * s],
              fill=(246, 210, 178), outline=(196, 150, 116), width=2)
    d.chord([cx - 15 * s, cy - 40 * s, cx + 15 * s, cy - 14 * s], start=180, end=360,
            fill=(64, 48, 36))
    d.ellipse([cx - 7 * s, cy - 28 * s, cx - 2 * s, cy - 23 * s], fill=(44, 38, 34))
    d.ellipse([cx + 2 * s, cy - 28 * s, cx + 7 * s, cy - 23 * s], fill=(44, 38, 34))
    d.arc([cx - 7 * s, cy - 24 * s, cx + 7 * s, cy - 15 * s], start=20, end=160,
          fill=(160, 96, 76), width=2)
    # le sac à la main
    if sac_a_la_main:
        d.arc([cx + 15 * s, cy + 2 * s, cx + 31 * s, cy + 14 * s], start=180, end=360,
              fill=SAC_CLAIR, width=max(2, int(3 * s)))
        boite_arrondie(d, [cx + 16 * s, cy + 6 * s, cx + 34 * s, cy + 26 * s], rayon=5 * s,
                       fond=melange(FOND_PANNEAU_2, SAC, 0.3), bord=SAC, largeur_bord=2)


# ── L'immeuble, avec sa cage d'ascenseur ─────────────────────────────────
def immeuble(d: ImageDraw.ImageDraw, box, valeurs=VALEURS, actif: int | None = None,
             faits=(), cabine: float | None = None, ouvert: float = 0.0, t: float = 0.0,
             passager: bool = True, ramassage: float | None = None,
             montrer_valeurs: bool = True, toit: bool = True, compact: bool = False,
             etiquettes: bool = True, fenetres: bool = True,
             etiquettes_valeurs: bool = False):
    """L'immeuble et son ascenseur, dans **un seul bloc**.

    `box` contient le toit, la façade et la cage. L'étage 0 est en bas.
    `cabine` est la position verticale de la cabine, en étages (0 → n-1) ;
    `ramassage` (0 → 1) fait glisser la carte de valeur de l'étage actif.
    """
    x0, y0, x1, y1 = box
    n = len(valeurs)
    hauteur_toit = 44 if toit else 0
    largeur_cage = 44 if compact else max(64, min(132, (x1 - x0) * 0.21))
    haut_corps = y0 + hauteur_toit
    hauteur_etage = (y1 - haut_corps) / n
    bord_facade = x1 - largeur_cage - 6

    # ── le trottoir et l'ombre
    d.rectangle([x0 - 26, y1 + 2, x1 + 26, y1 + 16], fill=(30, 40, 58))
    d.line([(x0 - 26, y1 + 2), (x1 + 26, y1 + 2)], fill=melange(BORDURE, ACIER, 0.35), width=2)

    # ── le toit
    if toit:
        d.polygon([(x0 - 10, haut_corps + 2), (bord_facade + 6, haut_corps + 2),
                   (bord_facade - 24, y0 + 4), (x0 + 30, y0 + 4)], fill=BRIQUE)
        d.line([(x0 - 10, haut_corps + 2), (bord_facade + 6, haut_corps + 2)],
               fill=BRIQUE_CLAIR, width=4)
        d.line([(bord_facade - 24, y0 + 4), (bord_facade - 24, y0 - 24)], fill=ACIER, width=3)
        d.ellipse([bord_facade - 30, y0 - 32, bord_facade - 18, y0 - 20], fill=AMBRE)

    # ── la façade
    boite_arrondie(d, [x0, haut_corps, bord_facade, y1 + 2], rayon=8,
                   fond=(27, 35, 53), bord=melange(BORDURE, BRIQUE, 0.5), largeur_bord=3)

    for k in range(n):
        haut = y1 - (k + 1) * hauteur_etage
        bas = y1 - k * hauteur_etage
        est_actif = actif == k
        fait = k in faits
        centre_y = (haut + bas) / 2

        # la dalle de l'étage
        d.rectangle([x0 + 2, bas - 5, bord_facade - 2, bas], fill=melange((24, 31, 47), BRIQUE, 0.55))
        if est_actif:
            d.rectangle([x0 + 2, haut + 3, bord_facade - 2, haut + 7],
                        fill=melange(BLEU, AMBRE, 0.4))

        if compact:
            ya, yb = haut + 2, bas - 3
            if yb > ya:
                d.rectangle([x0 + 10, ya, bord_facade - 10, yb],
                            fill=melange((27, 35, 53), BRIQUE, 0.22))
            continue

        # ── les fenêtres, à gauche de l'étage
        if fenetres and hauteur_etage >= 26:
            haut_f = max(8.0, min(20.0, hauteur_etage * 0.32))
            larg_f = max(10.0, min(24.0, hauteur_etage * 0.38))
            ecart = larg_f + max(6.0, hauteur_etage * 0.08)
            for col in range(2):
                fx = x0 + 24 + col * ecart
                fy = centre_y - haut_f / 2 - 2
                allumee = not fait
                d.rounded_rectangle([fx, fy, fx + larg_f, fy + haut_f], radius=4,
                                    fill=melange(VERRE_ETEINT, VERRE, 0.85 if allumee else 0.10),
                                    outline=melange(BORDURE, TEXTE_3, 0.16), width=1)

        # ── le nom de l'étage
        if etiquettes:
            d.text((x0 + 20, bas - 12), f"étage {k}", font=police(18, True),
                   fill=TEXTE if est_actif else TEXTE_3, anchor="ls")

        # ── la carte de valeur, juste avant la porte
        if montrer_valeurs:
            cx = bord_facade - (108 if hauteur_etage > 110 else 78)
            cy = centre_y - (8 if etiquettes else 0)
            if est_actif and ramassage:
                cx -= 150 * _ease(ramassage)
                cy -= 30 * _ease(ramassage)
            _carte_valeur(d, cx, cy, k, valeurs[k], pris=fait, actif=est_actif,
                          compacte=hauteur_etage < 150, etiquette=etiquettes_valeurs)

        # ── la porte, collée à la cage
        _porte(d, [bord_facade - 52, haut + 18, bord_facade - 6, bas - 14],
               ouvert if est_actif else 0.0)

    # ── la cage d'ascenseur
    cage = [x1 - largeur_cage, haut_corps + 4, x1, y1 + 2]
    boite_arrondie(d, cage, rayon=10, fond=(17, 24, 39), bord=melange(BORDURE, ACIER, 0.55),
                   largeur_bord=2)
    if not compact:
        for cote in (cage[0] + 11, cage[2] - 9):
            d.line([(cote, cage[1] + 8), (cote, cage[3] - 6)], fill=(40, 56, 84), width=3)

    if cabine is not None:
        position = max(-0.15, min(n - 0.85, cabine))
        haut_cab = y1 - (position + 1) * hauteur_etage
        marge = max(6, hauteur_etage * 0.07)
        cab = [cage[0] + 16, haut_cab + marge, cage[2] - 12, haut_cab + hauteur_etage - marge]
        boite_arrondie(d, cab, rayon=9, fond=melange(FOND_PANNEAU_2, CABINE, 0.34),
                       bord=CABINE, largeur_bord=3)
        if passager and (cab[3] - cab[1]) > 76 and not compact:
            personnage(d, (cab[0] + cab[2]) / 2, (cab[1] + cab[3]) / 2 + 8,
                       echelle=min(1.0, (cab[3] - cab[1]) / 116))
        elif not compact:
            d.text(((cab[0] + cab[2]) / 2, (cab[1] + cab[3]) / 2), "▲▼",
                   font=police(17, True), fill=melange(CABINE, TEXTE, 0.45), anchor="mm")

    # ── l'écran du compteur, au-dessus de la cage
    if not compact:
        ecran = [cage[0] + 4, haut_corps - 50, cage[2] - 2, haut_corps - 6]
        boite_arrondie(d, ecran, rayon=8, fond=(8, 12, 22),
                       bord=melange(BORDURE, BLEU, 0.6), largeur_bord=2)
        d.text(((ecran[0] + ecran[2]) / 2, (ecran[1] + ecran[3]) / 2),
               "—" if actif is None else str(actif), font=police(24, True, mono=True),
               fill=BLEU if actif is not None else TEXTE_3, anchor="mm")


def _porte(d: ImageDraw.ImageDraw, box, ouverture: float):
    """Deux battants qui coulissent dans le mur."""
    x0, y0, x1, y1 = box
    largeur = (x1 - x0) / 2
    k = _ease(ouverture)
    d.rounded_rectangle([x0, y0, x1, y1], radius=4, fill=(16, 22, 34),
                        outline=(70, 96, 136), width=2)
    reste = max(0.0, 1.0 - k)
    largeur_reste = largeur * reste
    if largeur_reste >= 3:      # un battant de moins de 3 px ne se dessine pas
        d.rectangle([x0 + 1, y0 + 1, x0 + largeur_reste, y1 - 1],
                    fill=(64, 92, 134), outline=(104, 134, 176), width=1)
        d.rectangle([x1 - largeur_reste, y0 + 1, x1 - 1, y1 - 1],
                    fill=(64, 92, 134), outline=(104, 134, 176), width=1)


def _carte_valeur(d: ImageDraw.ImageDraw, cx: float, cy: float, k: int, valeur: int,
                  pris: bool = False, actif: bool = False, compacte: bool = False,
                  etiquette: bool = False):
    """La valeur d'un étage : une carte lisible, avec son étiquette T[k]."""
    larg, haut = (78, 68) if compacte else (92, 82)
    if pris:
        bord, fond = melange(BORDURE, VERT, 0.6), (24, 40, 42)
    elif actif:
        bord, fond = AMBRE, melange((28, 36, 52), AMBRE, 0.16)
    else:
        bord, fond = melange(BORDURE, AMBRE, 0.45), (28, 36, 52)
    boite_arrondie(d, [cx - larg / 2, cy - haut / 2, cx + larg / 2, cy + haut / 2],
                   rayon=14, fond=fond, bord=bord, largeur_bord=3 if actif else 2)
    d.text((cx, cy + 6), str(valeur), font=police(34 if compacte else 40, True, mono=True),
           fill=melange(TEXTE_3, FOND, 0.30) if pris else TEXTE, anchor="mm")
    jeton(d, cx, cy - haut / 2 - 1, f"T[{k}]",
          couleur=TEXTE_3 if pris else AMBRE, echelle=0.56)
    if etiquette:
        d.text((cx, cy + haut / 2 + 18), f"étage {k}", font=police(17, True),
               fill=TEXTE_3, anchor="mm")
    if pris:
        coche(d, cx + larg / 2 - 6, cy + haut / 2 - 4, 22, progression=1.0)


# ══════════════════════════════════════════════════════════════════════════
#  La variable : un nom fixe, une valeur qui change
# ══════════════════════════════════════════════════════════════════════════
def boite_memoire(d: ImageDraw.ImageDraw, box, nom: str = "S", valeur: str = "0",
                  historique=(), a: float = 1.0, t: float = 0.0,
                  titre: str = "une variable", note: str = "le nom reste, la valeur bouge"):
    """La figure de la variable : un nom, un contenu, et les contenus d'avant."""
    if a <= 0.01:
        return
    x0, y0, x1, y1 = box
    cx = (x0 + x1) / 2
    boite_arrondie(d, box, rayon=20,
                   fond=melange(FOND_PANNEAU_2, VIOLET, 0.10 * a),
                   bord=melange(BORDURE, VIOLET, a), largeur_bord=2)
    d.text((cx, y0 + 30), titre.upper(), font=police(19, True),
           fill=melange(FOND, VIOLET, a), anchor="mm")

    # le nom, à gauche
    d.text((x0 + 34, y0 + 74), "le nom", font=police(17, True),
           fill=melange(FOND, TEXTE_3, a), anchor="lm")
    jeton(d, x0 + 34 + 34, y0 + 118, nom, couleur=VIOLET, echelle=0.9)

    # la valeur, à droite
    d.text((x1 - 34, y0 + 74), "la valeur", font=police(17, True),
           fill=melange(FOND, TEXTE_3, a), anchor="rm")
    halo = 0.45 + 0.55 * _pulse(t, 1.5)
    boite_arrondie(d, [x1 - 138, y0 + 92, x1 - 30, y0 + 148], rayon=12,
                   fond=melange((20, 28, 44), AMBRE, 0.18 * halo),
                   bord=melange(BORDURE, AMBRE, a), largeur_bord=3)
    d.text((x1 - 84, y0 + 120), str(valeur), font=police(34, True, mono=True),
           fill=melange(FOND, AMBRE, a), anchor="mm")

    # la trace des valeurs précédentes
    if historique:
        d.line([(x0 + 30, y0 + 176), (x1 - 30, y0 + 176)],
               fill=melange(FOND, BORDURE, a), width=2)
        d.text((x0 + 30, y0 + 194), "avant :", font=police(16, True),
               fill=melange(FOND, TEXTE_3, a), anchor="lm")
        cxh = x0 + 108
        for i, (v, nom_h) in enumerate(historique):
            jeton(d, cxh, y0 + 214, str(v), couleur=melange(TEXTE_3, AMBRE, 0.35),
                  echelle=0.62)
            cxh += 66

    if note:
        d.text((cx, y1 - 24), note, font=police(17),
               fill=melange(FOND, TEXTE_2, a), anchor="mm")


# ══════════════════════════════════════════════════════════════════════════
#  Pourquoi une boucle : le papier qui se remplit
# ══════════════════════════════════════════════════════════════════════════
def pile_lignes(d: ImageDraw.ImageDraw, box, n: int, p: float = 1.0, depasse: bool = False,
                t: float = 0.0, titre: str = "ce que je dois écrire",
                modele: str = "S = S + T[{k}]"):
    """Les lignes de code, une par étage : 4 tiennent, 100 débordent."""
    x0, y0, x1, y1 = box
    boite_arrondie(d, box, rayon=18, fond=CODE_FOND,
                   bord=melange(BORDURE, ROUGE_BORD if depasse else VIOLET, 0.55),
                   largeur_bord=2)
    d.text((x0 + 22, y0 + 18), titre, font=police(18, True), fill=TEXTE_2)
    # compteur, à droite du titre
    badge = f"{n} ligne{'s' if n > 1 else ''}"
    larg_b = largeur_texte(badge, 17, True) + 28
    boite_arrondie(d, [x1 - 20 - larg_b, y0 + 12, x1 - 20, y0 + 46], rayon=9,
                   fond=melange(FOND_PANNEAU_2, ROUGE_BORD if depasse else VERT, 0.20),
                   bord=melange(BORDURE, ROUGE_BORD if depasse else VERT, 0.7),
                   largeur_bord=2)
    d.text((x1 - 20 - larg_b / 2, y0 + 29), badge, font=police(17, True),
           fill=ROUGE_BORD if depasse else VERT, anchor="mm")
    d.line([(x0 + 18, y0 + 54), (x1 - 18, y0 + 54)], fill=(26, 36, 56), width=2)

    haut = y0 + 66
    bas = y1 - 16
    dispo = bas - haut
    pas_ideal = 30
    places = max(1, int(dispo // pas_ideal))
    visibles = min(n, places)
    pas = min(pas_ideal, dispo / max(1, visibles))
    taille = 20 if pas >= 26 else 16
    for i in range(visibles):
        # révélation progressive : chaque ligne apparaît l'une après l'autre
        if p * visibles < i * 0.55:
            break
        y = haut + i * pas
        texte_ = modele.format(k=i)
        if i < visibles - 1 or n <= places:
            d.text((x0 + 26, y), texte_, font=police(taille, False, True),
                   fill=melange(TEXTE_2, TEXTE, 0.8))
        else:
            d.text((x0 + 26, y), texte_, font=police(taille, False, True), fill=TEXTE_2)
    if n > places:
        # le débordement : le papier ne suffit plus
        d.rectangle([x0 + 18, bas - 26, x1 - 18, bas], fill=melange(CODE_FOND, ROUGE_BORD, 0.14))
        d.text(((x0 + x1) / 2, bas - 13), f"… et {n - places} lignes de plus",
               font=police(17, True), fill=melange(TEXTE_3, ROUGE_BORD, 0.7), anchor="mm")
    if depasse:
        k = _apparait(p, 0.55, 0.2)
        if k > 0:
            _croix(d, x1 - 54, y1 - 58, 44 * k, progression=k)


# ══════════════════════════════════════════════════════════════════════════
#  La boucle : le bloc au centre, les trois réglages autour
# ══════════════════════════════════════════════════════════════════════════
def boucle_schema(d: ImageDraw.ImageDraw, box, n: int = 4, compteur: int = 0,
                  p: float = 1.0, t: float = 0.0, montre_reglages: bool = True):
    """La boucle : l'anneau, le bloc, et les trois réglages (départ, condition, pas)."""
    x0, y0, x1, y1 = box
    boite_arrondie(d, box, rayon=18, fond=FOND_PANNEAU_2,
                   bord=melange(BORDURE, ORANGE, 0.45), largeur_bord=2)

    # ── l'anneau, en haut : c'est le tour de la boucle
    cx, cy = (x0 + x1) / 2, y0 + 118
    rayon = 74
    d.ellipse([cx - rayon, cy - rayon, cx + rayon, cy + rayon],
              outline=melange(BORDURE, ORANGE, 0.55), width=4)
    # la flèche de sens de rotation
    ang = -1.15
    fx, fy = cx + rayon * math.cos(ang), cy + rayon * math.sin(ang)
    d.polygon([(fx + 4, fy - 2), (fx - 15, fy - 12), (fx - 2, fy - 24)],
              fill=melange(BORDURE, ORANGE, 0.9))

    # le curseur qui tourne avec le compteur (dessiné avant le cadran)
    if p > 0.02:
        angle = -math.pi / 2 + (compteur / max(1, n)) * 2 * math.pi
        px, py = cx + rayon * math.cos(angle), cy + rayon * math.sin(angle)
        halo = 2 + 2 * _pulse(t, 0.9)
        d.ellipse([px - 11 - halo, py - 11 - halo, px + 11 + halo, py + 11 + halo],
                  fill=melange(FOND_PANNEAU_2, ORANGE, 0.35))
        d.ellipse([px - 9, py - 9, px + 9, py + 9], fill=ORANGE)

    # le cadran central : le texte reste lisible, le curseur passe derrière
    d.ellipse([cx - 54, cy - 40, cx + 54, cy + 40], fill=FOND_PANNEAU_2,
              outline=melange(BORDURE, ORANGE, 0.25), width=1)
    d.text((cx, cy - 18), f"tour {min(compteur + 1, n)} / {n}", font=police(16, True),
           fill=TEXTE_3, anchor="mm")
    d.text((cx, cy + 12), f"compteur = {compteur}", font=police(20, True, mono=True),
           fill=BLEU, anchor="mm")

    # ── le bloc, sous l'anneau
    bloc = [x0 + 22, cy + rayon + 26, x1 - 22, cy + rayon + 84]
    boite_arrondie(d, bloc, rayon=12, fond=CODE_FOND,
                   bord=melange(BORDURE, AMBRE, 0.7), largeur_bord=2)
    d.text(((bloc[0] + 26 + bloc[2]) / 2, (bloc[1] + bloc[3]) / 2), "S = S + T[compteur]",
           font=police(18, True, mono=True), fill=AMBRE, anchor="mm")
    d.text((bloc[0] + 16, bloc[1] + 14), "{", font=police(22, True, mono=True), fill=TEXTE_3)
    d.text((bloc[2] - 16, bloc[1] + 14), "}", font=police(22, True, mono=True),
           fill=TEXTE_3, anchor="ra")

    if not montre_reglages:
        return

    # ── les trois réglages, en bas
    reglages = [
        ("départ", "compteur = 0", BLEU, True),
        ("condition", f"compteur < {n}", AMBRE, compteur < n),
        ("pas", "compteur + 1", VERT, True),
    ]
    largeur = (x1 - x0 - 44 - 2 * 10) / 3
    haut = bloc[3] + 18
    bas = min(y1 - 16, haut + 74)
    for i, (titre_, detail, couleur, actif_) in enumerate(reglages):
        k = _apparait(p, 0.08 + 0.10 * i, 0.14)
        if k <= 0:
            continue
        bx0 = x0 + 22 + i * (largeur + 10)
        boite_arrondie(d, [bx0, haut, bx0 + largeur, bas], rayon=11,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.16 if actif_ else 0.05),
                       bord=melange(BORDURE, couleur, (0.75 if actif_ else 0.25) * k),
                       largeur_bord=2)
        d.text((bx0 + 14, haut + 16), titre_, font=police(15, True),
               fill=melange(TEXTE_3, couleur, 0.65))
        d.text((bx0 + 14, haut + 40), detail, font=police(16, True, mono=True),
               fill=TEXTE if actif_ else TEXTE_3)


# ══════════════════════════════════════════════════════════════════════════
#  Le cahier : ce que j'écris
# ══════════════════════════════════════════════════════════════════════════
class Ligne:
    """Une ligne du cahier : texte, couleur, retrait, et moment de frappe."""

    def __init__(self, contenu="", couleur=TEXTE, taille=32, retrait=0, gras=False,
                 mono=True, a_partir_de=0.0, barree=False, souligne=False, note=None):
        self.contenu = contenu
        self.couleur = couleur
        self.taille = taille
        self.retrait = retrait
        self.gras = gras
        self.mono = mono
        self.a_partir_de = a_partir_de
        self.barree = barree
        self.souligne = souligne
        self.note = note


def cahier(d: ImageDraw.ImageDraw, box, lignes, p: float, defilement: float = 0.0):
    """Dessine les lignes, en révélant les caractères au rythme du récit."""
    x0, y0, x1, y1 = box
    y = y0 + 74 - defilement
    pas = 50
    for ligne in lignes:
        if not ligne.contenu:
            y += pas * 0.45
            continue
        if p < ligne.a_partir_de:
            y += pas
            continue
        local = (p - ligne.a_partir_de) / 0.20
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
            d.line([(x, y + ligne.taille + 8), (x + largeur, y + ligne.taille + 8)],
                   fill=AMBRE, width=4)
        if ligne.barree and avancement >= 1:
            d.line([(x - 4, y + ligne.taille * 0.62), (x + largeur + 4, y + ligne.taille * 0.62)],
                   fill=ROUGE_BORD, width=4)
        if ligne.note and avancement >= 1:
            d.text((x + largeur + 16, y + 4), ligne.note, font=police(18, True),
                   fill=melange(ligne.couleur, TEXTE_2, 0.4))
        if avancement < 1:
            d.rectangle([x + largeur + 2, y + 4, x + largeur + 5, y + ligne.taille * 0.96],
                        fill=AMBRE)
        y += pas
    return y


def cadre_code(d: ImageDraw.ImageDraw, box, titre: str = "ce que j'écris", accent=VIOLET):
    boite_arrondie(d, box, rayon=18, fond=CODE_FOND,
                   bord=melange(BORDURE, accent, 0.5), largeur_bord=2)
    x0, y0, x1, _ = box
    d.text((x0 + 24, y0 + 18), titre, font=police(20, True), fill=melange(TEXTE_2, accent, 0.5))
    d.line([(x0 + 20, y0 + 52), (x1 - 20, y0 + 52)], fill=(26, 36, 56), width=2)


def bulle(d: ImageDraw.ImageDraw, box, phrases, p: float, accent=AMBRE, taille=24,
          queue: int = 0):
    """Une bulle de réflexion : le texte se replie tout seul dans la boîte."""
    x0, y0, x1, y1 = box
    boite_arrondie(d, box, rayon=20, fond=(23, 33, 52), bord=accent, largeur_bord=3)
    if queue == 0:
        queue = 1 if x1 > LARGEUR / 2 else -1
    if queue > 0:
        d.polygon([(x0 + 36, y1), (x0 + 70, y1 + 22), (x0 + 74, y1)], fill=(23, 33, 52))
        d.line([(x0 + 36, y1), (x0 + 70, y1 + 22), (x0 + 74, y1)], fill=accent, width=3)
    else:
        d.polygon([(x1 - 36, y1), (x1 - 70, y1 + 22), (x1 - 74, y1)], fill=(23, 33, 52))
        d.line([(x1 - 36, y1), (x1 - 70, y1 + 22), (x1 - 74, y1)], fill=accent, width=3)

    police_ = police(taille, True)
    utile = (x1 - x0) - 48
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
    n = max(1, len(phrases))
    hauteur_ligne = taille + 8
    total = len(lignes) * hauteur_ligne
    y = y0 + ((y1 - y0) - total) / 2
    for texte_, i in lignes:
        if p < i * (0.5 / n) * 2:
            break
        coul = accent if i == n - 1 else TEXTE
        d.text(((x0 + x1) / 2, y + hauteur_ligne / 2), texte_, font=police_,
               fill=coul, anchor="mm")
        y += hauteur_ligne


# ══════════════════════════════════════════════════════════════════════════
#  Le bandeau du bas : le fil rouge de toute la capsule
# ══════════════════════════════════════════════════════════════════════════
def _puce_tableau(d: ImageDraw.ImageDraw, cx: float, cy: float, valeur: int, *,
                  actif: bool, pris: bool, t: float = 0.0, k: int = 0):
    larg, haut = 82, 50
    if actif:
        halo = 3 + 2 * _pulse(t, 1.2)
        boite_arrondie(d, [cx - larg / 2 - halo, cy - haut / 2 - halo,
                           cx + larg / 2 + halo, cy + haut / 2 + halo],
                       rayon=15, fond=melange(FOND, AMBRE, 0.20),
                       bord=melange(FOND, AMBRE, 0.55), largeur_bord=2)
    fond = melange((24, 34, 52), AMBRE, 0.14) if actif else (24, 34, 52)
    bord = AMBRE if actif else (melange(BORDURE, VERT, 0.5) if pris else BORDURE)
    boite_arrondie(d, [cx - larg / 2, cy - haut / 2, cx + larg / 2, cy + haut / 2],
                   rayon=11, fond=fond, bord=bord, largeur_bord=2)
    d.text((cx + 1, cy + 3), str(valeur), font=police(25, True, mono=True),
           fill=TEXTE if actif or not pris else melange(TEXTE_3, FOND, 0.3), anchor="mm")
    d.text((cx - larg / 2 + 8, cy - haut / 2 + 5), str(k), font=police(12, True),
           fill=melange(TEXTE_3, AMBRE if actif else VERT, 0.5), anchor="la")
    if pris:
        coche(d, cx + larg / 2 - 4, cy + haut / 2 - 2, 18, progression=1.0)


def bandeau_etat(d: ImageDraw.ImageDraw, indice: int | None = None, somme: int = 0,
                 compteur: int | None = None, valeurs=VALEURS, t: float = 0.0,
                 somme_connue: bool = True):
    """Le fil rouge du bas : le tableau T, le compteur d'étage, et la variable S."""
    x0, y0, x1, y1 = BANDE
    boite_arrondie(d, [x0, y0, x1, y1], rayon=20, fond=(15, 22, 37), bord=BORDURE,
                   largeur_bord=2)

    # ── le tableau T
    d.text((x0 + 26, y0 + 14), "le tableau T", font=police(16, True), fill=TEXTE_3)
    cx = x0 + 52
    for k, v in enumerate(valeurs):
        _puce_tableau(d, cx, y0 + 68, v, actif=(indice == k),
                      pris=(indice is not None and k < indice), t=t, k=k)
        cx += 96
    d.line([(x0 + 470, y0 + 18), (x0 + 470, y1 - 18)], fill=BORDURE, width=2)

    # ── le compteur d'étage
    cx_compteur = x0 + 604
    d.text((cx_compteur, y0 + 20), "compteur", font=police(16, True), fill=TEXTE_3,
           anchor="mm")
    boite_arrondie(d, [cx_compteur - 42, y0 + 40, cx_compteur + 42, y1 - 14], rayon=11,
                   fond=(10, 16, 28), bord=melange(BORDURE, BLEU, 0.55), largeur_bord=2)
    d.text((cx_compteur, y0 + 66), "—" if compteur is None else str(compteur),
           font=police(28, True, mono=True),
           fill=BLEU if compteur is not None else TEXTE_3, anchor="mm")
    d.text((cx_compteur + 56, y0 + 66), "étage", font=police(16, True), fill=TEXTE_3,
           anchor="lm")
    d.line([(x0 + 724, y0 + 18), (x0 + 724, y1 - 18)], fill=BORDURE, width=2)

    # ── la variable S
    d.text((x0 + 754, y0 + 20), "la variable S  (la somme)", font=police(16, True),
           fill=TEXTE_3, anchor="lm")
    d.text((x0 + 754, y0 + 66), "=", font=police(28, True), fill=TEXTE_3, anchor="lm")
    boite_arrondie(d, [x0 + 784, y0 + 42, x0 + 908, y1 - 14], rayon=12,
                   fond=melange((16, 24, 38), VERT if somme_connue else BLEU, 0.20),
                   bord=melange(BORDURE, VERT if somme_connue else BLEU, 0.65), largeur_bord=3)
    d.text((x0 + 846, y0 + 66), str(somme) if somme_connue else "…",
           font=police(32, True, mono=True),
           fill=VERT if somme_connue else TEXTE_2, anchor="mm")

    # ── la promesse, à droite
    if somme_connue and somme == SOMME_TOTALE:
        texte_fin, coul = "la somme est complète : c'est gagné !", VERT
    elif somme_connue and somme == 0:
        texte_fin, coul = "le sac est encore vide", TEXTE_2
    elif somme_connue:
        texte_fin, coul = f"il reste {SOMME_TOTALE - somme} à ramasser", TEXTE_2
    else:
        texte_fin, coul = f"à trouver : la somme des {len(valeurs)} étages", TEXTE_2
    d.text((x1 - 32, y0 + 24), texte_fin, font=police(19, True), fill=coul, anchor="ra")
    d.text((x1 - 32, y0 + 62), "S = T[0] + T[1] + T[2] + T[3]", font=police(18, True, mono=True),
           fill=melange(TEXTE_3, AMBRE, 0.35), anchor="ra")
