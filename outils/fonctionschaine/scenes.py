"""Les dix scènes de « Les chaînes de caractères ».

L'écran est coupé en deux, du début à la fin :

  * **à gauche** — la fiche, et surtout **la chaîne et ses positions** : le
    ruban de caractères, une case par caractère, avec son numéro au-dessus.
    C'est ce dessin qui explique les crochets, indexOf, substring, trim et
    charCodeAt — la même image revient donc dans six scènes ;
  * **à droite** — le code JavaScript dans sa console noire, puis sa sortie.

Pour les exercices, la coupure change de sens : **l'énoncé à gauche**, la
**correction détaillée à droite**, ligne par ligne.

Le titre de chapitre est lu dans `narration.py` : le repère du menu et l'écran
ne peuvent pas diverger.
"""
from __future__ import annotations

from PIL import ImageDraw

from theme import (
    FOND, FOND_PANNEAU, FOND_PANNEAU_2, BORDURE, TEXTE, TEXTE_2, TEXTE_3,
    ORANGE, AMBRE, VIOLET, VERT, BLEU, ROSE, ROUGE_BORD,
    police, melange, boite_arrondie, fleche,
)
import dessin as G
from dessin import (
    LARGEUR, HAUTEUR, MARGE, GAUCHE, DROITE, BANDE,
    PAPIER, ENCRE, ROUGE_STYLO, CODE_FOND,
    fond, panneau, papier, console, barrer, ruban, marqueur,
)
import narration as N

TOTAL = len(N.ORDRE)
CH = N.CH                      # « Lycée Rafèha » — la chaîne de toute la capsule
INDICES = list(range(len(CH)))

# ── les deux moitiés ───────────────────────────────────────────────────────
G_TITRE = "la chaîne et ses positions"
D_TITRE = "le code"
X = GAUCHE[0] + 22          # marge intérieure du papier
Y0 = GAUCHE[1] + 62         # première ligne du papier
PAS = 34                    # interligne de la fiche
CODE_X = DROITE[0] + 44
CODE_Y = DROITE[1] + 104

# Le ruban : 12 cases de 52 px = 624 px, il tient dans la moitié gauche.
RUBAN_X = GAUCHE[0] + 46
RUBAN_Y = 424
CASE = 52


