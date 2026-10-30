"""Les dix scènes de « La console et les variables ».

L'écran est coupé en deux, comme demandé :

  * **à gauche** — le cours et ses analogies : le papier du cahier ;
  * **à droite** — le code JavaScript, dans une console noire, avec sa sortie.

Pour les exercices, la même coupure change de sens : **l'énoncé à gauche**, la
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
)
import narration as N

TOTAL = len(N.ORDRE)

# ── les deux moitiés ───────────────────────────────────────────────────────
G_TITRE = "le cours"
D_TITRE = "le code"
X = GAUCHE[0] + 22          # marge intérieure du papier
Y0 = GAUCHE[1] + 62         # première ligne du papier
PAS = 34                    # interligne du cours
CODE_X = DROITE[0] + 44
CODE_Y = DROITE[1] + 104


# ══════════════════════════════════════════════════════════════════════════
#  L'en-tête et les deux panneaux
# ══════════════════════════════════════════════════════════════════════════
def _entete(d, cle):
    d.text((MARGE, 44), "CAPSULE · JAVASCRIPT · LA CONSOLE ET LES VARIABLES",
           font=police(19, True), fill=ORANGE)
    d.text((MARGE, 74), "La console, les variables et les types",
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
#  Les primitives du cours (à gauche) et du code (à droite)
# ══════════════════════════════════════════════════════════════════════════
def _apparait(p, seuil, duree=0.10):
    if p <= seuil:
        return 0.0
    return max(0.0, min(1.0, (p - seuil) / max(0.01, duree)))


def _ligne(d, i, texte, taille=24, couleur=ENCRE, seuil=0.0, p=1.0, gras=False):
    k = _apparait(p, seuil, 0.12)
    if k <= 0:
        return
    d.text((X, Y0 + i * PAS), texte, font=police(taille, gras),
           fill=melange(PAPIER, couleur, k), anchor="la")


def _note(d, i, texte, taille=22, couleur=ROUGE_STYLO, seuil=0.0, p=1.0):
    """Une ligne écrite au stylo rouge : l'idée à retenir."""
    k = _apparait(p, seuil, 0.12)
    if k <= 0:
        return
    d.text((X, Y0 + i * PAS), texte, font=police(taille, True),
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


def _sortie(d, lignes, titre="console", y=None, seuil=0.0, largeur=None):
    """Le panneau « sortie de la console » : ce que le programme affiche."""
    y = 700 if y is None else y
    box = [DROITE[0] + 16, y, DROITE[2] - 16, DROITE[3] - 16]
    boite_arrondie(d, box, rayon=14, fond=(8, 14, 22),
                   bord=melange(BORDURE, BLEU, 0.55), largeur_bord=2)
    d.text((box[0] + 18, box[1] + 18), titre, font=police(15, True),
           fill=melange(CODE_FOND, BLEU, 0.9), anchor="la")
    yy = box[1] + 52
    for ligne in lignes:
        d.text((box[0] + 22, yy), ligne, font=police(19, True, mono=True),
               fill=melange(CODE_FOND, TEXTE_2, 0.95), anchor="lm")
        yy += 30


def _etiquette(d, x, y, texte, couleur, p=1.0, taille=17):
    largeur = police(taille, True).getlength(texte) + 26
    boite_arrondie(d, [x, y - 15, x + largeur, y + 15], rayon=15,
                   fond=melange(FOND_PANNEAU_2, couleur, 0.20),
                   bord=melange(BORDURE, couleur, 0.75), largeur_bord=2)
    d.text((x + 13, y), texte, font=police(taille, True), fill=couleur, anchor="lm")


# ══════════════════════════════════════════════════════════════════════════
#  1 · Bienvenue
# ══════════════════════════════════════════════════════════════════════════
def scene_ouverture(d, p, t):
    _entete(d, "ouverture")
    panneau(d, GAUCHE, "ce qu'on va voir", accent=melange(BORDURE, AMBRE, 0.55))
    panneau(d, DROITE, "le code, et rien que le code",
            accent=melange(BORDURE, VERT, 0.55))

    blocs = [
        ("la console", "l'outil de tous les jours", BLEU, 0.10),
        ("les variables", "var · let · const", AMBRE, 0.24),
        ("les types", "sept primitifs, et typeof", VIOLET, 0.38),
        ("les exercices", "énoncé à gauche, correction à droite", VERT, 0.52),
    ]
    y = 244
    for nom, detail, couleur, seuil in blocs:
        k = _apparait(p, seuil, 0.12)
        if k <= 0:
            y += 110
            continue
        boite_arrondie(d, [96, y, 884, y + 90], rayon=16,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.12 * k),
                       bord=melange(BORDURE, couleur, 0.60 * k), largeur_bord=2)
        d.text((120, y + 20), nom, font=police(26, True),
               fill=melange(FOND, couleur, k), anchor="la")
        d.text((120, y + 56), detail, font=police(16),
               fill=melange(FOND, TEXTE_2, k), anchor="la")
        y += 110

    x = 96
    for texte, couleur, seuil in (("à gauche : le cours", AMBRE, 0.66),
                                  ("et ses analogies", AMBRE, 0.72),
                                  ("à droite : le code", VERT, 0.80)):
        if p <= seuil:
            continue
        _etiquette(d, x, 764, texte, couleur, taille=16)
        x += police(16, True).getlength(texte) + 42

    console(d, [DROITE[0] + 16, DROITE[1] + 16, DROITE[2] - 16, DROITE[1] + 300])
    lignes = ["console.log(\"Bonjour STI\");", "// → Bonjour STI"]
    yy = DROITE[1] + 82
    for i, ligne in enumerate(lignes):
        k = _apparait(p, 0.30 + 0.14 * i, 0.10)
        if k <= 0:
            break
        d.text((CODE_X + 10, yy), ligne, font=police(22, True, mono=True),
               fill=melange(CODE_FOND, VERT if i else TEXTE, k), anchor="lm")
        yy += 40

    _note(d, 13, "la console est ouverte toute la capsule", 19, TEXTE_3, 0.80, p)
    _bandeau(d, "aujourd'hui : la console, les variables, les types",
             "on commence par la console", AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  2 · La console
# ══════════════════════════════════════════════════════════════════════════
def scene_console(d, p, t):
    p_global[0] = p
    _entete(d, "console")
    _deux(d, "la console, c'est quoi ?", "console.log et ses cousines")
    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])

    _ligne(d, 0, "Le carnet de bord du programme.", 25, ENCRE, 0.04, p, gras=True)
    _ligne(d, 1, "j'y écris des valeurs, j'y lis les résultats", 20, TEXTE_3, 0.10, p)
    _ligne(d, 3, "À quoi ça sert ?", 22, AMBRE, 0.18, p, gras=True)
    for i, (titre, detail) in enumerate([
        ("1. voir", "ce que contient une variable, au lieu de deviner"),
        ("2. tester", "une idée en trois secondes, sans créer de page"),
        ("3. lire l'erreur", "le fichier, la ligne, le type d'erreur"),
    ]):
        k = _apparait(p, 0.24 + 0.10 * i, 0.10)
        if k <= 0:
            continue
        d.text((X, Y0 + (4 + 2 * i) * PAS - 8), titre, font=police(20, True),
               fill=melange(PAPIER, VERT, k), anchor="la")
        d.text((X + 172, Y0 + (4 + 2 * i) * PAS - 8), detail, font=police(18),
               fill=melange(PAPIER, TEXTE_2, k), anchor="la")
    _ligne(d, 11, "Une erreur, c'est un cadeau :", 20, TEXTE_2, 0.58, p)
    _note(d, 12, "JavaScript vous dit où et pourquoi.", 20, ROUGE_STYLO, 0.64, p)
    _ligne(d, 14, "Pour l'ouvrir :", 20, AMBRE, 0.72, p, gras=True)
    _ligne(d, 15, "F12   ·   Ctrl + Maj + J   →   onglet Console", 20, ENCRE, 0.78, p)
    _note(d, 17, "Une console ouverte, et vous ne devinez plus : vous voyez.",
          19, ROUGE_STYLO, 0.88, p)

    console(d, [DROITE[0] + 16, DROITE[1] + 16, DROITE[2] - 16, DROITE[1] + 330])
    _code(d, [
        'console.log("Bonjour STI");',
        "console.log(2 + 3);",
        "console.error(\"ceci est une erreur\");",
        "console.table([12, 15, 9]);",
    ], seuil=0.08, pas=0.08, taille=21)
    _sortie(d, ["Bonjour STI", "5", "▼ (3) [12, 15, 9]"],
            titre="ce que la console affiche", y=560)
    _bandeau(d, "la console : voir, tester, lire l'erreur",
             "console.log", BLEU)


