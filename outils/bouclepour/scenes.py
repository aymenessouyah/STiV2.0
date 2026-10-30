"""Les vingt-neuf scènes de « Les boucles — Pour, Répéter…jusqu'à, Tant que ».

Trois colonnes, toujours les mêmes :

  * à gauche **le décor** — l'immeuble, l'ascenseur, le sac, la boîte de jetons ;
  * au milieu **le raisonnement** — le brouillon, le schéma de décision, le
    tableau des trois boucles ;
  * à droite **deux cadres séparés** — l'**algorithme** en haut, le
    **JavaScript** en bas. On écrit l'algorithme d'abord, on le traduit après.

Le titre de chapitre affiché en haut de chaque scène est **lu dans
`narration.py`** (`SECTIONS[cle]["titre"]`) : le repère du menu chapitres, le
sous-titre de la vidéo et le numéro d'étape ne peuvent donc pas diverger.

Les noms ne changent jamais d'une partie à l'autre : **S** est la somme des
étages (et rien d'autre), **i** l'indice de tour, **trouvé** le drapeau de la
recherche, **jetons** ce qui reste dans la boîte et **n** ce qui est déjà dans
le sac.
"""
from __future__ import annotations

from PIL import ImageDraw

from theme import (
    FOND, FOND_PANNEAU, FOND_PANNEAU_2, BORDURE, TEXTE, TEXTE_2, TEXTE_3,
    ORANGE, ORANGE_FONCE, AMBRE, VIOLET, VERT, BLEU, ROSE, ROUGE_BORD,
    police, melange, boite_arrondie, texte, largeur_texte, texte_centre,
    couper_texte, fleche,
)
import dessin as G
from dessin import (
    LARGEUR, HAUTEUR, MARGE, PANEL_G, PANEL_M, PANEL_D, ALGO_BOX, JS_BOX, BANDE,
    sac, immeuble, personnage, jeton, cahier, cadre_code, boite_memoire,
    pile_lignes, boucle_schema, bandeau_etat, bulle, coche, panneau, entete,
    etape_pastille, papier_brouillon, crayon, crayon_centre,
    stylo_cercle, stylo_souligne, stylo_note, stylo_fleche,
    schema_arbre, tableau_boucles, bandeau_boucles, cases_tableau, boite_jetons,
    Ligne, _ease, _ease_out, _apparait, VALEURS, SOMME_TOTALE, N_ETAGES,
    ENCRE, ROUGE_STYLO, PAPIER, CODE_FOND,
)
import narration as N

TOTAL = len(N.ORDRE)

# ── Géométrie ──────────────────────────────────────────────────────────────
IMB = [88, 292, 620, 806]
PAPIER_BOX = [686, 250, 1234, 862]
SCHEMA_BOX = [690, 236, 1230, 848]
SCHEMA_HAUT = [690, 230, 1230, 640]
TABLEAU_BOX = [686, 664, 1234, 866]
X_CRAYON = 756
Y_REGLE = 296
PAS_REGLE = 46

# ── Couleurs des trois boucles ─────────────────────────────────────────────
C_POUR, C_REP, C_TQ = AMBRE, VIOLET, VERT

ALGO_POUR = [
    "POUR compteur DE 0 À 3 FAIRE",
    "    S ← S + T[compteur]",
    "FIN POUR",
]
JS_POUR = [
    "let S = 0;",
    "for (let i = 0; i < T.length; i++) {",
    "    S = S + T[i];",
    "}",
]
ALGO_REP = [
    "i ← 0 ; trouvé ← faux",
    "RÉPÉTER",
    "    SI T[i] = X : trouvé ← vrai",
    "    i ← i + 1",
    "JUSQU'À trouvé OU i > 3",
]
JS_REP = [
    "let i = 0, trouve = false;",
    "do {",
    "    if (T[i] === X) trouve = true;",
    "    i++;",
    "} while (!trouve && i < 4);",
]
ALGO_TQ = [
    "TANT QUE jetons > 0 FAIRE",
    "    prendre un jeton",
    "    le mettre dans le sac",
    "    n ← n + 1",
    "FIN TANT QUE",
]
JS_TQ = [
    "while (jetons > 0) {",
    "    jetons--;",
    "    n++;",
    "}",
]


# ══════════════════════════════════════════════════════════════════════════
#  Le cadre commun
# ══════════════════════════════════════════════════════════════════════════
def _entete(d, cle):
    """L'en-tête : même ligne, même barre, et le chapitre lu dans `narration`."""
    d.text((MARGE, 44), "CAPSULE · JAVASCRIPT · LES BOUCLES", font=police(19, True),
           fill=ORANGE)
    d.text((MARGE, 74), "Les boucles — Pour, Répéter…jusqu'à, Tant que",
           font=police(43, True), fill=TEXTE)
    d.text((MARGE, 138), f"{N.numero(cle)} · {N.SECTIONS[cle]['titre']}",
           font=police(23), fill=TEXTE_2)
    x1 = LARGEUR - MARGE
    d.text((x1, 50), f"ÉTAPE {N.numero(cle)} / {TOTAL}", font=police(22, True),
           fill=TEXTE_2, anchor="ra")
    y = 174
    d.rounded_rectangle([MARGE, y, x1, y + 6], radius=3, fill=(26, 38, 58))
    d.rounded_rectangle([MARGE, y, MARGE + (x1 - MARGE) * N.numero(cle) / TOTAL, y + 6],
                        radius=3, fill=ORANGE)


def _panneaux(d, gauche="le décor", milieu="le raisonnement"):
    panneau(d, PANEL_G, gauche, accent=melange(BORDURE, ORANGE, 0.30))
    panneau(d, PANEL_M, milieu, accent=melange(BORDURE, AMBRE, 0.40))


def _cadre_ecriture(d, box, numero, titre_, accent, actif, a=1.0):
    """Un des deux cadres de droite : ① l'algorithme, ② le JavaScript."""
    x0, y0, x1, y1 = box
    couleur = melange(FOND_PANNEAU, CODE_FOND, 0.55) if actif else melange(FOND_PANNEAU, CODE_FOND, 0.25)
    boite_arrondie(d, box, rayon=18, fond=couleur,
                   bord=melange(BORDURE, accent, (0.85 if actif else 0.18) * a),
                   largeur_bord=3 if actif else 2)
    d.ellipse([x0 + 18, y0 + 16, x0 + 46, y0 + 44],
              fill=melange(FOND_PANNEAU_2, accent, 0.55 if actif else 0.18))
    d.text((x0 + 32, y0 + 30), str(numero), font=police(16, True),
           fill=TEXTE if actif else TEXTE_3, anchor="mm")
    d.text((x0 + 58, y0 + 24), titre_, font=police(19, True),
           fill=melange(TEXTE_3, accent, 0.55) if actif else TEXTE_3, anchor="la")
    if actif:
        d.text((x1 - 20, y0 + 26), "je l'écris", font=police(14, True),
               fill=melange(FOND, accent, 0.85), anchor="ra")


def _vide(d, box, texte_):
    """Ce que le cadre dira : l'algorithme d'abord, le JavaScript après."""
    x0, y0, x1, y1 = box
    d.text(((x0 + x1) / 2, (y0 + y1) / 2), texte_, font=police(15),
           fill=melange(FOND_PANNEAU, TEXTE_3, 0.60), anchor="mm")


def _code(d, box, lignes, accent, actif, p, seuil=0.06, pas=0.11, taille=20):
    """Écrit le code ligne à ligne, avec un curseur sur la ligne en cours."""
    if not lignes:
        return
    x0, y0, x1, y1 = box
    y = y0 + 62
    for i, ligne in enumerate(lignes):
        k = _apparait(p, seuil + pas * i, 0.10)
        if k <= 0:
            break
        visible = ligne[: max(1, int(len(ligne) * k + 0.999))]
        couleur = melange(FOND, accent if actif else TEXTE_3, 0.95 if actif else 0.42)
        f = police(taille, True, mono=True)
        d.text((x0 + 24, y), visible, font=f, fill=couleur, anchor="lm")
        if k < 1:
            largeur = f.getlength(visible)
            d.rectangle([x0 + 26 + largeur, y - taille * 0.6,
                         x0 + 29 + largeur, y + taille * 0.6], fill=AMBRE)
        y += taille + 12


