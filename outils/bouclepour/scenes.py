"""Les onze scènes de « La boucle Pour — de la variable à la boucle ».

Trois colonnes, toujours les mêmes :

  * à gauche **l'immeuble** (et son ascenseur) ;
  * au milieu **le brouillon** : le papier réglé, l'écriture au crayon, et les
    annotations au stylo rouge ;
  * à droite **l'algo · le code** : ce que j'écris vraiment.

Le cheminement (cf. `narration.py`) mène du brouillon à l'algorithme, revient au
brouillon avec le stylo rouge pour y écrire « compteur » et y encercler les
chiffres entre crochets, pose la question principale (connaît-on le nombre de
répétitions ?), puis engendre le bloc par la boucle Pour.
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
    LARGEUR, HAUTEUR, MARGE, PANEL_G, PANEL_M, PANEL_D, BANDE,
    sac, immeuble, personnage, jeton, cahier, cadre_code, cadre_algo, boite_memoire,
    pile_lignes, boucle_schema, bandeau_etat, bulle, coche, panneau, entete,
    etape_pastille, papier_brouillon, crayon, crayon_centre,
    stylo_cercle, stylo_souligne, stylo_note, stylo_fleche,
    Ligne, _ease, _ease_out, _apparait, VALEURS, SOMME_TOTALE, N_ETAGES,
    ENCRE, ROUGE_STYLO, PAPIER, CODE_FOND,
)

TOTAL = 11

# ── Géométrie des trois colonnes ───────────────────────────────────────────
IMB = [88, 292, 620, 806]               # l'immeuble, colonne de gauche
PAPIER_BOX = [686, 250, 1234, 862]      # le papier du brouillon
X_CRAYON = 756                          # la première ligne, à droite de la marge
Y_REGLE = 296                           # la première ligne réglée
PAS_REGLE = 46
X_SAC = 1566                            # axe de la colonne de droite


# ══════════════════════════════════════════════════════════════════════════
#  Petits utilitaires communs
# ══════════════════════════════════════════════════════════════════════════
def _somme(jusqua: int) -> int:
    """La somme des étages déjà ramassés (0 → aucun)."""
    return sum(VALEURS[:max(0, jusqua)])


def _etat(d, indice=None, somme=0, compteur=None, connue=True, t=0.0):
    bandeau_etat(d, indice=indice, somme=somme, compteur=compteur, t=t, somme_connue=connue)


def _entete(d, etape, chapitre):
    entete(d, "La boucle Pour — de la variable à la boucle", etape, TOTAL, chapitre)


def _panneaux(d, t_g="l'immeuble", t_m="le brouillon", t_d="l'algo · le code"):
    panneau(d, PANEL_G, t_g, accent=melange(BORDURE, ORANGE, 0.30))
    panneau(d, PANEL_M, t_m, accent=melange(BORDURE, AMBRE, 0.40))
    cadre_algo(d, PANEL_D, t_d)


def _regle(i: int) -> float:
    """L'ordonnée de la i-ème ligne réglée du brouillon."""
    return Y_REGLE + i * PAS_REGLE


def _ligne(d, i, texte_, taille=26, couleur=ENCRE, a_partir_de=0.0, p=1.0, duree=0.20,
           gras=False):
    """Écrit une ligne du brouillon sur le i-ème filet."""
    return crayon(d, X_CRAYON, _regle(i) - 10, texte_, taille, couleur,
                  a_partir_de, p, duree, gras)


def _carte(d, box, titre=None, accent=BORDURE, a=1.0):
    """Une carte arrondie posée dans une colonne (avec un titre optionnel)."""
    if a <= 0.01:
        return
    boite_arrondie(d, box, rayon=16,
                   fond=melange(FOND_PANNEAU, melange(FOND_PANNEAU_2, accent, 0.07), a),
                   bord=melange(BORDURE, accent, 0.55 * a), largeur_bord=2)
    if titre:
        x0, y0, _, _ = box
        d.text((x0 + 20, y0 + 16), titre, font=police(17, True),
               fill=melange(TEXTE_3, accent, 0.55 * a))


def _sac_colonne(d, contenu=(), nom="S", valeur=0, echelle=0.55, halo=0.0, t=0.0,
                 connue=True, y=650):
    """Le sac, en bas de la colonne « algo · code » : la mémoire du programme."""
    if connue and not contenu:
        contenu = (str(valeur),)
    sac(d, X_SAC, y, contenu=contenu, nom=nom, echelle=echelle, halo=halo)
    d.text((X_SAC, y + 88 * echelle + 24), f"S = {valeur}" if connue else "S = …",
           font=police(26, True, mono=True),
           fill=VERT if connue else _encre(TEXTE_3), anchor="mm")


