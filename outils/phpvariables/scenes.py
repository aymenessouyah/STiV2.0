"""Les dix scènes de « Les variables, la portée et les types » (PHP).

L'écran est coupé en deux, comme la capsule JavaScript :

  * **à gauche** — le cours et ses analogies : le papier du cahier ;
  * **à droite** — le code PHP, dans une console noire, avec ce que la page
    affiche.

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
    d.text((MARGE, 44), "CAPSULE · PHP · LES VARIABLES, LA PORTÉE ET LES TYPES",
           font=police(19, True), fill=ORANGE)
    d.text((MARGE, 74), "Les variables, la portée et les types",
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
        couleur = VERT if ligne.strip().startswith(("//", "/*", "#")) else TEXTE
        d.text((CODE_X + 18, y), visible, font=police(taille, False, mono=True),
               fill=melange(CODE_FOND, couleur, k), anchor="lm")
        y += taille + 12
    return y


p_global = [1.0]   # la progression courante, lue par `_code`


def _sortie(d, lignes, titre="ce que la page affiche", y=None, seuil=0.0, largeur=None):
    """Le panneau « sortie » : ce que PHP affiche vraiment."""
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


def _carte(d, y, titre, detail, couleur, k, droite=None, hauteur=92):
    """Une carte du cours : le mot, l'image, et le résultat à droite."""
    boite_arrondie(d, [96, y, 884, y + hauteur], rayon=14,
                   fond=melange(FOND_PANNEAU_2, couleur, 0.10 * k),
                   bord=melange(BORDURE, couleur, 0.50 * k), largeur_bord=2)
    boite_arrondie(d, [118, y + 24, 128, y + 34], rayon=3,
                   fond=melange(FOND_PANNEAU_2, couleur, k))
    d.text((142, y + 18), titre, font=police(20, True),
           fill=melange(FOND, TEXTE, k), anchor="la")
    if detail:
        d.text((142, y + 52), detail, font=police(16),
               fill=melange(FOND, TEXTE_2, k), anchor="la")
    if droite:
        d.text((860, y + 52), droite, font=police(17, True),
               fill=melange(FOND, couleur, k), anchor="ra")


def _encadre(d, box, titre, couleur, k, lignes, taille=17):
    """Un encadré dans le papier : un titre et deux ou trois lignes."""
    boite_arrondie(d, box, rayon=12,
                   fond=melange(PAPIER, couleur, 0.10 * k),
                   bord=melange(PAPIER, couleur, 0.55 * k), largeur_bord=2)
    d.text((box[0] + 18, box[1] + 14), titre, font=police(taille - 2, True),
           fill=melange(PAPIER, TEXTE_3, k), anchor="la")
    yy = box[1] + 40
    for ligne in lignes:
        d.text((box[0] + 18, yy), ligne, font=police(taille, True),
               fill=melange(PAPIER, couleur, k), anchor="la")
        yy += taille + 8


