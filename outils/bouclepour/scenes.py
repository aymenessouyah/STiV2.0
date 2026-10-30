"""Les dix scènes de « La boucle Pour — l'immeuble et le sac ».

Chaque fonction reçoit le dessin, l'avancement `p` (0 → 1) de la séquence et le
temps absolu `t`. À gauche l'histoire (l'immeuble et son ascenseur, le sac),
à droite ce que j'écris — comme dans les autres capsules du site.

La progression pédagogique est volontairement lente :

 1. `probleme`    l'immeuble, le tableau T, la somme cherchée ;
 2. `variable`    le sac : un nom fixe, un contenu qui change ;
 3. `nom`         plusieurs sacs → un seul nom, S ;
 4. `accumuler`   `S = S + …` : lire, ajouter, réécrire ;
 5. `immeuble`    l'ascenseur : le même geste à chaque étage ;
 6. `etage0`      le premier tour, à la main ;
 7. `repetition`  les étages 1, 2, 3 : quatre fois la même ligne ;
 8. `pourquoi`    sans boucle : une ligne par étage — 100 étages, 100 lignes ;
 9. `bloc`        le geste une seule fois, avec le compteur ;
10. `boucle`      la boucle Pour, et la somme : 22.
"""
from __future__ import annotations

import math

from PIL import ImageDraw

from theme import (
    FOND, FOND_PANNEAU, FOND_PANNEAU_2, BORDURE, TEXTE, TEXTE_2, TEXTE_3,
    ORANGE, ORANGE_FONCE, AMBRE, VIOLET, VERT, BLEU, ROSE, ROUGE_BORD,
    police, melange, boite_arrondie, texte, largeur_texte, texte_centre,
    couper_texte, fleche,
)
import dessin as G
from dessin import (
    LARGEUR, HAUTEUR, MARGE, PANEL_G, PANEL_D, BANDE,
    sac, immeuble, personnage, jeton, cahier, cadre_code, boite_memoire,
    pile_lignes, boucle_schema, bandeau_etat, bulle, coche, panneau, entete,
    etape_pastille, Ligne, _ease, _ease_out, _apparait, VALEURS, SOMME_TOTALE,
    N_ETAGES,
)

TOTAL = 10


# ══════════════════════════════════════════════════════════════════════════
#  Petits utilitaires communs
# ══════════════════════════════════════════════════════════════════════════
def _somme(jusqua: int) -> int:
    """La somme des étages déjà ramassés (0 → aucun)."""
    return sum(VALEURS[:max(0, jusqua)])


def _etat(d, indice=None, somme=0, compteur=None, connue=True, t=0.0):
    bandeau_etat(d, indice=indice, somme=somme, compteur=compteur, t=t, somme_connue=connue)


def _entete(d, titre, etape, chapitre):
    entete(d, titre, etape, TOTAL, chapitre)


def _panneaux(d, titre_gauche, titre_droite="ce que j'écris"):
    panneau(d, PANEL_G, titre_gauche, accent=melange(BORDURE, ORANGE, 0.35))
    cadre_code(d, PANEL_D, titre_droite)


def _carte(d, box, titre=None, accent=BORDURE, a=1.0):
    """Une carte arrondie posée dans le panneau (avec un titre optionnel)."""
    if a <= 0.01:
        return
    boite_arrondie(d, box, rayon=18,
                   fond=melange(FOND_PANNEAU, melange(FOND_PANNEAU_2, accent, 0.06), a),
                   bord=melange(BORDURE, accent, 0.55 * a), largeur_bord=2)
    if titre:
        x0, y0, _, _ = box
        d.text((x0 + 22, y0 + 18), titre, font=police(18, True),
               fill=melange(TEXTE_3, accent, 0.55 * a))


def _legende(d, x, y, contenu, taille=19, couleur=TEXTE_3, ancre="mm"):
    d.text((x, y), contenu, font=police(taille), fill=couleur, anchor=ancre)


def _formule(d, cx, cy, gauche="S", operateur="=", droite="S + T[0]",
             taille=44, accent_gauche=ORANGE, accent_droit=BLEU, echelle=1.0):
    """Écrit `S = S + T[0]` en colorant les deux S différemment."""
    f = police(int(taille * echelle), True, mono=True)
    larg_g = f.getlength(gauche)
    larg_o = f.getlength(" " + operateur + " ")
    larg_d = f.getlength(droite)
    total = larg_g + larg_o + larg_d
    x = cx - total / 2
    d.text((x, cy), gauche, font=f, fill=accent_gauche, anchor="lm")
    d.text((x + larg_g, cy), " " + operateur + " ", font=f, fill=TEXTE_3, anchor="lm")
    d.text((x + larg_g + larg_o, cy), droite, font=f, fill=accent_droit, anchor="lm")


