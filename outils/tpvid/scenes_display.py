"""Capsule 3 — TP « display, float et position » (CSS3).

Chaque scène suit la même progression pédagogique :
  1. la boîte se présente elle-même (« Je suis inline-block… ») dans une bulle ;
  2. le CSS est ensuite écrit à la machine, ligne par ligne, dans l'éditeur ;
  3. la boîte est enfin comparée à sa voisine, côte à côte.

Le CSS montré n'utilise ni `flex: 1`, ni `flex-wrap`, ni `::after` : uniquement
les propriétés du programme (display, float, clear, position, overflow).
"""
from PIL import ImageDraw

import lib as R

# ------------------------------------------------------------------ le CSS
CODE_BASE = """/* La page d'accueil du TP */
body {
  max-width: 960px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  color: #222;
}
h1 { color: #1f4e79; text-align: center; }
h2 {
  color: #1f4e79;
  border-bottom: 3px solid #e67e22;
}

/* Trois parties : display, float, position */"""

CODE_INLINE = """.m-inline {
  display: inline;
  width: 300px;      /* ignoré */
  height: 100px;     /* ignoré */
  margin-top: 30px;  /* ignoré */
  padding: 6px 10px;
  background: #fdebd0;
  border: 2px solid #e67e22;
}

/* inline : je suis un mot dans la phrase
   seules les marges horizontales comptent */"""

CODE_BLOCK = """.m-block {
  display: block;
  width: 60%;
  margin: 6px 0;
  padding: 10px;
  background: #d6eaf8;
  border: 2px solid #1f4e79;
}

/* block : je commence sur une nouvelle ligne
   et j'accepte width et height */"""

CODE_INLINE_BLOCK = """.m-ib {
  display: inline-block;
  width: 200px;
  height: 90px;
  margin: 4px 6px 4px 0;
  padding: 8px;
  vertical-align: top;
  background: #d5f5e3;
  border: 2px solid #27ae60;
}

/* inline-block : sur la ligne ET
   width / height acceptés */"""

CODE_FLEX = """.parent-flex {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  align-items: stretch;
  height: 220px;
  background: #f5eef8;
  border: 3px dashed #8e44ad;
}
.enfant {
  width: 170px;
  padding: 8px;
}

/* le parent place ses enfants en ligne */"""

CODE_FLOAT = """.flotte-gauche {
  float: left;
  width: 150px;
  height: 100px;
  margin: 0 14px 6px 0;
}
.flotte-droite {
  float: right;
  width: 150px;
  height: 100px;
}

/* je sors du flux : le texte coule autour */"""

CODE_FLOAT_PARENT = """.parent {
  border: 3px solid #c0392b;   /* hauteur 0 */
}

/* Solution 1 : le parent enveloppe */
.parent-ok {
  overflow: hidden;
}

/* Solution 2 : un élément clear: both
   placé en dernier dans le parent */
.vide-clear {
  clear: both;
}"""

CODE_POSITION_RELATIVE = """.pos {
  display: inline-block;
  width: 190px;
  height: 90px;
}
.pos-relative {
  position: relative;
  top: 20px;
  left: 20px;
  background: #fdebd0;
}

/* relative : je pars de MA place,
   mes voisines ne bougent pas */"""

CODE_POSITION_ABSOLUTE = """.zone-relative {
  position: relative;   /* le repère */
  height: 170px;
}
.abs {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 230px;
}

/* sans ancêtre positionné, je me
   cale sur la page */"""

CODE_FIXED_STICKY = """.badge-fixed {
  position: fixed;
  bottom: 12px;
  right: 12px;
}

.collant {
  position: sticky;
  top: 0;
  background: #f1c40f;
}

/* fixed : la fenêtre · sticky : le conteneur */"""

CARTONS = {
    "sous_titre": "TP animé — display, float et position",
    "fichier": "tp-display.html",
    "url": "tp-display.html",
}

# ------------------------------------------------------------------ outils
ENCRE = (40, 50, 65)
GRIS = (120, 130, 145)
GRIS_CLAIR = (196, 206, 220)
FOND_DEMO = (247, 250, 254)


def _cadre(im, d, box, titre):
    """Fond clair du banc d'essai + rappel de la propriété étudiée."""
    x0, y0, x1, y1 = box
    d.rounded_rectangle([x0 + 14, y0 + 74, x1 - 14, y1 - 14], radius=10,
                        fill=FOND_DEMO, outline=GRIS_CLAIR, width=1)
    d.text((x0 + 26, y0 + 58), titre, font=R.police(R.POLICE_B, 13), fill=R.BLEU_TP)
    return x0 + 26, y0 + 92


def _boite(im, d, x, y, w, h, titre, fond, bord, pointilles=False, texte=None, taille=11):
    if pointilles:
        # Rectangle en pointillés : la taille demandée mais ignorée.
        for yy in range(int(y), int(y + h), 8):
            d.line([(x, yy), (x + w, yy)], fill=bord, width=1)
        for xx in range(int(x), int(x + w), 8):
            d.line([(xx, y), (xx, y + h)], fill=bord, width=1)
    else:
        d.rounded_rectangle([x, y, x + w, y + h], radius=6, fill=fond, outline=bord, width=2)
    d.text((x + 8, y + 6), titre, font=R.police(R.POLICE_B, taille), fill=ENCRE)
    if texte:
        d.text((x + 8, y + 6 + taille + 5), texte, font=R.police(R.POLICE, taille - 1), fill=ENCRE)
    return (x, y, x + w, y + h)


def _puce(im, d, x, y, texte, couleur=R.ORANGE):
    d.ellipse([x, y + 4, x + 7, y + 11], fill=couleur)
    d.text((x + 13, y), texte, font=R.police(R.POLICE, 11), fill=ENCRE)


def _comparaison(im, d, box, gauche, droite, legende_g, legende_d):
    """Bandeau du bas : la boîte et sa voisine, côte à côte."""
    x0, y0, x1, y1 = box
    haut = y1 - 168
    d.line([(x0 + 20, haut - 10), (x1 - 20, haut - 10)], fill=GRIS_CLAIR, width=1)
    d.text((x0 + 24, haut + 2), "COMPARAISON AVEC LA VOISINE",
           font=R.police(R.POLICE_B, 11), fill=R.BLEU_TP)
    largeur = int((x1 - x0 - 60) / 2)
    y = haut + 24
    d.rounded_rectangle([x0 + 24, y, x0 + 24 + largeur, y + 118], radius=8,
                        fill=(255, 255, 255), outline=GRIS_CLAIR)
    d.text((x0 + 34, y + 6), legende_g, font=R.police(R.POLICE_B, 11), fill=R.BLEU_TP)
    gauche(im, d, x0 + 34, y + 26)
    gx = x0 + 36 + largeur
    d.rounded_rectangle([gx, y, gx + largeur, y + 118], radius=8,
                        fill=(255, 255, 255), outline=GRIS_CLAIR)
    d.text((gx + 10, y + 6), legende_d, font=R.police(R.POLICE_B, 11), fill=R.ORANGE)
    droite(im, d, gx + 10, y + 26)