def _ecritures(d, p, algo=None, js=None, algo_on=False, js_on=False,
               seuil_algo=0.06, seuil_js=0.30,
               vide_algo="① l'algorithme viendra ici",
               vide_js="② le JavaScript viendra après"):
    """Les deux cadres de droite : ce qui est écrit, et ce qui viendra."""
    _cadre_ecriture(d, ALGO_BOX, 1, "l'ALGORITHME", C_POUR, algo_on)
    _cadre_ecriture(d, JS_BOX, 2, "le JAVASCRIPT", VERT, js_on)
    if algo:
        _code(d, ALGO_BOX, algo, C_POUR, algo_on, p, seuil=seuil_algo, taille=18)
    else:
        _vide(d, ALGO_BOX, vide_algo)
    if js:
        _code(d, JS_BOX, js, VERT, js_on, p, seuil=seuil_js, taille=18)
    else:
        _vide(d, JS_BOX, vide_js)


def _etat(d, actif=None, info="", couleur=TEXTE_2):
    bandeau_boucles(d, actif=actif, info=info, info_couleur=couleur)


def _regle(i):
    return Y_REGLE + i * PAS_REGLE


def _ligne(d, i, texte_, taille=26, couleur=ENCRE, a_partir_de=0.0, p=1.0, duree=0.20,
           gras=False):
    return crayon(d, X_CRAYON, _regle(i) - 10, texte_, taille, couleur,
                  a_partir_de, p, duree, gras)


def _trois_blocs(d, actif=None, y0=250, hauteur=128, ecart=18):
    """Les trois boucles, empilées dans la colonne de gauche.

    `hauteur` et `ecart` se réduisent quand la place manque (scène d'ouverture) :
    les trois blocs doivent toujours tenir dans le panneau (bas : 884 px).
    """
    blocs = [
        (C_POUR, "pour", "POUR", "de I à F, FAIRE le bloc", "FIN POUR"),
        (C_REP, "repeter", "RÉPÉTER", "le bloc, puis le test", "JUSQU'À condition"),
        (C_TQ, "tantque", "TANT QUE", "le test AVANT le bloc", "FIN TANT QUE"),
    ]
    compact = hauteur < 120
    y = y0
    for couleur, cle, nom, detail, fin in blocs:
        allume = actif == cle
        boite_arrondie(d, [96, y, 612, y + hauteur], rayon=16,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.18 if allume else 0.05),
                       bord=melange(BORDURE, couleur, 0.85 if allume else 0.25),
                       largeur_bord=3 if allume else 2)
        d.text((118, y + 16), nom, font=police(22 if compact else 24, allume),
               fill=TEXTE if allume else TEXTE_3, anchor="la")
        d.text((118, y + (46 if compact else 58)), detail, font=police(14 if compact else 15),
               fill=TEXTE_2 if allume else melange(FOND_PANNEAU_2, TEXTE_3, 0.8), anchor="la")
        d.text((588, y + hauteur - 28), fin, font=police(14 if compact else 15, True, mono=True),
               fill=melange(FOND, couleur if allume else TEXTE_3, 0.9), anchor="ra")
        y += hauteur + ecart


def _immeuble_statique(d, actif=None, cabine=None, faits=(), ouvert=0.0, t=0.0):
    immeuble(d, IMB, actif=actif, cabine=cabine, faits=faits, ouvert=ouvert, t=t)


def _recherche(d, i=None, trouve=None, t=0.0, x=7):
    """L'immeuble et la carte « X » : la recherche au fil des cases."""
    immeuble(d, [88, 300, 588, 780], actif=i,
             cabine=(float(i) if i is not None else None),
             faits=tuple(range(0, i)) if i else (),
             ouvert=0.7 if i is not None else 0.0, t=t)
    boite_arrondie(d, [96, 806, 300, 862], rayon=12,
                   fond=melange(FOND_PANNEAU_2, ROSE, 0.16),
                   bord=melange(BORDURE, ROSE, 0.8), largeur_bord=2)
    d.text((198, 834), f"X = {x}", font=police(24, True, mono=True), fill=ROSE, anchor="mm")
    if trouve is True:
        d.text((452, 834), "trouvé ✓", font=police(22, True), fill=VERT, anchor="mm")
    elif trouve is False:
        d.text((452, 834), "absent", font=police(22, True), fill=ROUGE_BORD, anchor="mm")


# ══════════════════════════════════════════════════════════════════════════
#  1 · Bienvenue : la phrase d'ouverture, la définition, les trois boucles
# ══════════════════════════════════════════════════════════════════════════
def scene_ouverture(d, p, t):
    _entete(d, "ouverture")
    panneau(d, PANEL_G, "ce qu'on va voir", accent=melange(BORDURE, ORANGE, 0.30))
    panneau(d, PANEL_M, "l'histoire des boucles", accent=melange(BORDURE, AMBRE, 0.40))

    # à gauche : la définition, puis les trois boucles
    boite_arrondie(d, [96, 232, 612, 430], rayon=18,
                   fond=melange(FOND_PANNEAU_2, AMBRE, 0.12),
                   bord=melange(BORDURE, AMBRE, 0.70), largeur_bord=2)
    d.text((118, 254), "une boucle, c'est", font=police(18), fill=TEXTE_2, anchor="la")
    k = _apparait(p, 0.12, 0.12)
    if k > 0:
        d.text((118, 290), "une instruction qui", font=police(23, True),
               fill=TEXTE, anchor="la")
        d.text((118, 326), "répète un bloc", font=police(23, True),
               fill=melange(FOND, AMBRE, k), anchor="la")
        d.text((118, 362), "d'instructions.", font=police(23, True),
               fill=melange(FOND, AMBRE, k), anchor="la")
        d.text((118, 398), "en JavaScript, il y en a trois.", font=police(14),
               fill=melange(FOND, TEXTE_2, k), anchor="la")

    _trois_blocs(d, None, 450, hauteur=112, ecart=14)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "aujourd'hui :", 24, melange(ENCRE, TEXTE_3, 0.45), 0.28, p)
    _ligne(d, 1, "l'histoire des boucles", 30, AMBRE, 0.36, p, gras=True)
    _ligne(d, 3, "les trois boucles, une par une", 22, ENCRE, 0.50, p)
    _ligne(d, 4, "et le schéma pour choisir", 22, VERT, 0.58, p)
    _ligne(d, 6, "même décor, mêmes exemples,", 20, melange(ENCRE, TEXTE_3, 0.4), 0.70, p)
    _ligne(d, 7, "du début à la fin", 20, melange(ENCRE, TEXTE_3, 0.4), 0.76, p)

    _ecritures(d, p, vide_algo="① l'algorithme, en français",
               vide_js="② le JavaScript, à côté")
    _etat(d, None, "trois boucles, un seul schéma")


# ══════════════════════════════════════════════════════════════════════════
#  2 · Ce qu'est une boucle, et pourquoi
# ══════════════════════════════════════════════════════════════════════════
def scene_introduction(d, p, t):
    _entete(d, "introduction")
    panneau(d, PANEL_G, "sans boucle", accent=melange(BORDURE, ROUGE_BORD, 0.45))
    panneau(d, PANEL_M, "avec une boucle", accent=melange(BORDURE, VERT, 0.45))

    # à gauche : les lignes recopiées à la main (4, puis 100 en rouge)
    boite_arrondie(d, [96, 236, 612, 492], rayon=18,
                   fond=melange(FOND_PANNEAU_2, ROUGE_BORD, 0.08),
                   bord=melange(BORDURE, ROUGE_BORD, 0.55), largeur_bord=2)
    d.text((118, 256), "4 nombres : je recopie 4 lignes", font=police(16, True),
           fill=TEXTE_2, anchor="la")
    for k in range(4):
        kk = _apparait(p, 0.08 + 0.05 * k, 0.08)
        if kk <= 0:
            break
        d.text((118, 288 + k * 28), f"S = S + T[{k}]", font=police(19, True, mono=True),
               fill=melange(FOND_PANNEAU_2, TEXTE, kk), anchor="la")
    if p > 0.40:
        d.text((118, 396), "100 nombres : 100 lignes", font=police(18, True),
               fill=ROUGE_BORD, anchor="la")
        d.text((118, 424), "et une faute au troisième.", font=police(14),
               fill=TEXTE_3, anchor="la")

    # et ce que le programme doit décider à chaque tour
    if p > 0.62:
        boite_arrondie(d, [96, 494, 612, 644], rayon=18,
                       fond=melange(FOND_PANNEAU_2, VERT, 0.08),
                       bord=melange(BORDURE, VERT, 0.55), largeur_bord=2)
        d.text((118, 516), "à chaque tour, il faut", font=police(15), fill=TEXTE_3,
               anchor="la")
        d.text((118, 544), "continuer  ou  s'arrêter", font=police(21, True),
               fill=VERT, anchor="la")
        d.text((118, 590), "c'est la condition", font=police(16), fill=TEXTE_2,
               anchor="la")

    # au milieu : le bloc écrit une fois, et ce qu'il faut pour le répéter
    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "avec une boucle :", 24, melange(ENCRE, TEXTE_3, 0.45), 0.30, p)
    _ligne(d, 1, "j'écris le bloc UNE fois", 24, VERT, 0.38, p, gras=True)
    if p > 0.52:
        stylo_note(d, X_CRAYON, _regle(3) - 6, "un bloc", 24, a_partir_de=0.52, p=p)
        stylo_note(d, X_CRAYON, _regle(4) - 6, "des tours", 24, a_partir_de=0.60, p=p)
        stylo_note(d, X_CRAYON, _regle(5) - 6, "une condition", 24, a_partir_de=0.68, p=p)
    _ligne(d, 7, "le bloc ne change pas :", 21, ENCRE, 0.78, p)
    _ligne(d, 8, "seul le nombre de tours change", 21, AMBRE, 0.86, p, gras=True)

    _ecritures(d, p, vide_algo="① un bloc, des tours, une condition",
               vide_js="② deux écritures, jamais mélangées")
    _etat(d, None, "un bloc, des tours, une condition")


