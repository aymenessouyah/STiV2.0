"""Capsule 4 — TP « transitions et animations » (CSS3).

Même moteur et même habillage que les trois capsules précédentes : éditeur à
gauche, page à droite, bulles d'explication, sous-titres et cartons.

Trois épisodes :
  1. les transitions (`:hover`, durée, retard, temporisation)  → exercice 1, partie A ;
  2. les animations (`@keyframes`, `infinite`, `alternate`)     → exercice 1, parties B et C ;
  3. le menu à trois niveaux (`float`, `position`, `visibility`) → exercice 2.

Contraintes du TP respectées dans le CSS montré : pas de `display: flex`,
pas de pseudo-éléments `::before` / `::after`.
"""
import math

from PIL import ImageDraw

import lib as R
from scenes_display import (ENCRE, GRIS, GRIS_CLAIR, FOND_DEMO, _boite, _comparaison,
                            _contenu, _mini_ligne, _parle, _pointilles, _puce)

# ------------------------------------------------------------------ le CSS
CODE_STRUCTURE = """<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>TP1 - transitions</title>
  <link rel="stylesheet" href="style1.css">
</head>
<body>
  <h1>Transitions et animations</h1>
  <button class="btn">Cliquez-moi</button>
  <div class="carte">Je me soulève</div>

  <div class="cercle"></div>
  <div class="loader"></div>
  <div class="balle"></div>
</body>
</html>"""

CODE_BTN = """.btn {
  background: #2980b9;
  color: #fff;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  transition: background 0.4s ease-in-out,
              transform 0.4s ease,
              box-shadow 0.4s ease;
}

.btn:hover {
  background: #e67e22;
  transform: scale(1.1);
  box-shadow: 0 6px 12px rgba(0,0,0,.3);
}"""

CODE_CARTE = """.carte {
  width: 220px;
  margin: 30px auto;
  padding: 20px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,.2);
  transition: transform 0.3s linear,
              box-shadow 0.3s linear;
  transition-delay: 0.1s;
}

.carte:hover {
  transform: translateY(-10px);
  box-shadow: 0 12px 20px rgba(0,0,0,.35);
}"""

CODE_TEMPO = """/* même durée, trois vitesses */
.tempo {
  transition-property: transform, background;
  transition-duration: 1s;
}
.tempo--ease:hover {
  transition-timing-function: ease;
}
.tempo--linear:hover {
  transition-timing-function: linear;
}
.tempo--inout:hover {
  transition-timing-function: ease-in-out;
}

/* et l'attente avant de démarrer */
.carte { transition-delay: 0.1s; }"""

CODE_PULSE = """@keyframes pulse {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.cercle {
  width: 100px;
  height: 100px;
  margin: 40px auto;
  border-radius: 50%;
  background: #27ae60;
  animation: pulse 1.5s ease-in-out infinite;
}"""

CODE_LOADER = """@keyframes tourne {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.loader {
  width: 60px;
  height: 60px;
  margin: 40px auto;
  background: #8e44ad;
  animation: tourne 1.2s linear infinite;
}"""

CODE_FONDU = """@keyframes fondu {
  from { opacity: 0; }
  to   { opacity: 1; }
}
h1 { animation: fondu 2s ease; }

@keyframes rebond {
  from { transform: translateY(0); }
  to   { transform: translateY(-70px); }
}
.balle {
  width: 40px; height: 40px;
  border-radius: 50%;
  background: #c0392b;
  animation: rebond 0.6s ease-in infinite alternate;
}"""

CODE_MENU = """/* Exercice 2 : menu en float, hauteur fixe */
nav { height: 50px; background: #2c3e50; }
.menu { list-style: none; margin: 0; padding: 0; }
.menu > li {
  float: left;
  position: relative;
}
nav a {
  display: block;
  padding: 15px 22px;
  color: #ecf0f1;
  text-decoration: none;
  transition: background 0.3s ease,
              border-color 0.3s ease;
}
nav a:hover { background: #e67e22; }
.menu > li > a {
  border-bottom: 3px solid transparent;
}
.menu > li > a:hover {
  border-bottom-color: #f1c40f;
}"""

CODE_SOUS_MENU = """.sous-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 190px;
  background: #34495e;
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  transition: opacity .3s ease,
              transform .3s ease,
              visibility .3s;
}
li:hover > .sous-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

/* niveau 3 : à droite, en @keyframes */
.sous-menu .sous-menu { top: 0; left: 100%; }
.sous-menu li:hover > .sous-menu {
  animation: glisse 0.4s ease;
}
@keyframes glisse {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}"""

CARTONS = {
    "sous_titre": "TP animé — transitions et animations",
    "fichier": "style1.css",
    "url": "tp1/index.html",
}

# ------------------------------------------------------------------ couleurs
BLEU_BTN = (41, 128, 185)
ORANGE_BTN = (230, 126, 34)
VERT = (39, 174, 96)
VIOLET = (142, 68, 173)
ROUGE = (192, 57, 43)
ENCRE_MENU = (44, 62, 80)
ENCRE_SOUS = (52, 73, 94)


# ------------------------------------------------------------------ outils
def _fondu(couleur_a, couleur_b, k):
    k = min(1.0, max(0.0, k))
    return tuple(int(a + (b - a) * k) for a, b in zip(couleur_a, couleur_b))


def _bezier(x1, y1, x2, y2, n=200):
    """Table d'échantillons de la courbe cubic-bezier, pour animer comme le navigateur."""
    points = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        x = 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3
        y = 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3
        points.append((x, y))
    return points


_TEMPOS = {
    "ease": _bezier(0.25, 0.1, 0.25, 1.0),
    "linear": _bezier(0.0, 0.0, 1.0, 1.0),
    "ease-in-out": _bezier(0.42, 0.0, 0.58, 1.0),
}


def _avance(nom, x):
    """Rend l'abscisse d'avancement (0→1) que donnerait la temporisation nommée."""
    table = _TEMPOS[nom]
    x = min(1.0, max(0.0, x))
    for (xa, ya), (xb, yb) in zip(table, table[1:]):
        if xa <= x <= xb:
            if xb == xa:
                return yb
            return ya + (yb - ya) * (x - xa) / (xb - xa)
    return table[-1][1]


def _titre_demo(im, d, box, texte, sous=None):
    x, y, xd, _ = _contenu(box)
    d.text((x, y), texte, font=R.police(R.POLICE_B, 13), fill=R.BLEU_TP)
    if sous:
        d.text((x, y + 20), sous, font=R.police(R.POLICE, 11), fill=GRIS)
    return x, y, xd


def _cadre_demo(d, x, y, w, h, titre=None):
    d.rounded_rectangle([x, y, x + w, y + h], radius=8, fill=(255, 255, 255),
                        outline=GRIS_CLAIR, width=1)
    if titre:
        d.text((x + 10, y + 6), titre, font=R.police(R.POLICE_B, 10), fill=GRIS)


