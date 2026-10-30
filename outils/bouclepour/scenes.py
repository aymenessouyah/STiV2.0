"""Les vingt-six scènes de « Les boucles — Pour, Répéter…jusqu'à, Tant que ».

Trois colonnes, toujours les mêmes :

  * à gauche **le décor** — l'immeuble, l'ascenseur, le sac, la boîte de jetons ;
  * au milieu **le raisonnement** — le brouillon, le schéma de décision, le
    tableau des trois boucles ;
  * à droite **deux cadres séparés** — l'**algorithme** en haut, le
    **JavaScript** en bas. On écrit l'algorithme d'abord, on le traduit après.

Le schéma de décision est le fil conducteur : il apparaît à la quatrième
section, se complète aux deux suivantes, puis revient à chaque rappel avec la
branche courante allumée.
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
    LARGEUR, HAUTEUR, MARGE, PANEL_G, PANEL_M, PANEL_D, ALGO_BOX, JS_BOX, BANDE,
    sac, immeuble, personnage, jeton, cahier, cadre_code, boite_memoire,
    pile_lignes, boucle_schema, bandeau_etat, bulle, coche, panneau, entete,
    etape_pastille, papier_brouillon, crayon, crayon_centre,
    stylo_cercle, stylo_souligne, stylo_note, stylo_fleche,
    schema_arbre, tableau_boucles, bandeau_boucles, cases_tableau, boite_jetons,
    Ligne, _ease, _ease_out, _apparait, VALEURS, SOMME_TOTALE, N_ETAGES,
    ENCRE, ROUGE_STYLO, PAPIER, CODE_FOND,
)

TOTAL = 26

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
    "for (let i = 0; i <= 3; i++) {",
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
    "FIN TANT QUE",
]
JS_TQ = [
    "while (jetons > 0) {",
    "    jetons--;",
    "    sac++;",
    "}",
]


# ══════════════════════════════════════════════════════════════════════════
#  Le cadre commun
# ══════════════════════════════════════════════════════════════════════════
def _entete(d, etape, chapitre):
    """L'en-tête de la capsule : la même ligne, la même barre, d'un bout à l'autre."""
    d.text((MARGE, 44), "CAPSULE · JAVASCRIPT · LES BOUCLES", font=police(19, True),
           fill=ORANGE)
    d.text((MARGE, 74), "Les boucles — Pour, Répéter…jusqu'à, Tant que",
           font=police(43, True), fill=TEXTE)
    if chapitre:
        d.text((MARGE, 138), chapitre, font=police(23), fill=TEXTE_2)
    x1 = LARGEUR - MARGE
    d.text((x1, 50), f"ÉTAPE {etape} / {TOTAL}", font=police(22, True), fill=TEXTE_2,
           anchor="ra")
    y = 174
    d.rounded_rectangle([MARGE, y, x1, y + 6], radius=3, fill=(26, 38, 58))
    d.rounded_rectangle([MARGE, y, MARGE + (x1 - MARGE) * etape / TOTAL, y + 6],
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


def _trois_blocs(d, actif=None, y0=250):
    """Les trois blocs, empilés dans la colonne de gauche."""
    blocs = [
        (C_POUR, "pour", "POUR", "de I à F, FAIRE le bloc", "FIN POUR"),
        (C_REP, "repeter", "RÉPÉTER", "le bloc, puis le test", "JUSQU'À condition"),
        (C_TQ, "tantque", "TANT QUE", "le test AVANT le bloc", "FIN TANT QUE"),
    ]
    y = y0
    for couleur, cle, nom, detail, fin in blocs:
        allume = actif == cle
        boite_arrondie(d, [96, y, 612, y + 128], rayon=16,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.18 if allume else 0.05),
                       bord=melange(BORDURE, couleur, 0.85 if allume else 0.25),
                       largeur_bord=3 if allume else 2)
        d.text((118, y + 22), nom, font=police(24, allume),
               fill=TEXTE if allume else TEXTE_3, anchor="la")
        d.text((118, y + 58), detail, font=police(15),
               fill=TEXTE_2 if allume else melange(FOND_PANNEAU_2, TEXTE_3, 0.8), anchor="la")
        d.text((588, y + 100), fin, font=police(15, True, mono=True),
               fill=melange(FOND, couleur if allume else TEXTE_3, 0.9), anchor="ra")
        y += 146


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
#  1 · Bienvenue
# ══════════════════════════════════════════════════════════════════════════
def scene_bienvenue(d, p, t):
    _entete(d, 1, "1 · Bienvenue — l'histoire des boucles")
    _panneaux(d, "le décor", "le programme")
    _immeuble_statique(d, cabine=0.0, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "aujourd'hui :", 24, melange(ENCRE, TEXTE_3, 0.45), 0.06, p)
    _ligne(d, 1, "les boucles", 34, AMBRE, 0.14, p, gras=True)
    for i, (nom, couleur) in enumerate([("POUR", C_POUR), ("RÉPÉTER…JUSQU'À", C_REP),
                                       ("TANT QUE", C_TQ)]):
        k = _apparait(p, 0.30 + 0.14 * i, 0.16)
        if k <= 0:
            continue
        y = _regle(3 + i) - 10
        d.text((X_CRAYON, y), f"{i + 1}.", font=police(24, True, mono=True),
               fill=melange(PAPIER, TEXTE_3, k), anchor="lm")
        d.text((X_CRAYON + 44, y), nom, font=police(28, True),
               fill=melange(PAPIER, couleur, k), anchor="lm")
    _ligne(d, 7, "et surtout : comment choisir", 22, VERT, 0.80, p)

    _ecritures(d, p, vide_algo="① l'algorithme, en français",
               vide_js="② le JavaScript, à côté")
    _etat(d, None, "trois boucles, un seul schéma")