# ══════════════════════════════════════════════════════════════════════════
#  1 · Le problème : quatre étages, quatre cases, une somme
# ══════════════════════════════════════════════════════════════════════════
def scene_probleme(d, p, t):
    _entete(d, "La boucle Pour — de la variable à la boucle", 1,
            "1 · Le problème : la somme des quatre étages")
    _panneaux(d, "le problème")

    # l'immeuble, qui se dresse
    k = _apparait(p, 0.02, 0.25)
    immeuble(d, [104, 300 - 26 * (1 - k), 704, 826], cabine=None, actif=None, t=t,
             fenetres=True)
    _legende(d, 404, 858, "quatre étages · quatre cases du tableau", 20)

    # le tableau, à droite
    boite = [744, 300, 1046, 604]
    a = _apparait(p, 0.22, 0.2)
    _carte(d, boite, "le tableau T", AMBRE, a)
    if a > 0:
        cx = boite[0] + 46
        for i, v in enumerate(VALEURS):
            ak = _apparait(p, 0.26 + 0.07 * i, 0.12)
            if ak <= 0:
                continue
            boite_arrondie(d, [cx - 30, 372, cx + 30, 434], rayon=10,
                           fond=melange((24, 34, 52), AMBRE, 0.14 * ak),
                           bord=melange(BORDURE, AMBRE, 0.65 * ak), largeur_bord=2)
            d.text((cx, 404), str(v), font=police(30, True, mono=True),
                   fill=melange(FOND, TEXTE, ak), anchor="mm")
            d.text((cx, 452), f"T[{i}]", font=police(15, True, mono=True),
                   fill=melange(FOND, AMBRE, 0.75 * ak), anchor="mm")
            cx += 68

        af = _apparait(p, 0.56, 0.16)
        if af > 0:
            d.text((895, 506), "S = T[0] + T[1] + T[2] + T[3]", font=police(17, True, mono=True),
                   fill=melange(FOND, TEXTE, af), anchor="mm")
            d.text((895, 560), "S = ?", font=police(34, True, mono=True),
                   fill=melange(FOND, ORANGE, af), anchor="mm")

    if p > 0.72:
        ak = _apparait(p, 0.72, 0.16)
        boite_arrondie(d, [744, 640, 1046, 700], rayon=14,
                       fond=melange(FOND_PANNEAU, ORANGE, 0.16 * ak),
                       bord=melange(BORDURE, ORANGE, 0.8 * ak), largeur_bord=2)
        d.text((895, 670), "comment m'y prendre ?", font=police(21, True),
               fill=melange(FOND, ORANGE, ak), anchor="mm")

    lignes = [
        Ligne("LE PROBLÈME", AMBRE, 26, gras=True, mono=False, a_partir_de=0.04),
        Ligne("quatre étages :", TEXTE, 30, mono=False, a_partir_de=0.12),
        Ligne("4 · 7 · 2 · 9", TEXTE, 30, retrait=18, a_partir_de=0.20),
        Ligne("", a_partir_de=0.3),
        Ligne("ça s'appelle un tableau", TEXTE_2, 25, mono=False, a_partir_de=0.34),
        Ligne("T = [4, 7, 2, 9]", AMBRE, 30, a_partir_de=0.46),
        Ligne("", a_partir_de=0.5),
        Ligne("ce que je cherche :", TEXTE_2, 25, mono=False, a_partir_de=0.56),
        Ligne("la somme, dans S", ORANGE, 30, gras=True, mono=False, a_partir_de=0.66),
        Ligne("S = T[0]+T[1]+T[2]+T[3]", TEXTE, 24, a_partir_de=0.76),
    ]
    cahier(d, PANEL_D, lignes, p)
    _etat(d, connue=False, t=t)


# ══════════════════════════════════════════════════════════════════════════
#  2 · La variable : un nom, un contenu qui change
# ══════════════════════════════════════════════════════════════════════════
def scene_variable(d, p, t):
    _entete(d, "La boucle Pour — de la variable à la boucle", 2,
            "2 · Une variable : un nom, un contenu qui change")
    _panneaux(d, "l'histoire")

    # le sac, dont le contenu change (rien → 4 → 7)
    if p < 0.30:
        contenu, valeur, legende = (), "vide", "contenu : rien"
    elif p < 0.50:
        contenu, valeur, legende = (str(VALEURS[0]),), str(VALEURS[0]), f"contenu : {VALEURS[0]}"
    else:
        contenu, valeur, legende = (str(VALEURS[1]),), str(VALEURS[1]), f"contenu : {VALEURS[1]}"

    bascule = 0.0
    if 0.28 < p < 0.36:
        bascule = 1 - abs((p - 0.32) / 0.04)
    if 0.48 < p < 0.56:
        bascule = 1 - abs((p - 0.52) / 0.04)
    sac(d, 292, 540, contenu=contenu, nom=None, echelle=1.0,
        halo=0.45 + 0.35 * G._pulse(t, 2.1), secousse=bascule * 0.6, legende=legende)

    # l'ancienne valeur s'échappe du sac quand on la remplace
    if 0.30 < p < 0.44:
        a = (p - 0.30) / 0.14
        jeton(d, 300 + 60 * a, 600 - 90 * a, str(VALEURS[0]),
              couleur=melange(TEXTE_3, ROUGE_BORD, 0.4), echelle=0.7)
        _legende(d, 300 + 60 * a, 640 - 90 * a, "avant", 16, TEXTE_3)

    # la carte de la variable
    a = _apparait(p, 0.42, 0.2)
    historique = []
    if p > 0.62:
        historique = [("vide", None)]
    if p > 0.72:
        historique.append((str(VALEURS[0]), None))
    boite_memoire(d, [590, 360, 1030, 700], nom="?", valeur=valeur if p > 0.42 else "?",
                  historique=historique, a=a, t=t)

    if p > 0.78:
        ak = _apparait(p, 0.78, 0.18)
        boite_arrondie(d, [590, 726, 1030, 786], rayon=14,
                       fond=melange(FOND_PANNEAU, VIOLET, 0.16 * ak),
                       bord=melange(BORDURE, VIOLET, 0.8 * ak), largeur_bord=2)
        d.text((810, 756), "c'est ça, une variable", font=police(24, True),
               fill=melange(FOND, VIOLET, ak), anchor="mm")

    lignes = [
        Ligne("UNE CASE MÉMOIRE", VIOLET, 24, gras=True, mono=False, a_partir_de=0.02),
        Ligne("un sac :", TEXTE, 30, mono=False, a_partir_de=0.08),
        Ligne("un nom + une valeur", TEXTE, 26, retrait=18, a_partir_de=0.16),
        Ligne("", a_partir_de=0.24),
        Ligne("au début : vide", TEXTE_2, 26, mono=False, a_partir_de=0.30),
        Ligne("puis je mets 4 → 7", TEXTE_2, 26, mono=False, a_partir_de=0.50),
        Ligne("", a_partir_de=0.6),
        Ligne("même sac · autre contenu", AMBRE, 25, mono=False, a_partir_de=0.70),
        Ligne("le nom reste,", VERT, 28, gras=True, mono=False, a_partir_de=0.84),
        Ligne("la valeur bouge", VERT, 28, gras=True, mono=False, a_partir_de=0.88),
    ]
    cahier(d, PANEL_D, lignes, p)
    _etat(d, connue=False, t=t)