def _etiquette_colonne(d, y, texte_, couleur=VIOLET):
    """Le petit intitulé au-dessus d'un bloc de la colonne de droite."""
    d.text((1300, y), texte_, font=police(15, True), fill=melange(TEXTE_3, couleur, 0.6))


def _encre(couleur, a=1.0):
    """La couleur d'un texte écrit sur le fond d'un panneau."""
    return melange(FOND_PANNEAU_2, couleur, a)


def _attente(d, y, texte_):
    """Un cadre en pointillé : « ce que j'écrirai plus tard »."""
    boite_arrondie(d, [1300, y, 1832, y + 54], rayon=12, fond=None,
                   bord=melange(BORDURE, TEXTE_3, 0.25), largeur_bord=2)
    d.text((1566, y + 27), texte_, font=police(17), fill=_encre(TEXTE_3), anchor="mm")


def _rien_encore(d):
    """La colonne « algo » reste vide : le travail se fait sur le brouillon."""
    boite_arrondie(d, [1300, 268, 1832, 470], rayon=14, fond=None,
                   bord=melange(BORDURE, TEXTE_3, 0.22), largeur_bord=2)
    d.text((1566, 336), "l'algo, plus tard", font=police(22, True),
           fill=_encre(TEXTE_3), anchor="mm")
    d.text((1566, 382), "d'abord, je travaille", font=police(18),
           fill=_encre(melange(TEXTE_3, TEXTE_2, 0.35)), anchor="mm")
    d.text((1566, 410), "sur le brouillon", font=police(18),
           fill=_encre(melange(TEXTE_3, TEXTE_2, 0.35)), anchor="mm")


# ══════════════════════════════════════════════════════════════════════════
#  1 · Le problème et le plan de travail
# ══════════════════════════════════════════════════════════════════════════
def scene_probleme(d, p, t):
    _entete(d, 1, "1 · Le problème : la somme des quatre étages")
    _panneaux(d)

    immeuble(d, IMB, actif=None, cabine=None, t=t)
    d.text((354, 846), "quatre étages", font=police(19), fill=TEXTE_3, anchor="mm")

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "l'immeuble :", 24, melange(ENCRE, TEXTE_3, 0.45), 0.06, p)
    # les quatre valeurs, écrites au crayon
    cx = X_CRAYON + 34
    for i, v in enumerate(VALEURS):
        k = _apparait(p, 0.16 + 0.06 * i, 0.12)
        if k <= 0:
            continue
        boite_arrondie(d, [cx - 26, _regle(1) - 26, cx + 26, _regle(1) + 14], rayon=8,
                       fond=melange(PAPIER, AMBRE, 0.16 * k),
                       bord=melange(BORDURE, AMBRE, 0.7 * k), largeur_bord=2)
        d.text((cx, _regle(1) - 6), str(v), font=police(26, True, mono=True),
               fill=melange(PAPIER, TEXTE, k), anchor="mm")
        cx += 70
    _ligne(d, 2, "c'est un tableau :  T", 24, ENCRE, 0.40, p)
    _ligne(d, 3, "T = [4, 7, 2, 9]", 28, AMBRE, 0.50, p)
    _ligne(d, 5, "la somme, dans S :", 24, melange(ENCRE, TEXTE_3, 0.4), 0.62, p)
    _ligne(d, 6, "S = ?", 32, ORANGE, 0.72, p, gras=True)

    _etiquette_colonne(d, 244, "ce que je cherche")
    d.text((1300, 292), "S = T[0] + T[1] + T[2] + T[3]", font=police(21, True, mono=True),
           fill=_encre(TEXTE, _apparait(p, 0.44, 0.2)))
    d.text((1300, 342), "S = ?", font=police(34, True, mono=True),
           fill=_encre(ORANGE, _apparait(p, 0.70, 0.2)))
    _sac_colonne(d, contenu=(), nom="S", valeur=0, t=t, connue=False)

    _etat(d, connue=False, t=t)