# ══════════════════════════════════════════════════════════════════════════
#  3 · Déclarer une variable
# ══════════════════════════════════════════════════════════════════════════
def scene_declarer(d, p, t):
    p_global[0] = p
    _entete(d, "declarer")
    _deux(d, "une variable = une case nommée", "les trois mots-clés")

    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    _ligne(d, 0, "Une variable, c'est un espace mémoire nommé :", 22, ENCRE, 0.04, p)
    _ligne(d, 1, "une case dans la mémoire, une étiquette dessus.", 22, TEXTE_2, 0.10, p)
    _ligne(d, 3, "J'y mets une valeur, je lui parle par son nom.", 20, TEXTE_3, 0.16, p)

    # la règle pratique
    if p > 0.62:
        boite_arrondie(d, [96, 640, 884, 716], rayon=16,
                       fond=melange(FOND_PANNEAU_2, VERT, 0.12),
                       bord=melange(BORDURE, VERT, 0.70), largeur_bord=2)
        d.text((120, 660), "la règle", font=police(15, True), fill=TEXTE_3, anchor="la")
        d.text((120, 684), "const par défaut · let si ça change · var à éviter",
               font=police(19, True), fill=VERT, anchor="la")

    _code(d, [
        'let age = 16;      // je crée la case',
        'age = 17;          // je change la valeur',
        'console.log(age);  // la console montre 17',
    ], seuil=0.20, pas=0.10, taille=21)

    if p > 0.30:
        _etiquette(d, DROITE[0] + 24, 470, "let : la valeur peut changer", AMBRE)
    if p > 0.52:
        _etiquette(d, DROITE[0] + 24, 520, "const : la valeur ne change plus", VERT)
    if p > 0.70:
        _etiquette(d, DROITE[0] + 24, 570, "var : l'ancienne, on l'évite", ROUGE_BORD)

    _sortie(d, ["17"], titre="la console", y=660)
    _bandeau(d, "var · let · const — trois mots-clés, une règle",
             "const par défaut", VERT)


