"""Composants graphiques de la vidéo « 37 Défis — Tableau, Aléas & Média ».

Même thème que les autres capsules (outils/tpvid6/theme.py) :
fond nuit, panneaux arrondis, titres ambre double-soulignés, pastilles
d'étapes, cartouche de code à numéros de ligne avec ligne active surlignée.

Mise en page demandée : à gauche l'énoncé, à droite le code.
"""
from __future__ import annotations

import math

from PIL import Image, ImageDraw

from style import (
    FOND, FOND_PANNEAU, FOND_PANNEAU_2, BORDURE, TEXTE, TEXTE_2, TEXTE_3,
    ORANGE, ORANGE_FONCE, AMBRE, VIOLET, VERT, BLEU, ROSE,
    ROUGE_LIGNE, ROUGE_BORD,
    police, melange, boite_arrondie, texte, texte_centre, texte_ajuste,
    largeur_texte, couper_texte, degrade_vertical, sans_emoji,
)

LARGEUR = 1920
HAUTEUR = 1080

# colonnes
GAUCHE = (64, 162, 812, 1012)
DROITE = (832, 162, 1856, 1012)
PLEIN = (64, 162, 1856, 1012)

LH = 27
TAILLE_CODE = 19


def icone(trace, cx, cy, taille, type_icone, couleur):
    """Icône dessinée (les polices du système n'ont pas d'emoji)."""
    r = taille / 2.0
    if type_icone == "tableau":          # histogramme
        for i, h in enumerate((0.45, 0.72, 1.0)):
            x = cx - r * 0.8 + i * r * 0.62
            trace.rectangle([x, cy + r * 0.75 - h * r * 1.5,
                             x + r * 0.40, cy + r * 0.75], fill=couleur)
    elif type_icone == "alea":           # dé à jouer
        trace.rounded_rectangle([cx - r * 0.85, cy - r * 0.85, cx + r * 0.85, cy + r * 0.85],
                                radius=int(r * 0.30), outline=couleur, width=max(2, int(taille * 0.09)))
        for dx, dy in ((-0.42, -0.42), (0.42, -0.42), (0, 0), (-0.42, 0.42), (0.42, 0.42)):
            px, py = cx + dx * r, cy + dy * r
            trace.ellipse([px - r * 0.15, py - r * 0.15, px + r * 0.15, py + r * 0.15], fill=couleur)
    elif type_icone == "chaine":         # « Aa » typographique
        trace.text((cx - r * 1.10, cy - r * 1.20), "A", font=police(int(taille * 1.25), True), fill=couleur)
        trace.text((cx + r * 0.28, cy - r * 0.92), "a", font=police(int(taille * 0.92), True), fill=couleur)
    elif type_icone == "media":          # note de musique
        trace.ellipse([cx - r * 0.75, cy + r * 0.05, cx - r * 0.05, cy + r * 0.72], fill=couleur)
        trace.ellipse([cx + r * 0.05, cy - r * 0.20, cx + r * 0.70, cy + r * 0.45], fill=couleur)
        trace.rectangle([cx - r * 0.18, cy - r * 0.95, cx - r * 0.02, cy + r * 0.40], fill=couleur)
        trace.rectangle([cx + r * 0.58, cy - r * 1.15, cx + r * 0.74, cy + r * 0.15], fill=couleur)
        trace.polygon([(cx - r * 0.18, cy - r * 0.95), (cx + r * 0.74, cy - r * 1.15),
                       (cx + r * 0.74, cy - r * 0.80), (cx - r * 0.18, cy - r * 0.60)], fill=couleur)


def _prog(prog, a, b):
    return max(0.0, min(1.0, (prog - a) / max(1e-6, b - a)))


