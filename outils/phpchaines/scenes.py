"""Les douze scènes de « Chaînes, transtypage et date/heure » (PHP).

L'écran est coupé en deux, du début à la fin :

  * **à gauche** — la fiche, et surtout **le ruban d'octets** : quatorze cases
    numérotées, une par octet, avec les deux cases de chaque accent encadrées.
    C'est le même dessin qui revient dans six scènes, parce que c'est lui qui
    explique `ord`, `strlen`, `strpos`, `substr` et l'exemple complet ;
  * **à droite** — le code PHP dans sa console noire, puis ce que la page
    affiche.

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
    fond, panneau, papier, console, barrer,
    ruban_octets, legende_ruban, repere, frise_timestamp, table_lettres,
)
import narration as N

TOTAL = len(N.ORDRE)

# ── les deux moitiés ───────────────────────────────────────────────────────
G_TITRE = "la fiche et le ruban d'octets"
D_TITRE = "le code"
X = GAUCHE[0] + 22          # marge intérieure du papier
Y0 = GAUCHE[1] + 62         # première ligne du papier
PAS = 34                    # interligne de la fiche
CODE_X = DROITE[0] + 44
CODE_Y = DROITE[1] + 104

# Le ruban : quatorze cases de 52 px.
RUB_X = GAUCHE[0] + 30
CASE = 52


# ══════════════════════════════════════════════════════════════════════════
#  L'en-tête et les deux panneaux
# ══════════════════════════════════════════════════════════════════════════
def _entete(d, cle):
    d.text((MARGE, 44), "CAPSULE · PHP · CHAÎNES DE CARACTÈRES",
           font=police(19, True), fill=ORANGE)
    d.text((MARGE, 74), "Chaînes, transtypage et date/heure",
           font=police(41, True), fill=TEXTE)
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
    d.text((RUB_X if x is None else x, y), texte, font=police(19, True),
           fill=melange(PAPIER, couleur, k), anchor="la")


def _code(d, lignes, seuil=0.06, pas=0.07, taille=20, numeros=True, y=None):
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
        couleur = VERT if ligne.strip().startswith(("//", "/*", "#")) else TEXTE
        d.text((CODE_X + 18, y), visible, font=police(taille, False, mono=True),
               fill=melange(CODE_FOND, couleur, k), anchor="lm")
        y += taille + 12
    return y


p_global = [1.0]   # la progression courante, lue par `_code`


def _sortie(d, lignes, titre="ce que la page affiche", y=None, seuil=0.0, pas=30):
    """Le panneau de sortie : ce que le programme affiche à l'écran."""
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
        yy += pas
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


def _ruban(d, p, seuil=0.0, y=470, actif=(), couleur=AMBRE, accent=True, curseur=None):
    k = _apparait(p, seuil, 0.26)
    if k <= 0:
        return None
    return ruban_octets(d, RUB_X, y, case=CASE, actif=actif, couleur=couleur,
                        k=k, accents=accent, curseur=curseur)