# ══════════════════════════════════════════════════════════════════════════
#  4 · La portée
# ══════════════════════════════════════════════════════════════════════════
def scene_portee(d, p, t):
    p_global[0] = p
    _entete(d, "portee")
    _deux(d, "l'analogie du lycée", "là où la voix porte")

    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    _ligne(d, 0, "La portée, c'est la zone où la variable existe.", 22, ENCRE, 0.04, p)
    _ligne(d, 1, "C'est la distance que la voix peut atteindre.", 20, TEXTE_3, 0.10, p)

    cas = [
        ("l'annonce au haut-parleur", "toutes les salles", "globale", BLEU),
        ("la salle 12", "seulement la salle 12", "locale", AMBRE),
        ("le groupe de travail", "seulement ce groupe", "de bloc : let, const", VIOLET),
    ]
    y = 318
    for i, (titre, detail, mot, couleur) in enumerate(cas):
        k = _apparait(p, 0.16 + 0.13 * i, 0.11)
        y_cas = y + i * 124
        if k <= 0:
            continue
        boite_arrondie(d, [96, y_cas, 884, y_cas + 108], rayon=14,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.10 * k),
                       bord=melange(BORDURE, couleur, 0.45 * k), largeur_bord=2)
        boite_arrondie(d, [118, y_cas + 28, 128, y_cas + 38], rayon=3,
                       fond=melange(FOND_PANNEAU_2, couleur, k))
        d.text((142, y_cas + 20), titre, font=police(20, True),
               fill=melange(FOND, TEXTE, k), anchor="la")
        d.text((142, y_cas + 54), detail, font=police(16),
               fill=melange(FOND, TEXTE_2, k), anchor="la")
        d.text((860, y_cas + 54), mot, font=police(17, True),
               fill=melange(FOND, couleur, k), anchor="ra")

    _note(d, 14, "Avec var, il n'y a pas de groupes :", 20, ROUGE_STYLO, 0.58, p)
    _note(d, 15, "tout ce qui est dit est entendu dans toute la salle.", 20,
          ROUGE_STYLO, 0.64, p)
    _ligne(d, 16, "Une fonction lit les variables du dehors ;", 19, TEXTE_2, 0.76, p)
    _ligne(d, 17, "le dehors ne lit pas celles de la fonction.", 19, TEXTE_2, 0.82, p)

    _code(d, [
        'let x = "dehors";',
        '{',
        '  let x = "dans le bloc";  // une AUTRE variable',
        '  console.log(x);          // → dans le bloc',
        '}',
        'console.log(x);            // → dehors',
    ], seuil=0.14, pas=0.07, taille=20)
    _bandeau(d, "globale · locale · de bloc", "let et const restent dans leur bloc", VIOLET)