def _mini_ligne(im, d, x, y, couleur, largeur=60, etiquette=""):
    d.rounded_rectangle([x, y, x + largeur, y + 20], radius=4, fill=couleur,
                        outline=(150, 160, 175))
    if etiquette:
        d.text((x + 6, y + 3), etiquette, font=R.police(R.POLICE, 9), fill=ENCRE)


# ------------------------------------------------------------------ décors
def _contenu(box):
    """Zone utile du banc d'essai (sous le bandeau du navigateur)."""
    x0, y0, x1, y1 = box
    return x0 + 26, y0 + 92, x1 - 26, y1 - 182


def _pointilles(d, x, y, w, h, couleur, pas=9, trait=5, epaisseur=2):
    """Cadre en pointillés : la taille demandée mais non appliquée."""
    for xx in range(int(x), int(x + w), pas):
        d.line([(xx, y), (min(xx + trait, x + w), y)], fill=couleur, width=epaisseur)
        d.line([(xx, y + h), (min(xx + trait, x + w), y + h)], fill=couleur, width=epaisseur)
    for yy in range(int(y), int(y + h), pas):
        d.line([(x, yy), (x, min(yy + trait, y + h))], fill=couleur, width=epaisseur)
        d.line([(x + w, yy), (x + w, min(yy + trait, y + h))], fill=couleur, width=epaisseur)


def _boite(im, d, x, y, w, h, titre, fond, bord, texte=None, taille=12, pointilles=False):
    if pointilles:
        _pointilles(d, x, y, w, h, bord)
    else:
        d.rounded_rectangle([x, y, x + w, y + h], radius=6, fill=fond, outline=bord, width=2)
    d.text((x + 9, y + 7), titre, font=R.police(R.POLICE_B, taille), fill=ENCRE)
    if texte:
        d.text((x + 9, y + 7 + taille + 5), texte, font=R.police(R.POLICE, taille - 1), fill=ENCRE)
    return (x, y, x + w, y + h)


def _puce(im, d, x, y, texte, couleur=R.ORANGE):
    d.ellipse([x, y + 4, x + 7, y + 11], fill=couleur)
    d.text((x + 14, y), texte, font=R.police(R.POLICE, 11), fill=ENCRE)


def _parle(im, d, texte, zone, dessous=False):
    """Bulle de la boîte qui se présente (phase 1 de chaque scène)."""
    R.bulle(im, d, texte, zone, dessous=dessous)


def _comparaison(im, d, box, gauche, droite, legende_g, legende_d):
    """Phase 3 : la boîte comparée à sa voisine, côte à côte."""
    x0, y0, x1, y1 = box
    haut = y1 - 168
    d.line([(x0 + 22, haut - 12), (x1 - 22, haut - 12)], fill=GRIS_CLAIR, width=1)
    d.text((x0 + 26, haut), "COMPARAISON AVEC LA VOISINE",
           font=R.police(R.POLICE_B, 11), fill=R.BLEU_TP)
    largeur = int((x1 - x0 - 64) / 2)
    y = haut + 22
    d.rounded_rectangle([x0 + 24, y, x0 + 24 + largeur, y + 122], radius=8,
                        fill=(255, 255, 255), outline=GRIS_CLAIR)
    d.text((x0 + 34, y + 6), legende_g, font=R.police(R.POLICE_B, 11), fill=R.BLEU_TP)
    gauche(im, d, x0 + 34, y + 30)
    gx = x0 + 38 + largeur
    d.rounded_rectangle([gx, y, gx + largeur, y + 122], radius=8,
                        fill=(255, 255, 255), outline=GRIS_CLAIR)
    d.text((gx + 10, y + 6), legende_d, font=R.police(R.POLICE_B, 11), fill=R.ORANGE)
    droite(im, d, gx + 10, y + 30)


def _mini_ligne(im, d, x, y, couleur, largeur=60, etiquette=""):
    d.rounded_rectangle([x, y, x + largeur, y + 22], radius=4, fill=couleur,
                        outline=(150, 160, 175))
    if etiquette:
        d.text((x + 7, y + 4), etiquette, font=R.police(R.POLICE, 10), fill=ENCRE)


# ------------------------------------------------------------------ décors
def decor_inline(im, d, box, p, e):
    x, y, xd, _ = _contenu(box)
    d.text((x, y), "display: inline — je suis un mot dans la phrase",
           font=R.police(R.POLICE_B, 13), fill=R.BLEU_TP)
    d.text((x, y + 26), "Une phrase normale, puis", font=R.police(R.POLICE, 12), fill=ENCRE)
    bx = x + int(d.textlength("Une phrase normale, puis", font=R.police(R.POLICE, 12))) + 8
    zones = []
    for etiquette in ("inline", "inline", "inline"):
        largeur = int(d.textlength(etiquette, font=R.police(R.POLICE, 11))) + 24
        zones.append(_boite(im, d, bx, y + 22, largeur, 26, etiquette, (253, 235, 208), R.ORANGE,
                            taille=11))
        bx += largeur + 8
    d.text((x, y + 58), "… et la phrase continue sans aucun retour à la ligne.",
           font=R.police(R.POLICE, 12), fill=ENCRE)

    if p > 0.28:
        d.text((x, y + 92), "width: 300px · height: 100px · margin-top: 30px",
               font=R.police(R.MONO, 11), fill=GRIS)
        _boite(im, d, x, y + 114, 300, 96, "300 × 100 : ignorés", (255, 255, 255), (200, 90, 60),
               pointilles=True, taille=11)
        d.line([(x + 6, y + 120), (x + 294, y + 204)], fill=(200, 90, 60), width=2)
        d.line([(x + 294, y + 120), (x + 6, y + 204)], fill=(200, 90, 60), width=2)
        _puce(im, d, x, y + 220, "La boîte garde la taille de son texte.")
        _puce(im, d, x, y + 242, "Seul le padding horizontal pousse les voisines.")
        _puce(im, d, x, y + 264, "Une hauteur est impossible à imposer.", (200, 90, 60))

    if 0.04 < p < 0.25:
        _parle(im, d, "Je suis inline : width et height sont ignorés !", zones[0])

    if p > 0.68:
        def g(im2, d2, gx, gy):
            _mini_ligne(im2, d2, gx, gy, (253, 235, 208), 68, "inline")
            _mini_ligne(im2, d2, gx + 72, gy, (253, 235, 208), 68, "inline")
            d2.text((gx, gy + 28), "sur la même ligne", font=R.police(R.POLICE, 10), fill=GRIS)
        def dr(im2, d2, gx, gy):
            _mini_ligne(im2, d2, gx, gy, (214, 234, 248), 150, "block")
            _mini_ligne(im2, d2, gx, gy + 28, (214, 234, 248), 150, "block")
            d2.text((gx, gy + 56), "l'un sous l'autre", font=R.police(R.POLICE, 10), fill=GRIS)
        _comparaison(im, d, box, g, dr, "inline", "block")
    return {}