# ══════════════════════════════════════════════════════════════════════════
#  3 · Le nom : plusieurs sacs, un seul S
# ══════════════════════════════════════════════════════════════════════════
def scene_nom(d, p, t):
    _entete(d, "La boucle Pour — de la variable à la boucle", 3,
            "3 · Un nom : S, le même jusqu'à la fin")
    _panneaux(d, "l'histoire")

    positions = (232, 528, 824)
    legendes = ("le sac de l'étage 0", "le sac de l'étage 1", "mon sac à moi")
    contenus = ((str(VALEURS[0]),), (str(VALEURS[1]),), ())

    for i, cx in enumerate(positions):
        a = _apparait(p, 0.04 + 0.09 * i, 0.18)
        if a <= 0:
            continue
        nom = "S" if (i == 2 and p > 0.62) else ("?" if i < 2 else None)
        halo = 0.2 + 0.5 * (1 - abs(p - 0.62) * 4) if i == 2 and 0.50 < p < 0.74 else 0.0
        sac(d, cx, 604, contenu=contenus[i], nom=nom, echelle=0.78,
            halo=max(0.0, halo), legende=None)
        d.text((cx, 748), legendes[i], font=police(18), fill=TEXTE_3, anchor="mm")

    # la question, puis la réponse
    if p < 0.46:
        bulle(d, [300, 288, 940, 392], ["« le sac »… lequel ?"], min(1.0, 0.4 + p),
              accent=ROSE, taille=26)
    if p > 0.62:
        a = _apparait(p, 0.62, 0.16)
        d.text((812, 300), "un seul nom : S", font=police(32, True),
               fill=melange(FOND, AMBRE, a), anchor="mm")
        d.text((812, 344), "le même dans tout le programme", font=police(19),
               fill=melange(FOND, TEXTE_2, a), anchor="mm")
        # la flèche qui désigne le bon sac
        fleche(d, (1046 - 220, 372), (824, 500), couleur=melange(FOND, AMBRE, a),
               progression=a)

    lignes = [
        Ligne("PLUSIEURS SACS", ROSE, 24, gras=True, mono=False, a_partir_de=0.02),
        Ligne("un par étage,", TEXTE, 29, mono=False, a_partir_de=0.08),
        Ligne("un par habitant", TEXTE, 29, mono=False, a_partir_de=0.14),
        Ligne("", a_partir_de=0.2),
        Ligne("« le sac » ? lequel ?", TEXTE_2, 25, mono=False, a_partir_de=0.26),
        Ligne("l'ordinateur ne devine pas", TEXTE_3, 22, mono=False, a_partir_de=0.36),
        Ligne("", a_partir_de=0.44),
        Ligne("alors : une étiquette", AMBRE, 25, mono=False, a_partir_de=0.50),
        Ligne("S", AMBRE, 44, gras=True, a_partir_de=0.64),
        Ligne("S comme somme", VERT, 25, mono=False, a_partir_de=0.74),
        Ligne("quand j'écris S,", TEXTE, 24, mono=False, a_partir_de=0.84),
        Ligne("c'est CE sac-là", VERT, 26, gras=True, mono=False, a_partir_de=0.90),
    ]
    cahier(d, PANEL_D, lignes, p)
    _etat(d, connue=False, t=t)