# ══════════════════════════════════════════════════════════════════════════
#  5 · let et const en détail
# ══════════════════════════════════════════════════════════════════════════
def scene_let_const(d, p, t):
    p_global[0] = p
    _entete(d, "let_const")
    _deux(d, "let : ça change · const : ça ne change plus",
          "les deux erreurs à connaître")

    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    _ligne(d, 0, "let — la variable qui peut changer", 22, AMBRE, 0.04, p, gras=True)
    _ligne(d, 1, "réaffecter : oui  ·  redéclarer dans le bloc : non", 19, TEXTE_2, 0.10, p)
    _ligne(d, 2, "la zone morte : avant sa ligne, elle est inutilisable", 19,
           TEXTE_2, 0.16, p)
    _ligne(d, 5, "const — la variable qui ne change plus", 22, VERT, 0.30, p, gras=True)
    _ligne(d, 6, "réaffecter : non  ·  sans valeur : impossible", 19, TEXTE_2, 0.36, p)
    _note(d, 8, "la liaison est constante, PAS le contenu", 21, ROUGE_STYLO, 0.48, p)
    _ligne(d, 9, "notes[0] = 14 est autorisé : je change une case", 19, VERT, 0.56, p)
    _ligne(d, 10, "notes = [...) est refusé : je change la variable", 19, ROUGE_BORD, 0.62, p)

    # le piège de la boucle
    if p > 0.70:
        d.text((X, 640), "le piège de la boucle", font=police(19, True),
               fill=ROUGE_STYLO, anchor="la")
        d.text((X, 676), "for (var i …)  →  3 3 3", font=police(20, True, mono=True),
               fill=ROUGE_BORD, anchor="la")
        d.text((X, 706), "for (let j …)  →  0 1 2", font=police(20, True, mono=True),
               fill=VERT, anchor="la")
        d.text((X, 742), "chaque tour garde sa propre copie", font=police(16),
               fill=TEXTE_3, anchor="la")

    _code(d, [
        'let age = 16;',
        'age = 17;            // ✔ réaffectation',
        'let x = 1; let x = 2; // ✘ SyntaxError',
        '',
        'const PI = 3.14;',
        'PI = 3.15;           // ✘ TypeError',
        '',
        'const notes = [12, 15, 9];',
        'notes[0] = 14;       // ✔ une case',
        'notes = [10, 11];    // ✘ la variable',
    ], seuil=0.08, pas=0.065, taille=19)
    _bandeau(d, "let pour changer, const pour protéger",
             "const protège la liaison, pas le contenu", VERT)