def _carte(d, x, y, largeur, hauteur, titre, detail, couleur, p=1.0, seuil=0.0,
           taille_titre=21, mono=True):
    """Une carte de la fiche : un titre, une ligne de code ou de résultat."""
    k = _apparait(p, seuil, 0.12)
    if k <= 0:
        return
    boite_arrondie(d, [x, y, x + largeur, y + hauteur], rayon=14,
                   fond=melange(FOND_PANNEAU_2, couleur, 0.12 * k),
                   bord=melange(BORDURE, couleur, 0.60 * k), largeur_bord=2)
    d.text((x + 20, y + 14), titre, font=police(taille_titre, True, mono=mono),
           fill=melange(FOND, couleur, k), anchor="la")
    d.text((x + 20, y + 14 + 30), detail, font=police(17, False, mono=False),
           fill=melange(FOND, TEXTE_2, k), anchor="la")


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
        ("partie A · les chaînes", "ord  chr  strlen  strpos  substr  trim", BLEU, 0.06),
        ("partie B · le transtypage", "(int)  (float)  (string)  (bool)  (array)", AMBRE, 0.18),
        ("partie C · la date et l'heure", "date  time  checkdate  strtotime", VERT, 0.30),
    ]
    y = 238
    for nom, detail, couleur, seuil in blocs:
        k = _apparait(p, seuil, 0.12)
        if k <= 0:
            y += 104
            continue
        boite_arrondie(d, [96, y, 884, y + 86], rayon=16,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.12 * k),
                       bord=melange(BORDURE, couleur, 0.60 * k), largeur_bord=2)
        d.text((120, y + 18), nom, font=police(24, True),
               fill=melange(FOND, couleur, k), anchor="la")
        d.text((120, y + 54), detail, font=police(16, False, mono=True),
               fill=melange(FOND, TEXTE_2, k), anchor="la")
        y += 104

    _sous_titre(d, 560, "une seule chaîne pour toute la capsule", TEXTE_3, p, 0.42)
    _ligne(d, 10, N.CH, 25, ENCRE, 0.46, p)
    _ruban(d, p, 0.50, y=636, actif=(), accent=True)
    legende_ruban(d, RUB_X, 776, "12 caractères · 14 octets · positions de 0 à 13",
                  couleur=AMBRE, k=_apparait(p, 0.62))

    console(d, [DROITE[0] + 16, DROITE[1] + 16, DROITE[2] - 16, DROITE[1] + 250])
    lignes = [
        '$ch = "Lycée Rafèha";',
        "// la chaîne de toute la capsule",
        "echo strlen($ch);   // 14, pas 12",
    ]
    yy = DROITE[1] + 82
    for i, ligne in enumerate(lignes):
        k = _apparait(p, 0.24 + 0.12 * i, 0.10)
        if k <= 0:
            break
        d.text((CODE_X + 10, yy), ligne, font=police(20, True, mono=True),
               fill=melange(CODE_FOND, TEXTE if not ligne.startswith("//") else VERT, k),
               anchor="la")
        yy += 44
    _etiquette(d, DROITE[0] + 40, DROITE[1] + 300, "PHP 8 · UTF-8", ORANGE, p, 17, 0.52)
    _etiquette(d, DROITE[0] + 240, DROITE[1] + 300, "4ᵉ SI", BLEU, p, 17, 0.58)

    _bandeau(d, "partie A · B · C — la fiche de la capsule", "à vous de jouer", ORANGE)


# ══════════════════════════════════════════════════════════════════════════
#  2 · Les octets et les codes ASCII
# ══════════════════════════════════════════════════════════════════════════
def scene_octets(d, p, t):
    p_global[0] = p
    _entete(d, "octets")
    _deux(d, "les octets de la chaîne", "ord() et chr()")

    _ligne(d, 0, "12 caractères, mais 14 octets", 25, AMBRE, 0.06, p, gras=True)
    _ligne(d, 1, "é et è pèsent 2 octets chacun en UTF-8", 20, TEXTE_2, 0.14, p)
    _ruban(d, p, 0.20, y=436, actif=(0, 3, 7), couleur=AMBRE)
    legende_ruban(d, RUB_X, 548, "positions des OCTETS, à partir de 0", couleur=AMBRE,
                  k=_apparait(p, 0.34))
    repere(d, RUB_X + 3 * CASE, 578, "é = 2 octets", VIOLET, _apparait(p, 0.40),
           largeur=2 * CASE - 6)
    repere(d, RUB_X + 10 * CASE, 578, "è = 2 octets", VIOLET, _apparait(p, 0.46),
           largeur=2 * CASE - 6)
    _note(d, 13, "Le R est à la position 7, pas à 6.", 21, ROUGE_STYLO, 0.56, p)
    _note(d, 14, "Le é a pris deux cases.", 21, ROUGE_STYLO, 0.62, p)

    _code(d, [
        'echo ord("L");        // 76',
        'echo ord("R");        // 82',
        'echo ord($ch);        // 76  (le 1er)',
        'echo ord("é");        // 195 (1er octet)',
        "",
        'echo chr(76);         // L',
        'echo chr(82).chr(97).chr(102);   // Raf',
        'echo chr(ord("a") - 32);         // A',
    ], seuil=0.08, taille=19)
    _sortie(d, ["76  82  76  195", "", "L", "Raf", "A"], y=680, seuil=0.40, pas=28)
    _bandeau(d, "ord : le code du PREMIER caractère", "chr : l'inverse — 0 à 127", VERT)