# ══════════════════════════════════════════════════════════════════════════
#  3 · Le décor et le problème
# ══════════════════════════════════════════════════════════════════════════
def scene_probleme(d, p, t):
    _entete(d, "probleme")
    _panneaux(d, "l'immeuble", "le brouillon")
    _immeuble_statique(d, cabine=0.0, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "quatre étages, quatre nombres", 22, melange(ENCRE, TEXTE_3, 0.4), 0.06, p)
    _ligne(d, 2, "T = [4, 7, 2, 9]", 30, AMBRE, 0.30, p, gras=True)
    _ligne(d, 3, "c'est un tableau : T", 24, ENCRE, 0.44, p)
    _ligne(d, 5, "ce que je veux :", 24, melange(ENCRE, TEXTE_3, 0.4), 0.58, p)
    _ligne(d, 6, "S = T[0] + T[1] + T[2] + T[3]", 24, ORANGE, 0.66, p)
    _ligne(d, 7, "S = ?", 36, ORANGE, 0.78, p, gras=True)

    _ecritures(d, p, vide_algo="① l'algorithme, plus tard",
               vide_js="② le JavaScript, plus tard")
    _etat(d, None, "S = ?")


# ══════════════════════════════════════════════════════════════════════════
#  4 · Quatre fois le même geste
# ══════════════════════════════════════════════════════════════════════════
# ══════════════════════════════════════════════════════════════════════════
#  4 · L'immeuble a un nom : T
# ══════════════════════════════════════════════════════════════════════════
def scene_immeuble(d, p, t):
    _entete(d, "immeuble")
    _panneaux(d, "l'immeuble T", "le brouillon")
    _immeuble_statique(d, cabine=0.0, t=t)

    # le nom, posé sur le toit
    k = _apparait(p, 0.42, 0.16)
    if k > 0:
        boite_arrondie(d, [328, 206, 442, 264], rayon=14,
                       fond=melange(FOND_PANNEAU_2, AMBRE, 0.30 * k),
                       bord=melange(BORDURE, AMBRE, 0.95 * k), largeur_bord=3)
        d.text((385, 235), "T", font=police(32, True, mono=True),
               fill=melange(FOND, AMBRE, k), anchor="mm")
        d.text((330, 278), "le nom de l'immeuble", font=police(15),
               fill=melange(FOND, TEXTE_2, k), anchor="la")

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "pourquoi un nom ?", 25, melange(ENCRE, TEXTE_3, 0.4), 0.04, p)
    _ligne(d, 2, "l'immeuble contient des éléments", 22, ENCRE, 0.12, p)
    _ligne(d, 3, "et son contenu peut varier", 22, ENCRE, 0.24, p)
    _ligne(d, 5, "aujourd'hui :  [4, 7, 2, 9]", 22, AMBRE, 0.36, p)
    _ligne(d, 6, "demain :       [8, 15, 3, 6]", 22, melange(ENCRE, TEXTE_3, 0.35),
           0.50, p)
    if p > 0.62:
        stylo_note(d, X_CRAYON, _regle(8) - 6, "je ne nomme pas le contenu,", 23,
                   a_partir_de=0.62, p=p)
    if p > 0.74:
        stylo_note(d, X_CRAYON, _regle(9) - 6, "je nomme l'immeuble : T", 25,
                   a_partir_de=0.74, p=p)
    if p > 0.86:
        d.text((X_CRAYON, _regle(11) - 10), "T[0]  T[1]  T[2]  T[3]",
               font=police(23, True, mono=True), fill=melange(FOND, VERT, 1.0),
               anchor="lm")

    _ecritures(d, p, vide_algo="① l'algorithme, plus tard",
               vide_js="② le JavaScript, plus tard")
    _etat(d, None, "l'immeuble s'appelle T")


# ══════════════════════════════════════════════════════════════════════════
#  5 · L'ascenseur : la cabine carrée, les portes, T[i]
# ══════════════════════════════════════════════════════════════════════════
def _cabine_crochets(d, cx, cy, indice, ouverture=1.0, echelle=1.0):
    """Le crochet, dessiné comme une cabine : [ i ]."""
    k = _ease(ouverture)
    larg, haut = 66 * echelle, 58 * echelle
    boite_arrondie(d, [cx - larg, cy - haut / 2, cx + larg, cy + haut / 2], rayon=10,
                   fond=melange(FOND_PANNEAU_2, BLEU, 0.16 * k),
                   bord=melange(BORDURE, BLEU, 0.9 * k), largeur_bord=3)
    # les deux battants
    reste = max(0.0, 1.0 - k)
    if reste > 0.02:
        demi = larg * reste / 2
        d.rectangle([cx - demi, cy - haut / 2 + 4, cx + demi, cy + haut / 2 - 4],
                    fill=melange(FOND_PANNEAU_2, BLEU, 0.35))
    d.text((cx, cy), str(indice), font=police(int(26 * echelle), True, mono=True),
           fill=melange(FOND, AMBRE, k), anchor="mm")
    # les crochets eux-mêmes
    b = 14 * echelle
    d.line([(cx - larg - b, cy - haut / 2), (cx - larg, cy - haut / 2),
            (cx - larg, cy + haut / 2), (cx - larg - b, cy + haut / 2)],
           fill=melange(FOND, TEXTE, k), width=max(2, int(4 * echelle)))
    d.line([(cx + larg, cy - haut / 2), (cx + larg + b, cy - haut / 2),
            (cx + larg + b, cy + haut / 2), (cx + larg, cy + haut / 2)],
           fill=melange(FOND, TEXTE, k), width=max(2, int(4 * echelle)))


def scene_ascenseur(d, p, t):
    _entete(d, "ascenseur")
    _panneaux(d, "l'ascenseur", "le brouillon")
    # l'ascenseur part du dernier étage et s'arrête à l'étage 0, comme T[0]
    montee = min(1.0, max(0.0, (p - 0.10) / 0.46))
    cabine = 3.0 - 3.0 * _ease(montee)
    ouvert = 1.0 if p > 0.62 else 0.0
    _immeuble_statique(d, actif=int(round(cabine)), cabine=cabine, ouvert=ouvert, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "T[0]", 32, AMBRE, 0.06, p, gras=True)
    _ligne(d, 2, "je suis dans l'immeuble T", 22, ENCRE, 0.18, p)
    _ligne(d, 3, "j'ai pris l'ascenseur", 22, ENCRE, 0.30, p)
    _ligne(d, 4, "il s'arrête à l'étage 0", 22, ENCRE, 0.42, p)
    if p > 0.56:
        stylo_note(d, X_CRAYON, _regle(6) - 6, "portes fermées : rien", 22,
                   a_partir_de=0.56, p=p)
    if p > 0.68:
        stylo_note(d, X_CRAYON, _regle(7) - 6, "portes ouvertes : 4", 24,
                   a_partir_de=0.68, p=p)
    if p > 0.80:
        d.text((X_CRAYON, _regle(9) - 10), "les crochets = la cabine",
               font=police(21, True), fill=melange(FOND, BLEU, 1.0), anchor="lm")
        d.text((X_CRAYON, _regle(10) - 10), "l'indice = l'étage",
               font=police(21, True), fill=melange(FOND, AMBRE, 1.0), anchor="lm")
        _cabine_crochets(d, 960, 812, "i", ouverture=1.0, echelle=0.86)

    _ecritures(d, p, vide_algo="① l'algorithme, plus tard",
               vide_js="② le JavaScript, plus tard")
    _etat(d, None, "T[i] : l'étage i, portes ouvertes")