# ══════════════════════════════════════════════════════════════════════════
#  2 · La variable : un nom, un contenu qui change
# ══════════════════════════════════════════════════════════════════════════
def scene_variable(d, p, t):
    _entete(d, 2, "2 · Une variable : un nom, un contenu qui change")
    _panneaux(d)

    immeuble(d, IMB, actif=None, cabine=None, t=t)

    # le brouillon : les trois essais
    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "j'essaie :", 24, melange(ENCRE, TEXTE_3, 0.45), 0.10, p)
    actif = 0 if p < 0.40 else (1 if p < 0.56 else 2)
    essais = [("S  ←  rien", "vide"), ("S  ←  4", "4"), ("S  ←  7", "7")]
    for i, (code, val) in enumerate(essais):
        k = _apparait(p, 0.18 + 0.16 * i, 0.16)
        if k <= 0:
            continue
        chaud = i == actif
        couleur = AMBRE if chaud else melange(ENCRE, TEXTE_3, 0.35)
        crayon(d, X_CRAYON, _regle(2 + i) - 10, code, 26, couleur, 0.18 + 0.16 * i, p, 0.16,
               gras=chaud)
        if chaud:
            stylo_souligne(d, X_CRAYON + 130, _regle(2 + i) + 2,
                           X_CRAYON + 130 + 70, _apparait(p, 0.20 + 0.16 * i, 0.2),
                           couleur=melange(ROUGE_STYLO, AMBRE, 0.4), epaisseur=2)
    _ligne(d, 6, "même boîte", 24, VERT, 0.66, p)
    _ligne(d, 7, "autre contenu", 24, VERT, 0.72, p)

    # la colonne de droite : le sac en grand, et la définition
    if p < 0.30:
        contenu, valeur = (), 0
    elif p < 0.50:
        contenu, valeur = (str(VALEURS[0]),), VALEURS[0]
    else:
        contenu, valeur = (str(VALEURS[1]),), VALEURS[1]
    _etiquette_colonne(d, 244, "la case mémoire")
    secousse = 0.0
    for centre in (0.36, 0.56):
        if abs(p - centre) < 0.05:
            secousse = 1 - abs((p - centre) / 0.05)
    sac(d, X_SAC, 500, contenu=contenu, nom=None, echelle=0.80,
        halo=0.40 + 0.30 * G._pulse(t, 2.1), secousse=secousse * 0.6)
    d.text((X_SAC, 606), f"contenu : {valeur if p > 0.30 else 'rien'}",
           font=police(24, True, mono=True), fill=AMBRE, anchor="mm")
    a = _apparait(p, 0.74, 0.18)
    if a > 0:
        d.text((X_SAC, 686), "un nom", font=police(20), fill=_encre(TEXTE_3, a),
               anchor="mm")
        d.text((X_SAC, 726), "+  une valeur", font=police(20), fill=_encre(TEXTE_3, a),
               anchor="mm")
        d.text((X_SAC, 790), "le nom reste,", font=police(21, True),
               fill=_encre(VERT, a), anchor="mm")
        d.text((X_SAC, 824), "la valeur bouge", font=police(21, True),
               fill=_encre(VERT, a), anchor="mm")

    _etat(d, connue=False, t=t)


# ══════════════════════════════════════════════════════════════════════════
#  3 · Le nom : plusieurs sacs, un seul S
# ══════════════════════════════════════════════════════════════════════════
def scene_nom(d, p, t):
    _entete(d, 3, "3 · Un nom : S, le même jusqu'à la fin")
    _panneaux(d)

    immeuble(d, IMB, actif=None, cabine=None, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "beaucoup de sacs :", 24, melange(ENCRE, TEXTE_3, 0.45), 0.06, p)
    nomme = _apparait(p, 0.54, 0.18)
    for i in range(4):
        k = _apparait(p, 0.10 + 0.05 * i, 0.12)
        if k <= 0:
            continue
        base = melange(ENCRE, TEXTE_3, 0.55)
        couleur = melange(base, PAPIER, 0.55 * nomme)
        crayon(d, X_CRAYON, _regle(1 + i) - 10, f"sac n°{i + 1}   ?", 24, couleur,
               0.10 + 0.05 * i, 1.0)
    if p < 0.54:
        crayon_centre(d, 960, _regle(6) - 10, "« le sac » … lequel ?", 26, ROSE, 0.34, p)
    else:
        _ligne(d, 6, "je donne un nom : S", 26, AMBRE, 0.56, p, gras=True)
        _ligne(d, 7, "le même dans tout", 24, VERT, 0.70, p)
        _ligne(d, 8, "mon algorithme", 24, VERT, 0.76, p)

    _etiquette_colonne(d, 244, "la variable, nommée")
    boite_memoire(d, [1300, 272, 1832, 556], nom="S" if p > 0.58 else "?",
                  valeur="0" if p > 0.58 else "?", a=_apparait(p, 0.40, 0.2), t=t,
                  titre="une variable", note="un seul nom, pour tout le programme")
    _sac_colonne(d, contenu=(), nom="S" if p > 0.58 else None, valeur=0, t=t, y=712)

    _etat(d, connue=False, t=t)