# ══════════════════════════════════════════════════════════════════════════
#  2 · Le décor et le problème
# ══════════════════════════════════════════════════════════════════════════
def scene_probleme(d, p, t):
    _entete(d, 2, "2 · Le décor et le problème")
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
#  3 · Quatre fois le même geste
# ══════════════════════════════════════════════════════════════════════════
def scene_repetition(d, p, t):
    _entete(d, 3, "3 · Quatre fois le même geste")
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
#  4-6 · Le schéma de décision, question par question
# ══════════════════════════════════════════════════════════════════════════
def scene_q1(d, p, t):
    _entete(d, 4, "4 · Question 1 : est-ce que je connais le nombre ?")
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
    _entete(d, 5, "5 · Question 2 : une condition d'arrêt ?")
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
    _entete(d, 6, "6 · Question 3 : au moins une fois ?")
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
#  7-9 · La boucle POUR
# ══════════════════════════════════════════════════════════════════════════
def scene_pour_algo(d, p, t):
    _entete(d, 7, "7 · La boucle POUR — l'algorithme")
    _panneaux(d, "l'immeuble", "le brouillon")
    _immeuble_statique(d, actif=0, cabine=0.0, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "le bloc, écrit une seule fois :", 22, melange(ENCRE, TEXTE_3, 0.4), 0.04, p)
    _ligne(d, 2, "S = S + T[compteur]", 24, melange(ENCRE, TEXTE_3, 0.45), 0.02, 1.0)
    _ligne(d, 4, "d'où je pars ?  →  0", 24, ENCRE, 0.28, p)
    _ligne(d, 5, "où je m'arrête ?  →  3", 24, ENCRE, 0.38, p)
    _ligne(d, 7, "→ POUR compteur DE 0 À 3", 24, AMBRE, 0.58, p, gras=True)
    _ligne(d, 8, "→ et FAIRE le bloc", 22, VERT, 0.74, p)

    _ecritures(d, p, ALGO_POUR, None, algo_on=True, seuil_algo=0.14,
               vide_js="② le JavaScript : après la scène suivante")
    _etat(d, "pour", "compteur : 0 → 3", C_POUR)


def scene_pour_js(d, p, t):
    _entete(d, 8, "8 · La boucle POUR — le JavaScript")
    _panneaux(d, "l'immeuble", "le brouillon")
    _immeuble_statique(d, actif=0, cabine=0.0, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "l'algorithme est écrit ;", 24, ENCRE, 0.04, p)
    _ligne(d, 1, "je le traduis maintenant", 24, VERT, 0.12, p)
    _ligne(d, 3, "POUR  →  for", 26, AMBRE, 0.38, p, gras=True)
    _ligne(d, 4, "compteur  →  i", 24, VERT, 0.54, p)
    _ligne(d, 6, "même logique,", 22, melange(ENCRE, TEXTE_3, 0.4), 0.70, p)
    _ligne(d, 7, "deux langages", 22, melange(ENCRE, TEXTE_3, 0.4), 0.76, p)

    _ecritures(d, p, ALGO_POUR, JS_POUR, algo_on=False, js_on=True, seuil_js=0.16)
    _etat(d, "pour", "traduction en JavaScript", VERT)