# ══════════════════════════════════════════════════════════════════════════
#  L'en-tête et les deux panneaux
# ══════════════════════════════════════════════════════════════════════════
def _entete(d, cle):
    d.text((MARGE, 44), "CAPSULE · JAVASCRIPT · LES CHAÎNES DE CARACTÈRES",
           font=police(19, True), fill=ORANGE)
    d.text((MARGE, 74), "Les chaînes de caractères",
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


def _deux(d, gauche=G_TITRE, droite=D_TITRE, accent_g=AMBRE, accent_d=VERT):
    panneau(d, GAUCHE, gauche, accent=melange(BORDURE, accent_g, 0.55))
    panneau(d, DROITE, droite, accent=melange(BORDURE, accent_d, 0.55))


def _bandeau(d, gauche="", droite="", couleur=TEXTE_2):
    boite_arrondie(d, BANDE, rayon=16, fond=FOND_PANNEAU_2,
                   bord=melange(BORDURE, ORANGE, 0.35), largeur_bord=2)
    d.text((BANDE[0] + 26, (BANDE[1] + BANDE[3]) / 2), gauche, font=police(19),
           fill=TEXTE_3, anchor="lm")
    d.text((BANDE[2] - 26, (BANDE[1] + BANDE[3]) / 2), droite,
           font=police(21, True), fill=couleur, anchor="rm")


# ══════════════════════════════════════════════════════════════════════════
#  Les primitives de la fiche (à gauche) et du code (à droite)
# ══════════════════════════════════════════════════════════════════════════
def _apparait(p, seuil, duree=0.10):
    if p <= seuil:
        return 0.0
    return max(0.0, min(1.0, (p - seuil) / max(0.01, duree)))


def _ligne(d, i, texte, taille=24, couleur=ENCRE, seuil=0.0, p=1.0, gras=False, x=None):
    k = _apparait(p, seuil, 0.12)
    if k <= 0:
        return
    d.text((X if x is None else x, Y0 + i * PAS), texte, font=police(taille, gras),
           fill=melange(PAPIER, couleur, k), anchor="la")


def _note(d, i, texte, taille=22, couleur=ROUGE_STYLO, seuil=0.0, p=1.0, x=None):
    """Une ligne écrite au stylo rouge : l'idée à retenir."""
    k = _apparait(p, seuil, 0.12)
    if k <= 0:
        return
    d.text((X if x is None else x, Y0 + i * PAS), texte, font=police(taille, True),
           fill=melange(PAPIER, couleur, k), anchor="la")


def _sous_titre(d, y, texte, couleur=AMBRE, p=1.0, seuil=0.0, x=None):
    k = _apparait(p, seuil, 0.12)
    if k <= 0:
        return
    d.text((RUBAN_X if x is None else x, y), texte, font=police(19, True),
           fill=melange(PAPIER, couleur, k), anchor="la")


def _code(d, lignes, seuil=0.06, pas=0.07, taille=21, numeros=True, y=None):
    """Le code tapé dans la console, ligne à la fois, avec ses numéros."""
    y = CODE_Y if y is None else y
    for i, ligne in enumerate(lignes):
        if ligne is None:
            y += taille + 12
            continue
        k = _apparait(p_global[0], seuil + pas * i, 0.09)
        if k <= 0:
            break
        visible = ligne[: max(1, int(len(ligne) * k + 0.999))]
        if numeros:
            d.text((CODE_X - 6, y), str(i + 1), font=police(taille - 5, True, mono=True),
                   fill=melange(CODE_FOND, TEXTE_3, 0.85 * k), anchor="rm")
        couleur = VERT if ligne.strip().startswith(("//", "/*")) else TEXTE
        d.text((CODE_X + 18, y), visible, font=police(taille, False, mono=True),
               fill=melange(CODE_FOND, couleur, k), anchor="lm")
        y += taille + 12
    return y


p_global = [1.0]   # la progression courante, lue par `_code`


def _sortie(d, lignes, titre="console", y=None, seuil=0.0):
    """Le panneau « sortie de la console » : ce que le programme affiche."""
    y = 712 if y is None else y
    box = [DROITE[0] + 16, y, DROITE[2] - 16, DROITE[3] - 16]
    boite_arrondie(d, box, rayon=14, fond=(8, 14, 22),
                   bord=melange(BORDURE, BLEU, 0.55), largeur_bord=2)
    d.text((box[0] + 18, box[1] + 18), titre, font=police(15, True),
           fill=melange(CODE_FOND, BLEU, 0.9), anchor="la")
    yy = box[1] + 52
    for i, ligne in enumerate(lignes):
        k = _apparait(p_global[0], seuil + 0.05 * i, 0.09)
        if k <= 0:
            break
        d.text((box[0] + 22, yy), ligne, font=police(19, True, mono=True),
               fill=melange(CODE_FOND, TEXTE_2, 0.95 * k), anchor="lm")
        yy += 30
    return box


def _etiquette(d, x, y, texte, couleur, p=1.0, taille=17, seuil=0.0):
    k = _apparait(p, seuil, 0.10)
    if k <= 0:
        return
    largeur = police(taille, True).getlength(texte) + 26
    boite_arrondie(d, [x, y - 15, x + largeur, y + 15], rayon=15,
                   fond=melange(FOND_PANNEAU_2, couleur, 0.20 * k),
                   bord=melange(FOND_PANNEAU_2, couleur, 0.75 * k), largeur_bord=2)
    d.text((x + 13, y), texte, font=police(taille, True),
           fill=melange(FOND_PANNEAU_2, couleur, k), anchor="lm")


def _ruban(d, p, seuil=0.0, actifs=None, y=RUBAN_Y, couleur=AMBRE, indices=True,
           positions=None):
    """Le ruban apparaît case par case : on voit la chaîne se construire."""
    k = _apparait(p, seuil, 0.22)
    if k <= 0:
        return RUBAN_X
    return ruban(d, RUBAN_X, y, CH, indices=indices, case=CASE, actifs=actifs,
                 couleur=couleur, k=k, positions=positions)


def _titre_fiche(d, texte, y=None, p=1.0, seuil=0.0, couleur=BLEU):
    _sous_titre(d, 226 if y is None else y, texte, couleur, p, seuil)


# ══════════════════════════════════════════════════════════════════════════
#  1 · Bienvenue
# ══════════════════════════════════════════════════════════════════════════
def scene_ouverture(d, p, t):
    p_global[0] = p
    _entete(d, "ouverture")
    panneau(d, GAUCHE, "ce qu'on va voir", accent=melange(BORDURE, AMBRE, 0.55))
    panneau(d, DROITE, "le code, et rien que le code",
            accent=melange(BORDURE, VERT, 0.55))

    blocs = [
        ("partie A · les chaînes", "concaténer · mesurer · chercher · découper · remplacer", AMBRE, 0.08),
        ("partie B · les conversions", "isNaN · Number · parseFloat · parseInt · String", BLEU, 0.22),
        ("partie C · l'objet Date", "new Date, et toString", VIOLET, 0.36),
        ("les exercices", "énoncé à gauche, correction à droite", VERT, 0.50),
    ]
    y = 240
    for nom, detail, couleur, seuil in blocs:
        k = _apparait(p, seuil, 0.12)
        if k <= 0:
            y += 106
            continue
        boite_arrondie(d, [96, y, 884, y + 88], rayon=16,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.12 * k),
                       bord=melange(BORDURE, couleur, 0.60 * k), largeur_bord=2)
        d.text((120, y + 18), nom, font=police(25, True),
               fill=melange(FOND, couleur, k), anchor="la")
        d.text((120, y + 54), detail, font=police(16),
               fill=melange(FOND, TEXTE_2, k), anchor="la")
        y += 106

    _sous_titre(d, 676, "la chaîne de toute la capsule : 12 caractères, positions 0 à 11",
                TEXTE_3, p, 0.62)
    _ruban(d, p, 0.66, actifs=set(), couleur=AMBRE, y=730)

    console(d, [DROITE[0] + 16, DROITE[1] + 16, DROITE[2] - 16, DROITE[1] + 296])
    lignes = [
        'let ch = "Lycée Rafèha";',
        "// → la même chaîne, partout",
    ]
    yy = DROITE[1] + 82
    for i, ligne in enumerate(lignes):
        k = _apparait(p, 0.28 + 0.14 * i, 0.10)
        if k <= 0:
            break
        d.text((CODE_X + 10, yy), ligne, font=police(22, True, mono=True),
               fill=melange(CODE_FOND, VERT if i else TEXTE, k), anchor="lm")
        yy += 44

    _etiquette(d, DROITE[0] + 40, DROITE[1] + 196, "les méthodes ne modifient jamais ch",
               AMBRE, p, taille=16, seuil=0.60)

    sommaire = [
        ("A · les chaînes", "12 méthodes, de length à fromCharCode", AMBRE, 0.36),
        ("B · les conversions", "isNaN · Number · parseFloat · parseInt · String", BLEU, 0.44),
        ("C · l'objet Date", "new Date ; toString", VIOLET, 0.52),
    ]
    y = 520
    for nom, detail, couleur, seuil in sommaire:
        k = _apparait(p, seuil, 0.12)
        if k <= 0:
            y += 96
            continue
        boite_arrondie(d, [DROITE[0] + 24, y, DROITE[2] - 24, y + 80], rayon=14,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.12 * k),
                       bord=melange(BORDURE, couleur, 0.55 * k), largeur_bord=2)
        d.text((DROITE[0] + 48, y + 18), nom, font=police(21, True),
               fill=melange(FOND, couleur, k), anchor="la")
        d.text((DROITE[0] + 48, y + 50), detail, font=police(16),
               fill=melange(FOND, TEXTE_2, k), anchor="la")
        y += 96
    _bandeau(d, "les chaînes, les conversions, l'objet Date",
             "on commence par les positions", AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  2 · Les positions
# ══════════════════════════════════════════════════════════════════════════
def scene_positions(d, p, t):
    p_global[0] = p
    _entete(d, "positions")
    _deux(d, "chaque caractère a une position")

    _ligne(d, 0, "La numérotation commence à zéro.", 24, ENCRE, 0.06, p)
    _ligne(d, 1, "L'espace compte comme un caractère :", 24, ENCRE, 0.14, p)
    _ligne(d, 2, "il occupe la position 5.", 24, TEXTE_2, 0.20, p)

    _sous_titre(d, 356, "la chaîne, caractère par caractère", AMBRE, p, 0.24)
    _ruban(d, p, 0.26, actifs=set(), couleur=AMBRE)
    marqueur(d, RUBAN_X, RUBAN_Y + CASE + 6, CASE, 5, VERT, _apparait(p, 0.46))
    d.text((RUBAN_X + 5 * CASE + CASE / 2 - 74, RUBAN_Y + CASE + 16), "l'espace",
           font=police(15, True), fill=melange(PAPIER, VERT, _apparait(p, 0.50)), anchor="la")

    _ligne(d, 9, "ch.length  →  12", 26, AMBRE, 0.58, p, gras=True)
    _ligne(d, 10, "dernier caractère : length − 1 = 11", 24, VERT, 0.66, p, gras=True)
    _ligne(d, 12, "Douze caractères, positions de 0 à 11 :", 22, TEXTE_2, 0.74, p)
    _ligne(d, 13, "c'est la règle de toute la capsule.", 22, TEXTE_2, 0.80, p)

    _code(d, [
        'let ch = "Lycée Rafèha";',
        "ch.length",
        "ch[0]",
        "ch[6]",
        "ch[ch.length - 1]",
    ], seuil=0.14)
    _sortie(d, ["12", "L", "R", "a"], titre="ce que la console affiche", y=640, seuil=0.42)
    _bandeau(d, "12 caractères · positions 0 → 11", "le dernier : length − 1", AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  3 · Concaténer et mesurer
# ══════════════════════════════════════════════════════════════════════════
def scene_concat_longueur(d, p, t):
    p_global[0] = p
    _entete(d, "concat_longueur")
    _deux(d, "coller deux chaînes : +", "concaténation et longueur")

    _ligne(d, 0, "ch1 + ch2  colle deux chaînes bout à bout.", 24, ENCRE, 0.06, p)
    _note(d, 1, "Aucun espace n'est ajouté : je l'écris moi-même.", 22, ROUGE_STYLO, 0.14, p)

    _sous_titre(d, 296, "nom + « » + ville", AMBRE, p, 0.22)
    k = _apparait(p, 0.24, 0.22)
    if k > 0:
        boite_arrondie(d, [RUBAN_X, 320, RUBAN_X + 300, 372], rayon=10,
                       fond=melange(PAPIER, (24, 32, 49), k),
                       bord=melange(PAPIER, (58, 72, 100), k), largeur_bord=2)
        d.text((RUBAN_X + 16, 346), 'nom + " " + ville', font=police(22, False, mono=True),
               fill=melange(PAPIER, TEXTE, k), anchor="lm")
        k2 = _apparait(p, 0.36, 0.14)
        if k2 > 0:
            d.text((RUBAN_X + 330, 346), "→  " + CH, font=police(23, True),
                   fill=melange(PAPIER, VERT, k2), anchor="lm")

    _ligne(d, 6, "length : une propriété, sans parenthèses.", 24, ENCRE, 0.46, p)
    _ligne(d, 7, "ch.length  →  12", 26, AMBRE, 0.54, p, gras=True)
    _ligne(d, 8, "Lycée (5) + espace (1) + Rafèha (6)", 22, TEXTE_2, 0.62, p)
    _ligne(d, 10, "Sans l'espace : « LycéeRafèha » — collé.", 22, ROUGE_STYLO, 0.72, p, gras=True)
    _ligne(d, 12, "length compte les caractères,", 22, TEXTE_2, 0.80, p)
    _ligne(d, 13, "pas les mots.", 22, TEXTE_2, 0.86, p)

    _code(d, [
        'let nom = "Lycée";',
        'let ville = "Rafèha";',
        'let ch = nom + " " + ville;',
        "console.log(ch);",
        'console.log("Bienvenue au " + ch);',
        "console.log(ch.length);",
    ], seuil=0.10)
    _sortie(d, ["Lycée Rafèha", "Bienvenue au Lycée Rafèha", "12"],
            titre="ce que la console affiche", y=700, seuil=0.40)
    _bandeau(d, "+ colle, length mesure", "l'espace, c'est un caractère", AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  4 · Accéder et chercher
# ══════════════════════════════════════════════════════════════════════════
def scene_acces_recherche(d, p, t):
    p_global[0] = p
    _entete(d, "acces_recherche")
    _deux(d, "ch[p] : accéder à un caractère", "indexOf · lastIndexOf")

    _ligne(d, 0, "ch[0] → L        ch[6] → R", 24, ENCRE, 0.06, p)
    _ligne(d, 1, "ch[ch.length - 1] → a", 24, ENCRE, 0.12, p)
    _note(d, 2, "ch[12] → undefined (pas une erreur)", 21, ROUGE_STYLO, 0.18, p)

    _sous_titre(d, 356, "les positions que l'on demande", AMBRE, p, 0.24)
    _ruban(d, p, 0.26, actifs={0, 6, 11}, couleur=AMBRE)
    marqueur(d, RUBAN_X, RUBAN_Y + CASE + 6, CASE, 0, BLEU, _apparait(p, 0.44))
    marqueur(d, RUBAN_X, RUBAN_Y + CASE + 6, CASE, 6, BLEU, _apparait(p, 0.50))
    marqueur(d, RUBAN_X, RUBAN_Y + CASE + 6, CASE, 11, VERT, _apparait(p, 0.56))

    _ligne(d, 9, "indexOf(\"a\") → 7      lastIndexOf(\"a\") → 11", 22, ENCRE, 0.62, p)
    _ligne(d, 10, "indexOf(\"a\", 8) → 11   lastIndexOf(\"a\", 10) → 7", 22, ENCRE, 0.68, p)
    _note(d, 12, "Absent → -1.  -1 n'est pas 0 :", 21, ROUGE_STYLO, 0.76, p)
    _note(d, 13, "0 voudrait dire « trouvé au début ».", 21, ROUGE_STYLO, 0.82, p)
    _ligne(d, 15, "indexOf(\"e\") → 4   indexOf(\"é\") → 3 :", 21, AMBRE, 0.88, p, gras=True)
    _ligne(d, 16, "e, é et E sont trois caractères différents.", 21, TEXTE_2, 0.94, p)

    _code(d, [
        'let ch = "Lycée Rafèha";',
        'console.log(ch[0]);',
        'console.log(ch[12]);',
        'console.log(ch.indexOf("a"));',
        'console.log(ch.indexOf("a", 8));',
        'console.log(ch.lastIndexOf("a"));',
        'console.log(ch.indexOf("z"));',
    ], seuil=0.08, taille=20)
    _sortie(d, ["L", "undefined", "7", "11", "11", "-1"],
            titre="ce que la console affiche", y=630, seuil=0.36)
    _bandeau(d, "positions de 0 à 11 · -1 quand c'est absent",
             "minuscules, majuscules et accents", AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  5 · Découper et remplacer
# ══════════════════════════════════════════════════════════════════════════
def scene_decouper_remplacer(d, p, t):
    p_global[0] = p
    _entete(d, "decouper_remplacer")
    _deux(d, "substring : extraire un morceau", "replace : remplacer")

    _ligne(d, 0, "Début inclus, fin exclue.", 24, ENCRE, 0.06, p)
    _sous_titre(d, 356, "ch.substring(0, 3) → Lyc", AMBRE, p, 0.18)
    _ruban(d, p, 0.20, actifs={0, 1, 2}, couleur=AMBRE)
    d.text((RUBAN_X + 3 * CASE - 10, RUBAN_Y + CASE / 2), "|",
           font=police(30, True), fill=melange(PAPIER, ROUGE_STYLO, _apparait(p, 0.42)), anchor="lm")
    d.text((RUBAN_X + 3 * CASE + 18, RUBAN_Y + CASE / 2 - 26),
           "la position 3 est exclue", font=police(15, True),
           fill=melange(PAPIER, ROUGE_STYLO, _apparait(p, 0.44)), anchor="la")

    _ligne(d, 7, "substring(1, 0)  =  substring(0, 1)", 22, VERT, 0.50, p, gras=True)
    _ligne(d, 8, "arguments inversés → échangés", 21, TEXTE_2, 0.56, p)
    _ligne(d, 9, "indice négatif ou NaN → traité comme 0", 21, TEXTE_2, 0.62, p)
    _ligne(d, 10, "indice > length → traité comme length", 21, TEXTE_2, 0.68, p)

    _note(d, 12, "replace ne remplace que la PREMIÈRE occurrence.", 21, ROUGE_STYLO, 0.76, p)
    _ligne(d, 13, 'replace("a", "A") → Lycée RAfèha', 22, ENCRE, 0.82, p)
    _ligne(d, 14, "ch n'a pas changé : toujours « Lycée Rafèha ».", 21, TEXTE_2, 0.88, p)

    _code(d, [
        'let ch = "Lycée Rafèha";',
        'console.log(ch.substring(0, 3));',
        'console.log(ch.substring(1, 0));',
        'console.log(ch.substring(4));',
        'console.log(ch.replace("Lycée", "École"));',
        'console.log(ch.replace("a", "A"));',
        'console.log(ch);',
    ], seuil=0.08, taille=20)
    _sortie(d, ["Lyc", "L", "e Rafèha", "École Rafèha", "Lycée RAfèha", "Lycée Rafèha"],
            titre="ce que la console affiche", y=630, seuil=0.36)
    _bandeau(d, "substring : [début, fin[", "replace : la première, et une seule", AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  6 · La casse et les espaces
# ══════════════════════════════════════════════════════════════════════════
def scene_casse_trim(d, p, t):
    p_global[0] = p
    _entete(d, "casse_trim")
    _deux(d, "toLowerCase · toUpperCase", "trim : enlever les bords")

    _ligne(d, 0, "toLowerCase()  →  lycée rafèha", 24, ENCRE, 0.06, p)
    _ligne(d, 1, "toUpperCase()  →  LYCÉE RAFÈHA", 24, ENCRE, 0.12, p)

    _sous_titre(d, 356, "la chaîne saisie : 3 espaces devant, 3 derrière", ROSE, p, 0.22)
    saisie = "   " + CH + "   "
    k = _apparait(p, 0.24, 0.24)
    if k > 0:
        ruban(d, GAUCHE[0] + 22, 424, saisie, indices=False, case=30,
              actifs={0, 1, 2, 15, 16, 17}, couleur=ROSE, k=k)
        d.text((GAUCHE[0] + 22, 424 + 30 + 16), "length = 18",
               font=police(20, True), fill=melange(PAPIER, ROSE, k), anchor="la")

    _ligne(d, 9, "trim() enlève les espaces des deux bords.", 23, ENCRE, 0.44, p)
    _ligne(d, 10, "→  Lycée Rafèha        trim().length  →  12", 24, VERT, 0.52, p, gras=True)
    _ligne(d, 11, "Les espaces du milieu sont conservés.", 21, TEXTE_2, 0.60, p)
    _note(d, 13, "Champ vide ? testez trim().length === 0,", 21, ROUGE_STYLO, 0.70, p)
    _note(d, 14, "pas l'égalité avec une chaîne vide.", 21, ROUGE_STYLO, 0.76, p)
    _ligne(d, 16, "Comparer deux saisies sans la casse :", 21, TEXTE_2, 0.84, p)
    _ligne(d, 17, "a.toLowerCase() === b.toLowerCase()", 21, AMBRE, 0.90, p, gras=True)

    _code(d, [
        'let ch = "   Lycée Rafèha   ";',
        "console.log(ch.length);",
        "console.log(ch.trim());",
        "console.log(ch.trim().length);",
        'console.log(ch.toUpperCase());',
        'console.log(ch.trim().toLowerCase());',
    ], seuil=0.08, taille=20)
    _sortie(d, ["18", "Lycée Rafèha", "12", "LYCÉE RAFÈHA", "lycée rafèha"],
            titre="ce que la console affiche", y=660, seuil=0.36)
    _bandeau(d, "trim nettoie les bords, pas le milieu",
             "la casse se compare sans la casse", ROSE)


# ══════════════════════════════════════════════════════════════════════════
#  7 · Les codes des caractères
# ══════════════════════════════════════════════════════════════════════════
def scene_codes(d, p, t):
    p_global[0] = p
    _entete(d, "codes")
    _deux(d, "charCodeAt : le code d'un caractère", "String.fromCharCode")

    _ligne(d, 0, "Un caractère, c'est un nombre : son code.", 24, ENCRE, 0.06, p)
    _sous_titre(d, 356, "sous chaque caractère, son code", VIOLET, p, 0.20)
    codes = [ord(c) for c in CH]
    k = _apparait(p, 0.22, 0.24)
    if k > 0:
        ruban(d, GAUCHE[0] + 22, 424, CH, indices=True, case=30, actifs=set(),
              couleur=VIOLET, k=k, positions=INDICES)
        for i, code in enumerate(codes):
            d.text((GAUCHE[0] + 22 + i * 30 + 15, 424 + 30 + 22), str(code),
                   font=police(14, True, mono=True),
                   fill=melange(PAPIER, TEXTE_2, k), anchor="ma")

    _ligne(d, 8, "charCodeAt(0) → 76 (L)   (6) → 82 (R)", 22, ENCRE, 0.48, p)
    _ligne(d, 9, "(7) → 97 (a)", 22, ENCRE, 0.54, p)
    _ligne(d, 10, "Lettres accentuées > 127 : (3) → 233 (é)", 21, AMBRE, 0.62, p, gras=True)
    _ligne(d, 12, "String.fromCharCode(82, 97, 102) → Raf", 22, VERT, 0.72, p, gras=True)
    _note(d, 14, "fromCharCode s'écrit avec String,", 21, ROUGE_STYLO, 0.82, p)
    _note(d, 15, "jamais avec le nom de la chaîne.", 21, ROUGE_STYLO, 0.88, p)

    _code(d, [
        'let ch = "Lycée Rafèha";',
        "console.log(ch.charCodeAt(0));",
        "console.log(ch.charCodeAt(6));",
        "console.log(ch.charCodeAt(3));",
        "console.log(String.fromCharCode(82, 97, 102));",
    ], seuil=0.10, taille=20)
    _sortie(d, ["76", "82", "233", "Raf"],
            titre="ce que la console affiche", y=630, seuil=0.40)
    _bandeau(d, "majuscules 65–90 · chiffres 48–57", "charCodeAt ↔ fromCharCode", VIOLET)


# ══════════════════════════════════════════════════════════════════════════
#  8 · Les conversions
# ══════════════════════════════════════════════════════════════════════════
def scene_nombres(d, p, t):
    p_global[0] = p
    _entete(d, "nombres")
    _deux(d, "conversions : du texte au nombre", "isNaN · Number · parseFloat · parseInt")

    _ligne(d, 0, "prompt() et les champs renvoient du TEXTE.", 23, ROUGE_STYLO, 0.06, p, gras=True)
    _ligne(d, 1, "Avant de calculer, il faut convertir.", 23, ENCRE, 0.12, p)

    lignes = [
        ("isNaN", "\"25\" → false   ·   \"Lycée\" → true", BLEU, 0.20),
        ("Number", "\"25\" → 25   ·   \"12 élèves\" → NaN", AMBRE, 0.30),
        ("parseFloat", "\"12.5 points\" → 12.5", VERT, 0.40),
        ("parseInt", "\"12.9\" → 12   ·   \"FF\",16 → 255", VIOLET, 0.50),
    ]
    y = 322
    for nom, detail, couleur, seuil in lignes:
        k = _apparait(p, seuil, 0.12)
        if k <= 0:
            y += 74
            continue
        boite_arrondie(d, [GAUCHE[0] + 30, y, GAUCHE[2] - 30, y + 62], rayon=12,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.12 * k),
                       bord=melange(BORDURE, couleur, 0.55 * k), largeur_bord=2)
        d.text((GAUCHE[0] + 50, y + 31), nom, font=police(21, True, mono=True),
               fill=melange(FOND, couleur, k), anchor="lm")
        d.text((GAUCHE[0] + 230, y + 31), detail, font=police(18, False, mono=True),
               fill=melange(FOND, TEXTE_2, k), anchor="lm")
        y += 74

    _note(d, 12, "isNaN(\"\") → false : une chaîne vide vaut 0.", 20, ROUGE_STYLO, 0.66, p)
    _ligne(d, 14, "\"20\" + \"5\" → 205 (concaténation)", 21, ROUGE_STYLO, 0.76, p, gras=True)
    _ligne(d, 15, "Number(\"20\") + Number(\"5\") → 25 (addition)", 21, VERT, 0.84, p, gras=True)

    _code(d, [
        'let saisie = prompt("Votre âge ?");',
        "console.log(isNaN(saisie));",
        "console.log(Number(saisie));",
        'console.log(parseInt("12.9"));',
        'console.log(parseInt("FF", 16));',
        'console.log("20" + "5");',
        'console.log(Number("20") + Number("5"));',
    ], seuil=0.08, taille=20)
    _sortie(d, ["false", "25", "12", "255", "205", "25"],
            titre="ce que la console affiche", y=630, seuil=0.34)
    _bandeau(d, "Number est strict · parseInt lit le début",
             "jamais d'addition sans conversion", AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  9 · String( ) et l'objet Date
# ══════════════════════════════════════════════════════════════════════════
def scene_texte_date(d, p, t):
    p_global[0] = p
    _entete(d, "texte_date")
    _deux(d, "String( ) : tout devient texte", "l'objet Date et toString")

    _ligne(d, 0, "annee = 2026   →   annee.length : undefined", 23, ENCRE, 0.06, p)
    _ligne(d, 1, "String(annee).length  →  4", 24, VERT, 0.14, p, gras=True)
    _ligne(d, 2, "Un nombre n'a pas de length ; une chaîne, si.", 21, TEXTE_2, 0.22, p)
    _ligne(d, 4, "Une fois convertie, la valeur a TOUTES les", 21, ENCRE, 0.32, p)
    _ligne(d, 5, "méthodes des chaînes : length, indexOf, substring.", 21, ENCRE, 0.38, p)

    _ligne(d, 7, "partie C · l'objet Date", 24, VIOLET, 0.48, p, gras=True)
    k = _apparait(p, 0.56, 0.16)
    if k > 0:
        boite_arrondie(d, [X, 516, GAUCHE[2] - 22, 606], rayon=12,
                       fond=melange(FOND_PANNEAU_2, VIOLET, 0.12 * k),
                       bord=melange(BORDURE, VIOLET, 0.55 * k), largeur_bord=2)
        d.text((X + 20, 540), 'new Date("2026-09-15T08:00:00")',
               font=police(19, False, mono=True), fill=melange(FOND, TEXTE, k), anchor="la")
        d.text((X + 20, 572), "la rentrée au Lycée Rafèha",
               font=police(17), fill=melange(FOND, TEXTE_2, k), anchor="la")

    _ligne(d, 11, "toString() → le jour, le mois, l'année,", 21, ENCRE, 0.68, p)
    _ligne(d, 12, "l'heure et le fuseau horaire.", 21, ENCRE, 0.74, p)
    _note(d, 14, "Le format dépend du navigateur : on l'affiche,", 20, ROUGE_STYLO, 0.82, p)
    _note(d, 15, "on ne le fige jamais dans une réponse.", 20, ROUGE_STYLO, 0.88, p)

    _code(d, [
        "let annee = 2026;",
        "console.log(annee.length);",
        "console.log(String(annee).length);",
        "let d = new Date(\"2026-09-15T08:00:00\");",
        "console.log(d.toString());",
        "console.log(d.toString().length);",
    ], seuil=0.08, taille=19)
    _sortie(d, ["undefined", "4",
                "Tue Sep 15 2026 08:00:00 GMT+0100",
                "(heure normale d'Europe centrale)"],
            titre="ce que la console affiche", y=660, seuil=0.36)
    _bandeau(d, "String( ) : du texte, donc des méthodes",
             "toString( ) : la date devient une chaîne", VIOLET)


# ══════════════════════════════════════════════════════════════════════════
#  10 · Exercices et bilan
# ══════════════════════════════════════════════════════════════════════════
def _enonce(d, lignes, seuil=0.06):
    y = GAUCHE[1] + 74
    for titre_, contenu, s in lignes:
        k = _apparait(p_global[0], seuil + s, 0.12)
        if k <= 0:
            continue
        d.text((X, y), titre_, font=police(20, True),
               fill=melange(PAPIER, AMBRE, k), anchor="la")
        d.text((X, y + 30), contenu, font=police(19, False, mono=True),
               fill=melange(PAPIER, ENCRE, k), anchor="la")
        y += 74


def _correction(d, lignes, seuil=0.10):
    y = DROITE[1] + 96
    for i, (code, resultat, couleur) in enumerate(lignes):
        k = _apparait(p_global[0], seuil + 0.06 * i, 0.10)
        if k <= 0:
            continue
        d.text((CODE_X, y), code, font=police(18, False, mono=True),
               fill=melange(CODE_FOND, TEXTE, k), anchor="la")
        d.text((CODE_X, y + 26), "→ " + resultat, font=police(19, True, mono=True),
               fill=melange(CODE_FOND, couleur, k), anchor="la")
        y += 66


def scene_exercices(d, p, t):
    p_global[0] = p
    _entete(d, "exercices")
    panneau(d, GAUCHE, "l'énoncé", accent=melange(BORDURE, AMBRE, 0.55))
    panneau(d, DROITE, "la correction détaillée", accent=melange(BORDURE, VERT, 0.55))
    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])

    _enonce(d, [
        ("exercice 1", "ch.substring(4, 7)  =  ?", 0.06),
        ("exercice 2", "ch.indexOf(\"a\") + ch.lastIndexOf(\"a\")  =  ?", 0.28),
        ("exercice 3", "un prénom tapé avec des espaces :", 0.50),
        ("", "le nettoyer, puis comparer sans la casse", 0.56),
    ])

    _correction(d, [
        ("ch.substring(4, 7)", "e, espace, R  (3 caractères)", VERT),
        ("ch.indexOf(\"a\") + ch.lastIndexOf(\"a\")", "7 + 11 = 18", VERT),
        ("prenom.trim().length", "la longueur du prénom propre", BLEU),
        ("a.toLowerCase() === b.toLowerCase()", "true / false", BLEU),
    ])

    _note(d, 12, "1 · les méthodes ne modifient jamais ch", 20, ROUGE_STYLO, 0.66, p)
    _note(d, 13, "2 · positions 0 → length - 1", 20, ROUGE_STYLO, 0.72, p)
    _note(d, 14, "3 · recherche absente → -1", 20, ROUGE_STYLO, 0.78, p)
    _note(d, 15, "4 · e ≠ é ≠ E", 20, ROUGE_STYLO, 0.84, p)
    _note(d, 16, "5 · prompt() = texte → Number avant de calculer", 19, ROUGE_STYLO, 0.90, p)

    _bandeau(d, "la fiche : chaînes · conversions · dates",
             "à bientôt dans une prochaine capsule", VERT)


# ══════════════════════════════════════════════════════════════════════════
#  Le répartiteur
# ══════════════════════════════════════════════════════════════════════════
SCENES = {
    "ouverture": scene_ouverture,
    "positions": scene_positions,
    "concat_longueur": scene_concat_longueur,
    "acces_recherche": scene_acces_recherche,
    "decouper_remplacer": scene_decouper_remplacer,
    "casse_trim": scene_casse_trim,
    "codes": scene_codes,
    "nombres": scene_nombres,
    "texte_date": scene_texte_date,
    "exercices": scene_exercices,
}

assert list(SCENES) == N.ORDRE, "une scène par section, dans le même ordre"


def dessiner(d: ImageDraw.ImageDraw, cle: str, p: float, t: float):
    p_global[0] = p
    G.fond(d, t)
    SCENES[cle](d, p, t)
