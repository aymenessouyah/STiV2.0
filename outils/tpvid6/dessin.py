"""Composants graphiques de la vidéo TP Train.

Réplique des panneaux, pastilles et cartouches des vidéos CSS3 du site.
"""
from __future__ import annotations

import re
from PIL import Image, ImageDraw

from theme import (
    FOND, FOND_PANNEAU, FOND_PANNEAU_2, BORDURE, TEXTE, TEXTE_2, TEXTE_3,
    ORANGE, ORANGE_FONCE, AMBRE, VIOLET, VERT, BLEU, ROSE,
    ROUGE_LIGNE, ROUGE_BORD,
    melange, boite_arrondie, texte, texte_centre, texte_ajuste,
    largeur_texte, couper_texte, police, fleche, degrade_vertical,
)

COULEUR_TYPE = {
    "debut": VERT,
    "fin": VERT,
    "action": AMBRE,
    "decision": VIOLET,
    "entree": BLEU,
}
GLYPH_TYPE = {
    "debut": "▶",
    "fin": "■",
    "action": "▸",
    "decision": "◇",
    "entree": "⌨",
}

# ══════════════════════════════════════════════════════════════════════════
#  En-tête + pastilles de chapitres
# ══════════════════════════════════════════════════════════════════════════
LARGEUR = 1920


def dessiner_entete(img, dessin, titre: str, sous_titre: str):
    # logo carré
    boite_arrondie(dessin, (64, 22, 116, 74), rayon=14,
                   fond=melange(FOND_PANNEAU, ORANGE, 0.16), bord=ORANGE, largeur_bord=2)
    texte_centre(dessin, (64, 22, 116, 74), "AE", 24, ORANGE, gras=True)

    texte(dessin, (132, 26), titre, 30, TEXTE, gras=True)
    texte(dessin, (132, 62), sous_titre, 19, TEXTE_3)

    # badge haut-droit
    libelle = "STI par AE  ·  V2.0"
    larg = largeur_texte(libelle, 19, gras=True) + 74
    x1 = LARGEUR - 64
    boite_arrondie(dessin, (x1 - larg, 28, x1, 70), rayon=21,
                   fond=FOND_PANNEAU, bord=BORDURE, largeur_bord=2)
    texte_centre(dessin, (x1 - larg + 12, 28, x1 - 34, 70), libelle, 19, TEXTE_2, gras=True)
    # mini QR
    qx, qy = x1 - 26, 36
    for i in range(4):
        for j in range(4):
            if (i * 7 + j * 3) % 3:
                dessin.rectangle([qx + i * 5, qy + j * 5, qx + i * 5 + 3, qy + j * 5 + 3], fill=ORANGE)