# ══════════════════════════════════════════════════════════════════════════
#  6 · Le hoisting
# ══════════════════════════════════════════════════════════════════════════
def scene_hoisting(d, p, t):
    p_global[0] = p
    _entete(d, "hoisting")
    _deux(d, "la liste lue avant le cours", "undefined ou ReferenceError")

    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    _ligne(d, 0, "Avant d'exécuter, JavaScript note les déclarations.", 21, ENCRE, 0.04, p)
    _ligne(d, 1, "Comme si elles étaient remontées en haut du programme.", 20,
           TEXTE_2, 0.10, p)
    _note(d, 3, "Seule la déclaration remonte —", 20, ROUGE_STYLO, 0.18, p)
    _note(d, 4, "pas la valeur donnée ensuite.", 20, ROUGE_STYLO, 0.24, p)

    # l'analogie de la classe
    cas = [
        ("var", "l'élève est assis, mais son sac est vide", "→ undefined", BLEU, 0.32),
        ("let / const", "l'élève attend dans le couloir", "→ ReferenceError", VIOLET, 0.46),
    ]
    for i, (mot, image, resultat, couleur, seuil) in enumerate(cas):
        k = _apparait(p, seuil, 0.12)
        if k <= 0:
            continue
        y = 420 + i * 122
        boite_arrondie(d, [96, y, 884, y + 100], rayon=14,
                       fond=melange(FOND_PANNEAU_2, couleur, 0.10 * k),
                       bord=melange(BORDURE, couleur, 0.50 * k), largeur_bord=2)
        d.text((118, y + 20), mot, font=police(21, True, mono=True),
               fill=melange(FOND, couleur, k), anchor="la")
        d.text((118, y + 54), image, font=police(17),
               fill=melange(FOND, TEXTE_2, k), anchor="la")
        d.text((860, y + 54), resultat, font=police(18, True, mono=True),
               fill=melange(FOND, couleur, k), anchor="ra")

    _ligne(d, 16, "Utilisable à la ligne de sa déclaration :", 18, TEXTE_3, 0.76, p)
    _ligne(d, 17, "c'est son entrée en classe.", 18, TEXTE_3, 0.82, p)

    console(d, [DROITE[0] + 16, DROITE[1] + 16, DROITE[2] - 16, DROITE[3] - 16])
    _code(d, [
        "console.log(x);   // undefined",
        "var x = 5;",
        "",
        "console.log(y);   // ReferenceError",
        "let y = 5;",
    ], seuil=0.14, pas=0.10, taille=21)
    _sortie(d, ["undefined", "ReferenceError: Cannot access 'y' before initialization"],
            titre="la console", y=560, largeur=760)
    _bandeau(d, "hoisting : la déclaration remonte, la valeur non",
             "undefined  vs  ReferenceError", BLEU)


# ══════════════════════════════════════════════════════════════════════════
#  7 · Les types et typeof
# ══════════════════════════════════════════════════════════════════════════
def scene_types(d, p, t):
    p_global[0] = p
    _entete(d, "types")
    _deux(d, "sept primitifs, tout le reste est objet", "typeof, et ses pièges")

    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    _ligne(d, 0, "Le type est attaché à la valeur, pas à la variable.", 20,
           ENCRE, 0.03, p)
    _ligne(d, 1, "Un primitif : une valeur simple, indivisible.", 20, TEXTE_2, 0.08, p)
    _ligne(d, 2, "un ingrédient = un primitif  ·  un gâteau = un objet", 19, TEXTE_3, 0.13, p)

    types = [
        ("string", "\"Ali\"", AMBRE), ("number", "15 · 3.14 · NaN", BLEU),
        ("boolean", "true · false", VERT), ("undefined", "pas encore de valeur", TEXTE_3),
        ("null", "absence volontaire", TEXTE_3), ("bigint", "10n", VIOLET),
        ("symbol", "Symbol(\"id\")", ROSE),
    ]
    for i, (nom, exemple, couleur) in enumerate(types):
        k = _apparait(p, 0.18 + 0.045 * i, 0.08)
        if k <= 0:
            continue
        col, lig = i % 2, i // 2
        x = 100 + col * 392
        y = 350 + lig * 62
        d.text((x, y), nom, font=police(19, True, mono=True),
               fill=melange(PAPIER, couleur, k), anchor="la")
        d.text((x + 118, y), exemple, font=police(15),
               fill=melange(PAPIER, TEXTE_3, k), anchor="la")

    if p > 0.60:
        d.text((X, 620), "la valeur, ou la référence ?", font=police(19, True),
               fill=ROUGE_STYLO, anchor="la")
        d.text((X, 652), "primitif = copie indépendante (deux sacs de farine)",
               font=police(16), fill=TEXTE_2, anchor="la")
        d.text((X, 678), "tableau = même objet partagé (deux noms, un tableau)",
               font=police(16), fill=TEXTE_2, anchor="la")

    _code(d, [
        'typeof "texte";   // "string"',
        "typeof 42;        // \"number\"",
        "typeof true;      // \"boolean\"",
        "typeof null;      // \"object\"   ← bug historique",
        "typeof [1, 2];    // \"object\"   ← Array.isArray",
        "typeof NaN;       // \"number\"   ←",
        "typeof (() => 1); // \"function\"",
    ], seuil=0.10, pas=0.075, taille=19)

    if p > 0.78:
        _etiquette(d, DROITE[0] + 24, 600, "valeur : copie", BLEU)
        _etiquette(d, DROITE[0] + 280, 600, "référence : partage", VIOLET)
        d.text((DROITE[0] + 24, 650), "let b = a;  // deux cases", font=police(17, True, mono=True),
               fill=TEXTE_2, anchor="la")
        d.text((DROITE[0] + 24, 682), "const t2 = t1;  // un seul tableau",
               font=police(17, True, mono=True), fill=TEXTE_2, anchor="la")
        d.text((DROITE[0] + 24, 726), "\"5\" + 2 → \"52\"   ·   \"5\" - 2 → 3",
               font=police(18, True, mono=True), fill=AMBRE, anchor="la")

    _bandeau(d, "string · number · boolean · undefined · null · bigint · symbol",
             "typeof : trois pièges", VIOLET)