# ══════════════════════════════════════════════════════════════════════════
#  6 · Le compteur de l'ascenseur : un type scalaire
# ══════════════════════════════════════════════════════════════════════════
def scene_scalaire(d, p, t):
    _entete(d, "scalaire")
    _panneaux(d, "le compteur de l'ascenseur", "le brouillon")
    etage = min(3.0, max(0.0, (p - 0.06) / 0.20))
    _immeuble_statique(d, actif=int(round(etage)), cabine=etage, ouvert=0.5, t=t)

    # la suite des étages, avec les successeurs
    if p > 0.16:
        d.text((354, 856), "0 → 1 → 2 → 3  …", font=police(22, True, mono=True),
               fill=melange(FOND, BLEU, _apparait(p, 0.16, 0.14)), anchor="mm")

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "un type scalaire, c'est un type", 21, melange(ENCRE, TEXTE_3, 0.4),
           0.04, p)
    _ligne(d, 1, "avec un successeur", 24, ENCRE, 0.12, p)
    _ligne(d, 2, "et un prédécesseur", 24, ENCRE, 0.22, p)
    _ligne(d, 4, "l'entier   ·   le caractère", 23, AMBRE, 0.36, p)
    _ligne(d, 6, "3  →  successeur : 4", 24, VERT, 0.50, p)
    _ligne(d, 7, "3  →  prédécesseur : 2", 24, ROUGE_BORD, 0.62, p)
    if p > 0.74:
        stylo_note(d, X_CRAYON, _regle(9) - 6, "d'où  i + 1  : je monte d'un étage", 23,
                   a_partir_de=0.74, p=p)
    if p > 0.86:
        d.text((X_CRAYON, _regle(11) - 10), "l'ascenseur compte tout seul",
               font=police(22, True), fill=melange(FOND, AMBRE, 1.0), anchor="lm")

    _ecritures(d, p, vide_algo="① l'algorithme, plus tard",
               vide_js="② le JavaScript, plus tard")
    _etat(d, None, "scalaire : successeur et prédécesseur")


# ══════════════════════════════════════════════════════════════════════════
#  11 · Engendrer : d'une ligne, la boucle en fabrique quatre
# ══════════════════════════════════════════════════════════════════════════
def scene_engendrer(d, p, t):
    _entete(d, "engendrer")
    _panneaux(d, "l'immeuble", "le brouillon")
    _immeuble_statique(d, actif=None, cabine=None, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "mes quatre lignes :", 22, melange(ENCRE, TEXTE_3, 0.4), 0.04, p)
    for k in range(4):
        kk = _apparait(p, 0.10 + 0.05 * k, 0.06)
        if kk <= 0:
            continue
        d.text((X_CRAYON, _regle(1 + k) - 10), f"S = S + T[{k}]",
               font=police(21, True, mono=True),
               fill=melange(PAPIER, ENCRE, kk), anchor="lm")

    if p > 0.34:
        d.line([(X_CRAYON, _regle(5) - 4), (X_CRAYON + 400, _regle(5) - 4)],
               fill=melange(PAPIER, ENCRE, 0.45), width=2)
    if p > 0.40:
        sty = _apparait(p, 0.40, 0.12)
        d.text((X_CRAYON, _regle(6) - 10), "une seule chose change :",
               font=police(20), fill=melange(PAPIER, TEXTE_3, sty), anchor="lm")
    if p > 0.50:
        st = _apparait(p, 0.50, 0.12)
        d.text((X_CRAYON, _regle(7) - 10), "le chiffre entre les crochets",
               font=police(20), fill=melange(PAPIER, ROUGE_STYLO, st), anchor="lm")
    if p > 0.62:
        st = _apparait(p, 0.62, 0.12)
        d.text((X_CRAYON, _regle(9) - 10), "S = S + T[quelque chose]",
               font=police(24, True, mono=True), fill=melange(PAPIER, AMBRE, st),
               anchor="lm")
    if p > 0.76:
        stylo_note(d, X_CRAYON, _regle(10) - 6, "la boucle Pour l'engendre × 4", 23,
                   a_partir_de=0.76, p=p)
    if p > 0.88:
        d.text((X_CRAYON, _regle(12) - 10), "une ligne écrite → quatre étages",
               font=police(21, True), fill=melange(FOND, VERT, 1.0), anchor="lm")

    _ecritures(d, p, vide_algo="① l'algorithme arrive",
               vide_js="② le JavaScript suivra")
    _etat(d, "pour", "engendrer : 1 → 4", C_POUR)


def scene_repetition(d, p, t):
    _entete(d, "repetition")
    _panneaux(d, "l'immeuble", "le brouillon")
    etage = min(3, int(p * 3.4))
    _immeuble_statique(d, actif=etage, cabine=float(etage),
                       faits=tuple(range(etage)), ouvert=0.6, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "ce que je note :", 24, melange(ENCRE, TEXTE_3, 0.45), 0.04, p)
    for k in range(4):
        a = 0.10 + 0.14 * k
        kk = _apparait(p, a, 0.14)
        if kk <= 0:
            continue
        _ligne(d, 2 + k, f"S = S + T[{k}]", 26, melange(ENCRE, TEXTE, kk), a, p, 0.14)
    if p > 0.66:
        stylo_note(d, X_CRAYON, _regle(7) - 6, "toujours le même geste", 24,
                   a_partir_de=0.66, p=p)
    if p > 0.82:
        stylo_note(d, X_CRAYON, _regle(8) - 6, "seul le chiffre change", 22,
                   a_partir_de=0.82, p=p)

    _ecritures(d, p, vide_algo="① pas encore d'écriture",
               vide_js="② ni de code")
    _etat(d, None, "une répétition !")


# ══════════════════════════════════════════════════════════════════════════
#  5-7 · Le schéma de décision, question par question
# ══════════════════════════════════════════════════════════════════════════
def scene_q1(d, p, t):
    _entete(d, "q1")
    _panneaux(d, "l'immeuble", "le schéma de décision")
    _immeuble_statique(d, actif=3, cabine=3.0, t=t)
    schema_arbre(d, SCHEMA_BOX, etape=1, actif=None, a=1.0, t=p * 9)
    d.text((960, 704), "4 étages  →  4 tours", font=police(24, True), fill=C_POUR,
           anchor="mm")
    d.text((960, 744), "oui : je connais le nombre de répétitions", font=police(19),
           fill=TEXTE_2, anchor="mm")
    _ecritures(d, p, vide_algo="① l'algorithme attend", vide_js="② le JavaScript attend")
    _etat(d, None, "oui : 4 tours")


def scene_q2(d, p, t):
    _entete(d, "q2")
    _panneaux(d, "l'immeuble", "le schéma de décision")
    _immeuble_statique(d, actif=3, cabine=3.0, faits=(0, 1, 2), t=t)
    schema_arbre(d, SCHEMA_BOX, etape=2, actif=None, a=1.0, t=p * 9)
    d.text((960, 704), "je vais jusqu'au dernier étage", font=police(22, True),
           fill=TEXTE, anchor="mm")
    d.text((960, 744), "sinon ma somme est fausse", font=police(19), fill=TEXTE_2,
           anchor="mm")
    _ecritures(d, p, vide_algo="① l'algorithme attend", vide_js="② le JavaScript attend")
    _etat(d, None, "non : pas d'arrêt avant la fin")


def scene_q3(d, p, t):
    _entete(d, "q3")
    _panneaux(d, "les trois boucles", "le schéma de décision")
    _trois_blocs(d, None, 300)
    schema_arbre(d, SCHEMA_BOX, etape=3, actif=None, a=1.0, t=p * 9)
    d.text((960, 704), "au moins une fois  →  RÉPÉTER…JUSQU'À", font=police(22, True),
           fill=C_REP, anchor="mm")
    d.text((960, 744), "risque de zéro tour  →  TANT QUE", font=police(22, True),
           fill=C_TQ, anchor="mm")
    _ecritures(d, p, vide_algo="① l'algorithme attend", vide_js="② le JavaScript attend")
    _etat(d, None, "le schéma est complet")