# ══════════════════════════════════════════════════════════════════════════
#  4 · S = S + … : lire, ajouter, réécrire
# ══════════════════════════════════════════════════════════════════════════
def scene_accumuler(d, p, t):
    _entete(d, "La boucle Pour — de la variable à la boucle", 4,
            "4 · S = S + … : lire, ajouter, réécrire")
    _panneaux(d, "l'histoire")

    # la formule, en haut
    _carte(d, [96, 240, 1040, 360], "l'idée la plus importante", ORANGE,
           _apparait(p, 0.02, 0.18))
    af = _apparait(p, 0.06, 0.2)
    if af > 0:
        _formule(d, 568, 312, taille=42, droite="S + quelque chose", echelle=af)
        a1 = _apparait(p, 0.42, 0.14)
        if a1 > 0:
            d.text((520, 372), "la NOUVELLE valeur", font=police(17, True),
                   fill=melange(FOND, ORANGE, a1), anchor="mm")
            d.text((760, 372), "l'ANCIENNE valeur", font=police(17, True),
                   fill=melange(FOND, BLEU, a1), anchor="mm")
            fleche(d, (520, 352), (466, 330), couleur=melange(FOND, ORANGE, a1), progression=a1)
            fleche(d, (760, 352), (800, 330), couleur=melange(FOND, BLEU, a1), progression=a1)

    # le sac, et sa valeur qui monte
    if p < 0.34:
        contenu, valeur = (), 0
    elif p < 0.62:
        contenu, valeur = (str(VALEURS[0]),), VALEURS[0]
    else:
        contenu, valeur = (str(VALEURS[0]), str(VALEURS[1])), VALEURS[0] + VALEURS[1]

    sac(d, 300, 600, contenu=contenu, nom="S", echelle=0.9,
        halo=0.35 + 0.4 * G._pulse(t, 1.9))
    _legende(d, 300, 748, "le sac, c'est la mémoire", 18)

    # les trois gestes, à droite
    gestes = [
        ("lire S", f"{valeur if p > 0.60 else (VALEURS[0] if p > 0.34 else 0)}", BLEU),
        ("ajouter", f"+ {VALEURS[1] if p > 0.60 else VALEURS[0]}", AMBRE),
        ("écrire dans S", f"→ {valeur}", ORANGE),
    ]
    y = 430
    for i, (titre_, detail, couleur) in enumerate(gestes):
        a = _apparait(p, 0.12 + 0.16 * i, 0.16)
        if a <= 0:
            continue
        boite_arrondie(d, [560, y, 1030, y + 112], rayon=16,
                       fond=melange(FOND_PANNEAU, couleur, 0.10 * a),
                       bord=melange(BORDURE, couleur, 0.7 * a), largeur_bord=2)
        etape_pastille(d, 604, y + 56, i + 1, couleur=couleur, echelle=1.1)
        d.text((650, y + 40), titre_, font=police(24, True), fill=melange(FOND, TEXTE, a))
        d.text((650, y + 74), "S  " + detail if i < 2 else "S  " + detail,
               font=police(22, True, mono=True), fill=melange(FOND, couleur, a))
        y += 132

    lignes = [
        Ligne("LIRE · AJOUTER · ÉCRIRE", BLEU, 22, gras=True, mono=False, a_partir_de=0.02),
        Ligne("S = S + quelque chose", TEXTE, 27, a_partir_de=0.10),
        Ligne("", a_partir_de=0.2),
        Ligne("S à droite : l'ancienne", TEXTE_2, 23, mono=False, a_partir_de=0.44),
        Ligne("valeur", TEXTE_2, 23, mono=False, a_partir_de=0.48),
        Ligne("S à gauche : la nouvelle", ORANGE, 23, mono=False, a_partir_de=0.60),
        Ligne("", a_partir_de=0.7),
        Ligne("0 + 4 = 4", VERT, 27, a_partir_de=0.74),
        Ligne("4 + 7 = 11", VERT, 27, a_partir_de=0.86),
    ]
    cahier(d, PANEL_D, lignes, p)
    _etat(d, somme=valeur, connue=True, compteur=None, t=t)