def decor_block(im, d, box, p, e):
    x, y, xd, _ = _contenu(box)
    d.text((x, y), "display: block — je prends toute la ligne",
           font=R.police(R.POLICE_B, 13), fill=R.BLEU_TP)
    z1 = _boite(im, d, x, y + 26, 336, 84, "Je suis block",
                (214, 234, 248), R.BLEU_TP, texte="je commence sur une nouvelle ligne")
    z2 = _boite(im, d, x, y + 122, 336, 84, "Je suis block aussi",
                (214, 234, 248), R.BLEU_TP, texte="je passe sous mon frère, même s'il reste de la place")
    if p > 0.28:
        d.rectangle([x + 344, y + 26, xd, y + 206], outline=(205, 212, 224))
        d.text((x + 356, y + 96), "place", font=R.police(R.POLICE, 11), fill=GRIS)
        d.text((x + 356, y + 114), "perdue", font=R.police(R.POLICE, 11), fill=GRIS)
        d.text((x + 356, y + 132), "→", font=R.police(R.POLICE_B, 13), fill=(200, 90, 60))
        _puce(im, d, x, y + 220, "width: 60% : la boîte est plus étroite, la ligne reste pleine.",
              R.BLEU_TP)
        _puce(im, d, x, y + 244, "C'est le comportement de div, p et des titres h1, h2.")

    if 0.04 < p < 0.25:
        _parle(im, d, "Je suis block : toute la largeur est à moi.", z1)

    if p > 0.68:
        def g(im2, d2, gx, gy):
            _mini_ligne(im2, d2, gx, gy, (214, 234, 248), 150, "block")
            _mini_ligne(im2, d2, gx, gy + 28, (214, 234, 248), 150, "block")
            d2.text((gx, gy + 56), "l'un sous l'autre", font=R.police(R.POLICE, 10), fill=GRIS)
        def dr(im2, d2, gx, gy):
            _mini_ligne(im2, d2, gx, gy, (253, 235, 208), 68, "inline")
            _mini_ligne(im2, d2, gx + 72, gy, (253, 235, 208), 68, "inline")
            d2.text((gx, gy + 28), "côte à côte", font=R.police(R.POLICE, 10), fill=GRIS)
        _comparaison(im, d, box, g, dr, "block", "inline")
    return {}


def decor_inline_block(im, d, box, p, e):
    x, y, xd, _ = _contenu(box)
    d.text((x, y), "display: inline-block — sur la ligne ET largeur acceptée",
           font=R.police(R.POLICE_B, 13), fill=R.BLEU_TP)
    zones = []
    for i in range(3):
        zones.append(_boite(im, d, x + i * 164, y + 26, 152, 96, "inline-block %d" % (i + 1),
                            (213, 245, 227), (39, 174, 96), texte="200 × 90 px respectés"))
    d.text((x, y + 134), "width: 200px · height: 90px · vertical-align: top",
           font=R.police(R.MONO, 11), fill=GRIS)
    if p > 0.28:
        d.line([(x, y + 162), (xd, y + 162)], fill=GRIS_CLAIR, width=1)
        _boite(im, d, x + 330, y + 26, 152, 96, "4ᵉ boîte", (247, 250, 254), GRIS_CLAIR,
               texte="passe à la ligne", pointilles=True)
        _puce(im, d, x, y + 176, "Même taille pour les trois : width et height obéissent.",
              (39, 174, 96))
        _puce(im, d, x, y + 200, "Et elles restent sur la ligne, comme des mots.")
        _puce(im, d, x, y + 224, "Idéal pour un menu, des cartes ou des boutons alignés.")

    if 0.04 < p < 0.25:
        _parle(im, d, "Je suis inline-block : sur la ligne, et je garde ma taille.", zones[0])

    if p > 0.68:
        def g(im2, d2, gx, gy):
            _mini_ligne(im2, d2, gx, gy, (213, 245, 227), 64, "inline-block")
            _mini_ligne(im2, d2, gx + 68, gy, (213, 245, 227), 64, "inline-block")
            d2.text((gx, gy + 28), "200 × 90 respectés", font=R.police(R.POLICE, 10), fill=GRIS)
        def dr(im2, d2, gx, gy):
            _mini_ligne(im2, d2, gx, gy, (214, 234, 248), 150, "block")
            _mini_ligne(im2, d2, gx, gy + 28, (214, 234, 248), 150, "block")
            d2.text((gx, gy + 56), "la voisine block descend", font=R.police(R.POLICE, 10), fill=GRIS)
        _comparaison(im, d, box, g, dr, "inline-block", "block")
    return {}