# ══════════════════════════════════════════════════════════════════════════
#  8-10 · La boucle POUR
# ══════════════════════════════════════════════════════════════════════════
def scene_pour_algo(d, p, t):
    _entete(d, "pour_algo")
    _panneaux(d, "l'immeuble", "le brouillon")
    _immeuble_statique(d, actif=0, cabine=0.0, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "le bloc, écrit une seule fois :", 22, melange(ENCRE, TEXTE_3, 0.4), 0.04, p)
    _ligne(d, 2, "S = S + T[compteur]", 24, melange(ENCRE, TEXTE_3, 0.45), 0.02, 1.0)
    _ligne(d, 4, "d'où je pars ?  →  0", 24, ENCRE, 0.28, p)
    _ligne(d, 5, "où je m'arrête ?  →  3", 24, ENCRE, 0.38, p)
    _ligne(d, 7, "→ POUR compteur DE 0 À 3", 24, AMBRE, 0.58, p, gras=True)
    _ligne(d, 8, "→ et FAIRE le bloc", 22, VERT, 0.74, p)
    if p > 0.86:
        d.text((X_CRAYON, _regle(10) - 10), "le trou est rempli par le compteur",
               font=police(20, True), fill=melange(FOND, AMBRE, 1.0), anchor="lm")

    _ecritures(d, p, ALGO_POUR, None, algo_on=True, seuil_algo=0.14,
               vide_js="② le JavaScript : à la scène suivante")
    _etat(d, "pour", "compteur : 0 → 3", C_POUR)


def scene_pour_js(d, p, t):
    _entete(d, "pour_js")
    _panneaux(d, "l'immeuble", "le brouillon")
    _immeuble_statique(d, actif=0, cabine=0.0, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "trois morceaux, trois rôles", 22, melange(ENCRE, TEXTE_3, 0.4), 0.04, p)
    morceaux = [
        (0.12, "1", "i = 0", BLEU, "condition de départ"),
        (0.26, "2", "i < T.length", VERT, "condition de continuité"),
        (0.40, "3", "i++", AMBRE, "avancement du pas"),
    ]
    for seuil, numero, code, couleur, role in morceaux:
        if p <= seuil:
            continue
        k = _apparait(p, seuil, 0.10)
        y = _regle(2 + morceaux.index((seuil, numero, code, couleur, role))) - 10
        d.ellipse([X_CRAYON, y - 12, X_CRAYON + 24, y + 12],
                  fill=melange(PAPIER, couleur, 0.85 * k))
        d.text((X_CRAYON + 12, y), numero, font=police(16, True),
               fill=melange(PAPIER, FOND, k), anchor="mm")
        d.text((X_CRAYON + 36, y), code, font=police(23, True, mono=True),
               fill=melange(PAPIER, couleur, k), anchor="lm")
        d.text((X_CRAYON + 474, y), role, font=police(16),
               fill=melange(PAPIER, TEXTE_3, k), anchor="rm")
    if p > 0.56:
        stylo_note(d, X_CRAYON, _regle(6) - 6, "T.length = la hauteur : 4 étages", 21,
                   a_partir_de=0.56, p=p)
    if p > 0.70:
        stylo_note(d, X_CRAYON, _regle(7) - 6, "i++  c'est  i = i + 1", 23,
                   a_partir_de=0.70, p=p)
    if p > 0.84:
        d.text((X_CRAYON, _regle(9) - 10), "départ · continuité · pas",
               font=police(21, True), fill=melange(FOND, VERT, 1.0), anchor="lm")

    _ecritures(d, p, ALGO_POUR, JS_POUR, algo_on=False, js_on=True, seuil_js=0.16)
    _etat(d, "pour", "traduction en JavaScript", VERT)


def scene_pour_trace(d, p, t):
    _entete(d, "pour_trace")
    _panneaux(d, "l'immeuble", "le brouillon")
    tour = max(0.0, min(3.0, (p - 0.05) / 0.24))
    _immeuble_statique(d, actif=min(3, int(round(tour))), cabine=tour, ouvert=0.8,
                       faits=tuple(range(0, min(4, int(tour) + 1))), t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "j'exécute :", 24, melange(ENCRE, TEXTE_3, 0.45), 0.04, p)
    for k in range(4):
        kk = _apparait(p, 0.10 + 0.14 * k, 0.14)
        if kk <= 0:
            continue
        y = _regle(2 + k) - 10
        d.text((X_CRAYON, y), f"i = {k}", font=police(24, True, mono=True),
               fill=melange(PAPIER, BLEU, kk), anchor="lm")
        d.text((X_CRAYON + 108, y), f"+ {VALEURS[k]}", font=police(24, True, mono=True),
               fill=melange(PAPIER, AMBRE, kk), anchor="lm")
        d.text((X_CRAYON + 220, y), f"→ S = {sum(VALEURS[:k + 1])}",
               font=police(24, True, mono=True),
               fill=melange(PAPIER, VERT, kk), anchor="lm")
    if p > 0.76:
        stylo_note(d, X_CRAYON, _regle(7) - 6, "i vaut 4 :  4 < 4 est faux", 23,
                   a_partir_de=0.76, p=p)
    if p > 0.88:
        d.text((X_CRAYON, _regle(9) - 10), "la condition de continuité s'arrête",
               font=police(20, True), fill=melange(FOND, VERT, 1.0), anchor="lm")

    _ecritures(d, p, ALGO_POUR, JS_POUR, algo_on=False, js_on=False)
    _etat(d, "pour", "S = 22", VERT)


# ══════════════════════════════════════════════════════════════════════════
# 11-13 · Rappels : le schéma, le tableau, ET l'écriture de la boucle
# ══════════════════════════════════════════════════════════════════════════
def _scene_rappel(d, p, cle, actif, info, algo, js):
    _entete(d, cle)
    _panneaux(d, "les trois boucles", "le schéma et le tableau")
    _trois_blocs(d, actif, 250)
    schema_arbre(d, SCHEMA_HAUT, etape=3, actif=actif, a=1.0, t=p * 9)
    tableau_boucles(d, TABLEAU_BOX, actif=actif, a=1.0)
    # la colonne de droite montre vraiment ce qui est écrit pour cette boucle
    _ecritures(d, p, algo, js, algo_on=True, js_on=True,
               seuil_algo=0.10, seuil_js=0.34)
    _etat(d, actif, info)


def scene_rappel1(d, p, t):
    _scene_rappel(d, p, "rappel1", "pour", "tours connus, pas d'arrêt",
                  ALGO_POUR, JS_POUR)


def scene_rappel2(d, p, t):
    _scene_rappel(d, p, "rappel2", "repeter", "au moins un tour garanti",
                  ALGO_REP, JS_REP)


def scene_rappel3(d, p, t):
    _scene_rappel(d, p, "rappel3", "tantque", "zéro tour possible",
                  ALGO_TQ, JS_TQ)


# ══════════════════════════════════════════════════════════════════════════
# 12-17 · Chercher X : la boucle RÉPÉTER…JUSQU'À
# ══════════════════════════════════════════════════════════════════════════
def scene_chercher_quoi(d, p, t):
    _entete(d, "chercher_quoi")
    _panneaux(d, "je cherche X", "le brouillon")
    _recherche(d, i=None, trouve=None, t=t, x=7)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "nouveau problème :", 24, melange(ENCRE, TEXTE_3, 0.4), 0.04, p)
    _ligne(d, 1, "chercher X dans T", 28, ROSE, 0.14, p, gras=True)
    _ligne(d, 3, "si X est au 1er étage → 1 tour", 22, ENCRE, 0.34, p)
    _ligne(d, 4, "s'il est au dernier → 4 tours", 22, ENCRE, 0.46, p)
    _ligne(d, 5, "s'il n'est pas là → 4 tours, rien", 22, ENCRE, 0.58, p)
    _ligne(d, 7, "→ nombre de tours inconnu", 24, AMBRE, 0.72, p, gras=True)

    _ecritures(d, p, vide_algo="① on verra à l'étape 14", vide_js="② puis à la 15")
    _etat(d, None, "tours inconnus")


def scene_chercher_q(d, p, t):
    _entete(d, "chercher_q")
    _panneaux(d, "je cherche X", "le schéma de décision")
    _recherche(d, i=0, trouve=None, t=t, x=7)
    schema_arbre(d, [690, 300, 1230, 700], etape=3, actif="repeter", a=1.0, t=p * 9)
    d.text((960, 748), "une condition d'arrêt, et au moins un tour",
           font=police(19), fill=TEXTE_2, anchor="mm")
    d.text((960, 784), "→ RÉPÉTER…JUSQU'À", font=police(24, True), fill=C_REP, anchor="mm")
    _ecritures(d, p, vide_algo="① l'algorithme arrive", vide_js="② le code ensuite")
    _etat(d, "repeter", "RÉPÉTER…JUSQU'À", C_REP)