# ══════════════════════════════════════════════════════════════════════════
#  4 · S = S + … : lire, ajouter, réécrire
# ══════════════════════════════════════════════════════════════════════════
def scene_accumuler(d, p, t):
    _entete(d, 4, "4 · S = S + … : lire, ajouter, réécrire")
    _panneaux(d)

    immeuble(d, IMB, actif=None, cabine=None, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "je calcule :", 24, melange(ENCRE, TEXTE_3, 0.45), 0.06, p)
    _ligne(d, 1, "S = 0", 26, ENCRE, 0.14, p)
    _ligne(d, 2, "0 + 4 = 4", 26, ENCRE, 0.30, p)
    _ligne(d, 3, "S = 4", 26, AMBRE, 0.40, p)
    _ligne(d, 4, "4 + 7 = 11", 26, ENCRE, 0.58, p)
    _ligne(d, 5, "S = 11", 26, AMBRE, 0.66, p)
    _ligne(d, 7, "le nouveau = l'ancien + ...", 22, VERT, 0.76, p)

    # la ligne clé, dans l'algorithme : les deux S, en deux couleurs
    _etiquette_colonne(d, 244, "la ligne la plus importante")
    k = _apparait(p, 0.20, 0.2)
    if k > 0:
        f = police(24, True, mono=True)
        morceaux = [("S", ORANGE), (" = ", TEXTE_3), ("S", BLEU),
                    (" + ", TEXTE_3), ("quelque chose", AMBRE)]
        total = sum(f.getlength(m) for m, _ in morceaux)
        x = 1566 - total / 2
        for m, c in morceaux:
            d.text((x, 296), m, font=f, fill=_encre(c, k), anchor="lm")
            x += f.getlength(m)
    a1 = _apparait(p, 0.46, 0.16)
    if a1 > 0:
        for i, (chip, txt, coul) in enumerate(
                [("S", "à gauche : la nouvelle valeur", ORANGE),
                 ("S", "à droite : l'ancienne valeur", BLEU)]):
            y = 344 + i * 34
            d.text((1300, y), chip, font=police(20, True, mono=True),
                   fill=_encre(coul, a1), anchor="lm")
            d.text((1330, y), txt, font=police(17), fill=_encre(TEXTE_2, a1), anchor="lm")

    for i, (titre_, detail, couleur) in enumerate(
            [("lire S", "→ 4", BLEU), ("ajouter", "+ 7", AMBRE), ("écrire dans S", "→ 11", ORANGE)]):
        ai = _apparait(p, 0.30 + 0.12 * i, 0.16)
        if ai <= 0:
            continue
        y = 412 + i * 66
        boite_arrondie(d, [1300, y, 1832, y + 54], rayon=12,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.12 * ai),
                       bord=melange(BORDURE, couleur, 0.65 * ai), largeur_bord=2)
        etape_pastille(d, 1330, y + 27, i + 1, couleur=couleur, echelle=0.85)
        d.text((1366, y + 27), titre_, font=police(20, True),
               fill=_encre(TEXTE, ai), anchor="lm")
        d.text((1800, y + 27), detail, font=police(20, True, mono=True),
               fill=_encre(couleur, ai), anchor="rm")

    _sac_colonne(d, contenu=tuple(str(v) for v in VALEURS[:2]) if p > 0.60 else (),
                 valeur=VALEURS[0] + VALEURS[1] if p > 0.60 else VALEURS[0], t=t, y=712)

    _etat(d, somme=VALEURS[0] + VALEURS[1] if p > 0.60 else VALEURS[0], connue=True, t=t)


# ══════════════════════════════════════════════════════════════════════════
#  5 · L'immeuble et l'ascenseur : le même geste à chaque étage
# ══════════════════════════════════════════════════════════════════════════
def scene_immeuble(d, p, t):
    _entete(d, 5, "5 · L'immeuble et l'ascenseur")
    _panneaux(d)

    actif = 0 if p > 0.56 else None
    immeuble(d, IMB, actif=actif, cabine=0.0, ouvert=_apparait(p, 0.66, 0.16), t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "à chaque étage :", 24, melange(ENCRE, TEXTE_3, 0.45), 0.10, p)
    for i, geste in enumerate(["ouvrir la porte", "prendre la valeur", "l'ajouter dans S"]):
        k = _apparait(p, 0.34 + 0.10 * i, 0.14)
        if k <= 0:
            continue
        crayon(d, X_CRAYON, _regle(2 + i) - 10, f"{i + 1}. {geste}", 25,
               melange(ENCRE, VERT, k * 0.8), 0.34 + 0.10 * i, p, 0.14)
    _ligne(d, 6, "toujours pareil", 26, VERT, 0.72, p, gras=True)

    _etiquette_colonne(d, 244, "ce que j'écrirai")
    _rien_encore(d)
    _sac_colonne(d, contenu=(), valeur=0, t=t)

    _etat(d, indice=actif, somme=0, compteur=0 if actif is not None else None, t=t)