def _ease(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


# ══════════════════════════════════════════════════════════════════════════
#  En-tête, pastilles, progression
# ══════════════════════════════════════════════════════════════════════════
def entete(img, trace, titre, sous_titre):
    boite_arrondie(trace, (64, 22, 116, 74), rayon=14,
                   fond=melange(FOND_PANNEAU, ORANGE, 0.16), bord=ORANGE, largeur_bord=2)
    texte_centre(trace, (64, 22, 116, 74), "AE", 24, ORANGE, gras=True)
    texte(trace, (132, 26), titre, 29, TEXTE, gras=True)
    texte(trace, (132, 62), sous_titre, 18, TEXTE_3)

    libelle = "STI par AE  ·  V2.0"
    larg = largeur_texte(libelle, 18, gras=True) + 74
    x1 = LARGEUR - 64
    boite_arrondie(trace, (x1 - larg, 28, x1, 70), rayon=21,
                   fond=FOND_PANNEAU, bord=BORDURE, largeur_bord=2)
    texte_centre(trace, (x1 - larg + 10, 28, x1 - 34, 70), libelle, 18, TEXTE_2, gras=True)
    qx, qy = x1 - 26, 36
    for i in range(4):
        for j in range(4):
            if (i * 7 + j * 3) % 3:
                trace.rectangle([qx + i * 5, qy + j * 5, qx + i * 5 + 3, qy + j * 5 + 3], fill=ORANGE)


def pastilles(img, trace, familles, actif, defi_num=None):
    n = len(familles)
    marge, ecart = 64, 10
    larg = (LARGEUR - 2 * marge - ecart * (n - 1)) / n
    y, h = 96, 52
    for i, fam in enumerate(familles):
        x0 = marge + i * (larg + ecart)
        box = (x0, y, x0 + larg, y + h)
        if i == actif:
            w, hh = int(round(larg)), h
            calque = Image.new("RGB", (w, hh), ORANGE)
            degrade_vertical(calque, (0, 0, w, hh), AMBRE, ORANGE_FONCE)
            masque = Image.new("L", (w, hh), 0)
            ImageDraw.Draw(masque).rounded_rectangle([0, 0, w - 1, hh - 1], radius=hh // 2, fill=255)
            img.paste(calque, (int(box[0]), y), masque)
            couleur = (30, 18, 8)
        elif i < actif:
            teinte = fam["couleur"]
            boite_arrondie(trace, box, rayon=h // 2, fond=melange(FOND_PANNEAU, teinte, 0.22),
                           bord=melange(FOND_PANNEAU, teinte, 0.85), largeur_bord=2)
            couleur = melange(teinte, TEXTE, 0.45)
        else:
            boite_arrondie(trace, box, rayon=h // 2, fond=FOND_PANNEAU, bord=BORDURE, largeur_bord=2)
            couleur = TEXTE_3
        marque = "✓ " if i < actif else ""
        icone(trace, box[0] + 32, (box[1] + box[3]) / 2, 22, fam["icone"], couleur)
        texte_ajuste(trace, (box[0] + 52, box[1], box[2] - 16, box[3]),
                     f"{marque}{fam['nom']}", 21, 14, couleur, gras=(i == actif))

    if defi_num:
        libelle = f"Défi {defi_num} / 11"
        lg = largeur_texte(libelle, 18, gras=True) + 30
        boite_arrondie(trace, (LARGEUR - 64 - lg, y + 6, LARGEUR - 64, y + h - 6), rayon=20,
                       fond=FOND_PANNEAU, bord=BORDURE, largeur_bord=2)
        texte_centre(trace, (LARGEUR - 64 - lg, y + 6, LARGEUR - 64, y + h - 6), libelle, 18, TEXTE_2, gras=True)


def progression(trace, t, total):
    y = 1044
    trace.rectangle([64, y, LARGEUR - 64, y + 8], fill=melange(FOND, BORDURE, 0.9))
    f = max(0.0, min(1.0, t / max(0.001, total)))
    if f > 0:
        trace.rectangle([64, y, 64 + (LARGEUR - 128) * f, y + 8], fill=ORANGE)
        x = 64 + (LARGEUR - 128) * f
        trace.ellipse([x - 7, y - 3, x + 7, y + 11], fill=AMBRE)


def pied(trace):
    texte(trace, (LARGEUR - 64, 1058), "Les 37 Défis · JavaScript · Série 6", 15, TEXTE_3, ancre="ra")


# ══════════════════════════════════════════════════════════════════════════
#  Panneau « énoncé » (à gauche)
# ══════════════════════════════════════════════════════════════════════════
def _puces(trace, x, y, largeur, points, taille=18, couleur_dot=AMBRE, couleur_texte=TEXTE_2):
    y_courant = y
    for point in points:
        trace.ellipse([x, y_courant + 6, x + 8, y_courant + 14], fill=couleur_dot)
        for ligne in couper_texte(point, taille, largeur - 22):
            trace.text((x + 18, y_courant), ligne, font=police(taille), fill=couleur_texte)
            y_courant += taille + 8
        y_courant += 8
    return y_courant


def panneau_enonce(img, trace, box, defi, famille, progression_defi, demo_etat=None):
    """Colonne de gauche : titre, consigne, points clés, démonstration, résultat."""
    x0, y0, x1, y1 = box
    accent = famille["couleur"]
    boite_arrondie(trace, box, rayon=18, fond=FOND_PANNEAU, bord=BORDURE, largeur_bord=2)
    boite_arrondie(trace, (x0 + 2, y0 + 2, x0 + 9, y1 - 2), rayon=4, fond=accent)

    # ── en-tête du panneau
    texte(trace, (x0 + 30, y0 + 18), "ÉNONCÉ", 19, AMBRE, gras=True)
    trace.line([(x0 + 30, y0 + 44), (x0 + 30 + 92, y0 + 44)], fill=AMBRE, width=2)
    trace.line([(x0 + 30, y0 + 50), (x0 + 30 + 58, y0 + 50)], fill=melange(AMBRE, FOND, 0.55), width=2)

    niveau = defi["niveau"]
    couleur_niv = {"Facile": VERT, "Moyen": AMBRE, "Difficile": (248, 113, 113)}[niveau]
    lg2 = largeur_texte(niveau, 15, gras=True) + 24
    boite_arrondie(trace, (x1 - lg2 - 24, y0 + 14, x1 - 24, y0 + 44), rayon=9,
                   fond=melange(FOND_PANNEAU, couleur_niv, 0.14),
                   bord=melange(FOND_PANNEAU, couleur_niv, 0.55), largeur_bord=1)
    texte_centre(trace, (x1 - lg2 - 24, y0 + 14, x1 - 24, y0 + 44), niveau, 15, couleur_niv, gras=True)

    libelle = f"DÉFI {defi['id']}"
    lg = largeur_texte(libelle, 16, gras=True) + 26
    boite_arrondie(trace, (x1 - lg2 - 32 - lg, y0 + 14, x1 - lg2 - 32, y0 + 44), rayon=9,
                   fond=melange(FOND_PANNEAU, accent, 0.28),
                   bord=melange(FOND_PANNEAU, accent, 0.75), largeur_bord=1)
    texte_centre(trace, (x1 - lg2 - 32 - lg, y0 + 14, x1 - lg2 - 32, y0 + 44), libelle, 16,
                 melange(accent, TEXTE, 0.35), gras=True)

    # ── titre
    titre = sans_emoji(defi["titre"])
    taille = 34
    while taille > 22 and largeur_texte(titre, taille, gras=True) > (x1 - x0 - 60):
        taille -= 1
    trace.text((x0 + 30, y0 + 58), titre, font=police(taille, True), fill=TEXTE)

    # ── consigne (révélée mot à mot)
    a = _prog(progression_defi, 0.02, 0.20)
    y = y0 + 112
    texte(trace, (x0 + 30, y), "CONSIGNE", 14, TEXTE_3, gras=True)
    y += 24
    if a > 0:
        mots = sans_emoji(defi["consigne"]).split()
        vus = max(1, int(len(mots) * a))
        for ligne in couper_texte(" ".join(mots[:vus]), 20, x1 - x0 - 66):
            trace.text((x0 + 30, y), ligne, font=police(20), fill=TEXTE_2)
            y += 28
    y += 6

    # ── points clés
    a2 = _prog(progression_defi, 0.14, 0.44)
    if a2 > 0:
        texte(trace, (x0 + 30, y), "À RETENIR", 14, TEXTE_3, gras=True)
        y += 26
        total = len(defi["points"])
        vus = max(1, int(total * a2)) if a2 < 1 else total
        y = _puces(trace, x0 + 30, y, x1 - x0 - 66, [sans_emoji(v) for v in defi["points"][:vus]],
                   taille=18, couleur_dot=accent)

    # ── démonstration : sous les points clés, jusqu'au-dessus du résultat
    haut_demo = max(y + 30, y0 + 300)
    zone = (x0 + 22, haut_demo, x1 - 22, y1 - 96)
    texte(trace, (zone[0] + 8, zone[1] - 28), "DÉMONSTRATION", 14, TEXTE_3, gras=True)
    a3 = _prog(progression_defi, 0.26, 0.46)
    if a3 > 0:
        boite_arrondie(trace, zone, rayon=14, fond=FOND, bord=BORDURE, largeur_bord=1)
        dessiner_demo(img, trace, zone, defi["demo"], _prog(progression_defi, 0.30, 0.94) * a3)

    # ── résultat
    a4 = _prog(progression_defi, 0.84, 0.97)
    if a4 > 0:
        rbox = (x0 + 22, y1 - 82, x1 - 22, y1 - 22)
        boite_arrondie(trace, rbox, rayon=12, fond=melange(FOND, VERT, 0.10 * a4),
                       bord=melange(BORDURE, VERT, 0.55 * a4), largeur_bord=2)
        texte(trace, (rbox[0] + 16, rbox[1] + 12), "RÉSULTAT", 13, melange(FOND, VERT, a4), gras=True)
        texte(trace, (rbox[0] + 104, rbox[1] + 9), sans_emoji(defi["resultat"]), 19,
              melange(FOND, TEXTE, a4), mono=True)


def accent_texte(couleur):
    return melange(couleur, TEXTE, 0.35)


# ══════════════════════════════════════════════════════════════════════════
#  Panneau « code » (à droite)
# ══════════════════════════════════════════════════════════════════════════
def panneau_code(trace, box, lignes, etat, memo):
    lignes = [sans_emoji(l) for l in lignes]
    memo = sans_emoji(memo)
    x0, y0, x1, y1 = box
    boite_arrondie(trace, box, rayon=18, fond=FOND_PANNEAU, bord=BORDURE, largeur_bord=2)
    texte(trace, (x0 + 30, y0 + 20), "LE CODE", 19, AMBRE, gras=True)
    trace.line([(x0 + 30, y0 + 46), (x0 + 30 + 130, y0 + 46)], fill=AMBRE, width=2)
    trace.line([(x0 + 30, y0 + 52), (x0 + 30 + 82, y0 + 52)], fill=melange(AMBRE, FOND, 0.55), width=2)

    libelle = "js-37-defis-tt.html"
    lw = largeur_texte(libelle, 16, mono=True) + 30
    boite_arrondie(trace, (x1 - lw - 22, y0 + 16, x1 - 22, y0 + 50), rayon=10,
                   fond=FOND, bord=BORDURE, largeur_bord=2)
    texte_centre(trace, (x1 - lw - 22, y0 + 16, x1 - 22, y0 + 50), libelle, 16, TEXTE_2, mono=True)

    haut = y0 + 74
    bas = y1 - 92
    gouttiere = 64
    trace.rectangle([x0 + 2, haut, x0 + gouttiere, bas], fill=melange(FOND_PANNEAU, FOND, 0.45))
    trace.line([(x0 + gouttiere, haut), (x0 + gouttiere, bas)], fill=BORDURE, width=2)

    curseur = etat.get("curseur", -1.0)
    caracteres = etat.get("caracteres")
    for i, ligne in enumerate(lignes):
        y = haut + 10 + i * LH
        if y + LH > bas + 2:
            break
        actif = abs(i - curseur) < 0.5
        if actif:
            trace.rectangle([x0 + gouttiere + 2, y - 2, x1 - 2, y + LH - 4], fill=ROUGE_LIGNE)
            trace.rectangle([x0 + gouttiere + 2, y - 2, x0 + gouttiere + 6, y + LH - 4], fill=ROUGE_BORD)
        couleur_num = TEXTE_2 if actif else TEXTE_3
        trace.text((x0 + gouttiere - 12, y + 2), str(i + 1).rjust(2), font=police(16, mono=True),
                   fill=couleur_num, anchor="ra")
        vu = i < curseur or (actif and caracteres is None)
        if actif and caracteres is not None:
            contenu = ligne[:caracteres]
        elif vu:
            contenu = ligne
        else:
            contenu = ""
        couleur = TEXTE if not actif else (255, 226, 226)
        if vu and ligne.strip().startswith("//") and not actif:
            couleur = melange(TEXTE_3, VERT, 0.28)
        trace.text((x0 + gouttiere + 20, y), contenu, font=police(TAILLE_CODE, mono=True), fill=couleur)
        if actif and caracteres is not None:
            cx = x0 + gouttiere + 20 + largeur_texte(contenu, TAILLE_CODE, mono=True) + 2
            trace.rectangle([cx, y + 1, cx + 10, y + LH - 6], fill=(255, 200, 150))

    # mémo permanent en bas du panneau
    mbox = (x0 + 22, y1 - 76, x1 - 22, y1 - 22)
    boite_arrondie(trace, mbox, rayon=12, fond=melange(FOND_PANNEAU, AMBRE, 0.06),
                   bord=melange(BORDURE, AMBRE, 0.35), largeur_bord=1)
    texte(trace, (mbox[0] + 14, mbox[1] + 8), "MÉMO", 13, AMBRE, gras=True)
    texte(trace, (mbox[0] + 74, mbox[1] + 7), memo, 16, TEXTE_2, mono=True)


# ══════════════════════════════════════════════════════════════════════════
#  Démonstrations (zone gauche)
# ══════════════════════════════════════════════════════════════════════════
def _cases(trace, x, y, valeurs, larg=74, haut=74, indices=True, surligne=None, apparues=99,
           teinte=None, texte_taille=30):
    valeurs = [sans_emoji(v) for v in valeurs]
    # la police s'adapte aux valeurs longues (« banane »)
    plus_long = max((largeur_texte(v, 34) for v in valeurs), default=0)
    a_echelle = min(1.0, (larg - 18) / plus_long) if plus_long else 1.0
    texte_taille = max(12, int(34 * a_echelle))
    for i, valeur in enumerate(valeurs):
        if i >= apparues:
            break
        bx = x + i * (larg + 10)
        sel = (surligne == i)
        fond = melange(FOND_PANNEAU_2, teinte or BLEU, 0.30 if sel else 0.0)
        bord = melange(BORDURE, teinte or BLEU, 1.0 if sel else 0.35)
        boite_arrondie(trace, (bx, y, bx + larg, y + haut), rayon=12, fond=fond, bord=bord,
                       largeur_bord=3 if sel else 2)
        texte_centre(trace, (bx, y, bx + larg, y + haut), valeur, texte_taille,
                     TEXTE if not sel else melange(TEXTE, teinte or BLEU, 0.35))
        if indices:
            texte_centre(trace, (bx, y + haut, bx + larg, y + haut + 24), f"[{i}]", 15, TEXTE_3, mono=True)


def dessiner_demo(img, trace, box, demo, prog):
    x0, y0, x1, y1 = box
    type_demo = demo["type"]
    w, h = x1 - x0, y1 - y0
    p = _ease(prog)

    if type_demo == "tableau_creer":
        valeurs = demo["valeurs"]
        n = max(1, len(valeurs))
        larg = min(126, int((w - 40 - 12 * (n - 1)) / n))
        apparues = int(1 + p * (len(valeurs) * 1.6))
        _cases(trace, x0 + int((w - n * (larg + 12)) / 2), y0 + 46, valeurs, larg=larg, haut=96,
               apparues=apparues, teinte=(20, 184, 166))
        if p > 0.55:
            texte_centre(trace, (x0, y0 + h - 66, x1, y0 + h - 26), "length = 5", 24,
                         melange(FOND, VERT, _prog(p, 0.55, 0.75)), mono=True)

    elif type_demo == "tableau_indice":
        valeurs = demo["valeurs"]
        n = len(valeurs)
        idx = demo["indice"]
        larg = min(126, int((w - 40 - 12 * (n - 1)) / n))
        sel = idx if p > 0.35 else None
        _cases(trace, x0 + int((w - n * (larg + 12)) / 2), y0 + 46, valeurs, larg=larg, haut=96,
               surligne=sel, teinte=(20, 184, 166))
        if p > 0.35:
            texte_centre(trace, (x0, y0 + h - 110, x1, y0 + h - 72), f"fruits[{idx}] → {valeurs[idx]}", 24,
                         VERT, mono=True)
        if p > 0.72:
            texte_centre(trace, (x0, y0 + h - 72, x1, y0 + h - 34), "fruits[10] → undefined", 21,
                         melange(FOND, (248, 113, 113), _prog(p, 0.72, 0.9)), mono=True)

    elif type_demo == "tableau_ajout":
        base = demo["valeurs"]
        ajout = demo["ajout"]
        n = 4
        larg = min(136, int((w - 40 - 12 * (n - 1)) / n))
        x = x0 + int((w - n * (larg + 12)) / 2)
        ajoute = p > 0.35
        retire = p > 0.70
        valeurs = base + ([ajout] if ajoute and not retire else [])
        teinte = VERT if ajoute and not retire else (248, 113, 113)
        _cases(trace, x, y0 + 46, valeurs, larg=larg, haut=96, teinte=teinte,
               surligne=(len(valeurs) - 1) if ajoute and not retire else (None if not retire else len(valeurs) - 1))
        libelle = "length = 3"
        if ajoute and not retire:
            libelle = "length = 4  (+1)"
        elif retire:
            libelle = "length = 3  (-1)"
        texte_centre(trace, (x0, y0 + h - 76, x1, y0 + h - 36), libelle, 23,
                     VERT if ajoute and not retire else ((248, 113, 113) if retire else TEXTE_3), mono=True)

    elif type_demo == "chaine_aleatoire":
        chaine = demo["chaine"]
        n = len(chaine)
        larg = min(40, int((w - 30) / max(1, n)))
        x = x0 + int((w - n * (larg + 3)) / 2)
        idx = demo["indice"] if p > 0.45 else None
        for i, c in enumerate(chaine):
            bx = x + i * (larg + 3)
            sel = (idx == i)
            if c == " ":
                continue
            boite_arrondie(trace, (bx, y0 + 20, bx + larg, y0 + 58), rayon=6,
                           fond=melange(FOND_PANNEAU_2, AMBRE if sel else BLEU, 0.55 if sel else 0.0),
                           bord=melange(BORDURE, AMBRE if sel else BLEU, 1.0 if sel else 0.30), largeur_bord=2)
            texte_centre(trace, (bx, y0 + 20, bx + larg, y0 + 58), c, 19, TEXTE)
            if sel:
                texte_centre(trace, (bx - 6, y0 + 62, bx + larg + 6, y0 + 84), f"i={i}", 13, AMBRE, mono=True)
        if p > 0.5:
            texte_centre(trace, (x0, y0 + 92, x1, y0 + 128), f"substring({demo['indice']}, {demo['indice'] + 1})", 17,
                         TEXTE_3, mono=True)
        if p > 0.62:
            texte_centre(trace, (x0, y0 + h - 52, x1, y0 + h - 8), f"→  {chaine[demo['indice']]}", 40, AMBRE, gras=True)

    elif type_demo == "entier":
        mn, mx, val = demo["min"], demo["max"], demo["valeur"]
        yy = y0 + 58
        trace.line([(x0 + 24, yy), (x1 - 24, yy)], fill=BORDURE, width=3)
        for v in range(mn, mx + 1, 10):
            xx = x0 + 24 + (x1 - x0 - 48) * (v - mn) / max(1, (mx - mn))
            trace.line([(xx, yy - 7), (xx, yy + 7)], fill=TEXTE_3, width=2)
            trace.text((xx, yy + 12), str(v), font=police(13), fill=TEXTE_3, anchor="ma")
        if p > 0.35:
            xx = x0 + 24 + (x1 - x0 - 48) * (val - mn) / max(1, (mx - mn))
            for k in range(4, 0, -1):
                trace.ellipse([xx - 6 * k, yy - 6 * k, xx + 6 * k, yy + 6 * k],
                              outline=melange(FOND, AMBRE, 0.10 * k), width=2)
            trace.ellipse([xx - 8, yy - 8, xx + 8, yy + 8], fill=AMBRE)
        if p > 0.5:
            texte_centre(trace, (x0, y0 + h - 62, x1, y0 + h - 10), f"n = {val}", 38, AMBRE, gras=True, mono=True)

    elif type_demo == "lettres":
        lettres = demo["lettres"]
        n = 5
        larg = min(62, int((w - 40 - 10 * (n - 1)) / n))
        x = x0 + int((w - n * (larg + 10)) / 2)
        for i, c in enumerate(lettres):
            apparait = p > 0.2 + i * 0.13
            bx = x + i * (larg + 10)
            boite_arrondie(trace, (bx, y0 + 30, bx + larg, y0 + 30 + larg), rayon=10,
                           fond=melange(FOND_PANNEAU_2, VIOLET, 0.25 if apparait else 0.0),
                           bord=melange(BORDURE, VIOLET, 0.9 if apparait else 0.3), largeur_bord=2)
            if apparait:
                texte_centre(trace, (bx, y0 + 30, bx + larg, y0 + 30 + larg), c, 30, TEXTE, mono=True)
        if p > 0.55:
            texte_centre(trace, (x0, y0 + h - 60, x1, y0 + h - 10),
                         "String.fromCharCode(65 → 90)", 17, TEXTE_3, mono=True)

    elif type_demo == "couleur":
        r, g, b = demo["rgb"]
        hexa = demo["hex"]
        cw = int(w * (0.30 + 0.55 * p))
        boite_arrondie(trace, (x0 + 20, y0 + 24, x0 + 20 + cw, y1 - 22), rayon=14, fond=(r, g, b))
        if p > 0.3:
            texte(trace, (x0 + 20, y0 + 24 + 10), hexa, 22, (20, 20, 20) if (r + g + b) > 380 else TEXTE, mono=True)
        if p > 0.55:
            yy = y0 + 34
            for nom, valeur in (("R", r), ("G", g), ("B", b)):
                texte(trace, (x0 + 20 + int(w * 0.42), yy), f"{nom} = {valeur}", 19, TEXTE_2, mono=True)
                xx = x0 + 20 + int(w * 0.42) + 120
                trace.rectangle([xx, yy + 4, xx + 150, yy + 18], fill=BORDURE)
                trace.rectangle([xx, yy + 4, xx + 150 * valeur / 255, yy + 18], fill=AMBRE)
                yy += 34

    elif type_demo == "captcha_couleurs":
        code = demo["code"]
        couleurs = demo["couleurs"]
        n = len(code)
        larg = min(66, int((w - 40 - 10 * (n - 1)) / n))
        x = x0 + int((w - n * (larg + 10)) / 2)
        for i, c in enumerate(code):
            apparait = p > 0.15 + i * 0.09
            bx = x + i * (larg + 10)
            coul = _hex(couleurs[i % len(couleurs)])
            boite_arrondie(trace, (bx, y0 + 22, bx + larg, y0 + 22 + larg), rayon=10, fond=FOND,
                           bord=melange(BORDURE, coul, 0.8 if apparait else 0.3), largeur_bord=2)
            if apparait:
                texte_centre(trace, (bx, y0 + 22, bx + larg, y0 + 22 + larg), c, 30, coul, gras=True, mono=True)
        if p > 0.65:
            box = (x0 + 30, y1 - 62, x1 - 30, y1 - 22)
            boite_arrondie(trace, box, rayon=8, fond=FOND, bord=BORDURE, largeur_bord=2)
            texte(trace, (box[0] + 14, box[1] + 9), "Vérifier  ✓", 17, VERT, gras=True)

    elif type_demo == "captcha_barre":
        code = demo["code"]
        n = len(code)
        larg = min(56, int((w - 40 - 8 * (n - 1)) / n))
        x = x0 + int((w - n * (larg + 8)) / 2)
        yy = y0 + 40
        boite_arrondie(trace, (x - 16, yy - 16, x + n * (larg + 8) + 8, yy + 62), rayon=10, fond=FOND, bord=BORDURE)
        for i, c in enumerate(code):
            bx = x + i * (larg + 8)
            if p > 0.12 + i * 0.07:
                texte_centre(trace, (bx, yy, bx + larg, yy + 46), c, 28, TEXTE, mono=True)
        if p > 0.45:
            angle = math.radians(demo["angle"])
            cx, cy = (x + n * (larg + 8) / 2) - 4, yy + 23
            demi = (n * (larg + 8)) / 2.2
            dx, dy = math.cos(angle) * demi, math.sin(angle) * demi
            trace.line([(cx - dx, cy - dy), (cx + dx, cy + dy)], fill=(248, 113, 113), width=5)
            texte(trace, (x, yy + 76), f"rotate({demo['angle']}deg)", 16, TEXTE_3, mono=True)

    elif type_demo == "captcha_grille":
        grille = demo["grille"]
        V = (52, 211, 153)
        cote = min(72, int((h - 40) / 3))
        x = x0 + int((w - 3 * (cote + 10)) / 2)
        y = y0 + 6
        for i, e in enumerate(grille):
            r, c = divmod(i, 3)
            bx = x + c * (cote + 10)
            by = y + r * (cote + 10)
            velo = (e == "V")
            selectionne = i in demo["velos"] and p > 0.62
            teinte = V if velo else BLEU
            boite_arrondie(trace, (bx, by, bx + cote, by + cote), rayon=8,
                           fond=melange(FOND_PANNEAU_2, teinte, 0.30 if selectionne else 0.0),
                           bord=melange(BORDURE, teinte, 1.0 if selectionne else 0.4),
                           largeur_bord=3 if selectionne else 2)
            texte_centre(trace, (bx, by, bx + cote, by + cote), "V" if velo else e, 24,
                         TEXTE if not selectionne else teinte, gras=velo)
        if p > 0.72:
            texte_centre(trace, (x0, y1 - 32, x1, y1 - 6),
                         "V = vélo  ·  C voiture  ·  A arbre  ·  M maison  ·  P pain  ·  S sac",
                         13, TEXTE_3)

    elif type_demo == "media":
        # ── lecteur audio
        carte = (x0 + 20, y0 + 26, x1 - 20, y0 + 168)
        boite_arrondie(trace, carte, rayon=14, fond=FOND, bord=BORDURE, largeur_bord=2)
        icone(trace, carte[0] + 46, carte[1] + 44, 40, "media", ORANGE)
        texte(trace, (carte[0] + 88, carte[1] + 22), demo["titre"], 19, TEXTE_2, mono=True)

        # barre de lecture
        barre_y = carte[1] + 74
        trace.rectangle([carte[0] + 88, barre_y, carte[2] - 26, barre_y + 8], fill=BORDURE)
        avance = min(1.0, p * 1.15)
        trace.rectangle([carte[0] + 88, barre_y,
                         carte[0] + 88 + (carte[2] - carte[0] - 114) * avance, barre_y + 8], fill=ORANGE)
        trace.ellipse([carte[0] + 82 + (carte[2] - carte[0] - 114) * avance, barre_y - 5,
                       carte[0] + 96 + (carte[2] - carte[0] - 114) * avance, barre_y + 13], fill=ORANGE)

        # temps
        joue = p < 0.5
        total = 2.0
        texte(trace, (carte[0] + 88, barre_y + 18), f"{min(total * avance, total):.1f} s / {total:.0f} s",
              16, TEXTE_3, mono=True)
        etat = "playing" if joue else "paused"
        couleur_etat = VERT if joue else AMBRE
        texte(trace, (carte[2] - 150, barre_y + 18), etat, 16, couleur_etat, mono=True, gras=True)

        # ── boutons play / pause, dessinés (pas d'emoji dans les polices)
        for i, (type_btn, couleur, actif) in enumerate((("play", VERT, joue), ("pause", AMBRE, not joue))):
            bx = x0 + 20 + i * 168
            by = carte[3] + 26
            boite_arrondie(trace, (bx, by, bx + 152, by + 62), rayon=12,
                           fond=melange(FOND_PANNEAU_2, couleur, 0.30 if actif else 0.0),
                           bord=melange(BORDURE, couleur, 1.0 if actif else 0.35), largeur_bord=2)
            cx, cy = bx + 40, by + 31
            if type_btn == "play":
                trace.polygon([(cx - 9, cy - 13), (cx - 9, cy + 13), (cx + 14, cy)],
                              fill=couleur if actif else TEXTE_3)
            else:
                trace.rectangle([cx - 12, cy - 13, cx - 3, cy + 13], fill=couleur if actif else TEXTE_3)
                trace.rectangle([cx + 3, cy - 13, cx + 12, cy + 13], fill=couleur if actif else TEXTE_3)
            texte(trace, (bx + 68, by + 21), type_btn + "()", 18, TEXTE_2 if actif else TEXTE_3, mono=True)

        # ── état de la propriété paused
        if p > 0.45:
            yy = carte[3] + 118
            boite_arrondie(trace, (x0 + 20, yy, x1 - 20, yy + 62), rayon=12,
                           fond=melange(FOND, AMBRE, 0.10), bord=melange(BORDURE, AMBRE, 0.55),
                           largeur_bord=2)
            texte(trace, (x0 + 44, yy + 20), "audio.paused", 20, AMBRE, mono=True, gras=True)
            texte(trace, (x0 + 250, yy + 20), "→", 20, TEXTE_3)
            texte(trace, (x0 + 290, yy + 18), "false" if joue else "true", 24,
                  VERT if joue else AMBRE, mono=True, gras=True)
            texte(trace, (x0 + 400, yy + 21), "true : la lecture est arrêtée", 17, TEXTE_3)


def _hex(couleur):
    if isinstance(couleur, tuple):
        return couleur
    return tuple(int(couleur[i:i + 2], 16) for i in (1, 3, 5))


# ══════════════════════════════════════════════════════════════════════════
#  Fiches de rappel (pleine largeur)
# ══════════════════════════════════════════════════════════════════════════
def _entete_rappel(trace, box, data, accent=AMBRE):
    x0, y0, x1, y1 = box
    texte(trace, (x0 + 44, y0 + 26), data["sur_titre"], 20, accent, gras=True)
    trace.line([(x0 + 44, y0 + 58), (x0 + 44 + 320, y0 + 58)], fill=accent, width=2)
    trace.line([(x0 + 44, y0 + 64), (x0 + 44 + 220, y0 + 64)], fill=melange(accent, FOND, 0.55), width=2)
    titre = sans_emoji(data["titre"])
    taille = 46
    while taille > 28 and largeur_texte(titre, taille, gras=True) > (x1 - x0 - 100):
        taille -= 1
    trace.text((x0 + 44, y0 + 78), titre, font=police(taille, True), fill=TEXTE)
    texte(trace, (x0 + 44, y0 + 142), sans_emoji(data["sous_titre"]), 21, TEXTE_3, mono=True)


def _note_rappel(trace, box, note, a):
    x0, y0, x1, y1 = box
    boxn = (x0 + 44, y1 - 116, x1 - 44, y1 - 32)
    boite_arrondie(trace, boxn, rayon=12, fond=melange(FOND, AMBRE, 0.09 * a),
                   bord=melange(BORDURE, AMBRE, 0.55 * a), largeur_bord=2)
    texte(trace, (boxn[0] + 22, boxn[1] + 22), "À RETENIR  ·  " + sans_emoji(note), 21, melange(FOND, TEXTE, a))


def rappel(img, trace, box, data, prog):
    x0, y0, x1, y1 = box
    boite_arrondie(trace, box, rayon=18, fond=FOND_PANNEAU, bord=BORDURE, largeur_bord=2)
    boite_arrondie(trace, (x0 + 2, y0 + 2, x0 + 9, y1 - 2), rayon=4, fond=AMBRE)
    _entete_rappel(trace, box, data)
    if data["type"] == "tableau":
        _rappel_tableau(trace, box, data, prog)
    elif data["type"] == "math":
        _rappel_math(trace, box, data, prog)
    else:
        _rappel_chaine(trace, box, data, prog)


def _rappel_tableau(trace, box, data, prog):
    x0, y0, x1, y1 = box
    accent = (20, 184, 166)
    valeurs = [sans_emoji(v) for v in data["cases"]]
    n = len(valeurs)
    larg = min(300, int((x1 - x0 - 150 - (n - 1) * 20) / n))
    haut = 150
    x_depart = x0 + (x1 - x0 - (n * larg + (n - 1) * 20)) / 2
    y = y0 + 214

    plus_long = max(largeur_texte(v, 40) for v in valeurs)
    taille_case = max(14, min(40, int(40 * (larg - 24) / plus_long)))

    for i, v in enumerate(valeurs):
        a = _prog(prog, 0.05 + i * 0.07, 0.30 + i * 0.07)
        if a <= 0:
            continue
        bx = x_depart + i * (larg + 20)
        boite_arrondie(trace, (bx, y, bx + larg, y + haut), rayon=16,
                       fond=melange(FOND, melange(FOND_PANNEAU_2, accent, 0.28), a),
                       bord=melange(FOND, accent, a), largeur_bord=3)
        texte_centre(trace, (bx, y, bx + larg, y + haut), v, taille_case, melange(FOND, TEXTE, a))
        texte_centre(trace, (bx, y + haut + 12, bx + larg, y + haut + 48), f"indice {i}",
                     18, melange(FOND, TEXTE_3, a), mono=True)

    y2 = y + haut + 92
    a2 = _prog(prog, 0.30, 0.52)
    if a2 > 0:
        texte(trace, (x0 + 64, y2), "LIRE", 17, AMBRE, gras=True)
        yy = y2 + 34
        for code, expl in data["regles"]:
            texte(trace, (x0 + 64, yy), code, 23, BLEU, mono=True)
            texte(trace, (x0 + 520, yy), "→ " + expl, 23, TEXTE_2)
            yy += 54

    a3 = _prog(prog, 0.52, 0.74)
    if a3 > 0:
        texte(trace, (x0 + 980, y2), "MODIFIER", 17, AMBRE, gras=True)
        yy = y2 + 34
        for code, expl in data["ajout"]:
            texte(trace, (x0 + 980, yy), code, 23, VERT, mono=True)
            texte(trace, (x0 + 980 + 560, yy), "→ " + expl, 21, TEXTE_2)
            yy += 54

    a4 = _prog(prog, 0.74, 0.92)
    if a4 > 0:
        _note_rappel(trace, box, data["note"], a4)


def _rappel_math(trace, box, data, prog):
    x0, y0, x1, y1 = box
    y = y0 + 206
    haut, ecart = 86, 14
    for i, (appel, resultat, expl, memo) in enumerate(data["lignes"]):
        a = _prog(prog, 0.04 + i * 0.06, 0.24 + i * 0.06)
        if a <= 0:
            continue
        yy = y + i * (haut + ecart)
        boite_arrondie(trace, (x0 + 44, yy, x1 - 44, yy + haut), rayon=14,
                       fond=melange(FOND, FOND_PANNEAU_2, a), bord=melange(FOND, BORDURE, a), largeur_bord=1)
        texte(trace, (x0 + 74, yy + 25), appel, 26, melange(FOND, BLEU, a), mono=True)
        texte(trace, (x0 + 660, yy + 23), "→", 24, melange(FOND, TEXTE_3, a))
        texte(trace, (x0 + 710, yy + 17), resultat, 32, melange(FOND, AMBRE, a), gras=True, mono=True)
        texte(trace, (x0 + 1010, yy + 27), expl, 21, melange(FOND, TEXTE_2, a))
        texte(trace, (x1 - 420, yy + 29), memo, 19, melange(FOND, TEXTE_3, a))

    a2 = _prog(prog, 0.46, 0.68)
    if a2 > 0:
        boxf = (x0 + 44, y1 - 196, x1 - 44, y1 - 116)
        boite_arrondie(trace, boxf, rayon=14, fond=melange(FOND, ORANGE, 0.13 * a2),
                       bord=melange(BORDURE, ORANGE, 0.7 * a2), largeur_bord=2)
        texte(trace, (boxf[0] + 24, boxf[1] + 14), "LA FORMULE DE L'ENTIER ALÉATOIRE", 16,
              melange(FOND, AMBRE, a2), gras=True)
        texte(trace, (boxf[0] + 24, boxf[1] + 42), data["formule"], 27, melange(FOND, TEXTE, a2), mono=True)

    a3 = _prog(prog, 0.66, 0.88)
    if a3 > 0:
        yy = y1 - 96
        xx = x0 + 60
        for i, (etape, plage) in enumerate(data["etapes"]):
            texte(trace, (xx, yy), etape, 16, melange(FOND, TEXTE_3, a3), mono=True)
            texte(trace, (xx, yy + 24), plage, 21, melange(FOND, VERT, a3), mono=True, gras=True)
            if i < len(data["etapes"]) - 1:
                texte(trace, (xx + 300, yy + 22), "→", 20, melange(FOND, TEXTE_3, a3))
            xx += 360


def _rappel_chaine(trace, box, data, prog):
    x0, y0, x1, y1 = box
    y = y0 + 208
    a1 = _prog(prog, 0.03, 0.22)
    if a1 > 0:
        texte(trace, (x0 + 44, y), "TRANSFORMER", 17, melange(FOND, AMBRE, a1), gras=True)
    for i, (appel, resultat, expl) in enumerate(data["lignes"]):
        a = _prog(prog, 0.06 + i * 0.05, 0.24 + i * 0.05)
        if a <= 0:
            continue
        yy = y + 40 + i * 54
        texte(trace, (x0 + 64, yy), appel, 24, melange(FOND, BLEU, a), mono=True)
        texte(trace, (x0 + 640, yy), "→", 22, melange(FOND, TEXTE_3, a))
        texte(trace, (x0 + 690, yy - 3), resultat, 27, melange(FOND, VERT, a), gras=True, mono=True)
        texte(trace, (x0 + 960, yy + 3), expl, 20, melange(FOND, TEXTE_3, a))

    a2 = _prog(prog, 0.40, 0.66)
    if a2 > 0:
        cy = y0 + 440
        gauche = (x0 + 44, cy, x0 + 900, cy + 274)
        droite = (x0 + 940, cy, x1 - 44, cy + 274)
        for cote, teinte, infos, exemple in (
                (gauche, BLEU, data["comparaison"]["gauche"], data["exemples"][0]),
                (droite, VIOLET, data["comparaison"]["droite"], data["exemples"][1])):
            titre, expl, note_ = infos
            boite_arrondie(trace, cote, rayon=16, fond=melange(FOND, teinte, 0.10 * a2),
                           bord=melange(BORDURE, teinte, 0.7 * a2), largeur_bord=2)
            texte(trace, (cote[0] + 26, cote[1] + 20), titre, 30, melange(FOND, teinte, a2),
                  mono=True, gras=True)
            texte(trace, (cote[0] + 26, cote[1] + 74), expl, 21, melange(FOND, TEXTE_2, a2))
            texte(trace, (cote[0] + 26, cote[1] + 106), note_, 20, melange(FOND, TEXTE_3, a2))
            texte(trace, (cote[0] + 26, cote[1] + 168), exemple[0], 25, melange(FOND, TEXTE, a2), mono=True)
            texte(trace, (cote[0] + 500, cote[1] + 164), "→ " + exemple[1], 29,
                  melange(FOND, VERT, a2), mono=True, gras=True)
            texte(trace, (cote[0] + 26, cote[1] + 236), exemple[2], 19, melange(FOND, TEXTE_3, a2))

    a3 = _prog(prog, 0.70, 0.9)
    if a3 > 0:
        _note_rappel(trace, box, data["note"], a3)