def decor_flex(im, d, box, p, e):
    x, y, xd, _ = _contenu(box)
    d.text((x, y), "display: flex — le parent range ses enfants",
           font=R.police(R.POLICE_B, 13), fill=R.BLEU_TP)
    d.rounded_rectangle([x, y + 26, xd, y + 200], radius=8, fill=(245, 238, 248),
                        outline=(142, 68, 173), width=2)
    d.text((x + 10, y + 32), "parent flex", font=R.police(R.POLICE_B, 11), fill=(142, 68, 173))
    enfant = None
    for i in range(3):
        z = _boite(im, d, x + 14 + i * 162, y + 54, 150, 132, "enfant %d" % (i + 1),
                   (232, 218, 239), (142, 68, 173), texte="le parent me place")
        enfant = enfant or z
    d.text((x, y + 208), "gap: 10px · justify-content: flex-start · align-items: stretch",
           font=R.police(R.MONO, 11), fill=GRIS)
    if p > 0.28:
        _puce(im, d, x, y + 232, "Les enfants n'ont qu'une largeur : le parent décide du reste.",
              (142, 68, 173))
        _puce(im, d, x, y + 256, "Aucun enfant n'a besoin de flex: 1 ni de flex-wrap.")

    if 0.04 < p < 0.25:
        _parle(im, d, "Je suis le parent flex : c'est moi qui place mes enfants.",
               (x + 150, y + 200, x + 380, y + 200))

    if p > 0.68:
        def g(im2, d2, gx, gy):
            _mini_ligne(im2, d2, gx, gy + 6, (232, 218, 239), 44, "1")
            _mini_ligne(im2, d2, gx + 48, gy + 6, (232, 218, 239), 44, "2")
            _mini_ligne(im2, d2, gx + 96, gy + 6, (232, 218, 239), 44, "3")
            d2.text((gx, gy + 34), "côte à côte", font=R.police(R.POLICE, 10), fill=GRIS)
        def dr(im2, d2, gx, gy):
            for i in range(3):
                _mini_ligne(im2, d2, gx, gy + i * 26, (232, 218, 239), 120, str(i + 1))
            d2.text((gx + 126, gy + 24), "l'un sous l'autre", font=R.police(R.POLICE, 10), fill=GRIS)
        _comparaison(im, d, box, g, dr, "parent flex", "parent en display: block")
    return {}


def decor_float(im, d, box, p, e):
    x, y, xd, _ = _contenu(box)
    d.text((x, y), "float: left et float: right — le texte coule autour",
           font=R.police(R.POLICE_B, 13), fill=R.BLEU_TP)
    z1 = _boite(im, d, x, y + 26, 148, 88, "float: left", (214, 234, 248), R.BLEU_TP,
                texte="collé à gauche")
    z2 = _boite(im, d, x + 344, y + 26, 148, 88, "float: right", (253, 235, 208), R.ORANGE,
                texte="collé à droite")
    texte = ("Moi, je suis un paragraphe normal : je coule autour des deux flottants. "
             "Le flottant sort du flux, donc mon texte le contourne comme l'eau "
             "contourne une pierre, puis je reprends toute la largeur disponible "
             "sous les deux boîtes, tranquillement, jusqu'à la fin de la phrase.")
    police_t = R.police(R.POLICE, 10)
    lignes, ligne = [], ""
    for mot in texte.split(" "):
        essai = (ligne + " " + mot).strip()
        if d.textlength(essai, font=police_t) > 340 and ligne:
            lignes.append(ligne)
            ligne = mot
        else:
            ligne = essai
    lignes.append(ligne)
    yy = y + 34
    for lg in lignes[:5]:
        d.text((x + 158, yy), lg, font=police_t, fill=ENCRE)
        yy += 16
    for lg in lignes[5:]:
        d.text((x, yy), lg, font=police_t, fill=ENCRE)
        yy += 16
    if p > 0.28:
        _puce(im, d, x, y + 210, "Le flottant sort du flux : il ne pousse plus les blocs.",
              R.BLEU_TP)
        _puce(im, d, x, y + 234, "Le texte se glisse à côté, puis reprend toute la largeur.")
        _puce(im, d, x, y + 258, "Float habille une image, il ne construit pas une grille.")

    if 0.04 < p < 0.25:
        _parle(im, d, "Je suis float: left : je sors du flux, le texte m'entoure.", z1)

    if p > 0.68:
        def g(im2, d2, gx, gy):
            d2.rounded_rectangle([gx, gy, gx + 56, gy + 34], radius=4, fill=(214, 234, 248),
                                 outline=R.BLEU_TP)
            for i in range(4):
                d2.line([(gx + 60, gy + 4 + i * 8), (gx + 148, gy + 4 + i * 8)],
                        fill=(175, 185, 200))
            d2.text((gx, gy + 44), "le texte contourne", font=R.police(R.POLICE, 10), fill=GRIS)
        def dr(im2, d2, gx, gy):
            d2.rounded_rectangle([gx, gy, gx + 56, gy + 34], radius=4, fill=(214, 234, 248),
                                 outline=R.BLEU_TP)
            for i in range(4):
                d2.line([(gx, gy + 44 + i * 8), (gx + 150, gy + 44 + i * 8)],
                        fill=(175, 185, 200))
            d2.text((gx + 60, gy + 4), "le texte passe dessous",
                    font=R.police(R.POLICE, 10), fill=GRIS)
        _comparaison(im, d, box, g, dr, "à côté du flottant", "sous le flottant")
    return {}


def decor_float_parent(im, d, box, p, e):
    x, y, xd, _ = _contenu(box)
    d.text((x, y), "Le parent qui s'écrase — et les deux solutions",
           font=R.police(R.POLICE_B, 13), fill=R.BLEU_TP)
    d.rounded_rectangle([x, y + 26, x + 236, y + 48], radius=4, fill=(253, 237, 236),
                        outline=(192, 57, 43), width=2)
    d.text((x + 8, y + 31), "parent : ma hauteur est 0", font=R.police(R.POLICE_B, 11),
           fill=(192, 57, 43))
    z = _boite(im, d, x + 8, y + 56, 120, 76, "float: left", (214, 234, 248), R.BLEU_TP,
               texte="sorti du flux")
    d.text((x, y + 140), "la bordure rouge s'écrase :", font=R.police(R.POLICE, 11),
           fill=(150, 50, 40))
    d.text((x, y + 156), "elle ne contient plus l'enfant.", font=R.police(R.POLICE, 11),
           fill=(150, 50, 40))

    if p > 0.30:
        _boite(im, d, x + 262, y + 20, 246, 108, "Solution 1 : overflow: hidden",
               (234, 250, 241), (39, 174, 96), texte="le parent enveloppe son enfant")
        d.rounded_rectangle([x + 270, y + 76, x + 396, y + 114], radius=4, fill=(214, 234, 248),
                            outline=R.BLEU_TP)
        d.text((x + 276, y + 82), "float: left", font=R.police(R.POLICE, 10), fill=ENCRE)

    if p > 0.56:
        _boite(im, d, x + 262, y + 140, 246, 128, "Solution 2 : clear: both",
               (234, 250, 241), (39, 174, 96), texte="un élément vide en dernier")
        d.rounded_rectangle([x + 270, y + 194, x + 396, y + 230], radius=4, fill=(214, 234, 248),
                            outline=R.BLEU_TP)
        d.text((x + 276, y + 200), "float: left", font=R.police(R.POLICE, 10), fill=ENCRE)
        d.rounded_rectangle([x + 270, y + 234, x + 396, y + 260], radius=4, fill=(226, 234, 245),
                            outline=(120, 130, 145))
        d.text((x + 276, y + 239), "clear: both", font=R.police(R.MONO, 10), fill=ENCRE)

    if p > 0.28:
        d.text((x, y + 232), "Deux solutions, un seul but :", font=R.police(R.POLICE_B, 11),
               fill=R.BLEU_TP)
        d.text((x, y + 250), "rendre sa hauteur au parent.", font=R.police(R.POLICE, 11),
               fill=ENCRE)
        d.text((x, y + 274), "On en choisit une, et on la garde.", font=R.police(R.POLICE, 10),
               fill=GRIS)

    if 0.04 < p < 0.25:
        _parle(im, d, "Je suis le parent : mon enfant flottant m'échappe !", z)
    return {}