# ══════════════════════════════════════════════════════════════════════════
#  8 · Hors programme : falsy / truthy, == / ===
# ══════════════════════════════════════════════════════════════════════════
def scene_hors_programme(d, p, t):
    p_global[0] = p
    _entete(d, "hors_programme")
    _deux(d, "deux apartés", "à connaître, pas à réviser")

    # la mention « hors programme », en haut
    if p > 0.02:
        _etiquette(d, GAUCHE[0] + 220, GAUCHE[1] + 26, "HORS PROGRAMME", ROUGE_STYLO)
        _etiquette(d, DROITE[0] + 220, DROITE[1] + 26, "HORS PROGRAMME", ROUGE_STYLO)

    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    _ligne(d, 0, "1 · falsy et truthy", 22, AMBRE, 0.08, p, gras=True)
    _ligne(d, 1, "Dans un test, JavaScript traduit en vrai ou faux.", 18, TEXTE_2, 0.14, p)
    _ligne(d, 2, "faux pour lui : false · 0 · \"\" · null · undefined · NaN", 18,
           ROUGE_BORD, 0.22, p)
    _ligne(d, 3, "tout le reste est vrai, même \"0\" et même []", 18, VERT, 0.30, p)

    _ligne(d, 6, "2 · comparer : == ou ===", 22, AMBRE, 0.44, p, gras=True)
    _ligne(d, 7, "==  convertit avant de comparer", 18, TEXTE_2, 0.50, p)
    _ligne(d, 8, "===  compare le type ET la valeur", 18, TEXTE_2, 0.56, p)
    _note(d, 10, "La règle : trois égales, toujours.", 21, VERT, 0.68, p)
    _ligne(d, 12, "Retenez-les pour plus tard ;", 18, TEXTE_3, 0.78, p)
    _ligne(d, 13, "le cœur du cours, c'est le reste.", 18, TEXTE_3, 0.84, p)

    # le trait qui barre : rouge, épais, animé
    for indice, suite, seuil in ((0, "1 · falsy et truthy", 0.34),
                                 (6, "2 · comparer : == ou ===", 0.62)):
        if p <= seuil:
            continue
        k = _apparait(p, seuil, 0.16)
        largeur = police(22, True).getlength(suite) + 10
        barrer(d, X - 6, X - 6 + (largeur + 12) * k, Y0 + indice * PAS + 26)

    _code(d, [
        'if ("0") { }        // true : chaîne non vide',
        "if ([]) { }         // true : un tableau est vrai",
        "",
        '5 == "5";    // true   (convertit)',
        '5 === "5";   // false  (types différents)',
        "null === undefined;  // false",
        "NaN === NaN;         // false  → Number.isNaN",
    ], seuil=0.10, pas=0.08, taille=19)
    _bandeau(d, "hors programme : on les connaît, on ne les révise pas",
             "la règle reste : ===", ROUGE_BORD)