# ══════════════════════════════════════════════════════════════════════════
#  3 · La longueur
# ══════════════════════════════════════════════════════════════════════════
def scene_longueur(d, p, t):
    p_global[0] = p
    _entete(d, "longueur")
    _deux(d, "strlen compte les octets", "strlen()")

    _ligne(d, 0, "strlen($ch)  →  14", 27, AMBRE, 0.06, p, gras=True)
    _ligne(d, 2, "12 caractères, 14 octets", 22, TEXTE_2, 0.16, p)
    _ruban(d, p, 0.22, y=380, actif=(), couleur=BLEU)
    legende_ruban(d, RUB_X, 518, "strlen compte les cases, pas les lettres",
                  couleur=BLEU, k=_apparait(p, 0.34))

    _carte(d, 96, 574, 372, 78, "JavaScript", "length → 12", VIOLET, p, 0.44)
    _carte(d, 490, 574, 372, 78, "PHP", "strlen() → 14", AMBRE, p, 0.52)
    _note(d, 12, "Deux langages, deux unités : 12 et 14.", 20, ROUGE_STYLO, 0.60, p)
    _note(d, 13, "Ne jamais mesurer un texte affiché avec strlen.", 20, ROUGE_STYLO, 0.68, p)

    _code(d, [
        'echo strlen($ch);      // 14',
        'echo strlen("Lycée");  // 6  (5 lettres)',
        'echo strlen("Rafeha"); // 6',
        'echo strlen("   Lycée Rafèha   "); // 20',
        'echo strlen(trim("   Lycée Rafèha   ")); // 14',
    ], seuil=0.08, taille=19)
    _sortie(d, ["14", "6", "6", "20", "14"], y=700, seuil=0.42)
    _bandeau(d, "strlen : espaces compris", "UTF-8 : é et è = 2 octets", BLEU)


# ══════════════════════════════════════════════════════════════════════════
#  4 · La recherche
# ══════════════════════════════════════════════════════════════════════════
def scene_recherche(d, p, t):
    p_global[0] = p
    _entete(d, "recherche")
    _deux(d, "strpos : la position d'une sous-chaîne", "strpos() et la règle de === false")

    _ligne(d, 0, "strpos($ch, \"R\")   →  7", 24, AMBRE, 0.06, p, gras=True)
    _ligne(d, 1, "strpos($ch, \"a\")   →  8   (le premier a)", 20, TEXTE_2, 0.12, p)
    _ligne(d, 2, "strpos($ch, \"L\")   →  0   (tout au début)", 20, TEXTE_2, 0.18, p)
    _ruban(d, p, 0.24, y=372, actif=(0, 7, 8), couleur=BLEU)
    legende_ruban(d, RUB_X, 510, "la lettre cherchée → sa position, en octets",
                  couleur=BLEU, k=_apparait(p, 0.36))

    k = _apparait(p, 0.46, 0.14)
    if k > 0:
        boite_arrondie(d, [X, 556, GAUCHE[2] - 28, 700], rayon=14,
                       fond=melange(FOND_PANNEAU_2, ROUGE_BORD, 0.16 * k),
                       bord=melange(BORDURE, ROUGE_BORD, 0.65 * k), largeur_bord=2)
        d.text((X + 20, 574), "absent → false, PAS −1", font=police(22, True),
               fill=melange(FOND, ROUGE_STYLO, k), anchor="la")
        d.text((X + 20, 610), "if (strpos($ch, \"z\") === false)  →  vrai",
               font=police(17, False, mono=True), fill=melange(FOND, TEXTE, k),
               anchor="la")
        d.text((X + 20, 644), "avec == , la position 0 est fausse aussi : piège !",
               font=police(16), fill=melange(FOND, TEXTE_2, k), anchor="la")
    _note(d, 14, "Toujours trois signes égal.", 21, ROUGE_STYLO, 0.62, p)

    _code(d, [
        'echo strpos($ch, "R");    // 7',
        'echo strpos($ch, "a");    // 8',
        'echo strpos($ch, "Raf");  // 7',
        'echo strpos($ch, "L");    // 0',
        'if (strpos($ch, "z") === false) {',
        '    echo "z est absent";   // z est absent',
        '}',
    ], seuil=0.08, taille=19)
    _sortie(d, ["7", "8", "7", "0", "z est absent"], y=690, seuil=0.42)
    _bandeau(d, "position en octets, à partir de 0", "absence : === false", ROSE)