# ══════════════════════════════════════════════════════════════════════════
#  6 · Étage 0, sur le brouillon
# ══════════════════════════════════════════════════════════════════════════
def scene_etage0(d, p, t):
    _entete(d, 6, "6 · Étage 0, sur le brouillon : S = S + T[0]")
    _panneaux(d)

    ouvert = _ease_out(max(0.0, min(1.0, (p - 0.14) / 0.16)))
    ramasse = max(0.0, min(1.0, (p - 0.36) / 0.26))
    immeuble(d, IMB, actif=0, cabine=0.0, ouvert=ouvert,
             faits=(0,) if ramasse > 0.94 else (),
             ramassage=ramasse if ramasse < 1 else None, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "tour n°1 · étage 0", 24, melange(ENCRE, TEXTE_3, 0.45), 0.10, p)
    _ligne(d, 1, "la porte s'ouvre", 24, ENCRE, 0.20, p)
    _ligne(d, 2, "T[0] = 4", 28, AMBRE, 0.30, p)
    _ligne(d, 4, "S valait 0", 24, BLEU, 0.44, p)
    _ligne(d, 5, "S = S + T[0]", 30, ORANGE, 0.56, p, gras=True)
    _ligne(d, 7, "S = 4", 30, VERT, 0.74, p, gras=True)

    _etiquette_colonne(d, 244, "ce que j'écrirai")
    _rien_encore(d)
    _sac_colonne(d, contenu=(str(VALEURS[0]),) if ramasse > 0.94 else (),
                 valeur=_somme(1) if ramasse > 0.94 else 0, t=t,
                 halo=0.4 if 0.5 < ramasse < 1 else 0.0)

    _etat(d, indice=0, somme=_somme(1) if ramasse > 0.94 else 0, compteur=0, t=t)


# ══════════════════════════════════════════════════════════════════════════
#  7 · Étages 1, 2, 3 : seul le chiffre change
# ══════════════════════════════════════════════════════════════════════════
def scene_repetition(d, p, t):
    _entete(d, 7, "7 · Étages 1, 2, 3 : seul le chiffre change")
    _panneaux(d)

    montee = max(0.0, min(3.0, (p - 0.04) / 0.26))
    etage = int(round(montee))
    immeuble(d, IMB, actif=min(3, etage), cabine=montee, ouvert=0.85,
             faits=tuple(range(0, min(4, etage + 1))), t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "mon brouillon :", 24, melange(ENCRE, TEXTE_3, 0.45), 0.06, p)
    for k in range(4):
        a = _apparait(p, 0.10 + 0.16 * k, 0.16)
        if a <= 0:
            continue
        y = _regle(2 + k) - 10
        crayon(d, X_CRAYON, y, f"S = S + T[{k}]", 26,
               melange(ENCRE, TEXTE, a), 0.10 + 0.16 * k, p, 0.16)
        d.text((X_CRAYON + 300, y), f"= {_somme(k + 1)}", font=police(26, True, mono=True),
               fill=melange(PAPIER, VERT, a), anchor="lm")
    if p > 0.70:
        stylo_note(d, X_CRAYON, _regle(7) - 6, "quatre fois la même ligne !", 24,
                   a_partir_de=0.70, p=p)
    if p > 0.84:
        stylo_note(d, X_CRAYON, _regle(8) - 6, "seul le chiffre change", 22,
                   a_partir_de=0.84, p=p)

    _etiquette_colonne(d, 244, "ce que j'écrirai")
    _rien_encore(d)
    _sac_colonne(d, contenu=tuple(str(v) for v in VALEURS[:min(4, etage + 1)]),
                 valeur=_somme(min(4, etage + 1)), t=t)

    _etat(d, indice=min(3, etage), somme=_somme(min(4, etage + 1)),
          compteur=min(3, etage), t=t)