# ══════════════════════════════════════════════════════════════════════════
#  1 · Bienvenue
# ══════════════════════════════════════════════════════════════════════════
def scene_ouverture(d, p, t):
    p_global[0] = p
    _entete(d, "ouverture")
    panneau(d, GAUCHE, "ce qu'on va voir", accent=melange(BORDURE, AMBRE, 0.55))
    panneau(d, DROITE, "le code, et ce que la page affiche",
            accent=melange(BORDURE, VERT, 0.55))

    blocs = [
        ("les variables", "le dollar, echo, isset", BLEU, 0.10),
        ("les constantes", "define · const", ROSE, 0.22),
        ("la portée et les types", "global · static · tableau", AMBRE, 0.34),
        ("les exercices", "énoncé à gauche, correction à droite", VERT, 0.46),
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
    for texte, couleur, seuil in (("à gauche : le cours", AMBRE, 0.60),
                                  ("et ses analogies", AMBRE, 0.66),
                                  ("à droite : le code PHP", VERT, 0.74)):
        if p <= seuil:
            continue
        _etiquette(d, x, 764, texte, couleur, taille=16)
        x += police(16, True).getlength(texte) + 42

    console(d, [DROITE[0] + 16, DROITE[1] + 16, DROITE[2] - 16, DROITE[1] + 300])
    lignes = ['<?php', '$nom = "Ali";', 'echo "Bonjour $nom";   // Bonjour Ali']
    yy = DROITE[1] + 82
    for i, ligne in enumerate(lignes):
        k = _apparait(p, 0.24 + 0.12 * i, 0.10)
        if k <= 0:
            break
        d.text((CODE_X + 4, yy), ligne, font=police(21, True, mono=True),
               fill=melange(CODE_FOND, VERT if i == 2 else TEXTE, k), anchor="lm")
        yy += 38

    _note(d, 13, "une variable commence par un dollar", 21, ROUGE_STYLO, 0.72, p)
    _bandeau(d, "aujourd'hui : les variables, la portée, les types",
             "on commence par la déclaration", AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  2 · Déclarer une variable, et les constantes
# ══════════════════════════════════════════════════════════════════════════
def scene_declarer(d, p, t):
    p_global[0] = p
    _entete(d, "declarer")
    _deux(d, "une variable, c'est un nom et une valeur", "déclarer, afficher, tester")

    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    _ligne(d, 0, "En PHP, pas de mot-clé : la variable naît", 22, ENCRE, 0.03, p)
    _ligne(d, 1, "à sa première affectation.", 22, ENCRE, 0.07, p)
    _note(d, 3, "trois règles", 21, ROUGE_STYLO, 0.14, p)
    _ligne(d, 4, "· une lettre ou _ au début : $note1 ok · $1note non", 19, TEXTE_2, 0.20, p)
    _ligne(d, 5, "· $age et $Age : deux variables différentes", 19, TEXTE_2, 0.26, p)
    _ligne(d, 6, "· le type suit la valeur (typage dynamique)", 19, TEXTE_2, 0.32, p)

    _ligne(d, 8, "afficher : echo", 20, VERT, 0.40, p, gras=True)
    _ligne(d, 9, "\"Bonjour $nom\"  → la variable est remplacée", 18, TEXTE_2, 0.46, p)
    _ligne(d, 10, "'Bonjour $nom'  → le texte reste tel quel", 18, TEXTE_2, 0.52, p)
    _ligne(d, 11, '"Bonjour " . $nom : le point colle', 18, TEXTE_2, 0.58, p)

    _ligne(d, 13, "tester : isset · unset · empty", 20, AMBRE, 0.66, p, gras=True)
    _ligne(d, 14, "constante : define(\"TVA\", 0.19) · const PI = 3.14", 18,
           TEXTE_2, 0.74, p)
    _note(d, 16, "une constante : sans $, et visible partout", 20, ROUGE_STYLO, 0.80, p)

    console(d, [DROITE[0] + 16, DROITE[1] + 16, DROITE[2] - 16, 620])
    _code(d, [
        '$nom = "Ali";',
        '$age = 16;',
        '$moyenne = 13.5;',
        '',
        'echo "Bonjour $nom";     // Bonjour Ali',
        "echo 'Bonjour $nom';     // Bonjour $nom",
        'echo "Bonjour " . $nom;  // Bonjour Ali',
        '',
        'define("TVA", 0.19);',
        'const PI = 3.14;',
        'echo PI;                 // 3.14',
    ], seuil=0.05, pas=0.055, taille=20, y=DROITE[1] + 78)

    _sortie(d, ["Bonjour Ali", "Bonjour $nom", "Bonjour Ali", "3.14"], y=640)
    _bandeau(d, "dollar, pas de mot-clé · echo · isset", "define ou const", AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  3 · La portée : l'analogie du lycée
# ══════════════════════════════════════════════════════════════════════════
def scene_portee(d, p, t):
    p_global[0] = p
    _entete(d, "portee")
    _deux(d, "l'analogie du lycée", "là où la voix porte")

    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    _ligne(d, 0, "La portée, c'est la zone où la variable existe.", 21, ENCRE, 0.03, p)
    _ligne(d, 1, "C'est la distance que la voix peut atteindre.", 19, TEXTE_3, 0.08, p)

    cas = [
        ("l'annonce au haut-parleur", "couloir et cour", "globale", BLEU),
        ("la salle de classe porte fermée", "ce qui s'y dit y reste", "locale", AMBRE),
        ("les carnets de liaison", "$_GET · $_POST · $_SESSION", "superglobale", VIOLET),
    ]
    y = 316
    for i, (titre, detail, mot, couleur) in enumerate(cas):
        k = _apparait(p, 0.14 + 0.12 * i, 0.11)
        if k <= 0:
            continue
        _carte(d, y + i * 116, titre, detail, couleur, k, droite=mot, hauteur=100)

    _note(d, 14, "le mot global ouvre la porte :", 20, ROUGE_STYLO, 0.56, p)
    _note(d, 15, "dans une fonction, le dehors est invisible", 20, ROUGE_STYLO, 0.62, p)
    _ligne(d, 17, "Autre solution, souvent préférée : le paramètre.", 18,
           TEXTE_2, 0.72, p)

    console(d, [DROITE[0] + 16, DROITE[1] + 16, DROITE[2] - 16, 596])
    _code(d, [
        '$site = "STI";',
        '',
        'function afficher() {',
        '  echo $site;    // Undefined variable',
        '}',
        '',
        'function afficher2() {',
        '  global $site;  // la porte s\'ouvre',
        '  echo $site;    // STI',
        '}',
    ], seuil=0.06, pas=0.062, taille=20, y=DROITE[1] + 78)

    _sortie(d, ["Warning : Undefined variable $site",
                "STI"], y=616)
    _bandeau(d, "globale · locale · superglobale", "global ouvre la porte", VIOLET)


# ══════════════════════════════════════════════════════════════════════════
#  4 · Pas de portée de bloc ; static
# ══════════════════════════════════════════════════════════════════════════
def scene_bloc_static(d, p, t):
    p_global[0] = p
    _entete(d, "bloc_static")
    _deux(d, "pas de portée de bloc", "et la variable static")

    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    _ligne(d, 0, "Les accolades de if, for, while", 21, ENCRE, 0.03, p)
    _ligne(d, 1, "ne créent pas de zone propre.", 21, ENCRE, 0.07, p)
    _note(d, 3, "une variable née dans un bloc reste visible", 19, ROUGE_STYLO, 0.14, p)
    _ligne(d, 5, "if (true) { $a = 1; }", 19, VERT, 0.22, p)
    _ligne(d, 6, "echo $a;              // 1", 19, VERT, 0.26, p)
    _ligne(d, 8, "après un for, $i vaut 3", 19, TEXTE_2, 0.34, p)
    _ligne(d, 9, "et $dernier garde la dernière valeur", 19, TEXTE_2, 0.38, p)

    _ligne(d, 11, "Seule la fonction crée une portée.", 21, AMBRE, 0.48, p, gras=True)
    _ligne(d, 13, "static : la variable locale survit", 20, VIOLET, 0.58, p, gras=True)
    _ligne(d, 14, "d'un appel à l'autre.", 20, VIOLET, 0.62, p)
    _ligne(d, 16, "sans static : toujours 1", 18, TEXTE_3, 0.70, p)

    console(d, [DROITE[0] + 16, DROITE[1] + 16, DROITE[2] - 16, 540])
    _code(d, [
        'if (true) { $a = 1; }',
        'echo $a;                 // 1',
        '',
        'for ($i = 0; $i < 3; $i++) { $dernier = $i; }',
        'echo $i;                 // 3',
        'echo $dernier;           // 2',
    ], seuil=0.05, pas=0.06, taille=19, y=DROITE[1] + 78)

    if p > 0.52:
        k = _apparait(p, 0.52, 0.14)
        box = [DROITE[0] + 16, 556, DROITE[2] - 16, 700]
        boite_arrondie(d, box, rayon=14,
                       fond=melange(FOND_PANNEAU, VIOLET, 0.10 * k),
                       bord=melange(BORDURE, VIOLET, 0.55 * k), largeur_bord=2)
        d.text((box[0] + 18, box[1] + 14), "static : le compteur",
               font=police(16, True), fill=melange(FOND_PANNEAU, VIOLET, k), anchor="la")
        suivi = [
            "function compteur() {",
            "  static $n = 0;  $n++;  return $n;",
            "}",
        ]
        yy = box[1] + 46
        for ligne in suivi:
            d.text((box[0] + 22, yy), ligne, font=police(18, True, mono=True),
                   fill=melange(FOND_PANNEAU, TEXTE_2, k), anchor="la")
            yy += 28

    _sortie(d, ["1", "3", "2", "compteur() → 1, 2, 3"], y=706)
    _bandeau(d, "pas de bloc · seule la fonction isole", "static garde la valeur", VIOLET)


# ══════════════════════════════════════════════════════════════════════════
#  5 · Le hoisting n'existe pas en PHP
# ══════════════════════════════════════════════════════════════════════════
def scene_hoisting(d, p, t):
    p_global[0] = p
    _entete(d, "hoisting")
    _deux(d, "la liste lue avant le cours", "les variables, puis les fonctions")

    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    _ligne(d, 0, "En JavaScript, les déclarations remontent.", 21, ENCRE, 0.03, p)
    _ligne(d, 1, "PHP ne le fait pas : le fichier est lu", 21, ENCRE, 0.07, p)
    _ligne(d, 2, "de haut en bas.", 21, ENCRE, 0.11, p)

    _note(d, 3, "Le surveillant n'appelle que les élèves", 20, ROUGE_STYLO, 0.18, p)
    _note(d, 4, "déjà inscrits et arrivés.", 20, ROUGE_STYLO, 0.22, p)

    k = _apparait(p, 0.34, 0.14)
    if k > 0:
        _encadre(d, [96, 430, 884, 546], "les variables : rien avant la ligne", AMBRE, k,
                 ["echo $x;   // Undefined variable", "$x = 5;     // c'est ici qu'elle naît"])

    k = _apparait(p, 0.56, 0.14)
    if k > 0:
        _encadre(d, [96, 580, 884, 720], "les fonctions : connues d'avance", VERT, k,
                 ["echo double(4);   // 8", "function double($n) {",
                  "  return $n * 2;  }"])

    _ligne(d, 16, "comme le règlement affiché avant la rentrée", 18, TEXTE_3, 0.72, p)

    console(d, [DROITE[0] + 16, DROITE[1] + 16, DROITE[2] - 16, 620])
    _code(d, [
        'echo $x;      // rien : Undefined variable',
        '$x = 5;',
        'echo $x;      // 5',
        '',
        'echo double(4);   // 8',
        'function double($n) {',
        '  return $n * 2;',
        '}',
    ], seuil=0.06, pas=0.075, taille=20, y=DROITE[1] + 82)

    _sortie(d, ["Warning : Undefined variable $x", "5", "8"], y=648)
    _bandeau(d, "pas de remontée des variables", "les fonctions, oui", AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  6 · Les types : scalaires, array, null
# ══════════════════════════════════════════════════════════════════════════
def scene_types(d, p, t):
    p_global[0] = p
    _entete(d, "types")
    _deux(d, "trois familles de types", "gettype, var_dump, la copie")

    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    _ligne(d, 0, "scalaire, du latin scala : une valeur simple,", 20, ENCRE, 0.03, p)
    _ligne(d, 1, "à un seul niveau, qui ne contient rien d'autre.", 20, ENCRE, 0.07, p)

    familles = [
        ("scalaires", "int · float · string · bool", BLEU),
        ("composé", "array — le tableau", AMBRE),
        ("spécial", "null — aucune valeur", VIOLET),
    ]
    y = 316
    for i, (titre, detail, couleur) in enumerate(familles):
        k = _apparait(p, 0.12 + 0.10 * i, 0.10)
        if k <= 0:
            continue
        _carte(d, y + i * 92, titre, detail, couleur, k, hauteur=82)

    _ligne(d, 10, "la cuisine : le sel, la farine, l'œuf", 19, TEXTE_2, 0.46, p)
    _ligne(d, 11, "sont des ingrédients ; le gâteau est un tableau", 19, TEXTE_2, 0.50, p)

    _note(d, 13, "En PHP, tout est copié par valeur,", 20, ROUGE_STYLO, 0.62, p)
    _note(d, 14, "les tableaux compris : c'est une photocopie.", 20, ROUGE_STYLO, 0.66, p)
    _ligne(d, 16, "le & donne l'original, pas une copie", 19, VERT, 0.78, p)

    console(d, [DROITE[0] + 16, DROITE[1] + 16, DROITE[2] - 16, 560])
    _code(d, [
        'gettype(3.14);    // "double"',
        'gettype("Ali");   // "string"',
        'gettype(null);    // "NULL"',
        'var_dump(15);     // int(15)',
        '',
        '$a = 5;  $b = $a;  $b = 10;',
        'echo $a;          // 5 : vraie copie',
        '',
        '$t1 = [1, 2];  $t2 = $t1;  $t2[0] = 99;',
        'echo $t1[0];      // 1 : lui aussi copié',
    ], seuil=0.05, pas=0.06, taille=19, y=DROITE[1] + 78)

    _sortie(d, ['"double" · "string" · "NULL" · int(15)', "5    1"], y=650)
    _bandeau(d, "int · float · string · bool · array · null", "copie par valeur", VIOLET)


# ══════════════════════════════════════════════════════════════════════════
#  7 · Les tableaux : indexés et associatifs
# ══════════════════════════════════════════════════════════════════════════
def scene_tableaux(d, p, t):
    p_global[0] = p
    _entete(d, "tableaux")
    _deux(d, "deux façons de retrouver une case", "indexé et associatif")

    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    _ligne(d, 0, "indexé : un numéro, à partir de 0", 21, ENCRE, 0.03, p)
    _ligne(d, 1, "les casiers numérotés du couloir", 19, TEXTE_3, 0.07, p)
    _ligne(d, 2, "$notes = [12, 15, 9];  →  $notes[1] = 15", 18, VERT, 0.14, p)
    _ligne(d, 3, "count($notes) donne le nombre de casiers", 18, TEXTE_2, 0.18, p)

    _ligne(d, 5, "associatif : une clé, un nom choisi", 21, ENCRE, 0.28, p)
    _ligne(d, 6, "la fiche de renseignements de l'élève", 19, TEXTE_3, 0.32, p)
    _ligne(d, 7, '$eleve = ["nom" => "Ali", "age" => 16]', 18, VERT, 0.38, p)
    _ligne(d, 8, 'echo $eleve["nom"];  →  Ali', 18, TEXTE_2, 0.42, p)

    _note(d, 10, "foreach parcourt les cases, une par une :", 19, ROUGE_STYLO, 0.54, p)
    _ligne(d, 11, "$cle reçoit l'étiquette, $valeur son contenu", 18, TEXTE_2, 0.58, p)
    _ligne(d, 13, "isset($eleve[\"nom\"]) teste une clé", 18, AMBRE, 0.68, p)

    _ligne(d, 15, "indexé : des numéros · associatif : des clés", 18, TEXTE_3, 0.76, p)
    _ligne(d, 16, "mais toujours un seul nom : la variable tableau", 18,
           TEXTE_3, 0.80, p)

    console(d, [DROITE[0] + 16, DROITE[1] + 16, DROITE[2] - 16, 560])
    _code(d, [
        '$notes = [12, 15, 9];',
        'echo $notes[1];        // 15',
        '$notes[3] = 10;        // un casier de plus',
        'echo count($notes);    // 4',
        '',
        '$eleve = ["nom" => "Ali", "age" => 16];',
        'echo $eleve["nom"];    // Ali',
        'foreach ($eleve as $cle => $valeur) {',
        '  echo "$cle : $valeur";',
        '}',
    ], seuil=0.05, pas=0.06, taille=19, y=DROITE[1] + 78)

    _sortie(d, ["15", "4", "Ali", "nom : Ali   age : 16"], y=648)
    _bandeau(d, "indexé · associatif · foreach", "array : le type composé", AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  8 · Hors programme : falsy, et == / ===
# ══════════════════════════════════════════════════════════════════════════
def scene_hors_programme(d, p, t):
    p_global[0] = p
    _entete(d, "hors_programme")
    _deux(d, "deux apartés", "à connaître, pas à réviser")

    if p > 0.02:
        _etiquette(d, GAUCHE[0] + 220, GAUCHE[1] + 26, "HORS PROGRAMME", ROUGE_STYLO)


    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    _ligne(d, 0, "1 · vrai ou faux", 22, AMBRE, 0.08, p, gras=True)
    _ligne(d, 1, "Dans un test, PHP traduit en vrai ou faux.", 18, TEXTE_2, 0.14, p)
    _ligne(d, 2, 'faux : false · 0 · 0.0 · "" · "0" · [] · null', 18,
           ROUGE_BORD, 0.22, p)
    _ligne(d, 3, "tout le reste est vrai", 18, VERT, 0.30, p)
    _ligne(d, 4, 'attention : "0" est faux en PHP, vrai en JavaScript', 17,
           ROUGE_STYLO, 0.36, p)

    _ligne(d, 6, "2 · comparer : == ou ===", 22, AMBRE, 0.48, p, gras=True)
    _ligne(d, 7, "==  convertit avant de comparer", 18, TEXTE_2, 0.54, p)
    _ligne(d, 8, "===  compare le type ET la valeur", 18, TEXTE_2, 0.60, p)
    _note(d, 10, "La règle : trois égales, toujours.", 21, VERT, 0.68, p)
    _ligne(d, 12, "et les conversions :", 18, TEXTE_3, 0.78, p)
    _ligne(d, 13, '"5" + 2 → 7   ·   "5" . 2 → "52"', 18, TEXTE_3, 0.84, p)

    for indice, suite, seuil in ((0, "1 · vrai ou faux", 0.34),
                                 (6, "2 · comparer : == ou ===", 0.62)):
        if p <= seuil:
            continue
        k = _apparait(p, seuil, 0.16)
        largeur = police(22, True).getlength(suite) + 10
        barrer(d, X - 6, X - 6 + (largeur + 12) * k, Y0 + indice * PAS + 26)

    console(d, [DROITE[0] + 16, DROITE[1] + 16, DROITE[2] - 16, 620])
    _code(d, [
        'if ("0") { }        // false en PHP !',
        '',
        '5 == "5";           // true  (convertit)',
        '5 === "5";          // false (types différents)',
        'null == false;      // true',
        '0.1 + 0.2 == 0.3;   // false (précision)',
        '',
        '(int) "15px";       // 15',
        '(int) "abc";        // 0',
    ], seuil=0.06, pas=0.065, taille=19, y=DROITE[1] + 80)

    _sortie(d, ["bool(false)", "bool(true)  bool(false)", "15   0"], y=648)
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
    d.text((DROITE[0] + 118, DROITE[1] + 62), "ce qui s'affiche",
           font=police(14, True), fill=TEXTE_3, anchor="la")
    d.text((DROITE[0] + 400, DROITE[1] + 62), "pourquoi", font=police(14, True),
           fill=TEXTE_3, anchor="la")
    for i, (resultat, explication) in enumerate(lignes):
        k = _apparait(p_global[0], seuil + 0.055 * i, 0.08)
        if k <= 0:
            break
        couleur = ROUGE_BORD if resultat == "rien" else VERT
        d.text((DROITE[0] + 34, y), "abcdef"[i], font=police(17, True),
               fill=melange(FOND_PANNEAU, AMBRE, k), anchor="la")
        d.text((DROITE[0] + 118, y), resultat, font=police(18, True, mono=True),
               fill=melange(FOND_PANNEAU, couleur, k), anchor="la")
        d.text((DROITE[0] + 400, y), explication, font=police(15),
               fill=melange(FOND_PANNEAU, TEXTE_2, k), anchor="la")
        y += 66


def scene_exercice_1(d, p, t):
    p_global[0] = p
    _entete(d, "exercice_1")
    _deux(d, "l'énoncé", "la correction", accent_g=AMBRE, accent_d=VERT)

    _enonce(d, [
        ("a", "$a = 1; function f() { echo $a; }  f();"),
        ("b", "$b = 2; function g() { global $b; echo $b; }  g();"),
        ("c", "if (true) { $c = 3; }  echo $c;"),
        ("d", "function h() { static $n = 0; $n++; echo $n; }"),
        ("e", "echo $d;   $d = 4;"),
        ("f", 'define("X", 10); function k() { echo X; }  k();'),
    ], seuil=0.05)

    _correction(d, [
        ("rien", "avertissement : variable $a non définie"),
        ("2", "global a ouvert la porte"),
        ("3", "pas de portée de bloc en PHP"),
        ("1 2 3", "static garde la valeur entre les appels"),
        ("rien", "aucune remontée : $d n'existe pas encore"),
        ("10", "une constante est visible partout"),
    ], seuil=0.12)

    _bandeau(d, "trois idées : la portée · static · les constantes", "exercice 1", VERT)


# ══════════════════════════════════════════════════════════════════════════
#  10 · Exercice : la fonction moyenne
# ══════════════════════════════════════════════════════════════════════════
def scene_exercice_moyenne(d, p, t):
    p_global[0] = p
    _entete(d, "exercice_moyenne")
    _deux(d, "l'énoncé", "la correction, ligne par ligne",
          accent_g=AMBRE, accent_d=VERT)

    papier(d, [GAUCHE[0] + 16, GAUCHE[1] + 56, GAUCHE[2] - 16, GAUCHE[3] - 16])
    _ligne(d, 0, "La moyenne des notes", 26, AMBRE, 0.04, p, gras=True)
    _ligne(d, 2, "Écrire une fonction moyenne($notes)", 20, ENCRE, 0.12, p)
    _ligne(d, 3, "qui reçoit un tableau de nombres", 20, ENCRE, 0.18, p)
    _ligne(d, 4, "et retourne leur moyenne.", 20, ENCRE, 0.24, p)
    _ligne(d, 6, "Contraintes", 19, TEXTE_3, 0.34, p, gras=True)
    for i, contrainte in enumerate([
        "une boucle for",
        "la fonction count()",
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
        d.text((120, 732), "une variable commence par $ · tout est copié par valeur",
               font=police(16, True), fill=VERT, anchor="la")

    console(d, [DROITE[0] + 16, DROITE[1] + 16, DROITE[2] - 16, DROITE[1] + 470])
    _code(d, [
        "function moyenne($notes) {",
        "  $somme = 0;",
        "  for ($i = 0; $i < count($notes); $i++) {",
        "    $somme = $somme + $notes[$i];",
        "  }",
        "  return $somme / count($notes);",
        "}",
        "",
        "echo moyenne([12, 15, 9]);   // 12",
    ], seuil=0.06, pas=0.075, taille=19, y=DROITE[1] + 78)

    # les explications, en face de chaque ligne
    explications = [
        (0, "le paramètre est local"),
        (1, "$somme démarre à zéro"),
        (2, "une boucle for, comme demandé"),
        (3, "j'ajoute chaque note"),
        (5, "le total divisé par count()"),
        (8, "(12 + 15 + 9) / 3 = 36 / 3 = 12"),
    ]
    for i, (ligne, texte) in enumerate(explications):
        k = _apparait(p, 0.30 + 0.09 * i, 0.08)
        if k <= 0:
            continue
        d.text((DROITE[0] + 610, DROITE[1] + 78 + ligne * 31), texte,
               font=police(15), fill=melange(FOND_PANNEAU, VERT, k), anchor="la")

    if p > 0.90:
        _etiquette(d, DROITE[0] + 24, 690, "le calcul : 36 / 3 = 12", VERT)
    _bandeau(d, "une fonction, une boucle, count()", "moyenne([12, 15, 9]) → 12", VERT)


# ══════════════════════════════════════════════════════════════════════════
#  Le répartiteur
# ══════════════════════════════════════════════════════════════════════════
SCENES = {
    "ouverture": scene_ouverture,
    "declarer": scene_declarer,
    "portee": scene_portee,
    "bloc_static": scene_bloc_static,
    "hoisting": scene_hoisting,
    "types": scene_types,
    "tableaux": scene_tableaux,
    "hors_programme": scene_hors_programme,
    "exercice_1": scene_exercice_1,
    "exercice_moyenne": scene_exercice_moyenne,
}

assert list(SCENES) == N.ORDRE, "une scène par section, dans le même ordre"


def dessiner(d: ImageDraw.ImageDraw, cle: str, p: float, t: float):
    p_global[0] = p
    G.fond(d, t)
    SCENES[cle](d, p, t)