def scene_pour_trace(d, p, t):
    _entete(d, 9, "9 · La boucle POUR — les quatre tours")
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
    if p > 0.80:
        stylo_note(d, X_CRAYON, _regle(7) - 6, "i vaut 4 : la condition est fausse",
                   22, a_partir_de=0.80, p=p)

    _ecritures(d, p, ALGO_POUR, JS_POUR, algo_on=False, js_on=False)
    _etat(d, "pour", "S = 22", VERT)


# ══════════════════════════════════════════════════════════════════════════
# 10 · Rappel : le tableau des trois boucles et le schéma
# ══════════════════════════════════════════════════════════════════════════
def _scene_rappel(d, p, etape, chapitre, actif, info):
    _entete(d, etape, chapitre)
    _panneaux(d, "les trois boucles", "le schéma et le tableau")
    _trois_blocs(d, actif, 250)
    schema_arbre(d, SCHEMA_HAUT, etape=3, actif=actif, a=1.0, t=p * 9)
    tableau_boucles(d, TABLEAU_BOX, actif=actif, a=1.0)
    _ecritures(d, p, vide_algo="① l'algorithme est écrit", vide_js="② le code aussi")
    _etat(d, actif, info)


def scene_rappel1(d, p, t):
    _scene_rappel(d, p, 10, "10 · Rappel : où se place POUR", "pour",
                  "tours connus, pas d'arrêt")


def scene_rappel2(d, p, t):
    _scene_rappel(d, p, 17, "17 · Rappel : où se place RÉPÉTER…JUSQU'À", "repeter",
                  "au moins un tour garanti")


def scene_rappel3(d, p, t):
    _scene_rappel(d, p, 22, "22 · Rappel : où se place TANT QUE", "tantque",
                  "zéro tour possible")


# ══════════════════════════════════════════════════════════════════════════
# 11-16 · Chercher X : la boucle RÉPÉTER…JUSQU'À
# ══════════════════════════════════════════════════════════════════════════
def scene_chercher_quoi(d, p, t):
    _entete(d, 11, "11 · Chercher X : un nombre de tours inconnu")
    _panneaux(d, "je cherche X", "le brouillon")
    _recherche(d, i=None, trouve=None, t=t, x=7)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "nouveau problème :", 24, melange(ENCRE, TEXTE_3, 0.4), 0.04, p)
    _ligne(d, 1, "chercher X dans T", 28, ROSE, 0.14, p, gras=True)
    _ligne(d, 3, "si X est au 1er étage → 1 tour", 22, ENCRE, 0.34, p)
    _ligne(d, 4, "s'il est au dernier → 4 tours", 22, ENCRE, 0.46, p)
    _ligne(d, 5, "s'il n'est pas là → 4 tours, rien", 22, ENCRE, 0.58, p)
    _ligne(d, 7, "→ nombre de tours inconnu", 24, AMBRE, 0.72, p, gras=True)

    _ecritures(d, p, vide_algo="① on verra à la section 13", vide_js="② puis à la 14")
    _etat(d, None, "tours inconnus")


def scene_chercher_q(d, p, t):
    _entete(d, 12, "12 · Chercher X : au moins une fois")
    _panneaux(d, "je cherche X", "le schéma de décision")
    _recherche(d, i=0, trouve=None, t=t, x=7)
    schema_arbre(d, [690, 300, 1230, 700], etape=3, actif="repeter", a=1.0, t=p * 9)
    d.text((960, 748), "une condition d'arrêt, et au moins un tour",
           font=police(19), fill=TEXTE_2, anchor="mm")
    d.text((960, 784), "→ RÉPÉTER…JUSQU'À", font=police(24, True), fill=C_REP, anchor="mm")
    _ecritures(d, p, vide_algo="① l'algorithme arrive", vide_js="② le code ensuite")
    _etat(d, "repeter", "RÉPÉTER…JUSQU'À", C_REP)


def scene_repet_algo(d, p, t):
    _entete(d, 13, "13 · RÉPÉTER…JUSQU'À — l'algorithme")
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
               vide_js="② do … while : section suivante")
    _etat(d, "repeter", "le test APRÈS le bloc", C_REP)