def scene_repet_algo(d, p, t):
    _entete(d, "repet_algo")
    _panneaux(d, "je cherche X", "le brouillon")
    _recherche(d, i=0, trouve=None, t=t, x=7)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "deux façons de sortir :", 24, melange(ENCRE, TEXTE_3, 0.4), 0.04, p)
    _ligne(d, 2, "① j'ai trouvé X", 26, VERT, 0.20, p, gras=True)
    _ligne(d, 3, "② i dépasse la dernière case", 24, VIOLET, 0.34, p, gras=True)
    _ligne(d, 5, "je répète au moins une fois,", 22, ENCRE, 0.58, p)
    _ligne(d, 6, "puis je teste", 22, ENCRE, 0.64, p)
    _ligne(d, 8, "→ RÉPÉTER / JUSQU'À", 26, VIOLET, 0.76, p, gras=True)

    _ecritures(d, p, ALGO_REP, None, algo_on=True, seuil_algo=0.12,
               vide_js="② do … while : étape suivante")
    _etat(d, "repeter", "le test APRÈS le bloc", C_REP)


def scene_repet_js(d, p, t):
    _entete(d, "repet_js")
    _panneaux(d, "je cherche X", "le brouillon")
    _recherche(d, i=0, trouve=None, t=t, x=7)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "RÉPÉTER…JUSQU'À", 24, VIOLET, 0.04, p, gras=True)
    _ligne(d, 1, "→  do … while", 28, VERT, 0.14, p, gras=True)
    _ligne(d, 3, "le corps s'exécute", 22, ENCRE, 0.36, p)
    _ligne(d, 4, "AVANT le test", 22, AMBRE, 0.44, p, gras=True)
    _ligne(d, 6, "donc : au moins un tour,", 22, ENCRE, 0.66, p)
    _ligne(d, 7, "toujours", 22, VERT, 0.72, p)

    _ecritures(d, p, ALGO_REP, JS_REP, algo_on=False, js_on=True, seuil_js=0.14)
    _etat(d, "repeter", "do { … } while (…)", VERT)


def _trace_recherche(d, p, x, arrets, message, resultat):
    """Les lignes de la recherche : i, la valeur, et la décision."""
    _ligne(d, 0, f"X = {x}", 26, ROSE, 0.04, p, gras=True)
    for k in range(arrets):
        kk = _apparait(p, 0.10 + 0.15 * k, 0.14)
        if kk <= 0:
            continue
        y = _regle(2 + k) - 10
        d.text((X_CRAYON, y), f"i = {k}", font=police(22, True, mono=True),
               fill=melange(PAPIER, BLEU, kk), anchor="lm")
        d.text((X_CRAYON + 96, y), f"T[{k}] = {VALEURS[k]}", font=police(22, True, mono=True),
               fill=melange(PAPIER, TEXTE, kk), anchor="lm")
        verdict = "= X ✓" if VALEURS[k] == x else "≠ X"
        d.text((X_CRAYON + 290, y), verdict, font=police(22, True, mono=True),
               fill=melange(PAPIER, VERT if VALEURS[k] == x else TEXTE_3, kk), anchor="lm")
    if p > 0.74:
        stylo_note(d, X_CRAYON, _regle(6) - 6, message, 22, a_partir_de=0.74, p=p)
    if p > 0.84:
        stylo_note(d, X_CRAYON, _regle(7) - 6, resultat, 26,
                   couleur=VERT if x in VALEURS else ROUGE_STYLO, a_partir_de=0.84, p=p)


def scene_repet_trouve(d, p, t):
    _entete(d, "repet_trouve")
    _panneaux(d, "je cherche X", "le brouillon")
    tour = 0 if p < 0.45 else 1
    _recherche(d, i=tour, trouve=(True if p > 0.72 else None), t=t, x=7)

    papier_brouillon(d, PAPIER_BOX)
    _trace_recherche(d, p, 7, 2, "la condition d'arrêt a joué", "→ trouvé, on sort")

    _ecritures(d, p, ALGO_REP, JS_REP, algo_on=False, js_on=False)
    _etat(d, "repeter", "trouvé en 2 tours", VERT)


def scene_repet_absent(d, p, t):
    _entete(d, "repet_absent")
    _panneaux(d, "je cherche X", "le brouillon")
    tour = min(3, int(p * 4.2))
    _recherche(d, i=tour, trouve=(False if p > 0.82 else None), t=t, x=5)

    papier_brouillon(d, PAPIER_BOX)
    _trace_recherche(d, p, 5, 4, "i vaut 4 : on sort", "→ absent")

    _ecritures(d, p, ALGO_REP, JS_REP, algo_on=False, js_on=False)
    _etat(d, "repeter", "absent : 4 tours", ROUGE_STYLO)


# ══════════════════════════════════════════════════════════════════════════
# 19-23 · TANT QUE : la boîte de jetons (jetons dans la boîte, n dans le sac)
# ══════════════════════════════════════════════════════════════════════════
def _jetons(d, n_boite, n_sac, t=0.0, secousse=0.0):
    boite_jetons(d, 240, 416, n_boite, echelle=1.15, t=t, secousse=secousse)
    d.text((240, 512), f"boîte : {n_boite} jeton{'s' if n_boite > 1 else ''}",
           font=police(18, True), fill=AMBRE, anchor="mm")
    sac(d, 460, 640, contenu=tuple(str(i) for i in range(1, n_sac + 1)) if n_sac else (),
        nom="SAC", echelle=0.62, halo=0.35 if n_sac else 0.0, vide="0")
    d.text((460, 754), f"n = {n_sac} jeton{'s' if n_sac > 1 else ''}",
           font=police(22, True, mono=True), fill=VERT, anchor="mm")


def scene_tantque_quoi(d, p, t):
    _entete(d, "tantque_quoi")
    _panneaux(d, "la boîte de jetons", "le brouillon")
    _jetons(d, 3, 0, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "je vide la boîte dans le sac", 23, melange(ENCRE, TEXTE_3, 0.4), 0.04, p)
    _ligne(d, 2, "combien de tours ?", 24, ENCRE, 0.20, p)
    _ligne(d, 3, "ça dépend de la boîte", 24, TEXTE_2, 0.30, p)
    _ligne(d, 5, "condition d'arrêt ?", 24, ENCRE, 0.48, p)
    _ligne(d, 6, "oui : la boîte vide", 24, VERT, 0.56, p, gras=True)
    _ligne(d, 8, "au moins un tour ?", 24, ENCRE, 0.70, p)
    _ligne(d, 9, "non : elle peut être vide !", 23, ROUGE_STYLO, 0.80, p, gras=True)

    _ecritures(d, p, vide_algo="① l'algorithme : étape 20", vide_js="② le code : étape 21")
    _etat(d, None, "0 tour possible")


def scene_tantque_algo(d, p, t):
    _entete(d, "tantque_algo")
    _panneaux(d, "la boîte de jetons", "le brouillon")
    _jetons(d, 3, 0, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "le test est AVANT le bloc", 24, melange(ENCRE, TEXTE_3, 0.4), 0.04, p)
    _ligne(d, 2, "TANT QUE jetons > 0", 26, VERT, 0.22, p, gras=True)
    _ligne(d, 3, "   prendre un jeton", 23, ENCRE, 0.40, p)
    _ligne(d, 4, "   le mettre dans le sac", 23, ENCRE, 0.50, p)
    _ligne(d, 5, "   n ← n + 1", 23, VERT, 0.58, p)
    _ligne(d, 6, "FIN TANT QUE", 26, VERT, 0.66, p, gras=True)
    _ligne(d, 8, "boîte vide au départ :", 21, melange(ENCRE, TEXTE_3, 0.4), 0.78, p)
    _ligne(d, 9, "→ aucun tour, n = 0", 22, ROUGE_STYLO, 0.86, p, gras=True)

    _ecritures(d, p, ALGO_TQ, None, algo_on=True, seuil_algo=0.12,
               vide_js="② while (…) : étape suivante")
    _etat(d, "tantque", "le test AVANT le bloc", C_TQ)