# ══════════════════════════════════════════════════════════════════════════
#  8 · Passage à l'algo : T[quelque chose]
# ══════════════════════════════════════════════════════════════════════════
def scene_quelquechose(d, p, t):
    _entete(d, 8, "8 · Passage à l'algo : ce n'est plus un chiffre")
    _panneaux(d)

    immeuble(d, IMB, actif=3, cabine=3.0, faits=(0, 1, 2, 3), t=t)

    # le brouillon : les quatre lignes, les crochets qui brillent
    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "ce qui change :", 24, melange(ENCRE, TEXTE_3, 0.45), 0.06, p)
    for k in range(4):
        y = _regle(2 + k) - 10
        a = max(0.35, _apparait(p, 0.10 + 0.05 * k, 0.1))
        crayon(d, X_CRAYON, y, f"S = S + T[{k}]", 26, melange(PAPIER, TEXTE_3, a), 0.02, 1.0)
        # le chiffre entre crochets, mis en avant
        cw = largeur_texte("0", 26, False, True)
        xd = X_CRAYON + len("S = S + T[") * cw + cw / 2
        lueur = _apparait(p, 0.34 + 0.06 * k, 0.14)
        if lueur > 0:
            halo = 4 + 2 * G._pulse(t, 1.3)
            d.ellipse([xd - 13 - halo, y - 17 - halo, xd + 13 + halo, y + 17 + halo],
                      outline=melange(PAPIER, AMBRE, 0.65 * lueur), width=2)
        d.text((xd, y), str(k), font=police(26, False, True),
               fill=melange(PAPIER, AMBRE, lueur), anchor="mm")
    stylo_note(d, X_CRAYON, _regle(7) - 6, "un seul chiffre change", 23, couleur=AMBRE,
               a_partir_de=0.62, p=p)

    # l'algo et le JavaScript apparaissent
    _etiquette_colonne(d, 244, "l'algorithme")
    k = _apparait(p, 0.30, 0.2)
    if k > 0:
        boite_arrondie(d, [1296, 268, 1836, 330], rayon=12,
                       fond=melange(FOND_PANNEAU_2, AMBRE, 0.12 * k),
                       bord=melange(BORDURE, AMBRE, 0.8 * k), largeur_bord=2)
        d.text((1566, 299), "S = S + T[quelque chose]", font=police(22, True, mono=True),
               fill=_encre(AMBRE, k), anchor="mm")
    _etiquette_colonne(d, 352, "le JavaScript", VERT)
    kj = _apparait(p, 0.56, 0.2)
    if kj > 0:
        boite_arrondie(d, [1296, 376, 1836, 438], rayon=12,
                       fond=(9, 14, 24), bord=melange(BORDURE, VERT, 0.7 * kj), largeur_bord=2)
        d.text((1566, 407), "S = S + T[i];", font=police(23, True, mono=True),
               fill=_encre(VERT, kj), anchor="mm")
    if p > 0.78:
        a = _apparait(p, 0.78, 0.16)
        d.text((1566, 480), "i, c'est le compteur", font=police(19),
               fill=_encre(TEXTE_2, a), anchor="mm")

    _sac_colonne(d, contenu=tuple(str(v) for v in VALEURS), valeur=SOMME_TOTALE, t=t)
    _etat(d, indice=None, somme=SOMME_TOTALE, connue=True, t=t)


# ══════════════════════════════════════════════════════════════════════════
#  9 · Retour au brouillon, stylo rouge : le compteur
# ══════════════════════════════════════════════════════════════════════════
def scene_compteur(d, p, t):
    _entete(d, 9, "9 · Retour au brouillon, stylo rouge : le compteur")
    _panneaux(d)

    immeuble(d, IMB, actif=3, cabine=3.0, faits=(0, 1, 2, 3), t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "mon brouillon :", 24, melange(ENCRE, TEXTE_3, 0.45), 0.04, p)
    cw = largeur_texte("0", 26, False, True)
    for k in range(4):
        y = _regle(2 + k) - 10
        crayon(d, X_CRAYON, y, f"S = S + T[{k}]", 26, melange(PAPIER, ENCRE, 0.85), 0.02, 1.0)

    # les cercles rouges sur le 0 et le 1
    for i, k in enumerate((0, 1)):
        y = _regle(2 + k) - 10
        xd = X_CRAYON + len("S = S + T[") * cw + cw / 2
        kc = _apparait(p, 0.30 + 0.14 * i, 0.16)
        if kc > 0:
            stylo_cercle(d, xd, y, 17, 21, progression=kc)

    # la note rouge : « compteur »
    kn = _apparait(p, 0.58, 0.18)
    if kn > 0:
        stylo_note(d, X_CRAYON + 300, _regle(2) - 10, "compteur", 30, a_partir_de=0.58, p=p)
        fl = _apparait(p, 0.72, 0.14)
        if fl > 0:
            stylo_fleche(d, (X_CRAYON + 296, _regle(2) - 24), (X_CRAYON + 196, _regle(2) - 16),
                         progression=fl)
            stylo_fleche(d, (X_CRAYON + 296, _regle(3) - 16), (X_CRAYON + 196, _regle(3) - 10),
                         progression=fl)
    if p > 0.84:
        stylo_note(d, X_CRAYON, _regle(7) - 6, "zéro, un, deux, trois…", 22,
                   a_partir_de=0.84, p=p)

    # la colonne de droite : « quelque chose » va devenir le compteur
    _etiquette_colonne(d, 244, "mon algorithme")
    d.text((1566, 299), "S = S + T[quelque chose]", font=police(22, True, mono=True),
           fill=AMBRE, anchor="mm")
    kq = _apparait(p, 0.68, 0.18)
    if kq > 0:
        stylo_note(d, 1566, 366, "= le compteur", 24, ancre="mm", a_partir_de=0.68, p=p)
        stylo_cercle(d, 1706, 299, 96, 26, progression=kq)
    d.text((1566, 436), "S = S + T[i];", font=police(20, True, mono=True),
           fill=_encre(VERT, 0.9), anchor="mm")

    _sac_colonne(d, contenu=tuple(str(v) for v in VALEURS), valeur=SOMME_TOTALE, t=t)
    _etat(d, indice=None, somme=SOMME_TOTALE, connue=True, t=t)