def scene_repet_js(d, p, t):
    _entete(d, 14, "14 · RÉPÉTER…JUSQU'À — le JavaScript")
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
    _entete(d, 15, "15 · X = 7 : trouvé au deuxième tour")
    _panneaux(d, "je cherche X", "le brouillon")
    tour = 0 if p < 0.45 else 1
    _recherche(d, i=tour, trouve=(True if p > 0.72 else None), t=t, x=7)

    papier_brouillon(d, PAPIER_BOX)
    _trace_recherche(d, p, 7, 2, "la condition d'arrêt a joué", "→ trouvé, on sort")

    _ecritures(d, p, ALGO_REP, JS_REP, algo_on=False, js_on=False)
    _etat(d, "repeter", "trouvé en 2 tours", VERT)


def scene_repet_absent(d, p, t):
    _entete(d, 16, "16 · X = 5 : absent, quatre tours")
    _panneaux(d, "je cherche X", "le brouillon")
    tour = min(3, int(p * 4.2))
    _recherche(d, i=tour, trouve=(False if p > 0.82 else None), t=t, x=5)

    papier_brouillon(d, PAPIER_BOX)
    _trace_recherche(d, p, 5, 4, "i vaut 4 : on sort", "→ absent")

    _ecritures(d, p, ALGO_REP, JS_REP, algo_on=False, js_on=False)
    _etat(d, "repeter", "absent : 4 tours", ROUGE_STYLO)


# ══════════════════════════════════════════════════════════════════════════
# 18-21 · TANT QUE : la boîte de jetons
# ══════════════════════════════════════════════════════════════════════════
def _jetons(d, n, sac_n, t=0.0, secousse=0.0):
    boite_jetons(d, 240, 416, n, echelle=1.15, t=t, secousse=secousse)
    d.text((240, 512), f"boîte : {n} jeton{'s' if n > 1 else ''}",
           font=police(18, True), fill=AMBRE, anchor="mm")
    sac(d, 460, 640, contenu=tuple(str(i) for i in range(1, sac_n + 1)) if sac_n else (),
        nom="S", echelle=0.62, halo=0.35 if sac_n else 0.0, vide="0")
    d.text((460, 754), f"S = {sac_n}", font=police(22, True, mono=True), fill=VERT, anchor="mm")


def scene_tantque_quoi(d, p, t):
    _entete(d, 18, "18 · TANT QUE : le risque de zéro tour")
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

    _ecritures(d, p, vide_algo="① l'algorithme : section 19", vide_js="② le code : section 20")
    _etat(d, None, "0 tour possible")


def scene_tantque_algo(d, p, t):
    _entete(d, 19, "19 · TANT QUE — l'algorithme")
    _panneaux(d, "la boîte de jetons", "le brouillon")
    _jetons(d, 3, 0, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "le test est AVANT le bloc", 24, melange(ENCRE, TEXTE_3, 0.4), 0.04, p)
    _ligne(d, 2, "TANT QUE jetons > 0", 26, VERT, 0.22, p, gras=True)
    _ligne(d, 3, "   prendre un jeton", 23, ENCRE, 0.40, p)
    _ligne(d, 4, "   le mettre dans le sac", 23, ENCRE, 0.50, p)
    _ligne(d, 5, "FIN TANT QUE", 26, VERT, 0.60, p, gras=True)
    _ligne(d, 7, "boîte vide au départ :", 22, melange(ENCRE, TEXTE_3, 0.4), 0.72, p)
    _ligne(d, 8, "→ aucun tour", 24, ROUGE_STYLO, 0.82, p, gras=True)

    _ecritures(d, p, ALGO_TQ, None, algo_on=True, seuil_algo=0.12,
               vide_js="② while (…) : section suivante")
    _etat(d, "tantque", "le test AVANT le bloc", C_TQ)


def scene_tantque_js(d, p, t):
    _entete(d, 20, "20 · TANT QUE — le JavaScript")
    _panneaux(d, "la boîte de jetons", "le brouillon")
    _jetons(d, 3, 0, t=t)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "TANT QUE", 24, VERT, 0.04, p, gras=True)
    _ligne(d, 1, "→  while", 30, VERT, 0.14, p, gras=True)
    _ligne(d, 3, "condition vraie : on répète", 22, ENCRE, 0.40, p)
    _ligne(d, 4, "condition fausse : on sort", 22, ENCRE, 0.52, p)
    _ligne(d, 6, "et on décrémente jetons,", 22, ENCRE, 0.70, p)
    _ligne(d, 7, "sinon : boucle infinie !", 22, ROUGE_STYLO, 0.80, p, gras=True)

    _ecritures(d, p, ALGO_TQ, JS_TQ, algo_on=False, js_on=True, seuil_js=0.14)
    _etat(d, "tantque", "while (jetons > 0)", VERT)