def scene_tantque_js(d, p, t):
    _entete(d, "tantque_js")
    _panneaux(d, "la boîte de jetons", "le brouillon")
    _jetons(d, 3, 0, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "TANT QUE", 24, VERT, 0.04, p, gras=True)
    _ligne(d, 1, "→  while", 30, VERT, 0.14, p, gras=True)
    _ligne(d, 3, "jetons--  : je sors un jeton", 21, ENCRE, 0.38, p)
    _ligne(d, 4, "n++       : je le compte", 21, ENCRE, 0.48, p)
    _ligne(d, 6, "condition vraie : on répète", 21, ENCRE, 0.66, p)
    _ligne(d, 7, "fausse : on sort", 21, ENCRE, 0.74, p)
    _ligne(d, 9, "sans jetons-- : boucle infinie", 20, ROUGE_STYLO, 0.84, p, gras=True)

    _ecritures(d, p, ALGO_TQ, JS_TQ, algo_on=False, js_on=True, seuil_js=0.14)
    _etat(d, "tantque", "while (jetons > 0)", VERT)


def scene_tantque_trace(d, p, t):
    _entete(d, "tantque_trace")
    _panneaux(d, "la boîte de jetons", "le brouillon")
    reste = max(0, 3 - int(p * 4.0))
    _jetons(d, reste, 3 - reste, t=t, secousse=0.5 if 0.35 < p < 0.45 else 0.0)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "trois jetons :", 24, melange(ENCRE, TEXTE_3, 0.4), 0.04, p)
    _ligne(d, 1, "3 tours, n = 3, jetons = 0", 22, VERT, 0.14, p, gras=True)
    _ligne(d, 3, "zéro jeton au départ :", 24, melange(ENCRE, TEXTE_3, 0.4), 0.44, p)
    _ligne(d, 4, "0 tour, et n = 0", 26, AMBRE, 0.54, p, gras=True)
    _ligne(d, 6, "répéter…jusqu'à aurait pris", 22, ENCRE, 0.70, p)
    _ligne(d, 7, "un jeton qui n'existe pas", 22, ROUGE_STYLO, 0.80, p, gras=True)

    _ecritures(d, p, ALGO_TQ, JS_TQ, algo_on=False, js_on=False)
    _etat(d, "tantque", "3 tours / 0 tour", VERT)


# ══════════════════════════════════════════════════════════════════════════
# 24-26 · Synthèse
# ══════════════════════════════════════════════════════════════════════════
def scene_tableau3(d, p, t):
    _entete(d, "tableau3")
    panneau(d, PANEL_G, "les trois blocs", accent=melange(BORDURE, ORANGE, 0.30))
    _trois_blocs(d, None, 250)

    boite = [670, 186, 1856, 660]
    panneau(d, boite, "le tableau des trois boucles", accent=melange(BORDURE, AMBRE, 0.40))
    tableau_boucles(d, [700, 262, 1826, 626], actif=None, a=1.0)
    d.text((1263, 706), "nombre de tours · condition d'arrêt · le test : avant ou après le bloc",
           font=police(19), fill=TEXTE_2, anchor="mm")
    d.text((1263, 756), "trois boucles, trois situations", font=police(26, True),
           fill=TEXTE, anchor="mm")
    d.text((1263, 800), "et un seul schéma pour choisir", font=police(19), fill=TEXTE_3,
           anchor="mm")
    _etat(d, None, "trois boucles, trois situations")


def scene_choisir(d, p, t):
    _entete(d, "choisir")
    _panneaux(d, "les trois exemples", "le schéma de décision")

    exemples = [
        ("la somme des étages", "4 tours connus, rien ne m'arrête", C_POUR, "POUR", 320),
        ("chercher X", "je sors dès que j'ai trouvé", C_REP, "RÉPÉTER…JUSQU'À", 500),
        ("la boîte de jetons", "elle peut être vide : zéro tour", C_TQ, "TANT QUE", 680),
    ]
    for nom, detail, couleur, boucle, y in exemples:
        boite_arrondie(d, [96, y, 612, y + 148], rayon=16,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.10),
                       bord=melange(BORDURE, couleur, 0.55), largeur_bord=2)
        d.text((118, y + 22), nom, font=police(22, True), fill=TEXTE, anchor="la")
        d.text((118, y + 56), detail, font=police(15), fill=TEXTE_2, anchor="la")
        d.text((118, y + 104), f"→ {boucle}", font=police(20, True), fill=couleur,
               anchor="la")

    schema_arbre(d, SCHEMA_BOX, etape=3, actif=None, a=1.0, t=p * 9)
    d.text((960, 690), "les questions, toujours dans le même ordre",
           font=police(20, True), fill=AMBRE, anchor="mm")
    d.text((960, 728), "1 · le nombre de tours  2 · la condition d'arrêt  3 · au moins un",
           font=police(16), fill=TEXTE_2, anchor="mm")

    panneau(d, PANEL_D, "comment choisir", accent=melange(BORDURE, VERT, 0.40))
    regles = [
        ("je connais le nombre, rien ne m'arrête", "POUR", C_POUR),
        ("je connais le nombre, une condition m'arrête", "RÉPÉTER ou TANT QUE", C_REP),
        ("je ne connais pas le nombre", "boucle conditionnelle", C_TQ),
    ]
    y = 300
    for i, (question, reponse, couleur) in enumerate(regles):
        etape_pastille(d, 1304, y + 18, i + 1, couleur)
        d.text((1334, y + 8), question, font=police(16, True), fill=TEXTE, anchor="la")
        d.text((1334, y + 40), reponse, font=police(18, True), fill=couleur, anchor="la")
        y += 136
    d.text((1566, 780), "au moins un tour ?", font=police(17, True), fill=TEXTE_2,
           anchor="mm")
    d.text((1566, 814), "oui → RÉPÉTER   non → TANT QUE", font=police(15), fill=TEXTE_3,
           anchor="mm")

    _etat(d, None, "poser les questions, dans l'ordre")


def scene_algo_js(d, p, t):
    _entete(d, "algo_js")
    panneau(d, PANEL_G, "les trois boucles", accent=melange(BORDURE, ORANGE, 0.30))
    _trois_blocs(d, None, 250)
    panneau(d, PANEL_M, "les correspondances", accent=melange(BORDURE, AMBRE, 0.40))

    lignes = [
        ("POUR", "for", C_POUR, 280),
        ("RÉPÉTER…JUSQU'À", "do … while", C_REP, 410),
        ("TANT QUE", "while", C_TQ, 540),
    ]
    for i, (algo, js, couleur, y) in enumerate(lignes):
        k = _apparait(p, 0.16 + 0.14 * i, 0.16)
        if k <= 0:
            continue
        boite_arrondie(d, [700, y, 1226, y + 84], rayon=14,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.10 * k),
                       bord=melange(BORDURE, couleur, 0.55 * k), largeur_bord=2)
        d.text((734, y + 42), algo, font=police(19, True), fill=melange(FOND, couleur, k),
               anchor="lm")
        fleche(d, (960, y + 42), (1034, y + 42), couleur=melange(FOND, couleur, k),
               progression=k, pointe=12)
        d.text((1054, y + 42), js, font=police(19, True, mono=True),
               fill=melange(FOND, VERT, k), anchor="lm")
    d.text((960, 668), "on écrit l'algorithme d'abord,", font=police(18), fill=TEXTE_2,
           anchor="mm")
    d.text((960, 704), "on le traduit ensuite", font=police(18), fill=TEXTE_2, anchor="mm")
    d.text((960, 764), "deux cadres, jamais mélangés", font=police(17, True),
           fill=AMBRE, anchor="mm")

    _cadre_ecriture(d, ALGO_BOX, 1, "l'ALGORITHME", C_POUR, True)
    _cadre_ecriture(d, JS_BOX, 2, "le JAVASCRIPT", VERT, True)
    _code(d, ALGO_BOX, ["POUR i DE 0 À 3 FAIRE", "RÉPÉTER … JUSQU'À", "TANT QUE jetons > 0 FAIRE"],
          C_POUR, True, p, seuil=0.10, pas=0.14, taille=17)
    _code(d, JS_BOX, ["for (let i = 0; i < T.length; i++)", "do { … } while (…)",
                      "while (jetons > 0)"],
          VERT, True, p, seuil=0.30, pas=0.14, taille=17)
    _etat(d, None, "deux langages, une logique")