def decor_position_relative(im, d, box, p, e):
    x, y, xd, _ = _contenu(box)
    d.text((x, y), "position: relative — je me décale depuis MA place",
           font=R.police(R.POLICE_B, 13), fill=R.BLEU_TP)
    d.rounded_rectangle([x, y + 26, xd, y + 196], radius=8, fill=(244, 248, 252),
                        outline=R.BLEU_TP, width=2)
    z1 = _boite(im, d, x + 14, y + 44, 142, 76, "static", (214, 234, 248), R.BLEU_TP,
                texte="je ne bouge pas")
    depart = (x + 168, y + 44)
    decale = max(0.0, min(1.0, (p - 0.32) / 0.34))
    dx, dy = int(20 * decale), int(20 * decale)
    z2 = _boite(im, d, depart[0] + dx, depart[1] + dy, 152, 76, "relative",
                (253, 235, 208), R.ORANGE, texte="top: 20px; left: 20px")
    z3 = _boite(im, d, x + 336, y + 44, 146, 76, "static", (214, 234, 248), R.BLEU_TP,
                texte="ma voisine n'a pas bougé")
    if decale > 0.1:
        d.rectangle([depart[0], depart[1], depart[0] + 152, depart[1] + 76],
                    outline=(190, 180, 170))
        d.text((depart[0] + 6, depart[1] + 56), "place d'origine", font=R.police(R.POLICE, 10),
               fill=GRIS)
    _puce(im, d, x, y + 212, "La boîte se décale, mais sa place reste réservée.")
    _puce(im, d, x, y + 236, "Les voisines ne bougent pas d'un pixel.")
    _puce(im, d, x, y + 260, "Sert aussi de repère pour un enfant absolute.", R.BLEU_TP)

    if 0.04 < p < 0.25:
        _parle(im, d, "Je suis relative : je bouge, ma place reste occupée.", z2)

    if p > 0.72:
        def g(im2, d2, gx, gy):
            _mini_ligne(im2, d2, gx, gy + 6, (214, 234, 248), 56, "static")
            _mini_ligne(im2, d2, gx + 60, gy + 6, (214, 234, 248), 56, "static")
            d2.text((gx, gy + 34), "alignées", font=R.police(R.POLICE, 10), fill=GRIS)
        def dr(im2, d2, gx, gy):
            _mini_ligne(im2, d2, gx, gy + 6, (214, 234, 248), 56, "static")
            _mini_ligne(im2, d2, gx + 64, gy + 16, (253, 235, 208), 56, "relative")
            d2.text((gx, gy + 46), "décalée", font=R.police(R.POLICE, 10), fill=GRIS)
        _comparaison(im, d, box, g, dr, "deux static", "une relative")
    return {}


def decor_position_absolute(im, d, box, p, e):
    x, y, xd, _ = _contenu(box)
    d.text((x, y), "position: absolute — quel ancêtre me sert de repère ?",
           font=R.police(R.POLICE_B, 13), fill=R.BLEU_TP)
    d.rounded_rectangle([x, y + 26, xd, y + 140], radius=8, fill=(244, 248, 252),
                        outline=R.BLEU_TP, width=2)
    d.text((x + 10, y + 32), "zone-relative : le repère", font=R.police(R.POLICE_B, 11),
           fill=R.BLEU_TP)
    z = _boite(im, d, x + 246, y + 54, 236, 74, "absolute",
               (253, 235, 208), R.ORANGE, texte="top: 10px; right: 10px")

    if p > 0.30:
        d.rounded_rectangle([x, y + 152, xd, y + 276], radius=8, fill=(245, 238, 248),
                            outline=(142, 68, 173), width=2)
        d.text((x + 10, y + 158), "grand-parent relative", font=R.police(R.POLICE_B, 11),
               fill=(142, 68, 173))
        d.rounded_rectangle([x + 22, y + 178, x + 300, y + 264], radius=6,
                            outline=(142, 68, 173), width=2)
        d.text((x + 30, y + 184), "parent static : pas un repère",
               font=R.police(R.POLICE, 11), fill=(110, 60, 140))
        _boite(im, d, x + 34, y + 208, 176, 48, "absolute", (253, 235, 208), R.ORANGE,
               texte="bottom: 0; left: 0", taille=11)
        d.text((x + 316, y + 200), "→ je me cale sur le", font=R.police(R.POLICE, 11), fill=ENCRE)
        d.text((x + 316, y + 218), "grand-parent, pas sur", font=R.police(R.POLICE, 11), fill=ENCRE)
        d.text((x + 316, y + 236), "le parent static.", font=R.police(R.POLICE, 11), fill=ENCRE)

    if 0.04 < p < 0.25:
        _parle(im, d, "Je suis absolute : je sors du flux et je me cale sur mon repère.", z)

    if p > 0.72:
        def g(im2, d2, gx, gy):
            d2.rounded_rectangle([gx, gy, gx + 148, gy + 64], outline=R.BLEU_TP, width=2)
            _mini_ligne(im2, d2, gx + 6, gy + 8, (253, 235, 208), 60, "absolute")
            d2.text((gx, gy + 70), "parent relative", font=R.police(R.POLICE, 10), fill=GRIS)
        def dr(im2, d2, gx, gy):
            d2.rounded_rectangle([gx, gy, gx + 148, gy + 64], outline=(142, 68, 173), width=2)
            _mini_ligne(im2, d2, gx + 6, gy + 8, (253, 235, 208), 60, "absolute")
            d2.text((gx, gy + 70), "parent static", font=R.police(R.POLICE, 10), fill=GRIS)
        _comparaison(im, d, box, g, dr, "je reste dans le repère", "je remonte au grand-parent")
    return {}