def dessiner_pastilles(img, dessin, parties, actif: int, y=96, h=52):
    """Barre de pastilles d'étapes : active en dégradé orange, passées en violet."""
    n = len(parties)
    marge, ecart = 64, 10
    larg = (LARGEUR - 2 * marge - ecart * (n - 1)) / n
    for i, p in enumerate(parties):
        x0 = marge + i * (larg + ecart)
        box = (x0, y, x0 + larg, y + h)
        if i == actif:
            # dégradé orange, découpé aux coins arrondis
            w, hh = int(round(larg)), int(h)
            calque = Image.new("RGB", (w, hh), ORANGE)
            degrade_vertical(calque, (0, 0, w, hh), AMBRE, ORANGE_FONCE)
            masque = Image.new("L", (w, hh), 0)
            ImageDraw.Draw(masque).rounded_rectangle([0, 0, w - 1, hh - 1], radius=hh // 2, fill=255)
            img.paste(calque, (int(round(box[0])), int(box[1])), masque)
            couleur_txt = (30, 18, 8)
        elif i < actif:
            boite_arrondie(dessin, box, rayon=h // 2, fond=melange(FOND_PANNEAU, VIOLET, 0.30), bord=VIOLET, largeur_bord=2)
            couleur_txt = (225, 214, 250)
        else:
            boite_arrondie(dessin, box, rayon=h // 2, fond=FOND_PANNEAU, bord=BORDURE, largeur_bord=2)
            couleur_txt = TEXTE_3
        marque = "✓ " if i < actif else ""
        texte_ajuste(dessin, (box[0] + 14, box[1], box[2] - 14, box[3]), marque + p["onglet"],
                     21, 14, couleur_txt, gras=(i == actif))


# ══════════════════════════════════════════════════════════════════════════
#  Ligne 1 : l'énoncé
# ══════════════════════════════════════════════════════════════════════════
ZONE1 = (64, 162, 1856, 404)
ZONE2 = (64, 416, 1856, 1036)


def _segments(contenu):
    """Découpe l'énoncé : `code()` en mono ambre, « citation » en vert."""
    motif = re.compile(r'("[^"]*"|\b[\w.$]+\(\))')
    sortie = []
    for morceau in motif.split(contenu):
        if not morceau:
            continue
        if morceau.startswith('"'):
            sortie.append((morceau, "chaine"))
        elif morceau.endswith("()"):
            sortie.append((morceau, "code"))
        else:
            sortie.append((morceau, "normal"))
    return sortie


def _style(style):
    return {"normal": (TEXTE, False, False),
            "code": (AMBRE, False, True),
            "chaine": (VERT, False, True)}[style]


def dessiner_enonce(img, dessin, partie, numero: str, progression: float, total=6):
    """Ligne 1 : bandeau « ÉNONCÉ » + texte révélé progressivement."""
    x0, y0, x1, y1 = ZONE1
    boite_arrondie(dessin, ZONE1, rayon=18, fond=FOND_PANNEAU, bord=BORDURE, largeur_bord=2)
    # filet orange à gauche
    boite_arrondie(dessin, (x0 + 2, y0 + 2, x0 + 10, y1 - 2), rayon=4, fond=ORANGE)

    texte(dessin, (x0 + 34, y0 + 22), "ÉNONCÉ", 20, AMBRE, gras=True)
    texte(dessin, (x0 + 34 + 108, y0 + 24), f"partie {numero} sur {total}", 18, TEXTE_3)
    # soulignement double des titres (comme les panneaux CSS)
    dessin.line([(x0 + 34, y0 + 50), (x0 + 34 + 96, y0 + 50)], fill=AMBRE, width=2)
    dessin.line([(x0 + 34, y0 + 56), (x0 + 34 + 62, y0 + 56)], fill=melange(AMBRE, FOND, 0.55), width=2)

    texte(dessin, (x0 + 34, y0 + 58), partie["titre"], 32, TEXTE, gras=True)

    # texte de l'énoncé, révélé à gauche → droite
    taille = 25
    dispo = x1 - (x0 + 34) - 372
    lignes = couper_texte(partie["enonce"], taille, dispo)
    total_car = sum(len(l) for l in lignes)
    vus = int(total_car * max(0.0, min(1.0, progression)))
    y = y0 + 106
    compte = 0
    for ligne in lignes:
        if compte >= vus:
            break
        reste = vus - compte
        morceau = ligne[:reste]
        x = x0 + 34
        for contenu, style in _segments(morceau):
            coul, gras, mono = _style(style)
            dessin.text((x, y), contenu, font=police(taille, gras, mono), fill=coul)
            x += largeur_texte(contenu, taille, gras, mono)
        compte += len(ligne)
        y += 37

    # rappel des fonctions de la partie
    fonctions = partie.get("fonctions")
    if fonctions is None:
        fonctions, vues = [], set()
        for l in partie.get("code", []):
            m = re.match(r"\s*function\s+(\w+)", l)
            if m and m.group(1) not in vues:
                vues.add(m.group(1))
                fonctions.append(m.group(1) + "()")
    if fonctions:
        yy = y1 - 40
        texte(dessin, (x0 + 34, yy + 2), "FONCTIONS", 14, TEXTE_3, gras=True)
        xx = x0 + 34 + 106
        for f in fonctions:
            lf = largeur_texte(f, 15, mono=True) + 20
            if xx + lf > x1 - 300:
                break
            boite_arrondie(dessin, (xx, yy - 6, xx + lf, yy + 24), rayon=9,
                           fond=melange(FOND_PANNEAU, AMBRE, 0.10), bord=melange(BORDURE, AMBRE, 0.35), largeur_bord=1)
            texte_centre(dessin, (xx, yy - 6, xx + lf, yy + 24), f, 15, melange(AMBRE, TEXTE, 0.35), mono=True)
            xx += lf + 8

    # compteur à droite
    bx = x1 - 264
    boite_arrondie(dessin, (bx, y0 + 84, x1 - 34, y1 - 26), rayon=14,
                   fond=FOND_PANNEAU_2, bord=BORDURE, largeur_bord=2)
    texte_centre(dessin, (bx, y0 + 92, x1 - 34, y0 + 126), "PARTIE", 16, TEXTE_3, gras=True)
    texte_centre(dessin, (bx, y0 + 122, x1 - 34, y0 + 180), numero, 42, ORANGE, gras=True)
    texte_centre(dessin, (bx + 8, y0 + 180, x1 - 42, y0 + 208), "sur 6", 17, TEXTE_3)


# ══════════════════════════════════════════════════════════════════════════
#  Diagramme
# ══════════════════════════════════════════════════════════════════════════
def disposition(n, largeur_panneau, hauteur_panneau, compact: bool):
    """Renvoie (positions, tailles, colonnes) du diagramme pour un panneau donné."""
    pos, tailles = [], []
    if compact:
        cols, bw, bh, gx, gy = 2, 330, 76, 26, 40
    else:
        cols = min(5, max(1, n))
        bw, bh, gx, gy = 316, 112, 40, 84
    lignes = (n + cols - 1) // cols
    util_w = cols * bw + (cols - 1) * gx
    util_h = lignes * bh + (lignes - 1) * gy
    ox = (largeur_panneau - util_w) / 2
    oy = max(0.0, (hauteur_panneau - util_h) / 2)
    for i in range(n):
        r, c = divmod(i, cols)
        x = ox + c * (bw + gx)
        y = oy + r * (bh + gy)
        pos.append((x, y))
        tailles.append((bw, bh))
    return pos, tailles, cols


def _grille(pos, tailles, cols, i):
    """(ligne, colonne) d'un nœud dans la grille."""
    return divmod(i, cols)


def chemin_entre(pos, tailles, cols, i):
    """Points de passage de la flèche entre le nœud i et le nœud i+1."""
    (x0, y0), (w0, h0) = pos[i], tailles[i]
    (x1, y1), (w1, h1) = pos[i + 1], tailles[i + 1]
    r0, c0 = _grille(pos, tailles, cols, i)
    r1, c1 = _grille(pos, tailles, cols, i + 1)
    if r0 == r1:
        return [(x0 + w0, y0 + h0 / 2), (x1, y1 + h1 / 2)]
    # changement de ligne : coude dans l'espace entre les deux rangées
    gy = max(10.0, y1 - (y0 + h0))
    milieu = y0 + h0 + gy / 2
    return [(x0 + w0 / 2, y0 + h0), (x0 + w0 / 2, milieu),
            (x1 + w1 / 2, milieu), (x1 + w1 / 2, y1)]


def _chemins(pos, tailles, cols):
    return [chemin_entre(pos, tailles, cols, i) for i in range(len(pos) - 1)]


def _polyligne(dessin, pts, progression, couleur, epaisseur=3):
    if progression <= 0:
        return
    longueurs, total = [], 0.0
    for a, b in zip(pts, pts[1:]):
        d = ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2) ** 0.5
        longueurs.append(d)
        total += d
    reste = total * progression
    courant = list(pts[0])
    for (a, b), d in zip(zip(pts, pts[1:]), longueurs):
        if reste <= 0:
            break
        if d == 0:
            continue
        f = min(1.0, reste / d)
        suivant = (a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f)
        dessin.line([courant, suivant], fill=couleur, width=epaisseur, joint="curve")
        courant = list(suivant)
        reste -= d * f
    if progression >= 0.985:
        a, b = pts[-2], pts[-1]
        fleche(dessin, a, b, couleur, epaisseur, 1.0, 14)


def dessiner_esquisse(dessin, box, typ):
    """Emplacement vide (pointillés) d'un nœud pas encore construit."""
    x0, y0, x1, y1 = [int(v) for v in box]
    if typ in ("debut", "fin"):
        x0, x1 = x0 + 40, x1 - 40
        rayon = (y1 - y0) // 2
    else:
        rayon = 14
    # pointillés : petites amorces de bordure
    pas = 14
    coul = melange(FOND_PANNEAU, BORDURE, 0.85)
    for yy in (y0, y1):
        for x in range(x0 + 18, x1 - 18, pas):
            dessin.line([(x, yy), (min(x + 7, x1 - 18), yy)], fill=coul, width=2)
    for xx in (x0, x1):
        for y in range(y0 + 18, y1 - 18, pas):
            dessin.line([(xx, y), (xx, min(y + 7, y1 - 18))], fill=coul, width=2)



def dessiner_noeud(dessin, box, noeud, etat="absent", alpha=1.0, apparition=1.0):
    """etat : absent | attente | courant | fait — apparition : 0 → 1 (pop)."""
    if etat == "absent" or alpha <= 0.02:
        return
    if apparition < 1.0:
        cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
        e = 0.72 + 0.28 * apparition
        demi_w = (box[2] - box[0]) / 2 * e
        demi_h = (box[3] - box[1]) / 2 * e
        box = (cx - demi_w, cy - demi_h, cx + demi_w, cy + demi_h)
    x0, y0, x1, y1 = box
    typ, titre, precision = noeud
    coul = COULEUR_TYPE[typ]
    if typ in ("debut", "fin"):
        rayon = (y1 - y0) / 2
        x0, x1 = x0 + 40, x1 - 40
        box = (x0, y0, x1, y1)
    else:
        rayon = 14

    if etat == "attente":
        fond = melange(FOND_PANNEAU, FOND_PANNEAU_2, 0.5)
        boite_arrondie(dessin, box, rayon=rayon, fond=fond, bord=melange(FOND_PANNEAU, BORDURE, 0.75), largeur_bord=2)
        tx0 = x0 + 46
        dessin.text((tx0, y0 + 16), titre, font=police(19, True), fill=TEXTE_3)
        if precision:
            dessin.text((tx0, y0 + 40), precision, font=police(14), fill=melange(TEXTE_3, FOND, 0.45))
        return

    fond = FOND_PANNEAU_2 if etat != "courant" else melange(FOND_PANNEAU_2, coul, 0.22)
    fond = melange(FOND, fond, alpha)
    if etat == "courant":
        for k in range(3, 0, -1):
            halo = melange(FOND, coul, 0.10 * k)
            boite_arrondie(dessin, (x0 - 4 * k, y0 - 4 * k, x1 + 4 * k, y1 + 4 * k),
                           rayon=rayon + 4 * k, fond=None, bord=halo, largeur_bord=2)
    bord = melange(FOND, coul, alpha if etat != "fait" else alpha * 0.75)
    boite_arrondie(dessin, box, rayon=rayon, fond=fond, bord=bord,
                   largeur_bord=3 if etat == "courant" else 2)

    # étiquette de type
    marge = 14
    titre_coul = melange(FOND, TEXTE if etat != "fait" else TEXTE_2, alpha)
    prec_coul = melange(FOND, TEXTE_3, alpha)
    if typ in ("debut", "fin"):
        texte_centre(dessin, box, titre, 22, melange(FOND, coul, alpha), gras=True)
        return
    icx = x0 + 26
    icy = (y0 + y1) / 2
    coche = etat == "fait"
    teinte = VERT if coche else coul
    dessin.ellipse([icx - 13, icy - 13, icx + 13, icy + 13],
                   fill=melange(FOND, teinte, 0.18 * alpha), outline=melange(FOND, teinte, alpha), width=2)
    texte_centre(dessin, (icx - 13, icy - 13, icx + 13, icy + 13), "✓" if coche else GLYPH_TYPE.get(typ, "•"),
                 15, melange(FOND, teinte, alpha))
    tx = x0 + 48
    dispo = (x1 - 12) - tx
    taille_t = 21
    while taille_t > 14 and largeur_texte(titre, taille_t, True) > dispo:
        taille_t -= 1
    dessin.text((tx, y0 + 16), titre, font=police(taille_t, True), fill=titre_coul)
    if precision:
        taille_p = 15
        while taille_p > 11 and largeur_texte(precision, taille_p) > dispo:
            taille_p -= 1
        vu = precision
        while vu and largeur_texte(vu + "…", taille_p) > dispo:
            vu = vu[:-1]
        if vu != precision:
            vu = vu.rstrip() + "…"
        dessin.text((tx, y0 + 16 + taille_t + 6), vu, font=police(taille_p), fill=prec_coul)


def dessiner_diagramme(img, dessin, partie, box, etat_diagramme):
    """etat_diagramme : dict(liste des nœuds, progression de chaque flèche, états)."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    boite_arrondie(dessin, box, rayon=18, fond=FOND_PANNEAU, bord=BORDURE, largeur_bord=2)
    texte(dessin, (x0 + 22, y0 + 16), "DIAGRAMME", 19, AMBRE, gras=True)
    dessin.line([(x0 + 22, y0 + 42), (x0 + 22 + 118, y0 + 42)], fill=AMBRE, width=2)
    dessin.line([(x0 + 22, y0 + 48), (x0 + 22 + 74, y0 + 48)], fill=melange(AMBRE, FOND, 0.55), width=2)

    interieur = (x0 + 16, y0 + 62, x1 - 16, y1 - 16)
    iw, ih = interieur[2] - interieur[0], interieur[3] - interieur[1]
    pos, tailles, cols = disposition(len(partie["noeuds"]), iw, ih, compact=etat_diagramme["compact"])
    # décalage vers l'intérieur du panneau
    pos = [(px + interieur[0], py + interieur[1]) for px, py in pos]

    sous = Image.new("RGB", (int(iw), int(ih)), FOND_PANNEAU)
    sub = ImageDraw.Draw(sous)
    chemins = _chemins(pos, tailles, cols)
    decal = [(px - interieur[0], py - interieur[1]) for px, py in pos]

    for i, pts in enumerate(chemins):
        prog = etat_diagramme["fleches"][i]
        if prog > 0:
            pts_loc = [(p[0] - interieur[0], p[1] - interieur[1]) for p in pts]
            _polyligne(sub, pts_loc, prog, melange(FOND_PANNEAU, BORDURE, 1.0), 3)
            etat_suivant = etat_diagramme["etats"][i + 1]
            if prog > 0.4 and etat_suivant in ("courant", "fait"):
                _polyligne(sub, pts_loc, prog, melange(FOND_PANNEAU, ORANGE, 0.55), 3)

    for i, noeud in enumerate(partie["noeuds"]):
        px, py = decal[i]
        bw, bh = tailles[i]
        dessiner_noeud(sub, (px, py, px + bw, py + bh), noeud,
                       etat_diagramme["etats"][i], etat_diagramme.get("alpha", [1.0] * len(pos))[i])

    if etat_diagramme.get("vide"):
        texte_centre(sub, (0, 0, iw, ih), "le diagramme se construit ici", 26, TEXTE_3)

    img.paste(sous, (int(interieur[0]), int(interieur[1])))
    return pos, tailles, cols


# ══════════════════════════════════════════════════════════════════════════
#  Ligne 2 : panneau de code
# ══════════════════════════════════════════════════════════════════════════
LH = 27
TAILLE_CODE = 19


def dessiner_code(img, dessin, box, lignes, etat, titre="script.js"):
    """etat : dict(curseur=float (ligne), caracteres=int, defilement=float, surlignes=[int])"""
    x0, y0, x1, y1 = box
    boite_arrondie(dessin, box, rayon=18, fond=FOND_PANNEAU, bord=BORDURE, largeur_bord=2)
    texte(dessin, (x0 + 22, y0 + 16), "LE CODE, PAS À PAS", 19, AMBRE, gras=True)
    dessin.line([(x0 + 22, y0 + 42), (x0 + 22 + 210, y0 + 42)], fill=AMBRE, width=2)
    dessin.line([(x0 + 22, y0 + 48), (x0 + 22 + 132, y0 + 48)], fill=melange(AMBRE, FOND, 0.55), width=2)

    # pastille nom de fichier
    lw = largeur_texte(titre, 17, mono=True) + 34
    boite_arrondie(dessin, (x1 - lw - 20, y0 + 14, x1 - 20, y0 + 52), rayon=10,
                   fond=FOND, bord=BORDURE, largeur_bord=2)
    texte_centre(dessin, (x1 - lw - 20, y0 + 14, x1 - 20, y0 + 52), titre, 17, TEXTE_2, mono=True)

    haut = y0 + 66
    bas = y1 - 16
    gouttiere = 62
    visible = int((bas - haut) // LH)
    curseur = etat["curseur"]
    # défilement : garde la ligne active au centre de la fenêtre
    cible = max(0.0, curseur - visible / 2.0)
    cible = min(cible, max(0.0, len(lignes) - visible))
    defilement = etat.get("defilement", cible)
    defilement = max(0.0, min(defilement, max(0.0, len(lignes) - visible + 1)))

    # fond de la gouttière
    dessin.rectangle([x0 + 2, haut, x0 + gouttiere, bas], fill=melange(FOND_PANNEAU, FOND, 0.45))
    dessin.line([(x0 + gouttiere, haut), (x0 + gouttiere, bas)], fill=BORDURE, width=2)

    premiere = int(defilement)
    offset = (defilement - premiere) * LH
    for k in range(visible + 1):
        idx = premiere + k
        if idx >= len(lignes):
            break
        y = haut + k * LH - offset
        if y < haut - 2 or y + LH > bas + 2:
            continue
        actif = abs(idx - curseur) < 0.5 and etat.get("surligne", True)
        if actif:
            dessin.rectangle([x0 + gouttiere + 2, y, x1 - 2, y + LH - 1], fill=ROUGE_LIGNE)
            dessin.rectangle([x0 + gouttiere + 2, y, x0 + gouttiere + 6, y + LH - 1], fill=ROUGE_BORD)
        num_coul = TEXTE_2 if actif else (TEXTE_3 if idx % 5 else melange(TEXTE_3, BORDURE, 0.5))
        dessin.text((x0 + gouttiere - 12, y + 3), str(idx + 1).rjust(2), font=police(17, mono=True),
                    fill=num_coul, anchor="ra")
        contenu = lignes[idx]
        if actif and etat.get("caracteres") is not None:
            contenu = contenu[:etat["caracteres"]]
        couleur = TEXTE if not actif else (255, 226, 226)
        if idx < curseur and contenu.strip().startswith("//"):
            couleur = melange(TEXTE_3, VERT, 0.35) if not actif else couleur
        dessin.text((x0 + gouttiere + 18, y + 2), contenu, font=police(TAILLE_CODE, mono=True), fill=couleur)
        if actif and etat.get("curseur_visible", True) and etat.get("caracteres") is not None:
            cx = x0 + gouttiere + 18 + largeur_texte(contenu, TAILLE_CODE, mono=True) + 2
            dessin.rectangle([cx, y + 3, cx + 11, y + LH - 4], fill=(255, 200, 150))
    return visible


# ══════════════════════════════════════════════════════════════════════════
#  Pied : barre de progression
# ══════════════════════════════════════════════════════════════════════════
def dessiner_progression(dessin, t, total):
    y = 1052
    dessin.rectangle([64, y, LARGEUR - 64, y + 8], fill=melange(FOND, BORDURE, 0.9))
    f = max(0.0, min(1.0, t / max(0.001, total)))
    if f > 0:
        dessin.rectangle([64, y, 64 + (LARGEUR - 128) * f, y + 8], fill=ORANGE)
        x = 64 + (LARGEUR - 128) * f
        dessin.ellipse([x - 7, y - 3, x + 7, y + 11], fill=AMBRE)


def dessiner_aide_clavier(dessin, y=1044):
    texte(dessin, (LARGEUR - 64, y - 4), "TP Train · Série 6 · JavaScript", 17, TEXTE_3, ancre="ra")
