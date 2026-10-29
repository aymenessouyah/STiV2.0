"""Rendu de la vidéo « TP Train — correction détaillée ».

Usage :
    python3 render.py --images /tmp/frames --planches 20,40,60
    python3 render.py --sortie out.mp4 [--debut 0 --fin 30] [--fps 30]

Découpage de l'écran (exigences du cahier des charges) :
  • ligne 1 (haute de 268 px) : l'énoncé ;
  • ligne 2 (haute de 594 px, plus haute que la ligne 1) : d'abord le diagramme
    sur toute la largeur, puis le diagramme se réduit à gauche et le code
    JavaScript se tape à droite.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from PIL import Image, ImageDraw

import contenu
from contenu import PARTIES
from theme import (
    FOND, FOND_PANNEAU, FOND_PANNEAU_2, BORDURE, TEXTE, TEXTE_2, TEXTE_3,
    ORANGE, ORANGE_FONCE, AMBRE, VIOLET, VERT, BLEU, ROSE,
    melange, boite_arrondie, texte, texte_centre, texte_ajuste, largeur_texte,
    couper_texte, police, degrade_vertical, ROUGE_LIGNE,
)
import dessin

LARGEUR, HAUTEUR = 1920, 1080
FPS = 30

# ── Durées (secondes) ─────────────────────────────────────────────────────
D_INTRO = 13.0
D_ENONCE_MIN = 7.0
D_ENONCE_PAR_CAR = 0.011
D_NOEUD = 2.15
D_TRANSITION = 1.9
D_PARTIE_FIN = 1.4
D_OUTRO = 24.0
D_ENTRACTE = 1.0

COMPACT_X1 = 812          # bord droit du panneau diagramme réduit
CODE_X0 = 828             # bord gauche du panneau code
PANEL_FULL = (64, 416, 1856, 1036)


def _duree_ligne(ligne: str) -> float:
    s = ligne.strip()
    if not s:
        return 0.34
    if s.startswith("//"):
        return 0.72
    return 0.42 + len(s) * 0.0125


SECTIONS_PARTIES = ["outils", "identite", "voyage", "prix", "captcha", "envoi"]


def construire_plan(cibles: dict | None = None) -> dict:
    """Calcule tous les instants de la vidéo (indépendant du rendu).

    cibles : durées audio par section ; chaque partie est alors étirée ou
    resserrée pour que l'image et la voix restent synchronisées.
    """
    parties = []
    t = (cibles or {}).get("intro", D_INTRO)
    for i, p in enumerate(PARTIES):
        n_noeuds = len(p["noeuds"])
        d_enonce = max(D_ENONCE_MIN, len(p["enonce"]) * D_ENONCE_PAR_CAR + 3.0)
        pas_noeud = D_NOEUD
        d_partie_fin = D_PARTIE_FIN
        facteur_ligne = 1.0
        pause_diagramme = 0.4
        d_transition = D_TRANSITION
        if cibles:
            section = SECTIONS_PARTIES[i]
            naturelle = (d_enonce + n_noeuds * D_NOEUD + 0.4 + D_TRANSITION
                         + sum(_duree_ligne(l) for l in p["code"]) + D_PARTIE_FIN)
            f = max(0.55, min(2.4, cibles[section] / max(1.0, naturelle)))
            d_enonce *= f
            pas_noeud *= f
            facteur_ligne = f
            d_partie_fin = D_PARTIE_FIN * f
            pause_diagramme = 0.4 * f
            d_transition = D_TRANSITION * f
        t_enonce = t
        t_diagramme = t_enonce + d_enonce
        t_transition = t_diagramme + n_noeuds * pas_noeud + pause_diagramme
        t_code = t_transition + d_transition
        # instants de chaque ligne de code
        instants, tc = [], t_code
        for ligne in p["code"]:
            instants.append(tc)
            tc += _duree_ligne(ligne) * facteur_ligne
        t_fin = tc + d_partie_fin
        parties.append({
            "index": i,
            "noeuds": p["noeuds"],
            "code": p["code"],
            "liens_code": p["liens_code"],
            "enonce": p["enonce"],
            "titre": p["titre"],
            "t_debut": t,
            "t_enonce": t_enonce,
            "t_diagramme": t_diagramme,
            "t_transition": t_transition,
            "t_code": t_code,
            "t_fin": t_fin,
            "d_enonce": d_enonce,
            "pas_noeud": pas_noeud,
            "d_transition": d_transition,
            "instants": instants,
        })
        t = t_fin + D_ENTRACTE
    fin_parties = t
    d_outro = (cibles or {}).get("outro", D_OUTRO)
    total = fin_parties + d_outro
    return {"parties": parties, "fin_parties": fin_parties, "total": total, "d_outro": d_outro}


def _ease(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def _ease_out(x):
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


# ══════════════════════════════════════════════════════════════════════════
#  Carton d'ouverture et de fin
# ══════════════════════════════════════════════════════════════════════════
def _fond_degrade(img):
    degrade_vertical(img, (0, 0, LARGEUR, HAUTEUR), melange(FOND, VIOLET, 0.10), FOND)


def _intro_titre(img, trace, t, duree):
    """Premier temps : le carton de titre et les cinq scènes."""
    _fond_degrade(img)
    p = _ease_out(min(1.0, t / 1.1))
    y0 = (1 - p) * 40
    boite_arrondie(trace, (LARGEUR / 2 - 150, 180 + y0, LARGEUR / 2 + 150, 244 + y0),
                   rayon=32, fond=melange(FOND_PANNEAU, ORANGE, 0.18), bord=ORANGE, largeur_bord=2)
    texte_centre(trace, (LARGEUR / 2 - 150, 180 + y0, LARGEUR / 2 + 150, 244 + y0),
                 "SÉRIE 6  ·  JAVASCRIPT", 22, AMBRE, gras=True)
    texte_centre(trace, (0, 280 + y0, LARGEUR, 380 + y0), "TP Train", 96, TEXTE, gras=True)
    texte_centre(trace, (0, 392 + y0, LARGEUR, 448 + y0),
                 "la correction détaillée, du diagramme au code", 36, ORANGE, gras=True)

    n = len(contenu.SCENES)
    carte_w, ecart = 268, 24
    total_w = n * carte_w + (n - 1) * ecart
    x = (LARGEUR - total_w) / 2
    y = 560
    for i, (num, titre, sous) in enumerate(contenu.SCENES):
        a = _ease_out((t - 1.4 - i * 0.35) / 0.6)
        if a <= 0:
            break
        yy = y + (1 - a) * 26
        boite_arrondie(trace, (x, yy, x + carte_w, yy + 168), rayon=16,
                       fond=melange(FOND, FOND_PANNEAU, a), bord=melange(FOND, BORDURE, a), largeur_bord=2)
        texte_centre(trace, (x, yy + 18, x + carte_w, yy + 78), num, 44, melange(FOND, ORANGE, a), gras=True)
        texte_centre(trace, (x, yy + 82, x + carte_w, yy + 120), titre, 26, melange(FOND, TEXTE, a), gras=True)
        texte_centre(trace, (x, yy + 122, x + carte_w, yy + 152), sous, 18, melange(FOND, TEXTE_3, a))
        x += carte_w + ecart

    texte_centre(trace, (0, 790, LARGEUR, 840),
                 "cours/javascript.html  →  Série 6  →  TP Train", 24, TEXTE_2)
    texte_centre(trace, (0, 940, LARGEUR, 980), "STI par AE  ·  V2.0", 20, TEXTE_3, gras=True)


MINI_NOEUDS = [
    ("debut", "DÉBUT", ""),
    ("entree", "demanderNom()", "prompt → champ nom"),
    ("decision", "Nom vide ?", "alerte + return"),
    ("action", "ecrire(\"res0\", l)", "le message de bienvenue"),
]
MINI_CODE = [
    "function identite() {",
    "  let nom = lire(\"nom\");",
    "  if (nom === \"\") {",
    "    alert(\"Nom obligatoire !\");",
    "    return;",
    "  }",
    "  ecrire(\"res0\", [nom]);",
    "}",
]


def _intro_principe(img, trace, t, t0, duree):
    """Deuxième temps : le principe « énoncé / diagramme puis code »."""
    _fond_degrade(img)
    texte_centre(trace, (0, 70, LARGEUR, 130), "LE PRINCIPE", 22, AMBRE, gras=True)
    texte_centre(trace, (0, 132, LARGEUR, 196), "Deux lignes, deux temps", 50, TEXTE, gras=True)

    # ligne 1 : énoncé
    a = _ease_out((t - t0 - 0.4) / 0.7)
    if a <= 0:
        return
    z1 = (240, 232, 1680, 372)
    boite_arrondie(trace, z1, rayon=16, fond=FOND_PANNEAU, bord=melange(FOND, BORDURE, a), largeur_bord=2)
    texte(trace, (z1[0] + 26, z1[1] + 18), "LIGNE 1 · ÉNONCÉ", 17, AMBRE, gras=True)
    texte(trace, (z1[0] + 26, z1[1] + 46), "Partie 1 — Identité", 28, melange(FOND, TEXTE, a), gras=True)
    texte(trace, (z1[0] + 26, z1[1] + 86),
          "On demande son nom, on vérifie l'e-mail, on affiche le message.", 22, melange(FOND, TEXTE_2, a))

    # ligne 2 : diagramme puis code
    a2 = _ease_out((t - t0 - 1.0) / 0.7)
    if a2 <= 0:
        return
    y2, y3 = 392, 880
    repli = _ease((t - t0 - 5.2) / 2.0)
    xfin = 240 + (1680 - 240 - (1680 - 900) * 0)  # borne droite du bloc diagramme
    droite = 1680 + (900 - 1680) * repli
    boite_arrondie(trace, (240, y2, droite, y3), rayon=16,
                   fond=melange(FOND, FOND_PANNEAU, a2), bord=melange(FOND, BORDURE, a2), largeur_bord=2)
    texte(trace, (266, y2 + 16), "LIGNE 2 · DIAGRAMME", 17, AMBRE, gras=True)

    # les quatre nœuds du mini-diagramme
    largeur = droite - 240
    cols = 4 if repli < 0.5 else 2
    bw = min(300.0, (largeur - 60 - (cols - 1) * 24) / cols)
    bh = 92
    lignes = (len(MINI_NOEUDS) + cols - 1) // cols
    gx, gy = 24, 34
    ox = 240 + (largeur - (cols * bw + (cols - 1) * gx)) / 2
    oy = y2 + 70 + max(0.0, (y3 - y2 - 90 - (lignes * bh + (lignes - 1) * gy)) / 2)
    pos, tailles = [], []
    for i in range(len(MINI_NOEUDS)):
        r, c = divmod(i, cols)
        pos.append((ox + c * (bw + gx), oy + r * (bh + gy)))
        tailles.append((bw, bh))
    for i in range(len(pos) - 1):
        prog = max(0.0, min(1.0, (t - t0 - 2.2 - i * 1.1) / 0.7))
        if prog > 0:
            pts = dessin.chemin_entre(pos, tailles, cols, i)
            dessin._polyligne(trace, pts, prog, melange(FOND_PANNEAU, TEXTE_3, 0.5), 3)
    for i, noeud in enumerate(MINI_NOEUDS):
        apparait = max(0.0, min(1.0, (t - t0 - 1.4 - i * 1.1) / 0.5))
        if apparait <= 0:
            continue
        px, py = pos[i]
        w, h = tailles[i]
        dessin.dessiner_noeud(trace, (px, py, px + w, py + h), noeud, "fait" if i else "courant", 1.0, apparait)

    # le code arrive à droite
    if repli > 0.4:
        av = _ease_out((repli - 0.4) / 0.6)
        largeur_code = int((900 - 240) * 0)
        x0 = 916
        largeur = int((1680 - x0) * av)
        if largeur > 20:
            sous = Image.new("RGB", (1680 - x0, y3 - y2), FOND_PANNEAU)
            sub = ImageDraw.Draw(sous)
            boite_arrondie(sub, (0, 0, 1680 - x0 - 1, y3 - y2 - 1), rayon=16,
                           fond=FOND_PANNEAU, bord=BORDURE, largeur_bord=2)
            texte(sub, (26, 16), "LE CODE, PAS À PAS", 17, AMBRE, gras=True)
            debut_code = t0 + 7.4
            y = 66
            for i, ligne in enumerate(MINI_CODE):
                t_ligne = debut_code + i * 1.15
                if t < t_ligne:
                    break
                f = min(1.0, (t - t_ligne) / 0.9)
                c = ligne[: int(f * len(ligne))]
                actif = len(c) < len(ligne)
                if actif:
                    sub.rectangle([2, y - 3, 1680 - x0 - 4, y + 22], fill=ROUGE_LIGNE)
                sub.text((54, y - 6), str(i + 1).rjust(2), font=police(15, mono=True), fill=TEXTE_3, anchor="ra")
                sub.text((70, y - 6), c, font=police(18, mono=True),
                         fill=(255, 226, 226) if actif else TEXTE)
                y += 26
            img.paste(sous.crop((0, 0, largeur, y3 - y2)), (x0, y2))

    # légendes
    texte_centre(trace, (240, 900, 1680, 946),
                 "1 · le diagramme se construit sur toute la largeur", 24,
                 melange(FOND, TEXTE_2 if repli > 0.2 else AMBRE, a))
    if repli > 0.5:
        a3 = _ease_out((repli - 0.5) / 0.5)
        texte_centre(trace, (240, 954, 1680, 1000),
                     "2 · il se replie à gauche, le code s'écrit à droite", 24,
                     melange(FOND, AMBRE if repli > 0.92 else TEXTE_2, a3))


def _dessiner_intro(img, trace, t, duree):
    """Carton de titre, puis démonstration animée du principe."""
    bascule = max(10.0, min(duree - 16.0, duree * 0.38))
    if t < bascule - 1.2:
        _intro_titre(img, trace, t, duree)
        return
    if t < bascule:
        f = Image.new("RGB", (LARGEUR, HAUTEUR), FOND)
        _intro_titre(f, ImageDraw.Draw(f), t, duree)
        g = Image.new("RGB", (LARGEUR, HAUTEUR), FOND)
        _intro_principe(g, ImageDraw.Draw(g), t, bascule - 1.2, duree)
        img.paste(Image.blend(f, g, _ease((t - (bascule - 1.2)) / 1.2)))
        return
    _intro_principe(img, trace, t, bascule - 1.2, duree)


def _dessiner_outro(img, dessin, t, duree):
    _fond_degrade(img)
    texte_centre(dessin, (0, 120, LARGEUR, 180), "RÉCAPITULATIF", 24, AMBRE, gras=True)
    texte_centre(dessin, (0, 190, LARGEUR, 280), "Ce qu'il faut retenir", 62, TEXTE, gras=True)

    points = [
        ("1", "Un diagramme avant le code", "chaque étape du TP a son organigramme"),
        ("2", "Des fonctions courtes", "lire, ecrire, colorer servent partout"),
        ("3", "Des boucles pour vérifier", "e-mail, options, captcha, erreurs"),
        ("4", "Des conditions pour décider", "classe, âge, aller-retour, essais"),
        ("5", "Une animation en prime", "setInterval fait entrer le train en gare"),
    ]
    y = 320
    for i, (num, titre, sous) in enumerate(points):
        a = _ease_out((t - 1.2 - i * 0.5) / 0.6)
        if a <= 0:
            break
        x0 = 300
        boite_arrondie(dessin, (x0, y, LARGEUR - x0, y + 104), rayon=16,
                       fond=melange(FOND, FOND_PANNEAU, a), bord=melange(FOND, BORDURE, a), largeur_bord=2)
        dessin.ellipse([x0 + 22, y + 26, x0 + 74, y + 78], fill=melange(FOND, ORANGE, a))
        texte_centre(dessin, (x0 + 22, y + 26, x0 + 74, y + 78), num, 26, (26, 16, 8) if a > 0.5 else FOND, gras=True)
        texte(dessin, (x0 + 96, y + 22), titre, 28, melange(FOND, TEXTE, a), gras=True)
        texte(dessin, (x0 + 96, y + 60), sous, 21, melange(FOND, TEXTE_3, a))
        y += 118

    a = _ease_out((t - 4.6) / 0.8)
    if a > 0:
        texte_centre(dessin, (0, 940, LARGEUR, 1000),
                     "À toi de jouer : ouvre la Série 6 et tape le TP Train.",
                     30, melange(FOND, ORANGE, a), gras=True)


# ══════════════════════════════════════════════════════════════════════════
#  État d'une partie à l'instant t
# ══════════════════════════════════════════════════════════════════════════
def etat_partie(partie, t):
    """Renvoie (phase, progression, etats_noeuds, fleches, code, compact, apparition_code)."""
    n = len(partie["noeuds"])
    if t < partie["t_enonce"]:
        prog_enonce = 0.0
    else:
        prog_enonce = min(1.0, (t - partie["t_enonce"]) / max(0.1, partie["d_enonce"] - 2.4))

    etats = ["absent"] * n
    fleches = [0.0] * n
    compact = 0.0
    code = None

    # construction du diagramme
    if t >= partie["t_diagramme"]:
        for i in range(n):
            t_noeud = partie["t_diagramme"] + i * partie["pas_noeud"]
            if t >= t_noeud:
                etats[i] = "fait"
            if i + 1 < n:
                t_fleche = t_noeud + partie["pas_noeud"] * 0.45
                fleches[i] = max(0.0, min(1.0, (t - t_fleche) / (partie["pas_noeud"] * 0.5)))
            else:
                fleches[i] = 1.0
        # le dernier construit est « courant »
        construits = [i for i in range(n) if etats[i] == "fait"]
        if construits and t < partie["t_transition"]:
            dernier = construits[-1]
            if t - (partie["t_diagramme"] + dernier * partie["pas_noeud"]) < 2.6:
                etats[dernier] = "courant"

    # repli du diagramme + arrivée du code
    if t >= partie["t_transition"]:
        compact = _ease((t - partie["t_transition"]) / partie["d_transition"])

    # frappe du code
    if t >= partie["t_code"]:
        instants = partie["instants"]
        lignes = PARTIES[partie["index"]]["code"]
        idx = 0
        for i, ti in enumerate(instants):
            if t >= ti:
                idx = i
        suivant = instants[idx + 1] if idx + 1 < len(instants) else partie["t_fin"]
        fraction = (t - instants[idx]) / max(0.05, suivant - instants[idx])
        longueur = len(lignes[idx])
        caracteres = int(min(1.0, fraction * 1.6) * longueur) if longueur else 0
        code = {"curseur": float(idx), "lignes": idx, "caracteres": caracteres,
                "defilement": max(0.0, idx - 8.0) if idx > 8 else 0.0}
        # les nœuds s'allument au fil du code
        liens = PARTIES[partie["index"]]["liens_code"]
        atteints = []
        for motif, noeud in liens:
            for j, l in enumerate(lignes[: idx + 1]):
                if motif in l:
                    atteints.append(noeud)
                    break
        if atteints:
            for i in range(n):
                etats[i] = "attente"
            for i in set(atteints):
                etats[min(i, n - 1)] = "fait"
            etats[min(max(atteints), n - 1)] = "courant"
        fleches = [1.0] * n

    return {"enonce": prog_enonce, "etats": etats, "fleches": fleches,
            "compact": compact, "code": code, "phase": _phase(partie, t)}


def _phase(partie, t):
    if t < partie["t_diagramme"]:
        return "enonce"
    if t < partie["t_transition"]:
        return "diagramme"
    if t < partie["t_code"]:
        return "transition"
    return "code"


# ══════════════════════════════════════════════════════════════════════════
#  Rendu d'une image
# ══════════════════════════════════════════════════════════════════════════
def _layout_diagramme(partie, box, compact):
    """Positions absolues des nœuds, interpolées entre pleine largeur et réduit."""
    x0, y0, x1, y1 = box
    interieur_w = (x1 - x0) - 32
    interieur_h = (y1 - y0) - 78
    pos_f, t_f, cols_f = dessin.disposition(len(partie["noeuds"]), 1792 - 32, 620 - 78, False)
    pos_c, t_c, cols_c = dessin.disposition(len(partie["noeuds"]), (COMPACT_X1 - 64) - 32, 620 - 78, True)
    pos, tailles = [], []
    for i in range(len(partie["noeuds"])):
        px = pos_f[i][0] + (pos_c[i][0] - pos_f[i][0]) * compact
        py = pos_f[i][1] + (pos_c[i][1] - pos_f[i][1]) * compact
        # centrage dans la largeur courante
        dw = (interieur_w - (1792 - 32 + ((COMPACT_X1 - 64) - 32 - (1792 - 32)) * compact)) / 2
        w = t_f[i][0] + (t_c[i][0] - t_f[i][0]) * compact
        h = t_f[i][1] + (t_c[i][1] - t_f[i][1]) * compact
        pos.append((x0 + 16 + px + dw, y0 + 62 + py))
        tailles.append((w, h))
    cols = cols_f if compact < 0.5 else cols_c
    return pos, tailles, cols


def _dessiner_panneau_diagramme(img, dessin_mod, partie, box, etat, t_abs=0.0):
    x0, y0, x1, y1 = box
    boite_arrondie(dessin_mod, box, rayon=18, fond=FOND_PANNEAU, bord=BORDURE, largeur_bord=2)
    texte(dessin_mod, (x0 + 22, y0 + 16), "DIAGRAMME", 19, AMBRE, gras=True)
    dessin_mod.line([(x0 + 22, y0 + 42), (x0 + 22 + 118, y0 + 42)], fill=AMBRE, width=2)
    dessin_mod.line([(x0 + 22, y0 + 48), (x0 + 22 + 74, y0 + 48)], fill=melange(AMBRE, FOND, 0.55), width=2)

    pos, tailles, cols = _layout_diagramme(partie, box, etat["compact"])
    if all(e == "absent" for e in etat["etats"]):
        texte_centre(dessin_mod, (x0 + 20, y0 + 70, x1 - 20, y1 - 20),
                     "le diagramme se construit ici", 26, TEXTE_3)
    # emplacements à venir
    for i, noeud in enumerate(partie["noeuds"]):
        if etat["etats"][i] == "absent":
            px, py = pos[i]
            bw, bh = tailles[i]
            dessin.dessiner_esquisse(dessin_mod, (px, py, px + bw, py + bh), noeud[0])
    # compteur d'étapes
    faites = sum(1 for e in etat["etats"] if e != "absent")
    if faites:
        libelle = f"{faites} / {len(partie['noeuds'])} étapes"
        larg = largeur_texte(libelle, 17, True) + 28
        boite_arrondie(dessin_mod, (x1 - larg - 20, y0 + 12, x1 - 20, y0 + 46), rayon=9,
                       fond=FOND, bord=BORDURE, largeur_bord=1)
        texte_centre(dessin_mod, (x1 - larg - 20, y0 + 12, x1 - 20, y0 + 46), libelle, 17, TEXTE_2, gras=True)
    if etat["compact"] > 0.9:
        texte_centre(dessin_mod, (x0 + 20, y0 + 70, x1 - 20, y1 - 20),
                     "", 12, TEXTE_3)

    # flèches
    if etat["compact"] < 0.06 or etat["compact"] > 0.94 or etat["code"] is not None:
        for i in range(len(pos) - 1):
            prog = etat["fleches"][i]
            if prog <= 0 or etat["etats"][i] == "absent":
                continue
            pts = dessin.chemin_entre(pos, tailles, cols, i)
            couleur = melange(FOND_PANNEAU, TEXTE_3, 0.55)
            if etat["etats"][i + 1] in ("courant", "fait") and prog > 0.5:
                couleur = melange(FOND_PANNEAU, ORANGE, 0.85)
            dessin._polyligne(dessin_mod, pts, prog, couleur, 3)

    for i, noeud in enumerate(partie["noeuds"]):
        px, py = pos[i]
        bw, bh = tailles[i]
        # petit « pop » à l'apparition
        t_naissance = partie["t_diagramme"] + i * partie["pas_noeud"]
        pop = 1.0
        if t_abs >= t_naissance:
            pop = min(1.0, (t_abs - t_naissance) / 0.32)
        else:
            pop = 0.0
        if pop <= 0:
            continue
        dessin.dessiner_noeud(dessin_mod, (px, py, px + bw, py + bh), noeud, etat["etats"][i], 1.0, pop)


def image(t: float, plan: dict) -> Image.Image:
    img = Image.new("RGB", (LARGEUR, HAUTEUR), FOND)
    dessin_mod = ImageDraw.Draw(img)

    partie_info = None
    for p in plan["parties"]:
        if p["t_debut"] <= t < p["t_fin"] + D_ENTRACTE:
            partie_info = p
            break

    d_intro = plan["parties"][0]["t_debut"]
    if t < d_intro:
        _dessiner_intro(img, dessin_mod, t, d_intro)
        dessin.dessiner_progression(dessin_mod, t, plan["total"])
        return img

    if t >= plan["fin_parties"]:
        _dessiner_outro(img, dessin_mod, t - plan["fin_parties"], plan["d_outro"])
        dessin.dessiner_progression(dessin_mod, t, plan["total"])
        return img

    i = partie_info["index"] if partie_info else 0
    partie = partie_info if partie_info else PARTIES[0]
    etat = etat_partie(partie_info, t) if partie_info else {"enonce": 1, "etats": ["absent"] * 5,
                                                             "fleches": [0] * 5, "compact": 0, "code": None}

    dessin.dessiner_entete(img, dessin_mod, contenu.INTRO_TITRE, contenu.INTRO_SOUS)
    dessin.dessiner_pastilles(img, dessin_mod, PARTIES, i)
    dessin.dessiner_enonce(img, dessin_mod, partie, str(i + 1), etat["enonce"])

    # ligne 2
    compact = etat["compact"]
    x1 = int(1856 + (COMPACT_X1 - 1856) * compact)
    box_diag = (64, 416, x1, 1036)
    _dessiner_panneau_diagramme(img, dessin_mod, partie, box_diag, etat, t)

    if compact > 0.35 and etat["code"] is not None:
        # le panneau code glisse depuis la droite, révélé par la gauche
        av = _ease_out((compact - 0.35) / 0.65)
        largeur = int((1856 - CODE_X0) * av)
        if largeur > 30:
            sous = Image.new("RGB", (1856 - CODE_X0, 1036 - 416), FOND_PANNEAU)
            sub = ImageDraw.Draw(sous)
            dessin.dessiner_code(sous, sub, (0, 0, 1856 - CODE_X0, 1036 - 416),
                                 partie["code"], etat["code"])
            img.paste(sous.crop((0, 0, largeur, 1036 - 416)), (CODE_X0, 416))

    dessin.dessiner_progression(dessin_mod, t, plan["total"])
    return img


# ══════════════════════════════════════════════════════════════════════════
#  Encodage
# ══════════════════════════════════════════════════════════════════════════
def ffmpeg() -> str:
    local = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                         "..", "..", "node_modules", "@ffmpeg-installer", "linux-x64", "ffmpeg")
    if os.path.exists(local):
        return os.path.abspath(local)
    return "ffmpeg"


def encoder(plan, sortie, fps, debut, fin, audio=None):
    cmd = [ffmpeg(), "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{LARGEUR}x{HAUTEUR}", "-r", str(fps), "-i", "-"]
    if audio:
        cmd += ["-i", audio]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "22",
            "-pix_fmt", "yuv420p", "-g", str(fps * 2),
            "-movflags", "+faststart"]
    if audio:
        cmd += ["-c:a", "aac", "-b:a", "128k", "-shortest"]
    cmd += ["-t", f"{fin - debut:.3f}", sortie]

    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    total = int(round((fin - debut) * fps))
    pas = max(1, total // 100)
    for k in range(total):
        t = debut + k / fps
        proc.stdin.write(image(t, plan).tobytes())
        if k % pas == 0:
            print(f"\r  {k}/{total} images", end="", flush=True)
    proc.stdin.close()
    proc.wait()
    print(f"\r  {total}/{total} images — {sortie}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--images", help="dossier de sortie pour des PNG")
    ap.add_argument("--instants", help="instants (s) séparés par des virgules")
    ap.add_argument("--sortie", help="fichier mp4")
    ap.add_argument("--fps", type=int, default=FPS)
    ap.add_argument("--debut", type=float, default=0.0)
    ap.add_argument("--fin", type=float, default=None)
    ap.add_argument("--audio", default=None)
    ap.add_argument("--plan", action="store_true", help="affiche seulement le plan")
    ap.add_argument("--durees", help="JSON des durées audio par section")
    a = ap.parse_args()

    cibles = None
    if a.durees:
        with open(a.durees, encoding="utf-8") as f:
            cibles = json.load(f)
    plan = construire_plan(cibles)
    if a.plan:
        print(json.dumps({
            "total": round(plan["total"], 1),
            "parties": [{"t": round(p["t_debut"], 1), "fin": round(p["t_fin"], 1)} for p in plan["parties"]],
        }, indent=2))
        return

    if a.images:
        os.makedirs(a.images, exist_ok=True)
        for inst in [float(x) for x in (a.instants or "20").split(",")]:
            im = image(inst, plan)
            chemin = os.path.join(a.images, f"t{inst:07.2f}.png")
            im.save(chemin)
            print(chemin)

    if a.sortie:
        fin = a.fin if a.fin is not None else plan["total"]
        encoder(plan, a.sortie, a.fps, a.debut, fin, a.audio)


if __name__ == "__main__":
    main()