# ══════════════════════════════════════════════════════════════════════════
#  5 · L'immeuble et l'ascenseur : le même geste à chaque étage
# ══════════════════════════════════════════════════════════════════════════
def scene_immeuble(d, p, t):
    _entete(d, "La boucle Pour — de la variable à la boucle", 5,
            "5 · L'immeuble et l'ascenseur")
    _panneaux(d, "l'histoire")

    actif = 0 if p > 0.58 else None
    immeuble(d, [104, 300, 630, 826], actif=actif, cabine=0.0, ouvert=_apparait(p, 0.66, 0.16),
             t=t)

    # la question
    if p < 0.52:
        bulle(d, [664, 330, 1036, 452], ["à chaque étage,", "qu'est-ce que je fais ?"],
              min(1.0, 0.3 + p * 1.4), accent=ROSE, taille=25)
    else:
        a = _apparait(p, 0.52, 0.16)
        _carte(d, [664, 320, 1036, 620], "le geste, toujours le même", VERT, a)
        gestes = [("ouvrir la porte", AMBRE), ("prendre la valeur", AMBRE), ("l'ajouter dans S", VERT)]
        y = 400
        for i, (intitule, couleur) in enumerate(gestes):
            ai = _apparait(p, 0.56 + 0.07 * i, 0.12)
            if ai <= 0:
                continue
            etape_pastille(d, 706, y + 18, i + 1, couleur=couleur)
            d.text((740, y + 18), intitule, font=police(23),
                   fill=melange(FOND, TEXTE, ai), anchor="lm")
            y += 66

    if p > 0.78:
        a = _apparait(p, 0.78, 0.16)
        d.text((850, 660), "quatre étages · quatre fois le même geste",
               font=police(19), fill=melange(FOND, TEXTE_2, a), anchor="mm")

    lignes = [
        Ligne("L'IMMEUBLE", AMBRE, 24, gras=True, mono=False, a_partir_de=0.02),
        Ligne("j'ai mon sac,", TEXTE, 28, mono=False, a_partir_de=0.08),
        Ligne("j'ai mon tableau", TEXTE, 28, mono=False, a_partir_de=0.14),
        Ligne("", a_partir_de=0.2),
        Ligne("il reste à monter", TEXTE_2, 25, mono=False, a_partir_de=0.26),
        Ligne("→ l'ascenseur", BLEU, 28, gras=True, mono=False, a_partir_de=0.36),
        Ligne("", a_partir_de=0.46),
        Ligne("toujours le même geste :", TEXTE_2, 23, mono=False, a_partir_de=0.54),
        Ligne("prendre + ajouter", VERT, 26, gras=True, mono=False, a_partir_de=0.68),
    ]
    cahier(d, PANEL_D, lignes, p)
    _etat(d, indice=actif, somme=0, compteur=0 if p > 0.58 else None, t=t)


# ══════════════════════════════════════════════════════════════════════════
#  6 · Étage 0 : le premier tour, à la main
# ══════════════════════════════════════════════════════════════════════════
def scene_etage0(d, p, t):
    _entete(d, "La boucle Pour — de la variable à la boucle", 6,
            "6 · Étage 0 : le premier tour, à la main")
    _panneaux(d, "l'histoire")

    ouvert = _ease_out(max(0.0, min(1.0, (p - 0.16) / 0.16)))
    ramasse = max(0.0, min(1.0, (p - 0.40) / 0.24))
    immeuble(d, [96, 300, 606, 826], actif=0, cabine=0.0, ouvert=ouvert,
             faits=(0,) if ramasse > 0.94 else (), ramassage=ramasse if ramasse < 1 else None, t=t)

    # le sac, à droite
    dedans = (str(VALEURS[0]),) if ramasse > 0.94 else ()
    sac(d, 830, 552, contenu=dedans, nom="S", echelle=1.0,
        halo=0.5 + 0.35 * G._pulse(t, 1.8), secousse=0.4 if 0.5 < ramasse < 0.95 else 0.0)
    d.text((830, 714), f"S = {_somme(1) if ramasse > 0.94 else 0}", font=police(30, True, mono=True),
           fill=VERT if ramasse > 0.94 else TEXTE_2, anchor="mm")

    # le jeton qui voyage de l'étage 0 jusqu'au sac
    if 0.42 < ramasse < 1.0:
        a = ramasse
        depart = (462, 700)
        arrivee = (782, 540)
        x = depart[0] + (arrivee[0] - depart[0]) * _ease(a)
        y = depart[1] + (arrivee[1] - depart[1]) * _ease(a) - math.sin(a * math.pi) * 80
        jeton(d, x, y, str(VALEURS[0]), couleur=AMBRE, echelle=1.0)

    if p > 0.72:
        a = _apparait(p, 0.72, 0.14)
        coche(d, 786, 640, 46, progression=a)

    lignes = [
        Ligne("ÉTAGE 0", AMBRE, 24, gras=True, mono=False, a_partir_de=0.02),
        Ligne("la porte s'ouvre", TEXTE_2, 24, mono=False, a_partir_de=0.12),
        Ligne("T[0]  =  4", AMBRE, 30, a_partir_de=0.22),
        Ligne("", a_partir_de=0.3),
        Ligne("lire S      → 0", TEXTE_2, 24, mono=False, a_partir_de=0.36),
        Ligne("ajouter     + 4", TEXTE_2, 24, mono=False, a_partir_de=0.46),
        Ligne("écrire      → 4", TEXTE_2, 24, mono=False, a_partir_de=0.56),
        Ligne("", a_partir_de=0.62),
        Ligne("S = S + T[0]", ORANGE, 30, gras=True, a_partir_de=0.66, souligne=True),
        Ligne("", a_partir_de=0.76),
        Ligne("S  =  4", VERT, 32, gras=True, a_partir_de=0.82),
    ]
    cahier(d, PANEL_D, lignes, p)
    _etat(d, indice=0, somme=_somme(1) if ramasse > 0.94 else 0, compteur=0, t=t)