def scene_tantque_trace(d, p, t):
    _entete(d, 21, "21 · TANT QUE — trois jetons, puis zéro")
    _panneaux(d, "la boîte de jetons", "le brouillon")
    reste = max(0, 3 - int(p * 4.0))
    _jetons(d, reste, 3 - reste, t=t, secousse=0.5 if 0.35 < p < 0.45 else 0.0)

    papier_brouillon(d, PAPIER_BOX)
    _ligne(d, 0, "trois jetons :", 24, melange(ENCRE, TEXTE_3, 0.4), 0.04, p)
    _ligne(d, 1, "3 tours, puis jetons = 0", 24, VERT, 0.14, p, gras=True)
    _ligne(d, 3, "zéro jeton au départ :", 24, melange(ENCRE, TEXTE_3, 0.4), 0.44, p)
    _ligne(d, 4, "0 tour", 28, AMBRE, 0.54, p, gras=True)
    _ligne(d, 6, "répéter…jusqu'à aurait pris", 22, ENCRE, 0.70, p)
    _ligne(d, 7, "un jeton qui n'existe pas", 22, ROUGE_STYLO, 0.80, p, gras=True)

    _ecritures(d, p, ALGO_TQ, JS_TQ, algo_on=False, js_on=False)
    _etat(d, "tantque", "3 tours / 0 tour", VERT)


# ══════════════════════════════════════════════════════════════════════════
# 23-26 · Synthèse
# ══════════════════════════════════════════════════════════════════════════
def scene_tableau3(d, p, t):
    _entete(d, 23, "23 · Le tableau des trois boucles")
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
    _entete(d, 24, "24 · Comment choisir")
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
    _entete(d, 25, "25 · Algorithme et JavaScript : ne pas mélanger")
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
    _code(d, JS_BOX, ["for (let i = 0; i <= 3; i++)", "do { … } while (…)",
                      "while (jetons > 0)"],
          VERT, True, p, seuil=0.30, pas=0.14, taille=17)
    _etat(d, None, "deux langages, une logique")


def _colonne_fin(d, x0, x1, nom, couleur, regle, algo, js, p, i, bilan):
    """Une des trois colonnes de la fin : l'algorithme au-dessus, le code dessous."""
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

    # le bilan, sous les deux cadres : ce que la boucle a donné
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
            d.text(((x0 + x1) / 2, centre - 12), haut_txt, font=police(20 if n == 1 else 18, True),
                   fill=melange(FOND, couleur, k), anchor="mm")
            d.text(((x0 + x1) / 2, centre + 16), bas_txt, font=police(14 if n == 1 else 12),
                   fill=melange(FOND, TEXTE_2, k), anchor="mm")


def scene_fin(d, p, t):
    _entete(d, 26, "26 · Les trois blocs côte à côte")
    _colonne_fin(d, 64, 650, "POUR", C_POUR, "tours connus, pas d'arrêt",
                 ALGO_POUR, JS_POUR, p, 0,
                 [("S = 22", "quatre tours, i vaut 4")])
    _colonne_fin(d, 666, 1252, "RÉPÉTER…JUSQU'À", C_REP, "au moins un tour",
                 ALGO_REP, JS_REP, p, 1,
                 [("trouvé", "X = 7, arrêt au 2ᵉ tour"),
                  ("absent", "X = 5, i vaut 4")])
    _colonne_fin(d, 1268, 1854, "TANT QUE", C_TQ, "zéro tour possible",
                 ALGO_TQ, JS_TQ, p, 2,
                 [("3 tours", "trois jetons dans le sac"),
                  ("0 tour", "boîte vide au départ")])
    _etat(d, None, "à vous de jouer · STI Version 2.0")


# ══════════════════════════════════════════════════════════════════════════
#  Le répartiteur
# ══════════════════════════════════════════════════════════════════════════
SCENES = {
    "bienvenue": scene_bienvenue,
    "probleme": scene_probleme,
    "repetition": scene_repetition,
    "q1": scene_q1,
    "q2": scene_q2,
    "q3": scene_q3,
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
    "fin": scene_fin,
}


def dessiner(d: ImageDraw.ImageDraw, cle: str, p: float, t: float):
    G.fond(d, t)
    SCENES[cle](d, p, t)