# ══════════════════════════════════════════════════════════════════════════
#  5 · L'extraction
# ══════════════════════════════════════════════════════════════════════════
def scene_extraction(d, p, t):
    p_global[0] = p
    _entete(d, "extraction")
    _deux(d, "substr : début, puis LONGUEUR", "substr()")

    _ligne(d, 0, "substr($ch, 0, 6)   →  \"Lycée\"", 22, VERT, 0.06, p, gras=True)
    _ligne(d, 1, "substr($ch, 7)      →  \"Rafèha\"", 22, AMBRE, 0.12, p, gras=True)
    _ligne(d, 2, "substr($ch, 7, 3)   →  \"Raf\"", 22, BLEU, 0.18, p, gras=True)
    _ruban(d, p, 0.24, y=380, actif=(0, 1, 2, 3, 4, 5), couleur=VERT)
    repere(d, RUB_X + 3, 520, "Lycée = 6 octets (0 → 5)", VERT,
           _apparait(p, 0.36), largeur=6 * CASE - 8)
    repere(d, RUB_X + 7 * CASE, 566, "Rafèha : de 7 à la fin", AMBRE,
           _apparait(p, 0.44), largeur=7 * CASE - 8)

    k = _apparait(p, 0.54, 0.14)
    if k > 0:
        boite_arrondie(d, [X, 610, GAUCHE[2] - 28, 726], rayon=14,
                       fond=melange(FOND_PANNEAU_2, ROUGE_BORD, 0.16 * k),
                       bord=melange(BORDURE, ROUGE_BORD, 0.65 * k), largeur_bord=2)
        d.text((X + 20, 626), "substr($ch, 0, 4)  →  Lyc + illisible", font=police(18, True),
               fill=melange(FOND, ROUGE_STYLO, k), anchor="la")
        d.text((X + 20, 664), "couper au milieu d'un accent casse le caractère",
               font=police(16), fill=melange(FOND, TEXTE_2, k), anchor="la")
    _note(d, 15, "3ᵉ argument = longueur, pas position de fin.", 20, ROUGE_STYLO, 0.66, p)

    _code(d, [
        'echo substr($ch, 0, 6);  // Lycée',
        'echo substr($ch, 7);     // Rafèha',
        'echo substr($ch, 7, 3);  // Raf',
        'echo substr($ch, 0, 3);  // Lyc',
        'echo substr($ch, 0, 4);  // Lyc + octet cassé',
    ], seuil=0.08, taille=19)
    _sortie(d, ["Lycée", "Rafèha", "Raf", "Lyc", "Lyc?"], y=690, seuil=0.44)
    _bandeau(d, "début inclus, longueur en octets", "≠ substring de JavaScript", AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  6 · Remplacer, la casse, les espaces
# ══════════════════════════════════════════════════════════════════════════
def scene_remplacer(d, p, t):
    p_global[0] = p
    _entete(d, "remplacer")
    _deux(d, "remplacer · la casse · les espaces", "str_replace, strtolower, trim")

    _ligne(d, 0, "str_replace(\"a\", \"A\", $ch)", 21, AMBRE, 0.06, p, gras=True)
    _ligne(d, 1, "→  Lycée RAfèhA   (les DEUX a)", 21, AMBRE, 0.11, p)
    _ligne(d, 2, "strtoupper($ch)  →  LYCéE RAFèHA", 20, VIOLET, 0.17, p)
    _note(d, 3, "é et è restent en minuscules.", 19, ROUGE_STYLO, 0.23, p)

    _carte(d, 96, 400, 356, 76, "strtolower", "lycée rafèha", BLEU, p, 0.30, 19)
    _carte(d, 470, 400, 356, 76, "strtoupper", "LYCéE RAFèHA", VIOLET, p, 0.36, 19)
    _carte(d, 96, 490, 356, 76, "str_replace", "toutes les occurrences", VERT, p, 0.42, 19)
    _carte(d, 470, 490, 356, 76, "str_replace(\"z\", …)", "la chaîne ne change pas", TEXTE_3, p, 0.48, 19)

    k = _apparait(p, 0.56, 0.14)
    if k > 0:
        boite_arrondie(d, [X, 588, GAUCHE[2] - 28, 714], rayon=14,
                       fond=melange(FOND_PANNEAU_2, AMBRE, 0.12 * k),
                       bord=melange(BORDURE, AMBRE, 0.6 * k), largeur_bord=2)
        d.text((X + 20, 604), "trim : les espaces des BORDS", font=police(21, True),
               fill=melange(FOND, AMBRE, k), anchor="la")
        d.text((X + 20, 638), '"   Lycée Rafèha   "  →  strlen 20', font=police(17, False, mono=True),
               fill=melange(FOND, TEXTE, k), anchor="la")
        d.text((X + 20, 672), "après trim()  →  strlen 14", font=police(17, False, mono=True),
               fill=melange(FOND, VERT, k), anchor="la")
    _note(d, 14, "La chaîne d'origine n'est jamais modifiée.", 20, ROUGE_STYLO, 0.68, p)

    _code(d, [
        'echo str_replace("Lycée", "École", $ch);',
        'echo str_replace("a", "A", $ch);',
        'echo $ch;              // inchangée',
        'echo strtolower($ch);  // lycée rafèha',
        'echo strtoupper($ch);  // LYCéE RAFèHA',
        'echo strlen(trim("   Lycée Rafèha   ")); // 14',
    ], seuil=0.08, taille=19)
    _sortie(d, ["École Rafèha", "Lycée RAfèhA", "Lycée Rafèha",
                "lycée rafèha", "LYCéE RAFèHA", "14"], y=640, seuil=0.42, pas=30)
    _bandeau(d, "chaîne en DERNIER argument", "toutes les occurrences", VERT)


# ══════════════════════════════════════════════════════════════════════════
#  7 · L'exemple complet de la partie A
# ══════════════════════════════════════════════════════════════════════════
def scene_separer(d, p, t):
    p_global[0] = p
    _entete(d, "separer")
    _deux(d, "séparer le type et le nom", "strpos + substr + le point")

    _ligne(d, 0, "1 · la position du R", 21, BLEU, 0.06, p, gras=True)
    _ligne(d, 1, "$pos = strpos($ch, \"R\")   →  7", 19, TEXTE_2, 0.10, p)
    _ligne(d, 2, "2 · le nom : à partir de 7", 21, AMBRE, 0.18, p, gras=True)
    _ligne(d, 3, "$nom = substr($ch, $pos)   →  Rafèha", 19, TEXTE_2, 0.22, p)
    _ligne(d, 4, "3 · le type : 0 jusqu'à $pos − 1", 21, VERT, 0.30, p, gras=True)
    _ligne(d, 5, "$type = substr($ch, 0, $pos - 1)   →  Lycée", 19, TEXTE_2, 0.34, p)

    _ruban(d, p, 0.42, y=482, actif=(0, 1, 2, 3, 4, 5, 6), couleur=VERT)
    repere(d, RUB_X + 3, 622, "type : 0 → 5, l'espace exclu", VERT,
           _apparait(p, 0.52), largeur=6 * CASE - 8)
    repere(d, RUB_X + 7 * CASE, 622, "nom : de 7 à la fin", AMBRE,
           _apparait(p, 0.58), largeur=7 * CASE - 8)

    _note(d, 16, "$type . \" / \" . $nom  →  Lycée / Rafèha", 20, ROUGE_STYLO, 0.66, p)
    _note(d, 17, "En PHP, la concaténation est un POINT.", 20, ROUGE_STYLO, 0.72, p)

    _code(d, [
        '$pos  = strpos($ch, "R");        // 7',
        '$nom  = substr($ch, $pos);       // Rafèha',
        '$type = substr($ch, 0, $pos - 1); // Lycée',
        'echo $type . " / " . $nom;',
    ], seuil=0.08, taille=19)
    _sortie(d, ["Lycée / Rafèha"], y=700, seuil=0.44)
    _bandeau(d, "strpos → substr → concaténation", "Lycée / Rafèha", VERT)


# ══════════════════════════════════════════════════════════════════════════
#  8 · Le transtypage des nombres
# ══════════════════════════════════════════════════════════════════════════
def scene_transtypage_nombres(d, p, t):
    p_global[0] = p
    _entete(d, "transtypage_nombres")
    _deux(d, "le type entre parenthèses, devant la valeur", "(int) et (float)")

    _ligne(d, 0, "(int)\"25\"       →  25", 22, AMBRE, 0.06, p, gras=True)
    _ligne(d, 1, "(int)12.9      →  12   (sans arrondi)", 20, TEXTE_2, 0.12, p)
    _ligne(d, 2, "(int)\"25 élèves\" →  25   (lit le début)", 20, TEXTE_2, 0.18, p)
    _ligne(d, 3, "(int)\"Lycée\"    →  0    (pas de NaN)", 20, ROUGE_STYLO, 0.24, p)
    _ligne(d, 4, "(float)\"12.5\"   →  12.5", 20, BLEU, 0.32, p)
    _note(d, 5, "(float)\"12,5\"  →  12 : la virgule est ignorée.", 19, ROUGE_STYLO, 0.38, p)

    _carte(d, 96, 512, 372, 86, "(int)", "entier, décimales coupées", AMBRE, p, 0.46, 22)
    _carte(d, 490, 512, 336, 86, "(float)", "réel, point décimal", BLEU, p, 0.54, 22)

    k = _apparait(p, 0.62, 0.14)
    if k > 0:
        boite_arrondie(d, [X, 620, GAUCHE[2] - 28, 752], rayon=14,
                       fond=melange(FOND_PANNEAU_2, ROUGE_BORD, 0.16 * k),
                       bord=melange(BORDURE, ROUGE_BORD, 0.65 * k), largeur_bord=2)
        d.text((X + 20, 638), "$_GET et $_POST donnent des CHAÎNES", font=police(19, True),
               fill=melange(FOND, ROUGE_STYLO, k), anchor="la")
        d.text((X + 20, 684), "→ on convertit avant de calculer", font=police(16),
               fill=melange(FOND, TEXTE_2, k), anchor="la")
        d.text((X + 20, 716), "arrondir : round() — pas (int)", font=police(16),
               fill=melange(FOND, TEXTE_2, k), anchor="la")
    _note(d, 16, "La variable d'origine ne change pas.", 20, ROUGE_STYLO, 0.74, p)

    _code(d, [
        'echo (int)"25";          // 25',
        'echo (int)12.9;          // 12',
        'echo (int)"25 élèves";   // 25',
        'echo (int)"Lycée Rafèha"; // 0',
        'echo (float)"12.5";      // 12.5',
        'echo (float)"12,5";      // 12',
        'echo (int)true;          // 1',
    ], seuil=0.08, taille=19)
    _sortie(d, ["25", "12", "25", "0", "12.5", "12", "1"], y=636, seuil=0.42, pas=27)
    _bandeau(d, "pas de NaN : une chaîne non numérique → 0", "le point, jamais la virgule", AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  9 · Le transtypage des autres types
# ══════════════════════════════════════════════════════════════════════════
def scene_transtypage_autres(d, p, t):
    p_global[0] = p
    _entete(d, "transtypage_autres")
    _deux(d, "(string) · (bool) · (array)", "et les valeurs FAUSSES")

    _ligne(d, 0, "(string)2026      →  \"2026\"", 21, BLEU, 0.06, p, gras=True)
    _ligne(d, 1, "(string)false     →  \"\"   (rien)", 20, TEXTE_2, 0.11, p)
    _ligne(d, 2, "(bool)\"Lycée\"     →  true", 21, VERT, 0.18, p, gras=True)
    _ligne(d, 3, "(bool)\"false\"     →  true  (non vide !)", 20, ROUGE_STYLO, 0.24, p)

    k = _apparait(p, 0.30, 0.14)
    if k > 0:
        boite_arrondie(d, [X, 376, GAUCHE[2] - 28, 520], rayon=14,
                       fond=melange(FOND_PANNEAU_2, ROUGE_BORD, 0.16 * k),
                       bord=melange(BORDURE, ROUGE_BORD, 0.65 * k), largeur_bord=2)
        d.text((X + 20, 392), "FAUX en booléen", font=police(20, True),
               fill=melange(FOND, ROUGE_STYLO, k), anchor="la")
        faux = ["0", "0.0", '""  (chaîne vide)', '"0"', "[]  (tableau vide)", "null"]
        for i, f in enumerate(faux):
            col, ligne = divmod(i, 3)
            d.text((X + 24 + col * 258, 430 + ligne * 34), f,
                   font=police(17, True, mono=True), fill=melange(FOND, TEXTE, k),
                   anchor="la")

    _carte(d, 96, 546, 372, 76, "(array)\"Lycée Rafèha\"", "count → 1 · [0] → la chaîne",
           VIOLET, p, 0.50, 19)
    _carte(d, 490, 546, 336, 76, "(array)null", "count → 0", TEXTE_3, p, 0.58, 19)
    _note(d, 16, "\"0\" est faux en PHP, vrai en JavaScript.", 19, ROUGE_STYLO, 0.66, p)
    _note(d, 17, "echo affiche true → 1, false → rien.", 19, ROUGE_STYLO, 0.72, p)

    _code(d, [
        'echo (string)2026;     // 2026',
        'echo strlen((string)2026); // 4',
        'echo (string)false;    // (rien)',
        'echo (bool)"false";    // 1',
        'echo (bool)"0";        // (rien)',
        '$t = (array)"Lycée Rafèha";',
        'echo count($t);        // 1',
        'echo $t[0];            // Lycée Rafèha',
    ], seuil=0.08, taille=19)
    _sortie(d, ["2026", "4", "", "1", "", "1", "Lycée Rafèha"], y=636, seuil=0.42, pas=27)
    _bandeau(d, "faux : 0 · 0.0 · \"\" · \"0\" · [] · null", "tout le reste est vrai", VERT)


# ══════════════════════════════════════════════════════════════════════════
#  10 · Le timestamp et date()
# ══════════════════════════════════════════════════════════════════════════
def scene_dates(d, p, t):
    p_global[0] = p
    _entete(d, "dates")
    _deux(d, "un timestamp, c'est une distance", "date() et ses lettres")

    _ligne(d, 0, "date(\"d/m/Y\", $ts)  →  15/09/2026", 22, AMBRE, 0.06, p, gras=True)
    frise_timestamp(d, X + 6, 350, largeur=700, k=_apparait(p, 0.14, 0.26))
    table_lettres(d, X + 4, 420, k=_apparait(p, 0.26, 0.24),
                  actif=("d", "m", "Y"), couleur=VIOLET, pas=27)

    _note(d, 15, "Les noms sont en anglais : Tuesday, September.", 19, ROUGE_STYLO, 0.64, p)
    _note(d, 16, "time() : un grand nombre, qui change chaque seconde.", 19, ROUGE_STYLO, 0.72, p)

    _code(d, [
        '$ts = strtotime("2026-09-15 08:00:00");',
        'echo date("d/m/Y", $ts);  // 15/09/2026',
        'echo date("H:i", $ts);    // 08:00',
        'echo date("l", $ts);      // Tuesday',
        'echo date("Y");           // année courante',
        'echo time();              // ex. 1793318400',
        'echo date("H:i", time() + 3600); // +1 h',
    ], seuil=0.08, taille=19)
    _sortie(d, ["15/09/2026", "08:00", "Tuesday", "2026",
                "1793318400  ·  +1 h → 09:00"], y=660, seuil=0.42, pas=27)
    _bandeau(d, "1970 → secondes → date()", "86400 s = 1 jour", BLEU)


# ══════════════════════════════════════════════════════════════════════════
#  11 · Vérifier et convertir une date
# ══════════════════════════════════════════════════════════════════════════
def scene_verifier_date(d, p, t):
    p_global[0] = p
    _entete(d, "verifier_date")
    _deux(d, "checkdate : MOIS, jour, année", "checkdate() et strtotime()")

    _ligne(d, 0, "checkdate(9, 15, 2026)   →  true", 21, VERT, 0.06, p, gras=True)
    _ligne(d, 1, "checkdate(2, 30, 2026)   →  false", 21, ROUGE_STYLO, 0.12, p, gras=True)
    _ligne(d, 2, "checkdate(2, 29, 2028)   →  true", 20, TEXTE_2, 0.18, p)
    _ligne(d, 3, "checkdate(2, 29, 2026)   →  false", 20, TEXTE_2, 0.23, p)
    _note(d, 4, "Le MOIS en premier, le jour ensuite.", 19, ROUGE_STYLO, 0.29, p)

    k = _apparait(p, 0.36, 0.14)
    if k > 0:
        boite_arrondie(d, [X, 416, GAUCHE[2] - 28, 566], rayon=14,
                       fond=melange(FOND_PANNEAU_2, BLEU, 0.12 * k),
                       bord=melange(BORDURE, BLEU, 0.6 * k), largeur_bord=2)
        d.text((X + 20, 430), "strtotime : une chaîne → un timestamp", font=police(20, True),
               fill=melange(FOND, BLEU, k), anchor="la")
        for i, (g, d_) in enumerate([
            ('"2026-09-15"', "1789430400"),
            ('"15 september 2026"', "1789430400"),
            ('"2026-09-15 08:00:00"', "1789459200"),
            ('"2026-13-45"', "false"),
        ]):
            d.text((X + 24, 468 + i * 26), g, font=police(16, False, mono=True),
                   fill=melange(FOND, TEXTE, k), anchor="la")
            d.text((X + 400, 468 + i * 26), "→ " + d_, font=police(16, True, mono=True),
                   fill=melange(FOND, VERT if d_ != "false" else ROUGE_STYLO, k),
                   anchor="la")

    _ligne(d, 12, "l'exemple complet de la fiche", 21, AMBRE, 0.50, p, gras=True)
    _ligne(d, 13, "vérifier → convertir → afficher", 19, TEXTE_2, 0.56, p)
    _note(d, 14, "Rentrée au Lycée Rafèha : 15/09/2026", 19, ROUGE_STYLO, 0.62, p)

    _code(d, [
        '$jour = 15; $mois = 9; $annee = 2026;',
        'if (checkdate($mois, $jour, $annee)) {',
        '    $ts = strtotime("$annee-$mois-$jour");',
        '    echo "Rentrée au Lycée Rafèha : "',
        '         . date("d/m/Y", $ts);',
        '} else { echo "Date invalide"; }',
    ], seuil=0.08, taille=19)
    _sortie(d, ["Rentrée au Lycée Rafèha : 15/09/2026"], y=700, seuil=0.46)
    _bandeau(d, "checkdate : mois, jour, année", "strtotime → date", VERT)


# ══════════════════════════════════════════════════════════════════════════
#  12 · Les exercices
# ══════════════════════════════════════════════════════════════════════════
def scene_exercices(d, p, t):
    p_global[0] = p
    _entete(d, "exercices")
    panneau(d, GAUCHE, "l'énoncé", accent=melange(BORDURE, AMBRE, 0.55))
    panneau(d, DROITE, "la correction détaillée", accent=melange(BORDURE, VERT, 0.55))
    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])

    _ligne(d, 1, "exercice 1", 20, AMBRE, 0.06, p, gras=True)
    _ligne(d, 2, "strlen($ch) = ?   strpos($ch, \"R\") = ?", 18, ENCRE, 0.09, p)
    _ligne(d, 4, "exercice 2", 20, AMBRE, 0.24, p, gras=True)
    _ligne(d, 5, "(int)\"12 euros 50\" = ?   (bool)\"0\" = ?", 18, ENCRE, 0.27, p)
    _ligne(d, 7, "exercice 3", 20, AMBRE, 0.42, p, gras=True)
    _ligne(d, 8, "afficher 15/09/2026 après vérification", 18, ENCRE, 0.45, p)

    _correction_exercices(d)
    _bandeau(d, "la fiche : chaînes · transtypage · date/heure",
             "à bientôt dans une prochaine capsule", VERT)