# ══════════════════════════════════════════════════════════════════════════
#  7 · Répétition : quatre fois la même ligne
# ══════════════════════════════════════════════════════════════════════════
def scene_repetition(d, p, t):
    _entete(d, "La boucle Pour — de la variable à la boucle", 7,
            "7 · Étages 1, 2, 3 : quatre fois la même ligne")
    _panneaux(d, "l'histoire")

    # l'ascenseur monte : étage 1 → 2 → 3
    montee = max(0.0, min(3.0, (p - 0.04) / 0.24))
    etage = int(round(montee))
    faits = tuple(range(0, min(4, etage + 1))) if p > 0.62 else tuple(range(0, etage))
    immeuble(d, [88, 300, 540, 826], actif=min(3, etage), cabine=montee, ouvert=0.85, faits=faits, t=t)

    # le sac qui accumule
    dedans = tuple(str(v) for v in VALEURS[:max(0, etage + 1)]) if p > 0.30 else \
        tuple(str(v) for v in VALEURS[:max(1, etage)])
    sac(d, 646, 470, contenu=dedans, nom="S", echelle=0.78,
        halo=0.4 + 0.3 * G._pulse(t, 1.7))
    d.text((646, 606), f"S = {_somme(min(4, etage + 1)) if p > 0.30 else _somme(etage)}",
           font=police(26, True, mono=True), fill=VERT, anchor="mm")

    # les lignes écrites, une par étage
    _carte(d, [724, 300, 1046, 700], "ce que j'écris", ORANGE, 1.0)
    y = 372
    for k in range(4):
        a = _apparait(p, 0.10 + 0.20 * k, 0.16)
        if a <= 0:
            continue
        boite_arrondie(d, [746, y, 1024, y + 54], rayon=10,
                       fond=melange(FOND_PANNEAU_2, VERT, 0.10 * a),
                       bord=melange(BORDURE, VERT, 0.5 * a), largeur_bord=1)
        d.text((762, y + 27), f"S = S + T[{k}]", font=police(23, True, mono=True),
               fill=melange(FOND, TEXTE, a), anchor="lm")
        d.text((1006, y + 27), f"= {_somme(k + 1)}", font=police(20, True, mono=True),
               fill=melange(FOND, VERT, a), anchor="rm")
        y += 66

    if p > 0.72:
        a = _apparait(p, 0.72, 0.16)
        d.text((885, 660), "4 fois la même ligne !", font=police(24, True),
               fill=melange(FOND, AMBRE, a), anchor="mm")

    lignes = [
        Ligne("JE ME RÉPÈTE", AMBRE, 24, gras=True, mono=False, a_partir_de=0.02),
        Ligne("étage 1 :  4 + 7", TEXTE, 24, mono=False, a_partir_de=0.10),
        Ligne("étage 2 : 11 + 2", TEXTE, 24, mono=False, a_partir_de=0.26),
        Ligne("étage 3 : 13 + 9", TEXTE, 24, mono=False, a_partir_de=0.44),
        Ligne("", a_partir_de=0.52),
        Ligne("S = 22", VERT, 32, gras=True, a_partir_de=0.56),
        Ligne("", a_partir_de=0.64),
        Ligne("même ligne,", TEXTE_2, 22, mono=False, a_partir_de=0.70),
        Ligne("seul l'indice change", ORANGE, 24, gras=True, mono=False, a_partir_de=0.78),
    ]
    cahier(d, PANEL_D, lignes, p)
    _etat(d, indice=min(3, etage), somme=_somme(min(4, etage + 1)), compteur=min(3, etage), t=t)


# ══════════════════════════════════════════════════════════════════════════
#  8 · Pourquoi une boucle : le papier qui déborde
# ══════════════════════════════════════════════════════════════════════════
def scene_pourquoi(d, p, t):
    _entete(d, "La boucle Pour — de la variable à la boucle", 8,
            "8 · Pourquoi une boucle ? Parce que je me répète")
    _panneaux(d, "le problème")

    # le nombre d'étages raconté par la scène : 4 → 10 → 100
    if p < 0.24:
        n, depasse = 4, False
    elif p < 0.46:
        n, depasse = 10, False
    else:
        n, depasse = 100, True

    pile_lignes(d, [88, 276, 596, 838], n, p=p, depasse=depasse, t=t,
                titre=f"un immeuble de {n} étages")

    # l'immeuble, de plus en plus haut
    immeuble(d, [628, 330, 846, 800],
             valeurs=tuple(VALEURS[i % 4] for i in range(min(n, 100))),
             compact=(n >= 100), actif=None, montrer_valeurs=False, etiquettes=(n < 6),
             fenetres=(n < 6), toit=True, cabine=None)
    d.text((737, 830), f"{n} étages", font=police(20, True), fill=TEXTE_2, anchor="mm")

    # la conclusion : écrire une fois
    if p > 0.56:
        a = _apparait(p, 0.56, 0.18)
        boite_arrondie(d, [872, 330, 1046, 560], rayon=16,
                       fond=melange(FOND_PANNEAU, ROUGE_BORD, 0.10 * a),
                       bord=melange(BORDURE, ROUGE_BORD, 0.7 * a), largeur_bord=2)
        d.text((959, 372), "sans boucle", font=police(19, True),
               fill=melange(FOND, ROUGE_BORD, a), anchor="mm")
        G._croix(d, 959, 432, 62 * a, progression=a)
        d.text((959, 500), f"{n} lignes", font=police(26, True, mono=True),
               fill=melange(FOND, TEXTE, a), anchor="mm")
        d.text((959, 532), "à recopier", font=police(17),
               fill=melange(FOND, TEXTE_3, a), anchor="mm")
    if p > 0.76:
        a = _apparait(p, 0.76, 0.18)
        boite_arrondie(d, [872, 586, 1046, 800], rayon=16,
                       fond=melange(FOND_PANNEAU, VERT, 0.12 * a),
                       bord=melange(BORDURE, VERT, 0.75 * a), largeur_bord=2)
        d.text((959, 626), "avec une boucle", font=police(19, True),
               fill=melange(FOND, VERT, a), anchor="mm")
        d.text((959, 690), "1 ligne", font=police(30, True, mono=True),
               fill=melange(FOND, TEXTE, a), anchor="mm")
        d.text((959, 730), "écrite une fois", font=police(17),
               fill=melange(FOND, TEXTE_2, a), anchor="mm")
        d.text((959, 768), "répétée n fois", font=police(19, True),
               fill=melange(FOND, VERT, a), anchor="mm")

    lignes = [
        Ligne("SANS BOUCLE ?", ROUGE_BORD, 24, gras=True, mono=False, a_partir_de=0.02),
        Ligne("1 étage = 1 ligne", TEXTE, 27, mono=False, a_partir_de=0.08),
        Ligne("10 étages = 10 lignes", TEXTE, 27, mono=False, a_partir_de=0.26),
        Ligne("100 étages = 100 lignes", ROUGE_BORD, 27, gras=True, mono=False, a_partir_de=0.48),
        Ligne("", a_partir_de=0.58),
        Ligne("et si je me trompe ?", TEXTE_3, 23, mono=False, a_partir_de=0.64),
        Ligne("", a_partir_de=0.7),
        Ligne("écrire UNE fois,", VERT, 27, gras=True, mono=False, a_partir_de=0.76),
        Ligne("répéter n fois", VERT, 27, gras=True, mono=False, a_partir_de=0.82),
        Ligne("→ une boucle", ORANGE, 30, gras=True, mono=False, a_partir_de=0.9),
    ]
    cahier(d, PANEL_D, lignes, p)
    _etat(d, connue=False, t=t)