# ══════════════════════════════════════════════════════════════════════════
# 10 · La question principale : combien de répétitions ?
# ══════════════════════════════════════════════════════════════════════════
def scene_pourquoi(d, p, t):
    _entete(d, 10, "10 · La question principale : combien de répétitions ?")
    _panneaux(d)

    immeuble(d, IMB, actif=3, cabine=3.0, faits=(0, 1, 2, 3), t=t)
    d.text((354, 846), "4 étages = 4 tours", font=police(19), fill=VERT, anchor="mm")

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "ce que je remarque :", 24, melange(ENCRE, TEXTE_3, 0.45), 0.04, p)
    k1 = _apparait(p, 0.10, 0.16)
    if k1 > 0:
        crayon(d, X_CRAYON, _regle(2) - 10, "entre les crochets :", 24,
               melange(PAPIER, ENCRE, k1), 0.10, p)
        crayon(d, X_CRAYON, _regle(3) - 10, "0, 1, 2, 3", 30,
               melange(PAPIER, ROUGE_STYLO, k1), 0.12, p, gras=True)
        crayon(d, X_CRAYON, _regle(4) - 10, "= le pas du compteur", 24,
               melange(PAPIER, ROUGE_STYLO, k1 * 0.9), 0.18, p)
    k2 = _apparait(p, 0.34, 0.18)
    if k2 > 0:
        stylo_note(d, X_CRAYON, _regle(6) - 10, "donc : une boucle", 26,
                   a_partir_de=0.34, p=p)
        stylo_note(d, X_CRAYON, _regle(7) - 10, "et un compteur", 26,
                   a_partir_de=0.40, p=p)
    k3 = _apparait(p, 0.56, 0.18)
    if k3 > 0:
        boite_arrondie(d, [704, 700, 1216, 754], rayon=12,
                       fond=melange(PAPIER, AMBRE, 0.16 * k3),
                       bord=melange(BORDURE, AMBRE, 0.8 * k3), largeur_bord=2)
        d.text((960, 727), "combien de répétitions ?", font=police(24, True),
               fill=melange(PAPIER, AMBRE, k3), anchor="mm")
    k4 = _apparait(p, 0.74, 0.16)
    if k4 > 0:
        d.text((X_CRAYON, 792), "ici : 4 · je connais n", font=police(24, True, mono=True),
               fill=melange(PAPIER, VERT, k4), anchor="lm")
        d.text((X_CRAYON, 832), "donc je complète la fin", font=police(24, True, mono=True),
               fill=melange(PAPIER, VERT, k4), anchor="lm")

    _etiquette_colonne(d, 244, "mon algorithme")
    d.text((1566, 299), "S = S + T[compteur]", font=police(22, True, mono=True),
           fill=AMBRE, anchor="mm")
    ka = _apparait(p, 0.64, 0.18)
    if ka > 0:
        _etiquette_colonne(d, 356, "ce qu'il me manque", VERT)
        for i, (mot, couleur) in enumerate([("où je commence", BLEU),
                                            ("quand je m'arrête", AMBRE)]):
            ai = _apparait(p, 0.66 + 0.10 * i, 0.16)
            if ai <= 0:
                continue
            y = 386 + i * 58
            boite_arrondie(d, [1300, y, 1832, y + 46], rayon=10,
                           fond=melange(FOND_PANNEAU_2, couleur, 0.14 * ai),
                           bord=melange(BORDURE, couleur, 0.75 * ai), largeur_bord=2)
            d.text((1566, y + 23), mot, font=police(19, True),
                   fill=_encre(couleur, ai), anchor="mm")
        k5 = _apparait(p, 0.86, 0.14)
        d.text((1566, 512), "→ une structure complète", font=police(20, True),
               fill=_encre(VERT, k5), anchor="mm")

    _sac_colonne(d, contenu=tuple(str(v) for v in VALEURS), valeur=SOMME_TOTALE, t=t)
    _etat(d, indice=None, somme=SOMME_TOTALE, connue=True, t=t)