# ══════════════════════════════════════════════════════════════════════════
#  9 · Exercice 1 : énoncé à gauche, correction à droite
# ══════════════════════════════════════════════════════════════════════════
def _enonce(d, lignes, seuil=0.06):
    """Le papier de l'énoncé : les extraits, numérotés a, b, c…"""
    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    y = Y0 + 34
    for i, item in enumerate(lignes):
        lettre, code = item[0], item[1]
        k = _apparait(p_global[0], seuil + 0.055 * i, 0.08)
        if k <= 0:
            break
        d.text((X, y), f"{lettre})", font=police(19, True),
               fill=melange(PAPIER, AMBRE, k), anchor="la")
        d.text((X + 44, y), code, font=police(17, True, mono=True),
               fill=melange(PAPIER, ENCRE, k), anchor="la")
        y += 54


def _correction(d, lignes, seuil=0.10):
    """La correction, à droite : le résultat, puis l'explication."""
    y = DROITE[1] + 108
    d.text((DROITE[0] + 30, DROITE[1] + 62), "extrait", font=police(14, True),
           fill=TEXTE_3, anchor="la")
    d.text((DROITE[0] + 118, DROITE[1] + 62), "ce que la console affiche",
           font=police(14, True), fill=TEXTE_3, anchor="la")
    d.text((DROITE[0] + 380, DROITE[1] + 62), "pourquoi", font=police(14, True),
           fill=TEXTE_3, anchor="la")
    for i, (resultat, explication) in enumerate(lignes):
        k = _apparait(p_global[0], seuil + 0.055 * i, 0.08)
        if k <= 0:
            break
        couleur = ROUGE_BORD if ("Error" in resultat) else VERT
        d.text((DROITE[0] + 34, y), "abcdef"[i], font=police(17, True),
               fill=melange(FOND_PANNEAU, AMBRE, k), anchor="la")
        d.text((DROITE[0] + 118, y), resultat, font=police(18, True, mono=True),
               fill=melange(FOND_PANNEAU, couleur, k), anchor="la")
        d.text((DROITE[0] + 380, y), explication, font=police(15),
               fill=melange(FOND_PANNEAU, TEXTE_2, k), anchor="la")
        y += 66


def scene_exercice_1(d, p, t):
    p_global[0] = p
    _entete(d, "exercice_1")
    _deux(d, "l'énoncé", "la correction", accent_g=AMBRE, accent_d=VERT)


    _enonce(d, [
        ("a", "var a = 1; { var a = 2; } console.log(a);", []),
        ("b", "let b = 1; { let b = 2; } console.log(b);", []),
        ("c", "console.log(c);  var c = 5;", []),
        ("d", "console.log(d);  let d = 5;", []),
        ("e", "const e = 10;  e = 20;", []),
        ("f", "const f = [1, 2];  f[0] = 5;", []),
    ], seuil=0.06)

    _correction(d, [
        ("2", "var ignore le bloc, et redéclare la même variable"),
        ("1", "le let du bloc est une AUTRE variable, il meurt à }"),
        ("undefined", "hoisting de var : la déclaration remonte, pas la valeur"),
        ("ReferenceError", "d est dans la zone morte : TDZ de let"),
        ("TypeError", "on réaffecte une constante"),
        ("[5, 2]", "on modifie une case, pas la liaison"),
    ], seuil=0.10)

    _bandeau(d, "deux idées : la portée change tout · const protège la liaison, pas le contenu",
             "exercice 1", VERT)