def _mesure(d, texte, police):
    return d.textlength(texte, font=police)


# ------------------------------------------------------------------ décors
def decor_regles(im, d, box, p, e):
    x, y, xd = _titre_demo(im, d, box, "Deux familles de mouvement : transition et animation",
                           "la même page, deux déclencheurs différents")
    g = R.police(R.POLICE_B, 12)
    n = R.police(R.POLICE, 11)

    _cadre_demo(d, x, y + 44, 244, 150, "transition")
    d.text((x + 12, y + 70), "réagit à un état", font=g, fill=BLEU_BTN)
    d.text((x + 12, y + 90), "au survol, au focus", font=n, fill=ENCRE)
    d.text((x + 12, y + 108), "départ → arrivée", font=n, fill=ENCRE)
    d.text((x + 12, y + 126), "revient en arrière", font=n, fill=ENCRE)
    d.text((x + 12, y + 144), "au relâchement", font=n, fill=ENCRE)
    k = 0.5 + 0.5 * math.sin(e.temps * 2.0)
    d.rounded_rectangle([x + 12, y + 162, x + 100 + int(40 * k), y + 186], radius=5,
                        fill=_fondu(BLEU_BTN, ORANGE_BTN, k), outline=(20, 60, 90))

    _cadre_demo(d, x + 262, y + 44, 244, 150, "animation")
    d.text((x + 274, y + 70), "se joue toute seule", font=g, fill=VIOLET)
    d.text((x + 274, y + 90), "au chargement", font=n, fill=ENCRE)
    d.text((x + 274, y + 108), "plusieurs étapes", font=n, fill=ENCRE)
    d.text((x + 274, y + 126), "0 % · 50 % · 100 %", font=n, fill=ENCRE)
    d.text((x + 274, y + 144), "infinite, alternate", font=n, fill=ENCRE)
    r = 11 + 6 * (0.5 + 0.5 * math.sin(e.temps * 4.0))
    d.ellipse([x + 274 + 18 - r, y + 172 - r, x + 274 + 18 + r, y + 172 + r], fill=VERT)

    if p > 0.30:
        _puce(im, d, x, y + 214, "transition : elle a besoin d'un changement d'état.",
              BLEU_BTN)
        _puce(im, d, x, y + 238, "animation : elle démarre seule et peut tourner sans fin.",
              VIOLET)
        _puce(im, d, x, y + 262, "Dans les deux cas, la propriété transform fait le mouvement.")
        _puce(im, d, x, y + 286, "Aucun display: flex, aucun ::after dans ce TP.",
              (200, 90, 60))

    if p > 0.62:
        def g(im2, d2, gx, gy):
            _mini_ligne(im2, d2, gx, gy, BLEU_BTN, 84, "survol")
            _mini_ligne(im2, d2, gx + 92, gy, ORANGE_BTN, 84, "survol")
            d2.text((gx, gy + 28), "elle part et revient", font=R.police(R.POLICE, 10),
                    fill=GRIS)
        def dr(im2, d2, gx, gy):
            for i in range(3):
                _mini_ligne(im2, d2, gx + i * 34, gy + i * 4, VIOLET, 30, str(i + 1))
            d2.text((gx + 108, gy + 14), "elle tourne seule", font=R.police(R.POLICE, 10),
                    fill=GRIS)
        _comparaison(im, d, box, g, dr, "transition : à l'entrée de la souris",
                     "animation : au chargement")
    return {}