# ══════════════════════════════════════════════════════════════════════════
#  9 · Le bloc : le geste une seule fois, avec le compteur
# ══════════════════════════════════════════════════════════════════════════
def scene_bloc(d, p, t):
    _entete(d, "La boucle Pour — de la variable à la boucle", 9,
            "9 · Le bloc et le compteur")
    _panneaux(d, "l'histoire")

    montee = max(0.0, min(3.0, p * 3.6))
    immeuble(d, [88, 300, 546, 826], actif=min(3, int(round(montee))), cabine=montee,
             ouvert=0.7, faits=tuple(range(0, int(montee))), t=t)

    # le bloc, entre accolades
    a = _apparait(p, 0.10, 0.2)
    _carte(d, [612, 300, 1046, 620], "le bloc à répéter", AMBRE, a)
    if a > 0:
        d.text((628, 386), "{", font=police(44, True, mono=True), fill=melange(FOND, AMBRE, a))
        d.text((1030, 386), "}", font=police(44, True, mono=True), fill=melange(FOND, AMBRE, a),
               anchor="ra")
        ab = _apparait(p, 0.24, 0.18)
        _formule(d, 830, 404, gauche="S", droite="S + T[compteur]", taille=25,
                 accent_gauche=ORANGE, accent_droit=AMBRE, echelle=ab)
        d.text((830, 470), "le seul élément qui change :", font=police(18),
               fill=melange(FOND, TEXTE_3, ab), anchor="mm")

        # les quatre indices, dont un seul est « actif »
        cx = 686
        actif_i = min(3, int(round(montee)))
        for k in range(4):
            ak = _apparait(p, 0.34 + 0.05 * k, 0.12)
            if ak <= 0:
                continue
            chaud = k == actif_i
            boite_arrondie(d, [cx - 34, 504, cx + 34, 556], rayon=10,
                           fond=melange((24, 34, 52), AMBRE, 0.20 if chaud else 0.04),
                           bord=melange(BORDURE, AMBRE, (0.9 if chaud else 0.35) * ak),
                           largeur_bord=2 if chaud else 1)
            d.text((cx, 530), f"T[{k}]", font=police(15, True, mono=True),
                   fill=melange(FOND, AMBRE if chaud else TEXTE_3, ak), anchor="mm")
            cx += 82
        d.text((830, 590), "c'est le compteur de l'ascenseur", font=police(17),
               fill=melange(FOND, BLEU, _apparait(p, 0.56, 0.16)), anchor="mm")

    if p > 0.66:
        a2 = _apparait(p, 0.66, 0.16)
        d.text((829, 664), "voilà le geste : une seule fois", font=police(21, True),
               fill=melange(FOND, VERT, a2), anchor="mm")

    lignes = [
        Ligne("LE BLOC", AMBRE, 24, gras=True, mono=False, a_partir_de=0.02),
        Ligne("prendre la valeur", TEXTE, 26, mono=False, a_partir_de=0.08),
        Ligne("l'ajouter dans S", TEXTE, 26, mono=False, a_partir_de=0.16),
        Ligne("", a_partir_de=0.24),
        Ligne("ce qui change :", TEXTE_2, 22, mono=False, a_partir_de=0.32),
        Ligne("l'indice  k", BLEU, 26, gras=True, mono=False, a_partir_de=0.40),
        Ligne("0 → 1 → 2 → 3", TEXTE_2, 23, mono=False, a_partir_de=0.50),
        Ligne("", a_partir_de=0.58),
        Ligne("c'est le compteur", AMBRE, 24, gras=True, mono=False, a_partir_de=0.64),
        Ligne("", a_partir_de=0.7),
        Ligne("S = S + T[compteur]", ORANGE, 26, gras=True, a_partir_de=0.74, souligne=True),
    ]
    cahier(d, PANEL_D, lignes, p)
    _etat(d, indice=min(3, int(round(montee))), somme=_somme(1 + int(montee)),
          compteur=min(3, int(round(montee))), t=t)


