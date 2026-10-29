"""Socle graphique de la vidéo TP Train (Série 6).

Palette relevée sur les vidéos CSS3 existantes du site (css-animee.mp4,
tp-transitions-animations.mp4) pour que la nouvelle vidéo soit exactement
dans le même thème : fond nuit, panneaux arrondis, pastilles d'étapes,
titres ambre, ligne de code active surlignée en rouge sombre.
"""
from __future__ import annotations

import math
from PIL import Image, ImageDraw, ImageFont

# ── Palette (identique aux vidéos CSS3) ────────────────────────────────────
FOND = (13, 20, 36)
FOND_PANNEAU = (19, 28, 46)
FOND_PANNEAU_2 = (23, 34, 54)
BORDURE = (36, 49, 74)
TEXTE = (232, 238, 248)
TEXTE_2 = (147, 162, 189)
TEXTE_3 = (110, 125, 152)
ORANGE = (249, 115, 22)
ORANGE_FONCE = (234, 88, 12)
AMBRE = (251, 191, 36)
VIOLET = (168, 85, 247)
VERT = (52, 211, 153)
BLEU = (96, 165, 250)
ROSE = (244, 114, 182)
ROUGE_LIGNE = (88, 26, 32)
ROUGE_BORD = (190, 60, 60)

# ── Polices ────────────────────────────────────────────────────────────────
_SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
_SANS_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
_MONO_B = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"

_caches: dict = {}


def police(taille: int, gras: bool = False, mono: bool = False) -> ImageFont.FreeTypeFont:
    cle = (taille, gras, mono)
    if cle not in _caches:
        chemin = _MONO_B if (mono and gras) else _MONO if mono else _SANS_B if gras else _SANS
        _caches[cle] = ImageFont.truetype(chemin, taille)
    return _caches[cle]


# ── Primitives ─────────────────────────────────────────────────────────────
def melange(c1, c2, t):
    """Interpolation linéaire entre deux couleurs (t = 0 → c1, 1 → c2)."""
    t = max(0.0, min(1.0, t))
    return tuple(int(round(a + (b - a) * t)) for a, b in zip(c1, c2))


def avec_alpha(couleur, alpha):
    return couleur + (int(max(0, min(255, alpha * 255))),)


def boite_arrondie(dessin: ImageDraw.ImageDraw, box, rayon=14, fond=None, bord=None, largeur_bord=2):
    x0, y0, x1, y1 = [int(round(v)) for v in box]
    if x1 <= x0 or y1 <= y0:
        return
    rayon = int(min(rayon, (x1 - x0) / 2, (y1 - y0) / 2))
    dessin.rounded_rectangle([x0, y0, x1, y1], radius=rayon, fill=fond, outline=bord, width=largeur_bord)


def texte(dessin, xy, contenu, taille, couleur=TEXTE, gras=False, mono=False, ancre="la"):
    dessin.text((int(xy[0]), int(xy[1])), contenu, font=police(taille, gras, mono), fill=couleur, anchor=ancre)


def largeur_texte(contenu, taille, gras=False, mono=False):
    return police(taille, gras, mono).getlength(contenu)


def texte_centre(dessin, box, contenu, taille, couleur=TEXTE, gras=False, mono=False):
    x0, y0, x1, y1 = box
    dessin.text((int((x0 + x1) / 2), int((y0 + y1) / 2)), contenu,
                font=police(taille, gras, mono), fill=couleur, anchor="mm")


def texte_ajuste(dessin, box, contenu, taille_max, taille_min, couleur=TEXTE, gras=False, mono=False):
    """Écrit dans la boîte en réduisant la police jusqu'à ce que ça tienne."""
    x0, y0, x1, y1 = box
    dispo = x1 - x0
    taille = taille_max
    while taille > taille_min and largeur_texte(contenu, taille, gras, mono) > dispo:
        taille -= 1
    texte_centre(dessin, box, contenu, taille, couleur, gras, mono)
    return taille


def couper_texte(contenu, taille, largeur, gras=False, mono=False):
    """Découpe un texte en lignes qui tiennent dans la largeur donnée."""
    mots = contenu.split()
    lignes, courante = [], ""
    for mot in mots:
        essai = (courante + " " + mot).strip()
        if largeur_texte(essai, taille, gras, mono) <= largeur or not courante:
            courante = essai
        else:
            lignes.append(courante)
            courante = mot
    if courante:
        lignes.append(courante)
    return lignes


def fleche(dessin, p0, p1, couleur=BORDURE, epaisseur=3, progression=1.0, pointe=13):
    """Flèche droite qui se dessine progressivement (progression 0 → 1)."""
    if progression <= 0:
        return
    x0, y0 = p0
    x1, y1 = p1
    xt = x0 + (x1 - x0) * progression
    yt = y0 + (y1 - y0) * progression
    dessin.line([(x0, y0), (xt, yt)], fill=couleur, width=epaisseur)
    if progression > 0.92:
        angle = math.atan2(y1 - y0, x1 - x0)
        for signe in (-1, 1):
            a = angle + signe * 0.45
            dessin.line([(x1, y1), (x1 - pointe * math.cos(a), y1 - pointe * math.sin(a))],
                        fill=couleur, width=epaisseur)


def degre(couleur_hex):
    return tuple(int(couleur_hex[i:i + 2], 16) for i in (1, 3, 5))


def degrade_vertical(image, box, haut, bas):
    """Remplit une boîte d'un dégradé vertical (coins non arrondis)."""
    x0, y0, x1, y1 = [int(v) for v in box]
    if y1 <= y0 or x1 <= x0:
        return
    for y in range(y0, y1):
        t = (y - y0) / max(1, (y1 - y0 - 1))
        ImageDraw.Draw(image).line([(x0, y), (x1, y)], fill=melange(haut, bas, t))


def arrondi_masque(image, box, rayon, dessiner):
    """Dessine dans une sous-image aux coins arrondis."""
    x0, y0, x1, y1 = [int(v) for v in box]
    w, h = max(1, x1 - x0), max(1, y1 - y0)
    calque = Image.new("RGB", (w, h), FOND_PANNEAU)
    dessiner(calque)
    masque = Image.new("L", (w, h), 0)
    ImageDraw.Draw(masque).rounded_rectangle([0, 0, w - 1, h - 1], radius=rayon, fill=255)
    image.paste(calque, (x0, y0), masque)