def decor_bouton(im, d, box, p, e):
    x, y, xd = _titre_demo(im, d, box, "A.1-2 · un bouton qui change d'état au survol",
                           "transition : background · transform · box-shadow, 0,4 s")
    phase = (e.temps / 2.6) % 1.0
    survol = 0.12 < phase < 0.72
    k = 0.0
    if survol:
        k = min(1.0, (phase - 0.12) / 0.18) if phase < 0.30 else (
            1.0 if phase < 0.60 else max(0.0, (0.72 - phase) / 0.12))
    k = _avance("ease", k)

    _cadre_demo(d, x, y + 44, 380, 168, "page du TP")
    cx, cy = x + 118, y + 108
    lw, lh = int(150 + 15 * k), int(46 + 5 * k)
    ombre = int(12 * k)
    if ombre:
        d.rounded_rectangle([cx - lw // 2 + 2, cy - lh // 2 + ombre // 2, cx + lw // 2 + 2,
                             cy + lh // 2 + ombre // 2], radius=8, fill=(214, 218, 226))
    d.rounded_rectangle([cx - lw // 2, cy - lh // 2, cx + lw // 2, cy + lh // 2], radius=8,
                        fill=_fondu(BLEU_BTN, ORANGE_BTN, k))
    d.text((cx, cy - 6), "Cliquez-moi", font=R.police(R.POLICE_B, 12), fill=(255, 255, 255),
           anchor="mm")
    d.text((x + 16, y + 176), ".btn" + ("   →   .btn:hover" if k > 0.35 else ""),
           font=R.police(R.MONO, 11), fill=(200, 90, 60) if k > 0.35 else GRIS)

    if p > 0.34:
        _cadre_demo(d, x + 398, y + 44, 108, 168, "valeurs")
        for i, (nom, val) in enumerate([("background", "#e67e22"), ("transform", "scale(1.1)"),
                                        ("box-shadow", "0 6px 12px")]):
            actif = k > 0.35
            d.text((x + 406, y + 70 + i * 44), nom, font=R.police(R.POLICE_B, 9),
                   fill=R.ORANGE if actif else GRIS)
            d.text((x + 406, y + 84 + i * 44), val, font=R.police(R.MONO, 9),
                   fill=ENCRE if actif else GRIS_CLAIR)

    if p > 0.44:
        _puce(im, d, x, y + 226, "La transition s'écrit sur .btn, l'état de base.", BLEU_BTN)
        _puce(im, d, x, y + 250, "Dans :hover, on ne met que l'état d'arrivée.")
        _puce(im, d, x, y + 274, "Écrite dans :hover, la transition n'aurait pas de retour.",
              (200, 90, 60))

    if p > 0.60:
        def g(im2, d2, gx, gy):
            _mini_ligne(im2, d2, gx, gy, BLEU_BTN, 84, ".btn")
            d2.text((gx, gy + 26), "état de base", font=R.police(R.POLICE, 10), fill=GRIS)
        def dr(im2, d2, gx, gy):
            _mini_ligne(im2, d2, gx, gy, ORANGE_BTN, 84, ".btn:hover")
            d2.text((gx, gy + 26), "état survolé", font=R.police(R.POLICE, 10), fill=GRIS)
        _comparaison(im, d, box, g, dr, "au repos", "au survol")
    return {}


def decor_carte(im, d, box, p, e):
    x, y, xd = _titre_demo(im, d, box, "A.3-4 · la carte qui se soulève, avec un retard",
                           "transition-delay : 0,1 s avant de démarrer")
    phase = (e.temps / 3.0) % 1.0
    actif = 0.10 < phase < 0.78
    k = 0.0
    if actif:
        local = (phase - 0.10) / 0.68
        # le retard de 0,1 s : rien ne bouge pendant les 12 premiers pour cent
        k = _avance("linear", max(0.0, (local - 0.12) / 0.80))
    else:
        k = 0.0
    if phase >= 0.78:
        k = max(0.0, 1.0 - (phase - 0.78) / 0.22)

    _cadre_demo(d, x, y + 44, 320, 190, "page du TP")
    cx = x + 160
    haut = y + 118 - int(22 * k)
    ombre = 3 + int(12 * k)
    d.ellipse([cx - 76, y + 218 - ombre // 2, cx + 76, y + 218 + ombre // 2],
              fill=(214, 218, 226))
    d.rounded_rectangle([cx - 96, haut - 34, cx + 96, haut + 34], radius=10, fill=(255, 255, 255),
                        outline=(220, 224, 232))
    d.text((cx, haut - 4), "Je me soulève", font=R.police(R.POLICE_B, 11), fill=ENCRE,
           anchor="mm")
    d.text((cx, haut + 14), "au survol", font=R.police(R.POLICE, 10), fill=GRIS, anchor="mm")
    if k > 0.3:
        d.text((cx, y + 60), "translateY(-10px)", font=R.police(R.MONO, 10), fill=R.ORANGE,
               anchor="mm")

    # la ligne de temps : retard puis mouvement
    tx, ty, tw = x + 8, y + 250, 300
    d.line([(tx, ty), (tx + tw, ty)], fill=GRIS_CLAIR, width=2)
    d.line([(tx, ty), (tx + int(tw * 0.12), ty)], fill=R.ORANGE, width=4)
    d.line([(tx + int(tw * 0.12), ty), (tx + int(tw * 0.12 + tw * 0.8 * k), ty)],
           fill=BLEU_BTN, width=4)
    d.text((tx, ty + 8), "retard 0,1 s", font=R.police(R.POLICE, 9), fill=R.ORANGE)
    d.text((tx + int(tw * 0.30), ty + 8), "mouvement 0,3 s", font=R.police(R.POLICE, 9),
           fill=BLEU_BTN)

    if p > 0.40:
        _cadre_demo(d, x + 338, y + 44, 168, 190, "au survol")
        d.text((x + 348, y + 68), "transform :", font=R.police(R.POLICE, 10), fill=GRIS)
        d.text((x + 348, y + 84), "translateY(-10px)", font=R.police(R.MONO, 10), fill=ENCRE)
        d.text((x + 348, y + 108), "box-shadow :", font=R.police(R.POLICE, 10), fill=GRIS)
        d.text((x + 348, y + 124), "0 12px 20px", font=R.police(R.MONO, 10), fill=ENCRE)
        d.text((x + 348, y + 148), "linear, pas de", font=R.police(R.POLICE, 10), fill=GRIS)
        d.text((x + 348, y + 162), "ralenti aux bouts", font=R.police(R.POLICE, 10), fill=GRIS)
        d.text((x + 348, y + 194), "L'ombre s'agrandit", font=R.police(R.POLICE, 10), fill=GRIS)
        d.text((x + 348, y + 208), "en même temps.", font=R.police(R.POLICE, 10), fill=GRIS)

    if p > 0.46:
        _puce(im, d, x, y + 286, "translateY(-10px) : la carte monte de dix pixels.", BLEU_BTN)
        _puce(im, d, x, y + 308, "transition-delay décale le départ, pas la durée.", R.ORANGE)

    if p > 0.66:
        def g(im2, d2, gx, gy):
            d2.line([(gx, gy + 44), (gx + 150, gy + 44)], fill=GRIS_CLAIR, width=1)
            d2.line([(gx, gy + 44), (gx + 20, gy + 44)], fill=R.ORANGE, width=4)
            d2.rounded_rectangle([gx + 20, gy + 8, gx + 96, gy + 40], radius=6,
                                 fill=(255, 255, 255), outline=(220, 224, 232))
            d2.text((gx, gy + 50), "0,1 s d'attente", font=R.police(R.POLICE, 10), fill=GRIS)
        def dr(im2, d2, gx, gy):
            d2.line([(gx, gy + 44), (gx + 150, gy + 44)], fill=GRIS_CLAIR, width=1)
            d2.line([(gx, gy + 44), (gx + 96, gy + 44)], fill=BLEU_BTN, width=4)
            d2.rounded_rectangle([gx, gy + 8, gx + 76, gy + 40], radius=6,
                                 fill=(255, 255, 255), outline=(220, 224, 232))
            d2.text((gx, gy + 50), "départ immédiat", font=R.police(R.POLICE, 10), fill=GRIS)
        _comparaison(im, d, box, g, dr, "avec transition-delay", "sans retard")
    return {}


def decor_temporisation(im, d, box, p, e):
    x, y, xd = _titre_demo(im, d, box, "A.4 · même durée, trois vitesses",
                           "ease, linear et ease-in-out : la courbe change tout")
    phase = (e.temps / 3.4) % 1.0
    if phase < 0.18:
        q = 0.0
    elif phase < 0.55:
        q = (phase - 0.18) / 0.30
    elif phase < 0.64:
        q = 1.0
    else:
        q = max(0.0, 1.0 - (phase - 0.64) / 0.30)
    q = min(1.0, q)

    pistes = [("ease", "doux puis rapide", BLEU_BTN),
              ("linear", "vitesse constante", VERT),
              ("ease-in-out", "lent, rapide, lent", VIOLET)]
    for i, (nom, commentaire, couleur) in enumerate(pistes):
        yy = y + 56 + i * 66
        _cadre_demo(d, x, yy, 330, 52)
        d.text((x + 10, yy + 6), nom, font=R.police(R.MONO_B, 10), fill=couleur)
        d.text((x + 10, yy + 22), commentaire, font=R.police(R.POLICE, 9), fill=GRIS)
        d.line([(x + 10, yy + 44), (x + 318, yy + 44)], fill=GRIS_CLAIR, width=1)
        bx = x + 12 + int(_avance(nom, q) * 250)
        d.rounded_rectangle([bx, yy + 6, bx + 56, yy + 30], radius=5, fill=couleur)
        d.text((bx + 28, yy + 18), "▮▮", font=R.police(R.POLICE, 9), fill=(255, 255, 255),
               anchor="mm")

    if p > 0.34:
        _cadre_demo(d, x + 346, y + 56, 158, 158, "la courbe")
        gx, gy, gw, gh = x + 362, y + 80, 120, 118
        d.rectangle([gx, gy, gx + gw, gy + gh], outline=GRIS_CLAIR)
        for nom, couleur in (("linear", VERT), ("ease", BLEU_BTN), ("ease-in-out", VIOLET)):
            pts = [(gx + xx * gw, gy + gh - yy * gh) for xx, yy in _TEMPOS[nom]][::6]
            d.line(pts, fill=couleur, width=2)
        d.text((gx, gy + gh + 4), "temps →", font=R.police(R.POLICE, 9), fill=GRIS)

    if p > 0.46:
        _puce(im, d, x, y + 258, "Durée identique : seule la répartition de la vitesse change.",
              BLEU_BTN)
        _puce(im, d, x, y + 282, "linear pour une rotation, ease pour un survol.", VERT)
        _puce(im, d, x, y + 306, "ease-in-out pour un aller-retour naturel.", VIOLET)

    if p > 0.72:
        def g(im2, d2, gx, gy):
            for i in range(8):
                d2.ellipse([gx + i * 18, gy + 22, gx + i * 18 + 8, gy + 30], fill=VERT)
            d2.text((gx, gy + 40), "une bille tous les 10 px", font=R.police(R.POLICE, 10),
                    fill=GRIS)
        def dr(im2, d2, gx, gy):
            for i, k in enumerate((0, 3, 9, 16, 22, 27, 31, 33)):
                d2.ellipse([gx + int(k * 4.2), gy + 22, gx + int(k * 4.2) + 8, gy + 30],
                           fill=BLEU_BTN)
            d2.text((gx, gy + 40), "serrées puis espacées", font=R.police(R.POLICE, 10),
                    fill=GRIS)
        _comparaison(im, d, box, g, dr, "linear : espacement régulier", "ease : le rythme change")
    return {}


def decor_pulse(im, d, box, p, e):
    x, y, xd = _titre_demo(im, d, box, "B.1 · @keyframes pulse — le cercle qui respire",
                           "animation: pulse 1.5s ease-in-out infinite")
    _cadre_demo(d, x, y + 44, 268, 200, "page du TP")
    cx, cy = x + 134, y + 150
    phase = (e.temps / 1.5) % 1.0
    if phase < 0.5:
        k = _avance("ease-in-out", phase / 0.5)
    else:
        k = _avance("ease-in-out", (1.0 - phase) / 0.5)
    r = 48 * (1 + 0.30 * k)
    _pointilles(d, cx - 48, cy - 48, 96, 96, GRIS_CLAIR, pas=7, trait=4, epaisseur=1)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=VERT)
    d.text((cx, cy), "scale", font=R.police(R.POLICE_B, 11), fill=(255, 255, 255), anchor="mm")
    d.text((cx, y + 218), "0 % → 50 % → 100 %", font=R.police(R.MONO, 10), fill=GRIS,
           anchor="mm")

    if p > 0.36:
        _cadre_demo(d, x + 286, y + 44, 220, 120, "@keyframes pulse")
        for i, (pct, val) in enumerate([("0 %", "scale(1)"), ("50 %", "scale(1.3)"),
                                        ("100 %", "scale(1)")]):
            d.text((x + 296, y + 70 + i * 24), pct, font=R.police(R.MONO, 10), fill=R.ORANGE)
            d.text((x + 344, y + 70 + i * 24), val, font=R.police(R.MONO, 10), fill=ENCRE)
        _cadre_demo(d, x + 286, y + 176, 220, 68, "dans la règle")
        d.text((x + 296, y + 200), "animation: pulse", font=R.police(R.MONO, 10), fill=ENCRE)
        d.text((x + 296, y + 216), "1.5s ease-in-out infinite", font=R.police(R.MONO, 10),
               fill=ENCRE)

    if p > 0.46:
        _puce(im, d, x, y + 262, "Le nom des @keyframes doit être repris par animation.", VIOLET)
        _puce(im, d, x, y + 286, "infinite : la boucle ne s'arrête jamais.")
        _puce(im, d, x, y + 310, "0 % et 100 % identiques : aucun saut visible.", VERT)

    if p > 0.60:
        _cadre_demo(d, x, y + 252, 506, 96, "la boucle infinite, image par image")
        base = y + 320
        for i in range(9):
            k = (i % 4) / 3.0
            k = k if k <= 1 else 1
            r = 4 + int(9 * (0.5 - 0.5 * math.cos(math.pi * 2 * i / 8.0)) * 0.8)
            cx = x + 30 + i * 55
            d.ellipse([cx - r, base - r, cx + r, base + r], fill=VERT)
            d.text((cx, base + 22), "%d" % int(1.5 * i / 4), font=R.police(R.MONO, 9),
                   fill=GRIS, anchor="mm")
        d.text((x + 10, base - 46), "1.5 s par cycle · 0 % → 50 % → 100 % → 0 %…",
               font=R.police(R.POLICE, 10), fill=GRIS)

    if p > 0.88:
        def g(im2, d2, gx, gy):
            d2.ellipse([gx + 6, gy + 4, gx + 38, gy + 36], fill=VERT, outline=(20, 120, 60))
            d2.text((gx, gy + 44), "l'animation boucle", font=R.police(R.POLICE, 10), fill=GRIS)
        def dr(im2, d2, gx, gy):
            d2.ellipse([gx + 14, gy + 12, gx + 30, gy + 28], fill=VERT, outline=(20, 120, 60))
            d2.text((gx, gy + 44), "sans infinite : un tour", font=R.police(R.POLICE, 10),
                    fill=GRIS)
        _comparaison(im, d, box, g, dr, "infinite", "sans infinite")
    return {}


def decor_loader(im, d, box, p, e):
    x, y, xd = _titre_demo(im, d, box, "B.2 · le loader qui tourne à l'infini",
                           "animation: tourne 1.2s linear infinite")
    _cadre_demo(d, x, y + 44, 250, 200, "page du TP")
    cx, cy = x + 125, y + 148
    angle = 360.0 * ((e.temps / 1.2) % 1.0)
    _pointilles(d, cx - 46, cy - 46, 92, 92, GRIS_CLAIR, pas=7, trait=4, epaisseur=1)
    cote = 32
    pts = []
    for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        ox, oy = sx * cote, sy * cote
        a = math.radians(angle)
        pts.append((cx + ox * math.cos(a) - oy * math.sin(a),
                    cy + ox * math.sin(a) + oy * math.cos(a)))
    d.polygon(pts, fill=VIOLET)
    d.line([pts[0], pts[2]], fill=(212, 178, 232), width=2)
    d.line([pts[1], pts[3]], fill=(212, 178, 232), width=2)
    d.text((cx, y + 218), "%d°" % int(angle), font=R.police(R.MONO, 10), fill=GRIS, anchor="mm")

    if p > 0.34:
        _cadre_demo(d, x + 268, y + 44, 200, 118, "@keyframes tourne")
        d.text((x + 278, y + 70), "from {", font=R.police(R.MONO, 10), fill=R.ORANGE)
        d.text((x + 290, y + 86), "rotate(0deg)", font=R.police(R.MONO, 10), fill=ENCRE)
        d.text((x + 278, y + 102), "}", font=R.police(R.MONO, 10), fill=R.ORANGE)
        d.text((x + 278, y + 124), "to { rotate(360deg) }", font=R.police(R.MONO, 10), fill=ENCRE)
        _cadre_demo(d, x + 268, y + 174, 200, 70, "@keyframes = steps")
        d.text((x + 278, y + 198), "from / to", font=R.police(R.MONO, 10), fill=ENCRE)
        d.text((x + 278, y + 214), "= 0 % / 100 %", font=R.police(R.MONO, 10), fill=GRIS)

    if p > 0.46:
        _puce(im, d, x, y + 262, "Une rotation continue exige linear, sinon des à-coups.", VIOLET)
        _puce(im, d, x, y + 286, "1.2s : un tour complet, puis on recommence.")
        _puce(im, d, x, y + 310, "Sans infinite, le carré s'arrêterait à 360°.", R.ORANGE)
    return {}


def decor_fondu_balle(im, d, box, p, e):
    x, y, xd = _titre_demo(im, d, box, "B.3 et C · le texte en fondu, la balle qui rebondit",
                           "animation: fondu 2s  ·  rebond 0.6s infinite alternate")
    # ---- le fondu du titre
    _cadre_demo(d, x, y + 44, 240, 150, "B.3 · fondu")
    cycle = (e.temps / 6.0) % 1.0
    k = _avance("ease", min(1.0, cycle / 0.34))
    couleur = _fondu((247, 250, 254), R.BLEU_TP, k)
    d.text((x + 120, y + 110), "Transitions", font=R.police(R.POLICE_B, 15), fill=couleur,
           anchor="mm")
    d.text((x + 120, y + 132), "et animations", font=R.police(R.POLICE_B, 15), fill=couleur,
           anchor="mm")
    d.text((x + 120, y + 172), "opacity : %.2f" % k, font=R.police(R.MONO, 10), fill=GRIS,
           anchor="mm")

    # ---- la balle qui rebondit
    _cadre_demo(d, x + 258, y + 44, 250, 150, "C · rebond, alternate")
    phase = (e.temps / 1.2) % 1.0
    jambe = 2 * phase if phase < 0.5 else 2 * (1 - phase)
    h = 70 * _avance("ease", jambe)
    sol = y + 168
    d.line([(x + 270, sol), (x + 496, sol)], fill=GRIS_CLAIR, width=2)
    d.ellipse([x + 383 - 12, sol - 4, x + 383 + 12, sol + 4], fill=(226, 230, 236))
    d.ellipse([x + 383 - 14, sol - 14 - int(h) - 12, x + 383 + 14, sol - 14 - int(h) + 16],
              fill=ROUGE)
    for seuil in (0, 25, 50):
        d.line([(x + 262, sol - seuil), (x + 268, sol - seuil)], fill=GRIS_CLAIR, width=1)

    if p > 0.30:
        _cadre_demo(d, x, y + 206, 508, 88, "les deux animations")
        d.text((x + 10, y + 230), "h1     → animation: fondu 2s ease;", font=R.police(R.MONO, 11),
               fill=ENCRE)
        d.text((x + 10, y + 250), ".balle → animation: rebond .6s ease-in infinite alternate;",
               font=R.police(R.MONO, 11), fill=ENCRE)
        d.text((x + 10, y + 274), "alternate = aller puis retour, sans saut au sol.",
               font=R.police(R.POLICE, 10), fill=GRIS)

    if p > 0.52:
        _puce(im, d, x, y + 312, "fondu : sans infinite, une seule apparition.", BLEU_BTN)
        _puce(im, d, x + 262, y + 312, "rebond : alternate permet la remontée.", R.ORANGE)
    return {}


def decor_menu_float(im, d, box, p, e):
    x, y, xd = _titre_demo(im, d, box, "Exercice 2 · un menu horizontal, en float",
                           "nav à hauteur fixe, li en float: left, position: relative")
    _cadre_demo(d, x, y + 44, 508, 104, "navigateur")
    entrees = ["Accueil", "Cours  ▾", "Exercices  ▾", "Contact"]
    survol = int((e.temps / 2.4) % 4)
    bx = x + 6
    for i, nom in enumerate(entrees):
        police = R.police(R.POLICE_B, 11)
        largeur = int(_mesure(d, nom, police)) + 34
        actif = i == survol and 0.15 < (e.temps / 2.4) % 1.0 < 0.85
        d.rectangle([bx, y + 72, bx + largeur, y + 118],
                    fill=ORANGE_BTN if actif else ENCRE_MENU)
        if actif:
            d.line([(bx, y + 115), (bx + largeur, y + 115)], fill=(241, 196, 15), width=3)
        d.text((bx + 17, y + 90), nom, font=police, fill=(236, 240, 241))
        bx += largeur
    d.text((x + 6, y + 146), "nav { height: 50px; }", font=R.police(R.MONO, 10), fill=GRIS)
    d.text((x + 6, y + 164), "chaque li flotte : les entrées se placent côte à côte,",
           font=R.police(R.POLICE, 10), fill=ENCRE)
    d.text((x + 6, y + 180), "et le nav garde sa hauteur, sinon il s'écrase.", font=R.police(R.POLICE, 10),
           fill=ENCRE)

    if p > 0.36:
        _cadre_demo(d, x, y + 204, 250, 96, "pourquoi une hauteur fixe ?")
        d.text((x + 10, y + 228), "Les flottants sortent du flux :", font=R.police(R.POLICE, 10),
               fill=ENCRE)
        d.text((x + 10, y + 244), "sans height, le nav mesure 0 px", font=R.police(R.POLICE, 10),
               fill=(200, 90, 60))
        d.text((x + 10, y + 260), "et le menu suivant passe dessous.", font=R.police(R.POLICE, 10),
               fill=ENCRE)
        d.text((x + 10, y + 280), "50px = la hauteur d'un lien.", font=R.police(R.POLICE, 10),
               fill=GRIS)
        _cadre_demo(d, x + 262, y + 204, 246, 96, "position: relative")
        d.text((x + 272, y + 228), "Chaque li est le repère", font=R.police(R.POLICE, 10),
               fill=ENCRE)
        d.text((x + 272, y + 244), "de son sous-menu :", font=R.police(R.POLICE, 10), fill=ENCRE)
        d.text((x + 272, y + 262), "absolute se cale sur lui,", font=R.police(R.POLICE, 10),
               fill=BLEU_BTN)
        d.text((x + 272, y + 278), "pas sur la page.", font=R.police(R.POLICE, 10), fill=BLEU_BTN)

    if p > 0.62:
        _puce(im, d, x, y + 314, "float remplace ici display: flex, interdit dans ce TP.", BLEU_BTN)
    return {}


def decor_menu_sous(im, d, box, p, e):
    x, y, xd = _titre_demo(im, d, box, "C et D · les sous-menus animés, niveau 2 puis niveau 3",
                           "opacity + visibility pour le niveau 2, @keyframes pour le niveau 3")
    cycle = (e.temps / 5.2) % 1.0
    # 0.05 → 0.45 : ouverture du niveau 2 · 0.50 → 0.85 : niveau 3
    k2 = 0.0
    if 0.05 < cycle < 0.45:
        k2 = _avance("ease", (cycle - 0.05) / 0.14) if cycle < 0.19 else 1.0
    elif 0.45 <= cycle < 0.90:
        k2 = 1.0
    elif cycle >= 0.90:
        k2 = max(0.0, 1 - (cycle - 0.90) / 0.10)
    k3 = 0.0
    if 0.52 < cycle < 0.86:
        k3 = _avance("ease", min(1.0, (cycle - 0.52) / 0.10))

    _cadre_demo(d, x, y + 44, 508, 70, "menu principal")
    entrees = ["Accueil", "Cours  ▾", "Exercices  ▾", "Contact"]
    bx = x + 6
    for i, nom in enumerate(entrees):
        police = R.police(R.POLICE_B, 11)
        largeur = int(_mesure(d, nom, police)) + 30
        actif = i == 1
        d.rectangle([bx, y + 66, bx + largeur, y + 102], fill=ORANGE_BTN if actif else ENCRE_MENU)
        d.text((bx + 15, y + 80), nom, font=police, fill=(236, 240, 241))
        if actif:
            d.text((bx + largeur - 16, y + 80), "▾" if k2 < 0.6 else "▴",
                   font=R.police(R.POLICE, 10), fill=(241, 196, 15))
            d.line([(bx, y + 99), (bx + largeur, y + 99)], fill=(241, 196, 15), width=3)
        bx += largeur

    # niveau 2
    sx, sy = x + 118, y + 102 + int(10 * (1 - k2))
    if k2 > 0.02:
        couche = _fondu(FOND_DEMO, ENCRE_SOUS, min(1.0, k2 * 1.6))
        d.rectangle([sx, sy, sx + 190, sy + 78], fill=couche)
        teinte = _fondu(ENCRE_SOUS, (236, 240, 241), min(1.0, k2 * 1.8))
        for i, nom in enumerate(["HTML5", "CSS3  ▸", "JavaScript"]):
            d.text((sx + 12, sy + 10 + i * 22), nom, font=R.police(R.POLICE, 10), fill=teinte)
        # niveau 3
        if k3 > 0.02:
            nx = sx + 190 - int(20 * (1 - k3))
            nw = 150
            couche3 = _fondu(ENCRE_SOUS, (44, 62, 80), min(1.0, k3 * 1.6))
            d.rectangle([nx, sy + 20, nx + nw, sy + 86], fill=couche3)
            teinte3 = _fondu(ENCRE_SOUS, (250, 250, 252), min(1.0, k3 * 1.8))
            for i, nom in enumerate(["Sélecteurs", "Float et position", "Transitions"]):
                d.text((nx + 10, sy + 28 + i * 20), nom, font=R.police(R.POLICE, 9), fill=teinte3)

    d.text((x + 6, y + 190), "%s" % ("opacity: 1 · visibility: visible" if k2 > 0.5 else
                                     "opacity: 0 · visibility: hidden"),
           font=R.police(R.MONO, 10), fill=BLEU_BTN if k2 > 0.5 else GRIS)
    d.text((x + 6, y + 208), "translateY(10px) → translateY(0)", font=R.police(R.MONO, 10),
           fill=BLEU_BTN if k2 > 0.5 else GRIS)

    if p > 0.40:
        _cadre_demo(d, x, y + 232, 250, 96, "ne pas utiliser display: none")
        d.text((x + 10, y + 258), "display: none → pas d'animation", font=R.police(R.POLICE, 10),
               fill=(200, 90, 60))
        d.text((x + 10, y + 276), "opacity + visibility →", font=R.police(R.POLICE, 10),
               fill=VERT)
        d.text((x + 10, y + 292), "invisible mais animable, et", font=R.police(R.POLICE, 10),
               fill=ENCRE)
        d.text((x + 10, y + 308), "non cliquable quand caché.", font=R.police(R.POLICE, 10),
               fill=ENCRE)
        _cadre_demo(d, x + 262, y + 232, 246, 96, "niveau 3 et flèche")
        d.text((x + 272, y + 258), "left: 100% · top: 0 → à droite", font=R.police(R.MONO, 9),
               fill=ENCRE)
        d.text((x + 272, y + 276), "@keyframes glisse → fondu + glissement", font=R.police(R.MONO, 9),
               fill=ENCRE)
        d.text((x + 272, y + 296), "flèche : inline-block, sinon", font=R.police(R.POLICE, 10),
               fill=R.ORANGE)
        d.text((x + 272, y + 312), "rotate(180deg) ne fait rien.", font=R.police(R.POLICE, 10),
               fill=R.ORANGE)
    return {}


# ------------------------------------------------------------------ scènes
SCENES = [
    dict(cle="intro", ep=None, voix=None, type="intro",
         titre="TP animé — transitions et animations",
         episodes=[("ÉPISODE 1", "transition : réagir à un état (:hover)"),
                   ("ÉPISODE 2", "animation : @keyframes, infinite, alternate"),
                   ("ÉPISODE 3", "menu à trois niveaux : float, position, visibility")],
         duree=10),

    dict(cle="regles", ep=1, voix="d02.mp3", type="code", code=CODE_STRUCTURE,
         code_fenetre=(0.06, 0.46),
         pages=[dict(debut=0.0, url="tp1/index.html", widgets=[], decor=decor_regles)],
         texte="Bonjour et bienvenue dans ce quatrième TP animé, consacré cette fois au mouvement : "
               "les transitions et les animations. Le TP compte deux exercices, et nous allons les "
               "traiter dans l'ordre. À l'écran, à gauche, la page de l'exercice un : le doctype, la "
               "balise html en français, le head avec l'encodage et le titre, puis la feuille de "
               "style, style1.css, liée dans le head. Dans le body, cinq éléments seulement : un "
               "titre h1, un bouton avec la classe btn, une carte, puis trois boîtes vides qui "
               "serviront au cercle, au loader et à la balle. À droite, les deux familles du "
               "mouvement. La transition, en bleu, réagit à un état : elle part quand la souris "
               "entre, et elle revient quand la souris sort. L'animation, en violet, se joue toute "
               "seule, au chargement, sans que personne ne la déclenche. Retenez la différence, "
               "c'est la question de cours la plus fréquente : transition égale changement "
               "d'état ; animation égale déroulement automatique. Et remarquez bien les deux "
               "contraintes du TP : pas de display flex, et pas de pseudo-éléments after. Tout se "
               "fait avec les propriétés du programme.",
         etapes=[dict(f=0.08, x=300, y=140), dict(f=0.30, x=340, y=330),
                 dict(f=0.58, x=880, y=230), dict(f=0.82, x=1060, y=250)]),

    dict(cle="bouton", ep=1, voix="d03.mp3", type="code", code=CODE_BTN,
         code_fenetre=(0.10, 0.48),
         pages=[dict(debut=0.0, url="tp1/index.html", widgets=[], decor=decor_bouton)],
         texte="Première règle, partie A : le bouton. Le CSS s'écrit en deux blocs, et l'ordre a "
               "une importance capitale. Bloc un, l'état de base, la classe btn : un fond bleu, un "
               "texte blanc, un padding de douze et vingt-quatre, pas de bordure, des coins "
               "arrondis, et surtout la ligne transition. Elle annonce trois propriétés animées, "
               "chacune sur quatre dixièmes de seconde : le fond, la transformation et l'ombre. "
               "Bloc deux, l'état d'arrivée, btn deux-points hover : le fond devient orange, la "
               "transformation passe à scale un virgule un, et l'ombre apparaît. Regardez l'écran : "
               "quand la souris entre, le bouton grossit, change de couleur et se décolle sur son "
               "ombre ; quand la souris sort, tout revient doucement. Pourquoi doucement ? Parce "
               "que la transition est déclarée sur l'état de base. Si vous l'écrivez dans le "
               "hover, l'aller serait animé mais le retour serait brutal, instantané. C'est "
               "l'erreur numéro un dans les copies. Une transition se déclare toujours sur l'état "
               "de repos.",
         etapes=[dict(f=0.08, x=300, y=200), dict(f=0.34, x=320, y=330),
                 dict(f=0.60, x=800, y=200), dict(f=0.84, x=880, y=230)]),

    dict(cle="carte", ep=1, voix="d04.mp3", type="code", code=CODE_CARTE,
         code_fenetre=(0.10, 0.48),
         pages=[dict(debut=0.0, url="tp1/index.html", widgets=[], decor=decor_carte)],
         texte="Deuxième règle, la carte qui se soulève. Même structure : le bloc carte donne une "
               "largeur de deux cent vingt pixels, un fond blanc, des coins arrondis et une petite "
               "ombre. Puis la transition, en mode linear, sur la transformation et l'ombre. Et "
               "voici la nouveauté : transition-delay, un dixième de seconde. Le survol, lui, "
               "applique translateY de moins dix pixels et une ombre beaucoup plus large. "
               "Regardez la ligne de temps sous la carte : pendant le premier dixième de seconde, "
               "il ne se passe rien, c'est le retard ; ensuite, le mouvement dure trois dixièmes de "
               "seconde. Le retard ne raccourcit pas la durée, il décale le départ. Et pourquoi "
               "l'ombre grandit-elle en même temps que la carte monte ? Parce que les deux "
               "propriétés sont dans la même transition : elles démarrent ensemble. Sinon, la "
               "carte semblerait flotter dans le vide. Retenez les deux fonctions de temporisation "
               "du TP : ease, qui ralentit au début et à la fin, et linear, qui garde une vitesse "
               "constante.",
         etapes=[dict(f=0.08, x=300, y=210), dict(f=0.36, x=320, y=340),
                 dict(f=0.62, x=800, y=200), dict(f=0.86, x=900, y=250)]),

    dict(cle="temporisation", ep=1, voix="d05.mp3", type="code", code=CODE_TEMPO,
         code_fenetre=(0.10, 0.46),
         pages=[dict(debut=0.0, url="tp1/index.html", widgets=[], decor=decor_temporisation)],
         texte="Partie A, question quatre : les fonctions de temporisation. Trois carrés "
               "identiques, une durée identique de une seconde, et pourtant trois voyages "
               "différents. En haut, ease : le carré démarre doucement, accélère au milieu, puis "
               "freine à l'arrivée. Au milieu, linear : la vitesse ne change jamais, le carré "
               "avance comme un métronome. En bas, ease-in-out : très lent au départ, rapide au "
               "centre, très lent à l'arrivée. À droite, les trois courbes superposées montrent "
               "exactement la même chose : l'axe horizontal, c'est le temps ; l'axe vertical, "
               "c'est la distance parcourue. La courbe de linear est une droite, celles de ease et "
               "d'ease-in-out sont des S plus ou moins prononcés. Quel choix pour quel usage ? "
               "linear pour une rotation ou un déplacement régulier, ease pour un survol "
               "classique, ease-in-out pour un aller-retour naturel. Et n'oubliez pas le retard, "
               "transition-delay, qui attend avant de commencer. Avec ces deux réglages, durée et "
               "temporisation, vous contrôlez tout le rythme de vos transitions.",
         etapes=[dict(f=0.06, x=300, y=180), dict(f=0.32, x=340, y=300),
                 dict(f=0.58, x=800, y=260), dict(f=0.82, x=980, y=230)]),

    dict(cle="pulse", ep=2, voix="d06.mp3", type="code", code=CODE_PULSE,
         code_fenetre=(0.10, 0.46),
         pages=[dict(debut=0.0, url="tp1/index.html", widgets=[], decor=decor_pulse)],
         texte="Deuxième partie : les animations, avec arobase keyframes. Premier exemple, le "
               "cercle qui pulse. Une animation, c'est un scénario écrit en trois étapes : zéro "
               "pour cent, scale de un ; cinquante pour cent, scale de un virgule trois ; cent pour "
               "cent, retour à scale de un. Ces trois étapes forment le keyframes qui s'appelle "
               "pulse. Ensuite, la règle cercle : cent pixels de large, cent de haut, border-radius "
               "cinquante pour cent pour obtenir un rond, un fond vert, et la ligne animation. "
               "Lisez-la dans l'ordre : le nom de l'animation, pulse ; sa durée, une seconde et "
               "demie ; sa temporisation, ease-in-out ; et son compteur, infinite, c'est-à-dire "
               "sans fin. Sur l'écran, le cercle respire : il grossit, il revient, il recommence. "
               "Et il n'y a aucun saut, parce que l'étape de cent pour cent est identique à celle "
               "de zéro. Si vous écrivez une étape finale différente, le retour sera brutal. Le "
               "cercle pointillé, derrière, montre sa taille de repos : c'est le point de départ "
               "et le point d'arrivée de chaque cycle.",
         etapes=[dict(f=0.08, x=300, y=200), dict(f=0.34, x=320, y=330),
                 dict(f=0.60, x=800, y=200), dict(f=0.84, x=930, y=300)]),

    dict(cle="loader", ep=2, voix="d07.mp3", type="code", code=CODE_LOADER,
         code_fenetre=(0.10, 0.46),
         pages=[dict(debut=0.0, url="tp1/index.html", widgets=[], decor=decor_loader)],
         texte="Deuxième animation, le loader. Le keyframes s'appelle tourne et n'a que deux "
               "étapes : from, rotate de zéro degré ; to, rotate de trois cent soixante degrés. "
               "From et to sont simplement les alias de zéro et cent pour cent. La règle loader "
               "donne un carré de soixante pixels, un fond violet, et l'animation tourne, un "
               "virgule deux seconde, linear, infinite. Attention à cette temporisation : pour une "
               "rotation, il faut linear, jamais ease. Avec ease, la rotation ralentirait à chaque "
               "tour, et l'œil verrait un à-coup à chaque boucle. Comme trois cent soixante degrés "
               "égale zéro degré, la fin du cycle se confond avec le début, et la rotation paraît "
               "parfaitement continue. Le compteur, en bas, affiche l'angle réel : zéro, quatre-"
               "vingt-dix, cent quatre-vingts, deux cent soixante-dix, puis de nouveau zéro. Sans "
               "infinite, le carré s'arrêterait définitivement à trois cent soixante degrés, donc "
               "à sa position de départ : on ne verrait qu'un seul tour.",
         etapes=[dict(f=0.08, x=300, y=210), dict(f=0.34, x=320, y=340),
                 dict(f=0.62, x=800, y=200), dict(f=0.86, x=930, y=280)]),

    dict(cle="fondu_balle", ep=2, voix="d08.mp3", type="code", code=CODE_FONDU,
         code_fenetre=(0.10, 0.46),
         pages=[dict(debut=0.0, url="tp1/index.html", widgets=[], decor=decor_fondu_balle)],
         texte="Deux dernières animations de l'exercice un. À gauche, le fondu du titre : le "
               "keyframes fondu va de opacity zéro à opacity un, et la règle h1 l'applique en deux "
               "secondes avec ease. Au chargement de la page, le titre apparaît en douceur, puis "
               "il reste. Une animation sans infinite ne joue qu'une fois : c'est exactement ce "
               "qu'on veut pour une apparition. À droite, la balle : le keyframes rebond va de "
               "translateY zéro à translateY moins soixante-dix pixels, en six dixièmes de "
               "seconde, ease-in, infinite, et surtout alternate. Alternate est la clé : "
               "l'animation est jouée à l'aller, puis à l'envers, puis à nouveau à l'aller. La "
               "balle monte, redescend, remonte, sans jamais sauter. Sans alternate, elle "
               "repartirait brutalement du sol après chaque rebond. Voilà tout l'exercice un : "
               "trois transitions pour réagir au survol, quatre animations pour bouger tout seul. "
               "Et toujours les mêmes réflexes : un keyframes nommé, relié par animation, infinite "
               "pour les boucles, alternate pour les allers-retours.",
         etapes=[dict(f=0.08, x=300, y=190), dict(f=0.36, x=340, y=330),
                 dict(f=0.62, x=860, y=230), dict(f=0.86, x=980, y=300)]),

    dict(cle="menu_float", ep=3, voix="d09.mp3", type="code", code=CODE_MENU,
         code_fenetre=(0.08, 0.44),
         fichier="style2.css",
         pages=[dict(debut=0.0, url="tp2/index.html", widgets=[], decor=decor_menu_float)],
         texte="Passons à l'exercice deux, le menu à trois niveaux. Même contrainte, plus une : "
               "pas de display flex, et pas de pseudo-éléments before ou after. On construit donc "
               "avec float et position, comme au TP display. Le nav reçoit une hauteur fixe de "
               "cinquante pixels et un fond sombre. La liste perd ses puces et ses marges. Puis "
               "chaque li du menu reçoit float left : les entrées se placent côte à côte, comme "
               "des mots. Et position relative : chaque entrée devient le repère de son futur "
               "sous-menu. Les liens sont en display block, avec un padding de quinze et vingt-"
               "deux, une couleur claire et pas de soulignement, et une transition sur le fond et "
               "sur la bordure. Au survol, le fond passe à l'orange. Deux détails du TP : une "
               "bordure basse de trois pixels transparente sur les liens du menu, qui prend sa "
               "couleur au survol, c'est le soulignement animé, sans after ; et la hauteur fixe du "
               "nav, indispensable, parce que les flottants sortent du flux. Sans elle, le nav "
               "mesurerait zéro pixel, et le contenu suivant passerait dessous.",
         etapes=[dict(f=0.06, x=300, y=180), dict(f=0.32, x=340, y=300),
                 dict(f=0.58, x=820, y=170), dict(f=0.84, x=960, y=210)]),

    dict(cle="menu_sous", ep=3, voix="d10.mp3", type="code", code=CODE_SOUS_MENU,
         code_fenetre=(0.08, 0.44),
         fichier="style2.css",
         pages=[dict(debut=0.0, url="tp2/index.html", widgets=[], decor=decor_menu_sous)],
         texte="Voici le cœur de l'exercice deux : les sous-menus. Le sous-menu est en position "
               "absolute, top cent pour cent, donc juste sous son parent, left zéro, avec une "
               "largeur de cent quatre-vingt-dix pixels et un fond plus clair. Puis viennent les "
               "trois propriétés qui font toute l'animation : opacity zéro, visibility hidden, et "
               "translateY de dix pixels. Et la transition, sur ces trois propriétés. Au survol du "
               "li parent, on remet opacity un, visibility visible et translateY zéro. "
               "L'astuce, que le TP souligne : on n'utilise pas display none. Un élément en "
               "display none n'a plus de boîte, donc il ne peut pas être animé. Opacity et "
               "visibility le rendent invisible, et même non cliquable, tout en gardant la "
               "transition possible. Pour le niveau trois, autre technique : il part de left cent "
               "pour cent, donc à droite de son parent, et il apparaît avec un keyframes, glisse, "
               "qui combine un fondu et un glissement horizontal. Enfin la flèche : un span, en "
               "display inline-block, qui tourne de cent quatre-vingts degrés au survol. Sans "
               "inline-block, la rotation ne s'applique pas : c'est le piège du bac.",
         etapes=[dict(f=0.06, x=300, y=180), dict(f=0.34, x=340, y=300),
                 dict(f=0.60, x=860, y=220), dict(f=0.86, x=980, y=260)]),

    dict(cle="fin", ep=None, voix=None, type="fin",
         titre="Fin du TP — transitions et animations",
         lignes=["transition : :hover, durée, delay, temporisation",
                 "animation : @keyframes, infinite, alternate",
                 "menu : float, position, opacity + visibility"],
         pied="STI By A'e — Lycée Rafèha",
         duree=12),
]

# Le CSS montré ne doit contenir ni flex, ni pseudo-éléments.
_INTERDITS = ("display: flex", "display:flex", "::after", "::before")
for _scene in SCENES:
    _code = _scene.get("code") or ""
    for _mot in _INTERDITS:
        assert _mot not in _code, "interdit dans %s : %s" % (_scene.get("cle"), _mot)