def _correction_exercices(d):
    p = p_global[0]
    x = DROITE[0] + 40
    lignes = [
        ("strlen($ch)", "14 — é et è comptent double", ROSE, 0.08),
        ("strpos($ch, \"R\")", "7 — à cause du é", ROSE, 0.14),
        ("(int)\"12 euros 50\"", "12 — lit le nombre du début", AMBRE, 0.28),
        ("(bool)\"0\"", "false — la chaîne zéro est fausse", AMBRE, 0.34),
        ("checkdate(9, 15, 2026)", "true — le mois D'ABORD", VERT, 0.48),
        ("strtotime(\"2026-09-15\")", "1789430400", VERT, 0.54),
        ("date(\"d/m/Y\", $ts)", "15/09/2026", VERT, 0.60),
    ]
    y = DROITE[1] + 78
    for code, reponse, couleur, seuil in lignes:
        k = _apparait(p, seuil, 0.10)
        if k <= 0:
            y += 64
            continue
        d.text((x, y), code, font=police(18, True, mono=True),
               fill=melange(FOND, TEXTE, k), anchor="la")
        d.text((x, y + 26), "→ " + reponse, font=police(16),
               fill=melange(FOND, couleur, k), anchor="la")
        y += 64

    _regles(d, p)


def _regles(d, p):
    """Les six règles à retenir, sous les énoncés, dans la moitié gauche."""
    regles = [
        "1 · les fonctions ne modifient pas la variable d'origine",
        "2 · strlen, strpos, substr : tout en OCTETS",
        "3 · absent : strpos → false, on teste avec ===",
        "4 · str_replace : toutes les occurrences",
        "5 · non numérique → 0 ; (bool)\"0\" → false",
        "6 · timestamp = secondes depuis le 1ᵉʳ janvier 1970",
    ]
    for i, texte in enumerate(regles):
        k = _apparait(p, 0.60 + 0.042 * i, 0.10)
        if k <= 0:
            continue
        d.text((X, 566 + i * 40), texte, font=police(19, True),
               fill=melange(PAPIER, ROUGE_STYLO, k), anchor="la")


# ══════════════════════════════════════════════════════════════════════════
#  Le répartiteur
# ══════════════════════════════════════════════════════════════════════════
SCENES = {
    "ouverture": scene_ouverture,
    "octets": scene_octets,
    "longueur": scene_longueur,
    "recherche": scene_recherche,
    "extraction": scene_extraction,
    "remplacer": scene_remplacer,
    "separer": scene_separer,
    "transtypage_nombres": scene_transtypage_nombres,
    "transtypage_autres": scene_transtypage_autres,
    "dates": scene_dates,
    "verifier_date": scene_verifier_date,
    "exercices": scene_exercices,
}

assert list(SCENES) == N.ORDRE, "une scène par section, dans l'ordre de la voix"


def dessiner(d: ImageDraw.ImageDraw, cle: str, p: float, t: float):
    """Peint une scène entière : le fond, puis la scène demandée."""
    p_global[0] = p
    G.fond(d, t)
    SCENES[cle](d, p, t)