# ══════════════════════════════════════════════════════════════════════════
# 27-29 · Le bilan, la méthode, le générique
# ══════════════════════════════════════════════════════════════════════════
def _colonne_fin(d, x0, x1, nom, couleur, regle, algo, js, p, i, bilan):
    """Une des trois colonnes du bilan : l'algorithme au-dessus, le code dessous."""
    boite_arrondie(d, [x0, 186, x1, 884], rayon=20, fond=FOND_PANNEAU,
                   bord=melange(BORDURE, couleur, 0.55), largeur_bord=2)
    d.text((x0 + 22, 202), nom, font=police(26, True), fill=couleur, anchor="la")
    d.text((x0 + 22, 240), regle, font=police(14), fill=TEXTE_2, anchor="la")
    haut = [x0 + 14, 268, x1 - 14, 486]
    bas = [x0 + 14, 498, x1 - 14, 700]
    _cadre_ecriture(d, haut, 1, "ALGORITHME", couleur, True, a=0.92)
    _cadre_ecriture(d, bas, 2, "JAVASCRIPT", VERT, True, a=0.92)
    _code(d, haut, algo, couleur, True, p, seuil=0.14 + 0.05 * i, pas=0.05, taille=15)
    _code(d, bas, js, VERT, True, p, seuil=0.42 + 0.05 * i, pas=0.05, taille=15)

    k = _apparait(p, 0.72 + 0.05 * i, 0.12)
    if k > 0:
        boite_arrondie(d, [x0 + 14, 714, x1 - 14, 866], rayon=14,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.12 * k),
                       bord=melange(BORDURE, couleur, 0.55 * k), largeur_bord=2)
        d.text(((x0 + x1) / 2, 736), "résultat", font=police(13, True),
               fill=melange(FOND, TEXTE_3, k), anchor="mm")
        n = len(bilan)
        pas = 112 / n
        for j, (haut_txt, bas_txt) in enumerate(bilan):
            centre = 752 + pas * (j + 0.5)
            d.text(((x0 + x1) / 2, centre - 12), haut_txt,
                   font=police(20 if n == 1 else 18, True),
                   fill=melange(FOND, couleur, k), anchor="mm")
            d.text(((x0 + x1) / 2, centre + 16), bas_txt,
                   font=police(14 if n == 1 else 12),
                   fill=melange(FOND, TEXTE_2, k), anchor="mm")


def scene_bilan(d, p, t):
    _entete(d, "bilan")
    _colonne_fin(d, 64, 650, "POUR", C_POUR, "tours connus, pas d'arrêt",
                 ALGO_POUR, JS_POUR, p, 0,
                 [("S = 22", "quatre tours, i vaut 4")])
    _colonne_fin(d, 666, 1252, "RÉPÉTER…JUSQU'À", C_REP, "au moins un tour",
                 ALGO_REP, JS_REP, p, 1,
                 [("trouvé", "X = 7, arrêt au 2ᵉ tour"),
                  ("absent", "X = 5, i vaut 4")])
    _colonne_fin(d, 1268, 1854, "TANT QUE", C_TQ, "zéro tour possible",
                 ALGO_TQ, JS_TQ, p, 2,
                 [("3 tours", "n = 3, boîte vidée"),
                  ("0 tour", "boîte vide : n = 0")])
    _etat(d, None, "trois boucles, trois situations")


def scene_conclusion(d, p, t):
    _entete(d, "conclusion")
    panneau(d, PANEL_G, "la méthode", accent=melange(BORDURE, ORANGE, 0.30))
    panneau(d, PANEL_M, "trois questions, dans cet ordre", accent=melange(BORDURE, AMBRE, 0.40))

    questions = [
        ("1", "le nombre de répétitions ?", "connu → POUR", C_POUR),
        ("2", "une condition d'arrêt ?", "non → POUR · oui → la suite", C_REP),
        ("3", "au moins une fois ?", "oui → RÉPÉTER · non → TANT QUE", C_TQ),
    ]
    y = 260
    for i, (num, question, reponse, couleur) in enumerate(questions):
        k = _apparait(p, 0.10 + 0.16 * i, 0.16)
        if k <= 0:
            y += 150
            continue
        boite_arrondie(d, [96, y, 612, y + 130], rayon=16,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.10 * k),
                       bord=melange(BORDURE, couleur, 0.60 * k), largeur_bord=2)
        etape_pastille(d, 132, y + 34, i + 1, couleur)
        d.text((164, y + 20), "est-ce que je connais", font=police(15), fill=TEXTE_3,
               anchor="la")
        d.text((164, y + 44), question, font=police(21, True), fill=melange(FOND, TEXTE, k),
               anchor="la")
        d.text((118, y + 96), reponse, font=police(16, True), fill=couleur, anchor="la")
        y += 150

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "avec ces trois réponses,", 24, melange(ENCRE, TEXTE_3, 0.45), 0.56, p)
    _ligne(d, 1, "je ne me trompe plus", 26, VERT, 0.64, p, gras=True)
    _ligne(d, 3, "POUR     : connu, pas d'arrêt", 22, C_POUR, 0.72, p)
    _ligne(d, 4, "RÉPÉTER  : connu, une condition", 22, C_REP, 0.78, p)
    _ligne(d, 5, "TANT QUE : inconnu, 0 possible", 22, C_TQ, 0.84, p)
    _ligne(d, 7, "→ à vous de jouer", 26, AMBRE, 0.90, p, gras=True)

    _etat(d, None, "trois questions, une méthode")


def scene_generique(d, p, t):
    """La carte de fin : elle prend le temps de se poser, puis s'éteint."""
    _entete(d, "generique")
    # le carton, au centre
    boite_arrondie(d, [340, 250, 1580, 800], rayon=28, fond=FOND_PANNEAU,
                   bord=melange(BORDURE, AMBRE, 0.55), largeur_bord=3)
    d.text((960, 322), "STI Version 2.0", font=police(34, True), fill=AMBRE, anchor="mm")
    d.text((960, 372), "SÉRIE 6 · JAVASCRIPT", font=police(20, True), fill=TEXTE_3,
           anchor="mm")

    k = _apparait(p, 0.10, 0.10)
    d.text((960, 460), "Les boucles", font=police(58, True),
           fill=melange(FOND_PANNEAU, TEXTE, k), anchor="mm")

    for i, (nom, couleur) in enumerate([("POUR", C_POUR), ("RÉPÉTER…JUSQU'À", C_REP),
                                       ("TANT QUE", C_TQ)]):
        kk = _apparait(p, 0.22 + 0.10 * i, 0.12)
        if kk <= 0:
            continue
        largeur = largeur_texte(nom, 22, True) + 56
        cx = [560, 960, 1400][i]
        boite_arrondie(d, [cx - largeur / 2, 540, cx + largeur / 2, 600], rayon=14,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.20 * kk),
                       bord=melange(BORDURE, couleur, 0.85 * kk), largeur_bord=2)
        d.text((cx, 570), nom, font=police(22, True), fill=melange(FOND, couleur, kk),
               anchor="mm")

    if p > 0.40:
        d.text((960, 664), "un bloc · des tours · une condition", font=police(22),
               fill=TEXTE_2, anchor="mm")
    if p > 0.52:
        d.text((960, 726), "À VOUS DE JOUER", font=police(30, True), fill=ORANGE,
               anchor="mm")

    _etat(d, None, "fin de la capsule")


# ══════════════════════════════════════════════════════════════════════════
#  Le répartiteur
# ══════════════════════════════════════════════════════════════════════════
SCENES = {
    "ouverture": scene_ouverture,
    "introduction": scene_introduction,
    "probleme": scene_probleme,
    "immeuble": scene_immeuble,
    "ascenseur": scene_ascenseur,
    "scalaire": scene_scalaire,
    "repetition": scene_repetition,
    "q1": scene_q1,
    "q2": scene_q2,
    "q3": scene_q3,
    "engendrer": scene_engendrer,
    "pour_algo": scene_pour_algo,
    "pour_js": scene_pour_js,
    "pour_trace": scene_pour_trace,
    "rappel1": scene_rappel1,
    "chercher_quoi": scene_chercher_quoi,
    "chercher_q": scene_chercher_q,
    "repet_algo": scene_repet_algo,
    "repet_js": scene_repet_js,
    "repet_trouve": scene_repet_trouve,
    "repet_absent": scene_repet_absent,
    "rappel2": scene_rappel2,
    "tantque_quoi": scene_tantque_quoi,
    "tantque_algo": scene_tantque_algo,
    "tantque_js": scene_tantque_js,
    "tantque_trace": scene_tantque_trace,
    "rappel3": scene_rappel3,
    "tableau3": scene_tableau3,
    "choisir": scene_choisir,
    "algo_js": scene_algo_js,
    "bilan": scene_bilan,
    "conclusion": scene_conclusion,
    "generique": scene_generique,
}

assert list(SCENES) == N.ORDRE, "une scène par section, dans le même ordre"


def dessiner(d: ImageDraw.ImageDraw, cle: str, p: float, t: float):
    G.fond(d, t)
    SCENES[cle](d, p, t)