# ══════════════════════════════════════════════════════════════════════════
# 11 · La boucle Pour : engendrer le bloc
# ══════════════════════════════════════════════════════════════════════════
def scene_boucle(d, p, t):
    _entete(d, 11, "11 · La boucle Pour : engendrer le bloc")
    _panneaux(d)

    # l'ascenseur fait les quatre tours
    tour = max(0.0, min(4.0, p * 5.4))
    immeuble(d, IMB, actif=min(3, int(tour)), cabine=min(3.0, tour), ouvert=0.8,
             faits=tuple(range(0, min(4, int(tour)))), t=t)

    # le brouillon : pourquoi le compteur dans les crochets
    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "pourquoi [compteur] ?", 24, melange(ENCRE, ROUGE_STYLO, 0.75), 0.04, p)
    for i in range(4):
        k = _apparait(p, 0.16 + 0.12 * i, 0.14)
        if k <= 0:
            continue
        y = _regle(2 + i) - 10
        crayon(d, X_CRAYON, y, f"tour {i + 1}", 22, melange(PAPIER, TEXTE_3, k), 0.16 + 0.12 * i,
               p, 0.14)
        crayon(d, X_CRAYON + 110, y, f"compteur = {i}", 22, melange(PAPIER, BLEU, k),
               0.16 + 0.12 * i, p, 0.14)
        crayon(d, X_CRAYON + 300, y, f"→ {VALEURS[i]}", 24,
               melange(PAPIER, AMBRE if i < 3 else VERT, k), 0.20 + 0.12 * i, p, 0.14)
    stylo_note(d, X_CRAYON, _regle(7) - 6, "il change à chaque tour", 23,
               a_partir_de=0.62, p=p)
    stylo_note(d, X_CRAYON, _regle(8) - 6, "puis il atteint n = 4 :", 22,
               a_partir_de=0.74, p=p)
    stylo_note(d, X_CRAYON, _regle(9) - 6, "la boucle s'arrête", 24,
               a_partir_de=0.80, p=p)

    # la colonne de droite : la boucle complète, et le résultat
    _etiquette_colonne(d, 236, "mon algorithme", VERT)
    # la ligne seule, puis l'enveloppe du bloc autour d'elle
    enveloppe = _apparait(p, 0.24, 0.20)
    y_corps = 272 + 34 * enveloppe
    # d'abord l'enveloppe du bloc, pour que la ligne reste lisible par-dessus
    if enveloppe > 0:
        boite_arrondie(d, [1296, y_corps - 20, 1836, y_corps + 20], rayon=10,
                       fond=melange(FOND_PANNEAU_2, VIOLET, 0.10 * enveloppe),
                       bord=melange(BORDURE, VIOLET, 0.85 * enveloppe), largeur_bord=2)
        etq = _apparait(p, 0.30, 0.16)
        if etq > 0:
            boite_arrondie(d, [1742, y_corps - 13, 1828, y_corps + 13], rayon=7,
                           fond=FOND_PANNEAU_2,
                           bord=melange(BORDURE, VIOLET, 0.9 * etq), largeur_bord=2)
            d.text((1785, y_corps), "le bloc", font=police(15, True),
                   fill=_encre(VIOLET, etq), anchor="mm")
    k0 = _apparait(p, 0.04, 0.16)
    if k0 > 0:
        d.text((1300 + 18 * enveloppe, y_corps), "S = S + T[compteur]",
               font=police(19, True, mono=True), fill=_encre(AMBRE, k0), anchor="lm")
    kp = _apparait(p, 0.26, 0.16)
    if kp > 0:
        d.text((1300, 272), "Pour compteur de 0 à n-1 faire", font=police(19, True, mono=True),
               fill=_encre(TEXTE, kp), anchor="lm")
    kf = _apparait(p, 0.34, 0.16)
    if kf > 0:
        d.text((1300, y_corps + 34), "Fin Pour", font=police(19, True, mono=True),
               fill=_encre(TEXTE, kf), anchor="lm")

    k5 = _apparait(p, 0.46, 0.16)
    if k5 > 0:
        d.text((1566, 392), "n = 4 : quatre tours, puis on sort", font=police(19),
               fill=_encre(VERT, k5), anchor="mm")

    _etiquette_colonne(d, 424, "le JavaScript", VERT)
    js = ["for (let i = 0; i < n; i++) {", "    S = S + T[i];", "}"]
    for i, txt in enumerate(js):
        k = _apparait(p, 0.36 + 0.06 * i, 0.16)
        if k <= 0:
            continue
        d.text((1300, 458 + i * 28), txt, font=police(17, True, mono=True),
               fill=_encre(TEXTE_2, k), anchor="lm")

    sac(d, X_SAC, 634, contenu=tuple(str(v) for v in VALEURS), nom="S", echelle=0.55,
        halo=0.35 + 0.3 * G._pulse(t, 1.7))
    fini = p > 0.70
    boite_arrondie(d, [1420, 762, 1712, 820], rayon=14,
                   fond=melange(FOND_PANNEAU_2, VERT if fini else ORANGE, 0.20),
                   bord=melange(BORDURE, VERT if fini else ORANGE, 0.8), largeur_bord=2)
    d.text((1566, 791), f"S = {SOMME_TOTALE}", font=police(28, True, mono=True),
           fill=TEXTE, anchor="mm")

    _etat(d, indice=min(3, int(tour)), somme=_somme(min(4, int(tour))),
          compteur=min(3, int(tour)), t=t)


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
    "quelquechose": scene_quelquechose,
    "compteur": scene_compteur,
    "pourquoi": scene_pourquoi,
    "boucle": scene_boucle,
}


def dessiner(d: ImageDraw.ImageDraw, cle: str, p: float, t: float):
    """Dessine une scène ; le fond commun est posé ici."""
    G.fond(d, t)
    SCENES[cle](d, p, t)