# ══════════════════════════════════════════════════════════════════════════
#  10 · Exercice 2 : la fonction moyenne (+ bilan + générique)
# ══════════════════════════════════════════════════════════════════════════
def scene_exercice_moyenne(d, p, t):
    p_global[0] = p
    _entete(d, "exercice_moyenne")
    _deux(d, "l'énoncé", "la correction, ligne par ligne",
          accent_g=AMBRE, accent_d=VERT)

    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    _ligne(d, 0, "La moyenne des notes", 26, AMBRE, 0.04, p, gras=True)
    _ligne(d, 2, "Écrire une fonction moyenne(notes)", 20, ENCRE, 0.12, p)
    _ligne(d, 3, "qui reçoit un tableau de nombres", 20, ENCRE, 0.18, p)
    _ligne(d, 4, "et retourne leur moyenne.", 20, ENCRE, 0.24, p)
    _ligne(d, 6, "Contraintes", 19, TEXTE_3, 0.34, p, gras=True)
    for i, contrainte in enumerate([
        "const ou let, selon le cas",
        "une boucle for",
        "aucune variable globale",
        "tester avec [12, 15, 9]",
    ]):
        k = _apparait(p, 0.38 + 0.05 * i, 0.08)
        if k <= 0:
            continue
        d.text((X + 8, Y0 + (7 + i) * 36), "•", font=police(20, True),
               fill=melange(PAPIER, AMBRE, k), anchor="la")
        d.text((X + 34, Y0 + (7 + i) * 36), contrainte, font=police(19),
               fill=melange(PAPIER, ENCRE, k), anchor="la")

    if p > 0.68:
        boite_arrondie(d, [96, 690, 884, 770], rayon=14,
                       fond=melange(FOND_PANNEAU_2, VERT, 0.12),
                       bord=melange(BORDURE, VERT, 0.65), largeur_bord=2)
        d.text((120, 708), "à retenir", font=police(15, True), fill=TEXTE_3, anchor="la")
        d.text((120, 732), "const par défaut · let si ça change · var à éviter",
               font=police(17, True), fill=VERT, anchor="la")

    console(d, [DROITE[0] + 16, DROITE[1] + 16, DROITE[2] - 16, DROITE[1] + 470])
    _code(d, [
        "function moyenne(notes) {",
        "  let somme = 0;",
        "  for (let i = 0; i < notes.length; i++) {",
        "    somme += notes[i];",
        "  }",
        "  return somme / notes.length;",
        "}",
        "",
        "console.log(moyenne([12, 15, 9])); // → 12",
    ], seuil=0.06, pas=0.075, taille=19, y=DROITE[1] + 78)

    # les explications, en face de chaque ligne
    explications = [
        (0, "le paramètre est local"),
        (1, "let : la valeur va changer"),
        (2, "une boucle for, comme demandé"),
        (3, "j'ajoute chaque note"),
        (5, "le total divisé par le nombre"),
        (8, "(12+15+9)/3 = 12"),
    ]
    for i, (ligne, texte) in enumerate(explications):
        k = _apparait(p, 0.30 + 0.09 * i, 0.08)
        if k <= 0:
            continue
        d.text((DROITE[0] + 610, DROITE[1] + 78 + ligne * 31), texte,
               font=police(15), fill=melange(FOND_PANNEAU, VERT, k), anchor="la")

    if p > 0.90:
        _etiquette(d, DROITE[0] + 24, 690, "le calcul : 36 / 3 = 12", VERT)
    _bandeau(d, "une fonction, une boucle, et let au bon endroit",
             "moyenne([12, 15, 9]) → 12", VERT)


# ══════════════════════════════════════════════════════════════════════════
#  Le répartiteur
# ══════════════════════════════════════════════════════════════════════════
SCENES = {
    "ouverture": scene_ouverture,
    "console": scene_console,
    "declarer": scene_declarer,
    "portee": scene_portee,
    "let_const": scene_let_const,
    "hoisting": scene_hoisting,
    "types": scene_types,
    "hors_programme": scene_hors_programme,
    "exercice_1": scene_exercice_1,
    "exercice_moyenne": scene_exercice_moyenne,
}

assert list(SCENES) == N.ORDRE, "une scène par section, dans le même ordre"


def dessiner(d: ImageDraw.ImageDraw, cle: str, p: float, t: float):
    p_global[0] = p
    G.fond(d, t)
    SCENES[cle](d, p, t)