# ══════════════════════════════════════════════════════════════════════════
# 10 · La boucle Pour : écrire une fois, répéter n fois
# ══════════════════════════════════════════════════════════════════════════
def scene_boucle(d, p, t):
    _entete(d, "La boucle Pour — de la variable à la boucle", 10,
            "10 · La boucle Pour : écrire une fois, répéter n fois")
    _panneaux(d, "l'histoire")

    # le compteur fait le tour de la boucle
    etape = max(0, min(4, int(p * 5.2)))
    boucle_schema(d, [88, 268, 648, 706], n=N_ETAGES, compteur=min(etape, N_ETAGES - 1),
                  p=p, t=t)

    # le sac, qui se remplit tout seul
    somme = _somme(etape)
    dedans = tuple(str(v) for v in VALEURS[:etape])
    sac(d, 856, 404, contenu=dedans, nom="S", echelle=0.92,
        halo=0.45 + 0.3 * G._pulse(t, 1.7))
    fini = etape >= N_ETAGES
    boite_arrondie(d, [708, 556, 1014, 620], rayon=16,
                   fond=melange(FOND_PANNEAU_2, VERT if fini else ORANGE, 0.20),
                   bord=melange(BORDURE, VERT if fini else ORANGE, 0.8), largeur_bord=2)
    d.text((861, 588), f"S = {somme}", font=police(30, True, mono=True),
           fill=TEXTE, anchor="mm")
    if fini:
        a = _apparait(p, 0.80, 0.14)
        d.text((861, 648), "4 + 7 + 2 + 9 = 22", font=police(20),
               fill=melange(FOND, TEXTE_2, a), anchor="mm")

    # le récapitulatif : variable, bloc, boucle
    if p > 0.62:
        recap = [("une variable", ORANGE), ("un bloc", AMBRE), ("une boucle", VERT)]
        cx = 176
        for i, (mot, couleur) in enumerate(recap):
            a = _apparait(p, 0.62 + 0.07 * i, 0.14)
            if a <= 0:
                continue
            larg = largeur_texte(mot, 20, True) + 44
            boite_arrondie(d, [cx, 742, cx + larg, 796], rayon=14,
                           fond=melange(FOND_PANNEAU_2, couleur, 0.16 * a),
                           bord=melange(BORDURE, couleur, 0.8 * a), largeur_bord=2)
            d.text((cx + larg / 2, 769), mot, font=police(20, True),
                   fill=melange(FOND, couleur, a), anchor="mm")
            cx += larg + 18

    lignes = [
        Ligne("LA BOUCLE POUR", VERT, 24, gras=True, mono=False, a_partir_de=0.02),
        Ligne("Pour compteur de 0 à n-1", TEXTE, 22, a_partir_de=0.10),
        Ligne("faire", TEXTE, 22, a_partir_de=0.16),
        Ligne("S = S + T[compteur]", AMBRE, 22, retrait=22, a_partir_de=0.22),
        Ligne("Fin Pour", TEXTE, 22, a_partir_de=0.28),
        Ligne("", a_partir_de=0.34),
        Ligne("départ : 0", BLEU, 21, mono=False, a_partir_de=0.40),
        Ligne("condition : < n", AMBRE, 21, mono=False, a_partir_de=0.46),
        Ligne("pas : + 1", VERT, 21, mono=False, a_partir_de=0.52),
        Ligne("", a_partir_de=0.6),
        Ligne("S = 22", VERT, 34, gras=True, a_partir_de=0.70),
        Ligne("la somme est juste", VERT, 22, mono=False, a_partir_de=0.80),
    ]
    cahier(d, PANEL_D, lignes, p)
    _etat(d, indice=min(N_ETAGES - 1, etape), somme=somme,
          compteur=min(N_ETAGES - 1, etape), t=t)


# ══════════════════════════════════════════════════════════════════════════
#  Le répartiteur
# ══════════════════════════════════════════════════════════════════════════
SCENES = {
    "probleme": scene_probleme,
    "variable": scene_variable,
    "nom": scene_nom,
    "accumuler": scene_accumuler,
    "immeuble": scene_immeuble,
    "etage0": scene_etage0,
    "repetition": scene_repetition,
    "pourquoi": scene_pourquoi,
    "bloc": scene_bloc,
    "boucle": scene_boucle,
}


def dessiner(d: ImageDraw.ImageDraw, cle: str, p: float, t: float):
    """Dessine une scène ; le fond commun est posé ici."""
    G.fond(d, t)
    SCENES[cle](d, p, t)