def decor_fixed_sticky(im, d, box, p, e):
    x, y, xd, _ = _contenu(box)
    d.text((x, y), "fixed (la fenêtre) et sticky (le conteneur)",
           font=R.police(R.POLICE_B, 13), fill=R.BLEU_TP)
    d.rounded_rectangle([x, y + 26, x + 228, y + 232], radius=8, fill=(255, 255, 255),
                        outline=GRIS_CLAIR, width=1)
    d.rectangle([x, y + 26, x + 228, y + 46], fill=(238, 242, 248))
    d.text((x + 10, y + 30), "fenêtre du navigateur", font=R.police(R.POLICE, 10), fill=GRIS)
    defile = int(28 * ((p * 2) % 1))
    for i in range(6):
        d.line([(x + 12, y + 60 + i * 24 - defile % 24), (x + 212, y + 60 + i * 24 - defile % 24)],
               fill=(200, 208, 220))
    zb = _boite(im, d, x + 26, y + 186, 176, 34, "fixed", (192, 57, 43), (140, 30, 25),
                taille=10)
    d.text((x + 38, y + 198), "collé à la fenêtre", font=R.police(R.POLICE, 10),
           fill=(255, 255, 255))

    if p > 0.28:
        d.rounded_rectangle([x + 258, y + 26, xd, y + 232], radius=8, fill=(255, 255, 255),
                            outline=GRIS_CLAIR, width=1)
        d.rectangle([x + 258, y + 26, xd, y + 46], fill=(238, 242, 248))
        d.text((x + 268, y + 30), "zone qui défile", font=R.police(R.POLICE, 10), fill=GRIS)
        avance = int(48 * min(1.0, max(0.0, (p - 0.32) / 0.42)))
        d.rectangle([x + 266, y + 52, xd - 8, y + 226], fill=(252, 253, 255),
                    outline=GRIS_CLAIR)
        for i in range(9):
            yy = y + 96 + i * 20 - avance
            if yy > y + 54:
                d.line([(x + 276, yy), (xd - 18, yy)], fill=(205, 212, 224))
        yb = y + 54 + max(0, 14 - avance // 4)
        d.rectangle([x + 266, yb, xd - 8, yb + 32], fill=(241, 196, 15))
        d.text((x + 274, yb + 8), "sticky top: 0", font=R.police(R.POLICE_B, 11),
               fill=(80, 60, 0))

    _puce(im, d, x, y + 246, "fixed : repère = la fenêtre. sticky : repère = la zone de défilement.")
    _puce(im, d, x, y + 270, "Sans top, sticky ne se fige jamais.")

    if 0.04 < p < 0.25:
        _parle(im, d, "Je suis fixed : je ne bouge pas quand la page défile.", zb, dessous=True)
    return {}


# ------------------------------------------------------------------ scènes
SCENES = [
    dict(cle="intro", ep=None, voix=None, type="intro",
         titre="TP animé — display, float et position",
         episodes=[("ÉPISODE 1", "display : inline, block, inline-block, flex"),
                   ("ÉPISODE 2", "float et clear : sortir du flux"),
                   ("ÉPISODE 3", "position : relative, absolute, fixed, sticky")],
         duree=10),

    dict(cle="base", ep=1, voix="c02.mp3", type="code", code=CODE_BASE,
         code_fenetre=(0.10, 0.55),
         pages=[dict(debut=0.0, url="tp-display.html", widgets=[
             dict(t="titre", texte="TP : display, float et position"),
             dict(t="soustitre", texte="chaque boîte se présente : « Je suis… »"),
             dict(t="table", id="t", entetes=["Partie", "Propriétés", "Question"],
                  lignes=[["1", "display", "quelle place sur la ligne ?"],
                          ["2", "float / clear", "qui entoure qui ?"],
                          ["3", "position", "par rapport à quoi ?"]],
                  largeurs=[70, 130, 250]),
         ])],
         texte="Bonjour et bienvenue dans ce troisième TP animé, consacré à trois propriétés "
               "CSS que le bac adore : display, float et position. La règle du jeu est simple "
               "et elle ne change pas : à chaque scène, la boîte se présente elle-même, elle "
               "dit « je suis inline », « je suis block », « je suis flottante ». Ensuite, et "
               "seulement ensuite, nous écrivons le CSS dans l'éditeur, ligne par ligne. Enfin, "
               "nous comparons la boîte avec sa voisine, pour voir exactement ce qui change. "
               "Regardez le squelette, à gauche : le doctype, la balise html avec lang français, "
               "le head avec charset et viewport, puis une balise style qui fixe la largeur "
               "maximale de neuf cent soixante pixels, la marge automatique qui centre la page, "
               "la police Arial et la couleur des titres. À droite, la page annonce ses trois "
               "parties : display, float, position. Nous allons les prendre dans cet ordre.",
         etapes=[dict(f=0.08, x=340, y=120), dict(f=0.30, x=360, y=320),
                 dict(f=0.55, x=380, y=460), dict(f=0.78, x=880, y=220)]),

    dict(cle="inline", ep=1, voix="c03.mp3", type="code", code=CODE_INLINE,
         code_fenetre=(0.25, 0.60),
         pages=[dict(debut=0.0, url="tp-display.html", widgets=[], decor=decor_inline)],
         texte="Première boîte, première valeur : display inline. Écoutez-la se présenter : "
               "je suis inline, je suis comme un mot dans la phrase. Et c'est vrai : mes trois "
               "boîtes se placent côte à côte, exactement comme des mots, et la phrase continue "
               "après elles sans aucun retour à la ligne. Maintenant, le CSS. La règle s'appelle "
               "m-inline et elle contient display inline. Puis viennent trois propriétés que "
               "beaucoup d'élèves écrivent sans comprendre : width trois cents pixels, height "
               "cent pixels, margin-top trente pixels. Elles sont ignorées. Le navigateur les lit, "
               "les accepte, et ne les applique pas, parce qu'une boîte inline n'a pas de largeur "
               "ni de hauteur propres : sa taille, c'est son contenu, c'est son texte. Les "
               "pointillés de l'écran montrent la taille demandée, et la croix rouge indique "
               "qu'elle n'existe pas. Seul le padding horizontal travaille : il pousse les "
               "voisines à gauche et à droite. Comparez maintenant avec la voisine block, en bas : "
               "deux boîtes inline restent sur la même ligne, deux boîtes block se placent l'une "
               "sous l'autre. Retenez la phrase du bac : inline, je suis un mot.",
         etapes=[dict(f=0.06, x=760, y=200), dict(f=0.34, x=300, y=300),
                 dict(f=0.58, x=820, y=330), dict(f=0.80, x=860, y=560)]),

    dict(cle="block", ep=1, voix="c04.mp3", type="code", code=CODE_BLOCK,
         code_fenetre=(0.25, 0.60),
         pages=[dict(debut=0.0, url="tp-display.html", widgets=[], decor=decor_block)],
         texte="Deuxième valeur, et deuxième présentation : je suis block. Je commence sur une "
               "nouvelle ligne, et j'accepte width et height. Le CSS dit display block, une "
               "largeur de soixante pour cent, une marge verticale de six pixels, un padding de "
               "dix et une bordure bleue. Résultat : ma boîte prend soixante pour cent de la "
               "largeur, et pourtant personne ne peut se mettre à sa droite. Pourquoi ? Parce "
               "qu'une boîte block occupe toute la ligne, même quand sa largeur visible est plus "
               "petite. Regardez la zone hachurée à droite : cette place est perdue. La deuxième "
               "boîte block descend sous la première, sans se demander s'il reste de l'espace. "
               "C'est exactement le comportement de div, de p et des titres h1, h2, h3. Comparez "
               "avec la voisine inline : deux inline se serrent côte à côte, deux block "
               "s'empilent. La phrase à retenir : block, je prends toute la ligne.",
         etapes=[dict(f=0.06, x=780, y=210), dict(f=0.32, x=300, y=280),
                 dict(f=0.60, x=860, y=330), dict(f=0.82, x=850, y=560)]),

    dict(cle="inline_block", ep=1, voix="c05.mp3", type="code", code=CODE_INLINE_BLOCK,
         code_fenetre=(0.25, 0.60),
         pages=[dict(debut=0.0, url="tp-display.html", widgets=[], decor=decor_inline_block)],
         texte="Troisième valeur, et c'est la préférée du bac : inline-block. Écoutez-la : je "
               "suis inline-block, je reste sur la ligne comme un inline, mais j'accepte width "
               "et height comme un block. Autrement dit, je cumule les deux avantages. Le CSS "
               "le confirme : display inline-block, width deux cents pixels, height quatre-vingt-"
               "dix pixels, une marge extérieure, un padding de huit et vertical-align top pour "
               "aligner les boîtes par le haut. Sur l'écran, les trois boîtes ont exactement la "
               "même taille, même si leur texte est plus court : la largeur et la hauteur sont "
               "respectées. Et elles restent côte à côte : si une quatrième boîte arrive et que "
               "la ligne est pleine, elle passe simplement à la ligne suivante. Voilà pourquoi "
               "inline-block sert à fabriquer des menus, des cartes, des badges, des boutons "
               "alignés. Comparez avec la voisine block : elle, elle descend d'office. Inline-"
               "block, c'est mon outil pour aligner proprement sans toucher au flux.",
         etapes=[dict(f=0.06, x=740, y=190), dict(f=0.34, x=310, y=290),
                 dict(f=0.62, x=850, y=320), dict(f=0.84, x=860, y=560)]),

    dict(cle="flex", ep=1, voix="c06.mp3", type="code", code=CODE_FLEX,
         code_fenetre=(0.25, 0.60),
         pages=[dict(debut=0.0, url="tp-display.html", widgets=[], decor=decor_flex)],
         texte="Dernière valeur de display, et la plus récente : flex. Attention, changeons de "
               "rôle. Cette fois, la boîte qui parle n'est pas l'enfant, c'est le parent. Je suis "
               "le parent flex, et c'est moi qui place mes enfants. Le CSS le dit : display flex, "
               "un gap de dix pixels, justify-content flex-start, align-items stretch et une "
               "hauteur de deux cent vingt pixels. Mes trois enfants n'ont besoin que d'une "
               "largeur : cent soixante-dix pixels, un padding de huit. Ils ne calculent plus "
               "rien, c'est moi qui décide. Le gap laisse un espace régulier, justify-content "
               "place le groupe horizontalement, align-items règle l'alignement vertical. Comparez "
               "avec la voisine : le même parent, mais en display block. Les enfants redeviennent "
               "de simples blocs, et ils s'empilent l'un sous l'autre. Voilà toute la différence : "
               "flex, c'est un parent qui range ses enfants en ligne. Et remarquez bien : aucun "
               "enfant n'a besoin de flex un, ni de flex-wrap. Les propriétés du programme "
               "suffisent.",
         etapes=[dict(f=0.06, x=760, y=200), dict(f=0.34, x=300, y=300),
                 dict(f=0.60, x=850, y=330), dict(f=0.82, x=860, y=560)]),

    dict(cle="float", ep=2, voix="c07.mp3", type="code", code=CODE_FLOAT,
         code_fenetre=(0.25, 0.60),
         pages=[dict(debut=0.0, url="tp-display.html", widgets=[], decor=decor_float)],
         texte="Deuxième partie : float. La boîte se présente : je suis float left, je me colle "
               "à gauche ; et ma voisine : je suis float right, je me colle à droite. Le CSS "
               "décrit les deux : float left avec une largeur de cent cinquante et une hauteur de "
               "cent, une marge à droite pour respirer ; puis float right avec la marge de l'autre "
               "côté. Le point clé, c'est que le flottant sort du flux normal : il ne pousse plus "
               "les blocs, il flotte. Alors le paragraphe qui suit coule autour de lui, comme "
               "l'eau autour d'une pierre. Regardez le texte, il commence à droite du flottant "
               "gauche, s'arrête à gauche du flottant droit, puis il reprend toute la largeur "
               "sous les deux boîtes. C'est exactement le comportement d'une image de journal. "
               "Comparez : à côté du flottant le texte se glisse, puis sous le flottant il "
               "reprend toute la place. Float sert à habiller une image, à faire un encadré, "
               "jamais à construire une grille : pour une grille, on utilise flex.",
         etapes=[dict(f=0.06, x=760, y=200), dict(f=0.34, x=300, y=300),
                 dict(f=0.62, x=860, y=330), dict(f=0.84, x=860, y=560)]),

    dict(cle="float_parent", ep=2, voix="c08.mp3", type="code", code=CODE_FLOAT_PARENT,
         code_fenetre=(0.25, 0.60),
         pages=[dict(debut=0.0, url="tp-display.html", widgets=[], decor=decor_float_parent)],
         texte="Voici le piège numéro un de float, celui qui coûte des points : le parent qui "
               "s'écrase. Écoutez le parent : je suis le parent, et mon enfant flottant m'échappe. "
               "Comme le flottant sort du flux, le parent ne le voit plus, donc il n'a plus de "
               "hauteur, et sa bordure se referme sur rien. Le CSS montre ce parent tout simple, "
               "avec une bordure rouge : hauteur zéro. Pour le remettre debout, deux solutions, "
               "et deux seulement au programme. Solution un : overflow hidden sur le parent, il "
               "enveloppe alors son enfant flottant. Solution deux : un élément vide avec clear "
               "both placé en dernier dans le parent ; il refuse d'être à côté du flottant, donc "
               "il descend, et le parent s'étire jusqu'à lui. Ces deux solutions font exactement "
               "le même travail : dégager la hauteur du parent. Choisissez-en une, et gardez la "
               "même dans toute la page.",
         etapes=[dict(f=0.06, x=770, y=220), dict(f=0.36, x=300, y=320),
                 dict(f=0.62, x=860, y=330), dict(f=0.84, x=880, y=420)]),

    dict(cle="relative", ep=3, voix="c09.mp3", type="code", code=CODE_POSITION_RELATIVE,
         code_fenetre=(0.25, 0.60),
         pages=[dict(debut=0.0, url="tp-display.html", widgets=[], decor=decor_position_relative)],
         texte="Troisième partie : position. Ici, la question n'est plus « quelle place sur la "
               "ligne », mais « par rapport à quoi je me place ». Première valeur, static : c'est "
               "la valeur par défaut, je suis à ma place normale, et top et left sont ignorés. "
               "Puis la boîte relative se présente : je suis relative, je me décale depuis MA "
               "place. Le CSS le dit : position relative, top vingt pixels, left vingt pixels. "
               "Regardez bien ce qui se passe : la boîte descend et glisse vers la droite, mais "
               "sa place d'origine reste réservée, en pointillés. Ses voisines n'ont pas bougé "
               "d'un pixel. C'est la grande différence avec absolute : relative décale le "
               "dessin, pas le flux. On s'en sert pour décaler légèrement un badge, un label, ou "
               "pour créer un repère de positionnement pour un enfant absolute. Comparez : deux "
               "static sont alignées, la relative est décalée et sa place reste occupée.",
         etapes=[dict(f=0.06, x=760, y=200), dict(f=0.36, x=300, y=300),
                 dict(f=0.64, x=860, y=330), dict(f=0.86, x=850, y=560)]),

    dict(cle="absolute", ep=3, voix="c10.mp3", type="code", code=CODE_POSITION_ABSOLUTE,
         code_fenetre=(0.25, 0.60),
         pages=[dict(debut=0.0, url="tp-display.html", widgets=[], decor=decor_position_absolute)],
         texte="Deuxième valeur, et la plus puissante : absolute. La boîte parle : je suis "
               "absolute, je sors du flux et je me cale sur mon repère. Mais quel repère ? Le "
               "premier ancêtre qui a lui aussi une position, sinon la page elle-même. Le CSS "
               "montre le cas normal : la zone est en position relative, elle sert de repère, et "
               "la boîte absolute se place en haut à droite avec top dix et right dix. Elle sort "
               "du flux : sa place n'est pas réservée, les autres éléments se comportent comme si "
               "elle n'existait pas. Deuxième cas, à droite : le parent immédiat est static. "
               "Comme un parent static n'est pas un repère, la boîte absolute remonte jusqu'au "
               "grand-parent, qui lui est relative. Retenez la règle : absolute cherche un "
               "ancêtre positionné. C'est pour cela qu'on écrit presque toujours position "
               "relative sur le parent, et position absolute sur l'enfant.",
         etapes=[dict(f=0.06, x=760, y=200), dict(f=0.34, x=300, y=300),
                 dict(f=0.62, x=860, y=330), dict(f=0.86, x=850, y=560)]),

    dict(cle="fixed_sticky", ep=3, voix="c11.mp3", type="code", code=CODE_FIXED_STICKY,
         code_fenetre=(0.25, 0.60),
         pages=[dict(debut=0.0, url="tp-display.html", widgets=[], decor=decor_fixed_sticky)],
         texte="Il reste deux valeurs, et elles se comparent très bien. La première parle : je "
               "suis fixed, je reste collé à la fenêtre du navigateur, même quand la page défile. "
               "Le CSS : position fixed, bottom douze, right douze. Son repère, c'est la fenêtre, "
               "pas la page : c'est le fameux bandeau publicitaire, ou le bouton d'aide qui reste "
               "en bas à droite. La seconde répond : moi, je suis sticky, je défile avec mon "
               "conteneur, puis je me fige quand j'atteins le seuil. Position sticky, top zéro. "
               "Tant que la zone défile, le bandeau jaune reste en haut de la zone ; si l'on "
               "sort de la zone, il repart. Attention au piège : sans top, sticky ne se fige "
               "jamais, et si le parent a un overflow caché, sticky ne fonctionne plus. Les trois "
               "boîtes, fixed, absolute et sticky, sortent du flux ; seule relative garde sa "
               "place. Avec ces trois TP, vous avez maintenant les trois familles de la mise en "
               "page CSS. Bon courage, et à bientôt sur la plateforme.",
         etapes=[dict(f=0.06, x=760, y=200), dict(f=0.34, x=300, y=300),
                 dict(f=0.66, x=860, y=330), dict(f=0.88, x=850, y=560)]),

    dict(cle="fin", ep=None, voix=None, type="fin",
         titre="Fin du TP — display, float et position",
         lignes=["display : inline · block · inline-block · flex",
                 "float : sortir du flux, clear pour se dégager",
                 "position : relative · absolute · fixed · sticky"],
         pied="STI By A'e — Lycée Rafèha",
         duree=12),
]

# Aucune des trois propriétés bannies ne doit apparaître dans le CSS montré.
_INTERDITS = ("flex: 1", "flex:1", "flex-wrap", "::after")
for _scene in SCENES:
    _code = _scene.get("code") or ""
    for _mot in _INTERDITS:
        assert _mot not in _code, "CSS interdit dans %s : %s" % (_scene.get("cle"), _mot)
